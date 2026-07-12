/**
 * Generates picker preview PNGs for home-screen widgets.
 * Run: node scripts/generate-widget-previews.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'assets', 'widget-preview');

const c = {
  bg: '#16325F',
  text: '#FFFFFF',
  muted: '#9BB4DE',
  secondary: '#C7D7F2',
  accent: '#7EC8FF',
  yellow: '#FFEB3B',
  green: '#81C784',
  blue: '#5B9BFF',
  temp: '#FFD27A',
  stale: '#FF9B7A',
  cloud: '#C7D7F2',
};

function roundedRect(w, h, r, fill) {
  return `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}"/>`;
}

function chartWidgetSvg(width, height) {
  const pad = 10;
  const chartTop = 78;
  const chartH = height - chartTop - 22;
  const chartW = width - pad * 2;
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const maxY = [32, 34, 33, 36, 35, 31, 30];
  const minY = [23, 21, 22, 19, 20, 22, 21];
  const n = maxY.length - 1;

  const toX = (i) => pad + (i / n) * chartW;
  const toY = (v) => chartTop + chartH - ((v - 17) / (36 - 17)) * chartH;

  const maxPath = maxY
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(' ');
  const minPath = minY
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(' ');
  const linePath = maxY
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(' ');

  const peaks = maxY
    .map(
      (v, i) =>
        `<circle cx="${toX(i).toFixed(1)}" cy="${toY(v).toFixed(1)}" r="2.8" fill="${c.yellow}"/><text x="${toX(i).toFixed(1)}" y="${(toY(v) - 5).toFixed(1)}" fill="${c.yellow}" font-size="9" font-family="sans-serif" text-anchor="middle" font-weight="700">${v}°</text>`,
    )
    .join('');
  const lows = minY
    .map(
      (v, i) =>
        `<circle cx="${toX(i).toFixed(1)}" cy="${toY(v).toFixed(1)}" r="2.4" fill="${c.green}"/><text x="${toX(i).toFixed(1)}" y="${(toY(v) + 12).toFixed(1)}" fill="${c.green}" font-size="8" font-family="sans-serif" text-anchor="middle" font-weight="600">${v}°</text>`,
    )
    .join('');
  const dayLabels = days
    .map(
      (d, i) =>
        `<text x="${toX(i).toFixed(1)}" y="${(height - 6).toFixed(1)}" fill="${c.muted}" font-size="9" font-family="sans-serif" text-anchor="middle" font-weight="600">${d}</text>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${roundedRect(width, height, 16, c.bg)}
    <text x="${pad}" y="22" fill="${c.text}" font-size="14" font-family="sans-serif" font-weight="700">Madrid, </text>
    <text x="78" y="22" fill="${c.temp}" font-size="14" font-family="sans-serif" font-weight="700">32°</text>
    <text x="${pad}" y="44" fill="${c.muted}" font-size="18" font-family="sans-serif" font-weight="600">Temperatura (°C)</text>
    <text x="${width - pad}" y="58" fill="${c.stale}" font-size="8" font-family="sans-serif" text-anchor="end" font-weight="600">ahora mismo</text>
    <path d="${maxPath}" fill="none" stroke="${c.yellow}" stroke-width="1.2" opacity="0.85"/>
    <path d="${minPath}" fill="none" stroke="${c.green}" stroke-width="1.2" opacity="0.85"/>
    <path d="${linePath}" fill="none" stroke="${c.blue}" stroke-width="1.6" stroke-linecap="round"/>
    ${peaks}
    ${lows}
    ${dayLabels}
  </svg>`;
}

function metricWidgetSvg(size) {
  const pad = 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${roundedRect(size, size, 16, c.bg)}
    <text x="${pad}" y="18" fill="${c.text}" font-size="10" font-family="sans-serif" font-weight="600">Temperatura</text>
    <text x="${pad}" y="52" fill="${c.temp}" font-size="28" font-family="sans-serif" font-weight="700">32</text>
    <text x="${pad + 38}" y="52" fill="${c.text}" font-size="14" font-family="sans-serif" font-weight="600">°C</text>
    <text x="${pad}" y="${size - 8}" fill="${c.text}" font-size="9" font-family="sans-serif" font-weight="600">Madrid</text>
  </svg>`;
}

function citySummaryWidgetSvg(size) {
  const cx = size / 2;
  const sun = `<circle cx="${cx - 28}" cy="88" r="5" fill="${c.accent}"/>
    <line x1="${cx - 28}" y1="78" x2="${cx - 28}" y2="74" stroke="${c.accent}" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="${cx - 28}" y1="98" x2="${cx - 28}" y2="102" stroke="${c.accent}" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="${cx - 38}" y1="88" x2="${cx - 42}" y2="88" stroke="${c.accent}" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="${cx - 18}" y1="88" x2="${cx - 14}" y2="88" stroke="${c.accent}" stroke-width="1.4" stroke-linecap="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${roundedRect(size, size, 16, c.bg)}
    <text x="${cx}" y="24" fill="${c.text}" font-size="12" font-family="sans-serif" text-anchor="middle" font-weight="700">Madrid</text>
    <text x="${cx}" y="40" fill="${c.accent}" font-size="10" font-family="sans-serif" text-anchor="middle" font-weight="600">Ahora · 15:30 ESP</text>
    <text x="${cx}" y="52" fill="${c.stale}" font-size="8" font-family="sans-serif" text-anchor="middle" font-weight="600">hace 2 min</text>
    ${sun}
    <text x="${cx - 8}" y="96" fill="${c.temp}" font-size="16" font-family="sans-serif" font-weight="700">32°</text>
    <text x="${cx + 28}" y="96" fill="${c.green}" font-size="16" font-family="sans-serif" font-weight="700">(23°)</text>
    <text x="${cx}" y="112" fill="${c.secondary}" font-size="10" font-family="sans-serif" text-anchor="middle">Despejado</text>
    <text x="${cx}" y="126" fill="${c.text}" font-size="9" font-family="sans-serif" text-anchor="middle" font-weight="600">💧 45%</text>
    <text x="${cx}" y="138" fill="${c.text}" font-size="9" font-family="sans-serif" text-anchor="middle" font-weight="600">💨 12</text>
    <text x="${cx}" y="150" fill="${c.yellow}" font-size="9" font-family="sans-serif" text-anchor="middle" font-weight="600">⚡ 6.2</text>
  </svg>`;
}

async function writePreview(name, svg, width, height) {
  const pngPath = path.join(outDir, `${name}.png`);
  await sharp(Buffer.from(svg)).png().resize(width, height).toFile(pngPath);
  console.log('Wrote', pngPath);
}

fs.mkdirSync(outDir, { recursive: true });

await writePreview('temperature-widget', chartWidgetSvg(500, 220), 500, 220);
await writePreview('metric-widget', metricWidgetSvg(220), 220, 220);
await writePreview('city-summary-widget', citySummaryWidgetSvg(440), 440, 440);

console.log('Widget previews generated.');
