import * as Location from 'expo-location';
import { getSavedCities } from '../storage/savedCities';
import {
  getChartFromSnapshot,
  getWidgetSnapshot,
  saveWidgetSnapshot,
  WidgetCityId,
  WidgetCitySnapshot,
} from '../storage/widgetData';
import { WidgetChartType } from '../utils/widgetChartData';
import { fetchWeather, fetchWeatherForSavedCity, WeatherData } from '../services/weather';
import { buildWidgetChartsFromWeather } from '../utils/widgetChartData';
import { isWidgetDataStale } from '../utils/widgetStaleness';
import { SavedCity } from '../types/city';
import { getMyLocationTitle, sanitizeCityLabel } from '../utils/formatCity';

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

const MIN_RENDERABLE_POINTS = 2;

export function isSnapshotChartRenderable(
  snapshot: WidgetCitySnapshot | null | undefined,
  chartType: WidgetChartType,
): boolean {
  const chart = getChartFromSnapshot(snapshot ?? null, chartType);
  return Boolean(chart && chart.points.length >= MIN_RENDERABLE_POINTS);
}

export async function loadWidgetSnapshotForCity(
  cityId: WidgetCityId,
  options?: { forceRefresh?: boolean; chartType?: WidgetChartType },
): Promise<WidgetCitySnapshot | null> {
  const forceRefresh = options?.forceRefresh ?? false;
  const chartType = options?.chartType ?? 'temperature';
  const cached = await getWidgetSnapshot(cityId);
  const hasCachedData = isSnapshotChartRenderable(cached, chartType);

  if (!forceRefresh && hasCachedData && cached && !isWidgetDataStale(cached.updatedAt)) {
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
  const cityLabel = sanitizeCityLabel(
    cityId === 'current' ? (subtitle ?? weather.city) : title,
  );
  return weatherToWidgetSnapshot(cityId, cityLabel, weather);
}

export function getWidgetCityOptions(cities: SavedCity[]) {
  return [
    { id: 'current' as const, label: getMyLocationTitle() },
    ...cities.map((city) => ({ id: city.id, label: sanitizeCityLabel(city.label) })),
  ];
}
