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

/* ---------- 3. Backup-code hash collisions ---------- */
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

/* ---------- 4. Every entry resolves to exactly one tier ---------- */
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

/* ---------- 7b. The parser tolerates codes it was not written for ---------- */
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

/* ---------- 8. The restore link stays reachable ---------- */
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


/* ---------- 8b. No vendored third-party code ---------- */
/* The QR encoder was 20 KB of somebody else's minified JavaScript, 15% of the
   file, carrying a licence obligation, for a feature the link does better. */

var vendored = HTML.match(/qrcode-generator|\(c\) [A-Z][a-z]+ [A-Z][a-z]+ \| MIT/g);
if(vendored){
  fail("vendored third-party code is back in index.html (" + vendored[0] + ")");
}

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

/* ---------- 11. README headline counts match the data ---------- */
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
 ["episodes", /([\d,]+) episodes/, actual.episodes],
 ["continuities", /(\d+) continuities/, actual.continuities]
].forEach(function(t){
  var m = readme.match(t[1]);
  if(!m) return warn("README: could not find the " + t[0] + " count to verify");
  var claimed = parseInt(m[1].replace(/,/g, ""), 10);
  if(claimed !== t[2]) fail("README claims " + claimed + " " + t[0] + ", data has " + t[2]);
});

/* ---------- 11b. The <meta> headline counts match the data ---------- */
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

/* ---------- 11c. Every shipped version is written down ---------- */
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

/* ---------- 12b. One hero size, declared once ---------- */
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

/* ---------- 12c. Short views must not shift the centred column ---------- */
/* Next up is the only view short enough to fit a desktop screen; without a
   reserved gutter the centred column slides ~7.5px sideways. */

if(!/scrollbar-gutter:\s*stable/.test(HTML)){
  fail("html is missing scrollbar-gutter:stable — Next up will jump sideways " +
       "relative to the other tabs on any desktop viewport");
}

/* ---------- 12. Rating writes go through the clamp ---------- */
/* new Array(n+1) throws on a fractional or negative n, and a thrown render
   blanks the app. Imported JSON is user-supplied. */

