/** Tile week-summary row layout (CitySummaryTile / WeekSummaryBox without large). */
export const WEEK_SUMMARY_TILE_LAYOUT = {
  labelWidth: 30,
  dayWidth: 44,
  labelFontSize: 11,
  dayFontSize: 12,
  valueFontSize: 13,
  labelMinScale: 0.75,
  dayMinScale: 0.75,
  valueMinScale: 0.48,
  weekBoxPaddingH: 7,
  weekRowGap: 4,
  tilePadding: 8,
  screenPaddingH: 14,
  gridGap: 10,
  minScreenWidth: 320,
  charWidthFactor: 0.58,
} as const;

export function getMinTileRowInnerWidth(): number {
  const layout = WEEK_SUMMARY_TILE_LAYOUT;
  const tileWidth = (layout.minScreenWidth - layout.screenPaddingH * 2 - layout.gridGap) / 2;
  const tileInner = tileWidth - layout.tilePadding * 2;
  return tileInner - layout.weekBoxPaddingH * 2;
}

export function getMinTileValueAreaWidth(): number {
  const layout = WEEK_SUMMARY_TILE_LAYOUT;
  const rowInner = getMinTileRowInnerWidth();
  return rowInner - layout.labelWidth - layout.dayWidth - layout.weekRowGap * 2;
}

export function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * WEEK_SUMMARY_TILE_LAYOUT.charWidthFactor;
}

export function fitsInWidth(
  text: string,
  fontSize: number,
  width: number,
  minimumFontScale: number,
): boolean {
  const estimated = estimateTextWidth(text, fontSize);
  if (estimated <= width) {
    return true;
  }
  return estimated * minimumFontScale <= width;
}
