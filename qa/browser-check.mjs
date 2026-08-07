/* Browser check. NOT part of npm test — jsdom has no layout, so the things
   below cannot be observed by the harness at all: the header at 0% and 100%,
   jumping to a group with content-visibility on, a group opening and closing,
   the Where to watch URL a reader actually taps — and, since 3.2.0, accessibility
   in a STATE rather than on a cold load.

   Run against a served copy of docs/ at 390x844 (iPhone 12/13/14 logical size).
   Not committed to CI: it needs a browser, and the point of it is that a person
   would otherwise have to look.

   3.2.0 FIXED WHAT THIS FILE COULD NOT SAY ABOUT ITSELF. It imported playwright
   while package.json declared only jsdom and wrangler, and it launched a
   hard-coded /opt/pw-browsers/chromium-1194/… path — so it ran on whatever
   happened to be installed, at one pinned build number, and would have failed
   or, worse, silently not run anywhere else. Adding an accessibility pass to a
   script that cannot declare how to start is how a guard comes to pass because
   it never executed. Both dependencies are declared now, and the executable is
   resolved by Playwright with an env override kept for sandboxes that place it
   somewhere unusual. */
import { chromium } from "playwright";
import { createRequire } from "node:module";
import fs from "node:fs";

const URL = process.env.NW_URL || "http://127.0.0.1:8099/";
/* axe-core, read from the declared devDependency rather than fetched. */
const axeSrc = fs.readFileSync(
  createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
/* Playwright resolves its own browser. NW_CHROME is the escape hatch, not the
   default — a pinned path IS the bug this replaced. */
const EXE = process.env.NW_CHROME || undefined;
const out = [];
let bad = 0;
function ok(name, pass, detail){
  out.push((pass ? "  ok   " : "  FAIL ") + name + (detail ? "  — " + detail : ""));
  if(!pass) bad++;
}

const browser = await chromium.launch(
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
  setAllGroups(true); render();
});

/* ---- the header at 0% ------------------------------------------------- */
const head0 = await page.evaluate(() => {
  const bat = document.querySelector(".mark svg").getBoundingClientRect();
  const glyph = document.querySelector(".mark svg path").getBBox
    ? null : null;
  const ring = document.querySelector("#ringArc").getBoundingClientRect();
  const wm = document.querySelector(".wordmark h1").getBoundingClientRect();
  return { pct: document.getElementById("ringPct").textContent,
           aria: document.getElementById("ringBtn").getAttribute("aria-label"),
           batBox: bat.width, ringInk: ring.width, wmTop: wm.top,
           offset: document.getElementById("ringArc").getAttribute("stroke-dashoffset"),
           wraps: document.querySelector(".wordmark h1").getClientRects().length };
});
ok("header at 0%: the ring reads 0%", head0.pct === "0%", head0.pct);
ok("header at 0%: the accessible name carries the number",
   (head0.aria || "").indexOf("0%") === 0, head0.aria);
ok("header at 0%: the arc is fully retracted",
   Math.abs(parseFloat(head0.offset) - 109.96) < 0.05, head0.offset);
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
const cv = await page.evaluate(() => {
  const g = document.querySelector("#view .group");
  return { cv: getComputedStyle(g).contentVisibility,
           cis: getComputedStyle(g).containIntrinsicSize,
           groups: document.querySelectorAll("#view .group").length };
});
ok("content-visibility is on .group", cv.cv === "auto", cv.cv + " / " + cv.cis);

/* ---- jumping to a group, from all five ways in -------------------------- */
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
   find. */
