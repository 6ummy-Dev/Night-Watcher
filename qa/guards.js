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
     71   Tier resolution is checked against real entries
     5    Era and decade coverage
     6    Badges all have labels
     30   Documented spoiler order holds
     81   An era note describes a period, not a story
     32   No brand names in the catalogue or the UI
     51   Format is the second axis
     52   Nobody's world changes overnight
     53   Two questions, two control groups
     64   The year is not printed twice
     84   The one slug whose year is deliberately wrong
     85   Static Shock and Titans keep one row each
     86   The era scheme is eleven stages, plus outside
     89   The amnesty window is closed
     92   A rating is certified or absent

   STORAGE
     7    Backup code round-trips losslessly
     8    The parser tolerates codes it was not written for
     9    The restore link stays reachable
     77   The way back across is only visible from the far side
     72   Every shareable route token still routes
     73   The worst-case restore link cannot get longer
     19   Rating writes go through the clamp
     21   A blocked store has to say so
     35   The log holds one entry per id
     111  Watched and skipped are never both true
     50   Rating and progress stay separate
     87   A backup carries progress, not settings
     102  A tick burst writes once, and leaving flushes
     103  The tick repaints one group, and cannot drift

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
     80   The ring is drawn with its own circumference
     18   Short views must not shift the centred column
     27   The path is actually load-bearing
     28   Theme reaches the chrome, not just the CSS
     34   Activity is reachable from Next up
     36   The Path collapses, and remembers
     40   One scoreboard
     47   The wordmark returns to the top
     49   The card reads what it means
     88   The universe chip describes the universe
     93   The Progress lists fold, and remember
     94   The path is Bruce, for a fresh visitor
     96   The Belt is one strip, and its pouches open from behind
     97   Theme lives on Home, compact, and nowhere else
     98   The progress card is drawn here, from the real counts
     99   The soak notes hold
     54   Home tells before it asks
     76   Home and The Path group the same way
     55   The chooser is a deck, not a list
     56   Format is legible where it is ambiguous
     57   The legend is made of badges
     58   Then is the tab, not the gap
     59   Every badge is the same box
     60   One left edge for the group chips
     63   The grid columns have a floor
     119  Where to watch has a rank of its own

   ACCESSIBILITY
     20   Text contrast against the surface it sits on
     41   The restore box has a real label
     61   Contrast is measured on the ink that renders
     62   Nothing focusable is small enough to zoom
     75   A control is as big as a finger
     109  Every count on Progress is a way into the list
     110  The page can still be pinch-zoomed
     115  Four copies of the bat, and they agree
     112  The Restore box survives a render nobody asked for
     118  The 404 still reads over its own bat

   DEPLOY
     10   No vendored third-party code
     11   BUILD and the service worker agree
     12   Referenced files exist
     13   Deployment layout
     16   Every shipped version is written down
     74   The version history runs one way
     22   No JS escapes stranded in the markup
     79   No marker a user could type
     29   Weight budget
     31   The README describes the app that exists
     45   The README lists every served file
     114  The README describes the origin that actually serves
     117  llms.txt says what the README says
     82   GitHub Pages never gets a custom domain
     83   The manifest id is an identity, not a path
     46   The README states the real weight

   DISCOVERY
     38   What a crawler and a shared link see
     78   A crawler sees a catalogue, not an empty page
     39   What the app refuses to do is a feature
     42   The page asks nothing of anyone else
     43   Content-Security-Policy
     44   Every watch link carries a year
     67   The dates say when the page actually changed
     68   The life path is a timeline, not a filing order
     69   The universes run in the order their stories start
     70   An entry outside the timeline says why
     90   The seed links carry only known tokens
     91   The card the metas promise is the card that ships
     95   The curated list is machine-readable
     100  The straight answers are machine-readable
     101  The site answers off the app too
     104  The security headers the edge cannot set
     105  The catalogue answers in plain text
     106  The fonts carry every letter the catalogue uses
     116  The fonts really carry what the page really renders
     107  Every section can fail, and every section runs
     108  The 2.7.1 soak notes stay fixed

   META
     65   The file points at where its reasoning went
     66   The guards are navigable
     113  Every negative suite runs in CI

   Sections are numbered in file order. Groups are for finding things;
   they do not affect what runs. Guard 66 enforces the numbering, that every
   section listed here has an assertion under it, and that no group is empty
   or named twice.
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
/* sliceOr() is slice() for the call sites that wrote `slice(…) || fallback`
   and meant it. slice() throws, so those fallbacks were unreachable and the
   readable failure underneath them was unreachable with it — section 108 ended
   the run with a stack trace instead. Same relationship as fn()/optionalFn(),
   for the same reason: a guard that dies is a guard that says nothing. */
