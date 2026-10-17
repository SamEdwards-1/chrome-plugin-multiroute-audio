import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, resolve, relative, sep } from "node:path";

const root = resolve("dist");
const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, "Multiroute Audio");
assert.ok(manifest.description.length <= 132);
assert.deepEqual(manifest.permissions.toSorted(), ["activeTab", "offscreen", "tabCapture"]);
assert.ok(!manifest.host_permissions?.length);
assert.ok(!manifest.content_scripts?.length);

async function localFile(from, reference) {
  if (reference.startsWith("data:")) return;
  assert.ok(!/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference), `Remote resource: ${reference}`);
  const clean = decodeURIComponent(reference.split(/[?#]/)[0]);
  const path = clean.startsWith("/") ? resolve(root, `.${clean}`) : resolve(dirname(from), clean);
  assert.ok(!relative(root, path).split(sep).includes(".."), `Outside package: ${reference}`);
  assert.ok((await stat(path)).isFile(), `Missing resource: ${reference}`);
}

for (const reference of [manifest.background.service_worker, manifest.action.default_popup,
  "src/setup.html", "src/offscreen.html", "src/offscreen.js", "src/fonts/LICENSE"]) {
  await localFile(resolve(root, "manifest.json"), reference);
}
for (const [size, path] of Object.entries(manifest.icons)) {
  const bytes = await readFile(resolve(root, path));
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16), Number(size));
  assert.equal(bytes.readUInt32BE(20), Number(size));
}
for (const path of Object.values(manifest.action.default_icon)) {
  await localFile(resolve(root, "manifest.json"), path);
}

let count = 0;
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      assert.ok(!/^(?:node_modules|dev|tests|fixtures|\.git|\.claude)$/.test(entry.name));
      await inspect(path);
      continue;
    }
    count++;
    assert.ok(!/\.(?:map|zip|env)$/.test(entry.name), `Development file: ${path}`);
    if (![".html", ".css", ".js"].includes(extname(path))) continue;
    const source = await readFile(path, "utf8");
    assert.ok(!source.includes("/dev/mock.js"), `Development mock in ${path}`);
    assert.ok(!/\beval\s*\(|\bnew\s+Function\s*\(/.test(source), `Dynamic code in ${path}`);
    if (extname(path) === ".html") {
      assert.ok(!/<script\b(?![^>]*\bsrc=)[^>]*>\s*\S/i.test(source), `Inline script: ${path}`);
      for (const match of source.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
        await localFile(path, match[1]);
      }
    }
    if (extname(path) === ".css") {
      for (const match of source.matchAll(/url\(["']?([^"')]+)["']?\)/g)) await localFile(path, match[1]);
    }
    if (extname(path) === ".js") {
      for (const match of source.matchAll(/(?:from\s*|import\s*\(?)["'](\.[^"']+)["']/g)) {
        await localFile(path, match[1]);
      }
      assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket)\b/.test(source), `Unexpected networking: ${path}`);
    }
  }
}
await inspect(root);
console.log(`Release checks passed: ${manifest.name} ${manifest.version}; ${count} files; all page, script, style, font and icon references resolve; no mocks, remote resources or dynamic code.`);
