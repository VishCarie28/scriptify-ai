# 🎬 Scriptify AI – by Vishal Singh

**Scriptify AI** is a powerful yet simple Chrome extension that helps you **record user interactions**, **generate Playwright test scripts**, and **enhance them using GPT** – all visually through a floating panel on any webpage.

---

## ✅ Features

- 🎥 One-click Playwright script recording using `npx playwright codegen`
- 🤖 GPT-based enhancement for smarter selectors, structure, and assertions
- 📋 Copy, ⬇️ Download, and preview scripts from the UI
- 💾 Backend support for saving and fetching test scripts

---

## 🚀 How It Works (Flow Overview)

1. **Start Local Server Manually**
   - Run the backend server to handle recording, saving, and GPT enhancement.

2. **Inject Panel on Any Page**
   - Load the Chrome extension. The panel auto-injects into all pages.

3. **Click “Start Recording”**
   - Sends the current URL to the backend. Starts `npx playwright codegen <url>` on the server.

4. **Click “Stop & Save”**
   - Stops the session and saves the generated script to the server.

5. **Click “Enhance with GPT”**
   - Sends the raw script to the GPT API for smart improvements.

6. **Click “Copy” or “Download”**
   - Instantly copies the enhanced script to your clipboard or downloads it as `.spec.js`.

---

## 🛠️ Setup Instructions

### 1. Clone the Project

```bash
git clone https://github.com/VishCarie28/scriptify-ai.git
cd scriptify-ai
```

---

### 2. Start the Backend Server

Make sure you're in the backend directory and then run:

```bash
node codegen-server.js
```

> 🧠 This will start the server on `http://localhost:4000` – required for all Chrome extension actions to work.

---

### 3. Load the Extension

1. Go to `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **"Load unpacked"**
4. Select the `extension/` folder (where `manifest.json` is present)

---

### 4. Use Scriptify AI

Navigate to any webpage and you’ll see the floating Scriptify AI panel. Use the buttons as described in the **Flow** section.

---

## 📁 File Structure

```
scriptify-ai/
├── backend/
│   ├── codegen-server.js
│   ├── gpt-enhancer.js
│   ├── routes/
│   ├── scripts/          # Saved scripts
│   ├── .env              # GPT API key
├── extension/
│   ├── manifest.json
│   ├── inject-panel.js
│   ├── icons/
│   └── other assets
```

---

## ⚙️ Requirements

- Node.js installed
- OpenAI API Key (in `.env`)
- Google Chrome
- Playwright installed globally or locally

Install Playwright (if not installed):

```bash
npm install -g playwright
```

---

## 🧪 Example Commands

Enhancing with GPT works by calling:

```
POST /gpt/enhance
Body: { "script": "<your-script-here>" }
```

Saving script:

```
POST /save
Body: { "script": "<your-script-here>" }
```

---

## 🧰 Notes

- 💡 You **must** start the backend manually first. All UI buttons depend on the server running.
- Scripts are saved in the `scripts/` folder.
- GPT enhancements require a valid API key in `.env`.

---

## ✨ Coming Soon

- ✅ UX polish and onboarding guide
- ✅ Chrome Web Store launch

---

## 👨‍💻 Created by

Vishal Singh
**QA Engineer & Tech Enthusiast** | carie.vishal@gmail.com
