export function formatObservedAt(isoTime: string): string {
  const date = new Date(isoTime.includes('T') ? isoTime : `${isoTime}T12:00:00`);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
