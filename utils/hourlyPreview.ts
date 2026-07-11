import { WeatherData } from '../services/weather';
import { getWeatherDescription } from './weatherCodes';
import { findClosestHourlyIndex } from './widgetHourly';
import { getLocaleTag, t } from '../i18n';

export type HourlyPreview = {
  hourOffset: number;
  hourIndex: number;
  observedAt: string;
  timeLabel: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  weatherCode: number;
  condition: string;
};

export const MAX_HOUR_OFFSET = 23;

export function getBaseHourIndex(weather: WeatherData): number {
  if (!weather.hourly?.time.length) {
    return 0;
  }
  return findClosestHourlyIndex(weather.hourly.time);
}

export function getMaxHourOffset(weather: WeatherData): number {
  const hourly = weather.hourly;
  if (!hourly?.time.length) {
    return 0;
  }

  const baseIndex = getBaseHourIndex(weather);
  return Math.min(MAX_HOUR_OFFSET, hourly.time.length - baseIndex - 1);
}

function formatHourLabel(time: string, countryCode?: string): string {
  const date = new Date(time.includes('T') ? time : `${time}T12:00:00`);
  const timeText = date.toLocaleTimeString(getLocaleTag(), {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (countryCode) {
    return `${timeText}`;
  }

  return timeText;
}

function valueAt(hourly: WeatherData['hourly'], values: number[] | undefined, index: number, fallback: number): number {
  const value = values?.[index];
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

export function getHourlyPreview(weather: WeatherData, hourOffset: number): HourlyPreview {
  const current = weather.current;
  const hourly = weather.hourly;

  if (!hourly?.time.length || hourOffset <= 0) {
    const uv = hourly?.uvIndex?.[getBaseHourIndex(weather)] ?? 0;
    return {
      hourOffset: 0,
      hourIndex: getBaseHourIndex(weather),
      observedAt: current.observedAt,
      timeLabel: t('detail.scrubberNow'),
      temperature: current.temperature,
      apparentTemperature: current.apparentTemperature ?? current.temperature,
      humidity: current.humidity,
      windSpeed: current.windSpeed,
      uvIndex: typeof uv === 'number' ? uv : 0,
      weatherCode: current.weatherCode,
      condition: getWeatherDescription(current.weatherCode),
    };
  }

  const baseIndex = getBaseHourIndex(weather);
  const hourIndex = Math.min(baseIndex + hourOffset, hourly.time.length - 1);
  const observedAt = hourly.time[hourIndex];
  const temperature = valueAt(hourly, hourly.temperatures, hourIndex, current.temperature);
  const apparentTemperature = valueAt(
    hourly,
    hourly.apparentTemperature,
    hourIndex,
    temperature,
  );
  const humidity = valueAt(hourly, hourly.humidity, hourIndex, current.humidity);
  const windSpeed = valueAt(hourly, hourly.windSpeed, hourIndex, current.windSpeed);
  const uvIndex = valueAt(hourly, hourly.uvIndex, hourIndex, 0);

  return {
    hourOffset,
    hourIndex,
    observedAt,
    timeLabel: formatHourLabel(observedAt, weather.countryCodeAlpha2),
    temperature,
    apparentTemperature,
    humidity,
    windSpeed,
    uvIndex,
    weatherCode: current.weatherCode,
    condition: getWeatherDescription(current.weatherCode),
  };
}

export function getHourlyValueAtIndex(
  values: number[] | undefined,
  index: number,
): number | undefined {
  if (!values?.length || index < 0 || index >= values.length) {
    return undefined;
  }

  const value = values[index];
  return typeof value === 'number' && !Number.isNaN(value) ? value : undefined;
}
