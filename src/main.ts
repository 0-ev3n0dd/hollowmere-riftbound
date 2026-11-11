import "./style.css";
import {
  VERSION,
  SPELLS as weaponInfo,
  WEAPON_KEYS as weaponKeys,
  PASSIVES,
  PASSIVE_KEYS,
  EVOLUTIONS,
  META as metaInfo,
  emptyWeapons,
  emptyPassives,
  talentTrees,
  talentReason,
  buyTalent,
  refundTalent,
  treeSpent,
  totalSpent,
  earnedPoints,
  talentThreshold,
  talentEffects,
  loadSave,
  type Weapon,
  type Passive,
  type Save,
  type TalentNode,
  type TalentTree,
} from "./progression";

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
type Screen =
  | "title"
  | "shop"
  | "talents"
  | "run"
  | "levelup"
  | "paused"
  | "dead"
  | "unlock";
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
let save: Save;
try {
  save = loadSave(localStorage);
} catch {
  save = loadSave({ getItem: () => null });
}
function persist() {
  try {
    localStorage.setItem("hollowmere-v2", JSON.stringify(save));
  } catch {
    notify("Storage is unavailable. This session will still work.");
  }
}
const heroPrices = [0, 120, 180, 260, 360, 480];
function money() {
  return `<div class="coins"><span class="coin">◇</span> ${Math.floor(save.gold).toLocaleString()} <span class="subtle">gold</span></div>`;
}
function topbar(active: string) {
  return `<header class="topbar"><div class="brand"><span class="brandmark">◈</span><div><strong>HOLLOWMERE</strong><small>R I F T B O U N D</small></div></div><nav class="nav"><button data-action="title" class="${active === "title" ? "active" : ""}">Expedition</button><button data-action="shop" class="${active === "shop" ? "active" : ""}">Sanctum</button><button data-action="talents" class="${active === "talents" ? "active" : ""}">Talents</button>${money()}</nav></header>`;
}
function title() {
  screen = "title";
  document.body.classList.remove("playing");
  const owned = save.unlocked.includes(selected.id),
    wi = weaponInfo[selected.weapon as Weapon];
  $.innerHTML = `<section class="screen">${topbar("title")}<div class="intro"><div class="intro-copy"><div class="eyebrow">An endless little adventure</div><h1>One soul.<br><em>Endless night.</em></h1><p>The rift is open. Stand against the wilds, gather forgotten power, and return stronger with every fall.</p><button class="primary" data-action="${owned ? "start" : "unlock"}">${owned ? "Enter the Hollow" : "Unlock " + selected.name}<span>↗</span></button><div class="minor">${owned ? "WASD to move · Weapons strike automatically" : `◇ ${heroPrices[heroes.indexOf(selected)]} gold · A new path awaits`}</div></div><div class="hero-stage"><div class="halo"></div><div class="pedestal"></div><img class="stage-sprite" src="${selected.src}" alt="${selected.name}, ${selected.title}"><div class="hero-label"><small>YOUR CHOSEN SOUL</small><strong>${selected.name}</strong><small>${selected.title.toUpperCase()}</small><small>${wi.glyph} ${wi.name}</small></div><span class="hero-number">0${heroes.indexOf(selected) + 1}</span></div></div><div class="roster-header"><span class="sectionlabel">CHOOSE YOUR WANDERER</span><span class="subtle">${save.unlocked.length} / ${heroes.length} unlocked · Every soul plays differently</span></div><div class="roster">${heroes.map((a, i) => `<button class="hero-card ${a.id === selected.id ? "selected" : ""} ${save.unlocked.includes(a.id) ? "" : "locked"}" data-hero="${a.id}" aria-label="Select ${a.name}"><img src="${a.src}" alt=""><div class="cardtext"><b>${a.name}</b><small>${a.title}</small></div><span class="badge">${save.unlocked.includes(a.id) ? (a.id === selected.id ? "● Selected" : "Available") : "◇ " + heroPrices[i]}</span></button>`).join("")}</div><footer class="footnote"><span>PROGRESSION ${VERSION} · SINGLE PLAYER · SAVED ON THIS DEVICE</span><span>Best ${formatTime(save.best)} · ${save.runs} expeditions</span></footer></section>`;
}
let shopFilter = "All",
  talentHeroId = "c112",
  inspectedTalent = "";
