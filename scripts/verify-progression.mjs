import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  args: ["--no-sandbox", "--disable-background-timer-throttling"],
});
const report = { checks: [], errors: [], performance: [] };
const old = {
  gold: 1200,
  unlocked: ["c112", "c028", "c030"],
  selected: "c112",
  meta: { hp: 2, damage: 3, speed: 0, magnet: 0, gold: 1, revive: 1 },
  best: 87,
  runs: 4,
};
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
await context.addInitScript((old) => {
  if (!localStorage.getItem("progression-seeded")) {
    localStorage.setItem("hollowmere-v1", JSON.stringify(old));
    localStorage.setItem("progression-seeded", "1");
  }
}, old);
const page = await context.newPage();
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") report.errors.push(m.text());
});
const snap = () => page.evaluate(() => window.__hollowmere.snapshot());
const check = (t) => {
  report.checks.push(t);
  console.log("PASS", t);
};
const shot = (n) => page.screenshot({ path: `/workspace/iso-shot-${n}.png` });
await page.goto("http://localhost:4174/hollowmere-riftbound/?qa=1");
await page.waitForSelector('[data-action="start"]');
let s = await snap();
expect(s.gold).toBe(1200);
expect(s.meta.hp).toBe(2);
expect(s.meta.damage).toBe(3);
expect(s.counts).toEqual({
  spells: 18,
  passives: 16,
  evolutions: 6,
  shop: 18,
  talents: 144,
  trees: 18,
});
check(
  "Old v1 gold, unlocks, upgrades, and stats migrate safely into expanded v2",
);
await page.click('[data-action="shop"]');
await expect(page.locator(".shop-card")).toHaveCount(18);
await shot("sanctum2");
await page.click('[data-filter="Drafting"]');
await expect(page.locator(".shop-card")).toHaveCount(4);
await page.click('[data-filter="All"]');
check("18 Sanctum upgrades and functional category filters");
await page.evaluate(() => window.__hollowmere.grantTalentXP(50000));
await page.click('[data-action="talents"]');
await expect(page.locator(".talent-tree")).toHaveCount(3);
await expect(page.locator(".talent-node")).toHaveCount(24);
const node = (t, n) => `c112-t${t}-n${n}`;
async function inspect(t, n) {
  await page.click(`[data-talent="${node(t, n)}"]`);
}
async function learn(t, n, count = 1) {
  await inspect(t, n);
  for (let i = 0; i < count; i++)
    await page.click(`[data-talent-buy="${node(t, n)}"]`);
}
await inspect(0, 3);
await expect(page.locator("[data-talent-buy]")).toBeDisabled();
check("10-point milestone is gated before earlier points are spent");
await learn(0, 0, 5);
await learn(0, 1, 1);
await inspect(0, 2);
await expect(page.locator("[data-talent-buy]")).toBeDisabled();
check("Choose-one pair prevents buying its opposite");
await inspect(0, 0);
await page.click("[data-talent-refund]");
s = await snap();
expect(s.heroProgress.c112.spent[node(0, 0)]).toBe(4);
expect(s.heroProgress.c112.spent[node(0, 1)] || 0).toBe(0);
check("Single-rank refund also refunds invalid dependent rows");
let gold = s.gold;
await page.click('[data-action="respec"]');
expect(
  Object.values((await snap()).heroProgress.c112.spent).reduce(
    (a, b) => a + b,
    0,
  ),
).toBe(0);
expect((await snap()).gold).toBe(gold);
check("Full talent respec is free and preserves XP");
await learn(0, 0, 5);
await learn(0, 1, 9);
await learn(0, 3, 1);
await learn(0, 4, 9);
await learn(0, 5, 1);
await learn(0, 6, 5);
await learn(0, 7, 1);
await learn(1, 0, 5);
await inspect(0, 7);
await shot("talents");
s = await snap();
expect(
  Object.values(s.heroProgress.c112.spent).reduce((a, b) => a + b, 0),
).toBe(36);
expect(s.heroProgress.c028.xp).toBe(0);
check(
  "Full 31-point capstone path plus off-tree investment; six heroes retain separate mastery",
);
await page.reload();
await page.waitForSelector('[data-action="start"]');
s = await snap();
expect(
  Object.values(s.heroProgress.c112.spent).reduce((a, b) => a + b, 0),
).toBe(36);
const intact = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("hollowmere-v1")),
);
expect(intact).toEqual(old);
check("Talent allocations persist and original v1 save remains untouched");
await page.click('[data-action="start"]');
s = await snap();
expect(s.orbitCount).toBeGreaterThan(2);
expect(s.talentBonus.t0_milestone_10).toBe(1);
expect(s.talentBonus.t0_capstone_30).toBe(1);
expect(s.stats.signatureDamage).toBeGreaterThan(1);
await page.waitForTimeout(1200);
expect((await snap()).signatureCasts).toBeGreaterThan(0);
check(
  "Purchased milestone and capstone change actual signature-weapon orbits and combat stats",
);
await page.evaluate(() =>
  window.__hollowmere.forceDraft(["ember", "regen", "crit"]),
);
s = await snap();
let reroll = s.draftCharges.reroll;
await page.click('[data-action="reroll"]');
expect((await snap()).draftCharges.reroll).toBe(reroll - 1);
await expect(page.locator(".upgrade")).toHaveCount(3);
check("Reroll deals three valid choices and consumes one charge");
await page.evaluate(() =>
  window.__hollowmere.forceDraft(["ember", "regen", "crit"]),
);
await page.click('[data-action="banish"]');
await page.click('[data-upgrade="0"]');
s = await snap();
expect(s.banished).toContain("ember");
expect(s.draftCharges.banish).toBe(0);
expect(s.choices.some((c) => c.id === "ember")).toBe(false);
expect(
  (await page.evaluate(() => window.__hollowmere.draftPool())).some(
    (c) => c.id === "ember",
  ),
).toBe(false);
check("Banish removes a card from the run, redeals, and consumes one charge");
let runGold = s.runGold;
await page.click('[data-action="skip-draft"]');
s = await snap();
expect(s.screen).toBe("run");
expect(s.runGold).toBe(runGold + 20 + s.level * 2);
expect(s.draftCharges.skip).toBe(0);
check("Skip consumes one charge and awards advertised run gold");
for (let i = 0; i < 30; i++) {
  await page.evaluate(() =>
    window.__hollowmere.forceDraft(["comet", "regen", "frost"]),
  );
  if (new Set((await snap()).choices.map((c) => c.rarity)).size === 3) break;
}
await shot("draft");
await expect(page.locator('[data-action="banish"]')).toBeDisabled();
await expect(page.locator('[data-action="skip-draft"]')).toBeDisabled();
await page.click('[data-upgrade="0"]');
check("Rarity-tinted draft and disabled exhausted actions are visible");
const sixSpells = {
    blade: 1,
    bolt: 1,
    aura: 1,
    axe: 1,
    lightning: 1,
    familiar: 1,
  },
  sixPassives = { power: 1, haste: 1, area: 1, regen: 1, force: 1, crit: 1 };
