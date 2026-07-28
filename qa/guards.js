#!/usr/bin/env node
/* Night Watcher build guards.
 *
 *   node qa/guards.js          check
 *   node qa/guards.js --bless  check, and (re)write the frozen-ID snapshot
 *
 * Zero dependencies. Exits 1 on any failure, 0 when clean.
 *
 * The functions under test are EXTRACTED FROM docs/index.html and evaluated, not
 * reimplemented here. A copy would drift from the app and quietly stop
 * testing it, which is exactly the failure this file exists to prevent.
 */
"use strict";

var fs   = require("fs");
var path = require("path");
var vm   = require("vm");

var ROOT   = path.join(__dirname, "..");
/* The site is served from docs/ — GitHub Pages (branch-folder mode) and
   wrangler.jsonc's assets.directory both point there. Autodetect rather than
   assume, so the guards can never silently validate a stale copy living in
   the wrong place. */
var PUBLIC = fs.existsSync(path.join(ROOT, "docs", "index.html"))
  ? path.join(ROOT, "docs") : ROOT;
var HTML   = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
var SNAP   = path.join(__dirname, "frozen-ids.json");
var BLESS  = process.argv.indexOf("--bless") >= 0;

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
    FILMS.push({id:f.i, gi:gi, ix:fx, gname:g.name, t:f.t, sub:f.sub||"", ep:f.ep||0,
                tv:(f.k === "tv"), y:f.y, e:(f.e||0), b:f.b||[], o:!!f.o});
  });
});

/* ---------- 1. IDs present, unique, well formed ---------- */

var seen = Object.create(null);
FILMS.forEach(function(f){
  if(typeof f.id !== "string" || !f.id) return fail("entry with no i: slug — " + (f.t || "(untitled)"));
  if(!/^[a-z0-9-]+$/.test(f.id)) fail("id is not a lowercase slug: " + f.id);
  if(seen[f.id]) fail("DUPLICATE id: " + f.id);
  seen[f.id] = 1;
});

/* ---------- 2. Frozen IDs never change ---------- */
/* The single most destructive edit in this repo is renaming an existing i:.
   It silently voids saved progress and every backup code in circulation for
   everyone who already ticked that title. Nothing else catches it. */

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

/* ---------- 3. Backup-code hash collisions ---------- */
/* The advertised check. idHash is FNV-1a truncated by slice(-5), so the real
   space is 36^5 = 60,466,176, not 2^32 — collisions are far likelier than the
   hash width suggests. A collision makes importCode() restore the WRONG title. */

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

/* ---------- 4. Every entry resolves to exactly one tier ---------- */
/* Regression guard for the bug where Core route tested the raw o flag while
   Optional tested tierOf(), leaving 9 essential seasons in neither bucket. */

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

/* ---------- 5. Era and decade coverage ---------- */

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

/* ---------- 6. Badges all have labels ---------- */

var used = {};
FILMS.forEach(function(f){ f.b.forEach(function(k){ used[k] = 1; }); });
Object.keys(used).forEach(function(k){
  if(!(k in BADGE)) fail("badge \"" + k + "\" used in data but absent from BADGE");
});

/* ---------- 7. Backup code round-trips losslessly ---------- */
/* These two functions used to be REIMPLEMENTED here, which quietly broke this
   file's own rule: a copy drifts from the app and stops testing it. They are
   now extracted from index.html like everything else, so a change to the real
   parser is a change to what this guard runs. */

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

/* ---------- 7b. The parser tolerates codes it was not written for ---------- */
/* A code written by a LATER version will carry segments this build has never
   heard of. It must restore what it recognises instead of refusing the lot —
   otherwise the first format change strands everyone who has not updated.
   Tolerance is only worth anything if it shipped BEFORE the code that needs
   it, so it is guarded from the release that introduced it. */

if(!/^NW2W/.test(code)){
  fail("exportCode is not writing NW2 — 1.2.0 codes carry the chosen path in a " +
       "P segment; bump deliberately and say so in CHANGELOG.md");
}

/* The promise made in 1.1.0: a build that has never heard of P still restores
   everything else from this code. Simulated by stripping the segment, which is
   precisely what a reader that skips unknown segments sees. */
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

/* ---------- 8. QR payload still fits ---------- */
/* The QR is byte mode at EC level L: 2953 bytes at v40. The code is
   4 + 5*watched + 1 + 5*skipped + 1 + 6*rated; worst case is everything
   watched and rated. index.html catches overflow and degrades gracefully,
   but the QR is a headline feature, so warn well before that. */

var siteM = HTML.match(/var SITE = "([^"]+)"/);
var site = siteM ? siteM[1] : "https://example.com/";
var maxCode = 6 + 11 * FILMS.length;
var maxUrl  = site.length + 4 + maxCode;
var CAP = 2953;
note("max QR payload " + maxUrl + " / " + CAP + " bytes (" + Math.round(maxUrl / CAP * 100) + "% of v40-L)");
if(maxUrl > CAP) fail("worst-case backup URL (" + maxUrl + ") exceeds QR capacity — QR will always fall back");
else if(maxUrl > CAP * 0.85) warn("QR payload above 85% of capacity — roughly " +
  Math.floor((CAP - maxUrl) / 11) + " more entries before it overflows");

