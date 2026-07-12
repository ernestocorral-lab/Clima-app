/**
 * Losslessly compresses PNG assets bundled into the Android release APK.
 * Run automatically before release builds.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const PNG_GLOBS = [
  'assets/widget-preview',
  'assets/icon.png',
  'assets/favicon.png',
  'assets/android-icon-foreground.png',
  'assets/android-icon-monochrome.png',
];

async function optimizePng(filePath) {
  const before = fs.statSync(filePath).size;
  const buffer = await sharp(filePath)
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
    .toBuffer();
  if (buffer.length < before) {
    fs.writeFileSync(filePath, buffer);
    console.log(`Optimized ${path.relative(root, filePath)}: ${before} -> ${buffer.length} bytes`);
  }
}

async function walk(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (entry.name.endsWith('.png')) {
      await optimizePng(fullPath);
    }
  }
}

for (const target of PNG_GLOBS) {
  const fullPath = path.join(root, target);
  if (fullPath.endsWith('.png')) {
    if (fs.existsSync(fullPath)) {
      await optimizePng(fullPath);
    }
    continue;
  }
  await walk(fullPath);
}

console.log('Release asset optimization complete.');