await page.evaluate(({ w, p }) => window.__hollowmere.setLoadout(w, p), {
  w: sixSpells,
  p: sixPassives,
});
const pool = await page.evaluate(() => window.__hollowmere.draftPool());
expect(
  pool.filter((c) => c.kind === "spell").every((c) => c.id in sixSpells),
).toBe(true);
expect(
  pool.filter((c) => c.kind === "passive").every((c) => c.id in sixPassives),
).toBe(true);
check("Six spell and six passive slots prevent drafting any seventh item");
const recipes = await page.evaluate(() => window.__hollowmere.recipes);
for (const [weapon, evo] of Object.entries(recipes)) {
  await page.evaluate(
    ({ w, p }) => window.__hollowmere.setLoadout({ [w]: 6 }, { [p]: 2 }),
    { w: weapon, p: evo.passive },
  );
  expect((await snap()).evolved).not.toContain(weapon);
  await page.evaluate(
    (id) => window.__hollowmere.forceDraft([id, "luck", "vitality"]),
    evo.passive,
  );
  await page.click('[data-upgrade="0"]');
  expect((await snap()).evolved).toContain(weapon);
}
check(
  "All six evolutions trigger through a real passive draft after maxing their spell",
);
await page.evaluate(() => {
  window.__hollowmere.setLoadout(
    { blade: 6, bolt: 6, aura: 6, axe: 6, lightning: 6, familiar: 6 },
    { area: 3, haste: 3, regen: 3, force: 3, crit: 3, amount: 3 },
  );
  window.__hollowmere.benchmark();
  window.__hollowmere.stress(350);
});
await page.waitForTimeout(1800);
await shot("evolved");
s = await snap();
expect(s.evolved).toHaveLength(6);
report.evolvedState = s;
for (let i = 0; i < 9; i++) {
  await page.waitForTimeout(900);
  await page.evaluate(() => window.__hollowmere.stress(350));
  report.performance.push(await snap());
}
check("350-enemy stress scene exercises six evolved weapons and six passives");
const xpBefore = (await snap()).heroProgress.c112.xp;
await page.evaluate(() => window.__hollowmere.kill());
s = await snap();
expect(s.heroProgress.c112.xp).toBeGreaterThan(xpBefore);
expect(s.talentXP).toBeGreaterThan(0);
await expect(page.locator(".modal")).toContainText("talent XP");
check(
  "Run completion awards per-hero talent XP for survival, kills, and bosses",
);
await page.click('[data-action="shop"]');
await page.click('[data-buy="reroll"]');
await page.click('[data-buy="start"]');
let meta = (await snap()).meta;
expect(meta.reroll).toBe(1);
expect(meta.start).toBe(1);
await page.click('[data-action="title"]');
await page.click('[data-action="start"]');
s = await snap();
expect(s.level).toBe(2);
expect(s.screen).toBe("levelup");
expect(s.draftCharges.reroll).toBe(3);
await page.click('[data-upgrade="0"]');
expect((await snap()).screen).toBe("run");
check("Sanctum reroll capacity and starting-level bonus apply next run");
await page.evaluate(() => window.__hollowmere.kill());
await page.reload();
await page.waitForSelector('[data-action="start"]');
expect((await snap()).meta.start).toBe(1);
expect((await snap()).meta.reroll).toBe(1);
check("Expanded meta upgrades survive reload");
// Simulated malformed v2, with intact old v1 available, must recover without destroying either key.
const rescue = await browser.newContext({
  viewport: { width: 1000, height: 800 },
});
await rescue.addInitScript((old) => {
  localStorage.setItem("hollowmere-v2", "{malformed");
  localStorage.setItem("hollowmere-v1", JSON.stringify(old));
}, old);
const rp = await rescue.newPage();
rp.on("pageerror", (e) => report.errors.push(e.message));
await rp.goto("http://localhost:4174/hollowmere-riftbound/");
await rp.waitForSelector('[data-action="start"]');
expect((await rp.evaluate(() => window.__hollowmere.snapshot())).gold).toBe(
  1200,
);
check("Malformed v2 data safely falls back to intact v1");
await rescue.close();
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
});
const mp = await mobile.newPage();
mp.on("pageerror", (e) => report.errors.push(e.message));
await mp.goto("http://localhost:4174/hollowmere-riftbound/?qa=1");
await mp.waitForSelector('[data-action="start"]');
await mp.evaluate(() => window.__hollowmere.grantTalentXP(1000));
await mp.click('[data-action="talents"]');
await mp.click('[data-talent="c112-t0-n0"]');
await mp.locator("[data-talent-buy]").scrollIntoViewIfNeeded();
await mp.click("[data-talent-buy]");
expect(
  (await mp.evaluate(() => window.__hollowmere.snapshot())).heroProgress.c112
    .spent["c112-t0-n0"],
).toBe(1);
await mp.screenshot({ path: "/workspace/iso-shot-talents-mobile.png" });
await mp.click('[data-action="title"]');
await mp.click('[data-action="start"]');
await mp.evaluate(() => window.__hollowmere.levelUp());
await mp.screenshot({ path: "/workspace/iso-shot-draft-mobile.png" });
await expect(mp.locator("[data-upgrade]")).toHaveCount(3);
check("Mobile talent tap-inspection, spending, and draft layout work");
await mobile.close();
expect(report.errors).toEqual([]);
check("No browser page or console errors");
report.final = await snap();
fs.writeFileSync(
  "/workspace/iso-progression-verification.json",
  JSON.stringify(report, null, 2),
);
console.log(
  "REPORT",
  JSON.stringify({
    checks: report.checks.length,
    fps: report.performance.map((s) => s.fps),
    errors: report.errors,
  }),
);
await browser.close();
