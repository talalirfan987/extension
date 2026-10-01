# BossComm AI

A ready-to-load Chrome Manifest V3 extension that turns Roman Urdu, Urdu script, and rough English into clear workplace English. It uses your own Google Gemini API key. No build step, npm install, backend, or paid extension subscription is required to run it.

## 1. Get your Gemini API key

1. Open [Google AI Studio → API keys](https://aistudio.google.com/apikey) and sign in with your Google account.
2. Complete the first-time terms/setup if asked. New accounts may already have a default project and key.
3. Click **Create API key** if you need a key. Select or create a Google Cloud project when prompted, then copy the key. If an existing project is missing, go to **Dashboard → Projects → Import projects**, import it, and return to **API keys**.
4. Keep the key private. You will paste it into the extension’s Settings; do not put it in the source code or share it in a screenshot.
5. For free usage, use a project/model with free-tier quota and avoid enabling paid billing unless you want paid usage. Creating a key is free; API access is subject to Google’s eligibility, regional availability, model availability, and quotas. Free usage is not unlimited. The extension cannot enforce a spending cap on a Google project with billing enabled.

At the time this package was built (September 30, 2026), Google lists standard input/output for `gemini-3.5-flash-lite` as free of charge on the free tier. Check [current pricing](https://ai.google.dev/gemini-api/docs/pricing) and your AI Studio limits because these can change. See [Google’s API key guide](https://ai.google.dev/gemini-api/docs/api-key) for account-specific setup.

## 2. Install in Chrome

1. Download **BossComm-AI.zip** and extract it. Keep the extracted folder somewhere permanent, such as `Documents/BossComm-AI`.
2. Open Google Chrome on your desktop. Use Chrome 114 or later; a current Chrome release is recommended.
3. Type `chrome://extensions` in the address bar and press Enter.
4. Turn on **Developer mode** using the switch in the upper-right corner.
5. Click **Load unpacked**.
6. Select the **BossComm-AI** folder that directly contains `manifest.json`. Select the folder, not the ZIP or the `icons` folder.
7. Chrome should show the BossComm AI extension card. Click the puzzle-piece **Extensions** button beside the address bar and pin **BossComm AI**.
8. Click the BossComm AI icon to open its popup. Do not double-click `popup.html`; extension storage only works when Chrome loads it as an extension.

Chrome’s official walkthrough: [Load an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

## 3. Connect your key

1. In the popup, click **Set up** or the **gear**.
2. Paste your key into **Gemini API key**. Use **Show / Hide** if you need to inspect it.
3. Leave **Gemini model** set to `gemini-3.5-flash-lite` unless you need another available Gemini text model. Suggestions are provided; you can enter a supported model ID directly without changing the code.
4. Click **Save settings**. The key and model are saved in `chrome.storage.local` in this Chrome profile.
5. “API key saved” confirms local saving. Google validates the key when you click **Convert to English** for the first time.

**Why the model differs from the original request:** Google shut down `gemini-1.5-flash` on September 29, 2025. A new extension using that endpoint would fail. This package uses `gemini-3.5-flash-lite`, currently documented as a stable model suitable for translation. [Shutdown announcement](https://ai.google.dev/gemini-api/docs/changelog#september-29-2025) · [Current models](https://ai.google.dev/gemini-api/docs/models).

The request still goes directly from `popup.js` to Gemini’s `v1beta/models/...:generateContent` REST endpoint. Authentication uses Google’s `x-goog-api-key` header rather than putting the key in the URL. No proxy server is involved.

## 4. Convert a message

1. Type or paste up to 3,000 characters into **Your message**.
2. Pick a tone:

   | Tone | Best for |
   | --- | --- |
   | Polite & Professional — default | Work updates, requests, and client messages |
   | Short & Direct | Brief Slack or Teams replies |
   | Apologetic & Respectful | Delays, absences, mistakes, and difficult updates |

3. Click **Convert to English**, or press **Ctrl+Enter** on Windows/Linux or **⌘+Enter** on macOS.
4. Keep the popup open while the spinner is visible. **Cancel** stops waiting for a response. The extension never sends the message to a boss, client, email account, or chat app automatically.
5. Read the result and confirm the meaning, names, and dates. Click **Copy**, wait for **Copied!**, and paste wherever you want to send it.
6. Edit the input or switch tone to clear the previous result, then convert again. Click **Clear** to remove both the current draft and result.

Example input:

> Ashhad bhai backend mostly complete hai API slow hai us par kam kar raha hon

An appropriate professional rewrite:

> Ashhad, the backend is mostly complete. The API is slow, and I’m working on it.

This is an illustration, not a recorded live API response. Exact wording varies. The prompt instructs the model to preserve uncertainty and status, and never invent a deadline or promise.

## Files

| File | Purpose |
| --- | --- |
| `manifest.json` | MV3 configuration, permissions, icons, and content security policy |
| `popup.html` | Accessible popup and settings forms |
| `popup.css` | Local CSS, focus states, responsive controls, and reduced-motion support |
| `popup.js` | Settings, Gemini requests, tone prompts, validation, cancellation, and copying |
| `icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` | Bundled extension icons |
| `README.md` | This installation and usage guide |
| `TESTING.md` | Verification notes and manual acceptance checks |
| `tests/popup.test.cjs` | Runnable offline regression tests using Node’s built-in test runner |

No API keys or example credentials are included. Supplying your own real key in Settings is the only credential setup required.

## Data and security

- **Local settings:** Only the API key, model ID, and tone preference are stored persistently in `chrome.storage.local`. This is local browser storage, not encryption or an operating-system secret vault. The extension restricts access to its own trusted contexts with `setAccessLevel`.
- **Temporary messages:** The current draft and result are kept in `chrome.storage.session`, which is memory-backed and is cleared when Chrome restarts or the extension is disabled, reloaded, or updated. They survive closing and reopening the popup within the same browser session. **Clear** overwrites the stored draft and result with empty text.
- **Google requests:** Clicking Convert sends the source text plus editing/tone instructions to Google over HTTPS and authenticates using your key. There is no telemetry, analytics, chat history service, or additional backend.
- **Google handling:** The API service has its own data terms. Google’s free-tier content may be used to improve products. Review [Gemini API terms](https://ai.google.dev/gemini-api/terms) before sending confidential work material.
- **Permissions:** `storage` saves settings and the temporary draft. `clipboardWrite` enables the Copy button; no clipboard-read permission is requested. The single host permission allows requests to `generativelanguage.googleapis.com`. Content scripts run on HTTP/HTTPS pages to offer inline editing. A background worker calls Gemini. No remote scripts/fonts are loaded.
- **Output:** Model responses are assigned as textarea values, never rendered as HTML. Incomplete, blocked, malformed, and empty API responses do not become copyable results. Raw API error bodies and credentials are not logged or displayed.
- **Distribution:** This design is for users bringing their own keys. Never bundle a shared company/developer key in an extension. A service using a shared secret needs an authenticated backend and server-side quota enforcement.

## Popup lifecycle

Chrome closes an action popup when you click outside it. Because this implementation intentionally calls Gemini inside `popup.js`, conversion stops being awaited if the popup closes. Reopen it to recover the latest saved draft and convert again. A request already received by Google may still consume quota even if you cancel or close the popup. The extension performs no automatic retries or model fallback, avoiding unintended extra requests.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| “Manifest file is missing or unreadable” | Extract the ZIP and load the folder that directly contains `manifest.json`. Keep all included files together. |
| “Could not open Chrome extension storage” | Open the popup from Chrome’s toolbar after loading the unpacked extension. Update Chrome if necessary. |
| Missing API key | Open Settings, paste your key, and Save settings. |
| Invalid key / access denied | Check or create a key in AI Studio. Check project permissions, API restrictions, and supported regions. For an older unrestricted key, follow Google’s key migration/restriction guidance. Do not remove security restrictions just to suppress an error. |
| Model unavailable / HTTP 404 | Select an available Gemini text model in Settings. Do not use the retired `gemini-1.5-flash`. |
| Rate/quota limit / HTTP 429 | Wait before retrying and check AI Studio’s model/project limits. A key does not guarantee free quota for every model. |
| HTTP 400 | Check the model ID and project’s free-tier eligibility/billing status. The extension does not enable billing. |
| Network error | Check your connection, VPN, firewall, or access to Google’s API. |
| 45-second timeout | Retry with a shorter message or a faster model. |
| Blocked, empty, or incomplete result | Rephrase or shorten the message and convert again. |
| Copy fails | The extension selects the output. Press Ctrl+C or ⌘+C manually. |
| Popup closes during conversion | Reopen it; the saved draft should be present. Keep it open for the next conversion. |
| Code changes do not appear | Click the extension card’s Reload button at `chrome://extensions`, then reopen the popup. This resets temporary drafts. |

To remove only your key, use **Settings → Remove key**. This removes the saved key from Chrome; it does not revoke the key at Google. Revoke it in AI Studio if needed. To uninstall, use **Remove** on the extension card at `chrome://extensions`.

## Official references

Documentation checked September 30, 2026:

- [Gemini generateContent API](https://ai.google.dev/api/generate-content)
- [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)
- [Gemini models](https://ai.google.dev/gemini-api/docs/models)
- [Gemini pricing and free-tier data usage](https://ai.google.dev/gemini-api/docs/pricing)
- [Chrome extension storage](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [Chrome cross-origin requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests/)


## In-chat English assistant (1.1.0)

Reload BossComm AI at `chrome://extensions`, then refresh your chat tabs. Save your Gemini key once in the existing popup Settings. In WhatsApp Web or another website, focus a text field, write rough English or Roman Urdu, and click **Change to English** (or **Alt + Shift + E**). Review the preview and click **Use this message** to replace the draft. Send it yourself as usual.

Only the selected field's draft is sent to Google when you click Fix. No automatic keystroke uploads or chat-history collection. API keys remain in the trusted extension context. Editing the draft or switching fields invalidates pending suggestions. Inline drafts are not stored by the extension. Password and sensitive autocomplete fields are excluded.

Supports ordinary text inputs, textareas and standard contenteditable editors. Some custom editors may require manually copying the preview. Browser internal pages, closed shadow-root editors, desktop apps and mobile WhatsApp are not supported. This is an on-demand correction assistant, not automatic red underlining while typing.


## BossComm AI 1.2.0

Two separate actions are available in the popup and in web chat fields:
- **Change to English** translates Roman Urdu/Urdu into English (Alt + Shift + E in chats).
- **Fix mistakes** fixes spelling and grammar in the original language, including Roman Urdu, without translating (Alt + Shift + F in chats).

The new cream and forest-green interface uses a compact chat card with a preview and **Use this message**. Reload the extension and refresh web pages after updating. Existing saved keys and preferences are retained.


## Urdu voice → English (1.3.0)

Reload the extension and refresh your HTTPS chat page. Focus its message box, click **Speak Urdu → English**, allow the browser's microphone permission, and speak Urdu. Click **Stop & translate** (recording also stops after 60 seconds). Review the recognized Urdu and translated English, then click **Use this message** to replace the current draft. Save your Gemini key in Settings first.

Speech uses the browser's Web Speech recognition service with `ur-PK`; audio may be processed by that service. Recognized text is sent to Gemini for translation. The extension does not store recordings. Microphone availability, Urdu support and speech service access depend on the browser; Chrome on HTTPS is recommended. Site/iframe microphone restrictions may prevent recording. Denied permission, missing microphones, no speech and network errors are shown in the card. Closing the card, changing the draft/field, hiding the tab or leaving the page aborts recording. Voice starts only from the mic button.

Automatic typing correction remains unimplemented pending the separate approval discussed previously; voice translation is a user-started action.

Speech API references: [SpeechRecognition.start](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/start), [recognition language](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang).


## BossComm AI — website launcher (1.4.0)

The extension is named **BossComm AI**. Reload it in Chrome and refresh existing website tabs. A compact button appears at the bottom-right of regular HTTP/HTTPS pages. Click it to open the assistant even when there is no editable field: its own draft box supports translation, same-language correction, Urdu voice input and copying the result. Focusing a supported page editor switches back to editing that field. Closing the assistant leaves the launcher available. Existing settings remain saved.

Chrome restricts injection on internal pages (such as `chrome://`), the Chrome Web Store and some built-in viewers. Website access must be allowed in the extension's Chrome settings. Embedded frames show their assistant when an editable field is focused, avoiding duplicate launchers on every frame.
