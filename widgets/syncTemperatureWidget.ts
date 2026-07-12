import { Platform } from 'react-native';
import {
  getWidgetInfo,
  requestWidgetUpdate,
  requestWidgetUpdateById,
  type WidgetInfo,
} from 'react-native-android-widget';
import {
  saveWidgetConfig,
  saveWidgetSnapshot,
  WidgetCityId,
  WidgetInstanceConfig,
} from '../storage/widgetData';
import { LocationResult } from '../types/location';
import { WidgetChartType } from '../utils/widgetChartData';
import {
  getPlacedWidgetInstances,
  loadResolvedWidgetEntries,
  syncWidgetRegistryFromPlatform,
} from '../utils/widgetList';
import { resetWidgetRegistryOnFreshInstall } from '../utils/widgetInstallReset';
import { metricLabel } from '../i18n';
import { loadWidgetSnapshotForCity, locationResultToSnapshot } from './loadWidgetSnapshot';
import { ALL_WIDGET_NAMES, resolveWidgetChartType } from './metricWidgetRegistry';
import { renderPlacedWidget } from './renderPlacedWidget';

async function fetchHomeScreenWidgetInfos(): Promise<WidgetInfo[]> {
  const groups = await Promise.all(
    ALL_WIDGET_NAMES.map((widgetName) => getWidgetInfo(widgetName)),
  );
  return getPlacedWidgetInstances(groups.flat());
}

async function renderWidgetForInfo(widgetInfo: {
  widgetId: number;
  width: number;
  height: number;
  widgetName: string;
}) {
  return renderPlacedWidget(widgetInfo);
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

/** Clear backup-restored widget configs after reinstall, then list active widgets. */
export async function loadWidgetSettingsEntries() {
  await resetWidgetRegistryOnFreshInstall();
  return loadResolvedWidgetEntries(await fetchHomeScreenWidgetInfos());
}

export async function syncWidgetRegistry(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await resetWidgetRegistryOnFreshInstall();
  await syncWidgetRegistryFromPlatform(await fetchHomeScreenWidgetInfos());
}

export async function refreshTemperatureWidgets(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await resetWidgetRegistryOnFreshInstall();
  const widgetInfos = await fetchHomeScreenWidgetInfos();
  await syncWidgetRegistryFromPlatform(widgetInfos);

  if (widgetInfos.length === 0) {
    return;
  }

  await Promise.all(
    ALL_WIDGET_NAMES.map((widgetName) =>
      requestWidgetUpdate({
        widgetName,
        renderWidget: renderWidgetForInfo,
        widgetNotFound: () => {},
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
  await loadWidgetSnapshotForCity(config.cityId, { forceRefresh: true, chartType });
  await refreshWidgetById(widgetName, widgetId);
}

export function getChartLabel(chartType: WidgetChartType): string {
  return metricLabel(chartType);
}
