"use strict";

// Run with Node 18+: node --test tests/popup.test.cjs
// Executes the real popup.js against isolated DOM, Chrome, and network doubles.
// No network requests, API keys, npm packages, or browser installation required.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "popup.js"), "utf8");
const html = fs.readFileSync(path.join(root, "popup.html"), "utf8");
const K = { apiKey: "bosscomm.apiKey", model: "bosscomm.model", tone: "bosscomm.tone", draft: "bosscomm.draft" };
const TEST_KEY = "local-test-credential-never-sent-to-google";
const MODEL = "gemini-3.5-flash-lite";
const clone = (value) => structuredClone(value);
const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

class Element {
  constructor(id, attributes = "") {
    this.id = id;
    this.value = "";
    this.textContent = "";
    this.hidden = /\bhidden\b/.test(attributes);
    this.disabled = /\bdisabled\b/.test(attributes);
    this.checked = false;
    this.type = "text";
    this.listeners = new Map();
    this.attributes = new Map();
    this.selected = false;
    const classes = new Set();
    this.classList = {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle(name, force) { if (force ?? !classes.has(name)) classes.add(name); else classes.delete(name); }
    };
  }
  addEventListener(name, callback) {
    this.listeners.set(name, [...(this.listeners.get(name) || []), callback]);
  }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name); }
  focus() { this.focused = true; }
  select() { this.selected = true; }
  async fire(name, extra = {}) {
    const event = { target: this, preventDefault() { this.defaultPrevented = true; }, ...extra };
    await Promise.all((this.listeners.get(name) || []).map((callback) => callback(event)));
    await settle();
    return event;
  }
}

function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, async json() { return clone(payload); } };
}

function success(text = "The backend is mostly complete.") {
  return response({ candidates: [{ finishReason: "STOP", content: { parts: [{ text }] } }] });
}

async function mount(options = {}) {
  const elements = new Map();
  for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    assert.ok(!elements.has(match[1]), `Duplicate HTML ID ${match[1]}`);
    elements.set(match[1], new Element(match[1], match[0]));
  }
  const radios = ["professional", "direct", "apologetic"].map((value) => {
    const el = new Element(value); el.value = value; el.checked = value === "professional"; return el;
  });
  const document = new Element("document");
  document.getElementById = (id) => { assert.ok(elements.has(id), `Missing HTML ID ${id}`); return elements.get(id); };
  document.querySelectorAll = (selector) => selector === 'input[name="tone"]' ? radios : [];
  const window = new Element("window");
  const local = clone(options.local ?? { [K.apiKey]: TEST_KEY });
  const session = clone(options.session ?? {});
  const writes = [];
  const access = [];
  const calls = [];
  const timers = new Map();
  const clipboard = [];
  let timerId = 0;
  let fetchImplementation = options.fetch ?? (async () => success());
  const storage = (data, area) => ({
    async setAccessLevel(value) { access.push({ area, ...value }); },
    async get(keys) {
      if (options.failRead === area) throw new Error("Storage read failed");
      return Object.fromEntries((Array.isArray(keys) ? keys : [keys]).filter((key) => key in data).map((key) => [key, clone(data[key])]));
    },
    async set(values) {
      if (options.failWrite === area) throw new Error("Storage write failed");
      writes.push({ area, values: clone(values) });
      if (options.beforeWrite) await options.beforeWrite(area, values);
      Object.assign(data, clone(values));
    },
    async remove(key) {
      if (options.failRemove) throw new Error("Removal failed");
      delete data[key];
    }
  });
  const context = vm.createContext({
    document, window, chrome: { storage: { local: storage(local, "local"), session: storage(session, "session") } },
    navigator: { clipboard: { async writeText(text) {
      if (options.failCopy) throw new Error("Clipboard denied");
      clipboard.push(text);
    } } },
    fetch: async (url, request) => { calls.push({ url, request }); return fetchImplementation(url, request); },
    setTimeout(callback, milliseconds) { timers.set(++timerId, { callback, milliseconds }); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    AbortController, DOMException
  });
  vm.runInContext(source, context, { filename: "popup.js" });
  await settle();
  const get = (id) => document.getElementById(id);
  return {
    get, radios, document, window, local, session, calls, clipboard, writes, access, timers,
    setFetch(fn) { fetchImplementation = fn; },
    async input(value) { get("inputText").value = value; await get("inputText").fire("input"); },
    async submit() { await get("convertForm").fire("submit"); },
    async tone(value) {
      radios.forEach((r) => { r.checked = r.value === value; });
      await radios.find((r) => r.value === value).fire("change");
    },
    async save(key = TEST_KEY, model = MODEL) {
      get("apiKey").value = key; get("modelName").value = model;
      await get("settingsForm").fire("submit");
    },
    runTimer(milliseconds) {
      const timer = [...timers.values()].find((entry) => entry.milliseconds === milliseconds);
      assert.ok(timer, `Expected a ${milliseconds}ms timer`);
      timer.callback();
    }
  };
}

test("manifest and assets have exact least-privilege extension wiring", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3);
