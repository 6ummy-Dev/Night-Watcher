# Changelog

All notable changes to Night Watcher are recorded here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
loosely — the headings are its, the entries are essays in the owner's voice,
and there is no `[Unreleased]` section because nothing ships unreleased.
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Entries before 4.0.0 are in `CHANGELOG-archive.md`.

**The version here, `BUILD` in `docs/index.html` and `VERSION` in `docs/sw.js`
must all be the same string.** `qa/guards.js` fails the build if they drift, and
also fails if the newest version in this file has no `## [x.y.z]` section. That
is the whole point of this file: a shipped change that nobody wrote down is a
change that gets undone by the next person who touches the line.

## [4.9.3] — 2026-08-28

**Zero pending.** The two independent audits of live 4.9.2 (ISO/IEC
25010 follow-up, 4.7/5; the multi-agent pass, composite 9.00) surfaced
exactly one in-tree residual between them, and the owner's call was to
clear it now rather than carry a one-line backlog into the weekend. After
this cut there is nothing pending in the tree at all — not even a rider.

### Added

- **The corrupt-backup sequence, named.** The ISO follow-up's remaining
  Reliability residual: every piece existed — junk rejection, malformed
  ratings, poison imports, the corrupt-store reboot — but not as one
  named walk. Smoke now runs it under one banner: seed real progress,
  hand the restore door five corrupt shapes in turn (truncated JSON,
  containerless JSON, containers of the wrong type, a code of illegal
  characters, binary noise) — every one refused whole, nothing lost,
  nothing invented, the stored payload still parses, the app still
  renders, saving still on. The tolerant half is asserted in the same
  breath: a TRUNCATED code is not corrupt — it merges what parsed and
  says it was cut, the designed behaviour since 1.x. 398 → 403 smoke
  checks.
- **negtest640** (2 smoke fixtures): a restore door that stops refusing
  containerless JSON, and an `importCode()` that stops flagging a
  truncated body, are each caught by name. Shards repacked level —
  72 suites, 1,138 fixtures.

## [4.9.2] — 2026-08-28

**The empty backlog.** The owner's call: everything still pending lands
here, and nothing is left open in the tree. Three things were pending —
the Early Hints patch parked since the 27 Aug Cloudflare check, the three
in-tree items from the 26 Aug ISO/IEC 25010 triage, and the one nit from
the 4.9.1 audit (`NightWatcherQA4.9.1.md`, which otherwise closed clean:
its "154 sections" baseline line is a miscount — the run it quotes prints
153). After this cut, `open-items.md` holds only the owner's off-tree
items and the dated triggers.

### Added

- **Early Hints.** Six `Link: </fonts/…>; rel=preload; as=font;
  crossorigin` lines under `/` in `docs/_headers`. With the zone toggle on
  (Speed → Optimization → Protocol — the owner flips it after the deploy),
  Cloudflare caches the hints from the document response and answers the
  next request with a `103` carrying them, so the six font fetches overlap
  the 224 KB HTML transfer instead of waiting for the parser. Guard 104
  holds the hints, the `<head>`'s own preload tags and `docs/fonts/` as
  one three-way set (token form pinned; a hint under `/*` refused); guard
  133 narrows the worker's built responses to the three document relations
  — a markdown body gets no font hints. RELEASING gains the `103` wire
  check, which reads the toggle no guard can see (the hint cache primes on
  the first request; the 103 shows from the second).
- **The keyboard traversal, as a named test.** The ISO triage's
  Interaction gap, the half a harness can do: browser-check now Tabs
  through the real page from a known state — every stop must be visible,
  outside inert panels, and show the `:focus-visible` outline; the
  header's three controls, the peek, the search box, a chip, a group
  header and all four footer tabs must be visited in document order, with
  a cap that turns a focus trap into a failure. Then the belt: Enter on
  the parked peek drops it, the path buttons and buckle join the tab
  order, Escape closes it. (The screen-reader pass stays a manual item —
  a harness cannot listen.)
- **Offline → tick → reload, as a named test.** The triage's honest
  Reliability lift: with the service worker in control and the network
  off, browser-check ticks an entry, reloads offline, and the mark is
  still there — the localStorage write under a SW-served page, the
  debounce flushed by pagehide, and `restore()` reading it back from the
  cache-served shell, one sequence. 101 → 108 browser checks.
- **`qa/contrast.md` — the numbers, attached.** Section 20 measures every
  ink-on-surface pair in both themes on every run; the figures lived only
  in the run's notes, and the ISO evaluator could only take the claim on
  faith. The table is now a file: written from the measured pairs under
  `npm run bless`, never typed, and any other run fails if it does not
  match what the run would write — a palette change without a bless is a
  stale table. 56 pairs, worst pair named per theme; the gradient,
  blended-fill and UI-exemption edge cases stay asserted in section 20
  itself.
- **negtest630** (6 fixtures): the hint set torn three ways, a hint leaked
  onto the markdown response, the contrast table stale and missing. Shards
  repacked level — 71 suites, 1,136 fixtures.

### Fixed

