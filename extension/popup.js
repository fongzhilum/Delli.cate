const pill         = document.getElementById("pill");
const statusText   = document.getElementById("statusText");
const captureCount = document.getElementById("captureCount");
const lastScore    = document.getElementById("lastScore");
const riskBadge    = document.getElementById("riskBadge");
const captureText  = document.getElementById("captureText");
const scoreNum     = document.getElementById("scoreNum");
const barFill      = document.getElementById("barFill");
const nextCapture  = document.getElementById("nextCapture");

let count = 0;

function setActive(username) {
  pill.className = "pill active";
  statusText.textContent = `@${username}`;
}

function updateScore(data) {
  count++;
  captureCount.textContent = count;

  const score = data.distress_score ?? 0;
  const label = (data.risk_label ?? "low").toLowerCase();

  lastScore.textContent = score + "%";

  // Risk badge
  riskBadge.textContent  = label.toUpperCase();
  riskBadge.className    = "risk-badge";
  if (label === "critical") riskBadge.className += " critical";
  else if (label === "high") riskBadge.className += " high";
  else if (label === "medium") riskBadge.className += " medium";

  // Text preview
  if (data.text) {
    captureText.textContent = data.text.slice(0, 90) + (data.text.length > 90 ? "…" : "");
    captureText.className   = "capture-text has-data";
  }

  // Bar
  scoreNum.textContent = `${score} / 100`;
  barFill.style.width  = `${score}%`;
  barFill.className    = "bar-fill";
  if (label === "critical") barFill.className += " critical";
  else if (label === "high") barFill.className += " high";
  else if (label === "medium") barFill.className += " medium";
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const m = tab?.url?.match(/\/stories\/([^/]+)/);
  if (m) setActive(m[1]);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "POPUP_UPDATE") updateScore(msg.data);
  if (msg.type === "STORY_CLOSED") {
    pill.className = "pill";
    statusText.textContent = "Waiting for story...";
  }
});

let seconds = 8;
setInterval(() => {
  nextCapture.textContent = `next in ${seconds}s`;
  seconds = seconds <= 1 ? 8 : seconds - 1;
}, 1000);