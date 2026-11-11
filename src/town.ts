import {
  EXPEDITIONS,
  GEAR,
  GEAR_BY_ID,
  JEWELRY,
  JEWEL_BY_ID,
  RARITIES,
  STAT_LABELS,
  ENCHANT_BASE,
  heroSlots,
  type GearSlot,
  type GearStat,
  type Stats,
} from "./gearing";
import type { Save } from "./progression";
const HEROES = ["c112", "c028", "c030", "c044", "c080", "c001"];
export const XP_LIMIT = 45696;
export const scaledCost = (base: number, growth: number, rank: number) =>
  Math.ceil(Math.min(1e15, base * growth ** Math.max(0, rank)));
export const BUILDINGS = [
  {
    id: "treasury",
    name: "Amber Treasury",
    glyph: "◇",
    desc: "Earn 8 × level^1.2 gold/min while away, banked for up to 8 hours.",
    base: 180,
    growth: 1.32,
  },
  {
    id: "grounds",
    name: "Training Grounds",
    glyph: "⚔",
    desc: "All heroes earn 2 talent XP/min per level, up to the 51-point threshold. 8-hour bank.",
    base: 220,
    growth: 1.34,
  },
  {
    id: "shrine",
    name: "Omen Shrine",
    glyph: "✧",
    desc: "+1.5% drafting luck and +0.5% damage per level.",
    base: 200,
    growth: 1.3,
  },
  {
    id: "barracks",
    name: "Wayfarer Barracks",
    glyph: "♜",
    desc: "Every hero starts with +6 vitality and +1% damage per level.",
    base: 160,
    growth: 1.3,
  },
];
export const ASCENDED = [
  {
    id: "damage",
    name: "Ascended Might",
    glyph: "✦",
    cap: 8,
    desc: "+2.5% damage per rank.",
    base: 450,
  },
  {
    id: "hp",
    name: "Ascended Roots",
    glyph: "♡",
    cap: 8,
    desc: "+12 starting vitality per rank.",
    base: 350,
  },
  {
    id: "haste",
    name: "Ascended Clockroot",
    glyph: "»",
    cap: 5,
    desc: "+2% attack rate per rank, independent of cooldown-reduction caps.",
    base: 500,
  },
  {
    id: "gold",
    name: "Ascended Fortune",
    glyph: "◇",
    cap: 6,
    desc: "+4% gold income per rank.",
    base: 400,
  },
  {
    id: "wisdom",
    name: "Ascended Memory",
    glyph: "◈",
    cap: 5,
    desc: "+3% experience per rank.",
    base: 400,
  },
  {
    id: "area",
    name: "Ascended Horizon",
    glyph: "◉",
    cap: 5,
    desc: "+2% spell area per rank.",
    base: 450,
  },
  {
    id: "speed",
    name: "Ascended Wayfarer",
    glyph: "➶",
    cap: 5,
    desc: "+1% movement speed per rank.",
    base: 350,
  },
  {
    id: "regen",
    name: "Ascended Spring",
    glyph: "❧",
    cap: 5,
    desc: "+0.15 vitality/second per rank.",
    base: 500,
  },
];
export const SUPPLIES = [
  {
    id: "scholar",
    name: "Scholar's Draught",
    glyph: "◈",
    cost: 90,
    desc: "+30% XP for one expedition.",
    xp: 0.3,
  },
  {
    id: "gilded",
    name: "Gilded Elixir",
    glyph: "◇",
    cost: 110,
    desc: "+40% gold for one expedition.",
    gold: 0.4,
  },
  {
    id: "redraw",
    name: "Scroll of Second Chances",
    glyph: "⟳",
    cost: 85,
    desc: "+3 reroll charges this expedition.",
    rerolls: 3,
  },
  {
    id: "firstlight",
    name: "First-Light Commission",
    glyph: "☼",
    cost: 200,
    desc: "Start at least at level 5, with every bonus draft.",
    start: 4,
  },
  {
    id: "hunter",
    name: "Guardian-Hunter Oil",
    glyph: "⚔",
    cost: 150,
    desc: "+30% damage against named guardians.",
    bossDamage: 0.3,
  },
  {
    id: "ward",
    name: "Bottled Shelter",
    glyph: "⬡",
    cost: 100,
    desc: "+40 vitality and +5% damage reduction.",
    hp: 40,
    reduction: 0.05,
  },
];
export const CONTRACTS = [
  {
    id: "bloodmoon",
    name: "Blood-Moon Writ",
    glyph: "☽",
    desc: "Per seal: enemies +30% vitality/+12% damage; +65% gold.",
    health: 0.3,
    damage: 0.12,
    spawns: 0,
    gold: 0.65,
    playerHp: 0,
    playerDamage: 0,
  },
  {
    id: "crowded",
    name: "The Crowded Road",
    glyph: "♧",
    desc: "Per seal: +30% spawns/+10% enemy vitality; +50% gold.",
    health: 0.1,
    damage: 0,
    spawns: 0.3,
    gold: 0.5,
    playerHp: 0,
    playerDamage: 0,
  },
  {
    id: "glass",
    name: "Glass-Lantern Oath",
    glyph: "✧",
    desc: "Per seal: -10% starting vitality, +15% damage; +55% gold. Vitality loss caps at 50%.",
    health: 0,
    damage: 0,
    spawns: 0,
    gold: 0.55,
    playerHp: -0.1,
    playerDamage: 0.15,
  },
];
export const COSMETICS = [
  {
    id: "verdant",
    kind: "tint",
    name: "Verdantwake Tint",
    color: "#90bb78",
    hue: 80,
    cost: 2200,
  },
  {
    id: "moonice",
    kind: "tint",
    name: "Moonice Tint",
    color: "#8ac7e2",
    hue: 175,
    cost: 3500,
  },
  {
    id: "cinderrose",
    kind: "tint",
    name: "Cinderrose Tint",
    color: "#d67b93",
    hue: 285,
    cost: 5000,
  },
  {
    id: "dawn-aura",
    kind: "aura",
    name: "Dawn Halo",
    color: "#f0d38c",
    hue: 0,
    cost: 3000,
  },
  {
    id: "rift-aura",
    kind: "aura",
    name: "Rift Halo",
    color: "#ad94d8",
    hue: 0,
    cost: 5000,
  },
  {
    id: "glade-aura",
    kind: "aura",
    name: "Glade Halo",
    color: "#8dd79d",
    hue: 0,
    cost: 7000,
  },
  {
    id: "amber-motes",
    kind: "particles",
    name: "Amber Motes",
    color: "#edc779",
    hue: 0,
    cost: 2500,
  },
  {
    id: "azure-motes",
    kind: "particles",
    name: "Azure Motes",
    color: "#8abbe9",
    hue: 0,
    cost: 4500,
  },
  {
    id: "rose-motes",
    kind: "particles",
    name: "Rose Motes",
    color: "#df9abe",
    hue: 0,
    cost: 6500,
  },
];
export const CACHES = [
  {
    id: "wayfarer",
    name: "Wayfarer's Cache",
    cost: 100,
    weights: [80, 15, 4, 1, 0],
  },
  {
    id: "veiled",
    name: "Veiled Reliquary",
    cost: 650,
    weights: [20, 40, 25, 12, 3],
  },
  {
    id: "starless",
    name: "Starless Vault",
    cost: 3000,
    weights: [0, 10, 25, 40, 25],
  },
];
export type Offer = {
  id: string;
  kind: "gear" | "jewel" | "supply";
  item: string;
  cost: number;
};
export type Market = {
  serial: number;
  refreshes: number;
  offers: Offer[];
  bought: string[];
};
export type Pact = { id: string; tier: number };
export type TownState = {
  materials: number;
  totalSpent: number;
  buildings: Record<string, number>;
  ascended: Record<string, number>;
  mastery: Record<string, number>;
  codexLevel: number;
  training: Record<string, number>;
  starterStock: Record<string, Record<string, number>>;
  starter: Record<string, string>;
  supplies: Record<string, number>;
  packed: Record<string, boolean>;
  contracts: Record<string, Pact | null>;
  cosmetics: { owned: string[]; tint: string; aura: string; particles: string };
  markets: Record<string, Market>;
  lastClaim: number;
  goldRemainder: number;
  xpRemainder: number;
  lastResult: string;
};
const rank = (x: unknown, max = 10000) =>
  Number.isFinite(Number(x))
    ? Math.max(0, Math.min(max, Math.floor(Number(x))))
    : 0;
