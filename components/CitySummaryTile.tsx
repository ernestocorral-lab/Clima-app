import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TemperatureChart } from './TemperatureChart';
import { WeekSummaryBox } from './WeekSummaryBox';
import { WeatherData } from '../services/weather';
import { buildChartSeries } from '../utils/chartSeries';
import { getLocationLabel } from '../utils/formatCity';
import { getWeatherDescription, getWeatherEmoji } from '../utils/weatherCodes';
import { getWeekSummary } from '../utils/weekSummary';

type CitySummaryTileProps = {
  title: string;
  subtitle?: string;
  weather: WeatherData | null;
  error?: string | null;
  onPress: () => void;
  onChartPress: () => void;
};

export function CitySummaryTile({
  title,
  subtitle,
  weather,
  error,
  onPress,
  onChartPress,
}: CitySummaryTileProps) {
  const locationLabel = getLocationLabel(title, subtitle);
  const weekSummary = weather ? getWeekSummary(weather.daily) : null;
  const chartSeries = weather ? buildChartSeries(weather.hourly, weather.daily) : null;

  return (
    <View style={styles.tile}>
      <Pressable
        style={({ pressed }) => [styles.tapArea, pressed && styles.tilePressed]}
        onPress={onPress}
        disabled={!weather}
      >
        <Text style={styles.locationLabel} numberOfLines={1}>
          {locationLabel}
        </Text>

        {weather && weekSummary && chartSeries ? (
          <View style={styles.body}>
            <View style={styles.currentBlock}>
              <View style={styles.currentRow}>
                <Text style={styles.emoji}>{getWeatherEmoji(weather.current.weatherCode)}</Text>
                <Text style={styles.metric}>{Math.round(weather.current.temperature)}°</Text>
              </View>
              <Text style={styles.condition} numberOfLines={1}>
                {getWeatherDescription(weather.current.weatherCode)}
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.statSmall}>💧 {weather.current.humidity}%</Text>
                <Text style={styles.statSmall}>💨 {Math.round(weather.current.windSpeed)} km/h</Text>
              </View>
            </View>

            <WeekSummaryBox summary={weekSummary} />
          </View>
        ) : (
          <Text style={styles.errorText} numberOfLines={3}>
            {error ?? 'Sin datos'}
          </Text>
        )}
      </Pressable>

      {weather && chartSeries && (
        <TemperatureChart
          series={chartSeries}
          daily={weather.daily}
          height={68}
          showDayLabels
          showIntervalLabel={false}
          onPress={onChartPress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: '#16325F',
    borderRadius: 16,
    padding: 8,
    minHeight: 0,
  },
  tapArea: {
    flex: 1,
  },
  tilePressed: {
    opacity: 0.9,
  },
  locationLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  body: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 4,
  },
  currentBlock: {
    alignItems: 'center',
    gap: 1,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 18,
  },
  metric: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  statSmall: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  condition: {
    color: '#C7D7F2',
    fontSize: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
    justifyContent: 'center',
  },
  errorText: {
    color: '#FFD1D1',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
});
