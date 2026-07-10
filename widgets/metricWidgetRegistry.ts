import { WidgetChartType } from '../utils/widgetChartData';
import { DEFAULT_WIDGET_CHART_TYPE, METRIC_WIDGET_NAME, TEMPERATURE_WIDGET_NAME } from './constants';

export const ALL_WIDGET_NAMES = [TEMPERATURE_WIDGET_NAME, METRIC_WIDGET_NAME];

export function isMetricWidgetName(widgetName: string): boolean {
  return widgetName === METRIC_WIDGET_NAME;
}

export function resolveWidgetChartType(
  _widgetName: string,
  chartType?: WidgetChartType,
): WidgetChartType {
  return chartType ?? DEFAULT_WIDGET_CHART_TYPE;
}
