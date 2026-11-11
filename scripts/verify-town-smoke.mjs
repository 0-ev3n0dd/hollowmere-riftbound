import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1180 },
});
const slots = [
  "head",
  "shoulder",
  "chest",
  "waist",
  "legs",
  "feet",
  "wrist",
  "hands",
  "back",
  "main",
  "off",
];
const old = {
  version: 3,
  gold: 1000000,
  unlocked: ["c112", "c028", "c030", "c044", "c080", "c001"],
  selected: "c112",
  meta: {
    hp: 8,
    damage: 8,
    speed: 5,
    regen: 5,
    gold: 6,
    haste: 5,
    area: 5,
    wisdom: 5,
  },
  heroes: { c112: { xp: 512, spent: {} } },
  settings: { autoUpgrade: true, autoPreference: "balanced" },
  gear: {
    c112: {
      inventory: slots.map((s) => `c112-briar-${s}`),
      equipped: Object.fromEntries(slots.map((s) => [s, `c112-briar-${s}`])),
      stars: { briar: 0 },
      clears: { briar: 0, cinder: 0, rime: 0, dusk: 0, astral: 0 },
      duplicates: Object.fromEntries(slots.map((s) => [`c112-briar-${s}`, 3])),
    },
  },
  codex: ["cinderloop", "quiet-orbit"],
  expedition: { zone: "briar", heroic: 0 },
  best: 90,
  runs: 4,
};
await context.addInitScript((old) => {
  if (!localStorage.getItem("town-smoke-seed")) {
    localStorage.setItem("hollowmere-v3", JSON.stringify(old));
    localStorage.setItem("town-smoke-seed", "1");
  }
}, old);
const page = await context.newPage(),
  report = { checks: [], errors: [], screenshots: [], purchases: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") report.errors.push(m.text());
});
const snap = () => page.evaluate(() => window.__hollowmere.snapshot());
const tab = async (id) =>
  page.locator(`[data-town-page="${id}"]`).first().click();
