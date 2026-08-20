#!/usr/bin/env node
/* Night Watcher build guards.  node qa/guards.js [--bless]

   Exits 1 on any failure. Functions under test are EXTRACTED from
   docs/index.html and evaluated, never reimplemented here — a copy drifts
   from the app and quietly stops testing it. Extraction is AST-based since
   4.2.4 (Acorn, dev-only — the served page keeps zero runtime deps); with
   no node_modules this file still runs, on the legacy regex matcher, with
   a warning that says exactly that.
   Every guard section is negative-tested: made to fail on purpose before it is
   trusted. Section 138 asserts that on every run rather than asking to be
   believed \u2014 it maps each fixture's expected failure back to the section that
   produces it and fails on a section with none. The claim stood here unchecked
   from 1.6.x until 3.9.2, when a mapping found 32 sections without a fixture. */
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

/* 3.7.2, H-2 of the 10 Aug review: FIVE WRITERS, ONE STALE STRING. Every
   index.html bless writer used to call fs.writeFileSync with a replacement
   made from the HTML string read once at startup — so the SECOND write in a
   run reverted the first. Reproduced both ways: corrupt the ItemList and the
   FAQPage together and one `npm run bless` printed "rewrote" twice, exited 0,
   and left the tree red; any data edit plus bless reverted the CSP-hash fix,
   so guards failed with "Fix with: npm run bless" immediately after bless had
   run. Bless required an undocumented run-until-fixed-point loop.

   blessHtml() threads the mutated string through: it updates HTML and writes
   the same bytes, so every later section — check and writer alike — operates
   on what is actually on disk. The report at the bottom re-runs the whole
   check pass in a child process after a clean bless, so bless exiting 0 means
   the tree it LEFT is green, not the tree it started from. */
function blessHtml(next){
  HTML = next;
  fs.writeFileSync(path.join(PUBLIC, "index.html"), next, "utf8");
}

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
     77   The move offer stays retired
     72   Every shareable route token still routes
     73   The worst-case restore link cannot get longer
     19   Rating writes go through the clamp
     21   A blocked store has to say so
     35   The log holds one entry per id
     111  Watched and skipped are never both true
     50   Rating and progress stay separate
     87   A backup carries progress, not settings
     126  A restored path cannot reach the prototype chain
     127  A failed read stops the writes, a failed write does not
     134  A removal is a fact with a clock, not a hole
     142  A backup is stamped only when a copy left
     102  A tick burst writes once, and leaving flushes
     103  The tick repaints one row, and cannot drift

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

     121  The privacy footer says what the README says

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
     128  The Belt parks as the peek, and the peek tells the truth
     129  The Belt drops in place, and leaves the way it came
     130  The Belt toasts down, stacks tight, and is the peek once chosen
     131  The install seat, and the two watching-truths
     146  The hero wears the cut
     148  The cut is rank, and everyone else stands square

     120  The page does not read layout after writing it
     122  The scroll restore survives content-visibility
     124  Every face is asked for before the CSS finds it
     143  Four panels, one live, the rest kept warm

   ACCESSIBILITY
     123  Focus restores never move the viewport
     20   Text contrast against the surface it sits on
     147  The surfaces keep their order
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
     82   No CNAME file, ever
     83   The manifest id is an identity, not a path
     46   The README states the real weight
     132  The offline promise is executed, not grepped
     144  The wrangler state stays out of the index

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
     104  The security headers the tree owns
     135  The auth.md H1 carries its own name
     136  One origin, one binding, in the file
     137  The 3.9.2 storage and header fixes stay fixed
     138  The negative coverage map, and what it still owes
     139  The files an agent reads answer fresh
     140  The disclosure channel is a file, and it has not expired
     105  The catalogue answers in plain text
     141  The two orderings are named once, and shared
     133  The root negotiates markdown, and only the root
     125  robots.txt states a position on AI use
     106  The fonts carry every letter the catalogue uses
     116  The fonts really carry what the page really renders
     107  Every section can fail, and every section runs
     108  The 2.7.1 soak notes stay fixed

   META
     65   The file points at where its reasoning went
     66   The guards are navigable
     113  Every negative suite runs in CI
     145  Every top-level function is a declaration the extractor can see

   Sections are numbered in file order. Groups are for finding things;
   they do not affect what runs. Guard 66 enforces the numbering, that every
   section listed here has an assertion under it, and that no group is empty
   or named twice.
*/


var fails = [], warns = [], notes = [];
/* 4.2.3, Q-3 of the 19 Aug audit: EVERY FAILURE NOW NAMES ITS SECTION.
   run_case only ever required the expected string to appear SOMEWHERE in a
   red run's output — a mutation that also broke three unrelated sections
   still PASSED if the phrase sat anywhere in the dump, so 825/825 was never
   proof that the named section fired. Section 138's substring map is the
   paper over that hole and says of itself that it is approximate in both
   directions. Failures now print as "✗ §NN message": the section number is
   read off the call stack against this file's own header lines, so no call
   site changes, nothing is hand-maintained, and run_case's optional sect
   argument can require the match to sit on the named section's own line.
   A fail() from the shared helpers above section 1 keeps walking the stack
   until it lands in a numbered section; one that never does prints bare. */
var SECTLINES = null;
function sectOfLine(line){
  if(!SECTLINES){
    SECTLINES = [];
    fs.readFileSync(__filename, "utf8").split("\n").forEach(function(l, i){
      var m = l.match(/^\/\* -{3,} (\d+)\./);
      if(m) SECTLINES.push([i + 1, parseInt(m[1], 10)]);
    });
  }
  var s = 0;
  for(var k = 0; k < SECTLINES.length && SECTLINES[k][0] < line; k++) s = SECTLINES[k][1];
  return s;
}
function sectOf(){
  var frames = String(new Error().stack).split("\n");
  for(var j = 2; j < frames.length; j++){
    var mm = frames[j].match(/guards\.js:(\d+):\d+/);
    if(!mm) continue;
    var s = sectOfLine(parseInt(mm[1], 10));
    if(s) return s;
  }
  return 0;
}
function fail(m){ var s = sectOf(); fails.push(s ? "§" + s + " " + m : m); }

/* 4.2.4, the other half of "a fail(), not a stack trace" (H-10 / Q-fn):
   this file is a straight-line script, so an exception in section 7 used to
   skip the report entirely — every failure already collected, including the
   readable one explaining the crash, died unprinted, and the reader got a
   bare stack. A required extract that goes missing now stubs and fails
   readably (see fn() below), but the section driving the stub may still
   throw on what it can no longer do — and that throw must not eat the
   report. The crash prints as one more §-attributed failure after
   everything already collected, and the run exits red. */
process.on("uncaughtException", function(e){
  var line = parseInt((String(e && e.stack).match(/guards\.js:(\d+):\d+/) || [])[1] || "0", 10);
  var s = line ? sectOfLine(line) : 0;
  console.log("\n" + (fails.length + 1) + " FAILURE" + (fails.length ? "S" : "") + ":");
  fails.forEach(function(m){ console.log("  ✗ " + m); });
  console.log("  ✗ " + (s ? "§" + s + " " : "") + "the run crashed mid-file and " +
              "the sections after it never ran — " +
              String((e && e.message) || e).slice(0, 200) +
              (line ? " (guards.js:" + line + ")" : ""));
  console.log("");
  process.exit(1);
});
function warn(m){ warns.push(m); }
function note(m){ notes.push(m); }

/* 3.7.2 (L-7 of the 10 Aug review): the two "every section can fail" censuses
   in sections 66 and 107 counted `fail(` wherever it appeared — including
   inside block comments, which in this file routinely QUOTE fail(...) while
   narrating a fix. A section whose assertions were commented out still
   satisfied both meta-guards. They now look at the code with the block
   comments stripped, so a quoted fail() is prose again. Line comments are
   left alone on purpose: `//` appears inside URL strings throughout this
   file, and a stripper that eats those rewrites code rather than comments. */
function stripBlockComments(src){
  return String(src).replace(/\/\*[\s\S]*?\*\//g, "");
}

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
/* 4.2.4, Q-fn of the 19 Aug re-audit: EXTRACTION IS A PARSER NOW, NOT A
   REGEX. The old fn() was a non-greedy brace matcher that only worked
   because top-level functions close at column 0 and inners indent \u2014 a
   nested `function foo(){\n}` at column 0, a default parameter containing
   ")", or a one-line function truncated the extract (loud) or ran a prefix
   of it (quiet). optionalFn existed because throws used to abort the run
   and silence every later section. The founding claim at the top of this
   file \u2014 "extracted, never reimplemented" \u2014 rested on that regex.

   Acorn (dev-only, same tree as jsdom and Playwright; the PAGE keeps zero
   runtime deps) parses the inline script once and indexes every top-level
   FunctionDeclaration by name. An extract is the AST node's exact source
   slice \u2014 balanced by construction, whatever the formatting. The flatten
   pin in section 70 was the model: a checkable relationship, not a memoir.

   A missing REQUIRED extract is a readable fail() plus a stub \u2014 the
   sections that drive it then fail on what it can no longer do \u2014 never a
   stack trace (H-10 of the morning report). Without node_modules this file
   still runs: it warns once and falls back to the legacy regex matcher,
   so a bare clone keeps a working (if weaker) guard set; CI and any tree
   that can run smoke always have the parser. */
var FN_INDEX = null;   /* null until built; false = acorn unavailable */
var FN_VARSHAPE = null; /* null until the parser runs; then names of
                           top-level function-valued vars (section 145) */
function fnIndex(){
  if(FN_INDEX !== null) return FN_INDEX;
  var acorn = null;
  try { acorn = require("acorn"); } catch(e){}
  /* ALL bare <script> blocks, concatenated — the browser runs them as one
     shared global scope, and section 43's block census is the guard that
     keeps their number honest. Scoping this to the first block would let a
     script planted above the app blind every extraction below (negtest300
     plants exactly that). */
  var script = (HTML.match(/<script>[\s\S]*?<\/script>/g) || [])
    .map(function(b){ return b.slice("<script>".length, -"</script>".length); })
    .join("\n;\n");
  if(!acorn || !script){
    if(!acorn && process.env.CI){
      /* 4.2.5, Q-fn2: same lesson smoke's jsdom skip taught in 3.0.2 \u2014 a
         broken `npm ci` must not silently downgrade every extraction to
         the weaker matcher and stay green. Local clones may run bare;
         CI may not. */
      fail("acorn is not installed and this is CI \u2014 every extraction below " +
           "would silently downgrade to the legacy regex, and a downgraded " +
           "parser is not a passing parser");
    }
    else if(!acorn) warn("acorn is not installed (npm ci) \u2014 function extraction is " +
                    "running on the legacy regex matcher, which truncates on " +
                    "formatting the parser handles");
    else fail("the inline <script> block is gone from index.html \u2014 there is " +
              "nothing to extract functions from");
    return (FN_INDEX = false);
  }
  var ast;
  try { ast = acorn.parse(script, {ecmaVersion: "latest"}); }
  catch(e){
    fail("index.html's inline script does not parse: " +
         String(e.message || e).slice(0, 140) + " \u2014 the app would not run, " +
         "and every extraction below is running on the legacy regex");
    return (FN_INDEX = false);
  }
  FN_INDEX = Object.create(null);
  FN_VARSHAPE = [];
  ast.body.forEach(function(node){
    if(node.type === "FunctionDeclaration" && node.id && node.id.name){
      /* last declaration wins, same as the runtime it is standing in for */
      FN_INDEX[node.id.name] = script.slice(node.start, node.end);
    }
    /* 4.2.5: section 145 pins the shape. A top-level function written as a
       variable assignment is invisible to the index above — recorded here,
       refused there. */
    if(node.type === "VariableDeclaration"){
      node.declarations.forEach(function(d){
        if(d.init && d.id && d.id.name &&
           (d.init.type === "FunctionExpression" ||
            d.init.type === "ArrowFunctionExpression")){
          FN_VARSHAPE.push(d.id.name);
        }
      });
    }
  });
  return FN_INDEX;
}
function fnRegexLegacy(name){
  var re = new RegExp("function\\s+" + name + "\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}", "m");
  var m = HTML.match(re);
  return m ? m[0] : null;
}
function optionalFn(name, why){
  var idx = fnIndex();
  var src = idx ? idx[name] : fnRegexLegacy(name);
  if(!src){
    fail(name + "() is gone" + (why ? " \u2014 " + why : ""));
    return "function " + name + "(){ return undefined; }";
  }
  return src;
}
function fn(name){
  var idx = fnIndex();
  var src = idx ? idx[name] : fnRegexLegacy(name);
  if(!src){
    fail("cannot locate function " + name + "() in index.html \u2014 a required " +
         "extract is missing, so every section that drives it is now running " +
         "against a stub that returns undefined");
    return "function " + name + "(){ return undefined; }";
  }
  return src;
}
/* For the call sites that treat absence as THEIR OWN finding (a warn, or a
   differently-worded fail). fn() used to throw, and three sections caught
   that throw to speak in their own voice; fn() no longer throws, so they
   ask first instead. */
function hasFn(name){
  var idx = fnIndex();
  return idx ? !!idx[name] : !!fnRegexLegacy(name);
}

var sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  slice("var PATH = [", "var MODENOTE") + "\n" +
  /* MODENOTE became the single source for path copy in 1.3.9, so the sandbox
     needs it to check the chooser derives from the same string. */
  slice("var MODENOTE = {", "var PATHS = [") + "\n" +
  slice("var PATHS = [", "function isPath") + "\n" +
  fn("idHash") + "\n" + fn("tierOf") + "\n" + fn("clampRating") + "\n" + fn("isPath") + "\n" +
  /* 3.9.6: the app's own two comparators, so section 105 can publish the
     orderings it used to decline to publish. They are extracted, never
     rewritten — the whole reason they were given names in index.html. */
  fn("lifeCmp") + "\n" + fn("releaseCmp") + "\n",
  sandbox
);

var PATH = sandbox.PATH, ERAS = sandbox.ERAS, DECADES = sandbox.DECADES, BADGE = sandbox.BADGE;
var lifeCmp = sandbox.lifeCmp, releaseCmp = sandbox.releaseCmp;
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
     "the thing. Everything else is optional side material, labelled as exactly that."],
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
    ["Will my progress still be here later — on another device, or if I clear my browser?",
     "In this browser, yes — what you tick is saved locally and waiting when you come " +
     "back. It does not travel to other browsers or devices, and clearing this browser’s " +
     "data clears it, because nothing is ever kept on a server. Progress carries a code you " +
     "can copy from the Progress tab and paste into another browser to move it or keep a backup."],
    ["Is there an app, an account, or an API?",
     "No account and no sign-in — nothing to register and nothing to log into. It is one " +
     "web page that runs entirely in your browser, and you can install it to your home screen " +
     "like an app. There is no API; every page and file the site serves is public and identical " +
     "for everyone."],
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

/* Flatten exactly as index.html does — and 4.2.3 makes "exactly" checkable.
   Q-1 of the 19 Aug audit: this copy carried out:(f.out||"") that the app
   never puts on FILMS, and dropped the d: the app carries — so section 70
   asserted f.out on an object the page never builds, and the founding claim
   ("extracted, never reimplemented") was already false one screen down from
   where it is made. The field list below is byte-compared against the app's
   own FILMS.push in section 70; out: stays on the RAW PATH entries, which is
   where the app reads it too. */
