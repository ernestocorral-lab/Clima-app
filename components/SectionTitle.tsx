import { StyleSheet, Text, TextStyle, StyleProp } from 'react-native';

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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  large: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
