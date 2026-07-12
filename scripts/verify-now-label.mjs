const TILE_INNER_WIDTH = 125;
const FONT_SIZE = 13;
const MIN_SCALE = 0.72;
const CHAR_FACTOR = 0.58;
const LABELS = [
  'Ahora · 23:59 ESP',
  'Now · 23:59 USA',
  'Ahora · 08:05 DEU',
];

function estimateWidth(text) {
  return text.length * FONT_SIZE * CHAR_FACTOR;
}

function fits(text) {
  const full = estimateWidth(text);
  if (full <= TILE_INNER_WIDTH) {
    return true;
  }
  return full * MIN_SCALE <= TILE_INNER_WIDTH;
}

let failed = 0;
for (const label of LABELS) {
  if (!fits(label)) {
    console.error(`Now label "${label}" would not fit on one line`);
    failed += 1;
    continue;
  }
  console.log(`OK: "${label}" fits in ${TILE_INNER_WIDTH}px`);
}

if (failed > 0) {
  process.exit(1);
}

console.log(`OK: now label uses ${FONT_SIZE}px with min scale ${MIN_SCALE} on tile`);
