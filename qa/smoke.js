#!/usr/bin/env node
/* Headless render test. Boots docs/index.html in jsdom and drives what the
   guards cannot reach: rendering, scope switching, hostile import, the path,
   and a second document with storage throwing.
   Requires jsdom (dev-only): npm i -D jsdom      Run: node qa/smoke.js */
"use strict";
var fs = require("fs"), path = require("path");
var ROOT = path.join(__dirname, "..");
var PUBLIC = fs.existsSync(path.join(ROOT, "docs", "index.html"))
  ? path.join(ROOT, "docs") : ROOT;
var jsdom;
try { jsdom = require("jsdom"); }
catch(e){
  /* 3.0.2: THIS EXITED 0 IN CI TOO. The skip is a deliberate affordance for
     someone who cloned without dev dependencies — it should survive. But if
     `npm ci` ever fails to bring jsdom down, `npm test` passed with this suite
     never running, and the README's check count went unasserted with it. A
     silent skip in the file that reports the count is the same family as
     everything 3.0.0 repaired. Local stays soft; CI is told. */
  if(process.env.CI){
    console.log("FAILED — jsdom is not installed and this is CI, so the smoke " +
                "suite did not run. A skipped suite is not a passing suite.");
    process.exit(1);
  }
  console.log("skipped — jsdom not installed (npm i -D jsdom)"); process.exit(0);
}

/* The two strip-replaces that used to sit here removed Google-CDN font links
   (self-hosted since 1.4.2) and the Cloudflare beacon (gone in 3.2.0) — both
   patterns had matched nothing for releases. The page is already offline-
   deterministic; guard 42 fails the build if a third-party fetch returns. */
var html = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");

var fails = [];
/* 2.2.0, optimization report §5.4: a negative fixture that exists to trip one
   check does not need the whole run — 21 seconds to observe one message. A
   scoped run boots the same first document, then runs only the phase named:
     main    — the primary document, its reboots, and the restore-link block
     css     — the dead-rule sweep
     blocked — the throwing-store document
   "origin" was listed here until 3.0.0 and left PHASES in 2.5.1 with the move
   offer it booted a document for. A phase named in the prose and not in the
   array is a fixture waiting to be written against nothing.
   The README check-count self-assert only runs unscoped, because a scoped
   run's count is meaningless by design. npm test never sets this; the full
   run is still the bar, and a fixture naming a phase that does not exist is
   a broken fixture, not a shorter one — the run refuses. */
var ONLY = process.env.SMOKE_ONLY || "";
var PHASES = ["main", "css", "blocked"];
if(ONLY && PHASES.indexOf(ONLY) < 0){
  console.log("unknown SMOKE_ONLY phase \"" + ONLY + "\" — one of: " +
              PHASES.join(", ") + ", or unset for the full run");
  process.exit(1);
}
function wants(p){ return !ONLY || ONLY === p; }
/* The exit code used to be set inside the third jsdom document's load handler.
   If that event never fired \u2014 a parse error, a jsdom change, a hang \u2014 the run
   printed its failures and exited 0, which is the one outcome a test suite must
   never produce. One place decides it now, with a watchdog behind it and a last
   check on the way out. */
var finished = false;
function finish(){
  if(finished) return;
  finished = true;
  clearTimeout(watchdog);
  console.log(fails.length ? "\n" + fails.length + " smoke failure(s)\n" : "\n  ✓ smoke passed\n");
  process.exit(fails.length ? 1 : 0);
}
var watchdog = setTimeout(function(){
  fails.push("the run never finished \u2014 a document load handler did not fire");
  finish();
}, 180000);
process.on("exit", function(code){
  if(!finished && code === 0){
    console.log("\n  smoke did not reach the end of its run\n");
    process.exitCode = 1;
  }
});
var ran = 0;
function check(name, cond, detail){
  ran++;
  if(cond) console.log("  ok   " + name);
  else { console.log("  FAIL " + name + (detail ? "  — " + detail : "")); fails.push(name); }
}

/* The README states how many checks this is. That number drifted twice — 79
   where the real figure was 231, then 242 where it was 262 — because prose
   cannot count. guards.js cannot count it either: many checks run inside loops,
   so the call sites in this file are not the checks that run. Only the run
   knows, so the run is what asserts it. Counted including this one. */
function checkReadmeCount(){
  var p = path.join(__dirname, "..", "README.md");
  if(!fs.existsSync(p)) return;
  var m = fs.readFileSync(p, "utf8").match(/(\d+)\s+checks\b/);
  if(!m) return check("the README states how many checks this suite runs", false,
                      "no count found in README.md");
  check("the README states how many checks this suite runs",
        parseInt(m[1], 10) === ran + 1, "README says " + m[1] + ", this run is " + (ran + 1));
}

/* jsdom has no scrollTo and throws on every call, catching it internally and
   printing a notice. The app scrolls on nearly every interaction, so that was
   97 lines of stderr and 97 thrown exceptions per run. */
var dom = new jsdom.JSDOM(html, {runScripts:"dangerously", url:"https://nightwatcher.life/",
  pretendToBeVisual:true, beforeParse:function(w){ w.scrollTo = function(){}; }});
var win = dom.window;

