import "./style.css";

type Art = {
  id: string;
  name: string;
  title: string;
  role: string;
  weapon: string;
  src: string;
  width: number;
  height: number;
  adult: boolean;
};
type Weapon = "blade" | "bolt" | "aura" | "axe" | "lightning" | "familiar";
type Screen =
  "title" | "shop" | "run" | "levelup" | "paused" | "dead" | "unlock";
type Save = {
  gold: number;
  unlocked: string[];
  selected: string;
  meta: Record<string, number>;
  best: number;
  runs: number;
};
const $ = document.querySelector<HTMLElement>("#ui")!;
const canvas = document.querySelector<HTMLCanvasElement>("#world")!;
const ctx = canvas.getContext("2d", { alpha: false })!;
const TAU = Math.PI * 2,
  rand = (a: number, b: number) => a + Math.random() * (b - a),
  clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const hash = (x: number, y: number) => {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
};
let W = innerWidth,
  H = innerHeight,
  DPR = Math.min(devicePixelRatio, 1.5),
  screen: Screen = "title",
  art: Art[] = [],
  heroes: Art[] = [],
  enemiesArt: Art[] = [],
  eliteArt: Art[] = [];
let selected: Art,
  toastTimer = 0,
  bannerText = "",
  bannerTimer = 0,
  lastHud = 0,
  unlockTarget: Art | null = null;
const images = new Map<string, HTMLImageElement>();
const defaults: Save = {
  gold: 0,
  unlocked: ["c112"],
  selected: "c112",
  meta: { hp: 0, damage: 0, speed: 0, magnet: 0, gold: 0, revive: 0 },
  best: 0,
  runs: 0,
};
let save: Save;
try {
  save = {
    ...defaults,
    ...JSON.parse(localStorage.getItem("hollowmere-v1") || "{}"),
  };
  save.meta = { ...defaults.meta, ...save.meta };
  if (!Array.isArray(save.unlocked)) save.unlocked = ["c112"];
  save.gold = Math.max(0, Number(save.gold) || 0);
} catch {
  save = structuredClone(defaults);
}
function persist() {
  try {
    localStorage.setItem("hollowmere-v1", JSON.stringify(save));
  } catch {
    notify("Storage is unavailable. This session will still work.");
  }
}
const weaponInfo: Record<
  Weapon,
  { name: string; glyph: string; desc: string; color: string }
> = {
  blade: {
    name: "Moonblades",
    glyph: "✧",
    desc: "Orbiting blades cut through nearby foes.",
    color: "#e5d5aa",
  },
  bolt: {
    name: "Arcane Bolt",
    glyph: "✦",
    desc: "Seeks the nearest foe with a piercing spell.",
    color: "#a8ccd0",
  },
  aura: {
    name: "Hallowed Ground",
    glyph: "☼",
    desc: "A sacred aura burns everything around you.",
    color: "#e4c67f",
  },
  axe: {
    name: "Reaper Axe",
    glyph: "⚒",
    desc: "Lob a spinning axe through a crowd.",
    color: "#b5c1cb",
  },
  lightning: {
    name: "Stormcall",
    glyph: "ϟ",
    desc: "Lightning leaps between nearby enemies.",
    color: "#c9d6ac",
  },
  familiar: {
    name: "Wisp Companion",
    glyph: "❋",
    desc: "A loyal wisp fires homing embers.",
    color: "#d1b1c9",
  },
};
const weaponKeys = Object.keys(weaponInfo) as Weapon[];
const metaInfo = [
  {
    id: "hp",
    name: "Vital Roots",
    icon: "♡",
    desc: "+15 maximum vitality per rank.",
    base: 45,
    max: 8,
  },
  {
    id: "damage",
    name: "Ancient Might",
    icon: "✦",
    desc: "+8% to all weapon damage per rank.",
    base: 60,
    max: 8,
  },
  {
    id: "speed",
    name: "Wayfarer",
    icon: "➶",
    desc: "+5% movement speed per rank.",
    base: 40,
    max: 5,
  },
  {
    id: "magnet",
    name: "Soulreach",
    icon: "◎",
    desc: "+20% experience pickup range per rank.",
    base: 35,
    max: 6,
  },
  {
    id: "gold",
    name: "Golden Oath",
    icon: "◇",
    desc: "+10% gold earned per rank.",
    base: 50,
    max: 6,
  },
  {
    id: "revive",
    name: "Second Dawn",
    icon: "❈",
    desc: "One revival per run. Return at 50% vitality.",
    base: 250,
    max: 1,
  },
];
const heroPrices = [0, 120, 180, 260, 360, 480];
function money() {
  return `<div class="coins"><span class="coin">◇</span> ${Math.floor(save.gold).toLocaleString()} <span class="subtle">gold</span></div>`;
}
function topbar(active: string) {
  return `<header class="topbar"><div class="brand"><span class="brandmark">◈</span><div><strong>HOLLOWMERE</strong><small>R I F T B O U N D</small></div></div><nav class="nav"><button data-action="title" class="${active === "title" ? "active" : ""}">Expedition</button><button data-action="shop" class="${active === "shop" ? "active" : ""}">Sanctum</button>${money()}</nav></header>`;
}
function title() {
  screen = "title";
  document.body.classList.remove("playing");
  const owned = save.unlocked.includes(selected.id),
    wi = weaponInfo[selected.weapon as Weapon];
  $.innerHTML = `<section class="screen">${topbar("title")}<div class="intro"><div class="intro-copy"><div class="eyebrow">An endless little adventure</div><h1>One soul.<br><em>Endless night.</em></h1><p>The rift is open. Stand against the wilds, gather forgotten power, and return stronger with every fall.</p><button class="primary" data-action="${owned ? "start" : "unlock"}">${owned ? "Enter the Hollow" : "Unlock " + selected.name}<span>↗</span></button><div class="minor">${owned ? "WASD to move · Weapons strike automatically" : `◇ ${heroPrices[heroes.indexOf(selected)]} gold · A new path awaits`}</div></div><div class="hero-stage"><div class="halo"></div><div class="pedestal"></div><img class="stage-sprite" src="${selected.src}" alt="${selected.name}, ${selected.title}"><div class="hero-label"><small>YOUR CHOSEN SOUL</small><strong>${selected.name}</strong><small>${selected.title.toUpperCase()}</small><small>${wi.glyph} ${wi.name}</small></div><span class="hero-number">0${heroes.indexOf(selected) + 1}</span></div></div><div class="roster-header"><span class="sectionlabel">CHOOSE YOUR WANDERER</span><span class="subtle">${save.unlocked.length} / ${heroes.length} unlocked · Every soul plays differently</span></div><div class="roster">${heroes.map((a, i) => `<button class="hero-card ${a.id === selected.id ? "selected" : ""} ${save.unlocked.includes(a.id) ? "" : "locked"}" data-hero="${a.id}" aria-label="Select ${a.name}"><img src="${a.src}" alt=""><div class="cardtext"><b>${a.name}</b><small>${a.title}</small></div><span class="badge">${save.unlocked.includes(a.id) ? (a.id === selected.id ? "● Selected" : "Available") : "◇ " + heroPrices[i]}</span></button>`).join("")}</div><footer class="footnote"><span>PROTOTYPE 0.1 · SINGLE PLAYER · SAVED ON THIS DEVICE</span><span>Best ${formatTime(save.best)} · ${save.runs} expeditions</span></footer></section>`;
}
function shop() {
  screen = "shop";
  document.body.classList.remove("playing");
  $.innerHTML = `<section class="screen">${topbar("shop")}<div class="shop-title"><div class="eyebrow">Strength that stays with you</div><h1>The quiet between storms.</h1><p>Invest your hard-earned gold. Every blessing carries into your next expedition.</p></div><div class="shop-grid">${metaInfo
    .map((m) => {
      let rank = save.meta[m.id],
        cost = Math.round(m.base * Math.pow(1.65, rank));
      return `<article class="shop-card"><div class="shop-icon">${m.icon}<small>RANK ${rank} / ${m.max}</small></div><h3>${m.name}</h3><p>${m.desc}</p><div class="ranks">${Array.from({ length: m.max }, (_, i) => `<i class="${i < rank ? "on" : ""}"></i>`).join("")}</div><button class="buy" data-buy="${m.id}" ${rank >= m.max || save.gold < cost ? "disabled" : ""}><span>${rank >= m.max ? "Fully awakened" : "Awaken blessing"}</span><span>${rank >= m.max ? "✓" : "◇ " + cost}</span></button></article>`;
    })
    .join(
      "",
    )}</div><footer class="footnote"><span>GOLD AND BLESSINGS ARE SAVED AUTOMATICALLY</span><span>No purchases · Just play</span></footer></section>`;
}
function notify(text: string) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  $.append(el);
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.remove(), 3000);
}
function unlock(): void {
  if (save.unlocked.includes(selected.id)) return startRun();
  unlockTarget = selected;
  screen = "unlock";
  const cost = heroPrices[heroes.indexOf(selected)];
  $.insertAdjacentHTML(
    "beforeend",
    `<div class="modal-shade"><div class="modal unlock-modal"><div class="eyebrow">A new wanderer</div><img src="${selected.src}" alt="${selected.name}"><h2>${selected.name}</h2><p>${selected.title} · Begins with ${weaponInfo[selected.weapon as Weapon].name}.</p><button data-action="confirm-unlock" class="primary" ${save.gold < cost ? "disabled" : ""}>Unlock for ◇ ${cost}</button><br><button class="ghost" data-action="title">Return</button></div></div>`,
  );
}
function formatTime(n: number) {
  return `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(n % 60)
    .toString()
    .padStart(2, "0")}`;
}

