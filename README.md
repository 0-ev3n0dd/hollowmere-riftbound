# Hollowmere — Riftbound · 0.4.0

A single-player, local-first survivor action RPG. Vite, strict TypeScript, and HTML5 Canvas. No backend, accounts, external fonts, analytics, purchases, or cloud saves.

Live project: https://0-ev3n0dd.github.io/hollowmere-riftbound/

```sh
npm ci
npm run build
npm run preview
```

Local preview: http://localhost:4174/hollowmere-riftbound/

## Play

WASD / arrows move; the touch joystick appears on touch devices. All weapons attack automatically. Gather XP gems, then click/tap a draft card or press **1 / 2 / 3**. **Escape** pauses. Retreat from the pause menu to bank rewards; death also banks them. Zone guardians arrive at 1:00, 2:00, and 3:00. Each expedition ends when its three named guardians are defeated; active runs do not resume after a refresh.

## Background play and automatic upgrades

- Focus loss no longer pauses. Blur clears held movement/joystick input; **Escape still manually pauses**, and a manual draft still waits for your choice.
- Hidden tabs use a dedicated worker wake-up every 250ms, with an interval fallback if workers are unavailable. One wall clock shared with RAF runs **1/60-second fixed simulation steps** (at most 120 per background wake, six per visible paint). Hidden Canvas/HUD rendering is skipped. Catch-up retains at most 60 seconds after a severe browser/OS suspension, never one huge delta or an unbounded backlog. A discarded/frozen process or sleeping device cannot execute gameplay; this is not offline/closed-tab progression.
- **Auto-upgrade ON/OFF** is available in the HUD and draft. It defaults OFF for existing/new saves and persists with a **Balanced / Offense / Defense** preference. Turning it on during a draft resolves that draft immediately.
- Auto picks only from the same three dealt cards: **complete an evolution → upgrade owned recipe components → fill empty slots → rarity**. Preference breaks ties within a tier. Balanced fills the smaller loadout category; Offense favors spells/damage passives; Defense favors survival passives. Evolutions already transform immediately once eligible. Auto never spends reroll, skip, or banish charges; rarity benefits still apply.
- Every queued level gets a pick, including First Light bonus drafts. Large XP bursts drain in batches of at most 64 picks to avoid recursion/stack overflow. A small toast names the latest pick (and the number of additional batch picks), surviving HUD refreshes.
- Runs keep fighting, collecting XP, and taking damage while in the background. Enable auto-upgrade if you want level-ups not to wait for a manual choice.

## Town economy · 0.4

A **Town** tab opens ten districts. Every price is game gold; there are no real-money purchases. A single guarded transaction path checks affordability, prerequisites, item ownership and stock, applies purchases once, and persists them locally. The ledger tracks gold reinvested.

