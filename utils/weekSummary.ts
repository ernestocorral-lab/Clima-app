import { DailyForecast, HourlyForecast } from '../services/weather';
import { getLocaleTag } from '../i18n';

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
  minApparentTemp: NumericExtreme;
  maxUvIndex: NumericExtreme;
  maxPrecipitation: NumericExtreme;
  maxHumidity: NumericExtreme;
  maxWindSpeed: NumericExtreme;
  maxPressure: NumericExtreme;
  maxRadiation: NumericExtreme;
  maxVisibility: NumericExtreme;
  maxGases: NumericExtreme;
  maxParticles: NumericExtreme;
  maxAllergens: NumericExtreme;
};

function formatShortDay(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString(getLocaleTag(), { weekday: 'short', day: 'numeric' });
}

function toNumericExtreme(day: DailyForecast, value: number): NumericExtreme {
  return {
    value,
    date: day.date,
    dayLabel: formatShortDay(day.date),
  };
}

function getDailyMaxExtreme(
  daily: DailyForecast[],
  pick: (day: DailyForecast) => number,
): NumericExtreme {
  const [first, ...rest] = daily;
  let maxDay = first;
  let maxValue = pick(first);

  for (const day of rest) {
    const value = pick(day);
    if (value > maxValue) {
      maxValue = value;
      maxDay = day;
    }
  }

  return toNumericExtreme(maxDay, maxValue);
}

function getHourlyMaxExtreme(
  daily: DailyForecast[],
  hourly: HourlyForecast | undefined,
  values: number[] | undefined,
): NumericExtreme {
  if (hourly?.time.length && values?.length) {
    let maxValue = Number.NEGATIVE_INFINITY;
    let maxTime = hourly.time[0];

    hourly.time.forEach((time, index) => {
      const value = values[index];
      if (typeof value === 'number' && !Number.isNaN(value) && value > maxValue) {
        maxValue = value;
        maxTime = time;
      }
    });

    if (Number.isFinite(maxValue)) {
      const date = maxTime.split('T')[0];
      return {
        value: maxValue,
        date,
        dayLabel: formatShortDay(date),
      };
    }
  }

  return toNumericExtreme(daily[0], 0);
}

function getMaxWindGustExtreme(
  daily: DailyForecast[],
  hourly?: HourlyForecast,
): WindGustExtreme {
  if (hourly?.windGust?.length && hourly.time.length === hourly.windGust.length) {
    let maxValue = hourly.windGust[0];
    let maxTime = hourly.time[0];

    hourly.windGust.forEach((value, index) => {
      const gust = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
      if (gust > maxValue) {
        maxValue = gust;
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

function scaleVisibilityKm(values: number[] | undefined): number[] | undefined {
  return values?.map((value) =>
    typeof value === 'number' && !Number.isNaN(value) ? value / 1000 : 0,
  );
}

export function getWeekSummary(daily: DailyForecast[], hourly?: HourlyForecast): WeekSummary {
  const [first, ...rest] = daily;
  let maxDay = first;
  let minDay = first;
  let apparentDay = first;
  let minApparentDay = first;
  let uvDay = first;
  let precipDay = first;

  for (const day of rest) {
    if (day.maxTemp > maxDay.maxTemp) {
      maxDay = day;
    }
    if (day.minTemp < minDay.minTemp) {
      minDay = day;
    }
    const dayMinApparent = day.minApparentTemp ?? day.minTemp;
    const currentMinApparent =
      minApparentDay.minApparentTemp ?? minApparentDay.minTemp;
    if (dayMinApparent < currentMinApparent) {
      minApparentDay = day;
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

  const visibilityKm = scaleVisibilityKm(hourly?.visibility);

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
    minApparentTemp: toNumericExtreme(
      minApparentDay,
      minApparentDay.minApparentTemp ?? minApparentDay.minTemp,
    ),
    maxUvIndex: toNumericExtreme(uvDay, uvDay.maxUvIndex ?? 0),
    maxPrecipitation: toNumericExtreme(precipDay, precipDay.precipitationSum ?? 0),
    maxHumidity: getDailyMaxExtreme(daily, (day) => day.maxHumidity),
    maxWindSpeed: getDailyMaxExtreme(daily, (day) => day.maxWindSpeed),
    maxPressure: getDailyMaxExtreme(daily, (day) => day.maxPressure ?? 1013),
    maxRadiation: getHourlyMaxExtreme(daily, hourly, hourly?.shortwaveRadiation),
    maxVisibility: getHourlyMaxExtreme(daily, hourly, visibilityKm),
    maxGases: getHourlyMaxExtreme(daily, hourly, hourly?.europeanAqi),
    maxParticles: getHourlyMaxExtreme(daily, hourly, hourly?.pm25),
    maxAllergens: getHourlyMaxExtreme(daily, hourly, hourly?.allergens),
  };
}
