// Night Watcher QA probes: browser checks the repo's own suites do not make.
// Each probe prints one VERDICT line keyed to the baseline finding it re-tests,
// so a re-audit can say "fixed" or "still present" from evidence, not memory.
//
//   NW_REPO=/path/to/Night-Watcher node probes.mjs http://localhost:8123 [all|csp|sw|pace|latch|hostile]
//
// Needs: the repo's node_modules (Playwright), a page served by qa/hdr-server.mjs
// on a *localhost* origin (the app registers its service worker only on https
// or hostname "localhost"). NW_CHROME=/path/to/chrome overrides the browser.
// The probes drive the app through its own globals (S, FILMS, exportCode,
// doRestore, nightsOf, doneBy, counts...). If a release renames one, the probe
// reports ERROR: read the code and adapt the probe; it is not a finding.
import { createRequire } from "node:module";
import path from "node:path";

const REPO = process.env.NW_REPO || process.cwd();
const { chromium } = createRequire(path.join(REPO, "package.json"))("playwright");
const BASE = (process.argv[2] || "http://localhost:8123").replace(/\/$/, "");
const ONLY = process.argv[3] || "all";
const LAUNCH = process.env.NW_CHROME
  ? { executablePath: process.env.NW_CHROME, args: ["--no-sandbox"] }
  : { args: ["--no-sandbox"] };
const DAY = 864e5;
const verdict = (id, state, detail) => console.log(`VERDICT ${id.padEnd(4)} ${state.padEnd(14)} ${detail}`);
const browser = await chromium.launch(LAUNCH);

// Keep the paper's analytics beacon offline, as the repo's browser check does.
async function context(opts = {}) {
  const ctx = await browser.newContext(opts);
  await ctx.route(u => /(^|\.)cloudflareinsights\.com$/.test(u.hostname),
    r => r.fulfill({ status: 200, body: "", contentType: "text/javascript" }));
  return ctx;
}

// L2: every page under its REAL _headers policy (meta CSP on the app,
// header CSP on /nocturne/* and /hww/*). Counts violations and page errors.
async function csp() {
  const ctx = await context({ viewport: { width: 390, height: 844 } });
  const paths = ["/", "/nocturne/", "/nocturne/feed.xml", "/hww/", "/does-not-exist"];
  // add every issue page the build wrote
  const probe = await ctx.newPage();
  await probe.goto(BASE + "/sitemap.xml");
  const locs = await probe.evaluate(() => [...document.querySelectorAll("loc")].map(l => new URL(l.textContent).pathname));
  await probe.close();
  locs.filter(p => /^\/nocturne\/.+\/$/.test(p)).forEach(p => paths.push(p));
  let total = 0, errors = 0;
  for (const p of paths) {
    const page = await ctx.newPage(), hits = [], errs = [];
    page.on("console", m => { if (/Content Security Policy|Refused to/i.test(m.text())) hits.push(m.text().slice(0, 200)); });
    page.on("pageerror", e => errs.push(String(e).slice(0, 200)));
    const r = await page.goto(BASE + p, { waitUntil: "load" });
    await page.waitForTimeout(300);
    const header = r.headers()["content-security-policy"] ? "header" : "meta/none";
    console.log(`  csp ${p}  status=${r.status()} policy=${header} violations=${hits.length} errors=${errs.length}`);
    hits.concat(errs).forEach(h => console.log("     - " + h));
    total += hits.length; errors += errs.length;
    await page.close();
  }
  verdict("L2", total || errors ? "REGRESSION" : "OK", `${paths.length} pages, ${total} CSP violations, ${errors} page errors`);
  await ctx.close();
}

// L1: does each unique query string store another full copy of the page?
async function sw() {
  const ctx = await context();
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "load" });
  const controlled = await page.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller));
  for (const q of ["?fbclid=qa1", "?fbclid=qa2", "?utm_source=qa"]) {
    await page.goto(BASE + "/" + q, { waitUntil: "load" });
    await page.waitForTimeout(300);
  }
  const docs = await page.evaluate(async () => {
    const out = [];
    for (const name of await caches.keys()) {
      const c = await caches.open(name);
      for (const req of await c.keys()) {
        const u = new URL(req.url);
        if (u.pathname === "/") out.push(u.pathname + u.search);
      }
    }
    return out;
  });
  if (!controlled) verdict("L1", "ERROR", "service worker never took control (origin must be localhost or https)");
  else verdict("L1", docs.length > 1 ? "STILL PRESENT" : "FIXED", `${docs.length} cached copies of the document after 3 tagged visits: ${docs.join(", ")}`);
  await ctx.close();
}

