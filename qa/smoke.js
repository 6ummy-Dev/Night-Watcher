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

    /* --- first run: Home IS the chooser, and nothing else --- */
    var doc = win.document;
    check("no path is set on a fresh device", S.path === "", 'path="' + S.path + '"');
    check("Home shows the three path cards", doc.querySelectorAll(".pick").length === 3,
          doc.querySelectorAll(".pick").length + " cards");
    check("Home shows no hero until a path is chosen", !doc.querySelector("#view .hero"));
    check("chooser cards all carry a blurb",
          Array.prototype.every.call(doc.querySelectorAll(".pick"), function(b){
            return b.querySelector("span") && b.querySelector("span").textContent.length > 20;
          }));

    /* --- choosing one: through the real click handler, not by assignment --- */
    doc.querySelector('.pick[data-path="life"]').click();
    check("choosing sets both path and mode", S.path === "life" && S.mode === "life",
          "path=" + S.path + " mode=" + S.mode);
    check("Home swaps the chooser for the path card",
          !doc.querySelector(".pick") && !!doc.querySelector(".pathcard"));
    check("the path card names the path",
          /Bruce/.test(doc.querySelector(".pathname").textContent),
          doc.querySelector(".pathname").textContent);
    check("the header sub-line carries the path name",
          /Bruce/.test(doc.getElementById("hsub").textContent),
          doc.getElementById("hsub").textContent);
    check("the choice was written to storage",
          /"path":"life"/.test(win.localStorage.getItem("batwatch-v3") || ""));

    /* --- The Path stops asking --- */
    S.tab = "watch"; win.render();
    check("The Path has no mode switcher", doc.querySelectorAll("#view [data-mode]").length === 0,
          doc.querySelectorAll("#view [data-mode]").length + " switcher buttons");
    check("The Path titles the chosen ordering",
          !!doc.querySelector(".pathtitle") && /Bruce/.test(doc.querySelector(".pathtitle").textContent));
    check("no adopt banner while mode agrees with path", !doc.querySelector(".viewing"));

    /* --- a shared link is a VIEW, not a takeover --- */
    S.mode = "release"; win.render();
    check("a foreign ordering offers to be adopted", !!doc.querySelector(".viewing"));
    check("viewing does not change the stored path", S.path === "life");
    check("stored payload still says life after viewing",
          /"path":"life"/.test(win.localStorage.getItem("batwatch-v3") || ""));
    doc.querySelector('.viewing button[data-path="release"]').click();
    check("adopting the view sets the path", S.path === "release" && S.mode === "release");
    S.tab = "watch"; S.path = S.mode = "life"; win.persist(); win.render();

    /* --- ticking before choosing must not invent a path (1.2.2) --- */
    /* Ticking before choosing used to write a real ordering, which the next load
       adopted as a path nobody picked. */
    (function(){
      var keep = {path:S.path, mode:S.mode, watched:S.watched};
      S.path = ""; S.mode = "continuity"; S.watched = {};
      S.watched[FILMS[0].id] = 1; win.persist();
      var raw = win.localStorage.getItem("batwatch-v3") || "";
      check("persisting with no path chosen writes no ordering",
            /"path":"","mode":""/.test(raw),
            (raw.match(/"path":"[^"]*","mode":"[^"]*"/) || [""])[0]);
      S.path = keep.path; S.mode = keep.mode; S.watched = keep.watched; win.persist();
    })();

    /* --- a view has to be reversible without a reload (1.2.1) --- */
    /* Reported: choose a path, tap a universe card, no way back but a reload. */
    S.path = S.mode = "life"; S.tab = "home"; win.persist(); win.render();
    doc.querySelector('#view [data-act="jump"]').click();
    check("a Home card enters a view of another ordering",
          S.mode === "continuity" && S.path === "life", "mode=" + S.mode);
    check("the banner offers a way back", !!doc.querySelector('.viewing [data-act="mypath"]'));
    check("the way back names your path",
          /Bruce/.test((doc.querySelector('[data-act="mypath"]') || {textContent:""}).textContent));
    doc.querySelector('.viewing [data-act="mypath"]').click();
    check("it returns to your path with no reload", S.mode === "life", "mode=" + S.mode);
    check("and the banner clears", !doc.querySelector(".viewing"));
    doc.querySelector('#tabs [data-tab="home"]').click();
    doc.querySelector('#view [data-act="jump"]').click();
    doc.querySelector('#tabs [data-tab="next"]').click();
    doc.querySelector('#tabs [data-tab="watch"]').click();
    check("tapping The Path tab also returns to your path", S.mode === "life", "mode=" + S.mode);
    S.tab = "watch"; win.render();

    /* --- switching never costs progress --- */
    var beforeSwitch = Object.keys(S.watched).length;
    S.watched[FILMS[3].id] = 1; win.persist();
    S.path = S.mode = "release"; win.persist(); win.render();
    check("switching path keeps every tick",
          Object.keys(S.watched).length === beforeSwitch + 1,
          Object.keys(S.watched).length + " watched");
    delete S.watched[FILMS[3].id];
    S.path = S.mode = "life"; win.persist(); win.render();

    /* --- darker --- */
    var bar = function(){ return doc.querySelector('meta[name="theme-color"]').getAttribute("content"); };
    check("default theme is dark", S.theme === "dark" &&
          doc.documentElement.getAttribute("data-theme") === "dark", bar());
    S.tab = "stats"; win.render();
    doc.querySelector('#view [data-theme="darker"]').click();
    check("darker sets the document attribute",
          doc.documentElement.getAttribute("data-theme") === "darker");
    check("darker repaints the status bar", bar() === "#000000", bar());
    check("darker is persisted", /"theme":"darker"/.test(win.localStorage.getItem("batwatch-v3") || ""));
    doc.querySelector('#view [data-theme="dark"]').click();
    check("switching back restores the bar", bar() === "#0C111C", bar());
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

    /* --- transfer without a QR (1.2.4) --- */
    S.tab = "stats"; win.render();
    doc.querySelector('#view [data-act="mkcode"]').click();
    check("making a code shows Copy link", !!doc.querySelector('#view [data-act="copylink"]'));
    check("the link it copies is absolute and carries the code",
          /^https?:\/\/.+#nw=NW2W/.test(win.restoreLink(S.code)), win.restoreLink(S.code).slice(0, 46) + "…");
    check("that link restores when opened",
          !!win.importCode(win.restoreLink(S.code)));
    check("no QR encoder is loaded", typeof win.qrcode === "undefined");
    S.tab = "home"; win.render();

    /* --- the restore link is absolute and reachable --- */
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

    /* --- Home and Next up render the SAME title; it must not resize --- */
    S.scope = "movies"; S.q = ""; S.filter = "all";
    S.tab = "home"; win.render();
    var homeH2 = win.document.querySelector("#view .hero h2");
    S.tab = "next"; win.render();
    var nextH2 = win.document.querySelector("#view .hero h2");
    check("Home and Next up show the same hero title",
          homeH2 && nextH2 && homeH2.textContent === nextH2.textContent,
          homeH2 && nextH2 ? homeH2.textContent + " vs " + nextH2.textContent : "missing hero");
    check("no hero title carries an inline font-size",
          !/font-size/.test((homeH2 && homeH2.getAttribute("style")) || "") &&
          !/font-size/.test((nextH2 && nextH2.getAttribute("style")) || ""));

    /* same again once the catalogue is complete — the "Case closed" variant */
    var savedWatched = S.watched;
    S.watched = {}; FILMS.forEach(function(f){ S.watched[f.id] = 1; });
    var sized = 0;
    ["home","next"].forEach(function(t){
      S.tab = t; win.render();
      Array.prototype.forEach.call(win.document.querySelectorAll("#view .hero h2"), function(el){
        if(/font-size/.test(el.getAttribute("style") || "")) sized++;
      });
    });
    check("completed-catalogue heroes are unsized too", sized === 0, sized + " sized");
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
    check("exportCode writes NW2", /^NW2W/.test(code), code.slice(0, 14) + "…");
    check("the code carries the chosen path", /P[clr]$/.test(code), code.slice(-2));
    check("code round-trips in the page", mine && mine.found === Object.keys(S.watched).length,
          mine ? "found " + mine.found : "null");

    var future = win.importCode(code + "X7ab");
    check("a future NW2 code with unknown segments still restores",
          future && mine && future.found === mine.found, future ? "found " + future.found : "REJECTED");
    check("unknown segments are ignored, not restored as junk",
          future && mine && future.unknown === mine.unknown, future ? "unknown " + future.unknown : "-");
    check("a pasted restore URL still works",
          !!win.importCode("  " + win.SITE + "#nw=" + code + "  "));
    check("a code split across lines still works",
          !!win.importCode(code.slice(0, 10) + "\n" + code.slice(10)));
    check("an NW1 code from 1.0.0 still restores",
          !!win.importCode(code.replace(/^NW2/, "NW1").replace(/P[clr]$/, "")));
    check("a code with no path segment still restores",
          !!win.importCode(code.replace(/P[clr]$/, "")));
    var junkOk = ["", "hello", "NW1", "NW1W!!!", "not-a-code"].every(function(j){
      return win.importCode(j) === null;
    });
    check("junk is still rejected", junkOk);

    /* --- the choice has to survive a reload, which is the entire point --- */
    /* A fresh document with storage pre-seeded is a reload. */
    function reboot(seed, label, then){
      var d = new jsdom.JSDOM(html, {runScripts:"dangerously", url:"https://6ummy-dev.github.io/Night-Watcher/",
        pretendToBeVisual:true, beforeParse:function(w){
          w.localStorage.setItem("batwatch-v3", seed);
        }});
      d.window.addEventListener("load", function(){
        setTimeout(function(){ then(d.window, d.window.document); }, 200);
      });
    }

    S.path = S.mode = "release"; S.theme = "darker"; win.persist();
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
        check("the migrated path renders the card", !!d3.querySelector(".pathcard"));

        /* --- a save from before any of this still opens --- */
        var ancient = JSON.stringify({watched:{}, skipped:{}, rated:{}, log:[]});
        reboot(ancient, "no mode", function(w4, d4){
          check("a save with no ordering at all falls back to the chooser",
                w4.S.path === "" && !!d4.querySelector(".pick"));
          runBlocked();
        });
      });
    });

    function runBlocked(){
    /* --- a blocked store must SAY so --- */
    /* Only a document with localStorage throwing can observe the silent failure. */
    var blocked = new jsdom.JSDOM(html, {runScripts:"dangerously", url:"https://6ummy-dev.github.io/Night-Watcher/",
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

        console.log(fails.length ? "\n" + fails.length + " smoke failure(s)\n" : "\n  ✓ smoke passed\n");
        process.exit(fails.length ? 1 : 0);
      }, 200);
    });
    }
  }, 200);
});
