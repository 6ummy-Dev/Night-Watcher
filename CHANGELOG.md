# Changelog

All notable changes to Night Watcher are recorded here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**The version here, `BUILD` in `docs/index.html` and `VERSION` in `docs/sw.js`must all be the same string.** `qa/guards.js` fails the build if they drift, andalso fails if the newest version in this file has no `## [x.y.z]` section. Thatis the whole point of this file: a shipped change that nobody wrote down is achange that gets undone by the next person who touches the line.

Adding catalogue entries is a MINOR bump. Fixes and copy changes are PATCH.MAJOR marks a change to the app's shape — 2.0.0 is the Belt. A breaking changeto saved progress would also be MAJOR, and should never happen, because every`i:` slug is frozen (see the README).

> **Note on versioning**v1.0.0 → v2.x.x were public beta / early-access builds running directly onproduction. **v3.0.0 is the first version considered stable.** Every versionin this file shipped to the live origin the day it was written — there is nostaging environment and never has been — so the 3.0.0 line is not a change ofprocess, only of the stability contract it is honest to offer.
> 
> Anything experimental after 3.0.0 takes a pre-release tag — `3.1.0-rc.1` —rather than a plain version.

## [Unreleased]

**QA only — no app change, no version bump.** Nothing in `docs/` moved, theguard-section count is unchanged, and the CSP hash is untouched.

### Changed

* **`idHash` is memoised inside the guard sandbox, and the memo proves its ownassumption.** Profiled with `--cpu-prof`: `idHash` was **34% of `guards.js`'sentire runtime** — 147.9 ms of 432 — for 201 distinct answers. It was beingcalled **24,339 times**, because `importCode()` rebuilds its whole`{hash: id}` map on every call and section 3's truncation sweep walks a backupcode down one character at a time, calling `importCode` about 117 times.117 × 201 is the number the profiler saw.**Nothing was wrong.** That is the app's own function, extracted and drivenhonestly, being asked the same pure question twenty-four thousand times. Thememo wraps the **extracted** function — still `idHash` out of `index.html`,still never reimplemented, only asked less. **390 ms → 260 ms, outputbyte-identical, all 121 sections pass.**It multiplies: roughly 500 guards-running fixtures in the negative suite, at~130 ms each saved.**The memo is sound only while `idHash` is pure, so that is checked ratherthan assumed** — every id is hashed through the real function twice and thememo once, and a disagreement fails the build. `negtest300` gives the functionstate exactly as a careless edit would and proves the check fires; without itthis would be the one `fail()` in the file that nothing has ever made fire.
  
* **A generated sweep over `importCode()`, inside section 8.** Every fixture insections 7 and 8 is a hand-written mutation of one code, and the truncationsweep is already a property test over exactly one axis — which is the argumentfor generating the others. **240 codes from a seeded LCG**, no `Math.random()`:a generator that finds a defect on one run and not the next is a rumour, and ared build here has to be reproducible. The seed is printed with any failure.**The invariant is narrow and total: `importCode()` must never throw, and mustnever return an id the catalogue does not contain.** Restoring *less* than waswritten stays allowed — that is the forward tolerance sections 7 and 8 exist toprotect. Restoring something that was never there is the failure no hand-writtenfixture can express, because you would have to guess the input that produces it.**+7 ms.** No new section, so no count change and no re-bless.
  
* **Negative fixtures 508 → 511.** Three added, all proving the new checks fire:`idHash` given state, `importCode` letting an unresolved hash fall through asan id, and one defensive default dropped from the segment read — a real codealways carries a `W` segment, so section 7 never notices and every generatedcode without one throws. Counts swept in `README.md` and `qa.yml`, along withthe per-fixture guards cost the memo halved.
  

> **Found while triaging an outside proposal that recommended splitting`guards.js` and moving fixtures in-memory.** Measured, the full-tree copy itnamed as the biggest win costs **16 ms once per suite**, and `guards.js` wasalready sub-second. Both readings ranked work by source size; the profilerdisagreed. `qa/proposal-triage-2026-08.md` in the project has it in full.

## [3.3.1] — 2026-08-06

**One address.** GitHub Pages was unpublished on the owner's decision that`nightwatcher.life` is the only site, and everything in the tree that existedonly because a second origin was serving comes out with it. Three guards invertrather than disappear; sections still run 1..n with no gaps.

### Removed

* **`offCanonical()` and the `noindex` it injected.** They existed so theGitHub Pages mirror could ask to be left out of an index, because Pages cansend no headers and had to keep serving. The mirror was unpublished on6 August 2026 and the address returns 404, so there is no off-canonicalorigin left to mark. `SITE` stays — the restore link is built from it.
* **`connect-src` from the Content-Security-Policy.** Not loosened: **it nevertook effect.** 3.3.0 set it to `'none'`, and a wire reading on 6 August foundthe Cloudflare edge appending `'self'` to it. A `'none'` sitting beside asecond source expression is ignored, so the directive shipped, read likeprotection and provided none — `fetch("/orders.txt")` from the live pagereturned 200. It now falls through to `default-src 'none'`, the firstdirective in the policy, which the edge has no directive of its own to appendto. **The page opens no connections of any kind**, so the fallback is thetruth rather than a hope. **Whether the edge leaves a fallback alone is theopen question this release asks and cannot answer from the tree** — read theserved CSP after deploying.

### Changed

* **Sections 77, 78 and 114 invert.** All three asserted the mirror's `noindex`from a different side — the app's, the crawler's and the README's. Each wouldhave gone red on the day the correct state was reached, and 77's failuremessage became false the moment Pages went dark. A guard that would block thecorrect state inverts rather than being deleted; section 29 is the precedent.They now fail if `offCanonical()` returns, if a `noindex` injection returns,or if the README promises the retired address "still works and always will".
* **Section 82 keeps its assertion and loses its premise.** No `CNAME` file mayexist. That is what would catch someone re-enabling Pages with a customdomain, so it stays; the title no longer claims Pages is serving.
* **`README.md`, `SECURITY.md`, `NOTES.md`.** The README promised the oldaddress "still works and always will" — a guarantee, and false as of theunpublish. `NOTES.md` is amended rather than rewritten, in its own convention.

### Fixed

* **Section 120's pinned reads described a defect that was already fixed.** The`pageYOffset` entry still said the read sat after `flagSave()`, `applyTheme()`and `renderHead()` and that hoisting it "waits for the freeze to lift on19 Sep 2026". **3.3.0 hoisted it**; it is the first line of `render()`. Thecount was right and the reason was a release out of date, which is the sameshape as the guards this release inverts.
* **Three doc paths in comments.** Sections 96 and 98 and one CHANGELOG linenamed `releases/design-belt.md` and `releases/design-progress-card.md`, whichmoved to `design/` on 6 August. Comments, never `fail()` strings — nothing wasever red.

### Recorded, not changed

* **`flagSave()`'s conditional reflow is correct and cannot be hoisted.** It wascarried as an open item on the assumption that the read could move above thewrite, as `render()`'s did. It cannot: `#nosave` is inside `<header>`, soshowing it changes the height `--ghtop` is measuring, and reading first wouldset the wrong value in the one state that uses it. **Intentional, confirmed,no action.**

## [3.3.0] — 2026-08-06

**Five pendings, and the list is empty behind them.** Four of the five needed aguard written before the fix, because in four cases the thing that had let thedefect ship was a guard that could not see it. The freeze was lifted for exactlyone change and is otherwise unchanged.

### Fixed

* **The buckle's second line failed AA, and the guard that measures it hadalready measured it.** `.pathseg .bs2` drew in `--staroff` at **3.37:1** on`--card2`, where body text wants 4.5. It is `--dim` now — **5.28:1**, stilldimmer than the `--dust` line above it, so the buckle keeps its two-tier read.**Section 20 computed that exact pair and returned without failing**, because`--staroff` was on a list of tokens exempted to the 3:1 UI-component floor onthe grounds that they are *"drawn shapes, not prose."* That is a property ofthe **rule**, not of the colour: `--staroff` is the unfilled star in`.stars button`, which earns the exemption, and it was `.bs2`, which does not.**The exemption names the rules it covers now.** Any other rule drawing textin an exempted token fails.Two of the three exempted tokens — `--line` and `--line2` — are used as a textcolour **nowhere at all**, and have been exempting nothing from a check theynever reached. Their lists are empty and explicit, which turns each into*"if this is ever used as prose, fail."***Found by axe-core in an opened group.** Lighthouse's own axe pass scores thispage 100, because a cold load never reaches the state.
  
* **`render()` read the scroll position after writing.** The read sat below`flagSave()`, `applyTheme()` and `renderHead()`, forcing a synchronous layoutof the whole document on every render — **106.6 ms desktop, 64.1 ms mobile,~98% of LCP and the page's only long task.** It is the first line of thefunction now. The value is identical either way; a DOM write does not move thescroll position.
  
* **The privacy footer still credited the beacon that left in 3.2.0.** *"Cloudflarecounts visits"* → *"the host counts visits"*. Still true before, and still thesentence a reader meets first.
  

### Changed

* **`connect-src` from `'self'` to `'none'`.** Nothing has been fetched atruntime since the beacon left, so `'self'` was looser than the truth for onerelease. **Verified in a browser rather than argued** — see below.
  
* **The head offers four icons instead of two, and one of them already shipped.**`icon.png` is 512×512, has shipped since 1.x and was declared in the manifest,but was never linked from `<head>`. A new `docs/favicon.ico` carries 16, 32 and48 in one container for the crawlers that ask the classic root path and acceptnothing else, generated from `icon.png` by `qa/make-favicon.py`. **It is out ofthe offline shell by decision**: a favicon is browser chrome, the app neverrenders it, and nothing about working offline depends on it.**This is insurance, not a fix.** The reading that prompted it rates afour-day-old canonical origin as the cause and calls the rest *"almost entirelytiming"*; its claim that a 404 at that path is a negative signal isunevidenced and is not repeated here.
  

### Added

* **Section 121 — the privacy footer says what the README says.** 3.2.0 rewroteone copy of the visit-counting claim and left the other, and nothing noticed,because nothing tied them. Section 117 ties `llms.txt` to the README andsection 114 ties the old-origin paragraph to `offCanonical()`; the app's ownfooter was tied to nothing. **Not a word match** — both are free to bereworded, and both must go on saying that counting happens and that the hostdoes it.
  
* **Section 120 grew an ORDER clause, and the reason is the point.** Its pinscount how many times each layout property is read. **The reflow fix moves theread rather than removing it — one before, one after — so the count could notsee the fix at all.** A count answers *how many* and never *in what order*, andorder was the whole defect. It now reads the offset of the scroll read againstthe offset of the first write in `render()`'s own source.The section's comment used to promise that the pins drop to zero when the fixlands. **That was wrong the moment it was written**, and it is corrected.
  
* **The favicon guard grew from a count into a decided set.** It asserted that atleast one icon link existed and printed how many it found, so adding ordropping one changed only the number. Each icon is now named with the reason itis offered, an unnamed one fails, and the `.ico` is checked for the ICOsignature and its layer count — a PNG renamed to `.ico` renders in browsers andis exactly what the crawlers wanting that path do not accept.
  
* **`qa/browser-check.mjs` reads the console.** It measured geometry across 36checks and would not have noticed a Content-Security-Policy violation — the onefailure mode a policy tightening actually has. `connect-src 'none'` shipped onthe strength of that listener across the first-run chooser, an opened group andthe restore paths.
  

### A second forced reflow, recorded and not fixed

`flagSave()` writes `el.hidden = canSave` and then reads `h.offsetHeight` to set`--ghtop`. **It runs only when the store is blocked**, so every profile anyonehas taken — all of them with storage available — is blind to it. Section 120pins that read by name so it cannot go missing. The freeze was lifted for onechange and this is a second one.

## [3.2.0] — 2026-08-06

**The page fetched one thing from somebody else, and it owned both hops of thelongest request chain on the site.** It is gone, and with it the last runtimedependency on any origin but this one. Four things ride with it, and two ofthem are guards that turned out not to be asserting what they printed.

### Removed

* **The analytics beacon, from seven places and under two hostnames.** Everydocument describing this removal listed four: a CSP origin, a `NEVER_CACHE`line, a guard exception, and a clause of README hedging. The tree disagreed.The script tag; **`script-src`, carrying `static.cloudflareinsights.com`**;**`connect-src`, carrying the apex `cloudflareinsights.com`** — two differentstrings in two different directives, which is exactly how one of themsurvives a removal that only remembers the other; `sw.js`'s `NEVER_CACHE` andthe `inList` call that consumed it; section 29's carve-out; section 42's`FETCHED` list, which held both hostnames; and section 43's `PINNED` map and`BEACON` constant.**Deleting the beacon from `script-src` shipped green once before**, whensection 43 pinned four directives of eleven. That hole closed in 3.0.0, andit is why this removal was caught at every step rather than at none: the pinwent red on `connect-src` the moment the policy moved without it.
  
* **`NEVER_CACHE` in `sw.js`, with the thing it guarded.** It held one entryand existed because the cross-origin return below it is about *where* thebeacon was served from rather than about what the list meant. With nothingcross-origin left, an empty list consulted on every fetch is a line that canonly be right by accident.
  

### Changed

* **Two guards inverted rather than being deleted.** Section 29 allowed exactlyone external script and then **failed when it found none**, because an emptymatch array had fooled it once already — the pattern required a double-quoted`src`, the beacon has always been single-quoted, and the sweep thereforematched nothing on every run from 1.2.4 to 3.0.0. *"An empty sweep is not aclean sweep"* was the right fix then. With the beacon gone an empty sweep **is**the clean sweep, and a check written to catch a blind pattern would insteadhave blocked the correct state. It now refuses every external script, whichis a stronger assertion than the carve-out ever was. Section 43's`script-src` rule inverts the same way: the origin that was **required** isnow **refused**, and the fixture that proved it mandatory proves it banned.
  
* **`docs/llms.txt` states its links as links.** Two bare URLs, no `[text](url)`anywhere, in the one file written for engines that read Markdown.
  

### Fixed

* **Section 101 was not asserting the thing it printed.** It failed with*"llms.txt does not name the canonical URL"* while testing`lt.indexOf("https://nightwatcher.life/")` — and`https://nightwatcher.life/orders.txt`, in the same file since 2.6.0,**contains that string.** Proven against the shipped file before it wastouched: delete the entire `Canonical URL:` line and the section stayedgreen. It has been unable to say anything since 2.1.0. It matches the linenow, anchored, and against `index.html`'s own `<link rel="canonical">` ratherthan a literal, so the two copies of that address cannot drift apart either.

### Added

* **Section 120 — the page does not read layout after writing it.** Section 96refused `scrollHeight` from 2.7.0 and refused **one property name**; a forcedreflow arrived at the top of the same function as`window.pageYOffset || document.documentElement.scrollTop`. Ten propertiesare refused outright and three are **pinned to the exact sites that exist**,each named with its reason — because refusing them today would fail the buildover a defect that is real, known, planned and frozen. A guard that cannot begreen against the tree it ships with is not a guard.The `scrollHeight` assertion also **moves out of section 96**, which istitled *"The Belt is one strip, and its pouches open from behind"*. It wasfiled there because that is where the 2.7.0 work happened, and a guard filedunder the wrong name is a guard the next reader does not find.**A third layout read turned up in the sweep** and is pinned with the othertwo: the header measures its own height to set `--ghtop` when the store isblocked. Read then write, which is the correct order — recorded rather thanrefused, so a second one has to be argued for.
  
* **`Cross-Origin-Opener-Policy: same-origin` in `docs/_headers`**, and insection 104's array in the same commit, because the file is notself-guarding: a header added there and nowhere else is a header nothingfails over when it is deleted again. Section 104's note is **derived fromthat array** now instead of naming three headers by hand.
  
* **axe-core in `qa/browser-check.mjs`, in two states.** Lighthouse alreadypasses the cold load, and ten of its accessibility checks are manual andunautomatable; what a browser buys is a **state**. It runs against thefirst-run chooser and against an opened group.**The dependency it needed was the finding.** This file imported `playwright`while `package.json` declared only `jsdom` and `wrangler`, and launched ahard-coded `/opt/pw-browsers/chromium-1194/…` — so it ran on whateverhappened to be installed, at one pinned build. Both are declared now and theexecutable is resolved by Playwright, with `NW_CHROME` kept as an override.**The page's own CSP refuses `addScriptTag`, and that is the policy working.**`script-src` is one hash and nothing else, so an injected `<script>` isblocked exactly as an attacker's would be. axe is injected before navigationinstead.
  

## [3.1.0] — 2026-08-06

**One of the app's functions was the quietest thing in the panel, and the errorpage had nothing on it.** The soak produced the first; the belt release gave upthe second. Neither is large. One of them is the eleventh release in a row inwhich a comment asserted a relationship that nothing checked and that was nottrue.

### Changed

* **"Where to watch" has a rank of its own.** `.lnk` and `.act` were the samerule twice — same font, same 10px, same `.1em`, same uppercase, same`1px solid var(--line2)`, same `8px` radius, same `10px 12px` padding, same`38px` floor. **The only difference was a text colour**, and the link had thefainter of the two: `--steel` at **5.08:1** against `--dust`'s 5.87. In thehero it dropped to 9px — the smallest type in the block — directly above`.heroacts .go`, which is solid `--bone`. The one control that leaves the appwas the quietest thing on the panel.It now carries `background:rgba(114,149,204,.14)`, `border:1px solidvar(--steel)` and `color:var(--bone)`. **5.08:1 → 10.28:1.** Rank boughtentirely with colour: not one extra pixel of width, so `white-space:nowrap`,the hero's `font-size:9px` and the 360px stack all stay true.**The obvious version of this fails AA and it is worth writing down.** Tintingthe fill and keeping the steel label lands at **4.09:1** at `.14` and 3.84 at`.18`. Raising the fill without raising the label buys weight by spendingcontrast. The safe move and the strong move are the same move.
  
* **The hero link is Skip's size, and the expanded row has one left edge.**Four declarations: `.herorow .lnk` gains `flex:1`,`justify-content:center`, `min-height:46px` and `border-radius:11px`;`.linkrow` justifies to the start; and `.herorow .linkrow` stops re-declaring`justify-content` in both the base rule and the 360px block, because the baserule now says it.
  

### Fixed

* **The note claimed an alignment that was never true.** `NOTES.md` and the1.4.x entry both said the link *"only has to share Skip's **edges**, not itsweight."* Measured in Chromium at 375px, and **identical in shipped 3.0.3**:the hero pill stood **38px against Skip's 46**, cornered at **8px against11**, and in an expanded row sat **112px right** of the description, the tickindent and both buttons, which all sit on the 42px line. All four now measure**0.0px** apart.The hero's right edges did agree before this release — but by accident. Thepill was content-sized and overflowed its column's 38% basis, and`min-width:auto` widened the column to match, so the two edges met at a numberneither rule chose. `flex:1` makes the agreement structural.
  
* **The watch link's alignment was guarded backwards.** Section 44 asserted`.linkrow` must be `justify-content:flex-end` — the misalignment above. Itwent red when the fix went in, which is the whole shape of guard 44's ownhistory: a guard that outlives the thing it was written against certifieswhatever replaces it. **It also had no fixture**, so nothing had ever made itfail and nobody had to read what it asserted. Moved to section 119, flipped,and negative-tested.
  

### Added

