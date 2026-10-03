const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { parse } = require('acorn');

test('every shipped JavaScript file parses as ES5, without module syntax', () => {
  for (const file of ['src/game.js', 'src/app.js']) {
    parse(readFileSync(file, 'utf8'), { ecmaVersion: 5, sourceType: 'script' });
  }
});

test('HTML loads ordered classic scripts and contains no external runtime services', () => {
  const html = readFileSync('src/index.html', 'utf8');
  assert.ok(html.indexOf('src="{{GAME}}"') < html.indexOf('src="{{APP}}"'));
  assert.doesNotMatch(html, /type="module"|\basync\b|https?:\/\//);
});

test('layout does not depend on CSS features missing in the 2019 browser targets', () => {
  const css = readFileSync('src/styles.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(css, /\b(?:clamp|min|max|var)\(|(?:^|[;{])\s*(?:gap|row-gap|column-gap)\s*:|:has\(/);
});
