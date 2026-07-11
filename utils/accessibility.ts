import { PixelRatio } from 'react-native';

export const MIN_TOUCH_TARGET = 44;

export function scaledFontSize(baseSize: number, maxScale = 1.35): number {
  const scale = Math.min(PixelRatio.getFontScale(), maxScale);
  return Math.round(baseSize * scale);
}
