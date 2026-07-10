import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetInfo } from 'react-native-android-widget';
import { getChartFromSnapshot, WidgetCitySnapshot } from '../storage/widgetData';
import { WidgetChartType, usesIntegerPeakLabels } from '../utils/widgetChartData';
import {
  computeWidgetChartHeight,
  isCompactWidget,
  isStripWidget,
} from '../utils/widgetLayout';
import { formatWidgetStaleness } from '../utils/widgetStaleness';
import { buildWidgetChartSvg, buildWidgetEmptySvg } from '../utils/widgetTemperatureChart';
import { t } from '../i18n';

export function renderWeatherWidget(
  snapshot: WidgetCitySnapshot | null,
  chartType: WidgetChartType,
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
) {
  const compact = isCompactWidget(widgetInfo);
  const strip = isStripWidget(widgetInfo);
  const chart = getChartFromSnapshot(snapshot, chartType);
  const showSubtitle = !compact && !strip;
  const staleness = formatWidgetStaleness(snapshot?.updatedAt);
  const showStaleness = Boolean(staleness) && !strip;
  const chartHeight = computeWidgetChartHeight(widgetInfo, {
    compact,
    strip,
    showSubtitle,
    showStaleness,
  });
  const chartWidth = Math.max(140, widgetInfo.width - 16);
  const svg =
    chart && chart.points.length >= 2
      ? buildWidgetChartSvg(chart.points, chart.envelope, chartWidth, chartHeight, {
          showMinEnvelope: chartType !== 'precipitation',
          compact,
          integerPeakLabels: usesIntegerPeakLabels(chartType),
        })
      : buildWidgetEmptySvg(chartWidth, chartHeight);

  const headerValue = chart?.currentLabel ?? '--';
  const chartLabel = chart?.subtitle ?? chart?.label ?? t('common.chart');

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={
        snapshot
          ? t('widget.accessibility', {
              metric: chart?.label ?? t('common.chart'),
              city: snapshot.cityLabel,
              value: headerValue,
            })
          : t('widget.accessibilityFallback')
      }
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#16325F',
        paddingTop: compact || strip ? 4 : 6,
        paddingHorizontal: 8,
        paddingBottom: compact || strip ? 2 : 2,
        flexDirection: 'column',
        borderRadius: 16,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: compact || strip ? 0 : 1,
        }}
      >
        <TextWidget
          text={snapshot?.cityLabel ? `${snapshot.cityLabel} ` : `${t('widget.label')} `}
          maxLines={1}
          truncate="END"
          style={{
            color: '#FFFFFF',
            fontSize: compact ? 11 : 12,
            fontWeight: 'bold',
            flex: 1,
          }}
        />
        <TextWidget
          text={headerValue}
          style={{
            color: '#FFFFFF',
            fontSize: compact ? 12 : 14,
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>
      {showSubtitle && (
        <TextWidget
          text={chartLabel}
          maxLines={1}
          truncate="END"
          style={{
            color: '#9BB4DE',
            fontSize: 10,
            fontWeight: '600',
            marginBottom: 2,
          }}
        />
      )}
      <SvgWidget
        svg={svg}
        style={{
          height: chartHeight,
          width: 'match_parent',
        }}
      />
      {showStaleness && (
        <TextWidget
          text={staleness}
          maxLines={1}
          truncate="END"
          style={{
            color: '#FF9B7A',
            fontSize: 9,
            fontWeight: '600',
            marginTop: 1,
          }}
        />
      )}
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
