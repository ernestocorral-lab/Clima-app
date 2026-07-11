import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { getWidgetConfig } from '../storage/widgetData';
import { loadWidgetSnapshotForCity } from './loadWidgetSnapshot';
import { resolveWidgetChartType } from './metricWidgetRegistry';
import { renderWidgetInstance } from './renderWidgetInstance';

registerWidgetTaskHandler(async ({ widgetAction, widgetInfo, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') {
    return;
  }

  const config = await getWidgetConfig(widgetInfo.widgetId);
  if (!config) {
    return;
  }

  const chartType = resolveWidgetChartType(widgetInfo.widgetName, config.chartType);
  const forceRefresh = widgetAction === 'WIDGET_UPDATE';
  const snapshot =
    (await loadWidgetSnapshotForCity(config.cityId, { forceRefresh })) ?? null;
  renderWidget(renderWidgetInstance(snapshot, chartType, widgetInfo));
});
