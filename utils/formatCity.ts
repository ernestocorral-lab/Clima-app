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

/** Label for home-screen tiles. */
export function getSummaryTileLocationLabel(
  id: string,
  title: string,
  subtitle?: string,
  weather?: SummaryWeatherPlace | null,
): string {
  if (id === 'current') {
    const citySource = (weather?.city ?? subtitle ?? '').trim();
    const city = shortCityName(citySource);
    if (city) {
      return t('location.yourLocationWithCity', { city });
    }
    return t('location.yourLocation');
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
    const labelSource = (subtitle ?? weatherCity ?? '').trim();
    const yourLocation = t('location.yourLocation');

    let city = shortCityName(labelSource);
    if (!city || city === yourLocation) {
      city = cityNameFromTimezone(timezone) ?? '';
    }

    let regionName = region?.trim();
    if (!regionName && labelSource.includes(',')) {
      regionName = labelSource
        .split(',')
        .slice(1)
        .map((part) => part.trim())
        .filter((part) => part && part.toLowerCase() !== 'undefined')
        .join(', ');
    }

    if (city && regionName) {
      return buildCityLabel(city, regionName);
    }
    if (labelSource && labelSource !== yourLocation) {
      return labelSource;
    }
    if (city) {
      return city;
    }
    return yourLocation;
  }

  return title.trim() || (subtitle ?? '').trim();
}

export function getMyLocationTitle(): string {
  return t('location.myLocation');
}
