export type UvIndexLevelKey = 'low' | 'moderate' | 'high' | 'veryHigh' | 'extreme';

export type UvIndexLevel = {
  key: UvIndexLevelKey;
  color: string;
};

export function getUvIndexLevel(uvIndex: number): UvIndexLevel {
  if (uvIndex < 3) {
    return { key: 'low', color: '#4ADE80' };
  }
  if (uvIndex < 6) {
    return { key: 'moderate', color: '#FACC15' };
  }
  if (uvIndex < 8) {
    return { key: 'high', color: '#FB923C' };
  }
  if (uvIndex < 11) {
    return { key: 'veryHigh', color: '#F87171' };
  }
  return { key: 'extreme', color: '#C084FC' };
}
