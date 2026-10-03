/* ES5 deliberately: this file is shipped unchanged to every browser.
 * CommonJS is only for the build and tests; browsers use PermutationGame. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PermutationGame = factory();
}(this, function () {
  'use strict';
  var ITEMS = ['Apple', 'Banana', 'Grape', 'Orange', 'Pear', 'Berry', 'Lime', 'Kiwi'];
  var COLORS = ['red', '#ffd700', 'purple', 'orange', '#d1e231', '#2f6fdb', '#3f8f29', '#8b5e3c'];
  var SIZES = [5, 6, 7, 8];
  // Sizes 5-7 are proven optimum; size 8 uses the shortest strategy found.
  var BUDGETS = { 5: 6, 6: 7, 7: 8, 8: 10 };

  function shuffle(items, random) {
    var result = items.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var item = result[i];
      result[i] = result[j];
      result[j] = item;
    }
    return result;
  }

  function Game(size, random) {
    this.size = SIZES.indexOf(size) === -1 ? 5 : size;
    this.maxGuesses = BUDGETS[this.size];
    this.random = random || Math.random;
    this.reset();
  }

  Game.prototype.reset = function () {
    this.items = ITEMS.slice(0, this.size);
    this.answer = shuffle(this.items, this.random);
    this.guesses = [];
    this.correctCount = 0;
    this.won = false;
    this.lost = false;
  };

  Game.prototype.move = function (from, to) {
    if (from < 0 || to < 0 || from >= this.size || to >= this.size ||
        from !== Math.floor(from) || to !== Math.floor(to)) return;
    this.items.splice(to, 0, this.items.splice(from, 1)[0]);
  };

  Game.prototype.submit = function () {
    if (this.won || this.lost) return false;
    this.correctCount = 0;
    for (var i = 0; i < this.size; i++) {
      if (this.items[i] === this.answer[i]) this.correctCount++;
    }
    this.guesses.push('Guess #' + (this.guesses.length + 1) + ': ' +
      this.items.join(', ') + ' - Correct: ' + this.correctCount);
    this.won = this.correctCount === this.size;
    this.lost = !this.won && this.guesses.length >= this.maxGuesses;
    return true;
  };

  return { Game: Game, ITEMS: ITEMS, COLORS: COLORS, SIZES: SIZES, BUDGETS: BUDGETS, shuffle: shuffle };
}));
