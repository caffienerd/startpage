const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

const COPY_ITEMS = [
  'focus.html',
  'focus.js',
  'index.html',
  'style.css',
  'icon',
  'script',
  'version',
  'README.md'
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeDirIfExists(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyProjectFiles(targetDir) {
  ensureDir(targetDir);
  for (const item of COPY_ITEMS) {
    const src = path.join(ROOT, item);
    const dest = path.join(targetDir, item);
    if (!fs.existsSync(src)) continue;
    fs.cpSync(src, dest, { recursive: true });
  }
}

function copyManifest(sourceManifestName, targetDir) {
  const src = path.join(ROOT, sourceManifestName);
  const dest = path.join(targetDir, 'manifest.json');
  fs.copyFileSync(src, dest);
}

function buildTarget(name, manifestName) {
  const outDir = path.join(DIST, name);
  removeDirIfExists(outDir);
  copyProjectFiles(outDir);
  copyManifest(manifestName, outDir);
  return outDir;
}

function main() {
  removeDirIfExists(DIST);
  ensureDir(DIST);

  const chromeDir = buildTarget('chrome', 'manifest.json');
  const firefoxDir = buildTarget('firefox', 'manifest.json');
  const operaDir = buildTarget('opera', 'manifest.opera.json');

  const lines = [
    'Build complete.',
    `- Chrome/Edge: ${chromeDir}`,
    `- Firefox: ${firefoxDir}`,
    `- Opera: ${operaDir}`
  ];
  process.stdout.write(lines.join('\n') + '\n');
}

main();
