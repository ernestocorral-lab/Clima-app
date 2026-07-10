import { useCallback, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { DailyForecast } from '../services/weather';
import { ChartSeries, DailyEnvelope, getTemperatureEnvelope } from '../utils/chartSeries';
import { getDailyPeakPoints } from '../utils/dailyPeaks';
import { getWeekDayMarkers } from '../utils/dayLabels';
import { formatChartPointTime } from '../utils/formatWeather';
import { getPeakLabelLayout } from '../utils/chartGeometry';
import { buildSmoothPath } from '../utils/smoothPath';

const CHART_LINE_BLUE = '#5B9BFF';
const CHART_LINE_YELLOW = '#FFEB3B';
const PEAK_MAX_COLOR = '#FF9B7A';
const PEAK_MIN_COLOR = '#7EC8FF';
const PEAK_LABEL_COLOR = '#FFFFFF';
const SCRUB_LINE_COLOR = '#FFFFFF';
const SCRUB_DOT_COLOR = '#FFFFFF';

type TemperatureChartProps = {
  series: ChartSeries;
  daily?: DailyForecast[];
  dailyEnvelope?: DailyEnvelope[];
  valueSuffix?: string;
  formatValue?: (value: number) => string;
  height?: number;
  showDayLabels?: boolean;
  showIntervalLabel?: boolean;
  labelFontSize?: number;
  interactive?: boolean;
  intervalHours?: number;
  edgeAwareLabels?: boolean;
  showEnvelope?: boolean;
  showEnvelopeLines?: boolean;
  showMinEnvelope?: boolean;
  onPress?: () => void;
};

function defaultFormatValue(value: number, suffix: string): string {
  return `${Math.round(value)}${suffix}`;
}

function isPeakValue(value: number, peakValue: number | null): boolean {
  return peakValue !== null && Math.abs(value - peakValue) < 0.05;
}

export function TemperatureChart({
  series,
  daily = [],
  dailyEnvelope,
  valueSuffix = '°',
  formatValue,
  height = 44,
  showDayLabels = true,
  showIntervalLabel = true,
  labelFontSize: labelFontSizeProp,
  interactive = false,
  intervalHours,
  edgeAwareLabels: edgeAwareLabelsProp,
  showEnvelope = true,
  showEnvelopeLines = true,
  showMinEnvelope = true,
  onPress,
}: TemperatureChartProps) {
  const [width, setWidth] = useState(0);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const edgeAwareLabels = edgeAwareLabelsProp ?? interactive;
  const paddingLeft = 4;
  const paddingRight = 4;
  const isLarge = height > 80;
  const paddingTop = isLarge ? 30 : 18;
  const paddingBottom = isLarge ? 26 : 16;
  const dayLabelHeight = showDayLabels ? 16 : 0;
  const labelFontSize = labelFontSizeProp ?? (isLarge ? 15 : 9);
  const maxLabelOffset = isLarge ? 14 : 8;
  const minLabelOffset = isLarge ? 18 : 12;
  const envelope = dailyEnvelope ?? (daily.length > 0 ? getTemperatureEnvelope(undefined, daily) : []);
  const format = formatValue ?? ((value: number) => defaultFormatValue(value, valueSuffix));
  const pointIntervalHours = intervalHours ?? series.intervalHours;

  const chart = useMemo(() => {
    const points = series.points;
    if (points.length < 2 || width <= 0) {
      return null;
    }

    const seriesValues = points.map((point) => point.value);
    const envelopeValues = showEnvelope
      ? envelope.flatMap((day) => (showMinEnvelope ? [day.max, day.min] : [day.max]))
      : [];
    const allValues = [...seriesValues, ...envelopeValues];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;
    const innerWidth = width - paddingLeft - paddingRight;
    const innerHeight = height - paddingTop - paddingBottom;

    const plotted = points.map((point, index) => {
      const x = paddingLeft + (index / (points.length - 1)) * innerWidth;
      const y = paddingTop + innerHeight - ((point.value - min) / range) * innerHeight;
      return { x, y, value: point.value, time: point.time };
    });

    const polyline = plotted.map((point) => `${point.x},${point.y}`).join(' ');
    const lastPoint = plotted[plotted.length - 1];
    const dayMarkers = getWeekDayMarkers(points).map((marker) => ({
      ...marker,
      x: paddingLeft + marker.xFraction * innerWidth,
    }));

    const { maxPoints, minPoints } = showEnvelope
      ? getDailyPeakPoints(envelope, points, {
          paddingLeft,
          innerWidth,
          paddingTop,
          innerHeight,
          minValue: min,
          maxValue: max,
        })
      : { maxPoints: [], minPoints: [] };

    const visibleMaxPoints = showEnvelope ? maxPoints : [];
    const visibleMinPoints = showEnvelope && showMinEnvelope ? minPoints : [];
    const maxPath = showEnvelope ? buildSmoothPath(visibleMaxPoints) : '';
    const minPath = showEnvelope && showMinEnvelope ? buildSmoothPath(visibleMinPoints) : '';

    const weekMaxPeakValue =
      visibleMaxPoints.length > 0
        ? Math.max(...visibleMaxPoints.map((point) => point.value))
        : null;
    const weekMinPeakValue =
      visibleMinPoints.length > 0
        ? Math.min(...visibleMinPoints.map((point) => point.value))
        : null;

    return {
      polyline,
      lastPoint,
      dayMarkers,
      plotted,
      maxPath,
      minPath,
      maxPoints: visibleMaxPoints,
      minPoints: visibleMinPoints,
      weekMaxPeakValue,
      weekMinPeakValue: showEnvelope && showMinEnvelope ? weekMinPeakValue : null,
      innerWidth,
    };
  }, [
    series.points,
    envelope,
    width,
    height,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    showEnvelope,
    showMinEnvelope,
  ]);

  const resolveIndexFromX = useCallback(
    (x: number) => {
      if (!chart) {
        return null;
      }

      const clampedX = Math.max(paddingLeft, Math.min(width - paddingRight, x));
      const fraction = (clampedX - paddingLeft) / chart.innerWidth;
      return Math.round(fraction * (chart.plotted.length - 1));
    },
    [chart, paddingLeft, paddingRight, width],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: () => interactive,
        onStartShouldSetPanResponderCapture: () => interactive,
        onMoveShouldSetPanResponderCapture: () => interactive,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          if (!interactive || !chart) {
            return;
          }
          setScrubIndex(resolveIndexFromX(event.nativeEvent.locationX));
        },
        onPanResponderMove: (event) => {
          if (!interactive || !chart) {
            return;
          }
          setScrubIndex(resolveIndexFromX(event.nativeEvent.locationX));
        },
        onPanResponderRelease: () => {
          setScrubIndex(null);
        },
        onPanResponderTerminate: () => {
          setScrubIndex(null);
        },
      }),
    [interactive, chart, resolveIndexFromX],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const activePoint =
    scrubIndex !== null && chart ? chart.plotted[scrubIndex] ?? null : null;

  const content = (
    <View style={[styles.wrap, styles.wrapVisible]} onLayout={onLayout}>
      {chart && width > 0 ? (
        <>
          <View
            style={[styles.chartArea, { height }]}
            {...(interactive ? panResponder.panHandlers : undefined)}
          >
            <Svg width={width} height={height} style={styles.svg} pointerEvents="none">
              {chart.plotted.map((point, index) =>
                index % Math.max(1, Math.floor(chart.plotted.length / 7)) === 0 ? (
                  <Line
                    key={`grid-${point.time}`}
                    x1={point.x}
                    y1={paddingTop}
                    x2={point.x}
                    y2={height - paddingBottom}
                    stroke="#1A2F57"
                    strokeWidth="0.5"
                  />
                ) : null,
              )}

              <Polyline
                points={chart.polyline}
                fill="none"
                stroke={CHART_LINE_BLUE}
                strokeWidth={isLarge ? 2.5 : 1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {showEnvelope && showEnvelopeLines && chart.maxPath ? (
                <Path
                  d={chart.maxPath}
                  fill="none"
                  stroke={CHART_LINE_YELLOW}
                  strokeWidth={isLarge ? 2 : 1.2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}

              {showEnvelope && showEnvelopeLines && showMinEnvelope && chart.minPath ? (
                <Path
                  d={chart.minPath}
                  fill="none"
                  stroke={CHART_LINE_YELLOW}
                  strokeWidth={isLarge ? 2 : 1.2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}

              {showEnvelope && showEnvelopeLines
                ? chart.maxPoints.map((point) => (
                    <Circle
                      key={`max-dot-${point.x}`}
                      cx={point.x}
                      cy={point.y}
                      r={isLarge ? 3.5 : 2.5}
                      fill={CHART_LINE_YELLOW}
                    />
                  ))
                : null}

              {showEnvelope && showEnvelopeLines && showMinEnvelope
                ? chart.minPoints.map((point) => (
                    <Circle
                      key={`min-dot-${point.x}`}
                      cx={point.x}
                      cy={point.y}
                      r={isLarge ? 3.5 : 2.5}
                      fill={CHART_LINE_YELLOW}
                    />
                  ))
                : null}

              {showEnvelope
                ? chart.maxPoints.map((point) => {
                    const label = format(point.value);
                    const layout = edgeAwareLabels
                      ? getPeakLabelLayout(
                          point.x,
                          width,
                          paddingLeft,
                          paddingRight,
                          label.length,
                        )
                      : { x: point.x, textAnchor: 'middle' as const };

                    return (
                      <SvgText
                        key={`max-label-${point.x}`}
                        x={layout.x}
                        y={point.y - maxLabelOffset}
                        fill={
                          isPeakValue(point.value, chart.weekMaxPeakValue)
                            ? PEAK_MAX_COLOR
                            : PEAK_LABEL_COLOR
                        }
                        fontSize={labelFontSize}
                        fontWeight="700"
                        textAnchor={layout.textAnchor}
                      >
                        {label}
                      </SvgText>
                    );
                  })
                : null}

              {showEnvelope && showMinEnvelope
                ? chart.minPoints.map((point) => {
                    const label = format(point.value);
                    const layout = edgeAwareLabels
                      ? getPeakLabelLayout(
                          point.x,
                          width,
                          paddingLeft,
                          paddingRight,
                          label.length,
                        )
                      : { x: point.x, textAnchor: 'middle' as const };

                    return (
                      <SvgText
                        key={`min-label-${point.x}`}
                        x={layout.x}
                        y={point.y + minLabelOffset}
                        fill={
                          isPeakValue(point.value, chart.weekMinPeakValue)
                            ? PEAK_MIN_COLOR
                            : PEAK_LABEL_COLOR
                        }
                        fontSize={labelFontSize}
                        fontWeight="700"
                        textAnchor={layout.textAnchor}
                      >
                        {label}
                      </SvgText>
                    );
                  })
                : null}

              {activePoint ? (
                <>
                  <Line
                    x1={activePoint.x}
                    y1={paddingTop}
                    x2={activePoint.x}
                    y2={height - paddingBottom}
                    stroke={SCRUB_LINE_COLOR}
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity={0.85}
                  />
                  <Circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r={isLarge ? 6 : 4}
                    fill={SCRUB_DOT_COLOR}
                    stroke={CHART_LINE_BLUE}
                    strokeWidth="2"
                  />
                </>
              ) : (
                <Circle
                  cx={chart.lastPoint.x}
                  cy={chart.lastPoint.y}
                  r={isLarge ? 4 : 2.5}
                  fill={CHART_LINE_BLUE}
                />
              )}
            </Svg>

            {activePoint ? (
              <View
                pointerEvents="none"
                style={[
                  styles.scrubTooltip,
                  {
                    left: Math.max(8, Math.min(width - 116, activePoint.x - 58)),
                    top: Math.max(4, activePoint.y - 52),
                  },
                ]}
              >
                <Text style={styles.scrubTime}>
                  {formatChartPointTime(activePoint.time, pointIntervalHours)}
                </Text>
                <Text style={styles.scrubValue}>{format(activePoint.value)}</Text>
              </View>
            ) : null}
          </View>

          {showDayLabels && (
            <View style={[styles.dayRow, { height: dayLabelHeight, paddingLeft, paddingRight }]}>
              {chart.dayMarkers.map((marker) => (
                <Text
                  key={`${marker.label}-${marker.x}`}
                  style={[styles.dayLabel, { left: marker.x - 5 }]}
                >
                  {marker.label}
                </Text>
              ))}
            </View>
          )}

          {showIntervalLabel ? (
            <Text style={[styles.interval, { marginTop: showDayLabels ? 0 : 2 }]}>
              {series.intervalLabel}
            </Text>
          ) : null}
        </>
      ) : (
        <View style={[styles.placeholder, { height }]} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 2,
    marginBottom: 2,
  },
  wrapVisible: {
    overflow: 'visible',
  },
  chartArea: {
    width: '100%',
    position: 'relative',
  },
  pressed: {
    opacity: 0.85,
  },
  svg: {
    alignSelf: 'center',
    overflow: 'visible',
  },
  scrubTooltip: {
    position: 'absolute',
    minWidth: 108,
    backgroundColor: '#0B1D3A',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3D7BFF',
    alignItems: 'center',
    gap: 2,
    zIndex: 10,
  },
  scrubTime: {
    color: '#9BB4DE',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  scrubValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  dayRow: {
    position: 'relative',
    width: '100%',
    marginTop: 1,
  },
  dayLabel: {
    position: 'absolute',
    color: '#9BB4DE',
    fontSize: 11,
    fontWeight: '700',
    width: 14,
    textAlign: 'center',
  },
  interval: {
    color: '#7A94BF',
    fontSize: 10,
    textAlign: 'center',
  },
  placeholder: {
    width: '100%',
  },
});