class SpatialGrid {
  cells = new Map<number, Enemy[]>();
  used: Enemy[][] = [];
  build(es: Enemy[]) {
    for (const a of this.used) a.length = 0;
    this.used.length = 0;
    for (const e of es)
      if (e.alive) {
        const key =
          (Math.floor(e.x / 90) + 32768) * 65536 + Math.floor(e.y / 90) + 32768;
        let a = this.cells.get(key);
        if (!a) {
          a = [];
          this.cells.set(key, a);
        }
        if (!a.length) this.used.push(a);
        a.push(e);
      }
  }
  query(x: number, y: number, r: number, fn: (e: Enemy) => void) {
    for (let a = Math.floor((x - r) / 90); a <= Math.floor((x + r) / 90); a++)
      for (
        let b = Math.floor((y - r) / 90);
        b <= Math.floor((y + r) / 90);
        b++
      ) {
        const es = this.cells.get((a + 32768) * 65536 + b + 32768);
        if (es) for (const e of es) if (e.alive) fn(e);
      }
  }
  clear() {
    this.cells.clear();
    this.used = [];
  }
}
type Enemy = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  max: number;
  speed: number;
  size: number;
  art: Art;
  alive: boolean;
  death: number;
  flash: number;
  phase: number;
  face: number;
  boss: boolean;
  elite: boolean;
  hitCd: number;
};
type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  type: Weapon;
  size: number;
  angle: number;
  hit: Set<Enemy>;
  pierce: number;
};
type Gem = {
  x: number;
  y: number;
  value: number;
  age: number;
  active: boolean;
};
type Fx = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  text: string;
  color: string;
  size: number;
};
let enemies: Enemy[] = [],
  enemyPool: Enemy[] = [],
  bullets: Bullet[] = [],
  bulletPool: Bullet[] = [],
  gems: Gem[] = [],
  gemPool: Gem[] = [],
  effects: Fx[] = [],
  fxPool: Fx[] = [],
  grid = new SpatialGrid();
let player = {
  x: 0,
  y: 0,
  hp: 120,
  max: 120,
  speed: 155,
  face: 1,
  moving: false,
  phase: 0,
  flash: 0,
  lunge: 0,
  invuln: 0,
};
let run = {
  time: 0,
  kills: 0,
  gold: 0,
  xp: 0,
  need: 9,
  level: 1,
  damage: 1,
  area: 1,
  cooldown: 1,
  magnet: 82,
  speed: 1,
  regen: 0,
  revived: false,
  bosses: 0,
  earned: false,
};
let weapons: Record<Weapon, number> = {
    blade: 0,
    bolt: 0,
    aura: 0,
    axe: 0,
    lightning: 0,
    familiar: 0,
  },
  cooldowns: Record<Weapon, number> = {
    blade: 0,
    bolt: 0,
    aura: 0,
    axe: 0,
    lightning: 0,
    familiar: 0,
  };
let spawnTimer = 0,
  nextBoss = 180,
  cam = { x: 0, y: 0 },
  keys = new Set<string>(),
  joy = { x: 0, y: 0, active: false, id: -1 },
  lastTime = 0,
  fps = 60,
  frameMs = 16.67;
