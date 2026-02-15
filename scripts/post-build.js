#!/usr/bin/env node
// Post-build script to copy .prisma folder to unpacked area
// electron-builder doesn't include dot files by default

const fs = require('fs-extra');
const path = require('path');

module.exports = async function(context) {
  const appOutDir = context.appOutDir;
  const platform = context.electronPlatformName;
  
  const projectRoot = path.join(__dirname, '..');
  const prismaSrc = path.join(projectRoot, 'node_modules', '.prisma');
  
  if (!fs.existsSync(prismaSrc)) {
    console.log('⚠️  .prisma folder not found, skipping copy');
    return;
  }
  
  let resourcesPath;
  if (platform === 'darwin') {
    resourcesPath = path.join(appOutDir, `${context.packager.appInfo.productName}.app`, 'Contents', 'Resources');
  } else {
    resourcesPath = path.join(appOutDir, 'resources');
  }
  
  const destDir = path.join(resourcesPath, 'app.asar.unpacked', 'node_modules', '.prisma');
  
  try {
    await fs.copy(prismaSrc, destDir, { overwrite: true });
    console.log(`✓ Copied .prisma to ${platform}`);
  } catch (err) {
    console.error(`✗ Failed to copy .prisma:`, err.message);
  }
};
