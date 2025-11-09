/**
 * Build Validation Script for Perplexity Model Watcher
 * 
 * Validates that both Chrome and Firefox builds are correct:
 * - Check file structure
 * - Validates manifest JSON
 * - Verifies all required files exist
 * - Compare file counts
 * - Checks for Firefox-specific manifest differences
 */


const fs = require('fs-extra');
const path = require('path');

// Config.
const CONFIG = {
  distDir: path.join(__dirname, '..', 'dist'),
  chromeDir: path.join(__dirname, '..', 'dist', 'chrome'),
  firefoxDir: path.join(__dirname, '..', 'dist', 'firefox'),
  srcDir: path.join(__dirname, '..', 'src'),
};

// Required files that must exist in both distributions
const REQUIRED_FILES = [
  'manifest.json',
  'background.js',
  'interceptor.js',
  'page-probe.js',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'browser-polyfill.js',
];

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
};

let errorCount = 0;
let warningCount = 0;



function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, COLORS.green);
}

function logError(message) {
  errorCount++;
  log(`✗ ${message}`, COLORS.red);
}

function logWarning(message) {
  warningCount++;
  log(`⚠ ${message}`, COLORS.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, COLORS.blue);
}
// ✓ ✗ ⚠ ℹ


/**
 * Check if dist directory exists
 */
async function checkDistExists() {
  logInfo('Checking dist directory...');

  if (!await fs.pathExists(CONFIG.distDir)) {
    logError('dist/ directory does not exist. Run npm run build first.');
    return false;
  }

  if (!await fs.pathExists(CONFIG.chromeDir)) {
    logError('dist/chrome/ directory does not exist.');
    return false;
  }

  if (!await fs.pathExists(CONFIG.firefoxDir)) {
    logError('dist/firefox/ directory does not exist.');
    return false;
  }

  logSuccess('All distribution directories exist');
  return true;
}


/**
 * Check if all required files exist in a directory
 */
async function checkRequiredFiles(dir, browserName) {
  logInfo(`Checking required files in ${browserName}...`);

  let allPresent = true;

  for (const file of REQUIRED_FILES) {
    const filePath = path.join(dir, file);
    if (!await fs.pathExists(filePath)) {
      logError(`Missing file in ${browserName}: ${file}`);
      allPresent = false;
    }
  }

  if (allPresent) {
    logSuccess(`All required files present in ${browserName}`);
  }

  return allPresent;
}


/**
 * Validate manifest.json structure
 */
async function validateManifest(manifestPath, browserName) {
  logInfo(`Validating ${browserName} manifest.json...`);

  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Check required fields
    const requiredFields = ['manifest_version', 'name', 'version', 'description'];
    let valid = true;

    for (const field of requiredFields) {
      if (!manifest[field]) {
        logError(`${browserName} manifest missing required field: ${field}`);
        valid = false;
      }
    }

    // Check manifest version
    if (manifest.manifest_version !== 3) {
      logError(`${browserName} manifest must be version 3, got: ${manifest.manifest_version}`);
      valid = false;
    }

    // Check permissions
    if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
      logError(`${browserName} manifest missing or ivalid permissions`);
      valid = false;
    }

    if (valid) {
      logSuccess(`${browserName} manifest.json is valid`);
    }

    return { valid, manifest };

  } catch (error) {
    logError(`${browserName} manifest.json is invalid JSON: ${error.message}`);
    return { valid: false, manifest: null };
  }
}


/**
 * Validate Firefox-specific manifest properties
 */
function validateFirefoxManifest(manifest) {
  logInfo('Checking Firefox-specific manifest properties...');

  let valid = true;

  // Check browser_specific_settings
  if (!manifest.browser_specific_settings) {
    logError('Firefox manifest missing browser_specific_settings');
    valid = false;
  } else if (!manifest.browser_specific_settings.gecko) {
    logError('Firefox manifest missing browser_specific_settings.gecko');
    valid = false;
  } else {
    const gecko = manifest.browser_specific_settings.gecko;

    if (!gecko.id) {
      logError('Firefox manifest missing extension ID');
      valid = false;
    } else {
      logSuccess(`Firefox extension ID: ${gecko.id}`);
    }

    if (!gecko.strict_min_version) {
      logWarning('Firefox manifest missing strict_min_version');
    } else {
      logSuccess(`Firefox minimum version: ${gecko.strict_min_version}`);
    }
  }

  // Check background scripts
  if (!manifest.background) {
    logError('Firefox manifest missing background property');
    valid = false;
  } else if (!manifest.background.scripts) {
    logError('Firefox manifest background missing scripts array');
    valid = false;
  } else if (manifest.background.service_worker) {
    logWarning('Firefox manifest has service_worker (should only have scripts)');
  } else {
    logSuccess('Firefox manifest uses background.scripts (correct)');
  }

  return valid;
}


/**
 * Validate Chrome manifest doesn't have Firefox-specific properties
 */
