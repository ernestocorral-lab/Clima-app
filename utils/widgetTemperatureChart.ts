import { ChartPoint, DailyEnvelope } from './chartSeries';
import { getDailyPeakPoints } from './dailyPeaks';
import { getWeekDayMarkers } from './dayLabels';
import { buildSmoothPath } from './smoothPath';
import { t } from '../i18n';

/** Matches CitySummaryTile + TemperatureChart (height=68, labelFontSize=10). */
export const TILE_CHART_HEIGHT = 68;
export const TILE_DAY_ROW_HEIGHT = 16;
export const TILE_CHART_TOTAL_HEIGHT = TILE_CHART_HEIGHT + TILE_DAY_ROW_HEIGHT;

const CHART_LINE_BLUE = '#5B9BFF';
const CHART_LINE_YELLOW = '#FFEB3B';
const PEAK_MAX_COLOR = '#FF9B7A';
const PEAK_MIN_COLOR = '#7EC8FF';
const PEAK_LABEL_COLOR = '#FFFFFF';
const DAY_LABEL_COLOR = '#9BB4DE';
const GRID_COLOR = '#1A2F57';

const PADDING_LEFT = 4;
const PADDING_RIGHT = 4;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 16;
const LABEL_FONT_SIZE = 10;
const DAY_LABEL_FONT_SIZE = 11;
const MAX_LABEL_OFFSET = 8;
const MIN_LABEL_OFFSET = 12;
const LINE_STROKE = 1.5;
const ENVELOPE_STROKE = 1.2;
const ENVELOPE_DOT_R = 2.5;
const LAST_DOT_R = 2.5;

export type WidgetChartSvgOptions = {
  showMinEnvelope?: boolean;
  compact?: boolean;
};

function formatPeakLabel(value: number): string {
  if (Math.abs(value - Math.round(value)) < 0.05) {
    return `${Math.round(value)}`;
  }

  return value.toFixed(1);
}

function isPeakValue(value: number, peakValue: number | null): boolean {
  return peakValue !== null && Math.abs(value - peakValue) < 0.05;
}

