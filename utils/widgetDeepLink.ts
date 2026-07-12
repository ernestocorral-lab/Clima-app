import { getWidgetChartOptions, WidgetChartType } from './widgetChartData';

export const WIDGET_DEEP_LINK_SCHEME = 'clima';

export const WIDGET_CITY_SUMMARY_TARGET = 'city';

const VALID_CHART_TYPES = new Set(getWidgetChartOptions().map((option) => option.id));

export function buildWidgetDeepLink(cityId: string, chartType: WidgetChartType): string {
  return `${WIDGET_DEEP_LINK_SCHEME}://open/${encodeURIComponent(cityId)}/${encodeURIComponent(chartType)}`;
}

export function buildCitySummaryDeepLink(cityId: string): string {
  return `${WIDGET_DEEP_LINK_SCHEME}://open/${encodeURIComponent(cityId)}/${WIDGET_CITY_SUMMARY_TARGET}`;
}

export function parseWidgetDeepLink(
  url: string | null | undefined,
): { cityId: string; chartType: WidgetChartType | null } | null {
  if (!url) {
    return null;
  }

  const match = url.match(/^clima:\/\/open\/([^/]+)\/([^/?#]+)/i);
  if (!match) {
    return null;
  }

  const cityId = decodeURIComponent(match[1]);
  const target = decodeURIComponent(match[2]);
  if (target === WIDGET_CITY_SUMMARY_TARGET) {
    return { cityId, chartType: null };
  }

  const chartType = target as WidgetChartType;
  if (!VALID_CHART_TYPES.has(chartType)) {
    return null;
  }

  return { cityId, chartType };
}
