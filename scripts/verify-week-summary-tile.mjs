const LAYOUT = {
  labelWidth: 30,
  dayWidth: 44,
  labelFontSize: 11,
  dayFontSize: 12,
  valueFontSize: 13,
  labelMinScale: 0.75,
  dayMinScale: 0.75,
  valueMinScale: 0.48,
  weekBoxPaddingH: 7,
  weekRowGap: 4,
  tilePadding: 8,
  screenPaddingH: 14,
  gridGap: 10,
  minScreenWidth: 320,
  charWidthFactor: 0.58,
};

const LABELS = ['T Máx', 'Sens.', 'T Min', 'Prec.', 'Max T', 'Feels', 'Min T', 'Rain'];

function getMinTileRowInnerWidth() {
  const tileWidth = (LAYOUT.minScreenWidth - LAYOUT.screenPaddingH * 2 - LAYOUT.gridGap) / 2;
  const tileInner = tileWidth - LAYOUT.tilePadding * 2;
  return tileInner - LAYOUT.weekBoxPaddingH * 2;
}

function getMinTileValueAreaWidth() {
  return (
    getMinTileRowInnerWidth() -
    LAYOUT.labelWidth -
    LAYOUT.dayWidth -
    LAYOUT.weekRowGap * 2
  );
}

function estimateTextWidth(text, fontSize) {
  return text.length * fontSize * LAYOUT.charWidthFactor;
}

function fitsInWidth(text, fontSize, width, minimumFontScale) {
  const estimated = estimateTextWidth(text, fontSize);
  if (estimated <= width) {
    return true;
  }
  return estimated * minimumFontScale <= width;
}

function collectDayLabels() {
  const labels = new Set();
  for (const locale of ['es-ES', 'en-US']) {
    for (let month = 1; month <= 12; month += 1) {
      for (let day = 1; day <= 31; day += 1) {
        const date = new Date(2024, month - 1, day);
        if (date.getMonth() !== month - 1) {
          continue;
        }
        labels.add(
          date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' }),
        );
      }
    }
  }
  return [...labels];
}

function collectValues() {
  const values = new Set();
  for (let temp = -99; temp <= 99; temp += 1) {
    values.add(`${temp}°`);
  }
  for (let precip = 0; precip <= 9999; precip += 1) {
    values.add(`${(precip / 10).toFixed(1)} mm`);
  }
  return [...values];
}

const dayLabels = collectDayLabels();
const values = collectValues();
const valueArea = getMinTileValueAreaWidth();

let failed = 0;

for (const label of LABELS) {
  if (!fitsInWidth(label, LAYOUT.labelFontSize, LAYOUT.labelWidth, LAYOUT.labelMinScale)) {
    console.error(`Label "${label}" does not fit in ${LAYOUT.labelWidth}px`);
    failed += 1;
  }
}

for (const dayLabel of dayLabels) {
  if (!fitsInWidth(dayLabel, LAYOUT.dayFontSize, LAYOUT.dayWidth, LAYOUT.dayMinScale)) {
    console.error(`Day "${dayLabel}" does not fit in ${LAYOUT.dayWidth}px`);
    failed += 1;
  }
}

for (const value of values) {
  if (!fitsInWidth(value, LAYOUT.valueFontSize, valueArea, LAYOUT.valueMinScale)) {
    console.error(`Value "${value}" does not fit in ${valueArea}px value area`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`FAILED: ${failed} combinations would be clipped`);
  process.exit(1);
}

console.log(
  `OK: ${LABELS.length} labels, ${dayLabels.length} day labels, ${values.length} values fit at ${LAYOUT.minScreenWidth}px screen`,
);
console.log(
  `OK: tile row uses label ${LAYOUT.labelWidth}px, day ${LAYOUT.dayWidth}px, value area ${valueArea}px`,
);
