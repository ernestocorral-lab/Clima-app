import type { WidgetInfo } from 'react-native-android-widget';

/** Minimum height (dp) for subtitle + staleness below the tile chart. */
const FULL_LAYOUT_MIN_HEIGHT = 122;

/** Minimum width (dp) for the full week chart with day labels. */
const FULL_CHART_MIN_WIDTH = 200;

/**
 * Very small widgets (≤2 columns or very short): simplified chart, no day labels.
 */
export function isCompactWidget(widgetInfo: Pick<WidgetInfo, 'width' | 'height'>): boolean {
  return widgetInfo.width < FULL_CHART_MIN_WIDTH || widgetInfo.height < 72;
}

/**
 * Wide but single-row widgets (e.g. user resized to 4×1): full chart, compact chrome.
 */
export function isStripWidget(widgetInfo: Pick<WidgetInfo, 'width' | 'height'>): boolean {
  return !isCompactWidget(widgetInfo) && widgetInfo.height < FULL_LAYOUT_MIN_HEIGHT;
}

/** Metric tile expanded horizontally (e.g. user resized to 2×1). */
export function isWideMetricWidget(widgetInfo: Pick<WidgetInfo, 'width'>): boolean {
  return widgetInfo.width >= 100;
}

/** Metric tile expanded vertically (e.g. user resized to 1×2). */
export function isTallMetricWidget(widgetInfo: Pick<WidgetInfo, 'height'>): boolean {
  return widgetInfo.height >= 80;
}

type ChartHeightOptions = {
  compact: boolean;
  strip: boolean;
  showSubtitle: boolean;
  showStaleness: boolean;
};

/** Height available for the SVG chart area inside the widget. */
export function computeWidgetChartHeight(
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
  options: ChartHeightOptions,
): number {
  const { compact, strip, showSubtitle, showStaleness } = options;
  const paddingVertical = compact || strip ? 6 : 8;
  const headerHeight = compact ? 14 : 16;
  const subtitleHeight = showSubtitle ? 12 : 0;
  const stalenessHeight = showStaleness ? 10 : 0;
  const gaps = (showSubtitle ? 2 : 0) + (showStaleness ? 1 : 0) + (compact || strip ? 0 : 1);

  const chrome =
    paddingVertical + headerHeight + subtitleHeight + stalenessHeight + gaps;
  const minChart = compact ? 40 : 56;

  return Math.max(minChart, Math.round(widgetInfo.height - chrome));
}
