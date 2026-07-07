import { ChartPoint } from './chartSeries';
import type { DailyEnvelope } from './chartSeries';

export type DailyPeakPoint = {
  x: number;
  y: number;
  value: number;
};

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
    const indexes = points
      .map((point, index) => ({ point, index }))
      .filter(({ point }) => point.time.startsWith(day.date))
      .map(({ index }) => index);

    let centerIndex = indexes[Math.floor(indexes.length / 2)] ?? 0;
    if (indexes.length === 0) {
      const fallbackIndex = points.findIndex((point) => point.time.startsWith(day.date));
      centerIndex = fallbackIndex >= 0 ? fallbackIndex : maxPoints.length;
    }

    const x = scale.paddingLeft + (centerIndex / lastIndex) * scale.innerWidth;

    maxPoints.push({
      x,
      y: toY(day.max),
      value: day.max,
    });
    minPoints.push({
      x,
      y: toY(day.min),
      value: day.min,
    });
  });

  return { maxPoints, minPoints };
}
