import { WeatherData } from '../services/weather';
import { findClosestHourlyIndex } from './widgetHourly';

function windGustFallback(weather: WeatherData): number {
  if (weather.current.windGust !== undefined) {
    return weather.current.windGust;
  }

  return weather.daily[0]?.maxWindGust ?? weather.current.windSpeed;
}

/** Current or hourly wind gust (km/h) for summary tiles and widgets. */
export function getCurrentWindGust(weather: WeatherData, hourIndex?: number): number {
  const hourly = weather.hourly;
  if (hourly?.windGust?.length && hourly.time.length) {
    const index = hourIndex ?? findClosestHourlyIndex(hourly.time);
    const value = hourly.windGust[index];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
  }

  return windGustFallback(weather);
}
