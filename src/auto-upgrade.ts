import {
  EVOLUTIONS,
  SPELLS,
  type Weapon,
  type Passive,
  type AutoPreference,
} from "./progression";

export type AutoCard = {
  id: string;
  kind: "spell" | "passive" | "supply";
  rarity: "common" | "uncommon" | "rare" | "epic";
  grant: number;
};
type Loadout = {
  weapons: Record<Weapon, number>;
  passives: Record<Passive, number>;
  evolved: ReadonlySet<Weapon>;
  hp: number;
  maxHp: number;
};
const rarity = { common: 0, uncommon: 1, rare: 2, epic: 3 };
const defensive = new Set(["vitality", "armor", "regen", "leech", "swiftness"]);
const offensive = new Set([
  "power",
  "haste",
  "crit",
  "area",
  "amount",
  "duration",
  "force",
]);

/** Choose only among the dealt cards; never reroll, skip, banish, or buy anything.
 * Lexicographic priority: evolution now > owned recipe progress > empty slot > rarity.
 * Preference breaks ties within a priority tier, without displacing an evolution.
 */
export function pickAutoUpgrade(
  cards: readonly AutoCard[],
  state: Loadout,
  preference: AutoPreference,
): number {
  const spells = Object.values(state.weapons).filter(Boolean).length;
  const passives = Object.values(state.passives).filter(Boolean).length;
  const recipes = (
    Object.entries(EVOLUTIONS) as [
      Weapon,
      NonNullable<(typeof EVOLUTIONS)[Weapon]>,
    ][]
  ).filter(([key]) => !state.evolved.has(key));
  const score = (card: AutoCard): number[] => {
    let tier = 0,
      bias = 0;
    if (card.kind === "supply") {
      // With no ranks left, heal only if needed; otherwise bank useful gold.
      bias =
        card.id === "supply-heal"
          ? state.hp < state.maxHp * 0.7
            ? 3
            : -1
          : card.id === "supply-gold"
            ? 2
            : 1;
      return [tier, bias, rarity[card.rarity]];
    }
    const owned =
      card.kind === "spell"
        ? state.weapons[card.id as Weapon]
        : state.passives[card.id as Passive];
    const newSlot = !owned;
    tier = newSlot ? 2 : 1;
    for (const [weapon, recipe] of recipes) {
      const w = state.weapons[weapon],
        p = state.passives[recipe.passive];
      const isSpell = card.kind === "spell" && card.id === weapon;
      const isPassive = card.kind === "passive" && card.id === recipe.passive;
      if (
        (isSpell && w + card.grant >= SPELLS[weapon].max && p >= recipe.rank) ||
        (isPassive && w >= SPELLS[weapon].max && p + card.grant >= recipe.rank)
      ) {
        tier = 4;
      } else if (
        (isSpell && w > 0) ||
        (isPassive && p > 0 && p < recipe.rank && w > 0)
      ) {
        tier = Math.max(tier, 3);
      }
    }
    if (preference === "offense")
      bias = card.kind === "spell" || offensive.has(card.id) ? 2 : 0;
    else if (preference === "defense") bias = defensive.has(card.id) ? 2 : 0;
    else if (newSlot)
      bias =
        card.kind === "spell"
          ? Number(spells <= passives)
          : Number(passives <= spells);
    return [tier, bias, rarity[card.rarity]];
  };
  let best = -1,
    bestScore: number[] = [];
  cards.forEach((card, index) => {
    const next = score(card);
    for (let i = 0; i < next.length; i++) {
      if (best < 0 || next[i] > bestScore[i]) {
        best = index;
        bestScore = next;
        break;
      }
      if (next[i] < bestScore[i]) break;
    }
  });
  return best;
}
