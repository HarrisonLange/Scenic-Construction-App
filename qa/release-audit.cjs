const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const pages = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, entry.name, 'index.html')))
  .map((entry) => `${entry.name}/`)
  .sort();
pages.unshift('');

function localReferenceProblems() {
  const problems = [];
  for (const route of pages) {
    const file = path.join(root, route, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    const refs = [...html.matchAll(/<(?:a|audio|iframe|img|link|object|script|source)\b[^>]*?\b(?:href|src|data)\s*=\s*(["'])(.*?)\1/gis)]
      .map((match) => match[2].trim());
    for (const ref of refs) {
      if (!ref || /^(?:#|blob:|data:|https?:|mailto:|tel:|javascript:|\$\{)/i.test(ref) || /['"]\s*\+|\+\s*['"]/.test(ref)) continue;
      const clean = decodeURIComponent(ref.split(/[?#]/, 1)[0]);
      const target = path.resolve(path.dirname(file), clean);
      const exists = fs.existsSync(target) || fs.existsSync(path.join(target, 'index.html'));
      if (!exists) problems.push(`${route || '/'}: missing local reference ${ref}`);
    }
  }
  return problems;
}

async function inspectPage(page, route, viewportName) {
  const runtime = [];
  page.on('pageerror', (error) => runtime.push(`page error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') runtime.push(`console error: ${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!/^(?:data|blob):/.test(url)) runtime.push(`request failed: ${url} (${request.failure()?.errorText || 'unknown'})`);
  });
  page.on('dialog', (dialog) => dialog.dismiss());

  const response = await page.goto(`http://127.0.0.1:8099/${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  await page.waitForTimeout(800);
  if (!response || response.status() >= 400) runtime.push(`HTTP status ${response?.status() || 'none'}`);

  const checks = await page.evaluate(() => {
    const text = (element) => (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || '').trim();
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    const unnamedControls = [...document.querySelectorAll('button, a[href], [role="button"], [role="tab"]')]
      .filter(visible)
      .filter((element) => !text(element) && !element.querySelector('img[alt], svg[aria-label], [aria-label]'))
      .map((element) => element.outerHTML.slice(0, 140));
    const unlabeledInputs = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')]
      .filter(visible)
      .filter((element) => {
        if (element.matches('[aria-label], [aria-labelledby]')) return false;
        if (element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`)) return false;
        return !element.closest('label');
      })
      .map((element) => element.outerHTML.slice(0, 140));
    const badAriaRefs = [...document.querySelectorAll('[aria-labelledby], [aria-describedby]')]
      .flatMap((element) => ['aria-labelledby', 'aria-describedby'].flatMap((attribute) => {
        const value = element.getAttribute(attribute);
        if (!value) return [];
        const missing = value.split(/\s+/).filter((id) => !document.getElementById(id));
        return missing.map((id) => `${attribute} references missing #${id}`);
      }));
    return {
      title: document.title,
      lang: document.documentElement.lang,
      viewport: document.querySelector('meta[name="viewport"]')?.content || '',
      h1Count: document.querySelectorAll('h1').length,
      duplicates,
      unnamedControls,
      unlabeledInputs,
      badAriaRefs,
      imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
      iframesWithoutTitle: document.querySelectorAll('iframe:not([title])').length,
      positiveTabindex: document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    };
  });

  const issues = [...new Set(runtime)];
  if (!checks.title) issues.push('missing document title');
  if (!checks.lang) issues.push('missing document language');
  if (!checks.viewport) issues.push('missing viewport metadata');
  if (checks.h1Count !== 1) issues.push(`expected one h1, found ${checks.h1Count}`);
  if (checks.duplicates.length) issues.push(`duplicate IDs: ${checks.duplicates.join(', ')}`);
  if (checks.unnamedControls.length) issues.push(`${checks.unnamedControls.length} visible controls lack accessible names`);
  if (checks.unlabeledInputs.length) issues.push(`${checks.unlabeledInputs.length} visible form controls lack labels`);
  if (checks.badAriaRefs.length) issues.push(...checks.badAriaRefs);
  if (checks.imagesWithoutAlt) issues.push(`${checks.imagesWithoutAlt} images lack alt attributes`);
  if (checks.iframesWithoutTitle) issues.push(`${checks.iframesWithoutTitle} iframes lack titles`);
  if (checks.positiveTabindex) issues.push(`${checks.positiveTabindex} elements use positive tabindex`);
  if (checks.horizontalOverflow) issues.push('horizontal page overflow');
  return { route: route || '/', viewport: viewportName, issues, details: checks };
}

(async () => {
  const report = { generatedAt: new Date().toISOString(), localReferences: localReferenceProblems(), pages: [] };
  const installedBrowsers = [
    process.env.PLAYWRIGHT_BROWSER_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const executablePath = installedBrowsers.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    for (const [viewportName, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } })) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      for (const route of pages) {
        const page = await context.newPage();
        report.pages.push(await inspectPage(page, route, viewportName));
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(report, null, 2));
  const failures = report.localReferences.length + report.pages.reduce((sum, entry) => sum + entry.issues.length, 0);
  process.exitCode = failures ? 1 : 0;
})().catch((error) => {
  console.error(error);
  process.exitCode = 2;
});
