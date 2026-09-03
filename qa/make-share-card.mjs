#!/usr/bin/env node
/* Generates docs/share.png — the 1200×630 share card — from the tree itself.

   The three numbers are extracted from PATH in docs/index.html, the bat mark
   is chroma-keyed out of docs/icon.png at run time, and the fonts are the
   app's own. Nothing on the card is typed by hand, so the card cannot drift
   from the catalogue: regenerate it whenever the counts move.

   Release tooling, not CI. Playwright joined package.json in 3.7.2 with the
   browser job, so this needs no separate install any more. To run:

       npx playwright install chromium
       node qa/make-share-card.mjs

   A pre-installed Chromium can be pointed at directly instead:
       SHARE_CARD_CHROMIUM=/path/to/chrome node qa/make-share-card.mjs

   Renders at 2× and downscales in-browser (canvas, high quality) so the type
   stays crisp; guard 91 verifies the shipped file is a 1200×630 PNG that the
   page's own metas agree on.

   The shipped file is additionally palette-quantized (1.9.5, on the
   independent audit's numbers: 325 KB -> ~20 KB, RMSE 1.4%, invisible at
   card size). To reproduce the shipped bytes after regenerating:

       python3 -c "from PIL import Image; i=Image.open('docs/share.png').convert('RGBA'); \
         i.quantize(colors=256, method=Image.Quantize.FASTOCTREE, \
         dither=Image.Dither.FLOYDSTEINBERG).save('docs/share.png', optimize=True)"

   The card stays generated, never hand-drawn — quantization is a wire
   format, not an edit. */
import fs from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

let chromium;
try { ({ chromium } = await import("playwright")); }
catch {
  console.error("make-share-card: playwright is not installed.\n" +
    "  npm install && npx playwright install chromium");
  process.exit(1);
}

/* ---- the numbers, from the data, the way the guards read it ---- */
const HTML = fs.readFileSync(path.join(ROOT, "docs", "index.html"), "utf8");
const a = HTML.indexOf("var PATH = [");
const b = HTML.indexOf("var MODENOTE", a);
if (a < 0 || b < 0) { console.error("cannot locate PATH in docs/index.html"); process.exit(1); }
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(HTML.slice(a, b), sandbox);
let films = 0, seasons = 0;
sandbox.PATH.forEach(g => g.films.forEach(f => { f.k === "tv" ? seasons++ : films++; }));
const continuities = sandbox.PATH.length;
console.log(`counts from PATH: ${films} films · ${seasons} seasons · ${continuities} continuities`);

/* ---- the skyline, generated ----------------------------------------------
   The card's background is a city, not a figure: symmetric about the centre,
   tallest tower at the middle, stepped setbacks with ziggurat caps, outlined
   in --line2, windows lit in --signal. It encodes nothing — the counts do
   that, three of them, in type. Deterministic from one seed so the card is
   byte-stable across runs, which is what lets guard 91 hold its hash. */
function skylineSvg() {
  const W = 1200, BAND = 472;
  const LINE2 = "#33405C", SUNK = "#0C111C", SIG = "#FFCF1F";
  let h = 20260903 >>> 0;
  const rnd = () => ((h = (h * 1664525 + 1013904223) >>> 0) / 4294967296);
  const CW = 118, CH = 300;
  const ts = [{ x: W / 2 - CW / 2, w: CW, h: CH, mast: true }];
  let x = W / 2 + CW / 2 + 4, i = 1;
  while (x < W) {
    const w = 42 + Math.round(rnd() * 58);
    const hh = Math.max(60, Math.round(CH * Math.pow(0.90, i) + rnd() * 34));
    ts.push({ x, w, h: hh, mast: false });
    x += w + 4; i++;
  }
  const tower = (t, mirror) => {
    const x0 = mirror ? W - t.x - t.w : t.x;
    const steps = t.h > 190 ? 3 : t.h > 110 ? 2 : 1;
    let g = "", cw = t.w, cx = x0, cy = BAND;
    const parts = [];
    for (let s = 0; s <= steps; s++) {
      const frac = s === 0 ? 0.62 : s === steps ? 0.16 : 0.22;
      const hh = Math.round(t.h * frac);
      parts.push({ x: cx, y: cy - hh, w: cw, h: hh });
      cy -= hh;
      const shrink = Math.max(6, Math.round(cw * 0.22));
      cx += shrink / 2; cw -= shrink;
      if (cw < 8) break;
    }
    parts.forEach(p => {
      g += `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${SUNK}" ` +
           `stroke="${LINE2}" stroke-width="1" stroke-opacity=".7"/>`;
    });
    const top = parts[parts.length - 1];
    if (top && top.w > 14) {
      const capW = Math.round(top.w * 0.5), capX = top.x + (top.w - capW) / 2;
      g += `<rect x="${capX}" y="${top.y - 7}" width="${capW}" height="7" fill="${SUNK}" ` +
           `stroke="${LINE2}" stroke-width="1" stroke-opacity=".7"/>`;
    }
    if (t.mast && top) {
      const mx = top.x + top.w / 2;
      g += `<rect x="${mx - 2}" y="${top.y - 40}" width="4" height="40" fill="${LINE2}"/>`;
    }
    let seed = (t.x * 2654435761) >>> 0;
    const r2 = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    parts.forEach(p => {
      const cols = Math.max(1, Math.floor((p.w - 10) / 12));
      const rows = Math.max(1, Math.floor((p.h - 12) / 16));
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        const wx = p.x + 6 + c * 12, wy = p.y + 9 + r * 16, roll = r2();
        if (roll < 0.10)
          g += `<rect x="${wx}" y="${wy}" width="5" height="8" fill="${SIG}" opacity="${(0.45 + r2() * 0.55).toFixed(2)}"/>`;
        else if (roll < 0.35)
          g += `<rect x="${wx}" y="${wy}" width="5" height="8" fill="${LINE2}" opacity=".55"/>`;
      }
    });
    return g;
  };
  let body = "";
  ts.forEach(t => { body += tower(t, false); });
  ts.slice(1).forEach(t => { body += tower(t, true); });
  return `<svg width="${W}" height="${BAND}" viewBox="0 0 ${W} ${BAND}">${body}` +
         `<rect x="0" y="${BAND - 1}" width="${W}" height="1" fill="${LINE2}"/></svg>`;
}

