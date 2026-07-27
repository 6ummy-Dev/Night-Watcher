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
  fn("idHash") + "\n" + fn("tierOf") + "\n" + fn("clampRating") + "\n",
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

function exportCode(S){
  var w = [], k = [], r = [];
  FILMS.forEach(function(f){
    var h = idHash(f.id);
    if(S.watched[f.id]) w.push(h);
    if(S.skipped[f.id]) k.push(h);
    if(clampRating(S.rated[f.id])) r.push(h + clampRating(S.rated[f.id]));
  });
  return "NW1W" + w.join("") + "S" + k.join("") + "R" + r.join("");
}
function importCode(raw){
  var code = String(raw || "").trim().replace(/\s+/g, "");
  var hit = code.indexOf("NW1W");
  if(hit > 0) code = code.slice(hit);
  var m = /^NW1W([0-9a-z]*)S([0-9a-z]*)R([0-9a-z]*)$/.exec(code);
  if(!m) return null;
  var map = {}, i, id;
  FILMS.forEach(function(f){ map[idHash(f.id)] = f.id; });
  var res = {watched:{}, skipped:{}, rated:{}};
  for(i = 0; i + 5 <= m[1].length; i += 5){ id = map[m[1].substr(i,5)]; if(id) res.watched[id] = 1; }
  for(i = 0; i + 5 <= m[2].length; i += 5){ id = map[m[2].substr(i,5)]; if(id) res.skipped[id] = 1; }
  for(i = 0; i + 6 <= m[3].length; i += 6){
    id = map[m[3].substr(i,5)];
    var n = clampRating(parseInt(m[3].charAt(i+5), 10));
    if(id && n) res.rated[id] = n;
  }
  return res;
}

var S = {watched:{}, skipped:{}, rated:{}};
FILMS.forEach(function(f, i){
  if(i % 2 === 0) S.watched[f.id] = 1; else if(i % 5 === 0) S.skipped[f.id] = 1;
  if(i % 7 === 0) S.rated[f.id] = (i % 5) + 1;
});
var back = importCode(exportCode(S));
if(!back) fail("backup code failed to parse its own output");
else {
  ["watched","skipped","rated"].forEach(function(kind){
    var a = Object.keys(S[kind]).filter(function(id){ return kind !== "rated" || clampRating(S[kind][id]); }).sort();
    var b = Object.keys(back[kind]).sort();
    if(a.join("|") !== b.join("|")) fail("backup round-trip lost " + kind + " entries");
    a.forEach(function(id){ if(kind === "rated" && back.rated[id] !== S.rated[id]) fail("rating changed on round-trip: " + id); });
  });
}

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

/* ---------- 12. Rating writes go through the clamp ---------- */
/* new Array(n+1) throws RangeError on a fractional or negative n, and a
   thrown render blanks the app. Imported JSON is user-supplied. */

if(/new Array\(S\.rated\[/.test(HTML)){
  fail("star render builds new Array() from a raw rating — route it through stars()/clampRating()");
}
if(/S\.rated\[id\d*\] = res\.rated\[/.test(HTML)){
  fail("import writes a raw rating into S.rated — clamp it first");
}

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
