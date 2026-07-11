import {
  DEFAULT_STALE_AFTER_MS,
  formatDataAge,
  formatStaleWarning,
  isDataStale,
} from './dataStaleness';
import { t } from '../i18n';

export { DEFAULT_STALE_AFTER_MS as STALE_AFTER_MS };

export function isWidgetDataStale(updatedAt: string | undefined): boolean {
  return isDataStale(updatedAt);
}

export function formatWidgetStaleness(updatedAt: string | undefined): string | null {
  if (!updatedAt) {
    return t('widget.stalenessNever');
  }

  return formatDataAge(updatedAt);
}

export { formatDataAge };
