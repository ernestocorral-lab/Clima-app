import { colors } from '../theme';

type WeatherIconKind =
  | 'clear'
  | 'mainlyClear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'unknown';

function getWeatherIconKind(code: number): WeatherIconKind {
  if (code === 0) return 'clear';
  if (code === 1) return 'mainlyClear';
  if (code === 2) return 'partlyCloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code === 51 || code === 53 || code === 55 || code === 80) return 'drizzle';
  if (code === 61 || code === 63 || code === 65 || code === 81) return 'rain';
  if (code === 71 || code === 73 || code === 75) return 'snow';
  if (code === 82 || code === 95 || code === 96 || code === 99) return 'thunder';
  return 'unknown';
}

function sunSvg(accent: string): string {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 12 + Math.cos(rad) * 6.2;
      const y1 = 12 + Math.sin(rad) * 6.2;
      const x2 = 12 + Math.cos(rad) * 8.4;
      const y2 = 12 + Math.sin(rad) * 8.4;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${accent}" stroke-width="1.4" stroke-linecap="round"/>`;
    })
    .join('');
  return `${rays}<circle cx="12" cy="12" r="4.2" fill="${accent}"/>`;
}

const CLOUD_PATH =
  'M7 15h10a3.5 3.5 0 0 0 .4-7A4.8 4.8 0 0 0 6.5 8.5 3.6 3.6 0 0 0 3 12.2 3.4 3.4 0 0 0 7 15Z';

function cloudSvg(color: string): string {
  return `<path d="${CLOUD_PATH}" fill="${color}"/>`;
}

function rainSvg(color: string, accent: string): string {
  return `${cloudSvg(color)}<line x1="8" y1="17" x2="7" y2="20" stroke="${accent}" stroke-width="1.4" stroke-linecap="round"/><line x1="12" y1="17" x2="11" y2="20" stroke="${accent}" stroke-width="1.4" stroke-linecap="round"/><line x1="16" y1="17" x2="15" y2="20" stroke="${accent}" stroke-width="1.4" stroke-linecap="round"/>`;
}

function iconInner(kind: WeatherIconKind, color: string, accent: string): string {
  switch (kind) {
    case 'clear':
      return sunSvg(accent);
    case 'mainlyClear':
      return `${sunSvg(accent)}<path d="M14 8h6a2.5 2.5 0 0 0 .2-5A3.4 3.4 0 0 0 16.5 5 2.6 2.6 0 0 0 14 7.2" fill="${color}" opacity="0.95"/>`;
    case 'partlyCloudy':
      return `${sunSvg(accent)}<path d="M13 10h7a2.8 2.8 0 0 0 .3-5.6A3.8 3.8 0 0 0 16 6.5 2.8 2.8 0 0 0 13 8.8" fill="${color}"/><path d="M8 16h9a3.2 3.2 0 0 0 .3-6.4A4.2 4.2 0 0 0 11 8.5 3.2 3.2 0 0 0 8 11.6" fill="${color}"/>`;
    case 'cloudy':
      return cloudSvg(color);
    case 'fog':
      return `<line x1="5" y1="10" x2="19" y2="10" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><line x1="6" y1="13.5" x2="18" y2="13.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><line x1="7" y1="17" x2="17" y2="17" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`;
    case 'drizzle':
    case 'rain':
      return rainSvg(color, accent);
    case 'snow':
      return `${cloudSvg(color)}<circle cx="9" cy="19" r="1.1" fill="${accent}"/><circle cx="12" cy="20" r="1.1" fill="${accent}"/><circle cx="15" cy="19" r="1.1" fill="${accent}"/>`;
    case 'thunder':
      return `${cloudSvg(color)}<path d="M11 16.5 9.5 19h2.2l-1.3 2.5L14 17h-2.4l1.4-2.5Z" fill="${colors.warning}"/>`;
    default:
      return `<circle cx="12" cy="12" r="7.5" stroke="${color}" stroke-width="1.5" fill="none"/><line x1="12" y1="8.5" x2="12" y2="12.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="15.5" r="0.9" fill="${color}"/>`;
  }
}

export function buildWidgetWeatherIconSvg(code: number, size = 22): string {
  const kind = getWeatherIconKind(code);
  const color = colors.textSecondary;
  const accent = colors.accentSoft;
  const inner = iconInner(kind, color, accent);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">${inner}</svg>`;
}