function sliceOr(from, to){
  var a = HTML.indexOf(from);
  var b = HTML.indexOf(to, a);
  if(a < 0 || b < 0) return "";
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
/* The FAQ: one source. Guard 78 renders it into the crawlable seed, guard
   100 mirrors it into the FAQPage schema node, and the two can only move
   together. Q1 derives from MODENOTE so the method answer cannot drift from
   the copy the app itself shows. */
function buildFAQ(FILMS, MODENOTE, tierOf){
  var yrs = FILMS.map(function(f){ return f.y; });
  var span = Math.min.apply(null, yrs) + "\u2013" + Math.max.apply(null, yrs);
  function first(k){ return MODENOTE[k].split(". ")[0].replace("{span}", span) + "."; }
  var films = 0, seasons = 0;
  FILMS.forEach(function(f){ f.tv ? seasons++ : films++; });
  var curated = FILMS.filter(function(f){ return tierOf(f) !== "o"; }).length;
  return [
    ["Which order should I watch Batman in?",
     "Three honest answers instead of one fake one. By universe: " + first("continuity") +
     " Bruce\u2019s life: " + first("life") + " Release order: " + first("release")],
    ["Does this include the animated series?",
     "Yes \u2014 all of it. " + seasons + " seasons of television ride alongside the " + films +
     " films, animated and live action both, and a switch narrows the shelf whenever you want it narrower."],
    ["Do I have to watch everything?",
     "No. " + curated + " titles are marked as the essentials and the core route \u2014 the spine of " +
     "the thing. Everything else is optional side material, labeled as exactly that."],
    ["Is it really spoiler-safe?",
     "That is the whole premise. Universes stay whole, and every ordering is built so nothing " +
     "renders ahead of an entry it would give away."],
    ["Where can I watch all of these?",
     "Availability changes constantly and differs by country, so nothing here stores an answer " +
     "that would rot \u2014 every entry carries a fresh where-to-watch search instead."],
    ["Does it track what I watch?",
     "No. There is no account and no sign-in, no advertising, and nothing tracking what you " +
     "watch. What you tick stays in your browser and is never sent anywhere. It works offline, " +
     "and it is free software under the AGPL."],
    ["Where do the Joker films fit?",
     "In their own continuity, and nowhere near the rest. They are Gotham stories with no " +
     "Batman in them, so they sit in a universe of their own, marked optional \u2014 nothing " +
     "else in the catalogue depends on having seen them."]
  ];
}

/* Eras render 1..10 and then 0, so era 0 is LAST, not first. Comparing e: values
   numerically would read "outside any timeline" as earlier than "before the cowl". */
function eraRank(k){
  var i = ERAS.map(function(e){ return e.k; }).indexOf(k);
  return i < 0 ? 999 : i;
}
var idHash = sandbox.idHash, tierOf = sandbox.tierOf, clampRating = sandbox.clampRating;

/* Flatten exactly as index.html does. */
var FILMS = [];
PATH.forEach(function(g, gi){
  g.films.forEach(function(f, fx){
    FILMS.push({id:f.i, gi:gi, ix:fx, gn:g.n, gname:g.name, fmt:(f.fmt || g.fmt || "anim"),
                t:f.t, sub:f.sub||"", ep:f.ep||0,
                tv:(f.k === "tv"), y:f.y, e:(f.e||0), lo:(f.lo||0), out:(f.out||""),
                r:f.r||"", b:f.b||[], o:!!f.o});
  });
});
var FAQDATA = buildFAQ(FILMS, sandbox.MODENOTE, tierOf);

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

/* An entry can be wrong enough to remove \u2014 it happened for the first time in
   1.7.5. Blessing must not be able to launder that: a slug only leaves the
   frozen list by being written into qa/retired-ids.json with a reason, which
   is a diff a reviewer sees. A retired slug may never come back either, because
   somebody's saved progress may still hold the old meaning of it. */
/* A rename is the same act as a removal plus an addition, and just as
   destructive: the old key is what progress was saved under and what every
   backup code hashed. It is allowed the same way \u2014 written down, in a file, with
   a reason a reviewer reads in the diff. */
var RENAMED = {}, RENAMEDFILE = path.join(ROOT, "qa", "renamed-ids.json");
if(fs.existsSync(RENAMEDFILE)){
  var rn = JSON.parse(fs.readFileSync(RENAMEDFILE, "utf8"));
  Object.keys(rn).forEach(function(k){
    if(!rn[k] || !rn[k].to) return fail("renamed-ids.json gives no new id for " + k);
    if(!rn[k].why || rn[k].why.length < 40){
      fail("renamed-ids.json gives no real reason for renaming " + k);
    }
    RENAMED[k] = rn[k].to;
  });
}
var RETIRED = {}, RETIREDFILE = path.join(ROOT, "qa", "retired-ids.json");
if(fs.existsSync(RETIREDFILE)){
  var rl = JSON.parse(fs.readFileSync(RETIREDFILE, "utf8"));
  Object.keys(rl).forEach(function(k){
    if(!rl[k] || rl[k].length < 20){
      fail("retired-ids.json gives no real reason for dropping " + k);
    }
    RETIRED[k] = rl[k];
  });
}
var filmIds = FILMS.map(function(f){ return f.id; }).sort();
filmIds.forEach(function(i){
  if(RETIRED[i]) fail("retired id is back in the data: " + i +
                      " \u2014 removal is not reversible by re-adding the slug");
  if(RENAMED[i]) fail("renamed id is back in the data: " + i + " \u2014 it was renamed to " +
                      RENAMED[i] + ", and having both is worse than having either");
});
Object.keys(RENAMED).forEach(function(k){
  if(filmIds.indexOf(RENAMED[k]) < 0){
    fail("renamed-ids.json says " + k + " became " + RENAMED[k] +
         ", which is not in the catalogue");
  }
});
if(BLESS){
  /* One retirement predates the surviving snapshot: the Scooby crossover
     left in 1.7.5, before the current frozen-ids.json was cut. Warning
     about it on every bless taught nobody anything and trained everyone to
     skim warnings — recorded here as the known exception (2.2.1). A NEW
     retirement that was never frozen still warns, which is the point. */
  var PREFREEZE = ["scooby-doo-and-krypto-too-2023"];
  Object.keys(RETIRED).forEach(function(k){
    if(PREFREEZE.indexOf(k) >= 0) return;
    if(fs.existsSync(SNAP) && JSON.parse(fs.readFileSync(SNAP, "utf8")).indexOf(k) < 0){
      warn("retired-ids.json lists " + k + ", which was never frozen");
    }
  });
  fs.writeFileSync(SNAP, JSON.stringify(filmIds, null, 1) + "\n");
  note("blessed frozen-ids.json with " + filmIds.length + " ids");
} else if(!fs.existsSync(SNAP)){
  warn("no qa/frozen-ids.json yet — run: node qa/guards.js --bless");
} else {
  var prev = JSON.parse(fs.readFileSync(SNAP, "utf8"));
  var now = {}; filmIds.forEach(function(i){ now[i] = 1; });
  var was = {}; prev.forEach(function(i){ was[i] = 1; });
  prev.forEach(function(i){
    if(!now[i] && !RETIRED[i] && !RENAMED[i]){
      fail("FROZEN ID REMOVED OR RENAMED: " + i + "  (this voids saved progress)");
    }
    if(!now[i] && RENAMED[i]) note("renamed since the last bless: " + i + " -> " + RENAMED[i]);
  });
  var added = filmIds.filter(function(i){ return !was[i]; });
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
/* A path has to be set, or exportCode() emits no P segment at all \u2014 which made
   every P-segment test below assert against a code that had none. */
sandbox.S = {watched:{}, skipped:{}, rated:{}, path:"life"};
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

if(!/^NW3W/.test(code)){
  fail("exportCode is not writing NW3 \u2014 1.7.7 made ratings positional against the " +
       "watched list and gave orphan ratings their own O segment; bump deliberately " +
       "and say so in CHANGELOG.md");
}

/* The path has to survive its own round trip before anything below means much. */
if(back && back.path !== "life"){
  fail("the P segment does not restore the path \u2014 a link carries the ordering " +
       "it was made in, and a fresh device would land on the wrong one");
}

/* Stripping P is what a 1.1.0 reader sees. */
if(!/P[0-9a-z]+$/.test(code)) fail("exportCode wrote no P segment for a chosen path");
var without = code.replace(/P[0-9a-z]*$/, "");
if(without === code) fail("stripping the P segment changed nothing \u2014 the older-reader " +
                          "test below would re-parse the code guard 7 already checked");
var older = importCode(without);
if(!older) fail("a 1.1.0 reader (P segment skipped) cannot parse a 1.2.0 code");
else if(Object.keys(older.watched).sort().join("|") !== Object.keys(back.watched).sort().join("|")){
  fail("stripping the path segment loses watched entries — the forward tolerance " +
       "shipped in 1.1.0 does not actually cover this format");
}

/* And codes already in the wild must still restore. */
var legacy = importCode(without.replace(/^NW3/, "NW1"));
if(!legacy) fail("a 1.0.0/1.1.0 NW1 code no longer imports — every saved backup just broke");
else if(Object.keys(legacy.watched).sort().join("|") !== Object.keys(back.watched).sort().join("|")){
  fail("NW1 codes import but lose entries");
}
/* Ratings were only ever compared on the round trip, never on the legacy path.
   1.7.7 made the rating segment mean two different things depending on the
   version in the header, so an old code parsed by the new rules silently
   restores the wrong stars — and nothing here would have said so. */
(function(){
  var old = "NW2W" + FILMS.slice(0, 3).map(function(f){ return idHash(f.id); }).join("") +
            "S" + "R" + FILMS.slice(0, 2).map(function(f){ return idHash(f.id) + "4"; }).join("") + "Pl";
  var got = importCode(old);
  if(!got){ fail("a 1.2.0 NW2 code no longer imports at all"); return; }
  var want = {}; FILMS.slice(0, 2).forEach(function(f){ want[f.id] = 4; });
  if(JSON.stringify(got.rated) !== JSON.stringify(want)){
    fail("an NW2 code's ratings do not survive: expected " + JSON.stringify(want) +
         ", got " + JSON.stringify(got.rated) + " \u2014 the rating segment is read " +
         "by format version, and the version branch is wrong");
  }
  if(Object.keys(got.watched).length !== 3) fail("an NW2 code lost watched entries");
})();

/* NW3 and an X segment: a version this build has never seen, carrying a
   segment it has no rule for. Written /^NW1/ -> "NW2" until 1.6.6, which could
   not match a code that already starts NW2 \u2014 so the unknown-version half of
   this test had never once run. */
var future = code.replace(/^NW3/, "NW9") + "X7";
var ftr = importCode(future);
if(!ftr) fail("parser rejected a forward-compatible code (NW2 + unknown segment) outright");
else if(Object.keys(ftr.watched).sort().join("|") !== Object.keys(back.watched).sort().join("|")){
  fail("parser dropped watched entries from a code carrying an unknown segment");
}

/* A code chopped in half by a chat client parses cleanly and restores most of
   itself. That is the failure the link ceiling exists to prevent, and until
   1.8.2 a restore could not tell you it had happened. */
(function(){
  if(back.cut) fail("a whole code is being reported as cut short");
  /* Across the whole length, not just the tail: the last ninety characters are
     ratings and the path, and losing those loses no entries. A cut only starts
     costing something once it reaches the watched list, which is at the front. */
  var lost = 0, tried = 0;
  for(var n = 2; n < code.length - 8; n += 7){
    var r = importCode(code.slice(0, code.length - n));
    if(!r) continue;
    tried++;
    if(Object.keys(r.watched).length < Object.keys(back.watched).length && !r.cut) lost++;
  }
  if(tried < 50) fail("the truncation sweep only tried " + tried + " cuts");
  if(lost) fail(lost + " truncations lost entries without the restore saying so — " +
                "a cut link looks exactly like a short one");
})();

/* A pasted restore URL still has to work, and real junk still has to fail. */
if(!importCode("https://nightwatcher.life/#nw=" + code)) fail("parser rejected a pasted restore URL");
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
var SW = "";
if(!buildM) fail("cannot find BUILD in index.html");
if(!fs.existsSync(swPath)) fail("sw.js is missing but index.html registers it");
else {
  SW = fs.readFileSync(swPath, "utf8");
  var verM = SW.match(/var VERSION\s*=\s*"([^"]+)"/);
  if(!verM) fail("cannot find VERSION in sw.js");
  else if(buildM && verM[1] !== buildM[1]){
    fail("sw.js VERSION (" + verM[1] + ") != index.html BUILD (" + buildM[1] +
         ") — old caches will never be retired");
  }
  /* 3.0.0: SW.JS WAS NEVER PARSED BY ANYTHING. Five sections grep its text and
     smoke never registers it, so a syntax error appended to this file left both
     suites green while offline broke for every visitor — confirmed by doing it.
     That is the failure class 2.7.4 added new vm.Script() for, applied to
     index.html and never extended to the other file that ships. Three lines.
     Compiling does not run it: the worker's globals do not exist here, and the
     question is only whether a browser could parse what we shipped. */
  try {
    new vm.Script(SW, {filename: "docs/sw.js"});
  } catch(e){
    fail("docs/sw.js does not parse: " + e.message + " — the browser would " +
         "refuse to register it, every returning visitor would stay on the old " +
         "app, and nothing else in this suite reads it as anything but text");
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

/* The offline shell against what docs/ actually serves. icon-maskable-512.png
   was added to the directory and to manifest.json in 1.5.x and never added to
   SHELL, so it was missing from every install for a year with nothing to say
   so \u2014 an Android icon refresh while offline fell back silently. A shell is a
   list somebody maintains by hand, which is the definition of a list that
   drifts. The exclusions below are decisions, written down: crawler-facing
   files and a licence have no business in an app cache, and sw.js is cached by
   the machinery that runs it. share.png joined the list in 1.9.0 — it exists
   for link scrapers, which never run the service worker, and section 91 fails
   the build if it ever sneaks INTO the shell.
   _headers joined in 2.5.1: it is read by the edge before a response is ever
   sent, never fetched by the page, and caching it would be meaningless.
   orders.txt joined in 2.6.0 for the same reason as llms.txt: it is written for
   readers and engines that never run the app, the app itself never fetches it,
   and section 105 fails the build if it ever sneaks INTO the shell. */
(function(){
  var swPath2 = path.join(PUBLIC, "sw.js");
  if(!fs.existsSync(swPath2)) return;
  var shell = (fs.readFileSync(swPath2, "utf8").match(/var SHELL\s*=\s*\[([\s\S]*?)\]/) || [0,""])[1]
                .match(/"\.\/([^"]*)"/g) || [];
  shell = shell.map(function(q){ return q.slice(3, -1); });
  var NOT_SHELLED = ["sw.js", "robots.txt", "sitemap.xml", "fonts/OFL.txt", "share.png", "llms.txt", "404.html", "_headers",
                     "orders.txt"];
  var served = [];
  (function walk(dir, pre){
    fs.readdirSync(dir).forEach(function(name){
      var full = path.join(dir, name);
      if(fs.statSync(full).isDirectory()) return walk(full, pre + name + "/");
      served.push(pre + name);
    });
  })(PUBLIC, "");
  served = served.filter(function(f){ return !/^google[0-9a-f]+\.html$/.test(f); });

  shell.forEach(function(f){
    if(f === "") return;                                   /* "./" is the page itself */
    if(served.indexOf(f) < 0){
      fail("sw.js caches \"" + f + "\" on install and docs/ does not serve it \u2014 the " +
           "install swallows the 404 and offline is quietly missing a file");
    }
  });
  var unshelled = served.filter(function(f){
    return shell.indexOf(f) < 0 && NOT_SHELLED.indexOf(f) < 0;
  });
  if(unshelled.length){
    fail("docs/ serves " + unshelled.join(", ") + " and sw.js does not cache " +
         (unshelled.length > 1 ? "them" : "it") + " \u2014 either add " +
         (unshelled.length > 1 ? "them" : "it") + " to SHELL or name " +
         (unshelled.length > 1 ? "them" : "it") + " in this guard's exclusions, " +
         "so the omission is a decision instead of an oversight");
  }
  note("offline shell: " + shell.length + " entries, " + served.length +
       " files served, " + NOT_SHELLED.length + " deliberately not cached");
})();

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

/* The README printed the era scheme as prose and went on printing the one from
   two releases earlier, spoiler names and all, because this section only ever
   checked numbers. Names drift exactly the same way numbers do. */
(function(){
  var block = (readme.match(/\*\*Bruce\u2019s life\*\*[\s\S]*?\n/) ||
               readme.match(/\*\*Bruce's life\*\*[\s\S]*?\n/) || [""])[0];
  if(!block){ warn("README: no Bruce\u2019s life bullet to check era names against"); return; }
  var missing = ERAS.filter(function(e){
    return e.k !== 0 && block.indexOf(e.name) < 0;
  }).map(function(e){ return e.name; });
  if(missing.length){
    fail("README's chronology omits the era(s) " + missing.join(", ") +
         " \u2014 it is printing a scheme the app no longer ships");
  }
  var eraNames = ERAS.map(function(e){ return e.name; });
  var run = (block.match(/\*([^*]*\u2192[^*]*)\*/) || [])[1];
  if(run){
    var strays = run.split("\u2192").map(function(x){ return x.trim(); })
                    .filter(function(x){ return x && eraNames.indexOf(x) < 0; });
    if(strays.length){
      fail("README's chronology lists " + strays.join(", ") + " \u2014 not an era " +
           "this build ships. Renamed eras leave the old name on the front page.");
    }
  }
})();

/* ---------- 15. The <meta> headline counts match the data ------------- */
/* The same numbers in meta/og descriptions are what search results and every
   shared link show, so a stale one is more visible than a stale README. */

[["meta description", /<meta name="description" content="([^"]+)"/],
 ["og:description",   /<meta property="og:description" content="([^"]+)"/],
 /* The JSON-LD carries two descriptions \u2014 a short one on the WebSite node and
    the counted one on the WebApplication node. This matched the first, which
    states no counts, so it had been checking nothing at all and passing. The
    warn below is what surfaced it. Match the one with the numbers in it. */
 ["JSON-LD description", /"description":"([^"]*\d+ films[^"]*)"/]
].forEach(function(t){
  var m = HTML.match(t[1]);
  if(!m) return warn(t[0] + " is missing");
  var txt = m[1];
  [[/(\d+)\s+films/, actual.films, "films"],
   [/(\d+)\s+seasons/, actual.seasons, "seasons"],
   [/(\d+)\s+continuities/, actual.continuities, "continuities"]
  ].forEach(function(c){
    var got = txt.match(c[0]);
    /* Silence used to read as success here: reword the sentence so a count no
       longer matches and this section went green having checked nothing. It is
       the counts-in-prose failure one level up, in the thing that watches for
       counts in prose. */
    if(!got) return warn(t[0] + " no longer states a " + c[2] + " count \u2014 " +
                         "nothing is checking that number any more");
    if(parseInt(got[1], 10) !== c[1]){
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

/* THE WATCH LINK PAINTS ITS OWN SURFACE, AND THE SWEEP ABOVE CANNOT SEE IT.
   3.1.0 gave "Where to watch" a rank of its own — a tonal steel fill under a
   bone label — because it had none: `.lnk` and `.act` were the same rule twice,
   differing only in text colour, and the link was the fainter of the two at
   5.08:1. Every pair measured above is token-on-token. A translucent fill lands
   the label on a blend that appears in no palette, so adding one to `.lnk`
   would have been invisible here in exactly the way `--steel` on `--card2` was
   invisible from 1.0.0 to 1.4.0.

   The measured trap, and it is why this is arithmetic rather than a review:
   tinting the fill and KEEPING the steel label reads as the obvious move and
   lands at 4.09:1 — under AA. Raising the fill without raising the label buys
   weight by spending contrast. Whatever fill is chosen, the label goes up.

   Section 119 asserts the fill and the colour are declared in a form this can
   parse; without that pairing a rewrite to a form the regex misses would leave
   this measuring nothing and reporting green. */

(function(){
  var lnk = block(".lnk");
  if(!lnk){ fail(".lnk has no rule — the watch link cannot be measured"); return; }

  var bg = lnk.match(/background:\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  var fg = lnk.match(/(?:^|[;{])color:\s*var\(--([a-z0-9]+)\)/);
  if(!bg || !fg){
    fail(".lnk no longer declares both an rgba() fill and a var() colour — " +
         "section 119 says it must, and this measurement is why");
    return;
  }
  var a = parseFloat(bg[4]), rgb = [+bg[1], +bg[2], +bg[3]];

  function over(hex){
    var out = "#";
    for(var i = 0; i < 3; i++){
      var base = parseInt(hex.substr(1 + i * 2, 2), 16);
      var v = Math.round(base + (rgb[i] - base) * a);
      out += (v < 16 ? "0" : "") + v.toString(16);
    }
    return out;
  }

  themes.forEach(function(t){
    var name = t[0], p = t[1], ink = p[fg[1]];
    if(!ink){ fail("theme " + name + " has no --" + fg[1] + " for the watch link's label"); return; }
    ["ink", "sunk", "card", "card2"].forEach(function(s){
      var eff = over(p[s]), r = contrast(ink, eff);
      if(r < 4.5){
        fail(name + ": the watch link's label (--" + fg[1] + ") reads " + r.toFixed(2) +
             ":1 against its own fill over --" + s + " (" + eff + ") — under the " +
             "4.5:1 AA floor. The fill is what buys the rank; the label is what " +
             "pays for it, and it must not");
      }
    });
  });
  note("watch link: --" + fg[1] + " over rgba(" + rgb.join(",") + "," + a + ") clears AA on every surface");
})();

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
/* \uXXXX is an em dash in a script and six literal characters in markup.

   3.0.2 WIDENED THE SCAN, WHICH HAD NEVER SEEN THE HEAD. It sliced <body> to
   the first <script>, so the whole of <head> was outside it — and the head is
   where the title, the description and the OG/Twitter tags live. A stranded
   escape there renders literally to every crawler and every social embed, which
   is the most expensive place on the page for this defect to land and the one
   place the section could not look. The JSON-LD block is excluded on purpose:
   it is JSON, where \uXXXX is correct and means the character. */

(function(){
  var bodyAt = HTML.indexOf("<body>");
  var scriptAt = HTML.indexOf("<script", bodyAt);
  var headAt = HTML.indexOf("<head>");
  var regions = [];
  if(headAt >= 0 && bodyAt > headAt){
    /* The head, minus any JSON-LD, where the escapes are legitimate. */
    regions.push(["the head", HTML.slice(headAt, bodyAt)
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")]);
  }
  if(bodyAt > 0){
    regions.push(["static markup",
      HTML.slice(bodyAt, scriptAt > bodyAt ? scriptAt : HTML.length)]);
  }
  if(!regions.length){
    fail("section 22 found neither a head nor a body to scan — the page's shape " +
         "changed and this section is measuring nothing");
    return;
  }
  regions.forEach(function(r){
    var stranded = r[1].match(/\\u[0-9a-fA-F]{4}/g);
    if(stranded){
      fail(r[0] + " contains " + stranded.length + " JS escape(s) (" +
           stranded.slice(0, 3).join(", ") + ") — these render literally, not as " +
           "the character. Use the character itself or an HTML entity.");
    }
  });
})();

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
  ).runInNewContext({MODENOTE: MODENOTE, yearSpan: new vm.Script(
    fn("visible") + "\n" + fn("yearSpan") + "\nyearSpan;"
  ).runInNewContext({FILMS: FILMS, S: {format:"all", scope:"all"}})});
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
/* The definition line contains the string "applyTheme()" too, so asking whether
   the file mentions it was answered by the function existing. Delete every call
   site and the old check still passed. Count the mentions instead: one is the
   declaration, so a live call site means more than one. */
if(HTML.split("applyTheme()").length - 1 < 2){
  fail("applyTheme() is defined and never called \u2014 the theme would never reach " +
       "the chrome on load");
}
if(!/background:var\(--hdr\)/.test(HTML) || !/background:var\(--tabbg\)/.test(HTML)){
  fail("the header or tab bar is back on a hardcoded rgba — a theme cannot reach it");
}

/* ---------- 29. Weight budget ----------------------------------------- */
/* The premise is arithmetic, so: arithmetic. It should hurt to add a library. */

var zlib = require("zlib");
var rawKB  = Buffer.byteLength(HTML) / 1024;
var gzipKB = zlib.gzipSync(Buffer.from(HTML)).length / 1024;
note("index.html " + rawKB.toFixed(1) + " KB raw, " + gzipKB.toFixed(1) + " KB gzipped");
/* Raised 150 -> 160 in 1.9.5 (ratings data + the machine-readable curated
   list), 160 -> 165 in 2.0.0 (the progress card's drawing code, tightened
   first), and 165 -> 200 in 2.5.0 alongside the FIRST gzip raise, 50 -> 80 —
   both the owner's explicit numbers, on the record 4 Aug 2026, authorizing
   seed-200 and whatever honest growth follows. The ceilings moved; the
   discipline did not: arithmetic still fails the build, and every raise is
   still a recorded owner decision, never a drift. */
if(rawKB > 200) fail("index.html is " + rawKB.toFixed(1) + " KB raw, over the 200 KB budget");
if(gzipKB > 80) fail("index.html is " + gzipKB.toFixed(1) + " KB gzipped, over the 80 KB budget");

/* Zero runtime dependencies is a promise in the README. There is no
   third-party code in index.html at all \u2014 the vendored QR encoder was the last
   of it and came out in 1.2.4; guard 10 fails if it returns. Nothing may be
   fetched at runtime either. */
/* 3.0.0: THIS REGEX HAD NEVER MATCHED THE PAGE. It required a double-quoted
   src, and the only external script the page has ever carried — the disclosed
   Cloudflare beacon — is written with single quotes, and `git log -S` says it
   always was. So the match array was empty on every run since the section was
   written, the carve-out below never once executed, and a script element added
   today with single quotes shipped green: section 42's origin sweep is an ALLOW
   list and already allows github.com for links. Quote style is not part of the
   rule, so it is no longer part of the pattern. */
var ext = HTML.match(/<script[^>]+src=["']https?:\/\/[^"']+["']/g) || [];
ext.forEach(function(tag){
  if(tag.indexOf("cloudflareinsights") < 0){
    fail("index.html loads external script " + tag + " — the app must run with no network");
  }
});
if(!ext.length){
  fail("section 29 found no external script tag at all — the disclosed " +
       "Cloudflare beacon is one, so either it has gone or this pattern has " +
       "stopped matching the page. An empty sweep is not a clean sweep");
}

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
/* 1.7.0 added 30 entries, two of which have no Bruce Wayne in them at all. The
   line for what belongs here stopped being obvious the moment the catalogue
   held the Joker films, so it is written down \u2014 and a written rule that can be
   deleted without anything noticing is a rule that lasts one refactor. The
   hard cases are named because they are what the rule is FOR: a rule that only
   answers the easy ones is a sentence, not a rule. */
if(README.indexOf("## What belongs in the catalogue") < 0){
  fail("README no longer describes what belongs in the catalogue \u2014 the landing " +
       "page claims every Batman story ever filmed, and the line that makes that " +
       "claim checkable has to be somewhere a reader can find it");
} else {
  ["Joker", "OnStar", "Return to the Batcave", "Super Best Friends Forever"].forEach(function(hard){
    if(README.indexOf(hard) < 0){
      fail("the inclusion rule no longer answers " + hard + " \u2014 it was written to " +
           "settle the cases on the line, and those are the cases");
    }
  });
}

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

var watchSrc = optionalFn("watchUrl", "nothing would build the watch link");
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

/* 3.0.0: watchUrl() takes the ENTRY, not the title. A title alone cannot say
   which production it means, which is the whole of Stage 2 — so these read the
   real entry out of the catalogue rather than passing a string that would have
   to be resolved by guessing. */
["Batman: Soul of the Dragon", "Teen Titans Go! vs. Teen Titans", "Harley Quinn"].forEach(function(t){
  var entry = FILMS.filter(function(f){ return f.t === t; })[0];
  if(!entry){ fail("the catalogue no longer carries \"" + t + "\""); return; }
  var u = sandbox.watchUrl(entry);
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
var u0 = sandbox.watchUrl(FILMS.filter(function(f){ return f.t === "Batman"; })[0] ||
                          {t: "Batman", gi: -1});
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

/* THE ALIGNMENT CLAUSE MOVED TO SECTION 119 IN 3.1.0, AND IT FLIPPED.
   It read: `.linkrow` must be `justify-content:flex-end` — "the watch link is
   no longer right-aligned". That is the eleven-release shape again, a guard
   outliving the thing it was written against and then certifying it. Flex-end
   put the link 171.7 px right of the description, the tick indent and both
   buttons in an expanded row; this clause was the thing that would have
   stopped the fix, and it went red before the fix did.

   It also had no fixture. Nothing in qa/negative/ ever tripped it, so it was
   never negative-tested and nobody ever had to look at what it asserted.

   Section 119 owns the watch link's rank and alignment now — one intention in
   one place, the same reason `.herorow .linkrow` stopped re-declaring
   `justify-content`. This section keeps the wiring: the URL, the year, and
   that there is exactly one link. */

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
   keeps the last three ticks rateable in place. */

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
if(/legendBlock\(\)/.test(optionalFn("viewStats"))){
  fail("the legend is back on Progress, where none of its badges render");
}

/* Three. Measured at 390px with eight entries watched: at five, Recent
   activity is 262px against the queue's 191px \u2014 history outweighing the queue
   on the tab that exists for the queue. At four it is still 26px ahead. Three
   is the first value where the queue wins (172 against 191). */
var amax = HTML.match(/var ACTIVITYMAX = (\d+);/);
if(!amax || amax[1] !== "3"){
  fail("ACTIVITYMAX is " + (amax ? amax[1] : "missing") + ", expected 3 \u2014 above " +
       "three, Recent activity is taller than the queue it sits under");
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
if((HTML.match(/[^n] scoreboard\(c\)|\+scoreboard\(c\)/g) || []).length !== 1){
  fail("scoreboard() is not rendered exactly once \u2014 it is a Progress metric, and " +
       "1.7.7 took it off Home, where it was a fourth statement of the completion ring");
}
["sc-done", "sc-left", "sc-skip"].forEach(function(cl){
  if(HTML.indexOf(cl) < 0) fail("the scoreboard lost its ." + cl + " colour hook");
});
if(!/\.bigstat button\{[^}]*text-align:center/.test(HTML)){
  fail("scoreboard numbers are no longer centred");
}
/* 2.8.0 made the three tiles controls. Each lands on the matching filter in
   The path by reusing data-act="tier", which already reads data-tf — one
   handler for "send me to this slice", not two. The tiles are asserted to BE
   buttons here; that they land somewhere real is section 109's job. */
(function(){
  var block = (HTML.match(/class="bigstat">[\s\S]*?scoreTile\("skip"[^;]*/) || [""])[0];
  var sb = fn("scoreboard") + fn("scoreTile");
  if(!/<button data-act="tier" data-tf="/.test(sb)){
    fail("the scoreboard tiles are not buttons any more — the counts went back " +
         "to being text, and Progress has no way into the slice it is counting");
  }
  ["done", "left", "skip"].forEach(function(tf){
    if(sb.indexOf('"' + tf + '"') < 0){
      fail("the scoreboard has no tile for the \"" + tf + "\" filter — all three " +
           "counts are a way in or none of them is");
    }
  });
  if(!/aria-label="'\+n\+' '\+/.test(sb)){
    fail("a scoreboard tile has no accessible name carrying its number — the " +
         "visible content is a bare figure and a word, so the name has to say " +
         "what tapping it does");
  }
})();
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
  /* 3.0.1 split this list, because it had been doing two jobs with one name and
     the second one arrived. An origin the page FETCHES tells a third party that
     somebody opened the page — that is what this section has always been about.
     An origin the page NAMES — a link the reader may choose to follow, or a
     sameAs entry declaring that two URLs are the same entity — sends nothing
     and is read by crawlers, not by browsers. github.com was already in here on
     the second footing; x.com joins it for the same reason.

     The distinction is written down rather than implied, because the next
     addition will be argued from this list and the wrong reading of it is
     "these origins are fine". They are fine to MENTION. Nothing here may be
     fetched except the disclosed beacon, and section 29's sweep is what holds
     that half. */
  var FETCHED = ["static.cloudflareinsights.com", "cloudflareinsights.com",
                 "nightwatcher.life"];
  var NAMED   = ["search.brave.com", "schema.org", "www.w3.org",
                 "www.sitemaps.org", "github.com", "x.com"];
  var ALLOWED = FETCHED.concat(NAMED);
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
   from the file rather than trusted.

   3.0.0 REWROTE THIS SECTION, AND IT WAS THE MOST SEVERE THING THE 2.7.5 AUDIT
   FOUND. Two holes, and the second is worse than the first.

   IT PINNED FOUR OF ELEVEN DIRECTIVES. The other seven were unchecked, so
   deleting static.cloudflareinsights.com from script-src shipped green and the
   disclosed beacon would simply have stopped; rewriting img-src, font-src,
   connect-src, style-src, worker-src and manifest-src to * shipped green as
   well. Every directive the page declares is now pinned to its exact value,
   and a directive the page declares that is NOT named here fails too \u2014 an
   unrecognised directive is an unreviewed one.

   AND THE HASH COULD BLESS THE WRONG SCRIPT. This section hashes the FIRST
   plain <script>; section 46's parse check takes the LONGEST. Today there is
   exactly one, so the two agree by luck. Add a small inline script above the
   application block and this section goes red with "stale hash \u2014 fix with
   npm run bless", and `npm run bless` then writes the hash of the decoy: both
   suites green over a page whose CSP blocks the entire application, and jsdom
   does not enforce meta CSP so smoke cannot see it either. The fix is not a
   better choice of script. A single hash cannot describe two scripts, so the
   AMBIGUITY is the bug: more than one plain <script> fails the build. */

(function(){
  /* Every directive the policy declares, with the value it must declare.
     script-src is the one that legitimately moves, and it is checked below
     against its own rule: the beacon origin, the hash, and nothing else. */
  var PINNED = {
    "default-src":  "'none'",
    "style-src":    "'self' 'unsafe-inline'",
    "font-src":     "'self'",
    "img-src":      "'self' data:",
    "manifest-src": "'self'",
    "connect-src":  "'self' https://cloudflareinsights.com",
    "worker-src":   "'self'",
    "base-uri":     "'none'",
    "form-action":  "'none'",
    "object-src":   "'none'"
  };
  var BEACON = "https://static.cloudflareinsights.com";

  var meta = HTML.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
  if(!meta){ fail("the Content-Security-Policy meta tag is gone"); return; }
  var csp = meta[1];

  var got = {};
  csp.split(";").forEach(function(part){
    var s = part.trim();
    if(!s) return;
    var sp = s.indexOf(" ");
    if(sp < 0){ got[s] = ""; return; }
    got[s.slice(0, sp)] = s.slice(sp + 1).trim();
  });

  Object.keys(PINNED).forEach(function(d){
    if(!(d in got)){
      fail("CSP no longer sets " + d + " \u2014 it fell back to default-src or to " +
           "the browser, and neither is the policy this page was reviewed with");
    } else if(got[d] !== PINNED[d]){
      fail("CSP sets " + d + " to \"" + got[d] + "\"; this build was reviewed " +
           "with \"" + PINNED[d] + "\". Change the pin in the same commit as " +
           "the policy, or the policy is unreviewed");
    }
  });
  Object.keys(got).forEach(function(d){
    if(d !== "script-src" && !(d in PINNED)){
      fail("CSP declares " + d + ", which nothing here checks \u2014 a directive " +
           "arrived without a pin, and an unpinned directive is an unreviewed one");
    }
  });

  if(/'unsafe-eval'/.test(csp)) fail("CSP allows unsafe-eval");
  if(/script-src[^;]*'unsafe-inline'/.test(csp)){
    fail("CSP allows unsafe-inline scripts \u2014 the hash is there so it does not have to");
  }
  var scriptSrc = got["script-src"] || "";
  if(scriptSrc.indexOf(BEACON) < 0){
    fail("script-src no longer allows " + BEACON + " \u2014 the analytics beacon is " +
         "disclosed in the privacy copy and in SECURITY.md, and dropping it " +
         "from the policy stops it without retiring it anywhere a reader looks");
  }
  scriptSrc.split(/\s+/).filter(Boolean).forEach(function(tok){
    if(tok === BEACON || /^'sha256-[A-Za-z0-9+/=]+'$/.test(tok)) return;
    fail("script-src carries " + tok + " \u2014 this page runs one hashed inline " +
         "block and one disclosed beacon origin, and nothing else belongs there");
  });

  /* ONE PLAIN SCRIPT. A single hash cannot describe two, and the two suites
     that read "the inline script" disagree about which one they mean. */
  var plain = HTML.match(/<script>[\s\S]*?<\/script>/g) || [];
  if(plain.length !== 1){
    fail("index.html carries " + plain.length + " plain <script> blocks. This " +
         "section hashes the first and section 46 parses the longest, so with " +
         "more than one they describe different code \u2014 and `npm run bless` " +
         "would write the hash of whichever came first, shipping a green build " +
         "over a page whose CSP blocks the application");
    return;
  }

  var declared = (csp.match(/'sha256-([A-Za-z0-9+/=]+)'/) || [])[1];
  if(!declared){ fail("CSP has no script hash"); return; }
  var body = (plain[0].match(/<script>([\s\S]*?)<\/script>/) || [])[1];
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
/* 3.0.2: THIS PATTERN ONLY LOOKED RIGHTWARD, and that made it a false positive
   waiting to happen. `rel="noopener noreferrer" target="_blank"` is correct
   HTML and a common ordering, and the old lookahead — which only scanned from
   `target` to the end of the tag — failed the build on it. A guard that goes red
   on a correct page is worse than one with a gap: it sends the next person
   hunting a defect that does not exist, and it teaches them the guard is
   unreliable, which is how a real failure later gets waved through. Read the
   whole tag and check it for what it needs. */
(function(){
  (HTML.match(/<a\s[^>]*>/g) || []).forEach(function(tag){
    if(tag.indexOf('target="_blank"') < 0) return;
    if(tag.indexOf("noreferrer") < 0){
      fail('a target="_blank" link is missing rel="noreferrer": ' + tag.slice(0, 90));
    }
    if(tag.indexOf("noopener") < 0){
      fail('a target="_blank" link is missing rel="noopener": ' + tag.slice(0, 90));
    }
  });
})();

/* ---------- 44. Every watch link carries a year ----------------------- */
/* Thirteen titles repeat across the catalogue. Without a year they all resolve
   to whichever one the search engine thinks is more famous.

   AND UNTIL 3.0.0 THIS SECTION ENFORCED THE DEFECT. It required the earliest
   year ANYWHERE IN THE CATALOGUE for a title, which is the right rule for the
   seasons of one show and the wrong rule for a title two different productions
   share. Seven entries were sent to search for something else, and the harness
   was certifying it: The Batman (2022) asked for the 2004 cartoon, both 1966
   Batmans and the 1989 one asked for the 1943 serial, the DCEU's Justice League
   asked for the 2001 animated series, Birds of Prey asked for 2002, and the
   2014 Batman Beyond short asked for 1999.

   The unit was never the title. It is the title WITHIN ITS UNIVERSE \u2014 seasons
   of one show live in one continuity and should keep sharing a URL, and two
   productions that merely share a name never do. So the rule below moved from
   "the earliest year for this title" to "the earliest year for this title in
   this universe", which is exactly the key titleYear() now builds. The rule and
   the code changed in the same commit: a guard that outlives the thing it was
   written against will certify whatever replaces it. */

var wu = fn("watchUrl");
if(!/titleYear\(/.test(wu)){
  fail("watchUrl() does not add a year \u2014 repeated titles would resolve to the " +
       "wrong show");
}
if(!/watchUrl\(f\)/.test(fn("watchLinks"))){
  fail("watchLinks() no longer hands watchUrl() the entry \u2014 passing the title " +
       "alone is what sent seven entries to search for a different production, " +
       "because a title cannot say which one of them it means");
}
(function(){
  var byUrl = {};
  FILMS.forEach(function(f){
    var u = decodeURIComponent(sandbox.watchUrl(f));
    var y = sandbox.titleYear(f);
    if(u.indexOf(" " + y) < 0){
      fail("watch URL for \"" + f.t + "\" carries no year: " + u);
    }
    /* The earliest year for the title IN THIS UNIVERSE, not in the catalogue \u2014
       so every season of a show asks one question about that show, and a name
       two productions share does not drag one of them to the other's decade. */
    var sameUniverse = FILMS.filter(function(g){ return g.t === f.t && g.gi === f.gi; });
    var want = Math.min.apply(null, sameUniverse.map(function(g){ return g.y; }));
    if(y !== want){
      fail("watch URL for \"" + f.t + "\" (" + f.gname + ") uses " + y + ", not " +
           want + " \u2014 the first year this title appears in its own universe");
    }
    /* The defect this release fixed, asserted directly rather than implied: an
       entry may not be sent to search for a year no entry of that title in its
       universe carries. */
    if(sameUniverse.map(function(g){ return g.y; }).indexOf(y) < 0){
      fail("watch URL for \"" + f.t + "\" (" + f.gname + ") searches " + y +
           ", which is not the year of any entry of that title in that " +
           "universe \u2014 the reader is sent to a different production");
    }
    byUrl[u] = byUrl[u] || {};
    byUrl[u][f.t + " \u00b7 " + f.gname] = 1;
  });
  /* Seasons of one show sharing a URL is the design. Two DIFFERENT productions
     sharing one \u2014 the same title in two universes, or two titles \u2014 would mean a
     year failed to separate them, which is the 3.0.0 defect in reverse. */
  var collided = Object.keys(byUrl).filter(function(u){ return Object.keys(byUrl[u]).length > 1; });
  if(collided.length){
    fail("two different productions share a watch URL: " + collided[0] + " \u2014 " +
         Object.keys(byUrl[collided[0]]).join(", "));
  }
  note("watch links: " + Object.keys(byUrl).length + " distinct searches for " +
       FILMS.length + " entries, each keyed on its own universe");
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

/* ---------- 46. The README states the real weight --------------------- */
/* It drifts every release, and it is the first number anyone reads. */

var rmSize = README.match(/currently (\d+) KB \/ (\d+) KB/);
if(!rmSize){
  warn("README no longer states the current size");
} else {
  var realRaw = Math.round(Buffer.byteLength(HTML) / 1024);
  /* Same level as the weight budget in section 29, or the README quotes a
     number the budget is not measuring. */
  var realGz  = Math.round(require("zlib").gzipSync(Buffer.from(HTML)).length / 1024);
  if(parseInt(rmSize[1], 10) !== realRaw || parseInt(rmSize[2], 10) !== realGz){
    fail("README says " + rmSize[1] + " KB / " + rmSize[2] + " KB, actual is " +
         realRaw + " KB / " + realGz + " KB");
  }
}

/* The page's own script parses. 2.7.4: an edit to a string concatenation
   dropped a single quote, leaving `...+BUILT+ \u00b7 <a href=...` \u2014 a syntax
   error that would have stopped the app from running at all, on every browser.

   The harness did catch it: smoke.js builds the page in jsdom, so it died. But
   it died by throwing a raw stack trace with a line number, which is not the
   same as being told the file will not parse. On a 180 KB single file that is
   the difference between a minute and an hour.

   So the whole script block is parsed here, before anything else in this run
   has an opinion about it, and the failure says what happened. new vm.Script()
   compiles without executing, which is exactly the question being asked.

   It is cheap and it guards the one class of mistake this project is most
   exposed to: every release edits string-concatenated markup by hand. */
(function(){
  var blocks = HTML.match(/<script>([\s\S]*?)<\/script>/g) || [];
  var app = blocks.map(function(b){ return b.replace(/^<script>|<\/script>$/g, ""); })
                  .sort(function(a, b){ return b.length - a.length; })[0];
  if(!app || app.length < 1000){
    fail("cannot find the app's script block \u2014 this guard is measuring nothing");
    return;
  }
  try {
    new vm.Script(app, {filename: "docs/index.html <script>"});
  } catch(e){
    fail("the app's script does not parse: " + e.message + " \u2014 the page would " +
         "not run at all. Every release edits string-concatenated markup by " +
         "hand, and a dropped quote looks like nothing in a diff");
  }
  note("script block parses: " + app.length + " bytes");
})();

/* ---------- 47. The wordmark returns to the top ----------------------- */
/* THE HEADER IS THREE FLEX COLUMNS with both flankers boxed at 46px, so the
   wordmark is always mathematically centred and nothing here was ever
   misaligned in the box model \u2014 which is exactly why it went unnoticed for
   eleven releases. What is lopsided is the mass INSIDE the boxes.

   THREE RELEASES CORRECTED THIS AND ALL THREE MEASURED THE WRONG THING.
   2.7.3 grew the bat 32 -> 40 against "a 46px ring"; 46 is the ring's box, and
   at r=19/4px it drew 42. 2.7.5 fixed that side, set both to "44", and wrote
   THIS GUARD as bat-width == 2*(r + stroke/2) \u2014 a real relationship, with one
   term read from `.mark svg{width:44px}`. A CSS width is a box. The glyph
   inside it sits in a viewBox with 4 units of padding each side and draws
   39.81px, so the guard was green for a 4.19px gap while asserting the two
   were equal.

   AND THE TARGET WAS WRONG AS WELL AS THE TERM. Equality is what a symmetric
   row looks like on paper; it is not the requirement. The owner's rule, 5 Aug:
   THE RING IS NEVER WIDER THAN THE BAT. The bat is the logo, the ring is a
   readout of how far you have got, and a readout that outdraws the mark is the
   wrong way round. A rule with a direction in it cannot be satisfied by luck.
   Two of the three releases above were satisfied by luck.

   So this section measures the GLYPH \u2014 every path and the ellipse, flattened,
   real cubic extrema rather than the control hull, the group transform applied,
   scaled by cssWidth/viewBoxWidth \u2014 and requires the ring to come in strictly
   under it. NO TOLERANCE. A one-pixel slack is precisely what would let r=18
   (40px drawn, 0.19 over) read as a pass.

   THE CEILING IS THE NARROW PHONE. At 375px the row leaves ~219px for the
   wordmark once the two 46px flankers and two 14px gaps are taken. NIGHT
   WATCHER in uppercase Limelight measures ~187px at 24px, so it fits with
   room; it does not at 28. .wordmark is flex:1 with min-width:0, so it shrinks
   silently rather than pushing back \u2014 nothing would go red, the title would
   just start wrapping on somebody's phone. */
(function(){
  /* Real bounding box of an SVG path made of M/L/C/Z. The control-point hull
     is not good enough: it over-reports, which on this glyph would make the
     bat look wider than it draws and hand the ring room it has not got. */
  function cubicExtrema(p0, p1, p2, p3){
    var out = [p0, p3];
    var a = -p0 + 3 * p1 - 3 * p2 + p3;
    var b = 2 * (p0 - 2 * p1 + p2);
    var c = -p0 + p1;
    function at(t){ var u = 1 - t;
      return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3; }
    function keep(t){ if(t > 0 && t < 1) out.push(at(t)); }
    if(Math.abs(a) < 1e-12){
      if(Math.abs(b) > 1e-12) keep(-c / b);
    } else {
      var disc = b * b - 4 * a * c;
      if(disc >= 0){
        var rt = Math.sqrt(disc);
        keep((-b + rt) / (2 * a));
        keep((-b - rt) / (2 * a));
      }
    }
    return out;
  }
  var unsupported = null;
  function pathBox(d, box){
    var t = d.match(/[A-Za-z]|-?\d*\.?\d+/g) || [];
    var i = 0, cur = null, first = null, cmd = null;
    function put(x, y){
      if(!box.n){ box.x0 = box.x1 = x; box.y0 = box.y1 = y; box.n = 1; return; }
      if(x < box.x0) box.x0 = x;
      if(x > box.x1) box.x1 = x;
      if(y < box.y0) box.y0 = y;
      if(y > box.y1) box.y1 = y;
    }
    while(i < t.length){
      if(/^[A-Za-z]$/.test(t[i])){ cmd = t[i]; i++; }
      if(cmd === "M" || cmd === "L"){
        cur = [parseFloat(t[i]), parseFloat(t[i + 1])]; i += 2;
        if(cmd === "M") first = cur;
        put(cur[0], cur[1]);
      } else if(cmd === "C"){
        var p1 = [parseFloat(t[i]), parseFloat(t[i+1])],
            p2 = [parseFloat(t[i+2]), parseFloat(t[i+3])],
            p3 = [parseFloat(t[i+4]), parseFloat(t[i+5])];
        i += 6;
        cubicExtrema(cur[0], p1[0], p2[0], p3[0]).forEach(function(x){ put(x, cur[1]); });
        cubicExtrema(cur[1], p1[1], p2[1], p3[1]).forEach(function(y){ put(cur[0], y); });
        put(p3[0], p3[1]);
        cur = p3;
      } else if(cmd === "Z" || cmd === "z"){
        cur = first; i++;
      } else {
        unsupported = cmd;
        return;
      }
    }
  }

  var markSvg = (HTML.match(/<button class="mark"[\s\S]*?<\/button>/) || [""])[0];
  var css     = (HTML.match(/\.mark svg\{[^}]*width:(\d+(?:\.\d+)?)px/) || [])[1];
  var vb      = (markSvg.match(/viewBox="([-\d.\s]+)"/) || [])[1];
  var word    = (HTML.match(/\.wordmark h1\{[^}]*font-size:(\d+(?:\.\d+)?)px/) || [])[1];
  var ringArc = (HTML.match(/<circle id="ringArc"[\s\S]*?\/?>/) || [""])[0];
  var rr  = parseFloat((ringArc.match(/\br="([\d.]+)"/) || [])[1]);
  var rsw = parseFloat((ringArc.match(/stroke-width="([\d.]+)"/) || [])[1]);

  if(!markSvg || !css || !vb){
    fail("cannot read the header bat's viewBox or its rendered width \u2014 the " +
         "flanker comparison below is the whole point of this section and it " +
         "has nothing to measure");
    return;
  }
  if(!word){ fail("cannot read the wordmark size"); return; }
  if(!(rr > 0) || !(rsw > 0)){
    fail("cannot read the ring's radius and stroke to compare it with the bat");
    return;
  }

  var vbp = vb.trim().split(/\s+/).map(parseFloat);
  var tr  = (markSvg.match(/transform="translate\(([-\d.]+)\s*,\s*([-\d.]+)\)"/) || []);
  var tx  = tr.length ? parseFloat(tr[1]) : 0;
  var ty  = tr.length ? parseFloat(tr[2]) : 0;

  var box = {n: 0};
  (markSvg.match(/\sd="([^"]+)"/g) || []).forEach(function(m){
    pathBox(m.slice(4, -1), box);
  });
  (markSvg.match(/<ellipse[^>]*>/g) || []).forEach(function(e){
    var cx = parseFloat((e.match(/cx="([-\d.]+)"/) || [])[1]);
    var cy = parseFloat((e.match(/cy="([-\d.]+)"/) || [])[1]);
    var rx = parseFloat((e.match(/rx="([-\d.]+)"/) || [])[1]);
    var ry = parseFloat((e.match(/ry="([-\d.]+)"/) || [])[1]);
    if(isFinite(cx) && isFinite(cy) && isFinite(rx) && isFinite(ry)){
      pathBox("M" + (cx - rx) + " " + (cy - ry) + "L" + (cx + rx) + " " + (cy + ry), box);
    }
  });

  if(unsupported){
    fail("the bat's path uses the \"" + unsupported + "\" command, which this " +
         "section cannot measure \u2014 extend pathBox() rather than letting the " +
         "glyph go unmeasured, which is how the last three headers went wrong");
    return;
  }
  if(!box.n){ fail("found no drawable shapes inside the header bat"); return; }

  var scale    = parseFloat(css) / vbp[2];
  var batDrawn = (box.x1 - box.x0) * scale;
  var batTall  = (box.y1 - box.y0) * scale;
  var ringDrawn = 2 * (rr + rsw / 2);

  /* THE OWNER'S RULE. Strictly under, and no tolerance \u2014 see the header. */
  if(!(ringDrawn < batDrawn)){
    fail("the ring draws " + ringDrawn.toFixed(2) + "px and the bat draws " +
         batDrawn.toFixed(2) + "px, so the readout is as wide as the mark or " +
         "wider. The bat is the logo; the ring says how far you have got. " +
         "Lower r or thin the stroke until 2*(r + stroke/2) is under the " +
         "glyph's own width \u2014 not its CSS box, which is " + css + "px and has " +
         "never been what the bat draws");
  }
  /* Kept from 2.7.3: the box, not the glyph, is what overflows the column. */
  if(parseFloat(css) > 46){
    fail("the bat is " + css + "px in a 46px column \u2014 it overflows its own " +
         "flank and starts taking the wordmark's room on a narrow phone");
  }
  /* A ring that is under the bat by a mile is a different bug from one that is
     over it, and only the first is silent. Half the mark is the floor. */
  if(ringDrawn < batDrawn / 2){
    fail("the ring draws " + ringDrawn.toFixed(2) + "px against a " +
         batDrawn.toFixed(2) + "px bat \u2014 under it, but so far under that the " +
         "percentage inside it is the only thing holding the right-hand flank");
  }
  if(parseFloat(word) < 23){
    fail("the wordmark is " + word + "px \u2014 2.7.3 set it to 24 on the owner's " +
         "word, alongside the bat, because the two balance each other");
  }
  if(parseFloat(word) > 26){
    fail("the wordmark is " + word + "px \u2014 above ~26 it stops fitting the " +
         "~219px a 375px phone leaves between the flankers, and .wordmark " +
         "shrinks silently rather than failing");
  }
  note("header: bat draws " + batDrawn.toFixed(2) + " × " + batTall.toFixed(2) +
       "px in a " + css + "px box (viewBox " + vb.trim() + ", translate " + tx + "," + ty +
       "), ring draws " + ringDrawn.toFixed(2) + "px, wordmark " + word + "px");
})();

if(!/id="topBtn"/.test(HTML)) fail("the wordmark is no longer a control");
if(HTML.indexOf('getElementById("topBtn")') < 0){
  fail("the wordmark has no click handler \u2014 tapping the title would do nothing");
}
if(!/<h1><button id="topBtn">/.test(HTML)){
  fail("the wordmark button is outside its h1 \u2014 the heading must stay a heading");
}

/* ---------- 48. The footer describes the link that exists ------------- */
/* It described "Streaming now" for two releases after that link was replaced.
   From 1.6.5 until 1.6.6 this header stood here with nothing under it and its
   checks sat a thousand lines below, past the guard that validates numbering \u2014
   so the INDEX pointed at an empty room and guard 66 was satisfied by the sign
   on the door. The empty-section check added to 66 in 1.6.6 is the fix; this is
   the repair. */

["Streaming now", "Streaming rows"].forEach(function(dead){
  if(HTML.indexOf(dead) >= 0){
    fail('the Progress footer still mentions "' + dead + '" \u2014 the link is a search now');
  }
});

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
/* .linkrow's flex-end is guarded once, in section 32. It renders in both the
   hero and the detail panel, and one rule serves both. */
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
              persist:function(){}, render:function(){}, now:function(){ return 1; },
              /* 3.0.0 moved rate() onto the tick fast path, so the stub set
                 has to carry it too. A repaint is not what this section is
                 about; what happens to S is. */
              tickUpdate:function(){} };
  /* Hand-written copies of clampRating() and markWatched() lived here until
     1.7.5 and quietly diverged from the app: parseInt where the page uses
     Math.floor(Number()), and a markWatched that never cleared S.skipped. This
     section then validated the copies. Extract, like everything else. */
  new vm.Script(fn("clampRating") + "\n" + fn("markWatched")).runInContext(vm.createContext(box));
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

  /* Now that markWatched() is the real one, what it actually does can be
     asserted. Rating something you had skipped has to clear the skip, or the
     entry is watched and skipped at once and every denominator disagrees with
     the next. The hand-written stub omitted that line, so this could not be
     checked until 1.7.5. */
  box.S.watched = {}; box.S.rated = {}; box.S.log = []; box.S.skipped = {z:1};
  rate("z", 3);
  if(box.S.skipped.z) fail("rating a skipped entry left it skipped as well as watched");
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
  /* Format was group-only until 1.7.1, which is how Clayface \u2014 a live-action
     film in a group whose other entry is animated \u2014 shipped with an ANIMATED
     badge and vanished under the Live action filter. The DCU is the catalogue's
     first mixed-format continuity and the model could not express one. An entry
     may now override its group; the group is still the default, so nothing that
     does not need the override carries it. */
  var badEntry = [];
  PATH.forEach(function(gr){
    gr.films.forEach(function(f){
      if(f.fmt && f.fmt !== "live" && f.fmt !== "anim") badEntry.push(f.i);
      if(f.fmt && f.fmt === (gr.fmt || "anim")) badEntry.push(f.i + " (overrides its group with the group's own value)");
    });
  });
  if(badEntry.length){
    fail("entry format override is wrong on: " + badEntry.slice(0, 4).join(", "));
  }
  if(!/fmt:\(f\.fmt \|\| g\.fmt \|\| "anim"\)/.test(HTML)){
    fail("an entry can no longer state its own format \u2014 a live-action film in " +
         "an animated group is invisible under the Live action filter, which is " +
         "exactly how Clayface shipped in 1.7.0");
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
  /* Set to 12 when 1.5.0 shipped twelve. There are 30, so the old floor would
     have needed nineteen entries to disappear before it noticed. */
  if(live.length < 28) fail("live-action entries dropped to " + live.length + ", expected at least 28");
  live.forEach(function(f){
    if(f.e === undefined) fail(f.id + " has no era");
    if(!tierOf(f)) fail(f.id + " resolves to no tier");
  });
  /* Every continuity, not one. Written for the Dark Knight Saga in 1.7.0 and
     scoped to it, which meant the rule was enforced on one continuity in 42 while
     five others ran backwards \u2014 the DC Animated Movie Universe oscillated seven
     times across sixteen films, rendering Apokolips War, in which Damian dies in
     Batman's arms, before the film that introduces Damian.

     Two kinds of group are exempt, for two different reasons:
     - a BAG has no arc at all, so it has no direction to run backwards in. The
       flag is in the data because the reader is told the same thing.
     - a WEAVE interleaves several arcs on purpose. The DCAU's by-universe order
       is a watch order across five shows, and its group note prescribes it; the
       era is a position in one life. Those are different axes, and requiring
       them to agree would force the note to lie. Named here rather than flagged
       in the data because it is a fact about the guard, not about the reader. */
  var WEAVES = {
    "DC Animated Universe": "five shows interleaved; the group note prescribes the weave",
    "Tomorrowverse": "Superman and Batman arcs alternating; Long Halloween is year two",
    "The Comic Adaptations": "seven unrelated adaptations arranged as one life, and a " +
                       "derivative work has to follow its source whatever era it sits in"
  };
  PATH.forEach(function(gr){
    if(gr.bag || WEAVES[gr.name]) return;
    var prev = null;
    gr.films.forEach(function(f){
      /* Era 0 is the absence of a position, not a late one. A continuity that
         runs era 3 -> era 0 -> era 3 has not aged backwards; it has one entry
         that does not sit anywhere. Skipping them is what lets The LEGO
         Movieverse hold a placed film between two unplaceable ones. */
      if(!(f.e || 0)) return;
      var here = eraRank(f.e || 0);
      if(prev !== null && here < prev){
        fail(gr.name + " runs backwards through the eras at " + f.i + " \u2014 a " +
             "continuous story can age, but it cannot un-age. If this group is not " +
             "one arc, flag it bag:1 or name it in WEAVES with the reason.");
      }
      prev = Math.max(prev === null ? here : prev, here);
    });
  });
  Object.keys(WEAVES).forEach(function(n){
    if(!PATH.some(function(gr){ return gr.name === n; })){
      fail('WEAVES names "' + n + '", which is not a continuity any more');
    }
  });

  /* Written until 1.7.0 as "one continuous arc, one era", which pinned all three
     Nolan films to era 2. That was never the rule the rest of the catalogue
     follows \u2014 The Batman (2004) spans three eras and the DCAU spans five, because
     an era is a life stage and a long story moves through them. Rises opens eight
     years later with Bruce retired and his back broken, and era 6 is named for
     exactly that. What is actually worth protecting is direction: a continuous
     arc may advance through eras, never back up.
     Identified by name, not by group number \u2014 the number moved in 1.7.0 and this
     check silently found zero films. */
  var nolan = FILMS.filter(function(f){ return f.gname === "The Dark Knight Trilogy"; });
  if(nolan.length !== 3) fail("the Dark Knight Trilogy should hold 3 films, found " + nolan.length);
  nolan.slice(1).forEach(function(f, i){
    if(f.e < nolan[i].e){
      fail("the Dark Knight Trilogy runs backwards through the eras at " + f.id +
           " (era " + f.e + " after era " + nolan[i].e + ") \u2014 a continuous story " +
           "can age, but it cannot un-age");
    }
  });
  if(nolan.every(function(f){ return f.e === nolan[0].e; }) === false &&
     nolan[nolan.length - 1].e === nolan[0].e){
    fail("the Dark Knight Trilogy leaves and returns to the same era");
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
if(!/class="includes'\+/.test(HTML)){
  fail("format and scope are no longer grouped \u2014 three loose selectors read as a " +
       "settings panel");
}
if(!/b\.dataset\.format/.test(HTML)) fail("nothing handles a format tap");
/* scopeNote() was removed in 1.7.5. It had one caller, in the branch of
   scopeSwitch() that stopped running when the switches moved into the chooser,
   so the copy it produced had been unreachable for several releases and the
   format bug this section found could not be seen by anybody. If the note is
   wanted back it has to be re-sited deliberately; see NOTES.md. */

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
  var order = ["masterChooser()", "introBlock()", "class=\"hero\"", "GRIDNAME"];
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
  /* The fill check above is strictly stronger \u2014 anything passing it passes a
     bare "mentions signal" test, so that second check could never fire. What it
     was reaching for is that the LABEL says so too, which nothing tested. */
  if(HTML.indexOf('class="leadkick"') < 0){
    fail("the recommended path is not named \u2014 a fill says \u201cthis one\u201d only to " +
         "someone already looking for it; the lead card says it in words");
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
  /* The pressed-state fill is guarded once, in section 54. */
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
  /* Flex, and deliberately not grid. The grid version placed the tick with
     grid-row:1/-1 and no column, so anything added to the row auto-flowed into
     the first track and pushed every title sideways \u2014 104px, in 1.6.2. Flex has
     no auto-placement to get wrong. */
  var row = (HTML.match(/\.arow\{[^}]*\}/) || [""])[0];
  if(!/display:flex/.test(row)){
    fail("the Activity row is a grid again \u2014 its last layout placed the tick " +
         "across all rows with no column, and auto-placement moved every title");
  }
  if(/flex-wrap/.test(row)){
    fail("the Activity row can wrap \u2014 one row growing taller than its neighbours " +
         "is the thing this layout exists to prevent");
  }
  /* The title truncates rather than wrapping, for the same reason. */
  if(!/text-overflow:ellipsis/.test(at)){
    fail("the Activity title wraps instead of truncating, so a long one makes its " +
         "row taller than every other");
  }
  /* The stars are on the line and reachable. Hiding them behind a tap in 1.6.2
     removed a control that was being used.
     Extracted here rather than reaching for guard 34's `ab`, which is what this
     line did until 1.6.6: a var declared in a bare block 780 lines above,
     visible only through hoisting. Scoping or deleting that block would have
     crashed this section with a ReferenceError instead of failing a guard. */
  var ab = optionalFn("activityBlock", "there would be no Activity block to check");
  if(!/starRow\(f\)/.test(ab)){
    fail("the Activity rows no longer carry their stars \u2014 hiding them in 1.6.2 " +
         "took away a control that was in use");
  }
  if(/data-act="apeek"/.test(HTML)){
    fail("Recent activity is behind a tap again \u2014 it hides the stars, and the " +
         "reveal is what broke the row alignment");
  }
  var tick = (HTML.match(/\.arow \.tick\{[^}]*\}/) || [""])[0];
  var tickW = parseFloat((tick.match(/width:([\d.]+)px/) || [0, 99])[1]);
  var pathTick = parseFloat((HTML.match(/\.tick\{[^}]*width:([\d.]+)px/) || [0, 0])[1]);
  if(!(tickW < pathTick)){
    fail("the Activity tick is " + tickW + "px, the same as the Path row's " + pathTick +
         "px \u2014 in this block it out-shouts the title it belongs to");
  }
})();
/* Nine badges, six colours, three exact collisions: Core read as Animated,
   Optional as Short, Interactive as Live action. Colour now carries the value
   and shape carries the kind \u2014 tier filled, modifiers outlined, format dashed. */
(function(){
  var rules = {}, m, re = /\.bd\.([a-z]+)(?:,\.bd\.([a-z]+))?\{([^}]*)\}/g;
  while((m = re.exec(HTML))){
    rules[m[1]] = m[3];
    if(m[2]) rules[m[2]] = m[3];
  }
  ["e", "k", "o", "u", "c", "s", "fmanim", "fmlive"].forEach(function(b){
    if(!rules[b]) fail("badge ." + b + " has no styling");
  });
  /* 2.7.2: the list above is hand-kept, so a kind added to BADGE and to nothing
     else was invisible here — which is close to how the Mature badge survived
     four releases after the ratings replaced it. The map is now checked against
     the list rather than trusted to agree with it. */
  var KINDS = ["e", "k", "o", "u", "c", "s"];
  Object.keys(sandbox.BADGE || {}).forEach(function(b){
    if(KINDS.indexOf(b) < 0){
      fail('BADGE carries "' + b + '", which this guard does not know about \u2014 ' +
           "a badge kind nobody listed is a badge kind nobody styled, sized or " +
           "explained in the legend");
    }
  });
  KINDS.forEach(function(b){
    if(!(sandbox.BADGE || {})[b]){
      fail('BADGE has lost "' + b + '" \u2014 entries carrying it would render an ' +
           "empty box");
    }
  });
  /* Tier is the answer to "should I watch this" and there is always exactly
     one, so it is the only filled kind. */
  ["e", "k"].forEach(function(b){
    if(!/background:var\(--/.test(rules[b] || "")) fail("tier badge ." + b + " is no longer filled");
  });
  ["u", "c", "s"].forEach(function(b){
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

/* Activity carries no badges, on purpose. 1.5.9 added them because it was the
   one place a logged entry rendered with none; 1.6.3 took them back out because
   they do not fit on one line beside the stars, and the row being one line is
   worth more than the label. Recorded as a reversal so it is not "restored" by
   someone reading only the 1.5.9 note. */
if(/class="abadge"/.test(HTML)){
  fail("Recent activity is drawing badges again \u2014 they were removed in 1.6.3 so " +
       "the row could hold the title, the date and the stars on one line");
}
/* The queue reveals badges and the continuity on request \u2014 never the
   description, which is where the spoiler risk lives. */
if(!/data-act="peek"/.test(HTML)) fail("the Then rows are not tappable");
if(!/act === "peek"/.test(HTML)) fail("nothing handles a Then row tap");
(function(){
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
/* Activity took 40.5% of Next up against Then's 16.4% \u2014 a history row was
   122.5px against a queue row's 56 \u2014 so the tab spent two and a half times more
   room on what you had done than on what you were about to do.
   1.6.0 blamed the container and forbade the card. That was the wrong target:
   the card was fine, the size was not. This guard holds the proportion instead,
   which is the thing that was actually wrong. It would have passed every build
   from 1.6.0 on, and still failed the layout that drew the complaint. */

(function(){
  var act = (HTML.match(/\.activity\{[^}]*\}/) || [""])[0];
  if(!act){ fail("the Activity block has no styling of its own"); return; }
  var ab = optionalFn("activityBlock", "there would be no history");

  /* One line a row. Anything that puts a second line back \u2014 a wrapping title, a
     badge row, a reveal \u2014 doubles the block and the proportion goes with it. */
  var rowLines = (ab.match(/'<span class="a[a-z]+"/g) || []).length;
  if(rowLines > 1){
    fail("an Activity row is building " + rowLines + " labelled spans \u2014 it holds a " +
         "title beside its stars, and anything more stops it being one line");
  }
  /* Five entries, one line each, against a queue of four. If a row can grow,
     this ratio is what notices. */
  var arowPad = parseFloat((HTML.match(/\.arow\{[^}]*padding:([\d.]+)px/) || [0, 0])[1]);
  var qitemPad = parseFloat((HTML.match(/\.qitem\{[^}]*padding:([\d.]+)px/) || [0, 0])[1]);
  if(!arowPad || !qitemPad){ fail("cannot read the row padding on both blocks"); return; }
  if(arowPad > qitemPad){
    fail("an Activity row is padded " + arowPad + "px against a queue row's " +
         qitemPad + "px \u2014 history must not be roomier than the queue it sits under");
  }
  /* The row count itself is pinned exactly in section 34, so a ceiling here
     could never fire. What this section owns is the proportion: the padding
     comparison above, which is what notices if a row grows. */
  /* Numbers are what says Then is a sequence rather than another history. */
  if(!/class="qn"/.test(HTML)){
    fail("the Then rows lost their numbers \u2014 they are what separates a queue from " +
         "a list of things already done");
  }
  if(!/\.arow\{[^}]*border-top:1px solid var\(--line\)/.test(HTML)){
    fail("the Activity rows have no rule between them");
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
    var fsize = body.match(/(?:^|[;{\s])font-size:\s*([\d.]+)px/);
    if(!fsize) return;
    FIELDS.forEach(function(f){
      if(!new RegExp("\\." + f + "\\b").test(sel)) return;
      if(/::/.test(sel)) return;
      seen[f] = 1;
      if(parseFloat(fsize[1]) < 16){
        fail("." + f + " is " + fsize[1] + "px — iOS zooms the page on any focused " +
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

/* ---------- 64. The year is not printed twice -------------------- */
/* Nine Super Friends entries carry the year as their sub label — sub:"1973" and
   so on — and metaOf() pushes sub then y, so every meta line in the app read
   "1973 · 1973 · 16 episodes". Both heroes, the Then rows and The Path. Found
   on a soak, not by a guard, because nothing was checking the sentence the
   function produces rather than the fields it reads. */

(function(){
  var so = optionalFn("subOf", "nothing would filter a redundant label");
  if(!/f\.sub !== String\(f\.y\)/.test(so)){
    fail("subOf() no longer skips a sub that is only the year — nine entries " +
         "would print it twice on every line that describes them");
  }
  /* One filter, every reader. The 1.6.3 fix lived in metaOf() alone, so the
     queue — which composes its own title — went on doubling the year for a
     whole release. */
  ["metaOf", "activityBlock", "viewNext"].forEach(function(name){
    var body = optionalFn(name);
    if(/\.sub\b/.test(body) && !/subOf\(/.test(body)){
      fail(name + "() reads .sub directly instead of subOf(), which is how the " +
           "queue kept printing the year twice after metaOf() was fixed");
    }
  });
  /* Run it. The regexes above say the intent is there; this says it works. */
  var sandbox2 = {};
  vm.runInContext(so + "\n" + optionalFn("metaOf", "nothing would build the meta line"),
                  vm.createContext(sandbox2));
  var seen = 0;
  FILMS.forEach(function(f){
    var line = sandbox2.metaOf(f, false);
    var years = line.match(/\b\d{4}\b/g) || [];
    if(years.length > 1 && years[0] === years[1]){
      seen++;
      if(seen === 1) fail('metaOf() prints the year twice for "' + f.t + '": ' + line);
    }
  });
  if(seen > 1) fail(seen + " entries in total print their year twice");
  note("meta lines checked for a repeated year: " + FILMS.length);
})();

/* Every tab scrolls, by at least a hair. Next up is the only view whose content
   can be shorter than the screen, and a page that does not scroll keeps the
   browser chrome expanded while every other tab collapses it — so arriving at
   Next up changed the height of the visible area and leaving changed it back.
   svh is the viewport with the chrome showing; a pixel over it makes all four
   behave the same. */
(function(){
  var app = (HTML.match(/#app\{[^}]*\}/) || [""])[0];
  if(!app){ fail("#app has no styling of its own"); return; }
  var mh = app.match(/min-height:\s*([^;}]+)/);
  if(!mh){
    fail("#app sets no min-height \u2014 Next up can end up shorter than the screen, " +
         "and it is the only tab that does");
    return;
  }
  if(!/calc\(\s*100svh\s*\+/.test(mh[1])){
    fail("#app is " + mh[1].trim() + " \u2014 it has to clear the small viewport by a " +
         "pixel, or the one tab that fits without scrolling resizes the chrome " +
         "around it");
  }
})();

/* ---------- 65. The file points at where its reasoning went ------ */
/* 1.6.3 took 22 KB of explanatory comments out of index.html — the whole reason
   the catalogue can grow — and moved them to NOTES.md. What is left is one
   header block and the slug-freeze warning. The header is now the only thing in
   the served file telling anyone that the reasoning exists at all, so it is one
   careless delete from a codebase that looks arbitrary and undocumented. */

(function(){
  /* The pending-restore banner must reach both halves of Home. 1.6.4 emitted it
     only after the no-path early return \u2014 so on a fresh phone, the one device a
     restore link exists for, nothing appeared at all, and choosing a path first
     meant the link's own path was then discarded. */
  (function(){
    var home = optionalFn("viewHome", "there would be no Home");
    var cut = home.indexOf("return html;");
    if(cut < 0){ fail("Home no longer has a first-run branch"); return; }
    if(home.slice(0, cut).indexOf("pendingBanner()") < 0){
      fail("the restore-link banner is not rendered before Home's first-run " +
           "return \u2014 a device with no path chosen would see nothing, which is " +
           "exactly the device a restore link is for");
    }
    if(home.slice(cut).indexOf("pendingBanner()") < 0){
      fail("the restore-link banner is missing from Home once a path exists");
    }
    var pb = optionalFn("pendingBanner", "nothing would ask before restoring");
    if(!/isPath\(p\.path\)/.test(pb)){
      fail("the banner does not say when a link carries a path, so accepting it " +
           "quietly drops one");
    }
  })();

  var head = (HTML.match(/<script>\s*(\/\*[\s\S]*?\*\/)/) || [])[1];
  if(!head){
    fail("the header block is gone from the top of the script — nothing in the " +
         "served file now says the reasoning lives in NOTES.md");
    return;
  }
  /* Three counts describe the suites themselves, and the suites are the one
     thing that can count itself. The README said 242 smoke checks while smoke
     ran 262; before that it said 79 where the real figure was 231. Twice is a
     pattern and the third time would be a joke, so the numbers now come from
     the files. */
  (function(){
    var readmeTxt = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
    var negDir    = path.join(ROOT, "qa", "negative");
    var counts = [];

    /* The smoke count is not here on purpose. Many of its checks run inside
       loops, so counting call sites in that file gives a number that is not the
       number of checks that run. smoke.js asserts its own total against the
       README at the end of its run, where the real figure exists. */
    if(fs.existsSync(negDir)){
      var suites = fs.readdirSync(negDir).filter(function(f){ return /^negtest.*\.sh$/.test(f); });
      var fixtures = 0;
      suites.forEach(function(f){
        /* A quoted label, so the run_case() definition at the top of every
           suite is not counted as one of its own fixtures. Counting it was how
           the fixture total came to be reported as 194 when it was 178. */
        fixtures += (fs.readFileSync(path.join(negDir, f), "utf8")
                       .match(/^run_case\s+"/gm) || []).length;
      });
      counts.push(["negative suites", suites.length, /(\d+)\s+negative suites\b/]);
      counts.push(["negative fixtures", fixtures, /(\d+)\s+fixtures\b/]);
    }

    /* Every place a live count is stated, not only the README. 1.8.3 fixed the
       README's fixture count and wrote the new number into two qa.yml comments
       as 194 anyway \u2014 the count that had drifted in prose for six releases
       drifting once more inside the fix for the drift.

       CHANGELOG.md and NOTES.md are swept for nothing, on purpose. Both are
       records. The 1.8.3 entry says 192 fixtures and must still say that in a
       year; NOTES.md's account of the drift says "194 when it was 178", and both
       numbers are the point of the sentence. A history that updates itself is
       not a history. */
    var SWEEP = [["README.md", readmeTxt]];
    var wf = path.join(ROOT, ".github", "workflows", "qa.yml");
    if(fs.existsSync(wf)){
      SWEEP.push([".github/workflows/qa.yml", fs.readFileSync(wf, "utf8")]);
    }
    SWEEP.forEach(function(src){
      counts.forEach(function(c){
        var re = new RegExp(c[2].source, "g"), m, seen = 0;
        while((m = re.exec(src[1]))){
          seen++;
          if(parseInt(m[1], 10) !== c[1]){
            fail(src[0] + " says " + m[1] + " " + c[0] + "; there are " + c[1] +
                 " \u2014 a live count stated in prose has drifted from the thing " +
                 "it counts, which has now happened in three separate files");
          }
        }
        if(!seen && src[0] === "README.md") warn("README: no " + c[0] + " count to check");
      });
    });
    note("suite counts verified in " + SWEEP.length + " files: " + counts.map(function(c){
      return c[1] + " " + c[0]; }).join(", "));
  })();

  /* The header states a count. Counts in prose drift \u2014 the README's have been
     guarded since 1.5.x, and this one shipped wrong the release after it was
     written, because 1.6.4 added a guard and the sentence did not move. */
  (function(){
    var real = (fs.readFileSync(__filename, "utf8").match(/\/\* -{3,} \d+\./g) || []).length;
    [["the header block", head], ["NOTES.md", fs.existsSync(path.join(ROOT, "NOTES.md"))
       ? fs.readFileSync(path.join(ROOT, "NOTES.md"), "utf8") : ""]].forEach(function(pair){
      var m = pair[1].match(/(\d+)\s+(?:numbered\s+)?sections/);
      if(!m) return;
      if(parseInt(m[1], 10) !== real){
        fail(pair[0] + " says " + m[1] + " guard sections; there are " + real +
             " \u2014 a number in prose is a number that drifts, which is why the " +
             "README's counts are guarded too");
      }
    });
  })();
  ["NOTES.md", "CHANGELOG.md", "qa/guards.js"].forEach(function(doc){
    if(head.indexOf(doc) < 0){
      fail("the header block no longer names " + doc + " — it is the only pointer " +
           "left, so it has to point at all three");
    }
  });
  if(!fs.existsSync(path.join(ROOT, "NOTES.md"))){
    fail("NOTES.md is missing and the header block promises it");
    return;
  }
  /* Comments are gone on purpose. A handful creeping back is how 22 KB came to
     be there in the first place. */
  var all = (HTML.match(/\/\*[\s\S]*?\*\//g) || []);
  if(all.length > 2){
    fail(all.length + " script comments in index.html — the file carries the " +
         "header block and the slug freeze, and explanations go to NOTES.md");
  }
  /* This counter only ever saw script comments, so four explanatory HTML
     comments sat in the head from before 1.6.3 until 1.6.6 — about 950 bytes
     the policy said were not there. What is left is not explanation: an
     identity line, the notice about marks and lettering, and the two markers
     that bound a vendor snippet. Each is allowed by name, so a fifth cannot
     arrive quietly. */
  var ALLOWED_HTML_COMMENTS = [
    "Night Watcher \u00b7 https://github.com/6ummy-Dev/Night-Watcher",
    "No trademarked logos",
    "Cloudflare Web Analytics",
    "End Cloudflare Web Analytics"
  ];
  (HTML.match(/<!--[\s\S]*?-->/g) || []).forEach(function(c){
    var ok = ALLOWED_HTML_COMMENTS.some(function(a){ return c.indexOf(a) >= 0; });
    if(!ok){
      fail("an explanatory HTML comment is back in index.html (" +
           c.replace(/\s+/g, " ").slice(4, 60).trim() + "\u2026) \u2014 the no-comments " +
           "policy is about the file a reader downloads, not about which syntax " +
           "the comment is written in");
    }
  });
  if(!/IDs in i:"\.\.\." are FROZEN/.test(HTML)){
    fail("the slug-freeze warning is gone from above PATH — it is the one note " +
         "that has to sit where the temptation is");
  }
  /* Every identifier NOTES.md documents must still exist, or the notes rot the
     same way the README's file table used to. */
  var notes = fs.readFileSync(path.join(ROOT, "NOTES.md"), "utf8");
  var ghosts = [], keys = notes.match(/^### `([^`]+)`/gm) || [];
  keys.forEach(function(k){
    var name = k.replace(/^### `|`$/g, "").replace(/ \(cont\.\)$/, "");
    if(/^[a-zA-Z_$][\w$]*\(\)$/.test(name)){
      var fnName = name.slice(0, -2);
      if(!new RegExp("function\\s+" + fnName + "\\s*\\(").test(HTML)) ghosts.push(name);
    } else if(/^\.[a-zA-Z][\w-]*$/.test(name)){
      if(HTML.indexOf(name + "{") < 0 && HTML.indexOf(name + " ") < 0 &&
         HTML.indexOf(name + ",") < 0) ghosts.push(name);
    }
  });
  if(ghosts.length){
    fail("NOTES.md documents " + ghosts.length + " thing(s) index.html no longer has: " +
         ghosts.slice(0, 6).join(", "));
  }
  note("NOTES.md entries checked against the file: " + keys.length);
})();

/* ---------- 66. The guards are navigable ---------- */
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
  /* A header with no assertions under it. Section 48 stood empty from 1.6.5,
     its checks stranded after the last section, and every check in this block
     passed: the numbering ran clean and the INDEX listed 48. A heading is a
     promise that something is being checked. */
  var bodies = src.split(/\/\* -{3,} \d+\./).slice(1);
  bodies.forEach(function(body, i){
    var end = body.search(/\/\* -{3,} report/);
    if(end >= 0) body = body.slice(0, end);
    if(!/\bfail\(/.test(body)){
      fail("section " + nums[i] + " has a header and no assertion under it \u2014 the " +
           "INDEX promises a check that is not there");
    }
  });
  /* The INDEX groups rot the same way the numbering used to: every appended
     section brought its own heading, so META appeared three times, twice with
     nothing under it. */
  var heads = (idx.match(/\n   [A-Z][A-Z ]+\n/g) || []).map(function(h){ return h.trim(); });
  var dupe = heads.filter(function(h, i){ return heads.indexOf(h) !== i; });
  if(dupe.length){
    fail("the INDEX repeats the group heading(s) " + dupe.join(", ") + " \u2014 groups " +
         "are for finding things, and a name that appears twice finds nothing");
  }
  (idx.match(/\n   [A-Z][A-Z ]+\n(?=   [A-Z])/g) || []).forEach(function(empty){
    fail("the INDEX group " + empty.trim() + " has no sections under it");
  });
  note("guard sections: " + nums.length + ", numbered 1.." + nums[nums.length - 1]);
})();

/* ---------- 67. The dates say when the page actually changed ---------- */
/* sitemap.xml's lastmod and the JSON-LD dateModified drifted a day apart before
   1.6.0, and 1.6.2 guarded them \u2014 against each other. That catches a typo and
   nothing else: leave both untouched through a release and they agree perfectly
   and are both wrong, which is precisely what shipping does to a hand-written
   date. The CHANGELOG's newest date is the one that cannot be forgotten,
   because guard 16 already fails the build when that section does not match
   BUILD. Anchor the other two to it and the release date carries itself.
   Two unnumbered copies of the weaker check lived at opposite ends of this file
   until 1.6.6; this section is both of them. */

(function(){
  var sm   = fs.readFileSync(path.join(PUBLIC, "sitemap.xml"), "utf8");
  var last = (sm.match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/) || [])[1];
  var mod  = (HTML.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/) || [])[1];
  var log  = fs.existsSync(path.join(ROOT, "CHANGELOG.md"))
             ? fs.readFileSync(path.join(ROOT, "CHANGELOG.md"), "utf8") : "";
  var rel  = (log.match(/^##\s*\[(?!Unreleased)[^\]]+\][^\n]*?(\d{4}-\d{2}-\d{2})/m) || [])[1];
  if(!last){ fail("sitemap.xml has no lastmod \u2014 it tells a crawler nothing about freshness"); return; }
  if(!mod){ fail("the JSON-LD states no dateModified"); return; }
  if(!rel){ fail("CHANGELOG.md's newest release section carries no date"); return; }
  if(last !== mod){
    fail("sitemap.xml says the page changed on " + last + " and the JSON-LD says " +
         mod + " \u2014 both are hand-written and one of them is wrong");
  }
  if(last !== rel){
    fail("the served files date this page " + last + " and the newest CHANGELOG " +
         "release is " + rel + " \u2014 the build shipped and its dates did not move");
  }
  var built = (HTML.match(/var BUILT = "(\d{4}-\d{2}-\d{2})"/) || [])[1];
  if(!built){
    fail("the BUILT date is gone \u2014 the visible updated line has nothing to show");
  } else if(built !== rel){
    fail("the page says it was updated " + built + " but the newest CHANGELOG " +
         "release is " + rel + " \u2014 a freshness signal that lies is worse than none");
  }
  if(HTML.indexOf("updated '+BUILT") < 0){
    fail("the updated date is no longer rendered beside the Build line");
  }
  note("page date " + rel + ", agreed in sitemap.xml, the JSON-LD, CHANGELOG.md and the BUILT line");
})();

/* ---------- 68. The life path is a timeline, not a filing order --------- */
/* Until 1.7.1 an era rendered its entries in the order their continuity appeared
   in PATH \u2014 which is the order somebody typed things in, not a chronology. With
   62 entries in one era that read as noise. Every entry in a life era now carries
   lo:, its position within that era, and the whole point is that continuities
   blend: Year One, Batman Begins and Gotham Knight are three continuities and
   three consecutive rows.

   A hand-maintained position on 150 entries is a hand-maintained list, so: every
   era is either fully positioned or not positioned at all, positions run 1..n
   with no gaps, and no two entries in an era share one. Era 0 carries none by
   design \u2014 it is the entries with no position in a life, and giving them one
   would be inventing the thing this section exists to make honest. */

(function(){
  var byEra = {};
  FILMS.forEach(function(f){ (byEra[f.e] = byEra[f.e] || []).push(f); });
  var positioned = 0;
  Object.keys(byEra).forEach(function(k){
    var era = byEra[k], withLo = era.filter(function(f){ return f.lo; });
    if(String(k) === "0"){
      if(withLo.length){
        fail(withLo.length + " entries in \u201cOutside any timeline\u201d carry a life " +
             "position \u2014 the era exists for the entries that have none");
      }
      return;
    }
    if(!withLo.length){
      fail("era " + k + " has no life positions at all \u2014 it would render in the " +
           "order its continuities happen to be typed in, which is what 1.7.1 fixed");
      return;
    }
    if(withLo.length !== era.length){
      var missing = era.filter(function(f){ return !f.lo; }).map(function(f){ return f.id; });
      fail("era " + k + " is half-positioned; no lo on " + missing.slice(0, 3).join(", ") +
           " \u2014 they would fall to the end of the era in typing order");
      return;
    }
    var seen = {}, dupe = null, max = 0;
    era.forEach(function(f){
      if(seen[f.lo]) dupe = f.lo;
      seen[f.lo] = 1;
      if(f.lo > max) max = f.lo;
    });
    if(dupe){
      fail("era " + k + " gives position " + dupe + " to two entries \u2014 the tie is " +
           "then broken by typing order, silently");
    }
    if(max !== era.length){
      fail("era " + k + " has " + era.length + " entries and its highest position is " +
           max + " \u2014 positions run 1..n or the numbering means nothing");
    }
    positioned += era.length;
  });
  note("life path: " + positioned + " entries positioned across " +
       (Object.keys(byEra).length - 1) + " eras, " +
       (byEra["0"] ? byEra["0"].length : 0) + " outside any timeline");
})();

/* ---------- 69. The universes run in the order their stories start ----- */
/* By universe had no stated ordering principle until 1.7.2, so every continuity
   added landed wherever it was typed: Gotham \u2014 five seasons of Bruce before the
   cowl \u2014 rendered 37th of 42, and the first Batman ever filmed rendered 35th,
   while a continuity that starts in the League years rendered 5th.

   The rule now: a universe sits where its story starts. Within a band the
   curated order stands, which is why the DC Animated Universe still leads the
   universes that begin in the early years. This check does not force a total
   order \u2014 only that the list never goes backwards through the eras. */

(function(){
  var prev = null, prevName = "";
  PATH.forEach(function(gr){
    var best = -1;
    gr.films.forEach(function(f){
      if(!f.e) return;
      var r = ERAS.map(function(e){ return e.k; }).indexOf(f.e);
      if(r >= 0 && (best < 0 || r < best)) best = r;
    });
    if(best < 0) best = ERAS.length;     /* nothing placed: sorts to the end */
    if(prev !== null && best < prev){
      fail('"' + gr.name + '" starts earlier than "' + prevName + '" and renders ' +
           "after it \u2014 the universes run in the order their stories start");
    }
    prev = best; prevName = gr.name;
  });
})();

/* ---------- 70. An entry outside the timeline says why -------------- */
/* Era 0 held a quarter of the catalogue before 1.7.2, because "outside any
   timeline" had become the place things went when nobody wanted to judge them.
   Three quarters of it turned out to be placeable and filed on tone. What is
   left is fourteen entries and five distinct reasons, and an undifferentiated
   bucket is exactly what let the tone-filings hide. */

(function(){
  var WHY = {
    who:  "the Batman in it is not Bruce",
    many: "more than one Batman on screen",
    none: "no Batman in it at all",
    flat: "a Batman, but no state asserted anywhere",
    tbd:  "a real continuity whose place is not decided yet"
  };
  var missing = [], stray = [], bad = [];
  FILMS.forEach(function(f){
    var why = f.out;
    if(f.e === 0 && !why) missing.push(f.id);
    if(f.e !== 0 && why) stray.push(f.id);
    if(why && !WHY[why]) bad.push(f.id + ' says out:"' + why + '"');
  });
  if(missing.length){
    fail(missing.length + " entries sit outside the timeline without saying why (" +
         missing.slice(0, 3).join(", ") + ") \u2014 the reasons are " +
         Object.keys(WHY).join(", "));
  }
  if(stray.length){
    fail(stray.slice(0, 3).join(", ") + " has a life position and still claims a " +
         "reason for having none");
  }
  if(bad.length) fail(bad.slice(0, 3).join("; "));
  var tally = {};
  FILMS.forEach(function(f){ if(f.out) tally[f.out] = (tally[f.out] || 0) + 1; });
  note("outside the timeline: " + Object.keys(tally).sort().map(function(k){
    return tally[k] + " " + k;
  }).join(", "));
})();

/* ---------- 71. Tier resolution is checked against real entries ---------- */
/* Section 4 asserts that core + optional == everything, with core defined as
   "not optional" and optional as "optional". That closes for ANY tierOf,
   including one that never returns "o" at all — which is what a refactor
   dropping the f.o term would produce, flooding the Core route, the Next-up
   queue and every denominator with the whole Optional catalogue. The 1.7.2
   independent QA mutated exactly that and all seventy sections passed. An
   identity cannot be a test; named entries can. */

(function(){
  var CASES = [
    ["batman-mask-of-the-phantasm-1993", "e", "an Essential film"],
    ["the-dark-knight-rises-2012",       "k", "a Core film carrying no badges"],
    ["batwheels-season-1-2022",          "o", "an Optional season"]
  ];
  CASES.forEach(function(c){
    var f = FILMS.filter(function(x){ return x.id === c[0]; })[0];
    if(!f){ fail("tier fixture " + c[0] + " is not in the catalogue any more"); return; }
    var got = tierOf(f);
    if(got !== c[1]){
      fail("tierOf() puts " + c[2] + " (" + c[0] + ") in tier \"" + got +
           "\", not \"" + c[1] + "\" — the tiers have stopped meaning what the app says");
    }
  });
  var tally = {e:0, k:0, o:0};
  FILMS.forEach(function(f){ tally[tierOf(f)] = (tally[tierOf(f)] || 0) + 1; });
  /* Bands, not numbers: the catalogue grows. A tier emptying or swallowing the
     rest is the failure being watched for. */
  ["e", "k", "o"].forEach(function(t){
    if(!tally[t]) fail("no entry resolves to tier \"" + t + "\" — a whole tier has collapsed");
    if(tally[t] > FILMS.length * 0.85){
      fail("tier \"" + t + "\" holds " + tally[t] + " of " + FILMS.length +
           " entries — the other tiers have collapsed into it");
    }
  });
  note("tiers: " + tally.e + " essential, " + tally.k + " core, " + tally.o + " optional");
})();

/* ---------- 72. Every shareable route token still routes ---------- */
/* Section 9 checks that routeHash() exists. It does not check that it still
   understands anything. Deleting the #life branch survived the whole harness
   and every smoke check in the 1.7.2 QA — and #life is the link printed in the
   README, so every copy of it ever shared would have died on a green build.
   These tokens are a published interface; they get a frozen vocabulary.

   ROUTE_VOCAB sits at file scope because section 90 reads it too: the seed
   block's anchors must come from this list and no other, and a second copy of
   the vocabulary would drift from this one the way every copy drifts. */

var ROUTE_VOCAB = [
  ["life",      {tab:"watch", mode:"life"}],
  ["release",   {tab:"watch", mode:"release"}],
  ["universes", {tab:"watch", mode:"continuity"}],
  ["path",      {tab:"watch", mode:"continuity"}],
  ["progress",  {tab:"stats"}],
  ["next",      {tab:"next"}],
  ["series",    {scope:"all"}],
  ["movies",    {scope:"movies"}]
];

(function(){
  var VOCAB = ROUTE_VOCAB;
  var src = fn("routeHash");
  VOCAB.forEach(function(pair){
    var tok = pair[0], want = pair[1];
    var box = {
      S: {tab:"home", mode:"continuity", scope:"movies", pending:null, path:""},
      location: {hash:"#" + tok},
      history: {},
      importCode: function(){ return null; },
      revealHero: function(){},
      isPath: function(){ return false; }
    };
    vm.runInNewContext(src + "\nrouteHash();", box);
    Object.keys(want).forEach(function(k){
      if(box.S[k] !== want[k]){
        fail("#" + tok + " no longer routes — expected S." + k + " = \"" + want[k] +
             "\", got \"" + box.S[k] + "\". Every link of that shape ever shared is dead.");
      }
    });
  });
  /* Combined tokens are the documented form (#universes-series), so the split
     has to survive too. */
  var box2 = {
    S: {tab:"home", mode:"continuity", scope:"movies", pending:null, path:""},
    location: {hash:"#universes-series"}, history: {},
    importCode: function(){ return null; }, revealHero: function(){},
    isPath: function(){ return false; }
  };
  vm.runInNewContext(src + "\nrouteHash();", box2);
  if(box2.S.mode !== "continuity" || box2.S.scope !== "all"){
    fail("a combined route token stopped splitting — #universes-series set mode \"" +
         box2.S.mode + "\", scope \"" + box2.S.scope + "\"");
  }
  /* Order inside a combined token. revealHero() opens the group holding the
     next unwatched entry, and which group that is depends on the scope — so a
     path token processed before the scope token in the same link reads a scope
     the link has already asked to change, and clears the collapsed flag on the
     wrong group. The tokens were applied in whatever order the link listed
     them, so #life-series and #series-life did different things. Scope now
     runs in its own pass first; this observes it rather than reading the
     source, because the source can be reordered a dozen ways. */
  var sawScope = null;
  var box3 = {
    S: {tab:"home", mode:"continuity", scope:"movies", pending:null, path:""},
    location: {hash:"#life-series"}, history: {},
    importCode: function(){ return null; },
    isPath: function(){ return false; }
  };
  box3.revealHero = function(){ sawScope = box3.S.scope; };
  vm.runInNewContext(src + "\nrouteHash();", box3);
  if(sawScope === null){
    fail("#life-series no longer reveals anything — the path token stopped routing");
  } else if(sawScope !== "all"){
    fail("#life-series applies its path token before its scope token — revealHero() " +
         "ran under scope \"" + sawScope + "\" when the link had already asked for " +
         "\"all\", so it can open the wrong group. Scope tokens go in the first pass");
  }
  note(VOCAB.length + " route tokens all still route, scope before path");
})();

/* ---------- 73. The worst-case restore link cannot get longer ---------- */
/* catalogue/restore-link-ceiling.md calls this the launch blocker, and until
   1.7.5 nothing measured it: the payload could grow release after release and
   no build would object. The real ceiling is about 2,000 characters, where
   chat clients and QR readers start truncating. The catalogue is already past
   it, and the fix ships with the URL migration — so this is a ratchet, not
   the target. The number may fall. It may not rise. */

(function(){
  /* Until 1.7.7 this was a ratchet, because the catalogue sat over the ceiling
     and the fix was a code-format change nobody wanted to rush. NW3 landed it
     near 1,255: a rating is one character against the watched list rather than
     the whole hash a second time. This is the real ceiling again, with room for
     the catalogue to nearly double before it bites. */
  var CEILING = 2000;
  var box = {S:{watched:{}, skipped:{}, rated:{}, path:"life"},
             location:{protocol:"https:", origin:"https://nightwatcher.life",
                       pathname:"/"},
             SITE:"https://nightwatcher.life/",
             FILMS:FILMS, PATHCODE:sandbox.PATHCODE, idHash:idHash};
  FILMS.forEach(function(f){ box.S.watched[f.id] = 1; box.S.rated[f.id] = 5; });
  var out = vm.runInNewContext(
    fn("clampRating") + "\n" + fn("exportCode") + "\n" + fn("restoreLink") + "\n" +
    "({code:exportCode(), link:restoreLink(exportCode())});", box);
  if(out.link.length > CEILING){
    fail("the worst-case restore link is " + out.link.length + " characters, past the " +
         CEILING + " where chat clients and QR readers start truncating; see " +
         "catalogue/restore-link-ceiling.md");
  }
  /* Every entry costs five characters in W and one in R. */
  note("worst-case backup code " + out.code.length + " chars, link " + out.link.length +
       " of " + CEILING + " \u2014 room for about " +
       Math.floor((CEILING - out.link.length) / 6) + " more entries");
})();

/* ---------- 74. The version history runs one way ---------- */
/* Section 67 checks that three dates agree. Agreeing is not the same as being
   right: 1.7.2 shipped with all three reading three days into the future, and
   nothing went red. Dates that only ever move forward is the property that can
   actually be checked from inside the tree. */

(function(){
  var log = fs.existsSync(path.join(ROOT, "CHANGELOG.md"))
            ? fs.readFileSync(path.join(ROOT, "CHANGELOG.md"), "utf8") : "";
  var rows = [];
  log.replace(/^##\s*\[([^\]]+)\][^\n]*?(\d{4}-\d{2}-\d{2})/gm, function(_, v, d){
    if(v !== "Unreleased") rows.push({v:v, d:d});
    return _;
  });
  if(rows.length < 2){ warn("fewer than two dated releases to compare"); return; }
  for(var i = 1; i < rows.length; i++){
    if(rows[i].d > rows[i - 1].d){
      fail("CHANGELOG.md dates " + rows[i].v + " (" + rows[i].d + ") after " +
           rows[i - 1].v + " (" + rows[i - 1].d + ") — the history runs backwards");
    }
  }
  var seen = {};
  rows.forEach(function(r){
    if(seen[r.v]) fail("CHANGELOG.md lists " + r.v + " twice");
    seen[r.v] = 1;
  });
  /* Section 67 proves the three dates agree. Nothing could prove any of them
     was real, and 1.7.2 shipped dated three days into the future. There is no
     clock inside the tree, so this reads the machine's — as a note, because a
     build run on a different day must not go red for it. */
  var today = new Date().toISOString().slice(0, 10);
  var ahead = Math.round((Date.parse(rows[0].d) - Date.parse(today)) / 86400000);
  note(rows.length + " dated releases, " + rows[rows.length - 1].d + " to " + rows[0].d +
       (ahead > 0 ? " \u2014 newest is " + ahead + " day(s) ahead of this machine\u2019s clock"
                  : ""));
})();

/* ---------- 75. A control is as big as a finger ---------- */
/* The stars were given a 36-44px treatment in 1.4.x and it was written down;
   nothing enforced it, so the filter chips and the All button shipped at 34
   and the ticks at 30 and 24 with no hit area, and stayed there through two
   audits. WCAG 2.5.5 asks for 44. A control reaches it either by being that
   tall or by carrying an inset ::before that pads it out — both are counted
   here, because the tick is 30px on purpose and the target around it is not. */

(function(){
  var css = (HTML.match(/<style>([\s\S]*?)<\/style>/g) || []).join("\n")
              .replace(/\/\*[\s\S]*?\*\//g, "");
  var rules = css.match(/[^{}]+\{[^}]*\}/g) || [];
  var CONTROLS = ["chip", "allbtn", "tick", "trow", "bkbtn", "ucard", "srow", "sfhead"];
  var height = {}, pad = {};
  rules.forEach(function(rule){
    var sel  = rule.slice(0, rule.indexOf("{")).trim();
    var body = rule.slice(rule.indexOf("{"));
    /* The class has to be the subject of the selector, not an ancestor in it:
       ".srow .sb{height:5px}" is a progress bar inside a 46px row, and reading
       it as the row's height made this section fail on its first run. */
    var subject = sel.split(",")[0].trim().split(/[\s>+~]+/).pop();
    CONTROLS.forEach(function(c){
      if(!new RegExp("\\." + c + "(\\b|::)").test(subject)) return;
      var mh = body.match(/(?:min-height|height):\s*([\d.]+)px/);
      if(mh && !/::/.test(sel)){
        var v = parseFloat(mh[1]);
        if(height[c] === undefined || v < height[c]) height[c] = v;
      }
      /* An inset ::before is a hit area, not decoration, when every edge is
         negative. */
      if(/::before/.test(sel) && /position:absolute/.test(body)){
        var ins = body.match(/top:(-?[\d.]+)px;left:(-?[\d.]+)px;right:(-?[\d.]+)px;bottom:(-?[\d.]+)px/);
        if(ins && parseFloat(ins[1]) < 0){
          pad[c] = Math.max(pad[c] || 0, -parseFloat(ins[1]) * 2);
        }
      }
    });
  });
  var missing = CONTROLS.filter(function(c){ return height[c] === undefined; });
  if(missing.length){
    warn("no declared height for the control(s) " + missing.join(", ") +
         " — their target cannot be measured from the CSS");
  }
  Object.keys(height).forEach(function(c){
    var eff = height[c] + (pad[c] || 0);
    if(eff < 44){
      fail("." + c + " gives a " + eff + "px touch target (" + height[c] + "px drawn" +
           (pad[c] ? " plus a " + pad[c] + "px hit area" : ", no hit area") +
           ") — 44 is the floor, reached by height or by an inset ::before");
    }
  });
  note("touch targets measured: " + Object.keys(height).sort().map(function(c){
    return "." + c + " " + (height[c] + (pad[c] || 0));
  }).join(", "));
})();

/* ---------- 76. Home and The Path group the same way ---------- */
/* Home drew the universes whatever path was chosen, and nothing said it
   shouldn't, so a reader on Bruce's life got a dashboard about a different
   ordering — and tapping a card on it moved them into By universe and raised
   the borrowed-view banner they never asked for. The rule is that both screens
   read one grouping function; this checks the source rather than the render,
   because the render is smoke's job. */

(function(){
  var home = HTML.slice(HTML.indexOf("function viewHome("), HTML.indexOf("function viewNext("));
  if(home.indexOf("buildGroups()") < 0){
    fail("Home no longer builds its grid from buildGroups() — it has an opinion " +
         "about grouping that The Path does not share");
  }
  if(/PATH\.forEach/.test(home)){
    fail("Home iterates PATH directly, which is the universes whatever path the " +
         "reader chose");
  }
  if(/data-gk="c'\s*\+/.test(home)){
    fail("Home hard-codes continuity keys in its jump targets");
  }
  /* Every key shape Home can now emit has to route somewhere. */
  var go = fn("goToGroup");
  ["e", "d"].forEach(function(k){
    if(go.indexOf('"' + k + '"') < 0){
      fail("goToGroup() has no branch for a \"" + k + "\" key — Home can emit one now, " +
           "and it would land in the wrong ordering");
    }
  });
  if(!/GRIDNAME/.test(home)) fail("Home's grid heading no longer names what it holds");
  var gn = (HTML.match(/var GRIDNAME = \{[^}]*\}/) || [""])[0];
  sandbox.PATHS.forEach(function(p){
    if(gn.indexOf(p[0] + ":") < 0) fail("GRIDNAME has no heading for the " + p[0] + " path");
  });
  if(!/pathBlurb\(S\.mode\)/.test(home)){
    fail("Home's grid carries no description, or not the one The Path uses — " +
         "section 24 exists so there is one string per ordering, not two");
  }

  /* A card carried a name and a number and said nothing about what it was.
     The note is the description; cardBlurb() is the one-line form of it, so
     there is still one string per group rather than two to keep in step. */
  if(!/cardBlurb\(g\.note\)/.test(home)){
    fail("Home's cards carry no description, or not one derived from the group " +
         "note — a second string would be a second thing to keep true");
  }
  if(!/-webkit-line-clamp/.test(HTML)){
    fail("nothing clamps the card description, so one long note sets the height " +
         "of every card in its row");
  }
  (function(){
    var css = (HTML.match(/\.udesc\{[^}]*\}/) || [""])[0];
    if(/flex:\s*1/.test(css)){
      fail(".udesc flexes, which lets a -webkit-box grow past its own clamp — " +
           "the clamp then silently stops clamping");
    }
    var blurb = new vm.Script(fn("cardBlurb") + "\ncardBlurb;").runInNewContext({});
    PATH.concat(ERAS.map(function(e){ return {name:e.name, note:e.note}; }))
        .forEach(function(x){
      var t = blurb(x.note);
      if(!t) return fail("no card description for " + x.name);
      if(t.length > 90) fail("the card description for " + x.name + " is " + t.length +
                             " characters — cards stop being cards");
      /* Matching the whole phrase missed it: the cap truncates the suffix to
         "\u2014 no order\u2026", which is the leak still, in fewer characters. */
      if(/no order/.test(t)){
        fail("the card description for " + x.name + " carries the bag suffix, which " +
             "is about ordering rather than about what the shelf is");
      }
    });
    note("card descriptions: longest is " +
         Math.max.apply(null, PATH.map(function(x){ return blurb(x.note).length; })) +
         " characters");
  })();
})();

/* ---------- 77. The move offer stays retired ---------- */
/* Until 2.5.1 this section proved the opposite: that the old GitHub Pages
   address offered to carry a reader's progress across to the apex, because
   progress lives in localStorage and only JavaScript running on that origin
   could ever read it.

   Stage 0 of 2.5.1 measured the traffic instead of assuming it — 100 visits
   on the apex, none on the beta address — and the offer was retired. The
   section is not deleted, because sections run 1..n with no gaps and the
   history is worth keeping. It inverts, which is the established pattern for
   retired things: it now fails if the machinery ever comes back.

   offCanonical() deliberately survives. It is no longer what decides whether
   an offer renders; it is the only thing that marks the still-serving mirror
   noindex, which section 78 checks. */

(function(){
  [["function moveBanner", "moveBanner()"],
   ["moveHid",             "the moveHid dismissal flag"],
   ["class=\"moved\"",     "the .moved banner markup"],
   ["movelater",           "the movelater action"],
   ["movego",              "the .movego link class"]
  ].forEach(function(t){
    if(HTML.indexOf(t[0]) >= 0){
      fail("the move offer is back \u2014 " + t[1] + " returned to the app after " +
           "2.5.1 retired it. The beta address is a dumb mirror now");
    }
  });

  if(/\.moved\b/.test(HTML)){
    fail("the .moved CSS is back \u2014 the dead-CSS sweep should have caught it");
  }

  /* The app must not link to the retired address in any form. */
  if(/6ummy-dev\.github\.io/.test(HTML)){
    fail("the retired beta address is referenced in the app again");
  }

  /* What DID survive, and why, so a future reader does not delete it as dead. */
  if(!/function offCanonical\s*\(/.test(HTML)){
    fail("offCanonical() is gone \u2014 nothing marks the still-serving mirror " +
         "noindex, and it would compete with the canonical address in search");
  }
  note("the move offer stays retired; offCanonical() survives for the noindex only");
})();

/* ---------- 78. A crawler sees a catalogue, not an empty page ---------- */
/* Everything this app renders is written by JavaScript into <main id="view">,
   so a crawler that does not run it saw the shell and nothing else. The block
   lived in <noscript> until 1.8.6, and both SEO analyzers skipped that element
   entirely — one reported "no H2 headings" against a page with seven, the other
   counted nine words in 1,957 characters — because noscript is a fallback
   element most parsers treat as inactive. It is the initial content of #view
   now: the app's first render replaces it wholesale, a reader without
   JavaScript simply gets the page, and nothing is hidden from anyone.

   The block is generated from the data rather than typed. A hand-written list
   of a hundred and twenty-nine names would be stale within a release and nobody
   would notice, because nobody reads it — which is exactly the failure this
   file exists to prevent. Rebuilt here on every run and compared; npm run bless
   writes it. The curated titles make the same cut the app's tier filter makes,
   through the extracted tierOf(), never a copy of it. */

(function(){
  var films = 0, seasons = 0;
  PATH.forEach(function(g){ g.films.forEach(function(f){ f.k === "tv" ? seasons++ : films++; }); });
  function e(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  var picked = FILMS.filter(function(f){ return tierOf(f) !== "o"; });
  /* Two entries may legitimately share a title and a year — the 1966 series and
     the 1966 film do. Two identical lines read as a mistake, so a collision
     carries its sub-title and nothing else does. */
  var twice = {};
  picked.forEach(function(f){ var k = f.t + "|" + f.y; twice[k] = (twice[k] || 0) + 1; });
  var titles = picked.map(function(f){
    var dis = twice[f.t + "|" + f.y] > 1 && f.sub ? " — " + e(f.sub) : "";
    return "  <li>" + e(f.t) + dis + " (" + f.y + ")</li>";
  });
  var want = [
    '<main id="view">',
    /* An H1 since 1.9.5: the seed is the whole page to a crawler that runs no
       JavaScript, and a page whose first heading is an H2 reads as a fragment.
       The app's own H1 is the wordmark in the header, which the crawler also
       sees; two H1s on the pre-render page is the honest structure — one names
       the site, one names the content. */
    "<h1>Every Batman story ever filmed</h1>",
    "<p>Night Watcher lists " + films + " films and " + seasons +
      " seasons of television across " + PATH.length + " continuities, in Batman " +
      'watch orders that spoil nothing: <a href="#universes">by universe</a>, ' +
      '<a href="#life">by the arc of one life</a>, or <a href="#release">by release</a>. ' +
      '<a href="#next">Next up</a> names the next unwatched entry, and ' +
      '<a href="#progress">Progress</a> keeps the tally. The app needs JavaScript; ' +
      "what follows is what it covers.</p>",
    "<h2>The eras of Bruce’s life</h2>",
    /* 2.7.2: the notes joined the names. The fifth audit asked for "a compact
       list of the eras with one-sentence definitions" and the seed carried the
       names alone — eleven bare labels that say nothing to a reader arriving
       without JavaScript, or to a text crawler that only ever sees this
       surface. The notes were already written, already one source in ERAS, and
       already rendered in the app. This is existing data reaching the surface
       engines read, not new copy: nothing here is written twice, and guard 81
       already holds what an era note is allowed to say — a period, not a
       story — so the seeded text is spoiler-safe by construction.

       Era 0 stays out, here as in the app. It is not a stage of a life; it
       collects the entries that have no place in one. */
    "<ol>",
    ERAS.filter(function(x){ return x.k !== 0; })
        .map(function(x){ return "  <li><strong>" + e(x.name) + "</strong> \u2014 " +
                                 e(x.note) + "</li>"; }).join("\n"),
    "</ol>",
    /* seed-200 (2.5.0, owner's word with the ceiling raise): the continuities
       section carries every entry, not just the universe names — the full
       catalogue is the thin-content answer the audits asked for. Each
       continuity keeps its own spoiler-safe order (the array IS the order),
       every entry states its year and format, a season says it is a series,
       the curated 74 keep their distinction, and an unreleased entry says
       NOT OUT YET here exactly as it does in the app — announced titles are
       included, honestly marked, never claimed early. */
    "<h2>The continuities</h2>",
    "<p>Every entry, in each continuity’s own spoiler-safe order. The " +
      "essentials and the core route are marked; everything else is optional " +
      "side material.</p>",
    PATH.map(function(g, gi){
      var rows = FILMS.filter(function(f){ return f.gi === gi; }).map(function(f){
        var bits = [f.fmt === "live" ? "live action" : "animated"];
        if(f.tv) bits.push("series");
        var tier = tierOf(f);
        if(tier === "e") bits.push("essential");
        else if(tier === "k") bits.push("core");
        if(f.b.indexOf("u") >= 0) bits.push("not out yet");
        return "  <li>" + e(f.t) + (f.sub ? " — " + e(f.sub) : "") +
               " (" + f.y + ") · " + bits.join(" · ") + "</li>";
      });
      return "<h3>" + e(g.name) + "</h3>\n<ol>\n" + rows.join("\n") + "\n</ol>";
    }).join("\n"),
    "<h2>The essentials and the core route</h2>",
    "<ol>",
    titles.join("\n"),
    "</ol>",
    /* The audits' answer surface (2.1.0): the FAQ renders where a crawler
       that runs no JavaScript actually reads, from the same source the
       FAQPage schema mirrors. H2 sections, H3 questions \u2014 the depth Yoast
       flagged (H1 \u2192 H3) closes here too. */
    "<h2>Straight answers</h2>",
    FAQDATA.map(function(q){
      return "<h3>" + e(q[0]) + "</h3>\n<p>" + e(q[1]) + "</p>";
    }).join("\n"),
    "</main>"
  ].join("\n");

  if(HTML.indexOf("<noscript") >= 0){
    fail("the crawlable catalogue went back into <noscript> — both analyzers " +
         "treated that element as inactive, which is why 1.8.6 moved it inside " +
         '<main id="view"> where the first render replaces it');
  }
  var got = (HTML.match(/<main id="view">[\s\S]*?<\/main>/) || [""])[0];
  if(!got){
    fail('there is no <main id="view"> block — the app has nowhere to render ' +
         "and a crawler sees nothing at all");
    return;
  }
  if(got !== want){
    if(BLESS){
      fs.writeFileSync(path.join(PUBLIC, "index.html"),
                       HTML.replace(got, want), "utf8");
      note("rewrote the crawlable catalogue inside #view");
    } else if(got === '<main id="view"></main>'){
      fail('the crawlable catalogue is gone — <main id="view"> is empty, so a ' +
           "crawler that does not run JavaScript sees an empty page. " +
           "Fix with: npm run bless");
    } else {
      fail("the crawlable catalogue no longer matches the data — it lists names " +
           "that have changed. Fix with: npm run bless");
    }
  }
  /* Inverted in 1.8.6: the block used to sit above <main> and had to; it must
     now be INSIDE #view, where the first render replaces it. A copy anywhere
     else stays on the page underneath the app for every reader. */
  var mainAt = HTML.indexOf('<main id="view">');
  var mark = "<h1>Every Batman story ever filmed</h1>";
  var first = HTML.indexOf(mark);
  if(first >= 0 && (first < mainAt || first > mainAt + got.length ||
                    HTML.indexOf(mark, first + 1) >= 0)){
    fail('the crawlable catalogue sits outside <main id="view"> — the first ' +
         "render only replaces what is inside #view, so a copy anywhere else " +
         "stays on the page under the app");
  }
  note("crawlable catalogue: " + ERAS.filter(function(x){ return x.k !== 0; }).length +
       " eras, " + PATH.length + " continuities carrying all " + FILMS.length +
       " entries, " + picked.length + " curated titles, " + got.length + " bytes");

  /* The old origin has to keep serving and cannot send a header, so the only
     way it can ask to be left out of an index is to say so in the page. The
     canonical link is the primary signal; this is the one that does not depend
     on a crawler choosing to honour a preference. */
  var ni = (HTML.match(/if\(offCanonical\(\)\)\{[\s\S]{0,400}?\n\}/) || [""])[0];
  if(!ni || ni.indexOf("robots") < 0){
    fail("nothing marks an off-canonical origin as noindex \u2014 GitHub Pages keeps " +
         "serving the whole app and would compete with the canonical address");
    return;
  }
  if(!/["']noindex/.test(ni)){
    fail("the off-canonical origin asks to be indexed \u2014 the robots meta it injects " +
         "does not say noindex");
  }
  if(!/follow/.test(ni)){
    warn("the off-canonical robots meta does not say follow, so the links out of " +
         "that page \u2014 including the one to the canonical address \u2014 stop counting");
  }
  if(HTML.indexOf('name="robots"') >= 0 && HTML.indexOf('content="noindex') >= 0){
    fail("a static robots noindex is in the markup \u2014 that would apply to the " +
         "canonical origin too, and take the whole site out of search");
  }
})();

/* ---------- 79. No marker a user could type ---------------------------- */
/* viewWatch() ended its head with a %%COUNT%% marker and replaced it once the
   groups had been counted. Typing that literal into the search box put the
   replacement inside the input's own value attribute — the input echoes what
   you typed, it renders above the group list, and String.replace() with a
   string argument takes the first occurrence. The count paragraph closed the
   attribute early and hung its own attributes on the search box.

   No escaping fixes it: the marker has to survive esc() to be findable, and has
   to not survive it to be safe. The fix is to need no marker. The full account
   is in NOTES.md.

   Two checks. Markers of that shape may not exist at all, and the view builders
   — the functions that assemble markup around esc(S.q) — may not call replace()
   with a string literal. A literal-marker replace against a static constant is
   fine and one exists (MODENOTE's {span}); the haystack there cannot contain
   user input. Assembled markup can. */

(function(){
  var markers = HTML.match(/%%[A-Za-z0-9_]+%%/g) || [];
  var inCode = markers.filter(function(m){
    /* NOTES.md is prose about this bug and index.html is not, but the header
       block and the section above both name the old marker. Only count the ones
       outside comments. */
    var at = HTML.indexOf(m);
    var openC = HTML.lastIndexOf("/*", at), closeC = HTML.lastIndexOf("*/", at);
    return !(openC > closeC);
  });
  if(inCode.length){
    fail("index.html carries the marker(s) " + inCode.join(", ") + " — a sentinel " +
         "that a user can type into the search box is not a sentinel; build the " +
         "string in order instead. See NOTES.md");
  }

  var BUILDERS = ["viewWatch", "viewHome", "viewNext", "viewStats"];
  BUILDERS.forEach(function(name){
    var src;
    try { src = fn(name); } catch(e){ return warn("guard 79: no " + name + "() to check"); }
    var bad = src.match(/\.replace\(\s*["'][^"']*["']\s*,/g) || [];
    if(bad.length){
      fail(name + "() calls " + bad[0].trim() + " on markup it assembled — that " +
           "markup carries esc(S.q), so the first occurrence of any literal is " +
           "whatever the user typed. Concatenate in order instead");
    }
  });
  note("marker sweep: " + BUILDERS.length + " view builders, no literal replace on assembled markup");
})();

/* ---------- 80. The ring is drawn with its own circumference ----------- */
/* 119.4 is 2πr for r=19, and it lives twice: once in the static markup as the
   dasharray and dashoffset of #ringArc, once in the script that sets the offset
   as progress moves. Change the radius and the ring keeps drawing to the old
   circumference — it fills to 97% or overshoots, and nothing says so, because
   both numbers are still internally consistent with each other and only wrong
   about the circle. The donut hoists its own constant and needs no guard; this
   one cannot, because half of it is static HTML. */

(function(){
  var arc = (HTML.match(/<circle id="ringArc"[\s\S]*?\/?>/) || [""])[0];
  if(!arc) return fail("there is no #ringArc in the markup — the progress ring is gone");
  var r = parseFloat((arc.match(/\br="([\d.]+)"/) || [])[1]);
  var da = parseFloat((arc.match(/stroke-dasharray="([\d.]+)"/) || [])[1]);
  var doff = parseFloat((arc.match(/stroke-dashoffset="([\d.]+)"/) || [])[1]);
  if(!(r > 0)) return fail("#ringArc has no radius to check its circumference against");
  var C = 2 * Math.PI * r;
  var TOL = 0.05;   /* the markup is written to one decimal place */

  [["stroke-dasharray", da], ["stroke-dashoffset", doff]].forEach(function(p){
    if(!(p[1] > 0)) return fail("#ringArc has no " + p[0] + " — it will render as a full ring");
    if(Math.abs(p[1] - C) > TOL){
      fail("#ringArc " + p[0] + " is " + p[1] + ", which does not match 2πr for r=" +
           r + " (" + C.toFixed(2) + ") — the ring will not close");
    }
  });

  var setter = (HTML.match(/setAttribute\("stroke-dashoffset",\s*\(([\d.]+)\s*\*/) || [])[1];
  if(!setter){
    fail("nothing in the script sets #ringArc's stroke-dashoffset from progress — " +
         "the ring is static");
  } else if(Math.abs(parseFloat(setter) - C) > TOL){
    fail("the script draws the ring with " + setter + " but the markup and the radius " +
         "say " + C.toFixed(2) + " — one of the two was changed alone");
  }
  note("progress ring: r=" + r + ", circumference " + C.toFixed(2) + " in markup and script");

  /* The ring's visible label IS the percentage, so its accessible name has to
     contain that number. It did not: the name was a fixed "Open progress", so a
     screen reader announced the verb and never the value, and a voice-control
     user could not say the thing they could see. Lighthouse calls this
     label-content-name-mismatch and scores it below the threshold, which is why
     four releases of 100/100 Accessibility went by without it surfacing.
     Held here rather than in its own section because the number, the ring and
     the label are one object: change the radius, the percentage or the name
     alone and this section is the one that notices. */
  var ringBtn = (HTML.match(/<button class="ring" id="ringBtn"[^>]*>/) || [""])[0];
  var ringLab = (ringBtn.match(/aria-label="([^"]*)"/) || [])[1] || "";
  var ringSeed = (HTML.match(/<b id="ringPct">([^<]*)<\/b>/) || [])[1] || "";
  if(!ringBtn){
    fail("#ringBtn is gone — the ring is no longer a control");
  } else if(!ringSeed){
    fail("#ringPct renders no starting percentage — there is nothing for the " +
         "accessible name to agree with");
  } else if(ringLab.indexOf(ringSeed) < 0){
    fail('the ring button\'s accessible name ("' + ringLab + '") does not contain its ' +
         'visible text ("' + ringSeed + '") — a screen reader would announce the ' +
         "action and never the number");
  }
  var rh = fn("renderHead");
  if(!/setAttribute\("aria-label"/.test(rh)){
    fail("renderHead() does not update the ring's accessible name — it would freeze " +
         "at the first render's percentage while the visible number moved");
  }
  if((rh.match(/Math\.round\(frac\s*\*\s*100\)/g) || []).length > 1){
    fail("renderHead() computes the ring percentage more than once — the visible " +
         "text and the accessible name must come from one value or they drift");
  }

  /* THE TRACK AND THE ARC ARE ONE RING. Everything above reads #ringArc, so a
     #ringTrack left behind at the old radius or the old stroke would be silent:
     the arc would draw the progress at one size and the groove it runs in at
     another, and every assertion here would still pass. 2.8.0 moved both from
     r=20/4px to r=17.5/3px and this is what makes moving one alone impossible. */
  var track = (HTML.match(/<circle id="ringTrack"[\s\S]*?\/?>/) || [""])[0];
  if(!track){
    fail("there is no #ringTrack — the ring has lost the groove its arc runs in");
  } else {
    var tr2 = parseFloat((track.match(/\br="([\d.]+)"/) || [])[1]);
    var tsw = parseFloat((track.match(/stroke-width="([\d.]+)"/) || [])[1]);
    if(!(tr2 > 0) || !(tsw > 0)){
      fail("#ringTrack has no radius or no stroke width to compare with the arc");
    } else {
      if(tr2 !== r){
        fail("#ringTrack draws at r=" + tr2 + " and #ringArc at r=" + r +
             " — they are one ring and one of the two was changed alone");
      }
      if(tsw !== parseFloat((arc.match(/stroke-width="([\d.]+)"/) || [])[1])){
        fail("#ringTrack and #ringArc carry different stroke widths — the " +
             "progress would draw thicker or thinner than the groove it fills");
      }
    }
  }

  /* THE RING MAY NOT SHRINK PAST ITS OWN READOUT. 2.8.0 brought the ring down
     under the bat on the owner's rule (section 47), and the floor on that move
     is the label: the longest string this ring ever shows is "100%". What has
     to clear is not the inner diameter but the CHORD at the text's own height —
     the circle narrows where the glyphs actually sit. IBM Plex Mono advances
     0.6em per character, so the width comes from the CSS font-size rather than
     a number anybody remembered; at 11px that is 26.41px, and the measured
     value in a browser is 26.41. */
  var pctCss = (HTML.match(/\.ring b\{[^}]*font-size:(\d+(?:\.\d+)?)px/) || [])[1];
  var sw2    = parseFloat((arc.match(/stroke-width="([\d.]+)"/) || [])[1]);
  if(!pctCss){
    fail("cannot read the ring label's font-size — the ring's floor is the " +
         "width of \"100%\" and there is nothing to compute it from");
  } else {
    var fsz   = parseFloat(pctCss);
    var label = 4 * fsz * 0.6;              /* "100%", Plex Mono's 0.6em advance */
    var lineH = fsz * 1.27;                 /* the label's own box, measured 14px at 11px */
    var innerR = r - sw2 / 2;
    var chord = (innerR > lineH / 2)
      ? 2 * Math.sqrt(innerR * innerR - (lineH / 2) * (lineH / 2)) : 0;
    if(chord < label){
      fail("the ring's inner circle gives " + chord.toFixed(2) + "px across at the " +
           "label's own height and \"100%\" needs " + label.toFixed(2) + "px at " +
           fsz + "px — a finished run would print its number through the ring. " +
           "r=" + r + " with a " + sw2 + "px stroke is below the floor");
    }
    note("ring label: \"100%\" needs " + label.toFixed(2) + "px, the inner circle " +
         "gives " + chord.toFixed(2) + "px at that height");
  }
})();

/* ---------- 81. An era note describes a period, not a story ------------ */
/* Entry descriptions say who is in it, never what happens to them. Whether era
   notes are held to the same rule went unanswered across two QA rounds, so it
   is answered in NOTES.md: an era note may state the premise of the period, but
   may never name an event from inside a specific entry.

   The half of that which can be checked is the naming. An entry title or a
   quoted episode name inside an era note means it has stopped describing a span
   of a life and started describing a story. Single-word titles are not counted
   — "Batman" is a title and also the subject of every note here. */

(function(){
  var titles = {};
  PATH.forEach(function(g){
    g.films.forEach(function(f){
      if(String(f.t).split(/\s+/).length >= 2) titles[f.t] = 1;
    });
  });
  var names = Object.keys(titles);

  ERAS.forEach(function(e){
    var n = String(e.note || "");
    if(!n) return fail("era " + e.k + " (" + e.name + ") has no note — every era is " +
                       "named on Home before anything under it has been opened");
    var quoted = n.match(/[‘'"“][A-Z][^’'"”]{2,}[’'"”]/);
    if(quoted){
      fail("era " + e.k + "'s note quotes " + quoted[0] + " — a quoted title is an " +
           "episode, and an era note describes a period, not a story. See NOTES.md");
    }
    names.forEach(function(t){
      if(n.indexOf(t) >= 0){
        fail("era " + e.k + "'s note names the entry \"" + t + "\" — an era note " +
             "states the premise of the period, not what happens in one of its " +
             "stories. See NOTES.md");
      }
    });
  });
  note("era notes: " + ERAS.length + " checked against " + names.length +
       " multi-word entry titles, none named");
})();

/* ---------- 82. GitHub Pages never gets a custom domain --------------- */
/* The reasoning has been written down since 1.8.0 and nothing enforced it, which
   made it the highest-stakes decision in the project defended only by memory.

   Configuring a custom domain on GitHub Pages writes a CNAME file into the
   published directory and turns the old address into a 301 to the new one, and
   it cannot be switched off — delete the CNAME and the custom domain stops
   working. A redirect runs no JavaScript. Progress lives in localStorage, which
   is per-origin, so JavaScript on that origin is the only thing that can ever
   read it. The moment Pages starts redirecting, every reader who has not
   already moved is permanently separated from data still sitting on their own
   disk. Both origins serve, forever; that is what this file's absence means. */

(function(){
  [PUBLIC, ROOT].forEach(function(dir){
    var f = path.join(dir, "CNAME");
    if(fs.existsSync(f)){
      fail("a CNAME file exists at " + path.relative(ROOT, f) + " — that is a " +
           "GitHub Pages custom domain, which turns the old origin into a 301 " +
           "that cannot be disabled. A redirect runs no JavaScript, and only " +
           "JavaScript on that origin can read the progress stored there. Every " +
           "reader who has not already moved would be cut off from their own " +
           "data permanently. See NOTES.md");
    }
  });
  note("no CNAME: both origins still serve, which is the only arrangement that works");
})();

/* ---------- 83. The manifest id is an identity, not a path ------------ */
/* A browser keys an installed app on manifest.id. Change it and every install
   already on a home screen is orphaned: the old app keeps running the old cached
   build forever and the new one installs beside it. It looks like a path and it
   is not one, which is exactly why it gets "tidied" during a domain move — this
   one was changed from /Night-Watcher/ to / during 1.8.0 and reverted before
   shipping, caught by chance rather than by anything here.

   IT WAS CHANGED ON PURPOSE IN 2.7.0, ONCE, AND THE REASONING MATTERS BECAUSE
   THE RULE ABOVE IS STILL RIGHT. The old value was the GitHub Pages *project
   page* identity, and on the apex it resolves to
   https://nightwatcher.life/Night-Watcher/ — a path that does not exist. The
   2.5.1 retirement round missed it because guard 77's inverted check greps for
   the retired host, not the path.

   The standing decision was to leave it, on the grounds that orphaning installs
   costs more than a cosmetic wrong. That decision was taken while treating the
   install base as fixed. It was not: the measured base was near zero — 100 apex
   visits total, with the analytics beacon only live since 2 Aug 2026 — and
   Batman Day was five weeks out. The cost of this change is proportional to the
   install base, so it fell to roughly nothing on 4 Aug and rises with every
   install afterwards. Leaving it would have meant every install made from
   19 Sep onward keyed to an identity pointing at a path that does not exist,
   permanently.

   So: paid once, deliberately, at the last moment it was cheap. The rule does
   not relax — this guard now pins the new value with the same force, and there
   is no second exception coming. */

(function(){
  var WANT = "/";
  var mf = JSON.parse(fs.readFileSync(path.join(PUBLIC, "manifest.json"), "utf8"));
  if(!("id" in mf)){
    fail("manifest.json has no id — without it the browser derives one from " +
         "start_url, so the app's identity moves whenever the URL does");
  } else if(mf.id !== WANT){
    fail("manifest id is \"" + mf.id + "\", not \"" + WANT + "\" — it is an " +
         "identity key, not a path. Changing it makes every browser treat this " +
         "as a different app: existing installs are orphaned on the build they " +
         "last cached. It was set deliberately in 2.7.0 and does not move " +
         "again \u2014 the one-time cost was paid while the install base was " +
         "near zero, and it will not be near zero twice. See NOTES.md");
  }
  note("manifest id " + mf.id + ", fixed in 2.7.0 and pinned since");
})();

/* ---------- 84. The one slug whose year is deliberately wrong --------- */
/* harley-quinn-season-5-2024 carries y:2025. The slug froze an announced date
   that moved; the year is the one that shipped. Every other slug in the file
   ends in the year its entry carries, so this reads as a typo and invites a fix
   — and fixing it renames a frozen id, which voids whatever was ticked against
   it and breaks that entry in every backup code already written.

   The guard is the count, not the name alone: exactly one mismatch, and it is
   this one. A second appearing means a real typo shipped. */

(function(){
  var EXPECT = "harley-quinn-season-5-2024";
  var off = [];
  FILMS.forEach(function(f){
    var m = String(f.id).match(/-(\d{4})(?:-(\d{4}))?$/);
    if(!m) return;
    var slugYear = parseInt(m[2] || m[1], 10);
    if(slugYear !== f.y) off.push(f.id + " (slug " + slugYear + ", y:" + f.y + ")");
  });
  if(off.length === 1 && off[0].indexOf(EXPECT) === 0){
    note("slug/year: the one recorded mismatch, " + EXPECT + ", still stands");
    return;
  }
  if(!off.length){
    fail("no slug/year mismatch found, but " + EXPECT + " is supposed to carry " +
         "one — either the slug was renamed, which voids saved progress, or " +
         "the year was changed to match it, which makes the catalogue wrong. " +
         "See NOTES.md");
    return;
  }
  off.forEach(function(o){
    if(o.indexOf(EXPECT) !== 0){
      fail("slug and year disagree on " + o + " — only " + EXPECT + " is " +
           "allowed to, and that is recorded. Fix the year, never the slug");
    }
  });
  if(!off.some(function(o){ return o.indexOf(EXPECT) === 0; })){
    fail(EXPECT + " no longer carries its recorded slug/year mismatch");
  }
})();

/* ---------- 85. Static Shock and Titans keep one row each ------------- */
/* Both would be more accurate split by season, and splitting either spends i:
   slugs, which is the one thing this project does not spend. They carry the era
   their story starts in. A known limit, chosen, and the question comes back
   every review — so the answer is a build failure now. */

(function(){
  var SINGLE = ["static-shock-seasons-1-4-2000", "titans-complete-series-2018"];
  var SPLIT  = /^(static-shock|titans)-season-\d/;
  SINGLE.forEach(function(id){
    if(!seen[id]){
      fail(id + " is gone — it is entered as one row on purpose, and replacing " +
           "it with seasons spends frozen slugs to buy accuracy nobody asked for");
    }
  });
  FILMS.forEach(function(f){
    if(SPLIT.test(f.id)){
      fail(f.id + " splits a series that is entered as one row by decision — " +
           "Static Shock crosses into Batman's world three times across four " +
           "seasons and Titans runs through three eras; both carry the era their " +
           "story starts in. See NOTES.md");
    }
  });
  note("single-row series intact: " + SINGLE.length + " of " + SINGLE.length);
})();

/* ---------- 86. The era scheme is eleven stages, plus outside --------- */
/* Era 7 holds 48 entries against the next largest at 29 and the question comes
   back every review. The answer is no: positions order it correctly, the eras
   are life stages rather than buckets sized for a screen, and a twelfth era buys
   scrolling comfort at the cost of the scheme meaning something. Splitting it
   also moves every e: below it, which is a catalogue-wide edit for a cosmetic
   gain. Recorded so it stops being reopened; guarded so reopening it is a
   deliberate act. */

(function(){
  var WANT = 11;
  var numbered = ERAS.filter(function(e){ return e.k !== 0; });
  var zero = ERAS.filter(function(e){ return e.k === 0; });
  if(numbered.length !== WANT){
    fail("there are " + numbered.length + " numbered eras, not " + WANT +
         " — the era scheme is eleven stages of one life plus \"outside any " +
         "timeline\". Adding or splitting one is a decision, not a tidy-up; era " +
         "7 in particular is not being split. See NOTES.md");
  }
  if(zero.length !== 1) fail("era 0 (outside any timeline) is missing or doubled");
  if(numbered.length === WANT){
    var ks = numbered.map(function(e){ return e.k; }).join(",");
    if(ks !== "1,2,3,4,5,6,7,8,9,10,11"){
      fail("the numbered eras run " + ks + " — they are 1 through 11, in order");
    }
  }
  note("era scheme: " + numbered.length + " life stages plus era 0, unsplit");
})();

/* ---------- 87. A backup carries progress, not settings --------------- */
/* exportJSON() is what a reader hands to another device. It restores what they
   watched onto whatever they are holding; it does not reach over and change that
   device's format, scope or theme. The local payload carries those because it
   belongs to that browser — the export does not, and the two are one keystroke
   apart in the source. */

(function(){
  var src;
  try { src = fn("exportJSON"); }
  catch(e){ return fail("there is no exportJSON() — the JSON backup is gone"); }
  ["format", "scope", "theme", "scopePref"].forEach(function(k){
    if(new RegExp("\\b" + k + "\\b").test(src)){
      fail("exportJSON() carries \"" + k + "\" — a backup restores progress onto " +
           "the device that receives it and may not change that device's " +
           "settings. See NOTES.md");
    }
  });
  ["watched", "skipped", "rated", "path", "log"].forEach(function(k){
    if(src.indexOf(k) < 0) fail("exportJSON() no longer carries " + k);
  });
  note("JSON backup: progress and path only, no device settings");
})();

/* ---------- 88. The universe chip describes the universe -------------- */
/* eraTag() reads the group's whole film list rather than the filtered one, so a
   universe can be chipped with an era belonging to an entry hidden under the
   current scope. That is deliberate: the chip describes the universe, not the
   selection, and a chip that moved when you switched to Movies would be
   describing the switch. The Batman (2004) is the visible case — chip 2 with
   series shown, and it would read 3 if the tag came off the filtered list.

   Structural here; smoke drives the scope switch and reads the rendered chip. */

(function(){
  var src;
  try { src = fn("buildGroups"); }
  catch(e){ return fail("there is no buildGroups()"); }
  var calls = src.match(/eraTag\(([^)]*)\)/g) || [];
  if(!calls.length){
    fail("buildGroups() no longer tags a group with its era — the universe " +
         "chips lose their number");
    return;
  }
  calls.forEach(function(c){
    var arg = c.slice(7, -1).trim();
    if(!/^[A-Za-z_$][\w$]*$/.test(arg)){
      fail("buildGroups() calls " + c + " — eraTag() takes the unfiltered group, " +
           "so its argument is a plain group. Passing a filtered list makes the " +
           "chip describe the current scope instead of the universe. See NOTES.md");
    }
  });
  note("universe chip: eraTag() reads " + calls.length + " unfiltered group(s)");
})();

/* ---------- 89. The amnesty window is closed -------------------------- */
/* Guard 2 enforces the one recorded rename and nothing stopped a second being
   added beside it. renamed-ids.json is not a mechanism for renaming slugs; it is
   the record of a single exception taken before the app was publicly launched,
   when the population with saved progress was the owner and a handful of
   soakers. That is the whole reason it was allowed, and that condition can never
   be true again. */

(function(){
  if(!fs.existsSync(RENAMEDFILE)){
    fail("qa/renamed-ids.json is gone — it is the record of the frozen-ID rule's " +
         "one exception, and deleting the record does not undo the rename");
    return;
  }
  var keys = Object.keys(RENAMED);
  if(keys.length > 1){
    fail("renamed-ids.json holds " + keys.length + " renames — there is exactly " +
         "one, taken before public launch, and the window it depended on is " +
         "closed. A slug rename now voids saved progress for real readers and " +
         "breaks that entry in every backup code already written. Add the new " +
         "entry to retired-ids.json and mint a fresh slug instead. See NOTES.md");
  } else if(keys.length === 0){
    fail("renamed-ids.json is empty — the Galactic Guardians rename happened and " +
         "guard 2 needs the record to tell it apart from a slug going missing");
  } else {
    note("frozen-ID exceptions: 1, recorded, window closed");
  }
})();

/* ---------- 90. The seed links carry only known tokens ---------- */
/* 1.8.6 put real anchors in the crawlable seed — the one part of the page a
   non-rendering crawler reads. Guard 72 froze the route vocabulary in 1.7.6
   after a deleted #life branch survived the entire harness, so the two are tied
   here: a token renamed in the app cannot quietly leave dead links in the one
   place nobody would ever notice them. */

(function(){
  var seed = (HTML.match(/<main id="view">[\s\S]*?<\/main>/) || [""])[0];
  if(!seed) return; /* section 78 has already failed the build for this */
  var known = ROUTE_VOCAB.map(function(p){ return p[0]; });
  var hrefs = seed.match(/href="[^"]*"/g) || [];
  if(!hrefs.length){
    fail("the seed block carries no links at all — 1.8.6 put the three orderings " +
         "and the two other tabs one tap away for a reader without JavaScript, " +
         "and they are gone");
  }
  hrefs.forEach(function(a){
    var h = a.slice(6, -1);
    if(h.charAt(0) !== "#"){
      fail("the seed links out to " + h + " — everything in the seed is this page, " +
           "and the one crawlable block must not hand its readers to another origin");
      return;
    }
    h.slice(1).toLowerCase().split(/[-+]/).forEach(function(tok){
      if(known.indexOf(tok) < 0){
        fail('the seed links to "' + h + '" but "' + tok + '" is not in guard ' +
             "72's frozen vocabulary — routeHash() would do nothing with it, and " +
             "a dead link in the seed is dead precisely where nobody watches");
      }
    });
  });
  note("seed links: " + hrefs.length + ", every token known to guard 72");
})();

/* ---------- 91. The card the metas promise is the card that ships ---------- */
/* 1.9.0 gave the page a real share card — docs/share.png, generated from the
   tree by qa/make-share-card.mjs so it cannot drift from the catalogue. Three
   references promise it (og:image, twitter:image, the JSON-LD image), a card
   type unlocks it (summary_large_image), and one decision keeps it out of the
   offline shell: it is a crawler asset, and the app never fetches it. Each of
   those is one careless edit from quietly breaking every embed, so they are
   checked here rather than remembered. */

(function(){
  var CARD = "https://nightwatcher.life/share.png";
  var p = path.join(PUBLIC, "share.png");
  if(!fs.existsSync(p)){
    fail("docs/share.png is missing — three metas promise it, and every " +
         "embed of the page would show a broken card. Regenerate with: " +
         "node qa/make-share-card.mjs");
    return;
  }
  var buf = fs.readFileSync(p);
  var isPng = buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 &&
              buf[2] === 0x4E && buf[3] === 0x47;
  if(!isPng){
    fail("docs/share.png is not a PNG — whatever it is, platforms will not " +
         "render it as the card");
  } else {
    var w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    if(w !== 1200 || h !== 630){
      fail("docs/share.png is " + w + "×" + h + " — the card is 1200×630, " +
           "the size every platform crops toward. Regenerate with: " +
           "node qa/make-share-card.mjs");
    }
  }
  var og = (HTML.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
  var tw = (HTML.match(/<meta name="twitter:image" content="([^"]+)"/) || [])[1];
  var ld = (HTML.match(/"image"\s*:\s*"([^"]+)"/) || [])[1];
  [["og:image", og], ["twitter:image", tw], ["the JSON-LD image", ld]].forEach(function(pair){
    if(pair[1] !== CARD){
      fail(pair[0] + " points at " + pair[1] + " — the three card references " +
           "must all agree on " + CARD + ", or embeds disagree by platform");
    }
  });
  var wd = (HTML.match(/<meta property="og:image:width" content="([^"]+)"/) || [])[1];
  var ht = (HTML.match(/<meta property="og:image:height" content="([^"]+)"/) || [])[1];
  if(wd !== "1200" || ht !== "630"){
    fail("og:image:width/height read " + wd + "×" + ht + " — they describe a " +
         "1200×630 card, and a wrong hint makes platforms re-fetch or crop");
  }
  var cardType = (HTML.match(/<meta name="twitter:card" content="([^"]+)"/) || [])[1];
  if(cardType !== "summary_large_image"){
    fail('twitter:card is "' + cardType + '" — without summary_large_image the ' +
         "card renders as a thumbnail and the 1200×630 asset bought nothing");
  }
  /* Out of the offline shell, enforced rather than remembered. */
  var sw = fs.readFileSync(path.join(PUBLIC, "sw.js"), "utf8");
  var shell = (sw.match(/var SHELL\s*=\s*\[[\s\S]*?\]/) || [""])[0];
  if(shell.indexOf("share.png") >= 0){
    fail("share.png is in sw.js's SHELL precache — it is a crawler asset the " +
         "app never fetches, and caching it spends every installer's storage " +
         "on an image no view renders");
  }
  /* 3.0.0: A BYTE CEILING, because there was none. This section read
     buf.length only to print it, so a valid 1200×630 PNG of 3,025,613 bytes
     passed — tested. The card ships at ~19.7 KB only because of the manual PIL
     quantize documented at the top of qa/make-share-card.mjs; the raw render is
     ~325 KB. That quantize is a step a person remembers to run, and the whole
     argument of this file is that a step somebody remembers is a step that gets
     skipped. 60 KB is three times what the card takes today and a fifth of an
     unquantized render, so it cannot be tripped by honest drawing and cannot be
     missed by a skipped quantize. Scrapers time out on slow cards; a megabyte
     of PNG is a blank embed, which is the same outcome as no card at all. */
  if(buf.length > 60000){
    fail("docs/share.png is " + buf.length.toLocaleString("en-US") + " bytes, over " +
         "the 60,000-byte ceiling. The card is quantized by hand at the top of " +
         "qa/make-share-card.mjs and the raw render is ~325 KB, so this is what " +
         "a skipped quantize looks like. Scrapers give up on slow images and the " +
         "embed comes back blank");
  }
  note("share card: 1200×630 PNG, " + buf.length.toLocaleString("en-US") +
       " bytes, three references agree, out of the shell");
})();

/* ---------- 92. A rating is certified or absent ---------- */
/* The sourcing pass over all 200 entries lives in the project's
   catalogue/ratings-findings.md — every value there carries its source, and
   the catalogue rule applies unchanged: sourced or absent, never guessed.
   Two systems live on one shelf on purpose (11 film-shelf entries are TV
   specials and TV-rated DTVs); the badge renders what the source system says
   and never translates. An unreleased entry has no certificate by definition
   — Knightfall Part 1's announced R rides the 25 Aug trigger patch, the
   same edit that drops its NOT OUT YET badge. */

(function(){
  var MPA = ["G", "PG", "PG-13", "R", "NR"];
  var TVG = ["TV-Y", "TV-Y7", "TV-Y7-FV", "TV-G", "TV-PG", "TV-14", "TV-MA"];
  /* The distribution the findings doc landed on, rechecks resolved: 90 MPA
     ratings + 26 honest no-rating-exists NR + 78 TV-system = 194, and the six
     unreleased entries carry none. A drifted count here means an entry gained,
     lost or changed a rating nobody sourced. */
  var EXPECT = {"PG-13":53, "PG":19, "R":17, "G":1, "NR":26,
                "TV-PG":18, "TV-G":15, "TV-Y7":14, "TV-MA":13, "TV-14":10,
                "TV-Y7-FV":6, "TV-Y":2};
  var got = {}, rated = 0;
  FILMS.forEach(function(f){
    if(f.b.indexOf("u") >= 0){
      if(f.r) fail(f.id + ' is not out yet and carries r:"' + f.r + '" \u2014 an ' +
                   "unreleased entry has no certificate; its rating rides its release");
      return;
    }
    if(!f.r){
      fail(f.id + " is released and carries no r: \u2014 the sourcing pass covered " +
           "all 200 entries, so an absent value on a released entry is a hole, not a TBD");
      return;
    }
    if(MPA.indexOf(f.r) < 0 && TVG.indexOf(f.r) < 0){
      fail(f.id + ' carries r:"' + f.r + '" \u2014 not a value in either system, and ' +
           "the badge renders only what a certificate can actually say");
      return;
    }
    got[f.r] = (got[f.r] || 0) + 1; rated++;
  });
  Object.keys(EXPECT).forEach(function(k){
    if((got[k] || 0) !== EXPECT[k]){
      fail((got[k] || 0) + " entries rated " + k + ", the findings doc says " + EXPECT[k] +
           " \u2014 a rating changed without a source, or the findings doc was not updated");
    }
  });
  Object.keys(got).forEach(function(k){
    if(!(k in EXPECT)) fail(got[k] + ' entr' + (got[k] === 1 ? "y" : "ies") +
                            ' rated "' + k + '" \u2014 a value the findings doc never recorded');
  });
  /* The badge is text in the app's own type. The MPA certification marks and
     the TV Parental Guidelines logos are certification marks and are never
     reproduced \u2014 that decision is recorded in the findings doc and holds. */
  if(!/function ratingBadge\s*\(/.test(HTML)){
    fail("ratingBadge() is gone \u2014 the rating data renders nowhere");
  }
  /* 2.2.0's soak note was "then not showing rating badges", and the fix sat the
     rating beside the Where-to-watch link \u2014 which this guard then pinned as
     the literal string ratingBadge(f)+watchLinks(f), twice. 2.7.1's soak note
     was that the rating reads as part of the link rather than as what it is,
     a badge. It belongs on the badge line with the others.

     So the rule is now the invariant rather than the arrangement: every surface
     a reader decides from carries the rating, immediately after that surface's
     badges, and no surface carries it next to the link. Pinning the old
     adjacency meant the guard failed on the fix instead of on a regression,
     which is a guard defending a layout nobody chose twice. */
  var SEATS = [["the entry row", /<\/span>'\+badges\(f\)\+ratingBadge\(f\)/],
               ["the Next-up hero", /hbadges">'\+badges\(f\)\+ratingBadge\(f\)/],
               ["the Then peek", /qpeek">'\+badges\(x\)\+ratingBadge\(x\)/]];
  SEATS.forEach(function(seat){
    if(!seat[1].test(HTML)){
      fail(seat[0] + " does not carry the rating on its badge line \u2014 the " +
           "rating is a badge, and a reader deciding what to press play on " +
           "looks at the badges");
    }
  });
  if(/ratingBadge\([fx]\)\+watchLinks/.test(HTML)){
    fail("a rating badge sits next to the Where-to-watch link again \u2014 that " +
         "was the 2.7.1 soak note. It reads as part of the link instead of as " +
         "a rating");
  }
  if((HTML.match(/ratingBadge\([fx]\)/g) || []).length !== 4){
    fail("ratingBadge() is called " + (HTML.match(/ratingBadge\([fx]\)/g) || []).length +
         " times \u2014 three seats plus its own definition. Fewer is a surface " +
         "that stopped saying what a thing is rated; more is a seat nobody named");
  }
  if(!/\.bd\.rt\{[^}]*currentColor/.test(HTML)){
    fail("the .bd.rt badge has no style of its own \u2014 it would render as bare text " +
         "in a row of boxes");
  }
  if(!/MPA for films, TV Parental Guidelines for television/.test(HTML)){
    fail("the legend no longer explains the two systems \u2014 TV-14 next to PG-13 " +
         "reads as a typo to anyone who has not met both");
  }
  if((HTML.match(/class="bd rt"/g) || []).length < 3){
    fail("the legend no longer shows the rating badge \u2014 one swatch per system, " +
         "or the box appears on rows unexplained");
  }
  note("ratings: " + rated + " entries carry one \u2014 " +
       Object.keys(EXPECT).map(function(k){ return EXPECT[k] + " " + k; }).join(", ") +
       "; 6 unreleased carry none");
})();

/* ---------- 93. The Progress lists fold, and remember ---------- */
/* 44 universe rows and 12 era rows stood between the donuts and the backup
   tools \u2014 the longest scroll in the app to reach the controls that keep a
   user's progress alive. Both lists now fold behind their headings, closed by
   default, in the groupOpen pattern with the default inverted: groupOpen
   persists only false because absent means open, progOpen persists only true
   because absent means closed. Persisting anything else would flip a
   default the next time a build adds a fold. */

(function(){
  if(!/function progFold\s*\(/.test(HTML)){
    fail("progFold() is gone \u2014 the two Progress lists render as an endless " +
         "scroll again"); return;
  }
  ["uni", "era"].forEach(function(pk){
    if(HTML.indexOf('progFold("' + pk + '"') < 0){
      fail('the "' + pk + '" list no longer folds \u2014 half the fix is no fix');
    }
  });
  if(!/S\.progOpen\[pk\] === true/.test(HTML)){
    fail("progFold() opens on anything but an explicit true \u2014 the lists must " +
         "stay closed for a visitor who never touched them");
  }
  if(!/progOpen:S\.progOpen/.test(HTML)){
    fail("progOpen is not written to the saved payload \u2014 fold state dies on reload");
  }
  if(!/if\(o\.progOpen && typeof o\.progOpen === "object"\)/.test(HTML)){
    fail("restore() does not read progOpen back \u2014 the state would be written " +
         "and never used");
  } else {
    var psave = HTML.slice(HTML.indexOf("if(o.progOpen"),
                           HTML.indexOf("if(o.progOpen") + 300);
    if(!/=== true/.test(psave)){
      fail("restore() accepts non-true progOpen values \u2014 only true is " +
           "meaningful; anything else inverts the closed default");
    }
  }
  if(!/act === "progfold"/.test(HTML)){
    fail("the fold heading has no handler \u2014 a button that does nothing");
  } else {
    var phAt = HTML.indexOf('act === "progfold"');
    var ph = HTML.slice(phAt, HTML.indexOf("}", phAt));
    if(!/persist\(\)/.test(ph)){
      fail("the fold handler does not persist what it just set \u2014 the state is " +
           "half-remembered, which guard 36 exists to prevent for groupOpen");
    }
  }
  if(!/\.sfold\.open \.caret\{transform:rotate\(90deg\)/.test(HTML)){
    fail("the fold caret does not turn \u2014 open and closed look identical, and " +
         "the affordance is the caret");
  }
  if(!/aria-expanded="'\+open\+'"/.test(HTML)){
    fail("the fold heading states no aria-expanded \u2014 a screen reader cannot " +
         "tell a closed list from a missing one");
  }
})();

/* ---------- 94. The path is Bruce, for a fresh visitor ---------- */
/* The owner's words, recorded in the 1.9.5 plan. The chooser's lead card has
   been Bruce's life since 1.7.2; what remained was the reader who has not
   chosen yet \u2014 The Path opened on By universe for them, a different answer
   than the card the chooser recommends. The pre-choice default and the lead
   card must agree, or the recommendation is two recommendations. */

(function(){
  if(!sandbox.PATHS || sandbox.PATHS[0][0] !== "life"){
    fail("the chooser's first card is not Bruce's life \u2014 1.7.2 made it the " +
         "lead on purpose: By universe opens on Alfred in 1960s London, which " +
         "is right for the reader who chose it and strange for one who has not");
  }
  var sdecl = (HTML.match(/\nvar S = \{[\s\S]*?\};/) || [""])[0];
  if(!sdecl){ fail("the S state declaration cannot be found"); return; }
  if(!/mode:"life"/.test(sdecl)){
    fail('the pre-choice default mode is not "life" \u2014 a fresh visitor on The ' +
         "Path sees a different ordering than the one the chooser leads with");
  }
})();

/* ---------- 95. The curated list is machine-readable ---------- */
/* The seed hands the 74 curated titles to crawlers that read HTML; this is
   the same list for the ones that read schema.org. One cut \u2014 the extracted
   tierOf(), the same call guard 78 makes \u2014 feeds both, so the two can only
   drift together, which is to say not at all. Generated, compared, and
   blessed exactly like the seed. */

(function(){
  var ldm = HTML.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if(!ldm) return; /* section 38 has already failed the build */
  var o; try{ o = JSON.parse(ldm[1]); }catch(e){ return; }
  var graph = o["@graph"];
  if(!graph){ fail("the JSON-LD lost its @graph \u2014 the ItemList has nowhere to live"); return; }
  var picked = FILMS.filter(function(f){ return tierOf(f) !== "o"; });
  var twice = {};
  picked.forEach(function(f){ var k = f.t + "|" + f.y; twice[k] = (twice[k] || 0) + 1; });
  var want = {
    "@type": "ItemList",
    "name": "The essentials and the core route",
    "description": "The " + picked.length + " curated Batman titles \u2014 every " +
                   "essential and the whole core route \u2014 in spoiler-safe order.",
    "numberOfItems": picked.length,
    "itemListOrder": "https://schema.org/ItemListOrderAscending",
    "itemListElement": picked.map(function(f, i){
      var dis = twice[f.t + "|" + f.y] > 1 && f.sub ? " \u2014 " + f.sub : "";
      return {"@type": "ListItem", "position": i + 1, "name": f.t + dis + " (" + f.y + ")"};
    })
  };
  var got = graph.filter(function(n){ return n["@type"] === "ItemList"; })[0];
  if(got && JSON.stringify(got) === JSON.stringify(want)){
    note("JSON-LD ItemList: " + want.numberOfItems + " curated titles, in step with the seed");
    return;
  }
  if(BLESS){
    o["@graph"] = graph.filter(function(n){ return n["@type"] !== "ItemList"; });
    o["@graph"].push(want);
    fs.writeFileSync(path.join(PUBLIC, "index.html"),
                     HTML.replace(ldm[1], JSON.stringify(o)), "utf8");
    note("rewrote the JSON-LD ItemList");
  } else if(!got){
    fail("the JSON-LD has no ItemList \u2014 the curated titles are in the seed for " +
         "crawlers that read HTML, and the ones that read schema deserve the same " +
         "list. Fix with: npm run bless");
  } else {
    fail("the JSON-LD ItemList no longer matches the curated titles \u2014 the two " +
         "lists are one list or they are two claims. Fix with: npm run bless");
  }
})();

/* ---------- 96. The Belt is one strip, and its pouches open from behind ---------- */
/* 2.0.0's headline. The three stacked control rows became one joined strip \u2014
   paths plus a buckle \u2014 with the include rows rendered only while the belt is
   open, sliding out from behind it. Design locked in the project's
   releases/design-belt.md; this section is the locked picture, enforced. */

(function(){
  var strip = (HTML.match(/\.pathseg\{[^}]*\}/) || [""])[0];
  if(!strip){ fail("the belt strip has no rule of its own"); return; }
  if(!/overflow:hidden/.test(strip) || !/border-radius/.test(strip)){
    fail("the belt is not one strip \u2014 without its own border and overflow:hidden " +
         "the segments read as separate cards again, which the owner rejected at " +
         "the mock round");
  }
  var seg = (HTML.match(/\.pathseg button\{[^}]*\}/) || [""])[0];
  if(/border-radius:(?!0)/.test(seg)){
    fail("the belt's segments carry their own corners \u2014 rounded segments inside " +
         "a rounded strip is the gapped look coming back one property at a time");
  }
  if(!/class="buckle"/.test(HTML) || !/data-act="belt"/.test(HTML)){
    fail("the belt has no buckle \u2014 nothing opens the pouches");
  }
  if(!/act === "belt"/.test(HTML)){
    fail("the buckle has no handler \u2014 a button that does nothing");
  }
  var mc = optionalFn("masterChooser", "there is no belt at all");
  if(!/S\.beltOpen \? includeBlock\(\) : ""/.test(mc)){
    fail("the pouches are not gated on the belt being open \u2014 either they always " +
         "render (three rows again) or they never do");
  }
  /* The buckle says what the closed pouches hold, from the real state. */
  if(!/class="bst"/.test(mc) || !/S\.format/.test(mc) || !/S\.scope/.test(mc)){
    fail("the buckle does not summarise the hidden state from S.format and " +
         "S.scope \u2014 a closed pouch that keeps secrets is mystery meat");
  }
  /* Always starts closed: the open state must never persist. */
  if(/beltOpen/.test(fn("persistNow"))){
    fail("beltOpen is written to the saved payload \u2014 the belt is a control " +
         "tray, not content; it always starts closed");
  }
  if(!/beltOpen:false/.test(HTML)){
    fail("the S declaration does not start the belt closed");
  }
  /* The pouches come from behind: inset shadow, stagger, and a reduced-motion
     opt-out. The shadow is what sells "from behind". */
  var pouch = (HTML.match(/\.includes \.scope\{[^}]*\}/) || [""])[0];
  if(!/inset 0/.test(pouch)){
    fail("the pouches cast no inset shadow \u2014 nothing says they come from " +
         "behind the belt");
  }
  if(!/@keyframes pouch/.test(HTML) ||
     !/\.includes\.opening \.scope:last-of-type\{[^}]*animation-delay/.test(HTML)){
    fail("the pouches do not stagger \u2014 format first, then the types, is the " +
         "owner's 'then' made visible");
  }
  /* 2.7.0 widened this from a literal selector pair to a membership test. The
     belt now collapses its own box on close as well as animating the pouches,
     and reduced motion has to cut BOTH \u2014 an honest instant close, not a
     shorter theatrical one. Pinning the exact selector string meant the guard
     failed on the fix rather than on a regression, which is a guard testing its
     own punctuation. */
  var rmBlock = (HTML.match(/@media \(prefers-reduced-motion: reduce\)\{([^}]*\{[^}]*\})*[^}]*\}/g) || [])
    .filter(function(b2){ return /\.includes/.test(b2); })[0] || "";
  [[".includes.opening .scope", /\.includes\.opening \.scope/],
   [".includes.closing .scope",  /\.includes\.closing \.scope/],
   [".includes.closing",         /\.includes\.closing[,{]/]]
    .forEach(function(pair){
      var sel = pair[0];
      if(!pair[1].test(rmBlock)){
        fail("the reduced-motion block does not cut " + sel +
             " \u2014 reduced motion closes the belt instantly, box and all, or it " +
             "is not reduced motion");
      }
    });
  if(!/animation:none/.test(rmBlock)){
    fail("the reduced-motion block names the belt but does not set animation:none");
  }
  /* 2.2.1 soak fix: the entry animation plays once, on the closed\u2192open
     transition \u2014 not on every render that happens to find the belt open.
     Three sightings of the same defect (a format pick, a type pick, a tab
     change) were the pouches replaying because the base rule carried the
     animation. The base rule now carries none; only the opening render does,
     and the handler's flag lives for exactly that one render. */
  if(!/\.includes\.opening \.scope\{animation:pouch/.test(HTML)){
    fail("the pouch entry animation lost its .opening scope \u2014 either it " +
         "animates on every render again (the 2.2.1 soak note, three times " +
         "over) or it never animates at all");
  }
  var basePouch = (HTML.match(/\.includes \.scope\{[^}]*\}/) || [""])[0];
  if(/animation:/.test(basePouch)){
    fail("the base .includes .scope rule carries an animation \u2014 every " +
         "re-render with the belt open replays it: the belt 'reloads' on a " +
         "format pick, a type pick, and a tab change, which is the soak note " +
         "verbatim");
  }
  if(!/S\.beltOpen = true; S\.beltOpening = true; render\(\); S\.beltOpening = false;/.test(HTML)){
    fail("the belt handler does not scope the opening flag to the one render " +
         "that opens \u2014 the flag leaking past render() is the replay coming back");
  }
  if(!/class="includes'\+\(S\.beltOpening \? " opening" : ""\)\+'"/.test(HTML)){
    fail("includeBlock() does not read the opening flag \u2014 the class would " +
         "never render and the pouches would never animate");
  }
  if(/beltOpening/.test(fn("persistNow"))){
    fail("beltOpening is written to the saved payload \u2014 it is one render long " +
         "by definition");
  }
  if(!/aria-expanded/.test(mc)){
    fail("the buckle states no aria-expanded \u2014 a screen reader cannot tell a " +
         "closed belt from a beltless page");
  }
  /* 2.1.0, owner-locked at the mock round: equal paths, ~22% buckle, two
     lines with hierarchy, chevron in the corner \u2014 full words, no codes. */
  if(!/\.pathseg button\{flex:0 0 26%/.test(HTML)){
    fail("the belt's paths are not the locked 26% \u2014 the owner picked " +
         "26/26/26/22 by mock, full words in every state");
  }
  if(!/class="bst"/.test(mc) || !/class="bs2"/.test(mc)){
    fail("the buckle lost its two-line hierarchy \u2014 format over types is the " +
         "locked variant");
  }
  if(!/\.pathseg \.buckle \.caret\{position:absolute/.test(HTML)){
    fail("the buckle's chevron left its corner \u2014 the locked variant tucks it " +
         "at the right edge");
  }
  /* The close mirrors the open \u2014 the 2.0.0 soak note. Types tucks first,
     then format; reduced motion closes instantly. */
  if(!/@keyframes pouchout/.test(HTML) ||
     !/\.includes\.closing \.scope\{animation:pouchout/.test(HTML)){
    fail("the pouches have no exit \u2014 they animate open and vanish shut, " +
         "which is the exact soak note");
  }
  var bhAt = HTML.indexOf('act === "belt"');
  var bh = HTML.slice(bhAt, bhAt + 700);
  if(!/includes closing/.test(bh) || !/setTimeout/.test(bh)){
    fail("the belt handler does not stage the close \u2014 the closing class plus " +
         "a delayed re-render is what lets the exit play");
  }
  if(!/prefers-reduced-motion/.test(bh)){
    fail("the close ignores prefers-reduced-motion \u2014 reduced motion closes " +
         "instantly, no timeout");
  }
  /* The box collapse is what actually removes the snap, so it is guarded beside
     the staged close rather than left to the CSS section alone. */
  if(!/@keyframes beltclose\{to\{max-height:0/.test(HTML) ||
     !/\.includes\.closing\{overflow:hidden;max-height:\d+px;animation:beltclose/.test(HTML)){
    fail("the belt no longer collapses its own box on close \u2014 the pouches " +
         "animate on transform and opacity, which do not affect layout, so " +
         "without this the page keeps the belt's full height until the " +
         "re-render and then jumps in one frame. That was soak finding 1");
  }

  /* 2.7.0. render() ended by clamping the restored scroll position against
     documentElement.scrollHeight. Reading scrollHeight immediately after
     writing #view.innerHTML forces a synchronous layout of the whole document
     \u2014 measured at ~216ms on a 200-entry list, on every single render, to
     compute a number the platform already applies: window.scrollTo clamps to
     the scrollable range on its own. The clamp was defensive code paying full
     price for nothing.

     Guarded because it is the kind of line that gets added back by anyone
     reasoning about scroll restoration from first principles, and it is
     invisible in the harness \u2014 jsdom has no layout, so nothing here would
     ever have caught it. */
  if(/scrollHeight/.test(HTML)){
    fail("index.html reads scrollHeight \u2014 reading layout straight after " +
         "writing innerHTML forces a synchronous reflow of the document. " +
         "window.scrollTo already clamps to the scrollable range; the read " +
         "buys nothing and cost ~216ms per render before 2.7.0");
  }
  /* 2.2.0 soak note: the buckle crops on narrow phones. Below 375px the two
     lines shrink and the padding tightens so "Live action / Movies+Series"
     — the longest state — fits without clipping. */
  if(!/@media \(max-width:375px\)\{\.pathseg \.bst\{font-size:[^}]*\}\.pathseg \.bs2\{font-size:[^}]*\}\.pathseg \.buckle\{padding:[^}]*\}\}/.test(HTML)){
    fail("the buckle has no narrow-viewport rule — on a 320–375px phone the " +
         "longest state clips at the buckle's edge, the 2.2.0 soak note verbatim");
  }
})();

/* ---------- 97. Theme lives on Home, compact, and nowhere else ---------- */
/* Owner's call at the 2.0.0 design round: the darker toggle moves exactly
   once \u2014 from the bottom of Progress to the bottom of Home \u2014 and it never
   enters the Belt. */

(function(){
  if(!/function themeRow\s*\(/.test(HTML)){
    fail("themeRow() is gone \u2014 nothing renders the theme control");
    return;
  }
  if(/themeRow\(\)|data-theme=/.test(optionalFn("viewStats"))){
    fail("the theme selector is back on Progress \u2014 it moved to Home exactly " +
         "once, and twice is a setting with two homes");
  }
  ["viewNext", "viewWatch"].forEach(function(v){
    if(/themeRow\(\)|data-theme=/.test(optionalFn(v))){
      fail(v + "() renders the theme control \u2014 it lives on Home only");
    }
  });
  if(!/themeRow\(\)/.test(optionalFn("viewHome"))){
    fail("Home does not render the theme control \u2014 the toggle would exist " +
         "nowhere at all");
  }
  if(/themeRow\(\)|data-theme=/.test(optionalFn("masterChooser"))){
    fail("the theme control is in the Belt \u2014 the one thing the owner said the " +
         "Belt must never hold");
  }
  /* Compact: narrower and shorter than the full-width rows it used to be. */
  var tr = (HTML.match(/\.themerow\{[^}]*\}/) || [""])[0];
  if(!/max-width/.test(tr)){
    fail("the theme row is full-width \u2014 'a bit more compact' was the whole " +
         "point of the move");
  }
})();

/* ---------- 98. The progress card is drawn here, from the real counts ---------- */
/* Design locked in releases/design-progress-card.md: story-format canvas,
   seated right under the scoreboard on Progress, local-only, one look
   regardless of theme. */

(function(){
  if(!/function drawShareCard\s*\(/.test(HTML) || !/function shareCardBlock\s*\(/.test(HTML)){
    fail("the progress card is gone \u2014 nothing to share");
    return;
  }
  /* One button, in the house voice. Share led and download rode second until
     2.7.3, when the owner cut it to one: "share progress should be only one
     button, share the night." No preview \u2014 the card renders on demand, at
     the moment of the tap (owner's call at the 2.0.0 respin).

     THE SECOND BUTTON WAS DOING MORE THAN IT LOOKED. navigator.share existing
     does not mean FILE sharing works, and the old handler answered that case
     with a toast saying so \u2014 survivable only because Download sat beside it.
     Cutting to one button without changing the handler would have left a
     reader on such a browser pressing the only control and being told no.
     So the button falls back to downloading rather than reporting failure, and
     that fallback is guarded: it is the whole reason one button is safe. */
  if(!/primary" data-act="cardshare">Share the night</.test(HTML)){
    fail('"Share the night" is not the primary action \u2014 the owner\'s words');
  }
  var sbBlock = (HTML.match(/<div class="bk sharecard">[\s\S]*?<\/div><\/div>/) || [""])[0] ||
                (HTML.match(/sharecard"><h3>[\s\S]{0,600}?bkbtns[\s\S]{0,400}?<\/div>/) || [""])[0];
  var btnCount = (sbBlock.match(/data-act="card/g) || []).length;
  if(btnCount !== 1){
    fail("the share block offers " + btnCount + " card buttons \u2014 2.7.3 cut it " +
         "to one on the owner's word. A second control is the old two-button " +
         "shape coming back");
  }
  var shareH = (HTML.match(/act === "cardshare"\)\{[\s\S]*?\n  \}/) || [""])[0];
  /* 3.0.2 GAVE THIS HANDLER A SECOND FALLBACK AND WEAKENED THE CHECK BY DOING
     SO. There are two ways to end up with no shared file: the browser never
     offered file sharing, and the share itself failed after being offered. Both
     have to fall back to the download, and until now one call site satisfied a
     test written when there was only one. Count them. */
  var falls = (shareH.match(/download\(f\.name, f\)/g) || []).length;
  if(falls < 2){
    fail("the share action has " + falls + " download fallback(s) and needs two \u2014 " +
         "navigator.share can exist while file sharing does not, AND a share that " +
         "was offered can still fail. With one button, either without a fallback " +
         "is a dead end with no way out. Fall back to downloading, do not report " +
         "failure and do not swallow it");
  }
  if(!/AbortError/.test(shareH)){
    fail("the share handler no longer distinguishes a cancelled share from a " +
         "failed one \u2014 a reader who dismissed the sheet gets a download they " +
         "did not ask for, or a real failure goes silent. Both were the same " +
         "empty catch until 3.0.2");
  }
  if(/toast\("Sharing files is not available here"\)/.test(HTML)){
    fail("the share action still reports that sharing is unavailable \u2014 with " +
         "one button there is nowhere for that reader to go. Download instead");
  }
  if(/id="pcard"/.test(HTML)){
    fail("the card preview is back \u2014 it was removed on the owner's word; the " +
         "canvas is created at the moment of the tap");
  }
  if(!/document\.createElement\("canvas"\)/.test(fn("cardFile"))){
    fail("cardFile() does not create its canvas on demand \u2014 with no preview " +
         "in the view there is nothing else to draw on");
  }
  var vs = optionalFn("viewStats");
  var sb = vs.indexOf("scoreboard(c)");
  var sc = vs.indexOf("shareCardBlock()");
  var uf = vs.indexOf('progFold("uni"');
  if(sc < 0){ fail("Progress does not render the share card"); }
  else if(sb >= 0 && sc < sb){
    fail("the share card renders above the scoreboard \u2014 the owner seated it " +
         "right under the numbers it draws");
  } else if(uf >= 0 && sc > uf){
    fail("the share card sank below the folds \u2014 its seat is right under the " +
         "scoreboard");
  }
  var dc = fn("drawShareCard");
  if(/S\.theme/.test(dc)){
    fail("drawShareCard() reads the theme \u2014 the card has one look; the darker " +
         "variant was considered and declined, on the record");
  }
  ["counts\\(\\)", "pool\\(\\)", "groupFilms\\("].forEach(function(fnName){
    if(!new RegExp(fnName).test(dc)){
      fail("the card does not draw from " + fnName.replace(/\\+/g, "") +
           " \u2014 its numbers must be the app's numbers, one source");
    }
  });
  /* The source is one tap away. Five audits recommended a visible link to the
     repository \u2014 the JSON-LD claims it under sameAs, so machines were told and
     readers were not.

     It moved in 2.7.4, on the owner's soak note, and the seat is the better
     one. It first landed inside Home's colophon by wrapping the words "free
     software under the AGPL", which read as a footnote to a disclosure. It now
     sits on Progress's build line, beside BUILD and BUILT \u2014 the app's own meta
     line, where a reader who wants the version is the same reader who wants the
     code. Home's colophon says "free software under the AGPL" in plain words
     again, which is a statement rather than a control.

     The link is deliberately NOT styled by colour alone: it inherits its line's
     colour and carries a thin underline, so the affordance survives for anyone
     who cannot separate it by hue. 2.7.3 shipped it with no styling at all and
     the browser default blue landed in a dim mono line \u2014 reported in the soak
     within the hour. */
  if(!/<a href="https:\/\/github\.com\/6ummy-Dev\/Night-Watcher"[^>]*>read the source<\/a>/.test(HTML)){
    fail("nothing links the source \u2014 the schema claims the repository under " +
         "sameAs and a reader has no way to click through");
  }
  if(!/updated '\+BUILT\+'[^<]*<a href="https:\/\/github\.com\/6ummy-Dev\/Night-Watcher"/.test(HTML)){
    fail("the source link is not on Progress's build line \u2014 that is its seat: " +
         "a reader who wants the version is the reader who wants the code");
  }
  if(!/\.homefoot a,\.note a\{[^}]*text-decoration:underline/.test(HTML)){
    fail("the source link is not underlined \u2014 it inherits its line's colour on " +
         "purpose, so the underline is the only thing marking it as a control. " +
         "2.7.3 shipped it unstyled and it came back as browser-default blue");
  }
  if(!/Drawn in your browser, nothing uploaded\./.test(HTML)){
    fail("the local-only line is gone \u2014 the card's privacy promise is stated " +
         "where the card is made");
  }
  if(!/night-watcher-" \+ c\.done \+ "-of-" \+ c\.total \+ "\.png/.test(HTML)){
    fail("the filename no longer carries the brag \u2014 night-watcher-N-of-M.png " +
         "is the card's name");
  }
  if(/data-act="cardsave"/.test(HTML) !== /act === "cardsave"/.test(HTML)){
    fail("cardsave exists on only one side \u2014 a button with no handler does " +
         "nothing, and a handler with no button is code no reader can reach. " +
         "2.7.3 removed both; they come back together or not at all");
  }
  /* 2.2.0 soak note: "make it a card, borders and title should be bigger
     same as all others". The block is a .bk card like every other block on
     Progress, and its title is an h3 like theirs — not a qhead whisper. */
  if(!/<div class="bk sharecard"><h3>Share your progress<\/h3>/.test(HTML)){
    fail("the share block is not a card — .bk with an h3 title is what every " +
         "other Progress block gets, and the owner asked for the same");
  }
  if(/class="qhead"[^>]*>Share your progress/.test(HTML)){
    fail("the share block's title is a qhead again — the 2.2.0 soak note " +
         "asked for a real title, same as all others");
  }
})();

/* ---------- 99. The soak notes hold ---------- */
/* Four cosmetic findings against 1.9.5, called in by the owner from the live
   site and packed into 2.0.0. Each held here so it cannot quietly regress. */

(function(){
  /* 1: the rating badge sat at the top of a stretched box. */
  if(!/\.linkrow\{[^}]*align-items:center/.test(HTML)){
    fail("the link row does not centre its items \u2014 the rating badge stretches " +
         "to the watch link's height and its text rides the top of the box");
  }
  /* 2: ANIMATED and LIVE ACTION were the same rule, so the same look. */
  var fa = (HTML.match(/\.bd\.fmanim\{[^}]*\}/) || [""])[0];
  var fl = (HTML.match(/\.bd\.fmlive\{[^}]*\}/) || [""])[0];
  if(!fa || !fl){
    fail("the format badges lost their own rules \u2014 they can only differ if " +
         "each has one");
  } else if(fa.replace(/fmanim/, "") === fl.replace(/fmlive/, "")){
    fail("ANIMATED and LIVE ACTION are styled identically again \u2014 the soak " +
         "note was that nobody can tell them apart without reading");
  }
  /* 3: the ratings legend line sat misaligned among the legend entries \u2014
     then (2.2.1 soak) its flex layout dropped the whole sentence below the
     badges as one indivisible block. The mechanism is inline flow now: the
     sentence wraps word-by-word beside the badges, and vertical-align keeps
     the swatches seated in the line. Both halves are the alignment. */
  if(!/class="rleg"/.test(HTML) || !/\.legend \.rleg\{[^}]*display:block/.test(HTML)){
    fail("the ratings legend line lost its inline flow \u2014 the sentence drops " +
         "below the badges as one block again, the 2.2.1 soak note");
  }
  if(!/\.legend \.rleg \.bd\{[^}]*vertical-align:middle/.test(HTML)){
    fail("the ratings legend badges lost their vertical alignment \u2014 the " +
         "swatches and the sentence drift apart again");
  }
  /* 4: three headings read too small; the fix is a variant, owner's call,
     applied at exactly the three named seats and nowhere else. */
  if(!/\.qhead\.big\{/.test(HTML)){
    fail("the .qhead.big variant is gone \u2014 the three named headings fall back " +
         "to 10px");
  }
  var seats = (HTML.match(/qhead big/g) || []).length;
  if(seats !== 3){
    fail(seats + ' seats carry "qhead big", the owner named exactly 3: the grid ' +
         "heading on Home, Then on Next up, and the Progress fold headings");
  }
  /* 3.0.2: THIS LOOP CHECKED NOTHING. It computed `at`, tested a condition, and
     the `if` body was a comment — no fail(), no note(), no effect. Check-shaped
     and inert, which is the class 3.0.0 was written about, sitting inside a
     section that otherwise works. The comment described a real relationship, so
     it asserts it now rather than coming out: each named seat has to sit beside
     the variant, or the count above is three seats that are not the three the
     owner named. */
  ["GRIDNAME[S.mode]", '<p class="qhead big">Then</p>'].forEach(function(mark){
    var at = HTML.indexOf(mark);
    if(at < 0){
      fail("the named seat " + mark + " is gone from the page — section 99 counts " +
           "three seats carrying \"qhead big\" and this is one of the three it " +
           "counts, so the count would still read 3 with the wrong seat in it");
      return;
    }
    if(HTML.lastIndexOf("qhead big", at + 60) < 0){
      fail("the named seat " + mark + " no longer sits beside \"qhead big\" — the " +
           "seat and the variant drifted apart, and the count above cannot tell " +
           "that from a correct page");
    }
  });
  if(!/class="qhead big" style="margin-top:6px"/.test(HTML)){
    fail("the Home grid heading lost the variant \u2014 one of the three named seats");
  }
  if(!/<p class="qhead big">Then<\/p>/.test(HTML)){
    fail('"Then" on Next up lost the variant \u2014 one of the three named seats');
  }
  if(!/class="qhead big" style="margin:0"/.test(HTML)){
    fail("the Progress fold headings lost the variant \u2014 one of the three named " +
         "seats");
  }
})();

/* ---------- 100. The straight answers are machine-readable ---------- */
/* The seed's FAQ (guard 78) and the FAQPage schema render from ONE source \u2014
   buildFAQ() \u2014 so a reworded answer moves both or fails the build. Blessed
   exactly like the ItemList. */

(function(){
  var ldm = HTML.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if(!ldm) return;
  var o; try{ o = JSON.parse(ldm[1]); }catch(e){ return; }
  var graph = o["@graph"];
  if(!graph){ fail("the JSON-LD lost its @graph \u2014 the FAQPage has nowhere to live"); return; }
  var want = {"@type": "FAQPage", "mainEntity": FAQDATA.map(function(q){
    return {"@type": "Question", "name": q[0],
            "acceptedAnswer": {"@type": "Answer", "text": q[1]}};
  })};
  var got = graph.filter(function(n){ return n["@type"] === "FAQPage"; })[0];
  if(got && JSON.stringify(got) === JSON.stringify(want)){
    note("FAQPage: " + want.mainEntity.length + " questions, in step with the seed");
    return;
  }
  if(BLESS){
    o["@graph"] = graph.filter(function(n){ return n["@type"] !== "FAQPage"; });
    o["@graph"].push(want);
    fs.writeFileSync(path.join(PUBLIC, "index.html"),
                     HTML.replace(ldm[1], JSON.stringify(o)), "utf8");
    note("rewrote the FAQPage in the JSON-LD");
  } else if(!got){
    fail("the JSON-LD has no FAQPage \u2014 the seed answers the questions and the " +
         "schema must answer them identically. Fix with: npm run bless");
  } else {
    fail("the FAQPage no longer matches the seed's straight answers \u2014 one " +
         "source or two claims. Fix with: npm run bless");
  }
})();

/* ---------- 101. The site answers off the app too ---------- */
/* 2.1.0's crawler assets: llms.txt for generative engines, a 404 that speaks
   the house's language, and the Workers config that actually serves it. All
   three are outside the app, which is exactly how they would rot unseen. */

(function(){
  var lp = path.join(PUBLIC, "llms.txt");
  if(!fs.existsSync(lp)){
    fail("docs/llms.txt is missing \u2014 the one generative-engine asset that " +
         "costs no page weight");
  } else {
    var lt = fs.readFileSync(lp, "utf8");
    [[/(\d+)\s+films/, actual.films, "films"],
     [/(\d+)\s+seasons/, actual.seasons, "seasons"],
     [/(\d+)\s+continuities/, actual.continuities, "continuities"]
    ].forEach(function(c){
      var m2 = lt.match(c[0]);
      if(!m2){ fail("llms.txt no longer states a " + c[2] + " count"); }
      else if(parseInt(m2[1], 10) !== c[1]){
        fail("llms.txt says " + m2[1] + " " + c[2] + ", data has " + c[1] +
             " \u2014 a count in prose drifts here exactly like it did in the README");
      }
    });
    if(lt.indexOf("https://nightwatcher.life/") < 0){
      fail("llms.txt does not name the canonical URL");
    }
  }
  var swTxt = fs.readFileSync(path.join(PUBLIC, "sw.js"), "utf8");
  var shell2 = (swTxt.match(/var SHELL\s*=\s*\[[\s\S]*?\]/) || [""])[0];
  ["llms.txt", "404.html"].forEach(function(f2){
    if(shell2.indexOf(f2) >= 0){
      fail(f2 + " is in the offline shell \u2014 crawler assets, the app never " +
           "fetches them");
    }
  });
  var fp = path.join(PUBLIC, "404.html");
  if(!fs.existsSync(fp)){
    fail("docs/404.html is missing \u2014 a wrong URL gets the host's default shrug");
  } else {
    var ft = fs.readFileSync(fp, "utf8");
    if(!/noindex/.test(ft)) fail("404.html does not ask to stay out of the index");
    /* THE ROOT LINK, DECIDED 5 Aug 2026 — the apex wins, and the mirror's
       404 link stays wrong on purpose.

       The parked item was right that `href="/"` is wrong on the GitHub Pages
       mirror, where it lands on 6ummy-dev.github.io rather than the app. It was
       also right that there is no fix serving both: an absolute canonical
       breaks self-containment below, and `./` breaks on any path deeper than
       one segment, because the 404 is served AT the requested URL rather than
       redirected to.

       So it is a trade, and the apex takes it. The mirror has measured ZERO
       visits against the apex's hundred, serves with noindex injected, is a
       waiting room by decision, and retires after the depth-2 call. Breaking a
       live rule that keeps the error page dependency-free — the page that shows
       when something is already broken — to fix a link on an origin nobody
       reaches is the wrong way round.

       Closed. Do not re-open without new traffic evidence on the mirror. */
    if(!/href="\/"/.test(ft)) fail("404.html does not link home");
    /* THE NAMESPACE TRAP, 3.1.0. This section fails on any https?:// in the
       file, and xmlns="http://www.w3.org/2000/svg" is that string \u2014 so the
       first inline-bat candidate went red with "404.html reaches off the
       page", which names the wrong cause and sends the next reader hunting
       for a fetch that is not there. The attribute is unnecessary in an HTML
       document; the header's own <svg> omits it. Named before the sweep below
       can mislabel it. */
    if(/xmlns=/.test(ft)){
      fail("404.html carries an xmlns attribute \u2014 an inline <svg> in an HTML " +
           "document does not need one, and the namespace URL is indistinguishable " +
           "from a real off-page reference to the check below. Drop the attribute");
    }
    if(/https?:\/\//.test(ft)){
      fail("404.html reaches off the page \u2014 it is self-contained or it is " +
           "another thing that can break");
    }
    /* INLINE OR NOTHING, and asserted by shape rather than by matching URLs.
       Cloudflare serves this file AT the address that missed rather than
       redirecting to it, so every relative reference on it resolves against
       whatever directory the reader happened to be in: url(./icon.svg) works
       at /nope and asks for /a/b/icon.svg at /a/b/nope. The same resolution
       rule that killed `./` for the root link above, and the same one that
       made a live audit report manifest.json as a 404 on 5 Aug. A URL check
       would pass anything phrased differently; no url() at all cannot. */
    if(/url\(/.test(ft)){
      fail("404.html fetches something with url() \u2014 this page is served at " +
           "whatever address missed, so a relative reference on it resolves " +
           "against a directory nobody chose. The mark is inline or it is nothing");
    }
    if(Buffer.byteLength(ft) > 4096){
      fail("404.html is " + Buffer.byteLength(ft) + " bytes \u2014 it is one " +
           "sentence and a door, not a page");
    }
  }
  var wtxt = fs.readFileSync(path.join(ROOT, "wrangler.jsonc"), "utf8");
  if(!/"not_found_handling":\s*"404-page"/.test(wtxt)){
    fail('wrangler not_found_handling is not "404-page" \u2014 the 404 exists to ' +
         "be served, with a 404 status");
  }
})();

/* ---------- 102. A tick burst writes once, and leaving flushes ---------- */
/* 2.5.0, optimization report \u00a73.7 \u2014 shipped on the owner's word after being
   deferred as its own release. persist() used to serialize the whole state
   and hit the store on every call: marking a season of television watched
   was a write per tick. It is a trailing debounce now (200 ms), and the
   contract has three legs that all have to hold together: calls coalesce,
   flushPersist() writes NOW, and the page flushes when it is being left \u2014
   pagehide plus visibilitychange-to-hidden \u2014 so there is no window where a
   closed tab loses ticks. Smoke proves the coalescing behaviorally; this
   section holds the shape so a refactor cannot quietly drop a leg. */

(function(){
  var pd = fn("persist");
  if(!/setTimeout/.test(pd) || /JSON\.stringify/.test(pd)){
    fail("persist() is not a trailing debounce \u2014 either it writes inline again " +
         "(a write per tick, the thing \u00a73.7 exists to end) or the payload moved " +
         "back into it");
  }
  if(!/clearTimeout\(persistTimer\)/.test(pd)){
    fail("persist() does not clear the pending timer \u2014 a burst would schedule " +
         "a write per call, which is the old cost on a delay");
  }
  var pn = fn("persistNow");
  if(!/JSON\.stringify/.test(pn) || !/store\.set/.test(pn)){
    fail("persistNow() does not carry the serialize-and-write \u2014 the debounce " +
         "has nothing to fire");
  }
  var fl = fn("flushPersist");
  if(!/persistNow\(\)/.test(fl) || !/clearTimeout/.test(fl)){
    fail("flushPersist() does not cancel the timer and write now \u2014 leaving the " +
         "page would race a 200 ms window");
  }
  if(!/if\(!persistTimer\) return;/.test(fl)){
    fail("flushPersist() writes even with nothing pending \u2014 every pagehide " +
         "would serialize the world for no reason");
  }
  if(!/window\.addEventListener\("pagehide", flushPersist\)/.test(HTML)){
    fail("nothing flushes on pagehide \u2014 closing the tab inside the debounce " +
         "window loses the last ticks, which is the one failure this contract " +
         "must never have");
  }
  if(!/visibilitychange/.test(HTML) || !/if\(document\.hidden\) flushPersist\(\);/.test(HTML)){
    fail("nothing flushes when the page hides \u2014 mobile browsers fire no " +
         "reliable pagehide on app-switch; visibilitychange is the flush that " +
         "actually runs there");
  }
})();

/* ---------- 103. The tick repaints one group, and cannot drift ---------- */
/* 2.5.0, optimization report \u00a73.8 \u2014 the one the report called genuinely
   risky, shipped behind arithmetic instead of nerve. The tick path
   (toggleWatched/toggleSkip) repaints the row's group through groupBlock()
   \u2014 the same builder viewWatch() composes from, so the two cannot disagree
   by construction \u2014 plus the header through renderHead(). Everything
   outside the targeted condition (another tab, a filter, a search) falls
   back to the full render. The real gate lives in smoke: after every driven
   tick, a forced full render must serialize byte-for-byte identical. This
   section holds the shape so the gate always has something to gate. */

(function(){
  var tw = fn("toggleWatched"), ts = fn("toggleSkip");
  if(!/tickUpdate\(id\)/.test(tw) || !/tickUpdate\(id\)/.test(ts)){
    fail("a toggle does not go through tickUpdate() \u2014 either the targeted " +
         "path is dead code or one toggle repaints the world again");
  }
  var tu = fn("tickUpdate");
  if(!/S\.tab !== "watch" \|\| S\.filter !== "all" \|\| S\.q/.test(tu)){
    fail("tickUpdate() lost its fallback condition \u2014 a filtered or searched " +
         "view patched in place WILL drift from the full render; the gate " +
         "exists because this line exists");
  }
  if(!/groupBlock\(g, S\.q\.toLowerCase\(\)\)/.test(tu) || !/renderHead\(counts\(\)\)/.test(tu)){
    fail("tickUpdate() does not rebuild through groupBlock() and renderHead() " +
         "\u2014 a second copy of either is a drift waiting for a release");
  }
  if(!/groupBlock\(g, q\)/.test(optionalFn("viewWatch",
       "the tick path would have nothing to compose from"))){
    fail("viewWatch() no longer composes from groupBlock() \u2014 the tick path " +
         "and the full render just became two implementations");
  }
  if(!/replaceChild/.test(tu)){
    fail("tickUpdate() does not replace the group element \u2014 whatever it does " +
         "instead is not the targeted repaint the gate verifies");
  }
})();

/* ---------- 104. The security headers the edge cannot set ------------- */
/* Cloudflare Response Header Transform Rules do not apply to responses a
   Worker generates, and every route here is Worker-served. A rule was created
   in the dashboard on 4 Aug 2026, showed "Active", and set nothing — verified
   against a cache HIT, a cache MISS and a 404. docs/_headers is the mechanism
   that does work, so it is the mechanism that gets a guard.

   HSTS and X-Content-Type-Options are deliberately NOT here: those are set at
   the edge (SSL/TLS panel and Managed Transforms), which does survive a Worker
   response, and setting them twice would mean two places to be wrong.

   CSP is deliberately not here either. It lives in the <meta> tag whose hash
   section 10 blesses against the one inline script; splitting one rule across
   two files is how the hash goes stale without anything noticing. */

(function(){
  var hp = path.join(PUBLIC, "_headers");
  if(!fs.existsSync(hp)){
    fail("docs/_headers is missing \u2014 the app would serve no Referrer-Policy, " +
         "no X-Frame-Options and no Permissions-Policy, and a Transform Rule " +
         "cannot put them back on a Worker response");
    return;
  }
  var H = fs.readFileSync(hp, "utf8");
  /* Directives only. The file explains itself in # comments, and a comment
     naming a header is not the file setting one. */
  var D = H.split("\n").filter(function(l){ return !/^\s*#/.test(l); }).join("\n");

  if(!/^\/\*\s*$/m.test(D)){
    fail("docs/_headers has no /* rule \u2014 whatever it declares applies to " +
         "nothing");
  }

  [["Referrer-Policy",   /^\s+Referrer-Policy:\s*strict-origin-when-cross-origin\s*$/m,
    "strict-origin-when-cross-origin"],
   ["X-Frame-Options",   /^\s+X-Frame-Options:\s*DENY\s*$/m, "DENY"],
   ["Permissions-Policy", /^\s+Permissions-Policy:\s*.*geolocation=\(\)/m,
    "a policy that at least denies geolocation"]
  ].forEach(function(t){
    if(!t[1].test(D)){
      fail("docs/_headers no longer sets " + t[0] + " to " + t[2]);
    }
  });

  /* The two the edge owns must not be duplicated here. Two sources for one
     header is the drift this file exists to avoid. */
  ["Strict-Transport-Security", "X-Content-Type-Options"].forEach(function(k){
    if(new RegExp("^\\s+" + k + ":", "mi").test(D)){
      fail("docs/_headers sets " + k + ", which the edge already sets \u2014 " +
           "one header, one place");
    }
  });
  if(/Content-Security-Policy/i.test(D)){
    fail("docs/_headers sets a CSP \u2014 the CSP lives in the <meta> tag whose " +
         "hash section 43 blesses, and two of them will disagree");
  }

  /* OUT OF THE OFFLINE SHELL, and until 3.0.0 nothing said so. Section 13
     names _headers in NOT_SHELLED, which only permits its absence — smuggling
     it INTO the precache left the whole suite green, and negtest251 reported
     PASS for it because its expected string, "_headers", matched the note this
     section prints on a good run. Two failures, one fixture. share.png and
     orders.txt have carried this assertion since 1.9.0 and 2.6.0; the file the
     edge reads before a response exists gets it too. */
  /* THE CACHE POLICY, PINNED THE MOMENT IT EXISTS. This file declared none at
     all, so every response took whatever Workers Assets emits by default and
     Cloudflare caches .js at the edge — and on 5 Aug 2026 the bare /sw.js
     answered VERSION = "2.5.1" while the same file with a cache-busting query
     answered 2.7.5. sw.js is how a returning browser learns the app changed, so
     a stale copy pins every returning visitor to an old app indefinitely; the
     value is load-bearing, which is the whole argument for guarding it rather
     than remembering it. The fonts go the other way: 62,996 bytes that never
     change under a name, re-fetched on no policy at all until now. */
  var RULES = [
    ["/sw.js", /^\s+Cache-Control:\s*no-cache\s*$/m,
     "no-cache — it must be revalidated before use, or a returning browser " +
     "never learns the app changed"],
    ["/fonts/*", /^\s+Cache-Control:\s*public,\s*max-age=31536000,\s*immutable\s*$/m,
     "a year and immutable — the faces are blessed by hash and never change " +
     "under a name, so re-fetching them buys nothing"]
  ];
  RULES.forEach(function(r){
    var i = D.indexOf("\n" + r[0] + "\n");
    if(i < 0){
      fail("docs/_headers has no " + r[0] + " rule — 3.0.0 added one because " +
           "nothing in this project declared a cache policy and the edge was " +
           "answering /sw.js from a stale copy");
      return;
    }
    var next = D.indexOf("\n/", i + 1);
    var body = D.slice(i, next < 0 ? D.length : next);
    if(!r[1].test(body)){
      fail("docs/_headers no longer sets Cache-Control on " + r[0] + " to " + r[2]);
    }
  });
  /* A blanket policy under /* would cover sw.js too, and the two want opposite
     answers. One rule, one path. */
  var star = D.slice(D.indexOf("\n/*\n"), D.indexOf("\n/sw.js\n") < 0 ? undefined : D.indexOf("\n/sw.js\n"));
  if(/Cache-Control/i.test(star)){
    fail("docs/_headers sets Cache-Control under /*, which covers sw.js — the " +
         "version marker and the fonts want opposite answers, and a blanket " +
         "rule gives one of them the wrong one");
  }

  var shell104 = (fs.readFileSync(path.join(PUBLIC, "sw.js"), "utf8")
                    .match(/var SHELL\s*=\s*\[[\s\S]*?\]/) || [""])[0];
  if(shell104.indexOf("_headers") >= 0){
    fail("_headers is in sw.js's SHELL precache — it is read by the edge before " +
         "a response is ever sent and the page never fetches it, so caching it " +
         "spends every installer's storage on a file no view can use");
  }

  note("_headers: Referrer-Policy, X-Frame-Options and Permissions-Policy on /*, " +
       "no-cache on /sw.js, a year on /fonts/*, and out of the offline shell");
})();

/* ---------- 105. The catalogue answers in plain text ------------------ */
/* B4, approved 4 Aug: a flat text export of the catalogue for anything that
   reads text rather than HTML — the same audience llms.txt talks to, given the
   data instead of a description. Separate file, so it costs the page nothing.

   IT CARRIES ONE ORDERING, AND THE REASON IS WORTH READING BEFORE ANYONE
   "COMPLETES" IT. By universe needs no sort: each continuity's array IS its
   spoiler-safe order, exactly as guard 78 relies on for the seed. Bruce's life
   and Release order are produced by two anonymous comparators inside
   buildGroups() in index.html, and fn() can only extract NAMED functions —
   so writing them here would be a second implementation of the app's ordering,
   which is the one thing this file exists to prevent. Naming them in
   index.html so both sides share one source is a refactor of buildGroups(),
   which is app logic and therefore 2.5.3 by the standing split rule.

   The loss is smaller than it sounds. Release order is derivable from this
   file — every entry states its year. Bruce's life is not, and it is also the
   one the app itself calls "an interpretation rather than a canon", so the
   app is the honest place for it. The file says so in its own words rather
   than quietly shipping two thirds of a promise.

   Generated and blessed like the seed and the ItemList: rebuilt on every run
   and compared, npm run bless writes it. A hand-maintained copy of 200 entries
   would be stale within a release and nobody would read it closely enough to
   notice. */

(function(){
  var TXT = path.join(PUBLIC, "orders.txt");
  var lines = [
    "Night Watcher — every Batman story ever filmed, in order",
    "https://nightwatcher.life/",
    "",
    "An unofficial fan guide. " + actual.films + " films and " + actual.seasons +
      " seasons of television across " + PATH.length + " continuities.",
    "Content ratings are the certified MPA / TV Parental Guidelines values —",
    "sourced or absent, never guessed. Announced titles are included and marked",
    "NOT OUT YET; nothing is claimed before it exists.",
    "",
    "This file is generated from the same data the app renders, and the build",
    "fails if the two disagree.",
    "",
    "THE ORDERING BELOW is by universe: every continuity kept whole, each in its",
    "own story order, and the continuities in the order their stories start.",
    "Nothing spoils anything ahead of it.",
    "",
    "Release order is derivable from this file — every entry states its year.",
    "Bruce's life — all " + PATH.length + " continuities blended into one",
    "chronology — is an interpretation rather than a canon, and lives in the app",
    "at https://nightwatcher.life/#life",
    "",
    "No account, no advertising, nothing tracking what you watch. Progress stays",
    "in the reader's browser. Free software under the AGPL.",
    "",
    "=========================================================================",
    ""
  ];
  PATH.forEach(function(g, gi){
    lines.push(g.n + ". " + g.name);
    lines.push("-".repeat((g.n + ". " + g.name).length));
    FILMS.filter(function(f){ return f.gi === gi; }).forEach(function(f, i){
      var bits = [f.fmt === "live" ? "live action" : "animated"];
      if(f.tv) bits.push("series");
      var tier = tierOf(f);
      if(tier === "e") bits.push("essential");
      else if(tier === "k") bits.push("core");
      else bits.push("optional");
      if(f.r) bits.push(f.r);
      if(f.b.indexOf("u") >= 0) bits.push("NOT OUT YET");
      lines.push("  " + (i + 1) + ". " + f.t + (f.sub ? " — " + f.sub : "") +
                 " (" + f.y + ") · " + bits.join(" · "));
    });
    lines.push("");
  });
  var want = lines.join("\n");

  /* A plain-text export nothing points at is a file nothing reads. llms.txt is
     the one page written for the audience this file is for, so that is where
     the pointer lives, and it is guarded rather than trusted. */
  var lt2 = path.join(PUBLIC, "llms.txt");
  if(fs.existsSync(lt2) && fs.readFileSync(lt2, "utf8").indexOf("/orders.txt") < 0){
    fail("llms.txt does not point at orders.txt — the plain-text catalogue " +
         "ships, and the one file written for engines never mentions it");
  }

  /* 2.7.2. llms.txt was the ONLY thing pointing at this file, and that was
     enough to satisfy the check above while being nowhere near enough in
     practice: a six-agent SEO/GEO/AEO audit crawled the live site and
     recommended, as new work, building the export that had been serving since
     2.6.0. The guard held the one pointer that existed and could not know the
     page itself was silent.

     The page now declares it as what it is — an alternate representation of
     the same catalogue. It stays OUT of sitemap.xml on purpose: the crawlable
     seed already carries all 200 entries and so does orders.txt, so submitting
     both for indexing asks a search engine to choose between two
     near-identical bodies on one domain. Discoverable is not indexed. */
  if(!/<link rel="alternate" type="text\/plain" href="orders\.txt"/.test(HTML)){
    fail("index.html does not point at orders.txt — the plain-text catalogue " +
         "is served and the page says nothing about it, which is how an audit " +
         "came to recommend building a file that already existed");
  }
  var smPath = path.join(PUBLIC, "sitemap.xml");
  if(fs.existsSync(smPath) && fs.readFileSync(smPath, "utf8").indexOf("orders.txt") >= 0){
    fail("orders.txt is in sitemap.xml — it carries the same 200 entries as " +
         "the crawlable seed, so indexing both asks a search engine to choose " +
         "between two near-identical bodies on one domain");
  }

  /* Kept here rather than in 101 so one section owns this file end to end.
     A crawler asset in the app cache is dead weight on every install: the app
     never fetches it, so it would be downloaded once and never read. */
  var swT = path.join(PUBLIC, "sw.js");
  if(fs.existsSync(swT)){
    var sh105 = (fs.readFileSync(swT, "utf8").match(/var SHELL\s*=\s*\[[\s\S]*?\]/) || [""])[0];
    if(sh105.indexOf("orders.txt") >= 0){
      fail("orders.txt is in the offline shell — it is written for readers and " +
           "engines that never run the app, and the app never fetches it");
    }
  }

  var got = fs.existsSync(TXT) ? fs.readFileSync(TXT, "utf8") : null;
  if(got === want){
    note("orders.txt: " + PATH.length + " continuities, " + FILMS.length +
         " entries, in step with the data");
  } else if(BLESS){
    fs.writeFileSync(TXT, want, "utf8");
    note(got === null ? "wrote docs/orders.txt" : "rewrote docs/orders.txt");
  } else if(got === null){
    fail("docs/orders.txt is missing — the catalogue's plain-text answer. " +
         "Fix with: npm run bless");
  } else {
    fail("docs/orders.txt no longer matches the catalogue — a title, a year, a " +
         "rating or an ordering has moved and the export did not. " +
         "Fix with: npm run bless");
  }
})();

/* The favicon is a file, not a data: URI. 2.7.0: the SVG icon shipped inline as
   a data: URI from the start \u2014 one fewer request, and it renders perfectly in
   every browser, which is exactly why nothing caught it. Google's favicon
   pipeline CRAWLS the icon: its documentation requires a stable favicon URL,
   and SVG is supported only as a served file with a content type. A data: URI
   has no URL to fetch, no MIME type on the wire, and nothing to re-crawl, so
   the site had no favicon in search results months after launch.

   Inlining it again would be a defensible optimisation on every ground except
   the one that matters, so the rule is written down rather than remembered. */
(function(){
  var links = HTML.match(/<link[^>]*rel="(?:shortcut )?icon"[^>]*>/g) || [];
  if(!links.length){ fail("no <link rel=\"icon\"> in the head"); return; }
  links.forEach(function(l){
    if(/href="data:/.test(l)){
      fail("a favicon ships as a data: URI \u2014 browsers render it and search " +
           "engines cannot crawl it, because there is no URL to fetch and no " +
           "content type on the wire. Serve it as a file");
    }
  });
  if(!fs.existsSync(path.join(PUBLIC, "icon.svg"))){
    fail("docs/icon.svg is missing \u2014 the head points at it");
  }
  note("favicon: " + links.length + " icon link(s), all served as files");
})();

/* ---------- 106. The fonts carry every letter the catalogue uses ------ */
/* 2.7.0 subset five of the six faces from 118,860 bytes to 62,996 — 39% of the
   first-visit payload down to 26%. The weight was never dead files: all six are
   referenced by @font-face and all six are precached. The weight was glyph
   coverage nobody was ever going to use.

   THE FAILURE MODE A SUBSET INTRODUCES IS SILENT. Cut a glyph the catalogue
   later needs and the browser draws a blank box, on one entry, on one row,
   probably on somebody else's device. Nothing throws. That is why the subset is
   Latin-1 plus punctuation rather than the 99 characters the catalogue happened
   to contain on the day — the tighter cut saved another 21 KB and would have
   put an accented title one data patch away from tofu, on a catalogue whose
   whole design is that it takes data patches.

   This guard closes the gap the range leaves. Every character in the served
   page and in the plain-text export must be inside the blessed range, so a new
   title with an unusual letter fails the build on the day it is added rather
   than turning up in a screenshot three weeks later. It keeps a trigger patch
   honest too: one data row stays one data row, unless it needs a glyph the
   fonts do not have, and then the build says so.

   It does not regenerate the fonts. Doing that would put fonttools and a Python
   toolchain in CI to re-derive bytes that are already committed. Instead
   qa/subset-fonts.py blesses a manifest carrying each file's size and SHA-256,
   and this guard holds the files against it — so the fonts and the record of
   what they contain can only move together, which is the same bargain the seed,
   the ItemList and orders.txt already make.

   Limelight is in the manifest but marked unsubset. Its OFL header reads "with
   Reserved Font Name Limelight"; Anton's and IBM Plex's do not. Under OFL 1.1 a
   Modified Version may not carry the reserved name as presented to users, so
   subsetting it means renaming the family in the name table, in @font-face and
   in --deco — real CSS churn and a licensing judgement, for 10.3 KB. Left
   whole on purpose, and the manifest says so rather than leaving it looking
   like an oversight. */

(function(){
  var MAN = path.join(__dirname, "font-subset.json");
  if(!fs.existsSync(MAN)){
    fail("qa/font-subset.json is missing — the fonts ship subset and nothing " +
         "records what they still contain. Fix with: python3 qa/subset-fonts.py");
    return;
  }
  var man = JSON.parse(fs.readFileSync(MAN, "utf8"));

  /* The range, expanded once. */
  var ok = {};
  (man.ranges || []).forEach(function(r){
    r = String(r).replace(/U\+/g, "");
    var a, b;
    if(r.indexOf("-") >= 0){ a = parseInt(r.split("-")[0], 16); b = parseInt(r.split("-")[1], 16); }
    else { a = b = parseInt(r, 16); }
    for(var i = a; i <= b; i++) ok[i] = 1;
  });
  if(!Object.keys(ok).length){ fail("qa/font-subset.json declares no ranges"); return; }

  /* Every character the reader can be shown, from both places it comes from. */
  var text = HTML;
  var ordersPath = path.join(PUBLIC, "orders.txt");
  if(fs.existsSync(ordersPath)) text += fs.readFileSync(ordersPath, "utf8");

  var outside = {}, n = 0;
  for(var i = 0; i < text.length; i++){
    var cp = text.codePointAt(i);
    if(cp > 0xFFFF) i++;
    if(cp < 0x20) continue;
    if(!ok[cp] && !outside[cp]){ outside[cp] = 1; n++; }
  }
  if(n){
    var list = Object.keys(outside).slice(0, 8).map(function(cp){
      return "U+" + ("0000" + Number(cp).toString(16).toUpperCase()).slice(-4) +
             " (" + String.fromCodePoint(Number(cp)) + ")"; }).join(", ");
    fail(n + " character(s) in the page or the export fall outside the font " +
         "subset: " + list + (n > 8 ? ", …" : "") + " — they would render " +
         "as blank boxes. Widen the range in qa/subset-fonts.py and re-run it, " +
         "or use a character the fonts carry");
  }

  /* The files on disk against the record of what was subset. */
  var dir = path.join(PUBLIC, "fonts");
  var onDisk = fs.readdirSync(dir).filter(function(f){ return /\.woff2$/.test(f); }).sort();
  var named = Object.keys(man.files || {}).sort();
  onDisk.forEach(function(f){
    if(named.indexOf(f) < 0){
      fail("docs/fonts/" + f + " ships but qa/font-subset.json does not name it " +
           "— a face nobody blessed is a face nobody checked");
    }
  });
  named.forEach(function(f){
    if(onDisk.indexOf(f) < 0){ fail("qa/font-subset.json names " + f + ", which is not in docs/fonts"); return; }
    var buf = fs.readFileSync(path.join(dir, f));
    var rec = man.files[f];
    if(buf.length !== rec.bytes){
      fail(f + " is " + buf.length + " bytes; qa/font-subset.json says " + rec.bytes +
           " — the font moved and the record of what it contains did not. " +
           "Fix with: python3 qa/subset-fonts.py");
      return;
    }
    var got = require("crypto").createHash("sha256").update(buf).digest("hex");
    if(got !== rec.sha256){
      fail(f + " does not match its blessed hash — same size, different bytes. " +
           "Fix with: python3 qa/subset-fonts.py");
    }
  });

  var total = onDisk.reduce(function(a, f){ return a + fs.statSync(path.join(dir, f)).size; }, 0);
  var sub = named.filter(function(f){ return man.files[f].subset; }).length;
  note("fonts: " + onDisk.length + " faces, " + sub + " subset, " + total +
       " bytes, " + Object.keys(ok).length + " codepoints in range");
})();

/* ---------- 107. Every section can fail, and every section runs -------- */
/* Stage C, carried since 2.2.0 and finally built in 2.7.0. Guard 66 already
   holds the numbering and the INDEX. This holds the two properties underneath
   it, both of which fail SILENTLY when they break, which is the worst way for
   a guarantee to break: a section that cannot fail protects nothing, and a
   section that never runs passes for the same reason an empty file does.

   IT FOUND SOMETHING. Section 24 is not at file scope — it sits inside section
   23's else branch, because it needs the path tables section 23 extracts. That
   is a section whose checks can be skipped entirely, which is exactly the shape
   this guard exists to catch.

   It is kept, on one condition, and the condition is the interesting part. The
   only way to skip 24 is for the extraction to fail, and that same branch calls
   fail() — so a skipped 24 can never coexist with a green build. That is what
   makes the nesting acceptable rather than merely convenient, and it is
   asserted below rather than assumed. Lifting 24 out would leave it reading
   variables the failing branch never assigned, turning a clean red build into a
   stack trace: worse, on the release that is supposed to be the calm one.

   So: one nested section, named, with the reason and the safety condition
   written down. Any second one fails the build until somebody makes the same
   argument for it. */

(function(){
  var SRC = fs.readFileSync(__filename, "utf8");
  var lines = SRC.split("\n");

  /* Nested on purpose: name => the enclosing section it depends on. */
  var NESTED = {"24": "23"};

  var marks = [];
  lines.forEach(function(l, i){
    var m = l.match(/^(\s*)\/\* -{3,} (\d+)\./);
    if(m) marks.push({n: m[2], indent: m[1].length, line: i});
  });
  if(marks.length < 100){
    fail("section census read only " + marks.length + " sections out of guards.js " +
         "— the marker format changed and this guard is now measuring nothing");
    return;
  }

  var nested = [];
  marks.forEach(function(mk, i){
    var end = (i + 1 < marks.length) ? marks[i + 1].line : lines.length;
    var body = lines.slice(mk.line, end);

    if(body.join("\n").indexOf("fail(") < 0){
      fail("guard section " + mk.n + " contains no fail() — a section that " +
           "cannot fail is documentation, not a guard");
    }

    var topLevel = body.some(function(l){
      return l && !/^\s/.test(l) && !/^(\/\*|\*|\/\/|\*\/)/.test(l);
    });

    if(mk.indent > 0 || !topLevel){
      nested.push(mk.n);
      if(!NESTED[mk.n]){
        fail("guard section " + mk.n + " is not at file scope, so it only runs " +
             "if whatever encloses it reaches it — a section that can be " +
             "skipped fails by not running, which is a pass that is not a pass. " +
             "Either lift it out, or name it in this guard with the reason and " +
             "the condition that makes skipping it safe");
      }
    }
  });

  Object.keys(NESTED).forEach(function(n){
    if(nested.indexOf(n) < 0){
      fail("section " + n + " is recorded here as nested inside section " +
           NESTED[n] + ", and it is not — the exception outlived the thing " +
           "it excused. Remove it from NESTED");
    }
  });

  /* The safety condition, asserted rather than trusted: the branch that skips
     the nested section must itself fail, or the skip is silent. */
  Object.keys(NESTED).forEach(function(n){
    var host = NESTED[n];
    var a = SRC.indexOf("/* ---------- " + host + ".");
    var b = SRC.search(new RegExp("^\\s*/\\* -{3,} " + n + "\\.", "m"));
    if(a < 0 || b < 0 || b < a){ fail("cannot locate sections " + host + " and " + n); return; }
    if(SRC.slice(a, b).indexOf("fail(") < 0){
      fail("section " + host + " encloses section " + n + " but never calls " +
           "fail() before it — so the path that skips " + n + " is silent, " +
           "and " + n + " could be missing from a green build");
    }
  });

  note("section census: " + marks.length + " sections, all can fail, " +
       (nested.length ? nested.length + " nested by recorded exception (" + nested.join(", ") + ")"
                      : "all at file scope"));
})();

/* ---------- 108. The 2.7.1 soak notes stay fixed ---------------------- */
/* Three cosmetics, reported by the owner against live 2.7.0. They are here
   rather than left to the CSS because a cosmetic with no guard is a cosmetic
   that comes back: each one is a single value that reads like tidying, and one
   of them is a value THIS PROJECT ITSELF moved in the release before.

   The era note touched the line above it. .gbody carried no top padding, and
   .group.open .ghead draws a 1px rule underneath itself, so the first line of
   the note sat directly on it. The space goes on the parent's padding rather
   than the note's margin: with a zero-padding parent the child's top margin
   collapses straight out of the box and nothing moves.

   The rating badge sat beside the Where-to-watch link. That was 2.2.0's fix
   for its own soak note, and it made the rating read as part of the link
   rather than as what it is. It now sits with the other badges everywhere,
   which section 92 holds seat by seat.

   THE SHARE CARD'S BOTTOM BLOCK IS BACK WHERE IT WAS, AND THIS IS THE ONE TO
   READ BEFORE CHANGING ANYTHING. 2.7.0 moved the bars, the rule, the strapline
   and the domain up by 145px to clear the strip Instagram reserves for its
   reply bar, and moved the bat and its glow up with them. The reasoning was
   sound and it was shipped without the one-minute Story test that was written
   into the plan to gate it. On a real card it left a third of the canvas empty
   below the domain, and the balance the card had was worth more than the risk
   it was avoiding. Reverted in 2.7.1.

   The argument for moving it is still true and still on the record, so it will
   read as unfinished work to whoever finds it next. It is not. If it is ever
   revisited, the answer is not to shift the block again — it is to keep the
   composition and shorten the canvas, and that wants the Story test first. */

(function(){
  /* The note must not touch the rule the open header draws under itself. */
  var gb = (HTML.match(/\.gbody\{[^}]*\}/) || [""])[0];
  var pad = (gb.match(/padding:\s*(\d+)px/) || [])[1];
  if(!gb){ fail(".gbody has no rule — the group body is unstyled"); }
  else if(!pad || parseInt(pad, 10) < 8){
    fail(".gbody's top padding is " + (pad || "0") + "px — the era note sits " +
         "against the 1px rule the open header draws under itself. It reads as " +
         "a rendering fault rather than as spacing. The space belongs on this " +
         "padding, not on .gnote's margin, which would collapse out of a " +
         "zero-padding parent");
  }

  /* The share card's lower band, restored. */
  /* 3.0.0: THESE FALLBACKS WERE DEAD CODE. slice() THROWS when a marker is
     missing, so `slice(…) || HTML.slice(…)` never reached its right-hand side
     and the fail("shareCardBlock() is gone") below was unreachable — renaming
     the function ended the run with a raw stack trace, which is the exact
     failure mode optionalFn() was written to prevent twenty lines above its
     definition. sliceOr() is the version that keeps the promise. */
  var card = sliceOr("function drawShareCard", "\nfunction shareCardBlock") ||
             HTML.slice(HTML.indexOf("function drawShareCard"));
  var domain = (card.match(/"nightwatcher\.life",\s*(\d+)\)/) || [])[1];
  var strap  = (card.match(/"One path through every Batman",\s*(\d+)\)/) || [])[1];
  var rule   = (card.match(/x\.fillRect\(16,\s*(\d+),\s*1048,\s*4\)/) || [])[1];
  if(!domain || !strap || !rule){
    fail("cannot read the share card's bottom block — the domain line, the " +
         "strapline and the rule under the bars");
  } else {
    if(parseInt(domain, 10) !== 1750 || parseInt(strap, 10) !== 1700 ||
       parseInt(rule, 10) !== 1590){
      fail("the share card's bottom block has moved — rule " + rule + ", " +
           "strapline " + strap + ", domain " + domain + "; 2.7.1 restored " +
           "1590 / 1700 / 1750. 2.7.0 lifted them 145px to clear Instagram's " +
           "reply bar and left a third of the canvas empty. If the safe zone " +
           "is the problem, shorten the canvas rather than shifting the block, " +
           "and run the Story test first");
    }
    if(!/x\.translate\(260,\s*734\)/.test(card)){
      fail("the bat has moved off the restored composition — it travels with " +
           "the bottom block or the card stops balancing");
    }
  }

  /* The share block reads like every other block: title, description, buttons. */
  var blk = sliceOr("function shareCardBlock", "\nfunction cardFile") || "";
  if(!blk){ fail("shareCardBlock() is gone"); }
  else {
    var iP = blk.indexOf("<p>A story card"), iB = blk.indexOf('class="bkbtns"');
    if(iP < 0){
      fail("the share block's description is not a plain <p> — every other " +
           "block on the page states what it does directly under its title");
    } else if(iB < 0 || iP > iB){
      fail("the share block's description sits after its buttons — it reads " +
           "as a footnote to them rather than as what the block is");
    }
    if(/\.sharecard\s+\.note\{/.test(HTML)){
      fail(".sharecard .note is back — that rule centred the description " +
           "under the buttons, which is the layout 2.7.1 removed");
    }
  }

  note("2.7.1 cosmetics: era note clear of the rule, card block at 1590/1700/1750, " +
       "share block reads title → description → buttons");
})();

/* ---------- 109. Every count on Progress is a way into the list -------- */
/* 3.0.0 made the scoreboard's three figures buttons. Section 40 asserts they
   ARE buttons; this asserts they land somewhere real, which is the half that
   can rot silently. The tiles reuse data-act="tier" and pass data-tf, so a
   filter renamed or removed in chipSet() leaves a tile pointing at a slice the
   app no longer offers — and the app would answer a tap by rendering The path
   with a filter nothing matches, which looks exactly like an empty catalogue.
   The relationship is the guard: every data-tf in the markup must be a filter
   chipSet() names, and every count the scoreboard prints must have a tile. */

(function(){
  /* chipSet() is evaluated, not pattern-matched: the list is the app's answer
     to "what filters exist", and reading it any other way is reimplementing it
     here — which this file's own header forbids. */
  var offers = [];
  try {
    var cs = {};
    vm.runInNewContext(fn("chipSet") + "\nout = chipSet();", cs);
    offers = (cs.out || []).map(function(p){ return p[0]; });
  } catch(e){
    fail("chipSet() will not evaluate: " + e.message + " — the filters The " +
         "path offers cannot be read, so nothing below can check that the " +
         "Progress tiles point at any of them");
    return;
  }
  if(!offers.length){
    fail("chipSet() names no filters — The path has no way to narrow itself, " +
         "and every scoreboard tile below points at nothing");
    return;
  }
  var sb = fn("scoreboard") + fn("scoreTile");
  var tfs = (sb.match(/data-tf="'\+tf\+'"/) ? sb.match(/scoreTile\("([a-z]+)"/g) || [] : [])
              .map(function(m){ return m.replace(/scoreTile\("|"/g, ""); });
  /* Written literally rather than through the helper is just as valid. */
  (sb.match(/data-tf="([a-z]+)"/g) || []).forEach(function(m){
    var v = m.replace(/data-tf="|"/g, "");
    if(tfs.indexOf(v) < 0) tfs.push(v);
  });
  if(!tfs.length){
    fail("no scoreboard tile names a filter — the three counts on Progress are " +
         "back to being figures with nowhere to go, which is the whole thing " +
         "3.0.0 fixed");
    return;
  }
  tfs.forEach(function(tf){
    if(offers.indexOf(tf) < 0){
      fail("a Progress tile sends the reader to the \"" + tf + "\" filter and " +
           "chipSet() does not offer it (" + offers.join(", ") + ") — tapping " +
           "the count would open The path on a filter nothing matches, which " +
           "reads as an empty catalogue rather than as a broken link");
    }
  });
  ["done", "left", "skip"].forEach(function(tf){
    if(tfs.indexOf(tf) < 0){
      fail("the scoreboard counts \"" + tf + "\" and offers no way into it — " +
           "all three counts are a way in or none of them is. Skipped spent " +
           "four releases as a number with nowhere to send anybody who tapped it");
    }
  });
  note("Progress tiles: " + tfs.join(", ") + " — all offered by chipSet() (" +
       offers.length + " filters)");
})();

/* ---------- 110. The page can still be pinch-zoomed -------------------- */
/* 3.0.0, and NOTHING GUARDED THIS. Section 62's entire argument — that a 24px
   control is acceptable because the reader can always zoom in on it — rests on
   this page deliberately setting no maximum-scale and no user-scalable=no. That
   is a recorded WCAG 1.4.4 decision, and adding `maximum-scale=1,
   user-scalable=no` shipped green through guards and smoke: tested. A decision
   with an argument built on top of it and no assertion under it is the shape
   this whole file exists to catch.

   404.html is held to the same rule. It is the page a reader meets when they
   are already lost, and it was unchecked entirely. */

(function(){
  var PAGES = [["index.html", HTML], ["404.html", null]];
  var p404 = path.join(PUBLIC, "404.html");
  PAGES[1][1] = fs.existsSync(p404) ? fs.readFileSync(p404, "utf8") : null;
  PAGES.forEach(function(pg){
    var name = pg[0], src = pg[1];
    if(src === null){
      fail("docs/404.html is missing — the origin serves it and section 45 " +
           "lists it, so its absence is a 404 for the 404");
      return;
    }
    var vp = (src.match(/<meta name="viewport" content="([^"]*)"/) || [])[1];
    if(!vp){
      fail(name + " has no viewport meta — a phone renders it at desktop width " +
           "and scales the whole page down, so every control is below the touch " +
           "target size section 62 measures");
      return;
    }
    if(/maximum-scale/.test(vp)){
      fail(name + " sets maximum-scale in its viewport (\"" + vp + "\"). Capping " +
           "zoom is a WCAG 1.4.4 failure, and section 62 accepts this page's " +
           "smallest controls only because a reader can zoom into them");
    }
    if(/user-scalable\s*=\s*(no|0)/.test(vp)){
      fail(name + " sets user-scalable=no in its viewport (\"" + vp + "\") — the " +
           "page refuses to be pinch-zoomed at all, which is the same WCAG 1.4.4 " +
           "failure by the blunter route");
    }
    if(vp.indexOf("width=device-width") < 0){
      fail(name + " no longer sets width=device-width (\"" + vp + "\") — the " +
           "layout stops being the one every measurement in this file assumes");
    }
  });
  note("viewport: index.html and 404.html both zoomable, width=device-width");
})();

/* ---------- 111. Watched and skipped are never both true --------------- */
/* markWatched() has always cleared the skip — watched-clears-skip is the app's
   own definition of what a tick means. THREE MERGE SITES DID NOT, and every one
   of them is a hand-copied version of the same few lines: the cross-tab storage
   event, the JSON restore branch, and applyImport(). Skip an entry in one tab,
   mark it watched in another, and the row renders class="film done skip" and
   appears in BOTH the W and the S segments of the backup code and the JSON —
   demonstrated in jsdom before it was fixed. Every denominator on Progress then
   disagrees with the next, because one entry is counted twice.

   THIS IS NOT THE RECORDED "THE MERGE ONLY EVER ADDS" DECISION. That decision
   is about never losing a mark somebody made, and it stands. This is drift
   between three copies of one merge, and the copies are the bug: the log-merge
   dance underneath was written out twice as well, and is now mergeLog(), so
   there is one place to change rather than three to remember. */

(function(){
  var SITES = [
    ["applyImport()", optionalFn("applyImport", "a restored backup would not be applied")],
    ["the JSON restore branch", optionalFn("doRestore", "nothing would read a pasted backup")],
    ["the cross-tab storage event",
     sliceOr('window.addEventListener("storage"', "\ndocument.getElementById(\"tabs\")")]
  ];
  SITES.forEach(function(site){
    if(!site[1]){
      fail("cannot locate " + site[0] + " — it is one of the three places a mark " +
           "arrives from somewhere else, and all three have to clear the skip");
      return;
    }
    if(site[1].indexOf("delete S.skipped") < 0){
      fail(site[0] + " sets S.watched without clearing S.skipped — an entry can " +
           "come back watched AND skipped, which markWatched() has never allowed. " +
           "It renders with both classes and lands in both segments of the backup " +
           "code, so every count on Progress disagrees with the next");
    }
  });

  /* One merge, one place. Two copies of a loop is how the invariant came to be
     maintained in one of them and not the others. */
  if(!/function\s+mergeLog\s*\(/.test(HTML)){
    fail("mergeLog() is gone — the log merge is back to being written out at " +
         "each call site, which is exactly how the three sites above drifted");
  }
  var dance = (HTML.match(/isFinite\(en\.ts\)/g) || []).length;
  if(dance > 1){
    fail("the log-merge dance appears " + dance + " times — it was written out " +
         "twice and 3.0.0 made it one helper. A second copy is a second thing to " +
         "remember to fix");
  }
  note("merge sites: 3, all clearing the skip; one shared log merge");
})();

/* ---------- 112. The Restore box survives a render nobody asked for ---- */
/* #restorebox is recreated empty on every render(), and renders fire from
   things the reader did not do: another tab's storage event, and the 4-second
   reset-confirm timeout — which is gated on S.tab === "stats", the very tab the
   box lives on. Paste a backup code, let another device tick something, and the
   paste is gone with no message. #q has been preserved across renders for
   releases; the box that holds somebody's only copy of their progress had not.

   3B reduces how often uncaused renders happen. It does not make this
   unnecessary: the storage event still fires. */

(function(){
  var r = fn("render");
  if(HTML.indexOf('id="restorebox"') < 0){
    fail("#restorebox is gone — there is nowhere to paste a backup");
    return;
  }
  if(r.indexOf("restorebox") < 0){
    fail("render() does not preserve #restorebox — it is rebuilt empty by every " +
         "render, including the ones the reader did not cause, and a half-typed " +
         "backup code disappears with nothing said");
    return;
  }
  if(!/rbVal|restorebox[\s\S]{0,200}\.value/.test(r)){
    fail("render() finds #restorebox but does not carry its value across — " +
         "preserving the element is not preserving the paste");
  }
  if(r.indexOf('getElementById("q")') < 0){
    fail("render() no longer preserves the search box either — #q and " +
         "#restorebox are the two inputs a render must not empty");
  }
  note("render() carries #q and #restorebox across a repaint");
})();

/* ---------- 113. Every negative suite runs in CI ---------------------- */
/* 3.0.0 ADDED A NEGATIVE SUITE AND NEVER ADDED IT TO THE SHARD MATRIX. The
   whole suite ran green on the release machine four times, including from
   inside the zip, because run-all.sh with no argument runs everything. CI
   shards, negtest300 was in none of the four pick patterns, and all four
   shards failed at the workflow's "every suite lands in some shard" step
   before run-all.sh ran at all.

   THIRD TIME THAT STEP HAS GONE RED, SECOND DISTINCT CAUSE. negtest252 and
   negtest260 reached the pick patterns and missed a hand-maintained fifth copy
   of the shard lists; that was fixed by making the workflow read the patterns
   out of itself instead of restating them. This one missed the pattern.

   The remaining hole was WHERE THE CHECK LIVED. It existed only in CI, so a
   tree could be fully green on the machine that built it and red on push —
   which is a watcher that cannot see from where the work happens, the exact
   shape 3.0.0 was written about. It lives here now. The workflow keeps its
   copy: it is the last line of defence if this file is the thing that broke,
   and two checks of one property is redundancy rather than drift, because
   neither restates the patterns. */

(function(){
  var ymlPath = path.join(ROOT, ".github", "workflows", "qa.yml");
  if(!fs.existsSync(ymlPath)){
    fail(".github/workflows/qa.yml is gone — nothing runs the suites on push, " +
         "and the negative evidence goes back to being produced by hand on the " +
         "release machine, which is what the workflow was created to end");
    return;
  }
  var YML = fs.readFileSync(ymlPath, "utf8");
  var picks = (YML.match(/^\s*pick:\s*'(.*)'\s*$/gm) || [])
    .map(function(l){ return (l.match(/'(.*)'/) || [])[1]; })
    .filter(Boolean);

  /* A check that silently reads zero patterns calls every suite uncovered; one
     that reads three waves a whole missing shard through. The count is asserted
     before the coverage, for the same reason the workflow asserts it. */
  if(picks.length !== 4){
    fail("read " + picks.length + " shard pick patterns out of qa.yml, expected 4 " +
         "— the matrix changed shape, or the pick lines stopped being readable. " +
         "Until that is fixed this section cannot tell covered from uncovered");
    return;
  }

  var negDir = path.join(__dirname, "negative");
  var suites = fs.readdirSync(negDir).filter(function(f){
    return /^negtest.*\.sh$/.test(f);
  }).sort();
  if(!suites.length){ fail("qa/negative holds no suites at all"); return; }

  var uncovered = suites.filter(function(f){
    return !picks.some(function(p){
      try { return new RegExp(p).test("qa/negative/" + f); }
      catch(e){ return false; }
    });
  });
  if(uncovered.length){
    fail("no CI shard runs " + uncovered.join(", ") + " — the suite exists, " +
         "passes locally under run-all.sh with no argument, and never runs on " +
         "push. Add it to a pick pattern in .github/workflows/qa.yml");
  }
  note("CI shards: " + picks.length + " patterns covering all " + suites.length +
       " negative suites");
})();

/* ---------- 114. The README describes the origin that actually serves --- */
/* Section 77 inverted in 2.5.1 and fails the build if the move offer returns
   to the app. It reads the SERVED HTML. It does not read the README — which is
   exactly why a paragraph promising an offer retired four releases earlier
   survived a documented amendment pass and shipped until 3.0.0.

   3.0.0 corrected the prose and left the hole open: a fixture was written for
   it, found nothing to trip, and was REMOVED rather than left passing against a
   green run, which is the failure this release line exists to stop.

   NOT A BLOCKLIST OF FORBIDDEN WORDS. The 3.0.0 audit recommended greping for
   the retired move-offer language; a blocklist passes for every phrasing nobody
   thought of, and this project already refused that shape once — negtest172
   records why a spoiler-word blocklist was rejected for era notes. What is
   asserted here is AGREEMENT: the app injects noindex on the mirror and offers
   nothing, so the README's paragraph about that address has to say the first
   and must not claim the second. Section 77 holds the app's half; this holds
   the prose's half; neither can drift without the other going red. */

(function(){
  var para = (README.match(/^Served from Cloudflare Workers[\s\S]*?(?=\n\n)/m) || [""])[0];
  if(!para){
    fail("cannot find the README paragraph that describes the old GitHub Pages " +
         "address — it is the one piece of prose in this file that makes a claim " +
         "about behaviour section 77 guards, and it has to stay locatable");
    return;
  }
  /* What the app actually does to the mirror, read from the app. */
  var injects = /noindex/.test(HTML) && /function offCanonical\s*\(/.test(HTML);
  if(!injects){
    fail("the app no longer injects noindex on the mirror, or offCanonical() is " +
         "gone — section 77 and section 78 own that, but this section's whole " +
         "premise is the README agreeing with it, so it cannot check anything");
    return;
  }
  if(para.indexOf("noindex") < 0){
    fail("the README's old-origin paragraph does not mention noindex, which is " +
         "the only thing the app actually does there. A reader is told the " +
         "address still works and not what it does, which is how the retired " +
         "move offer lived in this paragraph for four releases");
  }
  /* THE FIRST DRAFT OF THIS CHECK FAILED ON THE CORRECTED PROSE, which is worth
     recording because it is the whole argument against the shape the 3.0.0 audit
     asked for. It matched "carry that progress across" — inside the sentence
     saying the offer WAS RETIRED. A pattern that cannot tell a claim from its
     retraction is a blocklist wearing a better coat.

     So the assertion is about tense and marking, not vocabulary. The paragraph
     may name the offer; it may not present it as something the app does. */
  if(/\b(app|it)\s+offers?\s+to\s+carry/i.test(para)){
    fail("the README says the app offers to carry progress across from the old " +
         "origin, in the present tense. That offer was retired in 2.5.1 and " +
         "section 77 fails the build if it returns to the app — this is the same " +
         "claim in the file section 77 does not read");
  }
  if(/carry (it|that progress|your progress) across/i.test(para) &&
     !/\bretired\b/i.test(para)){
    fail("the README's old-origin paragraph mentions carrying progress across " +
         "and never says it was retired. Naming a retired feature without the " +
         "marker is how the last one survived four releases — mention it if it " +
         "helps a reader, but mark it");
  }
  note("README's old-origin paragraph agrees with offCanonical(): noindex, no offer");
})();

/* ---------- 115. Four copies of the bat, and they agree ---------------- */
/* THE GLYPH IS WRITTEN OUT VERBATIM IN FOUR PLACES and nothing asserted they
   match: the header markup in index.html, BATP for the share card, icon.svg
   from which every PNG raster derives, and — since 3.1.0 — the mark behind
   the 404. Found while measuring the header on 5 Aug and still unguarded
   after 3.0.0.

   Cheaper than it looked, and worth recording why: all four sit in the same
   0-100 coordinate space and carry the same translate(0,5), so this needs no
   geometry — the header, icon.svg and the 404 hold four <path> elements plus
   an <ellipse>, and BATP is those four d values concatenated. String equality
   after normalising whitespace is the whole check.

   BATP CARRIES NO ELLIPSE, and that is a real difference rather than a defect:
   the share card draws it on the canvas separately. It is asserted as a
   difference here rather than papered over, because the next person to see
   three-of-four will otherwise assume a bug.

   THE COUNT IS PART OF THE ASSERTION, and 3.1.0 is the proof. Stage A added a
   fourth copy to 404.html against the three-copy version of this section: one
   of its paths was edited alone and all 117 sections stayed green; the bat was
   then deleted outright and all 117 stayed green again. A guard that counts
   copies certifies whatever it was not told about. Both experiments are
   fixtures in negtest210 now — the best provenance a fixture can have is that
   it came back green when it should not have. */

(function(){
  function norm(s){ return String(s || "").replace(/\s+/g, " ").trim(); }
  function paths(src){
    return (src.match(/\sd="([^"]+)"/g) || []).map(function(m){
      return norm(m.slice(4, -1));
    });
  }
  function ellipse(src){
    var e = (src.match(/<ellipse[^>]*>/) || [""])[0];
    if(!e) return null;
    return ["cx", "cy", "rx", "ry"].map(function(k){
      return (e.match(new RegExp(k + '="([-\\d.]+)"')) || [])[1];
    }).join(",");
  }

  var mark = (HTML.match(/<button class="mark"[\s\S]*?<\/button>/) || [""])[0];
  var batp = (HTML.match(/var BATP\s*=\s*"([^"]+)"/) || [])[1];
  var iconPath = path.join(PUBLIC, "icon.svg");
  var icon = fs.existsSync(iconPath) ? fs.readFileSync(iconPath, "utf8") : "";
  var fourPath = path.join(PUBLIC, "404.html");
  var fourSrc = fs.existsSync(fourPath) ? fs.readFileSync(fourPath, "utf8") : "";
  var four = (fourSrc.match(/<svg class="bat"[\s\S]*?<\/svg>/) || [""])[0];

  if(!mark){ fail("the header bat markup is gone"); return; }
  if(!batp){ fail("BATP is gone — the share card has no bat to draw"); return; }
  if(!icon){ fail("docs/icon.svg is missing — every PNG raster derives from it"); return; }
  if(!four){
    fail("the 404's bat is gone — <svg class=\"bat\"> is not in docs/404.html. " +
         "It is the copy nobody reads, on the page a reader meets when something " +
         "is already broken, which is exactly the position icon.svg was in " +
         "before 3.0.0");
    return;
  }

  /* The count is the assertion. Add a fifth copy and add it here, or it is a
     copy nothing compares. */
  /* THE NAMES ARE FIXTURE-FACING. negtest300 pins "the header bat and BATP have
     drifted apart" and "icon.svg and BATP have drifted apart" — 483 fixtures
     assert against guard output by message, so a reworded failure is a broken
     fixture. The loop is new; the sentences it prints are the ones that were
     already being asserted. */
  var COPIES = [["the header bat", mark], ["docs/icon.svg", icon], ["the 404's bat", four]];

  var batpN = norm(batp);
  var ref = null;
  COPIES.forEach(function(c){
    var ps = paths(c[1]), joined = norm(ps.join(" "));
    if(ref === null) ref = ps.length;
    if(ps.length !== ref){
      fail(c[0] + " draws " + ps.length + " paths and the header draws " + ref +
           " — they are the same mark and one of them was edited alone. Every " +
           "install, every raster, every share surface and the error page show it");
    }
    if(joined !== batpN){
      fail(c[0] + " and BATP have drifted apart — the same mark is two " +
           "different shapes, and nothing but this section reads both");
    }
  });

  var els = COPIES.map(function(c){ return [c[0], ellipse(c[1])]; });
  if(!els[0][1]){ fail("the header bat has lost its ellipse"); }
  else els.slice(1).forEach(function(e){
    if(e[1] !== els[0][1]){
      fail("the bat's ellipse differs between the header (" + els[0][1] + ") and " +
           e[0] + " (" + e[1] + ")");
    }
  });
  if(/<ellipse/.test(batp)){
    fail("BATP now carries an ellipse — the share card draws it on the canvas " +
         "separately, so this would draw it twice");
  }

  var trs = COPIES.map(function(c){
    return [c[0], (c[1].match(/transform="translate\(([^)]*)\)"/) || [])[1]];
  });
  trs.slice(1).forEach(function(t){
    if(t[1] !== trs[0][1]){
      fail("the bat's transform differs between the header (" + trs[0][1] + ") and " +
           t[0] + " (" + t[1] + ") — same shape, different position");
    }
  });
  note("bat glyph: " + ref + " paths agree across the header, BATP, icon.svg and " +
       "the 404, ellipse and transform matched");
})();

/* ---------- 116. The fonts really carry what the page really renders --- */
/* SECTION 106 HAS NEVER READ A FONT. It compares each file's bytes and hash to
   qa/font-subset.json — a manifest qa/subset-fonts.py writes itself — so
   narrow-the-range, re-run, re-bless leaves it green over a font that lost
   glyphs. That was the recorded hole, deferred twice as "needs real cmap
   inspection and a new dependency."

   IT NEEDED NO DEPENDENCY. woff2 is a Brotli-compressed sfnt and Node ships
   zlib.brotliDecompressSync, so the table directory, the cmap and its real
   codepoint set are all reachable in pure Node — which matters, because "Zero
   dependencies" is stated in this file's own header and in README's QA
   paragraph, and shelling out to fontTools would have falsified a guarded claim
   to fix an unguarded one.

   AND IT FOUND A SECOND HOLE NOBODY HAD RECORDED. Section 106's other half
   asserts that every character the page renders sits inside the blessed range —
   and it scans the file for literal non-ASCII only. The star, the caret and the
   external-link arrow all ship as \uXXXX ESCAPES in the script, so the check
   could not see them and has been passing over four characters that are in none
   of the six faces since the subset landed. The escapes are counted here.

   THE FOUR ARE NOT A DEFECT, AND THAT IS THE POINT OF RECORDING THEM. A star, a
   caret, an arrow and a guillemet are UI marks rather than text; they render
   from the system font, they have always rendered from the system font, and
   subsetting four symbol glyphs into five faces would spend bytes for a worse
   result. What was wrong was that nobody had decided it — it was invisible, not
   intentional. It is a named exception now, and like section 107's nested
   section, the exception is asserted rather than assumed: if one of them ever
   turns up INSIDE a face, this fails, because the reason it was excepted has
   gone. */

(function(){
  var KNOWN_TABLES = ["cmap","head","hhea","hmtx","maxp","name","OS/2","post","cvt ",
    "fpgm","glyf","loca","prep","CFF ","VORG","EBDT","EBLC","gasp","hdmx","kern",
    "LTSH","PCLT","VDMX","vhea","vmtx","BASE","GDEF","GPOS","GSUB","EBSC","JSTF",
    "MATH","CBDT","CBLC","COLR","CPAL","SVG ","sbix","acnt","avar","bdat","bloc",
    "bsln","cvar","fdsc","feat","fmtx","fvar","gvar","hsty","just","lcar","mort",
    "morx","opbd","prop","trak","Zapf","Silf","Glat","Gloc","Feat","Sill"];

  /* Symbol marks that come from the system font by decision. Each must stay
     absent from every face; a value here that turns up in a font means the
     subset grew and this exception is stale. */
  var SYSTEM_MARKS = {
    0x2605: "the rating star",
    0x25B6: "the group caret",
    0x2197: "the external-link arrow",
    0x203A: "the breadcrumb guillemet"
  };

  function base128(buf, p){
    var v = 0, i;
    for(i = 0; i < 5; i++){
      var b = buf[p.o++];
      if(i === 0 && b === 0x80) throw new Error("UIntBase128 leading zero");
      if(v & 0xFE000000) throw new Error("UIntBase128 overflow");
      v = (v << 7) | (b & 0x7F);
      if(!(b & 0x80)) return v >>> 0;
    }
    throw new Error("UIntBase128 too long");
  }
  function woff2Tables(buf){
    if(buf.readUInt32BE(0) !== 0x774F4632) throw new Error("not a woff2");
    var numTables = buf.readUInt16BE(12), p = {o: 48}, dir = [], i;
    for(i = 0; i < numTables; i++){
      var flags = buf[p.o++], idx = flags & 0x3F;
      var tag = idx === 0x3F ? buf.toString("latin1", p.o, (p.o += 4)) : KNOWN_TABLES[idx];
      var len = base128(buf, p);
      /* Only glyf and loca define a transform with its own length. */
      if((idx === 10 || idx === 11) && ((flags >> 6) & 0x03) === 0) len = base128(buf, p);
      dir.push({tag: tag, len: len});
    }
    var data = require("zlib").brotliDecompressSync(buf.slice(p.o));
    var off = 0, out = {};
    dir.forEach(function(t){ out[t.tag] = data.slice(off, off + t.len); off += t.len; });
    return out;
  }
  function codepointsOf(cmap){
    var n = cmap.readUInt16BE(2), best = null, bestScore = -1, i;
    for(i = 0; i < n; i++){
      var rec = 4 + i * 8;
      var pid = cmap.readUInt16BE(rec), eid = cmap.readUInt16BE(rec + 2);
      var off = cmap.readUInt32BE(rec + 4), fmt = cmap.readUInt16BE(off), score = -1;
      if(pid === 3 && eid === 10 && fmt === 12) score = 4;
      else if(pid === 0 && fmt === 12) score = 3;
      else if(pid === 3 && eid === 1 && fmt === 4) score = 2;
      else if(pid === 0 && fmt === 4) score = 1;
      if(score > bestScore){ bestScore = score; best = {off: off, fmt: fmt}; }
    }
    if(!best) throw new Error("no unicode cmap subtable");
    var set = {}, t = best.off, c;
    if(best.fmt === 4){
      var segX2 = cmap.readUInt16BE(t + 6), seg = segX2 / 2;
      var endO = t + 14, startO = endO + segX2 + 2, deltaO = startO + segX2,
          roO = deltaO + segX2;
      for(i = 0; i < seg; i++){
        var end = cmap.readUInt16BE(endO + i * 2), start = cmap.readUInt16BE(startO + i * 2);
        var delta = cmap.readInt16BE(deltaO + i * 2), ro = cmap.readUInt16BE(roO + i * 2);
        if(start === 0xFFFF) continue;
        for(c = start; c <= end && c !== 0x10000; c++){
          var g;
          if(ro === 0) g = (c + delta) & 0xFFFF;
          else {
            var gi = roO + i * 2 + ro + (c - start) * 2;
            if(gi + 1 >= cmap.length) continue;
            g = cmap.readUInt16BE(gi);
            if(g) g = (g + delta) & 0xFFFF;
          }
          if(g) set[c] = 1;
        }
      }
    } else if(best.fmt === 12){
      var groups = cmap.readUInt32BE(t + 12);
      for(i = 0; i < groups; i++){
        var go = t + 16 + i * 12;
        var s = cmap.readUInt32BE(go), e = cmap.readUInt32BE(go + 4);
        if(!cmap.readUInt32BE(go + 8)) continue;
        for(c = s; c <= e; c++) set[c] = 1;
      }
    } else throw new Error("unsupported cmap format " + best.fmt);
    return set;
  }

  /* What the shipped files actually need — literals AND \uXXXX escapes, which
     is the half section 106 could not see. */
  var need = {};
  ["index.html", "orders.txt", "llms.txt"].forEach(function(f){
    var fp = path.join(PUBLIC, f);
    if(!fs.existsSync(fp)) return;
    var t = fs.readFileSync(fp, "utf8"), i;
    for(i = 0; i < t.length; i++){ var c = t.codePointAt(i); if(c > 127) need[c] = 1; }
    (t.match(/\\u[0-9a-fA-F]{4}/g) || []).forEach(function(e){
      var c = parseInt(e.slice(2), 16); if(c > 127) need[c] = 1;
    });
  });
  var needed = Object.keys(need).map(Number).sort(function(a, b){ return a - b; });
  if(needed.length < 5){
    fail("section 116 found only " + needed.length + " non-ASCII characters in the " +
         "served files — the scan stopped seeing the page and is measuring nothing");
    return;
  }

  var manPath = path.join(__dirname, "font-subset.json");
  var man = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, "utf8")) : null;
  var dir = path.join(PUBLIC, "fonts");
  var faces = fs.readdirSync(dir).filter(function(f){ return /\.woff2$/.test(f); }).sort();
  if(!faces.length){ fail("no woff2 faces on disk to read"); return; }

  var checked = 0;
  faces.forEach(function(f){
    var cps;
    try { cps = codepointsOf(woff2Tables(fs.readFileSync(path.join(dir, f)))["cmap"]); }
    catch(e){
      fail("cannot read the cmap out of fonts/" + f + ": " + e.message +
           " — this section exists because comparing hashes to a manifest the " +
           "subset script wrote cannot see a lost glyph, and it has just lost " +
           "the ability to see one too");
      return;
    }
    checked++;
    var missing = needed.filter(function(c){ return !cps[c] && !SYSTEM_MARKS[c]; });
    if(missing.length){
      fail("fonts/" + f + " does not carry " + missing.length + " character(s) the " +
           "page renders: " + missing.map(function(c){
             return "U+" + c.toString(16).toUpperCase() + " (" + String.fromCodePoint(c) + ")";
           }).join(", ") + " — a subset that lost a glyph draws a blank box on " +
           "somebody else's device and nothing throws");
    }
    /* Staleness is judged against the SUBSET faces only, and the reason is
       worth writing down: limelight is not subset, so what it happens to carry
       is the foundry's decision rather than this project's. It carries U+203A
       and the five subset faces do not — which is exactly why the exception is
       "not carried by every face" rather than "carried by none". */
    if(man && man.files && man.files[f] && man.files[f].subset){
      Object.keys(SYSTEM_MARKS).forEach(function(k){
        if(cps[k]){
          fail("the subset face fonts/" + f + " now carries U+" +
               Number(k).toString(16).toUpperCase() + " (" + SYSTEM_MARKS[k] +
               "), which is recorded here as coming from the system font by " +
               "decision. The subset grew and the exception is stale — take it " +
               "out of SYSTEM_MARKS or take it out of the range");
        }
      });
    }
  });
  if(checked !== faces.length){ return; }

  note("font coverage: " + needed.length + " characters needed, " +
       (needed.length - Object.keys(SYSTEM_MARKS).length) + " carried by all " +
       checked + " faces, " + Object.keys(SYSTEM_MARKS).length +
       " from the system font by decision");
})();

/* ---------- 117. llms.txt says what the README says ------------------- */
/* THE SAME SENTENCE, KEPT IN TWO FILES, AND ONE COPY HAD ALREADY DRIFTED.
   README line 5 and llms.txt's summary block are the project's one-line
   description. The README's reads "every Batman story ever filmed — animated
   and live action — 133 films and 67 seasons of television across 44
   continuities". llms.txt's had the middle clause missing, and had been missing
   it long enough that nobody could say when it went.

   The dropped words are not decoration. Covering the animated work and the live
   action in one catalogue is among the rarest true things this project can say —
   "animated" appears 197 times in index.html and 4 in the README, and llms.txt,
   the file generative engines actually read, did not contain it once.

   Section 101 already guards llms.txt: the three counts and the canonical URL.
   Counts are what drifted in 1.8.3 so counts are what got a guard, and the
   sentence carrying them was never checked — the same shape as section 77
   reading the app while the README's paragraph about it rotted for four
   releases, which is what section 114 exists to stop.

   NOT A WORD BLOCKLIST, and not a demand that the two files match character for
   character. They are different documents for different readers and their
   wording is allowed to differ. What is asserted is that the CLAIM survives the
   copy: every load-bearing phrase in the README's canonical sentence appears in
   llms.txt's summary too. Reword either freely; drop a claim from one and this
   goes red. */

(function(){
  var lp = path.join(PUBLIC, "llms.txt");
  if(!fs.existsSync(lp)) return;   /* section 101 owns its absence */
  var lt = fs.readFileSync(lp, "utf8");

  /* The summary is the blockquote at the top — the part an engine quotes. */
  var summary = (lt.match(/^>[\s\S]*?(?=\n\n)/m) || [""])[0];
  if(!summary){
    fail("llms.txt has no “> ” summary block — it is the part a " +
         "generative engine quotes, and section 117 has nothing to compare");
    return;
  }
  /* Strip the "> " markers BEFORE folding whitespace. Folding first leaves
     them mid-sentence — "maps every > Batman story ever filmed" — and every
     phrase that happens to straddle a wrapped line reads as missing. */
  var flat = summary.replace(/^>[ \t]?/gm, "").replace(/\s+/g, " ");

  var canon = (README.match(/^A single-file web app mapping[^\n]*/m) || [""])[0];
  if(!canon){
    fail("the README's canonical one-line description is gone — it is what " +
         "llms.txt, the <meta> description and the landing page all restate, and " +
         "with it missing nothing can be checked against it");
    return;
  }

  /* Load-bearing phrases: what the sentence CLAIMS, not how it is written. */
  [["every Batman story ever filmed", "the completeness claim"],
   ["animated and live action",       "the both-media claim — the one that went missing"],
   ["spoil nothing",                  "the spoiler promise"]
  ].forEach(function(p){
    /* Both sides folded. The first draft folded only the haystack and went red
       on “every Batman story ever filmed” for the capital B — a check that
       fails on the text it was written from is worth one comment. */
    var needle = p[0].toLowerCase();
    if(canon.toLowerCase().indexOf(needle) < 0){
      fail("the README's canonical sentence no longer makes " + p[1] + " " +
           "(“" + p[0] + "”). If that is deliberate, this section's " +
           "list moves with it — rule and check change together");
      return;
    }
    if(flat.toLowerCase().indexOf(needle) < 0){
      fail("llms.txt's summary drops " + p[1] + " (“" + p[0] + "”) " +
           "that the README's canonical sentence makes. The two say the same " +
           "thing to different readers, and the engines read this one");
    }
  });

  note("llms.txt summary carries the README's claims: filmed, animated and live action, spoils nothing");
})();

/* ---------- 118. The 404 still reads over its own bat ----------------- */
/* SECTION 20 READS index.html ONLY, so nothing in this suite has ever measured
   a colour on the error page — and until 3.1.0 nothing needed to, because
   there was nothing behind the text. There is now.

   The arithmetic, not a screenshot. A screenshot of an error page is the one
   thing nobody looks at twice, and the failure mode here is gradual: somebody
   decides the mark is too faint, raises the opacity, and the page a reader
   meets when something is ALREADY broken becomes the least readable page on
   the origin. At .09 the h1 reads 14.6:1 and the body 6.7:1 against AA's 4.5,
   so there is a great deal of room — which is exactly why this needs a number
   rather than a judgement.

   A5, and it is the other half: `overflow:hidden` on <body> must not go in. A
   position:fixed box contributes nothing to document overflow, so it buys
   nothing, and section 110's whole argument is that this page can be
   pinch-zoomed. */

(function(){
  var fp = path.join(PUBLIC, "404.html");
  if(!fs.existsSync(fp)){ fail("docs/404.html is missing — section 101 says so too"); return; }
  var src = fs.readFileSync(fp, "utf8");

  function rule(sel){
    var m = src.match(new RegExp("(^|[\n}])\\s*" +
      sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{([^}]*)\\}"));
    return m ? m[2] : null;
  }
  var body = rule("body"), bat = rule(".bat"), para = rule("p");
  if(!body || !bat){ fail("404.html has no body or .bat rule — the bat cannot be measured"); return; }

  var bg = (body.match(/background:\s*(#[0-9A-Fa-f]{6})/) || [])[1];
  var h1 = (body.match(/color:\s*(#[0-9A-Fa-f]{6})/) || [])[1];
  var pc = (String(para || "").match(/color:\s*(#[0-9A-Fa-f]{6})/) || [])[1];
  var op = parseFloat((bat.match(/opacity:\s*([\d.]+)/) || [])[1]);
  var fill = (src.match(/<svg class="bat"[\s\S]*?fill="(#[0-9A-Fa-f]{6})"/) || [])[1];

  if(!bg || !h1 || !pc || !fill || !(op >= 0)){
    fail("cannot read the 404's page colour, text colours, bat fill or bat opacity — " +
         "this section is measuring nothing and would report green forever");
    return;
  }

  var eff = "#";
  for(var i = 0; i < 3; i++){
    var b = parseInt(bg.substr(1 + i * 2, 2), 16);
    var f = parseInt(fill.substr(1 + i * 2, 2), 16);
    var v = Math.round(b + (f - b) * op);
    eff += (v < 16 ? "0" : "") + v.toString(16);
  }

  [[h1, "the heading"], [pc, "the sentence"]].forEach(function(t){
    var r = contrast(t[0], eff);
    if(r < 4.5){
      fail("the 404's bat at opacity " + op + " puts " + t[1] + " (" + t[0] + ") at " +
           r.toFixed(2) + ":1 over the lit background (" + eff + ") — under the 4.5:1 " +
           "AA floor. This is the page somebody reaches when something is already " +
           "broken; it does not get to be the hardest one to read");
    }
  });

  if(/overflow:\s*hidden/.test(body)){
    fail("404.html clips its own body — a position:fixed mark contributes nothing " +
         "to document overflow, so this buys nothing and costs the pinch-zoom " +
         "section 110 exists to protect");
  }

  note("404 bat: " + fill + " at " + op + " over " + bg + " = " + eff + "; heading " +
       contrast(h1, eff).toFixed(2) + ":1, sentence " + contrast(pc, eff).toFixed(2) + ":1");
})();

/* ---------- 119. Where to watch has a rank of its own ----------------- */
/* THE README'S FEATURE LIST LEADS WITH IT — "Where to watch, without picking a
   side" — and introBlock() promises every first-time reader "Tap anything for
   what it is and where to watch it." It shipped as the fainter of two
   identical pills: `.lnk` and `.act` were the same rule twice, differing only
   in text colour, at 5.08:1 against .act's 5.87.

   IT WAS CALLED SECONDARY ONCE, FOR A REASON THAT WAS NOT ABOUT ITS
   IMPORTANCE. At 10px with .1em tracking the label needed ~112px and the hero's
   38% column gave 96px, so it wrapped; the label was shrunk and "it is a
   secondary control anyway" was the justification. That justification went into
   NOTES.md and the CHANGELOG, where it read as a considered statement about the
   feature. It was a layout constraint promoted to a rule of the design. Both
   notes are corrected in 3.1.0.

   AND THE NOTE CLAIMED AN ALIGNMENT THAT WAS NEVER TRUE — "it only has to share
   Skip's edges, not its weight." Measured at 375px: the hero pill stopped 8.0px
   short of Skip's right edge, stood 38px against Skip's 46, cornered at 8px
   against 11, and in an expanded row sat 171.7px right of the description, the
   tick indent and both buttons. The left edge in the hero was perfect, which is
   what let it survive eleven releases: the one edge anybody would check was
   right, and a faint outline stopping early against a faint outline is not
   something an eye finds. The fill did not cause any of it. It stopped hiding
   it.

   A decision worth keeping becomes a guard, not a document. Every assertion
   here is read from the two rules that have to agree, never from a remembered
   pair of numbers. The contrast arithmetic is section 20's — one intention,
   one place — and this section holds the pairing that keeps it able to see. */

(function(){
  function rules(sel){
    var out = [], re = new RegExp("(^|[\n}])\\s*" +
      sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{([^}]*)\\}", "g"), m;
    while((m = re.exec(HTML))) out.push(m[2]);
    return out;
  }
  function one(sel){ var r = rules(sel); return r.length ? r[0] : null; }

  var lnk = one(".lnk"), act = one(".act"),
      hlnk = one(".herorow .lnk"), skip = one(".heroacts button"),
      linkrow = one(".linkrow"), hlinkrows = rules(".herorow .linkrow");

  if(!lnk || !act || !hlnk || !skip || !linkrow){
    fail("one of .lnk, .act, .herorow .lnk, .heroacts button or .linkrow is gone — " +
         "the watch link's rank cannot be read");
    return;
  }

  /* RANK, and the assertion is deliberately not "the two rules differ". They
     always differed — in white-space, display, align-items, text-decoration —
     so a difference count would have passed on the shipped defect. What was
     missing is the two things an eye reads as rank: a fill, and an edge of its
     own. Both are named. */
  if(!/background:\s*rgba?\(/.test(lnk)){
    fail("the watch link has no fill of its own — it is styled as one of the " +
         "secondary pills again, and the README's feature list leads with " +
         '"Where to watch, without picking a side". A control the README sells ' +
         "and the intro promises is not a secondary control");
  }
  if(/background:/.test(act)){
    fail(".act has grown a fill — the watch link's rank is bought by being the " +
         "one pill in the row that has one, and that stops being true here");
  }
  var lb = (lnk.match(/border:\s*1px solid var\(--([a-z0-9]+)\)/) || [])[1];
  var ab = (act.match(/border:\s*1px solid var\(--([a-z0-9]+)\)/) || [])[1];
  if(!lb || lb === ab){
    fail("the watch link and .act share an edge colour (--" + (lb || "?") + ") — " +
         "before 3.1.0 the only difference between the two rules was a text " +
         "colour, which is how the one control that leaves the app became the " +
         "quietest thing in the panel");
  }

  /* The pairing section 20 depends on. Rewrite the fill into a form its regex
     cannot read and the AA measurement silently stops happening. */
  if(!/background:\s*rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/.test(lnk) ||
     !/(?:^|[;{])color:\s*var\(--[a-z0-9]+\)/.test(lnk)){
    fail("the watch link's fill is not a plain rgba() or its label is not a " +
         "var() token — section 20 blends the two to check the label clears AA, " +
         "and in any other form it measures nothing and reports green");
  }

  /* S1b — the hero pill and Skip, read from both rules rather than remembered. */
  function px(rule, prop){
    var m = String(rule).match(new RegExp(prop + ":\\s*(\\d+)px"));
    return m ? m[1] : null;
  }
  ["min-height", "border-radius"].forEach(function(prop){
    var a = px(hlnk, prop), b = px(skip, prop);
    if(!a || !b || a !== b){
      fail("the hero watch link declares " + prop + ":" + (a || "nothing") +
           " and Skip declares " + (b || "nothing") + " — the note says the link " +
           "shares Skip's edges, and for eleven releases it did not");
    }
  });
  if(!/flex:\s*1/.test(hlnk)){
    fail("the hero watch link is content-sized again — it must fill its column " +
         "(flex:1) or its right edge drifts back off Skip's, which is the 8px " +
         "nobody found because the left edge was perfect");
  }

  /* S1b — the expanded row. The description, the tick indent and both buttons
     all sit on the 42px line; the link sat 171.7px to the right of them. */
  if(!/justify-content:\s*flex-start/.test(linkrow)){
    fail(".linkrow does not justify to the start — the watch link leaves the " +
         "line every other thing in a detail block sits on");
  }
  hlinkrows.forEach(function(r){
    if(/justify-content/.test(r)){
      fail(".herorow .linkrow re-declares justify-content — the base rule already " +
           "says it. Two copies of one intention is how they drift, and this " +
           "override existed only because the base rule disagreed");
    }
  });

  note("watch link rank: own fill and edge, hero pill matches Skip at " +
       px(skip, "min-height") + "px/" + px(skip, "border-radius") + "px, linkrow starts");
})();

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
