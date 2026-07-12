import type { WidgetInfo } from 'react-native-android-widget';
import { resolveWidgetRenderConfig } from '../utils/widgetList';
import { loadWidgetSnapshotForCity } from './loadWidgetSnapshot';
import {
  isCitySummaryWidgetName,
  resolveWidgetChartType,
} from './metricWidgetRegistry';
import { renderWidgetInstance } from './renderWidgetInstance';

type PlacedWidgetInfo = Pick<WidgetInfo, 'widgetId' | 'widgetName' | 'width' | 'height'>;

export async function renderPlacedWidget(
  widgetInfo: PlacedWidgetInfo,
  options?: { forceRefresh?: boolean },
) {
  const config = await resolveWidgetRenderConfig(widgetInfo);
  const chartType = resolveWidgetChartType(widgetInfo.widgetName, config.chartType);
  const requireSummary = isCitySummaryWidgetName(widgetInfo.widgetName);
  const snapshot = await loadWidgetSnapshotForCity(config.cityId, {
    forceRefresh: options?.forceRefresh,
    chartType,
    requireSummary,
  });
  return renderWidgetInstance(snapshot, chartType, widgetInfo);
}
