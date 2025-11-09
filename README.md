# 🔍 Perplexity Model Watcher

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.1-brightgreen.svg)](https://github.com/apix7/perplexity-model-watcher/releases)

> Brave/Chrome extension that shows Perplexity's `display_model` and `user_selected_model` in‑page and on the toolbar. 🟢 OK when equal, 🔴 on mismatch. Privacy‑friendly, minimal permissions.

---

## ✨ Features

- 🎯 Real‑time: watches fetch/XHR responses and extracts model fields
- 🖼️ Overlay: draggable/minimizable card with colored status chip
- 🟢/🔴 Badge: OK when display == user‑selected; ! on mismatch
- 🔐 Privacy‑first: no data collection, all local
- ⚡ Minimal permissions: `storage`, `tabs`, host = `https://*.perplexity.ai/*`

## 📚 Documentation

- **[Manifest Differences](MANIFEST_DIFFERENCES.md)** - Detailed explanation of Chrome vs Firefox manifest configurations
- **[Privacy Policy](PRIVACY.md)** - Data collection and privacy practices
- **[Contributing Guide](CONTRIBUTING.md)** - Development guidelines (coming soon)

---

## ✨ Firefox and mobile devices workaround ✨

1. **Original URL**
   
https://www.perplexity.ai/search/analyze-this-week-s-most-signi-l0URrTaLRw2jqeFyjlr8k1

2. **Replace** the segment `search` with `rest/thread`.
   
https://www.perplexity.ai/rest/thread/analyze-this-week-s-most-signi-l0URrTaLRw2jqeFyjlr8k1

3. **Open** the new URL in your browser.  

4. Press **Ctrl + F** and search for the strings  

- `display_model`  
- `user_selected_model`  


---

## 🚀 Install (Developer Mode)

1. Clone the repo (or download the zip and extract):
   ```bash
   git clone https://github.com/apix7/perplexity-model-watcher.git
   cd perplexity-model-watcher
   ```
2. Open the extensions page:
   - Brave: `brave://extensions`
   - Chrome: `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select this folder

---

## ⚙️ Options

- Toggle the in‑page overlay from the Options page.

---

## 🛡️ Privacy & Permissions

- No data is sent anywhere. See [PRIVACY.md](PRIVACY.md).
- Permissions:
  - `storage` — save overlay toggle
  - `tabs` — update toolbar badge
  - Host access: `https://*.perplexity.ai/*` only

---

## 🤝 Contributing

PRs welcome! Open an issue for ideas/bugs.

---

## Development Setup

### Firefox Developer Edition (Recommended)

For the best development experience, install Firefox Developer Edition:

**Ubuntu/Debian:** Download and install to `/opt`
```bash
cd /tmp
wget "https://download.mozilla.org/?product=firefox-devedition-latest-ssl&os=linux64&lang=en-US" -O firefox-dev.tar.bz2
sudo tar -xjf firefox-dev.tar.bz2 -C /opt/
sudo mv /opt/firefox /opt/firefox-dev
```

**Create symlink:**
```bash
sudo ln -s /opt/firefox-dev/firefox /usr/local/bin/firefox-dev
```

**Verify installation:**
```bash
firefox-dev --version
```

**Then run:**
```bash
npm run dev:firefox # Opens Firefox Dev Edition with extension
```

If you don't have Firefox Developer Edition, edit `web-ext-config.mjs` and change the `firefox` path to your Firefox binary.

---

## 📄 License

MIT © 2025 Model Watcher contributors. See [LICENSE](LICENSE).