const purchase = async (action) => {
  const before = (await snap()).gold;
  await page.locator(`[data-town-buy="${action}"]`).click();
  const after = (await snap()).gold;
  expect(after).toBeLessThan(before);
  report.purchases.push({ action, spent: before - after });
};
const check = (text) => {
  report.checks.push(text);
  console.log("PASS", text);
};
const shot = async (name) => {
  await page.evaluate(() => {
    document.querySelector(".screen").scrollTop = 0;
    document.querySelector(".toast")?.remove();
  });
  const path = `/workspace/iso-shot-${name}.png`;
  await page.screenshot({ path });
  report.screenshots.push(path);
};
try {
  await page.goto("http://localhost:4174/hollowmere-riftbound/?qa=1");
  await page.waitForSelector('[data-action="start"]');
  expect((await snap()).version).toBe("0.4.0");
  expect((await snap()).gear.inventory).toHaveLength(11);
  await page.click('[data-action="town"]');
  for (const id of ["treasury", "grounds", "shrine", "barracks"])
    await purchase(`building:${id}`);
  expect((await snap()).town.buildings).toEqual({
    treasury: 1,
    grounds: 1,
    shrine: 1,
    barracks: 1,
  });
  check(
    "Old saves migrate into Town with all gear intact; all four account buildings can be bought",
  );
  await tab("forge");
  await page.locator('[data-town-buy="salvage:sparks"]').click();
  expect((await snap()).town.materials).toBe(99);
  await page.selectOption('[data-town-setting="forgeItem"]', "c112-briar-main");
  const gearBefore = (await snap()).gearTotals.damage;
  await purchase("forge:c112-briar-main");
  expect((await snap()).gear.upgrades["c112-briar-main"].level).toBe(1);
  expect((await snap()).gearTotals.damage).toBeGreaterThan(gearBefore);
  await purchase("reforge:c112-briar-main:damage");
  expect((await snap()).gear.upgrades["c112-briar-main"].reforges).toBe(1);
  await purchase("star:briar");
  expect((await snap()).gear.stars.briar).toBe(1);
  expect((await snap()).gear.clears.briar).toBe(0);
  await shot("forge");
  check(
    "Forge upgrades improve stats, a paid affix rerolls, duplicates produce sparks, and bought stars do not grant Heroic clears",
  );
  await tab("enchanter");
  await purchase("enchant:head:damage");
  expect((await snap()).gear.enchants.head).toEqual({
    tier: 1,
    stat: "damage",
  });
  await tab("ascended");
  for (const id of [
    "damage",
    "hp",
    "haste",
    "gold",
    "wisdom",
    "area",
    "speed",
    "regen",
  ])
    await purchase(`ascend:${id}`);
  expect(
    Object.values((await snap()).town.ascended).every((n) => n === 1),
  ).toBe(true);
  check(
    "Worn-slot enchantments and all eight post-cap Ascended Sanctum tracks accept real gold",
  );
  await tab("jeweler");
  await purchase("mastery");
  await purchase("codex");
  await purchase("starter:cinderloop");
  expect((await snap()).town.mastery.c112).toBe(1);
  expect((await snap()).town.codexLevel).toBe(1);
  expect((await snap()).town.starterStock.c112.cinderloop).toBe(1);
  await shot("jeweler");
  await tab("market");
  const serial = (await snap()).town.markets.c112.serial;
  await purchase("refresh");
  expect((await snap()).town.markets.c112.serial).toBe(serial + 1);
  await shot("market");
  const offers = (await snap()).town.markets.c112.offers;
  for (const offer of offers) await purchase(`market:${offer.id}`);
  for (const id of ["wayfarer", "veiled", "starless"])
    await purchase(`cache:${id}`);
  expect((await snap()).town.markets.c112.bought).toHaveLength(6);
  check(
    "Jeweler mastery, Codex lore, starting relic kits, all market stock types, paid refresh, and all three odds-disclosed caches work",
  );
  await tab("supplies");
  for (const id of [
    "scholar",
    "gilded",
    "redraw",
    "firstlight",
    "hunter",
    "ward",
  ])
    await purchase(`supply:${id}`);
  await tab("training");
  const xp = (await snap()).heroProgress.c112.xp;
  await purchase("train");
  expect((await snap()).heroProgress.c112.xp).toBeGreaterThan(xp);
  await tab("contracts");
  await page.selectOption('[data-town-setting="contractTier"]', "2");
  for (const id of ["crowded", "glass", "bloodmoon"])
    await purchase(`contract:${id}:2`);
  await tab("cosmetics");
  for (const id of ["verdant", "dawn-aura", "azure-motes"])
    await purchase(`cosmetic:${id}`);
  expect((await snap()).town.cosmetics.owned).toHaveLength(3);
  await tab("overview");
  await shot("town");
  const beforeReload = await snap(),
    marketJSON = JSON.stringify(beforeReload.town.markets.c112);
  await page.reload();
  await page.waitForSelector('[data-action="start"]');
  let state = await snap();
  expect(state.gear.upgrades["c112-briar-main"].level).toBe(1);
  expect(state.gear.stars.briar).toBe(1);
  expect(state.gear.clears.briar).toBe(0);
  expect(state.gear.enchants.head.tier).toBe(1);
  expect(JSON.stringify(state.town.markets.c112)).toBe(marketJSON);
  expect(state.town.mastery.c112).toBe(1);
  expect(state.town.contracts.c112).toEqual({ id: "bloodmoon", tier: 2 });
  expect(state.town.cosmetics.owned).toHaveLength(3);
  const saved = await page.evaluate(() => ({
    old: localStorage.getItem("hollowmere-v3"),
    v4: JSON.parse(localStorage.getItem("hollowmere-v4")),
  }));
  expect(saved.old).toBe(JSON.stringify(old));
  expect(saved.v4.version).toBe(4);
  check(
    "Supplies, training, all contracts, cosmetics and every permanent purchase persist; market reloads do not reroll; v3 remains untouched",
  );
  const stock = { ...state.town.supplies },
    kit = state.town.starter.c112,
    kitCharges = state.town.starterStock.c112[kit];
  await page.click('[data-action="start"]');
  await page.evaluate(() => window.__hollowmere.benchmark());
  state = await snap();
  expect(state.level).toBeGreaterThanOrEqual(5);
  expect(state.autoPicks).toBeGreaterThanOrEqual(4);
  expect(state.draftCharges.reroll).toBe(5);
  expect(state.runPreparations.supplies).toHaveLength(6);
  expect(state.runPreparations.enemyHealth).toBe(1.6);
  expect(state.stats.bossDamage).toBe(1.3);
  expect(state.stats.goldGain).toBeGreaterThan(3);
  expect(state.jewelry[kit]).toBeGreaterThanOrEqual(1);
  expect(state.town.starterStock.c112[kit]).toBe(kitCharges - 1);
  expect(state.runPreparations.hue).toBe(80);
  expect(state.runPreparations.theme).toBe("#8abbe9");
  for (const id of Object.keys(stock))
    if (stock[id] > 0 && beforeReload.town.packed[id])
      expect(state.town.supplies[id]).toBe(stock[id] - 1);
  expect(state.town.contracts.c112).toBeNull();
  expect(state.town.markets.c112.refreshes).toBe(0);
  await page.evaluate(() => {
    window.__hollowmere.defeatGuardian(0);
    window.__hollowmere.defeatGuardian(1);
    window.__hollowmere.defeatGuardian(2);
  });
  await page.waitForFunction(
    () => window.__hollowmere.snapshot().screen === "dead",
  );
  await expect(page.locator(".run-economy-strip")).toContainText("GOLD / MIN");
  expect((await snap()).goldPerMinute).toBeGreaterThan(0);
  await page.click('[data-action="town"]');
  await tab("forge");
  const beforeSalvage = (await snap()).gold;
  await page.click('[data-town-buy="salvage:gold"]');
  expect((await snap()).gold).toBeGreaterThan(beforeSalvage);
  check(
    "Prepared supplies, starter kit and paid contract are consumed exactly once, run stats/cosmetics apply, stock rotates, gold/min appears, and spare copies can become gold",
  );
  expect(report.errors).toEqual([]);
  report.final = await snap();
  check(
    "All ten Town districts render and all focused smoke steps finish without console/runtime errors",
  );
} finally {
  fs.writeFileSync(
    "/workspace/iso-town-smoke.json",
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
console.log(
  JSON.stringify(
    {
      checks: report.checks.length,
      purchases: report.purchases.length,
      errors: report.errors,
      screenshots: report.screenshots,
    },
    null,
    2,
  ),
);
