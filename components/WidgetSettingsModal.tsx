import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { getWidgetInfo, type WidgetInfo } from 'react-native-android-widget';
import { getSavedCities } from '../storage/savedCities';
import {
  getRefreshIntervalKey,
  REFRESH_INTERVAL_OPTIONS,
  RefreshIntervalKey,
  setRefreshIntervalKey,
} from '../storage/appSettings';
import { getWidgetConfig, WidgetCityId } from '../storage/widgetData';
import { SavedCity } from '../types/city';
import { getWidgetChartOptions, WidgetChartType } from '../utils/widgetChartData';
import {
  ALL_WIDGET_NAMES,
  isMetricWidgetName,
  resolveWidgetChartType,
} from '../widgets/metricWidgetRegistry';
import { getWidgetCityOptions } from '../widgets/loadWidgetSnapshot';
import { getChartLabel, updateWidgetConfig } from '../widgets/syncTemperatureWidget';
import { t } from '../i18n';
import { colors, fontFamily, radii } from '../theme';
import { hapticLight, hapticSuccess } from '../utils/haptics';
import { SectionTitle } from './SectionTitle';

type WidgetSettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectWidget?: (cityId: WidgetCityId, chartType: WidgetChartType) => void;
};

type WidgetListEntry = WidgetInfo & {
  cityId: WidgetCityId;
  chartType: WidgetChartType;
  isMetric: boolean;
};

function getWidgetDisplayLabel(widget: WidgetListEntry): string {
  if (widget.isMetric) {
    return t('widget.metricLabel');
  }

  return t('widget.label');
}

function isPlacedHomeScreenWidget(info: WidgetInfo): boolean {
  return info.widgetId > 0 && info.width > 0 && info.height > 0;
}

