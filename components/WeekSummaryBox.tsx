import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WeekSummary } from '../utils/weekSummary';
import { getTemperatureValueColor } from '../utils/temperatureLevel';
import {
  getWeeklyMaxRows,
  MetricScrollTarget,
  WeeklyMaxRow,
} from '../utils/weatherMetrics';
import { t } from '../i18n';
import { colors, fontFamily } from '../theme';
import { WEEK_SUMMARY_TILE_LAYOUT } from '../utils/weekSummaryTileLayout';

export type WeekSummaryScrollTarget = MetricScrollTarget;

type WeekSummaryBoxProps = {
  summary: WeekSummary;
  large?: boolean;
  expanded?: boolean;
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
        adjustsFontSizeToFit={!large}
        minimumFontScale={large ? undefined : WEEK_SUMMARY_TILE_LAYOUT.labelMinScale}
      >
        {label}
      </Text>
      <View style={[styles.weekValueGroup, large && styles.weekValueGroupLarge]}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={
            large ? 0.75 : WEEK_SUMMARY_TILE_LAYOUT.valueMinScale
          }
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
        adjustsFontSizeToFit={!large}
        minimumFontScale={large ? undefined : WEEK_SUMMARY_TILE_LAYOUT.dayMinScale}
        ellipsizeMode={large ? 'tail' : undefined}
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
        styles.touchTarget,
      ]}
    >
      {content}
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.weekDivider} />;
}

function rowValueStyle(row: WeeklyMaxRow, large: boolean) {
  if (row.id === 'maxTemp') return styles.weekMax;
  if (row.id === 'minTemp') return styles.weekMin;
  if (row.id === 'apparent') return styles.weekApparent;
  if (row.id === 'wind' || row.id === 'gust') return styles.weekWind;
  if (row.id === 'precip') return large ? styles.weekPrecip : styles.weekPrecipTile;
  if (row.id === 'uv') return styles.weekUv;
  return styles.weekMetric;
}

function renderWeeklyRow(
  row: WeeklyMaxRow,
  large: boolean,
  onRowPress?: (target: WeekSummaryScrollTarget) => void,
) {
  return (
    <SummaryRow
      key={row.id}
      label={row.label}
      value={row.value}
      dayLabel={row.dayLabel}
      valueStyle={rowValueStyle(row, large)}
      valueColor={row.valueColor}
      levelColor={row.levelColor}
      levelLabel={row.levelLabel}
      large={large}
      onPress={
        onRowPress && row.scrollKey ? () => onRowPress(row.scrollKey!) : undefined
      }
    />
  );
}

export function WeekSummaryBox({
  summary,
  large = false,
  expanded = true,
  onRowPress,
}: WeekSummaryBoxProps) {
  const maxTempColor = getTemperatureValueColor(summary.max.temperature);
  const minTempColor = getTemperatureValueColor(summary.min.temperature);
  const maxApparentColor = getTemperatureValueColor(summary.maxApparentTemp.value);

  if (large) {
    const rows = getWeeklyMaxRows(summary, { essentialOnly: !expanded });
    return (
      <View style={[styles.weekBox, styles.weekBoxLarge]}>
        {rows.map((row, index) => (
          <View key={row.id}>
            {index > 0 ? <Divider /> : null}
            {renderWeeklyRow(row, large, onRowPress)}
          </View>
        ))}
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
        label={t('summary.apparent')}
        value={`(${Math.round(summary.maxApparentTemp.value)}°)`}
        dayLabel={summary.maxApparentTemp.dayLabel}
        valueStyle={styles.weekApparent}
        valueColor={maxApparentColor}
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
        label={t('summary.precip')}
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
    backgroundColor: colors.card,
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
  touchTarget: {
    minHeight: 44,
  },
  weekLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    fontWeight: '600',
    width: WEEK_SUMMARY_TILE_LAYOUT.labelWidth,
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
    flexShrink: 1,
  },
  weekMin: {
    color: colors.accentSoft,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  weekPrecipTile: {
    color: colors.accentMuted,
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
    color: colors.accentMuted,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  weekUv: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  weekApparent: {
    color: '#FF9B7A',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  weekMetric: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  weekValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    color: colors.textSecondary,
    fontSize: 12,
    width: WEEK_SUMMARY_TILE_LAYOUT.dayWidth,
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
    backgroundColor: colors.borderSubtle,
  },
});
