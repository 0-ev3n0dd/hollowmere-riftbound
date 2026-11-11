import type { Weapon } from "./progression";

export const RARITIES = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
] as const;
export type GearRarity = (typeof RARITIES)[number];
export const SLOT_LABELS = {
  head: "Head",
  shoulder: "Shoulder",
  chest: "Chest",
  waist: "Waist",
  legs: "Legs",
  feet: "Feet",
  wrist: "Wrist",
  hands: "Hands",
  back: "Back",
  main: "Main Hand",
  off: "Off Hand",
  ranged: "Ranged",
} as const;
export type GearSlot = keyof typeof SLOT_LABELS;
export const SLOT_GLYPHS: Record<GearSlot, string> = {
  head: "♧",
  shoulder: "⌁",
  chest: "♜",
  waist: "∞",
  legs: "Ⅱ",
  feet: "⌇",
  wrist: "◎",
  hands: "✧",
  back: "◩",
  main: "⚔",
  off: "◈",
  ranged: "✦",
};
export const SET_SLOTS: GearSlot[] = [
  "head",
  "shoulder",
  "chest",
  "waist",
  "legs",
  "feet",
  "wrist",
  "hands",
];
export const STAT_LABELS = {
  damage: "Damage",
  haste: "Cooldown reduction",
  hp: "Max vitality",
  crit: "Critical chance",
  critDamage: "Critical damage",
  speed: "Move speed",
  reduction: "Damage reduction",
  regen: "Vitality / second",
  pickup: "Pickup range",
  gold: "Gold found",
  area: "Spell area",
  targets: "Extra targets",
  doubleStrike: "Double-strike chance",
} as const;
export type GearStat = keyof typeof STAT_LABELS;
export type Stats = Partial<Record<GearStat, number>>;
export type Expedition = {
  id: string;
  name: string;
  subtitle: string;
  rarity: GearRarity;
  chance: number;
  scale: number;
  tint: string;
  color: string;
  enemies: number[];
  bosses: { id: string; name: string; at: number; art: number }[];
};
const zone = (
  id: string,
  name: string,
  subtitle: string,
  index: number,
  color: string,
  tint: string,
  enemies: number[],
  names: string[],
  arts: number[],
): Expedition => ({
  id,
  name,
  subtitle,
  rarity: RARITIES[index],
  chance: [0.6, 0.5, 0.4, 0.3, 0.2][index],
  scale: [1, 1.4, 1.9, 2.6, 3.5][index],
  color,
  tint,
  enemies,
  bosses: names.map((name, i) => ({
    id: `${id}-${i}`,
    name,
    at: (i + 1) * 60,
    art: arts[i],
  })),
});
export const EXPEDITIONS = [
  zone(
    "briar",
    "Briarthread Reach",
    "Where old roots remember every footstep.",
    0,
    "#718664",
    "#93ae7622",
    [0, 1, 2, 3],
    ["Morrow Antler", "The Mossbound Knell", "Veyra of the Thorns"],
    [0, 4, 1],
  ),
  zone(
    "cinder",
    "Cinderwake Fen",
    "Warm ash drifts over a sunken kingdom.",
    1,
    "#ac7656",
    "#bc684c77",
    [4, 5, 6, 7],
    ["Coaljaw Harrier", "Ember-Mire Matron", "Orun, the Last Cinder"],
    [2, 5, 3],
  ),
  zone(
    "rime",
    "Rimeglass Expanse",
    "Blue silence beneath a fractured sky.",
    2,
    "#5e91aa",
    "#7fbcd2aa",
    [8, 9, 10, 11],
    ["Shiverhorn", "The Glassbound Witness", "Neris, White Silence"],
    [6, 1, 7],
  ),
  zone(
    "dusk",
    "Duskroot Ossuary",
    "Even the shadows have forgotten their names.",
    3,
    "#8d73a7",
    "#65507d99",
    [12, 13, 14, 15],
    ["Warden of Unlit Roads", "The Bonebell Choir", "Sablewake Regent"],
    [3, 7, 5],
  ),
  zone(
    "astral",
    "The Astral Scar",
    "The last light falls inward, not down.",
    4,
    "#ac8b40",
    "#7164a377",
    [0, 5, 10, 15],
    ["The Broken Astrolabe", "Aster, Hollow Star", "Keeper of the Last Dawn"],
    [4, 6, 2],
  ),
];
export const getExpedition = (id: string) =>
  EXPEDITIONS.find((z) => z.id === id) || EXPEDITIONS[0];
