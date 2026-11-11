# Hollowmere — Riftbound · 0.2.0

A single-player, local-first survivor action RPG. Vite, strict TypeScript, and HTML5 Canvas. No backend, accounts, external fonts, analytics, purchases, or cloud saves.

Live project: https://0-ev3n0dd.github.io/hollowmere-riftbound/

```sh
npm ci
npm run build
npm run preview
```

Local preview: http://localhost:4174/hollowmere-riftbound/

## Play

WASD / arrows move; the touch joystick appears on touch devices. All weapons attack automatically. Gather XP gems, then click/tap a draft card or press **1 / 2 / 3**. **Escape** pauses. Retreat from the pause menu to bank rewards; death also banks them. Bosses arrive every three minutes. Runs are endless, and active runs do not resume after a refresh.

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

The expanded save uses **`hollowmere-v2`**. On first use, it reads a valid v2 save or migrates **`hollowmere-v1`**. The original v1 key is never overwritten or deleted. Gold, unlocked/selected heroes, original meta upgrades, best time, and completed-run count carry forward. New talent profiles and upgrade ranks receive safe defaults. Invalid numeric values, rank caps, choose-one conflicts, row gates, and point budgets are sanitized. Malformed v2 JSON falls back to a valid v1 save.

Saves belong to the browser and origin; local-preview progress does not automatically move to GitHub Pages or another device.

## Art and rendering

The public repository contains only the **30 processed sprites currently used** (six heroes, sixteen enemies, eight elites/bosses), all transparent WebPs at 256px tall. Original 1024px images and ZIPs are not published. The other 89 processed designs and the original full manifest remain local. All characters are treated as adults; no nudity or sexual content is added.

`public/manifest.json` records the active fantasy names and roles without original source filenames. `scripts/prepare_art.py` can regenerate local cutouts from `/workspace/iso-examples` with Pillow, NumPy, and SciPy; that source directory is not in the repository. Some original enclosed background pixels and ground shadows remain on a few figures.

Canvas uses a cached isometric ground pattern, depth sorting, procedural bob/squash/tilt/lunge/hit/death movement, ellipse shadows, cached horde walk-pose atlases, cached damage numerals/projectiles, pooled entities, and a spatial grid. Homing targeting is amortized rather than searching the horde for every projectile every frame. Enemy/projectile/zone caps bound worst-case effects. Pause/upgrade screens stop repainting the world unnecessarily. Frame rate depends on hardware; stress tests target approximately 60 FPS with 350 enemies.

## Verification

```sh
node scripts/test-progression-rules.mjs
node scripts/verify-progression.mjs
```

The rules test validates all eighteen talent trees, reachable capstones, cascading refunds, exclusivity, the 51-point cap, malformed allocations, and catalog counts. It uses the esbuild dependency installed with Vite.

The browser suite validates v1 migration, talent spending/refunds/row gates, actual milestone/capstone effects, draft actions and limits, all six real draft-triggered evolutions, rewards, persistence, starting-level/charge upgrades, corrupted-save recovery, mobile tap interaction, and an evolved-weapon horde stress scene. It writes `/workspace/iso-progression-verification.json` and screenshots `/workspace/iso-shot-talents.png`, `iso-shot-draft.png`, `iso-shot-sanctum2.png`, and `iso-shot-evolved.png` (plus mobile views).

Browser scripts use the box's installed Chromium path; change it to the local Playwright executable if running elsewhere. Read-only diagnostics: `window.__hollowmere.snapshot()`. Explicit `?qa=1` enables local test helpers; those helpers only affect that browser's own local save and have no external service or paid resource access.

## Deployment and limitations

Vite's base path is `/hollowmere-riftbound/`. The Actions workflow builds and deploys pushes to `main` using GitHub Pages. Feature branches do not deploy automatically.

This is still a prototype: one biome, front-facing procedurally moved art rather than eight-direction animation, no audio, quests, equipment, cloud sync, or active-run resume. Talent point costs, draft odds, weapon balance, and unlock prices are initial values. Each hero has original tree/node names and a signature weapon; offense/defense/utility foundations are intentionally shared across heroes, not eighteen wholly independent spell simulators.
