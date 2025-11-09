/**
 * Cross-Browser Build Script for Perplexity Model Watcher
 * 
 * This script generates browser-specific distributions by:
 * 1. Cleaning previous builds
 * 2. Copying source files to dist directories
 * 3. Merging Firefox-specific manifest overrides
 * 
 * Usage:
 *   node build/build.js chrome
 *   node build/build.js firefox
 *   node build/build.js (build both)
 */


const fs = require('fs-extra');
const path = require('path');

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, '..', 'src'),
  distDir: path.join(__dirname, '..', 'dist'),
  chromeDir: path.join(__dirname, '..', 'dist', 'chrome'),
  firefoxDir: path.join(__dirname, '..', 'dist', 'firefox'),
  baseManifest: path.join(__dirname, '..', 'src', 'manifest.json'),
  firefoxManifest: path.join(__dirname, '..', 'src', 'manifest-firefox.json'),
};

// ANSI color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};


/**
 * Log messages with colors
 */
function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, COLORS.green);
}

function logInfo(message) {
  log(`ℹ ${message}`, COLORS.blue);
}

function logWarning(message) {
  log(`⚠ ${message}`, COLORS.yellow);
}

function logError(message) {
  log(`✗ ${message}`, COLORS.red);
}


/**
 * Deep merge two objects
 * Recursively merges properties from source into target
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {

      // Skip comment keys (starting with _)
      if (key.startsWith('_')) {
        return;
      }

      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}


/**
 * Check if value is an object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}


/**
 * Clean a directory (remove and recreate)
 */
async function cleanDirectory(dirPath) {
  try {
    await fs.remove(dirPath);
    await fs.ensureDir(dirPath);
    logSuccess(`Cleaned directory: ${path.relative(process.cwd(), dirPath)}`);
  } catch (error) {
    logError(`Failed to clean directory ${dirPath}: ${error.message}`);
    throw error;
  }
}


/**
 * Copy source files to destination, excluding manifest.json
 */
async function copySourceFiles(srcDir, destDir) {
  try {
    const files = await fs.readdir(srcDir);

    for (const file of files) {
      // Skip manifest files and Firefox-specific manifest
      if (file === 'manifest.json' || file === 'manifest-firefox.json') {
        continue;
      }

      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);

      await fs.copy(srcPath, destPath);
    }

    logSuccess(`Copied source files to: ${path.relative(process.cwd(), destDir)}`);
  } catch (error) {
    logError(`Failed to copy source files: ${error.message}`);
    throw error;
  }
}


/**
 * Build Chrome distribution
 */
async function buildChrome() {
  log('\n=== Building Chrome Distribution ===', COLORS.bright);

  try {
    // Clean Chrome directory
    await cleanDirectory(CONFIG.chromeDir);

    // Copy source files
    await copySourceFiles(CONFIG.srcDir, CONFIG.chromeDir);

    // Copy base manifest as-is for Chrome
    const manifest = await fs.readJson(CONFIG.baseManifest);
    const chromeManifestPath = path.join(CONFIG.chromeDir, 'manifest.json');
    await fs.writeJson(chromeManifestPath, manifest, { spaces: 2 });
    logSuccess('Chrome manifest.json created (unchanged from base)');

    logSuccess('Chrome build completed successfully\n');
    return true;

  } catch (error) {
    logError(`Chrome build failed: ${error.message}\n`);
    return false;
  }
}


/**
 * Build Firefox distribution
 */
async function buildFirefox() {
  log('\n=== Building Firefox Distribution ===', COLORS.bright);

  try {
    // Clean Firefox directory
    await cleanDirectory(CONFIG.firefoxDir);

    // Copy source files
    await copySourceFiles(CONFIG.srcDir, CONFIG.firefoxDir);

    // Merge manifests
    const baseManifest = await fs.readJson(CONFIG.baseManifest);
    const firefoxOverrides = await fs.readJson(CONFIG.firefoxManifest);

    const mergedManifest = deepMerge(baseManifest, firefoxOverrides);

    // Write merged manifest
    const firefoxManifestPath = path.join(CONFIG.firefoxDir, 'manifest.json');
    await fs.writeJson(firefoxManifestPath, mergedManifest, { spaces: 2 });
    logSuccess('Firefox manifest.json created (merged with overrides)');

    // Log the differences
    logInfo('Applied Firefox-specific changes:');
    if (firefoxOverrides.browser_specific_settings) {
      logInfo(`  • Extension ID: ${firefoxOverrides.browser_specific_settings.gecko.id}`);
      logInfo(`  • Min version: ${firefoxOverrides.browser_specific_settings.gecko.strict_min_version}`);
    }
    if (firefoxOverrides.background) {
      logInfo('  • Background: scripts (event page) instead of service_worker');
    }

    logSuccess('Firefox build completed successfully\n');
    return true;
    
  } catch (error) {
    logError(`Firefox build failed: ${error.message}\n`);
    return false;
  }
}


/**
 * Validade that required source files exist
 */
async function validateSources() {
  const requiredFiles = [
    CONFIG.baseManifest,
    CONFIG.firefoxManifest,
    path.join(CONFIG.srcDir, 'background.js'),
    path.join(CONFIG.srcDir, 'popup.html'),
  ];

  for (const file of requiredFiles) {
    if (!(await fs.pathExists(file))) {
      logError(`Required file not found: ${file}`);
      return false;
    }
  }

  return true;
}


/**
 * Main build function
 */
async function main() {
  const startTime = Date.now();

  log('\n╔═══════════════════════════════════════════════╗', COLORS.bright);
  log('║     Perplexity Model Watcher Build Script     ║', COLORS.bright);
  log('╚═══════════════════════════════════════════════╝\n', COLORS.bright);

  // Get target from command line arguments
  const target = process.argv[2]?.toLowerCase();

  // Validate sources
  logInfo('Validating source files...');
  if (!(await validateSources())) {
    logError('Source validation failed. Aborting build.');
    process.exit(1);
  }
  logSuccess('Source files validated\n');

  // Ensure dist directory exists
  await fs.ensureDir(CONFIG.distDir);

  // Build based on target
  let chromeSuccess = true;
  let firefoxSuccess = true;
  
  if (!target || target === 'chrome') {
    chromeSuccess = await buildChrome();
  }

  if (!target || target === 'firefox') {
    firefoxSuccess = await buildFirefox();
  }

  if (target && target !== 'chrome' && target !== 'firefox') {
    logError(`Invalid target: ${target}`);
    logInfo('Usage: node build/build.js [chrome|firefox]');
    logInfo('Omit target to build both browsers');
    process.exit(1);
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log('\n=== Build Summary ===', COLORS.bright);

  if (!target || target === 'chrome') {
    log(`Chrome:  ${chromeSuccess ? '✓ SUCCESS' : '✗ FAILED'}`, chromeSuccess ? COLORS.green : COLORS.red);
  }

  if (!target || target === 'firefox') {
    log(`Firefox: ${firefoxSuccess ? '✓ SUCCESS' : '✗ FAILED'}`, firefoxSuccess ? COLORS.green : COLORS.red);
  }

  log(`\nBuild completed in ${duration}s\n`, COLORS.blue);

  
  // Exit with error code if any build failed
  if (!chromeSuccess || !firefoxSuccess) {
    process.exit(1);
  }
}


// Run the build
main().catch((error) => {
  logError(`\nUnexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
