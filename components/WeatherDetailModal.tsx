import { useCallback, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { getLocationLabel } from '../utils/formatCity';
import { formatObservedAt } from '../utils/formatWeather';
import { getWeekSummary } from '../utils/weekSummary';

type WeatherDetailModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  weather: WeatherData | null;
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
};

function formatDay(dateString: string, index: number): string {
  if (index === 0) {
    return 'Hoy';
  }

  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
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
}: MetricConfig & {
  onRegisterChartRef?: (key: WeekSummaryScrollTarget, node: View | null) => void;
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
      <Text style={styles.sectionTitle}>
        {label} — {series.intervalLabel}
        {titleSuffix ?? ''}
      </Text>
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
        />
      </View>
    </View>
  );
}

export function WeatherDetailModal({
  visible,
  title,
  subtitle,
  weather,
  onClose,
}: WeatherDetailModalProps) {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const chartRefs = useRef<Partial<Record<WeekSummaryScrollTarget, View>>>({});

  const registerChartRef = useCallback((key: WeekSummaryScrollTarget, node: View | null) => {
    if (node) {
      chartRefs.current[key] = node;
      return;
    }
    delete chartRefs.current[key];
  }, []);

  const scrollToChart = useCallback((target: WeekSummaryScrollTarget) => {
    const chartView = chartRefs.current[target];
    const contentView = contentRef.current;
    if (!chartView || !contentView) {
      return;
    }

    chartView.measureLayout(contentView, (_x, y) => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    });
  }, []);

  if (!weather) {
    return null;
  }

  const weekSummary = getWeekSummary(weather.daily, weather.hourly);
  const hourly = weather.hourly;
  const visibilityKm = scaleHourlyValues(hourly?.visibility, 1000);
  const chartMetrics: MetricConfig[] = [
    {
      label: 'Temperatura',
      scrollKey: 'temperature',
      series: buildTemperatureChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getTemperatureEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)}°`,
    },
    {
      label: 'Sensación térmica',
      scrollKey: 'apparent',
      series: buildApparentTemperatureChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getApparentTemperatureEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)}°`,
    },
    {
      label: 'Humedad',
      scrollKey: 'humidity',
      series: buildHumidityChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getHumidityEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)}%`,
    },
    {
      label: 'Precipitaciones',
      scrollKey: 'precipitation',
      series: buildMetricChartSeries(hourly, hourly?.precipitation, weather.daily),
      dailyEnvelope: getPrecipitationEnvelope(hourly, hourly?.precipitation, weather.daily),
      formatValue: (value) => `${value.toFixed(1)} mm`,
      chartFormatValue: (value) => value.toFixed(1),
      titleSuffix: ' (mm)',
      showMinEnvelope: false,
      showEnvelopeLines: false,
    },
    {
      label: 'Viento',
      scrollKey: 'wind',
      series: buildWindChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getWindEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)} km/h`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: ' (km/h)',
    },
    {
      label: 'Ráfagas',
      scrollKey: 'windGust',
      series: buildWindGustChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getWindGustEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)} km/h`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: ' (km/h)',
    },
    {
      label: 'Presión',
      series: buildPressureChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getPressureEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => `${Math.round(value)} mbar`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: ' (mbar)',
    },
    {
      label: 'Índice UV',
      scrollKey: 'uv',
      series: buildUvIndexChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getUvIndexEnvelope(weather.hourly, weather.daily),
      formatValue: (value) => value.toFixed(1),
      chartFormatValue: (value) => value.toFixed(1),
    },
    {
      label: 'Radiación',
      series: buildMetricChartSeries(hourly, hourly?.shortwaveRadiation, weather.daily),
      dailyEnvelope: getMetricEnvelope(hourly, hourly?.shortwaveRadiation, weather.daily),
      formatValue: (value) => `${Math.round(value)} W/m²`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: ' (W/m²)',
    },
    {
      label: 'Visibilidad',
      series: buildMetricChartSeries(hourly, visibilityKm, weather.daily),
      dailyEnvelope: getMetricEnvelope(hourly, visibilityKm, weather.daily),
      formatValue: (value) => `${value.toFixed(1)} km`,
      chartFormatValue: (value) => value.toFixed(1),
      titleSuffix: ' (km)',
    },
    {
      label: 'Gases',
      series: buildEuropeanAqiChartSeries(hourly, weather.daily),
      dailyEnvelope: getMetricEnvelope(hourly, hourly?.europeanAqi, weather.daily),
      formatValue: (value) => `${Math.round(value)} EAQI`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: ' (EAQI)',
    },
    {
      label: 'Partículas',
      series: buildPm25ChartSeries(hourly, weather.daily),
      dailyEnvelope: getMetricEnvelope(hourly, hourly?.pm25, weather.daily),
      formatValue: (value) => `${Math.round(value)} µg/m³`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: ' (µg/m³)',
    },
    {
      label: 'Alergenos',
      series: buildMetricChartSeries(hourly, hourly?.allergens, weather.daily),
      dailyEnvelope: getMetricEnvelope(hourly, hourly?.allergens, weather.daily),
      formatValue: (value) => `${Math.round(value)} grains/m³`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: ' (grains/m³)',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.backButton}>‹ Volver</Text>
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
          <View ref={contentRef}>
          <Text style={styles.title}>
            {getLocationLabel(title, subtitle ?? weather.city, weather.timezone)}
          </Text>

          <View style={styles.currentCard}>
            <Text style={styles.nowLabel}>
              Ahora · {formatObservedAt(weather.current.observedAt, weather.countryCodeAlpha2)}
            </Text>
            <View style={styles.currentRow}>
              <Text style={styles.currentEmoji}>{getWeatherEmoji(weather.current.weatherCode)}</Text>
              <Pressable
                onPress={() => scrollToChart('temperature')}
                style={({ pressed }) => pressed && styles.currentPressablePressed}
              >
                <Text style={styles.currentTemp}>{Math.round(weather.current.temperature)}°</Text>
              </Pressable>
              <Pressable
                onPress={() => scrollToChart('apparent')}
                style={({ pressed }) => pressed && styles.currentPressablePressed}
              >
                <Text style={styles.currentApparent}>
                  ({Math.round(weather.current.apparentTemperature ?? weather.current.temperature)}°)
                </Text>
              </Pressable>
            </View>
            <Text style={styles.currentCondition}>
              {getWeatherDescription(weather.current.weatherCode)}
            </Text>
            <View style={styles.currentStats}>
              <Pressable
                onPress={() => scrollToChart('humidity')}
                style={({ pressed }) => pressed && styles.currentPressablePressed}
              >
                <Text style={styles.currentStat}>💧 {weather.current.humidity}%</Text>
              </Pressable>
              <Pressable
                onPress={() => scrollToChart('wind')}
                style={({ pressed }) => pressed && styles.currentPressablePressed}
              >
                <Text style={styles.currentStat}>
                  💨 {Math.round(weather.current.windSpeed)} km/h
                </Text>
              </Pressable>
            </View>
          </View>

          <WeekSummaryBox summary={weekSummary} large onRowPress={scrollToChart} />

          <Text style={styles.sectionTitle}>Pronóstico semanal</Text>
          {weather.daily.map((day, index) => (
            <View key={day.date} style={styles.forecastRow}>
              <Text style={styles.forecastDay}>{formatDay(day.date, index)}</Text>
              <Text style={styles.forecastEmoji}>{getWeatherEmoji(day.weatherCode)}</Text>
              <Text style={styles.forecastCondition} numberOfLines={1}>
                {getWeatherDescription(day.weatherCode)}
              </Text>
              <Text style={styles.forecastTemps}>
                {Math.round(day.maxTemp)}° / {Math.round(day.minTemp)}°
              </Text>
            </View>
          ))}

          {chartMetrics.map((metric) => (
            <MetricChartBlock
              key={`chart-${metric.label}`}
              {...metric}
              onRegisterChartRef={registerChartRef}
            />
          ))}
          </View>
        </ScrollView>
      </View>
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
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '700',
  },
  currentApparent: {
    color: '#C7D7F2',
    fontSize: 32,
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
    gap: 20,
    marginTop: 4,
  },
  currentStat: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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
    color: '#D8E6FF',
    fontSize: 15,
    fontWeight: '600',
  },
});
