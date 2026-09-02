# Night Watcher — the shape of the script

`docs/index.html` is one file: markup, styles, catalogue and logic, about
150 KB of script. This is the map a new reader needs before the first
change — what the sections are, what the state bag holds, how a count is
made, how a route becomes a view, and what one render does. `NOTES.md` says
why each piece is shaped as it is; `DATA-MODEL.md` is the storage half;
`NOTES-history.md` is how it got here. Line numbers are approximate and
move; the section names do not, and the guards (`qa/guards.js`, section 145)
require every top-level function to be a declaration, so a reader can find
any name below with a search for `function name(`.

## The sections of the script, in file order

| Region | What it holds |
| --- | --- |
| `PATH` | The catalogue: 44 universes, each `{n, name, note, films}` plus optional `fmt` (the default format its entries inherit) and `bag:1` (a group with no internal order — seven carry it), each film `{i, t, sub, y, when, ep, k, e, lo, out, r, d, b, o, fmt}`. `i` is frozen forever. `README.md`, "Adding to the catalogue", has the field list. |
| `ERAS`, `DECADES` | The eleven eras of Bruce's life plus era 0, and the ten decades — the groups of the other two orderings. |
| `BADGE`, `OUTWHY`, `MODENOTE` | Display vocabularies: the badge labels, the five reasons an entry has no place in a life, the one note per ordering. |
| `idHash()` | FNV-1a to five base-36 characters — an entry's identity inside a backup code. |
| `FILMS`, `BYID` | `PATH` flattened, one object per entry with its group index (`gi`), position (`ix`), resolved format and the lowercased search haystack; `BYID` indexes it by slug. |
| `S` and the constants | The state bag (below), `PATHS`/`PATHCODE`/`CODEPATH`, `BUILD`, `BUILT`, `KEY`, `SITE`. |
| Storage | `store` (a probed `localStorage`), `persist()` (200 ms debounce) and `persistNow()`, `flushPersist()` on `pagehide`/hidden, the readers (`marksOf`, `ratingsOf`, `clocksOf`, `dedupeLog`, `oneOf`, `flagsOf`, `stampOf`, `validTs`), `mergeLog`, `stampMark`/`marksSince`/`stampOut`, `askDurable`/`saveFailed`/`saveWorked`, the `SCHEMA` table and `restore()`. |
| Predicates | `visible(f)` = format ∧ scope ∧ `onRoute(f)`; `onRoute` through `tierOf`; `everyBatman()`. |
| Grouping and the pool | `GROUPINGS` (the three orderings as a table), `modeGroups()`, `buildGroups()` (memoised on `mode|scope|format|tier`), `pool()`, `counts()`, `isDone`/`isSkip`/`isParked`/`isParkedId`, the three sweeps `dropParkedSkips`/`dropParkedWatched`/`dropParkedRated`, `pickStands`/`expirePick`/`upNext()`, `behind()`, `groupFilms(key)`. |
| Row and badge helpers | `metaOf`, `tierOf`, `offLimits` (the safe chip's rule), `badges` (memoised), `titleYear`/`watchUrl`, `starRow`, `clampRating`/`stars`, `legendBlock`, `activityBlock`, `ratingBadge`, `watchLinks`, `attrEsc`, `toast`. |
| Mutations and in-place patches | `markWatched`/`unmarkWatched`/`toggleWatched`/`toggleSkip`/`rate` → `tickUpdate` (`patchRow` repaints one row in the visible panel — and, for a tick from another panel, in the inert Path — counts refreshed, the "here" mark moved); `rowUpdate` (one row), `groupUpdate` (one group), `searchApply` (a keystroke: `hidden` toggled on rows and groups in place), `themeUpdate`; the focus helpers `focusSnap`/`focusBack`/`focusRestore`. |
| Backup | `exportCode()` (the `NW3` code), `importCode()`, `download()`, `exportJSON()`, the file-handle seven (`fhDB`, `fhLoad`, `fhKeep`, `fhAllowed`, `fhWrite`, `backupToFile`, `refreshBackupFile`) plus `canSaveFile()`, `doRestore()`, `applyMarks()` (the one merge primitive), `applyImport()`. |
| Belt partials | `segButtons`/`segmented` and the option tables, `formatSwitch`/`tierSwitch`/`scopeSwitch`/`themeRow`, `includeBlock`, `buckleLines`, `masterChooser`, `introStats`/`introBlock`, `pendingBanner`. |
| Views | `viewHome`, `viewNext` (with `uptoButton`, `parkedRow`, `watchNotes`), `viewWatch` (with `chipSet`, `filmRow`, `groupBlock`, `scopeNote`, `emptyBlock`, the `g*` group helpers), the skyline (`ROOFS`, `roofOf`, `crownState`, `skyline`), `drawShareCard`/`shareCardBlock`/`cardFile`/`lineOf`, `viewStats` (with `progFold`/`progRows`, `nightsOf`, `doneBy`/`doneByLine`, `nightsLine`, `favList`/`favText`/`favBlock`, `installBlock`). |
| `renderHead()` and `render()` | The header (peek, ring, subtitle) and the one render entry point (below). |
| The panel deck | `NWTABS`, `buildDeck`, `snapTo`, `panelsInert`, `fillPanel`, `queueNeighbors` (idle refill of the two neighbours), `swipeTick`/`swipeRead`. |
| Belt open / drop / close | `openBelt`, `beltDropOpen`, `closeBelt(via)`, the drop-scroll arming, `beltWatch` (the two observers), `scrubBelt`, `parkFocus`. |
| Navigation | `goTab`, the scroll helpers (`scroller`, `scrollKeep`, `scrollPut`, `calmScroll`), `goToGroup`. |
| The cross-tab merge | The `storage` listener, whose body is `mergeTab(o)` inside a `try` (5.3.0): adopt a newer `resetAt`, merge by clock, adopt the five settings (last write wins; the `path` row's `put` carries `S.mode`), write back. |
| Delegated events | `#tabs` click; `#topBtn`, `#ringBtn`, `#markBtn`; `#beltpeek` click/keydown and the Escape handler; the one `#view` click handler (every `data-*` action); `#view` change (file import) and input (search, 180 ms). |
| The iOS viewport heal | `IOSDEVICE`, `isStandalone`, `vpGap`/`vpShrunk`/`vpSync`/`vpHeal`/`vpTick`. |
| Boot | `restore()` (the schema pass, then the three parked sweeps); `routeHash()` in a try; `buildDeck()`, `render()` and `snapTo()` in a try whose `finally` is `splashOff()` — the deck first, so the first render lays out four empty panels and not the crawler seed (5.3.1). |
| Hash routing | `clearHash`, `clearPendingHash`, `routeHash`, the `hashchange` listener. |
| Service worker, install, file handle | `sw.js` registration over HTTPS/localhost; `beforeinstallprompt`/`appinstalled`; `fhLoad()`. |

## `S`, the state bag

Persisted (through `SCHEMA`, under `KEY`): `watched`, `skipped`, `rated`,
`clk` (per-mark clocks in three maps), `log` (the activity list), `path`,
`theme`, `scope` (written from `scopePref`), `format`, `tier`, `groupOpen`
(only `false` entries), `progOpen` (only `true`), `insOff`, `resetAt`,
`lastExportAt`, `bkDismissAt`.

Transient: `tab`, `mode` (what is on screen; `path` is what was chosen),
`scopePref` (the preference behind a view's scope), `filter`, `q`, `code`,
`open`, `peek`, `pending` (a restore link awaiting an answer),
`confirmReset`, `beltOpen`, `beltOpening`, `beltDrop`, `beltDropping`, `fh`
(the file handle).

The rule that makes a shared link a view and not a takeover: only `path` is
persisted, `mode` never is, and a view hash sets `mode` and is consumed.

## The counting pipeline

Every number on the page comes from one chain and nowhere else:

```
visible(f)  = (format is "all" or f.fmt matches)
            ∧ (scope is "all" or f is not a season)
            ∧ onRoute(f)                      — tier "all" | core: tierOf(f) ≠ "o" | ess: tierOf(f) = "e"
groupFilms(key) = FILMS.filter(visible ∧ GROUPINGS[prefix].has(f, n))
modeGroups(mode) → [{key, code, tag, name, note, films (sorted by the row's comparator)}], empties dropped
buildGroups()   = modeGroups(S.mode), memoised on groupsKey(), tags numbered; also caches the flat pool
pool()          = the groups' films concatenated, in display order
counts()        = {total, done, skip, left} over pool(), parked entries (b has "u") excluded from all four
upNext()        = S.pick if it is still in the pool, released and unwatched; else the first released pool entry neither
                  watched nor skipped (then the first released unwatched) — never a parked one
```

`tierOf(f)` is exclusive — `"e"` if the entry carries the essential badge,
else `"o"` if it is optional, else `"k"` — and is the only way a tier is ever
read (guard 4 refuses the raw flag). The Path's chips (`S.filter`) sieve rows
inside `groupBlock()` and touch no count; the belt's three pouches feed
`visible()` and move every count.

## Routes

`routeHash()` runs at boot and on every `hashchange`. `#nw=<code>` parses a
backup code into `S.pending` and lands on Home with the banner. Otherwise the
hash is split on `-`/`+` into tokens: scope tokens first (`series`, `movies`
— a view of `S.scope`, never `scopePref`), then a view token (`life`,
`release`, `universes`/`path` → The path in that ordering with the hero's
group revealed; `progress`; `next`). A routed view hash is then cleared from
the address bar so a reload does not re-apply it. Guard 72 freezes the
vocabulary; the seed's links (guard 90) may use nothing outside it.

## One render

Mutate `S` → `persist()` (or not, for a transient — `S.pick`, the bag
chooser's hero for this session, and `S.upto`, the armed Watched-up-to-here
row, are transients alongside the view state) → `render()`, in code
order:

1. Snapshot the scroll offset first — before anything below can write
   layout — or take `nwArriveKeep`, the position kept for the panel being
   arrived at (section 120's rule: read before write).
2. `flagSave()`, `applyTheme()`, `counts()`, `renderHead(c)`; `buildDeck()`
   once, on the first render.
3. Snapshot the active panel's fields (`fieldSnap`) and focused button
   (`focusSnap`), then `fillPanel(S.tab, c)` writes the panel's HTML from
   its view function; the other three are marked dirty — unless the render
   is `{quiet:true}` (5.3.1: the six one-view actions — a peek, a fold, the
   code, the nag, the reset arm; the search keystroke never renders at all)
   or `{keep:{watch:1}}` (a tick from another panel already patched the
   inert Path row-level).
4. Tab buttons' `aria-current`; `focusRestore`, `fieldRestore`.
5. Scroll restore under `.settling` (content-visibility forced visible for
   one frame), then the focused field's drift correction.
6. `panelsInert()`, the drop-scroll squelch, `queueNeighbors()` (the two
   neighbours refilled at idle), `beltWatch()`.

A tick does not go through `render()`: `tickUpdate` repaints one row
(`patchRow`), refreshes the header and the group's meta, and marks the other
panels dirty, so the list under the reader's finger never moves (guard 103).
A search keystroke does not either: `searchApply` toggles `hidden` on the
rows and groups the query hides, and a full render produces the same DOM, so
the identity phase of `qa/smoke.js` holds the two byte-for-byte (5.3.1).
