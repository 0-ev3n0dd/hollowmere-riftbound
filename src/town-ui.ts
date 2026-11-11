import type { Save } from "./progression";
import {
  EXPEDITIONS,
  GEAR_BY_ID,
  JEWELRY,
  JEWEL_BY_ID,
  SLOT_LABELS,
  SLOT_GLYPHS,
  STAT_LABELS,
  ENCHANT_BASE,
  heroSlots,
  itemStats,
  statText,
  type GearSlot,
} from "./gearing";
import {
  BUILDINGS,
  ASCENDED,
  SUPPLIES,
  CONTRACTS,
  COSMETICS,
  CACHES,
  XP_LIMIT,
  scaledCost,
  forgeCost,
  reforgeCost,
  starCost,
  enchantCost,
  masteryCost,
  codexCost,
  trainingCost,
  starterCost,
  contractCost,
  cacheOdds,
  ensureMarket,
  townEffects,
} from "./town";
export const TOWN_PAGES = [
  ["overview", "The Town"],
  ["forge", "Forge"],
  ["enchanter", "Enchanter"],
  ["jeweler", "Jeweler"],
  ["ascended", "Ascended Sanctum"],
  ["market", "Black Market"],
  ["supplies", "Apothecary"],
  ["training", "Hero Training"],
  ["contracts", "Contracts"],
  ["cosmetics", "Atelier"],
];
type Hero = { id: string; name: string; src: string };
export type TownChoice = {
  forgeItem?: string;
  forgeLine?: string;
  enchant?: string;
  starter?: string;
  contractTier?: string;
};
const gold = (n: number) => Math.ceil(n).toLocaleString();
export function townMarkup(
  save: Save,
  hero: Hero,
  heroes: Hero[],
  page: string,
  choice: TownChoice,
) {
  const t = save.town,
    g = save.gear[hero.id];
  const buy = (
    action: string,
    cost: number,
    label = "Invest",
    locked = false,
  ) =>
    `<button class="town-buy" data-town-buy="${action}" ${locked || save.gold < cost ? "disabled" : ""}><span>${label}</span><b>◇ ${gold(cost)}</b></button>`;
  const card = (
    glyph: string,
    title: string,
    desc: string,
    footer: string,
    tag = "",
  ) =>
    `<article class="town-card"><div class="town-card-top"><span class="town-glyph">${glyph}</span><small>${tag}</small></div><h3>${title}</h3><p>${desc}</p>${footer}</article>`;
  const nav = `<div class="town-districts">${TOWN_PAGES.map(([id, name]) => `<button data-town-page="${id}" class="${page === id ? "active" : ""}">${name}</button>`).join("")}</div>`;
  let body = "";
  if (page === "overview") {
    body = `<div class="town-overview"><div><div class="eyebrow">Gold is a beginning, not an ending</div><h2>A place worth returning to.</h2><p>Invest in a stronger crossing. Rebuild the town, shape your collection, or risk a little fortune for something extraordinary.</p><div class="town-passive"><span>◇ <b>${gold(8 * t.buildings.treasury ** 1.2)}</b> gold / minute</span><span>◈ <b>${2 * t.buildings.grounds}</b> XP / minute / hero</span><small>Passive income is claimed on Town visits, including up to 8 hours away. Talent XP stops at the 51-point threshold.</small></div></div><div class="town-portrait"><span></span><img src="${hero.src}" alt="${hero.name}" style="filter:hue-rotate(${COSMETICS.find((c) => c.id === t.cosmetics.tint)?.hue || 0}deg)"><b>${hero.name}</b><small>EVERY ROAD LEADS HOME</small></div></div><div class="town-section-title"><h3>Raise the foundations.</h3><span>Account-wide · Rising costs · No ordinary rank cap</span></div><div class="town-grid four">${BUILDINGS.map((b) => card(b.glyph, b.name, b.desc, buy(`building:${b.id}`, scaledCost(b.base, b.growth, t.buildings[b.id]), "Build +1"), `LEVEL ${t.buildings[b.id]}`)).join("")}</div><div class="town-section-title"><h3>Find your next investment.</h3><span>Ten districts · One growing legacy</span></div><div class="town-routes">${TOWN_PAGES.slice(
      1,
    )
      .map(
        ([id, name], i) =>
          `<button data-town-page="${id}"><span>${["⚒", "✧", "◎", "♜", "◇", "◈", "⚔", "☽", "❋"][i]}</span><b>${name}</b><small>${["Levels, reforges & stars", "Worn-slot enchantments", "Relic kits & lasting lore", "Beyond the original caps", "Stock, paid refreshes & caches", "One-run preparations", "Gold into hero mastery", "Harder roads, richer rewards", "A color for every crossing"][i]}</small><em>↗</em></button>`,
      )
      .join("")}</div>`;
  }
  if (page === "forge") {
    const ids = g.inventory,
      selected = ids.includes(choice.forgeItem || "")
        ? choice.forgeItem!
        : ids[0];
    const item = GEAR_BY_ID[selected],
      u = g.upgrades[selected] || { level: 0, reforges: 0, quality: 1 };
    const line =
      item && Object.keys(item.stats).includes(choice.forgeLine || "")
        ? choice.forgeLine!
        : item
          ? Object.keys(item.stats)[0]
          : "";
    const spare = Object.values(g.duplicates).reduce((n, a) => n + a, 0);
    body = `<div class="town-section-title"><h2>The Emberwright Forge.</h2><span>Enhancements stay bound to this hero's pieces.</span></div>${
      item
        ? `<div class="forge-workbench"><div class="forge-item rarity-${item.rarity}"><small>${item.rarity.toUpperCase()} · ${SLOT_LABELS[item.slot]} · ${g.stars[item.zone]} STARS</small><span>${SLOT_GLYPHS[item.slot]}</span><h3>${item.name}</h3><strong data-forge-level>FORGE LEVEL ${u.level}</strong><div class="item-stats">${statText(
            itemStats(item, g),
          )
            .map((v) => `<span>${v}</span>`)
            .join(
              "",
            )}</div><select data-town-setting="forgeItem" aria-label="Forge item">${ids.map((id) => `<option value="${id}" ${id === item.id ? "selected" : ""}>${GEAR_BY_ID[id].name}</option>`).join("")}</select></div><div class="forge-actions">${card("⚒", "Temper without end.", "Each level adds 4% base item stats, multiplied with stars. Extra-target lines gain another target every 30 levels. Costs rise 18% each level.", buy(`forge:${item.id}`, forgeCost(save, hero.id, item.id), "Upgrade +1", t.materials < Math.floor(u.level / 10)), `SPARKS NEEDED ${Math.floor(u.level / 10)}`)}${card(
            "✧",
            "Reforge an affix.",
            `One mutable line per piece. Uniform random replacement among stats absent from the original item; rolls 85–125% of that rarity's stat budget. Each reforge replaces the previous alteration.`,
            `<select data-town-setting="forgeLine" aria-label="Stat line to reforge">${Object.keys(
              item.stats,
            )
              .map(
                (k) =>
                  `<option value="${k}" ${k === line ? "selected" : ""}>${STAT_LABELS[k as keyof typeof STAT_LABELS]}</option>`,
              )
              .join(
                "",
              )}</select>${buy(`reforge:${item.id}:${line}`, reforgeCost(save, hero.id, item.id), "Reforge", t.materials < 1)}`,
            `1 SPARK · ${u.reforges} REFORGES`,
          )}</div></div>`
        : `<div class="town-empty"><h3>A collection begins with a crossing.</h3><p>Find gear from guardians or buy a piece at the Black Market before forging.</p><button data-town-page="market" class="secondary">Visit the Market ↗</button></div>`
    }<div class="salvage-bar"><div><b>${spare} spare copies</b><small>Only duplicate copies are exchanged. Originals and worn items are never destroyed.</small></div><button class="secondary" data-town-buy="salvage:sparks" ${spare ? "" : "disabled"}>Salvage → forge sparks</button><button class="secondary" data-town-buy="salvage:gold" ${spare ? "" : "disabled"}>Salvage → gold</button></div><div class="town-section-title"><h3>Buy a brighter star.</h3><span>Raises the whole zone collection · Does not unlock Heroic tiers</span></div><div class="town-grid five">${EXPEDITIONS.map((z) => card("★", z.name, "+18% base stats per star. Eight core pieces at five stars empower the set.", buy(`star:${z.id}`, starCost(save, hero.id, z.id), g.stars[z.id] >= 5 ? "Fully ascended" : "Ascend star", g.stars[z.id] >= 5), `${g.stars[z.id]} / 5 STARS`)).join("")}</div>`;
  }
  if (page === "enchanter") {
    const stat =
      choice.enchant && choice.enchant in ENCHANT_BASE
        ? choice.enchant
        : "damage";
    body = `<div class="town-section-title"><h2>Thread power into every slot.</h2><span>Enchantments stay with the slot; only worn slots count.</span></div><label class="town-select-label">Next enchant <select data-town-setting="enchant" aria-label="Enchantment stat">${Object.keys(
      ENCHANT_BASE,
    )
      .map(
        (k) =>
          `<option value="${k}" ${stat === k ? "selected" : ""}>${STAT_LABELS[k as keyof typeof STAT_LABELS]}</option>`,
      )
      .join(
        "",
      )}</select><small>Buying increases the existing tier and retunes it to the chosen stat. Costs rise 23% per tier.</small></label><div class="town-grid three">${heroSlots(
      hero.id,
    )
      .map((slot) => {
        const e = g.enchants[slot],
          worn = g.equipped[slot];
        return card(
          SLOT_GLYPHS[slot],
          SLOT_LABELS[slot],
          `${worn ? GEAR_BY_ID[worn].name : "Equip a piece here first."}<br><br>${e ? statText({ [e.stat]: (ENCHANT_BASE[e.stat] || 0) * e.tier }).join(" · ") : "No enchantment yet."}`,
          buy(
            `enchant:${slot}:${stat}`,
            enchantCost(save, hero.id, slot),
            "Enchant +1",
            !worn,
          ),
          `TIER ${e?.tier || 0}`,
        );
      })
      .join("")}</div>`;
  }
  if (page === "jeweler") {
    const available = JEWELRY.filter(
      (j) => j.kind !== "amulet" && save.codex.includes(j.id),
    );
    const selected =
      available.find((j) => j.id === choice.starter) ||
      available.find((j) => j.id === t.starter[hero.id]) ||
      available[0];
    const e = townEffects(save, hero.id);
    body = `<div class="town-section-title"><h2>Small things. Lasting possibilities.</h2><span>Hero-bound preparation · Account-wide Codex</span></div><div class="town-grid three">${card("◎", "A familiar keepsake.", "Buy one starting kit for a witnessed ring or trinket. One selected kit is consumed per expedition; unused kits remain stored. Starting rank increases by one every five Mastery levels.", `${selected ? `<select data-town-setting="starter" aria-label="Starting jewelry">${available.map((j) => `<option value="${j.id}" ${j.id === selected.id ? "selected" : ""}>${j.name} · ${t.starterStock[hero.id][j.id] || 0} kits</option>`).join("")}</select>${buy(`starter:${selected.id}`, starterCost(save, hero.id, selected.id), "Prepare one run")}<button class="ghost" data-town-buy="choose-starter:${selected.id}" ${t.starterStock[hero.id][selected.id] > 0 ? "" : "disabled"}>Use stored kits</button>` : "<p>Discover a relic or buy a kit at the Black Market first.</p>"}`, `ACTIVE: ${JEWEL_BY_ID[t.starter[hero.id]]?.name || "NONE"}`)}${card("✧", "Jewelry Mastery", `All this hero's relics gain one maximum upgrade rank and +3% stat power per Mastery level. Current maximum rank: ${3 + t.mastery[hero.id]}.`, buy("mastery", masteryCost(save, hero.id), "Mastery +1"), `LEVEL ${t.mastery[hero.id]}`)}${card("◈", "The Living Codex", `Every witnessed entry grants +0.15% account damage, increased by 15% per Lore rank. ${save.codex.length}/16 entries currently grant +${(save.codex.length * 0.15 * (1 + t.codexLevel * 0.15)).toFixed(2)}% damage.`, buy("codex", codexCost(save), "Lore +1"), `LORE ${t.codexLevel}`)}</div><p class="gear-note">Prepared kit charges are per hero. Amulets remain in-run discoveries. Mastery and Codex costs rise exponentially; existing relic rank upgrades still require another in-run find.</p>`;
  }
  if (page === "ascended")
    body = `<div class="town-section-title"><h2>Beyond the last blessing.</h2><span>Account-wide · Exponential costs · No ordinary rank cap</span></div><p class="town-intro">Max the original Sanctum blessing first. Ascended ranks then continue its identity into the late game, at a 28% rising cost per rank.</p><div class="town-grid four">${ASCENDED.map((a) => card(a.glyph, a.name, a.desc, buy(`ascend:${a.id}`, scaledCost(a.base, 1.28, t.ascended[a.id]), save.meta[a.id] >= a.cap ? "Ascend +1" : "Max base blessing first", save.meta[a.id] < a.cap), `ASCENDED ${t.ascended[a.id]} · BASE ${save.meta[a.id]}/${a.cap}`)).join("")}</div>`;
  if (page === "market") {
    const market = ensureMarket(save, hero.id);
    body = `<div class="town-section-title"><div><h2>A little risk. A different road.</h2><p>Stock is saved across reloads. Starting an expedition rotates this hero's stock for free.</p></div>${buy("refresh", scaledCost(90, 1.4, market.refreshes), "Refresh stock")}</div><div class="town-grid three market-stock">${market.offers
      .map((o) => {
        const item =
          o.kind === "gear"
            ? GEAR_BY_ID[o.item]
            : o.kind === "jewel"
              ? JEWEL_BY_ID[o.item]
              : SUPPLIES.find((s) => s.id === o.item)!;
        const desc =
          o.kind === "gear"
            ? (g.inventory.includes(o.item)
                ? "Owned: purchase creates a spare copy for salvage."
                : "Permanent gear, bound to this hero.") +
              "<br>" +
              statText(itemStats(GEAR_BY_ID[o.item], g)).slice(0, 2).join(" · ")
            : o.kind === "jewel"
              ? "One starting kit; also records this relic in the Codex."
              : SUPPLIES.find((s) => s.id === o.item)!.desc;
        const glyph =
          o.kind === "gear"
            ? SLOT_GLYPHS[GEAR_BY_ID[o.item].slot]
            : o.kind === "jewel"
              ? JEWEL_BY_ID[o.item].glyph
              : SUPPLIES.find((s) => s.id === o.item)!.glyph;
        return card(
          glyph,
          item.name,
          desc,
          buy(
            `market:${o.id}`,
            o.cost,
            market.bought.includes(o.id) ? "Sold" : "Buy",
            market.bought.includes(o.id),
          ),
          o.kind.toUpperCase(),
        );
      })
      .join(
        "",
      )}</div><div class="town-section-title"><h3>The sealed chance.</h3><span>Gear from cleared zones only · Exact eligible odds below</span></div><div class="town-grid three">${CACHES.map(
      (c) => {
        const odds = cacheOdds(save, hero.id, c.id);
        return card(
          "◇",
          c.name,
          odds.length
            ? odds
                .map((o) => `${o.zone.rarity}: ${(o.chance * 100).toFixed(1)}%`)
                .join(" · ") +
                "<br><br>One uniform random piece within the rolled zone; owned pieces become spare copies."
            : "Clear an eligible expedition first.",
          buy(`cache:${c.id}`, c.cost, "Open cache", !odds.length),
          "GAME GOLD ONLY",
        );
      },
    ).join("")}</div>`;
  }
  if (page === "supplies")
    body = `<div class="town-section-title"><h2>Provision the next crossing.</h2><span>One of each packed supply is consumed per expedition.</span></div><p class="town-intro">Buying adds one to storage and packs it. Unpack a supply to save it; additional copies wait for later runs. No purchases happen automatically.</p><div class="town-grid three">${SUPPLIES.map((s) => card(s.glyph, s.name, s.desc, `${buy(`supply:${s.id}`, s.cost, "Buy & pack")}<button class="ghost" data-town-buy="pack:${s.id}" ${t.supplies[s.id] ? "" : "disabled"}>${t.packed[s.id] ? "✓ Packed · Unpack" : "Pack from storage"}</button>`, `STORED ${t.supplies[s.id]} · ${t.packed[s.id] ? "PACKED" : "UNPACKED"}`)).join("")}</div>`;
  if (page === "training")
    body = `<div class="town-training"><div><div class="eyebrow">Knowledge has a price</div><h2>${hero.name}'s next chapter.</h2><p>Buy talent XP rather than talent allocations. Spend earned points freely in the Talents screen. Each paid lesson grants 50 more XP, but its price also rises by 17%.</p><div class="town-training-xp"><b>${Math.floor(save.heroes[hero.id].xp).toLocaleString()}</b><span> / ${XP_LIMIT.toLocaleString()} XP for 51 points</span></div>${buy("train", trainingCost(save, hero.id), save.heroes[hero.id].xp >= XP_LIMIT ? "Mastered" : "Buy " + (100 + t.training[hero.id] * 50) + " XP", save.heroes[hero.id].xp >= XP_LIMIT)}<p class="gear-note">${t.training[hero.id]} paid lessons. Training Grounds also support all six heroes, including those not selected. Training never exceeds the 51-point threshold or alters spent talents.</p></div><img src="${hero.src}" alt="${hero.name}"></div>`;
  if (page === "contracts") {
    const tier = Math.max(1, Math.min(5, Number(choice.contractTier) || 1)),
      queued = t.contracts[hero.id];
    body = `<div class="town-section-title"><h2>Sign for a harder road.</h2><span>Fees scale with zone, Heroic tier, and contract seals.</span></div><label class="town-select-label">Intensity <select data-town-setting="contractTier" aria-label="Contract intensity">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${n === tier ? "selected" : ""}>${n} seal${n > 1 ? "s" : ""}</option>`).join("")}</select><small>Queued: ${queued ? CONTRACTS.find((c) => c.id === queued.id)?.name + " · " + queued.tier + " seals" : "None"}. One contract is consumed next expedition.</small></label><div class="town-grid three">${CONTRACTS.map((c) => card(c.glyph, c.name, c.desc + "<br><br>Rewards scale with all other gold bonuses. One queued contract per hero; buying a different writ replaces the existing one without a refund.", buy(`contract:${c.id}:${tier}`, contractCost(save, tier), "Sign one expedition"), `${tier} SEALS · ${save.expedition.zone.toUpperCase()}`)).join("")}</div>`;
  }
  if (page === "cosmetics")
    body = `<div class="town-section-title"><h2>Leave a different light behind.</h2><span>Account unlocks · Purely visual · No combat advantage</span></div><div class="town-grid three">${COSMETICS.map((c) => `<article class="town-card cosmetic-card" style="--swatch:${c.color}"><div class="cosmetic-preview ${c.kind}">${c.kind === "tint" ? `<img src="${hero.src}" style="filter:hue-rotate(${c.hue}deg)" alt="${c.name}">` : c.kind === "aura" ? "<i></i>" : "<i></i><i></i><i></i>"}</div><small>${c.kind.toUpperCase()} ${t.cosmetics[c.kind as "tint" | "aura" | "particles"] === c.id ? "· EQUIPPED" : ""}</small><h3>${c.name}</h3>${t.cosmetics.owned.includes(c.id) ? `<button class="town-buy" data-town-buy="cosmetic:${c.id}">${t.cosmetics[c.kind as "tint" | "aura" | "particles"] === c.id ? "Equipped" : "Equip owned palette"}</button>` : buy(`cosmetic:${c.id}`, c.cost, "Unlock & equip")}</article>`).join("")}</div><div class="cosmetic-resets">${["tint", "aura", "particles"].map((kind) => `<button class="ghost" data-town-buy="clear-cosmetic:${kind}">Restore original ${kind}</button>`).join("")}</div>`;
  return `<div class="gear-page-title town-page-title"><div><div class="eyebrow">The long road is built one coin at a time</div><h1>The Town of Hollowmere.</h1><p>Permanent power. Repeatable preparations. A reason for every handful of gold.</p></div><div class="collection-count"><b>${gold(save.gold)}<small> gold</small></b><span>◇ ${gold(t.totalSpent)} REINVESTED · ✧ ${gold(t.materials)} FORGE SPARKS</span></div></div><div class="town-hero-strip"><img src="${hero.src}" alt=""><label>YOUR WANDERER <select data-town-setting="hero" aria-label="Town hero">${heroes.map((h) => `<option value="${h.id}" ${hero.id === h.id ? "selected" : ""}>${h.name}</option>`).join("")}</select></label><p>Gear work, lessons and relic kits follow this hero. Buildings, supplies, Codex lore and Ascended ranks benefit the account.</p></div>${nav}<div class="town-content">${body}</div>${t.lastResult ? `<div class="town-ledger"><small>LATEST LEDGER ENTRY</small><span>${t.lastResult}</span></div>` : ""}<footer class="footnote"><span>GAME GOLD ONLY · NO REAL-MONEY PURCHASES</span><span>All investments save on this device</span></footer>`;
}
