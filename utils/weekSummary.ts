import { DailyForecast, HourlyForecast } from '../services/weather';

export type WeekExtreme = {
  temperature: number;
  date: string;
  dayLabel: string;
};

export type WindGustExtreme = {
  speed: number;
  date: string;
  dayLabel: string;
};

export type NumericExtreme = {
  value: number;
  date: string;
  dayLabel: string;
};

export type WeekSummary = {
  max: WeekExtreme;
  min: WeekExtreme;
  maxWindGust: WindGustExtreme;
  maxApparentTemp: NumericExtreme;
  maxUvIndex: NumericExtreme;
  maxPrecipitation: NumericExtreme;
};

function formatShortDay(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
}

function toNumericExtreme(day: DailyForecast, value: number): NumericExtreme {
  return {
    value,
    date: day.date,
    dayLabel: formatShortDay(day.date),
  };
}

function getMaxWindGustExtreme(
  daily: DailyForecast[],
  hourly?: HourlyForecast,
): WindGustExtreme {
  if (hourly?.windGust?.length && hourly.time.length === hourly.windGust.length) {
    let maxValue = hourly.windGust[0];
    let maxTime = hourly.time[0];

    hourly.windGust.forEach((value, index) => {
      if (value > maxValue) {
        maxValue = value;
        maxTime = hourly.time[index];
      }
    });

    const date = maxTime.split('T')[0];
    return {
      speed: maxValue,
      date,
      dayLabel: formatShortDay(date),
    };
  }

  const [first, ...rest] = daily;
  let gustDay = first;

  for (const day of rest) {
    if (day.maxWindGust > gustDay.maxWindGust) {
      gustDay = day;
    }
  }

  return {
    speed: gustDay.maxWindGust,
    date: gustDay.date,
    dayLabel: formatShortDay(gustDay.date),
  };
}

export function getWeekSummary(daily: DailyForecast[], hourly?: HourlyForecast): WeekSummary {
  const [first, ...rest] = daily;
  let maxDay = first;
  let minDay = first;
  let apparentDay = first;
  let uvDay = first;
  let precipDay = first;

  for (const day of rest) {
    if (day.maxTemp > maxDay.maxTemp) {
      maxDay = day;
    }
    if (day.minTemp < minDay.minTemp) {
      minDay = day;
    }
    if ((day.maxApparentTemp ?? day.maxTemp) > (apparentDay.maxApparentTemp ?? apparentDay.maxTemp)) {
      apparentDay = day;
    }
    if ((day.maxUvIndex ?? 0) > (uvDay.maxUvIndex ?? 0)) {
      uvDay = day;
    }
    if ((day.precipitationSum ?? 0) > (precipDay.precipitationSum ?? 0)) {
      precipDay = day;
    }
  }

  return {
    max: {
      temperature: maxDay.maxTemp,
      date: maxDay.date,
      dayLabel: formatShortDay(maxDay.date),
    },
    min: {
      temperature: minDay.minTemp,
      date: minDay.date,
      dayLabel: formatShortDay(minDay.date),
    },
    maxWindGust: getMaxWindGustExtreme(daily, hourly),
    maxApparentTemp: toNumericExtreme(
      apparentDay,
      apparentDay.maxApparentTemp ?? apparentDay.maxTemp,
    ),
    maxUvIndex: toNumericExtreme(uvDay, uvDay.maxUvIndex ?? 0),
    maxPrecipitation: toNumericExtreme(precipDay, precipDay.precipitationSum ?? 0),
  };
}
