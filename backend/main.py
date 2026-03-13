import io
import os
import re
import json
import tempfile
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware

from PIL import Image
import numpy as np
import easyocr
import whisper
import google.generativeai as genai

# Optional Supabase
from supabase import create_client, Client


# ─────────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────────

app = FastAPI(title="Delli.cate API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins + ["chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# Env / clients
# ─────────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")  # fallback if old env name still exists
WHISPER_MODEL_NAME = os.getenv("WHISPER_MODEL", "tiny")  # tiny = faster for hackathon

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Load once
_OCR_READER = None
_WHISPER_MODEL = whisper.load_model(WHISPER_MODEL_NAME)


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def get_ocr_reader():
    global _OCR_READER
    if _OCR_READER is None:
        _OCR_READER = easyocr.Reader(["en"], gpu=False)
    return _OCR_READER


def extract_text_from_frame(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_array = np.array(image)
    reader = get_ocr_reader()
    results = reader.readtext(img_array)
    text = " ".join([r[1] for r in results])
    return text.strip()


def transcribe_file_bytes(filename: str, data: bytes) -> str:
    suffix = os.path.splitext(filename)[1] or ".tmp"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        result = _WHISPER_MODEL.transcribe(tmp_path)
        return (result.get("text") or "").strip()
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


UI_NOISE_PATTERNS = [
    r"^(learn more|reply to|ad\b|sponsored|see more|swipe up|tap to|click to|watch more|shop now)$",
    r"^[a-z0-9_.]+\s+(ad|sponsored)\s*[\|•·]",
    r"^(message|send|share|like|comment|follow|following|followers)$",
    r"^\d+[smhd]\s*$",
    r"^(story|stories|highlights?)$",
]
_NOISE_RE = [re.compile(p, re.IGNORECASE) for p in UI_NOISE_PATTERNS]


def is_ui_noise(text: str) -> tuple[bool, str]:
    stripped = text.strip()

    for pattern in _NOISE_RE:
        if pattern.search(stripped):
            return True, "matched UI noise pattern"

    words = re.findall(r"[a-zA-Z']+", stripped)
    if not words:
        return True, "no alphabetic content"

    return False, ""


KNOWN_FLAGS = [
    "distress_language",
    "self_harm_indicators",
    "suicidal_ideation",
    "abuse_indicators",
    "isolation",
    "crisis_language",
    "substance_use",
    "dangerous_situation",
    "eating_disorder_indicators",
    "mental_health_crisis",
    "relationship_abuse",
    "family_conflict",
    "cyberbullying",
    "hopelessness",
    "recurring_distress",
]

DISTRESS_PROMPT = """
You are a youth welfare analyst reviewing text from a young person's Instagram story.
The text may come from OCR or speech-to-text.

Assess the urgency using these dimensions:
1. Emotional Intensity (0-100)
2. Persistence (0-100)
3. Functional Impact (0-100)

Return ONLY valid JSON with:
- emotional_intensity
- persistence
- functional_impact
- urgency_score
- urgency_label (low/moderate/high/critical)
- flags (list)
- summary

Score bands:
0-24 = low
25-44 = moderate
45-64 = high
65-100 = critical

Text:
{text}
"""


def clamp(score) -> int:
    try:
        return max(0, min(100, int(score)))
    except Exception:
        return 0


def label_from_score(score: int) -> str:
    if score >= 65:
        return "critical"
    elif score >= 45:
        return "high"
    elif score >= 25:
        return "moderate"
    return "low"


def score_content(text: str) -> dict:
    if not GEMINI_API_KEY:
        return {
            "risk_score": None,
            "risk_label": "unscored",
            "emotional_intensity": None,
            "persistence": None,
            "functional_impact": None,
            "flags": [],
            "summary": "No Gemini API key configured."
        }

    if not text or not text.strip():
        return {
            "risk_score": 0,
            "risk_label": "low",
            "emotional_intensity": 0,
            "persistence": 0,
            "functional_impact": 0,
            "flags": [],
            "summary": "No text to analyse."
        }

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = DISTRESS_PROMPT.format(text=text[:4000])
        response = model.generate_content(prompt)
        response_text = (response.text or "").strip()
        clean = re.sub(r"```json|```", "", response_text).strip()
        parsed = json.loads(clean)

        ei = clamp(parsed.get("emotional_intensity", 0))
        per = clamp(parsed.get("persistence", 0))
        fi = clamp(parsed.get("functional_impact", 0))
        score = clamp(round((ei + per + fi) / 3))
        label = label_from_score(score)

        return {
            "risk_score": score,
            "risk_label": label,
            "emotional_intensity": ei,
            "persistence": per,
            "functional_impact": fi,
            "flags": parsed.get("flags", []),
            "summary": parsed.get("summary", ""),
        }
    except Exception as e:
        print(f"[risk_scoring] error: {e}")
        return {
            "risk_score": None,
            "risk_label": "unscored",
            "emotional_intensity": None,
            "persistence": None,
            "functional_impact": None,
            "flags": [],
            "summary": f"Scoring unavailable: {str(e)}"
        }


def save_ocr_result(
    youth_id: str,
    text: str,
    source_url: Optional[str] = None,
    score_result: Optional[dict] = None
):
    if not supabase:
        return None

    payload = {
        "youth_id": youth_id,
        "content_type": "story_ocr",
        "raw_text": text,
        "source_url": source_url,
        "language": "en",
    }

    if score_result:
        payload.update({
            "llm_summary": score_result.get("summary"),
            "flags": score_result.get("flags"),
            "urgency_score": score_result.get("risk_score"),
            "urgency_label": score_result.get("risk_label"),
            "emotional_intensity": score_result.get("emotional_intensity"),
            "persistence": score_result.get("persistence"),
            "functional_impact": score_result.get("functional_impact"),
        })

    return supabase.table("extracted_content").insert(payload).execute()


# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"ok": True, "message": "Delli.cate backend running"}

@app.get("/health")
def health():
    return {"ok": True}


@app.post("/analyse")
async def analyse_frame(
    frame: UploadFile = File(...),
    youth_id: str = Form(""),
    source_url: Optional[str] = Form(None),
):
    """
    OCR endpoint:
    frame image -> OCR text -> optional Gemini scoring -> optional Supabase save
    """
    if not youth_id:
        raise HTTPException(status_code=400, detail="youth_id is required")

    image_bytes = await frame.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty frame")

    text = extract_text_from_frame(image_bytes)

    if not text or len(text.strip()) < 2:
        return {"text": "", "saved": False, "reason": "no text detected"}

    is_noise, reason = is_ui_noise(text)
    if is_noise:
        return {"text": text, "saved": False, "reason": f"ui noise: {reason}"}

    score_result = score_content(text)
    save_ocr_result(youth_id, text, source_url=source_url, score_result=score_result)

    print(f"[ocr] analysed for youth {youth_id}: {text[:60]!r}")
    return {
        "text": text,
        "saved": True,
        "score": score_result,
    }


@app.post("/transcribe/audio")
async def transcribe_audio(
    file: UploadFile = File(...),
    youth_id: str = Form(""),
    session_id: Optional[str] = Form(None),
):
    """
    Audio endpoint:
    audio -> Whisper -> return transcript only
    Does NOT save transcript to DB.
    """
    print("[transcribe/audio] hit")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    data = await file.read()
    print("[transcribe/audio] filename:", file.filename)
    print("[transcribe/audio] size:", len(data))

    if not data:
        raise HTTPException(status_code=400, detail="Empty audio upload")

    text = transcribe_file_bytes(file.filename, data)
    print("[transcribe/audio] transcript:", text[:120] if text else "")

    if not text or len(text.strip()) < 2:
        return {
            "text": "",
            "saved": False,
            "reason": "no speech detected",
            "youth_id": youth_id or None,
            "session_id": session_id,
        }

    return {
        "text": text,
        "saved": False,
        "youth_id": youth_id or None,
        "session_id": session_id,
    }