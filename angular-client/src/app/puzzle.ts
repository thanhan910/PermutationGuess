/**
 * Every fruit the game can hand out, in the order sizes grow: a size-n puzzle
 * uses the first n of these, so /5/ keeps exactly the original five items.
 */
export const ITEM_COLORS: { [key: string]: string } = {
  Apple: 'red',
  Banana: '#ffd700',
  Grape: 'purple',
  Orange: 'orange',
  Pear: '#d1e231',
  Berry: '#2f6fdb',
  Lime: '#3f8f29',
  Fig: '#8b5e3c',
};

/** Puzzle sizes the site serves. Keep in sync with `scripts/build-size-pages.mjs`. */
export const PUZZLE_SIZES = [5, 6, 7, 8] as const;

export type PuzzleSize = (typeof PUZZLE_SIZES)[number];

/** The size served from the deployment root. */
export const DEFAULT_PUZZLE_SIZE: PuzzleSize = 5;

/**
 * Guesses allowed per size. Sizes 5 to 7 use the proven optimum. Size 8 uses
 * 10, the shortest strategy actually found; its proven lower bound is 9, and
 * exhaustive search of the last levels of a 9-guess tree has always failed.
 */
export const MAX_GUESSES: Record<PuzzleSize, number> = { 5: 6, 6: 7, 7: 8, 8: 10 };

export function isPuzzleSize(value: unknown): value is PuzzleSize {
  return (PUZZLE_SIZES as readonly unknown[]).includes(value);
}

/** The items a size-n puzzle plays with. */
export function itemsForSize(size: PuzzleSize): string[] {
  return Object.keys(ITEM_COLORS).slice(0, size);
}

/** An unbiased shuffle, so every permutation is an equally likely answer. */
export function shuffle(items: string[]): string[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * The size named by the first path segment after the deployment's base path,
 * so `/6/` and `/PermutationGuess/6/` both mean six items. Anything else,
 * including the bare root, falls back to the default size.
 */
export function resolvePuzzleSize(pathname: string, baseHref: string): PuzzleSize {
  const basePath = new URL(baseHref, 'http://localhost/').pathname;
  const rest = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const size = Number(rest.replace(/^\/+/, '').split('/')[0]);
  return isPuzzleSize(size) ? size : DEFAULT_PUZZLE_SIZE;
}
