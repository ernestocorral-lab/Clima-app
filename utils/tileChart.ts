import { DailyForecast, HourlyForecast, WeatherData } from '../services/weather';
import {
  buildApparentTemperatureChartSeries,
  buildEuropeanAqiChartSeries,
  buildHumidityChartSeries,
  buildMetricChartSeries,
  buildPm25ChartSeries,
  buildPressureChartSeries,
  buildTemperatureChartSeries,
  buildUvIndexChartSeries,
  buildWindChartSeries,
  buildWindGustChartSeries,
  ChartSeries,
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
import { getWidgetChartValueColorMode } from './widgetChartColors';
import { WidgetChartType, getWidgetPeakLabelSuffix } from './widgetChartData';
import { metricLabel } from '../i18n';
import { ChartValueColorMode } from './chartValueColors';

export type TileChartConfig = {
  series: ChartSeries;
  envelope: DailyEnvelope[];
  label: string;
  valueSuffix: string;
  valueColorMode?: ChartValueColorMode;
  showMinEnvelope: boolean;
};

function buildSeriesForType(
  chartType: WidgetChartType,
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  const visibilityKm = scaleHourlyValues(hourly?.visibility, 1000);

  switch (chartType) {
    case 'temperature':
      return buildTemperatureChartSeries(hourly, daily);
    case 'apparent':
      return buildApparentTemperatureChartSeries(hourly, daily);
    case 'humidity':
      return buildHumidityChartSeries(hourly, daily);
    case 'precipitation':
      return buildMetricChartSeries(hourly, hourly?.precipitation, daily);
    case 'wind':
      return buildWindChartSeries(hourly, daily);
    case 'windGust':
      return buildWindGustChartSeries(hourly, daily);
    case 'pressure':
      return buildPressureChartSeries(hourly, daily);
    case 'uv':
      return buildUvIndexChartSeries(hourly, daily);
    case 'radiation':
      return buildMetricChartSeries(hourly, hourly?.shortwaveRadiation, daily);
    case 'visibility':
      return buildMetricChartSeries(hourly, visibilityKm, daily);
    case 'gases':
      return buildEuropeanAqiChartSeries(hourly, daily);
    case 'particles':
      return buildPm25ChartSeries(hourly, daily);
    case 'allergens':
      return buildMetricChartSeries(hourly, hourly?.allergens, daily);
    default:
      return buildApparentTemperatureChartSeries(hourly, daily);
  }
}

function getEnvelopeForType(
  chartType: WidgetChartType,
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): DailyEnvelope[] {
  const visibilityKm = scaleHourlyValues(hourly?.visibility, 1000);

  switch (chartType) {
    case 'temperature':
      return getTemperatureEnvelope(hourly, daily);
    case 'apparent':
      return getApparentTemperatureEnvelope(hourly, daily);
    case 'humidity':
      return getHumidityEnvelope(hourly, daily);
    case 'precipitation':
      return getPrecipitationEnvelope(hourly, hourly?.precipitation, daily);
    case 'wind':
      return getWindEnvelope(hourly, daily);
    case 'windGust':
      return getWindGustEnvelope(hourly, daily);
    case 'pressure':
      return getPressureEnvelope(hourly, daily);
    case 'uv':
      return getUvIndexEnvelope(hourly, daily);
    case 'radiation':
      return getMetricEnvelope(hourly, hourly?.shortwaveRadiation, daily);
    case 'visibility':
      return getMetricEnvelope(hourly, visibilityKm, daily);
    case 'gases':
      return getMetricEnvelope(hourly, hourly?.europeanAqi, daily);
    case 'particles':
      return getMetricEnvelope(hourly, hourly?.pm25, daily);
    case 'allergens':
      return getMetricEnvelope(hourly, hourly?.allergens, daily);
    default:
      return getApparentTemperatureEnvelope(hourly, daily);
  }
}

export function buildTileChartConfig(
  weather: WeatherData,
  chartType: WidgetChartType,
): TileChartConfig {
  const hourly = weather.hourly;
  const daily = weather.daily;

  return {
    series: buildSeriesForType(chartType, hourly, daily),
    envelope: getEnvelopeForType(chartType, hourly, daily),
    label: metricLabel(chartType),
    valueSuffix: getWidgetPeakLabelSuffix(chartType),
    valueColorMode: getWidgetChartValueColorMode(chartType),
    showMinEnvelope: chartType !== 'precipitation',
  };
}
