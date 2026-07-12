import { LocationResult } from '../types/location';
import { CityLayoutItem } from '../types/cityLayout';

export function orderLocationsByLayout(
  locations: LocationResult[],
  layout: CityLayoutItem[],
): LocationResult[] {
  const byId = new Map(locations.map((location) => [location.id, location]));

  return layout
    .map((item) => byId.get(item.id))
    .filter((location): location is LocationResult => location !== undefined);
}

export function getVisibleLocations(
  locations: LocationResult[],
  layout: CityLayoutItem[],
): LocationResult[] {
  const visibleIds = new Set(layout.filter((item) => item.visible).map((item) => item.id));
  return orderLocationsByLayout(locations, layout).filter((location) =>
    visibleIds.has(location.id),
  );
}

export function chunkLocationRows(locations: LocationResult[]): LocationResult[][] {
  const rows: LocationResult[][] = [];
  for (let index = 0; index < locations.length; index += 2) {
    rows.push(locations.slice(index, index + 2));
  }
  return rows;
}
