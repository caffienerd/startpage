#!/usr/bin/env node
// build.js
// Usage:
//   node build.js chrome   → stamps version, copies manifest.chrome.json  → manifest.json
//   node build.js firefox  → stamps version, copies manifest.firefox.json → manifest.json
//   node build.js opera    → stamps version, copies manifest.opera.json   → manifest.json
//   node build.js          → stamps version only, does not touch manifest.json

const fs = require('fs');

// Read version
const versionSrc = fs.readFileSync('version/version.js', 'utf8');
const match = versionSrc.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
if (!match) { console.error('Could not parse version from version/version.js'); process.exit(1); }
const version = match[1];

// Stamp all manifests
for (const file of ['manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
  if (!fs.existsSync(file)) continue;
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  m.version = version;
  fs.writeFileSync(file, JSON.stringify(m, null, 2) + '\n');
  console.log(`✓ ${file} → v${version}`);
}

// Copy the right manifest if target specified
const target = process.argv[2];
const targets = { chrome: 'manifest.chrome.json', firefox: 'manifest.firefox.json', opera: 'manifest.opera.json' };

if (target && targets[target]) {
  fs.copyFileSync(targets[target], 'manifest.json');
  console.log(`✓ manifest.json ← ${targets[target]}`);
} else if (target) {
  console.error(`Unknown target "${target}". Use: chrome, firefox, opera`);
  process.exit(1);
} else {
  console.log('Tip: run "node build.js chrome", "node build.js firefox", or "node build.js opera"');
}