const HEROES = ["c112", "c028", "c030", "c044", "c080", "c001"];
const HERO_GEAR: Record<
  string,
  { title: string; weapon: string; primary: GearStat; ranged?: boolean }
> = {
  c112: {
    title: "Moonveil Sentinel",
    weapon: "Crescent Edge",
    primary: "damage",
  },
  c028: { title: "Starsewn Arcanist", weapon: "Runebranch", primary: "haste" },
  c030: { title: "Dawnroot Keeper", weapon: "Sunward Crook", primary: "regen" },
  c044: {
    title: "Gravebound Reaver",
    weapon: "Hushcleaver",
    primary: "critDamage",
  },
  c080: {
    title: "Skyglass Seer",
    weapon: "Thunder Prism",
    primary: "crit",
    ranged: true,
  },
  c001: {
    title: "Lanternwoven Caller",
    weapon: "Wisp Lantern",
    primary: "area",
    ranged: true,
  },
};
export const heroSlots = (hero: string): GearSlot[] => [
  ...SET_SLOTS,
  "back",
  ...(HERO_GEAR[hero]?.ranged
    ? ["ranged" as const]
    : ["main" as const, "off" as const]),
];
const slotNames: Record<GearSlot, string> = {
  head: "Crown",
  shoulder: "Mantle",
  chest: "Vestment",
  waist: "Sash",
  legs: "Legwraps",
  feet: "Treads",
  wrist: "Bindings",
  hands: "Grasps",
  back: "Travel Shroud",
  main: "",
  off: "Memory Seal",
  ranged: "",
};
const lines: Record<GearSlot, GearStat[]> = {
  head: ["crit", "critDamage", "hp", "reduction", "regen"],
  shoulder: ["damage", "area", "haste", "hp", "crit"],
  chest: ["hp", "reduction", "regen", "damage", "critDamage"],
  waist: ["gold", "pickup", "hp", "speed", "regen"],
  legs: ["reduction", "hp", "speed", "regen", "crit"],
  feet: ["speed", "pickup", "haste", "reduction", "hp"],
  wrist: ["haste", "crit", "damage", "area", "regen"],
  hands: ["damage", "doubleStrike", "critDamage", "haste", "crit"],
  back: ["pickup", "gold", "area", "reduction", "hp"],
  main: ["damage", "critDamage", "doubleStrike", "targets", "haste"],
  off: ["area", "haste", "crit", "regen", "reduction"],
  ranged: ["damage", "targets", "critDamage", "doubleStrike", "haste"],
};
export const GEAR_STAT_BASE: Record<GearStat, number> = {
  damage: 0.025,
  haste: 0.018,
  hp: 9,
  crit: 0.008,
  critDamage: 0.04,
  speed: 0.012,
  reduction: 0.008,
  regen: 0.08,
  pickup: 0.035,
  gold: 0.025,
  area: 0.025,
  targets: 1,
  doubleStrike: 0.008,
};
export type GearItem = {
  id: string;
  hero: string;
  zone: string;
  rarity: GearRarity;
  slot: GearSlot;
  name: string;
  set: string;
  boss: string;
  stats: Stats;
};
export const GEAR: GearItem[] = HEROES.flatMap((hero) =>
  EXPEDITIONS.flatMap((z, zi) =>
    heroSlots(hero).map((slot, si) => {
      const set = `${["Briarbound", "Ashen", "Rimewoven", "Dusksealed", "Astral"][zi]} ${HERO_GEAR[hero].title}`;
      const stats: Stats = {};
      for (const stat of lines[slot].slice(0, zi + 1))
        stats[stat] =
          stat === "targets"
            ? 1
            : GEAR_STAT_BASE[stat] * [1, 1.4, 1.9, 2.6, 3.5][zi];
      return {
        id: `${hero}-${z.id}-${slot}`,
        hero,
        zone: z.id,
        rarity: z.rarity,
        slot,
        name: `${set} ${slot === "main" || slot === "ranged" ? HERO_GEAR[hero].weapon : slotNames[slot]}`,
        set,
        boss: z.bosses[si % 3].id,
        stats,
      };
    }),
  ),
);
export const GEAR_BY_ID = Object.fromEntries(
  GEAR.map((i) => [i.id, i]),
) as Record<string, GearItem>;
export const ENCHANT_BASE: Stats = {
  damage: 0.012,
  hp: 6,
  haste: 0.007,
  regen: 0.06,
  area: 0.015,
  crit: 0.004,
  gold: 0.018,
  pickup: 0.02,
  reduction: 0.004,
  speed: 0.006,
};
export type ItemUpgrade = {
  level: number;
  reforges: number;
  from?: GearStat;
  to?: GearStat;
  quality: number;
};
export type HeroGear = {
  upgrades: Record<string, ItemUpgrade>;
  enchants: Partial<Record<GearSlot, { tier: number; stat: GearStat }>>;
  duplicates: Record<string, number>;
  inventory: string[];
  equipped: Partial<Record<GearSlot, string>>;
  stars: Record<string, number>;
  clears: Record<string, number>;
};
export function emptyGear(): HeroGear {
  return {
    upgrades: {},
    enchants: {},
    duplicates: {},
    inventory: [],
    equipped: {},
    stars: Object.fromEntries(EXPEDITIONS.map((z) => [z.id, 0])),
    clears: Object.fromEntries(EXPEDITIONS.map((z) => [z.id, -1])),
  };
}
export function migrateGear(raw: any, hero: string): HeroGear {
  const result = emptyGear();
  result.inventory = [
    ...new Set<string>(
      Array.isArray(raw?.inventory)
        ? raw.inventory.filter(
            (id: unknown) =>
              typeof id === "string" && GEAR_BY_ID[id]?.hero === hero,
          )
        : [],
    ),
  ];
  for (const slot of heroSlots(hero)) {
    const id = raw?.equipped?.[slot];
    if (
      typeof id === "string" &&
      result.inventory.includes(id) &&
      GEAR_BY_ID[id].slot === slot
    )
      result.equipped[slot] = id;
  }
  for (const z of EXPEDITIONS) {
    const clear = raw?.clears?.[z.id];
    result.clears[z.id] = Number.isFinite(clear)
      ? Math.min(5, Math.max(-1, Math.floor(clear)))
      : -1;
    const star = Number(raw?.stars?.[z.id]);
    result.stars[z.id] = Number.isFinite(star)
      ? Math.min(5, Math.max(0, Math.floor(star)))
      : 0;
  }
  for (const id of result.inventory) {
    const u = raw?.upgrades?.[id];
    if (u && typeof u === "object") {
      const rank = (v: unknown) =>
        Number.isFinite(Number(v))
          ? Math.max(0, Math.min(10000, Math.floor(Number(v))))
          : 0;
      const upgrade: ItemUpgrade = {
        level: rank(u.level),
        reforges: rank(u.reforges),
        quality: Math.max(0.85, Math.min(1.25, Number(u.quality) || 1)),
      };
      if (
        u.from in GEAR_BY_ID[id].stats &&
        u.to in STAT_LABELS &&
        !(u.to in GEAR_BY_ID[id].stats)
      ) {
        upgrade.from = u.from;
        upgrade.to = u.to;
      }
      result.upgrades[id] = upgrade;
    }
    const count = Number(raw?.duplicates?.[id]);
    if (Number.isFinite(count) && count > 0)
      result.duplicates[id] = Math.min(1e9, Math.floor(count));
  }
  for (const slot of heroSlots(hero)) {
    const e = raw?.enchants?.[slot];
    if (e && e.stat in ENCHANT_BASE && Number.isFinite(Number(e.tier)))
      result.enchants[slot] = {
        tier: Math.max(0, Math.min(10000, Math.floor(Number(e.tier)))),
        stat: e.stat,
      };
  }
  return result;
}
export const maxHeroic = (gear: HeroGear, zone: string) =>
  Math.min(5, (gear.clears[zone] ?? -1) + 1);
