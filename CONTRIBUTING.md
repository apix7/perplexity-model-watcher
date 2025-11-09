# Contributing to Perplexity Model Watcher

This guide will help you get started with contributing, whether you're fixing bugs, adding features, improving documentation, or testing.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Building the Extension](#building-the-extension)
- [Testing Guidelines](#testing-guidelines)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Firefox-Specific Considerations](#firefox-specific-considerations)
- [Where to Get Help](#where-to-get-help)

---

## Development Setup

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** for version control
- **Firefox Developer Edition** (recommended) or regular Firefox 109+
- **Chrome** or **Brave** browser

### Installation

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```
   git clone https://github.com/YOUR-USERNAME/perplexity-model-watcher.git
   cd perplexity-model-watcher
   ```

3. **Add upstream remote**:
   ```
   git remote add upstream https://github.com/apix7/perplexity-model-watcher.git
   ```

4. **Install dependencies**:
   ```
   npm install
   ```

5. **Copy the WebExtension polyfill**:
   ```
   npm run copy:polyfill
   ```

6. **Verify setup**:
   ```
   npm test
   ```

### Installing Firefox Developer Edition (Ubuntu/Linux)

```
# Download and extract
cd /tmp
wget "https://download.mozilla.org/?product=firefox-devedition-latest-ssl&os=linux64&lang=en-US" -O firefox-dev.tar.bz2
sudo tar -xjf firefox-dev.tar.bz2 -C /opt/
sudo mv /opt/firefox /opt/firefox-dev

# Create symlink
sudo ln -s /opt/firefox-dev/firefox /usr/local/bin/firefox-dev

# Verify
firefox-dev --version
```

---

## Project Structure

```
perplexity-model-watcher/
├── src/                          # Source files (EDIT HERE)
│   ├── manifest.json             # Base manifest (Chrome)
│   ├── manifest-firefox.json     # Firefox-specific overrides
│   ├── background.js             # Background script (service worker/event page)
│   ├── interceptor.js            # Content script (injected into pages)
│   ├── page-probe.js             # Page context probe (intercepts fetch/XHR)
│   ├── popup.html/js             # Extension popup UI
│   ├── options.html/js           # Options/settings page
│   └── browser-polyfill.js       # WebExtension polyfill (copied from node_modules)
│
├── build/                        # Build scripts (DON'T EDIT BUILD OUTPUTS)
│   ├── build.js                  # Main build script
│   └── test-build.js             # Build validation script
│
├── dist/                         # Generated distributions (NEVER EDIT)
│   ├── chrome/                   # Chrome/Brave build output
│   └── firefox/                  # Firefox build output
│
├── web-ext-config.mjs            # Firefox development configuration
├── package.json                  # npm scripts and dependencies
├── README.md                     # User documentation
├── MANIFEST_DIFFERENCES.md       # Technical documentation
└── BROWSER_COMPATIBILITY.md      # Compatibility report
```

**Important**: 
- ✅ **DO** edit files in `src/`
- ❌ **DON'T** edit files in `dist/` (they're auto-generated)

---

## Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-number-description
```

### 2. Make Your Changes

Edit files in the `src/` directory:

```
# Example: Edit source file
vim src/background.js

# After changes, build to see results
npm run build:firefox
npm run dev:firefox  # Test in Firefox
```

### 3. Test Your Changes

**Always test in BOTH browsers** before submitting:

```
# Test Firefox
npm run build:firefox
npm run dev:firefox

# Test Chrome
npm run build:chrome
# Manually load dist/chrome/ in chrome://extensions/

# Run automated tests
npm test

# Validate Firefox build
npm run lint:firefox
```

### 4. Commit Your Changes

Follow our [commit message guidelines](#commit-message-guidelines):

```
git add src/your-changed-file.js
git commit -m "feat: Add your feature description"
```

### 5. Push and Create Pull Request

```
# Push to your fork
git push origin feature/your-feature-name

# Open a Pull Request on GitHub
```

---

## Building the Extension

### Available npm Scripts

```
# Build for both browsers
npm run build

# Build Chrome only
npm run build:chrome

# Build Firefox only
npm run build:firefox

# Clean build artifacts
npm run clean

# Full rebuild
npm run clean && npm run build
```

### Development Builds

**Firefox** (with auto-reload):
```
npm run dev:firefox
```
Launches Firefox Developer Edition with the extension and hot-reloads on file changes.

**Chrome** (manual reload):
```
npm run build:chrome
# Load dist/chrome/ in chrome://extensions/
# Click reload button after making changes
```

---

## Testing Guidelines

### Automated Testing

```
# Run all tests
npm test

# Validate build outputs
npm run validate

# Lint Firefox extension
npm run lint:firefox
```

### Manual Testing Requirements

Before submitting a PR, manually test:

#### Core Functionality
- [ ] Model detection on Perplexity.ai
- [ ] Badge updates (OK/Mismatch status)
- [ ] Overlay display and positioning
- [ ] Overlay dragging
- [ ] Overlay minimize/restore
- [ ] Popup data display
- [ ] Options page toggle

#### Browser Compatibility
- [ ] Test in Firefox Developer Edition
- [ ] Test in Chrome
- [ ] Test in Brave (optional but recommended)
- [ ] No console errors in any browser
- [ ] Performance comparable across browsers

#### Edge Cases
- [ ] Multiple Perplexity tabs
- [ ] Rapid navigation between pages
- [ ] Browser restart (settings persist)
- [ ] No network connection handling

### Testing Checklists

Detailed testing procedures are available in:
- `TESTING_FIREFOX.md` - Firefox testing checklist
- `TESTING_CHROME.md` - Chrome regression testing checklist

---

## Code Style Guidelines

### JavaScript

- Use **ES6+ syntax** where appropriate
- Use `async`/`await` for asynchronous operations
- Use `const` for immutable values, `let` for mutable
- No `var` declarations
- Use template literals for string interpolation
- Add comments for complex logic

**Example**:
```
// ✅ Good
const result = await browser.storage.local.get(['key']);
const message = `Value is: ${result.key}`;

// ❌ Bad
chrome.storage.local.get(['key'], function(result) {
  var message = 'Value is: ' + result.key;
});
```

### Browser API Usage

**Always use `browser.*` API namespace**, never `chrome.*`:

```
// ✅ Correct - cross-browser compatible
await browser.storage.local.set({ key: 'value' });
const tabs = await browser.tabs.query({ active: true });

// ❌ Incorrect - Chrome-specific
chrome.storage.local.set({ key: 'value' });
chrome.tabs.query({ active: true }, callback);
```

### File Naming

- Use lowercase with hyphens: `my-file.js`
- JavaScript files: `.js` extension
- Configuration files: `.json` or `.mjs` as appropriate

### Formatting

- **Indentation**: 2 spaces (no tabs)
- **Line length**: Soft limit of 100 characters
- **Semicolons**: Use consistently
- **Trailing commas**: Use in multi-line arrays/objects

---

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear, structured commit messages.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting (no logic changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `build`: Build system or dependencies
- `chore`: Maintenance tasks

### Examples

```
# Feature
git commit -m "feat: Add model history tracking"

# Bug fix
git commit -m "fix: Resolve overlay positioning on mobile viewport"

# Documentation
git commit -m "docs: Update installation instructions for Firefox"

# Refactor
git commit -m "refactor: Simplify manifest merge logic"

# With scope
git commit -m "feat(firefox): Add strict_min_version to manifest"

# With body and footer
git commit -m "fix: Correct badge color for mismatch status

The badge was showing green instead of red when models mismatched.
Updated color constant to use correct hex value.

Fixes #42"
```

---

## Pull Request Process

### Before Submitting

1. **Create/update tests** for your changes
2. **Test in both browsers** (Firefox and Chrome)
3. **Run validation**: `npm test`
4. **Lint your code**: `npm run lint:firefox`
5. **Update documentation** if needed
6. **Update CHANGELOG.md** with your changes

### PR Checklist

When opening a PR, ensure:

- [ ] Code follows our style guidelines
- [ ] Commits follow conventional commit format
- [ ] All tests pass (`npm test`)
- [ ] Tested in Firefox and Chrome
- [ ] No console errors in either browser
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG.md updated
- [ ] PR description is clear and detailed

### PR Template

Use this template when creating your PR:

```
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Build/tooling

## Testing
- [ ] Tested in Firefox
- [ ] Tested in Chrome
- [ ] All automated tests pass
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots showing the changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed the code
- [ ] Commented complex code sections
- [ ] Updated documentation
- [ ] No breaking changes (or documented)

## Related Issues
Closes #[issue number]
```

### Review Process

1. **Submit PR** - Create pull request from your fork
2. **Automated checks** - Wait for CI tests to pass
3. **Code review** - Maintainer will review your code
4. **Address feedback** - Make requested changes
5. **Approval** - Once approved, PR will be merged
6. **Recognition** - You'll be added to contributors!

---

## Firefox-Specific Considerations

### Manifest Differences

When making changes that affect `manifest.json`:

- **Chrome changes**: Edit `src/manifest.json`
- **Firefox-only changes**: Edit `src/manifest-firefox.json`
- **Both browsers**: Edit both files appropriately

See [MANIFEST_DIFFERENCES.md](MANIFEST_DIFFERENCES.md) for detailed explanations.

### Background Scripts

- **Chrome**: Uses service worker (`background.service_worker`)
- **Firefox**: Uses event page scripts (`background.scripts`)
- The build system handles this difference automatically

### Testing in Firefox

```
# Quick test
npm run dev:firefox

# Lint check
npm run lint:firefox

# Check console
# Open about:debugging#/runtime/this-firefox
# Click "Inspect" on the extension
```

### Common Firefox Issues

**Issue: Extension ID required**
- Ensure `src/manifest-firefox.json` has `browser_specific_settings.gecko.id`

**Issue: Background script not loading**
- Check `background.scripts` array (not `service_worker`)
- Verify Firefox minimum version is 109.0+

**Issue: API not working**
- Use `browser.*` namespace, not `chrome.*`
- Ensure WebExtension polyfill is loaded first

---

## Build System Architecture

### How It Works

1. **Source files** in `src/` are the single source of truth
2. **Build script** (`build/build.js`) processes files:
   - Copies all files to `dist/chrome/` and `dist/firefox/`
   - For Chrome: Uses `manifest.json` as-is
   - For Firefox: Merges `manifest.json` + `manifest-firefox.json`
3. **Browser-specific manifests** handle differences automatically

### When to Rebuild

Rebuild whenever you change files in `src/`:

```
# After editing src/background.js
npm run build:firefox  # Test change in Firefox

# After editing src/manifest.json
npm run build  # Rebuild both browsers
```

### Modifying the Build System

If you need to change build behavior:

1. Edit `build/build.js`
2. Test with: `npm run build`
3. Validate with: `npm run validate`
4. Document changes in your PR

---

## Testing Guidelines

### Required Tests

All PRs must include:

1. **Automated validation**: `npm test` passes
2. **Firefox testing**: Manually tested with `npm run dev:firefox`
3. **Chrome testing**: Manually tested in chrome://extensions/
4. **Lint validation**: `npm run lint:firefox` passes with no errors

### Reporting Test Results

In your PR, include:

```
## Testing Performed

### Firefox Developer Edition XXX.X
- [ ] Model detection: ✅ Working
- [ ] Overlay display: ✅ Working
- [ ] Badge updates: ✅ Working
- [ ] All features: ✅ Working

### Chrome XXX.X
- [ ] Model detection: ✅ Working
- [ ] Overlay display: ✅ Working
- [ ] Badge updates: ✅ Working
- [ ] All features: ✅ Working

No regressions detected.
```

---

## Code Style Guidelines

### JavaScript Best Practices

**Use browser API correctly**:
```
// ✅ Correct
const data = await browser.storage.local.get(['key']);
browser.runtime.sendMessage({ type: 'UPDATE' });

// ❌ Incorrect
chrome.storage.local.get(['key'], (data) => { ... });
```

**Handle errors gracefully**:
```
// ✅ Good
try {
  const result = await browser.storage.local.get(['key']);
  processResult(result);
} catch (error) {
  console.error('Storage error:', error);
  // Handle error appropriately
}

// ❌ Bad
const result = await browser.storage.local.get(['key']);
processResult(result); // No error handling
```

**Use meaningful variable names**:
```
// ✅ Good
const activeTab = await browser.tabs.query({ active: true });
const modelMatchStatus = checkModelMatch(display, selected);

// ❌ Bad
const t = await browser.tabs.query({ active: true });
const s = checkModelMatch(d, s);
```

### HTML Best Practices

- Use semantic HTML5 elements
- Include proper `lang` attribute
- Use meaningful IDs and classes
- Include loading states for dynamic content

### CSS Best Practices

- Use CSS custom properties for theming
- Keep specificity low
- Use BEM or similar naming convention
- Mobile-first responsive design

---

## Commit Message Guidelines

### Structure

```
type(scope): subject line (max 50 chars)

Optional body explaining what and why (wrap at 72 chars)

Optional footer with issue references
```

### Types

- `feat`: New feature (e.g., `feat: Add model history tracking`)
- `fix`: Bug fix (e.g., `fix: Resolve badge color issue`)
- `docs`: Documentation (e.g., `docs: Update README installation steps`)
- `style`: Formatting, no code change
- `refactor`: Code refactoring, no behavior change
- `test`: Adding tests
- `build`: Build system changes
- `chore`: Maintenance (dependencies, config)

### Scopes (Optional)

- `firefox`: Firefox-specific changes
- `chrome`: Chrome-specific changes
- `manifest`: Manifest file changes
- `build`: Build system changes
- `ui`: User interface changes

### Examples

```
feat(firefox): Add browser_specific_settings to manifest
fix(overlay): Correct positioning on narrow viewports
docs: Add Firefox installation instructions to README
refactor: Simplify message passing logic
test: Add validation for manifest merge
build: Update webextension-polyfill to v0.12.0
```

---

## Pull Request Process

### 1. Prepare Your PR

```
# Ensure your branch is up-to-date
git checkout main
git pull upstream main
git checkout feature/your-feature
git rebase main

# Build and test
npm run clean
npm run build
npm test

# Test in both browsers
npm run dev:firefox
# Load dist/chrome/ in Chrome
```

### 2. Submit Pull Request

1. Push to your fork: `git push origin feature/your-feature`
2. Open PR on GitHub against `main` branch
3. Fill out the PR template completely
4. Link related issues with `Closes #XX` or `Fixes #XX`

### 3. PR Review

- Maintainers will review your code
- Address feedback promptly
- Make changes in new commits (don't force push)
- Request re-review when ready

### 4. After Merge

```
# Update your fork after merge
git checkout main
git pull upstream main
git push origin main

# Delete feature branch
git branch -d feature/your-feature
git push origin --delete feature/your-feature
```

---

## Debugging Tips

### Firefox Debugging

**Access Extension Console**:
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Inspect" on Model Watcher
3. Console shows extension logs

**Debug Content Scripts**:
1. Open Perplexity.ai page
2. Press F12 → Console tab
3. Select extension context from dropdown

**Check Background Script**:
```
// In Extension Toolbox console
console.log(typeof browser);  // Should be "object"
await browser.storage.local.get();  // Test storage
```

### Chrome Debugging

**Access Service Worker Console**:
1. Open `chrome://extensions/`
2. Find Model Watcher
3. Click "service worker" link

**Debug Popup**:
1. Right-click extension icon
2. Select "Inspect popup"
3. Console opens for popup context

---

## Common Issues & Solutions

### Build Fails

```
# Solution: Clean and reinstall
npm run clean
rm -rf node_modules
npm install
npm run build
```

### Firefox Won't Load Extension

```
# Check Firefox version
firefox-dev --version  # Must be 109+

# Verify build
ls -la dist/firefox/manifest.json

# Rebuild
npm run build:firefox
```

### Polyfill Not Working

```
# Ensure polyfill is copied
npm run copy:polyfill
ls -la src/browser-polyfill.js

# Rebuild
npm run build
```

### Changes Not Reflecting

```
# Rebuild after every change
npm run build:firefox

# In Firefox, reload extension:
# about:debugging → Reload button
```

---

## Documentation Guidelines

### When to Update Docs

Update documentation when you:
- Add new features
- Change user-facing behavior
- Modify build process
- Add new npm scripts
- Change installation requirements

### Documentation Files

- **README.md**: User-facing documentation
- **CONTRIBUTING.md**: This file (contributor guide)
- **MANIFEST_DIFFERENCES.md**: Technical manifest documentation
- **BROWSER_COMPATIBILITY.md**: API compatibility information
- **CHANGELOG.md**: Version history

---

## Where to Get Help

### Useful Resources

- [Mozilla WebExtensions API Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Chrome Extensions API Docs](https://developer.chrome.com/docs/extensions/)
- [webextension-polyfill Docs](https://github.com/mozilla/webextension-polyfill)
- [web-ext CLI Docs](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)

### Project Documentation

- [Manifest Differences](MANIFEST_DIFFERENCES.md)
- [Browser Compatibility Report](BROWSER_COMPATIBILITY.md)
- [Privacy Policy](PRIVACY.md)

---

**Happy Contributing** ❤️
