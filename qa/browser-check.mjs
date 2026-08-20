/* Browser check. NOT part of npm test — jsdom has no layout, so the things
   below cannot be observed by the harness at all: the header at 0% and 100%,
   jumping to a group with content-visibility on, a group opening and closing,
   the Where to watch URL a reader actually taps — and, since 3.2.0, accessibility
   in a STATE rather than on a cold load.

   Run against a served copy of docs/ at 390x844 (iPhone 12/13/14 logical size).
   Not part of npm test — jsdom cannot see any of this — but it IS in CI: the
   browser job in qa.yml has run it on every push since 3.7.2. This header
   claimed "not committed to CI" for four minor releases after that (H-2 of
   the 19 Aug audit) — a comment about what watches the tree, wrong about
   what watches the tree, in the file being watched.

   3.2.0 FIXED WHAT THIS FILE COULD NOT SAY ABOUT ITSELF. It imported playwright
   while package.json declared only jsdom and wrangler, and it launched a
   hard-coded /opt/pw-browsers/chromium-1194/… path — so it ran on whatever
   happened to be installed, at one pinned build number, and would have failed
   or, worse, silently not run anywhere else. Adding an accessibility pass to a
   script that cannot declare how to start is how a guard comes to pass because
   it never executed. Both dependencies are declared now, and the executable is
   resolved by Playwright with an env override kept for sandboxes that place it
   somewhere unusual. */
import { chromium, webkit } from "playwright";
import { createRequire } from "node:module";
import fs from "node:fs";

const URL = process.env.NW_URL || "http://127.0.0.1:8099/";
/* axe-core, read from the declared devDependency rather than fetched. */
const axeSrc = fs.readFileSync(
  createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
/* Playwright resolves its own browser. NW_CHROME is the escape hatch, not the
   default — a pinned path IS the bug this replaced. */
const EXE = process.env.NW_CHROME || undefined;
/* 4.4.0: the WebKit CI job. iOS is where the clip-path ornaments actually
   ship, and the deco pass multiplied the clip sites (CTA, lead pick) — the
   standing note from the 4.3.x audits is now load-bearing. NW_ENGINE=webkit
   runs this same file on WebKit; the default stays Chromium, and NW_CHROME
   (an executablePath escape hatch) applies to Chromium only. */
const WK = process.env.NW_ENGINE === "webkit";
const out = [];
let bad = 0;
function ok(name, pass, detail){
  out.push((pass ? "  ok   " : "  FAIL ") + name + (detail ? "  — " + detail : ""));
  if(!pass) bad++;
}

const browser = WK ? await webkit.launch()
  : await chromium.launch(
  EXE ? { executablePath: EXE, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 },
                                     deviceScaleFactor: 3 });
/* THE PAGE'S OWN CSP REFUSES addScriptTag, AND THAT IS THE POLICY WORKING.
   script-src is one sha256 hash and, since 3.2.0, nothing else at all — so
   injecting a <script> element the ordinary way is blocked exactly as an
   attacker's would be. addInitScript runs before the document's scripts, over
   the debugger protocol rather than as page content, so it is not page content
   for CSP to have an opinion about. Recorded because the failure message
   ("Refused to execute inline script") reads like a broken harness and is in
   fact the strongest evidence in this repository that the policy is real. */
await page.addInitScript({ content: axeSrc });

/* 3.3.0. THIS FILE MEASURED GEOMETRY AND NEVER READ THE CONSOLE, so a CSP
   violation — the one failure mode a policy tightening actually has — would
   have gone past 36 green checks without a word. connect-src went to 'none'
   in 3.3.0 on the strength of this listener, not on the strength of an
   argument. Collected from here and asserted at the end, so a violation in any
   state below is caught rather than only one on load. */
const cspHits = [], pageErrs = [];
page.on("console", m => {
  const t = m.text();
  if(/Content Security Policy|Refused to (connect|load|execute)/i.test(t)) cspHits.push(t);
});
page.on("pageerror", e => pageErrs.push(String(e)));
await page.goto(URL, { waitUntil: "load" });
await page.waitForFunction(() => typeof window.render === "function");

/* Start clean and choose a path, so nothing below meets the first-run chooser. */
await page.evaluate(() => {
  localStorage.clear();
  S.path = S.mode = "continuity"; S.watched = {}; S.skipped = {}; S.rated = {};
  S.log = []; S.open = {}; S.peek = {}; S.tab = "watch"; S.filter = "all"; S.q = "";
  setAllGroups(true); render(); snapTo(S.tab);
  /* snapTo: setting S.tab directly leaves the deck parked where it was, a
     state no real door produces — goTab and the hash handlers all snap. The
     app self-corrects it (swipeRead reads the deck as truth), and WHEN that
     correction fires moved between Chromium builds: rev 1234 fired it before
     the content-visibility read below and flipped the app back to Home, which
     has no .group to read. Align the deck like every real door does. */
});

/* ---- the header at 0% ------------------------------------------------- */
const head0 = await page.evaluate(() => {
  const bat = document.querySelector(".mark svg").getBoundingClientRect();
  /* an inert check-shaped line stood here until 3.7.2 (I-5 of the 10 Aug
     review): `…getBBox ? null : null` — always null, never read. */
  const ring = document.querySelector("#ringArc").getBoundingClientRect();
  const wm = document.querySelector(".wordmark h1").getBoundingClientRect();
  return { pct: document.getElementById("ringPct").textContent,
           aria: document.getElementById("ringBtn").getAttribute("aria-label"),
           batBox: bat.width, ringInk: ring.width, wmTop: wm.top,
           offset: document.getElementById("ringArc").getAttribute("stroke-dashoffset"),
           r: document.getElementById("ringArc").getAttribute("r"),
           wraps: document.querySelector(".wordmark h1").getClientRects().length };
});
ok("header at 0%: the ring reads 0%", head0.pct === "0%", head0.pct);
ok("header at 0%: the accessible name carries the number",
   (head0.aria || "").indexOf("0%") === 0, head0.aria);
/* 4.2.3, Q-9 of the 19 Aug audit: the retracted offset was hardcoded 109.96
   while guard 80 computes 2πr from the served markup — one radius edit and
   this file would have failed a correct page. Same arithmetic now, same
   source: the r the page actually ships. */
ok("header at 0%: the arc is fully retracted",
   Math.abs(parseFloat(head0.offset) - 2 * Math.PI * parseFloat(head0.r)) < 0.05,
   head0.offset + " vs 2π·" + head0.r);
ok("header at 0%: the ring's ink is narrower than the bat's box",
   head0.ringInk < head0.batBox, head0.ringInk.toFixed(2) + " vs " + head0.batBox.toFixed(2));
ok("header at 0%: the wordmark holds one line at 390px",
   head0.wraps === 1, head0.wraps + " line box(es)");

/* the glyph's own drawn width, from the browser rather than from arithmetic */
const drawn = await page.evaluate(() => {
  const svg = document.querySelector(".mark svg");
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  svg.querySelectorAll("path, ellipse, circle, rect").forEach(el => {
    const b = el.getBBox();
    x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.width);
    y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y + b.height);
  });
  const vb = svg.viewBox.baseVal;
  const scale = svg.getBoundingClientRect().width / vb.width;
  const arc = document.getElementById("ringArc");
  const r = parseFloat(arc.getAttribute("r"));
  const sw = parseFloat(arc.getAttribute("stroke-width"));
  return { bat: (x1 - x0) * scale, tall: (y1 - y0) * scale, ring: 2 * (r + sw / 2) };
});
ok("header: the ring draws strictly under the bat's glyph",
   drawn.ring < drawn.bat,
   "ring " + drawn.ring.toFixed(2) + "px, bat " + drawn.bat.toFixed(2) + "×" +
   drawn.tall.toFixed(2) + "px");

