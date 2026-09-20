// Gives each puzzle size its own static page, so /5/, /6/, /7/ and /8/ are real
// files on both GitHub Pages and Netlify. Every page is the same bundle: the
// built index.html carries an absolute <base href>, and the app reads the size
// from the URL. Keep this list in sync with PUZZLE_SIZES in src/app/puzzle.ts.
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUZZLE_SIZES = [5, 6, 7, 8];

const browserDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'angular', 'browser');
const indexPage = join(browserDir, 'index.html');

for (const size of PUZZLE_SIZES) {
  const pageDir = join(browserDir, String(size));
  await mkdir(pageDir, { recursive: true });
  await copyFile(indexPage, join(pageDir, 'index.html'));
}

console.log(`Wrote ${PUZZLE_SIZES.length} size pages: ${PUZZLE_SIZES.join(', ')}`);
