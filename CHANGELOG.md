# Changelog

All notable changes to Night Watcher are recorded here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**The version here, `BUILD` in `docs/index.html` and `VERSION` in `docs/sw.js`
must all be the same string.** `qa/guards.js` fails the build if they drift, and
also fails if the version at the top of this file has no `## [x.y.z]` section.
That is the whole point of this file: a shipped change that nobody wrote down is
a change that gets undone by the next person who touches the line.

Adding catalogue entries is a `MINOR` bump. Fixes and copy changes are `PATCH`.
`MAJOR` is reserved for a breaking change to saved progress — which should never
happen, because every `i:` slug is frozen (see the README).

## [Unreleased]

Nothing yet.

## [1.0.0] — 2026-07-27

First tagged release. The catalogue and all saved progress are unchanged: every
`i:` slug is byte-identical to the previous build, so existing backup codes and
localStorage entries restore exactly as before.

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

### Changed

- **Path tab renders 77% faster and emits 68% less HTML** (252 ms → 57 ms,
  285 KB → 91 KB on the full catalogue, measured headless). Detail panels — a
  description, five star buttons and three streaming links per entry — were
  built for all 151 entries on every render and then hidden with
  `display:none`. They are now built only for the row that is actually open.
- `buildGroups()` and `pool()` are memoised on `mode|scope`, the only two
  things they depend on. A single Home render called `buildGroups()` seven
  times and `pool()` six, running `visible()` 1,208 times to produce the same
  answer repeatedly. Home is now 46% faster, Next up 77%, Progress 45%.
- **index.html is 9% smaller** (136 KB → 124 KB). The 180×180 bat PNG was
  inlined twice as byte-identical base64 — 14,552 characters, once for
  `rel=icon` and once for `apple-touch-icon`. Both now reference the real
  `icon-192.png` that already ships beside it; `sw.js` caches it so offline
  installs are unaffected, and the paths are relative so a `file://` open still
  resolves them.
- Pinch-zoom is no longer blocked. `maximum-scale=1` in the viewport meta failed
  WCAG 1.4.4 on a screen this dense in 9–10px monospace, and only ever
  penalised Android — Safari stopped honouring the cap in iOS 10.
- The header progress ring drew from hardcoded hex (`#E3A72C`, `#28303F`) that
  bypassed the palette. It now reads the same two tokens as every other
  progress track in the app.
- Search placeholder reads "Search films and series" in Movies + Series scope.
  It always said "Search films" while searching both.
- `BUILD` moved from a date string to semver so it maps 1:1 onto this file.

### Removed

- `window.__lastExport`, written on every JSON export and never read anywhere —
  a debug leftover that pinned the full export in memory.
- Eleven dead CSS declarations. A "Canon skin" block at the foot of the
  stylesheet restated `font-family`, `font-weight`, `font-size` and two
  border colours that were already set 180 lines above, so the base rules were
  overridden on arrival and the real value of a token lived nowhere near its
  declaration. Folded back into their single base rule; the block is now
  additive only.
- The unused `data-tab` attribute on the header ring button, which has had its
  own click handler since it was added.

### Accessibility

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

### Added

- This file.
- `qa/guards.js` now checks that the headline counts in the `<meta>` description
  and `og:description` match the data. They were hardcoded and unverified, so
  they could silently go stale while the README stayed correct.
- `qa/guards.js` now checks that `BUILD` has a matching section in this file.
