// content.js — Delli.cate
if (window.__dellicateLoaded) {
} else {
window.__dellicateLoaded = true;

const SUPABASE_URL = "https://niphfyzxetrhwgeshrib.supabase.co";
const SUPABASE_KEY = "sb_publishable_HBqDHJpbz1jteNp27IreVg_QLdPvgIl";
const GEMINI_KEY   = "AIzaSyB6QMvNFD-N9yJCaSWrG3G0CrOT1gG2-ww";

const SB_HEADERS = {
  "Content-Type":  "application/json",
  "apikey":        SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

let scanTimer    = null;
let urlObserver  = null;
let lastText     = "";
let lastUsername = null;

// ── Scrape all text nodes ─────────────────────────────────────
function scrapeStoryText() {
  const seen  = new Set();
  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent?.trim();
    if (!t || t.length < 2 || seen.has(t)) continue;
    seen.add(t);
    texts.push(t);
  }
  return texts.join(" ").replace(/\s+/g, " ").trim();
}

// ── Supabase ──────────────────────────────────────────────────
async function getCaseId(username) {
  const res  = await fetch(
    `${SUPABASE_URL}/rest/v1/social_media_accounts?platform=eq.instagram&username=eq.${encodeURIComponent(username)}&select=case_id`,
    { headers: SB_HEADERS }
  );
  const rows = await res.json();
  return rows?.[0]?.case_id ?? null;
}

async function saveStory(username, caseId, text, a) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/instagram_stories_content`, {
    method:  "POST",
    headers: { ...SB_HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify({
      instagram_username:  username,
      case_id:             caseId,
      ocr_text:            text,
      distress_score:      a.distress_score,
      emotional_intensity: a.emotional_intensity,
      is_concerning:       a.is_concerning,
      gemini_summary:      a.summary,
      captured_at:         new Date().toISOString(),
    }),
  });
  return res.ok;
}

async function bumpCase(caseId, score) {
  const risk = score >= 65 ? "critical" : score >= 45 ? "high" : score >= 25 ? "medium" : "low";
  await fetch(`${SUPABASE_URL}/rest/v1/cases?id=eq.${caseId}`, {
    method:  "PATCH",
    headers: { ...SB_HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify({ distress_score: score, risk_level: risk }),
  });
}

// ── Gemini ────────────────────────────────────────────────────
async function analyse(text, username) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text:
        `Child welfare AI. Analyse this Instagram story text from @${username} for distress, self-harm, suicidal ideation, bullying, or crisis.
Story text: "${text}"
Reply ONLY valid JSON: {"distress_score":<0-100>,"emotional_intensity":<0-100>,"is_concerning":<bool>,"summary":"<1-2 sentences>"}
If harmless, distress_score:0.`
      }] }] }),
    }
  );
  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
  catch { return { distress_score: 0, emotional_intensity: 0, is_concerning: false, summary: "" }; }
}

// ── Scan ──────────────────────────────────────────────────────
async function scan() {
  const username = window.location.pathname.match(/\/stories\/([^/]+)/)?.[1];
  if (!username) return;

  if (username !== lastUsername) { lastUsername = username; lastText = ""; }

  const text = scrapeStoryText();
  console.log(`[Delli.cate] scraped (${text.length} chars): "${text.slice(0, 200)}"`);

  if (!text || text === lastText) return;
  lastText = text;

  const caseId = await getCaseId(username);
  if (!caseId) { console.log(`[Delli.cate] @${username} not monitored`); return; }

  const a = await analyse(text, username);
  console.log("[Delli.cate] analysis:", a);

  const ok = await saveStory(username, caseId, text, a);
  console.log(ok ? `[Delli.cate] ✅ saved distress=${a.distress_score}` : "[Delli.cate] ❌ save failed");
  if (ok && a.is_concerning) await bumpCase(caseId, a.distress_score);
}

// ── Watch ─────────────────────────────────────────────────────
function startWatching() {
  if (scanTimer) return;
  console.log("[Delli.cate] watching...");
  scan();
  scanTimer = setInterval(scan, 6000);
}

function stopWatching() {
  clearInterval(scanTimer); scanTimer = null;
  lastText = ""; lastUsername = null;
  console.log("[Delli.cate] stopped");
}

let lastUrl = location.href;
urlObserver = new MutationObserver(() => {
  if (location.href === lastUrl) return;
  lastUrl = location.href;
  if (location.pathname.includes("/stories/")) startWatching();
  else stopWatching();
});
urlObserver.observe(document.body, { childList: true, subtree: true });

if (location.pathname.includes("/stories/")) startWatching();
}
