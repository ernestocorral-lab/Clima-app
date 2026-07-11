import { getWidgetChartOptions, WidgetChartType } from './widgetChartData';

export const WIDGET_DEEP_LINK_SCHEME = 'clima';

const VALID_CHART_TYPES = new Set(getWidgetChartOptions().map((option) => option.id));

export function buildWidgetDeepLink(cityId: string, chartType: WidgetChartType): string {
  return `${WIDGET_DEEP_LINK_SCHEME}://open/${encodeURIComponent(cityId)}/${encodeURIComponent(chartType)}`;
}

export function parseWidgetDeepLink(
  url: string | null | undefined,
): { cityId: string; chartType: WidgetChartType } | null {
  if (!url) {
    return null;
  }

  const match = url.match(/^clima:\/\/open\/([^/]+)\/([^/?#]+)/i);
  if (!match) {
    return null;
  }

  const cityId = decodeURIComponent(match[1]);
  const chartType = decodeURIComponent(match[2]) as WidgetChartType;
  if (!VALID_CHART_TYPES.has(chartType)) {
    return null;
  }

  return { cityId, chartType };
}
