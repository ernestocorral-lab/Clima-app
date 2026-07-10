import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WeekSummary } from '../utils/weekSummary';
import { getUvIndexLevel } from '../utils/uvIndexLevel';
import { getTemperatureLevel } from '../utils/temperatureLevel';
import { t } from '../i18n';

export type WeekSummaryScrollTarget =
  | 'temperature'
  | 'apparent'
  | 'humidity'
  | 'wind'
  | 'windGust'
  | 'precipitation'
  | 'uv';

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
      <Text style={[styles.weekLabel, large && styles.weekLabelLarge]}>{label}</Text>
      <View style={[styles.weekValueGroup, large && styles.weekValueGroupLarge]}>
        <Text
          numberOfLines={1}
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
      <Text style={[styles.weekDay, large && styles.weekDayLarge]}>{dayLabel}</Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.weekRow}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.weekRow, pressed && styles.weekRowPressed]}
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

  if (large) {
    return (
      <View style={[styles.weekBox, styles.weekBoxLarge]}>
        <SummaryRow
          label={t('summary.maxTemp')}
          value={`${Math.round(summary.max.temperature)}°`}
          dayLabel={summary.max.dayLabel}
          valueStyle={styles.weekMax}
          levelColor={maxTempLevel?.color}
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
          levelColor={apparentTempLevel?.color}
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
          levelColor={minTempLevel?.color}
          levelLabel={minTempLevel ? t(`temperature.level.${minTempLevel.key}`) : undefined}
          large={large}
          onPress={onRowPress ? () => onRowPress('temperature') : undefined}
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
      </View>
    );
  }

  return (
    <View style={styles.weekBox}>
      <SummaryRow
        label="T Máx"
        value={`${Math.round(summary.max.temperature)}°`}
        dayLabel={summary.max.dayLabel}
        valueStyle={styles.weekMax}
        large={large}
      />
      <Divider />
      <SummaryRow
        label="T Min"
        value={`${Math.round(summary.min.temperature)}°`}
        dayLabel={summary.min.dayLabel}
        valueStyle={styles.weekMin}
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
  },
  weekBoxLarge: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    marginTop: 0,
    marginBottom: 20,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  weekRowPressed: {
    opacity: 0.75,
  },
  weekLabel: {
    color: '#9BB4DE',
    fontSize: 11,
    fontWeight: '600',
    width: 32,
  },
  weekLabelLarge: {
    fontSize: 14,
    width: 44,
  },
  weekMax: {
    color: '#FF9B7A',
    fontSize: 13,
    fontWeight: '700',
    width: 30,
  },
  weekMin: {
    color: '#7EC8FF',
    fontSize: 13,
    fontWeight: '700',
    width: 30,
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
    width: 30,
  },
  weekValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  weekValueGroupLarge: {
    width: 178,
    flexShrink: 0,
  },
  weekValueLarge: {
    fontSize: 16,
    width: 72,
  },
  weekValueLargeWithLevel: {
    width: 178,
    flexShrink: 0,
  },
  weekValueLevel: {
    fontSize: 16,
    fontWeight: '700',
  },
  weekDay: {
    color: '#D8E6FF',
    fontSize: 12,
    flex: 1,
    textTransform: 'capitalize',
  },
  weekDayLarge: {
    fontSize: 15,
  },
  weekDivider: {
    height: 1,
    backgroundColor: '#1A2F57',
  },
});
