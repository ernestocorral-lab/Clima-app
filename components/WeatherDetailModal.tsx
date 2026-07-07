import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TemperatureChart } from './TemperatureChart';
import { WeekSummaryBox } from './WeekSummaryBox';
import { WeatherData } from '../services/weather';
import {
  buildHumidityChartSeries,
  buildTemperatureChartSeries,
  buildWindChartSeries,
  ChartSeries,
  DailyEnvelope,
  getHumidityEnvelope,
  getTemperatureEnvelope,
  getWindEnvelope,
} from '../utils/chartSeries';
import { getWeatherDescription, getWeatherEmoji } from '../utils/weatherCodes';
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
  series: ChartSeries;
  dailyEnvelope: DailyEnvelope[];
  formatValue: (value: number) => string;
  chartFormatValue?: (value: number) => string;
  titleSuffix?: string;
};

function formatDay(dateString: string, index: number): string {
  if (index === 0) {
    return 'Hoy';
  }

  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
}

function formatPointTime(time: string, intervalHours: number): string {
  const date = new Date(time.includes('T') ? time : `${time}T12:00:00`);
  if (intervalHours >= 24) {
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
  }
  return date.toLocaleString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MetricChartBlock({
  label,
  series,
  dailyEnvelope,
  formatValue,
  chartFormatValue,
  titleSuffix,
}: MetricConfig) {
  return (
    <View style={styles.chartBlock}>
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
        />
      </View>
    </View>
  );
}

function MetricReadingsBlock({ label, series, formatValue }: Pick<MetricConfig, 'label' | 'series' | 'formatValue'>) {
  return (
    <View style={styles.readingsBlock}>
      <Text style={styles.readingsMetricTitle}>{label}</Text>
      {series.points.map((point) => (
        <View key={`${label}-${point.time}`} style={styles.readingRow}>
          <Text style={styles.readingTime}>
            {formatPointTime(point.time, series.intervalHours)}
          </Text>
          <Text style={styles.readingValue}>{formatValue(point.value)}</Text>
        </View>
      ))}
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
  if (!weather) {
    return null;
  }

  const weekSummary = getWeekSummary(weather.daily);
  const metrics: MetricConfig[] = [
    {
      label: 'Temperatura',
      series: buildTemperatureChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getTemperatureEnvelope(weather.daily),
      formatValue: (value) => `${Math.round(value)}°`,
    },
    {
      label: 'Humedad',
      series: buildHumidityChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getHumidityEnvelope(weather.daily),
      formatValue: (value) => `${Math.round(value)}%`,
    },
    {
      label: 'Viento',
      series: buildWindChartSeries(weather.hourly, weather.daily),
      dailyEnvelope: getWindEnvelope(weather.daily),
      formatValue: (value) => `${Math.round(value)} km/h`,
      chartFormatValue: (value) => `${Math.round(value)}`,
      titleSuffix: ' (km/h)',
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

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {title === 'Mi ubicación' ? (subtitle ?? title) : title}
          </Text>

          <View style={styles.currentCard}>
            <View style={styles.currentRow}>
              <Text style={styles.currentEmoji}>{getWeatherEmoji(weather.current.weatherCode)}</Text>
              <Text style={styles.currentTemp}>{Math.round(weather.current.temperature)}°</Text>
            </View>
            <Text style={styles.currentCondition}>
              {getWeatherDescription(weather.current.weatherCode)}
            </Text>
            <View style={styles.currentStats}>
              <Text style={styles.currentStat}>💧 {weather.current.humidity}%</Text>
              <Text style={styles.currentStat}>💨 {Math.round(weather.current.windSpeed)} km/h</Text>
            </View>
          </View>

          <WeekSummaryBox summary={weekSummary} large />

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

          {metrics.map((metric) => (
            <MetricChartBlock key={`chart-${metric.label}`} {...metric} />
          ))}

          {metrics.map((metric) => (
            <MetricReadingsBlock
              key={`readings-${metric.label}`}
              label={metric.label}
              series={metric.series}
              formatValue={metric.formatValue}
            />
          ))}
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
  readingsBlock: {
    marginBottom: 20,
  },
  readingsMetricTitle: {
    color: '#3D7BFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#13284D',
  },
  readingTime: {
    color: '#9BB4DE',
    fontSize: 13,
    textTransform: 'capitalize',
    flex: 1,
  },
  readingValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
