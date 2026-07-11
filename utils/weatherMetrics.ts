import { WeatherData } from '../services/weather';
import { t } from '../i18n';
import { getTemperatureLevel, getTemperatureValueColor } from './temperatureLevel';
import { getUvIndexLevel } from './uvIndexLevel';
import { getWidgetMetricValueColor } from './widgetMetricDisplay';
import {
  buildWidgetChartsFromWeather,
  WidgetChartType,
} from './widgetChartData';
import { WeekSummary } from './weekSummary';

export type MetricScrollTarget =
  | 'temperature'
  | 'apparent'
  | 'humidity'
  | 'wind'
  | 'windGust'
  | 'precipitation'
  | 'uv'
  | 'pressure'
  | 'radiation'
  | 'visibility'
  | 'gases'
  | 'particles'
  | 'allergens';

export const PRIMARY_CURRENT_METRIC_IDS: WidgetChartType[] = [
  'temperature',
  'apparent',
  'humidity',
  'wind',
  'uv',
];

const EXTRA_CURRENT_SHORT_LABEL: Partial<Record<WidgetChartType, string>> = {
  precipitation: 'Precipit:',
  radiation: 'Rad:',
  allergens: 'Alerg:',
};

const CURRENT_METRIC_SCROLL: Partial<Record<WidgetChartType, MetricScrollTarget>> = {
  precipitation: 'precipitation',
  windGust: 'windGust',
  pressure: 'pressure',
  uv: 'uv',
  radiation: 'radiation',
  visibility: 'visibility',
  gases: 'gases',
  particles: 'particles',
  allergens: 'allergens',
};

export type CurrentMetricDisplay = {
  id: WidgetChartType;
  displayLine: string;
  scrollKey?: MetricScrollTarget;
  color?: string;
};

export type WeeklyMaxRow = {
  id: string;
  label: string;
  value: string;
  dayLabel: string;
  scrollKey?: MetricScrollTarget;
  valueColor?: string;
  levelColor?: string;
  levelLabel?: string;
  essential: boolean;
};

const ESSENTIAL_WEEKLY_MAX_IDS = new Set([
  'maxTemp',
  'apparent',
  'minTemp',
  'precip',
  'uv',
]);

function formatExtraCurrentLine(id: WidgetChartType, label: string, value: string): string {
  const shortLabel = EXTRA_CURRENT_SHORT_LABEL[id];
  if (shortLabel) {
    return `${shortLabel} ${value}`;
  }
  return `${label}: ${value}`;
}

export function getExtraCurrentMetrics(weather: WeatherData): CurrentMetricDisplay[] {
  const charts = buildWidgetChartsFromWeather(weather);

  return (Object.keys(charts) as WidgetChartType[])
    .filter((id) => !PRIMARY_CURRENT_METRIC_IDS.includes(id))
    .map((id) => {
      const chart = charts[id];
      return {
        id,
        displayLine: formatExtraCurrentLine(id, chart.label, chart.currentLabel),
        scrollKey: CURRENT_METRIC_SCROLL[id],
        color: getWidgetMetricValueColor(id, chart.currentLabel),
      };
    });
}

