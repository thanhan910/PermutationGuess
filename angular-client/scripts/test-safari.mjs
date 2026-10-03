// Exercise the actual production bundles, including polyfill execution order.
// WebKit is not an old iOS simulator: removing hasOwn reproduces the missing
// runtime API, while .browserslistrc handles older Safari's JavaScript syntax.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit, devices } from 'playwright';

const root = fileURLToPath(new URL('../dist/angular/browser/', import.meta.url));
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const basePath = html.match(/<base href="([^"]+)"/)[1];
const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    assert.ok(pathname.startsWith(basePath));
    const relativePath = pathname.slice(basePath.length);
    const file = resolve(root, relativePath + (pathname.endsWith('/') ? 'index.html' : ''));
    assert.ok(file.startsWith(resolve(root) + sep));
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(file)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await webkit.launch();
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const missingHasOwn of [false, true]) {
    const context = await browser.newContext({ ...devices['iPhone 11'] });
    await context.addInitScript(missing => {
      window.originalHasOwn = Object.hasOwn;
      if (missing) delete Object.hasOwn;
    }, missingHasOwn);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    for (const path of ['', '5/', '6/', '7/', '8/']) {
      const size = Number(path.slice(0, 1)) || 5;
      await page.goto(origin + basePath + path);
      await page.locator('#submitGuess').waitFor();
      assert.equal(await page.locator('.game-box').count(), size);
      await page.locator('#submitGuess').tap();
      await page.getByText('Guess #1:', { exact: false }).waitFor();
      await page.locator('#resetButton').tap();
      await page.getByText('Guess #1:', { exact: false }).waitFor({ state: 'hidden' });
      assert.equal(await page.locator('.game-box').count(), size);
      assert.ok(await page.evaluate(missing => {
        const object = Object.create({ inherited: true });
        object.own = undefined;
        object.hasOwnProperty = null;
        const key = Symbol('key');
        object[key] = true;
        return Object.hasOwn(object, 'own') && !Object.hasOwn(object, 'inherited') &&
          Object.hasOwn(object, key) && !Object.keys(Object).includes('hasOwn') &&
          (missing || Object.hasOwn === window.originalHasOwn);
      }, missingHasOwn));
      assert.deepEqual(errors, [], `Browser errors on ${basePath + path}`);
    }
    await context.close();
    console.log(`WebKit: all sizes load, submit and reset ${missingHasOwn ? 'without native Object.hasOwn' : 'with native APIs'}.`);
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
