import type { WidgetInfo } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getWidgetConfig,
  WidgetInstanceConfig,
} from '../storage/widgetData';
import {
  isMetricWidgetName,
  resolveWidgetChartType,
} from '../widgets/metricWidgetRegistry';

const CONFIG_PREFIX = '@weather-app/widget-config/';

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
  if (!storedConfig) {
    return null;
  }

  const placed = hasWidgetDimensions(info);

  if (isUserConfiguredWidget(storedConfig)) {
    return buildResolvedWidgetEntry(info, storedConfig, placed);
  }

  if (storedConfig.configured === false && placed) {
    return buildResolvedWidgetEntry(info, storedConfig, placed);
  }

  return null;
}

function buildResolvedWidgetEntry(
  info: WidgetInfo,
  storedConfig: WidgetInstanceConfig,
  placed: boolean,
): ResolvedWidgetEntry {
  return {
    ...info,
    width: placed ? info.width : Math.max(info.width, 110),
    height: placed ? info.height : Math.max(info.height, 110),
    cityId: storedConfig.cityId,
    chartType: resolveWidgetChartType(info.widgetName, storedConfig.chartType),
    isMetric: isMetricWidgetName(info.widgetName),
  };
}

/** Remove configs created for widgets that are not on the home screen. */
export async function pruneStaleWidgetConfigs(activeWidgetIds: Set<number>): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const configKeys = keys.filter((key) => key.startsWith(CONFIG_PREFIX));

  await Promise.all(
    configKeys.map(async (key) => {
      const widgetId = Number(key.slice(CONFIG_PREFIX.length));
      if (!Number.isFinite(widgetId) || activeWidgetIds.has(widgetId)) {
        return;
      }

      const config = await getWidgetConfig(widgetId);
      if (config?.configured === false) {
        await AsyncStorage.removeItem(key);
      }
    }),
  );
}

export async function loadResolvedWidgetEntries(
  widgetInfos: WidgetInfo[],
): Promise<ResolvedWidgetEntry[]> {
  const instances = widgetInfos.filter(isWidgetInstance);
  await pruneStaleWidgetConfigs(new Set(instances.map((info) => info.widgetId)));

  const entries = await Promise.all(instances.map((info) => resolveWidgetListEntry(info)));
  return entries.filter((entry): entry is ResolvedWidgetEntry => entry !== null);
}
