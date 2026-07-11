import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radii, typography } from '../theme';
import { t } from '../i18n';

type CurrentHourScrubberProps = {
  hourOffset: number;
  maxOffset: number;
  endLabel: string;
  onChange: (offset: number) => void;
  compact?: boolean;
};

export function CurrentHourScrubber({
  hourOffset,
  maxOffset,
  endLabel,
  onChange,
  compact = false,
}: CurrentHourScrubberProps) {
  if (maxOffset <= 0) {
    return null;
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.title}>{t('detail.scrubberTitle')}</Text>
      <View style={styles.labels}>
        <Text style={styles.label}>{t('detail.scrubberNow')}</Text>
        <Text style={styles.labelActive}>
          {hourOffset === 0 ? t('detail.scrubberNow') : endLabel}
        </Text>
      </View>
      <View style={styles.trackWrap}>
        <Slider
          style={[styles.slider, compact && styles.sliderCompact]}
          minimumValue={0}
          maximumValue={maxOffset}
          step={1}
          value={hourOffset}
          onValueChange={(value) => onChange(Math.round(value))}
          minimumTrackTintColor={colors.scrubberProgress}
          maximumTrackTintColor={colors.scrubberTrack}
          thumbTintColor={colors.scrubberThumb}
        />
      </View>
      <View style={styles.labels}>
        <Text style={styles.hint}>0h</Text>
        <Text style={styles.hint}>+{maxOffset}h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    paddingTop: 4,
    alignSelf: 'stretch',
    width: '100%',
  },
  wrapCompact: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  title: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  trackWrap: {
    width: '100%',
    backgroundColor: colors.scrubberTrack,
    borderRadius: radii.sm,
    paddingHorizontal: 2,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  sliderCompact: {
    height: 28,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.textHint,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },
  labelActive: {
    color: colors.accentSoft,
    fontFamily: fontFamily.bold,
    fontSize: 12,
  },
  hint: {
    color: colors.textHint,
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
  },
});
