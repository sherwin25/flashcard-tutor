export const MIN_CARDS = 5;
export const MAX_CARDS = 20;

export function clampCardCount(count: number) {
  if (Number.isNaN(count)) return MIN_CARDS;
  return Math.min(MAX_CARDS, Math.max(MIN_CARDS, count));
}
