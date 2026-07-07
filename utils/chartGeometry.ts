import { ChartPoint } from './chartSeries';

export type PlottedPoint = {
  x: number;
  y: number;
  value: number;
  time: string;
};

export type ChartGeometry = {
  polyline: string;
  min: number;
  max: number;
  plotted: PlottedPoint[];
  width: number;
  height: number;
  padding: number;
};

export function buildChartGeometry(
  points: ChartPoint[],
  width: number,
  height: number,
  padding = 4,
): ChartGeometry | null {
  if (points.length < 2 || width <= 0) {
    return null;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const plotted = points.map((point, index) => {
    const x = padding + (index / (points.length - 1)) * innerWidth;
    const y = padding + innerHeight - ((point.value - min) / range) * innerHeight;
    return {
      x,
      y,
      value: point.value,
      time: point.time,
    };
  });

  return {
    polyline: plotted.map((point) => `${point.x},${point.y}`).join(' '),
    min,
    max,
    plotted,
    width,
    height,
    padding,
  };
}

function formatPointTime(isoTime: string, intervalHours: number): string {
  const date = new Date(isoTime);
  if (intervalHours >= 24) {
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  }
  return date.toLocaleString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getHighlightedPoints(
  plotted: PlottedPoint[],
  intervalHours: number,
  maxItems = 8,
): Array<{ label: string; value: number }> {
  if (plotted.length <= maxItems) {
    return plotted.map((point) => ({
      label: formatPointTime(point.time, intervalHours),
      value: point.value,
    }));
  }

  const step = Math.ceil(plotted.length / maxItems);
  const highlights: Array<{ label: string; value: number }> = [];

  for (let index = 0; index < plotted.length; index += step) {
    const point = plotted[index];
    highlights.push({
      label: formatPointTime(point.time, intervalHours),
      value: point.value,
    });
  }

  const last = plotted[plotted.length - 1];
  const lastLabel = formatPointTime(last.time, intervalHours);
  if (highlights[highlights.length - 1]?.label !== lastLabel) {
    highlights.push({ label: lastLabel, value: last.value });
  }

  return highlights;
}
