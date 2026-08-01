#!/usr/bin/env node
/* Night Watcher build guards.  node qa/guards.js [--bless]
   
   Zero dependencies. Exits 1 on any failure. Functions under test are
   EXTRACTED from docs/index.html and evaluated, never reimplemented here —
   a copy drifts from the app and quietly stops testing it.
   Every guard is negative-tested: made to fail on purpose before it is trusted. */
"use strict";

var fs   = require("fs");
var path = require("path");
var vm   = require("vm");

var ROOT   = path.join(__dirname, "..");
/* Autodetect the served directory rather than assume, so the guards cannot
   silently validate a stale copy in the wrong place. */
var PUBLIC = fs.existsSync(path.join(ROOT, "docs", "index.html"))
  ? path.join(ROOT, "docs") : ROOT;
var HTML   = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
var SNAP   = path.join(__dirname, "frozen-ids.json");
var BLESS  = process.argv.indexOf("--bless") >= 0;

/* INDEX

   CATALOGUE
     1    IDs present, unique, well formed
     2    Frozen IDs never change
     3    Backup-code hash collisions
     4    Every entry resolves to exactly one tier
     5    Era and decade coverage
     6    Badges all have labels
     30   Documented spoiler order holds
     32   No brand names in the catalogue or the UI

   STORAGE
     7    Backup code round-trips losslessly
     8    The parser tolerates codes it was not written for
     9    The restore link stays reachable
     19   Rating writes go through the clamp
     21   A blocked store has to say so
     35   The log holds one entry per id

   COPY
     14   README headline counts match the data
     15   The <meta> headline counts match the data
     23   The path vocabulary agrees with itself
     24   one string per ordering, not two
     25   Storage is a browser, not a device
     26   One name for what this is
     33   One tagline, everywhere
     37   Progress does not restate The Path
     48   The footer describes the link that exists

   LAYOUT
     17   One hero size, declared once
     18   Short views must not shift the centred column
     27   The path is actually load-bearing
     28   Theme reaches the chrome, not just the CSS
     34   Activity is reachable from Next up
     36   The Path collapses, and remembers
     40   One scoreboard
     47   The wordmark returns to the top

   ACCESS
     20   Text contrast against the surface it sits on
     41   The restore box has a real label

   DEPLOY
     10   No vendored third-party code
     11   BUILD and the service worker agree
     12   Referenced files exist
     13   Deployment layout
     16   Every shipped version is written down
     22   No JS escapes stranded in the markup
     29   Weight budget
     31   The README describes the app that exists
     45   The README lists every served file
     46   The README states the real weight

   DISCOVERY
     38   What a crawler and a shared link see
     39   What the app refuses to do is a feature
     42   The page asks nothing of anyone else
     43   Content-Security-Policy
     44   Every watch link carries a year

   META
     49   The card reads what it means

   META
     50   Rating and progress stay separate

   META
   CATALOGUE
     51   Format is the second axis
     52   Nobody's world changes overnight
     53   Two questions, two control groups

   META
   LAYOUT
     54   Home tells before it asks
     55   The chooser is a deck, not a list
     56   Format is legible where it is ambiguous

   LAYOUT
     57   The legend is made of badges
     58   Then is the tab, not the gap
     59   Every badge is the same box
     60   One left edge for the group chips

   ACCESSIBILITY
     61   Contrast is measured on the ink that renders
     62   Nothing focusable is small enough to zoom

   LAYOUT
     63   The grid columns have a floor

   META
     64   The guards are navigable

   Sections are numbered in file order. Groups are for finding things;
   they do not affect what runs. Guard 49 enforces the numbering.
*/


var fails = [], warns = [], notes = [];
function fail(m){ fails.push(m); }
function warn(m){ warns.push(m); }
function note(m){ notes.push(m); }

/* ---------- extract the real data + the real functions ---------- */

function slice(from, to){
  var a = HTML.indexOf(from);
  var b = HTML.indexOf(to, a);
  if(a < 0 || b < 0) throw new Error("cannot locate source block: " + from);
  return HTML.slice(a, b);
}
/* fn() throws when a function is missing, which ends the run with a stack trace
   instead of the readable failure the guard was written to print. That bug was
   fixed in place three times \u2014 activityBlock, dedupeLog, pathBlurb \u2014 before
   becoming this. optionalFn() reports the absence and returns a stub, so the
   guard below it still runs and still says something useful. */
function optionalFn(name, why){
  if(!new RegExp("function\\s+" + name + "\\s*\\(").test(HTML)){
    fail(name + "() is gone" + (why ? " \u2014 " + why : ""));
    return "function " + name + "(){ return undefined; }";
  }
  return fn(name);
}
function fn(name){
  var re = new RegExp("function\\s+" + name + "\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}", "m");
  var m = HTML.match(re);
  if(!m) throw new Error("cannot locate function " + name + "() in index.html");
  return m[0];
}

var sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  slice("var PATH = [", "var MODENOTE") + "\n" +
  /* MODENOTE became the single source for path copy in 1.3.9, so the sandbox
     needs it to check the chooser derives from the same string. */
  slice("var MODENOTE = {", "var PATHS = [") + "\n" +
  slice("var PATHS = [", "function isPath") + "\n" +
  fn("idHash") + "\n" + fn("tierOf") + "\n" + fn("clampRating") + "\n" + fn("isPath") + "\n",
  sandbox
);

var PATH = sandbox.PATH, ERAS = sandbox.ERAS, DECADES = sandbox.DECADES, BADGE = sandbox.BADGE;
var idHash = sandbox.idHash, tierOf = sandbox.tierOf, clampRating = sandbox.clampRating;

/* Flatten exactly as index.html does. */
var FILMS = [];
PATH.forEach(function(g, gi){
  g.films.forEach(function(f, fx){
    FILMS.push({id:f.i, gi:gi, ix:fx, gn:g.n, gname:g.name, fmt:(g.fmt || "anim"),
                t:f.t, sub:f.sub||"", ep:f.ep||0,
                tv:(f.k === "tv"), y:f.y, e:(f.e||0), b:f.b||[], o:!!f.o});
  });
});

/* ---------- 1. IDs present, unique, well formed ----------------------- */

var seen = Object.create(null);
FILMS.forEach(function(f){
  if(typeof f.id !== "string" || !f.id) return fail("entry with no i: slug — " + (f.t || "(untitled)"));
  if(!/^[a-z0-9-]+$/.test(f.id)) fail("id is not a lowercase slug: " + f.id);
  if(seen[f.id]) fail("DUPLICATE id: " + f.id);
  seen[f.id] = 1;
});

/* ---------- 2. Frozen IDs never change -------------------------------- */
/* Renaming an i: silently voids saved progress and every backup code in
   circulation. Nothing else catches it. */

var ids = FILMS.map(function(f){ return f.id; }).sort();
if(BLESS){
  fs.writeFileSync(SNAP, JSON.stringify(ids, null, 1) + "\n");
  note("blessed frozen-ids.json with " + ids.length + " ids");
} else if(!fs.existsSync(SNAP)){
  warn("no qa/frozen-ids.json yet — run: node qa/guards.js --bless");
} else {
  var prev = JSON.parse(fs.readFileSync(SNAP, "utf8"));
  var now = {}; ids.forEach(function(i){ now[i] = 1; });
  var was = {}; prev.forEach(function(i){ was[i] = 1; });
  prev.forEach(function(i){
    if(!now[i]) fail("FROZEN ID REMOVED OR RENAMED: " + i + "  (this voids saved progress)");
  });
  var added = ids.filter(function(i){ return !was[i]; });
  if(added.length) note(added.length + " new id(s) added — safe. Re-bless when ready.");
}

/* ---------- 3. Backup-code hash collisions ---------------------------- */
/* idHash is FNV-1a truncated to 5 base36 chars, so the real space is 36^5,
   not 2^32. A collision makes importCode() restore the WRONG title. */

var byHash = Object.create(null), collisions = 0;
FILMS.forEach(function(f){
  var h = idHash(f.id);
  if(byHash[h]){ fail("idHash COLLISION " + h + ": " + byHash[h] + " <-> " + f.id); collisions++; }
  else byHash[h] = f.id;
});
var space = Math.pow(36, 5);
var risk = 1 - Math.exp(-(FILMS.length * (FILMS.length - 1)) / (2 * space));
note("hash space 36^5=" + space.toLocaleString("en-US") +
     ", birthday risk at " + FILMS.length + " entries ≈ " + (risk * 100).toFixed(3) + "%");
if(risk > 0.01) warn("collision risk above 1% — consider widening the hash in a v2 code format");

/* ---------- 4. Every entry resolves to exactly one tier --------------- */
/* Regression: Core tested the raw o flag while Optional tested tierOf(),
   leaving 9 essential seasons in neither bucket. */

var core = FILMS.filter(function(f){ return tierOf(f) !== "o"; });
var opt  = FILMS.filter(function(f){ return tierOf(f) === "o"; });
if(core.length + opt.length !== FILMS.length){
  fail("tier partition does not close: core " + core.length + " + optional " + opt.length +
       " != " + FILMS.length);
}
FILMS.forEach(function(f){
  if(["e","k","o"].indexOf(tierOf(f)) < 0) fail("entry resolves to no tier: " + f.id);
});
if(/S\.filter === "core" && f\.o/.test(HTML) || /return !f\.o;/.test(HTML)){
  fail("route filtering tests the raw f.o flag — must go through tierOf(); see the tierOf comment");
}

/* ---------- 5. Era and decade coverage -------------------------------- */

var eraKeys = {}; ERAS.forEach(function(e){ eraKeys[e.k] = 1; });
FILMS.forEach(function(f){
  if(!eraKeys[f.e]) fail("era " + f.e + " has no entry in ERAS: " + f.id);
});
var maxDec = DECADES.reduce(function(a, d){ return Math.max(a, d.k); }, 0);
FILMS.forEach(function(f){
  if(f.y < DECADES[0].k || f.y > maxDec + 9){
    fail("year " + f.y + " falls outside every DECADES bucket (add one): " + f.id);
  }
});
var headroom = (maxDec + 9) - FILMS.reduce(function(a, f){ return Math.max(a, f.y); }, 0);
if(headroom <= 2) warn("only " + headroom + " year(s) of DECADES headroom left — add the next bucket");

/* ---------- 6. Badges all have labels --------------------------------- */

var used = {};
FILMS.forEach(function(f){ f.b.forEach(function(k){ used[k] = 1; }); });
Object.keys(used).forEach(function(k){
  if(!(k in BADGE)) fail("badge \"" + k + "\" used in data but absent from BADGE");
});

/* ---------- 7. Backup code round-trips losslessly --------------------- */
/* Extracted, not reimplemented: the copies here had already drifted. */

sandbox.FILMS = FILMS;
sandbox.S = {watched:{}, skipped:{}, rated:{}};
vm.runInContext(fn("exportCode") + "\n" + fn("importCode") + "\n", sandbox);
var exportCode = sandbox.exportCode, importCode = sandbox.importCode;

var S = sandbox.S;
FILMS.forEach(function(f, i){
  if(i % 2 === 0) S.watched[f.id] = 1; else if(i % 5 === 0) S.skipped[f.id] = 1;
  if(i % 7 === 0) S.rated[f.id] = (i % 5) + 1;
});
var code = exportCode();
var back = importCode(code);
if(!back) fail("backup code failed to parse its own output");
else {
  ["watched","skipped","rated"].forEach(function(kind){
    var a = Object.keys(S[kind]).filter(function(id){ return kind !== "rated" || clampRating(S[kind][id]); }).sort();
    var b = Object.keys(back[kind]).sort();
    if(a.join("|") !== b.join("|")) fail("backup round-trip lost " + kind + " entries");
    a.forEach(function(id){ if(kind === "rated" && back.rated[id] !== S.rated[id]) fail("rating changed on round-trip: " + id); });
  });
}

/* ---------- 8. The parser tolerates codes it was not written for ------ */
/* A code from a later build must restore what this one understands. */

if(!/^NW2W/.test(code)){
  fail("exportCode is not writing NW2 — 1.2.0 codes carry the chosen path in a " +
       "P segment; bump deliberately and say so in CHANGELOG.md");
}

/* Stripping P is what a 1.1.0 reader sees. */
var without = code.replace(/P[0-9a-z]*$/, "");
var older = importCode(without);
if(!older) fail("a 1.1.0 reader (P segment skipped) cannot parse a 1.2.0 code");
else if(Object.keys(older.watched).sort().join("|") !== Object.keys(back.watched).sort().join("|")){
  fail("stripping the path segment loses watched entries — the forward tolerance " +
       "shipped in 1.1.0 does not actually cover this format");
}

/* And codes already in the wild must still restore. */
var legacy = importCode(without.replace(/^NW2/, "NW1"));
if(!legacy) fail("a 1.0.0/1.1.0 NW1 code no longer imports — every saved backup just broke");
else if(Object.keys(legacy.watched).sort().join("|") !== Object.keys(back.watched).sort().join("|")){
  fail("NW1 codes import but lose entries");
}

var future = code.replace(/^NW1/, "NW2") + "P3" ;          /* unknown segment, unknown version */
var ftr = importCode(future);
if(!ftr) fail("parser rejected a forward-compatible code (NW2 + unknown segment) outright");
else if(Object.keys(ftr.watched).sort().join("|") !== Object.keys(back.watched).sort().join("|")){
  fail("parser dropped watched entries from a code carrying an unknown segment");
}

/* A pasted restore URL still has to work, and real junk still has to fail. */
if(!importCode("https://6ummy-dev.github.io/Night-Watcher/#nw=" + code)) fail("parser rejected a pasted restore URL");
["", "hello", "NW1", "NW1W!!!", "NW1W-----"].forEach(function(bad){
  if(importCode(bad)) fail("parser accepted junk it should reject: \"" + bad + "\"");
});

/* ---------- 9. The restore link stays reachable ----------------------- */
/* Transfer used to be a QR of this link. The QR is gone; the link is the whole
   mechanism now, so losing the control that surfaces it would silently remove
   device-to-device transfer and leave only copy-and-paste. */

