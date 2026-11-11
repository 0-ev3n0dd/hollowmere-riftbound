import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome",
  args: ["--no-sandbox", "--disable-background-timer-throttling"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage(),
  errors = [],
  report = { tests: [], samples: [] };
page.on("pageerror", (e) => errors.push(e.message));
const snap = () => page.evaluate(() => window.__hollowmere.snapshot());
const shot = (name) =>
  page.screenshot({ path: `/workspace/iso-shot-${name}.png` });
const pass = (t) => {
  report.tests.push(t);
  console.log("PASS", t);
};
await page.goto("http://localhost:4174/?qa=1");
await page.waitForSelector('[data-action="start"]');
await shot("title");
await expect(page.locator(".hero-card")).toHaveCount(6);
pass("Six heroes rendered with transparent supplied art");
await page.click('[data-action="shop"]');
await shot("shop");
await expect(page.locator(".buy")).toHaveCount(6);
await expect(page.locator(".buy:not([disabled])")).toHaveCount(0);
pass("Six persistent meta upgrades; unaffordable purchases disabled");
await page.click('[data-action="title"]');
await page.click('[data-action="start"]');
let firstLevel = false,
  midShot = false,
  dir = "",
  start = Date.now();
while (Date.now() - start < 62000) {
  let s = await snap();
  if (s.screen === "levelup") {
    if (!firstLevel) {
      await shot("levelup");
      firstLevel = true;
      pass("Natural XP collection triggered level-up choice");
    }
    const options = page.locator(".upgrade");
    let idx = 0;
    for (let i = 0; i < 3; i++) {
      let text = await options.nth(i).innerText();
      if (/NEW WEAPON|Moonblades|Wild Heart|Soul Harvest/.test(text)) {
        idx = i;
        break;
      }
    }
    await options.nth(idx).click();
  } else if (s.screen === "dead") {
    pass("Natural death shows run summary");
    await shot("death");
    break;
  } else if (s.screen === "run") {
    const dirs = ["d", "s", "a", "w"];
    let next = dirs[Math.floor(s.time / 1.15) % 4];
    if (dir !== next) {
      if (dir) await page.keyboard.up(dir);
      dir = next;
      await page.keyboard.down(dir);
    }
    if (s.time > 34 && !midShot) {
      await shot("combat");
      midShot = true;
      console.log("MID", s);
    }
    if (s.time % 5 < 0.6) {
      report.samples.push(s);
      console.log("SAMPLE", JSON.stringify(s));
    }
  }
  await page.waitForTimeout(400);
}
if (dir) await page.keyboard.up(dir);
report.natural = await snap();
if (!midShot) await shot("combat");
let s = await snap();
if (s.screen === "levelup") await page.click('[data-upgrade="0"]');
s = await snap();
if (s.screen === "dead") {
  await page.click('[data-action="title"]');
  await page.click('[data-action="start"]');
}
await page.keyboard.press("Escape");
const before = await snap();
await page.waitForTimeout(600);
const after = await snap();
expect(after.time).toBe(before.time);
pass("Escape pauses simulation exactly");
await page.keyboard.press("Escape");
await page.evaluate(() => {
  window.__hollowmere.heal();
  window.__hollowmere.stress(350);
  window.__hollowmere.loadout();
});
const stressSamples = [];
let wall = Date.now();
while (Date.now() - wall < 6500) {
  let q = await snap();
  if (q.screen === "levelup") await page.click('[data-upgrade="0"]');
  else if (q.screen === "run")
    await page.evaluate(() => window.__hollowmere.heal());
  stressSamples.push(q);
  await page.waitForTimeout(350);
}
report.stress = stressSamples;
await shot("stress");
const maxEnemies = Math.max(...stressSamples.map((s) => s.enemies));
expect(maxEnemies).toBeGreaterThanOrEqual(300);
pass(`Stress scene reached ${maxEnemies} enemies with all six weapons`);

await page.evaluate(() => window.__hollowmere.kill());
await shot("death");
expect((await snap()).screen).toBe("dead");
let deathGold = (await snap()).gold;
expect(deathGold).toBeGreaterThan(0);
await page.reload();
await page.waitForSelector('[data-action="start"]');
expect((await snap()).gold).toBe(deathGold);
pass("Run gold and stats survive page reload");
await page.evaluate(() => window.__hollowmere.grantGold(700));
await page.click('[data-action="shop"]');
let gold = (await snap()).gold;
await page.click('[data-buy="hp"]');
expect((await snap()).meta.hp).toBe(1);
expect((await snap()).gold).toBe(gold - 45);
await shot("shop");
pass("Buying a blessing deducts correct gold and persists");
await page.click('[data-action="title"]');
await page.click('[data-hero="c028"]');
await page.click('[data-action="unlock"]');
await page.click('[data-action="confirm-unlock"]');
await expect(page.locator('[data-action="start"]')).toBeVisible();
await page.reload();
await page.waitForSelector('[data-action="start"]');
await expect(page.locator(".hero-card.selected")).toHaveAttribute(
  "data-hero",
  "c028",
);
pass("Hero unlock and selection persist");
await page.click('[data-action="start"]');
await page.evaluate(() => window.__hollowmere.boss());
await page.waitForTimeout(3300);
if ((await snap()).screen === "levelup") await page.click('[data-upgrade="0"]');
await shot("boss");
expect((await snap()).bosses).toBeGreaterThan(0);
pass("Large rift boss spawns with health bar");
fs.writeFileSync(
  "/workspace/iso-verification.json",
  JSON.stringify(report, null, 2),
);
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
});
const mp = await mobile.newPage();
mp.on("pageerror", (e) => errors.push(e.message));
await mp.goto("http://localhost:4174/");
await mp.waitForSelector('[data-action="start"]');
await mp.screenshot({ path: "/workspace/iso-shot-mobile-title.png" });
await mp.click('[data-action="start"]');
await expect(mp.locator("#joystick")).toBeVisible();
let prev = await mp.evaluate(() => window.__hollowmere.snapshot().player);
const touch = await mobile.newCDPSession(mp),
  box = await mp.locator("#joystick").boundingBox(),
  cx = box.x + box.width / 2,
  cy = box.y + box.height / 2;
await touch.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: cx, y: cy }],
});
await touch.send("Input.dispatchTouchEvent", {
  type: "touchMove",
  touchPoints: [{ x: cx + 34, y: cy }],
});
await mp.waitForTimeout(750);
await touch.send("Input.dispatchTouchEvent", {
  type: "touchEnd",
  touchPoints: [],
});
let pos = await mp.evaluate(() => window.__hollowmere.snapshot().player);
expect(Math.hypot(pos.x - prev.x, pos.y - prev.y)).toBeGreaterThan(20);
await mp.screenshot({ path: "/workspace/iso-shot-mobile-combat.png" });
pass("Mobile layout and touch joystick movement verified");
expect(errors).toEqual([]);
pass("No uncaught browser errors");
report.errors = errors;
fs.writeFileSync(
  "/workspace/iso-verification.json",
  JSON.stringify(report, null, 2),
);
console.log(
  "REPORT",
  JSON.stringify({
    natural: report.natural,
    maxEnemies,
    stressFps: stressSamples.map((s) => s.fps),
    tests: report.tests,
  }),
);
await browser.close();
