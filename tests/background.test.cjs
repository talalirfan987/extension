const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
function setup(options = {}) {
  let listener; const calls = [];
  const chrome = { runtime: { id: 'extension', onMessage: { addListener(fn) { listener = fn; } } }, storage: { local: { setAccessLevel: async () => {}, get: async () => options.saved || { 'bosscomm.apiKey': 'test-secret', 'bosscomm.model': 'gemini-test' } } } };
  vm.runInNewContext(code, { chrome, AbortController, setTimeout, clearTimeout, fetch: async (...args) => { calls.push(args); return { ok: options.status ? false : true, status: options.status, json: async () => options.payload || { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'I am working.' }] } }] } }; } });
  return { calls, send: (text, sender = { id: 'extension', tab: { id: 1 }, frameId: 0 }, mode = 'translate') => new Promise(resolve => { if (listener({ type: 'bosscomm.correct', text, mode }, sender, resolve) !== true) resolve(undefined); }) };
}
test('worker sends only requested draft and never returns credentials', async () => {
  const h = setup(); const result = await h.send('i working');
  assert.equal(result.text, 'I am working.');
  const [url, request] = h.calls[0];
  assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent');
  assert.equal(request.headers['x-goog-api-key'], 'test-secret');
  assert.equal(JSON.parse(JSON.parse(request.body).contents[0].parts[0].text).source_message, 'i working');
  assert.equal(JSON.stringify(result).includes('test-secret'), false);
});
test('untrusted senders and invalid drafts cannot cause network calls', async () => {
  const h = setup();
  await h.send('hello', { id: 'other', tab: { id: 1 } });
  await h.send('hello', { id: 'extension' });
  assert.match((await h.send(' ')).error, /1–3,000/);
  assert.match((await h.send('x'.repeat(3001))).error, /1–3,000/);
  assert.equal(h.calls.length, 0);
});
test('missing keys and malformed models fail before network access', async () => {
  for (const saved of [{}, { 'bosscomm.apiKey': 'secret', 'bosscomm.model': 'https://bad.invalid' }]) {
    const h = setup({ saved }); assert.ok((await h.send('hello')).error); assert.equal(h.calls.length, 0);
  }
});
test('incomplete and blocked responses are rejected', async () => {
  for (const payload of [{ candidates: [{ finishReason: 'MAX_TOKENS' }] }, { promptFeedback: { blockReason: 'SAFETY' } }, { candidates: [{ finishReason: 'STOP', content: { parts: 'invalid' } }] }]) {
    assert.ok((await setup({ payload }).send('hello')).error);
  }
});
test('quota errors are actionable', async () => { assert.match((await setup({ status: 429 }).send('hello')).error, /quota/); });

test('translation and correction have distinct language instructions', async () => {
  for (const mode of ['translate', 'correct', 'roman']) {
    const h = setup(); await h.send('mai kam kar rha hon', undefined, mode);
    const instruction = JSON.parse(h.calls[0][1].body).systemInstruction.parts[0].text;
    assert.match(instruction, mode === 'correct' ? /Roman Urdu stays Roman Urdu/ : mode === 'roman' ? /correct, natural Roman Urdu/ : /into clear, natural English/);
  }
});
test('unknown mode never starts a request', async () => {
  const h = setup(); assert.match((await h.send('hello', undefined, 'invalid')).error, /valid writing action/); assert.equal(h.calls.length, 0);
});
