# Changelog

All notable changes to Night Watcher are recorded here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**The version here, `BUILD` in `docs/index.html` and `VERSION` in `docs/sw.js`
must all be the same string.** `qa/guards.js` fails the build if they drift, and
also fails if the newest version in this file has no `## [x.y.z]` section. That
is the whole point of this file: a shipped change that nobody wrote down is a
change that gets undone by the next person who touches the line.

Adding catalogue entries is a MINOR bump. Fixes and copy changes are PATCH.
MAJOR marks a change to the app's shape — 2.0.0 is the Belt. A breaking change
to saved progress would also be MAJOR, and should never happen, because every
`i:` slug is frozen (see the README).

## [Unreleased]

Nothing yet.

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
  (`releases/audit-triage-2.1.0.md`): declined items recorded so they are
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
  independence. Design record: `releases/design-progress-card.md` in
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
