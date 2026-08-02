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

/* jsdom has no scrollTo and throws on every call, catching it internally and
   printing a notice. The app scrolls on nearly every interaction, so that was
   97 lines of stderr and 97 thrown exceptions per run. */
var dom = new jsdom.JSDOM(html, {runScripts:"dangerously", url:"https://6ummy-dev.github.io/Night-Watcher/",
  pretendToBeVisual:true, beforeParse:function(w){ w.scrollTo = function(){}; }});
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

    /* The only page anyone arrives on, and the only one a crawler ever sees.
       Through 1.5.9 it rendered 803 characters of visible text carrying "Bruce"
       twice and "Batman" not once \u2014 the word every query for this page
       contains. The sentence that says it was already written; it just waited
       for a path to be chosen before it rendered. */
    var view0 = doc.getElementById("view");
    check("the landing page says Batman", view0.textContent.indexOf("Batman") >= 0,
          view0.textContent.slice(0, 60));
    var intro0 = doc.querySelector("#view .intro"), deck0 = doc.querySelector("#view .deck");
    check("the landing page carries the intro", !!intro0);
    check("it tells before it asks",
          !!intro0 && !!deck0 && !!(intro0.compareDocumentPosition(deck0) &
                                    win.Node.DOCUMENT_POSITION_FOLLOWING));
    check("the intro paragraph renders once", doc.querySelectorAll("#view .ibody").length === 1,
          doc.querySelectorAll("#view .ibody").length + " copies");

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

    /* The eras and the decades are numbered by position, and an empty bucket is
       dropped before rendering \u2014 so the numbers have to be assigned after the
       drop, not before. 1.7.0 added a fifties decade with nothing in it (the
       serials stopped in 1949 and television did not arrive until 1966) and the
       release view read 1, 3, 4, 5. */
    ["life", "release"].forEach(function(m){
      S.mode = m; S.tab = "watch"; S.format = "all"; S.scope = "all"; win.render();
      var tags = Array.prototype.map.call(doc.querySelectorAll("#view .gnum"), function(e){
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
    S.watched = {}; S.log = {}; S.log = []; win.render();
    (function(){
      var rows = Array.prototype.map.call(doc.querySelectorAll("#view .grow, #view .qitem, #view [data-id]"),
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

    var wasShowing = doc.querySelector("#view .hero h2").textContent;
    doc.querySelector("#view .heroacts .go").dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("the hero advances after marking watched",
          doc.querySelector("#view .hero h2").textContent !== wasShowing);

    var act = doc.querySelector(".activity");
    check("Activity appears once something is logged", !!act);
    check("the heading names it as recent",
          !!act && act.querySelector(".qhead").textContent === "Recent activity",
          act ? act.querySelector(".qhead").textContent : "(none)");
    check("the first row is what was just marked",
          !!act && act.querySelector(".arow .at").textContent === wasShowing,
          act ? act.querySelector(".arow .at").textContent : "(none)");
    check("Activity sits below Then",
          !!act && !!doc.querySelector("#view .queue") &&
          (doc.querySelector("#view .queue").compareDocumentPosition(act) & 4) !== 0);
    check("Activity is not the queue list",
          !!act && act.querySelectorAll(".qitem").length === 0);

    /* Baseline is the hero as it stands NOW, not the title marked earlier \u2014
       comparing against that one passes even if the hero advances again. */
    var heroBefore = doc.querySelector("#view .hero h2").textContent;
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
          doc.querySelector("#view .hero h2").textContent === heroBefore,
          "was " + heroBefore + ", now " + doc.querySelector("#view .hero h2").textContent);
    check("rating from Activity logs nothing new", S.log.length === 1,
          S.log.length + " entries");
    check("Activity reflects the rating",
          doc.querySelectorAll(".activity .arow")[0]
             .querySelectorAll(".stars button.on").length === 4);

    /* The hero rates in place, and rating marks it watched (1.4.1). */
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.open = {};
    S.tab = "next"; win.render();
    var heroStars = doc.querySelector("#view .herorate .stars");
    check("the hero carries a star row", !!heroStars);
    var heroTitle = doc.querySelector("#view .hero h2").textContent;
    heroStars.querySelectorAll("button")[2]
             .dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("rating the hero marks it watched", Object.keys(S.watched).length === 1,
          JSON.stringify(Object.keys(S.watched)));
    check("rating the hero records the rating",
          S.rated[Object.keys(S.watched)[0]] === 3, JSON.stringify(S.rated));
    check("rating the hero advances the queue",
          doc.querySelector("#view .hero h2").textContent !== heroTitle);
    check("what was rated is now the top of Recent activity",
          doc.querySelector(".activity .arow .at").textContent === heroTitle,
          doc.querySelector(".activity .arow .at").textContent);

    /* ...and the tick on that row takes it back out. */
    var undo = doc.querySelector(".activity .arow .tick");
    check("each activity row carries a tick", !!undo);
    check("the hero puts stars and the watch link in one row",
          !!doc.querySelector("#view .herorow .herorate") &&
          !!doc.querySelector("#view .herorow .linkrow"));
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
          Array.prototype.every.call(doc.querySelectorAll("#view .qitem"), function(q){
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
          doc.querySelector("#view .hero h2").textContent === heroTitle,
          doc.querySelector("#view .hero h2").textContent);
    check("Recent activity disappears with nothing in it", !doc.querySelector(".activity"));

    /* Clearing a rating must not put progress back (1.4.4). */
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = [];
    S.tab = "next"; win.render();
    var hs = doc.querySelector("#view .herorate .stars");
    var heroWas = doc.querySelector("#view .hero h2").textContent;
    hs.querySelectorAll("button")[2].dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    var ratedId = Object.keys(S.rated)[0];
    check("rating from the hero marks it watched", !!S.watched[ratedId]);

    doc.querySelector(".activity .arow .tick")
       .dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("unticking rewinds the hero",
          doc.querySelector("#view .hero h2").textContent === heroWas);
    check("unticking keeps the rating", S.rated[ratedId] === 3, JSON.stringify(S.rated));

    var stars2 = doc.querySelector("#view .herorate .stars");
    stars2.querySelectorAll("button")[2].dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("clearing the rating clears it", S.rated[ratedId] === undefined, JSON.stringify(S.rated));
    check("clearing the rating does not re-mark it watched",
          !S.watched[ratedId], JSON.stringify(Object.keys(S.watched)));
    check("clearing the rating does not log it", S.log.length === 0, S.log.length + " entries");
    S.watched = {}; S.rated = {}; S.log = [];

    /* The legend defines Path badges and now lives on The Path (1.4.1). */
    S.watched = {}; S.rated = {}; S.log = [];
    S.tab = "watch"; S.filter = "all"; S.q = ""; win.render();
    var leg = doc.querySelector("#view .legend");
    check("The Path carries the legend", !!leg);
    check("the legend is the last thing on The Path",
          !!leg && leg === doc.getElementById("view").lastElementChild);
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
          !!leg && ["e", "k", "o", "m", "u", "c", "s"].every(function(k){
            return !!leg.querySelector(".bd." + k);
          }));
    check("the legend badges read the same labels as the rows",
          !!leg && leg.querySelector(".bd.e").textContent === win.BADGE.e &&
                   leg.querySelector(".bd.o").textContent === win.BADGE.o);
    S.tab = "stats"; win.render();
    check("Progress no longer carries the legend", !doc.querySelector("#view .legend"));
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
    check("Home has no Activity block", !doc.querySelector("#view .activity"));
    check("Home has no Recently logged",
          doc.getElementById("view").textContent.indexOf("Recently logged") < 0);

    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = [];
    S.scope = "movies"; S.tab = "home"; win.render();

    /* --- one source for path copy (1.3.9) --- */
    S.path = ""; S.tab = "home"; win.render();
    var cards = doc.querySelectorAll("#view .pick");
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
    var blocks = doc.querySelectorAll("#view .pick.big");
    check("the chooser is three cards", blocks.length === 3);
    check("they sit in a deck", !!doc.querySelector("#view .deck"));
    check("the first card leads", blocks[0].classList.contains("lead"));
    check("only one card leads", doc.querySelectorAll("#view .pick.big.lead").length === 1);
    /* 1.7.2 moved the lead to Bruce's life. By universe is the completist's path
       \u2014 it opens on Alfred in 1960s London, which is correct for the reader who
       chose it and a strange front door for the reader who has not chosen yet. */
    check("the lead is the one life", blocks[0].dataset.path === "life",
          blocks[0].dataset.path);
    check("and it says why", !!doc.querySelector("#view .lead .leadkick"),
          doc.querySelector("#view .leadkick") ? doc.querySelector("#view .leadkick").textContent : "(none)");

    S.path = "continuity"; S.mode = "continuity"; win.render();
    var v = doc.getElementById("view");
    function posOf(sel){ var n = v.querySelector(sel); return n ? Array.prototype.indexOf.call(v.children, n.closest("#view > *")) : -1; }
    /* The master chooser opens every tab (1.5.6). */
    ["home", "next", "watch", "stats"].forEach(function(tab){
      S.tab = tab; win.render();
      var first = doc.getElementById("view").children[0];
      check(tab + " opens with the master chooser",
            !!first && first.className.indexOf("pathseg") >= 0, first && first.className);
      check(tab + " carries the format and scope row",
            !!doc.querySelector("#view .includes"));
      check(tab + " has no lone scope switch left",
            !doc.querySelector("#view > .scope"));
    });
    S.tab = "watch"; win.render();
    doc.querySelector('#view .pathseg button[data-path="release"]')
       .dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("switching path from another tab works", S.path === "release", S.path);
    S.path = "continuity"; S.mode = "continuity"; S.tab = "home"; win.render();

    var iSeg = posOf(".pathseg"), iInc = posOf(".includes"), iHero = posOf(".hero");
    check("the controls come first", iSeg === 0, "pathseg at " + iSeg);
    check("the two control groups are adjacent", iInc === iSeg + 1,
          "pathseg " + iSeg + ", includes " + iInc);
    check("the card comes after what governs it", iHero > iInc,
          "hero " + iHero + ", includes " + iInc);
    check("the chosen path is marked in signal",
          /background:var\(--signal\)/.test(
            (win.document.documentElement.innerHTML.match(
              /\.pathseg button\[aria-pressed="true"\]\{[^}]*\}/) || [""])[0]));

    /* Format badges only where format is ambiguous. */
    S.format = "all"; S.scope = "all"; S.tab = "watch"; S.filter = "all"; win.render();
    /* The legend is made of real badges now, so it lands in any count of them.
       Rows are what this is about; the legend is counted separately, on
       purpose, because "one per row plus two in the key" is the shape and a
       single number could hide either half going wrong. */
    function fmCount(scope){ return doc.querySelectorAll(scope + " .bd.fmlive, " + scope + " .bd.fmanim").length; }
    var fmLegend = fmCount("#view .legend");
    check("All labels every row with its format",
          fmCount("#view") - fmLegend === win.pool().length,
          (fmCount("#view") - fmLegend) + " of " + win.pool().length);
    check("the legend explains them", fmLegend === 2, fmLegend + " format swatches in the key");
    S.format = "anim"; win.render();
    check("one format means no badge on any row",
          fmCount("#view") - fmCount("#view .legend") === 0);
    check("and no legend row for it", fmCount("#view .legend") === 0);
    S.format = "all"; S.tab = "home"; win.render();

    /* --- format is the second axis (1.5.0) --- */
    S.path = "continuity"; S.mode = "continuity"; S.format = "all"; S.scope = "all";
    S.tab = "home"; win.render();
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
    var stats = doc.querySelector("#view .istats");
    check("the intro counts what is in view, not the catalogue",
          !stats || stats.textContent.indexOf("58") < 0,
          stats ? stats.textContent.replace(/\s+/g, " ") : "(no intro)");
    S.tab = "watch"; win.render();

    S.scope = "movies"; win.render();
    check("Movies hides the live-action series too",
          win.pool().every(function(f){ return !f.tv; }));
    S.scope = "all"; win.render();
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
    S.path = "continuity"; S.mode = "continuity"; win.persist();
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
    var qi = doc.querySelector("#view .qitem");
    check("a Then row is tappable", qi.tagName === "BUTTON", qi.tagName);
    check("nothing is revealed until asked", !qi.querySelector(".qpeek"));
    qi.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    var qi2 = doc.querySelector("#view .qitem");
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
    check("tapping again closes it", !doc.querySelector("#view .qitem .qpeek"));
    S.open = {};

    /* --- The Path collapses and remembers (1.3.5) --- */
    S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.groupOpen = {};
    /* Group keys are namespaced per ordering (c0.., e0.., d1960..), so collapse
       state is deliberately per-ordering. Hold mode still or the tab click
       realigns it to the path and the keys legitimately stop matching. */
    S.path = S.mode = "continuity";
    S.tab = "watch"; S.filter = "all"; S.q = ""; win.render();
    var groupsShown = doc.querySelectorAll("#view .group").length;
    check("The Path renders groups", groupsShown > 1, groupsShown + " groups");
    check("groups start expanded",
          doc.querySelectorAll("#view .group.open").length === groupsShown);
    var allBtn = doc.querySelector('[data-act="allgroups"]');
    check("the collapse control is present", !!allBtn);
    check("it offers to collapse while things are open",
          !!allBtn && allBtn.textContent === "Collapse all", allBtn && allBtn.textContent);

    allBtn.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("collapse all closes every group",
          doc.querySelectorAll("#view .group.open").length === 0,
          doc.querySelectorAll("#view .group.open").length + " still open");
    check("the control flips to expand",
          doc.querySelector('[data-act="allgroups"]').textContent === "Expand all",
          doc.querySelector('[data-act="allgroups"]').textContent);
    check("a collapsed group reports aria-expanded=false",
          doc.querySelector("#view .ghead").getAttribute("aria-expanded") === "false");

    /* Persistence: the whole reason the state stopped being session-only. */
    var savedRaw = win.localStorage.getItem("batwatch-v3") || "";
    check("collapse state reached storage",
          !!savedRaw && JSON.parse(savedRaw).groupOpen &&
          Object.keys(JSON.parse(savedRaw).groupOpen).length > 0,
          savedRaw ? "groupOpen=" + JSON.stringify(JSON.parse(savedRaw).groupOpen).slice(0,40) : "(nothing saved)");

    doc.querySelector('[data-act="allgroups"]').dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("expand all reopens every group",
          doc.querySelectorAll("#view .group.open").length === groupsShown);

    /* revealHero must not undo a deliberate collapse-all. */
    doc.querySelector('[data-act="allgroups"]').dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    S.tab = "home"; win.render();
    doc.querySelector('#tabs button[data-tab="watch"]')
       .dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
    check("returning to The Path leaves a deliberate collapse-all alone",
          doc.querySelectorAll("#view .group.open").length === 0,
          doc.querySelectorAll("#view .group.open").length + " reopened");

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
    check("Progress still shows the donuts and backup tools",
          !!doc.querySelector("#view .pies") && !!doc.querySelector('[data-act="mkcode"]'));
    S.tab = "watch"; S.filter = "all"; win.render();
    check("The Path still carries the rating",
          doc.getElementById("view").textContent.indexOf("\u2605\u2605\u2605\u2605\u2605") >= 0);
    S.watched = {}; S.rated = {}; S.tab = "home"; win.render();

    /* --- the watch link is a Brave search (1.3.2) --- */
    check("the link is a Brave search",
          win.watchUrl("Batman").indexOf("https://search.brave.com/search?q=") === 0,
          win.watchUrl("Batman"));
    check("the query leads with \"where to watch\"",
          win.watchUrl("Batman").indexOf("where%20to%20watch%20Batman") > 0);
    check("no country path can appear", !/\/(us|uy|uk|gb|br|de)\//.test(win.watchUrl("Batman")));
    /* A real title carries its year; an unknown one degrades to no year rather
       than to the string "undefined" (1.3.7). */
    var tvShow = win.FILMS.filter(function(f){ return f.tv; })[0];
    check("a real title carries its year",
          decodeURIComponent(win.watchUrl(tvShow.t)).indexOf(" " + win.titleYear(tvShow.t)) > 0,
          decodeURIComponent(win.watchUrl(tvShow.t)));
    check("every season of a show asks the same question",
          win.FILMS.filter(function(f){ return f.t === tvShow.t; })
                   .every(function(f){ return win.watchUrl(f.t) === win.watchUrl(tvShow.t); }));
    /* "Batman" was the title used here until 1.6.6 — and it is in the catalogue
       twice, so titleYear() returned 1966 and the no-year branch this check is
       named after never ran once. Remove the guard from watchUrl() and the old
       version still passed. */
    check("a title the catalogue has never heard of degrades cleanly",
          win.titleYear("Zorro") === undefined &&
          win.watchUrl("Zorro").indexOf("undefined") < 0, win.watchUrl("Zorro"));
    check("every rendered link comes from the builder", (function(){
      S.tab = "next"; win.render();
      var a = doc.querySelector("#view .linkrow .lnk");
      return !!a && a.href.indexOf("search.brave.com") > 0;
    })());
    check("the link renders in an expanded row too", (function(){
      S.tab = "watch"; win.render();
      var r = doc.querySelector('#view [data-act="expand"]');
      if(r) r.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
      var a = doc.querySelector("#view .fdetail .linkrow .lnk");
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
    S.scope = S.scopePref = "movies"; win.persist();
    win.location.hash = "#universes-series";
    win.dispatchEvent(new win.Event("hashchange"));
    check("a scope token changes the view", S.scope === "all", "scope=" + S.scope);
    check("a scope token leaves the preference alone", S.scopePref === "movies",
          "scopePref=" + S.scopePref);
    win.persist();
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
      var empty = doc.querySelector("#view .empty");
      check("a search with no live-action match shows the empty state", !!empty);
      var offer = doc.querySelector('#view [data-act="searchall"]');
      check("and does not offer to find series the format filter would hide", !offer,
            offer ? empty.textContent : "");
      S.format = f0; S.scope = s0; S.q = q0; S.tab = t0; win.render();
    })();

    /* --- one number per universe, on both screens (1.7.5) --- */
    (function(){
      S.tab = "home"; S.mode = "continuity"; win.render();
      var home = {};
      Array.prototype.forEach.call(doc.querySelectorAll("#view .ucard"), function(c){
        home[c.querySelector(".uname").textContent] = c.querySelector(".unum").textContent;
      });
      S.tab = "watch"; win.render();
      var seen = 0, wrong = [];
      Array.prototype.forEach.call(doc.querySelectorAll("#view .ghead"), function(h){
        var name = h.querySelector(".gtitle").textContent;
        var num  = h.querySelector(".gnum").textContent;
        if(home[name] === undefined) return;
        seen++;
        if(home[name] !== num) wrong.push(name + ": home " + home[name] + ", path " + num);
      });
      check("home and the path number a universe the same way",
            seen > 20 && !wrong.length, wrong.slice(0, 3).join(" / ") || (seen + " compared"));
      S.tab = "home"; win.render();
    })();

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

    /* Absoluteness is asserted above, on a real code. What this line adds is
       that a code with nothing in it still produces a usable link rather than a
       bare hash — the state a reader is in before they have ticked anything. */
    check("even an empty code makes a whole link",
          /^https:\/\/[^#]+#nw=NW1WSR$/.test(win.restoreLink("NW1WSR")),
          win.restoreLink("NW1WSR"));

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
    /* Home only. This looped ["home","next"] until 1.6.6, but a completed Next
       up renders .empty .big, not .hero h2 — so half the loop asserted over an
       empty set and read as coverage. The Case-closed card is checked on its
       own terms below. */
    var sized = 0;
    S.tab = "home"; win.render();
    Array.prototype.forEach.call(win.document.querySelectorAll("#view .hero h2"), function(el){
      if(/font-size/.test(el.getAttribute("style") || "")) sized++;
    });
    check("the completed-catalogue hero on Home is unsized too", sized === 0, sized + " sized");
    S.tab = "next"; win.render();
    var closed = win.document.querySelector("#view .empty .big");
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
    /* Every call site passed a label and reboot() ignored it, so five useful
       names went nowhere and a failure inside a rebooted document did not say
       which reload it came from. It says now. */
    function reboot(seed, label, then){
      var d = new jsdom.JSDOM(html, {runScripts:"dangerously", url:"https://6ummy-dev.github.io/Night-Watcher/",
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
    win.persist();
    reboot(win.localStorage.getItem("batwatch-v3"), "collapse", function(w3, d3){
      w3.S.tab = "watch"; w3.render();
      check("a reload comes back collapsed",
            d3.querySelectorAll("#view .group").length > 1 &&
            d3.querySelectorAll("#view .group.open").length === 0,
            d3.querySelectorAll("#view .group.open").length + " of " +
            d3.querySelectorAll("#view .group").length + " open");
    });
    S.groupOpen = {};

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
        check("the migrated path renders the control", !!d3.querySelector(".pathseg"));

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
      var banner = doc.querySelector("#view .viewing");
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
      check("the banner is gone once it is answered", !doc.querySelector("#view .viewing"));

      /* Declining leaves everything alone. */
      S.path = ""; S.mode = "continuity"; S.watched = {}; S.log = []; S.rated = {};
      S.pending = win.importCode(code); S.tab = "home"; win.render();
      var drop = doc.querySelector('#view .viewing [data-act="droplink"]');
      check("the banner offers to decline", !!drop);
      if(drop) drop.dispatchEvent(new win.MouseEvent("click", {bubbles:true}));
      check("declining leaves the device untouched",
            !S.path && Object.keys(S.watched).length === 0);
      S.pending = null; S.path = S.mode = "continuity"; win.render();
    })();

    /* --- every CSS rule matches something, somewhere ---------------------
       Two releases running left a rule behind after the markup it styled was
       removed \u2014 .arow .aopen in 1.6.2, .arow .atop in 1.6.3 \u2014 and both were
       found by a script run by hand. This is not a layout question, which is
       why it does not need a real browser: it asks whether a selector ever
       matches, and querySelector works here perfectly. It rides along on the
       states this suite already drives. */
    (function(){
      var css = html.match(/<style>([\s\S]*?)<\/style>/g).join("\n")
                    .replace(/\/\*[\s\S]*?\*\//g, "");
      var rules = css.match(/[^{}]+\{[^}]*\}/g) || [];
      var sels = [];
      rules.forEach(function(r){
        var sel = r.slice(0, r.indexOf("{")).replace(/\s+/g, " ").trim();
        if(sel.charAt(0) === "@" || !sel) return;
        sels.push(sel);
      });
      var matched = Object.create(null);
      function sweep(){
        sels.forEach(function(sel){
          if(matched[sel]) return;
          var probe = sel.split(",").map(function(one){
            return one
              .replace(/::?(before|after|placeholder|selection|marker|backdrop|-webkit-[a-z-]+)/g, "")
              .replace(/:(hover|active|focus-visible|focus|disabled|checked|first-of-type|last-of-type|last-child|first-child)/g, "")
              .trim();
          }).filter(Boolean).join(",");
          if(!probe){ matched[sel] = 1; return; }
          try{ if(doc.querySelector(probe)) matched[sel] = 1; }
          catch(e){ matched[sel] = 1; }
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
      FILMS.forEach(function(f){ S.open[f.id] = true; });
      ["next", "watch"].forEach(function(t){ S.tab = t; win.render(); sweep(); });
      ["left", "done", "ess", "core", "opt"].forEach(function(f){
        S.tab = "watch"; S.filter = f; win.render(); sweep();
      });
      S.filter = "all"; S.q = "zzzznomatch"; win.render(); sweep();
      S.q = ""; S.tab = "stats"; S.code = win.exportCode(); win.render(); sweep();
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

      var dead = sels.filter(function(sel){ return !matched[sel]; });
      check("every CSS rule matches something in some state",
            dead.length === 0, dead.join("  |  "));
      S.watched = {}; S.skipped = {}; S.rated = {}; S.log = []; S.open = {};
      S.tab = "home"; S.path = S.mode = "continuity"; win.render();
    })();

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
