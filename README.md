# ط

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
7. Chrome should show the ط extension card. Click the puzzle-piece **Extensions** button beside the address bar and pin **ط**.
8. Click the ط icon to open its popup. Do not double-click `popup.html`; extension storage only works when Chrome loads it as an extension.

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

