# Manifest Differences: Chrome vs Firefox

This document explains the key differences between Chrome (Chromium-based browsers) and Firefox manifest configurations for the Perplexity Model Watcher extension.

## Overview

The extension uses **Manifest V3** for both browsers but requires different configurations due to fundamental architectural differences in how each browser implements the WebExtensions API.

## Key Differences Summary

| Feature | Chrome/Brave | Firefox | Reason |
|---------|--------------|---------|--------|
| **Background Script** | Service Worker | Event Page Scripts | Firefox uses persistent event pages instead of service workers for better compatibility |
| **Extension ID** | Optional | Required | Firefox requires unique ID in `browser_specific_settings.gecko.id` |
| **Minimum Version** | Not specified | 109.0+ required | Firefox 109 was the first stable release with MV3 support (Jan 2023) |
| **API Namespace** | `chrome.*` | `browser.*` (with `chrome.*` fallback) | Firefox uses Promise-based `browser` namespace natively |
| **API Style** | Callback-based | Promise-based | Firefox APIs return Promises by default |

---

## 1. Background Scripts

### Chrome (Service Worker)

```json
{
  "background": {
    "service_worker": "background.js"
  }
}
```

**Characteristics:**
- Event-driven, non-persistent
- Terminates when idle to save resources
- No direct DOM access
- Limited to specific Chrome APIs


### Firefox (Event Page Scripts)

```json
"background": {
  "scripts": ["background.js"]
}
```

**Characteristics:**
- Event page that can be persistent
- Better compatibility with existing extensions
- Full browser API access
- Allows multiple script files

**Why the difference?**
Firefox prioritized backward compatibility and developer experience. While Chrome moved to service workers for performance, Firefox maintained event pages to ensure existing extensions continue working reliably.

---

## 2. Extension Identification

### Chrome

```json
{
  "name": "Model Watcher",
  "version": "0.2.0"
}
```
Extension ID is automatically generated based on the public key during packaging. No manifest configuration needed.

### Firefox

```json
{
  "browser_specific_settings": {
    "gecko": {
      "id": "model-watcher@perplexity.ai",
      "strict_min_version": "109.0"
    }
  }
}
```

**Required fields:**
- `id`: Unique identifier in email format (`name@domain.ext`) or GUID format
- `strict_min_version`: Minimum Firefox version (109.0 for MV3)

**Why the difference?**  
Firefox requires explicit IDs for extension management, updates, and security. Chrome generates IDs from cryptographic keys during the packaging process.

---

## 3. API Namespace Differences

### Chrome

```js
// Chrome uses the chrome.* namespace
chrome.storage.local.get(['key'], (result) => {
console.log(result.key);
});

chrome.tabs.query({active: true}, (tabs) => {
console.log(tabs);
});
```

**Characteristics:**
- Callback-based APIs
- `chrome.*` namespace exclusively
- Requires callback functions for async operations

### Firefox

```js
// Firefox uses browser.* namespace with Promises
const result = await browser.storage.local.get(['key']);
console.log(result.key);

const tabs = await browser.tabs.query({active: true});
console.log(tabs);

// Firefox also supports chrome.* for compatibility
chrome.storage.local.get(['key'], (result) => {
console.log(result.key); // Also works
});
```


**Characteristics:**
- Promise-based APIs by default
- `browser.*` namespace (recommended)
- `chrome.*` namespace supported for compatibility
- Can use async/await syntax

**Why the difference?**  
Firefox adopted modern JavaScript async patterns (Promises) from the start, while Chrome maintained callback-based APIs for backward compatibility. Firefox provides `chrome.*` as a compatibility layer.

---

## 4. Cross-Browser Compatibility Solution

### Using WebExtension Polyfill

To write code that works in both browsers, we use the `webextension-polyfill` library:

```js
// Import the polyfill
import browser from 'webextension-polyfill';

// Write once, run everywhere with Promises
const result = await browser.storage.local.get(['key']);
const tabs = await browser.tabs.query({active: true});
```

