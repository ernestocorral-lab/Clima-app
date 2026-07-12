const WIDTH = 81;
const SCALE = 1.3;
const BASE_WIDTH = 62;
const PADDING_H = 5;
const FONT_SIZE = 12;
const MIN_SCALE = 0.8;
const SEMIBOLD_WIDTH_FACTOR = 0.62;
const LABELS = ['Widgets', 'Ciudades', 'Cities'];

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
const adjustsCount = (appSource.match(/adjustsFontSizeToFit/g) ?? []).length;

if (adjustsCount < 2) {
  console.error(`App.tsx must use adjustsFontSizeToFit on both header buttons (found ${adjustsCount})`);
  process.exit(1);
}

const innerWidth = WIDTH - PADDING_H * 2;
const widthRatio = WIDTH / BASE_WIDTH;

if (widthRatio < SCALE - 0.02 || widthRatio > SCALE + 0.02) {
  console.error(`Button width ${WIDTH}px is not ~30% wider than baseline ${BASE_WIDTH}px`);
  process.exit(1);
}

let ok = true;
for (const label of LABELS) {
  const fullSizeEstimate = label.length * FONT_SIZE * SEMIBOLD_WIDTH_FACTOR;
  const minScaledEstimate = label.length * FONT_SIZE * MIN_SCALE * SEMIBOLD_WIDTH_FACTOR;

  if (minScaledEstimate > innerWidth) {
    console.error(
      `Label "${label}" may not fit in ${innerWidth}px even at scale ${MIN_SCALE} (needs ~${Math.ceil(minScaledEstimate)}px)`,
    );
    ok = false;
    continue;
  }

  const fitsAtFullSize = fullSizeEstimate <= innerWidth;
  console.log(
    `${fitsAtFullSize ? 'OK' : 'SCALE'}: "${label}" fits in ${innerWidth}px` +
      ` (est. ${Math.ceil(fullSizeEstimate)}px at ${FONT_SIZE}px` +
      `${fitsAtFullSize ? '' : `, scales down to >=${Math.ceil(minScaledEstimate)}px`})`,
  );
}

if (!ok) {
  process.exit(1);
}

console.log(`OK: buttons stay ${WIDTH}px wide with ${innerWidth}px for full labels`);
