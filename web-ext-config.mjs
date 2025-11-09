/**
 * web-ext Configuration for Firefox Development
 * 
 * This file configures the web-ext CLI tool for automated Firefox testing.
 * 
 * Documentation: https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/
 * 
 * Usage:
 *   npm run dev:firefox
 *   web-ext run --config=web-ext-config.js
 */

export default {
  // Source directory containing the Firefox build
  sourceDir: './dist/firefox/',

  // Directory to store build artifacts (XPI files)
  artifactsDir: './artifacts/',

  // Files to ignore during build/run
  ignoreFiles: [
    'web-ext-config.mjs',
    '.git',
    '.github',
    'node_modules',
    'package.json',
    'package-lock.json',
    'build',
    'src',
    'dist/chrome',
    '*.md',
    '.gitignore',
    '.DS_Store',
  ],

  // Build configuration
  build: {
    overwriteDest: true,  // Overwrite existing XPI files
  },

  // Run configuration for development
  run: {
    // Firefox binary to use (auto-detected by default)
    // Options: 'firefox', 'firefoxdeveloperedition', 'nightly', or path to binary
    // firefox: 'firefox',
    firefox: '/usr/local/bin/firefox-dev',


    // Browser console behavior
    browserConsole: false,  // Set to true to auto-open browser console

    // Automatically open these URLs when Firefox starts
    startUrl: [
      'https://www.perplexity.ai/',
    ],

    // Firefox preferences for development
    pref: [
      // Enable extension debugging
      'devtools.chrome.enabled=true',
      // 'devtools.debugger.remote-enabled=true',

      // Disable signing requirements for development
      // 'xpinstall.signatures.required=false',

      // Enable verbose logging
      'extensions.logging.enabled=true',
    ],

    // Keep profile changes between runs (useful for testing)
    keepProfileChanges: false,  // Set to true to persist profile data

    // Custom Firefox profile to use (optional)
    // firefoxProfile: './firefox-profile',

    // Additional command-line arguments for Firefox
    // args: ['--private-window'],
  },

  // Lint configuration
  lint: {
    // Enable self-hosted warnings
    selfHosted: false,

    // Enable various linter checks
    warningsAsErrors: false,

    // Output format: 'text' (default) or 'json'
    output: 'text',

    // Metadata validation
    metadata: true,
  },
};