if(HTML.indexOf('data-act="copylink"') < 0){
  fail("the Copy link control is gone \u2014 device-to-device restore would be " +
       "copy-the-code-and-paste-it only");
}
if(!/function restoreLink\s*\(/.test(HTML)){
  fail("restoreLink() is gone \u2014 nothing builds the #nw= URL");
}
if(!/#nw=/.test(HTML)){
  fail("nothing handles the #nw= hash \u2014 an opened restore link would do nothing");
}
/* A shared view link has to work in a RUNNING app too; found in 1.2.5 QA — the
   router only ran on load, so tapping a #life link with the app open did
   nothing. */
if(!/addEventListener\("hashchange"/.test(HTML)){
  fail("no hashchange listener — shared #life/#release links only work on a full page load");
}
if(!/function routeHash\s*\(/.test(HTML)){
  fail("routeHash() is gone — nothing routes shareable views");
}


/* ---------- 10. No vendored third-party code -------------------------- */
/* The QR encoder was 20 KB of somebody else's minified JavaScript, 15% of the
   file, carrying a licence obligation, for a feature the link does better. */

var vendored = HTML.match(/qrcode-generator|\(c\) [A-Z][a-z]+ [A-Z][a-z]+ \| MIT/g);
if(vendored){
  fail("vendored third-party code is back in index.html (" + vendored[0] + ")");
}

/* ---------- 11. BUILD and the service worker agree -------------------- */

var buildM = HTML.match(/var BUILD = "([^"]+)"/);
var swPath = path.join(PUBLIC, "sw.js");
if(!buildM) fail("cannot find BUILD in index.html");
if(!fs.existsSync(swPath)) fail("sw.js is missing but index.html registers it");
else {
  var verM = fs.readFileSync(swPath, "utf8").match(/var VERSION\s*=\s*"([^"]+)"/);
  if(!verM) fail("cannot find VERSION in sw.js");
  else if(buildM && verM[1] !== buildM[1]){
    fail("sw.js VERSION (" + verM[1] + ") != index.html BUILD (" + buildM[1] +
         ") — old caches will never be retired");
  }
}

/* ---------- 12. Referenced files exist -------------------------------- */

var manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC, "manifest.json"), "utf8"));
manifest.icons.forEach(function(ic){
  if(!fs.existsSync(path.join(PUBLIC, ic.src))) fail("manifest references missing file: " + ic.src);
});
if(!manifest.icons.some(function(ic){ return /maskable/.test(ic.purpose || ""); })){
  warn("manifest has no maskable icon — Android will letterbox the install icon");
}

/* ---------- 13. Deployment layout ------------------------------------- */
/* Deployables live in docs/, nowhere else. A placeholder left at the repo
   root is a dead file the next person edits while prod never changes. */

if(PUBLIC !== ROOT){
  note("site dir: " + path.relative(ROOT, PUBLIC) + "/ (GitHub Pages + wrangler)");
  ["index.html", "sw.js", "manifest.json", "icon.png", "icon-192.png", "icon-maskable-512.png"]
    .forEach(function(f){
      if(fs.existsSync(path.join(ROOT, f))){
        fail("stray " + f + " at the repo root — the site is served from " +
             path.relative(ROOT, PUBLIC) + "/, so this copy is dead and will drift. Delete it.");
      }
    });
}

var wranglerPath = path.join(ROOT, "wrangler.jsonc");
if(fs.existsSync(wranglerPath)){
  var wtxt = fs.readFileSync(wranglerPath, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  var wcfg = null;
  try { wcfg = JSON.parse(wtxt); }
  catch(e){ fail("wrangler.jsonc does not parse as JSONC: " + e.message); }
  if(wcfg && wcfg.assets){
    var wdir = path.resolve(ROOT, wcfg.assets.directory || ".");
    if(wdir !== PUBLIC){
      fail("wrangler assets.directory (\"" + wcfg.assets.directory +
           "\") does not match the site dir (" + path.relative(ROOT, PUBLIC) + "/)");
    }
    if(wcfg.assets.not_found_handling === "single-page-application"){
      fail("wrangler not_found_handling is \"single-page-application\" — the app is " +
           "hash-routed so SPA fallback buys nothing, and sw.js caches any 200, so a " +
           "missing asset would be cached as HTML under the asset's URL. Keep it \"none\".");
    }
  }
}

/* ---------- 14. README headline counts match the data ----------------- */
/* Four hard-coded numbers: first thing a reader checks, last thing anyone
   remembers to update. */

var readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
if(/\bpublic\//.test(readme) && !fs.existsSync(path.join(ROOT, "public"))){
  fail("README references public/ but no such directory exists — the site dir is " +
       path.relative(ROOT, PUBLIC) + "/");
}
var actual = {
  films:        FILMS.filter(function(f){ return !f.tv; }).length,
  seasons:      FILMS.filter(function(f){ return f.tv; }).length,
  episodes:     FILMS.reduce(function(a, f){ return a + (f.tv ? f.ep : 0); }, 0),
  continuities: PATH.length
};
[["films", /\*\*(\d+) films/, actual.films],
 ["seasons", /(\d+) seasons of television/, actual.seasons],
 /* A floor, not a figure. Teen Titans Go! and Batwheels are still running, so
    an exact episode count goes stale on somebody else's schedule \u2014 the claim is
    "1,450+" and the guard checks the data is at least that and not wildly past. */
 ["episodes", /([\d,]+)\+ episodes/, null],
 ["continuities", /(\d+) continuities/, actual.continuities]
].forEach(function(t){
  var m = readme.match(t[1]);
  if(!m) return warn("README: could not find the " + t[0] + " count to verify");
  var claimed = parseInt(m[1].replace(/,/g, ""), 10);
  if(t[2] === null){
    if(actual.episodes < claimed){
      fail("README claims " + claimed + "+ episodes, data has only " + actual.episodes);
    }
    if(actual.episodes >= claimed + 100){
      fail("README claims " + claimed + "+ episodes, data has " + actual.episodes +
           " \u2014 the floor is far enough behind to be misleading");
    }
    return;
  }
  if(claimed !== t[2]) fail("README claims " + claimed + " " + t[0] + ", data has " + t[2]);
});

/* ---------- 15. The <meta> headline counts match the data ------------- */
/* The same numbers in meta/og descriptions are what search results and every
   shared link show, so a stale one is more visible than a stale README. */

[["meta description", /<meta name="description" content="([^"]+)"/],
 ["og:description",   /<meta property="og:description" content="([^"]+)"/],
 ["JSON-LD description", /"description":"([^"]+)"/]
].forEach(function(t){
  var m = HTML.match(t[1]);
  if(!m) return warn(t[0] + " is missing");
  var txt = m[1];
  [[/(\d+)\s+films/, actual.films, "films"],
   [/(\d+)\s+seasons/, actual.seasons, "seasons"],
   [/(\d+)\s+continuities/, actual.continuities, "continuities"]
  ].forEach(function(c){
    var got = txt.match(c[0]);
    if(got && parseInt(got[1], 10) !== c[1]){
      fail(t[0] + " claims " + got[1] + " " + c[2] + ", data has " + c[1]);
    }
  });
});

/* ---------- 16. Every shipped version is written down ----------------- */
/* A change nobody recorded is one the next person silently undoes. BUILD,
   sw.js VERSION and the top of CHANGELOG.md must agree. */

