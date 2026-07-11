import { ChartPoint } from './chartSeries';

function parseTimeMs(time: string): number {
  return new Date(time.includes('T') ? time : `${time}T12:00:00`).getTime();
}

export type ChartNowMarker = {
  x: number;
  y: number;
};

export function getChartNowMarker(
  points: ChartPoint[],
  toX: (index: number) => number,
  toY: (value: number) => number,
  referenceTimeMs: number = Date.now(),
): ChartNowMarker | null {
  if (points.length < 2) {
    return null;
  }

  const firstMs = parseTimeMs(points[0].time);
  const lastMs = parseTimeMs(points[points.length - 1].time);
  const targetMs = Math.max(firstMs, Math.min(lastMs, referenceTimeMs));

  if (targetMs < firstMs || targetMs > lastMs) {
    return null;
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const startMs = parseTimeMs(points[index].time);
    const endMs = parseTimeMs(points[index + 1].time);
    if (targetMs < startMs || targetMs > endMs) {
      continue;
    }

    const span = endMs - startMs || 1;
    const fraction = (targetMs - startMs) / span;
    const x = toX(index) + fraction * (toX(index + 1) - toX(index));
    const value =
      points[index].value + fraction * (points[index + 1].value - points[index].value);
    const y = toY(value);

    return { x, y };
  }

  return null;
}

export const CHART_NOW_DOT_COLOR = '#FFFFFF';
