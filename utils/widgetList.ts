import type { WidgetInfo } from 'react-native-android-widget';
import {
  getWidgetConfig,
  listConfiguredWidgetConfigs,
  pruneOrphanWidgetConfigs,
  pruneUnconfiguredWidgetConfigs,
  saveWidgetConfig,
  WidgetInstanceConfig,
} from '../storage/widgetData';
import {
  isMetricWidgetName,
  resolveWidgetChartType,
} from '../widgets/metricWidgetRegistry';

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

function resolveWidgetName(
  config: WidgetInstanceConfig,
  platformInfo: WidgetInfo,
): string {
  if (config.widgetName) {
    return config.widgetName;
  }

  return platformInfo.widgetName;
}

function buildResolvedWidgetEntry(
  info: WidgetInfo,
  storedConfig: WidgetInstanceConfig,
): ResolvedWidgetEntry {
  const placed = hasWidgetDimensions(info);
  const widgetName = resolveWidgetName(storedConfig, info);

  return {
    ...info,
    widgetName,
    width: placed ? info.width : Math.max(info.width, 110),
    height: placed ? info.height : Math.max(info.height, 110),
    cityId: storedConfig.cityId,
    chartType: resolveWidgetChartType(widgetName, storedConfig.chartType),
    isMetric: isMetricWidgetName(widgetName),
  };
}

/** Upgrade legacy/default configs for widgets Android reports on the home screen. */
async function upgradePlacedWidgetConfigs(widgetInfos: WidgetInfo[]): Promise<void> {
  await Promise.all(
    widgetInfos
      .filter((info) => isWidgetInstance(info) && hasWidgetDimensions(info))
      .map(async (info) => {
        const stored = await getWidgetConfig(info.widgetId);
        if (!stored || stored.configured === true) {
          return;
        }

        await saveWidgetConfig(info.widgetId, {
          ...stored,
          configured: true,
          widgetName: stored.widgetName ?? info.widgetName,
        });
      }),
  );
}

export async function syncWidgetRegistryFromPlatform(
  widgetInfos: WidgetInfo[],
): Promise<void> {
  const activeInstances = widgetInfos.filter(isWidgetInstance);
  const activeWidgetIds = new Set(activeInstances.map((info) => info.widgetId));

  await pruneOrphanWidgetConfigs(activeWidgetIds);
  await upgradePlacedWidgetConfigs(widgetInfos);
  await pruneUnconfiguredWidgetConfigs();
}

/** @deprecated Kept for tests; listing is storage-driven via loadResolvedWidgetEntries. */
export async function resolveWidgetListEntry(
  info: WidgetInfo,
): Promise<ResolvedWidgetEntry | null> {
  if (!isWidgetInstance(info)) {
    return null;
  }

  const storedConfig = await getWidgetConfig(info.widgetId);
  if (!storedConfig || storedConfig.configured !== true) {
    return null;
  }

  return buildResolvedWidgetEntry(info, storedConfig);
}

/** Remove configs that were never explicitly configured by the user. */
export async function pruneStaleWidgetConfigs(activeWidgetIds: Set<number>): Promise<void> {
  await pruneOrphanWidgetConfigs(activeWidgetIds);
  await pruneUnconfiguredWidgetConfigs();
}

/**
 * List widgets that exist on the home screen according to Android and have a
 * user/default configured entry in storage.
 */
export async function loadResolvedWidgetEntries(
  widgetInfos: WidgetInfo[],
): Promise<ResolvedWidgetEntry[]> {
  const activeInstances = widgetInfos.filter(isWidgetInstance);
  const activeWidgetIds = new Set(activeInstances.map((info) => info.widgetId));

  await syncWidgetRegistryFromPlatform(widgetInfos);

  const infoById = new Map(activeInstances.map((info) => [info.widgetId, info]));
  const configuredWidgets = await listConfiguredWidgetConfigs();

  return configuredWidgets
    .filter(({ widgetId }) => activeWidgetIds.has(widgetId))
    .map(({ widgetId, config }) => buildResolvedWidgetEntry(infoById.get(widgetId)!, config));
}
