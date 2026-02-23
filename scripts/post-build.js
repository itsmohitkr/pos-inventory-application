#!/usr/bin/env node
// Post-build script to copy .prisma folder to unpacked area
// electron-builder doesn't include dot files by default

const fs = require('fs-extra');
const path = require('path');

module.exports = async function (context) {
  const appOutDir = context.appOutDir;
  const platform = context.electronPlatformName;

  const projectRoot = path.join(__dirname, '..');
  const prismaSrc = path.join(projectRoot, 'node_modules', '.prisma');

  if (!fs.existsSync(prismaSrc)) {
    // Folder not found, skipping copy
    return;
  }

  let resourcesPath;
  if (platform === 'darwin') {
    resourcesPath = path.join(appOutDir, `${context.packager.appInfo.productName}.app`, 'Contents', 'Resources');
  } else {
    resourcesPath = path.join(appOutDir, 'resources');
  }

  const destDir = path.join(resourcesPath, 'app.asar.unpacked', 'node_modules', '.prisma', 'client');
  await fs.ensureDir(destDir);

  try {
    // Only copy the binary relevant to the current platform to save space and time
    const engineName = platform === 'darwin'
      ? (process.arch === 'arm64' ? 'libquery_engine-darwin-arm64.dylib.node' : 'libquery_engine-darwin.dylib.node')
      : 'query_engine-windows.dll.node';

    const files = await fs.readdir(prismaSrc);
    for (const file of files) {
      if (file.endsWith('.node')) {
        // Skip binaries for other platforms
        if (file !== engineName) continue;
      }

      const srcFile = path.join(prismaSrc, file);
      const destFile = path.join(destDir, file);

      if (fs.statSync(srcFile).isDirectory()) {
        await fs.copy(srcFile, destFile, { overwrite: true });
      } else {
        await fs.copyFile(srcFile, destFile);
      }
    }
    console.log(`✓ Surgically copied ${engineName} to unpacked area`);
  } catch (err) {
    console.error(`✗ Failed to copy .prisma:`, err.message);
  }
};