export function getWeeklyMaxRows(
  summary: WeekSummary,
  options: { essentialOnly?: boolean } = {},
): WeeklyMaxRow[] {
  const maxTempLevel = getTemperatureLevel(summary.max.temperature);
  const apparentTempLevel = getTemperatureLevel(summary.maxApparentTemp.value);
  const minTempLevel = getTemperatureLevel(summary.min.temperature);
  const uvLevel = getUvIndexLevel(summary.maxUvIndex.value);

  const rows: WeeklyMaxRow[] = [
    {
      id: 'maxTemp',
      label: t('summary.maxTemp'),
      value: `${Math.round(summary.max.temperature)}°`,
      dayLabel: summary.max.dayLabel,
      scrollKey: 'temperature',
      valueColor: getTemperatureValueColor(summary.max.temperature),
      levelColor: getTemperatureValueColor(summary.max.temperature),
      levelLabel: maxTempLevel ? t(`temperature.level.${maxTempLevel.key}`) : undefined,
      essential: true,
    },
    {
      id: 'apparent',
      label: t('summary.apparent'),
      value: `${Math.round(summary.maxApparentTemp.value)}°`,
      dayLabel: summary.maxApparentTemp.dayLabel,
      scrollKey: 'apparent',
      valueColor: getTemperatureValueColor(summary.maxApparentTemp.value),
      levelColor: getTemperatureValueColor(summary.maxApparentTemp.value),
      levelLabel: apparentTempLevel ? t(`temperature.level.${apparentTempLevel.key}`) : undefined,
      essential: false,
    },
    {
      id: 'minTemp',
      label: t('summary.minTemp'),
      value: `${Math.round(summary.min.temperature)}°`,
      dayLabel: summary.min.dayLabel,
      scrollKey: 'temperature',
      valueColor: getTemperatureValueColor(summary.min.temperature),
      levelColor: getTemperatureValueColor(summary.min.temperature),
      levelLabel: minTempLevel ? t(`temperature.level.${minTempLevel.key}`) : undefined,
      essential: true,
    },
    {
      id: 'humidity',
      label: t('summary.humidity'),
      value: `${Math.round(summary.maxHumidity.value)}%`,
      dayLabel: summary.maxHumidity.dayLabel,
      scrollKey: 'humidity',
      essential: false,
    },
    {
      id: 'wind',
      label: t('summary.wind'),
      value: `${Math.round(summary.maxWindSpeed.value)} km/h`,
      dayLabel: summary.maxWindSpeed.dayLabel,
      scrollKey: 'wind',
      essential: false,
    },
    {
      id: 'gust',
      label: t('summary.gust'),
      value: `${Math.round(summary.maxWindGust.speed)} km/h`,
      dayLabel: summary.maxWindGust.dayLabel,
      scrollKey: 'windGust',
      essential: false,
    },
    {
      id: 'precip',
      label: t('summary.precip'),
      value: `${summary.maxPrecipitation.value.toFixed(1)} mm`,
      dayLabel: summary.maxPrecipitation.dayLabel,
      scrollKey: 'precipitation',
      essential: true,
    },
    {
      id: 'uv',
      label: t('summary.uv'),
      value: summary.maxUvIndex.value.toFixed(1),
      dayLabel: summary.maxUvIndex.dayLabel,
      scrollKey: 'uv',
      valueColor: uvLevel.color,
      levelColor: uvLevel.color,
      levelLabel: t(`uv.level.${uvLevel.key}`),
      essential: true,
    },
    {
      id: 'pressure',
      label: t('summary.pressure'),
      value: `${Math.round(summary.maxPressure.value)} mbar`,
      dayLabel: summary.maxPressure.dayLabel,
      scrollKey: 'pressure',
      essential: false,
    },
    {
      id: 'radiation',
      label: t('summary.radiation'),
      value: `${Math.round(summary.maxRadiation.value)} W/m²`,
      dayLabel: summary.maxRadiation.dayLabel,
      scrollKey: 'radiation',
      essential: false,
    },
    {
      id: 'visibility',
      label: t('summary.visibility'),
      value: `${Math.round(summary.maxVisibility.value)} km`,
      dayLabel: summary.maxVisibility.dayLabel,
      scrollKey: 'visibility',
      essential: false,
    },
    {
      id: 'gases',
      label: t('summary.gases'),
      value: `${Math.round(summary.maxGases.value)} EAQI`,
      dayLabel: summary.maxGases.dayLabel,
      scrollKey: 'gases',
      essential: false,
    },
    {
      id: 'particles',
      label: t('summary.particles'),
      value: `${Math.round(summary.maxParticles.value)} µg/m³`,
      dayLabel: summary.maxParticles.dayLabel,
      scrollKey: 'particles',
      essential: false,
    },
    {
      id: 'allergens',
      label: t('summary.allergens'),
      value: `${Math.round(summary.maxAllergens.value)} grains/m³`,
      dayLabel: summary.maxAllergens.dayLabel,
      scrollKey: 'allergens',
      essential: false,
    },
  ];

  if (options.essentialOnly) {
    return rows.filter((row) => ESSENTIAL_WEEKLY_MAX_IDS.has(row.id));
  }

  return rows;
}

export function metricScrollTargetToChartKey(
  target: MetricScrollTarget,
): MetricScrollTarget {
  return target;
}
