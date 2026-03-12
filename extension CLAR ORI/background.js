// background.js — service worker
// Only captures when Instagram stories tab is the active tab.

const API_BASE = "http://127.0.0.1:8001";
let monitoringActive = false;
let ocrInterval = null;
let offscreenCreated = false;
let activeInstagramTabId = null;
let currentYouthId = null;
let currentSessionId = null;

// ── Inject content script ─────────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("instagram.com")) {
    chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }).catch(() => {});
  }
});

chrome.tabs.query({ url: "https://www.instagram.com/*" }, (tabs) => {
  tabs.forEach(tab => {
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }).catch(() => {});
  });
});

// ── Pause OCR when user switches away from Instagram ──────────

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (!tab.url?.includes("instagram.com/stories")) {
      // User switched away — pause OCR
      if (ocrInterval) {
        stopOCR();
        console.log("[bg] paused OCR — not on Instagram stories");
      }
    } else if (monitoringActive && currentYouthId) {
      // User came back to Instagram stories — resume OCR
      startOCR(tabId, currentYouthId, currentSessionId);
      console.log("[bg] resumed OCR — back on Instagram stories");
    }
  });
});

// ── Offscreen document ────────────────────────────────────────

async function ensureOffscreen() {
  if (offscreenCreated) return;
  try {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Capture tab audio for transcription"
    });
    offscreenCreated = true;
  } catch (e) {
    offscreenCreated = true;
  }
}

// ── Message handler ───────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === "START_CAPTURE") {
    monitoringActive = true;
    activeInstagramTabId = sender.tab?.id;
    currentYouthId = msg.youthId;
    currentSessionId = msg.sessionId;

    // Only start OCR if this is the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.url?.includes("instagram.com/stories")) {
        startOCR(activeTab.id, msg.youthId, msg.sessionId);
      }
    });

    // Start audio via offscreen
    ensureOffscreen().then(() => {
      chrome.runtime.sendMessage({
        type: "START_AUDIO_CAPTURE",
        youthId: msg.youthId,
        sessionId: msg.sessionId
      }).catch(() => {});
    });

    sendResponse({ ok: true });
  }

  if (msg.type === "STOP_CAPTURE") {
    monitoringActive = false;
    currentYouthId = null;
    currentSessionId = null;
    stopOCR();
    chrome.runtime.sendMessage({ type: "STOP_AUDIO_CAPTURE" }).catch(() => {});
    sendResponse({ ok: true });
  }

  if (msg.type === "MONITORING_ACTIVE") {
    monitoringActive = msg.active;
    chrome.action.setBadgeText({ text: msg.active ? "ON" : "" });
    chrome.action.setBadgeBackgroundColor({ color: msg.active ? "#22c55e" : "#6b7280" });
  }

  if (msg.type === "STORY_SAVED") {
    console.log("[bg] saved:", msg.text?.substring(0, 60));
  }

  if (msg.type === "GET_MONITORING_STATUS") {
    sendResponse({ active: monitoringActive });
  }

  return true;
});

// ── OCR — only runs when Instagram stories is active tab ──────

function startOCR(tabId, youthId, sessionId) {
  stopOCR();

  ocrInterval = setInterval(async () => {
    if (!monitoringActive) return;

    // Double check we're still on Instagram stories
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.url?.includes("instagram.com/stories")) return;

      chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 70 }, async (dataUrl) => {
        if (chrome.runtime.lastError || !dataUrl) return;

        const res = await fetch(dataUrl);
        const blob = await res.blob();

        const formData = new FormData();
        formData.append("frame", blob, "frame.jpg");
        formData.append("youth_id", youthId);
        if (sessionId) formData.append("session_id", sessionId);

        try {
          const ocrRes = await fetch(`${API_BASE}/ocr/frame`, { method: "POST", body: formData });
          const data = await ocrRes.json();
          if (data.saved) console.log("[bg] OCR saved:", data.text?.substring(0, 60));
        } catch (err) {
          console.error("[bg] OCR error:", err);
        }
      });
    });
  }, 15000); // every 15 seconds — conserves Gemini quota

  console.log("[bg] OCR started");
}

function stopOCR() {
  if (ocrInterval) { clearInterval(ocrInterval); ocrInterval = null; }
}