/* ---- the header at 100% ------------------------------------------------ */
await page.evaluate(() => {
  pool().forEach(f => { S.watched[f.id] = 1; });
  render();
});
const head100 = await page.evaluate(() => {
  const pct = document.getElementById("ringPct");
  /* The <b> fills its flank, so its box is 46px and says nothing. What has to
     fit is the text run — the same thing guard 80 computes from the font size. */
  const rng = document.createRange();
  rng.selectNodeContents(pct);
  const r = rng.getBoundingClientRect();
  const ringBox = document.querySelector(".ring svg").getBoundingClientRect();
  const arc = document.getElementById("ringArc");
  const rr = parseFloat(arc.getAttribute("r"));
  const sw = parseFloat(arc.getAttribute("stroke-width"));
  const scale = ringBox.width / 46;
  const inner = (rr - sw / 2) * scale;
  const h = r.height;
  const chord = inner > h / 2 ? 2 * Math.sqrt(inner * inner - (h / 2) * (h / 2)) : 0;
  return { text: pct.textContent, offset: arc.getAttribute("stroke-dashoffset"),
           aria: document.getElementById("ringBtn").getAttribute("aria-label"),
           labelW: r.width, labelH: h, chord: chord,
           subWraps: document.getElementById("hsub").getClientRects().length,
           bar: document.querySelector('meta[name="theme-color"]').content };
});
ok("header at 100%: the ring reads 100%", head100.text === "100%", head100.text);
ok("header at 100%: the arc is fully drawn",
   parseFloat(head100.offset) === 0, head100.offset);
ok("header at 100%: the accessible name agrees with the visible number",
   (head100.aria || "").indexOf("100%") === 0, head100.aria);
ok('header at 100%: "100%" fits inside the ring',
   head100.labelW < head100.chord,
   head100.labelW.toFixed(2) + "px of text in a " + head100.chord.toFixed(2) +
   "px chord at the label's own " + head100.labelH.toFixed(2) + "px height");
ok("header at 100%: the subtitle holds one line at 390px",
   head100.subWraps === 1, head100.subWraps + " line box(es)");

/* ---- content-visibility is actually on ---------------------------------- */
/* Two frames first: render() and the idle neighbor fills both hold .settling
   (content-visibility:visible) until the frame after their scroll restore,
   so a read that lands inside that frame reports the override, not the
   resting state. The override IS the mechanism (section 122); the resting
   state is what this check is about. */
await page.evaluate(() => new Promise(r =>
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50)))));
/* 4.2.3, Q-4 of the 19 Aug audit: this wait was `.catch(() => {})` — a
   timeout fell through silently and the CV read below reported on a deck
   that had never settled. A swallowed wait is a check that cannot say why
   it failed; it says now. */
const cvSettled = await page.waitForFunction(
  () => document.querySelector("#view .panel:not([inert]) .group"),
  null, { timeout: 5000 }).then(() => true, () => false);
ok("the group list settles before the content-visibility read",
   cvSettled, cvSettled ? "settled" :
   "no .group within 5s — the CV state below is a deck that never settled");
const cv = await page.evaluate(() => {
  const g = document.querySelector("#view .panel:not([inert]) .group");
  /* Crashed here as a raw TypeError on Chromium rev 1234 while every build
     before it passed — a null read is a real finding about the deck's state,
     so it fails as a check that says what the state was, not as a stack. */
  if(!g) return { missing: true, tab: S.tab,
                  sl: document.getElementById("view").scrollLeft,
                  panels: Array.prototype.map.call(
                    document.querySelectorAll("#view .panel"),
                    p => p.id + (p.hasAttribute("inert") ? "[inert]" : "")) };
  return { cv: getComputedStyle(g).contentVisibility,
           cis: getComputedStyle(g).containIntrinsicSize,
           groups: document.querySelectorAll("#view .panel:not([inert]) .group").length };
});
ok("content-visibility is on .group", !cv.missing && cv.cv === "auto",
   cv.missing ? "no .group in a non-inert panel — " + JSON.stringify(cv)
              : cv.cv + " / " + cv.cis);

/* ---- jumping to a group, from all seven ways in ------------------------- */
/* 3.3.2 REWROTE WHAT "IN VIEW" MEANS HERE, BECAUSE THE OLD PHRASING WAS WIDE
   ENOUGH FOR THE BROKEN STATE TO SIT INSIDE IT. Until 3.3.1 the middle
   assertion read `top > -2 && top < 844` — 844 is the whole viewport height,
   so a jump that never scrolled at all passed as long as the target happened
   to fall inside the first fold. It did: the donut's group sits about 434px
   down the document, so every one of these four drives was green while the
   page did not move. A reader found it from Home, where the target sits far
   enough down that the same broken jump would have gone red.

   Three assertions replace it, and none can be satisfied by doing nothing:
   the page MOVED, it moved IN THE SAME TASK as the click, and the head parked
   where a landing actually parks it — clamped at the sticky wrapper's own
   offset, read from the page rather than assumed.

   THE SAME-TASK ONE IS THE LOAD-BEARING ONE, and it took a failed negative
   test to find that out. Serving this tree with `behavior:"smooth"` restored
   left every settled assertion GREEN: headless Chromium animates 0 → 435 in
   about 360ms and lands exactly, because a local copy under a headless
   renderer does not reproduce the content-visibility race that made the same
   code land at 0 on the live origin. An assertion read 700ms later cannot
   tell the two apart. Read in the click's own task it can: instant is already
   at 435, smooth is still at 0. A jump is a navigation, so arriving next
   frame is the assertion, not arriving eventually.

   The drives return the scroll offset from inside the click's task for that
   reason, rather than the key alone.

   Home's universe grid joins the drives below; it was never one of the four,
   which is why the one entry point nothing drove is the one a person had to
   find.

   3.9.7: scroll lives on #app, not the document, so every drive here reads
   and writes through the app's own seam — scrollKeep()/scrollPut() — and
   measures #app's scrollHeight. window.scrollY is pinned at 0 now and a
   drive that read it would be green against anything, which is the exact
   shape of blindness this file exists to end. */
