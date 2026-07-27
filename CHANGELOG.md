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
