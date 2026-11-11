import {
  EXPEDITIONS,
  JEWEL_BY_ID,
  migrateGear,
  maxHeroic,
  type HeroGear,
} from "./gearing";
/** Original Hollowmere progression catalog and pure save/talent rules. */
export const VERSION = "0.3.0";
export const HERO_IDS = ["c112", "c028", "c030", "c044", "c080", "c001"];
export type Weapon =
  | "blade"
  | "bolt"
  | "aura"
  | "axe"
  | "lightning"
  | "familiar"
  | "ember"
  | "frost"
  | "thorn"
  | "comet"
  | "scythe"
  | "lance"
  | "venom"
  | "chime"
  | "mine"
  | "raven"
  | "tempest"
  | "fissure";
export type Passive =
  | "power"
  | "haste"
  | "reach"
  | "vitality"
  | "swiftness"
  | "area"
  | "regen"
  | "crit"
  | "armor"
  | "luck"
  | "wisdom"
  | "fortune"
  | "force"
  | "amount"
  | "duration"
  | "leech";
export type SpellDef = {
  name: string;
  glyph: string;
  desc: string;
  color: string;
  max: number;
  cadence: number;
};
const spell = (
  name: string,
  glyph: string,
  desc: string,
  color: string,
  cadence: number,
): SpellDef => ({ name, glyph, desc, color, max: 6, cadence });
export const SPELLS: Record<Weapon, SpellDef> = {
  blade: spell(
    "Moonblades",
    "✧",
    "Orbiting steel cuts nearby foes. Each rank adds damage and reach.",
    "#e5d5aa",
    0.3,
  ),
  bolt: spell(
    "Arcane Bolt",
    "✦",
    "Aimed piercing bolts. Ranks add power and projectiles.",
    "#a8ccd0",
    0.9,
  ),
  aura: spell(
    "Hallowed Ground",
    "☼",
    "A close sacred ring pulses damage. Ranks widen the ring.",
    "#e4c67f",
    0.65,
  ),
  axe: spell(
    "Reaper Axe",
    "⚒",
    "Spinning axes cleave a crowd and arc downward.",
    "#b5c1cb",
    1.9,
  ),
  lightning: spell(
    "Stormcall",
    "ϟ",
    "A living arc leaps between foes. Ranks add jumps.",
    "#c9d6ac",
    2,
  ),
  familiar: spell(
    "Wisp Companion",
    "❋",
    "A circling spirit fires seeking embers.",
    "#d1b1c9",
    1.1,
  ),
  ember: spell(
    "Cinder Fan",
    "♨",
    "Fan out burning embers in a wide cone. Ranks increase the fan.",
    "#dda883",
    1.3,
  ),
  frost: spell(
    "Rime Needles",
    "❄",
    "Rapid ice shards chill foes, slowing their approach.",
    "#b8d9dd",
    0.85,
  ),
  thorn: spell(
    "Briar Crown",
    "✺",
    "A ring of thorns launches outward in every direction.",
    "#97b88c",
    2.1,
  ),
  comet: spell(
    "Falling Star",
    "✶",
    "A delayed star crashes onto the nearest cluster.",
    "#e7c18c",
    2.8,
  ),
  scythe: spell(
    "Dusk Sickle",
    "☽",
    "A broad sickle returns to you, piercing on its way home.",
    "#c0b2d5",
    1.8,
  ),
  lance: spell(
    "Glass Lance",
    "◆",
    "A swift, long-range lance pierces a line of enemies.",
    "#c2dcd4",
    1.4,
  ),
  venom: spell(
    "Mire Bloom",
    "❧",
    "Poison blooms linger beneath foes and deal repeated damage.",
    "#b5c78b",
    3,
  ),
  chime: spell(
    "Grave Chime",
    "♧",
    "An expanding shock ring pushes back the encroaching crowd.",
    "#c7bfa4",
    2.4,
  ),
  mine: spell(
    "Rune Seeds",
    "▧",
    "Drop armed runes that detonate when a foe draws near.",
    "#deb89e",
    1.7,
  ),
  raven: spell(
    "Gloam Raven",
    "♠",
    "A flock of dark, homing feathers hunts across the Hollow.",
    "#b6a8c6",
    1.5,
  ),
  tempest: spell(
    "Tempest Pearls",
    "◌",
    "Storm pearls circle farther out and strike on contact.",
    "#c2d4b2",
    0.35,
  ),
  fissure: spell(
    "Faultline",
    "⋈",
    "Fracture the ground in a broad line toward the closest foe.",
    "#c6a17e",
    2.2,
  ),
};
export const WEAPON_KEYS = Object.keys(SPELLS) as Weapon[];
export const emptyWeapons = () =>
  Object.fromEntries(WEAPON_KEYS.map((k) => [k, 0])) as Record<Weapon, number>;
