# Night Watcher — the data model and the persistence spec

Three formats leave the app, and each is read back with tolerance rules of
its own. This is the specification; the reasons are in `NOTES.md` (under
`SCHEMA`, `store`, `KEY`, `exportCode()`, `importCode()`, `applyMarks()`)
and the guards that hold each rule are named.

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
| `watched`, `skipped` | `{slug: 1}` | `marksOf()`: own truthy keys only, each becomes `1`; anything not an object → `{}` |
| `rated` | `{slug: 1..5}` | `ratingsOf()`: each value through `clampRating()` (integer 1–5, else dropped) |
| `clk` | `{w:{}, s:{}, r:{}}` — per-mark clocks, `Date.now()` of the last change in either direction | `clocksOf()`: finite positive numbers only, prototype-free maps |
| `log` | `[{id, ts}]`, the activity list in time order | `dedupeLog()`: known slugs with a valid timestamp, one per slug (earliest kept) |
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

1. A `resetAt` newer than this tab's is an erase — adopt it, drop every mark.
2. For each incoming clock newer than this tab's **and** newer than the
   adopted `resetAt`: take the incoming state for that mark, present or
   absent (an absent mark with a newer clock is a tombstone).
3. `applyMarks()` adds whatever remains that neither side has clocked.
4. Watched beats skipped unless the skip's clock is newer.
5. The log is merged for watched entries.
6. If anything moved, render and **write the merged state back**.

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
count, ratings are clamped, unknown slugs are kept for a newer version, and
the log is merged when present (else watched entries get a fresh
timestamp). Like the code, it carries no clocks and merges additively. The
"Save to a file" button keeps a `FileSystemFileHandle` in IndexedDB
(`nw-backup-handle`) so later saves refresh the same file; the handle is
device-local and never part of any format.

## What never travels

`S.mode`, `S.scope` when it is a view, the filter chip, search text, open
rows, the belt's state, `clk`, `resetAt` and the stamps: transient, or
device bookkeeping. A backup restored a year later must not bring last
year's erase with it.
