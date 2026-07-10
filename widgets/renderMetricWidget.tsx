import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetInfo } from 'react-native-android-widget';
import { getChartFromSnapshot, WidgetCitySnapshot } from '../storage/widgetData';
import { shortCityName } from '../utils/formatCity';
import {
  getWidgetMetricParts,
  getWidgetMetricValueColor,
} from '../utils/widgetMetricDisplay';
import { WidgetChartType } from '../utils/widgetChartData';
import { metricLabel, t } from '../i18n';

function scaleFontSize(base: number, widgetInfo: Pick<WidgetInfo, 'width' | 'height'>): number {
  const scale = Math.min(widgetInfo.width, widgetInfo.height) / 56;
  return Math.max(Math.round(base * scale), Math.round(base * 0.75));
}

export function renderMetricWidget(
  snapshot: WidgetCitySnapshot | null,
  chartType: WidgetChartType,
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
) {
  const chart = getChartFromSnapshot(snapshot, chartType);
  const metricParts = getWidgetMetricParts(chartType, chart?.currentLabel ?? '--');
  const valueColor = getWidgetMetricValueColor(chartType, chart?.currentLabel ?? '--') ?? '#FFFFFF';
  const cityLabel = snapshot?.cityLabel ? shortCityName(snapshot.cityLabel) : t('widget.label');
  const metricLabelText = chart?.label ?? metricLabel(chartType);

  const labelSize = scaleFontSize(9, widgetInfo);
  const valueSize = scaleFontSize(20, widgetInfo);
  const unitSize = scaleFontSize(10, widgetInfo);
  const citySize = scaleFontSize(8, widgetInfo);

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
        paddingHorizontal: 6,
        paddingVertical: 4,
        flexDirection: 'column',
        justifyContent: 'center',
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
          marginBottom: 1,
        }}
      />
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
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
      <TextWidget
        text={cityLabel}
        maxLines={1}
        truncate="END"
        style={{
          color: '#7A95C4',
          fontSize: citySize,
          fontWeight: '600',
          marginTop: 1,
        }}
      />
    </FlexWidget>
  );
}
