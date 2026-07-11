/**
 * Generates launcher icons — option 2 (sun + cloud + chart), colorful variant.
 * Run: node scripts/generate-launcher-icon.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets');
const SIZE = 1024;

const colors = {
  screen: '#0B1D3A',
  sun: '#FFD54F',
  sunRay: '#FFB74D',
  sunCore: '#FFF176',
  cloudMain: '#7EC8FF',
  cloudLight: '#B8E8FF',
  cloudShadow: '#3D7BFF',
  cloudAccent: '#C7D7F2',
  chartLine: '#5B9BFF',
  chartFill: 'rgba(61, 123, 255, 0.38)',
  chartPeak: '#FFEB3B',
  chartMid: '#81C784',
  chartEnd: '#FF9B7A',
  sparkle: '#E1BEE7',
};

function colorfulForegroundSvg({ monochrome = false }) {
  const c = monochrome
    ? {
        sun: '#FFFFFF',
        sunRay: '#FFFFFF',
        sunCore: '#FFFFFF',
        cloudMain: '#FFFFFF',
        cloudLight: '#FFFFFF',
        cloudShadow: '#FFFFFF',
        cloudAccent: '#FFFFFF',
        chartLine: '#FFFFFF',
        chartFill: 'rgba(255,255,255,0.22)',
        chartPeak: '#FFFFFF',
        chartMid: '#FFFFFF',
        chartEnd: '#FFFFFF',
        sparkle: '#FFFFFF',
      }
    : colors;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <!-- Sun -->
  <g transform="translate(248 248)">
    ${[0, 45, 90, 135, 180, 225, 270, 315]
      .map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 96 + Math.cos(rad) * 72;
        const y1 = 96 + Math.sin(rad) * 72;
        const x2 = 96 + Math.cos(rad) * 108;
        const y2 = 96 + Math.sin(rad) * 108;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c.sunRay}" stroke-width="20" stroke-linecap="round"/>`;
      })
      .join('\n    ')}
    <circle cx="96" cy="96" r="52" fill="${c.sun}"/>
    <circle cx="96" cy="96" r="34" fill="${c.sunCore}" opacity="0.85"/>
  </g>

  <!-- Accent sparkle -->
  <circle cx="780" cy="260" r="14" fill="${c.sparkle}" opacity="${monochrome ? 1 : 0.9}"/>
  <circle cx="812" cy="292" r="8" fill="${c.chartMid}" opacity="${monochrome ? 0.7 : 0.85}"/>

  <!-- Back cloud -->
  <path
    d="M520 360 C560 300 660 300 700 350 C760 340 820 390 820 450 C820 510 770 550 700 550 L520 550 C450 550 400 500 400 440 C400 390 450 360 520 360 Z"
    fill="${c.cloudAccent}"
    opacity="${monochrome ? 0.35 : 0.55}"
  />

  <!-- Main cloud -->
  <path
    d="M460 420 C500 340 620 330 670 390 C740 375 820 430 820 510 C820 590 750 650 660 650 L430 650 C340 650 270 580 270 500 C270 430 340 380 420 390 C430 405 445 415 460 420 Z"
    fill="${c.cloudMain}"
  />
  <path
    d="M500 430 C530 380 610 375 650 415 C690 405 740 440 740 490 C740 540 700 575 640 575 L480 575 C420 575 380 535 380 485 C380 445 420 415 470 420 C480 425 490 428 500 430 Z"
    fill="${c.cloudLight}"
    opacity="${monochrome ? 0.45 : 0.75}"
  />
  <path
    d="M560 520 C600 500 680 510 720 545 C740 555 760 575 780 590 L520 590 C480 590 450 565 440 535 C470 525 515 518 560 520 Z"
    fill="${c.cloudShadow}"
    opacity="${monochrome ? 0.25 : 0.35}"
  />

  <!-- Chart area + line -->
  <path
    d="M140 780 L140 640 L240 610 L360 650 L480 560 L600 590 L720 500 L840 530 L884 510 L884 780 Z"
    fill="${c.chartFill}"
  />
  <polyline
    points="140,640 240,610 360,650 480,560 600,590 720,500 840,530 884,510"
    fill="none"
    stroke="${c.chartLine}"
    stroke-width="26"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <circle cx="720" cy="500" r="22" fill="${c.chartPeak}"/>
  <circle cx="360" cy="650" r="16" fill="${c.chartMid}"/>
  <circle cx="884" cy="510" r="16" fill="${c.chartEnd}"/>
</svg>`;
}

function fullIconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SIZE}" height="${SIZE}" fill="${colors.screen}"/>
  ${colorfulForegroundSvg({ monochrome: false }).replace(/^<\?xml[^?]*\?>\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}
</svg>`;
}

function backgroundSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SIZE}" height="${SIZE}" fill="${colors.screen}"/>
</svg>`;
}

async function writePng(filename, svg) {
  const outPath = path.join(assetsDir, filename);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  const stat = fs.statSync(outPath);
  console.log(`Wrote ${filename} (${Math.round(stat.size / 1024)} KB)`);
}

async function main() {
  await writePng('icon.png', fullIconSvg());
  await writePng('android-icon-foreground.png', colorfulForegroundSvg({ monochrome: false }));
  await writePng('android-icon-background.png', backgroundSvg());
  await writePng('android-icon-monochrome.png', colorfulForegroundSvg({ monochrome: true }));
  await writePng('favicon.png', fullIconSvg());
  console.log('Done — colorful launcher icons (option 2).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
