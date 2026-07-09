import type { WidgetInfo } from 'react-native-android-widget';

/** 2×2 or narrower: simplified chart without day labels. */
export function isCompactWidget(widgetInfo: Pick<WidgetInfo, 'width' | 'height'>): boolean {
  return widgetInfo.width < 180;
}

/** 3×1 strip: full chart but tighter header (no subtitle / staleness). */
export function isStripWidget(widgetInfo: Pick<WidgetInfo, 'width' | 'height'>): boolean {
  return !isCompactWidget(widgetInfo) && widgetInfo.height < 128;
}
