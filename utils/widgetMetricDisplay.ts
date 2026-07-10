import { getTemperatureLevel } from './temperatureLevel';
import { getUvIndexLevel } from './uvIndexLevel';
import { WidgetChartType } from './widgetChartData';
import { t } from '../i18n';

export type WidgetMetricParts = {
  value: string;
  unit: string;
};

export function getWidgetMetricUnit(chartType: WidgetChartType): string {
  const unitSuffixByChart: Partial<Record<WidgetChartType, string>> = {
    temperature: t('units.celsius'),
    apparent: t('units.celsius'),
    humidity: t('units.percent'),
    wind: t('units.kmh'),
    windGust: t('units.kmh'),
    pressure: t('units.mbar'),
    radiation: t('units.wm2'),
    visibility: t('units.km'),
    gases: t('units.eaqi'),
    particles: t('units.ugm3'),
    allergens: t('units.grains'),
  };

  if (chartType === 'precipitation') {
    return 'mm/h';
  }

  const raw = unitSuffixByChart[chartType];
  if (!raw) {
    return '';
  }

  return raw.replace(/^\s*\(|\)$/g, '').trim();
}

export function getWidgetMetricParts(
  chartType: WidgetChartType,
  currentLabel: string,
): WidgetMetricParts {
  if (!currentLabel || currentLabel === '--') {
    return { value: '--', unit: getWidgetMetricUnit(chartType) };
  }

  const numericMatch = currentLabel.match(/^(-?\d+(?:\.\d+)?)/);
  if (!numericMatch) {
    return { value: currentLabel, unit: '' };
  }

  return {
    value: numericMatch[1],
    unit: getWidgetMetricUnit(chartType),
  };
}

export function parseWidgetMetricValue(currentLabel: string): number | null {
  if (!currentLabel || currentLabel === '--') {
    return null;
  }

  const numericMatch = currentLabel.match(/^(-?\d+(?:\.\d+)?)/);
  return numericMatch ? Number(numericMatch[1]) : null;
}

export function getWidgetMetricValueColor(
  chartType: WidgetChartType,
  currentLabel: string,
): string | undefined {
  const numericValue = parseWidgetMetricValue(currentLabel);
  if (numericValue === null) {
    return undefined;
  }

  if (chartType === 'temperature' || chartType === 'apparent') {
    return getTemperatureLevel(numericValue)?.color;
  }

  if (chartType === 'uv') {
    return getUvIndexLevel(numericValue).color;
  }

  return undefined;
}