var changelogPath = path.join(ROOT, "CHANGELOG.md");
if(!fs.existsSync(changelogPath)){
  fail("CHANGELOG.md is missing — every shipped change needs a written record");
} else if(buildM){
  var log = fs.readFileSync(changelogPath, "utf8");
  var esc = buildM[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if(!new RegExp("^##\\s*\\[" + esc + "\\]", "m").test(log)){
    fail("CHANGELOG.md has no \"## [" + buildM[1] + "]\" section — BUILD was bumped " +
         "without recording what changed");
  }
  var firstRelease = log.match(/^##\s*\[(?!Unreleased)([^\]]+)\]/m);
  if(firstRelease && firstRelease[1] !== buildM[1]){
    fail("CHANGELOG.md's newest release is " + firstRelease[1] + " but BUILD is " +
         buildM[1] + " — one of them was not updated");
  }
}

/* ---------- 17. One hero size, declared once -------------------------- */
/* Home and Next up render the SAME title, so an inline font-size on one makes
   the identical card resize as you tap between them. Keep it in .hero h2. */

var inlineHero = HTML.match(/'<h2 style="[^"]*font-size/g);
if(inlineHero){
  fail(inlineHero.length + " hero title(s) carry an inline font-size — put it in " +
       "the .hero h2 rule instead, or Home and Next up will disagree again");
}
if(!/\.hero h2\{[^}]*font-size:/.test(HTML)){
  fail(".hero h2 has no font-size — the shared hero size has gone missing");
}

/* ---------- 18. Short views must not shift the centred column --------- */
/* Next up is the only view short enough to fit a desktop screen; without a
   reserved gutter the centred column slides ~7.5px sideways. */

if(!/scrollbar-gutter:\s*stable/.test(HTML)){
  fail("html is missing scrollbar-gutter:stable — Next up will jump sideways " +
       "relative to the other tabs on any desktop viewport");
}

/* ---------- 19. Rating writes go through the clamp -------------------- */
/* new Array(n+1) throws on a fractional or negative n, and a thrown render
   blanks the app. Imported JSON is user-supplied. */

if(/new Array\(S\.rated\[/.test(HTML)){
  fail("star render builds new Array() from a raw rating — route it through stars()/clampRating()");
}
if(/S\.rated\[id\d*\] = res\.rated\[/.test(HTML)){
  fail("import writes a raw rating into S.rated — clamp it first");
}

/* ---------- 20. Text contrast against the surface it sits on ---------- */
/* A review reported --dim at 3.2:1; measured it is 5.03 on --sunk and 4.57
   on --card. Measuring properly found the real one: .hero .yr at ~4.33. */

/* Per theme. Taking the first value seen anywhere measured only the default
   and would have ignored every theme added after it. */
function palette(css){
  var out = {}, re = /--([a-z0-9]+):\s*(#[0-9A-Fa-f]{6})/g, m;
  while((m = re.exec(css))) if(!(m[1] in out)) out[m[1]] = m[2];
  return out;
}
function block(sel){
  var at = HTML.indexOf(sel + "{");
  if(at < 0) return null;
  return HTML.slice(at, HTML.indexOf("}", at));
}
var rootCss = block(":root");
if(!rootCss) fail("cannot find the :root palette block");
var pal = palette(rootCss || "");

var themes = [["dark", pal]];
var tre = /:root\[data-theme="([a-z]+)"\]\{/g, tm;
while((tm = tre.exec(HTML))){
  var over = palette(block(':root[data-theme="' + tm[1] + '"]') || "");
  var merged = {}, k;
  for(k in pal) merged[k] = pal[k];
  for(k in over) merged[k] = over[k];
  themes.push([tm[1], merged]);
}
note("themes measured: " + themes.map(function(t){ return t[0]; }).join(", "));

function lin(c){ c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(h){
  return 0.2126 * lin(parseInt(h.substr(1,2),16)) +
         0.7152 * lin(parseInt(h.substr(3,2),16)) +
         0.0722 * lin(parseInt(h.substr(5,2),16));
}
function contrast(a, b){
  var x = lum(a), y = lum(b);
  if(y > x){ var t = x; x = y; y = t; }
  return (x + 0.05) / (y + 0.05);
}

themes.forEach(function(t){
  var name = t[0], p = t[1];
  /* Every token used as a text colour, against every surface it can land on.
     The list used to be five hand-picked pairs and --steel was in none of them,
     so it shipped at 4.09:1 on the pathcard from 1.0.0 until the 1.4.0 audit
     found it. Enumerating beats remembering. */
  var SURFACES = ["ink", "sunk", "card", "card2"];
  var inks = Object.keys(p).filter(function(tok){
    return SURFACES.indexOf(tok) < 0 &&
           new RegExp("(^|[;{\"\\s])color:\\s*var\\(--" + tok + "\\)").test(HTML);
  });
  var pairs = [];
  inks.forEach(function(f){ SURFACES.forEach(function(b){ pairs.push([f, b]); }); });
  pairs.forEach(function(pair){
    var fg = p[pair[0]], bg = p[pair[1]];
    if(!fg || !bg){ fail("token --" + pair[0] + " or --" + pair[1] + " missing from theme " + name); return; }
    var r = contrast(fg, bg);
    if(r < 4.8) note(name + ": --" + pair[0] + " on --" + pair[1] + " = " + r.toFixed(2) + ":1");
    /* --card2 is the hero's top stop; warn, since the default has shipped at
       4.12 there since 1.0.0 with nothing dim on it. */
    /* --line2 and --staroff are drawn shapes, not prose. WCAG puts UI
       components at 3:1 (1.4.11) and body text at 4.5:1 (1.4.3). */
    var uiOnly = (pair[0] === "line" || pair[0] === "line2" || pair[0] === "staroff");
    if(uiOnly){
      if(r < 3) fail(name + ": --" + pair[0] + " on --" + pair[1] + " is " + r.toFixed(2) +
                     ":1 \u2014 below the 3:1 floor for a UI component (1.4.11)");
      return;
    }
    /* --card2 used to be exempt, on the reasoning that it is only a gradient
       top stop and nothing faint sat there. That was false: .pathchg draws in
       --steel inside .pathcard, whose gradient starts at --card2. The exemption
       is why --steel sat at 4.09:1 from 1.0.0 to 1.4.0 without failing a build.
       No exemption now \u2014 if a colour cannot survive the top of a card, it does
       not belong on one. */
    if(r < 4.5) fail(name + ": --" + pair[0] + " on --" + pair[1] + " is " + r.toFixed(2) +
                     ":1 \u2014 below the 4.5:1 AA floor for body text");
    else if(r < 4.8) warn(name + ": --" + pair[0] + " on --" + pair[1] + " is " + r.toFixed(2) +
                          ":1 — clears AA with little room");
  });
});

/* The gradient reaches --card at 60%, so only .hero .yr sits in the dark
   zone. Anything lower passes; report it and let a human judge. */
var heroRules = HTML.match(/^\.hero[^{]*\{[^}]*\}/gm) || [];
heroRules.forEach(function(rule){
  if(!/color:\s*var\(--dim\)/.test(rule)) return;
  var sel = rule.slice(0, rule.indexOf("{")).trim();
  if(/^\.hero \.yr$/.test(sel)){
    fail(".hero .yr is back on --dim — it sits in the gradient's --card2 zone at " +
         "roughly 4.33:1, under AA. It uses --dust for that reason.");
  } else {
    warn(sel + " uses --dim inside the hero (" + contrast(pal.dim, pal.card2).toFixed(2) +
         ":1 at the top of the gradient, " + contrast(pal.dim, pal.card).toFixed(2) +
         ":1 once it reaches --card) — fine while it stays low in the card");
  }
});

/* ---------- 21. A blocked store has to say so ------------------------- */
/* A blocked store used to fail silently. The warning must be inside the
   sticky header, where it cannot scroll away. */

if(!/id="nosave"/.test(HTML)){
  fail("the storage-blocked warning (#nosave) is gone — a blocked store fails silently again");
} else {
  var hOpen = HTML.indexOf("<header>"), hClose = HTML.indexOf("</header>"), nAt = HTML.indexOf('id="nosave"');
  if(!(nAt > hOpen && nAt < hClose)){
    fail("#nosave is outside <header> — it will scroll out of sight");
  }
  if(!/#nosave\[hidden\]\{display:none/.test(HTML)){
    fail("#nosave has no [hidden] display rule — the warning will show even when saving works");
  }
  var calls = (HTML.match(/flagSave\(\)/g) || []).length;
  if(calls < 4){
    fail("flagSave() is called " + calls + " times, expected at least 4 (definition, " +
         "render, and both persist failure paths) — a store that fails AFTER load " +
         "would never surface");
  }
}

/* ---------- 22. No JS escapes stranded in the markup ------------------ */
/* \uXXXX is an em dash in a script and six literal characters in markup. */

var bodyAt = HTML.indexOf("<body>");
var scriptAt = HTML.indexOf("<script", bodyAt);
if(bodyAt > 0){
  var markup = HTML.slice(bodyAt, scriptAt > bodyAt ? scriptAt : HTML.length);
  var stranded = markup.match(/\\u[0-9a-fA-F]{4}/g);
  if(stranded){
    fail("static markup contains " + stranded.length + " JS escape(s) (" +
         stranded.slice(0, 3).join(", ") + ") — these render literally, not as " +
         "the character. Use the character itself or an HTML entity.");
  }
}

/* ---------- 23. The path vocabulary agrees with itself ---------------- */
/* PATHS, MODENOTE, PATHCODE and CODEPATH describe the same three orderings;
   a path missing from one gives a blank card or a letter that restores nothing. */

var PATHS = sandbox.PATHS, MODENOTE = sandbox.MODENOTE,
    PATHCODE = sandbox.PATHCODE, CODEPATH = sandbox.CODEPATH;

if(!PATHS || !MODENOTE || !PATHCODE || !CODEPATH){
  fail("cannot extract the path tables from index.html");
} else {
  var ids = PATHS.map(function(x){ return x[0]; });
  ids.forEach(function(id){
    if(!MODENOTE[id]) fail('path "' + id + '" has no MODENOTE — its chooser card\n                           and its note on The Path would both be blank');
    if(!PATHCODE[id])  fail('path "' + id + '" has no PATHCODE — it cannot survive a backup code');
    else if(CODEPATH[PATHCODE[id]] !== id){
      fail('path "' + id + '" does not round-trip through PATHCODE/CODEPATH');
    }
  });
  Object.keys(PATHCODE).forEach(function(id){
    if(ids.indexOf(id) < 0) fail('PATHCODE has "' + id + '", which is not in PATHS');
  });
  var letters = ids.map(function(id){ return PATHCODE[id]; });
  if(letters.length !== letters.filter(function(l, i){ return letters.indexOf(l) === i; }).length){
    fail("two paths share a PATHCODE letter — one would restore as the other");
  }
  /* buildGroups() switches on these strings; a rename that misses it silently
     falls through to the by-universe branch. */
  ids.forEach(function(id){
    if(HTML.indexOf('"' + id + '"') < 0) fail('path id "' + id + '" appears in PATHS but nowhere else');
  });
  note("paths: " + ids.join(", "));

  /* ---------- 24. one string per ordering, not two ---------------------- */
  /* The chooser held its own blurbs and they drifted: "safest first watch"
     against "safest way through", and a hardcoded 1968 against a computed
     1993. Nobody sees both at once, which is why nobody noticed. */
  if(/PATHBLURB/.test(HTML)){
    fail("PATHBLURB is back — 1.3.9 made MODENOTE the only source for path copy");
  }
    if(!/esc\(pathBlurb\(/.test(HTML)){
    fail("the chooser does not render pathBlurb()");
  }
  /* fn() throws on a missing function, which would end the run with a stack
     trace instead of the readable failure above. */
  var pb = new vm.Script(
    optionalFn("noteFor") + "\n" +
    optionalFn("pathBlurb", "the chooser has nothing to build its cards from") +
    "\n({noteFor:noteFor, pathBlurb:pathBlurb});"
  ).runInNewContext({MODENOTE: MODENOTE, yearSpan: function(){ return "1993 to 2028"; }});
  ids.forEach(function(id){
    var card = pb.pathBlurb(id), full = pb.noteFor(id);
    if(!card){ fail('pathBlurb("' + id + '") is empty'); return; }
    if(full.indexOf(card.replace(/\.$/, "")) !== 0){
      fail('pathBlurb("' + id + '") is not the opening of its MODENOTE');
    }
    if(card.length > 200){
      fail('pathBlurb("' + id + '") is ' + card.length + ' chars — too long for a card');
    }
    if(/\{span\}/.test(card)){
      fail('pathBlurb("' + id + '") carries an unsubstituted {span}');
    }
  });
  /* The release span is computed from the catalogue. A hardcoded year is how
     the chooser came to claim 1968 while The Path said 1993. */
  if(/release order, 19\d\d to/.test(HTML)){
    fail("release copy hardcodes a year span — it must come from yearSpan()");
  }
}

/* ---------- 25. Storage is a browser, not a device -------------------- */
/* Two browsers on one phone do not share storage. Saying "device" promised
   people their ticks would follow them somewhere they will not. */

if(/this device/.test(HTML)){
  fail("copy still says progress is kept on \"this device\" — storage is per browser");
}

/* ---------- 26. One name for what this is ----------------------------- */

if(/field guide/.test(HTML)){
  fail('"field guide" is back — the app calls itself a fan guide');
}
(HTML.match(/unofficial [a-z]+ guide/g) || []).forEach(function(x){
  if(x !== "unofficial fan guide") fail('unexpected self-description: "' + x + '"');
});

/* ---------- 27. The path is actually load-bearing --------------------- */

if(/data-mode="\047?\+?m\[0\]/.test(HTML) || /<div class="modes">'\+\s*\n?\s*\[\['continuity'/.test(HTML)){
  fail("the three-way mode switcher is back in The Path — the path is chosen once, " +
       "from Home or Progress, not re-answered on every visit");
}
/* The card that carried this became a segmented control in 1.5.0. It repeated
   the header exactly and its only unique content was a Change button. */
if(/class="pathcard"/.test(HTML)){
  fail("the path card is back on Home " + "\u2014" + " it duplicated the header entirely");
}
if(!/class="pathseg"/.test(HTML)){
  fail("Home has no path control " + "\u2014" + " the chosen ordering would be unchangeable " +
       "without clearing progress");
}
if(!/class="pick big/.test(HTML)){
  fail("the first-run chooser is gone " + "\u2014" + " a new arrival would have no way to pick");
}
/* A view must be reversible. Offering only "make this mine" left a reload as
   the only way back, since mode is not persisted. */
if(!/data-act="mypath"/.test(HTML)){
  fail("the viewing banner has no way back to the chosen path — entering a view " +
       "from a Home card would be one-way until a reload");
}
/* mode mirrors path only. Falling back to S.mode assigned a path to anyone
   who ticked something before choosing. */
if(/mode:\s*S\.path\s*\|\|/.test(HTML)){
  fail("persist() falls back to S.mode when no path is chosen — a new user who "
       + "ticks anything before picking would be silently assigned a path");
}
if(!/mode:\s*S\.path\s*,/.test(HTML)){
  fail("persist() no longer mirrors path into mode — a downgrade to 1.1.0 would "
       + "open on its own default instead of the chosen ordering");
}

/* Two renderings of PATHS by design as of 1.5.0: the big blocks on first run,
   and the segmented control once a path exists. A third would mean a setting
   with three places to change it. */
var pathBlocks = (HTML.match(/PATHS\.map\(/g) || []).length;
if(pathBlocks !== 2){
  fail("PATHS.map appears " + pathBlocks + " times, expected 2 " +
       "(the first-run blocks and masterChooser)");
}
/* One block on every tab. It used to be split three ways \u2014 the path control on
   Home only, a lone scope switch at the top of The Path and Progress, and
   nothing on Next up \u2014 so which controls you had depended on where you were. */
if(!/function masterChooser\s*\(/.test(HTML)){
  fail("masterChooser() is gone");
}
(function(){
  var calls = (HTML.match(/masterChooser\(\)/g) || []).length - 1;
  if(calls !== 5){
    fail("masterChooser() is rendered " + calls + " times, expected 5 \u2014 Home, " +
         "Next up and its finished state, The Path, and Progress");
  }
  ["viewHome", "viewNext", "viewWatch", "viewStats"].forEach(function(v){
    if(!/masterChooser\(\)/.test(optionalFn(v))){
      fail(v + "() does not render the master chooser");
    }
  });
  /* The half-block it replaced must not come back beside it. */
  ["viewWatch", "viewStats"].forEach(function(v){
    if(/[^r]\bscopeSwitch\(/.test(optionalFn(v))){
      fail(v + "() still renders a lone scope switch alongside the master chooser");
    }
  });
})();

/* Nothing emits data-mode since the switcher went in 1.2.0. */
if(/dataset\.mode/.test(HTML)){
  fail("the data-mode click handler is back, but nothing renders data-mode — "
       + "dead code that reads as though the ordering is still switchable");
}

if(!/dataset\.tab === "watch" && S\.path/.test(HTML)){
  fail("tapping The Path tab no longer returns to the chosen path — a view " +
       "would outlive the visit that started it");
}

/* mode must stay OUT of what gets persisted as the path, or following someone
   else's shared link quietly rewrites your own ordering. */
if(/payload = JSON\.stringify\(\{[^}]*mode:S\.mode/.test(HTML)){
  fail("persist() writes S.mode as the path — viewing a shared #life link would " +
       "silently overwrite the path the user chose");
}

/* ---------- 28. Theme reaches the chrome, not just the CSS ------------ */
/* The status bar is painted from <meta name="theme-color">, which CSS cannot
   touch. Switch theme without updating it and an installed app shows a header
   in one colour under a system bar in the other. */

var barM = HTML.match(/var THEMEBAR = \{([^}]*)\}/);
if(!barM){
  fail("THEMEBAR is missing — theme changes would leave the status bar behind");
} else {
  themes.forEach(function(t){
    if(barM[1].indexOf(t[0] + ":") < 0){
      fail('theme "' + t[0] + '" has no THEMEBAR colour — the status bar would not follow it');
    }
  });
}
if(HTML.indexOf("applyTheme()") < 0) fail("applyTheme() is never called");
if(!/background:var\(--hdr\)/.test(HTML) || !/background:var\(--tabbg\)/.test(HTML)){
  fail("the header or tab bar is back on a hardcoded rgba — a theme cannot reach it");
}

/* ---------- 29. Weight budget ----------------------------------------- */
/* The premise is arithmetic, so: arithmetic. It should hurt to add a library. */

var zlib = require("zlib");
var rawKB  = Buffer.byteLength(HTML) / 1024;
var gzipKB = zlib.gzipSync(Buffer.from(HTML)).length / 1024;
note("index.html " + rawKB.toFixed(1) + " KB raw, " + gzipKB.toFixed(1) + " KB gzipped");
if(rawKB > 150) fail("index.html is " + rawKB.toFixed(1) + " KB raw, over the 150 KB budget");
if(gzipKB > 50) fail("index.html is " + gzipKB.toFixed(1) + " KB gzipped, over the 50 KB budget");

/* Zero runtime dependencies is a promise in the README. The only third-party
   code is the vendored QR encoder; nothing may be fetched at runtime. */
var ext = HTML.match(/<script[^>]+src="https?:\/\/[^"]+"/g) || [];
ext.forEach(function(tag){
  if(tag.indexOf("cloudflareinsights") < 0){
    fail("index.html loads external script " + tag + " — the app must run with no network");
  }
});

/* ---------- 30. Documented spoiler order holds ------------------------ */
/* By-universe renders in array order, so the array IS the watch order. Group
   notes make promises about it \u2014 the DCAU note says to save Beyond for the end
   because JLU's "Epilogue" spoils it, while the array put Beyond third. Prose
   cannot enforce itself. */

var pos = {};
sandbox.PATH.forEach(function(g, gi){
  g.films.forEach(function(f, ix){ pos[f.i] = gi * 1000 + ix; });
});

var SPOILERS = [
  ["justice-league-unlimited-season-3-2006",
   ["batman-beyond-the-movie-1999", "batman-beyond-season-1-1999",
    "batman-beyond-season-2-2000", "batman-beyond-season-3-2000",
    "the-zeta-project-seasons-1-2-2001", "batman-beyond-return-of-the-joker-2000"],
   "JLU 'Epilogue' spoils Batman Beyond"],
  ["batman-the-animated-series-season-1-1992",
   ["batman-mask-of-the-phantasm-1993", "batman-mr-freeze-subzero-1998"],
   "Phantasm and SubZero drop into the series, not ahead of it"],
  ["batman-beyond-season-3-2000",
   ["batman-beyond-return-of-the-joker-2000"],
   "Return of the Joker closes Beyond"]
];

SPOILERS.forEach(function(rule){
  var first = rule[0], after = rule[1], why = rule[2];
  if(!(first in pos)){ fail("spoiler rule references a missing id: " + first); return; }
  after.forEach(function(id){
    if(!(id in pos)){ fail("spoiler rule references a missing id: " + id); return; }
    if(pos[id] < pos[first]){
      fail("watch order spoils itself: " + id + " comes before " + first + " \u2014 " + why);
    }
  });
});
note("spoiler rules checked: " + SPOILERS.length);

/* ---------- 31. The README describes the app that exists -------------- */
/* 1.2.4 removed the QR; three README passages kept describing it, including a
   full licence block for code no longer in the repo. Docs drift is invisible
   until a reader trips on it, so the check is mechanical. */

var README = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
var readmeStale = ["QR", "qrcode", "scannable", "Kazuhiko"];
readmeStale.forEach(function(term){
  if(README.indexOf(term) >= 0){
    fail("README still mentions \"" + term + "\" — the QR was removed in 1.2.4");
  }
});

/* ---------- 32. No brand names in the catalogue or the UI ------------- */
/* Nineteen of 27 groups named HBO Max, rendered up to three times each \u2014 forty
   repetitions of one brand down a single scroll. The strings also rotted:
   availability changes monthly and differs by country. One unnamed link now
   does the job. This stops them returning one entry at a time. */

var BRANDS = ["HBO Max", "Netflix", "Prime Video", "Apple TV", "Disney+", "Hulu",
              "Paramount+", "Peacock", "Fandango", "Amazon", "Crunchyroll", "Tubi"];
var haystack = slice("var PATH = [", "var ERAS") + "\n" + fn("watchLinks");
BRANDS.forEach(function(b){
  if(haystack.indexOf(b) >= 0){
    fail('"' + b + '" is back in the catalogue or the watch link \u2014 the app names no services');
  }
});
/* A search engine, not an aggregator: one URL shape everywhere, no country in
   the path and nothing to verify per market. Three attempts at building an
   aggregator URL were wrong before this \u2014 a region-less path, then an
   ISO-derived country (the UK is /uk, not /gb). Extract the function and run
   it; grepping missed both of those. */

var watchSrc = fn("watchUrl");
if(!watchSrc) fail("watchUrl() is gone \u2014 nothing builds the watch link");
/* watchUrl() reads titleYear(), which reads FILMS. Loading it alone used to
   work and silently stopped in 1.3.7; the sandbox now carries the whole chain. */
sandbox.FILMS = FILMS;
sandbox.TITLEYEAR = null;
if(!/function titleYear\s*\(/.test(HTML)){
  fail("titleYear() is gone \u2014 the watch link would lose its year");
  vm.runInContext("function titleYear(){ return 0; }\n" + watchSrc, sandbox);
} else {
  vm.runInContext(fn("titleYear") + "\n" + watchSrc, sandbox);
}

["Batman: Soul of the Dragon", "Teen Titans Go! vs. Teen Titans", "Harley Quinn"].forEach(function(t){
  var u = sandbox.watchUrl(t);
  if(u.indexOf("https://search.brave.com/search?q=") !== 0){
    fail("the watch link is not a Brave search \u2014 " + u);
  }
  if(u.indexOf(encodeURIComponent("where to watch ")) < 0){
    fail('the query must lead with "where to watch" \u2014 ' + u);
  }
  if(u.indexOf(encodeURIComponent(t)) < 0){
    fail("the title is not encoded into the query \u2014 " + u);
  }
});

/* No country, no locale, nothing that can 404 per market. */
var u0 = sandbox.watchUrl("Batman");
if(/\/(us|uy|uk|gb|br|de|fr|mx|es)\//.test(u0)){
  fail("the watch link carries a country path again \u2014 " + u0);
}
if(/justwatch/i.test(HTML)){
  fail("justwatch is back in index.html \u2014 1.3.2 moved to a search engine");
}
if(/google\.com\/search/.test(HTML)){
  fail("the watch link points at Google \u2014 it must be Brave");
}
if((HTML.match(/class="lnk"/g) || []).length !== 1){
  fail("the entry link row is not a single link");
}

/* Right-aligned in both places it renders: the hero and the detail panel. */
if(!/\.linkrow\{[^}]*justify-content:flex-end/.test(HTML)){
  fail("the watch link is no longer right-aligned");
}

/* ---------- 33. One tagline, everywhere ------------------------------- */
/* It lived in six places carrying three different strings. Six copies that can
   disagree is the same shape of bug the README drift was. */

var TAGLINE = "One path through every Batman";
/* <title> gave the tagline up in 1.3.8: it is the one string search reads, and
   nobody types "path". The tagline holds everywhere a human sees it \u2014 the
   wordmark, shared links, the README. Each location is now checked against its
   own string; testing all three against the whole document meant one surviving
   copy could satisfy the other two. */
var titleTag = (HTML.match(/<title>([^<]+)<\/title>/) || [])[1] || "";
var ogTitle  = (HTML.match(/<meta property="og:title" content="([^"]+)"/) || [])[1] || "";
[["og:title", ogTitle], ["README headline", README]].forEach(function(pair){
  if(pair[1].indexOf(TAGLINE) < 0){
    fail(pair[0] + " does not carry the tagline \"" + TAGLINE + "\"");
  }
});
if(titleTag.indexOf("Night Watcher") < 0){
  fail("<title> does not name the app \u2014 it is what search results show");
}
if(titleTag.indexOf(TAGLINE) >= 0){
  fail("<title> carries the tagline again \u2014 1.3.8 traded it for words people " +
       "actually search, and og:title keeps it for shares");
}
["The Animated Dark Knight", "Gotham City life"].forEach(function(dead){
  if(HTML.indexOf(dead) >= 0 || README.indexOf(dead) >= 0){
    fail('retired tagline "' + dead + '" is still present');
  }
});
/* This matched two exact phrases, both already reworded, so it sailed past
   "Every Batman story ever animated" in the first-run intro and "the complete
   animated Batman" on the finished state for a whole release. The rule is
   about the word used as a limit on the catalogue, not about one sentence \u2014
   so the scan is now the whole file, with the phrases narrow enough that a
   description saying something is animated does not trip it. */
(function(){
  var LIMITS = [/\bever animated\b/i, /\ball animated\b/i, /\bevery animated\b/i,
                /\bcomplete animated\b/i, /\bthe animated Batman\b/i,
                /\banimated catalogue\b/i, /\bonly animated\b/i,
                /\banimated only\b/i, /\bBatman ever animated\b/i];
  [["index.html", HTML], ["README.md", README]].forEach(function(src){
    LIMITS.forEach(function(re){
      var hit = src[1].match(re);
      if(hit){
        var at = src[1].indexOf(hit[0]);
        fail(src[0] + ' claims the catalogue is animated only: "' + hit[0] + '" in ' +
             src[1].slice(Math.max(0, at - 40), at + 40).replace(/\s+/g, " "));
      }
    });
  });
})();

/* ---------- 34. Activity is reachable from Next up -------------------- */
/* Next up is where things get ticked, and the card advances the instant you
   tick one \u2014 so rating meant hunting the title down on The Path. Activity
   keeps the last five ticks rateable in place. */

if(/ratePrompt/.test(HTML)){
  fail("ratePrompt survives \u2014 1.3.4 replaced it with Activity and left no " +
       "second place for the same idea to drift out of sync");
}
if(/rateprompt/.test(HTML)){
  fail(".rateprompt CSS survives with no consumer");
}
if(!/function activityBlock\s*\(/.test(HTML)){
  fail("activityBlock() is gone \u2014 marking something watched on Next up would again " +
       "leave no way to rate it without going to The Path");
}
if(!/\+\s*activityBlock\(\)/.test(HTML)){
  fail("activityBlock() is never concatenated into a view \u2014 it is defined and " +
       "not rendered");
}
/* Home ends at the universe grid. The old block was the second place the same
   log was drawn, and two renderings of one list is how they diverge. */
if(/Recently logged/.test(HTML)){
  fail("\"Recently logged\" survives \u2014 Activity is the only place the log is drawn");
}
if(/\.recent\{/.test(HTML)){
  fail(".recent CSS survives with no consumer");
}
/* The hero rates in place as of 1.4.1 — the same star row The Path carries,
   which marks watched as a side effect. */
if(!/'<div class="herorate">'\+starRow\(f\)/.test(HTML)){
  fail("the hero has no star row " + "—" + " rating means leaving Next up again");
}
/* A 34px star beside a full-width button will be mis-tapped. The undo has to
   be on the same screen, which is what the tick on each Activity row is for. */
if(!/class="tick" data-act="watched"[^\n]*aria-label="Remove /.test(HTML)){
  fail("Activity rows have no tick " + "—" + " a mis-tapped star could not be undone");
}
if(!/Recent activity/.test(HTML)){
  fail("the Activity heading is gone");
}
/* The legend defines badges that render only on The Path. */
if(!/function legendBlock\s*\(/.test(HTML)) fail("legendBlock() is gone");
if(!/return html \+ legendBlock\(\);/.test(HTML)){
  fail("The Path does not end with the legend");
}
if(/legendBlock\(\)/.test(fn("viewStats"))){
  fail("the legend is back on Progress, where none of its badges render");
}

/* Five. A longer list turns Next up into a history page. */
var amax = HTML.match(/var ACTIVITYMAX = (\d+);/);
if(!amax || amax[1] !== "5"){
  fail("ACTIVITYMAX is " + (amax ? amax[1] : "missing") + ", expected 5");
}
{
  var ab = optionalFn("activityBlock", "marking something watched on Next up would " +
                      "again leave no way to rate it without going to The Path");
  /* Scope is a queue control. Activity is history, and must not consult it. */
  if(/visible\s*\(/.test(ab) || /S\.scope/.test(ab)){
    fail("activityBlock() consults scope \u2014 history must not hide what you logged");
  }
  /* The block renders controls; it must not write progress itself. The tick
     added in 1.4.1 goes through the same delegated handler as every other. */
  if(/S\.watched\s*\[[^\]]*\]\s*=|S\.skipped\s*\[[^\]]*\]\s*=|markWatched\(/.test(ab)){
    fail("activityBlock() writes progress directly instead of rendering a control");
  }
}

/* ---------- 35. The log holds one entry per id ------------------------ */
/* Not reproducible through any reachable write, but saved payloads also arrive
   hand-edited and from other builds. Enforced on read, so it holds regardless. */

var dedupeLog = new vm.Script(
  optionalFn("dedupeLog", "a saved payload could hold two entries for one id") +
  "\ntypeof dedupeLog === 'function' ? dedupeLog : function(a){ return a; };"
).runInNewContext({});
var dl = dedupeLog([{id:"a",ts:300},{id:"b",ts:200},{id:"a",ts:100},{id:"a",ts:900}]);
if(dl.length !== 2) fail("dedupeLog left " + dl.length + " entries, expected 2");
if(dl.map(function(e){ return e.id; }).join(",") !== "a,b"){
  fail("dedupeLog did not preserve first-seen order: " + dl.map(function(e){return e.id;}));
}
if(dl[0].ts !== 100) fail("dedupeLog kept ts " + dl[0].ts + ", expected the earliest (100)");
if(JSON.stringify(dedupeLog(dl)) !== JSON.stringify(dl)) fail("dedupeLog is not idempotent");
if(dedupeLog([null, {ts:1}, {id:"a",ts:1}]).length !== 1) fail("dedupeLog admitted a junk entry");
if(!/dedupeLog\(Array\.isArray\(o\.log\)/.test(HTML)){
  fail("restore() does not pass the saved log through dedupeLog()");
}

if(!/function starRow\s*\(/.test(HTML)){
  fail("starRow() is gone \u2014 the star markup would be duplicated again");
}
if((HTML.match(/data-act="rate"/g) || []).length !== 1){
  fail("the star markup exists in more than one place \u2014 it belongs in starRow()");
}

/* ---------- 36. The Path collapses, and remembers --------------------- */
/* 28 continuities is a long scroll. The control is only worth having if the
   state survives a reload, which is why groupOpen stopped being session state. */

if(!/data-act="allgroups"/.test(HTML)){
  fail("the collapse-all control is gone from The Path");
}
if(!/act === "allgroups"/.test(HTML)){
  fail("the collapse-all control has no handler");
}
["anyOpen", "setAllGroups", "revealHero"].forEach(function(name){
  if(!new RegExp("function\\s+" + name + "\\s*\\(").test(HTML)) fail(name + "() is gone");
});
if(!/groupOpen:S\.groupOpen/.test(HTML)){
  fail("groupOpen is not written to the saved payload \u2014 collapse state dies on reload");
}
if(!/if\(o\.groupOpen && typeof o\.groupOpen === "object"\)/.test(HTML)){
  fail("restore() does not read the saved groupOpen back \u2014 collapse state would " +
       "be written and never used");
}
/* Absent means open. Persisting anything but false would invert the default on
   the next build that adds a group. */
var gsave = HTML.slice(HTML.indexOf("if(o.groupOpen"), HTML.indexOf("if(o.groupOpen") + 260);
if(!/=== false/.test(gsave)){
  fail("restore() accepts non-false groupOpen values \u2014 only false is meaningful");
}
/* Every mutation of groupOpen must persist, or the state is half-remembered.
   The scan stops at the next branch or closing brace: an early version let
   act==="mypath" borrow the persist() belonging to act==="repath" below it. */
var lines = HTML.split("\n"), unsaved = [];
lines.forEach(function(l, i){
  if(!/S\.groupOpen(\[[^\]]*\])?\s*=(?!==)/.test(l)) return;
  if(/o\.groupOpen|theme:"dark"/.test(l)) return;
  /* setAllGroups() is a pure helper; the guard below proves its caller saves. */
  if(/function setAllGroups/.test(lines[i - 1] || "") ||
     /function setAllGroups/.test(lines[i - 2] || "")) return;
  var j, saved = false;
  for(j = i; j < Math.min(i + 6, lines.length); j++){
    if(j > i && /^\s*(\}|else\b)/.test(lines[j])) break;
    if(/persist\(\)/.test(lines[j])){ saved = true; break; }
  }
  if(!saved) unsaved.push("line " + (i + 1) + ": " + l.trim().slice(0, 70));
});
if(unsaved.length) fail("groupOpen written without persist():\n     " + unsaved.join("\n     "));
if(!/setAllGroups\(.*?\);\s*persist\(\)/.test(HTML)){
  fail("the collapse-all handler does not persist what it just set");
}

/* revealHero must not fight a deliberate collapse-all. */
if(/function revealHero\s*\(/.test(HTML)){
  var rh = fn("revealHero");
  if(!/anyOpen\(\)/.test(rh)){
    fail("revealHero() does not check anyOpen() \u2014 it would re-open a group on " +
         "every visit and make collapse-all useless");
  }
}

/* ---------- 37. Progress does not restate The Path -------------------- */
/* The list grew without limit and pushed the backup tools off the screen. */

if(/Your ratings/.test(HTML)){
  fail("\"Your ratings\" survives in Progress \u2014 The Path carries the same stars");
}
if((HTML.match(/stars\(S\.rated\[/g) || []).length !== 1){
  fail("the rating stars are rendered in " +
       (HTML.match(/stars\(S\.rated\[/g) || []).length + " places, expected 1 (The Path)");
}

/* ---------- 38. What a crawler and a shared link see ------------------ */
/* One URL, stated once. Two addresses serving the same page compete with each
   other, and the app has had two since the Worker went up. */

var canon = HTML.match(/<link rel="canonical" href="([^"]+)"/);
if(!canon) fail("no canonical URL \u2014 the Pages address and the Worker redirect " +
                "would be indexed as separate pages");
var ogurl = HTML.match(/<meta property="og:url" content="([^"]+)"/);
if(canon && ogurl && canon[1] !== ogurl[1]){
  fail("canonical is " + canon[1] + " but og:url is " + ogurl[1] + " \u2014 a shared " +
       "link and an indexed link must be the same page");
}

var ld = HTML.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if(!ld){
  fail("the JSON-LD block is gone");
} else {
  var parsed = null;
  try { parsed = JSON.parse(ld[1]); }
  catch(e){ fail("JSON-LD does not parse: " + e.message); }
  if(parsed && parsed["@graph"]){
    var types = parsed["@graph"].map(function(n){ return n["@type"]; });
    ["WebSite", "WebApplication"].forEach(function(t){
      if(types.indexOf(t) < 0) fail("JSON-LD has no " + t + " node (found: " + types.join(", ") + ")");
    });
    /* Without a declared site name Google guessed one, and what it guessed
       was "GitHub Pages documentation". */
    var site = parsed["@graph"].filter(function(n){ return n["@type"] === "WebSite"; })[0];
    if(site && site.name !== "Night Watcher") fail('WebSite name is "' + site.name + '"');
    parsed = parsed["@graph"].filter(function(n){ return n["@type"] === "WebApplication"; })[0] || {};
  }
  if(parsed){
    var title = (HTML.match(/<title>([^<]+)<\/title>/) || [])[1] || "";
    if(title.indexOf(parsed.name) < 0){
      fail("JSON-LD name \"" + parsed.name + "\" does not appear in the <title> \"" + title + "\"");
    }
    if(canon && parsed.url !== canon[1]){
      fail("JSON-LD url is " + parsed.url + ", canonical is " + canon[1]);
    }
  }
}
/* JSON-LD must stay inert: the no-third-party rule is about executable code,
   and a bare <script> here would also break the app's own script extraction. */
if(/<script type="application\/ld\+json"[^>]*src=/.test(HTML)){
  fail("the JSON-LD block loads an external file");
}

/* ---------- 39. What the app refuses to do is a feature --------------- */

if(!/<meta property="og:site_name" content="Night Watcher">/.test(HTML)){
  fail("og:site_name is gone " + "\u2014" + " without it the site name in results is a guess");
}
(function(){
  var ldm = HTML.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if(!ldm) return;
  var app;
  try {
    var o = JSON.parse(ldm[1]);
    app = (o["@graph"] || [o]).filter(function(n){ return n["@type"] === "WebApplication"; })[0];
  } catch(e){ return; }
  if(!app || !app.featureList){ fail("JSON-LD has no featureList"); return; }
  var joined = app.featureList.join(" ").toLowerCase();
  ["no account", "no advertising", "never sent", "offline"].forEach(function(claim){
    if(joined.indexOf(claim) < 0){
      fail('featureList no longer states "' + claim + '" ' + "\u2014" + ' it is the whole pitch');
    }
  });
  if(app.isAccessibleForFree !== true) fail("JSON-LD no longer says the app is free");
})();

/* ---------- 40. One scoreboard ---------------------------------------- */
/* Home and Progress drew their own, with a different third stat each. */

if((HTML.match(/class="bigstat"/g) || []).length !== 1){
  fail("the scoreboard markup exists in " + (HTML.match(/class="bigstat"/g) || []).length +
       " places " + "\u2014" + " it is one component");
}
if(!/function scoreboard\s*\(/.test(HTML)) fail("scoreboard() is gone");
if((HTML.match(/[^n] scoreboard\(c\)|\+scoreboard\(c\)/g) || []).length !== 2){
  fail("scoreboard() is not rendered on both Home and Progress");
}
["sc-done", "sc-left", "sc-skip"].forEach(function(cl){
  if(HTML.indexOf(cl) < 0) fail("the scoreboard lost its ." + cl + " colour hook");
});
if(!/\.bigstat div\{[^}]*text-align:center/.test(HTML)){
  fail("scoreboard numbers are no longer centred");
}
/* Palette only. A new hex here would be a second identity. */
var scCss = HTML.match(/\.bigstat \.sc-[a-z]+\{[^}]*\}/g) || [];
scCss.forEach(function(rule){
  if(!/var\(--[a-z0-9]+\)/.test(rule) || /#[0-9A-Fa-f]{3,6}/.test(rule)){
    fail("scoreboard colour is not from the palette: " + rule);
  }
});

/* ---------- 41. The restore box has a real label ---------------------- */
/* A placeholder is not a label: it disappears the moment anyone types. */

if(!/<label class="bklab" for="restorebox">/.test(HTML)){
  fail("the restore box is labelled by its placeholder only (WCAG 3.3.2)");
}

/* ---------- 42. The page asks nothing of anyone else ------------------ */
/* Until 1.4.2 the fonts came from Google's CDN, so every visit told a third
   party the page had loaded \u2014 on an app whose own structured data says nothing
   tracks you. Cloudflare's beacon is the one deliberate exception and is
   disclosed in the footer. */

(function(){
  var ALLOWED = ["static.cloudflareinsights.com", "cloudflareinsights.com",
                 "6ummy-dev.github.io", "search.brave.com",
                 "schema.org", "www.w3.org", "www.sitemaps.org", "github.com"];
  /* Every file that ships, not just index.html. sw.js kept Google's font
     origins in a dead cache branch from 1.4.2 to 1.5.0 because this scan only
     ever read the page. A service worker reaches the network too. */
  var origins = {};
  ["index.html", "sw.js", "manifest.json", "robots.txt", "sitemap.xml"].forEach(function(f){
    var fp = path.join(PUBLIC, f);
    if(!fs.existsSync(fp)) return;
    var txt = fs.readFileSync(fp, "utf8");
    (txt.match(/https?:\/\/[a-z0-9.-]+/gi) || []).forEach(function(u){
      var host = u.replace(/^https?:\/\//, "").toLowerCase();
      origins[host] = origins[host] || f;
    });
  });
  Object.keys(origins).forEach(function(o){
    if(ALLOWED.indexOf(o) < 0){
      fail(origins[o] + " reaches out to " + o + " \u2014 every origin here is a third " +
           "party told that someone opened the page");
    }
  });
  if(Object.keys(origins).some(function(o){ return /fonts\.(googleapis|gstatic)/.test(o); })){
    fail("the fonts are back on Google's CDN");
  }
})();

/* Self-hosting is redistribution, and OFL requires the licence to travel. */
["limelight-latin-400-normal", "anton-latin-400-normal",
 "ibm-plex-sans-latin-400-normal", "ibm-plex-sans-latin-600-normal",
 "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-600-normal"].forEach(function(f){
  if(HTML.indexOf("fonts/" + f + ".woff2") < 0) fail("@font-face lost " + f);
  if(!fs.existsSync(path.join(PUBLIC, "fonts", f + ".woff2"))) fail("missing font file: " + f + ".woff2");
});
if(!fs.existsSync(path.join(PUBLIC, "fonts", "OFL.txt"))){
  fail("fonts/OFL.txt is gone \u2014 OFL requires the licence to ship with the fonts");
}
/* A weight declared and never loaded is a faux-bold; a weight loaded and never
   used is a wasted download. 500 was the latter until 1.4.2. */
(function(){
  var used = {}, declared = {};
  /* The @font-face blocks have to come out of the haystack first. Scanning the
     whole file for font-weight put every declared weight into "used" as well,
     which made both checks below incapable of failing. */
  var faces = HTML.match(/@font-face\{[^}]*\}/g) || [];
  faces.forEach(function(f){
    var m = f.match(/font-weight:(\d+)/);
    if(m) declared[m[1]] = true;
  });
  var rest = HTML;
  faces.forEach(function(f){ rest = rest.replace(f, ""); });
  (rest.match(/font-weight:(\d+)/g) || []).forEach(function(m){ used[m.split(":")[1]] = true; });
  Object.keys(used).forEach(function(w){
    if(w !== "400" && !declared[w]){
      fail("font-weight:" + w + " is used but no @font-face declares it \u2014 the " +
           "browser would fake it");
    }
  });
  Object.keys(declared).forEach(function(w){
    if(!used[w]) fail("@font-face declares weight " + w + ", which nothing uses");
  });
})();

/* ---------- 43. Content-Security-Policy ------------------------------- */
/* The hash changes with every edit to the script, so it has to be recomputed
   from the file rather than trusted. */

(function(){
  var meta = HTML.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
  if(!meta){ fail("the Content-Security-Policy meta tag is gone"); return; }
  var csp = meta[1];
  [["default-src", "'none'"], ["object-src", "'none'"],
   ["base-uri", "'none'"], ["form-action", "'none'"]].forEach(function(d){
    if(csp.indexOf(d[0] + " " + d[1]) < 0) fail("CSP no longer sets " + d[0] + " " + d[1]);
  });
  if(/'unsafe-eval'/.test(csp)) fail("CSP allows unsafe-eval");
  if(/script-src[^;]*'unsafe-inline'/.test(csp)){
    fail("CSP allows unsafe-inline scripts \u2014 the hash is there so it does not have to");
  }
  var declared = (csp.match(/'sha256-([A-Za-z0-9+/=]+)'/) || [])[1];
  if(!declared){ fail("CSP has no script hash"); return; }
  var body = (HTML.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
  var actual = require("crypto").createHash("sha256").update(body, "utf8").digest("base64");
  if(declared === actual) return;
  /* Any edit to the script invalidates the hash, and a stale one is not a
     cosmetic failure \u2014 the browser refuses to execute the app at all. --bless
     rewrites it, so the fix is one command rather than a manual paste. */
  if(BLESS){
    fs.writeFileSync(path.join(PUBLIC, "index.html"), HTML.replace("'sha256-" + declared + "'", "'sha256-" + actual + "'"));
    note("blessed the CSP script hash");
    return;
  }
  fail("the CSP script hash is stale \u2014 declared " + declared.slice(0, 12) +
       "..., actual " + actual.slice(0, 12) + "... The app would refuse to run. " +
       "Fix with: npm run bless");
})();
if(!/<meta name="referrer" content="strict-origin-when-cross-origin">/.test(HTML)){
  fail("the referrer policy is gone");
}
if(/target="_blank"(?![^>]*noreferrer)/.test(HTML)){
  fail('a target="_blank" link is missing rel="noreferrer"');
}

/* ---------- 44. Every watch link carries a year ----------------------- */
/* Thirteen titles repeat across the catalogue. Without a year they all resolve
   to whichever one the search engine thinks is more famous. */

var wu = fn("watchUrl");
if(!/titleYear\(/.test(wu)){
  fail("watchUrl() does not add a year \u2014 repeated titles would resolve to the " +
       "wrong show");
}
(function(){
  var byUrl = {};
  FILMS.forEach(function(f){
    var u = decodeURIComponent(sandbox.watchUrl(f.t));
    var y = sandbox.titleYear(f.t);
    if(u.indexOf(" " + y) < 0){
      fail("watch URL for \"" + f.t + "\" carries no year: " + u);
    }
    /* The earliest year for the title, not the entry's own \u2014 otherwise every
       season of a show asks a different question about the same show. */
    if(y !== Math.min.apply(null, FILMS.filter(function(g){ return g.t === f.t; })
                                       .map(function(g){ return g.y; }))){
      fail("watch URL for \"" + f.t + "\" uses " + y + ", not the title's first year");
    }
    byUrl[u] = byUrl[u] || {}; byUrl[u][f.t] = 1;
  });
  /* Seasons of one show sharing a URL is the design. Two different titles
     sharing one would mean a year failed to separate them. */
  var collided = Object.keys(byUrl).filter(function(u){ return Object.keys(byUrl[u]).length > 1; });
  if(collided.length){
    fail("two different titles share a watch URL: " + collided[0] + " \u2014 " +
         Object.keys(byUrl[collided[0]]).join(", "));
  }
})();

/* ---------- 45. The README lists every served file -------------------- */
/* Two files shipped in 1.3.7 and neither reached the table. The size figure had
   been wrong since 1.2.x for the same reason: prose about the repo drifts from
   the repo unless something compares them. */

(function(){
  var listed = {}, m, re = /\|\s*`([^`]+)`\s*\|/g;
  while((m = re.exec(README))) listed[m[1]] = true;
  /* Recursive as of 1.4.2: the flat version skipped directories, so docs/fonts/
     shipped seven undocumented files without the build noticing. */
  function walk(dir, prefix){
    var out = [];
    fs.readdirSync(dir).forEach(function(f){
      if(f.charAt(0) === ".") return;
      var full = path.join(dir, f), rel = prefix ? prefix + "/" + f : f;
      if(fs.statSync(full).isDirectory()) out = out.concat(walk(full, rel));
      else out.push(rel);
    });
    return out;
  }
  var onDisk = walk(PUBLIC, "").map(function(f){ return "docs/" + f; });
  /* The root half of the table was maintained by hand and drifted: LICENSE,
     SECURITY.md and package-lock.json all shipped in 1.4.2 undocumented. */
  ["LICENSE", "SECURITY.md", "README.md", "CHANGELOG.md", "package.json",
   "package-lock.json", "wrangler.jsonc", ".gitignore",
   ".github/workflows/qa.yml", "qa/guards.js", "qa/smoke.js",
   "qa/frozen-ids.json"].forEach(function(f){
    if(fs.existsSync(path.join(ROOT, f))) onDisk.push(f);
  });
  var missing = onDisk.filter(function(f){ return !listed[f]; });
  if(missing.length){
    fail("README's file table does not list: " + missing.join(", "));
  }
  var ghost = Object.keys(listed).filter(function(f){
    return !fs.existsSync(path.join(ROOT, f));
  });
  if(ghost.length){
    fail("README's file table lists files that do not exist: " + ghost.join(", "));
  }
})();

/* The sitemap and the structured data both claim a last-modified date, both
   are written by hand, and they drifted a day apart before 1.6.0 with nothing
   to catch it. One is a lie either way. */
(function(){
  var sm = fs.readFileSync(path.join(PUBLIC, "sitemap.xml"), "utf8");
  var last = (sm.match(/<lastmod>([\d-]+)<\/lastmod>/) || [])[1];
  var mod = (HTML.match(/"dateModified"\s*:\s*"([\d-]+)"/) || [])[1];
  if(!last){ fail("sitemap.xml states no lastmod"); return; }
  if(!mod){ fail("the JSON-LD states no dateModified"); return; }
  if(last !== mod){
    fail("sitemap.xml says the page changed on " + last + " and the JSON-LD says " +
         mod + " \u2014 both are hand-written and one of them is wrong");
  }
})();

/* ---------- 46. The README states the real weight --------------------- */
/* It drifts every release, and it is the first number anyone reads. */

var rmSize = README.match(/currently (\d+) KB \/ (\d+) KB/);
if(!rmSize){
  warn("README no longer states the current size");
} else {
  var realRaw = Math.round(Buffer.byteLength(HTML) / 1024);
  var realGz  = Math.round(require("zlib").gzipSync(Buffer.from(HTML), {level:9}).length / 1024);
  if(parseInt(rmSize[1], 10) !== realRaw || parseInt(rmSize[2], 10) !== realGz){
    fail("README says " + rmSize[1] + " KB / " + rmSize[2] + " KB, actual is " +
         realRaw + " KB / " + realGz + " KB");
  }
}

/* ---------- 47. The wordmark returns to the top ----------------------- */
if(!/id="topBtn"/.test(HTML)) fail("the wordmark is no longer a control");
if(HTML.indexOf('getElementById("topBtn")') < 0){
  fail("the wordmark has no click handler \u2014 tapping the title would do nothing");
}
if(!/<h1><button id="topBtn">/.test(HTML)){
  fail("the wordmark button is outside its h1 \u2014 the heading must stay a heading");
}

/* ---------- 48. The footer describes the link that exists ------------- */

/* ---------- 49. The card reads what it means ---------- */
/* Every row in Recent activity is watched \u2014 that is what puts it there. The
   tick drew as an empty ring until 1.4.3, which reads as "not watched" in a
   list of things you had just watched. 1.4.1 tested that the tick existed, was
   labelled, and worked. Nothing tested what it looked like. */

if(!/\.arow \.tick\{[^}]*background:var\(--bone\)/.test(HTML)){
  fail("the Activity tick is unfilled \u2014 it reads as unwatched on entries that " +
       "are watched by definition");
}
/* Stars sit over Mark watched, the watch link over Skip. */
if(!/<div class="herorow">/.test(HTML)){
  fail("the hero rows are not in a shared grid \u2014 stars and buttons would drift " +
       "out of alignment again");
}
(function(){
  var skip = (HTML.match(/\.heroacts \.no\{[^}]*flex:0 0 (\d+)%/) || [])[1];
  var link = (HTML.match(/\.herorow \.linkrow\{[^}]*flex:0 0 (\d+)%/) || [])[1];
  if(!skip || !link){ fail("cannot read the hero column widths"); return; }
  if(skip !== link){
    fail("the watch link is " + link + "% wide but Skip below it is " + skip +
         "% \u2014 they are meant to share an edge");
  }
})();
/* The detail panel on The Path shares .linkrow and still wants flex-end. */
if(!/\.linkrow\{[^}]*justify-content:flex-end/.test(HTML)){
  fail(".linkrow lost flex-end \u2014 the panel on The Path right-aligns its links");
}
/* Credit where it is due, in the one place the app talks about itself. */
if(!/kept by 6ummy/.test(HTML)) fail("the credit line is gone from the footer");

/* ---------- 50. Rating and progress stay separate ---------- */
/* rate() marked watched on both branches, so clearing a rating re-marked the
   entry \u2014 untick something, tap its lit star to clear the stale rating, and it
   came back watched. The bug is old; putting stars on the hero in 1.4.1 made it
   easy to reach. */

(function(){
  var src = optionalFn("rate", "nothing would record a rating");
  var box = { S:{watched:{}, skipped:{}, rated:{}, log:[]},
              clampRating:function(n){ n = parseInt(n,10); return (n>=1 && n<=5) ? n : 0; },
              persist:function(){}, render:function(){} };
  box.markWatched = function(id){
    if(box.S.watched[id]) return;
    box.S.watched[id] = 1;
    box.S.log.push({id:id, ts:1});
  };
  var rate = new vm.Script(src + "\nrate;").runInNewContext(box);

  rate("x", 4);
  if(box.S.rated.x !== 4) fail("rate() did not record the rating");
  if(!box.S.watched.x) fail("rating something did not mark it watched");

  /* Clearing it must leave progress alone... */
  rate("x", 4);
  if(box.S.rated.x !== undefined) fail("tapping the same star did not clear the rating");
  if(!box.S.watched.x) fail("clearing a rating unmarked the entry \u2014 it should not touch progress");

  /* ...and clearing on something unwatched must not mark it. */
  box.S.watched = {}; box.S.log = []; box.S.rated = {y:3};
  rate("y", 3);
  if(box.S.rated.y !== undefined) fail("the rating was not cleared");
  if(box.S.watched.y){
    fail("clearing a rating marked the entry watched \u2014 the exact bug 1.4.4 fixed");
  }
  if(box.S.log.length) fail("clearing a rating wrote a log entry");
})();

/* The label has to hold one line inside the column it shares with Skip. */
if(!/\.lnk\{[^}]*white-space:nowrap/.test(HTML)){
  fail('"Where to watch" can wrap again \u2014 it needs white-space:nowrap');
}
if(!/\.herorow \.lnk\{[^}]*font-size:9px/.test(HTML)){
  fail("the hero link is back at full size and will not fit its column");
}
if(!/@media \(max-width:360px\)/.test(HTML)){
  fail("the narrow-screen fallback is gone \u2014 nowrap would overflow instead");
}

/* The suites only protect the file if something runs them. */
(function(){
  var wf = path.join(ROOT, ".github", "workflows", "qa.yml");
  if(!fs.existsSync(wf)){
    fail("the QA workflow is gone \u2014 the guards would protect nothing between commits");
    return;
  }
  var y = fs.readFileSync(wf, "utf8");
  if(!/npm ci/.test(y)) fail("the workflow does not use npm ci, so it ignores the lockfile");
  if(!/npm test/.test(y)) fail("the workflow does not run npm test");
  if(!/permissions:\s*\n\s*contents: read/.test(y)){
    fail("the workflow does not pin itself to read-only permissions");
  }
})();

/* ---------- 51. Format is the second axis --------------------------- */
/* Format asks which kind of Batman, scope asks how much of it. Every entry
   inherits its format from its group, so nothing can be half-assigned. */

(function(){
  var mixed = PATH.filter(function(gr){
    return gr.fmt && gr.fmt !== "live" && gr.fmt !== "anim";
  });
  if(mixed.length) fail("group " + mixed[0].n + ' has an unknown fmt "' + mixed[0].fmt + '"');
  if(!/fmt:\(g\.fmt \|\| "anim"\)/.test(HTML)){
    fail("entries no longer inherit format from their group");
  }
  /* Scoped to visible(). Testing the whole file passed on scopeNote()'s copy of
     the same expression, which is how a guard says one thing and checks another. */
  var vis = optionalFn("visible", "nothing would filter the catalogue");
  if(!/S\.format/.test(vis)){
    fail("visible() ignores format \u2014 every format would show everything");
  }
  if(!/S\.scope/.test(vis)){
    fail("visible() ignores scope");
  }
  if(!/S\.mode \+ "\|" \+ S\.scope \+ "\|" \+ S\.format/.test(HTML)){
    fail("the group cache key omits format \u2014 switching format would serve stale groups");
  }
  var live = FILMS.filter(function(f){ return f.fmt === "live"; });
  if(live.length < 12) fail("live-action entries dropped to " + live.length + ", expected at least 12");
  live.forEach(function(f){
    if(f.e === undefined) fail(f.id + " has no era");
    if(!tierOf(f)) fail(f.id + " resolves to no tier");
  });
  /* A continuous arc gets one era; a shared world splits by story. Knightfall
     set that precedent and the Nolan trilogy follows it. */
  var nolan = live.filter(function(f){ return f.gn === "29"; });
  if(nolan.length !== 3) fail("the Dark Knight Saga should hold 3 films, found " + nolan.length);
  if(nolan.some(function(f){ return f.e !== nolan[0].e; })){
    fail("the Nolan trilogy is split across eras \u2014 it is one continuous story");
  }
})();

/* ---------- 52. Nobody's world changes overnight -------------------- */
/* A save written before 1.5.0 has no format. Defaulting those people to All
   would grow the denominator and put a live-action film in Next up without
   them asking. This is the migration-bug shape: invisible in the data. */

if(!/S\.format = \["anim", "live", "all"\]\.indexOf\(o\.format\) >= 0 \? o\.format : "anim";/.test(HTML)){
  fail("restore() does not default an old save to Animated \u2014 existing progress " +
       "would silently gain 12 entries and a new denominator");
}
if(!/format:"all"/.test(HTML)){
  fail("a first visit no longer defaults to All \u2014 a newcomer would be shown " +
       "less than the app contains");
}
if(!/format:S\.format/.test(HTML)){
  fail("format is not persisted");
}

/* ---------- 53. Two questions, two control groups ------------------- */
/* Path asks how to order. Format and scope ask what to include, so they sit
   together \u2014 that grouping is what tells them apart without a label. */

if(!/function formatSwitch\s*\(/.test(HTML)) fail("formatSwitch() is gone");
if(!/function includeBlock\s*\(/.test(HTML)) fail("includeBlock() is gone");
if(!/class="includes"/.test(HTML)){
  fail("format and scope are no longer grouped \u2014 three loose selectors read as a " +
       "settings panel");
}
if(!/b\.dataset\.format/.test(HTML)) fail("nothing handles a format tap");
/* Counts must describe the format in view, not the whole catalogue. */
if(!/function scopeNote\s*\(/.test(HTML)) fail("scopeNote() is gone");
var sn = optionalFn("scopeNote");
if(!/S\.format/.test(sn)){
  fail("scopeNote() ignores format \u2014 it would claim 57 seasons while Live action " +
       "is selected");
}

/* ---------- 54. Home tells before it asks ------------------------- */
/* The intro used to render between the path control and the include block, so
   the two only read as a pair once the intro was gone \u2014 which made the layout
   depend on whether anything had been ticked. */

(function(){
  var home = optionalFn("viewHome", "there would be no Home");
  /* Two branches, two orders. The first-run page returns before the main one
     begins, so one indexOf sweep across the whole function reads the chooser's
     intro as the fresh Home's and passes on the wrong evidence. */
  var cut = home.indexOf("html += masterChooser();");
  if(cut < 0){ fail("Home no longer renders the master chooser"); return; }
  var first = home.slice(0, cut);
  var main  = home.slice(cut);

  /* First run is the only page a crawler ever sees, and it rendered 803
     characters of visible text containing "Bruce" twice and "Batman" never \u2014
     while the sentence that says it sat three branches down, waiting for a path
     to be chosen. It tells, then it asks. */
  var ib   = first.indexOf("introBlock()");
  var deck = first.indexOf("class=\"deck\"");
  if(ib < 0){
    fail("the first-run page no longer renders the intro \u2014 the landing page goes " +
         "back to never saying the word every search for it contains");
  } else if(deck >= 0 && ib > deck){
    fail("the first-run page asks before it tells \u2014 the intro renders below the " +
         "deck");
  }

  /* Controls first: they govern what every block below them shows, and reading
     them after the card meant meeting the answer before the question. */
  var order = ["masterChooser()", "introBlock()",
               "class=\"hero\"", "scoreboard(c)"];
  var at = order.map(function(k){ return main.indexOf(k); });
  at.forEach(function(pos, n){
    if(pos < 0) fail("Home no longer renders " + order[n]);
  });
  var k;
  for(k = 1; k < at.length; k++){
    if(at[k] >= 0 && at[k - 1] >= 0 && at[k] < at[k - 1]){
      fail("Home renders " + order[k] + " before " + order[k - 1] +
           " \u2014 the order is control, then what the controls govern");
    }
  }
})();

/* Both pages render the same paragraph, so it exists once. Copied, the two
   would drift and only one of them would be the one anybody reads. */
(function(){
  var n = (HTML.match(/class="ibody"/g) || []).length;
  if(n !== 1){
    fail("the intro paragraph is written " + n + " times \u2014 it renders on two pages " +
         "from one function or it renders two different things");
  }
  if(!/function introBlock\s*\(/.test(HTML)) fail("introBlock() is gone");
})();

/* The chosen path is marked in the belt colour, not the primary-action fill.
   Bone means "press this"; signal means "this one". */
if(!/\.pathseg button\[aria-pressed="true"\]\{[^}]*background:var\(--signal\)/.test(HTML)){
  fail("the chosen path is not marked in signal \u2014 it borrowed the fill the app " +
       "uses for primary actions");
}

/* ---------- 55. The chooser is a deck, not a list ---------------- */
/* Seven surfaces share one formula \u2014 border, card fill, rounded corner. Three
   more flat panels made the one screen that asks a question read as another
   list. These overlap; nothing else in the app does. */

(function(){
  var rule = (HTML.match(/\.pick\.big\{[^}]*\}/) || [""])[0];
  if(!rule){ fail(".pick.big has no styling of its own"); return; }
  if(!/margin:-\d+px/.test(rule)){
    fail("the chooser cards no longer overlap \u2014 they would read as a flat list " +
         "like every other panel");
  }
  if(!/box-shadow/.test(rule)){
    fail("the deck has no shadow, so nothing shows which card sits on which");
  }
  if(!/class="deck"/.test(HTML)) fail("the deck wrapper is gone");
  /* Signal marks the recommendation. On all three it would mean nothing. */
  /* Filled, not outlined: a signal border read as another card with a slightly
     different edge, which is why it had to be asked for twice. */
  if(!/\.pick\.big\.lead\{[^}]*background:var\(--signal\)/.test(HTML)){
    fail("the recommended card is not filled with signal \u2014 an outline does not " +
         "read as \"this one\"");
  }
  if(!/\.pick\.big\.lead\{[^}]*var\(--signal\)/.test(HTML)){
    fail("the recommended path is not marked \u2014 three equal cards leave a newcomer " +
         "guessing at the one decision the app has an opinion about");
  }
  var leads = (HTML.match(/i === 0 \? ' lead' : ''/g) || []).length;
  if(!leads) fail("nothing assigns the lead card");
  if(!/leadkick/.test(HTML)) fail("the lead card has no label saying why it leads");
  /* Signal must not also be a press state; that is what made it read as charged. */
  if(/\.pick\.big:active\{[^}]*var\(--signal\)/.test(HTML)){
    fail("signal is back on the press state \u2014 it either means \"this one\" or it " +
         "means nothing");
  }
})();

/* Height and type size are separable, and 1.5.7 proved it the expensive way.
   Shrinking the type to make format and scope read as secondary broke "Live
   action" and "Movies + Series" across two lines on every browser. So levels 2
   and 3 give back height and nothing else: same 9px type, same nowrap, same
   full width, same labels \u2014 a shorter block. The palette still carries which
   row is which; the height only says which was asked first. */
(function(){
  var sub = (HTML.match(/\.includes \.scope button\{[^}]*\}/) || [""])[0];
  if(!sub){ fail("the include controls have no styling of their own"); return; }
  if(!/white-space:nowrap/.test(sub)){
    fail("the format and scope labels can wrap again \u2014 \"Live action\" and " +
         "\"Movies + Series\" both broke across two lines");
  }
  /* The one dimension that must not move. Every regression here started by
     taking a pixel off the type to buy a pixel of height. */
  var subT = parseFloat((sub.match(/font-size:([\d.]+)px/) || [0, 0])[1]);
  if(subT !== 9){
    fail("the include labels are set at " + subT + "px instead of 9px \u2014 shrinking " +
         "the type is what wrapped both labels in 1.5.7; only the height gives");
  }
  var subH = parseFloat((sub.match(/min-height:([\d.]+)px/) || [0, 0])[1]);
  var pathH = parseFloat((HTML.match(/\.pathseg button\{[^}]*min-height:([\d.]+)px/) || [0, 0])[1]);
  if(!subH || !pathH){ fail("cannot read the chooser row heights"); return; }
  if(subH >= pathH){
    fail("the include controls are " + subH + "px against the path control's " +
         pathH + "px \u2014 levels 2 and 3 are meant to sit shorter than level 1");
  }
  /* Shorter, not shrunk to nothing: below the tap target it stops being a
     control you can hit. */
  if(subH < 30){
    fail("the include controls are " + subH + "px \u2014 under 30px they are no longer " +
         "a thumb-sized target");
  }
  var sel = (HTML.match(/\.includes \.scope button\[aria-pressed="true"\]\{[^}]*\}/) || [""])[0];
  if(/var\(--signal\)/.test(sel)){
    fail("the include controls mark their selection in signal \u2014 that is what " +
         "distinguishes the path row from them");
  }
  if(!/\.pathseg button\[aria-pressed="true"\]\{[^}]*background:var\(--signal\)/.test(HTML)){
    fail("the chosen path is no longer marked in signal");
  }
})();

/* The rows above Activity in Next up use the display face. Activity inherited
   body text, which is why its titles read as plain web type among styled ones \u2014
   and flex-wrap plus margin-left:auto put the stars on their own line and pushed
   them right, so nothing lined up with anything. */
(function(){
  var at = (HTML.match(/\.arow \.at\{[^}]*\}/) || [""])[0];
  if(!/var\(--disp\)/.test(at)){
    fail("Activity titles are not set in the display face \u2014 they read as plain " +
         "body text among the styled rows directly above them");
  }
  var row = (HTML.match(/\.arow\{[^}]*\}/) || [""])[0];
  if(!/display:grid/.test(row)){
    fail("the Activity row is wrapping flex again \u2014 the stars land on their own " +
         "line and right-align to nothing");
  }
  if(/\.arow \.stars\{[^}]*margin-left:auto/.test(HTML)){
    fail("the Activity stars are pushed right again instead of sitting under the title");
  }
  if(!/class="atop"/.test(HTML)) fail("the title and date are no longer grouped on one line");
  var tick = (HTML.match(/\.arow \.tick\{[^}]*\}/) || [""])[0];
  var tickW = parseFloat((tick.match(/width:([\d.]+)px/) || [0, 99])[1]);
  var pathTick = parseFloat((HTML.match(/\.tick\{[^}]*width:([\d.]+)px/) || [0, 0])[1]);
  if(!(tickW < pathTick)){
    fail("the Activity tick is " + tickW + "px, the same as the Path row's " + pathTick +
         "px \u2014 in this block it out-shouts the title it belongs to");
  }
})();
/* A sitemap with no lastmod gives Google nothing about freshness. */
if(!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(fs.readFileSync(path.join(PUBLIC, "sitemap.xml"), "utf8"))){
  fail("sitemap.xml has no lastmod");
}

/* Nine badges, six colours, three exact collisions: Core read as Animated,
   Optional as Short, Interactive as Live action. Colour now carries the value
   and shape carries the kind \u2014 tier filled, modifiers outlined, format dashed. */
(function(){
  var rules = {}, m, re = /\.bd\.([a-z]+)(?:,\.bd\.([a-z]+))?\{([^}]*)\}/g;
  while((m = re.exec(HTML))){
    rules[m[1]] = m[3];
    if(m[2]) rules[m[2]] = m[3];
  }
  ["e", "k", "o", "m", "u", "c", "s", "fmanim", "fmlive"].forEach(function(b){
    if(!rules[b]) fail("badge ." + b + " has no styling");
  });
  /* Tier is the answer to "should I watch this" and there is always exactly
     one, so it is the only filled kind. */
  ["e", "k"].forEach(function(b){
    if(!/background:var\(--/.test(rules[b] || "")) fail("tier badge ." + b + " is no longer filled");
  });
  ["m", "u", "c", "s"].forEach(function(b){
    if(/background:var\(--/.test(rules[b] || "")){
      fail("modifier badge ." + b + " is filled \u2014 filling is what marks the tier");
    }
  });
  if(!/border:1px dashed/.test(rules.fmanim || "")){
    fail("the format badges are not visually distinct from the modifiers");
  }
  /* No colour may carry two meanings. */
  var seen = {};
  Object.keys(rules).forEach(function(b){
    var c = (rules[b].match(/(?:^|;)color:var\(--([a-z0-9]+)\)/) || [])[1];
    var fill = (rules[b].match(/background:var\(--([a-z0-9]+)\)/) || [])[1];
    var key = (fill || "") + "/" + (c || "");
    if(seen[key] && !/^fm/.test(b) && !/^fm/.test(seen[key])){
      fail('badges .' + seen[key] + ' and .' + b + ' are drawn identically \u2014 one ' +
           'reads as the other');
    }
    seen[key] = b;
  });
})();

/* An entry should carry its badges wherever it appears. Activity was the one
   place a logged entry rendered with none. */
if(!/class="abadge"/.test(HTML)){
  fail("Recent activity rows carry no badges");
}
/* The queue reveals badges and the continuity on request \u2014 never the
   description, which is where the spoiler risk lives. */
if(!/data-act="peek"/.test(HTML)) fail("the Then rows are not tappable");
if(!/act === "peek"/.test(HTML)) fail("nothing handles a Then row tap");
(function(){
  var peek = HTML.match(/S\.open\[x\.id\][\s\S]{0,300}?'\)/);
  var blk = (HTML.match(/class="qpeek">'\+[^;]*/) || [""])[0];
  if(!/badges\(x\)/.test(blk)) fail("the Then reveal shows no badges");
  if(!/x\.gname/.test(blk)) fail("the Then reveal does not name the continuity");
  if(/x\.d\b/.test(blk)){
    fail("the Then reveal shows the description \u2014 nothing ahead of you may be spoiled");
  }
})();

/* The README described an older app for three releases: aggregator names gone
   since 1.3.2, fonts off Google's CDN since 1.4.2, and no mention of the format
   axis at all. All three were checkable against the code and none were checked.
   The size figure and the file table drifted the same way and have not since
   they were guarded, which is the whole argument for these. */
(function(){
  /* A service named in the README must be one the app actually reaches. */
  var SERVICES = ["JustWatch", "Prime Video", "Apple TV", "Netflix", "HBO Max",
                  "Disney+", "Hulu", "Max"];
  var resolver = optionalFn("watchUrl", "nothing builds the watch link");
  SERVICES.forEach(function(name){
    if(README.indexOf(name) >= 0 && resolver.indexOf(name) < 0){
      fail('README names "' + name + '" but watchUrl() does not use it');
    }
  });
  /* A font origin claimed must be one an @font-face actually declares. */
  var faces = (HTML.match(/@font-face\{[^}]*\}/g) || []).join(" ");
  if(/fonts\.google\.com|Google Fonts/.test(README) && !/fonts\.g(oogleapis|static)/.test(faces)){
    fail("README credits Google Fonts, but the fonts are self-hosted");
  }
  /* Every control the app renders must be described. A reader who cannot find
     a switch in the README does not know the app has it. */
  [["format switch", /formatSwitch\s*\(/, /Live action/i],
   ["scope switch", /scopeSwitch\s*\(/, /Movies \+ Series/i],
   ["path chooser", /masterChooser\s*\(/, /By universe|three honest|one path/i]
  ].forEach(function(t){
    if(t[1].test(HTML) && !t[2].test(README)){
      fail("the app renders a " + t[0] + " that the README never mentions");
    }
  });
})();

/* ---------- 56. Format is legible where it is ambiguous ----------- */
/* Only in All. Under one format every row would carry the same badge, which is
   a label for the switch you already set. */

if(!/S\.format === "all"/.test(optionalFn("badges", "nothing would label a tier"))){
  fail("badges() ignores format \u2014 in All you cannot tell an animated entry from a " +
       "live-action one");
}
if(!/\.bd\.fmanim,\.bd\.fmlive\{/.test(HTML) &&
   (!/\.bd\.fmlive[,{]/.test(HTML) || !/\.bd\.fmanim[,{]/.test(HTML))){
  fail("the format badges have no styling of their own");
}
if(!/function legendBlock/.test(HTML) ||
   !/class="bd fmanim"/.test(HTML) || !/class="bd fmlive"/.test(HTML)){
  fail("the legend does not explain the format badges");
}
(function(){
  var lg = optionalFn("legendBlock");
  if(!/S\.format === "all"/.test(lg)){
    fail("the legend shows the format row under every format, including the two " +
         "where no row carries the badge");
  }
})();

/* ---------- 57. The legend is made of badges ---------------------- */
/* 1.5.9 rebuilt the badges into three kinds \u2014 tier filled, modifiers outlined,
   format dashed \u2014 and guarded that no two draw alike. The legend went on
   drawing all nine as coloured words, so the key stopped looking like the thing
   it explains. The 1.5.9 legend audit checked the names and not the appearance:
   the same gap that let the Activity tick read as unwatched. A swatch that is
   not a badge is a second source for how a badge looks, and the second source
   is the one that turns out to be wrong. */

(function(){
  var lg = optionalFn("legendBlock", "nothing would explain the badges");
  if(/<i[ >]/.test(lg)){
    fail("the legend still draws its swatches as styled text \u2014 it cannot follow " +
         "the badges it explains");
  }
  if(/style="color:/.test(lg)){
    fail("the legend picks its own colours instead of wearing the badge classes, " +
         "which is how it came to describe a filled badge as an outlined one");
  }
  if(!/class="bd /.test(lg)){
    fail("the legend swatches carry no .bd class \u2014 legend and rows can drift " +
         "apart again");
  }
  if(!/BADGE\[/.test(lg) && !/BADGE\./.test(lg)){
    fail("the legend spells its own labels instead of reading BADGE \u2014 a renamed " +
         "badge would leave the key describing the old name");
  }
  /* The rule the old swatches were made of. Left behind, the next hand uses it. */
  if(/\.legend i\{/.test(HTML)){
    fail("the .legend i rule outlived the swatches it styled");
  }
})();

/* ---------- 58. Then is the tab, not the gap --------------------- */
/* Activity was a bordered, filled card and Then was a heading over borderless
   rows, so Next up read as card, gap, card \u2014 and the gap was the queue the tab
   exists for. Both are a heading and a stack of rules now. What tells them
   apart is that Then is numbered and Activity is dated, which is the difference
   that was actually there. */

(function(){
  var act = (HTML.match(/\.activity\{[^}]*\}/) || [""])[0];
  if(!act){ fail("the Activity block has no styling of its own"); return; }
  if(/border:|background:|border-radius:/.test(act)){
    fail("Activity is a card again \u2014 the only one on the tab, which is what made " +
         "Then read as the space between things");
  }
  /* Numbers are what is left saying Then is a sequence. */
  if(!/class="qn"/.test(HTML)){
    fail("the Then rows lost their numbers \u2014 with neither block in a container " +
         "they are all that separates a queue from a history");
  }
  if(!/\.arow\{[^}]*border-top:1px solid var\(--line\)/.test(HTML)){
    fail("the Activity rows have no rule between them, and with the card gone " +
         "there is nothing else holding them apart");
  }
  if(/\.arow:first-of-type\{[^}]*border-top:0/.test(HTML)){
    fail("the first Activity row drops its rule \u2014 that was the card's top edge " +
         "doing the work, and there is no card");
  }
  /* Same treatment means the same heading, not a nudged copy of it. */
  if(/\.activity \.qhead\{/.test(HTML)){
    fail("Activity's heading is offset from Then's \u2014 they are the same heading");
  }
})();

/* ---------- 59. Every badge is the same box ----------------------- */
/* The filled tiers carried no border while every outlined and dashed badge
   carried 1px, so a badge's box depended on its kind. In a flex row the boxes
   were forced level and the mismatch landed on the labels — 3px from the top
   on a filled badge, 4px on a bordered one, in every row that mixed them. In
   the legend, which centres instead of stretching, the boxes themselves came
   out 17.5px against 19.5px side by side. One transparent border on the base
   rule fixes both, and this is what stops it coming back. */

(function(){
  var base = (HTML.match(/\n\.bd\{[^}]*\}/) || [""])[0];
  if(!base){ fail("the base .bd rule is gone"); return; }
  var bw = base.match(/border:\s*(\d+)px/);
  if(!bw){
    fail("the base .bd rule sets no border — a filled badge is 2px smaller than " +
         "an outlined one, and their labels sit a pixel apart in every row that " +
         "carries both");
    return;
  }
  var baseW = parseInt(bw[1], 10);
  if(!/border:\s*\d+px\s+\w+\s+transparent/.test(base)){
    fail("the base .bd border is not transparent — it would draw on the filled " +
         "tiers, which are meant to read as fills");
  }
  var variants = HTML.match(/\.bd\.[a-z0-9]+[^{]*\{[^}]*\}/g) || [];
  if(variants.length < 5){ fail("the .bd variants are gone"); return; }
  variants.forEach(function(rule){
    var name = (rule.match(/\.bd\.([a-z0-9]+)/) || [])[1];
    var b = rule.match(/border(?:-width)?:\s*(\d+)px/);
    if(b && parseInt(b[1], 10) !== baseW){
      fail(".bd." + name + " draws a " + b[1] + "px border against the base rule's " +
           baseW + "px — every badge has to occupy the same box");
    }
    /* One rule owns the box. A variant that re-pads is the same bug moved. */
    if(/padding:/.test(rule)){
      fail(".bd." + name + " sets its own padding — the box comes from one rule " +
           "or the badges stop matching again");
    }
  });
  note("badge variants measured: " + variants.length);
})();

/* ---------- 60. One left edge for the group chips ---------------- */
/* .gnum had padding and no width, so the chip was as wide as its content. By
   universe zero-pads its tags ("01".."33") and the other two orderings do not,
   which made era 10 the one row in eleven whose title started 6px right of
   every other. Release order carries the same bug unfired — it reaches a
   second digit as soon as a 2030s bucket has an entry, and the catalogue
   already holds a 2028 title. */

(function(){
  var rule = (HTML.match(/\.gnum\{[^}]*\}/) || [""])[0];
  if(!rule){ fail(".gnum has no styling of its own"); return; }
  var mw = rule.match(/min-width:\s*(\d+)px/);
  if(!mw){
    fail("the group number chip has no min-width — a one-character tag makes a " +
         "narrower chip than a two-character one, and every title behind it moves");
    return;
  }
  if(!/text-align:center/.test(rule)){
    fail("the group number is not centred in its chip, so a short tag sits left " +
         "of a long one inside the same box");
  }
  if(parseInt(mw[1], 10) < 26){
    fail("the group chip is " + mw[1] + "px, under the 26px a two-character tag " +
         "needs at 10px mono");
  }
  /* The chip is sized for two characters. Numbering runs from 1, so a
     hundredth group of any kind would overflow it rather than align. */
  var counts = {ERAS: ERAS.length, DECADES: DECADES.length, PATH: PATH.length};
  Object.keys(counts).forEach(function(k){
    if(counts[k] > 99){
      fail(k + " has " + counts[k] + " entries — a three-character tag is wider " +
           "than the chip is sized for");
    }
  });
})();

/* ---------- 61. Contrast is measured on the ink that renders ----- */
/* Guard 20 reads the token named in color:var(--x) and measures that. It
   cannot see opacity, so a faded colour was checked at full strength. The
   format badges shipped as --dim at 80%: guard 20 measured --dim at 5.28:1 on
   --card2 and passed, while what rendered was 3.91:1. They appear on every row
   in All, which is the default format. .bd.s is --bone at 55% and passes at
   4.85:1 — by 0.35, with nothing watching.
   Same shape as the alignment bugs 1.6.1 fixed: a true fact about the rendered
   page that the build could not see.
   1.6.2 extends it. The single-rule version had a hole big enough to drive the
   Activity redesign through: a wrapper like .activity{opacity:.7} sets no
   colour of its own, so there was nothing to composite and it sailed past \u2014
   while every coloured descendant faded with it, five of seven palette tokens
   under AA. Any rule that fades and contains text is now measured against every
   ink the app uses, which is the conservative reading and the right one: a
   block fade applies to whatever ends up inside it. */

(function(){
  var SURFACES = ["ink", "sunk", "card", "card2"];
  function mix(fg, bg, a){
    var out = "#", i, v;
    for(i = 0; i < 3; i++){
      v = Math.round(a * parseInt(fg.substr(1 + i * 2, 2), 16) +
                     (1 - a) * parseInt(bg.substr(1 + i * 2, 2), 16));
      out += (v < 16 ? "0" : "") + v.toString(16);
    }
    return out;
  }
  var css = (HTML.match(/<style>([\s\S]*?)<\/style>/g) || []).join("\n")
              .replace(/\/\*[\s\S]*?\*\//g, "");
  var rules = css.match(/[^{}]+\{[^}]*\}/g) || [];
  /* Every token the app actually paints text with. A block fade reaches all of
     them, so a rule that fades without naming a colour is held to the worst. */
  var INKS = {}, SELINK = {};
  rules.forEach(function(r){
    var m = r.slice(r.indexOf("{")).match(/(?:^|[;{\s])color:\s*var\(--([a-z0-9]+)\)/);
    if(!m) return;
    INKS[m[1]] = 1;
    /* Which ink each selector ends up with, so a fade written in a separate
       rule can be measured against the colour that element really paints
       rather than against every colour in the app. */
    r.slice(0, r.indexOf("{")).split(",").forEach(function(one){
      one = one.trim().split("\n").pop().trim();
      if(one) SELINK[one] = m[1];
    });
  });
  var checked = 0, dimmed = 0;
  rules.forEach(function(rule){
    var body = rule.slice(rule.indexOf("{"));
    var tok = (body.match(/(?:^|[;{\s])color:\s*var\(--([a-z0-9]+)\)/) || [])[1];
    var op = parseFloat((body.match(/(?:^|[;{\s])opacity:\s*([\d.]+)/) || [0, 1])[1]);
    /* A fade with no colour of its own still fades everything under it. Skip
       only the rules that cannot contain text: a bare :active press state on a
       control, and a fade to nothing. */
    if(!tok && op < 1 && op > 0){
      var s0 = rule.slice(0, rule.indexOf("{")).trim().split("\n").pop().trim();
      if(/:active$|:hover$/.test(s0)) return;
      /* If this selector is given a colour elsewhere, that is the ink it fades
         \u2014 no need to assume the worst in the app. */
      var pool = SELINK[s0] ? [SELINK[s0]] : Object.keys(INKS);
      var worst = null, wname = "";
      pool.forEach(function(k){
        themes.forEach(function(t){
          var p = t[1]; if(!p[k]) return;
          SURFACES.forEach(function(s){
            if(SURFACES.indexOf(k) >= 0) return;
            var r2 = contrast(mix(p[k], p[s], op), p[s]);
            checked++;
            if(worst === null || r2 < worst){ worst = r2; wname = t[0] + ": --" + k + " on --" + s; }
          });
        });
      });
      if(worst !== null && worst < 4.5){
        fail(s0 + " fades everything inside it to opacity " + op + " \u2014 " + wname +
             " lands at " + worst.toFixed(2) + ":1, under the 4.5:1 AA floor. Step " +
             "the palette instead; a fade cannot be measured by the token name.");
      }
      if(worst !== null) dimmed++;
      return;
    }
    if(!tok || !(op < 1)) return;
    /* A surface token used as a colour sits on its own backdrop, not on these
       four — the lead card's ink on signal is the case. Guard 20 excludes
       them for the same reason. */
    if(SURFACES.indexOf(tok) >= 0) return;
    var sel = rule.slice(0, rule.indexOf("{")).trim().split("\n").pop().trim();
    dimmed++;
    themes.forEach(function(t){
      var name = t[0], p = t[1];
      if(!p[tok]) return;
      SURFACES.forEach(function(s){
        var eff = mix(p[tok], p[s], op);
        var r = contrast(eff, p[s]);
        checked++;
        if(r < 4.5){
          fail(name + ": " + sel + " renders --" + tok + " at opacity " + op +
               " over --" + s + " as " + eff + ", which is " + r.toFixed(2) +
               ":1 — under the 4.5:1 AA floor. Guard 20 measures --" + tok +
               " at full strength (" + contrast(p[tok], p[s]).toFixed(2) +
               ":1) and cannot see the fade.");
        }
      });
    });
  });
  note("faded inks composited: " + dimmed + " rule(s), " + checked + " colour/surface pairs");
})();

/* ---------- 62. Nothing focusable is small enough to zoom ---------- */
/* iOS Safari zooms the page whenever a focused input is under 16px, and the
   viewport meta deliberately sets no maximum-scale to block it — capping zoom
   fails WCAG 1.4.4, so the input has to be the thing that changes. Search
   shipped at 15px and the two backup fields at 11px, which meant every search
   on an iPhone opened with a zoom the reader had to pinch back out of. This is
   a rule with a number in it, so it belongs here rather than in a review. */

(function(){
  var css = (HTML.match(/<style>([\s\S]*?)<\/style>/g) || []).join("\n")
              .replace(/\/\*[\s\S]*?\*\//g, "");
  var rules = css.match(/[^{}]+\{[^}]*\}/g) || [];
  /* The selectors the app puts a caret in. */
  var FIELDS = ["search", "code", "bkin"];
  var seen = {};
  rules.forEach(function(rule){
    var sel = rule.slice(0, rule.indexOf("{")).trim();
    var body = rule.slice(rule.indexOf("{"));
    var fs = body.match(/(?:^|[;{\s])font-size:\s*([\d.]+)px/);
    if(!fs) return;
    FIELDS.forEach(function(f){
      if(!new RegExp("\\." + f + "\\b").test(sel)) return;
      if(/::/.test(sel)) return;
      seen[f] = 1;
      if(parseFloat(fs[1]) < 16){
        fail("." + f + " is " + fs[1] + "px — iOS zooms the page on any focused " +
             "input under 16px, and the viewport does not cap zoom on purpose");
      }
    });
  });
  FIELDS.forEach(function(f){
    if(!seen[f]) fail("." + f + " has no font-size of its own to measure");
  });
})();

/* ---------- 63. The grid columns have a floor ------------------- */
/* A bare 1fr is minmax(auto,1fr), and that auto is the column's min-content
   width. "Tomorrowverse" is thirteen characters with nowhere to break, so its
   column could never go under 169px — which pushed the page to 331px wide
   inside a 320px screen and put the right-hand cards off the edge. The floor
   has to be zero, and the card has to be allowed to break a word. */

(function(){
  var rule = (HTML.match(/\.ugrid\{[^}]*\}/) || [""])[0];
  if(!rule){ fail(".ugrid has no styling of its own"); return; }
  var cols = (rule.match(/grid-template-columns:\s*([^;}]+)/) || [])[1];
  if(!cols){ fail(".ugrid sets no columns"); return; }
  /* Inside minmax() a 1fr is the maximum and perfectly fine; it is 1fr standing
     on its own that carries the auto minimum. */
  var bare = cols.replace(/minmax\([^)]*\)/g, "");
  if(/(^|[\s,(])1fr/.test(bare)){
    fail(".ugrid uses a bare 1fr (" + cols.trim() + ") — that is minmax(auto,1fr), " +
         "so one unbreakable word sets the column width and the page scrolls " +
         "sideways on a 320px screen");
  }
  if(!/minmax\(\s*0/.test(cols)){
    fail(".ugrid columns have no zero floor: " + cols.trim());
  }
  var card = (HTML.match(/\.ucard\{[^}]*\}/) || [""])[0];
  if(!/overflow-wrap:\s*anywhere|word-break:\s*break-word/.test(card)){
    fail("the universe cards cannot break a long word, so the longest title in " +
         "the catalogue still decides how wide the column wants to be");
  }
})();

/* ---------- 64. The guards are navigable ---------- */
/* Before 1.4.2 the numbering ran 1-19, jumped to 26, and hung eleven
   sub-sections off 30 with suffixes b through g. 12b and 12c sat before 12.
   Nothing enforced any of it, so every release made it worse. */

(function(){
  var src = fs.readFileSync(__filename, "utf8");
  var nums = (src.match(/\/\* -{3,} (\d+)\./g) || []).map(function(m){
    return parseInt(m.match(/(\d+)\./)[1], 10);
  });
  if(!nums.length){ fail("guards.js has no numbered sections"); return; }
  var i;
  for(i = 0; i < nums.length; i++){
    if(nums[i] !== i + 1){
      fail("guard sections are out of order at position " + (i + 1) + ": found " +
           nums[i] + ". They must run 1..n with no gaps and no suffixes.");
      break;
    }
  }
  /* The index has to list every section, or it stops being worth reading. */
  var idx = (src.match(/\/\* INDEX[\s\S]*?\n\*\//) || [""])[0];
  nums.forEach(function(n){
    if(!new RegExp("\\n\\s+" + n + "\\s").test(idx)){
      fail("section " + n + " is missing from the INDEX at the top of guards.js");
    }
  });
  note("guard sections: " + nums.length + ", numbered 1.." + nums[nums.length - 1]);
})();

/* It described "Streaming now" for two releases after that link was replaced. */
["Streaming now", "Streaming rows", "justwatch"].forEach(function(dead){
  if(HTML.indexOf(dead) >= 0){
    fail('the Progress footer still mentions "' + dead + '" \u2014 the link is a search now');
  }
});

/* ---------- report ---------- */

console.log("\nNight Watcher guards — " + FILMS.length + " entries, " + PATH.length + " continuities");
console.log("  films " + actual.films + " · seasons " + actual.seasons +
            " · episodes " + actual.episodes.toLocaleString("en-US") +
            " · hashes " + Object.keys(byHash).length + "/" + FILMS.length +
            " distinct" + (collisions ? "" : " (no collisions)"));
notes.forEach(function(m){ console.log("  · " + m); });
warns.forEach(function(m){ console.log("  ! " + m); });
if(fails.length){
  console.log("\n" + fails.length + " FAILURE" + (fails.length > 1 ? "S" : "") + ":");
  fails.forEach(function(m){ console.log("  ✗ " + m); });
  console.log("");
  process.exit(1);
}
console.log("\n  ✓ all guards passed" + (warns.length ? " (" + warns.length + " warning(s))" : "") + "\n");