function startRun(): void {
  if (!save.unlocked.includes(selected.id)) return unlock();
  screen = "run";
  document.body.classList.add("playing");
  enemies = [];
  enemyPool = [];
  bullets = [];
  bulletPool = [];
  gems = [];
  gemPool = [];
  effects = [];
  fxPool = [];
  grid.clear();
  keys.clear();
  joy.x = joy.y = 0;
  player = {
    x: 0,
    y: 0,
    hp: 120 + save.meta.hp * 15,
    max: 120 + save.meta.hp * 15,
    speed: 155 * (1 + save.meta.speed * 0.05),
    face: 1,
    moving: false,
    phase: 0,
    flash: 0,
    lunge: 0,
    invuln: 2,
  };
  run = {
    time: 0,
    kills: 0,
    gold: 0,
    xp: 0,
    need: 9,
    level: 1,
    damage: 1 + save.meta.damage * 0.08,
    area: 1,
    cooldown: 1,
    magnet: 82 * (1 + save.meta.magnet * 0.2),
    speed: 1,
    regen: 0,
    revived: false,
    bosses: 0,
    earned: false,
  };
  weapons = { blade: 0, bolt: 0, aura: 0, axe: 0, lightning: 0, familiar: 0 };
  weapons[selected.weapon as Weapon] = 1;
  cooldowns = { blade: 0, bolt: 0, aura: 0, axe: 0, lightning: 0, familiar: 0 };
  spawnTimer = 0;
  nextBoss = 180;
  cam = { x: 0, y: 0 };
  for (let i = 0; i < 25; i++) spawnEnemy(false, rand(220, 600));
  hud();
  banner("The Hollow stirs", "EXPEDITION BEGINS");
}
function banner(text: string, sub = "THE RIFT GROWS RESTLESS") {
  bannerText = `<small>${sub}</small>${text}`;
  bannerTimer = 3;
}
function hud() {
  if (screen !== "run") return;
  $.innerHTML = `<section class="hud"><div class="xp-bar"><div class="xp-fill" style="width:${(run.xp / run.need) * 100}%"></div></div><div class="hud-top"><div class="player-panel"><div class="player-name">${selected.name}<small>LEVEL ${run.level}</small></div><div class="hp-track"><div class="hp-fill" style="width:${(player.hp / player.max) * 100}%"></div></div><div class="hp-text"><span>${Math.ceil(player.hp)} / ${player.max} vitality</span><span>${Math.floor(run.xp)} / ${run.need} XP</span></div></div><div class="time-panel"><b>${formatTime(run.time)}</b><small>WAVE ${Math.floor(run.time / 30) + 1} · ${Math.max(1, Math.ceil((nextBoss - run.time) / 60))}m TO RIFT LORD</small></div><div class="run-resources"><span class="coin">◇</span><b>${Math.floor(run.gold)}</b><span class="sep">/</span><span>⚔ ${run.kills}<span class="kills-label"> slain</span></span><button class="pause" data-action="pause" aria-label="Pause">Ⅱ</button></div></div><div class="hud-bottom"><div class="weaponbar">${weaponKeys.map((k) => `<div class="weapon-slot ${weapons[k] ? "" : "empty"}" title="${weaponInfo[k].name}${weapons[k] ? " level " + weapons[k] : ": not acquired"}"><span class="glyph">${weaponInfo[k].glyph}</span><small>${weapons[k] ? "LV " + weapons[k] : "—"}</small><span class="dots">${"•".repeat(weapons[k])}</span></div>`).join("")}</div><div class="run-hint">WASD / ARROWS &nbsp; MOVE &nbsp; · &nbsp; ESC &nbsp; PAUSE</div></div>${bannerTimer > 0 ? `<div class="banner">${bannerText}</div>` : ""}</section>`;
}
function spawnEnemy(boss = false, radius?: number) {
  if (enemies.filter((e) => e.alive).length >= 480 && !boss) return;
  let a = rand(0, TAU),
    r = radius ?? Math.max(450, Math.min(W, H) * 0.65),
    elite = !boss && run.time > 40 && Math.random() < 0.1;
  let artwork = boss
    ? eliteArt[4 + (run.bosses % 4)]
    : elite
      ? eliteArt[Math.floor(rand(0, 4))]
      : enemiesArt[Math.floor(Math.random() * enemiesArt.length)];
  let max =
    (boss ? 650 + run.bosses * 400 : elite ? 90 : 20) * (1 + run.time / 180);
  let e = enemyPool.pop() || ({} as Enemy);
  Object.assign(e, {
    x: player.x + Math.cos(a) * r,
    y: player.y + Math.sin(a) * r * 0.75,
    vx: 0,
    vy: 0,
    hp: max,
    max,
    speed: boss ? 37 : elite ? 46 : rand(27, 47) + Math.min(35, run.time / 18),
    size: boss ? 160 : elite ? 87 : rand(54, 69),
    art: artwork,
    alive: true,
    death: 0,
    flash: 0,
    phase: rand(0, TAU),
    face: 1,
    boss,
    elite,
    hitCd: 0,
  });
  enemies.push(e);
}
function damage(e: Enemy, n: number, kx = 0, ky = 0) {
  if (!e.alive) return;
  e.hp -= n;
  e.flash = 0.12;
  e.vx += kx;
  e.vy += ky;
  if (effects.length < (enemies.length > 200 ? 75 : 125))
    fx(
      e.x,
      e.y - e.size * 0.7,
      Math.round(n).toString(),
      n > 30 ? "#fbebbd" : "#faf1db",
      15,
    );
  if (e.hp <= 0) {
    e.alive = false;
    e.death = 0.38;
    run.kills++;
    const gain = (e.boss ? 40 : e.elite ? 5 : 1) * (1 + save.meta.gold * 0.1);
    run.gold += gain;
    gem(e.x, e.y, e.boss ? 25 : e.elite ? 4 : 1);
    for (let i = 0; i < 3; i++)
      fx(e.x, e.y - 20, "", i % 2 ? "#c8c4a6" : "#80906e", rand(2, 5));
    if (e.boss) {
      run.bosses++;
      banner("A rift lord has fallen", "THE HOLLOW REMEMBERS");
      player.hp = Math.min(player.max, player.hp + 30);
    }
  }
}
function gem(x: number, y: number, value: number) {
  if (gems.length > 900) {
    let g = gems.find((g) => g.active);
    if (g) g.value += value;
    return;
  }
  const g = gemPool.pop() || ({} as Gem);
  Object.assign(g, { x, y, value, age: 0, active: true });
  gems.push(g);
}
function fx(x: number, y: number, text: string, color: string, size: number) {
  if (effects.length > 220) return;
  const f = fxPool.pop() || ({} as Fx);
  Object.assign(f, {
    x,
    y,
    vx: rand(-25, 25),
    vy: text ? -45 : rand(-55, 20),
    life: text ? 0.72 : 0.4,
    max: text ? 0.72 : 0.4,
    text,
    color,
    size,
  });
  effects.push(f);
}
function nearest(x: number, y: number, r = 650, skip?: Set<Enemy>) {
  let closest: Enemy | undefined,
    d = r * r;
  grid.query(x, y, r, (e) => {
    if (skip?.has(e)) return;
    let dd = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (dd < d) {
      closest = e;
      d = dd;
    }
  });
  return closest;
}
function projectile(
  type: Weapon,
  x: number,
  y: number,
  angle: number,
  speed: number,
  damage: number,
  life: number,
  size: number,
  pierce = 1,
) {
  const b = bulletPool.pop() || ({ hit: new Set<Enemy>() } as Bullet);
  b.hit.clear();
  Object.assign(b, {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life,
    damage,
    type,
    size,
    angle: 0,
    pierce,
  });
  bullets.push(b);
}
let lightningPaths: { points: { x: number; y: number }[]; life: number }[] = [];
function attack(dt: number) {
  for (const k of weaponKeys)
    if (weapons[k]) {
      let lv = weapons[k];
      cooldowns[k] -= dt;
      if (k === "blade") {
        const count = 1 + Math.floor((lv + 1) / 2),
          r = (74 + lv * 7) * run.area;
        for (let i = 0; i < count; i++) {
          const a = run.time * (2 + lv * 0.16) + (i * TAU) / count,
            x = player.x + Math.cos(a) * r,
            y = player.y + Math.sin(a) * r * 0.65;
          grid.query(x, y, 29, (e) => {
            if (
              e.hitCd <= 0 &&
              Math.hypot(e.x - x, e.y - y) < 27 + (e.boss ? 20 : 5)
            ) {
              damage(
                e,
                (10 + lv * 5) * run.damage,
                Math.cos(a) * 75,
                Math.sin(a) * 75,
              );
              e.hitCd = 0.28 / run.cooldown;
              player.lunge = 0.12;
            }
          });
        }
      } else if (cooldowns[k] <= 0) {
        if (k === "aura") {
          const r = (72 + lv * 13) * run.area;
          grid.query(player.x, player.y, r, (e) => {
            if (Math.hypot(e.x - player.x, (e.y - player.y) * 1.18) < r)
              damage(
                e,
                (5 + lv * 4) * run.damage,
                (e.x - player.x) * 0.1,
                (e.y - player.y) * 0.1,
              );
          });
          cooldowns[k] = 0.65 / run.cooldown;
        } else if (k === "lightning") {
          let e = nearest(player.x, player.y, 540);
          const hit = new Set<Enemy>(),
            points = [{ x: player.x, y: player.y - 35 }];
          for (let i = 0; i < 2 + lv && e; i++) {
            hit.add(e);
            points.push({ x: e.x, y: e.y - e.size * 0.45 });
            damage(e, (16 + lv * 6) * run.damage);
            e = nearest(e.x, e.y, 200, hit);
          }
          if (hit.size) lightningPaths.push({ points, life: 0.25 });
          cooldowns[k] = (2.1 - lv * 0.12) / run.cooldown;
          player.lunge = 0.15;
        } else {
          const e = nearest(player.x, player.y);
          if (e) {
            const x =
                k === "familiar"
                  ? player.x + Math.cos(run.time * 1.6) * 60
                  : player.x,
              y = k === "familiar" ? player.y - 45 : player.y - 20;
            let a = Math.atan2(e.y - y, e.x - x);
            const count =
              k === "axe"
                ? 1 + Math.floor(lv / 2)
                : 1 + Math.floor((lv - 1) / 3);
            for (let i = 0; i < count; i++)
              projectile(
                k,
                x,
                y,
                a + (i - (count - 1) / 2) * 0.17,
                k === "axe" ? 235 : 350,
                (k === "axe" ? 20 + lv * 5 : 13 + lv * 5) * run.damage,
                k === "axe" ? 2.8 : 1.7,
                k === "axe" ? 17 : 8,
                k === "axe" ? 5 : 1 + Math.floor(lv / 2),
              );
            cooldowns[k] =
              (k === "axe" ? 1.9 : k === "familiar" ? 1.1 : 0.9) / run.cooldown;
            player.lunge = 0.15;
          } else cooldowns[k] = 0.15;
        }
      }
    }
}
function update(dt: number) {
  run.time += dt;
  player.invuln = Math.max(0, player.invuln - dt);
  player.flash = Math.max(0, player.flash - dt);
  player.lunge = Math.max(0, player.lunge - dt);
  bannerTimer -= dt;
  let x =
      (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
      (keys.has("a") || keys.has("arrowleft") ? 1 : 0) +
      joy.x,
    y =
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
      (keys.has("w") || keys.has("arrowup") ? 1 : 0) +
      joy.y;
  let len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  player.moving = len > 0.08;
  if (player.moving) {
    player.x += x * player.speed * run.speed * dt;
    player.y += y * player.speed * run.speed * dt * 0.8;
    if (Math.abs(x) > 0.05) player.face = x > 0 ? 1 : -1;
    player.phase += dt * 10;
  } else player.phase += dt * 2;
  player.hp = Math.min(player.max, player.hp + run.regen * dt);
  cam.x += (player.x - cam.x) * Math.min(1, dt * 8);
  cam.y += (player.y - cam.y) * Math.min(1, dt * 8);
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnTimer = 1 / (5.5 + run.time / 30);
    spawnEnemy();
    if (run.time > 90) spawnEnemy();
  }
  if (run.time >= nextBoss) {
    spawnEnemy(true, 470);
    nextBoss += 180;
    banner("A rift lord approaches", "SEAL THE BREACH");
  }
  for (const e of enemies) {
    if (!e.alive) {
      e.death -= dt;
      continue;
    }
    e.hitCd -= dt;
    e.flash = Math.max(0, e.flash - dt);
    const dx = player.x - e.x,
      dy = player.y - e.y,
      d = Math.hypot(dx, dy) || 1;
    e.face = dx > 0 ? 1 : -1;
    e.phase += dt * 8;
    grid.query(e.x, e.y, 22, (o) => {
      if (o === e) return;
      const sx = e.x - o.x,
        sy = e.y - o.y,
        sd = Math.hypot(sx, sy);
      if (sd > 0.1 && sd < 20) {
        const force = (20 - sd) * 2.3 * dt;
        e.x += (sx / sd) * force;
        e.y += (sy / sd) * force;
      }
    });
    const speed = e.speed * (e.boss ? 1 + Math.sin(run.time) * 0.25 : 1);
    e.x += ((dx / d) * speed + e.vx) * dt;
    e.y += ((dy / d) * speed * 0.8 + e.vy) * dt;
    e.vx *= Math.max(0, 1 - dt * 9);
    e.vy *= Math.max(0, 1 - dt * 9);
    if (d > 1900) {
      let a = rand(0, TAU);
      e.x = player.x + Math.cos(a) * 650;
      e.y = player.y + Math.sin(a) * 500;
    }
    if (d < (e.boss ? 38 : 22) && player.invuln <= 0) {
      player.hp -= e.boss ? 24 : e.elite ? 12 : 7;
      player.invuln = 0.72;
      player.flash = 0.2;
      fx(
        player.x,
        player.y - 75,
        e.boss ? "-24" : e.elite ? "-12" : "-7",
        "#a84336",
        20,
      );
      e.vx = (-dx / d) * 140;
      e.vy = (-dy / d) * 140;
      if (player.hp <= 0) {
        if (save.meta.revive > 0 && !run.revived) {
          run.revived = true;
          player.hp = player.max * 0.5;
          player.invuln = 4;
          banner("Rise, wanderer", "SECOND DAWN");
          for (const m of enemies)
            if (m.alive && Math.hypot(m.x - player.x, m.y - player.y) < 180)
              damage(m, 80);
        } else {
          finishRun();
          return;
        }
      }
    }
  }
  grid.build(enemies);
  attack(dt);
  for (const b of bullets) {
    b.life -= dt;
    if (b.life <= 0) continue;
    if (b.type === "familiar") {
      const t = nearest(b.x, b.y, 220, b.hit);
      if (t) {
        let a = Math.atan2(t.y - b.y, t.x - b.x);
        b.vx += (Math.cos(a) * 330 - b.vx) * dt * 4;
        b.vy += (Math.sin(a) * 330 - b.vy) * dt * 4;
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.angle += dt * 9;
    if (b.type === "axe") b.vy += dt * 75;
    grid.query(b.x, b.y, 38, (e) => {
      if (
        b.life > 0 &&
        !b.hit.has(e) &&
        Math.hypot(e.x - b.x, e.y - 18 - b.y) < (e.boss ? 40 : 25)
      ) {
        b.hit.add(e);
        damage(e, b.damage, b.vx * 0.18, b.vy * 0.18);
        b.pierce--;
        if (b.pierce <= 0) b.life = 0;
      }
    });
  }
  for (const g of gems)
    if (g.active) {
      g.age += dt;
      let dx = player.x - g.x,
        dy = player.y - g.y,
        d = Math.hypot(dx, dy);
      if (d < run.magnet) {
        g.x += (dx / Math.max(1, d)) * (230 + 350 * (1 - d / run.magnet)) * dt;
        g.y += (dy / Math.max(1, d)) * (230 + 350 * (1 - d / run.magnet)) * dt;
        if (d < 18) {
          g.active = false;
          run.xp += g.value;
          fx(player.x, player.y - 45, "", "#9ec99b", 3);
        }
      }
    }
  for (const f of effects) {
    f.life -= dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (!f.text) f.vy += dt * 60;
  }
  for (const l of lightningPaths) l.life -= dt;
  lightningPaths = lightningPaths.filter((l) => l.life > 0);
  for (let i = enemies.length - 1; i >= 0; i--)
    if (!enemies[i].alive && enemies[i].death <= 0) {
      enemyPool.push(enemies[i]);
      enemies[i] = enemies[enemies.length - 1];
      enemies.pop();
    }
  for (let i = bullets.length - 1; i >= 0; i--)
    if (bullets[i].life <= 0) {
      bulletPool.push(bullets[i]);
      bullets[i] = bullets[bullets.length - 1];
      bullets.pop();
    }
  for (let i = gems.length - 1; i >= 0; i--)
    if (!gems[i].active) {
      gemPool.push(gems[i]);
      gems[i] = gems[gems.length - 1];
      gems.pop();
    }
  for (let i = effects.length - 1; i >= 0; i--)
    if (effects[i].life <= 0) {
      fxPool.push(effects[i]);
      effects[i] = effects[effects.length - 1];
      effects.pop();
    }
  if (run.xp >= run.need) {
    run.xp -= run.need;
    run.level++;
    run.need = Math.floor(8 + run.level * 3.4);
    player.hp = Math.min(player.max, player.hp + 8);
    levelUp();
    return;
  }
  lastHud += dt;
  if (lastHud > 0.15) {
    lastHud = 0;
    hud();
  }
}

type Upgrade = {
  id: string;
  name: string;
  glyph: string;
  desc: string;
  tier: string;
  apply: () => void;
};
let choices: Upgrade[] = [];
function levelUp() {
  screen = "levelup";
  document.body.classList.remove("playing");
  const pool: Upgrade[] = weaponKeys
    .filter((k) => weapons[k] < 5)
    .map((k) => ({
      id: k,
      name: weaponInfo[k].name,
      glyph: weaponInfo[k].glyph,
      desc: weapons[k]
        ? `Level ${weapons[k] + 1}: more damage, wider reach, and greater power.`
        : weaponInfo[k].desc,
      tier: weapons[k]
        ? `WEAPON · LEVEL ${weapons[k]} → ${weapons[k] + 1}`
        : "NEW WEAPON",
      apply: () => {
        weapons[k]++;
        cooldowns[k] = 0;
      },
    }));
  pool.push(
    {
      id: "power",
      name: "Rising Power",
      glyph: "✹",
      desc: "+15% damage for every weapon.",
      tier: "PASSIVE · MIGHT",
      apply: () => (run.damage += 0.15),
    },
    {
      id: "haste",
      name: "Quickening",
      glyph: "»",
      desc: "Weapons strike 12% more often.",
      tier: "PASSIVE · HASTE",
      apply: () => (run.cooldown += 0.12),
    },
    {
      id: "reach",
      name: "Soul Harvest",
      glyph: "◎",
      desc: "+35% experience pickup range.",
      tier: "PASSIVE · REACH",
      apply: () => (run.magnet *= 1.35),
    },
    {
      id: "vitality",
      name: "Wild Heart",
      glyph: "♡",
      desc: "+25 maximum vitality. Heal 30 vitality.",
      tier: "PASSIVE · VITALITY",
      apply: () => {
        player.max += 25;
        player.hp = Math.min(player.max, player.hp + 30);
      },
    },
    {
      id: "swiftness",
      name: "Lightfoot",
      glyph: "➶",
      desc: "+10% movement speed.",
      tier: "PASSIVE · AGILITY",
      apply: () => (run.speed += 0.1),
    },
    {
      id: "area",
      name: "Widening Rift",
      glyph: "◉",
      desc: "+15% size to blades and hallowed ground.",
      tier: "PASSIVE · AREA",
      apply: () => (run.area += 0.15),
    },
    {
      id: "regen",
      name: "Living Spring",
      glyph: "❧",
      desc: "Regenerate 0.5 vitality every second.",
      tier: "PASSIVE · RENEWAL",
      apply: () => (run.regen += 0.5),
    },
  );
  choices = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  $.insertAdjacentHTML(
    "beforeend",
    `<div class="modal-shade"><section class="modal"><div class="eyebrow">Level ${run.level} · A soul awakened</div><h2>Choose your power.</h2><p>The Hollow grows stronger. So do you.</p><div class="choices">${choices.map((c, i) => `<button class="upgrade" data-upgrade="${i}"><span class="glyph">${c.glyph}</span><span class="tier">${c.tier}</span><h3>${c.name}</h3><p>${c.desc}</p><span class="choose">${i + 1} &nbsp; Claim this blessing &nbsp; ↗</span></button>`).join("")}</div><p class="close-hint">Time stands still. Choose with care. &nbsp; [1] [2] [3]</p></section></div>`,
  );
}
function choose(i: number) {
  if (screen !== "levelup" || !choices[i]) return;
  choices[i].apply();
  screen = "run";
  document.body.classList.add("playing");
  hud();
}
function pause() {
  if (screen === "run") {
    screen = "paused";
    document.body.classList.remove("playing");
    $.insertAdjacentHTML(
      "beforeend",
      `<div class="modal-shade"><div class="modal paused"><div class="eyebrow">Take a breath</div><h2>A moment of stillness.</h2><p>Your expedition will wait.</p><button class="primary" data-action="resume">Continue ↗</button><button class="secondary" data-action="retreat">End expedition</button></div></div>`,
    );
  } else if (screen === "paused") {
    screen = "run";
    document.body.classList.add("playing");
    hud();
  }
}
function finishRun() {
  if (!run.earned) {
    run.gold += Math.floor(run.time / 8) * (1 + save.meta.gold * 0.1);
    save.gold += Math.floor(run.gold);
    save.best = Math.max(save.best, run.time);
    save.runs++;
    run.earned = true;
    persist();
  }
  screen = "dead";
  document.body.classList.remove("playing");
  $.innerHTML = `<div class="modal-shade"><section class="modal" style="max-width:650px"><div class="eyebrow">The Hollow remembers</div><h2>Not the end. A beginning.</h2><p>${selected.name}'s watch is over. Your hard-earned power remains.</p><div class="statsgrid"><div class="stat"><b>${formatTime(run.time)}</b><small>SURVIVED</small></div><div class="stat"><b>${run.kills}</b><small>FOES SLAIN</small></div><div class="stat"><b>${run.level}</b><small>SOUL LEVEL</small></div><div class="stat"><b>◇ ${Math.floor(run.gold)}</b><small>GOLD EARNED</small></div></div><div class="death-buttons"><button class="primary" data-action="shop">Visit the Sanctum ↗</button><button class="secondary" data-action="title">Choose a wanderer</button></div><p class="close-hint">All gold has been saved · Best expedition ${formatTime(save.best)}</p></section></div>`;
}

const ground = document.createElement("canvas");
ground.width = 1024;
ground.height = 1024;
const gctx = ground.getContext("2d")!;
gctx.fillStyle = "#b1b99e";
gctx.fillRect(0, 0, 1024, 1024);
const tileColors = [
  "#aeb89b",
  "#b3bca1",
  "#b7bfa5",
  "#adb69a",
  "#b9c0a7",
  "#b2bba0",
];
for (let row = -1; row < 34; row++)
  for (let col = -1; col < 10; col++) {
    let x = col * 128 + (row % 2) * 64,
      y = row * 32;
    gctx.beginPath();
    gctx.moveTo(x, y - 32);
    gctx.lineTo(x + 64, y);
    gctx.lineTo(x, y + 32);
    gctx.lineTo(x - 64, y);
    gctx.closePath();
    gctx.fillStyle = tileColors[Math.floor(hash(col, row) * tileColors.length)];
    gctx.fill();
    gctx.strokeStyle = "#94a18735";
    gctx.lineWidth = 0.8;
    gctx.stroke();
  }
const groundPattern = ctx.createPattern(ground, "repeat")!;
const whiteImages = new Map<string, HTMLCanvasElement>();
const numbers = new Map<string, HTMLCanvasElement>();
function numberSprite(text: string, color: string, size: number) {
  const key = text + color + size;
  let c = numbers.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = 72;
  c.height = 32;
  const t = c.getContext("2d")!;
  t.font = `bold ${size}px system-ui`;
  t.textAlign = "center";
  t.strokeStyle = "#46583d88";
  t.lineWidth = 2;
  t.strokeText(text, 36, 23);
  t.fillStyle = color;
  t.fillText(text, 36, 23);
  numbers.set(key, c);
  return c;
}
const shadowImage = document.createElement("canvas");
shadowImage.width = 80;
shadowImage.height = 24;
const sh = shadowImage.getContext("2d")!;
sh.fillStyle = "#4a5d4240";
sh.beginPath();
sh.ellipse(40, 12, 39, 11, 0, 0, TAU);
sh.fill();
type Atlas = {
  normal: HTMLCanvasElement;
  white: HTMLCanvasElement;
  w: number;
  h: number;
  base: number;
};
const atlases = new Map<string, Atlas>();
function makeAtlas(a: Art, img: HTMLImageElement, white: HTMLCanvasElement) {
  const base = a.role === "elite" ? 87 : 64,
    w = Math.ceil((base * a.width) / a.height) + 14,
    h = base + 14;
  const normal = document.createElement("canvas"),
    tint = document.createElement("canvas");
  normal.width = tint.width = w * 24;
  normal.height = tint.height = h;
  const n = normal.getContext("2d")!,
    t = tint.getContext("2d")!;
  for (let face = 0; face < 2; face++)
    for (let frame = 0; frame < 12; frame++) {
      const phase = (frame * TAU) / 12,
        index = face * 12 + frame;
      for (const [c, im] of [
        [n, img],
        [t, white],
      ] as const) {
        c.save();
        c.translate(index * w + w / 2, h - 4 - Math.abs(Math.sin(phase)) * 3);
        c.scale(face ? -1 : 1, 1);
        c.rotate(Math.sin(phase) * 0.035);
        const sq = Math.sin(phase * 2) * 0.025;
        c.scale(1 - sq, 1 + sq);
        c.drawImage(
          im,
          (-base * a.width) / a.height / 2,
          -base,
          (base * a.width) / a.height,
          base,
        );
        c.restore();
      }
    }
  atlases.set(a.id, { normal, white: tint, w, h, base });
}

function polygon(points: number[][], fill: string, stroke?: string) {
  ctx.beginPath();
  points.forEach((p, i) =>
    i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]),
  );
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
function drawProp(x: number, y: number, seed: number) {
  ctx.save();
  ctx.translate(x, y);
  if (seed > 0.82) {
    ctx.fillStyle = "#7e8e6c30";
    ctx.beginPath();
    ctx.ellipse(4, 2, 19, 7, 0, 0, TAU);
    ctx.fill();
    polygon(
      [
        [-13, -3],
        [-8, -17],
        [4, -22],
        [17, -10],
        [15, 0],
        [1, 5],
      ],
      "#879382",
    );
    polygon(
      [
        [-13, -3],
        [-8, -17],
        [3, -12],
        [1, 5],
      ],
      "#9aa28c",
    );
    polygon(
      [
        [3, -12],
        [4, -22],
        [17, -10],
        [15, 0],
        [1, 5],
      ],
      "#7c8b7b",
    );
  } else if (seed > 0.74) {
    ctx.fillStyle = "#7a896a";
    ctx.fillRect(-8, -26, 15, 24);
    ctx.beginPath();
    ctx.arc(-0.5, -26, 7.5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#a6b093";
    ctx.fillRect(-6, -25, 11, 21);
    ctx.fillStyle = "#829276";
    ctx.fillRect(-1, -25, 2, 11);
    ctx.fillRect(-4, -22, 8, 2);
    ctx.fillStyle = "#7e8e6c30";
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 5, 0, 0, TAU);
    ctx.fill();
  } else {
    ctx.strokeStyle = seed > 0.6 ? "#819370" : "#8b9b79";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(-10, -8);
    ctx.moveTo(-2, 0);
    ctx.lineTo(-1, -13);
    ctx.moveTo(2, 0);
    ctx.lineTo(7, -9);
    ctx.stroke();
    if (seed > 0.66) {
      ctx.fillStyle = "#d6c79b";
      ctx.beginPath();
      ctx.arc(-1, -14, 2, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}
function drawGround() {
  ctx.save();
  ctx.translate(W / 2 - cam.x, H * 0.53 - cam.y);
  ctx.fillStyle = groundPattern;
  ctx.fillRect(cam.x - W / 2 - 130, cam.y - H * 0.53 - 100, W + 260, H + 200);
  const px0 = Math.floor((cam.x - W / 2) / 140) - 1,
    py0 = Math.floor((cam.y - H / 2) / 115) - 1;
  for (let j = py0; j < py0 + H / 115 + 3; j++)
    for (let i = px0; i < px0 + W / 140 + 3; i++) {
      let h = hash(i, j);
      if (h > 0.54) drawProp(i * 140 + hash(j, i) * 90, j * 115 + h * 55, h);
    }
  // Weathered waystone circle: flat forms, no texture assets.
  if (Math.abs(cam.x) < W && Math.abs(cam.y) < H) {
    ctx.strokeStyle = "#c9ceb360";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.ellipse(0, 12, 155, 77, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "#85977760";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 12, 143, 70, 0, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      let a = (i * TAU) / 12;
      ctx.save();
      ctx.translate(Math.cos(a) * 154, 12 + Math.sin(a) * 76);
      ctx.rotate(a);
      ctx.fillStyle = "#8a9c7c80";
      ctx.fillRect(-2, -6, 4, 12);
      ctx.restore();
    }
  }
  ctx.restore();
}
function screenXY(x: number, y: number) {
  return [x - cam.x + W / 2, y - cam.y + H * 0.53];
}
function sprite(
  a: Art,
  x: number,
  y: number,
  size: number,
  phase: number,
  face: number,
  moving: boolean,
  flash = 0,
  death = 0,
  lunge = 0,
  boss = false,
) {
  let [sx, sy] = screenXY(x, y);
  if (sx < -size || sx > W + size || sy < -size * 0.2 || sy > H + size) return;
  const img = images.get(a.id);
  if (!img) return;
  const ratio = a.width / a.height,
    w = size * ratio,
    bob = moving ? Math.abs(Math.sin(phase)) * 3 : Math.sin(phase) * 1.6;
  const fade = death > 0 ? clamp(death / 0.38, 0, 1) : 1;
  ctx.globalAlpha = fade;
  ctx.drawImage(
    shadowImage,
    sx - w * 0.33,
    sy + 2 - size * 0.078,
    w * 0.66,
    size * 0.156,
  );
  const atlas = atlases.get(a.id);
  if (!boss && !death && enemies.length > 140 && atlas) {
    const frame =
        (((Math.floor((phase / TAU) * 12) % 12) + 12) % 12) +
        (face < 0 ? 12 : 0),
      scale = size / atlas.base,
      dw = atlas.w * scale,
      dh = atlas.h * scale;
    ctx.drawImage(
      atlas.normal,
      frame * atlas.w,
      0,
      atlas.w,
      atlas.h,
      sx - dw / 2,
      sy - dh + 4 * scale,
      dw,
      dh,
    );
    if (flash > 0) {
      ctx.globalAlpha = 0.72;
      ctx.drawImage(
        atlas.white,
        frame * atlas.w,
        0,
        atlas.w,
        atlas.h,
        sx - dw / 2,
        sy - dh + 4 * scale,
        dw,
        dh,
      );
    }
    ctx.globalAlpha = 1;
    return;
  }
  ctx.save();
  ctx.translate(sx + face * lunge * 28, sy - bob);
  ctx.scale(face, 1);
  ctx.rotate(moving ? Math.sin(phase) * 0.035 : 0);
  const squash = moving ? Math.sin(phase * 2) * 0.025 : Math.sin(phase) * 0.008;
  ctx.scale(1 - squash, 1 + squash);
  if (death > 0) {
    ctx.rotate((1 - fade) * 0.25);
    ctx.scale(1 + (1 - fade) * 0.25, fade * 0.2 + 0.8);
  }
  ctx.drawImage(img, -w / 2, -size, w, size);
  if (flash > 0) {
    ctx.globalAlpha = fade * 0.72;
    const white = whiteImages.get(a.id);
    if (white) ctx.drawImage(white, -w / 2, -size, w, size);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  if (boss) {
    ctx.fillStyle = "#384f42d9";
    ctx.fillRect(sx - 43, sy - size - 18, 86, 6);
    const e = enemies.find((e) => e.alive && e.boss && e.x === x);
    if (e) {
      ctx.fillStyle = "#b07857";
      ctx.fillRect(sx - 42, sy - size - 17, (84 * e.hp) / e.max, 4);
      ctx.font = "9px system-ui";
      ctx.fillStyle = "#354d3b";
      ctx.textAlign = "center";
      ctx.fillText("RIFT LORD", sx, sy - size - 26);
    }
  }
}
function drawWeapons() {
  const px = player.x,
    py = player.y;
  let [x, y] = screenXY(px, py);
  if (weapons.aura) {
    const r = (72 + weapons.aura * 13) * run.area;
    ctx.fillStyle = "#e1d19623";
    ctx.strokeStyle = "#e7d3968c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.68, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([7, 13]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.86, r * 0.58, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (weapons.blade) {
    const lv = weapons.blade,
      count = 1 + Math.floor((lv + 1) / 2),
      r = (74 + lv * 7) * run.area;
    ctx.strokeStyle = "#e7d9ac2b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.65, 0, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < count; i++) {
      const a = run.time * (2 + lv * 0.16) + (i * TAU) / count;
      ctx.save();
      ctx.translate(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.65 - 10);
      ctx.rotate(a + Math.PI / 4);
      polygon(
        [
          [0, -23],
          [8, -5],
          [4, 12],
          [-4, 12],
          [-6, -5],
        ],
        "#e7ddbd",
        "#8b986f",
      );
      ctx.fillStyle = "#91714a";
      ctx.fillRect(-8, 8, 16, 4);
      ctx.fillRect(-2, 12, 4, 10);
      ctx.restore();
    }
  }
  if (weapons.familiar) {
    let a = run.time * 1.6,
      fx = x + Math.cos(a) * 60,
      fy = y - 45 + Math.sin(a) * 20;
    ctx.fillStyle = "#d9bdd5";
    ctx.beginPath();
    ctx.arc(fx, fy, 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#f8ebdc";
    ctx.beginPath();
    ctx.arc(fx - 2, fy - 2, 3, 0, TAU);
    ctx.fill();
  }
}
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!["run", "levelup", "paused", "dead"].includes(screen)) {
    cam.x = Math.sin(performance.now() * 0.00003) * 80;
    cam.y = -80;
    drawGround();
    return;
  }
  drawGround();
  drawWeapons();
  for (const g of gems) {
    let [x, y] = screenXY(g.x, g.y);
    if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
    const bob = Math.sin(g.age * 3) * 1.5;
    polygon(
      [
        [x, y - 8 - bob],
        [x + 4, y - 3 - bob],
        [x, y + 2 - bob],
        [x - 4, y - 3 - bob],
      ],
      g.value > 3 ? "#e3c77c" : "#c5d8b0",
      "#6d9168",
    );
    ctx.fillStyle = "#e4edce";
    ctx.fillRect(x - 1, y - 6 - bob, 2, 3);
  }
  const sorted: (Enemy | typeof player)[] = [...enemies, player];
  sorted.sort((a, b) => a.y - b.y);
  for (const e of sorted) {
    if (e === player) {
      ctx.strokeStyle = "#e7dfb6";
      ctx.lineWidth = 2;
      const [x, y] = screenXY(player.x, player.y);
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 23, 10, 0, 0, TAU);
      ctx.stroke();
      if (player.invuln > 1) {
        ctx.strokeStyle = "#f4e6b7a0";
        ctx.beginPath();
        ctx.ellipse(x, y - 39, 35, 51, 0, 0, TAU);
        ctx.stroke();
      }
      sprite(
        selected,
        player.x,
        player.y,
        99,
        player.phase,
        player.face,
        player.moving,
        player.flash,
        0,
        player.lunge,
      );
    } else {
      const m = e as Enemy;
      sprite(
        m.art,
        m.x,
        m.y,
        m.size,
        m.phase,
        m.face,
        m.alive,
        m.flash,
        m.alive ? 0 : m.death,
        0,
        m.boss,
      );
    }
  }
  for (const b of bullets) {
    let [x, y] = screenXY(b.x, b.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.angle);
    if (b.type === "axe") {
      ctx.fillStyle = "#7f6147";
      ctx.fillRect(-2, -15, 4, 30);
      polygon(
        [
          [2, -13],
          [16, -11],
          [18, 0],
          [2, 5],
        ],
        "#c3cdc6",
        "#6c7e72",
      );
    } else {
      ctx.fillStyle = weaponInfo[b.type].color;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.size, b.size * 0.7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#f5f0d5";
      ctx.beginPath();
      ctx.arc(-1, -1, b.size * 0.35, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  for (const l of lightningPaths) {
    ctx.strokeStyle = "#f5e6b6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    l.points.forEach((p, i) => {
      let [x, y] = screenXY(p.x, p.y);
      if (!i) ctx.moveTo(x, y);
      else {
        let prev = l.points[i - 1],
          [px, py] = screenXY(prev.x, prev.y);
        ctx.lineTo((x + px) / 2 + 12, (y + py) / 2 - 10);
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.strokeStyle = "#8d9f71";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (const f of effects) {
    let [x, y] = screenXY(f.x, f.y);
    ctx.globalAlpha = clamp(f.life / f.max, 0, 1);
    ctx.fillStyle = f.color;
    if (f.text) {
      ctx.drawImage(numberSprite(f.text, f.color, f.size), x - 36, y - 23);
    } else ctx.fillRect(x - f.size / 2, y - f.size / 2, f.size, f.size);
  }
  ctx.globalAlpha = 1;
}
let renderedScreen: Screen | "" = "";
function frame(now: number) {
  const raw = now - lastTime || 16.67,
    dt = Math.min(0.04, raw / 1000);
  lastTime = now;
  frameMs = frameMs * 0.97 + raw * 0.03;
  fps = 1000 / frameMs;
  if (screen === "run") update(dt);
  if (
    !["levelup", "paused", "dead"].includes(screen) ||
    renderedScreen !== screen
  ) {
    render();
    renderedScreen = screen;
  }
  requestAnimationFrame(frame);
}
function resize() {
  renderedScreen = "";
  W = innerWidth;
  H = innerHeight;
  DPR = Math.min(devicePixelRatio, 1.5);
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.imageSmoothingEnabled = true;
}
addEventListener("resize", resize);
resize();
$.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("button");
  if (!el || el.hasAttribute("disabled")) return;
  if (el.dataset.hero) {
    selected = heroes.find((a) => a.id === el.dataset.hero)!;
    save.selected = selected.id;
    persist();
    title();
    return;
  }
  if (el.dataset.upgrade !== undefined) {
    choose(Number(el.dataset.upgrade));
    return;
  }
  if (el.dataset.buy) {
    const m = metaInfo.find((m) => m.id === el.dataset.buy)!;
    const cost = Math.round(m.base * Math.pow(1.65, save.meta[m.id]));
    if (save.gold >= cost && save.meta[m.id] < m.max) {
      save.gold -= cost;
      save.meta[m.id]++;
      persist();
      shop();
      notify(m.name + " awakened.");
    }
    return;
  }
  switch (el.dataset.action) {
    case "title":
      title();
      break;
    case "shop":
      shop();
      break;
    case "start":
      startRun();
      break;
    case "unlock":
      unlock();
      break;
    case "confirm-unlock":
      if (unlockTarget) {
        const cost = heroPrices[heroes.indexOf(unlockTarget)];
        if (save.gold >= cost && !save.unlocked.includes(unlockTarget.id)) {
          save.gold -= cost;
          save.unlocked.push(unlockTarget.id);
          persist();
          title();
          notify(unlockTarget.name + " has joined your journey.");
        }
      }
      break;
    case "pause":
    case "resume":
      pause();
      break;
    case "retreat":
      finishRun();
      break;
  }
});
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k))
    e.preventDefault();
  if (e.repeat) return;
  keys.add(k);
  if (k === "escape") pause();
  if (screen === "levelup" && ["1", "2", "3"].includes(k))
    choose(Number(k) - 1);
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
addEventListener("blur", () => {
  keys.clear();
  joy.x = joy.y = 0;
  if (screen === "run") pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && screen === "run") pause();
});
const joystick = document.querySelector<HTMLElement>("#joystick")!,
  knob = joystick.firstElementChild as HTMLElement;
function joystickMove(e: PointerEvent) {
  let r = joystick.getBoundingClientRect(),
    dx = e.clientX - r.left - r.width / 2,
    dy = e.clientY - r.top - r.height / 2,
    d = Math.hypot(dx, dy);
  if (d > 36) {
    dx *= 36 / d;
    dy *= 36 / d;
  }
  joy.x = dx / 36;
  joy.y = dy / 36;
  knob.style.transform = `translate(${dx}px,${dy}px)`;
}
joystick.addEventListener("pointerdown", (e) => {
  if (screen !== "run") return;
  joy.active = true;
  joy.id = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  joystickMove(e);
  e.preventDefault();
});
joystick.addEventListener("pointermove", (e) => {
  if (joy.active && e.pointerId === joy.id) joystickMove(e);
});
function releaseJoy() {
  joy.active = false;
  joy.x = joy.y = 0;
  knob.style.transform = "";
}
joystick.addEventListener("pointerup", releaseJoy);
joystick.addEventListener("pointercancel", releaseJoy);
async function init() {
  try {
    art = await (await fetch("manifest.json")).json();
    heroes = art
      .filter((a) => a.role === "hero")
      .sort(
        (a, b) =>
          [112, 28, 30, 44, 80, 1].indexOf(Number(a.id.slice(1))) -
          [112, 28, 30, 44, 80, 1].indexOf(Number(b.id.slice(1))),
      );
    enemiesArt = art.filter((a) => a.role === "enemy");
    eliteArt = art.filter((a) => a.role === "elite");
    await Promise.all(
      art
        .filter((a) => a.role !== "reserve")
        .map(
          (a) =>
            new Promise<void>((resolve, reject) => {
              const im = new Image();
              im.onload = () => {
                images.set(a.id, im);
                const c = document.createElement("canvas");
                c.width = im.width;
                c.height = im.height;
                const x = c.getContext("2d")!;
                x.drawImage(im, 0, 0);
                x.globalCompositeOperation = "source-in";
                x.fillStyle = "white";
                x.fillRect(0, 0, c.width, c.height);
                whiteImages.set(a.id, c);
                if (a.role !== "hero") makeAtlas(a, im, c);
                resolve();
              };
              im.onerror = () => reject(new Error("Missing sprite " + a.id));
              im.src = a.src;
            }),
        ),
    );
    selected = heroes.find((a) => a.id === save.selected) || heroes[0];
    title();
    requestAnimationFrame(frame);
  } catch (e) {
    $.innerHTML = `<div class="screen"><h1>The Hollow couldn't awaken.</h1><p>Please refresh to retry loading the local art.</p></div>`;
    console.error(e);
  }
}
// Inspection only is always available. Mutating helpers are opt-in for automated QA.
(window as any).__hollowmere = {
  snapshot: () => ({
    screen,
    time: run.time,
    kills: run.kills,
    level: run.level,
    hp: player.hp,
    gold: save.gold,
    runGold: run.gold,
    enemies: enemies.filter((e) => e.alive).length,
    bullets: bullets.length,
    gems: gems.length,
    fps: Math.round(fps),
    frameMs: Math.round(frameMs * 100) / 100,
    player: { x: player.x, y: player.y },
    weapons: { ...weapons },
    meta: { ...save.meta },
    bosses: enemies.filter((e) => e.boss && e.alive).length,
    pooled: enemyPool.length,
  }),
};
if (new URLSearchParams(location.search).has("qa"))
  Object.assign((window as any).__hollowmere, {
    levelUp,
    grantGold: (amount: number) => {
      save.gold += amount;
      persist();
      if (screen === "shop") shop();
    },
    stress: (count = 350) => {
      for (let i = enemies.filter((e) => e.alive).length; i < count; i++)
        spawnEnemy(false, rand(180, 630));
      grid.build(enemies);
    },
    boss: () => {
      spawnEnemy(true, 230);
      grid.build(enemies);
    },
    loadout: () => {
      for (const k of weaponKeys) weapons[k] = 3;
      run.damage = 2;
      run.magnet = 200;
      hud();
    },
    benchmark: () => {
      run.need = 1000000;
      player.invuln = 1000;
    },
    heal: () => {
      player.hp = player.max;
      player.invuln = 3;
    },
    kill: () => {
      player.hp = 0;
      finishRun();
    },
  });
init();
