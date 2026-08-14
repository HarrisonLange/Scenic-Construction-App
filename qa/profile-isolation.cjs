const assert = require('assert');
const fs = require('fs');
const { chromium } = require('playwright');

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

async function signIn(page, studentId) {
  await page.locator('#sdscpa-student-id').fill(studentId);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('.sdscpa-profile-go').click(),
  ]);
  await page.locator('.sdscpa-profile-switch').waitFor();
}

async function switchProfile(page, studentId) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('.sdscpa-profile-switch').click(),
  ]);
  await signIn(page, studentId);
}

async function writeDbRecord(page, value) {
  await page.evaluate(async (recordValue) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('profile-isolation-test', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('records', { keyPath: 'id' });
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('records', 'readwrite');
        tx.objectStore('records').put({ id: 'current', value: recordValue });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  }, value);
}

async function readDbRecord(page) {
  return page.evaluate(async () => new Promise((resolve, reject) => {
    const request = indexedDB.open('profile-isolation-test', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('records', { keyPath: 'id' });
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('records', 'readonly');
      const get = tx.objectStore('records').get('current');
      get.onsuccess = () => { db.close(); resolve(get.result ? get.result.value : null); };
      get.onerror = () => reject(get.error);
    };
    request.onerror = () => reject(request.error);
  }));
}

(async () => {
  const executablePath = installedBrowser();
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__rawLocalStorageForTest = window.localStorage;
    window.__rawIndexedDBForTest = window.indexedDB;
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  try {
    await page.goto('http://127.0.0.1:8099/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    assert(await page.locator('.sdscpa-profile-gate').isVisible(), 'The login gate was not shown without an active profile.');
    assert.strictEqual(await page.locator('.sdscpa-profile-gate select, .sdscpa-profile-gate datalist').count(), 0, 'The login exposes a remembered-ID list.');
    assert.strictEqual(await page.locator('#sdscpa-student-id').getAttribute('autocomplete'), 'off');
    assert(await page.locator('.sdscpa-profile-local').isVisible(), 'The Local only option was not shown.');
    assert.match(await page.locator('.sdscpa-profile-warning').innerText(), /may be lost/i, 'Local-only mode does not warn that work may be lost.');

    await page.evaluate(async () => {
      __rawLocalStorageForTest.setItem('legacy-project', 'existing student work');
      await new Promise((resolve, reject) => {
        const request = __rawIndexedDBForTest.open('soundCueLab', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('audio', { keyPath: 'id' });
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('audio', 'readwrite');
          tx.objectStore('audio').put({ id: 'legacy-audio', blob: new Blob(['audio']) });
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
      });
    });

    await signIn(page, 'STUDENT-1001');
    const migrated = await page.evaluate(async () => {
      const local = localStorage.getItem('legacy-project');
      const audio = await new Promise((resolve, reject) => {
        const request = indexedDB.open('soundCueLab', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('audio', { keyPath: 'id' });
        request.onsuccess = () => {
          const db = request.result;
          const get = db.transaction('audio', 'readonly').objectStore('audio').get('legacy-audio');
          get.onsuccess = () => { db.close(); resolve(!!get.result); };
          get.onerror = () => reject(get.error);
        };
        request.onerror = () => reject(request.error);
      });
      return { local, audio };
    });
    assert.deepStrictEqual(migrated, { local: 'existing student work', audio: true }, 'Existing browser data was not assigned to the first profile.');

    const completionSync = page.waitForResponse((response) => response.url().endsWith('/api/progress/complete'));
    await page.evaluate(() => {
      localStorage.setItem('student-project', 'Student A project');
      SDSCPA.markDone('safety', { score: 100 });
    });
    assert.strictEqual((await completionSync).status(), 200, 'Student A progress did not sync to the server.');
    await writeDbRecord(page, 'Student A audio');

    await switchProfile(page, 'STUDENT-2002');
    const studentBInitial = await page.evaluate(() => ({
      project: localStorage.getItem('student-project'),
      progress: SDSCPA.getProgress(),
    }));
    assert.strictEqual(studentBInitial.project, null, 'Student B could see Student A localStorage data.');
    assert.deepStrictEqual(studentBInitial.progress, {}, 'Student B could see Student A completion progress.');
    assert.strictEqual(await readDbRecord(page), null, 'Student B could see Student A IndexedDB data.');
    await page.evaluate(() => localStorage.setItem('student-project', 'Student B project'));
    await writeDbRecord(page, 'Student B audio');

    await switchProfile(page, 'STUDENT-1001');
    assert.strictEqual(await page.evaluate(() => localStorage.getItem('student-project')), 'Student A project');
    assert.strictEqual(await readDbRecord(page), 'Student A audio');
    assert.strictEqual((await page.evaluate(() => SDSCPA.getProgress())).safety.score, 100);

    const transferContext = await browser.newContext();
    const transferPage = await transferContext.newPage();
    await transferPage.goto('http://127.0.0.1:8099/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await signIn(transferPage, 'STUDENT-1001');
    assert.strictEqual((await transferPage.evaluate(() => SDSCPA.getProgress())).safety.score, 100, 'Progress did not transfer to a new browser context with the same ID.');
    await transferContext.close();

    for (const width of [320, 360, 390, 412, 430, 440]) {
      await page.setViewportSize({ width, height: 800 });
      const layout = await page.evaluate(() => {
        const button = document.querySelector('.sdscpa-profile-switch');
        const rect = button.getBoundingClientRect();
        return {
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          buttonLeft: rect.left,
          buttonRight: rect.right,
        };
      });
      assert(layout.documentWidth <= layout.viewportWidth + 2, `Profile controls caused horizontal overflow at ${width}px.`);
      assert(layout.buttonLeft >= 0 && layout.buttonRight <= width + 1, `Switch profile is clipped at ${width}px.`);
    }

    const raw = await page.evaluate(() => {
      const keys = [];
      for (let i = 0; i < __rawLocalStorageForTest.length; i += 1) keys.push(__rawLocalStorageForTest.key(i));
      return {
        keys,
        values: keys.map((key) => __rawLocalStorageForTest.getItem(key)),
        legacyStillPresent: __rawLocalStorageForTest.getItem('legacy-project'),
      };
    });
    const serializedRaw = JSON.stringify(raw);
    assert(!serializedRaw.includes('STUDENT-1001') && !serializedRaw.includes('STUDENT-2002'), 'A student ID was stored in browser data.');
    assert.strictEqual(raw.legacyStillPresent, null, 'Legacy data remained outside a profile namespace.');
    assert(!raw.keys.some((key) => /roster|student.*list|profile.*list/i.test(key)), 'A profile roster/list was created.');

    assert.deepStrictEqual(errors, [], `Profile pages emitted errors: ${errors.join('; ')}`);
    console.log(JSON.stringify({
      typedLoginRequired: true,
      rememberedIdList: false,
      localStorageIsolation: 'verified',
      indexedDbIsolation: 'verified',
      legacyDataMigration: 'verified',
      crossDeviceProgressTransfer: 'verified',
      studentIdsPersistedInBrowser: false,
    }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
