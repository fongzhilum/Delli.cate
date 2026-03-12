/**
 * background.js
 * Service worker for Delli.cate Story Scanner.
 *
 * Uses chrome.tabs.captureVisibleTab to screenshot (bypasses Instagram CSP),
 * then sends the image directly to Gemini Vision for analysis.
 * No Tesseract needed.
 */

// ── 🔑 REPLACE THESE ─────────────────────────────────────────
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';
const GEMINI_KEY   = 'YOUR_GEMINI_API_KEY';
// ─────────────────────────────────────────────────────────────

const SUPABASE_HEADERS = {
  'Content-Type':  'application/json',
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer':        'return=representation',
};

// ── Screenshot ────────────────────────────────────────────────

/**
 * Capture the visible tab as base64 PNG.
 * This runs in the background so Instagram's CSP cannot block it.
 */
async function captureTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 80 }, (dataUrl) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(dataUrl); // data:image/png;base64,...
    });
  });
}

// ── Gemini Vision ─────────────────────────────────────────────

/**
 * Send screenshot directly to Gemini Vision.
 * Gemini reads the image, extracts text, and scores emotional distress.
 */
async function analyseWithGemini(base64Image, username) {
  // Strip the data:image/png;base64, prefix
  const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `
You are a child welfare AI assistant helping social workers identify at-risk youth.

Look at this screenshot of an Instagram story posted by @${username}.
Read ALL visible text in the image carefully.
Evaluate the content for signs of emotional distress, mental health struggles,
self-harm ideation, suicidal thoughts, cyberbullying, social isolation, or other concerning content.

Respond ONLY with a valid JSON object (no markdown, no extra text):
{
  "ocr_text": "<all text you can read from the image>",
  "distress_score": <integer 0-100, where 0=no distress, 100=extreme crisis>,
  "emotional_intensity": <integer 0-100, how emotionally charged the content is>,
  "is_concerning": <true if distress_score >= 40, false otherwise>,
  "summary": "<1-2 sentence explanation of your assessment>"
}

If the image has no text or is just a normal photo/video with no distress signals, return distress_score: 0.
`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: 'image/png',
                data:      imageData,
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature:     0.1,
          maxOutputTokens: 400,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('[Delli.cate] Gemini error:', err);
    return { ocr_text: '', distress_score: 0, emotional_intensity: 0, is_concerning: false, summary: 'Analysis failed.' };
  }

  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    console.error('[Delli.cate] Failed to parse Gemini JSON:', raw);
    return { ocr_text: raw, distress_score: 0, emotional_intensity: 0, is_concerning: false, summary: raw };
  }
}

// ── Supabase ──────────────────────────────────────────────────

async function findCaseId(username) {
  const url = `${SUPABASE_URL}/rest/v1/social_media_accounts`
    + `?platform=eq.instagram`
    + `&username=eq.${encodeURIComponent(username)}`
    + `&select=case_id`;
  const res  = await fetch(url, { headers: SUPABASE_HEADERS });
  const rows = await res.json();
  return rows[0]?.case_id ?? null;
}

async function saveStory({ username, caseId, analysis, capturedAt }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/instagram_stories_content`, {
    method:  'POST',
    headers: SUPABASE_HEADERS,
    body: JSON.stringify({
      instagram_username:  username,
      case_id:             caseId,
      ocr_text:            analysis.ocr_text,
      emotional_intensity: analysis.emotional_intensity,
      distress_score:      analysis.distress_score,
      is_concerning:       analysis.is_concerning,
      gemini_summary:      analysis.summary,
      captured_at:         capturedAt,
    }),
  });
  if (!res.ok) {
    console.error('[Delli.cate] Save failed:', await res.text());
    return false;
  }
  return true;
}

async function bumpCaseRisk(caseId, distressScore) {
  const riskLevel =
    distressScore >= 65 ? 'critical'
    : distressScore >= 45 ? 'high'
    : distressScore >= 25 ? 'medium'
    : 'low';
  await fetch(`${SUPABASE_URL}/rest/v1/cases?id=eq.${caseId}`, {
    method:  'PATCH',
    headers: SUPABASE_HEADERS,
    body: JSON.stringify({ distress_score: distressScore, risk_level: riskLevel }),
  });
}

async function updateLastChecked(caseId) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/social_media_accounts?case_id=eq.${caseId}&platform=eq.instagram`,
    {
      method:  'PATCH',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({ last_checked: new Date().toISOString() }),
    }
  );
}

// ── Message handler ───────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'CAPTURE_STORY') return;

  (async () => {
    const { username, capturedAt } = msg;
    console.log(`[Delli.cate] Capturing story for @${username}`);

    // 1. Check if username is monitored
    const caseId = await findCaseId(username);
    if (!caseId) {
      console.warn(`[Delli.cate] @${username} not monitored — skipping`);
      sendResponse({ ok: false, reason: 'not_monitored' });
      return;
    }

    // 2. Screenshot the tab (bypasses Instagram CSP)
    let screenshot;
    try {
      screenshot = await captureTab(sender.tab?.id);
    } catch (err) {
      console.error('[Delli.cate] Screenshot failed:', err);
      sendResponse({ ok: false, reason: 'screenshot_failed' });
      return;
    }

    // 3. Gemini Vision analysis
    const analysis = await analyseWithGemini(screenshot, username);
    console.log('[Delli.cate] Gemini result:', analysis);

    // 4. Save to Supabase
    const saved = await saveStory({ username, caseId, analysis, capturedAt });
    if (!saved) { sendResponse({ ok: false, reason: 'save_failed' }); return; }

    // 5. Update case risk if concerning
    if (analysis.is_concerning) await bumpCaseRisk(caseId, analysis.distress_score);

    // 6. Update last checked
    await updateLastChecked(caseId);

    console.log(`[Delli.cate] ✅ Done for @${username} — distress: ${analysis.distress_score}`);
    sendResponse({ ok: true, analysis });
  })();

  return true;
});
