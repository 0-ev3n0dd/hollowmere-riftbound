import {
  EXPEDITIONS,
  GEAR,
  GEAR_BY_ID,
  JEWELRY,
  JEWEL_BY_ID,
  SLOT_LABELS,
  SLOT_GLYPHS,
  STAT_LABELS,
  heroSlots,
  itemStats,
  gearTotals,
  setStatus,
  statText,
  formatStat,
  maxHeroic,
  jewelryReplacement,
  type HeroGear,
  type GearItem,
  type Jewel,
  type Stats,
} from "./gearing";
type Portrait = { id: string; name: string; src: string };
const stars = (n: number) =>
  n ? `${"★".repeat(n)}${"☆".repeat(5 - n)}` : "☆☆☆☆☆";
const stats = (values: Stats) =>
  statText(values)
    .map((v) => `<span>${v}</span>`)
    .join("");
function comparison(item: GearItem, hero: string, gear: HeroGear) {
  const current = gearTotals(hero, gear),
    next = gearTotals(hero, {
      ...gear,
      equipped: { ...gear.equipped, [item.slot]: item.id },
    });
  const delta = Object.fromEntries(
    Object.keys(STAT_LABELS).map((k) => [
      k,
      (next[k as keyof Stats] || 0) - (current[k as keyof Stats] || 0),
    ]),
  );
  return statText(delta);
}
export function armoryMarkup(
  hero: Portrait,
  heroes: Portrait[],
  gear: HeroGear,
  filter: string,
  inspected: string,
) {
  const owned = gear.inventory.map((id) => GEAR_BY_ID[id]).filter(Boolean);
  const list = owned.filter((i) => filter === "all" || i.zone === filter);
  const focus =
    GEAR_BY_ID[inspected] && gear.inventory.includes(inspected)
      ? GEAR_BY_ID[inspected]
      : list[0];
  const slot = (key: ReturnType<typeof heroSlots>[number]) => {
    const item = GEAR_BY_ID[gear.equipped[key] || ""];
    return `<button class="gear-slot ${item ? `rarity-${item.rarity} occupied` : "empty"}" ${item ? `data-inspect-gear="${item.id}" title="${item.name}&#10;${statText(itemStats(item, gear)).join("&#10;")}"` : "disabled"}><small>${SLOT_LABELS[key]}</small><span class="slot-glyph">${SLOT_GLYPHS[key]}</span><b>${item ? item.name.replace(item.set + " ", "") : "Not equipped"}</b>${item ? `<em>${stars(gear.stars[item.zone])}</em>` : ""}</button>`;
  };
  const totals = gearTotals(hero.id, gear);
  return `<div class="gear-page-title"><div><div class="eyebrow">A collection that survives the night</div><h1>The Armory.</h1><p>Only worn pieces grant power. Each wanderer keeps their own collection.</p></div><div class="collection-count"><b>${owned.length}<small> / ${GEAR.filter((i) => i.hero === hero.id).length}</small></b><span>PIECES COLLECTED</span></div></div><div class="gear-heroes">${heroes.map((h) => `<button class="${h.id === hero.id ? "active" : ""}" data-gear-hero="${h.id}"><img src="${h.src}" alt=""><span>${h.name}</span></button>`).join("")}</div><div class="armory-layout"><div><section class="paper-doll"><div class="doll-slots">${["head", "shoulder", "chest", "wrist", "hands"].map((k) => slot(k as any)).join("")}</div><div class="doll-portrait"><span class="doll-halo"></span><img src="${hero.src}" alt="${hero.name}"><h2>${hero.name}</h2><p>WORN ${Object.keys(gear.equipped).length} / ${heroSlots(hero.id).length}</p><div class="doll-weapons">${heroSlots(
    hero.id,
  )
    .filter((k) => ["main", "off", "ranged"].includes(k))
    .map(slot)
    .join(
      "",
    )}</div></div><div class="doll-slots">${["back", "waist", "legs", "feet"].map((k) => slot(k as any)).join("")}</div></section><div class="set-list">${setStatus(
    hero.id,
    gear,
  )
    .map(
      (s) =>
        `<article class="set-bonus ${s.count >= 4 ? "active" : ""} ${s.empowered ? "empowered" : ""}"><div><b>${s.name}</b><span>${s.count}/8 ${s.empowered ? "· EMPOWERED" : ""}</span></div><p class="${s.count >= 4 ? "lit" : ""}">4 pieces · ${statText(s.four).join(" · ")}</p><p class="${s.count >= 8 ? "lit" : ""}">8 pieces · ${statText(s.eight).join(" · ")}</p></article>`,
    )
    .join(
      "",
    )}</div><p class="gear-note">Head through Hands form each eight-piece set. Back and weapons add stats, not set counts. All eight at ★★★★★ empower the set by 50%, plus an extra target.</p></div><div class="armory-collection"><section class="gear-totals"><h3>Equipment contribution</h3><p>Applies when the next expedition begins.</p><div>${Object.keys(
    STAT_LABELS,
  )
    .map(
      (k) =>
        `<span><small>${STAT_LABELS[k as keyof Stats]}</small><b data-gear-stat="${k}">${formatStat(k, totals[k as keyof Stats] || 0).split(" ")[0]}</b></span>`,
    )
    .join(
      "",
    )}</div></section><div class="gear-filters"><button data-gear-filter="all" class="${filter === "all" ? "active" : ""}">All</button>${EXPEDITIONS.map((z) => `<button data-gear-filter="${z.id}" class="rarity-${z.rarity} ${filter === z.id ? "active" : ""}">${z.rarity}</button>`).join("")}</div><div class="gear-inventory">${list.length ? list.map((item) => `<button class="gear-item rarity-${item.rarity} ${gear.equipped[item.slot] === item.id ? "worn" : ""} ${focus?.id === item.id ? "inspected" : ""}" data-inspect-gear="${item.id}" title="${item.name}&#10;${statText(itemStats(item, gear)).join("&#10;")}&#10;Compared with worn: ${comparison(item, hero.id, gear).join("; ") || "No change"}"><span class="gear-item-icon">${SLOT_GLYPHS[item.slot]}</span><small>${SLOT_LABELS[item.slot]} ${gear.equipped[item.slot] === item.id ? "· WORN" : ""}</small><b>${item.name}</b><em>${stars(gear.stars[item.zone])}</em><p>${statText(itemStats(item, gear)).slice(0, 2).join("<br>")}</p></button>`).join("") : `<div class="gear-empty"><span>◇</span><h3>The first page is unwritten.</h3><p>Defeat named guardians to collect their assigned gear. Duplicates never replace or stack pieces.</p><button class="secondary" data-action="droptables">See drop tables ↗</button></div>`}</div>${focus ? `<section class="gear-inspector rarity-${focus.rarity}"><small>${focus.rarity.toUpperCase()} · ${SLOT_LABELS[focus.slot]} · ${stars(gear.stars[focus.zone])}</small><h3>${focus.name}</h3><div class="item-stats">${stats(itemStats(focus, gear))}</div><p>Whole-loadout comparison: ${comparison(focus, hero.id, gear).join(" · ") || "Already worn — no change"}</p><button class="primary compact" data-equip-gear="${focus.id}" ${gear.equipped[focus.slot] === focus.id ? "disabled" : ""}>${gear.equipped[focus.slot] === focus.id ? "Equipped" : "Equip " + SLOT_LABELS[focus.slot]}</button>${gear.equipped[focus.slot] === focus.id ? `<button class="ghost" data-unequip-gear="${focus.slot}">Unequip</button>` : ""}</section>` : ""}</div></div>`;
}
export function zonesMarkup(
  hero: Portrait,
  gear: HeroGear,
  selected: string,
  heroic: number,
  portraits: Portrait[],
) {
  const chosen = EXPEDITIONS.find((z) => z.id === selected) || EXPEDITIONS[0];
  return `<div class="gear-page-title"><div><div class="eyebrow">Five roads beyond the familiar</div><h1>Choose your horizon.</h1><p>Three named guardians. One lasting collection. A new challenge at every clear.</p></div><div class="collection-count"><b>5<small> expeditions</small></b><span>15 GUARDIANS · 5 RARITIES</span></div></div><div class="zone-grid">${EXPEDITIONS.map((z) => `<button class="zone-card rarity-${z.rarity} ${z.id === chosen.id ? "selected" : ""}" data-expedition="${z.id}" style="--biome:${z.color}"><div class="zone-scene"><span class="biome-diamond"></span>${z.bosses.map((b, i) => `<img style="--i:${i}" src="${portraits[b.art]?.src}" alt="${b.name}">`).join("")}</div><div class="zone-card-top"><span>${z.rarity.toUpperCase()}</span><b>${Math.round(z.chance * 100)}% / piece</b></div><h2>${z.name}</h2><p>${z.subtitle}</p><div class="zone-card-foot"><span>THREAT ×${z.scale.toFixed(1)}</span><span>${gear.clears[z.id] >= 0 ? "✓ CLEARED" : "UNCLEARED"} · ${stars(gear.stars[z.id])}</span></div></button>`).join("")}</div><section class="expedition-launch"><div><span class="eyebrow">${hero.name}'s expedition</span><h2>${chosen.name}</h2><p>Guardians arrive at 1:00, 2:00, and 3:00. Defeat all three to clear.</p><div class="heroic-switch">${Array.from({ length: 6 }, (_, tier) => `<button data-heroic="${tier}" class="${heroic === tier ? "active" : ""}" ${tier > maxHeroic(gear, chosen.id) ? "disabled" : ""} title="${tier > maxHeroic(gear, chosen.id) ? "Clear the preceding difficulty with this hero first" : "Clear to raise this zone's gear stars"}">${tier ? `Heroic ${tier}${tier > maxHeroic(gear, chosen.id) ? " 🔒" : ""}` : "Normal"}</button>`).join("")}</div></div><div class="launch-aside"><p>${heroic ? `Heroic ${heroic} · Enemy vitality ×${(chosen.scale * (1 + heroic * 0.35)).toFixed(2)}<br>Clear to earn ${heroic} gear stars.` : "Normal clear unlocks Heroic I.<br>Each Heroic clear unlocks the next tier."}</p><button class="primary" data-action="start">Begin expedition ↗</button><button class="ghost" data-action="droptables">Explore this drop table</button></div></section><p class="gear-note">Stars and difficulty unlocks are per hero, per expedition. Higher tiers upgrade every collected piece from that zone, including future drops. Normal expeditions are all open; later zones are much harder.</p>`;
}
export function dropTablesMarkup(
  hero: Portrait,
  gear: HeroGear,
  selected: string,
  portraits: Portrait[],
) {
  const z = EXPEDITIONS.find((z) => z.id === selected) || EXPEDITIONS[0];
  return `<div class="gear-page-title"><div><div class="eyebrow">Know what the guardians keep</div><h1>The spoils of the Hollow.</h1><p>Assigned drops for ${hero.name}. Every listed piece rolls independently; duplicates become spare copies for the Forge.</p></div><div class="collection-count"><b>${Math.round(z.chance * 100)}<small>%</small></b><span>${z.rarity.toUpperCase()} · PER PIECE, PER KILL</span></div></div><div class="drop-tabs">${EXPEDITIONS.map((v) => `<button data-drop-zone="${v.id}" class="rarity-${v.rarity} ${z.id === v.id ? "active" : ""}">${v.name}</button>`).join("")}</div><div class="drop-bosses">${z.bosses
    .map(
      (b) =>
        `<article class="drop-boss rarity-${z.rarity}"><div class="boss-portrait"><img src="${portraits[b.art]?.src}" alt="${b.name}"><span>${Math.floor(b.at / 60)}:00 ARRIVAL</span></div><h2>${b.name}</h2><p>${Math.round(z.chance * 100)}% independent chance for each assigned piece</p><div class="boss-pieces">${GEAR.filter(
          (i) => i.hero === hero.id && i.boss === b.id,
        )
          .map(
            (item) =>
              `<div title="${statText(itemStats(item, gear)).join("&#10;")}"><span class="drop-glyph">${SLOT_GLYPHS[item.slot]}</span><div><small>${SLOT_LABELS[item.slot]} · ${stars(gear.stars[z.id])}</small><b>${item.name}</b><p>${statText(itemStats(item, gear)).join(" · ")}</p></div><span class="owned-mark">${gear.inventory.includes(item.id) ? "✓" : "○"}</span></div>`,
          )
          .join("")}</div></article>`,
    )
    .join(
      "",
    )}</div><div class="drop-explainer"><div><b>One rarity per expedition</b><p>Common 60% · Uncommon 50% · Rare 40% · Epic 30% · Legendary 20%.</p></div><div><b>Eight pieces. One identity.</b><p>Four- and eight-piece bonuses count equipped core armor only. Back and weapons are additional slots.</p></div><div><b>Heroic stars</b><p>Clearing Heroic N raises this zone's gear to N stars. +18% base stats per star; all eight at five stars empower the set.</p></div></div>`;
}
export function codexMarkup(seen: string[]) {
  return `<div class="gear-page-title"><div><div class="eyebrow">Remembered, not carried</div><h1>The Reliquary Codex.</h1><p>Jewelry lasts for one expedition. Knowledge stays. Two rings, two trinkets, one amulet.</p></div><div class="collection-count"><b>${seen.length}<small> / ${JEWELRY.length}</small></b><span>RELICS WITNESSED</span></div></div><div class="codex-grid">${JEWELRY.map((j) => `<article class="codex-card ${seen.includes(j.id) ? `rarity-${j.rarity}` : "undiscovered"}"><span class="codex-glyph">${seen.includes(j.id) ? j.glyph : "?"}</span><small>${j.kind.toUpperCase()} ${seen.includes(j.id) ? "· " + j.rarity.toUpperCase() : "· UNDISCOVERED"}</small><h3>${seen.includes(j.id) ? j.name : "An unwritten memory"}</h3><p>${seen.includes(j.id) ? j.desc : "Open field reliquaries or claim the caches of elites and guardians."}</p>${seen.includes(j.id) ? `<div class="item-stats">${stats(j.stats)}</div><small>PER RANK · MAX ${j.max}${j.remake ? " · SPELL REMAKE" : ""}</small>` : ""}</article>`).join("")}</div>`;
}
export function jewelryOfferMarkup(
  choices: Jewel[],
  worn: Record<string, number>,
  source: string,
  bonusRanks = 0,
) {
  return `<div class="modal-shade jewelry-shade"><section class="modal jewelry-modal"><div class="eyebrow">${source} · A fleeting treasure</div><h2>A keepsake for this crossing.</h2><p>Pick one. Finding the same worn relic again upgrades its rank.</p><div class="jewel-choices">${choices
    .map((j) => {
      const old = jewelryReplacement(worn, j);
      return `<button class="jewel-choice rarity-${j.rarity}" data-jewelry="${j.id}"><small>${j.rarity.toUpperCase()} · ${j.kind.toUpperCase()}</small><span>${j.glyph}</span><h3>${j.name}</h3><p>${j.desc}</p><div class="item-stats">${stats(j.stats)}</div><b>${worn[j.id] ? `Upgrade ${worn[j.id]} → ${worn[j.id] + 1} / ${j.max + bonusRanks}` : old ? `Replaces ${JEWEL_BY_ID[old].name}` : "Equip rank 1 / " + (j.max + bonusRanks)}</b></button>`;
    })
    .join(
      "",
    )}</div><button class="ghost" data-action="leave-jewelry">Leave these relics</button><p class="close-hint">Two rings · Two trinkets · One amulet. A full category replaces its lowest-ranked relic. Jewelry resets next run; the Codex persists.</p></section></div>`;
}