async function jump(clickFn, label, tab, mode){
  await page.evaluate((o) => {
    S.tab = o.t; if(o.m) S.mode = o.m;
    S.progOpen = {uni:true, era:true, dec:true}; render(); snapTo(S.tab); scrollPut(0);
  }, {t: tab || "stats", m: mode || ""});
  const before = await page.evaluate(() => scrollKeep());
  const fired = await page.evaluate(clickFn);
  const gk = fired && fired.gk;
  if(!gk){ ok("jump from " + label, false, "found nothing to click"); return; }
  /* 4.4.0, the parked rider, landed: this was waitForTimeout(700) — a bet
     that every smooth scroll finishes inside 700ms on every runner. Settled
     scroll is observable, so it is observed: the position is read across two
     frames until it stops moving, capped at 2s so a wedged scroll fails the
     landing assertions below instead of hanging the file. */
  await page.evaluate(() => new Promise((res) => {
    const t0 = performance.now();
    let last = scrollKeep(), still = 0;
    (function loop(){
      requestAnimationFrame(() => {
        const now = scrollKeep();
        still = (now === last) ? still + 1 : 0;
        last = now;
        const t = performance.now() - t0;
        /* 18 stable frames (~300ms) with a 300ms floor: a smooth scroll has
           not begun in its first frames, and a settle that reads two equal
           positions there would resolve before the ride starts. */
        if((still >= 18 && t >= 300) || t > 2000) return res();
        loop();
      });
    })();
  }));
  const landed = await page.evaluate((k) => {
    const h = document.querySelector('.ghead[data-gk="' + k + '"]');
    if(!h) return { ok: false, why: "the target group did not render" };
    const r = h.getBoundingClientRect();
    const grp = h.closest(".group");
    /* The head lives inside a position:sticky wrapper, so its own rect is
       clamped and cannot answer "how far away was this". The group is static
       and can. */
    const wrap = h.closest(".ghwrap") || h;
    const a = scroller();
    /* 4.0.0: the scrollport's top edge is the panel's, below the header, and
       every sticky offset is panel-relative — so the landing is measured from
       the panel's own top, not the viewport's. */
    const paneTop = a.getBoundingClientRect().top;
    return { ok: true, tab: S.tab, open: grp.classList.contains("open"),
             top: r.top - paneTop, height: r.height, scrollY: scrollKeep(),
             groupDocTop: grp.getBoundingClientRect().top - paneTop + scrollKeep(),
             stick: parseFloat(getComputedStyle(wrap).top) || 0,
             atEnd: a.scrollTop + a.clientHeight >= a.scrollHeight - 2,
             cv: getComputedStyle(grp).contentVisibility,
             onlyOpen: document.querySelectorAll("#view .panel:not([inert]) .group.open").length };
  }, gk);
  ok("jump from " + label + " lands on the right group",
     landed.ok && landed.tab === "watch" && landed.open && landed.onlyOpen === 1,
     JSON.stringify(landed));
  /* Nothing to travel is the only excuse for not travelling. */
  ok("jump from " + label + " moves the page",
     landed.ok && (landed.groupDocTop <= landed.stick + 2 || landed.scrollY > before),
     landed.ok ? "scroll " + before + " → " + landed.scrollY +
                 ", group " + landed.groupDocTop.toFixed(1) + "px down the document" : "-");
  /* The one an animated scroll cannot pass. `fired.y` is read in the same task
     as the click, so an instant scrollIntoView is already applied and an
     animated one has not started. */
  ok("jump from " + label + " lands in the click's own task, not over one",
     landed.ok && (landed.groupDocTop <= landed.stick + 2 ||
                   Math.abs(fired.y - landed.scrollY) <= 2),
     landed.ok ? "same-task " + fired.y + ", settled " + landed.scrollY : "-");
  /* A landing clamps at the sticky offset — 70px, which record-3.0.0.md saw
     and never pinned. The end of the document is the one place it cannot. */
  ok("jump from " + label + " parks the head under the sticky header",
     landed.ok && landed.top > -2 && (landed.top < landed.stick + 24 || landed.atEnd),
     landed.ok ? "top " + landed.top.toFixed(1) + "px against a " + landed.stick +
                 "px sticky offset" + (landed.atEnd ? ", document at its end" : "") : "-");
  ok("jump from " + label + ": the landed group is not skipped by content-visibility",
     landed.ok && landed.cv === "auto" && landed.height > 0,
     landed.ok ? landed.cv + ", head " + landed.height.toFixed(1) + "px" : "-");
}

/* 3.8.1: Progress draws ONE chart, the belt's — so each chart drive sets the
   mode it expects before looking for its bars. 3.8.2: the donut became the
   skyline; the bars are real buttons on data-act="jump", clicked directly. */
await jump(() => {
  const g = document.querySelector('#view .panel:not([inert]) .pies .seg[data-gk^="c"]');
  if(!g) return null;
  const k = g.getAttribute("data-gk");
  g.click();
  return { gk: k, y: scrollKeep() };
}, "the universes chart", "stats", "continuity");
await jump(() => {
  const g = document.querySelector('#view .panel:not([inert]) .pies .seg[data-gk^="e"]');
  if(!g) return null;
  const k = g.getAttribute("data-gk");
  g.click();
  return { gk: k, y: scrollKeep() };
}, "the eras chart", "stats", "life");
await jump(() => {
  const g = document.querySelector('#view .panel:not([inert]) .pies .seg[data-gk^="d"]');
  if(!g) return null;
  const k = g.getAttribute("data-gk");
  g.click();
  return { gk: k, y: scrollKeep() };
}, "the decades chart", "stats", "release");
await jump(() => {
  const bs = [...document.querySelectorAll('#view .panel:not([inert]) [data-act="jump"][data-gk^="c"]')]
    .filter(b => !b.closest(".pies"));
  if(!bs.length) return null; const k = bs[0].dataset.gk; bs[0].click();
  return { gk: k, y: scrollKeep() };
}, "the universes fold");
await jump(() => {
  const bs = [...document.querySelectorAll('#view .panel:not([inert]) [data-act="jump"][data-gk^="e"]')]
    .filter(b => !b.closest(".pies"));
  if(!bs.length) return null; const k = bs[0].dataset.gk; bs[0].click();
  return { gk: k, y: scrollKeep() };
}, "the eras fold");
await jump(() => {
  const bs = [...document.querySelectorAll('#view .panel:not([inert]) [data-act="jump"][data-gk^="d"]')]
    .filter(b => !b.closest(".pies"));
  if(!bs.length) return null; const k = bs[0].dataset.gk; bs[0].click();
  return { gk: k, y: scrollKeep() };
}, "the decades fold");
/* The fifth way in at 3.3.2, and the one that had never been driven. */
await jump(() => {
  const c = document.querySelector('#view .panel:not([inert]) .ucard[data-act="jump"]');
  if(!c) return null; const k = c.dataset.gk; c.click();
  return { gk: k, y: scrollKeep() };
}, "Home's universe grid", "home");

/* ---- a group opens and closes, and the rows really disappear ------------ */
await page.evaluate(() => {
  S.tab = "watch"; S.mode = "continuity"; S.filter = "all"; S.q = "";
  setAllGroups(true); render(); snapTo(S.tab); scrollPut(0);
});
const grp = await page.evaluate(() => {
  const h = document.querySelector("#view .panel:not([inert]) .ghead");
  const body = h.closest(".group").querySelector(".gbody");
  return { gk: h.dataset.gk, open: h.getAttribute("aria-expanded"),
           bodyShown: getComputedStyle(body).display };
});
ok("a group starts open", grp.open === "true" && grp.bodyShown === "block",
   grp.open + " / " + grp.bodyShown);
await page.click("#view .panel:not([inert]) .ghead");
await page.waitForTimeout(120);
const closed = await page.evaluate(() => {
  const h = document.querySelector("#view .panel:not([inert]) .ghead");
  const g = h.closest(".group");
  return { aria: h.getAttribute("aria-expanded"), cls: g.className,
           body: getComputedStyle(g.querySelector(".gbody")).display,
           allBtn: document.querySelector(".allbtn").textContent,
           height: g.getBoundingClientRect().height };
});
ok("closing a group hides its rows",
   closed.aria === "false" && closed.cls === "group" && closed.body === "none",
   JSON.stringify(closed));
await page.click("#view .panel:not([inert]) .ghead");
await page.waitForTimeout(120);
const reopened = await page.evaluate(() => {
  const h = document.querySelector("#view .panel:not([inert]) .ghead");
  const g = h.closest(".group");
  return { aria: h.getAttribute("aria-expanded"), cls: g.className,
           body: getComputedStyle(g.querySelector(".gbody")).display,
           rows: g.querySelectorAll(".film").length };
});
ok("re-opening a group brings its rows back",
   reopened.aria === "true" && reopened.cls === "group open" &&
   reopened.body === "block" && reopened.rows > 0, JSON.stringify(reopened));