export const PASSIVES: Record<
  Passive,
  { name: string; glyph: string; desc: string; max: number }
> = {
  power: {
    name: "Rising Power",
    glyph: "✹",
    desc: "+10% damage per rank.",
    max: 5,
  },
  haste: {
    name: "Quickening",
    glyph: "»",
    desc: "+8% attack rate per rank.",
    max: 5,
  },
  reach: {
    name: "Soul Harvest",
    glyph: "◎",
    desc: "+25% pickup radius per rank.",
    max: 5,
  },
  vitality: {
    name: "Wild Heart",
    glyph: "♡",
    desc: "+20 maximum vitality and heal 20 per rank.",
    max: 5,
  },
  swiftness: {
    name: "Lightfoot",
    glyph: "➶",
    desc: "+7% movement speed per rank.",
    max: 5,
  },
  area: {
    name: "Widening Rift",
    glyph: "◉",
    desc: "+12% area and orbit radius per rank.",
    max: 5,
  },
  regen: {
    name: "Living Spring",
    glyph: "❧",
    desc: "Regenerate 0.35 vitality per second per rank.",
    max: 5,
  },
  crit: {
    name: "Keen Omen",
    glyph: "◇",
    desc: "+5% chance to deal double damage per rank.",
    max: 5,
  },
  armor: {
    name: "Stoneweave",
    glyph: "⬡",
    desc: "Reduce contact damage by 1 per rank (minimum 1).",
    max: 5,
  },
  luck: {
    name: "Lucky Thread",
    glyph: "✤",
    desc: "+8% luck per rank: more rare and epic draft cards.",
    max: 5,
  },
  wisdom: {
    name: "Memory Dew",
    glyph: "◈",
    desc: "+10% experience from gems per rank.",
    max: 5,
  },
  fortune: {
    name: "Gilded Acorn",
    glyph: "♢",
    desc: "+12% run gold per rank.",
    max: 5,
  },
  force: {
    name: "Iron Resolve",
    glyph: "➽",
    desc: "+20% weapon knockback per rank.",
    max: 5,
  },
  amount: {
    name: "Twin Echo",
    glyph: "❖",
    desc: "+3% damage per rank; extra shots at ranks 1, 3, and 5.",
    max: 5,
  },
  duration: {
    name: "Long Dusk",
    glyph: "◷",
    desc: "+18% projectile and ground-effect lifetime per rank.",
    max: 5,
  },
  leech: {
    name: "Crimson Moss",
    glyph: "♥",
    desc: "Restore 0.2 vitality on each kill per rank.",
    max: 5,
  },
};
export const PASSIVE_KEYS = Object.keys(PASSIVES) as Passive[];
export const emptyPassives = () =>
  Object.fromEntries(PASSIVE_KEYS.map((k) => [k, 0])) as Record<
    Passive,
    number
  >;
export const EVOLUTIONS: Partial<
  Record<Weapon, { name: string; passive: Passive; rank: number; desc: string }>
