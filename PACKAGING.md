# Extension Packaging Guide

This document explains how to create distribution packages for both Chrome and Firefox.

---

## Chrome/Brave Package

### Create Package

```
# Build and package
npm run build:chrome
npm run package:chrome
```

Output: `artifacts/chrome-extension.zip`

### Package Contents

- manifest.json (Manifest V3, service worker)
- background.js
- interceptor.js
- page-probe.js
- popup.html, popup.js
- options.html, options.js
- browser-polyfill.js

### Manual Packaging (Alternative)

```
cd dist/chrome
zip -r ../../artifacts/chrome-extension.zip .
cd ../..
```

### Upload to Chrome Web Store

1. Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload `artifacts/chrome-extension.zip`
4. Fill in store listing details
5. Submit for review

---

## Firefox Package

### Create Package

```
# Build and package
npm run build:firefox
npm run package:firefox
```

Output: `artifacts/perplexity_model_watcher-0.2.0.xpi`

### Package Contents

- manifest.json (Manifest V3, event page scripts, browser_specific_settings)
- background.js
- interceptor.js
- page-probe.js
- popup.html, popup.js
- options.html, options.js
- browser-polyfill.js

### Upload to Firefox Add-ons (AMO)

1. Visit [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Click "Submit a New Add-on"
3. Upload the `.xpi` file
4. Fill in listing details
5. Submit for review

---

## Verification

### Chrome Package

```
# List contents
unzip -l artifacts/chrome-extension.zip

# Test installation
unzip artifacts/chrome-extension.zip -d /tmp/chrome-test
# Load /tmp/chrome-test in chrome://extensions/
```

### Firefox Package

```
# List contents
unzip -l artifacts/*.xpi

# Test installation
npx web-ext run --source-dir=artifacts/ --artifact=*.xpi
```

---

## Package Sizes

Target sizes (for reference):
- Chrome: ~100-200 KB
- Firefox: ~100-200 KB (similar to Chrome)

If packages are significantly larger, check for:
- Unnecessary files included
- Source maps (should be excluded)
- Development files (should be excluded)

---

## Troubleshooting

**Package too large**:
- Remove source maps
- Exclude development files
- Check for duplicate files

**Package won't install**:
- Validate manifest.json
- Check file permissions
- Verify all required files present

**Chrome Web Store rejection**:
- Run validation: `npm run validate`
- Check manifest compliance
- Review store policies

**AMO rejection**:
- Run lint: `npm run lint:firefox`
- Fix all errors
- Address warnings
