import { WeatherData } from '../services/weather';
import {
  buildApparentTemperatureChartSeries,
  buildHumidityChartSeries,
  buildMetricChartSeries,
  buildEuropeanAqiChartSeries,
  buildPm25ChartSeries,
  buildPressureChartSeries,
  buildTemperatureChartSeries,
  buildUvIndexChartSeries,
  buildWindChartSeries,
  buildWindGustChartSeries,
  ChartPoint,
  DailyEnvelope,
  getApparentTemperatureEnvelope,
  getHumidityEnvelope,
  getMetricEnvelope,
  getPrecipitationEnvelope,
  getPressureEnvelope,
  getTemperatureEnvelope,
  getUvIndexEnvelope,
  getWindEnvelope,
  getWindGustEnvelope,
  scaleHourlyValues,
} from './chartSeries';

import { metricLabel, t } from '../i18n';
import { getHourlyValueAtNow } from './widgetHourly';

export type WidgetChartType =
  | 'temperature'
  | 'apparent'
  | 'humidity'
  | 'precipitation'
  | 'wind'
  | 'windGust'
  | 'pressure'
  | 'uv'
  | 'radiation'
  | 'visibility'
  | 'gases'
  | 'particles'
  | 'allergens';

export type WidgetChartSeries = {
  label: string;
  subtitle?: string;
  points: ChartPoint[];
  envelope: DailyEnvelope[];
  currentLabel: string;
};

export function getWidgetChartOptions(): { id: WidgetChartType; label: string }[] {
  return [
    { id: 'temperature', label: metricLabel('temperature') },
    { id: 'apparent', label: metricLabel('apparent') },
    { id: 'humidity', label: metricLabel('humidity') },
    { id: 'precipitation', label: metricLabel('precipitation') },
    { id: 'pressure', label: metricLabel('pressure') },
    { id: 'wind', label: metricLabel('wind') },
    { id: 'windGust', label: metricLabel('windGust') },
    { id: 'uv', label: metricLabel('uv') },
    { id: 'radiation', label: metricLabel('radiation') },
    { id: 'visibility', label: metricLabel('visibility') },
    { id: 'gases', label: metricLabel('gases') },
    { id: 'particles', label: metricLabel('particles') },
    { id: 'allergens', label: metricLabel('allergens') },
  ];
}

/** @deprecated Use getWidgetChartOptions */
export const WIDGET_CHART_OPTIONS = getWidgetChartOptions();

const INTEGER_PEAK_LABEL_CHARTS = new Set<WidgetChartType>([
  'temperature',
  'apparent',
  'humidity',
  'wind',
  'windGust',
  'pressure',
  'visibility',
  'particles',
  'allergens',
]);

export function usesIntegerPeakLabels(chartType: WidgetChartType): boolean {
  return INTEGER_PEAK_LABEL_CHARTS.has(chartType);
}

export function getWidgetPeakLabelSuffix(chartType: WidgetChartType): string {
  if (chartType === 'humidity') {
    return '%';
  }
  if (chartType === 'temperature' || chartType === 'apparent') {
    return '°';
  }
  return '';
}

function widgetChartSubtitle(chartType: WidgetChartType): string | undefined {
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
  const unitSuffix = unitSuffixByChart[chartType];
  if (!unitSuffix) {
    return undefined;
  }
  return `${metricLabel(chartType)}${unitSuffix}`;
}