function shop() {
  screen = "shop";
  document.body.classList.remove("playing");
  $.innerHTML = `<section class="screen sanctum-screen">${topbar("shop")}<div class="shop-title"><div class="eyebrow">18 lasting blessings · One stronger tomorrow</div><h1>The quiet between storms.</h1><p>Gold strengthens every wanderer. Talent mastery belongs to each soul.</p></div><div class="talent-callout"><span>◈</span><div><b>Grow beyond gold.</b><small>18 hero-specific trees · 51 earned points per hero · Free respecs</small></div><button class="secondary" data-action="talents">Explore talents ↗</button></div><div class="shop-filters">${["All", "Power", "Endurance", "Fortune", "Drafting"].map((k) => `<button data-filter="${k}" class="${shopFilter === k ? "active" : ""}">${k}</button>`).join("")}</div><div class="shop-grid">${metaInfo
    .filter((m) => shopFilter === "All" || m.group === shopFilter)
    .map((m) => {
      const rank = save.meta[m.id],
        cost = Math.round(m.base * 1.65 ** rank);
      return `<article class="shop-card"><div class="shop-icon">${m.icon}<small>${rank}/${m.max}</small></div><h3>${m.name}</h3><p>${m.desc}</p><div class="ranks">${Array.from({ length: m.max }, (_, i) => `<i class="${i < rank ? "on" : ""}"></i>`).join("")}</div><button class="buy" data-buy="${m.id}" ${rank >= m.max || save.gold < cost ? "disabled" : ""}><span>${rank >= m.max ? "Awakened" : "Awaken"}</span><span>${rank >= m.max ? "✓" : "◇ " + cost}</span></button></article>`;
    })
    .join(
      "",
    )}</div><footer class="footnote"><span>V${VERSION} · SAFE SAVE MIGRATION · NO PURCHASES</span><span>Gold and talents save automatically</span></footer></section>`;
}
function talents() {
  screen = "talents";
  document.body.classList.remove("playing");
  const hero = heroes.find((h) => h.id === talentHeroId) || selected;
  talentHeroId = hero.id;
  const p = save.heroes[hero.id],
    trees = talentTrees(hero.id),
    earned = earnedPoints(p.xp),
    spent = totalSpent(p),
    next = talentThreshold(earned + 1),
    prev = talentThreshold(earned);
  let tree =
      trees.find((t) => t.nodes.some((n) => n.id === inspectedTalent)) ||
      trees[0],
    node = tree.nodes.find((n) => n.id === inspectedTalent) || tree.nodes[0];
  inspectedTalent = node.id;
  const reason = talentReason(tree, node, p),
    rank = p.spent[node.id] || 0;
  $.innerHTML = `<section class="screen talents-screen">${topbar("talents")}<header class="talent-heading"><div><div class="eyebrow">The soul remembers</div><h1>Make your own legend.</h1><p>Earn talent XP from survival, kills, and rift lords. Each hero keeps their own 51-point journey.</p></div><button class="secondary" data-action="respec" ${spent ? "" : "disabled"}>↶ Free respec</button></header><div class="talent-heroes">${heroes.map((h) => `<button class="${h.id === hero.id ? "active" : ""}" data-talenthero="${h.id}"><img src="${h.src}" alt=""><span>${h.name}<small>${earnedPoints(save.heroes[h.id].xp)} / 51 earned</small></span></button>`).join("")}</div><div class="mastery-bar"><div><b>${hero.name}</b><span>${earned - spent} unspent / ${earned} earned · ${spent} allocated</span></div><div class="mastery-track"><i style="width:${earned === 51 ? 100 : Math.max(0, Math.min(100, ((p.xp - prev) / (next - prev)) * 100))}%"></i></div><small>${earned === 51 ? "51 / 51 · Mastery complete" : `${Math.floor(p.xp).toLocaleString()} talent XP · next point at ${next.toLocaleString()}`}</small></div><div class="talent-grid">${trees
    .map(
      (t) =>
        `<article class="talent-tree" style="--tree:${t.color}"><header><span>${t.glyph}</span><div><h3>${t.name}</h3><small>${treeSpent(t, p)} points · Rows every 5 earlier points</small></div></header>${[
          0, 5, 10, 15, 20, 25, 30,
        ]
          .map((row) => {
            const nodes = t.nodes.filter((n) => n.row === row);
            return `<div class="talent-row ${nodes.length > 1 ? "fork-row" : ""}"><span class="row-label">${row === 0 ? "ROOT" : row + " PT"}</span>${nodes
              .map((n) => {
                const r = p.spent[n.id] || 0,
                  why = talentReason(t, n, p),
                  blocked = why.startsWith("Spend") || why.startsWith("Choose");
                return `<button data-talent="${n.id}" class="talent-node ${r ? "invested" : ""} ${blocked ? "gated" : ""} ${n.kind !== "stat" ? "special " + n.kind : ""} ${inspectedTalent === n.id ? "inspected" : ""}" title="${n.name}: ${n.desc} Rank ${r}/${n.max}. ${why}"><span class="node-symbol">${n.kind === "capstone" ? "✺" : n.kind === "milestone" ? "✦" : n.choice ? "◇" : "•"}</span><span><b>${n.name}</b><small>${n.kind === "capstone" ? "CAPSTONE" : n.kind === "milestone" ? "MILESTONE" : n.choice ? "CHOOSE ONE" : "TALENT"}</small></span><em>${r}/${n.max}</em></button>`;
              })
              .join("")}</div>`;
          })
          .join("")}</article>`,
    )
    .join(
      "",
    )}</div><aside class="talent-inspector" role="status"><div><span class="eyebrow">${tree.name} · ${node.row === 0 ? "Root" : node.row + " point row"} · Rank ${rank}/${node.max}</span><h3>${node.name}</h3><p>${node.desc}</p><small>${reason || "Ready to learn. Changes apply to your next expedition."}</small></div><div class="talent-controls"><button class="primary" data-talent-buy="${node.id}" ${reason ? "disabled" : ""}>Learn +1</button><button class="secondary" data-talent-refund="${node.id}" ${rank ? "" : "disabled"}>Refund −1</button></div></aside></section>`;
}
function locateTalent(
  id: string,
): { tree: TalentTree; node: TalentNode } | undefined {
  for (const tree of talentTrees(talentHeroId)) {
    const node = tree.nodes.find((n) => n.id === id);
    if (node) return { tree, node };
  }
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
  slow: number;
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
  maxLife: number;
  returning: boolean;
  target?: Enemy;
  targetCd: number;
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
function makeRun() {
  return {
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
    armor: 0,
    crit: 0,
    luck: 0,
    xpGain: 1,
    goldGain: 1,
    force: 1,
    duration: 1,
    amount: 0,
    healKill: 0,
    signatureDamage: 1,
    signatureCasts: 0,
    healCd: 0,
    forkCd: 0,
    talentXP: 0,
  };
}
let qaFreezeProgression = false;
let run = makeRun(),
  weapons = emptyWeapons(),
  cooldowns = emptyWeapons(),
  passives = emptyPassives(),
  evolved = new Set<Weapon>(),
  talentBonus: Record<string, number> = {},
  draftCharges = { reroll: 2, skip: 1, banish: 1 },
  banished = new Set<string>(),
  banishMode = false,
  pendingDrafts = 0;
function recalculateStats(fullHeal = false) {
  const old = player.max,
    b = talentBonus;
  player.max = 120 + save.meta.hp * 15 + passives.vitality * 20 + (b.hp || 0);
  player.hp = fullHeal
    ? player.max
    : Math.min(player.max, player.hp + Math.max(0, player.max - old));
  player.speed =
    155 *
    (1 + save.meta.speed * 0.05) *
    (1 + passives.swiftness * 0.07 + (b.speed || 0));
  run.damage =
    1 +
    save.meta.damage * 0.08 +
    passives.power * 0.1 +
    passives.amount * 0.03 +
    (b.damage || 0);
  run.signatureDamage = 1 + (b.signatureDamage || 0);
  run.cooldown =
    1 + save.meta.haste * 0.05 + passives.haste * 0.08 + (b.haste || 0);
  run.area = 1 + save.meta.area * 0.06 + passives.area * 0.12 + (b.area || 0);
  run.magnet =
    82 * (1 + save.meta.magnet * 0.2 + passives.reach * 0.25 + (b.magnet || 0));
  run.regen = save.meta.regen * 0.2 + passives.regen * 0.35 + (b.regen || 0);
  run.armor = save.meta.armor + passives.armor + (b.armor || 0);
  run.crit = Math.min(0.8, passives.crit * 0.05 + (b.crit || 0));
  run.luck = save.meta.luck * 0.08 + passives.luck * 0.08 + (b.luck || 0);
  run.xpGain =
    1 + save.meta.wisdom * 0.08 + passives.wisdom * 0.1 + (b.xp || 0);
  run.goldGain =
    1 + save.meta.gold * 0.1 + passives.fortune * 0.12 + (b.gold || 0);
  run.force = 1 + save.meta.force * 0.15 + passives.force * 0.2;
  run.duration = 1 + save.meta.duration * 0.1 + passives.duration * 0.18;
  run.amount = Math.ceil(passives.amount / 2);
  run.healKill = passives.leech * 0.2;
}
function signature(k: Weapon) {
  return k === selected.weapon;
}
function twin(k: Weapon) {
  return signature(k) && !!talentBonus.t0_capstone_30;
}
function spellHit(e: Enemy, n: number, k: Weapon, kx = 0, ky = 0) {
  if (!e.alive) return;
  const sig = signature(k);
  if (sig) n *= run.signatureDamage;
  if (
    (sig && talentBonus.t1_milestone_10) ||
    k === "frost" ||
    (k === "axe" && evolved.has("axe"))
  )
    e.slow = 1.5;
  if (sig && talentBonus.t1_milestone_20 && run.time >= run.healCd) {
    player.hp = Math.min(player.max, player.hp + 0.35);
    run.healCd = run.time + 0.12;
  }
  if (sig && talentBonus.t2_milestone_20 && run.time >= run.forkCd) {
    run.forkCd = run.time + 0.2;
    const skip = new Set<Enemy>([e]),
      other = nearest(e.x, e.y, 135, skip);
    if (other) {
      damage(other, n * 0.35);
      lightningPaths.push({
        points: [
          { x: e.x, y: e.y - 25 },
          { x: other.x, y: other.y - 25 },
        ],
        life: 0.12,
      });
    }
  }
  damage(e, n, kx * run.force, ky * run.force);
}
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
  run = makeRun();
  qaFreezeProgression = false;
  run.level = 1 + save.meta.start;
  run.need = Math.floor(8 + run.level * 3.4);
  weapons = emptyWeapons();
  weapons[selected.weapon as Weapon] = 1;
  cooldowns = emptyWeapons();
  passives = emptyPassives();
  evolved = new Set();
  banished = new Set();
  banishMode = false;
  pendingDrafts = save.meta.start;
  draftCharges = {
    reroll: 2 + save.meta.reroll,
    skip: 1 + save.meta.skip,
    banish: 1 + save.meta.banish,
  };
  talentBonus = talentEffects(selected.id, save.heroes[selected.id]);
  recalculateStats(true);
  zones.length = 0;
  lightningPaths.length = 0;
  spawnTimer = 0;
  nextBoss = 180;
  cam = { x: 0, y: 0 };
  for (let i = 0; i < 25; i++) spawnEnemy(false, rand(220, 600));
  hud();
  banner("The Hollow stirs", "EXPEDITION BEGINS");
  if (pendingDrafts > 0) levelUp();
}
function banner(text: string, sub = "THE RIFT GROWS RESTLESS") {
  bannerText = `<small>${sub}</small>${text}`;
  bannerTimer = 3;
}
function hud() {
  if (screen !== "run") return;
  const spells = weaponKeys.filter((k) => weapons[k]),
    ps = PASSIVE_KEYS.filter((k) => passives[k]);
  $.innerHTML = `<section class="hud"><div class="xp-bar"><div class="xp-fill" style="width:${Math.min(100, (run.xp / run.need) * 100)}%"></div></div><div class="hud-top"><div class="player-panel"><div class="player-name">${selected.name}<small>LEVEL ${run.level}</small></div><div class="hp-track"><div class="hp-fill" style="width:${(player.hp / player.max) * 100}%"></div></div><div class="hp-text"><span>${Math.ceil(player.hp)} / ${player.max} vitality</span><span>${Math.floor(run.xp)} / ${run.need} XP</span></div></div><div class="time-panel"><b>${formatTime(run.time)}</b><small>WAVE ${Math.floor(run.time / 30) + 1} · RIFT LORD IN ${formatTime(nextBoss - run.time)}</small></div><div class="run-resources"><span class="coin">◇</span><b>${Math.floor(run.gold)}</b><span class="sep">/</span><span>⚔ ${run.kills}</span><button class="pause" data-action="pause" aria-label="Pause">Ⅱ</button></div></div><div class="hud-bottom"><div class="loadout"><div class="loadout-label">SPELLS ${spells.length}/6</div><div class="weaponbar">${Array.from(
    { length: 6 },
    (_, i) => {
      const k = spells[i];
      return k
        ? `<div class="weapon-slot ${evolved.has(k) ? "evolved" : ""}" title="${evolved.has(k) ? EVOLUTIONS[k]!.name : weaponInfo[k].name} level ${weapons[k]}/${weaponInfo[k].max}"><span class="glyph">${weaponInfo[k].glyph}</span><small>${evolved.has(k) ? "EVOLVED" : "LV " + weapons[k]}</small><span class="dots">${"•".repeat(weapons[k])}</span></div>`
        : '<div class="weapon-slot empty"><span>+</span></div>';
    },
  ).join(
    "",
  )}</div><div class="loadout-label passive-label">PASSIVES ${ps.length}/6</div><div class="passivebar">${Array.from(
    { length: 6 },
    (_, i) => {
      const k = ps[i];
      return k
        ? `<div class="passive-slot" title="${PASSIVES[k].name} ${passives[k]}/5"><span>${PASSIVES[k].glyph}</span><small>${passives[k]}</small></div>`
        : '<div class="passive-slot empty">·</div>';
    },
  ).join(
    "",
  )}</div></div><div class="run-hint">V${VERSION} · WASD / ARROWS MOVE · ESC PAUSE</div></div>${bannerTimer > 0 ? `<div class="banner">${bannerText}</div>` : ""}</section>`;
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
    slow: 0,
  });
  enemies.push(e);
}
function damage(e: Enemy, n: number, kx = 0, ky = 0) {
  if (!e.alive) return;
  if (Math.random() < run.crit) n *= 2;
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
    player.hp = Math.min(player.max, player.hp + run.healKill);
    const gain = (e.boss ? 40 : e.elite ? 5 : 1) * run.goldGain;
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
  if (bullets.length >= 240) return;
  life *= run.duration;
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
    maxLife: life,
    returning: false,
    target: undefined,
    targetCd: 0,
  });
  bullets.push(b);
}
let lightningPaths: { points: { x: number; y: number }[]; life: number }[] = [];
type Zone = {
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
  timer: number;
  damage: number;
  type: Weapon;
  triggered: boolean;
};
let zones: Zone[] = [];
function addZone(
  type: Weapon,
  x: number,
  y: number,
  r: number,
  damage: number,
  life: number,
  delay = 0,
) {
  if (zones.length >= 32) return;
  zones.push({
    x,
    y,
    r,
    damage,
    life,
    max: life,
    timer: delay,
    type,
    triggered: false,
  });
}
function pulse(
  x: number,
  y: number,
  r: number,
  n: number,
  k: Weapon,
  push = 0,
) {
  grid.query(x, y, r, (e) => {
    const dx = e.x - x,
      dy = e.y - y,
      d = Math.hypot(dx, dy) || 1;
    if (d < r) spellHit(e, n, k, (dx / d) * push, (dy / d) * push);
  });
}
function orbitPositions(k: Weapon) {
  const lv = weapons[k],
    sig = signature(k),
    bonus = sig && talentBonus.t0_milestone_10 ? 1 : 0,
    isBlade = k === "blade",
    count =
      (isBlade ? 1 + Math.floor((lv + 1) / 2) : 2 + Math.floor(lv / 2)) +
      run.amount +
      bonus +
      (twin(k) ? 1 : 0) +
      (evolved.has(k) ? 2 : 0),
    radius =
      (isBlade ? 74 + lv * 7 : 125 + lv * 7) * run.area +
      (sig && talentBonus.t2_milestone_10 ? 30 : 0);
  return Array.from({ length: Math.min(12, count) }, (_, i) => {
    const second = isBlade && (twin(k) || evolved.has(k)) && i % 2 === 1,
      a = run.time * (2 + lv * 0.16) * (second ? -1 : 1) + (i * TAU) / count,
      r = radius * (second ? 1.22 : 1);
    return {
      x: player.x + Math.cos(a) * r,
      y: player.y + Math.sin(a) * r * 0.65,
      a,
      r,
    };
  });
}
function onCast(k: Weapon) {
  if (!signature(k)) return;
  run.signatureCasts++;
  if (talentBonus.t0_milestone_20 && run.signatureCasts % 4 === 0) {
    pulse(
      player.x,
      player.y,
      145 * run.area,
      (12 + weapons[k] * 5) * run.damage,
      k,
      70,
    );
    addZone("chime", player.x, player.y, 145 * run.area, 0, 0.35);
  }
  if (talentBonus.t1_capstone_30) {
    pulse(player.x, player.y, 100 * run.area, 16 * run.damage, k, 40);
    player.hp = Math.min(player.max, player.hp + 2);
    addZone("aura", player.x, player.y, 100 * run.area, 0, 0.35);
  }
  if (talentBonus.t2_capstone_30 && run.signatureCasts % 4 === 0)
    for (let i = 0; i < 8; i++)
      projectile(
        "raven",
        player.x,
        player.y - 15,
        (i * TAU) / 8,
        240,
        18 * run.damage,
        2.4,
        7,
        2,
      );
}
function attack(dt: number) {
  for (const k of weaponKeys) {
    const lv = weapons[k];
    if (!lv) continue;
    cooldowns[k] -= dt;
    const sig = signature(k),
      extra = run.amount + (sig && talentBonus.t0_milestone_10 ? 1 : 0),
      ascend = twin(k),
      evo = evolved.has(k),
      pierce =
        1 + Math.floor(lv / 2) + (sig && talentBonus.t2_milestone_10 ? 2 : 0);
    if (k === "blade" || k === "tempest") {
      for (const o of orbitPositions(k))
        grid.query(o.x, o.y, 31, (e) => {
          if (
            e.hitCd <= 0 &&
            Math.hypot(e.x - o.x, e.y - o.y) < 30 + (e.boss ? 16 : 0)
          ) {
            spellHit(
              e,
              (k === "blade" ? 10 + lv * 5 : 12 + lv * 5) * run.damage,
              k,
              Math.cos(o.a) * 85,
              Math.sin(o.a) * 85,
            );
            e.hitCd = 0.28 / run.cooldown;
            player.lunge = 0.12;
          }
        });
      if (cooldowns[k] <= 0) {
        onCast(k);
        cooldowns[k] = 0.9 / run.cooldown;
      }
      continue;
    }
    if (cooldowns[k] > 0) continue;
    const e = nearest(player.x, player.y, 650);
    if (!e && k !== "aura" && k !== "mine" && k !== "thorn" && k !== "chime") {
      cooldowns[k] = 0.15;
      continue;
    }
    onCast(k);
    let cadence = weaponInfo[k].cadence;
    if (k === "aura") {
      let r = (72 + lv * 13) * run.area;
      if (sig && talentBonus.t2_milestone_10) r += 35;
      pulse(
        player.x,
        player.y,
        r,
        (5 + lv * 4 + extra * 2) * run.damage,
        k,
        12,
      );
      if (evo || ascend) {
        pulse(player.x, player.y, r * 1.45, (3 + lv * 2) * run.damage, k, 15);
        addZone("aura", player.x, player.y, r * 1.45, 0, 0.4);
        if (evo) player.hp = Math.min(player.max, player.hp + 1.5);
      }
    } else if (k === "lightning") {
      const hit = new Set<Enemy>(),
        points = [{ x: player.x, y: player.y - 35 }];
      let target = e,
        last = e;
      for (
        let i = 0;
        i < 2 + lv + extra + (evo ? 4 : 0) + (ascend ? 2 : 0) && target;
        i++
      ) {
        hit.add(target);
        points.push({ x: target.x, y: target.y - target.size * 0.45 });
        spellHit(target, (16 + lv * 6) * run.damage, k);
        last = target;
        target = nearest(
          target.x,
          target.y,
          200 + (sig && talentBonus.t2_milestone_10 ? 65 : 0),
          hit,
        );
      }
      if (hit.size) lightningPaths.push({ points, life: 0.23 });
      if (evo && last) {
        pulse(last.x, last.y, 105 * run.area, 18 * run.damage, k, 25);
        addZone("chime", last.x, last.y, 105 * run.area, 0, 0.3);
      }
      cadence = Math.max(0.7, 2.1 - lv * 0.12);
    } else if (k === "comet") {
      addZone(
        k,
        e!.x,
        e!.y,
        (65 + lv * 8) * run.area,
        (28 + lv * 12) * run.damage,
        0.85,
        0.55,
      );
    } else if (k === "venom") {
      addZone(
        k,
        e!.x,
        e!.y,
        (50 + lv * 6) * run.area,
        (5 + lv * 3) * run.damage,
        (3 + lv * 0.25) * run.duration,
        0,
      );
    } else if (k === "mine") {
      addZone(
        k,
        player.x + rand(-40, 40),
        player.y + rand(-30, 30),
        (65 + lv * 6) * run.area,
        (25 + lv * 10) * run.damage,
        7 * run.duration,
        0.65,
      );
    } else if (k === "chime") {
      pulse(
        player.x,
        player.y,
        (125 + lv * 12) * run.area,
        (12 + lv * 6) * run.damage,
        k,
        140,
      );
      addZone(k, player.x, player.y, (125 + lv * 12) * run.area, 0, 0.5);
    } else if (k === "fissure") {
      const dx = e!.x - player.x,
        dy = e!.y - player.y,
        d = Math.hypot(dx, dy) || 1,
        nx = dx / d,
        ny = dy / d,
        length = 450 + lv * 20;
      grid.query(player.x, player.y, length, (o) => {
        const ox = o.x - player.x,
          oy = o.y - player.y,
          along = ox * nx + oy * ny;
        if (
          along > 0 &&
          along < length &&
          Math.abs(ox * ny - oy * nx) < (20 + lv * 4) * run.area
        )
          spellHit(o, (18 + lv * 8) * run.damage, k, nx * 50, ny * 50);
      });
      lightningPaths.push({
        points: [
          { x: player.x, y: player.y },
          { x: player.x + nx * length, y: player.y + ny * length },
        ],
        life: 0.3,
      });
    } else if (k === "thorn") {
      const count = Math.min(16, 6 + lv + extra);
      for (let i = 0; i < count; i++)
        projectile(
          k,
          player.x,
          player.y - 10,
          (i * TAU) / count + run.time,
          240,
          (12 + lv * 4) * run.damage,
          1.9,
          8,
          pierce,
        );
    } else {
      const units = k === "familiar" ? (evo ? 3 : ascend ? 2 : 1) : 1;
      for (let u = 0; u < units; u++) {
        let x = player.x,
          y = player.y - 20;
        if (k === "familiar") {
          x += Math.cos(run.time * 1.6 + (u * TAU) / units) * 60;
          y -= 25 + Math.sin(run.time * 1.6 + (u * TAU) / units) * 20;
        }
        let angle = Math.atan2(e!.y - 15 - y, e!.x - x),
          count =
            k === "ember"
              ? 3 + Math.floor(lv / 2) + extra
              : k === "raven"
                ? 2 + Math.floor(lv / 2) + extra
                : k === "axe"
                  ? 1 + Math.floor(lv / 2) + extra
                  : 1 + Math.floor((lv - 1) / 3) + extra;
        if (ascend && k === "bolt") count += 2;
        count = Math.min(8, count);
        for (let i = 0; i < count; i++) {
          const spread = k === "ember" ? 0.21 : 0.14;
          projectile(
            k,
            x,
            y,
            angle + (i - (count - 1) / 2) * spread,
            k === "lance" ? 550 : k === "axe" || k === "scythe" ? 235 : 350,
            (k === "axe"
              ? 20 + lv * 5
              : k === "lance"
                ? 20 + lv * 7
                : 13 + lv * 5) * run.damage,
            k === "lance" ? 1.4 : k === "axe" || k === "scythe" ? 2.8 : 1.8,
            k === "axe" || k === "scythe" ? 16 : k === "lance" ? 11 : 8,
            k === "lance" ? 5 + lv : k === "axe" || k === "scythe" ? 5 : pierce,
          );
        }
      }
    }
    cooldowns[k] = cadence / run.cooldown;
    player.lunge = 0.15;
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
    e.slow = Math.max(0, e.slow - dt);
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
    const speed =
      e.speed *
      (e.boss ? 1 + Math.sin(run.time) * 0.25 : 1) *
      (e.slow > 0 ? 0.6 : 1);
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
      const taken = Math.max(1, (e.boss ? 24 : e.elite ? 12 : 7) - run.armor);
      player.hp -= taken;
      player.invuln = 0.72;
      player.flash = 0.2;
      fx(player.x, player.y - 75, "-" + Math.round(taken), "#a84336", 20);
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
  for (const z of zones) {
    z.life -= dt;
    z.timer -= dt;
    if (z.damage > 0 && z.timer <= 0) {
      if (z.type === "venom") {
        pulse(z.x, z.y, z.r, z.damage, z.type);
        z.timer = 0.6;
      } else if (z.type === "comet" && !z.triggered) {
        pulse(z.x, z.y, z.r, z.damage, z.type, 90);
        z.triggered = true;
        z.life = 0.3;
      } else if (z.type === "mine" && !z.triggered) {
        const target = nearest(z.x, z.y, 50);
        if (target) {
          pulse(z.x, z.y, z.r, z.damage, z.type, 100);
          z.triggered = true;
          z.life = 0.3;
        }
      }
    }
  }
  zones = zones.filter((z) => z.life > 0);
  for (const b of bullets) {
    b.life -= dt;
    if (b.life <= 0) continue;
    if (
      b.type === "familiar" ||
      b.type === "raven" ||
      (signature(b.type) && !!talentBonus.t2_milestone_10) ||
      (b.type === "bolt" && evolved.has("bolt"))
    ) {
      b.targetCd -= dt;
      if (b.targetCd <= 0 || !b.target?.alive || b.hit.has(b.target)) {
        b.target = nearest(b.x, b.y, 220, b.hit);
        b.targetCd = 0.14;
      }
      const t = b.target;
      if (t) {
        let a = Math.atan2(t.y - b.y, t.x - b.x);
        b.vx += (Math.cos(a) * 330 - b.vx) * dt * 4;
        b.vy += (Math.sin(a) * 330 - b.vy) * dt * 4;
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.angle += dt * 9;
    const returns =
      b.type === "scythe" ||
      (b.type === "axe" && (evolved.has("axe") || twin("axe")));
    if (returns && b.maxLife - b.life > 0.75) {
      if (!b.returning) {
        b.returning = true;
        b.hit.clear();
      }
      const angle = Math.atan2(player.y - 15 - b.y, player.x - b.x);
      b.vx += (Math.cos(angle) * 320 - b.vx) * dt * 5;
      b.vy += (Math.sin(angle) * 320 - b.vy) * dt * 5;
      if (Math.hypot(b.x - player.x, b.y - player.y + 15) < 15) b.life = 0;
    } else if (b.type === "axe") b.vy += dt * 75;
    grid.query(b.x, b.y, 38, (e) => {
      if (
        b.life > 0 &&
        !b.hit.has(e) &&
        Math.hypot(e.x - b.x, e.y - 18 - b.y) < (e.boss ? 40 : 25)
      ) {
        b.hit.add(e);
        spellHit(e, b.damage, b.type, b.vx * 0.18, b.vy * 0.18);
        if (b.type === "bolt" && (evolved.has("bolt") || twin("bolt"))) {
          pulse(e.x, e.y, 55 * run.area, b.damage * 0.45, b.type);
          addZone("comet", e.x, e.y, 55 * run.area, 0, 0.22);
        }
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
          if (!qaFreezeProgression) run.xp += g.value * run.xpGain;
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

type Rarity = "common" | "uncommon" | "rare" | "epic";
type Upgrade = {
  id: string;
  kind: "spell" | "passive" | "supply";
  name: string;
  glyph: string;
  desc: string;
  tier: string;
  rarity: Rarity;
  grant: number;
  apply: () => void;
};
let choices: Upgrade[] = [];
function rollRarity(): Rarity {
  const r = Math.random(),
    luck = Math.min(0.65, run.luck);
  return r < 0.045 + luck * 0.16
    ? "epic"
    : r < 0.2 + luck * 0.26
      ? "rare"
      : r < 0.49 + luck * 0.22
        ? "uncommon"
        : "common";
}
function recipeText(k: Weapon) {
  const evo = EVOLUTIONS[k];
  return evo
    ? `${weaponInfo[k].name} Lv6 + ${PASSIVES[evo.passive].name} Lv${evo.rank} → ${evo.name}.`
    : "";
}
function checkEvolutions() {
  for (const k of weaponKeys) {
    const evo = EVOLUTIONS[k];
    if (
      evo &&
      !evolved.has(k) &&
      weapons[k] >= weaponInfo[k].max &&
      passives[evo.passive] >= evo.rank
    ) {
      evolved.add(k);
      banner(evo.name, "EVOLUTION AWAKENED");
      for (let i = 0; i < 14; i++)
        fx(player.x, player.y - 25, "", "#e8cd8b", rand(3, 7));
    }
  }
}
function draftPool(): Upgrade[] {
  const pool: Upgrade[] = [],
    spellCount = weaponKeys.filter((k) => weapons[k] > 0).length,
    passiveCount = PASSIVE_KEYS.filter((k) => passives[k] > 0).length;
  for (const k of weaponKeys)
    if (
      !banished.has(k) &&
      weapons[k] < weaponInfo[k].max &&
      (weapons[k] > 0 || spellCount < 6)
    ) {
      const rarity = rollRarity(),
        grant = rarity === "epic" ? 2 : 1,
        target = Math.min(weaponInfo[k].max, weapons[k] + grant);
      pool.push({
        id: k,
        kind: "spell",
        name: evolved.has(k) ? EVOLUTIONS[k]!.name : weaponInfo[k].name,
        glyph: weaponInfo[k].glyph,
        rarity,
        grant,
        desc: weaponInfo[k].desc + " " + recipeText(k),
        tier: weapons[k]
          ? `SPELL · ${weapons[k]} → ${target} / 6`
          : `NEW SPELL · LEVEL ${target}`,
        apply: () => {
          weapons[k] = target;
          cooldowns[k] = 0;
        },
      });
    }
  for (const k of PASSIVE_KEYS)
    if (
      !banished.has(k) &&
      passives[k] < PASSIVES[k].max &&
      (passives[k] > 0 || passiveCount < 6)
    ) {
      const rarity = rollRarity(),
        grant = rarity === "epic" ? 2 : 1,
        target = Math.min(PASSIVES[k].max, passives[k] + grant);
      pool.push({
        id: k,
        kind: "passive",
        name: PASSIVES[k].name,
        glyph: PASSIVES[k].glyph,
        rarity,
        grant,
        desc: PASSIVES[k].desc,
        tier: passives[k]
          ? `PASSIVE · ${passives[k]} → ${target} / 5`
          : `NEW PASSIVE · LEVEL ${target}`,
        apply: () => {
          passives[k] = target;
          recalculateStats();
        },
      });
    }
  return pool;
}
function dealDraft() {
  const pool = draftPool();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  choices = pool.slice(0, 3);
  const supplies: Upgrade[] = [
    {
      id: "supply-gold",
      kind: "supply",
      name: "Pilgrim Purse",
      glyph: "◇",
      desc: "The slots are full. Take 35 run gold instead.",
      tier: "SUPPLY · GOLD",
      rarity: "common",
      grant: 1,
      apply: () => (run.gold += 35),
    },
    {
      id: "supply-heal",
      kind: "supply",
      name: "Restful Waters",
      glyph: "♡",
      desc: "Restore 30 vitality without taking a slot.",
      tier: "SUPPLY · RECOVERY",
      rarity: "uncommon",
      grant: 1,
      apply: () => (player.hp = Math.min(player.max, player.hp + 30)),
    },
    {
      id: "supply-xp",
      kind: "supply",
      name: "Memory Fragment",
      glyph: "◈",
      desc: "Take 10 experience without taking a slot.",
      tier: "SUPPLY · MEMORY",
      rarity: "rare",
      grant: 1,
      apply: () => (run.xp += 10),
    },
  ];
  while (choices.length < 3) choices.push(supplies[choices.length]);
}
function showDraft() {
  document.querySelector(".draft-shade")?.remove();
  const spellCount = weaponKeys.filter((k) => weapons[k]).length,
    passiveCount = PASSIVE_KEYS.filter((k) => passives[k]).length;
  $.insertAdjacentHTML(
    "beforeend",
    `<div class="modal-shade draft-shade"><section class="modal draft-modal"><div class="draft-top"><span class="eyebrow">Level ${run.level} · ${pendingDrafts ? "First Light bonus" : "A soul awakened"}</span><span class="draft-capacity">SPELLS ${spellCount}/6 <i>·</i> PASSIVES ${passiveCount}/6</span></div><h2>${banishMode ? "Sever a possibility." : "Choose your power."}</h2><p>${banishMode ? "Tap a card to banish it for this expedition, then receive a fresh draft." : "18 spells. 16 passives. A different path every time."}</p><div class="choices ${banishMode ? "banishing" : ""}">${choices.map((c, i) => `<button class="upgrade rarity-${c.rarity}" data-upgrade="${i}" data-card-id="${c.id}" ${banishMode && c.kind === "supply" ? "disabled" : ""}><div class="card-rarity">${c.rarity.toUpperCase()} <span>${c.kind === "spell" ? "✦" : "◈"}</span></div><span class="glyph">${c.glyph}</span><span class="tier">${c.tier}</span><h3>${c.name}</h3><p>${c.desc}</p><span class="choose">${banishMode ? "⊘ Banish this card" : c.rarity === "epic" ? "+2 ranks · Claim ↗" : c.rarity === "rare" ? "+12 gold · Claim ↗" : c.rarity === "uncommon" ? "+5 vitality · Claim ↗" : "Claim this blessing ↗"}</span></button>`).join("")}</div><div class="draft-actions"><button data-action="reroll" ${draftCharges.reroll ? "" : "disabled"}>⟳ Reroll <b>${draftCharges.reroll}</b></button><button data-action="skip-draft" ${draftCharges.skip ? "" : "disabled"}>↷ Skip for ◇ ${20 + run.level * 2} <b>${draftCharges.skip}</b></button><button data-action="banish" class="${banishMode ? "active" : ""}" ${draftCharges.banish && choices.some((c) => c.kind !== "supply") ? "" : "disabled"}>⊘ ${banishMode ? "Cancel banish" : "Banish"} <b>${draftCharges.banish}</b></button></div><details class="recipes"><summary>Six evolution recipes · Max spell + matching passive</summary><div>${Object.entries(
      EVOLUTIONS,
    )
      .map(
        ([key, e]) =>
          `<p><b>${e.name}</b><br>${weaponInfo[key as Weapon].name} 6 + ${PASSIVES[e.passive].name} ${e.rank}</p>`,
      )
      .join(
        "",
      )}</div></details><p class="close-hint">Time stands still. [1] [2] [3] choose · Charges renew next run. Uncommon heals 5, rare grants 12 gold, epic grants 2 ranks.</p></section></div>`,
  );
}
function levelUp() {
  screen = "levelup";
  document.body.classList.remove("playing");
  banishMode = false;
  dealDraft();
  showDraft();
}
function resumeDraft() {
  banishMode = false;
  if (pendingDrafts > 0) {
    pendingDrafts--;
    if (pendingDrafts > 0) {
      levelUp();
      return;
    }
  }
  screen = "run";
  document.body.classList.add("playing");
  hud();
}
function choose(i: number) {
  if (screen !== "levelup" || !choices[i]) return;
  const c = choices[i];
  if (banishMode) {
    if (c.kind === "supply") {
      notify("Supply cards do not occupy slots and cannot be banished.");
      return;
    }
    if (draftCharges.banish <= 0) return;
    draftCharges.banish--;
    banished.add(c.id);
    banishMode = false;
    dealDraft();
    showDraft();
    return;
  }
  c.apply();
  if (c.rarity === "uncommon") player.hp = Math.min(player.max, player.hp + 5);
  if (c.rarity === "rare") run.gold += 12;
  checkEvolutions();
  resumeDraft();
}
function draftAction(action: string) {
  if (screen !== "levelup") return;
  if (action === "reroll" && draftCharges.reroll > 0) {
    draftCharges.reroll--;
    banishMode = false;
    dealDraft();
    showDraft();
  }
  if (action === "banish" && draftCharges.banish > 0) {
    banishMode = !banishMode;
    showDraft();
  }
  if (action === "skip-draft" && draftCharges.skip > 0) {
    draftCharges.skip--;
    run.gold += 20 + run.level * 2;
    resumeDraft();
  }
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
    run.gold += Math.floor(run.time / 8) * run.goldGain;
    save.gold += Math.floor(run.gold);
    save.best = Math.max(save.best, run.time);
    save.runs++;
    run.talentXP = Math.floor(run.time * 2 + run.kills * 3 + run.bosses * 150);
    save.heroes[selected.id].xp += run.talentXP;
    run.earned = true;
    persist();
  }
  talentHeroId = selected.id;
  screen = "dead";
  document.body.classList.remove("playing");
  $.innerHTML = `<div class="modal-shade"><section class="modal" style="max-width:650px"><div class="eyebrow">The Hollow remembers</div><h2>Not the end. A beginning.</h2><p>${selected.name}'s watch is over. Your hard-earned power remains.</p><div class="statsgrid"><div class="stat"><b>${formatTime(run.time)}</b><small>SURVIVED</small></div><div class="stat"><b>${run.kills}</b><small>FOES SLAIN</small></div><div class="stat"><b>${run.level}</b><small>SOUL LEVEL</small></div><div class="stat"><b>◇ ${Math.floor(run.gold)}</b><small>GOLD EARNED</small></div></div><div class="death-buttons"><button class="primary" data-action="shop">Visit the Sanctum ↗</button><button class="secondary" data-action="talents">Spend talents</button><button class="secondary" data-action="title">Choose a wanderer</button></div><p class="close-hint">+${run.talentXP} ${selected.name} talent XP · ${earnedPoints(save.heroes[selected.id].xp) - totalSpent(save.heroes[selected.id])} unspent points · All gold saved</p></section></div>`;
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
const sparks = new Map<Weapon, HTMLCanvasElement>();
function sparkSprite(type: Weapon) {
  let c = sparks.get(type);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = 24;
  c.height = 24;
  const t = c.getContext("2d")!;
  t.fillStyle = weaponInfo[type].color;
  t.beginPath();
  t.ellipse(12, 12, 10, 7, 0, 0, TAU);
  t.fill();
  t.fillStyle = "#f5f0d5";
  t.beginPath();
  t.arc(11, 11, 3.5, 0, TAU);
  t.fill();
  sparks.set(type, c);
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
  const [x, y] = screenXY(player.x, player.y);
  if (weapons.aura) {
    const r =
      (72 + weapons.aura * 13) * run.area +
      (signature("aura") && talentBonus.t2_milestone_10 ? 35 : 0);
    ctx.fillStyle = evolved.has("aura") ? "#e9cc7e35" : "#e1d19623";
    ctx.strokeStyle = "#e7d3969c";
    ctx.lineWidth = evolved.has("aura") ? 3 : 2;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.68, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (evolved.has("aura") || twin("aura")) {
      ctx.strokeStyle = "#e4c67688";
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.45, r * 0.98, 0, 0, TAU);
      ctx.stroke();
    }
  }
  for (const k of ["blade", "tempest"] as Weapon[])
    if (weapons[k])
      for (const o of orbitPositions(k)) {
        const [bx, by] = screenXY(o.x, o.y);
        ctx.save();
        ctx.translate(bx, by - 10);
        if (k === "blade") {
          ctx.rotate(o.a + Math.PI / 4);
          polygon(
            [
              [0, -23],
              [8, -5],
              [4, 12],
              [-4, 12],
              [-6, -5],
            ],
            evolved.has(k) ? "#f5d58e" : "#e7ddbd",
            evolved.has(k) ? "#ac8945" : "#8b986f",
          );
          ctx.fillStyle = "#91714a";
          ctx.fillRect(-8, 8, 16, 4);
          ctx.fillRect(-2, 12, 4, 10);
        } else {
          ctx.fillStyle = "#d6e4bc";
          ctx.strokeStyle = "#8aab73";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#eff2d5";
          ctx.beginPath();
          ctx.arc(-2, -3, 3, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
  if (weapons.familiar) {
    const count = evolved.has("familiar") ? 3 : twin("familiar") ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const a = run.time * 1.6 + (i * TAU) / count,
        fx = x + Math.cos(a) * 60,
        fy = y - 45 + Math.sin(a) * 20;
      ctx.fillStyle = evolved.has("familiar") ? "#f3d39a" : "#d9bdd5";
      ctx.beginPath();
      ctx.arc(fx, fy, 9, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#f8ebdc";
      ctx.beginPath();
      ctx.arc(fx - 2, fy - 2, 3, 0, TAU);
      ctx.fill();
    }
  }
}
function drawZones() {
  for (const z of zones) {
    const [x, y] = screenXY(z.x, z.y),
      fade = Math.min(1, z.life / 0.3),
      r = z.type === "chime" ? z.r * (1 - z.life / z.max) : z.r;
    ctx.globalAlpha = fade;
    ctx.fillStyle =
      z.type === "venom"
        ? "#789b7040"
        : z.type === "comet"
          ? "#ecd4a544"
          : "#d8c28825";
    ctx.strokeStyle =
      z.type === "venom"
        ? "#8caa7f9c"
        : z.type === "comet"
          ? "#dbc08fb0"
          : "#b59c6c99";
    ctx.lineWidth = 2;
    if (z.type === "mine" && !z.triggered) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-12, -12, 24, 24);
      ctx.restore();
      ctx.font = "16px Georgia";
      ctx.textAlign = "center";
      ctx.fillStyle = "#927c55";
      ctx.fillText("✧", x, y + 4);
    } else {
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.65, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      if (z.type === "comet" && !z.triggered) {
        ctx.fillStyle = "#e7d5a3";
        ctx.beginPath();
        ctx.arc(x, y - z.timer * 180, 9, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
function gemBitmap(fill: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 14;
  const t = c.getContext("2d")!;
  t.fillStyle = fill;
  t.strokeStyle = "#6d9168";
  t.lineWidth = 1;
  t.beginPath();
  t.moveTo(7, 2);
  t.lineTo(11, 7);
  t.lineTo(7, 12);
  t.lineTo(3, 7);
  t.closePath();
  t.fill();
  t.stroke();
  t.fillStyle = "#e4edce";
  t.fillRect(6, 4, 2, 3);
  return c;
}
const gemImage = gemBitmap("#c5d8b0"),
  richGemImage = gemBitmap("#e3c77c");
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!["run", "levelup", "paused", "dead"].includes(screen)) {
    cam.x = Math.sin(performance.now() * 0.00003) * 80;
    cam.y = -80;
    drawGround();
    return;
  }
  drawGround();
  drawZones();
  drawWeapons();
  for (const g of gems) {
    let [x, y] = screenXY(g.x, g.y);
    if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
    const bob = Math.sin(g.age * 3) * 1.5;
    ctx.drawImage(g.value > 3 ? richGemImage : gemImage, x - 7, y - 10 - bob);
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
    if (
      !["axe", "scythe", "lance", "frost", "thorn", "raven"].includes(b.type)
    ) {
      const size = b.size * 2.4;
      ctx.drawImage(
        sparkSprite(b.type),
        x - size / 2,
        y - size / 2,
        size,
        size,
      );
      continue;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(
      b.type === "lance" || b.type === "frost" || b.type === "raven"
        ? Math.atan2(b.vy, b.vx)
        : b.angle,
    );
    if (b.type === "scythe") {
      ctx.strokeStyle = weaponInfo[b.type].color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0.1, Math.PI * 1.55);
      ctx.stroke();
    } else if (b.type === "lance") {
      polygon(
        [
          [-20, 0],
          [8, -4],
          [22, 0],
          [8, 4],
        ],
        "#c2dcd4",
        "#78988b",
      );
    } else if (b.type === "frost" || b.type === "thorn") {
      polygon(
        [
          [-12, 0],
          [0, -5],
          [14, 0],
          [0, 5],
        ],
        weaponInfo[b.type].color,
      );
    } else if (b.type === "raven") {
      polygon(
        [
          [-11, -8],
          [8, 0],
          [-11, 8],
          [0, 0],
        ],
        "#b6a8c6",
      );
    } else if (b.type === "axe") {
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
  if (el.dataset.filter) {
    shopFilter = el.dataset.filter;
    shop();
    return;
  }
  if (el.dataset.talenthero) {
    talentHeroId = el.dataset.talenthero;
    inspectedTalent = "";
    talents();
    return;
  }
  if (el.dataset.talent) {
    inspectedTalent = el.dataset.talent;
    talents();
    return;
  }
  if (el.dataset.talentBuy) {
    const found = locateTalent(el.dataset.talentBuy);
    if (found && buyTalent(found.tree, found.node, save.heroes[talentHeroId])) {
      persist();
      talents();
    }
    return;
  }
  if (el.dataset.talentRefund) {
    const found = locateTalent(el.dataset.talentRefund);
    if (found) {
      const count = refundTalent(
        found.tree,
        found.node,
        save.heroes[talentHeroId],
      );
      persist();
      talents();
      if (count > 1)
        notify(`${count} points refunded, including dependent talents.`);
    }
    return;
  }
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
    case "talents":
      talentHeroId = selected.id;
      talents();
      break;
    case "respec":
      save.heroes[talentHeroId].spent = {};
      persist();
      talents();
      notify("All points refunded. Respecs are always free.");
      break;
    case "reroll":
    case "skip-draft":
    case "banish":
      draftAction(el.dataset.action);
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
    version: VERSION,
    passives: { ...passives },
    evolved: [...evolved],
    draftCharges: { ...draftCharges },
    banished: [...banished],
    choices: choices.map((c) => ({ id: c.id, kind: c.kind, rarity: c.rarity })),
    heroProgress: structuredClone(save.heroes),
    talentBonus: { ...talentBonus },
    stats: {
      damage: run.damage,
      signatureDamage: run.signatureDamage,
      haste: run.cooldown,
      armor: run.armor,
      area: run.area,
      regen: run.regen,
      amount: run.amount,
    },
    signatureCasts: run.signatureCasts,
    orbitCount: weapons.blade ? orbitPositions("blade").length : 0,
    talentXP: run.talentXP,
    zones: zones.length,
    counts: {
      spells: weaponKeys.length,
      passives: PASSIVE_KEYS.length,
      evolutions: Object.keys(EVOLUTIONS).length,
      shop: metaInfo.length,
      talents: 144,
      trees: 18,
    },
    bosses: enemies.filter((e) => e.boss && e.alive).length,
    pooled: enemyPool.length,
  }),
};
if (new URLSearchParams(location.search).has("qa"))
  Object.assign((window as any).__hollowmere, {
    levelUp,
    grantTalentXP: (amount: number, hero = selected.id) => {
      save.heroes[hero].xp += amount;
      persist();
      if (screen === "talents") talents();
    },
    setLoadout: (
      spells: Partial<Record<Weapon, number>>,
      ps: Partial<Record<Passive, number>> = {},
    ) => {
      weapons = emptyWeapons();
      passives = emptyPassives();
      evolved = new Set<Weapon>();
      for (const [k, v] of Object.entries(spells).slice(0, 6))
        if (k in weaponInfo)
          weapons[k as Weapon] = Math.min(6, Math.max(0, Number(v)));
      for (const [k, v] of Object.entries(ps).slice(0, 6))
        if (k in PASSIVES)
          passives[k as Passive] = Math.min(5, Math.max(0, Number(v)));
      recalculateStats();
      checkEvolutions();
      if (screen === "run") hud();
    },
    draftPool: () => draftPool().map((c) => ({ id: c.id, kind: c.kind })),
    recipes: EVOLUTIONS,
    catalog: () => ({
      spells: weaponInfo,
      passives: PASSIVES,
      trees: talentTrees(selected.id),
    }),
    forceDraft: (ids: string[]) => {
      levelUp();
      const pool = draftPool();
      choices = ids
        .map((id) => pool.find((c) => c.id === id))
        .filter((c): c is Upgrade => !!c)
        .slice(0, 3);
      showDraft();
    },
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
      for (const k of weaponKeys.slice(0, 6)) weapons[k] = 3;
      run.damage = 2;
      run.magnet = 200;
      hud();
    },
    benchmark: () => {
      qaFreezeProgression = true;
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
