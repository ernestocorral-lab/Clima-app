import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CitySearchResult, searchCities } from '../services/weather';
import { SavedCity } from '../types/city';
import { t } from '../i18n';
import { colors, fontFamily, radii } from '../theme';
import { hapticLight } from '../utils/haptics';
import { SectionTitle } from './SectionTitle';

type CityEditorModalProps = {
  visible: boolean;
  cities: SavedCity[];
  onClose: () => void;
  onSave: (cities: SavedCity[]) => void;
};

function formatCityLabel(result: CitySearchResult): string {
  if (result.admin1) {
    return `${result.name}, ${result.admin1}`;
  }
  return `${result.name}, ${result.country}`;
}

function toSavedCity(id: string, result: CitySearchResult): SavedCity {
  const label = formatCityLabel(result);
  return {
    id,
    label,
    query: label,
    latitude: result.latitude,
    longitude: result.longitude,
    countryCodeAlpha2: result.countryCodeAlpha2,
  };
}

export function CityEditorModal({
  visible,
  cities,
  onClose,
  onSave,
}: CityEditorModalProps) {
  const [draft, setDraft] = useState<SavedCity[]>(cities);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(cities);
      setActiveSlot(null);
      setSearchText('');
      setResults([]);
    }
  }, [visible, cities]);

  useEffect(() => {
    if (activeSlot === null) {
      return;
    }

    const timeout = setTimeout(async () => {
      if (searchText.trim().length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const found = await searchCities(searchText);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchText, activeSlot]);

  const selectCity = (slotIndex: number, result: CitySearchResult) => {
    const updated = [...draft];
    updated[slotIndex] = toSavedCity(draft[slotIndex].id, result);
    setDraft(updated);
    setActiveSlot(null);
    setSearchText('');
    setResults([]);
  };

  const moveCity = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.length) {
      return;
    }

    hapticLight();
    const updated = [...draft];
    [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];
    setDraft(updated);

    if (activeSlot === index) {
      setActiveSlot(nextIndex);
    } else if (activeSlot === nextIndex) {
      setActiveSlot(index);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <SectionTitle large style={styles.title}>
          {t('cities.editorTitle')}
        </SectionTitle>
        <Text style={styles.hint}>{t('cities.editorHint')}</Text>

        {draft.map((city, index) => (
          <View key={city.id} style={styles.slotRow}>
            <Pressable
              style={[styles.slot, activeSlot === index && styles.slotActive]}
              onPress={() => {
                setActiveSlot(index);
                setSearchText('');
                setResults([]);
              }}
            >
              <Text style={styles.slotLabel}>{t('cities.citySlot', { n: index + 1 })}</Text>
              <Text style={styles.slotCity} numberOfLines={1}>
                {city.label}
              </Text>
            </Pressable>
            <View style={styles.slotActions}>
              <Pressable
                style={[styles.slotActionButton, index === 0 && styles.slotActionDisabled]}
                disabled={index === 0}
                onPress={() => moveCity(index, -1)}
              >
                <Text style={styles.slotActionText}>↑</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.slotActionButton,
                  index === draft.length - 1 && styles.slotActionDisabled,
                ]}
                disabled={index === draft.length - 1}
                onPress={() => moveCity(index, 1)}
              >
                <Text style={styles.slotActionText}>↓</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {activeSlot !== null && (
          <View style={styles.searchBox}>
            <SectionTitle style={styles.searchTitle}>
              {t('cities.searchCity', { n: activeSlot + 1 })}
            </SectionTitle>
            <TextInput
              style={styles.input}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t('cities.searchPlaceholder')}
              placeholderTextColor={colors.textHint}
              autoFocus
            />

            {searching && <ActivityIndicator color={colors.accent} style={styles.loader} />}

            <FlatList
              data={results}
              keyExtractor={(item) => `${item.name}-${item.latitude}-${item.longitude}`}
              keyboardShouldPersistTaps="handled"
              style={styles.resultsList}
              ListEmptyComponent={
                searchText.trim().length >= 2 && !searching ? (
                  <Text style={styles.emptyText}>{t('cities.noResults')}</Text>
                ) : null
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.resultRow}
                  onPress={() => selectCity(activeSlot, item)}
                >
                  <Text style={styles.resultName}>{formatCityLabel(item)}</Text>
                  <Text style={styles.resultCountry}>{item.country}</Text>
                </Pressable>
              )}
            />
          </View>
        )}

        <View style={styles.actions}>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            style={styles.saveButton}
            onPress={() => {
              onSave(draft);
              onClose();
            }}
          >
            <Text style={styles.saveText}>{t('common.save')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screen,
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    marginBottom: 4,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    marginBottom: 20,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginBottom: 12,
  },
  slot: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotActive: {
    borderColor: colors.accent,
  },
  slotLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    marginBottom: 4,
  },
  slotCity: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
  },
  slotActions: {
    justifyContent: 'center',
    gap: 6,
  },
  slotActionButton: {
    backgroundColor: colors.surfaceInset,
    borderRadius: radii.sm,
    minWidth: 44,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  slotActionDisabled: {
    opacity: 0.35,
  },
  slotActionText: {
    color: colors.accentSoft,
    fontFamily: fontFamily.bold,
    fontSize: 13,
  },
  searchBox: {
    flex: 1,
    backgroundColor: colors.cardElevated,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 16,
  },
  searchTitle: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.screen,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    marginBottom: 8,
  },
  loader: {
    marginVertical: 8,
  },
  resultsList: {
    flex: 1,
  },
  resultRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  resultName: {
    color: colors.textPrimary,
    fontFamily: fontFamily.medium,
    fontSize: 16,
  },
  resultCountry: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceInset,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: colors.textOnAccent,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },
});
