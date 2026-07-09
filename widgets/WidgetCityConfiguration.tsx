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
import { saveWidgetConfig, WidgetCityId } from '../storage/widgetData';
import { SavedCity } from '../types/city';
import { WIDGET_CHART_OPTIONS, WidgetChartType } from '../utils/widgetChartData';
import { getWidgetCityOptions, loadWidgetSnapshotForCity } from './loadWidgetSnapshot';
import { renderWeatherWidget } from './renderWeatherWidget';

export function WidgetCityConfiguration({
  widgetInfo,
  renderWidget,
  setResult,
}: WidgetConfigurationScreenProps) {
  const [cities, setCities] = useState<SavedCity[]>([]);
  const [step, setStep] = useState<'city' | 'chart'>('city');
  const [selectedCityId, setSelectedCityId] = useState<WidgetCityId | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    void getSavedCities().then(setCities);
  }, []);

  const cityOptions = getWidgetCityOptions(cities);
  const selectedCityLabel =
    cityOptions.find((option) => option.id === selectedCityId)?.label ?? '';

  const handleSelectCity = (cityId: WidgetCityId) => {
    setSelectedCityId(cityId);
    setStep('chart');
  };

  const handleSelectChart = async (chartType: WidgetChartType) => {
    if (!selectedCityId) {
      return;
    }

    setLoadingId(chartType);
    try {
      await saveWidgetConfig(widgetInfo.widgetId, {
        cityId: selectedCityId,
        chartType,
      });
      const snapshot = await loadWidgetSnapshotForCity(selectedCityId, { forceRefresh: true });
      renderWidget(renderWeatherWidget(snapshot, chartType, widgetInfo));
      setResult('ok');
    } finally {
      setLoadingId(null);
    }
  };

  if (step === 'chart') {
    return (
      <View style={styles.screen}>
        <Pressable onPress={() => setStep('city')} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Ciudades</Text>
        </Pressable>
        <Text style={styles.title}>Elige el gráfico</Text>
        <Text style={styles.subtitle}>
          Para {selectedCityLabel}. El widget mostrará esta métrica en el escritorio.
        </Text>

        <ScrollView contentContainerStyle={styles.list}>
          {WIDGET_CHART_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              disabled={loadingId !== null}
              onPress={() => void handleSelectChart(option.id)}
            >
              <Text style={styles.optionText}>{option.label}</Text>
              {loadingId === option.id ? (
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

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Elige una ciudad</Text>
      <Text style={styles.subtitle}>
        Después podrás elegir qué gráfico mostrar en el widget.
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {cityOptions.map((option) => (
          <Pressable
            key={option.id}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            onPress={() => handleSelectCity(option.id)}
          >
            <Text style={styles.optionText}>{option.label}</Text>
            <Text style={styles.optionChevron}>›</Text>
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
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#3D7BFF',
    fontSize: 16,
    fontWeight: '600',
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
    flex: 1,
    paddingRight: 8,
  },
  optionChevron: {
    color: '#3D7BFF',
    fontSize: 24,
    fontWeight: '600',
  },
});
