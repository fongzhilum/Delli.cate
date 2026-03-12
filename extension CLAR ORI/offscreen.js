// offscreen.js — handles tab audio capture
// Runs in an offscreen document where tabCapture works

const API_BASE = "http://127.0.0.1:8001";
let mediaRecorder = null;
let audioChunks = [];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "START_AUDIO_CAPTURE") {
    startCapture(msg.youthId, msg.sessionId);
    sendResponse({ ok: true });
  }
  if (msg.type === "STOP_AUDIO_CAPTURE") {
    stopCapture();
    sendResponse({ ok: true });
  }
  return true;
});

function startCapture(youthId, sessionId) {
  if (mediaRecorder) stopCapture();

  chrome.tabCapture.capture({ audio: true, video: false }, async (stream) => {
    if (!stream) {
      console.error("[offscreen] tabCapture failed");
      return;
    }

    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      if (audioChunks.length === 0) return;

      const blob = new Blob(audioChunks, { type: "audio/webm" });
      audioChunks = [];
      await sendToBackend(blob, youthId, sessionId);
    };

    mediaRecorder.start();
    setTimeout(() => {
      if (mediaRecorder?.state === "recording") mediaRecorder.stop();
    }, 15000);

    console.log("[offscreen] audio capture started");
  });
}

function stopCapture() {
  if (mediaRecorder?.state === "recording") mediaRecorder.stop();
  mediaRecorder = null;
}

async function sendToBackend(blob, youthId, sessionId) {
  try {
    const formData = new FormData();
    formData.append("file", blob, "story.webm");

    const res = await fetch(`${API_BASE}/transcribe`, { method: "POST", body: formData });
    if (!res.ok) return;
    const { text } = await res.json();
    if (!text || text.trim().length < 3) return;

    await fetch(`${API_BASE}/content/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        youth_id: youthId,
        session_id: sessionId || null,
        content_type: "story_speech",
        raw_text: text,
      })
    });

    console.log("[offscreen] speech saved:", text.substring(0, 60));
    chrome.runtime.sendMessage({ type: "STORY_SAVED", text }).catch(() => {});
  } catch (err) {
    console.error("[offscreen] send error:", err);
  }
}