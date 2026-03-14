// content.js
if (window.__dellicateLoaded) {
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
    if (!username) return;
    lastUsername = username;
    console.log("[Delli.cate] story opened:", username, location.href);
    chrome.runtime.sendMessage({ type: "STORY_OPEN", username });
  }

  function notifyClose() {
    if (!lastUsername) return;
    lastUsername = null;
    chrome.runtime.sendMessage({ type: "STORY_CLOSED" });
  }

  // Watch for ANY URL change including same username different story
  new MutationObserver(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    if (location.pathname.includes("/stories/")) notifyOpen();
    else notifyClose();
  }).observe(document.body, { childList: true, subtree: true });

  // Check immediately on load
  if (location.pathname.includes("/stories/")) notifyOpen();
}