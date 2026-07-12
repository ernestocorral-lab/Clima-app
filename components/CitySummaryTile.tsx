import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TemperatureChart } from './TemperatureChart';
import { WeekSummaryBox } from './WeekSummaryBox';
import { WeatherData } from '../services/weather';
import { buildChartSeries, getTemperatureEnvelope } from '../utils/chartSeries';
import { getLocationLabel } from '../utils/formatCity';
import { getWeatherDescription } from '../utils/weatherCodes';
import { WeatherIcon } from './WeatherIcon';
import { getWeekSummary } from '../utils/weekSummary';
import { t } from '../i18n';
import { formatNowLabel } from '../utils/formatWeather';
import { getTemperatureValueColor } from '../utils/temperatureLevel';
import { getUvIndexLevel } from '../utils/uvIndexLevel';
import { formatDataAge, formatStaleWarning } from '../utils/dataStaleness';
import { scaledFontSize, MIN_TOUCH_TARGET } from '../utils/accessibility';
import { getHourlyValueAtNow } from '../utils/widgetHourly';
import { colors, fontFamily, radii, typography } from '../theme';

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
  const tempFontSize = scaledFontSize(26, 1.25);
  const statFontSize = scaledFontSize(16, 1.2);
  const weatherIconSize = 26;
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
              <WeatherIcon code={weather.current.weatherCode} size={weatherIconSize} />
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
                ⚡{' '}
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
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    minHeight: MIN_TOUCH_TARGET,
  },
  tilePressed: {
    opacity: 0.9,
  },
  locationLabel: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 12,
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
    color: colors.accentSoft,
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  dataAgeLabel: {
    color: colors.textHint,
    fontFamily: fontFamily.medium,
    fontSize: 9,
  },
  dataAgeStale: {
    color: colors.warning,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  metric: {
    fontFamily: fontFamily.bold,
  },
  metricValue: {
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'],
  },
  statSmall: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontVariant: ['tabular-nums'],
  },
  condition: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 1,
    justifyContent: 'center',
    maxWidth: '100%',
  },
  errorText: {
    color: colors.errorText,
    fontFamily: fontFamily.medium,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
  chartSlot: {
    marginTop: -6,
    marginBottom: 0,
  },
});
