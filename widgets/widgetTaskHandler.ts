import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { getWidgetConfig, deleteWidgetConfig } from '../storage/widgetData';
import { DEFAULT_WIDGET_CITY_ID } from './constants';
import { loadWidgetSnapshotForCity } from './loadWidgetSnapshot';
import { resolveWidgetChartType } from './metricWidgetRegistry';
import { renderWidgetInstance } from './renderWidgetInstance';

registerWidgetTaskHandler(async ({ widgetAction, widgetInfo, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') {
    await deleteWidgetConfig(widgetInfo.widgetId);
    return;
  }

  let config = await getWidgetConfig(widgetInfo.widgetId);
  if (!config) {
    config = {
      cityId: DEFAULT_WIDGET_CITY_ID,
      chartType: resolveWidgetChartType(widgetInfo.widgetName),
    };
  }
  const chartType = resolveWidgetChartType(widgetInfo.widgetName, config.chartType);
  const forceRefresh = widgetAction === 'WIDGET_UPDATE';
  const snapshot =
    (await loadWidgetSnapshotForCity(config.cityId, { forceRefresh })) ?? null;
  renderWidget(renderWidgetInstance(snapshot, chartType, widgetInfo));
});
