#!/usr/bin/env node
// build.js
// Usage:
//   node build.js chrome   → stamps version, copies manifests/chrome.json  → manifest.json
//   node build.js firefox  → stamps version, copies manifests/firefox.json → manifest.json
//   node build.js opera    → stamps version, copies manifests/opera.json   → manifest.json
//   node build.js backup   → stamps version, zips each browser build → dist/v<version>/
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

if (target === 'backup') {
  const AdmZip = (() => { try { return require('adm-zip'); } catch { return null; } })();
  if (!AdmZip) {
    console.error('adm-zip not found. Run: npm install adm-zip');
    process.exit(1);
  }

  // Files/dirs to include in every zip (relative to repo root)
  const INCLUDE = [
    'index.html',
    'style.css',
    'README.md',
    'icon',
    'focus',
    'script',
    'version',
  ];

  const outDir = path.join(__dirname, 'dist', `v${version}`);
  fs.mkdirSync(outDir, { recursive: true });

  // Helper: recursively add a file or directory to a zip
  function addToZip(zip, fsPath, zipPath) {
    const stat = fs.statSync(fsPath);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(fsPath)) {
        addToZip(zip, path.join(fsPath, entry), zipPath + '/' + entry);
      }
    } else {
      zip.addFile(zipPath, fs.readFileSync(fsPath));
    }
  }

  for (const [browser, manifestFile] of Object.entries(targets)) {
    const zip = new AdmZip();

    // Add shared files
    for (const item of INCLUDE) {
      const fsPath = path.join(__dirname, item);
      if (fs.existsSync(fsPath)) addToZip(zip, fsPath, item);
    }

    // Add browser-specific manifest.json
    const manifestSrc = path.join(manifestsDir, manifestFile);
    zip.addFile('manifest.json', fs.readFileSync(manifestSrc));

    const outFile = path.join(outDir, `${browser}-v${version}.zip`);
    zip.writeZip(outFile);
    console.log(`✓ dist/v${version}/${browser}-v${version}.zip`);
  }

  console.log(`\nDone → dist/v${version}/`);

} else if (target && targets[target]) {
  const src = path.join(manifestsDir, targets[target]);
  fs.copyFileSync(src, path.join(__dirname, 'manifest.json'));
  console.log(`✓ manifest.json ← manifests/${targets[target]}`);
} else if (target) {
  console.error(`Unknown target "${target}". Use: chrome, firefox, opera, backup`);
  process.exit(1);
} else {
  console.log('Tip: run "node build.js chrome", "node build.js firefox", "node build.js opera", or "node build.js backup"');
}