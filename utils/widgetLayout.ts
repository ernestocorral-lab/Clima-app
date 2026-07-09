import type { WidgetInfo } from 'react-native-android-widget';

export function isCompactWidget(widgetInfo: Pick<WidgetInfo, 'width' | 'height'>): boolean {
  return widgetInfo.width < 210 || widgetInfo.height < 125;
}
