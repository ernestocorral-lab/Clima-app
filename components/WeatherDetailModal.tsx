import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { TemperatureChart } from './TemperatureChart';
import { WeekSummaryBox, WeekSummaryScrollTarget } from './WeekSummaryBox';
import { WeatherData } from '../services/weather';
import {
  buildApparentTemperatureChartSeries,
  buildHumidityChartSeries,
  buildMetricChartSeries,
  buildEuropeanAqiChartSeries,
  buildPm25ChartSeries,
  buildPressureChartSeries,
  buildTemperatureChartSeries,
  buildUvIndexChartSeries,
  buildWindChartSeries,
  buildWindGustChartSeries,
  ChartSeries,
  DailyEnvelope,
  getApparentTemperatureEnvelope,
  getHumidityEnvelope,
  getMetricEnvelope,
  getPrecipitationEnvelope,
  getPressureEnvelope,
  getTemperatureEnvelope,
  getUvIndexEnvelope,
  getWindEnvelope,
  getWindGustEnvelope,
  scaleHourlyValues,
} from '../utils/chartSeries';
import { getWeatherDescription, getWeatherEmoji } from '../utils/weatherCodes';
import { getDetailLocationLabel } from '../utils/formatCity';
import { formatNowLabel } from '../utils/formatWeather';
import { getWeekSummary } from '../utils/weekSummary';
import { ChartValueColorMode } from '../utils/chartValueColors';
import { getTemperatureValueColor } from '../utils/temperatureLevel';
import { getUvIndexLevel } from '../utils/uvIndexLevel';
import { formatDataAge, formatStaleWarning } from '../utils/dataStaleness';
import { scaledFontSize, MIN_TOUCH_TARGET } from '../utils/accessibility';
import { getExtraCurrentMetricsAtHour, MetricScrollTarget } from '../utils/weatherMetrics';
import { getHourlyPreview, getMaxHourOffset } from '../utils/hourlyPreview';
import { CurrentHourScrubber } from './CurrentHourScrubber';
import { SectionTitle } from './SectionTitle';
import { getLocaleTag, metricLabel, t } from '../i18n';

type WeatherDetailModalProps = {
  visible: boolean;
  locationId: string;
  title: string;
  subtitle?: string;
  weather: WeatherData | null;
  fetchedAt?: string;
  fromCache?: boolean;
  initialScrollTarget?: MetricScrollTarget | null;
  onClose: () => void;
};

type MetricConfig = {
  label: string;
  scrollKey?: WeekSummaryScrollTarget;
  series: ChartSeries;
  dailyEnvelope: DailyEnvelope[];
  formatValue: (value: number) => string;
  chartFormatValue?: (value: number) => string;
  titleSuffix?: string;
  showEnvelope?: boolean;
  showEnvelopeLines?: boolean;
  showMinEnvelope?: boolean;
  valueColorMode?: ChartValueColorMode;
};

function formatDay(dateString: string, index: number): string {
  if (index === 0) {
    return t('common.today');
  }

  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString(getLocaleTag(), { weekday: 'long', day: 'numeric' });
}

function MetricChartBlock({
  label,
  scrollKey,
  onRegisterChartRef,
  series,
  dailyEnvelope,
  formatValue,
  chartFormatValue,
  titleSuffix,
  showEnvelope,
  showEnvelopeLines,
  showMinEnvelope,
  valueColorMode,
  referenceTime,
}: MetricConfig & {
  onRegisterChartRef?: (key: WeekSummaryScrollTarget, node: View | null) => void;
  referenceTime: string;
}) {
  return (
    <View
      ref={(node) => {
        if (scrollKey) {
          onRegisterChartRef?.(scrollKey, node);
        }
      }}
      style={styles.chartBlock}
    >
      <SectionTitle large style={styles.sectionTitle}>
        {`${label} — ${series.intervalLabel}${titleSuffix ?? ''}`}
      </SectionTitle>
      <View style={styles.chartCard}>
        <TemperatureChart
          series={series}
          dailyEnvelope={dailyEnvelope}
          formatValue={chartFormatValue ?? formatValue}
          height={260}
          showDayLabels
          interactive
          intervalHours={series.intervalHours}
          showEnvelope={showEnvelope ?? true}
          showEnvelopeLines={showEnvelopeLines ?? true}
          showMinEnvelope={showMinEnvelope ?? true}
          valueColorMode={valueColorMode}
          referenceTime={referenceTime}
          showNowMarker
        />
      </View>
    </View>
  );
}

