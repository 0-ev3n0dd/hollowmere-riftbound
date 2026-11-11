import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome",
  args: ["--no-sandbox", "--disable-background-timer-throttling"],
});
const p = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
let errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto("http://localhost:4174/?qa=1");
await p.waitForSelector('[data-action="start"]');
await p.click('[data-action="start"]');
await p.evaluate(() => {
  window.__hollowmere.loadout();
  window.__hollowmere.benchmark();
  window.__hollowmere.stress(350);
});
const samples = [];
for (let i = 0; i < 10; i++) {
  await p.waitForTimeout(1000);
  await p.evaluate(() => window.__hollowmere.stress(350));
  let s = await p.evaluate(() => window.__hollowmere.snapshot());
  samples.push(s);
  console.log(JSON.stringify(s));
}
await p.screenshot({ path: "/workspace/iso-shot-performance.png" });
expect(errors).toEqual([]);
fs.writeFileSync(
  "/workspace/iso-performance.json",
  JSON.stringify({ samples, errors }, null, 2),
);
await browser.close();
