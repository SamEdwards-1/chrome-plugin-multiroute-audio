const status = document.querySelector("#status");
const list = document.querySelector("#outputs");
const choose = document.querySelector("#choose");

async function refresh() {
  list.replaceChildren();
  const devices = await navigator.mediaDevices.enumerateDevices();
  const outputs = devices.filter(device => device.kind === "audiooutput");
  for (const [index, device] of outputs.entries()) {
    const item = document.createElement("li");
    item.textContent = device.label || `Output ${index + 1} (label hidden)`;
    list.append(item);
  }
  if (!outputs.length) {
    const item = document.createElement("li");
    item.textContent = "No outputs exposed by Chrome.";
    list.append(item);
  }
  choose.disabled = typeof navigator.mediaDevices.selectAudioOutput !== "function";
  if (choose.disabled) status.textContent = "Chrome does not expose a dedicated output picker here. The optional microphone permission action may reveal more outputs.";
}

document.querySelector("#refresh").addEventListener("click", () => refresh().catch(error => { status.textContent = error.message; }));
choose.addEventListener("click", async () => {
  try {
    const selected = await navigator.mediaDevices.selectAudioOutput();
    await refresh();
    status.textContent = `Selected ${selected.label || "an output"}. Reopen the source tab's popup to check whether the engine can use it.`;
  } catch (error) { status.textContent = `${error.name}: ${error.message}`; }
});
document.querySelector("#microphone").addEventListener("click", async () => {
  let stream;
  let result;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    result = "Temporary input access granted. The microphone track has been stopped; check which outputs are now visible.";
  } catch (error) { result = `${error.name}: ${error.message}`; }
  finally { stream?.getTracks().forEach(track => track.stop()); }
  try {
    await refresh();
    status.textContent = result;
  } catch (error) { status.textContent = `${result} Output refresh failed: ${error.message}`; }
});
refresh().catch(error => { status.textContent = error.message; });
