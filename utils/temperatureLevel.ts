export type TemperatureLevelKey = 'extremeDanger' | 'severeDanger' | 'danger' | 'caution';

export type TemperatureLevel = {
  key: TemperatureLevelKey;
  color: string;
};

export const NORMAL_TEMPERATURE_VALUE_COLOR = '#4ADE80';

export function getTemperatureValueColor(celsius: number): string {
  return getTemperatureLevel(celsius)?.color ?? NORMAL_TEMPERATURE_VALUE_COLOR;
}

export function getTemperatureLevel(celsius: number): TemperatureLevel | null {
  if (celsius < -40 || celsius > 50) {
    return { key: 'extremeDanger', color: '#C084FC' };
  }
  if (celsius >= -40 && celsius <= -28) {
    return { key: 'severeDanger', color: '#F87171' };
  }
  if (celsius > -28 && celsius <= -10) {
    return { key: 'danger', color: '#FB923C' };
  }
  if (celsius > -10 && celsius <= 0) {
    return { key: 'caution', color: '#FACC15' };
  }
  if (celsius > 0 && celsius <= 27) {
    return null;
  }
  if (celsius > 27 && celsius <= 33) {
    return { key: 'caution', color: '#FACC15' };
  }
  if (celsius > 33 && celsius <= 40) {
    return { key: 'danger', color: '#FB923C' };
  }
  if (celsius > 40 && celsius <= 50) {
    return { key: 'severeDanger', color: '#F87171' };
  }
  return null;
}
