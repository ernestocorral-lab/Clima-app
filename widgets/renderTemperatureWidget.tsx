import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetInfo } from 'react-native-android-widget';
import { WidgetWeatherSnapshot } from '../storage/widgetData';
import {
  buildWidgetEmptySvg,
  buildWidgetTemperatureSvg,
} from '../utils/widgetTemperatureChart';

export function renderTemperatureWidget(
  snapshot: WidgetWeatherSnapshot | null,
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
) {
  const chartHeight = Math.max(52, widgetInfo.height - 40);
  const chartWidth = Math.max(140, widgetInfo.width - 16);
  const svg = snapshot
    ? buildWidgetTemperatureSvg(snapshot.points, snapshot.envelope, chartWidth, chartHeight)
    : buildWidgetEmptySvg(chartWidth, chartHeight);

  const tempLabel = snapshot
    ? `${Math.round(snapshot.currentTemp)}°`
    : '--°';

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={
        snapshot
          ? `Temperatura de ${snapshot.cityLabel}, ${tempLabel}`
          : 'Widget de temperatura'
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
          marginBottom: 4,
        }}
      >
        <TextWidget
          text={snapshot?.cityLabel ?? 'Temperatura'}
          maxLines={1}
          truncate="END"
          style={{
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 'bold',
          }}
        />
        <TextWidget
          text={tempLabel}
          style={{
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>
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
