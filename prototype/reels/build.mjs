// Inlines physics.js into the page so it is a single self-contained file.
//   dist/jh24-reels.html        fragment for publishing as an artifact (no <html>/<head>/<body> wrapper)
//   dist/jh24-reels-local.html  full document to open directly in a browser
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const here = new URL('.', import.meta.url);
const physics = readFileSync(new URL('physics.js', here), 'utf8').replace(/^export /gm, '');
const page = readFileSync(new URL('index.src.html', here), 'utf8').replace('/*@@PHYSICS@@*/', physics);
mkdirSync(new URL('dist/', here), { recursive: true });
writeFileSync(new URL('dist/jh24-reels.html', here), page);
writeFileSync(new URL('dist/jh24-reels-local.html', here), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>\n${page}\n</body></html>\n`);
console.log('built dist/jh24-reels.html and dist/jh24-reels-local.html');
