import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetInfo } from 'react-native-android-widget';
import { getChartFromSnapshot, WidgetCitySnapshot } from '../storage/widgetData';
import { WidgetChartType } from '../utils/widgetChartData';
import { buildWidgetChartSvg, buildWidgetEmptySvg } from '../utils/widgetTemperatureChart';

export function renderWeatherWidget(
  snapshot: WidgetCitySnapshot | null,
  chartType: WidgetChartType,
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
) {
  const chart = getChartFromSnapshot(snapshot, chartType);
  const chartHeight = Math.max(72, widgetInfo.height - 48);
  const chartWidth = Math.max(140, widgetInfo.width - 16);
  const svg =
    chart && chart.points.length >= 2
      ? buildWidgetChartSvg(chart.points, chart.envelope, chartWidth, chartHeight, {
          showMinEnvelope: chartType !== 'precipitation',
        })
      : buildWidgetEmptySvg(chartWidth, chartHeight);

  const headerValue = chart?.currentLabel ?? '--';
  const chartLabel = chart?.label ?? 'Gráfico';

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={
        snapshot
          ? `${chartLabel} de ${snapshot.cityLabel}, ${headerValue}`
          : 'Widget del clima'
      }
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#16325F',
        padding: 8,
        flexDirection: 'column',
        borderRadius: 16,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 2,
        }}
      >
        <TextWidget
          text={snapshot?.cityLabel ?? 'Clima'}
          maxLines={1}
          truncate="END"
          style={{
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 'bold',
          }}
        />
        <TextWidget
          text={headerValue}
          style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>
      <TextWidget
        text={chartLabel}
        maxLines={1}
        truncate="END"
        style={{
          color: '#9BB4DE',
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        }}
      />
      <SvgWidget
        svg={svg}
        style={{
          height: chartHeight,
          width: 'match_parent',
        }}
      />
    </FlexWidget>
  );
}

/** @deprecated Use renderWeatherWidget */
export function renderTemperatureWidget(
  snapshot: WidgetCitySnapshot | null,
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
) {
  return renderWeatherWidget(snapshot, 'temperature', widgetInfo);
}
