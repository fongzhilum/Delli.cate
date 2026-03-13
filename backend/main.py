import os
import json
import re
import numpy as np
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image
import io

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from supabase import create_client
import easyocr

load_dotenv(Path(__file__).parent / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL   = os.getenv("SUPABASE_URL")
SUPABASE_KEY   = os.getenv("SUPABASE_KEY")

print(f"[startup] SUPABASE_URL={'set' if SUPABASE_URL else 'MISSING'}")
print(f"[startup] GEMINI_API_KEY={'set' if GEMINI_API_KEY else 'MISSING'}")

app = FastAPI(title="Delli.cate Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_gemini   = genai.Client(api_key=GEMINI_API_KEY)
_supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load EasyOCR once at startup
print("[startup] Loading EasyOCR...")
_ocr = easyocr.Reader(["en"], gpu=False)
print("[startup] EasyOCR ready")

# ── Instagram UI noise to filter out ─────────────────────────
NOISE = re.compile(
    r"^(home|reels?|messages?|search|explore|notifications?|create|profile|"
    r"settings?|more|following|followers|posts?|share|reply|like|comment|"
    r"send|close|mute|next|back|sponsored|learn more|swipe up|shop now|"
    r"also from meta|instagram from meta|instagram|\d+[smhd]?|menu|"
    r"quick reactions|direct|tagged|carousel|clip|highlights?)$",
    re.IGNORECASE
)

def extract_text(image_bytes: bytes) -> str:
    image  = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr    = np.array(image)
    results = _ocr.readtext(arr)
    # Filter out Instagram UI noise, keep real text
    words = []
    for (_, text, confidence) in results:
        t = text.strip()
        if confidence < 0.3:       continue  # low confidence
        if not t:                  continue
        if NOISE.match(t):         continue  # Instagram UI
        if t.startswith("{"):      continue  # JSON blobs
        if len(t) < 2:             continue
        words.append(t)
    return " ".join(words).strip()

# ── Gemini text scoring (text only, not image) ────────────────
PROMPT = """Analyse this Instagram story text for youth distress signals.

Text: "{text}"

Reply ONLY with valid JSON:
{{
  "distress_score": <0-100>,
  "emotional_intensity": <0-100>,
  "is_concerning": <true or false>,
  "summary": "<1 sentence>"
}}"""

def score_text(text: str, username: str) -> dict:
    try:
        response = _gemini.models.generate_content(
            model="gemini-2.5-flash",
            contents=PROMPT.format(username=username, text=text[:1000])
        )
        raw = re.sub(r"```json|```", "", response.text).strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[Gemini] error: {e}")
        return {"distress_score": 0, "emotional_intensity": 0, "is_concerning": False, "summary": str(e)}

def risk_label(score: int) -> str:
    if score >= 65: return "critical"
    if score >= 45: return "high"
    if score >= 25: return "medium"
    return "low"

# ── Routes ────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/analyse")
async def analyse(frame: UploadFile = File(...), username: str = Form(...)):
    image_bytes = await frame.read()
    if not image_bytes:
        raise HTTPException(400, "Empty frame")

    # Step 1: OCR
    text = extract_text(image_bytes)
    del image_bytes
    print(f"[analyse] @{username} OCR: {text[:100]!r}")

    if not text:
        return {"saved": False, "reason": "no text found by OCR", "text": ""}

    # Step 2: Score with Gemini (text only)
    score  = score_text(text, username)
    label  = risk_label(score["distress_score"])
    print(f"[analyse] @{username} distress={score['distress_score']} label={label}")

    # Step 3: Look up case
    resp = _supabase.table("social_media_accounts") \
                    .select("case_id") \
                    .eq("platform", "instagram") \
                    .eq("username", username) \
                    .execute()

    if not resp.data:
        return {"saved": False, "reason": "username not monitored", "text": text}

    case_id = resp.data[0]["case_id"]

    # Step 4: Save
    _supabase.table("instagram_stories_content").insert({
        "instagram_username":  username,
        "case_id":             case_id,
        "ocr_text":            text,
        "distress_score":      score["distress_score"],
        "emotional_intensity": score.get("emotional_intensity", 0),
        "is_concerning":       score.get("is_concerning", False),
        "gemini_summary":      score.get("summary", ""),
        "captured_at":         datetime.now(timezone.utc).isoformat(),
    }).execute()

    if score.get("is_concerning"):
        _supabase.table("cases").update({
            "distress_score": score["distress_score"],
            "risk_level":     label,
        }).eq("id", case_id).execute()

    return {
        "saved":          True,
        "text":           text,
        "distress_score": score["distress_score"],
        "risk_label":     label,
        "is_concerning":  score.get("is_concerning", False),
        "summary":        score.get("summary", ""),
    }