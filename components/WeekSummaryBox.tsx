import { StyleSheet, Text, View } from 'react-native';
import { WeekSummary } from '../utils/weekSummary';

type WeekSummaryBoxProps = {
  summary: WeekSummary;
  large?: boolean;
};

export function WeekSummaryBox({ summary, large = false }: WeekSummaryBoxProps) {
  return (
    <View style={[styles.weekBox, large && styles.weekBoxLarge]}>
      <View style={styles.weekRow}>
        <Text style={[styles.weekLabel, large && styles.weekLabelLarge]}>T Máx</Text>
        <Text style={[styles.weekMax, large && styles.weekValueLarge]}>
          {Math.round(summary.max.temperature)}°
        </Text>
        <Text style={[styles.weekDay, large && styles.weekDayLarge]}>{summary.max.dayLabel}</Text>
      </View>
      <View style={styles.weekDivider} />
      <View style={styles.weekRow}>
        <Text style={[styles.weekLabel, large && styles.weekLabelLarge]}>T Min</Text>
        <Text style={[styles.weekMin, large && styles.weekValueLarge]}>
          {Math.round(summary.min.temperature)}°
        </Text>
        <Text style={[styles.weekDay, large && styles.weekDayLarge]}>{summary.min.dayLabel}</Text>
      </View>
      <View style={styles.weekDivider} />
      <View style={styles.weekRow}>
        <Text style={[styles.weekLabel, large && styles.weekLabelLarge]}>Ráf.</Text>
        <Text style={[styles.weekWind, large && styles.weekWindLarge]}>
          {Math.round(summary.maxWindGust.speed)} km/h
        </Text>
        <Text style={[styles.weekDay, large && styles.weekDayLarge]}>
          {summary.maxWindGust.dayLabel}
        </Text>
      </View>
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
    marginBottom: 8,
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
  weekWind: {
    color: '#B8E986',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  weekValueLarge: {
    fontSize: 16,
    width: 40,
  },
  weekWindLarge: {
    fontSize: 15,
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
