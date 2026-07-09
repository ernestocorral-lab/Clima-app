import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WeekSummary } from '../utils/weekSummary';

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
  large,
  onPress,
}: {
  label: string;
  value: string;
  dayLabel: string;
  valueStyle: object;
  large: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={[styles.weekLabel, large && styles.weekLabelLarge]}>{label}</Text>
      <Text style={[valueStyle, large && styles.weekValueLarge]}>{value}</Text>
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
  if (large) {
    return (
      <View style={[styles.weekBox, styles.weekBoxLarge]}>
        <SummaryRow
          label="T Máx"
          value={`${Math.round(summary.max.temperature)}°`}
          dayLabel={summary.max.dayLabel}
          valueStyle={styles.weekMax}
          large={large}
          onPress={onRowPress ? () => onRowPress('temperature') : undefined}
        />
        <Divider />
        <SummaryRow
          label="Sens."
          value={`${Math.round(summary.maxApparentTemp.value)}°`}
          dayLabel={summary.maxApparentTemp.dayLabel}
          valueStyle={styles.weekApparent}
          large={large}
          onPress={onRowPress ? () => onRowPress('apparent') : undefined}
        />
        <Divider />
        <SummaryRow
          label="T Min"
          value={`${Math.round(summary.min.temperature)}°`}
          dayLabel={summary.min.dayLabel}
          valueStyle={styles.weekMin}
          large={large}
          onPress={onRowPress ? () => onRowPress('temperature') : undefined}
        />
        <Divider />
        <SummaryRow
          label="Ráf."
          value={`${Math.round(summary.maxWindGust.speed)} km/h`}
          dayLabel={summary.maxWindGust.dayLabel}
          valueStyle={styles.weekWind}
          large={large}
          onPress={onRowPress ? () => onRowPress('windGust') : undefined}
        />
        <Divider />
        <SummaryRow
          label="Prec."
          value={`${summary.maxPrecipitation.value.toFixed(1)} mm`}
          dayLabel={summary.maxPrecipitation.dayLabel}
          valueStyle={styles.weekPrecip}
          large={large}
          onPress={onRowPress ? () => onRowPress('precipitation') : undefined}
        />
        <Divider />
        <SummaryRow
          label="UV"
          value={summary.maxUvIndex.value.toFixed(1)}
          dayLabel={summary.maxUvIndex.dayLabel}
          valueStyle={styles.weekUv}
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
    color: '#7EC8FF',
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
  weekValueLarge: {
    fontSize: 16,
    width: 72,
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
