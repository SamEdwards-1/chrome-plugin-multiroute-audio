const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class Element {
  constructor() {
    this.children = [];
    this.listeners = new Map();
    this.textContent = "";
    this.disabled = false;
  }
  replaceChildren(...children) { this.children = children; }
  append(child) { this.children.push(child); }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  click() { return this.listeners.get("click")?.(); }
}

test("microphone failure preserves discovered outputs and a later grant stops the temporary track", async () => {
  const elements = Object.fromEntries(["status", "outputs", "choose", "refresh", "microphone"].map(id => [id, new Element()]));
  const document = {
    querySelector(selector) { return elements[selector.slice(1)]; },
    createElement() { return new Element(); }
  };
  let grant = false;
  let stopped = 0;
  const navigator = { mediaDevices: {
    async enumerateDevices() { return [{ kind: "audiooutput", deviceId: "fixed-output", label: "Fixed output" }]; },
    async getUserMedia() {
      if (!grant) throw Object.assign(new Error("No input available"), { name: "NotFoundError" });
      return { getTracks() { return [{ stop() { stopped++; } }]; } };
    }
  } };
  const script = fs.readFileSync(path.join(__dirname, "..", "src", "setup.js"), "utf8");
  vm.runInNewContext(script, { document, navigator });
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(elements.outputs.children[0].textContent, "Fixed output");
  assert.equal(elements.choose.disabled, true);
  await elements.microphone.click();
  assert.match(elements.status.textContent, /NotFoundError: No input available/);
  assert.equal(elements.outputs.children[0].textContent, "Fixed output");

  grant = true;
  await elements.microphone.click();
  assert.equal(stopped, 1);
  assert.match(elements.status.textContent, /microphone track has been stopped/);
  assert.equal(elements.outputs.children[0].textContent, "Fixed output");
});
