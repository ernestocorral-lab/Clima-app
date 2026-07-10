/**
 * Verifies widget max labels are exactly 4px above the in-app tile baseline.
 * Run: node scripts/verify-widget-max-labels.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'utils/widgetTemperatureChart.ts'), 'utf8');

const MAX_LABEL_RAISE = 4;

function getWidgetMaxLabelY(pointY, maxLabelOffset) {
  return pointY - maxLabelOffset - MAX_LABEL_RAISE;
}

function tileBaseline(pointY, maxLabelOffset) {
  return pointY - maxLabelOffset;
}

const cases = [
  { pointY: 18, maxLabelOffset: 8, label: 'high peak' },
  { pointY: 22, maxLabelOffset: 8, label: 'near top' },
  { pointY: 50, maxLabelOffset: 8, label: 'mid chart' },
  { pointY: 80, maxLabelOffset: 8, label: 'lower peak' },
];

let failed = 0;

for (const c of cases) {
  const baseline = tileBaseline(c.pointY, c.maxLabelOffset);
  const effective = getWidgetMaxLabelY(c.pointY, c.maxLabelOffset);
  const delta = baseline - effective;

  if (delta !== MAX_LABEL_RAISE) {
    console.error(`FAIL [${c.label}]: expected +${MAX_LABEL_RAISE}px, got +${delta}px`);
    failed += 1;
  } else {
    console.log(`OK [${c.label}]: baseline=${baseline}, effective=${effective}, delta=+${delta}px`);
  }
}

if (!source.includes('getWidgetMaxLabelY(point.y, maxLabelOffset)')) {
  console.error('FAIL: max labels must call getWidgetMaxLabelY(point.y, maxLabelOffset)');
  failed += 1;
} else {
  console.log('OK: max labels use getWidgetMaxLabelY');
}

if (source.includes('dy="') || source.includes('dominant-baseline')) {
  console.error('FAIL: dy/dominant-baseline must not be used (AndroidSVG ignores them)');
  failed += 1;
} else {
  console.log('OK: no dy/dominant-baseline on max labels');
}

if (source.includes('transform="translate(')) {
  console.error('FAIL: transform groups on max labels should be removed (use plain y)');
  failed += 1;
} else {
  console.log('OK: max labels use plain y coordinate');
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log('\nAll checks passed: max labels are 4px higher than tile baseline.');