export function WeatherDetailModal({
  visible,
  locationId,
  title,
  subtitle,
  weather,
  fetchedAt,
  fromCache,
  initialScrollTarget,
  onClose,
}: WeatherDetailModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const chartRefs = useRef<Partial<Record<MetricScrollTarget, View>>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  const closingRef = useRef(false);
  const [currentMetricsExpanded, setCurrentMetricsExpanded] = useState(false);
  const [weeklyMaxExpanded, setWeeklyMaxExpanded] = useState(false);
  const [hourOffset, setHourOffset] = useState(0);

  useEffect(() => {
    if (!visible) {
      setHourOffset(0);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.97);
      return;
    }

    closingRef.current = false;
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.97);

    const frame = requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => cancelAnimationFrame(frame);
  }, [visible, fadeAnim, scaleAnim]);

  const handleClose = useCallback(() => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        closingRef.current = false;
        onClose();
      }
    });
  }, [fadeAnim, scaleAnim, onClose]);

  const registerChartRef = useCallback((key: MetricScrollTarget, node: View | null) => {
    if (node) {
      chartRefs.current[key] = node;
      return;
    }
    delete chartRefs.current[key];
  }, []);

  const scrollToChart = useCallback((target: MetricScrollTarget) => {
    const chartView = chartRefs.current[target];
    const contentView = contentRef.current;
    if (!chartView || !contentView) {
      return;
    }

    chartView.measureLayout(contentView, (_x, y) => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    });
  }, []);

  useEffect(() => {
    if (!visible || !initialScrollTarget || !weather) {
      return;
    }

    const timer = setTimeout(() => {
      scrollToChart(initialScrollTarget);
    }, 450);

    return () => clearTimeout(timer);
  }, [visible, initialScrollTarget, weather, scrollToChart]);

  if (!weather) {
    return null;
  }

  const weekSummary = getWeekSummary(weather.daily, weather.hourly);
  const maxHourOffset = getMaxHourOffset(weather);
  const preview = getHourlyPreview(weather, hourOffset);
  const currentTempColor = getTemperatureValueColor(preview.temperature);
  const currentApparentColor = getTemperatureValueColor(preview.apparentTemperature);
  const hourly = weather.hourly;
  const visibilityKm = scaleHourlyValues(hourly?.visibility, 1000);
  const extraCurrentMetrics = getExtraCurrentMetricsAtHour(weather, preview.hourIndex, hourOffset);
  const currentUv = preview.uvIndex;
  const currentUvLevel = getUvIndexLevel(currentUv);
  const dataAgeLabel = formatDataAge(fetchedAt);
  const staleWarning = formatStaleWarning(fetchedAt);
  const tempFontSize = scaledFontSize(48);
  const statFontSize = scaledFontSize(18);
  const chartMetrics: MetricConfig[] = [
    {
      label: metricLabel('temperature'),
      scrollKey: 'temperature',
      series: buildTemperatureChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getTemperatureEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)}°`,
      titleSuffix: t('units.celsius'),
      valueColorMode: 'temperature',
    },
    {
      label: metricLabel('apparent'),
      scrollKey: 'apparent',
      series: buildApparentTemperatureChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getApparentTemperatureEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)}°`,
      titleSuffix: t('units.celsius'),
      valueColorMode: 'temperature',
    },
    {
      label: metricLabel('humidity'),
      scrollKey: 'humidity',
      series: buildHumidityChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getHumidityEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)}%`,
      titleSuffix: t('units.percent'),
    },
    {
      label: metricLabel('precipitation'),
      scrollKey: 'precipitation',
      series: buildMetricChartSeries(hourly, hourly?.precipitation, weather.daily),
      dailyEnvelope: getPrecipitationEnvelope(hourly, hourly?.precipitation, weather.daily),
      formatValue: (value) => `${value.toFixed(1)} mm`,
      chartFormatValue: (value) => value.toFixed(1),
      titleSuffix: t('units.mm'),
      showMinEnvelope: false,
      showEnvelopeLines: false,
    },
    {
      label: metricLabel('wind'),
      scrollKey: 'wind',
      series: buildWindChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getWindEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)} km/h`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: t('units.kmh'),
    },
    {
      label: metricLabel('windGust'),
      scrollKey: 'windGust',
      series: buildWindGustChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getWindGustEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)} km/h`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: t('units.kmh'),
    },
    {
      label: metricLabel('pressure'),
      scrollKey: 'pressure',
      series: buildPressureChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getPressureEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)} mbar`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: t('units.mbar'),
    },
    {
      label: metricLabel('uv'),
      scrollKey: 'uv',
      series: buildUvIndexChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getUvIndexEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => value.toFixed(1),
      chartFormatValue: (value) => value.toFixed(1),
      valueColorMode: 'uv',
    },
    {
      label: metricLabel('radiation'),
      scrollKey: 'radiation',
      series: buildMetricChartSeries(hourly, hourly?.shortwaveRadiation, weather.daily),
      dailyEnvelope: getMetricEnvelope(hourly, hourly?.shortwaveRadiation, weather.daily),
      formatValue: (value) => `${Math.round(value)} W/m²`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: t('units.wm2'),
    },
    {
      label: metricLabel('visibility'),
      scrollKey: 'visibility',
      series: buildMetricChartSeries(hourly, visibilityKm, weather.daily),
      dailyEnvelope: getMetricEnvelope(hourly, visibilityKm, weather.daily),
      formatValue: (value) => `${Math.round(value)} km`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: t('units.km'),
    },
    {
      label: metricLabel('gases'),
      scrollKey: 'gases',
      series: buildEuropeanAqiChartSeries(hourly, weather.daily),
      dailyEnvelope: getMetricEnvelope(hourly, hourly?.europeanAqi, weather.daily),
      formatValue: (value) => `${Math.round(value)} EAQI`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: t('units.eaqi'),
    },
    {
      label: metricLabel('particles'),
      scrollKey: 'particles',
      series: buildPm25ChartSeries(hourly, weather.daily),
      dailyEnvelope: getMetricEnvelope(hourly, hourly?.pm25, weather.daily),
      formatValue: (value) => `${Math.round(value)} µg/m³`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: t('units.ugm3'),
    },
    {
      label: metricLabel('allergens'),
      scrollKey: 'allergens',
      series: buildMetricChartSeries(hourly, hourly?.allergens, weather.daily),
      dailyEnvelope: getMetricEnvelope(hourly, hourly?.allergens, weather.daily),
      formatValue: (value) => `${Math.round(value)} grains/m³`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: t('units.grains'),
    },
  ];

  const weeklyForecastTitle =
    windowWidth < 360 ? t('detail.weeklyForecastShort') : t('detail.weeklyForecast');

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={styles.backButton}>{t('common.back')}</Text>
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
          <View ref={contentRef}>
          <Text style={styles.title}>
            {getDetailLocationLabel(locationId, title, subtitle ?? weather.city, weather.timezone)}
          </Text>

          <View style={styles.currentCard}>
            <Text style={styles.nowLabel}>
              {hourOffset === 0
                ? formatNowLabel(weather.current.observedAt, weather.countryCodeAlpha2)
                : preview.timeLabel}
            </Text>
            {fetchedAt ? (
              <Text style={[styles.dataAgeLabel, fromCache || staleWarning ? styles.dataAgeStale : null]}>
                {fromCache
                  ? t('staleness.offline', { age: dataAgeLabel })
                  : staleWarning
                    ? t('staleness.stale', { age: dataAgeLabel })
                    : t('staleness.updated', { age: dataAgeLabel })}
              </Text>
            ) : null}
            <View style={styles.currentRow}>
              <Text style={styles.currentEmoji}>{getWeatherEmoji(preview.weatherCode)}</Text>
              <Pressable
                onPress={() => scrollToChart('temperature')}
                style={({ pressed }) => [
                  styles.touchTarget,
                  pressed && styles.currentPressablePressed,
                ]}
              >
                <Text
                  style={[
                    styles.currentTemp,
                    { color: currentTempColor, fontSize: tempFontSize },
                  ]}
                >
                  {Math.round(preview.temperature)}°
                </Text>
              </Pressable>
              <Pressable
                onPress={() => scrollToChart('apparent')}
                style={({ pressed }) => [
                  styles.touchTarget,
                  pressed && styles.currentPressablePressed,
                ]}
              >
                <Text
                  style={[
                    styles.currentApparent,
                    {
                      color: currentApparentColor,
                      fontSize: tempFontSize,
                    },
                  ]}
                >
                  ({Math.round(preview.apparentTemperature)}°)
                </Text>
              </Pressable>
            </View>
            <Text style={styles.currentCondition}>{preview.condition}</Text>
            <View style={styles.currentStats}>
              <Pressable
                onPress={() => scrollToChart('humidity')}
                style={({ pressed }) => [
                  styles.touchTarget,
                  pressed && styles.currentPressablePressed,
                ]}
              >
                <Text style={[styles.currentStat, { fontSize: statFontSize }]}>
                  💧 {preview.humidity}%
                </Text>
              </Pressable>
              <Pressable
                onPress={() => scrollToChart('wind')}
                style={({ pressed }) => [
                  styles.touchTarget,
                  pressed && styles.currentPressablePressed,
                ]}
              >
                <Text style={[styles.currentStat, { fontSize: statFontSize }]}>
                  💨 {Math.round(preview.windSpeed)} km/h
                </Text>
              </Pressable>
              <Pressable
                onPress={() => scrollToChart('uv')}
                style={({ pressed }) => [
                  styles.touchTarget,
                  pressed && styles.currentPressablePressed,
                ]}
              >
                <Text style={[styles.currentStat, { fontSize: statFontSize }]}>
                  ☀️{' '}
                  <Text style={{ color: currentUvLevel.color }}>
                    {currentUv.toFixed(1)}
                  </Text>
                </Text>
              </Pressable>
            </View>
            {currentMetricsExpanded ? (
              <View style={styles.currentExtraStats}>
                {extraCurrentMetrics.map((metric) => {
                  const text = (
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      style={[
                        styles.currentExtraStat,
                        metric.color ? { color: metric.color } : null,
                      ]}
                    >
                      {metric.displayLine}
                    </Text>
                  );

                  if (!metric.scrollKey) {
                    return (
                      <View key={metric.id} style={styles.currentExtraStatWrap}>
                        {text}
                      </View>
                    );
                  }

                  return (
                    <Pressable
                      key={metric.id}
                      onPress={() => scrollToChart(metric.scrollKey!)}
                      style={({ pressed }) => [
                        styles.currentExtraStatWrap,
                        styles.touchTarget,
                        pressed && styles.currentPressablePressed,
                      ]}
                    >
                      {text}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <Pressable
              onPress={() => setCurrentMetricsExpanded((value) => !value)}
              style={({ pressed }) => [
                styles.expandButton,
                pressed && styles.currentPressablePressed,
              ]}
            >
              <Text style={styles.expandButtonText}>
                {currentMetricsExpanded ? t('detail.showLess') : t('detail.showAllCurrent')}
              </Text>
            </Pressable>
            {maxHourOffset > 0 ? (
              <CurrentHourScrubber
                hourOffset={hourOffset}
                maxOffset={maxHourOffset}
                endLabel={preview.timeLabel}
                onChange={setHourOffset}
                compact
              />
            ) : null}
          </View>

          <View style={styles.sectionHeaderRow}>
            <SectionTitle style={styles.sectionTitleInline}>
              {t('detail.weeklyMaxValues')}
            </SectionTitle>
            <Pressable
              onPress={() => setWeeklyMaxExpanded((value) => !value)}
              style={({ pressed }) => pressed && styles.currentPressablePressed}
            >
              <Text style={styles.sectionToggle}>
                {weeklyMaxExpanded ? t('detail.showEssential') : t('detail.showAllWeekly')}
              </Text>
            </Pressable>
          </View>
          <WeekSummaryBox
            summary={weekSummary}
            large
            expanded={weeklyMaxExpanded}
            onRowPress={scrollToChart}
          />

          <SectionTitle style={styles.sectionTitle}>{weeklyForecastTitle}</SectionTitle>
          {weather.daily.map((day, index) => (
            <View key={day.date} style={styles.forecastRow}>
              <Text style={styles.forecastDay}>{formatDay(day.date, index)}</Text>
              <Text style={styles.forecastEmoji}>{getWeatherEmoji(day.weatherCode)}</Text>
              <Text style={styles.forecastCondition} numberOfLines={1}>
                {getWeatherDescription(day.weatherCode)}
              </Text>
              <Text style={styles.forecastTemps}>
                <Text style={{ color: getTemperatureValueColor(day.maxTemp) }}>
                  {Math.round(day.maxTemp)}°
                </Text>
                <Text style={styles.forecastTempSep}> / </Text>
                <Text style={{ color: getTemperatureValueColor(day.minTemp) }}>
                  {Math.round(day.minTemp)}°
                </Text>
              </Text>
            </View>
          ))}

          {chartMetrics.map((metric) => (
            <MetricChartBlock
              key={`chart-${metric.label}`}
              {...metric}
              referenceTime={preview.observedAt}
              onRegisterChartRef={registerChartRef}
            />
          ))}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1D3A',
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  backButton: {
    color: '#3D7BFF',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  currentCard: {
    backgroundColor: '#16325F',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  nowLabel: {
    color: '#7EC8FF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentEmoji: {
    fontSize: 42,
  },
  currentTemp: {
    fontWeight: '700',
  },
  currentApparent: {
    fontWeight: '700',
  },
  dataAgeLabel: {
    color: '#9BB4DE',
    fontSize: 11,
    fontWeight: '500',
  },
  dataAgeStale: {
    color: '#FFD27A',
  },
  touchTarget: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  expandButton: {
    marginTop: 4,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  expandButtonText: {
    color: '#7EC8FF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitleInline: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  sectionToggle: {
    color: '#7EC8FF',
    fontSize: 13,
    fontWeight: '600',
  },
  currentPressablePressed: {
    opacity: 0.7,
  },
  currentCondition: {
    color: '#C7D7F2',
    fontSize: 16,
    textAlign: 'center',
  },
  currentStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  currentStat: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  currentExtraStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A2F57',
    width: '100%',
  },
  currentExtraStatWrap: {
    width: '46%',
    alignItems: 'center',
  },
  currentExtraStat: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
  chartBlock: {
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: '#16325F',
    borderRadius: 16,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: 'visible',
  },
  forecastRow: {
    backgroundColor: '#13284D',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  forecastDay: {
    color: '#FFFFFF',
    fontSize: 15,
    width: 100,
    textTransform: 'capitalize',
  },
  forecastEmoji: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  forecastCondition: {
    color: '#9BB4DE',
    fontSize: 13,
    flex: 1,
  },
  forecastTemps: {
    fontSize: 15,
    fontWeight: '600',
  },
  forecastTempSep: {
    color: '#9BB4DE',
    fontSize: 15,
    fontWeight: '600',
  },
});
