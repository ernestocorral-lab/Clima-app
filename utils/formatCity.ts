export function shortCityName(name: string): string {
  const commaIndex = name.indexOf(',');
  return commaIndex >= 0 ? name.slice(0, commaIndex).trim() : name.trim();
}

export function getLocationLabel(title: string, subtitle?: string): string {
  const rawLabel = title === 'Mi ubicación' ? (subtitle ?? title) : title;
  return shortCityName(rawLabel);
}
