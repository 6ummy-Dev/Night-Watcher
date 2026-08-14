#!/usr/bin/env node
/* Generates docs/share.png — the 1200×630 share card — from the tree itself.

   The three numbers are extracted from PATH in docs/index.html, the bat mark
   is chroma-keyed out of docs/icon.png at run time, and the fonts are the
   app's own. Nothing on the card is typed by hand, so the card cannot drift
   from the catalogue: regenerate it whenever the counts move.

   Release tooling, not CI. Playwright joined package.json in 3.7.2 with the
   browser job, so this needs no separate install any more. To run:

       npm i --no-save playwright && npx playwright install chromium
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
"use strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

let chromium;
try { ({ chromium } = await import("playwright")); }
catch {
  console.error("make-share-card: playwright is not installed.\n" +
    "  npm i --no-save playwright && npx playwright install chromium");
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
const bat = await page.evaluate(() => new Promise(resolve => {
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
  img.complete ? go() : img.addEventListener("load", go);
}));

/* Fill the template and render it from a real file so file:// fonts load. */
const tpl = fs.readFileSync(path.join(ROOT, "qa", "share-card.html"), "utf8")
  .replaceAll("{{ROOT}}", pathToFileURL(ROOT).href)
  .replaceAll("{{BAT}}", bat)
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
fs.writeFileSync(out, Buffer.from(png.split(",")[1], "base64"));
fs.unlinkSync(tmp);
await browser.close();
console.log(`wrote ${path.relative(ROOT, out)} — ${fs.statSync(out).size.toLocaleString("en-US")} bytes, 1200×630`);
