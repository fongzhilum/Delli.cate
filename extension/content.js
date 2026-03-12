/**
 * content.js
 * Detects Instagram story pages, extracts username,
 * and calls the local Python scanner on localhost:7842
 */

const SCAN_INTERVAL_MS = 5000;
const PYTHON_SERVER    = 'http://localhost:7842/scan';

let scanInterval = null;
let lastUsername = '';
let lastScanTime = 0;

function getStoryUsername() {
  const urlMatch = location.pathname.match(/\/stories\/([^/]+)/);
  if (urlMatch && urlMatch[1] !== 'highlights') return urlMatch[1];

  const selectors = [
    'a[href*="/stories/"] span',
    'header a[role="link"] span',
    'div[role="dialog"] a[href^="/"] span',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const text = el?.textContent?.trim().replace('@', '');
    if (text && text.length > 1 && text.length < 30) return text;
  }
  return null;
}

function onStoriesPage() {
  return location.pathname.includes('/stories/');
}

async function scanStory() {
  if (!onStoriesPage()) return;

  const username = getStoryUsername();
  if (!username) {
    console.log('[Delli.cate] Username not found');
    return;
  }

  const now = Date.now();
  if (username === lastUsername && now - lastScanTime < SCAN_INTERVAL_MS) return;

  lastUsername = username;
  lastScanTime = now;

  console.log(`[Delli.cate] Sending @${username} to Python scanner...`);

  // Update popup
  chrome.storage.local.get(['storiesCount'], (data) => {
    chrome.storage.local.set({
      storiesCount: (data.storiesCount ?? 0) + 1,
      isOnStories:  true,
      lastScan:     new Date().toISOString(),
    });
  });

  try {
    const res = await fetch(PYTHON_SERVER, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, capturedAt: new Date().toISOString() }),
    });

    if (res.ok) {
      console.log(`[Delli.cate] ✅ Python scanner triggered for @${username}`);
    } else {
      console.warn('[Delli.cate] Python server error:', res.status);
    }
  } catch (err) {
    console.warn('[Delli.cate] Could not reach Python scanner — is scanner.py running?', err.message);
  }
}

function startScanning() {
  if (scanInterval) return;
  console.log('[Delli.cate] Started scanning');
  chrome.storage.local.set({ isOnStories: true });
  scanInterval = setInterval(scanStory, SCAN_INTERVAL_MS);
  scanStory();
}

function stopScanning() {
  if (!scanInterval) return;
  clearInterval(scanInterval);
  scanInterval = null;
  lastUsername = '';
  chrome.storage.local.set({ isOnStories: false });
  console.log('[Delli.cate] Stopped scanning');
}

function handleRouteChange() {
  console.log('[Delli.cate] Path:', location.pathname);
  if (onStoriesPage()) startScanning();
  else stopScanning();
}

const _push    = history.pushState.bind(history);
const _replace = history.replaceState.bind(history);
history.pushState    = (...a) => { _push(...a);    setTimeout(handleRouteChange, 800); };
history.replaceState = (...a) => { _replace(...a); setTimeout(handleRouteChange, 800); };
window.addEventListener('popstate', handleRouteChange);

handleRouteChange();
setTimeout(handleRouteChange, 2000);
