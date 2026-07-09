export type SavedCity = {
  id: string;
  label: string;
  query: string;
  latitude: number;
  longitude: number;
  countryCodeAlpha2?: string;
};

export const DEFAULT_CITIES: SavedCity[] = [
  {
    id: 'city-1',
    label: 'Madrid',
    query: 'Madrid, Spain',
    latitude: 40.4168,
    longitude: -3.7038,
    countryCodeAlpha2: 'ES',
  },
  {
    id: 'city-2',
    label: 'Vigo',
    query: 'Vigo, Spain',
    latitude: 42.2406,
    longitude: -8.7207,
    countryCodeAlpha2: 'ES',
  },
  {
    id: 'city-3',
    label: 'Murcia',
    query: 'Murcia, Spain',
    latitude: 37.9922,
    longitude: -1.1307,
    countryCodeAlpha2: 'ES',
  },
];
