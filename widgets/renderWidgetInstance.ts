import type { WidgetInfo } from 'react-native-android-widget';
import { WidgetCitySnapshot } from '../storage/widgetData';
import { WidgetChartType } from '../utils/widgetChartData';
import { isMetricWidgetName } from './metricWidgetRegistry';
import { renderMetricWidget } from './renderMetricWidget';
import { renderWeatherWidget } from './renderWeatherWidget';

export function renderWidgetInstance(
  snapshot: WidgetCitySnapshot | null,
  chartType: WidgetChartType,
  widgetInfo: Pick<WidgetInfo, 'width' | 'height' | 'widgetName'>,
) {
  if (isMetricWidgetName(widgetInfo.widgetName)) {
    return renderMetricWidget(snapshot, chartType, widgetInfo);
  }

  return renderWeatherWidget(snapshot, chartType, widgetInfo);
}