- **The 4.9.1 audit's one finding:** the 4.9.0 entry cited the 4.8.0
  report with a hyphenated filename the reports do not use. One spelling
  (the unhyphenated form is the reports' own).

## [4.9.1] — 2026-08-28

**The loop closed.** The 4.9.0 delta review found one real defect, two
instances of the drift 4.9.0 was built to end landing inside 4.9.0 itself,
one wrong sentence in a day-old document, and hardening nits. All of it is
here; the Early Hints patch stays its own cut. (The report:
`NightWatcherQA4.9.0.md`, 28 August, maintainer-local.)

### Fixed

- **The 304 path could be inert in production.** `worker.js` compared
  `If-None-Match` with strict string equality — but Cloudflare weakens
  ETags on the compressed responses it serves, so the header a real
  browser echoes back is `W/"x"` for the asset's `"x"`, and the
  revalidation the 4.9.0 fix exists for would never have fired at the
  edge. The comparison is weak now and honours `*` (RFC 9110 §13.1.2);
  guard 133 drives both cases.
- **The sweep did not cover the release that shipped it.** negtest610's
  README-row half missed five rows — four of them files 4.9.0 added — and
  had no way to notice. Five fixtures added, and the suite now counts the
  table's rows against its own fixtures, so the next added row fails the
  sweep instead of drifting past it (the head half already had its stray
  census). The 39 head fixtures also pin the lost tag's name in their
  expects now.
- **Two history pointers aimed at the file the histories had just left.**
  `sw.js` and `worker.js` said "History: NOTES.md" for sections that moved
  to `NOTES-history.md` in the same release (run-all.sh carried an older
  one). Fixed — and section 65 now reads every pointer on every run: the
  old address fails, a named file must exist, a quoted heading must be in
  it.
- **DATA-MODEL.md's one wrong claim.** The JSON import does not keep
  unknown slugs — `applyMarks()` admits only catalogue ids; they are
  counted and reported, and the file itself is what preserves them
  (owner's call: reword, don't change the import).
- **Section 153's census reads every head tag.** The first census filtered
  to meta/link, so a planted `<base href>` — a real hijack vector — a
  second plain script or a third style block was invisible, and a
  duplicated required tag matched its own regex. Every element is on an
  allowlist now, a head script may only be the JSON-LD block, styles are
  exactly two, and each required tag must appear exactly once.
- **The shard weights this changelog printed were stale on arrival** —
  computed before 4.9.0's own six struck fixtures left. The 4.9.0 entry is
  corrected in place, and section 113 measures the packing's balance on
  every run (fail over 15% off the mean) so the numbers live nowhere in
  prose. Same class, same fix: the episode-floor comment in guards.js now
  names no number either.

### Changed

- **`sw.js` deletes before it puts**, both under `ignoreVary` — `put()`
  honours `Vary` when it dedupes, so `/` could hold the install-time
  wildcard-Accept entry beside a navigation's and answer the stale one
  forever (harmless within one VERSION, and exactly what the "one
  representation per path" comment claimed was enforced). Guard 132 pins
  it; its harness cache grew a `delete`.
- **The last warn of the promoted family is a fail:** a control whose CSS
  declares no measurable height switched the touch-target rule off with a
  warning outside CI (guard 75).
- **The search-everything offer appears only under the All chip** — under
  Watched or Skipped its "No films match" could be literally false (films
  matched the query; the chip hid them).
- **Copy.** The three dated phrasings the 4.9.0 pass missed (universe 08's
  "newest live-action continuity", universe 44's "so far … will land", the
  2030s "still being made") are rewritten durable. README's catalogue
  examples now carry `lo` and `r`, so a copy-paster's first bless is not
  red twice; the package.json row says how wrangler actually runs; the
  NOTES-history row claims dated headings, not one per release — and the
  4.9.0 essay that release never wrote for itself is written
  ("The clean road", NOTES-history.md). CONTRIBUTING documents the `+1`
  suite-number suffix; ARCHITECTURE's render steps match the code's order
  and `bag`/`fmt` read as the optional fields they are; the 4.9.0 entry's
  "nearest control" is the first with the same action.
- **negtest620** (11 fixtures) covers the new checks; the shards repacked
  level; 70 suites, 1,129 fixtures.

## [4.9.0] — 2026-08-27

**The clean road.** A MINOR because the catalogue grew — five entries the
4.8.0 report put to the owner, each decided by name (below) — and because
the script's shape moved under the guards' feet on purpose, before the
next feature rather than during it. The rest is the report itself, fixed
in full: three runtime defects a reader could meet, two ways a green
`npm test` was telling less than the truth, the documents corrected where
they would have misled a new developer today, the history moved out of
the files a reader and a crawler are served, and the four documents the
tree never had. Everything the report listed is either done here or
written down as a decision. (The report: `NightWatcherQA4.8.0.md`,
27 August, maintainer-local.)

### Added

- **Five catalogue entries, each decided by the owner against the README's
  rules.** *Man of Steel* (2013) opens the DC Extended Universe under the
  written exception — no Batman, and *Batman v Superman* is its direct
  sequel — so the exception now names eight entries. *Elseworlds* (2018),
  the three-night Arrowverse crossover, joins the Batwoman continuity as
  the hour Kate Kane debuted in; the era note for "After the cowl" stops
  counting to three. *Scooby-Doo and Guess Who?* — "What a Night for a Dark
  Knight!" (2019), Kevin Conroy's Batman for twenty-two minutes — joins
  *Scooby-Doo Meets Batman* in a group renamed **The Scooby-Doo Crossovers**
  (no order between them). *The Death and Return of Superman* (2019), the
  DCAMU's recut of two films, in as optional beside the two Deluxe
  Editions. *The Dark Knight's First Night* (1991), the two-minute pitch
  reel Bruce Timm and Eric Radomski drew to sell Fox on the series, opens
  the DC Animated Universe. **Left out, and recorded in the README:** the
  *Meet the Batwheels* shorts, music-video character introductions that
  fail the "a story, not a sketch" test the way *Super Best Friends Forever*
  did; and *Catwoman* (2004), *Powerless*, *Superman* (2025) and *Peacemaker*
  season 2, which get asked and fail the rule they are now listed beside.
  Ratings sourced (guard 92's table moves with them): PG-13, TV-14, TV-PG,
  PG-13, NR. Counts everywhere: 137 films, 68 seasons, 44 continuities,
  205 entries; the share card regenerated; life positions renumbered in
  eras 2, 7, 8 and 11.
- **Era 0 says why, per row.** `out:` rides `FILMS` now and `metaOf()`
  prints the reason on every "Outside any timeline" row in Bruce's life
  — another Bruce, more than one Batman, no Batman in it, a Batman with no
  life to place (the two LEGO Movies, the reason the era note never
  named), place not decided yet. The README's "with the reason given" is
  true per row.
- **Section 153, the head's required tag set.** The report deleted each of
  the 42 `<head>` tags and ran `npm test`: thirteen went green, the
  manifest link among them — the manifest file was guarded, the link that
  makes the app installable was not. Every required tag is now named and
  its absence is a failure; a stray tag fails too until it joins the list.
  `og:url` must exist (guard 38's only check on it was gated on its own
  presence), and smoke's theme-colour read is null-safe instead of a
  `TypeError`.
- **negtest610, the delete-and-assert-red sweep, made permanent:** every
  head tag deleted in turn, every README file-table row deleted in turn,
  107 fixtures. The README-row half needed section 45 to stop trusting a
  hand list: the tracked set comes off `.git/index` now (the parser guard
  144 already had, lifted into `gitIndexPaths()`), and `_lib.sh` carries
  the index into every scratch tree so the fixtures prove something. The
  four shards repacked by weight, level. (The four figures first printed
  here were stale on arrival — computed before this release's own six
  struck fixtures left the corpus. Corrected in 4.9.1, where section 113
  measures the balance on every run instead of prose stating it.)
- **Four documents the tree never had.** `ARCHITECTURE.md` (the sections
  of the script, `S`, the counting pipeline, the routes, one render);
  `DATA-MODEL.md` (the payload key by key, the `NW3` grammar, the JSON
  export, the tolerance rules); `CONTRIBUTING.md` (which document answers
  what, how a change lands, the add-a-guard and add-a-suite checklists);
  and `NOTES-history.md`.
- **Smoke, 391 → 398:** the Crisis trilogy in release order and the Beyond
  pilot before its season; the search-everything offer under the tier
  pouch; the cross-tab write-back and the stale-clock-after-erase case; a
  view hash consumed once routed; a pasted code surviving a trailing
  quote, period or bracket.

### Fixed

- **Release order inverted a numbered trilogy.** `releaseCmp` broke a
  same-year tie by title, so *Crisis on Infinite Earths — Part Three* sorted
  before *Part Two* ("Th" < "Tw") and *Batman Beyond* season one before its
  pilot feature — in the app, in `orders.txt`, and in what crawlers read.
  The tie is the catalogue's own order now (group, then position).
- **"Search everything" ignored the tier pouch** — a 4.8.0 regression of
  the 1.7.5 rule. Under Essentials, a search that only hit Optional series
  offered to widen the scope, switched `scopePref`, and showed nothing.
  The hidden-count loop asks `onRoute()` like everything else.
- **The cross-tab merge never wrote back.** The `storage` listener merged
  into memory and stopped, so two tabs each writing inside the 200 ms
  debounce ended with unions neither had on disk — close both and one
  side's marks were gone. It persists when anything moved; the echo
  merges nothing, so it cannot loop. And a clock at or before an adopted
  `resetAt` is stale by definition, so a tab that never saw the erase
  cannot resurrect what it erased.
- **The splash cover had no failure exit.** `splashOff()` ran only from
  the boot, so a throw before it — a CSP hash broken by a
  whitespace-reflowing proxy, a listener registration, the first render —
  left a permanent bat over the one page written for exactly that reader.
  Three doors now: a `finally` around the boot render, a `window` error
  listener that is the first statement of the script, and a CSS failsafe
  that fades the cover after five seconds whether or not any script ran.
- **View hashes were sticky.** `#life` stayed in the address bar, so a
  reader who arrived on it, chose Release order and reloaded was put back
  into "Viewing Bruce's life"; and `revealHero()` persisted from a
  read-only view. A routed view hash is consumed like `#nw=` always was,
  and `revealHero()` no longer writes.
- **A pasted backup code with a chat client's closing quote, period or
  bracket** was "not a backup". Trimmed; a junk suffix still rejects.
- **Offline through `Vary: Accept`.** The Cache API honours `Vary`, so the
  precached `/` never matched a navigation's `Accept` and offline survived
  only through the explicit `./` fallback. Every match passes
  `ignoreVary`: one representation per path in that cache.
- **The Worker's markdown response dropped its validators** — no `ETag` or
  `Last-Modified` under `no-cache`, so every revalidation was a full fetch,
  and HEAD read the body to return nothing. The asset's validators ride
  through, a matching `If-None-Match` answers 304, HEAD never reads the
  body; guard 133 drives all three.
- **Warnings never affected the exit code.** Nine sites warned where the
  thing they check had gone missing ("could not find the count to
  verify" switched a section off) and the run printed "all guards passed
  (1 warning(s))" with exit 0. Those sites fail; in CI any warning at all
  is red.
- **Two sites tested the badge instead of `tierOf()`**; the `.pathseg`
  carried a `data-lit` nothing read while guard 128 pinned the vestige
  instead of the live setter in `renderHead()`; `.toast` ignored
  `--vpdead` and floated too high on the healed iOS viewport; no-script
  readers saw "Loading" in the subtitle forever; the CSP `<meta>` sat
  after the six preloads and the manifest link (ungoverned) and granted
  `style-src 'self'` for a stylesheet that does not exist; Escape did not
  close a dropped belt; unmarking from Recent activity dropped focus to
  `<body>` (the restore falls back to the first control with the same
  action); *Kite Man* had no season label; Knightfall Parts 2 and 3 lost
  their "Batman:" prefix relative to Part 1.
- **Catalogue copy.** Thirty-five descriptions used straight quotes and
  twenty curly, never both in one entry; every quote in `PATH` is curly
  now (display text only — no slug touched). The dated logistics in three
  released entries ("landed 31 July 2026", "Digital 25 August, disc 8
  September", "finishing in July 2026") and the relative phrasings ("the
  most recent run", "the final season to date", "still running … and
  counting", "the current release") are gone — nothing in the catalogue
  needs a clock to stay true. *Harley Quinn* season 6 checked: in
  development, undated, so the group is not stale.
- **Documents that would have misled a new developer today.** NOTES
  contradicted itself on the merge (present tense "never resurrects an
  untick" beside the 3.8.0 clocks) and on `KEY` ("bump only for a breaking
  shape" beside "must never change"); the README's catalogue schema
  omitted `lo`, `r`, `out` and per-entry `fmt`, an entry written from it
  failed guard 70, and the universe object was not described at all; the
  README said the guards had "zero dependencies" (Acorn since 4.2.4),
  described `--bless` as "re-snapshot frozen IDs" (it rewrites
  `index.html`, `orders.txt`, two JSON-LD blocks and three manifests —
  every writer is listed now), called `qa/smoke.js` optional (it is half
  of `npm test`), described licence links that do not exist and omitted
  the Brave Creators one, listed four of the eight route tokens, and
  misdescribed `qa/subset-fonts.py`; the versioning rule did not cover
  feature MINORs; the project's seal status was stated nowhere a joining
  developer would look. `SECURITY.md` and `security.txt` said "no server"
  with a Worker at the edge. The `parkFocus()` entry described attributes
  that have been static since 4.0.4. `docs/vp.html`, the iOS viewport
  probe, outlived the investigation it answered (closed in 4.0.9) —
  retired, with its guard-13 exclusion; **the zip cannot carry a deletion,
  so the owner removes the file by hand.**

### Changed

- **The groundwork, before the next feature.** `GROUPINGS` is the three
  orderings as one table — prefix, list, frozen roof code, membership,
  tag, comparator — and `modeGroups()` builds groups from it; the key
  scheme that lived in five places (`buildGroups`, `groupFilms`,
  `viewStats`, `drawShareCard`, `goToGroup`) lives in one. `render()`
  snapshots every input and textarea in the panel through
  `fieldSnap()`/`fieldRestore()` instead of carrying one dance for `#q`
  and another for `#restorebox` (and a third in `fillPanel()`); a new
  input needs no new copy. `segmented()`/`segButtons()` render every
  segmented control — the three pouches, the theme row, the path
  segments, the chips — from named option tables, each wrapper now
  `role="group"` with an accessible name (the report's accessibility
  note, landed in the one place it could land). `SCHEMA` is the persisted
  state as a table — one row per key, its writer and its reader — and
  `persistNow()`/`restore()` are loops over it; the `mode` mirror the
  payload wrote for a 1.1.0 downgrade is dropped (the read stays). The
  `window.storage` adapter for Claude artifacts, unreachable on every
  origin the config declares, left with the Promise shape it was the only
  reason for: the store is synchronous and `restore()` returns. The
  feature detection below the floor the script already requires
  (`closest`, `scrollIntoView`, `replaceState`, `toBlob`,
  `focus({preventScroll})`, the two observers) went, and the floor is
  written down in NOTES ("The floor"); smoke installs inert observers and
  `scrollIntoView` for jsdom.
- **AST predicates in the guards.** `fnNode`, `fnCalls`, `topVar`,
  `objProp`, `srcOf`, `schemaRow`, `schemaKeys`, `callsIn` — questions
  the parsed program answers that a formatter cannot change. The twenty
  sections the refactor touched were re-anchored through them, so the
  next refactor of the same shapes does not go red in twenty places; the
  sections pinning a reviewed wording keep the wording. Seven regex-based
  function extracts that survived the 4.2.4 parser switch now use `fn()`;
  the CSS is extracted one way (`cssText()`/`cssRules()`, every `<style>`
  block, so the `<noscript>` block is seen); three unreachable
  truthiness checks on `optionalFn()` results are gone; section 107's
  nested-section check reads the headers through `sections()` and strips
  comments like every other reader; the unnumbered "idHash is memoised"
  block is filed as the tail of section 2 on the record (a number of its
  own would renumber 151 sections and every fixture's `sect`).
- **`qa/browser-check.mjs` measures instead of sleeping:** the nine fixed
  sleeps (80–450 ms) are `frames()`, `scrollSettled()` and `until()` —
  waits for a paint, a scroll offset that has stopped moving, a state the
  page reaches on its own timers, each with a ceiling. Screenshots land
  beside the script, not in the working directory; `const URL` no longer
  shadows the global.
- **CI.** `setup-node` asks for the newest 22 (`check-latest`) so a lagging
  runner image cannot hard-fail `npm ci` under `engine-strict`; `wrangler`
  — the heaviest package in the lock and used by no CI job — left
  `devDependencies` for `npx wrangler@4.123.0` in the deploy and preview
  scripts (`wrangler.jsonc` drops the `$schema` that pointed into
  `node_modules`).
- **Documents.** `NOTES.md` is per-symbol and rules, present tense, with a
  table of contents; every post-mortem, release essay and archived comment
  block is `NOTES-history.md`, one dated heading each, superseded
  sections marked. `CHANGELOG.md` opens at 4.0.0; 1.x–3.x are
  `CHANGELOG-archive.md`, whole. The served and config files carry their
  invariants and a pointer, not their history: `docs/_headers` (85 lines
  of essay to a page), `worker.js`, `docs/sw.js`, `docs/robots.txt`,
  `docs/sitemap.xml`, `wrangler.jsonc`. `RELEASING.md` drops the
  review-ticket lead-ins and its placeholder command, states the
  quantize, and reframes "Freeze notes" as standing notes for any cut.
  The README's episode floor reads 1,950+ (the data is four short of the
  2,000 the old floor would have tripped on); the fixture prologue is one
  `pro()` helper in `_lib.sh` where nine suites redefined it; the six
  guard-66 fixtures copied across three suites are struck (`NO_SECT_PINNED`
  770 → 764); the guards' own comments cite the releases that shipped
  (3.0.0 and 2.5.0, not the 2.8.0 and 2.2.1 that never did) and render
  their em dashes as em dashes.

### Not done, on the record

- **The 7 px and 8 px mono lines** (`.bs2`, `.bd`) stay: the buckle's
  three lines were measured into a 44 px belt in 4.8.0 and the badges into
  one box in 1.x, and a floor for low vision is a design pass, not a
  number change.
- **Network-first with no timeout in `sw.js`** stays: the timeout would
  have to be a real `Promise` race, which the synchronous harness guard
  132 drives the worker with cannot see, and the lie-fi case is the price
  of a bad deploy never being sticky.
- **The 106 fixtures that share an expect string** stay: the fixture
  twins in far suites are deliberate (`RELEASING.md`, step 4).

## [4.8.0] — 2026-08-26

**The third pouch.** Until now the tier lived only in The path's chips,
and a chip hides rows without moving a count. So a reader following the
Core route had to skip every Optional entry by hand to reach 100%, the
Skipped tally carried the cost, and the share card showed steel where
there was never anything to skip. The tier is now the third pouch on the
belt, beside format and scope, and it feeds `visible()` the way those two
do — one term, through `tierOf()`, so the belt and the chips can never
disagree about what "Core route" means (Essentials inside, Optional
out). Every count on the page follows from `pool()`, which is why the
change is one term and not forty. Skip goes back to the job it was built
for: "not this one, not now" — the reader with an announced title on the
route still skips it and unskips it when it lands. The chips stay, all
seven; a glance must not need the belt. Owner's calls, 26 August, all
before code: the third pouch itself; the wording, settled against two
rows ending in the same word; the closed buckle's rule; and the chips.

### Added

- **A tier pouch: Essentials / Core route / + Optional.** `S.tier`
  (`ess`, `core`, `all`), persisted beside `scope` and `format`, read
  back through a whitelist that defaults wide — a save written before
  4.8.0 opens with + Optional, so nobody's denominator moves overnight
  (the 1.5.0 rule). `onRoute(f)` is the one test; `visible()` calls it
  and `groupsKey()` carries the tier, so the group cache invalidates
  with it. The pools nest: 28 essentials inside 74 core route inside 200.
  Toasts on change, in the scope row's voice: "Optional added", "Core
  route only", "Essentials only". The first-run chooser asks the same
  third question under "What are you watching", at the larger size.
- **The buckle names only what is narrowed.** One line per pouch, in
  pouch order — Animated, Movies, Core route — and when nothing is
  narrowed there is nothing to list, so it reads the app's own two words:
  EVERY BATMAN. The accessible name still reads all three answers in
  full. Measured before it was built: the slot is 55px at 390 and grows
  with its content; every line here is under the 62px "Movies + Series"
  already took, and three lines fit the 44px belt.
- **The Optional chip explains a narrowed belt.** Under the Core route or
  the Essentials, tapping Optional used to say "Nothing in this filter
  yet", which was false — the entries exist, the belt is hiding them.
  The empty state now says so, names the setting, and offers **Add
  optional** (the same `data-tier` handler; the "Search everything" shape
  from 1.7.5).
- **Section 152** holds the whole shape: the declaration, the write, the
  whitelisted read, `onRoute()` through `tierOf()`, the three pools
  nesting with the Essentials kept inside the Core route, the pouch's
  three labels, the format row's wide label, no pouch button saying All
  or Everything, the drop order, the first-run row, the handler and the
  toasts, `buckleLines()` run against four states, the buckle's markup
  and label, the stair's third step and its closing travel and stagger,
  the chooser rows' nowrap, `everyBatman()` on all three axes, "every
  Batman there is" living exactly once, Home's tiles, the Optional chip's
  empty state, the seven chips, and the share card's route line.
  **negtest600**, 36 fixtures: 33 against the section, 3 smoke. Smoke
  gains 30 checks (391): the pouch driven through its real buttons, the
  count, the storage, the toast, the buckle in four states, the chip's
  empty state and Add optional, Home's tiles, the first-run row, and
  three cold boots — no tier, a Core-route save, a junk tier.

### Changed

- **"All" left the pouches.** The format row's wide button reads
  **Animated + live**; the tier row's reads **+ Optional**; the scope
  row already read Movies + Series. Every pouch button names what it
  holds, and the belt's one summary word belongs to the buckle alone —
  two rows ending in "All" was the confusion the wording was settled
  against. The chooser's rows drop to the pouches' `.05em` tracking with
  `white-space:nowrap` and 4px side padding, because "Animated + live" at
  `.09em` broke across two lines at 390 (the 1.5.7 lesson, at the other
  size); the third button may run a few pixels wider than its neighbours
  at 375 and 360 rather than wrap.
- **The stair has three steps.** `.scope.tier` sits under the scope pouch
  at 22px inset and `z-index:0`, closes on its own travel (`--out:-305%`),
  and the middle pouch gets its own stagger on the way out (.05s) and back
  (.04s), so the three tuck first / middle / last.
- **"Every Batman there is" is said once, and only when it is true.**
  `everyBatman()` tests all three axes; `allLoggedWord()` says "every
  entry on the route" otherwise. The Next up close, the Home hero's blurb
  ("every side story" only with + Optional) and the share card's 100%
  line all read through it, and the card's tag line carries CORE ROUTE
  or ESSENTIALS beside the format and the path.
- **Home's tier tiles follow the belt.** Under the Core route the Optional
  tile goes (it would read 0/0 — the denominator lying in a second
  place); under the Essentials only the Essentials tile stays.
- **FAQ Q3** gains one sentence: the belt can set the count to the core
  route, or to the essentials alone, so there is nothing to skip.
  `buildFAQ()` is still the single source; the bless moves the seed and
  the FAQPage node together.
- **Weight.** 222.0 KB raw / 63.6 KB gzipped (+2,620 B raw over 4.7.0;
  script bytes 146,167 → 148,325). README quotes 222 / 64. The 250 KB
  ceiling stands.

### Not done, and why

- **No `#core` / `#essentials` deep-link tokens.** Guard 72's route
  vocabulary is a published interface and stays frozen; the tier is a
  preference, like the scope preference a link may not overwrite (1.7.5).
- **No migration of existing skips.** An entry skipped as a workaround
  simply leaves the count while the belt is narrow and comes back, skip
  intact, when it widens. Nothing to untangle, so nothing is touched.
- **Backup codes and the JSON file still carry no tier**, as they carry
  no scope and no format: progress and path only, by design (1.5.0).

## [4.7.0] — 2026-08-26

**The cover, and the audit's bundle.** A phone showed the crawlable seed
for a frame on every launch — the H1, blue underlined links, "Loading" —
before the first render replaced it. The seed is real markup inside
`#view` on purpose (1.8.6; both analyzers skipped `<noscript>`), so the
frame between parsing it and running the script was always going to paint.
4.7.0 covers it: a fixed plane in the page's own ink with the header's bat
on it, painted from the head CSS so it is in the first frame, and taken
down one frame after the app has rendered underneath — no timer, no hold,
no font waited for. The fade out is the only time it costs, and a reader
without JavaScript never meets it. Since a minor was opening anyway, the
4.6.0 audit's on-page bundle rides along, and the one open-items note
(the chosen drop pouch) is settled. Three calls, all the owner's, 26
August: the cover over a timed splash, the ceiling's fifth number, and
the dimmed pouch — a hairline was built first, looked at on the phone,
and could not be noticed.

### Added

- **The splash cover.** `<div id="splash">` is the first thing in
  `<body>`, outside `#app`: `position:fixed`, `--ink` ground, the header's
  bat in `--signal` at 64vw (320px cap) — a splash, not an icon. `splashOff()` runs after the first `render()`
  in the restore callback, waits one `requestAnimationFrame` so the app has
  painted under it, sets `.gone` (opacity 0, the bat shrinking to
  a third over 320ms) and removes the element after the fade. Reduced
  motion is the existing transition kill: `.gone` lands as a cut. A
  `<noscript><style>` in the head hides it for a reader without
  JavaScript. Section 151 holds every part of that shape — first in body,
  the header's own path, no entrance animation, no timer before the fade,
  the undo in the head — and the "no `<noscript>` anywhere" clause of
  section 78 narrows to "one `<style>` and nothing else", with attributes
  refused. ~1.0 KB.
- **The seed samples the two orderings it only described.** Each era on
  the eras list now opens with its first title, from the app's own
  `lifeCmp`; a new "By release" paragraph names the first eight from
  `releaseCmp`, decade-bucketed the way the app buckets. Both are generated
  in section 78 from the data and blessed, never typed — an announced
  title that leads an era (Dynamic Duo, the Grayson years) carries "not
  out yet" the way the full list marks it. The paragraph ends on the seed's
  one link to a file: `orders.txt`, the plain-text catalogue with all
  three orderings in full. Section 90 allows exactly that href, once; a
  second file, or none, fails.

### Changed

- **Three FAQ answers, one source.** Q1 gains the words the query actually
  uses ("every Batman film and series in each, no spoilers"); Q2 names the
  1966 series and *Batman: The Animated Series* instead of "all of it"
  alone; Q7 gains the frozen-ID promise in crawlable prose ("a backup
  written today restores in every later version, because an entry's
  identity never changes"). `buildFAQ()` is the single source; the bless
  moves the seed and the FAQPage node together.
- **The chosen drop pouch is a dimmed yellow.** New token `--signaldim`
  `#B8941A` — ink letters at 6.9:1, a clear step (1.95:1) under the belt's
  `--signal` — replaces the 4.6.0 belt-bright fill, so the chosen pouch is
  read at a glance and the belt stays the brightest yellow on the page. A
  1px hairline was tried first and rolled back the same day: on the phone
  you could not tell which pouch was chosen. Section 55 pins the token,
  the value and the ink letters, and refuses the belt's own fill by name;
  three fixtures re-aimed.
- **The weight ceiling is 250 KB raw.** The owner's fifth number, on the
  record 26 August. This tree is 219.4 KB raw / 63.0 KB gzipped
  (+2,728 B raw over 4.6.0; script bytes 145,909 → 146,167, all of it
  `splashOff()`). The 80 KB gzip ceiling is unchanged. README quotes
  219 / 63.

### Not done, and why

- **`orders.txt` in the sitemap.** The 4.6.0 triage proposed it and said no
  guard touched the sitemap. Section 105 does, on purpose since 2.7.2: the
  seed and `orders.txt` are the same 200 entries, and submitting both asks
  a search engine to choose between two near-identical bodies on one
  domain. The body link above is the honest answer to "keep it linked";
  the sitemap stays as decided.

### Why MINOR

A visible feature after the seal: the app changes look — a cover on
launch, a dimmer pouch where the belt-bright one was — and the crawlable page grows two
samples and a link. No catalogue movement, no change to saved progress,
no new files served. One new negative suite (negtest590, 22 fixtures) and
one new guard section (151).

## [4.6.0] — 2026-08-25

**Two uniforms and a yellow belt.** The first feature after the seal — a
new decision, with its own entry, exactly as the seal said it would be.
Two themes, two suits: Dark Deco was always the blue-and-grey uniform and
is untouched; Darker stops being Dark Deco with the lights down and becomes
the black uniform. And the Belt is finally the utility belt — yellow, with
dark pouches. Three calls, all the owner's, confirmed on the design board
on 25 August from renders of the real app. CSS only: no markup, no state,
no script byte moves, catalogue untouched, nothing ticked moves.

### Changed

- **The Belt is yellow.** The strip fills `--signal`, framed and seamed in
  1px `--ink`, and the chosen path inverts — an ink pouch with signal
  lettering — where it used to be the one signal segment on a dark strip.
  The buckle sits one step deeper in `--signalpress`, and both of its lines
  set in ink (the 3.3.0 `.bs2` contrast story ends here: 11.0:1 on the
  plate). The peek — the 12px that parks under the header — is the top of
  the same belt: a signal rail with an ink notch at the chosen path, so when
  the belt drops the pouch lands exactly where the notch was. The glow, the
  positions, the parking arithmetic and every state are unchanged.
- **The drops are part of the belt.** The format and scope pouches keep
  their ink fill and their from-behind shadow, and take signal edges and
  signal lettering; the chosen pouch inverts to a signal fill with ink
  letters — the belt's own inversion, mirrored. Ink seams (A) over gold
  seams (B), owner's pick.
- **Darker is the black uniform.** Every surface, hairline and grey in the
  Darker block goes neutral: page `#000000`, sunk `#050506`, cards
  `#0E0E11` / `#17181C`, hairlines `#232429` / `#33353C`. Bone is a silver
  `#C9CCD3` (the cowl's highlight) instead of the dimmed blue-white
  `#AEB6C8`; `--dust`, `--dim` and `--staroff` get neutral overrides of
  their own for the first time (`#A0A4AD` / `#969AA3` / `#6B6F7A`) so no
  blue-grey ink is inherited onto a black suit. Signal, steel and crimson
  are inherited untouched — the belt, the cape and the sky are the same in
  both suits. Every ink-on-surface pair clears 4.8:1 on every surface
  (worst: bone 11.0, dust 7.1, dim 6.3, steel 5.8 on `--card2`), so section
  20 does not warn; the surface ladder holds (147). The status-bar colour
  stays `#000000`.
- **Two guards moved with the belt.** The "chosen path is marked in
  signal" rule now asserts the inversion (ink pouch, signal letters, never
  bone) and that the strip itself is signal; the "include rows never wear
  signal" rule inverts to its opposite for the same reason, and pins the
  pouch seams and lettering. The height relation between the rows — which
  was asked first — is unchanged and still pinned. Section 147's comment
  records the retune.

### Why MINOR

A visible feature after the seal: the app changes look. No new files, no
deletions, no catalogue movement, no change to saved progress. Weight moves
by 52 bytes of CSS; script bytes do not move.

## [4.5.4] — 2026-08-25

**The Knightfall trigger.** The one dated catalogue edit every release since
1.9.5 said would wait for this day, and the first commit after the seal. A
decision, not a mechanism: the seal said anything landing after it gets an
entry like every other, and this is that entry. One entry moves, nothing
ticked moves, no saved progress is touched, no slug changes.

### Changed

- ***Batman: Knightfall — Part 1* is out.** Digital 25 August 2026, disc
  8 September, as the entry has said since 1.8.7. The `u` badge drops — NOT
  OUT YET leaves the row, the Next-up hero, the crawlable seed and
  `orders.txt` in the same edit — and the entry gains its certificate:
  **`r:"R"`**, sourced (the MPA rating is R for strong bloody violence;
  the 26 July WB release notice and the 25 Aug release-day coverage both
  carry it). The blurb is unchanged: it was written as a premise and a date,
  and both are still true. Parts 2 and 3 stay NOT OUT YET with no rating —
  late 2026 and early 2027, undated, exactly as before.
- **Guard 92's distribution moves with it.** 91 MPA + 26 NR + 78 TV = 195
  rated, five unreleased carrying none; `R` 17 → 18. The comment that said
  the R "rides the 25 Aug trigger patch" now says it did. The
  negtest195 fixture that handed a certificate to an unreleased entry early
  was aimed at Part 1 — it is re-aimed at Part 2, which is what an
  unreleased entry is now.

### Why PATCH

One data edit and its guard, blessed. No feature, no new files, no
deletions, no tag. The share card is untouched — its three numbers (133
films, 67 seasons, 44 continuities) did not move, so guard 91 is green
without a regeneration. Weight moves by the bytes of `r:"R"` minus
`b:["u"]`.

## [4.5.3] — 2026-08-24

**The seal, last cut.** No feature. The final audit of the 4.5.2 tree
called it seal-ready and left eight doc-and-comment nits and one decision;
this takes the nits and makes the decision. Catalogue untouched; nothing
ticked moves.

### Changed

- **The Plex faces are renamed.** IBM's upstream OFL header reserves the
  name "Plex" (restored to `OFL.txt` in 4.5.2), the four Plex faces ship
  as subsets — Modified Versions — and the OFL FAQ says subsetting does not
  normally get to keep a Reserved Font Name (2.6) and that the name "as
  presented to users" includes the mechanism a document uses to specify
  the font (5.3), which is the `@font-face` string. Owner's call, of three
  honest ones: leave it (a licensing bet inside a sealed tree), ship IBM's
  own Latin1 files (+≈45 KB), or rename (0 bytes). Renamed: name IDs
  1/3/4/6/16 in the four woff2 read **NW Sans** / **NW Mono** (copyright,
  version and licence records untouched), and `@font-face`, `--body`,
  `--mono`, the story card's canvas font and `qa/share-card.html` declare
  the same. The file names keep `ibm-plex` — a file name is not a presented
  name, and it is what `_headers`, `sw.js` and the manifest address.
  `qa/subset-fonts.py` does the rename after the subset (`RENAME`), so the
  fonts regenerate the same way; `qa/font-subset.json` re-blessed (−36 B
  net across the four). `OFL.txt` says so under IBM's block. Same rule
  Limelight got, with the answer that costs nothing. Glyph sets and cmaps
  unchanged (223 glyphs, 204 codepoints each).
- **§106 holds it.** The reserved names are read out of `OFL.txt`
  ("Limelight", "Plex"), and no face the manifest marks subset may carry
  one in its name table — read out of the woff2 by the guard itself: the
  directory, one brotli stream, the `name` table at its offset — or in the
  `@font-face` family the page declares for it. An `OFL.txt` that reserves
  nothing is refused too. Four fixtures (negtest580).
- **The eight nits.** RELEASING.md's `/index.html` wire check no longer
  says a 404 breaks offline (the shell is `./`; 404 is informational, 200
  is the platform change), and the freeze note mentions the CI and format
  refusals. `626482b` is the **3.9.6** upload (its `BUILD` says so; the
  4.5.2 entry and NOTES.md said 3.9.5). Fourteen maintainer-local
  qualifiers, not fifteen. The §133 exclusion list is named in full
  (`Content-Type`, `Content-Location`, `Content-Length` — no wildcard, so a
  `Content-Security-Policy` under `/*` would rightly be required). Six
  scans → two on the grid, four → two on the rows. ≈45 KB is the Plex
  saving, not 56 (that was five faces with Anton). The "costs nothing"
  sentence under `applyMarks()` is narrowed: a pre-3.8.0 mark, never
  toggled since, is still clockless in a current tab, and the one loss case
  that leaves is written down as accepted. The stripper's header names its
  real callers (107 and 138). §144's fallback note says "unparsed;
  byte-scanned" instead of inventing an entry count. And `OFL.txt` carries
  IBM's `©`.
- **Smoke's watchdog says why.** A timed-out run printed "1 smoke
  failure(s)" and nothing else; the reason is printed like any other
  failure now. (The full wall on a loaded two-core box tripped it once at
  ~3½ minutes; CI shards are single-tenant and a clean smoke takes ~90 s.)

### Added

- **negtest580 — 4 fixtures**, the two halves of the reserved-name rule,
  the parse, and the floor. 66 suites, 946 fixtures; smoke stays at 361.
  Shard 4 carries it.

## [4.5.2] — 2026-08-24

**The seal, second cut.** No feature. The audit of the 4.5.1 tree confirmed
every 4.5.0 item closed and found that the closing had introduced five
Medium defects of its own — three guards claiming an invariant they did not
hold, one unlisted behaviour change in the cross-tab merge, one release step
that dead-ends — plus fourteen Low items and a handful of numbers in the
4.5.1 entry that did not match the tree. All of it is taken here. Catalogue
untouched; nothing ticked moves.

### Fixed

- **§111 asserted two of its three halves.** The header said applyMarks()
  holds "watched clears skip, the BYID gate, skipped never lands on a
  watched entry"; the section checked the first two. Removing the
  `S.watched[id] ||` from the skipped loop left guards and smoke green. The
  third is asserted on the loop itself now, with a fixture.
- **§43 told you to run a bless that could not do what it said.** The
  stale-ledger branch printed "Fix with: npm run bless" and returned before
  the only line that writes the ledger. A stale `qa/script-bytes.json`
  under `--bless` printed the same failure and left the file alone. Bless
  re-records the ledger in that branch now (a green fixture under
  `--bless` proves it).
- **§96 read the belt's duration in seconds only.** `animation:beltclose
  900ms` parsed to NaN, NaN compared false, and the BELTCLOSE ↔ CSS tie was
  green with a fourfold drift. Both units are read and normalised; an
  unreadable duration is a failure, not a pass. Three fixtures.
- **§133 held "the security set" as a fixed list of five.** A sixth header
  added under `/*` was not required of the Worker (tested with
  `X-Permitted-Cross-Domain-Policies` — green), and the two HEAD responses
  were never compared. Every name under `/*` is required now, minus a
  documented per-response list (`Cache-Control`, `Vary`, `Link`,
  `Content-Type`, `Content-Location`, `Content-Length` — the three by name,
  so a `Content-Security-Policy` under `/*` would rightly be required), on
  all four built responses. Three fixtures.
- **§140's "never on a live tree" was a convention.** `NW_TODAY` accepted
  any `Date.parse`-able string and nothing stopped it in CI, where a pinned
  clock would keep a green badge on an expired `security.txt`. The pin is
  refused when `CI` is set and must be `YYYY-MM-DD`. Two fixtures.
- **§144 byte-scanned the git index.** A version-4 index prefix-compresses
  paths against the previous entry, so `.vscode/…` followed by
  `.wrangler/state/x` stores `wrangler/state/x` and the scan for
  `.wrangler/` misses it. The section parses index versions 2–4 (whole
  paths, extended flags, the varint strip) and falls back to the scan with
  a warning on anything else. The fixture plants a v4 index the scan
  cannot see.
- **§65 never compared a snippet heading under six characters.** `#view`,
  `.bd.e`, `--num` and eight others were exempt. The floor is three for a
  heading shaped like an id, a selector or a custom property; a bare word
  that short stays exempt. Two fixtures.
- **`stripComments()` read `\/\/` inside a regex literal as a line
  comment.** `/^https?:\/\//` ended the line at the escaped slashes and
  everything after it on that line — ten lines in guards.js itself — was
  invisible to the "every section can fail" censuses. None carried a
  `fail(` there today. The stripper recognises a regex literal after an
  opener (`( , = : [ ! & | ? { } ;`, a keyword, a line start) and copies
  it through; a template literal runs to its backtick instead of dropping
  its quote at the first newline. The old and new strippers agree on every
  line of the file but those ten.
- **Smoke's closed-view bound had quietly made room.** 4.5.1 replaced
  `< 150,000` (measured 145,644) with `closedSize * 2 < alwaysOn`, which is
  `< ~311,000` — the closed view could double before it fired. The
  relation stays and an absolute ceiling of 160,000 stands beside it, with
  a smoke fixture that pads every row past it.
- **RELEASING.md's order dead-ended on a catalogue move.** Step 2 said
  "Bless, once" and step 6 said regenerate the share card and bless again;
  §91 goes red inside step 2's bless. The card step is step 2 now, ahead
  of the bless; the two wall-time figures (~15–20 vs ~25 minutes) are one
  figure; "an old Node fails at `npm ci`" is true now — `.npmrc` sets
  `engine-strict=true` — where before npm only warned.
- **The 4.5.1 entry, corrected:** 2.5 KB lighter, not 2; a dozen stale
  snippet headings, not seven; §2 asserts two ledgers disjoint, not three;
  the `engines` line flagged rather than failed; and the unlisted behaviour
  change below. NOTES.md: the 475/476/478 suites belong to 4.0.5/4.0.6/4.0.8,
  not 4.2.x; `--moss` left `:root` in 3.8.4, not 2.7.x; the constant is
  `GRIDWORD`, not `GRIDNAME`; 219.2 KB, not 219.3; `supportsAnchor()` is
  annotated as the 3.6.4 removal it is; a stray `/* ` opener and a
  "seventy releases" that were 134. README: `icon.png` is the install icon,
  not the social card (`share.png` is); four rows the file table lacked
  (`.well-known/security.txt`, `brave-rewards-verification.txt`,
  `qa/script-bytes.json`, `qa/make-favicon.py`) — §45 holds them now.
  `docs/fonts/OFL.txt` carried the licence body twice after Anton's block
  came out; the orphaned second copy is gone, and IBM's line carries its
  upstream Reserved Font Name clause (*"Plex"*), which the shipped copy had
  dropped — and which matters, because the four Plex faces are subsets and
  every note arguing Limelight's keep-whole rule said the other faces
  reserved nothing. They stay subset; the judgement is recorded as open in
  NOTES.md ("Open: the Plex reserved name"), not decided in a patch.
- **One audit claim refuted, on the record:** the sitemap's `llms.txt`
  `lastmod` of 2026-08-15 was said to be one edit old (4.0.1, 2026-08-17).
  `git log -- docs/llms.txt` shows the file unchanged since the 3.9.6
  upload on 2026-08-15 (`626482b`, `BUILD "3.9.6"`); 4.0.1's entry says llms.txt *agreed* with a
  spelling, not that it changed. The date stands.

### Changed

- **The cross-tab merge's unclocked fallback applies the BYID gate — said
  out loud.** 4.5.1 routed the storage event's legacy path through
  `applyMarks()`, whose gate drops ids the catalogue does not carry; in
  4.5.0 that path adopted them. It is the right tightening for a payload
  with no clocks, and it is written down now rather than filed under a
  refactor. The clocked loop is deliberately NOT gated: it mirrors
  `restore()`, which keeps marks for unknown ids so that two tabs on
  different catalogue builds cannot lose one by taking turns writing
  storage. NOTES.md, "Why the clocked merge carries ids it cannot render".
- **`./index.html` left the service worker's SHELL.** The assets plane
  redirects it to `./`, so `cache.add` followed a 308 and stored a
  redirected 220 KB duplicate that a navigation can never use — one
  redirect and one wasted entry per install. `./` is the shell; the
  fallback still consults `./index.html` last, for a platform where that
  path answers 200. §13 lists it as deliberately not cached and refuses a
  shell entry that is also an exclusion; §132 asserts the install caches
  `./`; the browser check waits on `./`.
- **Script, one bless:** the unused `i` on the eras/decades `forEach`s;
  `gSub()`/`gBarFill()` take the counts a caller already has (the universe
  grid and the progress rows computed `gDone`/`gSkip` and then had the
  helpers compute them again — six scans per group on the grid and four on
  the rows, two now); `gPct()`
  folded into `gBarFill()`.
- **guards.js comments:** the stripper's caller list reads 13, 107 and 138
  (66 no longer calls it); the bless re-verify block has its lead-in back;
  two comments that began mid-sentence after the 4.5.1 lead-in removal
  begin at their beginning; the fourteen citations of maintainer-local
  evidence files say so, including the four inside `fail()` strings that
  print to whoever reads a red run.
- **`qa/smoke.js`** spells its three NUL separators as `"\u0000"`, so a
  file `.gitattributes` forces to text is no longer one git detects as
  binary.

### Added

- **negtest570 — 17 fixtures** (14 guards, 2 green, 1 smoke): §111's third
  half, §43's bless under `--bless`, §96 in both units, §133's sixth header
  and both HEAD responses, §65's short anchors, §144's version-4 index,
  §13's exclusion, the four §104 cache blocks 4.5.1 added without one, and
  the closed-view ceiling. negtest560 gains §140's format and CI refusals
  beside the clock fixtures it already had (which now run with `CI`
  unset). 65 suites, 942 fixtures; smoke 361. Shard 3 carries the new
  suite.

## [4.5.1] — 2026-08-24

**The seal.** No feature. The pre-seal audit of the 4.5.0 tree — dead code,
stale comments, tests that had stopped testing, and three real defects in
the guard suite's own machinery — shipped whole, so that what the frozen
tree says about itself is true. Catalogue untouched, nothing ticked moves.
`index.html` is 2.5 KB lighter.

### Fixed

- **Guards: a failure inside section 24 printed as §23.** `sectOfLine()`
  matched the section header at column 0 and 24's header is indented (it is
  nested inside 23); a fixture naming `sect=24` could never match. Five
  places counted the headers with three regexes; one cached `sections()`
  census now, the indented header included.
- **Guards: the comment stripper ate code.** `stripBlockComments` was a
  regex, and a slash-star inside a string literal — the `_headers` path
  patterns §104 checks, the `*/*` Accept header §133 sends — opened a
  comment that ran to the next real close. §104 read as 133 lines instead
  of 322 and lost three of its assertions to the "every section can fail"
  count, quietly, because one survived. It is a string-aware
  `stripComments()` now, shared with §13's `wrangler.jsonc` parse and §136.
- **Guards: eight fixtures had never been harvested.** §138's coverage map
  read only double-quoted expects; the eight with single-quoted ones were
  invisible to the map and to the sect ratchet. The harvester reads
  arguments the way bash does; `NO_SECT_PINNED` moves 763 → 770 (eight
  found, one retrofitted a sect — negtest166's empty-section fixture is
  §107's now, since §66 no longer duplicates that check).
- **Guards: `qa/script-bytes.json` is read outside bless.** The ledger was
  written by bless and read by nothing else, so a stale one was invisible
  to `npm test` and the next bless would have measured its size jump
  against the wrong baseline. §43 holds it against the page, and a failed
  write warns instead of being swallowed.
- **Smoke: two checks that could only fail by coincidence.** "The intro
  counts what is in view" looked for the literal "58" (the catalogue size
  when written); it counts from the data. The closed-view bound was a
  remembered 150,000 with 3% headroom; it is a relation to the measured
  per-row delta.
- **The Worker's two responses carried no security headers.** `_headers`
  reaches asset responses only, so the negotiated markdown root and
  `/.well-known/api-catalog` were the only URLs on the site without
  Referrer-Policy, X-Frame-Options, Permissions-Policy, COOP and CORP, and
  nothing recorded it as a decision. `worker.js` restates the set and the
  root's Link lines from constants; §133 holds them equal to the file.
- **The service worker's navigate fallback tried the redirected name
  first.** The assets plane redirects `/index.html` to `/`, so the copy
  cached under `./index.html` is a redirected response, which a browser
  refuses for a navigation — an offline navigation to a non-root path under
  scope would have failed with the shell in the cache under the other name.
  `./` first; §132 drives the case. RELEASING.md gains the one `curl` that
  confirms the redirect on the wire.
- **Docs and comments that stated things the tree no longer did.** The
  README's licence paragraph said the only links in the app are the
  where-to-watch searches (the Progress footer has carried "read the source"
  since 2.7.4), listed a retired `m` badge, and had no row for `worker.js`;
  LICENSE and OFL.txt still credited Anton (retired 4.3.0); NOTES.md said
  `offCanonical()` was "still in the tree on purpose" (removed 3.3.1) and
  read three other retired states in the present tense; a dozen of its
  code-snippet headings anchored lines that no longer exist, and its palette
  notes were shifted one token down; `qa.yml` argued its Ubuntu pin against
  Playwright 1.56 while the lockfile was at 1.62; `worker.js` cited an
  in-project triage that is maintainer-local; nine guards.js comments
  carried wrong numbers or sections; the sitemap's `llms.txt` date was two
  edits old; the 4.5.0 entry above said 219.3 KB where the guard prints
  219.2. All corrected. §65 now checks NOTES.md's snippet headings against
  the file, which is the gap that let them rot.
- **`qa/make-favicon.py` used `getdata()`**, which Pillow deprecated and
  later removed; it reads raw bytes now, with the same chroma key
  `make-share-card.mjs` uses. Output byte-identical. The card generator
  rejects on a failed icon load instead of hanging `page.evaluate`.

### Changed

- **One merge.** The three hand-copied "apply foreign marks" loops — the
  cross-tab storage event, the JSON restore branch, `applyImport()` — are
  one `applyMarks(res, stamp, gate)`. §111 holds the invariant in the
  helper (watched clears skip, the BYID gate, skipped never lands on a
  watched entry) and refuses a site that grows its own copy back. One
  behaviour change rides in it (recorded in 4.5.2, missed here): the
  storage event's unclocked fallback — the path for a payload written by a
  pre-3.8.0 build, with no clocks on it — now goes through the helper's
  BYID gate, so an id the catalogue does not carry is no longer adopted
  from that shape. The clocked loop above it still carries such ids, on
  purpose; NOTES.md, "Why the clocked merge carries ids it cannot render".
- **One focus restore.** `focusSnap()`, `focusRestore()`, `focusBack()` and
  `attrEsc()` replace the snapshot/restore `tickUpdate()` and `render()`
  each carried, the selector escape written three times and the
  `preventScroll` try/catch written four. §123 pins the helpers and refuses
  a site that calls `.focus()` itself. The restore-box refocus gains
  `preventScroll` in passing.
- **Named constants.** `RINGC` (the ring's circumference, tied by §80 to the
  markup and 2πr) and `BELTCLOSE` (the close timer, tied by §96 to the
  `beltclose` animation's duration). `GRIDWORD` replaces three copies of the
  eras/decades/universes ternary; `gDone()`/`gSkip()`/`gSub()`/`gBarFill()`
  replace five re-derivations and two inlined progress bars.
- **Dead code out of the script**, one bless: the unread `k:` on life
  groups, the `String(i+1)` tags renumbered unconditionally two lines
  later, the unreachable `|| [0,"1"]` in `importCode`, the non-Promise
  branch of `persist()` (both store adapters always return one), the
  never-empty `.hbadges` gate, six `typeof requestAnimationFrame`
  fallbacks (the script hard-requires Promise, `closest`, Path2D and Blob;
  no browser has those without rAF — the `requestIdleCallback` fallback
  stays), a ternary-as-statement, and the second shape of the `S.clk`
  wipe. In the CSS: `.pick`/`.pick span` (every pick is `.pick.big`, which
  re-declared all of it), `.buildline` restating `.note.foot`, two
  `margin-top:0`s overridden on the next rule. In the markup: the header
  HTML comment and the two `twitter:` metas X falls back from.
- **The histories left the served and config files.** `sw.js`,
  `worker.js`, `wrangler.jsonc`, `_headers`, `qa.yml`, `smoke.js`,
  `browser-check.mjs`, `run-all.sh` and `_lib.sh` keep each decision's
  "why"; the dates, release numbers, review-ticket names and evidence files
  went to NOTES.md ("Where the served and config files' histories went").
  In `guards.js` the fourteen longest memoirs were condensed to their
  invariant paragraph (the full text is in NOTES.md) and sixteen
  review-ticket lead-ins came off. `_headers` is a header file again, not a
  changelog. Guard duplicates retired: §66's empty-section check (§107
  owns it), §114's `offCanonical` check (§77), §110's and §118's
  404.html-exists checks (§101).
- **CI.** The four negative shards are repacked by fixture weight (shard 4
  had carried 22 smoke-fixture-weight against 11–14; negtest300 alone is
  13). The two copy-pasted browser jobs are one job with an engine matrix,
  and `qa/.shots/` — written on every run, read by nothing — is uploaded on
  failure. The Ubuntu pin is re-argued against Playwright 1.62.
- **`_headers`:** Cache-Control blocks for `icon.png`, `icon-192.png`,
  `icon-maskable-512.png`, `share.png` and `manifest.json` — a day each,
  the file's own reasoning, which had applied to them all along. §104 pins
  the five.
- **`vp.html`** gains the meta CSP `404.html` already had (hash-pinned
  inline script). `wrangler.jsonc` drops `nodejs_compat` (the Worker uses
  no Node API). `.gitignore` drops entries nothing produces;
  `.wrangler/.gitkeep` is deleted (nothing reads the directory; `wrangler
  dev` recreates it) and §144 refuses anything under `.wrangler/`.
- **The wrangler config comment** no longer carries the 8 August
  postmortem — it carries the decision, and points at NOTES.md.

### Added

- **`qa/share-card.json`** — what `share.png` bakes in (the three counts and
  the file's hash), written by the generator, held against the data by §91
  the way `font-subset.json` holds the fonts. A catalogue edit now fails
  the build until the card is regenerated; `npm run bless` re-records the
  hash after the manual quantize. RELEASING.md step 2 (step 6 until 4.5.2 moved it ahead of the bless).
- **`qa/requirements-tooling.txt`** (Pillow, fonttools, brotli) —
  the Python side of the tooling, declared. **`.gitattributes`** — LF
  everywhere, binaries named; the guards hash and split the tree
  byte-for-byte and a CRLF checkout goes red across many sections at once.
  **`package.json` `engines`** matching jsdom's requirement, so an old Node
  is flagged at `npm ci` rather than mid-suite (flagged, not refused — npm
  only warns without `engine-strict`; 4.5.2 adds the `.npmrc` that makes it
  refuse).
- **`NW_TODAY=YYYY-MM-DD`** pins §140's clock for an archival run of the
  sealed tree (it goes red thirty days before `security.txt`'s Expires with
  no edit anywhere). It never silences the check on a live tree. RELEASING.md
  gains a "Freeze notes" section.
- **§21 pins the storage key** (`batwatch-v3`, unchanged since the first
  commit and never to change); NOTES.md says why. **§2 asserts the retired and
  renamed id ledgers are disjoint** (the frozen ledger is the catalogue's
  census and is held to it separately).
- **negtest560 — 27 fixtures**, one per claim above, plus the suite's own
  floor: a §24 failure printing as §24, a slash-star in a string leaving the
  code after it alone (a green case), and a single-quoted expect being
  harvested. 64 suites, 923 fixtures; smoke stays at 360.
- **Kept on the record:** the 1.1.0 downgrade shim stays (§27 and a smoke
  case pin it); the swallowed `routeHash()` on `hashchange` stays; the
  guard-pinned CSS duplicates stay. NOTES.md, "The seal".

## [4.5.0] — 2026-08-24

**The city.** Release 2 of the two-release plan the deco pass opened on
20 August: the Progress skyline stops being a bar chart with a good name
and becomes a skyline, and the story card's chart becomes the same city.
Rethought on the day it shipped so it could ship in one evening — the
20 August plan's eight clip-path roof forms became stacked blocks and
masts, the beacon was cut on the owner's word, and the card's bottom block
did not move. Catalogue untouched, nothing ticked moves.

### Added

- **The shaft is the chart, the crown is above it.** Everything measured
  lives in a uniform 96px shaft — width is group size, solid `--signal`
  rising from the ground is watched, `--steel` stacked on it is skipped,
  exactly the encoding 3.8.2 shipped. Above the shaft sits a **crown** that
  encodes nothing: it is form, and it lights only once the shaft under it is
  already full (`--signal`; `--steel` when the rest was skipped; `--line2`
  otherwise), so ornament can never make a building look further along than
  it is. Seven forms — flat, block, setback, ziggurat ×2 and ×3, spire, twin
  — as **stacked blocks and masts**, never `clip-path`: ~44 polygons on a
  view that re-renders on every tick was a cost the plan measured and the
  cut declined. Every roof steps in from its shaft (an 8% shoulder, capped
  in px so a wide era still wears a cap rather than a slab with a lip), so
  the roofline always steps and never slices.
- **Deterministic roofs.** Seeded from the group's frozen code through
  `idHash` — PATH's `n` for universes, the era and decade keys otherwise —
  and gated on title count, not pixels: a one-title universe may wear flat
  or block; seven and up may wear anything. Same seed, same roof, on a phone,
  on a desktop and on the card. A universe is a place, not a render.
- **The city on the card.** `drawShareCard()` draws the same crowns from the
  same spec (one `ROOFS` table, two renderers — a DOM one and a canvas one).
  Radius 5 → 0: the card joins the square family. Shaft 300 → 260px so the
  tallest crown clears the bat by 51px, measured. The rule, strapline and
  domain lines stay exactly where 2.7.1 put them; guard 98's pins are
  untouched.
- **Guard section 150** pins the rule: the roof spec and its seed, the frozen
  codes on every Progress group and on the card, both renderers drawing from
  `ROOFS`, `SKYSHAFT` agreeing with the `--sh` token, `crownState()` lighting
  only a full shaft, crown colour by class and never inline, no `clip-path`
  in the city, the solid fill, the 1px street, the card's square buildings,
  and the numerals row without its tiles. `negtest550` — 17 fixtures, three
  through smoke.

### Changed

- **The chart is a card.** Same frame as every other card on Progress
  (the plan's full-bleed was cut on sight — "too wide"); inside it the city
  runs frame to frame, 150px tall on a phone: 96px shaft, up to 40% of that
  in crown. The sub-line gains the topped-out count, where it is a fact and
  not a control.
- **The numerals row.** Watched · To go · Skipped lose their tiles: one
  card, three cells on hard 1px rules, 38px numerals over 8.5px labels. The
  three tier buttons underneath are section 40's, unchanged.
- **The one progress fill that stays solid.** The deco pass ribbed every
  fill; the city does not, and the reason is the ribbing rule itself: ribs
  work because they cross the axis a bar travels along. The city fills
  upward, so vertical ribs would run parallel to the travel, encode nothing,
  and cost every tower its footprint. On the record so nobody "fixes" it.
- **No beacon.** The plan lit the group holding your next entry; the owner
  cut it during the build. The here-group on The Path already says where
  you stand.
- **Smoke +5 → 360**: a building is a shaft and a crown; the three crown
  states driven on one group so none passes vacuously; the same universe
  wears the same roof across renders. The CSS sweep stages an all-skipped
  city so the steel crown rule is seen to match.
- **Weight: 219.2 KB raw of the 220 KB budget.** The city cost ~3 KB. The
  next feature raises the ceiling, and that is the owner's number to give.

## [4.4.4] — 2026-08-20

**CI's shard 2 failed on the 4.4.3 upload — two negative fixtures gone stale,
and both were maintenance this changelog's own releases owed.** The app is
untouched; this release is the harness keeping its word.

### Fixed

- **negtest360's listener-count twin.** 4.4.2 added the third scroll listener
  and re-anchored the count fixture in negtest470 — but negtest360 carries a
  twin ("a third scroll listener arrives here too") that still expected
  "reviewed with exactly 2". Re-anchored to 3.
- **negtest460's restore fixture no longer brought the bug back whole.**
  4.4.2's settle added a second `scrollPut(keep)` inside the rAF; the fixture
  removed only the first call, the guard rightly still saw a restore, and the
  expected failure never fired. The fixture now strips all three restore
  calls — and the guard fails exactly as §122 promises.
- Both misses share one cause worth writing down: the 4.4.3 verification ran
  the negative wall selectively ("the suites whose anchors sit near the
  change") and the full wall only in CI. Fixture twins do not live near the
  change. The full 62-suite wall ran locally green before this cut — all
  four CI shards, 879 fixtures — and selective runs are for iteration, not
  for release verification. That rule is now in RELEASING.md where the next
  release will read it.

## [4.4.3] — 2026-08-20

**The Path's closing diamond was bigger than the other three.** The soak
caught it a release after a full round made the footers identical — because
that round unified the clearance and left the glyph's face to inheritance.

### Fixed

- **One glyph, one face.** The footer ◆ is CSS content, and content inherits
  the element's font: the legend sits in the body face while the colophon
  and notes sit in Mono, so The Path's diamond drew from a different
  fallback at a different width — no subset carries U+25C6, which makes the
  face pure fallback roulette, and iOS spreads the fallbacks hardest. The
  shared ::before now pins `font-family` to the body face — the one the
  hero's own diamonds already render from — so all four footers close on
  the same mark at the same size. Three contexts and no pinned face is the
  4.4.1 margins bug wearing a font.

- **And the memory's one blind spot, closed by its own ruler.** The first
  run of 4.4.2's exact swipe check on this tree failed honestly: "kept
  2526, back at 2600." An engine can adjust a panel's position without
  firing a scroll event (content-visibility settling does exactly that),
  so the place-recorder never heard the adjustment and the memory restored
  a stale number. Every departure now records the leaving tab's DOM truth
  at the moment of leaving — the swipe's first motion off the parked
  position, and goTab's first line — while the panel is still current and
  nothing has parked, clamped, or refilled it. §149 pins both captures;
  fixture 5 reopens the blind spot and proves the guard sees it.

### Added

- **The ruler, again beside its sibling.** Browser-check gains "the four
  closing diamonds share one face at one size" — the ::before's computed
  font, read off the rendered page on every tab, both engines — and §148's
  footer clause holds the pin in the source. No new fixtures owed: the
  existing reshaped-rule fixture proves the grown regex still fails.
  Counts: 879 fixtures (823 guards).

## [4.4.2] — 2026-08-20

**The phone lost The Path's place on a swipe, and every desktop check was
green.** Swipe away, swipe back, and the list is somewhere else — iOS only.

### Fixed

- **The reader's place has one memory.** The DOM was the only record of
  where you were, and the DOM cannot be trusted with it: a panel parked
  off-screen has its `content-visibility` groups collapsed to the 64px
  estimate on engines that do not remember rendered sizes (WebKit — Chromium
  remembers, which is why desktop never showed it), the scroll range
  shrinks, the engine clamps `scrollTop`, and the background refill then
  faithfully restored the clamped number. The place now lives in JS
  (`nwKeep`), written only where truth is available — a panel's own scroll
  while it is the current tab on a parked deck, and every deliberate
  `scrollPut` — and read back everywhere the DOM might lie: the background
  refill and the swipe arrival, which restores under `settling` and re-puts
  after a laid-out frame for engines that clamp the first write.

### Added

- **The ruler that let it through is reforged.** The swipe check tolerated
  150px of drift and WebKit had been drifting 116 in plain sight of CI
  ("kept 2600, back at 2484" — passing). It now demands the place back
  exactly, in both engines. Guard §149 pins the memory's four claims
  (fixtures in negtest540 prove each fails), §120/§128 carry the argued
  third scroll listener and reads. Counts: 149 sections, 62 suites,
  878 fixtures (822 guards).

## [4.4.1] — 2026-08-20

**The soak found the diamond floating.** One evening with 4.4.0 live and the
owner caught the footer divider sitting at three different heights — the
4.3.1 belt bug's mirror image, at the other end of the page.

### Fixed

- **The four tabs end level.** The closing diamond stood 30px under Home's
  theme row, 16px under Next up's and Progress's notes, and 14px over the
  legend — `.homefoot`, `.note.foot` and `.legend` each kept a private top
  margin from their pre-diamond lives, three sources for what 4.3.1 already
  established is a one-source number. The clearance now lives once, on the
  shared footer rule (`margin-top:30px` — Home's was the authored one), the
  three rules give up their own, and the stacked second note keeps its old
  16px as the named exception: it sits under a footer, not under a tab.

### Added

- **Guard §148 pins the source; browser-check measures the result.** A
  footer rule growing back a nonzero top margin fails the guard
  (fixture 23 proves it), and the browser drive gains "the four tabs end
  level" beside 4.3.1's "the four tabs start level" — the closing gap is
  read off the rendered page on every tab, in both engines. Counts:
  874 fixtures (818 guards); browser-check +1.

## [4.4.0] — 2026-08-20

**The deco pass.** The direction the owner locked over three mock rounds on
20 August: the 45° cut stops being the hero's private ornament and becomes
rank — "where you stand tonight" is the only thing that earns it — and
everything that doesn't earn it stands square. One visible release for the
whole language: the app changes look once. The hero is untouched. Catalogue
untouched, nothing ticked moves.

### Added

- **The cut is rank.** Three new cut sites, each in the construction its
  element needs rather than the one 4.3.0 used. The CTA that begins the
  night (`.heroacts .go`) wears an 8px two-corner cut — solid fill, so a
  straight `clip-path` is the whole cut. The lead chooser card wears 12px on
  its top corners only, because the deck overlaps its bottom edge and a cut
  under an overlap reads as a rendering bug. And **the group that holds the
  film `upNext()` names** wears 12px corner overlays — the "here-group,"
  computed once per render and passed into `groupBlock()`, so the mark
  follows the film you are actually up to and lands on exactly one group
  (Case closed marks none). The overlays are two 13px gradients painting the
  page ink back over the corners with the 1px `--line` diagonal in the same
  paint — chosen over `clip-path` because the group has a sticky header and
  `content-visibility`, and a clip would fight both. All three surgical
  paths (tick, row, group toggle) carry or move the mark, held byte-identical
  to a full render by the existing smoke gate.
- **One ribbing formula.** Every progress fill — group bars, season bars,
  universe bars, tier bars — is the same
  `repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 5px)`
  on a `--card2` track; each fill states only its colour (inline styles carry
  `color:`, never `background:`). Vertical ribbing, not diagonal — diagonal
  gold on black reads as hazard tape, which the mock round established the
  expensive way.
- **The stepped underline.** The Path's title carries the deco signature: a
  34×3px solid signal bar over a full-width `--line2` hairline, drawn in
  `::after` so the title and its architecture cannot be separated.
- **Guard section 148** pins all of it — the square-family sweep (every
  `border-radius` in the sheet is `0` or `inherit`, with `:focus-visible`'s
  4px as the one named exception), the three cut constructions, the
  here-group mechanics in CSS and in both render paths, the ribbing count
  (exactly four), the chevron sites and their states, the underline, and the
  tick arithmetic. New suite `qa/negative/negtest530.sh` (20 fixtures, all
  sect-anchored; two drive the render path through smoke). Browser-check
  gains the computed half: the CTA's clip resolves to a polygon, exactly one
  here-group with both overlay gradients painted, the tick's rotation read
  back out of layout (30px × .78 × √2 ≈ 33px box), chips computing square,
  and the here-group's sticky header still sticking — the interaction the
  overlay construction was chosen for.
- **The WebKit CI job, at last.** Parked since the 4.2.x audits with a named
  trigger; the deco pass fires it by multiplying clip-path sites. Same
  browser-check file, same server, `NW_ENGINE=webkit`. Its rider lands in
  the same commit: the 700ms jump sleep is now a settle assertion — the
  scroll position is read across frames until it stops moving, capped at 2s.
  The job's first run (on this release's first upload) returned its verdict:
  every deco assert green on WebKit, and two reds from the harness's own
  offline reload — `page.reload` under `setOffline` dies with a WebKit
  driver-internal error after registration, control and THIS build's cached
  shell had all been asserted. The offline reload is now scoped to Chromium,
  with an explicit skip line on WebKit naming the driver limit (no silent
  caps: a skip that says so beats a red that cries wolf).

### Changed

- **The square family.** Forty-odd `border-radius` declarations go to 0:
  chips and the all-continuities pill (both were full 100px pills), search,
  the chooser cards, groups, the belt and its peek, mode/scope switches,
  action pills, the watch link, hero action row, stat cards, universe cards,
  backup chrome, tiers, the toast, the intro card, badges, the group-number
  plaque. The plaque gains a 1px solid-gold baseline — the one vertical
  accent at that scale.
- **Every tab closes on the diamond.** The four footers — Home's colophon,
  Next up's availability notes, Progress's build lines, and the badge legend
  that closes The Path — trade their plain top border for the diamond rule:
  a gold ◆ on a hairline that fades in from either side, one construction
  shared by all four (and only the first of a stacked pair wears it). The
  hero's own rule is untouched; this is the same ornament at footer rank,
  the owner's call extending it beyond the hero.
- **The chevron family.** The `\u25B6` triangle retires everywhere: group
  carets, the progress fold and the belt buckle point with the `\u203A\u203A`
  pair, and the all-continuities control's `::after` does the same — on the
  identical rotation states (right = shut, down = open). Section 116's
  system-marks list drops the triangle and the chevron entry names its new
  duties; the pair ships escaped, dodging §106's literal scan by the same
  decision as the diamond.
- **The diamond tick.** The watched circle becomes a rotated square — the ◆
  form — at `rotate(45deg) scale(.78)`, check counter-rotated, done/skip
  states untouched, `aria-pressed` untouched. The tap halo grows to −14px so
  the scale buys itself back: 58px × .78 = 45.2px across the rotated
  square's centre, over the 44px floor. The Activity tick inherits the
  rotation and stays under the Path tick (the §76 relation).
- **Guards that had to learn the new truth, updated in place and
  negative-tested rather than deleted** (the §44 lesson): §119 reads the
  hero-pill/Skip pairing through a unit-tolerant reader (a square corner is
  `border-radius:0`, no unit — what it asserts is unchanged: whatever edge
  one declares, both declare); §103 pins `groupBlock(g, q, nid)`'s grown
  signature; §146's prose records that the cut stopped being hero-only while
  its assertions keep holding the hero's own construction exactly as 4.3.0
  built it. negtest176, negtest200, negtest310 and negtest360 re-anchored to
  the moved rule text in the same commit.
- Counts: 61 suites, 873 fixtures — 817 guards / 56 smoke — smoke 355
  checks (five new: the here mark lands on exactly one group and the right
  one, Case closed marks none, every rendered caret is the chevron pair,
  tier fills carry colour tokens only), guard sections 148, sect-less pin
  unchanged at 763.

## [4.3.1] — 2026-08-19

**The tabs start level.** The owner's review of 4.3.0 found only Progress
standing at the correct top margin — and the reason is this project's
oldest bug class wearing a new coat: an offset with two sources. Progress's
first block carried a private inline `style="margin-top:18px"`, so it stood
18px clear of the parked belt while Home, Next up and The path stood at
10px, with The path's bare Limelight title crowding the peek worst. Plus
the type-ladder rungs the Big Shoulders swap left un-tuned. No features,
no catalogue change, nothing ticked moves.

### Fixed

- **One first-content offset, from one source.** The belt's bottom margin
  is now 18px — the single source of clearance below the parked peek —
  and the inline patch on Progress's chart row is struck. Margin collapse
  means Progress does not move; the other three tabs rise to meet it.
- **Every inline margin leaves the rendered markup.** Five style-attribute
  margins (the pathkick, the picknote, the grid heading, the scope note,
  the fold headings) moved into classed rules; data-driven inline widths
  and colours stay, since those are values, not offsets. **Guard 128 now
  pins both**: the 18px source, and a sweep that refuses any
  `style="…margin…"` in the page — with the pies patch named in the
  comment as the drift it exists to stop. Smoke drives the same rule in
  the rendered DOM; the browser check gains "the four tabs start level,"
  the geometry assert that would have caught this the day the patch
  landed.

### Changed

- **The Path's group titles outrank their rows again.** `.gtitle`
  (Limelight) 17px → `clamp(17px, 5.5vw, 20px)`: the 4.3.0 swap put the
  rows under it at 19.5px Big Shoulders 700, inverting the hierarchy in
  every open group. The clamp rather than a flat 20 because the 320px
  check argued: the longest continuity names ("Standalone Justice League
  Films", "The Burton / Schumacher Films") take a third line at 20px on
  the narrowest phones — and at 19px too, so the honest floor is today's
  17. Every other deco landmark (the hero, the path title, the intro)
  already sizes by viewport; the group title was the odd one out, fixed
  where its siblings flex. At 390px and up the hierarchy stands corrected;
  at 320 the shipped relation holds rather than buying rank with a third
  line.
- **One row-title ladder.** `.uname` 16 → 16.5px, joining `.at`/`.qt`/`.sn`
  on the same rung; the display ladder is 19.5 / 16.5 with the deco
  landmarks above it.
- **The shadowed `.pick b` type block is deleted.** Nothing renders a bare
  `.pick` — only `.pick.big`, whose own `b` rule overrides every
  declaration the base block made. It was Anton's last ghost: a face
  assignment that styled nothing, waiting for the next reader to trust it.
- Section 99's seat pins updated with the offsets' move (the seats are the
  pin; the margins were incidental); negtest177 and negtest200 re-anchored
  in the same commit. New suite `qa/negative/negtest520.sh` (4 fixtures:
  each of the margin pair shrinks back, the patch returns at the source,
  the patch returns in the rendered DOM). Counts: 60 suites, 851 fixtures —
  797 guards / 54 smoke — smoke 350 checks, guard sections still 147.

## [4.3.0] — 2026-08-19

**The deco release.** The feature the audit cycle kept clearing the runway
for: three changes from the mock round, all owner-picked. The row titles
move to the face that was already in the building, Darker stops being a
dimmer and becomes a dark, and the hero card gets the one deco ornament
that survived the panel round — 45° cuts and a gold diamond, with the
double hairline and the sunburst both ruled out on the record. The
catalogue is unchanged; nothing anyone has ticked moves.

### Changed

- **The display face is Big Shoulders Display.** Anton had been the row-title
  face (`.pick b`, `.ftitle`, activity and queue titles, universe names)
  since 1.0.0; Big Shoulders 700 was already loaded for the scorecard
  numbers, and it is the more deco of the two — tall, geometric, condensed —
  where Anton reads sports-poster. Big Shoulders sets narrower and lighter,
  so every consumer takes ~10% more size (`.ftitle` 17.5 → 19.5px) and
  tracking opens `.025em` → `.05em`. `--disp` and `--num` now name one face.
- **Darker is a dark, not a dimmer** (recipe C from the mock round). The
  theme used to drop the ink and keep the room; lowering text luminance at
  the same hue is what a brightness slider does. Now the surfaces drop
  instead — `--sunk` `#05070C` → `#04060C`, `--card` `#0B101B` → `#0A0E18` —
  and the hairlines come up (`--line` `#1B2233` → `#20283C`) so structure
  carries the depth on what is now effectively pure black. The dimmed bone
  `#AEB6C8` stays, owner's call: bone measures 10.32:1 on ink, 9.96 on sunk,
  9.48 on card, 8.73 on card2 — every pair AAA, every one at or above where
  it stood. Default theme untouched.
- **The hero wears the cut.** Corners are chamfered at 45° — on the hero
  only; list cards, buttons and the watch pill keep their radius. A straight
  `clip-path` would eat the old border at the corners, so the card is built
  as a wrapper-clip: `.hero` itself is the frame (background `--line2`, the
  line the frame was always drawn in — `#33405C` default, a touch lighter
  than Darker's new `#20283C` so the cuts stay legible on black) clipped to
  the cut polygon, with `::before` carrying the gradient inset 1px behind
  the content, `isolation:isolate` holding it under the text. The meta
  line's plain `·` becomes a small gold `◆` (`.dsep`), and a diamond rule —
  one `◆` on a gradient gold hairline — sits between the badges and the
  blurb, on the patrol hero and the Case closed card alike. Both are
  `aria-hidden`: ornament, not words. The diamond renders from the system
  font by decision, named in section 116's SYSTEM_MARKS beside the star.

### Removed

- **Anton.** Its woff2 (8.2 KB), its preload and its `@font-face` all leave
  the page — one request fewer against the budget — and it leaves the
  `--num` and share-card fallback stacks, `qa/font-subset.json` and the
  README's file table with it. `docs/share.png` is untouched: Big Shoulders
  has rendered the card's numbers since its `@font-face` landed, so Anton
  was a fallback that never fired there. **Operator note: apply the zip,
  then delete `docs/fonts/anton-latin-400-normal.woff2` — guard 106's
  manifest equality is red while the orphan ships, which is the guard
  working.** Guard 42 gains the retirement clause: any Anton reference
  returning to the page fails the build.

### Added — guards

- **Section 146: the hero wears the cut.** The polygon and the absent
  radius, the `--line2` frame, the 1px `::before` hairline, the isolation,
  the `dsep` separator and the diamond rule on both heroes — each with its
  own failure.
- **Section 147: the surfaces keep their order.** No literal is pinned —
  the next honest retune should not go red for moving a hex — but
  `ink < sunk < card < card2` must hold per theme, measured with section
  20's own palettes, because pressed states lighten and the hero gradient
  falls from `card2` to `card`.
- Smoke drives the ornament in the rendered DOM (4 new checks: the rule on
  the patrol hero, the diamond-not-dot meta line, `aria-hidden` on both,
  the rule on Case closed) — 349 checks.
- New suite `qa/negative/negtest510.sh` (10 fixtures: the four halves of
  the cut construction, the three ornament strips, the ladder reorder,
  Anton's return, and the ornament driven through smoke). Counts: 59
  suites, 847 fixtures — 794 guards / 53 smoke — guard sections 147.

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
