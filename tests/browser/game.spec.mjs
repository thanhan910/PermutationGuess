import { test, expect } from '@playwright/test';
import { serve } from '../../scripts/serve.mjs';
import game from '../../src/game.js';

for (const target of ['netlify', 'github']) {
  test.describe(target, () => {
    let site;
    test.beforeAll(async () => { site = await serve(`dist/${target}`); });
    test.afterAll(async () => { await new Promise(resolve => site.server.close(resolve)); });
    test.beforeEach(async ({ page }, info) => {
      await page.addInitScript(legacy => {
        Math.random = () => 0; // Answer is the initial order rotated one place left.
        if (legacy) {
          delete Object.hasOwn;
          delete Object.fromEntries;
          delete Array.prototype.at;
          delete Array.prototype.flat;
          delete Array.prototype.flatMap;
          delete String.prototype.replaceAll;
          window.ResizeObserver = undefined;
          window.structuredClone = undefined;
          window.queueMicrotask = undefined;
          window.PointerEvent = undefined;
          window.fetch = undefined;
          window.Promise = undefined;
        }
      }, info.project.name === 'legacy-apis');
      page.on('pageerror', error => { throw error; });
    });

    test('all routes, size links, feedback, final loss and reset', async ({ page }) => {
      for (const path of ['', '5/', '6/', '7/', '8/']) {
        const size = Number(path[0]) || 5;
        const response = await page.goto(site.origin + site.base + path);
        expect(response.status()).toBe(200);
        await expect(page).toHaveTitle(`${size} items - Permutation Guessing Game`);
        await expect(page.locator('.game-box')).toHaveText(game.ITEMS.slice(0, size));
        await expect(page.locator('[aria-current="page"]')).toHaveText(String(size));
        await expect(page.locator('.size-link')).toHaveCount(4);
        for (const option of game.SIZES) {
          await expect(page.getByRole('link', { name: `${option} items, ${game.BUDGETS[option]} guesses`, exact: true })).toHaveAttribute('href', `${option}/`);
        }
        for (let i = 1; i <= game.BUDGETS[size]; i++) {
          await page.locator('#submitGuess').click();
          await expect(page.locator('#guessLog > div')).toHaveCount(i);
          if (i === game.BUDGETS[size] - 1) await expect(page.locator('#remaining')).toHaveText('You have 1 guess left.');
        }
        await expect(page.locator('#result')).toContainText('Game over!');
        await expect(page.locator('#submitGuess')).toBeHidden();
        await page.locator('#resetButton').click();
        await expect(page.locator('#guessLog')).toBeEmpty();
        await expect(page.locator('#result')).toBeHidden();
        await expect(page.locator('#remaining')).toHaveText(`You have ${game.BUDGETS[size]} guesses left.`);
      }
      await page.getByRole('link', { name: '6 items, 7 guesses', exact: true }).click();
      await expect(page).toHaveURL(site.origin + site.base + '6/');
      await expect(page.locator('.game-box')).toHaveCount(6);
      await page.reload();
      await expect(page.locator('.game-box')).toHaveCount(6);
    });

    test('keyboard reorder wins on the final guess', async ({ page }) => {
      await page.goto(site.origin + site.base);
      for (let i = 0; i < 5; i++) await page.locator('#submitGuess').click();
      await page.locator('.game-box').first().focus();
      for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
      await expect(page.locator('.game-box')).toHaveText(['Banana', 'Grape', 'Orange', 'Pear', 'Apple']);
      await page.locator('#submitGuess').click();
      await expect(page.locator('#result')).toContainText('You guessed correctly!');
      await expect(page.locator('#result')).not.toContainText('Game over');
      await expect(page.locator('#submitGuess')).toBeHidden();
      await page.locator('#resetButton').click();
      await expect(page.locator('.game-box')).toHaveText(game.ITEMS.slice(0, 5));
    });

    test('mouse drag reorders both directions and submits the displayed order', async ({ page }) => {
      await page.goto(site.origin + site.base);
      let first = await page.locator('.game-box').first().boundingBox();
      let last = await page.locator('.game-box').last().boundingBox();
      await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
      await page.mouse.down();
      await page.mouse.move(last.x + last.width * 0.75, last.y + last.height / 2, { steps: 12 });
      await page.mouse.up();
      await expect(page.locator('.game-box')).toHaveText(['Banana', 'Grape', 'Orange', 'Pear', 'Apple']);
      await page.locator('#submitGuess').click();
      await expect(page.locator('#result')).toContainText('You guessed correctly!');
      first = await page.locator('.game-box').first().boundingBox();
      last = await page.locator('.game-box').last().boundingBox();
      await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2);
      await page.mouse.down();
      await page.mouse.move(first.x + first.width * 0.25, first.y + first.height / 2, { steps: 12 });
      await page.mouse.up();
      await expect(page.locator('.game-box')).toHaveText(game.ITEMS.slice(0, 5));
      await expect(page.locator('.drag-preview')).toHaveCount(0);
    });

    test('touch drag, cancellation and narrow-screen layout', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(site.origin + site.base + '8/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const initial = game.ITEMS.slice();
      async function gesture(cancelled) {
        await page.evaluate(cancelled => {
          const nodes = document.querySelectorAll('.game-box');
          const a = nodes[0].getBoundingClientRect();
          const b = nodes[2].getBoundingClientRect();
          function send(type, x, y) {
            const event = document.createEvent('Event');
            event.initEvent(type, true, true);
            const touch = { identifier: 7, clientX: x, clientY: y, target: nodes[0] };
            event.touches = type === 'touchend' || type === 'touchcancel' ? [] : [touch];
            event.changedTouches = [touch];
            nodes[0].dispatchEvent(event);
          }
          send('touchstart', a.left + a.width / 2, a.top + a.height / 2);
          send('touchmove', b.left + b.width * 0.75, b.top + b.height / 2);
          send(cancelled ? 'touchcancel' : 'touchend', b.left + b.width * 0.75, b.top + b.height / 2);
        }, cancelled);
      }
      await gesture(true);
      await expect(page.locator('.game-box')).toHaveText(initial);
      await gesture(false);
      await expect(page.locator('.game-box')).toHaveText(['Banana', 'Grape', 'Apple', ...initial.slice(3)]);
      await expect(page.locator('.drag-preview')).toHaveCount(0);
      await page.locator('#submitGuess').click();
      await expect(page.locator('#guessLog')).toContainText('Banana, Grape, Apple, Orange, Pear, Berry, Lime, Kiwi');
    });

    test('static game and navigation remain visible before JavaScript runs', async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(site.origin + site.base + '7/');
      await expect(page.locator('.game-box')).toHaveCount(7);
      await expect(page.locator('noscript p')).toHaveText('Enable JavaScript to play this game.');
      await context.close();
    });
  });
}
