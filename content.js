"use strict";
(() => {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;z-index:2147483647;bottom:20px;right:20px;display:block";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `<style>
    :host { all:initial; color-scheme:light; } * { box-sizing:border-box; } [hidden] { display:none!important; }
    #launcher { display:block; margin-left:auto; border:1px solid #d2e3ca; border-radius:24px; padding:11px 18px; background:#185b49; color:#fff; box-shadow:0 5px 24px #173e3426; font:600 15px/1.5 system-ui,sans-serif; }
    #scratch-label { display:block; margin-top:14px; font-size:12px; color:#61776d; }
    .box { width:min(348px,calc(100vw - 32px)); max-height:calc(100dvh - 40px); overflow:auto; padding:18px; border:1px solid #dce6e2; border-radius:22px; background:#fcfefc; color:#183c34; box-shadow:0 16px 60px #173e3426,0 2px 8px #173e3410; font:14px/1.5 system-ui,sans-serif; }
    .row { display:flex; gap:10px; align-items:center; } .identity { flex:1; } strong { display:block; font-size:17px; letter-spacing:-.5px; } .tag { font-size:10px; color:#71847e; letter-spacing:1.5px; text-transform:uppercase; }
    .mark { width:38px; height:38px; display:grid; place-items:center; background:#185b49; color:#d9f4ad; border-radius:12px; font-size:24px; }
    button { font:inherit; cursor:pointer; transition:background .15s,transform .15s; } button:hover:not(:disabled) { transform:translateY(-1px); } button:disabled { opacity:.55; cursor:wait; } button:focus-visible,textarea:focus-visible { outline:3px solid #90b75d; outline-offset:3px; }
    #close { border:0; background:transparent; color:#74857e; font-size:23px; padding:0 5px; }
    .actions { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:15px; } .action { text-align:left; border:1px solid #dce6e2; border-radius:14px; background:#eef4f0; color:#214c3e; padding:13px 11px; } .action.primary { background:#185b49; color:white; border-color:#185b49; } .action b { display:block; font-size:12px; margin:7px 0 2px; } .action small { display:block; font-size:10px; opacity:.8; } .symbol { font-size:19px; }
    textarea { width:100%; min-height:110px; max-height:200px; margin:12px 0 8px; padding:12px; resize:vertical; font:14px/1.7 system-ui,sans-serif; color:#183c34; background:#fff; border:1px solid #dce6e2; border-radius:12px; }
    #voice { width:100%; margin-top:10px; border:1px solid #cbdcbd; border-radius:12px; padding:11px; background:#eaf2df; color:#28543d; font-weight:650; } #voice[aria-pressed="true"] { background:#fff0ea; color:#a34229; border-color:#e9b6a3; } #heard { margin:10px 0 0; font-size:12px; color:#61776d; white-space:pre-wrap; overflow-wrap:anywhere; max-height:100px; overflow:auto; }
    #apply { width:100%; border:0; border-radius:11px; padding:10px; background:#dff0c3; color:#25421c; font-weight:650; }
    #status { margin:13px 0 0; font-size:12px; color:#61776d; } .foot { margin:14px 0 0; padding-top:10px; border-top:1px solid #e5ece7; color:#7b8c83; font-size:10px; }
    @media(prefers-reduced-motion:reduce) { button { transition:none; } button:hover:not(:disabled) { transform:none; } }
  </style><button id="launcher" aria-expanded="false" aria-controls="panel" aria-label="Open writing assistant">✦ ط</button><section id="panel" class="box" hidden aria-label="ط writing assistant"><div class="row"><span class="mark" aria-hidden="true">✦</span><div class="identity"><strong><span lang="ur" dir="rtl">ط</span></strong><span class="tag">A little help with words</span></div><button id="close" aria-label="Close assistant">×</button></div><div id="scratch-area" hidden><label id="scratch-label" for="scratch">Write or speak a message on any page</label><textarea id="scratch" dir="auto" maxlength="3000" placeholder="Type English or Roman Urdu…"></textarea></div><div class="actions"><button id="translate" class="action primary" title="Alt + Shift + E"><span class="symbol" aria-hidden="true">A ↗</span><b>Change to English</b><small>English mein badlein</small></button><button id="fix" class="action" title="Alt + Shift + F"><span class="symbol" aria-hidden="true">✓</span><b>Fix mistakes</b><small>Isi zubaan mein theek karein</small></button></div><button id="voice" aria-pressed="false">🎙 Speak Urdu → English</button><p id="heard" dir="auto" hidden></p><p id="status" role="status">Your words, just a little clearer.</p><textarea id="result" aria-label="Suggested message" dir="auto" readonly hidden></textarea><button id="copy" hidden style="width:100%;margin-bottom:8px;border:1px solid #dce6e2;border-radius:10px;padding:9px;background:white;color:#214c3e">Copy message</button><button id="apply" hidden>Use this message ↗</button><p class="foot">Voice uses your browser’s speech service; recognized words go to Google for translation. The mic starts only when you click.</p></section>`;
  document.documentElement.append(host);
  const $ = id => root.getElementById(id);
  let target = null, snapshot = "", revision = 0, busy = false;
  const topPage = window.top === window;
  if (!topPage) host.style.display = "none";
  function openPanel() {
    host.style.display = "block"; $("panel").hidden = false; $("launcher").hidden = true;
    $("launcher").setAttribute("aria-expanded", "true");
    $("scratch-area").hidden = target !== $("scratch");
  }
  function collapsePanel() {
    $("panel").hidden = true; $("launcher").hidden = false;
    $("launcher").setAttribute("aria-expanded", "false");
    host.style.display = topPage ? "block" : "none";
  }
  $("launcher").onclick = () => {
    if (!target?.isConnected) { target = $("scratch"); reset(); }
    openPanel();
    if (target === $("scratch")) target.focus();
  };
  $("scratch").addEventListener("input", () => { if (target === $("scratch")) reset(); });
  $("copy").onclick = async () => {
    try { await navigator.clipboard.writeText($("result").value); $("status").textContent = "Copied. Paste it wherever you like."; }
    catch { $("result").focus(); $("result").select(); $("status").textContent = "Press Ctrl+C or ⌘+C to copy the selected message."; }
  };
  let voiceSession = null;
  function stopVoice(cancel = true) {
    const session = voiceSession;
    if (!session) return;
    if (cancel) { session.cancelled = true; voiceSession = null; }
    clearTimeout(session.timer);
    try { cancel ? session.recognition.abort() : session.recognition.stop(); } catch {}
    if (cancel) voiceControls(false);
  }
  function voiceControls(listening) {
    $("voice").textContent = listening ? "■ Stop & translate" : "🎙 Speak Urdu → English";
    $("voice").setAttribute("aria-pressed", String(listening));
    $("fix").disabled = $("translate").disabled = listening || busy;
  }
  $("voice").onclick = () => {
    if (voiceSession) { stopVoice(false); return; }
    if (busy || !target?.isConnected) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { $("status").textContent = "Voice is unavailable in this browser. Try Google Chrome, or type Urdu instead."; return; }
    if (!window.isSecureContext) { $("status").textContent = "Voice needs an HTTPS website. Open the secure version of this chat."; return; }
    reset();
    const session = { recognition: new Recognition(), field: target, draft: read(target), revision, text: "", cancelled: false, failed: false };
    voiceSession = session;
    const recognition = session.recognition;
    recognition.lang = "ur-PK";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    voiceControls(true);
    $("status").textContent = "Allow microphone access, then speak Urdu. Click Stop when finished.";
    recognition.onstart = () => { if (!session.cancelled) $("status").textContent = "Listening… Urdu mein bolein. Click Stop to translate."; };
    recognition.onresult = event => {
      if (session.cancelled || voiceSession !== session) return;
      let finalText = "", preview = "";
      for (let i = 0; i < event.results.length; i++) {
        const words = event.results[i][0].transcript;
        preview += words + " ";
        if (event.results[i].isFinal) finalText += words + " ";
      }
      session.text = finalText.trim();
      $("heard").textContent = preview.trim(); $("heard").hidden = false;
      if (preview.length > 3000) { session.failed = true; stopVoice(false); $("status").textContent = "That recording is too long. Try a shorter message."; }
    };
    recognition.onerror = event => {
      if (session.cancelled) return;
      session.failed = true;
      const errors = { "not-allowed": "Microphone access was denied. Allow it in this site's browser permissions and try again.", "audio-capture": "No microphone available. Connect or enable your microphone.", "no-speech": "No speech detected. Try again and speak clearly.", "network": "Speech service could not connect. Check your internet and try again.", "language-not-supported": "Urdu speech recognition is unavailable in this browser. Type Urdu instead.", "service-not-allowed": "The browser blocked its speech service. Try Google Chrome or type Urdu instead." };
      $("status").textContent = errors[event.error] || "Voice recording stopped. Please try again.";
    };
    recognition.onend = () => {
      clearTimeout(session.timer);
      if (voiceSession !== session) return;
      voiceSession = null; voiceControls(false);
      if (session.cancelled || session.failed || revision !== session.revision || target !== session.field || !target.isConnected || read(target) !== session.draft) return;
      if (!session.text) { $("status").textContent = "No speech detected. Click the mic and try again."; return; }
      void rewrite("translate", session.text);
    };
    try { recognition.start(); session.timer = setTimeout(() => stopVoice(false), 60000); }
    catch { stopVoice(); $("status").textContent = "Could not start the microphone. Check site permissions and try again."; }
  };
  window.addEventListener("pagehide", () => stopVoice());
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopVoice(); });
  function editable(node) {
    if (!(node instanceof Element)) return null;
    let field = node.closest('textarea, input, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]');
    if (!field || field.disabled || field.readOnly || field.closest('[inert], [contenteditable="false"]')) return null;
    if (field instanceof HTMLInputElement && field.type !== "text") return null;
    if (/password|cc-|one-time-code/.test(field.getAttribute("autocomplete") || "")) return null;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
      if (!field.isContentEditable) return null;
      while (field.parentElement?.isContentEditable) field = field.parentElement;
    }
    return field;
  }
  const read = field => "value" in field ? field.value : field.innerText;
  function reset() { stopVoice(); revision++; $("heard").hidden = true; $("result").hidden = true; $("copy").hidden = true; $("apply").hidden = true; $("status").textContent = "Your words, just a little clearer."; }
  document.addEventListener("focusin", event => {
    if (event.target === host) return;
    const field = editable(event.target);
    if (!field) { target = null; reset(); collapsePanel(); return; }
    if (field !== target) { target = field; reset(); }
    openPanel();
  }, true);
  document.addEventListener("input", event => { if (target && (event.target === target || target.contains(event.target))) reset(); }, true);
  $("close").onclick = () => { reset(); collapsePanel(); $("launcher").focus(); };
  async function rewrite(mode, spokenText = null) {
    if (busy || !target?.isConnected) return;
    const field = target;
    snapshot = read(field);
    const source = spokenText === null ? snapshot : spokenText;
    if (!source.trim() || source.length > 3000) { $("status").textContent = "Enter a message of 1–3,000 characters."; return; }
    reset(); const requestRevision = revision;
    if (spokenText !== null) { $("heard").textContent = spokenText; $("heard").hidden = false; }
    busy = true; $("voice").disabled = true; $("fix").disabled = $("translate").disabled = true; $("status").textContent = mode === "translate" ? "Finding the right English words…" : "Tidying up spelling and grammar…";
    try {
      const response = await chrome.runtime.sendMessage({ type: "bosscomm.correct", text: source, mode });
      if (revision !== requestRevision || target !== field || !field.isConnected || read(field) !== snapshot) return;
      if (response?.error) throw new Error(response.error);
      if (!response?.text) throw new Error("No correction received. Try again.");
      $("result").value = response.text; $("result").hidden = false; $("copy").hidden = false;
      $("apply").hidden = field === $("scratch") || response.text === snapshot;
      $("status").textContent = response.text === snapshot ? "Looks good — no changes needed." : "Ready. Review your message below.";
    } catch (error) { if (revision === requestRevision) $("status").textContent = error.message || "Reload this page and try again."; }
    finally { busy = false; $("voice").disabled = false; $("fix").disabled = $("translate").disabled = false; }
  };
  $("fix").onclick = () => rewrite("correct");
  $("translate").onclick = () => rewrite("translate");
  $("apply").onclick = () => {
    const field = target, text = $("result").value;
    if (!field?.isConnected || read(field) !== snapshot || !editable(field)) { reset(); $("status").textContent = "Your draft changed. Check it again."; return; }
    field.focus();
    if ("value" in field) {
      const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value").set.call(field, text);
      field.dispatchEvent(new InputEvent("input", { bubbles:true, inputType:"insertReplacementText", data:text }));
    } else {
      const selection = window.getSelection(), range = document.createRange();
      range.selectNodeContents(field); selection.removeAllRanges(); selection.addRange(range);
      // Use the browser editing path to preserve undo and notify rich-text editors.
      if (!document.execCommand("insertText", false, text)) { $("status").textContent = "This editor does not support Apply. Copy the correction and paste it."; return; }
    }
    reset(); $("status").textContent = "Message updated. You’re ready to send.";
  };
  document.addEventListener("keydown", event => {
    if (event.altKey && event.shiftKey && ["KeyE", "KeyF"].includes(event.code) && !event.isComposing && editable(event.target)) { event.preventDefault(); openPanel(); $(event.code === "KeyE" ? "translate" : "fix").click(); }
  }, true);
})();