export function migrateTown(raw: any): TownState {
  const t: TownState = {
    materials: rank(raw?.materials, 1e12),
    totalSpent: rank(raw?.totalSpent, 1e15),
    buildings: {},
    ascended: {},
    mastery: {},
    codexLevel: rank(raw?.codexLevel),
    training: {},
    starterStock: {},
    starter: {},
    supplies: {},
    packed: {},
    contracts: {},
    cosmetics: { owned: [], tint: "", aura: "", particles: "" },
    markets: {},
    lastClaim: Math.min(
      Date.now(),
      Math.max(0, Number(raw?.lastClaim) || Date.now()),
    ),
    goldRemainder: Math.max(
      0,
      Math.min(0.999999, Number(raw?.goldRemainder) || 0),
    ),
    xpRemainder: Math.max(0, Math.min(0.999999, Number(raw?.xpRemainder) || 0)),
    lastResult: "",
  };
  for (const b of BUILDINGS) t.buildings[b.id] = rank(raw?.buildings?.[b.id]);
  for (const a of ASCENDED) t.ascended[a.id] = rank(raw?.ascended?.[a.id]);
  for (const h of HEROES) {
    t.mastery[h] = rank(raw?.mastery?.[h]);
    t.training[h] = rank(raw?.training?.[h]);
    t.starterStock[h] = {};
    for (const j of JEWELRY.filter((j) => j.kind !== "amulet"))
      t.starterStock[h][j.id] = rank(raw?.starterStock?.[h]?.[j.id], 1e9);
    const starter = raw?.starter?.[h];
    t.starter[h] =
      JEWEL_BY_ID[starter]?.kind !== "amulet" && JEWEL_BY_ID[starter]
        ? starter
        : "";
    const pact = raw?.contracts?.[h];
    t.contracts[h] = CONTRACTS.some((c) => c.id === pact?.id)
      ? { id: pact.id, tier: Math.max(1, Math.min(5, rank(pact.tier))) }
      : null;
    const m = raw?.markets?.[h];
    if (m && Array.isArray(m.offers)) {
      const offers: Offer[] = m.offers
        .filter(
          (o: any) =>
            typeof o?.id === "string" &&
            /^\d+-[0-5]$/.test(o.id) &&
            ((o.kind === "gear" && GEAR_BY_ID[o.item]?.hero === h) ||
              (o.kind === "jewel" &&
                JEWEL_BY_ID[o.item]?.kind !== "amulet" &&
                JEWEL_BY_ID[o.item]) ||
              (o.kind === "supply" && SUPPLIES.some((s) => s.id === o.item))),
        )
        .slice(0, 6)
        .map((o: any) => ({
          id: o.id,
          kind: o.kind,
          item: o.item,
          cost: Math.max(1, rank(o.cost, 1e15)),
        }));
      if (offers.length)
        t.markets[h] = {
          serial: rank(m.serial, 1e9),
          refreshes: rank(m.refreshes),
          offers,
          bought: Array.isArray(m.bought)
            ? m.bought.filter((id: unknown) => offers.some((o) => o.id === id))
            : [],
        };
    }
  }
  for (const s of SUPPLIES) {
    t.supplies[s.id] = rank(raw?.supplies?.[s.id], 1e9);
    t.packed[s.id] = raw?.packed?.[s.id] === true;
  }
  t.cosmetics.owned = Array.isArray(raw?.cosmetics?.owned)
    ? [
        ...new Set<string>(
          raw.cosmetics.owned.filter((id: unknown) =>
            COSMETICS.some((c) => c.id === id),
          ),
        ),
      ]
    : [];
  for (const kind of ["tint", "aura", "particles"] as const) {
    const id = raw?.cosmetics?.[kind];
    if (
      t.cosmetics.owned.includes(id) &&
      COSMETICS.some((c) => c.id === id && c.kind === kind)
    )
      t.cosmetics[kind] = id;
  }
  return t;
}
export const forgeCost = (save: Save, hero: string, id: string) =>
  scaledCost(
    80 * (RARITIES.indexOf(GEAR_BY_ID[id].rarity) + 1) ** 1.5,
    1.18,
    save.gear[hero].upgrades[id]?.level || 0,
  );
