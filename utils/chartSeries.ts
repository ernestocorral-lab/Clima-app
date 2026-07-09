import { DailyForecast, HourlyForecast } from '../services/weather';

export type ChartPoint = {
  time: string;
  value: number;
};

export type ChartSeries = {
  intervalHours: 1 | 3 | 6 | 12 | 24;
  intervalLabel: string;
  points: ChartPoint[];
};

export type DailyEnvelope = {
  date: string;
  max: number;
  min: number;
  maxTime?: string;
  minTime?: string;
};

function normalizeHourlyValue(value: number | null | undefined): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
}

function alignValuesToHourlyTime(
  time: string[],
  values: number[] | undefined,
): number[] | undefined {
  if (!values) {
    return undefined;
  }

  return time.map((_, index) => normalizeHourlyValue(values[index]));
}

function sampleEveryHours(
  time: string[],
  values: number[],
  stepHours: number,
): ChartPoint[] {
  const points: ChartPoint[] = [];

  for (let index = 0; index < time.length; index += stepHours) {
    points.push({
      time: time[index],
      value: normalizeHourlyValue(values[index]),
    });
  }

  return points;
}

function dailyFallbackPoints(
  daily: DailyForecast[],
  metric: 'temp' | 'humidity' | 'wind' | 'pressure' | 'uv',
): ChartPoint[] {
  return daily.map((day) => {
    if (metric === 'humidity') {
      return { time: day.date, value: (day.maxHumidity + day.minHumidity) / 2 };
    }
    if (metric === 'wind') {
      return { time: day.date, value: (day.maxWindSpeed + day.minWindSpeed) / 2 };
    }
    if (metric === 'pressure') {
      return {
        time: day.date,
        value:
          day.maxPressure !== undefined && day.minPressure !== undefined
            ? (day.maxPressure + day.minPressure) / 2
            : 1013,
      };
    }
    if (metric === 'uv') {
      return { time: day.date, value: day.maxUvIndex ?? 0 };
    }
    return { time: day.date, value: (day.maxTemp + day.minTemp) / 2 };
  });
}

function buildFromHourlyValues(
  hourly: HourlyForecast | undefined,
  values: number[] | undefined,
  dailyFallbackPoints: ChartPoint[],
): ChartSeries {
  const intervals: Array<{ hours: 1 | 3 | 6 | 12; label: string }> = [
    { hours: 1, label: 'Horaria' },
    { hours: 3, label: 'cada 3 h' },
    { hours: 6, label: 'cada 6 h' },
    { hours: 12, label: 'cada 12 h' },
  ];

  if (hourly && values && hourly.time.length >= 2 && values.length >= 2) {
    const alignedValues = alignValuesToHourlyTime(hourly.time, values);
    if (alignedValues) {
      for (const interval of intervals) {
        const points = sampleEveryHours(hourly.time, alignedValues, interval.hours);
        if (points.length >= 2) {
          return {
            intervalHours: interval.hours,
            intervalLabel: interval.label,
            points,
          };
        }
      }
    }
  }

  return {
    intervalHours: 24,
    intervalLabel: 'Diaria',
    points: dailyFallbackPoints,
  };
}

function buildFromHourly(
  hourly: HourlyForecast | undefined,
  values: number[] | undefined,
  daily: DailyForecast[],
  metric: 'temp' | 'humidity' | 'wind' | 'pressure' | 'uv',
): ChartSeries {
  const fallback = hourly?.time?.length
    ? metricHourlyFallback(hourly, daily)
    : dailyFallbackPoints(daily, metric);
  return buildFromHourlyValues(hourly, values, fallback);
}

function envelopeFromHourlyValues(hourly: HourlyForecast, values: number[]): DailyEnvelope[] {
  const alignedValues = alignValuesToHourlyTime(hourly.time, values) ?? [];
  const byDay = new Map<string, { time: string; value: number }[]>();

  hourly.time.forEach((time, index) => {
    const date = time.split('T')[0];
    const value = normalizeHourlyValue(alignedValues[index]);
    const entries = byDay.get(date) ?? [];
    entries.push({ time, value });
    byDay.set(date, entries);
  });

  return Array.from(byDay.entries()).map(([date, entries]) => {
    let maxEntry = entries[0];
    let minEntry = entries[0];

    for (const entry of entries) {
      if (entry.value > maxEntry.value) {
        maxEntry = entry;
      }
      if (entry.value < minEntry.value) {
        minEntry = entry;
      }
    }

    return {
      date,
      max: maxEntry.value,
      min: minEntry.value,
      maxTime: maxEntry.time,
      minTime: minEntry.time,
    };
  });
}

function apiApparentDailyFallback(daily: DailyForecast[]): ChartPoint[] {
  return daily.map((day) => ({
    time: day.date,
    value:
      day.maxApparentTemp !== undefined && day.minApparentTemp !== undefined
        ? (day.maxApparentTemp + day.minApparentTemp) / 2
        : (day.maxTemp + day.minTemp) / 2,
  }));
}

export function buildTemperatureChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  return buildFromHourly(hourly, hourly?.temperatures, daily, 'temp');
}

export function buildHumidityChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  return buildFromHourly(hourly, hourly?.humidity, daily, 'humidity');
}

function windGustDailyFallback(daily: DailyForecast[]): ChartPoint[] {
  return daily.map((day) => ({
    time: day.date,
    value: day.maxWindGust,
  }));
}

export function buildWindChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  return buildFromHourly(hourly, hourly?.windSpeed, daily, 'wind');
}

