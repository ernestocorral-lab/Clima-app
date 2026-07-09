import { t } from '../i18n';

const STALE_AFTER_MS = 30 * 60 * 1000;

export function isWidgetDataStale(updatedAt: string | undefined): boolean {
  if (!updatedAt) {
    return true;
  }

  return Date.now() - new Date(updatedAt).getTime() > STALE_AFTER_MS;
}

export function formatWidgetStaleness(updatedAt: string | undefined): string | null {
  if (!updatedAt) {
    return t('widget.stalenessNever');
  }

  const ageMs = Date.now() - new Date(updatedAt).getTime();
  if (ageMs < STALE_AFTER_MS) {
    return null;
  }

  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 60) {
    return t('widget.stalenessMinutes', { n: Math.max(1, minutes) });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t('widget.stalenessHours', { n: hours });
  }

  const days = Math.floor(hours / 24);
  return t('widget.stalenessDays', { n: days });
}
