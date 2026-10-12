const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class Element {
  constructor(tag = "div") {
    this.tag = tag;
    this.children = [];
    this.listeners = new Map();
    this.attributes = {};
    this.className = "";
    this.classList = { add: name => { this.className = `${this.className} ${name}`.trim(); } };
    this.disabled = false;
    this.hidden = false;
    this.value = "";
    this.textContent = "";
  }
  get options() { return this.children.filter(child => child.tag === "option"); }
  append(...children) {
    this.children.push(...children);
    if (this.tag === "select" && this.options.length === children.length) this.value = this.options[0].value;
  }
  replaceChildren(...children) {
    this.children = children;
    if (this.tag === "select") this.value = this.options[0]?.value || "";
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  setAttribute(name, value) { this.attributes[name] = value; }
  querySelectorAll(selector) {
    const className = selector.slice(1);
    const found = [];
    for (const child of this.children) {
      if (child.className.split(" ").includes(className)) found.push(child);
      found.push(...child.querySelectorAll(selector));
    }
    return found;
  }
  click() { return this.listeners.get("click")?.(); }
}

test("an unrelated tab can stop a route from the active-routes list", async () => {
  const ids = ["source", "output", "status", "routes", "start", "switch", "stop"];
  const elements = Object.fromEntries(ids.map(id => [id, new Element(id === "output" ? "select" : "div")]));
  const document = {
    querySelector(selector) { return elements[selector.slice(1)]; },
    createElement(tag) { return new Element(tag); }
  };
  let routes = [{ tabId: 7, deviceId: "fixed-output", sinkId: "fixed-output", contextState: "running", trackState: "live" }];
  const stopped = [];
  const focused = [];
  const chrome = {
    tabs: { async query() { return [{ id: 99, title: "Extensions", url: "chrome://extensions" }]; } },
    runtime: {
      async sendMessage(message) {
        if (message.type === "SNAPSHOT") return { ok: true, routes };
        if (message.type === "OUTPUTS") return { ok: true, outputs: [
          { deviceId: "", label: "System default" },
          { deviceId: "fixed-output", label: "Fixed output" }
        ] };
        if (message.type === "STOP") {
          stopped.push(message.tabId);
          routes = routes.filter(route => route.tabId !== message.tabId);
          return { ok: true, routes };
        }
        if (message.type === "FOCUS_TAB") {
          focused.push(message.tabId);
          return { ok: true };
        }
        throw new Error(`Unexpected command ${message.type}`);
      }
    }
  };
  const script = fs.readFileSync(path.join(__dirname, "..", "src", "popup.js"), "utf8");
  vm.runInNewContext(script, { document, chrome, performance: { now: () => 10 } });
  await new Promise(resolve => setImmediate(resolve));

  const stopOtherRoute = elements.routes.querySelectorAll(".route-stop")[0];
  assert.ok(stopOtherRoute);
  assert.match(stopOtherRoute.attributes["aria-label"], /Tab 7/);
  assert.equal(elements.start.disabled, true, "the current Chrome page is not routable");
  const focusOtherTab = elements.routes.querySelectorAll(".route-focus")[0];
  assert.ok(focusOtherTab);
  assert.equal(focusOtherTab.textContent, "→");
  assert.equal(focusOtherTab.attributes["aria-label"], "Go to Tab 7");
  await focusOtherTab.click();
  assert.deepEqual(focused, [7]);
  assert.deepEqual(stopped, [], "focusing must leave the route running");
  await stopOtherRoute.click();

  assert.deepEqual(stopped, [7]);
  assert.equal(elements.routes.children[0].textContent, "No active routes");
  assert.equal(elements.start.disabled, true, "stopping a different tab must not enable routing here");
});
