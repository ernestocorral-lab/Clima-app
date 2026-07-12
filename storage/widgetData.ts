import AsyncStorage from '@react-native-async-storage/async-storage';
import { metricLabel } from '../i18n';
import { WidgetChartType } from '../utils/widgetChartData';
import { WidgetChartSeries } from '../utils/widgetChartData';
import { DEFAULT_WIDGET_CITY_ID } from '../widgets/constants';
import { resolveWidgetChartType } from '../widgets/metricWidgetRegistry';

export type WidgetCityId = 'current' | string;

export type WidgetInstanceConfig = {
  cityId: WidgetCityId;
  chartType: WidgetChartType;
  /** True when the user picked city/chart in the widget configuration flow. */
  configured?: boolean;
  widgetName?: string;
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
        label: metricLabel('temperature'),
        points: snapshot.points,
        envelope: snapshot.envelope,
        currentLabel: `${Math.round(snapshot.currentTemp)}°`,
      },
      apparent: {
        label: metricLabel('apparent'),
        points: snapshot.points,
        envelope: snapshot.envelope,
        currentLabel: `${Math.round(snapshot.currentTemp)}°`,
      },
      humidity: {
        label: metricLabel('humidity'),
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      precipitation: {
        label: metricLabel('precipitation'),
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      wind: {
        label: metricLabel('wind'),
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      windGust: {
        label: metricLabel('windGust'),
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      pressure: {
        label: metricLabel('pressure'),
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      uv: {
        label: metricLabel('uv'),
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      radiation: {
        label: metricLabel('radiation'),
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      visibility: {
        label: metricLabel('visibility'),
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      gases: {
        label: metricLabel('gases'),
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      particles: {
        label: metricLabel('particles'),
        points: [],
        envelope: [],
        currentLabel: '--',
      },
      allergens: {
        label: metricLabel('allergens'),
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

/** Persist a home-screen widget so it appears in Mis widgets. */
export async function ensureWidgetListedConfig(
  widgetId: number,
  widgetName: string,
  existing?: WidgetInstanceConfig | null,
): Promise<WidgetInstanceConfig> {
  const config: WidgetInstanceConfig = {
    cityId: existing?.cityId ?? DEFAULT_WIDGET_CITY_ID,
    chartType: existing?.chartType ?? resolveWidgetChartType(widgetName),
    configured: true,
    widgetName,
  };
  await saveWidgetConfig(widgetId, config);
  return config;
}

export async function deleteWidgetConfig(widgetId: number): Promise<void> {
  await AsyncStorage.removeItem(configKey(widgetId));
}

export async function listConfiguredWidgetConfigs(): Promise<
  Array<{ widgetId: number; config: WidgetInstanceConfig }>
> {
  const keys = await AsyncStorage.getAllKeys();
  const configured: Array<{ widgetId: number; config: WidgetInstanceConfig }> = [];

  for (const key of keys.filter((entry) => entry.startsWith(CONFIG_PREFIX))) {
    const widgetId = Number(key.slice(CONFIG_PREFIX.length));
    if (!Number.isFinite(widgetId)) {
      continue;
    }

    const config = await getWidgetConfig(widgetId);
    if (config?.configured === true) {
      configured.push({ widgetId, config });
    }
  }

  return configured.sort((left, right) => left.widgetId - right.widgetId);
}

export async function pruneOrphanWidgetConfigs(activeWidgetIds: Set<number>): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const configKeys = keys.filter((key) => key.startsWith(CONFIG_PREFIX));

  await Promise.all(
    configKeys.map(async (key) => {
      const widgetId = Number(key.slice(CONFIG_PREFIX.length));
      if (!Number.isFinite(widgetId) || activeWidgetIds.has(widgetId)) {
        return;
      }

      await AsyncStorage.removeItem(key);
    }),
  );
}

export async function pruneUnconfiguredWidgetConfigs(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const configKeys = keys.filter((key) => key.startsWith(CONFIG_PREFIX));

  await Promise.all(
    configKeys.map(async (key) => {
      const widgetId = Number(key.slice(CONFIG_PREFIX.length));
      if (!Number.isFinite(widgetId)) {
        await AsyncStorage.removeItem(key);
        return;
      }

      const config = await getWidgetConfig(widgetId);
      if (!config || config.configured !== true) {
        await AsyncStorage.removeItem(key);
      }
    }),
  );
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
        configured: parsed.configured,
        widgetName: parsed.widgetName,
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
