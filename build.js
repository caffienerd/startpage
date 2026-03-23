#!/usr/bin/env node
// build.js
// Usage:
//   node build.js chrome   → stamps version, copies manifests/chrome.json  → manifest.json
//   node build.js firefox  → stamps version, copies manifests/firefox.json → manifest.json
//   node build.js opera    → stamps version, copies manifests/opera.json   → manifest.json
//   node build.js          → stamps version only, does not touch manifest.json

const fs   = require('fs');
const path = require('path');

// Read version
const versionSrc = fs.readFileSync('version/version.js', 'utf8');
const match = versionSrc.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
if (!match) { console.error('Could not parse version from version/version.js'); process.exit(1); }
const version = match[1];

// Stamp all manifests in manifests/
const manifestsDir = path.join(__dirname, 'manifests');
if (fs.existsSync(manifestsDir)) {
  for (const file of fs.readdirSync(manifestsDir).filter(f => f.endsWith('.json'))) {
    const filePath = path.join(manifestsDir, file);
    const m = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    m.version = version;
    fs.writeFileSync(filePath, JSON.stringify(m, null, 2) + '\n');
    console.log(`✓ manifests/${file} → v${version}`);
  }
}

// Copy the right manifest to root if target specified
const targets = { chrome: 'chrome.json', firefox: 'firefox.json', opera: 'opera.json' };
const target  = process.argv[2];

if (target && targets[target]) {
  const src = path.join(manifestsDir, targets[target]);
  fs.copyFileSync(src, path.join(__dirname, 'manifest.json'));
  console.log(`✓ manifest.json ← manifests/${targets[target]}`);
} else if (target) {
  console.error(`Unknown target "${target}". Use: chrome, firefox, opera`);
  process.exit(1);
} else {
  console.log('Tip: run "node build.js chrome", "node build.js firefox", or "node build.js opera"');
}