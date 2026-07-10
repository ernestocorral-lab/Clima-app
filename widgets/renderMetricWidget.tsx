import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetInfo } from 'react-native-android-widget';
import { getChartFromSnapshot, WidgetCitySnapshot } from '../storage/widgetData';
import { shortCityName } from '../utils/formatCity';
import { isTallMetricWidget } from '../utils/widgetLayout';
import {
  getWidgetMetricParts,
  getWidgetMetricValueColor,
} from '../utils/widgetMetricDisplay';
import { WidgetChartType } from '../utils/widgetChartData';
import { formatWidgetStaleness } from '../utils/widgetStaleness';
import { metricLabel, t } from '../i18n';

function scaleFontSize(
  base: number,
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
  tall: boolean,
): number {
  const scale = tall
    ? widgetInfo.height / 56
    : Math.min(widgetInfo.width, widgetInfo.height) / 56;
  return Math.max(Math.round(base * scale), Math.round(base * 0.75));
}

export function renderMetricWidget(
  snapshot: WidgetCitySnapshot | null,
  chartType: WidgetChartType,
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
) {
  const tall = isTallMetricWidget(widgetInfo);
  const chart = getChartFromSnapshot(snapshot, chartType);
  const metricParts = getWidgetMetricParts(chartType, chart?.currentLabel ?? '--');
  const valueColor = getWidgetMetricValueColor(chartType, chart?.currentLabel ?? '--') ?? '#FFFFFF';
  const cityLabel = snapshot?.cityLabel ? shortCityName(snapshot.cityLabel) : t('widget.label');
  const metricLabelText = chart?.label ?? metricLabel(chartType);
  const staleness = tall ? formatWidgetStaleness(snapshot?.updatedAt) : null;

  const labelSize = scaleFontSize(tall ? 11 : 9, widgetInfo, tall);
  const valueSize = scaleFontSize(tall ? 28 : 20, widgetInfo, tall);
  const unitSize = scaleFontSize(tall ? 13 : 10, widgetInfo, tall);
  const citySize = scaleFontSize(tall ? 10 : 8, widgetInfo, tall);
  const stalenessSize = scaleFontSize(8, widgetInfo, tall);

  return (
    <FlexWidget
      clickAction="OPEN_APP"
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
        backgroundColor: '#16325F',
        paddingHorizontal: tall ? 8 : 6,
        paddingVertical: tall ? 8 : 4,
        flexDirection: 'column',
        justifyContent: tall ? 'space-between' : 'center',
        borderRadius: 16,
      }}
    >
      <TextWidget
        text={metricLabelText}
        maxLines={1}
        truncate="END"
        style={{
          color: '#9BB4DE',
          fontSize: labelSize,
          fontWeight: '600',
          marginBottom: tall ? 2 : 1,
        }}
      />
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: tall ? 'center' : 'flex-start',
        }}
      >
        <TextWidget
          text={metricParts.value}
          maxLines={1}
          style={{
            color: valueColor as '#FFFFFF',
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
              color: '#D8E6FF',
              fontSize: unitSize,
              fontWeight: '600',
            }}
          />
        ) : null}
      </FlexWidget>
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: tall ? 'center' : 'flex-start',
        }}
      >
        <TextWidget
          text={cityLabel}
          maxLines={1}
          truncate="END"
          style={{
            color: '#7A95C4',
            fontSize: citySize,
            fontWeight: '600',
            marginTop: tall ? 0 : 1,
          }}
        />
        {staleness ? (
          <TextWidget
            text={staleness}
            maxLines={1}
            truncate="END"
            style={{
              color: '#FF9B7A',
              fontSize: stalenessSize,
              fontWeight: '600',
              marginTop: 2,
            }}
          />
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}
