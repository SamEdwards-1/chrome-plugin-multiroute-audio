const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function loadScript(name, sandbox) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "src", name), "utf8"), sandbox);
}

function dispatch(listener, message) {
  return new Promise(resolve => listener(message, { id: "extension-id" }, resolve));
}

test("worker reserves a tab before async eligibility checks", async () => {
  const tabLookup = deferred();
  let listener;
  let captures = 0;
  let activeRoutes = [];
  const chrome = {
    runtime: {
      id: "extension-id",
      onMessage: { addListener(callback) { listener = callback; } },
      async sendMessage(message) {
        if (message.type === "SNAPSHOT") return { ok: true, routes: activeRoutes };
        if (message.type === "START") {
          activeRoutes = [{ tabId: message.tabId }];
          return { ok: true, routes: activeRoutes };
        }
        throw new Error(`Unexpected command ${message.type}`);
      }
    },
    offscreen: { async hasDocument() { return true; }, async closeDocument() {} },
    tabs: {
      async get() { return tabLookup.promise; },
      onRemoved: { addListener() {} }
    },
    tabCapture: { async getMediaStreamId() { captures++; return `stream-${captures}`; } }
  };
  loadScript("service-worker.js", { chrome });
  const first = dispatch(listener, { target: "worker", type: "START", tabId: 7, deviceId: "" });
  const second = await dispatch(listener, { target: "worker", type: "START", tabId: 7, deviceId: "" });
  assert.equal(second.ok, false);
  assert.match(second.error, /already starting/);
  tabLookup.resolve({ url: "http://localhost:8765/fixtures/tone.html" });
  assert.equal((await first).ok, true);
  assert.equal(captures, 1);
});

test("a restarted worker recovers routes from the surviving offscreen engine", async () => {
  let listener;
  let captures = 0;
  const route = { tabId: 7, deviceId: "output-one", contextState: "running", trackState: "live" };
  const chrome = {
    runtime: {
      id: "extension-id",
      onMessage: { addListener(callback) { listener = callback; } },
      async sendMessage(message) {
        assert.equal(message.type, "SNAPSHOT");
        return { ok: true, routes: [route] };
      }
    },
    offscreen: { async hasDocument() { return true; } },
    tabs: { async get() { return { url: "http://localhost:8765" }; }, onRemoved: { addListener() {} } },
    tabCapture: { async getMediaStreamId() { captures++; return "unexpected-stream"; } }
  };
  loadScript("service-worker.js", { chrome });
  assert.equal((await dispatch(listener, { target: "worker", type: "SNAPSHOT" })).routes[0].tabId, 7);

  // Loading the script in a new VM discards all service-worker globals while the engine stays alive.
  loadScript("service-worker.js", { chrome });
  const recovered = await dispatch(listener, { target: "worker", type: "SNAPSHOT" });
  assert.equal(recovered.routes[0].contextState, "running");
  const startAgain = await dispatch(listener, { target: "worker", type: "START", tabId: 7, deviceId: "output-one" });
  assert.equal(startAgain.ok, true);
  assert.equal(captures, 0, "recovery must not capture the same tab twice");
});

test("offscreen engine rejects overlapping captures and acknowledges stop before idle", async () => {
  const mediaStart = deferred();
  let listener;
  let captureCalls = 0;
  let contexts = 0;
  let closed = 0;
  const notifications = [];
  const track = { readyState: "live", onended: null, stop() { this.readyState = "ended"; } };
  const stream = { getAudioTracks() { return [track]; }, getTracks() { return [track]; } };
  class FakeAudioContext {
    constructor() { contexts++; this.state = "suspended"; this.currentTime = 0; this.destination = {}; }
    createMediaStreamSource() { return { connect(node) { return node; }, disconnect() {} }; }
    createGain() {
      return {
        gain: { value: 0, setTargetAtTime() {} },
        connect(destination) { return destination; },
        disconnect() {}
      };
    }
    async resume() { this.state = "running"; }
    async close() { closed++; this.state = "closed"; }
  }
  const chrome = {
    runtime: {
      id: "extension-id",
      onMessage: { addListener(callback) { listener = callback; } },
      async sendMessage(message) { notifications.push(message); }
    }
  };
  const navigator = { mediaDevices: {
    async getUserMedia() { captureCalls++; return mediaStart.promise; }
  } };
  loadScript("offscreen.js", { chrome, navigator, AudioContext: FakeAudioContext });
  const request = { target: "engine", type: "START", tabId: 7, streamId: "single-use", deviceId: "" };
  const first = dispatch(listener, request);
  const second = await dispatch(listener, request);
  assert.equal(second.ok, false);
  assert.match(second.error, /already starting/);
  assert.equal(captureCalls, 1);
  assert.equal(contexts, 1);
  mediaStart.resolve(stream);
  assert.equal((await first).routes.length, 1);

  const stopped = await dispatch(listener, { target: "engine", type: "STOP", tabId: 7 });
  assert.equal(stopped.ok, true);
  assert.equal(stopped.routes.length, 0);
  assert.equal(track.readyState, "ended");
  assert.equal(closed, 1);
  assert.equal(notifications.length, 0, "explicit stop must not send ENGINE_IDLE before worker acknowledgement");
});

