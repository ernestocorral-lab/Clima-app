import { t } from '../i18n';

const WEATHER_EMOJIS: Record<number, string> = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '🌨️',
  73: '🌨️',
  75: '❄️',
  80: '🌦️',
  81: '🌧️',
  82: '⛈️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

export function getWeatherDescription(code: number): string {
  const key = `weather.codes.${code}`;
  const label = t(key);
  return label === key ? t('weather.unknown') : label;
}

export function getWeatherEmoji(code: number): string {
  return WEATHER_EMOJIS[code] ?? '🌡️';
}
