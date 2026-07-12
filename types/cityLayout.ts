export const CURRENT_CITY_ID = 'current';

export type CityLayoutItem = {
  id: string;
  visible: boolean;
};

export function buildDefaultCityLayout(cityIds: string[]): CityLayoutItem[] {
  return [
    { id: CURRENT_CITY_ID, visible: true },
    ...cityIds.map((id) => ({ id, visible: true })),
  ];
}