export function buildWidgetChartsFromWeather(weather: WeatherData): Record<WidgetChartType, WidgetChartSeries> {
  const hourly = weather.hourly;
  const visibilityKm = scaleHourlyValues(hourly?.visibility, 1000);
  const precipNow = getHourlyValueAtNow(hourly, hourly?.precipitation) ?? 0;
  const gustNow = getHourlyValueAtNow(hourly, hourly?.windGust);
  const pressureNow = getHourlyValueAtNow(hourly, hourly?.pressure);
  const uvNow = getHourlyValueAtNow(hourly, hourly?.uvIndex);
  const radiationNow = getHourlyValueAtNow(hourly, hourly?.shortwaveRadiation);
  const visibilityNow = getHourlyValueAtNow(hourly, visibilityKm);
  const gasesNow = getHourlyValueAtNow(hourly, hourly?.europeanAqi);
  const particlesNow = getHourlyValueAtNow(hourly, hourly?.pm25);
  const allergensNow = getHourlyValueAtNow(hourly, hourly?.allergens);

  return {
    temperature: {
      label: metricLabel('temperature'),
      subtitle: widgetChartSubtitle('temperature'),
      points: buildTemperatureChartSeries(hourly, weather.daily).points,
      envelope: getTemperatureEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(weather.current.temperature)}°`,
    },
    apparent: {
      label: metricLabel('apparent'),
      subtitle: widgetChartSubtitle('apparent'),
      points: buildApparentTemperatureChartSeries(hourly, weather.daily).points,
      envelope: getApparentTemperatureEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(weather.current.apparentTemperature ?? weather.current.temperature)}°`,
    },
    humidity: {
      label: metricLabel('humidity'),
      subtitle: widgetChartSubtitle('humidity'),
      points: buildHumidityChartSeries(hourly, weather.daily).points,
      envelope: getHumidityEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(weather.current.humidity)}%`,
    },
    precipitation: {
      label: metricLabel('precipitation'),
      subtitle: t('units.mmh'),
      points: buildMetricChartSeries(hourly, hourly?.precipitation, weather.daily).points,
      envelope: getPrecipitationEnvelope(hourly, hourly?.precipitation, weather.daily),
      currentLabel: `${precipNow.toFixed(1)} mm/h`,
    },
    wind: {
      label: metricLabel('wind'),
      subtitle: widgetChartSubtitle('wind'),
      points: buildWindChartSeries(hourly, weather.daily).points,
      envelope: getWindEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(weather.current.windSpeed)} km/h`,
    },
    windGust: {
      label: metricLabel('windGust'),
      subtitle: widgetChartSubtitle('windGust'),
      points: buildWindGustChartSeries(hourly, weather.daily).points,
      envelope: getWindGustEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(gustNow ?? weather.daily[0]?.maxWindGust ?? 0)} km/h`,
    },
    pressure: {
      label: metricLabel('pressure'),
      subtitle: widgetChartSubtitle('pressure'),
      points: buildPressureChartSeries(hourly, weather.daily).points,
      envelope: getPressureEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(pressureNow ?? 1013)} mbar`,
    },
    uv: {
      label: metricLabel('uv'),
      points: buildUvIndexChartSeries(hourly, weather.daily).points,
      envelope: getUvIndexEnvelope(hourly, weather.daily),
      currentLabel: (uvNow ?? 0).toFixed(1),
    },
    radiation: {
      label: metricLabel('radiation'),
      subtitle: widgetChartSubtitle('radiation'),
      points: buildMetricChartSeries(hourly, hourly?.shortwaveRadiation, weather.daily).points,
      envelope: getMetricEnvelope(hourly, hourly?.shortwaveRadiation, weather.daily),
      currentLabel: `${Math.round(radiationNow ?? 0)} W/m²`,
    },
    visibility: {
      label: metricLabel('visibility'),
      subtitle: widgetChartSubtitle('visibility'),
      points: buildMetricChartSeries(hourly, visibilityKm, weather.daily).points,
      envelope: getMetricEnvelope(hourly, visibilityKm, weather.daily),
      currentLabel: `${Math.round(visibilityNow ?? 0)} km`,
    },
    gases: {
      label: metricLabel('gases'),
      subtitle: widgetChartSubtitle('gases'),
      points: buildEuropeanAqiChartSeries(hourly, weather.daily).points,
      envelope: getMetricEnvelope(hourly, hourly?.europeanAqi, weather.daily),
      currentLabel: `${Math.round(gasesNow ?? 0)} EAQI`,
    },
    particles: {
      label: metricLabel('particles'),
      subtitle: widgetChartSubtitle('particles'),
      points: buildPm25ChartSeries(hourly, weather.daily).points,
      envelope: getMetricEnvelope(hourly, hourly?.pm25, weather.daily),
      currentLabel: `${Math.round(particlesNow ?? 0)} µg/m³`,
    },
    allergens: {
      label: metricLabel('allergens'),
      subtitle: widgetChartSubtitle('allergens'),
      points: buildMetricChartSeries(hourly, hourly?.allergens, weather.daily).points,
      envelope: getMetricEnvelope(hourly, hourly?.allergens, weather.daily),
      currentLabel: `${Math.round(allergensNow ?? 0)} grains/m³`,
    },
  };
}