/* ---------- 9. BUILD and the service worker agree ---------- */

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

/* ---------- 10. Referenced files exist ---------- */

var manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC, "manifest.json"), "utf8"));
manifest.icons.forEach(function(ic){
  if(!fs.existsSync(path.join(PUBLIC, ic.src))) fail("manifest references missing file: " + ic.src);
});
if(!manifest.icons.some(function(ic){ return /maskable/.test(ic.purpose || ""); })){
  warn("manifest has no maskable icon — Android will letterbox the install icon");
}

/* ---------- 10b. Deployment layout ---------- */
/* The site is served from docs/ only. During the docs/ migration a
   placeholder index.html was left behind at the repo root — nothing served
   it, but the next person to open "index.html" at the root would have edited
   a dead file and wondered why prod never changed. Deployables live in
   docs/, nowhere else. */

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

/* ---------- 11. README headline counts match the data ---------- */
/* The README hard-codes four numbers. They are the first thing a reader
   checks and the last thing anyone remembers to update. */

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
 ["episodes", /([\d,]+) episodes/, actual.episodes],
 ["continuities", /(\d+) continuities/, actual.continuities]
].forEach(function(t){
  var m = readme.match(t[1]);
  if(!m) return warn("README: could not find the " + t[0] + " count to verify");
  var claimed = parseInt(m[1].replace(/,/g, ""), 10);
  if(claimed !== t[2]) fail("README claims " + claimed + " " + t[0] + ", data has " + t[2]);
});

/* ---------- 11b. The <meta> headline counts match the data ---------- */
/* The README counts were guarded; the identical numbers baked into the meta
   description and og:description were not. Those are what search results and
   every shared link show, so a stale one is more visible than a stale README. */

[["meta description", /<meta name="description" content="([^"]+)"/],
 ["og:description",   /<meta property="og:description" content="([^"]+)"/]
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

/* ---------- 11c. Every shipped version is written down ---------- */
/* A change nobody recorded is a change the next person silently undoes. BUILD,
   sw.js VERSION and the top entry of CHANGELOG.md must agree. */

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

/* ---------- 12b. One hero size, declared once ---------- */
/* Home and Next up render the SAME title (both call upNext()), so an inline
   font-size on one of them makes the identical card resize as you tap between
   the two. That is exactly how they drifted 15% apart. Keep the size in the
   .hero h2 rule and nowhere else. */