export function buildWindGustChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  const fallback = hourly?.time?.length
    ? metricHourlyFallback(hourly, daily)
    : windGustDailyFallback(daily);
  return buildFromHourlyValues(hourly, hourly?.windGust, fallback);
}

export function buildPressureChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  return buildFromHourly(hourly, hourly?.pressure, daily, 'pressure');
}

export function buildUvIndexChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  return buildFromHourly(hourly, hourly?.uvIndex, daily, 'uv');
}

export function buildApparentTemperatureChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  const fallback = hourly?.time?.length
    ? metricHourlyFallback(hourly, daily)
    : apiApparentDailyFallback(daily);
  return buildFromHourlyValues(hourly, hourly?.apparentTemperature, fallback);
}

export function getApparentTemperatureEnvelope(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): DailyEnvelope[] {
  if (hourly?.apparentTemperature?.length) {
    return envelopeFromHourlyValues(hourly, hourly.apparentTemperature);
  }

  return daily.map((day) => ({
    date: day.date,
    max: day.maxApparentTemp ?? day.maxTemp,
    min: day.minApparentTemp ?? day.minTemp,
  }));
}

export function getTemperatureEnvelope(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): DailyEnvelope[] {
  if (hourly?.temperatures?.length) {
    return envelopeFromHourlyValues(hourly, hourly.temperatures);
  }

  return daily.map((day) => ({
    date: day.date,
    max: day.maxTemp,
    min: day.minTemp,
  }));
}

export function getHumidityEnvelope(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): DailyEnvelope[] {
  if (hourly?.humidity?.length) {
    return envelopeFromHourlyValues(hourly, hourly.humidity);
  }

  return daily.map((day) => ({
    date: day.date,
    max: day.maxHumidity,
    min: day.minHumidity,
  }));
}

export function getWindEnvelope(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): DailyEnvelope[] {
  if (hourly?.windSpeed?.length) {
    return envelopeFromHourlyValues(hourly, hourly.windSpeed);
  }

  return daily.map((day) => ({
    date: day.date,
    max: day.maxWindSpeed,
    min: day.minWindSpeed,
  }));
}

export function getWindGustEnvelope(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): DailyEnvelope[] {
  if (hourly?.windGust?.length) {
    return envelopeFromHourlyValues(hourly, hourly.windGust);
  }

  return daily.map((day) => ({
    date: day.date,
    max: day.maxWindGust,
    min: day.minWindSpeed,
  }));
}

export function getPressureEnvelope(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): DailyEnvelope[] {
  if (hourly?.pressure?.length) {
    return envelopeFromHourlyValues(hourly, hourly.pressure);
  }

  return daily.map((day) => ({
    date: day.date,
    max: day.maxPressure ?? 1020,
    min: day.minPressure ?? 1000,
  }));
}

export function getUvIndexEnvelope(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): DailyEnvelope[] {
  if (hourly?.uvIndex?.length) {
    return envelopeFromHourlyValues(hourly, hourly.uvIndex);
  }

  return daily.map((day) => ({
    date: day.date,
    max: day.maxUvIndex ?? 0,
    min: 0,
  }));
}

function dailyDatesFallback(daily: DailyForecast[]): ChartPoint[] {
  return daily.map((day) => ({ time: day.date, value: 0 }));
}

function metricHourlyFallback(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartPoint[] {
  if (hourly?.time?.length) {
    return hourly.time.map((time) => ({ time, value: 0 }));
  }

  return dailyDatesFallback(daily);
}

export function buildEuropeanAqiChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  return buildFromHourlyValues(hourly, hourly?.europeanAqi, metricHourlyFallback(hourly, daily));
}

export function buildPm25ChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  return buildFromHourlyValues(hourly, hourly?.pm25, metricHourlyFallback(hourly, daily));
}

export function buildMetricChartSeries(
  hourly: HourlyForecast | undefined,
  values: number[] | undefined,
  daily: DailyForecast[],
): ChartSeries {
  return buildFromHourlyValues(hourly, values, metricHourlyFallback(hourly, daily));
}

export function getMetricEnvelope(
  hourly: HourlyForecast | undefined,
  values: number[] | undefined,
  daily: DailyForecast[],
): DailyEnvelope[] {
  if (hourly && values?.length) {
    const alignedValues = alignValuesToHourlyTime(hourly.time, values);
    if (alignedValues) {
      return envelopeFromHourlyValues(hourly, alignedValues);
    }
  }

  return daily.map((day) => ({
    date: day.date,
    max: 0,
    min: 0,
  }));
}

function centerZeroMaxAtNoon(envelope: DailyEnvelope[]): DailyEnvelope[] {
  return envelope.map((day) =>
    day.max === 0 ? { ...day, maxTime: `${day.date}T12:00` } : day,
  );
}

export function getPrecipitationEnvelope(
  hourly: HourlyForecast | undefined,
  values: number[] | undefined,
  daily: DailyForecast[],
): DailyEnvelope[] {
  return centerZeroMaxAtNoon(getMetricEnvelope(hourly, values, daily));
}

export function scaleHourlyValues(
  values: number[] | undefined,
  factor: number,
): number[] | undefined {
  if (!values) {
    return undefined;
  }

  return values.map((value) => normalizeHourlyValue(value) / factor);
}

/** @deprecated Use buildTemperatureChartSeries */
export function buildChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  return buildTemperatureChartSeries(hourly, daily);
}
