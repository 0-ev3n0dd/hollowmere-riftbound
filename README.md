# Hollowmere — Riftbound

A local-first, single-player survivor action RPG prototype. Vite + strict TypeScript + HTML5 Canvas, no backend, accounts, external fonts, analytics, or network services.

## Run

```sh
npm install
npm run build
npm run preview
```

Live: **https://0-ev3n0dd.github.io/hollowmere-riftbound/**.

Preview: **http://localhost:4174/hollowmere-riftbound/**. `npm run dev -- --port 4174` runs development mode instead.

## Play

- WASD or arrow keys: move. On touch devices, use the lower-left joystick.
- All weapons attack automatically. Collect green XP gems to level up.
- Choose one of three upgrades with a click/tap or **1 / 2 / 3**.
- **Escape** or the top-right pause button: pause. End an expedition from the pause panel to bank your gold.
- The Sanctum offers permanent HP, damage, speed, pickup range, gold, and revive upgrades.
- Choose one of six heroes, each with a different starting weapon; unlock the others with gold.
- Bosses arrive every three minutes. The expedition is endless.
- Gold is awarded for kills and survival, and banked at death or retreat. Active runs themselves are not saved.

## Features

Six five-level weapons: Moonblades, Arcane Bolt, Hallowed Ground, Reaper Axe, Stormcall, and Wisp Companion. Seven passive level-up choices. Ramping waves, elites, rift bosses, gems, particles, damage numbers, procedural idle/walk/lunge/hit/death animation, ellipse shadows, depth sorting, and a camera-following isometric diamond-tile world.

The renderer uses a cached flat-color ground pattern, shadow and damage-number caches, capped device pixel ratio, and precomputed procedural walk-pose atlases for dense crowds. Enemy, bullet, gem, and effect objects are pooled. An integer-key spatial grid bounds combat/targeting queries; soft local separation keeps enemies from occupying one point. The active enemy cap is 480. Actual frame rate depends on the browser/device. `node scripts/performance.mjs` runs a sustained 350-enemy, six-weapon benchmark.

## Art

All 119 user-supplied character PNGs were processed locally to transparent WebP sprites, 256 pixels tall, with clean filenames. This public repository includes only the 30 processed sprites currently used by the game; the raw source images and archives are not included. The originals are not modified. `public/manifest.json` records a fantasy name, role, dimensions, adult designation, and starting weapon where relevant. Original source filenames are retained only in the local full manifest, not this public manifest.

Six heroes, 16 ordinary enemy designs, and eight elite/boss designs are active. The remaining 89 processed designs are retained locally for future additions, not published in this repository. All characters are treated as adults. No nudity or sexual content is added. Art remains the supplied imagery, apart from background removal, trim, scaling, and procedural movement.

`python3 scripts/prepare_art.py` regenerates cutouts from `/workspace/iso-examples` using Pillow, NumPy, and SciPy. The script removes edge-connected near-background colors, drops tiny disconnected decoration, trims, and downsamples with anti-aliasing. Some original ground shadows/enclosed background areas remain on a handful of sprites; hand masks would be a future polish step.

## Save data

Local browser storage key: `hollowmere-v1`. Stores gold, unlocked/selected heroes, six meta-upgrade ranks, longest run, and completed run count. Saves are specific to the browser and origin; there is no cloud sync or active-run resume. No personal information is stored.

## Verification

`node scripts/verify.mjs` runs automated browser checks, plays about one minute, captures desktop/mobile screenshots, validates natural level-ups, pause, rewards, shop purchase, hero unlock, persistence, boss rendering, and a 350-enemy stress scene with all six weapons. It uses the installed Chromium path in the script (adjust to a local Playwright installation if needed). Art QA grid is `/workspace/iso-cutouts.jpg`; verification report is `/workspace/iso-verification.json`.

Normal play has no cheat controls. Read-only diagnostics: `window.__hollowmere.snapshot()`. Loading with `?qa=1` exposes explicit test-only helpers used by the verification script to exercise costly states; these affect that browser's local save only.

## Prototype limitations

- Original front-facing art is flipped and procedurally animated, not drawn as eight-direction isometric animation.
- One procedural endless biome; no quests, audio, inventory/equipment, weapon evolutions, or manual skills yet.
- Balance/unlock prices are initial values, not a finished progression economy.
- GitHub Actions builds and deploys the site to GitHub Pages on pushes to `main`. Saves remain local to each browser and origin.
