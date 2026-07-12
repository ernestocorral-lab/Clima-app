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
import { getCityLayout } from '../storage/cityLayout';
import { saveWidgetConfig, WidgetCityId } from '../storage/widgetData';
import { SavedCity } from '../types/city';
import { CityLayoutItem, buildDefaultCityLayout } from '../types/cityLayout';
import { getWidgetChartOptions, WidgetChartType } from '../utils/widgetChartData';
import { t } from '../i18n';
import { colors, fontFamily, radii } from '../theme';
import { hapticSuccess } from '../utils/haptics';
import { getWidgetCityOptions, loadWidgetSnapshotForCity } from './loadWidgetSnapshot';
import {
  isCitySummaryWidgetName,
  isMetricWidgetName,
} from './metricWidgetRegistry';
import { renderWidgetInstance } from './renderWidgetInstance';

export function WidgetCityConfiguration({
  widgetInfo,
  renderWidget,
  setResult,
}: WidgetConfigurationScreenProps) {
  const [cities, setCities] = useState<SavedCity[]>([]);
  const [cityLayout, setCityLayout] = useState<CityLayoutItem[]>(
    buildDefaultCityLayout(['city-1', 'city-2', 'city-3']),
  );
  const [step, setStep] = useState<'city' | 'chart'>('city');
  const [selectedCityId, setSelectedCityId] = useState<WidgetCityId | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const isMetricWidget = isMetricWidgetName(widgetInfo.widgetName);
  const isCitySummaryWidget = isCitySummaryWidgetName(widgetInfo.widgetName);

  useEffect(() => {
    void (async () => {
      const savedCities = await getSavedCities();
      const layout = await getCityLayout(savedCities);
      setCities(savedCities);
      setCityLayout(layout);
    })();
  }, []);

  const cityOptions = getWidgetCityOptions(cities, cityLayout);
  const selectedCityLabel =
    cityOptions.find((option) => option.id === selectedCityId)?.label ?? '';

  const saveAndRender = async (cityId: WidgetCityId, chartType: WidgetChartType) => {
    await saveWidgetConfig(widgetInfo.widgetId, {
      cityId,
      chartType,
      configured: true,
      widgetName: widgetInfo.widgetName,
    });
    const snapshot = await loadWidgetSnapshotForCity(cityId, {
      forceRefresh: true,
      chartType,
      requireSummary: isCitySummaryWidget,
    });
    renderWidget(renderWidgetInstance(snapshot, chartType, widgetInfo));
    hapticSuccess();
    setResult('ok');
  };

  const handleSelectCity = (cityId: WidgetCityId) => {
    if (isCitySummaryWidget) {
      setLoadingId(cityId);
      void saveAndRender(cityId, 'temperature').finally(() => setLoadingId(null));
      return;
    }

    setSelectedCityId(cityId);
    setStep('chart');
  };

  const handleSelectChart = async (chartType: WidgetChartType) => {
    if (!selectedCityId) {
      return;
    }

    setLoadingId(chartType);
    try {
      await saveAndRender(selectedCityId, chartType);
    } finally {
      setLoadingId(null);
    }
  };

  if (step === 'chart') {
    return (
      <View style={styles.screen}>
        <Pressable onPress={() => setStep('city')} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t('widget.backCities')}</Text>
        </Pressable>
        <Text style={styles.title}>
          {isMetricWidget ? t('widget.chooseMetric') : t('widget.chooseChart')}
        </Text>
        <Text style={styles.subtitle}>
          {isMetricWidget
            ? t('widget.chooseMetricHint', { city: selectedCityLabel })
            : t('widget.chooseChartHint', { city: selectedCityLabel })}
        </Text>

        <ScrollView contentContainerStyle={styles.list}>
          {getWidgetChartOptions().map((option) => (
            <Pressable
              key={option.id}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              disabled={loadingId !== null}
              onPress={() => void handleSelectChart(option.id)}
            >
              <Text style={styles.optionText}>{option.label}</Text>
              {loadingId === option.id ? (
                <ActivityIndicator color={colors.accent} />
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
      <Text style={styles.title}>{t('widget.chooseCityTitle')}</Text>
      <Text style={styles.subtitle}>
        {isCitySummaryWidget
          ? t('widget.chooseCitySummaryHint')
          : isMetricWidget
            ? t('widget.chooseCityMetricHint')
            : t('widget.chooseCityHint')}
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {cityOptions.map((option) => (
          <Pressable
            key={option.id}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            disabled={loadingId !== null}
            onPress={() => handleSelectCity(option.id)}
          >
            <Text style={styles.optionText}>{option.label}</Text>
            {loadingId === option.id ? (
              <ActivityIndicator color={colors.accent} />
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
    backgroundColor: colors.screen,
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: colors.accent,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  option: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
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
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 17,
    flex: 1,
    paddingRight: 8,
  },
  optionChevron: {
    color: colors.accent,
    fontFamily: fontFamily.semiBold,
    fontSize: 24,
  },
});
