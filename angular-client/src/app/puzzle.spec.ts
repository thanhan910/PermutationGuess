import {
  DEFAULT_PUZZLE_SIZE,
  ITEM_COLORS,
  MAX_GUESSES,
  PUZZLE_SIZES,
  isPuzzleSize,
  itemsForSize,
  resolvePuzzleSize,
  shuffle,
} from './puzzle';

describe('puzzle', () => {
  it('has a color for every item and enough items for the largest size', () => {
    const items = Object.keys(ITEM_COLORS);
    expect(items.length).toBe(Math.max(...PUZZLE_SIZES));
    expect(new Set(items).size).toBe(items.length);
    expect(items.every((item) => Boolean(ITEM_COLORS[item]))).toBe(true);
  });

  it('allows the optimal number of guesses for each size', () => {
    expect(MAX_GUESSES).toEqual({ 5: 6, 6: 7, 7: 8, 8: 10 });
  });

  it('grows each board from the smaller one', () => {
    expect(itemsForSize(5)).toEqual(Object.keys(ITEM_COLORS).slice(0, 5));
    for (const size of PUZZLE_SIZES) {
      expect(itemsForSize(size).length).toBe(size);
      expect(itemsForSize(8).slice(0, size)).toEqual(itemsForSize(size));
    }
  });

  it('recognizes only the served sizes', () => {
    for (const size of PUZZLE_SIZES) expect(isPuzzleSize(size)).toBe(true);
    for (const other of [4, 9, 55, '5', null, undefined]) expect(isPuzzleSize(other)).toBe(false);
  });

  it('shuffles into a permutation of the same items', () => {
    const items = itemsForSize(8);
    const shuffled = shuffle(items);
    expect(shuffled).not.toBe(items);
    expect(items).toEqual(itemsForSize(8));
    expect([...shuffled].sort()).toEqual([...items].sort());
  });

  it('reaches every arrangement, and none more often than the rest', () => {
    const counts = new Map<string, number>();
    for (let run = 0; run < 24_000; run++) {
      const key = shuffle(['a', 'b', 'c', 'd']).join('');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(24);
    // An even split is 1000 each; a biased shuffle misses this band widely.
    for (const count of counts.values()) expect(count).toBeGreaterThan(700);
  });

  describe('resolvePuzzleSize', () => {
    it('reads the size from the path under a root deployment', () => {
      expect(resolvePuzzleSize('/', '/')).toBe(DEFAULT_PUZZLE_SIZE);
      expect(resolvePuzzleSize('/5/', '/')).toBe(5);
      expect(resolvePuzzleSize('/7/', '/')).toBe(7);
      expect(resolvePuzzleSize('/7', '/')).toBe(7);
      expect(resolvePuzzleSize('/8/index.html', '/')).toBe(8);
    });

    it('reads the size from the path under a sub-path deployment', () => {
      const base = '/PermutationGuess/';
      expect(resolvePuzzleSize(base, base)).toBe(DEFAULT_PUZZLE_SIZE);
      expect(resolvePuzzleSize('/PermutationGuess/6/', base)).toBe(6);
      expect(resolvePuzzleSize('/PermutationGuess/8/', 'https://user.github.io/PermutationGuess/')).toBe(8);
    });

    it('falls back to the default size for anything else', () => {
      for (const pathname of ['/4/', '/9/', '/55/', '/six/', '/5x/', '']) {
        expect(resolvePuzzleSize(pathname, '/')).toBe(DEFAULT_PUZZLE_SIZE);
      }
    });
  });
});
