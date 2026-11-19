// Renders mockup/analog-studio-mockup.html to a 3840x2160 PNG with Playwright.
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const dir = path.join(__dirname, '..');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 3840, height: 2160 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(dir, 'analog-studio-mockup.html'), { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const out = process.argv[2] || path.join(dir, 'analog-studio-mockup-4k.png');
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 3840, height: 2160 } });
  await browser.close();
  console.log('rendered', out);
})();
