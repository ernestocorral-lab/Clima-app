import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { deleteWidgetConfig } from '../storage/widgetData';
import { resolveWidgetRenderConfig } from '../utils/widgetList';
import { loadWidgetSnapshotForCity } from './loadWidgetSnapshot';
import { resolveWidgetChartType } from './metricWidgetRegistry';
import { renderWidgetInstance } from './renderWidgetInstance';

registerWidgetTaskHandler(async ({ widgetAction, widgetInfo, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') {
    await deleteWidgetConfig(widgetInfo.widgetId);
    return;
  }

  const persist =
    widgetAction === 'WIDGET_ADDED' ||
    widgetAction === 'WIDGET_RESIZED' ||
    widgetInfo.width > 0;

  const config = await resolveWidgetRenderConfig(widgetInfo, { persist });
  const chartType = resolveWidgetChartType(widgetInfo.widgetName, config.chartType);
  const forceRefresh = widgetAction === 'WIDGET_UPDATE';
  const snapshot =
    (await loadWidgetSnapshotForCity(config.cityId, { forceRefresh })) ?? null;
  renderWidget(renderWidgetInstance(snapshot, chartType, widgetInfo));
});
