import * as Location from 'expo-location';
import { getSavedCities } from '../storage/savedCities';
import {
  getWidgetSnapshot,
  saveWidgetSnapshot,
  WidgetCityId,
  WidgetCitySnapshot,
} from '../storage/widgetData';
import { fetchWeather, fetchWeatherForSavedCity, WeatherData } from '../services/weather';
import { buildWidgetChartsFromWeather } from '../utils/widgetChartData';
import { isWidgetDataStale } from '../utils/widgetStaleness';
import { SavedCity } from '../types/city';

const LOCATION_MAX_AGE_MS = 10 * 60 * 1000;

async function resolveDevicePosition(): Promise<Location.LocationObject> {
  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown && Date.now() - lastKnown.timestamp < LOCATION_MAX_AGE_MS) {
    return lastKnown;
  }

  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
}

export function weatherToWidgetSnapshot(
  cityId: WidgetCityId,
  cityLabel: string,
  weather: WeatherData,
): WidgetCitySnapshot {
  return {
    cityId,
    cityLabel,
    charts: buildWidgetChartsFromWeather(weather),
    updatedAt: new Date().toISOString(),
  };
}

async function fetchSnapshotForCity(cityId: WidgetCityId): Promise<WidgetCitySnapshot | null> {
  if (cityId === 'current') {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const position = await resolveDevicePosition();
    const weather = await fetchWeather(position.coords.latitude, position.coords.longitude);
    const snapshot = weatherToWidgetSnapshot(cityId, weather.city, weather);
    await saveWidgetSnapshot(cityId, snapshot);
    return snapshot;
  }

  const cities = await getSavedCities();
  const city = cities.find((entry) => entry.id === cityId);
  if (!city) {
    return null;
  }

  const weather = await fetchWeatherForSavedCity(city);
  const snapshot = weatherToWidgetSnapshot(cityId, city.label, weather);
  await saveWidgetSnapshot(cityId, snapshot);
  return snapshot;
}

export async function loadWidgetSnapshotForCity(
  cityId: WidgetCityId,
  options?: { forceRefresh?: boolean },
): Promise<WidgetCitySnapshot | null> {
  const forceRefresh = options?.forceRefresh ?? false;
  const cached = await getWidgetSnapshot(cityId);
  const hasCachedData = Boolean(cached?.charts?.temperature?.points?.length);

  if (!forceRefresh && hasCachedData && !isWidgetDataStale(cached?.updatedAt)) {
    return cached;
  }

  try {
    const fresh = await fetchSnapshotForCity(cityId);
    if (fresh) {
      return fresh;
    }
  } catch {
    // Fall back to cached data when network or permissions fail.
  }

  return hasCachedData ? cached : null;
}

export function locationResultToSnapshot(
  cityId: WidgetCityId,
  title: string,
  subtitle: string | undefined,
  weather: WeatherData,
): WidgetCitySnapshot {
  const cityLabel = title === 'Mi ubicación' ? (subtitle ?? weather.city) : title;
  return weatherToWidgetSnapshot(cityId, cityLabel, weather);
}

export function getWidgetCityOptions(cities: SavedCity[]) {
  return [
    { id: 'current' as const, label: 'Mi ubicación' },
    ...cities.map((city) => ({ id: city.id, label: city.label })),
  ];
}
