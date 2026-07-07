import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TemperatureChart } from './TemperatureChart';
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

type ChartDetailModalProps = {
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

export function ChartDetailModal({
  visible,
  title,
  subtitle,
  weather,
  onClose,
}: ChartDetailModalProps) {
  if (!weather) {
    return null;
  }

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

          {metrics.map((metric) => (
            <MetricChartBlock key={`chart-${metric.label}`} {...metric} />
          ))}

          <Text style={styles.readingsSectionTitle}>Lecturas del gráfico</Text>
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
  chartBlock: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: '#16325F',
    borderRadius: 16,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: 'visible',
  },
  readingsSectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
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
