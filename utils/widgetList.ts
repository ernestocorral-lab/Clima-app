import type { WidgetInfo } from 'react-native-android-widget';
import { getWidgetConfig, saveWidgetConfig, WidgetInstanceConfig } from '../storage/widgetData';
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

function defaultWidgetConfig(widgetName: string): WidgetInstanceConfig {
  return {
    cityId: DEFAULT_WIDGET_CITY_ID,
    chartType: resolveWidgetChartType(widgetName),
  };
}

export function hasWidgetDimensions(info: WidgetInfo): boolean {
  return info.width > 0 && info.height > 0;
}

/** Skip launcher preview entries; real instances always have a positive id. */
export function isWidgetInstance(info: WidgetInfo): boolean {
  return info.widgetId > 0;
}

export async function resolveWidgetListEntry(
  info: WidgetInfo,
): Promise<ResolvedWidgetEntry | null> {
  if (!isWidgetInstance(info)) {
    return null;
  }

  const storedConfig = await getWidgetConfig(info.widgetId);
  const placed = hasWidgetDimensions(info);

  if (!placed && !storedConfig) {
    return null;
  }

  const config = storedConfig ?? defaultWidgetConfig(info.widgetName);
  if (!storedConfig) {
    await saveWidgetConfig(info.widgetId, config);
  }

  return {
    ...info,
    width: placed ? info.width : Math.max(info.width, 110),
    height: placed ? info.height : Math.max(info.height, 110),
    cityId: config.cityId,
    chartType: resolveWidgetChartType(info.widgetName, config.chartType),
    isMetric: isMetricWidgetName(info.widgetName),
  };
}

export async function loadResolvedWidgetEntries(
  widgetInfos: WidgetInfo[],
): Promise<ResolvedWidgetEntry[]> {
  const entries = await Promise.all(widgetInfos.map((info) => resolveWidgetListEntry(info)));
  return entries.filter((entry): entry is ResolvedWidgetEntry => entry !== null);
}
