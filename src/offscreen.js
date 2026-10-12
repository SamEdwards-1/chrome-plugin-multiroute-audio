const routes = new Map();
const startingTabs = new Set();
const stoppingTabs = new Map();

function snapshot() {
  return { ok: true, stopping: stoppingTabs.size, routes: [...routes.values()].map(({ tabId, deviceId, context, track }) => ({
    tabId, deviceId, contextState: context.state, trackState: track.readyState,
    sinkId: typeof context.sinkId === "string" ? context.sinkId : null
  })) };
}

async function outputs() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audio = devices.filter(device => device.kind === "audiooutput");
  return { ok: true, outputs: [
    { deviceId: "", label: "System default" },
    ...audio.filter(device => device.deviceId && device.deviceId !== "default")
      .map((device, index) => ({ deviceId: device.deviceId, label: device.label || `Output ${index + 1} (label hidden)` }))
  ], canChooseOutput: typeof navigator.mediaDevices.selectAudioOutput === "function" };
}

function stop(tabId, notifyIdle = false) {
  if (stoppingTabs.has(tabId)) return stoppingTabs.get(tabId);
  const route = routes.get(tabId);
  if (!route) return Promise.resolve(snapshot());
  routes.delete(tabId);
  route.track.onended = null;
  route.stream.getTracks().forEach(track => track.stop());
  route.source.disconnect();
  route.gain.disconnect();
  const pending = (async () => {
    try {
      await route.context.close();
    } finally {
      stoppingTabs.delete(tabId);
    }
    // Explicit STOP is acknowledged before the worker decides whether to close this document.
    if (notifyIdle && routes.size === 0 && stoppingTabs.size === 0) {
      chrome.runtime.sendMessage({ target: "worker", type: "ENGINE_IDLE" }).catch(() => {});
    }
    return snapshot();
  })();
  stoppingTabs.set(tabId, pending);
  return pending;
}

async function start(tabId, streamId, deviceId) {
  if (!Number.isInteger(tabId) || typeof streamId !== "string" || !streamId || typeof deviceId !== "string") {
    throw new Error("Invalid start parameters.");
  }
  if (routes.has(tabId)) return snapshot();
  if (stoppingTabs.has(tabId)) throw new Error("This tab is still stopping. Try again.");
  if (startingTabs.has(tabId)) throw new Error("This tab is already starting in the audio engine.");
  startingTabs.add(tabId);
  let context;
  let stream;
  try {
    context = new AudioContext();
    if (deviceId) {
      if (typeof context.setSinkId !== "function") throw new Error("This Chrome build cannot select an AudioContext output.");
      await context.setSinkId(deviceId);
    }
    stream = await navigator.mediaDevices.getUserMedia({ audio: {
      mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: streamId }
    }, video: false });
    const track = stream.getAudioTracks()[0];
    if (!track || track.readyState !== "live") throw new Error("Captured tab has no live audio track.");
    const source = context.createMediaStreamSource(stream);
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(context.destination);
    await context.resume();
    if (context.state !== "running") throw new Error(`AudioContext is ${context.state}; user interaction may be required.`);
    const route = { tabId, deviceId, context, stream, track, source, gain };
    routes.set(tabId, route);
    track.onended = () => stop(tabId, true).catch(() => {});
    gain.gain.setTargetAtTime(1, context.currentTime, 0.015);
    return snapshot();
  } catch (error) {
    stream?.getTracks().forEach(track => track.stop());
    if (context) await context.close();
    throw error;
  } finally {
    startingTabs.delete(tabId);
  }
}

async function changeOutput(tabId, deviceId) {
  const route = routes.get(tabId);
  if (!route) throw new Error("Route no longer exists.");
  if (typeof deviceId !== "string") throw new Error("Select an output to switch this route.");
  if (typeof route.context.setSinkId !== "function") throw new Error("AudioContext output selection is unavailable.");
  await route.context.setSinkId(deviceId);
  route.deviceId = deviceId;
  return snapshot();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.target !== "engine") return;
  (async () => {
    if (message.type === "SNAPSHOT") return snapshot();
    if (message.type === "OUTPUTS") return outputs();
    if (message.type === "START") return start(message.tabId, message.streamId, message.deviceId);
    if (message.type === "STOP") return stop(message.tabId);
    if (message.type === "SWITCH") return changeOutput(message.tabId, message.deviceId);
    throw new Error("Unknown engine command.");
  })().then(sendResponse, error => sendResponse({ ok: false, error: `${error.name || "Error"}: ${error.message}` }));
  return true;
});
