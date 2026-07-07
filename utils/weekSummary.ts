import { DailyForecast } from '../services/weather';

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

export type WeekSummary = {
  max: WeekExtreme;
  min: WeekExtreme;
  maxWindGust: WindGustExtreme;
};

function formatShortDay(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
}

export function getWeekSummary(daily: DailyForecast[]): WeekSummary {
  const [first, ...rest] = daily;
  let maxDay = first;
  let minDay = first;
  let gustDay = first;

  for (const day of rest) {
    if (day.maxTemp > maxDay.maxTemp) {
      maxDay = day;
    }
    if (day.minTemp < minDay.minTemp) {
      minDay = day;
    }
    if (day.maxWindGust > gustDay.maxWindGust) {
      gustDay = day;
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
    maxWindGust: {
      speed: gustDay.maxWindGust,
      date: gustDay.date,
      dayLabel: formatShortDay(gustDay.date),
    },
  };
}
