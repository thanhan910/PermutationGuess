// An opt-in real Chromium 77 check. Modern Playwright's protocol requires a
// newer browser, so use the small, stable CDP subset available in 2019.
// The caller supplies the archived executable; nothing is downloaded here.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { serve } from '../scripts/serve.mjs';
import game from '../src/game.js';

const executable = process.env.CHROMIUM_LEGACY_BIN;
if (!executable) throw new Error('Set CHROMIUM_LEGACY_BIN to an archived Chromium 77 executable.');
const profile = await mkdtemp(join(tmpdir(), 'permutation-legacy-'));
const child = spawn(resolve(executable), [
  '--headless', '--disable-gpu', '--no-first-run', '--disable-background-networking',
  '--disable-component-update', '--disable-sync', '--disable-default-apps',
  '--host-resolver-rules=MAP * 0.0.0.0, EXCLUDE 127.0.0.1',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
const exited = once(child, 'exit');
let socket;
let site;
try {
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Chromium did not start within 15 seconds')), 15000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', () => { clearTimeout(timer); reject(new Error('Chromium exited before debugger startup')); });
    child.stderr.on('data', chunk => {
      output += chunk.toString();
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  socket = new WebSocket(endpoint);
  await once(socket, 'open');
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const callback = pending.get(message.id);
      if (callback) { pending.delete(message.id); callback(message); }
    } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
  });
  function send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const messageId = ++id;
      const timer = setTimeout(() => { pending.delete(messageId); reject(new Error(`${method} timed out`)); }, 10000);
      pending.set(messageId, response => {
        clearTimeout(timer);
        if (response.error) reject(new Error(JSON.stringify(response.error)));
        else resolve(response.result);
      });
      socket.send(JSON.stringify({ id: messageId, method, params, sessionId }));
    });
  }
  const version = await send('Browser.getVersion');
  assert.match(version.product, /(?:HeadlessChrome|Chrome)\/77\./);
  console.log(`Testing actual ${version.product}`);
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const command = (method, params) => send(method, params, sessionId);
  async function evaluate(expression) {
    const response = await command('Runtime.evaluate', { expression, returnByValue: true });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  }
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Page.addScriptToEvaluateOnNewDocument', { source: 'Math.random = function () { return 0; };' });
  await command('Emulation.setDeviceMetricsOverride', { width: 414, height: 896, deviceScaleFactor: 1, mobile: true });
  await command('Emulation.setTouchEmulationEnabled', { enabled: true });
  for (const target of ['netlify', 'github']) {
    site = await serve(`dist/${target}`);
    for (const path of ['', '5/', '6/', '7/', '8/']) {
      const size = Number(path[0]) || 5;
      await command('Page.navigate', { url: site.origin + site.base + path });
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        ready = await evaluate('document.readyState === "complete" && !!window.PermutationGame && document.querySelectorAll(".game-box").length === ' + size);
        if (ready) break;
        await delay(50);
      }
      assert.ok(ready, 'Game did not load');
      assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'));
      const points = await evaluate('(function () { var b = document.querySelectorAll(".game-box"), a = b[0].getBoundingClientRect(), z = b[b.length-1].getBoundingClientRect(); return {x:a.left+a.width/2,y:a.top+a.height/2,end:z.left+z.width*0.75}; }())');
      // Native touch input goes through the browser, rather than invoking game methods.
      await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: points.x, y: points.y }] });
      await command('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: points.end, y: points.y }] });
      await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const order = await evaluate('Array.prototype.map.call(document.querySelectorAll(".game-box"),function (b) { return b.textContent; })');
      assert.deepEqual(order, [...game.ITEMS.slice(1, size), game.ITEMS[0]]);
      await evaluate('document.getElementById("submitGuess").click()');
      assert.match(await evaluate('document.getElementById("resultText").textContent'), /You guessed correctly!/);
      await evaluate('document.getElementById("resetButton").click()');
      for (let i = 0; i < game.BUDGETS[size]; i++) await evaluate('document.getElementById("submitGuess").click()');
      assert.match(await evaluate('document.getElementById("resultText").textContent'), /Game over!/);
      assert.deepEqual(errors, []);
      console.log(`${target} ${path || '/'}: loaded, touch reordered, won, reset and lost at the correct limit`);
    }
    await new Promise(resolve => site.server.close(resolve));
    site = null;
  }
  await send('Browser.close');
} finally {
  socket?.close();
  if (child.exitCode === null) child.kill();
  await exited;
  if (site) await new Promise(resolve => site.server.close(resolve));
  // Only delete the temporary profile created by this process.
  if (resolve(profile).startsWith(resolve(tmpdir()) + sep + 'permutation-legacy-')) {
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
