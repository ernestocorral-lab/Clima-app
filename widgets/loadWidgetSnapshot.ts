import * as Location from 'expo-location';
import { getSavedCities } from '../storage/savedCities';
import {
  getWidgetSnapshot,
  saveWidgetSnapshot,
  WidgetCityId,
  WidgetWeatherSnapshot,
} from '../storage/widgetData';
import { fetchWeather, fetchWeatherForSavedCity, WeatherData } from '../services/weather';
import { buildTemperatureChartSeries, getTemperatureEnvelope } from '../utils/chartSeries';
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
): WidgetWeatherSnapshot {
  return {
    cityId,
    cityLabel,
    currentTemp: weather.current.temperature,
    apparentTemp: weather.current.apparentTemperature,
    points: buildTemperatureChartSeries(weather.hourly, weather.daily).points,
    envelope: getTemperatureEnvelope(weather.hourly, weather.daily),
    updatedAt: new Date().toISOString(),
  };
}

export async function loadWidgetSnapshotForCity(
  cityId: WidgetCityId,
): Promise<WidgetWeatherSnapshot | null> {
  const cached = await getWidgetSnapshot(cityId);
  if (cached) {
    return cached;
  }

  try {
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
  } catch {
    return null;
  }
}

export function locationResultToSnapshot(
  cityId: WidgetCityId,
  title: string,
  subtitle: string | undefined,
  weather: WeatherData,
): WidgetWeatherSnapshot {
  const cityLabel = title === 'Mi ubicación' ? (subtitle ?? weather.city) : title;
  return weatherToWidgetSnapshot(cityId, cityLabel, weather);
}

export function getWidgetCityOptions(cities: SavedCity[]) {
  return [
    { id: 'current' as const, label: 'Mi ubicación' },
    ...cities.map((city) => ({ id: city.id, label: city.label })),
  ];
}
