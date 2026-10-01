# Verification

Package: BossComm AI 1.0.0 · September 30, 2026

## Automated checks

**36 tests passed.** The tests run the actual `popup.js` in Node’s VM with isolated DOM, Chrome storage, clipboard, and Gemini-response doubles. They do not send requests to Google.

With Node.js 18 or later installed, open a terminal in the `BossComm-AI` folder and run:

```bash
node --check popup.js
node --test tests/popup.test.cjs
```

Node is only needed for these developer tests. Installing and using the extension requires no Node or npm setup.

Coverage includes:

- Manifest V3, required local assets, scoped permissions, and external-script restrictions.
- Settings initialization, key saving/removal/masking, invalid settings, and storage failures.
- Empty/oversized input, all three tone instructions, separate source content, and header authentication.
- Successful plain-text results, literal HTML-like output, exclusion of thought parts, and clearing stale results.
- Copy success/feedback and clipboard failure with manual selection.
- Session restoration, cleared drafts, corrupted saved values, and ordering of asynchronous draft writes.
- HTTP 400, 401, 403, 404, 429, 500, 503, and 504 responses, including credential redaction.
- Network failures, invalid JSON, missing/empty candidates, blocked output, and truncated responses.
- Single-request guarding, cancellation, 45-second timeouts, popup closure, and keyboard shortcuts.

The manifest JSON and JavaScript syntax were also checked. Gemini’s model, authentication, and request format were checked against current official documentation; see README references.

## Limits of verification

An actual Chrome/Chromium extension session and visual browser rendering were **not** tested in the build environment: no browser binary was available, and the browser download did not produce a usable installation. The automated DOM doubles do not verify layout, actual browser permissions, focus behavior, or native clipboard/storage implementation.

A live Gemini conversion was **not** run because no user API key was supplied. The tests verify API request structure and response/error handling, not translation quality, real account eligibility, quotas, latency, or live provider availability.

## Manual acceptance check after installation

1. Follow README to load the folder at `chrome://extensions`. Confirm Chrome shows no manifest errors.
2. Open the popup and Settings. Check that both views remain readable, scrolling works where needed, and Tab/Shift+Tab show visible focus. Check Show/Hide and Back.
3. Save your real Gemini key, close the popup, and reopen it. Confirm “API key saved” appears.
4. Enter `Ashhad bhai backend mostly complete hai API slow hai us par kam kar raha hon`. Convert with each tone. Check that the output preserves “mostly complete” and does not promise a completion date.
5. Try an Urdu-script message and an English message. Check that questions remain questions, names/numbers remain correct, and only one English rewrite appears.
6. Click Copy and paste into a text editor. Confirm “Copied!” appears and the pasted text exactly matches the output.
7. Type a draft, close/reopen the popup, and confirm it returns. Click Clear, reopen, and confirm it is empty.
8. Start a conversion and cancel it. Confirm the original text remains and another conversion is possible. Check a temporary network disconnection produces an understandable error.
9. Remove the key in Settings and reopen the popup. Confirm it asks for a key again. Restore the key when finished.

Use text you are comfortable sending to Google for live checks. Review generated messages before sending them to someone else.


## Inline assistant verification (1.1.0)

Run `node --test tests/*.test.cjs`. Additional worker tests cover sender validation, input bounds, credentials, request format, missing settings, malformed/incomplete responses and quota errors. Live Gemini and logged-in WhatsApp verification still require the user's account.

Manual checks: reload extension and refresh chat tabs; focus WhatsApp's composer; correct English and translate Roman Urdu; Apply and confirm the draft updates without sending. While a request runs, edit the draft or switch fields and confirm the result is discarded. Check textarea and contenteditable editors, missing key, keyboard shortcut, quota error and unsupported-editor copy fallback.


## Version 1.4.0 checks

43 Node regression tests pass. A headless Chrome DOM harness with mocked speech/Gemini passed launcher visibility, close/reopen, standalone translation, copy visibility, page-field apply, Urdu voice routing, recording cancellation and permission-error checks. Live microphone recognition and live Gemini are not covered by this harness.
