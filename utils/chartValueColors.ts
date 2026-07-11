import { getTemperatureLevel } from './temperatureLevel';
import { getUvIndexLevel } from './uvIndexLevel';

export type ChartValueColorMode = 'temperature' | 'uv';

export const CHART_PEAK_MAX_COLOR = '#FF9B7A';
export const CHART_PEAK_MIN_COLOR = '#7EC8FF';
export const CHART_PEAK_LABEL_COLOR = '#FFFFFF';

export function getChartPeakLabelColor(
  value: number,
  mode: ChartValueColorMode,
  role: 'max' | 'min',
  isWeekExtreme: boolean,
): string {
  if (mode === 'uv') {
    return getUvIndexLevel(value).color;
  }

  const level = getTemperatureLevel(value);
  if (isWeekExtreme) {
    if (!level) {
      return role === 'max' ? CHART_PEAK_MAX_COLOR : CHART_PEAK_MIN_COLOR;
    }
    return level.color;
  }

  return level?.color ?? CHART_PEAK_LABEL_COLOR;
}

export function getChartValueColor(
  value: number,
  mode: ChartValueColorMode,
): string {
  if (mode === 'uv') {
    return getUvIndexLevel(value).color;
  }

  return getTemperatureLevel(value)?.color ?? CHART_PEAK_LABEL_COLOR;
}
