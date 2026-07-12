import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetInfo } from 'react-native-android-widget';
import { getChartFromSnapshot, WidgetCitySnapshot } from '../storage/widgetData';
import { shortCityName } from '../utils/formatCity';
import { isWideMetricWidget } from '../utils/widgetLayout';
import {
  getWidgetMetricParts,
  getWidgetMetricValueColor,
} from '../utils/widgetMetricDisplay';
import { WidgetChartType } from '../utils/widgetChartData';
import { formatWidgetStaleness } from '../utils/widgetStaleness';
import { buildWidgetDeepLink } from '../utils/widgetDeepLink';
import { colors } from '../theme';
import { metricLabel, t } from '../i18n';

function scaleFontSize(
  base: number,
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
  expanded: boolean,
): number {
  const scale = expanded
    ? Math.max(widgetInfo.width, widgetInfo.height) / 56
    : Math.min(widgetInfo.width, widgetInfo.height) / 56;
  return Math.max(Math.round(base * scale), Math.round(base * 0.75));
}

export function renderMetricWidget(
  snapshot: WidgetCitySnapshot | null,
  chartType: WidgetChartType,
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
) {
  const wide = isWideMetricWidget(widgetInfo);
  const chart = getChartFromSnapshot(snapshot, chartType);
  const metricParts = getWidgetMetricParts(chartType, chart?.currentLabel ?? '--');
  const valueColor = getWidgetMetricValueColor(chartType, chart?.currentLabel ?? '--') ?? colors.textPrimary;
  const cityLabel = snapshot?.cityLabel ? shortCityName(snapshot.cityLabel) : t('widget.label');
  const metricLabelText = chart?.label ?? metricLabel(chartType);
  const staleness = wide ? formatWidgetStaleness(snapshot?.updatedAt) : null;

  const labelSize = scaleFontSize(wide ? 11 : 9, widgetInfo, wide);
  const valueSize = scaleFontSize(wide ? 24 : 20, widgetInfo, wide);
  const unitSize = scaleFontSize(wide ? 13 : 10, widgetInfo, wide);
  const citySize = scaleFontSize(wide ? 10 : 8, widgetInfo, wide);
  const stalenessSize = scaleFontSize(8, widgetInfo, wide);

  const cityId = snapshot?.cityId ?? 'city-1';
  const widgetDeepLink = buildWidgetDeepLink(cityId, chartType);

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: widgetDeepLink }}
      accessibilityLabel={
        snapshot
          ? t('widget.accessibility', {
              metric: metricLabelText,
              city: cityLabel,
              value: chart?.currentLabel ?? '--',
            })
          : t('widget.accessibilityFallback')
      }
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.surfaceElevated,
        paddingHorizontal: wide ? 10 : 6,
        paddingVertical: wide ? 6 : 4,
        flexDirection: 'column',
        justifyContent: wide ? 'space-between' : 'center',
        borderRadius: 16,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextWidget
          text={metricLabelText}
          maxLines={1}
          truncate="END"
          style={{
            color: colors.textMuted,
            fontSize: labelSize,
            fontWeight: '600',
          }}
        />
        {wide ? (
          <TextWidget
            text={cityLabel}
            maxLines={1}
            truncate="END"
            style={{
              color: colors.textHint,
              fontSize: citySize,
              fontWeight: '600',
            }}
          />
        ) : null}
      </FlexWidget>
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: wide ? 'center' : 'flex-start',
        }}
      >
        <TextWidget
          text={metricParts.value}
          maxLines={1}
          style={{
            color: valueColor as typeof colors.textPrimary,
            fontSize: valueSize,
            fontWeight: '700',
          }}
        />
        {metricParts.unit ? (
          <TextWidget
            text={` ${metricParts.unit}`}
            maxLines={1}
            truncate="END"
            style={{
              color: colors.textSecondary,
              fontSize: unitSize,
              fontWeight: '600',
            }}
          />
        ) : null}
      </FlexWidget>
      {wide && staleness ? (
        <TextWidget
          text={staleness}
          maxLines={1}
          truncate="END"
          style={{
            color: '#FF9B7A',
            fontSize: stalenessSize,
            fontWeight: '600',
          }}
        />
      ) : null}
      {!wide ? (
        <TextWidget
          text={cityLabel}
          maxLines={1}
          truncate="END"
          style={{
            color: colors.textPrimary,
            fontSize: citySize,
            fontWeight: '600',
            marginTop: 1,
          }}
        />
      ) : null}
    </FlexWidget>
  );
}
