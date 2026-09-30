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