test("concurrent stops await the same context close before the worker closes offscreen", async () => {
  const closeGate = deferred();
  let workerListener;
  let engineListener;
  let documentOpen = true;
  let documentCloses = 0;
  let contextCloses = 0;
  let captureCalls = 0;
  const track = { readyState: "live", onended: null, stop() { this.readyState = "ended"; } };
  const stream = { getAudioTracks() { return [track]; }, getTracks() { return [track]; } };
  class FakeAudioContext {
    constructor() { this.state = "suspended"; this.currentTime = 0; this.destination = {}; }
    createMediaStreamSource() { return { connect(node) { return node; }, disconnect() {} }; }
    createGain() { return { gain: { value: 0, setTargetAtTime() {} }, connect(output) { return output; }, disconnect() {} }; }
    async resume() { this.state = "running"; }
    async close() { contextCloses++; await closeGate.promise; this.state = "closed"; }
  }
  const engineChrome = {
    runtime: {
      id: "extension-id",
      onMessage: { addListener(callback) { engineListener = callback; } },
      async sendMessage() { throw new Error("Explicit stop must not send idle early"); }
    }
  };
  const workerChrome = {
    runtime: {
      id: "extension-id",
      onMessage: { addListener(callback) { workerListener = callback; } },
      sendMessage(message) { return dispatch(engineListener, message); }
    },
    offscreen: {
      async hasDocument() { return documentOpen; },
      async closeDocument() { documentCloses++; documentOpen = false; }
    },
    tabs: { async get() { return { url: "http://localhost:8765" }; }, onRemoved: { addListener() {} } },
    tabCapture: { async getMediaStreamId() { return "stream-one"; } }
  };
  const navigator = { mediaDevices: { async getUserMedia() { captureCalls++; return stream; } } };
  loadScript("offscreen.js", { chrome: engineChrome, navigator, AudioContext: FakeAudioContext });
  loadScript("service-worker.js", { chrome: workerChrome });
  const start = await dispatch(workerListener, { target: "worker", type: "START", tabId: 7, deviceId: "" });
  assert.equal(start.ok, true);

  let firstResolved = false;
  let secondResolved = false;
  const first = dispatch(workerListener, { target: "worker", type: "STOP", tabId: 7 })
    .then(result => { firstResolved = true; return result; });
  const second = dispatch(workerListener, { target: "worker", type: "STOP", tabId: 7 })
    .then(result => { secondResolved = true; return result; });
  await new Promise(resolve => setImmediate(resolve));
  const duringClose = await dispatch(engineListener, { target: "engine", type: "SNAPSHOT" });
  assert.equal(duringClose.routes.length, 0);
  assert.equal(duringClose.stopping, 1);
  assert.equal(contextCloses, 1);
  assert.equal(firstResolved, false);
  assert.equal(secondResolved, false);
  assert.equal(documentCloses, 0);

  const overlappingStart = await dispatch(engineListener, {
    target: "engine", type: "START", tabId: 7, streamId: "new-stream", deviceId: ""
  });
  assert.equal(overlappingStart.ok, false);
  assert.match(overlappingStart.error, /still stopping/);
  assert.equal(captureCalls, 1, "a new capture must wait for old-route cleanup");

  closeGate.resolve();
  assert.equal((await first).ok, true);
  assert.equal((await second).ok, true);
  assert.equal(documentCloses, 1);
});
