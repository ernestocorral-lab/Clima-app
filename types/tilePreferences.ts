import { WidgetChartType } from '../utils/widgetChartData';
import { WeeklyMetricId } from '../utils/weatherMetrics';

export type TileLocationPreferences = {
  chartType: WidgetChartType;
  weeklyRowIds: WeeklyMetricId[];
};

export const DEFAULT_TILE_CHART_TYPE: WidgetChartType = 'apparent';

export const DEFAULT_TILE_WEEKLY_ROWS: WeeklyMetricId[] = [
  'maxTemp',
  'apparent',
  'minTemp',
  'precip',
];

export const TILE_WEEKLY_ROW_COUNT = 4;

export function buildDefaultTilePreferences(
  locationIds: string[],
): Record<string, TileLocationPreferences> {
  return Object.fromEntries(
    locationIds.map((id) => [
      id,
      {
        chartType: DEFAULT_TILE_CHART_TYPE,
        weeklyRowIds: [...DEFAULT_TILE_WEEKLY_ROWS],
      },
    ]),
  );
}