var FILMS = [];
PATH.forEach(function(g, gi){
  g.films.forEach(function(f, fx){
    FILMS.push({id:f.i, gi:gi, ix:fx, gn:g.n, gname:g.name, fmt:(f.fmt || g.fmt || "anim"),
                t:f.t, sub:f.sub||"", ep:f.ep||0, tv:(f.k==="tv"),
                y:f.y, d:f.d, e:(f.e||0), lo:(f.lo||0), r:f.r||"", b:f.b||[], o:!!f.o});
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
  /* 3.7.2, H-1 of the 10 Aug review: THE DIFF RUNS BEFORE THE WRITE, IN BLESS
     TOO. Until now the frozen-ID comparison lived only in the non-bless branch,
     and this branch rewrote the snapshot unconditionally — so deleting an entry
     and running `npm run bless` produced no failure, a snapshot that no longer
     carried the ID, and no later run that could ever ask for a retired-ids.json
     entry. That is precisely the laundering the comment at the top of this
     section says blessing must not be able to do. Bless now refuses: an ID may
     only leave the snapshot through qa/retired-ids.json or qa/renamed-ids.json,
     which is a diff a reviewer reads. */
  var laundered = [];
  if(fs.existsSync(SNAP)){
    JSON.parse(fs.readFileSync(SNAP, "utf8")).forEach(function(fi){
      if(filmIds.indexOf(fi) < 0 && !RETIRED[fi] && !RENAMED[fi] &&
         PREFREEZE.indexOf(fi) < 0){
        laundered.push(fi);
      }
    });
  }
  if(laundered.length){
    fail("FROZEN ID REMOVED OR RENAMED: " + laundered.join(", ") +
         " — bless refuses to launder a retirement. Saved progress and " +
         "backup codes in circulation still point at this slug, so removal is " +
         "recorded, never silent: write it into qa/retired-ids.json (or " +
         "qa/renamed-ids.json) with a reason, then bless. The snapshot was " +
         "left untouched");
  } else {
    fs.writeFileSync(SNAP, JSON.stringify(filmIds, null, 1) + "\n");
    note("blessed frozen-ids.json with " + filmIds.length + " ids");
  }
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

/* ---------- idHash is memoised, and the memo proves itself --------------- */
/* Profiled 6 Aug 2026 with --cpu-prof: idHash was 34% of this file's entire
   runtime -- 147.9 ms of 432 -- for 201 distinct answers. It was called 24,339
   times, because importCode() rebuilds its whole {hash: id} map on every call
   and section 3's truncation sweep walks a backup code down one character at a
   time, calling importCode about 117 times. 117 x 201 is the number.

   Nothing was wrong. That is the app's own function, extracted and driven
   honestly, being asked the same pure question twenty-four thousand times.

   This wraps the EXTRACTED function. It is still idHash out of index.html,
   still never reimplemented -- it is only asked less. Measured 390 ms -> 255 ms
   with byte-identical output.

   The memo is sound only while idHash is pure, so that is checked here against
   the real id set rather than assumed. A future edit that gives it state fails
   on the release that does it, instead of quietly serving a stale hash. */

(function(){
  var real = sandbox.idHash, memo = Object.create(null);
  sandbox.idHash = function(id){
    var v = memo[id];
    return v !== undefined ? v : (memo[id] = real(id));
  };
  var drift = 0;
  FILMS.forEach(function(f){
    if(real(f.id) !== real(f.id) || sandbox.idHash(f.id) !== real(f.id)) drift++;
  });
  if(drift){
    fail("idHash is not pure \u2014 " + drift + " of " + FILMS.length + " ids hash " +
         "differently on a second call, so the memo would serve stale values. " +
         "Remove the memo, or fix what gave the function state");
  }
  note("idHash memoised: " + FILMS.length + " distinct ids, purity verified");
})();

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

/* A generated sweep over the same parser, because the cases above are the ones
   somebody thought of. Every fixture in section 8 is a hand-written mutation of
   one code; the truncation sweep is already a property test over exactly one
   axis, which is the argument for generating the others rather than against it.

   Deterministic on purpose -- a seeded LCG, no Math.random(). A generator that
   finds a defect on one run and not the next is a rumour, and this file's whole
   contract is that a red build is reproducible. Seed and case are printed with
   any failure so a report is re-runnable by hand.

   The invariant is narrow and total: importCode() must never throw, and
   whatever it returns must never invent an id the catalogue does not have.
   Restoring less than was written is allowed -- that is the forward tolerance
   sections 7 and 8 exist to protect. Restoring something that was never there
   is the failure this cannot express in a hand-written fixture, because you
   would have to guess the input that produces it. */

(function(){
  var seed = 20260806, CASES = 240;
  function rnd(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  function pick(a){ return a[Math.floor(rnd() * a.length) % a.length]; }

  var real = Object.create(null);
  FILMS.forEach(function(f){ real[f.id] = 1; });
  var ALPHA = "0123456789abcdefghijklmnopqrstuvwxyz";
  var HEADS = ["NW1", "NW2", "NW3", "NW9", "NW0", "nw3", "NW", ""];
  var SEGS  = ["W", "S", "R", "O", "P", "X", "Z", "QQ"];

  var bad = 0, threw = 0, firstBad = "";
  for(var c = 0; c < CASES; c++){
    var body = pick(HEADS);
    var parts = 1 + Math.floor(rnd() * 5);
    for(var q = 0; q < parts; q++){
      body += pick(SEGS);
      var runLen = Math.floor(rnd() * 14);
      for(var r = 0; r < runLen; r++){
        /* Half real hashes, half noise: a code made only of garbage never
           reaches the branches that resolve an id. */
        body += rnd() < 0.5 ? idHash(pick(FILMS).id) : pick(ALPHA.split(""));
      }
    }
    if(rnd() < 0.35) body = body.slice(0, Math.max(0, body.length - Math.floor(rnd() * 9)));
    var res;
    try { res = importCode(body); }
    catch(e){
      threw++;
      if(!firstBad) firstBad = "threw " + e.name + " on \"" + body + "\"";
      continue;
    }
    if(!res) continue;
    /* skipped joined the sweep in 3.7.2 (L-5 of the 10 Aug review): importCode
       populates three containers, and a fuzz that reads two of them lets a
       parser defect invent ids into the third without going red. */
    var invented = Object.keys(res.watched || {}).concat(Object.keys(res.rated || {}))
                     .concat(Object.keys(res.skipped || {}))
                     .filter(function(id){ return !real[id]; });
    if(invented.length){
      bad++;
      if(!firstBad) firstBad = "restored " + JSON.stringify(invented.slice(0, 3)) +
                               " from \"" + body + "\"";
    }
  }

  if(threw){
    fail("importCode() threw on " + threw + " of " + CASES + " generated codes \u2014 " +
         "a pasted or truncated code must be refused, never crash the restore. " +
         "seed " + 20260806 + ", first: " + firstBad);
  }
  if(bad){
    fail("importCode() restored " + bad + " entr" + (bad === 1 ? "y" : "ies") +
         " the catalogue does not contain, out of " + CASES + " generated codes " +
         "\u2014 a code can lose progress, it may never invent it. seed " + 20260806 +
         ", first: " + firstBad);
  }
  note("generated codes: " + CASES + " parsed, none threw, none invented an id (seed 20260806)");
})();

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

/* 3.9.2: WIDENED, because --bless would launder foreign code straight past
   this. Reproduced in the 14 Aug review: append a minified blob inside the
   app's one <script>, run --bless, and the CSP hash is re-computed around it
   \u2014 full suite green. The check was two historical signatures, so the only
   real backstops were the human diff and the weight headroom.

   The list below will always be behind whatever arrives next; that is what the
   bless summary is for: since 4.0.1 every CSP re-hash prints the script's byte
   size and its delta against the last blessed size (qa/script-bytes.json). A
   pattern set is a filter; a printed size jump is a reader. */
var VENDOR_MARKS = [
  [/qrcode-generator/,                         "qrcode-generator"],
  [/\(c\) [A-Z][a-z]+ [A-Z][a-z]+ \| MIT/,        "an MIT attribution header"],
  [/\/\*!/,                                     "a /*! banner comment"],
  [/sourceMappingURL/,                         "a sourceMappingURL"],
  [/webpack/,                                  "a webpack marker"],
  [/__esModule/,                               "an __esModule marker"],
  [/module\.exports/,                          "a module.exports"],
  [/define\.amd/,                              "an AMD define"],
  [/[;}]\s*!function\s*\(/,                     "a !function bundler wrapper"],
  [/function\s*\(\s*[a-z]\s*,\s*[a-z]\s*,\s*[a-z]\s*,\s*[a-z]\s*[,)]/,
                                               "a run of minified single-letter parameters"]
];
VENDOR_MARKS.forEach(function(pair){
  var hit = HTML.match(pair[0]);
  if(hit){
    fail("vendored third-party code is back in index.html \u2014 " + pair[1] +
         " (" + String(hit[0]).slice(0, 40) + ") \u2014 the app ships one inline " +
         "script that is ours, and bless will re-hash whatever is inside it");
  }
});

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
                     "orders.txt",
                     /* 3.3.0. Browser chrome: the app never renders it, so
                        nothing about working offline depends on it, and a
                        visitor who is offline already has the tab open. */
                     "favicon.ico",
                     /* 3.7.2. The rest of the icon set — the tab-size PNGs,
                        the iOS home-screen icon and the Windows tile. Browser
                        and OS chrome, same reasoning as favicon.ico: the app
                        never renders them, nothing about working offline
                        depends on them, and a visitor who is offline already
                        has the tab open (or the home-screen icon installed). */
                     "favicon-16x16.png", "favicon-32x32.png",
                     "favicon-48x48.png", "apple-touch-icon.png",
                     "mstile-144x144.png",
                     /* 3.4.0. The IndexNow key. Fetched by search engines to
                        prove this host controls the key it submits under, and
                        by nothing else -- the app never reads it, and a reader
                        who is offline has no use for it. Same reasoning as
                        llms.txt and orders.txt: written for machines that never
                        run the app. */
                     "3e6082eed9f040d5bc8ab07531bf58b9.txt",
                     /* 3.8.4. The no-auth statement for agents. Cloudflare's
                        Agent Readiness panel wants an auth.md telling bots how
                        to register; Night Watcher's answer is that no accounts
                        exist, by design, and this file says exactly that.
                        Written for machines that never run the app, same
                        reasoning as llms.txt and orders.txt. */
                     "auth.md",
                     /* 3.9.5. The disclosure pointer. Read by scanners and by
                        a researcher who has already found something, neither
                        of which runs the service worker — and it is the one
                        file in this tree that goes stale on a date rather than
                        on an edit, so an offline copy of it is a copy that can
                        outlive its own Expires with nothing to say so. Section
                        140 keeps the live one honest; the shell stays out of
                        it. Same reasoning as llms.txt and orders.txt. */
                     ".well-known/security.txt",
                     /* 4.0.4. The Brave Creators verification token. Fetched
                        once (and re-checked occasionally) by Brave's publisher
                        service to prove this host is claimed by its owner, and
                        by nothing else — the app never reads it, and its exact
                        name and bytes are Brave's contract, not this repo's.
                        Written for a machine that never runs the app, same
                        reasoning as the IndexNow key. */
                     ".well-known/brave-rewards-verification.txt",
                     /* 4.0.7. The viewport probe. Five height units, one
                        painted stripe each, and the numbers iOS actually
                        grants — the instrument for the standalone bottom-band
                        question, because the two documented failure modes
                        (stale short grant vs true short render) prescribe
                        OPPOSITE fixes and three releases have now guessed.
                        Owner-facing, reached by typing the URL once and
                        adding to the home screen; the app never links it,
                        never reads it, and an offline copy of a measuring
                        instrument is a contradiction — it must answer for
                        the wire it rode in on. Delete the exclusion with the
                        file once the question is closed. */
                     "vp.html"];
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
      fail(t[0] + " claims " + got[1] + " " + c[2] + ", data has " + c[1] +
           " \u2014 the head is the copy a search engine quotes, and it is the one " +
           "surface nobody reading the page can see is wrong");
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
   reserved gutter the centred column slides ~7.5px sideways. The gutter has
   followed the scroll twice now: it sat on html while the document scrolled,
   rode along through 3.9.7 (#app clipped inside html, so html's reservation
   still framed the one scroller), and in 4.0.0 it belongs to the scrollers
   themselves — each panel reserves it whether or not it overflows, so Next
   up's column agrees with The path's, which is this section's original
   defect one level down. On html it is now a dead 15px column at the window
   edge that pushes every panel's scrollbar inboard. */

if(!/main,\.panel\{scrollbar-gutter:\s*stable both-edges;\}/.test(HTML)){
  fail("the scrollers are missing scrollbar-gutter:stable both-edges — " +
       "stable alone reserves the gutter on one side, so a panel's column " +
       "centres against (viewport - scrollbar) while the header-anchored " +
       "#beltpeek centres against the viewport: 7.5px of daylight between " +
       "the peek and the strip it rides home to, on any desktop with " +
       "classic scrollbars (measured 4.0.6). both-edges reserves the " +
       "gutter symmetrically and the two centres agree again — and the " +
       "original defect stays fixed, because a short panel still reserves " +
       "what its scrolling neighbors do");
}
if(/html\{[^}]*scrollbar-gutter/.test(HTML)){
  fail("html carries scrollbar-gutter again — the document is clipped and " +
       "the panels own the scrollbars, so a gutter on html is a dead 15px " +
       "column at the window edge with every real scrollbar sitting " +
       "inboard of it");
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

/* Tokens allowed the 3:1 UI-component floor instead of 4.5:1 -- and the exact
   rules allowed to use them as a text colour. A rule not named here that draws
   text in one of these tokens is prose wearing a shape's exemption. */
var UI_EXEMPT = {
  line:    [],
  line2:   [],
  staroff: [".stars button"]   /* the unfilled star: a glyph, not a sentence */
};

/* WHICH RULES ACTUALLY DRAW TEXT IN AN EXEMPTED TOKEN. Read from the stylesheet
   with the same strict pattern the ink sweep uses, so "text-decoration-color"
   and friends cannot be mistaken for a text colour.

   Worth knowing: --line and --line2 are exempted and are used as a text colour
   NOWHERE. Two thirds of this list has been exempting nothing from a check it
   never reached. Kept, empty and explicit, because an empty allowlist now says
   "if either is ever used as prose, fail" -- which is the assertion that was
   missing. */
(function(){
  var css = HTML.slice(HTML.indexOf("<style>"), HTML.indexOf("</style>"));
  var re = /([^{}]+)\{([^{}]*)\}/g, m;
  Object.keys(UI_EXEMPT).forEach(function(tok){
    var allowed = UI_EXEMPT[tok], found = [];
    re.lastIndex = 0;
    while((m = re.exec(css))){
      var sel = m[1].trim().replace(/\s+/g, " ");
      if(new RegExp("(^|[;{\"\\s])color:\\s*var\\(--" + tok + "\\)").test(m[2])) found.push(sel);
    }
    found.forEach(function(sel){
      if(allowed.indexOf(sel) < 0){
        fail("`" + sel + "` draws text in --" + tok + ", which section 20 exempts " +
             "from the 4.5:1 AA floor on the grounds that it is a drawn shape " +
             "rather than prose. That is true of " +
             (allowed.length ? allowed.join(", ") : "nothing currently") +
             " and it is not true here. Either the rule is a glyph and belongs " +
             "in UI_EXEMPT with a reason, or it is text and needs a token that " +
             "clears 4.5:1");
      }
    });
    allowed.forEach(function(sel){
      if(found.indexOf(sel) < 0){
        fail("UI_EXEMPT names `" + sel + "` for --" + tok + ", and no rule by " +
             "that name draws text in it \u2014 an exemption for something that " +
             "is not there will quietly cover whatever takes its place");
      }
    });
  });
})();

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
       components at 3:1 (1.4.11) and body text at 4.5:1 (1.4.3).

       3.3.0: THE EXEMPTION IS GRANTED PER TOKEN AND EARNED PER RULE, AND THAT
       GAP SHIPPED A REAL AA FAILURE. axe-core, run in an opened group on
       6 Aug 2026, found .pathseg .bs2 -- the belt buckle's second line, prose,
       7px -- drawing in --staroff at 3.37:1 on --card2. This section had
       ALREADY COMPUTED that exact pair. It measured 3.37 and returned here,
       because --staroff was on the list and the list is of tokens.

       "Drawn shapes, not prose" is a property of the RULE, not of the colour.
       --staroff is both: the unfilled star in .stars button, which earns 3:1,
       and .bs2, which does not. So the exemption now has to name the rules it
       covers, and any other rule drawing text in one of these tokens fails
       below. Same lesson as guard 115 counting three copies of the bat: an
       assumption about how a thing is used stops being true without anything
       saying so. */
    var uiOnly = UI_EXEMPT.hasOwnProperty(pair[0]);
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
/* iOS 26 standalone grants the installed app a viewport short of the screen
   and paints the dead band below the webview from this same meta — frosted,
   so the dark theme's navy came out as a grey stripe under the tab bar. Black
   is the one colour the frosting returns unchanged (owner-verified on device,
   2026-08-17: the darker theme's band blended, the dark theme's showed). The
   band is outside the webview — no layout reclaims it — so the standalone
   branch in applyTheme() is the only thing standing between the tab bar and
   that stripe, and it is exactly the kind of special case a tidy refactor
   collapses back into the table lookup. */
if(!/isStandalone\(\)\s*\?\s*"#000000"/.test(HTML)){
  fail("applyTheme() no longer announces #000000 when installed — iOS paints " +
       "the phantom band below the webview from this meta, and the dark " +
       "theme's navy frosts to a visible grey stripe (see CHANGELOG 4.0.5)");
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
   seed-200 and whatever honest growth follows. Raised 200 -> 220 in 3.8.3 —
   the owner's number, on the record 12 Aug 2026: room for the support
   section now and the 4.0.0 swipe change coming. The ceilings moved; the
   discipline did not: arithmetic still fails the build, and every raise is
   still a recorded owner decision, never a drift. */
if(rawKB > 220) fail("index.html is " + rawKB.toFixed(1) + " KB raw, over the 220 KB budget");
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
/* 3.2.0: THE CARVE-OUT AND THE EMPTY-SWEEP CHECK BOTH INVERT, AND THE SECOND
   is the interesting half. This section allowed exactly one external script,
   the disclosed beacon, and then \u2014 correctly, at the time \u2014 FAILED
   when it found none at all, because an empty match array had already fooled
   it once: the pattern required a double-quoted src and the beacon has always
   been single-quoted, so the sweep matched nothing on every run from 1.2.4 to
   3.0.0 and a script added with single quotes would have shipped green. "An
   empty sweep is not a clean sweep" was the fix for that.

   With the beacon removed, an empty sweep IS the clean sweep, and a check
   written to catch a blind pattern would instead have blocked the correct
   state. So it inverts rather than being deleted: the page must carry NO
   external script, which is a stronger assertion than the carve-out ever was,
   and the pattern's old blindness no longer has anywhere to hide \u2014 there
   is no allowed tag left for a mis-match to be mistaken for. */
/* 3.7.2 (L-6 of the 10 Aug review): THE OLD PATTERN REQUIRED A QUOTED
   http(s):// VALUE, so `src="//evil.example/x.js"` \u2014 protocol-relative, an
   external fetch on any served page \u2014 slipped it, and so did an unquoted src.
   Section 42's origin sweep missed the same shape (no scheme, no match),
   leaving the runtime CSP as the only defense. Since 3.2.0 the page may carry
   NO script element with a src at all \u2014 the one script is inline and hashed \u2014
   so the attribute itself is now the failure, and there is no value form left
   for a blind pattern to mis-match. */
var ext = HTML.match(/<script\b[^>]*\bsrc\s*=[^>]*>/gi) || [];
ext.forEach(function(tag){
  fail("index.html carries a script element with a src (" + tag.slice(0, 90) +
       ") \u2014 the app must run with no network and its one script is inline " +
       "and hashed; since 3.2.0 there is no disclosed exception for any src, " +
       "quoted, unquoted, or protocol-relative");
});

/* ---------- 30. Documented spoiler order holds ------------------------ */
/* By-universe renders in array order, so the array IS the watch order. Group
   notes make promises about it, and prose cannot enforce itself.

   THE FIRST RULE HERE WAS BACKWARDS FROM 1.2.3 UNTIL 3.9.2, AND THIS GUARD
   HELD THE ARRAY TO IT. It read "JLU 'Epilogue' spoils Batman Beyond" and then
   required Beyond to come AFTER JLU \u2014 which delivers the spoiler before the
   thing it spoils. The DCAU note, the JLU entry blurb and README.md all
   repeated the same inversion for seven minor versions, each one citing the
   others. Two facts settled it: "Epilogue" is JLU SEASON 2 (2005), not the
   season 3 entry the blurb sat on, and it is set fifteen years after Batman
   Beyond \u2014 it is Beyond's ending, not its trailer. 3.9.2 moved the Beyond
   block ahead of Justice League and inverted the rule.

   Every Beyond entry is pinned individually rather than just the block's ends.
   A partial move would otherwise pass, and a rule that only answers the easy
   case is a sentence, not a rule. */

var pos = {}, byId30 = {};
sandbox.PATH.forEach(function(g, gi){
  g.films.forEach(function(f, ix){ pos[f.i] = gi * 1000 + ix; byId30[f.i] = f; });
});

var JLU_AFTER = ["justice-league-unlimited-season-2-2005",
                "justice-league-unlimited-season-3-2006"];
var WHY_BEYOND = "JLU 'Epilogue' (season 2) is Batman Beyond's ending, not its " +
                 "trailer \u2014 the whole Beyond block runs before Justice League";

var SPOILERS = [
  ["batman-beyond-the-movie-1999",            JLU_AFTER, WHY_BEYOND],
  ["batman-beyond-season-1-1999",             JLU_AFTER, WHY_BEYOND],
  ["batman-beyond-season-2-2000",             JLU_AFTER, WHY_BEYOND],
  ["batman-beyond-season-3-2000",             JLU_AFTER, WHY_BEYOND],
  ["the-zeta-project-seasons-1-2-2001",       JLU_AFTER, WHY_BEYOND],
  ["batman-beyond-return-of-the-joker-2000",  JLU_AFTER, WHY_BEYOND],
  ["batman-the-animated-series-season-1-1992",
   ["batman-mask-of-the-phantasm-1993", "batman-mr-freeze-subzero-1998"],
   "Phantasm and SubZero drop into the series, not ahead of it"],
  ["batman-beyond-season-3-2000",
   ["batman-beyond-return-of-the-joker-2000"],
   "Return of the Joker closes Beyond"],
  /* 3.9.3. Death in the Family OPENS earlier than Under the Red Hood \u2014 at the
     crowbar, which is chronologically before the film it is built on \u2014 and it
     sat first for that reason. But it does not END there. One of its three
     branches plays out Under the Red Hood's plot in full: the Lazarus Pit, the
     resurrection, the Red Hood, the Joker. Ordering by the first scene works
     for a story that finishes before the next one starts, and this one does
     not; it occupies a superset of the slot.
     The Comic Adaptations already carried the rule in its own WEAVES reason
     string \u2014 "a derivative work has to follow its source whatever era it sits
     in" \u2014 written for exactly this and applied everywhere except here. Same
     shape as the Phantasm/SubZero rule above. */
  ["batman-under-the-red-hood-2010",
   ["batman-death-in-the-family-2020"],
   "Death in the Family is derivative of Under the Red Hood, and one branch " +
   "plays out its whole plot"]
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
/* 3.9.3: THE RULES HAVE TO HOLD ON BOTH SHELVES. Everything above reads array
   position, which is the by-universe order. The life ordering runs on `lo`, and
   nothing tied the two together \u2014 so a rule could be honoured by universe and
   broken by life through an edit that touched only `lo`, with every guard green.

   Only same-era pairs are checked, and the exception is the point rather than a
   convenience. Where a rule spans eras the life ordering CANNOT comply: JLU is
   era 7, Batman Beyond is era 10, and Beyond is correctly later in a lifetime,
   so "Epilogue"'s season renders first there whatever the array says. The app's
   unit is the season and "Epilogue" is one episode inside one, so no reordering
   reaches it. That case carries a warning in the JLU season 2 blurb instead,
   which is the only honest instrument left when the order cannot be the
   instrument. Asserting it here would mean either a permanently red build or a
   rule quietly written to pass \u2014 and this file does not accept the second. */
SPOILERS.forEach(function(rule){
  var first = byId30[rule[0]];
  if(!first || !first.e) return;
  rule[1].forEach(function(id){
    var later = byId30[id];
    if(!later || later.e !== first.e) return;
    if(!(later.lo > first.lo)){
      fail("the life ordering contradicts a spoiler rule: " + id + " sits at lo " +
           later.lo + " in era " + later.e + ", at or before " + rule[0] + " at lo " +
           first.lo + " \u2014 both shelves have to agree wherever one era can hold " +
           "both entries, or the by-universe fix is undone by the life ordering");
    }
  });
});
note("spoiler rules checked: " + SPOILERS.length + " (array order, and the life " +
     "ordering wherever one era holds both entries)");

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

/* 4.2.5, C-5: dedupeLog consults BYID now (the restore-path half of the
   4.2.4 gates), so the sandbox carries one — the letters this section has
   always tested with, plus nothing, so the drop case is testable too. */
var dedupeLog = new vm.Script(
  optionalFn("validTs", "nothing would say what a usable timestamp is") + "\n" +
  optionalFn("dedupeLog", "a saved payload could hold two entries for one id") +
  "\ntypeof dedupeLog === 'function' ? dedupeLog : function(a){ return a; };"
).runInNewContext({BYID: {a: 1, b: 1}});
var dl = dedupeLog([{id:"a",ts:300},{id:"b",ts:200},{id:"a",ts:100},{id:"a",ts:900}]);
if(dl.length !== 2) fail("dedupeLog left " + dl.length + " entries, expected 2");
if(dl.map(function(e){ return e.id; }).join(",") !== "a,b"){
  fail("dedupeLog did not preserve first-seen order: " + dl.map(function(e){return e.id;}));
}
/* 3.4.5 coupled this to validTs(), so an empty result is now reachable from a
   defect in a different function — and dl[0].ts on an empty array ends the run
   with a stack trace instead of the four failures underneath it. Same rule as
   optionalFn(): a guard that dies says nothing. */
if(!dl.length) fail("dedupeLog returned nothing for four well-formed entries");
else if(dl[0].ts !== 100) fail("dedupeLog kept ts " + dl[0].ts + ", expected the earliest (100)");
if(JSON.stringify(dedupeLog(dl)) !== JSON.stringify(dl)) fail("dedupeLog is not idempotent");
if(dedupeLog([null, {ts:1}, {id:"a",ts:1}]).length !== 1) fail("dedupeLog admitted a junk entry");
if(dedupeLog([{id:"not-in-the-catalogue",ts:1}, {id:"a",ts:1}]).length !== 1){
  fail("dedupeLog kept a logged id the catalogue does not carry — a polluted " +
       "or hostile store keeps its phantoms through every restore, and the " +
       "log stops being a subset of the catalogue");
}
/* 3.4.5. mergeLog got validTs() for the ts:null case and this path did not,
   which left the hole exactly where the audit had found it: restore() reads a
   saved log through dedupeLog(), NOT through mergeLog(), so an entry with no
   timestamp still reached S.log from storage and Activity still dated it 1970.
   The two readers of foreign log data now agree on what a timestamp is. */
if(dedupeLog([{id:"a",ts:null}, {id:"b",ts:1}, {id:"c"}, {id:"d",ts:"x"}]).length !== 1){
  fail("dedupeLog admitted an entry with no usable timestamp — isFinite(null) " +
       "is true, the entry becomes epoch 0, and Activity dates it 1970. " +
       "restore() reads the saved log through here and not through mergeLog()");
}
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

  /* 3.4.2. NO COMMERCE VOCABULARY, AND isAccessibleForFree IS WHY IT IS NOT
     NEEDED. The node carried offers:{@type:Offer, price:"0",
     priceCurrency:"USD"}, which is a legitimate way to say "free" and is also
     the single line that made the 7 Aug Cloudflare Radar scan record a commerce
     signal on a site it had itself classified isCommerce:false. Two vocabularies
     for one fact, and the quieter one was already present. Stray Offer markup
     can produce misleading rich results, so the shape is refused rather than
     merely removed. qa/scan-triage-2026-08-07.md. */
  if(app.offers){
    fail("JSON-LD carries an Offer again " + "\u2014" + " isAccessibleForFree already " +
         "says the app is free, and commerce vocabulary on a watch-order guide " +
         "reads as a storefront to anything parsing it");
  }
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
   tracks you. Cloudflare's beacon was the one deliberate, disclosed exception
   until 3.2.0 removed it; since then NOTHING is fetched from anyone, and the
   allowlist below is origins the page may NAME, not reach. (This header said
   "is the one deliberate exception" for four releases after the beacon left \u2014
   stale prose in the very section that polices staleness. Fixed 3.7.2.) */

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
  /* 3.2.0 emptied this of everything but our own origin. It carried the two
     beacon hostnames \u2014 static. for the script, the apex for its reporting
     \u2014 which were two strings in two CSP directives, and that is exactly how
     one of them survives a removal that only remembers the other. */
  var FETCHED = ["nightwatcher.life"];
  /* 4.1.0: publishers.basicattentiontoken.org joins on the NAMED footing —
     the support line on Progress links the owner's Brave Creators page, a
     link the reader may choose to follow. Nothing fetches it; a tip that
     phones home about the page being opened would be worse than no tip. */
  var NAMED   = ["search.brave.com", "schema.org", "www.w3.org",
                 "www.sitemaps.org", "github.com", "x.com",
                 "publishers.basicattentiontoken.org"];
  var ALLOWED = FETCHED.concat(NAMED);
  /* Every file that ships, not just index.html. sw.js kept Google's font
     origins in a dead cache branch from 1.4.2 to 1.5.0 because this scan only
     ever read the page. A service worker reaches the network too. */
  var origins = {};
  /* 3.9.2 added the machine-readable files. The sweep read the five a browser
     loads and skipped every file written FOR an agent \u2014 llms.txt above all,
     which is the one an agent actually reads, plus orders.txt, auth.md, the
     header file and the 404 page. A foreign URL in any of them shipped without
     a failure. */
  ["index.html", "sw.js", "manifest.json", "robots.txt", "sitemap.xml",
   "llms.txt", "orders.txt", "auth.md", "_headers", "404.html"].forEach(function(f){
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
["limelight-latin-400-normal",
 "big-shoulders-display-latin-700-normal",
 "ibm-plex-sans-latin-400-normal", "ibm-plex-sans-latin-600-normal",
 "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-600-normal"].forEach(function(f){
  if(HTML.indexOf("fonts/" + f + ".woff2") < 0) fail("@font-face lost " + f);
  if(!fs.existsSync(path.join(PUBLIC, "fonts", f + ".woff2"))) fail("missing font file: " + f + ".woff2");
});
/* 4.3.0 RETIRED ANTON — the row titles moved to Big Shoulders Display, which
   was already loaded for the scorecard numbers, so the page dropped a face,
   its preload and 8.2 KB. A face that comes back by accident (a pasted stack,
   a restored @font-face) re-adds a request nothing renders. The file itself
   is enforced by section 106's manifest equality: anton on disk without a
   manifest entry is already red there. This pins the page. */
if(/anton/i.test(HTML)){
  fail("Anton is back in index.html — 4.3.0 retired it; the display face " +
       "is Big Shoulders Display and the anton woff2, its preload and its " +
       "@font-face all left the page together");
}
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
    /* data: LEFT IN 3.9.2 WITH THE FAVICON THAT NEEDED IT. The inline data-URI
       icon moved to files; the allowance outlived it by several releases as a
       standing invitation for any future injection to carry its own image. */
    "img-src":      "'self'",
    "manifest-src": "'self'",
    /* connect-src is DELIBERATELY ABSENT since 3.3.1 and stays absent -- BUT
       NOT FOR THE REASON RECORDED HERE UNTIL 3.4.4, WHICH WAS FALSE.

       This comment used to read: "The wire reading on 6 Aug 2026 found the edge
       appending 'self' to it, and a 'none' sitting beside a second source
       expression is ignored -- so the directive shipped, looked like protection,
       and provided none: fetch('/orders.txt') from the live page returned 200.
       It now falls through to default-src 'none', which is the first directive
       in the policy and which the edge has no directive of its own to append
       to."

       THE EDGE APPENDS NOTHING. That reading, and the three others like it, were
       taken through a TLS-intercepting VPN on the author's own machine -- read
       with it switched off on 8 Aug 2026 the served policy is this file's,
       exactly: ten directives, one sha256, no connect-src. C0 was never
       Cloudflare. ops/c0-edge-injection.md.

       SO 3.3.1 REMOVED A DIRECTIVE ON A MISREADING, AND THIS GUARD HAS BEEN
       ENFORCING THAT REMOVAL EVER SINCE. The removal is kept anyway, on the
       half of the old reasoning that was never about the edge: default-src
       'none' is the first directive in the policy and connect-src falls through
       to it, and the page opens no connections of any kind -- no fetch, no XHR,
       no beacon, no socket. A directive that restates its own fallback is a
       second copy of one rule, and two copies drift.

       THE DIFFERENCE MATTERS TO THE NEXT PERSON. Restoring connect-src 'none'
       is now a live option that costs nothing and gains nothing, not an
       impossibility. If anyone argues for it, the argument is redundancy, not
       "the edge will eat it". The unpinned-directive check below still fails the
       build the moment connect-src reappears -- so the decision is made here,
       deliberately, rather than drifted into. */
    "worker-src":   "'self'",
    "base-uri":     "'none'",
    "form-action":  "'none'",
    "object-src":   "'none'"
  };
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
  /* 3.2.0. script-src used to be REQUIRED to carry the beacon origin, so that
     dropping it from the policy could not silently stop a thing the privacy
     copy and SECURITY.md both promised was running. The beacon leaves all
     three in this release, so the requirement inverts with it: one hash, and
     nothing else at all. A host expression here now is a third-party origin
     arriving without the disclosure that used to have to go with one. */
  var scriptSrc = got["script-src"] || "";
  scriptSrc.split(/\s+/).filter(Boolean).forEach(function(tok){
    if(/^'sha256-[A-Za-z0-9+/=]+'$/.test(tok)) return;
    fail("script-src carries " + tok + " \u2014 since 3.2.0 this page runs one " +
         "hashed inline block and nothing else");
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
    blessHtml(HTML.replace("'sha256-" + declared + "'", "'sha256-" + actual + "'"));
    /* 4.0.1: THE SUMMARY GUARD 10 LEANS ON. The vendor-mark list is a filter
       and will always be behind whatever arrives next; the reader is this
       line: every re-hash prints the script's size and the delta against the
       last blessed size (qa/script-bytes.json, written here), so foreign code
       riding in on a bless is a visible jump in the one place a launderer
       cannot avoid. The hash is one-way, so a content diff is impossible from
       the file alone \u2014 size is what can be carried across honestly. */
    var ledgerPath = path.join(ROOT, "qa", "script-bytes.json");
    var prevBytes = null;
    try{ prevBytes = JSON.parse(fs.readFileSync(ledgerPath, "utf8")).bytes; }catch(e){}
    var nowBytes = Buffer.byteLength(body, "utf8");
    try{
      fs.writeFileSync(ledgerPath,
        JSON.stringify({bytes: nowBytes, sha256: actual}) + "\n");
    }catch(e){}
    var deltaTxt = (typeof prevBytes === "number")
      ? " (" + (nowBytes >= prevBytes ? "+" : "") + (nowBytes - prevBytes) +
        " B since the last bless)"
      : " (no prior blessed size on record)";
    note("blessed the CSP script hash \u2014 script " + nowBytes + " B" + deltaTxt +
         ", sha256 " + actual.slice(0, 12) + "\u2026 was " + declared.slice(0, 12) + "\u2026");
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
  ["LICENSE", "SECURITY.md", "README.md", "CHANGELOG.md", "RELEASING.md",
   "package.json",
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
  var box = { S:{watched:{}, skipped:{}, rated:{}, log:[], clk:{w:{}, s:{}, r:{}}},
              persist:function(){}, render:function(){}, now:function(){ return 1; },
              /* 3.0.0 moved rate() onto the tick fast path, so the stub set
                 has to carry it too. A repaint is not what this section is
                 about; what happens to S is. askDurable() is stubbed for the
                 same reason tickUpdate() is: it reaches a host API
                 (navigator.storage), and what this section asserts is what
                 happens to S. */
              askDurable:function(){},
              tickUpdate:function(){} };
  /* Hand-written copies of clampRating() and markWatched() lived here until
     1.7.5 and quietly diverged from the app: parseInt where the page uses
     Math.floor(Number()), and a markWatched that never cleared S.skipped. This
     section then validated the copies. Extract, like everything else.
     stampMark() joined the extraction in 3.8.0 with the per-mark clocks. */
  new vm.Script(fn("clampRating") + "\n" + fn("stampMark") + "\n" + fn("markWatched")).runInContext(vm.createContext(box));
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

  /* 3.9.0: the first-run page offers scope, not just format. Before this,
     formatSwitch() sat on Home under "What are you watching" while scopeSwitch()
     lived only in the belt buckle, so a first-lander could pick Animated / Live
     / All and never see Movies vs Movies+Series until they opened a closed
     pouch they had no reason to. The intro even promises it ("Films only, or
     every series too"). Scope now renders beside format on the first-run
     surface, the same "what to include" pair the belt groups (section 53). */
  var fsw = first.indexOf("formatSwitch()");
  var ssw = first.indexOf("scopeSwitch()");
  if(ssw < 0){
    fail("the first-run page renders no scope switch: a first-lander (the one " +
         "page a crawler ever sees) can choose a format but never Movies vs " +
         "Movies+Series until they open the belt, the discoverability gap 3.9.0 " +
         "closes. scopeSwitch() belongs beside formatSwitch() on Home");
  } else if(fsw >= 0 && deck >= 0 && (ssw < fsw || ssw > deck)){
    fail("the first-run scope switch is out of place: format then scope, both " +
         "above the path deck, is the 'what to include' pair (section 53) shown " +
         "before 'how to order'");
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

/* The document does not scroll — and since 4.0.0, neither does #app. Until
   3.9.6 scroll lived on the document; 3.9.7 clipped html and body and made
   #app the one vertical scroller (release one of the tab swipe: the half
   that moved WHERE scrolling lives). 4.0.0 is release two — the half that
   changes WHAT SWIPES — and it pushes scroll one level deeper again, exactly
   where the 3.9.7 record said it would go: #view is a horizontal scroll-snap
   viewport holding four persistent panels, one per tab, and EACH PANEL is
   its own vertical scroller. #app is now pure frame: header, viewport,
   tabs, clipped.

   The owner's ask rode along: the scrollbar hides below the header the way
   it always hid below the footer. That is not a styling trick — it is the
   scrollport's top edge moving to the header's bottom, which is also why
   every sticky offset in the stylesheet became panel-relative (section 128).

   svh THEN dvh, in that order: dvh tracks the chrome and is the value that
   is right, svh the fallback for engines that predate it. The accepted iOS
   cost from 3.9.7 stands unchanged: the toolbar never collapses, because
   the document it collapses for never moves. */
(function(){
  var hb = (HTML.match(/html,body\{[^}]*\}/) || [""])[0];
  if(!/overflow:hidden/.test(hb)){
    fail("html,body no longer clip — the document can scroll again, so " +
         "there are two vertical scrollers and every scroll site in the app " +
         "(scrollKeep/scrollPut, section 120) reads and writes the one that " +
         "is not the one moving");
  }
  var app = (HTML.match(/#app\{[^}]*\}/) || [""])[0];
  if(!app){ fail("#app has no styling of its own"); return; }
  if(/min-height/.test(app)){
    fail("#app carries a min-height again — the +1px trick belonged to " +
         "document scrolling and left with it in 3.9.7. A scroller that can " +
         "grow past the viewport hands its overflow back to the document");
  }
  if(!/height:100svh;height:100dvh/.test(app)){
    fail("#app is not height-locked to the viewport (svh fallback, then " +
         "dvh) — the frame has to end where the screen does, or the " +
         "panels inside it have nothing to be sized against");
  }
  if(!/overflow:hidden/.test(app) || /overflow-y:auto/.test(app)){
    fail("#app scrolls — since 4.0.0 it is the frame and nothing else. " +
         "A scrolling #app on top of scrolling panels is two vertical " +
         "scrollers again, and the seam (scroller(), section 120) would " +
         "read the one that is not the one moving");
  }
  /* The viewport: horizontal only, snap mandatory, one panel per stop, its
     own scrollbar hidden (the panels carry the visible one), overscroll
     contained so a swipe past either end never reaches browser gestures. */
  var sw = (HTML.match(/main\.sw\{[^}]*\}/) || [""])[0];
  if(!sw){ fail("main.sw has no styling — there is no swipe viewport"); return; }
  if(!/overflow-x:auto/.test(sw) || !/overflow-y:hidden/.test(sw)){
    fail("the swipe viewport does not scroll horizontally and only " +
         "horizontally — vertical overflow belongs to the panels");
  }
  if(!/scroll-snap-type:x mandatory/.test(sw)){
    fail("the swipe viewport does not snap — without x mandatory a swipe " +
         "can rest between tabs, showing two half-panels and no whole one");
  }
  if(!/overscroll-behavior-x:contain/.test(sw)){
    fail("the swipe viewport chains horizontal overscroll — a swipe past " +
         "Home or Progress lands on the browser's own back/forward gesture, " +
         "which navigates away from the app mid-gesture");
  }
  if(!/scrollbar-width:none/.test(sw) ||
     HTML.indexOf("main.sw::-webkit-scrollbar{display:none;}") < 0){
    fail("the swipe viewport shows its own scrollbar — the visible " +
         "scrollbar belongs to the panels; a second bar under the tabs is " +
         "chrome nobody asked for, in both engines' spellings");
  }
  var pn = (HTML.match(/\n\.panel\{[^}]*\}/) || [""])[0];
  if(!pn){ fail(".panel has no styling — there are no panels to swipe"); return; }
  if(!/flex:0 0 100%/.test(pn) || !/min-width:100%/.test(pn)){
    fail("a panel is not exactly one viewport wide — the snap arithmetic " +
         "(index = scrollLeft / width, swipeRead) divides by the viewport's " +
         "width and only works while every panel IS that width");
  }
  if(!/overflow-y:auto/.test(pn)){
    fail("the panels do not scroll their own overflow — scroll lives in " +
         "the panels since 4.0.0, and every keep, restore and go-to-top " +
         "goes through scroller(), which answers the active panel");
  }
  if(!/overscroll-behavior:none/.test(pn)){
    fail("a panel chains its overscroll — the chain lands on the swipe " +
         "viewport or the browser's own gestures, and the nearest one is " +
         "pull-to-refresh, which reloads the app under the reader's finger");
  }
  if(!/scroll-snap-align:start/.test(pn) || !/scroll-snap-stop:always/.test(pn)){
    fail("the panels do not snap one at a time — snap-align:start puts a " +
         "panel flush in the viewport, and snap-stop:always is the agreed " +
         "rule that a hard fling crosses ONE tab, not three: sequential " +
         "swipes, never a skip");
  }
  /* The seed's no-JS fallback: before the deck is built, main itself is the
     vertical scroller, so a reader without JavaScript can still scroll the
     crawlable catalogue — and gets the below-the-header scrollbar too. */
  var mn = (HTML.match(/\nmain\{[^}]*\}/) || [""])[0];
  if(!/overflow-y:auto/.test(mn) || !/min-height:0/.test(mn)){
    fail("main is not a vertical scroller before the deck is built — " +
         "without JavaScript the seed is the page, and a clipped main makes " +
         "the catalogue unreadable past the first fold (min-height:0 is what " +
         "lets a flex child shrink to be scrollable at all)");
  }
  /* The chips rail contains its own horizontal overscroll, or a hard fling
     along it continues into the swipe viewport and changes tabs. */
  var chips = (HTML.match(/\.chips\{[^}]*\}/) || [""])[0];
  if(!/overscroll-behavior-x:contain/.test(chips)){
    fail("the chips rail chains horizontal overscroll into the swipe " +
         "viewport — reaching the end of the universe chips and pulling " +
         "further would swipe the whole tab away under the reader's finger");
  }
  /* The tab bar is the frame's third member, IN THE FLOW — not fixed. It
     was position:fixed from 1.x through the first cut of 4.0.0, and the
     owner's installed-app screenshot (16 Aug) showed it floating a toolbar's
     height above the home indicator: iOS standalone can resolve the fixed
     anchor (and svh/dvh) against browser-chrome metrics for chrome that is
     not there. A flex child at the bottom of a clipped, height-locked #app
     needs no anchor at all — it ends where #app ends. The standalone media
     override pins #app to 100% — NOT a vh unit. The first cut used 100vh
     and the owner's second screenshot paid for it the same day: iOS handed
     the installed WebView a viewport ~48pt shorter than the screen, vh
     reported the screen anyway, and the bar's label row rendered below the
     fold ("footer is worst, no text seen"). Every viewport unit is a claim
     about the screen; height:100% is the ICB — the viewport iOS actually
     laid out — and cannot overshoot by construction. Content no longer
     passes under the bar, so the panels' runway padding is a plain 28px —
     the tab-h + safe-area arithmetic left with the overlap. */
  var tabsCss = (HTML.match(/#tabs\{[^}]*\}/) || [""])[0];
  if(/position:fixed/.test(tabsCss) || !/flex:none/.test(tabsCss)){
    fail("#tabs is fixed again (or lost flex:none) — the bar is the frame's " +
         "third flex member since 4.0.0, and a fixed bar re-inherits the iOS " +
         "standalone anchor bug that had it floating above the home " +
         "indicator in the owner's 16 Aug screenshot");
  }
  if(!/padding-bottom:max\(0px, calc\(env\(safe-area-inset-bottom\) - var\(--vpdead, 0px\)\)\)/.test(tabsCss)){
    fail("#tabs's bottom pad is not the reclaim form — it must be " +
         "max(0px, calc(env(safe-area-inset-bottom) - var(--vpdead, 0px))): " +
         "in a browser --vpdead is unset and the pad is the full inset " +
         "(Progress stays above the home indicator), but the owner's probe " +
         "measured the installed webview ending 62pt ABOVE the screen " +
         "bottom while env(bottom) still said 34 — an inset for an " +
         "indicator that is not over the page. vpSync() writes the " +
         "measured gap and the pad collapses to what is actually owed " +
         "(4.0.9, vp.html numbers in the release prep)");
  }
  if(HTML.indexOf("@media (display-mode: standalone){#app{height:100%;}}") < 0){
    fail("the standalone height override is gone or is a viewport unit " +
         "again — installed, #app must be height:100%: the ICB is the one " +
         "measure of the WebView that cannot overshoot it. svh/dvh were " +
         "seen resolving against Safari's browser metrics in standalone " +
         "(the floating footer), and 100vh overshot a short-viewport grant " +
         "and cut the bar's labels off the screen (the no-text footer). " +
         "Both reports are the owner's, both 16 Aug");
  }
  /* 4.0.8: the heal. The band under the installed bar outlived three fixes
     because the document never scrolls (3.9.7 moved scroll onto #app), so
     WebKit never re-resolves a viewport it granted stale — the collapsed
     browser-chrome number sticks forever, 100% honestly fills the short
     grant, and the remainder shows as a dead band the owner can see and
     nothing here could reach. vpHeal() is the community re-measure: hide
     #app, force one layout, show it — WebKit re-resolves the viewport in
     the same task (no paint in between, so no flash), and the same move
     heals the documented keyboard bug where the viewport shrinks for good
     after typing (this app has a search box). Gates, each load-bearing:
     standalone only (a browser's short viewport is the browser's own
     chrome, correct and none of ours); portrait shrink over 24px (iPad
     windows and desktop installs are legitimately short); never while an
     INPUT/TEXTAREA holds focus (display:none blurs it and eats the
     keyboard mid-word); capped tries (if the short render is REAL, the
     heal is a no-op and must not spin); and the scroll survives through
     the seam — scrollKeep before, scrollPut after, snapTo(S.tab) because
     display:none zeroed the deck's own scroll. */
  if(!/function vpHeal\(\)\{/.test(HTML)){
    fail("vpHeal() is gone — the installed app's stale-viewport band has no " +
         "cure again: the document never scrolls, so nothing else ever asks " +
         "WebKit to re-resolve a stale standalone grant (4.0.8)");
  }
  var healBody = (HTML.match(/function vpHeal\(\)\{[\s\S]*?\n\}/) || [""])[0];
  if(!/isStandalone\(\)/.test(healBody) || !/vpShrunk\(\)/.test(healBody)){
    fail("vpHeal() lost its standalone or shrink gate — it would toggle " +
         "#app in plain browsers or on legitimately-short windows (iPad, " +
         "desktop installs), where the short viewport is not a defect");
  }
  if(!/INPUT/.test(healBody) || !/TEXTAREA/.test(healBody)){
    fail("vpHeal() no longer checks the focused element — display:none on " +
         "#app blurs a focused input and eats the keyboard mid-word");
  }
  if(!/scrollKeep\(\)/.test(healBody) || !/scrollPut\(keep\)/.test(healBody) || !/snapTo\(S\.tab\)/.test(healBody)){
    fail("vpHeal() no longer restores what the display toggle destroys — " +
         "scroll position through the seam and the deck's snap both zero " +
         "when #app leaves the tree");
  }
  if(!/document\.addEventListener\("focusout"/.test(HTML) || HTML.indexOf("setTimeout(vpTick, 300)") < 0){
    fail("the viewport triggers are gone — vpTick (heal, then sync) must " +
         "run at standalone boot and after every input blur, or the band " +
         "returns on the exact paths that made it and the pad reclaim " +
         "never learns the gap");
  }
  if(!/setProperty\("--vpdead"/.test(HTML) || !/removeProperty\("--vpdead"\)/.test(HTML)){
    fail("vpSync()/--vpdead is gone — the pad reclaim's one source of " +
         "truth: the measured gap between screen and granted viewport, " +
         "written as a CSS var in standalone and absent everywhere else " +
         "(4.0.9)");
  }
  if(!/if\(vpGap\(\) === before\) vpTries = 6;/.test(HTML)){
    fail("vpHeal() no longer gives up when a toggle changes nothing — the " +
         "owner's probe proved the short render is REAL on iOS 26 " +
         "(vh/lvh stripes below the render edge), so a heal that cannot " +
         "move innerHeight must stop at one attempt, not burn its cap " +
         "toggling #app");
  }
  /* The window is not the scroller any more, so a window scroll call is a
     call to the element that no longer moves — a silent no-op in every
     browser, and the exact bug this migration invites for as long as muscle
     memory lasts. */
  ["window.scrollTo", "window.scrollBy"].forEach(function(s){
    if(HTML.indexOf(s) >= 0){
      fail("index.html calls " + s + " — the document is locked, so this " +
           "scrolls nothing and fails in silence. Scroll goes through " +
           "scrollPut() and scroller().scrollTo() on the active panel");
    }
  });
  if(HTML.indexOf('window.addEventListener("scroll"') >= 0){
    fail("a scroll listener is bound to window — the document never fires " +
         "scroll now. The two pinned listeners (section 128) live on the " +
         "active panel and on #view");
  }
  if(HTML.indexOf("scrollend") >= 0){
    fail("something listens for scrollend — declined in the 16 Aug plan: " +
         "Safari shipped it late and the settle is computed from the snap " +
         "arithmetic in swipeRead instead, which works in every engine the " +
         "same way");
  }
  if(/scroll-behavior:smooth/.test(HTML)){
    fail("scroll-behavior:smooth is in the stylesheet — declined in the " +
         "16 Aug plan: CSS smooth scrolling fights scroll-snap during a " +
         "programmatic tab change in some engines, and every deliberate " +
         "smooth scroll this app makes already goes through calmScroll(), " +
         "which honors reduced motion");
  }
  note("scroll owner: document clipped, #app is frame, #view snaps x " +
       "mandatory one panel at a stop, panels scroll y, chips contained, " +
       "no window scroll calls, no scrollend, no CSS smooth");
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
           the fixture total came to be reported as 194 when it was 178.

           green_case COUNTS TOO, ADDED WITH IT IN 3.7.1. A fixture that proves
           a guard does NOT fire is a fixture, and a counter that can only see
           one of the two helpers reports a total that is quietly short — which
           is this project's oldest failure wearing a new hat. The alternation
           is the whole change: the moment a third helper exists it belongs
           here, in the same commit that introduces it. */
        /* Leading whitespace is allowed as of 3.7.2 (L-10 of the 10 Aug
           review): a fixture wrapped in an `if` runs but sat outside the old
           column-0 pattern, so it was uncounted — and this guard would then
           have certified a wrong README number, which is the exact drift it
           exists to stop. A quoted label still keeps the helper definitions
           and the commented examples out of the count. */
        fixtures += (fs.readFileSync(path.join(negDir, f), "utf8")
                       .match(/^[ \t]*(?:run_case|green_case)\s+"/gm) || []).length;
      });
      counts.push(["negative suites", suites.length, /(\d+)\s+negative suites\b/]);
      counts.push(["negative fixtures", fixtures, /(\d+)\s+fixtures\b/]);
      /* 3.9.2: THE SPLIT IS GUARDED TOO. qa.yml's cost comment said "the counts
         are now guarded in this file the same as the README's" and they were
         not \u2014 only the two totals above were, so the guards/smoke split drifted
         freely. These are the exact figures whose predecessors drifted before,
         and the census already computes both. */
      var smokeFix = 0;
      suites.forEach(function(f){
        var txt = fs.readFileSync(path.join(negDir, f), "utf8").replace(/\\\n/g, " ");
        smokeFix += (txt.match(/^[ \t]*(?:run_case|green_case)\s+"(?:[^"\\]|\\.)*"\s+"(?:[^"\\]|\\.)*"\s+"(?:[^"\\]|\\.)*"\s+"?smoke/gm) || []).length;
      });
      counts.push(["run guards.js", fixtures - smokeFix, /(\d+)\s+run guards\.js/, "qa.yml"]);
      counts.push(["run smoke.js",  smokeFix,            /(\d+)\s+run smoke\.js/,  "qa.yml"]);
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
        /* The split lives in qa.yml's cost comment and nowhere else, so the
           README is not asked for a number it was never meant to state. */
        if(!seen && src[0] === "README.md" && c[3] !== "qa.yml"){
          warn("README: no " + c[0] + " count to check");
        }
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
  /* 3.9.2 CUT THREE OF THE FOUR. The marks notice and the two beacon bounds
     had been dead since 3.2.0, and the test is indexOf \u2014 so any smuggled
     comment CONTAINING one of those strings passed. Reproduced in the 14 Aug
     review: "<!-- Cloudflare Web Analytics : smuggled prose -->" went green
     through the whole suite. A section whose stated philosophy is "a fifth
     cannot arrive quietly" was allowing four names for one real comment. */
  /* 4.0.1: THE WHOLE BODY, NOT A SUBSTRING. 3.9.2 cut the dead names but
     kept indexOf, so a smuggled comment BEGINNING with a live name still rode
     in — reproduced in the 16 Aug review: "<!-- No trademarked logos :
     smuggled prose -->" went green. The allowlist now carries each comment's
     full text, whitespace-collapsed, and a comment passes only by matching
     one exactly. Editing an allowed comment means editing it here too, which
     is the section's own philosophy: allowed by name, and by nothing less
     than the whole name. */
  var ALLOWED_HTML_COMMENTS = [
    "Night Watcher \u00b7 https://github.com/6ummy-Dev/Night-Watcher",
    "No trademarked logos, symbols, or proprietary lettering are used " +
    "anywhere in this file. The favicon is an original bat-animal silhouette " +
    "drawn for this project; it is not a DC mark. Fonts and palette: see " +
    "NOTES.md."
  ];
  (HTML.match(/<!--[\s\S]*?-->/g) || []).forEach(function(c){
    var cBody = c.replace(/^<!--/, "").replace(/-->$/, "")
                 .replace(/\s+/g, " ").trim();
    var ok = ALLOWED_HTML_COMMENTS.some(function(a){ return cBody === a; });
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
  /* 4.2.3, Q-7 of the 19 Aug audit: THE NUMBERS WERE PINNED IN 1.4.2 AND THE
     TITLES NEVER WERE. 77, 82 and 103 had all drifted — 103 still narrated a
     GROUP repaint two releases after the tick became a row paint, which is
     exactly the "optimization" 3.3.x shipped as a scroll-jump bug. An INDEX
     that describes the previous instrument sends the reader to the wrong
     story; the header over the code is the one that gets rewritten with it,
     so the header is the truth and the INDEX is held to it. A "(was: …)"
     aside in a header is history, not title, and is not compared. */
  var headerTitle = {};
  (src.match(/\/\* -{3,} \d+\.[^\n]*/g) || []).forEach(function(h){
    var hm = h.match(/(\d+)\.\s*(.*?)\s*-*\s*\*\/\s*$/);
    if(hm) headerTitle[hm[1]] = hm[2].replace(/\s*\(was:[^)]*\)\s*$/, "");
  });
  var squash = function(t){ return t.replace(/\s+/g, " ").trim().toLowerCase(); };
  nums.forEach(function(n){
    var im = idx.match(new RegExp("\\n\\s+" + n + "[ \\t]+([^\\n]*)"));
    var it = im ? im[1].trim() : "";
    var ht = headerTitle[n] || "";
    if(it && ht && squash(it) !== squash(ht)){
      fail("the INDEX titles section " + n + " “" + it + "” but its header " +
           "says “" + ht + "” — one of them is describing a previous " +
           "instrument. The header is rewritten with the code; fix the INDEX");
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
    if(!/\bfail\(/.test(stripBlockComments(body))){
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
   left carries five distinct reasons, and an undifferentiated bucket is exactly
   what let the tone-filings hide. The count is computed below and printed by
   note(); naming it in this comment only dates the comment, which is what it
   did for two releases while it said "fourteen".

   The rule this section enforces is narrower than out:"none" reads. Taken
   literally, "no Batman in it at all" would put Joker: Folie a Deux (era 1),
   Birds of Prey (era 7) and Kite Man: Hell Yeah! (era 8) outside, and all
   three are placed on purpose. What is actually run: an entry follows its
   continuity, and out: applies when the entry has no place AND its continuity
   cannot lend it one. That is why Trouble in Tokyo left era 0 in 1.7.1 - it is
   the finale of a series already in era 3. NOTES.md carries the same rule
   beside the out: table; the two are one statement or they are two claims. */

(function(){
  var WHY = {
    who:  "the Batman in it is not Bruce",
    many: "more than one Batman on screen",
    none: "no Batman in it at all",
    flat: "a Batman, but no state asserted anywhere",
    tbd:  "a real continuity whose place is not decided yet"
  };
  var missing = [], stray = [], bad = [];
  /* 4.2.3, Q-1 of the 19 Aug audit: this loop used to read f.out off the
     guards' own FILMS — which carried a fabricated out: field the app never
     puts there. The invariant was real, the object was not. out: lives on the
     raw PATH entries and is read there, same as the app. */
  PATH.forEach(function(g){
    g.films.forEach(function(f){
      var why = f.out, e = (f.e || 0);
      if(e === 0 && !why) missing.push(f.i);
      if(e !== 0 && why) stray.push(f.i);
      if(why && !WHY[why]) bad.push(f.i + ' says out:"' + why + '"');
    });
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
  PATH.forEach(function(g){ g.films.forEach(function(f){
    if(f.out) tally[f.out] = (tally[f.out] || 0) + 1;
  }); });
  note("outside the timeline: " + Object.keys(tally).sort().map(function(k){
    return tally[k] + " " + k;
  }).join(", "));

  /* The flatten pin. "Flatten exactly as index.html does" was a comment for
     four releases and a falsehood for at least one — the copy up top had
     grown out: and lost d:, and nothing could say so. The two FILMS.push
     field lists are now compared byte-for-byte after whitespace collapse:
     a future app change that starts reading a field this file's copy does
     not carry goes red here instead of untested. */
  var pushRe = /FILMS\.push\(\{[\s\S]*?\}\);/;
  var appPush = (HTML.match(pushRe) || [""])[0];
  var ownPush = (fs.readFileSync(__filename, "utf8").match(pushRe) || [""])[0];
  var shape = function(s){ return s.replace(/\s+/g, " ").trim(); };
  if(!appPush){
    fail("cannot locate the app's FILMS.push — the flatten moved, and the " +
         "copy at the top of this file can no longer be checked against it");
  } else if(shape(appPush) !== shape(ownPush)){
    fail("the guards' flatten no longer matches index.html's flatten — the two " +
         "FILMS.push field lists have drifted, so the sections below are " +
         "checking an object the page does not build. App: " + shape(appPush) +
         " · guards: " + shape(ownPush));
  }
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
  /* THE JUMP SCROLLS INSTANTLY, AND THAT IS THE FIX, NOT A PREFERENCE. 3.3.1
     shipped `behavior: calmScroll()` here, which resolves to "smooth" for anyone
     who has not asked for reduced motion. A smooth scroll across a
     content-visibility:auto list races the browser's own rendering and lands at
     0 -- measured on live 3.3.1 from Home's grid AND from the donut, which is
     one of the four ways in browser-check drives. Nothing was watching: that
     check asserted the landed head was `top < 844`, the whole viewport, so a
     target that never moved passed whenever it fell inside the first fold.
     This is the tree-side half, and it runs on every push. */
  if(/scrollIntoView\(\{[^}]*behavior/.test(go)){
    fail("goToGroup() asks for a scroll behavior again \u2014 it must scroll " +
         "instantly. A smooth scroll across content-visibility:auto lands at 0, " +
         "which is how every jump in 3.3.1 silently did nothing");
  }
  if(go.indexOf("scrollIntoView") < 0){
    fail("goToGroup() no longer scrolls to the group it opened \u2014 opening a " +
         "group the reader cannot see is the defect 3.3.2 exists to fix");
  }
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

   offCanonical() survived 2.5.1 for one job: marking the still-serving mirror
   noindex. It is gone in 3.3.1, because the mirror is. GitHub Pages was
   unpublished 6 Aug 2026 on the owner's decision that nightwatcher.life is the
   only address, and that address now returns 404.

   Section 78 checked that noindex, and section 114 checked that the README
   agreed with it. All three retire together in 3.3.1 -- the app's half, the
   crawler's half and the prose's half -- because one origin cannot be
   off-canonical from itself. */

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

  /* INVERTED in 3.3.1. This clause used to fail if offCanonical() was GONE.
     It would have gone red on the day the correct state was reached, and its
     failure message became false the moment Pages was unpublished -- there is
     no still-serving mirror to mark. A guard that would block the correct
     state inverts rather than being deleted; section 29 is the precedent. */
  if(/function offCanonical\s*\(/.test(HTML)){
    fail("offCanonical() is back \u2014 it existed to mark a second serving " +
         "origin noindex, and there has been no second origin since the " +
         "mirror was unpublished on 6 Aug 2026");
  }
  note("the move offer stays retired; the mirror is unpublished and offCanonical() went with it");
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
      'watch orders, no spoilers: <a href="#universes">by universe</a>, ' +
      '<a href="#life">by the arc of one life</a>, or <a href="#release">by release</a>. ' +
      '<a href="#next">Next up</a> names the next unwatched entry, and ' +
      '<a href="#progress">Progress</a> keeps the tally. The app needs JavaScript; ' +
      "what follows is what it covers.</p>",
    /* 3.9.1: the differentiator and the contract, in plain sight. The audits
       put Competitive Differentiation and On-Page below nine not because the
       product is thin but because the seed stated the catalogue without ever
       stating what sets it apart from a ranked list or a forum thread, or the
       one-paragraph contract the app runs under — both things the app already
       is. Existing product reaching the surface engines read, not new promises. */
    "<p>This is not a ranked list or a forum thread argued over once and left to " +
      "rot — it is three spoiler-safe orderings of every Batman story ever filmed, " +
      "a fresh where-to-watch search on every entry, and nothing stored about you. " +
      "Pick an ordering, tick what you have seen, and the next unwatched entry is " +
      "always waiting: no account, no sign-in, it works offline, and your place is " +
      "kept in this browser alone.</p>",
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
    /* 3.9.1: who stands behind it, in the crawlable seed. The provenance line
       lived only in the app's JS-rendered footer, so a reader without
       JavaScript — and the engines that grade Human Trust — never saw who
       keeps it, that it is unofficial, or that it is AGPL. No outbound link
       (guard 90 keeps the seed's anchors internal); the claim is the value. */
    "<p>An unofficial fan guide, kept by 6ummy and free software under the AGPL — " +
      "the source is public on GitHub. Built in the open by one person and offered " +
      "as-is; corrections and additions are welcome there.</p>",
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
      blessHtml(HTML.replace(got, want));
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

  /* INVERTED in 3.3.1. Until then the old origin had to keep serving and could
     not send a header, so the only way it could ask to be left out of an index
     was to say so in the page, and this checked that it did. GitHub Pages was
     unpublished on 6 Aug 2026; there is no off-canonical origin, so there is
     nothing to mark and the injection is gone. The clause inverts rather than
     disappearing, because an injected noindex returning without a second origin
     to justify it would be a robots meta on the canonical site -- which is the
     failure the next clause has always guarded, arrived by a different door. */
  if(/function offCanonical\s*\(/.test(HTML) || /noindex/.test(HTML)){
    fail("the off-canonical noindex injection is back \u2014 there is one origin " +
         "now, and a noindex it injects can only land on the canonical one");
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
    if(!hasFn(name)) return warn("guard 79: no " + name + "() to check");
    src = fn(name);
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

/* ---------- 82. No CNAME file, ever (was: Pages never gets a domain) -- */
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
  /* 3.7.2, M-7 of the 10 Aug review: THE ID WAS PINNED AND NOTHING AROUND IT
     WAS. start_url is the same "tidied during a refactor" class of value as
     the id incident above — typo it and every new install opens a 404 while
     the diff reads like housekeeping. The whole installed surface is a set of
     decisions, so the whole surface is pinned. Section 12 already holds the
     icon files; this holds the fields. */
  [["start_url", "."], ["scope", "."], ["display", "standalone"],
   ["name", "Night Watcher"], ["short_name", "Night Watcher"],
   ["background_color", "#08090F"], ["theme_color", "#0C111C"]
  ].forEach(function(p){
    if(mf[p[0]] !== p[1]){
      fail("manifest." + p[0] + " is " + JSON.stringify(mf[p[0]]) + ", not " +
           JSON.stringify(p[1]) + " — the manifest is the installed app's " +
           "contract. A drifted field ships green to every new install while " +
           "looking like a tidy-up in the diff; if the change is deliberate, " +
           "move this pin in the same commit so it stays something that was " +
           "decided");
    }
  });
  note("manifest id " + mf.id + ", fixed in 2.7.0 and pinned since; " +
       "start_url, scope, display, names and colors pinned with it");
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
  if(!hasFn("exportJSON")) return fail("there is no exportJSON() — the JSON backup is gone");
  src = fn("exportJSON");
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
  if(!hasFn("buildGroups")) return fail("there is no buildGroups()");
  src = fn("buildGroups");
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
    /* 3.7.0: this was a 300-char window asking for "=== true" anywhere in it,
       and insOff\u2019s restore line moved into the window \u2014 so the fixture that
       deletes progOpen\u2019s own check went green on the neighbour\u2019s. Found by
       the full negative run. The assertion is the exact shape now; a window
       is satisfied by whatever wanders into it. */
    if(HTML.indexOf("if(o.progOpen[pk] === true) S.progOpen[pk] = true;") < 0){
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
    blessHtml(HTML.replace(ldm[1], JSON.stringify(o)));
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
   design/belt.md; this section is the locked picture, enforced. */

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
  /* 3.6.0 moved the staged close out of the handler and into closeBelt(),
     because the drop gave the belt three doors out \u2014 the buckle, the drop's
     one-shot scroll, and the flow auto-close \u2014 and F12's rule is that every
     door is wired to the same exit. The handler keeps the decision; the
     function keeps the mechanics. Section 129 holds the three-door routing;
     this section keeps asserting the mechanics exist at all. */
  var bhAt = HTML.indexOf('act === "belt"');
  var bh = HTML.slice(bhAt, bhAt + 400);
  if(!/closeBelt\("buckle"\)/.test(bh)){
    fail("the buckle no longer routes through closeBelt \u2014 a state that can " +
         "be left by three doors needs all three wired to the same exit, and " +
         "the one nobody tested is always the one in the report");
  }
  var cbFn = optionalFn("closeBelt", "the belt has no close path at all");
  if(!/includes closing/.test(cbFn) || !/setTimeout/.test(cbFn)){
    fail("the belt handler does not stage the close \u2014 the closing class plus " +
         "a delayed re-render is what lets the exit play");
  }
  if(!/prefers-reduced-motion/.test(cbFn)){
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
  /* Width has now moved exactly twice, both owner's calls, and this clause
     flipped with the second. 2.x: "a bit more compact" \u2014 230px, centered,
     and this guard required the max-width. 3.8.3 review: the chooser spans
     the column like everything else on Home \u2014 the owner's words, same
     review that cut the support card to a pill \u2014 so a max-width creeping
     back is now the regression. Shorter-than-a-full-row stays: the 34px
     buttons are the compact half that survived. */
  var tr = (HTML.match(/\.themerow\{[^}]*\}/) || [""])[0];
  if(/max-width/.test(tr)){
    fail("the theme row is capped again \u2014 3.8.3 spanned it to the column " +
         "width on the owner's call, and a returning max-width undoes a " +
         "recorded decision");
  }
})();

/* ---------- 98. The progress card is drawn here, from the real counts ---------- */
/* Design locked in design/progress-card.md: story-format canvas,
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
                (HTML.match(/sharecard"><h2>[\s\S]{0,600}?bkbtns[\s\S]{0,400}?<\/div>/) || [""])[0];
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
  /* The support line. Open item closed in 4.1.0: donations settled on Brave
     Creators (verified since 4.0.4 \u2014 no BTC, no fiat rails), and the owner
     specified the shape \u2014 one line, one word, a link \u2014 then supplied the
     words: "Keep the path lit." with Support carrying the link. Its seat is
     under the build line, because the reader who has scrolled to the app's
     machinery is the reader deciding whether it deserves keeping alive. The
     anchor sits inside the .note so it inherits the guarded underline \u2014
     the same colour-blind affordance "read the source" earned in 2.7.3. */
  if(!/<a href="https:\/\/publishers\.basicattentiontoken\.org\/en\/c\/nightwatcher" target="_blank" rel="noopener noreferrer">Support<\/a>/.test(HTML)){
    fail("the support line is gone \u2014 one line, one word, a link was the " +
         "owner's shape for the only ask the app makes, and Brave Creators " +
         "is the only rail");
  }
  if(!/Keep the path lit\. <a href="https:\/\/publishers\.basicattentiontoken\.org/.test(HTML)){
    fail("the support line lost its words \u2014 \"Keep the path lit.\" is the " +
         "owner's line, and Support is the one word that carries the link");
  }
  var slAt = HTML.indexOf("Keep the path lit.");
  if(slAt >= 0 && slAt < HTML.indexOf(">read the source</a>")){
    fail("the support line sits above the build line \u2014 its seat is under " +
         "it: the last line of the last tab, after the machinery, never " +
         "before it");
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
     Progress, and its title is a real heading like theirs — not a qhead
     whisper.

     3.4.5 MOVED THE LEVEL AND NOT THE RULE. Every heading Progress renders was
     an h3 under the wordmark's h1, with no h2 anywhere between them — the one
     axe violation in the whole app, and the only tab that had one. The four
     went up a level together, which is why this reads h2 now. What the owner
     asked for was that the title match the other blocks, and it still does;
     the level is the a11y tree's business, not the design's. */
  if(!/<div class="bk sharecard"><h2>Share your progress<\/h2>/.test(HTML)){
    fail("the share block is not a card — .bk with an h2 title is what every " +
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
  /* 4.3.1: the two seats that carried their offsets as inline styles carry
     them as classed rules now \u2014 margins live in the stylesheet, one source
     each (the same release levelled the four tab tops after Progress's own
     inline patch turned out to be the only correct one). The SEATS are what
     this section pins; the offsets moved, the seats did not. */
  if(!/class="qhead big gap"/.test(HTML)){
    fail("the Home grid heading lost the variant \u2014 one of the three named seats");
  }
  if(!/<p class="qhead big">Then<\/p>/.test(HTML)){
    fail('"Then" on Next up lost the variant \u2014 one of the three named seats');
  }
  if(!/<span class="qhead big">/.test(HTML) || !/\.sfhead \.qhead\{margin:0;\}/.test(HTML)){
    fail("the Progress fold headings lost the variant \u2014 one of the three named " +
         "seats (the span, or the .sfhead .qhead{margin:0} rule that flattens it)");
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
    blessHtml(HTML.replace(ldm[1], JSON.stringify(o)));
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
    /* THE SUBSTRING HOLE, FOUND 6 Aug 2026 AND CLOSED HERE. This read
           lt.indexOf("https://nightwatcher.life/") < 0
       while printing "llms.txt does not name the canonical URL". Those are not
       the same assertion: https://nightwatcher.life/orders.txt CONTAINS that
       substring, and llms.txt has carried that link since 2.6.0 — so the whole
       "Canonical URL:" line could be deleted and this section stayed green.
       Proven against the shipped file before it was touched. A guard's
       assertion is its code, not the sentence it prints when it fails.

       Matched as a LINE now, and against index.html's own canonical rather
       than a literal, so the two cannot drift apart either. The optional
       [text](url) shape is accepted because 3.2.0 makes these Markdown links —
       an engine asset that spells its links out in plain text is the thing
       Agentic Browsing marked us down for. */
    var wantCanon = (HTML.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || "";
    var cline = lt.match(/^Canonical URL:[ \t]*(?:\[[^\]]*\]\(([^)]+)\)|(\S+))[ \t]*$/m);
    if(!wantCanon){
      fail("index.html has no canonical URL, so llms.txt's cannot be checked " +
           "against it — section 38 owns that one");
    } else if(!cline){
      fail("llms.txt has no \"Canonical URL:\" line — and the URL may still " +
           "appear elsewhere in the file, because orders.txt's own link " +
           "contains it character for character. That is why this is matched " +
           "as a line and not as a substring");
    } else if((cline[1] || cline[2]) !== wantCanon){
      fail("llms.txt's canonical line names " + (cline[1] || cline[2]) +
           ", index.html's <link rel=canonical> names " + wantCanon +
           " — two copies of one address, and they have drifted");
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

/* ---------- 103. The tick repaints one ROW, and cannot drift ---------- */
/* 2.5.0, optimization report \u00a73.8 \u2014 the one the report called genuinely
   risky, shipped behind arithmetic instead of nerve. The tick path
   (toggleWatched/toggleSkip) repaints the row's group through groupBlock()
   \u2014 the same builder viewWatch() composes from, so the two cannot disagree
   by construction \u2014 plus the header through renderHead(). Everything
   outside the targeted condition (another tab, a filter, a search) falls
   back to the full render. The real gate lives in smoke: after every driven
   tick, a forced full render must serialize byte-for-byte identical. This
   section holds the shape so the gate always has something to gate.

   3.4.1 SUPERSEDES THE PARAGRAPH ABOVE, AND THE SHAPE IT HELD WAS THE DEFECT.
   Everything it says about drift is still true and still enforced below. What
   it got wrong was the granularity. It required tickUpdate() to rebuild the
   whole GROUP through groupBlock() and replaceChild it in \u2014 and .group
   carries content-visibility:auto with contain-intrinsic-size:auto 64px, so
   the replacement is a brand-new element with no remembered size and renders
   as a 64px placeholder until layout catches up. Measured at 390x844 in the
   click's own task: the ticked group falls 3418px -> 66px and the document
   loses 3352px underneath the reader. In Bruce's life, where an era is six
   times a universe, that is the whole screen.

   THE CHECK THAT SHOULD HAVE CAUGHT IT COULD NOT SEE IT. 3.4.0 added a browser
   drive for exactly this and asserted on window.scrollY, which reads 8780 ->
   8780 across the defect: the offset does not move, the content does. It also
   ran only filter ess and filter core, and BOTH of those take the fallback
   branch on the very line this section pins. The default state \u2014 no filter,
   no search, where every reader starts \u2014 had never been driven at all.
   qa/soak-3.4.0-tick-jump.md.

   With filter "all" and no query, groupBlock's seven filter clauses all fall
   through and matches() returns true, so THE ROW SET CANNOT CHANGE. A tick can
   change exactly three things: the row, the "n of m" in the group head, and
   the head's progress bar. So the row is replaced through filmRow() \u2014 .film
   carries no content-visibility and cannot collapse \u2014 and the other two are
   written in place, the way groupUpdate() has always done it. Nothing creates
   a .group element outside the full render any more, which is the class of
   defect rather than this instance of it.

   The anti-drift argument is unchanged and is now stronger: filmRow() is the
   same row builder groupBlock() composes from, and gSub()/gPct() are the same
   two helpers the head is built from, so a second copy of any of the three
   cannot exist. The smoke gate still has the last word. */

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
  if(!/renderHead\(counts\(\)\)/.test(tu)){
    fail("tickUpdate() does not update the header through renderHead() " +
         "\u2014 a second copy of it is a drift waiting for a release");
  }
  if(/groupBlock\(/.test(tu)){
    fail("tickUpdate() builds a group again. That is the 3.4.1 defect exactly: " +
         "the replacement .group is a new element, content-visibility:auto has " +
         "no remembered size for it, and it renders at contain-intrinsic-size " +
         "\u2014 3418px to 66px, measured. The tick repaints a ROW");
  }
  if(!/filmRow\(f\)/.test(tu)){
    fail("tickUpdate() does not rebuild the row through filmRow() \u2014 whatever " +
         "it does instead is a second implementation of the row, and the smoke " +
         "gate exists because that is how the two drift");
  }
  if(!/gSub\(g\)/.test(tu) || !/gBarFill\(g\)/.test(tu)){
    fail("tickUpdate() no longer writes the group head through gSub()/" +
         "gBarFill() \u2014 those are the helpers groupBlock() builds the head " +
         "from (gBarFill since 4.0.0, when the bar grew its steel skip " +
         "segment), and a second copy of either means the count under your " +
         "thumb and the count after a redraw can disagree");
  }
  var gb = optionalFn("groupBlock", "the head helpers cannot be checked");
  if(gb && (!/gSub\(g\)/.test(gb) || !/gBarFill\(g\)/.test(gb))){
    fail("groupBlock() no longer builds the head from gSub()/gBarFill() \u2014 " +
         "the shared helpers are the whole reason the tick path and the full " +
         "render cannot disagree about a group's tally, in count or in fill");
  }
  /* 4.4.0: the call grew a third argument — upNext()'s id, computed once per
     render, so the here-group mark (the cut corners) never scans the pool 44
     times. The composition is the same; only the signature moved. */
  if(!/groupBlock\(g, q, nid\)/.test(optionalFn("viewWatch",
       "the tick path would have nothing to compose from"))){
    fail("viewWatch() no longer composes from groupBlock() \u2014 the tick path " +
         "and the full render just became two implementations");
  }
  var creators = HTML.split('class="group').length - 1;
  if(creators > 1){
    fail("a .group element is built in " + creators + " places in index.html. " +
         "It has to be exactly one \u2014 groupBlock() \u2014 or something other " +
         "than the full render can create a group, and a fresh .group collapses " +
         "to its contain-intrinsic-size the instant it lands");
  }
  note("the tick repaints one row in place; nothing outside the full render " +
       "builds a .group");
})();

/* ---------- 104. The security headers the tree owns ------------------- */
/* THE TITLE OF THIS SECTION USED TO BE "the security headers the edge cannot
   set", and the comment under it used to say: "Cloudflare Response Header
   Transform Rules do not apply to responses a Worker generates... A rule was
   created in the dashboard on 4 Aug 2026, showed Active, and set nothing —
   verified against a cache HIT, a cache MISS and a 404."

   BOTH WERE WRONG, FOUND 8 AUG 2026. A Response Header Transform Rule reaches
   a Worker response and overrides this file. A rule named "Security headers",
   active on all incoming requests, was setting Permissions-Policy,
   Referrer-Policy and X-Frame-Options — and for the whole of 3.4.2 the wire
   served ITS Permissions-Policy while this section stayed green, because this
   section reads the file and the file was right. The 4 Aug rule that "set
   nothing" is the whole error: a rule that sets nothing is not evidence about
   rules that do. An instrument used to rule something out must be able to see
   it, and a no-op rule cannot.

   WHAT DOES NOT CHANGE IS WHERE THE HEADERS LIVE, and now for a reason that
   survives being checked: a file in the tree can be diffed, guarded and shipped
   inside a release; a dashboard rule can be none of those. The rule was deleted
   in 3.4.3. NOTHING HERE GUARDS THAT IT STAYED DELETED — this section reads the
   tree, and a guard pretending to read the wire would be worse than an honest
   gap. The wire check is in the release checklist.
   qa/sweep-repo-page-dns-2026-08-08.md.

   HSTS and X-Content-Type-Options are deliberately NOT here: those are set at
   the edge (SSL/TLS panel and Managed Transforms), and setting them twice would
   mean two places to be wrong.

   CSP is deliberately not here either. It lives in the <meta> tag whose hash
   section 10 blesses against the one inline script; splitting one rule across
   two files is how the hash goes stale without anything noticing. */

(function(){
  var hp = path.join(PUBLIC, "_headers");
  if(!fs.existsSync(hp)){
    fail("docs/_headers is missing \u2014 the app would serve no Referrer-Policy, " +
         "no X-Frame-Options and no Permissions-Policy, and nothing at the edge " +
         "is setting them since the Transform Rule was deleted in 3.4.3");
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

  /* 3.7.1. WHICH RULE A HEADER SITS UNDER IS PART OF THE HEADER, AND UNTIL NOW
     THIS SECTION DID NOT SAY SO. Every entry below tested presence anywhere in
     the file. The whole of the 3.7.1 change is moving two lines out of /* and
     under / \u2014 and every assertion here would have stayed green through it,
     because a regex anchored with /m matches its line wherever that line sits.
     A guard's assertion is its code, not its name: this one was named for the
     headers the tree owns and asserted only that the strings existed somewhere.

     Parse the file into its rules and hold each header under the rule it
     belongs to. Cloudflare's _headers matches on PATH ONLY \u2014 never content
     type \u2014 and applies every matching rule cumulatively with no way to unset,
     so scope is expressed by which block a line sits in and by nothing else. */
  var BLOCKS104 = {};
  (function(){
    var cur = null;
    D.split("\n").forEach(function(l){
      if(/^\//.test(l)){ cur = l.trim(); BLOCKS104[cur] = BLOCKS104[cur] || []; return; }
      if(/^\s*$/.test(l)){ return; }
      if(cur){ BLOCKS104[cur].push(l); }
    });
  })();
  function block104(p){ return (BLOCKS104[p] || []).join("\n"); }

  if(!BLOCKS104["/"]){
    fail("docs/_headers has no / rule \u2014 since 3.7.1 that is where the two " +
         "Link: relations live, and without it the site declares no canonical " +
         "and points at no sitemap on the one URL that serves a document");
  }

  var PINNED104 = [["Referrer-Policy",   /^\s+Referrer-Policy:\s*strict-origin-when-cross-origin\s*$/m,
    "strict-origin-when-cross-origin", "/*"],
   ["X-Frame-Options",   /^\s+X-Frame-Options:\s*DENY\s*$/m, "DENY", "/*"],
   ["Permissions-Policy", /^\s+Permissions-Policy:\s*.*geolocation=\(\)/m,
    "a policy that at least denies geolocation", "/*"],
   /* 3.2.0. COOP severs window.opener for a cross-origin opener. This app
      reads .opener nowhere at all — checked, zero occurrences — every watch
      link is a plain target="_blank" navigation, and there is no popup flow,
      no OAuth and no payment frame. It is here rather than at the edge for the
      same reason as the three above — CORRECTED 8 AUG 2026: that reason used to
      be "a Response Header Transform Rule does not reach a Worker's response",
      which is false. The reason is that a rule cannot be diffed, guarded or
      shipped in a release, and this array is what watches the file.

      IT IS IN THIS ARRAY BECAUSE THE LINE IN _headers IS NOT SELF-GUARDING.
      Adding a header to that file and not to this list ships an unwatched
      header: nothing fails when it is there, and nothing fails when someone
      deletes it again. The file and this entry are one commit. */
   ["Cross-Origin-Opener-Policy", /^\s+Cross-Origin-Opener-Policy:\s*same-origin\s*$/m,
    "same-origin", "/*"],
   /* 3.4.2, and all three land here for the reason the comment above gives: a
      header in that file and not in this array is a header nothing watches. */
   ["Cross-Origin-Resource-Policy", /^\s+Cross-Origin-Resource-Policy:\s*same-origin\s*$/m,
    "same-origin", "/*"],
   /* MOVED FROM /* TO / IN 3.7.1, and the scope is now the assertion. An
      outside reading said the blanket canonical was why GSC returns Soft 404
      for /icon.svg. IT IS NOT — three live tests one hour apart on 10 Aug:
      /llms.txt carries this header, Google read it (User-declared canonical:
      https://nightwatcher.life/) and still answered "Page can be indexed";
      /icon-192.png reported User-declared canonical NONE, so a PNG is never
      evaluated as a document at all; only /icon.svg fails, because SVG is a
      renderable document format that renders with no text. The move ships on
      principle — a link relation describes a document and /* applied it to
      fonts, icons and sw.js — NOT on the reading that prompted it, and saying
      so here is the difference between a decision and a cargo cult.
      qa/favicon-serp-2026-08.md. */
   ["Link: sitemap", /^\s+Link:\s*<https:\/\/nightwatcher\.life\/sitemap\.xml>;\s*rel="sitemap"\s*$/m,
    "an RFC 8288 sitemap relation", "/"],
   ["Link: canonical", /^\s+Link:\s*<https:\/\/nightwatcher\.life\/>;\s*rel="canonical"\s*$/m,
    "an RFC 8288 canonical relation pointing at the apex", "/"],
   /* 3.8.4, the agent-discovery relation. Cloudflare's Agent Readiness panel
      (12 Aug 2026) read the response and found "no agent-useful relation
      types". The site has no API, so RFC 9727's api-catalog / service-doc
      would be fabrication; describedby is the honest registered relation and
      /llms.txt is the description it points at — the same file the Worker
      (guard 133) already serves when an Accept header prefers text/markdown.
      The target is site-relative BY DESIGN where the other two are absolute:
      canonical and sitemap name authoritative URLs; a describedby names a
      sibling of whatever origin served it. This regex pins the relative form
      — an absolute rewrite here should be a decision, not a drift. */
   ["Link: describedby", /^\s+Link:\s*<\/llms\.txt>;\s*rel="describedby"\s*$/m,
    "an RFC 8288 describedby relation pointing at /llms.txt", "/"]];
  PINNED104.forEach(function(t){
    if(!t[1].test(block104(t[3]))){
      fail("docs/_headers no longer sets " + t[0] + " to " + t[2] +
           " under its " + t[3] + " rule");
    }
  });

  /* The 3.7.1 move asserted from the other side, because the entries above can
     only ever say where a line IS. A header re-declared under /* while still
     present under / satisfies every check above and puts the canonical back on
     every asset — which is exactly the state 3.7.1 exists to leave. */
  [["Link: sitemap",   /^\s+Link:.*rel="sitemap"/m],
   ["Link: canonical", /^\s+Link:.*rel="canonical"/m],
   ["Link: describedby", /^\s+Link:.*rel="describedby"/m]].forEach(function(t){
    if(t[1].test(block104("/*"))){
      fail("docs/_headers declares " + t[0] + " under /* — a link relation " +
           "describes a document, and /* applies it to the fonts, the icons " +
           "and sw.js. It belongs under / , which is the whole HTML surface: " +
           "wrangler.jsonc pins not_found_handling to \"404-page\", not " +
           "single-page-application, and the app is one page with hash routing");
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

  /* 3.4.2 PUT TWO TOKENS IN THIS LIST AND ONE OF THEM DID NOT BELONG. The
     comment here used to read: "TWO DEAD TOKENS, ONE OF WHICH WAS SHOUTING.
     `usb` is not a registered Permissions-Policy feature, and Chrome logged
     'Unrecognized feature: usb' on every single page load."

     THAT IS WRONG AND 3.4.3 REVERSES IT. `usb` IS the policy-controlled feature
     for WebUSB and Chrome accepts it. The warning came from the 7 Aug scanner's
     own browser engine, not from Chrome and not from a malformed header: the
     live response carried usb=() while Chrome's console stayed silent through
     three loads. The triage that recorded it caught the same report's CSP error,
     its DNSSEC error and its HSTS error, and took the console warning at face
     value because a console warning feels like evidence rather than like a
     reading from one engine.

     WHAT THAT COST IS THE POINT OF LEAVING THIS WRITTEN DOWN. For one release
     this guard forbade putting back a legitimate header value — a guard
     blocking the correct state, which is worse than the noise it was written to
     stop.

     `interest-cohort` STAYS REFUSED, and for its own reason: it is the FLoC
     opt-out, FLoC was withdrawn, and the token really is dead.

     A HAND-MAINTAINED LIST INSIDE A GUARD IS THE GUARD. Growing or shrinking
     this array is the change, and negtest340 is the only thing that proves it
     — which is why the usb fixture came out in the same commit. Refused by name
     rather than pinned as a whole string: the policy is allowed to grow, and a
     future token deserves an argument rather than a diff. */
  var DEAD104 = ["interest-cohort"];
  var pp104 = (D.match(/^\s+Permissions-Policy:.*$/m) || [""])[0];
  DEAD104.forEach(function(t){
    if(new RegExp("\\b" + t + "\\s*=").test(pp104)){
      fail("docs/_headers declares " + t + " in Permissions-Policy — it is not " +
           "a live feature token. `interest-cohort` opts out of FLoC, which was " +
           "withdrawn. A policy naming something the browser does not know is " +
           "noise the next person has to rule out");
    }
  });

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
     "under a name, so re-fetching them buys nothing"],
    /* 3.4.2. A DAY, DELIBERATELY, AND NOT A YEAR. Both icons were served
       max-age=0 and revalidated on every visit — two conditional requests a
       visit, forever, for files that do not change. A year with immutable is
       only honest behind a content-hashed filename, and renaming the favicon is
       the one change forbidden before 19 Sep: "unstable or frequently changed"
       is a listed Google cause of favicon non-appearance, and this icon already
       changed twice in three days. qa/favicon-serp-2026-08.md. If the names ever
       become hashed these two move to the fonts' policy, and this comment is
       what says why they were not already there. */
    ["/icon.svg", /^\s+Cache-Control:\s*public,\s*max-age=86400\s*$/m,
     "a day — long enough to stop revalidating on every visit, short enough " +
     "that the name can stay stable"],
    ["/favicon.ico", /^\s+Cache-Control:\s*public,\s*max-age=86400\s*$/m,
     "a day, for the same reason as /icon.svg"],
    /* 3.7.2 (L-4 of the 10 Aug review): THE DOCUMENT ITSELF, DECLARED AT
       LAST. index.html is the entire app, and for non-SW visitors it rode
       whatever policy Workers Assets emits by default — the exact undeclared
       state whose consequences this file's own history records for sw.js.
       no-cache means revalidate before use, which is what a single-file app
       whose only update path is "serve the new file" wants. / is the whole
       HTML surface: wrangler.jsonc pins not_found_handling to "404-page", so
       no other path ever serves a document. */
    ["/", /^\s+Cache-Control:\s*no-cache\s*$/m,
     "no-cache — the document IS the app, and a non-SW visitor must " +
     "revalidate it or a bad deploy is sticky for exactly the readers the " +
     "service worker cannot help"],
    /* 3.7.2: the new icons take the same day as the two above, for the same
       reason — stable names, no content hash, and Google's stability rule. */
    ["/favicon-16x16.png", /^\s+Cache-Control:\s*public,\s*max-age=86400\s*$/m,
     "a day, same reasoning as /favicon.ico"],
    ["/favicon-32x32.png", /^\s+Cache-Control:\s*public,\s*max-age=86400\s*$/m,
     "a day, same reasoning as /favicon.ico"],
    ["/favicon-48x48.png", /^\s+Cache-Control:\s*public,\s*max-age=86400\s*$/m,
     "a day, same reasoning as /favicon.ico"],
    ["/apple-touch-icon.png", /^\s+Cache-Control:\s*public,\s*max-age=86400\s*$/m,
     "a day, same reasoning as /favicon.ico"],
    ["/mstile-144x144.png", /^\s+Cache-Control:\s*public,\s*max-age=86400\s*$/m,
     "a day, same reasoning as /favicon.ico"]
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
     answers. One rule, one path. The slice ends at the NEXT block, whichever
     it is — until 3.7.2 it ran to /sw.js, which swept the / block in between
     and would have called the document's own (correct, scoped) no-cache a
     blanket rule. */
  var starA = D.indexOf("\n/*\n");
  var starB = D.length;
  ["\n/\n", "\n/sw.js\n"].forEach(function(nb){
    var i104 = D.indexOf(nb, starA + 4);
    if(i104 >= 0 && i104 < starB) starB = i104;
  });
  var star = D.slice(starA, starB);
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

  /* THE NOTE IS DERIVED, NOT RESTATED. It named three headers by hand, and
     3.2.0 pinned a fourth — so the note would have gone on printing three
     while the array checked four, which is the drift this project fixes with
     a guard every other time it appears. It reads the list now. */
  /* The note prints each header WITH ITS SCOPE, because until 3.7.1 it printed
     the whole list followed by "on /*" and that sentence is now false for two
     of the seven. A passing note that states something untrue is the same
     defect as a failure message that does — it is read as evidence, and this
     is the file whose scopes are the thing under test. */
  note("_headers: " + PINNED104.map(function(t){ return t[0] + " on " + t[3]; }).join(", ") +
       ", no-cache on / and /sw.js, a year on /fonts/*, a day on the icon " +
       "set, and out of the offline shell");
})();

/* ---------- 105. The catalogue answers in plain text ------------------ */
/* B4, approved 4 Aug: a flat text export of the catalogue for anything that
   reads text rather than HTML — the same audience llms.txt talks to, given the
   data instead of a description. Separate file, so it costs the page nothing.

   IT CARRIED ONE ORDERING UNTIL 3.9.6, AND THE REASON IT DID IS STILL THE
   REASON THE FIX LOOKS LIKE THIS. By universe needs no sort: each continuity's
   array IS its spoiler-safe order, exactly as guard 78 relies on for the seed.
   Bruce's life and Release order are computed, and they were computed by two
   ANONYMOUS comparators inside buildGroups() — and fn() can only extract NAMED
   functions. Writing them out here would have been a second implementation of
   the app's ordering, the one thing this file exists to prevent: a copy drifts,
   stops testing the app, and from here it would have started PUBLISHING the
   drift. That is why the export shipped short for thirteen releases rather than
   being "completed" by someone with a spare afternoon.

   3.9.6 NAMED THEM INSTEAD. lifeCmp and releaseCmp are functions in index.html
   with byte-identical bodies, buildGroups() sorts through them, and this
   section extracts both — one source, both sides. Guard 141 asserts the app has
   not quietly re-inlined a copy, which would put the drift back while leaving
   this file looking right.

   THE BUCKET IS PART OF THE ORDERING. Neither comparator is a total order:
   lifeCmp runs inside an era, releaseCmp inside a decade, and the bucket list
   does the coarse ordering. Sorting the flat catalogue with either would give a
   plausible-looking wrong answer — so the two loops below mirror buildGroups()
   rather than the shortcut, and a count check refuses to publish an ordering
   that carries fewer than every entry.

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
    "ALL THREE ORDERINGS ARE BELOW, in the order the app offers them. Each is",
    "the whole catalogue, ordered a different way — read one and ignore the rest.",
    "",
    "  1. BY UNIVERSE — every continuity kept whole, each in its own story",
    "     order, and the continuities in the order their stories start.",
    "     Nothing spoils anything ahead of it. The completist's way through.",
    "  2. BRUCE'S LIFE — all " + PATH.length + " continuities blended into one chronology,",
    "     from before there is a Batman to after there is not. This one is an",
    "     interpretation rather than a canon, and the app says so too.",
    "  3. RELEASE ORDER — " + Math.min.apply(null, FILMS.map(function(f){ return f.y; })) +
      " to " + Math.max.apply(null, FILMS.map(function(f){ return f.y; })) +
      ", the only objectively complete ordering.",
    "",
    "The two computed orderings are produced by the app's own comparators,",
    "extracted from index.html rather than reimplemented here, so this file",
    "cannot disagree with what the app renders.",
    "",
    "No account, no advertising, nothing tracking what you watch. Progress stays",
    "in the reader's browser. Free software under the AGPL.",
    ""
  ];

  /* ONE ROW WRITER FOR ALL THREE ORDERINGS. Three copies of this would be three
     chances for one ordering to describe an entry differently from another, in
     a file whose whole claim is that it is the same data seen three ways. */
  function row(f, i){
    var bits = [f.fmt === "live" ? "live action" : "animated"];
    if(f.tv) bits.push("series");
    var tier = tierOf(f);
    if(tier === "e") bits.push("essential");
    else if(tier === "k") bits.push("core");
    else bits.push("optional");
    if(f.r) bits.push(f.r);
    if(f.b.indexOf("u") >= 0) bits.push("NOT OUT YET");
    return "  " + (i + 1) + ". " + f.t + (f.sub ? " — " + f.sub : "") +
           " (" + f.y + ") · " + bits.join(" · ");
  }
  function heading(text){
    lines.push(text);
    lines.push("-".repeat(text.length));
  }
  function banner(text){
    lines.push("=========================================================================");
    lines.push(text);
    lines.push("=========================================================================");
    lines.push("");
  }

  banner("ORDERING 1 OF 3 — BY UNIVERSE");
  PATH.forEach(function(g, gi){
    heading(g.n + ". " + g.name);
    FILMS.filter(function(f){ return f.gi === gi; }).forEach(function(f, i){
      lines.push(row(f, i));
    });
    lines.push("");
  });

  /* THE BUCKET IS PART OF THE ORDERING, which is why these two loops mirror
     buildGroups() rather than sorting the flat catalogue. Neither comparator is
     a total order on its own: lifeCmp runs inside an era and releaseCmp inside
     a decade, and the bucket list does the coarse ordering. Sorting all 200
     entries with either one would produce a plausible-looking wrong answer —
     the failure this file would be publishing if the comparators had been
     rewritten here instead of extracted. Empty buckets are dropped and the
     numbering closes up, the same as the app's own filter-then-renumber. */
  banner("ORDERING 2 OF 3 — BRUCE'S LIFE");
  ERAS.forEach(function(era){
    var fs = FILMS.filter(function(f){ return f.e === era.k; }).slice().sort(lifeCmp);
    if(!fs.length) return;
    heading((era.k === 0 ? "—" : String(ERAS.indexOf(era) + 1)) + ". " + era.name);
    fs.forEach(function(f, i){ lines.push(row(f, i)); });
    lines.push("");
  });

  banner("ORDERING 3 OF 3 — RELEASE ORDER");
  DECADES.forEach(function(dec){
    var fs = FILMS.filter(function(f){ return f.y >= dec.k && f.y < dec.k + 10; })
                  .slice().sort(releaseCmp);
    if(!fs.length) return;
    heading(dec.k + "s. " + dec.name);
    fs.forEach(function(f, i){ lines.push(row(f, i)); });
    lines.push("");
  });

  var want = lines.join("\n");

  /* EVERY ENTRY APPEARS ONCE IN EACH ORDERING, and this is asserted rather than
     assumed. An era key or a decade bucket that matches nothing silently drops
     entries from an ordering, and a plain-text file gives a reader no way to
     notice that ordering 2 is short of ordering 1. */
  [["Bruce's life", FILMS.filter(function(f){
      return ERAS.some(function(e){ return e.k === f.e; }); }).length],
   ["release order", FILMS.filter(function(f){
      return DECADES.some(function(d){ return f.y >= d.k && f.y < d.k + 10; }); }).length]
  ].forEach(function(pair){
    if(pair[1] !== FILMS.length){
      fail("orders.txt's " + pair[0] + " ordering carries " + pair[1] + " of " +
           FILMS.length + " entries — a bucket matches nothing and the export " +
           "drops what falls between, which a reader of a text file has no way " +
           "to see. Every ordering is the whole catalogue or it is not shipped");
    }
  });

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
  /* 3.7.1 BROKE THIS CLAUSE'S BUILD AND THE CLAUSE WAS RIGHT TO BE SUSPECTED.
     It read the whole document with indexOf, comments included, so writing the
     export's NAME in a sitemap comment — explaining why the file is deliberately
     absent — failed the build with "orders.txt is in sitemap.xml" about a file
     that was not in it. A guard whose failure message states something false is
     worse than no guard: it is read as evidence, and the reader's first move is
     to go looking for a URL that is not there.

     THE FIX IS TO ASSERT THE THING THE RULE IS ABOUT. What matters is whether a
     crawler is being SUBMITTED the export, and that is expressed by <loc> and
     by nothing else. Comments are stripped first anyway — belt and braces, so
     that a commented-out <loc> in someone's work-in-progress cannot fail a
     build either.

     AND THE EMPTY CASE IS ASSERTED, because without it this check is vacuous.
     A sitemap that parses to zero <loc> values satisfies "no loc is the export"
     perfectly while being a broken sitemap, and a check that passes for the
     wrong reason is the shape this file keeps paying for. */
  var smPath = path.join(PUBLIC, "sitemap.xml");
  if(fs.existsSync(smPath)){
    var SM105  = fs.readFileSync(smPath, "utf8").replace(/<!--[\s\S]*?-->/g, "");
    var LOC105 = (SM105.match(/<loc>[^<]*<\/loc>/g) || []).map(function(m){
      return m.replace(/<\/?loc>/g, "").trim();
    });
    if(!LOC105.length){
      fail("sitemap.xml declares no <loc> at all — it submits nothing, and it " +
           "would satisfy every other check in this section by being empty");
    }
    LOC105.forEach(function(u){
      if(/\/orders\.txt$/.test(u)){
        fail("orders.txt is submitted in sitemap.xml as " + u + " — it carries " +
             "the same 200 entries as the crawlable seed, so indexing both asks " +
             "a search engine to choose between two near-identical bodies on " +
             "one domain");
      }
    });
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
/* 3.3.0 GREW THIS FROM A COUNT INTO A LIST, AND THE COUNT IS WHY IT HAD TO.
   It asserted that at least one icon link existed and that none was a data:
   URI, then printed how many it found. Adding a link changed the number it
   printed and nothing else — so the set of icons the page actually offers was
   never asserted at all, and any one of them could have been dropped in
   silence. Same shape as guard 115 counting three copies of the bat when there
   were four, and section 104 pinning three headers of four.

   What the set is for. A 6 Aug 2026 reading said the site offered "only a 192px
   PNG and an SVG" and recommended generating a raster. It was wrong: icon.png
   is 512x512 and has shipped since 1.x -- it was simply never linked from the
   head, only declared in the manifest. So the raster recommendation cost one
   line. favicon.ico is the genuinely new file, for the crawlers that still look
   at the classic root path first and nothing else.

   OUT OF THE OFFLINE SHELL, DELIBERATELY. A favicon is browser chrome: the app
   never renders it, and nothing about working offline depends on it. Section 13
   permits its absence from SHELL; this is the reasoning for why it is absent. */
(function(){
  var links = HTML.match(/<link[^>]*rel="(?:shortcut )?icon"[^>]*>/g) || [];
  if(!links.length){ fail("no <link rel=\"icon\"> in the head"); return; }
  links.forEach(function(l){
    if(/href="data:/.test(l)){
      fail("a favicon ships as a data: URI — browsers render it and search " +
           "engines cannot crawl it, because there is no URL to fetch and no " +
           "content type on the wire. Serve it as a file");
    }
  });

  /* The set, each with the reason it is offered. Grow this when a link is
     added; a link the page carries that is not named here fails below. */
  var WANT = [
    ["favicon.ico",  /rel="icon"[^>]*href="favicon\.ico"[^>]*sizes="any"|sizes="any"[^>]*href="favicon\.ico"/,
     "the classic root path, for crawlers that look there and nowhere else"],
    ["icon.svg",     /type="image\/svg\+xml"[^>]*href="icon\.svg"/,
     "the modern vector, preferred by every current browser"],
    ["icon-192.png", /sizes="192x192"[^>]*href="icon-192\.png"/,
     "the raster a phone uses for a home-screen tile"],
    ["icon.png",     /sizes="512x512"[^>]*href="icon\.png"/,
     "the large raster — shipped since 1.x, declared in the manifest, and " +
     "unlinked from the head until 3.3.0"],
    /* 3.7.2 GROWS THE SET BY THREE, closing the classic-size gap: the ico
       carries 16/32/48 as layers, but tools that read <link> tags rather than
       probing the root path never saw a plain PNG at tab sizes. All three are
       derived from icon.png by qa/make-favicon.py — generated, like the ico,
       so they cannot disagree with the bat that ships. */
    ["favicon-16x16.png", /sizes="16x16"[^>]*href="favicon-16x16\.png"|href="favicon-16x16\.png"[^>]*sizes="16x16"/,
     "the tab raster at 1x display scaling, declared for tools that read " +
     "links rather than probing the root ico"],
    ["favicon-32x32.png", /sizes="32x32"[^>]*href="favicon-32x32\.png"|href="favicon-32x32\.png"[^>]*sizes="32x32"/,
     "the tab raster at 2x"],
    ["favicon-48x48.png", /sizes="48x48"[^>]*href="favicon-48x48\.png"|href="favicon-48x48\.png"[^>]*sizes="48x48"/,
     "the size legacy crawlers historically expect, served as its own PNG too"]
  ];
  var head = HTML.slice(0, HTML.indexOf("</head>"));
  WANT.forEach(function(w){
    if(!w[1].test(head)){
      fail("the head no longer offers " + w[0] + " as an icon — " + w[2] +
           ". If it is genuinely not wanted, take it out of this list in the " +
           "same commit, so the set stays something that was decided");
    }
    if(!fs.existsSync(path.join(PUBLIC, w[0]))){
      fail("docs/" + w[0] + " is missing and the head points at it");
    }
  });

  /* Every icon href in the head has to be one of the four above. A fifth
     arriving unnamed is the thing the old count could not see. */
  var named = WANT.map(function(w){ return w[0]; });
  (HTML.match(/<link[^>]*rel="(?:shortcut )?icon"[^>]*href="([^"]+)"/g) || []).forEach(function(tag){
    var href = (tag.match(/href="([^"]+)"/) || [])[1];
    if(href && named.indexOf(href) < 0){
      fail("the head offers an icon this section does not know about: " + href +
           " — add it to the list with its reason, or it is an icon nobody " +
           "decided to ship");
    }
  });

  /* favicon.ico is a real ICO, not a PNG with the wrong extension. Some
     crawlers parse the container rather than trusting the name. */
  var ico = path.join(PUBLIC, "favicon.ico");
  if(fs.existsSync(ico)){
    var b = fs.readFileSync(ico);
    if(!(b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0)){
      fail("docs/favicon.ico does not begin with the ICO signature — a PNG " +
           "renamed to .ico works in browsers and is exactly the kind of thing " +
           "the crawlers that still want this path do not accept");
    } else if(b[4] < 2){
      fail("docs/favicon.ico carries " + b[4] + " image(s) — it exists to " +
           "serve the small sizes a browser tab and a crawler ask for, so it " +
           "carries several. Regenerate with qa/make-favicon.py");
    }
  }

  /* 3.7.2: THE PLATFORM ICONS, PINNED THE SAME WAY. apple-touch-icon carried
     icon-192.png — a transparent PNG that iOS composites onto black — until a
     dedicated 180×180 with the ink background shipped; the tile metas are for
     the one platform that reads neither the ico nor the manifest. None of
     these are rel="icon", so the sweep above cannot see them; each is pinned
     here with the file it points at. */
  [["apple-touch-icon.png",
    /<link rel="apple-touch-icon" href="apple-touch-icon\.png">/,
    "the 180×180 iOS home-screen icon, opaque on the ink background — iOS " +
    "ignores the manifest icons and composites transparency onto black"],
   ["mstile-144x144.png",
    /<meta name="msapplication-TileImage" content="mstile-144x144\.png">/,
    "the Windows tile raster, for the one platform that reads neither the " +
    "ico nor the manifest"]
  ].forEach(function(w){
    if(!w[1].test(head)){
      fail("the head no longer offers " + w[0] + " — " + w[2] +
           ". If it is genuinely not wanted, take it out of this list in the " +
           "same commit, so the set stays something that was decided");
    }
    if(!fs.existsSync(path.join(PUBLIC, w[0]))){
      fail("docs/" + w[0] + " is missing and the head points at it");
    }
  });
  [['<meta name="application-name" content="Night Watcher">',
    "application-name — what Windows and browser task surfaces call the app"],
   ['<meta name="msapplication-TileColor" content="#0C111C">',
    "msapplication-TileColor — the tile ground the raster sits on, the same " +
    "surface color the theme-color declares"]
  ].forEach(function(m){
    if(head.indexOf(m[0]) < 0){
      fail("the head lost " + m[1] + " — expected exactly: " + m[0]);
    }
  });

  note("favicon: " + links.length + " icon link(s) — " + named.join(", ") +
       " — plus apple-touch-icon and the tile metas, all served as files, " +
       "all out of the shell");
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
   Reserved Font Name Limelight"; the other faces' headers do not. Under OFL 1.1 a
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

    if(stripBlockComments(body.join("\n")).indexOf("fail(") < 0){
      fail("guard section " + mk.n + " contains no fail() outside a comment — " +
           "a section that cannot fail is documentation, not a guard, and a " +
           "fail() quoted in prose is documentation too");
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
  /* 3.4.5 MOVED THE SHAPE THIS COUNTED AND ALMOST LOST THE COUNT. mergeLog's
     timestamp check became validTs(en.ts) — isFinite(null) is true, which is
     how an entry with no timestamp came to date itself 1970 — and this pattern
     went from matching once to matching nothing. A copied-out dance would then
     have been the FIRST occurrence and passed. Both shapes are counted, because
     a call site copying the loop out is exactly as likely to copy the old
     isFinite version out of a stale editor buffer. */
  var dance = (HTML.match(/(?:isFinite|validTs)\(en\.ts\)/g) || []).length;
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
  /* 4.0.1: THE SECOND DOOR. render() preserved the paste, and the 4.0.0 idle
     refill (queueNeighbors → fillPanel) rebuilt the same panel WITHOUT it —
     paste a code on Progress, swipe away, and the paste was wiped
     milliseconds later by a path this section could not see because it only
     read render(). Both fill paths carry the box now, and both are pinned. */
  var fpr = optionalFn("fillPanel", "the background refill cannot be checked");
  if(fpr.indexOf("restorebox") < 0 || !/restorebox[\s\S]{0,240}\.value/.test(fpr)){
    fail("fillPanel() rebuilds a background panel without carrying " +
         "#restorebox — render() preserves the paste but the idle refill " +
         "after a swipe does not, and a pasted backup code vanishes the " +
         "moment the reader swipes away");
  }
  note("render() and fillPanel() carry #q and #restorebox across a repaint");
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
  /* INVERTED in 3.3.1 with its subject. This section existed to keep the
     README's paragraph about the old origin honest against what the app
     actually did there, and the app no longer does anything there: the mirror
     was unpublished 6 Aug 2026. What survives is the half that never depended
     on a second origin -- the README must not describe the retired move offer
     as something the app does, and must not promise the old address works. */
  if(/function offCanonical\s*\(/.test(HTML)){
    fail("offCanonical() is back in the app while this section assumes it is " +
         "gone \u2014 section 77 owns that, and this one can no longer be read " +
         "as agreeing with anything");
  }
  if(/still works and always will/i.test(para)){
    fail("the README promises the old GitHub Pages address still works and " +
         "always will. It was unpublished on 6 Aug 2026 and returns 404 \u2014 " +
         "that is a guarantee, not a description, and it is false");
  }
  if(!/\bunpublish|\bretired\b|404/i.test(para)){
    fail("the README's old-origin paragraph does not say the mirror was " +
         "retired. Describing a dead address without marking it dead is the " +
         "same failure the move offer survived four releases on");
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
  note("README's old-origin paragraph: mirror retired, no offer, no false promise");
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
    0x2197: "the external-link arrow",
    0x203A: "the chevron (carets, breadcrumbs, the deco pointer)",
    0x25C6: "the deco diamond"
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
   ["no spoilers",                    "the spoiler promise"]
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

  note("llms.txt summary carries the README's claims: filmed, animated and live action, no spoilers");
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
  /* 4.4.0 note: the deco pass squared the family, and a square corner is
     written border-radius:0 — no unit. The reader accepts the bare zero so the
     pairing keeps being READ from the two rules rather than remembered; what
     it asserts is unchanged: whatever edge one declares, both declare. */
  function px(rule, prop){
    var m = String(rule).match(new RegExp(prop + ":\\s*(\\d+(?:px)?)(?=[;}])"));
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
       px(skip, "min-height") + "/" + px(skip, "border-radius") + ", linkrow starts");
})();

/* ---------- 120. The page does not read layout after writing it ------- */
/* THE FAMILY, NOT THE MEMBER. Section 96 refused `scrollHeight` from 2.7.0,
   written when render()'s closing clamp came out — 216ms of forced layout on
   every render, invisible to the harness because jsdom has no layout and
   nothing here can observe a reflow by running the app. It refused one
   property NAME. On 6 Aug 2026 a Lighthouse run found a forced reflow of
   106.6ms desktop / 64.1ms mobile at the TOP of that same function, arriving
   as `window.pageYOffset || document.documentElement.scrollTop` — the same
   defect under a different name, walking straight past a guard written
   against the first one.

   It also moves the assertion out of section 96, which is titled "The Belt is
   one strip, and its pouches open from behind". The scrollHeight refusal was
   filed there because that is where the 2.7.0 work happened, not because it
   is what that section is about, and a guard filed under the wrong name is a
   guard the next reader does not find.

   TWO LISTS, AND THE SECOND IS THE HONEST PART. Properties this page does not
   read at all are refused outright. The ones it DOES read are PINNED to the
   exact sites that exist, each named — because refusing them today would fail
   the build over a defect that is real, known, planned and frozen until after
   19 Sep 2026. A guard that cannot be green against the tree it ships with is
   not a guard, it is a wish.

   3.3.0 CORRECTS THE LAST SENTENCE THIS COMMENT USED TO CARRY. It said the
   pins drop to zero when render()'s read is hoisted, and both members move up
   into REFUSED. That was wrong the moment it was written: the fix MOVES the
   read, it does not remove it, so the count is 1 before and 1 after and the
   pins stay exactly where they are. A count answers "how many" and can never
   answer "in what order" -- and order is the whole of this defect. The ORDER
   clause below is the half that can see the fix.

   3.9.7 MOVES THE SCROLL OFF THE DOCUMENT (the tab-swipe groundwork). The
   keep-read is scrollKeep() on #app now: window.pageYOffset appears nowhere
   and joins REFUSED, and the scrollTop pin widens to 2 for the seam every
   scroll site goes through -- scrollKeep() the one read, scrollPut() the one
   write. Reading an element's scrollTop forces layout exactly the way the
   window read did when a write has already landed in the same task, so the
   ORDER clause keeps its job and tracks scrollKeep(). */

(function(){
  /* Never read here. Any appearance is a new forced-layout site. */
  var REFUSED = ["scrollHeight", "scrollY", "pageYOffset", "offsetTop",
                 "offsetWidth", "clientHeight", "clientWidth",
                 "getComputedStyle"];

  /* Read here, exactly this many times, for exactly this reason. The count is
     the assertion: one more is a new site, one fewer means the fix landed and
     this entry moves to REFUSED. */
  var PINNED = [
    ["innerWidth", 1,
     "vpShrunk()'s orientation gate, argued in 4.0.8. WINDOW metrics, not " +
     "element layout — reading them forces nothing — but they sat in " +
     "REFUSED because sizing layout from them is how viewport bugs get " +
     "hand-rolled. The heal is the one caller: it compares the window to " +
     "the screen to DETECT a stale standalone grant, off the render path, " +
     "behind the standalone gate. A second appearance has to be argued for"],
    ["innerHeight", 2,
     "both in vpShrunk(), argued in 4.0.8: once against innerWidth (the " +
     "portrait gate) and once against screen.height (the shrink test) — " +
     "the two comparisons that decide the heal may run at all. Window " +
     "metrics, no reflow; the danger they were refused for is sizing " +
     "layout from them, and nothing here sizes anything. A third " +
     "appearance has to be argued for"],
    ["scrollTop", 2,
     "the whole of the app's scroll seam, and the only two places the name " +
     "may appear: scrollKeep() reads #app's position — render()'s keep, " +
     "still the FIRST line of the function (hoisted in 3.3.0; the ORDER " +
     "clause below still holds it there, because the hoist cut a 106.6ms " +
     "desktop / 64.1ms mobile forced reflow and a residue of ~46ms is " +
     "inherent to being called after other code has written in the same " +
     "task, qa/pagespeed-3.3.1.md) — and scrollPut() writes it, and every " +
     "restore, go-to-top and belt retraction goes through the pair. 3.9.7 " +
     "moved scroll off the document onto #app: window.pageYOffset appears " +
     "nowhere and sits in REFUSED above, and the element read took over its " +
     "pin. A third appearance is a scroll site outside the seam and has to " +
     "be argued for here"],
    ["offsetHeight", 2,
     "ONE: the header's own height, measured once to set --hdrh when the " +
     "store is blocked (it wrote --ghtop until 3.5.0 derived --ghtop from " +
     "--hdrh — one source, section 128). Read THEN write, correct order, " +
     "not a forced reflow. TWO, argued in 4.0.8: vpHeal()'s read of " +
     "documentElement.offsetHeight after writing display:none — a forced " +
     "reflow ON PURPOSE, because the reflow IS the mechanism: it is the " +
     "one thing that makes WebKit re-resolve a stale standalone viewport " +
     "grant, runs at most a handful of times per session behind four " +
     "gates, and never on the render path. A third appearance has to be " +
     "argued for"],
    ["getBoundingClientRect", 4,
     "3.8.3's search-box anchor, the soak fix for the box that jumped while " +
     "you typed. Refused since this section existed; admitted now because " +
     "the fix IS a measurement — hold the box where it was, which cannot be " +
     "done without knowing where it was. Read ONE: the box's viewport top, " +
     "hoisted to render()'s opening reads next to pageYOffset, ABOVE the " +
     "first write — it rides the same layout the keep-read already forces, " +
     "so it costs nothing (the order clause below stays satisfied). Read " +
     "TWO: the box's top after the rebuild, taken AFTER scrollPut(keep) " +
     "has already flushed the new layout, so it reads a clean tree and " +
     "forces nothing; the drift between the two is handed to scrollBy and " +
     "the box stands still. Both reads are gated on the box being focused — " +
     "every render that is not mid-typing skips them. READS THREE AND FOUR, " +
     "argued in 4.1.2: groupUpdate()'s collapse anchor — the same shape as " +
     "the search-box pair, applied to the sticky group head. The panel " +
     "scrolls, the head is position:sticky, and overflow-anchor is off by " +
     "design, so closing a long group from deep inside left scrollTop " +
     "pointing ~1,300px past the list that remained: the clicked head landed " +
     "1,200px above the viewport and the reader somewhere else in the path. " +
     "Read THREE takes the head's viewport top before the class toggle — the " +
     "first layout touch in the click's task, so the tree is clean and it " +
     "forces nothing. Read FOUR re-reads it after the toggle — a forced " +
     "reflow ON PURPOSE, because the drift between the two IS the fix, " +
     "handed to scrollPut so the head stays under the finger that closed it. " +
     "Once per head click, never on the render path; opening a group drifts " +
     "0 and writes nothing. A FIFTH read is a new site and has to be argued " +
     "for here"],
    ["scrollLeft", 1,
     "4.0.0's swipe viewport, read in exactly one place: swipeRead(), " +
     "inside the rAF the throttled listener schedules, so it rides a frame " +
     "boundary and never lands mid-task after a write. It is divided by a " +
     "width the ResizeObserver DELIVERED rather than a width anybody read " +
     "— clientWidth stays refused above — and the quotient is the active " +
     "tab. Nothing ever WRITES scrollLeft: the programmatic tab change goes " +
     "through scrollIntoView (snapTo), which is the browser's own arithmetic " +
     "and no layout read of ours. A second appearance is a new swipe site " +
     "and has to be argued for here"]
  ];

  REFUSED.forEach(function(prop){
    if(HTML.indexOf(prop) >= 0){
      fail("index.html reads " + prop + " — reading layout in a function that " +
           "also writes it forces a synchronous reflow of the document, and " +
           "jsdom has no layout, so nothing else in this harness can see it. " +
           "If this read is deliberate, pin it in section 120 with its reason " +
           "rather than deleting the check");
    }
  });

  var pins = 0;
  PINNED.forEach(function(t){
    var prop = t[0], want = t[1], why = t[2];
    var got = HTML.split(prop).length - 1;
    pins += got;
    if(got > want){
      fail("index.html reads " + prop + " " + got + " times; this build was " +
           "reviewed with " + want + ". A new layout read arrived — " + why);
    } else if(got < want){
      fail("index.html reads " + prop + " " + got + " times, down from " +
           want + " — if the reflow fix landed, move " + prop + " into " +
           "REFUSED in the same commit, because a pin nothing satisfies " +
           "certifies the next one that arrives");
    }
  });

  /* ---- ORDER, which is the thing the counts above cannot see ----------
     render() reads the scroll position so it can restore it after the repaint.
     Reading it AFTER flagSave(), applyTheme() and renderHead() have written
     forces a synchronous layout of the whole document -- 106.6ms desktop,
     64.1ms mobile, ~98% of LCP and the page's only long task, measured 6 Aug
     2026. Hoisting the read above the first write costs nothing and removes
     all of it: the value is identical either way, because a DOM write does not
     move the scroll position.

     Asserted on source order rather than on behaviour, because jsdom has no
     layout and nothing in this harness can observe a reflow by running the
     app. That is the same reason section 96 refused scrollHeight by name in
     2.7.0, and the same limitation that let this one walk in under a different
     one. */
  var rbody = (HTML.match(/function render\(\)\{[\s\S]*?\n\}/) || [""])[0];
  if(!rbody){
    fail("render() cannot be located, so the order of its first layout read " +
         "cannot be checked — section 120's ORDER clause is blind, which is " +
         "worse than absent");
  } else {
    var readAt  = rbody.search(/scrollKeep\(/);
    var writeAt = rbody.indexOf("flagSave()");
    if(readAt < 0){
      note("render() no longer reads the scroll position at all — if that is " +
           "deliberate, move scrollTop into REFUSED above");
    } else if(writeAt < 0){
      fail("render() no longer opens with flagSave(), so the first write in the " +
           "function is unknown and the scroll read cannot be placed against it");
    } else if(readAt > writeAt){
      fail("render() reads the scroll position after it has already written — " +
           "flagSave() comes first, so the read at offset " + readAt + " forces a " +
           "synchronous layout of the whole document on every render. Hoist the " +
           "read above the first write; the value is the same and the reflow is " +
           "not. This is the 6 Aug 2026 finding, and a count of the property " +
           "names cannot see it, because the fix moves the read rather than " +
           "removing it");
    }
  }

  note("layout reads: " + REFUSED.length + " properties refused outright, " +
       pins + " pinned read(s) across " + PINNED.length + " named sites, scroll " +
       "read before the first write");
})();

/* ---------- 121. The privacy footer says what the README says --------- */
/* 3.2.0 REWROTE ONE COPY OF THIS CLAIM AND LEFT THE OTHER, AND NOTHING NOTICED.
   Removing the analytics beacon changed what is true about how visits are
   counted: it is the host answering a request, with nothing on the page. The
   README's bullet was rewritten to say exactly that. The app's own footer went
   on saying "Cloudflare counts visits" -- still literally true, and still the
   sentence a reader meets first.

   Section 117 ties llms.txt to the README. Section 114 ties the old-origin
   paragraph to offCanonical(). NOTHING tied the app's privacy footer to the
   README's privacy copy, which is the only reason one could move without the
   other. Two copies of one claim, and the fix is a guard asserting they agree.

   NOT A WORD MATCH. The two are written for different readers and their
   phrasing is allowed to differ entirely. What is asserted is that the CLAIM
   survives the copy: both say counting happens, and both say the host does it
   rather than anything on the page. Reword either freely; drop the claim from
   one and this goes red. */

(function(){
  var foot = (HTML.match(/<p class="homefoot">[\s\S]*?<\/p>/) || [""])[0];
  if(!foot){
    fail("the Home footer is gone — it is where the app states its own " +
         "privacy claim to a reader who will never open the README");
    return;
  }
  var bullet = (README.match(/^- \*\*Anonymous visit counts[^\n]*/m) || [""])[0];
  if(!bullet){
    fail("the README's visit-counting bullet is gone — section 121 has " +
         "nothing to hold the footer against");
    return;
  }

  [["counts", "that counting happens at all — the app has never hidden it"],
   ["host",   "WHO counts: the host answering the request, not anything on the page"]
  ].forEach(function(c){
    if(foot.toLowerCase().indexOf(c[0]) < 0){
      fail("the Home footer no longer carries \"" + c[0] + "\" — " + c[1] +
           ". The README's bullet still claims it, and a reader meets the " +
           "footer first");
    }
    if(bullet.toLowerCase().indexOf(c[0]) < 0){
      fail("the README's visit-counting bullet no longer carries \"" + c[0] +
           "\" — " + c[1] + ", and the footer still says it");
    }
  });

  /* The asymmetric half, and the one 3.2.0 needed. If the README promises
     nothing runs on the page, the footer has to name the host as the counter
     or a reader is left to assume the opposite. */
  if(/no script on the page/i.test(bullet) && !/host/i.test(foot)){
    fail("the README promises no script on the page while the footer does not " +
         "say who counts — exactly the drift 3.2.0 shipped");
  }

  note("privacy claim: footer and README agree on counting, and on the host " +
       "doing it");
})();

/* ---------- 122. The scroll restore survives content-visibility ---------- */
/* THE DEFECT THIS EXISTS TO STOP COMING BACK, 3.4.0.
   render() ended with `if(keep) window.scrollTo(0, keep);`. The line is
   correct in isolation and wrong in place: it runs in the same task as
   `v.innerHTML = ...`, and .group carries content-visibility:auto, so every
   off-screen group still measures its contain-intrinsic-size rather than its
   real height. The document is about a third as tall as it is about to be, the
   browser clamps the scroll to that shorter maximum, and the reader loses
   their place. Measured 2233 -> 1011 at 390x844 with the row count and the
   final document height both unchanged, which is what rules out any
   content explanation. qa/soak-3.3.2-scroll-restore.md.

   It reached every caller that relies on render() to hold position -- the
   filter chips, peek, the belt, mkcode, the theme buttons -- and it survived
   because nothing could see it. Section 103 asserts what tickUpdate CALLS.
   The smoke gate serializes HTML, and a scroll leaves no mark in markup.
   browser-check.mjs did not click a tick until this release. Three green
   instruments and one defect, which is the same shape as 3.3.2's jump.

   Asserted on source, because jsdom has no layout and nothing in this harness
   can watch a scroll clamp -- the same limitation section 120 works around,
   and the same one that let this walk in.

   3.9.7: the restore is scrollPut(keep) on #app, not window.scrollTo -- the
   window is checked as a banned scroller where the lock is asserted. The
   clamp is #app's own maximum now, and #app is exactly as short under
   content-visibility as the document used to be, so .settling keeps its job
   unchanged: the class has to be on #view when the browser computes the
   element's maximum scroll offset. */
(function(){
  var rbody = (HTML.match(/function render\(\)\{[\s\S]*?\n\}/) || [""])[0];
  if(!rbody){
    fail("render() cannot be located, so the scroll restore cannot be checked " +
         "— section 122 is blind, which is worse than absent");
    return;
  }
  if(/if\s*\(\s*keep\s*\)\s*(window\.scrollTo|scrollPut)/.test(rbody)){
    fail("render() restores the scroll with a bare restore again. That " +
         "is the 3.3.2 defect exactly: content-visibility:auto means the " +
         "scroller is short at this instant and the browser clamps the restore. " +
         "The scroll must land while .settling is on #view");
  }
  if(rbody.indexOf('classList.add("settling")') < 0){
    fail("render() no longer adds .settling before restoring the scroll — " +
         "without it the document is measured at contain-intrinsic-size and the " +
         "restore clamps");
  }
  if(rbody.indexOf('classList.remove("settling")') < 0){
    fail("render() adds .settling and never removes it — content-visibility " +
         "would stay off for every group from the first restore onward, which " +
         "gives back the whole reason .group carries it");
  }
  if(rbody.indexOf("requestAnimationFrame") < 0){
    fail("render() removes .settling without waiting a frame — the class has " +
         "to outlive the layout the scroll forces, or it has bought nothing");
  }
  var addAt = rbody.indexOf('classList.add("settling")');
  var scrollAt = rbody.indexOf("scrollPut(");
  if(scrollAt < 0){
    fail("render() never calls scrollPut — the restore is gone, or it is " +
         "reaching the scroller some other way; either way section 122 can " +
         "no longer see the one call it exists to order");
  }
  if(addAt >= 0 && scrollAt >= 0 && addAt > scrollAt){
    fail("render() scrolls before it adds .settling — the order is the fix. " +
         "The class has to be on the element when the browser computes the " +
         "maximum scroll offset, not after");
  }
  if(!/#view\.settling\s+\.group\s*\{[^}]*content-visibility\s*:\s*visible/.test(HTML)){
    fail("the .settling rule is gone from the CSS, or no longer sets " +
         "content-visibility:visible — render() is toggling a class that " +
         "styles nothing, and the restore clamps in silence");
  }
  if(!/\.group\s*\{[^}]*content-visibility\s*:\s*auto/.test(HTML)){
    fail("content-visibility:auto is gone from .group. If that was deliberate " +
         "the restore no longer needs .settling and this section and the CSS " +
         "rule come out together — but it is load-bearing for the Performance " +
         "score, so it wants a decision rather than a deletion");
  }
  note("scroll restore: held against content-visibility, class added before " +
       "the scroll and dropped a frame after it");
})();

/* ---------- 123. Focus restores never move the viewport ---------- */
/* 3.4.0. tickUpdate restored focus with a bare back.focus(), the only one of
   the three button-focus restores in the app without preventScroll -- rowUpdate
   and render() both had it. It was never observed to move the viewport, which
   is exactly why it is worth pinning: an assertion-free difference between
   three sites that do the same job is a coin that has not landed yet.

   The other half of the same defect: tickUpdate looked only for
   [data-act="watched"], and querySelector returns the row's own tick. Tapping
   Mark watched or Skip inside an open row, or any star, destroyed the focused
   button and dropped focus to <body> -- three of four controls at 390x844.
   That is checked here too, because a focus restore that finds the wrong
   element is worse than one that finds none. */
(function(){
  var SITES = ["rowUpdate", "tickUpdate", "render"];
  SITES.forEach(function(fn){
    var re = new RegExp("function " + fn + "\\([^)]*\\)\\{[\\s\\S]*?\\n\\}");
    var body = (HTML.match(re) || [""])[0];
    if(!body){
      fail("section 123 cannot locate " + fn + "(), so its focus restore is " +
           "unchecked");
      return;
    }
    if(body.indexOf(".focus(") < 0) return;      /* no restore here to check */
    if(body.indexOf("preventScroll") < 0){
      fail(fn + "() restores focus without preventScroll. The other restores " +
           "pass it, and restoring focus must not move the viewport — this is " +
           "the 3.4.0 finding, and it is the difference that had no reason");
    }
  });

  var tbody = (HTML.match(/function tickUpdate\([^)]*\)\{[\s\S]*?\n\}/) || [""])[0];
  if(!tbody){
    fail("tickUpdate() cannot be located, so the control it returns focus to " +
         "cannot be checked");
  } else if(/var back = v\.querySelector\('\[data-act="watched"\]/.test(tbody)){
    fail("tickUpdate() is looking for [data-act=\"watched\"] again when it puts " +
         "focus back. querySelector returns the row's own tick, so Mark " +
         "watched and Skip inside an open row, and every star, lose focus to " +
         "<body>. It has to restore the control that actually had it");
  } else if(tbody.indexOf("document.activeElement") < 0){
    fail("tickUpdate() no longer reads document.activeElement, so it cannot " +
         "know which control held focus before it replaced the group");
  }
  /* 3.4.4 deep QA §2.6. The snapshot keys on {data-act, data-id} and a row
     holds TWO buttons matching [data-act="watched"][data-id=x] — the tick, and
     the open detail panel's action button. Both restores rebuild a selector
     from the snapshot and take the first match, which is the tick, so a
     keyboard user who activated the detail button was put back on the small
     tick at the other end of the row. Neither restore was wrong about which
     element had focus; the KEY could not tell the two apart. data-src is the
     discriminator, and it is only worth anything if both key lists carry it. */
  if(!/data-act="watched" data-src="detail" data-id=/.test(HTML)){
    fail("the detail panel's action button has no data-src, so it is " +
         "indistinguishable from the row's own tick in a focus snapshot — a " +
         "keyboard user who presses it lands back on the tick");
  }
  [["tickUpdate", /\["act", "id", "n", "gk", "tf", "src"\]/],
   ["render", /"n","pk","src"\]/]].forEach(function(pair){
    if(!pair[1].test(HTML)){
      fail(pair[0] + "()'s focus snapshot no longer reads data-src, so the " +
           "discriminator on the detail button is written and never used");
    }
  });
  note("focus restores: preventScroll at every button site, tickUpdate " +
       "returns focus to the control that had it, and data-src tells the " +
       "row's two watched buttons apart");
})();

/* ---------- 124. Every face is asked for before the CSS finds it ---------- */
/* 3.4.2, and the measurement is the whole argument. The 7 Aug Cloudflare Radar
   scan timed all six faces: Limelight and Anton carried <link rel=preload> and
   went out at 287-293ms; the four IBM Plex faces had none, were discovered only
   after the inline CSS was parsed, and did not request until 467-501ms despite
   the browser knowing about them at ~293ms. Each then took 213-239ms. That
   stall is the entire 141ms between domContentLoaded (396ms) and domComplete
   (537ms) -- not a byte problem, a discovery-order problem.

   Asserted on the head rather than on timing, for the reason section 120 gives:
   jsdom has no network and no layout, so nothing in this harness can watch a
   request go out late. What CAN be checked is that every @font-face src in the
   document has a preload naming the same file. That is a set equality, so it
   fails in both directions -- a new face without a preload, and a preload for a
   face that no longer exists.

   Two faces were already preloaded before this release and are covered by the
   same rule; they are not special-cased, because a rule with an exception is a
   rule someone will extend. */
(function(){
  var head = HTML.slice(0, HTML.indexOf("</head>"));
  var faces = [], pre = [], m;
  var fre = /src:url\("(fonts\/[a-z0-9.\-]+\.woff2)"\)/g;
  while((m = fre.exec(HTML))) { if(faces.indexOf(m[1]) < 0) faces.push(m[1]); }
  var pre_re = /<link rel="preload"[^>]*href="(fonts\/[a-z0-9.\-]+\.woff2)"[^>]*>/g;
  while((m = pre_re.exec(head))) { if(pre.indexOf(m[1]) < 0) pre.push(m[1]); }

  if(!faces.length){
    fail("no @font-face src could be read from index.html, so section 124 " +
         "cannot check that the faces are preloaded " + "\u2014" + " a blind section is " +
         "worse than an absent one");
    return;
  }
  faces.forEach(function(f){
    if(pre.indexOf(f) < 0){
      fail("index.html declares @font-face for " + f + " with no " +
           '<link rel="preload"> for it. CSS-discovered faces are not requested ' +
           "until the stylesheet is parsed " + "\u2014" + " measured at 467-501ms against " +
           "287-293ms for the preloaded ones, which is the whole gap between " +
           "domContentLoaded and domComplete");
    }
  });
  pre.forEach(function(f){
    if(faces.indexOf(f) < 0){
      fail("index.html preloads " + f + ", which no @font-face uses. A preload " +
           "the page never claims is a download nobody asked for, and the " +
           "browser warns about it in the console");
    }
  });
  /* The attributes matter as much as the presence: a font preload without
     crossorigin is fetched twice, once anonymously and once for real. */
  pre.forEach(function(f){
    var tag = (head.match(new RegExp('<link rel="preload"[^>]*href="' +
      f.replace(/[.\/\-]/g, "\\$&") + '"[^>]*>')) || [""])[0];
    if(tag.indexOf("crossorigin") < 0){
      fail("the preload for " + f + " has no crossorigin attribute " + "\u2014" + " fonts are " +
           "fetched in CORS mode, so without it the browser downloads the file " +
           "a second time and the preload has cost rather than saved");
    }
    if(tag.indexOf('as="font"') < 0){
      fail("the preload for " + f + ' has no as="font" ' + "\u2014" + " without it the " +
           "browser cannot prioritise the request and warns that the preload " +
           "went unused");
    }
  });
  note("fonts: " + faces.length + " faces, all preloaded with crossorigin");
})();

/* ---------- 125. robots.txt states a position on AI use ---------------- */
/* 3.4.2. Content Signals (contentsignals.org) is a line in robots.txt declaring
   three separate permissions -- training, search indexing, and real-time use as
   input to an AI answer. It was added because being citable is the point of a
   spoiler-free watch order, and because the AI-citation re-run booked for early
   September measures nothing if the site has declared nothing.

   THIS SECTION DOES NOT PIN THE VALUES. They are a rights position, they are
   the owner's to change, and a guard that fails when the owner changes their
   mind is a guard that gets deleted. What it pins is that the line EXISTS, that
   it names all three signals, and that each carries a value the spec allows --
   the failure modes of a hand-edited text file nothing else reads. A typo in
   robots.txt is invisible: no build breaks, no page changes, and the directive
   is simply ignored by every crawler that reads it. */
(function(){
  var rp = path.join(PUBLIC, "robots.txt");
  if(!fs.existsSync(rp)){
    fail("docs/robots.txt is missing");
    return;
  }
  var R = fs.readFileSync(rp, "utf8");
  var line = (R.match(/^Content-Signal:.*$/m) || [""])[0];
  if(!line){
    fail("docs/robots.txt declares no Content-Signal line " + "\u2014" + " 3.4.2 added one " +
         "so that AI training, search indexing and live citation are three " +
         "separate answers rather than one silence. qa/scan-triage-2026-08-07.md");
    return;
  }
  ["ai-train", "search", "ai-input"].forEach(function(k){
    var v = (line.match(new RegExp(k + "\\s*=\\s*(yes|no)")) || [])[1];
    if(!v){
      fail("robots.txt's Content-Signal does not give " + k + " a value of yes " +
           "or no. A signal left out is not a default, it is an omission, and " +
           "the whole point of the line is that the three answers can differ");
    }
  });
  if(!/^Sitemap:\s*https:\/\/nightwatcher\.life\/sitemap\.xml\s*$/m.test(R)){
    fail("docs/robots.txt no longer names the sitemap at the canonical host");
  }
  if(!/^User-agent:\s*\*\s*$/m.test(R) || !/^Allow:\s*\/\s*$/m.test(R)){
    fail("docs/robots.txt no longer allows every user-agent at the root " + "\u2014" + " the " +
         "app is one public page and nothing in it is meant to be hidden");
  }
  note("robots.txt: " + line.replace(/^Content-Signal:\s*/, "") +
       ", sitemap named, everything allowed");
})();

/* ---------- 126. A restored path cannot reach the prototype chain ------ */
/* 3.4.4 deep QA, finding 2.1, and it is the only defect this project has ever
   shipped that broke the app on EVERY LATER BOOT rather than in the moment.

   isPath() was `return !!PATHCODE[id]`, an inherited-property lookup on a plain
   object literal. "__proto__", "constructor", "toString" — every name on
   Object.prototype answered truthy, so a restored JSON backup carrying
   "path":"__proto__" set S.path and S.mode to it. The apply then threw inside
   noteFor (MODENOTE["__proto__"] is an object and .indexOf is not a function),
   AFTER the state had mutated and BEFORE the render finished — and the
   debounced persist scheduled just before the throw still fired, writing the
   poison into localStorage. Every later boot threw at render: the static
   pre-render shell, no progress visible, Home and Path throwing on every tap,
   and the only way out was clearing site data, which is the progress loss the
   whole backup feature exists to prevent.

   NOTES.md said this in advance under `res`: the null-prototype discipline
   covers the four progress containers, "but the protection should not depend on
   that staying true". path is a scalar and was validated by isPath alone.

   Two properties are pinned here, because the fix has two halves and either one
   alone leaves a hole. The lookup must be an OWN-property lookup, and the value
   it finds must be the string a real path code is. BYID is pinned null-prototype
   for the same reason one step downstream: it is the other plain-object lookup
   a hand-supplied id reaches, and BYID["constructor"] being truthy is what made
   doRestore count inherited names into "Restored N". */

(function(){
  var box = {};
  new vm.Script(
    sliceOr("var HAS = Object.prototype.hasOwnProperty;", "function pathName") +
    "\n" + optionalFn("isPath", "nothing would validate a restored path at all")
  ).runInContext(vm.createContext(box));

  if(typeof box.isPath !== "function"){
    fail("section 126 cannot evaluate isPath(), so the path validator is unchecked");
    return;
  }
  ["continuity", "life", "release"].forEach(function(ok){
    if(box.isPath(ok) !== true){
      fail("isPath() rejects " + ok + " — the hardening took a real path with it");
    }
  });
  ["__proto__", "constructor", "toString", "valueOf", "hasOwnProperty",
   "isPrototypeOf", "propertyIsEnumerable"].forEach(function(bad){
    if(box.isPath(bad) !== false){
      fail("isPath(\"" + bad + "\") is true — a name off Object.prototype passes " +
           "as a path again. A JSON backup carrying it poisons S.path, throws " +
           "mid-apply, and the persist that is already scheduled writes it to " +
           "storage: the app then fails to render on every later boot and only " +
           "clearing site data recovers it. qa/deep-qa-3.4.4-2026-08-09.md §2.1");
    }
  });
  [null, undefined, 0, 1, true, {}, [], "", "nope"].forEach(function(bad){
    if(box.isPath(bad) !== false){
      fail("isPath() accepts " + JSON.stringify(bad) + ", which is not a path");
    }
  });
  if(/return\s*!!\s*PATHCODE\[/.test(HTML)){
    fail("isPath() is a bare truthiness lookup on PATHCODE again — that reads " +
         "the prototype chain, and the restore path is reachable from a file " +
         "the reader supplies");
  }
  if(!/HAS\.call\(PATHCODE, id\)/.test(HTML)){
    fail("isPath() no longer asks PATHCODE whether the key is its own");
  }
  if(!/var BYID = Object\.create\(null\)/.test(HTML)){
    fail("BYID is a plain object literal again. Every id in a restored payload " +
         "is looked up in it, so BYID[\"constructor\"] answers truthy and the " +
         "\"Restored N\" count includes names the apply loops then drop — the " +
         "toast reports more than the app took");
  }
  note("prototype names refused: isPath rejects 7 Object.prototype keys, BYID is null-prototype");
})();

/* ---------- 127. A failed read stops the writes, a failed write does not - */
/* 3.4.4 deep QA, findings 2.2, 2.3, 2.4 and the ts half of 2.5 — four bugs in
   one neighbourhood, and they are guarded together because they are the same
   mistake seen from four angles: the storage layer trusted what it was handed.

   2.2. restore()'s async rejection path called finish(null) and left canSave
   true, unlike the synchronous throw three lines below it. The app booted
   empty, stayed willing to save, and the first tick wrote a one-entry payload
   over the reader's whole saved state. Only the host-app backend can reject
   that way — which is exactly the embedded context the backend exists for.
   A read that failed means the state on disk is UNKNOWN, so the writes stop
   for the session: readFailed is a separate latch from canSave for that reason.

   2.4 is the opposite failure and must not be fixed into the same thing. One
   quota-style throw latched canSave false forever, so everything after a blip
   was lost on close. A write that failed says nothing about the next write, so
   that latch clears itself: the banner is honest in both directions now, and
   saveWorked() is the half that was missing.

   2.3. S.watched = o.watched || {} accepted any truthy value. "watched":"oops"
   in storage made every toggleWatched throw and marking was dead until reset,
   while groupOpen and progOpen five lines down got exactly the typeof check
   the four containers needed. Ratings restored unclamped with it.

   2.5. isFinite(null) is true, so a log entry with ts:null sorted to the front
   and Activity dated it 1970. */

(function(){
  var rbody = (HTML.match(/function restore\([^)]*\)\{[\s\S]*?\n\}/) || [""])[0];
  if(!rbody){
    fail("section 127 cannot locate restore(), so nothing below it is checked");
    return;
  }
  if(/S\.watched\s*=\s*o\.watched\s*\|\|/.test(rbody) ||
     /S\.skipped\s*=\s*o\.skipped\s*\|\|/.test(rbody) ||
     /S\.rated\s*=\s*o\.rated\s*\|\|/.test(rbody)){
    fail("restore() takes a progress container straight off the parsed payload " +
         "again. A stored \"watched\":\"oops\" survives the || and every " +
         "toggleWatched throws on it — marking is dead until the reader resets");
  }
  if(!/S\.watched = marksOf\(o\.watched\)/.test(rbody) ||
     !/S\.skipped = marksOf\(o\.skipped\)/.test(rbody) ||
     !/S\.rated = ratingsOf\(o\.rated\)/.test(rbody)){
    fail("restore() no longer shapes all three progress containers through " +
         "marksOf()/ratingsOf() — groupOpen and progOpen have had that check " +
         "since 1.4.x and these carry the progress");
  }

  var box = {};
  new vm.Script(
    "var HAS = Object.prototype.hasOwnProperty;\n" +
    optionalFn("clampRating", "ratings could not be clamped on the way in") + "\n" +
    optionalFn("marksOf", "restore() would take a container's shape on trust") + "\n" +
    optionalFn("ratingsOf", "a stored rating of 9 would survive into S.rated") + "\n" +
    optionalFn("validTs", "a log entry with ts:null would sort to 1970 again")
  ).runInContext(vm.createContext(box));

  if(typeof box.marksOf === "function"){
    [["oops", "a string"], [42, "a number"], [null, "null"], [true, "a boolean"]].forEach(function(c){
      var got = box.marksOf(c[0]);
      if(!got || typeof got !== "object" || Object.keys(got).length){
        fail("marksOf() returned something other than an empty container for " +
             c[1] + " — that is the shape restore() writes to S.watched");
      }
    });
    var m = box.marksOf({a:1, b:true, c:0, d:""});
    if(m.a !== 1 || m.b !== 1 || "c" in m || "d" in m){
      fail("marksOf() no longer normalises a real container to 1-per-marked-id");
    }
    if(Object.keys(box.marksOf(JSON.parse('{"__proto__":{"x":1}}'))).length){
      fail("marksOf() copied a __proto__ key out of a parsed payload");
    }
  }
  if(typeof box.ratingsOf === "function" && typeof box.clampRating === "function"){
    var r = box.ratingsOf({a:9, b:3, c:0, d:-2, e:"4", f:null});
    if("a" in r || "c" in r || "d" in r || "f" in r){
      fail("ratingsOf() let an out-of-range rating through — a stored 9 reaching " +
           "S.rated is what 2.3 recorded, and the clamp is the only thing between " +
           "the payload and the star row");
    }
    if(r.b !== 3 || r.e !== 4){
      fail("ratingsOf() dropped a rating that is inside the vocabulary");
    }
    if(!/clampRating/.test(fn("ratingsOf"))){
      fail("ratingsOf() no longer runs values through clampRating()");
    }
  }
  if(typeof box.validTs === "function"){
    [null, "", true, false, {}, [], NaN, Infinity, "later", undefined].forEach(function(bad){
      if(box.validTs(bad) !== false){
        fail("validTs(" + JSON.stringify(bad) + ") is true. isFinite(null) is " +
             "true, which is how a log entry with no timestamp came to sort " +
             "first and show as 1970 in Activity");
      }
    });
    [0, 1, 1754700000000, "1754700000000"].forEach(function(ok){
      if(box.validTs(ok) !== true) fail("validTs() rejects a real timestamp: " + ok);
    });
    if(!/validTs\(en\.ts\)/.test(HTML)){
      fail("mergeLog() no longer asks validTs() about the timestamp it is handed");
    }
  }

  if(!/\.then\(finish, function\(\)\{ readFailed = true; canSave = false; finish\(null\); \}\)/.test(rbody)){
    fail("restore()'s failed read no longer stops the writes. The rejection " +
         "path used to call finish(null) and leave saving on, so the app booted " +
         "empty and the first tick overwrote the reader's whole saved state " +
         "with one entry. A read that failed means the stored state is unknown");
  }
  if((rbody.match(/readFailed = true/g) || []).length !== 3){
    fail("restore() no longer latches readFailed on all three of its failure " +
         "paths — the async rejection, the synchronous throw, and a body that " +
         "reads but does not parse are the same event: the stored state is " +
         "unknown, so the writes stop");
  }
  /* 4.2.3, C-1 of the 19 Aug audit: a successful read whose body is not JSON
     used to fall through the parse catch as "no state" — the session booted as
     a first visit and the next tick overwrote the unread bytes. A failed PARSE
     is a failed READ: latch, stop the writes, surface the banner, and leave
     the bytes on disk for the reader. */
  if(!/\}catch\(e\)\{ readFailed = true; canSave = false; \}/.test(rbody)){
    fail("restore() swallows a JSON.parse failure without latching readFailed " +
         "— a corrupt but readable store boots as a first visit and the next " +
         "tick overwrites the reader's unread bytes with a near-empty payload");
  }
  ["persist", "persistNow"].forEach(function(name){
    var b = (HTML.match(new RegExp("function " + name + "\\([^)]*\\)\\{[\\s\\S]*?\\n\\}")) || [""])[0];
    if(!/if\(!store \|\| readFailed\) return;/.test(b)){
      fail(name + "() writes without asking whether the read succeeded");
    }
  });
  var pn = (HTML.match(/function persistNow\([^)]*\)\{[\s\S]*?\n\}/) || [""])[0];
  if(!/saveWorked/.test(pn) || !/function saveWorked/.test(HTML)){
    fail("persistNow() has no way back from a write failure. One quota-style " +
         "throw used to latch canSave false for the session, so a blip cost " +
         "everything after it — the banner has to clear when a write lands");
  }
  if(/\.catch\(function\(\)\{ canSave = false/.test(pn)){
    fail("persistNow() latches canSave on a rejected write with no path back — " +
         "that is the 2.4 shape returning");
  }
  note("storage: failed read stops the writes, failed write retries, three " +
       "containers shaped on the way in, timestamps validated");
})();

/* ---------- 128. The Belt parks as the peek, and the peek tells the truth - */
/* 3.5.0, Stage B of releases/plan-belt-release.md — the sticky strip, the
   offset unification, and the parked strip as one inert handle. Stage C (the
   drop) is NOT here: its guard rows land with it, because a guard that cannot
   be green against the tree it ships with is a wish (the section-120 lesson).

   THE PEEK HAS EXACTLY ONE JOB: say which of the three orderings the list in
   front of you is in. S.mode is that variable — it moves with every Progress
   count, deep link and "Back to my path". S.path is what you COMMITTED to,
   and in the divergent state (S.mode !== S.path) a peek lit from S.path would
   be confidently wrong about the list it is parked over. The share card has
   read S.path || S.mode for this exact reason since it shipped; viewWatch()
   prints both facts in words. The mock read S.path because aria-pressed was
   nearest to hand — right in every state the mock could reach, wrong in the
   one it could not. */

(function(){
  var mc = optionalFn("masterChooser", "there is no belt to park");

  /* (Q1) The peek lights from S.mode, never from S.path. */
  if(!/data-lit="'\+S\.mode\+'"/.test(mc)){
    fail("the peek does not light from S.mode — data-lit is the lit chunk's " +
         "position, and S.mode is where you ARE. Lit from anything else, the " +
         "12px rail lies in the divergent state (S.mode !== S.path), which is " +
         "reachable from every Progress count and every shared link. The share " +
         "card's own line reads S.path || S.mode for exactly this reason");
  }
  if(/data-lit="'\+S\.path/.test(mc)){
    fail("the peek lights from S.path — that is what you PICKED, not where you " +
         "are. A parked rail lit from S.path answers the peek's one question " +
         "with the wrong ordering whenever S.mode has moved, and it persists " +
         "until you move it back");
  }
  /* (Q1a) …while aria-pressed stays on S.path, on purpose. Pressed is what
     you picked; lit is where you are. viewWatch() renders "Viewing X. Your
     path is Y." directly under this strip — the peek inherits a distinction
     the app already states in words, and "fixing" the disagreement repairs a
     bug that is not there. */
  if(!/aria-pressed="'\+\(S\.path===m\[0\]\)\+'"/.test(mc)){
    fail("the belt's segments no longer press from S.path — pressed means " +
         "committed, lit means current, and viewWatch()'s two-line banner is " +
         "the reason they are different variables on purpose");
  }
  /* The chunk's three positions are the segments' own thirds, in PATHS order.
     4.0.4: the chunk lives on the header's #beltpeek — the strips' own band
     left with the swap (a parked strip hides whole now), so the peek is the
     one element that still says where you are. */
  [["life", "0"], ["continuity", "26%"], ["release", "52%"]].forEach(function(p){
    if(!new RegExp("#beltpeek\\[data-lit=\"" + p[0] + "\"\\]::after\\{left:" +
                   p[1].replace("%", "%") + ";\\}").test(HTML)){
      fail("the peek's lit chunk has no position for \"" + p[0] + "\" at left:" +
           p[1] + " — position encodes the path, left/middle/right at the " +
           "segments' own 26% thirds, and a chunk that cannot reach one " +
           "ordering cannot say it");
    }
  });

  /* (F14) `position` on the strip carries exactly ONE condition: an open belt
     never parks — it leaves with its pouches, and the peek arrives once they
     are gone. The staged close keeps the old render's data-held in the DOM
     until the deferred re-render, so a closing belt stays in flow while the
     pouches play out. A SECOND condition on position, from any other cause,
     is the treatment-for-one-state-applied-to-all mistake arriving early. */
  var strip = (HTML.match(/\.pathseg\{[^}]*\}/) || [""])[0];
  if(!/position:sticky/.test(strip) ||
     !/top:calc\(var\(--ghtop\) - var\(--beltH\)\)/.test(strip)){
    fail("the strip is not sticky at calc(--ghtop - --beltH) — either the " +
         "belt no longer parks as the peek, or its parked offset stopped " +
         "deriving from the one source section 128 pins. 4.0.0 made every " +
         "sticky offset PANEL-relative: the scrollport's top edge sits at " +
         "the header's bottom now, so the header's height belongs to layout " +
         "and only --ghtop (the peek) remains in the offset");
  }
  if(!/\.pathseg\[data-held\]\{position:relative;top:auto;margin-bottom:0;\}/.test(HTML)){
    fail("an open belt parks, or sinks — .pathseg[data-held]{position:" +
         "relative;top:auto;margin-bottom:0;} is F14's rule plus F13's seam " +
         "plus the 3.6.2 lesson: `top` offsets position:relative boxes too, " +
         "so a held rule that switches position without resetting top leaves " +
         "the open strip 37px below its flow box, sitting on its own " +
         "pouches. That shipped in 3.5.0 and was reported as 'tapping the " +
         "buckle at top does not drop correctly' — the pouches were there, " +
         "buried behind the belt. top:auto, or the belt eats its pouches");
  }
  var posRules = (HTML.match(/\.pathseg[^ {,]*\{[^}]*position:[^}]*\}/g) || [])
    .filter(function(r){ return !/\.pathseg \./.test(r) && !/::/.test(r); });
  if(posRules.length !== 2){
    fail("`position` on the strip carries " + posRules.length + " rules; this " +
         "build was reviewed with exactly 2 — sticky, and F14's data-held " +
         "release. A third condition is a new state nobody argued for: " +
         "3.6.4's always-parked peek deliberately carries NO position rule " +
         "of its own (section 130 — it is the same sticky, pulled up by a " +
         "margin, so it works in browsers the anchored version never reached)");
  }
  if(!/\(S\.beltOpen && !S\.beltDrop \? ' data-held=""' : ''\)/.test(mc)){
    fail("data-held does not render from S.beltOpen && !S.beltDrop — F14's " +
         "condition has to come from the state that opened the pouches, and " +
         "a DROPPED belt is the exception on purpose: its pouches are out of " +
         "the flow, so the strip stays pinned under the header instead of " +
         "scrolling away. Without the !S.beltDrop half, tapping the peek " +
         "would drop a belt that immediately un-sticks");
  }

  /* (F1/B2) One source for every offset the header casts. 71 is 12 + 46 + 12
     + the 1px border — the border is F1's finding: a peek built against 70
     renders 11px. The JS override reads the header's real box (which includes
     the border) when the no-save banner grows it, so the CSS fallback agrees
     with the override only if it carries the border too. */
  if(!/--hdrh:calc\(env\(safe-area-inset-top\) \+ 71px\);/.test(HTML)){
    fail("--hdrh is not env(safe-area-inset-top) + 71px — 12 + 46 + 12 + the " +
         "1px border. 70 is the group-header arithmetic that loses nothing by " +
         "parking 1px behind the border; the belt loses a twelfth of its peek");
  }
  if(!/--ghtop:var\(--belt-peek\);/.test(HTML)){
    fail("--ghtop is no longer the peek alone — F3 still holds: a pinned era " +
         "header must park exactly one peek below the top of its scrollport, " +
         "or the belt clips the era title it parks over. Since 4.0.0 the " +
         "scrollport is the panel and its top edge IS the header's bottom, " +
         "so --hdrh has left this offset: putting it back would park the " +
         "headers a whole header-height too low. --hdrh still exists for " +
         "the one consumer that measures from the VIEWPORT — the dropped " +
         "pouches' no-anchor fallback — and for flagSave()'s banner override");
  }
  if(/--ghtop, calc\(/.test(HTML)){
    fail("a call site carries its own --ghtop fallback constant — the one " +
         "source is :root, and a local fallback is the 70/71 drift waiting to " +
         "happen a third time");
  }
  var fsv = fn("flagSave");
  if(!/setProperty\("--hdrh"/.test(fsv) || /setProperty\("--ghtop"/.test(fsv)){
    fail("flagSave() does not override --hdrh (or still overrides --ghtop) — " +
         "the JS override and the CSS fallback are two answers to one " +
         "question, and they only agree while both describe the whole header, " +
         "border included, through the same variable");
  }

  /* (Q2, rewritten in 4.0.4) The peek is the header's own #beltpeek — the
     strips' ::before/::after band left with the mid-gesture swap. Off, it is
     display:none (out of paint, hit-testing and the accessibility tree in
     one declaration) and pointer-events:none besides, so the header never
     grows a dead 12px tap zone; on, it is a block that takes the pointer
     and shows the hand. There is no entrance mechanism left for reduced
     motion to miss: a display flip does not animate. */
  var peekBase = (HTML.match(/#beltpeek\{[^}]*\}/) || [""])[0];
  if(!peekBase || !/display:none/.test(peekBase) ||
     !/position:absolute/.test(peekBase) ||
     !/top:calc\(100% \+ 1px\)/.test(peekBase)){
    fail("the header peek's base rule is gone or unmoored — #beltpeek must " +
         "start display:none and hang absolutely off the header's bottom " +
         "border (top:calc(100% + 1px)), or the parked belt has no peek at " +
         "all: the strips hide when parked and the header element is the " +
         "one thing left saying the belt exists");
    return;
  }
  if(!/pointer-events:none/.test(peekBase)){
    fail("the peek's base rule takes pointer events — off is off: the " +
         "element is display:none today, but the base rule is the one a " +
         "future state forgets, and a hidden-ish peek that eats header taps " +
         "is a dead zone exactly where the header's own controls live");
  }
  var peekOn = (HTML.match(/#beltpeek\[data-on\]\{[^}]*\}/) || [""])[0];
  if(!/display:block/.test(peekOn) || !/pointer-events:auto/.test(peekOn) ||
     !/cursor:pointer/.test(peekOn)){
    fail("the peek's on state is not a working handle — #beltpeek[data-on] " +
         "must display:block, take the pointer back and show the hand; " +
         "missing any of the three is a peek that is visible, labelled a " +
         "button, and answering nothing");
  }
  if(!/@media \(prefers-reduced-motion:reduce\)\{\*,::before,::after\{transition:none!important;\}\}/.test(HTML)){
    fail("the reduced-motion block does not reach pseudo-elements — " +
         "*{transition:none} does not match ::before/::after, so the peek's " +
         "entrance would play for a reader who asked for no motion. The block " +
         "must name them: *,::before,::after");
  }

  /* (Q4) The two --hdr declarations move together. The token LOOKS like one
     value and is declared twice — default theme and darker. F2's ghosting fix
     raised the default; the rule is the relationship, not the two literals:
     if one alpha moves, the other moves with it. Same lesson as the ring and
     the bat in 3.0.0 — pin the relationship, survive the next honest change. */
  var alphas = [];
  (HTML.match(/--hdr:rgba\([^)]*\)/g) || []).forEach(function(d){
    var a = d.match(/,\s*(\.?\d+(?:\.\d+)?)\)$/);
    if(a) alphas.push(a[1]);
  });
  if(alphas.length !== 2){
    fail("--hdr is declared " + alphas.length + " time(s); the two themes " +
         "declare it twice, and a third declaration (or a lost one) is a " +
         "theme this section has never seen");
  } else if(alphas[0] !== alphas[1]){
    fail("the two --hdr declarations have drifted apart (" + alphas.join(" vs ") +
         ") — the parked belt ghosts through the blur in whichever theme was " +
         "left behind, which is F2 fixed in one theme and shipped broken in " +
         "the other");
  }

  /* (F5, widened in 4.0.4) While parked, the strip is not a control — and
     not even a paint: the WHOLE strip hides, and the header's #beltpeek is
     the one handle. visibility:hidden still does the whole of F5 in one
     line — no hit-testing, no tab stop, no phantom in the accessibility
     tree — it just covers the buttons' box along with the buttons now,
     because a strip that paints inside the deck rides every swipe. */
  if(!/html\[data-beltpark\] \.pathseg:not\(\[data-held\]\):not\(\[data-drop\]\):not\(\[data-ride\]\)\{visibility:hidden;\}/.test(HTML)){
    fail("the scroll-parked strip still paints inside the deck — it must " +
         "hide whole: visibility:hidden is the whole of F5 (no hit-testing, " +
         "no tab stop, no phantom in the accessibility tree), and a strip " +
         "that paints in the deck rides every swipe, which is the 4.0.x " +
         "flicker back. The :not([data-drop]) half is F7: a DROPPED belt is " +
         "a working belt; :not([data-ride]) lets the retraction play before " +
         "the swap");
  }
  var ph = HTML.indexOf('getElementById("beltpeek").addEventListener("click"');
  var phBlock = ph < 0 ? "" : HTML.slice(ph, ph + 500);
  if(ph < 0 || !/beltDropOpen\(\)/.test(phBlock)){
    fail("a tap on the peek does not drop the belt — the drop is the " +
         "locked answer from the mock round: the belt comes down over the " +
         "list and works in place. The peek is the header's own #beltpeek " +
         "since 4.0.4 and its tap drops UNCONDITIONALLY: parkFocus() only " +
         "shows it when the belt is closed and parked, so the handler " +
         "carries no second copy of that condition to drift");
  }
  if(!/addEventListener\("keydown"/.test(phBlock) ||
     !/preventDefault/.test(phBlock)){
    fail("the peek is not a keyboard door — role=button and tabindex " +
         "promise Enter and Space, and a handle that only answers a " +
         "pointer is a silent dead end for exactly the reader the role " +
         "was declared for");
  }
  if(/supportsAnchor/.test(HTML)){
    fail("the JS anchor probe is back — 3.6.4 moved the gate into the " +
         "stylesheet (@supports around the anchored pouch rule), where it " +
         "cannot diverge from the rules it vouches for. A probe beside the " +
         "stylesheet is two answers to one question, and the register's " +
         "one-property lesson was earned against exactly this function");
  }
  var pf = optionalFn("parkFocus", "nothing decides when the peek shows");
  if(!/hasAttribute\("data-beltpark"\)/.test(pf) ||
     !/hasAttribute\("data-park"\)/.test(pf)){
    fail("parkFocus() no longer reads both parked truths — data-beltpark " +
         "covers the scroll-parked pre-choice strip and data-park the " +
         "chosen one; losing either is a peek that never shows for half " +
         "the states it exists for");
  }
  if(!/hasAttribute\("data-held"\)/.test(pf) ||
     !/hasAttribute\("data-drop"\)/.test(pf)){
    fail("parkFocus() ignores data-held or data-drop — F14 still holds: " +
         "there is no state in which a peek and a pouch are on screen " +
         "together, and a peek over an open or dropped belt is exactly " +
         "that state");
  }
  if(!/setAttribute\("data-on"/.test(pf) || !/removeAttribute\("data-on"\)/.test(pf)){
    fail("parkFocus() does not toggle the peek — data-on is the one switch " +
         "#beltpeek answers to, and a computed truth that never reaches " +
         "the attribute is a peek stuck however it last was");
  }

  /* The flag is written by an IntersectionObserver on the belt's own sentinel
     — never a scroll listener, and never a layout read. A sticky element
     never leaves the viewport, so it cannot report its own parking, and
     reading its geometry is exactly what section 120 refuses. The flag lives
     on <html>, outside #view, because render() replaces #view.innerHTML on
     every tick and would erase it mid-entrance. */
  if(!/class="beltguide"/.test(mc)){
    fail("the belt has no park sentinel — nothing can say when the strip " +
         "parked without reading layout, which section 120 refuses");
  }
  var bw = optionalFn("beltWatch", "nothing flips the parked flag");
  if(!/IntersectionObserver/.test(bw) || !/data-beltpark/.test(bw) ||
     !/beltguide/.test(bw)){
    fail("beltWatch() does not observe the sentinel onto <html>'s " +
         "data-beltpark — the parked flag has to come from an observer, " +
         "live outside #view, and follow the sentinel across renders");
  }
  if(!/parkFocus\(\);\s*if\(!\("IntersectionObserver" in window\)\) return;/.test(bw)){
    fail("beltWatch() gates parkFocus() behind IntersectionObserver — a " +
         "browser without the observer still parks by STATE (data-park " +
         "renders from S.path), and with the peek as the only handle, " +
         "gating the toggle leaves those browsers a belt with no door: " +
         "strips hidden by CSS, peek never switched on");
  }
  /* 3.6.0: ONE scroll listener was pinned, the way section 120 pins its
     layout reads — the drop's retraction trigger, {once:true}: it fires a
     single time, calls the one close path, and is gone until the next drop
     arms it. 4.0.0 WIDENS THE PIN TO TWO, and the second is the swipe
     viewport's only ear: swipeTick on #view, passive and rAF-throttled, the
     one place the active tab can be read off a horizontal swipe — there is
     no scrollend event by decision (Safari shipped it late and a settle can
     be computed from the snap arithmetic instead). Everything else stays
     refused: the parked flag, the auto-close and the entrance all come from
     observers that fire when the answer changes, not on every frame of
     every scroll forever. A THIRD site has to be argued for here. */
  var scrollSites = HTML.split('addEventListener("scroll"').length - 1;
  if(scrollSites !== 2 ||
     !/addEventListener\("scroll", dropScrollOnce, \{once:true, passive:true\}\)/.test(HTML) ||
     !/addEventListener\("scroll", swipeTick, \{passive:true\}\)/.test(HTML)){
    fail("index.html carries " + scrollSites + " scroll listener(s); this " +
         "build was reviewed with exactly 2, both named — the drop's one-shot " +
         "retraction ({once:true, passive:true}, armed only while dropped) " +
         "and the swipe viewport's rAF-throttled swipeTick ({passive:true} " +
         "on #view). Any other site is the every-frame cost the observers " +
         "exist to avoid");
  }
  var swt = optionalFn("swipeTick", "there is no swipe listener to throttle");
  if(!/requestAnimationFrame/.test(swt) || !/nwSwipeRaf/.test(swt)){
    fail("swipeTick is not rAF-throttled — a horizontal swipe fires scroll " +
         "at input rate, and reading scrollLeft in every one of them is the " +
         "every-frame cost this section's pin was written to refuse");
  }
  /* The one-shot is armed per PANEL now, and a tab change strands it on the
     panel it was armed in — {once:true} only removes a listener that fired.
     disarmDropScroll() is the other half of the arm, wired into goTab and
     the swipe's tab-change, or dropArmed sticks true and every later drop
     arms nothing. */
  if(!/function disarmDropScroll\(\)/.test(HTML) ||
     !/removeEventListener\("scroll", dropScrollOnce\)/.test(HTML)){
    fail("the drop's one-shot has no disarm path — scroll moved into the " +
         "panels in 4.0.0, so a listener armed on one panel goes stale the " +
         "moment the active panel changes, and dropArmed never resets");
  }
  if(!/beltWatch\(\);/.test(fn("render"))){
    fail("render() does not re-point the belt observer — #view.innerHTML is " +
         "replaced on every tick, so the observed sentinel is destroyed on " +
         "every tick, and an observer watching a detached node reports " +
         "nothing forever");
  }

  /* 4.3.1: THE BOTTOM MARGIN JOINS THE PINNED OFFSETS, because it drifted the
     only way an unpinned offset can — by growing a second source. The belt's
     margin-bottom is what every tab's first content stands on; Progress had
     patched its own first block with an inline margin-top:18px, so it stood
     8px lower than the other three and was the only one the owner called
     correct. The fix is the one-source rule this section already tells:
     18px on the belt, no per-view patches, all four tabs start level. */
  if(!/\.pathseg\{[^}]*margin:0 0 18px/.test(HTML)){
    fail("the belt's bottom margin is not 18px — it is the one source of " +
         "first-content clearance below the parked peek, and the last time " +
         "it had a second source only Progress stood at the right offset");
  }
  /* The parked rule REPLACES the whole margin (its top pulls the strip up
     behind the header), so it re-states the bottom — and a re-statement is
     where 4.3.1's first cut missed: the base said 18 while the parked state
     everyone actually lives in still said 10. Same lesson as the two --hdr
     alphas: pin both, or the next honest change fixes one. */
  if(!/\.pathseg\[data-park\]\{margin:calc\([^}]*\) 0 18px;\}/.test(HTML)){
    fail("the parked belt's bottom margin is not 18px — [data-park] replaces " +
         "the whole margin to pull the strip behind the header, so it " +
         "re-states the bottom, and the parked state is the one every tab " +
         "with a chosen path actually renders");
  }
  /* And the general clause the pies patch earned: offsets live in the
     stylesheet. A margin inside a style attribute is a second source by
     construction — it wins the cascade silently and describes an offset in a
     place no sweep of the rules can see. Data-driven inline styles (the tier
     bars' widths, the tell colours) are values, not offsets, and stay. */
  var inlineMargins = HTML.match(/style="[^"]*margin[^"]*"/g) || [];
  if(inlineMargins.length){
    fail("an inline margin patch is back in the rendered markup (" +
         inlineMargins[0] + ") — offsets live in the stylesheet, one source " +
         "each; the last inline margin made Progress the only tab with the " +
         "correct top margin");
  }

  note("the belt parks as the peek: lit from S.mode, one position condition, " +
       "offsets from --hdrh, entrance is a transition, parked strip is one " +
       "handle, observer plus one pinned one-shot listener; 18px under it is " +
       "the one first-content clearance, with no inline margin anywhere");
})();

/* ---------- 129. The Belt drops in place, and leaves the way it came ---- */
/* 3.6.0, Stage C of releases/plan-belt-release.md — the drop. Tap the peek
   and the belt slides down under the header, over the list, with its pouches
   open in place; the next scroll retracts them and parks it again. The list
   never moves.

   THE ANCHOR IS CSS, AND THAT IS THE HEADLINE. The plan spent a page on
   amending section 120 for a strip-measured anchor — getBoundingClientRect,
   offsetWidth or clientWidth, all three refused. The plan's own footnote
   ("worth ten minutes before the argument is had") was right: CSS anchor
   positioning hangs the pouches off the strip's real box with NO layout read
   at all, so section 120 ships this release untouched, pins and all. The
   pouches inherit whatever the belt did about scrollbars, safe areas and the
   760px column BY CONSTRUCTION — which is the fix F11 wanted, for the bug
   this app has now met three times (Next up sat 7.5px off-centre for the
   same reason: two boxes centred against two different widths).

   Four of the seven mock findings died in the same move. F11 (the half-
   scrollbar): anchor() resolves the strip's box, scrollbar included. F12's
   "the pouches were left behind" (the belt rose while they stayed pinned):
   an anchored box tracks its anchor through a transition, measured mid-
   flight in the build's Chromium drive. F13's phantom-anchor close and
   F14's -203px mid-close fall: the strip never changes `position` during a
   drop or its close — only `top` — so there is no layer hand-off to get
   wrong. What is left to guard is what CSS cannot promise: the paint order,
   the close routing, the exit distance, and the state scoping. */

(function(){
  var mc = optionalFn("masterChooser", "there is no belt to drop");

  /* (F8/F9) The belt paints in front of its own pouches, and each pouch in
     front of the next. The -4px tuck only reads as "from behind" while the
     thing behind is actually behind. */
  var strip = (HTML.match(/\.pathseg\{[^}]*\}/) || [""])[0];
  var stripDrop = (HTML.match(/\.pathseg\[data-drop\]\{[^}]*\}/) || [""])[0];
  var incFlow = (HTML.match(/\.includes\{[^}]*\}/) || [""])[0];
  var incDrop = (HTML.match(/\.includes\[data-drop\]\{[^}]*\}/) || [""])[0];
  if(!/z-index:2/.test(strip) || !/z-index:1/.test(incFlow) ||
     !/z-index:21;/.test(stripDrop) || !/z-index:20;/.test(incDrop)){
    fail("the belt no longer paints in front of its own pouches — the v2 mock " +
         "inverted this the moment the pouches got their own layer, and four " +
         "pixels of tuck looked wrong instantly. Strip z2 / pouches z1 in the " +
         "flow; strip z21 / pouches z20 dropped (F8) — the dropped pair sits " +
         "ABOVE the pinned era headers' z2, because 3.6.0 soaked for one " +
         "evening with 'THE GRAYSON YEARS' punching through the pouches, and " +
         "below the header's z30, which the belt parks behind on purpose");
  }
  /* 3.6.1, the other half of the same soak report: the pouch rows had no
     background. In the flow they sat on the page's own --ink, so nothing ever
     showed through and nothing looked wrong; dropped over a list, everything
     did. An opaque row is the same pixels at Home and a working pouch over
     content — one construction, both states (F13's rule, applied to paint). */
  if(!/\.includes \.scope\{position:relative;background:var\(--ink\);/.test(HTML)){
    fail("the pouch rows lost their opaque background — in the flow they sit " +
         "on the page's own --ink and look identical either way, but a " +
         "dropped pouch with no background is a window: the 3.6.0 soak read " +
         "the era pill and the list's own titles straight through ANIMATED. " +
         "var(--ink), the page's colour, so Home does not change by a pixel");
  }
  if(!/\.includes \.scope\.fmt\{z-index:2;\}/.test(HTML) ||
     !/\.includes \.scope:not\(\.fmt\)\{z-index:1;margin:-5px 11px 0;\}/.test(HTML)){
    fail("the three-plane stack is gone — the types row hangs behind the " +
         "format row, inset 11px each side and pulled up 5px, the same rule " +
         "the format row applies to the belt. Flush-aligned pouches read as " +
         "a floating panel when dropped (F9, the owner's 'looks odd'), and " +
         "this deliberately reverses 2.0.0's flush alignment at Home too — " +
         "the same object does not get two constructions");
  }

  /* (F11) The pouches are positioned FROM THE STRIP — a floating child of a
     scrolled box is positioned from the thing it hangs off, not from the
     page. anchor() is that rule as a platform primitive. */
  if(!/anchor-name:--belt/.test(strip)){
    fail("the strip lost its anchor name — the dropped pouches have nothing " +
         "to hang off and fall back to the page's coordinates, which is the " +
         "Next-up 7.5px half-scrollbar bug, third appearance");
  }
  if(!/\.includes\[data-drop\]\{position-anchor:--belt;top:calc\(anchor\(bottom\) - 4px\);left:calc\(anchor\(left\) \+ 8px\);width:calc\(anchor-size\(width\) - 16px\);\}/.test(HTML)){
    fail("the dropped pouches are not anchored to the strip's own box — " +
         "top from its bottom (the same 4px tuck as the flow), left inset 8px, " +
         "width from anchor-size. Centre them against anything else and they " +
         "sit half a scrollbar off the belt, worst in the middle row, which " +
         "is the owner's exact report at the mock round (F11)");
  }
  /* 3.6.4: the anchored rule lives INSIDE @supports, over a fallback that
     works everywhere. A dropped strip always pins at --hdrh, so the
     fallback's top is a constant with no anchor in it; left and width are
     the column's own formula. The fallback exists because the peek became
     the only door to the belt (section 130) — a browser outside the gate
     used to fall back to scrolling home, and home now shows the peek. */
  if(!/@supports \(position-anchor:--belt\) and \(top:calc\(anchor\(bottom\) - 4px\)\) and \(width:calc\(anchor-size\(width\) - 16px\)\)\{/.test(HTML)){
    fail("the anchored pouch rule lost its @supports gate, or the gate " +
         "stopped probing the exact shapes the rule uses — position-anchor, " +
         "anchor() in calc, anchor-size() in calc. The gate lives in the " +
         "stylesheet so it cannot diverge from the rule it vouches for; a " +
         "partial implementation slipping it renders broken floaters when " +
         "the correct answer was the fallback (the register's one-property " +
         "lesson, 3.6.1)");
  }
  if(!/\.includes\[data-drop\]\{position:fixed;top:calc\(var\(--hdrh\) \+ var\(--beltH\) - 4px\);left:max\(26px, calc\(50% - 354px\)\);width:min\(100% - 52px, 708px\);margin:0;z-index:20;\}/.test(HTML)){
    fail("the no-anchor fallback for the dropped pouches is gone or drifted " +
         "— fixed at the constant the pinned strip guarantees (--hdrh + " +
         "--beltH - 4px: the same 4px tuck), left/width from the column's " +
         "own 760/18/8 arithmetic (26 = 18 + 8; 354 = 708/2; 708 = 724 - " +
         "16). Without it, a browser outside the @supports gate has a peek " +
         "that opens nothing — the owner's dead-sliver report, one layer " +
         "down");
  }
  /* (F13) …and the dropped treatment applies ONLY in the dropped state. */
  if((HTML.match(/position-anchor/g) || []).length !== 2){
    fail("position-anchor appears at " +
         (HTML.match(/position-anchor/g) || []).length + " sites; this build " +
         "was reviewed with exactly 2 — the @supports condition, and the one " +
         "anchored [data-drop] rule inside it. The dropped treatment " +
         "applying outside the dropped state is the mistake four of the " +
         "seven mock findings turned out to be (F13)");
  }
  if(!/\(S\.beltDrop \? ' data-drop=""' : ''\)/.test(mc) ||
     (mc.split("data-drop").length - 1) !== 1){
    fail("the strip's data-drop does not render from S.beltDrop exactly once " +
         "— the drop must be state, not a class, or ticking a checkbox from " +
         "a dropped belt silently un-drops it");
  }
  var ib = optionalFn("includeBlock", "there are no pouches to drop");
  if(!/\(S\.beltDrop \? ' data-drop=""' : ''\)/.test(ib)){
    fail("the pouches' data-drop does not render from S.beltDrop — the strip " +
         "and the pouches reading different variables for one state is how " +
         "the composition goes nonsense (F14's lesson, one door down)");
  }
  if(/beltDrop/.test(fn("persistNow"))){
    fail("beltDrop is written to the saved payload — the drop is a way of " +
         "standing, not content; it never survives a reload");
  }

  /* (F12) Every close routes through one function, and the three doors are
     all wired to it. */
  var cb = optionalFn("closeBelt", "the belt cannot close at all");
  var opens = (HTML.match(/S\.beltOpen = false/g) || []).length;
  var inCb  = (cb.match(/S\.beltOpen = false/g) || []).length;
  if(opens !== inCb || inCb < 1){
    fail("S.beltOpen is set false at " + (opens - inCb) + " site(s) outside " +
         "closeBelt() — a state that can be left by two doors needs both " +
         "wired to the same exit, and the one nobody tested is always the " +
         "one in the report (F12)");
  }
  if(!/closeBelt\("drop"\)/.test(fn("dropScrollOnce")) ||
     !/closeBelt\("auto"\)/.test(HTML)){
    fail("a close path bypasses closeBelt — the drop's scroll retraction and " +
         "the flow auto-close both route through the one function or the " +
         "buckle's staging is theatre (F12)");
  }
  /* The dropped close keeps the anchor: the strip loses data-drop (so its
     top transitions home and the anchored pouches ride it), while the
     pouches keep theirs — className assignment cannot touch an attribute. */
  if(!/seg\.removeAttribute\("data-drop"\)/.test(cb) ||
     !/inc\.className = "includes closing"/.test(cb)){
    fail("the dropped close breaks the ride home — the strip must lose " +
         "data-drop (its top transitions back to the peek) while the pouches " +
         "KEEP theirs through the className swap, so the anchor holds and " +
         "they rise with the belt instead of being left pinned mid-air, " +
         "which was F12's third finding");
  }

  /* (F12) The exit travels far enough to finish behind the strip — the test
     is distance, not the presence of an animation. */
  if(!/@keyframes pouchout\{to\{transform:translateY\(var\(--out,-10px\)\);opacity:0;\}\}/.test(HTML) ||
     !/\.includes\.closing \.scope\.fmt\{--out:-115%;\}/.test(HTML) ||
     !/\.includes\.closing \.scope:not\(\.fmt\)\{--out:-210%;\}/.test(HTML)){
    fail("the pouches' exit no longer travels behind the strip — a 12px " +
         "nudge plus opacity is a fade, and a fade reads as vanishing. " +
         "Format clears at -115%; types has the format row's height to clear " +
         "as well, -210%. The distance is the whole difference between the " +
         "two readings (F12)");
  }

  /* (F6) The flow auto-close pays its own compensation — #view sets
     overflow-anchor:none on purpose, so nothing absorbs the removal. The
     height comes from the observer's entry, never from a layout read. */
  if(!/nwScrollAdjust = Math\.max\(0, en\.boundingClientRect\.height \+ 14\)/.test(HTML)){
    fail("the flow auto-close no longer measures its compensation from the " +
         "observer's entry — the includes box leaves the flow with 14px of " +
         "net margin, and compensating by anything else makes the list creep " +
         "on every close. The mock shipped that bug once (F6)");
  }
  if(!/if\(nwScrollAdjust\)\{ keep = Math\.max\(0, keep - nwScrollAdjust\); nwScrollAdjust = 0; \}/.test(fn("render"))){
    fail("render() does not consume the close compensation — " +
         "overflow-anchor:none means the app pays for removed flow height " +
         "itself, and an unpaid close snaps the list to the top, which is " +
         "the exact mock failure F6 was written after");
  }

  /* 3.6.3, two owner soak calls from the drop's first weekend.

     THE DROP ARRIVES CLOSED. The design doc's tap description said the drop
     "opens its pouches in place", and 3.6.0 shipped that; the owner's soak
     read it as a defect — "when dropping the belt, it always opens all
     drops." The state machine's own table was right all along: Dropped is
     the belt whole, over the list, with a shadow; Open is a separate state
     the buckle enters. The buckle opens the pouches in place from a dropped
     belt (F7 unchanged); the drop itself brings only the belt. */
  if(/beltOpen/.test(fn("beltDropOpen"))){
    fail("the drop opens the pouches again — the owner's soak call, 9 Aug: " +
         "dropping brings the belt whole, with a shadow, and the pouches are " +
         "the buckle's to open. The state machine always said Dropped and " +
         "Open were two states; the tap description that conflated them lost");
  }
  /* A PATH TAP FROM A DROPPED BELT STAYS PUT. The segments' scroll-to-top
     predates the belt being usable mid-list; from a dropped belt it threw
     away exactly the place the drop exists to keep. The owner's words are
     the rule: it is a selector, and home is above, in the app name — the
     wordmark's job (guard 47), not a side effect of choosing. */
  var pathTap = HTML.indexOf("if(b.dataset.path){");
  var ptBlock = HTML.slice(pathTap, pathTap + 400);
  if(!/if\(!S\.beltDrop\) scrollPut\(0\);/.test(ptBlock)){
    fail("a path tap from a dropped belt goes home — it is a selector, and " +
         "home is above, in the app name (the wordmark, guard 47). The " +
         "unconditional scroll-to-top predates the drop; from a dropped belt " +
         "it discards exactly the place the drop exists to keep (owner's " +
         "soak call, 9 Aug)");
  }

  /* The retraction trigger is armed per drop and disarmed by firing. */
  if(!/if\(dropArmed\) return;/.test(fn("armDropScroll"))){
    fail("armDropScroll can stack listeners — {once:true} removes the " +
         "listener but not the intent, and two armed copies close the next " +
         "drop the moment it opens");
  }
  /* Found by the 3.6.0 Chromium drive, not by any suite: replacing
     #view.innerHTML momentarily clamps the scroll position, the browser
     dispatches a real scroll event for the clamp, and the one-shot listener
     read the app's own render as the user leaving — the drop closed itself
     ~300ms after opening. jsdom has no layout, so no assertion here can see
     the event fire; what CAN be asserted is that the squelch exists and the
     listener re-arms through it. */
  if(!/if\(dropSquelch\)\{ armDropScroll\(\); return; \}/.test(fn("dropScrollOnce")) ||
     !/dropSquelch = true;/.test(fn("render"))){
    fail("the retraction listens to render's own scroll clamp — replacing " +
         "#view.innerHTML clamps the scroll for a frame and the browser " +
         "dispatches a real scroll event for it, so without the squelch the " +
         "drop closes itself the moment it opens (or on the first tick " +
         "taken from a dropped belt)");
  }

  note("the drop: anchored from the strip in CSS (section 120 untouched), " +
       "@supports-gated over a constant-top fallback, one close path with " +
       "three doors, exits travel -115%/-210%, auto-close compensated from " +
       "the observer's entry, dropped pair above the pinned headers, pouch " +
       "rows opaque");
})();

/* ---------- 130. The Belt toasts down, stacks tight, and is the peek once chosen - */
/* 3.6.4, from the corrected drop's first evening — and rebuilt once inside
   the same version number, before upload, on the owner's second report.

   THE FIRST CUT NEVER RENDERED ON THE OWNER'S MACHINES. It hung the parked
   strip off a CSS anchor (position:fixed, anchored to the guide), and the
   owner saw no sliver at all — Chrome, Brave, Edge, desktop and mobile —
   while the harness Chromium drew it pixel-perfect on every tab. The
   failure was never diagnosed to a line; the dependency was removed
   instead, which is the standing rules' inverse move: the peek is now the
   SAME sticky strip it always was, pulled up under the header by a margin,
   and there is nothing left in it for a browser to lack.

   AND THE OWNER RESET THE STATE MACHINE. "The utility belt from Batman: once
   you choose, it stays under the header, so you can use it whenever. You
   don't use it much, but it needs to work perfectly." So parked is not a
   place the belt gets to by scrolling — it is where the belt LIVES once a
   path is chosen. Every tab, every scroll position, always the peek; tap it
   to drop; the drop retracts to the peek. The whole strip sits in the flow
   only pre-choice, where the peek would be debris (F4). Hidden-state
   bookkeeping, the tab-change carry, the reveal gesture, the JS anchor
   probe: all deleted rather than fixed — a state that no longer exists
   cannot resurrect.

   Three rules survive from the first cut unchanged: the drop toasts down
   (the retraction mirrored — render() rebuilds the strip, so the base
   transition can never carry an entrance), every stack seam overlaps (the
   6px margin left +1px of daylight between the pouches — the 3.6.1 window
   at 1px scale), and a dropped belt never crosses a tab change. */

(function(){
  var mc = optionalFn("masterChooser", "there is no belt to park");

  /* (1) The entrance mirrors the retraction: same distance, same curve, same
     duration, one render only. */
  if(!/\.pathseg\[data-toast\]\{animation:beltdrop \.22s ease;\}/.test(HTML) ||
     !/@keyframes beltdrop\{from\{transform:translateY\(calc\(var\(--belt-peek\) - var\(--beltH\)\)\);\}\}/.test(HTML)){
    fail("the drop's entrance no longer mirrors the retraction — the strip " +
         "must toast down the same 34px (beltH − peek) the retraction rides " +
         "up, same .22s ease, or the belt arrives in one frame, which is the " +
         "owner's 9 Aug report ('too fast instead of toasting down'). The " +
         "render rebuilds the strip, so the base `top` transition cannot " +
         "carry the entrance; the keyframe is how it arrives at all");
  }
  if(!/S\.beltDropping = true; render\(\); S\.beltDropping = false;/.test(fn("beltDropOpen")) ||
     !/\(S\.beltDropping \? ' data-toast=""' : ''\)/.test(mc)){
    fail("the entrance is not scoped to the one render that drops — the " +
         "beltOpening pattern, or the belt replays its arrival on every " +
         "re-render taken from a dropped belt (a format pick, a type pick), " +
         "which is the 2.2.1 soak note wearing the drop's clothes");
  }
  if(!new RegExp("prefers-reduced-motion: reduce\\)\\{[^}]*\\.pathseg\\[data-toast\\][^}]*\\{animation:none;").test(HTML)){
    fail("reduced motion does not cut the drop's entrance — the keyframe " +
         "slips *{transition:none} entirely (the section-128 Q2 trap), so " +
         "the block must name .pathseg[data-toast] or the belt toasts down " +
         "for the reader who asked it not to");
  }
  var stripBase = (HTML.match(/\.pathseg\{[^}]*\}/) || [""])[0];
  if(/animation:/.test(stripBase)){
    fail("the base .pathseg rule carries an animation — every render with a " +
         "dropped belt replays the entrance (2.2.1); only the data-toast " +
         "render animates");
  }

  /* (1b) 3.9.0 gave the closed belt a glow; 4.0.8 took away its pulse.
     The parked peek is the app's one persistent handle (the owner's "you
     don't use it much, but it needs to work perfectly"), and the glow is the
     reminder it is live — on the CLOSED, parked handle only, which since
     4.0.4 is the header's #beltpeek. It was a 4.5s box-shadow keyframe from
     3.9.0 to 4.0.7, and that was fine while the strip sat on opaque card in
     the content column; the swipe rework moved the handle onto the header's
     live backdrop-filter, and an ANIMATED box-shadow over a blur layer
     repaints the blur every frame — the owner's "glitchy", on device, four
     shape-tweaks in a row, because the shape was never the fault. The glow
     is STATIC now: same two-layer corner hug, nothing to repaint, nothing
     to glitch, and nothing for reduced-motion to cut — a still image is
     compliant by construction. Three things stay honest: it rides
     #beltpeek[data-on] (parkFocus()'s computed truth, so an open or dropped
     belt never glows); its SHAPE is pinned, because 4.0.4's all-round halo
     bled through the backdrop-filter into a full-width seam and washed into
     passing cards, and a halo is what "make it glow" writes first; and it
     is --signaledge, the peek's own token, on a palette 3.8.4 spent a
     release making single-meaning. A keyframe returning here must be argued
     against the repaint bill it reintroduces. */
  if(/@keyframes beltglow/.test(HTML)){
    fail("the belt glow is animated again — a box-shadow keyframe over the " +
         "header's backdrop-filter repaints the blur every frame, which is " +
         "the owner-reported on-device glitch 4.0.8 removed. The glow is " +
         "static; a pulse must be argued against that repaint bill");
  }
  if(!/#beltpeek\[data-on\]\{[^}]*box-shadow:0 1px 5px -1px var\(--signaledge\), 0 3px 12px -3px var\(--signaledge\);\}/.test(HTML)){
    fail("the glow is not the static two-layer corner hug on " +
         "#beltpeek[data-on] (0 1px 5px -1px + 0 3px 12px -3px, both " +
         "--signaledge) — data-on is parkFocus()'s computed truth, so the " +
         "closed parked handle glows and nothing else does; anything " +
         "bigger re-runs 4.0.4's full-width backdrop seam, any new colour " +
         "breaks the single-meaning palette, and any animation re-runs " +
         "the 4.0.7 glitch");
  }
  if(/#beltpeek\[data-on\]\{[^}]*animation:/.test(HTML)){
    fail("#beltpeek[data-on] carries an animation — the 4.0.8 decision is " +
         "a still glow; see the block comment above before bringing one back");
  }

  /* (2) Every seam in the stack is an overlap. */
  if(!/\.includes \.scope\{position:relative;background:var\(--ink\);margin:0;/.test(HTML)){
    fail("the format row grew a bottom margin back — 6px of margin collapsed " +
         "against the types row's -5px pull leaves +1px of daylight between " +
         "the pouches, invisible at Home on the page's own colour and a 1px " +
         "window over a dropped list (the 3.6.1 lesson at 1px scale). The " +
         "owner's 9 Aug report: 'the drops are too separated, not always " +
         "almost there.' margin:0, so the -5px pull is a real 5px tuck and " +
         "every seam in the stack overlaps — belt over format by 4, format " +
         "over types by 5, both states");
  }

  /* (3) Once a path is chosen, the strip is the peek — rendered from state,
     everywhere, in every scroll position. The one exception is an open
     in-flow belt (data-held), reachable only pre-choice or in the render
     where the path was just chosen from an open belt; F14 owns that state
     and it closes into the peek. */
  if(!/\(S\.path && !\(S\.beltOpen && !S\.beltDrop\) \? ' data-park=""' : ''\)/.test(mc) ||
     (mc.split("data-park").length - 1) !== 1){
    fail("the strip's data-park does not render from S.path exactly once — " +
         "once chosen, the belt lives under the header (the owner's words: " +
         "'it stays under the header, so you can use it whenever'), and " +
         "parked must be state, not something scrolling grants and a tab " +
         "change takes away. The !(beltOpen && !beltDrop) half is F14's: an " +
         "open in-flow belt leaves with its pouches, then parks for good");
  }
  /* The peek is the SAME sticky strip pulled up by a margin — deliberately
     nothing else, so it renders in every browser ever made. The pull is
     peek − beltH − 18 − 1: main's own top padding and the sentinel's 1px,
     which stops collapsing against a margin this negative. The result lands
     the flow slot exactly on the sticky offset, so the peek is
     pixel-identical at the top of a fresh tab and mid-scroll. */
  /* 4.3.1: the bottom went 10 → 18. The owner's margin review found only
     Progress standing 18px clear of the peek — via a private inline patch —
     and called that the correct offset, so 18px of air is now the rule for
     all four tabs, and section 128 owns that clearance (both bottom margins
     and the no-inline-margin sweep). The PULL is unchanged and is what this
     pin is really for. */
  if(!/\.pathseg\[data-park\]\{margin:calc\(var\(--belt-peek\) - var\(--beltH\) - 18px - 1px\) 0 18px;\}/.test(HTML)){
    fail("the parked strip's pull is gone or drifted — " +
         "margin-top: calc(--belt-peek − --beltH − 18px − 1px) is what puts " +
         "the flow slot exactly at the sticky offset (37 with no inset), so " +
         "the peek reads 12px under the header at the top of a fresh tab " +
         "AND mid-list, with 18px of air before the content (the owner's " +
         "19 Aug margin review; section 128 owns the clearance). " +
         "18 in the calc is main's own top padding; the 1px is the " +
         "sentinel's height, whose −1px margin stops collapsing against a " +
         "margin this negative. Wrong by one and the fresh-tab peek is 13px " +
         "— the F1 twelfth, earned back");
  }
  if(!/\nmain\{[^}]*padding:18px 18px /.test(HTML) ||
     !/\n\.pcol\{padding:18px 18px /.test(HTML)){
    fail("the column padding no longer starts 18px 18px in both rules — " +
         "the parked strip's pull hardcodes that 18, and since 4.0.0 the " +
         "live column is .pcol while main carries the same padding for the " +
         "no-JS seed: all three must move together or every fresh-tab peek " +
         "shifts by the difference");
  }
  if(/\.pathseg\[data-park\]\{[^}]*(position:|anchor)/.test(HTML)){
    fail("the parked strip grew a position rule or an anchor — the first " +
         "cut of this section did exactly that and the owner saw NO SLIVER " +
         "AT ALL on six browsers while the harness Chromium drew it " +
         "perfectly. The peek is sticky plus a margin, nothing else: there " +
         "is nothing in it left to lack");
  }
  /* 4.0.4: the parked strip is NOT the peek any more — the header's
     #beltpeek is (sections 128 and 143). The strip's job while parked is to
     hold its box: it hides whole, :not([data-drop]) keeps a DROPPED belt
     working (F7), and :not([data-ride]) keeps the retraction visible while
     the top transition plays it home. */
  if(!/\.pathseg\[data-park\]:not\(\[data-drop\]\):not\(\[data-ride\]\)\{visibility:hidden;\}/.test(HTML)){
    fail("the chosen parked strip still paints inside the deck — it must " +
         "hide whole (the header's #beltpeek is the peek since 4.0.4, and " +
         "a strip that paints in the deck rides every swipe, which is the " +
         "4.0.x flicker back); :not([data-drop]) keeps a dropped belt " +
         "working (F7) and :not([data-ride]) lets the retraction play " +
         "before the swap");
  }
  if(!/seg\.setAttribute\("data-ride", ""\); seg\.removeAttribute\("data-drop"\);/.test(fn("closeBelt"))){
    fail("closeBelt() ends the drop without staging the ride — removing " +
         "data-drop alone leaves the strip [data-park] and hidden IN THE " +
         "SAME FRAME, so the retraction the top transition promises becomes " +
         "a blink; data-ride keeps the strip visible until the deferred " +
         "render swaps the header peek back in");
  }

  /* Every tab change routes through one door, and a dropped belt does not
     cross it. 4.0.0 added the second half, from the owner's report ("belt
     opened hit a tab, it breaks drops"): closeBelt("auto") renders the NEW
     panel only, so the departed panel kept its dropped strip and its
     position:fixed pouches — fixed is viewport-wide, so they painted over
     every tab, and a far panel never receives the idle refill that would
     have cleaned them. scrubBelt(prev) removes the departed panel's drop
     DOM in the same breath, on both doors (goTab and the swipe). */
  var gt = optionalFn("goTab", "tab changes have no policy");
  if(!/if\(S\.beltDrop\)\{ closeBelt\("auto"\); scrubBelt\(prev\); \} else render\(\);/.test(gt)){
    fail("goTab() lets a dropped belt keep its shadow on the new tab — the " +
         "drop is a way of standing in one list; leaving the tab retracts " +
         "it through the one close path (F12) AND scrubs the departed " +
         "panel's drop DOM (scrubBelt), or the fixed pouches float over " +
         "the new tab until an idle refill that a far panel never gets");
  }
  if(!/if\(S\.beltDrop\)\{ closeBelt\("auto"\); scrubBelt\(prev\); \} else render\(\);/
      .test(optionalFn("swipeRead", "the swipe door cannot be checked"))){
    fail("the swipe door lets a dropped belt keep its shadow — same defect " +
         "as goTab's, one gesture over: the departed panel keeps its " +
         "dropped strip and fixed pouches until an idle refill");
  }
  var sb = optionalFn("scrubBelt", "there is no scrub to check");
  if(!/removeAttribute\("data-drop"\)/.test(sb) || !/\.includes/.test(sb)){
    fail("scrubBelt() no longer removes both halves of the drop — the " +
         "strip's data-drop and the pouches element. Half a scrub leaves " +
         "either a mis-parked strip or floating pouches in the departed " +
         "panel");
  }
  ["goTab(b.dataset.tab)", 'goTab("stats")', 'goTab("home")',
   'goTab("next")', 'goTab("watch")'].forEach(function(site){
    if(HTML.indexOf(site) < 0){
      fail("a tab change bypasses goTab() — " + site + " is gone. Five " +
           "doors, one function: the tab bar, the ring, the wordmark, " +
           "resume, and the tier cards. A door wired around it is F12's " +
           "three-door lesson, applied to arrival");
    }
  });
  if(/beltHide|beltFix|beltRevealArmed/.test(HTML)){
    fail("the hidden-state bookkeeping is back — beltHide/beltFix/" +
         "beltRevealArmed belonged to the cut where parked was something " +
         "scrolling granted and a tab change had to carry. Parked is " +
         "rendered from S.path now; state that cannot exist cannot " +
         "resurrect, and machinery for it is where the next soak report " +
         "lives");
  }
  if(/beltDropping/.test(fn("persistNow"))){
    fail("the entrance flag is written to the saved payload — it is one " +
         "render long, like beltOpening (guard 96's rule, third verse)");
  }

  note("the belt's edges: entrance mirrors the retraction (34px, .22s, one " +
       "render), every stack seam overlaps (4/5), and once chosen the belt " +
       "IS the peek — sticky plus a margin, no position rule, no anchor, no " +
       "state bookkeeping; five tab doors through goTab, drops retract at " +
       "the door");
})();

/* ---------- 131. The install seat, and the two watching-truths ------------ */
/* 3.7.0. Two decisions in one release. The install seat: one quiet block in
   Progress, under the saves-line, that renders only where it can do
   something — behind a held beforeinstallprompt on the engines that fire
   one, as a dismissible hint on iOS where none exists, and not at all
   inside the installed app. It is furniture that removes itself, never a
   banner. And the footer split: the availability note and the dates note
   are truths about WATCHING, so they moved to Next up; Progress keeps the
   machinery — the saves-line and the build line. Each sentence lives in
   exactly one place, guard 121's drift lesson applied before the drift. */
(function(){
  var ib = optionalFn("installBlock", "the install seat has no renderer");
  var wn = optionalFn("watchNotes", "the watching-truths have no home");
  var vs = fn("viewStats"), vn = fn("viewNext");

  if(!/if\(isStandalone\(\)\) return ""/.test(ib)){
    fail("installBlock() renders inside the installed app — the seat's first " +
         "line is the standalone check, because an install button in the " +
         "installed app is furniture that forgot to remove itself");
  }
  if(!/if\(installEvt\)/.test(ib)){
    fail("the install button no longer waits for a held offer — without the " +
         "installEvt gate the button renders where tapping it can do " +
         "nothing, which is a banner with worse manners");
  }
  if(/installbtn(?:[^"]*\bprimary\b|")/.test(HTML) &&
     /class="[^"]*\bprimary\b[^"]*\binstallbtn\b|class="[^"]*\binstallbtn\b[^"]*\bprimary\b/.test(HTML)){
    fail("the install button took the bone fill — the decision was the quiet " +
         "outline: Progress already carries two primary fills, install is " +
         "tapped once ever, and an element that exists on one platform and " +
         "not another cannot hold primary weight");
  }
  if(HTML.indexOf('<button class="bkbtn installbtn" data-act="install">') < 0){
    fail("the install button left the bkbtn outline tier — quiet outline, " +
         "full width, under the saves-line: never bone, never signal fill, " +
         "never crimson");
  }
  if(HTML.indexOf('var iev = installEvt; installEvt = null;') < 0){
    fail("the offer is no longer spent before prompt() — prompt() throws on " +
         "a second call to the same event, so the held event is cleared " +
         "first and Chrome makes a fresh offer on a later visit");
  }
  if(!/beforeinstallprompt[\s\S]{0,120}preventDefault/.test(HTML)){
    fail("beforeinstallprompt no longer calls preventDefault() — Chrome's " +
         "own mini-infobar renders over the seat, which is exactly the " +
         "banner the seat exists to replace");
  }
  if(!/IOSDEVICE && !S\.insOff/.test(ib)){
    fail("the iOS hint lost its gate — it renders only on iOS, where no " +
         "prompt API exists, and only until dismissed");
  }
  if(!/insOff:S\.insOff \? true : undefined/.test(fn("persistNow"))){
    fail("insOff persists something other than only-true — groupOpen " +
         "persists only false because absent means open, progOpen only true " +
         "because absent means closed, and insOff follows progOpen: " +
         "persisting a default flips it the next time a build changes one");
  }
  if(HTML.indexOf('if(o.insOff === true) S.insOff = true;') < 0){
    fail("a restored payload can no longer dismiss the hint — or can " +
         "un-dismiss it, which is worse: the read side of the only-true " +
         "rule is as load-bearing as the write side");
  }

  if(vn.indexOf("watchNotes()") < 0){
    fail("Next up dropped the watching-truths — the availability note and " +
         "the dates note describe watching, and Next up is where watching " +
         "happens");
  }
  if(!/Availability changes constantly/.test(wn) ||
     !/Announced dates can move\./.test(wn)){
    fail("watchNotes() no longer carries both truths — availability and " +
         "announced dates travel together or the split has quietly become " +
         "a deletion");
  }
  if(/Availability changes constantly|Announced dates can move/.test(vs)){
    fail("a watching-truth is back in Progress — each sentence lives in " +
         "exactly one place, and its place is Next up. Two copies of one " +
         "sentence will drift; that is guard 121's lesson, applied here " +
         "before the drift instead of after");
  }
  if(/Progress saves automatically in this browser/.test(HTML)){
    fail("the saves-line is back in Progress — 4.2.2 removed it as a second " +
         "copy of the Your-data card's own first sentence, and two copies " +
         "of one fact drift; guard 121's lesson, applied here the same way " +
         "the watching-truths were. The no-save case is the header's " +
         "#nosave banner, not a footer line");
  }
  if(vs.indexOf("buildline") < 0){
    fail("the build line left Progress — it names the build and points at " +
         "the source, which is machinery, and machinery lives in Progress");
  }
  var seats = (HTML.match(/installBlock\(\)/g) || []).length -
              (HTML.match(/function installBlock\(\)/g) || []).length;
  if(seats !== 1){
    fail(seats + " install seats — the seat is one quiet block in Progress " +
         "under the data card, and a second call site is the first step " +
         "back toward a banner");
  }

  note("the install seat: standalone renders nothing, the button waits for " +
       "a held offer and spends it, the iOS hint dismisses forever " +
       "(only-true), quiet outline never a fill, one seat; the " +
       "watching-truths live on Next up and the machinery notes in Progress");
})();

/* ---------- 132. The offline promise is executed, not grepped ---------- */
/* 3.7.2, M-5 of the 10 Aug review. Section 11 compile-checks sw.js and several
   sections grep it; nothing ever RAN it. Invert `if(res && res.ok)` — caching
   error pages — break the offline navigate fallback, or delete the activate-
   time purge, and guards, smoke and all the negative fixtures stayed green
   while offline — a headline README promise — broke for every installed user.

   This drives the three handlers from the shipped file against the smallest
   mocks they touch. The promises are synchronous thenables on purpose: this
   file reports and exits at the bottom of a synchronous run, so an assertion
   that lands on a real microtask lands after the verdict. The functions under
   test are still sw.js's own, evaluated, never reimplemented. */

(function(){
  var swPath132 = path.join(PUBLIC, "sw.js");
  if(!fs.existsSync(swPath132)){
    fail("docs/sw.js is missing — offline has no worker to keep its promise");
    return;
  }
  var src132 = fs.readFileSync(swPath132, "utf8");

  function SyncP(v, bad){ this.v = v; this.bad = !!bad; }
  SyncP.wrap = function(x){ return x instanceof SyncP ? x : new SyncP(x); };
  SyncP.prototype.then = function(f, r){
    try{
      if(this.bad) return r ? SyncP.wrap(r(this.v)) : this;
      return f ? SyncP.wrap(f(this.v)) : this;
    }catch(e){ return new SyncP(e, true); }
  };
  SyncP.prototype["catch"] = function(r){ return this.then(null, r); };
  var SyncPromise = {
    resolve: function(x){ return SyncP.wrap(x); },
    reject: function(e){ return new SyncP(e, true); },
    all: function(arr){
      var out = [], firstErr = null, sawBad = false;
      arr.forEach(function(p){
        SyncP.wrap(p).then(function(v){ out.push(v); },
                           function(e){ if(!sawBad){ sawBad = true; firstErr = e; } });
      });
      return sawBad ? new SyncP(firstErr, true) : new SyncP(out);
    }
  };

  var store132 = Object.create(null), puts = [], added = [], deletedCaches = [];
  var cacheObj = {
    add: function(req){ added.push(req && req.url ? req.url : req); return SyncP.wrap(undefined); },
    put: function(req, res){
      puts.push(req && req.url ? req.url : req);
      store132[req && req.url ? req.url : req] = res;
      return SyncP.wrap(undefined);
    },
    match: function(req){ return SyncP.wrap(store132[req && req.url ? req.url : req]); }
  };
  var handlers = {};
  var nextFetch = null; /* set per drive: function(req) -> SyncP */
  var sandbox132 = {
    self: {
      addEventListener: function(t, f){ handlers[t] = f; },
      skipWaiting: function(){ return SyncP.wrap(undefined); },
      clients: { claim: function(){ return SyncP.wrap(undefined); } }
    },
    caches: {
      open: function(){ return SyncP.wrap(cacheObj); },
      keys: function(){ return SyncP.wrap(["night-watcher-0.0.0-stale", null]); },
      "delete": function(k){ deletedCaches.push(k); return SyncP.wrap(true); },
      match: function(req){ return cacheObj.match(req); }
    },
    location: { origin: "https://nightwatcher.life" },
    URL: URL,
    Request: function(u, o){ this.url = u; this.method = "GET"; this.mode = (o && o.mode) || ""; },
    Response: { error: function(){ return { ok: false, status: 0, swError: true }; } },
    Promise: SyncPromise,
    fetch: function(req){ return nextFetch(req); },
    console: console
  };
  try{ vm.runInNewContext(src132, sandbox132, {filename: "docs/sw.js"}); }
  catch(e){ fail("sw.js does not evaluate under the harness: " + e.message); return; }

  if(!handlers.install || !handlers.activate || !handlers.fetch){
    fail("sw.js no longer registers install/activate/fetch handlers — the " +
         "offline promise has nothing carrying it");
    return;
  }

  /* install precaches the whole shell, and skipWaiting is reached. */
  handlers.install({ waitUntil: function(p){ SyncP.wrap(p); } });
  var shell132 = sandbox132.SHELL || [];
  if(!shell132.length || added.length !== shell132.length){
    fail("the install handler cached " + added.length + " of " + shell132.length +
         " shell entries — a partial precache is an offline app with holes");
  }
  if(added.indexOf("./index.html") < 0){
    fail("the install handler never cached ./index.html — offline cannot open " +
         "the app at all");
  }

  /* activate purges every cache that is not the current one. */
  sandbox132.caches.keys = function(){
    return SyncP.wrap(["night-watcher-0.0.0-stale", sandbox132.CACHE]);
  };
  handlers.activate({ waitUntil: function(p){ SyncP.wrap(p); } });
  if(deletedCaches.indexOf("night-watcher-0.0.0-stale") < 0){
    fail("activate left a stale versioned cache in place — old builds are " +
         "never retired and storage grows with every release");
  }
  if(deletedCaches.indexOf(sandbox132.CACHE) >= 0){
    fail("activate deleted the CURRENT cache — every activation empties the " +
         "shell it just installed");
  }

  function drive(req, fetchImpl){
    var out = { responded: false, res: undefined, waited: 0 };
    nextFetch = fetchImpl;
    handlers.fetch({
      request: req,
      respondWith: function(p){ out.responded = true; SyncP.wrap(p).then(function(v){ out.res = v; }); },
      waitUntil: function(p){ out.waited++; SyncP.wrap(p); }
    });
    return out;
  }
  var APP = "https://nightwatcher.life/index.html";

  /* a good response is served and lands in the cache — via waitUntil, so the
     browser cannot kill the worker between the reply and the put (L-3). */
  var okRes = { ok: true, status: 200, clone: function(){ return this; } };
  var putsBefore = puts.length;
  var r1 = drive({ url: APP, method: "GET", mode: "" },
                 function(){ return SyncP.wrap(okRes); });
  if(!r1.responded || r1.res !== okRes){
    fail("a plain same-origin GET is not answered with the network response — " +
         "network-first is the whole recovery strategy");
  }
  if(puts.length !== putsBefore + 1){
    fail("a 200 response was not written to the runtime cache — offline never " +
         "learns about anything fetched after install");
  }
  if(!r1.waited){
    fail("the runtime cache write does not ride event.waitUntil — the browser " +
         "may kill the worker between the reply and the put, so a downloaded " +
         "update silently misses the offline cache (L-3 of the 10 Aug review)");
  }

  /* an error response is served but NEVER cached — the M-5 headline. */
  putsBefore = puts.length;
  var badRes = { ok: false, status: 500, clone: function(){ return this; } };
  var r2 = drive({ url: "https://nightwatcher.life/whoops", method: "GET", mode: "" },
                 function(){ return SyncP.wrap(badRes); });
  if(!r2.responded || r2.res !== badRes){
    fail("an error response is not passed through — the reader should see the " +
         "real failure, not a hung request");
  }
  if(puts.length !== putsBefore){
    fail("an error response was WRITTEN TO THE CACHE — one bad deploy and " +
         "offline serves the error page forever, which is the exact " +
         "stickiness the header comment promises this file avoids");
  }

  /* offline: a cached file is served from cache. */
  store132["https://nightwatcher.life/icon.png"] = { ok: true, cached: true };
  var r3 = drive({ url: "https://nightwatcher.life/icon.png", method: "GET", mode: "" },
                 function(){ return SyncPromise.reject(new Error("offline")); });
  if(!r3.res || r3.res.cached !== true){
    fail("with the network down, a cached file is not served from the cache — " +
         "offline is broken at the one moment it is the product");
  }

  /* offline: an uncached NAVIGATION still opens the app. */
  store132["./index.html"] = { ok: true, shell: true };
  var r4 = drive({ url: "https://nightwatcher.life/some/shared/path", method: "GET", mode: "navigate" },
                 function(){ return SyncPromise.reject(new Error("offline")); });
  if(!r4.res || r4.res.shell !== true){
    fail("an offline navigation to an uncached path does not fall back to the " +
         "app shell — a shared link opened offline shows a browser error " +
         "instead of the app");
  }

  /* the worker never touches other origins or non-GETs. */
  var r5 = drive({ url: "https://example.com/x", method: "GET", mode: "" },
                 function(){ return SyncP.wrap(okRes); });
  if(r5.responded){
    fail("the fetch handler answered for a cross-origin request — the worker " +
         "must stay out of traffic it does not own");
  }
  var r6 = drive({ url: APP, method: "POST", mode: "" },
                 function(){ return SyncP.wrap(okRes); });
  if(r6.responded){
    fail("the fetch handler answered a non-GET — a POST through the cache " +
         "layer is a write treated as a read");
  }

  note("sw.js executed: shell precached (" + shell132.length + " entries), " +
       "stale cache purged, 200 cached via waitUntil, 500 not cached, " +
       "offline serves cache and the navigate fallback, cross-origin and " +
       "non-GET untouched");
})();

/* ---------- 133. The root negotiates markdown, and only the root ---------- */
/* 3.8.0, from the 10 Aug Radar triage: `GET /` with an Accept header that
   PREFERS text/markdown answers with llms.txt as text/markdown — the one item
   gating agent-readiness Level 3. The dashboard alternative (managed
   "Markdown for Agents") was declined for the same reason every panel rule
   is: undiffable, unguardable, and it strips validators. This one is a file
   in the repository, so it is executed here, the way sw.js is in 132 —
   worker.js is written with .then() chains instead of async/await precisely
   so a sync-thenable can drive it to completion inside one call stack.

   The stakes of the fallthrough branch are the whole tree: every guard above
   this one asserts things about the bytes docs/ serves, and a Worker sitting
   in front could quietly serve something else. So the passthrough assertions
   are IDENTITY checks — the response object the mock assets plane returned,
   not a copy — which is stronger than byte-for-byte. And run_worker_first is
   pinned to exactly ["/", "/.well-known/api-catalog"]: the root (an asset,
   negotiated) and the api-catalog (no asset, worker-owned), and nothing else,
   so every other path stays on the assets plane where worker code cannot
   reach it, slow it, or break it while down. */

(function(){
  var wpath = path.join(ROOT, "worker.js");
  if(!fs.existsSync(wpath)){
    fail("worker.js is gone — the markdown negotiation (Radar Level 3) has " +
         "no implementation, and wrangler.jsonc points at nothing");
    return;
  }
  if(fs.existsSync(path.join(PUBLIC, "worker.js"))){
    fail("a worker.js is inside docs/ — the Worker script is infrastructure, " +
         "not a served asset; a public copy is a second origin of truth");
  }
  var wsrc = fs.readFileSync(wpath, "utf8");
  var wr   = fs.readFileSync(path.join(ROOT, "wrangler.jsonc"), "utf8");
  if(!/"main":\s*"worker\.js"/.test(wr)){
    fail("wrangler.jsonc has no main pointing at worker.js — the negotiation " +
         "ships in the repo but never reaches the edge");
  }
  if(!/"binding":\s*"ASSETS"/.test(wr)){
    fail("the assets plane has no ASSETS binding — worker.js has no way to " +
         "fall through, and every request it touches dead-ends");
  }
  if(!/"run_worker_first":\s*\[\s*"\/"\s*,\s*"\/\.well-known\/api-catalog"\s*\]/.test(wr)){
    fail("run_worker_first is not exactly [\"/\", \"/.well-known/api-catalog\"] " +
         "— either the Worker never runs (no negotiation, no api-catalog) or " +
         "it fronts MORE than those two, and every asset behind it pays the " +
         "hop and inherits its failure modes");
  }

  /* Execute it. Real URL; stub Request/Response so the result can be read
     synchronously; a sync-thenable assets plane, as in 132. */
  var SyncV = function(v){ this.v = v; };
  SyncV.prototype.then = function(fn){
    var r = fn(this.v);
    return (r && typeof r.then === "function") ? r : new SyncV(r);
  };
  function un(p){
    var out, hit = false;
    if(p && typeof p.then === "function"){ p.then(function(v){ out = v; hit = true; }); }
    if(!hit) fail("the worker did not resolve synchronously under the " +
                  "sync-thenable harness — an await crept in");
    return out;
  }
  var LLMS = "# Night Watcher\n\nmock markdown body\n";
  var htmlRes = { status: 200, marker: "the blessed HTML, untouched" };
  var assetLog = [];
  var env = { ASSETS: { fetch: function(req){
    var u = typeof req === "string" ? req : req.url;
    assetLog.push(u);
    if(/\/llms\.txt$/.test(u)) return new SyncV({ status: 200,
      text: function(){ return new SyncV(LLMS); } });
    return new SyncV(htmlRes);
  } } };
  var box = { URL: URL,
              Request: function(u){ this.url = String(u); },
              Response: function(body, init){ this.body = body; this.init = init || {}; } };
  var mod;
  try{
    mod = new vm.Script(wsrc.replace("export default", "var WORKER =") + "\nWORKER;")
            .runInNewContext(box);
  }catch(e){
    fail("worker.js does not execute: " + e.message);
    return;
  }
  function req(accept, method, urlStr){
    return { url: urlStr || "https://nightwatcher.life/", method: method || "GET",
             headers: { get: function(n){ return /accept/i.test(n) ? accept : null; } } };
  }

  /* The one shape that negotiates. */
  var md = un(mod.fetch(req("text/markdown"), env));
  if(!md || md.body !== LLMS){
    fail("Accept: text/markdown on / did not answer with llms.txt's bytes — " +
         "the markdown representation must be THE llms.txt, one source, " +
         "not a second copy of the catalogue prose");
  } else {
    var mh = md.init.headers || {};
    if(!/^text\/markdown/.test(mh["Content-Type"] || "")){
      fail("the markdown response is not Content-Type: text/markdown — the " +
           "negotiation answered with the wrong label on the right body");
    }
    if((mh["Vary"] || "") !== "Accept"){
      fail("the markdown response does not carry Vary: Accept — any cache " +
           "between here and the agent will hand a browser markdown or an " +
           "agent HTML, whichever came first");
    }
    if((mh["Content-Location"] || "") !== "/llms.txt"){
      fail("the markdown response lost Content-Location: /llms.txt — the " +
           "one honest pointer to where this representation lives on its own");
    }
  }

  /* Everything else is the assets plane's response, BY IDENTITY. */
  [["a browser", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"],
   ["curl",      "*/*"],
   ["no Accept", null],
   ["a tie — markdown listed but html equal",  "text/markdown,text/html"],
   ["markdown at lower q than html", "text/markdown;q=0.5,text/html"]
  ].forEach(function(c){
    var r = un(mod.fetch(req(c[1]), env));
    if(r !== htmlRes){
      fail(c[0] + " (Accept: " + c[1] + ") did not get the assets plane's " +
           "response by identity — the Worker touched a request it does not own");
    }
  });
  /* 4.0.1: HEAD ON THE NEGOTIATED URL. The branch tested for GET alone, so
     a HEAD probe preferring markdown fell through to the assets plane and
     read as HTML — the same HEAD/GET representation mismatch api-catalog had
     (3.9.2), on the one URL that negotiates. Same headers, no body. */
  var mdHead = un(mod.fetch(req("text/markdown", "HEAD"), env));
  if(!mdHead || mdHead === htmlRes){
    fail("HEAD / with Accept: text/markdown fell through to the assets " +
         "plane — the negotiated URL answers HEAD as HTML while GET answers " +
         "markdown, and HEAD is what a validator probes with first");
  } else {
    if(mdHead.body){
      fail("HEAD / negotiated markdown but carried a body — HEAD answers " +
           "the headers of the GET and nothing else");
    }
    var mhh = mdHead.init.headers || {};
    if(!/^text\/markdown/.test(mhh["Content-Type"] || "") ||
       (mhh["Vary"] || "") !== "Accept"){
      fail("HEAD /'s markdown response does not carry the GET's headers — " +
           "the two methods must describe the same representation");
    }
  }
  /* Preference expressed through q-values still negotiates. */
  var q = un(mod.fetch(req("text/html;q=0.4,text/markdown;q=0.8"), env));
  if(!q || q.body !== LLMS){
    fail("markdown preferred through q-values (0.8 over html's 0.4) fell " +
         "through to HTML — the parser reads presence, not preference");
  }
  /* Method and path gates: the script itself refuses, even though wrangler
     scoping already keeps these off the Worker. Belt AND suspenders, because
     one of them is edge config. */
  var p = un(mod.fetch(req("text/markdown", "POST"), env));
  if(p !== htmlRes) fail("a POST negotiated markdown — the branch answers GET and HEAD only");
  var s = un(mod.fetch(req("text/markdown", "GET", "https://nightwatcher.life/sw.js"), env));
  if(s !== htmlRes){
    fail("a non-root path negotiated markdown in the script — run_worker_first " +
         "keeps it off the Worker today, but that is edge config, and the " +
         "script must refuse on its own");
  }
  /* A broken llms.txt must degrade to the page, not to a broken negotiation. */
  var env404 = { ASSETS: { fetch: function(rq){
    var u = typeof rq === "string" ? rq : rq.url;
    if(/\/llms\.txt$/.test(u)) return new SyncV({ status: 404 });
    return new SyncV(htmlRes);
  } } };
  var broken = un(mod.fetch(req("text/markdown"), env404));
  if(broken !== htmlRes){
    fail("with llms.txt unreadable the negotiation did not fall through to " +
         "the page — an agent gets a broken markdown body instead of the app");
  }
  /* 3.9.0: the well-known api-catalog is the Worker's second owned path — an
     empty RFC 9727 linkset on its own URL, GET-only, leaving the root's
     negotiation and every passthrough untouched. Its response is returned
     synchronously (no assets hop), so it is read directly, not through un(). */
  var ac = mod.fetch(req("*/*", "GET", "https://nightwatcher.life/.well-known/api-catalog"), env);
  if(!ac || ac.body !== '{"linkset":[]}'){
    fail("GET /.well-known/api-catalog did not answer an empty linkset — the " +
         "honest 'no API' is {\"linkset\":[]}, and any entry would invent an " +
         "anchor and a service-desc for an API that does not exist");
  } else {
    var ah = ac.init.headers || {};
    if((ah["Content-Type"] || "") !== "application/linkset+json"){
      fail("the api-catalog is not application/linkset+json — RFC 9727 names " +
           "the linkset media type, and the wrong label makes the right body " +
           "unreadable to the agent that asked");
    }
    if(ac.init.status !== 200){
      fail("the api-catalog did not answer 200 — a 404 there reads as 'no " +
           "api-catalog' rather than the honest 'no API'");
    }
  }
  /* 3.9.2: HEAD IS ANSWERED TOO. The branch tested for GET alone, so HEAD fell
     through to the assets plane and 404'd — a HEAD/GET status mismatch on a
     well-known URI, and HEAD is what a validator probes with first. Same
     headers, no body. */
  var acHead = mod.fetch(req("*/*", "HEAD", "https://nightwatcher.life/.well-known/api-catalog"), env);
  if(!acHead || typeof acHead.then === "function"){
    fail("HEAD /.well-known/api-catalog fell through to the assets plane — it " +
         "404s there, so a validator that probes with HEAD reads 'no catalogue' " +
         "from a site that serves one");
  } else {
    if(acHead.init.status !== 200){
      fail("HEAD /.well-known/api-catalog did not answer 200 while GET does — " +
           "the two methods must agree on the status of a URL that exists");
    }
    if(acHead.body){
      fail("HEAD /.well-known/api-catalog carried a body — HEAD answers the " +
           "headers of the GET and nothing else");
    }
    if(((acHead.init.headers || {})["Content-Type"] || "") !== "application/linkset+json"){
      fail("HEAD /.well-known/api-catalog did not carry the GET's content type");
    }
  }
  var acPost = un(mod.fetch(req("*/*", "POST", "https://nightwatcher.life/.well-known/api-catalog"), env));
  if(acPost !== htmlRes){
    fail("a POST to /.well-known/api-catalog did not fall through by identity " +
         "— the catalog branch must be GET and HEAD only, exactly like the " +
         "markdown branch (4.0.1)");
  }
  note("worker.js executed: markdown negotiation answers llms.txt with " +
       "Vary/Content-Location, five non-preferring shapes pass through by " +
       "identity, q-values read, POST and non-root refused in the script, " +
       "unreadable llms.txt degrades to the page; /.well-known/api-catalog " +
       "answers an empty linkset on GET and HEAD and nothing else; " +
       "run_worker_first pinned to " +
       "[\"/\", \"/.well-known/api-catalog\"]");
})();

/* ---------- 134. A removal is a fact with a clock, not a hole ---------- */
/* 3.8.0, premise 1 of the durability review (claude/durability-review-
   2026-08-11.md): marks are NOT grow-only. toggleWatched unmarks, toggleSkip
   deletes, rate() clears on a same-star tap — while every merge site was
   additive. So every individual removal resurrected cross-tab the moment
   another tab wrote; 3.7.2's resetAt covered only the full erase. Every mark
   now carries the time it LAST CHANGED, in either direction, in S.clk
   ({w:{}, s:{}, r:{}}), and the cross-tab merge is last-write-wins wherever
   a clock exists on either side: a clock whose mark is absent IS the
   tombstone. This also unblocks any future off-origin copy — the review's
   precondition for a file mirror or sync layer.

   THE RECORDED "THE MERGE ONLY EVER ADDS" DECISION IS AMENDED, NOT VOIDED:
   a payload with no clocks (an older build's) still merges additively, and
   restores/imports still only add — what changed is that a deliberate,
   clocked removal now outranks an addition nobody re-made. Smoke drives the
   behavior through the real listener with real StorageEvents; this section
   holds the shape so a refactor cannot quietly drop a leg of it.

   DELIBERATE: exportJSON() and the NW code carry NO clocks. A backup is a
   one-shot transport a person applies on purpose; it merges additively at
   apply time with a fresh clock, and keeping the formats stable is guards
   7/8/87's promise. Clocks ride only the live payload. */

(function(){
  var pn = fn("persistNow");
  if(!/clk:S\.clk/.test(pn)){
    fail("persistNow() no longer writes the per-mark clocks — the storage " +
         "payload is the only transport the tombstones ride, and without " +
         "clk every removal is additive-merge food again");
  }
  if(!/S\.clk = clocksOf\(o\.clk\)/.test(fn("restore"))){
    fail("restore() does not read the clocks back through clocksOf() — a " +
         "reload forgets every tombstone, and the next cross-tab write " +
         "resurrects what was removed before it");
  }
  var co = optionalFn("clocksOf", "clocks arrive from storage unvalidated");
  if(co && !/Object\.create\(null\)/.test(co)){
    fail("clocksOf() builds its maps on the default prototype — a payload " +
         "key named __proto__ walks the same chain section 126 closed");
  }
  if(co && !(/isFinite\(n\)/.test(co) && /n > 0/.test(co))){
    fail("clocksOf() adopts non-finite or non-positive clocks — a clock of " +
         "Infinity is a tombstone no future write can ever beat");
  }
  var sm2 = optionalFn("stampMark", "removals have no clock and cannot propagate");
  if(sm2 && !/Date\.now\(\)/.test(sm2)){
    fail("stampMark() does not stamp wall-clock time — the merge compares " +
         "clocks across devices, and anything else has no order");
  }
  [["unmarkWatched", "w", fn("unmarkWatched")],
   ["toggleSkip", "s", fn("toggleSkip")],
   ["rate", "r", fn("rate")]].forEach(function(site){
    if(site[2].indexOf('stampMark("' + site[1] + '"') < 0){
      fail(site[0] + "() does not stamp its clock — its removal is a hole " +
           "again, and a hole refills on the next cross-tab merge");
    }
  });
  var lst = sliceOr('window.addEventListener("storage"', "\ndocument.getElementById(\"tabs\")");
  if(!lst){
    fail("cannot locate the storage listener — the merge this section " +
         "exists to hold has nowhere to live");
  } else {
    if(!/clocksOf\(o\.clk\)/.test(lst)){
      fail("the cross-tab merge never reads the incoming clocks — every " +
           "branch is additive again, and an unmark lasts until the next " +
           "storage event");
    }
    if(!/!inc\.w\[k\] && !S\.clk\.w\[k\]/.test(lst)){
      fail("the legacy additive branch lost its clock guard — a clockless " +
           "payload from an older build resurrects a mark this build " +
           "removed on purpose, which is the exact defect the clocks fix");
    }
    if(!/S\.clk = \{w:Object\.create\(null\)/.test(lst)){
      fail("a cross-tab erase does not clear the clocks — resetAt is the " +
           "largest tombstone and the per-mark clocks restart under it, or " +
           "pre-erase clocks outrank post-erase marks forever");
    }
  }
  if(/clk/.test(fn("exportJSON"))){
    fail("exportJSON() carries the clocks — a backup is a one-shot transport " +
         "a person applies on purpose, the formats are guards 7/8/87's " +
         "stability promise, and the clocks ride the live payload only");
  }
  note("removals carry clocks: persistNow writes clk, restore reads it " +
       "validated, three removal sites stamp, the merge is LWW where a " +
       "clock exists and additive where none does, backups stay clockless");
})();

/* ---------- 135. The auth.md H1 carries its own name ------------------ */
/* The 14 Aug isitagentready triage's one honest finding. The file opened
   "# Authentication" — a correct human title, and unreadable as an answer to a
   checker that matches the filename against the heading to identify the file
   it fetched. So the H1 says the file's own name.

   THIS GUARD ASSERTS THE TOKEN AND NOTHING ELSE. It is not licence to grow an
   authentication story later: the body says there is nothing to sign into,
   that is true, and section 118 is what holds it true. A one-line copy fix
   with no guard is a one-line copy fix that regresses on the next unrelated
   edit — which is the whole reason this project turns decisions into failing
   checks (1.8.5). */

(function(){
  var fp = path.join(PUBLIC, "auth.md");
  if(!fs.existsSync(fp)){
    fail("docs/auth.md is gone — agents ask the question whether or not the " +
         "site answers it, and no answer is not the same as 'nothing to sign into'");
    return;
  }
  var h1 = (fs.readFileSync(fp, "utf8").split("\n").filter(function(l){
    return /^#\s+\S/.test(l);
  })[0] || "").trim();
  if(!h1){
    fail("docs/auth.md has no H1 — the file a checker fetches has to say what it is");
  } else if(h1.indexOf("auth.md") < 0){
    fail("the auth.md H1 (" + h1 + ") no longer contains the token \"auth.md\" — " +
         "a checker matching the filename against the heading cannot identify " +
         "the file, which is the only reason the token is in the title");
  } else {
    note("auth.md H1 carries the token: " + h1);
  }
})();

/* ---------- 136. One origin, one binding, in the file ------------------ */
/* 14 AUGUST 2026, AND THIS SECTION IS THE HALF THAT CAN BE CHECKED. The Worker
   was deleted, recreated from the dashboard, and came back with TWO overlapping
   apex bindings — a Custom Domain nightwatcher.life AND a Route
   nightwatcher.life/*. Cloudflare cannot serve both on one host. The site
   failed for every fresh visitor while a cached PWA masked it in the owner's
   own browser: loaded normally, failed in incognito. That contrast is the tell,
   and it is written into RELEASING.md because no guard can see it.

   WHAT THIS PINS IS THE FILE. It cannot see a Custom Domain or a Route added in
   the Cloudflare panel — which is exactly what took the site down — and a guard
   that pretended to would be worse than an honest gap. Guard 82 caught the
   file; nothing could catch the panel. The other half is RELEASING.md,
   "Recovering a deleted or mis-bound Worker". Neither covers the other, and
   saying so here is the point. */

(function(){
  var fp = path.join(ROOT, "wrangler.jsonc");
  if(!fs.existsSync(fp)){ fail("wrangler.jsonc is gone"); return; }
  var raw = fs.readFileSync(fp, "utf8");
  /* The comments in this file are load-bearing prose, not noise — strip them
     for the parse and leave them on disk. */
  /* String-aware, because a route pattern legitimately contains "/*" and a
     regex stripper eats the rest of the file from there. The suite found this
     the first time it was asked to add a wildcard route \u2014 which is the whole
     argument for negative fixtures on a guard that ships the same day. */
  var stripJsonc = function(t){
    var out = "", inStr = false, i = 0;
    while(i < t.length){
      var ch = t.charAt(i);
      if(inStr){
        out += ch;
        if(ch === "\\"){ out += t.charAt(i + 1); i += 2; continue; }
        if(ch === '"') inStr = false;
        i++; continue;
      }
      if(ch === '"'){ inStr = true; out += ch; i++; continue; }
      if(ch === "/" && t.charAt(i + 1) === "*"){
        var end = t.indexOf("*/", i + 2);
        i = end < 0 ? t.length : end + 2; continue;
      }
      if(ch === "/" && t.charAt(i + 1) === "/"){
        var nl = t.indexOf("\n", i);
        i = nl < 0 ? t.length : nl; continue;
      }
      out += ch; i++;
    }
    return out;
  };
  var cfg;
  try{
    cfg = JSON.parse(stripJsonc(raw));
  }catch(e){
    fail("wrangler.jsonc does not parse once its comments are stripped (" +
         e.message + ") — the deploy config is the one file with no test but " +
         "the deploy itself");
    return;
  }

  if(cfg.workers_dev !== false){
    fail("wrangler.jsonc no longer sets workers_dev:false — the preview " +
         "hostname served the whole app and was indexable, so the site " +
         "competed with itself in search. There is one origin and the apex is " +
         "the preview (precedent: guard 82's 'no CNAME')");
  }

  var routes = cfg.routes;
  if(!Array.isArray(routes) || routes.length !== 1){
    fail("wrangler.jsonc declares " + (Array.isArray(routes) ? routes.length : "no") +
         " routes — ONE HOSTNAME IS ONE BINDING. Two apex bindings is the shape " +
         "that took the site down on 14 Aug 2026, and it is invisible from " +
         "inside the app");
  } else {
    var r = routes[0];
    if(r.pattern !== "nightwatcher.life"){
      fail("the apex route pattern is \"" + r.pattern + "\", not " +
           "\"nightwatcher.life\" — a wildcard pattern here is a Route, and a " +
           "Route alongside the Custom Domain is the conflict");
    }
    if(r.custom_domain !== true){
      fail("the apex is not bound as a custom domain — as a plain route " +
           "Cloudflare stops owning the DNS record and the certificate, and " +
           "there stops being one place to look when either is wrong");
    }
  }
  note("deploy config pinned: workers_dev off, one apex binding, custom domain " +
       "(the panel half lives in RELEASING.md and cannot be guarded)");
})();

/* ---------- 137. The 3.9.2 storage and header fixes stay fixed --------- */
/* Four seams the 14 August review found, none of which any existing section
   could see. They are pinned by source shape rather than behaviour because
   three of the four are one-line reverts, and a one-line revert is exactly the
   thing that survives a review and dies in the next refactor.

   Each assertion names what breaks if the line goes, because "keep this line"
   is not a reason and this file does not accept one. */

(function(){
  var fn = (HTML.match(/function flagSave\(\)[\s\S]*?\n\}/) || [""])[0];
  if(fn.indexOf('removeProperty("--hdrh")') < 0){
    fail("flagSave() no longer clears the --hdrh override — it only ever SET " +
         "it before 3.9.2, so a session that lost storage and recovered kept " +
         "the banner-inflated header height until reload, and --ghtop, the " +
         "belt's sticky top, the drop and the includes panel all parked a " +
         "banner below the real header edge. Clearing also hands the height " +
         "back to the calc() that tracks env(safe-area-inset-top)");
  }

  if(!/for\(src in \(wBox \|\| \{\}\)\) if\(HAS\.call\(wBox, src\) && wBox\[src\]\)/.test(HTML) ||
     !/for\(src in \(kBox \|\| \{\}\)\) if\(HAS\.call\(kBox, src\) && kBox\[src\]\)/.test(HTML)){
    fail("the JSON import no longer consults the VALUE of a stored mark — " +
         "marksOf() has required truthiness on the storage read path since the " +
         "shaping work, and a backup carrying \"some-id\": false imported as " +
         "watched. Two import surfaces disagreeing about one shape is the defect");
  }

  var dl = (HTML.match(/function dedupeLog\(log\)[\s\S]*?\n\}/) || [""])[0];
  if(dl.indexOf("ts:Number(e.ts)") < 0){
    fail("dedupeLog() no longer re-boxes its entries — mergeLog() has always " +
         "re-boxed on the import path because an unshaped entry persists " +
         "through every future persistNow() forever, and own-storage was the " +
         "same hole with a shorter path to it");
  }

  var iosAt  = HTML.indexOf("var IOSDEVICE");
  var restAt = HTML.indexOf("restore(function(){");
  if(iosAt < 0 || restAt < 0 || iosAt > restAt){
    fail("var IOSDEVICE is assigned after the restore() call again — with " +
         "storage blocked restore() renders synchronously, so the iOS install " +
         "hint went missing from the first paint of a #progress deep link. A " +
         "declaration the first render depends on belongs above the first render");
  }
  note("3.9.2 seams pinned: --hdrh cleared on recovery, import consults mark " +
       "values, own-storage log re-boxed, IOSDEVICE above the first render");
})();

/* ---------- 138. The negative coverage map, and what it still owes ----- */
/* README.md, NOTES.md, index.html's header block and this file's own opening
   comment all said, from 1.6.x until 3.9.2, that EVERY guard had been
   negative-tested. A full mapping of the 688 fixtures onto the sections they
   break showed 32 sections with no fixture at all — including 132, the largest
   section in the file, which shipped in 3.7.2 next to a negtest suite written
   for that release's OTHER change. Four releases of that claim were written by
   people reading the claim.

   3.9.2 closed seven of them and softened all four sentences. This section is
   what stops the sentence drifting back: the uncovered set is COMPUTED on every
   run and held against the list below. A section may leave the list — that is
   the point, and the guard tells you to strike it. A section may not join it.

   HOW THE MAP IS BUILT, AND WHERE IT IS APPROXIMATE. Every run_case/green_case
   in qa/negative/ declares an expected substring of the failure it is fishing
   for. That substring is matched against the source of each numbered section
   after concatenation seams and \u2014-escapes are normalised away. It is a
   substring match, so it is approximate in BOTH directions: a section whose
   failure text is assembled from variables can read as uncovered when a fixture
   does exercise it, and a phrase common to two sections can mark the wrong one
   covered. That is why the list is pinned rather than merely reported. The
   guard's job is to keep the SET stable and shrinking, not to certify any
   individual section \u2014 and claiming otherwise here would be the same kind of
   sentence this section exists to retire. */

(function(){
  var negDir = path.join(ROOT, "qa", "negative");
  if(!fs.existsSync(negDir)){ fail("qa/negative/ is gone"); return; }

  /* EMPTY AS OF 3.9.4, and that is the whole point of having had a list. It
     opened at 26 in 3.9.2 and negtest430 closed the last of them. The array
     stays because the ratchet is the array: a section arriving without a
     fixture fails the build, and the only way to quiet it is to write the
     fixture or to put the number here and say in the commit why it waits. It
     has never been added to. */
  var STILL_OWED = [];

  var SELF = fs.readFileSync(__filename, "utf8");
  var re = /\/\* -{3,} (\d+)\./g, m, marks = [];
  while((m = re.exec(SELF))) marks.push({n: parseInt(m[1], 10), at: m.index});
  var norm = function(t){
    return t.replace(/\\u2014/g, "\u2014").replace(/\\u2019/g, "\u2019")
            .replace(/\\"/g, '"').replace(/"\s*\+\s*\n?\s*"/g, "")
            .replace(/\s+/g, " ");
  };
  /* 3.9.4: THE MATCH IS AGAINST fail() TEXT, NOT THE WHOLE SECTION. Matching
     section prose credited a section for words that appear in its COMMENT — the
     expect "_headers" was covering three sections that mention the file and
     have no fixture between them. Tightening it to failure messages, and
     raising the minimum expect to 12 characters, uncovered three real gaps
     (34, 75, 117) that had been reading as covered since the map was written.
     A coverage guard that is easy to satisfy is worse than no coverage guard,
     because it is quoted. */
  var secs = marks.map(function(s, i){
    var src = SELF.slice(s.at, i + 1 < marks.length ? marks[i + 1].at : SELF.length);
    return {n: s.n, t: norm((src.match(/fail\([\s\S]*?\);/g) || []).join(" "))};
  });

  var expects = [], noSect = 0;
  /* Guards fixtures written before 4.2.4, which keep substring-anywhere
     semantics. The ratchet below holds this number exactly; see the census
     comment for the three legitimate reasons it may move. */
  /* 763 as of 4.2.5: negtest500's acorn-under-CI fixture expects a failure
     emitted before section 1 (fnIndex runs at extraction time), where no §
     exists to name — the raise case this comment block documents. */
  var NO_SECT_PINNED = 763;
  fs.readdirSync(negDir).filter(function(f){ return /^negtest.*\.sh$/.test(f); }).forEach(function(f){
    var t = fs.readFileSync(path.join(negDir, f), "utf8").replace(/\\\n/g, " ");
    /* 3.9.5: green_case IS NOT HARVESTED, AND HARVESTING IT WAS A BUG. The two
       helpers do not share a signature — run_case is (label, expect, mutation)
       and green_case is (label, mutation), because a green case asserts an exit
       code rather than a string. This regex took "the second quoted argument"
       from both, so the five green_case fixtures were feeding PYTHON SOURCE
       into the coverage map as though it were expected failure text.

       Nothing broke, which is the point: the map is a substring test, and
       python source almost never appears inside a fail() string, so those five
       contributed nothing and looked like they contributed. The failure mode it
       could have produced is the one section 138 exists to prevent — a section
       credited as covered by a fixture that cannot cover it, since a green_case
       asserts the guards stay QUIET and so proves no section can fail. Reading
       an expect off it is a category error however harmless the strings are. */
    var r = /^[ \t]*run_case\s+"((?:[^"\\]|\\.)*)"\s+"((?:[^"\\]|\\.)*)"/gm, x;
    while((x = r.exec(t))) expects.push(x[2]);

    /* 4.2.4, Q-3b of the re-audit: THE SECT RATCHET. run_case's sixth
       argument (4.2.3) pins a fixture's match to its section's §-prefixed
       line — but only two fixtures used it, and nothing stopped the next
       hundred from arriving without one. Same shape as STILL_OWED: the
       census below counts guards fixtures that pass NO section number and
       holds the figure to a pin. The 762 written before 4.2.4 keep the
       substring-anywhere semantics they were written against — rewriting
       them wholesale is how you invent 762 false-reds — but a fixture ADDED
       without sect is the Q-3 hole reopening, and it fails here. The pin
       may only move in a commit that says why: a struck fixture, a
       retrofitted sect (lower it), or a failure genuinely emitted before
       section 1, where no § exists to name (raise it, and say so). */
    var sr = /^[ \t]*run_case\s+"(?:[^"\\]|\\.)*"\s+"(?:[^"\\]|\\.)*"\s+"(?:[^"\\]|\\.)*"((?:[ \t]+(?:"[^"\n]*"|[^\s"]+))*)/gm, sx;
    while((sx = sr.exec(t))){
      var toks = (sx[1].match(/"[^"\n]*"|[^\s"]+/g) || []).map(function(s){
        return s.replace(/^"|"$/g, "");
      });
      if((toks[0] || "guards") !== "guards") continue;
      if(!/^\d+$/.test(toks[2] || "")) noSect++;
    }
  });

  if(noSect !== NO_SECT_PINNED){
    fail("the corpus holds " + noSect + " guards fixtures that pass no section " +
         "number and the pin says " + NO_SECT_PINNED + " — a fixture added " +
         "without sect is the substring-anywhere hole reopening: name the " +
         "section it is aimed at, or move the pin in the same commit and say " +
         "why (struck fixture, retrofitted sect, or a failure emitted before " +
         "section 1 where no § exists)");
  }

  var covered = {};
  expects.forEach(function(e){
    var q = norm(e.replace(/\\\$/g, "$"));
    if(q.length < 12) return;
    secs.forEach(function(s){ if(s.t.indexOf(q) >= 0) covered[s.n] = 1; });
  });

  var uncovered = secs.map(function(s){ return s.n; })
                      .filter(function(n){ return !covered[n]; });
  var owed = {}; STILL_OWED.forEach(function(n){ owed[n] = 1; });

  uncovered.forEach(function(n){
    if(!owed[n]){
      fail("section " + n + " has no negative fixture and is not on the list of " +
           "sections that owe one \u2014 a guard nobody has ever seen fail is a guard " +
           "nobody has checked asserts anything. Write the fixture, or add the " +
           "number to STILL_OWED and say in the commit why it waits");
    }
  });
  STILL_OWED.forEach(function(n){
    if(covered[n]){
      fail("section " + n + " is negative-tested now but is still listed as " +
           "owing a fixture \u2014 strike it from STILL_OWED. The list only shrinks, " +
           "and a list that does not shrink when the work lands stops being read");
    }
    if(!secs.some(function(s){ return s.n === n; })){
      fail("STILL_OWED names section " + n + ", which does not exist any more");
    }
  });
  note("negative coverage: " + (secs.length - uncovered.length) + "/" + secs.length +
       " sections mapped from " + expects.length + " fixtures, " + STILL_OWED.length +
       " still owed, " + noSect + " pre-4.2.4 fixtures without sect (pinned)");
})();

/* ---------- 139. The files an agent reads answer fresh --------------- */
/* 3.9.2 shipped a one-line change to auth.md's H1 so a checker could identify
   the file by name. The deploy landed and the first read of /auth.md came back
   with the PREVIOUS release's heading; a cache-busted read came back correct.
   Nothing was wrong with the deploy. auth.md, llms.txt and orders.txt had no
   block in _headers at all, so they inherited whatever the assets plane emits
   by default while / and /sw.js declared no-cache for themselves.

   A browser rereads a page. An agent asks once, writes down the answer, and
   does not come back to see whether it changed \u2014 which makes a stale
   representation of these three files worse than a stale representation of the
   app, not better. They are the only files whose whole purpose is to be read
   by something that will not check twice.

   404.html joins this section rather than getting its own. Its CSP is a
   <meta> policy, which covers the document it sits in and nothing else \u2014 the
   same shape as index.html's, and the same reason: the guards can read a file
   in the tree and cannot read a dashboard rule. */

(function(){
  var hp = path.join(PUBLIC, "_headers");
  if(!fs.existsSync(hp)){ fail("docs/_headers is gone"); return; }
  var hdr = fs.readFileSync(hp, "utf8");

  ["/auth.md", "/llms.txt", "/orders.txt"].forEach(function(route){
    var block = hdr.split(/\n(?=\/)/).filter(function(b){
      return b.split("\n")[0].trim() === route;
    })[0];
    if(!block){
      fail("_headers has no block for " + route + " \u2014 it falls back to the " +
           "assets plane's default, and an agent that reads it once and caches " +
           "the answer has no way to learn the answer changed");
    } else if(!/Cache-Control:\s*no-cache/.test(block)){
      fail(route + " no longer declares no-cache \u2014 the file exists to be read " +
           "by something that will not come back to check");
    }
  });

  var fp = path.join(PUBLIC, "404.html");
  if(!fs.existsSync(fp)){ fail("docs/404.html is gone"); return; }
  var page = fs.readFileSync(fp, "utf8");
  if(!/<meta http-equiv="Content-Security-Policy"/.test(page)){
    fail("404.html carries no CSP \u2014 index.html's <meta> policy covers the " +
         "document it sits in and no other, so the 404 page shipped with none");
  } else if(!/default-src 'none'/.test(page)){
    fail("404.html's CSP does not start from default-src 'none' \u2014 the 404 page " +
         "is served on every wrong URL anyone ever guesses at this origin");
  }
  note("agent-readable files declare no-cache (auth.md, llms.txt, orders.txt); " +
       "404.html carries its own default-src 'none' policy");
})();

/* ---------- 140. The disclosure channel is a file, and it has not expired --- */
/* 3.9.5. Cloudflare's Security Center reports security.txt "not configured" on
   this domain and offers a dashboard form as the remedy. The finding's own
   detection method is the reason it is answered here instead: "We evaluated the
   Security Settings configured for this domain" — it reads the panel, not the
   origin. A managed record can therefore clear the finding while nothing is
   served, and this file can serve correctly while the finding stays red.
   Neither outcome is a statement about this site, so the dot is not the target;
   a reachable channel is. Same argument as _headers, one layer up: a file can
   be diffed, guarded and shipped inside a release, and a panel can be none of
   those.

   WHAT ROTS HERE IS THE DATE, NOT THE FILE. RFC 9116 makes Expires mandatory
   and wants it inside a year, so a correct security.txt becomes an incorrect
   one by nobody doing anything — and an expired disclosure file reads as an
   abandoned project, which is worse than never having published one. A courtesy
   nobody is reminded to renew is a promise with a timer on it. So the timer runs
   against the build: this section goes red 30 days BEFORE the date, while there
   is still a month to ship the renewal, rather than on the morning the file
   starts lying. That is the whole reason this section exists — the fields could
   be eyeballed, the clock cannot.

   THE CONTACT IS A URL ON PURPOSE. SECURITY.md routes reports to GitHub's
   private vulnerability reporting. A mailto: here would be a second channel
   able to drift from the first, and a permanent scrape target on a page whose
   entire job is to be crawled. This section refuses one by name rather than
   trusting the next editor to remember why it is absent. */

(function(){
  var wk = path.join(PUBLIC, ".well-known", "security.txt");
  if(!fs.existsSync(wk)){
    fail("docs/.well-known/security.txt is gone — the disclosure pointer ships " +
         "as a file in this tree, and the only other place it could live is a " +
         "dashboard record no guard in here can read");
    return;
  }
  var txt = fs.readFileSync(wk, "utf8");
  var body = txt.split("\n").filter(function(l){ return !/^\s*#/.test(l); }).join("\n");
  var field = function(name){
    var m = body.match(new RegExp("^" + name + ":[ \\t]*(\\S.*)$", "mi"));
    return m ? m[1].trim() : "";
  };

  var contact = field("Contact");
  if(!contact){
    fail("security.txt declares no Contact — it is the one field RFC 9116 " +
         "exists to carry, and a disclosure file without it is a page that " +
         "says nothing at the address researchers are told to look");
  } else if(contact.indexOf("/security/advisories/new") < 0){
    fail("security.txt's Contact no longer points at GitHub private " +
         "vulnerability reporting, which is the channel SECURITY.md tells " +
         "people to use — two files naming two channels is how one of them " +
         "stops being read");
  }
  if(/mailto:/i.test(body)){
    fail("security.txt publishes a mailto: address — 3.9.5 chose a URL " +
         "contact so this file adds no scrape target to a page written to be " +
         "crawled, and so there is exactly one disclosure channel to keep true");
  }

  var exp = field("Expires");
  if(!exp){
    fail("security.txt declares no Expires — RFC 9116 requires it, and a " +
         "disclosure file with no freshness claim cannot be told apart from " +
         "one that was abandoned");
  } else {
    var when = Date.parse(exp);
    if(isNaN(when)){
      fail("security.txt's Expires is not a date this build can read — " +
           "RFC 9116 wants an ISO 8601 timestamp, and a value only a human " +
           "can parse is one no scanner will honour");
    } else {
      var days = Math.floor((when - Date.now()) / 86400000);
      if(days < 30){
        fail("security.txt expires in " + days + " days — renew the Expires " +
             "field and ship it. This fires a month early on purpose: an " +
             "expired disclosure file reads as an abandoned site, and the " +
             "point of dating it in the repository is that the build reminds " +
             "you while there is still time");
      } else if(days > 366){
        fail("security.txt expires in " + days + " days — RFC 9116 asks for " +
             "less than a year so the file is re-read rather than left, and a " +
             "date far enough out to outlive the project proves nothing about " +
             "whether anyone is still listening");
      }
    }
  }

  var canon = field("Canonical");
  if(canon !== "https://nightwatcher.life/.well-known/security.txt"){
    fail("security.txt's Canonical is not the apex URL it is served from — " +
         "one origin is the standing decision, and a disclosure file that " +
         "names a different home is the workers.dev argument coming back");
  }
  if(field("Policy").indexOf("SECURITY.md") < 0){
    fail("security.txt's Policy no longer points at SECURITY.md — the scope " +
         "of a report lives in one place, and this file is the pointer to it " +
         "rather than a second copy that can disagree");
  }

  var sec = path.join(ROOT, "SECURITY.md");
  if(fs.existsSync(sec) && !/private vulnerability reporting/i.test(fs.readFileSync(sec, "utf8"))){
    fail("SECURITY.md stopped naming GitHub private vulnerability reporting " +
         "while security.txt still points every scanner at it — the two " +
         "files describe one channel and have to move together");
  }

  /* The existence check is not ceremony: section 139 returns quietly when
     _headers is gone, so without this one the read below throws and takes the
     whole run down BEFORE section 104 can say the file is missing. negtest251
     caught exactly that on the first full run of this section. A guard that
     crashes the suite is worse than a guard that fails it, because the message
     the reader needs belongs to a different section. */
  var hpath = path.join(PUBLIC, "_headers");
  if(!fs.existsSync(hpath)) return;
  var hdr = fs.readFileSync(hpath, "utf8");
  var blk = hdr.split(/\n(?=\/)/).filter(function(b){
    return b.split("\n")[0].trim() === "/.well-known/security.txt";
  })[0];
  if(!blk){
    fail("_headers has no block for /.well-known/security.txt — the file " +
         "carries an Expires date, so a cached copy does not answer late, it " +
         "answers with a freshness claim that has stopped being true");
  } else if(!/Cache-Control:\s*no-cache/.test(blk)){
    fail("/.well-known/security.txt no longer declares no-cache — it is read " +
         "once by a scanner that writes down the answer and never asks again");
  }
  note("security.txt: URL contact, policy at SECURITY.md, expires in " +
       (exp ? Math.floor((Date.parse(exp) - Date.now()) / 86400000) : "?") +
       " days, no-cache declared");
})();

/* ---------- 141. The two orderings are named once, and shared ---------- */
/* 3.9.6. orders.txt shipped by universe only for thirteen releases, and the
   reason was never that the other two orderings were unwanted: they are
   COMPUTED, they were computed by anonymous functions inside buildGroups(), and
   fn() can only extract named ones. Writing the sorts out in this file would
   have been a second implementation of the app's ordering — a copy that drifts,
   stops testing the app, and from here starts PUBLISHING the drift.

   Naming them fixed that, and this section is what stops the fix being undone
   by a tidy-up. Inlining `function(a,b){...}` back into the sort call would
   leave every test green and section 105 still generating from whatever the
   named functions last said, which is the drift arriving through the back door
   — the export and the app agreeing on paper and disagreeing on screen.

   It also pins what each comparator keys on, because section 105's buckets
   depend on it: lifeCmp sorts within an era and releaseCmp within a decade,
   and neither is a total order on the flat catalogue. */

(function(){
  var life = optionalFn("lifeCmp", "the life ordering has no comparator to check"),
      rel = optionalFn("releaseCmp", "the release ordering has no comparator to check"),
      bg = optionalFn("buildGroups", "there is no group builder to check");

  if(!/\.sort\(lifeCmp\)/.test(bg)){
    fail("buildGroups() no longer sorts the life ordering through lifeCmp — an " +
         "inline comparator here leaves every test green while orders.txt goes " +
         "on generating from a function the app has stopped using");
  }
  if(!/\.sort\(releaseCmp\)/.test(bg)){
    fail("buildGroups() no longer sorts the release ordering through releaseCmp " +
         "— same defect as the life branch: the export and the app would agree " +
         "on paper and disagree on screen");
  }
  if(/\.sort\(function/.test(bg)){
    fail("buildGroups() has an inline comparator again — the two orderings are " +
         "named so one source feeds the app and the export, and an anonymous " +
         "one cannot be extracted by fn()");
  }

  ["lo", "gi", "ix"].forEach(function(k){
    if(life.indexOf(k) < 0){
      fail("lifeCmp no longer keys on " + k + " — it settles order inside one " +
           "era, and section 105 publishes the result as Bruce's life");
    }
  });
  if(rel.indexOf(".y") < 0 || rel.indexOf("localeCompare") < 0){
    fail("releaseCmp no longer keys on the year and the title — it settles " +
         "order inside one decade, and section 105 publishes the result as " +
         "release order");
  }

  var txt = path.join(PUBLIC, "orders.txt");
  if(fs.existsSync(txt)){
    var body = fs.readFileSync(txt, "utf8");
    ["ORDERING 1 OF 3", "ORDERING 2 OF 3", "ORDERING 3 OF 3"].forEach(function(b){
      if(body.indexOf(b) < 0){
        fail("orders.txt is missing " + b + " — the header promises three " +
             "orderings and a reader of a text file cannot see which one did " +
             "not render");
      }
    });
  }
  note("orderings: lifeCmp and releaseCmp named in index.html, sorted through " +
       "in buildGroups(), extracted by section 105, three banners in orders.txt");
})();

/* ---------- 142. A backup is stamped only when a copy left -------------- */
/* 3.9.6, and it guards a rule that was convention until now. lastExportAt is
   the claim that a copy of the progress LEFT this browser — the backup nudge
   counts marks against it, so a stamp with no file behind it silently tells
   somebody they are backed up when they are not. The download path has always
   been careful about this: download() returns a boolean and the stamp sits
   inside `if(dlOk)`. Nothing asserted it. Grep the tree before 3.9.6 and there
   is no guard, no smoke check and no browser check on any of it.

   3.9.6 adds a path where getting it wrong is much easier. showSaveFilePicker
   REJECTS when the person hits cancel, and a rejected picker looks exactly like
   a successful one to any code that forgot to check — so the failure mode is a
   dismissed dialog that marks the backup fresh. The helpers deliberately never
   touch lastExportAt themselves; every one of them resolves a boolean and the
   stamp stays at the call site, downstream of it. This section holds that line.

   The handle lives in IndexedDB, which the 11 Aug durability review rejected
   for progress — "a second copy in the same bucket is bookkeeping, not
   durability". A handle is not a copy. It is a pointer to a file OUTSIDE the
   origin bucket, which is the one place clear-site-data and ITP cannot reach,
   and that is the whole durability argument for item 4. */

(function(){
  var det = optionalFn("canSaveFile", "the backup-file feature detection is gone");
  if(det.indexOf("showSaveFilePicker") < 0 || det.indexOf("indexedDB") < 0){
    fail("canSaveFile() no longer feature-detects both showSaveFilePicker and " +
         "indexedDB — the picker without a place to keep the handle is a save " +
         "dialog, not durability, and every browser without either must fall " +
         "through to the download path untouched");
  }

  ["backupToFile", "refreshBackupFile", "fhWrite", "fhAllowed"].forEach(function(name){
    if(fn(name).indexOf("lastExportAt") >= 0){
      fail(name + "() stamps lastExportAt itself — the stamp is the claim that " +
           "a copy left, so it belongs at the call site downstream of the " +
           "boolean, never inside the thing that might have failed");
    }
  });

  if(optionalFn("fhAllowed", "the backup-file permission gate is gone")
      .indexOf("queryPermission") < 0){
    fail("fhAllowed() no longer queries the handle's permission before writing " +
         "— a handle restored from a previous session is not writable until " +
         "the person says so again, and skipping the check turns a silent " +
         "denial into a stamped backup that was never written");
  }

  var stamps = HTML.split("\n").filter(function(l){
    return l.indexOf("S.lastExportAt = Date.now()") >= 0;
  });
  if(!stamps.length){
    fail("nothing stamps lastExportAt any more — the backup nudge counts marks " +
         "against it and would never fire again");
  }
  stamps.forEach(function(l){
    if(l.indexOf("exportCode()") >= 0) return;
    if(!/if\s*\(/.test(l)){
      fail("a lastExportAt stamp is not gated on the write succeeding: " +
           l.trim().slice(0, 60) + " — a cancelled save picker rejects, and an " +
           "ungated stamp tells somebody they have a backup they do not have");
    }
  });

  if(!/canSaveFile\(\)\s*\?[^:]*data-act="savefile"/.test(HTML)){
    fail("the save-to-a-file control is no longer behind canSaveFile() — the " +
         "button would render in browsers that cannot honour it, which is a " +
         "dead control on every phone");
  }
  note("backups: " + stamps.length + " stamp sites, every one gated on a real " +
       "write; the handle helpers resolve booleans and stamp nothing");
})();

/* ---------- 143. Four panels, one live, the rest kept warm -------------- */
/* 4.0.0, release two of the tab swipe (the plan agreed 16 Aug; release one
   is 3.9.7's ownership move). The unnumbered scroll-owner block above pins
   WHERE scrolling lives; this section pins how the four tabs LIVE INSIDE the
   viewport — because every defect this feature can produce is a state
   defect, not a geometry defect: a stale panel shown as fresh, a background
   panel answering the screen reader, two live copies of the belt, a swipe
   that renders nothing because nobody marked anything dirty.

   THE CONTRACT. The deck is built once (buildDeck), four sections in tab
   order, each carrying its own scroll box and a .pcol column; render() fills
   ONLY the active panel synchronously and marks the other three dirty;
   queueNeighbors() re-fills the adjacent panels in idle time; the far panel
   waits until a swipe makes it a neighbor — snap-stop:always (the block
   above) is what guarantees it always becomes one first. Non-active panels
   are inert — that is the accessibility model: the tabs stay plain buttons,
   aria-current says where you are, and everything off-screen is out of the
   tab order and the accessibility tree in one attribute. */

(function(){
  var bd = optionalFn("buildDeck", "there is no swipe deck to check");

  /* Four panels, in the tab order the footer states, built inert — the
     first render un-inerts the active one, so nothing is ever live before
     it has content. */
  var nav = (HTML.match(/<nav id="tabs"[\s\S]*?<\/nav>/) || [""])[0];
  var navTabs = [];
  var nre = /data-tab="([a-z]+)"/g, nm;
  while((nm = nre.exec(nav))) navTabs.push(nm[1]);
  var order = (HTML.match(/var NWTABS = \[([^\]]*)\]/) || ["", ""])[1]
              .replace(/["\s]/g, "").split(",").filter(Boolean);
  if(order.join(",") !== navTabs.join(",")){
    fail("NWTABS [" + order.join(", ") + "] does not match the footer's own " +
         "tab order [" + navTabs.join(", ") + "] — the swipe's index " +
         "arithmetic and the tab bar are two statements of one order, and " +
         "if they drift a swipe right highlights the wrong button");
  }
  if(!/id="panel-' \+ t \+ '" inert/.test(bd) || !/class="panel"/.test(bd)){
    fail("buildDeck() does not build the four panels inert with their ids — " +
         "panel-<tab> is the seam's address (scroller() resolves the active " +
         "panel by it) and starting live is a screen reader reading four " +
         "tabs at once before the first render sorts them out");
  }
  if(!/class="pcol"/.test(bd)){
    fail("the panels have no .pcol column — the 760px centred column moved " +
         "off <main> when it became the viewport, and without the wrapper " +
         "every panel renders edge to edge on desktop");
  }

  /* The seam answers the active panel. */
  var sc = fn("scroller");
  if(sc.indexOf('"panel-" + S.tab') < 0){
    fail("scroller() does not resolve the active panel — every keep, " +
         "restore, go-to-top and belt query goes through this one function, " +
         "and pointing it anywhere else revives the 3.9.7 class of bug " +
         "(reading the scroller that is not the one moving) for all of them");
  }

  /* Dirty flags: render() fills the active panel and dirties the rest;
     something re-fills neighbors in idle time; a tick's surgical path does
     the same bookkeeping (it repaints one row, but Home, Next up and
     Progress all changed). */
  var rb = optionalFn("render", "the deck contract cannot be checked");
  /* 4.0.1: counted on collapsed whitespace — the exact-string count was
     blind to a reformatted third site and red on a benign reindent. */
  var dirtyMarks = (HTML.match(/NWTABS\.forEach\(function\(t\)\{\s*if\(t !== S\.tab\) nwDirty\[t\] = true;\s*\}\)/g) || []).length;
  if(rb.indexOf("fillPanel(S.tab, c)") < 0 || dirtyMarks !== 2){
    fail("render() no longer fills the active panel and dirties the other " +
         "three — the dirty mark must appear exactly twice, render() and " +
         "tickUpdate()'s surgical path (found " + dirtyMarks + ") — a state " +
         "change that leaves a background panel clean is a stale tab " +
         "waiting one swipe away, which no jsdom test can see because " +
         "jsdom never swipes");
  }
  if(rb.indexOf("queueNeighbors()") < 0 ||
     optionalFn("tickUpdate", "the surgical path is gone").indexOf("queueNeighbors()") < 0){
    fail("neighbors are not queued for idle re-fill from both render() and " +
         "tickUpdate()'s surgical path — the surgical path is the easy one " +
         "to forget: it repaints one row in The path while Home, Next up " +
         "and Progress all changed underneath");
  }
  var qn = optionalFn("queueNeighbors", "there is no idle refill to check");
  if(!/requestIdleCallback/.test(qn) || !/setTimeout/.test(qn)){
    fail("queueNeighbors() does not defer to idle time (with a setTimeout " +
         "fallback) — filling three panels synchronously on every tick is " +
         "the render cost the dirty flags exist to avoid");
  }
  if(!/nwDirty\[t\]/.test(qn)){
    fail("queueNeighbors() re-fills without consulting the dirty flags — " +
         "an idle pass that repaints clean panels turns every render into " +
         "four");
  }

  /* Inert bookkeeping: one sweep function, applied on render except
     mid-swipe, and applied when a swipe settles. */
  if(!/function panelsInert\(\)/.test(HTML) ||
     rb.indexOf("if(!nwSwiping) panelsInert()") < 0){
    fail("render() does not sweep inert onto the background panels (except " +
         "mid-swipe, where the outgoing panel stays live until the snap " +
         "settles) — without the sweep, background panels stay in the tab " +
         "order and the accessibility tree, and a keyboard user tabs into " +
         "a panel that is not on screen");
  }
  var sr = optionalFn("swipeRead", "there is no swipe commit to check");
  if(!/nwSwiping && Math\.abs\(x - i \* nwVW\) < 2/.test(sr) ||
     sr.indexOf("panelsInert()") < 0){
    fail("the swipe's settle does not sweep inert — 'once a swipe settles' " +
         "is the agreed rule, computed from the snap arithmetic (|x − i·w| " +
         "< 2) rather than from scrollend, and skipping the sweep leaves " +
         "BOTH panels live after every swipe");
  }
  /* The swipe adopts the path the way a tab tap does — one behavior, two
     doors. */
  if(!/t === "watch" && S\.path/.test(sr)){
    fail("swiping into The path skips the mode adoption the tab button " +
         "performs — two doors into one tab must agree, or the tab shows a " +
         "foreign ordering only when you arrive by swipe, which is " +
         "unreproducible from the button");
  }

  /* Background fills never render the belt's transient states, and the
     anchor never resolves to a background copy. */
  var fp = optionalFn("fillPanel", "there is no panel fill to check");
  if(!/S\.beltOpen = S\.beltDrop = S\.beltOpening = S\.beltDropping = false/.test(fp)){
    fail("fillPanel() renders background copies with the belt's transient " +
         "state — the drop is a way of standing in the panel you are " +
         "holding, and a second live copy is the two-copies defect " +
         "negtest250 was written after, now with an anchor: the pouches " +
         "would hang off whichever strip wins the name");
  }
  if(HTML.indexOf(".panel[inert] .pathseg{anchor-name:none;}") < 0){
    fail("a background panel's strip still carries the anchor name — " +
         "anchor resolution takes the LAST acceptable element in tree " +
         "order, so a dropped belt in Next up would hang its pouches off " +
         "The path's strip, one whole viewport to the right");
  }

  /* The programmatic tab change is scrollIntoView, not arithmetic. */
  var st = optionalFn("snapTo", "there is no programmatic snap to check");
  if(!/scrollIntoView/.test(st) || /scrollLeft/.test(st)){
    fail("snapTo() does not go through scrollIntoView — writing scrollLeft " +
         "is a second scroll site for section 120 to pin and a width " +
         "multiplication that drifts the day a panel is not exactly one " +
         "viewport wide; the browser's own alignment cannot drift");
  }
  if(optionalFn("goTab", "the footer door is gone").indexOf("snapTo(t)") < 0){
    fail("goTab() does not snap the viewport — the footer buttons are the " +
         "accessible door to the tabs, and without the snap they change " +
         "state while the deck keeps showing the old panel");
  }
  /* Both async doors into a tab snap too — a hash arrives with the deck at
     whatever panel it was on. Counted, not merely found: there are exactly
     two (boot restore and hashchange), and losing either leaves one door
     rendering a tab into a deck still showing the old one. */
  var snapDoors = (HTML.match(/render\(\);\s*snapTo\(S\.tab\);/g) || []).length;
  if(snapDoors !== 3){
    fail("the doors that change the tab outside goTab (boot restore, " +
         "hashchange, goToGroup's jump) snap the viewport after rendering " +
         "at " + snapDoors + " site(s); this build was reviewed with " +
         "exactly 3 — #progress in a shared link must not render Progress " +
         "into a deck still showing Home, and a jump from Home must not " +
         "scroll a panel the deck never moved to");
  }

  /* Resize re-snap, from the observer that also delivers the width. */
  if(!/ResizeObserver/.test(bd) || !/contentRect\.width/.test(bd) ||
     bd.indexOf("snapTo(S.tab)") < 0){
    fail("buildDeck() has no ResizeObserver delivering the viewport width " +
         "and re-snapping on change — rotation leaves the deck resting " +
         "between panels, and reading the width instead (clientWidth) is " +
         "refused by section 120");
  }

  /* 4.0.4: THE PEEK IS PART OF THE HEADER, FULL STOP. 4.0.3 built #beltpeek
     but showed it only mid-gesture, swapped in by a scroll-driven flag
     (html[data-swiping]) \u2014 and the swap itself flickered: the 2px threshold
     and the rAF hop showed the strips riding for the first frame or two of
     a gesture, and the seam played again at the settle. A scroll listener
     cannot beat the compositor to the first frame any more than 4.0.2's
     counter-translation could chase it, so 4.0.4 stops swapping on gestures
     at all: parked is STATE \u2014 parkFocus() reads data-beltpark/data-park,
     excludes held and dropped, and toggles #beltpeek's data-on \u2014 the peek
     is permanent header chrome whenever the belt is parked, and the strips
     hide whenever they are parked. Unparked strips are content and ride
     their panels, which is what content should do. Nothing swaps
     mid-gesture, so nothing is left to flicker. */
  if(HTML.indexOf('<div id="beltpeek"') < 0 ||
     !/#beltpeek\[data-on\]\{display:block;/.test(HTML)){
    fail("the header peek is gone or never shows \u2014 the parked belt IS the " +
         "header's #beltpeek since 4.0.4; without it the parked strips " +
         "hide with nothing in their place");
  }
  if(/data-swiping/.test(HTML)){
    fail("the gesture flag is back \u2014 4.0.4 deleted the mid-gesture swap " +
         "because a scroll-driven hide cannot beat the compositor to the " +
         "first frame (the 4.0.3 flicker); parked is state, the peek is " +
         "permanent header chrome, and a swap keyed to scrolling re-adds " +
         "the seam it took three releases to remove");
  }
  if(optionalFn("renderHead", "the header renderer is gone")
      .indexOf("beltpeek") < 0){
    fail("renderHead() no longer keeps #beltpeek's lit segment in step " +
         "with S.mode \u2014 the permanent peek would light the segment of " +
         "whatever ordering was chosen when the page loaded");
  }

  note("swipe deck: four panels in footer order, active fills sync + " +
       "dirties three, neighbors idle, inert swept on settle, belt " +
       "suppressed in background copies and parked as the header's own " +
       "permanent peek, snap via scrollIntoView");
})();

/* ---------- 144. The wrangler state stays out of the index ------------- */
/* H-1 stood open through three audits in one day, and the 4.2.4 CHANGELOG
   then said it was closed — true of the release branch, false of the live
   tree, because releases here ship by unzipping files and a zip cannot
   carry a git operation. A sentence claiming a fact the tree does not hold
   is this project's most-repeated bug class, and that one landed in the
   release note of the release meant to close the audit loop. So the fact
   gets a guard. The four sqlite/WAL/SHM objects under .wrangler/state/
   are local Miniflare cache; .gitignore has listed .wrangler/ since they
   leaked in; they are tracked only because they predate the rule. This
   section reads the git index file directly — no git binary, no child
   process — and refuses the claim until the index agrees. Where no .git
   exists (a zip-applied tree, a negative scratch copy) it says so and
   stands down; CI and the release machine always have one. */

(function(){
  var gidx = path.join(ROOT, ".git", "index");
  if(!fs.existsSync(gidx)){
    note("no .git here (zip or scratch tree) — the wrangler-state index check " +
         "runs where one exists");
    return;
  }
  if(fs.readFileSync(gidx).includes(".wrangler/state")){
    fail(".wrangler/state is still in the git index — run `git rm -r --cached " +
         ".wrangler/state` and keep .wrangler/.gitkeep. .gitignore already " +
         "lists .wrangler/; the files predate the rule. The 4.2.4 release " +
         "note claimed this was done; this section exists so that sentence " +
         "cannot be wrong again");
    return;
  }
  note("the git index carries no .wrangler/state objects");
})();

/* ---------- 145. Every top-level function is a declaration the extractor can see - */
/* The parser indexes FunctionDeclaration nodes, which is correct for this
   file today — every extracted function is written `function name(){}`.
   The pin the 4.2.4 re-audit asked for: a future style shift to
   `var foo = function(){}` or `const foo = () => {}` would not break the
   index, it would EMPTY it silently — optionalFn would report a wall of
   "is gone" for functions that are right there, or worse, a section would
   quietly check a stub. The shape is therefore refused at the door: write
   a declaration, or teach fnIndex() the new shape in the same commit. */

(function(){
  fnIndex();
  if(FN_VARSHAPE === null){
    note("parser unavailable on this run — the extract shape is unpinned " +
         "(the fallback warning above already says why)");
    return;
  }
  if(FN_VARSHAPE.length){
    fail("top-level function(s) written as variable assignments: " +
         FN_VARSHAPE.slice(0, 5).join(", ") + " — fnIndex() indexes " +
         "FunctionDeclarations only, so these are invisible to every " +
         "extraction below: a style shift empties the index without one red. " +
         "Write `function name(){}`, or teach fnIndex() the new shape in the " +
         "same commit");
    return;
  }
  note("every top-level function is a declaration; the index cannot be " +
       "emptied by a style shift");
})();

/* ---------- 146. The hero wears the cut --------------------------------- */
/* 4.3.0, the deco release. The owner's pick from the mock round: 45° cut
   corners on the hero — hero-only when it shipped; 4.4.0 extended the cut
   to rank (section 148), and this section keeps holding the hero's own
   construction exactly as 4.3.0 built it — plus the diamond rule, with the
   double hairline and the sunburst both ruled out. The cut is a wrapper-clip: a
   straight clip-path on the old bordered card would eat the border at the
   corners, so the .hero itself is the frame (background var(--line2), the
   same line the old border used at hero rank) clipped to the cut polygon,
   and ::before carries the gradient inset 1px behind the content with the
   same cuts. isolation:isolate is what keeps ::before at z-index:-1 UNDER
   the text but OVER the frame paint — remove it and the hero's stacking
   context is whoever's nearest ancestor, which on some panels puts the
   gradient over its own words. */

(function(){
  var hero = (HTML.match(/\n\.hero\{[^}]*\}/) || [""])[0];
  if(!hero){ fail("the .hero rule is gone"); return; }
  if(/border-radius/.test(hero) || !/clip-path:polygon/.test(hero)){
    fail("the hero corner is rounded again — 4.3.0 cut it at 45° with a " +
         "clip-path polygon, the owner's pick over the hairline, the sunburst " +
         "and the rounded card it replaced");
  }
  if(!/background:var\(--line2\)/.test(hero)){
    fail("the hero frame is not drawn in --line2 — the wrapper IS the frame: " +
         "its background is the hairline the clip reveals, and losing it " +
         "leaves the cut edges naked on --ink");
  }
  if(!/isolation:isolate/.test(hero)){
    fail("the hero ornament paints over its own text — without " +
         "isolation:isolate the ::before's z-index:-1 resolves against some " +
         "ancestor's stacking context instead of the hero's own");
  }
  var before = (HTML.match(/\.hero::before\{[^}]*\}/) || [""])[0];
  if(!/inset:1px/.test(before) || !/linear-gradient\(175deg,var\(--card2\),var\(--card\) 60%\)/.test(before) ||
     !/clip-path:polygon/.test(before) || !/z-index:-1/.test(before)){
    fail("the hero hairline no longer survives the cut — ::before must carry " +
         "the card gradient inset 1px behind the content with its own cut " +
         "polygon, or the frame is either invisible or the whole card");
  }
  /* The diamond is the separator now. The meta line's plain dot was the one
     the mock replaced; the rule under the badges is the one deco ornament
     that shipped. Both render ◆ from the system font by decision —
     section 116 names it in SYSTEM_MARKS. */
  var head = fn("heroHead");
  if(!/class="dsep"[^>]*>\\u25c6</.test(head) || /f\.gn\+' \\u00b7 '/.test(head)){
    fail("the hero meta line is back on the plain dot — 4.3.0 set a gold " +
         "◆ between the continuity number and its name (class dsep, " +
         "aria-hidden: it is an ornament, not a word)");
  }
  if(!/class="drule"/.test(head)){
    fail("the diamond rule left the hero — heroHead() draws it between the " +
         "badges and the blurb: one gold ◆ on a gradient hairline, " +
         "aria-hidden, the one deco ornament the owner kept");
  }
  var closed = HTML.match(/<p class="kick">Case closed<\/p>[\s\S]{0,400}?class="blurb"/);
  if(!closed || !/class="drule"/.test(closed[0])){
    fail("the diamond rule left the hero — the Case closed card lost it; " +
         "the finished state wears the same ornament as the patrol");
  }
})();

/* ---------- 147. The surfaces keep their order --------------------------- */
/* 4.3.0 rebuilt the Darker theme on recipe C — true dark: surfaces drop
   (#04060C / #0A0E18, hairlines up to #20283C) while the dimmed bone stays,
   so contrast climbs instead of everything dimming together. No literal is
   pinned here, deliberately: the next honest retune should not go red for
   moving a hex. What must NEVER reorder is the ladder the components stand
   on — pressed states lighten (--card to --card2), the hero gradient falls
   from --card2 to --card, and sunken panels sit between the page and its
   cards. Section 20 already measures ink-on-surface per theme; this is the
   surfaces measured against each other, per theme, using its palettes. */

(function(){
  themes.forEach(function(t){
    var name = t[0], p = t[1];
    var ladder = ["ink", "sunk", "card", "card2"];
    for(var i = 1; i < ladder.length; i++){
      var lo = p[ladder[i - 1]], hi = p[ladder[i]];
      if(!lo || !hi){ fail(name + ": surface token --" + ladder[i - 1] + " or --" + ladder[i] + " is missing"); return; }
      if(lum(hi) <= lum(lo)){
        fail(name + ": surface luminance runs out of order — --" + ladder[i] +
             " (" + hi + ") is not lighter than --" + ladder[i - 1] + " (" + lo +
             "); pressed states lighten and the hero gradient falls from " +
             "card2 to card, so ink < sunk < card < card2 or both stop " +
             "meaning anything");
      }
    }
  });
})();

/* ---------- 148. The cut is rank, and everyone else stands square --------- */
/* 4.4.0, the deco pass. The owner's direction, locked over three mock rounds:
   the 45° cut stopped being the hero's private ornament and became RANK —
   "where you stand tonight" is the only thing that earns it. The hero keeps
   its 16px cut (section 146, untouched); the CTA that begins the night wears
   8px; the lead chooser card and the group holding upNext()'s film wear 12px.
   Everything else — chips, pills, cards, bars, the belt — stands square, and
   the progress fills went from solid washes to one ribbing formula.

   Three constructions, each chosen by what the element is, not by habit:
   the CTA and the lead are SOLID fills, so a straight clip-path is the whole
   cut (no frame to lose — the wrapper-clip §146 documents exists because the
   hero has a 1px frame to keep). The here-group is a bordered card with a
   sticky header and content-visibility, where a clip-path would clip the
   stuck header and fight paint containment — so its cut is two corner
   overlays painting the page ink back over the corner, with the 1px --line
   diagonal drawn in the same gradient. Fake by construction, honest by
   assertion: this section pins all three shapes.

   The tick arithmetic, so nobody has to re-derive it: the halo is inset
   -14px around the 30px box (58px), the whole button scales .78 → a 45.2px
   rotated square, whose width across the centre is 45.2px ≥ 44. The .arow
   tick stays under the path tick (section 76 holds the relation). */

(function(){
  var css = HTML.slice(HTML.indexOf("<style>"), HTML.indexOf("</style>"));

  /* -- the square family: every corner in the sheet is 0, inherit, or the
     one named exception. A radius that comes back anywhere is the deco pass
     un-shipping one property at a time, which is exactly how the gapped
     belt look tried to return in 2.0.x. -- */
  var re = /([^{}]+)\{([^{}]*)\}/g, m;
  while((m = re.exec(css))){
    var sel = m[1].trim().replace(/\s+/g, " ");
    var body = m[2], rm, rre = /border-radius:([^;}]*)/g;
    while((rm = rre.exec(body))){
      var v = rm[1].trim();
      if(v === "0" || v === "inherit") continue;
      if(sel === ":focus-visible" && v === "4px") continue; /* feedback chrome,
         not a control: the focus ring hugs whatever it lands on, and a 0px
         ring on a square family reads as a second border rather than focus */
      fail("`" + sel + "` declares border-radius:" + v + " — the 4.4.0 deco " +
           "pass squared the family (0 or inherit everywhere; :focus-visible " +
           "alone keeps 4px, named here with its reason). A corner creeping " +
           "back is the pass un-shipping one property at a time");
    }
  }

  /* -- the CTA wears the cut: solid fill, straight clip, no radius -- */
  var go = (css.match(/\.heroacts \.go\{[^}]*\}/) || [""])[0];
  if(!/clip-path:polygon\(8px 0,100% 0,100% calc\(100% - 8px\),calc\(100% - 8px\) 100%,0 100%,0 8px\)/.test(go)){
    fail("the CTA lost the cut — .heroacts .go carries the 8px two-corner " +
         "polygon (the hero's construction at button rank, solid fill so the " +
         "clip alone is the whole cut), and the one button that begins the " +
         "night is the only button that earns it");
  }
  if(!/\.heroacts button\{[^}]*border-radius:0/.test(css)){
    fail("the hero action row is rounded again — .heroacts button declares " +
         "the family's border-radius:0, and the CTA's clip only reads as a " +
         "cut against square neighbours");
  }

  /* -- the lead pick wears the cut, top corners only: the deck overlaps its
     bottom edge (margin:-9px), so bottom cuts would be painted over by the
     next card and read as a rendering bug -- */
  var lead = (css.match(/\.pick\.big\.lead\{[^}]*\}/) || [""])[0];
  if(!/clip-path:polygon\(12px 0,calc\(100% - 12px\) 0,100% 12px,100% 100%,0 100%,0 12px\)/.test(lead)){
    fail("the lead pick lost the cut — .pick.big.lead carries the 12px " +
         "top-corner polygon; “start here” is a rank and wears the rank marker, " +
         "top corners only because the deck overlaps its bottom edge");
  }

  /* -- the here-group: the group holding upNext()'s film wears corner
     overlays, and exactly the mechanics that make that true are pinned -- */
  if(!/\.group\.here::before,\.group\.here::after\{content:"";position:absolute;width:13px;height:13px;z-index:3;pointer-events:none;\}/.test(css) ||
     !/\.group\.here::before\{top:0;left:0;background:linear-gradient\(135deg,var\(--ink\)/.test(css) ||
     !/\.group\.here::after\{bottom:0;right:0;background:linear-gradient\(315deg,var\(--ink\)/.test(css)){
    fail("the here-group overlays are gone or reshaped — the cut on the group " +
         "you stand in is two 13px corner gradients (ink over the corner, the " +
         "1px --line diagonal in the same paint), drawn as overlays because a " +
         "clip-path would clip the sticky header and fight content-visibility");
  }
  if(!/var\(--line\) calc\(50% - \.5px\) calc\(50% \+ \.5px\)/.test(css)){
    fail("the here-group's diagonal hairline left the gradient — without the " +
         "--line band the corner is a bare ink triangle and the card just " +
         "looks broken at two corners");
  }
  var gb = fn("groupBlock");
  if(!/g\.films\.some\(function\(f\)\{ return f\.id === nid; \}\)/.test(gb) ||
     !/\(here\?" here":""\)/.test(gb)){
    fail("groupBlock() no longer marks the here-group — the class comes from " +
         "upNext()'s id, passed in once per render, so the cut follows the " +
         "film you are actually up to and lands on exactly one group");
  }
  if(!/var nid = \(upNext\(\) \|\| \{\}\)\.id;/.test(fn("viewWatch"))){
    fail("viewWatch() stopped computing the here id — groupBlock() would " +
         "mark nothing, and the cut-as-rank claim quietly becomes cut-as-never");
  }

  /* -- one ribbing formula, four fills, tracks on --card2. currentColor is
     the whole trick: the formula lives once in the sheet and each fill says
     only its colour, so a fifth copy or a solid wash is a divergence the
     count sees -- */
  var RIB = "repeating-linear-gradient(90deg,currentColor 0 2px,transparent 2px 5px)";
  var ribs = css.split(RIB).length - 1;
  if(ribs !== 4){
    fail("the ribbing formula appears " + ribs + " times — it belongs to " +
         "exactly four fills (.gbar i, .srow .sb i, .ubar i, .tbar i); a " +
         "missing copy is a bar gone back to a solid wash and a fifth is a " +
         "second formula waiting to drift");
  }
  [[".gbar i", "color:var(--signal)"], [".srow .sb i", "color:var(--signal)"],
   [".ubar i", "color:var(--signal)"], [".tbar i", null]].forEach(function(pair){
    var r = (css.match(new RegExp(pair[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{[^}]*\\}")) || [""])[0];
    if(r.indexOf(RIB) < 0 || (pair[1] && r.indexOf(pair[1]) < 0)){
      fail("`" + pair[0] + "` lost the ribbing or its colour token — every " +
           "progress fill is the one formula in the fill's own currentColor");
    }
  });
  [".gbar{", ".srow .sb{", ".ubar{", ".tbar{"].forEach(function(t){
    var i = css.indexOf(t);
    if(i < 0 || css.slice(i, css.indexOf("}", i)).indexOf("background:var(--card2)") < 0){
      fail("`" + t.slice(0, -1) + "` lost its --card2 track — ribbing reads " +
           "against the sunken track or it reads as dirt on the old --line2");
    }
  });
  if((HTML.match(/tbar"><i style="width:'\+pct\([^)]+\)\+'%;color:var\(/g) || []).length !== 2){
    fail("the tier fills stopped carrying colour tokens — the inline style " +
         "says only color:var(--…) and the one CSS formula draws it; an " +
         "inline background is a second implementation of the ribbing");
  }

  /* -- the chevron family: the triangle is retired, the pair points, the
     states still turn -- */
  if(HTML.indexOf("\\u25B6") >= 0 || HTML.indexOf("▶") >= 0){
    fail("the triangle caret is back — 4.4.0 retired \\u25B6 for the chevron " +
         "pair; section 116's system-marks list already dropped it, so a " +
         "returning triangle also renders from nobody's font subset on paper");
  }
  if((HTML.match(/class="caret" aria-hidden="true">\\u203A\\u203A</g) || []).length !== 3){
    fail("the chevron pair left a caret site — group heads, the progress " +
         "fold and the belt buckle all point with \\u203A\\u203A, escaped so " +
         "section 106's literal scan stays quiet by the same decision as ◆");
  }
  if(!/\.allbtn::after\{content:"\\203A\\203A"/.test(css) ||
     !/\.allbtn\.shut::after\{transform:none;\}/.test(css) ||
     !/\.group\.open \.caret\{transform:rotate\(90deg\)/.test(css)){
    fail("the chevron states stopped turning — the pair points right when " +
         "shut and down when open, on the same rotate the triangle used; " +
         "losing the state rules makes every caret lie about its group");
  }

  /* -- every tab closes on the diamond: the four footers (Home's colophon,
     the availability notes, the build lines, the legend that closes The
     Path) share one rule pair — a centre-fading hairline and a ◆ seated on
     ink over it. The owner's call, extending the hero's ornament to footer
     rank; only the first of a stacked pair wears it, or Next up ends on
     two diamonds three lines apart. The double content declaration is the
     alt-text form where engines have it (the ornament stays silent to a
     reader) over a plain fallback where they don't. -- */
  if(!/\.homefoot,\.note\.foot,\.legend\{position:relative;\n  background:linear-gradient\(90deg,transparent,var\(--signalline\) 50%,transparent\) top\/100% 1px no-repeat;\}/.test(css) ||
     !/\.homefoot::before,\.note\.foot::before,\.legend::before\{content:"\\25C6";content:"\\25C6" \/ "";/.test(css)){
    fail("the footer diamond rule is gone or reshaped — all four tab footers " +
         "close on the same ◆-on-fading-hairline construction, declared once " +
         "for the three footer rules; a footer back on the bare --line border " +
         "is the deco pass un-shipping from the bottom up");
  }
  if(/\.homefoot\{[^}]*border-top/.test(css) || /\n\.note\.foot\{[^}]*border-top/.test(css) ||
     /\.legend\{[^}]*border-top/.test(css)){
    fail("a footer grew its plain top border back beside the diamond rule — " +
         "two separators on one footer is how the ornament becomes clutter");
  }
  if(!/\.note\.foot\+\.note\.foot\{[^}]*background:none;\}/.test(css) ||
     !/\.note\.foot\+\.note\.foot::before\{content:none;\}/.test(css)){
    fail("the second stacked footer note wears the diamond too — Next up " +
         "would close on two of them three lines apart, which is ornament " +
         "becoming wallpaper");
  }

  /* -- the stepped underline: the short heavy bar is the you-are-here -- */
  var pu = (css.match(/\.pathtitle::after\{[^}]*\}/) || [""])[0];
  if(!/34px 3px/.test(pu) || !/var\(--signal\)/.test(pu) ||
     !/100% 1px/.test(pu) || !/var\(--line2\)/.test(pu)){
    fail("the tab title lost its stepped underline — a 34×3 signal bar over a " +
         "full-width --line2 hairline, drawn in ::after so the title text " +
         "and its architecture cannot be separated by a refactor");
  }

  /* -- the diamond tick: rotated, counter-rotated, and the halo still
     clears 44px after the scale (58 × .78 = 45.2) -- */
  var tick = (css.match(/\n\.tick\{[^}]*\}/) || [""])[0];
  if(!/transform:rotate\(45deg\) scale\(\.78\)/.test(tick) || !/border-radius:0/.test(tick)){
    fail("the tick is not the diamond — .tick rotates 45° at scale .78 " +
         "(the circle was 4.4.0's one piece of muscle-memory spending, and " +
         "half a diamond is neither shape)");
  }
  if(!/\.tick::after\{[^}]*rotate\(-45deg\)/.test(css)){
    fail("the tick's check rides the rotation — ::after counter-rotates or " +
         "every checkmark in the app lies on its side");
  }
  if(!/\.tick::before\{content:"";position:absolute;top:-14px;left:-14px;right:-14px;bottom:-14px;\}/.test(css)){
    fail("the tick's halo no longer buys the scale back — at -14px the " +
         "58px halo scales to 45.2px, over the 44px floor; shrink it and " +
         "every tick in the app quietly drops under the thumb size");
  }
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
/* 3.7.2, H-2 of the 10 Aug review, second half: A CLEAN BLESS PROVES NOTHING
   ABOUT THE TREE IT LEAVES BEHIND — the pass above checked the string read at
   startup and then wrote files. So a bless run re-runs the whole check pass
   in a child process against what is now on disk, and exits red if the tree
   it wrote is red. `npm run bless && npm test` used to be the undocumented
   requirement; the && is now built in. */
if(BLESS){
  console.log("\n  · bless pass clean — re-checking the tree it wrote\n");
  var reverify = require("child_process").spawnSync(process.execPath, [__filename],
                                                    {stdio: "inherit"});
  process.exit(reverify.status === 0 ? 0 : 1);
}
console.log("\n  ✓ all guards passed" + (warns.length ? " (" + warns.length + " warning(s))" : "") + "\n");
