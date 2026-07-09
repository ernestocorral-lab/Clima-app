import { Platform } from 'react-native';
import { requestWidgetUpdate, requestWidgetUpdateById } from 'react-native-android-widget';
import {
  getWidgetConfig,
  getWidgetSnapshot,
  saveWidgetConfig,
  saveWidgetSnapshot,
  WidgetCityId,
  WidgetInstanceConfig,
} from '../storage/widgetData';
import { LocationResult } from '../types/location';
import { WidgetChartType } from '../utils/widgetChartData';
import { metricLabel } from '../i18n';
import { DEFAULT_WIDGET_CHART_TYPE, DEFAULT_WIDGET_CITY_ID, TEMPERATURE_WIDGET_NAME } from './constants';
import { loadWidgetSnapshotForCity, locationResultToSnapshot } from './loadWidgetSnapshot';
import { renderWeatherWidget } from './renderWeatherWidget';

async function renderWidgetForInfo(widgetInfo: {
  widgetId: number;
  width: number;
  height: number;
}) {
  const config = (await getWidgetConfig(widgetInfo.widgetId)) ?? {
    cityId: DEFAULT_WIDGET_CITY_ID,
    chartType: DEFAULT_WIDGET_CHART_TYPE,
  };
  const snapshot = await getWidgetSnapshot(config.cityId);
  return renderWeatherWidget(snapshot, config.chartType, widgetInfo);
}

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
    renderWidget: renderWidgetForInfo,
  });
}

export async function refreshWidgetById(widgetId: number): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await requestWidgetUpdateById({
    widgetName: TEMPERATURE_WIDGET_NAME,
    widgetId,
    renderWidget: renderWidgetForInfo,
  });
}

export async function updateWidgetConfig(
  widgetId: number,
  config: WidgetInstanceConfig,
): Promise<void> {
  await saveWidgetConfig(widgetId, config);
  await loadWidgetSnapshotForCity(config.cityId, { forceRefresh: true });
  await refreshWidgetById(widgetId);
}

export function getChartLabel(chartType: WidgetChartType): string {
  return metricLabel(chartType);
}
