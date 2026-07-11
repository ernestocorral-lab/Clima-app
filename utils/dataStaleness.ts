import { t } from '../i18n';

export const DEFAULT_STALE_AFTER_MS = 30 * 60 * 1000;

export function isDataStale(
  updatedAt: string | undefined,
  staleAfterMs: number = DEFAULT_STALE_AFTER_MS,
): boolean {
  if (!updatedAt) {
    return true;
  }

  return Date.now() - new Date(updatedAt).getTime() > staleAfterMs;
}

export function formatDataAge(updatedAt: string | undefined): string {
  if (!updatedAt) {
    return t('staleness.never');
  }

  const ageMs = Date.now() - new Date(updatedAt).getTime();
  const minutes = Math.floor(ageMs / 60000);

  if (minutes < 1) {
    return t('staleness.justNow');
  }

  if (minutes < 60) {
    return t('staleness.minutesAgo', { n: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t('staleness.hoursAgo', { n: hours });
  }

  const days = Math.floor(hours / 24);
  return t('staleness.daysAgo', { n: days });
}

export function formatStaleWarning(
  updatedAt: string | undefined,
  staleAfterMs: number = DEFAULT_STALE_AFTER_MS,
): string | null {
  if (!isDataStale(updatedAt, staleAfterMs)) {
    return null;
  }

  return formatDataAge(updatedAt);
}
