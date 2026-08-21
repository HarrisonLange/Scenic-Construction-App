const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const routes = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, entry.name, 'index.html')))
  .map((entry) => `${entry.name}/`)
  .sort();

const skip = /(?:delete|reset|clear|new |start over|remove|export|download|print|certificate|save as|open|import|upload|copy|share|back|labs|add file|audio file)/i;

function installedBrowser() {
  return [
    process.env.PLAYWRIGHT_BROWSER_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean).find((candidate) => fs.existsSync(candidate));
}

(async () => {
  const executablePath = installedBrowser();
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const results = [];
  try {
    for (const route of routes) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('dialog', (dialog) => dialog.dismiss());
      await page.goto(`http://127.0.0.1:8099/${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(700);
      const routeUrl = page.url();

      let tested = 0;
      for (let pass = 0; pass < 2; pass += 1) {
        if (page.url() !== routeUrl) break;
        let controls;
        try {
          controls = await page.locator('button:visible, [role="tab"]:visible').elementHandles();
        } catch (error) {
          if (/execution context was destroyed|navigation/i.test(error.message)) break;
          throw error;
        }
        for (const control of controls.slice(0, 100)) {
          let descriptor;
          try {
            descriptor = await control.evaluate((element) => [
              element.textContent,
              element.getAttribute('title'),
              element.getAttribute('aria-label'),
              element.id,
            ].filter(Boolean).join(' '));
          } catch (error) {
            continue;
          }
          if (skip.test(descriptor)) continue;
          try {
            await control.evaluate((element) => element.click());
            tested += 1;
            await page.waitForTimeout(20);
          } catch (error) {
            if (!/detached|not connected/i.test(error.message)) errors.push(`Control "${descriptor.slice(0, 60)}": ${error.message}`);
          }
        }
      }
      await page.waitForTimeout(300);
      results.push({ route, controlsTested: tested, errors: [...new Set(errors)] });
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
