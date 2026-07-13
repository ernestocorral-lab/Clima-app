import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getWidgetChartOptions, WidgetChartType } from '../utils/widgetChartData';
import { t } from '../i18n';
import { colors, fontFamily, radii } from '../theme';
import { hapticLight } from '../utils/haptics';

type TileChartPickerModalProps = {
  visible: boolean;
  selectedChartType: WidgetChartType;
  onSelect: (chartType: WidgetChartType) => void;
  onClose: () => void;
};

export function TileChartPickerModal({
  visible,
  selectedChartType,
  onSelect,
  onClose,
}: TileChartPickerModalProps) {
  const options = getWidgetChartOptions();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('tile.chartPickerTitle')}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>{t('tile.chartPickerHint')}</Text>
          <ScrollView style={styles.list}>
            {options.map((option) => {
              const selected = option.id === selectedChartType;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => {
                    hapticLight();
                    onSelect(option.id);
                    onClose();
                  }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: colors.screen,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '72%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 18,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  closeButtonText: {
    color: colors.accent,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 14,
  },
  option: {
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  optionText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
  },
  optionTextSelected: {
    color: colors.accentSoft,
  },
});
