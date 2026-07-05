/* Re-captures studiolab (skip tour first) and costume (dress with real garments). */
const { chromium } = require("playwright-core");
const path = require("path");

const BASE = "http://localhost:8099/";
const OUT = path.join(__dirname, "shots");
const sleep = ms => new Promise(r => setTimeout(r, ms));
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
  page.on("dialog", d => d.accept());

  /* ── studiolab: skip tour, apply noir then three-point ── */
  console.log("studiolab");
  await page.goto(BASE + "studiolab/", { waitUntil: "networkidle" });
  await sleep(1600);
  await safely("skip tour", async () => {
    const skip = page.getByText("Skip tour", { exact: true }).first();
    if (await skip.isVisible()) { await skip.click(); await sleep(500); }
  });
  await safely("preset", async () => {
    await page.click('.preset[data-preset="noir"]');
    await sleep(1200);
    await page.click('.preset[data-preset="threePoint"]');
    await sleep(1600);
  });
  await page.screenshot({ path: path.join(OUT, "studiolab.png") });
  console.log("  ✓ studiolab.png");

  /* ── costume: add character, name it, dress with real garments, open brief ── */
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
  await safely("name", async () => {
    await page.fill("#cpName", "Capt. Silver");
    await page.dispatchEvent("#cpName", "input");
    await page.fill("#cpScene", "Act I — deck");
    await page.dispatchEvent("#cpScene", "input");
    await sleep(300);
  });
  await safely("dress", async () => {
    const tabs = page.locator("#catTabs .cat-tab");
    const nTabs = await tabs.count();
    for (let t = 0; t < nTabs; t++) {
      const label = (await tabs.nth(t).innerText()).toLowerCase();
      if (label.includes("dress")) continue;            // top+bottom look, skip dresses
      await tabs.nth(t).click();
      await sleep(300);
      // skip the "None" cell; pick the 2nd or 3rd garment
      const cells = page.locator("#grid > *");
      const n = await cells.count();
      if (n > 2) { await cells.nth(label.includes("top") ? 2 : 1).click(); await sleep(350); }
    }
  });
  await safely("brief", async () => {
    await page.click("#briefBtn");
    await sleep(700);
  });
  await page.screenshot({ path: path.join(OUT, "costume.png") });
  console.log("  ✓ costume.png");

  await browser.close();
  console.log("done");
})();
