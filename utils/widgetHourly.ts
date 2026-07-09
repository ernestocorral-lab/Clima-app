import { HourlyForecast } from '../services/weather';

function parseTimeMs(time: string): number {
  return new Date(time.includes('T') ? time : `${time}T12:00:00`).getTime();
}

export function findClosestHourlyIndex(times: string[]): number {
  if (!times.length) {
    return 0;
  }

  const now = Date.now();
  let bestIndex = 0;
  let bestDiff = Number.POSITIVE_INFINITY;

  times.forEach((time, index) => {
    const diff = Math.abs(parseTimeMs(time) - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = index;
    }
  });

  return bestIndex;
}

export function getHourlyValueAtNow(
  hourly: HourlyForecast | undefined,
  values: number[] | undefined,
): number | undefined {
  if (!hourly?.time.length || !values?.length) {
    return undefined;
  }

  const index = findClosestHourlyIndex(hourly.time);
  return values[index];
}
