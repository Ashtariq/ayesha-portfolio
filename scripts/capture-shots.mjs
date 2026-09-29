// Makes real screenshots of every site in lib/projects.js at desktop / tablet / mobile size.
// They are saved in public/shots and used automatically when a site cannot be shown live.
//
// One-time setup:   npm i -D playwright   &&   npx playwright install chromium
// Run:              npm run shots
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { PROJECTS } from "../lib/projects.js";

const DEVICES = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

await mkdir("public/shots", { recursive: true });
const manifest = {};
const browser = await chromium.launch();

for (const p of PROJECTS) {
  manifest[p.slug] = {};
  for (const [name, d] of Object.entries(DEVICES)) {
    const ctx = await browser.newContext({
      viewport: { width: d.width, height: d.height },
      isMobile: d.isMobile, hasTouch: d.hasTouch, deviceScaleFactor: d.deviceScaleFactor || 1,
    });
    const page = await ctx.newPage();
    try {
      await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2500); // let sliders / fonts / lazy images settle
      const file = `public/shots/${p.slug}-${name}.jpg`;
      await page.screenshot({ path: file, type: "jpeg", quality: 82 });
      manifest[p.slug][name] = `/shots/${p.slug}-${name}.jpg`;
      console.log("OK  ", p.slug, name);
    } catch (e) {
      console.log("FAIL", p.slug, name, "-", e.message.split("\n")[0]);
    }
    await ctx.close();
  }
}
await browser.close();
await writeFile("lib/shots.json", JSON.stringify(manifest, null, 2) + "\n");
console.log("\nDone. lib/shots.json updated. Restart npm run dev.");
