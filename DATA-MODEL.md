# Night Watcher — the data model and the persistence spec

Three formats leave the app, and each is read back with tolerance rules of
its own. This is the specification; the reasons are in `NOTES.md` (under
`SCHEMA`, `store`, `KEY`, `importCode()`, "A code carries your progress,
not the catalogue" and `mergeTab()`) and the guards that hold each rule are
named.

## The catalogue's identity

Every entry has a slug `i` (lowercase, `[a-z0-9-]`), frozen forever: it is
the key progress is saved under and what every backup code hashes.
`qa/frozen-ids.json` is the snapshot; a slug may leave only through
`qa/retired-ids.json` and be renamed only through `qa/renamed-ids.json`,
each with a written reason (guard 2). Titles, years and every other field
are display text. `harley-quinn-season-5-2024` is the standing example: the
season slid to 2025 after the slug shipped, the year moved, the slug did not
(guard 84).

## 1. The live payload — `localStorage["batwatch-v3"]`

One JSON object, written whole by `persistNow()` 200 ms after the last
change (and flushed on `pagehide`/hidden), read once at boot by
`restore()`. The key never changes; the readers absorb every shape (guard
21, and `NOTES.md` under `KEY`).

| Key | Written as | Read back as |
| --- | --- | --- |
| `watched`, `skipped` | `{slug: 1}` | `marksOf()`: own truthy keys only, each becomes `1`; anything not an object → `{}`. A skip on a **parked** entry (one wearing `u`) is dropped after the schema pass by `dropParkedSkips()` — 5.0.0 made parked titles unskippable, so a skip placed on one under an older build is "not now" said twice, and keeping it would resurface it the day the title lands. `applyMarks()` and the cross-tab merge refuse the same skip at their own doors (guard 154). A **watched** mark on a parked entry is swept the same way by `dropParkedWatched()` (5.3.0), which also drops the entry's log nights; both sweeps stamp the clock and persist, so an older tab or code cannot re-add the mark (guard 158). |
| `rated` | `{slug: 1..5}` | `ratingsOf()`: each value through `clampRating()` (integer 1–5, else dropped). **A rating is a mark** (5.3.1): a rating on a parked entry is swept by `dropParkedRated()` after the schema pass, refused by `rate()`, by `applyMarks()` and by the cross-tab merge, and `favList()` never lists a parked title — a star is a verdict on something watched, and a parked title cannot have been (guard 158). |
| `clk` | `{w:{}, s:{}, r:{}}` — per-mark clocks, `Date.now()` of the last change in either direction | `clocksOf()`: finite positive numbers only, prototype-free maps |
| `log` | `[{id, ts}]`, the activity list in time order | `dedupeLog()`: known slugs with a valid timestamp (`validTs()`: a finite number or numeric string **greater than zero** — the epoch is not a night, 5.3.1), one per slug (earliest kept). `mergeLog()`, which every merge door uses, refuses an entry for a parked title (guard 158). |
| `path` | `"life"`, `"continuity"` or `"release"`, or `""` | `isPath()` (own property of `PATHCODE`); falls back to the legacy `mode` key of saves written before `path` existed; never to the live `S.mode` |
| `theme` | `"dark"` or `"darker"` | `oneOf`, else keep the default |
| `scope` | `S.scopePref` — the preference, never a view's scope | `oneOf(["movies","all"])` → sets both `S.scope` and `S.scopePref` |
| `format` | `"anim"`, `"live"` or `"all"` | `oneOf`, default **`"anim"`** — a save without one predates 1.5.0 and keeps the animated world it had |
| `tier` | `"ess"`, `"core"` or `"all"` | `oneOf`, default **`"all"`** — a save without one predates 4.8.0 and opens wide |
| `groupOpen` | `{groupKey: false}` — only the collapsed ones | `flagsOf(v, false)` |
| `progOpen` | `{foldKey: true}` — only the opened ones | `flagsOf(v, true)` |
| `insOff` | `true` or absent | `true` only |
| `resetAt`, `lastExportAt`, `bkDismissAt` | epoch ms, or absent when 0 | `stampOf()`: positive numbers only |

Anything else in the object is ignored. A payload that cannot be parsed, or
a store that throws on read, latches `readFailed`: the app boots empty, the
header says storage is blocked, and **no write happens for the rest of the
session** — the unread bytes stay on disk for the reader (guard 127).

### The cross-tab merge

Every other tab receives the write as a `storage` event and merges it:

The listener's body is `mergeTab(o)`, run inside a `try` whose `catch`
persists and renders (5.3.0) — a throw mid-merge can never leave an adopted
erase in memory only, where the next tick would persist a half-merged blob.

1. A `resetAt` newer than this tab's is an erase — adopt it, drop every mark.
2. For each incoming clock newer than this tab's **and** newer than the
   adopted `resetAt`: take the incoming state for that mark, present or
   absent (an absent mark with a newer clock is a tombstone). A parked
   entry's mark is never adopted (guard 158). The clocked loops carry an
   id this build cannot render (a newer build's title) on purpose — see §4.
3. `applyMarks()` adds whatever remains that neither side has clocked.
4. Watched beats skipped unless the skip's clock is newer.
5. The log is merged for watched entries.
6. The five settings — `path`, `theme`, `scope`, `format`, `tier` — are
   adopted from the incoming payload through SCHEMA's own readers, last
   write wins (5.3.0): a tick in one tab no longer reverts the theme or
   order the other tab just saved. The `path` row's `put` sets `S.mode`
   with it (5.3.1), so an adopted path never shows the shared-view banner.
   Settings and marks still share one key; the split is the standing MAJOR
   item in `NOTES.md` ("Open").
7. If anything moved, render and **write the merged state back**.

Payloads from builds without clocks merge additively and can never
resurrect a clocked removal. Smoke drives all of this through real
`StorageEvent`s; guard 134 holds the shape.

## 2. The backup code — `NW3…`

A one-shot transport: it carries progress and the chosen path, never
settings, clocks or device bookkeeping (guard 87).

```
NW3  W <5 chars per watched slug>  S <5 per skipped>  R <one base-36 digit per W entry>
     O <5 chars + one digit per rated-but-unwatched>  [P c|l|r]
```

- Each slug is `idHash(slug)`: FNV-1a over the slug, truncated to five
  base-36 characters (36⁵ ≈ 60 million; guard 3 fails on any collision in
  the catalogue and prints the birthday risk).
- `R` runs parallel to `W`, one digit per watched entry (`0` = unrated),
  trailing zeros trimmed. `O` carries ratings on entries not marked watched.
- `P` is the path code (`c`/`l`/`r`) and is optional.

`importCode()` reads tolerantly: whitespace is stripped, anything before the
first `NW\d+[A-Z]` is dropped (a pasted restore URL), a trailing quote,
period or bracket is trimmed (a chat client's), unknown hashes are counted
(`unknown`) rather than refused (a code from a newer catalogue), and a body
whose segment lengths do not divide is flagged `cut`. `NW1` and `NW2` codes
(the 1.x layouts, ratings as six-character records) still import (guard 8).
Restoring a code merges through `applyMarks()` with fresh clocks: nothing
already ticked is lost, and a skip never lands on a watched entry.

The restore link is the site (or the current origin) plus `#nw=` and the
code; guard 73 holds the worst-case link under the length every browser and
messenger carries.

## 3. The JSON export

```json
{"app":"night-watcher","v":2,"exported":"<ISO 8601>","path":"life",
 "watched":{},"skipped":{},"rated":{},"log":[{"id":"…","ts":0}]}
```

Read by `doRestore()` when a paste starts with `{`: each of the three
containers must be a plain object (at least one present), own truthy keys
count, ratings are clamped, and unknown slugs are counted and reported —
not refused, and not kept in state: `applyMarks()` admits only catalogue
ids, so the file itself is what preserves them, and restoring it again on a
newer build recovers them (the same rule as an unknown hash in a backup
code). The one exception is the cross-tab merge's clocked loops (§1), which
carry a clocked id from a newer build's tab on purpose — `backlog.md` and
`NOTES.md` under `applyMarks()` record it as accepted. The log is merged when present; otherwise watched entries get a
fresh timestamp. Like the code, it carries no clocks and merges additively. The
"Save to a file" button keeps a `FileSystemFileHandle` in IndexedDB
(`nw-backup-handle`) so later saves refresh the same file; the handle is
device-local and never part of any format.

## What never travels

`S.mode`, `S.scope` when it is a view, the filter chip, search text, open
rows, the belt's state, `clk`, `resetAt` and the stamps: transient, or
device bookkeeping. So are `S.pick` (the title Let Gotham choose surfaced —
a refresh returns to the first row, so the belt stays the only thing that
sets the route) and `S.upto` (the armed Watched-up-to-here row, which
disarms on its own after four seconds). A backup restored a year later must not bring last
year's erase with it.
