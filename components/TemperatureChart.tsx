import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { DailyForecast } from '../services/weather';
import { ChartSeries, DailyEnvelope, getTemperatureEnvelope } from '../utils/chartSeries';
import { getDailyPeakPoints } from '../utils/dailyPeaks';
import { getWeekDayMarkers } from '../utils/dayLabels';
import { buildSmoothPath } from '../utils/smoothPath';

const CHART_LINE_BLUE = '#5B9BFF';
const CHART_LINE_YELLOW = '#FFEB3B';
const PEAK_MAX_COLOR = '#FF9B7A';
const PEAK_MIN_COLOR = '#7EC8FF';
const PEAK_LABEL_COLOR = '#FFFFFF';

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
  onPress?: () => void;
};

function defaultFormatValue(value: number, suffix: string): string {
  return `${Math.round(value)}${suffix}`;
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
  onPress,
}: TemperatureChartProps) {
  const [width, setWidth] = useState(0);
  const paddingLeft = 4;
  const paddingRight = 4;
  const isLarge = height > 80;
  const paddingTop = isLarge ? 30 : 18;
  const paddingBottom = isLarge ? 26 : 16;
  const dayLabelHeight = showDayLabels ? 16 : 0;
  const labelFontSize = labelFontSizeProp ?? (isLarge ? 15 : 9);
  const maxLabelOffset = isLarge ? 14 : 8;
  const minLabelOffset = isLarge ? 18 : 12;
  const envelope = dailyEnvelope ?? (daily.length > 0 ? getTemperatureEnvelope(daily) : []);
  const format = formatValue ?? ((value: number) => defaultFormatValue(value, valueSuffix));

  const chart = useMemo(() => {
    const points = series.points;
    if (points.length < 2 || width <= 0) {
      return null;
    }

    const seriesValues = points.map((point) => point.value);
    const envelopeValues = envelope.flatMap((day) => [day.max, day.min]);
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

    const { maxPoints, minPoints } = getDailyPeakPoints(envelope, points, {
      paddingLeft,
      innerWidth,
      paddingTop,
      innerHeight,
      minValue: min,
      maxValue: max,
    });

    const maxPath = buildSmoothPath(maxPoints);
    const minPath = buildSmoothPath(minPoints);

    const weekMaxPeakValue =
      maxPoints.length > 0 ? Math.max(...maxPoints.map((point) => point.value)) : null;
    const weekMinPeakValue =
      minPoints.length > 0 ? Math.min(...minPoints.map((point) => point.value)) : null;

    return {
      polyline,
      lastPoint,
      dayMarkers,
      plotted,
      maxPath,
      minPath,
      maxPoints,
      minPoints,
      weekMaxPeakValue,
      weekMinPeakValue,
    };
  }, [series.points, envelope, width, height, paddingTop, paddingBottom]);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const content = (
    <View style={[styles.wrap, styles.wrapVisible]} onLayout={onLayout}>
      {chart && width > 0 ? (
        <>
          <Svg width={width} height={height} style={styles.svg}>
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

            {chart.maxPath ? (
              <Path
                d={chart.maxPath}
                fill="none"
                stroke={CHART_LINE_YELLOW}
                strokeWidth={isLarge ? 2 : 1.2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}

            {chart.minPath ? (
              <Path
                d={chart.minPath}
                fill="none"
                stroke={CHART_LINE_YELLOW}
                strokeWidth={isLarge ? 2 : 1.2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}

            {chart.maxPoints.map((point) => (
              <Circle
                key={`max-dot-${point.x}`}
                cx={point.x}
                cy={point.y}
                r={isLarge ? 3.5 : 2.5}
                fill={CHART_LINE_YELLOW}
              />
            ))}

            {chart.minPoints.map((point) => (
              <Circle
                key={`min-dot-${point.x}`}
                cx={point.x}
                cy={point.y}
                r={isLarge ? 3.5 : 2.5}
                fill={CHART_LINE_YELLOW}
              />
            ))}

            {chart.maxPoints.map((point) => (
              <SvgText
                key={`max-label-${point.x}`}
                x={point.x}
                y={point.y - maxLabelOffset}
                fill={
                  point.value === chart.weekMaxPeakValue ? PEAK_MAX_COLOR : PEAK_LABEL_COLOR
                }
                fontSize={labelFontSize}
                fontWeight="700"
                textAnchor="middle"
              >
                {format(point.value)}
              </SvgText>
            ))}

            {chart.minPoints.map((point) => (
              <SvgText
                key={`min-label-${point.x}`}
                x={point.x}
                y={point.y + minLabelOffset}
                fill={
                  point.value === chart.weekMinPeakValue ? PEAK_MIN_COLOR : PEAK_LABEL_COLOR
                }
                fontSize={labelFontSize}
                fontWeight="700"
                textAnchor="middle"
              >
                {format(point.value)}
              </SvgText>
            ))}

            <Circle
              cx={chart.lastPoint.x}
              cy={chart.lastPoint.y}
              r={isLarge ? 4 : 2.5}
              fill={CHART_LINE_BLUE}
            />
          </Svg>

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
  pressed: {
    opacity: 0.85,
  },
  svg: {
    alignSelf: 'center',
    overflow: 'visible',
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