/* ---- the whole point of Stage 2: one tap on The Batman (2022) ----------- */
const link = await page.evaluate(() => {
  S.tab = "watch"; S.mode = "continuity"; S.filter = "all";
  S.q = "The Batman"; setAllGroups(true); render(); snapTo(S.tab);
  const f = FILMS.filter(x => x.t === "The Batman" && x.y === 2022)[0];
  if(!f) return { err: "The Batman (2022) is not in the catalogue" };
  S.open = {}; S.open[f.id] = true; render();
  const a = document.querySelector('.film.open .linkrow a.lnk');
  return { id: f.id, href: a ? a.href : null, text: a ? a.textContent.trim() : null,
           rel: a ? a.getAttribute("rel") : null, target: a ? a.getAttribute("target") : null };
});
ok("Where to watch renders on The Batman (2022)", !!link.href, JSON.stringify(link));
if(link.href){
  const q = decodeURIComponent(link.href);
  ok("its URL searches 2022", q.indexOf("where to watch The Batman 2022") > 0, q);
  ok("it does NOT search 2004", q.indexOf("2004") < 0, q);
  ok("it opens safely", link.target === "_blank" && /noopener/.test(link.rel || "") &&
     /noreferrer/.test(link.rel || ""), link.target + " " + link.rel);
}

/* ---- 3.1.0: the watch link's edges, which only a browser can see -------
   Section 119 asserts that the two rules DECLARE the same min-height and the
   same corner, and that the hero pill fills its column. It cannot assert what
   the boxes actually do, and that is the half that was wrong for eleven
   releases: NOTES.md said the link "shares Skip's edges", nothing checked it,
   and it was false in the file the whole time. A comment asserting a
   relationship is how that survives. This is the check that catches it, in the
   one harness with layout.

   It also caught the mock. The v2 mock measured the hero pill's right edge 8.0px
   short of Skip's; in the real page it was 0.0px, because the pill overflowed
   its column's 38% basis and min-width:auto widened the column to match — the
   edges agreed BY ACCIDENT OF LABEL WIDTH, and would have parted the first time
   the label or the font changed. flex:1 makes the agreement structural, which
   is the fix either way. Measure the thing that runs, not a proxy for it. */
const edges = await page.evaluate(() => {
  localStorage.clear();
  S.path = S.mode = "continuity"; S.watched = {}; S.skipped = {}; S.rated = {};
  S.log = []; S.open = {}; S.peek = {}; S.tab = "next"; S.filter = "all"; S.q = "";
  render(); snapTo(S.tab);
  const lnk  = document.querySelector(".herorow .lnk");
  const skip = document.querySelector(".heroacts .no");
  if(!lnk || !skip) return { err: "the hero link or Skip is not rendered" };
  const a = lnk.getBoundingClientRect(), s = skip.getBoundingClientRect();
  const ca = getComputedStyle(lnk), cs = getComputedStyle(skip);
  return { right: +(a.right - s.right).toFixed(1), height: +(a.height - s.height).toFixed(1),
           radius: [ca.borderTopLeftRadius, cs.borderTopLeftRadius],
           fits: lnk.scrollWidth <= Math.ceil(lnk.clientWidth),
           fill: ca.backgroundColor, label: ca.color, edge: ca.borderTopColor };
});
ok("hero: the watch link's right edge is Skip's", edges.right === 0, edges.right + "px");
ok("hero: the watch link stands as tall as Skip", edges.height === 0, edges.height + "px");
ok("hero: the watch link turns the same corner as Skip",
   !!edges.radius && edges.radius[0] === edges.radius[1], (edges.radius || []).join(" vs "));
ok("hero: the 9px label still fits its column", edges.fits === true, "no wrap, no clip");
ok("hero: the watch link is filled, lit, and read in bone",
   edges.fill !== "rgba(0, 0, 0, 0)" && edges.label !== edges.edge,
   edges.fill + " · label " + edges.label + " · edge " + edges.edge);

const detail = await page.evaluate(() => {
  S.tab = "watch"; S.q = ""; setAllGroups(true); render(); snapTo(S.tab);
  const f = document.querySelector(".film");
  const id = f.getAttribute("data-id") ||
            (f.querySelector("[data-id]") || {}).getAttribute?.("data-id");
  S.open = {}; S.open[id] = true; render();
  const open = document.querySelector(".film.open");
  if(!open) return { err: "no row opened" };
  const lnk = open.querySelector(".lnk"), act = open.querySelector(".act"),
        para = open.querySelector(".fdetail p");
  if(!lnk || !act || !para) return { err: "the expanded row is missing a control" };
  const a = lnk.getBoundingClientRect(), m = act.getBoundingClientRect(),
        d = para.getBoundingClientRect();
  return { vsAct: +(a.left - m.left).toFixed(1), vsPara: +(a.left - d.left).toFixed(1) };
});
ok("expanded row: the watch link sits on Mark watched's line", detail.vsAct === 0,
   detail.vsAct + "px");
ok("expanded row: and on the description's line", detail.vsPara === 0,
   detail.vsPara + "px");

/* ---- the tick, which this file had never clicked ---------------------- */
/* 3.4.0. Every drive above sets S.watched directly and calls render(), or
   drives a jump. Nothing here had ever pressed a tick, which is why five green
   drives said nothing about either defect this release fixes: a scroll restore
   that clamped against content-visibility, and a focus restore that returned to
   the wrong element. Both are invisible to the guards (which read the tree) and
   to smoke (which serializes markup, where neither a scroll offset nor an
   activeElement leaves a mark). This is the only instrument that can see
   either. */
/* inPlace: tickUpdate patches the DOM only when nothing is filtered and
   nothing is searched. Every other state falls back to the full render,
   which legitimately rebuilds all of #view, so the identity assertion
   below would be false there for a correct reason. */
