/**
 * Generates picker preview PNGs for home-screen widgets.
 *
 * Images are copied to res/drawable/ (mdpi baseline). Pixel size must match
 * minWidth/minHeight from app.json so the launcher scales the preview to fill
 * the widget slot on every density.
 *
 * Run: npm run generate:widget-previews
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'assets', 'widget-preview');

/** mdpi px = dp from app.json minWidth/minHeight */
const PREVIEW = {
  temperature: { width: 250, height: 110 },
  metric: { width: 40, height: 40 },
  citySummary: { width: 110, height: 110 },
};

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
};

function roundedRect(w, h, r, fill) {
  return `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}"/>`;
}

function chartWidgetSvg(width, height) {
  const pad = 6;
  const chartTop = Math.round(height * 0.38);
  const chartH = height - chartTop - 12;
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
        `<circle cx="${toX(i).toFixed(1)}" cy="${toY(v).toFixed(1)}" r="1.6" fill="${c.yellow}"/><text x="${toX(i).toFixed(1)}" y="${(toY(v) - 3).toFixed(1)}" fill="${c.yellow}" font-size="5" font-family="sans-serif" text-anchor="middle" font-weight="700">${v}°</text>`,
    )
    .join('');
  const lows = minY
    .map(
      (v, i) =>
        `<circle cx="${toX(i).toFixed(1)}" cy="${toY(v).toFixed(1)}" r="1.3" fill="${c.green}"/><text x="${toX(i).toFixed(1)}" y="${(toY(v) + 6).toFixed(1)}" fill="${c.green}" font-size="4.5" font-family="sans-serif" text-anchor="middle" font-weight="600">${v}°</text>`,
    )
    .join('');
  const dayLabels = days
    .map(
      (d, i) =>
        `<text x="${toX(i).toFixed(1)}" y="${(height - 2).toFixed(1)}" fill="${c.muted}" font-size="5" font-family="sans-serif" text-anchor="middle" font-weight="600">${d}</text>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${roundedRect(width, height, 10, c.bg)}
    <text x="${pad}" y="11" fill="${c.text}" font-size="7" font-family="sans-serif" font-weight="700">Madrid, </text>
    <text x="38" y="11" fill="${c.temp}" font-size="7" font-family="sans-serif" font-weight="700">32°</text>
    <text x="${pad}" y="21" fill="${c.muted}" font-size="9" font-family="sans-serif" font-weight="600">Temperatura (°C)</text>
    <text x="${width - pad}" y="28" fill="${c.stale}" font-size="4.5" font-family="sans-serif" text-anchor="end" font-weight="600">ahora mismo</text>
    <path d="${maxPath}" fill="none" stroke="${c.yellow}" stroke-width="0.8" opacity="0.85"/>
    <path d="${minPath}" fill="none" stroke="${c.green}" stroke-width="0.8" opacity="0.85"/>
    <path d="${linePath}" fill="none" stroke="${c.blue}" stroke-width="1.1" stroke-linecap="round"/>
    ${peaks}
    ${lows}
    ${dayLabels}
  </svg>`;
}

function metricWidgetSvg(width, height) {
  const pad = 3;
  const radius = Math.min(8, Math.round(width * 0.2));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${roundedRect(width, height, radius, c.bg)}
    <text x="${pad}" y="9" fill="${c.text}" font-size="4.5" font-family="sans-serif" font-weight="600">Temp.</text>
    <text x="${pad}" y="24" fill="${c.temp}" font-size="13" font-family="sans-serif" font-weight="700">32</text>
    <text x="${pad + 19}" y="24" fill="${c.text}" font-size="6" font-family="sans-serif" font-weight="600">°C</text>
    <text x="${pad}" y="${height - 2}" fill="${c.text}" font-size="4" font-family="sans-serif" font-weight="600">Madrid</text>
  </svg>`;
}

function citySummaryWidgetSvg(width, height) {
  const cx = width / 2;
  const pad = 4;
  const radius = Math.min(10, Math.round(width * 0.14));
  const sunX = cx - 16;
  const sunY = Math.round(height * 0.42);
  const sun = `<circle cx="${sunX}" cy="${sunY}" r="3.5" fill="${c.accent}"/>
    <line x1="${sunX}" y1="${sunY - 6}" x2="${sunX}" y2="${sunY - 8}" stroke="${c.accent}" stroke-width="0.9" stroke-linecap="round"/>
    <line x1="${sunX}" y1="${sunY + 6}" x2="${sunX}" y2="${sunY + 8}" stroke="${c.accent}" stroke-width="0.9" stroke-linecap="round"/>
    <line x1="${sunX - 6}" y1="${sunY}" x2="${sunX - 8}" y2="${sunY}" stroke="${c.accent}" stroke-width="0.9" stroke-linecap="round"/>
    <line x1="${sunX + 6}" y1="${sunY}" x2="${sunX + 8}" y2="${sunY}" stroke="${c.accent}" stroke-width="0.9" stroke-linecap="round"/>`;

  const statY = Math.round(height * 0.78);
  const uvY = Math.round(height * 0.92);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${roundedRect(width, height, radius, c.bg)}
    <text x="${cx}" y="11" fill="${c.text}" font-size="7" font-family="sans-serif" text-anchor="middle" font-weight="700">Madrid</text>
    <text x="${cx}" y="19" fill="${c.accent}" font-size="5" font-family="sans-serif" text-anchor="middle" font-weight="600">Ahora · 15:30</text>
    <text x="${cx}" y="26" fill="${c.stale}" font-size="4" font-family="sans-serif" text-anchor="middle" font-weight="600">hace 2 min</text>
    ${sun}
    <text x="${cx - 4}" y="${sunY + 4}" fill="${c.temp}" font-size="9" font-family="sans-serif" font-weight="700">32°</text>
    <text x="${cx + 16}" y="${sunY + 4}" fill="${c.green}" font-size="9" font-family="sans-serif" font-weight="700">(23°)</text>
    <text x="${cx}" y="${Math.round(height * 0.58)}" fill="${c.secondary}" font-size="5.5" font-family="sans-serif" text-anchor="middle">Despejado</text>
    <text x="${pad + 8}" y="${statY}" fill="${c.text}" font-size="5.5" font-family="sans-serif" text-anchor="middle" font-weight="600">💧 45%</text>
    <text x="${width - pad - 8}" y="${statY}" fill="${c.text}" font-size="5.5" font-family="sans-serif" text-anchor="middle" font-weight="600">💨 12</text>
    <text x="${cx - 6}" y="${uvY}" fill="${c.text}" font-size="5.5" font-family="sans-serif" text-anchor="middle" font-weight="600">⚡</text>
    <text x="${cx + 4}" y="${uvY}" fill="${c.yellow}" font-size="5.5" font-family="sans-serif" font-weight="600">6.2</text>
  </svg>`;
}

async function writePreview(name, svg) {
  const pngPath = path.join(outDir, `${name}.png`);
  await sharp(Buffer.from(svg)).flatten({ background: c.bg }).png().toFile(pngPath);
  console.log('Wrote', pngPath);
}

fs.mkdirSync(outDir, { recursive: true });

const { width: tw, height: th } = PREVIEW.temperature;
const { width: mw, height: mh } = PREVIEW.metric;
const { width: cw, height: ch } = PREVIEW.citySummary;

await writePreview('temperature-widget', chartWidgetSvg(tw, th));
await writePreview('metric-widget', metricWidgetSvg(mw, mh));
await writePreview('city-summary-widget', citySummaryWidgetSvg(cw, ch));

console.log('Widget previews generated at mdpi sizes:', PREVIEW);
