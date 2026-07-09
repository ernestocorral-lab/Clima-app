import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getWidgetInfo, type WidgetInfo } from 'react-native-android-widget';
import { getSavedCities } from '../storage/savedCities';
import { getWidgetConfig, WidgetCityId } from '../storage/widgetData';
import { SavedCity } from '../types/city';
import { WIDGET_CHART_OPTIONS, WidgetChartType } from '../utils/widgetChartData';
import { TEMPERATURE_WIDGET_NAME } from '../widgets/constants';
import { getWidgetCityOptions } from '../widgets/loadWidgetSnapshot';
import {
  getChartLabel,
  updateWidgetConfig,
} from '../widgets/syncTemperatureWidget';

type WidgetSettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

type WidgetListEntry = WidgetInfo & {
  cityId: WidgetCityId;
  chartType: WidgetChartType;
};

export function WidgetSettingsModal({ visible, onClose }: WidgetSettingsModalProps) {
  const [cities, setCities] = useState<SavedCity[]>([]);
  const [widgets, setWidgets] = useState<WidgetListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<WidgetCityId | null>(null);
  const [step, setStep] = useState<'city' | 'chart'>('city');
  const [savingChartType, setSavingChartType] = useState<WidgetChartType | null>(null);

  const loadWidgets = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setWidgets([]);
      return;
    }

    setLoading(true);
    try {
      const [savedCities, widgetInfos] = await Promise.all([
        getSavedCities(),
        getWidgetInfo(TEMPERATURE_WIDGET_NAME),
      ]);
      setCities(savedCities);

      const entries = await Promise.all(
        widgetInfos.map(async (info) => {
          const config = await getWidgetConfig(info.widgetId);
          return {
            ...info,
            cityId: config?.cityId ?? 'city-1',
            chartType: config?.chartType ?? 'temperature',
          };
        }),
      );
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
    if (editingWidgetId === null || !selectedCityId) {
      return;
    }

    setSavingChartType(chartType);
    try {
      await updateWidgetConfig(editingWidgetId, {
        cityId: selectedCityId,
        chartType,
      });
      setEditingWidgetId(null);
      setSelectedCityId(null);
      setStep('city');
      await loadWidgets();
    } finally {
      setSavingChartType(null);
    }
  };

  const editingWidget = widgets.find((widget) => widget.widgetId === editingWidgetId);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Mis widgets</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </Pressable>
          </View>

          {Platform.OS !== 'android' ? (
            <Text style={styles.helperText}>Los widgets solo están disponibles en Android.</Text>
          ) : loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#3D7BFF" />
            </View>
          ) : editingWidget ? (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {step === 'city' ? (
                <>
                  <Text style={styles.sectionTitle}>Elige ciudad</Text>
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
                    <Text style={styles.backText}>← Volver a ciudades</Text>
                  </Pressable>
                  <Text style={styles.sectionTitle}>
                    Gráfico para {cityLabel(selectedCityId ?? editingWidget.cityId)}
                  </Text>
                  {WIDGET_CHART_OPTIONS.map((option) => (
                    <Pressable
                      key={option.id}
                      style={styles.optionRow}
                      onPress={() => void handleSelectChart(option.id)}
                      disabled={savingChartType !== null}
                    >
                      <Text style={styles.optionText}>{option.label}</Text>
                      {savingChartType === option.id && (
                        <ActivityIndicator size="small" color="#3D7BFF" />
                      )}
                    </Pressable>
                  ))}
                </>
              )}
            </ScrollView>
          ) : widgets.length === 0 ? (
            <Text style={styles.helperText}>
              No hay widgets en la pantalla de inicio. Mantén pulsado el escritorio y añade el
              widget «Clima».
            </Text>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {widgets.map((widget) => (
                <View key={widget.widgetId} style={styles.widgetCard}>
                  <View style={styles.widgetCardBody}>
                    <Text style={styles.widgetCardTitle}>Widget #{widget.widgetId}</Text>
                    <Text style={styles.widgetCardMeta}>
                      {cityLabel(widget.cityId)} · {getChartLabel(widget.chartType)}
                    </Text>
                    <Text style={styles.widgetCardSize}>
                      {widget.width}×{widget.height} dp
                    </Text>
                  </View>
                  <Pressable
                    style={styles.configureButton}
                    onPress={() => handleStartEdit(widget.widgetId, widget.cityId)}
                  >
                    <Text style={styles.configureButtonText}>Configurar</Text>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0B1D3A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeButtonText: {
    color: '#3D7BFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    maxHeight: 480,
  },
  centerBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  helperText: {
    color: '#9BB4DE',
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 12,
  },
  widgetCard: {
    backgroundColor: '#16325F',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  widgetCardBody: {
    flex: 1,
  },
  widgetCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  widgetCardMeta: {
    color: '#C7D7F2',
    fontSize: 13,
  },
  widgetCardSize: {
    color: '#7A95C4',
    fontSize: 11,
    marginTop: 2,
  },
  configureButton: {
    backgroundColor: '#3D7BFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  configureButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  optionRow: {
    backgroundColor: '#16325F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  backRow: {
    marginBottom: 10,
  },
  backText: {
    color: '#3D7BFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
