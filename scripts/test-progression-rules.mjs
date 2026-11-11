import { buildSync } from "esbuild";
import assert from "node:assert/strict";
import fs from "node:fs";
fs.mkdirSync(".local", { recursive: true });
buildSync({
  entryPoints: ["src/progression.ts"],
  outfile: ".local/progression-rules.mjs",
  platform: "node",
  format: "esm",
  bundle: true,
});
const p = await import("../.local/progression-rules.mjs");
let checks = 0;
assert.equal(p.WEAPON_KEYS.length, 18);
assert.equal(p.PASSIVE_KEYS.length, 16);
assert.equal(p.META.length, 18);
assert.equal(Object.keys(p.EVOLUTIONS).length, 6);
checks++;
assert.equal(p.earnedPoints(p.talentThreshold(51)), 51);
assert.equal(p.earnedPoints(p.talentThreshold(51) - 1), 50);
assert.equal(p.earnedPoints(1e12), 51);
checks++;
let nodes = 0,
  trees = 0;
for (const hero of p.HERO_IDS) {
  for (const t of p.talentTrees(hero)) {
    trees++;
    nodes += t.nodes.length;
    assert.equal(t.nodes.length, 8);
    let profile = { xp: 50000, spent: {} };
    assert.notEqual(p.talentReason(t, t.nodes[3], profile), "");
    const path = [0, 1, 3, 4, 5, 6, 7];
    for (const index of path) {
      const node = t.nodes[index];
      for (let r = 0; r < node.max; r++)
        assert(
          p.buyTalent(t, node, profile),
          `${node.id} rank ${r + 1} should be reachable`,
        );
    }
    assert.equal(p.treeSpent(t, profile), 31);
    assert.equal(profile.spent[t.nodes[2].id] || 0, 0);
    assert.equal(profile.spent[t.nodes[7].id], 1);
    const e = p.talentEffects(hero, profile);
    assert.equal(e[`t${t.index}_capstone_30`], 1);
    assert.equal(e[`t${t.index}_milestone_10`], 1);
    assert.equal(e[`t${t.index}_milestone_20`], 1);
    const refund = p.refundTalent(t, t.nodes[0], profile);
    assert.equal(refund, 27);
    assert.equal(p.totalSpent(profile), 4);
    checks++;
  }
  const over = {
    gold: 123,
    unlocked: p.HERO_IDS,
    meta: { hp: 999, damage: -8 },
    heroes: {
      [hero]: {
        xp: 50000,
        spent: Object.fromEntries(
          p.talentTrees(hero).flatMap((t) => t.nodes.map((n) => [n.id, 999])),
        ),
      },
    },
  };
  const safe = p.migrateSave(over);
  assert(p.totalSpent(safe.heroes[hero]) <= 51);
  assert.equal(safe.meta.hp, 8);
  assert.equal(safe.meta.damage, 0);
  for (const t of p.talentTrees(hero)) {
    const pair = t.nodes.filter((n) => n.choice);
    assert(pair.filter((n) => safe.heroes[hero].spent[n.id] > 0).length <= 1);
  }
  checks++;
}
assert.equal(trees, 18);
assert.equal(nodes, 144);
checks++;
for (const [spell, e] of Object.entries(p.EVOLUTIONS)) {
  assert(p.SPELLS[spell]);
  assert(p.PASSIVES[e.passive]);
  assert.equal(p.SPELLS[spell].max, 6);
  assert(e.rank <= p.PASSIVES[e.passive].max);
}
checks++;
console.log(
  JSON.stringify({
    checks,
    trees,
    nodes,
    spells: p.WEAPON_KEYS.length,
    passives: p.PASSIVE_KEYS.length,
    evolutions: Object.keys(p.EVOLUTIONS).length,
    shop: p.META.length,
  }),
);