var inlineHero = HTML.match(/'<h2 style="[^"]*font-size/g);
if(inlineHero){
  fail(inlineHero.length + " hero title(s) carry an inline font-size — put it in " +
       "the .hero h2 rule instead, or Home and Next up will disagree again");
}
if(!/\.hero h2\{[^}]*font-size:/.test(HTML)){
  fail(".hero h2 has no font-size — the shared hero size has gone missing");
}

/* ---------- 12c. Short views must not shift the centred column ---------- */
/* main is `max-width:760px; margin:0 auto`. Next up is the only view short
   enough to fit a desktop screen, so without a reserved gutter it loses the
   scrollbar the other three have and the whole column slides ~7.5px sideways. */

if(!/scrollbar-gutter:\s*stable/.test(HTML)){
  fail("html is missing scrollbar-gutter:stable — Next up will jump sideways " +
       "relative to the other tabs on any desktop viewport");
}

/* ---------- 12. Rating writes go through the clamp ---------- */
/* new Array(n+1) throws RangeError on a fractional or negative n, and a
   thrown render blanks the app. Imported JSON is user-supplied. */

if(/new Array\(S\.rated\[/.test(HTML)){
  fail("star render builds new Array() from a raw rating — route it through stars()/clampRating()");
}
if(/S\.rated\[id\d*\] = res\.rated\[/.test(HTML)){
  fail("import writes a raw rating into S.rated — clamp it first");
}

/* ---------- 13. Text contrast against the surface it sits on ---------- */
/* An external review claimed --dim was 3.2:1 and had to be lightened. Measured,
   it is 5.03:1 on --sunk and 4.57:1 on --card — it passes, and lightening it
   would have flattened the meta/body hierarchy for nothing. But the same
   measurement found a real one: the hero is a gradient from --card2, and
   .hero .yr sat at roughly 4.33:1 against it. Numbers, not vibes — so the
   numbers live here now and nobody has to re-litigate the palette by eye. */

/* This used to take the first value of each token seen anywhere in the file,
   which measured the default palette and silently ignored every theme added
   after it. Themes are parsed as blocks now: a second palette that fails AA
   is exactly the regression this guard exists to catch, and it would have
   sailed straight through the old version. */
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
  [["dim","card"], ["dim","card2"], ["dim","sunk"], ["dust","card"], ["bone","card"]].forEach(function(pair){
    var fg = p[pair[0]], bg = p[pair[1]];
    if(!fg || !bg){ fail("token --" + pair[0] + " or --" + pair[1] + " missing from theme " + name); return; }
    var r = contrast(fg, bg);
    note(name + ": --" + pair[0] + " on --" + pair[1] + " = " + r.toFixed(2) + ":1");
    /* --card2 is the hero's top stop, where only .hero .yr sits; it is held to
       the AA floor as a warning rather than a failure because the default
       theme has shipped at 4.12 there since 1.0.0 with nothing dim on it. */
    var soft = (pair[1] === "card2");
    if(r < 4.5 && !soft) fail(name + ": --" + pair[0] + " on --" + pair[1] + " is " + r.toFixed(2) +
                     ":1 — below the 4.5:1 AA floor for body text");
    else if(r < 4.5) warn(name + ": --" + pair[0] + " on --" + pair[1] + " is " + r.toFixed(2) +
                     ":1 — under AA; nothing dim may sit high in the hero gradient");
    else if(r < 4.8) warn(name + ": --" + pair[0] + " on --" + pair[1] + " is " + r.toFixed(2) +
                          ":1 — clears AA with little room");
  });
});

/* The hero's top stop is --card2, the darkest surface in the palette. Nothing
   inside it may use --dim, which measures 4.12:1 there. */
/* The gradient reaches --card at 60%, so only the TOP of the hero is the
   problem. .hero .yr is the one that sits up there — that is a hard fail.
   Anything lower (.where and its span) is on --card at 4.57:1 and passes, so
   it gets the measured number and a human decision, not a forced change. */
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

/* ---------- 14. A blocked store has to say so ---------- */
/* Safari Private Browsing, a full quota and some embedded webviews all make
   writes throw. Before 1.1.0 the app caught that, set canSave = false and said
   nothing: ticking kept working in memory and the session vanished on reload.
   The warning has to live INSIDE the sticky header — below it, the one message
   that must not be missed scrolls away. */

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

/* ---------- 15. No JS escapes stranded in the markup ---------- */
/* Most user-visible strings in this app are built inside <script>, where
   "\u2014" is an em dash. The static markup is NOT JavaScript, so the same
   sequence renders as the six literal characters. Writing markup by adapting a
   nearby JS string is the obvious way to do it and it produced exactly this bug
   while 1.1.0's storage warning was being added. */

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

/* ---------- 16. The path vocabulary agrees with itself ---------- */
/* Four tables describe the same three orderings: PATHS (labels), PATHBLURB
   (chooser copy), PATHCODE and CODEPATH (the backup-code letter). A path added
   to one and missed in another gives a chooser card with no description, or a
   code letter that restores nothing. */

var PATHS = sandbox.PATHS, PATHBLURB = sandbox.PATHBLURB,
    PATHCODE = sandbox.PATHCODE, CODEPATH = sandbox.CODEPATH;

if(!PATHS || !PATHBLURB || !PATHCODE || !CODEPATH){
  fail("cannot extract the path tables from index.html");
} else {
  var ids = PATHS.map(function(x){ return x[0]; });
  ids.forEach(function(id){
    if(!PATHBLURB[id]) fail('path "' + id + '" has no PATHBLURB — its chooser card would be blank');
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
}

/* ---------- 17. The path is actually load-bearing ---------- */
/* The point of 1.2.0 is that the ordering is chosen once, not re-answered on
   every visit. If the switcher comes back to The Path, that is undone. */

if(/data-mode="\047?\+?m\[0\]/.test(HTML) || /<div class="modes">'\+\s*\n?\s*\[\['continuity'/.test(HTML)){
  fail("the three-way mode switcher is back in The Path — the path is chosen once, " +
       "from Home or Progress, not re-answered on every visit");
}
if(HTML.indexOf('class="pathcard"') < 0){
  fail("Home no longer renders the path card");
}
if(HTML.indexOf('class="pick"') < 0){
  fail("the first-run path chooser is gone — a new arrival would have no way to pick");
}
if(!/data-act="repath"/.test(HTML)){
  fail("the Change control on the path card is gone — the choice would be permanent");
}
/* mode must stay OUT of what gets persisted as the path, or following someone
   else's shared link quietly rewrites your own ordering. */
if(/payload = JSON\.stringify\(\{[^}]*mode:S\.mode/.test(HTML)){
  fail("persist() writes S.mode as the path — viewing a shared #life link would " +
       "silently overwrite the path the user chose");
}

/* ---------- 18. Theme reaches the chrome, not just the CSS ---------- */
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

/* ---------- 19. Weight budget ---------- */
/* The premise is a single file that opens instantly and works offline. Nothing
   enforces that but arithmetic, so: arithmetic. The ceiling is deliberately
   close — it should hurt to import a library or inline an image. */

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