// M4: restore by backup code, then two quiet nights; is the forecast sane?
async function pace() {
  const ctx = await context({ serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "load" });
  const r = await page.evaluate(DAY => {
    localStorage.clear();
    S.path = S.mode = "release"; S.format = "all"; S.scope = "all"; S.tier = "all";
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = [];
    const ids = FILMS.filter(f => !isParked(f)).slice(0, 120).map(f => f.id);
    ids.forEach(id => { S.watched[id] = 1; });
    const code = exportCode();
    S.watched = {}; S.log = [];
    doRestore(code);
    const now = Date.now();
    S.log.forEach(e => { e.ts = now - 2 * DAY; });           // restored two days ago
    const rest = FILMS.filter(f => !isParked(f) && !S.watched[f.id]);
    S.watched[rest[0].id] = 1; S.log.push({ id: rest[0].id, ts: now - DAY });
    S.watched[rest[1].id] = 1; S.log.push({ id: rest[1].id, ts: now });
    const c = counts();
    const d = doneBy(nightsOf(S.log), c.left, now);
    return { left: c.left, days: d ? Math.round((d - now) / DAY) : null };
  }, DAY);
  // Real pace is one title a night, so an honest forecast is about `left` days.
  // The 6.5.4 bug forecast about 2 days. Anything under a tenth of `left` is the bug.
  const bad = r.days !== null && r.days < r.left / 10;
  verdict("M4", bad ? "STILL PRESENT" : "FIXED",
    `${r.left} titles left at 1/night; forecast ${r.days === null ? "withheld" : r.days + " days"}`);
  await page.evaluate(() => localStorage.clear());
  await ctx.close();
}

// M3: an unreadable progress payload. Seed it from a non-app page so the
// app's own pagehide flush cannot overwrite it, then try every way out.
async function latch() {
  const seeds = ["null", "42", "{\"watched\":"];
  let stuck = 0;
  for (const bad of seeds) {
    const ctx = await context({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/robots.txt");
    await page.evaluate(v => { localStorage.clear(); localStorage.setItem("batwatch-v3", v); }, bad);
    await page.goto(BASE + "/", { waitUntil: "load" });
    const first = await page.evaluate(() => ({ readFailed, banner: !document.getElementById("nosave").hidden }));
    await page.evaluate(() => {                 // choose a path, reset, tick: the obvious way out
      S.path = S.mode = "life"; goTab("stats");
    });
    const reset = page.locator('button[data-act="reset"]');
    if (await reset.count()) { await reset.click(); await page.locator('button[data-act="reset"]').click(); }
    await page.evaluate(() => { toggleWatched(FILMS[3].id); flushPersist(); });
    const disk = await page.evaluate(() => localStorage.getItem("batwatch-v3"));
    await page.goto(BASE + "/", { waitUntil: "load" });
    const next = await page.evaluate(() => ({ readFailed, banner: !document.getElementById("nosave").hidden, text: document.getElementById("nosave").textContent }));
    console.log(`  latch seed=${JSON.stringify(bad)} first=${JSON.stringify(first)} disk-after=${JSON.stringify(disk)} next=${JSON.stringify(next)}`);
    if (next.readFailed && disk === bad) stuck++;
    await ctx.close();
  }
  verdict("M3", stuck ? "STILL PRESENT" : "FIXED", `${stuck}/${seeds.length} unreadable payloads survive reset and re-latch every load`);
}

// Safety: hostile JSON restore and hostile hashes must stay inert.
async function hostile() {
  const ctx = await context({ serviceWorkers: "block" });
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(String(e)));
  await page.goto(BASE + "/", { waitUntil: "load" });
  const r = await page.evaluate(() => {
    localStorage.clear(); readFailed = false; canSave = true;
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.path = S.mode = "life";
    const evil = JSON.stringify({ watched: { "<img src=x onerror=window.__pwn=1>": 1, "constructor": 1, [FILMS[0].id]: 1 },
      rated: { [FILMS[0].id]: 99, [FILMS[1].id]: "4" }, log: [{ id: FILMS[0].id, ts: "1e400" }], path: "javascript:alert(1)" });
    doRestore(evil); render();
    return { pwned: !!window.__pwn, polluted: ({}).polluted !== undefined, path: S.path,
             unknownAdopted: Object.keys(S.watched).filter(k => !BYID[k]).length };
  });
  for (const h of ["#nw=%E0%A4%A", "#nw=NW3W" + "z".repeat(5000), "#<img src=x onerror=1>", "#life-series-progress"]) {
    await page.evaluate(h => { location.hash = h; }, h);
    await page.waitForTimeout(120);
  }
  const ok = !r.pwned && !r.polluted && r.path === "life" && r.unknownAdopted === 0 && errs.length === 0;
  verdict("SAFE", ok ? "OK" : "REGRESSION", JSON.stringify({ ...r, pageErrors: errs.length }));
  await page.evaluate(() => localStorage.clear());
  await ctx.close();
}

const run = { csp, sw, pace, latch, hostile };
for (const name of ONLY === "all" ? Object.keys(run) : [ONLY]) {
  try { await run[name](); }
  catch (e) { verdict(name.toUpperCase().slice(0, 4), "ERROR", String(e).split("\n")[0]); }
}
await browser.close();
