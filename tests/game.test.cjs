const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Game, ITEMS, COLORS, SIZES, BUDGETS, shuffle } = require('../src/game.js');

test('all sizes retain their fruit order, colors and guess budgets', () => {
  assert.deepEqual(BUDGETS, { 5: 6, 6: 7, 7: 8, 8: 10 });
  assert.equal(new Set(ITEMS).size, 8);
  assert.equal(COLORS.length, ITEMS.length);
  assert.ok(COLORS.every(Boolean));
  for (const size of SIZES) assert.deepEqual(new Game(size).items, ITEMS.slice(0, size));
  for (const size of [undefined, 4, 9, '5', NaN]) assert.equal(new Game(size).size, 5);
});

test('Fisher-Yates reaches each permutation exactly once across its choice tree', () => {
  const input = ['a', 'b', 'c', 'd'];
  const outcomes = new Set();
  for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 2; c++) {
    const choices = [(a + 0.5) / 4, (b + 0.5) / 3, (c + 0.5) / 2];
    outcomes.add(shuffle(input, () => choices.shift()).join(''));
  }
  assert.equal(outcomes.size, 24);
  assert.deepEqual(input, ['a', 'b', 'c', 'd']);
});

for (const size of SIZES) {
  test(`${size}: wrong guesses report feedback and stop at the budget`, () => {
    const game = new Game(size, () => 0);
    for (let i = 0; i < game.maxGuesses; i++) assert.equal(game.submit(), true);
    assert.equal(game.correctCount, 0);
    assert.equal(game.lost, true);
    assert.equal(game.won, false);
    assert.equal(game.submit(), false);
    assert.equal(game.guesses.length, BUDGETS[size]);
    assert.equal(game.guesses[0], `Guess #1: ${ITEMS.slice(0, size).join(', ')} - Correct: 0`);
  });
  for (const finalGuess of [false, true]) {
    test(`${size}: wins on ${finalGuess ? 'last' : 'first'} guess and ignores later submissions`, () => {
      const game = new Game(size, () => 0);
      if (finalGuess) for (let i = 1; i < game.maxGuesses; i++) game.submit();
      game.move(0, size - 1);
      assert.deepEqual(game.items, game.answer);
      game.submit();
      assert.equal(game.won, true);
      assert.equal(game.lost, false);
      assert.equal(game.correctCount, size);
      assert.equal(game.submit(), false);
      assert.equal(game.guesses.length, finalGuess ? game.maxGuesses : 1);
    });
  }
  test(`${size}: reset clears a finished game and draws a fresh answer`, () => {
    let random = 0;
    const game = new Game(size, () => random);
    game.move(0, size - 1);
    game.submit();
    random = 0.999;
    game.reset();
    assert.deepEqual(game.items, ITEMS.slice(0, size));
    assert.deepEqual(game.answer, game.items);
    assert.deepEqual(game.guesses, []);
    assert.equal(game.correctCount, 0);
    assert.equal(game.won || game.lost, false);
  });
}

test('moving items preserves a permutation and rejects invalid indices', () => {
  const game = new Game(5, () => 0);
  game.move(0, 4);
  game.move(4, 0);
  for (const [from, to] of [[-1, 1], [0, 5], [NaN, 0], [0, 1.5], [Infinity, 0]]) game.move(from, to);
  assert.deepEqual(game.items, ITEMS.slice(0, 5));
});