async function jump(clickFn, label, tab){
  await page.evaluate((t) => {
    S.tab = t; S.progOpen = {uni:true, era:true}; render(); window.scrollTo(0,0);
  }, tab || "stats");
  const before = await page.evaluate(() => window.scrollY);
  const fired = await page.evaluate(clickFn);
  const gk = fired && fired.gk;
  if(!gk){ ok("jump from " + label, false, "found nothing to click"); return; }
  await page.waitForTimeout(700);
  const landed = await page.evaluate((k) => {
    const h = document.querySelector('.ghead[data-gk="' + k + '"]');
    if(!h) return { ok: false, why: "the target group did not render" };
    const r = h.getBoundingClientRect();
    const grp = h.closest(".group");
    /* The head lives inside a position:sticky wrapper, so its own rect is
       clamped and cannot answer "how far away was this". The group is static
       and can. */
    const wrap = h.closest(".ghwrap") || h;
    const de = document.documentElement;
    return { ok: true, tab: S.tab, open: grp.classList.contains("open"),
             top: r.top, height: r.height, scrollY: window.scrollY,
             groupDocTop: grp.getBoundingClientRect().top + window.scrollY,
             stick: parseFloat(getComputedStyle(wrap).top) || 0,
             atEnd: window.scrollY + window.innerHeight >= de.scrollHeight - 2,
             cv: getComputedStyle(grp).contentVisibility,
             onlyOpen: document.querySelectorAll("#view .group.open").length };
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

await jump(() => {
  const g = document.querySelector('#view .pies g[data-seg^="c"]');
  if(!g) return null;
  const k = g.getAttribute("data-seg");
  g.querySelector("circle").dispatchEvent(new MouseEvent("click", {bubbles: true}));
  return { gk: k, y: window.scrollY };
}, "the universes donut");
await jump(() => {
  const g = document.querySelector('#view .pies g[data-seg^="e"]');
  if(!g) return null;
  const k = g.getAttribute("data-seg");
  g.querySelector("circle").dispatchEvent(new MouseEvent("click", {bubbles: true}));
  return { gk: k, y: window.scrollY };
}, "the eras donut");
await jump(() => {
  const bs = [...document.querySelectorAll('#view [data-act="jump"][data-gk^="c"]')]
    .filter(b => !b.closest(".pies"));
  if(!bs.length) return null; const k = bs[0].dataset.gk; bs[0].click();
  return { gk: k, y: window.scrollY };
}, "the universes fold");
await jump(() => {
  const bs = [...document.querySelectorAll('#view [data-act="jump"][data-gk^="e"]')]
    .filter(b => !b.closest(".pies"));
  if(!bs.length) return null; const k = bs[0].dataset.gk; bs[0].click();
  return { gk: k, y: window.scrollY };
}, "the eras fold");
/* The fifth way in, and the one that had never been driven. */
await jump(() => {
  const c = document.querySelector('#view .ucard[data-act="jump"]');
  if(!c) return null; const k = c.dataset.gk; c.click();
  return { gk: k, y: window.scrollY };
}, "Home's universe grid", "home");

/* ---- a group opens and closes, and the rows really disappear ------------ */
await page.evaluate(() => {
  S.tab = "watch"; S.mode = "continuity"; S.filter = "all"; S.q = "";
  setAllGroups(true); render(); window.scrollTo(0, 0);
});
const grp = await page.evaluate(() => {
  const h = document.querySelector("#view .ghead");
  const body = h.closest(".group").querySelector(".gbody");
  return { gk: h.dataset.gk, open: h.getAttribute("aria-expanded"),
           bodyShown: getComputedStyle(body).display };
});
ok("a group starts open", grp.open === "true" && grp.bodyShown === "block",
   grp.open + " / " + grp.bodyShown);
await page.click("#view .ghead");
await page.waitForTimeout(120);
const closed = await page.evaluate(() => {
  const h = document.querySelector("#view .ghead");
  const g = h.closest(".group");
  return { aria: h.getAttribute("aria-expanded"), cls: g.className,
           body: getComputedStyle(g.querySelector(".gbody")).display,
           allBtn: document.querySelector(".allbtn").textContent,
           height: g.getBoundingClientRect().height };
});
ok("closing a group hides its rows",
   closed.aria === "false" && closed.cls === "group" && closed.body === "none",
   JSON.stringify(closed));
await page.click("#view .ghead");
await page.waitForTimeout(120);
const reopened = await page.evaluate(() => {
  const h = document.querySelector("#view .ghead");
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
  S.q = "The Batman"; setAllGroups(true); render();
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
  render();
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
  S.tab = "watch"; S.q = ""; setAllGroups(true); render();
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
async function tickDrive(filter, label){
  await page.evaluate((f) => {
    S.path = S.mode = "continuity"; S.tab = "watch"; S.filter = f; S.q = "";
    S.watched = {}; S.skipped = {}; S.rated = {}; S.open = {};
    render(); window.scrollTo(0, 0);
  }, filter);
  await page.waitForTimeout(250);
  await page.evaluate(() => window.scrollTo(0, Math.round(document.body.scrollHeight * 0.55)));
  await page.waitForTimeout(350);
  /* Measured inside the click's own task, for the reason the jump drives are:
     the clamp happens during the repaint, and Chromium's scroll anchoring pulls
     the page back within a few hundred ms. A drive that waits and then looks is
     green against the defect — this one was, before it was rewritten, which is
     the whole reason it is written this way. */
  const r = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('#view [data-act="watched"]'))
      .find(el => { const q = el.getBoundingClientRect();
                    return q.top > 100 && q.bottom < window.innerHeight - 60; });
    if(!btn) return null;
    const before = Math.round(window.scrollY);
    btn.click();
    return { before, sameTask: Math.round(window.scrollY) };
  });
  if(!r){
    ok("tick keeps your place (filter " + label + ")", false, "no tick in view to click");
    return;
  }
  await page.waitForTimeout(450);
  const settled = await page.evaluate(() => Math.round(window.scrollY));
  ok("tick keeps your place (filter " + label + ")",
     r.before > 300 && Math.abs(r.sameTask - r.before) < 150,
     "same-task " + r.before + " → " + r.sameTask + ", settled " + settled);
}

await tickDrive("ess", "ess");
await tickDrive("core", "core");

const foc = await page.evaluate(() => {
  S.path = S.mode = "continuity"; S.tab = "watch"; S.filter = "all"; S.q = "";
  S.watched = {}; S.skipped = {}; S.rated = {}; S.open = {};
  window.setAllGroups(true); render();
  const row = document.querySelector('#view [data-act="expand"]');
  if(!row) return { err: "no expandable row" };
  const id = row.dataset.id;
  S.open[id] = 1; render();
  const inRow = Array.from(
    document.querySelectorAll('#view [data-act="watched"][data-id="' + id + '"]')).pop();
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
  window.setAllGroups(true); render();
  const row = document.querySelector('#view [data-act="expand"]');
  if(!row) return { err: "no expandable row" };
  const id = row.dataset.id;
  S.open[id] = 1; render();
  const star = document.querySelector('#view [data-act="rate"][data-id="' + id + '"]');
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
await page.evaluate(() => { S.watched = {}; S.tab = "watch"; render(); window.scrollTo(0,0); });
await page.screenshot({ path: "qa/shot-header-0.png", clip: {x:0, y:0, width:390, height:120} });
await page.evaluate(() => { pool().forEach(f => S.watched[f.id] = 1); render(); });
await page.screenshot({ path: "qa/shot-header-100.png", clip: {x:0, y:0, width:390, height:120} });

/* ---- axe-core, in states a static scan cannot reach ------------------- */
/* 3.2.0. Lighthouse already runs axe against the cold load and passes it, so
   repeating that buys nothing — TEN of its accessibility checks are manual and
   unautomatable (focus traps, managed focus, tab order, offscreen content) and
   a static pass cannot reach a state at all. What this adds is the state: the
   first-run chooser, which a cold load never shows, and a group opened, which
   is the app's most complex live DOM. Injected from the declared devDependency
   rather than a CDN — an accessibility guard that reaches the network to run
   would contradict the page it is checking. */
async function axeState(name, setup){
  await page.evaluate(setup);
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
  localStorage.clear(); S.path = null; S.tab = "home"; render();
});
await axeState("a group opened", () => {
  S.path = S.mode = "continuity"; S.tab = "watch"; S.open = {};
  const first = PATH[0] && PATH[0].k;
  if(first) S.open[first] = 1;
  render();
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

await browser.close();
console.log("\nNight Watcher browser check — 390×844, Chromium\n");
out.forEach(l => console.log(l));
console.log(bad ? "\n  ✗ " + bad + " browser check(s) failed\n"
                : "\n  ✓ browser checks passed\n");
process.exit(bad ? 1 : 0);
