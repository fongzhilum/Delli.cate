// background.js — service worker
// Just ensures content.js is injected into Instagram tabs.
// All scanning logic (DOM text, Supabase, Gemini) lives in content.js

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("instagram.com")) {
    chrome.scripting.executeScript({
      target: { tabId },
      files:  ["content.js"]
    }).catch(() => {});
  }
});

// Also inject into any already-open Instagram tabs
chrome.tabs.query({ url: "https://www.instagram.com/*" }, (tabs) => {
  tabs.forEach(tab => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files:  ["content.js"]
    }).catch(() => {});
  });
});