export const reforgeCost = (save: Save, hero: string, id: string) =>
  scaledCost(
    120 * (RARITIES.indexOf(GEAR_BY_ID[id].rarity) + 1),
    1.3,
    save.gear[hero].upgrades[id]?.reforges || 0,
  );
export const starCost = (save: Save, hero: string, zone: string) =>
  Math.ceil(
    600 *
      (EXPEDITIONS.findIndex((z) => z.id === zone) + 1) ** 2 *
      ((save.gear[hero].stars[zone] || 0) + 1) ** 2.4,
  );
export const enchantCost = (save: Save, hero: string, slot: GearSlot) =>
  scaledCost(90, 1.23, save.gear[hero].enchants[slot]?.tier || 0);
export const masteryCost = (save: Save, hero: string) =>
  scaledCost(250, 1.35, save.town.mastery[hero]);
export const codexCost = (save: Save) =>
  scaledCost(300, 1.3, save.town.codexLevel);
export const trainingCost = (save: Save, hero: string) =>
  scaledCost(120, 1.17, save.town.training[hero]);
export const starterCost = (save: Save, hero: string, id: string) =>
  Math.ceil(
    (120 + RARITIES.indexOf(JEWEL_BY_ID[id].rarity) * 90) *
      (1 + Math.floor(save.town.mastery[hero] / 5) * 0.6),
  );
