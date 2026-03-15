const API_BASE = "http://127.0.0.1:8001";

let mediaRecorder = null;
let audioChunks = [];
let activeStream = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "START_AUDIO_CAPTURE") {
    startCapture(msg.youthId, msg.sessionId, msg.streamId);
    sendResponse({ ok: true });
  }

  if (msg.type === "STOP_AUDIO_CAPTURE") {
    stopCapture();
    sendResponse({ ok: true });
  }

  return true;
});

async function startCapture(youthId, sessionId, streamId) {
  console.log("[offscreen] START_AUDIO_CAPTURE received", { youthId, sessionId, streamId });

  if (mediaRecorder) {
    stopCapture();
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        }
      },
      video: false
    });

    activeStream = stream;
    console.log("[offscreen] got media stream", stream);

    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    mediaRecorder.ondataavailable = (e) => {
      console.log("[offscreen] chunk received", e.data?.size);
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      console.log("[offscreen] recorder stopped", audioChunks.length);

      try {
        if (activeStream) {
          activeStream.getTracks().forEach((t) => t.stop());
        }
      } catch {}

      const blob = new Blob(audioChunks, { type: "audio/webm" });
      audioChunks = [];
      activeStream = null;
      mediaRecorder = null;

      // Tiny blob = likely silence / broken capture
      if (!blob || blob.size < 10000) {
        console.log("[offscreen] audio too small, skipping", blob?.size);
        chrome.runtime.sendMessage({ type: "AUDIO_CAPTURE_DONE" }).catch(() => {});
        return;
      }

      console.log("[offscreen] sending audio", blob.size);
      await sendToBackend(blob, youthId, sessionId);

      chrome.runtime.sendMessage({ type: "AUDIO_CAPTURE_DONE" }).catch(() => {});
    };

    mediaRecorder.start();
    console.log("[offscreen] recording started");

    setTimeout(() => {
      if (mediaRecorder?.state === "recording") {
        mediaRecorder.stop();
      }
    }, 20000);

  } catch (err) {
    console.error("[offscreen] getUserMedia failed:", err);
    chrome.runtime.sendMessage({ type: "AUDIO_CAPTURE_DONE" }).catch(() => {});
  }
}

function stopCapture() {
  try {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.stop();
    }
  } catch {}

  try {
    if (activeStream) {
      activeStream.getTracks().forEach((t) => t.stop());
    }
  } catch {}

  mediaRecorder = null;
  activeStream = null;
  audioChunks = [];
}

async function sendToBackend(blob, youthId, sessionId) {
  try {
    console.log("[offscreen] sendToBackend called", {
      size: blob.size,
      youthId,
      sessionId
    });

    const formData = new FormData();
    formData.append("file", blob, "story.webm");
    formData.append("youth_id", youthId || "");
    if (sessionId) formData.append("session_id", sessionId);

    const res = await fetch(`${API_BASE}/transcribe/audio`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      console.error("[offscreen] transcribe/audio failed:", res.status);
      console.error("[offscreen] response text:", await res.text());
      return;
    }

    const data = await res.json();
    console.log("[offscreen] transcript response:", data);

    chrome.runtime.sendMessage({
      type: "STORY_SAVED",
      text: data.text || ""
    }).catch(() => {});
  } catch (err) {
    console.error("[offscreen] send error:", err);
  }
}