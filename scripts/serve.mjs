import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function serve(directory, port = 0) {
  const root = resolve(directory);
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const base = html.match(/<base href="([^"]+)"/)[1];
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon' };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (!pathname.startsWith(base)) throw new Error('Wrong base');
      let file = resolve(root, pathname.slice(base.length));
      if (file !== root && !file.startsWith(root + sep)) throw new Error('Outside root');
      if ((await stat(file)).isDirectory()) {
        if (!pathname.endsWith('/')) {
          response.writeHead(301, { Location: pathname + '/' });
          response.end();
          return;
        }
        file = resolve(file, 'index.html');
      }
      const content = await readFile(file);
      response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  return { server, base, origin: `http://127.0.0.1:${server.address().port}` };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const site = await serve(process.argv[2] || 'dist/netlify', Number(process.argv[3]) || 4200);
  console.log(`Preview: ${site.origin}${site.base}`);
}
