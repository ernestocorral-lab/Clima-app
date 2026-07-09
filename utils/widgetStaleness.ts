const STALE_AFTER_MS = 30 * 60 * 1000;

export function isWidgetDataStale(updatedAt: string | undefined): boolean {
  if (!updatedAt) {
    return true;
  }

  return Date.now() - new Date(updatedAt).getTime() > STALE_AFTER_MS;
}

export function formatWidgetStaleness(updatedAt: string | undefined): string | null {
  if (!updatedAt) {
    return 'Sin actualizar';
  }

  const ageMs = Date.now() - new Date(updatedAt).getTime();
  if (ageMs < STALE_AFTER_MS) {
    return null;
  }

  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 60) {
    return `hace ${Math.max(1, minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}
