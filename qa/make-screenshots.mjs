#!/usr/bin/env node
/* Generates docs/shot-narrow.png and docs/shot-wide.png — the two screenshots
   docs/manifest.json declares for the browser's install dialog (6.1.0) — and
   records them in qa/screenshots.json.

   Same pattern as qa/make-share-card.mjs: nothing is drawn by hand, the app
   draws itself, and the record holds what was drawn. Section 160 checks the
   files against the record and the record against the manifest and the
   catalogue on every run.

   Release tooling, not CI. To run (the served tree is started here, on a
   free port, so nothing else needs to be running):

       node qa/make-screenshots.mjs

   A pre-installed Chromium can be pointed at directly:
       SHOTS_CHROMIUM=/path/to/chrome node qa/make-screenshots.mjs
   (NW_CHROME, the browser check's escape hatch, is honoured too.)

   TWO STATES, BOTH CHOSEN TO SURVIVE THE CALENDAR.
     narrow  390×844 at 2×   Home on a first run: the question the app asks.
     wide    1280×720 at 1×  The Path on Bruce's life: the list it keeps.
   Neither view carries the Batman Day line (it sits at the foot of Next up
   and leaves with the 23 Oct cut), so neither file goes stale on a date.
   Both open with Animated + Live and Movies + Series, so the counts a
   stranger reads on the narrow shot are the whole shelf — the same three
   numbers share.png bakes in.

   DETERMINISM IS MEASURED, NOT ASSUMED (plan-6.1.0, 3 Sept). Storage is
   seeded before the first paint and nothing is clicked — a click fires a
   toast, and a stable hash of a transient toast blesses the bug. The settle
   predicate is the DOM, never a duration: the splash element gone, the
   toast without .show (it hides with visibility, not opacity — 5.1.2), the
   faces loaded. Motion is reduced and finite animations are fast-forwarded,
   so a keyframe cannot be caught mid-flight. The service worker is blocked:
   the shot is of the document, not of a cache.

   Both files are palette-quantized exactly like share.png (FASTOCTREE,
   Floyd–Steinberg, 256 colours) by Pillow, declared in
   qa/requirements-tooling.txt. Section 160 re-reads the hashes; after a
   regenerate, `npm run bless` is not needed — the record is written here,
   from the quantized bytes. */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "docs");

let chromium;
try { ({ chromium } = await import("playwright")); }
catch {
  console.error("make-screenshots: playwright is not installed.\n" +
    "  npm install && npx playwright install chromium");
  process.exit(1);
}

/* ---- the catalogue at the time of the shot, read the way the guards read it */
const HTML = fs.readFileSync(path.join(DOCS, "index.html"), "utf8");
const a = HTML.indexOf("var PATH = [");
const b = HTML.indexOf("var MODENOTE", a);
if (a < 0 || b < 0) { console.error("cannot locate PATH in docs/index.html"); process.exit(1); }
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(HTML.slice(a, b), sandbox);
let films = 0, seasons = 0;
sandbox.PATH.forEach(g => g.films.forEach(f => { f.k === "tv" ? seasons++ : films++; }));
const continuities = sandbox.PATH.length;

/* ---- the states --------------------------------------------------------- */
const WHOLE = { theme: "dark", scope: "all", format: "all", tier: "all" };
const SHOTS = [
  { src: "shot-narrow.png", form_factor: "narrow", viewport: { width: 390, height: 844 }, dpr: 2,
    settings: WHOLE, hash: "",
    label: "Night Watcher on a first visit: every Batman film and series, and the three ways through them" },
  { src: "shot-wide.png", form_factor: "wide", viewport: { width: 1280, height: 720 }, dpr: 1,
    settings: Object.assign({ path: "life" }, WHOLE), hash: "#life",
    label: "The Path in Bruce’s life order, every universe blended into one watch order" },
];

/* ---- a static server over docs/, on a free port --------------------------- */
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json",
                ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain",
                ".ico": "image/x-icon", ".xml": "application/xml", ".md": "text/markdown" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(DOCS, path.normalize(p));
  if (!file.startsWith(DOCS) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const BASE = "http://127.0.0.1:" + server.address().port + "/";

const EXE = process.env.SHOTS_CHROMIUM || process.env.NW_CHROME || undefined;
const browser = await chromium.launch(EXE ? { executablePath: EXE, args: ["--no-sandbox"] }
                                          : { args: ["--no-sandbox"] });
const record = { films, seasons, continuities, shots: {}, generator: "qa/make-screenshots.mjs" };
try {
  for (const s of SHOTS) {
    const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.dpr,
                                           serviceWorkers: "block", reducedMotion: "reduce",
                                           colorScheme: "dark" });
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", e => errs.push(String(e)));
    await page.addInitScript(set => {
      try {
        localStorage.clear();
        localStorage.setItem("batwatch-settings", JSON.stringify(set));
        localStorage.setItem("batwatch-v3", JSON.stringify({}));
      } catch (e) {}
    }, s.settings);
    await page.goto(BASE + s.hash, { waitUntil: "load" });
    await page.waitForFunction(() =>
      typeof window.render === "function" &&
      !document.getElementById("splash") &&
      !document.querySelector("#toast.show") &&
      document.fonts.status === "loaded",
      null, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready.then(() => new Promise(r =>
      requestAnimationFrame(() => requestAnimationFrame(r)))));
    if (errs.length) throw new Error(s.src + ": the page threw — " + errs.join("; "));
    const out = path.join(DOCS, s.src);
    await page.screenshot({ path: out, animations: "disabled", caret: "hide" });
    await ctx.close();
    const q = spawnSync("python3", ["-c",
      "import sys\nfrom PIL import Image\np=sys.argv[1]\n" +
      "i=Image.open(p).convert('RGBA')\n" +
      "i.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG).save(p, optimize=True)\n",
      out], { stdio: "inherit" });
    if (q.status !== 0) throw new Error("quantize failed for " + s.src + " (Pillow: qa/requirements-tooling.txt)");
    const buf = fs.readFileSync(out);
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    record.shots[s.src] = { form_factor: s.form_factor, sizes: w + "x" + h, label: s.label,
                            bytes: buf.length, sha256: createHash("sha256").update(buf).digest("hex") };
    console.log(`${s.src}: ${w}×${h}, ${buf.length.toLocaleString("en-US")} bytes`);
  }
} finally {
  await browser.close();
  server.close();
}
fs.writeFileSync(path.join(ROOT, "qa", "screenshots.json"), JSON.stringify(record, null, 1) + "\n");
console.log(`recorded qa/screenshots.json — catalogue ${films} films · ${seasons} seasons · ${continuities} continuities`);
