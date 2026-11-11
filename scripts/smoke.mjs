import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
page.on("pageerror", (e) => console.error("PAGEERROR", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.error("CONSOLE", m.text());
});
await page.goto("http://localhost:4174/?qa=1");
await page.waitForSelector('[data-action="start"]');
await page.screenshot({ path: "/workspace/iso-shot-title.png" });
await page.click('[data-action="start"]');
await page.waitForTimeout(12000);
console.log(await page.evaluate(() => window.__hollowmere.snapshot()));
await page.screenshot({ path: "/workspace/iso-shot-first.png" });
await browser.close();
