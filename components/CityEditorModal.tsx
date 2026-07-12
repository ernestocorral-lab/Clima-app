import { useEffect, useMemo, useState } from 'react';
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
import { CityLayoutItem, CURRENT_CITY_ID } from '../types/cityLayout';
import { t } from '../i18n';
import { colors, fontFamily, radii } from '../theme';
import { getMyLocationTitle } from '../utils/formatCity';
import { hapticLight } from '../utils/haptics';
import { SectionTitle } from './SectionTitle';
import { VisibilityToggle } from './VisibilityToggle';

type CityEditorModalProps = {
  visible: boolean;
  cities: SavedCity[];
  layout: CityLayoutItem[];
  currentLocationLabel: string;
  onClose: () => void;
  onSave: (cities: SavedCity[], layout: CityLayoutItem[]) => void;
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
  layout,
  currentLocationLabel,
  onClose,
  onSave,
}: CityEditorModalProps) {
  const [draftCities, setDraftCities] = useState<SavedCity[]>(cities);
  const [draftLayout, setDraftLayout] = useState<CityLayoutItem[]>(layout);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const citiesById = useMemo(
    () => new Map(draftCities.map((city) => [city.id, city])),
    [draftCities],
  );

  useEffect(() => {
    if (visible) {
      setDraftCities(cities);
      setDraftLayout(layout);
      setActiveSlotId(null);
      setSearchText('');
      setResults([]);
    }
  }, [visible, cities, layout]);

  useEffect(() => {
    if (activeSlotId === null || activeSlotId === CURRENT_CITY_ID) {
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
  }, [searchText, activeSlotId]);

  const getSlotLabel = (item: CityLayoutItem): string => {
    if (item.id === CURRENT_CITY_ID) {
      return getMyLocationTitle();
    }

    return citiesById.get(item.id)?.label ?? t('common.noData');
  };

  const getSlotSubtitle = (item: CityLayoutItem): string | null => {
    if (item.id === CURRENT_CITY_ID) {
      return currentLocationLabel || null;
    }
    return null;
  };

  const selectCity = (cityId: string, result: CitySearchResult) => {
    setDraftCities((current) =>
      current.map((city) => (city.id === cityId ? toSavedCity(city.id, result) : city)),
    );
    setActiveSlotId(null);
    setSearchText('');
    setResults([]);
  };

  const moveCity = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draftLayout.length) {
      return;
    }

    hapticLight();
    const updated = [...draftLayout];
    [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];
    setDraftLayout(updated);

    const activeId = activeSlotId;
    if (activeId === updated[nextIndex].id) {
      setActiveSlotId(updated[index].id);
    } else if (activeId === updated[index].id) {
      setActiveSlotId(updated[nextIndex].id);
    }
  };

  const toggleVisibility = (cityId: string) => {
    setDraftLayout((current) =>
      current.map((item) =>
        item.id === cityId ? { ...item, visible: !item.visible } : item,
      ),
    );
  };

  const activeSlotIndex =
    activeSlotId === null ? null : draftLayout.findIndex((item) => item.id === activeSlotId);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <SectionTitle large style={styles.title}>
          {t('cities.editorTitle')}
        </SectionTitle>
        <Text style={styles.hint}>{t('cities.editorHint')}</Text>

        {draftLayout.map((item, index) => {
          const isGps = item.id === CURRENT_CITY_ID;
          const subtitle = getSlotSubtitle(item);

          return (
            <View key={item.id} style={styles.slotRow}>
              <VisibilityToggle
                visible={item.visible}
                accessibilityLabel={
                  item.visible ? t('cities.hideCity') : t('cities.showCity')
                }
                onToggle={() => toggleVisibility(item.id)}
              />
              <Pressable
                style={[
                  styles.slot,
                  !item.visible && styles.slotHidden,
                  activeSlotId === item.id && styles.slotActive,
                ]}
                disabled={isGps}
                onPress={() => {
                  setActiveSlotId(item.id);
                  setSearchText('');
                  setResults([]);
                }}
              >
                <Text style={styles.slotLabel}>
                  {isGps ? getSlotLabel(item) : t('cities.savedCity')}
                </Text>
                <Text style={styles.slotCity} numberOfLines={1}>
                  {isGps ? subtitle ?? t('cities.gpsPending') : getSlotLabel(item)}
                </Text>
                {isGps && (
                  <Text style={styles.slotGpsHint}>{t('cities.gpsHint')}</Text>
                )}
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
                    index === draftLayout.length - 1 && styles.slotActionDisabled,
                  ]}
                  disabled={index === draftLayout.length - 1}
                  onPress={() => moveCity(index, 1)}
                >
                  <Text style={styles.slotActionText}>↓</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {activeSlotId !== null && activeSlotId !== CURRENT_CITY_ID && activeSlotIndex !== null && (
          <View style={styles.searchBox}>
            <SectionTitle style={styles.searchTitle}>
              {t('cities.searchCity', { name: getSlotLabel(draftLayout[activeSlotIndex]) })}
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
                  onPress={() => selectCity(activeSlotId, item)}
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
              onSave(draftCities, draftLayout);
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
  slotHidden: {
    opacity: 0.55,
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
  slotGpsHint: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 6,
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
