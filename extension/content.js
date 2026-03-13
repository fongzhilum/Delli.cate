// content.js
// Watches for Instagram story URLs and notifies background.js

if (window.__dellicateLoaded) {
  // already running, skip
} else {
  window.__dellicateLoaded = true;
  console.log("[Delli.cate] loaded");

  let lastUrl      = location.href;
  let lastUsername = null;

  function getUsername() {
    return window.location.pathname.match(/\/stories\/([^/]+)/)?.[1] ?? null;
  }

  function notifyOpen() {
    const username = getUsername();
    if (!username || username === lastUsername) return;
    lastUsername = username;
    console.log("[Delli.cate] story opened:", username);
    chrome.runtime.sendMessage({ type: "STORY_OPEN", username });
  }

  function notifyClose() {
    if (!lastUsername) return;
    lastUsername = null;
    chrome.runtime.sendMessage({ type: "STORY_CLOSED" });
  }

  // Watch for SPA navigation (Instagram doesn't reload the page)
  new MutationObserver(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    if (location.pathname.includes("/stories/")) notifyOpen();
    else notifyClose();
  }).observe(document.body, { childList: true, subtree: true });

  // Check immediately on load
  if (location.pathname.includes("/stories/")) notifyOpen();
}
