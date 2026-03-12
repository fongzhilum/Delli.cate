"""
scanner.py
Run this on your laptop while browsing Instagram stories.
It captures the screen, sends to Gemini Vision, saves to Supabase.

Run with: python scanner.py
"""

import base64
import json
import time
import requests
import mss
import mss.tools
from PIL import Image
import io
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

# ── 🔑 REPLACE THESE ─────────────────────────────────────────
SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
SUPABASE_KEY = 'YOUR_ANON_KEY'
GEMINI_KEY   = 'YOUR_GEMINI_API_KEY'
# ─────────────────────────────────────────────────────────────

SUPABASE_HEADERS = {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Prefer':        'return=representation',
}

# ── Screenshot ────────────────────────────────────────────────

def capture_screen():
    """Capture the full screen and return as base64 PNG string."""
    with mss.mss() as sct:
        # Capture the primary monitor
        monitor = sct.monitors[1]
        screenshot = sct.grab(monitor)

        # Convert to PIL Image and resize to save API costs
        img = Image.frombytes('RGB', screenshot.size, screenshot.bgra, 'raw', 'BGRX')
        img = img.resize((1280, 720), Image.LANCZOS)

        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

# ── Gemini Vision ─────────────────────────────────────────────

def analyse_with_gemini(base64_image, username):
    """Send screenshot to Gemini Vision for distress analysis."""
    prompt = f"""
You are a child welfare AI assistant helping social workers identify at-risk youth.

Look at this screenshot of an Instagram story posted by @{username}.
Read ALL visible text in the image carefully.
Evaluate the content for signs of emotional distress, mental health struggles,
self-harm ideation, suicidal thoughts, cyberbullying, social isolation, or other concerning content.

Respond ONLY with a valid JSON object (no markdown, no extra text):
{{
  "ocr_text": "<all text you can read from the image>",
  "distress_score": <integer 0-100, where 0=no distress, 100=extreme crisis>,
  "emotional_intensity": <integer 0-100, how emotionally charged the content is>,
  "is_concerning": <true if distress_score >= 40, false otherwise>,
  "summary": "<1-2 sentence explanation of your assessment>"
}}

If the image has no text or is just a normal photo with no distress signals, return distress_score: 0.
"""

    payload = {
        'contents': [{
            'parts': [
                {
                    'inline_data': {
                        'mime_type': 'image/png',
                        'data':      base64_image,
                    }
                },
                { 'text': prompt }
            ]
        }],
        'generationConfig': {
            'temperature':     0.1,
            'maxOutputTokens': 400,
        }
    }

    res = requests.post(
        f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}',
        headers={ 'Content-Type': 'application/json' },
        json=payload
    )

    if not res.ok:
        print(f'[Delli.cate] Gemini error: {res.text}')
        return None

    data = res.json()
    raw  = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '{}')

    try:
        clean = raw.replace('```json', '').replace('```', '').strip()
        return json.loads(clean)
    except Exception as e:
        print(f'[Delli.cate] JSON parse error: {e} | raw: {raw}')
        return None

# ── Supabase ──────────────────────────────────────────────────

def find_case_id(username):
    """Look up case_id from social_media_accounts by instagram username."""
    res = requests.get(
        f'{SUPABASE_URL}/rest/v1/social_media_accounts'
        f'?platform=eq.instagram&username=eq.{username}&select=case_id',
        headers=SUPABASE_HEADERS
    )
    rows = res.json()
    return rows[0]['case_id'] if rows else None

def save_story(username, case_id, analysis, captured_at):
    """Save story analysis to instagram_stories_content table."""
    res = requests.post(
        f'{SUPABASE_URL}/rest/v1/instagram_stories_content',
        headers=SUPABASE_HEADERS,
        json={
            'instagram_username':  username,
            'case_id':             case_id,
            'ocr_text':            analysis.get('ocr_text', ''),
            'emotional_intensity': analysis.get('emotional_intensity', 0),
            'distress_score':      analysis.get('distress_score', 0),
            'is_concerning':       analysis.get('is_concerning', False),
            'gemini_summary':      analysis.get('summary', ''),
            'captured_at':         captured_at,
        }
    )
    return res.ok

def bump_case_risk(case_id, distress_score):
    """Update case risk level based on distress score."""
    if   distress_score >= 65: risk = 'critical'
    elif distress_score >= 45: risk = 'high'
    elif distress_score >= 25: risk = 'medium'
    else:                      risk = 'low'

    requests.patch(
        f'{SUPABASE_URL}/rest/v1/cases?id=eq.{case_id}',
        headers=SUPABASE_HEADERS,
        json={ 'distress_score': distress_score, 'risk_level': risk }
    )

def update_last_checked(case_id):
    requests.patch(
        f'{SUPABASE_URL}/rest/v1/social_media_accounts?case_id=eq.{case_id}&platform=eq.instagram',
        headers=SUPABASE_HEADERS,
        json={ 'last_checked': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()) }
    )

# ── Main process ──────────────────────────────────────────────

def process_story(username):
    """Full pipeline: screenshot → Gemini → Supabase."""
    print(f'\n[Delli.cate] Processing story for @{username}...')

    # 1. Check if monitored
    case_id = find_case_id(username)
    if not case_id:
        print(f'[Delli.cate] @{username} not in DB — skipping')
        return

    # 2. Screenshot
    print('[Delli.cate] Capturing screen...')
    screenshot = capture_screen()

    # 3. Gemini analysis
    print('[Delli.cate] Analysing with Gemini...')
    analysis = analyse_with_gemini(screenshot, username)
    if not analysis:
        print('[Delli.cate] Analysis failed')
        return

    print(f'[Delli.cate] Result: distress={analysis["distress_score"]} concerning={analysis["is_concerning"]}')
    print(f'[Delli.cate] Text: {analysis.get("ocr_text", "")[:100]}')

    # 4. Save
    captured_at = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    saved = save_story(username, case_id, analysis, captured_at)
    if not saved:
        print('[Delli.cate] Save failed')
        return

    # 5. Update risk
    if analysis['is_concerning']:
        bump_case_risk(case_id, analysis['distress_score'])
        print(f'[Delli.cate] ⚠️  Case risk updated!')

    update_last_checked(case_id)
    print(f'[Delli.cate] ✅ Done for @{username}')

# ── HTTP Server (receives triggers from Chrome extension) ─────

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/scan':
            length = int(self.headers.get('Content-Length', 0))
            body   = json.loads(self.rfile.read(length))
            username = body.get('username')

            # Process in background thread so HTTP response isn't blocked
            threading.Thread(target=process_story, args=(username,), daemon=True).start()

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"ok": true}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        pass  # silence default HTTP logs

if __name__ == '__main__':
    PORT = 7842
    server = HTTPServer(('localhost', PORT), Handler)
    print(f'[Delli.cate] 🚀 Scanner running on http://localhost:{PORT}')
    print(f'[Delli.cate] Open Instagram stories and the extension will trigger scans automatically')
    print(f'[Delli.cate] Press Ctrl+C to stop\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[Delli.cate] Stopped.')