> = {
  blade: {
    name: "Eclipse Waltz",
    passive: "area",
    rank: 3,
    desc: "Two counter-rotating blade rings and two extra blades.",
  },
  bolt: {
    name: "Starfall Loom",
    passive: "haste",
    rank: 3,
    desc: "Bolts seek their targets and burst into astral explosions.",
  },
  aura: {
    name: "Dawn Covenant",
    passive: "regen",
    rank: 3,
    desc: "A second, wider pulse burns foes and heals you each cast.",
  },
  axe: {
    name: "Winter Requiem",
    passive: "force",
    rank: 3,
    desc: "Axes return to you, cleave more foes, and chill on impact.",
  },
  lightning: {
    name: "Skybreak Chorus",
    passive: "crit",
    rank: 3,
    desc: "Four extra lightning jumps and a radial storm on the final target.",
  },
  familiar: {
    name: "Lantern Procession",
    passive: "amount",
    rank: 3,
    desc: "Three lantern wisps fire a seeking volley together.",
  },
};
export const META = [
  {
    id: "hp",
    name: "Vital Roots",
    icon: "♡",
    desc: "+15 maximum vitality per rank.",
    base: 45,
    max: 8,
    group: "Endurance",
  },
  {
    id: "damage",
    name: "Ancient Might",
    icon: "✦",
    desc: "+8% weapon damage per rank.",
    base: 60,
    max: 8,
    group: "Power",
  },
  {
    id: "speed",
    name: "Wayfarer",
    icon: "➶",
    desc: "+5% movement speed per rank.",
    base: 40,
    max: 5,
    group: "Endurance",
  },
  {
    id: "magnet",
    name: "Soulreach",
    icon: "◎",
    desc: "+20% pickup range per rank.",
    base: 35,
    max: 6,
    group: "Fortune",
  },
  {
    id: "gold",
    name: "Golden Oath",
    icon: "◇",
    desc: "+10% run gold per rank.",
    base: 50,
    max: 6,
    group: "Fortune",
  },
  {
    id: "revive",
    name: "Second Dawn",
    icon: "❈",
    desc: "One revival per run at 50% vitality.",
    base: 250,
    max: 1,
    group: "Endurance",
  },
  {
    id: "armor",
    name: "Barkbound",
    icon: "⬡",
    desc: "Reduce incoming contact damage by 1 per rank.",
    base: 65,
    max: 5,
    group: "Endurance",
  },
  {
    id: "regen",
    name: "Quiet Spring",
    icon: "❧",
    desc: "+0.2 vitality regeneration each second per rank.",
    base: 80,
    max: 5,
    group: "Endurance",
  },
  {
    id: "haste",
    name: "Clockroot",
    icon: "»",
    desc: "+5% weapon attack rate per rank.",
    base: 85,
    max: 5,
    group: "Power",
  },
  {
    id: "area",
    name: "Wide Horizon",
    icon: "◉",
    desc: "+6% weapon area per rank.",
    base: 60,
    max: 5,
    group: "Power",
  },
  {
    id: "wisdom",
    name: "Old Stories",
    icon: "◈",
    desc: "+8% gem experience per rank.",
    base: 55,
    max: 5,
    group: "Fortune",
  },
  {
    id: "luck",
    name: "Wishing Knot",
    icon: "✤",
    desc: "+8% luck for better draft rarity per rank.",
    base: 75,
    max: 5,
    group: "Fortune",
  },
  {
    id: "force",
    name: "Iron Wind",
    icon: "➽",
    desc: "+15% weapon knockback per rank.",
    base: 50,
    max: 5,
    group: "Power",
  },
  {
    id: "duration",
    name: "Lingering Light",
    icon: "◷",
    desc: "+10% projectile and zone lifetime per rank.",
    base: 65,
    max: 5,
    group: "Power",
  },
  {
    id: "reroll",
    name: "Second Sight",
    icon: "⟳",
    desc: "+1 draft reroll charge per run per rank (base 2).",
    base: 100,
    max: 5,
    group: "Drafting",
  },
  {
    id: "banish",
    name: "Severing Seal",
    icon: "⊘",
    desc: "+1 draft banish charge per run per rank (base 1).",
    base: 130,
    max: 4,
    group: "Drafting",
  },
  {
    id: "skip",
    name: "Mercy Coin",
    icon: "↷",
    desc: "+1 skip-for-gold charge per run per rank (base 1).",
    base: 90,
    max: 4,
    group: "Drafting",
  },
  {
    id: "start",
    name: "First Light",
    icon: "✶",
    desc: "+1 starting level and a free draft before moving per rank.",
    base: 180,
    max: 3,
    group: "Drafting",
  },
];
export const HERO_THEMES: Record<
  string,
  { weapon: Weapon; trees: string[][] }
