const BACKEND = "http://127.0.0.1:8001";
let timer       = null;
let currentUser = null;

async function takeScreenshotAndSend() {
  if (!currentUser) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.includes("/stories/")) return;

  chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 85 }, async (dataUrl) => {
    if (chrome.runtime.lastError || !dataUrl) return;

    const blob = await (await fetch(dataUrl)).blob();
    const form = new FormData();
    form.append("frame",    blob, "story.jpg");
    form.append("username", currentUser);

    try {
      const res  = await fetch(`${BACKEND}/analyse`, { method: "POST", body: form });
      const data = await res.json();
      console.log("[Delli.cate bg]", data);

      // Send result to popup
      chrome.runtime.sendMessage({ type: "POPUP_UPDATE", data }).catch(() => {});

      if (data.saved) {
        chrome.action.setBadgeText({ text: "✓" });
        chrome.action.setBadgeBackgroundColor({ color: "#00ff87" });
        setTimeout(() => chrome.action.setBadgeText({ text: "ON" }), 2000);
      }
    } catch (err) {
      console.error("[Delli.cate bg] backend error:", err);
    }
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "STORY_OPEN") {
    currentUser = msg.username;
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#00ff87" });
    if (!timer) {
      takeScreenshotAndSend();
      timer = setInterval(takeScreenshotAndSend, 8000);
    }
  }
  if (msg.type === "STORY_CLOSED") {
    currentUser = null;
    if (timer) { clearInterval(timer); timer = null; }
    chrome.action.setBadgeText({ text: "" });
    chrome.runtime.sendMessage({ type: "STORY_CLOSED" }).catch(() => {});
  }
});
