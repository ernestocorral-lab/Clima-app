import { DEFAULT_CITIES, SavedCity } from '../types/city';

function citySignature(city: SavedCity): string {
  return `${city.id}|${city.label}|${city.query}|${city.latitude}|${city.longitude}`;
}

export function citiesAreDefaults(cities: SavedCity[]): boolean {
  if (cities.length !== DEFAULT_CITIES.length) {
    return false;
  }

  return cities.every(
    (city, index) => citySignature(city) === citySignature(DEFAULT_CITIES[index]),
  );
}

export function citiesDifferFromDefaults(cities: SavedCity[]): boolean {
  return !citiesAreDefaults(cities);
}
