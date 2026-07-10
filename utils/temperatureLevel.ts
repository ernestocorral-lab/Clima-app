export type TemperatureLevelKey = 'extremeDanger' | 'veryDangerous' | 'dangerous';

export type TemperatureLevel = {
  key: TemperatureLevelKey;
  color: string;
};

export function getTemperatureLevel(celsius: number): TemperatureLevel | null {
  if (celsius < -55 || celsius > 54) {
    return { key: 'extremeDanger', color: '#F87171' };
  }
  if (celsius > -55 && celsius <= -40) {
    return { key: 'veryDangerous', color: '#C2410C' };
  }
  if (celsius > -40 && celsius <= -29) {
    return { key: 'veryDangerous', color: '#FB923C' };
  }
  if (celsius > -29 && celsius <= -10) {
    return { key: 'dangerous', color: '#FACC15' };
  }
  if (celsius > 32 && celsius <= 40) {
    return { key: 'dangerous', color: '#FACC15' };
  }
  if (celsius > 40 && celsius <= 54) {
    return { key: 'veryDangerous', color: '#FB923C' };
  }
  return null;
}
