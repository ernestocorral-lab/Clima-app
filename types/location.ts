import { WeatherData } from '../services/weather';

export type LocationResult = {
  id: string;
  title: string;
  subtitle?: string;
  weather: WeatherData | null;
  error: string | null;
};
