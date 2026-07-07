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
};

function sampleEveryHours(
  time: string[],
  values: number[],
  stepHours: number,
): ChartPoint[] {
  const points: ChartPoint[] = [];

  for (let index = 0; index < time.length; index += stepHours) {
    const value = values[index];
    if (typeof value === 'number') {
      points.push({
        time: time[index],
        value,
      });
    }
  }

  return points;
}

function dailyFallbackPoints(daily: DailyForecast[], metric: 'temp' | 'humidity' | 'wind'): ChartPoint[] {
  return daily.map((day) => {
    if (metric === 'humidity') {
      return { time: day.date, value: (day.maxHumidity + day.minHumidity) / 2 };
    }
    if (metric === 'wind') {
      return { time: day.date, value: (day.maxWindSpeed + day.minWindSpeed) / 2 };
    }
    return { time: day.date, value: (day.maxTemp + day.minTemp) / 2 };
  });
}

function buildFromHourly(
  hourly: HourlyForecast | undefined,
  values: number[] | undefined,
  daily: DailyForecast[],
  metric: 'temp' | 'humidity' | 'wind',
): ChartSeries {
  const intervals: Array<{ hours: 1 | 3 | 6 | 12; label: string }> = [
    { hours: 1, label: 'Horaria' },
    { hours: 3, label: 'cada 3 h' },
    { hours: 6, label: 'cada 6 h' },
    { hours: 12, label: 'cada 12 h' },
  ];

  if (hourly && values && hourly.time.length >= 2 && values.length >= 2) {
    for (const interval of intervals) {
      const points = sampleEveryHours(hourly.time, values, interval.hours);
      if (points.length >= 2) {
        return {
          intervalHours: interval.hours,
          intervalLabel: interval.label,
          points,
        };
      }
    }
  }

  return {
    intervalHours: 24,
    intervalLabel: 'Diaria',
    points: dailyFallbackPoints(daily, metric),
  };
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

export function buildWindChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  return buildFromHourly(hourly, hourly?.windSpeed, daily, 'wind');
}

export function getTemperatureEnvelope(daily: DailyForecast[]): DailyEnvelope[] {
  return daily.map((day) => ({
    date: day.date,
    max: day.maxTemp,
    min: day.minTemp,
  }));
}

export function getHumidityEnvelope(daily: DailyForecast[]): DailyEnvelope[] {
  return daily.map((day) => ({
    date: day.date,
    max: day.maxHumidity,
    min: day.minHumidity,
  }));
}

export function getWindEnvelope(daily: DailyForecast[]): DailyEnvelope[] {
  return daily.map((day) => ({
    date: day.date,
    max: day.maxWindSpeed,
    min: day.minWindSpeed,
  }));
}

/** @deprecated Use buildTemperatureChartSeries */
export function buildChartSeries(
  hourly: HourlyForecast | undefined,
  daily: DailyForecast[],
): ChartSeries {
  return buildTemperatureChartSeries(hourly, daily);
}
