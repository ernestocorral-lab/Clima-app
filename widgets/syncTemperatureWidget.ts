import { Platform } from 'react-native';
import { getWidgetInfo, requestWidgetUpdate, requestWidgetUpdateById } from 'react-native-android-widget';
import {
  ensureWidgetListedConfig,
  getWidgetConfig,
  getWidgetSnapshot,
  saveWidgetConfig,
  saveWidgetSnapshot,
  WidgetCityId,
  WidgetInstanceConfig,
} from '../storage/widgetData';
import { LocationResult } from '../types/location';
import { WidgetChartType } from '../utils/widgetChartData';
import { syncWidgetRegistryFromPlatform } from '../utils/widgetList';
import { metricLabel } from '../i18n';
import { DEFAULT_WIDGET_CHART_TYPE } from './constants';
import { loadWidgetSnapshotForCity, locationResultToSnapshot } from './loadWidgetSnapshot';
import { ALL_WIDGET_NAMES, resolveWidgetChartType } from './metricWidgetRegistry';
import { renderWidgetInstance } from './renderWidgetInstance';

async function renderWidgetForInfo(widgetInfo: {
  widgetId: number;
  width: number;
  height: number;
  widgetName: string;
}) {
  const stored = await getWidgetConfig(widgetInfo.widgetId);
  const config = await ensureWidgetListedConfig(
    widgetInfo.widgetId,
    widgetInfo.widgetName,
    stored,
  );
  const chartType = resolveWidgetChartType(widgetInfo.widgetName, config.chartType);
  const snapshot = await getWidgetSnapshot(config.cityId);
  return renderWidgetInstance(snapshot, chartType, widgetInfo);
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

  const widgetInfos = (
    await Promise.all(ALL_WIDGET_NAMES.map((widgetName) => getWidgetInfo(widgetName)))
  ).flat();

  await syncWidgetRegistryFromPlatform(widgetInfos);

  await Promise.all(
    ALL_WIDGET_NAMES.map((widgetName) =>
      requestWidgetUpdate({
        widgetName,
        renderWidget: renderWidgetForInfo,
      }),
    ),
  );
}

export async function refreshWidgetById(widgetName: string, widgetId: number): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await requestWidgetUpdateById({
    widgetName,
    widgetId,
    renderWidget: renderWidgetForInfo,
  });
}

export async function updateWidgetConfig(
  widgetName: string,
  widgetId: number,
  config: WidgetInstanceConfig,
): Promise<void> {
  const chartType = resolveWidgetChartType(widgetName, config.chartType);
  await saveWidgetConfig(widgetId, {
    ...config,
    chartType,
    configured: true,
    widgetName,
  });
  await loadWidgetSnapshotForCity(config.cityId, { forceRefresh: true });
  await refreshWidgetById(widgetName, widgetId);
}

export function getChartLabel(chartType: WidgetChartType): string {
  return metricLabel(chartType);
}
