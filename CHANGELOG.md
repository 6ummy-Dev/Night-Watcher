# Changelog

All notable changes to Night Watcher are recorded here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**The version here, `BUILD` in `docs/index.html` and `VERSION` in `docs/sw.js`
must all be the same string.** `qa/guards.js` fails the build if they drift, and
also fails if the newest version in this file has no `## [x.y.z]` section. That
is the whole point of this file: a shipped change that nobody wrote down is a
change that gets undone by the next person who touches the line.

## [4.2.5] — 2026-08-19

**The hygiene commit.** The 4.2.4 re-audit found one miss and named it in
bold: the changelog said `.wrangler/state` was out of the index and the
live tree still tracked it — a sentence claiming a fact the tree does not
hold, this project's most-repeated bug class, in the release note of the
release meant to close the audit loop. This cut makes that lie impossible
and lands the report's three optional hardenings. No features.

### Fixed

- **Guard 144: the wrangler state stays out of the index.** The section
  reads the git index file directly (no git binary, no child process) and
  fails while `.wrangler/state` objects are tracked — so the claim can
  only be made by a tree where it is true. Where no `.git` exists (a
  zip-applied copy, a negative scratch tree) it notes and stands down.
  **On the live tree this section is red until `git rm -r --cached
  .wrangler/state` is run — that is the point.** The false 4.2.4 sentence
  is struck above, not erased.
- **`dedupeLog` consults `BYID`** (C-5, the restore-path half of 4.2.4's
  gates). A previously polluted or hostile store could keep phantom ids in
  `S.log` through every restore — no loss, but a count lie, and one more
  path shaped differently from the other three. All four import/restore
  surfaces now agree: the log is a subset of the catalogue. Guard 35
  drives the drop; smoke drives it on the real page.

### Changed

- **A missing parser fails CI instead of warning** (Q-fn2). `fnIndex()`
  falling back to the legacy regex is fine on a bare laptop clone and a
  silent downgrade of every extraction under CI — the same lesson smoke's
  jsdom skip taught in 3.0.2. Under `CI` the absence of Acorn is now a
  failure.
- **Guard 145: the extract shape is pinned.** `fnIndex()` indexes
  FunctionDeclarations, which is every function this file has — but a
  future style shift to `var foo = function(){}` would *empty* the index
  without one red. Top-level function-valued variables are refused at the
  door: write a declaration, or teach the indexer the new shape in the
  same commit.
- New suite `qa/negative/negtest500.sh` (4 fixtures — three
  section-anchored; the acorn-under-CI one fires before section 1, so the
  sect pin in guard 138 moves 762 → 763 for the documented reason).
  Counts: 58 suites, 837 fixtures — 785 guards / 52 smoke — smoke 345
  checks, guard sections 145.

## [4.2.4] — 2026-08-19

**The parser release.** The re-audit of 4.2.3 said the remaining P1-shaped
risk was all in the instruments, and named the cut: make extraction a fact,
caller-proof the two import helpers, ratchet the section anchor, and write
the two-speed rule where releases are cut. Smaller than 4.2.3, as asked.

### Changed

- **`fn()` is a parser, not a regex** (re-audit Q-fn, the founding claim's
  weak joint). Acorn — dev-only, beside jsdom and Playwright; the page
  keeps zero runtime deps — parses the inline script once and indexes every
  top-level function declaration. An extract is the AST node's exact source
  slice: balanced by construction, immune to the column-0 assumption, the
  `)` -in-a-default-param case, and one-liners. A missing REQUIRED extract
  is now a readable `§`-attributed failure plus a stub, never a stack
  trace — and a new crash guard prints everything already collected if a
  section still throws on what the stub can no longer do, so the report
  survives the crash it is reporting. Without `node_modules` the file
  falls back to the legacy regex with a warning. `npm test` semantics are
  unchanged.
- **`applyImport` and `mergeLog` consult `BYID` themselves** (C-4). Both
  were safe only by the grace of their callers — importCode is fuzzed and
  cannot invent an id; Activity skips unknown logged ids at render. A
  future caller routing JSON through either would have reopened the door
  4.2.3 closed. The gates are theirs now; smoke drives an invented id at
  each and watches it bounce. The log is a subset of the catalogue.
- **The sect ratchet** (Q-3b). Guard 138 counts guards fixtures that pass
  no section number and pins the figure at 762 — the corpus written before
  4.2.4, which keeps the substring-anywhere semantics it was written
  against. A fixture added without `sect` fails the build; the pin may
  only move in a commit that says why. negtest490 plants one and watches
  the ratchet catch it.
- **RELEASING.md states the gate** (Q-2). For belt / scroll / focus /
  content-visibility / service-worker changes, browser-check is the test
  and `npm test` is only the tripwire — with the FAST / SLOW / MUTATE
  split written down so the sentence survives the person who knows it.
- New suite `qa/negative/negtest490.sh` (4 fixtures). Counts: 57 suites,
  833 fixtures — 781 guards / 52 smoke — and smoke's run is 344 checks.
  ~~`.wrangler/state` is out of the index (H-1, the last open morning
  item).~~ *Corrected in 4.2.5: that was true of the release branch and
  false of the live tree — a zip cannot carry a git operation, and this
  sentence was exactly the bug class the audits name. Guard 144 now
  refuses the claim until the index agrees.*

## [4.2.3] — 2026-08-19

**The audit release.** The 19 Aug full QA (code, QA code, efficiency — one
document) found no P0 but named the two persistence doors and four ways the
instruments were greener than the tree. One release, no new features:
instruments and the two persist doors, exactly as §8 of that report asked.
The report is cited here once and then left behind.

### Fixed

- **A corrupt store no longer loses your marks** (audit C-1, P1). A
  `localStorage` body that *read* fine but did not *parse* fell through
  `restore()`'s catch as "no state": the app booted as a first visit, kept
  saving on, and the next tick overwrote the unread bytes with a near-empty
  payload — silent loss on the page whose pitch is that the data never
  leaves the device. A failed parse is now a failed read, the split the
  code already knew: `readFailed` latches, writes stop for the session, the
  #nosave banner shows, and the bytes stay on disk for restore-from-code.
  Guard 127 pins all three failure paths; smoke boots a document with a
  truncated payload, ticks, and asserts the old bytes survive.
- **JSON import can no longer write unknown IDs into live state** (audit
  C-2/C-3, P1). `doRestore()` counted known-versus-unknown against `BYID`
  and then wrote every key into `S` anyway — an invented slug inflated the
  counts, survived into storage, and waited to collide with a future real
  ID. Backup codes were fuzzed against exactly this; JSON was the unguarded
  door beside the vault. Unknown keys now increment `unknown` and stop
  there, and the `for…in` over parsed payloads goes through `HAS.call`, the
  same hardening `marksOf()` has had since the shaping work — a `__proto__`
  key counts as unknown and is dropped. Driven in smoke, not grepped.
- **The guards' flatten is the app's flatten again** (audit Q-1, P1).
  `qa/guards.js` said "Flatten exactly as index.html does" and did not: its
  copy carried an `out:` field the app never puts on `FILMS` and dropped
  the `d:` the app carries, so section 70 asserted `f.out` on an object the
  page never builds. The copy now matches byte-for-byte, section 70 reads
  `out:` off the raw `PATH` entries where the app does, and a new pin
  compares the two `FILMS.push` field lists on every run — the founding
  "extracted, never reimplemented" claim is finally checkable one screen
  down from where it is made.
- **The INDEX titles are pinned to their headers** (audit Q-7/H-3). Guard
  66 pinned the numbering in 1.4.2 and never the titles; 77, 82 and 103
  had all drifted, and 103 still narrated a *group* repaint two releases
  after the tick became a *row* paint — the exact "optimization" the 3.3.x
  scroll-jump class shipped as. All three entries now match their headers
  and the pin fails the build on the next drift.
- **`run-all.sh` counts every smoke fixture** (audit Q-6). Longest-first
  dispatch weighed suites with `grep -c '"smoke"'`, and the suite argument
  does not have to be quoted — negtest400's three bare `smoke main`
  fixtures counted as zero, so a heavy suite could start last. The pattern
  now matches the argument where it sits, quoted or bare, and agrees with
  guard 65's census over the same files.
- **`browser-check.mjs` stops lying about itself** (audit Q-9/Q-4/H-2/Q-13).
  The header said "not committed to CI" four minor releases after the
  browser job started running it on every push. The retracted-ring check
  hardcoded `109.96` while guard 80 computes 2πr — one radius edit would
  have failed a correct page; it now computes from the `r` the page ships.
  The two swallowed waits (`.catch(() => {})` on the CV settle and the
  cache fill) are named checks that say what never arrived. And the
  offline reload now asserts the worker serves *this* BUILD, not just any
  shell with entries — a stale cached shell passed the old bar, which is
  the 2.5.1 incident restated as a test.

### Changed

- **Every guards failure names its section** (audit Q-3). Failures print as
  `✗ §NN message`, with the section read off the call stack against the
  file's own headers — nothing hand-maintained. `run_case` gains an
  optional sixth argument naming the section a fixture is aimed at: when
  given, the expected string must land on that section's own `§`-prefixed
  line, so a mutation that breaks four sections can no longer pass a
  fixture from the wrong one. The 825 existing fixtures keep the semantics
  they were written against; new fixtures should name their section.
  `qa/negative/negtest480.sh` carries the four new fixtures (two drive
  smoke behaviour, two use the section anchor), and the counts move:
  56 suites, 829 fixtures — 779 guards / 50 smoke — and smoke's own run is
  340 checks.
- **qa.yml stops quoting a wall clock.** The cost comment's "~14 s full
  run" was measured on one machine and narrated on all of them (the audit
  host measured ~43 s). The guarded split counts stay; the figure is gone.

## [4.2.2] — 2026-08-18

**Four tabs, one footer.** The owner's punch list: the footers weren't all
centered, only The Path's carried a separator line, and Progress had a
saves-line under "Clear all progress" restating what the Your Data card says
two blocks up.

### Changed

- **Every tab's footer now carries the legend's hairline** — `border-top:
  var(--line)`, 18px of air — and centers: Home's colophon and Next up's
  watching-truths gain the line, Progress's build/support block joins the
  `.note.foot` system, and The Path's legend (which had the only line)
  centers its rows. Consecutive foot-notes share one line, not one each.

### Removed

- **The saves-line.** "Progress saves automatically in this browser…" under
  the Clear button was a second copy of the Your Data card's own first
  sentence, and two copies of one fact drift — guard 121's lesson, applied
  the way the watching-truths were in 3.7.0. The no-save case was already
  the header's #nosave banner, which renders whether or not Progress is
  open. The guard that required the line now refuses it;
  `qa/negative/negtest131.sh`'s fixture flips with it (same case count).

## [4.2.1] — 2026-08-18

**The story card draws YOUR skyline.** Since 4.1.0 the card has drawn the
Progress tab's chart — but always the universes cut of it, whatever path the
reader had chosen. `drawShareCard()` hardcoded `PATH` and `"c"+gi` keys, so a
reader on *Bruce's life* got a card whose mode line said their path and whose
skyline said somebody else's. Reported by the owner the day 4.2.0 was cut.

### Fixed

- **`drawShareCard()` picks its groups the way its own mode line already
  did** — from `S.path || S.mode`: eras on *Bruce's life*, decades on
  *release order*, universes otherwise, through the same `groupFilms()`
  keys `viewStats()` uses. The closed-count line and the key line under the
  rule speak the same word ("N of M eras closed", "N ERAS · WIDTH IS SIZE ·
  FILL IS WATCHED"). A fresh visitor with no path chosen still gets
  universes — the old behavior was only wrong once a choice existed.

## [4.2.0] — 2026-08-18

**The numbers get their own voice.** Anton has carried every title AND every
big count since the beginning, so a score never read as a score — the owner
noticed the same face doing double duty across the scoreboard and the cards,
reviewed four OFL candidates side by side against the current face, and chose
Big Shoulders Display. It was already family: the `--deco` stack has named it
as Limelight's fallback since 1.0 — Chicago deco-industrial, the same era and
city as the wordmark.

### Added

- **`big-shoulders-display-latin-700-normal.woff2`** joins `docs/fonts/`:
  subset through `qa/subset-fonts.py` like the rest (9,964 bytes; its OFL
  carries no Reserved Font Name, so Limelight's keep-whole rule does not
  apply), blessed into `qa/font-subset.json`, preloaded with the other six
  (guard 124's set equality holds), precached by `sw.js`, licence section
  appended to `docs/fonts/OFL.txt`, row added to the README file table.
- **`--num`** — the numeral stack: Big Shoulders Display 700, falling back
  to the title stack so a failed load degrades to exactly what 4.1.x
  looked like.

### Changed

- **The scoreboard tiles** (`.bigstat b`) and **the story card's count**
  (`drawShareCard`'s 230px figure) set in the numeral face; every title
  stays Anton.
- **`docs/share.png` regenerated** with the new numerals — and the stats
  row's three columns are now equal-width, which centers the middle count
  on the card's own centerline: the old flex box was centered as a group,
  but "CONTINUITIES" is a wider column than "FILMS", so the middle number
  sat 27.7px left of the wordmark's axis. Measured, not eyeballed, at the
  owner's "check alignment" — the same pass verified the Brave banner
  lockup centers at exactly x=1350 with symmetric 84px margins inside the
  2:1 crop window.
- **The Brave Creators banner** rebuilt to the recorded spec (2700×528,
  crop-critical content inside the center 1056px) with the numeral face on
  its three stats; delivered to the owner for the dashboard — the banner is
  not a served file of this repo.

## [4.1.2] — 2026-08-18

**Closing a group no longer throws the reader down the path.** The group
head is `position:sticky` and scroll anchoring is off by design
(`overflow-anchor:none` — the app pays its own compensation or the defect
is visible). This was the one collapse nothing paid for: close a long group
from deep inside — the head stuck at the top of the viewport, under your
finger — and the body vanished while the panel's scrollTop kept its number.
Measured at 390×844 on the largest universe: the list lost ~1,300px, the
clicked head landed 1,206px above the viewport, and the reader landed
somewhere else in the path entirely, with keyboard focus still on the
now-off-screen head.

### Fixed

- **`groupUpdate()` anchors the clicked head.** Its viewport top is read
  before the class toggle and again after, in the click's own task, and the
  drift is handed to `scrollPut()` — the head stays exactly where it was
  clicked. A short, unstuck head measures a drift of 0 and nothing moves;
  opening a group grows the body below the head, drifts 0, and never
  writes. The two `getBoundingClientRect` reads are pinned and argued in
  guards section 120 (2 → 4, the same shape as 3.8.3's search-box anchor),
  and `qa/negative/negtest320.sh`'s multiply fixture now expects 5.
- **`NOTES.md`** records the mechanism under `drift`, beside the sticky-head
  and scroll-seam notes it belongs with.

## [4.1.1] — 2026-08-17

**The README goes on a diet.** Documentation only — nothing served changes
beyond the build string. The README had grown to ~4,500 words by narrating,
in place, history this file already records: the beta era, the mirror
unpublishing, the aggregator attempts, the beacon, all five weight-ceiling
raises, the guard-138 origin story, the 1.6.5 cold-start lesson, and a file
table whose every row carried an essay. A history that lives in two files
drifts in one of them, and this file is the record.

### Changed

- **README.md loses over a thousand words of history.** Every retelling
  removed in favour of the CHANGELOG entry that already records it; the file
  table keeps every row (guard 45 still holds it against the tree) with
  one-line purposes; the four prose paragraphs restating guard sections in
  the Checks section collapse to an outline pointing at `qa/guards.js`,
  where each rule lives beside the code that enforces it, negative-tested.
  Every guarded anchor stayed and stayed green: the canonical sentence, the
  headline counts, the era run, the old-origin paragraph (still marked
  unpublished, still no present-tense offer), the visit-counts bullet, the
  catalogue hard cases, the tagline, the size figure, and the 55 / 825 / 332
  counts.
- **README gains the CI badge and the share card as a first image** — the
  badge is served by GitHub itself; the repo page fetches nothing from a
  third party, same as the app.
- **The cold-start verification rule moved to `RELEASING.md`** ("Before the
  version moves"), because it is a live release rule, not history — the
  checklist that runs is where it can be followed.
- **The file table's reasoning moved to `NOTES.md`** ("The README goes on a
  diet"), not deleted — the favicon family, the IndexNow key, `vp.html`,
  `_headers`, the browser check's inside-the-click measurement. The rule is
  the same as 1.6.3's: reasoning moves out of the shipped surface and into
  the file that exists to carry it.

## [4.1.0] — 2026-08-17

**The story card learns the app's own chart.** Since 3.8.2 the Progress tab
has drawn the skyline — every universe a bar as wide as its share of the
catalogue, filling bottom-up as you watch — while the share card kept drawing
an older cousin: equal-width bars, height standing for size, a 50% yellow
wash. Two charts claiming to be the same picture. Now the card draws the
skyline too, from mockups the owner reviewed against three alternatives.

### Added

- **The support line.** The standing open item, closed: one line in the
  Progress footer, under the build line — `Keep the path lit. Support` —
  with the one word carrying the link to the owner's Brave Creators page
  (verified since 4.0.4; the only rail). The host joins the guard's NAMED
  allowlist — origins the page may mention, never fetch — the anchor
  inherits the same guarded underline as "read the source", and the line
  gets its own guard clauses plus three negative fixtures in negtest273
  (gone / reworded / above the build line). Fixture counts move 822 → 825
  (774 → 777 guards-running) in the README and qa.yml.

### Changed

- The share card's bottom chart is the Progress skyline at card scale: bar
  width is the universe's share of the catalogue (8px floor for the one-film
  continuities, the rest squeezed proportionally, same as the app's flexbox
  does), the track is the app's line color, the fill rises bottom-up in
  **solid** signal yellow — the half-alpha wash is gone, and with it the
  62%-alpha "complete" variant; a finished card is every tower fully lit
  plus the yellow bat, which says it louder. Skipped entries cap their bar
  in steel, exactly as on Progress. Corners rounded via `roundRect` where
  the browser has it, square where it doesn't.
- A key line under the rule, in the scope line's voice: `44 UNIVERSES ·
  WIDTH IS SIZE · FILL IS WATCHED` — the count is live, the reading lesson
  travels with the picture.
- The Limelight wordmark grows 64 → 96px, on the owner's call from the same
  mock round ("Limelight wordmark but bigger"). Baseline holds at 300; the
  word grows upward into space that was empty.
- The card's bottom block does not move: rule at 1590, strapline at 1700,
  domain at 1750, bat at its 2.7.1 seat — guard 108 still holds all four.

## [4.0.9] — 2026-08-17

**The footer, measured.** The owner ran `vp.html` on the installed app and the
numbers ended three days of guessing: screen 874pt, granted viewport 812 —
`svh`/`dvh`/`innerHeight` all agree at 812, `vh`/`lvh` claim 874, and the
painted stripes prove the webview renders NOTHING below 812. The short render
is real; the 16 Aug `height:100%` decision was right; no height unit and no
heal will ever reach the bottom 62pt on iOS 26. What CAN be fixed, is:

### Fixed

- **The 34pt phantom pad is reclaimed.** `env(safe-area-inset-bottom)` still
  reports 34 inside a viewport whose bottom edge sits 28pt ABOVE the home
  indicator — an inset for an indicator that is not over the page. The tab
  bar's pad is now `max(0px, calc(env(safe-area-inset-bottom) -
  var(--vpdead, 0px)))`, where `vpSync()` writes `--vpdead` (the measured
  screen-minus-viewport gap) in standalone and nothing else ever sets it: a
  browser keeps the full inset, a healthy install keeps the full inset, and
  the short-granted install stops padding for a bezel it cannot reach. The
  visible footer drops by a third.

- **The dead band reads as bezel now.** The canvas below the app was
  `--ink`, and iOS frosts whatever sits at the bottom edge — navy frosts to
  the owner's grey stripe; black frosts to black (proven live by the darker
  theme). `body` is `#000` and `#app` carries `var(--ink)` as its own
  ground: every visible pixel of the app is unchanged, and the one region
  the app cannot render — iOS's 62pt — now shows frosted black and reads as
  hardware.

- **The heal gives up when a toggle changes nothing.** vpHeal() stays for
  the documented keyboard-shrink bug, but the probe proved the cold-start
  gap is not stale — so a heal whose re-measure moves nothing now spends
  its whole cap at once instead of toggling `#app` six times per session.

### QA

- **negtest200/210/270 repaired — the three red CI shards.** Each quoted a
  reduced-motion list from a mid-4.0.4 draft that never shipped; each sat in
  a different shard, which is why shards 1, 2 and 3 were red and 4 was
  green. Retargeted to the list the tree actually carries. (The `browser`
  job's 42s failure is the Playwright `--with-deps` apt step on the runner —
  environmental; re-run it.) Guard: the tabs-pad clause moves to the
  reclaim form, vpSync/--vpdead and the give-up line are pinned, and
  negtest478's fixtures follow vpTick.

## [4.0.8] — 2026-08-17

### Fixed

- **The installed app's dead band, healed at the root this time.** The owner
  called the mechanism before the research confirmed it: the band was never a
  problem while the document scrolled, because a scroll is what makes WebKit
  re-resolve its viewport. 3.9.7 moved scroll onto `#app` and the document
  went silent — so a stale standalone grant (the collapsed browser-chrome
  height, granted at cold start for chrome that does not exist) just sticks,
  `height:100%` honestly fills the short number, and the remainder shows as
  a band nothing in CSS could reach. Three fixes missed because they changed
  what the frame believes; none made WebKit re-measure. `vpHeal()` does: hide
  `#app`, force one layout, show it — same task, no paint in between, no
  flash — and WebKit re-resolves the viewport. It runs at standalone boot,
  on app resume, and after every input blur, which also heals the documented
  iOS bug where the keyboard shrinks the viewport for good (this app has a
  search box). Four gates keep it honest: standalone only, portrait shrink
  over 24px (iPad windows and desktop installs are legitimately short),
  never while an input holds focus (`display:none` would eat the keyboard
  mid-word), and capped tries — if the short render is real, the heal is a
  no-op and must not spin. Scroll survives through the seam
  (`scrollKeep`/`scrollPut`) and the deck re-snaps (`snapTo`). If the band
  still shows after this, it is iOS's own render and `vp.html` will say so.

- **The glow does not pulse any more, and that is the fix.** "Why was it OK
  before the swipe?" — because before 4.0.0 the glow sat on the belt strip,
  on opaque card, in the content column, where animating a box-shadow is
  cheap. The swipe rework moved the handle onto the header's live
  backdrop-filter, and an ANIMATED box-shadow over a blur layer repaints the
  blur every frame — the on-device glitch, four shape-tweaks in a row,
  because the shape was never the fault. The glow is now STATIC: the same
  owner-tuned two-layer corner hug, permanently on while the handle is
  parked. Nothing repaints, nothing glitches, and reduced-motion needs no
  carve-out — a still image is compliant by construction. The keyframe is
  deleted and guarded against return: a pulse must be argued against the
  repaint bill it reintroduces.

### QA

- Section 120's census admits `innerWidth`/`innerHeight` (pinned 1/2, window
  metrics, the heal's two gates) and argues `offsetHeight`'s second
  appearance — vpHeal()'s forced reflow IS the mechanism. The standalone
  block grows five vpHeal clauses; section 130's glow block is rewritten for
  the static shape with the keyframe REFUSED. **negtest478** proves the new
  clauses bite; 380/476's glow fixtures retargeted to the static form;
  negtest320's census message follows the new count.

## [4.0.7] — 2026-08-17

### Changed

- **The glow is a little brighter and reaches the corners.** 4.0.6's single
  under-edge left the strip's rounded corners dark; the owner asked for
  brighter, corners included. Two layers now, both in `--signaledge`: a tight
  hug (`0 1px 5px -1px`) that lights the outline and both bottom corners, and
  a down-biased bloom (`0 3px 12px -3px`) that carries the brightness below
  the strip. Verified against the 4.0.4 failure before shipping: no
  full-width seam through the header's backdrop-filter, no wash over the
  cards passing beneath. Section 130's pin moves to the new shape.

### Added

- **`docs/vp.html` — the viewport probe, because the next standalone fix will
  be measured, not guessed.** The bottom band in the installed iOS app has
  now outlived three fixes, and the research splits into two documented
  failure modes with OPPOSITE prescriptions: a stale short *grant* (webview
  renders full height, `100%` believes the lie — fix is `100vh` and a
  re-measure heal) versus a true short *render* (`100vh` overshoots and cuts
  the tab bar — the owner's own 16 Aug screenshot). One page answers it from
  the device: five height units, one painted stripe each, ending exactly at
  the bottom that unit believes in — the stripes that are visible mark what
  iOS actually renders — plus the numbers (`screen`, `innerHeight`,
  `visualViewport`, safe-area insets) and a keyboard round-trip to expose the
  documented shrink-for-good bug. Out of the offline shell (an offline copy
  of a measuring instrument is a contradiction), named in guard 13's
  exclusions with its own removal condition, `noindex`, never linked from
  the app. The height decision waits on its screenshot.

## [4.0.6] — 2026-08-17

### Fixed

- **The peek sits on the column again.** On any desktop with classic
  scrollbars the peek rode 7.5px right of the strip it retracts into:
  `scrollbar-gutter:stable` reserves the gutter on one side, so a panel's
  column centres against viewport-minus-scrollbar while the header-anchored
  `#beltpeek` centres against the viewport itself. `stable both-edges`
  reserves the gutter symmetrically and the two centres agree to the pixel
  (measured 640/640 in the harness at 1280px). The original stable-alone
  defect stays fixed — a panel too short to scroll still reserves what its
  scrolling neighbors do — and browsers without `both-edges` degrade to
  exactly the 4.0.5 behaviour, not to something new. Owner-reported.

- **The glow lights the handle, not the page.** The 4.0.4 halo
  (`0 0 16px` all round) did two things nobody asked of a 12px handle: its
  upward lobe passed behind the header's translucent bar and the
  backdrop-filter smeared it into a full-width glowing seam, and its
  downward lobe washed 16px into whatever card was passing beneath — both
  surfaces, owner-reported, and the harness reproduced both. The pulse is
  now a faint under-edge — `0 2px 8px -3px var(--signaledge)` — picked by
  the owner from rendered candidates: below the strip, tight, spread pulled
  in so nothing reaches sideways. Same keyframe, same 4.5s breath, same
  token, same reduced-motion cut.

### QA

- **The gutter guard requires `both-edges` and says why; section 130 pins
  the shadow's SHAPE, not just its token** — an all-round halo is exactly
  what a designer reaching for "make it glow" writes first. **negtest476**
  proves all of it bites: gutter reverted, gutter deleted, halo restored,
  token swapped. **negtest380's** quoted keyframe retargeted.

## [4.0.5] — 2026-08-17

### Fixed

- **The installed app's grey stripe under the tab bar is painted over — by
  the only hand that can reach it.** The owner's screenshot showed a dead
  band between the tab bar and the screen's bottom edge on iOS 26, in the
  installed app only, surviving a relaunch. Two on-device tests settled
  what three releases of layout work could not: the band is **outside the
  webview** — a touch there moves nothing — so it is iOS's, not the
  page's, and no height, anchor or padding will ever reclaim it. But
  switching to the darker theme turned the band black, which proves iOS
  paints it from `<meta name="theme-color">` — frosted, so the dark
  theme's navy `#0C111C` came out as a visibly lighter grey stripe, while
  black came through unchanged. So `applyTheme()` now answers the meta
  with `#000000` whenever the app runs installed, both themes: the band
  reads as bezel and the browser keeps the theme's own tint, because in a
  browser the meta paints real toolbar chrome and the band does not
  exist. The band's height is still lost to iOS — the tab bar sits a
  phantom toolbar above the true bottom until Apple resolves the granted
  viewport against chrome that is not there (the same misreporting 4.0.x
  fought from the other side). This release makes the loss invisible;
  it cannot make it untrue.

- **The 4.0.4 release zip was uploaded into `docs/` as well as the root,
  and the census caught it.** `docs/CHANGELOG.md`, `docs/README.md`, a
  full second copy of the app at `docs/docs/`, and five QA files under
  `docs/qa/` — 26,054 lines of accidental duplicates, all publicly
  routable in principle (the Cloudflare layer answered 403, so nothing
  actually leaked). Deleted. Guard 13's census is why a stray upload
  cannot survive a release: every file `docs/` serves is either in the
  shell or named as a decision.

### QA

- **Guard 28 pins the standalone branch.** `applyTheme()`'s installed-app
  arm is exactly the kind of special case a tidy refactor collapses back
  into the table lookup, so the guard fails the build the moment
  `isStandalone() ? "#000000"` stops appearing. **negtest475** proves the
  pin bites from both directions — branch deleted, branch answering navy —
  and a green_case proves a reworded browser-arm fallback does not trip it.

## [4.0.4] — 2026-08-17

### Added

- **`/.well-known/brave-rewards-verification.txt`.** The Brave Creators
  verification token, at the exact name and bytes Brave's publisher
  service expects. Served as a static asset — the Worker's
  `run_worker_first` paths are untouched — out of the offline shell with
  the IndexNow key's reasoning (fetched by a machine that never runs the
  app), and named in guard 13's exclusions so the omission stays a
  decision instead of an oversight.

### Fixed

- **The peek is part of the header, full stop — and the flicker at the
  gesture's edges goes with the swap.** 4.0.3 built `#beltpeek` but showed
  it only mid-gesture, swapped in by a scroll-driven flag — and the swap
  itself was the last movement left: the 2px threshold and the rAF hop
  showed the strips riding for the first frame or two of a gesture, and
  the seam played again at the settle. A scroll listener cannot beat the
  compositor to the first frame any more than 4.0.2's counter-translation
  could chase it, so 4.0.4 stops swapping on gestures at all. Parked is
  STATE: `parkFocus()` reads the two parked truths (`data-beltpark`,
  `data-park`), excludes held and dropped, and toggles the peek's
  `data-on` — the peek is permanent header chrome whenever the belt is
  parked, and the parked strips hide whole inside the deck
  (`visibility:hidden`: out of paint, hit-testing and the accessibility
  tree in one line, F5 entire). Unparked strips are content and ride
  their panels, which is what content should do. Nothing swaps
  mid-gesture, so nothing is left to flicker. The tap and the keyboard
  door move onto the peek itself — a real `role=button` in the header,
  outside `render()`'s innerHTML churn — and the strips' own 12px band
  (`::before` rail, `::after` chunk, the entrance transition) is deleted
  rather than orphaned; the glow rides `#beltpeek[data-on]`. Two seams
  kept honest: `closeBelt()` stages the retraction with `data-ride`, so
  ending a drop still rides the strip home over the `top` transition
  instead of blinking out (removing `data-drop` alone would leave it
  `[data-park]` and hidden in the same frame); and `beltWatch()` calls
  `parkFocus()` before its IntersectionObserver gate, because a browser
  without the observer still parks by state — with the peek as the only
  handle, gating the toggle would have left those browsers a belt with
  no door. `data-swiping`, the 2px test and the whole mid-gesture
  machinery are removed, and a guard fails the build if the flag ever
  comes back.

- **`sw.js`'s shell comment stopped lying about the touch icon.** It still
  said `icon-192.png` is referenced "for rel=icon and apple-touch-icon";
  the head has linked a dedicated 180×180 `apple-touch-icon.png` since the
  favicon surface shipped in 3.9.x. Comment only — the shell list itself
  was already right, and the touch icon stays out of it on purpose: iOS
  copies it at install time and never asks the worker for it.

### QA

- Section 128's Q2/F5 blocks rewritten for the header-resident peek: the
  base rule pinned `display:none` + `pointer-events:none` (off is off),
  the `data-on` rule pinned as a working handle (block, pointer, hand),
  the parked strips pinned hidden whole, `parkFocus()` pinned on both
  truths and both exclusions plus the pre-gate call, and the peek's click
  and keydown doors pinned where the view handler's branch used to be.
  Section 130's strip-is-the-peek trio now asserts the inverse — the
  strip hides, the ride is staged — and the lit-chunk thirds moved from
  the strips' dead band to `#beltpeek`. Section 143 asserts `data-swiping`
  stays deleted.
- **negtest360** trades the band-entrance fixtures for unmoored-base,
  taps-eaten and mouse-only-peek ones; **negtest380** gains the
  blink-retraction and half-truth fixtures; **negtest470** trades the
  swap fixtures for the returning-flag and gated-parkFocus ones. The
  smoke sweep stages `data-on` where it staged the gesture flag, and the
  browser check opens the drop from the header peek.

## [4.0.3] — 2026-08-17

### Fixed

- **The belt closes to a peek that is part of the header — really locked
  this time.** 4.0.2 counter-translated the strips from the scroll read,
  and it was wrong the honest way: the deck's scroll is composited and the
  correction is main-thread, so the belt trailed the finger by a frame or
  two and still read as movement — worst on a fast fling, invisible to any
  probe that samples a held position. A composited scroll cannot be chased
  from JavaScript, so 4.0.3 stops chasing: the moment a gesture crosses the
  2px threshold, the panels' strips hide and a real header element
  (`#beltpeek` — pixel-matched to the parked peek: same width and
  centring as the strip, same card ground, borders, bottom radius, and lit
  segment) shows in their place. It lives outside the deck, so it cannot
  move; at the settle the swap reverses and the strip returns in whatever
  state it held. The gesture is flagged on `<html>` (`data-swiping`, the
  `data-beltpark` precedent), `renderHead()` keeps the peek's lit segment
  in step with `S.mode`, and the dropped belt stays visible and rides —
  its pouches are anchor-positioned, and the drop retracts at the door
  anyway. The 4.0.2 machinery (`--swx`/`--pi`/`--vw` and the transform
  rule) is removed; the rotation squelch and the no-observer degrade stay.

### QA

- Section 143's anchor pins rewritten for the swap — the peek element and
  its show rule, the strips' hide rule, `swipeRead()`'s flag-and-clear on
  the document, and `renderHead()`'s lit sync — with the three `negtest470`
  fixtures rewritten to break each leg. The smoke sweep stages
  `html[data-swiping]` the way it stages `data-beltpark`, and walks release
  mode so all three lit segments match. Fixture count unchanged.
- **The reset's handle drop reuses `fhKeep(null)`** instead of 4.0.1's
  separate `fhDrop()` — same store, same key, one code path, ~300 bytes
  back. Found the honest way: the page had drifted to 4 bytes under the
  README size claim's rounding line, and the bless green-fixtures (which
  add a few bytes before healing) started flipping it to red.

## [4.0.2] — 2026-08-17

### Fixed

- **The belt is anchored to the header, not to its panel.** Every panel
  carries the same parked strip directly under the header, so a swipe
  showed the belt sliding out with the page — two identical copies crossing
  the seam — while the header held still above it. Mid-gesture, every
  non-dropped strip is now counter-translated by the deck's own arithmetic:
  `--swx` written from the one `scrollLeft` read the deck already makes
  (section 120's pin is unchanged), `--pi` stamped on each panel at build,
  `--vw` delivered by the same observer that delivers `nwVW`. The outgoing
  and incoming copies hold the identical viewport position, so the gesture
  reads as one belt fixed under the header with the content sliding beneath
  it — and the panels' own clip edges do the reveal. The writes clear at
  the settle, so no transform (and none of the horizontal overflow a
  transform can mint inside a panel) survives the gesture. The dropped belt
  is excluded on purpose: its pouches are anchor-positioned, and anchors do
  not track transforms, so a translated dropped strip would leave its
  pouches behind — the drop already retracts at the door.

### QA

- Section 143 pins all three legs — the CSS rule, `swipeRead()`'s
  write-and-clear, and the build-time terms — and `negtest470` proves each
  can go red (three new fixtures).

## [4.0.1] — 2026-08-17

**The 16 August review of 4.0.0, applied. No entries added, removed or
renamed — still 200 entries, 133 films and 67 seasons across 44
continuities, every `i:` untouched.**

### Fixed

- **A pasted backup code survives a swipe.** `render()` has preserved
  `#restorebox` since the storage-event wipe (section 112) — but 4.0.0's idle
  refill rebuilds a background panel through `fillPanel()`, which did not
  carry the box: paste a code on Progress, swipe away, and the paste was
  wiped milliseconds later by a path the guard could not see, because it
  only read `render()`. `fillPanel()` now carries the value across, and
  section 112 pins both fill paths.

- **The frame has a height everywhere.** `#app` was sized by
  `100svh`/`100dvh` alone. Engines that predate the new viewport units parse
  neither declaration, and 3.9.7's document lock (`html,body
  overflow:hidden`) turned that from a graceful degrade into one unreachable
  viewport with the tab bar below the fold. A plain `height:100%` now
  precedes the pair — `html` and `body` already carry `100%`, and the modern
  declarations still win wherever they parse. The svh/dvh pair could never
  back each other up: every engine shipped both units in the same release.

- **Rotation cannot commit a wrong tab.** `swipeRead()` pairs a fresh
  `scrollLeft` with a width only the ResizeObserver delivers, and nothing
  enforced the pairing: a mid-rotation read could misround by a whole panel
  and the observer's own re-snap would then cement it. The observer now
  squelches swipe reads for two frames around its re-snap — the same shape
  as `dropSquelch` — and reads once more when the squelch lifts, so a settle
  is never missed.

- **No observer, no gesture.** Without ResizeObserver the deck was built
  swipeable but could never commit (`nwVW` stays 0) — a drag stranded the
  reader on an inert panel while the tab bar named the old tab. The viewport
  now refuses horizontal scrolling when the observer is absent
  (`main.sw.nosw`): the footer tabs still snap programmatically, and the
  gesture simply does not exist on engines that cannot support it honestly.

- **"Clear all progress" lets go of the backup file.** The reset cleared
  every mark but kept the file handle, so Progress still offered "Update
  backup file" and one tap would overwrite the only external copy with the
  post-wipe state. The reset now drops the handle — `S.fh` and the
  IndexedDB store both — and the button honestly offers "Save to a file"
  again.

- **`HEAD /` negotiates like `GET /`.** A HEAD probe preferring markdown
  fell through to the assets plane and read as HTML — the same HEAD/GET
  mismatch api-catalog fixed in 3.9.2, on the one URL that negotiates. Same
  headers, no body, asserted in section 133.

- **The Penguin's description is a sentence again.** The 4.0.0 spoiler cut
  removed its opening clause and shipped "and the underworld has a
  vacancy…" starting mid-sentence in the hero, the rows and the peeks. And
  the file speaks one dialect again: "cruellest" and "labelled" join the
  rest of the British spelling — the seed FAQ, the schema and llms.txt now
  agree on the word.

### QA

- **Bless prints what it re-hashed.** Guard 10's comment promised a summary
  as the compensating control for its vendor-mark filter, and the summary
  did not exist — a signature-free foreign blob still blessed to green with
  one quiet line. Every CSP re-hash now records the script's byte size in
  `qa/script-bytes.json` and prints the delta since the last bless:
  laundered code has to arrive as a visible size jump in the one line a
  launderer cannot avoid.
- **The comment allowlist matches whole bodies.** 3.9.2 cut the dead names
  but kept `indexOf`, so a comment *beginning* with a live name could still
  smuggle prose in behind it (reproduced 16 August). The allowlist now
  carries each comment's full text, whitespace-collapsed, and matches
  exactly.
- **Section 143 counts on collapsed whitespace.** The dirty-mark and
  snap-door counts required exact formatting — blind to a reformatted new
  site, red on a benign reindent.
- **Sections 141–143 fail readably.** Their extractions went through
  `fn()`, which throws — deleting a function under test ended the run in a
  stack trace instead of a `fail()`. They route through `optionalFn()` now,
  as `buildDeck` already did.
- `make-share-card.mjs` no longer instructs the separate Playwright install
  its own header says is unnecessary.

Adding catalogue entries is a MINOR bump. Fixes and copy changes are PATCH.
MAJOR marks a change to the app's shape — 2.0.0 is the Belt. A breaking change
to saved progress would also be MAJOR, and should never happen, because every
`i:` slug is frozen (see the README).

> **Note on versioning**
> v1.0.0 → v2.x.x were public beta / early-access builds running directly on
> production. **v3.0.0 is the first version considered stable.** Every version
> in this file shipped to the live origin the day it was written — there is no
> staging environment and never has been — so the 3.0.0 line is not a change of
> process, only of the stability contract it is honest to offer.
>
> Anything experimental after 3.0.0 takes a pre-release tag — `3.1.0-rc.1` —
> rather than a plain version.

## [4.0.0] — 2026-08-16

**The tabs swipe. Release two of two: 3.9.7 moved scrolling onto `#app` so
this release could change only what swipes — `#view` is now a horizontal
scroll-snap viewport holding four persistent panels, one per tab, and each
panel is its own vertical scroller. One gesture arrives, and one bar detail
rides along: the scrollbar now hides below the header, the same way it has
always hidden below the footer, because the scrollport's top edge moved to
the header's bottom.**

### Added

- **Swipe between tabs.** Home, Next up, The path and Progress sit side by
  side in a snap viewport — `scroll-snap-type:x mandatory` with
  `scroll-snap-stop:always`, so a hard fling crosses one tab, never three.
  Each panel keeps its own scroll position across swipes; the footer tabs
  stay plain buttons with `aria-current` and still reset the view they open,
  and swiping into The path adopts the chosen path exactly as tapping it
  does. Non-active panels are `inert` once a swipe settles, so nothing
  off-screen answers the keyboard or the screen reader. The active panel
  renders synchronously on every state change; its neighbors re-render in
  idle time behind dirty flags; the far panel waits until a swipe makes it a
  neighbor. The settle is computed from the snap arithmetic — no `scrollend`
  (Safari shipped it late) and no CSS `scroll-behavior:smooth` (it fights
  snap; deliberate smooth scrolls already route through `calmScroll()`).

### Changed

- **Scroll lives in the panels now, and the scrollbar starts below the
  header.** `#app` is pure frame — header, viewport, tab bar, clipped. Every
  sticky offset became panel-relative in the same move: `--ghtop` is just the
  peek, the Belt parks at `calc(--ghtop - --beltH)`, and a dropped strip pins
  at the panel's top edge, which IS the header's bottom. `--hdrh` remains for
  the two consumers that really do measure from the viewport: the dropped
  pouches' no-anchor fallback and flagSave()'s banner override. Before
  JavaScript runs, `main` itself scrolls, so the crawlable seed reads the
  same as ever — with the same below-the-header scrollbar.

- **The seam widened without growing.** `scroller()` answers the active
  panel; `scrollKeep()`/`scrollPut()` take an optional element so background
  fills preserve their panel's place — still one `scrollTop` read and one
  write in the whole file (section 120), joined by exactly one `scrollLeft`
  read: `swipeRead()`, rAF-throttled, dividing by a width the
  `ResizeObserver` delivered rather than one anybody read. The Belt's
  auto-close observer roots on the active panel and compares against its
  `rootBounds.top`; the drop's one-shot retraction gained a disarm so a tab
  change cannot strand it armed on a panel that stopped scrolling. Two
  scroll listeners are now pinned where one was: the one-shot retraction,
  and `swipeTick` on `#view`.

### Fixed

- **A skip finishes a Home card, and The path's bars agree.** Skipping is a
  decision about an entry — an Optional you'll never want, a Not out yet —
  so a universe, era or decade whose every entry is watched OR skipped has
  nothing left to offer and now reads complete: signal edge, check on the
  name. Both bars fill honestly rather than pretending — watched in
  signal, skipped in steel beside it — and both counts name the skips
  ("12 of 14 · 2 skipped") instead of a full card claiming a number it
  never reaches: the Home grid cards, and The path's own group heads,
  which build from the same two helpers (`gSub`/`gBarFill`, guard 103) on
  the full render and the surgical tick path alike, so the count under
  your thumb and the count after a redraw cannot disagree. An entry
  neither watched nor skipped still holds a card open, and un-skipping
  reopens it, because completion is computed, never stored.

- **A footer tap with the belt dropped no longer strands the pouches.**
  `closeBelt("auto")` renders the new panel only, so the departed panel
  kept its dropped strip and its `position:fixed` pouches — fixed paints
  over every tab, and a far panel never receives the idle refill that
  would have cleaned them ("belt opened hit a tab, it breaks drops").
  Both tab doors — the footer button and the swipe — now scrub the
  departed panel's drop DOM in the same breath (`scrubBelt`), and the
  drop arms again cleanly afterward. Guarded on both doors, driven in
  Chromium through the exact reported sequence.

- **Progress speaks the same skip language as the rest.** The skyline's
  columns and the fold rows now carry the steel skip share exactly like
  the Home cards and The path's bars — watched fills in signal, skipped
  stacks above it in steel — and a group of watched + skipped counts
  complete in the fold tallies. The columns grew 25% taller (88 → 110px)
  while they were open. And steel now means skipped, nowhere else: era 0
  ("outside any timeline") used to draw its column and its fold row in
  steel, which made a cataloguing decision look like a leftover skip —
  it wears the same signal as every other era now, matching the colour
  language the scoreboard's numbers already speak.

- **The installed app's tab bar no longer floats above the home indicator.**
  The owner's standalone screenshot showed the footer sitting a toolbar's
  height too high: iOS standalone can resolve a `position:fixed` bottom
  anchor (and `svh`/`dvh`) against browser-chrome metrics for chrome that
  does not exist there. The bar is now the frame's third flex member — it
  ends where `#app` ends, no anchor to misplace — and a
  `(display-mode: standalone)` override pins `#app` to `100%`: the second
  screenshot showed iOS granting the installed WebView a viewport shorter
  than the screen while `100vh` claimed the screen anyway, cutting the
  bar's labels below the fold — the containing block is the one measure
  that cannot overshoot what iOS actually laid out. Content no
  longer passes under the bar, so the panels' runway padding is a plain
  28px, and the vertical scrollbar now terminates at the bar's top edge —
  the same symmetry the header got.
- **The home-screen icon fills its tile.** `apple-touch-icon.png` carried
  the bat at ~56% × 42% of the tile, because the generator pasted
  `icon.png`'s whole canvas at 78% and the canvas is an opaque rounded tile
  with its own margins — `getbbox()` answers the tile, not the bat. The
  generator now finds the signal-yellow ink by colour, crops to it, and
  scales that to 80% of the tile's width on the tile's own sampled ground.
  (The greyscale look in the dock is iOS's tinted-icons mode, not the
  icon — left alone on purpose.) Re-add the app to the home screen to pick
  it up; iOS copies the icon at install time.

### QA

- **Guards: 142 → 143 sections.** New section 143 holds the deck's contract
  — four panels in footer order, dirty-flag rendering from both render()
  and tickUpdate()'s surgical path, the inert sweep and its mid-swipe
  exception, belt suppression in background copies (the negtest250
  two-copies defect, now with an anchor to lose), snap via
  `scrollIntoView`, resize re-snap. The unnumbered scroll-owner block was
  rewritten for the new ownership; section 128's offset pins moved to the
  panel-relative bases; section 120 pins `scrollLeft` at one appearance.

## [3.9.7] — 2026-08-16

**Scroll moves off the document and onto `#app`. Nothing looks different, and
nothing is supposed to: this is release one of two for the tab swipe — the
half that changes where scrolling lives, shipped alone so the half that adds
the gesture changes only what swipes. If something regresses, it is known
which half did it.**

### Changed

- **The document is locked and `#app` is the app's one vertical scroller.**
  `html,body` clip; `#app` is height-locked to the viewport — `100svh` with a
  `100dvh` override where dvh is known — with `overflow-y:auto`. Everything
  that made document scrolling work moves with the scroll, and nothing else
  moves: the header is the same sticky bar, its scroll container now #app
  instead of the document; the group heads and the Belt keep their sticky
  offsets to the pixel; the fixed drop and the toast were viewport-positioned
  and still are; and #app's clip edge sits exactly where the viewport edge
  sat, so both IntersectionObservers — the parked flag and the pouch
  auto-close, `bottom <= 0` included — keep their thresholds without a number
  changing. That coordinate identity is why this shape was chosen over a
  flex-clipped scroller between the bars, which would have moved every sticky
  offset and both observer thresholds in the same release as the ownership
  change.

- **Every scroll site goes through a three-name seam.** `scroller()` names
  the element, `scrollKeep()` is the one read, `scrollPut()` the one write;
  render()'s keep and restore, every go-to-top, the Belt's one-shot
  retraction listener and the search box's drift anchor all route through
  them. Section 120's census follows: `pageYOffset` appears nowhere and joins
  REFUSED, the `scrollTop` pin widens to 2 — one read, one write, and the
  seam is the only place the name may appear — and the ORDER clause tracks
  `scrollKeep()`, still the first line of render(), because an element read
  forces layout exactly the way the window read did. The `.settling` restore
  is untouched: #app is exactly as short under `content-visibility` as the
  document used to be, so section 122 keeps its whole argument and retargets
  one call name.

- **`#app`'s `+ 1px` retires with the reason for it.** The extra pixel kept
  Next up — the one view that can be shorter than the screen — scrolling like
  the other three, so the mobile chrome did not resize between tabs. With the
  document locked the chrome never collapses on any tab: the same uniformity,
  reached from the other side. **That is also the accepted cost of this
  release:** iOS Safari's toolbar no longer shrinks away as you read, because
  the document it shrinks for never moves. Decided in the swipe plan, not
  discovered after — and the block that guarded the pixel now guards the
  lock.

- **`overscroll-behavior:none` lands on the scroller it protects.** On the
  body it guarded the document; #app carries it now, so hitting the top of a
  long list does not chain into pull-to-refresh and reload the app under the
  reader's finger. The body keeps its copy — it costs nothing and covers the
  document if anything ever overflows it again.

### Added

- **The scroll-owner guard.** The rewritten block asserts the lock: document
  clipped, #app height-locked and scrolling, overscroll contained — and
  `window.scrollTo`, `window.scrollBy` and window scroll listeners are
  refused outright. Each would address the element that no longer moves and
  fail in silence — no wrong pixel, no thrown error — which is the exact bug
  this migration invites for as long as muscle memory lasts, and exactly the
  class of defect (three green instruments, one regression) that sections 120
  and 122 exist for.

- **`negtest460.sh` — 8 fixtures.** Unlock the document, stop #app
  scrolling, reopen the overscroll chain, bring back a window scroll call or
  listener, strip `.settling` from the restore, remove the restore entirely
  — each breaks one thing in a throwaway tree and asserts the right guard
  goes red for the right reason. The fixtures in negtest164, 320, 330, 370
  and 380 that gripped the old code — `pageYOffset`, the `+ 1px`,
  `window.scrollTo` — are retargeted at the seam, proving the same shapes
  against the new names; negtest164 keeps the two height-lock fixtures
  because that suite has always owned that block's shape.

## [3.9.6] — 2026-08-15

**The two features that were waiting on a round willing to touch app logic. The
plain-text export carries all three orderings, and a backup can be written to a
real file on disk instead of only downloaded. The backlog is empty going into
4.0.0.**

### Added

- **`orders.txt` ships all three orderings.** It carried one — by universe —
  from 2.6.0 to 3.9.5, and **the reason was never that the other two were
  unwanted.** By universe needs no sort: each continuity's array *is* its
  spoiler-safe order. Bruce's life and Release order are computed, and they were
  computed by two **anonymous** comparators inside `buildGroups()` — while
  `fn()` can only extract **named** functions out of `index.html`. Writing those
  sorts out in `qa/guards.js` would have been a second implementation of the
  app's ordering, the one thing that file exists to prevent: a copy drifts,
  stops testing the app, and from the export it would have started *publishing*
  the drift.

  **3.9.6 named them instead.** `lifeCmp` and `releaseCmp` are functions with
  byte-identical bodies to the anonymous ones, `buildGroups()` sorts through
  them, and section 105 extracts both. One source, both sides. The file goes
  from 18 KB to 51 KB and every entry appears once in each ordering.

  **The bucket is part of the ordering, and getting that wrong was the real
  risk.** Neither comparator is a total order: `lifeCmp` runs inside an era,
  `releaseCmp` inside a decade, and the bucket list does the coarse ordering.
  Sorting the flat catalogue with either produces a plausible-looking wrong
  answer — so the two new loops mirror `buildGroups()`, and a count check fails
  the build if any ordering carries fewer than all 200 entries. A bucket that
  matches nothing would drop entries silently, and a reader of a text file has
  no way to see that ordering 2 came up short of ordering 1.
- **A backup can be saved to a file on disk — durability review item 4.** Behind
  `showSaveFilePicker`, with the handle kept in IndexedDB so "Update backup
  file" rewrites the same file the person chose, with no second dialog. Every
  browser without the API falls through to the existing download, untouched.

  **A handle is not the IDB mirror the review rejected.** That rejection was
  right and still is: "a second copy in the same bucket is bookkeeping, not
  durability" — `clear-site-data`, Safari's ITP wipe and Chromium eviction take
  localStorage and IndexedDB together. A handle is a *pointer to a file outside
  the origin bucket*, which is the one place none of those reach. That is the
  whole durability argument, and it is why item 4 was parked on the clocks
  rather than dropped.
- **New guard 141 — the two orderings are named once, and shared.** Re-inlining
  a comparator would leave every test green while `orders.txt` went on
  generating from a function the app no longer calls: the export and the screen
  agreeing on paper and disagreeing in fact. 141 refuses `.sort(function`
  in `buildGroups()`, pins what each comparator keys on, and checks all three
  banners reached the file.
- **New guard 142 — a backup is stamped only when a copy left.** `lastExportAt`
  is the claim that progress left this browser; the nudge counts marks against
  it, so a stamp with no file behind it tells somebody they are backed up when
  they are not. The download path was always careful — `download()` returns a
  boolean and the stamp sits inside `if(dlOk)` — but **nothing asserted it**: no
  guard, no smoke check, no browser check touched any of it before now.

  The new path makes the mistake much easier to make. `showSaveFilePicker`
  **rejects when the person hits cancel**, so a dismissed dialog and a completed
  save look identical to code that skipped the check. Every helper resolves a
  boolean and stamps nothing; the stamp stays at the call site, downstream. 142
  holds that line and asserts the permission query a restored handle needs.
- **`negtest450.sh` — 12 fixtures.** Both defect classes are ones where nothing
  looks wrong: no bad pixel, no thrown error. Hence fixtures rather than trust.

### Changed

- **NOTES.md's "The plain-text export carries one ordering" is now the record of
  that decision reversing, not being deleted.** The argument is kept in full,
  because it is still why the fix has the shape it has — a copy of the sorts in
  `qa/guards.js` would be just as wrong today. Section 105's own comment got the
  same treatment.
- **`llms.txt` and `README.md` no longer say "by universe".** Both described the
  export as one ordering. Section 105 pins the llms.txt *pointer* but not that
  sentence, so it was unguarded prose — the class of thing 3.9.5 spent a release
  finding.

## [3.9.5] — 2026-08-15

**A disclosure channel that lives in the repository and expires on a clock the
build watches, plus three pieces of prose that had stopped being true. PATCH —
no data change, no slug change, no progress-format change.**

### Added

- **`/.well-known/security.txt` — RFC 9116, in the tree.** Cloudflare's Security
  Center reports it "not configured" for this domain and offers a dashboard form
  as the remedy. **The finding's own detection method is why it is answered as a
  file instead**: *"We evaluated the Security Settings configured for this domain"*
  — it reads the panel, not the origin. So the managed toggle can clear the
  finding while nothing is served, and this file can serve correctly while the
  finding stays red. Neither outcome is a statement about this site. The dot is
  not the target; a reachable channel is, and the same argument that keeps the
  response headers in `_headers` keeps this here: a file can be diffed, guarded
  and shipped inside a release, and a panel can be none of those.

  **The Contact is a URL, not an address.** RFC 9116 permits `https:`, and
  GitHub's private vulnerability reporting is the channel `SECURITY.md` already
  names. A `mailto:` would open a second channel able to drift from the first
  and add a permanent scrape target to a page whose whole job is to be crawled.
  Guard 140 refuses one by name rather than trusting the next editor to remember
  why it is absent.
- **New guard 140 — the disclosure channel is a file, and it has not expired.**
  This one guards a failure mode almost nothing else here has: **the file is
  correct when it ships and becomes incorrect on a date written inside itself.**
  RFC 9116 makes `Expires` mandatory and wants it inside a year, so a correct
  `security.txt` rots by nobody doing anything — and an expired disclosure file
  reads as an abandoned project, which is worse than never having published one.
  A courtesy nobody is reminded to renew is a promise with a timer on it.

  So the timer runs against the build. **Section 140 goes red thirty days before
  the date**, while there is still a month to ship the renewal, rather than on
  the morning the file starts lying. It also pins the URL contact, the absence of
  a `mailto:`, the `Canonical` against the apex, the `Policy` against
  `SECURITY.md`, that `SECURITY.md` still names the channel `security.txt`
  advertises, and the `no-cache` block below.
- **`negtest440.sh` — 14 fixtures.** The three clock cases compute their dates
  relative to the run rather than hardcoding one: a fixture pinned to 2026 would
  start passing for the wrong reason in 2027, asserting that the guard fires on
  an expired file when what it was written to prove is that it fires *early*.
- **`_headers` declares `no-cache` for `/.well-known/security.txt`.** It joins
  `auth.md`, `llms.txt` and `orders.txt` for a sharper version of their reason:
  the file carries an `Expires` date, so a stale copy does not merely answer
  late, it answers with a freshness claim that has stopped being true. Nothing
  declares a `Content-Type` — the assets plane already emits
  `text/plain; charset=utf-8`, and `_headers` cannot unset a header it
  duplicates.

### Fixed

- **NOTES.md asserted two bugs as current that had been fixed for releases.**
  *Cross-tab merging only ever adds* still said there was "no timestamp on a mark
  to reconcile with" and that the fix, if it were ever wanted, would be a
  per-mark timestamp — **3.8.0 shipped exactly that** (`clk`, LWW-where-clocked,
  guard 134). The same entry still called **"Clear all progress" silently false
  with a second tab open**, which `resetAt` closed in **3.7.2** — and the account
  of that fix is at the top of the same file. One document described the fix in
  one passage and the bug as current in another, and the two never met.

  Nothing in the build can catch this. The count guard excludes NOTES.md and
  CHANGELOG.md on purpose, because both are records and a history that updates
  itself is not a history — which is right, and is exactly why a *claim* in here
  going stale has no control but somebody reading it. That is the control that
  failed, and the entry now says so in place.
- **Guard 138 was harvesting `green_case`'s mutation as if it were an expect.**
  The two helpers do not share a signature — `run_case` is
  *(label, expect, mutation)* and `green_case` is *(label, mutation)*, because a
  green case asserts an exit code rather than a string. The parser took "the
  second quoted argument" from both, so five fixtures were feeding **python
  source into the coverage map** as expected failure text.

  Nothing broke, and that is the point: the map is a substring test and python
  source almost never appears inside a `fail()` string, so those five
  contributed nothing while looking like they contributed. The failure it could
  have produced is the exact one section 138 exists to prevent — a section
  credited as covered by a fixture that cannot cover it, since a `green_case`
  asserts the guards stay *quiet* and therefore proves no section can fail. The
  map now reads 732 fixtures where it read 737, and coverage is unchanged at
  140/140: no section was relying on one.
- **Section 140 could take the whole run down with it.** It read `_headers`
  without an existence check, so on a tree where the file is missing it threw
  before section 104 could report the file missing — `negtest251` caught it on
  the first full run. A guard that crashes the suite is worse than one that
  fails it, because the message the reader needs belongs to a different section.
- **NOTES.md quoted the weight ceiling as 200 KB.** It has been 220 since 3.8.3;
  `README.md` and the guard both say so. Only the gzip half was still right. Now
  reads 220 since 3.8.3, 200 before it, 80 KB gzipped throughout.
- **`run-all.sh`'s naming convention got both of its own examples wrong.** It
  claimed suites are named for their release with the dots removed — "negtest390
  is 3.9.0, negtest410 is 3.9.2's" — when `negtest390` says in its own header it
  is 3.7.2's, and 3.9.2 with the dots removed is 392, not 410. A rule stated in
  one sentence and contradicted by the example in the next. **The encoding held
  through `negtest300` (3.0.0) and broke at `negtest340` (3.4.2); from 340 on it
  is a plain +10 counter with no relationship to the version.** The comment
  arrived in 3.9.2 as part of a stale-prose cleanup and shipped stale, which is
  the failure mode that cleanup existed to fix.

### Changed

- **`security.txt` is named in the offline shell's exclusions, not added to it.**
  Read by scanners and by a researcher who has already found something, neither
  of which runs the service worker — and it is the one file here that goes stale
  on a date rather than on an edit, so a cached copy could outlive its own
  `Expires` with nothing to say so. The exclusion is a decision, written down,
  the same as `llms.txt` and `orders.txt`.

## [3.9.4] — 2026-08-14

**The backlog, emptied. Every guard section now has a negative fixture that
proves it can fail, the coverage map that measures it stopped being easy to
satisfy, and the three files written for agents stopped being served stale.
PATCH — no data change, no slug change, no progress-format change.**

### Added

- **`negtest430.sh` — 32 fixtures, one for every section that had none.** Guard
  138 landed in 3.9.2 with 26 sections on `STILL_OWED`, after a mapping showed
  that "every guard has been negative-tested" — a sentence standing in four
  files since 1.6.x — was false. Most of the 26 were the oldest guards in the
  file, written before the rule that a guard ships with the fixture proving it
  can fail. **`STILL_OWED` is now empty**, and the array stays because the
  ratchet is the array: a section arriving without a fixture fails the build.
- **New guard 139 — the files an agent reads answer fresh.** 3.9.2 shipped a
  one-line change to `auth.md`'s H1 so a checker could identify the file by
  name. The deploy landed, and the first read of `/auth.md` came back with the
  *previous* release's heading; a cache-busted read came back correct. Nothing
  was wrong with the deploy. `auth.md`, `llms.txt` and `orders.txt` had no block
  in `_headers` at all, so they inherited the assets plane's default while `/`
  and `/sw.js` declared `no-cache` for themselves.

  A browser rereads a page. An agent asks once, writes the answer down, and does
  not come back to see whether it changed — which makes a stale representation
  of these three worse than a stale representation of the app, not better. All
  three now declare `no-cache`, and guard 139 holds it.
- **`404.html` carries its own CSP.** `index.html`'s `<meta>` policy covers the
  document it sits in and no other, so the 404 page — served on every wrong URL
  anyone ever guesses at this origin — shipped with none. `default-src 'none'`
  with `style-src 'unsafe-inline'` for its one inline block. Guard 139 asserts
  it, since it is the same class of thing: a policy that lives in the tree
  rather than a panel.

### Changed

- **Guard 138's map stopped being easy to satisfy.** It matched an expect
  against a section's whole source, so a section was credited for words in its
  *comment* — the eight-character expect `_headers` was covering three sections
  that merely mention the file and had no fixture between them. It now matches
  against `fail()` text only, and the minimum expect is 12 characters.

  That change uncovered **three real gaps that had been reading as covered**
  since the map was written: 34 (Activity reachable from Next up), 75 (a control
  is as big as a finger) and 117 (llms.txt says what the README says). All three
  have fixtures now. A coverage guard that is easy to satisfy is worse than no
  coverage guard, because it gets quoted.
- **Four fixtures were re-pointed at strings their guards actually own.** Their
  expects named a variable's contents or a computed fragment, so they passed
  while mapping to nothing — the same defect as the sections above, from the
  other end.
- **Guard 15 says why it failed.** Its message was pure arithmetic ("claims 132
  films, data has 133") where every other message in the file explains the
  consequence. The head is the copy a search engine quotes, and it is the one
  surface nobody reading the page can see is wrong.
- **The coverage sentence is back in all four files, as an assertion.** README,
  NOTES, `index.html`'s header block and this file's opening comment say every
  guard section is negative-tested — and now point at guard 138, which checks it
  on every run rather than asking to be believed.

## [3.9.3] — 2026-08-14

**One reorder, on both shelves. *Death in the Family* now follows *Under the Red
Hood* instead of preceding it, and the spoiler rules are enforced in the life
ordering as well as by universe. PATCH — same entries, same slugs, same progress
format.**

### Fixed

- ***Death in the Family* was rendering before *Under the Red Hood*.** It opens
  at the crowbar, which is chronologically before the film it is built on, and
  it sat first for that reason — the whole life ordering is chronological where
  it can be. But it does not end there. Of its three branches, one plays out
  *Under the Red Hood*'s plot in full: the Lazarus Pit, the resurrection, the
  Red Hood, the Joker. Ordering by the first scene works for a story that
  finishes before the next one starts, and this one occupies a superset of the
  same slot rather than an earlier one. So a viewer on the life ordering or the
  core route met the second film's third-act reveal inside the first film.

  The rule was already written down and already applied everywhere else: The
  Comic Adaptations is a declared `WEAVES` group whose reason string reads *"a
  derivative work has to follow its source whatever era it sits in"*. Same shape
  as guard 30's *"Phantasm and SubZero drop into the series, not ahead of it"*.
  The two entries swap `lo` positions inside era 4 and swap places in the array;
  a new guard 30 rule pins the order. Both IDs are frozen, so no saved mark or
  backup code moves. Found while building 3.9.2, deliberately left for its own
  release rather than folded into a patch that was already reordering the DCAU.

### Changed

- **Guard 30 now checks both shelves.** Every rule in it read array position,
  which is the by-universe order. The life ordering runs on `lo`, and nothing
  tied the two together — so a rule could be honoured by universe and broken by
  life through an edit that touched only `lo`, with the whole suite green. The
  guard now asserts the same rules against `lo` **wherever one era holds both
  entries**.

  Where a rule spans eras the life ordering cannot comply, and the guard says so
  in its own comment rather than quietly skipping it: JLU is era 7, *Batman
  Beyond* is era 10, and Beyond is correctly later in a lifetime, so
  "Epilogue"'s season renders first there whatever the array says. The app's
  unit is the season and "Epilogue" is one episode inside one, so no reordering
  reaches it. That case carries a warning in the JLU season 2 blurb instead —
  the only honest instrument left when the order cannot be the instrument.
  Asserting it here would mean a permanently red build or a rule written to
  pass, and the second is worse.
- **New suite `negtest420.sh`** — one fixture per shelf, because before this
  release either could be reverted alone without anything going red. 47 suites,
  699 fixtures.

## [3.9.2] — 2026-08-14

**The 14 August review, worked through: a blurb that named the franchise's most
famous death, a documented watch order that was backwards for seven minor
versions, four storage and header seams, and a README claim about test coverage
that a full mapping proved false. PATCH — same catalogue, same slugs, same
progress format.**

### Fixed

- **The DCAU order stopped contradicting its own reason, and the reason was
  wrong.** The universe note, the JLU entry blurb, `README.md` and guard 30 all
  said the same thing: JLU's "Epilogue" spoils *Batman Beyond*, so save Beyond
  for the very end. Read once, that is backwards — if "Epilogue" spoils Beyond,
  putting "Epilogue" first delivers the spoiler before the thing it spoils. It
  had held since 1.2.3, each of the four citing the others. Two facts settled
  it. "Epilogue" is JLU **season 2** (2005), not the season 3 (2006) entry the
  blurb sat on; and it is set fifteen years after Beyond, which makes it
  Beyond's ending rather than its trailer. The Beyond block — the pilot film,
  three seasons, Zeta and *Return of the Joker* — now runs **before** Justice
  League, where release order and chronology both put it. Guard 30's rule is
  inverted with it, and every Beyond entry is pinned individually rather than
  the block's ends, so a partial move cannot pass. Entry IDs are frozen, so this
  reorder does not touch a single saved mark or backup code.
- **A blurb named Jason Todd's death one row above the film that reveals it.**
  *Death in the Family*'s description said the film "rewinds to Jason Todd's
  death" — while the next entry, *Under the Red Hood*, is written as "A dead
  Robin … the one question Bruce cannot answer" for exactly the reason that
  blurb ignored, and era 4's note omits Jason on purpose. Rewritten to the
  premise without the name.
- **Nine more descriptions and notes stopped saying what happens.** Era 5's note
  ("the years he is taken off the board") was pure event and sat in the
  crawlable seed. The Knightfall trilogy narrated Parts 1 and 3 before either
  exists. *The Batman* season 2 gave away season 1's finale twist; *Long
  Halloween Part Two* gave away its own climax; *Birds of Prey* gave away *The
  Killing Joke*, which is in this catalogue; *Batwoman* gave away both its lead
  handoff and a crossover cameo; *The Penguin* named *The Batman*'s closing
  event; *Young Justice* season 2 gave away the time skip. *Injustice* keeps its
  famous premise but no longer names the death outright. The Standalone Films
  note said "connected to nothing and to each other" where it meant *not* to
  each other.
- **`flagSave()` clears the `--hdrh` override again.** It only ever set it: a
  session that lost storage and then recovered kept the banner-inflated header
  height for the rest of its life, so `--ghtop`, the belt's sticky top, the drop
  and the includes panel all parked a banner-height below the real header edge
  until reload. Clearing rather than re-measuring is deliberate — an inline px
  value cannot track `env(safe-area-inset-top)` and the stylesheet's `calc()`
  can.
- **A JSON restore consults the value of a mark, not just the key.** A
  hand-edited backup carrying `"some-id": false` imported as watched.
  `marksOf()` has required truthiness on the storage read path since the shaping
  work; two import surfaces disagreeing about one shape was the defect.
- **`dedupeLog()` re-boxes its entries, as `mergeLog()` always has.** An
  unshaped entry in local storage — an extra field, a string timestamp —
  persisted through every future `persistNow()` forever. Same hole the import
  path had fixed, by a shorter route.
- **`IOSDEVICE` is assigned above the first render.** With storage blocked,
  `restore()` renders synchronously, and it ran before the declaration — so the
  iOS install hint was missing from the first paint of a `#progress` deep link.
- **`HEAD /.well-known/api-catalog` answers.** The branch tested for GET alone,
  so HEAD fell through to the assets plane and 404'd — a status mismatch on a
  well-known URI, and HEAD is what a validator probes with first. Guard 133
  executes both methods now.
- **`Vary: Accept` on the HTML representation of `/`.** The Worker set it on the
  markdown branch and nothing set it here, so one URL had two representations
  and no signal that it did.
- **Dead `inList()` left `sw.js`.** 3.2.0 removed `NEVER_CACHE` "and the
  `inList` call that consumed it" and left the body behind.
- **CSP `img-src` dropped `data:`.** The inline data-URI favicon it existed for
  moved to files several releases ago; what was left was a standing allowance
  for any future injection to carry its own image.

### Changed

- **`auth.md` says its own name.** `# Authentication` → `# Night Watcher —
  auth.md`, so a checker matching the filename against the heading can identify
  the file it fetched. The body is untouched: there is still nothing to sign
  into. New guard 135 holds the token.
- **The deploy config is pinned in the file (new guard 136).** On 14 August the
  Worker was deleted, recreated from the dashboard, and came back with two
  overlapping apex bindings — a Custom Domain *and* a Route. Cloudflare cannot
  serve both, so the site failed for every fresh visitor while a cached PWA
  masked it in the owner's own browser. Guard 136 asserts `workers_dev: false`
  and exactly one apex route, bound as a custom domain. It says in its own
  comment what it cannot do: it reads the file, not the panel.
- **`RELEASING.md` gained "Recovering a deleted or mis-bound Worker".** The
  panel half, written down — including the browser-only recovery path and the
  rule the incident cost a day to learn: **verify a deploy in a private window**,
  because an installed PWA serves its own shell and makes a dead origin look
  alive to the one person most likely to check.
- **"Every guard has been negative-tested" was not true, in four files.**
  `README.md`, `NOTES.md`, `index.html`'s header block and `guards.js`'s own
  opening comment all carried the claim since 1.6.x. Mapping all 670 fixtures
  onto the sections they break found **32 sections with no fixture at all** —
  including 132, the largest section in the file, which shipped in 3.7.2
  alongside a negtest suite written for that release's other change. Seven are
  closed here (7, 10, 21, 27, 30, 42, 132, plus the new sections), all four
  sentences now say what is true, and **new guard 138** computes the uncovered
  set on every run and holds it against a written list of 26. A section may
  leave that list. A section may not join it. The guard states in its own
  comment that its map is a substring match and approximate in both directions,
  because a coverage guard that oversells itself is the same failure wearing a
  new hat.
- **`--bless` can no longer launder foreign code quietly.** Guard 10 matched two
  historical signatures, so appending a minified blob inside the app's one
  `<script>` and running `--bless` re-hashed the CSP around it and went green.
  Ten patterns now, with a green case proving the app's own three-argument
  callbacks do not read as minified.
- **Guard 42 sweeps the files written for agents.** It read the five a browser
  loads and skipped `llms.txt`, `orders.txt`, `auth.md`, `_headers` and
  `404.html` — so a foreign URL in the one file an agent actually reads shipped
  without a failure.
- **The comment allowlist lost its two dead entries.** Three of four allowed
  markers named the Cloudflare beacon removed in 3.2.0, and the test is
  `indexOf` — so any smuggled comment *containing* one of those strings passed.
  A section whose stated philosophy is "a fifth cannot arrive quietly" was
  allowing four names for two real comments.
- **qa.yml's fixture split is guarded like the totals beside it.** The workflow
  comment claimed "the counts are now guarded in this file the same as the
  README's" and only the two totals were.
- **New guard 137** pins the four app fixes above by source shape. Three of them
  are one-line reverts, and a one-line revert is what survives a review and dies
  in the next refactor.

### Housekeeping

- CI caches the Playwright browser download (~150 MB re-fetched every run, the
  browser job's dominant cost) and waits for the static server by polling it
  rather than `sleep 1`. `browser-check.mjs` polls the cache for the shell
  instead of sleeping 600 ms before going offline — the file's own rule is
  measure, don't sleep.
- `browser-check.mjs` writes its screenshots to a gitignored `qa/.shots/`. It
  had been overwriting two tracked PNGs on every run that nothing compared and
  CI discarded, so a local run always dirtied the tree.
- Stale prose: two negtest suite headers cited guard numbers that moved (53→55,
  59→66); `run-all.sh` carried a skip that could never fire and now documents
  the `negtestNNN` naming convention and negtest131's exception;
  `make-share-card.mjs` still claimed Playwright was deliberately absent from
  `package.json`, where it has been since 3.7.2; `NOTES.md` said every TV season
  carries `o:1` (The Penguin does not, deliberately) and counted "thirteen"
  repeating titles when there are sixteen; `sitemap.xml` cited a byte count for
  `llms.txt` that had drifted 113 bytes, now no figure at all.
- Copy: two double-spaced em dashes, one shape for the six "no order between
  these" notes, `labeled`/`In theaters` brought into line with the catalogue's
  own dialect, Batman '66's runtime agreeing with itself in the note and the
  entry, and the `<meta>` description matching `og:` and the JSON-LD.

### Known, not fixed

- **26 guard sections still have no negative fixture**, named in guard 138's
  `STILL_OWED`. Closing them is a campaign, not a patch, and the list is now
  visible instead of contradicted by a sentence.
- ***Death in the Family* still renders before *Under the Red Hood*** in the
  life ordering and the core route, and the first film's premise is the second
  film's inciting event. The blurb no longer names it; the ordering is an owner
  call and is not made here.
- `404.html` still carries no CSP; a `<meta>` policy does not cover it.

## [3.9.1] — 2026-08-14

**Three lines of copy the seed never carried — what sets the catalogue apart,
the contract the app runs under, and who stands behind it — plus two straight
answers the FAQ did not yet hold. PATCH — same data, same orders.**

### Added

- **The seed says what makes it different, and names its own rules.** The
  crawlable block listed the whole catalogue but never stated, in plain sight,
  what sets it apart from a ranked list or a forum thread, nor the one-paragraph
  contract the app runs under. A reader without JavaScript — and the engines
  that read only that surface — saw the shelf and not the stance. One paragraph
  after the intro now carries both: three spoiler-safe orderings, a fresh
  where-to-watch search on every entry, nothing stored about you, and the
  no-account / offline / progress-stays-put contract. Existing product reaching
  the surface, not new promises. It rides in guard 78's generated seed, blessed
  and byte-compared like everything else in `<main id="view">`.
- **The provenance line reaches the seed.** "An unofficial fan guide, kept by
  6ummy, AGPL, source public on GitHub" lived only in the app's JS-rendered
  footer, so a non-rendering crawler — the one place the Human Trust signal is
  actually graded — never saw who keeps the site or under what licence. It is a
  visible line in the seed now, prose only: guard 90 keeps the seed's anchors
  internal, so the claim carries the weight, not an outbound link.
- **Two straight answers, for the two questions the FAQ did not yet hold.**
  "Will my progress still be here later — on another device, or if I clear my
  browser?" and "Is there an app, an account, or an API?" — added to
  `buildFAQ()`, the one source guard 78 renders into the seed and guard 100
  mirrors into the FAQPage schema, so both move together or the build fails. The
  answers say what `auth.md` says to machines: no account, no API, one public
  page, progress kept only in the visitor's browser.

## [3.9.0] — 2026-08-13

**The closed belt reminds you it is there, the first-run page asks the whole
question, and the one well-known path a validator still probes gets an honest
answer. MINOR — same data, same orders.**

### Added

- **The closed belt glows, now and then.** The utility belt is the app's one
  persistent control, and the standing note on it is the owner's: "you don't
  use it much, but it needs to work perfectly" — which is exactly the thing a
  reader forgets is there. So the parked peek now breathes a soft `--signaledge`
  glow on a nine-second cycle: a slow swell up and back down, easing almost to
  a hold at each end. It rides
  `.pathseg[data-park]:not([data-drop])`, so it is the CLOSED strip only — an
  open or dropped belt never glows, because a control you are already using does
  not need to raise its hand. It reuses the signal-alpha token already on the
  peek, so the palette gains no colour — 3.8.4 spent a release making every one
  single-meaning, and the belt keeps that. And because it is a box-shadow
  keyframe, not a transition, it is off under `prefers-reduced-motion` by being
  named: the `*{transition:none}` block cannot reach a keyframe (the section-128
  Q2 trap), so the `animation:none` block names the strip. Guard 130 pins the
  keyframe, the closed-only selector, the token, and the reduced-motion cut.
- **`/.well-known/api-catalog` answers, honestly and empty.** The Cloudflare
  Agent Readiness panel probes RFC 9727's well-known api-catalog. Night Watcher
  has no API, and 3.8.4 refused to fabricate an `api-catalog` Link relation for
  that reason. But the honest answer to the probe is not silence — a 404, which
  a validator reads as "no catalogue at all" — it is an EMPTY catalogue: an RFC
  9264 linkset with zero links, `{"linkset":[]}`, `application/linkset+json`,
  200. The machine-readable "there is no API", the sibling of 3.8.4's auth.md.
  It is served from the Worker, not a file: `run_worker_first` widens from
  `["/"]` to add the one path, which is safe precisely because no asset sits
  behind it — nothing else pays the hop. What stays refused is an ENTRY: a link
  would need an anchor and a service-desc (an OpenAPI document) for an API that
  does not exist. Guard 133 executes the new branch; RELEASING.md reads it on
  the wire after every deploy. Known risk, accepted on the record: a validator
  may only credit a catalogue that carries at least one entry, and the honest
  empty form could still read red.

### Changed

- **The first-run page offers scope, not just format.** A first-lander saw the
  format switch (Animated / Live action / All) under "What are you watching" but
  not the scope switch (Movies / Movies+Series): that one lived only inside the
  belt's closed buckle, so the sixty-seven seasons of television were invisible
  until a visitor opened a pouch they had no reason to. The intro paragraph even
  promises it — "Films only, or every series too." Scope now renders beside
  format on the first-run surface, the same "what to include" pair the belt
  groups. This is parity, not a second home: format already rendered in both
  places, and scope only ever belonged beside it. One token in `viewHome`; the
  existing `data-scope` handler already did the rest. Guard 54 pins scope beside
  format, above the path deck.

## [3.8.4] — 2026-08-13

**The page learns to introduce itself to agents, the darker theme finishes
what 3.8.3 started, and the last green leaves the palette.
PATCH — same data, same orders.**

### Added

- **A third `Link:` line under `/`, for agents.** The Cloudflare Agent
  Readiness panel (12 Aug) read the response and found "Link headers present
  but no agent-useful relation types". The site has no API, so RFC 9727's
  `api-catalog` / `service-doc` would be fabrication; `describedby` is the
  honest registered relation, and `/llms.txt` is the description it points
  at — the same file the Worker already serves when an Accept header prefers
  `text/markdown`. The target is site-relative by design where canonical and
  sitemap are absolute: those name authoritative URLs, this names a sibling
  of whatever origin served it. Lives in `docs/_headers` — in-repo, diffed,
  guarded — not in the Transform Rule Cloudflare suggested; the `_headers`
  history is the whole argument. Guard 104 pins the line, its scope and its
  relative form. Known risk, accepted on the record: third-party checkers
  may only credit their own example rels.
- **`/auth.md` says there is nothing to sign into.** The same panel wants an
  auth.md telling bots how to register. Night Watcher's answer is that no
  accounts exist, by design — no registration, no login, no API keys,
  everything public, progress client-side only — and the new five-line
  static `docs/auth.md` says exactly that. Zero bytes in index.html. Named
  in the shell guard's exclusions like llms.txt and orders.txt: written for
  machines that never run the app.

### Changed

- **The darker theme dims ALL the bone, not just the primaries.** 3.8.3
  dimmed the three bone-filled primary buttons via `--bonebtn`; the owner
  wanted the bone-colored text dimmed too, and the theme chooser's pressed
  button with it. `--bone` itself now drops `#E7E9F0` → `#AEB6C8` under
  `data-theme="darker"` — body text, pressed chips and toggles, the ticks,
  the toast, the search text, every consumer of the variable, seventeen in
  all. Contrast holds everywhere it lands: 10.3:1 on black, 8.7:1 on the
  lightest card, `--ink` on dimmed-bone fills 10.3:1 — AAA across the
  board, from 17.3:1 that only ever glared. The default theme keeps its
  bone untouched.
- **The INTERACTIVE badge goes crimson.** `--moss` green was the only green
  on the page — one badge, on one entry (Death in the Family 2020), plus its
  legend row — and the owner didn't like the palette's odd one out. His
  first pick was dust; the badge-identity guard refused it on the spot (the
  rating badges already wear dust outlined, and no colour may carry two
  meanings), and every other neutral is spoken for — dim is OPTIONAL, bone
  is SHORT, steel is NOT OUT YET, staroff fails the AA floor on every card.
  Second pick, on the record: `--crimson2`, the soft red the danger button
  already trusts — 6.7:1 or better on every surface in both themes, and the
  one entry wearing it is Jason Todd's. `--moss` leaves `:root`; the
  palette carries no green at all.
- **The SHORT badge steps up from opacity .55 to .7.** Found by the fade
  guard the moment `--bone` dimmed: bone at .55 over the darker theme's
  cards lands at 3.5:1, under the 4.5:1 AA floor the full-strength checks
  cannot see. At .7 the worst pair is 4.92:1 — both themes, all four
  surfaces — and the badge still reads as the quiet one.

## [3.8.3] — 2026-08-12

**The search box stands still, the darker theme's primaries stop glaring —
and the support element is built three ways, then not shipped at all.
PATCH — same data, same orders.**

### Not added, on the record

- **No support element ships.** It was built three ways in one day, each cut
  smaller on the owner's call: a full Home card (heading, blurb, truncated
  BTC address with copy-to-clipboard, a hex-packed inline-SVG QR behind a
  toggle — all of it green through the whole harness), then a 38px pill on
  Home, then four words of mono on Progress's build line pointing at GitHub
  Sponsors. The last cut died on the facts: Sponsors pays out through
  Stripe Connect, and Stripe's onboarding wants legal name, date of birth,
  home address, bank account, government ID and a tax form — the exact
  personal-info surface that ruled out PayPal and Ko-fi on 2026-08-11. The
  link, `.github/FUNDING.yml`, the address, the QR and both handlers are
  all out. The build line reads `read the source` and nothing more. If
  support returns, the QR technique (29×29 ECC-L matrix hex-packed to 232
  chars, expanded to inline SVG in fifteen lines, no library) is in this
  file's history and the release-prep notes.

### Changed

- **The darker theme's big light buttons dim.** "Begin the path", "Mark
  watched", "Share the night", "Search everything", "Create backup code" —
  every bone-filled primary drops from `#E7E9F0` to `#AEB6C8` under
  `data-theme="darker"`, via one new `--bonebtn` variable. The default
  theme keeps its bone; pressed chips, toggles and ticks keep theirs
  everywhere. Owner's pick from four mocked directions: dimmed bone,
  darker theme only.
- **The theme chooser spans the column.** It sat centered at 230px; it now
  runs the full card width like everything else on Home — owner's call, same
  review. The guard clause flipped with it (a returning `max-width` is now
  the regression) and negtest200's fixture flipped the same way.
- **The raw weight ceiling rises 200 → 220 KB.** The fifth raise, the
  owner's number, on the record 2026-08-12: room for the support section
  now and for the 4.0.0 swipe change coming — and stands at 220 even
  though the reviewed cut ships at 198 KB, back under the old line once the
  support element shrank and then left. Gzip stays at 80 KB — the page
  ships at 57. The discipline stands: guards still
  fail the build at the line, and every raise is still an owner's call
  recorded here, never a drift. negtest195's fixture moves with the number.

- **The spoiler promise reads "no spoilers".** "Watch orders that spoil
  nothing" becomes "watch orders, no spoilers" in every sentence that carries
  it — the intro, the pre-render seed, the meta/OG/Twitter descriptions, the
  JSON-LD, README's canonical sentence, llms.txt's summary and manifest.json —
  and "Batman watch orders. No spoilers." on the standalone surfaces: the
  `<title>`, og:image:alt and the share card's tag (docs/share.png
  regenerated). Guard 117's load-bearing phrase and guard 108's seed moved
  with the copy, rule and check together. RELEASING.md's blurb rule now names
  the "no spoilers" promise. CHANGELOG history keeps the old wording.

### Fixed

- **The search box no longer jumps while you type.** Every debounced
  keystroke re-rendered `#view` and refocused the box with a bare
  `focus()` — the browser scroll-snapped it into view, fought the scroll
  restore, and the box visibly hopped; when matches shrank, the shorter
  page clamped the restore and hopped it again. Soak finding. The refocus
  now carries `{preventScroll:true}` like the button path always has, and
  after the restore the box is re-anchored to the viewport position it
  held before the render — measured before, corrected after, one
  `scrollBy` of the drift. The before-read is hoisted to render()'s opening
  reads, above the first write, where it rides the layout the keep-read
  already forces; section 120 moves `getBoundingClientRect` from REFUSED to
  PINNED at exactly 2 with the reasons on the record, and negtest330's
  order fixture moves with the hoist.

- **The story card's left horn no longer shows a bite taken out of it.** The
  bat's left-ear subpath was wound clockwise while the body, right ear and
  tail run counter-clockwise. The three SVG copies fill each subpath as its
  own `<path>`, so nothing showed — but the share card fills BATP as one
  `Path2D` under the nonzero rule, and where the left ear overlaps the body
  the windings cancelled into a hole. The ear's vertex order is reversed
  (`M42 32 L49 29 L38 17 Z`), same triangle, same silhouette everywhere, in
  all four copies so section 115 still reads one shape; negtest210's
  edited-alone fixture moves with the string.

## [3.8.2] — 2026-08-11

**The donut becomes the skyline, on the owner's call: 33 universes never fit
a circle. PATCH — same data, same jumps, same card; only the chart's form
moves.**

### Changed

- **Progress's chart is a skyline of bars, not a donut.** With the belt on
  By universe the ring had 33 slices — unlabeled, mostly hairline, and
  untappable, a barcode wearing a circle. The skyline keeps the donut's
  whole grammar in a form that scales: each bar's width is the group's
  share of the catalogue, its yellow fill rises bottom-up as the group
  completes (a partial height reads at any width, which is where the
  left-to-right alternative failed), e0 keeps its steel, and tapping a bar
  jumps to the group. Hero-sized at 88px tall with no percentage headline —
  the header ring already says the number; the sub line carries the counts
  and the key (width is size, fill is watched) instead.
- **The chart's jumps gain a keyboard.** The bars are real buttons with
  aria-labels riding the same `data-act="jump"` path as every row — the
  donut's slices were pointer-only from the day they shipped. The
  `g[data-seg]` branch leaves the view delegate with the SVG.

### QA

- Smoke's three follows-the-belt checks and the browser check's three chart
  drives now find button bars instead of SVG slices (count unchanged, 309).
  The dead-rule sweep loses `.pcent`/`.plab`/`.pie svg` with the SVG and
  gains `.sky`/`.seg`.

## [3.8.1] — 2026-08-11

**A UI coherence pass, owner-directed: one footer voice, one hero scale, and
one progress donut — the belt's. PATCH because nothing new enters the
catalogue and no stored format moves; the app just stops disagreeing with
itself about type and about which ordering the donut answers for.**

### Changed

- **Progress draws one donut — the chosen ordering's — and it follows the
  belt.** Two charts (universes, eras) rendered whatever was chosen, which
  meant the chosen ordering could be the one WITHOUT a chart: pick Release
  order and neither donut was yours. Now the single chart is `S.mode`'s —
  universes, eras, or decades — and a belt tap re-renders it in place, so
  the donut and the belt cannot disagree. It also doubles in rendered size
  (148 → 240px cap), which is the touch-target half of the argument: the
  slices are the tap surface, and slices on a 148px ring split two-up were
  below any comfortable finger. Release order gets its first donut (decade
  slices) and, with it, a **By decade** fold below the existing two — the
  keyboard route the pointer-only slices always relied on, same as
  universes and eras.
- **The Path hero matches the other heroes.** `.pathtitle` was
  `clamp(20px,5.2vw,27px)` against the Next up hero's
  `clamp(24px,6.5vw,36px)` — the page-level title of the app's main view
  was its smallest hero. It now carries the hero scale, and `.modenote`
  (its description) steps up 12.5 → 15px in the hero blurb's colour.
- **The footers speak in one voice.** Home's footer is mono, 9px,
  uppercase, tracked; the Progress build line was body type at 12.5px, and
  Next up's closing watching-truths (`watchNotes()`) were body type too —
  same role, three treatments. `.buildline` and the two watching-truths
  (now `note foot`) carry the same mono voice. The guarded
  `Build · updated · read the source` shape and the link styling are
  untouched; the one markup change is the `foot` modifier on Next up's two
  notes, and negtest131's byte anchor moved with it.

### QA

- Smoke gains three checks (309): each belt position drives Progress and
  asserts exactly one chart whose every slice carries that ordering's key
  prefix. The browser check's jump drives grow from five to seven — the
  decades donut and the decades fold — and the donut drives now set the
  mode they expect, since a donut that follows the belt is only findable
  on its own ordering.

## [3.8.0] — 2026-08-11

**The durability round, plus the one item the Radar scan actually gated on.
The 11 Aug storage-durability review (in-project) found the resurrection
class M-1 only half-closed, ranked the honest fixes, and the top three ship
here; the 10 Aug Radar triage recommended exactly one repo-side change and
it ships too. MINOR because the root learns a new trick and the live payload
gains a field; every saved progress format is untouched.**

### Fixed

- **An individual removal stays removed across tabs.** 3.7.2's `resetAt`
  covered the full erase and nothing else: every merge site was additive
  while every toggle can remove, so unmarking one entry — unticking, un-
  skipping, clearing a rating — lasted exactly as long as it took any other
  open tab to write. Every mark, skip and rating now carries the time it
  last changed (`clk` in the live payload, `S.clk` in state), and the
  cross-tab merge is last-write-wins wherever a clock exists on either
  side: a clock whose mark is absent is a tombstone, and an absence with a
  newer clock propagates instead of refilling. Ratings stop being
  keep-local (they had no timestamps at all — not LWW, the review's premise
  1). **The recorded "the merge only ever adds" decision is amended, not
  voided:** clockless payloads from older builds still merge additively,
  and restores/imports still only add — but they can no longer resurrect a
  clocked, deliberate removal. This is also the review's stated
  precondition for ANY future off-origin copy (file mirror, sync layer).
  Deliberate: `exportJSON()` and the NW code carry no clocks — backups are
  one-shot transports a person applies on purpose, and guards 7/8/87's
  format promise holds. Guard 134 pins the shape; smoke drives all of it
  through the real listener with real StorageEvents (306 checks, was 298);
  `negtest400` re-introduces the resurrection one leg at a time and
  requires each to be caught.

### Added

- **`GET /` negotiates markdown — the Radar Level 3 gate.** A request whose
  Accept header PREFERS `text/markdown` (explicit entry, q-values read,
  strictly over `text/html` — ties and wildcards go to the page) answers
  with `llms.txt` served as `text/markdown` with `Vary: Accept` and
  `Content-Location: /llms.txt`. One source, no second copy of the prose.
  Implemented in-repo in `worker.js` — the first `main` script in front of
  the assets — with `run_worker_first` scoped to `/` alone, so no other
  path ever pays the Worker hop or inherits its failure modes; every
  non-preferring shape falls through to the assets plane untouched. The
  managed "Markdown for Agents" toggle was declined on the `_headers`
  lesson: edge config is undiffable, unguardable, and it strips validators.
  Guard 133 EXECUTES the worker (the sw.js treatment: written in `.then()`
  chains so the sync-thenable harness can drive it), asserts the markdown
  branch and the passthrough BY IDENTITY, and pins the wrangler wiring;
  eight `negtest400` fixtures attack it; RELEASING.md gains the wire check.
- **The durable-storage ask (durability review, item 1).** On the first
  mark of a session — never on a bare load, so a first visit sees no
  permission prompt — the app calls `navigator.storage.persist()` once.
  Chromium grants silently from engagement and its eviction is the only
  wipe this helps against; NOTES.md says so where the layers are ranked.
  The install seat's copy now also tells the durability truth it always
  half-knew: the installed copy is the one the browser treats as worth
  keeping, and on iOS a home-screen app's storage outlives a tab's.
- **The stale-backup nudge (durability review, item 2).** `lastExportAt`
  rides the live payload, stamped when a code is made or a backup file
  actually downloads. Once ten or more marks postdate the newer of
  last-export and last-dismiss, the Your-data block says so — behind by N,
  or never backed up at all — with a quiet "Later" that stamps
  `bkDismissAt` (numeric, persisted only when set, the `insOff` family's
  pattern) so the nudge returns only after ten NEW changes. It counts via
  the same per-mark clocks the merge uses; no second bookkeeping.

### Changed

- **Weight: 198 KB raw / 57 KB gzipped** (was 194/56), inside the recorded
  200/80 ceilings — no raise needed or taken. Counts, all guarded: 134
  guard sections, 306 smoke checks, 45 negative suites / 664 fixtures.

## [3.7.2] — 2026-08-10

**The deep review's round. A three-pass QA review of 3.7.1 (app, harness,
docs — the report lives with the project) found nothing critical and three
highs, all in the same place: the machinery that protects the tree was less
protected than the tree. This release is that fix list, worked top to
bottom, plus the full favicon surface the head had never declared.**

### Fixed

- **Bless can no longer launder a frozen-ID removal (H-1).** The frozen-ID
  diff ran only in the non-bless branch, and `--bless` rewrote
  `qa/frozen-ids.json` unconditionally — so deleting an entry and blessing
  voided saved progress with no failure and no reviewer-forcing record. The
  diff now runs before the snapshot write and bless HARD-FAILS on a removal
  with no `qa/retired-ids.json` entry, leaving the snapshot untouched. The
  suite's #1 stated invariant is finally enforced against the one tool that
  could bypass it.
- **The five bless writers no longer clobber each other (H-2).** Every
  `index.html` writer rewrote the file from the string read at startup, so
  the second write in a run reverted the first: bless could print "rewrote"
  twice, exit 0, and leave the tree red — or revert its own CSP-hash fix and
  demand to be run again. `blessHtml()` threads the mutated string through
  all of them, and a clean bless now re-runs the whole check pass against
  the tree it wrote, exiting red if that tree is red. `npm run bless` means
  what it says, in one run. The bless path — the only writer with no
  negative coverage — gets its own suite: `negtest390`, three fixtures.
- **A cross-tab erase stays erased (M-1).** Multi-tab sync was merge-only,
  so "Clear all progress" in one tab was resurrected by any other open tab's
  next write — on an app whose privacy pitch is that what you tick stays
  yours to keep or destroy. A reset now stamps a monotonic `resetAt` into
  the payload, and the storage handler adopts a newer one as the wipe it is
  before merging. Driven end-to-end in smoke with real StorageEvents.
- **The restore toast stopped promising what NW codes cannot do (M-2).**
  Unknown ids in a JSON restore genuinely persist — "kept" was true. Unknown
  hashes in a backup code cannot be inverted and were only counted — the
  same toast text was a false promise that cost anyone who trusted it and
  discarded the code. The code path now says: "keep the code to restore them
  after updating."
- **JSON restore refuses malformed containers (L-1).** `{"watched":"abc"}`
  used to iterate string indices, report "Restored 0 · 3 kept," and persist
  junk ids `"0","1","2"` into every future export. The three containers must
  now be plain objects or the restore is refused.
- **The parked belt is reachable by keyboard (L-2).** Parked, the strip hid
  its buttons (out of the tab order) and the remaining affordance was a
  click-only div. While it is the only affordance the strip now carries
  `role="button"`, a name, and a tab stop — Enter and Space open it exactly
  as a tap does — and the attributes come off the moment the real buttons
  return.
- **The runtime cache write rides `event.waitUntil` (L-3).** The put was
  fire-and-forget, so the browser could kill the worker between the reply
  and the write and a downloaded update quietly missed the offline cache.
- **browser-check's "a group opened" axe state actually opens a group
  (M-4).** The setup read `PATH[0].k` — a field PATH groups never had — so
  the fold never opened and the axe pass audited the plain view twice. Every
  axe state now proves it holds before axe runs, a "row expanded" state
  joins the pass (the app's most complex live DOM, previously never
  scanned), and the inert check-shaped line in the header drive is gone
  (I-5).
- **run_case consults the exit code, and a green match must be caused by the
  mutation (L-8).** A fixture whose expected text drifted into a warning a
  healthy run also prints used to report PASS with nothing broken. A green
  exit now passes only on a warning-line match that a pristine-tree run does
  not emit. The fixture counter also counts indented fixtures (L-10), the
  backup-code fuzz sweeps `skipped` for invented ids (L-5), the external-
  script sweep refuses any `src` on a script element — protocol-relative and
  unquoted included (L-6) — and both "every section can fail" censuses stop
  counting `fail(` quoted inside comments (L-7). Smoke's dead-rule sweep
  reports unparsable selectors instead of marking them matched (L-9), and
  its two dead strip-replaces and the `S.log = {}` remnant are gone (I-6).

### Added

- **The full favicon surface.** The head now declares the complete set:
  `favicon-16x16/32x32/48x48.png` (plain PNGs at tab sizes, alongside the
  ico that carries the same layers), a dedicated 180×180
  `apple-touch-icon.png` — opaque on the ink ground, because iOS ignores the
  manifest and composites transparency onto black — `mstile-144x144.png`
  with `msapplication-TileColor` and `msapplication-TileImage`, and
  `application-name`. All five rasters are generated from `icon.png` by
  `qa/make-favicon.py`, so none can disagree with the bat that ships; all
  five stay out of the offline shell (browser chrome, same reasoning as the
  ico); all five take the icons' one-day cache policy in `_headers`; and the
  favicon guard pins every one of them with its reason.
- **The browser check runs in CI (H-3).** A `browser` job installs Chromium,
  serves `docs/`, and runs `browser-check.mjs` on every push and nightly —
  the only instrument that can see scroll restore, focus restore, belt
  rendering, the axe passes and CSP violations no longer runs only when a
  person remembers to look.
- **sw.js is executed, twice over (M-5).** New guard 132 drives the shipped
  install/activate/fetch handlers against mocks: the shell precaches, stale
  caches purge, a 200 is cached through `waitUntil`, a 500 is NEVER cached,
  offline serves from cache with the navigate fallback, and cross-origin and
  non-GET traffic is left alone. The browser check registers the real worker
  in a fresh context, cuts the network, and asserts the app still opens.
- **`RELEASING.md` (M-3).** The checklist `docs/_headers` had delegated its
  wire check to since 3.4.2 — without the file existing. The wire checks,
  the bless procedure, the browser-check invocation, the blurb re-read rule
  (I-10), and the rollback runbook `sw.js` promises, all in one place.
- **The manifest is pinned whole (M-7).** Guard 83 held only `id`; a
  `start_url` typo would have shipped green and 404'd every new install.
  `start_url`, `scope`, `display`, both names and both colors are pinned
  with it now.
- **The document's own cache policy (L-4).** `Cache-Control: no-cache` under
  `/` in `_headers`, guarded — the entire app rode the platform default for
  every visitor the service worker cannot help, which is the exact
  undeclared-policy failure this file's own history records for `sw.js`.

### Changed

- **The prose caught up with the tree (L-11, L-12, M-6).** README: the
  sitemap row says two URLs, the `_headers` row stops repeating the claim
  the file itself marks superseded, the package row names the whole QA
  toolchain, the CI row includes the browser job, and the literal `—`
  escape is fixed. qa.yml's cost comment states the real fixture split —
  and those counts are now guarded there, so the next drift fails the
  build. Stale prose fixed in `sw.js`'s header (the analytics case, the
  weight), guards §42's header (the beacon, gone since 3.2.0), NOTES'
  storage-adapter note (GitHub Pages), and NOTES' rating-badge version
  range (amended: no 2.3.x/2.4.x was ever cut). The 3.7.1 fixture
  arithmetic above is amended — 646, not 642. The eight maintainer-local
  evidence files cited across README, CHANGELOG, NOTES, `_headers` and the
  sitemap are annotated as exactly that, so the audit trail stops
  dead-ending for everyone but the maintainer. The one deliberately-wrong
  slug (`harley-quinn-season-5-2024`, guard 84) carries an inline comment
  at the data so nobody "fixes" the id and voids saves (I-4).
- **Content-Signal: ai-train flips no → yes.** The owner's rights call,
  reversing the 3.4.2 position — search and live citation were already
  permitted, and training now is too. The signal is a preference; the
  licence is the grant, and AGPL-3.0 with the marks preamble governs
  copying either way. Guard 125 deliberately pins the line's shape and not
  its values (a rights position is the owner's to change); the negtest340
  anchor tracks the new line.
- **Counts:** 44 negative suites, 651 fixtures; 132 guard sections; smoke
  grows by the erase-propagation and selector-parse checks.

## [3.7.1] — 2026-08-10

**A canonical relation is a statement about a document, and `/*` was applying
it to the fonts, the icons and `sw.js`. It moves under `/`. And `llms.txt` —
the one file written to be found by engines — was findable by none of them,
because nothing on the open web pointed at it.**

### Changed

- **The two `Link:` relations moved from `/*` to `/` in `docs/_headers`.**
  Cloudflare's `_headers` matches on path only, never content type, and
  applies every matching rule cumulatively with no way to unset — so scope
  is which block a line sits in, and nothing else. `/` is the whole HTML
  surface: `wrangler.jsonc` pins `not_found_handling` to `"404-page"`, not
  `single-page-application`, and the app is one page with hash routing, so
  no other path ever serves a document. **This ships on principle and buys
  nothing measurable, which is recorded rather than dressed up** — see QA.
- **`sitemap.xml` gains `llms.txt`.** GSC reported it *"URL is unknown to
  Google — no referring sitemaps detected, no referring page"*: nothing
  pointed at it, so the file written for engines could not be found by one.
  **`orders.txt` stays out and guard 105 still fails the build if it appears
  there** — it carries the same 200 entries as the crawlable seed, and
  submitting both asks a search engine to choose between two near-identical
  bodies on one domain. `llms.txt` is 1,892 bytes of summary and pointers,
  not a second catalogue. Discoverable is not indexed.

### QA

- **The `icon.svg` "Soft 404" was measured, and it is not the canonical
  header.** An outside reading attributed it to the blanket `Link:
  rel="canonical"`. Three live tests, one instrument, one hour, 10 Aug:
  `llms.txt` carries that header, Google *read* it (User-declared canonical:
  `https://nightwatcher.life/`) and still answered **"Page can be indexed"**;
  `icon-192.png` reported User-declared canonical **None**, so a PNG is never
  evaluated as a document at all, and it came back available too; only
  `icon.svg` fails, because SVG is a renderable document format that renders
  with no text. **The verdict on the favicon is unchanged — no change, and
  nothing before 19 Sep.** `qa/favicon-serp-2026-08.md` (maintainer-local, not in this repository).
- **Guard section 104 now asserts scope, not presence.** Every entry in
  `PINNED104` tested whether a string existed anywhere in the file, so the
  whole of this release would have shipped green through it. The file is
  parsed into its rules and each header is held under the rule it belongs
  to, with a refusal from the other side: a `Link:` relation re-declared
  under `/*` fails even while the `/` copy still satisfies every presence
  test.
- **`qa/negative/negtest251.sh` gains six fixtures.** Both `Link:` clauses
  entered `PINNED104` in 3.4.3 and **neither had ever been seen to fail** —
  five releases of a hand-maintained list nothing tested. Dropped, retargeted,
  re-declared under `/*` (both relations), and the `/` rule deleted outright.
  636 fixtures → **642**. *(Amended 3.7.2: both numbers were hand-written and wrong — the tree at 3.7.1 carried **646**, the figure the guarded README and qa.yml counts already stated. The arithmetic drifted inside the entry that reported it, which is this project's oldest failure wearing its newest hat.)*

## [3.7.0] — 2026-08-09

**The app has been installable since the manifest shipped, and told nobody.
Now it says so, once, quietly, in the place where it matters — and the
Progress footer hands the two watching-truths to the tab where watching
happens.**

### Added

- **The install seat.** One quiet block in Progress, under the saves-line.
  On engines that fire `beforeinstallprompt` the offer is caught
  (`preventDefault()`, so Chrome's own mini-infobar never appears), held,
  and rendered as a `bkbtn`-outline button — tapped, the native install
  dialog opens. On iOS, where no prompt API exists, the seat is a one-line
  Share → "Add to Home Screen" hint with a Dismiss that lasts forever
  (`insOff`, persisted only as true — `progOpen`'s rule, fourth verse).
  Inside the installed app the seat renders nothing: an install button in
  the installed app is furniture that forgot to remove itself. `prompt()`
  is spent before it is called — a second call on one event throws — so a
  decline quietly sits out the session and Chrome re-offers on a later
  visit. Never a banner, never a fill: Progress already carries two bone
  fills, signal is state, and a button that exists on one platform and not
  another cannot hold primary weight. Guard 131; reasoning in NOTES.md.

### Changed

- **The Progress footer split, and the watching-truths moved home.** The
  availability note ("Where to watch" runs a fresh search) and the dates
  note ("Announced dates can move") are about watching, so they now render
  at the foot of Next up, from one source (`watchNotes()`). Progress keeps
  the machinery: the saves-line and the build line. Each sentence lives in
  exactly one place — guard 121's drift lesson, applied before the drift
  instead of after. Guard 131 holds the split both ways.

### QA

- **Guard section 131** — the seat's refusals (standalone renders nothing,
  the button waits for a held offer and spends it, the hint dismisses
  only-true, quiet outline, one seat) and the footer split (both truths in
  `watchNotes()`, neither in Progress, the machinery notes staying put).
- **`qa/negative/negtest131.sh`** — fixtures for every clause above.

## [3.6.4] — 2026-08-09

**Three soak calls from the corrected drop's first evening — and one owner
correction mid-build that reset the belt's resting state. The rule is now
one sentence: once you choose a path, the belt lives under the header.**

### Changed

- **Once chosen, the belt is the peek — everywhere, always.** The 12px
  sliver sits under the header on every tab, at the top of the page and
  mid-list alike; tap it and the belt drops to work in place, and the next
  scroll or tab change tucks it back. The whole strip no longer sits in the
  flow after a path is chosen (before you choose, it still does — a peek
  with nothing lit would be debris). The peek is the same sticky strip it
  always was, pulled up under the header by a margin — deliberately nothing
  else, so it renders in every browser ever made. An earlier cut of this
  release anchored it with new-platform CSS and it failed to appear at all
  on six real browsers; that dependency is gone rather than diagnosed.
- **The belt works without anchor positioning now.** The dropped strip was
  never anchored; the pouches' anchored rule moved inside an `@supports`
  gate that names the three exact shapes it uses, over a fixed-position
  fallback whose top is a constant the pinned strip guarantees. Older
  Safari and Firefox get a working belt instead of a peek that opens
  nothing. The JS probe is deleted — the gate lives in the stylesheet,
  where it cannot diverge from the rules it vouches for.

### Fixed

- **The drop toasts down.** Tapping the peek brought the belt in a single
  frame — the render rebuilds the strip, so the transition that carries the
  retraction up had nothing to leave from. The entrance now mirrors the
  retraction: the same 34px from behind the header, the same ease, the same
  0.22s, played once per drop and cut entirely under reduced motion.
- **The stack has no daylight in it.** The format row's 6px bottom margin
  collapsed against the types row's -5px pull to a 1px gap between the
  pouches — invisible at Home on the page's own colour, a 1px window over a
  dropped list. Every seam in the stack is now an overlap: belt over format
  by 4px, format over types by 5px, in both states.

**All decisions are guarded in section 130 with the reasoning in the failure
messages; `negtest380.sh` puts every old behaviour back on purpose —
including the deleted machinery, whose return must fail as loudly as a
removal.** No catalogue change, no saved progress touched, PATCH.

## [3.6.3] — 2026-08-09

**Two soak calls from the drop's first weekend, both about what the drop
does rather than where it sits.**

### Changed

- **The drop arrives closed.** Tapping the peek used to bring the belt down
  with both pouches already open. It now brings the belt whole — strip and
  shadow — and the buckle opens the pouches in place when you want them,
  exactly as it does everywhere else. The state machine always drew Dropped
  and Open as two states; the tap now agrees with it.
- **Choosing a path from a dropped belt keeps your place.** The path segments
  carried a scroll-to-top from before the belt could be used mid-list; from a
  dropped belt that threw away exactly the position the drop exists to
  protect. A segment is a selector — the list re-sorts under you and you stay
  where you are. Going home is the wordmark's job, above, in the app's name.

**Both decisions are guarded in section 129 with the reasoning in the failure
messages; `negtest370.sh` puts each old behaviour back on purpose (24
fixtures).** No catalogue change, no saved progress touched, PATCH.

## [3.6.2] — 2026-08-09

**One property, latent since 3.5.0, and it explains the whole "does not drop
correctly" report — including at the top of the page.**

### Fixed

- **An open belt sat 37px below its own place, on top of its pouches.** The
  strip carries `top` for its sticky parking; opening the belt switches it to
  `position:relative` — **and `top` offsets relative boxes too.** So from
  3.5.0 on, tapping the buckle shifted the whole strip down by exactly the
  parking offset, burying the format row completely and most of the types row
  behind an opaque belt. With 3.6.0's transparent rows the wreckage was at
  least visible; 3.6.1's opaque rows hid the pouches entirely, which is why
  the buckle looked like it did nothing. The held rule now resets `top`. One
  word — `auto` — and the belt opens where it stands.

**Reproduced by geometry before the fix** (pouch top 37px above the strip's
bottom edge, rows fully covered) **and re-measured after it** (the 4px tuck,
exact). Guard 128's held-rule pin now includes the reset with the failure
story in its message; `negtest360.sh` gained the fixture that puts the sinking
back (25 fixtures). No catalogue change, no saved progress touched, PATCH.

## [3.6.1] — 2026-08-09

**The drop's first soak report, same evening, both findings fixed.** Dropped
over a list, the pouch rows were windows and the pinned era headers punched
through the belt. Neither was visible in the flow, which is exactly why
neither was caught there.

### Fixed

- **The pouch rows are opaque now.** They never had a background — in the
  flow they sit on the page's own colour, so nothing ever showed through and
  nothing looked wrong. Dropped over a list, everything did: the era pill and
  the list's own titles read straight through the rows. The fix is the page's
  colour as an explicit background — Home does not change by a pixel, and a
  dropped pouch is a surface instead of a window.
- **The dropped belt and its pouches paint above the pinned era headers.**
  The era headers pin with the same stack level the strip uses in the flow,
  and they come later in the document — so a pinned "THE GRAYSON YEARS"
  painted over the dropped pouches. The dropped pair now sits above every
  pinned header and still below the app header, which the belt parks behind
  on purpose.
- **The drop's support gate probes what the drop actually uses.** It checked
  one property and vouched for three functions; a browser in the gap would
  have dropped broken pouches instead of falling back to the calm scroll
  home. It now probes `position-anchor`, `anchor()` in `calc`, and
  `anchor-size()` in `calc` — any miss means last release's behaviour, not a
  degraded drop.

**Guard 129 grew all three refusals; `negtest370.sh` gained their fixtures
(22 now).** No catalogue change, no saved progress touched, PATCH — no tag.

## [3.6.0] — 2026-08-09

**The Belt drops. Stage C of the belt-peek design — the other half of 3.5.0,
and the half every one of the seven mock rounds' findings lives in.** Tap the
parked peek and the belt slides down under the header, over the list, with its
pouches open in place. Change your format four hundred rows deep in two taps
without losing your place — the thing the drop exists for, and the thing the
belt could not do at any price before today. The next scroll retracts the
pouches, stage by stage, and the belt rises back to its peek.

**The headline is a guard that did not change.** The plan spent a page on
amending section 120 — the strip-measured anchor needed one of three refused
layout reads, and moving one into the pinned list was "a decision with its own
argument". The plan's own footnote said to spend ten minutes on a CSS answer
first. **The ten minutes won: the dropped pouches hang off the strip through
CSS anchor positioning** — `anchor()` resolves the strip's real box, scrollbar,
safe area and column included — **so section 120 ships untouched, pins and
all, and the argument never had to be made.** Four of the seven mock findings
died in the same move: the half-scrollbar offset (F11) cannot happen when the
pouches inherit the strip's own box; the pouches cannot be "left behind" by a
rising belt (F12) when they are anchored to it — measured mid-transition in
this build's Chromium drive; and the two mid-close layer hand-offs that went
wrong in the mock (F13, F14) no longer exist, because the strip never changes
`position` during a drop — only `top`.

**No catalogue change. No saved progress touched.** MINOR, and it takes a tag
— `v3.6.0`, the seventh.

### Added

- **The drop.** Parked tap → the strip's `top` transitions from the peek to
  the header's bottom edge, shadow on, buttons live again, pouches open in
  place — `position:fixed`, anchored: top from the strip's bottom (the same
  4px tuck as the flow), left inset 8px, width from `anchor-size`. The list
  never moves: the pouches were never in the flow, so there is nothing to
  compensate.
- **The staged departure.** One scroll retracts everything: types first,
  format a beat later — each travelling far enough to finish behind the strip
  (`-115%` and `-210%`; a 12px nudge plus opacity is a fade, and a fade reads
  as vanishing) — while the belt rises to the peek on its own transition and
  the pouches ride it, because an anchored box tracks its anchor. Armed as a
  one-shot `{once:true}` scroll listener, alive only while dropped — **the one
  scroll listener in the app, pinned by count in guard 128** the same way
  section 120 pins its layout reads.
- **The flow auto-close (F14's other half).** A belt opened at the top and
  scrolled away now closes itself once its pouches' flow space is entirely
  above the fold — invisible, and compensated by exactly the height the flow
  gave up, read from the observer's entry rather than from a layout query.
  `#view` sets `overflow-anchor:none` deliberately, so the app pays its own
  compensation or the list jumps. Then the strip re-sticks and the peek slides
  in — the entrance finally arriving by the route it was designed for.
- **Three planes, one rule (F9).** The types row now hangs behind the format
  row the same way the format row hangs behind the belt — inset 11px further,
  pulled up 5px, painted behind. **This deliberately reverses 2.0.0's
  flush-aligned pouches, at Home as well as dropped** — the same object does
  not get two constructions. Recorded as a reversal, not left to look like
  drift.
- **One seam (F13's other reversal).** An open belt drops its bottom margin,
  so the pouch tuck is the same 4px in every state — the 10px stays when
  closed, where it is spacing rather than a seam.
- **One exit (F12).** Every close — buckle, drop-scroll, auto-close — routes
  through a single function, and guard 129 counts the doors: `S.beltOpen`
  cannot go false anywhere else. The mock's buckle skipped the staged exit
  entirely because it had its own door; that class of bug is now structural.
- **Guard section 129** — the paint order, the anchor, the state scoping, the
  close routing, the exit distance, the compensation. **`negtest370.sh`, 18
  fixtures.** Sections 96 and 128 grew for the close's new home and the drop's
  exceptions.

### Changed

- While dropped, the strip's segments and buckle are live controls again — a
  dropped belt is a working belt (F7). The peek band stays down; there is no
  state in which the sliver and a pouch share the screen (F14).
- A browser without CSS anchor positioning keeps Stage B whole: its parked tap
  is the calm scroll home. The drop is gated on support, because dropping
  pouches positioned against the page rather than the strip is the Next-up
  7.5px bug with a stage.

### Deferred

- Nothing of the belt design remains. The seven rounds, F1 through F14, have
  all shipped.

## [3.5.0] — 2026-08-09

**The Belt parks instead of leaving. Stage B of the belt-peek design — the
peek — and nothing else.** After one scroll the app used to stop saying which
of the three orderings you were in; now the strip slides up under the header
and parks with 12px of itself still showing — a dark rail with one lit chunk,
at left, middle or right. **Position encodes the path.** Tap it and the page
scrolls calmly home to the whole belt. `releases/plan-belt-release.md` (maintainer-local, not in this repository) is the
plan; `releases/design-belt-peek.md` holds the seven mock rounds it was built
from.

**Stage C — the drop, the belt that opens in place from anywhere — is
deliberately NOT here.** Guard 120 refuses the layout read its strip-measured
anchor was specified against, and moving a property out of that guard's
`REFUSED` list is an argument to be made on its own, not improvised
mid-build. Stage C becomes its own version, which is the release valve the
plan named on the day it was written. Before that argument is had, there is a
cheaper question: whether the pouches can be positioned from the strip in CSS,
with no layout read at all — in which case guard 120 never applies.

**No catalogue change. No saved progress touched.** MINOR, and it takes a tag
— `v3.5.0`, the sixth.

### Added

- **The peek.** The strip is `position:sticky`, parked at
  `calc(var(--hdrh) + var(--belt-peek) - var(--beltH))` — one peek below the
  header's border, which is F1's finding: the header is 71px including its
  border, not the 70 the group-header arithmetic used, and a peek built
  against 70 renders 11px tall.
- **The peek lights from `S.mode`, never from `S.path`.** `S.mode` is the
  ordering on screen right now — it moves with every Progress count, every
  deep link, every "Back to my path". `S.path` is the ordering you committed
  to. In the divergent state a peek lit from `S.path` would confidently name
  the wrong ordering for the list it is parked over, and that state is
  reachable at any time and persists. The segments' `aria-pressed` stays on
  `S.path` **on purpose**: pressed is what you picked, lit is where you are,
  and `viewWatch()` already states both in words. Guard 128 holds the two
  apart and its failure message says why.
- **While parked, the strip is not a control.** The mock's `elementFromPoint`
  across the parked band read four live buttons, 12px tall — the smallest
  touch target in the app wired to the most destructive-feeling action in it.
  Parked, the buttons go `visibility:hidden` — out of hit-testing, out of the
  focus order, out of the accessibility tree — and the strip itself is one
  handle: **tap = calm scroll home**, through the same reduced-motion check
  every other scroll uses. The wordmark remains the keyboard route to the top,
  as it has been since 1.x.
- **An open belt never parks (F14).** It scrolls away with its pouches —
  `position` on the strip carries exactly that one condition, and the staged
  close keeps the old anchor until the exit has played. There is no state in
  which a peek and a pouch are on screen together.
- **The parked flag comes from an `IntersectionObserver` on a 1px sentinel
  that travels with the belt** — never a scroll listener, and never a layout
  read, which section 120 refuses. The flag lives on `<html>`, outside
  `#view`, because `render()` replaces `#view` on every tick. The flip lands
  a few dozen pixels after sticky engages — the honest price of measuring
  nothing.
- **The peek's entrance is a 200ms slide from behind the header, authored as
  a transition — deliberately.** The reduced-motion block cuts transitions;
  an `@keyframes` entrance would slip it. And `*{transition:none}` does not
  match pseudo-elements, so the block now names them:
  `*,::before,::after`. Guard 128 asserts the mechanism, not the motion.
- **Guard section 128** — the peek's variable, the one position condition,
  the offset derivation, the entrance's mechanism, the `--hdr` relationship,
  the inert handle, the observer. **`negtest360.sh`, 24 fixtures**, three of
  them conversions of the v2 mock's own defect toggles.

### Changed

- **Header opacity `.9` → `.96` — in both themes.** F2: the parked belt's
  labels sat frozen behind the blur and ghosted through it; content that
  scrolls under is meant to ghost, a control that parks is not. The darker
  theme shipped at `.92` and was never in the mock — the owner's rule is the
  general one: if the default moves, Darker moves with it. **Guard 128 pins
  the relationship, not the literals** — the two `--hdr` alphas must agree,
  so the next honest adjustment moves both or goes red.
- **One source for every offset the header casts.** `--hdrh` (border
  included) is declared once in `:root`, `--ghtop` derives from it plus
  `--belt-peek`, the belt's parked top derives from all three, and the
  storage-blocked JS override now writes `--hdrh` rather than `--ghtop` — so
  the fallback and the override describe the same box through the same
  variable. Pinned era headers park exactly one peek lower (F3), and no call
  site carries its own fallback constant any more.
- The belt renders behind a 1px sentinel on all five of its surfaces; smoke's
  "opens with the belt" and "controls come first" now mean both elements, in
  order, and the CSS sweep stages the parked state the way it stages
  `data-theme`.

### Deferred

- **Stage C, whole** — the drop, the strip-measured anchor, the staged
  retraction, F9's three planes, F13's one seam, and section 96's growth for
  all of it. With Stage C, not around it.
- The guard-120 amendment (or the CSS answer that makes it unnecessary), same
  reason.

## [3.4.5] — 2026-08-09

**The deep-QA round, and one of the six should never have been allowed to
ship.** An independent adversarial review of the 3.4.4 tree — three tracks
beyond the harness, every claimed defect reproduced in jsdom or Chromium before
it was written down — returned one HIGH, two MEDIUM and three LOW. **All of them
are fixed here.** `qa/deep-qa-3.4.4-2026-08-09.md`.

**No catalogue change. No saved progress touched, and nothing anyone has ticked
moves.** Everything below is the storage layer, the a11y tree, or a guard.

The review also went looking in the places this release series has been changing
fastest — the targeted-update paths added across 3.4.x — and **found them
clean**: every patched state is byte-identical to a full render of the same
state, across modes, filters, active search and group completion. That is
recorded here because it is the load-bearing property of the whole architecture
and it now has an audit behind it rather than an argument.

### Fixed

- **A JSON backup could poison the saved path and break every later boot.**
  `isPath()` was `return !!PATHCODE[id]` — a lookup that reads the prototype
  chain. **A restored backup carrying `"path":"__proto__"` passed it**, set
  `S.path` and `S.mode`, and threw inside `noteFor()` *after* the state had
  mutated and *before* the render finished. **The debounced write scheduled a
  moment earlier fired anyway and put the poison in storage.**

  **From then on the app threw on every boot** — the static pre-render shell,
  no progress visible, Home and Path throwing on every tap — and the only
  recovery was clearing site data, **which is exactly the progress loss the
  backup feature exists to prevent.** Reproduced end to end, twice,
  independently.

  The lookup now asks whether the key is `PATHCODE`'s own and whether what it
  finds is the string a path code is. `BYID` is null-prototype for the same
  reason one step downstream. **Only the JSON route was ever exposed** —
  `importCode()` constrains the path to `c`/`l`/`r`. Guard 126, and the
  `NOTES.md` note under `res` had predicted the shape of this two releases
  early.

- **A rejected read left saving switched on, and the next write overwrote
  everything.** In `restore()`, the async backend's rejection path called
  `finish(null)` without clearing `canSave`, unlike the synchronous throw three
  lines below it. **The app booted empty, stayed willing to save, and the first
  tick wrote a one-entry payload over the reader's whole saved state.** Only the
  host-app backend can fail that way — which is precisely the embedded context
  that backend exists for. **A read that failed means the stored state is
  unknown, so the writes now stop for the session.**

- **A corrupted payload could kill marking until a reset.** `S.watched =
  o.watched || {}` accepted any truthy value, so a stored `"watched":"oops"`
  made every `toggleWatched()` throw. `groupOpen` and `progOpen` five lines down
  had had the right `typeof` check for releases; **the three containers holding
  the actual progress did not.** They do now, and restored ratings go through
  the clamp — a stored `9` used to survive into `S.rated`.

- **One transient write failure used to latch saving off for the session.** Both
  catch paths set `canSave = false` and nothing ever cleared it: after a single
  quota-style throw, a healthy store was never tried again and **everything
  after the blip was lost on close.** The banner was honest, which is why this
  is a LOW rather than worse. **It clears itself now when a write lands** — a
  blip is a blip. Guard 127 holds this and the rejected-read fix apart, on
  purpose: they are opposite facts and fixing them the same way would undo one
  of them.

- **A log entry with `ts:null` dated itself 1970.** `isFinite(null)` is true, so
  the entry became epoch 0 and sorted to the front of Activity.

- **The "Restored N" toast counted names it had not restored.** `BYID` was a
  plain object literal, so `BYID["constructor"]` answered truthy and inherited
  names were counted as found — the apply loops then correctly dropped them.

- **A malformed `#nw=%` left junk in the address bar and said nothing.**
  `decodeURIComponent` threw inside the swallowing `try`, so there was no offer
  and no cleanup. **`#nw=garbage` was already handled cleanly**; the two behave
  the same way now.

- **`revealHero()` mutated saved state without saving it.** The one
  state-mutating site in the app that did not write. Self-healing on reload,
  which is why it lasted.

### Accessibility

- **Progress was the only tab with an axe violation.** Its four headings were
  `h3` under the wordmark's `h1` with no `h2` anywhere between them —
  `heading-order`, moderate. **All four go up one level**; Home, The Path and
  Next up already ran `h1` → `h2`. Nothing changes visually: the fold heading
  takes `font:inherit` and the card titles were fully specified already.

- **`ratingBadge()` put an `aria-label` on a bare `<span>`**, which ARIA
  prohibits on generics and screen readers ignore — the certificate was
  announced as its bare letter or not at all. It carries `role="img"` now. The
  `.stars` case was already correct; it has `role="group"`.

- **A keyboard user pressing the detail panel's Mark watched landed back on the
  row's small tick.** The focus snapshot keyed on `{data-act, data-id}` and a
  row holds **two** buttons matching `[data-act="watched"][data-id=…]`. Both
  restores were right about which element had focus; **the key could not tell
  the two apart.** The detail button carries `data-src="detail"` and both
  snapshots read it.

### Added

- **Guard sections 126 and 127**, and `qa/negative/negtest350.sh` — 21 fixtures
  that put each old shape back one at a time and require the new sections to go
  red for it. **Fixtures matter more than usual here:** every one of these
  guards was written with the defect already in front of it, and a guard written
  that way will pass on a fixed tree while asserting nothing.

### Recorded, not fixed

- **`NOTES.md` now says what the additive cross-tab merge costs.** Writes are
  whole-payload last-writer-wins, so **"Clear all progress" is silently false
  with a second tab open** — the stale tab's next write puts everything back.
  The same bias means a tab that merges a foreign tick and is never touched
  again leaves that tick out of storage. **Both follow from the deliberate
  anti-loss decision and neither is a defect in the merge**; the reset one is
  worth knowing because the app says "Progress cleared" and means it about this
  tab only.

## [3.4.4] — 2026-08-08

**Corrective, and it is one finding reaching the tree.** **C0 — recorded here
since 3.3.1 as an injection by Cloudflare's edge — was a TLS-intercepting VPN on
the author's own machine.** The origin serves what this repository ships, plus
nothing. `ops/c0-edge-injection.md` (maintainer-local, not in this repository).

Nothing in the app's logic changed. No catalogue change. No saved progress
touched.

### Fixed

- **The README told readers something untrue about Cloudflare, and it shipped
  for two days.** The Non-goals bullet read: *"The apex is served through
  Cloudflare, and Cloudflare's edge injects a script of its own — not in this
  file, not ours, and not removable from here."* **It does not.** Read with the
  interception switched off on 8 August, the served page carries **two
  `<script>` tags, no injected third, and the Content-Security-Policy in this
  file — ten directives, one `sha256`.**

  **So the two hedges added in 3.3.1 come out.** *"No third-party code **in this
  repository**"* → **"No third-party code."** *"every line **in this repository**
  is written for this project"* → **"every line is written for this project."**
  **The unqualified claim is true of what a visitor receives**, which is what it
  always said and what was doubted for the wrong reason.

- **Guard 43's `connect-src` refusal rested on the same misreading, and the
  refusal is kept anyway.** `3.3.1` removed `connect-src 'none'` because *"the
  edge appends `'self'` to it, so the directive shipped, looked like protection,
  and provided none."* **The edge appends nothing.**

  **The removal stands on the half of the reasoning that was never about the
  edge:** `default-src 'none'` is the first directive in the policy, the page
  opens no connections of any kind, and a directive that restates its own
  fallback is a second copy of one rule. **What changes is that restoring it is
  a live option again — costing nothing, gaining nothing — rather than an
  impossibility.** The comment says so, so the next person argues redundancy
  instead of inheriting a fact that was never true.

- **Two `3.3.1` CHANGELOG entries corrected in place**, struck rather than
  rewritten, per house rule.

- **Three CSS attribute selectors escaped quotes and not backslashes.**
  `docs/index.html` builds selectors with `.replace(/"/g, '\\"')` at three
  sites — the group lookup in `rowUpdate`, and the focus restores in
  `tickUpdate` and `render()`. **A value containing a backslash breaks the
  selector.** Every value that reaches them comes from the frozen catalogue IDs,
  **so there was no reachable defect** — but all three now escape the backslash
  first. Found by CodeQL, which is the first instrument that has ever read the
  shipped script this way.

### Removed

- **`.tmp/` from `.gitignore`.** Nothing in the repository creates a `.tmp/`
  directory — the negative suite uses `mktemp -d` and `qa/make-share-card.mjs`
  uses `os.tmpdir()`. Boilerplate that came with the file.

  **It is here rather than in a commit of its own for a reason worth writing
  down:** it *was* removed by hand on 8 August, and the `3.4.3` upload put it
  back fourteen seconds later, because `.gitignore` ships inside the release
  archive. **A hand edit to any tracked file is undone by the next release, and
  no guard can report it** — the tree ends up exactly what the archive said it
  should be.

### Why PATCH

Two README phrases, one guard comment, two CHANGELOG corrections, three
backslash escapes and one dead ignore line. No behaviour change, no catalogue
change, nothing touching saved progress. **The belt is `3.5.0` and is not in
here.**

## [3.4.3] — 2026-08-08

**Corrective.** Nothing in the app's logic changed, nothing in the catalogue
moved, and one response header value is different. **Everything here is the
repair of something this project told itself.**

Scoped from `qa/sweep-repo-page-dns-2026-08-08.md` (maintainer-local, not in this repository), which read the repository,
the panels, the wire and both DNS zones.

### Fixed

- **A Response Header Transform Rule was overriding this project's own
  `_headers`, and three places in the tree said that was impossible.** An active
  Cloudflare rule named *"Security headers"*, matching all incoming requests,
  had been setting `Permissions-Policy`, `Referrer-Policy` and
  `X-Frame-Options` at the edge. **For the whole of 3.4.2 the wire served the
  rule's `Permissions-Policy`, not the one this repository ships** — and guard
  104 was green the entire time, correctly, because it reads the file and the
  file was right.

  **The 4 August finding that produced the wrong claim is the interesting part.**
  A rule was created in the dashboard, showed *Active*, and set nothing —
  verified against a HIT, a MISS and a 404. **A rule that sets nothing is not
  evidence about rules that do.** An instrument used to rule something out has
  to be able to see it.

  The claim is struck in `docs/_headers`, in section 104's comment and in
  section 104's COOP note, **superseded rather than deleted**, because how a
  wrong conclusion was reached is the part worth keeping. **The rule is deleted;
  `_headers` is the only source.** Nothing guards that it stays deleted — no
  guard can read a panel, and one that pretended to would be worse than an
  honest gap — so the wire check lives in the release checklist.

- **`usb=()` is back in `Permissions-Policy`, and section 104 stops refusing
  it.** 3.4.2 removed the token on a console warning from a **scanner's own
  browser engine**, recorded as *"not a registered Permissions-Policy
  feature"*. It is one: `usb` is the policy-controlled feature for WebUSB,
  Chrome accepts it, and the live response carried `usb=()` while Chrome's
  console stayed silent through three loads.

  **For one release a guard forbade putting back a legitimate header value** —
  a guard blocking the correct state, which is worse than the noise it was
  written to stop. `DEAD104` is down to one entry. **`interest-cohort` stays
  refused:** FLoC was withdrawn and that token really is dead.

- **`wrangler.jsonc` still argued for the GitHub Pages mirror**, two releases
  after 3.3.1 retired it and while `README.md` said the opposite and was right.
  **On 8 August it got read**: Pages was republished, a `docs/CNAME` appeared,
  and the old origin became first a permanent 301 and then a second live origin
  serving this same tree. Guard 82 caught the file the moment it landed; nothing
  in this repository can see a panel. **A stale comment is not a tidiness
  problem — it is an argument, sitting in the tree, for doing the thing the
  project decided not to do.**

### Changed

- **`negtest340` loses its `usb` fixture** — a fixture aimed at a rule that no
  longer exists passes forever while testing nothing. Its `interest-cohort`
  sibling keeps its rule and keeps its fixture, **with its anchor moved**,
  because the policy line it mutates now ends in `usb=()` and the old literal
  would have matched nothing. **A mutation that changes nothing is a negative
  test that proves nothing.** `README.md`'s count moves with it: **534 → 533**.

- **Section 104 is retitled** from *"the security headers the edge cannot set"*
  to *"the security headers the tree owns"*. The old title was a claim about
  capability and the claim was false; the new one is the decision, which is
  what survived being checked.

### Why PATCH

One header token restored, one guard's refusal list shortened by one, one
negative fixture removed, four comments corrected and one count updated. No
catalogue change, no behaviour change, nothing touching saved progress.

## [3.4.2] — 2026-08-07

Headers, robots and four preloads. Nothing in the app's logic changed.

Scoped from an independent Cloudflare Radar scan of the live `3.4.1` build.
**Three of that report's eighteen items are not done here, and its
top-priority one is refused** — the reasoning is in
`qa/scan-triage-2026-08-07.md` (maintainer-local, not in this repository).

### Fixed

- ~~**`Permissions-Policy` declared two tokens that do not exist.** `usb` is not
  a registered feature, and Chrome logged *"Unrecognized feature: 'usb'"* on
  **every page load** — the only console output the app produced.~~
  `interest-cohort` was the FLoC opt-out, and FLoC was withdrawn, so the policy
  was stating an opinion about a feature no browser has. ~~The scan found the
  first; the second was found while fixing it. Both are gone~~, and section 104
  now refuses them by name rather than pinning the policy as a whole string, so
  the policy can still grow.

  > **CORRECTED IN 3.4.3 — the struck half of this entry is wrong.** `usb` **is**
  > a registered Permissions-Policy feature: it is the policy-controlled feature
  > for WebUSB, and Chrome accepts it. The *"Unrecognized feature"* warning came
  > from the **scanner's own browser engine**, not from Chrome — the live
  > response carried `usb=()` while Chrome's console stayed silent through three
  > loads. **`usb=()` is restored in 3.4.3, and section 104 no longer refuses
  > it.** `interest-cohort` is correct as written and stays refused.

- **`icon.svg` and `favicon.ico` were served `max-age=0`** and revalidated on
  every visit — two conditional requests per visit, forever, for files that do
  not change. Both now carry `public, max-age=86400`.

  **A day rather than a year, and the filenames are untouched.** A year with
  `immutable` is only honest behind a content-hashed name, and renaming the
  favicon is the one change forbidden before 19 September: *unstable or
  frequently changed* is a listed Google cause of favicon non-appearance, and
  this icon already changed twice in three days.

### Added

- **The four IBM Plex faces are preloaded.** They were discovered only after
  the inline CSS was parsed: the browser knew about them at ~293 ms and did not
  request them until **467–501 ms**, then spent 213–239 ms on each. That stall
  is the entire 141 ms between `domContentLoaded` (396 ms) and `domComplete`
  (537 ms). Limelight and Anton already carried preloads and went out at
  287–293 ms, which is the control.

  **Section 124 asserts set equality between `@font-face` sources and preload
  tags**, so it fails in both directions — a new face without a preload, and a
  preload for a face nothing uses — and it checks `crossorigin` and `as="font"`
  on each, because a font preload missing either downloads the file twice.

- **`Cross-Origin-Resource-Policy: same-origin`**, beside the existing COOP.

- **`Link:` response headers** carrying `rel="sitemap"` and `rel="canonical"`.
  In `_headers`, ~~never a Transform Rule — those do not apply to Worker
  responses, verified here against a HIT, a MISS and a 404~~. No
  `rel="api-catalog"`: advertising a 404 is worse than advertising nothing.

  > **CORRECTED IN 3.4.3.** Transform Rules **do** apply to Worker responses and
  > they **win**. The 4 August test that "verified" otherwise was run against a
  > rule that set nothing — which proves nothing about rules that do. An active
  > rule named *"Security headers"* was overriding this release's
  > `Permissions-Policy` on the wire for the whole of 3.4.2. **The rule is
  > deleted in 3.4.3; `_headers` is the only source now**, and it stays the
  > source because a file can be diffed and guarded and a panel cannot.

- **A `Content-Signal` line in `robots.txt`** — `ai-train=no, search=yes,
  ai-input=yes`. Three separate permissions: training, search indexing, and
  live use as input to an AI answer. **Search and citation are yes because a
  spoiler-free watch order is only worth writing if it can be found and cited;
  training is no because the catalogue is the work.**

  **Section 125 does not pin the values.** They are a position, they are the
  owner's to change, and a guard that fails when the owner changes their mind
  is a guard that gets deleted. It pins that the line exists, names all three
  signals, and gives each a value the spec allows — because a typo in
  `robots.txt` is invisible: no build breaks, no page changes, and every
  crawler simply ignores the directive.

### Removed

- **The `Offer` node from the JSON-LD.** `offers: {price: "0"}` is a
  legitimate way to say *free*, and it was also the single line that made the
  scan record a commerce signal on a site it had itself classified
  `isCommerce: false`. `isAccessibleForFree: true` was already on the same node
  saying the same thing in quieter vocabulary. The shape is now refused rather
  than merely deleted, because stray `Offer` markup can produce misleading rich
  results.

### What the scan asked for and did not get

- **A `Content-Security-Policy` header.** The report rates its absence **P0**
  and calls it the largest header gap. **The site has a CSP** — it is a
  `<meta http-equiv>` tag, which a response-header scan structurally cannot
  see. **And the policy it proposed is weaker than the one shipping:**
  `script-src 'self' 'unsafe-inline'` against a single `sha256` and nothing
  else. Adopting it would admit every inline script on the page; guard 43,
  guard 10 and `browser-check.mjs` would all reject it anyway.

- **HSTS `preload`.** Declined permanently. The report asks for it and concedes
  two pages later that submission is difficult to reverse.

- **DNSSEC "in a single toggle".** It is not one, while DNS is at Cloudflare
  and the registrar is GoDaddy: the `DS` is hand-carried between two panels and
  a wrong one takes the domain dark for every validating resolver. Dated after
  the 29 September transfer.

- **Markdown content negotiation.** ~~The sketch needs a Worker script and this
  deployment is assets-only.~~ The cheap version already exists and the scanner
  did not look for it: `llms.txt` and `orders.txt` are served, machine-readable
  and written for that audience.

  > **RE-TESTED 8 AUG 2026, and the struck premise has expired** — Cloudflare's
  > *Markdown for Agents* is a platform toggle needing no Worker. **It is still
  > declined, on three new grounds:** it is a Pro-and-up feature and this zone is
  > free; it converts the **origin's HTML**, not a rendered page, so on a site
  > whose catalogue lives in the inline script it would return the `<noscript>`
  > block; and `orders.txt` already does the job better, from the data, guarded.
  > A retirement lapses when a premise disappears — this one did, so it was
  > re-tested rather than restated. `qa/agent-readiness-triage-2026-08-08.md`.

### Why PATCH

Two response headers added, one corrected, two cache rules, four `<link>` tags,
one line of `robots.txt`, one JSON-LD property removed. No catalogue change, no
behaviour change, nothing touching saved progress.

## [3.4.1] — 2026-08-07

The tick stops collapsing the group under you. 3.4.0 fixed the branch almost
nobody is in.

### Fixed

- **Ticking a row no longer drops the group out from under the page.**
  `tickUpdate()` has two branches. A filter chip or a search sends the tick
  through `render()` — the function 3.4.0 fixed, and it is correct there. **No
  filter and no search — the state the app opens in — rebuilt the whole group
  through `groupBlock()` and swapped the element in.** The replacement is a
  brand-new node, so `content-visibility: auto` has no remembered size for it
  and `contain-intrinsic-size: auto 64px` is what renders. Measured at 390×844
  in the click's own task: **the ticked group falls 3418px → 66px and the
  document loses 3352px.** In *Bruce's life*, where a group is an era rather
  than a universe, that is the whole screen — which is where it was reported.

  **The fix is smaller than the thing it replaces, and both halves already
  existed.** With `filter: all` and no query, `groupBlock`'s seven filter
  clauses all fall through and `matches()` returns true, so **the row set cannot
  change**. A tick can change exactly three things: the row, the `n of m` in the
  group head, and the head's progress bar. The row now goes through `filmRow()`
  — `.film` carries no `content-visibility` and cannot collapse — and the other
  two are written in place, the way `groupUpdate()` has always done it.
  **Nothing outside the full render builds a `.group` any more**, which retires
  the class rather than this instance of it.

  `qa/soak-3.4.0-tick-jump.md`.

### Changed

- **`gDone()`, `gSub()` and `gPct()` — one source for a group's tally.**
  `groupBlock()` computed it inline. Now that two call sites need the same two
  strings, they come from the same three functions, so the count under your
  thumb and the count after a full redraw cannot disagree. The smoke gate still
  has the last word: after every driven tick, a forced full render must
  serialize byte-for-byte identical.

- **Section 103 is rewritten rather than extended, because the shape it held
  was the defect.** It required `tickUpdate()` to rebuild through
  `groupBlock()` and `replaceChild` the group. It now **refuses** `groupBlock`
  inside `tickUpdate`, requires `filmRow`, `gSub` and `gPct`, and asserts that
  `class="group"` is constructed in exactly one place in the file. The
  superseded reasoning is struck in place above the new, not deleted.

### Why nothing caught this

**The check written for this defect could not see it.** 3.4.0 added a browser
drive that clicks a real tick, and it asserts on `window.scrollY` — which reads
**8780 → 8780** across the collapse. The offset does not move; the content under
it does. It also ran only `filter ess` and `filter core`, and **both of those
take the fallback branch on `tickUpdate`'s first line.** The default state had
never been driven at all.

Both halves are fixed. The drive now measures **the ticked group's own height**
across the click, and a third case runs **`filter: all` in `life`** — the
combination nothing in this harness had ever exercised.

### Why PATCH

One function rewritten to do less, three helpers extracted from code that
already existed, one guard section re-aimed. No catalogue change, no new
surface, nothing touching saved progress.

## [3.4.0] — 2026-08-07

**Marking something watched stopped losing your place.** The owner found it on a
phone, soaking 3.3.2: with a filter chip active, ticking a row re-rendered and
sent the page back near the top. It was reported as *"it reloads instead of
staying"*, and it was not a reload — it was the scroll restore failing.

**It reached further than the tick.** `render()` restores the scroll for every
caller that depends on it holding position: the filter chips, the peek, the
belt, the backup-code panel, the theme buttons. The tick is only where a person
met it first.

**No `i:` slug changed. Nothing anyone has ticked has moved.** The catalogue is
200 entries before and after, and nothing in it was touched.

### Fixed

- **`render()`'s scroll restore no longer clamps.** `.group` carries
  `content-visibility: auto`, which lets the browser skip layout for off-screen
  groups. In the same task as the repaint, every off-screen group therefore
  measures its `contain-intrinsic-size` rather than its real height, the
  document is about a third as tall as it is about to be, and `window.scrollTo`
  clamps to that shorter maximum. Measured **2233 → 1011** at 390×844 with the
  row count and the final document height both unchanged, which is what rules
  out any explanation involving the content. The restore now happens with a
  `.settling` class on `#view` that drops `content-visibility` to `visible` for
  that one frame, so the scroll lands against the true height; the class comes
  off on the next frame. **`content-visibility: auto` stays** — it is
  load-bearing for the Performance score, which measures load, and the cost here
  is one layout on renders that restore a scroll.
- **Marking watched or skipping inside an open row no longer throws focus to the
  page.** `tickUpdate` restored focus by looking for `[data-act="watched"]`, and
  `querySelector` returns the row's own tick — the first match. So the button
  that had actually been pressed was destroyed with focus on it and focus fell
  to `<body>`. **Three of the four controls**, measured at 390×844; only the
  bare tick survived. It now remembers which control held focus, the way
  `render()` already did, and returns it there. Stars are told apart by
  `data-n`.
- **`tickUpdate` restores focus with `preventScroll`.** It was the one
  button-focus restore in the app without it — `rowUpdate` and `render()` both
  passed it. It was never observed to move the viewport, which is exactly why it
  was worth closing: an assertion-free difference between three sites doing the
  same job is a coin that has not landed yet.

### Added

- **`docs/3e6082eed9f040d5bc8ab07531bf58b9.txt` — the IndexNow key.** A search
  engine fetches it to confirm this host controls the key a submission is signed
  with. One submission is shared across every IndexNow-enabled engine — Amazon,
  Bing, Naver, Seznam, Yandex, Yep — which makes announcing a release one call
  rather than six. **Google does not participate**, so this does not touch the
  site's main search surface. The file is out of the offline shell for the
  reason `llms.txt` and `orders.txt` are: it is written for machines that never
  run the app.
- **Two guard sections.** **122** fails the build if the scroll restore goes
  back to a bare `window.scrollTo`, if `.settling` stops being added before the
  scroll, if it is never removed, or if the CSS rule behind it disappears.
  **123** fails if any button-focus restore drops `preventScroll`, or if
  `tickUpdate` goes back to looking for `[data-act="watched"]`.
- **`browser-check.mjs` clicks a tick.** It never had. It set `S.watched`
  directly and called `render()`, which is why five green drives said nothing
  about either defect in this release.

### Why nothing caught either of these

Section 103 asserts what `tickUpdate` **calls** — that both toggles route
through it, that the fallback condition is intact, that it rebuilds through
`groupBlock()` and `renderHead()`. Every one of those was true throughout, and
stays true now. The smoke gate compares a targeted repaint against a full render
serialized byte-for-byte, and **a gate that reads markup cannot see a scroll
position or an `activeElement`.** `browser-check.mjs` drove jumps and never
clicked a tick.

**Three instruments, one hole, and a person on a phone.** The same shape as
3.3.2's jump, where the check that should have caught the defect was asking a
question the defect could satisfy. Sections 122 and 123 and the new browser
check are the part of this release that stops it being found this way a third
time.

## [3.3.3] — 2026-08-07

**Era 7 was named after a building and tested on a man.** 1.7.2 split the old
62-entry era 7 on one checkable line — is a Robin or a Batgirl on screen as his
working partner — and then named the residue *The Watchtower years*, which is a
roster. `catalogue/refile-findings.md` (maintainer-local, not in this repository) finding 5 has been open since: the name
describes an institution while the test measures whether anyone is beside him.
This release fixes the name, moves one entry that was flagged as having no
Batman in it while a Bruce is on screen in it, puts *Birds of Prey* into
continuity order, and writes down the `out:` rule the project actually runs.

**No `i:` slug changed. Nothing anyone has ticked has moved.** The catalogue is
200 entries before and after.

### Changed

- **Era 7 is now *No one in the car*.** Was *The Watchtower years*. The note
  goes with it: "The League is an institution now — a roster of dozens — and he
  works it alone. No partner beside him, which is the one thing every entry here
  shares." *A partner in the car* is already the app's idiom — eras 3, 4 and 6
  all use it — so the headings now read down as a life rather than as a filing
  scheme: **The Grayson years** (a partner in the car) → **Rebuilding** (a later
  partner in the car) → **The League years** (still a partner in the car) →
  **No one in the car** (nobody). **Two strings.** No `e:` value changed, no
  entry moved, the era scheme is still eleven stages plus era 0, and section 86
  — which refuses a twelfth era by name — stays green. **A further split of
  era 7 remains refused**; this is the half section 86 does not address, because
  it refuses on size and the defect was in the definition.
- **`README.md`'s era list carries the new name.** Section 14's second clause
  checks that list against `ERAS` in both directions — omissions and strays —
  and it went red on both until swept.
- **The crawlable seed carries the new name and note.** `<h2>The eras of Bruce's
  life</h2>` renders all eleven from `ERAS`, so this is the surface a crawler
  that runs no JavaScript reads, and it re-indexes on the next crawl rather than
  on a deploy.
- ***Birds of Prey* (2020) moves to continuity order in the DCEU.** It sat third
  in the block, **before *Justice League* (2017), which it postdates**, placed
  there as *Suicide Squad*'s direct sequel. **Both orderings move, because both
  claim story order:** the array is the by-universe order and `lo:` is the life
  order. *Justice League* 4 → 3 and `lo:` 47 → 46; *Zack Snyder's Justice
  League* 5 → 4 and `lo:` 48 → 47; *Birds of Prey* 3 → 5 and `lo:` 46 → 48. The
  two cuts of *Justice League* stay adjacent — one story, two versions. Era 7
  stays at 48 entries, positions 1..48, no gaps and no ties.
- **`harley-quinn-valentines-special-2023` moves from era 0 to era 8**, at
  `lo:25`, between *Harley Quinn* seasons 3 and 4. It carried `out:"none"` —
  *no Batman in it at all* — and **Bruce Wayne is on screen in it**, without a
  line, taking bat-shaped chocolates from Selina Kyle. Three independent anchors
  put it where it now sits: Max files it as season 3, episode 11; its continuity
  is already placed at era 8; and Bruce's state in it falls between the two
  seasons. `e:0` and `out:"none"` are both removed, because **guard 70 fails a
  placed entry that still claims a reason for having none.** Era 8's `lo:`
  25–29 renumber to 26–30 — season 4, *Kite Man: Hell Yeah!*, season 5, *Merry
  Little Batman*, *Bat-Fam* — because section 68 requires 1..n with no gaps.
  **Era 0 goes 16 → 15, era 8 goes 29 → 30, the catalogue stays at 200**, and no
  README count moves.
- **The Valentine's special's description is rewritten.** It said *"Batman gets
  the holiday off"*, which is false, and was also the entry's stated reason for
  being outside the timeline.
- **Clayface's description stops asserting a Batman-less Gotham.** It read
  *"Gotham with no Batman in it yet."* Gunn has said the film sits before
  *Superman* (2025); he has said nothing about whether Gotham has a Batman then,
  and *Creature Commandos* — also before *Superman* — shows one already
  operating in a flashback. **The film has no Batman in it; the city may well
  have one**, and the entry now says only what is established.
- **Robot Chicken DC Comics Special III's description gains its reason.** It was
  the only era-0 entry whose copy did not say why it is outside. `out:"many"` is
  exact and earned: the Cosmic Treadmill sketch puts **Adam West's 1960s Batman
  on screen beside the modern one**, credited as *"Adam West as 60's Batman"* —
  which is what separates it from Specials I and II, both at era 6 on one
  Batman each.
- **`docs/orders.txt`, the JSON-LD `ItemList` and the crawlable seed are
  re-blessed** against the moved data, and the CSP script hash with them.
- **`sitemap.xml` `lastmod`, the JSON-LD `dateModified` and `BUILT`** move to
  2026-08-07 together, as section 67 requires.

### Documentation

- **The operative `out:` rule is written down, in both places that state it.**
  `NOTES.md` gave the reason table and guard 70's comment paraphrased it, and
  read literally — *"no Batman in it at all"* — the path breaks it three times
  on purpose: *Joker: Folie à Deux* (era 1), *Birds of Prey* (era 7) and *Kite
  Man: Hell Yeah!* (era 8) each have no Batman in them and a place anyway.
  **What is actually run is narrower: an entry follows its continuity, and
  `out:` applies when the entry has no place *and* its continuity cannot lend it
  one.** That is why *Teen Titans: Trouble in Tokyo* left era 0 in 1.7.1 — it is
  the finale of a series already in era 3 — and it is the test the Valentine's
  special failed on both counts. **This was the gap the outside audit walked
  into**, and the two statements are now one statement rather than two claims.
- **Guard 70's comment stops naming a number.** It said *"fourteen entries"*;
  there were sixteen, and fifteen after this release. The count in the code is
  computed and printed by `note()`; the count in the prose beside it was two
  releases stale. Same shape as section 120's note, which 3.3.2 corrected.

## [3.3.2] — 2026-08-06

**A jump that never moved the page.** Reported from Home during 3.3.1's soak,
reproduced in a real browser from the Progress donut too — which is one of the
four ways in that `record-3.0.0.md` verified with twelve green checks. One
argument caused it, and the instrument that should have caught it was holding a
ruler with no marks on it.

### Fixed

- **`goToGroup()` scrolls instantly.** It asked for
  `scrollIntoView({block:"start", behavior:calmScroll()})`, and `calmScroll()`
  returns `"smooth"` for anyone who has not asked for reduced motion. **A smooth
  scroll across a `content-visibility: auto` list races the browser's own
  rendering:** the animation's target offset is computed against a layout in
  which every off-screen group is skipped, and the document grows underneath it
  as it travels. Measured on live 3.3.1, same element and same session —
  **instant scrolled to 973, smooth ended at 0.** `goToGroup()` also calls
  `window.scrollTo(0, 0)` and `render()` in the same frame, so the animation
  began by racing a jump to the top. **A jump is a navigation, not an
  animation.** `calmScroll()` stays; it has another caller and section 96's
  reduced-motion clauses are untouched. The reason lives in `NOTES.md`, under
  `target`, because explanations do not go in the file a reader downloads.

### Changed

- **`qa/browser-check.mjs` learns what "in view" means, and the negative test
  changed the design.** The old assertion read `top > -2 && top < 844` — 844 is
  the whole viewport, so **a jump that never scrolled passed** whenever the
  target fell inside the first fold. It did: the donut's group sits ~434px down
  the document. Three assertions replace it — the page moved, it moved **in the
  click's own task**, and the head parked at the sticky wrapper's own offset,
  read from the page rather than assumed. **The same-task one is the only one
  that survived being negative-tested.** Serving this tree with
  `behavior:"smooth"` restored left every settled assertion green: headless
  Chromium animates 0 → 435 in about 360 ms and lands exactly, because a local
  copy under a headless renderer does not reproduce the race. Read in the
  click's own task it is unambiguous — instant is already at 435, smooth is
  still at 0 — and all five drives go red.
- **A fifth way in.** Home's universe grid is now driven too. It was never one
  of the four, which is why the one entry point nothing drove is the one a
  person had to find.
- **Section 76 gains the tree-side hold**, which runs on every push: the build
  fails if a scroll behavior comes back to `goToGroup()`, and fails if the jump
  stops scrolling at all. **Negative fixtures 511 → 513**, one for each.
- **Section 120's `pageYOffset` reason is corrected.** It said the 3.3.0 hoist
  "removed the 106.6ms desktop forced reflow". **PageSpeed against live 3.3.1
  measures 46 ms at that exact line**, down from 64.1 ms mobile before the
  hoist — a cut, not an end. The residue is inherent: `render()` is called after
  other code has written in the same task, so its first line forces a layout
  wherever it sits. **The count stays 1 and only the prose was wrong**, which is
  the same failure as the three guards 3.3.1 inverted, wearing prose instead of
  code. Not worth chasing — TBT is 0 ms and Performance is 100.
  `qa/pagespeed-3.3.1.md`.
- **The browser check stopped claiming `connect-src 'none' held`** in its green
  line, one release after 3.3.1 removed that directive for never having taken
  effect.

### Changed — the harness, pushed ahead of this release

*These went to the repository on 6 August as QA-only work, with no version bump
because nothing in `docs/` had moved. 3.3.2 is the release that carries them, so
they are recorded here rather than left in an `[Unreleased]` heading that would
outlive them.*

- **`idHash` is memoised inside the guard sandbox, and the memo proves its own
  assumption.** Profiled with `--cpu-prof`: `idHash` was **34% of `guards.js`'s
  entire runtime** — 147.9 ms of 432 — for 201 distinct answers. It was being
  called **24,339 times**, because `importCode()` rebuilds its whole
  `{hash: id}` map on every call and section 3's truncation sweep walks a backup
  code down one character at a time, calling `importCode` about 117 times.
  117 × 201 is the number the profiler saw.

  **Nothing was wrong.** That is the app's own function, extracted and driven
  honestly, being asked the same pure question twenty-four thousand times. The
  memo wraps the **extracted** function — still `idHash` out of `index.html`,
  still never reimplemented, only asked less. **390 ms → 260 ms, output
  byte-identical, all 121 sections pass.**

  It multiplies: roughly 500 guards-running fixtures in the negative suite, at
  ~130 ms each saved.

  **The memo is sound only while `idHash` is pure, so that is checked rather
  than assumed** — every id is hashed through the real function twice and the
  memo once, and a disagreement fails the build. `negtest300` gives the function
  state exactly as a careless edit would and proves the check fires; without it
  this would be the one `fail()` in the file that nothing has ever made fire.

- **A generated sweep over `importCode()`, inside section 8.** Every fixture in
  sections 7 and 8 is a hand-written mutation of one code, and the truncation
  sweep is already a property test over exactly one axis — which is the argument
  for generating the others. **240 codes from a seeded LCG**, no `Math.random()`:
  a generator that finds a defect on one run and not the next is a rumour, and a
  red build here has to be reproducible. The seed is printed with any failure.

  **The invariant is narrow and total: `importCode()` must never throw, and must
  never return an id the catalogue does not contain.** Restoring *less* than was
  written stays allowed — that is the forward tolerance sections 7 and 8 exist to
  protect. Restoring something that was never there is the failure no hand-written
  fixture can express, because you would have to guess the input that produces it.
  **+7 ms.** No new section, so no count change and no re-bless.

- **Negative fixtures 508 → 511.** Three added, all proving the new checks fire:
  `idHash` given state, `importCode` letting an unresolved hash fall through as
  an id, and one defensive default dropped from the segment read — a real code
  always carries a `W` segment, so section 7 never notices and every generated
  code without one throws. Counts swept in `README.md` and `qa.yml`, along with
  the per-fixture guards cost the memo halved.

> **Found while triaging an outside proposal that recommended splitting
> `guards.js` and moving fixtures in-memory.** Measured, the full-tree copy it
> named as the biggest win costs **16 ms once per suite**, and `guards.js` was
> already sub-second. Both readings ranked work by source size; the profiler
> disagreed. `qa/proposal-triage-2026-08.md` in the project has it in full.

## [3.3.1] — 2026-08-06

**One address.** GitHub Pages was unpublished on the owner's decision that
`nightwatcher.life` is the only site, and everything in the tree that existed
only because a second origin was serving comes out with it. Three guards invert
rather than disappear; sections still run 1..n with no gaps.

### Removed

- **`offCanonical()` and the `noindex` it injected.** They existed so the
  GitHub Pages mirror could ask to be left out of an index, because Pages can
  send no headers and had to keep serving. The mirror was unpublished on
  6 August 2026 and the address returns 404, so there is no off-canonical
  origin left to mark. `SITE` stays — the restore link is built from it.
- **`connect-src` from the Content-Security-Policy.** ~~Not loosened: **it never
  took effect.** 3.3.0 set it to `'none'`, and a wire reading on 6 August found
  the Cloudflare edge appending `'self'` to it. A `'none'` sitting beside a
  second source expression is ignored, so the directive shipped, read like
  protection and provided none — `fetch("/orders.txt")` from the live page
  returned 200. It now falls through to `default-src 'none'`, the first
  directive in the policy, which the edge has no directive of its own to append
  to.~~ **The page opens no connections of any kind**, so the fallback is the
  truth rather than a hope. ~~**Whether the edge leaves a fallback alone is the
  open question this release asks and cannot answer from the tree** — read the
  served CSP after deploying.~~

  > **CORRECTED IN 3.4.4 — the struck reasoning is false. The edge appends
  > nothing.** That 6 August wire reading, and the three like it, were taken
  > through a **TLS-intercepting VPN on the author's own machine**; read with it
  > switched off on 8 August, the served policy is this file's exactly — ten
  > directives, one `sha256`, no `connect-src`. **So this release removed a
  > directive on a misreading, and guard 43 has enforced that removal ever
  > since.** **The removal is kept**, on the half of the reasoning that was never
  > about the edge: `default-src 'none'` covers it and the page opens no
  > connections, so the directive would only restate its own fallback.
  > **Restoring it is now a live option that costs nothing and gains nothing —
  > not an impossibility.**

### Changed

- **Sections 77, 78 and 114 invert.** All three asserted the mirror's `noindex`
  from a different side — the app's, the crawler's and the README's. Each would
  have gone red on the day the correct state was reached, and 77's failure
  message became false the moment Pages went dark. A guard that would block the
  correct state inverts rather than being deleted; section 29 is the precedent.
  They now fail if `offCanonical()` returns, if a `noindex` injection returns,
  or if the README promises the retired address "still works and always will".
- **Section 82 keeps its assertion and loses its premise.** No `CNAME` file may
  exist. That is what would catch someone re-enabling Pages with a custom
  domain, so it stays; the title no longer claims Pages is serving.
- **`README.md`, `SECURITY.md`, `NOTES.md`.** The README promised the old
  address "still works and always will" — a guarantee, and false as of the
  unpublish. `NOTES.md` is amended rather than rewritten, in its own convention.

### Fixed

- **Section 120's pinned reads described a defect that was already fixed.** The
  `pageYOffset` entry still said the read sat after `flagSave()`, `applyTheme()`
  and `renderHead()` and that hoisting it "waits for the freeze to lift on
  19 Sep 2026". **3.3.0 hoisted it**; it is the first line of `render()`. The
  count was right and the reason was a release out of date, which is the same
  shape as the guards this release inverts.
- **Three doc paths in comments.** Sections 96 and 98 and one CHANGELOG line
  named `releases/design-belt.md` and `releases/design-progress-card.md`, which
  moved to `design/` on 6 August. Comments, never `fail()` strings — nothing was
  ever red.

### Recorded, not changed

- **`flagSave()`'s conditional reflow is correct and cannot be hoisted.** It was
  carried as an open item on the assumption that the read could move above the
  write, as `render()`'s did. It cannot: `#nosave` is inside `<header>`, so
  showing it changes the height `--ghtop` is measuring, and reading first would
  set the wrong value in the one state that uses it. **Intentional, confirmed,
  no action.**

## [3.3.0] — 2026-08-06

**Five pendings, and the list is empty behind them.** Four of the five needed a
guard written before the fix, because in four cases the thing that had let the
defect ship was a guard that could not see it. The freeze was lifted for exactly
one change and is otherwise unchanged.

### Fixed

- **The buckle's second line failed AA, and the guard that measures it had
  already measured it.** `.pathseg .bs2` drew in `--staroff` at **3.37:1** on
  `--card2`, where body text wants 4.5. It is `--dim` now — **5.28:1**, still
  dimmer than the `--dust` line above it, so the buckle keeps its two-tier read.

  **Section 20 computed that exact pair and returned without failing**, because
  `--staroff` was on a list of tokens exempted to the 3:1 UI-component floor on
  the grounds that they are *"drawn shapes, not prose."* That is a property of
  the **rule**, not of the colour: `--staroff` is the unfilled star in
  `.stars button`, which earns the exemption, and it was `.bs2`, which does not.
  **The exemption names the rules it covers now.** Any other rule drawing text
  in an exempted token fails.

  Two of the three exempted tokens — `--line` and `--line2` — are used as a text
  colour **nowhere at all**, and have been exempting nothing from a check they
  never reached. Their lists are empty and explicit, which turns each into
  *"if this is ever used as prose, fail."*

  **Found by axe-core in an opened group.** Lighthouse's own axe pass scores this
  page 100, because a cold load never reaches the state.

- **`render()` read the scroll position after writing.** The read sat below
  `flagSave()`, `applyTheme()` and `renderHead()`, forcing a synchronous layout
  of the whole document on every render — **106.6 ms desktop, 64.1 ms mobile,
  ~98% of LCP and the page's only long task.** It is the first line of the
  function now. The value is identical either way; a DOM write does not move the
  scroll position.

- **The privacy footer still credited the beacon that left in 3.2.0.** *"Cloudflare
  counts visits"* → *"the host counts visits"*. Still true before, and still the
  sentence a reader meets first.

### Changed

- **`connect-src` from `'self'` to `'none'`.** Nothing has been fetched at
  runtime since the beacon left, so `'self'` was looser than the truth for one
  release. **Verified in a browser rather than argued** — see below.

- **The head offers four icons instead of two, and one of them already shipped.**
  `icon.png` is 512×512, has shipped since 1.x and was declared in the manifest,
  but was never linked from `<head>`. A new `docs/favicon.ico` carries 16, 32 and
  48 in one container for the crawlers that ask the classic root path and accept
  nothing else, generated from `icon.png` by `qa/make-favicon.py`. **It is out of
  the offline shell by decision**: a favicon is browser chrome, the app never
  renders it, and nothing about working offline depends on it.

  **This is insurance, not a fix.** The reading that prompted it rates a
  four-day-old canonical origin as the cause and calls the rest *"almost entirely
  timing"*; its claim that a 404 at that path is a negative signal is
  unevidenced and is not repeated here.

### Added

- **Section 121 — the privacy footer says what the README says.** 3.2.0 rewrote
  one copy of the visit-counting claim and left the other, and nothing noticed,
  because nothing tied them. Section 117 ties `llms.txt` to the README and
  section 114 ties the old-origin paragraph to `offCanonical()`; the app's own
  footer was tied to nothing. **Not a word match** — both are free to be
  reworded, and both must go on saying that counting happens and that the host
  does it.

- **Section 120 grew an ORDER clause, and the reason is the point.** Its pins
  count how many times each layout property is read. **The reflow fix moves the
  read rather than removing it — one before, one after — so the count could not
  see the fix at all.** A count answers *how many* and never *in what order*, and
  order was the whole defect. It now reads the offset of the scroll read against
  the offset of the first write in `render()`'s own source.

  The section's comment used to promise that the pins drop to zero when the fix
  lands. **That was wrong the moment it was written**, and it is corrected.

- **The favicon guard grew from a count into a decided set.** It asserted that at
  least one icon link existed and printed how many it found, so adding or
  dropping one changed only the number. Each icon is now named with the reason it
  is offered, an unnamed one fails, and the `.ico` is checked for the ICO
  signature and its layer count — a PNG renamed to `.ico` renders in browsers and
  is exactly what the crawlers wanting that path do not accept.

- **`qa/browser-check.mjs` reads the console.** It measured geometry across 36
  checks and would not have noticed a Content-Security-Policy violation — the one
  failure mode a policy tightening actually has. `connect-src 'none'` shipped on
  the strength of that listener across the first-run chooser, an opened group and
  the restore paths.

### A second forced reflow, recorded and not fixed

`flagSave()` writes `el.hidden = canSave` and then reads `h.offsetHeight` to set
`--ghtop`. **It runs only when the store is blocked**, so every profile anyone
has taken — all of them with storage available — is blind to it. Section 120
pins that read by name so it cannot go missing. The freeze was lifted for one
change and this is a second one.

## [3.2.0] — 2026-08-06

**The page fetched one thing from somebody else, and it owned both hops of the
longest request chain on the site.** It is gone, and with it the last runtime
dependency on any origin but this one. Four things ride with it, and two of
them are guards that turned out not to be asserting what they printed.

### Removed

- **The analytics beacon, from seven places and under two hostnames.** Every
  document describing this removal listed four: a CSP origin, a `NEVER_CACHE`
  line, a guard exception, and a clause of README hedging. The tree disagreed.
  The script tag; **`script-src`, carrying `static.cloudflareinsights.com`**;
  **`connect-src`, carrying the apex `cloudflareinsights.com`** — two different
  strings in two different directives, which is exactly how one of them
  survives a removal that only remembers the other; `sw.js`'s `NEVER_CACHE` and
  the `inList` call that consumed it; section 29's carve-out; section 42's
  `FETCHED` list, which held both hostnames; and section 43's `PINNED` map and
  `BEACON` constant.

  **Deleting the beacon from `script-src` shipped green once before**, when
  section 43 pinned four directives of eleven. That hole closed in 3.0.0, and
  it is why this removal was caught at every step rather than at none: the pin
  went red on `connect-src` the moment the policy moved without it.

- **`NEVER_CACHE` in `sw.js`, with the thing it guarded.** It held one entry
  and existed because the cross-origin return below it is about *where* the
  beacon was served from rather than about what the list meant. With nothing
  cross-origin left, an empty list consulted on every fetch is a line that can
  only be right by accident.

### Changed

- **Two guards inverted rather than being deleted.** Section 29 allowed exactly
  one external script and then **failed when it found none**, because an empty
  match array had fooled it once already — the pattern required a double-quoted
  `src`, the beacon has always been single-quoted, and the sweep therefore
  matched nothing on every run from 1.2.4 to 3.0.0. *"An empty sweep is not a
  clean sweep"* was the right fix then. With the beacon gone an empty sweep **is**
  the clean sweep, and a check written to catch a blind pattern would instead
  have blocked the correct state. It now refuses every external script, which
  is a stronger assertion than the carve-out ever was. Section 43's
  `script-src` rule inverts the same way: the origin that was **required** is
  now **refused**, and the fixture that proved it mandatory proves it banned.

- **`docs/llms.txt` states its links as links.** Two bare URLs, no `[text](url)`
  anywhere, in the one file written for engines that read Markdown.

### Fixed

- **Section 101 was not asserting the thing it printed.** It failed with
  *"llms.txt does not name the canonical URL"* while testing
  `lt.indexOf("https://nightwatcher.life/")` — and
  `https://nightwatcher.life/orders.txt`, in the same file since 2.6.0,
  **contains that string.** Proven against the shipped file before it was
  touched: delete the entire `Canonical URL:` line and the section stayed
  green. It has been unable to say anything since 2.1.0. It matches the line
  now, anchored, and against `index.html`'s own `<link rel="canonical">` rather
  than a literal, so the two copies of that address cannot drift apart either.

### Added

- **Section 120 — the page does not read layout after writing it.** Section 96
  refused `scrollHeight` from 2.7.0 and refused **one property name**; a forced
  reflow arrived at the top of the same function as
  `window.pageYOffset || document.documentElement.scrollTop`. Ten properties
  are refused outright and three are **pinned to the exact sites that exist**,
  each named with its reason — because refusing them today would fail the build
  over a defect that is real, known, planned and frozen. A guard that cannot be
  green against the tree it ships with is not a guard.

  The `scrollHeight` assertion also **moves out of section 96**, which is
  titled *"The Belt is one strip, and its pouches open from behind"*. It was
  filed there because that is where the 2.7.0 work happened, and a guard filed
  under the wrong name is a guard the next reader does not find.

  **A third layout read turned up in the sweep** and is pinned with the other
  two: the header measures its own height to set `--ghtop` when the store is
  blocked. Read then write, which is the correct order — recorded rather than
  refused, so a second one has to be argued for.

- **`Cross-Origin-Opener-Policy: same-origin` in `docs/_headers`**, and in
  section 104's array in the same commit, because the file is not
  self-guarding: a header added there and nowhere else is a header nothing
  fails over when it is deleted again. Section 104's note is **derived from
  that array** now instead of naming three headers by hand.

- **axe-core in `qa/browser-check.mjs`, in two states.** Lighthouse already
  passes the cold load, and ten of its accessibility checks are manual and
  unautomatable; what a browser buys is a **state**. It runs against the
  first-run chooser and against an opened group.

  **The dependency it needed was the finding.** This file imported `playwright`
  while `package.json` declared only `jsdom` and `wrangler`, and launched a
  hard-coded `/opt/pw-browsers/chromium-1194/…` — so it ran on whatever
  happened to be installed, at one pinned build. Both are declared now and the
  executable is resolved by Playwright, with `NW_CHROME` kept as an override.

  **The page's own CSP refuses `addScriptTag`, and that is the policy working.**
  `script-src` is one hash and nothing else, so an injected `<script>` is
  blocked exactly as an attacker's would be. axe is injected before navigation
  instead.

## [3.1.0] — 2026-08-06

**One of the app's functions was the quietest thing in the panel, and the error
page had nothing on it.** The soak produced the first; the belt release gave up
the second. Neither is large. One of them is the eleventh release in a row in
which a comment asserted a relationship that nothing checked and that was not
true.

### Changed

- **"Where to watch" has a rank of its own.** `.lnk` and `.act` were the same
  rule twice — same font, same 10px, same `.1em`, same uppercase, same
  `1px solid var(--line2)`, same `8px` radius, same `10px 12px` padding, same
  `38px` floor. **The only difference was a text colour**, and the link had the
  fainter of the two: `--steel` at **5.08:1** against `--dust`'s 5.87. In the
  hero it dropped to 9px — the smallest type in the block — directly above
  `.heroacts .go`, which is solid `--bone`. The one control that leaves the app
  was the quietest thing on the panel.

  It now carries `background:rgba(114,149,204,.14)`, `border:1px solid
  var(--steel)` and `color:var(--bone)`. **5.08:1 → 10.28:1.** Rank bought
  entirely with colour: not one extra pixel of width, so `white-space:nowrap`,
  the hero's `font-size:9px` and the 360px stack all stay true.

  **The obvious version of this fails AA and it is worth writing down.** Tinting
  the fill and keeping the steel label lands at **4.09:1** at `.14` and 3.84 at
  `.18`. Raising the fill without raising the label buys weight by spending
  contrast. The safe move and the strong move are the same move.

- **The hero link is Skip's size, and the expanded row has one left edge.**
  Four declarations: `.herorow .lnk` gains `flex:1`,
  `justify-content:center`, `min-height:46px` and `border-radius:11px`;
  `.linkrow` justifies to the start; and `.herorow .linkrow` stops re-declaring
  `justify-content` in both the base rule and the 360px block, because the base
  rule now says it.

### Fixed

- **The note claimed an alignment that was never true.** `NOTES.md` and the
  1.4.x entry both said the link *"only has to share Skip's **edges**, not its
  weight."* Measured in Chromium at 375px, and **identical in shipped 3.0.3**:
  the hero pill stood **38px against Skip's 46**, cornered at **8px against
  11**, and in an expanded row sat **112px right** of the description, the tick
  indent and both buttons, which all sit on the 42px line. All four now measure
  **0.0px** apart.

  The hero's right edges did agree before this release — but by accident. The
  pill was content-sized and overflowed its column's 38% basis, and
  `min-width:auto` widened the column to match, so the two edges met at a number
  neither rule chose. `flex:1` makes the agreement structural.

- **The watch link's alignment was guarded backwards.** Section 44 asserted
  `.linkrow` must be `justify-content:flex-end` — the misalignment above. It
  went red when the fix went in, which is the whole shape of guard 44's own
  history: a guard that outlives the thing it was written against certifies
  whatever replaces it. **It also had no fixture**, so nothing had ever made it
  fail and nobody had to read what it asserted. Moved to section 119, flipped,
  and negative-tested.

### Added

- **The 404 gets the bat.** `docs/404.html` draws the mark behind its text —
  inline, `#B4AE9C` (the signal's hue at .14 saturation) at **opacity .09**,
  `min(115vw,560px)`, `position:fixed` and centred on the viewport rather than
  on `<main>`, so it bleeds past the copy block instead of reading as an
  illustration. `prefers-contrast: more` removes it. **1,039 → 1,761 bytes**
  against section 101's 4,096 ceiling.

  **Inline is not a preference.** Cloudflare serves this file *at* the address
  that missed rather than redirecting to it, so `url(./icon.svg)` works at
  `/nope` and asks for `/a/b/icon.svg` at `/a/b/nope`. The same resolution rule
  that killed `./` for the root link in 3.0.2 — and the same one that made a
  live audit report `manifest.json` as a 404 on 5 Aug, which is that finding
  arriving from the outside in a real tool.

- **Section 115 counts four copies of the bat, not three.** The fourth copy was
  added against the three-copy version of the section: one of its paths was
  edited alone and **all 117 sections stayed green**; the bat was then deleted
  outright and **all 117 stayed green again**. A guard that counts copies
  certifies whatever it was not told about. Both experiments are fixtures now.

- **Section 118 — the 404 still reads over its own bat.** Section 20 reads
  `index.html` only, so nothing in this suite had ever measured a colour on the
  error page. The arithmetic rather than a screenshot: at `.09` the heading
  reads **14.62:1** and the sentence **6.72:1** over the lit background
  `#17181C`. It also refuses `overflow:hidden` on `<body>` — a `position:fixed`
  box contributes nothing to document overflow, so it buys nothing and costs
  the pinch-zoom section 110 exists to protect.

- **Section 119 — where to watch has a rank of its own.** Asserts the link has
  a fill and an edge no other pill in the row has, that `.act` has not grown one
  too, that the hero pill and Skip declare the same `min-height` and
  `border-radius`, that the pill fills its column, that `.linkrow` starts, and
  that nothing re-declares `justify-content`. **Every assertion is read from the
  two rules that have to agree, never from a remembered pair of numbers** —
  which is exactly how the old note stayed false for eleven releases.

- **Section 20 grew to see a translucent fill.** Every pair it measures is
  token-on-token; a `rgba()` fill lands the label on a blend that appears in no
  palette. It now blends `.lnk`'s fill over every surface, per theme, and checks
  the label against the result. Section 119 asserts the fill and colour are
  written in a form this can parse, because in any other form it measures
  nothing and reports green.

- **Section 101 names the namespace trap and requires the mark be inline.**
  `xmlns="http://www.w3.org/2000/svg"` is an `https://` string, so the first
  candidate went red with *"404.html reaches off the page"* — the right verdict
  with the wrong cause, which sends the next reader hunting for a fetch that is
  not there. The attribute is unnecessary in an HTML document and is now refused
  by name. Separately: no `url()` at all in `404.html`, asserted by shape rather
  than by matching URLs, because a URL check passes anything phrased
  differently.

- **`qa/negative/negtest310.sh`** — 10 fixtures for sections 119 and 20's
  growth. `negtest210` gains 6 for the 404's bat. **35 suites, 483 fixtures.**

  **Two fixtures re-anchored, one of them by this release.** `negtest200`'s
  *"the link row loses its alignment again"* — a section 99 fixture about
  `align-items:center` — pinned the string `justify-content:flex-end;align-items:center;`,
  which S1b deleted, so it reported `SETUP BROKE` rather than failing. It tests
  the same thing against the new anchor. `negtest210`'s freshness fixture moved
  from `BUILT = "2026-08-05"` to `"2026-08-06"`, which is routine every release.
  **Section 115's failure sentences were kept word-for-word** where the
  assertion did not change, because `negtest300` pins two of them and 483
  fixtures assert against guard output by message.

- **Seven browser checks for the edges guards cannot see.** `qa/browser-check.mjs`
  measures the hero pill against Skip and the expanded row against Mark watched
  and the description. It is still not in `npm test` and still not in CI, by the
  same decision as before: it needs a browser, and the point of it is that a
  person would otherwise have to look. **It caught the mock** — the v2 mock put
  the hero's right edge 8.0px short and the row 171.7px out; the real page said
  0.0 and 112.0. Measure the thing that runs, not a proxy for it.

### Documented

- **`NOTES.md`'s two sentences about this control were both wrong, and both are
  corrected in place.** It is not a secondary control — the README's feature
  list leads with *"Where to watch, without picking a side"* and `introBlock()`
  promises every first-time reader *"Tap anything for what it is and where to
  watch it."* The "secondary" label came from a 1.4.x wrapping bug fixed by
  shrinking a label, with the justification written down afterwards: a layout
  constraint promoted to a rule of the design. And it never shared Skip's edges.
  A reversal is written down rather than left looking like drift.

- The 9px hero label stays, and now says why: even at the full column width the
  inner box measures 96.7px and the label needs ~112px at `.1em`.

### Not in this release

- **axe-core on `qa/browser-check.mjs`.** The one forward-looking item either
  5 Aug audit produced, and the one gap both named: browser a11y, which neither
  could execute. It needs no release and rides whenever — it is still the
  owner's call, and an unattended-ish build does not add a devDependency nobody
  asked for on ship day.

## [3.0.3] — 2026-08-05

**One sentence, kept in two files, and one copy had drifted.** The README's
canonical description and `docs/llms.txt`'s summary say the same thing to
different readers. They had stopped saying the same thing, and nobody could say
when.

### Fixed

- **`llms.txt` had dropped "animated and live action."** The README's one-line
  description reads *"every Batman story ever filmed — animated and live action —
  133 films and 67 seasons of television across 44 continuities."* The summary
  block at the top of `llms.txt` carried that sentence with the middle clause
  missing. Covering the animated work and the live action in one catalogue is
  among the rarest true things this project can say: **"animated" appears 197
  times in `index.html` and 4 times in the README, and did not appear once in the
  file generative engines actually read.**

### Added

- **Section 117 — `llms.txt` says what the README says.** Restoring the clause
  without a guard leaves the same hole open for the next edit, and this is the
  project's most-repeated bug class: the tagline, the three copies of the bat,
  the README's paragraph about the old origin. Section 101 already guards
  `llms.txt` — but it guards the three counts and the canonical URL, because
  counts are what drifted in 1.8.3, and the sentence carrying them was never
  checked.

  **Not a word blocklist, and not character-for-character equality.** The two
  files are different documents for different readers and their wording is
  allowed to differ. What is asserted is that the claim survives the copy: every
  load-bearing phrase in the README's canonical sentence appears in the summary
  too. Reword either freely; drop a claim from one and the build goes red.

  It also asserts the README's own sentence still makes those claims, so the rule
  and the check cannot drift apart — if the description legitimately changes, the
  section's list moves with it in the same commit.

  **The first draft went red on the text it was written from**, twice: it folded
  the haystack to lowercase and not the needle, and it collapsed whitespace
  before stripping `llms.txt`'s `> ` markers, which left them mid-sentence so any
  phrase straddling a wrapped line read as missing. Both are recorded in the
  section.

### Also in this release

- ~~**The README's no-third-party-code claim is scoped to this repository.**
  Cloudflare's edge injects a script that is not in `docs/index.html` and cannot
  be removed from here, so the unqualified claim was false on the wire.~~ Two
  lines, not one — the Non-goals bullet and the Running-it line. **The scoped
  data claims are untouched and stay true:** watch data never leaves the device,
  progress is never transmitted.

  > **REVERSED IN 3.4.4.** **Cloudflare's edge injects nothing.** The scoping was
  > added for an injection that turned out to be a VPN on the author's machine,
  > and **both lines are unhedged again in 3.4.4** — the unqualified claim is
  > true of what a visitor is served.

## [3.0.2] — 2026-08-05

**The emptying release.** Every code item left anywhere in this project is in
here, and the ~60-item P3 tail is triaged once and closed rather than carried as
a block nobody had read. No app behaviour changes beyond two confirmed defects,
and no saved-progress format moves.

### Fixed

- **Section 99 carried a loop that checked nothing.** It computed a condition
  and the `if` body was a comment — no `fail()`, no `note()`, no effect.
  Check-shaped and inert, inside a section that otherwise works. The comment
  described a real relationship, so it asserts it now rather than being deleted.

- **Section 22 could not see the head.** It sliced `<body>` to the first
  `<script>`, so `<head>` — where the title, description and OG/Twitter tags
  live — was outside the scan. A stranded `\uXXXX` there renders literally to
  every crawler and every social embed. The JSON-LD block is excluded on purpose:
  it is JSON, where the escape is correct.

- **Section 37's `target="_blank"` check only looked rightward.**
  `rel="noopener noreferrer" target="_blank"` is correct HTML and a common
  ordering, and the old lookahead failed the build on it. **A guard that goes red
  on a correct page is worse than one with a gap** — it teaches the next person
  the guard is unreliable, which is how a real failure later gets waved through.
  It reads the whole tag now, and checks for `noopener` as well.

- **The belt could reopen mid-close.** `S.beltOpen` was cleared inside a 240 ms
  timeout while the closing animation ran, and 3.0.0 established that renders
  arrive from things the reader did not do. Any render inside that window
  redrew an open pouch. The state is set when the close starts; the class
  carries the animation.

- **The share card could not tell a cancel from a failure.**
  `navigator.share(…).catch(function(){})` swallowed both, so a genuine failure
  was silent. `AbortError` returns; anything else falls back to the download —
  the same shape as the 2.7.3 fallback that made one button safe, which was
  guarded where this path was not.

- **The negative harness leaked a temp directory on every standalone run.** The
  parked item read "eight leaking suites" — the eight ending without
  `rm -rf "$NEG"`. That is the symptom. `$NEG` is `"$dir/tree"`, so removing it
  leaves the directory that held it: every suite leaked, the other twenty-six
  just leaked an empty one. `run-all.sh` was never affected. One trap in
  `_lib.sh`, where the directory is made.

### Added

- **Guard 116 — the fonts really carry what the page really renders.** Section
  106 has never read a font: it compares bytes and hashes to a manifest
  `qa/subset-fonts.py` writes itself, so narrow-the-range, re-run, re-bless
  leaves it green over a face that lost glyphs. This was deferred twice as
  *"needs real cmap inspection and a new dependency."*

  **It needed no dependency.** woff2 is a Brotli-compressed sfnt and Node ships
  `zlib.brotliDecompressSync`, so the table directory, the `cmap` and its real
  codepoint set are reachable in pure Node — which matters, because *"Zero
  dependencies"* is stated in `guards.js`'s own header and in README's QA
  paragraph, and shelling out to fontTools would have falsified a guarded claim
  to fix an unguarded one.

  **And it found a second hole nobody had recorded.** Section 106's other half
  asserts every character the page renders is inside the blessed range — and it
  scans for literal non-ASCII only. **The star, the caret and the external-link
  arrow all ship as `\uXXXX` escapes**, so it could not see them, and four
  characters the app renders daily are in none of the six faces: `U+2605` ★,
  `U+25B6` ▶, `U+2197` ↗, `U+203A` ›.

  **They are not a defect, and recording them is the point.** They are UI marks
  rather than text, they render from the system font, they always have, and
  subsetting four symbol glyphs into five faces would spend bytes for a worse
  result. What was wrong is that nobody had decided it — it was invisible, not
  intentional. Named in `SYSTEM_MARKS` now and asserted like section 107's
  nested-section exception: if one turns up inside a **subset** face, this fails,
  because the reason it was excepted has gone. Staleness is judged against the
  subset faces only — limelight is not subset, and what the foundry shipped in
  it is not this project's decision. It carries `U+203A`; the five subset faces
  do not, which is why the exception is *"not carried by every face"* rather than
  *"carried by none"*.

- **Smoke no longer skips silently in CI.** It exited **0** when `jsdom` was
  missing, so a failed `npm ci` would have passed `npm test` with the suite never
  running — and the README check-count assertion going unrun with it. The skip
  survives locally, where it is a real affordance for a fresh clone; under `CI`
  it says the suite did not run and exits 1.

### Decided

- **`404.html`'s root link stays `href="/"`, and the mirror's stays wrong.** The
  parked item was right that both obvious fixes break the other origin: an
  absolute canonical breaks the self-containment rule below it, and `./` breaks
  on any path deeper than one segment, because the 404 is served **at** the
  requested URL rather than redirected to. **So it is a trade, and the apex takes
  it.** The mirror has measured zero visits against the apex's hundred, serves
  with `noindex` injected, is a waiting room by decision, and retires after the
  depth-2 call. Breaking a live rule that keeps the error page dependency-free —
  the page shown when something is already broken — to fix a link on an origin
  nobody reaches is the wrong way round. Recorded in the guard; do not re-open
  without new traffic evidence.

  *This was planned as an absolute canonical and the guard rejected it. The guard
  was right.*

### The P3 tail — closed

Sixty items were being carried as a block nobody had read. **Six were taken** —
the three guard holes and the three app items above; the first three were
coverage holes rather than nits, which is why clearing the block wholesale would
have been wrong.

**The rest are cleared permanently, not deferred:** two radixes parsing ratings
in formats that genuinely differ · the series-count hint that self-corrects on
jump · `subOf()` computed twice · a stray comma · `ratingBadge`/`S.rated` naming ·
`S.log = {}; S.log = [];` · smoke's dead Google-Fonts strip · README read three
times and `sw.js` five times under different names · three hand-synced copies of
the CSS tokenizer · smoke's fire-and-forget collapse-reboot check ·
`make-share-card`'s error-handling hardenings on a twice-a-year tool. Every one
is real and none is worth a line in a release note; carrying them further teaches
the backlog to be ignored.

### Not in this release

**SHA-pinned CI actions** — the one item whose failure mode is a broken CI run
rather than a red guard, and the SHAs could not be confirmed from here.
**The beacon** — 3.1.0 after Batman Day, and with no Worker: `wrangler.jsonc` has
no `main`, GSC's Links report already gives referring domains, and Cloudflare's
HTTP Traffic panel already gives visits. **The Instagram safe zone**, gated on a
Story test. **The devlog** and everything downstream of it.

## [3.0.1] — 2026-08-05

**Four watchers and one line of schema.** No app behaviour changes and no
saved-progress format moves. Every stage here closes a gap 3.0.0 either opened or
left open, which is why it ships the same day rather than waiting: none of it is
new capability, and a watcher that is going to exist should exist before the
thing it watches drifts.

### Added

- **Guard 113 — every negative suite runs in CI.** 3.0.0 added `negtest300` and
  never added it to the shard matrix in `.github/workflows/qa.yml`. The suite ran
  green on the release machine four times, including from inside the zip, because
  `run-all.sh` with no argument runs every suite; CI shards, and all four shards
  failed at the workflow's own *"every suite lands in some shard"* step before
  `run-all.sh` ran at all.

  **Third time that step has gone red, second distinct cause.** `negtest252` and
  `negtest260` reached the pick patterns and missed a hand-maintained fifth copy
  of the shard lists — fixed then by making the workflow read the patterns out of
  itself. This one missed the pattern. **The remaining hole was where the check
  lived:** only in CI, so a tree could be green on the machine that built it and
  red on push. It lives in `guards.js` now, which already read `qa.yml` for the
  fixture-count comment. The workflow keeps its copy — neither restates the
  patterns, so two checks of one property is redundancy rather than drift.

- **Guard 114 — the README describes the origin that actually serves.** Guard 77
  inverted in 2.5.1 and fails the build if the retired move offer returns to the
  app, but it reads the *served HTML*; the README is not what it reads, which is
  why a paragraph promising that offer survived a documented amendment pass and
  shipped until 3.0.0. 3.0.0 corrected the prose and left the hole: a fixture was
  written, found nothing to trip, and was removed rather than left passing
  against a green run.

  **Not a blocklist.** The 3.0.0 audit recommended greping for the retired
  move-offer language; a blocklist passes for every phrasing nobody thought of,
  and this project already refused that shape once — `negtest172` records why a
  spoiler-word blocklist was rejected for era notes. What is asserted is
  agreement: the app injects `noindex` and offers nothing, so the paragraph about
  that address must name the first and must not present the second as current
  behaviour. **The first draft of this guard failed on the corrected prose** — it
  matched "carry that progress across" inside the sentence saying the offer was
  retired. That is recorded in the section, because a pattern that cannot tell a
  claim from its retraction is the same blocklist in better clothes.

- **Guard 115 — three copies of the bat, and they agree.** The glyph is written
  out verbatim in the header markup, in `BATP` for the share card, and in
  `docs/icon.svg`, from which every PNG raster derives. Nothing asserted they
  match. Cheaper than expected: all three share the 0–100 coordinate space and
  the same `translate(0,5)`, so it is string equality after normalising
  whitespace, not geometry. **`BATP` carries no ellipse** — the share card draws
  it on the canvas separately — and that is asserted as a difference rather than
  papered over, so three-of-four does not read as a bug later.

- **`sameAs` names the project's X profile.** `audit-triage-2.1.0.md` §D declined
  social profiles in the JSON-LD on the stated grounds that there was no social
  presence to point at. There is now, so the premise died and the conclusion was
  re-taken — the only way a decline lapses here. One entry beside the repository;
  no separate Person or Organization social graph. **It will not move rankings:**
  entity consolidation shows up in answer engines, and the instrument for that is
  the monthly AI-citation check, not the SEO audit.

### Changed

- **Guard 42 splits its allowlist into fetched and named origins.** It had been
  doing two jobs under one name. An origin the page *fetches* tells a third party
  someone opened the page — that is what the section has always been about. An
  origin the page *names* — a link a reader may follow, a `sameAs` entry
  declaring two URLs are one entity — sends nothing and is read by crawlers.
  `github.com` was already in the list on the second footing; `x.com` joins it
  there. The distinction is written down rather than implied, because the next
  addition will be argued from this list and the wrong reading of it is "these
  origins are fine". They are fine to **mention**; section 29 holds the other half.

### Not in this release

**The beacon stays, and no Worker script was introduced.** `wrangler.jsonc` has
no `main` — this is an assets-only deployment and nothing executes at the edge.
Replacing the beacon with Worker-side `Referer` logging would mean putting
JavaScript in front of every request to every route, where a throw is an outage
rather than a red build. Recorded in `releases/history-3.0-3.2.x.md` §4 (was `plan-3.0.1.md`) with the finding
that matters more: **visits and referrers are different needs.** Cloudflare's
built-in HTTP Traffic panel already counts visits server-side for free; referrers
are a launch-window measurement. After Batman Day the beacon can retire with no
Worker at all.

Also unchanged: §106's font verification, the P3 tail, the shell hygiene, CI
hardening, and `404.html`'s root link on the Pages mirror.

## [3.0.0] — 2026-08-05

**The shape that changed is the harness, and then the watch link.** MAJOR here
means a change to the app's shape, and this is the largest one since the Belt:
it changes what the build is able to see, corrects a defect in the watch link of
every entry whose title is shared, adds two controls, and rewrites the
interaction path. **No saved-progress format moved.** Backup codes, restore
links, the JSON export and every `i:` slug are byte-for-byte what 2.7.5 wrote,
and guard 8 and the round-trip checks are unchanged. A code written by 2.7.5
restores identically here, and a code written here restores in 2.7.5.

Skips the rest of the 2.x line on the owner's call. Guard 74 holds the version
history running one direction, so `2.8.0` and `2.9.0` are gone with it —
`releases/plan-2.8.0.md` (maintainer-local, not in this repository) is superseded but kept, because this release cites it
for the header measurements.

### Fixed

- **`titleYear()` keyed on the title alone, so seven entries searched for a
  different production.** It took the earliest year anywhere in the catalogue
  for a given title, which is the right rule for the seasons of one show and the
  wrong rule for a name two unrelated productions share. `TITLEYEAR` is now keyed
  `f.t + "|" + f.gi` and `watchLinks()` passes the entry to `watchUrl()` rather
  than the title, because a title cannot say which production it means.

  The seven, verified in a browser against the shipped catalogue before and
  after: *The Batman* (2022) searched 2004 · *Batman* (1989) searched 1943 ·
  *Batman* (1966), film and series, searched 1943 · *Justice League* (2017)
  searched 2001 · *Birds of Prey* (2020) searched 2002 · *Batman Beyond* (2014)
  searched 1999. **The 22 same-universe cases are seasons of one show sharing a
  URL, which is the intended behaviour, and not one of them changed.**

- **Guard 44 enforced the defect**, requiring earliest-year-per-title and only
  looking for collisions between *different* titles — so the harness certified
  the wrong answer. The rule now reads "the first year this title appears in its
  own universe", asserts directly that no entry searches a year no entry of that
  title in that universe carries, and treats two productions sharing one URL as
  the failure. Rule, code and fixtures changed in one commit.

- **Watched and skipped could both be true, and it survived into exports.**
  `markWatched()` has always cleared the skip; three merge sites did not — the
  cross-tab storage event, the JSON restore branch and `applyImport()`. Skip in
  one tab, tick in another, and the entry rendered `class="film done skip"` and
  appeared in both the `W` and `S` segments of the backup code and the JSON, so
  every denominator on Progress disagreed with the next. `delete S.skipped[k]`
  at all three. The log-merge dance was written out twice and is now
  `mergeLog()`. Guard 111, and three smoke checks driving each site for real.

- **`#restorebox` was wiped by renders the reader did not cause.** It is rebuilt
  empty on every `render()`, and renders fire from another tab's storage event
  and from the four-second reset-confirm timeout — which is gated on
  `S.tab === "stats"`, the tab the box lives on. It is now carried across a
  repaint the way `#q` already was, value and selection. Guard 112.

- **`S.open` was one keyspace for two views.** The path's expanded rows and Next
  up's peeks shared it, so opening one opened the other. Split into `S.open` and
  `S.peek`. Next up stays on the full render deliberately — four rows, nothing
  to save.

### Added

- **A Skipped filter in The path, and the Progress scoreboard is three
  buttons.** One feature: the scoreboard has counted *Skipped* since 1.x with
  nowhere to send anyone who tapped it. The tiles reuse the existing
  `data-act="tier"` handler. Guard 109 holds the relationship rather than the
  markup — every `data-tf` must be a filter `chipSet()` offers, and all three
  counts must have a tile.

- **`docs/_headers` declares a cache policy**, which nothing in this project ever
  had. `/sw.js` takes `no-cache`; `/fonts/*` takes a year and `immutable`. Guard
  104 pins both values and fails a blanket `Cache-Control` under `/*`, since the
  two paths want opposite answers. **This is a serving change and takes effect
  only on upload** — `_headers` is read by the edge, never by anything in the
  repo.

- **Guard 110** — the viewport is not locked. Section 62's argument that a small
  control is acceptable because the reader can zoom rests on this page setting no
  `maximum-scale`, a recorded WCAG 1.4.4 decision that nothing checked; adding
  `maximum-scale=1, user-scalable=no` shipped green. `docs/404.html` was
  unchecked entirely and is held to the same rule.

- **`filmRow()`**, pulled out of `groupBlock()` so the surgical repaint and the
  full render share one builder rather than two that drift.

### Changed

- **Interacting stops rebuilding the world.** Closing a group cost a full render:
  148–214 ms at 200 entries on desktop Chromium, of which 2.2 ms was this file's
  own code. `rowUpdate()`, `groupUpdate()` and `themeUpdate()` join the existing
  `tickUpdate()`, and `rate()` moved onto the tick fast path it had been driving
  straight past. `.group` carries `content-visibility:auto` with a
  `contain-intrinsic-size` floor.

  **Each falls back to `render()` the moment it cannot find what it expects**, and
  the smoke suite's byte-identity gate was widened past `#view` to cover the
  header markup, `<html data-theme>` and the theme-colour meta. Every surgical
  path is driven and required to serialize byte-for-byte identically to a forced
  full render — 144 comparisons.

- **Section 29's external-script sweep matches the page it guards.** The pattern
  required a double-quoted `src`; the only external script the page has ever
  carried — the disclosed Cloudflare beacon — is single-quoted, and `git log -S`
  says it always was. The match array was empty on every run since the section
  was written, so the carve-out below it had never executed and a single-quoted
  script added today shipped green: section 42's origin sweep is an allow list
  and already allows `github.com` for links. Quote style is out of the pattern,
  and an empty sweep now fails on its own.

- **Section 43 pins the whole CSP, and refuses to hash an ambiguous script.** It
  pinned four of eleven directives: deleting `static.cloudflareinsights.com` from
  `script-src` shipped green, and rewriting the six unchecked directives to `*`
  shipped green. Every declared directive is pinned to its exact value, a
  directive the page declares that nothing pins fails, and `script-src` may carry
  only the hash and the disclosed beacon origin.

  **And the second half was worse than under-coverage.** This section hashed the
  *first* plain `<script>` while section 46 parses the *longest*. With one script
  they agree by luck; add a small inline script above the application block and
  section 43 reports a stale hash and `npm run bless` writes the hash of the
  decoy — both suites green over a page whose CSP blocks the entire app, and
  jsdom does not enforce meta CSP so smoke cannot see it either. More than one
  plain `<script>` is now the failure, because a single hash cannot describe two.

- **`docs/sw.js` is compiled, not just grepped.** Five sections read its text and
  smoke never registered it, so a syntax error appended to it left both suites
  green while offline broke for every visitor. Section 11 binds the source and
  runs it through `new vm.Script()` — the failure class 2.7.4 added that for,
  applied to `index.html` and never extended to the other file that ships.

- **Section 91 has a byte ceiling: 60,000.** It read `buf.length` only to print
  it, so a valid 1200×630 PNG of 3,025,613 bytes passed. The card ships at 19,656
  bytes only because of a manual PIL quantize documented at the top of
  `qa/make-share-card.mjs`; the raw render is ~325 KB.

- **Section 108's fallbacks are reachable.** `slice()` *throws* on a missing
  marker, so `slice(…) || HTML.slice(…)` never reached its right-hand side and
  `fail("shareCardBlock() is gone")` was unreachable with it — renaming the
  function ended the run with a raw stack trace, the exact failure mode
  `optionalFn()` was written to prevent twenty lines above its own definition.
  `sliceOr()` is the version that keeps the promise.

- **Smoke's NW1 check tests NW1.** It asserted the code starts `NW3W` and then
  did `code.replace(/^NW2/, "NW1")`, which cannot match — so it imported an NW3
  code and duplicated the line below it, and deleting NW1 support from the app
  left it green. An NW1 code is now built, because the 1.0.0 rating layout is a
  branch `importCode()` takes only below version 3. The forward-compat probe
  builds a genuinely later major instead of calling an NW3 code "a future NW2".

- **The negative harness stopped passing against green runs.** `run_case` grepped
  the *whole* suite output, and a green run prints `  ok   <name>` and
  `  · <note>` — so any fixture whose expected string was a check *name* rather
  than a failure *message* matched success. All 392 expects were extracted and
  tested against captured pristine output: **22 matched a run in which nothing
  was broken.** The green lines are filtered before matching. An exit-code gate
  and a `✗|FAIL` filter were both tried and rejected on evidence — the first
  breaks `negtest176`'s three warning-only fixtures, the second breaks the two
  that expect a harness error.

  **Three of the 22 were hiding real holes**, and all three are fixed at the
  mutation rather than the harness: `negtest172` named a check its mutation did
  not trip (and the check it named had no fixture of its own, which now exists);
  `negtest185`'s mutation made a value consistently wrong while the check asserts
  the value does not *change*; `negtest251` left guards exiting **0**, because
  nothing asserted that `_headers` stays out of the offline precache though
  `share.png` and `orders.txt` have carried that assertion since 1.9.0 and 2.6.0.
  Section 104 carries it now.

- **`negtest183` and `negtest273` re-anchored.** Four fixtures were pinned to
  `125.7` and `r="20" stroke-width="4"` and reported `SETUP BROKE` after the ring
  moved — the designed behaviour, working. Section 47's new assertions, section
  80's `#ringTrack` agreement and its `100%` label floor all gained fixtures.

- **`var ids` was declared twice at guards file scope with different meanings.**
  The catalogue one is `filmIds`.

### Documentation

- **README described a feature retired in 2.5.1** — the offer to carry progress
  across from the old origin. `offCanonical()` only injects `noindex`, and guard
  77 fails the build if the offer returns; the README is not what 77 reads, which
  is how it survived a documented amendment pass. `wrangler.jsonc` pointed at the
  same retired offer, and `qa/smoke.js` documented an `origin` phase that left
  `PHASES` with it in 2.5.1 — along with the `afterOrigin()` hop named after it.
- **NOTES.md amendments.** The Galactic Guardians slug paragraph carried no
  *Amended* marker against the 1.8.1 rename recorded further down the same file ·
  "Parked by decision", whose three items have all shipped and whose `og:image`
  claim had been false since 1.9.0 · the Workers migration, still framed as a
  live option four releases after it landed · a "2.2.1" citation with no
  CHANGELOG entry behind it.
- **CHANGELOG 2.7.4's orphaned paragraph** — an indented block with no heading
  over it, the only structural break in 69 entries. It is a `### Fixed` item.
- **`sw.js`'s "133 KB index.html"** is ~180, and 133 now collides with the film
  count · section 104's comment credited the CSP hash to "section 10" when it is
  43 · the README's file table omitted six `qa/` files.
- **`NOTES.md` carries the reasoning** for the watchers, the watch-link key, the
  merge invariant, the restore box, the surgical paths and the cache policy.
  `docs/index.html` carries none of it: guard 65 allows two comment blocks in
  that file and the explanations go where they are read.

### Not in this release

Recorded so it is not mistaken for missed. **Section 106's font verification** —
it compares hashes to a manifest the subset script itself wrote, so
narrow-run-widen-run leaves it green over tofu. A genuine hole; real coverage
needs cmap inspection and a new dependency, and it is too big to ride a release
this size. The ~60-item P3 tail, the shell hygiene, CI hardening, and
`404.html`'s root link on the Pages mirror, which wants a decision rather than a
patch.

**And one gap this release opened and did not close:** nothing guards the README
prose corrected above. Guard 77 reads the served HTML, so the retired move offer
can return to the README without failing anything. Left as found rather than
fixed, because a new watcher is new scope.

## [2.7.5] — 2026-08-04

The header's two flankers finally match.

### Changed

- **The bat and the ring both draw 44px.** 2.7.3 took the bat from 32 to 40 to
  close a gap against what was described as a 46px ring. **The ring was never
  46.** Its *box* is 46; what it draws is a stroked circle at `r="19"` with a
  4px stroke — outer edge at radius 21, so **42px across**, with 2px of slack it
  never used.

  So the correction that closed the gap was itself measured against the wrong
  number. The ring's radius is now 20, which draws 44 inside the same 46px box,
  and the bat is 44. Two flankers, same drawn width, 1px of air each — for the
  first time the row is symmetric in what a reader sees rather than only in what
  the box model reports.

  `stroke-dasharray`, `stroke-dashoffset` and the offset the script computes all
  move with the radius: 2πr for r=20 is **125.7**. Section 80 derives the
  circumference from the radius rather than holding a constant, so it checked
  all three against the new value without being told.

- **The guard now checks the two against each other.** It held a floor — *the
  bat is at least 38px* — which was a number produced by narrowing a gap, not by
  measuring anything. **What actually balances the row is that both flankers
  draw the same width**, so that is what it asserts: the bat's width against
  `2 × (r + stroke/2)`, within a pixel, plus a ceiling at the 46px column so the
  bat cannot overflow its own flank and start taking the wordmark's room on a
  narrow phone.

  A floor would have passed 44 and 42 as happily as 44 and 44. The invariant
  catches a change to *either* side, which a constant never could.

- **The build line drops below the caveat and centres.** *Announced dates can
  move.* is a statement about the catalogue; *Build · updated · read the source*
  is provenance. They were one run-on line, then two adjacent ones. Now the
  second sits a full line below and centred under the first, which is what it
  always was: a footer, not a continuation.

### Why PATCH

Two CSS widths, a radius and the three numbers that follow from it, and a
`<span>`. No catalogue change, no behaviour change, nothing touching saved
progress.

## [2.7.4] — 2026-08-04

The source link finds its seat, and the page checks that it parses.

### Fixed

- **The note breaks after its first sentence.** It read *Announced dates can
  move. · Build 2.7.4 · updated 2026-08-04 · read the source* — a middot placed
  after a full stop, joining a caveat about the catalogue to a run of build
  provenance as though they were one list. They are two different statements and
  they now sit on two lines. Not guarded: nothing depends on it, and a line
  break that carries no decision is exactly the sort of thing that should not
  acquire a rule.

### Changed

- **The source link moved to Progress's build line, and it is legible now.**
  2.7.3 put it inside Home's colophon by wrapping the words *free software under
  the AGPL* — and shipped it with **no styling at all**, so it rendered in the
  browser's default blue inside a line of dim uppercase mono. Reported in the
  soak within the hour, which is the correct speed for a defect that loud.

  Two fixes, and the second is the better one. It now sits beside `BUILD` and
  `BUILT` at the bottom of Progress, reading *read the source* — the app's own
  meta line, where a reader who wants the version is the same reader who wants
  the code. Home's colophon says *free software under the AGPL* in plain words
  again, which is a statement rather than a control.

  **It inherits its line's colour and carries a thin underline.** Colour alone
  is not an affordance for everyone, so the underline does the work; hover
  brightens it. Both the seat and the underline are guarded — the first because
  it was chosen, the second because shipping it unstyled is exactly what
  happened once.

### Added

- **A guard that the page's own script parses.** This release wrote
  `...+BUILT+ \u00b7 <a href=...` — one dropped quote in a concatenated string —
  which is a syntax error that would have stopped the app running **at all, on
  every browser**.

  The harness did catch it. `smoke.js` builds the page in jsdom, so it died —
  but it died throwing a raw stack trace with a line number, which is not the
  same as being told the file will not parse. On a 180 KB single file that is
  the difference between a minute and an hour.

  The whole script block is now compiled with `new vm.Script()` before anything
  else forms an opinion, and the failure says what happened. It guards the one
  class of mistake this project is most exposed to by construction: **every
  release edits string-concatenated markup by hand, and a dropped quote looks
  like nothing in a diff.**

### Why PATCH

One link moved, one CSS rule, one guard. No catalogue change, no behaviour
change, nothing touched in saved progress.

## [2.7.3] — 2026-08-04

One button, a header that balances, and a link to the source.

### Changed

- **The share block is one button: *Share the night*.** It was two, and the
  wrong way round — a browser that could share got *Share the night* **and**
  *Download the card*, while a browser that could not got *Download the card*
  alone. The two-button state was the capable one, which read as the app
  hedging about its own primary action.

  **The second button was doing more work than it looked.** `navigator.share`
  existing does not mean **file** sharing works, and the old handler answered
  that case by saying so:

  ```js
  if(navigator.canShare && !navigator.canShare({files:[f]})) toast("Sharing files is not available here");
  ```

  That was survivable only because Download sat beside it. Cutting to one button
  and leaving the handler alone would have left a reader on such a browser
  pressing the only control on the block and being told no, with nowhere to go.

  **So the button falls back to downloading instead of reporting failure.**
  Share where sharing works; download everywhere else; the existing *Card
  downloaded* toast tells the truth after the fact. The label is honest in all
  three cases, because *share the night* is the intent and the mechanism is the
  browser's problem. The app cannot know which case it is in until it has the
  file, so one label plus a truthful toast beats a label that tries to predict.

  The fallback is guarded. It is the entire reason one button is safe.

- **The header balances.** The bat went from 32px to 40px and the wordmark from
  21px to 24px.

  **Nothing was ever misaligned**, which is why this lasted eleven releases. The
  row is three flex columns, both flankers boxed at 46px, wordmark centred
  between them — every box exactly where it claims to be. What was lopsided was
  the *mass inside the boxes*: the bat drew at 32px with seven pixels of air on
  each side, against a ring that fills its 46px edge to edge, and covered
  **26.7px vertically against the ring's 46**. Light on the left, heavy on the
  right, and the eye reads that as crooked while every measurement says it is
  not.

  The two numbers moved together because enlarging the title alone shifts mass
  to the centre and re-breaks the balance. They are guarded together for the
  same reason: one decision, not two.

  **The ceiling is the narrow phone.** At 375px the row leaves about 219px
  between the flankers. *NIGHT WATCHER* in uppercase Limelight measures roughly
  187px at 24px, so it fits with room — and would not at 28. `.wordmark` is
  `flex:1` with `min-width:0`, so it shrinks silently rather than pushing back:
  nothing would go red, the title would just start wrapping on somebody's
  phone. The guard holds both ends.

### Added

- **The footer links the source.** Five audits recommended it: the JSON-LD has
  always claimed the repository under `sameAs`, so machines were told and
  readers were not. Minimal, on the owner's word — the words *free software
  under the AGPL* became the link rather than a new line arriving.

### Removed

- **The `cardsave` handler**, which the missing button left unreachable. Guarded
  now from both sides: a button with no handler does nothing, and a handler with
  no button is code no reader can reach. They come back together or not at all.

  Worth recording that **the first run after removing the button was fully
  green.** A dead handler is not a failure any existing check could see, which
  is the same shape as the Mature badge in 2.7.2: nothing fails over something
  that is merely unreachable.

### Why PATCH

Two CSS values, one button, one link, one dead handler removed. No new files, no
catalogue change, no behaviour change to saved progress.

## [2.7.2] — 2026-08-04

Three things that were already true in the data and missing from where they
mattered.

### Removed

- **The Mature badge, four releases after the thing that replaced it shipped.**
  The decision is dated 1 August 2026: *replace both Mature and Kids with the
  film rating itself*, because *"PG-13 and R were both Mature before, and G and
  PG were both nothing."* Kids went. Mature stayed, on **39 entries** — 12 of
  them rated R, 13 TV-MA, and **eleven rated PG-13 or TV-14**, which is the
  exact imprecision the ratings were adopted to end. The legend admitted it: the
  swatch read *"R or close."*

  It survived because nothing was ever going to fail over a badge that was
  merely redundant. 1.7.0's note said the rating badges were not in that release
  and that *replacing* Mature and Kids was the next round's job; the ratings
  arrived, the replacement did not, and what shipped was an addition.

  **The accepted cost, decided by the owner:** the three unreleased Knightfall
  entries now carry **no maturity signal at all** until they release. Not a
  softer one — none. Part 1 gains its `R` when it goes digital on 25 August;
  Parts 2 and 3 are undated. The alternative was keeping a badge that means
  *mature* on entries where it would have started to mean *we do not have a
  rating yet* — a different sentence in the same box.

  No saved progress is touched. Badges were never frozen; only `i:` slugs are.

### Added

- **The era notes reach the crawlable seed.** Anyone arriving without
  JavaScript — and any text-only crawler, which is how several AI indexers read
  a page — saw eleven bare labels where the app shows a sentence each. The notes
  were already written, already one source in `ERAS`, already guarded by
  section 81 for what an era note may say: *a period, not a story.* So this is
  existing data reaching the surface engines read, not new copy, and nothing is
  now written twice.

  Era 0 stays out of the list, here as in the app. It is not a stage of a life;
  it collects the entries that have no place in one.

- **The page points at `orders.txt`.** One `<link rel="alternate"
  type="text/plain">`, and the reason it is worth a line in a changelog is how
  it was found: a six-agent SEO/GEO/AEO audit crawled the live site and
  recommended, as new work, *"a machine-readable catalogue export for secondary
  citations."* That export has been served since 2.6.0.

  Checked afterwards: `orders.txt` was referenced from `llms.txt` and nowhere
  else. Section 105 was written around the sentence *an export nothing points at
  is an export nothing reads*, and it faithfully held the one pointer that
  existed — it could not know the page itself was silent.

  **It stays out of `sitemap.xml` on purpose.** The crawlable seed already
  carries all 200 entries and so does `orders.txt`; submitting both for indexing
  asks a search engine to choose between two near-identical bodies on one
  domain. Discoverable is not the same as indexed.

### Changed

- **The badge-kind guard checks the `BADGE` map instead of trusting it.** Its
  list of kinds was hand-kept, so a kind present in the map and nowhere else was
  invisible to it — which is close to how Mature lasted four releases. The map
  and the list now have to agree in both directions.

### Not done

- **A footer link to the source repository.** The page's JSON-LD claims the repo
  under `sameAs` and there is no clickable link to it anywhere: machines are
  told, readers are not. It is one `<a>`, and it is held to ride with the
  September page update rather than arriving alone.

### Why PATCH

Data and copy. A badge removed from 39 entries, existing notes reaching an
existing surface, one `<link>`. No new files, no new catalogue entries, no
behaviour change, no change to saved progress.

## [2.7.1] — 2026-08-04

Four cosmetics from 2.7.0's soak. One of them is a retraction.

### Fixed

- **The era note touched the line above it.** An open group draws a 1px rule
  under its header, and the note's first line sat directly on it — close enough
  to read as a rendering fault rather than as spacing. The space is on
  `.gbody`'s padding rather than the note's own margin, deliberately: with a
  zero-padding parent the child's top margin collapses straight out of the box
  and nothing moves.

- **The content rating sat beside the Where-to-watch link.** That placement was
  2.2.0's answer to its own soak note, and it made the rating read as part of
  the link instead of as what it is. It is a badge, and it now sits with the
  other badges on every surface a reader decides from — the entry row, the
  Next-up hero, and the Then peek.

  Section 92 had pinned the old arrangement as a literal string, twice, so it
  failed on the fix rather than on a regression. It now holds the rule instead:
  every deciding surface carries the rating immediately after its badges, and
  none carries it next to the link. **That is the second guard this month that
  had to be widened from a layout it was never meant to defend** — the first
  was the reduced-motion block in 2.7.0. A guard that pins punctuation stops
  protecting the decision and starts protecting the wording.

- **The share block reads like every other block on the page.** Title,
  description, then buttons — left aligned. It had been title, buttons, then a
  centred note, which made the description read as a footnote to the buttons
  rather than as the thing the block is.

### Reverted

- **The share card's bottom block is back at 1590 / 1700 / 1750.** 2.7.0 lifted
  the bars, the rule, the strapline and the domain up by 145px to clear the
  strip Instagram reserves for its reply bar, and moved the bat and its glow up
  with them.

  The reasoning held. The release shipped it **without the one-minute Story
  test that was written into the plan specifically to gate it** — and on a real
  card it left a third of the canvas empty under the domain. The balance the
  card already had was worth more than the risk it was avoiding.

  Reverted, and guarded, because the argument for moving it is still true and
  still on the record, so it will read as unfinished work to whoever finds it
  next. It is not. **If it is ever revisited, the answer is not to shift the
  block again — it is to keep the composition and shorten the canvas, and that
  wants the Story test first.**

### Added

- **Guard 108**, holding all three of the fixes above. They are one value
  each — a padding, a coordinate, the order of two elements — which is exactly
  the shape that gets tidied back. The first draft of this release's negative
  suite failed on three fixtures for the right reason: nothing was holding them.

## [2.7.0] — 2026-08-04

The last release before the freeze. Lighter, quieter, and honest about its own edges.

### Changed

- **The webfonts are subset. The first visit is 55,864 bytes lighter.** Six
  faces shipped at 118,860 bytes — 39% of everything a new reader downloads,
  and more than the page itself compresses to. None of it was dead files: all
  six are referenced and all six are precached. It was glyph coverage nobody
  was ever going to use. Five are now cut to Basic Latin, Latin-1 and
  punctuation, and the payload for a first visit falls from 302,514 bytes to
  246,650.

  **The range is wider than the catalogue on purpose.** Subsetting to exactly
  the 99 characters the catalogue contained today would have saved another
  21 KB and put an accented title one data patch away from rendering as blank
  boxes, on a catalogue whose whole design is that it takes data patches.
  **Guard 106** closes what is left: every character in the page and in
  `orders.txt` must be inside the blessed range, so an unusual letter fails the
  build on the day it is added rather than turning up in somebody's screenshot
  three weeks later.

  **Limelight is left whole**, and the reason is legal. Its OFL header reads
  *"with Reserved Font Name Limelight"*; Anton's and IBM Plex's do not. A
  Modified Version may not carry a reserved name as presented to users, so
  subsetting it means renaming the family in the font, in `@font-face` and in
  `--deco` — real churn and a licensing judgement, for 10.3 KB. It keeps 84% of
  the saving and none of the question. `qa/subset-fonts.py` regenerates the
  rest and blesses a manifest of sizes and hashes, so the fonts and the record
  of what they contain can only move together.

- **The favicon is a file now, and search engines can finally see it.** The SVG
  icon shipped inline as a `data:` URI: one fewer request, renders perfectly
  everywhere, and invisible to Google — whose favicon pipeline **crawls** the
  icon and needs a stable URL with a content type. A `data:` URI has neither.
  It is now `docs/icon.svg`, precached like every other app asset. Guard 106's
  neighbour fails the build if any icon link goes back to `data:`, because
  inlining it is a defensible optimisation on every ground except the one that
  matters.

- **`manifest.json`'s `id` was wrong, and 2.7.0 is the last cheap moment to fix
  it.** It read `/Night-Watcher/` — the GitHub Pages *project page* identity,
  which on the apex resolves to a path that does not exist. Changing a PWA's
  `id` orphans existing installs, which is why the standing decision was to
  leave it. That decision assumed a fixed install base. The measured base was
  near zero and Batman Day was five weeks out, so the cost of this change fell
  to roughly nothing today and rises with every install after. Paid once,
  deliberately. Guard 83 now pins `/` with the same force it pinned the old
  value, and there is no second exception coming.

### Fixed

- **The belt closes without the page snapping.** The staged exit always played
  — the pouches fading and lifting — and then the whole view was rebuilt at
  240 ms and everything below jumped up in one frame. The exit animated; the
  reset did not.

  The earlier reading was that this could not be fixed in CSS, because an
  `innerHTML` replacement cannot be transitioned. True, and beside the point:
  the pouches animate on `transform` and `opacity`, neither of which affects
  layout, so the belt kept its full height right up until the swap. Collapsing
  the belt's own box over the same 240 ms means the page has already settled by
  the time the swap lands, and there is nothing left to snap. **The re-render is
  not retimed and the handler is untouched.** Reduced motion still gets the
  honest instant close, box and all, and that is guarded rather than assumed.

- **A forced reflow on every render.** `render()` finished by clamping the
  restored scroll position against `document.documentElement.scrollHeight` —
  reading layout immediately after writing `innerHTML`, which forces a
  synchronous layout of the entire document. Around 216 ms on a 200-entry list,
  every time anything re-rendered, to compute a number the platform already
  applies: `window.scrollTo` clamps to the scrollable range by itself. The read
  is gone and guarded, because it is the kind of line anybody reasoning about
  scroll restoration from first principles would add back, and jsdom has no
  layout, so nothing in the harness would ever have caught it.

- **The share card's link sat where Instagram covers it.** The card has been
  1080×1920 at 9:16 since 2.0.0, so the size was never the problem — the
  placement was. `nightwatcher.life` sat at y=1750, 91% down, inside the strip
  the reply bar reserves. The one element that turns a Story view into a visit
  was under the interface. The bars, the rule and both text lines moved up, and
  the bat and its glow moved with them so nothing collides.

### Added

- **Guard 107 — the section census.** Carried on the backlog since 2.2.0. Guard
  66 already held the numbering; this holds the two properties underneath it,
  both of which break silently: a section that contains no `fail()` protects
  nothing, and a section that never runs passes for the same reason an empty
  file does.

  **It found one immediately.** Section 24 is not at file scope — it sits inside
  section 23's `else` branch, because it needs the path tables section 23
  extracts. It is kept, on a condition that is now asserted rather than assumed:
  the only branch that skips it is the branch that already calls `fail()`, so a
  skipped section 24 can never coexist with a green build. Lifting it out would
  leave it reading variables the failing branch never assigned — a stack trace
  in place of a clean red. One nested section, named, with its reason. A second
  one fails the build until somebody argues for it too.

- **CI runs on `actions/checkout@v5` and `setup-node@v5.`** Every job was
  warning that Node 20 is deprecated and being forced onto Node 24. Noise now, a
  red run whenever the runners stop forcing it — in a repository that is about
  to go quiet for a month.

### Not done, on purpose

- **Stage B, the QA trim menu, drops.** `GUARD_ONLY` needs the guard file
  scoped, and the sections that are bare top-level statements share module
  scope. That is a restructure of the file holding every guarantee, on the last
  release before the year's largest day. The drop condition was written into
  the plan before the build rather than argued during it. The census — the part
  that was actually worth having — shipped without it.

- **Stage D was already done.** `SMOKE_ONLY` has scoped smoke runs by phase
  since 2.2.0. It stayed on the backlog for four releases as a thing to build
  after it had been built.

### Why MINOR

Six replaced font assets, a new served file, two new guards. No new catalogue
entries and no change to saved progress.

## [2.6.0] — 2026-08-04

The catalogue answers in plain text.

### Added

- **`docs/orders.txt` — the whole catalogue as a text file.** All 200 entries,
  grouped by continuity, each with its year, format, tier and content rating,
  plus the announced titles marked *NOT OUT YET*. It is served at
  `/orders.txt`, it is 18 KB, and it costs the page nothing: it is a separate
  file that the app never fetches and the service worker never caches.

  The audience is the one `llms.txt` was written for — anything that reads text
  rather than HTML. `llms.txt` describes the site; this hands over the data.
  `llms.txt` now points at it, and guard 105 fails the build if that pointer
  ever goes missing, because an export nothing links to is an export nothing
  reads.

  **It carries one ordering, and the reason is written down so nobody
  "completes" it by accident.** By universe needs no sort — each continuity's
  array *is* its spoiler-safe order, the same fact the crawlable seed relies
  on. Bruce's life and Release order are produced by two anonymous comparators
  inside `buildGroups()`, and the guards can only extract *named* functions
  from `docs/index.html`. Reproducing those two sorts in `qa/guards.js` would
  be a second implementation of the app's ordering — precisely the thing this
  project refuses to have. Naming them in `index.html` so both sides share one
  source is a `buildGroups()` refactor, which is app logic, and app logic does
  not ride a safe release.

  The loss is smaller than it reads. Release order is derivable from the file —
  every entry states its year. Bruce's life is not, and it is also the ordering
  the app itself calls *an interpretation rather than a canon*, so the app is
  the honest place for it. The file says as much in its own header rather than
  quietly shipping two thirds of a promise.

  It is **generated and blessed**, like the crawlable seed and the ItemList:
  rebuilt from `PATH`, `FILMS` and `tierOf()` on every run and compared byte
  for byte, with `npm run bless` as the only way to update it. A hand-kept copy
  of 200 entries would be stale within one release and nobody would read it
  closely enough to notice.

- **Guard 105.** Regenerates the export and fails on any drift — a title, a
  year, a rating or an ordering that moved while the file did not. It also
  fails if `orders.txt` is ever added to the offline shell, for the same reason
  `llms.txt` and `404.html` are excluded: crawler assets have no business in an
  app cache.

### Why MINOR

A new file is served that was not served before. `docs/llms.txt` and
`docs/404.html` arrived the same way in 2.1.0, and that was a MINOR. Nothing in
the app changed — no markup, no behaviour, no saved progress.

## [2.5.2] — 2026-08-04

The progress ring says its own number out loud, and two answers come back.

### Fixed

- **The progress ring's accessible name contained everything except the
  number.** Its visible text is the percentage; its `aria-label` was a fixed
  *Open progress*. A screen reader announced the verb and never the value, and
  a voice-control user could not say the one thing they could see. The name is
  now built from the same string as the visible text, in `renderHead()`, so the
  two cannot drift: one value, written twice, computed once.

  It is worth recording **why this survived four releases**: Lighthouse scores
  Accessibility 100/100 with it present, because `label-content-name-mismatch`
  sits below the scoring threshold. Two independent audits said "some
  interactive elements" without naming any; the third named it. A perfect score
  is not the same as no findings, and this is the evidence.

### Added

- **Two straight answers, restored.** *Does it track what I watch?* and *Where
  do the Joker films fit?* 2.1.0 planned seven questions and shipped five,
  cutting these two when the file hit 165.1 KB against a 165 KB ceiling — the
  plan's own "FAQ trims first" rule, applied under duress. 2.5.0 raised the
  ceiling to 200 KB, so the constraint that made the trim correct no longer
  exists. Both render into the seed and mirror into the `FAQPage` schema from
  the same `buildFAQ()` source, blessed, so a reworded answer moves both or
  fails the build.

- **`qa/negative/negtest252.sh`** — 11 fixtures: the accessible name losing the
  number, losing it while keeping the words, the ring rendering no starting
  percentage, the button ceasing to be a button, `renderHead()` no longer
  updating the name, the percentage computed twice instead of shared, each
  restored answer cut from the seed, an answer reworded on one side only, and
  the `FAQPage` dropping or rewording a question the seed still answers.

### Changed

- Guard **80** now holds the ring's accessible name alongside its
  circumference. Same section on purpose: the radius, the percentage and the
  name are one object, and changing any of them alone is the failure it exists
  to catch.
- The `docs/_headers` entry above listed five `Permissions-Policy` directives;
  the file has six. `interest-cohort` was missing from the prose only. Recorded
  because the omission made the live header look like it was coming from the
  inert dashboard rule rather than the file, and cost an hour proving otherwise.

## [2.5.1] — 2026-08-04

The beta address stops being offered a way out. Nothing a reader on
nightwatcher.life has ever seen changes.

### Removed

- **The move offer, retired.** `moveBanner()`, `moveHid`, the `.moved` banner
  with its `movego` link and `movelater` dismissal, and the `.moved`/`.movego`
  CSS are gone from the app. It shipped in 1.8.0 to carry a returning reader's
  progress from the GitHub Pages address to the apex, because progress lives in
  `localStorage` and only JavaScript on that origin could ever read it. It was
  right to build and it is right to retire: **it was measured before it was
  removed** — over the whole life of the analytics beacon, 100 visits on the
  apex and none on the beta address, with one referral from it to the repository
  in fourteen days. The recorded reason it was kept alive was beta readers'
  per-origin progress, and that reason is now a checked fact instead of an
  assumption.
- **The `origin` smoke phase**, and with it the old-origin document the suite
  built to observe a banner that no longer exists. `SMOKE_ONLY` now takes
  `main`, `css`, `blocked`. Smoke drops from 287 checks to 278.

### Kept, deliberately

- **`offCanonical()` survives**, doing one job instead of two. It no longer
  decides whether an offer renders; it is the only thing that marks the
  still-serving mirror `noindex`, and the canonical link is a hint a crawler may
  decline. Retiring the offer was never a reason to start competing with
  ourselves in search a month before Batman Day.
- **Both addresses still serve.** Pages still has no custom domain, because a
  custom domain writes a `CNAME`, turns the old address into a 301, and a
  redirect runs no JavaScript — which would strand anyone who never moved,
  permanently, from data still on their own disk. That has not changed and is
  not what was retired.

### Added

- **`docs/_headers`** — `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Frame-Options: DENY`, and a `Permissions-Policy` denying geolocation,
  camera, microphone, payment, USB and `interest-cohort`. The site had **no security headers at
  all** before today beyond what a meta tag can carry.
  **Why a file and not a dashboard rule:** a Cloudflare Response Header
  Transform Rule was created for exactly this, deployed, showed *Active*, and
  set nothing — verified against a cache HIT, a cache MISS and a 404. Custom
  response-header transforms do not apply to responses a Worker generates, and
  every route here is Worker-served. Managed Transforms are applied at a
  different stage and do survive, which is why HSTS (`max-age=2592000`, no
  preload) and `X-Content-Type-Options: nosniff` are set at the edge and
  deliberately **not** duplicated in this file. The CSP stays in its meta tag,
  where section 10 blesses its hash against the one inline script.
- **Guard 104** holds all of that: the file exists, its `/*` rule applies to
  everything, each of the three headers is present with its value, and the two
  the edge owns are *absent* here — one header, one place.

### Changed

- **Guard 77 inverted.** It used to prove the move offer was there; it now fails
  if `moveBanner`, `moveHid`, the `.moved` markup, `movelater`, `movego`, the
  `.moved` CSS or a reference to the retired address ever returns, and it fails
  if `offCanonical()` is deleted as apparently-dead code. Sections run 1..n with
  no gaps and retired things invert rather than vanish, which is the established
  pattern.
- **`negtest180` retires its origin wing** and gains the inverse fixtures: the
  machinery creeping back must fail the build. **The 2.2.0 §3.6 memo skip closes
  on its own** — it existed because the suite pinned the `moveBanner` literal,
  and there is no literal to pin.
- `NOTES.md`'s "Two origins, on purpose, forever" and "The offer is conditioned
  on where it is" carry open amendments rather than edits; `SECURITY.md`'s
  header caveat now describes what the canonical site actually sets.
- Weight: **178.1 KB raw / 51.4 KB gzip** against 200 / 80 — one and a half
  kilobytes lighter than 2.5.0.

### Ops — outside the tree, recorded here because the repo cannot show it

- **SPF added** to `nightwatcher.life`: `v=spf1 -all`. The domain has no MX and
  sends no mail, so `-all` is the complete statement. DMARC was already live at
  `p=quarantine`. An RFC 7505 null MX was attempted and **rejected by
  Cloudflare's dashboard validator** — recorded so it is not retried there.
- **HSTS enabled**, `max-age=2592000`, `includeSubDomains` off, **preload off** —
  the reversible configuration, on purpose.
- **A second Cloudflare Web Analytics property was deleted.** It was set to
  *"Enable — the JS Snippet will be automatically injected"*, meaning edge
  injection was switched on. Had it fired, the page would have carried
  third-party JavaScript that is **not in `docs/index.html`**, which
  `qa/guards.js` reads — so the "no third-party code" claim could have broken
  entirely outside the guards' field of view. Zero recorded views; nothing lost.
- The obsolete `Add Cloudflare Workers configuration` bot PR was closed.

## [2.5.0] — 2026-08-04

The release that emptied the backlog. Tagged `v2.5.0` — the first tag since
v2.0.0, on the owner's word. Everything that was open went in, became a
recorded decision, or became a dated trigger; the morning after this
release, the backlog is the trigger table and nothing else. Still no
Knightfall — the trigger fires 25 August, and will number itself 2.5.1.

### Fixed

- **The belt stops "reloading."** Three soak sightings, one defect: picking
  a format, picking a type, or changing tabs with the belt open replayed
  the pouch entry animation, because the base rule carried it. The
  animation is scoped to an `opening` class now, rendered exactly once —
  the belt handler's flag lives for the one render that opens. Re-renders
  with the belt open update content with no theater. Reduced-motion
  unchanged. Guard 96 holds the scoped rule, the flag's one-render life,
  and that the base rule stays bare.
- **The ratings description flows beside its badges.** The Path's footer
  legend rendered `PG-13 / TV-14` alone with the whole sentence dropped
  below — the sentence was one indivisible flex item. `.rleg` is inline
  flow now: text wraps word-by-word beside vertically-aligned badges, like
  every other legend row. Guard 99 #3 re-anchored to the new mechanism.

### Added

- **seed-200.** The crawlable seed's continuities section carries **all
  200 entries**, each under its universe in spoiler-safe order — year,
  format, series marked as such, the curated 74 keeping their essential/
  core distinction, and NOT OUT YET honest in the seed exactly as in the
  app. Generated from the data and blessed (guard 78); the JSON-LD
  ItemList stays the curated 74 — the recommendation is a list, the seed
  is a catalogue.
- **`qa/negative/negtest250.sh`** — 16 fixtures across every guard this
  release touched, including one that deletes a file to prove the
  harness's heal step brings it back.

### Changed

- **The ceilings — the owner's numbers, 4 Aug.** Raw **165 → 200 KB**
  (the fourth raise) and gzip **50 → 80 KB** (the FIRST gzip raise ever),
  authorizing seed-200 and honest growth after it. The file ships at
  179.7 KB raw / 52.2 gzip. The discipline is unchanged: arithmetic still
  fails the build, and every raise is a recorded decision.
- **Persistence is a trailing debounce (report §3.7).** persist() used to
  serialize the whole state per call — a write per tick. Calls now
  coalesce (200 ms); `flushPersist()` writes immediately; **pagehide and
  visibilitychange-to-hidden flush**, so a closed tab inside the window
  loses nothing. Guard 102 holds the three-legged contract; smoke proves
  the coalescing behaviorally (a burst writes zero, the flush writes one).
- **The tick path repaints one group (report §3.8).** toggleWatched and
  toggleSkip rebuild the row's group through `groupBlock()` — the same
  builder the full render composes from — plus the header through
  `renderHead()`, instead of innerHTML-ing the world. Filters, search,
  and other tabs fall back to the full render. **The gate:** smoke drives
  48 ticks across paths, formats and scopes, and after each one a forced
  full render must serialize byte-for-byte identical — it does. Guard 103
  holds the shape; the report's bail-out clause was not needed.
- **The guard-fixture harness heals instead of re-tarring (report §5.3).**
  `_lib.sh` unpacks the tree once per suite and restores between fixtures
  — created files removed, deleted files brought back, rewritten files
  re-copied (mtime + manifest). Measured honestly: the unpack it removes
  cost ~11 ms per fixture against ~5 ms of heal, so the win is small —
  it rides because it was the last backlog line, and the suite proves it
  by deleting a file mid-run.

### Decisions closed by the owner, 4 Aug — recorded here, never relitigated

- **Backup-codes kept-for-newer edge case: CLOSED** — and in fact already
  fixed: exportCode() has walked S.watched since the NOTES entry "A code
  carries your progress, not the catalogue." Doubly dead.
- **The mistyped slug** (`...-galactic-guardians-198-1985`): **CLOSED.**
  The migration window shut at 1.8.x; it is what that slug is.
- **`const` conversion: CLOSED.** The harness enforces the ES5 style; the
  optimization report's rejected list re-affirms it.
- **Devlog: handed to marketing** (post–Batman Day material).
- **Landscape progress card: a trigger** — built only if embeds demand it.
- **The pre-1.8.0 backlog document is retired.** Audited against the
  tree: every remaining line was already shipped, already fixed, or is
  closed above. The import-tolerance note — its last open line — is now
  a NOTES.md paragraph, and the retired-ids bless warning learned its one
  recorded exception so it stops training people to skim warnings.

## [2.2.0] — 2026-08-03

The tune-up. Two inputs, no new features: the 2.1.0 soak ledger's three
findings, and the owner's optimization report (filed verbatim in the
project at `qa/optimization-report-2.1.0.md`) — its Phase 1 render work
and Phase 2 QA speed land here. Phase 3 (debounced persistence, targeted
DOM updates) is explicitly parked for its own release, as the report
itself sequenced it. Still no Knightfall — the trigger fires 25 August.

### Fixed

- **The rating badge joins Then.** The Next-up queue peek rendered tier
  and format badges but never the rating — the one number a parent
  scanning "what's next" actually wants. `ratingBadge(x)` joins the peek,
  and the Next-up hero's link row carries `ratingBadge(f)` beside the
  watch link, same as the detail panel. Guard 92 now holds all three
  seats: peek, hero, panel — exactly two `ratingBadge(f)+watchLinks(f)`
  seats, no more, no fewer.
- **The buckle stops cropping on narrow phones.** Below 375px the
  buckle's two lines step down (bst 8→7px, bs2 7→6.5px) and the padding
  tightens — the longest state, "Live action / Movies+Series", fits a
  320px screen. Full words stay: the type gives, never the words.
  Guard 96 holds the narrow-viewport rule.
- **"Share your progress" is a card.** The share block was a bare
  paragraph heading floating between the scoreboard and the folds; it is
  now a `.bk` card with an `h3` title, the same chrome and title size as
  "Your data" and every other Progress block. Guard 98 holds the card
  form and fails the qhead whisper coming back.

### Changed

- **Render efficiency, report §3.1–3.6.** All statement-level rewrites,
  byte-identical markup out: `viewStats()` reuses the group `.films`
  arrays instead of re-filtering 56 keys per render, and its twin row
  builders fold into one `progRows()`; `esc()`'s map hoisted to
  `ESCMAP` with per-film invariants (`tE`, `dE`) pre-escaped once;
  `badges()` memoized per `id|format`; Home and the intro stats count
  in a single pass; `counts()` computed once in `render()` and passed
  down; focus restoration is one attribute-selector `querySelector`
  instead of a linear dataset scan; the forced-reflow scroll clamp skips
  when there is nothing to keep; a precomputed search haystack (`f.hay`)
  and a shared `BYID` map kill the linear scans and turn the two log
  merges O(n); `noteFor()` skips `yearSpan()` unless the note asks.
- **Source removals, report §4.** The ten empty `b:[]` (the flatten step
  defaults them), the duplicated `replaceState` (routeHash reuses
  `clearPendingHash()`), the double `anyOpen()` in `viewWatch()`, and a
  `pct()` helper replacing the three hand-rolled percentage lines. The
  bytes bought back the budget headroom the report said was the point.
- **QA speed, report §5.** `run-all.sh` dispatches suites longest-first
  so the slowest suite no longer anchors the tail; CI shards the
  negative job 4-way (workflow-only, balanced by smoke-fixture count,
  the fixture-count guard running per shard off disk); smoke's dead-CSS
  sweep early-exits once every selector has matched; and
  `SMOKE_ONLY=<phase>` lets a fixture run just the smoke phase it
  actually tests — the check-count self-assert skips under a filter,
  and full smoke still runs in `npm test`. Timings before and after are
  measured and recorded in the release record, not asserted.

### Skipped, on the record (report items that collide with pinned literals)

- **`moveBanner()` memo (part of §3.6)** — the banner string is pinned
  verbatim by three negtest180 fixtures; a memo wrapper would move the
  literal and re-anchor a suite for microseconds. Skipped.
- **Reduced-motion probe dedup (part of §4)** — guard 96 pins the
  `matchMedia` probe inside the belt handler by position; hoisting it
  would weaken the guard that proves the close honors reduced motion.
  Skipped.

### Added

- **`qa/negative/negtest220.sh`** — fixtures for the three soak-fix
  guards and the `SMOKE_ONLY` wrong-phase failure.

## [2.1.0] — 2026-08-03

Housekeeping, from three directions at once: the SEO/AEO/GEO audits' short
list, the 2.0.0 soak's two Belt notes, and the buckle the owner locked by
mock (26 / 26 / 26 / 22, full words). Still no Knightfall — the trigger is
the trigger.

### Changed

- **The buckle, locked.** Equal 26% path segments, the buckle at ~22% with
  the two-line hierarchy — format over types, full words in every state,
  the chevron tucked in the corner. No abbreviations survived the mock
  round. Guard 96 holds the split and the hierarchy.
- **The close mirrors the open.** The pouches animated out but vanished
  shut — the soak note. Closing now stages: the belt handler marks the
  pouches closing, the types row tucks first, format follows, and the
  re-render lands after the exit plays. Reduced motion closes instantly,
  no timeout. Guard 96 holds the exit keyframes, the staged handler, and
  the reduced-motion opt-out.
- **The crawlable seed grew its answer surface.** The section headings are
  H2 now (the H1 → H3 jump Yoast flagged is closed), and a **Straight
  answers** FAQ closes the seed: five real questions — which order, the
  animated series, do I have to watch everything, is it spoiler-safe,
  where can I watch — answered in 2–3 sentences each, the first one
  derived from MODENOTE so the method answer cannot drift from the app's
  own copy. Planned as seven; trimmed to five when the weight said so
  (the privacy answer lives in the featureList already, and the Joker
  shelf explains itself in the app).
- **A visible freshness date.** `BUILT` beside `BUILD` in the Progress
  footer — "updated 2026-08-03" — and guard 67 fails the build if it ever
  disagrees with the newest CHANGELOG date. The audits scored freshness
  down for dates only machines could see.

### Added

- **FAQPage in the JSON-LD** — the same five questions, from the same
  single source (`buildFAQ()` in the guards), blessed like the ItemList;
  guard 100 fails if seed and schema ever answer differently.
- **`docs/llms.txt`** — the site described in plain text for generative
  engines: the claim, the three orderings, the counts (guarded against
  the data like the README's), the privacy stance, the canonical URL.
  Costs no page weight; out of the offline shell.
- **`docs/404.html`** — the wrong-alley page. One sentence and a door,
  self-contained, noindexed, and served with a real 404 status:
  wrangler's `not_found_handling` moved `"none"` → `"404-page"`, which
  keeps the original rule (no SPA fallback, no cached-as-HTML 200s) and
  loses only the default shrug. Guard 101 holds all of it.
- **`qa/negative/negtest210.sh`** — fixtures for the locked buckle, the
  staged close, the freshness date, the FAQ sync, llms.txt and the 404.

### Ops — outside the tree, recorded so QA stops asking

- The owner's panel batch, done 3–4 Aug: **SPF added** (DMARC was already
  live at `p=quarantine`), **HSTS on** (Always-Use-HTTPS had soaked),
  **redirect chain checked**, **favicon flag confirmed a false
  positive**, Bing/GSC rechecks run.
- The audits' remaining findings are triaged in the project
  (`releases/history-1.9-2.2.x.md` §11, was `audit-triage-2.1.0.md`): declined items recorded so they are
  not relitigated; authority/backlink work handed to the promotion plan.

## [2.0.0] — 2026-08-03

The Belt. The app's three stacked control rows become one strip with pouches
that open from behind it — the first time the utility-belt name is literal —
plus the progress card, theme in its new home, and the four soak notes
against 1.9.5. The first tag since v1.9.0; it covers 1.9.5's untagged
changes by pointing here.

**What 2.0.0 does not carry: the Knightfall trigger edit.** Part 1 is not
out until 25 Aug, and guard 92's rule — an unreleased entry carries no
certificate — is the truth today. Dropping NOT OUT YET three weeks early
would ship a false claim; the `u` drop and the `r:"R"` ride the trigger as
their own small data patch, as the road plan always said.

### Changed

- **The master chooser is the Belt.** One continuous strip — the three
  orderings joined, no gaps, the chosen path filled in signal — with a
  buckle as its last cell. The buckle carries what the closed pouches hold
  ("All / Movies + Series") read from the real state, so a narrowing filter
  can never hide behind a collapsed row. One tap opens: the format row
  toasts out from behind the belt, the types row follows a beat later —
  "then" as animation order. The pouches hang flush-aligned beneath the
  strip — one inset, both rows on the same edges — with the belt's shadow
  on them; `prefers-reduced-motion` gets instant
  show/hide. The belt always starts closed and its open state is never
  persisted — it is a control tray, not content. Guard 96 holds the strip
  construction, the buckle honesty, the stagger, the reduced-motion
  opt-out, and the never-persisted rule.
- **1.5.3's overlap law, amended on purpose.** "Only the deck overlaps"
  gains its second surface: the deck overlaps statically, the Belt
  kinetically. Collapsed, every tab now opens with one control row where
  there were three.
- **Theme moved to Home — exactly once.** The Dark deco / Darker pair
  leaves the bottom of Progress for the bottom of Home, compact (230px,
  34px rows), on both the pre-choice and chosen pages. It never entered
  the Belt. Guard 97: Home renders it, no other view does, and the Belt
  must not.
- **The weight ceiling: 160 → 165 KB raw.** The progress card's drawing
  code, tightened first (dead code out, one path string, shared download
  path), still left the file at 161 KB. Owner's call, third raise in the
  budget's history, each recorded; the gzip budget has never moved (48 of
  50 KB).

### Added

- **The progress card.** "Share your progress", seated right under the
  scoreboard on Progress: a 1080×1920 story card drawn on a canvas in the
  browser — wordmark, patrol kicker, the fraction huge in signal, films /
  seasons / universes-closed row, the honest pool line naming exactly what
  it counts, the bat in clear sky over a skyline of every universe's bar,
  filled to its completion. At 100%: CASE CLOSED, the bat solid signal
  with a glow, "All 200 logged · every Batman there is." One look
  regardless of theme — the darker variant was considered and declined.
  Download + `navigator.share` where present; the filename carries the
  brag (`night-watcher-87-of-200.png`); nothing leaves the browser, and
  the UI says so. **No preview** — the card draws on a canvas created at
  the moment of the tap, and **"Share the night" leads** in the primary
  fill with download second (owner's respin call: share is what people
  want; where the share sheet does not exist, download takes the lead).
  Guard 98 holds the seat, the share-first ordering, the on-demand
  canvas, the one-source counts, the local-only line, and the theme
  independence. Design record: `design/progress-card.md` in
  the project.
- **`qa/negative/negtest200.sh`** — fixtures for every new guard: the
  belt's construction, buckle, stagger, reduced-motion and no-persist
  rules; theme's one home; the card's seat, source, privacy line and
  filename; and each of the four soak holds.

### Fixed

The four soak notes against 1.9.5, called in from the live site:

- **The rating badge rode the top of the link row.** `.linkrow` had never
  declared an alignment; the badge stretched to the watch link's height.
  `align-items:center`, and guard 99 holds it.
- **ANIMATED and LIVE ACTION looked identical.** One shared rule became
  two: LIVE ACTION in steel, ANIMATED in dim, both still dashed. Guard 99
  fails if the two rules ever collapse back into one.
- **The ratings legend line sat misaligned.** The swatches and the
  two-systems sentence now centre on one line of their own (`.rleg`,
  full-width in the legend's flex row). Guard 99.
- **Three headings read too small.** A `.qhead.big` variant (13px) at
  exactly the three seats the owner named — the grid heading on Home,
  "Then" on Next up, the fold headings on Progress — and nowhere else;
  guard 99 counts the seats both ways. No by-eye round: the variant was
  the owner's call.

## [1.9.5] — 2026-08-03

The pack. Everything that did not have to wait for 2.0.0, shipped while The
Belt is designed: the rating every entry earned in the sourcing pass, a
Progress tab that folds, one answer for a fresh visitor, and the independent
audit's short list. 2.0.0 stays what it was — the Belt, and the Knightfall
trigger.

### Added

- **A rating on every released entry.** `r:` on all 194 — 90 MPA ratings,
  78 TV Parental Guidelines ratings, 26 honest NRs for the web shorts, disc
  extras, unaired pilots and the two 1940s serials that predate the rating
  system entirely. Two systems live on one shelf on purpose: eleven
  film-shelf entries are TV specials and TV-rated DTVs, and the badge renders
  what the source system says, never a translation. The six unreleased
  entries carry none — a certificate rides a release, so Knightfall Part 1's
  announced R enters with 2.0.0's trigger edit, the same edit that drops its
  NOT OUT YET badge. Sourced or absent, never guessed: the sourcing pass
  covered all 200 with a source per value, and the nine rows it flagged were
  re-verified before any of this shipped. Three moved — the 1983, 1984 and
  1985 Super Friends seasons are **TV-G** by Apple TV's unified show page
  and TV Guide's season badge, not the aggregator's TV-Y7; the other six
  held (Fatal Five PG-13 by Movies Anywhere, Brave and the Bold TV-Y7 by
  Tubi, Young Justice S4 TV-14 by Apple's own season page).
- **The badge is text, in the app's own type**, in the detail panel beside
  the watch link, with a legend line naming the two systems. The MPA
  certification marks and the TV Parental Guidelines logos are certification
  marks and are not reproduced.
- **Guard 92** holds the vocabulary (nothing outside the two systems), the
  released-carries-one / unreleased-carries-none rule, and the exact
  distribution from the findings doc — a rating cannot change without a
  source, and the findings doc cannot silently disagree with the shipped data.
- **The Progress lists fold.** By universe (44 rows) and By era (12 rows)
  collapse behind their headings, closed by default — they stood between the
  donuts and the backup tools, the longest scroll in the app to reach the
  controls that keep progress alive. `progOpen` is `groupOpen`'s mirror
  image: groupOpen persists only `false` because absent means open, progOpen
  persists only `true` because absent means closed, and persisting anything
  else would flip a default the next time a build adds a fold. Guard 93
  enforces the mirror the way guard 36 enforces the original.
- **The curated list is machine-readable.** An `ItemList` of the 74
  essential-and-core titles joins the JSON-LD `@graph` — the same list the
  crawlable seed already hands to crawlers that read HTML, now for the ones
  that read schema.org. One cut feeds both, through the extracted
  `tierOf()`, generated and blessed exactly like the seed; guard 95 keeps
  the two in step. From the independent audit's list.
- **An H1 in the seed.** The crawlable block opened with an H2 — a fragment,
  to a crawler that runs no JavaScript. Its first heading is the page's
  content H1 now; the wordmark in the header stays the site's. Also the
  audit's list.
- **`qa/negative/_lib.sh`.** The harness every negative suite carried as its
  own copy — scratch-tree setup, `run_case`, the summary — is one sourced
  library now, ~500 duplicated lines gone. The failure-report grep is the
  newest superset (`✗|!|FAIL`) in all 22 suites, where three vintages of it
  had drifted. The suites prove the refactor themselves: every fixture still
  fails its guard for the stated reason.
- **`qa/negative/negtest195.sh`** — fixtures for everything above: ratings
  vocabulary, counts, the unreleased rule, the badge and legend, the folds
  and their persistence, the fresh-visitor default, the ItemList, the seed's
  H1, and the raised ceiling.

### Changed

- **The path is Bruce, for a fresh visitor.** Owner's call, recorded in the
  1.9.5 plan. The chooser's lead card has been Bruce's life since 1.7.2;
  what remained was the reader who had not chosen yet — The Path opened on
  By universe for them, a different answer than the card the chooser
  recommends. The pre-choice default is `life` now, and guard 94 keeps the
  two recommendations one recommendation. Nothing moves for anyone who has
  chosen a path.
- **`docs/share.png`: 325 KB → 20 KB.** 1.9.0 declined quantization so the
  shipped file would be the generator's exact output; the independent audit
  put a number on what that cost — the card was the heaviest file in the
  tree, on every social embed. Reversed: 256-colour palette quantization,
  RMSE 1.4%, invisible at card size. The card stays generated — the exact
  reproduction step is recorded in `qa/make-share-card.mjs`, so a
  regeneration still lands on the shipped bytes.
- **The weight ceiling: 150 → 160 KB raw.** The road-to-2.0.0 plan budgeted
  this raise for the release the ratings data rode in; with the `r:` field
  on 194 entries and the ItemList, the file is over 150 and comfortably
  under 160. The gzip budget did not move, and the README's weight prose
  moved with the numbers.

### Ops — outside the tree, recorded so QA stops asking

- **The AGPL `LICENSE` is verbatim, verified 3 Aug.** A fresh gnu.org
  download, normalized from the browser's CRLF save (34,523 bytes), hashes
  byte-identical to the text below the divider in the tree. The parked
  "byte-exact AGPL copy" item was stale — the README's "canonical, verbatim"
  claim was already true, and the first-FOSS-submission gate is open.
- **Bing / IndexNow, completed 3 Aug**: verification via Search Console
  import, sitemap submitted (*Processing*, 0 errors), Bingbot clear at the
  edge, and the index tab's 2006-dated DNS error proven stale by a clean
  live test, indexing requested. Still owed on the watch list: the sitemap
  recheck once processed, and the IndexNow attribution panel after its
  ~48-hour window.
- **1.9.0 shipped the same day this was built** — the soak runs while 2.0.0
  is designed; anything it surfaces lands on the 2.0.0 plan, not here.

## [1.9.0] — 2026-08-03

The page's face when it travels. Nothing a reader inside the app sees changes.

### Added

- **`docs/share.png` — the share card.** 1200×630: the bat mark and wordmark
  over three numbers in signal yellow — *133 films · 67 seasons · 44
  continuities* — the tagline, the domain, and a strip of 44 ticks. One asset,
  three jobs: social embeds, the repository's social preview, and the Batman
  Day graphic. Three numbers on purpose: *87 years* is Batman's age as a
  character, and this catalogue's claim is every Batman story ever **filmed**,
  which starts in 1943 — the card does not borrow comics history. That figure
  goes to post copy, where character history is fair game.
- **The card is generated, not drawn.** `qa/share-card.html` +
  `qa/make-share-card.mjs`: the counts are extracted from `PATH` the way the
  guards extract it, the bat silhouette is chroma-keyed out of
  `docs/icon.png` at run time, the fonts are the app's own, and the render is
  2× downscaled in-browser. The card cannot say something the catalogue does
  not. Playwright is deliberately **not** in `package.json` — the generator
  is release tooling on the `qa/smoke.js` optional-dependency pattern, and
  the lockfile and both CI jobs are untouched. Quantization was declined:
  the shipped file is the generator's exact output, so a regeneration
  reproduces it.
- **Guard 91 — the card the metas promise is the card that ships.** The file
  exists and its PNG header reads exactly 1200×630; `og:image`,
  `twitter:image` and the JSON-LD `image` agree on it; the size hints match;
  `twitter:card` is `summary_large_image`; and `share.png` appears nowhere in
  the service worker's precache — it is a crawler asset, and keeping it out
  of the offline shell is now enforced rather than remembered.
- `qa/negative/negtest190.sh` — five fixtures: the card deleted, the card
  replaced at the wrong size, the card type reverted to a thumbnail, one
  reference drifting back to the icon, and the card smuggled into the
  precache.

### Changed

- **The page's embed identity moved off the icon.** `og:image` and
  `twitter:image` → the card; `og:image:width/height` 512×512 → 1200×630;
  `og:image:alt` now states the three numbers; `twitter:card` `summary` →
  `summary_large_image`; the JSON-LD `image` follows — the note left for this
  release in the 1.8.6 plan.

### Ops — outside the tree, recorded so QA stops asking

- **Bing Webmaster Tools, 3 Aug 2026**: site verified (Search Console
  import), `sitemap.xml` submitted, and the edge checked — Bot Fight Mode
  off, AI bot policies all Allow, so Bingbot is not turned away from the door
  IndexNow knocks on. Bing's live URL test passes clean; its index-side "DNS
  failure" is a cached artifact from the domain's first days and clears with
  crawling.
- **Cloudflare, 3 Aug 2026**: Always Use HTTPS on (234 plain-HTTP requests
  had been served in the prior day), minimum TLS raised to 1.2, Web Analytics
  reduced to the one JS-snippet counter per the canonical-hostname-only
  decision, and a certificate alert ("night-watcher certificates") now
  emails on Advanced-certificate events.

## [1.8.7] — 2026-08-03

The catalogue's dated facts, and half of a 1.7.5 decision reversed on purpose.

### Changed

- **The Home cards lost their number.** The 1.8.5 soak found the tag crowded
  the description inside its two-line clamp, and Home never needed it — the
  cards are named, and tapping one jumps to the ordering where the number
  means something. 1.7.5's "one number per universe, on both screens" is
  thereby half-reversed, deliberately: **The Path keeps its numbers**, where
  the ordering is load-bearing and the chip is guard 88's subject. The
  completed-universe ✓ moved from the number to the name. The smoke block
  that held both screens to the same number now holds Home to none and The
  Path to all of them.
- ***Clayface* carries its release date** — in theaters 23 October 2026,
  moved from 11 September. The entry had carried no date at all.
- ***The Batman: Part II* carries its release date** — 18 February 2028, the
  July 2026 delay. The slug and year already said 2028; only the prose was
  silent.

### Unchanged, verified against the promotion plan's findings

- ***Caped Crusader* S2 was already right.** The plan flagged it
  conditionally — "if the entry still carries Not out yet" — and the
  condition was false: the entry has read "All ten episodes landed 31 July
  2026", badge-free, since 1 August. Nothing to fix; recorded so the flag
  stops circulating.
- ***Knightfall Part 1*** already carries digital 25 August / disc
  8 September in its entry; the `u` badge drops on the QA 2 watch-list
  trigger, not before.

### Added

- `qa/negative/negtest187.sh` — the two halves of the reversed decision made
  to fail: the number returning to Home, and The Path's numbers going blank.

## [1.8.6] — 2026-08-03

What a crawler that does not run JavaScript sees. Nothing a reader with
JavaScript sees changes at all.

### Changed

- **The crawlable catalogue moved out of `<noscript>` and into
  `<main id="view">`.** Both SEO analyzers skipped the fallback element entirely
  — one reported "no H2 headings" against a page carrying seven headings, the
  other counted nine words against 1,957 characters — because most parsers treat
  `<noscript>` as inactive. The block is the initial content of `#view` now: the
  app's first render replaces it wholesale, so there is no removal code, no
  class machinery and no CSS, and for a reader without JavaScript it is not a
  fallback, it is simply the page. Guard 78's position assertion inverted — the
  block must sit *inside* `#view`, a copy anywhere else fails the build, and so
  does any `<noscript>` returning to the file.
- **The seed now lists the curated route: the 74 entries the app marks
  Essentials or Core**, flat `Title (Year)`, in universe order. Generated from
  the data by the same generator that builds the rest of the block, with the
  tier cut running through the extracted `tierOf()` rather than a copy of it.
  The two 1966 *Batman*s legitimately share a title and a year, so a collision
  carries its sub-title and nothing else does. Optional's 126 entries stay out:
  that long tail is the thing the app exists to make skippable, and all 200
  would put the file 802 bytes over the raw budget — a budget conversation, not
  a seed decision.
- **The seed's one paragraph now says what the page is and links where it
  goes.** The `<title>`'s own words — *Batman watch orders that spoil nothing* —
  appear in the body, and the page's first real anchors carry the three
  orderings and the two other tabs: `#universes`, `#life`, `#release`, `#next`,
  `#progress`. The page had zero anchors before this.

### Added

- **Guard 90 — the seed links carry only known tokens.** Guard 72 froze the
  route vocabulary in 1.7.6 after a deleted `#life` branch survived the entire
  harness; the vocabulary now sits at file scope and both sections read the one
  list. A token renamed in the app cannot quietly leave dead links in the one
  part of the page a non-rendering crawler reads — which is the reason the seed
  got real links instead of five hand-written anchors.
- **The credit, in structured data only.** The JSON-LD `WebApplication` node
  carries `author` and `creator` as the public GitHub handle and `sameAs`
  pointing at the repository. Nothing visible changed — the no-footer-credit
  decision from 1.7.5 stands — and the `application/ld+json` block is not
  executable script, so the CSP hash still covers exactly the one script it
  always did.
- **Smoke +3**: the seed is gone after the first render, its links carry the
  five route tokens, and the titles render before boot — that last one parsed
  with scripts off, which is the entire audience the block exists for.
- `qa/negative/negtest186.sh` — the seed block's guards made to fail for the
  right reasons: a title the data does not have, an emptied `#view`, the block
  escaping `<main>`, a `<noscript>` return, an unknown link token, an external
  link, stripped links, and a boot that never replaces the seed.

### Ops — outside the tree, recorded so QA stops asking

- **Cloudflare Crawler Hints enabled for `nightwatcher.life`, 3 Aug 2026.** The
  IndexNow route: no key file, no served file, nothing for the guards to police.
  Google does not participate; this reaches Bing, Yandex, Seznam and Naver, and
  for a single URL that changes on release it captures the value available. The
  dashboard labels the feature Beta, and enabling it accepts Cloudflare's
  Supplemental Terms for it — both accepted deliberately.
- **GitHub security settings hardened, 3 Aug 2026 — dashboard-side, so this
  entry is the only thing in the tree that can say so.** Now on: private
  vulnerability reporting, the dependency graph, Dependabot alerts with malware
  alerts, grouped Dependabot security updates, and CodeQL default setup on both
  detected languages; fork pull-request workflow approval tightened to all
  external contributors. All additive. Deliberately not enabled, each for its
  cost: required PRs on `main`, signed commits, action SHA-pinning, release
  immutability, AI findings (preview), and Dependabot version updates.

## [1.8.5] — 2026-08-03

The standing decisions stop being prose. 1.8.4 skipped.

### Added

- **Eight decisions that had only ever been written down can now fail.** Each had
  been settled, most of them explained at length in `NOTES.md`, and none of them
  could break a build — which is how they came back up every review.
  - **82** — no `CNAME` in the published directory. Configuring a GitHub Pages
    custom domain writes that file and turns the old origin into a 301 that
    cannot be switched off. A redirect runs no JavaScript, and only JavaScript on
    that origin can read the progress stored there. This was the highest-stakes
    decision in the project and its entire enforcement was memory.
  - **83** — the manifest `id` stays `/Night-Watcher/`. It was in no file
    anywhere. It looks like a path and is an identity key: change it and every
    installed copy is orphaned on the build it last cached. It was changed by
    mistake during 1.8.0 and reverted by luck.
  - **84** — `harley-quinn-season-5-2024` carries `y:2025`, and it is the only
    slug/year mismatch in the catalogue. Guarded as a count, so a real typo in
    some future entry fails too, and so that "fixing" this one trips a build
    instead of renaming a frozen id.
  - **85** — *Static Shock* and *Titans* keep one row each. Splitting either
    spends `i:` slugs, which is the one thing this project does not spend.
  - **86** — eleven numbered eras plus era 0. Era 7 is not being split.
  - **87** — `exportJSON()` carries progress, not settings. A backup restores
    what you watched onto whatever device receives it; it does not reach over and
    change that device's format, scope or theme.
  - **88** — `eraTag()` reads the unfiltered group, so a universe chip describes
    the universe rather than the current scope. Smoke drives the scope switch and
    reads the rendered chip.
  - **89** — `renamed-ids.json` holds exactly one entry. It is the record of a
    single exception taken before public launch, not a mechanism for renaming
    slugs, and the condition it depended on can never be true again.
- **Three decisions that cannot be guarded are written where they will be read.**
  The analytics hostname is a Cloudflare-side setting, recorded in `NOTES.md` as
  unenforceable rather than given a guard that checks a proxy for it. *Super Best
  Friends Forever* joins Joker, OnStar and *Return to the Batcave* as a named
  hard case in the README's inclusion rule — licensed, released, Batman is in it,
  and out because nothing happens in it — where guard 31 already fails if a named
  case vanishes. And "verify a new state from a cold start, never from the state
  that produced it", the rule 1.6.5 earned, goes in the README's release section.
- **The parked work is recorded as parked**, with what a future attempt would
  need: the share card (1.9.0), rating badges, the master chooser.
- `qa/negative/negtest185.sh` — 18 fixtures, one per new guard and per branch of
  the ones that count.

### Fixed

- **The fixture count in `.github/workflows/qa.yml` said 194 in two comments** —
  written during the release that established the number is 192. The count that
  had drifted in prose for six releases drifted once more inside the fix for the
  drift. Both corrected, and the guard that counts fixtures off disk now sweeps
  the workflow as well as the README. `CHANGELOG.md` and `NOTES.md` are swept for
  nothing on purpose: both are records, and a history that updates itself is not
  a history.
- **The negative suites run concurrently**, one per core, instead of one after
  another. 456s serial to 354s on two cores here; the floor is the slowest single
  suite, so a four-core runner lands near two and a half minutes.

  The loop was the easy half. Every suite computes its scratch tree as
  `$NEGDIR/tree` and `run-all.sh` exported one `NEGDIR` for all of them — fine
  and invisible while serial, and eighteen suites unpacking eighteen
  differently-mutated trees over each other the moment it was not. Each suite now
  gets its own directory. `NEGJOBS=1` forces the old serial behaviour.

  A `--only <section>` flag for `guards.js` was measured and not built. It looked
  like the bigger win and is not: a whole guards run is 0.40s, of which 0.13s is
  node starting and parsing two large files and only 0.27s is the 89 sections
  themselves. 188 of the 210 fixtures target guards and 22 target smoke, and
  smoke costs 21s a run — so the smoke fixtures are 10% of the fixtures and 84%
  of the clock. A perfect `--only` saves about 9%, in exchange for restructuring
  a 170 KB script whose sections are not uniformly wrapped. The numbers are in
  NOTES.md; if the suites ever need to be faster, the lever is smoke.js.
- **The nightly run and push runs no longer cancel each other.** They shared a
  concurrency group, so a 03:17 UTC run and a late upload could each kill the
  other. The nightly exists to fire when nobody is pushing, so `event_name` is
  now part of the group.

## [1.8.3] — 2026-08-03

The first independent QA round against the launch tree, worked through.

### Fixed

- **Searching for `%%COUNT%%` no longer breaks the search box.** The match count
  is rendered above the group list but cannot be built until the groups have
  been counted, so the head carried a `%%COUNT%%` marker that was replaced once
  the total was known. The search input echoes what you typed and renders above
  the groups, so typing that literal made the input's own `value` attribute the
  first occurrence: the count paragraph closed the attribute early and hung its
  own attributes on the search box. The head and the body are now separate
  strings, joined in order. No marker, nothing to collide with.
- **A deep link's scope is applied before the ordering that reads it.**
  `#life-series` ran `revealHero()` under the persisted scope and only then
  switched to series, so it could clear the collapsed flag on the wrong group.
  Scope tokens now run in their own pass first, and `#life-series` and
  `#series-life` do the same thing.
- **`S.confirmReset` is declared in the state literal** instead of relying on
  undefined being falsy, like every other key.

### Changed

- **The negative suites run in CI.** They were gated behind
  `if: github.event_name == 'pull_request'`, and releases here ship by uploading
  the tree — a direct commit to `main` — so pull requests essentially never
  happen and the job had almost certainly never run. They now run on every push
  and again nightly, with a concurrency group so a second upload cancels the
  first. Measured cost: about eight minutes for 192 fixtures.
- **The suite counts in the README are counted by the suites.** `smoke.js`
  asserts its own total against the README at the end of its run — call sites
  cannot be counted statically, because many checks run inside loops — and
  `guards.js` counts the negative suites and fixtures off disk. The stated
  smoke count had drifted twice (79 where it was 231, then 242 where it was
  262), and the fixture total turns out to have been reported as 194 when it
  was 178, because the `run_case()` definition at the top of each suite was
  being counted as one of its own fixtures.
- **Two descriptions stop saying what happens.** Justice League season 2 no
  longer says the Starcrossed finale "breaks and remakes the team"; Justice
  League Unlimited season 2 describes the Cadmus arc instead of resolving it.
- **The Clayface entry no longer says the part is uncast** — true today, and
  dead the day an announcement lands. "Gotham with no Batman in it yet" already
  carries it.
- **The no-third-party-code promise carves out the analytics beacon** it already
  discloses two sections earlier, and which `guards.js` already allowlists by
  name.
- **One hero header, not two.** `viewHome()` and `viewNext()` built the same
  seven lines separately.
- **`NEVER_CACHE` in `sw.js` says why it looks dead.** It is unreachable only
  because the beacon is cross-origin and the fetch handler returns on that
  first; serve the beacon same-origin and the list becomes load-bearing again.

### Added

- **The era-note spoiler rule, written down.** Two QA rounds asked whether era
  notes are held to the entry rule — who is in it, never what happens to them.
  They are not, and now that is a sentence: an era note may state the premise of
  the period but may never name an event from inside a specific entry. Guard
  section 81 fails on a quoted episode title or an entry title inside an era
  note.
- **Guard section 79** — no marker of the `%%NAME%%` shape may exist, and no
  view builder may call `replace()` with a string literal on markup it
  assembled. Smoke drives the old marker through the search box.
- **Guard section 80** — the progress ring's circumference is read back against
  its own radius, in the markup and in the script that animates it. 119.4 is
  2πr for r=19 and it lived in two places with nothing tying them to the circle.
- **Guard section 72** now observes the order route tokens are applied in,
  rather than only that each one routes.

## [1.8.2] — 2026-08-02

### Changed

- **Home's cards say what each one is.** A card carried a name, a number and a
  progress bar, which told you how far through something you were without
  telling you what it was. Every card now carries the first line of the group's
  own note — the same string The Path shows, shortened, so there is still one
  description per group rather than two to keep in step.

  Clamped to two lines, so one long note cannot set the height of every card in
  its row. Cards go from 98px to about 129px: a description is not free, and
  three lines was a third more scrolling than this catalogue can afford.

### Fixed

- **A restore now says when the code it was given was cut short.** A code
  chopped by a chat client or a message length limit still parses, still looks
  like a code, and quietly restores a fraction of what was sent — which is the
  exact failure the restore-link ceiling exists to prevent, and the one thing a
  restore could not tell you about. Every truncation that loses an entry is
  reported now, and the banner says the link looks cut rather than short.

  Guards section 8 chops the code sixty-eight different ways and fails if any of
  them loses an entry silently.

## [1.8.1] — 2026-08-02

Launch tidying: one address in search, something for a crawler to read, and the
one frozen slug that was wrong.

### Changed

- **A slug was renamed, for the first and only time.**
  `the-super-powers-team-galactic-guardians-198-1985` dropped the 5 from 1985;
  every sibling is `title-YYYY-YYYY`. It is now
  `the-super-powers-team-galactic-guardians-1985-1985`.

  Renaming a slug voids whatever was ticked against it and breaks that entry in
  every backup code already written — which is the entire reason the frozen-ID
  rule exists. It was done now because the app is not yet publicly launched, so
  the population that loses anything is small enough to name, and this was the
  last moment it cost almost nothing. **The window is closed.** The rename is
  recorded in `qa/renamed-ids.json` with its reason, `--bless` cannot launder
  it, and guards section 2 fails if the old name ever reappears or the new one
  is not there.
- **`workers.dev` no longer serves.** The preview hostname carried the whole app
  and was indexable, so the site competed with itself in search. There is
  nothing to consolidate if there is nothing there.
- `SECURITY.md`, `README.md` and the weight figure follow.

### Added

- **A crawlable catalogue.** Everything this app renders is written by
  JavaScript into an empty `<main>`, so a crawler that does not run it saw the
  shell and nothing else. A `<noscript>` block above that `<main>` now names all
  eleven eras and all forty-four continuities, with the headline counts.

  It is generated from the data rather than typed, and guards section 78
  rebuilds it on every run and compares — a hand-written list of fifty-five
  names would be stale within a release and nobody would notice, because nobody
  reads it. `npm run bless` writes it.
- **An off-canonical origin asks not to be indexed.** The canonical link already
  points every origin at the apex, which is how search consolidates. GitHub
  Pages has to keep serving — it is the only place old progress can be read —
  and it cannot send headers, so the app injects
  `<meta name="robots" content="noindex, follow">` when it notices it is not on
  the canonical origin. `follow`, so the links out of it still count.

## [1.8.0] — 2026-08-02

**Night Watcher lives at [nightwatcher.life](https://nightwatcher.life/).**

The old GitHub Pages address still works and always will. That is not
sentiment: progress is stored per-origin, so only JavaScript running on that
origin can ever read what is saved there. Opened at the old address, the app
offers to carry your progress across.

### Changed

- **The canonical origin is `nightwatcher.life`**, served by Cloudflare Workers.
  Canonical URL, `og:url`, both images, all three JSON-LD nodes, `SITE`,
  `robots.txt`'s sitemap line and `sitemap.xml`'s `<loc>` all name it.
- **The manifest's `id` deliberately does not move.** It reads
  `/Night-Watcher/` and will keep reading that. It is an identity key rather
  than a path that has to resolve, and changing it makes a browser treat the
  updated manifest as a different app — which would orphan every PWA already
  installed from the old address, in exchange for nothing.
- **The old address is not given a custom domain, deliberately.** Configuring
  one on GitHub Pages replaces the site with a 301 to the custom domain and
  cannot be switched off. A redirect runs no JavaScript, and JavaScript on that
  origin is the only thing that can read the progress stored there — so every
  reader who had not already moved would have been permanently separated from
  their own data, still on their disk, unreachable. Both addresses serve this
  same tree instead.
- Cloudflare Web Analytics now counts the canonical hostname. Visits to the old
  address are not counted; it is a waiting room rather than a destination.
- `SECURITY.md` no longer says security headers are impossible. Workers can set
  them; Pages cannot, and that address is out of scope for header reports.

### Added

- **The move offer.** On any origin that is not the canonical one, the app shows
  a banner naming the new address, and — when there is progress to carry — a
  link that carries it. The link is built from `SITE`, not from
  `restoreLink()`, which uses `location.origin` and would have pointed back at
  the address being left: a link that looks right and does nothing.

  It renders above every tab, because a shared `#life` link lands on The Path
  and a reader who never opens Home would never be told. It is conditioned on
  where the page is running rather than on a date somebody has to remember, so
  it still works for whoever returns in three years. Dismissing it lasts the
  session.
- Guards section **77**, which holds all of that. The offer is invisible on the
  canonical origin and therefore invisible in every screenshot anyone will ever
  take of this app, so it is checked rather than looked at: the link comes from
  `SITE`, it carries a code, the condition is the origin and not a date, and
  `offCanonical()` is executed against four real origins. `qa/smoke.js` boots a
  document on the old address and reads what a returning reader would see.

## [1.7.7] — 2026-08-02

Home stops disagreeing with the path you chose, and the backup code stops
carrying every rated entry's identifier twice.

### Changed

- **Home reflects the path you are on.** It always drew the universes, whatever
  you had chosen — so a reader on Bruce's life got a dashboard about a different
  ordering, and tapping a card on it moved them into By universe and raised the
  borrowed-view banner. Nobody asked to view anything by universe; they tapped a
  card on their own home screen. The grid is the eras for Bruce's life, the
  universes for By universe, and the decades for Release order, built by the same
  function The Path uses. Tapping a card now changes nothing but where you are.
- **The grid says what it holds**, and carries the same one-line description The
  Path shows, from the same string. No new copy was written.
- **The scoreboard is a Progress metric and lives there.** Home already carries
  the completion ring in the header and three tier meters under the hero;
  Watched / To go / Skipped was a fourth statement of the same thing.

### Fixed

- **The worst-case restore link was 2,254 characters against a working ceiling
  of about 2,000**, where chat clients and QR readers begin truncating. Ratings
  were more than half the payload, and almost all of that was the watched
  entries' identifiers written out a second time. **Backup codes are now NW3**:
  a rating is one character, positioned against the watched list. Worst case is
  **1,255** — room for roughly 124 more entries before the ceiling matters
  again. A code where nothing is rated is the same size it always was.
- **A backup code carries entries this build has never heard of.** `exportCode()`
  walked the catalogue, so a slug merged in from a newer build's JSON survived in
  storage and in a JSON export but vanished from a code — while the restore toast
  said entries were kept. Codes walk your progress now, not the catalogue, so a
  newer build can restore what an older one could only hold.
- A rating can outlive its watch, because unticking clears the tick and leaves
  the star. Those ratings get their own `O` segment rather than being quietly
  dropped by the positional list.

**Codes already in circulation still restore.** NW1 and NW2 are read the way
they were written; the format version decides how the rating segment is parsed.
A code from a version this build has never seen still restores everything it
recognises, which is what the tolerance was built for.

### Added

- Guards section **76**: Home and The Path group the same way. The bug above
  existed because nothing said the two screens had to agree.

## [1.7.6] — 2026-08-02

Backlog. Four things 1.7.5 said it would do and did not, and one exclusion
re-checked before the tag.

### Fixed

- ***The Comic Adaptations* lists its one real pair the right way round.**
  *Death in the Family* comes before *Under the Red Hood*, which is what their
  life positions have always said and the order the two were made to be watched
  in. The group is exempted from the era-direction guard as a weave, on the
  recorded ground that its order is deliberately the life order; that one pair
  made the reason untrue.
- **The filter chips and the All button are 44px tall**, not 34. The stars have
  carried a 36–44px target since 1.4.x and the ticks were given a hit area in
  1.7.5; these were on the same list and were missed.
- **Guards section 15 warns when a `<meta>` count stops being stated at all.**
  Every sub-check was `if(got)`, so rewording a count out of the sentence left
  the section verifying nothing and reporting success — the counts-in-prose
  failure, inside the thing that watches for counts in prose.
- **`qa/smoke.js` decides its exit code in one place.** It was set inside the
  third document's load handler, so a run that printed failures could still exit
  0 if that event never fired. A watchdog and an exit hook now report the same
  way if the run never reaches the end.

### Added

- **The negative test suites are in the repository.** Twelve suites, 155
  fixtures, at `qa/negative/`, with `run-all.sh` to drive them. Each one breaks a
  guard on purpose in a throwaway copy of the tree and asserts it goes red for
  the right reason — including the two that kill the mutations the independent QA
  of 1.7.2 got past every guard and every smoke check. They had only ever existed
  outside the project, which meant nobody could review them and CI could not run
  them. A pull-request-only CI job runs them now; pushes to `main` stay fast.

### Changed

- **`LICENSE` carries the canonical AGPL text**, verbatim from gnu.org. The
  shipped copy had been reflowed, and the licence's own terms say changing it is
  not allowed. The `WHAT THIS COVERS` preamble above the divider is ours and
  stays.

### Removed

- **The source link in the home footer.** 1.7.5 added it because the AGPL's own
  how-to *suggests* a Source link for web applications. Suggests is all it does.
  The only links this app has ever had are the where-to-watch searches on each
  entry — links that go where the reader asked to go. Chrome does not get to
  send anyone anywhere. The repository URL stays in the served file's header
  comment, where it has always been, and `LICENSE` ships whole with the page.

### Checked, unchanged

- ***Lanterns*** (premiered August 2026) and ***My Adventures with Superman***
  season three both still have no Batman and no Gotham. Both exclusions hold.

## [1.7.5] — 2026-08-02

Every open item closed in one build: the 1.7.2 soak register and an independent
QA audit, folded together. **1.7.3 and 1.7.4 do not exist** — the audit ran
against the 1.7.2 tree rather than after the register was cleared, so the two
rounds collapsed into this one. The gap in the numbering is deliberate.

One `i:` slug was removed, the first in the project's history. Everything else
anyone has ticked is where they left it.

### Removed

- ***Scooby-Doo! and Krypto, Too!* is gone from the catalogue.** No Batman, no
  Gotham, no Gotham character — the vanished League is Superman, Wonder Woman,
  Aquaman, Flash and Hawkman, and Mystery Inc. investigate alone. It failed the
  README's own inclusion rule on every clause. Anyone who had ticked it loses
  that tick, which is the cost of the catalogue matching the rule printed on its
  front page. The slug is recorded in `qa/retired-ids.json` with the reason, and
  guards section 2 now refuses to let `--bless` quietly drop a slug that is not
  listed there — or to let a retired one come back.
- `scopeNote()` and the unreachable branch of `scopeSwitch()` that called it.
  The copy it produced stopped rendering when the switches moved into the
  chooser, and the guard section testing it had found a real bug nobody could
  see.

### Added

- **Three entries the inclusion rule always admitted.** The *Harley Quinn*
  Valentine's Day special (2023), *Gotham Girls* (30 shorts, 2000–2002, with the
  DCAU cast reprising) and *DC Showcase: Catwoman* (2011, continuing Selina's
  thread from *Year One*). All three are Gotham stories with no Batman in them,
  which is the basis *Catwoman: Hunted* is already here on. *Super Best Friends
  Forever* was considered and declined under the same clause that removed Krypto.
- **The Arkhamverse gets its own group.** *Assault on Arkham* is the only screen
  entry of a real, named continuity and had been shelved with the films connected
  to nothing.
- **Teen Titans splits from Teen Titans Go!** Two continuities that shared a
  shelf, and a note that admitted it. The crossover film goes to Go!, which is
  where both halves are present.
- Four guard sections. **71** checks tier resolution against named entries;
  **72** freezes the eight shareable link tokens and drives every one of them;
  **73** measures the worst-case restore link and ratchets it; **74** requires
  the version history to run one way.

### Changed

- **The Adam West Universe folds into Batman '66.** One continuity that had been
  two groups with two names, kept apart only because one half is live action.
  Per-entry `fmt` has existed since 1.7.1, so the split bought nothing.
- **The number on a universe means the same thing everywhere.** Home printed its
  position in the catalogue while The Path printed the era its story starts in.
  Home follows The Path.
- **A deep link can no longer overwrite your saved scope.** `#universes-series`
  set the scope without marking it a preference, and the next save — from ticking
  anything at all — wrote it as though you had chosen it. Scope now has the saved
  twin the path has always had.
- **Sixteen group notes rewritten.** The DCEU note said Ben Affleck plays Batman
  when *Birds of Prey* has none and *The Flash* has Keaton's; the Columbia
  serials were "two wartime-era" with one made four years after the war; Batman
  Unlimited was "a trilogy" with four entries; the Tomorrowverse claimed Jensen
  Ackles "throughout" a run whose opening films have no Batman at all.
- **Era 11's note comes under the spoiler rule.** "An era may say who is in it,
  never what happens to them" had only ever been applied to names.
- Data corrections: *Batwheels* season three is **19 episodes**, not 9, and is
  finished; *Batman Unlimited* has 33 shorts, not 27; *Teen Titans Go!* is past
  440, not 400; *Mechs vs. Mutants* rejoins its own trilogy in era 4; the
  *Mad Love* accolade was an Eisner and a Harvey, for the comic, not an Emmy;
  *Batman vs. Two-Face* was Adam West's final performance **as Batman**.
- Eight R-rated films gain the mature badge, including two that called themselves
  R-rated in their own descriptions. Three features stop wearing the short badge.
- The README's chronology had been printing the pre-1.7.2 era scheme — ten eras
  where eleven ship, under two names removed for spoiling what happens in them.
  Guards section 14 now checks era names against `ERAS`, not just counts.
- The README's inclusion rule grows the exception the catalogue has always
  followed: an entry with no Batman and no Gotham is admitted when it is a link
  in a continuity that is here for Batman, and its description has to say he is
  not in it.
- Guards sections 24 and 50 extract `yearSpan()`, `clampRating()` and
  `markWatched()` instead of hand-writing them. The file's own header promises
  every function under test is extracted; two had drifted.
- `LICENSE` pins `AGPL-3.0-only` explicitly, names the icon in what it covers,
  and the app footer now links to the source.

### Fixed

- The search-everything count ignored the format filter, so it could offer to
  find entries the next screen would not show.
- The focus-restore whitelist carried a key no button uses and was missing the
  path, format and theme buttons — keyboard users lost focus to the page body
  after activating any of them.
- `?utm_source=…` was dropped when a restore banner was answered.
- A restore link carrying nothing offered to restore "0 entries".
- The service worker's cache write was outside the chain that catches it, so a
  full quota surfaced as an unhandled rejection.
- Group headers slid under the header for storage-blocked users, whose header is
  a line taller.
- The backup code box had no accessible name; the ticks had no hit area beyond
  their drawn size.

## [1.7.2] — 2026-08-02

The eras redesigned, three quarters of "outside any timeline" given a real
place, and the universes put in the order their stories start.

No `i:` slug changed. Nothing anyone has ticked has moved.

### Changed

- **Outside any timeline goes from 49 entries to 14** — a quarter of the
  catalogue to seven per cent. It had been doing three jobs: the entries with no
  place, the ones not decided yet, and — the bulk of it — entries filed there
  because they were jokes rather than because their place was unreadable. *The
  LEGO Batman Movie* has Dick Grayson adopted and made Robin on screen; that is
  the Grayson years whatever else the film is doing.
- **The era scheme is redesigned, not extended.** Eleven eras instead of ten.
  *Before the cowl* becomes **Before Batman** — no entry was ever about training,
  and it now holds Alfred, the night the Waynes die, and a boy. *Year one and
  two* becomes **The early years**, which closes the year-three gap without
  adding an era. *Losing Jason* merges into **Rebuilding**. The League years
  split into **The League years** and **The Watchtower years** on one checkable
  line: is a Robin or a Batgirl on screen as his working partner. And a terminal
  **After the cowl** holds the three Gothams where Bruce is gone.
- **An era name may say who is in it, never what happens to them.** *Losing
  Jason* spoiled the death in its own header, and *Broken and rebuilt* spoiled
  Bane in its note. Both are gone. The rule is written down.
- **Rebuilding describes a stage rather than a cast list.** It read "Tim and
  Barbara around", which left Batwheels — Duke Thomas as Robin, Cassandra Cain
  as Batgirl — matching no era in the scheme despite showing its shape exactly.
- ***Joker* and *Folie à Deux* enter the life.** *Joker* is set in 1981 and the
  Waynes are murdered at its climax; *Gotham* opens on that murder. Pennyworth,
  Joker, Gotham is the cleanest hand-off in the catalogue.
- **The universes run in the order their stories start.** Gotham rendered 37th
  of 42 and the first Batman ever filmed rendered 35th, while a continuity
  beginning in the League years rendered 5th. Within a band the curated order
  stands, so the DC Animated Universe still leads the universes that begin in
  the early years.
- **The by-universe number now means something.** It was the universe's position
  in a list you were already looking at, and it renumbered every time the
  catalogue grew. It is the era the universe starts in — the same number the
  life path uses, and the reason the list is in the order it is.
- **Bruce's life is the first card.** By universe is the completist's path: it
  opens on Alfred in 1960s London, which is right for the reader who chose it
  and strange for the reader who has not chosen yet. Both path descriptions
  rewritten.

### Fixed

- **Names that were not the names.** *Elseworlds & One-Offs* collided with DC
  Studios' own Elseworlds banner and is now **Standalone Films**. *The Dark
  Knight Saga* is **The Dark Knight Trilogy**, *Superman / Batman* is the
  **Superman/Batman Duology**, *The Epic Crime Saga* gets the word that
  identifies it. Four shelves stopped posing as universes. *The Brave and the
  Bold* is disambiguated by year before the DCU film of that title arrives.
- **Copy that described things that are not in the film.** *Suicide Squad
  Isekai* said Batman appears; he never does — Katana takes Harley down in the
  Gotham prologue. *Creature Commandos* said Batman apprehends Doctor
  Phosphorus; he is a silhouette over a skylight and the arrest is never shown.
  The LEGO Batman home release carried four bonus shorts, not three.
- **The LEGO direct-to-video line was two continuities.** The 2013 film adapts
  the video game, shares no cast with the nine that follow, and is the only one
  whose Robin is Tim Drake rather than Damian.
- *The Doom That Came to Gotham* and *Legends of the Superheroes* return to the
  timeline. Both were filed outside on tone in 1.7.1 — one has Dick Grayson as
  Bruce's ward, the other has Adam West and Burt Ward in a Hall of Heroes.

### Added

- **Section 69 — the universes run in the order their stories start.** The
  by-universe order has never had a stated principle, which is why every
  continuity added landed wherever it was typed.
- **Section 70 — an entry outside the timeline says why.** Fourteen entries, five
  reasons: the Batman is not Bruce, more than one Batman, no Batman at all, no
  state asserted, or a continuity whose place is not decided yet. An
  undifferentiated bucket is what let the tone-filings hide in the first place.
- **The era-direction guard skips entries with no position.** Era 0 is the
  absence of a place, not a late one; a continuity running era 3 → era 0 → era 3
  has not aged backwards.

### Note

The rating badges are still parked. A "kids" grouping was considered and
rejected: it would be a fourth grouping axis competing with the rating badges
already scoped, and the Rebuilding rewrite lands Batwheels without one.

## [1.7.1] — 2026-08-02

Bruce's life is a timeline now. Six independent audits of the ordering, and the
worst thing they found was a live-action film wearing an ANIMATED badge.

No `i:` slug changed. Nothing anyone has ticked has moved.

### Fixed

- **Clayface was served as animated and vanished under the Live action filter.**
  It shipped that way in 1.7.0. Format was a property of the *group*, and The DCU
  holds Creature Commandos (animated) and Clayface (live action) — the catalogue's
  first mixed-format continuity, which the data model could not express. An entry
  may now state its own format, and guard 51's neighbour checks the override.
- **The Comic Canon spoiled its own biggest twist.** *Death in the Family*
  rendered before *Under the Red Hood* — and it reuses that film's animation as
  stock footage, replaying the Jason-is-the-Red-Hood reveal that the earlier
  film's title exists to withhold. On the path whose promise is that nothing
  spoils anything ahead of it.
- **An unrelated Constantine film sat between the two halves of one adaptation** —
  *The Death of Superman* and *Reign of the Supermen*.
- **The DC Animated Universe's note described an order the array did not
  implement.** It says to run The New Batman Adventures and then detour into two
  Superman episodes; the array put three Superman entries first. *Mask of the
  Phantasm* now drops in around season two, which the note has always claimed.
- **Kite Man rendered after the season its own description says it sets up.**
- **The Batman Unlimited shorts sat inside the trilogy**, between films two and
  three. Added there in 1.7.0.
- **Birds of Prey sat two films from Suicide Squad**, which it directly
  continues — the placement 1.7.0's release note argued for and did not make.
- ***The Batman vs. Dracula* moved behind season three**, which is where the
  Ventriloquist gets committed to the Arkham the film shows him in.
- **Darwyn Cooke's Batman Beyond short was the last row of the entire life
  path**, after the film the catalogue calls the end of Bruce's story.
- **Teen Titans: Trouble in Tokyo was orphaned from its own series** by 1.7.0.

### Changed

- **The life path is chronological within an era, not just between eras.** Every
  entry in a life era carries its position, and continuities blend: *Year One*,
  *Batman Begins* and *Gotham Knight* are three continuities and three
  consecutive rows. Until now an era rendered in the order its continuities were
  typed into the file, which with 62 entries in one era read as noise.
- **Era 0 no longer sorts by release year.** That shipped in 1.7.0 and it smeared
  the ten-film LEGO line across 31 slots, putting *The LEGO Movie 2* twenty-one
  rows after *The LEGO Movie*. Its entries have no position in a life — what they
  have is a watch order inside their own continuity, and year-sorting was the one
  operation guaranteed to destroy it.
- **Twenty-six entries changed era.** *Aztec Batman* went back outside the
  timeline — its protagonist is Yohualli Coatl, not Bruce Wayne, which is the same
  test that already puts *Gods and Monsters* there. *The Doom That Came to Gotham*
  followed it. The DC Animated Movie Universe's later films moved to the Damian
  years, where their own published order puts them. Harley Quinn's Gotham moved
  there too: its Robin is Damian, and Tim Drake — half of what the Rebuilding era
  is named for — never appears in it.
- **Three live-action shows left "The last years."** Batwoman, Birds of Prey
  (2002) and Gotham Knights are Gothams after Bruce, ending him three
  incompatible ways. A shared absence is not a life stage.
- **Six continuities are marked as having no order at all**, and say so in their
  own notes. There is no story order between *Gotham by Gaslight* and *Assault on
  Arkham* because there is no shared story, and the by-universe path had been
  claiming one.

### Added

- **Guard 51 covers every continuity.** Written in 1.7.0 as *an arc may advance
  through eras and may not go back*, and pointed at one continuity out of 42 —
  while five others ran backwards, including the sixteen-film run that rendered
  Damian's death before his introduction. Bags are exempt because they have no
  arc; three weaves are exempt by name, with the reason written next to each,
  because they interleave several arcs on purpose.
- **Section 68 — the life path is a timeline.** An era is fully positioned or not
  positioned at all, positions run 1..n, and no two entries share one. Era 0
  carries none by design.
- The live-action floor was set to twelve when 1.5.0 shipped twelve. There are
  thirty.

### Note

The rating badges are still parked. This release was catalogue accuracy, which
is what the owner asked for.

## [1.7.0] — 2026-08-02

The catalogue release. **168 entries to 198**, 33 continuities to 42, and the
catalogue no longer starts in 1966.

A MINOR bump by this file's own rule: additions only. Not one `i:` slug changed,
so no saved progress moves and every backup code ever issued still restores.

### Added

**Nine new continuities.** The Columbia Serials, Gotham, Pennyworth, Titans,
Batwoman, Live-Action One-Offs, The Joker Films, Robot Chicken DC Comics, and
DC Super Hero Girls.

**The first two Batmans anyone ever filmed.** *Batman* (1943) and *Batman and
Robin* (1949) — Columbia, fifteen chapters each, Lewis Wilson and Robert Lowery.
The catalogue started in 1966 because nobody had revisited the start date, not
because a line had been drawn there. The release view gains a forties and a
fifties to hold them.

**Live-action television, which the catalogue had almost none of.** Gotham (100
episodes), Batwoman (51), Titans (49), Pennyworth (30), Birds of Prey (2002,
13), Gotham Knights (2023, 13), and the 1966 Adam West series itself (120) —
which had somehow never been in a catalogue that carried its film.

**Films with Batman in them that were not here.** *Suicide Squad* (2016), where
he is in three sequences; *Zack Snyder's Justice League*; *Birds of Prey*
(2020); *Joker* and *Joker: Folie à Deux*; *Clayface* (23 October 2026) and
*The Batman: Part II* (18 February 2028).

**Six sets of shorts, and the inconsistency they close.** The catalogue already
carried *Batman: Strange Days*, a three-minute DC Nation short — and excluded
Darwyn Cooke's *Batman Beyond*, made the same year for the same anniversary
slot. Both are here now, with Batman of Shanghai, the Justice League Action
shorts, the Batman Unlimited web shorts, the Gods and Monsters Chronicles and
the LEGO Batman bonus shorts. One entry per set.

**Also:** Batwheels Season 3, DC Super Hero Girls and its Teen Titans Go!
crossover, and the three Robot Chicken DC specials.

**A written rule for what belongs here.** `README.md` now carries it: Gotham's
stories, whether or not the cowl is in them — licensed, released, and a story.
It has to answer the Joker films, the OnStar commercials and *Return to the
Batcave*, and it does.

### Fixed

- **Batwheels Season 2 was recorded as 20 episodes. It is 37.** Episodes 21–37
  landed in December 2024, after the entry was written.
- **The Dark Knight Rises sat in "Year one and two."** It opens eight years
  later with Bruce retired and his back broken, and era 6 is named *Bane, the
  back, and the replacement who did not know when to stop.* Moved to era 6,
  where it joins the Knightfall trilogy.
- **Soul of the Dragon was the only entry in "Before the cowl,"** and does not
  belong there — its present day has Bruce already operating; the training is
  flashback. Moved to era 2. Era 1 is now Gotham and Pennyworth, which is what
  that era was always for.

### Changed

- **Twenty-five entries left era 0 for the life path.** Super Friends and The
  Brave and the Bold to the League years; Harley Quinn to Rebuilding; Filmation,
  the 1966 material and Teen Titans (2003) to the Grayson years; Gotham by
  Gaslight to Year one and two; The Doom That Came to Gotham and Aztec Batman to
  Before the cowl; both Ninjaverse films to the League years.
- **Era 0 now reads by year.** It is the one era with no life to be ordered by,
  so grouping it by continuity was ordering it by nothing.
- **Guard 51 no longer requires the Nolan trilogy to sit in one era.** The rule
  was "a continuous arc gets one era", which no other continuity in the
  catalogue follows — *The Batman* (2004) spans three and the DCAU spans five,
  because an era is a life stage and a long story moves through them. It now
  requires direction instead: an arc may advance through eras and may not go
  back. It also identifies the trilogy by name rather than by group number,
  which moved in this release and would have left the check finding zero films.

### Note

The rating badges are **not** in this release. Replacing Mature and Kids with
MPA ratings for films and TV Parental Guidelines for series needs a sourced
rating for all 198 entries and a badge whose width varies for the first time.
That is 1.7.1, with its own pass. Doing it here would have meant designing badge
shapes against a catalogue that was changing underneath them.

`docs/index.html` is now 130 KB raw / 39 KB gzipped, against a budget of 150 /
50. Thirty more entries fit; a hundred do not.

## [1.6.6] — 2026-08-02

House-keeping, from an independent audit of everything except the page.

### Changed

- **Recent activity holds three rows, not five.** Measured at 390px with eight
  entries watched: at five it was 262px against the queue's 191px — history
  outweighing the queue on the tab that exists for the queue. Four was still
  26px ahead. Three is the first value where the queue wins. The rateable window
  shrinks with it, which `NOTES.md` now says out loud.
- **The four explanatory HTML comments in the head moved to `NOTES.md`.** The
  no-comments policy had only ever been enforced against `/* */`, so about 950
  bytes of explanation shipped in a file that claimed to carry none. The notice
  about marks and lettering stayed — it is a statement about the file, not an
  explanation of the code.
- **The reformat pass the 1.6.4 audit asked for is finished.** Its flagship
  example — a statement joined onto `if(!f) continue;` by 26 spaces — and eleven
  more lines of stranded indentation left by the 1.6.3 comment strip.
- `wrangler` reviewed and deliberately kept; the reasoning is in `NOTES.md` so
  the question does not come back without an answer.

### Fixed

- **`sw.js` never cached `icon-maskable-512.png`.** It has been served and named
  in `manifest.json` since 1.5.x. An Android icon refresh while offline fell
  back silently, and only for people who installed before the icon existed.
- **Two guards could not fail as named.** Section 28 asked whether the file
  mentioned `applyTheme()` — which the definition line does, so deleting every
  call site still passed. Section 8's forward-compatibility tests ran against a
  code with no path segment in it, because the sandbox never chose a path: the
  strip was a no-op, the older-reader test re-parsed what section 7 had already
  checked, and the unknown-version half had never once run.
- **The smoke test for unknown titles used a title in the catalogue.** "Batman"
  is in it twice, so the branch the check is named after was never exercised.
- **Guards section 48 was an empty header.** Its checks sat a thousand lines
  below, past the guard that validates the numbering — so the INDEX pointed at
  an empty room and section 66 was satisfied by the sign on the door.
- The Case closed card said the same number twice, in the heading and again in
  the line under it.
- A dead `repath` handler, an unreachable second `jump` branch, and two CSS
  declarations that nothing could reach.

### Added

- **Section 67 — the dates say when the page actually changed.** `sitemap.xml`
  and the JSON-LD were guarded against each other from 1.6.2, which catches a
  typo and nothing else: leave both alone through a release and they agree
  perfectly and are both wrong. Both are now anchored to the newest CHANGELOG
  date, which section 16 already ties to `BUILD`. Two unnumbered copies of the
  weaker check lived at opposite ends of the file; this section is both of them.
- **Section 13 now diffs the offline shell against what `docs/` serves**, with
  the crawler-facing exclusions named, so an omission is a decision rather than
  an oversight.
- **Section 66 fails an empty section and a rotted INDEX** — a header with no
  assertion under it, a group heading used twice, a group with nothing in it.
  The INDEX had `META` three times, twice with nothing under it.
- **Guard 65 counts HTML comments**, against an allowlist that names each
  survivor, so a fifth cannot arrive quietly.
- Section 8 now checks that a code's path segment actually restores the path.
  Nothing had ever asserted that.

### Note

Eight negative tests, and two retired: guards section 58's row ceiling and the
duplicate `.linkrow` and `.pathseg` assertions were subsumed by checks that
already ran, and a check that cannot fail is not coverage. Both suites green,
all seven negative suites re-run.

The one thing this release does not do is the mutation run for the negative
fixtures retired in 1.6.3 and 1.6.4. That is deliberate: it belongs before the
catalogue release, not inside a release that is also changing the harness.

## [1.6.5] — 2026-08-01

A restore link works on a new phone again.

### Fixed

- **The restore-link banner never appeared on a device with no path chosen** —
  which is the only device a restore link is for. 1.6.4 put the ask-first banner
  after Home's first-run branch returns, so opening a link on a new phone did
  nothing visible at all: the hash was consumed, the code was parked, and the
  reader saw the ordinary chooser.

  Worse than silent. Picking a path to get out of that screen finally showed the
  banner — and by then accepting it **discarded the path the link was carrying**,
  because a code's path is only adopted when none is set.

  The banner is one function now, rendered on both halves of Home, and it says
  when a link is bringing a path with it. Accepting on a fresh device keeps it.
- **An unanswered link no longer dies on reload.** The hash was stripped the
  moment it was parsed, so a reader who missed the banner and refreshed lost the
  payload with no message. It stays in the address bar until the banner is
  answered.
- **The header claimed 65 guard sections; there were 66.** Guarded now, against
  both places it is written. The README's counts have been checked since 1.5.x —
  a number in prose is a number that drifts, and this one was wrong the release
  after it was written.
- `.arow .tick` carried `grid-row` for two releases after the row became flex.
- The seams the comment extraction left: two statements sharing a line, an
  irregular run through the palette, and sixteen lines still indented for a
  comment block that is no longer above them.

### Added

- **The test that would have caught this one.** The old case set a pending
  restore with a path already chosen — the single state where the fault is
  invisible. The new one starts cold: no path, no marks, a code carrying both,
  and it checks the banner appears, that accepting lands the marks *and* the
  path, and that declining leaves the device untouched.
- A guard that the banner reaches both branches of Home.
- Three known blind spots written into `NOTES.md`: the dead-rule sweep reads
  selectors and not declarations, cross-tab merging only ever adds, and a parked
  restore link is deliberately session-only.

### Changed

- The progress donuts tell a screen reader where the keyboard route is, rather
  than presenting slices it cannot operate.

## [1.6.4] — 2026-08-01

Last of the small ones.

### Fixed

- **The queue was still printing the year twice.** 1.6.3 fixed the function that
  builds a description, but the Then rows do not use it — they compose their own
  title — so the Super Friends seasons went on reading *The All-New Super
  Friends Hour 1977 · 1977* for a release. One filter now, `subOf()`, read by
  everything that renders a label: the two heroes, The Path, the queue, and the
  label on a history row's tick.
- **Next up changed the size of the screen around it.** It is the only view
  whose content can be shorter than the display, so it was the only tab where
  the page did not scroll — and a page that does not scroll leaves the browser
  chrome open while every other tab collapses it. Arriving resized the visible
  area and leaving resized it back. Every tab now clears the viewport by a
  pixel.
- **A restore link asks first.** Opening one applied its marks immediately, with
  a message and no way back. Shared links are views, not takeovers; the view
  links have always honoured that and the backup links did not. It says what the
  link carries and waits for an answer.
- `.arow .atop` outlived the button it styled.

### Added

- **The suite checks that no CSS rule is left behind.** Two releases running
  removed some markup and left its rule sitting there. Both were caught by a
  script run by hand — which was never necessary: asking whether a selector ever
  matches is a question about the DOM, not about layout, and the smoke suite
  already walks every path, format, scope, tab and filter. It rides along on
  the states already being driven.
- A guard that every tab clears the viewport, so the one that fits without
  scrolling cannot come back.
- A guard that nothing reads an entry's label except through `subOf()` — which
  is exactly how the queue kept the doubled year after the first fix.

## [1.6.3] — 2026-08-01

Making room.

### Changed

- **The reasoning moved out of the app.** Twenty-two kilobytes of comments
  explaining why the code is written the way it is, shipped to every reader on
  every first visit, to explain a file they were never going to open. It lives
  in `NOTES.md` now, beside this one, where it costs nothing.

  Two notes stay: the slug freeze, because that one is a warning to whoever
  edits the line beneath it, and a header saying where the rest went. 145 KB to
  121. The catalogue has room to grow again.
- **Recent activity is one line.** A tick, a title, five stars. It took two
  fifths of Next up and it sits level with Then now — the block the tab exists
  for.

  The stars are back on the row. Putting them behind a tap took away the one
  place you could rate something without leaving the page, and moved the title
  sideways when you tried.
- **No date on it, and no badges.** Four things do not fit on one line on a
  small phone; with the stars and a date beside them a title had room for about
  three characters. The list is newest first, so its order already says when.
  The badges have been there since 1.5.9 and this takes them back out on
  purpose.
- **Both cards say Tonight's patrol.** Next up briefly said something else.

### Fixed

- **Nine entries printed their year twice.** The Super Friends seasons carry
  the year where every other series carries "Season 2", so each line describing
  them read *1973 · 1973 · 16 episodes* — on Home, on Next up, in the queue
  and on The Path. A label that only repeats the year is not a label.
- **A restore from a file kept whatever else was in the file.** Extra fields
  from a hand-edited backup settled into the browser and stayed there. It takes
  what it needs and drops the rest now, like every other way in.
- **The installed app no longer locks to portrait**, which was never anyone's
  choice on a tablet.
- The wordmark and the headings arrive in their own faces instead of swapping a
  moment after the page appears.

### Internal

- Two ways of asking "does this match the search" became one. Seven ways of
  asking "is this entry in this group" became one. Both had drifted apart at
  least once.

## [1.6.2] — 2026-08-01

The card, the history, and a page that scrolled sideways.

### Changed

- **The card on Home was assembled, not composed.** Its top line carried the
  label, the group number and the group name on one 10px tracked line — and for
  five of the app's continuities that ran to two lines and broke mid-field:
  "DC ANIMATED / MOVIE UNIVERSE", which is exactly where the middot separators
  stop marking anything. The meta line was often four characters and a hole,
  because a non-breaking space was doing the spacing between "2013" and the
  first badge. And the gaps ran **17, 12, 10, 15, 16** from top to bottom: five
  values with no relationship between any two.

  The kick says one thing now. The continuity has its own line, so a long name
  wraps against nothing but itself. The badges are a row rather than something
  glued to the end of a sentence. Every gap comes from one scale — 6, 12, 18.
  Measured at 320, 360 and 390: the kick, the continuity and the meta are one
  line each at all three, so the card stops resizing as you move through the
  catalogue.

  It also carries the description now. Home's card was a truncated copy of Next
  up's — same class, fewer children, so the shared rules were tuned for neither.
  It said what was next and never why.
- **Recent activity took 40.5% of Next up; Then took 16.4%.** A history row was
  122.5px against a queue row's 56. The tab spent two and a half times more room
  on what you had done than on what you were about to do.

  Rows are one line now — tick, title, date — and reveal their badges and stars
  on tap, the same bargain the Then rows have struck since 1.5.9. Nothing is
  gone; it is behind one tap. **59.5px a row, and the block drops from 622px to
  316px.**
- **The past was drawn brighter than the future.** Watched titles rendered in
  `--bone`, the brightest ink in the palette and the one that means "press
  this", while the film you were actually up to rendered in `--dust`. They are
  `--dim` now: one step below the queue instead of two above it.

  Not a fade. `.activity{opacity:.7}` puts five of the seven palette tokens
  under AA — the dates, every outlined badge, the unlit stars. Guard 61 now
  catches that, and finding out it did not is what led to the fix below.

### Fixed

- **The page scrolled sideways at 320px.** `grid-template-columns:1fr 1fr` is
  `minmax(auto, 1fr)`, and that auto floor is the column's min-content width.
  **"Tomorrowverse"** — thirteen characters with nowhere to break — pinned its
  column at 169px, so at 320 the grid measured 331px inside a 320px screen and
  the right-hand cards ran off the edge. iPhone SE and the Fold cover screen.

  `repeat(2,minmax(0,1fr))` and a card that may break a word. Row heights are
  deliberately untouched. No horizontal overflow on any tab at 320, 360 or 390.
- **iOS zoomed the page on every search.** Safari zooms any focused input under
  16px, and the viewport sets no `maximum-scale` on purpose, because capping
  zoom fails WCAG 1.4.4. The search box was 15px and the two backup fields were
  **11px**, so Progress zoomed harder than search. All three are 16px.
- **The era rows on Progress had no keyboard route at all.** The donut slices
  they mirror are pointer-only — `cursor:pointer` and nothing else, no
  `tabindex`, no `role`, no key handler. The universe rows at least had a way in
  through Home's grid; the eras had none. Both are buttons now, labelled with
  their name and their count.
- **The stars said "Rate 3" and nothing else** — not which film, not what the
  rating currently was, and not that tapping the lit star clears it. All three
  are in the label now, and each star carries `aria-pressed`.
- **Two tabs overwrote each other.** Every interaction wrote the whole payload
  and nothing listened for the write, so a second tab silently erased the
  first's ticks. Same device, no sync involved. There is a `storage` listener
  now, and it merges — marks only ever move from unset to set, so it can never
  resurrect something you had just unticked.
- **`restore()` accepted any `scope` it was given** while validating `format`
  two lines below. A payload saying `scope:"films"` hid every season and left
  neither scope button looking pressed.
- **`exportJSON` wrote a `scope` field nothing reads.** The comment above it
  already said a backup must not reach over and change the device's scope.
- **Smooth scrolling ignored `prefers-reduced-motion`.** The CSS killed
  transitions; the two programmatic scrolls were never covered by it.
- The search match count is announced. The toast truncates with an ellipsis
  instead of clipping mid-word. `mobile-web-app-capable` joins the deprecated
  Apple meta. A dead `var pc = counts();` is gone.
- **The Activity tick reserved three grid rows** after the row collapsed to one,
  leaving two empty tracks and their gaps — 10px of nothing per row, found by
  measuring the result rather than trusting the change.

### Added

- **Guard 62 — nothing focusable is small enough to zoom.** Any field the app
  puts a caret in must be at least 16px.
- **Guard 63 — the grid columns have a floor.** A bare `1fr` fails, the floor
  must be zero, and the card must be able to break a word.
- **Guard 61 now measures inherited fades.** As written in 1.6.1 it composited
  only where one rule set both a colour and an opacity. A wrapper that fades a
  block without naming a colour had nothing to measure and passed — which is
  precisely the change this release rejected. A fade that contains text is now
  held to whichever ink it actually carries, or to the worst in the app if it
  carries several.
- **The sitemap's `lastmod` must equal the JSON-LD `dateModified`.** Both are
  written by hand and they drifted a day apart before 1.6.0.

Twelve new negative tests. The 1.6.0 and 1.6.1 suites were re-run unchanged —
43 cases in total, all passing.

### Note

`index.html` is 143 KB raw / 46 KB gzipped against the 150 / 50 budget. The
headroom is 7 KB and this release spent 6 of it, most of that on the comments
explaining why. The next release that adds weight should expect to argue for it.

## [1.6.1] — 2026-08-01

Three things a build cannot see, and now can.

### Fixed

- **The badges did not line up.** The two filled tiers carried no border while
  every outlined modifier and dashed format badge carried 1px, so a badge's box
  depended on its kind.

  It showed up two ways. In a row, flex forces the boxes level, so the mismatch
  landed on the *labels*: the text in a filled badge sat 3px from the top and
  the text beside it 4px, in every row carrying both. In the legend, which
  centres rather than stretches, the boxes themselves came out **17.5px against
  19.5px, side by side on one line**. 1.6.0 rebuilt the legend out of real
  badges, which is what made a two-year-old inconsistency finally visible.

  The border is on the base rule now, transparent, so a filled badge occupies
  the same box and simply does not paint one. Measured after: every glyph 4px
  from the top, every legend badge 19.5px. The `vertical-align` nudge on
  `.badges` was measured too and did not move — the box grows symmetrically, so
  the badge's centre stays where it was.
- **One era title was indented 6px further than the other ten.** `.gnum` had
  padding and no width, so the chip was as wide as its content — and By universe
  zero-pads its tags while Bruce's life and Release order do not. "Beyond" was
  the only two-digit era, so it was the only row that moved.

  The chip has a minimum width and centres its tag. All three orderings now
  share one left edge, which they did not before. Release order carried the same
  bug unfired: it reaches a second digit the moment a 2030s bucket has an entry,
  and the catalogue already holds a 2028 title.
- **The format badges were under AA and the build could not tell.** `Animated`
  and `Live action` rendered as `--dim` at 80% opacity. Composited against the
  surface they actually sit on that is **4.21:1 on `--card` and 3.91:1 on
  `--card2`** — under the 4.5:1 floor — while guard 20 measured `--dim` at full
  strength, 5.28:1, and passed. They render on every row in All, which is the
  default format.

  The fade is gone. The dashed border already said "different axis"; hierarchy
  here comes from palette and shape, which is the rule everywhere else in the
  app. `Short` is `--bone` at 55% and survives at 4.85:1 — by 0.35, with nothing
  watching until now.

### Added

- **Guard 59 — every badge is the same box.** The base rule must carry a
  transparent border, no variant may set a different border width, and no
  variant may set its own padding.
- **Guard 60 — one left edge for the group chips.** The chip needs a minimum
  width wide enough for two characters and must centre its tag. Also fails if
  any of the three groupings grows past 99 entries, which is where a
  three-character tag would appear.
- **Guard 61 — contrast is measured on the ink that renders.** Guard 20 reads
  the token in `color:var(--x)` and cannot see `opacity`, so a faded colour was
  checked at full strength. This composites any faded ink against every surface
  in every theme and holds it to the same AA floor. It is the guard that found
  the format-badge failure above.

  It composites within a single rule. A colour and an opacity that reach an
  element through different selectors would need a real cascade, which is not
  something to hand-roll — noted rather than pretended away.

All three negative-tested in both directions, twelve cases. The 1.6.0 suite was
re-run unchanged: 19 cases, all still passing.

### Not done

A rendered-pixel assertion in the smoke suite was proposed and is not possible:
**jsdom does not implement layout** — `getBoundingClientRect()` returns zeros
for everything. Every defect above was found by measuring a real browser, and
all three were caught statically instead, by parsing the CSS. Closing the gap
properly means a headless browser in CI, which is a bigger decision than a patch
release.

## [1.6.0] — 2026-08-01

Four things that were saying the wrong thing quietly.

### Changed

- **The chooser's second and third rows are shorter than its first.** Path,
  format and scope were three identical 42px rows, so the screen asked three
  questions in one voice. 1.5.7 tried to fix that by shrinking the type and
  broke "Live action" and "Movies + Series" across two lines on every browser.

  Height and type size turn out to be separable. Levels 2 and 3 give back 8px
  of height at the same 9px type, the same nowrap and the same full width —
  every label still on one line, and the row you answer first is now the tallest
  one. Guarded in both directions: equal heights fail, and so does a smaller
  type size.
- **The legend is made of badges.** 1.5.9 rebuilt the badge system into three
  kinds — tier filled, modifiers outlined, format dashed — and guarded that no
  two draw alike. The legend went on drawing all nine as coloured words, so the
  key stopped looking like the thing it explains.

  Each swatch is now a real badge element reading its label out of `BADGE`. Legend
  and rows cannot diverge, because there is only one of them. The 1.5.9 legend
  audit checked the names and not the appearance; that gap is closed.
- **Recent activity is no longer a card.** It was the only card on Next up, so
  the eye read card, gap, card — and the gap was **Then**, which is what the tab
  exists for. Both blocks are a heading over ruled rows now. What tells them
  apart is that Then is numbered and Activity is dated, which is the difference
  that was actually there.

### Added

- **The landing page says Batman.** The first page anyone arrives on — and the
  only page a crawler ever sees — rendered 803 characters of visible text
  carrying "Bruce" twice and never the word every search for this page contains.

  The sentence that says it was already written. It just waited for a path to be
  chosen before it rendered. It now renders above the deck on first run, from the
  same function the Home intro uses, so the two cannot drift. No new copy.

## [1.5.9] — 2026-08-01

Clearing the deck.

### Fixed

- **Harley Quinn Season 5 was dated 2024.** It premiered 16 January 2025. The
  slug keeps its `-2024` — slugs are identifiers, not facts, and changing one
  would void saved progress.
- **Caped Crusader Season 2 dropped its Not-out-yet badge.** All ten episodes
  landed 31 July 2026.
- **Knightfall Parts 2 and 3 gained the Mature badge.** Part 1 carried it; the
  trilogy is rated R.

### Changed

- **The badges were nine labels sharing six colours.** Core read as Animated,
  Optional as Short, Interactive as Live action — three exact collisions, so a
  row of badges said less than it looked like it said.

  Shape carries the kind now and colour carries the value. **Tier is filled**,
  because there is always exactly one and it is the answer to *should I watch
  this*. **Modifiers are outlined**, because they are footnotes. **Format is
  dashed and dimmer**, because it is a different axis and only appears in All.
- **Recent activity shows an entry's badges.** It was the one place in the app a
  logged entry rendered with none.
- **The episode count is a floor, not a figure.** *Teen Titans Go!* and
  *Batwheels* are still running, so an exact number goes stale on somebody
  else's schedule. The claim is 1,450+ and the guard checks the data is at least
  that and not so far past that the floor misleads.
- **The meta description was 164 characters**, past where search results
  truncate. It is 147 now.

### Added

- **The queue reveals a line on request.** Tap anything under **Then** and it
  shows its badges and which continuity it belongs to. Never the description —
  the whole premise is that nothing ahead of you gets spoiled, and the
  description is where that risk lives.
- **The fonts join the service worker's install shell.** They relied on the
  runtime cache, which works on any normal first visit — but a font request that
  failed on that one visit left offline rendering fallback type silently until
  the next online one.
- JSON-LD gains an image and a modified date.

### Removed

- **32 KB from the icons.** Three PNGs of a flat two-colour silhouette were
  carrying full-colour palettes. 43 KB to 10.5 KB, no visual change, both
  checked by eye — transparency intact, maskable still full-bleed.

### Docs

- **The README described an older app in three places**: aggregator names gone
  since 1.3.2, fonts on Google's CDN since 1.4.2, and no mention of the format
  axis at all. All three were checkable against the code and none were checked.

  They are now. A service named in the README must be one `watchUrl()` reaches, a
  font origin claimed must be one an `@font-face` declares, and a control the app
  renders must be described. The size figure and the file table drifted the same
  way and have not since they were guarded.
- **The licence preamble went from sixty lines to twelve.** The reasoning moved
  to the README, where people read.

## [1.5.8] — 2026-07-31

### Changed

- **Recent activity rows were the only rows in the app not using its own row
  language.** The queue directly above them is set in the display face; Activity
  inherited body text, so its titles read as plain web type among styled ones.

  The alignment was two properties fighting: the row wrapped, and the stars
  carried `margin-left:auto`. Together those put the stars on their own line
  *and* pushed them right, so nothing lined up with anything.

  It is a grid now — tick in its own column, title and date on one line, stars
  beneath and left-aligned under the title they belong to. The tick is 24px
  rather than the Path row's 30px; in a block this tight it was out-shouting the
  title it belongs to.

  The row had been assembled by addition: title and date in 1.3.4, stars right
  after, the tick in 1.4.1. Nobody had looked at all four together.

### Fixed

- A comment on the group cache still said it was keyed on `mode|scope`. It has
  included format since 1.5.0.
- `sitemap.xml` had no `lastmod`, so it gave search engines nothing about
  freshness.

## [1.5.7] — 2026-07-31

### Fixed

- **Two labels in the master chooser broke across two lines.** Format and scope
  had been squeezed onto one row and set smaller so they would read as secondary,
  which left *Live action* and *Movies + series* wrapping on every phone tested —
  Safari, Chrome and Brave alike.

  All three rows are the same size now, and the palette carries the distinction
  instead: the path you chose is marked in the belt colour, format and scope in a
  quieter fill. Size was doing work colour does better, and doing it badly.

## [1.5.6] — 2026-07-31

### Changed

- **One chooser, on every tab.** Which ordering, then what is in it — the two
  questions every tab is an answer to.

  They had been split three ways: the path control on Home only, a lone scope
  switch at the top of The Path and Progress, and nothing at all on Next up. So
  which controls you had depended on where you were standing, and changing the
  ordering meant going back to Home and returning.

  The same block now opens all four tabs, rendered from one function, and the
  half-blocks it replaced are gone.

## [1.5.5] — 2026-07-31

### Changed

- **The path control moves to the top of Home**, with format and scope directly
  under it. They govern everything below them, and reading them after tonight's
  card meant meeting the answer before the question.
- **The chosen path is marked in the belt colour.** It was filled bone, which is
  the fill this app uses for a primary action — press this. Signal is what it
  uses when something means *this one*, and that is what a chosen path is.

## [1.5.4] — 2026-07-31

Home had three controls of identical weight and no hierarchy between them.

### Changed

- **Format and scope drop a level.** They were two more full-width bars the same
  size as the path control, with the same fill when selected — so the screen said
  choosing Movies mattered as much as choosing which life you are watching.

  They share one quieter row now, set smaller, in a subtler fill. The path
  control keeps its weight, because it is the decision the rest of the screen
  depends on.
- **The top card is slimmer.** It was carrying more padding than its contents
  needed, which pushed everything below it down a screen.
- **The recommended path is filled, not outlined.** A signal border read as
  another card with a slightly different edge, which is why it had to be asked
  for twice. It is yellow now, the way the app's own belt colour is used
  everywhere else it means something.

## [1.5.3] — 2026-07-31

### Changed

- **The chooser is a deck.** 1.5.2 took the three paths out of cards entirely to
  stop them looking like the other seven panels. That worked, and read as too
  much — large display caps, a ring on each, and the signal colour flooding in on
  press.

  They are cards again, but overlapping: each sits on the one below it, which
  nothing else in the app does. Quieter type, and room above the first one, which
  had been jammed against the line before it.
- **The recommended path is marked.** *By universe* is the spoiler-safe answer
  and the app's own copy says so, but three equally weighted cards left a
  newcomer guessing at the one decision the app actually has an opinion about. It
  carries the signal colour and a line saying **Start here**.

  Signal is no longer a press state. It marks one card, or it means nothing.

## [1.5.2] — 2026-07-31

A visual pass on the first screen.

### Changed

- **The chooser stopped looking like everything else.** Seven surfaces in the
  app were the same formula — a one-pixel border, a card fill, a rounded corner
  — and the chooser was the seventh. The one screen that asks a question read as
  another list of panels.

  No box now. Display type on the page itself, hairline rules between the three,
  and the signal colour doing the work it already does everywhere else.
- **Home tells before it asks.** The intro rendered between the path control and
  the format and scope block, so the two only read as a pair once the intro was
  gone — which meant the layout depended on whether anything had been ticked.

  The order is now: what this is, how to order it, what to include, where you
  are, where to jump. Explain, control, status, navigate.

### Added

- **A format badge on every row, in All only.** With both formats on screen
  there was no way to tell an animated entry from a live-action one. Under either
  single format the badge would be a label for the switch you already set, so it
  does not appear — and neither does its row in the legend.

### Notes

- `exportJSON` deliberately omits format, scope and theme. A backup restores what
  you watched onto whatever device you are holding; it does not reach over and
  change that device's settings. That was already true and is now written down.

## [1.5.1] — 2026-07-31

### Fixed

- **Two places still called the catalogue animated.** The first-run intro read
  *"Every Batman story ever animated"* and the finished state read *"the complete
  animated Batman"*. Both went out with 1.5.0, and the intro is the first thing
  a new visitor reads.
- **The guard meant to prevent exactly that was looking for the wrong words.** It
  matched two exact phrases, both of which had already been reworded, so it never
  saw either live string. It now scans both files for the word used as a limit on
  the catalogue — narrow enough that a description saying something is animated,
  which several truthfully do, still passes.
- **The intro counted the whole catalogue whatever the format switch said.**
  Choosing Live action still claimed 110 films and 58 seasons of television. The
  counts follow the selection now, and the television line disappears when there
  is none.
- **Endless scrolling in Chrome.** `render()` replaces the view wholesale and
  restores the scroll offset by hand; Chrome is the only one of the three engines
  with scroll anchoring on by default, so it was compensating for the same change
  at the same time. Anchoring is off for the view, and the restored offset is now
  clamped to the document, which stops a shorter view leaving the page parked
  past its own end.
- **A hand-edited save could empty the catalogue.** `format` is clamped to the
  three real values on restore instead of being trusted.

### Added

- **The Penguin (2024).** The Epic Crime Saga note promised it. Eight episodes,
  opening the week the film ends, and the first live-action series in the
  catalogue — 168 entries now, 110 films and 58 seasons.
- **Complete Twitter card tags**, `og:locale`, and image dimensions, so a shared
  link renders properly rather than relying on fallbacks.

### Changed

- The service worker's header comment described a Google Fonts caching strategy
  that stopped existing in 1.4.2.

## [1.5.0] — 2026-07-31

Live action arrives, and the app gains a second axis.

### Added

- **Twelve live-action films, in five continuities.** The Dark Knight Saga, the
  Epic Crime Saga, the Burton / Schumacher films, the DC Extended Universe, and
  the Adam West Universe. The catalogue is 167 entries across 33 continuities.

  The list is DC's own. Their guide covers thirteen films; *Justice League* and
  *Zack Snyder's Justice League* are one entry here, since they are one story in
  two cuts. *The Flash* sits in the DC Extended Universe, and the note on the
  Burton / Schumacher group records that Keaton's Batman returns in it — rather
  than filing one film in two places and inflating every count that touches it.
- **A format switch: Animated, Live action, or All.** It sits above the existing
  Movies / Movies + Series toggle, because they answer versions of the same
  question — format asks which kind of Batman, scope asks how much of it. They
  are one control block now. The path control answers a different question and
  stays apart from them.
- **Tiers are judged within a format.** Essential-for-animated and
  Essential-for-live-action are separate calls. Nobody has to rank Burton
  against Timm, and *Essential* keeps meaning "do not skip" rather than "good".

### Changed

- **Existing progress opens in Animated. A first visit opens in All.** A save
  written before this release has no format, and defaulting those people to All
  would grow the denominator overnight and put a Nolan film in Next up without
  them asking for it. Everyone keeps the app they had; nothing is hidden from
  anyone new.

  Progress is keyed by entry, so a tick survives every format switch. Backup
  codes and restore links are untouched — they never carried scope.
- **The first-run screen is three full blocks**, with the format switch above
  them. The chooser and the segmented control below are now the same three
  options at two sizes: large while it is the only decision on the screen, small
  once it has been made.
- **Home's path card is gone.** It repeated the header exactly — name, ring,
  percentage, done of total — and its only unique content was a Change button.
  A segmented control sits there instead, so switching is one tap rather than
  three.
- **The licence is AGPL-3.0.** The old one granted the right to sell under MIT
  and then reserved the writing separately, which was incoherent: the writing
  lives in the same file as the code, and one file cannot be both granted and
  withheld. Everything is under one licence now. Fork it, change it, host it —
  but if you put it in front of other people, publish your source.

### Fixed

- **`sw.js` still carried Google's font origins** in a cache branch that could
  never fire, five releases after the fonts were self-hosted. The origin guard
  read `index.html` only, so a service worker reaching a third party was outside
  what it checked.
- **The README's file table listed only `docs/`.** `LICENSE`, `SECURITY.md` and
  `package-lock.json` all shipped in 1.4.2 undocumented, because the root half of
  that table was maintained by hand.

### Guarded

- Every shipped file is scanned for third-party origins, not just the page.
- The whole repository is checked against the README's table, in both directions.
- Format is inherited from the group, so no entry can be half-assigned. All six
  format × scope combinations must return a duplicate-free pool.
- A continuous arc gets one era. The Nolan trilogy fails the build if it is ever
  split across eras, the way Knightfall would.
- An old save must land in Animated and a new one in All — the migration-bug
  shape, invisible in the data and only visible in someone's hands.

## [1.4.4] — 2026-07-31

### Fixed

- **Clearing a rating marked the entry watched.** Untick something in Recent
  activity, then tap its lit star to clear the rating it kept — and it came back
  marked watched. The opposite of both actions.

  `rate()` called `markWatched()` on both branches, including the one that
  deletes a rating. Only setting a rating implies you watched it. The bug is old;
  putting stars on the hero in 1.4.1 is what made it easy to reach.

  Unticking still keeps your rating. It is usually a mis-tap being corrected, and
  silently discarding a rating you gave is worse than leaving it.
- **"Where to watch" wrapped to two lines.** At 10px with wide tracking the
  label needs about 112px and its column gives 96px, so it broke mid-phrase and
  left the stars floating in the dead space beside it. The label keeps its
  wording at a smaller size — it is a secondary control and only has to share
  Skip's edges, not its weight. Below 360px the two rows stack instead.

### Added

- **A GitHub Action running both suites on every push.** `index.html` carries
  five independent tripwires — the CSP script hash, the frozen-ID snapshot, the
  changelog and version lock, the README size figure, and the third-party origin
  allowlist. Any edit that is not deliberate trips at least one.

  Until now nothing ran them except a person remembering to. They now run in
  public, on every commit, read-only, from the committed lockfile.

## [1.4.3] — 2026-07-31

### Fixed

- **The tick in Recent activity read as unwatched.** It drew as an empty ring on
  entries that are watched by definition — being watched is what puts them in
  that list. It now carries the filled state the rows on The Path use.

  1.4.1 tested that the tick existed, that it was labelled, and that it worked.
  Nothing tested what it looked like.
- **The hero card's rows did not line up.** The stars sat six pixels outside the
  padding edge and the watch link was right-aligned to nothing in particular, so
  neither matched the buttons below. Stars now share a left edge with **Mark
  watched** and the watch link shares its column with **Skip**.

### Added

- **A line of credit in the footer**, where the app already talks about itself.

## [1.4.2] — 2026-07-31

A security pass, and an audit of the tests themselves.

### Changed

- **The fonts are self-hosted.** All four came from Google's CDN, which meant
  every visit told a third party the page had loaded — on an app whose own
  structured data says nothing tracks you. Six `.woff2` files now ship in
  `docs/fonts/`, costing nothing against the index.html budget and making the
  page genuinely offline on a first load rather than only after caching.

  All four are SIL Open Font License, and redistribution requires the licence to
  travel with them, so `fonts/OFL.txt` ships too.

  The old request asked for weight 500 of both IBM Plex families. Nothing has
  ever used it. One rule asked for weight 700, which was never loaded and was
  being faked by the browser; it is 600 now, which is a weight the app actually
  has.
- **The footer says what Cloudflare sees.** *"anonymous visit stats via
  Cloudflare"* was accurate and vague enough that a sceptic would fill the gap
  themselves. It now reads **"Cloudflare counts visits, never what you watch"**,
  which is the actual boundary.

### Added

- **A Content-Security-Policy.** `default-src 'none'` with everything opened
  explicitly: the app's own script by hash, Cloudflare's beacon by origin, and
  nothing else. `object-src`, `base-uri` and `form-action` are all `'none'`, and
  `unsafe-eval` is refused — the app has never used `eval`, `new Function`, or a
  single inline event handler, so nothing had to be loosened to fit.

  The hash changes with every edit to the script, and a stale one means the
  browser refuses to run the app at all. A guard recomputes it from the file, and
  `npm run bless` rewrites it.
- **A referrer policy**, and `rel="noreferrer"` on the where-to-watch link, so
  the search engine is not told where the visitor came from.
- **`LICENSE`** — MIT for the code, the written descriptions and continuity
  judgements reserved, DC's marks acknowledged as DC's, and the fonts' OFL noted.
- **`SECURITY.md`**, pointing at GitHub's private reporting rather than a public
  issue.
- **`package-lock.json` is committed.** Without it, a CI run would install
  whatever the version ranges resolved to that day.

### Guarded

- **No third-party origins.** Any host in `index.html` outside a short allowlist
  now fails the build.
- **Fonts, weights, and the licence.** A weight used but not declared would be
  faked by the browser; a weight declared but unused is a wasted download. Both
  now fail.
- **The file table recurses.** It listed only the top level of `docs/`, so the
  seven files added to `docs/fonts/` shipped undocumented without the build
  noticing — the same gap that guard was written to close.

### The test suites

- **Sections renumbered 1–49, in file order, with an index.** The numbering had
  run 1–19, jumped to 26, and hung eleven sub-sections off 30 with suffixes b
  through g; 12b and 12c sat before 12. **Guard 49 now enforces it** — sections
  must run 1..n with no gaps, and every one must appear in the index.
- **`optionalFn()`.** `fn()` throws on a missing function, so any guard reporting
  a function's *absence* crashed before it could print. That was fixed in place
  three separate times before becoming one helper.
- **The suites run in 6.7s instead of 11.2s.** jsdom throws on every `scrollTo`
  and catches it internally — 97 exceptions and 97 lines of stderr per run, now
  one stub. Each reload test also carried 200ms of padding, five times over.

  The five reloads themselves were left alone. Re-running `restore()` inside an
  existing window would be faster still, but `restore()` is promise-based and
  wired into the boot sequence, so that would test something other than what
  happens on load.

## [1.4.1] — 2026-07-30

Next up corrects itself.

### Added

- **The hero rates in place.** The same star row The Path carries, which marks
  the entry watched as it rates it. Marking something and rating it were two
  actions in two places; they are one now.
- **A tick on every Recent activity row.** Stars on the hero are a 34px target
  beside a full-width button, and that will be mis-tapped. The tick takes the
  entry back out of your progress from the same screen it went in on, and works
  on any of the five rather than only the most recent.

  It is the one control in that block that moves the hero, and that is its
  purpose. Stars still never do.

### Changed

- **Activity is now Recent activity.** Five entries is a window, not a record,
  and the heading should say which.
- **The legend moved to the bottom of The Path.** It defines badges that render
  on Path rows and nowhere else — on Progress it was a key printed on a
  different page. It sits last, because reference is something you go looking
  for rather than something that should push the catalogue down.

## [1.4.0] — 2026-07-30

A deep audit, and the things it found. The share card moves to 1.4.5.

### Fixed

- **`--steel` had been under the AA contrast floor since 1.0.0.** The *Change*
  control sits at the top of the path card, where the gradient is at its
  lightest, and drew at 4.09:1 against the 4.5:1 minimum. Lifted along its own
  hue to 5.08:1 at worst — the same blue, further from the background.
- **`--crimson` was under the floor everywhere it was used as text** — 3.27:1 on
  a card. Lightening it enough for text would have dropped white-on-crimson on
  the armed erase button below the floor instead, so there is now a second tint:
  `--crimson` stays the fill, `--crimson2` is the text. Same hue, same identity,
  following the `line` / `line2` naming already in the palette.
- **The empty stars were invisible.** They drew in `--line2` at 1.50:1, which is
  a border colour doing a control's job — you could not see there were five to
  tap until you had tapped one. They now have `--staroff`, at 3.37:1: visible as
  a target, still clearly unscored.
- **The restore box had no label.** Its placeholder was doing the work, and a
  placeholder disappears the moment anyone types — leaving a screen reader with
  an unnamed text box and everyone else with no reminder of what goes in it.

### Changed

- **One scoreboard.** Home and Progress each drew their own, with a different
  third stat: Skipped on one, Essentials on the other. The same component meant
  two things. It is now **Watched / To go / Skipped** in both places — the only
  set that accounts for every entry in the pool — and Essentials keeps the row
  and the donut it already had.

  Numbers are centred and take their colour from the palette, carrying the
  meaning the legend already gives it: signal for done, bone for what is left,
  steel for passed over.

### Added

- **The site now says what it is.** `og:site_name` and a `WebSite` node in the
  structured data. Without them Google guessed, and what it guessed was
  "GitHub Pages documentation".
- **What the app refuses to do is now stated as a feature.** No account, no
  advertising, nothing tracking what you watch, progress that never leaves the
  browser, and it works offline — declared in the structured data and guarded,
  because it is the whole pitch.

### Guarded

- **The contrast check now enumerates instead of remembering.** Every token used
  as a colour, against every surface it can land on, in both themes — with body
  text held to 4.5:1 and drawn controls to 3:1. The old list was five pairs
  chosen by hand, and `--steel`, `--crimson` and `--line2` were in none of them.
- **The `--card2` exemption is gone**, and it was the real fault. The guard
  treated the top of a gradient card as warn-only, reasoning that nothing faint
  was drawn there. *Change* is drawn there, in `--steel`. Two colours sat under
  the floor across nine releases without a build ever failing. A colour that
  cannot survive the top of a card does not belong on one.
- Scoreboard is one component, centred, palette-only. The restore box keeps its
  label. The site name and the no-account claims cannot quietly disappear.

## [1.3.9] — 2026-07-30

A copy pass. Nothing in the app moved; several things it said were wrong.

### Fixed

- **The chooser and The Path described the same orderings differently.** Each
  ordering had two blurbs, written months apart. One called it the *safest first
  watch*, the other the *safest way through*; one said *composite lifetime
  stitched across*, the other *composite life, stitched from*.

  They are now one string. The chooser takes the opening of the note and nothing
  else, so they cannot drift again.
- **The chooser claimed release order ran from 1968.** Its blurb hardcoded a
  year while The Path computed one from what is actually on screen — which under
  Movies is 1993. The chooser was stating a number the app contradicted one tab
  away. Both come from `yearSpan()` now.
- **Progress was said to live on "this device". It lives in a browser.** Two
  browsers on one phone do not share storage, so anyone who switched and lost
  their ticks had been told the wrong thing. All four statements of that fact
  now say browser.
- **The app called itself two things.** *An unofficial field guide* in the
  intro, *an unofficial fan guide* in the footer, both on the same screen. Fan
  guide everywhere — it states the position more plainly.

### Changed

- **The Progress footer was three unrelated facts in one paragraph** — saving,
  availability, and release dates. Now three.
- **Named titles left the announced-dates line.** It read *Knightfall and
  Dynamic Duo dates are as announced and can move*, which needed editing every
  time one landed or another was announced. It now reads **Announced dates can
  move.**
- **The empty state repeated its own heading.** *Nothing here* over *Nothing
  matches that filter* said one thing twice. The body now says what to do, and
  distinguishes an empty search from an empty filter.
- **Backup buttons named for what they are.** *Full JSON* is now *JSON file*,
  matching *Code file* beside it.

## [1.3.8] — 2026-07-30

### Changed

- **The page title now says what people search for.** It read *Night Watcher ·
  One path through every Batman*, which contains none of the words anyone types.
  It now reads **Batman watch orders that spoil nothing · Night Watcher**.

  The tagline is unchanged everywhere a person sees it — the wordmark, shared
  links, the README. `<title>` is read by search; `og:title` is read by humans,
  and they no longer have to be the same string. Nothing in the app moved.

### Added

- **Search Console ownership token** (`docs/google38dc2f1303c788e7.html`), added
  ahead of this release without a version bump, since it changes nothing about
  the app and would have retired the service worker cache for no reason.

### Fixed

- **A guard that could not fail.** The tagline check tested `<title>`, `og:title`
  and the README against the whole document rather than against their own
  strings, so one surviving copy satisfied all three. Each is now checked where
  it actually lives.

## [1.3.7] — 2026-07-30

Fixes only. No new surface.

### Fixed

- **The where-to-watch link now carries a year.** Thirteen titles repeat across
  the catalogue — five different things called *The Batman*, four called *Super
  Friends* — and without a year the search resolved every one of them to
  whichever was more famous.

  The year used is the **first** the title appeared, not the entry's own, so all
  five seasons of a show ask the same question. Availability is sold per show,
  not per season.
- **`--dim` lifted from `#78849E` to `#8B97B1`.** Worst-case contrast went from
  4.12:1 to 5.28:1, clearing AA with room on every surface in both themes. The
  Activity dates added in 1.3.4 were sitting at 4.57:1 — passing by 0.07, which
  is not passing in any way that matters at 10px.
- **README stated 111 KB / 35 KB.** It had been wrong since 1.2.x. Now guarded,
  so it cannot drift again.

### Added

- **A canonical URL.** The page has been reachable at two addresses since the
  Worker went up, and nothing said which one was the page.
- **JSON-LD, robots.txt and a sitemap.** Roughly 0.6 KB inline, and the two new
  files cost the budget nothing. The JSON-LD description is now cross-checked
  against the meta and og descriptions, so the three cannot drift apart.

## [1.3.6] — 2026-07-29

### Fixed

- **The collapse control was invisible.** It wore the same mono caps, the same
  pill border and the same `--dust` as the filter chips directly above it, so it
  read as a seventh chip rather than something that acts on the whole list. It
  now carries the signal colour and a caret that points the way it will move.

## [1.3.5] — 2026-07-29

The Path collapses, and Progress stops repeating what The Path already shows.

### Added

- **Collapse all / expand all, on The Path.** 28 continuities is a long scroll to
  reach the one you want. The control sits under the filter chips and flips
  label to whichever action is available.

  Group state now **persists**. It was deliberately session-only until now, on
  the grounds that tab, filter, query and mode are; collapsing 27 groups is a
  different kind of act from typing a search, and losing it on every reload made
  the control not worth using. Stored inside the existing payload as one key, so
  nothing about saved progress changes shape.
- **Arriving at The Path opens the group you are up to.** Only when something is
  open already \u2014 a deliberate collapse-all is left alone, since re-opening it on
  every visit would undo the control you just used.

### Removed

- **Progress no longer lists your ratings.** It repeated, in a second format and
  a different order, what every row on The Path already carries \u2014 and it grew
  without limit, so the more you rated the further the backup tools sank below
  it. Ratings stay readable and editable where the titles are.

  One consequence worth knowing: that list ignored scope, and The Path does not.
  A series you rated is now hidden while the toggle reads Movies, in the same
  way the series itself is.

## [1.3.4] — 2026-07-29

Activity replaces the rating prompt, and Home ends at the universe grid.

### Added

- **Activity, on Next up.** The last five things logged, newest first, each with
  the stars you gave it and the ability to change them. It sits below **Then**
  as a bordered surface with taller rows — deliberately not another `.qitem`
  list, because it is a record of what you did, not another step in the queue.

  It ignores the scope toggle. Scope is a queue control; hiding a series you
  logged because the toggle now reads Movies would be a lie about your own
  history. No log, no block.

### Changed

- **`ratePrompt()` is gone.** 1.3.3 showed **Just watched · ‹title›** below the
  hero, which rated exactly one entry. Activity does the same job for the last
  five and reads as a record rather than an interruption.
- **Home ends at the universe grid.** Its **Recently logged** list drew the same
  `S.log` a second time, in a second format, with a different length. Two
  renderings of one list is how they drift.

### Fixed

- **The log holds one entry per id.** Saved progress is deduped on read, keeping
  the earliest timestamp — that is when it was actually watched. No reachable
  write in this build can produce a duplicate; a saved payload can also arrive
  hand-edited or from another build, so the invariant is enforced where the data
  is read rather than where it is written.

## [1.3.3] — 2026-07-28

Three interface fixes.

### Added

- **Rate what you just watched, from Next up.** Marking something watched
  advances the card immediately, so rating it meant finding the title again on
  The Path. A prompt below the hero now shows **Just watched · ‹title›** with its
  stars. Rating there records against that title and does not advance anything —
  `markWatched` is a no-op on something already watched.

  No new state: `S.log` has recorded every tick in order since 1.0.0, so the last
  entry is exactly what was just marked.
- **Tapping the app title returns to the top.** The wordmark is the one element
  present on every screen, which makes it the obvious control for it. It stays
  inside its `h1`, so the heading is still a heading.

### Changed

- **The Progress footer described a link that no longer exists.** It still
  promised that “Streaming rows rotate monthly, so the ‘Streaming now’ link on
  each film checks live availability” — two releases after that link was
  replaced. It now says availability changes constantly and differs by country,
  which is why “Where to watch” runs a fresh search rather than trusting a
  stored answer.
- The star markup moved into a single `starRow()` used by both the detail panel
  and the new prompt, rather than being built inline in one place and copied to
  the other.

### Added — guards

- `ratePrompt()` and `starRow()` must exist and be rendered, and `data-act="rate"`
  may appear in exactly one place — two copies of the star markup is how they
  drift apart.
- The wordmark must be a control with a handler, and must stay inside its `h1`.
- The footer may not mention “Streaming now”, “Streaming rows” or the old
  aggregator. That copy survived two releases past the feature it described.

## [1.3.2] — 2026-07-28

### Changed

- **Where to watch is a Brave search.** The link now opens
  `search.brave.com/search?q=where to watch <title>` — one URL shape for every
  visitor, with no country in the path, no localised segment and nothing that
  can 404 in a market nobody checked. It replaces the aggregator entirely.

  Three attempts at building an aggregator URL were wrong first: a region-less
  path (404 everywhere), then a locale-derived country (404 in the UK, whose
  code is `/uk`, not the ISO `/gb`), then a table of two hand-verified pairs
  that left most of the world on a home page. A search query has none of that
  surface.

- **The link is right-aligned**, in the hero card and in an expanded row on The
  Path, rather than sitting flush left under the description.

### Added — guards

- `watchUrl()` is extracted and run: every title must produce a Brave search
  whose query leads with “where to watch” and carries the encoded title. No
  country path may appear, `justwatch` may not return to `index.html`, the link
  may not point at Google, and the row must stay a single right-aligned link.
- Smoke checks the rendered link in both places it appears.

## [1.3.1] — 2026-07-28

### Fixed

- **Every watch link in 1.3.0 was a 404.** That release replaced three branded
  links with one “clean” global link, `justwatch.com/search?q=…`, on the
  assumption that a region-less path would geo-redirect. It does not.

  Two things make that URL impossible to construct blind. The country is a
  required path segment, and **the aggregator's country codes are its own, not
  ISO** — the United Kingdom is `/uk`, not `/gb`. On top of that the search
  segment is localised: `/us/search` in English, `/uy/buscar` in Spanish.

  So nothing is derived any more. A small table holds only country/path pairs
  **checked against a live page**, currently `us` and `uy`. Any other locale gets
  `justwatch.com/`, which redirects to that visitor's country — a working page
  rather than a guess. The table grows one verified entry at a time.

### Added — guards

- `watchUrl()` is extracted and **run** against nine locales rather than grepped:
  the two verified ones must build a real search URL, and `en-GB`, `pt-BR`,
  `de-DE`, `fr-FR`, `es-419`, bare `es` and an empty list must all fall back to
  the root without inventing a path. The `JW` table may contain only the
  verified pairs, byte for byte.
- Four smoke checks on the rendered link, including that no ISO country code is
  invented and the region-less path never returns.

### Note

Three versions of this link were wrong before this one: a region-less path, then
a locale-derived country. The first guards written for it grepped for strings and
would have missed both failures they existed to catch — they now run the function,
which is the rule this repository already had.

## [1.3.0] — 2026-07-28

The catalogue release. Four entries, a new continuity, every brand name removed,
and one tagline in place of three.

### Added

- **Kite Man: Hell Yeah!** (2024, 10 episodes) joins Harley Quinn’s Gotham. Same
  continuity, same writers, and it sets up the fifth season directly.
- **Teen Titans: Trouble in Tokyo** (2006) and **Teen Titans Go! vs. Teen Titans**
  (2019) join the Teen Titans group. Each now follows the series it closes or
  crosses, the same interleaving that made group 18 the model for the DCAU fix.
- **Group 28, The DCU**, with **Creature Commandos** (2024, 7 episodes). Batman
  appears once, apprehending Doctor Phosphorus. The group is named for the
  continuity rather than the show because it is where live-action will land.

All four sit in era 0, “Outside any timeline”, so **Bruce’s life is unchanged** by
this release — only by-universe and release order gain entries.

Counts: **151 → 155 entries, 96 → 98 films, 55 → 57 seasons, 27 → 28
continuities, 1,434 → 1,451 episodes.** `frozen-ids.json` re-blessed.

Creature Commandos season 2 is deliberately absent: it is announced, but sources
disagree between 2026 and 2027. It goes in behind the “NOT OUT YET” badge when
the date firms.

### Removed

- **Every brand name.** All 27 `where:` strings deleted, along with the three
  places each rendered: the hero’s where line, the group sub-line
  (`6 of 11 · HBO Max` → `6 of 11`) and the group where line. Nineteen of 27
  groups named HBO Max, up to three times each — roughly forty repetitions of one
  brand down a single scroll, for information that rotted monthly and was wrong
  outside one country.
- **Two of the three watch links.** “Rent on Prime” and “Apple TV” are gone.
- `.gwhere` and `.hero .where` CSS, now dead.

### Changed

- **One link: “Where to watch ↗”**, with no region in the path. The aggregator
  geo-redirects, which is right everywhere instead of right in the United States.
- **One tagline, in all six places it lives:** `<title>`, `og:title`, the meta
  description, `og:description`, `manifest.json` and the README headline all now
  read **One path through every Batman**. They previously carried three different
  strings between them.
- **“The Animated Dark Knight” is retired**, and “animated” comes out of the
  descriptions — both stop being true when live-action arrives, and `og:title` is
  what every shared link displays.
- `og:description` no longer promises to “find where each one streams”, which
  described a feature this release removes.

### Added — guards

- A brand denylist across the catalogue and the watch link, so no service name
  returns one entry at a time. The link may not hardcode a region, and the entry
  link row must stay a single link.
- The tagline must appear in the title, `og:title` and the README, the retired
  ones must not appear anywhere, and copy may not describe the catalogue as
  “animated” — that becomes false in 1.5.0.

## [1.2.5] — 2026-07-28

A deep QA pass over 1.2.4. Two behavioural fixes, one copy fix, and the README
catches up with the QR removal.

### Fixed

- **Shared view links now work while the app is open.** The hash router ran only
  on page load — there was no `hashchange` listener — so tapping a `#life` or
  `#release` link with Night Watcher already running did nothing at all. The
  router is extracted to `routeHash()` and runs on both load and hashchange.
  Routing a view still never changes the stored path.
- **The restore box admits what it accepts.** It has taken a full restore link
  (not just a bare code) since 1.1.0, but the placeholder only ever mentioned
  codes. Now: “Backup code, restore link, or full JSON”.
- **The README no longer describes the QR** removed in 1.2.4: the intro’s
  “only third-party code” line, the guards paragraph’s payload sentence, and the
  full vendored-licence block in Credits — a licence for code no longer in the
  repository — are gone or rewritten.

### Added — guards

- A `hashchange` listener and `routeHash()` must exist — shared links working
  only on a cold load is exactly the kind of regression nothing else would catch.
- The README may not mention the QR, the encoder, or its author — 1.2.4 removed
  the code and three passages kept describing it, one of them a licence block.
  Docs drift is invisible until a reader trips on it, so the check is mechanical.

### Verified, no action

The deep pass also cleared three suspicions as false alarms: the clear-all
confirmation exists (two-tap, crimson, self-disarming after 4 s — the probe
grepped for words the copy doesn’t use); Next up is fully path-aware through
`pool()`; and “next = 1993” under release order was movie scope working as
designed, films starting in 1993.

## [1.2.4] — 2026-07-28

### Removed

- **The QR encoder.** 20 KB of vendored, minified third-party JavaScript — 15% of
  the whole file, carrying a licence obligation — for a feature used twice a
  year. **index.html drops from 131.4 KB to 111.2 KB raw, and 42.4 KB to 34.9 KB
  gzipped.** The app now contains no third-party code at all.

### Changed

- **Transfer is a link instead of a QR.** This is not a replacement built for the
  occasion: `restoreLink()` already existed, already produced a `#nw=` URL, and
  the app already restored from that hash on load. The QR was one *presentation*
  of that link and the only thing surfacing it — **Copy link** now does the job
  in three lines.

  It is also better. A link travels through any messaging app, needs no camera,
  no line of sight and no second device present, and it never hits the capacity
  ceiling the QR did — the old panel had a fallback for codes too long to encode.

### Added — guards

- The Copy link control, `restoreLink()` and the `#nw=` handler must all exist.
  With the QR gone the link is the entire transfer mechanism, and losing the
  control that surfaces it would quietly reduce transfer to copy-and-paste.
- No vendored third-party code may return to `index.html`.
- Guard 8 previously measured worst-case QR payload against v40-L capacity. That
  ceiling no longer exists, so the guard now protects the link instead.

`qa/smoke.js` is 83 checks: making a code surfaces Copy link, the link is
absolute and carries the code, opening it restores, and no QR encoder is loaded.

### Headroom

18.5 KB → **38.8 KB raw**. At 246 bytes per entry that is room for roughly 155
more titles rather than 75, which changes the live-action expansion from tight to
comfortable and makes the planned v1.5.0 efficiency pass optional rather than a
prerequisite.

## [1.2.3] — 2026-07-28

A catalogue QA pass. No code paths changed, no IDs added or renamed — still 151
entries, 96 films, 55 seasons, 1,434 episodes, 27 continuities.

### Fixed

- **The DC Animated Universe spoiled itself.** By-universe renders in array
  order, so the array *is* the watch order. Group 01’s note says to save Beyond,
  Zeta and Return of the Joker for the very end, because JLU’s “Epilogue” spoils
  Batman Beyond — but the array listed all eight films first, putting **Batman
  Beyond: The Movie third and Return of the Joker seventh** out of 25. The two
  things the note warns about were among the first a new user would tick, with
  the warning printed directly above them.

  The group now follows its own instructions: the series first with Phantasm and
  SubZero dropped in, the Superman detour around The New Batman Adventures,
  Mystery of the Batwoman and Chase Me to finish, then Justice League and
  Unlimited, and Beyond, Zeta and Return of the Joker last. *The Batman* (group
  18) was already interleaved correctly and was the model.

  Reordering only — every `i:` is unchanged, so saved progress and every backup
  code in circulation still resolve exactly as before.

### Added — guards

- Documented spoiler order is now enforced. Three rules, checked by array
  position: Beyond, Zeta and Return of the Joker must follow JLU; Phantasm and
  SubZero must follow the first season they drop into; Return of the Joker must
  close Beyond. A group note is prose and cannot enforce itself — this is the
  same failure that let the order drift in the first place.

### Known, not actioned

Three titles sit inside continuities the catalogue already carries in full and
are missing: **Kite Man: Hell Yeah!** (2024, Harley Quinn continuity),
**Teen Titans: Trouble in Tokyo** (2006, the 2003 series’ finale film) and
**Teen Titans Go! vs. Teen Titans** (2019). They are additions, which is a MINOR
bump under this repo’s own rule — they move the headline counts and require
re-blessing `frozen-ids.json` — so they wait for 1.3.0.

Also noted: *Teen Titans Go!* sits in group 25 while *TTG To the Movies* sits in
group 14. And sources disagree on whether Knightfall is a three- or four-part
adaptation; the catalogue carries three.

## [1.2.2] — 2026-07-27

Tidying the bottom of Progress turned up a real bug on the way.

### Fixed

- **Ticking anything before choosing a path silently assigned you one.** The
  chooser is Home’s empty state, but the other tabs work without a path — you
  can open The Path and start ticking straight away. `persist()` wrote
  `mode: S.path || S.mode`, so with no path chosen it saved `mode:"continuity"`,
  and on the next load the 1.1.0 migration rule adopted that as a deliberate
  choice. The chooser never came back and the user was on by-universe having
  never picked it.

  `mode` now mirrors `path` and nothing else. When no path is set it writes an
  empty string, which fails `isPath()` and is adopted by nothing. Real 1.1.0
  saves still migrate exactly as before.

  Found by questioning a `persist()` call that looked merely redundant. It
  wasn’t redundant on the one route where it mattered.

### Changed

- **The path row is gone from Progress.** It duplicated the Change control on
  Home’s path card — two controls for one setting, which is how two places drift
  into disagreeing. Deleted rather than relocated.
- **“Backup & transfer” is now “Your data”**, which is what that half of the
  screen is: progress in portable form. It stays in Progress rather than moving
  to a settings screen, because backup, restore and clear-all are all progress
  operations and only one item in that tail was genuinely misfiled.
- **Darker is a single unlabelled row at the very bottom**, below everything
  else. One toggle does not earn a settings screen, and building a room for one
  object is how a small app stops being one.

### Removed

- The `data-mode` click handler. Nothing has rendered `data-mode` since the
  switcher left The Path in 1.2.0; the handler survived it and read as though
  the ordering were still switchable from somewhere.
- The `persist()` in `goToGroup()`. Every value that function touches — tab,
  filter, query, mode, groupOpen — is session state by design.

### Added — guards

- `persist()` may not fall back to `S.mode`, and must still mirror `path` into
  it for downgrade safety. Both directions guarded, both negative-tested.
- `PATHS.map` must appear exactly once, so a second path control cannot reappear.
- `dataset.mode` may not return.

`qa/smoke.js` is 79 checks, including persisting with no path chosen and
asserting the payload carries no ordering.

### Changed — source

- **Comments trimmed throughout**, in `index.html` and both test files. The rule
  applied: keep the sentence that stops someone reintroducing a bug, drop the
  retelling of how it was found. Constraints, warnings and “never do X”
  instructions are intact — frozen IDs, exclusive tier resolution, the ratings
  clamp, the scrollbar gutter, the single hero size — each now in one or two
  lines instead of four to fourteen.
- The vendored QR encoder’s MIT licence header and the fonts/palette attribution
  block are untouched, verbatim.
- One comment had gone stale and is now correct: `persist()` still described the
  `S.mode` fallback removed directly beneath it. Prose that isn’t load-bearing
  doesn’t get checked when the code moves, which is the argument for less of it.

### Not removed

Two CSS rules looked unreferenced under a first audit and both were false
positives: `.full` is emitted by string concatenation (`'ucard'+(pct===100?" full":"")`)
so no `class="…full…"` literal exists to grep for, and `.js` was never a class
at all — a crude selector regex reading `sw.js` in a comment. Left alone.

## [1.2.1] — 2026-07-27

### Fixed

- **A view was a one-way door.** With a path chosen, tapping a universe card on
  Home takes you into by-universe — correctly, since that grouping only exists
  in that ordering. But the banner offered only *Make this my path*, so the only
  route back to your own was a reload. `mode` is deliberately not persisted,
  which is exactly why reloading appeared to fix it, and why a missing control
  looked like a glitch instead.

  The banner now goes both ways, and **Back to *your path*** leads, because
  returning is the likelier intent of the two. *Make this my path* stays as the
  quieter option beside it.
- **Tapping The Path tab returns you to your path.** A view now lasts as long as
  you are looking at it, which was already true of a reload. Leaving the tab and
  coming back used to leave you in the borrowed ordering with no indication that
  the tab was no longer showing what its name promised.

### Added — guards

- The viewing banner must contain a way back, and the tab handler must reset
  `mode` to the chosen path. Both negative-tested.
- `qa/smoke.js` grew from 72 checks to 78, walking the exact reported route:
  choose a path, tap a Home card, confirm the banner offers the way back, take
  it, and confirm both that the ordering returns and that the banner clears.

## [1.2.0] — 2026-07-27

The ordering becomes a choice you make once instead of a question the app asks
on every visit. Plus a darker theme. The catalogue is unchanged.

### Added

- **Your path.** The three orderings are no longer a switcher — you pick one and
  the whole app follows it. Home is the chooser until you have picked; after
  that it leads with a path card carrying that path's own completion ring and a
  quiet **Change**. The header sub-line reads the path name on every screen, so
  the reminder costs no new chrome. `S.path` is the locked choice; `S.mode` is
  what is currently on screen.
- **Following a shared link no longer rewrites your path.** `#life`, `#release`
  and `#universes` set `mode` only, and The Path shows a banner offering to
  adopt what you are looking at. Only `path` is persisted, which is what makes a
  view a view.
- **Darker.** A pure-black AMOLED variant for watching in an actually dark room,
  in Progress next to the path row. Surfaces only — every text and accent token
  is untouched, so contrast can only improve: `--dim` on `--card` measures
  **5.07:1** against the default theme's 4.57:1. The header and tab bar were
  hardcoded `rgba()` and are now tokens, or no theme could have reached them.
  `<meta name="theme-color">` is repainted at runtime, since CSS cannot touch
  the system status bar and an installed app would otherwise show a header in
  one colour under a bar in the other.

### Changed

- **The Path stops asking.** The three-way switcher is gone from the tab; it
  survives as Change on Home and one row in Progress. Two controls removed from
  a screen you visit constantly, for a decision you make once.
- **Backup codes are `NW2`** and carry the chosen path in a `P` segment, so a
  restore onto a new phone arrives already on the right ordering. Verified
  against the real shipped 1.1.0 build in both directions: 1.1.0 restores
  everything except the path from an `NW2` code — exactly what the forward
  tolerance shipped in that release was for — and 1.2.0 still reads every `NW1`
  code ever written. 1.0.0 will reject `NW2`; `sw.js` is network-first, so any
  1.0.0 client that has opened online since is already past it.
- JSON exports are `v:2` and carry the path. A restore adopts it only when no
  path is set locally — restore merges progress, it does not take over a device.
- `persist()` writes `mode` as well as `path`, deliberately carrying the *path*
  value: a 1.1.0 build reading this payload knows nothing about `path` and would
  otherwise fall back to its own default, landing the user in an ordering they
  never chose.

### Migration

Anyone upgrading from 1.1.0 has their saved `mode` adopted as their path. They
already answered this question; asking again with progress on the board would be
asking for nothing. The chooser is for genuinely new arrivals — a save with no
ordering at all still gets it.

### Added — guards

- The path vocabulary must agree with itself: every path in `PATHS` needs a
  blurb, a code letter, and a letter that round-trips. Two paths sharing a
  letter would restore as each other.
- The switcher may not return to The Path, the path card and chooser must exist,
  Change must exist, and `persist()` may not write `S.mode` as the path — that
  last one is how following a shared link would quietly overwrite your ordering.
- **Contrast is now measured per theme.** The previous version took the first
  value of each token seen anywhere in the file, which measured the default
  palette and would have ignored the darker one entirely. Themes are parsed as
  blocks; a second palette failing AA is precisely the regression this guard
  exists to catch, and it would have sailed straight through.
- Every theme needs a `THEMEBAR` colour, `applyTheme()` must be called, and the
  header and tab bar must stay on tokens.
- **A weight budget:** 150 KB raw and 50 KB gzipped, currently **138.5 / 45.5**.
  Nothing enforced the premise but good intentions. It should hurt to import a
  library. No external script may be loaded at runtime.

`qa/smoke.js` grew from 38 checks to 72 — first run shows three cards and no
hero, choosing goes through the real click handler, a reload comes back on the
path and theme, a 1.1.0 payload migrates without being asked again, a save with
no ordering still gets the chooser, viewing a foreign ordering does not change
storage, switching path keeps every tick, and the status bar follows the theme
both ways. Every new guard was negative-tested.

## [1.1.0] — 2026-07-27

Acted on an external QA review. Two of its five findings were already fixed in
1.0.0, one was based on a miscalculation, and one was real but in a different
place than reported — the reasoning is kept here so the same review does not get
re-litigated the next time it lands.

### Fixed

- **A blocked store now says so.** Safari Private Browsing, an exhausted quota
  and some embedded webviews all make writes throw. The app already caught that
  and set `canSave = false`, but said nothing: ticking kept working in memory
  and the entire session disappeared on reload. A warning now sits inside the
  sticky header — below the header it would scroll away, and this is the one
  message that must not be missed. It is checked on every render and on both
  failure paths, so a store that dies mid-session surfaces too.
- **`.hero .yr` reads `--dust` instead of `--dim`.** The hero is a gradient from
  `--card2`, and the year line sits high enough in it to measure roughly
  **4.33:1** — under the 4.5:1 AA floor. Everything lower in the hero has
  reached `--card` and passes.
- **Star buttons are a 36×44 target**, up from 30×34. The width carries what was
  the gap so neighbouring stars tile exactly rather than overlap — an
  overlapping expansion would make rating *less* accurate, which is the opposite
  of the point — and the height comes from a pseudo-element, so the row does not
  grow by 10px. A full 44 wide would need a 220px row and push the buttons in
  `.acts` onto a line of their own; 30px already cleared WCAG 2.2 AA (2.5.8,
  24×24), so that trade was not worth making for an AAA-level target.

### Changed

- **The backup-code parser tolerates codes it was not written for.** A code is
  now read as `NW<version>` plus segments, and unrecognised segments and version
  numbers are skipped rather than rejected. `exportCode` still writes `NW1`, so
  codes remain interchangeable with 1.0.0 in both directions — nothing new is
  being carried yet. This ships now precisely because it is worthless later:
  forward tolerance only helps if it is already installed when the first code
  that needs it appears.

### Added

- Guard: text contrast is computed from the palette rather than argued about.
  `--dim` measures **5.03:1** on `--sunk` and **4.57:1** on `--card` — the review
  reported 3.2:1 and asked for it to be lightened, which would have flattened the
  meta/body hierarchy to fix nothing. The guard fails under 4.5:1, warns under
  4.8:1, and hard-fails if `.hero .yr` returns to `--dim`.
- Guard: the storage warning must exist, must sit inside `<header>`, must have
  its `[hidden]` rule, and `flagSave()` must be called on all four paths.
- Guard: the parser must accept a forward-dated code (`NW2` carrying an unknown
  segment), must still accept a pasted restore URL, and must still reject junk.
- Guard 7 now **extracts** `exportCode` and `importCode` from `index.html`
  instead of reimplementing them. The copies had already drifted out of sync
  with the app, which is the exact failure this file exists to prevent — the
  parser change above would have gone completely untested.
- Guard: no `\uXXXX` escape may appear in the static markup. Inside `<script>`
  that sequence is an em dash; in markup it is six literal characters. Writing
  markup by adapting a nearby JS string is the natural way to do it, and it
  produced exactly this bug while the storage warning was being written.
- `qa/smoke.js` grew from 24 checks to 38. It now boots a **second document with
  `localStorage` throwing**, which is the only way to observe the silent-failure
  bug this release fixes, and drives the real in-page parser against a 1.0.0
  code, a forward-dated `NW2` code, a pasted restore URL, a code broken across
  lines, and five kinds of junk.
- Verified across two live documents that a 1.0.0 page and a 1.1.0 page produce
  **byte-identical codes** for identical progress and restore each other's
  correctly in both directions. A `NW2` code is, as designed, rejected by 1.0.0 —
  which is the whole argument for shipping the tolerance before it is needed.

### Not changed, deliberately

- **`idHash` stays 5 characters.** The review put collision risk at 0.019% today
  and >1% past ~300 entries, and asked for 6. Guard 3 has measured that since
  1.0.0 and warns at 1%; widening the hash means a new code format and orphans
  every backup already saved. The day a collision is real, the guard fails the
  build and the format changes then.
- **Tier badges already carry text.** `BADGE` renders the words ESSENTIAL, CORE
  and OPTIONAL, and guard 6 fails if any badge key lacks a label, so the
  colour-blindness finding does not apply.
- **The Cloudflare SPA fallback** was fixed before 1.0.0 — `not_found_handling`
  is `"none"` and guard 10b fails if anyone re-enables it.

## [1.0.0] — 2026-07-27

First public release: **96 films and 55 seasons of television, 1,434 episodes
across 27 continuities**, in three watch orders, with progress tracking, live
streaming links and offline support.

The app ran as an untagged build before this. Everything below is the QA pass
that went into tagging it, kept because it is the reasoning future changes will
need. The catalogue itself is unchanged: every `i:` slug is byte-identical to
the untagged build, so any backup code or saved progress from it restores
exactly as before. Verified in both directions — a code exported by the old
build imports into this one with identical state, and a code from this build is
still readable by the old one.

### Performance

- **The Path tab renders 76% faster and emits 68% less markup** (403 ms →
  96 ms, 285 KB → 91 KB on the full catalogue, measured headless). Detail
  panels — a description, five star buttons and three streaming links per
  entry — were built for all 151 entries on every render and then hidden with
  `display:none`, roughly 220 KB of the 285 KB, re-parsed on every keystroke in
  the search box. They are now built only for the row that is actually open.
- `buildGroups()` and `pool()` are memoised on `mode|scope`, the only two things
  they depend on. A single Home render called `buildGroups()` seven times and
  `pool()` six, running `visible()` 1,208 times to produce the same answer
  repeatedly. Next up is 81% faster, Home 56%, Progress 34%.
- **7% smaller over the wire** (45.4 KB → 42.2 KB gzipped). The 180×180 bat PNG
  was inlined twice as byte-identical base64 — 14,552 characters, once for
  `rel=icon` and once for `apple-touch-icon`. Both now reference the real
  `icon-192.png` that already ships beside it; `sw.js` caches it so offline
  installs are unaffected, and the paths are relative so a `file://` open still
  resolves them.

### Fixed

- **Tab bar icons sat on four different optical centres.** The bar used four
  unicode glyphs (`U+2302` house, `U+25B6` triangle, `U+2630` trigram,
  `U+25A0` square) resolved from four different font fallbacks. Measured on a
  24-unit grid, the play triangle's ink centroid landed at **x=9.57 against a
  target of 12.00** — a tenth of the icon box left of centre — and the four
  glyphs sat at four different vertical positions. `U+25B6` also carries an
  emoji presentation, so on iOS and Android it rendered as a wide colour glyph
  that ignored the yellow selected-state colour. Replaced with inline SVG on a
  shared 24×24 grid; all four now centre within 0.12 units on both axes. The
  triangle is centred on its centroid rather than its bounding box, because a
  bbox-centred triangle always reads as sitting too far right.
- **Next up sat 7.5px off-centre from every other tab.** `main` is
  `max-width:760px; margin:0 auto`, and Next up is the only view short enough
  to fit a desktop viewport without scrolling — so it alone lost the vertical
  scrollbar the other three tabs have, and the centred column slid sideways by
  half the scrollbar width every time you landed on it. `html` now sets
  `scrollbar-gutter:stable`, reserving the gutter whether or not there is
  anything to scroll. Touch devices use overlay scrollbars and are unaffected.
- **The hero title was 15% larger on Next up than on Home** — for the same
  film. Both views render `upNext()`, so tapping "Resume the path" showed the
  identical title jumping from `clamp(24px,6.5vw,36px)` to
  `clamp(28px,7.5vw,42px)`: Home overrode the size inline in both its hero
  variants, Next up was the only caller left on the stylesheet default, and the
  two drifted. The size now lives in the `.hero h2` rule alone and both inline
  overrides are gone.
- Scroll position was thrown away on every re-render. `render()` saved and
  restored `scrollTop` on `<main>`, which has no `overflow` and is therefore
  never a scroll container, so the value was always `0`. Now reads and restores
  the document scroll.
- The search box lost focus, closing the keyboard mid-edit, whenever the field
  was cleared. Refocus was keyed on the query being non-empty rather than on the
  box having held focus.
- Tapping a progress-donut slice collapsed every group and jumped to the top of
  the page, leaving the requested group up to twenty-six sticky headers below
  the fold. It now scrolls the target into view.
- A backup code carrying only star ratings restored correctly but reported
  `Restored 0`, which reads as a failure. Ratings now count toward the total.
- Tier filters were unreachable from the Path tab. The chip row spliced a tier
  chip in only while that tier was already active, so tapping "All" removed the
  only route back to Essentials. All six chips are now permanent; the row
  already scrolled horizontally.

### Accessibility

- Pinch-zoom is no longer blocked. `maximum-scale=1` in the viewport meta failed
  WCAG 1.4.4 on a screen this dense in 9–10px monospace, and only ever
  penalised Android — Safari stopped honouring the cap in iOS 10.
- Tab buttons used `aria-selected`, which is only meaningful on a
  `role="tab"`/`option`/`row` and was therefore ignored outright by screen
  readers. Now `aria-current="page"`.
- Group headers nested an `<h2>` inside a `<button>`, and film rows nested
  `<div>`s inside a `<button>` — both invalid, since a button may only contain
  phrasing content. Group headers now use the standard accordion pattern with
  the heading wrapping the button, preserving heading navigation.
- Added `aria-expanded` to group headers and film rows, `aria-pressed` to the
  watched tick, per-title tick labels (they all read "Mark watched"), and an
  `aria-label` on the search box.

### Removed

- `window.__lastExport`, written on every JSON export and never read anywhere —
  a debug leftover that pinned the full export in memory.
- Eleven dead CSS declarations. A "Canon skin" block at the foot of the
  stylesheet restated `font-family`, `font-weight`, `font-size` and two border
  colours that were already set 180 lines above, so the base rules were
  overridden on arrival and the real value of a token lived nowhere near its
  declaration. Folded back into their single base rule; the block is now
  additive only.
- Two hardcoded hex values (`#E3A72C`, `#28303F`) in the header progress ring
  that bypassed the palette. It now reads the same two tokens as every other
  progress track in the app.
- The unused `data-tab` attribute on the header ring button, which has had its
  own click handler since it was added.

### Changed

- Search placeholder reads "Search films and series" in Movies + Series scope.
  It always said "Search films" while searching both.
- `BUILD` is a semver string rather than a date, so it maps 1:1 onto this file.

### Added

- This file, and the release process in the README.
- Guards: the headline counts in the `<meta>` and `og:description` tags are
  checked against the data (they were hardcoded and unverified, so they could go
  stale while the README stayed correct); `BUILD` must have a matching section
  here and must equal the newest version in it; no hero title may carry an
  inline `font-size`; `.hero h2` must keep one; and `scrollbar-gutter:stable`
  must stay. Every new guard is negative-tested.
- `qa/smoke.js` grew from 12 checks to 24, covering on-demand detail panels,
  the full chip set, valid tab ARIA, no flow content inside buttons, the group
  cache surviving a scope round-trip, and hero titles matching across views
  including the completed-catalogue state.
