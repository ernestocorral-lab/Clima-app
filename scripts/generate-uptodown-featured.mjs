import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from 'canvas';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const width = 1024;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#0B1D3A');
  bg.addColorStop(1, '#16325F');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(91, 155, 255, 0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const r = 80 + i * 35;
    ctx.beginPath();
    ctx.arc(700, 250, r / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 45; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const s = 1 + rand() * 3;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }

  const icon = await loadImage(path.join(root, 'assets', 'icon.png'));
  const iconSize = 220;
  ctx.drawImage(icon, 72, (height - iconSize) / 2, iconSize, iconSize);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 54px Segoe UI, Arial, sans-serif';
  ctx.fillText('Clima multiciudad', 330, 165);

  ctx.fillStyle = '#9BB4DE';
  ctx.font = '24px Segoe UI, Arial, sans-serif';
  ctx.fillText('Tu tiempo, 4 ciudades y widgets', 332, 215);

  const features = [
    'GPS + 3 ciudades',
    'Gráficas horarias',
    'Widgets del escritorio',
    'Español / English',
  ];
  ctx.font = '18px Segoe UI, Arial, sans-serif';
  let y = 265;
  for (const feature of features) {
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(337, y + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(feature, 352, y + 15);
    y += 34;
  }

  ctx.fillStyle = 'rgba(91, 155, 255, 0.9)';
  roundRect(ctx, 780, 36, 200, 44, 22);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Segoe UI, Arial, sans-serif';
  ctx.fillText('Android · Gratis', 808, 64);

  const out = path.join(root, 'docs', 'uptodown-featured-1024x500.png');
  fs.writeFileSync(out, canvas.toBuffer('image/png'));
  console.log('Saved', out, fs.statSync(out).size, 'bytes');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
