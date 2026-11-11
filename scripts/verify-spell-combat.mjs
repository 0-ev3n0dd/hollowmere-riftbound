import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const b = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  args: ["--no-sandbox", "--disable-background-timer-throttling"],
});
const p = await b.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const errors = [],
  groups = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto("http://localhost:4174/hollowmere-riftbound/?qa=1");
await p.waitForSelector('[data-action="start"]');
await p.click('[data-action="start"]');
await p.evaluate(() => {
  window.__hollowmere.setLoadout(
    { blade: 6, bolt: 6, aura: 6, axe: 6, lightning: 6, familiar: 6 },
    { area: 5, haste: 5, regen: 5, force: 5, crit: 5, amount: 5 },
  );
  window.__hollowmere.levelUp();
});
let fallback = await p.evaluate(() => window.__hollowmere.snapshot());
expect(fallback.choices).toHaveLength(3);
expect(fallback.choices.every((c) => c.kind === "supply")).toBe(true);
expect(fallback.draftCharges.banish).toBe(1);
await expect(p.locator('[data-action="banish"]')).toBeDisabled();
let gold = fallback.runGold;
await p.click('[data-upgrade="0"]');
expect((await p.evaluate(() => window.__hollowmere.snapshot())).runGold).toBe(
  gold + 35,
);
console.log(
  "PASS Full maxed build offers usable supply cards without wasting banish charges",
);
const names = Object.keys(
  (await p.evaluate(() => window.__hollowmere.catalog())).spells,
);
for (let group = 0; group < 3; group++) {
  const keys = names.slice(group * 6, group * 6 + 6);
  await p.evaluate((keys) => {
    window.__hollowmere.setLoadout(
      Object.fromEntries(keys.map((k) => [k, 6])),
      { area: 2, haste: 2, duration: 2, amount: 2, force: 2, crit: 2 },
    );
    window.__hollowmere.benchmark();
    window.__hollowmere.stress(350);
  }, keys);
  let before = await p.evaluate(() => window.__hollowmere.snapshot());
  await p.waitForTimeout(4500);
  let after = await p.evaluate(() => window.__hollowmere.snapshot());
  expect(after.kills).toBeGreaterThan(before.kills);
  groups.push({
    keys,
    before: before.kills,
    after: after.kills,
    bullets: after.bullets,
    zones: after.zones,
    fps: after.fps,
  });
  console.log("SPELL GROUP", groups.at(-1));
  if (group > 0)
    await p.screenshot({ path: `/workspace/iso-shot-spells-${group + 1}.png` });
}
expect(errors).toEqual([]);
fs.writeFileSync(
  "/workspace/iso-spell-combat-verification.json",
  JSON.stringify({ groups, fullBuildSupplyFallback: true, errors }, null, 2),
);
await b.close();
