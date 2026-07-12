/** Compact header buttons before the 30% width bump (v1.1.6 baseline). */
export const HEADER_BUTTON_BASE_WIDTH = 62;
export const HEADER_BUTTON_WIDTH_SCALE = 1.3;

export const HEADER_BUTTON_LAYOUT = {
  width: Math.round(HEADER_BUTTON_BASE_WIDTH * HEADER_BUTTON_WIDTH_SCALE),
  paddingHorizontal: 5,
  paddingVertical: 6,
  minHeight: 36,
  fontSize: 12,
  lineHeight: 14,
  minimumFontScale: 0.8,
} as const;

export function getHeaderButtonTextAreaWidth(): number {
  return HEADER_BUTTON_LAYOUT.width - HEADER_BUTTON_LAYOUT.paddingHorizontal * 2;
}

export function getHeaderButtonWidthIncreaseRatio(): number {
  return HEADER_BUTTON_LAYOUT.width / HEADER_BUTTON_BASE_WIDTH;
}
