import { registerWidgetTaskHandler } from 'react-native-android-widget';
import {
  ensureWidgetListedConfig,
  getWidgetConfig,
  deleteWidgetConfig,
} from '../storage/widgetData';
import { loadWidgetSnapshotForCity } from './loadWidgetSnapshot';
import { resolveWidgetChartType } from './metricWidgetRegistry';
import { renderWidgetInstance } from './renderWidgetInstance';

registerWidgetTaskHandler(async ({ widgetAction, widgetInfo, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') {
    await deleteWidgetConfig(widgetInfo.widgetId);
    return;
  }

  const storedConfig = await getWidgetConfig(widgetInfo.widgetId);
  const config = await ensureWidgetListedConfig(
    widgetInfo.widgetId,
    widgetInfo.widgetName,
    storedConfig,
  );
  const chartType = resolveWidgetChartType(widgetInfo.widgetName, config.chartType);
  const forceRefresh = widgetAction === 'WIDGET_UPDATE';
  const snapshot =
    (await loadWidgetSnapshotForCity(config.cityId, { forceRefresh })) ?? null;
  renderWidget(renderWidgetInstance(snapshot, chartType, widgetInfo));
});
