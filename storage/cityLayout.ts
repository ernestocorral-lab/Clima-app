import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedCity } from '../types/city';
import {
  buildDefaultCityLayout,
  CityLayoutItem,
  CURRENT_CITY_ID,
} from '../types/cityLayout';

const STORAGE_KEY = '@weather-app/city-layout';

function isValidLayoutItem(value: unknown, allowedIds: Set<string>): value is CityLayoutItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as CityLayoutItem;
  return (
    typeof item.id === 'string' &&
    allowedIds.has(item.id) &&
    typeof item.visible === 'boolean'
  );
}

export function normalizeCityLayout(
  layout: unknown,
  cities: SavedCity[],
): CityLayoutItem[] {
  const allowedIds = new Set([CURRENT_CITY_ID, ...cities.map((city) => city.id)]);

  if (!Array.isArray(layout) || layout.length !== allowedIds.size) {
    return buildDefaultCityLayout(cities.map((city) => city.id));
  }

  if (!layout.every((item) => isValidLayoutItem(item, allowedIds))) {
    return buildDefaultCityLayout(cities.map((city) => city.id));
  }

  const ids = layout.map((item) => item.id);
  if (new Set(ids).size !== allowedIds.size) {
    return buildDefaultCityLayout(cities.map((city) => city.id));
  }

  return layout;
}

export async function getCityLayout(cities: SavedCity[]): Promise<CityLayoutItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return buildDefaultCityLayout(cities.map((city) => city.id));
    }

    return normalizeCityLayout(JSON.parse(raw) as unknown, cities);
  } catch {
    return buildDefaultCityLayout(cities.map((city) => city.id));
  }
}

export async function saveCityLayout(layout: CityLayoutItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}
