import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import {
  getWidgetCityConfig,
  getWidgetSnapshot,
  saveWidgetSnapshot,
  WidgetCityId,
} from '../storage/widgetData';
import { LocationResult } from '../types/location';
import { DEFAULT_WIDGET_CITY_ID, TEMPERATURE_WIDGET_NAME } from './constants';
import { locationResultToSnapshot } from './loadWidgetSnapshot';
import { renderTemperatureWidget } from './renderTemperatureWidget';

export async function saveSnapshotsFromLocations(locations: LocationResult[]): Promise<void> {
  await Promise.all(
    locations
      .filter(
        (
          location,
        ): location is LocationResult & { weather: NonNullable<LocationResult['weather']> } =>
          Boolean(location.weather),
      )
      .map(async (location) => {
        const snapshot = locationResultToSnapshot(
          location.id,
          location.title,
          location.subtitle,
          location.weather,
        );
        await saveWidgetSnapshot(location.id as WidgetCityId, snapshot);
      }),
  );
}

export async function refreshTemperatureWidgets(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await requestWidgetUpdate({
    widgetName: TEMPERATURE_WIDGET_NAME,
    renderWidget: async (widgetInfo) => {
      const cityId =
        (await getWidgetCityConfig(widgetInfo.widgetId)) ?? DEFAULT_WIDGET_CITY_ID;
      const snapshot = await getWidgetSnapshot(cityId);
      return renderTemperatureWidget(snapshot, widgetInfo);
    },
  });
}
