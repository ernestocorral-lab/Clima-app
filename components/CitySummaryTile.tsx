import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TemperatureChart } from './TemperatureChart';
import { WeekSummaryBox } from './WeekSummaryBox';
import { WeatherData } from '../services/weather';
import { buildChartSeries, getTemperatureEnvelope } from '../utils/chartSeries';
import { getLocationLabel } from '../utils/formatCity';
import { getWeatherDescription, getWeatherEmoji } from '../utils/weatherCodes';
import { getWeekSummary } from '../utils/weekSummary';
import { t } from '../i18n';
import { formatNowLabel } from '../utils/formatWeather';
import { getTemperatureValueColor } from '../utils/temperatureLevel';

type CitySummaryTileProps = {
  locationId: string;
  title: string;
  subtitle?: string;
  weather: WeatherData | null;
  error?: string | null;
  onPress: () => void;
};

export function CitySummaryTile({
  locationId,
  title,
  subtitle,
  weather,
  error,
  onPress,
}: CitySummaryTileProps) {
  const locationLabel = getLocationLabel(locationId, title, subtitle ?? weather?.city, weather?.timezone);
  const weekSummary = weather ? getWeekSummary(weather.daily, weather.hourly) : null;
  const chartSeries = weather ? buildChartSeries(weather.hourly, weather.daily) : null;
  const currentTemp = weather?.current.temperature;
  const currentApparent = weather?.current.apparentTemperature ?? currentTemp;
  const currentTempColor =
    currentTemp !== undefined ? getTemperatureValueColor(currentTemp) : '#FFFFFF';
  const currentApparentColor =
    currentApparent !== undefined ? getTemperatureValueColor(currentApparent) : '#FFFFFF';

  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      onPress={onPress}
      disabled={!weather}
    >
      <Text style={styles.locationLabel} numberOfLines={1}>
        {locationLabel}
      </Text>

      {weather && weekSummary && chartSeries ? (
        <View style={styles.body}>
          <View style={styles.currentBlock}>
            <Text style={styles.nowLabel}>
              {formatNowLabel(weather.current.observedAt, weather.countryCodeAlpha2)}
            </Text>
            <View style={styles.currentRow}>
              <Text style={styles.emoji}>{getWeatherEmoji(weather.current.weatherCode)}</Text>
              <Text style={styles.metric}>
                <Text style={[styles.metricValue, { color: currentTempColor }]}>
                  {Math.round(currentTemp!)}°
                </Text>
                <Text style={[styles.metricValue, { color: currentApparentColor }]}>
                  {' '}
                  ({Math.round(currentApparent!)}°)
                </Text>
              </Text>
            </View>
            <Text style={styles.condition} numberOfLines={1}>
              {getWeatherDescription(weather.current.weatherCode)}
            </Text>
            <View style={styles.statsRow}>
              <Text style={styles.statSmall}>💧 {Math.round(weather.current.humidity)}%</Text>
              <Text style={styles.statSmall}>💨 {Math.round(weather.current.windSpeed)} km/h</Text>
            </View>
          </View>

          <WeekSummaryBox summary={weekSummary} />

          <View style={styles.chartSlot}>
            <TemperatureChart
              series={chartSeries}
              daily={weather.daily}
              dailyEnvelope={getTemperatureEnvelope(weather.hourly, weather.daily)}
              height={68}
              showDayLabels
              showIntervalLabel={false}
              labelFontSize={10}
              valueColorMode="temperature"
            />
          </View>
        </View>
      ) : (
        <Text style={styles.errorText} numberOfLines={3}>
          {error ?? t('common.noData')}
        </Text>
      )}
    </Pressable>
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
  nowLabel: {
    color: '#7EC8FF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
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
    fontSize: 20,
    fontWeight: '700',
  },
  metricValue: {
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
  chartSlot: {
    marginTop: -6,
    marginBottom: 0,
  },
});