> = {
  c112: {
    weapon: "blade",
    trees: [
      [
        "Crescent Forge",
        "Petal Edge",
        "Silver Tempo",
        "Far Arc",
        "Twin Crescent",
        "Verdant Steel",
        "Reaping Moon",
        "Last Harvest",
        "Eclipse Sovereign",
      ],
      [
        "Rootguard",
        "Bark Oath",
        "Deep Roots",
        "Living Bough",
        "Winter Bind",
        "Ironwood",
        "Sap of Ages",
        "Patient Grove",
        "Worldroot Refuge",
      ],
      [
        "Way of Leaves",
        "Path Memory",
        "Windstep",
        "Mossreach",
        "Seeking Leaf",
        "Green Fortune",
        "Forked Bough",
        "Golden Season",
        "Thousand Leaves",
      ],
    ],
  },
  c028: {
    weapon: "bolt",
    trees: [
      [
        "Void Loom",
        "Ink Etching",
        "Rapid Script",
        "Wide Glyph",
        "Twin Sigil",
        "Dark Syntax",
        "Rift Cadence",
        "Last Letter",
        "Midnight Loom",
      ],
      [
        "Inkbound Pact",
        "Paper Ward",
        "Black Binding",
        "Living Ink",
        "Still Script",
        "Sealed Vellum",
        "Bloodless Pact",
        "Patient Page",
        "Endless Grimoire",
      ],
      [
        "Star Cartography",
        "Star Memory",
        "Comet Step",
        "Far Reading",
        "Seeking Star",
        "Astral Fortune",
        "Forked Constellation",
        "Golden Chart",
        "Unwritten Cosmos",
      ],
    ],
  },
  c030: {
    weapon: "aura",
    trees: [
      [
        "Daybreak Rites",
        "Kindled Vow",
        "Chanted Rhythm",
        "Wide Benediction",
        "Twin Prayer",
        "Solar Temper",
        "Dawn Cadence",
        "Last Candle",
        "Everlasting Dawn",
      ],
      [
        "Sanctuary",
        "Stone Vow",
        "Deep Refuge",
        "Living Prayer",
        "Still Refuge",
        "Ivory Bastion",
        "Merciful Rite",
        "Patient Vigil",
        "Unbroken Sanctuary",
      ],
      [
        "Votive Flame",
        "Candle Memory",
        "Pilgrim Step",
        "Far Beacon",
        "Seeking Light",
        "Votive Fortune",
        "Forked Flame",
        "Golden Offering",
        "Thousand Candles",
      ],
    ],
  },
  c044: {
    weapon: "axe",
    trees: [
      [
        "Rimecleaver",
        "Frost Edge",
        "Cold Tempo",
        "Wide Cleave",
        "Twin Hatchet",
        "Glacial Steel",
        "Avalanche Cadence",
        "Last Rime",
        "Winter Reign",
      ],
      [
        "Glacier Oath",
        "Icebound Vow",
        "Deep Glacier",
        "Living Frost",
        "Still Winter",
        "Hoarfrost Mail",
        "Thawing Heart",
        "Patient Ice",
        "Glacier Sanctuary",
      ],
      [
        "Huntress Trail",
        "Trail Memory",
        "Snowstep",
        "Far Hunt",
        "Seeking Axe",
        "Hunter Fortune",
        "Forked Trail",
        "Golden Quarry",
        "Endless Hunt",
      ],
    ],
  },
  c080: {
    weapon: "lightning",
    trees: [
      [
        "Tempest Choir",
        "Charged Note",
        "Storm Rhythm",
        "Wide Chorus",
        "Twin Thunder",
        "Storm Temper",
        "Thunder Cadence",
        "Last Note",
        "Sky Sovereign",
      ],
      [
        "Stormglass",
        "Glass Vow",
        "Deep Current",
        "Living Charge",
        "Still Thunder",
        "Storm Mantle",
        "Rain of Mercy",
        "Patient Rain",
        "Stormglass Refuge",
      ],
      [
        "Astral Conduit",
        "Cloud Memory",
        "Gale Step",
        "Far Current",
        "Seeking Spark",
        "Cloud Fortune",
        "Forked Sky",
        "Golden Current",
        "Thousand Storms",
      ],
    ],
  },
  c001: {
    weapon: "familiar",
    trees: [
      [
        "Ember Bond",
        "Warm Wick",
        "Quick Flame",
        "Wide Lantern",
        "Twin Wisp",
        "Ember Temper",
        "Lantern Cadence",
        "Last Spark",
        "Lantern Sovereign",
      ],
      [
        "Ashen Court",
        "Ash Vow",
        "Deep Hearth",
        "Living Coal",
        "Still Ember",
        "Cinder Mail",
        "Hearth Mercy",
        "Patient Ash",
        "Ashen Sanctuary",
      ],
      [
        "Lantern Road",
        "Road Memory",
        "Firefly Step",
        "Far Lantern",
        "Seeking Wisp",
        "Wanderer Fortune",
        "Forked Road",
        "Golden Hearth",
        "Thousand Lanterns",
      ],
    ],
  },
};
export type TalentNode = {
  id: string;
  name: string;
  row: number;
  max: number;
  kind: string;
  stat?: string;
  value?: number;
  choice?: string;
  desc: string;
};
export type TalentTree = {
  id: string;
  name: string;
  color: string;
  glyph: string;
  nodes: TalentNode[];
  index: number;
};
export function talentTrees(hero: string): TalentTree[] {
  const theme = HERO_THEMES[hero] || HERO_THEMES.c112;
  return theme.trees.map((names, t) => {
    const id = hero + "-t" + t,
      weapon = SPELLS[theme.weapon].name;
    const stats =
      t === 0
        ? ["signatureDamage", 0.035, "damage", 0.02, "crit", 0.025]
        : t === 1
          ? ["hp", 5, "armor", 0.25, "regen", 0.12]
          : ["xp", 0.025, "luck", 0.015, "gold", 0.03];
    const node = (
      i: number,
      row: number,
      max: number,
      kind: string,
      desc: string,
      extra: Partial<TalentNode> = {},
    ): TalentNode => ({
      id: id + "-n" + i,
      name: names[i + 1],
      row,
      max,
      kind,
      desc,
      ...extra,
    });
    const caps = [
      (
        {
          blade:
            "Moonblades gain one extra blade and a counter-rotating outer ring.",
          bolt: "Arcane Bolt fires two extra shots; each bolt explodes into nearby foes.",
          aura: "Hallowed Ground gains a second, wider damaging pulse.",
          axe: "Reaper Axes return to you and can strike foes again on their way home.",
          lightning: "Stormcall leaps to two more enemies.",
          familiar: "A second Wisp circles you and fires alongside the first.",
        } as Partial<Record<Weapon, string>>
      )[theme.weapon]!,
      `Each ${weapon} cast also creates a protective, damaging sanctuary pulse and restores vitality.`,
      `Every fourth ${weapon} attack unleashes a radial volley of seeking soul sparks.`,
    ];
    return {
      id,
      name: names[0],
      index: t,
      color: ["#a47751", "#6e8a70", "#718d9b"][t],
      glyph: ["✧", "⬡", "✤"][t],
      nodes: [
        node(
          0,
          0,
          5,
          "stat",
          t === 0
            ? `+3.5% ${weapon} damage per rank.`
            : t === 1
              ? "+5 maximum vitality per rank."
              : "+2.5% gem experience per rank.",
          { stat: String(stats[0]), value: Number(stats[1]) },
        ),
        node(
          1,
          5,
          9,
          "stat",
          t === 1
            ? "+0.25 armor per rank. Choose this OR the other path."
            : t === 2
              ? "+1.5% movement speed per rank. Choose one path."
              : "+1.2% attack rate per rank. Choose one path.",
          {
            stat: t === 1 ? "armor" : t === 2 ? "speed" : "haste",
            value: t === 1 ? 0.25 : t === 2 ? 0.015 : 0.012,
            choice: id + "-fork",
          },
        ),
        node(
          2,
          5,
          9,
          "stat",
          t === 1
            ? "+0.08 regeneration per second per rank. Choose one path."
            : t === 2
              ? "+8% pickup range per rank. Choose one path."
              : "+2% area per rank. Choose one path.",
          {
            stat: t === 1 ? "regen" : t === 2 ? "magnet" : "area",
            value: t === 1 ? 0.08 : t === 2 ? 0.08 : 0.02,
            choice: id + "-fork",
          },
        ),
        node(
          3,
          10,
          1,
          "milestone",
          t === 0
            ? (
                {
                  blade: "Moonblades gain one extra orbiting blade.",
                  bolt: "Arcane Bolt fires one additional shot.",
                  aura: "Hallowed Ground pulses for 2 extra damage.",
                  axe: "Reaper Axe throws one additional axe.",
                  lightning: "Stormcall leaps to one additional enemy.",
                  familiar: "Each Wisp fires one additional seeking ember.",
                } as Partial<Record<Weapon, string>>
              )[theme.weapon]!
            : t === 1
              ? `${weapon} hits chill foes for 1.5 seconds.`
              : (
                  {
                    blade: "Moonblades orbit 30 units farther out.",
                    aura: "Hallowed Ground reaches 35 units farther.",
                    lightning:
                      "Stormcall can jump 65 units farther between targets.",
                  } as Partial<Record<Weapon, string>>
                )[theme.weapon] ||
                `${weapon} seeks its targets and pierces two additional foes.`,
        ),
        node(
          4,
          15,
          9,
          "stat",
          t === 0
            ? "+2% all spell damage per rank."
            : t === 1
              ? "+0.25 armor per rank."
              : "+1.5% draft luck per rank.",
          { stat: String(stats[2]), value: Number(stats[3]) },
        ),
        node(
          5,
          20,
          1,
          "milestone",
          t === 0
            ? `Every fourth ${weapon} attack sends out a damaging crescent shockwave.`
            : t === 1
              ? `${weapon} hits restore 0.35 vitality (0.12-second recovery limit).`
              : `${weapon} hits fork 35% damage into a second nearby foe (0.2-second limit).`,
        ),
        node(
          6,
          25,
          5,
          "stat",
          t === 0
            ? "+2.5% critical strike chance per rank."
            : t === 1
              ? "+0.12 vitality regeneration per second per rank."
              : "+3% run gold per rank.",
          { stat: String(stats[4]), value: Number(stats[5]) },
        ),
        node(7, 30, 1, "capstone", caps[t]),
      ],
    };
  });
}
export type HeroProgress = { xp: number; spent: Record<string, number> };
export type AutoPreference = "balanced" | "offense" | "defense";
export type Save = {
  version: 3;
  gear: Record<string, HeroGear>;
  codex: string[];
  expedition: { zone: string; heroic: number };
  settings: { autoUpgrade: boolean; autoPreference: AutoPreference };
  gold: number;
  unlocked: string[];
  selected: string;
  meta: Record<string, number>;
  best: number;
  runs: number;
  heroes: Record<string, HeroProgress>;
};
const finite = (x: unknown, max = 1e12) =>
  Math.max(0, Math.min(max, Number.isFinite(Number(x)) ? Number(x) : 0));
