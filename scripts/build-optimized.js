#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

async function getDirHash(dir) {
    const files = [];

    function walk(currentDir) {
        const list = fs.readdirSync(currentDir);
        for (const file of list) {
            const fullPath = path.join(currentDir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (file !== 'node_modules' && file !== 'dist') {
                    walk(fullPath);
                }
            } else {
                files.push(fullPath);
            }
        }
    }

    walk(dir);
    files.sort();

    const hash = crypto.createHash('md5');
    for (const file of files) {
        const content = fs.readFileSync(file);
        hash.update(file);
        hash.update(content);
    }
    return hash.digest('hex');
}

async function run() {
    console.log('--- Optimized Build Start ---');

    const clientDir = path.join(__dirname, '../client');
    const cacheFile = path.join(__dirname, '../.build-cache-client');
    const clientDist = path.join(clientDir, 'dist');

    let currentHash = '';
    try {
        currentHash = await getDirHash(clientDir);
    } catch (e) {
        console.warn('Could not calculate client hash, forcing build...');
    }

    let cachedHash = '';
    if (fs.existsSync(cacheFile)) {
        cachedHash = fs.readFileSync(cacheFile, 'utf8');
    }

    if (currentHash === cachedHash && fs.existsSync(clientDist)) {
        console.log('✓ No changes detected in client, skipping build.');
    } else {
        console.log('🚀 Client changes detected. Building...');
        try {
            execSync('npm run client-build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
            fs.writeFileSync(cacheFile, currentHash);
        } catch (e) {
            console.error('✗ Client build failed!');
            process.exit(1);
        }
    }

    console.log('📦 Starting Electron Packager...');
    execSync('npm run electron-pack', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    console.log('--- Build Complete ---');
}

run();