export function WidgetSettingsModal({ visible, onClose, onSelectWidget }: WidgetSettingsModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [cities, setCities] = useState<SavedCity[]>([]);
  const [widgets, setWidgets] = useState<WidgetListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<WidgetCityId | null>(null);
  const [step, setStep] = useState<'city' | 'chart'>('city');
  const [savingChartType, setSavingChartType] = useState<WidgetChartType | null>(null);
  const [refreshIntervalKey, setRefreshIntervalKeyState] = useState<RefreshIntervalKey>('30');

  const loadWidgets = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setWidgets([]);
      return;
    }

    setLoading(true);
    try {
      const savedCities = await getSavedCities();
      setCities(savedCities);
      setRefreshIntervalKeyState(await getRefreshIntervalKey());

      const widgetGroups = await Promise.all(ALL_WIDGET_NAMES.map((widgetName) => getWidgetInfo(widgetName)));
      const widgetInfos = widgetGroups.flat().filter(isPlacedHomeScreenWidget);

      const entries = (
        await Promise.all(
          widgetInfos.map(async (info) => {
            const config = await getWidgetConfig(info.widgetId);
            if (!config) {
              return null;
            }

            return {
              ...info,
              cityId: config.cityId,
              chartType: resolveWidgetChartType(info.widgetName, config.chartType),
              isMetric: isMetricWidgetName(info.widgetName),
            };
          }),
        )
      ).filter((entry): entry is WidgetListEntry => entry !== null);
      setWidgets(entries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setEditingWidgetId(null);
      setSelectedCityId(null);
      setStep('city');
      void loadWidgets();
    }
  }, [visible, loadWidgets]);

  const cityOptions = getWidgetCityOptions(cities);
  const cityLabel = (cityId: WidgetCityId) =>
    cityOptions.find((option) => option.id === cityId)?.label ?? cityId;

  const handleStartEdit = (widgetId: number, cityId: WidgetCityId) => {
    setEditingWidgetId(widgetId);
    setSelectedCityId(cityId);
    setStep('city');
  };

  const handleSelectCity = (cityId: WidgetCityId) => {
    setSelectedCityId(cityId);
    setStep('chart');
  };

  const handleSelectChart = async (chartType: WidgetChartType) => {
    const editingWidget = widgets.find((widget) => widget.widgetId === editingWidgetId);
    if (!editingWidget || !selectedCityId) {
      return;
    }

    setSavingChartType(chartType);
    try {
      await updateWidgetConfig(editingWidget.widgetName, editingWidget.widgetId, {
        cityId: selectedCityId,
        chartType,
      });
      hapticSuccess();
      setEditingWidgetId(null);
      setSelectedCityId(null);
      setStep('city');
      await loadWidgets();
    } finally {
      setSavingChartType(null);
    }
  };

  const handleSelectRefreshInterval = async (key: RefreshIntervalKey) => {
    await setRefreshIntervalKey(key);
    setRefreshIntervalKeyState(key);
    hapticLight();
  };

  const refreshIntervalTitle =
    windowWidth < 360 ? t('settings.refreshIntervalShort') : t('settings.refreshInterval');

  const refreshIntervalLabel = (key: RefreshIntervalKey) => {
    if (key === '15') return t('settings.refresh15');
    if (key === '60') return t('settings.refresh60');
    return t('settings.refresh30');
  };

  const editingWidget = widgets.find((widget) => widget.widgetId === editingWidgetId);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('widget.settingsTitle')}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </Pressable>
          </View>

          {Platform.OS !== 'android' ? (
            <Text style={styles.helperText}>{t('widget.androidOnly')}</Text>
          ) : loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : editingWidget ? (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {step === 'city' ? (
                <>
                  <SectionTitle style={styles.sectionTitle}>{t('widget.chooseCity')}</SectionTitle>
                  {cityOptions.map((option) => (
                    <Pressable
                      key={option.id}
                      style={styles.optionRow}
                      onPress={() => handleSelectCity(option.id)}
                    >
                      <Text style={styles.optionText}>{option.label}</Text>
                    </Pressable>
                  ))}
                </>
              ) : (
                <>
                  <Pressable style={styles.backRow} onPress={() => setStep('city')}>
                    <Text style={styles.backText}>{t('widget.backToCities')}</Text>
                  </Pressable>
                  <SectionTitle style={styles.sectionTitle}>
                    {editingWidget.isMetric
                      ? t('widget.chooseMetricHint', {
                          city: cityLabel(selectedCityId ?? editingWidget.cityId),
                        })
                      : t('widget.chartFor', {
                          city: cityLabel(selectedCityId ?? editingWidget.cityId),
                        })}
                  </SectionTitle>
                  {getWidgetChartOptions().map((option) => (
                    <Pressable
                      key={option.id}
                      style={styles.optionRow}
                      onPress={() => void handleSelectChart(option.id)}
                      disabled={savingChartType !== null}
                    >
                      <Text style={styles.optionText}>{option.label}</Text>
                      {savingChartType === option.id && (
                        <ActivityIndicator size="small" color={colors.accent} />
                      )}
                    </Pressable>
                  ))}
                </>
              )}
            </ScrollView>
          ) : widgets.length === 0 ? (
            <Text style={styles.helperText}>{t('widget.empty')}</Text>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <SectionTitle style={styles.sectionTitle}>{refreshIntervalTitle}</SectionTitle>
              <View style={styles.refreshRow}>
                {REFRESH_INTERVAL_OPTIONS.map((option) => (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.refreshOption,
                      refreshIntervalKey === option.key && styles.refreshOptionActive,
                    ]}
                    onPress={() => void handleSelectRefreshInterval(option.key)}
                  >
                    <Text
                      style={[
                        styles.refreshOptionText,
                        refreshIntervalKey === option.key && styles.refreshOptionTextActive,
                      ]}
                    >
                      {refreshIntervalLabel(option.key)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {widgets.map((widget) => (
                <View key={`${widget.widgetName}-${widget.widgetId}`} style={styles.widgetCard}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.widgetCardBody,
                      pressed && styles.widgetCardPressed,
                    ]}
                    onPress={() => {
                      hapticLight();
                      onSelectWidget?.(widget.cityId, widget.chartType);
                    }}
                  >
                    <Text style={styles.widgetCardTitle}>
                      {t('widget.widgetCard')}
                    </Text>
                    <Text style={styles.widgetCardMeta}>
                      {t('widget.widgetCityChart', {
                        city: cityLabel(widget.cityId),
                        chart: getChartLabel(widget.chartType),
                      })}
                    </Text>
                    <Text style={styles.widgetCardType}>
                      {getWidgetDisplayLabel(widget)}
                    </Text>
                    <Text style={styles.widgetCardSize}>
                      {t('widget.widgetSize', { width: widget.width, height: widget.height })}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.configureButton}
                    onPress={() => handleStartEdit(widget.widgetId, widget.cityId)}
                  >
                    <Text style={styles.configureButtonText}>{t('common.configure')}</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.screen,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '82%',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 20,
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeButtonText: {
    color: colors.accent,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
  },
  scroll: {
    maxHeight: 480,
  },
  centerBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  helperText: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 12,
  },
  widgetCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  widgetCardPressed: {
    opacity: 0.88,
  },
  widgetCardBody: {
    flex: 1,
  },
  widgetCardTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 15,
    marginBottom: 2,
  },
  widgetCardMeta: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
  },
  widgetCardType: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 2,
  },
  widgetCardSize: {
    color: colors.textHint,
    fontFamily: fontFamily.regular,
    fontSize: 11,
    marginTop: 2,
  },
  configureButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  configureButtonText: {
    color: colors.textOnAccent,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    marginBottom: 10,
  },
  optionRow: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.medium,
    fontSize: 15,
  },
  backRow: {
    marginBottom: 10,
  },
  backText: {
    color: colors.accent,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
  },
  refreshRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  refreshOption: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  refreshOptionActive: {
    backgroundColor: colors.accent,
  },
  refreshOptionText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    textAlign: 'center',
  },
  refreshOptionTextActive: {
    color: colors.textPrimary,
  },
});
