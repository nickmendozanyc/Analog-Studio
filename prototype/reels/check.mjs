// Headless check: loads the page (three.js served from node_modules), drives the transport and
// saves screenshots. Software WebGL here is slow, so fps numbers from this script are meaningless.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
const here = new URL('.', import.meta.url);
const out = process.argv[2] || new URL('dist/', here).pathname;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', (route) => {
  const p = new URL(route.request().url()).pathname.replace('/npm/three@0.160.0/', '');
  route.fulfill({ body: readFileSync(new URL(`node_modules/three/${p}`, here)), contentType: 'application/javascript' });
});
await page.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
await page.goto(new URL('dist/jh24-reels-local.html', here).href);
await page.waitForFunction(() => window.__jh24, null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/shot-stop.png` });
await page.evaluate(() => window.__jh24.setMode('play'));
await page.waitForTimeout(1500);
const a0 = await page.evaluate(() => [window.__jh24.reels[0].shaderAngle, window.__jh24.reels[1].shaderAngle]);
await page.waitForTimeout(1000);
const a1 = await page.evaluate(() => [window.__jh24.reels[0].shaderAngle, window.__jh24.reels[1].shaderAngle]);
// positive change = counter-clockwise seen from above
console.log('play rotation (seen from above):', 'supply', a1[0] > a0[0] ? 'CCW' : 'CW', '| take-up', a1[1] > a0[1] ? 'CCW' : 'CW');
await page.screenshot({ path: `${out}/shot-play.png` });
await page.evaluate(() => { const j = window.__jh24; j.tr.locate(j.tr.total * 0.5); j.setMode('ff'); });
await page.waitForTimeout(5000);
await page.screenshot({ path: `${out}/shot-wind.png` });
await page.evaluate(() => { const j = window.__jh24; j.tr.locate(j.tr.total); });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/shot-tail.png` });
const st = await page.evaluate(() => { const t = window.__jh24.tr; return { mode: t.mode, v: t.v, lift: t.lift, take: t.take }; });
console.log('state after wind:', st);
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
