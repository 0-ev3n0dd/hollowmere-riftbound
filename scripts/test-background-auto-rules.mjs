import { buildSync } from "esbuild";
import assert from "node:assert/strict";
import fs from "node:fs";
fs.mkdirSync(".local", { recursive: true });
for (const name of ["simulation-clock", "auto-upgrade", "progression"]) {
  buildSync({
    entryPoints: [`src/${name}.ts`],
    outfile: `.local/${name}-test.mjs`,
    platform: "node",
    format: "esm",
    bundle: true,
  });
}
const { SimulationClock } = await import("../.local/simulation-clock-test.mjs");
const { pickAutoUpgrade } = await import("../.local/auto-upgrade-test.mjs");
const { emptyWeapons, emptyPassives, migrateSave } =
  await import("../.local/progression-test.mjs");
let checks = 0;
const check = (name) => {
  checks++;
  console.log("PASS", name);
};
let elapsed = 0;
const clock = new SimulationClock();
clock.reset(0);
assert.equal(
  clock.pump(
    1000,
    () => true,
    (dt) => {
      elapsed += dt;
      assert.equal(dt, 1 / 60);
    },
    120,
  ),
  60,
);
clock.pump(
  1000,
  () => true,
  (dt) => (elapsed += dt),
  120,
);
clock.pump(
  999,
  () => true,
  (dt) => (elapsed += dt),
  120,
);
assert.ok(Math.abs(elapsed - 1) < 1e-8);
check(
  "RAF and worker share a monotonic 60 Hz clock without duplicate or backwards time",
);
let active = true;
clock.reset(1000);
assert.equal(
  clock.pump(
    2000,
    () => active,
    () => {
      active = false;
    },
    120,
  ),
  1,
);
assert.equal(clock.backlogSeconds, 0);
clock.pump(
  120000,
  () => active,
  () => assert.fail("pause must not step"),
  120,
);
active = true;
assert.equal(
  clock.pump(
    120020,
    () => active,
    () => {},
    120,
  ),
  1,
);
check(
  "A pause/draft/death stops catch-up immediately and discards paused time",
);
const recovery = new SimulationClock();
recovery.reset(0);
assert.equal(
  recovery.pump(
    3600000,
    () => true,
    (dt) => assert.equal(dt, 1 / 60),
    120,
  ),
  120,
);
assert.ok(recovery.backlogSeconds <= 58.00000001);
while (recovery.backlogSeconds > 1e-8)
  recovery.pump(
    3600000,
    () => true,
    () => {},
    120,
  );
assert.equal(recovery.steps, 3600);
check(
  "Long suspension retains at most 60 seconds, recovers in bounded batches, and never uses a giant delta",
);
const visible = new SimulationClock();
visible.reset(0);
assert.equal(
  visible.pump(
    1000,
    () => true,
    () => {},
    6,
  ),
  6,
);
assert.ok(visible.backlogSeconds > 0.89);
check("Foreground catch-up is capped at six fixed steps per paint");
const state = (weapons = {}, passives = {}, hp = 120) => ({
  weapons: { ...emptyWeapons(), ...weapons },
  passives: { ...emptyPassives(), ...passives },
  evolved: new Set(),
  hp,
  maxHp: 120,
});
const card = (
  id,
  kind = "spell",
  rarity = "common",
  grant = rarity === "epic" ? 2 : 1,
) => ({ id, kind, rarity, grant });
const choose = (cards, loadout, preference = "balanced") =>
  cards[pickAutoUpgrade(cards, loadout, preference)]?.id;
assert.equal(
  choose(
    [
      card("bolt", "spell", "epic"),
      card("area", "passive"),
      card("comet", "spell", "rare"),
    ],
    state({ blade: 6, bolt: 3 }, { area: 2, haste: 1 }),
  ),
  "area",
);
assert.equal(
  choose(
    [card("armor", "passive", "epic"), card("blade")],
    state({ blade: 5 }, { area: 3 }),
    "defense",
  ),
  "blade",
);
assert.equal(
  choose(
    [card("comet", "spell", "epic"), card("area", "passive")],
    state({ blade: 3 }, { area: 1 }),
  ),
  "area",
);
assert.equal(
  choose([card("comet", "spell", "epic"), card("blade")], state({ blade: 2 })),
  "blade",
);
check(
  "Completing evolution (spell or passive, including epic ranks) beats preference/rarity; owned recipe progress comes next",
);
assert.equal(
  choose([card("ember", "spell", "epic"), card("comet")], state({ ember: 2 })),
  "comet",
);
assert.equal(
  choose([card("comet"), card("frost", "spell", "rare")], state()),
  "frost",
);
check(
  "Empty slots precede non-recipe ranks, with rarity resolving otherwise equivalent cards",
);
const passives = [card("power", "passive"), card("armor", "passive")];
assert.equal(choose(passives, state(), "offense"), "power");
assert.equal(choose(passives, state(), "defense"), "armor");
assert.equal(
  choose([card("comet"), card("armor", "passive")], state({ ember: 1 })),
  "armor",
);
check(
  "Balanced fills the smaller category; Offense and Defense bias tied upgrades",
);
const supplies = [
  card("supply-heal", "supply"),
  card("supply-gold", "supply"),
  card("supply-xp", "supply", "rare"),
];
assert.equal(choose(supplies, state({}, {}, 20)), "supply-heal");
assert.equal(choose(supplies, state()), "supply-gold");
assert.equal(pickAutoUpgrade([], state(), "balanced"), -1);
check("Full loadouts safely fall back to useful supplies without charges");
assert.deepEqual(migrateSave({ gold: 27 }).settings, {
  autoUpgrade: false,
  autoPreference: "balanced",
});
assert.deepEqual(
  migrateSave({ settings: { autoUpgrade: "true", autoPreference: "bad" } })
    .settings,
  { autoUpgrade: false, autoPreference: "balanced" },
);
assert.deepEqual(
  migrateSave({ settings: { autoUpgrade: true, autoPreference: "defense" } })
    .settings,
  { autoUpgrade: true, autoPreference: "defense" },
);
assert.equal(migrateSave({ gold: 27, settings: null }).gold, 27);
check(
  "Old v1/v2 saves get opt-in defaults, invalid preferences are sanitized, valid settings persist",
);
console.log(`Background/auto-upgrade rule groups passed: ${checks}`);
