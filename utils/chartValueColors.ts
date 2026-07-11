import { getTemperatureLevel, NORMAL_TEMPERATURE_VALUE_COLOR } from './temperatureLevel';
import { getUvIndexLevel } from './uvIndexLevel';

export type ChartValueColorMode = 'temperature' | 'uv';

export const CHART_PEAK_MAX_COLOR = '#FF9B7A';
export const CHART_PEAK_MIN_COLOR = '#7EC8FF';
export const CHART_PEAK_LABEL_COLOR = '#FFFFFF';

export function getChartPeakLabelColor(
  value: number,
  mode: ChartValueColorMode,
): string {
  if (mode === 'uv') {
    return getUvIndexLevel(value).color;
  }

  return getTemperatureLevel(value)?.color ?? NORMAL_TEMPERATURE_VALUE_COLOR;
}

export function isChartGlobalPeakBold(
  mode: ChartValueColorMode,
  role: 'max' | 'min',
  isGlobalExtreme: boolean,
): boolean {
  if (!isGlobalExtreme) {
    return false;
  }

  if (mode === 'uv') {
    return role === 'max';
  }

  return true;
}

export function getChartValueColor(
  value: number,
  mode: ChartValueColorMode,
): string {
  if (mode === 'uv') {
    return getUvIndexLevel(value).color;
  }

  return getTemperatureLevel(value)?.color ?? NORMAL_TEMPERATURE_VALUE_COLOR;
}
