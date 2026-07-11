import { WidgetChartType } from './widgetChartData';
import { ChartValueColorMode } from './chartValueColors';

export function getWidgetChartValueColorMode(
  chartType: WidgetChartType,
): ChartValueColorMode | undefined {
  if (chartType === 'temperature' || chartType === 'apparent') {
    return 'temperature';
  }

  if (chartType === 'uv') {
    return 'uv';
  }

  return undefined;
}