export function itemStats(item: GearItem, gear: HeroGear): Stats {
  const u = gear.upgrades[item.id];
  const multiplier =
    (1 + (gear.stars[item.zone] || 0) * 0.18) * (1 + (u?.level || 0) * 0.04);
  const stats = { ...item.stats };
  if (u?.from && u.to && u.from in stats) {
    delete stats[u.from];
    stats[u.to] =
      u.to === "targets"
        ? 1
        : GEAR_STAT_BASE[u.to] *
          [1, 1.4, 1.9, 2.6, 3.5][RARITIES.indexOf(item.rarity)] *
          u.quality;
  }
  return Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [
      key,
      key === "targets"
        ? value + Math.floor((u?.level || 0) / 30)
        : value * multiplier,
    ]),
  );
}
export function enchantStats(gear: HeroGear): Stats {
  const result: Stats = {};
  for (const [slot, e] of Object.entries(gear.enchants))
    if (
      e &&
      gear.equipped[slot as GearSlot] &&
      gear.inventory.includes(gear.equipped[slot as GearSlot]!)
    )
      result[e.stat] =
        (result[e.stat] || 0) + (ENCHANT_BASE[e.stat] || 0) * e.tier;
  return result;
}
export function addStats(...sources: Stats[]): Stats {
  const result: Stats = {};
  for (const source of sources)
    for (const [k, v] of Object.entries(source))
      result[k as GearStat] = (result[k as GearStat] || 0) + v;
  return result;
}
export function setStatus(hero: string, gear: HeroGear) {
  return EXPEDITIONS.map((z, zi) => {
    const pieces = Object.values(gear.equipped)
      .map((id) => GEAR_BY_ID[id!])
      .filter(
        (i) =>
          i && i.hero === hero && i.zone === z.id && SET_SLOTS.includes(i.slot),
      );
    const empowered = pieces.length === 8 && gear.stars[z.id] >= 5;
    const factor = [1, 1.2, 1.45, 1.8, 2.2][zi] * (empowered ? 1.5 : 1);
    const primary = HERO_GEAR[hero]?.primary || "damage";
    const four: Stats = {
      [primary]:
        (primary === "regen" ? 0.65 : primary === "crit" ? 0.04 : 0.08) *
        factor,
    };
    const eight: Stats = {
      doubleStrike: 0.04 * factor,
      targets: empowered ? 2 : 1,
    };
    return {
      zone: z.id,
      name: GEAR.find((i) => i.hero === hero && i.zone === z.id)!.set,
      count: pieces.length,
      empowered,
      four,
      eight,
      stats: addStats(
        pieces.length >= 4 ? four : {},
        pieces.length >= 8 ? eight : {},
      ),
    };
  });
}
export function gearTotals(hero: string, gear: HeroGear): Stats {
  return addStats(
    ...Object.values(gear.equipped)
      .map((id) => GEAR_BY_ID[id!])
      .filter((i) => i?.hero === hero && gear.inventory.includes(i.id))
      .map((i) => itemStats(i, gear)),
    ...setStatus(hero, gear).map((s) => s.stats),
    enchantStats(gear),
  );
}
export function formatStat(key: string, value: number): string {
  const k = key as GearStat;
  const number =
    k === "hp" || k === "targets"
      ? Math.round(value).toString()
      : k === "regen"
        ? value.toFixed(2)
        : `${(value * 100).toFixed(1)}%`;
  return `${value >= 0 ? "+" : ""}${number} ${STAT_LABELS[k]}`;
}
export const statText = (stats: Stats) =>
  Object.entries(stats)
    .filter(([, v]) => Math.abs(v) > 1e-6)
    .map(([k, v]) => formatStat(k, v));