async function tickDrive(filter, label, mode){
  const inPlace = filter === "all";
  await page.evaluate(({f, m}) => {
    S.path = S.mode = m; S.tab = "watch"; S.filter = f; S.q = "";
    S.watched = {}; S.skipped = {}; S.rated = {}; S.open = {};
    render(); snapTo(S.tab); scrollPut(0);
  }, { f: filter, m: mode || "continuity" });
  await page.waitForTimeout(250);
  await page.evaluate(() => scrollPut(Math.round(scroller().scrollHeight * 0.55)));
  await page.waitForTimeout(350);
  /* Measured inside the click's own task, for the reason the jump drives are:
     the clamp happens during the repaint, and Chromium's scroll anchoring pulls
     the page back within a few hundred ms. A drive that waits and then looks is
     green against the defect — this one was, before it was rewritten, which is
     the whole reason it is written this way. */
  const r = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('#view .panel:not([inert]) [data-act="watched"]'))
      .find(el => { const q = el.getBoundingClientRect();
                    return q.top > 100 && q.bottom < window.innerHeight - 60; });
    if(!btn) return null;
    const before = Math.round(scrollKeep());
    const gk = btn.closest(".group").querySelector(".ghead").dataset.gk;
    const elByKey = () => {
      const h = document.querySelector('#view .panel:not([inert]) .ghead[data-gk="' + gk + '"]');
      return h ? h.closest(".group") : null;
    };
    /* TWO ASSERTIONS, AND THE SECOND ONE IS THE READER'S. Element identity is
       structural: nothing but a full render may replace a .group, because a
       fresh node has no remembered size for content-visibility:auto and lands
       at its contain-intrinsic-size. Height is the consequence a reader
       actually feels. Both go red against 3.4.0 -- group 3512 -> 66, document
       15347 -> 11901 -- and green after.

       READ THIS BEFORE DEBUGGING THIS FILE. It loads NW_URL over HTTP, default
       127.0.0.1:8099, NOT the tree it happens to sit in. Editing docs/ in a
       scratch copy and running this from that copy tests whatever the server
       is serving, which is the original. Three runs against a deliberately
       broken tree reported green that way, and the mistake looked exactly like
       a check that could not fail -- serve the copy on its own port and pass
       NW_URL, or you are grading the wrong homework. */
    const stamp = elByKey();
    stamp.dataset.nwprobe = "1";
    const grpH = Math.round(stamp.getBoundingClientRect().height);
    const docH = Math.round(scroller().scrollHeight);
    btn.click();
    const after = elByKey();
    return { before, sameTask: Math.round(scrollKeep()), grpH, docH,
             replaced: !(after && after.dataset.nwprobe === "1"),
             grpH2: after ? Math.round(after.getBoundingClientRect().height) : -1,
             docH2: Math.round(scroller().scrollHeight) };
  });
  if(!r){
    ok("tick keeps your place (filter " + label + ")", false, "no tick in view to click");
    return;
  }
  await page.waitForTimeout(450);
  const settled = await page.evaluate(() => Math.round(scrollKeep()));
  ok("tick keeps your place (filter " + label + ")",
     r.before > 300 && Math.abs(r.sameTask - r.before) < 150,
     "same-task " + r.before + " → " + r.sameTask + ", settled " + settled);
  /* 3.4.1, and this is the assertion the 3.4.0 pair could not make. scrollY is
     unchanged across the group-collapse defect -- 8780 to 8780 -- because the
     offset does not move, the content under it does. What moves is the ticked
     group's own height, so that is what is measured, in the click's own task. */
  if(inPlace){
    ok("a tick does not replace the group element (" + label + ")",
       !r.replaced,
       r.replaced
         ? "the .group node was swapped for a fresh one — content-visibility:" +
           "auto has no remembered size for it, so it renders at contain-" +
           "intrinsic-size and the page moves under the reader"
         : "same node kept, group " + r.grpH + " → " + r.grpH2);
  }
  ok("a tick does not collapse the group under you (" + label + ")",
     r.grpH > 200 && r.grpH2 > r.grpH * 0.9,
     "group " + r.grpH + " → " + r.grpH2 + ", document " + r.docH +
     " → " + r.docH2);
}

await tickDrive("ess", "ess");
await tickDrive("core", "core");
/* The default state: no filter, no search. Both drives above take tickUpdate's
   FALLBACK branch on its first line, so between them they had never exercised
   the branch every reader is actually in. In Bruce's life the groups are eras,
   which is where the collapse is worst. */
await tickDrive("all", "all, life", "life");

const foc = await page.evaluate(() => {
  S.path = S.mode = "continuity"; S.tab = "watch"; S.filter = "all"; S.q = "";
  S.watched = {}; S.skipped = {}; S.rated = {}; S.open = {};
  window.setAllGroups(true); render(); snapTo(S.tab);
  const row = document.querySelector('#view .panel:not([inert]) [data-act="expand"]');
  if(!row) return { err: "no expandable row" };
  const id = row.dataset.id;
  S.open[id] = 1; render();
  const inRow = Array.from(
    document.querySelectorAll('#view .panel:not([inert]) [data-act="watched"][data-id="' + id + '"]')).pop();
  if(!inRow) return { err: "no Mark watched inside the open row" };
  inRow.focus();
  const started = document.activeElement === inRow;
  inRow.click();
  const ae = document.activeElement;
  return { started, tag: ae ? ae.tagName : "none",
           act: ae && ae.dataset ? (ae.dataset.act || "") : "" };
});
ok("focus survives a tick inside an open row",
   !foc.err && foc.started && foc.tag === "BUTTON",
   foc.err ? foc.err : "focus started on the button and landed on " +
   foc.tag + (foc.act ? ' [data-act="' + foc.act + '"]' : ""));

const focStar = await page.evaluate(() => {
  S.path = S.mode = "continuity"; S.tab = "watch"; S.filter = "all"; S.q = "";
  S.watched = {}; S.rated = {}; S.open = {};
  window.setAllGroups(true); render(); snapTo(S.tab);
  const row = document.querySelector('#view .panel:not([inert]) [data-act="expand"]');
  if(!row) return { err: "no expandable row" };
  const id = row.dataset.id;
  S.open[id] = 1; render();
  const star = document.querySelector('#view .panel:not([inert]) [data-act="rate"][data-id="' + id + '"]');
  if(!star) return { err: "no star in the open row" };
  star.focus();
  const started = document.activeElement === star;
  star.click();
  const ae = document.activeElement;
  return { started, tag: ae ? ae.tagName : "none",
           act: ae && ae.dataset ? (ae.dataset.act || "") : "" };
});
ok("focus survives rating from inside an open row",
   !focStar.err && focStar.started && focStar.tag === "BUTTON",
   focStar.err ? focStar.err : "landed on " + focStar.tag +
   (focStar.act ? ' [data-act="' + focStar.act + '"]' : ""));

/* Screenshots, so the header can be looked at rather than only measured. */
await page.evaluate(() => { S.watched = {}; S.tab = "watch"; render(); snapTo(S.tab); scrollPut(0); });
await page.screenshot({ path: "qa/.shots/shot-header-0.png", clip: {x:0, y:0, width:390, height:120} });
await page.evaluate(() => { pool().forEach(f => S.watched[f.id] = 1); render(); });
await page.screenshot({ path: "qa/.shots/shot-header-100.png", clip: {x:0, y:0, width:390, height:120} });

/* ---- the deck (4.0.0): geometry, the swipe, and what survives it ------ */
/* jsdom cannot swipe and the guards read the tree, so everything here is the
   half only a browser can answer: the panels stand where the layout says,
   a horizontal scroll of #view changes the active tab, a panel's place
   survives being swiped away from, the footer door still resets, and the
   belt's auto-close — whose observer root moved to the panel — still fires
   when the pouches scroll out under the header. */
const geo = await page.evaluate(() => {
  S.path = S.mode = "continuity"; S.tab = "watch"; S.filter = "all"; S.q = "";
  S.watched = {}; S.open = {}; setAllGroups(true); render(); snapTo(S.tab); scrollPut(0);
  const vp = document.getElementById("view");
  const hdr = document.querySelector("header").getBoundingClientRect();
  const pane = document.getElementById("panel-watch").getBoundingClientRect();
  const cs = getComputedStyle(vp);
  const ps = getComputedStyle(document.getElementById("panel-watch"));
  return { headerBottom: hdr.bottom, paneTop: pane.top, paneW: pane.width,
           vpW: vp.clientWidth, span: vp.scrollWidth,
           snapType: cs.scrollSnapType, snapStop: ps.scrollSnapStop,
           snapAlign: ps.scrollSnapAlign,
           panels: document.querySelectorAll("#view > .panel").length };
});
ok("deck: the scrollport starts at the header's bottom — the scrollbar hides " +
   "below the header the way it hides below the footer",
   Math.abs(geo.headerBottom - geo.paneTop) < 1,
   "header bottom " + geo.headerBottom.toFixed(1) + ", panel top " + geo.paneTop.toFixed(1));
