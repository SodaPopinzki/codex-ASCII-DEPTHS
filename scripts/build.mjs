import { mkdir, rm, cp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(new URL('../src/', import.meta.url), new URL('../dist/src/', import.meta.url), { recursive: true });
await cp(new URL('../index.html', import.meta.url), new URL('../dist/index.html', import.meta.url));

const htmlPath = new URL('../dist/index.html', import.meta.url);
let html = await readFile(htmlPath, 'utf8');
html = html.replace('/src/main.js', './src/main.js');
html = html.replace('/src/styles/main.css', './src/styles/main.css');
await writeFile(htmlPath, html);

if (existsSync(new URL('../netlify.toml', import.meta.url))) {
  await cp(new URL('../netlify.toml', import.meta.url), new URL('../dist/netlify.toml', import.meta.url));
}

console.log('ASCII Depths build complete (static copy).');
