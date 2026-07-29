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
MAJOR is reserved for a breaking change to saved progress — which should never
happen, because every `i:` slug is frozen (see the README).

## [Unreleased]

Nothing yet.

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
