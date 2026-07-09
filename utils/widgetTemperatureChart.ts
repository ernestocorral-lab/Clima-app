import { ChartPoint, DailyEnvelope } from './chartSeries';
import { getWeekDayMarkers } from './dayLabels';

const LINE_COLOR = '#5B9BFF';
const MAX_COLOR = '#FF9B7A';
const LABEL_COLOR = '#9BB4DE';

function findDayCenterX(points: ChartPoint[], date: string, plotWidth: number): number {
  const indexes = points
    .map((point, index) => (point.time.startsWith(date) ? index : -1))
    .filter((index) => index >= 0);

  if (!indexes.length) {
    return 0;
  }

  const center = indexes[Math.floor(indexes.length / 2)];
  const lastIndex = Math.max(points.length - 1, 1);
  return (center / lastIndex) * plotWidth;
}

export function buildWidgetTemperatureSvg(
  points: ChartPoint[],
  envelope: DailyEnvelope[],
  plotWidth: number,
  plotHeight: number,
): string {
  if (points.length < 2 || plotWidth <= 0 || plotHeight <= 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotWidth}" height="${plotHeight}"></svg>`;
  }

  const values = points.map((point) => point.value);
  const envelopeValues = envelope.flatMap((day) => [day.max, day.min]);
  const min = Math.min(...values, ...envelopeValues);
  const max = Math.max(...values, ...envelopeValues);
  const range = max - min || 1;
  const paddingTop = 8;
  const paddingBottom = 14;
  const innerHeight = plotHeight - paddingTop - paddingBottom;
  const lastIndex = Math.max(points.length - 1, 1);

  const toX = (index: number) => (index / lastIndex) * plotWidth;
  const toY = (value: number) =>
    paddingTop + innerHeight - ((value - min) / range) * innerHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${toX(index).toFixed(1)} ${toY(point.value).toFixed(1)}`)
    .join(' ');

  const maxLabels = envelope
    .map((day) => {
      const x = findDayCenterX(points, day.date, plotWidth);
      const y = toY(day.max);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="${MAX_COLOR}"/><text x="${x.toFixed(1)}" y="${Math.max(8, y - 5).toFixed(1)}" fill="#FFFFFF" font-size="8" text-anchor="middle" font-family="sans-serif">${Math.round(day.max)}</text>`;
    })
    .join('');

  const dayLabels = getWeekDayMarkers(points)
    .map(
      (marker) =>
        `<text x="${(marker.xFraction * plotWidth).toFixed(1)}" y="${(plotHeight - 2).toFixed(1)}" fill="${LABEL_COLOR}" font-size="8" text-anchor="middle" font-family="sans-serif">${marker.label}</text>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotWidth}" height="${plotHeight}" viewBox="0 0 ${plotWidth} ${plotHeight}">
    <path d="${linePath}" fill="none" stroke="${LINE_COLOR}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${maxLabels}
    ${dayLabels}
  </svg>`;
}

export function buildWidgetEmptySvg(plotWidth: number, plotHeight: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotWidth}" height="${plotHeight}">
    <text x="${(plotWidth / 2).toFixed(1)}" y="${(plotHeight / 2).toFixed(1)}" fill="${LABEL_COLOR}" font-size="11" text-anchor="middle" font-family="sans-serif">Sin datos</text>
  </svg>`;
}
