const DAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;

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
  if (points.length === 0) {
    return [];
  }

  const dayBuckets = new Map<string, number[]>();

  points.forEach((point, index) => {
    const dayKey = point.time.slice(0, 10);
    const bucket = dayBuckets.get(dayKey) ?? [];
    bucket.push(index);
    dayBuckets.set(dayKey, bucket);
  });

  const lastIndex = points.length - 1;

  return [...dayBuckets.entries()].map(([dayKey, indexes]) => {
    const centerIndex = indexes[Math.floor(indexes.length / 2)];
    return {
      xFraction: lastIndex === 0 ? 0 : centerIndex / lastIndex,
      label: getDayLetter(dayKey),
    };
  });
}
