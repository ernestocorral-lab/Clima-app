import { Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, radii } from '../theme';
import { hapticLight } from '../utils/haptics';

type VisibilityToggleProps = {
  visible: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
};

export function VisibilityToggle({
  visible,
  onToggle,
  accessibilityLabel,
}: VisibilityToggleProps) {
  return (
    <Pressable
      style={[styles.button, !visible && styles.buttonOff]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        hapticLight();
        onToggle();
      }}
    >
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d="M2.036 12.322a1 1 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
          stroke={visible ? colors.accentSoft : colors.textMuted}
          strokeWidth={1.6}
          fill="none"
        />
        <Circle
          cx={12}
          cy={12}
          r={3}
          stroke={visible ? colors.accentSoft : colors.textMuted}
          strokeWidth={1.6}
          fill="none"
        />
        {!visible && (
          <Path
            d="M4 4l16 16"
            stroke={colors.textMuted}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        )}
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceInset,
    borderRadius: radii.sm,
  },
  buttonOff: {
    opacity: 0.75,
  },
});
