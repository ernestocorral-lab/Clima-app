/**
 * Genera assets para Google Play Store.
 * Uso: node scripts/generate-play-store-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs', 'play-store');

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const iconSrc = path.join(root, 'assets', 'icon.png');
  await sharp(iconSrc)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'icon-512.png'));

  const featuredSrc = path.join(root, 'docs', 'uptodown-featured-1024x500.png');
  if (fs.existsSync(featuredSrc)) {
    await sharp(featuredSrc)
      .resize(1024, 500, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toFile(path.join(outDir, 'feature-graphic-1024x500.png'));
  }

  const screenshots = [
    '01-pantalla-principal-es.png',
    '02-pantalla-principal-en.png',
    '03-detalle-ciudad.png',
    '04-graficas-temperatura.png',
    '05-graficas-particulas-alergenos.png',
    '06-widgets.png',
  ];

  const screenshotDir = path.join(outDir, 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  for (const name of screenshots) {
    const src = path.join(root, 'docs', name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(screenshotDir, name));
    }
  }

  console.log('Play Store assets saved to docs/play-store/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
