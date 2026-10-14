const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { JSDOM } = require("jsdom");
const axe = require("axe-core");

const root = join(__dirname, "..");
const read = file => readFileSync(join(root, file), "utf8");
const tick = () => new Promise(resolve => setTimeout(resolve, 20));

async function scan(document, label) {
  const result = await document.defaultView.axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
    // jsdom has no layout or canvas. CSS contrast is checked separately.
    rules: { "color-contrast": { enabled: false } }
  });
  assert.equal(
    result.violations.length,
    0,
    `${label}: ${JSON.stringify(result.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })))}`
  );
}

function createPage(html) {
  const dom = new JSDOM(read(html), { url: "https://extension.invalid/", runScripts: "outside-only", pretendToBeVisual: true });
  dom.window.HTMLCanvasElement.prototype.getContext = () => null;
  dom.window.eval(axe.source);
  return dom;
}

test("popup states pass axe and keep focus after route actions", async () => {
  const dom = createPage("src/popup.html");
  const { window } = dom;
  let routes = [{ tabId: 2, tabTitle: "Other tab", deviceId: "headphones", sinkId: "headphones", contextState: "running", trackState: "live" }];
  const outputs = [{ deviceId: "", label: "System default" }, { deviceId: "headphones", label: "Headphones" }];
  window.chrome = {
    tabs: { async query() { return [{ id: 1, title: "Current tab", url: "https://example.com" }]; } },
    runtime: { async sendMessage(message) {
      switch (message.type) {
        case "SNAPSHOT": return { ok: true, routes: routes.map(route => ({ ...route })) };
        case "OUTPUTS": return { ok: true, outputs };
        case "START":
          routes.push({ tabId: message.tabId, tabTitle: "Current tab", deviceId: message.deviceId, sinkId: message.deviceId, contextState: "running", trackState: "live" });
          return { ok: true };
        case "SWITCH":
          routes.find(route => route.tabId === message.tabId).deviceId = message.deviceId;
          return { ok: true };
        case "STOP":
          routes = routes.filter(route => route.tabId !== message.tabId);
          return { ok: true };
        default: return { ok: true };
      }
    } }
  };
  window.eval(read("src/popup.js"));
  await tick();
  await scan(window.document, "popup initial state");

  window.document.querySelector("#start").click();
  await tick();
  assert.equal(window.document.activeElement.id, "switch");
  await scan(window.document, "popup with current route");

  window.document.querySelector('.route-stop[aria-label*="Tab 2"]').click();
  await tick();
  assert.equal(window.document.activeElement.id, "routes-heading");
  window.document.querySelector(".route-details").open = true;
  await scan(window.document, "popup with expanded route details");
  dom.window.close();
});

test("device-access page passes axe with visible output results", async () => {
  const dom = createPage("src/setup.html");
  const { window } = dom;
  window.navigator.mediaDevices = {
    async enumerateDevices() { return [{ kind: "audiooutput", label: "Speakers", deviceId: "speakers" }]; }
  };
  window.eval(read("src/setup.js"));
  await tick();
  await scan(window.document, "device-access page");
  dom.window.close();
});

test("preview has a named popup frame and passes axe", async () => {
  const dom = createPage("index.html");
  await scan(dom.window.document, "preview page");
  dom.window.close();
});

test("normal text colors meet WCAG AA contrast on their layers", () => {
  const css = read("src/ui.css");
  const token = name => {
    const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
    assert.ok(match, `missing color token ${name}`);
    return match[1];
  };
  const luminance = hex => {
    const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const contrast = (foreground, background) => {
    const a = luminance(foreground);
    const b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  for (const [name, foreground, background] of [
    ["body text", token("text"), token("background")],
    ["secondary text", token("text-secondary"), token("layer")],
    ["field help", token("text-placeholder"), token("field")],
    ["route link", token("interactive-hover"), token("layer")],
    ["stop route", token("support-error"), token("layer")],
    ["running status", token("support-success"), token("layer")],
    ["warning status", token("support-warning"), token("layer")],
    ["primary button", "#ffffff", "#0f62fe"],
    ["notification", token("text"), "#002d5d"]
  ]) {
    assert.ok(contrast(foreground, background) >= 4.5, `${name} contrast below 4.5:1`);
  }
});