export function talentThreshold(points: number) {
  return 80 * points + 16 * points * points;
}
export function earnedPoints(xp: number) {
  let n = 0;
  while (n < 51 && xp >= talentThreshold(n + 1)) n++;
  return n;
}
export const treeSpent = (tree: TalentTree, p: HeroProgress) =>
  tree.nodes.reduce((n, a) => n + (p.spent[a.id] || 0), 0);
export const totalSpent = (p: HeroProgress) =>
  Object.values(p.spent).reduce((a, b) => a + b, 0);
export function talentReason(
  tree: TalentTree,
  node: TalentNode,
  p: HeroProgress,
) {
  if ((p.spent[node.id] || 0) >= node.max) return "Maximum rank";
  const prior = tree.nodes
    .filter((a) => a.row < node.row)
    .reduce((sum, a) => sum + (p.spent[a.id] || 0), 0);
  if (prior < node.row)
    return `Spend ${node.row} points in earlier rows (${prior}/${node.row})`;
  if (
    node.choice &&
    tree.nodes.some(
      (a) =>
        a.id !== node.id &&
        a.choice === node.choice &&
        (p.spent[a.id] || 0) > 0,
    )
  )
    return "Choose-one path already chosen; refund it first";
  if (totalSpent(p) >= earnedPoints(p.xp)) return "No unspent talent points";
  return "";
}
export function buyTalent(tree: TalentTree, node: TalentNode, p: HeroProgress) {
  if (talentReason(tree, node, p)) return false;
  p.spent[node.id] = (p.spent[node.id] || 0) + 1;
  return true;
}
export function refundTalent(
  tree: TalentTree,
  node: TalentNode,
  p: HeroProgress,
) {
  if (!p.spent[node.id]) return 0;
  p.spent[node.id]--;
  let refunded = 1;
  for (const n of tree.nodes.filter((n) => n.row > node.row)) {
    const before = tree.nodes
      .filter((a) => a.row < n.row)
      .reduce((v, a) => v + (p.spent[a.id] || 0), 0);
    if (before < n.row) {
      refunded += p.spent[n.id] || 0;
      delete p.spent[n.id];
    }
  }
  return refunded;
}
export function talentEffects(hero: string, p: HeroProgress) {
  const s: Record<string, number> = {};
  for (const tree of talentTrees(hero))
    for (const node of tree.nodes) {
      const r = p.spent[node.id] || 0;
      if (node.kind === "stat" && node.stat)
        s[node.stat] = (s[node.stat] || 0) + (node.value || 0) * r;
      else if (r) s[`t${tree.index}_${node.kind}_${node.row}`] = r;
    }
  return s;
}
export function migrateSave(raw: any): Save {
  const data = raw && typeof raw === "object" ? raw : {};
  const unlocked = Array.isArray(data.unlocked)
    ? data.unlocked.filter((h: unknown) => HERO_IDS.includes(String(h)))
    : ["c112"];
  if (!unlocked.includes("c112")) unlocked.unshift("c112");
  const result: Save = {
    version: 3,
    gear: Object.fromEntries(
      HERO_IDS.map((hero) => [hero, migrateGear(data.gear?.[hero], hero)]),
    ),
    codex: [
      ...new Set<string>(
        Array.isArray(data.codex)
          ? data.codex.filter(
              (id: unknown) => typeof id === "string" && JEWEL_BY_ID[id],
            )
          : [],
      ),
    ],
    expedition: {
      zone: EXPEDITIONS.some((z) => z.id === data.expedition?.zone)
        ? data.expedition.zone
        : EXPEDITIONS[0].id,
      heroic: Math.max(
        0,
        Math.min(5, Math.floor(Number(data.expedition?.heroic) || 0)),
      ),
    },
    settings: {
      autoUpgrade: data.settings?.autoUpgrade === true,
      autoPreference: ["balanced", "offense", "defense"].includes(
        data.settings?.autoPreference,
      )
        ? data.settings.autoPreference
        : "balanced",
    },
    gold: finite(data.gold),
    unlocked: [...new Set<string>(unlocked)],
    selected: HERO_IDS.includes(data.selected) ? data.selected : "c112",
    meta: {},
    best: finite(data.best),
    runs: Math.floor(finite(data.runs)),
    heroes: {},
  };
  for (const m of META)
    result.meta[m.id] = Math.floor(finite(data.meta?.[m.id], m.max));
  for (const hero of HERO_IDS) {
    const src = data.heroes?.[hero];
    const p: HeroProgress = { xp: finite(src?.xp), spent: {} };
    const trees = talentTrees(hero);
    for (const tree of trees)
      for (const node of tree.nodes) {
        const count = Math.floor(finite(src?.spent?.[node.id], node.max));
        for (let rank = 0; rank < count; rank++) {
          if (!buyTalent(tree, node, p)) break;
        }
      }
    result.heroes[hero] = p;
  }
  result.expedition.heroic = Math.min(
    result.expedition.heroic,
    maxHeroic(result.gear[result.selected], result.expedition.zone),
  );
  return result;
}
export function loadSave(storage: Pick<Storage, "getItem">): Save {
  for (const key of ["hollowmere-v3", "hollowmere-v2", "hollowmere-v1"]) {
    try {
      const s = storage.getItem(key);
      if (s) return migrateSave(JSON.parse(s));
    } catch {
      /* Preserve corrupted/old keys untouched; try the previous version. */
    }
  }
  return migrateSave({});
}