if(/new Array\(S\.rated\[/.test(HTML)){
  fail("star render builds new Array() from a raw rating — route it through stars()/clampRating()");
}
if(/S\.rated\[id\d*\] = res\.rated\[/.test(HTML)){
  fail("import writes a raw rating into S.rated — clamp it first");
}

/* ---------- 13. Text contrast against the surface it sits on ---------- */
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
  [["dim","card"], ["dim","card2"], ["dim","sunk"], ["dust","card"], ["bone","card"]].forEach(function(pair){
    var fg = p[pair[0]], bg = p[pair[1]];
    if(!fg || !bg){ fail("token --" + pair[0] + " or --" + pair[1] + " missing from theme " + name); return; }
    var r = contrast(fg, bg);
    note(name + ": --" + pair[0] + " on --" + pair[1] + " = " + r.toFixed(2) + ":1");
    /* --card2 is the hero's top stop; warn, since the default has shipped at
       4.12 there since 1.0.0 with nothing dim on it. */
    var soft = (pair[1] === "card2");
    if(r < 4.5 && !soft) fail(name + ": --" + pair[0] + " on --" + pair[1] + " is " + r.toFixed(2) +
                     ":1 — below the 4.5:1 AA floor for body text");
    else if(r < 4.5) warn(name + ": --" + pair[0] + " on --" + pair[1] + " is " + r.toFixed(2) +
                     ":1 — under AA; nothing dim may sit high in the hero gradient");
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

/* ---------- 14. A blocked store has to say so ---------- */
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

/* ---------- 15. No JS escapes stranded in the markup ---------- */
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

/* ---------- 16. The path vocabulary agrees with itself ---------- */
/* PATHS, PATHBLURB, PATHCODE and CODEPATH describe the same three orderings;
   a path missing from one gives a blank card or a letter that restores nothing. */

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

/* One control per setting. The path row in Progress duplicated Home’s Change,
   and a duplicate is how two places drift into disagreeing. */
var pathBlocks = (HTML.match(/PATHS\.map\(/g) || []).length;
if(pathBlocks !== 1){
  fail("PATHS.map appears " + pathBlocks + " times, expected 1 (the chooser) — "
       + "a second path control somewhere means two places to change one setting");
}

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

/* ---------- 26. Documented spoiler order holds ---------- */
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

/* ---------- 27. The README describes the app that exists ---------- */
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

/* ---------- 28. No brand names in the catalogue or the UI ---------- */
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

/* ---------- 29. One tagline, everywhere ---------- */
/* It lived in six places carrying three different strings. Six copies that can
   disagree is the same shape of bug the README drift was. */

var TAGLINE = "One path through every Batman";
[["<title>", HTML], ["og:title", HTML], ["README headline", README]].forEach(function(pair){
  if(pair[1].indexOf(TAGLINE) < 0){
    fail(pair[0] + " does not carry the tagline \"" + TAGLINE + "\"");
  }
});
["The Animated Dark Knight", "Gotham City life"].forEach(function(dead){
  if(HTML.indexOf(dead) >= 0 || README.indexOf(dead) >= 0){
    fail('retired tagline "' + dead + '" is still present');
  }
});
if(/Every animated Batman/.test(HTML) || /every animated Batman/.test(README)){
  fail('copy still says "animated" as a limit \u2014 it stops being true when live-action lands');
}

/* ---------- 30. Activity is reachable from Next up ---------- */
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
/* Five. A longer list turns Next up into a history page. */
var amax = HTML.match(/var ACTIVITYMAX = (\d+);/);
if(!amax || amax[1] !== "5"){
  fail("ACTIVITYMAX is " + (amax ? amax[1] : "missing") + ", expected 5");
}
if(/function activityBlock\s*\(/.test(HTML)){
  var ab = fn("activityBlock");
  /* Scope is a queue control. Activity is history, and must not consult it. */
  if(/visible\s*\(/.test(ab) || /S\.scope/.test(ab)){
    fail("activityBlock() consults scope \u2014 history must not hide what you logged");
  }
  /* Nothing here may write watched or skipped \u2014 that is what moves the hero. */
  if(/S\.watched\s*\[[^\]]*\]\s*=|S\.skipped\s*\[[^\]]*\]\s*=|markWatched\(/.test(ab)){
    fail("activityBlock() writes progress \u2014 rating from Activity must not move the hero");
  }
}

/* ---------- 30b. The log holds one entry per id ---------- */
/* Not reproducible through any reachable write, but saved payloads also arrive
   hand-edited and from other builds. Enforced on read, so it holds regardless. */

if(!/function dedupeLog\s*\(/.test(HTML)){
  fail("dedupeLog() is gone \u2014 a saved payload could hold two entries for one id");
}
var dedupeLog = /function dedupeLog\s*\(/.test(HTML)
  ? new vm.Script(fn("dedupeLog") + "\ndedupeLog;").runInNewContext({})
  : function(a){ return a; };
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

/* ---------- 30c. The Path collapses, and remembers ---------- */
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

/* ---------- 30d. Progress does not restate The Path ---------- */
/* The list grew without limit and pushed the backup tools off the screen. */

if(/Your ratings/.test(HTML)){
  fail("\"Your ratings\" survives in Progress \u2014 The Path carries the same stars");
}
if((HTML.match(/stars\(S\.rated\[/g) || []).length !== 1){
  fail("the rating stars are rendered in " +
       (HTML.match(/stars\(S\.rated\[/g) || []).length + " places, expected 1 (The Path)");
}

/* ---------- 30e. What a crawler and a shared link see ---------- */
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
  if(parsed){
    var title = (HTML.match(/<title>([^<]+)<\/title>/) || [])[1] || "";
    if(title.indexOf(parsed.name) !== 0){
      fail("JSON-LD name \"" + parsed.name + "\" does not open the <title> \"" + title + "\"");
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

/* ---------- 30f. Every watch link carries a year ---------- */
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

/* ---------- 30f2. The README lists every served file ---------- */
/* Two files shipped in 1.3.7 and neither reached the table. The size figure had
   been wrong since 1.2.x for the same reason: prose about the repo drifts from
   the repo unless something compares them. */

(function(){
  var listed = {}, m, re = /\|\s*`(docs\/[^`]+)`\s*\|/g;
  while((m = re.exec(README))) listed[m[1].replace("docs/", "")] = true;
  var onDisk = fs.readdirSync(PUBLIC).filter(function(f){
    return f.charAt(0) !== "." && fs.statSync(path.join(PUBLIC, f)).isFile();
  });
  var missing = onDisk.filter(function(f){ return !listed[f]; });
  if(missing.length){
    fail("README's file table does not list: " + missing.join(", "));
  }
  var ghost = Object.keys(listed).filter(function(f){
    return !fs.existsSync(path.join(PUBLIC, f));
  });
  if(ghost.length){
    fail("README's file table lists files that do not exist: " + ghost.join(", "));
  }
})();

/* ---------- 30g. The README states the real weight ---------- */
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

/* ---------- 31. The wordmark returns to the top ---------- */
if(!/id="topBtn"/.test(HTML)) fail("the wordmark is no longer a control");
if(HTML.indexOf('getElementById("topBtn")') < 0){
  fail("the wordmark has no click handler \u2014 tapping the title would do nothing");
}
if(!/<h1><button id="topBtn">/.test(HTML)){
  fail("the wordmark button is outside its h1 \u2014 the heading must stay a heading");
}

/* ---------- 32. The footer describes the link that exists ---------- */
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
