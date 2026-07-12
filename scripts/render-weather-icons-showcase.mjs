/**
 * Renders all weather icon variants to a PNG for review.
 * Run: node scripts/render-weather-icons-showcase.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'assets', 'weather-icons-showcase.png');

const colors = {
  bg: '#16325F',
  text: '#FFFFFF',
  muted: '#9BB4DE',
  cloud: '#C7D7F2',
  accent: '#7EC8FF',
  sun: '#FFEB3B',
  warning: '#FFD27A',
};

const ICONS = [
  { kind: 'clear', label: 'Despejado', code: 0 },
  { kind: 'mainlyClear', label: 'Mayormente despejado', code: 1 },
  { kind: 'partlyCloudy', label: 'Parcialmente nublado', code: 2 },
  { kind: 'cloudy', label: 'Nublado', code: 3 },
  { kind: 'fog', label: 'Niebla', code: 45 },
  { kind: 'drizzle', label: 'Llovizna', code: 51 },
  { kind: 'rain', label: 'Lluvia', code: 61 },
  { kind: 'snow', label: 'Nieve', code: 71 },
  { kind: 'thunder', label: 'Tormenta', code: 95 },
  { kind: 'unknown', label: 'Desconocido', code: -1 },
];

function sunSvg(sun) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 12 + Math.cos(rad) * 6.2;
      const y1 = 12 + Math.sin(rad) * 6.2;
      const x2 = 12 + Math.cos(rad) * 8.4;
      const y2 = 12 + Math.sin(rad) * 8.4;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${sun}" stroke-width="1.4" stroke-linecap="round"/>`;
    })
    .join('');
  return `${rays}<circle cx="12" cy="12" r="4.2" fill="${sun}"/>`;
}

const CLOUD_PATH =
  'M7 15h10a3.5 3.5 0 0 0 .4-7A4.8 4.8 0 0 0 6.5 8.5 3.6 3.6 0 0 0 3 12.2 3.4 3.4 0 0 0 7 15Z';

function iconInner(kind) {
  const color = colors.cloud;
  const accent = colors.accent;
  const sun = colors.sun;
  switch (kind) {
    case 'clear':
      return sunSvg(sun);
    case 'mainlyClear':
      return `${sunSvg(sun)}<path d="M14 8h6a2.5 2.5 0 0 0 .2-5A3.4 3.4 0 0 0 16.5 5 2.6 2.6 0 0 0 14 7.2" fill="${color}" opacity="0.95"/>`;
    case 'partlyCloudy':
      return `${sunSvg(sun)}<path d="M13 10h7a2.8 2.8 0 0 0 .3-5.6A3.8 3.8 0 0 0 16 6.5 2.8 2.8 0 0 0 13 8.8" fill="${color}"/><path d="M8 16h9a3.2 3.2 0 0 0 .3-6.4A4.2 4.2 0 0 0 11 8.5 3.2 3.2 0 0 0 8 11.6" fill="${color}"/>`;
    case 'cloudy':
      return `<path d="${CLOUD_PATH}" fill="${color}"/>`;
    case 'fog':
      return `<line x1="5" y1="10" x2="19" y2="10" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><line x1="6" y1="13.5" x2="18" y2="13.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><line x1="7" y1="17" x2="17" y2="17" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`;
    case 'drizzle':
    case 'rain':
      return `<path d="${CLOUD_PATH}" fill="${color}"/><line x1="8" y1="17" x2="7" y2="20" stroke="${accent}" stroke-width="1.4" stroke-linecap="round"/><line x1="12" y1="17" x2="11" y2="20" stroke="${accent}" stroke-width="1.4" stroke-linecap="round"/><line x1="16" y1="17" x2="15" y2="20" stroke="${accent}" stroke-width="1.4" stroke-linecap="round"/>`;
    case 'snow':
      return `<path d="${CLOUD_PATH}" fill="${color}"/><circle cx="9" cy="19" r="1.1" fill="${accent}"/><circle cx="12" cy="20" r="1.1" fill="${accent}"/><circle cx="15" cy="19" r="1.1" fill="${accent}"/>`;
    case 'thunder':
      return `<path d="${CLOUD_PATH}" fill="${color}"/><path d="M11 16.5 9.5 19h2.2l-1.3 2.5L14 17h-2.4l1.4-2.5Z" fill="${colors.warning}"/>`;
    default:
      return `<circle cx="12" cy="12" r="7.5" stroke="${color}" stroke-width="1.5" fill="none"/><line x1="12" y1="8.5" x2="12" y2="12.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="15.5" r="0.9" fill="${color}"/>`;
  }
}

const cols = 5;
const rows = 2;
const cellW = 160;
const cellH = 130;
const iconSize = 56;
const pad = 16;
const width = cols * cellW + pad * 2;
const height = rows * cellH + pad * 2 + 36;

const cells = ICONS.map((icon, index) => {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = pad + col * cellW + cellW / 2;
  const y = pad + 36 + row * cellH;
  const inner = iconInner(icon.kind);
  const iconX = x - iconSize / 2;
  const iconY = y - 10;
  return `
    <rect x="${pad + col * cellW + 8}" y="${y - 28}" width="${cellW - 16}" height="${cellH - 16}" rx="12" fill="${colors.bg}" opacity="0.9"/>
    <svg x="${iconX}" y="${iconY - iconSize / 2}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">${inner}</svg>
    <text x="${x}" y="${y + 38}" fill="${colors.text}" font-size="11" font-family="sans-serif" text-anchor="middle" font-weight="700">${icon.label}</text>
    <text x="${x}" y="${y + 52}" fill="${colors.muted}" font-size="9" font-family="sans-serif" text-anchor="middle">código ${icon.code >= 0 ? icon.code : '—'}</text>
  `;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#0B1D3A"/>
  <text x="${width / 2}" y="28" fill="${colors.text}" font-size="16" font-family="sans-serif" text-anchor="middle" font-weight="700">Iconos del tiempo — sol ${colors.sun}</text>
  ${cells}
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log('Wrote', outPath);
