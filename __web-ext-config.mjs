/**
 * web-ext Configuration (ES Module)
 * 
 * Alternative configuration using ES Module syntax.
 * Rename this file to web-ext-config.mjs to use it.
 */

export default {
  sourceDir: './dist/firefox/',
  artifactsDir: './artifacts/',

  ignoreFiles: [
    'web-ext-config.js',
    'web-ext-config.mjs',
    '.git',
    'node_modules',
    'package.json',
    'build',
    'src',
    'dist/chrome',
    '*.md',
  ],

  build: {
    overwriteDest: true,
  },

  run: {
    firefox: 'firefoxdeveloperedition',
    startUrl: ['https://www.perplexity.ai/'],
    pref: [
      'devtools.chrome.enabled=true',
      'xpinstall.signatures.required=false',
    ],
  },

  lint: {
    selfHosted: false,
    warningsAsErrors: false,
  },
};
