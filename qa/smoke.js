#!/usr/bin/env node
/* Headless render test. Boots docs/index.html in jsdom and drives the paths the
   guards cannot reach — actual rendering, scope switching, and hostile import.
   Requires jsdom (dev-only): npm i -D jsdom      Run: node qa/smoke.js */
"use strict";
var fs = require("fs"), path = require("path");
var ROOT = path.join(__dirname, "..");
var PUBLIC = fs.existsSync(path.join(ROOT, "docs", "index.html"))
  ? path.join(ROOT, "docs") : ROOT;
var jsdom;
try { jsdom = require("jsdom"); }
catch(e){ console.log("skipped — jsdom not installed (npm i -D jsdom)"); process.exit(0); }

var html = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8")
  /* strip network assets so the test is offline and deterministic */
  .replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "")
  .replace(/<script[^>]*cloudflareinsights[^>]*><\/script>/g, "");

var fails = [];
function check(name, cond, detail){
  if(cond) console.log("  ok   " + name);
  else { console.log("  FAIL " + name + (detail ? "  — " + detail : "")); fails.push(name); }
}

var dom = new jsdom.JSDOM(html, {runScripts:"dangerously", url:"https://6ummy-dev.github.io/Night-Watcher/", pretendToBeVisual:true});
var win = dom.window;

win.addEventListener("load", function(){
  setTimeout(function(){
    var app = win.document.getElementById("app");
    check("app renders", app && app.textContent.length > 500,
          app ? app.textContent.length + " chars" : "no #app");

    var S = win.S, FILMS = win.FILMS, tierOf = win.tierOf;

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

    /* --- release note tracks scope --- */
    S.mode = "release";
    S.scope = "movies"; var mNote = win.modeNote();
    S.scope = "all";    var aNote = win.modeNote();
    check("release note says 1993 in Movies scope", /1993 to 2028/.test(mNote), mNote.slice(0, 46));
    check("release note says 1968 in Movies+Series", /1968 to 2028/.test(aNote), aNote.slice(0, 46));

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

    /* --- QR restore link is absolute and reachable --- */
    check("restore link is absolute", /^https:\/\//.test(win.restoreLink("NW1WSR")));

    /* --- detail panels are built on demand, not for all 151 entries --- */
    S.tab = "watch"; S.scope = "all"; S.filter = "all"; S.q = ""; S.open = {};
    win.render();
    var view = win.document.getElementById("view");
    var closedSize = view.innerHTML.length;
    check("no detail panels rendered while every row is closed",
          view.querySelectorAll(".fdetail").length === 0,
          view.querySelectorAll(".fdetail").length + " found");
    S.open["batman-mask-of-the-phantasm-1993"] = true;
    win.render();
    view = win.document.getElementById("view");
    check("opening one row renders exactly one detail panel",
          view.querySelectorAll(".fdetail").length === 1,
          view.querySelectorAll(".fdetail").length + " found");
    check("closed view is materially smaller than the old always-on markup",
          closedSize < 150000, closedSize + " chars");
    S.open = {};

    /* --- all six filters reachable from the Path tab --- */
    win.render();
    var chips = win.document.getElementById("view").querySelectorAll(".chip");
    check("all six filter chips are present", chips.length === 6, chips.length + " chips");

    /* --- tab state uses valid ARIA --- */
    S.tab = "stats"; win.render();
    var cur = win.document.querySelectorAll("#tabs button[aria-current]");
    check("exactly one tab marked aria-current", cur.length === 1, cur.length + " marked");
    check("aria-current is on the active tab", cur[0] && cur[0].dataset.tab === "stats");
    check("no invalid aria-selected on tab buttons",
          win.document.querySelectorAll("#tabs button[aria-selected]").length === 0);

    /* --- no <div> or <h2> nested inside a <button> (invalid HTML) --- */
    S.tab = "watch"; win.render();
    var bad = win.document.querySelectorAll("#view button div, #view button h2");
    check("no flow content nested inside a button", bad.length === 0, bad.length + " found");

    /* --- memoised groups stay correct across a scope flip --- */
    S.scope = "movies"; var movieCount = win.pool().length;
    S.scope = "all";    var allCount   = win.pool().length;
    S.scope = "movies"; var backAgain  = win.pool().length;
    check("group cache survives a scope round-trip",
          movieCount === backAgain && allCount > movieCount,
          movieCount + " / " + allCount + " / " + backAgain);

    /* --- tabs still switch without throwing --- */
    var e = null;
    try { ["home","watch","next","stats"].forEach(function(t){ win.S.tab = t; win.render(); }); }
    catch(err){ e = err; }
    check("all four tabs render", !e, e && e.message);

    console.log(fails.length ? "\n" + fails.length + " smoke failure(s)\n" : "\n  ✓ smoke passed\n");
    process.exit(fails.length ? 1 : 0);
  }, 200);
});
