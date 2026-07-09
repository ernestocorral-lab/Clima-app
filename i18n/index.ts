import { getLocales } from 'expo-localization';
import { AppLocale, translations } from './translations';

function resolveLocale(): AppLocale {
  const locale = getLocales()[0];
  const languageCode = locale?.languageCode?.toLowerCase();
  const languageTag = locale?.languageTag?.toLowerCase();

  if (languageCode === 'es' || languageTag?.startsWith('es')) {
    return 'es';
  }

  return 'en';
}

export function getLocale(): AppLocale {
  return resolveLocale();
}

export function getLocaleTag(): string {
  return getLocale() === 'en' ? 'en-US' : 'es-ES';
}

export function getApiLanguage(): string {
  return getLocale() === 'en' ? 'en' : 'es';
}

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  return typeof value === 'string' ? value : undefined;
}

export function t(
  key: string,
  params?: Record<string, string | number>,
  locale: AppLocale = getLocale(),
): string {
  const table = translations[locale] as Record<string, unknown>;
  const fallback = translations[locale === 'en' ? 'es' : 'en'] as Record<string, unknown>;
  let text = getNestedValue(table, key) ?? getNestedValue(fallback, key) ?? key;

  if (params) {
    for (const [param, value] of Object.entries(params)) {
      text = text.replaceAll(`{${param}}`, String(value));
    }
  }

  return text;
}

export function metricLabel(
  metric:
    | 'temperature'
    | 'apparent'
    | 'humidity'
    | 'precipitation'
    | 'wind'
    | 'windGust'
    | 'pressure'
    | 'uv'
    | 'radiation'
    | 'visibility'
    | 'gases'
    | 'particles'
    | 'allergens',
  locale: AppLocale = getLocale(),
): string {
  return t(`metrics.${metric}`, undefined, locale);
}
