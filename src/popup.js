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
  const routeResult = await request("SNAPSHOT");
  const outputResult = await request("OUTPUTS");
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
    row.className = "route-item";
    const selectedOutput = outputResult.outputs.find(output => output.deviceId === item.deviceId);
    const label = selectedOutput?.label || "Unavailable output";
    const sinkLabel = item.sinkId === null ? "not reported" :
      item.sinkId === "" || item.sinkId === "default" ? "System default" :
      outputResult.outputs.find(output => output.deviceId === item.sinkId)?.label || "unavailable or changed output";
    const healthy = item.contextState === "running" && item.trackState === "live" && Boolean(selectedOutput);
    if (!healthy) row.classList.add("is-warning");

    const heading = document.createElement("div");
    heading.className = "route-heading";
    const tab = document.createElement("span");
    tab.className = "route-tab";
    tab.textContent = `Tab ${item.tabId}`;
    const state = document.createElement("span");
    state.className = "route-state";
    state.textContent = healthy ? "Graph running" : "Check route";
    heading.append(tab, state);

    const destination = document.createElement("p");
    destination.className = "route-destination";
    destination.textContent = label;
    const sink = document.createElement("p");
    sink.className = "route-sink";
    sink.textContent = `Chrome sink: ${sinkLabel}`;
    const meta = document.createElement("div");
    meta.className = "route-meta";
    for (const [name, value] of [["Context", item.contextState], ["Track", item.trackState]]) {
      const chip = document.createElement("span");
      chip.textContent = `${name}: ${value}`;
      meta.append(chip);
    }
    const footer = document.createElement("div");
    footer.className = "route-footer";
    const consequence = document.createElement("span");
    consequence.textContent = "Stop returns normal tab playback";
    const stopRoute = document.createElement("button");
    stopRoute.type = "button";
    stopRoute.className = "route-stop";
    stopRoute.textContent = "Stop route";
    stopRoute.setAttribute("aria-label", `Stop route for Tab ${item.tabId}; return to normal playback`);
    stopRoute.addEventListener("click", () => perform("STOP", item.tabId));
    footer.append(consequence, stopRoute);
    row.append(heading, destination, sink, meta, footer);
    routesElement.append(row);
  }
  if (!routeResult.routes.length) {
    const row = document.createElement("li");
    row.className = "empty-state";
    row.textContent = "No active routes";
    routesElement.append(row);
  }
}

async function perform(type, tabId = sourceTab?.id) {
  if (!Number.isInteger(tabId)) {
    statusElement.textContent = "No tab is available for this action.";
    return;
  }
  const buttons = [startButton, switchButton, stopButton, ...routesElement.querySelectorAll(".route-stop")];
  const priorDisabled = buttons.map(button => button.disabled);
  buttons.forEach(button => { button.disabled = true; });
  statusElement.textContent = `${type === "START" ? "Starting" : type === "STOP" ? "Stopping" : "Switching"} route for Tab ${tabId}…`;
  const commandStartedAt = performance.now();
  try {
    await request(type, { tabId, deviceId: outputElement.value });
    const commandMs = Math.round(performance.now() - commandStartedAt);
    await refresh();
    const result = type === "STOP" ? `Stopped route for Tab ${tabId}; normal tab playback resumed.` : "Route is running.";
    statusElement.textContent = `${result} ${type.toLowerCase()} command: ${commandMs} ms (not audio latency).`;
  } catch (error) {
    const commandMs = Math.round(performance.now() - commandStartedAt);
    statusElement.textContent = `${error.message} ${type.toLowerCase()} command failed after ${commandMs} ms.`;
    await refresh().catch(() => {});
  } finally {
    buttons.forEach((button, index) => { button.disabled = priorDisabled[index]; });
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
