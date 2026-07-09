const DAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;

function parseTimeMs(time: string): number {
  return new Date(time.includes('T') ? time : `${time}T12:00:00`).getTime();
}

export function getDayLetter(dateString: string): string {
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T12:00:00`);
  return DAY_LETTERS[date.getDay()];
}

export type DayMarker = {
  xFraction: number;
  label: string;
};

export function getWeekDayMarkers(
  points: Array<{ time: string }>,
): DayMarker[] {
  if (points.length < 2) {
    return [];
  }

  const firstMs = parseTimeMs(points[0].time);
  const lastMs = parseTimeMs(points[points.length - 1].time);
  const rangeMs = lastMs - firstMs || 1;
  const dayKeys = [...new Set(points.map((point) => point.time.slice(0, 10)))].sort();

  return dayKeys.map((dayKey) => {
    const dayCenterMs = parseTimeMs(`${dayKey}T12:00:00`);
    const clampedMs = Math.max(firstMs, Math.min(lastMs, dayCenterMs));

    return {
      xFraction: (clampedMs - firstMs) / rangeMs,
      label: getDayLetter(dayKey),
    };
  });
}
