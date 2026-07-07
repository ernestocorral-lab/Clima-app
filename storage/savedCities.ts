import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CITIES, SavedCity } from '../types/city';

const STORAGE_KEY = '@weather-app/saved-cities';

function isValidCity(value: unknown): value is SavedCity {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const city = value as SavedCity;
  return (
    typeof city.id === 'string' &&
    typeof city.label === 'string' &&
    typeof city.query === 'string' &&
    typeof city.latitude === 'number' &&
    typeof city.longitude === 'number'
  );
}

export async function getSavedCities(): Promise<SavedCity[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CITIES;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 3 || !parsed.every(isValidCity)) {
      return DEFAULT_CITIES;
    }

    return parsed;
  } catch {
    return DEFAULT_CITIES;
  }
}

export async function saveSavedCities(cities: SavedCity[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
}
