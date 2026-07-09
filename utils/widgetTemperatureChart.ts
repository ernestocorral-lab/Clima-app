import { ChartPoint, DailyEnvelope } from './chartSeries';
import { getWeekDayMarkers } from './dayLabels';
import { buildSmoothPath, PlotPoint } from './smoothPath';

const LINE_COLOR = '#5B9BFF';
const ENVELOPE_LINE_COLOR = '#FFEB3B';
const MAX_COLOR = '#FF9B7A';
const MIN_COLOR = '#7EC8FF';
const LABEL_COLOR = '#9BB4DE';
const MAX_LABEL_FONT_SIZE = 12;
const MIN_LABEL_FONT_SIZE = 12;
const DAY_LABEL_FONT_SIZE = 12;
const MAX_DOT_RADIUS = 3;
const MIN_DOT_RADIUS = 3;

export type WidgetChartSvgOptions = {
  showMinEnvelope?: boolean;
  compact?: boolean;
};

function parseTimeMs(time: string): number {
  return new Date(time.includes('T') ? time : `${time}T12:00:00`).getTime();
}

function findIndexForTime(points: ChartPoint[], time: string): number {
  const exactIndex = points.findIndex((point) => point.time === time);
  if (exactIndex >= 0) {
    return exactIndex;
  }

  const targetMs = parseTimeMs(time);
  let bestIndex = 0;
  let bestDiff = Number.POSITIVE_INFINITY;

  points.forEach((point, index) => {
    const diff = Math.abs(parseTimeMs(point.time) - targetMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function findIndexForDayCenter(points: ChartPoint[], date: string): number {
  const indexes = points
    .map((point, index) => (point.time.startsWith(date) ? index : -1))
    .filter((index) => index >= 0);

  if (!indexes.length) {
    const fallback = points.findIndex((point) => point.time.startsWith(date));
    return fallback >= 0 ? fallback : 0;
  }

  return indexes[Math.floor(indexes.length / 2)];
}

function formatPeakLabel(value: number): string {
  if (Math.abs(value - Math.round(value)) < 0.05) {
    return `${Math.round(value)}`;
  }

  return value.toFixed(1);
}

function buildEnvelopePeakPoints(
  points: ChartPoint[],
  envelope: DailyEnvelope[],
  toX: (index: number) => number,
  toY: (value: number) => number,
  mode: 'max' | 'min',
): Array<PlotPoint & { value: number }> {
  return envelope.map((day) => {
    const value = mode === 'max' ? day.max : day.min;
    const time = mode === 'max' ? day.maxTime : day.minTime;
    const index = time
      ? findIndexForTime(points, time)
      : findIndexForDayCenter(points, day.date);

    return {
      x: toX(index),
      y: toY(value),
      value,
    };
  });
}

export function buildWidgetChartSvg(
  points: ChartPoint[],
  envelope: DailyEnvelope[],
  plotWidth: number,
  plotHeight: number,
  options: WidgetChartSvgOptions = {},
): string {
  const showMinEnvelope = options.showMinEnvelope ?? true;
  const compact = options.compact ?? false;

  if (points.length < 2 || plotWidth <= 0 || plotHeight <= 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotWidth}" height="${plotHeight}"></svg>`;
  }

  const values = points.map((point) => point.value);
  const envelopeValues = envelope.flatMap((day) =>
    showMinEnvelope ? [day.max, day.min] : [day.max],
  );
  const min = Math.min(...values, ...envelopeValues);
  const max = Math.max(...values, ...envelopeValues);
  const range = max - min || 1;
  const paddingTop = compact ? 4 : 16;
  const paddingBottom = compact ? 4 : 18;
  const dayLabelBaseline = plotHeight - 10;
  const innerHeight = plotHeight - paddingTop - paddingBottom;
  const lastIndex = Math.max(points.length - 1, 1);

  const toX = (index: number) => (index / lastIndex) * plotWidth;
  const toY = (value: number) =>
    paddingTop + innerHeight - ((value - min) / range) * innerHeight;

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${toX(index).toFixed(1)} ${toY(point.value).toFixed(1)}`,
    )
    .join(' ');

  const maxPeakPoints = buildEnvelopePeakPoints(points, envelope, toX, toY, 'max');
  const minPeakPoints = showMinEnvelope
    ? buildEnvelopePeakPoints(points, envelope, toX, toY, 'min')
    : [];

  const maxPath = compact ? '' : buildSmoothPath(maxPeakPoints);
  const minPath = compact || !showMinEnvelope ? '' : buildSmoothPath(minPeakPoints);

  const maxLabels = compact
    ? ''
    : maxPeakPoints
        .map((point) => {
          const labelY = Math.max(paddingTop + 2, point.y - 8);
          return `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${MAX_DOT_RADIUS}" fill="${MAX_COLOR}"/><text x="${point.x.toFixed(1)}" y="${labelY.toFixed(1)}" fill="#FFFFFF" font-size="${MAX_LABEL_FONT_SIZE}" text-anchor="middle" font-family="sans-serif" font-weight="bold">${formatPeakLabel(point.value)}</text>`;
        })
        .join('');

  const minLabels = compact
    ? ''
    : minPeakPoints
        .map((point) => {
          const labelY = Math.min(dayLabelBaseline - 6, point.y + MIN_LABEL_FONT_SIZE + 6);
          return `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${MIN_DOT_RADIUS}" fill="${MIN_COLOR}"/><text x="${point.x.toFixed(1)}" y="${labelY.toFixed(1)}" fill="#FFFFFF" font-size="${MIN_LABEL_FONT_SIZE}" text-anchor="middle" font-family="sans-serif" font-weight="bold">${formatPeakLabel(point.value)}</text>`;
        })
        .join('');

  const dayLabels = compact
    ? ''
    : getWeekDayMarkers(points)
        .map((marker) => {
          const x = marker.xFraction * plotWidth;
          const anchor =
            x < 10 ? 'start' : x > plotWidth - 10 ? 'end' : 'middle';
          const labelX =
            anchor === 'start' ? 2 : anchor === 'end' ? plotWidth - 2 : x;
          return `<text x="${labelX.toFixed(1)}" y="${dayLabelBaseline.toFixed(1)}" fill="${LABEL_COLOR}" font-size="${DAY_LABEL_FONT_SIZE}" text-anchor="${anchor}" font-family="sans-serif" font-weight="600">${marker.label}</text>`;
        })
        .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotWidth}" height="${plotHeight}" viewBox="0 0 ${plotWidth} ${plotHeight}">
    ${maxPath ? `<path d="${maxPath}" fill="none" stroke="${ENVELOPE_LINE_COLOR}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    ${minPath ? `<path d="${minPath}" fill="none" stroke="${ENVELOPE_LINE_COLOR}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    <path d="${linePath}" fill="none" stroke="${LINE_COLOR}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${maxLabels}
    ${minLabels}
    ${dayLabels}
  </svg>`;
}

export function buildWidgetEmptySvg(plotWidth: number, plotHeight: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotWidth}" height="${plotHeight}">
    <text x="${(plotWidth / 2).toFixed(1)}" y="${(plotHeight / 2).toFixed(1)}" fill="${LABEL_COLOR}" font-size="11" text-anchor="middle" font-family="sans-serif">Sin datos</text>
  </svg>`;
}

/** @deprecated Use buildWidgetChartSvg */
export const buildWidgetTemperatureSvg = buildWidgetChartSvg;
