import type { WidgetInfo } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getWidgetConfig,
  WidgetInstanceConfig,
} from '../storage/widgetData';
import {
  ALL_WIDGET_NAMES,
  isMetricWidgetName,
  resolveWidgetChartType,
} from '../widgets/metricWidgetRegistry';
import { TEMPERATURE_WIDGET_NAME } from '../widgets/constants';

const CONFIG_PREFIX = '@weather-app/widget-config/';

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

function isUserConfiguredWidget(config: WidgetInstanceConfig): boolean {
  return config.configured === true;
}

export async function resolveWidgetListEntry(
  info: WidgetInfo,
): Promise<ResolvedWidgetEntry | null> {
  if (!isWidgetInstance(info)) {
    return null;
  }

  const storedConfig = await getWidgetConfig(info.widgetId);
  if (!storedConfig || !isUserConfiguredWidget(storedConfig)) {
    return null;
  }

  return buildResolvedWidgetEntry(info, storedConfig);
}

function buildResolvedWidgetEntry(
  info: WidgetInfo,
  storedConfig: WidgetInstanceConfig,
): ResolvedWidgetEntry {
  const placed = hasWidgetDimensions(info);
  const widgetName = storedConfig.widgetName ?? info.widgetName;

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

function resolveWidgetName(config: WidgetInstanceConfig): string {
  if (config.widgetName && ALL_WIDGET_NAMES.includes(config.widgetName)) {
    return config.widgetName;
  }

  return TEMPERATURE_WIDGET_NAME;
}

async function loadPendingConfiguredWidgets(
  activeWidgetIds: Set<number>,
): Promise<ResolvedWidgetEntry[]> {
  const keys = await AsyncStorage.getAllKeys();
  const configKeys = keys.filter((key) => key.startsWith(CONFIG_PREFIX));
  const entries: ResolvedWidgetEntry[] = [];

  for (const key of configKeys) {
    const widgetId = Number(key.slice(CONFIG_PREFIX.length));
    if (!Number.isFinite(widgetId) || activeWidgetIds.has(widgetId)) {
      continue;
    }

    const config = await getWidgetConfig(widgetId);
    if (!config || !isUserConfiguredWidget(config)) {
      continue;
    }

    const widgetName = resolveWidgetName(config);
    entries.push({
      widgetId,
      widgetName,
      width: 0,
      height: 0,
      screenInfo: PLACEHOLDER_SCREEN,
      cityId: config.cityId,
      chartType: resolveWidgetChartType(widgetName, config.chartType),
      isMetric: isMetricWidgetName(widgetName),
    });
  }

  return entries;
}

/** Remove configs that were never explicitly configured by the user. */
export async function pruneStaleWidgetConfigs(_activeWidgetIds: Set<number>): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const configKeys = keys.filter((key) => key.startsWith(CONFIG_PREFIX));

  await Promise.all(
    configKeys.map(async (key) => {
      const widgetId = Number(key.slice(CONFIG_PREFIX.length));
      if (!Number.isFinite(widgetId)) {
        await AsyncStorage.removeItem(key);
        return;
      }

      const config = await getWidgetConfig(widgetId);
      if (!config || config.configured !== true) {
        await AsyncStorage.removeItem(key);
      }
    }),
  );
}

export async function loadResolvedWidgetEntries(
  widgetInfos: WidgetInfo[],
): Promise<ResolvedWidgetEntry[]> {
  const instances = widgetInfos.filter(isWidgetInstance);
  const activeWidgetIds = new Set(instances.map((info) => info.widgetId));

  await pruneStaleWidgetConfigs(activeWidgetIds);

  const fromPlatform = (
    await Promise.all(instances.map((info) => resolveWidgetListEntry(info)))
  ).filter((entry): entry is ResolvedWidgetEntry => entry !== null);

  const pending = await loadPendingConfiguredWidgets(activeWidgetIds);
  const seen = new Set(fromPlatform.map((entry) => entry.widgetId));

  return [...fromPlatform, ...pending.filter((entry) => !seen.has(entry.widgetId))];
}
