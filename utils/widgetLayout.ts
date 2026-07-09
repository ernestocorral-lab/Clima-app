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
  return (
    !isCompactWidget(widgetInfo) &&
    widgetInfo.height < FULL_LAYOUT_MIN_HEIGHT
  );
}
