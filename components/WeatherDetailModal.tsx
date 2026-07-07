import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TemperatureChart } from './TemperatureChart';
import { WeatherData } from '../services/weather';
import { buildChartSeries } from '../utils/chartSeries';
import { getWeatherDescription, getWeatherEmoji } from '../utils/weatherCodes';

import { WeekSummaryBox } from './WeekSummaryBox';
import { getWeekSummary } from '../utils/weekSummary';

type WeatherDetailModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  weather: WeatherData | null;
  showWeekSummary?: boolean;
  onClose: () => void;
};

function formatDay(dateString: string, index: number): string {
  if (index === 0) {
    return 'Hoy';
  }

  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
}

export function WeatherDetailModal({
  visible,
  title,
  subtitle,
  weather,
  showWeekSummary = false,
  onClose,
}: WeatherDetailModalProps) {
  if (!weather) {
    return null;
  }

  const series = buildChartSeries(weather.hourly, weather.daily);
  const weekSummary = getWeekSummary(weather.daily);

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

          {showWeekSummary ? <WeekSummaryBox summary={weekSummary} large /> : null}

          <Text style={styles.sectionTitle}>Temperatura — {series.intervalLabel}</Text>
          <View style={styles.chartCard}>
            <TemperatureChart series={series} daily={weather.daily} height={220} showDayLabels />
          </View>

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
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#16325F',
    borderRadius: 16,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
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