function validateChromeManifest(manifest) {
  logInfo('Checking Chrome manifest properties...');

  let valid = true;

  // Chrome should NOT have browser_specific_settings
  if (manifest.browser_specific_settings) {
    logWarning('Chrome manifest has browser_specific_settings (not needed)');
  }

  // Check background service worker
  if (!manifest.background) {
    logError('Chrome manifest missing background property');
    valid = false;
  } else if (!manifest.background.service_worker) {
    logError('Chrome manifest missing background.service_worker');
    valid = false;
  } else if (manifest.background.scripts) {
    logError('Chrome manifest has background.scripts (should only have service_worker)');
    valid = false;
  } else {
    logSuccess('Chrome manifest uses background.service_worker (correct)');
  }

  return valid;
}


/**
 * Compare file counts between builds
 */
async function compareFileCounts() {
  logInfo('Comparing file counts...');

  const chromeFiles = await fs.readdir(CONFIG.chromeDir);
  const firefoxFiles = await fs.readdir(CONFIG.firefoxDir);

  logInfo(`Chrome build has ${chromeFiles.length} files`);
  logInfo(`Firefox build has ${firefoxFiles.length} files`);

  if (chromeFiles.length !== firefoxFiles.length) {
    logWarning('Chrome and Firefox builds have different file counts');
    logInfo('This may be expected if Firefox has additional files');
  } else {
    logSuccess('Both builds have the same number of files');
  }

  return true;
}


/**
 * Check for polyfill in both builds
 */
async function checkPolyfill() {
  logInfo('Checking for webextension-polyfill...');

  const chromePolyfill = path.join(CONFIG.chromeDir, 'browser-polyfill.js');
  const firefoxPolyfill = path.join(CONFIG.firefoxDir, 'browser-polyfill.js');

  let valid = true;

  if (!await fs.pathExists(chromePolyfill)) {
    logError('Chrome build missing browser-polyfill.js');
    valid = false;
  } else {
    const chromeSize = (await fs.stat(chromePolyfill)).size;
    logSuccess(`Chrome polyfill present (${(chromeSize / 1024).toFixed(1)} KB)`);
  }

  if (!await fs.pathExists(firefoxPolyfill)) {
    logError('Firefox build missing browser-polyfill.js');
    valid = false;
  } else {
    const firefoxSize = (await fs.stat(firefoxPolyfill)).size;
    logSuccess(`Firefox polyfill present (${(firefoxSize / 1024).toFixed(1)} KB)`);
  }

  return valid;
}


/**
 * Main validation function
 */
async function main() {
  const startTime = Date.now();

  log('\n╔═══════════════════════════════════════════════╗', COLORS.bright);
  log('║          Build Validation Test Suite          ║', COLORS.bright);
  log('╚═══════════════════════════════════════════════╝\n', COLORS.bright);

  let allPassed = true;


  // Test 1: Check dist directories exist
  if (!await checkDistExists()) {
    allPassed = false;
    logError('\nValidation failed: Distribution directories missing');
    process.exit(1);
  }
  console.log();


  // Test 2: Check required files in Chrome
  if (!await checkRequiredFiles(CONFIG.chromeDir, 'Chrome')) {
    allPassed = false;
  }
  console.log();


  // Test 3: Check required files in Firefox
  if (!await checkRequiredFiles(CONFIG.firefoxDir, 'Firefox')) {
    allPassed = false;
  }
  console.log();


  // Test 4: Validate Chrome manifest
  const chromeManifestPath = path.join(CONFIG.chromeDir, 'manifest.json');
  const { valid: chromeValid, manifest: chromeManifest } = await validateManifest(chromeManifestPath, 'Chrome');
  if (!chromeValid) {
    allPassed = false;
  } else if (chromeManifest) {
    if (!validateChromeManifest(chromeManifest)) {
      allPassed = false;
    }
  }
  console.log();

  
  // Test 5: Validate Firefox manifest
  const firefoxManifestPath = path.join(CONFIG.firefoxDir, 'manifest.json');
  const { valid: firefoxValid, manifest: firefoxManifest } = await validateManifest(firefoxManifestPath, 'Firefox');
  if (!firefoxValid) {
    allPassed = false;
  } else if (firefoxManifest) {
    if (!validateFirefoxManifest(firefoxManifest)) {
      allPassed = false;
    }
  }
  console.log();


  // Test 6: Compare file counts
  await compareFileCounts();
  console.log();


  // Test 7: Check polyfill
  if (!await checkPolyfill()) {
    allPassed = false;
  }
  console.log();


  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log('═══════════════════════════════════════════════', COLORS.bright);
  log('                TEST SUMMARY                ', COLORS.bright);
  log('═══════════════════════════════════════════════', COLORS.bright);

  if (errorCount === 0 && warningCount === 0) {
    log(`\n✓ ALL TESTS PASSED`, COLORS.green);
    log(`  No errors or warnings found`, COLORS.green);
  } else {
    if (errorCount > 0) {
      log(`\n✗ ${errorCount} ERROR(S) FOUND`, COLORS.red);
    }
    if (warningCount > 0) {
      log(`⚠ ${warningCount} WARNING(S) FOUND`, COLORS.yellow);
    }
  }

  log(`\nValidation completed in ${duration}s\n`, COLORS.blue);

  // Exit with error code if any test failed
  if (!allPassed || errorCount > 0) {
    process.exit(1);
  }
}


// Run validation
main().catch((error) => {
  logError(`\nUnexpected error during validation: ${error.message}`);
  console.error(error);
  process.exit(1);
});
