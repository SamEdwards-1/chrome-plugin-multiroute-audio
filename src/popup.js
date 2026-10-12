const sourceElement = document.querySelector("#source");
const outputElement = document.querySelector("#output");
const statusElement = document.querySelector("#status");
const routesElement = document.querySelector("#routes");
const startButton = document.querySelector("#start");
const switchButton = document.querySelector("#switch");
const stopButton = document.querySelector("#stop");
let sourceTab;

async function request(type, details = {}) {
  const response = await chrome.runtime.sendMessage({ target: "worker", type, ...details });
  if (!response?.ok) throw new Error(response?.error || "No response from extension.");
  return response;
}

async function refresh() {
  const [outputResult, routeResult] = await Promise.all([request("OUTPUTS"), request("SNAPSHOT")]);
  const prior = outputElement.value;
  outputElement.replaceChildren();
  for (const output of outputResult.outputs) {
    const option = document.createElement("option");
    option.value = output.deviceId;
    option.textContent = output.label;
    outputElement.append(option);
  }
  if ([...outputElement.options].some(option => option.value === prior)) outputElement.value = prior;
  const route = routeResult.routes.find(item => item.tabId === sourceTab?.id);
  startButton.hidden = Boolean(route);
  stopButton.hidden = !route;
  switchButton.hidden = !route;
  if (route && [...outputElement.options].some(option => option.value === route.deviceId)) {
    outputElement.value = route.deviceId;
  }
  routesElement.replaceChildren();
  for (const item of routeResult.routes) {
    const row = document.createElement("li");
    const label = outputResult.outputs.find(output => output.deviceId === item.deviceId)?.label || "Unavailable output";
    const sinkLabel = item.sinkId === null ? "not reported" :
      item.sinkId === "" || item.sinkId === "default" ? "System default" :
      outputResult.outputs.find(output => output.deviceId === item.sinkId)?.label || "unavailable or changed output";
    row.textContent = `Tab ${item.tabId}: selected ${label}; browser sink ${sinkLabel}; context ${item.contextState}; track ${item.trackState}`;
    routesElement.append(row);
  }
  if (!routeResult.routes.length) {
    const row = document.createElement("li");
    row.textContent = "None";
    routesElement.append(row);
  }
}

async function perform(type) {
  const buttons = [startButton, switchButton, stopButton];
  buttons.forEach(button => { button.disabled = true; });
  statusElement.textContent = `${type === "START" ? "Starting" : type === "STOP" ? "Stopping" : "Switching"}…`;
  const commandStartedAt = performance.now();
  try {
    await request(type, { tabId: sourceTab.id, deviceId: outputElement.value });
    const commandMs = Math.round(performance.now() - commandStartedAt);
    await refresh();
    const result = type === "STOP" ? "Routing stopped; normal tab playback resumed." : "Route is running.";
    statusElement.textContent = `${result} ${type.toLowerCase()} command: ${commandMs} ms (not audio latency).`;
  } catch (error) {
    const commandMs = Math.round(performance.now() - commandStartedAt);
    statusElement.textContent = `${error.message} ${type.toLowerCase()} command failed after ${commandMs} ms.`;
    await refresh().catch(() => {});
  } finally {
    buttons.forEach(button => { button.disabled = false; });
  }
}

startButton.addEventListener("click", () => perform("START"));
switchButton.addEventListener("click", () => perform("SWITCH"));
stopButton.addEventListener("click", () => perform("STOP"));

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  sourceTab = tab;
  sourceElement.textContent = tab?.title || (tab ? `Tab ${tab.id}` : "No active tab");
  startButton.disabled = !tab || !/^https?:/.test(tab.url || "");
  await refresh();
  if (startButton.disabled) statusElement.textContent = "Open a regular web page to start routing.";
})().catch(error => { statusElement.textContent = error.message; });
