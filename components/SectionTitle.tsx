import { StyleSheet, Text, TextStyle, StyleProp } from 'react-native';
import { colors, typography } from '../theme';

type SectionTitleProps = {
  children: string;
  style?: StyleProp<TextStyle>;
  large?: boolean;
};

export function SectionTitle({ children, style, large = false }: SectionTitleProps) {
  return (
    <Text
      style={[large ? styles.large : styles.default, style]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.78}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  default: {
    color: colors.textPrimary,
    ...typography.sectionTitle,
  },
  large: {
    color: colors.textPrimary,
    ...typography.sectionTitleLarge,
  },
});
