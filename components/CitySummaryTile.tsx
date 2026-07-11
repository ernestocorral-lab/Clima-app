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
import { getUvIndexLevel } from '../utils/uvIndexLevel';
import { formatDataAge, formatStaleWarning } from '../utils/dataStaleness';
import { scaledFontSize, MIN_TOUCH_TARGET } from '../utils/accessibility';
import { getHourlyValueAtNow } from '../utils/widgetHourly';
import { colors } from '../theme/colors';

type CitySummaryTileProps = {
  locationId: string;
  title: string;
  subtitle?: string;
  weather: WeatherData | null;
  error?: string | null;
  fetchedAt?: string;
  fromCache?: boolean;
  onPress: () => void;
};

export function CitySummaryTile({
  locationId,
  title,
  subtitle,
  weather,
  error,
  fetchedAt,
  fromCache,
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
  const dataAgeLabel = formatDataAge(fetchedAt);
  const staleWarning = formatStaleWarning(fetchedAt);
  const tempFontSize = scaledFontSize(20, 1.25);
  const statFontSize = scaledFontSize(12, 1.2);
  const currentUv = weather
    ? getHourlyValueAtNow(weather.hourly, weather.hourly?.uvIndex) ?? 0
    : 0;
  const currentUvLevel = getUvIndexLevel(currentUv);

  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      onPress={onPress}
      disabled={!weather}
      accessibilityRole="button"
      accessibilityLabel={locationLabel}
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
              <Text style={styles.emoji}>{getWeatherEmoji(weather.current.weatherCode)}</Text>
              <Text style={[styles.metric, { fontSize: tempFontSize }]}>
                <Text style={[styles.metricValue, { color: currentTempColor, fontSize: tempFontSize }]}>
                  {Math.round(currentTemp!)}°
                </Text>
                <Text style={[styles.metricValue, { color: currentApparentColor, fontSize: tempFontSize }]}>
                  {' '}
                  ({Math.round(currentApparent!)}°)
                </Text>
              </Text>
            </View>
            <Text style={styles.condition} numberOfLines={1}>
              {getWeatherDescription(weather.current.weatherCode)}
            </Text>
            <View style={styles.statsRow}>
              <Text style={[styles.statSmall, { fontSize: statFontSize }]}>
                💧 {Math.round(weather.current.humidity)}%
              </Text>
              <Text style={[styles.statSmall, { fontSize: statFontSize }]}>
                💨 {Math.round(weather.current.windSpeed)}
              </Text>
              <Text style={[styles.statSmall, { fontSize: statFontSize }]}>
                🕶️{' '}
                <Text style={{ color: currentUvLevel.color }}>{currentUv.toFixed(1)}</Text>
              </Text>
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
    backgroundColor: colors.tile,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.tileBorder,
    padding: 8,
    minHeight: MIN_TOUCH_TARGET,
  },
  tilePressed: {
    opacity: 0.9,
  },
  locationLabel: {
    color: colors.textPrimary,
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
  dataAgeLabel: {
    color: '#7A95C4',
    fontSize: 9,
    fontWeight: '500',
  },
  dataAgeStale: {
    color: '#FFD27A',
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
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  condition: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
