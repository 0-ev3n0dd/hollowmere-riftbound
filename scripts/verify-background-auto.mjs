import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  args: ["--no-sandbox"],
  // Do not let Playwright's usual anti-throttling flags mask background bugs.
  ignoreDefaultArgs: [
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
  ],
});
const report = { checks: [], errors: [], workerAssets: [], snapshots: {} };
const url =
  process.env.HOLLOWMERE_URL ||
  "http://localhost:4174/hollowmere-riftbound/?qa=1";
const check = (text) => {
  report.checks.push(text);
  console.log("PASS", text);
};
const snap = (page) => page.evaluate(() => window.__hollowmere.snapshot());
function observeErrors(page) {
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.errors.push(message.text());
  });
  page.on("response", (response) => {
    if (/background-timer.*\.js/.test(response.url()))
      report.workerAssets.push({
        url: response.url(),
        status: response.status(),
      });
  });
}
async function load(context) {
  const page = await context.newPage();
  observeErrors(page);
  await page.goto(url);
  await page.waitForSelector('[data-action="start"]');
  return page;
}
async function watchModals(page) {
  await page.evaluate(() => {
    window.__autoModals = 0;
    new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes) {
          if (
            node instanceof Element &&
            (node.matches(".draft-shade") || node.querySelector(".draft-shade"))
          )
            window.__autoModals++;
        }
    }).observe(document.querySelector("#ui"), {
      childList: true,
      subtree: true,
    });
  });
}
async function hideWithoutRAF(page) {
  return page.evaluate(() => {
    window.__originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      window.__heldRAF = callback;
      return 0;
    };
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    return window.__hollowmere.snapshot();
  });
}
async function restoreVisible(page) {
  await page.evaluate(() => {
    delete document.hidden;
    delete document.visibilityState;
    document.dispatchEvent(new Event("visibilitychange"));
    window.requestAnimationFrame = window.__originalRAF;
    if (window.__heldRAF) window.requestAnimationFrame(window.__heldRAF);
  });
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await load(context);
  expect((await snap(page)).settings).toEqual({
    autoUpgrade: false,
    autoPreference: "balanced",
  });
  await page.click('[data-action="start"]');
  await page.evaluate(() => window.__hollowmere.benchmark());
  await page.keyboard.down("d");
  await page.waitForTimeout(120);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  const blurred = await snap(page);
  await page.waitForTimeout(350);
  const afterBlur = await snap(page);
  expect(afterBlur.screen).toBe("run");
  expect(afterBlur.time - blurred.time).toBeGreaterThan(0.2);
  expect(Math.abs(afterBlur.player.x - blurred.player.x)).toBeLessThan(0.1);
  await page.keyboard.up("d");
  check("Blur clears held movement but does not pause the expedition");
  const hidden = await hideWithoutRAF(page);
  await page.waitForTimeout(2250);
  const afterHidden = await snap(page);
  expect(afterHidden.screen).toBe("run");
  expect(afterHidden.time - hidden.time).toBeGreaterThan(1.5);
  expect(afterHidden.time - hidden.time).toBeLessThan(3.2);
  expect(afterHidden.background.workerAvailable).toBe(true);
  expect(
    afterHidden.background.workerWakes - hidden.background.workerWakes,
  ).toBeGreaterThanOrEqual(4);
  expect(afterHidden.background.renderCount).toBe(
    hidden.background.renderCount,
  );
  report.snapshots.hidden = { before: hidden, after: afterHidden };
  check(
    "Hidden page with RAF fully suppressed progresses on dedicated-worker wakes, without rendering or double-stepping",
  );
  await page.keyboard.press("Escape");
  const paused = await snap(page);
  expect(paused.screen).toBe("paused");
  await page.waitForTimeout(650);
  expect((await snap(page)).time).toBe(paused.time);
  await restoreVisible(page);
  await page.waitForTimeout(150);
  expect((await snap(page)).screen).toBe("paused");
  expect((await snap(page)).time).toBe(paused.time);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(180);
  expect((await snap(page)).time).toBeGreaterThan(paused.time + 0.1);
  check(
    "Manual Esc pause survives hidden/visible transitions and resumes only manually",
  );
  await page.evaluate(() => {
    window.__hollowmere.setLoadout(
      { blade: 6, bolt: 3 },
      { area: 2, haste: 1 },
    );
    window.__hollowmere.forceDraft(["area", "bolt", "comet"]);
  });
  await expect(
    page.locator('.draft-modal [data-action="toggle-auto"]'),
  ).toBeVisible();
  await page.screenshot({ path: "/workspace/iso-shot-auto-draft.png" });
  await watchModals(page);
  const charges = (await snap(page)).draftCharges;
  await page.click('.draft-modal [data-action="toggle-auto"]');
  let state = await snap(page);
  expect(state.screen).toBe("run");
  expect(state.evolved).toContain("blade");
  expect(state.lastAutoPick).toBe("Widening Rift");
  expect(state.draftCharges).toEqual(charges);
  await expect(page.locator(".draft-shade")).toHaveCount(0);
  await page.waitForTimeout(350);
  await expect(page.locator("#notices .toast")).toContainText(
    "Auto: Widening Rift",
  );
  check(
    "Enabling auto in an open draft chooses the available evolution over alternatives, closes the modal, and leaves charges intact",
  );
  await page
    .locator(".auto-hud [data-auto-preference]")
    .selectOption("defense");
  expect((await snap(page)).settings.autoPreference).toBe("defense");
  const beforeQueue = await snap(page);
  await page.evaluate(() => window.__hollowmere.grantRunXP(1000));
  await page.waitForFunction(() => {
    const s = window.__hollowmere.snapshot();
    return s.level > 6 && s.xp < s.xpNeeded;
  });
  state = await snap(page);
  expect(state.screen).toBe("run");
  expect(state.autoPicks - beforeQueue.autoPicks).toBe(
    state.level - beforeQueue.level,
  );
  expect(state.level - beforeQueue.level).toBeGreaterThan(8);
  expect(state.draftCharges).toEqual(charges);
  expect(
    Object.values(state.weapons).filter(Boolean).length,
  ).toBeLessThanOrEqual(6);
  expect(
    Object.values(state.passives).filter(Boolean).length,
  ).toBeLessThanOrEqual(6);
  expect(await page.evaluate(() => window.__autoModals)).toBe(0);
  await expect(page.locator(".draft-shade")).toHaveCount(0);
  await expect(page.locator("#notices .toast")).toContainText(
    state.lastAutoPick,
  );
  report.snapshots.autoQueue = { before: beforeQueue, after: state };
  check(
    "A queued XP burst resolves every level instantly with no draft DOM, preserves 6+6 slot limits and charges, and displays the chosen upgrade",
  );
  const hiddenAutoBefore = await hideWithoutRAF(page);
  await page.evaluate(() => window.__hollowmere.grantRunXP(1000));
  await page.waitForTimeout(1250);
  const hiddenAutoAfter = await snap(page);
  expect(hiddenAutoAfter.screen).toBe("run");
  expect(hiddenAutoAfter.autoPicks).toBeGreaterThan(hiddenAutoBefore.autoPicks);
  expect(hiddenAutoAfter.autoPicks - hiddenAutoBefore.autoPicks).toBe(
    hiddenAutoAfter.level - hiddenAutoBefore.level,
  );
  expect(hiddenAutoAfter.xp).toBeLessThan(hiddenAutoAfter.xpNeeded);
  expect(hiddenAutoAfter.draftCharges).toEqual(charges);
  expect(hiddenAutoAfter.background.renderCount).toBe(
    hiddenAutoBefore.background.renderCount,
  );
  expect(await page.evaluate(() => window.__autoModals)).toBe(0);
  await restoreVisible(page);
  await expect(page.locator("#notices .toast")).toContainText(
    hiddenAutoAfter.lastAutoPick,
  );
  check(
    "Worker-only hidden gameplay drains queued auto-upgrades without modals, charges, or renders, and surfaces its latest pick on return",
  );
  const beforeLarge = await snap(page);
  await page.evaluate(() => window.__hollowmere.grantRunXP(100000));
  await page.waitForFunction(() => {
    const s = window.__hollowmere.snapshot();
    return s.level > 100 && s.xp < s.xpNeeded;
  });
  state = await snap(page);
  expect(state.autoPicks - beforeLarge.autoPicks).toBe(
    state.level - beforeLarge.level,
  );
  expect(state.autoPicks - beforeLarge.autoPicks).toBeGreaterThan(64);
  expect(state.draftCharges).toEqual(charges);
  expect(await page.evaluate(() => window.__autoModals)).toBe(0);
  check(
    "More than 64 queued levels drain across bounded batches without losing an upgrade or overflowing the stack",
  );
  await page.screenshot({ path: "/workspace/iso-shot-auto-hud.png" });
  await page.reload();
  await page.waitForSelector('[data-action="start"]');
  expect((await snap(page)).settings).toEqual({
    autoUpgrade: true,
    autoPreference: "defense",
  });
  await page.click('[data-action="start"]');
  await expect(
    page.locator('.auto-hud [data-action="toggle-auto"]'),
  ).toHaveAttribute("aria-pressed", "true");
  await page.click('.auto-hud [data-action="toggle-auto"]');
  await page.evaluate(() => {
    window.__hollowmere.benchmark();
    window.__hollowmere.grantRunXP(window.__hollowmere.snapshot().xpNeeded);
  });
  await page.waitForFunction(
    () => window.__hollowmere.snapshot().screen === "levelup",
  );
  await expect(page.locator(".draft-shade")).toHaveCount(1);
  await expect(
    page.locator('.draft-modal [data-action="toggle-auto"]'),
  ).toHaveAttribute("aria-pressed", "false");
  check(
    "Toggle and preference persist across reload; turning auto off restores manual draft choice",
  );
  await context.close();

  const bonusContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await bonusContext.addInitScript(() =>
    localStorage.setItem(
      "hollowmere-v2",
      JSON.stringify({
        settings: { autoUpgrade: true, autoPreference: "offense" },
        meta: { start: 3, reroll: 2, banish: 2, skip: 2 },
      }),
    ),
  );
  const bonus = await load(bonusContext);
  await watchModals(bonus);
  await bonus.click('[data-action="start"]');
  const bonusState = await snap(bonus);
  expect(bonusState.screen).toBe("run");
  expect(bonusState.level).toBe(4);
  expect(bonusState.autoPicks).toBe(3);
  expect(bonusState.pendingDrafts).toBe(0);
  expect(bonusState.draftCharges).toEqual({ reroll: 4, skip: 3, banish: 3 });
  expect(await bonus.evaluate(() => window.__autoModals)).toBe(0);
  check(
    "All three First Light starting drafts resolve automatically without opening a modal or spending upgraded charges",
  );
  await bonusContext.close();

  const fallbackContext = await browser.newContext();
  await fallbackContext.addInitScript(() => {
    window.Worker = class {
      constructor() {
        throw new Error("Worker unavailable in QA");
      }
    };
  });
  const fallback = await load(fallbackContext);
  await fallback.click('[data-action="start"]');
  await fallback.evaluate(() => window.__hollowmere.benchmark());
  const fallbackBefore = await hideWithoutRAF(fallback);
  await fallback.waitForTimeout(1400);
  const fallbackAfter = await snap(fallback);
  expect(fallbackAfter.time - fallbackBefore.time).toBeGreaterThan(0.8);
  expect(fallbackAfter.background.workerAvailable).toBe(false);
  expect(fallbackAfter.background.intervalWakes).toBeGreaterThanOrEqual(3);
  await restoreVisible(fallback);
  report.snapshots.fallback = { before: fallbackBefore, after: fallbackAfter };
  check(
    "A worker-unavailable browser still progresses hidden gameplay using the bounded interval fallback",
  );
  await fallbackContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobile = await load(mobileContext);
  await mobile.click('[data-action="start"]');
  await expect(
    mobile.locator('.auto-hud [data-action="toggle-auto"]'),
  ).toBeVisible();
  const box = await mobile.locator(".auto-hud .auto-controls").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(391);
  await mobile.screenshot({ path: "/workspace/iso-shot-auto-hud-mobile.png" });
  await mobile.evaluate(() =>
    window.__hollowmere.forceDraft(["blade", "area", "armor"]),
  );
  await expect(
    mobile.locator('.draft-modal [data-action="toggle-auto"]'),
  ).toBeVisible();
  await mobile.screenshot({
    path: "/workspace/iso-shot-auto-draft-mobile.png",
  });
  await mobile.locator('.draft-modal [data-action="toggle-auto"]').tap();
  await expect(mobile.locator(".draft-shade")).toHaveCount(0);
  expect((await snap(mobile)).settings.autoUpgrade).toBe(true);
  check(
    "Mobile HUD/draft auto controls fit a 390px viewport and work by touch",
  );
  await mobileContext.close();
  expect(report.workerAssets.length).toBeGreaterThan(0);
  expect(report.workerAssets.every((asset) => asset.status === 200)).toBe(true);
  expect(report.errors).toEqual([]);
  check(
    "Production worker assets return 200 and all browser contexts have no console or runtime errors",
  );
} finally {
  fs.writeFileSync(
    "/workspace/iso-background-auto-verification.json",
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
console.log(
  JSON.stringify(
    { checks: report.checks.length, errors: report.errors },
    null,
    2,
  ),
);
