import { ChartPoint } from './chartSeries';
import type { DailyEnvelope } from './chartSeries';

export type DailyPeakPoint = {
  x: number;
  y: number;
  value: number;
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

function findIndexForValue(
  points: ChartPoint[],
  dayDate: string,
  targetValue: number,
  mode: 'max' | 'min',
): number {
  const dayIndexes = points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.time.startsWith(dayDate))
    .map(({ index }) => index);

  if (!dayIndexes.length) {
    const fallbackIndex = points.findIndex((point) => point.time.startsWith(dayDate));
    return fallbackIndex >= 0 ? fallbackIndex : 0;
  }

  return dayIndexes.reduce((bestIndex, index) => {
    const bestDistance = Math.abs(points[bestIndex].value - targetValue);
    const indexDistance = Math.abs(points[index].value - targetValue);

    if (indexDistance < bestDistance) {
      return index;
    }

    if (indexDistance === bestDistance) {
      if (mode === 'max' && points[index].value > points[bestIndex].value) {
        return index;
      }
      if (mode === 'min' && points[index].value < points[bestIndex].value) {
        return index;
      }
    }

    return bestIndex;
  }, dayIndexes[0]);
}

export function getDailyPeakPoints(
  daily: DailyEnvelope[],
  points: ChartPoint[],
  scale: {
    paddingLeft: number;
    innerWidth: number;
    paddingTop: number;
    innerHeight: number;
    minValue: number;
    maxValue: number;
  },
): { maxPoints: DailyPeakPoint[]; minPoints: DailyPeakPoint[] } {
  const range = scale.maxValue - scale.minValue || 1;
  const lastIndex = Math.max(points.length - 1, 1);

  const toY = (value: number) =>
    scale.paddingTop +
    scale.innerHeight -
    ((value - scale.minValue) / range) * scale.innerHeight;

  const maxPoints: DailyPeakPoint[] = [];
  const minPoints: DailyPeakPoint[] = [];

  daily.forEach((day) => {
    const maxIndex = day.maxTime
      ? findIndexForTime(points, day.maxTime)
      : findIndexForValue(points, day.date, day.max, 'max');
    const minIndex = day.minTime
      ? findIndexForTime(points, day.minTime)
      : findIndexForValue(points, day.date, day.min, 'min');

    const maxX = scale.paddingLeft + (maxIndex / lastIndex) * scale.innerWidth;
    const minX = scale.paddingLeft + (minIndex / lastIndex) * scale.innerWidth;

    maxPoints.push({
      x: maxX,
      y: toY(day.max),
      value: day.max,
    });
    minPoints.push({
      x: minX,
      y: toY(day.min),
      value: day.min,
    });
  });

  return { maxPoints, minPoints };
}
