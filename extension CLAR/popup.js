// popup.js — controls the extension popup UI

const btn        = document.getElementById("btn");
const dot        = document.getElementById("dot");
const statusText = document.getElementById("statusText");
const info       = document.getElementById("info");
const lastSaved  = document.getElementById("lastSaved");

let isActive = false;

// Get current status from content script
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  chrome.tabs.sendMessage(tabs[0].id, { type: "GET_STATUS" }, (res) => {
    if (chrome.runtime.lastError) return;
    if (res?.active) setActive(true);
  });
});

// Listen for status updates from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "MONITORING_ACTIVE") setActive(msg.active);
  if (msg.type === "STORY_SAVED") {
    lastSaved.textContent = "✓ Story saved — " + new Date().toLocaleTimeString();
  }
});

btn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const type = isActive ? "STOP_MONITORING" : "START_MONITORING";
    chrome.tabs.sendMessage(tabs[0].id, { type }, (res) => {
      if (chrome.runtime.lastError) {
        statusText.textContent = "Open Instagram first!";
        return;
      }
    });
  });
});

function setActive(active) {
  isActive = active;
  dot.className = "dot" + (active ? " active" : "");
  statusText.textContent = active ? "Monitoring stories..." : "Inactive";
  btn.textContent = active ? "Stop Monitoring" : "Start Monitoring";
  btn.className = "btn " + (active ? "btn-stop" : "btn-start");
  info.className = "info" + (active ? "" : " hidden");
}