import { t } from '../i18n';
import { LocationResult } from '../types/location';
import { formatDataAge, isDataStale } from './dataStaleness';

export type AppStatusTone = 'offline' | 'stale';

export type AppStatus = {
  message: string;
  tone: AppStatusTone;
};

function oldestFetchedAt(locations: LocationResult[]): string | undefined {
  let oldest: string | undefined;

  for (const location of locations) {
    if (!location.fetchedAt) {
      continue;
    }

    if (!oldest || new Date(location.fetchedAt).getTime() < new Date(oldest).getTime()) {
      oldest = location.fetchedAt;
    }
  }

  return oldest;
}

export function resolveAppStatus(
  locations: LocationResult[],
  staleAfterMs: number,
): AppStatus | null {
  const withWeather = locations.filter((location) => location.weather);
  if (!withWeather.length) {
    return null;
  }

  const offlineLocations = withWeather.filter((location) => location.fromCache);
  if (offlineLocations.length) {
    return {
      tone: 'offline',
      message: t('banner.offline', { age: formatDataAge(oldestFetchedAt(offlineLocations)) }),
    };
  }

  const staleLocations = withWeather.filter((location) =>
    isDataStale(location.fetchedAt, staleAfterMs),
  );
  if (!staleLocations.length) {
    return null;
  }

  return {
    tone: 'stale',
    message: t('banner.stale', { age: formatDataAge(oldestFetchedAt(staleLocations)) }),
  };
}
