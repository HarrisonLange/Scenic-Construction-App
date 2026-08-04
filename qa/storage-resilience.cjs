const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const routes = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, entry.name, 'index.html')))
  .map((entry) => `${entry.name}/`)
  .sort();
const executablePath = [
  process.env.PLAYWRIGHT_BROWSER_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find((candidate) => fs.existsSync(candidate));

(async () => {
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const results = [];
  try {
    for (const route of routes) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      await context.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          configurable: true,
          get() { throw new DOMException('Storage disabled for test', 'SecurityError'); },
        });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(`http://127.0.0.1:8099/${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);
      results.push({ route, errors: [...new Set(errors)] });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(results, null, 2));
  process.exitCode = results.some((result) => result.errors.length) ? 1 : 0;
})().catch((error) => {
  console.error(error);
  process.exitCode = 2;
});
