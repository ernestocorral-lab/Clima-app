import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_TILE_CHART_TYPE,
  DEFAULT_TILE_WEEKLY_ROWS,
  TILE_WEEKLY_ROW_COUNT,
  TileLocationPreferences,
  buildDefaultTilePreferences,
} from '../types/tilePreferences';
import { getWidgetChartOptions, WidgetChartType } from '../utils/widgetChartData';
import { WEEKLY_METRIC_IDS, WeeklyMetricId } from '../utils/weatherMetrics';

const STORAGE_KEY = '@weather-app/tile-preferences';

const VALID_CHART_TYPES = new Set(getWidgetChartOptions().map((option) => option.id));
const VALID_WEEKLY_IDS = new Set<string>(WEEKLY_METRIC_IDS);

function sanitizeChartType(value: unknown): WidgetChartType {
  if (typeof value === 'string' && VALID_CHART_TYPES.has(value as WidgetChartType)) {
    return value as WidgetChartType;
  }
  return DEFAULT_TILE_CHART_TYPE;
}

function sanitizeWeeklyRowIds(value: unknown): WeeklyMetricId[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_TILE_WEEKLY_ROWS];
  }

  const rows = value
    .filter((entry): entry is WeeklyMetricId => typeof entry === 'string' && VALID_WEEKLY_IDS.has(entry))
    .slice(0, TILE_WEEKLY_ROW_COUNT);

  while (rows.length < TILE_WEEKLY_ROW_COUNT) {
    const fallback = DEFAULT_TILE_WEEKLY_ROWS[rows.length];
    if (!fallback || rows.includes(fallback)) {
      break;
    }
    rows.push(fallback);
  }

  return rows.length === TILE_WEEKLY_ROW_COUNT ? rows : [...DEFAULT_TILE_WEEKLY_ROWS];
}

function sanitizeLocationPreferences(value: unknown): TileLocationPreferences {
  if (!value || typeof value !== 'object') {
    return {
      chartType: DEFAULT_TILE_CHART_TYPE,
      weeklyRowIds: [...DEFAULT_TILE_WEEKLY_ROWS],
    };
  }

  const record = value as Record<string, unknown>;
  return {
    chartType: sanitizeChartType(record.chartType),
    weeklyRowIds: sanitizeWeeklyRowIds(record.weeklyRowIds),
  };
}

export async function getTilePreferences(
  locationIds: string[],
): Promise<Record<string, TileLocationPreferences>> {
  const defaults = buildDefaultTilePreferences(locationIds);

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') {
      return defaults;
    }

    return Object.fromEntries(
      locationIds.map((id) => [
        id,
        {
          ...defaults[id],
          ...sanitizeLocationPreferences(parsed[id]),
        },
      ]),
    );
  } catch {
    return defaults;
  }
}

export async function setTileChartType(
  locationId: string,
  chartType: WidgetChartType,
  locationIds: string[],
): Promise<Record<string, TileLocationPreferences>> {
  const current = await getTilePreferences(locationIds);
  const next = {
    ...current,
    [locationId]: {
      ...current[locationId],
      chartType: sanitizeChartType(chartType),
    },
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function setTileWeeklyRowIds(
  locationId: string,
  weeklyRowIds: WeeklyMetricId[],
  locationIds: string[],
): Promise<Record<string, TileLocationPreferences>> {
  const current = await getTilePreferences(locationIds);
  const next = {
    ...current,
    [locationId]: {
      ...current[locationId],
      weeklyRowIds: sanitizeWeeklyRowIds(weeklyRowIds),
    },
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
