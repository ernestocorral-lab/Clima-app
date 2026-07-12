import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { colors, fontFamily, radii } from '../theme';

type HintBannerProps = {
  message: string;
  onDismiss: () => void;
  onAction?: () => void;
  actionLabel?: string;
};

export function HintBanner({ message, onDismiss, onAction, actionLabel }: HintBannerProps) {
  return (
    <View style={styles.banner}>
      <Pressable
        style={({ pressed }) => [styles.messageArea, pressed && onAction && styles.messagePressed]}
        onPress={onAction}
        disabled={!onAction}
      >
        <Text style={styles.message}>{message}</Text>
      </Pressable>
      <Pressable style={styles.dismissButton} onPress={onDismiss} hitSlop={8}>
        <Text style={styles.dismissText}>{actionLabel ?? t('hints.dismiss')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accentMuted,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 6,
  },
  messageArea: {
    flex: 1,
  },
  messagePressed: {
    opacity: 0.85,
  },
  message: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  dismissButton: {
    alignSelf: 'flex-end',
  },
  dismissText: {
    color: colors.accentSoft,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },
});
