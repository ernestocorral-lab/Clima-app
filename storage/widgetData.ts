import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetChartType } from '../utils/widgetChartData';
import { WidgetChartSeries } from '../utils/widgetChartData';

export type WidgetCityId = 'current' | string;

export type WidgetInstanceConfig = {
  cityId: WidgetCityId;
  chartType: WidgetChartType;
};

export type WidgetCitySnapshot = {
  cityId: WidgetCityId;
  cityLabel: string;
  charts: Record<WidgetChartType, WidgetChartSeries>;
  updatedAt: string;
};

type LegacyWidgetCitySnapshot = {
  cityId: WidgetCityId;
  cityLabel: string;
  currentTemp: number;
  points: WidgetChartSeries['points'];
  envelope: WidgetChartSeries['envelope'];
  updatedAt: string;
};

const SNAPSHOT_PREFIX = '@weather-app/widget-snapshot/';
const CONFIG_PREFIX = '@weather-app/widget-config/';

function snapshotKey(cityId: WidgetCityId): string {
  return `${SNAPSHOT_PREFIX}${cityId}`;
}

function configKey(widgetId: number): string {
  return `${CONFIG_PREFIX}${widgetId}`;
}

function isLegacySnapshot(value: unknown): value is LegacyWidgetCitySnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const snapshot = value as LegacyWidgetCitySnapshot;
  return Array.isArray(snapshot.points) && !('charts' in snapshot);
}

function migrateLegacySnapshot(snapshot: LegacyWidgetCitySnapshot): WidgetCitySnapshot {
  return {
    cityId: snapshot.cityId,
    cityLabel: snapshot.cityLabel,
    updatedAt: snapshot.updatedAt,
    charts: {
      temperature: {
        label: 'Temperatura',
        points: snapshot.points,
        envelope: snapshot.envelope,
        currentLabel: `${Math.round(snapshot.currentTemp)}°`,
      },
      apparent: {
        label: 'Sensación térmica',
        points: snapshot.points,
        envelope: snapshot.envelope,
        currentLabel: `${Math.round(snapshot.currentTemp)}°`,
      },
      humidity: {
        label: 'Humedad',
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      precipitation: {
        label: 'Precipitaciones',
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      wind: {
        label: 'Viento',
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      windGust: {
        label: 'Ráfagas',
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      pressure: {
        label: 'Presión',
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      uv: {
        label: 'Índice UV',
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      radiation: {
        label: 'Radiación',
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      visibility: {
        label: 'Visibilidad',
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      gases: {
        label: 'Gases',
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      particles: {
        label: 'Partículas',
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      allergens: {
        label: 'Alergenos',
        points: [],
        envelope: [],
        currentLabel: '--',
      },
    },
  };
}

export async function saveWidgetConfig(
  widgetId: number,
  config: WidgetInstanceConfig,
): Promise<void> {
  await AsyncStorage.setItem(configKey(widgetId), JSON.stringify(config));
}

export async function getWidgetConfig(widgetId: number): Promise<WidgetInstanceConfig | null> {
  const raw = await AsyncStorage.getItem(configKey(widgetId));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as WidgetInstanceConfig | WidgetCityId;
    if (typeof parsed === 'string') {
      return { cityId: parsed, chartType: 'temperature' };
    }

    if (parsed && typeof parsed === 'object' && typeof parsed.cityId === 'string') {
      return {
        cityId: parsed.cityId,
        chartType: parsed.chartType ?? 'temperature',
      };
    }
  } catch {
    if (raw === 'current' || raw.startsWith('city-')) {
      return { cityId: raw, chartType: 'temperature' };
    }
  }

  return null;
}

/** @deprecated Use saveWidgetConfig */
export async function saveWidgetCityConfig(
  widgetId: number,
  cityId: WidgetCityId,
): Promise<void> {
  const existing = await getWidgetConfig(widgetId);
  await saveWidgetConfig(widgetId, {
    cityId,
    chartType: existing?.chartType ?? 'temperature',
  });
}

/** @deprecated Use getWidgetConfig */
export async function getWidgetCityConfig(widgetId: number): Promise<WidgetCityId | null> {
  const config = await getWidgetConfig(widgetId);
  return config?.cityId ?? null;
}

export async function saveWidgetSnapshot(
  cityId: WidgetCityId,
  snapshot: WidgetCitySnapshot,
): Promise<void> {
  await AsyncStorage.setItem(snapshotKey(cityId), JSON.stringify(snapshot));
}

export async function getWidgetSnapshot(
  cityId: WidgetCityId,
): Promise<WidgetCitySnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(snapshotKey(cityId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (isLegacySnapshot(parsed)) {
      return migrateLegacySnapshot(parsed);
    }

    return parsed as WidgetCitySnapshot;
  } catch {
    return null;
  }
}

export function getChartFromSnapshot(
  snapshot: WidgetCitySnapshot | null,
  chartType: WidgetChartType,
): WidgetChartSeries | null {
  if (!snapshot) {
    return null;
  }

  return snapshot.charts[chartType] ?? null;
}