- **Forge levels:** hero-bound item upgrades add 4% base stats per level, multiplied with stars; the cost rises 18% each level. After ten levels, upgrades also require increasing forge sparks. Extra-target lines add another target every thirty levels. No ordinary gameplay rank cap.
- **Reforging:** pay rising gold plus one spark to replace one original stat line with a uniformly rolled absent stat, at 85–125% of the rarity's budget. One mutable affix per piece; subsequent reforges replace the previous alteration.
- **Duplicate salvage:** successful duplicate rolls now keep spare copies rather than extra wearable items. Exchange copies for rarity-scaled sparks or a modest gold return. Original/worn pieces are never destroyed.
- **Gold star ascension:** buy a zone's next star for the selected hero, up to five. This strengthens the entire zone collection and can empower its set, but never grants Heroic clear/unlock credit. Prices scale with zone and star.
- **Enchanter:** ten stat choices, per-slot tiers with 23% rising costs. Retuning raises the tier and changes its stat. Enchants apply only while that slot holds owned equipment; existing combat caps still apply.
- **Jeweler:** buy a witnessed ring/trinket starting kit for one expedition, select stored kits freely, and bank unused charges per hero. Mastery adds one maximum jewelry rank and +3% relic stat power per level; every five levels also improve starting-kit rank. Existing ranks still require repeated in-run finds.
- **Living Codex:** witnessed entries now grant +0.15% account damage each. Paid, repeatable Lore ranks increase this contribution by 15% per rank.
- **Ascended Sanctum:** eight post-cap tracks for damage, vitality, attack rate, gold, XP, area, movement and regeneration, with 28% exponential costs. Each requires its original blessing to be maxed. Ascended attack rate is separate from equipment cooldown-reduction caps.
- **Black Market:** each hero has six saved offers: three gear pieces, one relic starting kit, two supplies. Stock rotates for free when that hero starts an expedition, or for a rising paid refresh. Reloading does not refresh stock, and each offer sells once. Gear comes from cleared zones, or Common starter stock if none are cleared; owned purchases become spare copies.
- **Mystery caches:** three repeatable gold-priced cache tiers, selecting only from this hero's cleared zones. The exact eligible, normalized rarity odds are displayed. Within a chosen zone, pieces are equally likely; duplicates become salvageable copies.
- **Apothecary:** six repeatable one-run preparations: +30% XP, +40% gold, +3 rerolls, a level-five start with all bonus drafts, +30% guardian damage, or +40 vitality/+5% damage reduction. Buy into storage, pack/unpack freely, and consume one of each packed supply only when an owned hero actually starts a run.
- **Hero Training:** rising-cost paid lessons award increasing talent XP, without allocating talents. Paid/passive training stops at the 51-point threshold and never lowers an existing XP total.
- **Four account buildings:** Amber Treasury earns `8 × level^1.2` offline gold/minute; Training Grounds earn `2 × level` talent XP/minute for all six heroes; Omen Shrine adds luck and damage; Barracks add starting vitality and damage. Costs scale exponentially. Treasury/Training bank at most eight hours and settle on Town visits, carrying fractional earnings. Device time is used; this is not server-authoritative anti-cheat.
- **Atelier:** nine permanent cosmetic unlocks across hero hue shifts, ground auras and projectile/particle mote palettes. Already-owned palettes equip freely; original colors can be restored. No cosmetic grants combat stats.
- **Contracts:** three one-run difficulty/reward writs, with one to five seals. Fees scale with zone and Heroic tier. Writs add enemy vitality/damage/spawns or sacrifice player vitality, in exchange for damage/gold bonuses. One queued writ per hero; buying another replaces it without refund.

Income now scales with expedition threat, Heroic tier, gear, Town investments, supplies and contracts. Named guardians pay larger bounties, clears pay a scaled completion bonus, and the run summary shows **gold/minute** and the run's income multiplier. Consumables, starter kits and contracts are consumed once; permanent investments remain. There is intentionally no in-run wandering merchant in this version.

Lean verification: `npm run build`, then `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/google-chrome npm run verify:town` against the production preview. The single focused smoke buys from every sink (42 purchases), checks persistence and old-save preservation, verifies prepared run effects/consumption and gold/min, and captures `/workspace/iso-shot-town.png`, `/workspace/iso-shot-forge.png`, `/workspace/iso-shot-market.png`, `/workspace/iso-shot-jeweler.png`. Its report is `/workspace/iso-town-smoke.json`. Balance at extremely high ranks and real multi-hour offline accumulation are not exhaustively tested.

## Equipment and expeditions · 0.3

- **Five palette-shifted isometric expeditions**, with distinct combinations of the existing enemy/boss sprites, harder vitality/speed/damage/spawn scaling, and **15 original named guardians** in total. Each expedition has three timed bosses. All Normal zones are open; a Normal clear unlocks Heroic I for that hero/zone, then sequential clears unlock II–V.
- **320 permanent hero-bound pieces**, across all six heroes and five rarities, with **30 named eight-piece sets**. Nine armor slots: Head, Shoulder, Chest, Waist, Legs, Feet, Wrist, Hands, Back. Four heroes use Main Hand + Off Hand; the Seer and Caller use a Ranged focus instead. Collection does not grant stats until equipped; gear applies on the next run.
- **Independent assigned boss drops:** Common 60%, Uncommon 50%, Rare 40%, Epic 30%, Legendary 20% per assigned piece, per kill. A boss can drop several pieces or none; duplicate successful rolls now keep spare copies for Town salvage. New drops persist immediately, appear in a non-blocking reveal, and are listed in the run summary.
- **Thirteen gear stat types:** damage, cooldown reduction, vitality, critical chance/damage, speed, damage reduction, regeneration, pickup, gold, area, extra targets, and double-strike chance. Common through Legendary items have one through five stat lines. Double-strike doubles the resolved hit. Combat caps: 65% equipment/jewelry cooldown reduction and damage reduction, 85% total crit, 60% double-strike, +6 gear/jewelry targets.
- **Four/eight-piece bonuses** count equipped Head through Hands; Back/weapons are additional non-set pieces. Clearing Heroic N raises all that zone's gear, including future drops, to N stars. Each star adds 18% base item stats (extra-target lines remain integral). All eight core pieces worn at five stars empower set bonuses by 50% and add another target.
- **Armory paper doll**, per-hero collection, equipment totals, rarity filters, stat/comparison hover tooltips and a tap/click inspector. Whole-loadout comparisons include gaining or losing set bonuses. Drop Tables show each guardian, assigned pieces, arrivals, collection state and independent odds.
- **16 temporary jewelry designs:** six rings, four trinkets, six Legendary amulets, each with three base ranks, extendable through Town Mastery. Wear two rings, two trinkets, one amulet. Duplicate worn finds upgrade; a new item in a full category replaces its lowest-rank item, explicitly shown before selection. Each amulet remakes one of the six signature spells using its advanced behavior. Remakes do not stack extra layers with an existing capstone/evolution.
- Field reliquaries appear at 0:45 and each minute afterward; elites have a 25% cache chance, and non-final guardians leave caches. Walk within 55 units to choose one of three relics. **Auto-upgrade also chooses jewelry** when enabled, so background runs do not stall on new chest prompts. A permanent **Codex** remembers all witnessed offers, but jewelry itself resets every run.
- Verification is deliberately lean: `npm run build`, then `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/google-chrome npm run verify:gear` against the production preview. One focused browser smoke covers migration, actual boss-death drops, equipment stats/sets, jewelry upgrade/remake/replacement, Heroic unlocking/stars, duplicate handling, persistence, zone selection, and console errors. It writes `/workspace/iso-gear-smoke.json` and the three requested Armory, Drop Tables and Zones screenshots.