/* The bar is the frame's third member since the 16 Aug installed-app report:
   in the flow, ending exactly where the viewport does, with the panels ending
   exactly where it begins — no fixed anchor for iOS standalone to misplace. */
const barGeo = await page.evaluate(() => {
  const t = document.getElementById("tabs").getBoundingClientRect();
  const p = document.getElementById("panel-watch").getBoundingClientRect();
  return { tabsBottom: t.bottom, tabsTop: t.top, paneBottom: p.bottom,
           vpH: window.innerHeight,
           fixed: getComputedStyle(document.getElementById("tabs")).position };
});
ok("deck: the tab bar sits in the flow, flush with the viewport's bottom",
   barGeo.fixed !== "fixed" && Math.abs(barGeo.tabsBottom - barGeo.vpH) < 1,
   barGeo.fixed + ", bar bottom " + barGeo.tabsBottom.toFixed(1) + " of " + barGeo.vpH);
ok("deck: the panels end where the bar begins",
   Math.abs(barGeo.paneBottom - barGeo.tabsTop) < 1,
   "panel bottom " + barGeo.paneBottom.toFixed(1) + ", bar top " + barGeo.tabsTop.toFixed(1));
ok("deck: four panels, each exactly one viewport wide",
   geo.panels === 4 && Math.abs(geo.paneW - geo.vpW) < 1 &&
   Math.abs(geo.span - 4 * geo.vpW) < 4,
   geo.panels + " panels, " + geo.paneW + "px in a " + geo.vpW + "px viewport, span " + geo.span);
ok("deck: the computed snap is x mandatory, start, always",
   /x mandatory/.test(geo.snapType) && geo.snapAlign === "start" && geo.snapStop === "always",
   geo.snapType + " / " + geo.snapAlign + " / " + geo.snapStop);

/* 4.3.1: the four tabs start level. Progress carried a private inline
   margin-top on its first block, so it was the only tab standing 18px clear
   of the parked belt — a drift no source sweep could see, because the offset
   lived in a style attribute. The clearance is the belt's bottom margin now
   (guard 128 pins the source); this measures the RESULT: the first painted
   block below the belt sits at one height on every tab. */
const level = await page.evaluate(async () => {
  const tops = {};
  for (const t of ["home", "next", "watch", "stats"]) {
    goTab(t);
    await new Promise(r => setTimeout(r, 120));
    const pane = document.querySelector("#view .panel:not([inert])");
    pane.scrollTop = 0;
    let el = pane.querySelector(".pathseg").nextElementSibling;
    while (el && el.getBoundingClientRect().height === 0) el = el.nextElementSibling;
    tops[t] = el ? Math.round(el.getBoundingClientRect().top * 2) / 2 : null;
  }
  goTab("watch");
  return tops;
});
ok("the four tabs start level — one first-content offset below the belt",
   [...new Set(Object.values(level))].length === 1 && Object.values(level).every(v => v !== null),
   Object.entries(level).map(([k, v]) => k + " " + v).join(", "));

/* 4.4.1: and the four tabs END level. The 4.4.0 soak found the footer
   diamond floating at three different clearances — 30px under Home's theme
   row, 16px under the availability notes, 14px over the legend — because
   three rules each kept a private top margin, the 4.3.1 bug's mirror image
   at the page's other end. The clearance is the shared footer rule's
   margin-top now (§148 pins the source); this measures the RESULT: the gap
   between each tab's closing diamond and the element above it. */
const footGapsAll = await page.evaluate(async () => {
  const gaps = {}, faces = {};
  for (const t of ["home", "next", "watch", "stats"]) {
    goTab(t);
    await new Promise(r => setTimeout(r, 120));
    const pane = document.getElementById("panel-" + t);
    const el = pane.querySelector(".homefoot, .note.foot, .legend");
    const prev = el && el.previousElementSibling;
    gaps[t] = (el && prev)
      ? Math.round((el.getBoundingClientRect().top -
                    prev.getBoundingClientRect().bottom) * 2) / 2
      : null;
    const cs = el ? getComputedStyle(el, "::before") : null;
    faces[t] = cs ? cs.fontFamily + " @ " + cs.fontSize : null;
  }
  goTab("watch");
  return { gaps, faces };
});
const footGaps = footGapsAll.gaps, footFaces = footGapsAll.faces;
ok("the four tabs end level — one clearance above every closing diamond",
   [...new Set(Object.values(footGaps))].length === 1 &&
   Object.values(footGaps).every(v => v !== null),
   Object.entries(footGaps).map(([k, v]) => k + " " + v).join(", "));
/* 4.4.3: and the diamond itself is ONE GLYPH IN ONE FACE. The legend
   inherited the Sans stack while the notes and colophon sat in Mono, so
   The Path's ◆ drew from a different fallback at a different width —
   invisible to every source pin, measurable only here. */
ok("the four closing diamonds share one face at one size",
   [...new Set(Object.values(footFaces))].length === 1 &&
   Object.values(footFaces).every(v => v !== null),
   [...new Set(Object.values(footFaces))].map(f => String(f).slice(0, 60)).join(" / "));

/* The swipe: scroll #view sideways one viewport and read what followed. The
   place kept in The path must survive the trip away and back. */
const swipe = await page.evaluate(async () => {
  scrollPut(2600);
  const kept = scrollKeep();
  const vp = document.getElementById("view");
  vp.scrollBy({ left: -vp.clientWidth, behavior: "instant" });
  await new Promise(r => setTimeout(r, 250));
  const afterLeft = {
    tab: S.tab,
    current: document.querySelector("#tabs button[aria-current]").dataset.tab,
    watchInert: document.getElementById("panel-watch").hasAttribute("inert"),
    nextInert: document.getElementById("panel-next").hasAttribute("inert")
  };
  vp.scrollBy({ left: vp.clientWidth, behavior: "instant" });
  await new Promise(r => setTimeout(r, 250));
  return { kept, afterLeft,
           back: { tab: S.tab, pos: scrollKeep(),
                   watchInert: document.getElementById("panel-watch").hasAttribute("inert") } };
});
ok("swipe: scrolling the deck left lands on Next up — tab, aria-current and inert all move",
   swipe.afterLeft.tab === "next" && swipe.afterLeft.current === "next" &&
   swipe.afterLeft.watchInert && !swipe.afterLeft.nextInert,
   JSON.stringify(swipe.afterLeft));
/* 4.4.2: EXACTLY. This line allowed 150px of drift, and WebKit drifted 116
   — a content-visibility clamp restored by the background refill — so the
   phone lost The Path's place while the check read green. The place has one
   JS memory now (section 149) and the ruler demands it back to the pixel. */
ok("swipe: The path keeps its place across a swipe away and back",
   swipe.back.tab === "watch" && !swipe.back.watchInert &&
   swipe.kept > 2000 && swipe.back.pos === swipe.kept,
   "kept " + swipe.kept + ", back at " + swipe.back.pos);

/* The footer door: a tap resets the view it opens and aligns the deck. */
await page.click('#tabs button[data-tab="stats"]');
await page.waitForTimeout(150);
await page.click('#tabs button[data-tab="watch"]');
await page.waitForTimeout(150);
const door = await page.evaluate(() => {
  const vp = document.getElementById("view");
  return { tab: S.tab, pos: scrollKeep(),
           aligned: Math.abs(vp.scrollLeft - 2 * vp.clientWidth) < 2,
           stale: document.getElementById("panel-stats").hasAttribute("inert") };
});
ok("footer tap: goTab resets the panel, aligns the deck, inerts the one it left",
   door.tab === "watch" && door.pos === 0 && door.aligned && door.stale,
   JSON.stringify(door));

