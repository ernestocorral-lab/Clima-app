import { CitySearchResult } from '../services/weather';
import { shortCityName } from './formatCity';

const COUNTRY_NAME_TO_ALPHA2: Record<string, string> = {
  españa: 'ES',
  spain: 'ES',
  brasil: 'BR',
  brazil: 'BR',
  portugal: 'PT',
  france: 'FR',
  francia: 'FR',
  italy: 'IT',
  italia: 'IT',
  germany: 'DE',
  alemania: 'DE',
  deutschland: 'DE',
  'united kingdom': 'GB',
  'reino unido': 'GB',
  mexico: 'MX',
  méxico: 'MX',
  argentina: 'AR',
  chile: 'CL',
  colombia: 'CO',
  peru: 'PE',
  perú: 'PE',
  'united states': 'US',
  'estados unidos': 'US',
  canada: 'CA',
  canadá: 'CA',
  japan: 'JP',
  japón: 'JP',
  china: 'CN',
  india: 'IN',
  australia: 'AU',
};

const TIMEZONE_TO_ALPHA2: Record<string, string> = {
  'Europe/Madrid': 'ES',
  'Europe/Lisbon': 'PT',
  'Europe/Paris': 'FR',
  'Europe/Rome': 'IT',
  'Europe/Berlin': 'DE',
  'Europe/London': 'GB',
  'America/Sao_Paulo': 'BR',
  'America/Buenos_Aires': 'AR',
  'America/Santiago': 'CL',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Mexico_City': 'MX',
  'America/New_York': 'US',
  'America/Los_Angeles': 'US',
  'America/Chicago': 'US',
  'America/Toronto': 'CA',
  'Asia/Tokyo': 'JP',
  'Asia/Shanghai': 'CN',
  'Asia/Kolkata': 'IN',
  'Australia/Sydney': 'AU',
};

function distanceSquared(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
): number {
  const dLat = latA - latB;
  const dLon = lonA - lonB;
  return dLat * dLat + dLon * dLon;
}

export function countryCodeFromCityLabel(cityLabel?: string): string | undefined {
  if (!cityLabel) {
    return undefined;
  }

  const parts = cityLabel.split(',');
  const countryPart = parts[parts.length - 1]?.trim().toLowerCase();
  if (!countryPart) {
    return undefined;
  }

  return COUNTRY_NAME_TO_ALPHA2[countryPart];
}

export function countryCodeFromTimezone(timezone?: string): string | undefined {
  if (!timezone) {
    return undefined;
  }

  return TIMEZONE_TO_ALPHA2[timezone];
}

export function pickNearestSearchResult(
  results: CitySearchResult[],
  latitude: number,
  longitude: number,
): CitySearchResult | undefined {
  if (!results.length) {
    return undefined;
  }

  return results.reduce((best, current) =>
    distanceSquared(latitude, longitude, current.latitude, current.longitude) <
    distanceSquared(latitude, longitude, best.latitude, best.longitude)
      ? current
      : best,
  );
}

export function resolveCountryCodeFromContext(options: {
  countryCodeAlpha2?: string;
  cityLabel?: string;
  timezone?: string;
  searchResults?: CitySearchResult[];
  latitude?: number;
  longitude?: number;
}): string | undefined {
  if (options.countryCodeAlpha2) {
    return options.countryCodeAlpha2;
  }

  if (
    options.searchResults?.length &&
    options.latitude !== undefined &&
    options.longitude !== undefined
  ) {
    const nearest = pickNearestSearchResult(
      options.searchResults,
      options.latitude,
      options.longitude,
    );
    if (nearest?.countryCodeAlpha2) {
      return nearest.countryCodeAlpha2;
    }
  }

  const fromLabel = countryCodeFromCityLabel(options.cityLabel);
  if (fromLabel) {
    return fromLabel;
  }

  const fromTimezone = countryCodeFromTimezone(options.timezone);
  if (fromTimezone) {
    return fromTimezone;
  }

  return undefined;
}

export function citySearchTerm(cityLabel?: string): string | undefined {
  if (!cityLabel) {
    return undefined;
  }

  const short = shortCityName(cityLabel).trim();
  if (!short || short === 'Tu ubicación') {
    return undefined;
  }

  return short;
}