## Progression expansion

- **6 heroes, 18 original talent trees, 144 named talent nodes.** Each hero has three themed trees and their own talent XP/allocations, independent of gold and the other heroes.
- **51 earned talent points maximum per hero.** A completed run awards `floor(seconds × 2 + kills × 3 + bosses × 150)` talent XP. Total XP required for point `p` is `80p + 16p²`.
- **Eight nodes per tree**, across seven rows. Rows require 0/5/10/15/20/25/30 points in earlier rows of that tree. Multi-rank roots/paths, a choose-one pair, one-point milestones at 10 and 20, and a one-point capstone at 30. A complete path costs 31 points, so a 51-point build can combine a capstone with off-tree talents.
- **Free full respecs and individual rank refunds.** Refunding an early rank also refunds any dependent ranks whose rows no longer qualify. Hover a node for its tooltip, or tap/click to inspect its exact effect and learn/refund controls. Changes apply on the next expedition.
- **18 spells**, each with six ranks; **16 passives**, each with five ranks. A run holds exactly **six spell slots and six passive slots**. New items stop appearing when that category is full; existing items can still rank up.
- **Four draft rarities.** Common: one rank. Uncommon: one rank and heal 5. Rare: one rank and 12 run gold. Epic: two ranks, up to the item's cap. Luck increases better-rarity odds.
- **Reroll, skip, and banish.** Base per-run charges are 2/1/1. Reroll deals three new choices. Skip forfeits the upgrade for `20 + 2 × current level` run gold. Banish removes one spell/passive from future drafts for that run and redeals without spending the level-up. An already-equipped banished item remains equipped but no longer gets upgrades. Supply cards cannot be banished. Charges renew each expedition, and Sanctum upgrades increase them.
- **18 permanent Sanctum upgrades:** vitality, damage, movement, pickup, gold, revival, armor, regeneration, haste, area, experience, luck, knockback, duration, rerolls, banishes, skips, and starting levels/free drafts.

### Six automatic evolutions

A rank-six spell and the matching rank-three passive transform immediately; no extra slot or special chest is needed. Recipes are available inside the draft panel.

| Spell           | Required passive (rank 3) | Evolution          | Behavior                                     |
| --------------- | ------------------------- | ------------------ | -------------------------------------------- |
| Moonblades      | Widening Rift             | Eclipse Waltz      | Counter-rotating rings and additional blades |
| Arcane Bolt     | Quickening                | Starfall Loom      | Seeking bolts with splash explosions         |
| Hallowed Ground | Living Spring             | Dawn Covenant      | A wider second pulse and healing             |
| Reaper Axe      | Iron Resolve              | Winter Requiem     | Returning axes and chill                     |
| Stormcall       | Keen Omen                 | Skybreak Chorus    | More jumps and a final storm burst           |
| Wisp Companion  | Twin Echo                 | Lantern Procession | Three wisps firing together                  |

