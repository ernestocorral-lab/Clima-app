import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { WidgetConfigurationScreenProps } from 'react-native-android-widget';
import { getSavedCities } from '../storage/savedCities';
import { saveWidgetCityConfig, WidgetCityId } from '../storage/widgetData';
import { SavedCity } from '../types/city';
import { getWidgetCityOptions, loadWidgetSnapshotForCity } from './loadWidgetSnapshot';
import { renderTemperatureWidget } from './renderTemperatureWidget';

export function WidgetCityConfiguration({
  widgetInfo,
  renderWidget,
  setResult,
}: WidgetConfigurationScreenProps) {
  const [cities, setCities] = useState<SavedCity[]>([]);
  const [loadingCityId, setLoadingCityId] = useState<WidgetCityId | null>(null);

  useEffect(() => {
    void getSavedCities().then(setCities);
  }, []);

  const handleSelectCity = async (cityId: WidgetCityId) => {
    setLoadingCityId(cityId);
    try {
      await saveWidgetCityConfig(widgetInfo.widgetId, cityId);
      const snapshot = await loadWidgetSnapshotForCity(cityId);
      renderWidget(renderTemperatureWidget(snapshot, widgetInfo));
      setResult('ok');
    } finally {
      setLoadingCityId(null);
    }
  };

  const options = getWidgetCityOptions(cities);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Elige una ciudad</Text>
      <Text style={styles.subtitle}>
        El widget mostrará el gráfico de temperatura de la ciudad seleccionada.
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {options.map((option) => (
          <Pressable
            key={option.id}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            disabled={loadingCityId !== null}
            onPress={() => void handleSelectCity(option.id)}
          >
            <Text style={styles.optionText}>{option.label}</Text>
            {loadingCityId === option.id ? (
              <ActivityIndicator color="#3D7BFF" />
            ) : (
              <Text style={styles.optionChevron}>›</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1D3A',
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9BB4DE',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  option: {
    backgroundColor: '#16325F',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  optionChevron: {
    color: '#3D7BFF',
    fontSize: 24,
    fontWeight: '600',
  },
});
