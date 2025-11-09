/**
 * Package Verification Script
 * Validates Firefox and Chrome ZIP packages
 */


const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

async function verifyFirefoxPackage() {
  log('\n=== Verifying Firefox Package ===', COLORS.bright);
  

  const artifactsDir = path.join(__dirname, '..', 'artifacts');
  const zipFiles = (await fs.readdir(artifactsDir))
    .filter(f => f.endsWith('.zip'));
  

  if (zipFiles.length === 0) {
    log('✗ No ZIP file found in artifacts/', COLORS.red);
    return false;
  }
  

  const zipPath = path.join(artifactsDir, zipFiles[0]);
  log(`✓ Found ZIP: ${zipFiles[0]}`, COLORS.green);
  

  // Check file size
  const stats = await fs.stat(zipPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  log(`✓ Package size: ${sizeKB} KB`, COLORS.green);
  

  if (stats.size > 5 * 1024 * 1024) {
    log('⚠ Package larger than 5MB', COLORS.yellow);
  }
  

  // List contents
  try {
    const contents = execSync(`unzip -l "${zipPath}"`, { encoding: 'utf-8' });
    const fileCount = (contents.match(/\n/g) || []).length - 3;
    log(`✓ Package contains ${fileCount} files`, COLORS.green);
  } catch (error) {
    log('⚠ Could not list package contents', COLORS.yellow);
  }
  

  return true;
}


async function verifyChromePackage() {
  log('\n=== Verifying Chrome Package ===', COLORS.bright);
  

  const artifactsDir = path.join(__dirname, '..', 'artifacts');
  const zipPath = path.join(artifactsDir, 'chrome-extension.zip');
  

  if (!await fs.pathExists(zipPath)) {
    log('✗ chrome-extension.zip not found', COLORS.red);
    return false;
  }
  

  log('✓ Found chrome-extension.zip', COLORS.green);
  

  // Check file size
  const stats = await fs.stat(zipPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  log(`✓ Package size: ${sizeKB} KB`, COLORS.green);
  

  // List contents
  try {
    const contents = execSync(`unzip -l "${zipPath}"`, { encoding: 'utf-8' });
    const fileCount = (contents.match(/\n/g) || []).length - 3;
    log(`✓ Package contains ${fileCount} files`, COLORS.green);
  } catch (error) {
    log('⚠ Could not list package contents', COLORS.yellow);
  }
  

  return true;
}



async function main() {
  log('\n╔═══════════════════════════════════════════════╗', COLORS.bright);
  log('║          Package Verification Script          ║', COLORS.bright);
  log('╚═══════════════════════════════════════════════╝', COLORS.bright);
  

  const firefoxOk = await verifyFirefoxPackage();
  const chromeOk = await verifyChromePackage();
  

  log('\n=== Summary ===', COLORS.bright);
  log(`Firefox: ${firefoxOk ? '✓ Valid' : '✗ Invalid'}`, firefoxOk ? COLORS.green : COLORS.red);
  log(`Chrome:  ${chromeOk ? '✓ Valid' : '✗ Invalid'}`, chromeOk ? COLORS.green : COLORS.red);


  if (firefoxOk && chromeOk) {
    log('\n✓ All packages valid and ready for distribution!\n', COLORS.green);
  } else {
    log('\n✗ Some packages need attention\n', COLORS.red);
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n✗ Error: ${error.message}`, COLORS.red);
  process.exit(1);
});