* **The 404 gets the bat.** `docs/404.html` draws the mark behind its text —inline, `#B4AE9C` (the signal's hue at .14 saturation) at **opacity .09**,`min(115vw,560px)`, `position:fixed` and centred on the viewport rather thanon `<main>`, so it bleeds past the copy block instead of reading as anillustration. `prefers-contrast: more` removes it. **1,039 → 1,761 bytes**against section 101's 4,096 ceiling.**Inline is not a preference.** Cloudflare serves this file *at* the addressthat missed rather than redirecting to it, so `url(./icon.svg)` works at`/nope` and asks for `/a/b/icon.svg` at `/a/b/nope`. The same resolution rulethat killed `./` for the root link in 3.0.2 — and the same one that made alive audit report `manifest.json` as a 404 on 5 Aug, which is that findingarriving from the outside in a real tool.
  
* **Section 115 counts four copies of the bat, not three.** The fourth copy wasadded against the three-copy version of the section: one of its paths wasedited alone and **all 117 sections stayed green**; the bat was then deletedoutright and **all 117 stayed green again**. A guard that counts copiescertifies whatever it was not told about. Both experiments are fixtures now.
  
* **Section 118 — the 404 still reads over its own bat.** Section 20 reads`index.html` only, so nothing in this suite had ever measured a colour on theerror page. The arithmetic rather than a screenshot: at `.09` the headingreads **14.62:1** and the sentence **6.72:1** over the lit background`#17181C`. It also refuses `overflow:hidden` on `<body>` — a `position:fixed`box contributes nothing to document overflow, so it buys nothing and coststhe pinch-zoom section 110 exists to protect.
  
* **Section 119 — where to watch has a rank of its own.** Asserts the link hasa fill and an edge no other pill in the row has, that `.act` has not grown onetoo, that the hero pill and Skip declare the same `min-height` and`border-radius`, that the pill fills its column, that `.linkrow` starts, andthat nothing re-declares `justify-content`. **Every assertion is read from thetwo rules that have to agree, never from a remembered pair of numbers** —which is exactly how the old note stayed false for eleven releases.
  
* **Section 20 grew to see a translucent fill.** Every pair it measures istoken-on-token; a `rgba()` fill lands the label on a blend that appears in nopalette. It now blends `.lnk`'s fill over every surface, per theme, and checksthe label against the result. Section 119 asserts the fill and colour arewritten in a form this can parse, because in any other form it measuresnothing and reports green.
  
* **Section 101 names the namespace trap and requires the mark be inline.**`xmlns="http://www.w3.org/2000/svg"` is an `https://` string, so the firstcandidate went red with *"404.html reaches off the page"* — the right verdictwith the wrong cause, which sends the next reader hunting for a fetch that isnot there. The attribute is unnecessary in an HTML document and is now refusedby name. Separately: no `url()` at all in `404.html`, asserted by shape ratherthan by matching URLs, because a URL check passes anything phraseddifferently.
  
* **`qa/negative/negtest310.sh`** — 10 fixtures for sections 119 and 20'sgrowth. `negtest210` gains 6 for the 404's bat. **35 suites, 483 fixtures.****Two fixtures re-anchored, one of them by this release.** `negtest200`'s*"the link row loses its alignment again"* — a section 99 fixture about`align-items:center` — pinned the string `justify-content:flex-end;align-items:center;`,which S1b deleted, so it reported `SETUP BROKE` rather than failing. It teststhe same thing against the new anchor. `negtest210`'s freshness fixture movedfrom `BUILT = "2026-08-05"` to `"2026-08-06"`, which is routine every release.**Section 115's failure sentences were kept word-for-word** where theassertion did not change, because `negtest300` pins two of them and 483fixtures assert against guard output by message.
  
* **Seven browser checks for the edges guards cannot see.** `qa/browser-check.mjs`measures the hero pill against Skip and the expanded row against Mark watchedand the description. It is still not in `npm test` and still not in CI, by thesame decision as before: it needs a browser, and the point of it is that aperson would otherwise have to look. **It caught the mock** — the v2 mock putthe hero's right edge 8.0px short and the row 171.7px out; the real page said0.0 and 112.0. Measure the thing that runs, not a proxy for it.
  

### Documented

* **`NOTES.md`'s two sentences about this control were both wrong, and both arecorrected in place.** It is not a secondary control — the README's featurelist leads with *"Where to watch, without picking a side"* and `introBlock()`promises every first-time reader *"Tap anything for what it is and where towatch it."* The "secondary" label came from a 1.4.x wrapping bug fixed byshrinking a label, with the justification written down afterwards: a layoutconstraint promoted to a rule of the design. And it never shared Skip's edges.A reversal is written down rather than left looking like drift.
  
* The 9px hero label stays, and now says why: even at the full column width theinner box measures 96.7px and the label needs ~112px at `.1em`.
  

### Not in this release

* **axe-core on `qa/browser-check.mjs`.** The one forward-looking item either5 Aug audit produced, and the one gap both named: browser a11y, which neithercould execute. It needs no release and rides whenever — it is still theowner's call, and an unattended-ish build does not add a devDependency nobodyasked for on ship day.

## [3.0.3] — 2026-08-05

**One sentence, kept in two files, and one copy had drifted.** The README'scanonical description and `docs/llms.txt`'s summary say the same thing todifferent readers. They had stopped saying the same thing, and nobody could saywhen.

### Fixed

* **`llms.txt` had dropped "animated and live action."** The README's one-linedescription reads *"every Batman story ever filmed — animated and live action —133 films and 67 seasons of television across 44 continuities."* The summaryblock at the top of `llms.txt` carried that sentence with the middle clausemissing. Covering the animated work and the live action in one catalogue isamong the rarest true things this project can say: **"animated" appears 197times in `index.html` and 4 times in the README, and did not appear once in thefile generative engines actually read.**

### Added

* **Section 117 — `llms.txt` says what the README says.** Restoring the clausewithout a guard leaves the same hole open for the next edit, and this is theproject's most-repeated bug class: the tagline, the three copies of the bat,the README's paragraph about the old origin. Section 101 already guards`llms.txt` — but it guards the three counts and the canonical URL, becausecounts are what drifted in 1.8.3, and the sentence carrying them was neverchecked.**Not a word blocklist, and not character-for-character equality.** The twofiles are different documents for different readers and their wording isallowed to differ. What is asserted is that the claim survives the copy: everyload-bearing phrase in the README's canonical sentence appears in the summarytoo. Reword either freely; drop a claim from one and the build goes red.It also asserts the README's own sentence still makes those claims, so the ruleand the check cannot drift apart — if the description legitimately changes, thesection's list moves with it in the same commit.**The first draft went red on the text it was written from**, twice: it foldedthe haystack to lowercase and not the needle, and it collapsed whitespacebefore stripping `llms.txt`'s `> ` markers, which left them mid-sentence so anyphrase straddling a wrapped line read as missing. Both are recorded in thesection.
  

### Also in this release

* **The README's no-third-party-code claim is scoped to this repository.**Cloudflare's edge injects a script that is not in `docs/index.html` and cannotbe removed from here, so the unqualified claim was false on the wire. Twolines, not one — the Non-goals bullet and the Running-it line. **The scopeddata claims are untouched and stay true:** watch data never leaves the device,progress is never transmitted. Evidence and the ruled-out list are in theproject's `ops/c0-edge-injection.md`.

## [3.0.2] — 2026-08-05

**The emptying release.** Every code item left anywhere in this project is inhere, and the ~60-item P3 tail is triaged once and closed rather than carried asa block nobody had read. No app behaviour changes beyond two confirmed defects,and no saved-progress format moves.

### Fixed

* **Section 99 carried a loop that checked nothing.** It computed a conditionand the `if` body was a comment — no `fail()`, no `note()`, no effect.Check-shaped and inert, inside a section that otherwise works. The commentdescribed a real relationship, so it asserts it now rather than being deleted.
  
* **Section 22 could not see the head.** It sliced `<body>` to the first`<script>`, so `<head>` — where the title, description and OG/Twitter tagslive — was outside the scan. A stranded `\uXXXX` there renders literally toevery crawler and every social embed. The JSON-LD block is excluded on purpose:it is JSON, where the escape is correct.
  
* **Section 37's `target="_blank"` check only looked rightward.**`rel="noopener noreferrer" target="_blank"` is correct HTML and a commonordering, and the old lookahead failed the build on it. **A guard that goes redon a correct page is worse than one with a gap** — it teaches the next personthe guard is unreliable, which is how a real failure later gets waved through.It reads the whole tag now, and checks for `noopener` as well.
  
* **The belt could reopen mid-close.** `S.beltOpen` was cleared inside a 240 mstimeout while the closing animation ran, and 3.0.0 established that rendersarrive from things the reader did not do. Any render inside that windowredrew an open pouch. The state is set when the close starts; the classcarries the animation.
  
* **The share card could not tell a cancel from a failure.**`navigator.share(…).catch(function(){})` swallowed both, so a genuine failurewas silent. `AbortError` returns; anything else falls back to the download —the same shape as the 2.7.3 fallback that made one button safe, which wasguarded where this path was not.
  
* **The negative harness leaked a temp directory on every standalone run.** Theparked item read "eight leaking suites" — the eight ending without`rm -rf "$NEG"`. That is the symptom. `$NEG` is `"$dir/tree"`, so removing itleaves the directory that held it: every suite leaked, the other twenty-sixjust leaked an empty one. `run-all.sh` was never affected. One trap in`_lib.sh`, where the directory is made.
  

### Added

* **Guard 116 — the fonts really carry what the page really renders.** Section106 has never read a font: it compares bytes and hashes to a manifest`qa/subset-fonts.py` writes itself, so narrow-the-range, re-run, re-blessleaves it green over a face that lost glyphs. This was deferred twice as*"needs real cmap inspection and a new dependency."***It needed no dependency.** woff2 is a Brotli-compressed sfnt and Node ships`zlib.brotliDecompressSync`, so the table directory, the `cmap` and its realcodepoint set are reachable in pure Node — which matters, because *"Zerodependencies"* is stated in `guards.js`'s own header and in README's QAparagraph, and shelling out to fontTools would have falsified a guarded claimto fix an unguarded one.**And it found a second hole nobody had recorded.** Section 106's other halfasserts every character the page renders is inside the blessed range — and itscans for literal non-ASCII only. **The star, the caret and the external-linkarrow all ship as `\uXXXX` escapes**, so it could not see them, and fourcharacters the app renders daily are in none of the six faces: `U+2605` ★,`U+25B6` ▶, `U+2197` ↗, `U+203A` ›.**They are not a defect, and recording them is the point.** They are UI marksrather than text, they render from the system font, they always have, andsubsetting four symbol glyphs into five faces would spend bytes for a worseresult. What was wrong is that nobody had decided it — it was invisible, notintentional. Named in `SYSTEM_MARKS` now and asserted like section 107'snested-section exception: if one turns up inside a **subset** face, this fails,because the reason it was excepted has gone. Staleness is judged against thesubset faces only — limelight is not subset, and what the foundry shipped init is not this project's decision. It carries `U+203A`; the five subset facesdo not, which is why the exception is *"not carried by every face"* rather than*"carried by none"*.
  
* **Smoke no longer skips silently in CI.** It exited **0** when `jsdom` wasmissing, so a failed `npm ci` would have passed `npm test` with the suite neverrunning — and the README check-count assertion going unrun with it. The skipsurvives locally, where it is a real affordance for a fresh clone; under `CI`it says the suite did not run and exits 1.
  

### Decided

* **`404.html`'s root link stays `href="/"`, and the mirror's stays wrong.** Theparked item was right that both obvious fixes break the other origin: anabsolute canonical breaks the self-containment rule below it, and `./` breakson any path deeper than one segment, because the 404 is served **at** therequested URL rather than redirected to. **So it is a trade, and the apex takesit.** The mirror has measured zero visits against the apex's hundred, serveswith `noindex` injected, is a waiting room by decision, and retires after thedepth-2 call. Breaking a live rule that keeps the error page dependency-free —the page shown when something is already broken — to fix a link on an originnobody reaches is the wrong way round. Recorded in the guard; do not re-openwithout new traffic evidence.*This was planned as an absolute canonical and the guard rejected it. The guardwas right.*
  

### The P3 tail — closed

Sixty items were being carried as a block nobody had read. **Six were taken** —the three guard holes and the three app items above; the first three werecoverage holes rather than nits, which is why clearing the block wholesale wouldhave been wrong.

**The rest are cleared permanently, not deferred:** two radixes parsing ratingsin formats that genuinely differ · the series-count hint that self-corrects onjump · `subOf()` computed twice · a stray comma · `ratingBadge`/`S.rated` naming ·`S.log = {}; S.log = [];` · smoke's dead Google-Fonts strip · README read threetimes and `sw.js` five times under different names · three hand-synced copies ofthe CSS tokenizer · smoke's fire-and-forget collapse-reboot check ·`make-share-card`'s error-handling hardenings on a twice-a-year tool. Every oneis real and none is worth a line in a release note; carrying them further teachesthe backlog to be ignored.

### Not in this release

**SHA-pinned CI actions** — the one item whose failure mode is a broken CI runrather than a red guard, and the SHAs could not be confirmed from here.**The beacon** — 3.1.0 after Batman Day, and with no Worker: `wrangler.jsonc` hasno `main`, GSC's Links report already gives referring domains, and Cloudflare'sHTTP Traffic panel already gives visits. **The Instagram safe zone**, gated on aStory test. **The devlog** and everything downstream of it.

## [3.0.1] — 2026-08-05

**Four watchers and one line of schema.** No app behaviour changes and nosaved-progress format moves. Every stage here closes a gap 3.0.0 either opened orleft open, which is why it ships the same day rather than waiting: none of it isnew capability, and a watcher that is going to exist should exist before thething it watches drifts.

### Added

* **Guard 113 — every negative suite runs in CI.** 3.0.0 added `negtest300` andnever added it to the shard matrix in `.github/workflows/qa.yml`. The suite rangreen on the release machine four times, including from inside the zip, because`run-all.sh` with no argument runs every suite; CI shards, and all four shardsfailed at the workflow's own *"every suite lands in some shard"* step before`run-all.sh` ran at all.**Third time that step has gone red, second distinct cause.** `negtest252` and`negtest260` reached the pick patterns and missed a hand-maintained fifth copyof the shard lists — fixed then by making the workflow read the patterns out ofitself. This one missed the pattern. **The remaining hole was where the checklived:** only in CI, so a tree could be green on the machine that built it andred on push. It lives in `guards.js` now, which already read `qa.yml` for thefixture-count comment. The workflow keeps its copy — neither restates thepatterns, so two checks of one property is redundancy rather than drift.
  
* **Guard 114 — the README describes the origin that actually serves.** Guard 77inverted in 2.5.1 and fails the build if the retired move offer returns to theapp, but it reads the *served HTML*; the README is not what it reads, which iswhy a paragraph promising that offer survived a documented amendment pass andshipped until 3.0.0. 3.0.0 corrected the prose and left the hole: a fixture waswritten, found nothing to trip, and was removed rather than left passingagainst a green run.**Not a blocklist.** The 3.0.0 audit recommended greping for the retiredmove-offer language; a blocklist passes for every phrasing nobody thought of,and this project already refused that shape once — `negtest172` records why aspoiler-word blocklist was rejected for era notes. What is asserted isagreement: the app injects `noindex` and offers nothing, so the paragraph aboutthat address must name the first and must not present the second as currentbehaviour. **The first draft of this guard failed on the corrected prose** — itmatched "carry that progress across" inside the sentence saying the offer wasretired. That is recorded in the section, because a pattern that cannot tell aclaim from its retraction is the same blocklist in better clothes.
  
* **Guard 115 — three copies of the bat, and they agree.** The glyph is writtenout verbatim in the header markup, in `BATP` for the share card, and in`docs/icon.svg`, from which every PNG raster derives. Nothing asserted theymatch. Cheaper than expected: all three share the 0–100 coordinate space andthe same `translate(0,5)`, so it is string equality after normalisingwhitespace, not geometry. **`BATP` carries no ellipse** — the share card drawsit on the canvas separately — and that is asserted as a difference rather thanpapered over, so three-of-four does not read as a bug later.
  
* **`sameAs` names the project's X profile.** `audit-triage-2.1.0.md` §D declinedsocial profiles in the JSON-LD on the stated grounds that there was no socialpresence to point at. There is now, so the premise died and the conclusion wasre-taken — the only way a decline lapses here. One entry beside the repository;no separate Person or Organization social graph. **It will not move rankings:**entity consolidation shows up in answer engines, and the instrument for that isthe monthly AI-citation check, not the SEO audit.
  

### Changed

* **Guard 42 splits its allowlist into fetched and named origins.** It had beendoing two jobs under one name. An origin the page *fetches* tells a third partysomeone opened the page — that is what the section has always been about. Anorigin the page *names* — a link a reader may follow, a `sameAs` entrydeclaring two URLs are one entity — sends nothing and is read by crawlers.`github.com` was already in the list on the second footing; `x.com` joins itthere. The distinction is written down rather than implied, because the nextaddition will be argued from this list and the wrong reading of it is "theseorigins are fine". They are fine to **mention**; section 29 holds the other half.

### Not in this release

**The beacon stays, and no Worker script was introduced.** `wrangler.jsonc` hasno `main` — this is an assets-only deployment and nothing executes at the edge.Replacing the beacon with Worker-side `Referer` logging would mean puttingJavaScript in front of every request to every route, where a throw is an outagerather than a red build. Recorded in `releases/history-3.0-3.2.x.md` §4 (was `plan-3.0.1.md`) with the findingthat matters more: **visits and referrers are different needs.** Cloudflare'sbuilt-in HTTP Traffic panel already counts visits server-side for free; referrersare a launch-window measurement. After Batman Day the beacon can retire with noWorker at all.

Also unchanged: §106's font verification, the P3 tail, the shell hygiene, CIhardening, and `404.html`'s root link on the Pages mirror.

## [3.0.0] — 2026-08-05

**The shape that changed is the harness, and then the watch link.** MAJOR heremeans a change to the app's shape, and this is the largest one since the Belt:it changes what the build is able to see, corrects a defect in the watch link ofevery entry whose title is shared, adds two controls, and rewrites theinteraction path. **No saved-progress format moved.** Backup codes, restorelinks, the JSON export and every `i:` slug are byte-for-byte what 2.7.5 wrote,and guard 8 and the round-trip checks are unchanged. A code written by 2.7.5restores identically here, and a code written here restores in 2.7.5.

Skips the rest of the 2.x line on the owner's call. Guard 74 holds the versionhistory running one direction, so `2.8.0` and `2.9.0` are gone with it —`releases/plan-2.8.0.md` is superseded but kept, because this release cites itfor the header measurements.

### Fixed

* **`titleYear()` keyed on the title alone, so seven entries searched for adifferent production.** It took the earliest year anywhere in the cataloguefor a given title, which is the right rule for the seasons of one show and thewrong rule for a name two unrelated productions share. `TITLEYEAR` is now keyed`f.t + "|" + f.gi` and `watchLinks()` passes the entry to `watchUrl()` ratherthan the title, because a title cannot say which production it means.The seven, verified in a browser against the shipped catalogue before andafter: *The Batman* (2022) searched 2004 · *Batman* (1989) searched 1943 ·*Batman* (1966), film and series, searched 1943 · *Justice League* (2017)searched 2001 · *Birds of Prey* (2020) searched 2002 · *Batman Beyond* (2014)searched 1999. **The 22 same-universe cases are seasons of one show sharing aURL, which is the intended behaviour, and not one of them changed.**
  
* **Guard 44 enforced the defect**, requiring earliest-year-per-title and onlylooking for collisions between *different* titles — so the harness certifiedthe wrong answer. The rule now reads "the first year this title appears in itsown universe", asserts directly that no entry searches a year no entry of thattitle in that universe carries, and treats two productions sharing one URL asthe failure. Rule, code and fixtures changed in one commit.
  
* **Watched and skipped could both be true, and it survived into exports.**`markWatched()` has always cleared the skip; three merge sites did not — thecross-tab storage event, the JSON restore branch and `applyImport()`. Skip inone tab, tick in another, and the entry rendered `class="film done skip"` andappeared in both the `W` and `S` segments of the backup code and the JSON, soevery denominator on Progress disagreed with the next. `delete S.skipped[k]`at all three. The log-merge dance was written out twice and is now`mergeLog()`. Guard 111, and three smoke checks driving each site for real.
  
* **`#restorebox` was wiped by renders the reader did not cause.** It is rebuiltempty on every `render()`, and renders fire from another tab's storage eventand from the four-second reset-confirm timeout — which is gated on`S.tab === "stats"`, the tab the box lives on. It is now carried across arepaint the way `#q` already was, value and selection. Guard 112.
  
* **`S.open` was one keyspace for two views.** The path's expanded rows and Nextup's peeks shared it, so opening one opened the other. Split into `S.open` and`S.peek`. Next up stays on the full render deliberately — four rows, nothingto save.
  

### Added

* **A Skipped filter in The path, and the Progress scoreboard is threebuttons.** One feature: the scoreboard has counted *Skipped* since 1.x withnowhere to send anyone who tapped it. The tiles reuse the existing`data-act="tier"` handler. Guard 109 holds the relationship rather than themarkup — every `data-tf` must be a filter `chipSet()` offers, and all threecounts must have a tile.
  
* **`docs/_headers` declares a cache policy**, which nothing in this project everhad. `/sw.js` takes `no-cache`; `/fonts/*` takes a year and `immutable`. Guard104 pins both values and fails a blanket `Cache-Control` under `/*`, since thetwo paths want opposite answers. **This is a serving change and takes effectonly on upload** — `_headers` is read by the edge, never by anything in therepo.
  
* **Guard 110** — the viewport is not locked. Section 62's argument that a smallcontrol is acceptable because the reader can zoom rests on this page setting no`maximum-scale`, a recorded WCAG 1.4.4 decision that nothing checked; adding`maximum-scale=1, user-scalable=no` shipped green. `docs/404.html` wasunchecked entirely and is held to the same rule.
  
* **`filmRow()`**, pulled out of `groupBlock()` so the surgical repaint and thefull render share one builder rather than two that drift.
  

### Changed

* **Interacting stops rebuilding the world.** Closing a group cost a full render:148–214 ms at 200 entries on desktop Chromium, of which 2.2 ms was this file'sown code. `rowUpdate()`, `groupUpdate()` and `themeUpdate()` join the existing`tickUpdate()`, and `rate()` moved onto the tick fast path it had been drivingstraight past. `.group` carries `content-visibility:auto` with a`contain-intrinsic-size` floor.**Each falls back to `render()` the moment it cannot find what it expects**, andthe smoke suite's byte-identity gate was widened past `#view` to cover theheader markup, `<html data-theme>` and the theme-colour meta. Every surgicalpath is driven and required to serialize byte-for-byte identically to a forcedfull render — 144 comparisons.
  
* **Section 29's external-script sweep matches the page it guards.** The patternrequired a double-quoted `src`; the only external script the page has evercarried — the disclosed Cloudflare beacon — is single-quoted, and `git log -S`says it always was. The match array was empty on every run since the sectionwas written, so the carve-out below it had never executed and a single-quotedscript added today shipped green: section 42's origin sweep is an allow listand already allows `github.com` for links. Quote style is out of the pattern,and an empty sweep now fails on its own.
  
* **Section 43 pins the whole CSP, and refuses to hash an ambiguous script.** Itpinned four of eleven directives: deleting `static.cloudflareinsights.com` from`script-src` shipped green, and rewriting the six unchecked directives to `*`shipped green. Every declared directive is pinned to its exact value, adirective the page declares that nothing pins fails, and `script-src` may carryonly the hash and the disclosed beacon origin.**And the second half was worse than under-coverage.** This section hashed the*first* plain `<script>` while section 46 parses the *longest*. With one scriptthey agree by luck; add a small inline script above the application block andsection 43 reports a stale hash and `npm run bless` writes the hash of thedecoy — both suites green over a page whose CSP blocks the entire app, andjsdom does not enforce meta CSP so smoke cannot see it either. More than oneplain `<script>` is now the failure, because a single hash cannot describe two.
  
* **`docs/sw.js` is compiled, not just grepped.** Five sections read its text andsmoke never registered it, so a syntax error appended to it left both suitesgreen while offline broke for every visitor. Section 11 binds the source andruns it through `new vm.Script()` — the failure class 2.7.4 added that for,applied to `index.html` and never extended to the other file that ships.
  
* **Section 91 has a byte ceiling: 60,000.** It read `buf.length` only to printit, so a valid 1200×630 PNG of 3,025,613 bytes passed. The card ships at 19,656bytes only because of a manual PIL quantize documented at the top of`qa/make-share-card.mjs`; the raw render is ~325 KB.
  
* **Section 108's fallbacks are reachable.** `slice()` *throws* on a missingmarker, so `slice(…) || HTML.slice(…)` never reached its right-hand side and`fail("shareCardBlock() is gone")` was unreachable with it — renaming thefunction ended the run with a raw stack trace, the exact failure mode`optionalFn()` was written to prevent twenty lines above its own definition.`sliceOr()` is the version that keeps the promise.
  
* **Smoke's NW1 check tests NW1.** It asserted the code starts `NW3W` and thendid `code.replace(/^NW2/, "NW1")`, which cannot match — so it imported an NW3code and duplicated the line below it, and deleting NW1 support from the appleft it green. An NW1 code is now built, because the 1.0.0 rating layout is abranch `importCode()` takes only below version 3. The forward-compat probebuilds a genuinely later major instead of calling an NW3 code "a future NW2".
  
* **The negative harness stopped passing against green runs.** `run_case` greppedthe *whole* suite output, and a green run prints ` ok <name>` and` · <note>` — so any fixture whose expected string was a check *name* ratherthan a failure *message* matched success. All 392 expects were extracted andtested against captured pristine output: **22 matched a run in which nothingwas broken.** The green lines are filtered before matching. An exit-code gateand a `✗|FAIL` filter were both tried and rejected on evidence — the firstbreaks `negtest176`'s three warning-only fixtures, the second breaks the twothat expect a harness error.**Three of the 22 were hiding real holes**, and all three are fixed at themutation rather than the harness: `negtest172` named a check its mutation didnot trip (and the check it named had no fixture of its own, which now exists);`negtest185`'s mutation made a value consistently wrong while the check assertsthe value does not *change*; `negtest251` left guards exiting **0**, becausenothing asserted that `_headers` stays out of the offline precache though`share.png` and `orders.txt` have carried that assertion since 1.9.0 and 2.6.0.Section 104 carries it now.
  
* **`negtest183` and `negtest273` re-anchored.** Four fixtures were pinned to`125.7` and `r="20" stroke-width="4"` and reported `SETUP BROKE` after the ringmoved — the designed behaviour, working. Section 47's new assertions, section80's `#ringTrack` agreement and its `100%` label floor all gained fixtures.
  
* **`var ids` was declared twice at guards file scope with different meanings.**The catalogue one is `filmIds`.
  

### Documentation

* **README described a feature retired in 2.5.1** — the offer to carry progressacross from the old origin. `offCanonical()` only injects `noindex`, and guard77 fails the build if the offer returns; the README is not what 77 reads, whichis how it survived a documented amendment pass. `wrangler.jsonc` pointed at thesame retired offer, and `qa/smoke.js` documented an `origin` phase that left`PHASES` with it in 2.5.1 — along with the `afterOrigin()` hop named after it.
* **NOTES.md amendments.** The Galactic Guardians slug paragraph carried no*Amended* marker against the 1.8.1 rename recorded further down the same file ·"Parked by decision", whose three items have all shipped and whose `og:image`claim had been false since 1.9.0 · the Workers migration, still framed as alive option four releases after it landed · a "2.2.1" citation with noCHANGELOG entry behind it.
* **CHANGELOG 2.7.4's orphaned paragraph** — an indented block with no headingover it, the only structural break in 69 entries. It is a `### Fixed` item.
* **`sw.js`'s "133 KB index.html"** is ~180, and 133 now collides with the filmcount · section 104's comment credited the CSP hash to "section 10" when it is43 · the README's file table omitted six `qa/` files.
* **`NOTES.md` carries the reasoning** for the watchers, the watch-link key, themerge invariant, the restore box, the surgical paths and the cache policy.`docs/index.html` carries none of it: guard 65 allows two comment blocks inthat file and the explanations go where they are read.

### Not in this release

Recorded so it is not mistaken for missed. **Section 106's font verification** —it compares hashes to a manifest the subset script itself wrote, sonarrow-run-widen-run leaves it green over tofu. A genuine hole; real coverageneeds cmap inspection and a new dependency, and it is too big to ride a releasethis size. The ~60-item P3 tail, the shell hygiene, CI hardening, and`404.html`'s root link on the Pages mirror, which wants a decision rather than apatch.

**And one gap this release opened and did not close:** nothing guards the READMEprose corrected above. Guard 77 reads the served HTML, so the retired move offercan return to the README without failing anything. Left as found rather thanfixed, because a new watcher is new scope.

## [2.7.5] — 2026-08-04

The header's two flankers finally match.

### Changed

* **The bat and the ring both draw 44px.** 2.7.3 took the bat from 32 to 40 toclose a gap against what was described as a 46px ring. **The ring was never46.** Its *box* is 46; what it draws is a stroked circle at `r="19"` with a4px stroke — outer edge at radius 21, so **42px across**, with 2px of slack itnever used.So the correction that closed the gap was itself measured against the wrongnumber. The ring's radius is now 20, which draws 44 inside the same 46px box,and the bat is 44. Two flankers, same drawn width, 1px of air each — for thefirst time the row is symmetric in what a reader sees rather than only in whatthe box model reports.`stroke-dasharray`, `stroke-dashoffset` and the offset the script computes allmove with the radius: 2πr for r=20 is **125.7**. Section 80 derives thecircumference from the radius rather than holding a constant, so it checkedall three against the new value without being told.
  
* **The guard now checks the two against each other.** It held a floor — *thebat is at least 38px* — which was a number produced by narrowing a gap, not bymeasuring anything. **What actually balances the row is that both flankersdraw the same width**, so that is what it asserts: the bat's width against`2 × (r + stroke/2)`, within a pixel, plus a ceiling at the 46px column so thebat cannot overflow its own flank and start taking the wordmark's room on anarrow phone.A floor would have passed 44 and 42 as happily as 44 and 44. The invariantcatches a change to *either* side, which a constant never could.
  
* **The build line drops below the caveat and centres.** *Announced dates canmove.* is a statement about the catalogue; *Build · updated · read the source*is provenance. They were one run-on line, then two adjacent ones. Now thesecond sits a full line below and centred under the first, which is what italways was: a footer, not a continuation.
  

### Why PATCH

Two CSS widths, a radius and the three numbers that follow from it, and a`<span>`. No catalogue change, no behaviour change, nothing touching savedprogress.

## [2.7.4] — 2026-08-04

The source link finds its seat, and the page checks that it parses.

### Fixed

* **The note breaks after its first sentence.** It read *Announced dates canmove. · Build 2.7.4 · updated 2026-08-04 · read the source* — a middot placedafter a full stop, joining a caveat about the catalogue to a run of buildprovenance as though they were one list. They are two different statements andthey now sit on two lines. Not guarded: nothing depends on it, and a linebreak that carries no decision is exactly the sort of thing that should notacquire a rule.

### Changed

* **The source link moved to Progress's build line, and it is legible now.**2.7.3 put it inside Home's colophon by wrapping the words *free software underthe AGPL* — and shipped it with **no styling at all**, so it rendered in thebrowser's default blue inside a line of dim uppercase mono. Reported in thesoak within the hour, which is the correct speed for a defect that loud.Two fixes, and the second is the better one. It now sits beside `BUILD` and`BUILT` at the bottom of Progress, reading *read the source* — the app's ownmeta line, where a reader who wants the version is the same reader who wantsthe code. Home's colophon says *free software under the AGPL* in plain wordsagain, which is a statement rather than a control.**It inherits its line's colour and carries a thin underline.** Colour aloneis not an affordance for everyone, so the underline does the work; hoverbrightens it. Both the seat and the underline are guarded — the first becauseit was chosen, the second because shipping it unstyled is exactly whathappened once.
  

### Added

* **A guard that the page's own script parses.** This release wrote`...+BUILT+ \u00b7 <a href=...` — one dropped quote in a concatenated string —which is a syntax error that would have stopped the app running **at all, onevery browser**.The harness did catch it. `smoke.js` builds the page in jsdom, so it died —but it died throwing a raw stack trace with a line number, which is not thesame as being told the file will not parse. On a 180 KB single file that isthe difference between a minute and an hour.The whole script block is now compiled with `new vm.Script()` before anythingelse forms an opinion, and the failure says what happened. It guards the oneclass of mistake this project is most exposed to by construction: **everyrelease edits string-concatenated markup by hand, and a dropped quote lookslike nothing in a diff.**
  

### Why PATCH

One link moved, one CSS rule, one guard. No catalogue change, no behaviourchange, nothing touched in saved progress.

## [2.7.3] — 2026-08-04

One button, a header that balances, and a link to the source.

### Changed

* **The share block is one button: *Share the night*.** It was two, and thewrong way round — a browser that could share got *Share the night* **and***Download the card*, while a browser that could not got *Download the card*alone. The two-button state was the capable one, which read as the apphedging about its own primary action.**The second button was doing more work than it looked.** `navigator.share`existing does not mean **file** sharing works, and the old handler answeredthat case by saying so:
  
      if(navigator.canShare && !navigator.canShare({files:[f]})) toast("Sharing files is not available here");
  
  That was survivable only because Download sat beside it. Cutting to one buttonand leaving the handler alone would have left a reader on such a browserpressing the only control on the block and being told no, with nowhere to go.**So the button falls back to downloading instead of reporting failure.**Share where sharing works; download everywhere else; the existing *Carddownloaded* toast tells the truth after the fact. The label is honest in allthree cases, because *share the night* is the intent and the mechanism is thebrowser's problem. The app cannot know which case it is in until it has thefile, so one label plus a truthful toast beats a label that tries to predict.The fallback is guarded. It is the entire reason one button is safe.
  
* **The header balances.** The bat went from 32px to 40px and the wordmark from21px to 24px.**Nothing was ever misaligned**, which is why this lasted eleven releases. Therow is three flex columns, both flankers boxed at 46px, wordmark centredbetween them — every box exactly where it claims to be. What was lopsided wasthe *mass inside the boxes*: the bat drew at 32px with seven pixels of air oneach side, against a ring that fills its 46px edge to edge, and covered**26.7px vertically against the ring's 46**. Light on the left, heavy on theright, and the eye reads that as crooked while every measurement says it isnot.The two numbers moved together because enlarging the title alone shifts massto the centre and re-breaks the balance. They are guarded together for thesame reason: one decision, not two.**The ceiling is the narrow phone.** At 375px the row leaves about 219pxbetween the flankers. *NIGHT WATCHER* in uppercase Limelight measures roughly187px at 24px, so it fits with room — and would not at 28. `.wordmark` is`flex:1` with `min-width:0`, so it shrinks silently rather than pushing back:nothing would go red, the title would just start wrapping on somebody'sphone. The guard holds both ends.
  

### Added

* **The footer links the source.** Five audits recommended it: the JSON-LD hasalways claimed the repository under `sameAs`, so machines were told andreaders were not. Minimal, on the owner's word — the words *free softwareunder the AGPL* became the link rather than a new line arriving.

### Removed

* **The `cardsave` handler**, which the missing button left unreachable. Guardednow from both sides: a button with no handler does nothing, and a handler withno button is code no reader can reach. They come back together or not at all.Worth recording that **the first run after removing the button was fullygreen.** A dead handler is not a failure any existing check could see, whichis the same shape as the Mature badge in 2.7.2: nothing fails over somethingthat is merely unreachable.
  

### Why PATCH

Two CSS values, one button, one link, one dead handler removed. No new files, nocatalogue change, no behaviour change to saved progress.

## [2.7.2] — 2026-08-04

Three things that were already true in the data and missing from where theymattered.

### Removed

* **The Mature badge, four releases after the thing that replaced it shipped.**The decision is dated 1 August 2026: *replace both Mature and Kids with thefilm rating itself*, because *"PG-13 and R were both Mature before, and G andPG were both nothing."* Kids went. Mature stayed, on **39 entries** — 12 ofthem rated R, 13 TV-MA, and **eleven rated PG-13 or TV-14**, which is theexact imprecision the ratings were adopted to end. The legend admitted it: theswatch read *"R or close."*It survived because nothing was ever going to fail over a badge that wasmerely redundant. 1.7.0's note said the rating badges were not in that releaseand that *replacing* Mature and Kids was the next round's job; the ratingsarrived, the replacement did not, and what shipped was an addition.**The accepted cost, decided by the owner:** the three unreleased Knightfallentries now carry **no maturity signal at all** until they release. Not asofter one — none. Part 1 gains its `R` when it goes digital on 25 August;Parts 2 and 3 are undated. The alternative was keeping a badge that means*mature* on entries where it would have started to mean *we do not have arating yet* — a different sentence in the same box.No saved progress is touched. Badges were never frozen; only `i:` slugs are.
  

### Added

* **The era notes reach the crawlable seed.** Anyone arriving withoutJavaScript — and any text-only crawler, which is how several AI indexers reada page — saw eleven bare labels where the app shows a sentence each. The noteswere already written, already one source in `ERAS`, already guarded bysection 81 for what an era note may say: *a period, not a story.* So this isexisting data reaching the surface engines read, not new copy, and nothing isnow written twice.Era 0 stays out of the list, here as in the app. It is not a stage of a life;it collects the entries that have no place in one.
  
* **The page points at `orders.txt`.** One `<link rel="alternate"type="text/plain">`, and the reason it is worth a line in a changelog is howit was found: a six-agent SEO/GEO/AEO audit crawled the live site andrecommended, as new work, *"a machine-readable catalogue export for secondarycitations."* That export has been served since 2.6.0.Checked afterwards: `orders.txt` was referenced from `llms.txt` and nowhereelse. Section 105 was written around the sentence *an export nothing points atis an export nothing reads*, and it faithfully held the one pointer thatexisted — it could not know the page itself was silent.**It stays out of `sitemap.xml` on purpose.** The crawlable seed alreadycarries all 200 entries and so does `orders.txt`; submitting both for indexingasks a search engine to choose between two near-identical bodies on onedomain. Discoverable is not the same as indexed.
  

### Changed

* **The badge-kind guard checks the `BADGE` map instead of trusting it.** Itslist of kinds was hand-kept, so a kind present in the map and nowhere else wasinvisible to it — which is close to how Mature lasted four releases. The mapand the list now have to agree in both directions.

### Not done

* **A footer link to the source repository.** The page's JSON-LD claims the repounder `sameAs` and there is no clickable link to it anywhere: machines aretold, readers are not. It is one `<a>`, and it is held to ride with theSeptember page update rather than arriving alone.

### Why PATCH

Data and copy. A badge removed from 39 entries, existing notes reaching anexisting surface, one `<link>`. No new files, no new catalogue entries, nobehaviour change, no change to saved progress.

## [2.7.1] — 2026-08-04

Four cosmetics from 2.7.0's soak. One of them is a retraction.

### Fixed

* **The era note touched the line above it.** An open group draws a 1px ruleunder its header, and the note's first line sat directly on it — close enoughto read as a rendering fault rather than as spacing. The space is on`.gbody`'s padding rather than the note's own margin, deliberately: with azero-padding parent the child's top margin collapses straight out of the boxand nothing moves.
  
* **The content rating sat beside the Where-to-watch link.** That placement was2.2.0's answer to its own soak note, and it made the rating read as part ofthe link instead of as what it is. It is a badge, and it now sits with theother badges on every surface a reader decides from — the entry row, theNext-up hero, and the Then peek.Section 92 had pinned the old arrangement as a literal string, twice, so itfailed on the fix rather than on a regression. It now holds the rule instead:every deciding surface carries the rating immediately after its badges, andnone carries it next to the link. **That is the second guard this month thathad to be widened from a layout it was never meant to defend** — the firstwas the reduced-motion block in 2.7.0. A guard that pins punctuation stopsprotecting the decision and starts protecting the wording.
  
* **The share block reads like every other block on the page.** Title,description, then buttons — left aligned. It had been title, buttons, then acentred note, which made the description read as a footnote to the buttonsrather than as the thing the block is.
  

### Reverted

* **The share card's bottom block is back at 1590 / 1700 / 1750.** 2.7.0 liftedthe bars, the rule, the strapline and the domain up by 145px to clear thestrip Instagram reserves for its reply bar, and moved the bat and its glow upwith them.The reasoning held. The release shipped it **without the one-minute Storytest that was written into the plan specifically to gate it** — and on a realcard it left a third of the canvas empty under the domain. The balance thecard already had was worth more than the risk it was avoiding.Reverted, and guarded, because the argument for moving it is still true andstill on the record, so it will read as unfinished work to whoever finds itnext. It is not. **If it is ever revisited, the answer is not to shift theblock again — it is to keep the composition and shorten the canvas, and thatwants the Story test first.**
  

### Added

* **Guard 108**, holding all three of the fixes above. They are one valueeach — a padding, a coordinate, the order of two elements — which is exactlythe shape that gets tidied back. The first draft of this release's negativesuite failed on three fixtures for the right reason: nothing was holding them.

## [2.7.0] — 2026-08-04

The last release before the freeze. Lighter, quieter, and honest about its own edges.

### Changed

* **The webfonts are subset. The first visit is 55,864 bytes lighter.** Sixfaces shipped at 118,860 bytes — 39% of everything a new reader downloads,and more than the page itself compresses to. None of it was dead files: allsix are referenced and all six are precached. It was glyph coverage nobodywas ever going to use. Five are now cut to Basic Latin, Latin-1 andpunctuation, and the payload for a first visit falls from 302,514 bytes to246,650.**The range is wider than the catalogue on purpose.** Subsetting to exactlythe 99 characters the catalogue contained today would have saved another21 KB and put an accented title one data patch away from rendering as blankboxes, on a catalogue whose whole design is that it takes data patches.**Guard 106** closes what is left: every character in the page and in`orders.txt` must be inside the blessed range, so an unusual letter fails thebuild on the day it is added rather than turning up in somebody's screenshotthree weeks later.**Limelight is left whole**, and the reason is legal. Its OFL header reads*"with Reserved Font Name Limelight"*; Anton's and IBM Plex's do not. AModified Version may not carry a reserved name as presented to users, sosubsetting it means renaming the family in the font, in `@font-face` and in`--deco` — real churn and a licensing judgement, for 10.3 KB. It keeps 84% ofthe saving and none of the question. `qa/subset-fonts.py` regenerates therest and blesses a manifest of sizes and hashes, so the fonts and the recordof what they contain can only move together.
  
* **The favicon is a file now, and search engines can finally see it.** The SVGicon shipped inline as a `data:` URI: one fewer request, renders perfectlyeverywhere, and invisible to Google — whose favicon pipeline **crawls** theicon and needs a stable URL with a content type. A `data:` URI has neither.It is now `docs/icon.svg`, precached like every other app asset. Guard 106'sneighbour fails the build if any icon link goes back to `data:`, becauseinlining it is a defensible optimisation on every ground except the one thatmatters.
  
* **`manifest.json`'s `id` was wrong, and 2.7.0 is the last cheap moment to fixit.** It read `/Night-Watcher/` — the GitHub Pages *project page* identity,which on the apex resolves to a path that does not exist. Changing a PWA's`id` orphans existing installs, which is why the standing decision was toleave it. That decision assumed a fixed install base. The measured base wasnear zero and Batman Day was five weeks out, so the cost of this change fellto roughly nothing today and rises with every install after. Paid once,deliberately. Guard 83 now pins `/` with the same force it pinned the oldvalue, and there is no second exception coming.
  

### Fixed

* **The belt closes without the page snapping.** The staged exit always played— the pouches fading and lifting — and then the whole view was rebuilt at240 ms and everything below jumped up in one frame. The exit animated; thereset did not.The earlier reading was that this could not be fixed in CSS, because an`innerHTML` replacement cannot be transitioned. True, and beside the point:the pouches animate on `transform` and `opacity`, neither of which affectslayout, so the belt kept its full height right up until the swap. Collapsingthe belt's own box over the same 240 ms means the page has already settled bythe time the swap lands, and there is nothing left to snap. **The re-render isnot retimed and the handler is untouched.** Reduced motion still gets thehonest instant close, box and all, and that is guarded rather than assumed.
  
* **A forced reflow on every render.** `render()` finished by clamping therestored scroll position against `document.documentElement.scrollHeight` —reading layout immediately after writing `innerHTML`, which forces asynchronous layout of the entire document. Around 216 ms on a 200-entry list,every time anything re-rendered, to compute a number the platform alreadyapplies: `window.scrollTo` clamps to the scrollable range by itself. The readis gone and guarded, because it is the kind of line anybody reasoning aboutscroll restoration from first principles would add back, and jsdom has nolayout, so nothing in the harness would ever have caught it.
  
* **The share card's link sat where Instagram covers it.** The card has been1080×1920 at 9:16 since 2.0.0, so the size was never the problem — theplacement was. `nightwatcher.life` sat at y=1750, 91% down, inside the stripthe reply bar reserves. The one element that turns a Story view into a visitwas under the interface. The bars, the rule and both text lines moved up, andthe bat and its glow moved with them so nothing collides.
  

### Added

* **Guard 107 — the section census.** Carried on the backlog since 2.2.0. Guard66 already held the numbering; this holds the two properties underneath it,both of which break silently: a section that contains no `fail()` protectsnothing, and a section that never runs passes for the same reason an emptyfile does.**It found one immediately.** Section 24 is not at file scope — it sits insidesection 23's `else` branch, because it needs the path tables section 23extracts. It is kept, on a condition that is now asserted rather than assumed:the only branch that skips it is the branch that already calls `fail()`, so askipped section 24 can never coexist with a green build. Lifting it out wouldleave it reading variables the failing branch never assigned — a stack tracein place of a clean red. One nested section, named, with its reason. A secondone fails the build until somebody argues for it too.
  
* **CI runs on `actions/checkout@v5` and `setup-node@v5.`** Every job waswarning that Node 20 is deprecated and being forced onto Node 24. Noise now, ared run whenever the runners stop forcing it — in a repository that is aboutto go quiet for a month.
  

### Not done, on purpose

* **Stage B, the QA trim menu, drops.** `GUARD_ONLY` needs the guard filescoped, and the sections that are bare top-level statements share modulescope. That is a restructure of the file holding every guarantee, on the lastrelease before the year's largest day. The drop condition was written intothe plan before the build rather than argued during it. The census — the partthat was actually worth having — shipped without it.
  
* **Stage D was already done.** `SMOKE_ONLY` has scoped smoke runs by phasesince 2.2.0. It stayed on the backlog for four releases as a thing to buildafter it had been built.
  

### Why MINOR

Six replaced font assets, a new served file, two new guards. No new catalogueentries and no change to saved progress.

## [2.6.0] — 2026-08-04

The catalogue answers in plain text.

### Added

* **`docs/orders.txt` — the whole catalogue as a text file.** All 200 entries,grouped by continuity, each with its year, format, tier and content rating,plus the announced titles marked *NOT OUT YET*. It is served at`/orders.txt`, it is 18 KB, and it costs the page nothing: it is a separatefile that the app never fetches and the service worker never caches.The audience is the one `llms.txt` was written for — anything that reads textrather than HTML. `llms.txt` describes the site; this hands over the data.`llms.txt` now points at it, and guard 105 fails the build if that pointerever goes missing, because an export nothing links to is an export nothingreads.**It carries one ordering, and the reason is written down so nobody"completes" it by accident.** By universe needs no sort — each continuity'sarray *is* its spoiler-safe order, the same fact the crawlable seed relieson. Bruce's life and Release order are produced by two anonymous comparatorsinside `buildGroups()`, and the guards can only extract *named* functionsfrom `docs/index.html`. Reproducing those two sorts in `qa/guards.js` wouldbe a second implementation of the app's ordering — precisely the thing thisproject refuses to have. Naming them in `index.html` so both sides share onesource is a `buildGroups()` refactor, which is app logic, and app logic doesnot ride a safe release.The loss is smaller than it reads. Release order is derivable from the file —every entry states its year. Bruce's life is not, and it is also the orderingthe app itself calls *an interpretation rather than a canon*, so the app isthe honest place for it. The file says as much in its own header rather thanquietly shipping two thirds of a promise.It is **generated and blessed**, like the crawlable seed and the ItemList:rebuilt from `PATH`, `FILMS` and `tierOf()` on every run and compared bytefor byte, with `npm run bless` as the only way to update it. A hand-kept copyof 200 entries would be stale within one release and nobody would read itclosely enough to notice.
  
* **Guard 105.** Regenerates the export and fails on any drift — a title, ayear, a rating or an ordering that moved while the file did not. It alsofails if `orders.txt` is ever added to the offline shell, for the same reason`llms.txt` and `404.html` are excluded: crawler assets have no business in anapp cache.
  

### Why MINOR

A new file is served that was not served before. `docs/llms.txt` and`docs/404.html` arrived the same way in 2.1.0, and that was a MINOR. Nothing inthe app changed — no markup, no behaviour, no saved progress.

## [2.5.2] — 2026-08-04

The progress ring says its own number out loud, and two answers come back.

### Fixed

* **The progress ring's accessible name contained everything except thenumber.** Its visible text is the percentage; its `aria-label` was a fixed*Open progress*. A screen reader announced the verb and never the value, anda voice-control user could not say the one thing they could see. The name isnow built from the same string as the visible text, in `renderHead()`, so thetwo cannot drift: one value, written twice, computed once.It is worth recording **why this survived four releases**: Lighthouse scoresAccessibility 100/100 with it present, because `label-content-name-mismatch`sits below the scoring threshold. Two independent audits said "someinteractive elements" without naming any; the third named it. A perfect scoreis not the same as no findings, and this is the evidence.
  

### Added

* **Two straight answers, restored.** *Does it track what I watch?* and *Wheredo the Joker films fit?* 2.1.0 planned seven questions and shipped five,cutting these two when the file hit 165.1 KB against a 165 KB ceiling — theplan's own "FAQ trims first" rule, applied under duress. 2.5.0 raised theceiling to 200 KB, so the constraint that made the trim correct no longerexists. Both render into the seed and mirror into the `FAQPage` schema fromthe same `buildFAQ()` source, blessed, so a reworded answer moves both orfails the build.
  
* **`qa/negative/negtest252.sh`** — 11 fixtures: the accessible name losing thenumber, losing it while keeping the words, the ring rendering no startingpercentage, the button ceasing to be a button, `renderHead()` no longerupdating the name, the percentage computed twice instead of shared, eachrestored answer cut from the seed, an answer reworded on one side only, andthe `FAQPage` dropping or rewording a question the seed still answers.
  

### Changed

* Guard **80** now holds the ring's accessible name alongside itscircumference. Same section on purpose: the radius, the percentage and thename are one object, and changing any of them alone is the failure it existsto catch.
* The `docs/_headers` entry above listed five `Permissions-Policy` directives;the file has six. `interest-cohort` was missing from the prose only. Recordedbecause the omission made the live header look like it was coming from theinert dashboard rule rather than the file, and cost an hour proving otherwise.

## [2.5.1] — 2026-08-04

The beta address stops being offered a way out. Nothing a reader onnightwatcher.life has ever seen changes.

### Removed

* **The move offer, retired.** `moveBanner()`, `moveHid`, the `.moved` bannerwith its `movego` link and `movelater` dismissal, and the `.moved`/`.movego`CSS are gone from the app. It shipped in 1.8.0 to carry a returning reader'sprogress from the GitHub Pages address to the apex, because progress lives in`localStorage` and only JavaScript on that origin could ever read it. It wasright to build and it is right to retire: **it was measured before it wasremoved** — over the whole life of the analytics beacon, 100 visits on theapex and none on the beta address, with one referral from it to the repositoryin fourteen days. The recorded reason it was kept alive was beta readers'per-origin progress, and that reason is now a checked fact instead of anassumption.
* **The `origin` smoke phase**, and with it the old-origin document the suitebuilt to observe a banner that no longer exists. `SMOKE_ONLY` now takes`main`, `css`, `blocked`. Smoke drops from 287 checks to 278.

### Kept, deliberately

* **`offCanonical()` survives**, doing one job instead of two. It no longerdecides whether an offer renders; it is the only thing that marks thestill-serving mirror `noindex`, and the canonical link is a hint a crawler maydecline. Retiring the offer was never a reason to start competing withourselves in search a month before Batman Day.
* **Both addresses still serve.** Pages still has no custom domain, because acustom domain writes a `CNAME`, turns the old address into a 301, and aredirect runs no JavaScript — which would strand anyone who never moved,permanently, from data still on their own disk. That has not changed and isnot what was retired.

### Added

* **`docs/_headers`** — `Referrer-Policy: strict-origin-when-cross-origin`,`X-Frame-Options: DENY`, and a `Permissions-Policy` denying geolocation,camera, microphone, payment, USB and `interest-cohort`. The site had **no security headers atall** before today beyond what a meta tag can carry.**Why a file and not a dashboard rule:** a Cloudflare Response HeaderTransform Rule was created for exactly this, deployed, showed *Active*, andset nothing — verified against a cache HIT, a cache MISS and a 404. Customresponse-header transforms do not apply to responses a Worker generates, andevery route here is Worker-served. Managed Transforms are applied at adifferent stage and do survive, which is why HSTS (`max-age=2592000`, nopreload) and `X-Content-Type-Options: nosniff` are set at the edge anddeliberately **not** duplicated in this file. The CSP stays in its meta tag,where section 10 blesses its hash against the one inline script.
* **Guard 104** holds all of that: the file exists, its `/*` rule applies toeverything, each of the three headers is present with its value, and the twothe edge owns are *absent* here — one header, one place.

### Changed

* **Guard 77 inverted.** It used to prove the move offer was there; it now failsif `moveBanner`, `moveHid`, the `.moved` markup, `movelater`, `movego`, the`.moved` CSS or a reference to the retired address ever returns, and it failsif `offCanonical()` is deleted as apparently-dead code. Sections run 1..n withno gaps and retired things invert rather than vanish, which is the establishedpattern.
* **`negtest180` retires its origin wing** and gains the inverse fixtures: themachinery creeping back must fail the build. **The 2.2.0 §3.6 memo skip closeson its own** — it existed because the suite pinned the `moveBanner` literal,and there is no literal to pin.
* `NOTES.md`'s "Two origins, on purpose, forever" and "The offer is conditionedon where it is" carry open amendments rather than edits; `SECURITY.md`'sheader caveat now describes what the canonical site actually sets.
* Weight: **178.1 KB raw / 51.4 KB gzip** against 200 / 80 — one and a halfkilobytes lighter than 2.5.0.

### Ops — outside the tree, recorded here because the repo cannot show it

* **SPF added** to `nightwatcher.life`: `v=spf1 -all`. The domain has no MX andsends no mail, so `-all` is the complete statement. DMARC was already live at`p=quarantine`. An RFC 7505 null MX was attempted and **rejected byCloudflare's dashboard validator** — recorded so it is not retried there.
* **HSTS enabled**, `max-age=2592000`, `includeSubDomains` off, **preload off** —the reversible configuration, on purpose.
* **A second Cloudflare Web Analytics property was deleted.** It was set to*"Enable — the JS Snippet will be automatically injected"*, meaning edgeinjection was switched on. Had it fired, the page would have carriedthird-party JavaScript that is **not in `docs/index.html`**, which`qa/guards.js` reads — so the "no third-party code" claim could have brokenentirely outside the guards' field of view. Zero recorded views; nothing lost.
* The obsolete `Add Cloudflare Workers configuration` bot PR was closed.

## [2.5.0] — 2026-08-04

The release that emptied the backlog. Tagged `v2.5.0` — the first tag sincev2.0.0, on the owner's word. Everything that was open went in, became arecorded decision, or became a dated trigger; the morning after thisrelease, the backlog is the trigger table and nothing else. Still noKnightfall — the trigger fires 25 August, and will number itself 2.5.1.

### Fixed

* **The belt stops "reloading."** Three soak sightings, one defect: pickinga format, picking a type, or changing tabs with the belt open replayedthe pouch entry animation, because the base rule carried it. Theanimation is scoped to an `opening` class now, rendered exactly once —the belt handler's flag lives for the one render that opens. Re-renderswith the belt open update content with no theater. Reduced-motionunchanged. Guard 96 holds the scoped rule, the flag's one-render life,and that the base rule stays bare.
* **The ratings description flows beside its badges.** The Path's footerlegend rendered `PG-13 / TV-14` alone with the whole sentence droppedbelow — the sentence was one indivisible flex item. `.rleg` is inlineflow now: text wraps word-by-word beside vertically-aligned badges, likeevery other legend row. Guard 99 #3 re-anchored to the new mechanism.

### Added

* **seed-200.** The crawlable seed's continuities section carries **all200 entries**, each under its universe in spoiler-safe order — year,format, series marked as such, the curated 74 keeping their essential/core distinction, and NOT OUT YET honest in the seed exactly as in theapp. Generated from the data and blessed (guard 78); the JSON-LDItemList stays the curated 74 — the recommendation is a list, the seedis a catalogue.
* **`qa/negative/negtest250.sh`** — 16 fixtures across every guard thisrelease touched, including one that deletes a file to prove theharness's heal step brings it back.

### Changed

* **The ceilings — the owner's numbers, 4 Aug.** Raw **165 → 200 KB**(the fourth raise) and gzip **50 → 80 KB** (the FIRST gzip raise ever),authorizing seed-200 and honest growth after it. The file ships at179.7 KB raw / 52.2 gzip. The discipline is unchanged: arithmetic stillfails the build, and every raise is a recorded decision.
* **Persistence is a trailing debounce (report §3.7).** persist() used toserialize the whole state per call — a write per tick. Calls nowcoalesce (200 ms); `flushPersist()` writes immediately; **pagehide andvisibilitychange-to-hidden flush**, so a closed tab inside the windowloses nothing. Guard 102 holds the three-legged contract; smoke provesthe coalescing behaviorally (a burst writes zero, the flush writes one).
* **The tick path repaints one group (report §3.8).** toggleWatched andtoggleSkip rebuild the row's group through `groupBlock()` — the samebuilder the full render composes from — plus the header through`renderHead()`, instead of innerHTML-ing the world. Filters, search,and other tabs fall back to the full render. **The gate:** smoke drives48 ticks across paths, formats and scopes, and after each one a forcedfull render must serialize byte-for-byte identical — it does. Guard 103holds the shape; the report's bail-out clause was not needed.
* **The guard-fixture harness heals instead of re-tarring (report §5.3).**`_lib.sh` unpacks the tree once per suite and restores between fixtures— created files removed, deleted files brought back, rewritten filesre-copied (mtime + manifest). Measured honestly: the unpack it removescost ~11 ms per fixture against ~5 ms of heal, so the win is small —it rides because it was the last backlog line, and the suite proves itby deleting a file mid-run.

### Decisions closed by the owner, 4 Aug — recorded here, never relitigated

* **Backup-codes kept-for-newer edge case: CLOSED** — and in fact alreadyfixed: exportCode() has walked S.watched since the NOTES entry "A codecarries your progress, not the catalogue." Doubly dead.
* **The mistyped slug** (`...-galactic-guardians-198-1985`): **CLOSED.**The migration window shut at 1.8.x; it is what that slug is.
* **`const` conversion: CLOSED.** The harness enforces the ES5 style; theoptimization report's rejected list re-affirms it.
* **Devlog: handed to marketing** (post–Batman Day material).
* **Landscape progress card: a trigger** — built only if embeds demand it.
* **The pre-1.8.0 backlog document is retired.** Audited against thetree: every remaining line was already shipped, already fixed, or isclosed above. The import-tolerance note — its last open line — is nowa NOTES.md paragraph, and the retired-ids bless warning learned its onerecorded exception so it stops training people to skim warnings.

## [2.2.0] — 2026-08-03

The tune-up. Two inputs, no new features: the 2.1.0 soak ledger's threefindings, and the owner's optimization report (filed verbatim in theproject at `qa/optimization-report-2.1.0.md`) — its Phase 1 render workand Phase 2 QA speed land here. Phase 3 (debounced persistence, targetedDOM updates) is explicitly parked for its own release, as the reportitself sequenced it. Still no Knightfall — the trigger fires 25 August.

### Fixed

* **The rating badge joins Then.** The Next-up queue peek rendered tierand format badges but never the rating — the one number a parentscanning "what's next" actually wants. `ratingBadge(x)` joins the peek,and the Next-up hero's link row carries `ratingBadge(f)` beside thewatch link, same as the detail panel. Guard 92 now holds all threeseats: peek, hero, panel — exactly two `ratingBadge(f)+watchLinks(f)`seats, no more, no fewer.
* **The buckle stops cropping on narrow phones.** Below 375px thebuckle's two lines step down (bst 8→7px, bs2 7→6.5px) and the paddingtightens — the longest state, "Live action / Movies+Series", fits a320px screen. Full words stay: the type gives, never the words.Guard 96 holds the narrow-viewport rule.
* **"Share your progress" is a card.** The share block was a bareparagraph heading floating between the scoreboard and the folds; it isnow a `.bk` card with an `h3` title, the same chrome and title size as"Your data" and every other Progress block. Guard 98 holds the cardform and fails the qhead whisper coming back.

### Changed

* **Render efficiency, report §3.1–3.6.** All statement-level rewrites,byte-identical markup out: `viewStats()` reuses the group `.films`arrays instead of re-filtering 56 keys per render, and its twin rowbuilders fold into one `progRows()`; `esc()`'s map hoisted to`ESCMAP` with per-film invariants (`tE`, `dE`) pre-escaped once;`badges()` memoized per `id|format`; Home and the intro stats countin a single pass; `counts()` computed once in `render()` and passeddown; focus restoration is one attribute-selector `querySelector`instead of a linear dataset scan; the forced-reflow scroll clamp skipswhen there is nothing to keep; a precomputed search haystack (`f.hay`)and a shared `BYID` map kill the linear scans and turn the two logmerges O(n); `noteFor()` skips `yearSpan()` unless the note asks.
* **Source removals, report §4.** The ten empty `b:[]` (the flatten stepdefaults them), the duplicated `replaceState` (routeHash reuses`clearPendingHash()`), the double `anyOpen()` in `viewWatch()`, and a`pct()` helper replacing the three hand-rolled percentage lines. Thebytes bought back the budget headroom the report said was the point.
* **QA speed, report §5.** `run-all.sh` dispatches suites longest-firstso the slowest suite no longer anchors the tail; CI shards thenegative job 4-way (workflow-only, balanced by smoke-fixture count,the fixture-count guard running per shard off disk); smoke's dead-CSSsweep early-exits once every selector has matched; and`SMOKE_ONLY=<phase>` lets a fixture run just the smoke phase itactually tests — the check-count self-assert skips under a filter,and full smoke still runs in `npm test`. Timings before and after aremeasured and recorded in the release record, not asserted.

### Skipped, on the record (report items that collide with pinned literals)

* **`moveBanner()` memo (part of §3.6)** — the banner string is pinnedverbatim by three negtest180 fixtures; a memo wrapper would move theliteral and re-anchor a suite for microseconds. Skipped.
* **Reduced-motion probe dedup (part of §4)** — guard 96 pins the`matchMedia` probe inside the belt handler by position; hoisting itwould weaken the guard that proves the close honors reduced motion.Skipped.

### Added

* **`qa/negative/negtest220.sh`** — fixtures for the three soak-fixguards and the `SMOKE_ONLY` wrong-phase failure.

## [2.1.0] — 2026-08-03

Housekeeping, from three directions at once: the SEO/AEO/GEO audits' shortlist, the 2.0.0 soak's two Belt notes, and the buckle the owner locked bymock (26 / 26 / 26 / 22, full words). Still no Knightfall — the trigger isthe trigger.

### Changed

* **The buckle, locked.** Equal 26% path segments, the buckle at ~22% withthe two-line hierarchy — format over types, full words in every state,the chevron tucked in the corner. No abbreviations survived the mockround. Guard 96 holds the split and the hierarchy.
* **The close mirrors the open.** The pouches animated out but vanishedshut — the soak note. Closing now stages: the belt handler marks thepouches closing, the types row tucks first, format follows, and there-render lands after the exit plays. Reduced motion closes instantly,no timeout. Guard 96 holds the exit keyframes, the staged handler, andthe reduced-motion opt-out.
* **The crawlable seed grew its answer surface.** The section headings areH2 now (the H1 → H3 jump Yoast flagged is closed), and a **Straightanswers** FAQ closes the seed: five real questions — which order, theanimated series, do I have to watch everything, is it spoiler-safe,where can I watch — answered in 2–3 sentences each, the first onederived from MODENOTE so the method answer cannot drift from the app'sown copy. Planned as seven; trimmed to five when the weight said so(the privacy answer lives in the featureList already, and the Jokershelf explains itself in the app).
* **A visible freshness date.** `BUILT` beside `BUILD` in the Progressfooter — "updated 2026-08-03" — and guard 67 fails the build if it everdisagrees with the newest CHANGELOG date. The audits scored freshnessdown for dates only machines could see.

### Added

* **FAQPage in the JSON-LD** — the same five questions, from the samesingle source (`buildFAQ()` in the guards), blessed like the ItemList;guard 100 fails if seed and schema ever answer differently.
* **`docs/llms.txt`** — the site described in plain text for generativeengines: the claim, the three orderings, the counts (guarded againstthe data like the README's), the privacy stance, the canonical URL.Costs no page weight; out of the offline shell.
* **`docs/404.html`** — the wrong-alley page. One sentence and a door,self-contained, noindexed, and served with a real 404 status:wrangler's `not_found_handling` moved `"none"` → `"404-page"`, whichkeeps the original rule (no SPA fallback, no cached-as-HTML 200s) andloses only the default shrug. Guard 101 holds all of it.
* **`qa/negative/negtest210.sh`** — fixtures for the locked buckle, thestaged close, the freshness date, the FAQ sync, llms.txt and the 404.

### Ops — outside the tree, recorded so QA stops asking

* The owner's panel batch, done 3–4 Aug: **SPF added** (DMARC was alreadylive at `p=quarantine`), **HSTS on** (Always-Use-HTTPS had soaked),**redirect chain checked**, **favicon flag confirmed a falsepositive**, Bing/GSC rechecks run.
* The audits' remaining findings are triaged in the project(`releases/history-1.9-2.2.x.md` §11, was `audit-triage-2.1.0.md`): declined items recorded so they arenot relitigated; authority/backlink work handed to the promotion plan.

## [2.0.0] — 2026-08-03

The Belt. The app's three stacked control rows become one strip with pouchesthat open from behind it — the first time the utility-belt name is literal —plus the progress card, theme in its new home, and the four soak notesagainst 1.9.5. The first tag since v1.9.0; it covers 1.9.5's untaggedchanges by pointing here.

**What 2.0.0 does not carry: the Knightfall trigger edit.** Part 1 is notout until 25 Aug, and guard 92's rule — an unreleased entry carries nocertificate — is the truth today. Dropping NOT OUT YET three weeks earlywould ship a false claim; the `u` drop and the `r:"R"` ride the trigger astheir own small data patch, as the road plan always said.

### Changed

* **The master chooser is the Belt.** One continuous strip — the threeorderings joined, no gaps, the chosen path filled in signal — with abuckle as its last cell. The buckle carries what the closed pouches hold("All / Movies + Series") read from the real state, so a narrowing filtercan never hide behind a collapsed row. One tap opens: the format rowtoasts out from behind the belt, the types row follows a beat later —"then" as animation order. The pouches hang flush-aligned beneath thestrip — one inset, both rows on the same edges — with the belt's shadowon them; `prefers-reduced-motion` gets instantshow/hide. The belt always starts closed and its open state is neverpersisted — it is a control tray, not content. Guard 96 holds the stripconstruction, the buckle honesty, the stagger, the reduced-motionopt-out, and the never-persisted rule.
* **1.5.3's overlap law, amended on purpose.** "Only the deck overlaps"gains its second surface: the deck overlaps statically, the Beltkinetically. Collapsed, every tab now opens with one control row wherethere were three.
* **Theme moved to Home — exactly once.** The Dark deco / Darker pairleaves the bottom of Progress for the bottom of Home, compact (230px,34px rows), on both the pre-choice and chosen pages. It never enteredthe Belt. Guard 97: Home renders it, no other view does, and the Beltmust not.
* **The weight ceiling: 160 → 165 KB raw.** The progress card's drawingcode, tightened first (dead code out, one path string, shared downloadpath), still left the file at 161 KB. Owner's call, third raise in thebudget's history, each recorded; the gzip budget has never moved (48 of50 KB).

### Added

* **The progress card.** "Share your progress", seated right under thescoreboard on Progress: a 1080×1920 story card drawn on a canvas in thebrowser — wordmark, patrol kicker, the fraction huge in signal, films /seasons / universes-closed row, the honest pool line naming exactly whatit counts, the bat in clear sky over a skyline of every universe's bar,filled to its completion. At 100%: CASE CLOSED, the bat solid signalwith a glow, "All 200 logged · every Batman there is." One lookregardless of theme — the darker variant was considered and declined.Download + `navigator.share` where present; the filename carries thebrag (`night-watcher-87-of-200.png`); nothing leaves the browser, andthe UI says so. **No preview** — the card draws on a canvas created atthe moment of the tap, and **"Share the night" leads** in the primaryfill with download second (owner's respin call: share is what peoplewant; where the share sheet does not exist, download takes the lead).Guard 98 holds the seat, the share-first ordering, the on-demandcanvas, the one-source counts, the local-only line, and the themeindependence. Design record: `design/progress-card.md` inthe project.
* **`qa/negative/negtest200.sh`** — fixtures for every new guard: thebelt's construction, buckle, stagger, reduced-motion and no-persistrules; theme's one home; the card's seat, source, privacy line andfilename; and each of the four soak holds.

### Fixed

The four soak notes against 1.9.5, called in from the live site:

* **The rating badge rode the top of the link row.** `.linkrow` had neverdeclared an alignment; the badge stretched to the watch link's height.`align-items:center`, and guard 99 holds it.
* **ANIMATED and LIVE ACTION looked identical.** One shared rule becametwo: LIVE ACTION in steel, ANIMATED in dim, both still dashed. Guard 99fails if the two rules ever collapse back into one.
* **The ratings legend line sat misaligned.** The swatches and thetwo-systems sentence now centre on one line of their own (`.rleg`,full-width in the legend's flex row). Guard 99.
* **Three headings read too small.** A `.qhead.big` variant (13px) atexactly the three seats the owner named — the grid heading on Home,"Then" on Next up, the fold headings on Progress — and nowhere else;guard 99 counts the seats both ways. No by-eye round: the variant wasthe owner's call.

## [1.9.5] — 2026-08-03

The pack. Everything that did not have to wait for 2.0.0, shipped while TheBelt is designed: the rating every entry earned in the sourcing pass, aProgress tab that folds, one answer for a fresh visitor, and the independentaudit's short list. 2.0.0 stays what it was — the Belt, and the Knightfalltrigger.

### Added

* **A rating on every released entry.** `r:` on all 194 — 90 MPA ratings,78 TV Parental Guidelines ratings, 26 honest NRs for the web shorts, discextras, unaired pilots and the two 1940s serials that predate the ratingsystem entirely. Two systems live on one shelf on purpose: elevenfilm-shelf entries are TV specials and TV-rated DTVs, and the badge renderswhat the source system says, never a translation. The six unreleasedentries carry none — a certificate rides a release, so Knightfall Part 1'sannounced R enters with 2.0.0's trigger edit, the same edit that drops itsNOT OUT YET badge. Sourced or absent, never guessed: the sourcing passcovered all 200 with a source per value, and the nine rows it flagged werere-verified before any of this shipped. Three moved — the 1983, 1984 and1985 Super Friends seasons are **TV-G** by Apple TV's unified show pageand TV Guide's season badge, not the aggregator's TV-Y7; the other sixheld (Fatal Five PG-13 by Movies Anywhere, Brave and the Bold TV-Y7 byTubi, Young Justice S4 TV-14 by Apple's own season page).
* **The badge is text, in the app's own type**, in the detail panel besidethe watch link, with a legend line naming the two systems. The MPAcertification marks and the TV Parental Guidelines logos are certificationmarks and are not reproduced.
* **Guard 92** holds the vocabulary (nothing outside the two systems), thereleased-carries-one / unreleased-carries-none rule, and the exactdistribution from the findings doc — a rating cannot change without asource, and the findings doc cannot silently disagree with the shipped data.
* **The Progress lists fold.** By universe (44 rows) and By era (12 rows)collapse behind their headings, closed by default — they stood between thedonuts and the backup tools, the longest scroll in the app to reach thecontrols that keep progress alive. `progOpen` is `groupOpen`'s mirrorimage: groupOpen persists only `false` because absent means open, progOpenpersists only `true` because absent means closed, and persisting anythingelse would flip a default the next time a build adds a fold. Guard 93enforces the mirror the way guard 36 enforces the original.
* **The curated list is machine-readable.** An `ItemList` of the 74essential-and-core titles joins the JSON-LD `@graph` — the same list thecrawlable seed already hands to crawlers that read HTML, now for the onesthat read schema.org. One cut feeds both, through the extracted`tierOf()`, generated and blessed exactly like the seed; guard 95 keepsthe two in step. From the independent audit's list.
* **An H1 in the seed.** The crawlable block opened with an H2 — a fragment,to a crawler that runs no JavaScript. Its first heading is the page'scontent H1 now; the wordmark in the header stays the site's. Also theaudit's list.
* **`qa/negative/_lib.sh`.** The harness every negative suite carried as itsown copy — scratch-tree setup, `run_case`, the summary — is one sourcedlibrary now, ~500 duplicated lines gone. The failure-report grep is thenewest superset (`✗|!|FAIL`) in all 22 suites, where three vintages of ithad drifted. The suites prove the refactor themselves: every fixture stillfails its guard for the stated reason.
* **`qa/negative/negtest195.sh`** — fixtures for everything above: ratingsvocabulary, counts, the unreleased rule, the badge and legend, the foldsand their persistence, the fresh-visitor default, the ItemList, the seed'sH1, and the raised ceiling.

### Changed

* **The path is Bruce, for a fresh visitor.** Owner's call, recorded in the1.9.5 plan. The chooser's lead card has been Bruce's life since 1.7.2;what remained was the reader who had not chosen yet — The Path opened onBy universe for them, a different answer than the card the chooserrecommends. The pre-choice default is `life` now, and guard 94 keeps thetwo recommendations one recommendation. Nothing moves for anyone who haschosen a path.
* **`docs/share.png`: 325 KB → 20 KB.** 1.9.0 declined quantization so theshipped file would be the generator's exact output; the independent auditput a number on what that cost — the card was the heaviest file in thetree, on every social embed. Reversed: 256-colour palette quantization,RMSE 1.4%, invisible at card size. The card stays generated — the exactreproduction step is recorded in `qa/make-share-card.mjs`, so aregeneration still lands on the shipped bytes.
* **The weight ceiling: 150 → 160 KB raw.** The road-to-2.0.0 plan budgetedthis raise for the release the ratings data rode in; with the `r:` fieldon 194 entries and the ItemList, the file is over 150 and comfortablyunder 160. The gzip budget did not move, and the README's weight prosemoved with the numbers.

### Ops — outside the tree, recorded so QA stops asking

* **The AGPL `LICENSE` is verbatim, verified 3 Aug.** A fresh gnu.orgdownload, normalized from the browser's CRLF save (34,523 bytes), hashesbyte-identical to the text below the divider in the tree. The parked"byte-exact AGPL copy" item was stale — the README's "canonical, verbatim"claim was already true, and the first-FOSS-submission gate is open.
* **Bing / IndexNow, completed 3 Aug**: verification via Search Consoleimport, sitemap submitted (*Processing*, 0 errors), Bingbot clear at theedge, and the index tab's 2006-dated DNS error proven stale by a cleanlive test, indexing requested. Still owed on the watch list: the sitemaprecheck once processed, and the IndexNow attribution panel after its~48-hour window.
* **1.9.0 shipped the same day this was built** — the soak runs while 2.0.0is designed; anything it surfaces lands on the 2.0.0 plan, not here.

## [1.9.0] — 2026-08-03

The page's face when it travels. Nothing a reader inside the app sees changes.

### Added

* **`docs/share.png` — the share card.** 1200×630: the bat mark and wordmarkover three numbers in signal yellow — *133 films · 67 seasons · 44continuities* — the tagline, the domain, and a strip of 44 ticks. One asset,three jobs: social embeds, the repository's social preview, and the BatmanDay graphic. Three numbers on purpose: *87 years* is Batman's age as acharacter, and this catalogue's claim is every Batman story ever **filmed**,which starts in 1943 — the card does not borrow comics history. That figuregoes to post copy, where character history is fair game.
* **The card is generated, not drawn.** `qa/share-card.html` +`qa/make-share-card.mjs`: the counts are extracted from `PATH` the way theguards extract it, the bat silhouette is chroma-keyed out of`docs/icon.png` at run time, the fonts are the app's own, and the render is2× downscaled in-browser. The card cannot say something the catalogue doesnot. Playwright is deliberately **not** in `package.json` — the generatoris release tooling on the `qa/smoke.js` optional-dependency pattern, andthe lockfile and both CI jobs are untouched. Quantization was declined:the shipped file is the generator's exact output, so a regenerationreproduces it.
* **Guard 91 — the card the metas promise is the card that ships.** The fileexists and its PNG header reads exactly 1200×630; `og:image`,`twitter:image` and the JSON-LD `image` agree on it; the size hints match;`twitter:card` is `summary_large_image`; and `share.png` appears nowhere inthe service worker's precache — it is a crawler asset, and keeping it outof the offline shell is now enforced rather than remembered.
* `qa/negative/negtest190.sh` — five fixtures: the card deleted, the cardreplaced at the wrong size, the card type reverted to a thumbnail, onereference drifting back to the icon, and the card smuggled into theprecache.

### Changed

* **The page's embed identity moved off the icon.** `og:image` and`twitter:image` → the card; `og:image:width/height` 512×512 → 1200×630;`og:image:alt` now states the three numbers; `twitter:card` `summary` →`summary_large_image`; the JSON-LD `image` follows — the note left for thisrelease in the 1.8.6 plan.

### Ops — outside the tree, recorded so QA stops asking

* **Bing Webmaster Tools, 3 Aug 2026**: site verified (Search Consoleimport), `sitemap.xml` submitted, and the edge checked — Bot Fight Modeoff, AI bot policies all Allow, so Bingbot is not turned away from the doorIndexNow knocks on. Bing's live URL test passes clean; its index-side "DNSfailure" is a cached artifact from the domain's first days and clears withcrawling.
* **Cloudflare, 3 Aug 2026**: Always Use HTTPS on (234 plain-HTTP requestshad been served in the prior day), minimum TLS raised to 1.2, Web Analyticsreduced to the one JS-snippet counter per the canonical-hostname-onlydecision, and a certificate alert ("night-watcher certificates") nowemails on Advanced-certificate events.

## [1.8.7] — 2026-08-03

The catalogue's dated facts, and half of a 1.7.5 decision reversed on purpose.

### Changed

* **The Home cards lost their number.** The 1.8.5 soak found the tag crowdedthe description inside its two-line clamp, and Home never needed it — thecards are named, and tapping one jumps to the ordering where the numbermeans something. 1.7.5's "one number per universe, on both screens" isthereby half-reversed, deliberately: **The Path keeps its numbers**, wherethe ordering is load-bearing and the chip is guard 88's subject. Thecompleted-universe ✓ moved from the number to the name. The smoke blockthat held both screens to the same number now holds Home to none and ThePath to all of them.
* ***Clayface* carries its release date** — in theaters 23 October 2026,moved from 11 September. The entry had carried no date at all.
* ***The Batman: Part II* carries its release date** — 18 February 2028, theJuly 2026 delay. The slug and year already said 2028; only the prose wassilent.

### Unchanged, verified against the promotion plan's findings

* ***Caped Crusader* S2 was already right.** The plan flagged itconditionally — "if the entry still carries Not out yet" — and thecondition was false: the entry has read "All ten episodes landed 31 July2026", badge-free, since 1 August. Nothing to fix; recorded so the flagstops circulating.
* ***Knightfall Part 1*** already carries digital 25 August / disc8 September in its entry; the `u` badge drops on the QA 2 watch-listtrigger, not before.

### Added

* `qa/negative/negtest187.sh` — the two halves of the reversed decision madeto fail: the number returning to Home, and The Path's numbers going blank.

## [1.8.6] — 2026-08-03

What a crawler that does not run JavaScript sees. Nothing a reader withJavaScript sees changes at all.

### Changed

* **The crawlable catalogue moved out of `<noscript>` and into`<main id="view">`.** Both SEO analyzers skipped the fallback element entirely— one reported "no H2 headings" against a page carrying seven headings, theother counted nine words against 1,957 characters — because most parsers treat`<noscript>` as inactive. The block is the initial content of `#view` now: theapp's first render replaces it wholesale, so there is no removal code, noclass machinery and no CSS, and for a reader without JavaScript it is not afallback, it is simply the page. Guard 78's position assertion inverted — theblock must sit *inside* `#view`, a copy anywhere else fails the build, and sodoes any `<noscript>` returning to the file.
* **The seed now lists the curated route: the 74 entries the app marksEssentials or Core**, flat `Title (Year)`, in universe order. Generated fromthe data by the same generator that builds the rest of the block, with thetier cut running through the extracted `tierOf()` rather than a copy of it.The two 1966 *Batman*s legitimately share a title and a year, so a collisioncarries its sub-title and nothing else does. Optional's 126 entries stay out:that long tail is the thing the app exists to make skippable, and all 200would put the file 802 bytes over the raw budget — a budget conversation, nota seed decision.
* **The seed's one paragraph now says what the page is and links where itgoes.** The `<title>`'s own words — *Batman watch orders that spoil nothing* —appear in the body, and the page's first real anchors carry the threeorderings and the two other tabs: `#universes`, `#life`, `#release`, `#next`,`#progress`. The page had zero anchors before this.

### Added

* **Guard 90 — the seed links carry only known tokens.** Guard 72 froze theroute vocabulary in 1.7.6 after a deleted `#life` branch survived the entireharness; the vocabulary now sits at file scope and both sections read the onelist. A token renamed in the app cannot quietly leave dead links in the onepart of the page a non-rendering crawler reads — which is the reason the seedgot real links instead of five hand-written anchors.
* **The credit, in structured data only.** The JSON-LD `WebApplication` nodecarries `author` and `creator` as the public GitHub handle and `sameAs`pointing at the repository. Nothing visible changed — the no-footer-creditdecision from 1.7.5 stands — and the `application/ld+json` block is notexecutable script, so the CSP hash still covers exactly the one script italways did.
* **Smoke +3**: the seed is gone after the first render, its links carry thefive route tokens, and the titles render before boot — that last one parsedwith scripts off, which is the entire audience the block exists for.
* `qa/negative/negtest186.sh` — the seed block's guards made to fail for theright reasons: a title the data does not have, an emptied `#view`, the blockescaping `<main>`, a `<noscript>` return, an unknown link token, an externallink, stripped links, and a boot that never replaces the seed.

### Ops — outside the tree, recorded so QA stops asking

* **Cloudflare Crawler Hints enabled for `nightwatcher.life`, 3 Aug 2026.** TheIndexNow route: no key file, no served file, nothing for the guards to police.Google does not participate; this reaches Bing, Yandex, Seznam and Naver, andfor a single URL that changes on release it captures the value available. Thedashboard labels the feature Beta, and enabling it accepts Cloudflare'sSupplemental Terms for it — both accepted deliberately.
* **GitHub security settings hardened, 3 Aug 2026 — dashboard-side, so thisentry is the only thing in the tree that can say so.** Now on: privatevulnerability reporting, the dependency graph, Dependabot alerts with malwarealerts, grouped Dependabot security updates, and CodeQL default setup on bothdetected languages; fork pull-request workflow approval tightened to allexternal contributors. All additive. Deliberately not enabled, each for itscost: required PRs on `main`, signed commits, action SHA-pinning, releaseimmutability, AI findings (preview), and Dependabot version updates.

## [1.8.5] — 2026-08-03

The standing decisions stop being prose. 1.8.4 skipped.

### Added

* **Eight decisions that had only ever been written down can now fail.** Each hadbeen settled, most of them explained at length in `NOTES.md`, and none of themcould break a build — which is how they came back up every review.
  * **82** — no `CNAME` in the published directory. Configuring a GitHub Pagescustom domain writes that file and turns the old origin into a 301 thatcannot be switched off. A redirect runs no JavaScript, and only JavaScript onthat origin can read the progress stored there. This was the highest-stakesdecision in the project and its entire enforcement was memory.
  * **83** — the manifest `id` stays `/Night-Watcher/`. It was in no fileanywhere. It looks like a path and is an identity key: change it and everyinstalled copy is orphaned on the build it last cached. It was changed bymistake during 1.8.0 and reverted by luck.
  * **84** — `harley-quinn-season-5-2024` carries `y:2025`, and it is the onlyslug/year mismatch in the catalogue. Guarded as a count, so a real typo insome future entry fails too, and so that "fixing" this one trips a buildinstead of renaming a frozen id.
  * **85** — *Static Shock* and *Titans* keep one row each. Splitting eitherspends `i:` slugs, which is the one thing this project does not spend.
  * **86** — eleven numbered eras plus era 0. Era 7 is not being split.
  * **87** — `exportJSON()` carries progress, not settings. A backup restoreswhat you watched onto whatever device receives it; it does not reach over andchange that device's format, scope or theme.
  * **88** — `eraTag()` reads the unfiltered group, so a universe chip describesthe universe rather than the current scope. Smoke drives the scope switch andreads the rendered chip.
  * **89** — `renamed-ids.json` holds exactly one entry. It is the record of asingle exception taken before public launch, not a mechanism for renamingslugs, and the condition it depended on can never be true again.
* **Three decisions that cannot be guarded are written where they will be read.**The analytics hostname is a Cloudflare-side setting, recorded in `NOTES.md` asunenforceable rather than given a guard that checks a proxy for it. *Super BestFriends Forever* joins Joker, OnStar and *Return to the Batcave* as a namedhard case in the README's inclusion rule — licensed, released, Batman is in it,and out because nothing happens in it — where guard 31 already fails if a namedcase vanishes. And "verify a new state from a cold start, never from the statethat produced it", the rule 1.6.5 earned, goes in the README's release section.
* **The parked work is recorded as parked**, with what a future attempt wouldneed: the share card (1.9.0), rating badges, the master chooser.
* `qa/negative/negtest185.sh` — 18 fixtures, one per new guard and per branch ofthe ones that count.

### Fixed

* **The fixture count in `.github/workflows/qa.yml` said 194 in two comments** —written during the release that established the number is 192. The count thathad drifted in prose for six releases drifted once more inside the fix for thedrift. Both corrected, and the guard that counts fixtures off disk now sweepsthe workflow as well as the README. `CHANGELOG.md` and `NOTES.md` are swept fornothing on purpose: both are records, and a history that updates itself is nota history.
  
* **The negative suites run concurrently**, one per core, instead of one afteranother. 456s serial to 354s on two cores here; the floor is the slowest singlesuite, so a four-core runner lands near two and a half minutes.The loop was the easy half. Every suite computes its scratch tree as`$NEGDIR/tree` and `run-all.sh` exported one `NEGDIR` for all of them — fineand invisible while serial, and eighteen suites unpacking eighteendifferently-mutated trees over each other the moment it was not. Each suite nowgets its own directory. `NEGJOBS=1` forces the old serial behaviour.A `--only <section>` flag for `guards.js` was measured and not built. It lookedlike the bigger win and is not: a whole guards run is 0.40s, of which 0.13s isnode starting and parsing two large files and only 0.27s is the 89 sectionsthemselves. 188 of the 210 fixtures target guards and 22 target smoke, andsmoke costs 21s a run — so the smoke fixtures are 10% of the fixtures and 84%of the clock. A perfect `--only` saves about 9%, in exchange for restructuringa 170 KB script whose sections are not uniformly wrapped. The numbers are inNOTES.md; if the suites ever need to be faster, the lever is smoke.js.
  
* **The nightly run and push runs no longer cancel each other.** They shared aconcurrency group, so a 03:17 UTC run and a late upload could each kill theother. The nightly exists to fire when nobody is pushing, so `event_name` isnow part of the group.
  

## [1.8.3] — 2026-08-03

The first independent QA round against the launch tree, worked through.

### Fixed

* **Searching for `%%COUNT%%` no longer breaks the search box.** The match countis rendered above the group list but cannot be built until the groups havebeen counted, so the head carried a `%%COUNT%%` marker that was replaced oncethe total was known. The search input echoes what you typed and renders abovethe groups, so typing that literal made the input's own `value` attribute thefirst occurrence: the count paragraph closed the attribute early and hung itsown attributes on the search box. The head and the body are now separatestrings, joined in order. No marker, nothing to collide with.
* **A deep link's scope is applied before the ordering that reads it.**`#life-series` ran `revealHero()` under the persisted scope and only thenswitched to series, so it could clear the collapsed flag on the wrong group.Scope tokens now run in their own pass first, and `#life-series` and`#series-life` do the same thing.
* **`S.confirmReset` is declared in the state literal** instead of relying onundefined being falsy, like every other key.

### Changed

* **The negative suites run in CI.** They were gated behind`if: github.event_name == 'pull_request'`, and releases here ship by uploadingthe tree — a direct commit to `main` — so pull requests essentially neverhappen and the job had almost certainly never run. They now run on every pushand again nightly, with a concurrency group so a second upload cancels thefirst. Measured cost: about eight minutes for 192 fixtures.
* **The suite counts in the README are counted by the suites.** `smoke.js`asserts its own total against the README at the end of its run — call sitescannot be counted statically, because many checks run inside loops — and`guards.js` counts the negative suites and fixtures off disk. The statedsmoke count had drifted twice (79 where it was 231, then 242 where it was262), and the fixture total turns out to have been reported as 194 when itwas 178, because the `run_case()` definition at the top of each suite wasbeing counted as one of its own fixtures.
* **Two descriptions stop saying what happens.** Justice League season 2 nolonger says the Starcrossed finale "breaks and remakes the team"; JusticeLeague Unlimited season 2 describes the Cadmus arc instead of resolving it.
* **The Clayface entry no longer says the part is uncast** — true today, anddead the day an announcement lands. "Gotham with no Batman in it yet" alreadycarries it.
* **The no-third-party-code promise carves out the analytics beacon** it alreadydiscloses two sections earlier, and which `guards.js` already allowlists byname.
* **One hero header, not two.** `viewHome()` and `viewNext()` built the sameseven lines separately.
* **`NEVER_CACHE` in `sw.js` says why it looks dead.** It is unreachable onlybecause the beacon is cross-origin and the fetch handler returns on thatfirst; serve the beacon same-origin and the list becomes load-bearing again.

### Added

* **The era-note spoiler rule, written down.** Two QA rounds asked whether eranotes are held to the entry rule — who is in it, never what happens to them.They are not, and now that is a sentence: an era note may state the premise ofthe period but may never name an event from inside a specific entry. Guardsection 81 fails on a quoted episode title or an entry title inside an eranote.
* **Guard section 79** — no marker of the `%%NAME%%` shape may exist, and noview builder may call `replace()` with a string literal on markup itassembled. Smoke drives the old marker through the search box.
* **Guard section 80** — the progress ring's circumference is read back againstits own radius, in the markup and in the script that animates it. 119.4 is2πr for r=19 and it lived in two places with nothing tying them to the circle.
* **Guard section 72** now observes the order route tokens are applied in,rather than only that each one routes.

## [1.8.2] — 2026-08-02

### Changed

* **Home's cards say what each one is.** A card carried a name, a number and aprogress bar, which told you how far through something you were withouttelling you what it was. Every card now carries the first line of the group'sown note — the same string The Path shows, shortened, so there is still onedescription per group rather than two to keep in step.Clamped to two lines, so one long note cannot set the height of every card inits row. Cards go from 98px to about 129px: a description is not free, andthree lines was a third more scrolling than this catalogue can afford.
  

### Fixed

* **A restore now says when the code it was given was cut short.** A codechopped by a chat client or a message length limit still parses, still lookslike a code, and quietly restores a fraction of what was sent — which is theexact failure the restore-link ceiling exists to prevent, and the one thing arestore could not tell you about. Every truncation that loses an entry isreported now, and the banner says the link looks cut rather than short.Guards section 8 chops the code sixty-eight different ways and fails if any ofthem loses an entry silently.
  

## [1.8.1] — 2026-08-02

Launch tidying: one address in search, something for a crawler to read, and theone frozen slug that was wrong.

### Changed

* **A slug was renamed, for the first and only time.**`the-super-powers-team-galactic-guardians-198-1985` dropped the 5 from 1985;every sibling is `title-YYYY-YYYY`. It is now`the-super-powers-team-galactic-guardians-1985-1985`.Renaming a slug voids whatever was ticked against it and breaks that entry inevery backup code already written — which is the entire reason the frozen-IDrule exists. It was done now because the app is not yet publicly launched, sothe population that loses anything is small enough to name, and this was thelast moment it cost almost nothing. **The window is closed.** The rename isrecorded in `qa/renamed-ids.json` with its reason, `--bless` cannot launderit, and guards section 2 fails if the old name ever reappears or the new oneis not there.
  
* **`workers.dev` no longer serves.** The preview hostname carried the whole appand was indexable, so the site competed with itself in search. There isnothing to consolidate if there is nothing there.
  
* `SECURITY.md`, `README.md` and the weight figure follow.
  

### Added

* **A crawlable catalogue.** Everything this app renders is written byJavaScript into an empty `<main>`, so a crawler that does not run it saw theshell and nothing else. A `<noscript>` block above that `<main>` now names alleleven eras and all forty-four continuities, with the headline counts.It is generated from the data rather than typed, and guards section 78rebuilds it on every run and compares — a hand-written list of fifty-fivenames would be stale within a release and nobody would notice, because nobodyreads it. `npm run bless` writes it.
  
* **An off-canonical origin asks not to be indexed.** The canonical link alreadypoints every origin at the apex, which is how search consolidates. GitHubPages has to keep serving — it is the only place old progress can be read —and it cannot send headers, so the app injects`<meta name="robots" content="noindex, follow">` when it notices it is not onthe canonical origin. `follow`, so the links out of it still count.
  

## [1.8.0] — 2026-08-02

**Night Watcher lives at [nightwatcher.life](https://nightwatcher.life/).**

The old GitHub Pages address still works and always will. That is notsentiment: progress is stored per-origin, so only JavaScript running on thatorigin can ever read what is saved there. Opened at the old address, the appoffers to carry your progress across.

### Changed

* **The canonical origin is `nightwatcher.life`**, served by Cloudflare Workers.Canonical URL, `og:url`, both images, all three JSON-LD nodes, `SITE`,`robots.txt`'s sitemap line and `sitemap.xml`'s `<loc>` all name it.
* **The manifest's `id` deliberately does not move.** It reads`/Night-Watcher/` and will keep reading that. It is an identity key ratherthan a path that has to resolve, and changing it makes a browser treat theupdated manifest as a different app — which would orphan every PWA alreadyinstalled from the old address, in exchange for nothing.
* **The old address is not given a custom domain, deliberately.** Configuringone on GitHub Pages replaces the site with a 301 to the custom domain andcannot be switched off. A redirect runs no JavaScript, and JavaScript on thatorigin is the only thing that can read the progress stored there — so everyreader who had not already moved would have been permanently separated fromtheir own data, still on their disk, unreachable. Both addresses serve thissame tree instead.
* Cloudflare Web Analytics now counts the canonical hostname. Visits to the oldaddress are not counted; it is a waiting room rather than a destination.
* `SECURITY.md` no longer says security headers are impossible. Workers can setthem; Pages cannot, and that address is out of scope for header reports.

### Added

* **The move offer.** On any origin that is not the canonical one, the app showsa banner naming the new address, and — when there is progress to carry — alink that carries it. The link is built from `SITE`, not from`restoreLink()`, which uses `location.origin` and would have pointed back atthe address being left: a link that looks right and does nothing.It renders above every tab, because a shared `#life` link lands on The Pathand a reader who never opens Home would never be told. It is conditioned onwhere the page is running rather than on a date somebody has to remember, soit still works for whoever returns in three years. Dismissing it lasts thesession.
  
* Guards section **77**, which holds all of that. The offer is invisible on thecanonical origin and therefore invisible in every screenshot anyone will evertake of this app, so it is checked rather than looked at: the link comes from`SITE`, it carries a code, the condition is the origin and not a date, and`offCanonical()` is executed against four real origins. `qa/smoke.js` boots adocument on the old address and reads what a returning reader would see.
  

## [1.7.7] — 2026-08-02

Home stops disagreeing with the path you chose, and the backup code stopscarrying every rated entry's identifier twice.

### Changed

* **Home reflects the path you are on.** It always drew the universes, whateveryou had chosen — so a reader on Bruce's life got a dashboard about a differentordering, and tapping a card on it moved them into By universe and raised theborrowed-view banner. Nobody asked to view anything by universe; they tapped acard on their own home screen. The grid is the eras for Bruce's life, theuniverses for By universe, and the decades for Release order, built by the samefunction The Path uses. Tapping a card now changes nothing but where you are.
* **The grid says what it holds**, and carries the same one-line description ThePath shows, from the same string. No new copy was written.
* **The scoreboard is a Progress metric and lives there.** Home already carriesthe completion ring in the header and three tier meters under the hero;Watched / To go / Skipped was a fourth statement of the same thing.

### Fixed

* **The worst-case restore link was 2,254 characters against a working ceilingof about 2,000**, where chat clients and QR readers begin truncating. Ratingswere more than half the payload, and almost all of that was the watchedentries' identifiers written out a second time. **Backup codes are now NW3**:a rating is one character, positioned against the watched list. Worst case is**1,255** — room for roughly 124 more entries before the ceiling mattersagain. A code where nothing is rated is the same size it always was.
* **A backup code carries entries this build has never heard of.** `exportCode()`walked the catalogue, so a slug merged in from a newer build's JSON survived instorage and in a JSON export but vanished from a code — while the restore toastsaid entries were kept. Codes walk your progress now, not the catalogue, so anewer build can restore what an older one could only hold.
* A rating can outlive its watch, because unticking clears the tick and leavesthe star. Those ratings get their own `O` segment rather than being quietlydropped by the positional list.

**Codes already in circulation still restore.** NW1 and NW2 are read the waythey were written; the format version decides how the rating segment is parsed.A code from a version this build has never seen still restores everything itrecognises, which is what the tolerance was built for.

### Added

* Guards section **76**: Home and The Path group the same way. The bug aboveexisted because nothing said the two screens had to agree.

## [1.7.6] — 2026-08-02

Backlog. Four things 1.7.5 said it would do and did not, and one exclusionre-checked before the tag.

### Fixed

* ***The Comic Adaptations* lists its one real pair the right way round.***Death in the Family* comes before *Under the Red Hood*, which is what theirlife positions have always said and the order the two were made to be watchedin. The group is exempted from the era-direction guard as a weave, on therecorded ground that its order is deliberately the life order; that one pairmade the reason untrue.
* **The filter chips and the All button are 44px tall**, not 34. The stars havecarried a 36–44px target since 1.4.x and the ticks were given a hit area in1.7.5; these were on the same list and were missed.
* **Guards section 15 warns when a `<meta>` count stops being stated at all.**Every sub-check was `if(got)`, so rewording a count out of the sentence leftthe section verifying nothing and reporting success — the counts-in-prosefailure, inside the thing that watches for counts in prose.
* **`qa/smoke.js` decides its exit code in one place.** It was set inside thethird document's load handler, so a run that printed failures could still exit0 if that event never fired. A watchdog and an exit hook now report the sameway if the run never reaches the end.

### Added

* **The negative test suites are in the repository.** Twelve suites, 155fixtures, at `qa/negative/`, with `run-all.sh` to drive them. Each one breaks aguard on purpose in a throwaway copy of the tree and asserts it goes red forthe right reason — including the two that kill the mutations the independent QAof 1.7.2 got past every guard and every smoke check. They had only ever existedoutside the project, which meant nobody could review them and CI could not runthem. A pull-request-only CI job runs them now; pushes to `main` stay fast.

### Changed

* **`LICENSE` carries the canonical AGPL text**, verbatim from gnu.org. Theshipped copy had been reflowed, and the licence's own terms say changing it isnot allowed. The `WHAT THIS COVERS` preamble above the divider is ours andstays.

### Removed

* **The source link in the home footer.** 1.7.5 added it because the AGPL's ownhow-to *suggests* a Source link for web applications. Suggests is all it does.The only links this app has ever had are the where-to-watch searches on eachentry — links that go where the reader asked to go. Chrome does not get tosend anyone anywhere. The repository URL stays in the served file's headercomment, where it has always been, and `LICENSE` ships whole with the page.

### Checked, unchanged

* ***Lanterns*** (premiered August 2026) and ***My Adventures with Superman***season three both still have no Batman and no Gotham. Both exclusions hold.

## [1.7.5] — 2026-08-02

Every open item closed in one build: the 1.7.2 soak register and an independentQA audit, folded together. **1.7.3 and 1.7.4 do not exist** — the audit ranagainst the 1.7.2 tree rather than after the register was cleared, so the tworounds collapsed into this one. The gap in the numbering is deliberate.

One `i:` slug was removed, the first in the project's history. Everything elseanyone has ticked is where they left it.

### Removed

* ***Scooby-Doo! and Krypto, Too!* is gone from the catalogue.** No Batman, noGotham, no Gotham character — the vanished League is Superman, Wonder Woman,Aquaman, Flash and Hawkman, and Mystery Inc. investigate alone. It failed theREADME's own inclusion rule on every clause. Anyone who had ticked it losesthat tick, which is the cost of the catalogue matching the rule printed on itsfront page. The slug is recorded in `qa/retired-ids.json` with the reason, andguards section 2 now refuses to let `--bless` quietly drop a slug that is notlisted there — or to let a retired one come back.
* `scopeNote()` and the unreachable branch of `scopeSwitch()` that called it.The copy it produced stopped rendering when the switches moved into thechooser, and the guard section testing it had found a real bug nobody couldsee.

### Added

* **Three entries the inclusion rule always admitted.** The *Harley Quinn*Valentine's Day special (2023), *Gotham Girls* (30 shorts, 2000–2002, with theDCAU cast reprising) and *DC Showcase: Catwoman* (2011, continuing Selina'sthread from *Year One*). All three are Gotham stories with no Batman in them,which is the basis *Catwoman: Hunted* is already here on. *Super Best FriendsForever* was considered and declined under the same clause that removed Krypto.
* **The Arkhamverse gets its own group.** *Assault on Arkham* is the only screenentry of a real, named continuity and had been shelved with the films connectedto nothing.
* **Teen Titans splits from Teen Titans Go!** Two continuities that shared ashelf, and a note that admitted it. The crossover film goes to Go!, which iswhere both halves are present.
* Four guard sections. **71** checks tier resolution against named entries;**72** freezes the eight shareable link tokens and drives every one of them;**73** measures the worst-case restore link and ratchets it; **74** requiresthe version history to run one way.

### Changed

* **The Adam West Universe folds into Batman '66.** One continuity that had beentwo groups with two names, kept apart only because one half is live action.Per-entry `fmt` has existed since 1.7.1, so the split bought nothing.
* **The number on a universe means the same thing everywhere.** Home printed itsposition in the catalogue while The Path printed the era its story starts in.Home follows The Path.
* **A deep link can no longer overwrite your saved scope.** `#universes-series`set the scope without marking it a preference, and the next save — from tickinganything at all — wrote it as though you had chosen it. Scope now has the savedtwin the path has always had.
* **Sixteen group notes rewritten.** The DCEU note said Ben Affleck plays Batmanwhen *Birds of Prey* has none and *The Flash* has Keaton's; the Columbiaserials were "two wartime-era" with one made four years after the war; BatmanUnlimited was "a trilogy" with four entries; the Tomorrowverse claimed JensenAckles "throughout" a run whose opening films have no Batman at all.
* **Era 11's note comes under the spoiler rule.** "An era may say who is in it,never what happens to them" had only ever been applied to names.
* Data corrections: *Batwheels* season three is **19 episodes**, not 9, and isfinished; *Batman Unlimited* has 33 shorts, not 27; *Teen Titans Go!* is past440, not 400; *Mechs vs. Mutants* rejoins its own trilogy in era 4; the*Mad Love* accolade was an Eisner and a Harvey, for the comic, not an Emmy;*Batman vs. Two-Face* was Adam West's final performance **as Batman**.
* Eight R-rated films gain the mature badge, including two that called themselvesR-rated in their own descriptions. Three features stop wearing the short badge.
* The README's chronology had been printing the pre-1.7.2 era scheme — ten eraswhere eleven ship, under two names removed for spoiling what happens in them.Guards section 14 now checks era names against `ERAS`, not just counts.
* The README's inclusion rule grows the exception the catalogue has alwaysfollowed: an entry with no Batman and no Gotham is admitted when it is a linkin a continuity that is here for Batman, and its description has to say he isnot in it.
* Guards sections 24 and 50 extract `yearSpan()`, `clampRating()` and`markWatched()` instead of hand-writing them. The file's own header promisesevery function under test is extracted; two had drifted.
* `LICENSE` pins `AGPL-3.0-only` explicitly, names the icon in what it covers,and the app footer now links to the source.

### Fixed

* The search-everything count ignored the format filter, so it could offer tofind entries the next screen would not show.
* The focus-restore whitelist carried a key no button uses and was missing thepath, format and theme buttons — keyboard users lost focus to the page bodyafter activating any of them.
* `?utm_source=…` was dropped when a restore banner was answered.
* A restore link carrying nothing offered to restore "0 entries".
* The service worker's cache write was outside the chain that catches it, so afull quota surfaced as an unhandled rejection.
* Group headers slid under the header for storage-blocked users, whose header isa line taller.
* The backup code box had no accessible name; the ticks had no hit area beyondtheir drawn size.

## [1.7.2] — 2026-08-02

The eras redesigned, three quarters of "outside any timeline" given a realplace, and the universes put in the order their stories start.

No `i:` slug changed. Nothing anyone has ticked has moved.

### Changed

* **Outside any timeline goes from 49 entries to 14** — a quarter of thecatalogue to seven per cent. It had been doing three jobs: the entries with noplace, the ones not decided yet, and — the bulk of it — entries filed therebecause they were jokes rather than because their place was unreadable. *TheLEGO Batman Movie* has Dick Grayson adopted and made Robin on screen; that isthe Grayson years whatever else the film is doing.
* **The era scheme is redesigned, not extended.** Eleven eras instead of ten.*Before the cowl* becomes **Before Batman** — no entry was ever about training,and it now holds Alfred, the night the Waynes die, and a boy. *Year one andtwo* becomes **The early years**, which closes the year-three gap withoutadding an era. *Losing Jason* merges into **Rebuilding**. The League yearssplit into **The League years** and **The Watchtower years** on one checkableline: is a Robin or a Batgirl on screen as his working partner. And a terminal**After the cowl** holds the three Gothams where Bruce is gone.
* **An era name may say who is in it, never what happens to them.** *LosingJason* spoiled the death in its own header, and *Broken and rebuilt* spoiledBane in its note. Both are gone. The rule is written down.
* **Rebuilding describes a stage rather than a cast list.** It read "Tim andBarbara around", which left Batwheels — Duke Thomas as Robin, Cassandra Cainas Batgirl — matching no era in the scheme despite showing its shape exactly.
* ***Joker* and *Folie à Deux* enter the life.** *Joker* is set in 1981 and theWaynes are murdered at its climax; *Gotham* opens on that murder. Pennyworth,Joker, Gotham is the cleanest hand-off in the catalogue.
* **The universes run in the order their stories start.** Gotham rendered 37thof 42 and the first Batman ever filmed rendered 35th, while a continuitybeginning in the League years rendered 5th. Within a band the curated orderstands, so the DC Animated Universe still leads the universes that begin inthe early years.
* **The by-universe number now means something.** It was the universe's positionin a list you were already looking at, and it renumbered every time thecatalogue grew. It is the era the universe starts in — the same number thelife path uses, and the reason the list is in the order it is.
* **Bruce's life is the first card.** By universe is the completist's path: itopens on Alfred in 1960s London, which is right for the reader who chose itand strange for the reader who has not chosen yet. Both path descriptionsrewritten.

### Fixed

* **Names that were not the names.** *Elseworlds & One-Offs* collided with DCStudios' own Elseworlds banner and is now **Standalone Films**. *The DarkKnight Saga* is **The Dark Knight Trilogy**, *Superman / Batman* is the**Superman/Batman Duology**, *The Epic Crime Saga* gets the word thatidentifies it. Four shelves stopped posing as universes. *The Brave and theBold* is disambiguated by year before the DCU film of that title arrives.
* **Copy that described things that are not in the film.** *Suicide SquadIsekai* said Batman appears; he never does — Katana takes Harley down in theGotham prologue. *Creature Commandos* said Batman apprehends DoctorPhosphorus; he is a silhouette over a skylight and the arrest is never shown.The LEGO Batman home release carried four bonus shorts, not three.
* **The LEGO direct-to-video line was two continuities.** The 2013 film adaptsthe video game, shares no cast with the nine that follow, and is the only onewhose Robin is Tim Drake rather than Damian.
* *The Doom That Came to Gotham* and *Legends of the Superheroes* return to thetimeline. Both were filed outside on tone in 1.7.1 — one has Dick Grayson asBruce's ward, the other has Adam West and Burt Ward in a Hall of Heroes.

### Added

* **Section 69 — the universes run in the order their stories start.** Theby-universe order has never had a stated principle, which is why everycontinuity added landed wherever it was typed.
* **Section 70 — an entry outside the timeline says why.** Fourteen entries, fivereasons: the Batman is not Bruce, more than one Batman, no Batman at all, nostate asserted, or a continuity whose place is not decided yet. Anundifferentiated bucket is what let the tone-filings hide in the first place.
* **The era-direction guard skips entries with no position.** Era 0 is theabsence of a place, not a late one; a continuity running era 3 → era 0 → era 3has not aged backwards.

### Note

The rating badges are still parked. A "kids" grouping was considered andrejected: it would be a fourth grouping axis competing with the rating badgesalready scoped, and the Rebuilding rewrite lands Batwheels without one.

## [1.7.1] — 2026-08-02

Bruce's life is a timeline now. Six independent audits of the ordering, and theworst thing they found was a live-action film wearing an ANIMATED badge.

No `i:` slug changed. Nothing anyone has ticked has moved.

### Fixed

* **Clayface was served as animated and vanished under the Live action filter.**It shipped that way in 1.7.0. Format was a property of the *group*, and The DCUholds Creature Commandos (animated) and Clayface (live action) — the catalogue'sfirst mixed-format continuity, which the data model could not express. An entrymay now state its own format, and guard 51's neighbour checks the override.
* **The Comic Canon spoiled its own biggest twist.** *Death in the Family*rendered before *Under the Red Hood* — and it reuses that film's animation asstock footage, replaying the Jason-is-the-Red-Hood reveal that the earlierfilm's title exists to withhold. On the path whose promise is that nothingspoils anything ahead of it.
* **An unrelated Constantine film sat between the two halves of one adaptation** —*The Death of Superman* and *Reign of the Supermen*.
* **The DC Animated Universe's note described an order the array did notimplement.** It says to run The New Batman Adventures and then detour into twoSuperman episodes; the array put three Superman entries first. *Mask of thePhantasm* now drops in around season two, which the note has always claimed.
* **Kite Man rendered after the season its own description says it sets up.**
* **The Batman Unlimited shorts sat inside the trilogy**, between films two andthree. Added there in 1.7.0.
* **Birds of Prey sat two films from Suicide Squad**, which it directlycontinues — the placement 1.7.0's release note argued for and did not make.
* ***The Batman vs. Dracula* moved behind season three**, which is where theVentriloquist gets committed to the Arkham the film shows him in.
* **Darwyn Cooke's Batman Beyond short was the last row of the entire lifepath**, after the film the catalogue calls the end of Bruce's story.
* **Teen Titans: Trouble in Tokyo was orphaned from its own series** by 1.7.0.

### Changed

* **The life path is chronological within an era, not just between eras.** Everyentry in a life era carries its position, and continuities blend: *Year One*,*Batman Begins* and *Gotham Knight* are three continuities and threeconsecutive rows. Until now an era rendered in the order its continuities weretyped into the file, which with 62 entries in one era read as noise.
* **Era 0 no longer sorts by release year.** That shipped in 1.7.0 and it smearedthe ten-film LEGO line across 31 slots, putting *The LEGO Movie 2* twenty-onerows after *The LEGO Movie*. Its entries have no position in a life — what theyhave is a watch order inside their own continuity, and year-sorting was the oneoperation guaranteed to destroy it.
* **Twenty-six entries changed era.** *Aztec Batman* went back outside thetimeline — its protagonist is Yohualli Coatl, not Bruce Wayne, which is the sametest that already puts *Gods and Monsters* there. *The Doom That Came to Gotham*followed it. The DC Animated Movie Universe's later films moved to the Damianyears, where their own published order puts them. Harley Quinn's Gotham movedthere too: its Robin is Damian, and Tim Drake — half of what the Rebuilding erais named for — never appears in it.
* **Three live-action shows left "The last years."** Batwoman, Birds of Prey(2002) and Gotham Knights are Gothams after Bruce, ending him threeincompatible ways. A shared absence is not a life stage.
* **Six continuities are marked as having no order at all**, and say so in theirown notes. There is no story order between *Gotham by Gaslight* and *Assault onArkham* because there is no shared story, and the by-universe path had beenclaiming one.

### Added

* **Guard 51 covers every continuity.** Written in 1.7.0 as *an arc may advancethrough eras and may not go back*, and pointed at one continuity out of 42 —while five others ran backwards, including the sixteen-film run that renderedDamian's death before his introduction. Bags are exempt because they have noarc; three weaves are exempt by name, with the reason written next to each,because they interleave several arcs on purpose.
* **Section 68 — the life path is a timeline.** An era is fully positioned or notpositioned at all, positions run 1..n, and no two entries share one. Era 0carries none by design.
* The live-action floor was set to twelve when 1.5.0 shipped twelve. There arethirty.

### Note

The rating badges are still parked. This release was catalogue accuracy, whichis what the owner asked for.

## [1.7.0] — 2026-08-02

The catalogue release. **168 entries to 198**, 33 continuities to 42, and thecatalogue no longer starts in 1966.

A MINOR bump by this file's own rule: additions only. Not one `i:` slug changed,so no saved progress moves and every backup code ever issued still restores.

### Added

**Nine new continuities.** The Columbia Serials, Gotham, Pennyworth, Titans,Batwoman, Live-Action One-Offs, The Joker Films, Robot Chicken DC Comics, andDC Super Hero Girls.

**The first two Batmans anyone ever filmed.** *Batman* (1943) and *Batman andRobin* (1949) — Columbia, fifteen chapters each, Lewis Wilson and Robert Lowery.The catalogue started in 1966 because nobody had revisited the start date, notbecause a line had been drawn there. The release view gains a forties and afifties to hold them.

**Live-action television, which the catalogue had almost none of.** Gotham (100episodes), Batwoman (51), Titans (49), Pennyworth (30), Birds of Prey (2002,13), Gotham Knights (2023, 13), and the 1966 Adam West series itself (120) —which had somehow never been in a catalogue that carried its film.

**Films with Batman in them that were not here.** *Suicide Squad* (2016), wherehe is in three sequences; *Zack Snyder's Justice League*; *Birds of Prey*(2020); *Joker* and *Joker: Folie à Deux*; *Clayface* (23 October 2026) and*The Batman: Part II* (18 February 2028).

**Six sets of shorts, and the inconsistency they close.** The catalogue alreadycarried *Batman: Strange Days*, a three-minute DC Nation short — and excludedDarwyn Cooke's *Batman Beyond*, made the same year for the same anniversaryslot. Both are here now, with Batman of Shanghai, the Justice League Actionshorts, the Batman Unlimited web shorts, the Gods and Monsters Chronicles andthe LEGO Batman bonus shorts. One entry per set.

**Also:** Batwheels Season 3, DC Super Hero Girls and its Teen Titans Go!crossover, and the three Robot Chicken DC specials.

**A written rule for what belongs here.** `README.md` now carries it: Gotham'sstories, whether or not the cowl is in them — licensed, released, and a story.It has to answer the Joker films, the OnStar commercials and *Return to theBatcave*, and it does.

### Fixed

* **Batwheels Season 2 was recorded as 20 episodes. It is 37.** Episodes 21–37landed in December 2024, after the entry was written.
* **The Dark Knight Rises sat in "Year one and two."** It opens eight yearslater with Bruce retired and his back broken, and era 6 is named *Bane, theback, and the replacement who did not know when to stop.* Moved to era 6,where it joins the Knightfall trilogy.
* **Soul of the Dragon was the only entry in "Before the cowl,"** and does notbelong there — its present day has Bruce already operating; the training isflashback. Moved to era 2. Era 1 is now Gotham and Pennyworth, which is whatthat era was always for.

### Changed

* **Twenty-five entries left era 0 for the life path.** Super Friends and TheBrave and the Bold to the League years; Harley Quinn to Rebuilding; Filmation,the 1966 material and Teen Titans (2003) to the Grayson years; Gotham byGaslight to Year one and two; The Doom That Came to Gotham and Aztec Batman toBefore the cowl; both Ninjaverse films to the League years.
* **Era 0 now reads by year.** It is the one era with no life to be ordered by,so grouping it by continuity was ordering it by nothing.
* **Guard 51 no longer requires the Nolan trilogy to sit in one era.** The rulewas "a continuous arc gets one era", which no other continuity in thecatalogue follows — *The Batman* (2004) spans three and the DCAU spans five,because an era is a life stage and a long story moves through them. It nowrequires direction instead: an arc may advance through eras and may not goback. It also identifies the trilogy by name rather than by group number,which moved in this release and would have left the check finding zero films.

### Note

The rating badges are **not** in this release. Replacing Mature and Kids withMPA ratings for films and TV Parental Guidelines for series needs a sourcedrating for all 198 entries and a badge whose width varies for the first time.That is 1.7.1, with its own pass. Doing it here would have meant designing badgeshapes against a catalogue that was changing underneath them.

`docs/index.html` is now 130 KB raw / 39 KB gzipped, against a budget of 150 /50. Thirty more entries fit; a hundred do not.

## [1.6.6] — 2026-08-02

House-keeping, from an independent audit of everything except the page.

### Changed

* **Recent activity holds three rows, not five.** Measured at 390px with eightentries watched: at five it was 262px against the queue's 191px — historyoutweighing the queue on the tab that exists for the queue. Four was still26px ahead. Three is the first value where the queue wins. The rateable windowshrinks with it, which `NOTES.md` now says out loud.
* **The four explanatory HTML comments in the head moved to `NOTES.md`.** Theno-comments policy had only ever been enforced against `/* */`, so about 950bytes of explanation shipped in a file that claimed to carry none. The noticeabout marks and lettering stayed — it is a statement about the file, not anexplanation of the code.
* **The reformat pass the 1.6.4 audit asked for is finished.** Its flagshipexample — a statement joined onto `if(!f) continue;` by 26 spaces — and elevenmore lines of stranded indentation left by the 1.6.3 comment strip.
* `wrangler` reviewed and deliberately kept; the reasoning is in `NOTES.md` sothe question does not come back without an answer.

### Fixed

* **`sw.js` never cached `icon-maskable-512.png`.** It has been served and namedin `manifest.json` since 1.5.x. An Android icon refresh while offline fellback silently, and only for people who installed before the icon existed.
* **Two guards could not fail as named.** Section 28 asked whether the filementioned `applyTheme()` — which the definition line does, so deleting everycall site still passed. Section 8's forward-compatibility tests ran against acode with no path segment in it, because the sandbox never chose a path: thestrip was a no-op, the older-reader test re-parsed what section 7 had alreadychecked, and the unknown-version half had never once run.
* **The smoke test for unknown titles used a title in the catalogue.** "Batman"is in it twice, so the branch the check is named after was never exercised.
* **Guards section 48 was an empty header.** Its checks sat a thousand linesbelow, past the guard that validates the numbering — so the INDEX pointed atan empty room and section 66 was satisfied by the sign on the door.
* The Case closed card said the same number twice, in the heading and again inthe line under it.
* A dead `repath` handler, an unreachable second `jump` branch, and two CSSdeclarations that nothing could reach.

### Added

* **Section 67 — the dates say when the page actually changed.** `sitemap.xml`and the JSON-LD were guarded against each other from 1.6.2, which catches atypo and nothing else: leave both alone through a release and they agreeperfectly and are both wrong. Both are now anchored to the newest CHANGELOGdate, which section 16 already ties to `BUILD`. Two unnumbered copies of theweaker check lived at opposite ends of the file; this section is both of them.
* **Section 13 now diffs the offline shell against what `docs/` serves**, withthe crawler-facing exclusions named, so an omission is a decision rather thanan oversight.
* **Section 66 fails an empty section and a rotted INDEX** — a header with noassertion under it, a group heading used twice, a group with nothing in it.The INDEX had `META` three times, twice with nothing under it.
* **Guard 65 counts HTML comments**, against an allowlist that names eachsurvivor, so a fifth cannot arrive quietly.
* Section 8 now checks that a code's path segment actually restores the path.Nothing had ever asserted that.

### Note

Eight negative tests, and two retired: guards section 58's row ceiling and theduplicate `.linkrow` and `.pathseg` assertions were subsumed by checks thatalready ran, and a check that cannot fail is not coverage. Both suites green,all seven negative suites re-run.

The one thing this release does not do is the mutation run for the negativefixtures retired in 1.6.3 and 1.6.4. That is deliberate: it belongs before thecatalogue release, not inside a release that is also changing the harness.

## [1.6.5] — 2026-08-01

A restore link works on a new phone again.

### Fixed

* **The restore-link banner never appeared on a device with no path chosen** —which is the only device a restore link is for. 1.6.4 put the ask-first bannerafter Home's first-run branch returns, so opening a link on a new phone didnothing visible at all: the hash was consumed, the code was parked, and thereader saw the ordinary chooser.Worse than silent. Picking a path to get out of that screen finally showed thebanner — and by then accepting it **discarded the path the link was carrying**,because a code's path is only adopted when none is set.The banner is one function now, rendered on both halves of Home, and it sayswhen a link is bringing a path with it. Accepting on a fresh device keeps it.
  
* **An unanswered link no longer dies on reload.** The hash was stripped themoment it was parsed, so a reader who missed the banner and refreshed lost thepayload with no message. It stays in the address bar until the banner isanswered.
  
* **The header claimed 65 guard sections; there were 66.** Guarded now, againstboth places it is written. The README's counts have been checked since 1.5.x —a number in prose is a number that drifts, and this one was wrong the releaseafter it was written.
  
* `.arow .tick` carried `grid-row` for two releases after the row became flex.
  
* The seams the comment extraction left: two statements sharing a line, anirregular run through the palette, and sixteen lines still indented for acomment block that is no longer above them.
  

### Added

* **The test that would have caught this one.** The old case set a pendingrestore with a path already chosen — the single state where the fault isinvisible. The new one starts cold: no path, no marks, a code carrying both,and it checks the banner appears, that accepting lands the marks *and* thepath, and that declining leaves the device untouched.
* A guard that the banner reaches both branches of Home.
* Three known blind spots written into `NOTES.md`: the dead-rule sweep readsselectors and not declarations, cross-tab merging only ever adds, and a parkedrestore link is deliberately session-only.

### Changed

* The progress donuts tell a screen reader where the keyboard route is, ratherthan presenting slices it cannot operate.

## [1.6.4] — 2026-08-01

Last of the small ones.

### Fixed

* **The queue was still printing the year twice.** 1.6.3 fixed the function thatbuilds a description, but the Then rows do not use it — they compose their owntitle — so the Super Friends seasons went on reading *The All-New SuperFriends Hour 1977 · 1977* for a release. One filter now, `subOf()`, read byeverything that renders a label: the two heroes, The Path, the queue, and thelabel on a history row's tick.
* **Next up changed the size of the screen around it.** It is the only viewwhose content can be shorter than the display, so it was the only tab wherethe page did not scroll — and a page that does not scroll leaves the browserchrome open while every other tab collapses it. Arriving resized the visiblearea and leaving resized it back. Every tab now clears the viewport by apixel.
* **A restore link asks first.** Opening one applied its marks immediately, witha message and no way back. Shared links are views, not takeovers; the viewlinks have always honoured that and the backup links did not. It says what thelink carries and waits for an answer.
* `.arow .atop` outlived the button it styled.

### Added

* **The suite checks that no CSS rule is left behind.** Two releases runningremoved some markup and left its rule sitting there. Both were caught by ascript run by hand — which was never necessary: asking whether a selector evermatches is a question about the DOM, not about layout, and the smoke suitealready walks every path, format, scope, tab and filter. It rides along onthe states already being driven.
* A guard that every tab clears the viewport, so the one that fits withoutscrolling cannot come back.
* A guard that nothing reads an entry's label except through `subOf()` — whichis exactly how the queue kept the doubled year after the first fix.

## [1.6.3] — 2026-08-01

Making room.

### Changed

* **The reasoning moved out of the app.** Twenty-two kilobytes of commentsexplaining why the code is written the way it is, shipped to every reader onevery first visit, to explain a file they were never going to open. It livesin `NOTES.md` now, beside this one, where it costs nothing.Two notes stay: the slug freeze, because that one is a warning to whoeveredits the line beneath it, and a header saying where the rest went. 145 KB to
  
  121. The catalogue has room to grow again.
* **Recent activity is one line.** A tick, a title, five stars. It took twofifths of Next up and it sits level with Then now — the block the tab existsfor.The stars are back on the row. Putting them behind a tap took away the oneplace you could rate something without leaving the page, and moved the titlesideways when you tried.
  
* **No date on it, and no badges.** Four things do not fit on one line on asmall phone; with the stars and a date beside them a title had room for aboutthree characters. The list is newest first, so its order already says when.The badges have been there since 1.5.9 and this takes them back out onpurpose.
  
* **Both cards say Tonight's patrol.** Next up briefly said something else.
  

### Fixed

* **Nine entries printed their year twice.** The Super Friends seasons carrythe year where every other series carries "Season 2", so each line describingthem read *1973 · 1973 · 16 episodes* — on Home, on Next up, in the queueand on The Path. A label that only repeats the year is not a label.
* **A restore from a file kept whatever else was in the file.** Extra fieldsfrom a hand-edited backup settled into the browser and stayed there. It takeswhat it needs and drops the rest now, like every other way in.
* **The installed app no longer locks to portrait**, which was never anyone'schoice on a tablet.
* The wordmark and the headings arrive in their own faces instead of swapping amoment after the page appears.

### Internal

* Two ways of asking "does this match the search" became one. Seven ways ofasking "is this entry in this group" became one. Both had drifted apart atleast once.

## [1.6.2] — 2026-08-01

The card, the history, and a page that scrolled sideways.

### Changed

* **The card on Home was assembled, not composed.** Its top line carried thelabel, the group number and the group name on one 10px tracked line — and forfive of the app's continuities that ran to two lines and broke mid-field:"DC ANIMATED / MOVIE UNIVERSE", which is exactly where the middot separatorsstop marking anything. The meta line was often four characters and a hole,because a non-breaking space was doing the spacing between "2013" and thefirst badge. And the gaps ran **17, 12, 10, 15, 16** from top to bottom: fivevalues with no relationship between any two.The kick says one thing now. The continuity has its own line, so a long namewraps against nothing but itself. The badges are a row rather than somethingglued to the end of a sentence. Every gap comes from one scale — 6, 12, 18.Measured at 320, 360 and 390: the kick, the continuity and the meta are oneline each at all three, so the card stops resizing as you move through thecatalogue.It also carries the description now. Home's card was a truncated copy of Nextup's — same class, fewer children, so the shared rules were tuned for neither.It said what was next and never why.
  
* **Recent activity took 40.5% of Next up; Then took 16.4%.** A history row was122.5px against a queue row's 56. The tab spent two and a half times more roomon what you had done than on what you were about to do.Rows are one line now — tick, title, date — and reveal their badges and starson tap, the same bargain the Then rows have struck since 1.5.9. Nothing isgone; it is behind one tap. **59.5px a row, and the block drops from 622px to316px.**
  
* **The past was drawn brighter than the future.** Watched titles rendered in`--bone`, the brightest ink in the palette and the one that means "pressthis", while the film you were actually up to rendered in `--dust`. They are`--dim` now: one step below the queue instead of two above it.Not a fade. `.activity{opacity:.7}` puts five of the seven palette tokensunder AA — the dates, every outlined badge, the unlit stars. Guard 61 nowcatches that, and finding out it did not is what led to the fix below.
  

### Fixed

* **The page scrolled sideways at 320px.** `grid-template-columns:1fr 1fr` is`minmax(auto, 1fr)`, and that auto floor is the column's min-content width.**"Tomorrowverse"** — thirteen characters with nowhere to break — pinned itscolumn at 169px, so at 320 the grid measured 331px inside a 320px screen andthe right-hand cards ran off the edge. iPhone SE and the Fold cover screen.`repeat(2,minmax(0,1fr))` and a card that may break a word. Row heights aredeliberately untouched. No horizontal overflow on any tab at 320, 360 or 390.
  
* **iOS zoomed the page on every search.** Safari zooms any focused input under16px, and the viewport sets no `maximum-scale` on purpose, because cappingzoom fails WCAG 1.4.4. The search box was 15px and the two backup fields were**11px**, so Progress zoomed harder than search. All three are 16px.
  
* **The era rows on Progress had no keyboard route at all.** The donut slicesthey mirror are pointer-only — `cursor:pointer` and nothing else, no`tabindex`, no `role`, no key handler. The universe rows at least had a way inthrough Home's grid; the eras had none. Both are buttons now, labelled withtheir name and their count.
  
* **The stars said "Rate 3" and nothing else** — not which film, not what therating currently was, and not that tapping the lit star clears it. All threeare in the label now, and each star carries `aria-pressed`.
  
* **Two tabs overwrote each other.** Every interaction wrote the whole payloadand nothing listened for the write, so a second tab silently erased thefirst's ticks. Same device, no sync involved. There is a `storage` listenernow, and it merges — marks only ever move from unset to set, so it can neverresurrect something you had just unticked.
  
* **`restore()` accepted any `scope` it was given** while validating `format`two lines below. A payload saying `scope:"films"` hid every season and leftneither scope button looking pressed.
  
* **`exportJSON` wrote a `scope` field nothing reads.** The comment above italready said a backup must not reach over and change the device's scope.
  
* **Smooth scrolling ignored `prefers-reduced-motion`.** The CSS killedtransitions; the two programmatic scrolls were never covered by it.
  
* The search match count is announced. The toast truncates with an ellipsisinstead of clipping mid-word. `mobile-web-app-capable` joins the deprecatedApple meta. A dead `var pc = counts();` is gone.
  
* **The Activity tick reserved three grid rows** after the row collapsed to one,leaving two empty tracks and their gaps — 10px of nothing per row, found bymeasuring the result rather than trusting the change.
  

### Added

* **Guard 62 — nothing focusable is small enough to zoom.** Any field the appputs a caret in must be at least 16px.
* **Guard 63 — the grid columns have a floor.** A bare `1fr` fails, the floormust be zero, and the card must be able to break a word.
* **Guard 61 now measures inherited fades.** As written in 1.6.1 it compositedonly where one rule set both a colour and an opacity. A wrapper that fades ablock without naming a colour had nothing to measure and passed — which isprecisely the change this release rejected. A fade that contains text is nowheld to whichever ink it actually carries, or to the worst in the app if itcarries several.
* **The sitemap's `lastmod` must equal the JSON-LD `dateModified`.** Both arewritten by hand and they drifted a day apart before 1.6.0.

Twelve new negative tests. The 1.6.0 and 1.6.1 suites were re-run unchanged —43 cases in total, all passing.

### Note

`index.html` is 143 KB raw / 46 KB gzipped against the 150 / 50 budget. Theheadroom is 7 KB and this release spent 6 of it, most of that on the commentsexplaining why. The next release that adds weight should expect to argue for it.

## [1.6.1] — 2026-08-01

Three things a build cannot see, and now can.

### Fixed

* **The badges did not line up.** The two filled tiers carried no border whileevery outlined modifier and dashed format badge carried 1px, so a badge's boxdepended on its kind.It showed up two ways. In a row, flex forces the boxes level, so the mismatchlanded on the *labels*: the text in a filled badge sat 3px from the top andthe text beside it 4px, in every row carrying both. In the legend, whichcentres rather than stretches, the boxes themselves came out **17.5px against19.5px, side by side on one line**. 1.6.0 rebuilt the legend out of realbadges, which is what made a two-year-old inconsistency finally visible.The border is on the base rule now, transparent, so a filled badge occupiesthe same box and simply does not paint one. Measured after: every glyph 4pxfrom the top, every legend badge 19.5px. The `vertical-align` nudge on`.badges` was measured too and did not move — the box grows symmetrically, sothe badge's centre stays where it was.
  
* **One era title was indented 6px further than the other ten.** `.gnum` hadpadding and no width, so the chip was as wide as its content — and By universezero-pads its tags while Bruce's life and Release order do not. "Beyond" wasthe only two-digit era, so it was the only row that moved.The chip has a minimum width and centres its tag. All three orderings nowshare one left edge, which they did not before. Release order carried the samebug unfired: it reaches a second digit the moment a 2030s bucket has an entry,and the catalogue already holds a 2028 title.
  
* **The format badges were under AA and the build could not tell.** `Animated`and `Live action` rendered as `--dim` at 80% opacity. Composited against thesurface they actually sit on that is **4.21:1 on `--card` and 3.91:1 on`--card2`** — under the 4.5:1 floor — while guard 20 measured `--dim` at fullstrength, 5.28:1, and passed. They render on every row in All, which is thedefault format.The fade is gone. The dashed border already said "different axis"; hierarchyhere comes from palette and shape, which is the rule everywhere else in theapp. `Short` is `--bone` at 55% and survives at 4.85:1 — by 0.35, with nothingwatching until now.
  

### Added

* **Guard 59 — every badge is the same box.** The base rule must carry atransparent border, no variant may set a different border width, and novariant may set its own padding.
  
* **Guard 60 — one left edge for the group chips.** The chip needs a minimumwidth wide enough for two characters and must centre its tag. Also fails ifany of the three groupings grows past 99 entries, which is where athree-character tag would appear.
  
* **Guard 61 — contrast is measured on the ink that renders.** Guard 20 readsthe token in `color:var(--x)` and cannot see `opacity`, so a faded colour waschecked at full strength. This composites any faded ink against every surfacein every theme and holds it to the same AA floor. It is the guard that foundthe format-badge failure above.It composites within a single rule. A colour and an opacity that reach anelement through different selectors would need a real cascade, which is notsomething to hand-roll — noted rather than pretended away.
  

All three negative-tested in both directions, twelve cases. The 1.6.0 suite wasre-run unchanged: 19 cases, all still passing.

### Not done

A rendered-pixel assertion in the smoke suite was proposed and is not possible:**jsdom does not implement layout** — `getBoundingClientRect()` returns zerosfor everything. Every defect above was found by measuring a real browser, andall three were caught statically instead, by parsing the CSS. Closing the gapproperly means a headless browser in CI, which is a bigger decision than a patchrelease.

## [1.6.0] — 2026-08-01

Four things that were saying the wrong thing quietly.

### Changed

* **The chooser's second and third rows are shorter than its first.** Path,format and scope were three identical 42px rows, so the screen asked threequestions in one voice. 1.5.7 tried to fix that by shrinking the type andbroke "Live action" and "Movies + Series" across two lines on every browser.Height and type size turn out to be separable. Levels 2 and 3 give back 8pxof height at the same 9px type, the same nowrap and the same full width —every label still on one line, and the row you answer first is now the tallestone. Guarded in both directions: equal heights fail, and so does a smallertype size.
  
* **The legend is made of badges.** 1.5.9 rebuilt the badge system into threekinds — tier filled, modifiers outlined, format dashed — and guarded that notwo draw alike. The legend went on drawing all nine as coloured words, so thekey stopped looking like the thing it explains.Each swatch is now a real badge element reading its label out of `BADGE`. Legendand rows cannot diverge, because there is only one of them. The 1.5.9 legendaudit checked the names and not the appearance; that gap is closed.
  
* **Recent activity is no longer a card.** It was the only card on Next up, sothe eye read card, gap, card — and the gap was **Then**, which is what the tabexists for. Both blocks are a heading over ruled rows now. What tells themapart is that Then is numbered and Activity is dated, which is the differencethat was actually there.
  

### Added

* **The landing page says Batman.** The first page anyone arrives on — and theonly page a crawler ever sees — rendered 803 characters of visible textcarrying "Bruce" twice and never the word every search for this page contains.The sentence that says it was already written. It just waited for a path to bechosen before it rendered. It now renders above the deck on first run, from thesame function the Home intro uses, so the two cannot drift. No new copy.
  

## [1.5.9] — 2026-08-01

Clearing the deck.

### Fixed

* **Harley Quinn Season 5 was dated 2024.** It premiered 16 January 2025. Theslug keeps its `-2024` — slugs are identifiers, not facts, and changing onewould void saved progress.
* **Caped Crusader Season 2 dropped its Not-out-yet badge.** All ten episodeslanded 31 July 2026.
* **Knightfall Parts 2 and 3 gained the Mature badge.** Part 1 carried it; thetrilogy is rated R.

### Changed

* **The badges were nine labels sharing six colours.** Core read as Animated,Optional as Short, Interactive as Live action — three exact collisions, so arow of badges said less than it looked like it said.Shape carries the kind now and colour carries the value. **Tier is filled**,because there is always exactly one and it is the answer to *should I watchthis*. **Modifiers are outlined**, because they are footnotes. **Format isdashed and dimmer**, because it is a different axis and only appears in All.
  
* **Recent activity shows an entry's badges.** It was the one place in the app alogged entry rendered with none.
  
* **The episode count is a floor, not a figure.** *Teen Titans Go!* and*Batwheels* are still running, so an exact number goes stale on somebodyelse's schedule. The claim is 1,450+ and the guard checks the data is at leastthat and not so far past that the floor misleads.
  
* **The meta description was 164 characters**, past where search resultstruncate. It is 147 now.
  

### Added

* **The queue reveals a line on request.** Tap anything under **Then** and itshows its badges and which continuity it belongs to. Never the description —the whole premise is that nothing ahead of you gets spoiled, and thedescription is where that risk lives.
* **The fonts join the service worker's install shell.** They relied on theruntime cache, which works on any normal first visit — but a font request thatfailed on that one visit left offline rendering fallback type silently untilthe next online one.
* JSON-LD gains an image and a modified date.

### Removed

* **32 KB from the icons.** Three PNGs of a flat two-colour silhouette werecarrying full-colour palettes. 43 KB to 10.5 KB, no visual change, bothchecked by eye — transparency intact, maskable still full-bleed.

### Docs

* **The README described an older app in three places**: aggregator names gonesince 1.3.2, fonts on Google's CDN since 1.4.2, and no mention of the formataxis at all. All three were checkable against the code and none were checked.They are now. A service named in the README must be one `watchUrl()` reaches, afont origin claimed must be one an `@font-face` declares, and a control the apprenders must be described. The size figure and the file table drifted the sameway and have not since they were guarded.
  
* **The licence preamble went from sixty lines to twelve.** The reasoning movedto the README, where people read.
  

## [1.5.8] — 2026-07-31

### Changed

* **Recent activity rows were the only rows in the app not using its own rowlanguage.** The queue directly above them is set in the display face; Activityinherited body text, so its titles read as plain web type among styled ones.The alignment was two properties fighting: the row wrapped, and the starscarried `margin-left:auto`. Together those put the stars on their own line*and* pushed them right, so nothing lined up with anything.It is a grid now — tick in its own column, title and date on one line, starsbeneath and left-aligned under the title they belong to. The tick is 24pxrather than the Path row's 30px; in a block this tight it was out-shouting thetitle it belongs to.The row had been assembled by addition: title and date in 1.3.4, stars rightafter, the tick in 1.4.1. Nobody had looked at all four together.
  

### Fixed

* A comment on the group cache still said it was keyed on `mode|scope`. It hasincluded format since 1.5.0.
* `sitemap.xml` had no `lastmod`, so it gave search engines nothing aboutfreshness.

## [1.5.7] — 2026-07-31

### Fixed

* **Two labels in the master chooser broke across two lines.** Format and scopehad been squeezed onto one row and set smaller so they would read as secondary,which left *Live action* and *Movies + series* wrapping on every phone tested —Safari, Chrome and Brave alike.All three rows are the same size now, and the palette carries the distinctioninstead: the path you chose is marked in the belt colour, format and scope in aquieter fill. Size was doing work colour does better, and doing it badly.
  

## [1.5.6] — 2026-07-31

### Changed

* **One chooser, on every tab.** Which ordering, then what is in it — the twoquestions every tab is an answer to.They had been split three ways: the path control on Home only, a lone scopeswitch at the top of The Path and Progress, and nothing at all on Next up. Sowhich controls you had depended on where you were standing, and changing theordering meant going back to Home and returning.The same block now opens all four tabs, rendered from one function, and thehalf-blocks it replaced are gone.
  

## [1.5.5] — 2026-07-31

### Changed

* **The path control moves to the top of Home**, with format and scope directlyunder it. They govern everything below them, and reading them after tonight'scard meant meeting the answer before the question.
* **The chosen path is marked in the belt colour.** It was filled bone, which isthe fill this app uses for a primary action — press this. Signal is what ituses when something means *this one*, and that is what a chosen path is.

## [1.5.4] — 2026-07-31

Home had three controls of identical weight and no hierarchy between them.

### Changed

* **Format and scope drop a level.** They were two more full-width bars the samesize as the path control, with the same fill when selected — so the screen saidchoosing Movies mattered as much as choosing which life you are watching.They share one quieter row now, set smaller, in a subtler fill. The pathcontrol keeps its weight, because it is the decision the rest of the screendepends on.
  
* **The top card is slimmer.** It was carrying more padding than its contentsneeded, which pushed everything below it down a screen.
  
* **The recommended path is filled, not outlined.** A signal border read asanother card with a slightly different edge, which is why it had to be askedfor twice. It is yellow now, the way the app's own belt colour is usedeverywhere else it means something.
  

## [1.5.3] — 2026-07-31

### Changed

* **The chooser is a deck.** 1.5.2 took the three paths out of cards entirely tostop them looking like the other seven panels. That worked, and read as toomuch — large display caps, a ring on each, and the signal colour flooding in onpress.They are cards again, but overlapping: each sits on the one below it, whichnothing else in the app does. Quieter type, and room above the first one, whichhad been jammed against the line before it.
  
* **The recommended path is marked.** *By universe* is the spoiler-safe answerand the app's own copy says so, but three equally weighted cards left anewcomer guessing at the one decision the app actually has an opinion about. Itcarries the signal colour and a line saying **Start here**.Signal is no longer a press state. It marks one card, or it means nothing.
  

## [1.5.2] — 2026-07-31

A visual pass on the first screen.

### Changed

* **The chooser stopped looking like everything else.** Seven surfaces in theapp were the same formula — a one-pixel border, a card fill, a rounded corner— and the chooser was the seventh. The one screen that asks a question read asanother list of panels.No box now. Display type on the page itself, hairline rules between the three,and the signal colour doing the work it already does everywhere else.
  
* **Home tells before it asks.** The intro rendered between the path control andthe format and scope block, so the two only read as a pair once the intro wasgone — which meant the layout depended on whether anything had been ticked.The order is now: what this is, how to order it, what to include, where youare, where to jump. Explain, control, status, navigate.
  

### Added

* **A format badge on every row, in All only.** With both formats on screenthere was no way to tell an animated entry from a live-action one. Under eithersingle format the badge would be a label for the switch you already set, so itdoes not appear — and neither does its row in the legend.

### Notes

* `exportJSON` deliberately omits format, scope and theme. A backup restores whatyou watched onto whatever device you are holding; it does not reach over andchange that device's settings. That was already true and is now written down.

## [1.5.1] — 2026-07-31

### Fixed

* **Two places still called the catalogue animated.** The first-run intro read*"Every Batman story ever animated"* and the finished state read *"the completeanimated Batman"*. Both went out with 1.5.0, and the intro is the first thinga new visitor reads.
* **The guard meant to prevent exactly that was looking for the wrong words.** Itmatched two exact phrases, both of which had already been reworded, so it neversaw either live string. It now scans both files for the word used as a limit onthe catalogue — narrow enough that a description saying something is animated,which several truthfully do, still passes.
* **The intro counted the whole catalogue whatever the format switch said.**Choosing Live action still claimed 110 films and 58 seasons of television. Thecounts follow the selection now, and the television line disappears when thereis none.
* **Endless scrolling in Chrome.** `render()` replaces the view wholesale andrestores the scroll offset by hand; Chrome is the only one of the three engineswith scroll anchoring on by default, so it was compensating for the same changeat the same time. Anchoring is off for the view, and the restored offset is nowclamped to the document, which stops a shorter view leaving the page parkedpast its own end.
* **A hand-edited save could empty the catalogue.** `format` is clamped to thethree real values on restore instead of being trusted.

### Added

* **The Penguin (2024).** The Epic Crime Saga note promised it. Eight episodes,opening the week the film ends, and the first live-action series in thecatalogue — 168 entries now, 110 films and 58 seasons.
* **Complete Twitter card tags**, `og:locale`, and image dimensions, so a sharedlink renders properly rather than relying on fallbacks.

### Changed

* The service worker's header comment described a Google Fonts caching strategythat stopped existing in 1.4.2.

## [1.5.0] — 2026-07-31

Live action arrives, and the app gains a second axis.

### Added

* **Twelve live-action films, in five continuities.** The Dark Knight Saga, theEpic Crime Saga, the Burton / Schumacher films, the DC Extended Universe, andthe Adam West Universe. The catalogue is 167 entries across 33 continuities.The list is DC's own. Their guide covers thirteen films; *Justice League* and*Zack Snyder's Justice League* are one entry here, since they are one story intwo cuts. *The Flash* sits in the DC Extended Universe, and the note on theBurton / Schumacher group records that Keaton's Batman returns in it — ratherthan filing one film in two places and inflating every count that touches it.
  
* **A format switch: Animated, Live action, or All.** It sits above the existingMovies / Movies + Series toggle, because they answer versions of the samequestion — format asks which kind of Batman, scope asks how much of it. Theyare one control block now. The path control answers a different question andstays apart from them.
  
* **Tiers are judged within a format.** Essential-for-animated andEssential-for-live-action are separate calls. Nobody has to rank Burtonagainst Timm, and *Essential* keeps meaning "do not skip" rather than "good".
  

### Changed

* **Existing progress opens in Animated. A first visit opens in All.** A savewritten before this release has no format, and defaulting those people to Allwould grow the denominator overnight and put a Nolan film in Next up withoutthem asking for it. Everyone keeps the app they had; nothing is hidden fromanyone new.Progress is keyed by entry, so a tick survives every format switch. Backupcodes and restore links are untouched — they never carried scope.
  
* **The first-run screen is three full blocks**, with the format switch abovethem. The chooser and the segmented control below are now the same threeoptions at two sizes: large while it is the only decision on the screen, smallonce it has been made.
  
* **Home's path card is gone.** It repeated the header exactly — name, ring,percentage, done of total — and its only unique content was a Change button.A segmented control sits there instead, so switching is one tap rather thanthree.
  
* **The licence is AGPL-3.0.** The old one granted the right to sell under MITand then reserved the writing separately, which was incoherent: the writinglives in the same file as the code, and one file cannot be both granted andwithheld. Everything is under one licence now. Fork it, change it, host it —but if you put it in front of other people, publish your source.
  

### Fixed

* **`sw.js` still carried Google's font origins** in a cache branch that couldnever fire, five releases after the fonts were self-hosted. The origin guardread `index.html` only, so a service worker reaching a third party was outsidewhat it checked.
* **The README's file table listed only `docs/`.** `LICENSE`, `SECURITY.md` and`package-lock.json` all shipped in 1.4.2 undocumented, because the root half ofthat table was maintained by hand.

### Guarded

* Every shipped file is scanned for third-party origins, not just the page.
* The whole repository is checked against the README's table, in both directions.
* Format is inherited from the group, so no entry can be half-assigned. All sixformat × scope combinations must return a duplicate-free pool.
* A continuous arc gets one era. The Nolan trilogy fails the build if it is eversplit across eras, the way Knightfall would.
* An old save must land in Animated and a new one in All — the migration-bugshape, invisible in the data and only visible in someone's hands.

## [1.4.4] — 2026-07-31

### Fixed

* **Clearing a rating marked the entry watched.** Untick something in Recentactivity, then tap its lit star to clear the rating it kept — and it came backmarked watched. The opposite of both actions.`rate()` called `markWatched()` on both branches, including the one thatdeletes a rating. Only setting a rating implies you watched it. The bug is old;putting stars on the hero in 1.4.1 is what made it easy to reach.Unticking still keeps your rating. It is usually a mis-tap being corrected, andsilently discarding a rating you gave is worse than leaving it.
  
* **"Where to watch" wrapped to two lines.** At 10px with wide tracking thelabel needs about 112px and its column gives 96px, so it broke mid-phrase andleft the stars floating in the dead space beside it. The label keeps itswording at a smaller size — it is a secondary control and only has to shareSkip's edges, not its weight. Below 360px the two rows stack instead.
  

### Added

* **A GitHub Action running both suites on every push.** `index.html` carriesfive independent tripwires — the CSP script hash, the frozen-ID snapshot, thechangelog and version lock, the README size figure, and the third-party originallowlist. Any edit that is not deliberate trips at least one.Until now nothing ran them except a person remembering to. They now run inpublic, on every commit, read-only, from the committed lockfile.
  

## [1.4.3] — 2026-07-31

### Fixed

* **The tick in Recent activity read as unwatched.** It drew as an empty ring onentries that are watched by definition — being watched is what puts them inthat list. It now carries the filled state the rows on The Path use.1.4.1 tested that the tick existed, that it was labelled, and that it worked.Nothing tested what it looked like.
  
* **The hero card's rows did not line up.** The stars sat six pixels outside thepadding edge and the watch link was right-aligned to nothing in particular, soneither matched the buttons below. Stars now share a left edge with **Markwatched** and the watch link shares its column with **Skip**.
  

### Added

* **A line of credit in the footer**, where the app already talks about itself.

## [1.4.2] — 2026-07-31

A security pass, and an audit of the tests themselves.

### Changed

* **The fonts are self-hosted.** All four came from Google's CDN, which meantevery visit told a third party the page had loaded — on an app whose ownstructured data says nothing tracks you. Six `.woff2` files now ship in`docs/fonts/`, costing nothing against the index.html budget and making thepage genuinely offline on a first load rather than only after caching.All four are SIL Open Font License, and redistribution requires the licence totravel with them, so `fonts/OFL.txt` ships too.The old request asked for weight 500 of both IBM Plex families. Nothing hasever used it. One rule asked for weight 700, which was never loaded and wasbeing faked by the browser; it is 600 now, which is a weight the app actuallyhas.
  
* **The footer says what Cloudflare sees.** *"anonymous visit stats viaCloudflare"* was accurate and vague enough that a sceptic would fill the gapthemselves. It now reads **"Cloudflare counts visits, never what you watch"**,which is the actual boundary.
  

### Added

* **A Content-Security-Policy.** `default-src 'none'` with everything openedexplicitly: the app's own script by hash, Cloudflare's beacon by origin, andnothing else. `object-src`, `base-uri` and `form-action` are all `'none'`, and`unsafe-eval` is refused — the app has never used `eval`, `new Function`, or asingle inline event handler, so nothing had to be loosened to fit.The hash changes with every edit to the script, and a stale one means thebrowser refuses to run the app at all. A guard recomputes it from the file, and`npm run bless` rewrites it.
  
* **A referrer policy**, and `rel="noreferrer"` on the where-to-watch link, sothe search engine is not told where the visitor came from.
  
* **`LICENSE`** — MIT for the code, the written descriptions and continuityjudgements reserved, DC's marks acknowledged as DC's, and the fonts' OFL noted.
  
* **`SECURITY.md`**, pointing at GitHub's private reporting rather than a publicissue.
  
* **`package-lock.json` is committed.** Without it, a CI run would installwhatever the version ranges resolved to that day.
  

### Guarded

* **No third-party origins.** Any host in `index.html` outside a short allowlistnow fails the build.
* **Fonts, weights, and the licence.** A weight used but not declared would befaked by the browser; a weight declared but unused is a wasted download. Bothnow fail.
* **The file table recurses.** It listed only the top level of `docs/`, so theseven files added to `docs/fonts/` shipped undocumented without the buildnoticing — the same gap that guard was written to close.

### The test suites

* **Sections renumbered 1–49, in file order, with an index.** The numbering hadrun 1–19, jumped to 26, and hung eleven sub-sections off 30 with suffixes bthrough g; 12b and 12c sat before 12. **Guard 49 now enforces it** — sectionsmust run 1..n with no gaps, and every one must appear in the index.
  
* **`optionalFn()`.** `fn()` throws on a missing function, so any guard reportinga function's *absence* crashed before it could print. That was fixed in placethree separate times before becoming one helper.
  
* **The suites run in 6.7s instead of 11.2s.** jsdom throws on every `scrollTo`and catches it internally — 97 exceptions and 97 lines of stderr per run, nowone stub. Each reload test also carried 200ms of padding, five times over.The five reloads themselves were left alone. Re-running `restore()` inside anexisting window would be faster still, but `restore()` is promise-based andwired into the boot sequence, so that would test something other than whathappens on load.
  

## [1.4.1] — 2026-07-30

Next up corrects itself.

### Added

* **The hero rates in place.** The same star row The Path carries, which marksthe entry watched as it rates it. Marking something and rating it were twoactions in two places; they are one now.
  
* **A tick on every Recent activity row.** Stars on the hero are a 34px targetbeside a full-width button, and that will be mis-tapped. The tick takes theentry back out of your progress from the same screen it went in on, and workson any of the five rather than only the most recent.It is the one control in that block that moves the hero, and that is itspurpose. Stars still never do.
  

### Changed

* **Activity is now Recent activity.** Five entries is a window, not a record,and the heading should say which.
* **The legend moved to the bottom of The Path.** It defines badges that renderon Path rows and nowhere else — on Progress it was a key printed on adifferent page. It sits last, because reference is something you go lookingfor rather than something that should push the catalogue down.

## [1.4.0] — 2026-07-30

A deep audit, and the things it found. The share card moves to 1.4.5.

### Fixed

* **`--steel` had been under the AA contrast floor since 1.0.0.** The *Change*control sits at the top of the path card, where the gradient is at itslightest, and drew at 4.09:1 against the 4.5:1 minimum. Lifted along its ownhue to 5.08:1 at worst — the same blue, further from the background.
* **`--crimson` was under the floor everywhere it was used as text** — 3.27:1 ona card. Lightening it enough for text would have dropped white-on-crimson onthe armed erase button below the floor instead, so there is now a second tint:`--crimson` stays the fill, `--crimson2` is the text. Same hue, same identity,following the `line` / `line2` naming already in the palette.
* **The empty stars were invisible.** They drew in `--line2` at 1.50:1, which isa border colour doing a control's job — you could not see there were five totap until you had tapped one. They now have `--staroff`, at 3.37:1: visible asa target, still clearly unscored.
* **The restore box had no label.** Its placeholder was doing the work, and aplaceholder disappears the moment anyone types — leaving a screen reader withan unnamed text box and everyone else with no reminder of what goes in it.

### Changed

* **One scoreboard.** Home and Progress each drew their own, with a differentthird stat: Skipped on one, Essentials on the other. The same component meanttwo things. It is now **Watched / To go / Skipped** in both places — the onlyset that accounts for every entry in the pool — and Essentials keeps the rowand the donut it already had.Numbers are centred and take their colour from the palette, carrying themeaning the legend already gives it: signal for done, bone for what is left,steel for passed over.
  

### Added

* **The site now says what it is.** `og:site_name` and a `WebSite` node in thestructured data. Without them Google guessed, and what it guessed was"GitHub Pages documentation".
* **What the app refuses to do is now stated as a feature.** No account, noadvertising, nothing tracking what you watch, progress that never leaves thebrowser, and it works offline — declared in the structured data and guarded,because it is the whole pitch.

### Guarded

* **The contrast check now enumerates instead of remembering.** Every token usedas a colour, against every surface it can land on, in both themes — with bodytext held to 4.5:1 and drawn controls to 3:1. The old list was five pairschosen by hand, and `--steel`, `--crimson` and `--line2` were in none of them.
* **The `--card2` exemption is gone**, and it was the real fault. The guardtreated the top of a gradient card as warn-only, reasoning that nothing faintwas drawn there. *Change* is drawn there, in `--steel`. Two colours sat underthe floor across nine releases without a build ever failing. A colour thatcannot survive the top of a card does not belong on one.
* Scoreboard is one component, centred, palette-only. The restore box keeps itslabel. The site name and the no-account claims cannot quietly disappear.

## [1.3.9] — 2026-07-30

A copy pass. Nothing in the app moved; several things it said were wrong.

### Fixed

* **The chooser and The Path described the same orderings differently.** Eachordering had two blurbs, written months apart. One called it the *safest firstwatch*, the other the *safest way through*; one said *composite lifetimestitched across*, the other *composite life, stitched from*.They are now one string. The chooser takes the opening of the note and nothingelse, so they cannot drift again.
  
* **The chooser claimed release order ran from 1968.** Its blurb hardcoded ayear while The Path computed one from what is actually on screen — which underMovies is 1993. The chooser was stating a number the app contradicted one tabaway. Both come from `yearSpan()` now.
  
* **Progress was said to live on "this device". It lives in a browser.** Twobrowsers on one phone do not share storage, so anyone who switched and losttheir ticks had been told the wrong thing. All four statements of that factnow say browser.
  
* **The app called itself two things.** *An unofficial field guide* in theintro, *an unofficial fan guide* in the footer, both on the same screen. Fanguide everywhere — it states the position more plainly.
  

### Changed

* **The Progress footer was three unrelated facts in one paragraph** — saving,availability, and release dates. Now three.
* **Named titles left the announced-dates line.** It read *Knightfall andDynamic Duo dates are as announced and can move*, which needed editing everytime one landed or another was announced. It now reads **Announced dates canmove.**
* **The empty state repeated its own heading.** *Nothing here* over *Nothingmatches that filter* said one thing twice. The body now says what to do, anddistinguishes an empty search from an empty filter.
* **Backup buttons named for what they are.** *Full JSON* is now *JSON file*,matching *Code file* beside it.

## [1.3.8] — 2026-07-30

### Changed

* **The page title now says what people search for.** It read *Night Watcher ·One path through every Batman*, which contains none of the words anyone types.It now reads **Batman watch orders that spoil nothing · Night Watcher**.The tagline is unchanged everywhere a person sees it — the wordmark, sharedlinks, the README. `<title>` is read by search; `og:title` is read by humans,and they no longer have to be the same string. Nothing in the app moved.
  

### Added

* **Search Console ownership token** (`docs/google38dc2f1303c788e7.html`), addedahead of this release without a version bump, since it changes nothing aboutthe app and would have retired the service worker cache for no reason.

### Fixed

* **A guard that could not fail.** The tagline check tested `<title>`, `og:title`and the README against the whole document rather than against their ownstrings, so one surviving copy satisfied all three. Each is now checked whereit actually lives.

## [1.3.7] — 2026-07-30

Fixes only. No new surface.

### Fixed

* **The where-to-watch link now carries a year.** Thirteen titles repeat acrossthe catalogue — five different things called *The Batman*, four called *SuperFriends* — and without a year the search resolved every one of them towhichever was more famous.The year used is the **first** the title appeared, not the entry's own, so allfive seasons of a show ask the same question. Availability is sold per show,not per season.
  
* **`--dim` lifted from `#78849E` to `#8B97B1`.** Worst-case contrast went from4.12:1 to 5.28:1, clearing AA with room on every surface in both themes. TheActivity dates added in 1.3.4 were sitting at 4.57:1 — passing by 0.07, whichis not passing in any way that matters at 10px.
  
* **README stated 111 KB / 35 KB.** It had been wrong since 1.2.x. Now guarded,so it cannot drift again.
  

### Added

* **A canonical URL.** The page has been reachable at two addresses since theWorker went up, and nothing said which one was the page.
* **JSON-LD, robots.txt and a sitemap.** Roughly 0.6 KB inline, and the two newfiles cost the budget nothing. The JSON-LD description is now cross-checkedagainst the meta and og descriptions, so the three cannot drift apart.

## [1.3.6] — 2026-07-29

### Fixed

* **The collapse control was invisible.** It wore the same mono caps, the samepill border and the same `--dust` as the filter chips directly above it, so itread as a seventh chip rather than something that acts on the whole list. Itnow carries the signal colour and a caret that points the way it will move.

## [1.3.5] — 2026-07-29

The Path collapses, and Progress stops repeating what The Path already shows.

### Added

* **Collapse all / expand all, on The Path.** 28 continuities is a long scroll toreach the one you want. The control sits under the filter chips and flipslabel to whichever action is available.Group state now **persists**. It was deliberately session-only until now, onthe grounds that tab, filter, query and mode are; collapsing 27 groups is adifferent kind of act from typing a search, and losing it on every reload madethe control not worth using. Stored inside the existing payload as one key, sonothing about saved progress changes shape.
  
* **Arriving at The Path opens the group you are up to.** Only when something isopen already \u2014 a deliberate collapse-all is left alone, since re-opening it onevery visit would undo the control you just used.
  

### Removed

* **Progress no longer lists your ratings.** It repeated, in a second format anda different order, what every row on The Path already carries \u2014 and it grewwithout limit, so the more you rated the further the backup tools sank belowit. Ratings stay readable and editable where the titles are.One consequence worth knowing: that list ignored scope, and The Path does not.A series you rated is now hidden while the toggle reads Movies, in the sameway the series itself is.
  

## [1.3.4] — 2026-07-29

Activity replaces the rating prompt, and Home ends at the universe grid.

### Added

* **Activity, on Next up.** The last five things logged, newest first, each withthe stars you gave it and the ability to change them. It sits below **Then**as a bordered surface with taller rows — deliberately not another `.qitem`list, because it is a record of what you did, not another step in the queue.It ignores the scope toggle. Scope is a queue control; hiding a series youlogged because the toggle now reads Movies would be a lie about your ownhistory. No log, no block.
  

### Changed

* **`ratePrompt()` is gone.** 1.3.3 showed **Just watched · ‹title›** below thehero, which rated exactly one entry. Activity does the same job for the lastfive and reads as a record rather than an interruption.
* **Home ends at the universe grid.** Its **Recently logged** list drew the same`S.log` a second time, in a second format, with a different length. Tworenderings of one list is how they drift.

### Fixed

* **The log holds one entry per id.** Saved progress is deduped on read, keepingthe earliest timestamp — that is when it was actually watched. No reachablewrite in this build can produce a duplicate; a saved payload can also arrivehand-edited or from another build, so the invariant is enforced where the datais read rather than where it is written.

## [1.3.3] — 2026-07-28

Three interface fixes.

### Added

* **Rate what you just watched, from Next up.** Marking something watchedadvances the card immediately, so rating it meant finding the title again onThe Path. A prompt below the hero now shows **Just watched · ‹title›** with itsstars. Rating there records against that title and does not advance anything —`markWatched` is a no-op on something already watched.No new state: `S.log` has recorded every tick in order since 1.0.0, so the lastentry is exactly what was just marked.
  
* **Tapping the app title returns to the top.** The wordmark is the one elementpresent on every screen, which makes it the obvious control for it. It staysinside its `h1`, so the heading is still a heading.
  

### Changed

* **The Progress footer described a link that no longer exists.** It stillpromised that “Streaming rows rotate monthly, so the ‘Streaming now’ link oneach film checks live availability” — two releases after that link wasreplaced. It now says availability changes constantly and differs by country,which is why “Where to watch” runs a fresh search rather than trusting astored answer.
* The star markup moved into a single `starRow()` used by both the detail paneland the new prompt, rather than being built inline in one place and copied tothe other.

### Added — guards

* `ratePrompt()` and `starRow()` must exist and be rendered, and `data-act="rate"`may appear in exactly one place — two copies of the star markup is how theydrift apart.
* The wordmark must be a control with a handler, and must stay inside its `h1`.
* The footer may not mention “Streaming now”, “Streaming rows” or the oldaggregator. That copy survived two releases past the feature it described.

## [1.3.2] — 2026-07-28

### Changed

* **Where to watch is a Brave search.** The link now opens`search.brave.com/search?q=where to watch <title>` — one URL shape for everyvisitor, with no country in the path, no localised segment and nothing thatcan 404 in a market nobody checked. It replaces the aggregator entirely.Three attempts at building an aggregator URL were wrong first: a region-lesspath (404 everywhere), then a locale-derived country (404 in the UK, whosecode is `/uk`, not the ISO `/gb`), then a table of two hand-verified pairsthat left most of the world on a home page. A search query has none of thatsurface.
  
* **The link is right-aligned**, in the hero card and in an expanded row on ThePath, rather than sitting flush left under the description.
  

### Added — guards

* `watchUrl()` is extracted and run: every title must produce a Brave searchwhose query leads with “where to watch” and carries the encoded title. Nocountry path may appear, `justwatch` may not return to `index.html`, the linkmay not point at Google, and the row must stay a single right-aligned link.
* Smoke checks the rendered link in both places it appears.

## [1.3.1] — 2026-07-28

### Fixed

* **Every watch link in 1.3.0 was a 404.** That release replaced three brandedlinks with one “clean” global link, `justwatch.com/search?q=…`, on theassumption that a region-less path would geo-redirect. It does not.Two things make that URL impossible to construct blind. The country is arequired path segment, and **the aggregator's country codes are its own, notISO** — the United Kingdom is `/uk`, not `/gb`. On top of that the searchsegment is localised: `/us/search` in English, `/uy/buscar` in Spanish.So nothing is derived any more. A small table holds only country/path pairs**checked against a live page**, currently `us` and `uy`. Any other locale gets`justwatch.com/`, which redirects to that visitor's country — a working pagerather than a guess. The table grows one verified entry at a time.
  

### Added — guards

* `watchUrl()` is extracted and **run** against nine locales rather than grepped:the two verified ones must build a real search URL, and `en-GB`, `pt-BR`,`de-DE`, `fr-FR`, `es-419`, bare `es` and an empty list must all fall back tothe root without inventing a path. The `JW` table may contain only theverified pairs, byte for byte.
* Four smoke checks on the rendered link, including that no ISO country code isinvented and the region-less path never returns.

### Note

Three versions of this link were wrong before this one: a region-less path, thena locale-derived country. The first guards written for it grepped for strings andwould have missed both failures they existed to catch — they now run the function,which is the rule this repository already had.

## [1.3.0] — 2026-07-28

The catalogue release. Four entries, a new continuity, every brand name removed,and one tagline in place of three.

### Added

* **Kite Man: Hell Yeah!** (2024, 10 episodes) joins Harley Quinn’s Gotham. Samecontinuity, same writers, and it sets up the fifth season directly.
* **Teen Titans: Trouble in Tokyo** (2006) and **Teen Titans Go! vs. Teen Titans**(2019) join the Teen Titans group. Each now follows the series it closes orcrosses, the same interleaving that made group 18 the model for the DCAU fix.
* **Group 28, The DCU**, with **Creature Commandos** (2024, 7 episodes). Batmanappears once, apprehending Doctor Phosphorus. The group is named for thecontinuity rather than the show because it is where live-action will land.

All four sit in era 0, “Outside any timeline”, so **Bruce’s life is unchanged** bythis release — only by-universe and release order gain entries.

Counts: **151 → 155 entries, 96 → 98 films, 55 → 57 seasons, 27 → 28continuities, 1,434 → 1,451 episodes.** `frozen-ids.json` re-blessed.

Creature Commandos season 2 is deliberately absent: it is announced, but sourcesdisagree between 2026 and 2027. It goes in behind the “NOT OUT YET” badge whenthe date firms.

### Removed

* **Every brand name.** All 27 `where:` strings deleted, along with the threeplaces each rendered: the hero’s where line, the group sub-line(`6 of 11 · HBO Max` → `6 of 11`) and the group where line. Nineteen of 27groups named HBO Max, up to three times each — roughly forty repetitions of onebrand down a single scroll, for information that rotted monthly and was wrongoutside one country.
* **Two of the three watch links.** “Rent on Prime” and “Apple TV” are gone.
* `.gwhere` and `.hero .where` CSS, now dead.

### Changed

* **One link: “Where to watch ↗”**, with no region in the path. The aggregatorgeo-redirects, which is right everywhere instead of right in the United States.
* **One tagline, in all six places it lives:** `<title>`, `og:title`, the metadescription, `og:description`, `manifest.json` and the README headline all nowread **One path through every Batman**. They previously carried three differentstrings between them.
* **“The Animated Dark Knight” is retired**, and “animated” comes out of thedescriptions — both stop being true when live-action arrives, and `og:title` iswhat every shared link displays.
* `og:description` no longer promises to “find where each one streams”, whichdescribed a feature this release removes.

### Added — guards

* A brand denylist across the catalogue and the watch link, so no service namereturns one entry at a time. The link may not hardcode a region, and the entrylink row must stay a single link.
* The tagline must appear in the title, `og:title` and the README, the retiredones must not appear anywhere, and copy may not describe the catalogue as“animated” — that becomes false in 1.5.0.

## [1.2.5] — 2026-07-28

A deep QA pass over 1.2.4. Two behavioural fixes, one copy fix, and the READMEcatches up with the QR removal.

### Fixed

* **Shared view links now work while the app is open.** The hash router ran onlyon page load — there was no `hashchange` listener — so tapping a `#life` or`#release` link with Night Watcher already running did nothing at all. Therouter is extracted to `routeHash()` and runs on both load and hashchange.Routing a view still never changes the stored path.
* **The restore box admits what it accepts.** It has taken a full restore link(not just a bare code) since 1.1.0, but the placeholder only ever mentionedcodes. Now: “Backup code, restore link, or full JSON”.
* **The README no longer describes the QR** removed in 1.2.4: the intro’s“only third-party code” line, the guards paragraph’s payload sentence, and thefull vendored-licence block in Credits — a licence for code no longer in therepository — are gone or rewritten.

### Added — guards

* A `hashchange` listener and `routeHash()` must exist — shared links workingonly on a cold load is exactly the kind of regression nothing else would catch.
* The README may not mention the QR, the encoder, or its author — 1.2.4 removedthe code and three passages kept describing it, one of them a licence block.Docs drift is invisible until a reader trips on it, so the check is mechanical.

### Verified, no action

The deep pass also cleared three suspicions as false alarms: the clear-allconfirmation exists (two-tap, crimson, self-disarming after 4 s — the probegrepped for words the copy doesn’t use); Next up is fully path-aware through`pool()`; and “next = 1993” under release order was movie scope working asdesigned, films starting in 1993.

## [1.2.4] — 2026-07-28

### Removed

* **The QR encoder.** 20 KB of vendored, minified third-party JavaScript — 15% ofthe whole file, carrying a licence obligation — for a feature used twice ayear. **index.html drops from 131.4 KB to 111.2 KB raw, and 42.4 KB to 34.9 KBgzipped.** The app now contains no third-party code at all.

### Changed

* **Transfer is a link instead of a QR.** This is not a replacement built for theoccasion: `restoreLink()` already existed, already produced a `#nw=` URL, andthe app already restored from that hash on load. The QR was one *presentation*of that link and the only thing surfacing it — **Copy link** now does the jobin three lines.It is also better. A link travels through any messaging app, needs no camera,no line of sight and no second device present, and it never hits the capacityceiling the QR did — the old panel had a fallback for codes too long to encode.
  

### Added — guards

* The Copy link control, `restoreLink()` and the `#nw=` handler must all exist.With the QR gone the link is the entire transfer mechanism, and losing thecontrol that surfaces it would quietly reduce transfer to copy-and-paste.
* No vendored third-party code may return to `index.html`.
* Guard 8 previously measured worst-case QR payload against v40-L capacity. Thatceiling no longer exists, so the guard now protects the link instead.

`qa/smoke.js` is 83 checks: making a code surfaces Copy link, the link isabsolute and carries the code, opening it restores, and no QR encoder is loaded.

### Headroom

18.5 KB → **38.8 KB raw**. At 246 bytes per entry that is room for roughly 155more titles rather than 75, which changes the live-action expansion from tight tocomfortable and makes the planned v1.5.0 efficiency pass optional rather than aprerequisite.

## [1.2.3] — 2026-07-28

A catalogue QA pass. No code paths changed, no IDs added or renamed — still 151entries, 96 films, 55 seasons, 1,434 episodes, 27 continuities.

### Fixed

* **The DC Animated Universe spoiled itself.** By-universe renders in arrayorder, so the array *is* the watch order. Group 01’s note says to save Beyond,Zeta and Return of the Joker for the very end, because JLU’s “Epilogue” spoilsBatman Beyond — but the array listed all eight films first, putting **BatmanBeyond: The Movie third and Return of the Joker seventh** out of 25. The twothings the note warns about were among the first a new user would tick, withthe warning printed directly above them.The group now follows its own instructions: the series first with Phantasm andSubZero dropped in, the Superman detour around The New Batman Adventures,Mystery of the Batwoman and Chase Me to finish, then Justice League andUnlimited, and Beyond, Zeta and Return of the Joker last. *The Batman* (group
  
  18. was already interleaved correctly and was the model.
  
  Reordering only — every `i:` is unchanged, so saved progress and every backupcode in circulation still resolve exactly as before.
  

### Added — guards

* Documented spoiler order is now enforced. Three rules, checked by arrayposition: Beyond, Zeta and Return of the Joker must follow JLU; Phantasm andSubZero must follow the first season they drop into; Return of the Joker mustclose Beyond. A group note is prose and cannot enforce itself — this is thesame failure that let the order drift in the first place.

### Known, not actioned

Three titles sit inside continuities the catalogue already carries in full andare missing: **Kite Man: Hell Yeah!** (2024, Harley Quinn continuity),**Teen Titans: Trouble in Tokyo** (2006, the 2003 series’ finale film) and**Teen Titans Go! vs. Teen Titans** (2019). They are additions, which is a MINORbump under this repo’s own rule — they move the headline counts and requirere-blessing `frozen-ids.json` — so they wait for 1.3.0.

Also noted: *Teen Titans Go!* sits in group 25 while *TTG To the Movies* sits ingroup 14. And sources disagree on whether Knightfall is a three- or four-partadaptation; the catalogue carries three.

## [1.2.2] — 2026-07-27

Tidying the bottom of Progress turned up a real bug on the way.

### Fixed

* **Ticking anything before choosing a path silently assigned you one.** Thechooser is Home’s empty state, but the other tabs work without a path — youcan open The Path and start ticking straight away. `persist()` wrote`mode: S.path || S.mode`, so with no path chosen it saved `mode:"continuity"`,and on the next load the 1.1.0 migration rule adopted that as a deliberatechoice. The chooser never came back and the user was on by-universe havingnever picked it.`mode` now mirrors `path` and nothing else. When no path is set it writes anempty string, which fails `isPath()` and is adopted by nothing. Real 1.1.0saves still migrate exactly as before.Found by questioning a `persist()` call that looked merely redundant. Itwasn’t redundant on the one route where it mattered.
  

### Changed

* **The path row is gone from Progress.** It duplicated the Change control onHome’s path card — two controls for one setting, which is how two places driftinto disagreeing. Deleted rather than relocated.
* **“Backup & transfer” is now “Your data”**, which is what that half of thescreen is: progress in portable form. It stays in Progress rather than movingto a settings screen, because backup, restore and clear-all are all progressoperations and only one item in that tail was genuinely misfiled.
* **Darker is a single unlabelled row at the very bottom**, below everythingelse. One toggle does not earn a settings screen, and building a room for oneobject is how a small app stops being one.

### Removed

* The `data-mode` click handler. Nothing has rendered `data-mode` since theswitcher left The Path in 1.2.0; the handler survived it and read as thoughthe ordering were still switchable from somewhere.
* The `persist()` in `goToGroup()`. Every value that function touches — tab,filter, query, mode, groupOpen — is session state by design.

### Added — guards

* `persist()` may not fall back to `S.mode`, and must still mirror `path` intoit for downgrade safety. Both directions guarded, both negative-tested.
* `PATHS.map` must appear exactly once, so a second path control cannot reappear.
* `dataset.mode` may not return.

`qa/smoke.js` is 79 checks, including persisting with no path chosen andasserting the payload carries no ordering.

### Changed — source

* **Comments trimmed throughout**, in `index.html` and both test files. The ruleapplied: keep the sentence that stops someone reintroducing a bug, drop theretelling of how it was found. Constraints, warnings and “never do X”instructions are intact — frozen IDs, exclusive tier resolution, the ratingsclamp, the scrollbar gutter, the single hero size — each now in one or twolines instead of four to fourteen.
* The vendored QR encoder’s MIT licence header and the fonts/palette attributionblock are untouched, verbatim.
* One comment had gone stale and is now correct: `persist()` still described the`S.mode` fallback removed directly beneath it. Prose that isn’t load-bearingdoesn’t get checked when the code moves, which is the argument for less of it.

### Not removed

Two CSS rules looked unreferenced under a first audit and both were falsepositives: `.full` is emitted by string concatenation (`'ucard'+(pct===100?" full":"")`)so no `class="…full…"` literal exists to grep for, and `.js` was never a classat all — a crude selector regex reading `sw.js` in a comment. Left alone.

## [1.2.1] — 2026-07-27

### Fixed

* **A view was a one-way door.** With a path chosen, tapping a universe card onHome takes you into by-universe — correctly, since that grouping only existsin that ordering. But the banner offered only *Make this my path*, so the onlyroute back to your own was a reload. `mode` is deliberately not persisted,which is exactly why reloading appeared to fix it, and why a missing controllooked like a glitch instead.The banner now goes both ways, and **Back to *your path*** leads, becausereturning is the likelier intent of the two. *Make this my path* stays as thequieter option beside it.
  
* **Tapping The Path tab returns you to your path.** A view now lasts as long asyou are looking at it, which was already true of a reload. Leaving the tab andcoming back used to leave you in the borrowed ordering with no indication thatthe tab was no longer showing what its name promised.
  

### Added — guards

* The viewing banner must contain a way back, and the tab handler must reset`mode` to the chosen path. Both negative-tested.
* `qa/smoke.js` grew from 72 checks to 78, walking the exact reported route:choose a path, tap a Home card, confirm the banner offers the way back, takeit, and confirm both that the ordering returns and that the banner clears.

## [1.2.0] — 2026-07-27

The ordering becomes a choice you make once instead of a question the app askson every visit. Plus a darker theme. The catalogue is unchanged.

### Added

* **Your path.** The three orderings are no longer a switcher — you pick one andthe whole app follows it. Home is the chooser until you have picked; afterthat it leads with a path card carrying that path's own completion ring and aquiet **Change**. The header sub-line reads the path name on every screen, sothe reminder costs no new chrome. `S.path` is the locked choice; `S.mode` iswhat is currently on screen.
* **Following a shared link no longer rewrites your path.** `#life`, `#release`and `#universes` set `mode` only, and The Path shows a banner offering toadopt what you are looking at. Only `path` is persisted, which is what makes aview a view.
* **Darker.** A pure-black AMOLED variant for watching in an actually dark room,in Progress next to the path row. Surfaces only — every text and accent tokenis untouched, so contrast can only improve: `--dim` on `--card` measures**5.07:1** against the default theme's 4.57:1. The header and tab bar werehardcoded `rgba()` and are now tokens, or no theme could have reached them.`<meta name="theme-color">` is repainted at runtime, since CSS cannot touchthe system status bar and an installed app would otherwise show a header inone colour under a bar in the other.

### Changed

* **The Path stops asking.** The three-way switcher is gone from the tab; itsurvives as Change on Home and one row in Progress. Two controls removed froma screen you visit constantly, for a decision you make once.
* **Backup codes are `NW2`** and carry the chosen path in a `P` segment, so arestore onto a new phone arrives already on the right ordering. Verifiedagainst the real shipped 1.1.0 build in both directions: 1.1.0 restoreseverything except the path from an `NW2` code — exactly what the forwardtolerance shipped in that release was for — and 1.2.0 still reads every `NW1`code ever written. 1.0.0 will reject `NW2`; `sw.js` is network-first, so any1.0.0 client that has opened online since is already past it.
* JSON exports are `v:2` and carry the path. A restore adopts it only when nopath is set locally — restore merges progress, it does not take over a device.
* `persist()` writes `mode` as well as `path`, deliberately carrying the *path*value: a 1.1.0 build reading this payload knows nothing about `path` and wouldotherwise fall back to its own default, landing the user in an ordering theynever chose.

### Migration

Anyone upgrading from 1.1.0 has their saved `mode` adopted as their path. Theyalready answered this question; asking again with progress on the board would beasking for nothing. The chooser is for genuinely new arrivals — a save with noordering at all still gets it.

### Added — guards

* The path vocabulary must agree with itself: every path in `PATHS` needs ablurb, a code letter, and a letter that round-trips. Two paths sharing aletter would restore as each other.
* The switcher may not return to The Path, the path card and chooser must exist,Change must exist, and `persist()` may not write `S.mode` as the path — thatlast one is how following a shared link would quietly overwrite your ordering.
* **Contrast is now measured per theme.** The previous version took the firstvalue of each token seen anywhere in the file, which measured the defaultpalette and would have ignored the darker one entirely. Themes are parsed asblocks; a second palette failing AA is precisely the regression this guardexists to catch, and it would have sailed straight through.
* Every theme needs a `THEMEBAR` colour, `applyTheme()` must be called, and theheader and tab bar must stay on tokens.
* **A weight budget:** 150 KB raw and 50 KB gzipped, currently **138.5 / 45.5**.Nothing enforced the premise but good intentions. It should hurt to import alibrary. No external script may be loaded at runtime.

`qa/smoke.js` grew from 38 checks to 72 — first run shows three cards and nohero, choosing goes through the real click handler, a reload comes back on thepath and theme, a 1.1.0 payload migrates without being asked again, a save withno ordering still gets the chooser, viewing a foreign ordering does not changestorage, switching path keeps every tick, and the status bar follows the themeboth ways. Every new guard was negative-tested.

## [1.1.0] — 2026-07-27

Acted on an external QA review. Two of its five findings were already fixed in1.0.0, one was based on a miscalculation, and one was real but in a differentplace than reported — the reasoning is kept here so the same review does not getre-litigated the next time it lands.

### Fixed

* **A blocked store now says so.** Safari Private Browsing, an exhausted quotaand some embedded webviews all make writes throw. The app already caught thatand set `canSave = false`, but said nothing: ticking kept working in memoryand the entire session disappeared on reload. A warning now sits inside thesticky header — below the header it would scroll away, and this is the onemessage that must not be missed. It is checked on every render and on bothfailure paths, so a store that dies mid-session surfaces too.
* **`.hero .yr` reads `--dust` instead of `--dim`.** The hero is a gradient from`--card2`, and the year line sits high enough in it to measure roughly**4.33:1** — under the 4.5:1 AA floor. Everything lower in the hero hasreached `--card` and passes.
* **Star buttons are a 36×44 target**, up from 30×34. The width carries what wasthe gap so neighbouring stars tile exactly rather than overlap — anoverlapping expansion would make rating *less* accurate, which is the oppositeof the point — and the height comes from a pseudo-element, so the row does notgrow by 10px. A full 44 wide would need a 220px row and push the buttons in`.acts` onto a line of their own; 30px already cleared WCAG 2.2 AA (2.5.8,24×24), so that trade was not worth making for an AAA-level target.

### Changed

* **The backup-code parser tolerates codes it was not written for.** A code isnow read as `NW<version>` plus segments, and unrecognised segments and versionnumbers are skipped rather than rejected. `exportCode` still writes `NW1`, socodes remain interchangeable with 1.0.0 in both directions — nothing new isbeing carried yet. This ships now precisely because it is worthless later:forward tolerance only helps if it is already installed when the first codethat needs it appears.

### Added

* Guard: text contrast is computed from the palette rather than argued about.`--dim` measures **5.03:1** on `--sunk` and **4.57:1** on `--card` — the reviewreported 3.2:1 and asked for it to be lightened, which would have flattened themeta/body hierarchy to fix nothing. The guard fails under 4.5:1, warns under4.8:1, and hard-fails if `.hero .yr` returns to `--dim`.
* Guard: the storage warning must exist, must sit inside `<header>`, must haveits `[hidden]` rule, and `flagSave()` must be called on all four paths.
* Guard: the parser must accept a forward-dated code (`NW2` carrying an unknownsegment), must still accept a pasted restore URL, and must still reject junk.
* Guard 7 now **extracts** `exportCode` and `importCode` from `index.html`instead of reimplementing them. The copies had already drifted out of syncwith the app, which is the exact failure this file exists to prevent — theparser change above would have gone completely untested.
* Guard: no `\uXXXX` escape may appear in the static markup. Inside `<script>`that sequence is an em dash; in markup it is six literal characters. Writingmarkup by adapting a nearby JS string is the natural way to do it, and itproduced exactly this bug while the storage warning was being written.
* `qa/smoke.js` grew from 24 checks to 38. It now boots a **second document with`localStorage` throwing**, which is the only way to observe the silent-failurebug this release fixes, and drives the real in-page parser against a 1.0.0code, a forward-dated `NW2` code, a pasted restore URL, a code broken acrosslines, and five kinds of junk.
* Verified across two live documents that a 1.0.0 page and a 1.1.0 page produce**byte-identical codes** for identical progress and restore each other'scorrectly in both directions. A `NW2` code is, as designed, rejected by 1.0.0 —which is the whole argument for shipping the tolerance before it is needed.

### Not changed, deliberately

* **`idHash` stays 5 characters.** The review put collision risk at 0.019% todayand >1% past ~300 entries, and asked for 6. Guard 3 has measured that since1.0.0 and warns at 1%; widening the hash means a new code format and orphansevery backup already saved. The day a collision is real, the guard fails thebuild and the format changes then.
* **Tier badges already carry text.** `BADGE` renders the words ESSENTIAL, COREand OPTIONAL, and guard 6 fails if any badge key lacks a label, so thecolour-blindness finding does not apply.
* **The Cloudflare SPA fallback** was fixed before 1.0.0 — `not_found_handling`is `"none"` and guard 10b fails if anyone re-enables it.

## [1.0.0] — 2026-07-27

First public release: **96 films and 55 seasons of television, 1,434 episodesacross 27 continuities**, in three watch orders, with progress tracking, livestreaming links and offline support.

The app ran as an untagged build before this. Everything below is the QA passthat went into tagging it, kept because it is the reasoning future changes willneed. The catalogue itself is unchanged: every `i:` slug is byte-identical tothe untagged build, so any backup code or saved progress from it restoresexactly as before. Verified in both directions — a code exported by the oldbuild imports into this one with identical state, and a code from this build isstill readable by the old one.

### Performance

* **The Path tab renders 76% faster and emits 68% less markup** (403 ms →96 ms, 285 KB → 91 KB on the full catalogue, measured headless). Detailpanels — a description, five star buttons and three streaming links perentry — were built for all 151 entries on every render and then hidden with`display:none`, roughly 220 KB of the 285 KB, re-parsed on every keystroke inthe search box. They are now built only for the row that is actually open.
* `buildGroups()` and `pool()` are memoised on `mode|scope`, the only two thingsthey depend on. A single Home render called `buildGroups()` seven times and`pool()` six, running `visible()` 1,208 times to produce the same answerrepeatedly. Next up is 81% faster, Home 56%, Progress 34%.
* **7% smaller over the wire** (45.4 KB → 42.2 KB gzipped). The 180×180 bat PNGwas inlined twice as byte-identical base64 — 14,552 characters, once for`rel=icon` and once for `apple-touch-icon`. Both now reference the real`icon-192.png` that already ships beside it; `sw.js` caches it so offlineinstalls are unaffected, and the paths are relative so a `file://` open stillresolves them.

### Fixed

* **Tab bar icons sat on four different optical centres.** The bar used fourunicode glyphs (`U+2302` house, `U+25B6` triangle, `U+2630` trigram,`U+25A0` square) resolved from four different font fallbacks. Measured on a24-unit grid, the play triangle's ink centroid landed at **x=9.57 against atarget of 12.00** — a tenth of the icon box left of centre — and the fourglyphs sat at four different vertical positions. `U+25B6` also carries anemoji presentation, so on iOS and Android it rendered as a wide colour glyphthat ignored the yellow selected-state colour. Replaced with inline SVG on ashared 24×24 grid; all four now centre within 0.12 units on both axes. Thetriangle is centred on its centroid rather than its bounding box, because abbox-centred triangle always reads as sitting too far right.
* **Next up sat 7.5px off-centre from every other tab.** `main` is`max-width:760px; margin:0 auto`, and Next up is the only view short enoughto fit a desktop viewport without scrolling — so it alone lost the verticalscrollbar the other three tabs have, and the centred column slid sideways byhalf the scrollbar width every time you landed on it. `html` now sets`scrollbar-gutter:stable`, reserving the gutter whether or not there isanything to scroll. Touch devices use overlay scrollbars and are unaffected.
* **The hero title was 15% larger on Next up than on Home** — for the samefilm. Both views render `upNext()`, so tapping "Resume the path" showed theidentical title jumping from `clamp(24px,6.5vw,36px)` to`clamp(28px,7.5vw,42px)`: Home overrode the size inline in both its herovariants, Next up was the only caller left on the stylesheet default, and thetwo drifted. The size now lives in the `.hero h2` rule alone and both inlineoverrides are gone.
* Scroll position was thrown away on every re-render. `render()` saved andrestored `scrollTop` on `<main>`, which has no `overflow` and is thereforenever a scroll container, so the value was always `0`. Now reads and restoresthe document scroll.
* The search box lost focus, closing the keyboard mid-edit, whenever the fieldwas cleared. Refocus was keyed on the query being non-empty rather than on thebox having held focus.
* Tapping a progress-donut slice collapsed every group and jumped to the top ofthe page, leaving the requested group up to twenty-six sticky headers belowthe fold. It now scrolls the target into view.
* A backup code carrying only star ratings restored correctly but reported`Restored 0`, which reads as a failure. Ratings now count toward the total.
* Tier filters were unreachable from the Path tab. The chip row spliced a tierchip in only while that tier was already active, so tapping "All" removed theonly route back to Essentials. All six chips are now permanent; the rowalready scrolled horizontally.

### Accessibility

* Pinch-zoom is no longer blocked. `maximum-scale=1` in the viewport meta failedWCAG 1.4.4 on a screen this dense in 9–10px monospace, and only everpenalised Android — Safari stopped honouring the cap in iOS 10.
* Tab buttons used `aria-selected`, which is only meaningful on a`role="tab"`/`option`/`row` and was therefore ignored outright by screenreaders. Now `aria-current="page"`.
* Group headers nested an `<h2>` inside a `<button>`, and film rows nested`<div>`s inside a `<button>` — both invalid, since a button may only containphrasing content. Group headers now use the standard accordion pattern withthe heading wrapping the button, preserving heading navigation.
* Added `aria-expanded` to group headers and film rows, `aria-pressed` to thewatched tick, per-title tick labels (they all read "Mark watched"), and an`aria-label` on the search box.

### Removed

* `window.__lastExport`, written on every JSON export and never read anywhere —a debug leftover that pinned the full export in memory.
* Eleven dead CSS declarations. A "Canon skin" block at the foot of thestylesheet restated `font-family`, `font-weight`, `font-size` and two bordercolours that were already set 180 lines above, so the base rules wereoverridden on arrival and the real value of a token lived nowhere near itsdeclaration. Folded back into their single base rule; the block is nowadditive only.
* Two hardcoded hex values (`#E3A72C`, `#28303F`) in the header progress ringthat bypassed the palette. It now reads the same two tokens as every otherprogress track in the app.
* The unused `data-tab` attribute on the header ring button, which has had itsown click handler since it was added.

### Changed

* Search placeholder reads "Search films and series" in Movies + Series scope.It always said "Search films" while searching both.
* `BUILD` is a semver string rather than a date, so it maps 1:1 onto this file.

### Added

* This file, and the release process in the README.
* Guards: the headline counts in the `<meta>` and `og:description` tags arechecked against the data (they were hardcoded and unverified, so they could gostale while the README stayed correct); `BUILD` must have a matching sectionhere and must equal the newest version in it; no hero title may carry aninline `font-size`; `.hero h2` must keep one; and `scrollbar-gutter:stable`must stay. Every new guard is negative-tested.
* `qa/smoke.js` grew from 12 checks to 24, covering on-demand detail panels,the full chip set, valid tab ARIA, no flow content inside buttons, the groupcache surviving a scope round-trip, and hero titles matching across viewsincluding the completed-catalogue state.
