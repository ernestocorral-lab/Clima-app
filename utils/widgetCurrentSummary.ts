import { WeatherData } from '../services/weather';
import { WidgetCurrentSummary } from '../storage/widgetData';
import { getHourlyValueAtNow } from './widgetHourly';

export function buildWidgetCurrentSummary(weather: WeatherData): WidgetCurrentSummary {
  return {
    weatherCode: weather.current.weatherCode,
    observedAt: weather.current.observedAt,
    countryCodeAlpha2: weather.countryCodeAlpha2,
    timezone: weather.timezone,
    cityName: weather.city,
    temperature: weather.current.temperature,
    apparentTemperature:
      weather.current.apparentTemperature ?? weather.current.temperature,
    humidity: weather.current.humidity,
    windSpeed: weather.current.windSpeed,
    uvIndex: getHourlyValueAtNow(weather.hourly, weather.hourly?.uvIndex) ?? 0,
  };
}

export function isWidgetCurrentSummaryComplete(
  summary: WidgetCurrentSummary | null | undefined,
): boolean {
  return Boolean(
    summary &&
      Number.isFinite(summary.temperature) &&
      Number.isFinite(summary.weatherCode),
  );
}