Additional spells include Cinder Fan, Rime Needles, Briar Crown, Falling Star, Dusk Sickle, Glass Lance, Mire Bloom, Grave Chime, Rune Seeds, Gloam Raven, Tempest Pearls, and Faultline. They use fan volleys, slow, radial fire, delayed impacts, boomerangs, piercing, damage zones, shockwaves, proximity mines, homing feathers, outer orbits, and line strikes.

## Saves and safe migration

The expanded save uses **`hollowmere-v4`**. It reads valid v4 data, then falls back to **`hollowmere-v3`**, **`hollowmere-v2`** or **`hollowmere-v1`**. Old keys are never overwritten or deleted. Gold, unlocked/selected heroes, original meta upgrades, best time, and completed-run count carry forward. New talent profiles and upgrade ranks receive safe defaults. Invalid numeric values, rank caps, choose-one conflicts, row gates, and point budgets are sanitized. Malformed newer JSON falls back to a valid older save. Equipment IDs, hero ownership, slot compatibility, stars, clear tiers, and Codex entries are sanitized. Town ranks, upgrades/affixes, enchants, spare copies, offers, kit charges, supplies, contracts, cosmetics and accrual timestamps receive validated defaults. Bought stars may exceed clear tiers without unlocking Heroic difficulty. Gold and cost arithmetic is guarded at 10^15, below the safe-integer limit; numerical migration guards cap stored ranks at 10,000, well beyond practical exponential-cost play.

Saves belong to the browser and origin; local-preview progress does not automatically move to GitHub Pages or another device.

## Art and rendering

The public repository contains only the **30 processed sprites currently used** (six heroes, sixteen enemies, eight elites/bosses), all transparent WebPs at 256px tall. Original 1024px images and ZIPs are not published. The other 89 processed designs and the original full manifest remain local. All characters are treated as adults; no nudity or sexual content is added.

`public/manifest.json` records the active fantasy names and roles without original source filenames. `scripts/prepare_art.py` can regenerate local cutouts from `/workspace/iso-examples` with Pillow, NumPy, and SciPy; that source directory is not in the repository. Some original enclosed background pixels and ground shadows remain on a few figures.

Canvas uses a cached isometric ground pattern, depth sorting, procedural bob/squash/tilt/lunge/hit/death movement, ellipse shadows, cached horde walk-pose atlases, cached damage numerals/projectiles, pooled entities, and a spatial grid. Homing targeting is amortized rather than searching the horde for every projectile every frame. Enemy/projectile/zone caps bound worst-case effects. Pause/upgrade screens stop repainting the world unnecessarily. Frame rate depends on hardware; stress tests target approximately 60 FPS with 350 enemies.

## Verification

```sh
npm test
node scripts/verify-progression.mjs
node scripts/verify-background-auto.mjs
```

The rules test validates all eighteen talent trees, reachable capstones, cascading refunds, exclusivity, the 51-point cap, malformed allocations, and catalog counts. It uses the esbuild dependency installed with Vite.

The browser suite validates v1 migration, talent spending/refunds/row gates, actual milestone/capstone effects, draft actions and limits, all six real draft-triggered evolutions, rewards, persistence, starting-level/charge upgrades, corrupted-save recovery, mobile tap interaction, and an evolved-weapon horde stress scene. It writes `/workspace/iso-progression-verification.json` and screenshots `/workspace/iso-shot-talents.png`, `iso-shot-draft.png`, `iso-shot-sanctum2.png`, and `iso-shot-evolved.png` (plus mobile views).

Browser suites use Playwright's installed Chromium by default; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome` to use another installed Chromium. The background suite deliberately removes Playwright's anti-throttling launch defaults, suppresses RAF while simulating hidden visibility, verifies worker/fallback time progression, manual pause, auto picks/evolution/queues, no-charge behavior, persistence, and mobile touch controls. It writes `/workspace/iso-background-auto-verification.json` and `iso-shot-auto-{hud,draft}.png` (plus mobile views). Read-only diagnostics: `window.__hollowmere.snapshot()`. Explicit `?qa=1` enables local test helpers; those helpers only affect that browser's own local save and have no external service or paid resource access.

## Deployment and limitations

Vite's base path is `/hollowmere-riftbound/`. The Actions workflow builds and deploys pushes to `main` using GitHub Pages. Feature branches do not deploy automatically.

This is still a prototype: palette-shifted rather than newly drawn biomes, front-facing procedurally moved art rather than eight-direction animation, no audio, quests, cloud sync, or active-run resume. Talent point costs, draft odds, weapon balance, and unlock prices are initial values. Each hero has original tree/node names and a signature weapon; offense/defense/utility foundations are intentionally shared across heroes, not eighteen wholly independent spell simulators.
