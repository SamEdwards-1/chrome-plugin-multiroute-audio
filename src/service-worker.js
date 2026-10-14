const OFFSCREEN_URL = "src/offscreen.html";
let creatingOffscreen;
let closingOffscreen;
const startingTabs = new Set();

async function ensureOffscreen() {
  if (closingOffscreen) await closingOffscreen;
  if (await chrome.offscreen.hasDocument()) return;
  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ["USER_MEDIA"],
      justification: "Render user-initiated tab capture to a selected audio output while the popup is closed."
    }).finally(() => { creatingOffscreen = undefined; });
  }
  await creatingOffscreen;
}

async function engine(type, payload = {}) {
  await ensureOffscreen();
  return chrome.runtime.sendMessage({ target: "engine", type, ...payload });
}

async function maybeCloseOffscreen() {
  if (closingOffscreen) return closingOffscreen;
  if (startingTabs.size) return;
  if (!(await chrome.offscreen.hasDocument())) return;
  const snapshot = await chrome.runtime.sendMessage({ target: "engine", type: "SNAPSHOT" });
  if (snapshot?.ok && snapshot.routes.length === 0 && snapshot.stopping === 0 && !startingTabs.size) {
    if (closingOffscreen) return closingOffscreen;
    closingOffscreen = chrome.offscreen.closeDocument().finally(() => { closingOffscreen = undefined; });
    await closingOffscreen;
  }
}

async function start(tabId, deviceId) {
  if (!Number.isInteger(tabId) || tabId < 0 || typeof deviceId !== "string" || deviceId.length > 512) {
    throw new Error("Invalid route request.");
  }
  if (startingTabs.has(tabId)) throw new Error("This tab is already starting.");
  startingTabs.add(tabId);
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!/^https?:/.test(tab.url || "")) throw new Error("Open a regular web page before routing this tab.");
    const existing = await engine("SNAPSHOT");
    if (!existing?.ok) throw new Error(existing?.error || "Audio engine is unavailable.");
    if (existing.routes.some(route => route.tabId === tabId)) return existing;
    // The popup's action invocation grants activeTab for its frozen source tab.
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
    const tabTitle = typeof tab.title === "string" ? tab.title.trim().slice(0, 160) : "";
    const result = await engine("START", { tabId, streamId, deviceId, tabTitle });
    if (!result?.ok) throw new Error(result?.error || "Audio engine could not start.");
    return result;
  } finally {
    startingTabs.delete(tabId);
    await maybeCloseOffscreen().catch(() => {});
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.target !== "worker") return;
  (async () => {
    if (message.type === "START") return start(message.tabId, message.deviceId);
    if (message.type === "FOCUS_TAB") {
      if (!Number.isInteger(message.tabId) || message.tabId < 0) throw new Error("Invalid tab.");
      const tab = await chrome.tabs.update(message.tabId, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
      return { ok: true };
    }
    if (message.type === "SNAPSHOT" && !(await chrome.offscreen.hasDocument())) return { ok: true, routes: [] };
    if (message.type === "OUTPUTS") {
      try { return await engine("OUTPUTS"); }
      finally { await maybeCloseOffscreen().catch(() => {}); }
    }
    if (message.type === "SNAPSHOT") return engine("SNAPSHOT");
    if (message.type === "STOP" || message.type === "SWITCH") {
      if (!Number.isInteger(message.tabId)) throw new Error("Invalid tab.");
      if (message.type === "SWITCH" && (typeof message.deviceId !== "string" || message.deviceId.length > 512)) {
        throw new Error("Invalid output.");
      }
      const response = await engine(message.type, { tabId: message.tabId, deviceId: message.deviceId });
      if (message.type === "STOP") await maybeCloseOffscreen();
      return response;
    }
    if (message.type === "ENGINE_IDLE") {
      await maybeCloseOffscreen();
      return { ok: true };
    }
    throw new Error("Unknown command.");
  })().then(sendResponse, error => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.tabs.onRemoved.addListener(async tabId => {
  if (!(await chrome.offscreen.hasDocument())) return;
  await engine("STOP", { tabId }).catch(() => {});
  await maybeCloseOffscreen().catch(() => {});
});
