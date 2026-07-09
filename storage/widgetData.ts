import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChartPoint, DailyEnvelope } from '../utils/chartSeries';

export type WidgetCityId = 'current' | string;

export type WidgetWeatherSnapshot = {
  cityId: WidgetCityId;
  cityLabel: string;
  currentTemp: number;
  apparentTemp?: number;
  points: ChartPoint[];
  envelope: DailyEnvelope[];
  updatedAt: string;
};

const SNAPSHOT_PREFIX = '@weather-app/widget-snapshot/';
const CONFIG_PREFIX = '@weather-app/widget-config/';

function snapshotKey(cityId: WidgetCityId): string {
  return `${SNAPSHOT_PREFIX}${cityId}`;
}

function configKey(widgetId: number): string {
  return `${CONFIG_PREFIX}${widgetId}`;
}

export async function saveWidgetCityConfig(
  widgetId: number,
  cityId: WidgetCityId,
): Promise<void> {
  await AsyncStorage.setItem(configKey(widgetId), cityId);
}

export async function getWidgetCityConfig(widgetId: number): Promise<WidgetCityId | null> {
  const value = await AsyncStorage.getItem(configKey(widgetId));
  return value ?? null;
}

export async function saveWidgetSnapshot(
  cityId: WidgetCityId,
  snapshot: WidgetWeatherSnapshot,
): Promise<void> {
  await AsyncStorage.setItem(snapshotKey(cityId), JSON.stringify(snapshot));
}

export async function getWidgetSnapshot(
  cityId: WidgetCityId,
): Promise<WidgetWeatherSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(snapshotKey(cityId));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as WidgetWeatherSnapshot;
  } catch {
    return null;
  }
}