export function equipGear(hero: string, gear: HeroGear, id: string): boolean {
  const item = GEAR_BY_ID[id];
  if (
    !item ||
    item.hero !== hero ||
    !gear.inventory.includes(id) ||
    !heroSlots(hero).includes(item.slot)
  )
    return false;
  gear.equipped[item.slot] = id;
  return true;
}
export function rollBossGear(
  hero: string,
  gear: HeroGear,
  boss: string,
  random = Math.random,
) {
  const found: GearItem[] = [];
  let duplicates = 0;
  for (const item of GEAR.filter((i) => i.hero === hero && i.boss === boss))
    if (random() < getExpedition(item.zone).chance) {
      if (gear.inventory.includes(item.id)) {
        duplicates++;
        gear.duplicates[item.id] = (gear.duplicates[item.id] || 0) + 1;
      } else {
        gear.inventory.push(item.id);
        found.push(item);
      }
    }
  return { found, duplicates };
}

export type Jewel = {
  id: string;
  name: string;
  kind: "ring" | "trinket" | "amulet";
  rarity: GearRarity;
  glyph: string;
  stats: Stats;
  max: number;
  desc: string;
  remake?: Weapon;
};
export const JEWELRY: Jewel[] = [
  {
    id: "cinderloop",
    name: "Cinderloop",
    kind: "ring",
    rarity: "uncommon",
    glyph: "◎",
    stats: { damage: 0.04 },
    max: 3,
    desc: "A quiet ember feeds every strike.",
  },
  {
    id: "quiet-orbit",
    name: "Quiet Orbit",
    kind: "ring",
    rarity: "rare",
    glyph: "◎",
    stats: { haste: 0.035 },
    max: 3,
    desc: "The space between casts grows smaller.",
  },
  {
    id: "glimmercoil",
    name: "Glimmercoil",
    kind: "ring",
    rarity: "rare",
    glyph: "◎",
    stats: { crit: 0.02, critDamage: 0.04 },
    max: 3,
    desc: "An omen waits at the edge of every blow.",
  },
  {
    id: "vigil-band",
    name: "Vigil Band",
    kind: "ring",
    rarity: "uncommon",
    glyph: "◎",
    stats: { hp: 18 },
    max: 3,
    desc: "Borrow strength from a watch that never ends.",
  },
  {
    id: "wayfarer-loop",
    name: "Wayfarer Loop",
    kind: "ring",
    rarity: "uncommon",
    glyph: "◎",
    stats: { speed: 0.035 },
    max: 3,
    desc: "Keep one step ahead of the night.",
  },
  {
    id: "fortune-thread",
    name: "Fortune Thread",
    kind: "ring",
    rarity: "rare",
    glyph: "◎",
    stats: { gold: 0.08, pickup: 0.08 },
    max: 3,
    desc: "The Hollow lets go of its treasures.",
  },
  {
    id: "stoneheart-token",
    name: "Stoneheart Token",
    kind: "trinket",
    rarity: "rare",
    glyph: "⬡",
    stats: { reduction: 0.025, regen: 0.2 },
    max: 3,
    desc: "A small shelter you can carry.",
  },
  {
    id: "echo-chime",
    name: "Echo Chime",
    kind: "trinket",
    rarity: "epic",
    glyph: "♧",
    stats: { doubleStrike: 0.04 },
    max: 3,
    desc: "Sometimes a strike remembers itself.",
  },
  {
    id: "hollow-compass",
    name: "Hollow Compass",
    kind: "trinket",
    rarity: "rare",
    glyph: "◈",
    stats: { pickup: 0.18, area: 0.04 },
    max: 3,
    desc: "All lost things know the way home.",
  },
  {
    id: "forked-sigil",
    name: "Forked Sigil",
    kind: "trinket",
    rarity: "epic",
    glyph: "⋔",
    stats: { targets: 1 },
    max: 3,
    desc: "Every power reaches one more target.",
  },
  {
    id: "waning-mirror",
    name: "Waning Mirror",
    kind: "amulet",
    rarity: "legendary",
    glyph: "☽",
    stats: { area: 0.04 },
    max: 3,
    remake: "blade",
    desc: "Remakes Moonblades into interlaced, counter-turning rings.",
  },
  {
    id: "fallen-prism",
    name: "Fallen Prism",
    kind: "amulet",
    rarity: "legendary",
    glyph: "✦",
    stats: { damage: 0.04 },
    max: 3,
    remake: "bolt",
    desc: "Remakes Arcane Bolt into seeking, starburst projectiles.",
  },
  {
    id: "first-rain",
    name: "Pendant of First Rain",
    kind: "amulet",
    rarity: "legendary",
    glyph: "☼",
    stats: { regen: 0.25 },
    max: 3,
    remake: "aura",
    desc: "Remakes Hallowed Ground into a wider healing double pulse.",
  },
  {
    id: "mourner-hourglass",
    name: "Mourner's Hourglass",
    kind: "amulet",
    rarity: "legendary",
    glyph: "⌛",
    stats: { damage: 0.04 },
    max: 3,
    remake: "axe",
    desc: "Remakes Reaper Axe into returning, winter-touched blades.",
  },
  {
    id: "stormglass-locket",
    name: "Stormglass Locket",
    kind: "amulet",
    rarity: "legendary",
    glyph: "ϟ",
    stats: { crit: 0.015 },
    max: 3,
    remake: "lightning",
    desc: "Remakes Stormcall into a branching storm with extra jumps.",
  },
  {
    id: "deepwake-lantern",
    name: "Deepwake Lantern",
    kind: "amulet",
    rarity: "legendary",
    glyph: "✧",
    stats: { haste: 0.025 },
    max: 3,
    remake: "familiar",
    desc: "Remakes Wisp Companion into a pair of lantern familiars.",
  },
];
export const JEWEL_BY_ID = Object.fromEntries(
  JEWELRY.map((j) => [j.id, j]),
) as Record<string, Jewel>;
export const JEWEL_CAPACITY = { ring: 2, trinket: 2, amulet: 1 };
export function jewelryStats(worn: Record<string, number>, mastery = 0): Stats {
  return addStats(
    ...Object.entries(worn)
      .filter(([id]) => JEWEL_BY_ID[id])
      .map(([id, rank]) =>
        Object.fromEntries(
          Object.entries(JEWEL_BY_ID[id].stats).map(([k, v]) => [
            k,
            v * rank * (1 + mastery * 0.03),
          ]),
        ),
      ),
  );
}
export function jewelryReplacement(
  worn: Record<string, number>,
  jewel: Jewel,
): string | undefined {
  if (worn[jewel.id]) return undefined;
  const same = Object.keys(worn).filter(
    (id) => JEWEL_BY_ID[id]?.kind === jewel.kind,
  );
  return same.length >= JEWEL_CAPACITY[jewel.kind]
    ? same.sort((a, b) => worn[a] - worn[b])[0]
    : undefined;
}
export function wearJewelry(
  worn: Record<string, number>,
  id: string,
  bonusRanks = 0,
): boolean {
  const jewel = JEWEL_BY_ID[id];
  if (!jewel || (worn[id] || 0) >= jewel.max + bonusRanks) return false;
  const old = jewelryReplacement(worn, jewel);
  if (old) delete worn[old];
  worn[id] = Math.min(jewel.max + bonusRanks, (worn[id] || 0) + 1);
  return true;
}
