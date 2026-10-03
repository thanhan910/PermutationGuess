import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import game from '../src/game.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = process.argv[2] || 'netlify';
if (!['netlify', 'github'].includes(target)) throw new Error('Expected netlify or github');
const base = target === 'github' ? '/PermutationGuess/' : '/';
const dist = resolve(root, 'dist');
const output = resolve(dist, target);
if (!output.startsWith(dist + sep)) throw new Error('Build output must be inside dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const assets = {};
for (const [token, file] of Object.entries({ CSS: 'styles.css', GAME: 'game.js', APP: 'app.js' })) {
  const content = await readFile(resolve(root, 'src', file));
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  assets[token] = file.replace('.', `-${hash}.`);
  await writeFile(resolve(output, assets[token]), content);
}
await copyFile(resolve(root, 'public/favicon.ico'), resolve(output, 'favicon.ico'));
const template = await readFile(resolve(root, 'src/index.html'), 'utf8');
for (const path of ['', ...game.SIZES.map(String)]) {
  const size = Number(path) || 5;
  const tokens = {
    ...assets, SIZE: size, BASE: base, BUDGET: game.BUDGETS[size],
    NAV: game.SIZES.map(option => `<a class="size-link${option === size ? ' is-current' : ''}"${option === size ? ' aria-current="page"' : ''} title="${option} items in ${game.BUDGETS[option]} guesses" aria-label="${option} items, ${game.BUDGETS[option]} guesses" href="${option}/">${option}</a>`).join(''),
    ITEMS: game.ITEMS.slice(0, size).map((item, i) => `<div class="game-box" style="background-color: ${game.COLORS[i]}" tabindex="0" aria-describedby="reorderHelp">${item}</div>`).join(''),
  };
  const html = template.replace(/\{\{([A-Z]+)\}\}/g, (_, key) => {
    if (!(key in tokens)) throw new Error(`Unknown template token ${key}`);
    return tokens[key];
  });
  await mkdir(resolve(output, path), { recursive: true });
  await writeFile(resolve(output, path, 'index.html'), html);
}
console.log(`Built ${target}: five static pages in dist/${target}, base ${base}`);
