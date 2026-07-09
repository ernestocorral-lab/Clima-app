import { toAlpha3 } from './countryCodes';

export function formatLocalTimeFromIso(isoTime: string): string {
  const match = isoTime.match(/T(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  const date = new Date(isoTime.includes('T') ? isoTime : `${isoTime}T12:00:00`);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function formatObservedAt(isoTime: string, countryCodeAlpha2?: string): string {
  const time = formatLocalTimeFromIso(isoTime);
  const countryCode = toAlpha3(countryCodeAlpha2);

  if (countryCode) {
    return `${time} ${countryCode}`;
  }

  return time;
}

export function formatCurrentTemperature(
  temperature: number,
  apparentTemperature?: number,
): string {
  const feelsLike = apparentTemperature ?? temperature;
  return `${Math.round(temperature)}° (${Math.round(feelsLike)}°)`;
}

export function formatChartPointTime(time: string, intervalHours: number): string {
  if (intervalHours >= 24 || !time.includes('T')) {
    const date = new Date(`${time.slice(0, 10)}T12:00:00`);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  const [, datePart, hour, minute] =
    time.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/) ?? [];
  if (!datePart) {
    return time;
  }

  const date = new Date(`${datePart}T12:00:00`);
  const dayLabel = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  return `${dayLabel} · ${hour}:${minute}`;
}