**Benefits:**
- Single codebase for both browsers
- Consistent Promise-based API
- Automatic namespace handling
- Better async/await support

---

## 5. Build System Strategy

### Directory Structure

```txt
src/
├── manifest.json # Base manifest (Chrome compatible)
└── manifest-firefox.json # Firefox-specific overrides

dist/
├── chrome/
│ └── manifest.json # Final Chrome manifest (unchanged)
└── firefox/
└── manifest.json # Final Firefox manifest (merged)
```

### Build Process

1. **Chrome Build**: Copy `src/manifest.json` directly to `dist/chrome/`
2. **Firefox Build**: Merge `src/manifest.json` with `src/manifest-firefox.json` to create `dist/firefox/manifest.json`

### Merge Logic

The build script (`build/build.js`) performs a deep merge:

```js
// Pseudocode
const baseManifest = readJSON('src/manifest.json');
const firefoxOverrides = readJSON('src/manifest-firefox.json');
const firefoxManifest = deepMerge(baseManifest, firefoxOverrides);
writeJSON('dist/firefox/manifest.json', firefoxManifest);
text
```

**Override behavior:**
- `background.service_worker` is replaced with `background.scripts`
- `browser_specific_settings` is added
- All other fields remain from base manifest

---

## 6. Manifest Version History

### Firefox MV3 Timeline

- **Firefox 109** (Jan 2023): First stable MV3 support
- **Firefox 120** (Nov 2023): Improved mixed manifest handling
- **Firefox 121** (Dec 2023): Full cross-browser manifest compatibility

### Chrome MV3 Timeline

- **Chrome 88** (Jan 2021): Initial MV3 support
- **Chrome 127** (Jul 2024): MV2 deprecation warnings begin
- **Chrome 131** (Nov 2024): MV2 extensions disabled in pre-stable channels

---

## 7. Testing Considerations

### Chrome Testing

#### Load unpacked extension
1. Open `chrome://extensions/`
2. Enable "Developer Mode"
3. Click "Load Unpacked"
4. Select `dist/chrome/` directory


### Firefox Testing

#### Using web-ext (recommended)

```bash
npm run dev:firefox
```

#### Or manually
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select `dist/firefox/manifest.json`

---


---

## 8. Common Pitfalls

### ❌ Don't: Mix service workers and scripts in the same build

```json
{
  "background": {
    "service_worker": "background.js",
    "scripts": ["background.js"] // Conflict!
  }
}
```


### ✅ Do: Use browser-specific manifests

```json
// Chrome manifest
{
  "background": {
    "service_worker": "background.js"
  }
}

// Firefox manifest
{
  "background": {
    "scripts": ["background.js"]
  }
}
```

### ❌ Don't: Use chrome.* directly in cross-browser code

```js
// Not recommended
chrome.storage.local.get(['key'], callback);
```

### ✅ Do: Use webextension-polyfill or browser.*

```js
// Recommended
const result = await browser.storage.local.get(['key']);
```

---

## 9. Resources

### Official Documentation

- [Mozilla: Manifest V3 Migration Guide](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/)
- [Mozilla: browser_specific_settings](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings)
- [Chrome: Manifest V3 Overview](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [MDN: Chrome Incompatibilities](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities)

### Tools

- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) - Cross-browser API compatibility
- [web-ext](https://github.com/mozilla/web-ext) - Firefox extension development CLI

---

## 10. Conclusion

Understanding these manifest differences is crucial for maintaining a cross-browser extension. Our build system handles the complexity automatically, but developers should be aware of:

1. **Background script architecture** differs fundamentally
2. **API namespaces** require polyfill for consistency
3. **Extension IDs** are handled differently by each browser
4. **Testing workflows** vary between browsers

By maintaining separate manifests and using the webextension-polyfill, we ensure the extension works reliably across both Chrome and Firefox while keeping the codebase maintainable.