/* The belt's auto-close, on its new root. Open the pouches in the flow, then
   scroll the panel until they pass under the header — the observer roots on
   the panel now, so this is the exact threshold that moved. */
const beltClose = await page.evaluate(async () => {
  S.tab = "watch"; S.beltOpen = false; S.beltDrop = false; render(); snapTo(S.tab); scrollPut(0);
  document.getElementById("beltpeek").click();
  document.querySelector('#view .panel:not([inert]) [data-act="belt"]').click();
  /* opened dropped from the peek; close the drop into the flow state */
  closeBelt("drop");
  await new Promise(r => setTimeout(r, 300));
  openBelt();
  await new Promise(r => setTimeout(r, 100));
  const openBefore = S.beltOpen && !!document.querySelector("#view .panel:not([inert]) .includes");
  scrollPut(1200);
  await new Promise(r => setTimeout(r, 450));
  return { openBefore, openAfter: S.beltOpen,
           includesGone: !document.querySelector("#view .panel:not([inert]) .includes:not(.closing)") };
});
ok("belt: the flow auto-close still fires with the observer rooted on the panel",
   beltClose.openBefore && !beltClose.openAfter && beltClose.includesGone,
   JSON.stringify(beltClose));

/* Paint, looked at rather than inferred — the transparent-pouch lesson. */
await page.evaluate(() => {
  S.beltOpen = false; S.beltDrop = false; S.tab = "watch"; render(); snapTo(S.tab); scrollPut(0);
});
await page.waitForTimeout(120);
await page.screenshot({ path: "qa/.shots/shot-deck-watch.png" });
await page.evaluate(() => {
  const vp = document.getElementById("view");
  vp.scrollBy({ left: -Math.round(vp.clientWidth / 2), behavior: "instant" });
});
await page.waitForTimeout(80);
await page.screenshot({ path: "qa/.shots/shot-deck-midswipe.png" });
await page.evaluate(async () => {
  const vp = document.getElementById("view");
  vp.scrollBy({ left: vp.clientWidth, behavior: "instant" });
  await new Promise(r => setTimeout(r, 250));
  goTab("watch");
});

/* ---- 4.4.0: the cut family, measured ---------------------------------- */
/* Section 148 pins the source shapes; this is the half a regex cannot see —
   what the engine actually computes. The clip resolves to a polygon, the
   tick's rotation resolves to a matrix and widens its box by exactly the
   rotation's arithmetic, the here mark lands on one group with painted
   overlays, and the sticky header still sticks inside a group that carries
   them — the interaction the corner-overlay construction was chosen FOR. */
{
  const deco = await page.evaluate(() => {
    S.tab = "home"; S.q = ""; S.filter = "all"; render(); snapTo("home"); scrollPut(0);
    const go = document.querySelector(".heroacts .go");
    const cg = go ? getComputedStyle(go) : null;
    S.tab = "watch"; render(); snapTo("watch"); scrollPut(0);
    const heres = document.querySelectorAll(".group.here");
    const h0 = heres[0] || null;
    const hb = h0 ? getComputedStyle(h0, "::before").backgroundImage : "none";
    const ha = h0 ? getComputedStyle(h0, "::after").backgroundImage : "none";
    /* The Path row's tick, by name — the first .tick in the document can be
       Activity's 24px one inside a warm Home panel. */
    const tick = document.querySelector(".gbody .film .tick");
    const tr = tick ? tick.getBoundingClientRect() : { width: 0 };
    const tc = tick ? getComputedStyle(tick) : null;
    const chip = document.querySelector(".chip");
    return {
      goClip: cg ? cg.clipPath : "none", goRadius: cg ? cg.borderRadius : "?",
      heres: heres.length, hereBefore: hb, hereAfter: ha,
      tickTransform: tc ? tc.transform : "none",
      tickBox: +tr.width.toFixed(1),
      chipRadius: chip ? getComputedStyle(chip).borderRadius : "?"
    };
  });
  ok("the CTA computes the cut", /polygon/.test(deco.goClip) && deco.goRadius === "0px",
     deco.goClip.slice(0, 40) + " r=" + deco.goRadius);
  ok("exactly one group wears the here mark", deco.heres === 1, deco.heres + " marked");
  ok("both here overlays paint their gradients",
     /linear-gradient/.test(deco.hereBefore) && /linear-gradient/.test(deco.hereAfter),
     (deco.hereBefore + " / " + deco.hereAfter).slice(0, 80));
  /* 30px box × scale .78 × √2 ≈ 33.1 — the rotation read back out of layout. */
  ok("the tick's diamond widens its box by the rotation's arithmetic",
     deco.tickTransform !== "none" && deco.tickBox > 31 && deco.tickBox < 35.5,
     deco.tickTransform + " box " + deco.tickBox + "px");
  ok("the chips compute square", deco.chipRadius === "0px", deco.chipRadius);

  /* The sticky header inside the marked group. Scroll until the here-group's
     head is stuck, then require it to hold the panel-relative offset every
     other group's head holds — the corner overlays must not unstick it. */
  const stick = await page.evaluate(async () => {
    const grp = document.querySelector(".group.here");
    if(!grp) return { err: "no here-group rendered" };
    const gk = grp.querySelector(".ghead").dataset.gk;
    if(S.groupOpen[gk] === false){ S.groupOpen[gk] = true; render(); }
    const grp2 = document.querySelector(".group.here");
    const wrap = grp2.querySelector(".ghwrap"), a = scroller();
    const paneTop = a.getBoundingClientRect().top;
    const want = wrap ? parseFloat(getComputedStyle(wrap).top) : NaN;
    scrollPut(scrollKeep(a) + grp2.getBoundingClientRect().top - paneTop + 120, a);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const r = wrap.getBoundingClientRect();
    return { got: +(r.top - paneTop).toFixed(1), want: +want.toFixed(1) };
  });
  ok("the here-group's header still sticks at its offset",
     !stick.err && Math.abs(stick.got - stick.want) <= 1,
     stick.err || (stick.got + " vs " + stick.want));
  await page.evaluate(() => { scrollPut(0); });
}

/* ---- axe-core, in states a static scan cannot reach ------------------- */
/* 3.2.0. Lighthouse already runs axe against the cold load and passes it, so
   repeating that buys nothing — TEN of its accessibility checks are manual and
   unautomatable (focus traps, managed focus, tab order, offscreen content) and
   a static pass cannot reach a state at all. What this adds is the state: the
   first-run chooser, which a cold load never shows, and a group opened, which
   is the app's most complex live DOM. Injected from the declared devDependency
   rather than a CDN — an accessibility guard that reaches the network to run
   would contradict the page it is checking. */
/* 3.7.2 (M-4 of the 10 Aug review): EACH STATE NOW PROVES IT HOLDS BEFORE AXE
   RUNS. The "group opened" setup read `PATH[0].k` — PATH groups have n, name
   and films, never .k — so the fold never opened and the pass audited the
   plain view twice. A check that cannot fail is this repository's own named
   anti-pattern, and it sat inside the accessibility instrument. The verify
   callback is the fix's teeth: axe on the wrong state now goes red as "the
   state did not hold" instead of green as a lie. */
