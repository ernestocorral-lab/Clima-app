import {
  registerWidgetTaskHandler,
  requestWidgetUpdateById,
  type WidgetInfo,
} from 'react-native-android-widget';
import { deleteWidgetConfig } from '../storage/widgetData';
import { resolveWidgetRenderConfig } from '../utils/widgetList';
import { renderPlacedWidget } from './renderPlacedWidget';

/** Launcher often reports placeholder dimensions on the first draw. */
function needsLayoutSettle(widgetInfo: Pick<WidgetInfo, 'width' | 'height'>): boolean {
  return widgetInfo.width < 200 || widgetInfo.height < 110;
}

registerWidgetTaskHandler(async ({ widgetAction, widgetInfo, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') {
    await deleteWidgetConfig(widgetInfo.widgetId);
    return;
  }

  if (widgetAction === 'WIDGET_ADDED') {
    await resolveWidgetRenderConfig(widgetInfo, { persist: true });
  }

  const forceRefresh =
    widgetAction === 'WIDGET_UPDATE' ||
    widgetAction === 'WIDGET_ADDED' ||
    widgetAction === 'WIDGET_RESIZED';

  renderWidget(await renderPlacedWidget(widgetInfo, { forceRefresh }));

  if (widgetAction === 'WIDGET_ADDED' || needsLayoutSettle(widgetInfo)) {
    void requestWidgetUpdateById({
      widgetName: widgetInfo.widgetName,
      widgetId: widgetInfo.widgetId,
      renderWidget: (info) => renderPlacedWidget(info, { forceRefresh: true }),
    });
  }
});
