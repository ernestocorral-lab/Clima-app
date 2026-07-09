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
  title: string,
  subtitle?: string,
  timezone?: string,
): string {
  if (title === 'Mi ubicación') {
    let city = subtitle ? shortCityName(subtitle) : null;
    if (!city || city === 'Tu ubicación') {
      city = cityNameFromTimezone(timezone);
    }
    if (city && city !== 'Tu ubicación') {
      return `Tu ubicación (${city})`;
    }
    return 'Tu ubicación';
  }

  return shortCityName(title);
}