win.addEventListener("load", function(){
  setTimeout(function(){
    var app = win.document.getElementById("app");
    check("app renders", app && app.textContent.length > 500,
          app ? app.textContent.length + " chars" : "no #app");

    var S = win.S, FILMS = win.FILMS, tierOf = win.tierOf;
    var doc = win.document;

    /* A scoped run keeps the boot sanity check above, skips the main phase,
       and goes straight to the tail — whose own gates run just the phase
       asked for. tailPhases() is declared below runBlocked(); function
       declarations hoist. */
    if(ONLY && ONLY !== "main"){ tailPhases(); return; }

    /* --- first run: Home IS the chooser, and nothing else --- */
    check("no path is set on a fresh device", S.path === "", 'path="' + S.path + '"');
    check("Home shows the three path cards", doc.querySelectorAll(".pick").length === 3,
          doc.querySelectorAll(".pick").length + " cards");
    check("Home shows no hero until a path is chosen", !doc.querySelector("#view .panel:not([inert]) .hero"));
    check("chooser cards all carry a blurb",
          Array.prototype.every.call(doc.querySelectorAll(".pick"), function(b){
            return b.querySelector("span") && b.querySelector("span").textContent.length > 20;
          }));

    /* The only page anyone arrives on, and the only one a crawler ever sees.
       Through 1.5.9 it rendered 803 characters of visible text carrying "Bruce"
       twice and "Batman" not once \u2014 the word every query for this page
       contains. The sentence that says it was already written; it just waited
       for a path to be chosen before it rendered. */
    var view0 = doc.getElementById("view");
    check("the landing page says Batman", view0.textContent.indexOf("Batman") >= 0,
          view0.textContent.slice(0, 60));
    var intro0 = doc.querySelector("#view .panel:not([inert]) .intro"), deck0 = doc.querySelector("#view .panel:not([inert]) .deck");
    check("the landing page carries the intro", !!intro0);
    check("it tells before it asks",
          !!intro0 && !!deck0 && !!(intro0.compareDocumentPosition(deck0) &
                                    win.Node.DOCUMENT_POSITION_FOLLOWING));
    check("the intro paragraph renders once", doc.querySelectorAll("#view .panel:not([inert]) .ibody").length === 1,
          doc.querySelectorAll("#view .panel:not([inert]) .ibody").length + " copies");

    /* --- 1.8.6: the crawlable seed boots away, and stands in before boot --- */
    /* The seed is the initial content of #view; the first render must replace
       it. Its marker phrase exists nowhere in the app's own views. */
    check("the seed catalogue is gone after boot",
          view0.textContent.indexOf("what follows is what it covers") < 0,
          "the first render left the seed in place");
    (function(){
      /* A second document, scripts off — the reader this block exists for. */
      var inert = new jsdom.JSDOM(html);
      var sv = inert.window.document.getElementById("view");
      var lis = sv ? sv.querySelectorAll("ol li").length : 0;
      /* seed-200 (2.5.0): the continuities section lists every entry, so the
         expectation is eras + the whole catalogue + the curated list. */
      var expect = win.ERAS.filter(function(x){ return x.k !== 0; }).length +
                   FILMS.length +
                   FILMS.filter(function(f){ return tierOf(f) !== "o"; }).length;
      check("the titles render before boot", lis === expect,
            lis + " list items with scripts off, expected " + expect);
      var hrefs = sv ? Array.prototype.map.call(sv.querySelectorAll("a"), function(a){
        return a.getAttribute("href"); }) : [];
      check("the seed links carry the five route tokens",
            hrefs.length === 5 &&
            ["#universes", "#life", "#release", "#progress", "#next"].every(function(t){
              return hrefs.indexOf(t) >= 0; }),
            hrefs.join(" ") || "no links");
    })();

    /* --- choosing one: through the real click handler, not by assignment --- */
    doc.querySelector('.pick[data-path="life"]').click();
    check("choosing sets both path and mode", S.path === "life" && S.mode === "life",
          "path=" + S.path + " mode=" + S.mode);
    check("Home swaps the chooser for the segmented control",
          !doc.querySelector(".pick") && !!doc.querySelector(".pathseg"));
    check("the segmented control marks the chosen path",
          /Bruce/.test(doc.querySelector('.pathseg button[aria-pressed="true"]').textContent),
          doc.querySelector('.pathseg button[aria-pressed="true"]').textContent);
    check("the header sub-line carries the path name",
          /Bruce/.test(doc.getElementById("hsub").textContent),
          doc.getElementById("hsub").textContent);
    win.flushPersist();
    check("the choice was written to storage",
          /"path":"life"/.test(win.localStorage.getItem("batwatch-v3") || ""));

    /* --- The Path stops asking --- */
    S.tab = "watch"; win.render();
    check("The Path has no mode switcher", doc.querySelectorAll("#view .panel:not([inert]) [data-mode]").length === 0,
          doc.querySelectorAll("#view .panel:not([inert]) [data-mode]").length + " switcher buttons");
    check("The Path titles the chosen ordering",
          !!doc.querySelector(".pathtitle") && /Bruce/.test(doc.querySelector(".pathtitle").textContent));
    check("no adopt banner while mode agrees with path", !doc.querySelector(".viewing"));

    /* --- a shared link is a VIEW, not a takeover --- */
    S.mode = "release"; win.render();
    check("a foreign ordering offers to be adopted", !!doc.querySelector(".viewing"));
    check("viewing does not change the stored path", S.path === "life");
    win.flushPersist();
    check("stored payload still says life after viewing",
          /"path":"life"/.test(win.localStorage.getItem("batwatch-v3") || ""));
    doc.querySelector('.viewing button[data-path="release"]').click();
    check("adopting the view sets the path", S.path === "release" && S.mode === "release");
    S.tab = "watch"; S.path = S.mode = "life"; win.persist(); win.flushPersist(); win.render();

    /* --- ticking before choosing must not invent a path (1.2.2) --- */
    /* Ticking before choosing used to write a real ordering, which the next load
       adopted as a path nobody picked. */
    (function(){
      var keep = {path:S.path, mode:S.mode, watched:S.watched};
      S.path = ""; S.mode = "continuity"; S.watched = {};
      S.watched[FILMS[0].id] = 1; win.persist(); win.flushPersist();
      var raw = win.localStorage.getItem("batwatch-v3") || "";
      check("persisting with no path chosen writes no ordering",
            /"path":"","mode":""/.test(raw),
            (raw.match(/"path":"[^"]*","mode":"[^"]*"/) || [""])[0]);
      S.path = keep.path; S.mode = keep.mode; S.watched = keep.watched; win.persist(); win.flushPersist();
    })();

    /* --- a tick burst writes once, and only when flushed (2.5.0, §3.7) --- */
    /* persist() became a trailing debounce; the contract smoke owns is the
       behavior: N calls, zero synchronous writes, one write at the flush,
       and a flush with nothing pending stays silent. The suite's own
       persist-then-read sites all flush through the same door the app's
       pagehide handler uses, so this is not a test-only path. */
    (function(){
      var writes = 0, realSet = win.store.set;
      win.store.set = function(k, v){ writes++; return realSet(k, v); };
      win.persist(); win.persist(); win.persist();
      check("a tick burst does not write synchronously", writes === 0,
            writes + " writes before any flush");
      win.flushPersist();
      check("the flush writes exactly once", writes === 1, writes + " writes");
      win.flushPersist();
      check("a flush with nothing pending writes nothing", writes === 1,
            writes + " writes after a second flush");
      win.store.set = realSet;
    })();

    /* --- the tick path is byte-identical to a full render (2.5.0, §3.8) --- */
    /* toggleWatched/toggleSkip repaint one group through groupBlock() — the
       same builder the full render uses — plus the header through
       renderHead(). The gate is not a review, it is arithmetic: after every
       targeted tick, a forced full render must serialize to the SAME bytes.
       Any divergence — a count missed, a class dropped, an aria left stale —
       fails here by construction. States outside the targeted condition
       (filters, search, other tabs) take the full-render door and are
       trivially identical; one is driven below to prove the fallback fires. */
    /* 3.0.0 WIDENED THE GATE AND ADDED THREE MORE PATHS TO IT. The gate read
       #view only, so a surgical path that left the header, the theme attribute
       or the theme-colour meta stale would have passed it — and 3.0.0 adds a
       theme toggle that touches nothing else. What is compared now is the
       header markup, the view, <html data-theme> and the theme-colour content,
       joined; the three new paths (opening a row, closing a group, rating) are
       driven exactly like the tick and held to the same arithmetic. */
    function shot(){
      return doc.getElementById("view").innerHTML + " " +
             (doc.querySelector("header") ? doc.querySelector("header").innerHTML : "NO HEADER") + " " +
             doc.documentElement.getAttribute("data-theme") + " " +
             (doc.querySelector('meta[name="theme-color"]') || {getAttribute:function(){ return "none"; }})
               .getAttribute("content");
    }
    (function(){
      var v = doc.getElementById("view");
      var mismatches = [], drove = 0;
      ["continuity", "life", "release"].forEach(function(pt){
        S.path = S.mode = pt;
        [["all", "all"], ["anim", "movies"]].forEach(function(fs){
          S.format = fs[0]; S.scope = fs[1];
          S.tab = "watch"; S.filter = "all"; S.q = "";
          win.setAllGroups(true); win.render();
          var ids = Array.prototype.slice.call(v.querySelectorAll('.tick[data-id]'), 0, 3)
                    .map(function(b){ return b.dataset.id; });
          ids.forEach(function(id){
            [0, 1].forEach(function(){
              var btn = v.querySelector('.tick[data-id="' + id + '"]');
              if(btn) btn.click();
              var after = shot();
              win.render();
              if(shot() !== after) mismatches.push(pt + "/" + fs[0] + "/" + id);
              drove++;
            });
          });
          /* Opening and closing a row (3.0.0's rowUpdate). */
          ids.forEach(function(id){
            [0, 1].forEach(function(){
              var fm = v.querySelector('.fmain[data-act="expand"][data-id="' + id + '"]');
              if(fm) fm.click();
              var afterR = shot();
              win.render();
              if(shot() !== afterR) mismatches.push("expand:" + pt + "/" + fs[0] + "/" + id);
              drove++;
            });
          });
          /* Closing and re-opening a group (3.0.0's groupUpdate). Both the
             group and the Collapse all / Expand all button that reads it. */
          (function(){
            /* Driven from all-closed, so the one group opening and closing
               again flips Collapse all / Expand all in both directions — the
               only part of the view outside the group that a group toggle can
               move, and invisible from an all-open start. */
            win.setAllGroups(false); win.render();
            var gh = v.querySelector('.ghead[data-act="group"]');
            if(!gh){ win.setAllGroups(true); win.render(); return; }
            var gk = gh.dataset.gk;
            [0, 1].forEach(function(){
              var h = v.querySelector('.ghead[data-act="group"][data-gk="' +
                                      gk.replace(/"/g, '\\"') + '"]');
              if(h) h.click();
              var afterG = shot();
              win.render();
              if(shot() !== afterG) mismatches.push("group:" + pt + "/" + fs[0] + "/" + gk);
              drove++;
            });
            win.setAllGroups(true); win.render();
          })();
          /* Rating, which can also mark an entry watched (3.0.0 put it on the
             tick fast path it had been driving straight past). */
          ids.forEach(function(id){
            S.open[id] = true; win.render();
            [0, 1].forEach(function(){
              var st = v.querySelector('.stars button[data-act="rate"][data-id="' + id + '"][data-n="4"]');
              if(st) st.click();
              var afterS = shot();
              win.render();
              if(shot() !== afterS) mismatches.push("rate:" + pt + "/" + fs[0] + "/" + id);
              drove++;
            });
            delete S.open[id];
          });
          /* The theme toggle, which touches only the two document-level
             attributes and the pressed state of its own two buttons. */
          (function(){
            var t0 = S.tab; S.tab = "home"; win.render();
            ["darker", "dark"].forEach(function(th){
              var tb = v.querySelector('button[data-theme="' + th + '"]');
              if(tb) tb.click();
              var afterT = shot();
              win.render();
              if(shot() !== afterT) mismatches.push("theme:" + th);
              drove++;
            });
            S.tab = t0; win.render();
          })();
          var first = v.querySelector('.tick[data-id]');
          if(first){
            var id2 = first.dataset.id;
            S.open[id2] = true; win.render();
            var sk = v.querySelector('.act[data-act="skip"][data-id="' + id2 + '"]');
            [0, 1].forEach(function(){
              if(sk) sk.click();
              var after2 = shot();
              win.render();
              if(shot() !== after2) mismatches.push("skip:" + pt + "/" + id2);
              drove++;
              sk = v.querySelector('.act[data-act="skip"][data-id="' + id2 + '"]');
            });
            delete S.open[id2];
          }
        });
      });
      check("the surgical paths are byte-identical to a full render (" + drove + " driven)",
            mismatches.length === 0 && drove >= 120, mismatches.slice(0, 3).join("  |  ") ||
            (drove + " driven"));
      S.filter = "left"; win.render();
      var t2 = v.querySelector('.tick[data-id]');
      if(t2) t2.click();
      check("a filtered view ticks through the full render (the fallback)",
            !!v.querySelector(".group") || !!v.querySelector(".empty"),
            "the filtered view rendered nothing at all");
      S.filter = "all"; S.watched = {}; S.skipped = {}; S.log = []; S.open = {};
      S.path = S.mode = "continuity"; S.format = "all"; S.scope = "all";
      win.render(); win.flushPersist();
    })();

    /* --- a Home card stays inside your path (1.7.7) --- */
    /* Until 1.7.7 Home always drew the universes, so tapping one of its cards
       entered a view of another ordering and raised the borrowed-view banner —
       and the test below asserted that, because it was the behaviour. It was
       never behaviour anybody asked for. */
    S.path = S.mode = "life"; S.tab = "home"; win.persist(); win.flushPersist(); win.render();
    check("Home names the grid for the path it is on",
          /The eras/.test(doc.querySelector("#view").textContent),
          (doc.querySelector("#view .panel:not([inert]) .qhead") || {textContent:"-"}).textContent);
    doc.querySelector('#view .panel:not([inert]) [data-act="jump"]').click();
    check("a Home card stays in your own ordering",
          S.mode === "life" && S.path === "life", "mode=" + S.mode);
    check("and raises no borrowed-view banner", !doc.querySelector(".viewing"));
    check("it opens the group it was tapped for",
          Object.keys(S.groupOpen).filter(function(k){ return S.groupOpen[k]; }).length === 1);

    /* Release order emits decade keys, which had no branch in goToGroup() at
       all — they fell through to By universe, and only never fired because
       Home could not emit one. */
    S.path = S.mode = "release"; S.tab = "home"; win.persist(); win.flushPersist(); win.render();
    check("Home names the grid in release order",
          /The decades/.test(doc.querySelector("#view").textContent));
    doc.querySelector('#view .panel:not([inert]) [data-act="jump"]').click();
    check("a decade card stays in release order", S.mode === "release", "mode=" + S.mode);

    /* --- and a borrowed view is still reversible without a reload (1.2.1) --- */
    /* The banner has to keep working where it belongs: a shared link, or the
       Progress tab jumping into an ordering that is not yours. */
    S.path = S.mode = "life"; S.tab = "stats"; win.persist(); win.flushPersist(); win.render();
    /* 1.9.5: the two lists fold, closed by default. The jump rows exist only
       behind an opened fold, so open it the way a reader would. */
    check("the Progress lists are closed for a fresh eye",
          !doc.querySelector('#view .panel:not([inert]) [data-act="jump"][data-gk^="c"]'));
    var uniFold = doc.querySelector('.sfhead[data-pk="uni"]');
    check("the By-universe fold is there to open", !!uniFold);
    if(uniFold){ uniFold.click(); }
    check("opening the fold renders the rows and remembers it",
          !!doc.querySelector('#view .panel:not([inert]) [data-act="jump"][data-gk^="c"]') &&
          S.progOpen.uni === true);
    var eraJump = doc.querySelector('#view .panel:not([inert]) [data-act="jump"][data-gk^="c"]');
    if(!eraJump){ check("Progress offers a jump into another ordering", false, "none found"); }
    else {
      eraJump.click();
      check("a Progress jump into another ordering borrows the view",
            S.mode === "continuity" && S.path === "life", "mode=" + S.mode);
      check("the banner offers a way back", !!doc.querySelector('.viewing [data-act="mypath"]'));
      check("the way back names your path",
            /Bruce/.test((doc.querySelector('[data-act="mypath"]') || {textContent:""}).textContent));
      doc.querySelector('.viewing [data-act="mypath"]').click();
      check("it returns to your path with no reload", S.mode === "life", "mode=" + S.mode);
      check("and the banner clears", !doc.querySelector(".viewing"));
    }
    S.path = S.mode = "life"; S.tab = "watch"; win.persist(); win.flushPersist(); win.render();

    /* --- switching never costs progress --- */
    var beforeSwitch = Object.keys(S.watched).length;
    S.watched[FILMS[3].id] = 1; win.persist(); win.flushPersist();
    S.path = S.mode = "release"; win.persist(); win.flushPersist(); win.render();
    check("switching path keeps every tick",
          Object.keys(S.watched).length === beforeSwitch + 1,
          Object.keys(S.watched).length + " watched");
    delete S.watched[FILMS[3].id];
    S.path = S.mode = "life"; win.persist(); win.flushPersist(); win.render();

    /* --- darker --- */
    var bar = function(){ return doc.querySelector('meta[name="theme-color"]').getAttribute("content"); };
    check("default theme is dark", S.theme === "dark" &&
          doc.documentElement.getAttribute("data-theme") === "dark", bar());
    S.tab = "home"; win.render();
    check("the theme selector lives on Home now", !!doc.querySelector('#view .panel:not([inert]) .themerow'));
    doc.querySelector('#view .panel:not([inert]) [data-theme="darker"]').click();
    check("darker sets the document attribute",
          doc.documentElement.getAttribute("data-theme") === "darker");
    check("darker repaints the status bar", bar() === "#000000", bar());
    win.flushPersist();
    check("darker is persisted", /"theme":"darker"/.test(win.localStorage.getItem("batwatch-v3") || ""));
    doc.querySelector('#view .panel:not([inert]) [data-theme="dark"]').click();
    check("switching back restores the bar", bar() === "#0C111C", bar());
    S.tab = "stats"; win.render();
    check("Progress no longer carries the theme selector",
          !doc.querySelector('#view .panel:not([inert]) [data-theme]'));
    S.tab = "home"; win.render();

    /* --- tier partition closes in BOTH scopes (the 9-season gap) --- */
    ["movies", "all"].forEach(function(scope){
      S.scope = scope;
      var p = FILMS.filter(win.visible);
      var core = p.filter(function(f){ return tierOf(f) !== "o"; }).length;
      var opt  = p.filter(function(f){ return tierOf(f) === "o"; }).length;
      check("tier partition closes (scope=" + scope + ")", core + opt === p.length,
            "core " + core + " + opt " + opt + " vs " + p.length);
    });

    /* B:TAS S1 must be reachable from the Core route, not orphaned */
    S.scope = "all";
    var btas = FILMS.filter(function(f){ return f.id === "batman-the-animated-series-season-1-1992"; })[0];
    check("B:TAS S1 is on the Core route", btas && tierOf(btas) !== "o", btas ? "tier " + tierOf(btas) : "not found");

    /* The eras and the decades are numbered by position, and an empty bucket is
       dropped before rendering \u2014 so the numbers have to be assigned after the
       drop, not before. 1.7.0 added a fifties decade with nothing in it (the
       serials stopped in 1949 and television did not arrive until 1966) and the
       release view read 1, 3, 4, 5. */
    ["life", "release"].forEach(function(m){
      S.mode = m; S.tab = "watch"; S.format = "all"; S.scope = "all"; win.render();
      var tags = Array.prototype.map.call(doc.querySelectorAll("#view .panel:not([inert]) .gnum"), function(e){
        return e.textContent.trim();
      }).filter(function(t){ return t !== "\u2014"; });
      var gaps = tags.filter(function(t, i){ return t !== String(i + 1); });
      check("the " + m + " view numbers its groups 1..n with no gaps",
            !gaps.length, tags.join(","));
    });
    S.mode = "life";

    /* The life path is a timeline: an era renders in life order, and continuities
       blend. Year One, Batman Begins and Gotham Knight are three continuities and
       three consecutive rows. If the sort loses its lo: term this falls back to
       the order the file happens to be typed in, which is what 1.7.1 fixed. */
    S.mode = "life"; S.tab = "watch"; S.format = "all"; S.scope = "all";
    S.watched = {}; S.log = []; win.render();
    (function(){
      var rows = Array.prototype.map.call(doc.querySelectorAll("#view .panel:not([inert]) .grow, #view .qitem, #view [data-id]"),
                                          function(e){ return e.dataset.id; }).filter(Boolean);
      var seen = [], want = ["batman-year-one-2011", "batman-begins-2005", "batman-gotham-knight-2008"];
      want.forEach(function(id){ seen.push(rows.indexOf(id)); });
      check("an era renders in life order, blending continuities",
            seen[0] >= 0 && seen[0] < seen[1] && seen[1] < seen[2],
            want.map(function(w, i){ return w + "@" + seen[i]; }).join(" "));
      /* Pennyworth is released five years after Gotham and set decades before it,
         so this is the pair that proves the order is not a year sort. */
      check("Pennyworth precedes Gotham",
            rows.indexOf("pennyworth-complete-series-2019") >= 0 &&
            rows.indexOf("pennyworth-complete-series-2019") < rows.indexOf("gotham-complete-series-2014"),
            rows.indexOf("pennyworth-complete-series-2019") + " vs " +
            rows.indexOf("gotham-complete-series-2014"));
    })();
    S.mode = "life";

    /* --- release note tracks format and scope (1.5.0) --- */
    S.mode = "release"; S.format = "anim";
    S.scope = "movies"; var mNote = win.modeNote();
    S.scope = "all";    var aNote = win.modeNote();
    check("animated films start at 1993", /1993 to 2028/.test(mNote), mNote.slice(0, 46));
    check("animated series reach back to 1968", /1968 to 2028/.test(aNote), aNote.slice(0, 46));
    S.format = "live"; S.scope = "movies";
    /* 1943, not 1966, since 1.7.0 added the two Columbia serials \u2014 which are
       the earliest thing in the catalogue in any format. */
    check("live action reaches back to the serials", /1943 to /.test(win.modeNote()), win.modeNote().slice(0, 46));
    S.format = "all";
    check("all formats span the whole catalogue", /1943 to 2028/.test(win.modeNote()), win.modeNote().slice(0, 46));
    S.format = "anim";

    /* --- hostile import must not blank the app --- */
    var poison = JSON.stringify({app:"night-watcher", v:1, watched:{}, skipped:{},
      rated:{"batman-year-one-2011":2.5, "batman-mask-of-the-phantasm-1993":-3,
             "batman-under-the-red-hood-2010":1e6, "batman-ninja-2018":"5",
             "son-of-batman-2014":null}});
    var threw = null;
    try { win.doRestore(poison); } catch(e){ threw = e; }
    check("malformed ratings do not throw", !threw, threw && threw.message);
    check("app still rendered after bad import",
          win.document.getElementById("app").textContent.length > 500);
    var bad = Object.keys(win.S.rated).filter(function(k){
      var v = win.S.rated[k]; return !(v >= 1 && v <= 5 && v === Math.floor(v));
    });
    check("no out-of-range rating survived import", bad.length === 0, JSON.stringify(bad));
    check("valid ratings still coerced through", win.S.rated["batman-ninja-2018"] === 5,
          "got " + win.S.rated["batman-ninja-2018"]);

    /* --- Activity (1.3.4) --- */
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = [];
    S.tab = "next"; win.render();
    check("no Activity block before anything is watched", !doc.querySelector(".activity"));

    /* --- The deco hero (4.3.0) --- */
    var hc = doc.querySelector("#view .panel:not([inert]) .hero .hcont");
    check("the hero draws the diamond rule",
          !!doc.querySelector("#view .panel:not([inert]) .hero .drule"));
    check("the hero meta line separates with the diamond, not the dot",
          !!(hc && hc.querySelector(".dsep")) && hc.textContent.indexOf("·") < 0,
          hc && hc.textContent);
    check("the hero ornament is hidden from the reader",
          !!(hc && hc.querySelector('.dsep[aria-hidden="true"]')) &&
          !!doc.querySelector('#view .panel:not([inert]) .hero .drule[aria-hidden="true"]'));

    var wasShowing = doc.querySelector("#view .panel:not([inert]) .hero h2").textContent;
    doc.querySelector("#view .panel:not([inert]) .heroacts .go").dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("the hero advances after marking watched",
          doc.querySelector("#view .panel:not([inert]) .hero h2").textContent !== wasShowing);

    var act = doc.querySelector(".activity");
    check("Activity appears once something is logged", !!act);
    check("the heading names it as recent",
          !!act && act.querySelector(".qhead").textContent === "Recent activity",
          act ? act.querySelector(".qhead").textContent : "(none)");
    check("the first row is what was just marked",
          !!act && act.querySelector(".arow .at").textContent === wasShowing,
          act ? act.querySelector(".arow .at").textContent : "(none)");
    check("Activity sits below Then",
          !!act && !!doc.querySelector("#view .panel:not([inert]) .queue") &&
          (doc.querySelector("#view .panel:not([inert]) .queue").compareDocumentPosition(act) & 4) !== 0);
    check("Activity is not the queue list",
          !!act && act.querySelectorAll(".qitem").length === 0);

    /* Baseline is the hero as it stands NOW, not the title marked earlier \u2014
       comparing against that one passes even if the hero advances again. */
    var heroBefore = doc.querySelector("#view .panel:not([inert]) .hero h2").textContent;
    /* One line, everything on it, nothing behind a tap (1.6.3). */
    var arow0 = doc.querySelectorAll(".activity .arow")[0];
    check("an Activity row is a tick, a title and stars",
          arow0.children.length === 3 &&
          arow0.children[1].className === "at" &&
          arow0.children[2].className.indexOf("stars") >= 0,
          Array.prototype.map.call(arow0.children, function(c){ return c.className; }).join("|"));
    check("the stars are on the line, not behind a tap",
          !!arow0.querySelector(".stars button") && !arow0.querySelector("[data-act=\"apeek\"]"));
    check("Activity carries no badges", !arow0.querySelector(".abadge"));
    arow0.querySelectorAll(".stars button")[3]
       .dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("rating from Activity records against the right title",
          Object.keys(S.rated).length === 1 && S.rated[Object.keys(S.rated)[0]] === 4,
          JSON.stringify(S.rated));
    check("rating from Activity does not move the hero",
          doc.querySelector("#view .panel:not([inert]) .hero h2").textContent === heroBefore,
          "was " + heroBefore + ", now " + doc.querySelector("#view .panel:not([inert]) .hero h2").textContent);
    check("rating from Activity logs nothing new", S.log.length === 1,
          S.log.length + " entries");
    check("Activity reflects the rating",
          doc.querySelectorAll(".activity .arow")[0]
             .querySelectorAll(".stars button.on").length === 4);

    /* The hero rates in place, and rating marks it watched (1.4.1). */
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.open = {};
    S.tab = "next"; win.render();
    var heroStars = doc.querySelector("#view .panel:not([inert]) .herorate .stars");
    check("the hero carries a star row", !!heroStars);
    var heroTitle = doc.querySelector("#view .panel:not([inert]) .hero h2").textContent;
    heroStars.querySelectorAll("button")[2]
             .dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("rating the hero marks it watched", Object.keys(S.watched).length === 1,
          JSON.stringify(Object.keys(S.watched)));
    check("rating the hero records the rating",
          S.rated[Object.keys(S.watched)[0]] === 3, JSON.stringify(S.rated));
    check("rating the hero advances the queue",
          doc.querySelector("#view .panel:not([inert]) .hero h2").textContent !== heroTitle);
    check("what was rated is now the top of Recent activity",
          doc.querySelector(".activity .arow .at").textContent === heroTitle,
          doc.querySelector(".activity .arow .at").textContent);

    /* ...and the tick on that row takes it back out. */
    var undo = doc.querySelector(".activity .arow .tick");
    check("each activity row carries a tick", !!undo);
    check("the hero puts stars and the watch link in one row",
          !!doc.querySelector("#view .panel:not([inert]) .herorow .herorate") &&
          !!doc.querySelector("#view .panel:not([inert]) .herorow .linkrow"));
    /* One row, three parts, aligned (1.5.8). */
    var arow = doc.querySelector(".activity .arow");
    check("the row is one line: tick, title, stars",
          arow.children.length === 3 &&
          arow.children[1].className === "at" &&
          arow.children[2].className.indexOf("stars") >= 0,
          Array.prototype.map.call(arow.children, function(c){ return c.className; }).join("|"));
    /* No `|| /text-overflow:ellipsis/.test(html)` fallback: three unrelated
       rules carry that declaration, so the fallback matched whatever happened
       and could not fail. The computed style is the real answer, and guards
       section 55 pins the rule itself. */
    check("the title truncates rather than wrapping",
          win.getComputedStyle(arow.querySelector(".at")).textOverflow === "ellipsis",
          win.getComputedStyle(arow.querySelector(".at")).textOverflow);
    /* Then holds only unwatched entries and Activity only watched ones, so the
       two reveals can share S.open without ever colliding on an id. */
    check("no id is in the queue and the history at once",
          Array.prototype.every.call(doc.querySelectorAll("#view .panel:not([inert]) .qitem"), function(q){
            return !S.watched[q.dataset.id];
          }));
    check("the tick says what it does",
          !!undo && /^Remove /.test(undo.getAttribute("aria-label")),
          undo && undo.getAttribute("aria-label"));
    undo.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("the tick removes it from progress", Object.keys(S.watched).length === 0,
          JSON.stringify(Object.keys(S.watched)));
    check("the tick clears the log entry too", S.log.length === 0, S.log.length + " left");
    check("the hero goes back to what it was",
          doc.querySelector("#view .panel:not([inert]) .hero h2").textContent === heroTitle,
          doc.querySelector("#view .panel:not([inert]) .hero h2").textContent);
    check("Recent activity disappears with nothing in it", !doc.querySelector(".activity"));

    /* Clearing a rating must not put progress back (1.4.4). */
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = [];
    S.tab = "next"; win.render();
    var hs = doc.querySelector("#view .panel:not([inert]) .herorate .stars");
    var heroWas = doc.querySelector("#view .panel:not([inert]) .hero h2").textContent;
    hs.querySelectorAll("button")[2].dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    var ratedId = Object.keys(S.rated)[0];
    check("rating from the hero marks it watched", !!S.watched[ratedId]);

    doc.querySelector(".activity .arow .tick")
       .dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("unticking rewinds the hero",
          doc.querySelector("#view .panel:not([inert]) .hero h2").textContent === heroWas);
    check("unticking keeps the rating", S.rated[ratedId] === 3, JSON.stringify(S.rated));

    var stars2 = doc.querySelector("#view .panel:not([inert]) .herorate .stars");
    stars2.querySelectorAll("button")[2].dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("clearing the rating clears it", S.rated[ratedId] === undefined, JSON.stringify(S.rated));
    check("clearing the rating does not re-mark it watched",
          !S.watched[ratedId], JSON.stringify(Object.keys(S.watched)));
    check("clearing the rating does not log it", S.log.length === 0, S.log.length + " entries");
    S.watched = {}; S.rated = {}; S.log = [];

    /* The legend defines Path badges and now lives on The Path (1.4.1). */
    S.watched = {}; S.rated = {}; S.log = [];
    S.tab = "watch"; S.filter = "all"; S.q = ""; win.render();
    var leg = doc.querySelector("#view .panel:not([inert]) .legend");
    check("The Path carries the legend", !!leg);
    check("the legend is the last thing on The Path",
          !!leg && leg === doc.querySelector("#view .panel:not([inert]) .pcol").lastElementChild);
    /* The key is drawn out of the badges themselves. It used to be nine
       coloured words, which stopped matching the moment 1.5.9 made tier filled,
       modifiers outlined and format dashed. */
    var lrow = leg ? leg.children : [];
    check("every legend entry is drawn with a real badge",
          lrow.length > 0 && Array.prototype.every.call(lrow, function(sp){
            return !!sp.querySelector(".bd");
          }), lrow.length + " entries");
    check("no legend swatch is styled text", !!leg && !leg.querySelector("i"));
    check("the legend covers every tier and modifier",
          !!leg && ["e", "k", "o", "u", "c", "s"].every(function(k){
            return !!leg.querySelector(".bd." + k);
          }));
    check("the legend badges read the same labels as the rows",
          !!leg && leg.querySelector(".bd.e").textContent === win.BADGE.e &&
                   leg.querySelector(".bd.o").textContent === win.BADGE.o);
    S.tab = "stats"; win.render();
    check("Progress no longer carries the legend", !doc.querySelector("#view .panel:not([inert]) .legend"));
    S.tab = "next"; S.watched = {}; S.rated = {}; S.log = []; win.render();

    /* ACTIVITYMAX rows, newest first, no matter how long the log gets. The
       number was written out as "five" here until 1.6.6, so cutting it to three
       failed a test that was only ever asserting the page had not changed.
       Read it from the page: guards section 34 is what says what it should be. */
    S.rated = {}; S.log = [];
    var mark8 = win.FILMS.slice(0, 8);
    mark8.forEach(function(f, i){ S.watched[f.id] = 1; S.log.push({id:f.id, ts:1000 + i}); });
    win.render();
    var rows = doc.querySelectorAll(".activity .arow");
    check("Activity shows at most ACTIVITYMAX rows out of a longer log",
          rows.length === win.ACTIVITYMAX && win.ACTIVITYMAX < mark8.length,
          "got " + rows.length + " of " + mark8.length + " logged, ACTIVITYMAX " + win.ACTIVITYMAX);
    check("newest first", rows[0].querySelector(".at").textContent === mark8[7].t,
          rows[0].querySelector(".at").textContent);

    /* History ignores scope: a logged series stays visible under Movies. */
    var tvLogged = win.FILMS.filter(function(f){ return f.tv; })[0];
    S.watched = {}; S.rated = {}; S.log = [{id:tvLogged.id, ts:2000}];
    S.watched[tvLogged.id] = 1;
    S.scope = "movies"; win.render();
    check("Activity ignores the scope toggle",
          !!doc.querySelector(".activity") &&
          doc.querySelector(".activity .arow .at").textContent === tvLogged.t,
          doc.querySelector(".activity") ? doc.querySelector(".activity .arow .at").textContent : "(no block)");

    /* An id from a newer build must be skipped, not thrown on. */
    S.log = [{id:"a-film-that-does-not-exist", ts:3000}, {id:tvLogged.id, ts:2000}];
    var threw2 = null;
    try { win.render(); } catch(e){ threw2 = e; }
    check("an unknown logged id does not throw", !threw2, threw2 && threw2.message);
    check("an unknown logged id is skipped",
          doc.querySelectorAll(".activity .arow").length === 1,
          doc.querySelectorAll(".activity .arow").length + " rows");

    /* Home ends at the universe grid. */
    S.tab = "home"; win.render();
    check("Home has no Activity block", !doc.querySelector("#view .panel:not([inert]) .activity"));
    check("Home has no Recently logged",
          doc.getElementById("view").textContent.indexOf("Recently logged") < 0);

    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = [];
    S.scope = "movies"; S.tab = "home"; win.render();

    /* --- one source for path copy (1.3.9) --- */
    S.path = ""; S.tab = "home"; win.render();
    var cards = doc.querySelectorAll("#view .panel:not([inert]) .pick");
    check("the chooser shows a card per path", cards.length === 3, cards.length + " cards");
    Array.prototype.forEach.call(cards, function(b){
      var id = b.dataset.path, card = b.querySelector("span").textContent;
      check("the " + id + " card opens its own note",
            win.noteFor(id).indexOf(card.replace(/\.$/, "")) === 0, card.slice(0, 60));
    });
    check("the release card carries the computed span, not a fixed year",
          doc.querySelector('.pick[data-path="release"] span').textContent
             .indexOf(win.yearSpan()) > 0,
          doc.querySelector('.pick[data-path="release"] span').textContent);
    /* Under Animated + Movies the films start in 1993. */
    S.format = "anim"; S.scope = "movies"; win.render();
    check("the chooser and The Path agree on the span",
          doc.querySelector('.pick[data-path="release"] span').textContent.indexOf("1993") > 0,
          doc.querySelector('.pick[data-path="release"] span').textContent);
    S.format = "all";
    S.path = "continuity"; S.mode = "continuity";

    /* --- Home order, chooser, format badges (1.5.2) --- */
    S.path = ""; S.tab = "home"; S.watched = {}; S.log = []; win.render();
    var blocks = doc.querySelectorAll("#view .panel:not([inert]) .pick.big");
    check("the chooser is three cards", blocks.length === 3);
    check("they sit in a deck", !!doc.querySelector("#view .panel:not([inert]) .deck"));
    check("the first card leads", blocks[0].classList.contains("lead"));
    check("only one card leads", doc.querySelectorAll("#view .panel:not([inert]) .pick.big.lead").length === 1);
    /* 1.7.2 moved the lead to Bruce's life. By universe is the completist's path
       \u2014 it opens on Alfred in 1960s London, which is correct for the reader who
       chose it and a strange front door for the reader who has not chosen yet. */
    check("the lead is the one life", blocks[0].dataset.path === "life",
          blocks[0].dataset.path);
    check("and it says why", !!doc.querySelector("#view .panel:not([inert]) .lead .leadkick"),
          doc.querySelector("#view .panel:not([inert]) .leadkick") ? doc.querySelector("#view .panel:not([inert]) .leadkick").textContent : "(none)");

    S.path = "continuity"; S.mode = "continuity"; win.render();
    function posOf(sel){ var pc = doc.querySelector("#view .panel:not([inert]) .pcol");
      var n = pc.querySelector(sel); return n ? Array.prototype.indexOf.call(pc.children, n.closest(".pcol > *")) : -1; }
    /* The master chooser opens every tab (1.5.6). */
    ["home", "next", "watch", "stats"].forEach(function(tab){
      S.tab = tab; S.beltOpen = false; win.render();
      /* 3.5.0: the belt travels with its park sentinel — the 1px beltguide the
         IntersectionObserver watches, since a sticky strip cannot report its
         own parking and reading its geometry is the layout read section 120
         refuses. The sentinel is part of the belt, so "opens with the belt"
         now means both of them, in order. */
      var kids = doc.querySelector("#view .panel:not([inert]) .pcol").children;
      check(tab + " opens with the belt",
            !!kids[0] && kids[0].className === "beltguide" &&
            !!kids[1] && kids[1].className.indexOf("pathseg") >= 0,
            (kids[0] ? kids[0].className : "(none)") + " / " +
            (kids[1] ? kids[1].className : "(none)"));
      check(tab + " keeps the pouches closed until asked",
            !doc.querySelector("#view .panel:not([inert]) .includes"));
      /* 3.6.4: once a path is chosen the buckle lives behind the drop; 4.0.4
         moved the closed handle to the header — the peek's own tap drops the
         belt, and the buckle opens the pouches from there. Two clicks, both
         through the real handlers, exactly the reader's route. */
      doc.getElementById("beltpeek").click();
      doc.querySelector('#view .panel:not([inert]) [data-act="belt"]').click();
      check(tab + " opens the pouches from the buckle",
            !!doc.querySelector("#view .panel:not([inert]) .includes") && S.beltOpen === true &&
            S.beltDrop === true);
      check(tab + " has no lone scope switch left",
            !doc.querySelector("#view .panel:not([inert]) > .scope"));
      S.beltOpen = false; S.beltDrop = false;
    });
    S.tab = "watch"; win.render();
    /* Switching paths now goes through the drop: tap the peek — the
       header's own since 4.0.4 — then the segment; a hidden parked strip
       is not a control (F5). */
    doc.getElementById("beltpeek").click();
    doc.querySelector('#view .panel:not([inert]) .pathseg button[data-path="release"]')
       .dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("switching path from another tab works", S.path === "release", S.path);
    S.path = "continuity"; S.mode = "continuity"; S.beltDrop = false;
    S.tab = "home"; win.render();

    doc.getElementById("beltpeek").click();
    doc.querySelector('#view .panel:not([inert]) [data-act="belt"]').click();
    var iSeg = posOf(".pathseg"), iInc = posOf(".includes"), iHero = posOf(".hero");
    check("the controls come first", iSeg === 1 && posOf(".beltguide") === 0,
          "pathseg at " + iSeg + ", beltguide at " + posOf(".beltguide"));
    check("the two control groups are adjacent", iInc === iSeg + 1,
          "pathseg " + iSeg + ", includes " + iInc);
    check("the card comes after what governs it", iHero > iInc,
          "hero " + iHero + ", includes " + iInc);
    check("the chosen path is marked in signal",
          /background:var\(--signal\)/.test(
            (win.document.documentElement.innerHTML.match(
              /\.pathseg button\[aria-pressed="true"\]\{[^}]*\}/) || [""])[0]));
    S.beltOpen = false; S.beltDrop = false;

    /* Format badges only where format is ambiguous. */
    S.format = "all"; S.scope = "all"; S.tab = "watch"; S.filter = "all"; win.render();
    /* The legend is made of real badges now, so it lands in any count of them.
       Rows are what this is about; the legend is counted separately, on
       purpose, because "one per row plus two in the key" is the shape and a
       single number could hide either half going wrong. */
    function fmCount(scope){ return doc.querySelectorAll(scope + " .bd.fmlive, " + scope + " .bd.fmanim").length; }
    var fmLegend = fmCount("#view .panel:not([inert]) .legend");
    check("All labels every row with its format",
          fmCount("#view .panel:not([inert])") - fmLegend === win.pool().length,
          (fmCount("#view .panel:not([inert])") - fmLegend) + " of " + win.pool().length);
    check("the legend explains them", fmLegend === 2, fmLegend + " format swatches in the key");
    S.format = "anim"; win.render();
    check("one format means no badge on any row",
          fmCount("#view .panel:not([inert])") - fmCount("#view .panel:not([inert]) .legend") === 0);
    check("and no legend row for it", fmCount("#view .panel:not([inert]) .legend") === 0);
    S.format = "all"; S.tab = "home"; win.render();

    /* --- format is the second axis (1.5.0) --- */
    S.path = "continuity"; S.mode = "continuity"; S.format = "all"; S.scope = "all";
    S.tab = "home"; S.beltOpen = true; win.render();
    check("Home groups format with scope",
          !!doc.querySelector(".includes .fmt") && !!doc.querySelector(".includes .scope:not(.fmt)"));
    check("the path control sits outside that group",
          !!doc.querySelector(".pathseg") && !doc.querySelector(".includes .pathseg"));

    var poolAll = win.pool().length;
    doc.querySelector('[data-format="live"]').dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("choosing Live action narrows the pool",
          win.pool().length > 0 && win.pool().length < poolAll,
          win.pool().length + " of " + poolAll);
    check("the live-action groups are all that remain",
          win.buildGroups().every(function(g){
            return g.films.every(function(f){ return f.fmt === "live"; }); }));
    /* The master chooser is compact, so the note lives with the intro on Home. */
    S.tab = "home"; S.watched = {}; S.log = []; win.render();
    var stats = doc.querySelector("#view .panel:not([inert]) .istats");
    check("the intro counts what is in view, not the catalogue",
          !stats || stats.textContent.indexOf("58") < 0,
          stats ? stats.textContent.replace(/\s+/g, " ") : "(no intro)");
    S.tab = "watch"; win.render();

    S.scope = "movies"; win.render();
    check("Movies hides the live-action series too",
          win.pool().every(function(f){ return !f.tv; }));
    S.scope = "all"; S.beltOpen = true; win.render();
    doc.querySelector('[data-format="anim"]').dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("Animated hides every live-action entry",
          win.pool().every(function(f){ return f.fmt === "anim"; }));
    doc.querySelector('[data-format="all"]').dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("All restores the whole pool", win.pool().length === poolAll);

    /* Progress is keyed by id, so a tick survives every format switch. */
    var liveFilm = win.FILMS.filter(function(f){ return f.fmt === "live"; })[0];
    S.watched = {}; S.watched[liveFilm.id] = 1; S.log = [{id:liveFilm.id, ts:1}];
    S.format = "anim"; win.render();
    check("progress on a hidden entry is kept, not lost", S.watched[liveFilm.id] === 1);
    S.format = "all"; win.render();
    check("and reappears when the format returns",
          win.pool().filter(win.isDone).length === 1);
    S.watched = {}; S.log = [];

    /* An old save has no format and must land in Animated. */
    S.path = "continuity"; S.mode = "continuity"; win.persist(); win.flushPersist();
    var raw = JSON.parse(win.localStorage.getItem("batwatch-v3"));
    delete raw.format;
    reboot(JSON.stringify(raw), "no-format", function(w5, d5){
      check("a save from before 1.5.0 opens in Animated", w5.S.format === "anim", w5.S.format);
      check("and sees only the animated catalogue",
            w5.pool().every(function(f){ return f.fmt === "anim"; }));
    });
    S.format = "all"; S.scope = "movies";

    /* Then rows reveal one line on request (1.5.9). */
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.open = {};
    S.tab = "next"; win.render();
    var qi = doc.querySelector("#view .panel:not([inert]) .qitem");
    check("a Then row is tappable", qi.tagName === "BUTTON", qi.tagName);
    check("nothing is revealed until asked", !qi.querySelector(".qpeek"));
    qi.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    var qi2 = doc.querySelector("#view .panel:not([inert]) .qitem");
    check("tapping reveals one line", !!qi2.querySelector(".qpeek"));
    check("it shows badges", qi2.querySelectorAll(".qpeek .bd").length > 0);
    check("it names the continuity", !!qi2.querySelector(".qpeek .qg"),
          qi2.querySelector(".qpeek .qg") && qi2.querySelector(".qpeek .qg").textContent);
    (function(){
      var f = win.pool().filter(function(x){ return !win.isDone(x) && !win.isSkip(x); })[1];
      check("it never shows the description",
            f && qi2.textContent.indexOf(f.d.slice(0, 24)) < 0);
    })();
    qi2.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("tapping again closes it", !doc.querySelector("#view .panel:not([inert]) .qitem .qpeek"));
    S.open = {}; S.peek = {};

    /* --- watched and skipped cannot both be true (3.0.0) --- */
    /* Three merge sites maintained the invariant markWatched() has always kept
       and one of them did not — so a skip in one tab and a tick in another came
       back as both, rendered with both classes, and shipped in both segments of
       the backup code. Each site is driven through the real path here rather
       than asserted about: the cross-tab storage event, applyImport(), and a
       pasted JSON backup. */
    (function(){
      var f0 = FILMS[0].id, f1 = FILMS[1].id, f2 = FILMS[2].id;
      function clean(){ S.watched = {}; S.skipped = {}; S.rated = {}; S.log = [];
                        S.clk = {w:{}, s:{}, r:{}}; }

      clean(); S.skipped[f0] = 1;
      /* The event is built by hand rather than through the StorageEvent
         constructor: the handler reads .key and .newValue as properties, and
         jsdom does not let a constructed event's read-only fields be replaced.
         The payload carries a clock since 3.8.0 — earlier smoke interactions
         leave real clocks behind, and a clockless payload deliberately cannot
         override a clocked local state. clean() clears the clocks for the
         same reason it clears the marks. */
      var ev = new win.Event("storage");
      Object.defineProperty(ev, "key", {value: win.KEY});
      Object.defineProperty(ev, "newValue", {value: JSON.stringify(
        {watched:(function(o){ o[f0] = 1; return o; })({}), skipped:{}, rated:{}, log:[],
         clk:{w:(function(o){ o[f0] = Date.now() + 60000; return o; })({}), s:{}, r:{}}})});
      win.dispatchEvent(ev);
      check("a tick arriving from another tab clears this tab's skip",
            !!S.watched[f0] && !S.skipped[f0],
            "watched=" + !!S.watched[f0] + " skipped=" + !!S.skipped[f0]);

      clean(); S.skipped[f1] = 1;
      win.applyImport({watched:(function(o){ o[f1] = 1; return o; })({}),
                       skipped:{}, rated:{}, found:1, unknown:0, path:""});
      check("a restored backup code clears a skip it marks watched",
            !!S.watched[f1] && !S.skipped[f1],
            "watched=" + !!S.watched[f1] + " skipped=" + !!S.skipped[f1]);

      clean(); S.skipped[f2] = 1;
      win.doRestore(JSON.stringify({app:"night-watcher", v:2, path:"",
        watched:(function(o){ o[f2] = 1; return o; })({}), skipped:{}, rated:{}, log:[]}));
      check("a restored JSON backup clears a skip it marks watched",
            !!S.watched[f2] && !S.skipped[f2],
            "watched=" + !!S.watched[f2] + " skipped=" + !!S.skipped[f2]);

      /* The consequence, which is what a reader would actually see: an entry
         counted twice, and exported twice. */
      var both = FILMS.filter(function(f){ return S.watched[f.id] && S.skipped[f.id]; });
      check("no entry is watched and skipped at once", both.length === 0,
            both.map(function(f){ return f.id; }).join(","));
      var c = win.counts();
      check("the scoreboard adds up", c.done + c.left + c.skip === c.total,
            c.done + "+" + c.left + "+" + c.skip + " vs " + c.total);
      clean(); win.render();
    })();

    /* --- the Restore box survives a render nobody asked for (3.0.0) --- */
    (function(){
      var t0 = S.tab; S.tab = "stats"; win.render();
      var box = doc.getElementById("restorebox");
      check("the Restore box exists on Progress", !!box);
      if(box){
        box.value = "NW3WabcdeS";
        win.render();
        var after = doc.getElementById("restorebox");
        check("a render nobody asked for does not wipe the paste",
              !!after && after.value === "NW3WabcdeS",
              after ? JSON.stringify(after.value) : "the box is gone");
        if(after) after.value = "";
      }
      S.tab = t0; win.render();
    })();

    /* --- The Path collapses and remembers (1.3.5) --- */
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.groupOpen = {};
    /* Group keys are namespaced per ordering (c0.., e0.., d1960..), so collapse
       state is deliberately per-ordering. Hold mode still or the tab click
       realigns it to the path and the keys legitimately stop matching. */
    S.path = S.mode = "continuity";
    S.tab = "watch"; S.filter = "all"; S.q = ""; win.render();
    var groupsShown = doc.querySelectorAll("#view .panel:not([inert]) .group").length;
    check("The Path renders groups", groupsShown > 1, groupsShown + " groups");
    check("groups start expanded",
          doc.querySelectorAll("#view .panel:not([inert]) .group.open").length === groupsShown);
    var allBtn = doc.querySelector('[data-act="allgroups"]');
    check("the collapse control is present", !!allBtn);
    check("it offers to collapse while things are open",
          !!allBtn && allBtn.textContent === "Collapse all", allBtn && allBtn.textContent);

    allBtn.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("collapse all closes every group",
          doc.querySelectorAll("#view .panel:not([inert]) .group.open").length === 0,
          doc.querySelectorAll("#view .panel:not([inert]) .group.open").length + " still open");
    check("the control flips to expand",
          doc.querySelector('[data-act="allgroups"]').textContent === "Expand all",
          doc.querySelector('[data-act="allgroups"]').textContent);
    check("a collapsed group reports aria-expanded=false",
          doc.querySelector("#view .panel:not([inert]) .ghead").getAttribute("aria-expanded") === "false");

    /* Persistence: the whole reason the state stopped being session-only. */
    win.flushPersist();
    var savedRaw = win.localStorage.getItem("batwatch-v3") || "";
    check("collapse state reached storage",
          !!savedRaw && JSON.parse(savedRaw).groupOpen &&
          Object.keys(JSON.parse(savedRaw).groupOpen).length > 0,
          savedRaw ? "groupOpen=" + JSON.stringify(JSON.parse(savedRaw).groupOpen).slice(0,40) : "(nothing saved)");

    doc.querySelector('[data-act="allgroups"]').dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("expand all reopens every group",
          doc.querySelectorAll("#view .panel:not([inert]) .group.open").length === groupsShown);

    /* revealHero must not undo a deliberate collapse-all. */
    doc.querySelector('[data-act="allgroups"]').dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    S.tab = "home"; win.render();
    doc.querySelector('#tabs button[data-tab="watch"]')
       .dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("returning to The Path leaves a deliberate collapse-all alone",
          doc.querySelectorAll("#view .panel:not([inert]) .group.open").length === 0,
          doc.querySelectorAll("#view .panel:not([inert]) .group.open").length + " reopened");

    /* ...but it does open the hero's group when something is open. */
    /* Every group shut, then one deleted back out: absent means open. */
    S.groupOpen = {}; win.buildGroups().forEach(function(g){ S.groupOpen[g.key] = false; });
    delete S.groupOpen[win.buildGroups()[1].key];   /* one group left open */
    S.tab = "home"; win.render();
    doc.querySelector('#tabs button[data-tab="watch"]')
       .dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    var heroFilm = win.upNext();
    var heroKey = win.buildGroups().filter(function(g){
      return g.films.some(function(f){ return f.id === heroFilm.id; }); })[0];
    check("the hero's group is open on arrival",
          !!heroKey && S.groupOpen[heroKey.key] !== false,
          heroKey ? heroKey.key + "=" + S.groupOpen[heroKey.key] : "(hero group not found)");

    S.groupOpen = {}; S.tab = "home"; win.render();

    /* --- Progress no longer restates The Path (1.3.5) --- */
    var ratedFilm = win.FILMS.filter(function(f){ return !f.tv; })[0];
    S.rated = {}; S.rated[ratedFilm.id] = 5; S.watched[ratedFilm.id] = 1;
    S.tab = "stats"; win.render();
    check("Progress has no ratings list",
          doc.getElementById("view").textContent.indexOf("Your ratings") < 0);
    check("Progress still shows the chart and backup tools",
          !!doc.querySelector("#view .panel:not([inert]) .pies") && !!doc.querySelector('[data-act="mkcode"]'));
    /* 4.3.1: offsets live in the stylesheet. The last inline margin — on this
       very chart row — made Progress the only tab standing at the right
       first-content offset, and guard 128 now refuses the pattern at the
       source; this drives it in the rendered DOM. */
    check("no rendered element carries an inline margin",
          !doc.querySelector('#view [style*="margin"]'));

    /* --- 3.8.1: one chart, the belt's, and it follows the belt. Two donuts
       drew "The universes" and "Bruce's life" whatever was chosen; now the
       single chart is the chosen ordering's, re-rendered on a belt tap, so a
       mode that is not the chart's is a state that cannot exist. 3.8.2 turned
       the donut into the skyline — share-wide bars that fill bottom-up, and
       the bars are real BUTTONS riding data-act="jump", so the chart gained
       the keyboard route the slices never had. Each mode is driven and the
       bars must all carry that mode's key prefix. --- */
    [["continuity","c"], ["life","e"], ["release","d"]].forEach(function(pair){
      S.mode = pair[0]; win.render();
      var charts = doc.querySelectorAll("#view .panel:not([inert]) .pies .sky");
      var segs = doc.querySelectorAll("#view .panel:not([inert]) .pies .sky button.seg[data-gk]");
      var wrong = [].filter.call(segs, function(g){
        return g.getAttribute("data-gk").charAt(0) !== pair[1]; });
      check("the Progress chart follows the belt to " + pair[0],
            charts.length === 1 && segs.length > 0 && wrong.length === 0,
            charts.length + " chart(s), " + segs.length + " bars, " +
            wrong.length + " from another ordering");
    });
    S.mode = "life"; win.render();
    S.tab = "watch"; S.filter = "all"; win.render();
    check("The Path still carries the rating",
          doc.getElementById("view").textContent.indexOf("\u2605\u2605\u2605\u2605\u2605") >= 0);
    S.watched = {}; S.rated = {}; S.tab = "home"; win.render();

    /* --- the watch link is a Brave search (1.3.2) --- */
    /* 3.0.0: watchUrl() takes the ENTRY. It took the title, and a title cannot
       say which production it means — see the block below, which is the defect
       a reader actually met. */
    var bat89 = win.FILMS.filter(function(f){ return f.t === "Batman" && f.y === 1989; })[0];
    check("the link is a Brave search",
          win.watchUrl(bat89).indexOf("https://search.brave.com/search?q=") === 0,
          win.watchUrl(bat89));
    check("the query leads with \"where to watch\"",
          win.watchUrl(bat89).indexOf("where%20to%20watch%20Batman") > 0);
    check("no country path can appear", !/\/(us|uy|uk|gb|br|de)\//.test(win.watchUrl(bat89)));
    /* A real title carries its year; an unknown one degrades to no year rather
       than to the string "undefined" (1.3.7). */
    var tvShow = win.FILMS.filter(function(f){ return f.tv; })[0];
    check("a real title carries its year",
          decodeURIComponent(win.watchUrl(tvShow)).indexOf(" " + win.titleYear(tvShow)) > 0,
          decodeURIComponent(win.watchUrl(tvShow)));
    check("every season of a show asks the same question",
          win.FILMS.filter(function(f){ return f.t === tvShow.t && f.gi === tvShow.gi; })
                   .every(function(f){ return win.watchUrl(f) === win.watchUrl(tvShow); }));
    /* "Batman" was the title used here until 1.6.6 — and it is in the catalogue
       twice, so titleYear() returned 1966 and the no-year branch this check is
       named after never ran once. Remove the guard from watchUrl() and the old
       version still passed. */
    check("a title the catalogue has never heard of degrades cleanly",
          win.titleYear({t: "Zorro", gi: -1}) === undefined &&
          win.watchUrl({t: "Zorro", gi: -1}).indexOf("undefined") < 0,
          win.watchUrl({t: "Zorro", gi: -1}));

    /* --- THE ONE DEFECT A READER MET (3.0.0) --- */
    /* Six titles are shared by productions in different universes, and the link
       keyed on the title alone and took the earliest year anywhere in the
       catalogue. Tapping Where to watch on the 2022 film asked for a 2004
       cartoon. These are the exact entries, named rather than counted, because
       a count would still pass if the wrong six were fixed. */
    [["The Batman", 2022], ["Batman", 1989], ["Batman", 1966],
     ["Justice League", 2017], ["Birds of Prey", 2020], ["Batman Beyond", 2014]
    ].forEach(function(pair){
      var e = win.FILMS.filter(function(f){ return f.t === pair[0] && f.y === pair[1]; })[0];
      var q = e ? decodeURIComponent(win.watchUrl(e)) : "";
      check(pair[0] + " (" + pair[1] + ") searches for its own year",
            !!e && q.indexOf(pair[0] + " " + pair[1]) > 0, q || "entry not found");
    });
    check("two productions sharing a title do not share a search", (function(){
      var seen = {}, ok = true;
      win.FILMS.forEach(function(f){
        var u = win.watchUrl(f);
        if(seen[u] !== undefined && seen[u] !== f.gi) ok = false;
        seen[u] = f.gi;
      });
      return ok;
    })());
    check("every rendered link comes from the builder", (function(){
      S.tab = "next"; win.render();
      var a = doc.querySelector("#view .panel:not([inert]) .linkrow .lnk");
      return !!a && a.href.indexOf("search.brave.com") > 0;
    })());
    check("the link renders in an expanded row too", (function(){
      S.tab = "watch"; win.render();
      var r = doc.querySelector('#view .panel:not([inert]) [data-act="expand"]');
      if(r) r.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
      var a = doc.querySelector("#view .panel:not([inert]) .fdetail .linkrow .lnk");
      return !!a && a.href.indexOf("search.brave.com") > 0;
    })());
    S.tab = "home"; win.render();

    /* --- shared links route in a running app (1.2.5) --- */
    S.path = S.mode = "life"; S.tab = "home"; win.render();
    win.location.hash = "#release";
    win.dispatchEvent(new win.Event("hashchange"));
    check("a #release link routes while the app is open",
          S.tab === "watch" && S.mode === "release", "tab=" + S.tab + " mode=" + S.mode);
    check("routing a view does not change the stored path", S.path === "life");
    win.location.hash = "#progress";
    win.dispatchEvent(new win.Event("hashchange"));
    check("#progress routes to the stats tab", S.tab === "stats", "tab=" + S.tab);

    /* Every documented token, driven through the running app. Guard 72 proves
       routeHash() understands them; this proves the page still listens. The
       1.7.2 QA deleted the #life branch and nothing here noticed, because only
       two of the eight were ever driven. */
    [["life",      function(){ return S.tab === "watch" && S.mode === "life"; }],
     ["release",   function(){ return S.tab === "watch" && S.mode === "release"; }],
     ["universes", function(){ return S.tab === "watch" && S.mode === "continuity"; }],
     ["path",      function(){ return S.tab === "watch" && S.mode === "continuity"; }],
     ["progress",  function(){ return S.tab === "stats"; }],
     ["next",      function(){ return S.tab === "next"; }],
     ["series",    function(){ return S.scope === "all"; }],
     ["movies",    function(){ return S.scope === "movies"; }]
    ].forEach(function(t){
      S.tab = "home"; S.mode = "continuity"; S.scope = "movies";
      win.location.hash = "#" + t[0];
      win.dispatchEvent(new win.Event("hashchange"));
      check("#" + t[0] + " still routes in a running app", t[1](),
            "tab=" + S.tab + " mode=" + S.mode + " scope=" + S.scope);
    });

    /* A deep link moves the view. It has never been allowed to move the saved
       path, and from 1.7.5 it may not move the saved scope either. */
    S.scope = S.scopePref = "movies"; win.persist(); win.flushPersist();
    win.location.hash = "#universes-series";
    win.dispatchEvent(new win.Event("hashchange"));
    check("a scope token changes the view", S.scope === "all", "scope=" + S.scope);
    check("a scope token leaves the preference alone", S.scopePref === "movies",
          "scopePref=" + S.scopePref);
    win.persist(); win.flushPersist();
    check("and persisting after it stores the preference, not the view",
          JSON.parse(win.localStorage.getItem("batwatch-v3")).scope === "movies");
    S.scope = "movies";

    win.location.hash = ""; S.tab = "home"; S.mode = S.path; win.render();

    /* --- the search-everything offer matches what search-everything shows (1.7.5) --- */
    (function(){
      var f0 = S.format, s0 = S.scope, q0 = S.q, t0 = S.tab;
      S.tab = "watch"; S.format = "live"; S.scope = "movies";
      S.q = "batwheels";               /* an animated series: no live-action match at all */
      win.render();
      var empty = doc.querySelector("#view .panel:not([inert]) .empty");
      check("a search with no live-action match shows the empty state", !!empty);
      var offer = doc.querySelector('#view .panel:not([inert]) [data-act="searchall"]');
      check("and does not offer to find series the format filter would hide", !offer,
            offer ? empty.textContent : "");
      S.format = f0; S.scope = s0; S.q = q0; S.tab = t0; win.render();
    })();

    /* --- the universe chip describes the universe, not the scope (1.8.5) --- */
    (function(){
      var s0 = S.scope, m0 = S.mode, t0 = S.tab;
      function chipFor(name){
        var out = "";
        Array.prototype.forEach.call(doc.querySelectorAll("#view .panel:not([inert]) .ghead"), function(h){
          if(h.querySelector(".gtitle").textContent === name){
            out = h.querySelector(".gnum").textContent;
          }
        });
        return out;
      }
      /* The Batman (2004) is the visible case: its earliest era comes from a TV
         season, so a chip taken off the filtered list would read 3 under Movies
         where it reads 2 with series shown. */
      S.tab = "watch"; S.mode = "continuity"; S.scope = "all"; win.render();
      var withSeries = chipFor("The Batman (2004)");
      S.scope = "movies"; win.render();
      var moviesOnly = chipFor("The Batman (2004)");
      check("a universe chip is found on both scopes", !!withSeries && !!moviesOnly,
            "all=" + withSeries + " movies=" + moviesOnly);
      check("the universe chip does not move when the scope does",
            withSeries === moviesOnly, "all=" + withSeries + " movies=" + moviesOnly);
      S.scope = s0; S.mode = m0; S.tab = t0; win.render();
    })();

    /* --- a marker typed into the search box stays typed (1.8.3) --- */
    (function(){
      var q0 = S.q, t0 = S.tab;
      S.tab = "watch";
      S.q = "%%COUNT%%";
      win.render();
      var box = doc.getElementById("q");
      check("a search for the old count marker leaves the search box intact",
            !!box && box.value === "%%COUNT%%", box ? box.value : "no #q");
      check("and hangs nothing of the app's own markup on it",
            !!box && box.getAttributeNames().every(function(a){
              return ["class","id","type","enterkeyhint","aria-label","placeholder","value"].indexOf(a) >= 0;
            }), box ? box.getAttributeNames().join(",") : "");
      check("and leaves no marker showing in the page",
            doc.getElementById("view").textContent.indexOf("%%COUNT%%") < 0);
      S.q = q0; S.tab = t0; win.render();
    })();

    /* --- the number left Home, and stayed on The Path (1.8.7) --- */
    /* 1.7.5 put one number per universe on both screens. The 1.8.5 soak found
       Home did not need it — the tag crowded the description in a two-line
       clamp — so Home dropped it and The Path kept it, where the ordering is
       load-bearing and the chip is guard 88's subject. Half a decision
       reversed on purpose; this block is the record that it was on purpose. */
    (function(){
      S.tab = "home"; S.mode = "continuity"; win.render();
      var cards = doc.querySelectorAll("#view .panel:not([inert]) .ucard");
      check("home cards carry no number", cards.length > 20 &&
            !doc.querySelector("#view .panel:not([inert]) .ucard .unum"),
            doc.querySelectorAll("#view .panel:not([inert]) .ucard .unum").length + " numbered of " + cards.length);
      var descs = Array.prototype.map.call(doc.querySelectorAll("#view .panel:not([inert]) .ucard .udesc"),
        function(d){ return d.textContent.trim(); });
      check("every home card carries a description",
            descs.length === cards.length && descs.every(function(t){ return t.length > 5; }),
            descs.length + " of " + cards.length);
      check("no card description runs past a line and a half of prose",
            descs.every(function(t){ return t.length <= 90; }),
            (descs.filter(function(t){ return t.length > 90; })[0] || "").slice(0, 40));

      /* --- a skip finishes a card (16 Aug, the owner's report) ---------- */
      /* Skipping is a decision about an entry — an Optional you'll never
         want, a Not-out-yet — so a group whose every entry is watched OR
         skipped has nothing left to offer and must read complete. The bar
         says how: watched fills in signal, skipped in steel (.sk), and the
         count names the skips instead of leaving a full card claiming a
         number it never reaches. */
      S.watched = {}; S.skipped = {}; S.rated = {}; S.log = [];
      var sg = win.buildGroups()[0];
      sg.films.forEach(function(f, i){
        if(i === 0) S.skipped[f.id] = 1; else S.watched[f.id] = 1;
      });
      win.render();
      var skCard = doc.querySelector('#view .panel:not([inert]) .ucard[data-gk="' + sg.key + '"]');
      check("a group of watched + skipped reads complete",
            !!skCard && skCard.className.indexOf("full") >= 0,
            skCard ? skCard.className : "(card not found)");
      check("the skipped share fills the bar in its own colour",
            !!skCard && !!skCard.querySelector(".ubar .sk"));
      check("the count names the skips",
            !!skCard && / · 1 skipped$/.test(skCard.querySelector(".ucount").textContent),
            skCard ? skCard.querySelector(".ucount").textContent : "-");
      /* ...and a group with an entry still waiting does NOT read complete,
         skipped or not — the inverse, so this cannot pass vacuously. */
      var f0 = sg.films[1];
      delete S.watched[f0.id];
      win.render();
      var skCard2 = doc.querySelector('#view .panel:not([inert]) .ucard[data-gk="' + sg.key + '"]');
      check("an unwatched, unskipped entry still holds the card open",
            !!skCard2 && skCard2.className.indexOf("full") < 0,
            skCard2 ? skCard2.className : "(card not found)");

      /* --- Progress speaks the same language (16 Aug, the owner's third
         round): the skyline's columns and the fold rows carry the steel
         skip share, a group of watched+skipped counts complete, and NOTHING
         but a skip wears steel — era 0 ("outside any timeline") used to,
         which made a decision look like a leftover. --- */
      S.watched = {}; S.skipped = {};
      sg.films.forEach(function(f, i){
        if(i === 0) S.skipped[f.id] = 1; else S.watched[f.id] = 1;
      });
      S.tab = "stats"; win.render();
      var seg0 = doc.querySelector('#view .panel:not([inert]) .sky .seg[data-gk="' + sg.key + '"]');
      check("a skyline column carries the steel skip share",
            !!seg0 && !!seg0.querySelector("i.sk"),
            seg0 ? seg0.innerHTML.slice(0, 80) : "(column not found)");
      check("skyline fills carry no inline colour — steel means skipped, nowhere else",
            !/background:var\(--steel\)/.test(
              doc.querySelector("#view .panel:not([inert]) .sky").innerHTML) ||
            !!seg0.querySelector("i.sk"),
            "only .sk may be steel");
      S.mode = "life"; win.render();
      var eraSegs = doc.querySelectorAll('#view .panel:not([inert]) .sky .seg');
      check("the outside-any-timeline column wears no colour of its own",
            eraSegs.length > 0 && ![].some.call(eraSegs, function(sgel){
              return /background:var\(--steel\)/.test(sgel.innerHTML.replace(/class="sk"[^>]*/g, ""));
            }));
      S.progOpen = {era: true}; win.render();
      var eraRows = doc.querySelectorAll('#view .panel:not([inert]) .sfbody .srow');
      check("the era fold rows carry no per-row colour either",
            eraRows.length > 0 && ![].some.call(eraRows, function(r){
              return /background:var\(--steel\)/.test(
                r.querySelector(".sb").innerHTML.replace(/class="sk"[^>]*>/g, ""));
            }), eraRows.length + " rows");
      S.mode = "continuity"; S.progOpen = {uni: true}; win.render();
      var skRow = doc.querySelector('#view .panel:not([inert]) .sfbody .srow[data-gk="' + sg.key + '"]');
      check("a fold row carries the steel skip share",
            !!skRow && !!skRow.querySelector(".sb .sk"));
      check("the fold counts watched+skipped as complete",
            /^[1-9]\d* of \d+ complete/.test(
              doc.querySelector('#view .panel:not([inert]) .sfhead[data-pk="uni"] .sfmeta').textContent.trim()),
            doc.querySelector('#view .panel:not([inert]) .sfhead[data-pk="uni"] .sfmeta').textContent);
      S.progOpen = {};

      /* --- and the drop is scrubbed at the tab door (16 Aug: "belt opened
         hit a tab, it breaks drops"). The departed panel must not keep its
         dropped strip or its position:fixed pouches — fixed paints over
         every tab, and a far panel never gets the idle refill. --- */
      S.tab = "watch"; win.render();
      win.beltDropOpen(); win.openBelt();
      var hadDrop = doc.querySelector('#panel-watch .pathseg[data-drop]') &&
                    doc.querySelector('#panel-watch .includes');
      win.goTab("home");
      check("a tab tap with the drop out scrubs the departed panel",
            !!hadDrop && S.beltDrop === false &&
            !doc.querySelector('#panel-watch .pathseg[data-drop]') &&
            !doc.querySelector('#panel-watch .includes'),
            hadDrop ? "drop stood before the tap" : "the drop never stood");
      /* hand the next block the state it was written against: films[0]
         skipped, nothing watched */
      S.watched = {}; S.skipped = {};
      S.skipped[sg.films[0].id] = 1;
      S.tab = "home"; win.render();

      /* --- and The path's own bar behaves the same (the owner's follow-up).
         Both doors are driven: the full render, and the surgical tick path —
         gSub()/gBarFill() are shared between them (guard 103), and this is
         the run that proves the sharing shows on screen. */
      S.tab = "watch"; S.filter = "all"; S.q = ""; win.render();
      var skHead = doc.querySelector('#view .panel:not([inert]) .ghead[data-gk="' + sg.key + '"]');
      check("the path head names the skips",
            !!skHead && / · 1 skipped$/.test(skHead.querySelector(".meta").textContent),
            skHead ? skHead.querySelector(".meta").textContent : "(head not found)");
      check("the path bar carries the steel share",
            !!skHead && !!skHead.querySelector(".gbar .sk"));
      win.toggleSkip(f0.id); /* the surgical door: tickUpdate, not render */
      check("a surgical skip updates the head's count in place",
            / · 2 skipped$/.test(skHead.querySelector(".meta").textContent),
            skHead.querySelector(".meta").textContent);
      check("a surgical skip widens the steel share in place",
            skHead.querySelectorAll(".gbar .sk").length === 1);
      win.toggleSkip(f0.id);
      check("a surgical un-skip narrows it back",
            / · 1 skipped$/.test(skHead.querySelector(".meta").textContent),
            skHead.querySelector(".meta").textContent);
      S.tab = "home";
      S.watched = {}; S.skipped = {}; win.render();

      S.tab = "watch"; win.render();
      var numbered = 0;
      Array.prototype.forEach.call(doc.querySelectorAll("#view .panel:not([inert]) .ghead .gnum"), function(n){
        if(n.textContent.trim()) numbered++;
      });
      check("the path still numbers every universe", numbered > 20, numbered + " numbered");
      /* 1.7.5's cross-check — home and path derive one number — died when the
         number left home, so the real-not-invented half lands here instead:
         the rendered chip must be eraTag()'s own answer. */
      var dcau = null;
      Array.prototype.forEach.call(doc.querySelectorAll("#view .panel:not([inert]) .ghead"), function(h){
        if(h.querySelector(".gtitle").textContent === "DC Animated Universe"){
          dcau = h.querySelector(".gnum").textContent;
        }
      });
      var dg = win.PATH.filter(function(x){ return x.name === "DC Animated Universe"; })[0];
      check("a path number is the universe's real tag",
            !!dg && dcau === String(win.eraTag(dg)),
            "rendered " + dcau + ", eraTag " + (dg ? win.eraTag(dg) : "?"));
      S.tab = "home"; win.render();
    })();

    /* --- transfer without a QR (1.2.4) --- */
    S.tab = "stats"; win.render();
    doc.querySelector('#view .panel:not([inert]) [data-act="mkcode"]').click();
    check("making a code shows Copy link", !!doc.querySelector('#view .panel:not([inert]) [data-act="copylink"]'));
    check("the link it copies is absolute and carries the code",
          /^https?:\/\/.+#nw=NW3W/.test(win.restoreLink(S.code)), win.restoreLink(S.code).slice(0, 46) + "…");
    check("that link restores when opened",
          !!win.importCode(win.restoreLink(S.code)));
    check("no QR encoder is loaded", typeof win.qrcode === "undefined");
    S.tab = "home"; win.render();

    /* Absoluteness is asserted above, on a real code. What this line adds is
       that a code with nothing in it still produces a usable link rather than a
       bare hash — the state a reader is in before they have ticked anything. */
    check("even an empty code makes a whole link",
          /^https:\/\/[^#]+#nw=NW1WSR$/.test(win.restoreLink("NW1WSR")),
          win.restoreLink("NW1WSR"));

    /* --- detail panels are built on demand, not for all 151 entries --- */
    S.tab = "watch"; S.scope = "all"; S.filter = "all"; S.q = ""; S.open = {};
    win.render();
    var view = win.document.querySelector("#view .panel:not([inert])");
    var closedSize = view.innerHTML.length;
    check("no detail panels rendered while every row is closed",
          view.querySelectorAll(".fdetail").length === 0,
          view.querySelectorAll(".fdetail").length + " found");
    S.open["batman-mask-of-the-phantasm-1993"] = true;
    win.render();
    view = win.document.querySelector("#view .panel:not([inert])");
    check("opening one row renders exactly one detail panel",
          view.querySelectorAll(".fdetail").length === 1,
          view.querySelectorAll(".fdetail").length + " found");
    check("closed view is materially smaller than the old always-on markup",
          closedSize < 150000, closedSize + " chars");
    S.open = {};

    /* --- every filter chipSet() offers is reachable from the Path tab --- */
    /* Counted from chipSet() rather than held as a number: 2.8.0 added the
       Skipped chip and a remembered 6 would have failed a correct build. */
    win.render();
    var chips = win.document.getElementById("view").querySelectorAll(".chip");
    var want = win.chipSet();
    check("every filter chip chipSet() offers is rendered",
          chips.length === want.length, chips.length + " chips for " + want.length + " filters");
    var chipIds = Array.prototype.map.call(chips, function(c){ return c.dataset.filter; });
    check("the rendered chips are exactly the filters chipSet() names",
          want.every(function(p){ return chipIds.indexOf(p[0]) >= 0; }),
          chipIds.join(","));

    /* --- tab state uses valid ARIA --- */
    S.tab = "stats"; win.render();
    var cur = win.document.querySelectorAll("#tabs button[aria-current]");
    check("exactly one tab marked aria-current", cur.length === 1, cur.length + " marked");
    check("aria-current is on the active tab", cur[0] && cur[0].dataset.tab === "stats");
    check("no invalid aria-selected on tab buttons",
          win.document.querySelectorAll("#tabs button[aria-selected]").length === 0);

    /* --- the deck (4.0.0): four panels, one live, the rest inert --- */
    /* jsdom cannot swipe — no layout, no scroll events — so what it CAN see
       is asserted instead: the deck's shape, the inert bookkeeping on the
       tab-change path, and the dirty flags doing their one job (a state
       change reaching a panel that was filled before it). The swipe itself
       belongs to the browser drive. */
    var deckPanels = win.document.querySelectorAll("#view > .panel");
    check("the deck holds exactly four panels", deckPanels.length === 4,
          deckPanels.length + " panels");
    check("the panels sit in footer order",
          Array.prototype.map.call(deckPanels, function(p){ return p.id; }).join(",") ===
          "panel-home,panel-next,panel-watch,panel-stats",
          Array.prototype.map.call(deckPanels, function(p){ return p.id; }).join(","));
    check("every panel wraps its content in a .pcol",
          Array.prototype.every.call(deckPanels, function(p){
            return p.firstChild && p.firstChild.className === "pcol";
          }));
    S.tab = "stats"; win.render();
    check("the active panel is the one live panel",
          !win.document.getElementById("panel-stats").hasAttribute("inert") &&
          ["home", "next", "watch"].every(function(t){
            return win.document.getElementById("panel-" + t).hasAttribute("inert");
          }));
    check("scroller() answers the active panel",
          win.scroller() === win.document.getElementById("panel-stats"));
    win.goTab("next");
    check("goTab moves the live panel with the state",
          S.tab === "next" &&
          !win.document.getElementById("panel-next").hasAttribute("inert") &&
          win.document.getElementById("panel-stats").hasAttribute("inert"));
    /* The dirty flag's one job: a tick from Next up reaches the Progress
       panel that was already filled. Fill stats, tick from next, return —
       the count on the scoreboard must be the new one, not the stale one. */
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; win.render();
    win.goTab("stats");
    var doneBefore = win.document.querySelector("#panel-stats b.sc-done").textContent;
    win.goTab("next");
    var goBtn = win.document.querySelector("#panel-next .heroacts .go");
    goBtn.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    win.goTab("stats");
    var doneAfter = win.document.querySelector("#panel-stats b.sc-done").textContent;
    check("a tick from Next up reaches the already-filled Progress panel",
          doneBefore === "0" && doneAfter === "1",
          doneBefore + " -> " + doneAfter);
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.tab = "stats"; win.render();

    /* --- no <div> or <h2> nested inside a <button> (invalid HTML) --- */
    S.tab = "watch"; win.render();
    var bad = win.document.querySelectorAll("#view .panel:not([inert]) button div, #view button h2");
    check("no flow content nested inside a button", bad.length === 0, bad.length + " found");

    /* --- memoised groups stay correct across a scope flip --- */
    S.scope = "movies"; var movieCount = win.pool().length;
    S.scope = "all";    var allCount   = win.pool().length;
    S.scope = "movies"; var backAgain  = win.pool().length;
    check("group cache survives a scope round-trip",
          movieCount === backAgain && allCount > movieCount,
          movieCount + " / " + allCount + " / " + backAgain);

    /* --- Home and Next up render the SAME title; it must not resize --- */
    S.scope = "movies"; S.q = ""; S.filter = "all";
    S.tab = "home"; win.render();
    var homeH2 = win.document.querySelector("#view .panel:not([inert]) .hero h2");
    S.tab = "next"; win.render();
    var nextH2 = win.document.querySelector("#view .panel:not([inert]) .hero h2");
    check("Home and Next up show the same hero title",
          homeH2 && nextH2 && homeH2.textContent === nextH2.textContent,
          homeH2 && nextH2 ? homeH2.textContent + " vs " + nextH2.textContent : "missing hero");
    check("no hero title carries an inline font-size",
          !/font-size/.test((homeH2 && homeH2.getAttribute("style")) || "") &&
          !/font-size/.test((nextH2 && nextH2.getAttribute("style")) || ""));

    /* same again once the catalogue is complete — the "Case closed" variant */
    var savedWatched = S.watched;
    S.watched = {}; FILMS.forEach(function(f){ S.watched[f.id] = 1; });
    /* Home only. This looped ["home","next"] until 1.6.6, but a completed Next
       up renders .empty .big, not .hero h2 — so half the loop asserted over an
       empty set and read as coverage. The Case-closed card is checked on its
       own terms below. */
    var sized = 0;
    S.tab = "home"; win.render();
    Array.prototype.forEach.call(win.document.querySelectorAll("#view .panel:not([inert]) .hero h2"), function(el){
      if(/font-size/.test(el.getAttribute("style") || "")) sized++;
    });
    check("the completed-catalogue hero on Home is unsized too", sized === 0, sized + " sized");
    check("the Case closed card keeps the diamond rule",
          !!win.document.querySelector("#view .panel:not([inert]) .hero .drule"));
    S.tab = "next"; win.render();
    var closed = win.document.querySelector("#view .panel:not([inert]) .empty .big");
    check("a finished Next up says so in the shared display size",
          !!closed && !/font-size/.test(closed.getAttribute("style") || ""),
          closed ? (closed.getAttribute("style") || "(no inline style)") : "(no .empty .big)");
    S.watched = savedWatched;

    /* --- tabs still switch without throwing --- */
    var e = null;
    try { ["home","watch","next","stats"].forEach(function(t){ win.S.tab = t; win.render(); }); }
    catch(err){ e = err; }
    check("all four tabs render", !e, e && e.message);

    /* --- the parser must read old, current and future codes --- */
    /* Drives the shipped copy, against a code the page itself produced. */
    S.watched = {}; S.rated = {};
    FILMS.slice(0, 9).forEach(function(f, i){ if(i % 2 === 0) S.watched[f.id] = 1; });
    S.rated[FILMS[0].id] = 4;
    var code = win.exportCode();
    var mine = win.importCode(code);
    check("exportCode writes NW3", /^NW3W/.test(code), code.slice(0, 14) + "…");
    check("a rating costs one character, not a second copy of the hash",
          /R\d*O/.test(code), (code.match(/R[^P]*/) || [""])[0].slice(0, 12) + "…");
    check("the code carries the chosen path", /P[clr]$/.test(code), code.slice(-2));
    check("code round-trips in the page", mine && mine.found === Object.keys(S.watched).length,
          mine ? "found " + mine.found : "null");

    /* 3.0.0: the probe appended an unknown segment to an NW3 code and called it
       "a future NW2 code" — a version older than the one it was testing. The
       segment half was real; the version half was not being exercised at all.
       It builds a genuinely later major now, which is the case that matters:
       a code written by a version of this app that does not exist yet. */
    var future = win.importCode(code.replace(/^NW3/, "NW9") + "X7ab");
    check("a future NW9 code with unknown segments still restores",
          future && mine && future.found === mine.found, future ? "found " + future.found : "REJECTED");
    check("unknown segments are ignored, not restored as junk",
          future && mine && future.unknown === mine.unknown, future ? "unknown " + future.unknown : "-");
    check("a pasted restore URL still works",
          !!win.importCode("  " + win.SITE + "#nw=" + code + "  "));
    check("a code split across lines still works",
          !!win.importCode(code.slice(0, 10) + "\n" + code.slice(10)));
    /* 3.0.0: THIS CHECK TESTED NOTHING FOR NINE RELEASES. Two lines above it
       asserts the code starts NW3W, and then it did code.replace(/^NW2/,"NW1"),
       which cannot match — so it imported the same NW3 code and duplicated the
       line below. Deleting NW1 support from the app left it green. (Guard 8
       covers the NW1 format for real, so the format was never unprotected; the
       check was lying, not the app.)

       An NW1 code is BUILT here rather than derived, because the 1.0.0 layout
       put ratings in six-character hash+digit records and importCode() takes
       that branch only below version 3 — a prefix swap on an NW3 body would not
       have exercised it even if the swap had worked. */
    var nw1 = "NW1W" + win.idHash(FILMS[0].id) + win.idHash(FILMS[1].id) +
              "S" + win.idHash(FILMS[3].id) +
              "R" + win.idHash(FILMS[0].id) + "4";
    var old1 = win.importCode(nw1);
    check("an NW1 code from 1.0.0 still restores",
          !!old1 && old1.found === 3 && !old1.cut && old1.rated[FILMS[0].id] === 4,
          old1 ? "found " + old1.found + ", cut " + old1.cut + ", rating " +
                 old1.rated[FILMS[0].id] : "REJECTED");
    check("a code with no path segment still restores",
          !!win.importCode(code.replace(/P[clr]$/, "")));
    var junkOk = ["", "hello", "NW1", "NW1W!!!", "not-a-code"].every(function(j){
      return win.importCode(j) === null;
    });
    check("junk is still rejected", junkOk);

    /* --- the choice has to survive a reload, which is the entire point --- */
    /* A fresh document with storage pre-seeded is a reload. */
    /* Every call site passed a label and reboot() ignored it, so five useful
       names went nowhere and a failure inside a rebooted document did not say
       which reload it came from. It says now. */
    function reboot(seed, label, then){
      var d = new jsdom.JSDOM(html, {runScripts:"dangerously", url:"https://nightwatcher.life/",
        pretendToBeVisual:true, beforeParse:function(w){
          w.scrollTo = function(){};
          w.localStorage.setItem("batwatch-v3", seed);
        }});
      /* restore() is synchronous once the store answers, and the app renders
         before "load" fires. The 200ms was padding, at five reboots a run. */
      d.window.addEventListener("load", function(){
        setTimeout(function(){
          var before = fails.length;
          then(d.window, d.window.document);
          if(fails.length > before){
            console.log("       (above " + (fails.length - before) + " from the \"" +
                        label + "\" reload)");
          }
        }, 0);
      });
    }

    /* Collapse state has to survive a reload too \u2014 that is why 1.3.5 stopped
       treating it as session state. */
    S.path = S.mode = "continuity"; S.groupOpen = {};
    win.buildGroups().forEach(function(g){ S.groupOpen[g.key] = false; });
    win.persist(); win.flushPersist();
    reboot(win.localStorage.getItem("batwatch-v3"), "collapse", function(w3, d3){
      w3.S.tab = "watch"; w3.render();
      check("a reload comes back collapsed",
            d3.querySelectorAll("#view .panel:not([inert]) .group").length > 1 &&
            d3.querySelectorAll("#view .panel:not([inert]) .group.open").length === 0,
            d3.querySelectorAll("#view .panel:not([inert]) .group.open").length + " of " +
            d3.querySelectorAll("#view .panel:not([inert]) .group").length + " open");
    });
    S.groupOpen = {};

    S.path = S.mode = "release"; S.theme = "darker"; win.persist(); win.flushPersist();
    var saved = win.localStorage.getItem("batwatch-v3");

    reboot(saved, "1.2.0", function(w2, d2){
      check("a reload comes back on the chosen path", w2.S.path === "release", "path=" + w2.S.path);
      check("a reload does not ask again", !d2.querySelector(".pick"));
      check("a reload comes back in the chosen theme",
            d2.documentElement.getAttribute("data-theme") === "darker");
      w2.S.tab = "watch"; w2.render();
      check("The Path opens in the chosen ordering",
            /Release/i.test(d2.querySelector(".pathtitle").textContent),
            d2.querySelector(".pathtitle").textContent);
      check("no adopt banner after a clean reload", !d2.querySelector(".viewing"));

      /* --- upgrading from 1.1.0: they already answered this question --- */
      /* A 1.1.0 payload has mode and no path. */
      var legacy = JSON.stringify({watched:{}, skipped:{}, rated:{},
        mode:"life", scope:"movies", log:[]});
      reboot(legacy, "1.1.0", function(w3, d3){
        check("a 1.1.0 save migrates its mode into the path", w3.S.path === "life",
              "path=" + w3.S.path);
        check("an upgrading user is not asked to choose again", !d3.querySelector(".pick"));
        check("the migrated path renders the control", !!d3.querySelector(".pathseg"));

        /* --- a save from before any of this still opens --- */
        var ancient = JSON.stringify({watched:{}, skipped:{}, rated:{}, log:[]});
        reboot(ancient, "no mode", function(w4, d4){
          check("a save with no ordering at all falls back to the chooser",
                w4.S.path === "" && !!d4.querySelector(".pick"));

          /* --- 4.2.3, C-2 of the 19 Aug audit: the JSON door next to the vault.
             Backup codes are fuzzed against inventing IDs and JSON import was
             not — doRestore counted unknown keys and then wrote every key into
             S anyway, so an unknown ID inflated the counts, survived into
             storage, and sat waiting to collide with a future real slug. These
             drive the function, not its source shape. */
          (function(){
            var realId = FILMS[0].id;
            var wIn = {}; wIn["a-slug-that-does-not-exist"] = 1; wIn[realId] = 1;
            var res = w4.doRestore(JSON.stringify({watched:wIn,
                                                   skipped:{"another-invented-slug":1},
                                                   rated:{"a-third-fake":5}}));
            check("a JSON import counts unknown ids without keeping them",
                  !!res && res.unknown === 3 && res.found === 1,
                  res ? res.found + " found, " + res.unknown + " unknown" : "REJECTED");
            check("an unknown id never reaches live state through JSON restore",
                  !("a-slug-that-does-not-exist" in w4.S.watched) &&
                  !("another-invented-slug" in w4.S.skipped) &&
                  !("a-third-fake" in w4.S.rated),
                  "watched keys: " + Object.keys(w4.S.watched).join(","));
            check("the known id in the same payload still lands",
                  w4.S.watched[realId] === 1);
            var proto = w4.doRestore('{"watched":{"__proto__":{"polluted":1}}}');
            check("a __proto__ key in a JSON payload counts as unknown and is dropped",
                  !!proto && proto.unknown === 1 && proto.found === 0 &&
                  !("polluted" in w4.S.watched) && !w4.S.watched.polluted,
                  proto ? proto.found + " found, " + proto.unknown + " unknown" : "REJECTED");

            /* 4.2.4, C-4 of the re-audit: the gates stop depending on the
               call graph. applyImport was safe only because importCode is
               fuzzed and cannot invent an id; mergeLog was safe only because
               Activity skips unknown ids at render. Both now consult BYID
               themselves, so a future caller cannot reopen the door. */
            var apRes = {watched:Object.create(null), skipped:Object.create(null),
                         rated:Object.create(null), path:""};
            apRes.watched["an-id-no-caller-should-trust"] = 1;
            apRes.watched[FILMS[1].id] = 1;
            apRes.rated["another-invented-one"] = 4;
            w4.applyImport(apRes);
            check("applyImport refuses an id the catalogue does not carry",
                  !("an-id-no-caller-should-trust" in w4.S.watched) &&
                  !("another-invented-one" in w4.S.rated) &&
                  !w4.S.log.some(function(e){ return e.id === "an-id-no-caller-should-trust"; }),
                  "watched keys: " + Object.keys(w4.S.watched).join(","));
            check("applyImport still lands the known id beside it",
                  w4.S.watched[FILMS[1].id] === 1);
            var moved = w4.mergeLog([{id:"a-logged-id-that-never-existed", ts:1754700000000},
                                     {id:FILMS[2].id, ts:1754700000001}]);
            check("mergeLog keeps the log a subset of the catalogue",
                  moved === 1 &&
                  !w4.S.log.some(function(e){ return e.id === "a-logged-id-that-never-existed"; }),
                  moved + " moved, log: " + w4.S.log.length);
            check("mergeLog still merges a real entry with a valid clock",
                  w4.S.log.some(function(e){ return e.id === FILMS[2].id; }));
            /* 4.2.5, C-5: the restore-path half of the same invariant — a
               previously polluted or hostile store cannot keep phantom ids
               in S.log through dedupeLog. */
            var dl = w4.dedupeLog([{id:"a-phantom-logged-id", ts:1754700000000},
                                   {id:FILMS[3].id, ts:1754700000001}]);
            check("dedupeLog drops a logged id the catalogue does not carry",
                  dl.length === 1 && dl[0].id === FILMS[3].id,
                  dl.map(function(e){ return e.id; }).join(","));
          })();

          /* --- 4.2.3, C-1: a store that READS but does not PARSE. The old
             behaviour booted as a first visit, kept saving on, and the first
             tick overwrote the reader's unread bytes with a near-empty
             payload — silent loss on the exact page whose pitch is that the
             data never leaves the device. A failed parse is a failed read:
             latch, stop the writes, show the banner, leave the bytes. */
          var corrupt = '{"watched":{"half-a-payload';
          reboot(corrupt, "corrupt store", function(w5, d5){
            check("a store that reads but does not parse latches readFailed",
                  w5.readFailed === true, "readFailed=" + w5.readFailed);
            check("a corrupt store turns saving off and says so",
                  w5.canSave === false && !d5.getElementById("nosave").hidden,
                  "canSave=" + w5.canSave);
            check("a corrupt store still boots the app",
                  !!d5.querySelector(".pick") || !!d5.getElementById("app"));
            w5.S.watched[FILMS[0].id] = 1;
            w5.persist(); w5.flushPersist();
            check("a tick after a corrupt read does not overwrite the unread bytes",
                  w5.localStorage.getItem("batwatch-v3") === corrupt,
                  "stored: " + String(w5.localStorage.getItem("batwatch-v3")).slice(0, 40));
            runBlocked();
          });
        });
      });
    });

    function runBlocked(){
    /* --- a restore link on a device that has never been used ------------
       The case 1.6.4 shipped without. Its only test set S.pending with a path
       already chosen — the one state where the bug is invisible — so the banner
       sitting after viewHome's !S.path early return went unnoticed, and a fresh
       phone (the only device a restore link is for) saw nothing at all. */
    (function(){
      S.path = S.mode = "life"; S.format = "all"; S.scope = "all";
      S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.pending = null;
      FILMS.slice(0, 12).forEach(function(f){ S.watched[f.id] = 1; });
      var code = win.exportCode();
      check("a backup code carries the path", /P[clr]$/.test(code), code.slice(-6));

      /* Cold start: nothing chosen, nothing ticked. */
      S.path = ""; S.mode = "continuity"; S.watched = {}; S.skipped = {};
      S.rated = {}; S.log = []; S.pending = null;
      S.pending = win.importCode(code);
      S.tab = "home"; win.render();
      var banner = doc.querySelector("#view .panel:not([inert]) .viewing");
      check("a restore link shows its banner on a device with no path", !!banner);
      check("the banner says a path is coming",
            !!banner && /path/i.test(banner.textContent), banner && banner.textContent);
      var take = banner && banner.querySelector('[data-act="takelink"]');
      check("the banner offers to restore", !!take);
      if(take) take.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
      check("restoring on a fresh device keeps the path the link carried",
            S.path === "life", "path=" + S.path);
      check("restoring on a fresh device lands the marks",
            Object.keys(S.watched).length === 12, Object.keys(S.watched).length + " marks");
      check("the banner is gone once it is answered", !doc.querySelector("#view .panel:not([inert]) .viewing"));

      /* Declining leaves everything alone. */
      S.path = ""; S.mode = "continuity"; S.watched = {}; S.log = []; S.rated = {};
      S.pending = win.importCode(code); S.tab = "home"; win.render();
      var drop = doc.querySelector('#view .panel:not([inert]) .viewing [data-act="droplink"]');
      check("the banner offers to decline", !!drop);
      if(drop) drop.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
      check("declining leaves the device untouched",
            !S.path && Object.keys(S.watched).length === 0);
      S.pending = null; S.path = S.mode = "continuity"; win.render();
    })();

    /* --- an erase in another tab stays erased (3.7.2, M-1) ---------------
       Cross-tab sync merges, and a merge can only add — so "Clear all
       progress" in tab A used to be resurrected by tab B's in-memory state.
       The reset now writes a monotonic resetAt and the storage handler adopts
       a newer one as a wipe. Driven through the real listener with real
       StorageEvents, because the listener is anonymous and no guard can
       extract it. */
    (function(){
      S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.resetAt = 0;
      S.watched["batman-begins-2005"] = 1; S.rated["batman-begins-2005"] = 4;
      S.log = [{id: "batman-begins-2005", ts: 1}];
      win.render();
      win.dispatchEvent(new win.StorageEvent("storage", {key: win.KEY,
        newValue: JSON.stringify({watched: {}, skipped: {}, rated: {}, log: [],
                                  resetAt: 1754870400000})}));
      check("a cross-tab erase wipes this tab's marks too",
            Object.keys(S.watched).length === 0 && Object.keys(S.rated).length === 0 &&
            S.log.length === 0,
            "watched " + Object.keys(S.watched).length + ", rated " +
            Object.keys(S.rated).length + ", log " + S.log.length);
      check("the erase's clock is adopted, so a re-fire cannot wipe twice",
            S.resetAt === 1754870400000, "resetAt=" + S.resetAt);
      win.dispatchEvent(new win.StorageEvent("storage", {key: win.KEY,
        newValue: JSON.stringify({watched: {"the-batman-2022": 1},
                                  resetAt: 1754870400000})}));
      check("an ordinary cross-tab payload still merges after the erase",
            S.watched["the-batman-2022"] === 1,
            "watched: " + Object.keys(S.watched).join(","));
      S.watched["batman-1989"] = 1;
      win.dispatchEvent(new win.StorageEvent("storage", {key: win.KEY,
        newValue: JSON.stringify({watched: {}, resetAt: 5})}));
      check("a STALE resetAt does not erase newer progress",
            S.watched["batman-1989"] === 1, "resetAt=" + S.resetAt);
      S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.resetAt = 0;
      win.render();
    })();

    /* --- an unmark in another tab stays unmarked (3.8.0) -----------------
       resetAt covered the full erase; every INDIVIDUAL removal still
       resurrected, because the merge was additive and a toggle is not. Every
       mark now carries the time it last changed — in either direction — and
       the newer clock decides, absence included: a clock whose mark is absent
       is the tombstone. Payloads from older builds carry no clocks and still
       merge additively, but they can no longer resurrect a clocked removal.
       Driven through the real listener, like the erase above. */
    (function(){
      S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.resetAt = 0;
      S.clk = {w:{}, s:{}, r:{}};
      var A = "batman-begins-2005", B = "the-batman-2022";
      S.watched[A] = 1; S.clk.w[A] = 1000;
      S.log = [{id: A, ts: 1}];
      win.dispatchEvent(new win.StorageEvent("storage", {key: win.KEY,
        newValue: JSON.stringify({watched: {}, skipped: {}, rated: {}, log: [],
          clk: {w: (function(o){ o[A] = 2000; return o; })({}), s: {}, r: {}}})}));
      check("a cross-tab unmark with a newer clock unmarks here too",
            !S.watched[A], "watched=" + !!S.watched[A]);
      check("the unmark takes the log entry with it", S.log.length === 0,
            "log " + S.log.length);
      check("the tombstone's clock is adopted", S.clk.w[A] === 2000,
            "clk=" + S.clk.w[A]);
      win.dispatchEvent(new win.StorageEvent("storage", {key: win.KEY,
        newValue: JSON.stringify({watched: (function(o){ o[A] = 1; return o; })({}),
                                  log: [{id: A, ts: 1}]})}));
      check("a clockless payload cannot resurrect a deliberate removal",
            !S.watched[A], "watched=" + !!S.watched[A]);
      win.dispatchEvent(new win.StorageEvent("storage", {key: win.KEY,
        newValue: JSON.stringify({watched: (function(o){ o[A] = 1; return o; })({}),
          log: [{id: A, ts: 3}],
          clk: {w: (function(o){ o[A] = 3000; return o; })({}), s: {}, r: {}}})}));
      check("a newer re-mark still lands", S.watched[A] === 1,
            "watched=" + S.watched[A]);
      check("the re-mark brings its log entry back",
            S.log.length === 1 && S.log[0].id === A, "log " + S.log.length);
      S.rated[B] = 5; S.clk.r[B] = 2000;
      win.dispatchEvent(new win.StorageEvent("storage", {key: win.KEY,
        newValue: JSON.stringify({rated: (function(o){ o[B] = 3; return o; })({}),
          clk: {w: {}, s: {}, r: (function(o){ o[B] = 1000; return o; })({})}})}));
      check("an older rating loses to the newer one", S.rated[B] === 5,
            "rated=" + S.rated[B]);
      win.dispatchEvent(new win.StorageEvent("storage", {key: win.KEY,
        newValue: JSON.stringify({rated: {},
          clk: {w: {}, s: {}, r: (function(o){ o[B] = 3000; return o; })({})}})}));
      check("a rating cleared elsewhere clears here", S.rated[B] === undefined,
            "rated=" + S.rated[B]);
      S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.resetAt = 0;
      S.clk = {w:{}, s:{}, r:{}};
      win.render();
    })();
    tailPhases();
    }

    /* The tail: the css sweep, the old-origin document, the blocked store.
       Each behind its own phase gate; an unscoped run walks all three in
       the same order it always did. */
    function tailPhases(){

    /* --- every CSS rule matches something, somewhere ---------------------
       Two releases running left a rule behind after the markup it styled was
       removed \u2014 .arow .aopen in 1.6.2, .arow .atop in 1.6.3 \u2014 and both were
       found by a script run by hand. This is not a layout question, which is
       why it does not need a real browser: it asks whether a selector ever
       matches, and querySelector works here perfectly. It rides along on the
       states this suite already drives. */
    if(wants("css")) (function(){
      /* The tags come off before the rules are cut: joining full matches used
         to leave "<style>" glued to each block's first selector, an artifact
         the old swallow-everything catch hid and 3.7.2's parse check exposed
         the day it was written. */
      var css = html.match(/<style>([\s\S]*?)<\/style>/g)
                    .map(function(m){ return m.replace(/^<style>|<\/style>$/g, ""); })
                    .join("\n")
                    .replace(/\/\*[\s\S]*?\*\//g, "");
      var rules = css.match(/[^{}]+\{[^}]*\}/g) || [];
      var sels = [];
      rules.forEach(function(r){
        var sel = r.slice(0, r.indexOf("{")).replace(/\s+/g, " ").trim();
        if(sel.charAt(0) === "@" || !sel) return;
        sels.push(sel);
      });
      var matched = Object.create(null);
      var unparsable = Object.create(null);
      /* 2.2.0, report §5.5: most rules match within the first few states, so
         once every selector has matched there is nothing left to learn — the
         remaining sweeps would probe an empty worklist ~80 times. The early
         exit cannot change the verdict: matched only ever grows, and the
         dead list at the end reads matched, not the sweep count. */
      var unmatched = sels.length;
      function sweep(){
        if(unmatched === 0) return;
        sels.forEach(function(sel){
          if(matched[sel]) return;
          var probe = sel.split(",").map(function(one){
            return one
              .replace(/::?(before|after|placeholder|selection|marker|backdrop|-webkit-[a-z-]+)/g, "")
              .replace(/:(hover|active|focus-visible|focus|disabled|checked|first-of-type|last-of-type|last-child|first-child)/g, "")
              .trim();
          }).filter(Boolean).join(",");
          if(!probe){ matched[sel] = 1; unmatched--; return; }
          /* 3.7.2 (L-9 of the 10 Aug review): a selector jsdom REFUSES used
             to be marked matched, which permanently exempted a typo'd rule
             from the dead-rule sweep — the one state this sweep exists to
             catch, hidden by its own error handling. It is recorded and
             reported as its own verdict below instead. */
          try{ if(doc.querySelector(probe)){ matched[sel] = 1; unmatched--; } }
          catch(e){
            if(!unparsable[sel]){ unparsable[sel] = 1; }
            matched[sel] = 1; unmatched--;
          }
        });
      }
      S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.open = {}; S.q = "";
      S.path = ""; S.tab = "home"; win.render(); sweep();
      ["continuity", "life", "release"].forEach(function(pt){
        S.path = S.mode = pt;
        ["anim", "live", "all"].forEach(function(fm){
          S.format = fm;
          ["movies", "all"].forEach(function(sc){
            S.scope = sc;
            ["home", "next", "watch", "stats"].forEach(function(t){
              S.tab = t; S.filter = "all"; win.render(); sweep();
            });
          });
        });
      });
      S.path = S.mode = "continuity"; S.format = "all"; S.scope = "all";
      FILMS.slice(0, 40).forEach(function(f, i){
        S.watched[f.id] = 1; if(i < 5) S.log.push({id:f.id, ts:1785000000000 + i * 86400000});
      });
      S.skipped[FILMS[60].id] = 1; S.rated[FILMS[0].id] = 4;
      ["home", "next", "watch", "stats"].forEach(function(t){ S.tab = t; win.render(); sweep(); });
      /* Both keyspaces: 3.0.0 split the path's expanded rows (S.open) from
         Next up's peeks (S.peek), and the sweep has to open both or .qpeek
         renders in no state this pass visits. */
      FILMS.forEach(function(f){ S.open[f.id] = true; S.peek[f.id] = true; });
      ["next", "watch"].forEach(function(t){ S.tab = t; win.render(); sweep(); });
      ["left", "done", "ess", "core", "opt"].forEach(function(f){
        S.tab = "watch"; S.filter = f; win.render(); sweep();
      });
      S.filter = "all"; S.q = "zzzznomatch"; win.render(); sweep();
      S.q = ""; S.tab = "stats"; S.code = win.exportCode();
      S.progOpen = {uni:true, era:true}; win.render(); sweep();
      S.tab = "watch"; S.beltOpen = true; win.render(); sweep();
      /* 3.6.0: the dropped state — jsdom cannot resolve the anchor CSS, but
         the sweep only asks whether the selectors can match, and they must. */
      S.beltDrop = true; win.render(); sweep();
      S.beltDrop = false;
      /* 3.6.4: the entrance's one-render flag — staged the way beltOpening
         is. The permanent peek needs no staging: data-park renders in every
         chosen-path state this sweep already walks. */
      S.beltDropping = true; S.beltDrop = true; win.render(); sweep();
      S.beltDropping = false; S.beltDrop = false;
      /* The opening render is one flag-scoped render (2.2.1) and the closing
         state is set imperatively by the belt handler, so the sweep stages
         both the way it stages data-theme. */
      S.beltOpening = true; win.render(); sweep(); S.beltOpening = false;
      doc.querySelector(".includes").className = "includes closing"; sweep();
      doc.querySelector(".includes").className = "includes";
      /* 3.4.0. render() puts .settling on #view for the one frame the scroll
         restore lives in and drops it in a rAF. jsdom reports the scroll
         position as 0 forever, so keep is always 0 and that branch never runs
         here \u2014 the class is staged the way beltOpening and .includes closing
         already are. */
      doc.getElementById("view").classList.add("settling"); sweep();
      doc.getElementById("view").classList.remove("settling");
      /* 4.0.4: the peek is permanent header chrome when parked \u2014
         parkFocus() toggles data-on from the strip's own attributes on
         every render, but this stretch of the sweep holds the belt open,
         so the flag is staged the way data-beltpark is. The sweep asks
         whether the selector can match, not whether the belt was parked.
         The peek's third lit segment needs the one mode the sweep does
         not otherwise walk. */
      doc.getElementById("beltpeek").setAttribute("data-on", ""); sweep();
      S.mode = "release"; win.render(); sweep();
      S.mode = "continuity"; win.render();
      doc.getElementById("beltpeek").removeAttribute("data-on");
      S.beltOpen = false;
      /* The states a sweep cannot reach by walking the tabs. */
      S.tab = "watch"; S.mode = "life"; win.render(); sweep();
      S.path = ""; win.render(); sweep();
      S.path = S.mode = "continuity";
      S.pending = {found:3, unknown:0}; S.tab = "home"; win.render(); sweep();
      S.pending = null;
      win.toast("x"); sweep();
      S.tab = "watch"; win.setAllGroups(false); win.render(); sweep();
      win.setAllGroups(true);
      FILMS.forEach(function(f){ S.watched[f.id] = 1; });
      ["home", "next", "watch", "stats"].forEach(function(t){ S.tab = t; win.render(); sweep(); });
      doc.documentElement.setAttribute("data-theme", "darker"); sweep();
      doc.documentElement.setAttribute("data-theme", "dark");
      /* 3.5.0: the parked flag is set by an IntersectionObserver jsdom does not
         have, so the parked state is staged the way data-theme is — the sweep
         asks whether the selectors can match, not whether the observer fired. */
      doc.documentElement.setAttribute("data-beltpark", ""); sweep();
      doc.documentElement.removeAttribute("data-beltpark");
      /* 3.7.0: the install seat renders behind a held beforeinstallprompt or
         an iOS UA, and jsdom has neither \u2014 staged the way data-beltpark is.
         The sweep asks whether the selectors can match, not whether the
         browser made an offer. */
      win.installEvt = {}; S.tab = "stats"; win.render(); sweep();
      win.installEvt = null;
      win.IOSDEVICE = true; win.render(); sweep();
      win.IOSDEVICE = false; win.render();
      var dead = sels.filter(function(sel){ return !matched[sel]; });
      check("every CSS rule matches something in some state",
            dead.length === 0, dead.join("  |  "));
      var broken = Object.keys(unparsable);
      check("every CSS selector parses, so the dead-rule sweep can see it",
            broken.length === 0, broken.join("  |  "));
      S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.open = {};
      S.tab = "home"; S.path = S.mode = "continuity"; win.render();
    })();

    /* afterOrigin() outlived the origin phase by four releases: a one-line hop
       named after a document this suite stopped booting in 2.5.1. */
    if(wants("blocked")) blockedStore();
    else finish();
    }
  }, 200);
});

function blockedStore(){
    /* --- a blocked store must SAY so --- */
    /* Only a document with localStorage throwing can observe the silent failure. */
    var blocked = new jsdom.JSDOM(html, {runScripts:"dangerously", url:"https://nightwatcher.life/",
      pretendToBeVisual:true, beforeParse:function(w){
        Object.defineProperty(w, "localStorage", {get:function(){
          throw new Error("SecurityError: storage is disabled in this browser");
        }});
      }});
    blocked.window.addEventListener("load", function(){
      setTimeout(function(){
        var w = blocked.window, strip = w.document.getElementById("nosave");
        check("blocked store sets canSave false", w.canSave === false, "canSave=" + w.canSave);
        check("blocked store shows the warning", strip && strip.hidden === false);
        check("warning sits inside the sticky header", !!(strip && strip.closest("header")));
        check("warning names the consequence", !!(strip && /reload/i.test(strip.textContent)),
              strip ? strip.textContent.slice(0, 48) : "-");
        check("no raw \\uXXXX escape leaked into the warning text",
              !!(strip && strip.textContent.indexOf("\\u") < 0), strip ? strip.textContent.slice(0, 48) : "-");
        check("app still renders and stays usable", w.document.getElementById("app").textContent.length > 500);
        check("warning is hidden when storage works", win.document.getElementById("nosave").hidden === true);

        if(!ONLY) checkReadmeCount();
        finish();
      }, 200);
    });
}
