import { t } from '../i18n';

export function shortCityName(name: string): string {
  const commaIndex = name.indexOf(',');
  return commaIndex >= 0 ? name.slice(0, commaIndex).trim() : name.trim();
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
    let city = subtitle ? shortCityName(subtitle) : null;
    const yourLocation = t('location.yourLocation');
    if (!city || city === yourLocation) {
      city = cityNameFromTimezone(timezone);
    }
    if (city && city !== yourLocation) {
      return t('location.yourLocationWithCity', { city });
    }
    return yourLocation;
  }

  return shortCityName(title);
}

export function getMyLocationTitle(): string {
  return t('location.myLocation');
}