async function axeState(name, setup, verify){
  await page.evaluate(setup);
  if(verify){
    const held = await page.evaluate(verify);
    ok("axe (" + name + "): the state actually holds", !!held.pass, held.detail);
    if(!held.pass) return;
  }
  const r = await page.evaluate(async () => await window.axe.run(document, {
    resultTypes: ["violations"],
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }
  }));
  const v = r.violations.filter(x => x.impact !== "minor");
  ok("axe (" + name + "): no serious violations", v.length === 0,
     v.length ? v.map(x => x.id + " ×" + x.nodes.length).join(", ")
              : r.violations.length + " minor");
}

await axeState("first-run chooser", () => {
  localStorage.clear(); S.path = null; S.tab = "home"; render(); snapTo(S.tab);
}, () => {
  const picks = document.querySelectorAll("#view .panel:not([inert]) .pick").length;
  return { pass: picks > 0, detail: picks + " chooser card(s)" };
});
await axeState("a group opened", () => {
  S.path = S.mode = "continuity"; S.tab = "watch"; S.open = {};
  setAllGroups(false); render(); snapTo(S.tab);
  const h = document.querySelector('#view .panel:not([inert]) .ghead[data-gk]');
  if(h) h.click(); /* the app's own path in — aria-expanded flips, the fold renders */
}, () => {
  const open = document.querySelectorAll("#view .panel:not([inert]) .group.open").length;
  const rows = document.querySelectorAll("#view .panel:not([inert]) .group.open .film").length;
  return { pass: open === 1 && rows > 0, detail: open + " open group(s), " + rows + " row(s)" };
});
/* The expanded row — the app's most complex live DOM, and until 3.7.2 the
   state nothing ever scanned. */
await axeState("a row expanded", () => {
  S.path = S.mode = "continuity"; S.tab = "watch"; S.q = "";
  setAllGroups(true); render(); snapTo(S.tab);
  const row = document.querySelector('#view .panel:not([inert]) [data-act="expand"]');
  if(row){ S.open = {}; S.open[row.dataset.id] = 1; render(); }
}, () => {
  const open = document.querySelectorAll("#view .panel:not([inert]) .film.open").length;
  const controls = document.querySelectorAll("#view .panel:not([inert]) .film.open .linkrow a, #view .film.open button").length;
  return { pass: open === 1 && controls > 0, detail: open + " open row(s), " + controls + " control(s)" };
});

/* ---- what the console said, across every state exercised above -------- */
ok("no CSP violation in any state", cspHits.length === 0,
   /* This read "connect-src 'none' held" until 3.3.2, one release after 3.3.1
      removed that directive for never having taken effect. A green line that
      names a thing which is not there is the same failure as a guard asserting
      a retired state, in the one place a person reads rather than runs. */
   cspHits.length ? cspHits[0].slice(0, 160) : "the policy refused nothing it allows");
ok("no uncaught page error in any state", pageErrs.length === 0,
   pageErrs.length ? pageErrs[0].slice(0, 160) : "clean");

/* ---- the offline promise, kept by a real worker in a real browser -------
   3.7.2 (M-5 of the 10 Aug review). Guard 132 executes sw.js's handlers
   against mocks; this is the other half — the registered worker, a real
   cache, and the network actually off. A fresh context so the registration
   and its caches are this drive's own. */
const swCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const swPage = await swCtx.newPage();
/* The app registers only on https or the literal hostname "localhost" —
   127.0.0.1 (this file's default) never registers, and an un-guarded await
   on serviceWorker.ready would hang this instrument forever. So this drive
   uses the localhost spelling of the same server, and every wait below
   carries its own clock. */
const SWURL = URL.replace("//127.0.0.1", "//localhost");
await swPage.goto(SWURL, { waitUntil: "load" });
const swReady = await swPage.evaluate(async () => {
  if(!("serviceWorker" in navigator)) return { supported: false };
  try{
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, rej) => setTimeout(
        () => rej(new Error("serviceWorker.ready did not settle in 15s — did the registration condition change?")), 15000))
    ]);
    if(!navigator.serviceWorker.controller){
      await new Promise(res => {
        navigator.serviceWorker.addEventListener("controllerchange", () => res(1), { once: true });
        setTimeout(res, 4000);
      });
    }
    return { supported: true, active: !!reg.active,
             controlled: !!navigator.serviceWorker.controller };
  }catch(e){ return { supported: false, err: String(e).slice(0, 140) }; }
});
ok("the service worker registers, activates, and takes the page",
   swReady.supported && swReady.active && swReady.controlled, JSON.stringify(swReady));
if(swReady.supported && swReady.active && swReady.controlled){
  /* 3.9.2: POLLED, NOT SLEPT. A fixed 600 ms was a bet on the runner, and this
     file's own rule is measure, don't sleep. Wait for the shell to actually be
     in the cache, then go offline. */
  /* 4.2.3, Q-4 of the 19 Aug audit: this wait's timeout was swallowed too —
     going offline against a cold cache made the reload check fail as a
     mystery instead of naming the cache that never filled. */
  const shellCached = await swPage.waitForFunction(async () => {
    for(const n of await caches.keys()){
      if(await (await caches.open(n)).match("./index.html")) return true;
    }
    return false;
  }, null, {timeout: 10000}).then(() => true, () => false);
  ok("the shell reaches the worker's cache before the offline test",
     shellCached, shellCached ? "cached" :
     "10s and ./index.html is in no cache — the offline reload below is against a cold cache");
  /* 4.2.3, Q-13: entries > 0 proved A build boots offline, not that THIS
     build does — a stale cached shell passes that bar (2.5.1 shipped
     exactly that). The BUILD the worker serves offline must be the BUILD
     the network served online. */
  const onlineBuild = await swPage.evaluate(() => window.BUILD);
  /* 4.4.1: the offline reload is Chromium's. The WebKit job's first run
     (2026-08-20, run 353) proved everything above this line on WebKit —
     registration, activation, control, THIS build's shell in the cache —
     and then page.reload({offline}) died with "WebKit encountered an
     internal error": the Playwright WebKit driver cannot navigate while
     setOffline holds, which is a harness limit, not a Safari finding. A
     skip that says so beats a red that cries wolf and beats silence worse
     (the no-silent-caps rule): the line below prints on every WebKit run,
     and Chromium keeps driving the real offline reload on every push. */
  if(WK){
    out.push("  skip offline reload — Playwright's WebKit driver errors " +
             "internally on navigation while offline; registration, control " +
             "and THIS build's cached shell are asserted above, and Chromium " +
             "drives the offline reload every run");
  } else {
  await swCtx.setOffline(true);
  let offline = { booted: false, entries: 0 };
  try{
    await swPage.reload({ waitUntil: "load" });
    await swPage.waitForFunction(() => typeof window.render === "function", { timeout: 8000 });
    offline = await swPage.evaluate(() => ({
      booted: typeof window.render === "function",
      entries: window.FILMS ? window.FILMS.length : 0,
      build: window.BUILD
    }));
  }catch(e){ offline.err = String(e).slice(0, 120); }
  ok("offline: the app still opens from the worker's cache",
     offline.booted && offline.entries > 0,
     offline.err || (offline.entries + " entries with the network off"));
  ok("offline: the shell the worker serves is THIS build",
     offline.booted && offline.build === onlineBuild,
     offline.err || ("online " + onlineBuild + " vs offline " + offline.build));
  await swCtx.setOffline(false);
  }
}
await swCtx.close();

await browser.close();
console.log("\nNight Watcher browser check — 390×844, " + (WK ? "WebKit" : "Chromium") + "\n");
out.forEach(l => console.log(l));
console.log(bad ? "\n  ✗ " + bad + " browser check(s) failed\n"
                : "\n  ✓ browser checks passed\n");
process.exit(bad ? 1 : 0);
