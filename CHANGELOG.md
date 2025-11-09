# Changelog

All notable changes to Perplexity Model Watcher will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

No unreleased changes.

---

## [0.2.0] - 2025-11-09

### 🎉 Major Release: Firefox Support

This release adds full Firefox support through Manifest V3, complete build system automation, and cross-browser API compatibility.

### Added

#### Browser Support
- ✨ **Firefox support** with Manifest V3 (minimum Firefox 109.0)
- ✅ Full compatibility with Firefox Developer Edition
- 🌐 Cross-browser extension works in Chrome, Brave, and Firefox
- 📦 Separate browser-specific distributions (`dist/chrome/`, `dist/firefox/`)

#### Build System
- 🔧 Automated cross-browser build system
- 📝 Build script (`build/build.js`) for generating browser-specific distributions
- 🔄 Manifest merging logic for Firefox-specific overrides
- ✅ Build validation script (`build/test-build.js`)
- 🧪 Automated testing with `npm test`
- 🎯 Browser-specific npm scripts (`build:chrome`, `build:firefox`)

#### Configuration
- ⚙️ `web-ext-config.mjs` for Firefox development workflow
- 📋 `manifest-firefox.json` for Firefox-specific manifest overrides
- 🔧 Firefox-specific settings (extension ID, minimum version, background scripts)

#### Developer Experience
- 🚀 Hot-reload development for Firefox (`npm run dev:firefox`)
- ✅ Automated lint validation (`npm run lint:firefox`)
- 📦 Package generation scripts for both browsers
- 🧹 Clean command for build artifacts (`npm run clean`)

#### Dependencies
- 📚 `web-ext` - Mozilla's extension development CLI
- 🔄 `webextension-polyfill` - Cross-browser API compatibility
- 📁 `fs-extra` - Enhanced file system operations

#### Documentation
- 📖 `CONTRIBUTING.md` - Comprehensive contribution guidelines
- 📝 `MANIFEST_DIFFERENCES.md` - Chrome vs Firefox manifest technical documentation
- 🔍 `BROWSER_COMPATIBILITY.md` - API compatibility investigation report
- 📋 `TESTING_FIREFOX.md` - Firefox functionality testing checklist
- 📋 `TESTING_CHROME.md` - Chrome regression testing checklist
- 📊 `LINT_REPORT.md` - web-ext validation results
- 📚 Updated README.md with Firefox installation instructions

### Changed

#### Project Structure
- 🗂️ **BREAKING**: Moved all source files from root to `src/` directory
- 📁 Introduced `build/` directory for build scripts
- 📦 Introduced `dist/` directory for browser-specific builds
- 🔧 Source files now in `src/`, builds in `dist/chrome/` and `dist/firefox/`

#### API Compatibility
- 🔄 **BREAKING**: Refactored all `chrome.*` API calls to `browser.*` namespace
- ⚡ Converted callback-based APIs to Promise-based (`async`/`await`)
- 🌐 Integrated WebExtension Polyfill for unified API access
- 📚 All scripts now use `browser.*` for cross-browser compatibility

#### Manifest Configuration
- 📝 Base `manifest.json` optimized for Chrome
- 🦊 Added `manifest-firefox.json` for Firefox-specific overrides
- 🔧 Firefox manifest includes `browser_specific_settings.gecko`
- 🔄 Firefox uses `background.scripts` instead of `background.service_worker`

#### Build Process
- 🏗️ **BREAKING**: Extension must be built before use (`npm run build`)
- 📦 Chrome build uses unchanged base manifest
- 🦊 Firefox build merges base manifest with Firefox overrides
- ✅ Automated validation ensures build correctness

### Fixed

- 🐛 Deep merge function now correctly replaces `background` property (not merges)
- ✅ Firefox manifest no longer contains `service_worker` property
- 🔧 web-ext configuration uses correct `.mjs` extension for ES Modules
- 🦊 Removed restricted Firefox preferences from web-ext config

### Technical Details

#### Manifest V3 Compatibility
- Chrome: Service worker background script
- Firefox: Event page background scripts
- Build system handles differences automatically

#### API Namespace Unification
- Before: `chrome.storage.local.get(['key'], callback)`
- After: `await browser.storage.local.get(['key'])`
- Works identically in both Chrome and Firefox

#### Extension IDs
- Chrome: Auto-generated from package
- Firefox: `model-watcher@perplexity.ai` (explicitly set)

### Migration Guide for Developers

If you're updating from v0.1.1:

1. **Pull latest changes**:
   ```
   git pull origin main
   ```

2. **Install new dependencies**:
   ```
   npm install
   ```

3. **Build the extension**:
   ```
   npm run build
   ```

4. **Load in browser**:
   - **Chrome**: Load `dist/chrome/` in chrome://extensions/
   - **Firefox**: Run `npm run dev:firefox` or load `dist/firefox/`

5. **Note**: Source files moved from root to `src/` directory

### Upgrade Notes

- ⚠️ **BREAKING**: Project structure changed - source files now in `src/`
- ⚠️ **BREAKING**: Must run build before using extension
- ⚠️ **BREAKING**: API calls changed from `chrome.*` to `browser.*`
- ✅ All existing functionality preserved
- ✅ No user-facing changes (extension works the same)

### Browser Support

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome | 88+ | ✅ Supported |
| Brave | Chromium-based | ✅ Supported |
| Firefox | 109+ | ✅ Supported |

---

## [0.1.1] - 2025-11-05

### Initial Release

- 🎯 Real-time model detection on Perplexity.ai
- 🖼️ Draggable/minimizable overlay display
- 🟢/🔴 Badge status indicators (OK/Mismatch)
- 📱 Popup interface showing model data
- ⚙️ Options page for overlay toggle
- 🔐 Privacy-first: No data collection
- ⚡ Minimal permissions
- 🌐 Chrome and Brave support only

### Features

- Model detection via network interception
- Visual overlay with status indicators
- Toolbar badge with color-coded status
- Per-tab model tracking
- Persistent settings with browser storage
- Draggable overlay with position memory

---

[Unreleased]: https://github.com/apix7/perplexity-model-watcher/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/apix7/perplexity-model-watcher/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/apix7/perplexity-model-watcher/releases/tag/v0.1.1
[0.1.0]: https://github.com/apix7/perplexity-model-watcher/releases/tag/v0.1.0
