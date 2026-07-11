import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherData } from '../services/weather';

const CACHE_PREFIX = '@weather-app/cache/';

export type CachedWeatherEntry = {
  id: string;
  title: string;
  subtitle?: string;
  weather: WeatherData;
  fetchedAt: string;
};

function cacheKey(id: string): string {
  return `${CACHE_PREFIX}${id}`;
}

export async function getCachedWeather(id: string): Promise<CachedWeatherEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(id));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedWeatherEntry;
    if (
      !parsed ||
      typeof parsed.id !== 'string' ||
      typeof parsed.title !== 'string' ||
      !parsed.weather ||
      typeof parsed.fetchedAt !== 'string'
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function saveCachedWeather(entry: CachedWeatherEntry): Promise<void> {
  await AsyncStorage.setItem(cacheKey(entry.id), JSON.stringify(entry));
}

export async function loadCachedWeatherForIds(ids: string[]): Promise<CachedWeatherEntry[]> {
  const entries = await Promise.all(ids.map((id) => getCachedWeather(id)));
  return entries.filter((entry): entry is CachedWeatherEntry => entry !== null);
}
