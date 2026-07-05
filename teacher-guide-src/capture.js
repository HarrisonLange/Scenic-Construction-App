/* Captures "working" screenshots of every SDSCPA lab via Playwright + installed Chrome. */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:8099/";
const OUT = path.join(__dirname, "shots");
fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function shoot(page, name) {
  await page.screenshot({ path: path.join(OUT, name + ".png") });
  console.log("  ✓", name + ".png");
}

/* Each step wrapped so one failure doesn't kill the run */
async function safely(label, fn) {
  try { await fn(); } catch (e) { console.log("  ! " + label + ": " + e.message.split("\n")[0]); }
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 880 },
    deviceScaleFactor: 1.5
  });
  const page = await ctx.newPage();
  page.on("dialog", d => d.accept());          // auto-accept confirm() dialogs

  /* ── hub ─────────────────────────────────────────── */
  console.log("hub");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await sleep(600);
  await shoot(page, "hub");

  /* ── scenic: training mid-build (Broadway flat) ──── */
  console.log("scenic");
  await page.goto(BASE + "scenic/", { waitUntil: "networkidle" });
  await sleep(1200);
  await safely("skip tour", async () => {
    const skip = page.locator("#tourSkip");
    if (await skip.isVisible()) { await skip.click(); await sleep(400); }
  });
  await safely("training", async () => {
    await page.click("#trainBtn");
    await sleep(500);
    await page.click('#trainChooser button[data-style="broadway"]');
    await sleep(700);
    for (let i = 0; i < 4; i++) { await page.click("#trainNext"); await sleep(450); }
  });
  await sleep(800);
  await shoot(page, "scenic");

  /* ── draftinglab: draw a platform + dimension ────── */
  console.log("draftinglab");
  await page.goto(BASE + "draftinglab/", { waitUntil: "networkidle" });
  await sleep(1200);
  const cv = page.locator("#cv");
  const box = await cv.boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await safely("rect", async () => {
    await page.click('.tool-btn[data-tool="rect"]');
    await page.mouse.move(cx - 180, cy - 70);
    await page.mouse.down();
    await page.mouse.move(cx + 180, cy + 70, { steps: 12 });
    await page.mouse.up();
    await sleep(400);
  });
  await safely("dimension", async () => {
    await page.click('.tool-btn[data-tool="dimension"]');
    await page.mouse.move(cx - 180, cy - 70);
    await page.mouse.down();
    await page.mouse.move(cx + 180, cy - 70, { steps: 10 });
    await page.mouse.up();
    await sleep(400);
  });
  await safely("circle", async () => {
    await page.click('.tool-btn[data-tool="circle"]');
    await page.mouse.move(cx + 330, cy + 180);
    await page.mouse.down();
    await page.mouse.move(cx + 400, cy + 180, { steps: 8 });
    await page.mouse.up();
    await sleep(400);
  });
  await shoot(page, "draftinglab");

  /* ── designlab: furnish the stage ────────────────── */
  console.log("designlab");
  await page.goto(BASE + "designlab/", { waitUntil: "networkidle" });
  await sleep(1200);
  await safely("add pieces", async () => {
    const items = page.locator(".pal-item");
    const n = await items.count();
    // add up to 6 distinct pieces (walls/furniture/actors depending on palette order)
    for (const idx of [0, 1, 2, 3, 4, 5]) {
      if (idx < n) { await items.nth(idx).click(); await sleep(350); }
    }
  });
  await sleep(900);
  await shoot(page, "designlab");

  /* ── lighting: default look, then GO a cue ───────── */
  console.log("lighting");
  await page.goto(BASE + "lighting/", { waitUntil: "networkidle" });
  await sleep(1600);
  await safely("go", async () => {
    await page.click("#goBtn");
    await sleep(3200);                      // let the fade land
  });
  await shoot(page, "lighting");

  /* ── lighting-people: Rembrandt preset on 3D head ── */
  console.log("lighting-people");
  await page.goto(BASE + "lighting-people/", { waitUntil: "networkidle" });
  await sleep(3500);                        // STL head + three.js warm-up
  await safely("preset", async () => {
    const btn = page.locator("#presetGrid button", { hasText: "Rembrandt" }).first();
    await btn.click();
    await sleep(1500);
  });
  await shoot(page, "lighting-people");

  /* ── studiolab: noir preset then three-point ─────── */
  console.log("studiolab");
  await page.goto(BASE + "studiolab/", { waitUntil: "networkidle" });
  await sleep(1600);
  await safely("preset", async () => {
    await page.click('.preset[data-preset="threePoint"]');
    await sleep(1400);
  });
  await shoot(page, "studiolab");

  /* ── sound: scenario + place & test a speech system ─ */
  console.log("sound");
  await page.goto(BASE + "sound/", { waitUntil: "networkidle" });
  await sleep(1400);
  await safely("scenario", async () => {
    await page.click("#startScenarioButton");
    await sleep(700);
  });
  const scv = await page.locator("canvas").first().boundingBox();
  const P = (fx, fy) => ({ x: scv.x + scv.width * fx, y: scv.y + scv.height * fy });
  const place = async (equip, fx, fy) => {
    await page.click('[data-equipment="' + equip + '"]');
    await sleep(250);
    const pt = P(fx, fy);
    await page.mouse.click(pt.x, pt.y);
    await sleep(350);
  };
  await safely("place gear", async () => {
    await place("wired-microphone", 0.30, 0.22);   // on stage
    await place("mixer", 0.66, 0.24);              // FOH
    await place("powered-speaker", 0.18, 0.40);    // house left
    await place("powered-speaker", 0.52, 0.40);    // house right
    await place("wall-outlet", 0.40, 0.55);
  });
  await safely("test", async () => {
    await page.click("#testButton");
    await sleep(900);
  });
  await shoot(page, "sound");

  /* ── soundcues: practice sounds + cues + tutorial ── */
  console.log("soundcues");
  await page.goto(BASE + "soundcues/", { waitUntil: "networkidle" });
  await sleep(1400);
  await safely("practice sounds", async () => {
    await page.click("#practiceSndBtn");
    await sleep(1800);
  });
  await safely("add cues", async () => {
    await page.click('.add-btn[data-add="audio"]'); await sleep(300);
    await page.click('.add-btn[data-add="fade"]');  await sleep(300);
    await page.click('.add-btn[data-add="audio"]'); await sleep(300);
    await page.click('.add-btn[data-add="wait"]');  await sleep(300);
  });
  await sleep(600);
  await shoot(page, "soundcues");

  /* ── linemixing: practice run in progress ────────── */
  console.log("linemixing");
  await page.goto(BASE + "linemixing/", { waitUntil: "networkidle" });
  await sleep(1400);
  await safely("start", async () => {
    await page.click("#ovStart");
    await sleep(4200);                       // countdown (3s) + first lines
    await page.keyboard.down("z");           // ride a fader
    await sleep(900);
  });
  await shoot(page, "linemixing");
  await safely("release", async () => { await page.keyboard.up("z"); });

  /* ── costume: dress a figure, show a brief ───────── */
  console.log("costume");
  await page.goto(BASE + "costume/", { waitUntil: "networkidle" });
  await sleep(1200);
  await safely("add character", async () => {
    await page.click("#addBtn");
    await sleep(400);
    const pose = page.locator("#poseGrid .pose-opt").first();
    if (await pose.count()) await pose.click();
    await sleep(250);
    await page.click("#addConfirm");
    await sleep(600);
  });
  await safely("dress", async () => {
    // walk a few wardrobe tabs, adding the first garment from each
    const tabs = page.locator("#catTabs .cat-tab");
    const nTabs = await tabs.count();
    for (let t = 0; t < Math.min(nTabs, 5); t++) {
      await tabs.nth(t).click();
      await sleep(300);
      const cell = page.locator("#grid > *").first();
      if (await cell.count()) { await cell.click(); await sleep(350); }
    }
  });
  await safely("brief", async () => {
    await page.click("#briefBtn");
    await sleep(700);
  });
  await shoot(page, "costume");

  await browser.close();
  console.log("done");
})();
