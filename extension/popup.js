/**
 * popup.js
 * Updates the popup UI with live scan stats stored in chrome.storage.local
 */

async function updateUI() {
  const data = await chrome.storage.local.get(['storiesCount', 'flaggedCount', 'lastScan', 'isOnStories']);

  const storiesCount = data.storiesCount ?? 0;
  const flaggedCount = data.flaggedCount ?? 0;
  const lastScan     = data.lastScan     ?? null;
  const isOnStories  = data.isOnStories  ?? false;

  document.getElementById('storiesCount').textContent = storiesCount;
  document.getElementById('flaggedCount').textContent = flaggedCount;

  const dot   = document.getElementById('statusDot');
  const label = document.getElementById('statusLabel');
  const sub   = document.getElementById('statusSub');

  if (isOnStories) {
    dot.className   = 'status-dot active';
    label.textContent = 'Scanning Stories';
    sub.textContent   = 'Capturing and analysing content';
  } else {
    dot.className   = 'status-dot waiting';
    label.textContent = 'Waiting for Stories';
    sub.textContent   = 'Navigate to an Instagram story';
  }

  if (lastScan) {
    const d = new Date(lastScan);
    document.getElementById('lastScan').textContent =
      `Last scan: ${d.toLocaleTimeString()}`;
  }
}

updateUI();
setInterval(updateUI, 2000);
