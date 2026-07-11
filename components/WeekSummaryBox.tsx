import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WeekSummary } from '../utils/weekSummary';
import { getTemperatureLevel, getTemperatureValueColor } from '../utils/temperatureLevel';
import { getUvIndexLevel } from '../utils/uvIndexLevel';
import { t } from '../i18n';

export type WeekSummaryScrollTarget =
  | 'temperature'
  | 'apparent'
  | 'humidity'
  | 'wind'
  | 'windGust'
  | 'precipitation'
  | 'uv'
  | 'pressure'
  | 'radiation'
  | 'visibility'
  | 'gases'
  | 'particles'
  | 'allergens';

type WeekSummaryBoxProps = {
  summary: WeekSummary;
  large?: boolean;
  onRowPress?: (target: WeekSummaryScrollTarget) => void;
};

function SummaryRow({
  label,
  value,
  dayLabel,
  valueStyle,
  valueColor,
  levelColor,
  levelLabel,
  large,
  onPress,
}: {
  label: string;
  value: string;
  dayLabel: string;
  valueStyle: object;
  valueColor?: string;
  levelColor?: string;
  levelLabel?: string;
  large: boolean;
  onPress?: () => void;
}) {
  const coloredValueStyle = valueColor ? { color: valueColor } : null;
  const coloredLevelStyle = (levelColor ?? valueColor)
    ? { color: levelColor ?? valueColor }
    : null;

  const content = (
    <>
      <Text
        style={[styles.weekLabel, large && styles.weekLabelLarge]}
        numberOfLines={large ? undefined : 1}
      >
        {label}
      </Text>
      <View style={[styles.weekValueGroup, large && styles.weekValueGroupLarge]}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={large ? 0.75 : 0.85}
          style={[
            valueStyle,
            large && styles.weekValueLarge,
            large && levelLabel && styles.weekValueLargeWithLevel,
          ]}
        >
          <Text style={coloredValueStyle}>{value}</Text>
          {levelLabel ? (
            <Text style={[large && styles.weekValueLevel, coloredLevelStyle]}>
              {' '}
              ({levelLabel})
            </Text>
          ) : null}
        </Text>
      </View>
      <Text
        style={[styles.weekDay, large && styles.weekDayLarge]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {dayLabel}
      </Text>
    </>
  );

  if (!onPress) {
    return <View style={[styles.weekRow, large && styles.weekRowLarge]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.weekRow,
        large && styles.weekRowLarge,
        pressed && styles.weekRowPressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.weekDivider} />;
}

export function WeekSummaryBox({ summary, large = false, onRowPress }: WeekSummaryBoxProps) {
  const uvLevel = getUvIndexLevel(summary.maxUvIndex.value);
  const maxTempLevel = getTemperatureLevel(summary.max.temperature);
  const apparentTempLevel = getTemperatureLevel(summary.maxApparentTemp.value);
  const minTempLevel = getTemperatureLevel(summary.min.temperature);
  const maxTempColor = getTemperatureValueColor(summary.max.temperature);
  const apparentTempColor = getTemperatureValueColor(summary.maxApparentTemp.value);
  const minTempColor = getTemperatureValueColor(summary.min.temperature);

  if (large) {
    return (
      <View style={[styles.weekBox, styles.weekBoxLarge]}>
        <SummaryRow
          label={t('summary.maxTemp')}
          value={`${Math.round(summary.max.temperature)}°`}
          dayLabel={summary.max.dayLabel}
          valueStyle={styles.weekMax}
          valueColor={maxTempColor}
          levelColor={maxTempColor}
          levelLabel={maxTempLevel ? t(`temperature.level.${maxTempLevel.key}`) : undefined}
          large={large}
          onPress={onRowPress ? () => onRowPress('temperature') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.apparent')}
          value={`${Math.round(summary.maxApparentTemp.value)}°`}
          dayLabel={summary.maxApparentTemp.dayLabel}
          valueStyle={styles.weekApparent}
          valueColor={apparentTempColor}
          levelColor={apparentTempColor}
          levelLabel={
            apparentTempLevel ? t(`temperature.level.${apparentTempLevel.key}`) : undefined
          }
          large={large}
          onPress={onRowPress ? () => onRowPress('apparent') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.minTemp')}
          value={`${Math.round(summary.min.temperature)}°`}
          dayLabel={summary.min.dayLabel}
          valueStyle={styles.weekMin}
          valueColor={minTempColor}
          levelColor={minTempColor}
          levelLabel={minTempLevel ? t(`temperature.level.${minTempLevel.key}`) : undefined}
          large={large}
          onPress={onRowPress ? () => onRowPress('temperature') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.humidity')}
          value={`${Math.round(summary.maxHumidity.value)}%`}
          dayLabel={summary.maxHumidity.dayLabel}
          valueStyle={styles.weekMetric}
          large={large}
          onPress={onRowPress ? () => onRowPress('humidity') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.wind')}
          value={`${Math.round(summary.maxWindSpeed.value)} km/h`}
          dayLabel={summary.maxWindSpeed.dayLabel}
          valueStyle={styles.weekWind}
          large={large}
          onPress={onRowPress ? () => onRowPress('wind') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.gust')}
          value={`${Math.round(summary.maxWindGust.speed)} km/h`}
          dayLabel={summary.maxWindGust.dayLabel}
          valueStyle={styles.weekWind}
          large={large}
          onPress={onRowPress ? () => onRowPress('windGust') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.precip')}
          value={`${summary.maxPrecipitation.value.toFixed(1)} mm`}
          dayLabel={summary.maxPrecipitation.dayLabel}
          valueStyle={styles.weekPrecip}
          large={large}
          onPress={onRowPress ? () => onRowPress('precipitation') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.uv')}
          value={summary.maxUvIndex.value.toFixed(1)}
          dayLabel={summary.maxUvIndex.dayLabel}
          valueStyle={styles.weekUv}
          valueColor={uvLevel.color}
          levelLabel={t(`uv.level.${uvLevel.key}`)}
          large={large}
          onPress={onRowPress ? () => onRowPress('uv') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.pressure')}
          value={`${Math.round(summary.maxPressure.value)} mbar`}
          dayLabel={summary.maxPressure.dayLabel}
          valueStyle={styles.weekMetric}
          large={large}
          onPress={onRowPress ? () => onRowPress('pressure') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.radiation')}
          value={`${Math.round(summary.maxRadiation.value)} W/m²`}
          dayLabel={summary.maxRadiation.dayLabel}
          valueStyle={styles.weekMetric}
          large={large}
          onPress={onRowPress ? () => onRowPress('radiation') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.visibility')}
          value={`${Math.round(summary.maxVisibility.value)} km`}
          dayLabel={summary.maxVisibility.dayLabel}
          valueStyle={styles.weekMetric}
          large={large}
          onPress={onRowPress ? () => onRowPress('visibility') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.gases')}
          value={`${Math.round(summary.maxGases.value)} EAQI`}
          dayLabel={summary.maxGases.dayLabel}
          valueStyle={styles.weekMetric}
          large={large}
          onPress={onRowPress ? () => onRowPress('gases') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.particles')}
          value={`${Math.round(summary.maxParticles.value)} µg/m³`}
          dayLabel={summary.maxParticles.dayLabel}
          valueStyle={styles.weekMetric}
          large={large}
          onPress={onRowPress ? () => onRowPress('particles') : undefined}
        />
        <Divider />
        <SummaryRow
          label={t('summary.allergens')}
          value={`${Math.round(summary.maxAllergens.value)} grains/m³`}
          dayLabel={summary.maxAllergens.dayLabel}
          valueStyle={styles.weekMetric}
          large={large}
          onPress={onRowPress ? () => onRowPress('allergens') : undefined}
        />
      </View>
    );
  }

  return (
    <View style={styles.weekBox}>
      <SummaryRow
        label={t('summary.maxTemp')}
        value={`${Math.round(summary.max.temperature)}°`}
        dayLabel={summary.max.dayLabel}
        valueStyle={styles.weekMax}
        valueColor={maxTempColor}
        large={large}
      />
      <Divider />
      <SummaryRow
        label={t('summary.minTemp')}
        value={`${Math.round(summary.min.temperature)}°`}
        dayLabel={summary.min.dayLabel}
        valueStyle={styles.weekMin}
        valueColor={minTempColor}
        large={large}
      />
      <Divider />
      <SummaryRow
        label="Prec."
        value={`${summary.maxPrecipitation.value.toFixed(1)} mm`}
        dayLabel={summary.maxPrecipitation.dayLabel}
        valueStyle={styles.weekPrecipTile}
        large={large}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  weekBox: {
    backgroundColor: '#13284D',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 7,
    gap: 2,
    marginTop: 4,
    marginBottom: 3,
    overflow: 'hidden',
  },
  weekBoxLarge: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    marginTop: 0,
    marginBottom: 20,
    overflow: 'hidden',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weekRowLarge: {
    gap: 6,
  },
  weekRowPressed: {
    opacity: 0.75,
  },
  weekLabel: {
    color: '#9BB4DE',
    fontSize: 11,
    fontWeight: '600',
    width: 32,
    flexShrink: 0,
  },
  weekLabelLarge: {
    fontSize: 14,
    width: 56,
    flexShrink: 0,
  },
  weekMax: {
    color: '#FF9B7A',
    fontSize: 13,
    fontWeight: '700',
  },
  weekMin: {
    color: '#7EC8FF',
    fontSize: 13,
    fontWeight: '700',
  },
  weekPrecipTile: {
    color: '#5B9BFF',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  weekWind: {
    color: '#B8E986',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  weekPrecip: {
    color: '#5B9BFF',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  weekUv: {
    color: '#FFD27A',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  weekApparent: {
    color: '#FF9B7A',
    fontSize: 13,
    fontWeight: '700',
  },
  weekMetric: {
    color: '#D8E6FF',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  weekValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  weekValueGroupLarge: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  weekValueLarge: {
    fontSize: 16,
    fontWeight: '700',
  },
  weekValueLargeWithLevel: {
    flexShrink: 1,
  },
  weekValueLevel: {
    fontSize: 16,
    fontWeight: '700',
  },
  weekDay: {
    color: '#D8E6FF',
    fontSize: 12,
    width: 52,
    flexShrink: 0,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  weekDayLarge: {
    fontSize: 14,
    width: 68,
  },
  weekDivider: {
    height: 1,
    backgroundColor: '#1A2F57',
  },
});
