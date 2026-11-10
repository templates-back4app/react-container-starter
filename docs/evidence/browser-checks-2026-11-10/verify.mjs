// Browser checks on a deployed starter. Usage: node verify.mjs <react|htmx> <url> <outdir> [label]
import { chromium } from "playwright-core";
import fs from "node:fs";

const [kind, url, outDir, label = kind] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 2 });
const out = { kind, url, at: new Date().toISOString(), checks: [] };
const check = (name, pass, detail) => out.checks.push({ name, pass: !!pass, detail });

if (kind === "react") {
  const r = await page.goto(url + "/", { waitUntil: "networkidle" });
  check("GET / status", r.status() === 200, r.status());
  const h1 = await page.locator("h1").first().innerText();
  check("home h1 rendered", h1 === "Get started", h1);
  const api = await page.locator("p.read-the-docs").first().innerText();
  out.apiLine = api;
  check("build-time value line rendered", api.startsWith("API endpoint baked at build time:"), api);
  const btn = page.locator("button.counter");
  for (let i = 0; i < 3; i++) await btn.click();
  const count = await btn.innerText();
  check("counter updates on click", count === "Count is 3", count);
  await page.screenshot({ path: `${outDir}/${label}-home.png` });
  // client-side navigation: a marker on window survives only if the page is not reloaded
  await page.evaluate(() => { window.__marker = "kept"; });
  await page.getByRole("link", { name: "About" }).click();
  await page.waitForURL("**/about");
  // the URL changes before React commits the new route: wait for the heading, up to 5 s
  await page.locator("h1", { hasText: "About this deployment" }).waitFor({ timeout: 5000 }).catch(() => {});
  const aboutH1 = await page.locator("h1").first().innerText();
  const marker = await page.evaluate(() => window.__marker);
  check("About link renders the route", aboutH1 === "About this deployment", aboutH1);
  check("navigation happened without a page reload", marker === "kept", marker);
  const r2 = await page.goto(url + "/about", { waitUntil: "networkidle" });
  const directH1 = await page.locator("h1").first().innerText();
  check("direct load of /about renders the route", r2.status() === 200 && directH1 === "About this deployment", `${r2.status()} ${directH1}`);
  await page.screenshot({ path: `${outDir}/${label}-about.png` });
}

if (kind === "htmx") {
  const r = await page.goto(url + "/", { waitUntil: "networkidle" });
  check("GET / status", r.status() === 200, r.status());
  const h1 = await page.locator("h1").first().innerText();
  check("page h1 rendered", h1 === "HTMX + Node starter", h1);
  const stamp = async () => {
    await page.getByRole("button", { name: "Fetch server fragment" }).click();
    await page.waitForFunction((prev) => {
      const c = document.querySelector("#fragment-slot code");
      return c && c.textContent !== prev;
    }, globalThis.__prev ?? "");
    return page.locator("#fragment-slot code").innerText();
  };
  const t1 = await stamp();
  globalThis.__prev = t1;
  await page.waitForTimeout(1100);
  const t2 = await stamp();
  check("fragment swapped into the page", /^\d{4}-\d\d-\d\dT/.test(t1), t1);
  check("server time differs between two requests", t1 !== t2, `${t1} -> ${t2}`);
  await page.locator('input[name="name"]').fill("Ada");
  await page.getByRole("button", { name: "Say hello" }).click();
  await page.waitForSelector("#greet-result p.ok");
  const greet = await page.locator("#greet-result").innerText();
  check("form POST swaps the greeting into the page", greet.startsWith("Hello, Ada"), greet);
  await page.screenshot({ path: `${outDir}/${label}-form.png` });
  await page.locator('input[name="name"]').fill("");
  await page.getByRole("button", { name: "Say hello" }).click();
  await page.waitForSelector("#greet-result p.error");
  const err = await page.locator("#greet-result").innerText();
  check("empty form shows the validation fragment", err === "Please tell me your name.", err);
}

await browser.close();
out.passed = out.checks.filter((c) => c.pass).length;
out.failed = out.checks.length - out.passed;
fs.writeFileSync(`${outDir}/${label}.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
