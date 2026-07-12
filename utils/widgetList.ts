import type { WidgetInfo } from 'react-native-android-widget';
import {
  clearAllWidgetConfigs,
  ensureWidgetListedConfig,
  getWidgetConfig,
  listConfiguredWidgetConfigs,
  pruneOrphanWidgetConfigs,
  pruneUnconfiguredWidgetConfigs,
  WidgetInstanceConfig,
} from '../storage/widgetData';
import {
  isMetricWidgetName,
  resolveWidgetChartType,
} from '../widgets/metricWidgetRegistry';
import { DEFAULT_WIDGET_CITY_ID } from '../widgets/constants';

export type ResolvedWidgetEntry = WidgetInfo & {
  cityId: WidgetInstanceConfig['cityId'];
  chartType: WidgetInstanceConfig['chartType'];
  isMetric: boolean;
};

export function hasWidgetDimensions(info: WidgetInfo): boolean {
  return info.width > 0 && info.height > 0;
}

/** Skip launcher preview entries; real instances always have a positive id. */
export function isWidgetInstance(info: WidgetInfo): boolean {
  return info.widgetId > 0;
}

/** Widgets actually placed on the home screen (not picker previews or stale ids). */
export function getPlacedWidgetInstances(widgetInfos: WidgetInfo[]): WidgetInfo[] {
  return widgetInfos.filter((info) => isWidgetInstance(info) && hasWidgetDimensions(info));
}

function resolveWidgetName(
  config: WidgetInstanceConfig,
  platformInfo: WidgetInfo,
): string {
  return config.widgetName ?? platformInfo.widgetName;
}

function buildResolvedWidgetEntry(
  info: WidgetInfo,
  storedConfig: WidgetInstanceConfig,
): ResolvedWidgetEntry {
  const widgetName = resolveWidgetName(storedConfig, info);

  return {
    ...info,
    widgetName,
    cityId: storedConfig.cityId,
    chartType: resolveWidgetChartType(widgetName, storedConfig.chartType),
    isMetric: isMetricWidgetName(widgetName),
  };
}

function ephemeralDefaultConfig(widgetName: string): WidgetInstanceConfig {
  return {
    cityId: DEFAULT_WIDGET_CITY_ID,
    chartType: resolveWidgetChartType(widgetName),
    widgetName,
  };
}

/**
 * Align stored widget configs with widgets confirmed on the home screen.
 * Never creates new listing entries here — only user actions / WIDGET_ADDED do.
 */
export async function syncWidgetRegistryFromPlatform(
  widgetInfos: WidgetInfo[],
): Promise<void> {
  const placedInstances = getPlacedWidgetInstances(widgetInfos);
  const placedWidgetIds = new Set(placedInstances.map((info) => info.widgetId));

  if (placedWidgetIds.size === 0) {
    await clearAllWidgetConfigs();
    return;
  }

  await pruneOrphanWidgetConfigs(placedWidgetIds);
  await pruneUnconfiguredWidgetConfigs();
}

/** Resolve config for rendering. Never persists unless persist is explicitly true. */
export async function resolveWidgetRenderConfig(
  widgetInfo: Pick<WidgetInfo, 'widgetId' | 'widgetName' | 'width' | 'height'>,
  options?: { persist?: boolean },
): Promise<WidgetInstanceConfig> {
  const stored = await getWidgetConfig(widgetInfo.widgetId);

  if (options?.persist !== true) {
    return stored ?? ephemeralDefaultConfig(widgetInfo.widgetName);
  }

  return ensureWidgetListedConfig(widgetInfo.widgetId, widgetInfo.widgetName, stored);
}

/** @deprecated Kept for tests. */
export async function resolveWidgetListEntry(
  info: WidgetInfo,
): Promise<ResolvedWidgetEntry | null> {
  if (!isWidgetInstance(info) || !hasWidgetDimensions(info)) {
    return null;
  }

  const storedConfig = await getWidgetConfig(info.widgetId);
  if (!storedConfig || storedConfig.configured !== true) {
    return null;
  }

  return buildResolvedWidgetEntry(info, storedConfig);
}

export async function pruneStaleWidgetConfigs(activeWidgetIds: Set<number>): Promise<void> {
  if (activeWidgetIds.size === 0) {
    await clearAllWidgetConfigs();
    return;
  }

  await pruneOrphanWidgetConfigs(activeWidgetIds);
  await pruneUnconfiguredWidgetConfigs();
}

/**
 * List widgets confirmed on the home screen with an explicit configured entry.
 */
export async function loadResolvedWidgetEntries(
  widgetInfos: WidgetInfo[],
): Promise<ResolvedWidgetEntry[]> {
  const placedInstances = getPlacedWidgetInstances(widgetInfos);
  const placedWidgetIds = new Set(placedInstances.map((info) => info.widgetId));

  await syncWidgetRegistryFromPlatform(widgetInfos);

  if (placedWidgetIds.size === 0) {
    return [];
  }

  const infoById = new Map(placedInstances.map((info) => [info.widgetId, info]));
  const configuredWidgets = await listConfiguredWidgetConfigs();

  return configuredWidgets
    .filter(({ widgetId }) => placedWidgetIds.has(widgetId))
    .map(({ widgetId, config }) => buildResolvedWidgetEntry(infoById.get(widgetId)!, config));
}