export const contractCost = (save: Save, tier: number) =>
  Math.ceil(
    80 *
      (EXPEDITIONS.findIndex((z) => z.id === save.expedition.zone) + 1) ** 2 *
      (1 + save.expedition.heroic * 0.5) *
      tier ** 1.6,
  );
export function offlinePreview(save: Save, now = Date.now()) {
  const minutes = Math.min(
    480,
    Math.max(0, (now - save.town.lastClaim) / 60000),
  );
  return {
    gold: Math.floor(
      save.town.goldRemainder +
        minutes * 8 * save.town.buildings.treasury ** 1.2,
    ),
    xp: Math.floor(
      save.town.xpRemainder + minutes * 2 * save.town.buildings.grounds,
    ),
    minutes,
  };
}
export function settleTown(save: Save, now = Date.now()) {
  const p = offlinePreview(save, now),
    t = save.town;
  t.goldRemainder =
    t.goldRemainder + p.minutes * 8 * t.buildings.treasury ** 1.2 - p.gold;
  t.xpRemainder = t.xpRemainder + p.minutes * 2 * t.buildings.grounds - p.xp;
  save.gold = Math.min(1e15, save.gold + p.gold);
  for (const h of HEROES)
    if (save.heroes[h].xp < XP_LIMIT)
      save.heroes[h].xp = Math.min(XP_LIMIT, save.heroes[h].xp + p.xp);
  t.lastClaim = now;
  return p;
}
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];
export function ensureMarket(save: Save, hero: string, rotate = false) {
  const old = save.town.markets[hero];
  if (old && !rotate) return old;
  const serial = (old?.serial || 0) + 1,
    offers: Offer[] = [];
  const zones = EXPEDITIONS.filter((z) => save.gear[hero].clears[z.id] >= 0);
  if (!zones.length) zones.push(EXPEDITIONS[0]);
  const pool = GEAR.filter(
    (i) => i.hero === hero && zones.some((z) => z.id === i.zone),
  );
  for (let i = 0; i < 3; i++) {
    const item = pick(pool);
    offers.push({
      id: `${serial}-${i}`,
      kind: "gear",
      item: item.id,
      cost: [180, 420, 950, 2200, 5200][RARITIES.indexOf(item.rarity)],
    });
  }
  const jewel = pick(JEWELRY.filter((j) => j.kind !== "amulet"));
  offers.push({
    id: `${serial}-3`,
    kind: "jewel",
    item: jewel.id,
    cost: starterCost(save, hero, jewel.id),
  });
  for (let i = 4; i < 6; i++) {
    const item = pick(SUPPLIES);
    offers.push({
      id: `${serial}-${i}`,
      kind: "supply",
      item: item.id,
      cost: Math.ceil(item.cost * 0.85),
    });
  }
  const market: Market = {
    serial,
    refreshes: old?.refreshes || 0,
    offers,
    bought: [],
  };
  save.town.markets[hero] = market;
  return market;
}
export function cacheOdds(save: Save, hero: string, id: string) {
  const cache = CACHES.find((c) => c.id === id);
  if (!cache) return [];
  const available = EXPEDITIONS.map((z, i) => ({
    zone: z,
    weight: save.gear[hero].clears[z.id] >= 0 ? cache.weights[i] : 0,
  }));
  const total = available.reduce((n, a) => n + a.weight, 0);
  return available
    .filter((a) => a.weight > 0)
    .map((a) => ({ ...a, chance: a.weight / total }));
}
export function townEffects(save: Save, hero: string) {
  const t = save.town,
    a = t.ascended,
    b = t.buildings,
    entries = save.codex.length;
  return {
    stats: {
      damage:
        a.damage * 0.025 +
        b.barracks * 0.01 +
        b.shrine * 0.005 +
        entries * 0.0015 * (1 + t.codexLevel * 0.15),
      hp: a.hp * 12 + b.barracks * 6,
      regen: a.regen * 0.15,
      area: a.area * 0.02,
      speed: a.speed * 0.01,
    } as Stats,
    luck: b.shrine * 0.015,
    haste: a.haste * 0.02,
    xp: a.wisdom * 0.03,
    gold: a.gold * 0.04,
    mastery: t.mastery[hero],
  };
}
export function beginTownRun(save: Save, hero: string) {
  const t = save.town,
    active = SUPPLIES.filter((s) => t.packed[s.id] && t.supplies[s.id] > 0);
  for (const s of active) {
    t.supplies[s.id]--;
    if (!t.supplies[s.id]) t.packed[s.id] = false;
  }
  const starter = t.starter[hero];
  const jewelry: Record<string, number> = {};
  if (starter && t.starterStock[hero][starter] > 0) {
    t.starterStock[hero][starter]--;
    jewelry[starter] = 1 + Math.floor(t.mastery[hero] / 5);
  }
  const pact = t.contracts[hero];
  t.contracts[hero] = null;
  const market = ensureMarket(save, hero, true);
  market.refreshes = 0;
  return { active, jewelry, pact };
}
export function townAction(
  save: Save,
  hero: string,
  action: string,
): { ok: boolean; message: string } {
  const [kind, id, arg] = action.split(":"),
    t = save.town,
    g = save.gear[hero];
  let message = "",
    cost = 0,
    apply: (() => void) | undefined;
  if (kind === "building") {
    const b = BUILDINGS.find((b) => b.id === id);
    if (b) {
      cost = scaledCost(b.base, b.growth, t.buildings[id]);
      apply = () => {
        settleTown(save);
        t.buildings[id]++;
      };
      message = `${b.name} raised to level ${t.buildings[id] + 1}.`;
    }
  }
  if (kind === "forge" && g.inventory.includes(id)) {
    const u = g.upgrades[id] || { level: 0, reforges: 0, quality: 1 };
    const sparks = Math.floor(u.level / 10);
    if (t.materials < sparks)
      return { ok: false, message: `Needs ${sparks} forge sparks.` };
    cost = forgeCost(save, hero, id);
    apply = () => {
      t.materials -= sparks;
      g.upgrades[id] = { ...u, level: u.level + 1 };
    };
    message = `Forged to level ${u.level + 1}: ${GEAR_BY_ID[id].name}.`;
  }
  if (
    kind === "reforge" &&
    g.inventory.includes(id) &&
    arg in GEAR_BY_ID[id].stats
  ) {
    if (t.materials < 1)
      return {
        ok: false,
        message: "Reforging needs one forge spark; salvage spare copies first.",
      };
    const u = g.upgrades[id] || { level: 0, reforges: 0, quality: 1 };
    const choices = (Object.keys(STAT_LABELS) as GearStat[]).filter(
      (k) => !(k in GEAR_BY_ID[id].stats),
    );
    cost = reforgeCost(save, hero, id);
    apply = () => {
      t.materials--;
      g.upgrades[id] = {
        ...u,
        reforges: u.reforges + 1,
        from: arg as GearStat,
        to: pick(choices),
        quality: 0.85 + Math.random() * 0.4,
      };
    };
    message = "A new affix is bound to the item.";
  }
  if (kind === "salvage") {
    let count = 0,
      value = 0;
    for (const [piece, n] of Object.entries(g.duplicates)) {
      count += n;
      value +=
        n *
        (RARITIES.indexOf(GEAR_BY_ID[piece].rarity) + 1) *
        (id === "gold" ? 15 : 3);
    }
    if (!count) return { ok: false, message: "No spare copies to salvage." };
    if (id !== "gold" && id !== "sparks")
      return { ok: false, message: "Unknown salvage choice." };
    g.duplicates = {};
    if (id === "gold") save.gold = Math.min(1e15, save.gold + value);
    else t.materials += value;
    t.lastResult = `Salvaged ${count} spare copies for ${value} ${id}. Original pieces kept.`;
    return { ok: true, message: t.lastResult };
  }
  if (
    kind === "star" &&
    EXPEDITIONS.some((z) => z.id === id) &&
    g.stars[id] < 5
  ) {
    cost = starCost(save, hero, id);
    apply = () => {
      g.stars[id]++;
    };
    message =
      "The entire zone collection gains a star. Heroic unlocks are unchanged.";
  }
  if (
    kind === "enchant" &&
    heroSlots(hero).includes(id as GearSlot) &&
    g.equipped[id as GearSlot] &&
    arg in ENCHANT_BASE
  ) {
    const slot = id as GearSlot,
      tier = g.enchants[slot]?.tier || 0;
    cost = enchantCost(save, hero, slot);
    apply = () => {
      g.enchants[slot] = { tier: tier + 1, stat: arg as GearStat };
    };
    message = `${id} enchant advanced to tier ${tier + 1}.`;
  }
  if (kind === "mastery") {
    cost = masteryCost(save, hero);
    apply = () => {
      t.mastery[hero]++;
    };
    message = "Jewelry gains one maximum rank and +3% stat power.";
  }
  if (kind === "codex") {
    cost = codexCost(save);
    apply = () => {
      t.codexLevel++;
    };
    message =
      "Codex lore deepens: each witnessed relic grants more account damage.";
  }
  if (
    kind === "choose-starter" &&
    JEWEL_BY_ID[id]?.kind !== "amulet" &&
    t.starterStock[hero][id] > 0
  ) {
    t.starter[hero] = id;
    return {
      ok: true,
      message: `${JEWEL_BY_ID[id].name} kits selected for upcoming runs.`,
    };
  }
  if (
    kind === "starter" &&
    JEWEL_BY_ID[id] &&
    JEWEL_BY_ID[id].kind !== "amulet" &&
    save.codex.includes(id)
  ) {
    cost = starterCost(save, hero, id);
    apply = () => {
      t.starterStock[hero][id] = (t.starterStock[hero][id] || 0) + 1;
      t.starter[hero] = id;
    };
    message = `One ${JEWEL_BY_ID[id].name} starting kit prepared for this hero.`;
  }
  if (kind === "ascend") {
    const a = ASCENDED.find((a) => a.id === id);
    if (a && (save.meta[id] || 0) >= a.cap) {
      cost = scaledCost(a.base, 1.28, t.ascended[id]);
      apply = () => {
        t.ascended[id]++;
      };
      message = `${a.name} advanced. There is no gameplay rank cap.`;
    }
  }
  if (kind === "supply") {
    const s = SUPPLIES.find((s) => s.id === id);
    if (s) {
      cost = s.cost;
      apply = () => {
        t.supplies[id]++;
        t.packed[id] = true;
      };
      message = `${s.name} bought and packed. One is consumed next expedition.`;
    }
  }
  if (kind === "pack" && SUPPLIES.some((s) => s.id === id)) {
    t.packed[id] = !t.packed[id];
    return {
      ok: true,
      message: t.packed[id]
        ? "Supply packed for next run."
        : "Supply put back into storage.",
    };
  }
  if (kind === "refresh") {
    const market = ensureMarket(save, hero);
    cost = scaledCost(90, 1.4, market.refreshes);
    apply = () => {
      market.refreshes++;
      ensureMarket(save, hero, true);
    };
    message =
      "Black Market stock refreshed. Sold offers cannot be bought twice.";
  }
  if (kind === "market") {
    const market = ensureMarket(save, hero),
      offer = market.offers.find((o) => o.id === id);
    if (offer && !market.bought.includes(id)) {
      cost = offer.cost;
      apply = () => {
        market.bought.push(id);
        if (offer.kind === "gear") {
          if (g.inventory.includes(offer.item))
            g.duplicates[offer.item] = (g.duplicates[offer.item] || 0) + 1;
          else g.inventory.push(offer.item);
        } else if (offer.kind === "jewel") {
          if (!save.codex.includes(offer.item)) save.codex.push(offer.item);
          t.starterStock[hero][offer.item] =
            (t.starterStock[hero][offer.item] || 0) + 1;
          t.starter[hero] = offer.item;
        } else {
          t.supplies[offer.item]++;
          t.packed[offer.item] = true;
        }
      };
      message =
        "Market purchase recorded. Owned gear becomes a spare copy; a relic purchase is a starting kit.";
    }
  }
  if (kind === "cache") {
    const cache = CACHES.find((c) => c.id === id),
      odds = cacheOdds(save, hero, id);
    if (cache && odds.length) {
      cost = cache.cost;
      apply = () => {
        let roll = Math.random(),
          chosen = odds[odds.length - 1];
        for (const row of odds) {
          roll -= row.chance;
          if (roll <= 0) {
            chosen = row;
            break;
          }
        }
        const item = pick(
          GEAR.filter((i) => i.hero === hero && i.zone === chosen.zone.id),
        );
        if (g.inventory.includes(item.id)) {
          g.duplicates[item.id] = (g.duplicates[item.id] || 0) + 1;
          message = `Cache: spare copy of ${item.name}. Salvage it at the Forge.`;
        } else {
          g.inventory.push(item.id);
          message = `Cache: ${item.name}. Kept in the Armory.`;
        }
      };
    }
  }
  if (kind === "train" && save.heroes[hero].xp < XP_LIMIT) {
    cost = trainingCost(save, hero);
    const amount = 100 + t.training[hero] * 50;
    apply = () => {
      save.heroes[hero].xp = Math.min(XP_LIMIT, save.heroes[hero].xp + amount);
      t.training[hero]++;
    };
    message = `Training awards up to ${amount} hero talent XP.`;
  }
  if (kind === "contract") {
    const c = CONTRACTS.find((c) => c.id === id),
      tier = Number(arg);
    if (c && Number.isInteger(tier) && tier >= 1 && tier <= 5) {
      cost = contractCost(save, tier);
      apply = () => {
        t.contracts[hero] = { id, tier };
      };
      message = `${c.name}, seal ${tier}, queued for one expedition. Replaces any queued contract.`;
    }
  }
  if (kind === "cosmetic") {
    const c = COSMETICS.find((c) => c.id === id);
    if (c) {
      if (t.cosmetics.owned.includes(id)) {
        t.cosmetics[c.kind as "tint" | "aura" | "particles"] = id;
        return { ok: true, message: `${c.name} equipped.` };
      }
      cost = c.cost;
      apply = () => {
        t.cosmetics.owned.push(id);
        t.cosmetics[c.kind as "tint" | "aura" | "particles"] = id;
      };
      message = `${c.name} unlocked and equipped.`;
    }
  }
  if (kind === "clear-cosmetic" && ["tint", "aura", "particles"].includes(id)) {
    t.cosmetics[id as "tint" | "aura" | "particles"] = "";
    return { ok: true, message: "Original palette restored." };
  }
  if (!apply || !Number.isFinite(cost) || cost <= 0)
    return { ok: false, message: "This purchase is not available yet." };
  if (save.gold < cost) return { ok: false, message: "Not enough gold." };
  save.gold -= cost;
  t.totalSpent = Math.min(1e15, t.totalSpent + cost);
  apply();
  t.lastResult = message;
  return { ok: true, message };
}
