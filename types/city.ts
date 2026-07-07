export type SavedCity = {
  id: string;
  label: string;
  query: string;
  latitude: number;
  longitude: number;
};

export const DEFAULT_CITIES: SavedCity[] = [
  {
    id: 'city-1',
    label: 'Madrid',
    query: 'Madrid, Spain',
    latitude: 40.4168,
    longitude: -3.7038,
  },
  {
    id: 'city-2',
    label: 'Barcelona',
    query: 'Barcelona, Spain',
    latitude: 41.3874,
    longitude: 2.1686,
  },
  {
    id: 'city-3',
    label: 'Sevilla',
    query: 'Sevilla, Spain',
    latitude: 37.3891,
    longitude: -5.9845,
  },
];
