# Night Watcher — why the code is the way it is

`docs/index.html` carries no explanatory comments. It is the only file that ships
to a reader, it has a hard weight budget, and the reasoning does not need to
travel with it. This is where the reasoning lives.

Every entry below sat in the file as a comment until 1.6.3. Nothing was
rewritten on the way out — where a note reads like it is arguing with a past
decision, that is because it was.

Four other places carry part of the story and are not repeated here:

- **`NOTES-history.md`** — the post-mortems, the release essays and the
  archived comment blocks, each under a dated heading. Nothing there is
  required reading before a change; everything here is written in the
  present tense.
- **`CHANGELOG.md`** — what changed in each release and why, in the owner's voice.
- **`qa/guards.js`** — 158 numbered sections, each one a rule with the failure that
  produced it written above it, and each one negative-tested — asserted by
  section 138 on every run, not merely stated here.
- **`README.md`** — what the app promises and what it refuses to do.

If you are about to change something in `index.html` that looks redundant, look
for it here first. Most of it is load-bearing, and this project has a long
history of rules that only make sense once you know what they were written after.

Contents: [Head](#head) · [Script](#script) · [Styles](#styles) ·
[Known blind spots](#known-blind-spots) · [The sentinel](#the-sentinel-that-the-search-box-could-type) ·
[What an era note may say](#what-an-era-note-is-allowed-to-say) · [Counting the suites](#counting-the-suites) ·
[The decisions that can fail](#the-decisions-that-can-fail) · [One ordering per export](#the-plain-text-export-carries-one-ordering) ·
[Section 24](#section-24-does-not-run-at-file-scope-and-that-is-allowed-once) · [The floor](#the-floor).
The architecture of the script (the sections of the file, `S`, the counting
pipeline, the render loop) is `ARCHITECTURE.md`; the storage payload, the
backup code and the JSON export are `DATA-MODEL.md`.

---


## Head

These four sat in `docs/index.html` as HTML comments until 1.6.6. The
no-comments policy had only ever been enforced against `/* */`, so about 950
bytes of explanation lived in the head for three releases after the file was
supposed to have none. Guard 65 counts both syntaxes now, against a named
allowlist.

### The viewport carries no `maximum-scale`

Capping it blocks pinch-zoom, which fails WCAG 1.4.4 on a screen this dense in
9–10px mono. The zoom is the accommodation; taking it away to stop iOS
auto-zooming a text field would be trading an accessibility failure for a
cosmetic one. Guards section 62 solves the auto-zoom the other way, by holding
every focusable field at 16px or more.

### `rel=icon` points at a file, not at base64

`icon-192.png` used to be inlined, twice, at about 11% of the file. It is a
`<link>` now. The path is relative so a `file://` open still resolves it, which
is how most of this project gets looked at before it is deployed.

### The tab icons are inline SVG on a shared 24×24 grid

Not unicode glyphs. The old set came from four font fallbacks with four
different advance widths, and U+25B6 has an emoji presentation that ignored the
selected-state colour entirely. Fixed geometry is the only way to guarantee four
identical optical centres.

### Fonts and palette

Limelight, Big Shoulders Display and IBM Plex (Anton until 4.3.0), all under the SIL Open
Font License, served from `fonts/` rather than a CDN — the app makes a promise about asking nothing of
anyone else, and guards section 42 enforces it. The palette is original hex,
styled after the classic black / blue-grey / belt-yellow scheme.

The one head comment that stayed is the notice about marks and lettering. It is
not an explanation of the code; it is a statement about the file, and it belongs
in the file it is about.

## Script

### `PATH`

e = story era for the composite timeline. 0 = no place in one Bruce's life.

### `idHash()`

IDs in i:"..." are FROZEN. Titles are display text — rename freely. Adding
is safe; changing or removing an i breaks saved progress for real people.

### `S`

path is the locked choice, mode is what is on screen. Only path is
persisted — that is what makes a shared deep link a view, not a takeover.

### `BUILD`

Semver, mapping 1:1 onto CHANGELOG.md. Bump for every shipped change; sw.js
VERSION and the changelog must agree or guards fail the build.

### `KEY`

`batwatch-v3`, and it never changes: a new key is a fresh, empty store for
every existing reader, which is the progress loss this project exists to
prevent. A storage-shape change is absorbed by `SCHEMA`'s readers (each row
normalises whatever it finds) — never by a new key. Guard 21 pins it.

### `restoreLink()`

On file:// location.origin is the string "null". Fall back to the published
copy — the link exists to reach a different device either way.

### `store`

A probe of `localStorage` (set and remove one key) wrapped as `get`/`set`,
or `null` when the browser refuses — private browsing, a full quota, some
webviews — in which case `canSave` is off from the start and the header says
so. Synchronous since 4.9.0: the Promise shape it carried was for a
`window.storage` adapter (Claude artifacts) that no served origin ever had.

### `resetAt`

3.7.2, M-1 of the 10 Aug review. Cross-tab sync is a MERGE, and a merge can
only add — which meant "Clear all progress" in one tab was quietly resurrected
by any other open tab: the second tab kept the full state in memory, its next
action persisted it all back, and the erasing tab's storage listener merged
its own erased history back into view. On an app whose privacy pitch is that
what you tick stays yours, an explicit erase that undoes itself is a broken
promise, not a quirk.

The fix is one monotonic clock. The reset stamps `Date.now()` into `resetAt`,
persists it inside the payload, and the storage listener treats a payload
whose `resetAt` is NEWER than this tab's as the wipe it is: adopt the clock,
drop the in-memory marks, then merge whatever the payload still carries
(nothing, for a fresh erase). A STALE `resetAt` changes nothing, so the wipe
cannot re-fire, and a payload with no clock at all merges exactly as before.
The remaining race — a tab writing marks in the gap before the storage event
lands — is narrowed to milliseconds from "any later action, forever." Smoke
drives the listener with real StorageEvents in all three shapes, because the
listener is anonymous and no guard can extract it.

`resetAt` rides the persisted payload but deliberately NOT the JSON export or
the backup code: a backup carries progress, not device bookkeeping (guard 87),
and restoring last year's backup must never bring last year's erase with it.

### `parkFocus()`

The parked belt hides its buttons with `visibility:hidden`, which removes
them from the tab order, so while the peek is the only affordance it has to
be the button: `#beltpeek` carries `role="button"`, an aria-label and
`tabindex="0"` statically in the markup (since 4.0.4), and `parkFocus()`
toggles only `data-on` — shown and focusable when the strip is parked by
state (`data-park`) or by the observer (`data-beltpark`) and not held or
dropped, hidden otherwise. It runs from `beltWatch()` (every render) and
from the park observer (whose park/unpark never re-renders). Enter and Space
on the peek call `beltDropOpen()` exactly as a tap does, and Escape closes a
held or dropped belt (4.9.0).

### `readFailed`

Two latches, because a failed READ and a failed WRITE are opposite facts and
3.4.5 fixed them in opposite directions. A read that failed means the state on
disk is unknown, so the writes stop for the session — `readFailed` is checked
in `persist()` and `persistNow()` and never clears. Before 3.4.5 the async
backend's rejection path left saving on, and the first tick wrote a one-entry
payload over everything the reader had. A write that failed says nothing about
the next one, so `canSave` clears itself the moment a write lands: one
quota-style throw used to latch it for the session and everything after the
blip was lost on close. Guard 127 holds both directions, and holds them apart.

### `saveWorked()`

The half that was missing. `#nosave` is honest in both directions now — it
appears when a write fails and goes when one succeeds. Nothing else clears it.

### `THEMEBAR`

CSS cannot reach the system status bar; the meta tag has to follow.

### `dedupeLog()`

One entry per id, earliest timestamp wins — that is when it was actually
watched. Enforced where saved data is read rather than where it is written,
because a payload can also arrive hand-edited or from a build that is not
this one. Ratings are not reconciled here: they live in S.rated keyed by id,
so there is only ever one.

### `SCHEMA`

One row per persisted key — what `persistNow()` writes (`get`, or `S[k]`)
and how `restore()` reads it back (`read`, which returns the value to adopt
or `undefined` to keep the default; `put` for the one key that lands in two
places). Before 4.9.0 the two functions each hand-enumerated the keys and a
new field was three edits plus a guard; now it is one row, and guards 27,
35, 36, 52, 93, 131, 134 and 152 read the rows through `schemaRow()`.
Nothing is ever taken off the parsed payload as-is: the three progress
containers go through `marksOf()`/`ratingsOf()`, the clocks through
`clocksOf()`, the log through `dedupeLog()`, the enums through `oneOf()`
with the right default, the two fold maps through `flagsOf()` (only the
non-default value is meaningful — `false` for groups, `true` for the
Progress folds), the stamps through `stampOf()`.

The `path` row reads the legacy `mode` key as its fallback (a save written
before `path` existed) and never `S.mode`: with no path chosen that wrote a
real ordering, which the next load adopted as one. The payload no longer
writes `mode` (it was a mirror for a 1.1.0 downgrade; dropped in 4.9.0).

### `isPath()`

An OWN-property lookup, and the value has to be the string a path code is.
It was `!!PATHCODE[id]` until 3.4.5, which reads the prototype chain: a JSON
backup carrying `"path":"__proto__"` passed, set `S.path` and `S.mode`, threw
inside `noteFor()` after the state had already mutated, and the debounced
persist that was scheduled a moment earlier wrote the poison to storage anyway.
Every later boot then threw at render — pre-render shell, no progress, both
tabs throwing on tap — and only clearing site data recovered it, which is the
progress loss the backup feature exists to prevent. The `res` note below had
predicted the shape of this two releases early. Guard 126.

### `marksOf()`

`S.watched = o.watched || {}` accepted any truthy value, so a stored
`"watched":"oops"` made every `toggleWatched()` throw and marking stayed dead
until the reader reset. `groupOpen` and `progOpen` had had the right check for
releases; the three containers carrying the actual progress did not. Also drops
`__proto__` and friends, which `JSON.parse` will hand over as own properties.

### `ratingsOf()`

The same check for ratings, plus the clamp. A stored `9` used to survive into
`S.rated`.

### `validTs()`

`isFinite(null)` is true. A log entry with `ts:null` became epoch 0, sorted to
the front of Activity and dated itself 1970.

### `oneOf()`

The enum reader for `theme`, `scope`, `format` and `tier`: the value if it is
on the list, else the fallback. Any truthy string used to be accepted for
scope, and `visible()` reads anything that is not "all" as movies-only — so a
hand-edited "films" hid every season while neither scope button rendered as
pressed. The format row's fallback is "anim", not "all": a save written
before 1.5.0 has no format, those people have been tracking animated for
months, and defaulting them to All would grow the denominator overnight and
hand them a live-action film in Next up. They keep the world they had; only
new arrivals get All. The tier row's fallback is "all" for the mirror-image
reason: a save written before 4.8.0 has no tier and must open wide.

### `flagsOf()`

Keeps only the entries equal to the one meaningful value — `false` for
`groupOpen` (open is the default and absent reads as open), `true` for
`progOpen` and `insOff` (closed and shown are the defaults). Anything else
is noise from a hand-edited payload, and persisting a default would flip it
the next time a build changes one.

### `/* Two axes now. Format asks which kind of Batman; scope…`

---- ordering ----

### `visible()`

Three axes. Format asks which kind of Batman; scope asks how much of it;
the tier (4.8.0) asks how deep. Format narrows first, then scope within it,
then the route within that — through `onRoute()`, never a raw flag.

### `onRoute()`

The tier's one test, through `tierOf()` like the chips, so the belt and the
chips can never disagree about what "Core route" means: everything that is
not Optional, Essentials inside. `S.tier` is `ess`, `core` or `all`; a save
without one opens `all` — nobody's denominator moves overnight (the 1.5.0
rule for format, applied again). See "The third pouch" below.

### `everyBatman()`

"Every Batman there is" is a claim about the whole catalogue, and it is
only true when no pouch narrows anything. `allLoggedWord()` says "every
entry on the route" otherwise; the Next up close, the Home hero and the
share card's 100% line all read through it, so the phrase lives once.

### `yearSpan()`

The span depends on scope: films start 1993, series reach back to 1968.

### `pathBlurb()`

The chooser carried its own copy of these and the two drifted: one said
"safest first watch" where the other said "safest way through", and the
release blurb hardcoded 1968 while the note computed 1993 from the actual
scope. One source now, trimmed to its first two sentences — nobody sees both
at once, which is exactly why they diverged.

### `groupCache`

Cached on mode|scope|format — the three things membership depends on. Never on
watched/skipped/rated, so nothing needs to clear it and a new key simply
misses. If membership ever depends on progress, this cache is wrong.

### `anyOpen()`

Absent reads as open, so "any open" is not simply Object.keys().length.

### `revealHero()`

The hero's group opens when you arrive at The Path, so the thing you are
actually up to is never hidden behind a header you have to find. A deliberate
collapse-all is left alone — re-opening it on every visit would make the
control useless. It does not persist (4.9.0; it did from 3.4.5): a shared
view link runs it too, and a read-only view must not write to the reader's
stored state. The next persisting action carries the change, and a reload
simply reveals again.

### `scoreboard()`

Home and Progress each drew their own board with a different third stat —
Skipped on one, Essentials on the other — so the same component meant two
things. Watched, To go and Skipped account for every entry in the pool;
Essentials is a different axis and already has its own row and its own donut.
Colour comes from the palette and carries the meaning the legend already
gives it: signal for done, bone for what is left, steel for passed over.

### `p`

Preference order: never-skipped first. Only when everything left has been
skipped do we resurface skipped titles, and the hero labels that state.
Since 5.0.0 a parked title is never the hero at all, in either pass — a
skip is a decision about the title and outranks a date, which is not one.

### `isParked()` / `dropParkedSkips()`

An entry wearing `u` is parked: on The Path with its date, never the hero,
never ticked or skipped, off every count that means "what exists". Before
5.0.0 the only way past an unreleased title was Skip, which turned a date
into a decision. The five doors a mark comes through — the tap, the read,
the pasted backup, the JSON restore, the cross-tab merge — each refuse a
skip on a parked entry; `dropParkedSkips()` runs once after the schema pass
and clears the ones older builds let in. Dropping them is not a lost mark:
"not now" on a title nobody can watch says nothing the badge does not.
Guard 154.

### `counts()` / `g.size`

`total` is the released entries in the pool — `{total, done, skip, left}`,
nothing else; a `parked` field rode along in 5.0.0 with no reader and was
dropped in 5.1.1. Every group carries `size` (its released entries) beside
`films` (its shelf): the bars, the folds, the ✓ on a universe card, Home's
tier rows, the skyline's crown and the share card's fill all read `size`,
so a universe holding a 2028 title can top out. Width stays `films.length`
on the skyline and the card — width is size on the shelf, fill is what
exists — and `roofOf()` keeps seeding from the shelf so the two draw the
same roof (guard 150). The kick on Home prints `c.done` of `c.total`, the
header's own number (5.1.0; the route position it printed in 5.0.0 read as
a disagreement — NOTES-history has the story).

### `metaOf()` and the cost of the night

A season already printed its episodes. A film now prints "Film" and a short
"Short" — the bill for the night, in the meta line, on both heroes and every
Path row. An entry whose sub label already says the shape ("15 chapters",
"30 shorts") says nothing twice. Running times were considered for 5.0.0
and dropped: a film is a film, and 133 sourced minutes with a cut rule to
argue buy nothing on top of that.

### `heroHead()` — the rule is the seam

The diamond rule moved from between the badges and the blurb to under the
blurb (5.0.0). The card has two halves now: the film above the rule (kick,
continuity, title, meta, badges, blurb) and the night below it (the bag line,
stars and link, the buttons). Home is the poster — the position on the kick,
one button — and Next up is the desk. The note lines under the rule carry no
diamond of their own: the rule is the card's one ornament.

No "then, when it lands" line on the hero: the Then table under it draws a
parked row in place, dimmed, with its date, and the hero does not say it
twice (owner, 29 Aug).

### `S.pick` / Let Gotham choose

Only on a bag, because only there is no order to break. A tap picks at
random among the shelf's unwatched, unskipped, released titles and the
hero shows it for this session; `upNext()` honours the pick only while it
is still in the pool and still unwatched. It is not in `SCHEMA` — a refresh
returns to the first row, so the belt stays the only thing that sets the
route. The circle-arrow is inline SVG, not a glyph: the subset fonts carry
no U+27F3, and guard 116 would say so.

### `uptoButton()` / `behind()`

Watched up to here is the one bulk write in the app, so it arms and
disarms like the reset button (four seconds) and writes through
`markWatched()` like every other tick — the log and the skip-clear cannot
drift. `behind()` is the unwatched, unskipped, released entries before the
row in route order: a skip stays skipped, because it was a decision.

### `OFFLIMITS` / `offLimits()` — the chip that excludes

Two values, `R` and `TV-MA`, read straight off `r:`. A "nothing above
PG-13" chip was considered and refused: it needs a ladder across the MPA
and TV Parental Guidelines systems, and the badge rule (guard 92) says
the certificate renders what its own system says, never a translation.
An exclude-set has no ladder. It is a view chip like the seven before
it: `counts()`, `upNext()` and `pool()` never see it, because a chip that
moved the hero would be jumping the path.

### `doneBy()` — a pace with a floor

Titles per night, times nights per day over the span the log covers,
gives a per-day rate; what is left divided by it gives days. Below three
nights or two titles the function returns null and the line renders
nothing — a forecast off one evening is a guess wearing a date. Within
sixty days the line prints a day, further out a month. It moves with the
log and cannot be earned, which is the difference between a pace and a
streak.

### `favList()` / `nightsOf()`

Two lists off state that already existed. (A third, `routeText()` — the
unwatched route as copyable text, "What's left" — shipped in 5.0.0 and
left in 5.1.1: it was the one place in the app where a click handed a
person the whole curated route; guard 156 refuses its return. `orders.txt`
is a different thing: offered to crawlers and no-script readers, never by
a button.) Five stars is exactly rating 5. Nights are distinct local
calendar days in the log — counted on Progress, never awarded, no streaks;
one line, not a scoreboard tile, because the three tiles account the pool
and nights are another axis (the same argument that kept Essentials off
the board).

### `/* One haystack. It was written out twice \u2014 once to…`

Nine Super Friends entries carry the year as their sub label — sub:"1973"
and so on — so pushing sub and then y printed it twice on every meta line in
the app: "1973 · 1973 · 16 episodes" on both heroes, and again on Then and
The Path. A sub that is only the year says nothing the next field does not.

### `matches()`

One haystack. It was written out twice — once to decide what the list shows
and once to decide what the "N matches" line calls hidden — so a field added
to one and not the other made the count stop describing the list.

### `GROUPINGS` / `modeGroups()` / `groupFilms()`

The three orderings as one table (4.9.0): for each mode its key prefix
(`c` + PATH index, `e` + era, `d` + decade's first year), the list it
groups over, the frozen roof code (`u` + PATH's `n`, the era key, the
decade key — never an array index, which reshuffles the city on the next
insertion), the membership test, the chip tag and the comparator
(`lifeCmp`, `releaseCmp`; the universes keep the catalogue's own order).
`modeGroups(mode)` builds the groups with their films sorted and the empty
ones dropped; `buildGroups()` memoises it for the current mode and numbers
the tags; `groupFilms(gk)` is the one definition of "in this group" for
Home's grid, Progress's rows, the chart and the card; `goToGroup()` reads a
key's ordering off the same table. Before the table, the key scheme was
spread over five sites and a fourth ordering would have touched all five.

### `releaseCmp()`

Year, then the catalogue's own order (group, then position). A same-year tie
broken by title sorted Crisis on Infinite Earths Part Three before Part Two
and Batman Beyond season one before its pilot feature (4.8.0 report, 1.1).

### `tierOf()`

Tier membership is EXCLUSIVE: Essential > Optional > Core. The raw o:1 flag
is a ROUTE marker, not a tier — nearly every TV season carries it (The
Penguin is the one that resolves to Core, and that is deliberate). Always resolve
through tierOf(); testing f.o directly drops an essential season from Core
AND Optional, leaving it in no bucket at all.

### `if(S.format === "all"){`

Only in All. Under Animated or Live action every row would carry the same
badge, which is a label for the switch you already set.

### `/* The earliest year the title appeared, not the entry's…`

A search engine instead of an aggregator. One URL shape everywhere: no
country in the path, no localised segment, nothing to verify per market and
nothing that can 404. Three attempts at building an aggregator URL shipped or
staged broken before this.

### `TITLEYEAR`

The earliest year the title appeared, not the entry's own. Availability is
sold per show, not per season, so "Batman: The Animated Series 1994" is a
worse query than "\u2026 1992" for the same answer — and every season of a show
asking the same question is the point. Titles repeat across the
catalogue; without a year they all resolve to whichever one is more famous.

### `/* "Rate 3" repeated down a page of films says nothing a…`

One star row, shared by the detail panel and Next up.

### `starRow()`

"Rate 3" repeated down a page of films says nothing about which film or what
it is currently set to, and the tap-the-lit-star-to-clear behaviour was
invisible without sight of the row. The title is in scope at every call
site, so there is no reason it was ever absent.

### `ACTIVITYMAX`

The last three ticks, newest first, with the stars you gave them and a tick to
take them back.

Three, not five, since 1.6.6. Measured at 390px with eight entries watched:
at five, Recent activity was 262px against the queue's 191px — history
outweighing the queue on the tab that exists for the queue. Four was still 26px
ahead. Three is the first value where the queue wins, 172 against 191.

What that costs, because it is a real cost and not a free tidy: the window in
which a tick can still be rated *in place* is now three deep. Tick four things
in one sitting without rating them and the first is only rateable on The Path.
Three covers a trilogy in a night, which is the sitting this tab is for, and
bulk-marking a backlog happens on The Path, where every row already carries its
own stars. If a soak ever finds someone losing ratings this way, the number is
the thing to move — it is pinned in guards section 34 and read from the page by
`qa/smoke.js`, so it moves in one place. Stars never move the hero — rate() calls markWatched(), a
no-op on something already watched. The tick is the one control here that
does move it, and that is its whole purpose: 1.4.1 put stars on the hero, and
a 34px star beside a full-width button needs an undo within reach of the
thumb that missed. Scope is deliberately ignored: this is what you did, and
hiding a series you logged because the toggle now says films would be a lie
about your own history.

### `/* Drawn with the badge classes themselves, not a colour…`

The badges this defines render on The Path and nowhere else. It sat on
Progress until 1.4.1 — a key printed on a different page. It goes last,
because reference is something you go looking for.

### `legendBlock()`

Drawn with the badge classes themselves, not a colour picked to match them.
1.5.9 made tier filled, modifiers outlined and format dashed; the legend kept
describing all nine as coloured words, so the key stopped looking like the
thing it explains. Same one-source rule as pathSeg(): the swatch is a badge
or the legend can lie.

### `rows += '<div class="arow">'+`

an id from a newer build

### `clampRating()`

Ratings are integers 1-5. Imported JSON may carry anything, and an
out-of-range value reaches new Array(n+1) in the star render and throws,
blanking the view. Every write to S.rated goes through this.

### `if(S.rated[id] === n){ delete S.rated[id]; }`

Only setting a rating implies you watched it. Clearing one used to run
markWatched() as well, so untick something, tap its lit star to clear the
stale rating, and it came back marked watched — the opposite of both
actions. Reachable from the hero since 1.4.1.

### `return "NW3W" + w.join("") + "S" + k.join("") + "R" + pos.…`

NW2 added the path in a P segment (NW3 is the same code with positions). 1.1.0 skips segments it does not know,
so it restores everything else. 1.0.0 rejects NW2; sw.js is network-first.

### `importCode()`

NW<version> plus segments. Unknown segments and versions are skipped, so a
code from a newer build still restores what this one understands. Useless
unless it ships before the first code that needs it.

### `if(!/^NW\d+(?:[A-Z][0-9a-z]*)+$/.test(code)) return null…`

tolerate a pasted URL

### `if(id && n){ res.rated[id] = n; if(!res.watched[id]) res…`

Count ratings too. Without this a code carrying only ratings restored
correctly and then reported "Restored 0", which reads as a failure.

### `exportJSON()`

Progress, not settings. A backup restores what you watched onto whatever
device you are holding; it does not reach over and change that device's
format, scope or theme. The local payload carries those because it belongs
to one device.

### `res`

Null-prototype, like dedupeLog. Every value written here is a primitive
today, so a "__proto__" key from a hand-edited payload is inert — but the
protection should not depend on that staying true.

It did not stay true, and this note called the shape of it. The container was
never the hole: `path` is a scalar beside them, validated only by `isPath()`,
which read the prototype chain until 3.4.5. See `isPath()` above. `BYID` was
the other half — a plain object literal, so `BYID["constructor"]` answered
truthy and the "Restored N" toast counted names the apply loops then dropped.
Null-prototype now, for the same one reason.

### `mergeLog()`

Sanitised to the same shape the storage listener writes. It used to
push the whole foreign object, so extra fields from a hand-edited
backup persisted into storage forever and a string ts sorted oddly.

### `if(!S.path && isPath(res.path)){ S.path = S.mode = res.p…`

Restore merges progress; it must not overwrite a path chosen here.

### `segmented()` / `segButtons()`

One helper renders every segmented control — the three pouches, the theme
row, the path segments and the filter chips — from a named option table
(`FORMATS`, `SCOPES`, `TIERS`, `THEMES`, `PATHS`, `chipSet()`): a wrapper
with `role="group"` and an accessible name, and one button per option with
its `data-*` attribute and `aria-pressed`. Six hand-rolled copies before
4.9.0, none of them labelled as a group.

### `formatSwitch()`

Format asks which kind of Batman, scope asks how much of it, the tier asks
how deep. Three questions of the same sort, so they sit together — the path
control above answers a different one entirely, which is how you tell them
apart without a label. No button in any row says "All" since 4.8.0: the
format row ends in "Animated + live", the scope row in "Movies + Series",
the tier row in "+ Optional". Each names what it holds; the belt's one
summary word belongs to the buckle.

### `tierSwitch()`

Essentials / Core route / + Optional, narrow to wide, left to right like
the other two rows. "Core route" includes the Essentials — the chip has
meant that since 1.x and the legend says "the main route" with Essential a
badge on top — so the middle button never needed a second word. The wide
button is written as an addition, the way "Movies + Series" is, so nobody
reads it as excluding what came before it.

### `buckleLines()`

The closed buckle names only what has been narrowed, one line per pouch,
in pouch order. A wide pouch is silent: it is the default and says nothing
worth reading. Nothing narrowed is the one state with nothing to list, and
it gets the app's own two words, EVERY BATMAN. Measured before it was
built: the slot is about 55px at 390 and grows with its content; every
line is under the 62px "Movies + Series" already took, and three lines at
8/7/7px fit the 44px belt. The accessible name is not silent — it reads
all three answers in full.

### `masterChooser()`

The master chooser. Which ordering, then what is in it — the two questions
every tab is an answer to. It used to be split: the path control only on
Home, a lone scope switch at the top of The Path and Progress, and nothing at
all on Next up. Same block, same place, everywhere now.

### `/* Counts what the format switch is showing. It used to …`

Counts follow the format in view. Saying "57 seasons" while Live action is
selected would be describing a catalogue the person cannot see.

### `introStats()`

Counts what the format switch is showing. It used to count the catalogue,
so picking Live action still claimed 110 films and 58 seasons of television.

### `introBlock()`

One source. The first-run page rendered none of this, so the only page a
search engine ever sees contained the word "Bruce" twice and "Batman" not at
all — while the sentence that says it was already written, three branches
down, waiting for a path to be chosen.

### `if(!S.path){`

No path yet: Home is the chooser. Not a modal — nothing to dismiss, and
deep links still route, because routing never depends on it.

### `return '<button class="pick big'+(i === 0 ? ' lead' : ''…`

One card leads, and nothing said which — three equally weighted cards leave
a newcomer guessing at the one decision the app actually has an opinion about.
The lead was By universe until 1.7.2, on a spoiler-safety argument. It is
Bruce's life now: that is the ordering this project made rather than inherited,
and By universe is the completist's path rather than the newcomer's.

### `html += masterChooser();`

The card repeated the header exactly — name, ring, percentage, done of
total — and its only unique content was a Change button. The header carries
all of that on every tab already. What Home needs is the switch itself.

### `chipSet()`

All six chips, always. Splicing the tier chip in only while it was active
left Home as the only route back to Essentials. The row scrolls.

### `viewing`

Switcher removed in 1.2.0: chosen once from Home, not re-asked per visit.

### `viewing = '<div class="viewing"><p>Viewing <b>'+esc(path…`

Both directions. Offering only "make this mine" made a view a one-way
door, since mode is not persisted and only a reload undid it.

### `detail`

Built ONLY for the open row. Emitting it for every entry and hiding it was
~220 KB of the ~292 KB this view produced, reparsed on every keystroke.

### `html += '<div class="bk yd"><h2>Your data</h2>'+`

The path row here duplicated Home's Change. What is left is progress in
portable form, which is why it stays in Progress.

### `var pm = S.path || S.mode;`

The card's skyline follows the CHOSEN path, not the browsed one — `S.path`
first, `S.mode` only when no choice exists — because that is what the card's
own mode line has printed since 2.x, and a card whose caption and chart
disagree is a card that lies in a screenshot. The Progress tab's on-page
skyline follows `S.mode` instead, deliberately: browsing is a question, the
card is a statement. From 4.1.0 to 4.2.0 the skyline ignored both and always
drew the universes cut; the mode line was the only honest row on it.

### `rather than trusting a stored answer. Announced dates can move.</p>`

Named titles here went stale every time one landed or another was
announced. The fact is about announced dates, not about which ones. It was
its own `note foot` until 5.2.0, which merged it in on a `buildline` span —
and the span's 1em block gap still read as the same orphaned line, so 5.2.1
finished the job: two sentences, one paragraph, one flow, one diamond over
it. The lesson written down: the complaint was the *gap*, and a span that
reproduces the gap is the old layout wearing new markup.

### `v`

Scroll lived on the document until 3.9.6 — <main> has no overflow, so its
scrollTop is always 0 and every re-render threw the position away. 3.9.7
moves it to #app: the document is clipped and #app is height-locked, the
app's one vertical scroller, so the swipe viewport of the next stage has a
page that holds still under it. The 3.3.x lesson is the same in both worlds:
read the scroller that actually moves, which is what `scrollKeep()` exists
to name.

### `scrollKeep()` / `scrollPut()` / `scroller()`

Three names so the layout-read census (guards section 120) stays a census:
scrollKeep is the one place the position is read, scrollPut the one place it
is written, and every keep, restore, go-to-top and belt retraction goes
through them. The cost of the lock, accepted on purpose: the mobile browser
chrome never collapses, because the document it collapses for never moves —
which also retires #app's `+ 1px`, whose whole job was keeping that chrome
behaviour uniform across tabs.

### `fieldSnap()` / `fieldRestore()`

Every input and textarea with an id in the panel being repainted is recorded
before `fillPanel()` — value, caret, whether it held focus, and its top if
it did — and put back after. `FIELDKEEP` names the boxes whose VALUE lives
only in the DOM (`#restorebox`; `#q`'s value comes from `S.q`). Refocus if
the box HELD focus, not if it merely has text — keying off `S.q` shut the
keyboard when you deleted the last character. A focused box's drift is
corrected after the scroll restore so the caret stays where the eye left it.
Until 4.9.0 `render()` carried one copy of this dance for `#q` and another
for `#restorebox`, and `fillPanel()` a third; a new input needed a fourth.

### `Array.prototype.forEach.call(document.querySelectorAll("…`

aria-current, not aria-selected, which is meaningless on a plain button.
Removed rather than set false: it has no false state and the CSS matches
on presence.

### `maxY` *(historical — there is no explicit clamp any more)*

Clamp: the new view can be shorter than the old one, and restoring past
the end of the document leaves the page parked in empty space. Since the
panels became their own scrollers, `scrollPut()` assigns `scrollTop`
directly and the browser clamps the assignment to the scroller's range
itself; no line in the file computes a `maxY`.

### `calmScroll()`

The CSS kills transitions under prefers-reduced-motion; these scrolls were
never covered by it, so the one setting that says "do not animate" was half
honoured. One caller since 3.3.2 — `goToGroup()`'s was the second and it was
taken back out, for the reason under `target` below.

### `persist();`

groupOpen persists as of 1.3.5; tab, filter, query and mode remain session
state by design. Jumping is a deliberate act, so its collapse sticks.

### `drift`

The head is sticky and scroll anchoring is off — `overflow-anchor:none` is
deliberate, so the app pays its own compensation or the defect is visible.
Here it was visible: closing a long group from deep inside was a collapse
nothing was paying for. The body under
the stuck head disappeared, the panel's scrollTop kept its number, and the
reader landed ~1,300px later in the path with the head they had just clicked
1,200px above the fold — with focus still on it, off-screen. Measured before
and after the class toggle in the click's own task, and the difference handed
to `scrollPut()`: the head stays exactly where it was clicked, which for a
stuck head is the sticky offset and for a short group is no movement at all,
because an unstuck head does not move when its body folds. Opening drifts 0 —
the body grows below the head — so the write never fires. The two reads are
pinned and argued in guards section 120.

### `target`

A collapsed group is still a 56px sticky header, so scrolling to the top
can leave the requested group far below the fold.

Scrolled instantly, on purpose, and not through `calmScroll()`. 3.3.1 asked
for `behavior: calmScroll()`, which resolves to "smooth" for anyone who has
not asked for reduced motion, and a smooth scroll across a
`content-visibility: auto` list races the browser's own rendering: the
animation's offset is computed against a layout in which every off-screen
group is skipped, and the document grows underneath it as it travels.
Measured on live 3.3.1, same element and session — instant landed at 973,
smooth ended at 0, from every way in. `goToGroup()` also calls
`window.scrollTo(0, 0)` and `render()` in the same frame, which is the second
reason. A jump is a navigation, not an animation. Guard 76 fails the build if
a behavior comes back.

### `window.addEventListener("storage", function(e){`

The cross-tab merge. Two tabs — or a tab and the installed app — both write
the whole payload, so without a merge whichever acted last erased the
other's marks. Since 3.8.0 every mark carries the clock of its last change
in `clk` (`applyMarks()` is the one merge primitive; a clock whose mark is
absent is the tombstone), the newer clock wins in either direction, and a
payload with no clocks merges additively. Since 4.9.0 the merged state is
written back (`persist()` when anything moved — the echo merges nothing, so
it cannot loop), because a merge that lived only in memory left two tabs
each holding a union neither had on disk; and a clock at or before an
adopted `resetAt` is stale by definition, so a third tab that never saw the
erase cannot resurrect what it erased. The post-mortems are in
NOTES-history.md ("A removal is a fact").

### `document.getElementById("topBtn").addEventListener("clic…`

The wordmark is the one element on every screen, so it is the natural
"back to the top" — scroll lives on #app as of 3.9.7 (the document before
that), never on <main>.

### `else if(act === "peek"){ S.peek[id] = !S.peek[id]; rende…`

The Then rows peek one line, on request: badges and the continuity name,
never the description — the whole premise is that nothing ahead of you gets
spoiled, and the description is where that risk lives. Activity carries no
badges at all: 1.5.9 added them because it was the one place a logged entry
rendered with none; 1.6.3 took them back out, deliberately, because they do
not fit on one line beside the stars and the row being one line is worth
more. Recorded as a reversal, not drift.

### `else if(act === "jump"){ goToGroup(b.dataset.gk); }`

Activity's reveal. Shares S.open with the Then rows harmlessly: Then holds
only unwatched entries and Activity only watched ones, so no id is ever in
both.

### `routeHash()`

Runs on load and on every hashchange, so a shared #life link works in a
running app, not only on a fresh one.

### `toks.forEach(function(tok){`

The route vocabulary, frozen by guard 72 (a published interface): `#life`,
`#release`, `#universes` and its alias `#path`, `#progress`, `#next`;
combined with a scope token, `-series` or `-movies` (`#life-series`,
`#universes-movies`); and `#nw=<code>`, the restore link. A view hash is
consumed once it has routed (`clearHash()`, 4.9.0), the way `#nw=` always
was: left in the address bar, a reload re-applied it over whatever the
reader had chosen since.

### `if("serviceWorker" in navigator &&`

Registration is guarded: service workers need a secure context and file://
is a supported way to run this. Failure is silent and non-fatal.


---

## Styles

### `@font-face{font-family:"Limelight";src:url("fonts/limeli…`

Self-hosted as of 1.4.2. These came from Google's CDN, which meant every
visit told a third party that someone had loaded the page — an odd thing on
an app that advertises no tracking, and the reason the page could not be
fully offline on a first load. All four are OFL-1.1 and redistribution
requires the licence, which ships as fonts/OFL.txt. Weight 500 was being
downloaded on every visit and used nowhere.

### `--ink:#08090F; --sunk:#0C111C; --card:#141B2C; --card2:#…`

Canon skin: Dark Deco. Single source of truth. Themes are [data-theme]
blocks overriding surfaces only; guards measure the contrast of each.

### `--signal:#FFCF1F; --steel:#7295CC; --crimson:#C43A30; --crimson2:#DD7A73;`

utility-belt yellow · cape blue-grey · animated-sky red, AA-adjusted. `--moss`
(the interactive badge's green) left in 3.8.4 when that badge went crimson.

### `--num`

4.2.0 gives the numbers their own voice. Anton had been doing double duty —
every title AND every big count — so a score never read as a score. The
numerals (the scoreboard tiles, the story card's count, the share image's
three stats) now set in Big Shoulders Display at 700: same Chicago-deco
family the --deco stack has named as Limelight's fallback since the
beginning, so the taste was already on record. One weight ships, subset like
the rest (its OFL carries no Reserved Font Name — Limelight's rule does not
apply), preloaded like the rest, and the stack falls back to the title face
so a failed load degrades to exactly what 4.1.x looked like.

### `:root[data-theme="darker"]{`

The black uniform (4.6.0). Until 4.5.4 this was Dark Deco with the lights
down — the same navy tint on every surface, bone dimmed to a blue-grey —
and the owner's frame on 25 Aug named what was wrong with that: Dark Deco
is the blue-and-grey suit, Darker should be the black one, and the black
suit has no blue in it. So every surface, hairline and grey here is
neutral, and the block overrides `--dust`, `--dim` and `--staroff` for the
first time — a black page inheriting Dark Deco's blue-grey inks was the
tell. Bone is a silver `#C9CCD3`, the cowl's highlight: brighter than the
`#AEB6C8` it replaces (11–13:1 against 8.7–10.3) and still well under Dark
Deco's 12.8–16.4, which is the AMOLED argument kept. Warm bone was drawn
and rejected (it argued with the yellow); full bone was drawn and rejected
(it deleted the reason Darker exists). Signal, steel and crimson are
inherited on purpose: the belt, the cape and the sky are the same in both
suits. Section 20 measures the pairs, 147 the ladder; neither warns.

### `#view`

render() replaces #view wholesale and restores the offset itself.
Chrome is the only one of the three engines with scroll anchoring on
by default, and it tries to compensate for the same change.

### `#nosave`

A blocked store used to fail silently. Signal, not crimson: crimson on
--sunk is 3.59:1 and would fail AA inside the accessibility warning.

### `#tabs button svg`

Fixed box, fixed grid: every icon occupies exactly 20x20 regardless of the
shape inside it, so all four labels and all four icons share one baseline.

### `.themerow`

The only preference. It lived at the bottom of Progress as `.prefrow` until
2.0.0 moved it to the bottom of Home, compact — the owner's call at the Belt
design round, and the Belt was never allowed to hold it. Still no heading,
no card, last row on the first screen.

### `.allbtn`

It sat in --dust on a --line2 pill, directly under a row of chips wearing the
same thing, and read as a seventh filter. The signal colour is what separates
a control that acts on the list from one that filters it.

### `.search`

16px is not a taste — iOS Safari zooms the page on focus for anything under
it, and the viewport deliberately sets no maximum-scale to block that. Every
search on an iPhone began with a zoom the reader had to pinch back out of.

### `.gnum`

Sized for two characters and centred, because the tag is not always two.
By universe zero-pads ("01".."33"); Bruce's life and Release order do not, so
era 10 was the one row in eleven whose title started 6px right of the rest.
Release order has the same latent bug the moment a 2030s bucket fills, and
the catalogue already holds a 2028 title.

### `/* The border is on the base rule, transparent, so a fil…`

Three kinds, three shapes. Tier is the answer to "should I watch this" and
there is always exactly one, so it is the only filled badge. Modifiers are
footnotes — outlined, and no border, so they recede. Format is a different
axis entirely and only appears in All, so it is dimmer still.
Six colours across nine badges used to mean three exact collisions: Core read
as Animated, Optional as Short, Interactive as Live action.

### `.bd`

The border is on the base rule, transparent, so a filled badge occupies the
same box as an outlined one. Without it the filled tiers were 2px shorter:
in a flex row the boxes were forced level and the *labels* sat a pixel apart,
and in the legend — which centres rather than stretches — the boxes
themselves were visibly unequal. Background paints under the border area, so
a filled badge looks exactly as it did.

### `.bd.e`

tier — filled, one per entry

### `/* The dash carries "different axis"; it used to also ca…`

format — a different axis, and only in All

### `.bd.fmanim{color:var(--dim);border:1px dashed currentColor;}`

The dash carries "different axis"; it used to also carry opacity:.8, and that
fade was the one thing here under AA. --dim composited at 80% over --card is
4.21:1 and over --card2 3.91:1, while guard 20 measured --dim itself at 5.28
and passed. Hierarchy comes from palette and shape, not from fading text —
and these render on every row in All, which is the default.

### `.stars`

36x44 target. Width carries the gap so neighbours tile rather than
overlap; height comes from the pseudo-element so rows do not grow.

### `.hero`

One scale for the whole card: 6 / 12 / 18. Before 1.6.2 the gaps ran
17-12-10-15-16 top to bottom — five values with no relationship between any
two, which is what made the contents read as assembled rather than composed.

### `.hero .kick`

The kick used to carry the label, the group number and the group name on one
10px tracked line. Five of the app's continuities pushed it onto two lines,
and it broke mid-field — "DC ANIMATED / MOVIE UNIVERSE" — which is exactly
where the middot separators stop marking anything. It says one thing now.

### `.hero .hcont`

Where the group went. Its own line, so a long continuity name wraps against
nothing but itself.

### `.hero h2`

ONE hero size. Home and Next up render the same title; inline overrides
grew it by 15% on one of them. Change it here, not at the call site.

### `.hero .hbadges`

The badges used to be glued to the end of .yr with a non-breaking space,
which left a hole between "2013" and the first badge that belonged to
neither. They are a row.

### `.activity`

A card again, and small. 1.6.0 stripped the border because Activity was the
only card on the tab and at 622px against Then's 251 it read as the main
event — but the container was never the problem, the size was. One line a
row puts it level with Then, and at that size a border is just a container.
Guard 58 holds the proportion instead of forbidding the box.

### `.arow`

One line, flex, no reveal. 1.6.2 collapsed the row behind a tap and put the
stars behind it too — which hid a control that was in use, and broke the
layout: the tick carried grid-row:1/-1 with no column, so on open the stars
auto-flowed into the first track and shoved every title 104px right. Flex has
no auto-placement to get wrong.

### `/* Ellipsis, not wrap. A wrapped title makes one row tal…`

The rows above this in Next up use --disp. Activity inherited body text, which
is why its titles read as plain web type among styled ones.

### `/* --dim, not --bone. Bone means "press this" and is the…`

Ellipsis, not wrap. A wrapped title makes one row taller than its neighbours,
and the whole point of the row is that every one of them is the same.

### `.arow .at`

--dim, not --bone. Bone means "press this" and is the brightest ink in the
palette; it was on the history while the film you are actually up to rendered
in --dust. The past was drawn brighter than the future. A step down the
palette says "done" without fading anything — dimming the block with opacity
puts five of seven tokens under AA (see guard 61).

### `/* Smaller than the hero's, because five share a line wi…`

No date. Four things do not fit one line on a 320px phone — with five stars
and a date beside them the title was down to 39px, about three characters.
The list is newest first, so position already says when; the stars have no
second way to be shown. The date was the one of the four that repeated
something the layout already told you.

### `.arow .stars`

Smaller than the hero's, because five share a line with a title. The ::before
tap target is untouched, so the thumb still gets its 44px.

### `/* 1 / -1, not 1 / span 3. A hard span of three kept res…`

Everything in this block is watched — that is what puts it here. The tick
inherits .film.done's filled state rather than the empty ring, which read as
"not watched" in a list of things you had just watched.

### `.arow .tick`

1 / -1, not 1 / span 3. A hard span of three kept reserving three grid rows
after 1.6.2 closed the row down to one, so every collapsed row carried two
empty tracks and their gaps — 25px of nothing, per row.

### `.bk.yd` / `.drule.gold`

The Your data card's frame is signal-edged and the seam inside it is the
diamond rule at full signal — not the hero's 40% fade, because inside a
box on a dark card the fade read as nothing. `.bk .drule` pins the ink:
`.bk p` colours every paragraph dust at (0,1,1), which beat `.drule`'s
(0,1,0) in the first mock and greyed the diamond. Design B1 (5.1.0),
chosen over the hero's cut and over moving the card up.

### `.bkbtn.primary` — one bone recipe

The hero's `.go` recipe — 46px, 11px mono at .12em, the 8px cut, no
border — on every bone button, so *Share the night* and *Create backup
code* stop being the square exception. Guard 157 holds the two polygons
byte-equal; a second copy of a cut is a second thing to drift.

### `.hero .hnote`

The bag line, mono, tracked, dust — the same register as the meta line,
sitting under the rule and above the controls because it is about the
night, not the film.

### `.film.parked .tick`

A dashed ring, not a button. A solid ring reads as a tick waiting to
happen; a dashed one reads as a seat that is not open yet.

### `.herorow`

One grid with the buttons below it: stars over Mark watched, the watch link
over Skip. The stars used to sit 6px outside the padding edge for optical
alignment, which put them off the button they belong to.

### `.herorow .linkrow`

At 10px with .1em tracking, "Where to watch" needs about 112px and the 38%
column gives 96px, so it wrapped to two lines and left the stars floating in
the dead space beside it. **The 9px label stays for that reason** — even at the
full column width the inner box measures 96.7px, so putting it back to 10px
brings the wrap back.

**Two corrections, 3.1.0, and both of the sentences that used to be here were
wrong.**

**It is not a secondary control.** This note ended *"the link is a secondary
control and does not have to match Skip's weight, only its edges"*, and the
1.4.x CHANGELOG entry said the same thing. That was a wrapping bug fixed by
shrinking a label, with *"it is secondary anyway"* written down afterwards as
the reason — a layout constraint promoted to a rule of the design. The README's
feature list leads with *"Where to watch, without picking a side"* and
`introBlock()` tells every first-time reader *"Tap anything for what it is and
where to watch it."* A control the README sells and the intro promises is not
secondary. It has a fill and an edge of its own now and its label is `--bone`:
5.08:1 became 10.28:1, bought entirely with colour and not one extra pixel of
width.

**And it never shared Skip's edges.** Measured at 375px in a real browser, and
identical in shipped 3.0.3 and in the fix: the hero pill stopped **8.0px short**
of Skip's right edge — content-sized at 108.7px inside a 116.7px column — stood
**38px against Skip's 46**, cornered at **8px against 11**, and in an expanded
row sat **171.7px right** of the description, the tick indent and both buttons.
The left edge in the hero was 0.0px, which is how this survived eleven releases:
the one edge anybody would check was right, and a faint outline stopping 8px
early against a faint outline is not something an eye finds. Fill it and both
edges are read at once. The fill did not cause any of this — it stopped hiding
it.

Section 119 asserts all of it from the two rules that have to agree rather than
from a remembered pair of numbers, because a comment asserting a relationship is
exactly how this one stayed false for eleven releases. **A decision worth keeping
becomes a guard, not a document** — and this paragraph is the example.

### `@media (max-width:360px){`

Below this the column cannot hold the label at any readable size, so the two
rows stack rather than overflow.

### `.srow`

Buttons, not divs. The donut slices they mirrored were pointer-only — no
tabindex, no role, no key handler — and the universe rows at least had a
keyboard route through Home's grid. The era rows had none at all. 3.8.2
retired the complaint at its source: the skyline's bars are real buttons on
the same data-act="jump" path, so the chart itself is finally keyboard-
reachable — but these rows stay the readable route, since a 3px bar takes
focus honestly and still cannot be read.

### `.legend > span`

The swatches are real badges, so the row has to align them against the note
beside them rather than sit them on a text baseline.

### `.note.foot`

4.2.2 makes the footer one system. Until then each tab had grown its own:
Home centered with no line, Next up centered with no line, The Path's legend
left-aligned with the only separator on the site, and Progress left-aligned
at 12.5px two steps from its own centered build line. Now every tab's footer
carries the legend's hairline (`border-top` + 18px) and centers — the legend
included — and consecutive foot-notes suppress the line so a stack of truths
reads as one footer, not a pile of rules. The saves-line went entirely: it
restated the Your Data card's first sentence, and its no-save variant was
already the header's #nosave banner. Two copies of one fact drift.

### `.ugrid`

minmax(0,1fr), not 1fr. A bare 1fr is minmax(auto,1fr), and that auto floor
is the column's min-content width — so "Tomorrowverse", thirteen characters
with nowhere to break, pinned its column at 169px and starved the other. At
320px that pushed the page to 331px wide and the right column off the screen.
Row heights are deliberately left to their content.

### `/* A deck, not a list. Seven surfaces in this app share …`

One control language at two sizes. The chooser blocks are the same three
options as the segmented row, large because it is the only decision on the
screen, small once it has been made.

### `.deck`

A deck, not a list. Seven surfaces in this app share one formula — border,
card fill, rounded corner — and three more flat panels made the one screen
that asks a question look like another list. These overlap instead, each
sitting on the one below, so they read as cards to choose between. Nothing
else in the app overlaps.

### `/* Filled, not outlined. A signal border did not read as…`

Signal marks the recommendation. It is not a press state, and it is not on
all three — it means "this one" or it means nothing.

### `.pick.big.lead`

Filled, not outlined. A signal border did not read as "this one" — it read
as another card with a slightly different edge.

### `/* Shorter than the path row, not smaller. Squeezing for…`

Format and scope answer the same question at two depths, so they sit in one
block. The path control above answers a different one.

### `.includes`

Three pouches since 4.8.0 — format, scope, tier — each one step further
in: 0, 11px, 22px, painted in that order (`z-index` 2, 1, 0), with the
middle one given its own stagger (.05s out, .04s back) and the third its
own closing travel (`--out:-305%`) so the stair tucks first / middle /
last. Shorter than the path row, not smaller. Squeezing format and scope onto one
line by shrinking the type broke both labels across two lines instead — the
type size was doing work the palette does better. Height and type size are
separable: the block gives back 8px of height at the same 9px type, so
"Live action" and "Movies + Series" still fit on one line and the path row
still reads as the question asked first. Since 4.6.0 the pouches wear the
belt's colour on their edges and letters and keep their ink fill; the
chosen pouch inverted to signal-on-ink in 4.6.0 and dimmed in 4.7.0 —
`--signaldim` `#B8941A`, ink letters — so the belt stays the brightest
yellow on the page. A 1px hairline was built first and rolled back the
same day: it could not be noticed on the phone. See "The belt is yellow"
and "The cover" below.

### `#splash`

The crawlable seed's first-frame cover (4.7.0). Fixed, `--ink`, the
header's bat in `--signal`, first in `<body>` and outside `#app`, taken
down by `splashOff()` one frame after the first render. Three failure
exits since 4.9.0, because a cover with one door is a permanent bat the
moment anything throws before it: `splashOff()` runs in a `finally` around
the boot render; a `window` error listener registered as the first
statement of the script drops it on any uncaught throw; and a CSS
`splashfail` animation fades it after five seconds whether or not a single
line of script ran — the only door that works when a whitespace-reflowing
proxy breaks the CSP hash and the browser refuses the script. Why it is a
cover and not a splash screen is in NOTES-history.md ("The cover");
section 151 holds the shape.

### `OUTWHY`

The five reasons an entry sits outside any timeline, keyed as the raw
entries' `out:` values (guard 70 holds the two key sets equal): `who` —
another Bruce; `many` — more than one Batman on screen; `none` — no Batman
in it; `flat` — a Batman whose story never says where in a life it sits
(the two LEGO Movies); `tbd` — a real continuity whose place is not decided
yet. Since 4.9.0 `out` rides `FILMS` and `metaOf()` prints the reason on
every era-0 row in Bruce's life, so the README's "with the reason given" is
true per row and not only in the era note.

### `::selection{background:var(--signal);color:var(--ink);}`

Canon skin: Dark Deco. ADDITIVE only — restating a token here leaves its
real value 180 lines from its declaration.

### `main,.panel{scrollbar-gutter:stable both-edges;}`

Reserves the scrollbar width even with nothing to scroll. Without it Next
up, the one view that fits a desktop screen, slides the centred column
7.5px sideways. Overlay scrollbars have no gutter, so mobile is unaffected.

### `#ringTrack`

Reads the same tokens as every other track (.gbar / .ubar / .tbar / .segs).

---

### `lo` — where an entry sits in a life

The eras say which stage; `lo` says where inside it. Without it an era rendered
in the order its continuities happened to be typed into `PATH`, which is not a
chronology — and with 62 entries in one era it read as noise.

The whole point is that continuities **blend**. *Year One*, *Batman Begins* and
*Gotham Knight* are three continuities and three consecutive rows, because that
is the order those nights happen. That is what separates this path from By
universe, which keeps each continuity intact, and from Release order, which is
the only one of the three that is not chronological.

Positions are per era and run 1..n. Guard 68 rejects a half-positioned era,
because an entry with no `lo` falls to the end of its era in typing order and
nothing would say so.

**Era 0 carries no positions, deliberately.** It is the entries with no place in
a life; giving them one would invent the thing the era exists to be honest about.
1.7.0 sorted era 0 by release year and that was worse than doing nothing — it
scattered the ten-film LEGO line across 31 slots. Era 0 falls back to continuity
order, which at least keeps a set together.

### Ordering by year is not ordering by story

Three times now a year sort has looked like a chronology and not been one:

- **Era 0**, above.
- **Pennyworth and Gotham.** Pennyworth releases in 2019 and is set decades
  before Gotham, which releases in 2014. Sorting era 1 by year gets it backwards.
- **The Tomorrowverse.** *The Long Halloween* is Batman's second year and came out
  after four films set later.

`y:` is a release date. It belongs to the Release path and nowhere else.

### A group's order and a group's eras are different axes

Guard 51 requires a continuity's eras to advance and never go back. That is right
for one arc following one character, and wrong for two other shapes, both of
which exist here:

- A **bag** — films sharing a shelf, not a world. No arc, so no direction. Six
  groups carry `bag:1` and say so in their own notes.
- A **weave** — several arcs interleaved on purpose. The DCAU's by-universe order
  is a watch order across five shows and its note prescribes it; the era is a
  position in one life. Forcing them to agree would make the note lie. Three are
  named in the guard, each with its reason.

The failure this prevents is not hypothetical: 1.7.0 wrote the rule and scoped it
to a single continuity, and five others were running backwards at the time.

### Format belongs to the group until an entry disagrees

`fmt` is a group property because continuities are almost always one medium. The
DCU is not: Creature Commandos is animated and Clayface is live action. Until
1.7.1 that meant Clayface rendered an ANIMATED badge and disappeared under the
Live action filter — a theatrical film invisible to the reader looking for
theatrical films.

An entry may now override its group. The guard rejects an override that restates
the group's own value, so the exception stays rare enough to notice.

### An era may say who is in it, never what happens to them

*The Grayson years* and *The Damian years* name a person. *Losing Jason* named an
event, and it sat as a header above a list of films a reader had not watched yet.
*Broken and rebuilt* did the same in its note — "Bane, the back, and the
replacement who did not know when to stop" spoils two continuities in one line.

The rule that came out of it: an era may describe the situation it opens in,
never the turn that gets you there. *Beyond* — "an old man in a chair, and a kid
in a new suit" — is the pitch on the box and stays.

### An era is a stage, not a cast list

*Rebuilding* used to read "Tim and Barbara around", which is a roster. Batwheels
has **Duke Thomas as Robin and Cassandra Cain as Batgirl** — Dick grown to
Nightwing, a later Robin in the car, a Batgirl who is not Barbara. That is
Rebuilding's shape exactly and it matched none of Rebuilding's names.

Two eras were written as people and nine as configurations. Both were rewritten
as stages, with the familiar names demoted to examples. Any future family that is
not Dick, Jason, Tim or Damian now has somewhere to go.

### Outside any timeline is a place, not a verdict on quality

It held a quarter of the catalogue before 1.7.2 because it had quietly become
where things went when nobody wanted to judge them. Three quarters of it turned
out to be placeable: *The LEGO Batman Movie* adopts Dick Grayson and makes him
Robin on screen; *Gotham City Breakout* has Damian as Robin with Nightwing and
Batgirl both working.

**Tone is not a reason.** The five that are:

| `out:` | means |
|---|---|
| `who` | the Batman is not Bruce — Kirk Langstrom, Yohualli Coatl, an unnamed Soviet dissident |
| `many` | more than one Batman on screen |
| `none` | no Batman in the film at all |
| `flat` | a Batman, but the story asserts no state anywhere |
| `tbd` | a real continuity whose place is not decided yet |

`tbd` is the DCU, whose Batman is uncast. Guard 70 requires every era-0 entry to
carry one, because an undifferentiated bucket is what let the tone-filings hide.

**The table gives the reason. It is not the test.** Read literally, `none` would
put *Joker: Folie à Deux* (era 1), *Birds of Prey* (era 7) and *Kite Man: Hell
Yeah!* (era 8) outside, and all three are placed on purpose — none of them has a
Batman in it. The rule actually run is narrower: **an entry follows its
continuity, and `out:` applies when the entry has no place *and* its continuity
cannot lend it one.** That is why *Teen Titans: Trouble in Tokyo* left era 0 in
1.7.1 — it is the finale of a series already in era 3 — and it is the test the
Harley Quinn Valentine's special failed on both counts: there is a Bruce on
screen, and its continuity is placed. Guard 70's own comment carries this too.
Leaving it unwritten is what an outside audit walks into.

### The universes run in the order their stories start

By universe had no stated ordering principle until 1.7.2, so every continuity
added landed wherever it was typed. Gotham — five seasons of Bruce before the
cowl — rendered 37th of 42, and the first Batman ever filmed rendered 35th, while
a continuity beginning in the League years rendered 5th.

A universe now sits where its story starts. **Within a band the curated order
stands**, which is why the DC Animated Universe still leads the universes that
begin in the early years: among universes starting in the same place, the best
one goes first. Guard 69 does not force a total order — only that the list never
goes backwards.

The number on each universe is that era. It used to be the universe's position in
the list, which told a reader nothing they could not already see and renumbered
every time the catalogue grew.

### Era 0 is the absence of a position, not a late one

The era-direction guard compares by render order, and era 0 renders last — so a
continuity running era 3 → era 0 → era 3 looked like it had aged backwards. It
had not; it has one entry that does not sit anywhere. The check skips them.

The LEGO Movieverse is the case: two films that assert no state at all, with *The
LEGO Batman Movie* between them.

### The number on a universe is the era it starts in

Home used to print a universe's position in the catalogue — 01 to 44 — while
The Path printed the era its story starts in, so the same universe wore two
different numbers on two screens and this file asserted the number "is" the era.
Home follows The Path from 1.7.5. Positions are still what the life and release
views number, because there the number *is* a position.

`eraTag()` reads the group's whole film list rather than the filtered one, so a
universe can be chipped with an era belonging to an entry hidden under the
current scope. That is deliberate: the chip describes the universe, not the
selection, and a chip that moved when you switched to Movies would be describing
the switch instead.

### Scope is a view and a preference, like the path

`S.path` is what you chose and `S.mode` is what you are looking at; a deep link
moves the view and never the choice. Scope had only one variable until 1.7.5, so
`#universes-series` set it transiently and the next `persist()` — from ticking
anything at all — wrote it as if you had chosen it. `S.scopePref` is the saved
half now. `persist()` writes the preference; everything that renders reads the
view.

### A slug can be retired, and only in a file that says why

Frozen IDs are frozen because a rename voids saved progress. Removal is the same
act, and it happened for the first time in 1.7.5: *Scooby-Doo! and Krypto, Too!*
had no Batman, no Gotham and no continuity that needed it. `--bless` must not be
able to launder that into the snapshot, so a slug only leaves `frozen-ids.json`
by being written into `qa/retired-ids.json` with a reason, which is a diff a
reviewer sees. A retired slug can never come back either — somebody's saved
progress may still hold the old meaning of it.

The mistyped slug `the-super-powers-team-galactic-guardians-198-1985` stays as it
is. It dropped the "5" from 1985 and every sibling is `title-YYYY-YYYY`. It is
format-valid, so nothing fails; the URL migration is the only amnesty window
there will ever be, and the decision taken in 1.7.5 is to spend it on nothing.
The contract is worth what it is because it has never been broken for
convenience.

> **Amended 1.8.1, and this paragraph carried no marker for eleven releases.**
> That slug WAS renamed, once, inside the window described above — the full
> reasoning is under *The frozen-slug rule has exactly one exception* further
> down this file, and `qa/renamed-ids.json` carries it in the tree. The
> paragraph above is kept because the decision it records is the durable one:
> the window was spent on exactly one slug and is now closed. Read together
> they say what happened. Read alone, the older one is wrong.
> *(Marker added in 3.0.0.)*

### Two entries span more eras than one row can hold

*Static Shock* is entered as seasons 1–4 and crosses into Batman's world three
times across them; *Titans* is entered as a complete series and runs through
eras 3, 4 and 7. Both would be more accurate split by season, and splitting
either costs `i:` slugs — which is the one thing this project does not spend.
They carry the era their story starts in. This is a known limit of
season-granularity, not an oversight.

### Display titles are shortened on purpose

The Crisis trilogy drops "Justice League:", *The Doom That Came to Gotham* drops
"Batman:", and *The Batman: Part II* is punctuated here although the official
title is not. Screen titles are set for the width of a row and the reader's
recognition, not for the copyright card. The `i:` slug always carries the full
form, so search still finds them.

`harley-quinn-season-5-2024` carries `y:2025`. The slug froze an announced date
that moved; the year is the one that shipped. It is the only such mismatch in
the file and it stays, because the slug is frozen and the year is true.

### A backup code carries what this build knows

`exportCode()` walks `FILMS`, so a slug merged in from a newer build's JSON
survives in storage and in a JSON export but not in a code. The restore toast
says entries are kept, and for JSON that is exactly true. Changing it means
hashing the keys of `S.watched` instead of the catalogue, which is a code-format
change, and the format does not move before the URL migration. Documented rather
than fixed, deliberately.

### Two rationales that would not fit in the file they belong to

index.html carries at most two script comments — guard 65 counts them — so
these live here.

A restore link that carries nothing gets no banner. `routeHash()` used to raise
the pending-restore banner for any code that parsed, including an empty one,
which offered to restore "0 entries". A path on its own still counts as
something, so the test is entries, unknown slugs, or a path.

The group headers stick to a number written for the header at its normal height.
When saving is blocked the header grows by a line and the stuck headings slid
underneath it by exactly that much, for exactly the users already having the
worst time. `flagSave()` measures the header and sets `--ghtop` when the banner
is up.

### Era 7 is not being split

It holds far more entries than any other era, and the question comes back
every review. The answer is no. Positions order it correctly, the eras are life
stages rather than buckets sized for a screen, and a twelfth era buys scrolling
comfort at the cost of the scheme meaning something. Recorded so it stops being
re-opened.

### A note is part of an era, and spoils what the name would

*An era may say who is in it, never what happens to them* was written for era
names and applied only to them. Era 11's note read "three cities, three ways of
losing him", which does the exact thing the rule forbids while the name above it
obeys. The rule covers notes from 1.7.5.

### scopeNote() was removed rather than fixed

It produced the line under the scope switch — "N films. Switch on the series to
add M seasons." — and it had one caller, in the branch of `scopeSwitch()` that
stopped running when the switches moved into the chooser. Guards section 53
tested it and found a real bug in it (it ignored the format filter, so it would
have claimed 57 seasons with Live action selected) which nobody could see,
because nobody could reach the function. Both are gone. If the note is wanted
back it is a deliberate re-siting, not a revert.

### Home has no opinions of its own

`viewHome()` drew the universes whatever path was chosen, from its own
`PATH.forEach`, and `goToGroup()` forced `S.mode` to match the key it was
handed. Together that meant tapping a card on your own home screen moved you
into an ordering you had not asked for and raised the borrowed-view banner.

Home calls `buildGroups()` now — the same function The Path uses, already cached
on mode, scope and format — so the grid is the eras, the universes or the
decades depending on where you are, and the card number is whatever that
grouping already computed. `goToGroup()` keeps its mode line, because Progress
genuinely needs it: tapping an era slice while your path is By universe has to
switch the view. From Home it is a no-op, which is the whole fix. It also gained
a branch for decade keys, which had always fallen through to By universe and had
only never fired because Home could not emit one.

Guards section 76 exists because nothing said the two screens had to agree.

### A rating costs one character, not a second copy of the hash

The NW2 backup code wrote every rated entry's five-character hash twice: once in
`W`, once again in `R` with a digit glued on. With everything watched and rated
that was 1,201 characters of the 2,208 total, and the link was 2,254 against a
working ceiling near 2,000.

NW3 makes `R` positional against `W`: one character per watched entry, `0` for
unrated, trailing zeros trimmed so a code with no ratings pays nothing. Worst
case is 1,209.

Two things had to be true for that to work, and only one of them was:

- A rating implies a watch. `rate()` marks watched, so almost always yes — but
  `unmarkWatched()` clears the tick and leaves the star, so a rating can outlive
  its watch. Rather than make unticking destroy a rating, orphans get their own
  `O` segment in the old hash-plus-digit form. It is empty for essentially
  everyone.
- The `R` segment means one thing. It now means two, depending on the version in
  the header, so `importCode()` branches on it. Guards section 8 checks a
  hand-built NW2 code restores its ratings, which it never did before: it only
  ever compared watched entries, so the two meanings could have diverged
  silently.

### A code carries your progress, not the catalogue

`exportCode()` walked `FILMS`, so a slug merged in from a newer build's JSON
survived in storage and in a JSON export and vanished from a code — while the
restore toast said entries were kept. It walks `S.watched` and `S.skipped` now,
catalogue order first so the positional ratings stay deterministic, then
anything else. The importing build still cannot resolve a hash it does not know,
which is the point: an older build can now hand its progress to a newer one that
does.


### Two origins, on purpose, forever

**Amended 2.5.1 — the offer is retired; the arrangement is not.** Stage 0 of
2.5.1 measured what this section assumed: 100 visits on the apex and none on
the beta address, over the whole life of the analytics beacon. The move offer
came out. Both addresses still serve, the canonical link on both still points
at the apex, and `offCanonical()` still exists — it just does one job now
instead of two: it marks the mirror `noindex`. The reasoning below is kept
because it is why the beta address is still *serving* rather than redirecting,
and that part has not changed.

> **Amended 6 Aug 2026 — the mirror is gone.** GitHub Pages was unpublished on
> the owner's decision that `nightwatcher.life` is the only address. What follows
> is therefore history rather than description: no second origin serves, and
> `offCanonical()` has no remaining job. **It is still in the tree on purpose** —
> every line that would let the mirror come back stays until the retirement has
> soaked, and removing it is planned as its own PATCH after 19 Sep. The reasoning
> below is kept because it is why a Pages custom domain was never allowed, which
> is still what guard 82 enforces.
>
> **Amended again in 3.3.1 — removed.** The PATCH came early: `offCanonical()`
> left the tree in 3.3.1, guard 77 inverted to fail if it returns, and
> `wrangler.jsonc` says the same. Nothing below describes the shipped app.

`nightwatcher.life` is canonical and served by Cloudflare Workers. The old
GitHub Pages address serves the same tree and is never given a custom domain.

That is not tidiness, it is the only arrangement that works. Configuring a
custom domain on GitHub Pages writes a `CNAME` file and turns the old address
into a 301 to the new one, and it cannot be switched off — delete the `CNAME`
and the custom domain stops working. A redirect runs no JavaScript. Progress
lives in `localStorage`, which is per-origin, so JavaScript on that origin is
the only thing that can ever read it. The moment Pages starts redirecting,
every reader who has not already moved is permanently separated from data that
is still sitting on their own disk.

So both addresses serve, the canonical link on both points at the apex, and the
app knows which one it is running on.

### The offer is conditioned on where it is, not on when it is

**Amended 2.5.1 — retired.** There is no banner to condition. `offCanonical()`
survives for the `noindex` injection alone, and guards section 77 inverted: it
used to prove the offer was there and now fails if any part of it comes back.
The reasoning below is the record of why it was built the way it was, which is
worth more than a deleted section. *(And since 3.3.1 `offCanonical()` itself
is gone — see the amendment above.)*

`offCanonical()` compares `location.origin + location.pathname` against `SITE`.
It could have been a date — show the banner until the end of the year — and
that would have been simpler and wrong, because the person it is written for is
precisely the one who comes back long after anybody stopped thinking about the
move.

The link is built from `SITE` and not from `restoreLink()`. `restoreLink()`
uses `location.origin` deliberately, so on the old address it would produce a
link back to the address the reader is trying to leave: correct-looking, and
useless. Guards section 77 checks that specifically, because it is the mistake
that would not look like one.

The banner renders above every tab rather than inside Home, because a shared
`#life` link lands on The Path.

### Analytics counts one hostname

> **Amended 3.2.0 — the beacon is gone.** There is no analytics script in the
> page any more; the host counts visits at the edge. What follows is history.

Cloudflare Web Analytics is per-hostname and the free plan takes one hostname
per site, so the token in the page is registered to `nightwatcher.life`. Visits
to the old address are not counted. That is the right way round: it is a
waiting room, not a destination, and a beacon that gets dropped costs a request
and tells nobody anything.


### The frozen-slug rule has exactly one exception

`the-super-powers-team-galactic-guardians-198-1985` was renamed in 1.8.1. This
is not precedent and it is worth being blunt about why, because the next person
to find an ugly slug will point at this entry.

A slug is the key progress is stored under and the string every backup code
hashes. Renaming one voids whatever was ticked against it and breaks that entry
in every code already written. That is the whole reason the rule exists, and
nothing about the rule has softened.

What made this one possible was timing, not merit. The app was not publicly
launched; the population with saved progress was the owner and a handful of
soakers, and the cost of the break was one tick each. That was true for a few
hours and is not true now. `qa/renamed-ids.json` carries the reason, and guards
section 2 fails if the old name reappears in the data or the new one is missing.

The alternative was an alias map — keep the old slug in the file forever,
rewrite the storage key on restore and the hash on import, lose nothing. It was
rejected because it costs roughly 400 bytes and a permanent guard to correct a
string that appears in no URL and no part of the interface. Paying forever to
fix something invisible is the wrong trade; paying once, before anybody was
watching, was not.

### The crawlable block is generated, not written

A list of eleven eras, forty-four continuities and the seventy-four curated
titles is exactly the kind of thing that goes stale in one release and is never
noticed, because the only people who read it are crawlers. Guards section 78
rebuilds it from the data on every run and compares byte for byte; `npm run
bless` writes it. The title list makes the same cut the app's tier filter makes,
through the extracted `tierOf()` — never a copy of it.

It lived in `<noscript>` above the empty `<main>` until 1.8.6, and both SEO
analyzers skipped that element entirely, because `noscript` is a fallback most
parsers treat as inactive — the block reached nobody it was written for. It is
the initial content of `<main id="view">` now: the app's first render replaces
it wholesale, so there is no removal code and nothing is hidden from anyone,
and a reader without JavaScript simply gets the page. The position check
inverted with the move — the block must sit inside `#view`, because a copy
anywhere else stays on the page underneath the app.

Its links are the page's only anchors, and guards section 90 ties every one of
them to section 72's frozen route vocabulary — the seed is the one part of the
page a non-rendering crawler reads, so a dead link there is dead precisely
where nobody watches.

### Two signals, because one of them is a request

The canonical link points every origin at the apex. That is the mechanism search
engines use to consolidate, and it is the primary signal.

The injected `noindex` is the second, and it exists because GitHub Pages cannot
send a header and has to keep serving.

> **Amended 6 Aug 2026.** GitHub Pages was unpublished, so nothing is served from
> a second origin and the injected `noindex` marks nothing. The canonical link is
> unchanged and remains the primary signal.
 It says `follow` as well, so the links
out of that page — the canonical one among them — still count. It is injected
rather than static: a static robots meta in the markup would apply to the
canonical origin too and take the whole site out of search, which section 78
also checks for.

`workers.dev` needed neither. It was turned off, and nothing that does not exist
competes with anything.


### A clamp that is allowed to flex is not a clamp

`.udesc` is a `-webkit-box` with `-webkit-line-clamp:2`. It also had `flex:1`,
because every other child of the card did, and the clamp silently stopped
clamping: the box stretched to whatever the flex line gave it and rendered three
lines with an ellipsis in the middle of the second. It looked like a truncation
bug in the text, and the text was fine.

Nothing flexes in a card now. `.ubar` takes `margin-top:auto` instead, which
pins the bar and the count to the bottom whatever the description does. Guards
section 76 fails if `flex` comes back on `.udesc`, because the symptom points at
the wrong file.

### A card description is the note, shortened, not a second string

`cardBlurb()` takes the first sentence of the group's own note and caps it. The
alternative was a `blurb:` field per group, which is 55 more strings to keep
true and 55 more chances for a card to say something the page below it
contradicts. Section 24's rule — one string per ordering, not two — is the same
rule one level down.

The one thing it has to strip is the bag suffix. *"Nine LEGO films sharing a
style rather than a story — no order between these; start anywhere"* is one
sentence, and the half after the dash is about ordering rather than about what
the shelf is. Worth knowing that the guard for this first checked for the whole
phrase and missed, because the cap truncates it to *"— no order…"*: the leak
survives in fewer characters than the check was looking for.

### A cut code and a short code look identical

A backup code chopped by a message length limit still matches the format, still
parses, and restores a fraction of itself without complaint. That is the failure
the restore-link ceiling exists to prevent, and it was the one thing a restore
could not report.

Chunk arithmetic alone does not find it: `W` is five characters an entry, so a
cut that happens to land on a boundary leaves a valid-looking segment. The surer
signal is that `exportCode()` always writes `S`, `R` and `O`, so a cut anywhere
inside `W` takes all three letters with it. Both checks together caught every
truncation that lost an entry across the code's whole length; the modulo alone
missed fourteen of them.

What the import tolerates on purpose, and silently: a trailing partial
`W`/`S`/`R` chunk and junk characters inside the ratings segment are ignored
rather than reported. That is a decision, not an accident — a pasted code
should restore everything it verifiably carries instead of refusing over
residue — but it was never written down until this paragraph, and an
undocumented
tolerance reads like a bug to the next person who traces it. It is this
paragraph now, and writing it retired the last open line of the pre-1.8.0
backlog.

Guards section 8 sweeps the whole code rather than its tail. The first version
of that sweep only tried the last seventy characters — which is ratings and the
path, where losing everything loses no entries — and passed against a build with
the reporting removed.


## Known blind spots

### The dead-rule sweep sees selectors, not declarations

`qa/smoke.js` fails the build if a CSS rule never matches anything in any state.
It cannot see a dead *declaration* inside a rule that does match. The first
example: `.arow .tick` kept `grid-row:1 / -1` for two releases after `.arow`
became flex in 1.6.3, and the sweep was happy because the selector still matched.

Nothing checks this. A declaration that stops applying is found by reading.

### Positional group numbers are assigned after the empty ones are dropped

`buildGroups()` builds every era or decade, then drops the ones with no visible
films, then numbers what is left. The numbering used to happen first, which was
invisible for as long as every bucket had something in it.

1.7.0 added a fifties decade holding nothing — Columbia stopped in 1949 and
television did not arrive until 1966, so there is genuinely no Batman between
them — and the release view read 1, 3, 4, 5. The bucket stays, because without
it a 1950s entry would pass the range check in guards section 5 and then render
in no decade at all. `qa/smoke.js` checks both positional views number 1..n.

Era 0 keeps its em dash rather than a number. It is not a position in a life.

### A blind spot can be a paragraph that stopped being true

This entry used to say era 0 was sorted by year. It was, in 1.7.0, and 1.7.2
reverted it — the year sort scattered the LEGO line across 31 slots, which is
recorded above under *Ordering by year is not ordering by story*. The paragraph
survived the revert and sat here for two releases contradicting the section that
described the shipping behaviour, and it also called era 0 the largest era in the
catalogue when it holds 16 against era 7's 48.

Nothing catches this. Guard 65 keeps the *pointer* to NOTES.md honest, guard 66
keeps the section *count* honest, and section 14 now checks the README's era
names — but prose that describes behaviour can say anything at all. It is
review-only, and this entry is the standing reminder that it is: when a release
reverts something, the revert is not finished until this file stops describing
the thing that was reverted.

### An era is a life stage, not a label for a box set

Guards section 51 required the Nolan trilogy to sit in one era, on the rule that
"a continuous arc gets one era". No other continuity in the catalogue follows
that: *The Batman* (2004) spans three eras and the DCAU spans five, because a
long story moves its Bruce through them. *Rises* opens eight years later with
him off the roof, which is the era now called *Broken and rebuilt* — era 5 under
the eleven-era scheme, and named for the stage rather than for what happens in
it. The era it was written against was numbered 6 and named for the villain and
the injury; both were replaced in 1.7.2 under the rule that an era may say who
is in it and never what happens to them.

What is worth protecting is direction, not sameness: an arc may advance through
eras and may not go back. The guard says that now.

It also identified the trilogy by group number, which moved in 1.7.0 when two
animated continuities were inserted ahead of it — and a check looking for group
"29" found zero films and reported the wrong thing. Groups are identified by name
in that guard now. Group numbers are display, not identity; only `i:` is
identity.

### A policy is only as wide as the syntax it was written against

Guard 65 enforced "no explanatory comments in `index.html`" by counting `/* */`.
Four HTML comments sat in the head the whole time, invisible to it — the policy
said one thing, the guard checked another, and the file did a third. Fixed in
1.6.6 by counting `<!-- -->` too, against an allowlist that names each survivor.

The general shape is worth keeping in mind when a rule is written: a check that
matches one spelling of a thing is a check that will be right until somebody
uses the other spelling, and it will keep passing when they do.

### A `var` in a bare block is visible from anywhere below it

`qa/guards.js` section 55 read `ab` — `activityBlock`'s source — from a `var`
declared inside a bare `{ }` block in section 34, roughly 780 lines above.
`var` is not block-scoped, so it worked. Scoping or deleting section 34's block
would have crashed section 55 with a `ReferenceError` rather than failing a
guard, and a crashing suite says nothing about the app.

Each section extracts what it needs now. Extraction is a regex over a 122 KB
string; doing it twice costs nothing worth this kind of coupling.

### Cross-tab merging only ever added

**SUPERSEDED 15 AUG 2026, AND BOTH HALVES HAD BEEN FIXED FOR SOME TIME BEFORE
ANYONE NOTICED THIS STILL SAID OTHERWISE.** The entry is kept rather than
deleted, because the reasoning is still why the code has the shape it has — but
what follows was being read as current long after it stopped being true.

The `storage` listener merged another tab's marks in and never took any out.
Untick a film in one tab and the other — which still had it — wrote it back on
its next save. That was deliberate: losing a tick is a worse failure than an
unexpected one reappearing, and there was no timestamp on a mark to reconcile
with. This entry then said, in as many words, that if it ever became a real
complaint the fix was a per-mark timestamp rather than a smarter merge.

**3.8.0 shipped exactly that.** Every removal is stamped — `clk` in the payload,
`S.clk` in state — and the merge is last-writer-wins where a clock exists and
additive where none does, so an untick survives the other tab while a backup
written before clocks existed still merges the old way. Guard 134 pins it.

**3.7.2 had already closed the other half.** "Clear all progress" was silently
false with a second tab open: the reset wrote an empty payload, the stale tab
still held everything in memory, and its next write put all of it back.
`resetAt` fixed it — and the account of that fix is at the top of THIS FILE,
which is where the real failure was. One document described the fix in one
passage and the bug as current in another, and the two never met.

**What survives from the original entry** is the third consequence, which is
unchanged: writes are whole-payload last-writer-wins, so a tab that merges a
foreign tick into memory and is never touched again leaves that tick out of
storage, because the flush is a no-op with no pending timer. That one follows
from the anti-loss bias and is not a defect in the merge.

**Why it sat: the standing blind spot recorded above.** The count guard excludes
NOTES.md and CHANGELOG.md on purpose — both are records, and a history that
updates itself is not a history. That is right, and it is also exactly why
nothing in the build can notice when a *claim* in here stops being true. The
only control is somebody reading it, which is the control that failed.

### A restore link is held, not applied

`#nw=` parks its payload in `S.pending` and waits for an answer. The hash stays
in the URL until the banner is answered, so a reload re-parses it rather than
losing it — that was the 1.6.5 fix. `S.pending` itself is session-only by
design: an unanswered question should not outlive the tab.

### `wrangler` stays a dev dependency

It is the large majority of a 130-package lockfile and CI installs it on every
push, while the tests need only jsdom. It stays because `wrangler.jsonc` is
guarded — section 13 checks its assets directory against `docs/` and rejects SPA
fallback, both of which are real rules about how this site is served.

> **Amended in 3.0.0.** This read *"the Workers path is a live option for the
> domain migration"* and *"if the migration lands on GitHub Pages alone…"* long
> after it landed. **`nightwatcher.life` has been served by Cloudflare Workers
> since 2.1.0**; the serving question is answered, GitHub Pages is a mirror
> rather than a candidate, and the conditional that would have dropped
> `wrangler` can never be met. It is a build dependency of the live site now,
> which is a better reason to keep it than the one this section used to give.
>
> **And amended again 6 Aug 2026:** the mirror was unpublished. `wrangler` is
> still a build dependency of the live site — and the deployments API confirms it
> is the *only* mechanism: every version of the Worker was uploaded by hand.

## The sentinel that the search box could type

`viewWatch()` builds its head, then its groups, and the match count belongs
between them — but the count is not known until the groups have been counted.
The head therefore ended with a `%%COUNT%%` marker, replaced once the total was
in hand.

Someone types `%%COUNT%%` into the search box. The input echoes what you typed
into its own `value` attribute, and that attribute renders *above* the group
list, so it is the first occurrence in the string. `String.replace()` with a
string argument replaces the first occurrence. The count paragraph landed inside
the attribute; its quotes closed `value="` early, its remaining attributes were
parsed onto the search input itself, and the real marker stayed visible at the
bottom of the page:

    value="<p class=" scopenote"="" role="status" aria-live="polite" ...>0 matches<p></p>"&gt;

Not an injection — the string being inserted is app-static, and `esc()` still
runs on everything user-supplied. It is worse than that in one narrow sense and
better in another: no attacker is involved, but no attacker is needed either,
and the app corrupts its own DOM in response to ordinary typing.

The rule that came out of it: **a sentinel that can appear in user input is not
a sentinel.** There is no escaping scheme that fixes this, because the marker
has to survive `esc()` to be findable and has to not survive it to be safe. The
fix is to stop needing a marker — keep the head and the body as separate
strings and concatenate them in order once both are known. Two strings joined
cannot collide with anything.

Guard section 79 fails if any `%%`-delimited marker reappears in a rendered
string, and `qa/negative/negtest183.sh` types the old marker into the search box
and asserts the input survives.

## What an era note is allowed to say

Entry descriptions follow one rule: **who is in it, never what happens to them.**
Twice now a QA round has asked whether *era* notes are inside that rule, and
twice the answer has been a shrug, which is how a rule stops being one. Era 10's
note — "An old man in a chair, and a kid in a new suit" — is the case that keeps
raising it.

**The rule, decided in 1.8.3:** an era note may state the premise of the period
— what kind of Batman this is, who is beside him, what the city is like — but it
may never name an event from inside a specific entry.

The reasoning. An era is a span of a life, not a story, and it is named on Home
before anything under it has been opened; a note that cannot describe the shape
of a period cannot do its job at all. "An old man in a chair, and a kid in a new
suit" is *Batman Beyond*'s premise, stated in its own marketing and visible in
the first four minutes — the same standing as "a partner in the car" for the
Grayson years. Holding era notes to the entry rule would make eras nearly
undescribable and would buy nothing, because the thing being protected is what
happens *in* a story, and an era is not one.

The boundary is where it can be checked: an entry title or a quoted episode name
inside an era note means the note has stopped describing a period and started
describing a story. Guard section 81 fails on either.

## Counting the suites

Three numbers describe the test suites, and all three had drifted.

The README said **242 smoke checks** where the suite ran 262 — and before that
**79** where the real figure was 231. Two rounds of QA found it, once each. The
fix people reach for is to correct the number, which is what was done both
times, which is why it happened twice.

`guards.js` cannot count the smoke checks. Many of them run inside loops, so the
`check()` call sites in `smoke.js` are not the checks that run: 247 call sites,
266 checks. The only thing that knows the real number is the run. So the run
asserts it — the last thing `smoke.js` does is compare its own tally against the
README, counting itself.

The fixture count was worse, because nothing had ever found it. Every negative
suite defines its own `run_case ()` helper at the top of the file, and a naive
`^run_case ` count includes that definition — one phantom fixture per suite. The
total had been reported as **194** across sixteen suites when it was **178**;
the guard that now counts them off disk matches `^run_case\s+"`, on the quoted
label a real call always has, and each suite's own end-of-run tally confirms it.

None of these numbers matter. What matters is that a number in prose is a claim
nobody re-checks, and this project puts a lot of numbers in prose. The general
rule: if a file can count itself, it is the thing that owns the count.

## The decisions that can fail

Ten standing decisions had accumulated in release plans and QA reports — the sort
of thing that gets re-litigated every review because nobody can point at where it
was settled. Most of them were already explained in this file at length. Almost
none of them could **fail**.

That is the gap 1.8.5 closes. A rule that can be deleted without anything
noticing is a rule that lasts one refactor — this project's own sentence, written
in `qa/guards.js` about something else entirely. The era-note rule in 1.8.3 was
the first one taken the whole way: decided, written here, and given a guard. The
rest follow.

Guarded from 1.8.5: no `CNAME` in the published directory (82), the manifest `id`
(83), the one deliberate slug/year mismatch (84), the single-row series (85), the
eleven-era scheme (86), settings staying out of the JSON backup (87), the
universe chip reading the unfiltered group (88), and exactly one frozen-ID
exception (89).

Three could not be:

**Analytics counts the canonical hostname only.** A Cloudflare-side setting. No
file in this repo can observe it, and pretending otherwise would produce a guard
that checks a proxy for the thing and passes while the thing is wrong — the
failure mode of guard 15 before 1.7.6. Recorded here as unenforceable so a future
round does not spend an afternoon looking for the guard that should exist.

**What belongs in the catalogue** lives in the README rather than here, because
the inclusion rule is for readers as much as for us. Guard 31 fails if the
section or its named hard cases vanish. *Super Best Friends Forever* joined Joker,
OnStar and *Return to the Batcave* in 1.8.5 as the fourth: licensed, released,
Batman is in it, and still out, because nothing happens in it.

**Verify from a cold start.** A workflow rule, so it goes in the README's
release section where it is read before the next build, not into a file that only
runs after one.

## The plain-text export carries one ordering

`docs/orders.txt` (2.6.0) hands the whole catalogue to anything that reads text
rather than HTML — the audience `llms.txt` describes the site to, given the data
instead of the description. It is generated from `PATH`, `FILMS` and `tierOf()`
on every run and compared byte for byte, blessed like the crawlable seed and the
ItemList, because a hand-kept copy of 200 entries is stale within one release and
nobody reads a text file closely enough to notice.

It shipped **by universe only** from 2.6.0 to 3.9.5, and that was a decision
rather than an unfinished job. **3.9.6 took the other option, which the entry
below had already named.** The argument is kept in full, because it is the
reason the fix has the shape it has — a copy of the sorts in `qa/guards.js`
would still be wrong today, and the entry is the record of why nobody wrote one.

By universe needs no sort. Each continuity's array *is* its spoiler-safe order —
the same fact guard 78 leans on for the seed — so the export is the data read
back out. Bruce's life and Release order are not: both were produced by
**anonymous** comparators inside `buildGroups()`, and `fn()` can only extract
**named** functions out of `docs/index.html`. Writing those two sorts into
`qa/guards.js` would be a second implementation of the app's ordering, which is
the exact thing the extract-don't-reimplement rule at the top of that file exists
to prevent — a copy drifts from the app and quietly stops testing it, and here it
would quietly start *publishing* the drift.

The alternative was to name the two comparators in `index.html` so both sides
share one source — a `buildGroups()` refactor, app logic, and therefore not
something to ride a release whose whole claim is that it cannot break the app.
It was called "a real option for a round that is allowed to take that risk."

**3.9.6 is that round.** `lifeCmp` and `releaseCmp` are named functions now,
byte-identical bodies to the anonymous ones, and `buildGroups()` sorts through
them. Section 105 extracts both and publishes all three orderings; guard 141
asserts the app still sorts through the named pair rather than quietly
re-inlining a copy, which would restore the old problem while leaving the export
looking correct.

**What the refactor had to get right, and what would have gone wrong.** Neither
comparator is a total order over the catalogue. `lifeCmp` runs inside an era and
`releaseCmp` inside a decade; the bucket list does the coarse ordering, and the
comparator only settles ties within one bucket. Sorting all 200 entries with
either one directly produces a plausible-looking wrong answer — which is exactly
the failure the export would now be *publishing* rather than merely computing,
and precisely the risk the old entry was pointing at. So section 105's two new
loops mirror `buildGroups()`'s bucket-then-sort rather than sorting the flat
list, and a count check fails the build if any ordering carries fewer than all
of the entries: an era key or decade bucket that matches nothing would silently
drop entries, and a reader of a text file has no way to see that ordering 2 came
up short of ordering 1.

**What the old entry got right about the loss** is worth keeping too: release
order was always derivable from the file, since every entry states its year.
Bruce's life was not, and it is the ordering the app itself calls *an
interpretation rather than a canon* — which is why the file's header still says
so in the reader's own words rather than presenting three equal answers.

Guard 105 owns the file end to end: the drift check, the pointer in `llms.txt`
(an export nothing links to is an export nothing reads), and the exclusion from
the offline shell, which is the rule `llms.txt` and `404.html` already live
under — a crawler asset in the app cache is downloaded on every install and read
by nothing.

## Section 24 does not run at file scope, and that is allowed once

Guard 107 — the section census, carried on the backlog from 2.2.0 and built in
2.7.0 — holds two properties that both fail silently: a section containing no
`fail()` protects nothing, and a section that never runs passes for the same
reason an empty file does. Guard 66 held the numbering; nothing held these.

It found one case on its first run. **Section 24 sits inside section 23's `else`
branch**, because it reads the path tables section 23 extracts. Its checks can
be skipped entirely, which is the exact shape the census exists to catch.

It is kept, on a condition that is now asserted rather than assumed: **the only
branch that skips 24 is the branch that already calls `fail()`**, so a skipped
section 24 cannot coexist with a green build. That is what makes the nesting
acceptable rather than merely convenient.

Lifting it out was considered and rejected. Section 24 reads `ids`, assigned
only in the branch that would have failed — so at file scope it would throw on
`undefined` and turn a clean red build into a stack trace, on the release meant
to be the calm one. One nested section, named in the guard with its reason. A
second one fails the build until somebody makes the same argument for it.

## The floor

The browsers the script requires, written down once so nothing below the
line gets defended (4.9.0; the detection that went was a memoir of browsers
the app was already broken on). The deck relies on `inert` and the panels on
`content-visibility`; every browser with those has `Element.closest`,
`focus({preventScroll})`, `scrollIntoView(options)`, `history.replaceState`,
`canvas.toBlob`, `ResizeObserver` and `IntersectionObserver`, so those are
called bare. What is still detected is what genuinely varies between
supported browsers: `showSaveFilePicker` and `indexedDB` (the file handle),
`navigator.share`/`canShare`, `navigator.clipboard`, `requestIdleCallback`,
`navigator.storage.persist`, `matchMedia`, `visualViewport` and the service
worker's secure-context rule. Smoke's jsdom lacks the observers and
`scrollIntoView`, so `qa/smoke.js` installs inert stubs for exactly those
before the page boots; the browser check is where they are real.