function buildTileChartSvg(
  points: ChartPoint[],
  envelope: DailyEnvelope[],
  plotWidth: number,
  showMinEnvelope: boolean,
): string {
  const chartHeight = TILE_CHART_HEIGHT;
  const totalHeight = TILE_CHART_TOTAL_HEIGHT;
  const innerWidth = plotWidth - PADDING_LEFT - PADDING_RIGHT;
  const innerHeight = chartHeight - PADDING_TOP - PADDING_BOTTOM;
  const lastIndex = Math.max(points.length - 1, 1);

  const seriesValues = points.map((point) => point.value);
  const envelopeValues = envelope.flatMap((day) =>
    showMinEnvelope ? [day.max, day.min] : [day.max],
  );
  const allValues = [...seriesValues, ...envelopeValues];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const toX = (index: number) => PADDING_LEFT + (index / lastIndex) * innerWidth;
  const toY = (value: number) =>
    PADDING_TOP + innerHeight - ((value - min) / range) * innerHeight;

  const plotted = points.map((point, index) => ({
    x: toX(index),
    y: toY(point.value),
    value: point.value,
    time: point.time,
  }));

  const linePath = plotted
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');

  const { maxPoints, minPoints } = getDailyPeakPoints(envelope, points, {
    paddingLeft: PADDING_LEFT,
    innerWidth,
    paddingTop: PADDING_TOP,
    innerHeight,
    minValue: min,
    maxValue: max,
  });

  const visibleMinPoints = showMinEnvelope ? minPoints : [];
  const maxPath = buildSmoothPath(maxPoints);
  const minPath = showMinEnvelope ? buildSmoothPath(visibleMinPoints) : '';

  const weekMaxPeakValue =
    maxPoints.length > 0 ? Math.max(...maxPoints.map((point) => point.value)) : null;
  const weekMinPeakValue =
    visibleMinPoints.length > 0
      ? Math.min(...visibleMinPoints.map((point) => point.value))
      : null;

  const gridStep = Math.max(1, Math.floor(plotted.length / 7));
  const gridLines = plotted
    .filter((_, index) => index % gridStep === 0)
    .map(
      (point) =>
        `<line x1="${point.x.toFixed(1)}" y1="${PADDING_TOP}" x2="${point.x.toFixed(1)}" y2="${(chartHeight - PADDING_BOTTOM).toFixed(1)}" stroke="${GRID_COLOR}" stroke-width="0.5"/>`,
    )
    .join('');

  const envelopeDots = [
    ...maxPoints.map(
      (point) =>
        `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${ENVELOPE_DOT_R}" fill="${CHART_LINE_YELLOW}"/>`,
    ),
    ...(showMinEnvelope
      ? visibleMinPoints.map(
          (point) =>
            `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${ENVELOPE_DOT_R}" fill="${CHART_LINE_YELLOW}"/>`,
        )
      : []),
  ].join('');

  const maxLabels = maxPoints
    .map((point) => {
      const labelY = Math.max(PADDING_TOP + 4, point.y - MAX_LABEL_OFFSET);
      const fill = isPeakValue(point.value, weekMaxPeakValue)
        ? PEAK_MAX_COLOR
        : PEAK_LABEL_COLOR;
      return `<text x="${point.x.toFixed(1)}" y="${labelY.toFixed(1)}" fill="${fill}" font-size="${LABEL_FONT_SIZE}" text-anchor="middle" font-family="sans-serif" font-weight="bold">${formatPeakLabel(point.value)}</text>`;
    })
    .join('');

  const minLabels = visibleMinPoints
    .map((point) => {
      const labelY = Math.min(point.y + MIN_LABEL_OFFSET, chartHeight - 4);
      const fill = isPeakValue(point.value, weekMinPeakValue)
        ? PEAK_MIN_COLOR
        : PEAK_LABEL_COLOR;
      return `<text x="${point.x.toFixed(1)}" y="${labelY.toFixed(1)}" fill="${fill}" font-size="${LABEL_FONT_SIZE}" text-anchor="middle" font-family="sans-serif" font-weight="bold">${formatPeakLabel(point.value)}</text>`;
    })
    .join('');

  const dayLabels = getWeekDayMarkers(points)
    .map((marker) => {
      const x = PADDING_LEFT + marker.xFraction * innerWidth;
      return `<text x="${x.toFixed(1)}" y="${(chartHeight + 12).toFixed(1)}" fill="${DAY_LABEL_COLOR}" font-size="${DAY_LABEL_FONT_SIZE}" text-anchor="middle" font-family="sans-serif" font-weight="bold">${marker.label}</text>`;
    })
    .join('');

  const lastPoint = plotted[plotted.length - 1];
  const lastDot = `<circle cx="${lastPoint.x.toFixed(1)}" cy="${lastPoint.y.toFixed(1)}" r="${LAST_DOT_R}" fill="${CHART_LINE_BLUE}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotWidth}" height="${totalHeight}" viewBox="0 0 ${plotWidth} ${totalHeight}">
    ${gridLines}
    <path d="${linePath}" fill="none" stroke="${CHART_LINE_BLUE}" stroke-width="${LINE_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>
    ${maxPath ? `<path d="${maxPath}" fill="none" stroke="${CHART_LINE_YELLOW}" stroke-width="${ENVELOPE_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    ${minPath ? `<path d="${minPath}" fill="none" stroke="${CHART_LINE_YELLOW}" stroke-width="${ENVELOPE_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    ${envelopeDots}
    ${maxLabels}
    ${minLabels}
    ${lastDot}
    ${dayLabels}
  </svg>`;
}

function buildCompactChartSvg(
  points: ChartPoint[],
  envelope: DailyEnvelope[],
  plotWidth: number,
  plotHeight: number,
  showMinEnvelope: boolean,
): string {
  if (points.length < 2 || plotWidth <= 0 || plotHeight <= 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotWidth}" height="${plotHeight}"></svg>`;
  }

  const paddingTop = 4;
  const paddingBottom = 4;
  const innerHeight = plotHeight - paddingTop - paddingBottom;
  const innerWidth = plotWidth;
  const lastIndex = Math.max(points.length - 1, 1);

  const seriesValues = points.map((point) => point.value);
  const envelopeValues = envelope.flatMap((day) =>
    showMinEnvelope ? [day.max, day.min] : [day.max],
  );
  const min = Math.min(...seriesValues, ...envelopeValues);
  const max = Math.max(...seriesValues, ...envelopeValues);
  const range = max - min || 1;

  const toX = (index: number) => (index / lastIndex) * innerWidth;
  const toY = (value: number) =>
    paddingTop + innerHeight - ((value - min) / range) * innerHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${toX(index).toFixed(1)} ${toY(point.value).toFixed(1)}`)
    .join(' ');

  const { maxPoints } = getDailyPeakPoints(envelope, points, {
    paddingLeft: 0,
    innerWidth,
    paddingTop,
    innerHeight,
    minValue: min,
    maxValue: max,
  });
  const maxPath = buildSmoothPath(maxPoints);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotWidth}" height="${plotHeight}" viewBox="0 0 ${plotWidth} ${plotHeight}">
    ${maxPath ? `<path d="${maxPath}" fill="none" stroke="${CHART_LINE_YELLOW}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    <path d="${linePath}" fill="none" stroke="${CHART_LINE_BLUE}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
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

  if (points.length < 2 || plotWidth <= 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotWidth}" height="${plotHeight}"></svg>`;
  }

  if (compact) {
    return buildCompactChartSvg(points, envelope, plotWidth, plotHeight, showMinEnvelope);
  }

  return buildTileChartSvg(points, envelope, plotWidth, showMinEnvelope);
}

export function buildWidgetEmptySvg(plotWidth: number, plotHeight: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotWidth}" height="${plotHeight}">
    <text x="${(plotWidth / 2).toFixed(1)}" y="${(plotHeight / 2).toFixed(1)}" fill="${DAY_LABEL_COLOR}" font-size="11" text-anchor="middle" font-family="sans-serif">${t('common.noData')}</text>
  </svg>`;
}

/** @deprecated Use buildWidgetChartSvg */
export const buildWidgetTemperatureSvg = buildWidgetChartSvg;
