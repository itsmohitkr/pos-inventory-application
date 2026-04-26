#!/usr/bin/env node
// Reads the version from the root package.json and writes it into
// client/package.json and server/package.json so all three stay in sync.
// Run automatically as part of the release build (see package.json scripts).

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const rootPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = rootPkg.version;

const targets = [
  path.join(root, 'client', 'package.json'),
  path.join(root, 'server', 'package.json'),
];

for (const target of targets) {
  const pkg = JSON.parse(fs.readFileSync(target, 'utf8'));
  if (pkg.version === version) continue;
  pkg.version = version;
  fs.writeFileSync(target, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Synced ${path.relative(root, target)} → ${version}`);
}
