// Loaded only by Vite's development server. No audio devices or extension APIs are used.
const outputs = [
  { deviceId: "default", label: "System default" },
  { deviceId: "speakers", label: "Speakers (sample output)" },
  { deviceId: "headphones", label: "Headphones (sample output)" },
  { deviceId: "display", label: "Display audio (sample output)" }
];

const routes = [
  { tabId: 102, tabTitle: "Music player — sample tab", deviceId: "headphones", sinkId: "headphones", contextState: "running", trackState: "live" },
  { tabId: 103, tabTitle: "Conference call — sample tab", deviceId: "speakers", sinkId: "speakers", contextState: "running", trackState: "live" }
];

const requestedTab = Number(new URLSearchParams(location.search).get("tab"));
const currentTab = Number.isInteger(requestedTab) && requestedTab > 0 ? requestedTab : 101;
const tabTitles = new Map([[101, "Example web page"], [102, routes[0].tabTitle], [103, routes[1].tabTitle]]);
const chromeApi = window.chrome ?? (window.chrome = {});

chromeApi.tabs = {
  async query() {
    return [{ id: currentTab, title: tabTitles.get(currentTab) ?? `Tab ${currentTab}`, url: "https://example.com" }];
  }
};

chromeApi.runtime = {
  async sendMessage(message) {
    switch (message.type) {
      case "SNAPSHOT": return { ok: true, routes: routes.map(route => ({ ...route })) };
      case "OUTPUTS": return { ok: true, outputs };
      case "START": {
        if (!routes.some(route => route.tabId === message.tabId)) {
          routes.push({
            tabId: message.tabId,
            tabTitle: tabTitles.get(message.tabId) ?? `Tab ${message.tabId}`,
            deviceId: message.deviceId,
            sinkId: message.deviceId,
            contextState: "running",
            trackState: "live"
          });
        }
        return { ok: true };
      }
      case "SWITCH": {
        const route = routes.find(item => item.tabId === message.tabId);
        if (!route) return { ok: false, error: "Sample route not found." };
        route.deviceId = message.deviceId;
        route.sinkId = message.deviceId;
        return { ok: true };
      }
      case "STOP": {
        const index = routes.findIndex(route => route.tabId === message.tabId);
        if (index !== -1) routes.splice(index, 1);
        return { ok: true };
      }
      case "FOCUS_TAB": return { ok: true };
      default: return { ok: false, error: `Unknown preview command: ${message.type}` };
    }
  }
};

Object.defineProperty(navigator, "mediaDevices", {
  configurable: true,
  value: {
    async enumerateDevices() {
      return outputs.map(output => ({ kind: "audiooutput", deviceId: output.deviceId, label: output.label }));
    },
    async selectAudioOutput() {
      return { deviceId: outputs[1].deviceId, label: outputs[1].label };
    },
    async getUserMedia() {
      return { getTracks: () => [{ stop() {} }] };
    }
  }
});