/* ---- render ---- */
const browser = await chromium.launch({
  executablePath: process.env.SHARE_CARD_CHROMIUM || undefined,
  args: ["--allow-file-access-from-files"]
});
const page = await (await browser.newContext({
  viewport: { width: 1240, height: 700 }, deviceScaleFactor: 2
})).newPage();

/* The bat silhouette, keyed out of the app icon at run time. */
await page.goto(pathToFileURL(path.join(ROOT, "docs", "icon.png")).href);
const bat = await page.evaluate(() => new Promise((resolve, reject) => {
  const img = document.querySelector("img");
  const go = () => {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height);
    let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
    for (let i = 0; i < d.data.length; i += 4) {
      const r = d.data[i], g = d.data[i + 1], bl = d.data[i + 2];
      if (r > 150 && g > 120 && bl < 120) {
        d.data[i] = 255; d.data[i + 1] = 207; d.data[i + 2] = 31;
        const p = i / 4, px = p % c.width, py = (p / c.width) | 0;
        if (px < minX) minX = px; if (px > maxX) maxX = px;
        if (py < minY) minY = py; if (py > maxY) maxY = py;
      } else { d.data[i + 3] = 0; }
    }
    x.putImageData(d, 0, 0);
    const out = document.createElement("canvas");
    out.width = maxX - minX + 1; out.height = maxY - minY + 1;
    out.getContext("2d").drawImage(c, -minX, -minY);
    resolve(out.toDataURL("image/png"));
  };
  /* An icon that fails to load must reject, or page.evaluate waits forever
     with no timeout to say why. */
  if (img.complete) go();
  else {
    img.addEventListener("load", go);
    img.addEventListener("error", () => reject(new Error("icon.png did not load")));
  }
}));

/* Fill the template and render it from a real file so file:// fonts load. */
const tpl = fs.readFileSync(path.join(ROOT, "qa", "share-card.html"), "utf8")
  .replaceAll("{{ROOT}}", pathToFileURL(ROOT).href)
  .replaceAll("{{BAT}}", bat)
  .replace("{{SKY}}", skylineSvg())
  .replace("{{FILMS}}", String(films))
  .replace("{{SEASONS}}", String(seasons))
  .replace("{{CONTINUITIES}}", String(continuities))
  .replace("{{TICKS}}", "<i></i>".repeat(continuities));
const tmp = path.join(os.tmpdir(), "nw-share-card.html");
fs.writeFileSync(tmp, tpl);
await page.goto(pathToFileURL(tmp).href, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const big = await (await page.$("#card")).screenshot({ type: "png" });

/* Downscale 2× → 1200×630 in-browser; no image library enters the repo. */
const png = await page.evaluate(src => new Promise(resolve => {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = 1200; c.height = 630;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
    x.drawImage(img, 0, 0, 1200, 630);
    resolve(c.toDataURL("image/png"));
  };
  img.src = src;
}), "data:image/png;base64," + big.toString("base64"));

const out = path.join(ROOT, "docs", "share.png");
const bytes = Buffer.from(png.split(",")[1], "base64");
fs.writeFileSync(out, bytes);
fs.unlinkSync(tmp);
await browser.close();
/* The manifest records what the card bakes in, so guard 91 can hold the
   shipped image against the data: the counts move with the catalogue, the
   hash moves with the file. The quantize step above rewrites the bytes, so
   after it `npm run bless` re-records the hash; the counts stay ours. */
const manifest = path.join(ROOT, "qa", "share-card.json");
fs.writeFileSync(manifest, JSON.stringify({
  films, seasons, continuities,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  generator: "qa/make-share-card.mjs"
}, null, 1) + "\n");
console.log(`wrote ${path.relative(ROOT, out)} — ${fs.statSync(out).size.toLocaleString("en-US")} bytes, 1200×630; ${path.relative(ROOT, manifest)} updated`);
