import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import {
  getWidgetConfig,
  getWidgetSnapshot,
  saveWidgetSnapshot,
  WidgetCityId,
} from '../storage/widgetData';
import { LocationResult } from '../types/location';
import { DEFAULT_WIDGET_CHART_TYPE, DEFAULT_WIDGET_CITY_ID, TEMPERATURE_WIDGET_NAME } from './constants';
import { locationResultToSnapshot } from './loadWidgetSnapshot';
import { renderWeatherWidget } from './renderWeatherWidget';

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
      const config = (await getWidgetConfig(widgetInfo.widgetId)) ?? {
        cityId: DEFAULT_WIDGET_CITY_ID,
        chartType: DEFAULT_WIDGET_CHART_TYPE,
      };
      const snapshot = await getWidgetSnapshot(config.cityId);
      return renderWeatherWidget(snapshot, config.chartType, widgetInfo);
    },
  });
}
