import type { WidgetInfo } from 'react-native-android-widget';
import {
  getWidgetConfig,
  listConfiguredWidgetConfigs,
  pruneUnconfiguredWidgetConfigs,
  saveWidgetConfig,
  WidgetInstanceConfig,
} from '../storage/widgetData';
import {
  ALL_WIDGET_NAMES,
  isMetricWidgetName,
  resolveWidgetChartType,
} from '../widgets/metricWidgetRegistry';
import { TEMPERATURE_WIDGET_NAME } from '../widgets/constants';

const PLACEHOLDER_SCREEN: WidgetInfo['screenInfo'] = {
  screenHeightDp: 640,
  screenWidthDp: 360,
  density: 2,
  densityDpi: 320,
};

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
  platformInfo?: WidgetInfo,
): string {
  if (config.widgetName && ALL_WIDGET_NAMES.includes(config.widgetName)) {
    return config.widgetName;
  }

  if (platformInfo?.widgetName && ALL_WIDGET_NAMES.includes(platformInfo.widgetName)) {
    return platformInfo.widgetName;
  }

  return TEMPERATURE_WIDGET_NAME;
}

function createPlaceholderWidgetInfo(
  widgetId: number,
  widgetName: string,
): WidgetInfo {
  return {
    widgetId,
    widgetName,
    width: 0,
    height: 0,
    screenInfo: PLACEHOLDER_SCREEN,
  };
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
export async function pruneStaleWidgetConfigs(_activeWidgetIds: Set<number>): Promise<void> {
  await pruneUnconfiguredWidgetConfigs();
}

/**
 * List widgets from user-configured storage entries, enriched with Android
 * dimensions when available.
 */
export async function loadResolvedWidgetEntries(
  widgetInfos: WidgetInfo[],
): Promise<ResolvedWidgetEntry[]> {
  await upgradePlacedWidgetConfigs(widgetInfos);
  await pruneUnconfiguredWidgetConfigs();

  const infoById = new Map(
    widgetInfos
      .filter((info) => isWidgetInstance(info))
      .map((info) => [info.widgetId, info]),
  );

  const configuredWidgets = await listConfiguredWidgetConfigs();

  return configuredWidgets.map(({ widgetId, config }) => {
    const platformInfo = infoById.get(widgetId);
    const widgetName = resolveWidgetName(config, platformInfo);
    const info = platformInfo ?? createPlaceholderWidgetInfo(widgetId, widgetName);
    return buildResolvedWidgetEntry(info, config);
  });
}
