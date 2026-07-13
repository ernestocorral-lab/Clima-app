import { t } from '../i18n';

function isBlankLocationSegment(value?: string | null): boolean {
  if (value == null) {
    return true;
  }
  const trimmed = value.trim();
  return trimmed === '' || trimmed.toLowerCase() === 'undefined';
}

/** Joins city name with optional region/country, skipping empty or "undefined" parts. */
export function buildCityLabel(name: string, ...segments: (string | undefined | null)[]): string {
  const parts = [
    name.trim(),
    ...segments.filter((segment) => !isBlankLocationSegment(segment)).map((segment) => segment!.trim()),
  ].filter(Boolean);

  return parts.join(', ');
}

/** Removes trailing ", undefined" and similar junk from stored or API labels. */
export function sanitizeCityLabel(label: string): string {
  return label
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part.toLowerCase() !== 'undefined')
    .join(', ');
}

export function shortCityName(name: string): string {
  return sanitizeCityLabel(name).split(',')[0]?.trim() ?? name.trim();
}

export function cityNameFromTimezone(timezone?: string): string | null {
  if (!timezone) {
    return null;
  }

  const segment = timezone.split('/').pop();
  if (!segment) {
    return null;
  }

  return segment.replace(/_/g, ' ');
}

export function getLocationLabel(
  id: string,
  title: string,
  subtitle?: string,
  timezone?: string,
): string {
  if (id === 'current') {
    const city = subtitle ? shortCityName(subtitle) : null;
    if (city) {
      return t('location.yourLocationWithCity', { city });
    }
    return t('location.yourLocation');
  }

  return shortCityName(title);
}

type SummaryWeatherPlace = {
  city?: string;
  timezone?: string;
  region?: string;
};

export function getMyLocationTitle(): string {
  return t('location.myLocation');
}

function isPlaceholderLocationName(name?: string | null): boolean {
  if (!name?.trim()) {
    return true;
  }

  const trimmed = name.trim();
  return trimmed === t('location.yourLocation') || trimmed === getMyLocationTitle();
}

/** Short city name for GPS — prefers geocoded weather.city, then subtitle. */
export function getGpsCityName(
  subtitle?: string,
  weather?: SummaryWeatherPlace | null,
): string {
  for (const source of [weather?.city, subtitle]) {
    if (!source?.trim() || isPlaceholderLocationName(source)) {
      continue;
    }

    const city = shortCityName(source);
    if (city && !isPlaceholderLocationName(city)) {
      return city;
    }
  }

  return '';
}

export function getGpsPlaceLabel(
  subtitle?: string,
  weather?: SummaryWeatherPlace | null,
): string {
  const labelSource = (subtitle ?? '').trim();
  if (labelSource && !isPlaceholderLocationName(labelSource)) {
    return sanitizeCityLabel(labelSource);
  }

  const city = getGpsCityName(subtitle, weather);
  const region = weather?.region?.trim();
  if (city && region) {
    return buildCityLabel(city, region);
  }
  if (city) {
    return city;
  }

  return '';
}

export function getGpsSummaryLabel(
  subtitle?: string,
  weather?: SummaryWeatherPlace | null,
): string {
  const city = getGpsCityName(subtitle, weather);
  if (city) {
    return t('location.yourLocationWithCity', { city });
  }
  return t('location.yourLocation');
}

/** Label for home-screen tiles. */
export function getSummaryTileLocationLabel(
  id: string,
  title: string,
  subtitle?: string,
  weather?: SummaryWeatherPlace | null,
): string {
  if (id === 'current') {
    return getGpsSummaryLabel(subtitle, weather);
  }

  return shortCityName(title);
}

/** Full city label for the detail view — keeps region/country, including missing values. */
export function getDetailLocationLabel(
  id: string,
  title: string,
  subtitle?: string,
  timezone?: string,
  weatherCity?: string,
  region?: string,
): string {
  if (id === 'current') {
    const placeLabel = getGpsPlaceLabel(subtitle, {
      city: weatherCity,
      region,
      timezone,
    });
    if (placeLabel) {
      return placeLabel;
    }
    return t('location.yourLocation');
  }

  return title.trim() || (subtitle ?? '').trim();
}
