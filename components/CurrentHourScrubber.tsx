import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
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
          minimumTrackTintColor="#3D7BFF"
          maximumTrackTintColor="#FFFFFF"
          thumbTintColor="#7EC8FF"
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
    borderTopColor: '#1A2F57',
  },
  title: {
    color: '#C7D7F2',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  trackWrap: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
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
    color: '#7A95C4',
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    color: '#7EC8FF',
    fontSize: 12,
    fontWeight: '700',
  },
  hint: {
    color: '#5A7399',
    fontSize: 10,
    fontWeight: '600',
  },
});
