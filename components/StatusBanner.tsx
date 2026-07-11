import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppStatusTone } from '../utils/appStatus';
import { t } from '../i18n';

type StatusBannerProps = {
  message: string;
  tone: AppStatusTone;
  onPress?: () => void;
};

export function StatusBanner({ message, tone, onPress }: StatusBannerProps) {
  const banner = (
    <View style={[styles.banner, tone === 'offline' ? styles.offline : styles.stale]}>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      {onPress ? <Text style={styles.action}>{t('banner.tapToRefresh')}</Text> : null}
    </View>
  );

  if (!onPress) {
    return banner;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${message}. ${t('banner.tapToRefresh')}`}
    >
      {banner}
    </Pressable>
  );
}

export function StatusBadge({ tone }: { tone: AppStatusTone }) {
  return (
    <View
      style={[styles.badge, tone === 'offline' ? styles.badgeOffline : styles.badgeStale]}
      accessibilityLabel={tone === 'offline' ? t('banner.offlineBadge') : t('banner.staleBadge')}
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  offline: {
    backgroundColor: '#1A2840',
    borderColor: '#3D5A8C',
  },
  stale: {
    backgroundColor: '#2A2418',
    borderColor: '#6B5420',
  },
  message: {
    color: '#E8F0FF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  action: {
    color: '#7EC8FF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  pressed: {
    opacity: 0.88,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginRight: 4,
  },
  badgeOffline: {
    backgroundColor: '#7EC8FF',
  },
  badgeStale: {
    backgroundColor: '#FFD27A',
  },
});
