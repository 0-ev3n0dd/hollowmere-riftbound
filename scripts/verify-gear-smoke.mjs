import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  args: ["--no-sandbox"],
});
const report = { checks: [], errors: [], screenshots: [] };
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
});
const old = {
  version: 2,
  gold: 932,
  unlocked: ["c112", "c028", "c030", "c044", "c080", "c001"],
  selected: "c112",
  meta: { hp: 2, damage: 1 },
  heroes: { c112: { xp: 512, spent: {} } },
  settings: { autoUpgrade: false, autoPreference: "balanced" },
  best: 89,
  runs: 3,
};
await context.addInitScript((old) => {
  if (!localStorage.getItem("gear-smoke-seed")) {
    localStorage.setItem("hollowmere-v2", JSON.stringify(old));
    localStorage.setItem("gear-smoke-seed", "1");
  }
}, old);
const page = await context.newPage();
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") report.errors.push(m.text());
});
const snap = () => page.evaluate(() => window.__hollowmere.snapshot());
const check = (text) => {
  report.checks.push(text);
  console.log("PASS", text);
};
const shot = async (name) => {
  const path = `/workspace/iso-shot-${name}.png`;
  await page.screenshot({ path });
  report.screenshots.push(path);
};
try {
  await page.goto("http://localhost:4174/hollowmere-riftbound/?qa=1");
  await page.waitForSelector('[data-action="start"]');
  let state = await snap();
  expect(state.version).toBe("0.3.0");
  expect(state.gold).toBe(932);
  expect(state.meta.hp).toBe(2);
  expect(state.heroProgress.c112.xp).toBe(512);
  expect(state.settings.autoUpgrade).toBe(false);
  expect(state.gear.inventory).toHaveLength(0);
  expect(state.counts).toMatchObject({
    expeditions: 5,
    guardians: 15,
    gear: 320,
    sets: 30,
    jewelry: 16,
  });
  check(
    "v2 progress and preferences migrate safely into v3 with empty per-hero Armories",
  );
  await page.click('[data-action="expeditions"]');
  await expect(page.locator(".zone-card")).toHaveCount(5);
  await expect(page.locator('[data-heroic="1"]')).toBeDisabled();
  await page.click('[data-action="start"]');
  await page.evaluate(() => window.__hollowmere.benchmark());
  const baseline = (await snap()).stats.damage;
  await page.evaluate(() => window.__hollowmere.defeatGuardian(0));
  state = await snap();
  expect(state.runLoot.length).toBeGreaterThan(0);
  expect(state.gear.inventory.length).toBeGreaterThan(0);
  expect(state.stats.damage).toBe(baseline);
  await expect(page.locator(".loot-reveal")).toBeVisible();
  check(
    "Killing an actual assigned guardian reveals and persists gear; unworn pieces grant no combat stats",
  );
  await page.evaluate(() => {
    window.__hollowmere.defeatGuardian(1);
    window.__hollowmere.defeatGuardian(2);
  });
  await page.waitForFunction(
    () => window.__hollowmere.snapshot().screen === "dead",
  );
  await expect(page.locator(".run-loot-summary")).toContainText(
    "11 new pieces",
  );
  expect((await snap()).gear.clears.briar).toBe(0);
  await page.click('[data-action="armory"]');
  const main = "c112-briar-main";
  await page.locator(`.gear-item[data-inspect-gear="${main}"]`).click();
  await page.click(`[data-equip-gear="${main}"]`);
  expect((await snap()).gear.equipped.main).toBe(main);
  expect((await snap()).gearTotals.damage).toBeGreaterThan(0);
  await expect(page.locator('[data-gear-stat="damage"]')).not.toHaveText(
    "+0.0%",
  );
  await page.evaluate(() => {
    const state = window.__hollowmere.snapshot();
    for (const id of state.gear.inventory) {
      if (
        Object.values(window.__hollowmere.snapshot().gear.equipped).includes(id)
      )
        continue;
      document.querySelector(`.gear-item[data-inspect-gear="${id}"]`).click();
      document.querySelector(`[data-equip-gear="${id}"]`).click();
    }
  });
  await expect(page.locator(".set-bonus.active")).toHaveCount(1);
  await expect(page.locator(".set-bonus.active")).toContainText("8/8");
  check(
    "Armory equipment changes stat totals and activates real four/eight-piece set bonuses",
  );
  await page.click('[data-action="expeditions"]');
  await expect(page.locator('[data-heroic="1"]')).toBeEnabled();
  await page.click('[data-heroic="1"]');
  await page.click('[data-action="start"]');
  await page.evaluate(() => window.__hollowmere.benchmark());
  state = await snap();
  expect(state.activeExpedition.heroic).toBe(1);
  expect(state.stats.damage).toBeGreaterThan(baseline);
  expect(state.stats.amount).toBeGreaterThan(0);
  const equippedDamage = state.stats.damage;
  await page.evaluate(() =>
    window.__hollowmere.offerJewelry([
      "cinderloop",
      "quiet-orbit",
      "vigil-band",
    ]),
  );
  await expect(page.locator(".jewel-choice")).toHaveCount(3);
  await page.click('[data-jewelry="cinderloop"]');
  const rankOne = await snap();
  expect(rankOne.jewelry.cinderloop).toBe(1);
  expect(rankOne.stats.damage).toBeGreaterThan(equippedDamage);
  await page.evaluate(() =>
    window.__hollowmere.offerJewelry([
      "cinderloop",
      "quiet-orbit",
      "vigil-band",
    ]),
  );
  await page.click('[data-jewelry="cinderloop"]');
  state = await snap();
  expect(state.jewelry.cinderloop).toBe(2);
  expect(state.stats.damage).toBeGreaterThan(rankOne.stats.damage);
  const orbit = state.orbitCount;
  await page.evaluate(() =>
    window.__hollowmere.offerJewelry([
      "waning-mirror",
      "first-rain",
      "deepwake-lantern",
    ]),
  );
  await page.click('[data-jewelry="waning-mirror"]');
  expect((await snap()).orbitCount).toBeGreaterThan(orbit);
  await page.evaluate(() =>
    window.__hollowmere.offerJewelry([
      "first-rain",
      "waning-mirror",
      "deepwake-lantern",
    ]),
  );
  await page.click('[data-jewelry="first-rain"]');
  state = await snap();
  expect(state.jewelry["first-rain"]).toBe(1);
  expect(state.jewelry["waning-mirror"]).toBeUndefined();
  expect(state.codex).toContain("waning-mirror");
  check(
    "Chest offers equip and upgrade jewelry, change actual stats, remake a spell, and enforce one amulet",
  );
  const count = state.gear.inventory.length;
  await page.evaluate(() => {
    window.__hollowmere.defeatGuardian(0);
    window.__hollowmere.defeatGuardian(1);
    window.__hollowmere.defeatGuardian(2);
  });
  await page.waitForFunction(
    () => window.__hollowmere.snapshot().screen === "dead",
  );
  state = await snap();
  expect(state.gear.inventory).toHaveLength(count);
  expect(state.gear.stars.briar).toBe(1);
  expect(state.gear.clears.briar).toBe(1);
  await page.click('[data-action="armory"]');
  await shot("armory");
  await page.click('[data-action="droptables"]');
  await page.click('[data-drop-zone="astral"]');
  await expect(page.locator(".drop-boss")).toHaveCount(3);
  await expect(page.locator(".collection-count")).toContainText("20");
  await shot("droptables");
  await page.click('[data-action="expeditions"]');
  await expect(page.locator('[data-heroic="2"]')).toBeEnabled();
  await page.click('[data-expedition="cinder"]');
  expect((await snap()).expedition.zone).toBe("cinder");
  await shot("zones");
  check(
    "Normal clear unlocks Heroic I; Heroic clear raises stars and unlocks II; duplicate drops add no pieces; zone and drop-table selection work",
  );
  await page.click('[data-action="codex"]');
  await expect(page.locator(".codex-card:not(.undiscovered)")).toHaveCount(
    state.codex.length,
  );
  await page.reload();
  await page.waitForSelector('[data-action="start"]');
  const persisted = await snap();
  expect(persisted.gear.inventory).toHaveLength(11);
  expect(persisted.gear.equipped.main).toBe(main);
  expect(persisted.gear.stars.briar).toBe(1);
  expect(persisted.codex).toContain("cinderloop");
  expect(persisted.jewelry).toEqual({});
  const stored = await page.evaluate(() => ({
    old: localStorage.getItem("hollowmere-v2"),
    fresh: JSON.parse(localStorage.getItem("hollowmere-v3")),
  }));
  expect(stored.old).toBe(JSON.stringify(old));
  expect(stored.fresh.version).toBe(3);
  expect(report.errors).toEqual([]);
  report.counts = persisted.counts;
  check(
    "Gear, stars and Codex survive reload, run jewelry resets, old v2 is untouched, and no console/runtime errors occur",
  );
} finally {
  fs.writeFileSync(
    "/workspace/iso-gear-smoke.json",
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
