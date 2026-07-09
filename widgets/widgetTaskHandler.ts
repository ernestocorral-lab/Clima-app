import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { getWidgetCityConfig } from '../storage/widgetData';
import { DEFAULT_WIDGET_CITY_ID } from './constants';
import { loadWidgetSnapshotForCity } from './loadWidgetSnapshot';
import { renderTemperatureWidget } from './renderTemperatureWidget';

registerWidgetTaskHandler(async ({ widgetAction, widgetInfo, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') {
    return;
  }

  const cityId = (await getWidgetCityConfig(widgetInfo.widgetId)) ?? DEFAULT_WIDGET_CITY_ID;
  const snapshot = (await loadWidgetSnapshotForCity(cityId)) ?? null;
  renderWidget(renderTemperatureWidget(snapshot, widgetInfo));
});
