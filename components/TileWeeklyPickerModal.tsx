import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TILE_WEEKLY_ROW_COUNT } from '../types/tilePreferences';
import { getWeeklyMaxRows, WeeklyMetricId } from '../utils/weatherMetrics';
import { WeekSummary } from '../utils/weekSummary';
import { t } from '../i18n';
import { colors, fontFamily, radii } from '../theme';
import { hapticLight, hapticSuccess } from '../utils/haptics';

type TileWeeklyPickerModalProps = {
  visible: boolean;
  summary: WeekSummary;
  selectedRowIds: WeeklyMetricId[];
  onSave: (rowIds: WeeklyMetricId[]) => void;
  onClose: () => void;
};

export function TileWeeklyPickerModal({
  visible,
  summary,
  selectedRowIds,
  onSave,
  onClose,
}: TileWeeklyPickerModalProps) {
  const [draftRowIds, setDraftRowIds] = useState<WeeklyMetricId[]>(selectedRowIds);
  const [activeSlot, setActiveSlot] = useState(0);
  const options = getWeeklyMaxRows(summary);

  useEffect(() => {
    if (visible) {
      setDraftRowIds(selectedRowIds);
      setActiveSlot(0);
    }
  }, [visible, selectedRowIds]);

  const handleSelectMetric = (metricId: WeeklyMetricId) => {
    hapticLight();
    setDraftRowIds((current) => {
      const next = [...current];
      const existingIndex = next.indexOf(metricId);
      if (existingIndex >= 0 && existingIndex !== activeSlot) {
        next[existingIndex] = next[activeSlot];
      }
      next[activeSlot] = metricId;
      return next;
    });
  };

  const handleSave = () => {
    hapticSuccess();
    onSave(draftRowIds);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('tile.weeklyPickerTitle')}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>{t('tile.weeklyPickerHint')}</Text>

          <View style={styles.slotsRow}>
            {Array.from({ length: TILE_WEEKLY_ROW_COUNT }, (_, index) => {
              const metricId = draftRowIds[index];
              const option = options.find((entry) => entry.id === metricId);
              const active = index === activeSlot;
              return (
                <Pressable
                  key={index}
                  style={[styles.slot, active && styles.slotActive]}
                  onPress={() => {
                    hapticLight();
                    setActiveSlot(index);
                  }}
                >
                  <Text style={styles.slotIndex}>{t('tile.weeklyLine', { n: index + 1 })}</Text>
                  <Text style={styles.slotLabel} numberOfLines={1}>
                    {option?.label ?? t('common.noData')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView style={styles.list}>
            {options.map((option) => {
              const selected = draftRowIds[activeSlot] === option.id;
              const usedElsewhere = draftRowIds.includes(option.id) && !selected;
              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.option,
                    selected && styles.optionSelected,
                    usedElsewhere && styles.optionUsed,
                  ]}
                  onPress={() => handleSelectMetric(option.id)}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionValue}>{option.value}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          </Pressable>
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
    maxHeight: '78%',
    paddingBottom: 20,
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
    marginBottom: 10,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  slot: {
    width: '48%',
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotActive: {
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  slotIndex: {
    color: colors.textMuted,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    marginBottom: 2,
  },
  slotLabel: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 14,
    maxHeight: 280,
  },
  option: {
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  optionUsed: {
    opacity: 0.72,
  },
  optionText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    flexShrink: 1,
  },
  optionTextSelected: {
    color: colors.accentSoft,
  },
  optionValue: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: 13,
  },
  saveButton: {
    marginTop: 8,
    marginHorizontal: 14,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.screen,
    fontFamily: fontFamily.bold,
    fontSize: 15,
  },
});
