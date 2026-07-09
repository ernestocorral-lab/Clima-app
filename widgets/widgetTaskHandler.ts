import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { getWidgetConfig } from '../storage/widgetData';
import { DEFAULT_WIDGET_CHART_TYPE, DEFAULT_WIDGET_CITY_ID } from './constants';
import { loadWidgetSnapshotForCity } from './loadWidgetSnapshot';
import { renderWeatherWidget } from './renderWeatherWidget';

registerWidgetTaskHandler(async ({ widgetAction, widgetInfo, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') {
    return;
  }

  const config = (await getWidgetConfig(widgetInfo.widgetId)) ?? {
    cityId: DEFAULT_WIDGET_CITY_ID,
    chartType: DEFAULT_WIDGET_CHART_TYPE,
  };
  const forceRefresh = widgetAction === 'WIDGET_UPDATE';
  const snapshot =
    (await loadWidgetSnapshotForCity(config.cityId, { forceRefresh })) ?? null;
  renderWidget(renderWeatherWidget(snapshot, config.chartType, widgetInfo));
});
