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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('cities.editorTitle')}</Text>
        <Text style={styles.hint}>{t('cities.editorHint')}</Text>

        {draft.map((city, index) => (
          <Pressable
            key={city.id}
            style={[styles.slot, activeSlot === index && styles.slotActive]}
            onPress={() => {
              setActiveSlot(index);
              setSearchText('');
              setResults([]);
            }}
          >
            <Text style={styles.slotLabel}>{t('cities.citySlot', { n: index + 1 })}</Text>
            <Text style={styles.slotCity}>{city.label}</Text>
          </Pressable>
        ))}

        {activeSlot !== null && (
          <View style={styles.searchBox}>
            <Text style={styles.searchTitle}>{t('cities.searchCity', { n: activeSlot + 1 })}</Text>
            <TextInput
              style={styles.input}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t('cities.searchPlaceholder')}
              placeholderTextColor="#7A94BF"
              autoFocus
            />

            {searching && <ActivityIndicator color="#3D7BFF" style={styles.loader} />}

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
    backgroundColor: '#0B1D3A',
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  hint: {
    color: '#9BB4DE',
    fontSize: 14,
    marginBottom: 20,
  },
  slot: {
    backgroundColor: '#16325F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotActive: {
    borderColor: '#3D7BFF',
  },
  slotLabel: {
    color: '#9BB4DE',
    fontSize: 13,
    marginBottom: 4,
  },
  slotCity: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  searchBox: {
    flex: 1,
    backgroundColor: '#13284D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  searchTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#0B1D3A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
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
    borderBottomColor: '#1A2F57',
  },
  resultName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  resultCountry: {
    color: '#9BB4DE',
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    color: '#9BB4DE',
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
    backgroundColor: '#1A2F57',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#C7D7F2',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3D7BFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
