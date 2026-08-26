# Night Watcher — why the code is the way it is

`docs/index.html` carries no explanatory comments. It is the only file that ships
to a reader, it has a hard weight budget, and the reasoning does not need to
travel with it. This is where the reasoning lives.

Every entry below sat in the file as a comment until 1.6.3. Nothing was
rewritten on the way out — where a note reads like it is arguing with a past
decision, that is because it was.

Three other places carry part of the story and are not repeated here:

- **`CHANGELOG.md`** — what changed in each release and why, in the owner's voice.
- **`qa/guards.js`** — 151 numbered sections, each one a rule with the failure that
  produced it written above it, and each one negative-tested — asserted by
  section 138 on every run, not merely stated here.
- **`README.md`** — what the app promises and what it refuses to do.

If you are about to change something in `index.html` that looks redundant, look
for it here first. Most of it is load-bearing, and this project has a long
history of rules that only make sense once you know what they were written after.

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
VERSION and the changelog must agree or guards fail the build. KEY is
separate: bump it ONLY for a breaking storage shape.

### `restoreLink()`

On file:// location.origin is the string "null". Fall back to the published
copy — the link exists to reach a different device either way.

### `store`

Storage adapter: window.storage inside Claude artifacts; localStorage on the
open web — nightwatcher.life since the move, GitHub Pages before it was
unpublished in 3.3.1; memory-only if neither is available.

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

3.7.2, L-2 of the 10 Aug review. The parked belt hides its buttons with
`visibility:hidden`, which removes them from the tab order — correct visually,
and it left keyboard and switch users with no way into the path switcher
until they scrolled back to the top, because the strip that remains was a
click-only div. While the strip is the only affordance it IS a button, so
`parkFocus()` gives it `role="button"`, an aria-label and `tabindex="0"`,
and takes all three off the moment the real buttons return — a focusable
wrapper around live buttons is its own accessibility failure, which is why
the attributes toggle instead of ship static. It runs from `beltWatch()` (so
every render re-evaluates it) and from the park observer (whose park/unpark
never re-renders). The keydown half lives on `#view`: Enter and Space on the
focused strip call `beltDropOpen()` exactly as a tap does, and only when the
event target IS the strip, so a key pressed on a button inside it stays the
button's.

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

### `payload`

mode mirrors path, for a 1.1.0 downgrade. Never S.mode: with no path
chosen that wrote a real ordering, which the next load adopted as one.

### `if(isPath(o.path)) S.path = o.path;`

Upgrading from 1.1.0: their saved mode is a question already answered.

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

### `if(o.scope === "movies" || o.scope === "all") S.scope = …`

Checked against the list, like format two lines down. Any truthy
string used to be accepted, and visible() reads anything that is not
"all" as movies-only — so a hand-edited "films" hid every season while
neither scope button rendered as pressed.

### `S.format = ["anim", "live", "all"].indexOf(o.format) >= …`

A save written before 1.5.0 has no format. Those people have been
tracking animated for months, and defaulting them to All would grow
the denominator overnight and hand them a live-action film in Next
up. They keep the world they had; only new arrivals get All.

### `if(o.groupOpen && typeof o.groupOpen === "object"){`

Only false is meaningful — open is the default and absent keys read as
open, so anything else in here is noise from a hand-edited payload.

### `/* Two axes now. Format asks which kind of Batman; scope…`

---- ordering ----

### `visible()`

Two axes now. Format asks which kind of Batman; scope asks how much of it.
Format narrows first, then scope narrows within it.

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
control useless.

It persists as of 3.4.5. It mutates `S.groupOpen`, which is saved state, and it
was the one state-mutating site in the app that did not write — self-healing on
the next reload, which is why it survived so long, and inconsistent with every
other site, which is why it did not survive the audit.

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

### `/* One haystack. It was written out twice \u2014 once to…`

Nine Super Friends entries carry the year as their sub label — sub:"1973"
and so on — so pushing sub and then y printed it twice on every meta line in
the app: "1973 · 1973 · 16 episodes" on both heroes, and again on Then and
The Path. A sub that is only the year says nothing the next field does not.

### `matches()`

One haystack. It was written out twice — once to decide what the list shows
and once to decide what the "N matches" line calls hidden — so a field added
to one and not the other made the count stop describing the list.

### `groupFilms()`

One definition of "in this group", for Home's grid, Progress's rows and the
chart. It was written out seven times; a rule added to one of them and not
the others made two tabs quietly disagree about the same group. Keys are
goToGroup()'s: "c" plus a PATH index, "e" plus an era, and — since 3.8.1,
when Release order got its chart and its fold — "d" plus a decade's first
year. The decade window lived only inside buildGroups() until then, which
was the same seven-copies mistake one branch smaller: the moment a second
caller needed it, it moved in here.

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

### `formatSwitch()`

Format asks which kind of Batman, scope asks how much of it. Two questions of
the same sort, so they sit together — the path control above answers a
different one entirely, which is how you tell them apart without a label.

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

### `html += '<div class="bk"><h2>Your data</h2>'+`

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

### `'<p class="note foot">Announced dates can move.</p>'`

Named titles here went stale every time one landed or another was
announced. The fact is about announced dates, not about which ones.

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

### `qWasFocused`

Refocus if the box HELD focus, not if it merely has text — keying off S.q
shut the keyboard when you deleted the last character.

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

Two tabs — or a tab and the installed app — both wrote the whole payload on
every tick, so whichever acted last silently erased the other's marks. No
sync involved; just last-write-wins on one device. Marks only ever move from
unset to set, so the merge is a union and never resurrects an untick made
here.

### `document.getElementById("topBtn").addEventListener("clic…`

The wordmark is the one element on every screen, so it is the natural
"back to the top" — scroll lives on #app as of 3.9.7 (the document before
that), never on <main>.

### `/* Activity carries no badges. 1.5.9 added them because …`

One line, on request. Never the description — the whole premise is that
nothing ahead of you gets spoiled, and the description is where that risk
lives. Badges and the continuity name are facts about placement, not plot.

### `else if(act === "peek"){ S.peek[id] = !S.peek[id]; rende…`

Activity carries no badges. 1.5.9 added them because it was the one place a
logged entry rendered with none; 1.6.3 takes them back out, deliberately,
because they do not fit on one line beside the stars and the row being one
line is worth more. Recorded as a reversal, not drift.

### `else if(act === "jump"){ goToGroup(b.dataset.gk); }`

Activity's reveal. Shares S.open with the Then rows harmlessly: Then holds
only unwatched entries and Activity only watched ones, so no id is ever in
both.

### `routeHash()`

Runs on load and on every hashchange, so a shared #life link works in a
running app, not only on a fresh one.

### `toks.forEach(function(tok){`

shareable views: #life  #release  #universes  #progress  #next
combine with scope: #life-series  #universes-movies

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

Shorter than the path row, not smaller. Squeezing format and scope onto one
line by shrinking the type broke both labels across two lines instead — the
type size was doing work the palette does better. Height and type size are
separable: the block gives back 8px of height at the same 9px type, so
"Live action" and "Movies + Series" still fit on one line and the path row
still reads as the question asked first. Since 4.6.0 the pouches wear the
belt's colour on their edges and letters and keep their ink fill; the
chosen pouch inverted to signal-on-ink in 4.6.0 and became a hairline in
4.7.0 — ink ground, bold signal letters, a 1px inset signal box — so the
belt is the only filled yellow surface. See "The belt is yellow" and "The
cover" below.

### `#splash`

The crawlable seed's first-frame cover (4.7.0). Fixed, `--ink`, the
header's bat in `--signal`, first in `<body>` and outside `#app`, taken
down by `splashOff()` one frame after the first render. Everything about
why it is a cover and not a splash screen is in "The cover" below; section
151 holds the shape.

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

## Parked by decision, not by neglect — all three have since shipped

Recorded so they stop reading as things nobody got to. **Closed in 3.0.0: every
item below shipped, and the first one's standing claim had gone false.** Kept
rather than deleted, because the reasoning for parking each of them is the part
worth having.

- **The 1200×630 share card** — **shipped in 1.9.0.** The claim that `og:image`
  points at the square icon has been wrong since; it points at `share.png`, and
  section 91 fails the build if the three card references ever disagree. The
  work was as small as this said: the asset, four meta tags, a README row, and
  out of the offline shell because it is a crawler asset.
- **Rating badges** — **shipped across 2.3.x–2.7.2**, and the blocker was
  exactly what this said it was: sourcing a rating for 200 entries. *(Amended
  3.7.2: no 2.3.x or 2.4.x was ever cut — the CHANGELOG runs 2.2.x straight to
  2.5.0 — so the range means "the stretch between 2.2.x and 2.7.2", and the
  version numbers in it were written from memory.)* That pass
  lives in `catalogue/ratings-findings.md` (maintainer-local, not in this
  repository), every value carrying its source, and
  section 92 holds the distribution. The Mature badge it replaced was retired in
  2.7.2, four releases later, which became its own rule: a replacement is two
  changes and only one of them has a natural failure mode.
- **Master chooser and header magic** — **shipped.** It did want a picture
  first, and it got one; the header has been corrected three times since and the
  measurements are in `releases/plan-2.8.0.md` (maintainer-local, not in this
  repository).

## Where the negative suites' eight minutes actually went

The suites are independent and were running one after another, so the obvious
move was to run them concurrently. The second obvious move — the one that looked
like the bigger win — was to stop every fixture re-running all 89 guard sections
just to watch one of them fail. A `--only <section>` flag, roughly 0.4s down to
0.1s, 188 times over.

Measured first, and it is not where the time is:

| | |
|---|---|
| `node qa/guards.js`, whole file | **0.40 s** |
| — of which node startup | 0.05 s |
| — of which parsing guards.js | 0.06 s |
| — of which reading index.html + building the sandbox | 0.02 s |
| — leaving 89 sections of assertions | **0.27 s**, about 3 ms each |
| `node qa/smoke.js` | **21 s** |
| copying the tree per fixture | 0.013 s |

210 fixtures: 188 target `guards.js`, 22 target `smoke.js`. So the smoke fixtures
are **10% of the fixtures and about 84% of the wall clock** — 22 × 21s against
188 × 0.5s. The per-fixture average of ~2.5s that suggested otherwise is an
average over two populations that differ by a factor of forty.

A perfect `--only` therefore saves 188 × 0.27s ≈ 50 seconds of a ~550-second run,
call it 9%, because the fixed cost of starting node and parsing two large files
dominates the 0.4s and no flag can avoid it. It would also mean restructuring a
170 KB script whose sections are not uniformly wrapped — some are IIFEs, some are
top-level statements sharing setup — into something a flag can index. Not worth
it for 9%, and not worth it at all the night of a tag.

Concurrency was worth it: 456s serial → 354s on two cores, and the floor is the
slowest single suite (the one holding five smoke fixtures, about 110s), so a
four-core runner lands near two and a half minutes.

The one thing that had to change first was not the loop. Every suite computes its
scratch tree as `$NEGDIR/tree`, and `run-all.sh` exported a single `NEGDIR` for
all of them. Serial, that is fine and invisible. Concurrent, it is eighteen
suites unpacking eighteen differently-mutated trees over each other — and the
failures would have read as flaky guards rather than as a broken harness, which
is the worst shape a bug can take in a file whose whole job is to be trusted.

**If the negative suites ever need to be faster, the lever is smoke.js**, not the
guards: four jsdom documents built from a 142 KB page, about 5s each. Nothing
else on the list is worth measuring twice.

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

## The belt's snap was a layout problem wearing an animation costume

The staged close shipped in 2.0.0 and looked right in isolation: add
`.closing`, the pouches fade and lift on a stagger, re-render at 240 ms. What a
reader actually saw was the pouches leaving gracefully and then the entire page
below them jumping up in one frame.

**The exit animated. The reset did not.** `pouchout` animates `transform` and
`opacity`, and neither affects layout — so the belt held its full height for the
whole 240 ms and gave it all back at once when `render()` replaced `#view`.

The finding was first read as unfixable in CSS: an `innerHTML` replacement
cannot be transitioned. That is true and it is the wrong frame. **You do not
need to transition the swap. You need the swap to have nothing left to do.**
Collapsing the belt's own box — `max-height`, margins, opacity — over the same
240 ms means the page has already arrived at its post-close layout by the time
the view is rebuilt, so the rebuild changes nothing anyone can see.

The re-render is not retimed, the close handler is untouched, and guard 96's
staged-close checks still hold. The cost is two CSS rules.

**Reduced motion had to widen with it.** The media block now cuts three
selectors rather than two, and guard 96 was changed from pinning the exact
selector string to testing membership — the old form failed on the fix rather
than on a regression, which is a guard testing its own punctuation. Under
reduced motion the belt closes instantly, box and all. A "smooth reset" that
smooths the reduced-motion path is a regression wearing a fix's clothes.

## Reading layout after writing it, 216 ms at a time

`render()` ended with:

```js
var maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
window.scrollTo(0, Math.min(keep, maxY));
```

`scrollHeight` is a layout read. Immediately after `v.innerHTML = …`, it forces
the browser to lay out the entire document synchronously before the next line
runs — about 216 ms on a 200-entry list, on every render, including every tick
of a checkbox.

It was computing something the platform already does: `window.scrollTo` clamps
to the scrollable range on its own. The clamp was defensive code paying full
price for nothing.

**It is guarded, and the reason is the interesting part.** jsdom has no layout,
so `scrollHeight` returns 0 and every smoke test passes with the reflow present
or absent. Nothing in the harness could ever have caught this by running the
app. The only way to hold it is to refuse the shape — so guard 96 fails if
`scrollHeight` appears in `index.html` at all. It is exactly the line somebody
reasoning about scroll restoration from first principles would add back.

## The same defect, at the other end of the same function

Guard 96 refused `scrollHeight` by name in 2.7.0. On 6 Aug 2026 a Lighthouse
run found a forced reflow of **106.6 ms desktop / 64.1 ms mobile** at the TOP of
`render()` — `window.pageYOffset || document.documentElement.scrollTop`, read
after `flagSave()`, `applyTheme()` and `renderHead()` had all written. Same
defect, different property name, walking straight past a guard written against
the first name. It was ~98% of LCP and the page's only long task.

**The fix is ordering, not removal.** The scroll read moved to the first line of
`render()`, above every write. The value is identical either way — a DOM write
does not move the scroll position — and the layout is not forced.

**That is why counting could not hold it.** Section 120 pins `pageYOffset` and
`scrollTop` to one occurrence each, and the fix moves the read rather than
removing it: one before, one after. A count answers *how many* and can never
answer *in what order*. Section 120 carries an ORDER clause as well now, reading
the offset of the scroll read against the offset of `flagSave()` in render's
own source — the same trick as refusing a shape, because jsdom still has no
layout and nothing here can observe a reflow by running the app.

**And there is a second one, still present, recorded rather than fixed.**
`flagSave()` writes `el.hidden = canSave` and then reads `h.offsetHeight` to set
`--ghtop`. It only runs when the store is blocked, so a profile taken with
storage available — which is every profile anyone has taken — cannot see it.
Section 120 pins that read by name so it cannot go missing.

## The favicon that every browser drew and no crawler could see

The SVG icon shipped inline as a `data:` URI from the beginning. One fewer
request, no extra file, perfect in every browser — which is precisely why it
took months to notice that the site had no favicon in search results.

Google's favicon pipeline **crawls the icon**. Its documentation requires a
stable favicon URL, and SVG is supported only as a served file with a content
type. A `data:` URI has no URL to fetch, no MIME type on the wire, and nothing
to re-crawl. The browser-facing behaviour was flawless and the machine-facing
behaviour did not exist.

Now `docs/icon.svg`, precached with the other app assets, and guarded — an icon
link with a `data:` href fails the build. Inlining it again is a defensible
optimisation on every ground except the one that matters, which is exactly the
kind of decision that needs writing down rather than remembering.

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

## Why the fonts were 39% of the payload and nobody noticed

The weight budget guards `docs/index.html` — 220 KB raw since 3.8.3, 200 KB
before it, 80 KB gzipped throughout — and it has been the project's most-cited
discipline. It also could not see the fonts.

Six faces at 118,860 bytes against a page that compresses to 52 KB: the
typography was more than twice the weight of the app, and every arithmetic
argument the project ever made about weight was about the smaller half. None of
it was dead files — all six are referenced and precached. It was glyph coverage
for languages the catalogue does not contain.

Subsetting five of them to Latin-1 plus punctuation takes 55,864 bytes off,
turning a 296 KB first visit into 241 KB. **Limelight is left whole because its
OFL header names a Reserved Font Name**, so a subset would have to be renamed
in the font, in `@font-face` and in `--deco` — real churn and a licensing
judgement, for the last 10.3 KB. Anton's header carries no such name. *(IBM
Plex's does — "with Reserved Font Name "Plex"" upstream; the copy of OFL.txt
shipped here had dropped the clause, and 4.5.2 restored it. 4.5.3 applied
Limelight's rule to Plex with the answer that costs nothing: the four
subsets are renamed NW Sans / NW Mono in the name table and in the CSS —
"The Plex reserved name" under The seal.)*

**The range is deliberately wider than the catalogue.** Cutting to exactly the
99 characters present today saved another 21 KB and would have put an accented
title one data patch away from blank boxes, on a catalogue whose entire design
is that it takes data patches. Guard 106 holds what remains: every character in
the page and in `orders.txt` must be inside the blessed range, and the font
files must match the hashes recorded beside them, so the fonts and the record of
what they contain can only move together.

## Two guards in one month that pinned a layout instead of a decision

2.7.0 widened guard 96's reduced-motion check from a literal selector pair to a
membership test, because the fix to soak finding 1 added a third selector and
the guard failed on the fix. 2.7.1 did the same to section 92: it had pinned
`ratingBadge(f)+watchLinks(f)`, twice, exactly — so moving the rating onto the
badge line failed the build for the layout rather than for a defect.

Both guards were correct when written. Both were written to hold a *soak note's
fix* rather than the decision underneath it, and a fix is a shape while a
decision is a rule. Section 92's rule was never "the rating sits beside the
link"; it was **every surface a reader decides from says what a thing is rated,
and it says it in the same place as everything else about that thing.** Written
that way it survives the layout changing, which it now has, twice.

**The test when writing a guard from a soak note:** if the note were fixed a
different but equally good way tomorrow, would this guard go red? If yes, it is
holding the arrangement, not the reason for it.

## A release that shipped a change its own plan had gated

2.7.0's plan listed the share card's bottom block as **F4 · GATED** — one
Instagram Story post, one look, and only then move the coordinates. The owner
chose "ship the fix" over "do the test", the coordinates moved, and on a real
card the composition was worse: a third of the canvas empty under the domain
line, because 145px of content had been lifted out of a fixed-height frame.

The safe-zone reasoning was not wrong. The gate existed because the reasoning
was *unverified*, and the specific figure it rested on — 250 to 310px reserved
at the bottom — was described in the plan itself as widely repeated guidance
rather than a published spec. Skipping the gate did not make the guidance
wrong; it removed the only step that would have shown the cost of acting on it.

Reverted in 2.7.1 and held by guard 108, because the argument for the move is
still on the record and reads as unfinished work. **If it is revisited, the
answer is not to shift the block again — it is to keep the composition and
shorten the canvas, and that still wants the Story test first.**

## A badge that outlived its replacement, and why nothing caught it

The decision is dated 1 August 2026: replace Mature and Kids with the film
rating itself, because *"PG-13 and R were both Mature before, and G and PG were
both nothing."* Kids went — it was designed, scheduled, and correctly dropped
when the ratings superseded it. **Mature stayed for four releases**, on 39
entries, eleven of them rated PG-13 or TV-14. The legend said the quiet part
out loud: the swatch read *"R or close."*

**The mechanism is worth naming because it generalises.** 1.7.0's changelog
said the rating badges were not in that release and that *replacing* Mature and
Kids was the next round's job. The ratings arrived on schedule. The replacement
did not, and what shipped was an addition — which passes every test an addition
can be given. **No guard fails over redundancy.** Guard 92 checked that the
ratings were right; nothing checked that the thing they replaced was gone,
because "gone" is not a property anything was watching.

The badge-kind guard made it easier to miss: its list of kinds was hand-kept, so
`BADGE` and the list could disagree without anything noticing. That is fixed —
the map and the list now have to agree in both directions — but the general
lesson is the one to keep: **a replacement is two changes, and only one of them
has a natural failure mode.** When a decision says *replace*, the removal wants
its own guard on the day, or it becomes an addition and lives forever.

## The export nobody could find

`docs/orders.txt` shipped in 2.6.0 with guard 105 holding it, and the guard was
built around the right sentence: *an export nothing points at is an export
nothing reads.* It checks that `llms.txt` names the file, and it has passed
every run since.

In August 2026 a six-agent SEO/GEO/AEO audit crawled the live site and
recommended, as new work, *"a machine-readable catalogue export for secondary
citations."*

`llms.txt` was the **only** thing pointing at the file. Nothing in
`index.html`, nothing in `robots.txt`, nothing in `sitemap.xml`. The guard was
true and the claim underneath it was not: one pointer, in a file most crawlers
never request, is indistinguishable from none.

The page now declares it — `<link rel="alternate" type="text/plain">` — which is
what the file actually is. **It stays out of `sitemap.xml` deliberately:** the
crawlable seed already carries all 200 entries and so does the export, so
submitting both for indexing asks a search engine to choose between two
near-identical bodies on one domain. Discoverable and indexed are different
goals and only the first one is wanted here.

**What the guard should have asserted** was not "a pointer exists" but "the
surfaces a reader or a crawler actually lands on mention it". It does now.

## The header was never misaligned, and that is why it stayed wrong

The 2.7.2 soak note said *"header realignment, fix."* Every box in that header
was exactly where it claimed to be.

The row is three flex columns with `align-items:center`. `.mark` is 46px wide,
`.ring` is 46 × 46, and `.wordmark` is `flex:1` between them — so the title is
mathematically centred and all three share a vertical centre line. Any check
that measured the layout would have passed, and none was ever written because
there was nothing to catch.

**The lopsidedness was the mass inside the boxes.** `.mark svg` drew at 32px
inside its 46px column — seven pixels of air on each side — while the ring
filled its box edge to edge. Vertically the bat covered **26.7px** (32 × 70/84,
from its `viewBox`) against the ring's 46: **58%**. The left flank was a small
solid glyph floating in space, the right flank a large hollow ring pinned to the
edge. The eye reads that as crooked; the box model insists it is fine.

The bat went to 40px and the wordmark from 21 to 24 in the same change, because
enlarging the title alone moves mass to the centre and re-breaks the balance
from the other side. They are one decision, so they are guarded as one.

**The ceiling is a narrow phone, and it fails silently.** At 375px the row
leaves ~219px between the flankers; *NIGHT WATCHER* in uppercase Limelight is
~187px at 24px and does not fit at 28. `.wordmark` is `flex:1; min-width:0`, so
it **shrinks rather than overflowing** — nothing goes red, the title just starts
wrapping on somebody's phone. The guard holds a floor and a ceiling for that
reason: the floor is the fix, the ceiling is the failure nothing else would
report.

## Removing a button leaves a handler nobody can reach, and the build stays green

2.7.3 cut the share block to one button on the owner's word. The first full run
afterwards was **green** — guards, smoke, every negative suite. The `cardsave`
handler was still there, still correct, and no longer reachable by any control
in the app.

That is the same shape as the Mature badge two releases earlier: **nothing fails
over something that is merely unreachable.** A guard existed asserting the
handler was present — written when the button was — and it passed for exactly
the reason it should have failed.

It is now a two-sided check: `data-act="cardsave"` and `act === "cardsave"` must
either both be present or both be absent. A button with no handler does nothing;
a handler with no button is code no reader can reach. **The pairing is the
invariant, not either half.**

There is a general rule here worth taking to the next removal. When a control
comes out, three things have to go with it: the handler, the guard that asserted
the handler, and any fixture anchored to either. Miss the middle one and the
suite keeps proving something true about code that no longer runs.

## A dropped quote, and what the harness did about it

2.7.4 edited a concatenated string and lost a single quote:

```js
'... updated '+BUILT+ · <a href="...">read the source</a></p>';
```

That is a syntax error. Not a rendering bug, not a degraded path — **the script
would not have parsed, so the app would not have run at all, on every browser.**
The whole thing: no catalogue, no progress, a blank page.

**The harness caught it.** `smoke.js` builds the page in jsdom, so it died on
the spot. What it did not do is say so. It threw a raw stack trace with a line
number into a 180 KB single file, which is the difference between a minute and
an hour at the wrong end of an evening.

`guards.js` did not catch it, and could not have. It extracts *named functions*
with `vm.Script` and evaluates those; a broken string between two functions is
outside everything it looks at. Every check it ran passed.

**Section 47's neighbour now compiles the whole script block** with
`new vm.Script()` — compiling without executing, which is exactly the question
being asked — and fails with the parser's own message. It runs before anything
else forms an opinion, because every later guard is reasoning about a file that
might not be a program.

**Why this class of mistake deserves its own guard here specifically:** the app
is one file that builds its markup by string concatenation, and every release
edits those strings by hand. A dropped quote looks like nothing in a diff — the
line is long, the change is one character, and the eye reads the sentence rather
than the syntax. This is the project's most-exposed failure mode by
construction, and until 2.7.4 the only thing standing under it was a stack
trace.

## The header, corrected three times, measured wrong every time

2.7.3 raised the header bat from 32px to 40px to close a gap "against a 46px
ring". The reasoning was right and the number was wrong. **46 is the ring's
box.** What it drew was a stroked circle — `r="19"` with a 4px stroke, so the
outer edge sat at radius 21 and the ring covered **42px**, leaving 2px of its
box unused. The fix that closed the gap was measured against a figure nobody had
checked, and it landed at 40 against a real 42 by luck rather than arithmetic.

**2.7.5 fixed that side and then made the same mistake on the other one.** It
set the radius to 20 — 44px drawn — and the bat to "44", and recorded that both
flankers drew the same width for the first time. **They did not.** 44 is the
bat's *CSS box*. `.mark svg` is `width:44px` over `viewBox="8 16 84 70"`, and the
glyph's own bounding box is `12,17 → 88,78` — four units of empty viewBox each
side — so **the bat draws 39.81px**, and the ring was 4.19px wider than the mark
it flanks.

**The guard is what makes this worth writing down.** 2.7.5 replaced a magic
floor (*the bat is at least 38px*) with a genuine relationship: **bat width =
`2 × (r + stroke/2)`, within a pixel**. That was the right move and it was still
green for a 4.19px gap, because one of its two terms was read from a CSS
declaration. **A relationship guard is only as honest as its terms.** A CSS
width is a box; the thing anybody looks at is the glyph.

**And the target was wrong as well as the term.** All three attempts aimed at
*matching*, because matching is what a symmetric row looks like on paper. The
owner's rule, 5 Aug: **the ring is never wider than the bat.** The bat is the
logo. The ring is a readout of how far you have got. A readout that outdraws the
mark is the wrong way round, and it had been the wrong way round since the ring
was added. **A rule with a direction in it cannot be satisfied by luck** — and
two of the three releases above were satisfied by luck. It also kills the
tolerance: 2.8.0's own first draft proposed `r=18`, which draws 40px, matches
within a pixel, and is *over the bat*.

2.8.0 takes the ring to `r=17.5` with a **3px** stroke — 38px drawn, 1.81px
clear of the bat, and 330px² of ink against the bat's 444. The stroke moves
because shrinking the radius alone makes the band a larger fraction of the ring
(9.1% → 10.5%), so the ring gets *visually heavier* as it gets smaller, which is
the opposite of the instruction.

Section 47 now measures the glyph: every path and the ellipse, flattened with
real cubic extrema rather than the control hull, scaled by
`cssWidth ÷ viewBoxWidth`. It requires `2 × (r + stroke/2)` to come in **strictly
under** it, and it is squeezed from below by the ring's own label — `100%` needs
`4 × fontSize × 0.6` and has to clear the **chord** at the text's height, not the
inner diameter. Both bounds are computed from what ships. Neither is a number
anybody landed on.

**The general shape, which this project keeps rediscovering:** a guard written
as a remembered constant protects the number somebody happened to land on. A
guard written as a relationship protects the reason — *provided its terms mean
what they say, and provided the relationship is the one that was actually
wanted.* Section 80 got the first part right from the start: it derives the
circumference from the radius instead of holding 119.4, which is why every move
of `r` has corrected the dasharray, the dashoffset and the script's offset
unprompted. It did not cover `#ringTrack`, and 2.8.0 closed that too.

## A watcher that cannot see is worse than no watcher

3.0.0's first stage touched no app code at all, and that was the point. The deep
QA audit of 2.7.5 found that **four of its five P1s were instruments rather than
defects** — a guard whose regex had never once matched the page it guards, a
smoke check asserting something that could not be true, twenty-two negative
fixtures that passed against a fully green run, and a README paragraph
describing a feature retired four releases earlier.

**Every one of them was found the same way: by breaking something on purpose and
watching a green build come back.** That is the only method that works on this
class of bug, because a blind watcher reports exactly what a working one
reports. Nothing in a diff looks wrong. Nothing in the output looks wrong. The
suite is green and the thing it was pointed at is unprotected.

**So the order of the release was decided by the finding.** Landing the app work
first would have meant verifying it with instruments the audit had just proved
partly blind. Stage 1 repaired the watchers, could not break the page, and
everything after it was verified by a harness that can see.

**The gate, and it is the durable part:** every repaired watcher got a negative
fixture proving it now fires. A watcher fixed without a fixture is the same
promise that had just failed.

### The three that were hiding real holes

Filtering the green lines out of the negative harness's output regressed exactly
three fixtures out of 392, and all three turned out to be worth the trouble:

- One named a check its mutation did not trip — the mutation was right for the
  fixture's own label and the expected string had been copied from elsewhere.
  **The check it wrongly named had no fixture of its own**, which is how the
  mistake survived; it has one now.
- One's mutation tripped nothing at all. It made the value under test
  *consistently* wrong, and the check asserts that the value does not *change* —
  so the invariant held over a broken app.
- One left the guards exiting **0**, and matched a note the section prints on
  every good run. **There was no assertion at all** behind it: `_headers` could
  be smuggled into the offline precache and nothing said so, though `share.png`
  and `orders.txt` had both carried that assertion for releases.

**The shape worth remembering:** a fixture whose expected string is a check NAME
rather than a failure MESSAGE will match a passing run. The harness now strips
the green lines before matching, and three alternatives were tried and rejected
on evidence rather than taste — an exit-code gate breaks the warning-only
fixtures, and a `✗|FAIL` filter breaks the two that expect a harness error.

## A title is not a production

`titleYear()` keyed on the title alone and took the earliest year anywhere in the
catalogue, so **seven entries sent a reader to search for something else**. The
2022 *The Batman* asked for the 2004 cartoon. Both 1966 *Batman*s and the 1989
one asked for the 1943 serial.

**The unit was wrong, not the rule.** Earliest-year-per-title is exactly right
for the seasons of one show, which is what the rule was written for and what it
kept working for. It is exactly wrong for a name two unrelated productions
share. The key is the title *within its universe*: seasons of a show live in one
continuity and keep sharing one search; two productions that merely share a name
never do. Twenty-two same-universe cases were checked before and after and none
of them moved.

**Guard 44 was enforcing the defect**, which is why the fix could not land
first. It required the earliest year in the catalogue and only looked for
collisions between *different* titles — so the wrong answer was not merely
unguarded, it was certified. The rule and its fixtures changed in the same commit
as the code, and that is the house rule this release exists to demonstrate:
**a guard that outlives the thing it was written against will certify whatever
replaces it.**

## Three copies of one merge, and only one of them kept the invariant

`markWatched()` has always cleared the skip — watched-clears-skip is the app's
own definition of what a tick means. **Three merge sites did not**: the cross-tab
storage event, the JSON restore branch, and `applyImport()`. Skip an entry in one
tab, tick it in another, and it came back as both — rendered with both classes,
and shipped in *both* segments of the backup code and the JSON.

**This is not the recorded "the merge only ever adds" decision**, which is about
never losing a mark somebody made and still stands. This was drift between three
hand-copied copies of one merge, and **the copies were the bug**: the log-merge
dance underneath had been written out twice as well. One `mergeLog()` now, so
there is one place to change rather than three to remember.

## A render nobody asked for is still a render

`#restorebox` was rebuilt empty by every `render()`, and renders fire from things
the reader did not do: another tab's storage event, and the four-second
reset-confirm timeout — which is gated on `S.tab === "stats"`, the very tab the
box lives on. Paste a backup code, let another device tick something, and the
paste was gone with nothing said. `#q` had been preserved across renders for
releases. The box holding somebody's only copy of their progress had not.

## The surgical paths, and the arithmetic that makes them safe

Closing a group in The path cost a full render: 148–214 ms at 200 entries on
desktop Chromium, of which **2.2 ms was this project's own code** and the rest
was the browser laying out two hundred rows nobody had asked to change. 3.0.0
added three targeted repaints beside the tick path that already existed — a row
opening, a group closing, and the theme — and moved `rate()` onto the tick path
it had been driving straight past.

**The danger with a fast path is not that it is wrong on the day. It is that it
drifts from the builder afterwards, silently.** So one builder serves both:
`filmRow()` was pulled out of `groupBlock()` rather than reimplemented, and the
smoke suite's byte-identity gate — widened past `#view` to cover the header and
the two document-level attributes — drives every surgical path and requires the
DOM to serialize **byte-for-byte identically to a forced full render**. That is
not a review, it is arithmetic. A count missed, a class dropped, an aria left
stale fails by construction.

Each path also falls back to a full render the moment it cannot find what it
expects. **A fast path that guesses is worse than no fast path.**

`S.open` was one keyspace shared by The path's expanded rows and Next up's peeks,
so opening a row in one view opened something in the other. Split into `S.open`
and `S.peek`. Next up keeps the full render deliberately — it is a four-row list,
and there is nothing there to save.

## Nothing in this project declared a cache policy

`docs/_headers` set three security headers under `/*` and nothing else, so every
response took whatever Workers Assets emits by default — and Cloudflare caches
`.js` at the edge. **Two independent routes reached the same conclusion.** The
six subset faces are 62,996 bytes, network-first in the service worker, and
re-fetched on a policy nobody wrote. And on 5 Aug 2026 the bare `/sw.js` answered
`VERSION = "2.5.1"` while the same file with a cache-busting query answered
`2.7.5`.

**`sw.js` is the one file that must never be stale**, because it is how a
returning browser learns the app changed — the file's own header comment says so.
It takes `no-cache`, which does not mean *do not store*: it means revalidate
before use, which is exactly what a version marker wants. The fonts take a year
and `immutable`; they are blessed by hash and never change under a name.

**Guard 104 pins both, because the value is load-bearing the moment it exists** —
and a blanket `Cache-Control` under `/*` fails the build, since the two paths
want opposite answers and one rule would give one of them the wrong one.

**It only takes effect on upload.** `_headers` is read by the edge, not by
anything in the repo, so nothing about this changes until the tree is deployed.

## A scroll restore that measured a document which had not been laid out yet

`render()` ended with `if(keep) window.scrollTo(0, keep);`. The line is right in
isolation and wrong in place. It runs in the same task as `v.innerHTML = ...`,
and `.group` carries `content-visibility: auto` — which is the whole reason the
page opens as fast as it does, because the browser skips layout for groups that
are off-screen. So at the instant the restore runs, every off-screen group is
still measuring its `contain-intrinsic-size` rather than its real height. The
document is about a third as tall as it is about to be, the browser clamps the
scroll to that shorter maximum, and the reader is somewhere else.

Measured at 390×844: **2233 → 1011**, with the row count and the final document
height both unchanged. That last part is what rules out any explanation
involving the content — nothing was added or removed, only the scroll moved.

**It could not be measured out of.** Every property that answers *how tall is
it* — `scrollHeight`, `clientHeight`, `getBoundingClientRect` — is refused by
guard section 120, because reading layout inside a function that writes it is
the forced reflow 3.3.0 spent a release removing. There was no number available
that was not itself the older defect.

So the fix does not measure. `.settling` on `#view` drops `content-visibility`
to `visible` for the one frame the restore lives in, the scroll lands against
the true height, and the class comes off on the next frame — by which point
`contain-intrinsic-size: auto` has remembered the real sizes, so the next render
starts from a better estimate than this one did. The cost is one full layout on
renders that restore a scroll, and it does not touch the Performance score,
which measures load.

**Why the tick was where a person met it.** `tickUpdate` falls back to a full
`render()` whenever a filter chip is active. With the filter on `all` the
targeted repaint runs and never touches the scroll, so the defect is invisible.
With any chip active every tick goes through `render()`. `left` is the chip
someone actually uses while working through a path, which is why it was found
by using the app rather than by testing it.

## Three of four controls dropped focus to the page, and the fourth hid it

`tickUpdate` restored focus by looking for `[data-act="watched"]`, and
`querySelector` returns the first match — the row's own tick. So pressing *Mark
watched* or *Skip* inside an open row, or any star, destroyed the button that
held focus and left it on `<body>`. Only the bare tick survived, and it survived
because it happened to be the element the selector was written for.

It now remembers which control actually had focus, the way `render()` already
did, and returns it there; `data-n` is what tells the five stars apart. The same
change gave `tickUpdate` the `preventScroll` that `rowUpdate` and `render()`
already passed — it had never been observed to move the viewport, which is
exactly why it was worth closing. An assertion-free difference between three
sites doing the same job is a coin that has not landed yet.

## The drive that was green against the defect it was written for

The first version of the new browser check clicked a tick, waited 450ms, and
compared the scroll position. It passed against the fixed build and it passed
against the broken one, which makes it worse than no check at all.

Chromium's scroll anchoring pulls the page back within a few hundred
milliseconds. The clamp is real, the reader sees it, and by the time a patient
test looks, it is gone. Rewritten to read the scroll position **inside the
click's own task**, it reports `2778 → 757` against the defect and `2778 → 2778`
with the fix.

The jump drives in the same file had already learned this in 3.3.2 and say so in
their own name — *lands in the click's own task, not over one*. The lesson did
not travel the twenty lines to the next check anyone wrote.

## 3.4.1 — the fix went to the branch almost nobody is in

`tickUpdate` opens with a gate: a filter chip or a search falls back to
`render()`, and everything else patches the DOM in place. 3.4.0 fixed
`render()`. It did not touch the other branch, which is the state the app opens
in — no filter, no search — and where every reader starts.

That branch rebuilt the whole group through `groupBlock()` and swapped the
element in. `.group` carries `content-visibility: auto` with
`contain-intrinsic-size: auto 64px`, and the replacement is a brand-new node, so
the browser has no remembered size for it and renders the placeholder. Measured
at 390×844 inside the click's own task: **3418px → 66px**, and the document
loses 3352px under the reader. In *Bruce's life* a group is an era rather than a
universe, which is why the report came from the path tab.

The fix is smaller than what it replaces. With no filter and no query,
`groupBlock`'s seven filter clauses all fall through and `matches()` returns
true, so the row set cannot change; a tick can only change the row, the `n of m`
in the head, and the head's bar. The row goes through `filmRow()` — `.film`
carries no `content-visibility` — and the other two are written in place, the way
`groupUpdate()` always has. Nothing outside the full render builds a `.group` any
more, and section 103 now asserts that by counting the places `class="group"` is
constructed.

## The bar that serialized differently

Writing the head's progress bar with `bar.style.width = "60%"` produced
`style="width: 60%;"`. The string builder emits `style="width:60%"`. Identical to
look at, one space apart on the wire — and the smoke drift gate caught it on the
first run, naming three entries whose in-place repaint no longer matched a full
render. `setAttribute` instead of `.style`, and the two agree byte-for-byte
again.

This is the check earning its keep. Nothing a person would ever see went wrong;
what went wrong was that two paths that must produce the same bytes stopped
producing the same bytes, which is exactly one release away from something a
person does see.

## Two fixtures that were aimed at the wrong function

`rowUpdate()` and `tickUpdate()` contain the same two lines verbatim —
`scratch.innerHTML = filmRow(f);` and the `replaceChild` after it — and
`rowUpdate` comes first in the file. A single-line anchor with
`.replace(..., 1)` therefore mutates `rowUpdate` and leaves `tickUpdate`
untouched, so section 103 has nothing to complain about and the fixture reports
`FAIL` with the expected message simply absent. It reads like a broken guard.

Every anchor in that block is multi-line now, ending on
`var gm = head.querySelector(".meta");` — the one line that exists only in
`tickUpdate`. Same shape as 3.4.0's shell-quoting bug: a mutation that does not
change what it means to change is a negative test that proves nothing, and both
times the tell was a failure report with an empty or irrelevant `got:`.

## The harness reads a server, not the tree it sits in

`browser-check.mjs` loads `NW_URL`, default `http://127.0.0.1:8099/`. Copying
the tree, breaking the copy, and running the check from inside the copy tests
whatever the server is already serving — the original. Three runs against a
deliberately broken build reported green that way, and the symptom is
indistinguishable from a check that cannot fail, which is the exact thing this
release exists to stamp out.

Serve the copy on its own port and pass `NW_URL`. Done properly, both new
assertions go red: the group element is replaced, and the height falls
`3512 → 66` with the document at `15347 → 11901`.

## The belt parks as the peek, and what 12px is allowed to say

3.5.0, Stage B of `releases/plan-belt-release.md` (maintainer-local, not in
this repository). The strip is
`position:sticky` and parks under the header with `--belt-peek` (12px) of
itself showing — a rail with one lit chunk at left, middle or right. Position
encodes the path; the band carries no text, no buckle line, no second channel.
That rule is why the peek exists at all, and it is the locked design's, not
this file's.

**The chunk lights from `S.mode`, and `aria-pressed` stays on `S.path`, and the
difference is the whole point.** `S.mode` is the ordering on screen right now;
`S.path` is the one you committed to. They diverge from any Progress count and
any deep link, and stay diverged until you move them back. A peek lit from
`S.path` is confidently wrong in exactly that state — worse than the blank rail
F4 worried about, which barely exists (`S.mode` is never empty, so there is
always one lit chunk, and the pre-choice conditional the design once proposed
was never needed). Pressed means picked, lit means here; `viewWatch()` prints
both facts in words directly under the strip, so the peek inherits a
distinction the app already states rather than inventing one. F4 is superseded
by this, not answered.

**While parked, the strip's buttons go `visibility:hidden`, which is three
fixes in one property.** The mock's `elementFromPoint` across the parked band
read `BUTTON life · continuity · release · buckle` — a 12px touch target
against the 44px floor, attached to silently re-ordering the entire list.
`visibility:hidden` removes the buttons from hit-testing, from the tab order,
and from the accessibility tree in one line, with no attribute juggling for
`render()` to erase. The strip itself becomes the one handle: tap = calm scroll
home. A keyboard reader keeps the wordmark (guard 47) as the route to the top;
the parked band is a sign with a pointer affordance, not a focus stop — 12px
was never going to be an honest keyboard target.

**The parked flag is an `IntersectionObserver` on a 1px sentinel, and the flip
is deliberately late.** A sticky element never leaves the viewport, so it
cannot report its own parking; reading its geometry is the layout read section
120 refuses; and the exact pin offset involves `env(safe-area-inset-top)`,
which no script can read without `getComputedStyle`. So the sentinel rides at
the strip's natural position and the flag flips when it leaves the viewport
top — a few dozen pixels after sticky engages. In that window the band has not
yet slid in and the strip's bottom edge shows its ordinary segment bottoms,
which is the same thing every other element does while scrolling under the
header. The flag lives on `<html>` because `render()` replaces `#view` on
every tick; the observer is re-pointed at the new sentinel at the end of every
render, and the attribute never flips on a re-render, which is why the
entrance cannot replay the way the pouches once did (2.2.1). A browser without
`IntersectionObserver` never sets the flag: the strip still parks and its
buttons stay live — a degradation accepted by the 2019 support baseline, and
recorded here rather than guarded around.

**The entrance is a transition because `*` does not match pseudo-elements.**
Q2's trap, one layer deeper than the plan wrote it: the reduced-motion block
was `*{transition:none!important}`, which covers every element and not one
`::before`. The band's slide is a transition on the pseudos, so the block now
reads `*,::before,::after` — the extension the plan's "extend the explicit
list" option meant. A keyframe entrance would have slipped the block entirely;
guard 128 asserts the mechanism chosen is one reduced motion actually covers,
and the negative suite makes both halves fail.

**71, not 70.** The header is `12 + 46 + 12` of padding and row plus a 1px
border, and `offsetHeight` — the JS override's read — includes the border. The
old `--ghtop` fallback said 70 and lost nothing because a group header parks
*behind* the border; the belt loses a twelfth of its peek. One `--hdrh` in
`:root`, border included; `--ghtop` derives from it plus the peek (F3 — the
era headers pin below the band, not under it); the belt's top derives from all
three; the storage-blocked override writes `--hdrh` so the fallback and the
override are two answers to the same question through the same variable.
`--beltH` is 46: the 44px button floor guard 62/75 holds, plus the strip's two
borders.

**F14 ships as one condition on `position`, and the staged close is what makes
it safe.** An open belt is `data-held` — in flow, scrolling away with its
pouches; there is no state in which a peek and a pouch are on screen together.
The buckle's staged close leaves the old render's `data-held` in the DOM until
the deferred re-render, so a closing belt stays in flow while the exit plays —
the `:not(.closing)` machinery the design describes belongs to Stage C's
mid-close parking, which did not exist when this was written (Stage C shipped
in 3.6.0 — the next section). Stage C, whole — the drop, the
anchor, the retraction, F9/F13's reversals of 2.0.0, and section 96's growth
for all of it — waits on the guard-120 argument, or on the CSS positioning
answer that would make the argument unnecessary. Deferred with the release
valve the plan named, not dropped.

## The drop that never made the argument it was blocked on

3.6.0, Stage C. The plan's blocker was real: the strip-measured anchor needed
`getBoundingClientRect`, `offsetWidth` or `clientWidth`, section 120 refuses
all three, and moving one into `PINNED` is a decision with its own argument.
The plan's footnote — *"worth ten minutes before the argument is had"* — was
also real. CSS anchor positioning is the ten minutes: `anchor-name:--belt` on
the strip, `anchor()` and `anchor-size()` on the dropped pouches, and the
pouches inherit the strip's actual box — scrollbar, safe area, 760px column —
by construction. **Section 120 shipped this release untouched.** The register
should note the inverse lesson: an instrument that cannot see (a guard
refusing a read) is sometimes answered by removing the need to look, not by
widening the instrument.

Verified empirically before a line of app code was written: a fixed anchored
box tracks a sticky anchor's box exactly at 390px and at 1280px with a
scrollbar, and — the part that killed F12's "left behind" bug — it tracks
mid-transition, measured at 120ms of a 220ms `top` ease.

**Why the drop is gated on `supportsAnchor()`** *(a JS probe until 3.6.4; the
gate is a CSS `@supports` rule since — the reasoning is unchanged)*. Without
anchor positioning
the pouches would position against the page — the exact two-widths bug the
Next-up tab had at 7.5px and the mock had at half a scrollbar. A browser
without the primitive gets Stage B whole: parked tap = calm scroll home.
Firefox is the notable absence; phone-first traffic makes it a rounding error,
and the fallback is not a broken drop but last release's shipped behaviour.

**Why the retraction is the app's only scroll listener.** An IntersectionObserver
fires when an answer changes; "has the user scrolled at all while dropped" has
no threshold to observe — any movement is the answer. `{once:true, passive:true}`,
armed per drop, disarmed by firing; guard 128 pins the count at one the way
section 120 pins its reads. The `dropArmed` flag exists because {once} removes
the listener, not the intent — two armed copies would close the next drop the
moment it opened.

**Why closeBelt() takes a door name.** "buckle" closes pouches and keeps the
drop (F7: a dropped belt is a working belt; Q3: the buckle closes pouches
independently). "drop" ends everything: the strip loses `data-drop` so its
`top` transitions home, and the pouches keep their attribute through the
`className` swap — an attribute survives a class assignment, which is what
lets the anchor hold and the pouches ride the belt up instead of hanging
mid-air (F12's third finding, dead by construction). "auto" is the invisible
flow close: no staging, because it happens entirely above the fold, and the
compensation — the entry's height plus the 14px of net margin the includes
box takes to the grave — is subtracted from render()'s scroll keep before the
restore. Chrome's scroll anchoring would have absorbed this silently and made
a broken close look perfect; `#view{overflow-anchor:none}` is deliberate, so
the app pays its own bill or the defect is visible. That is F6's mock lesson,
kept.

**The auto-close reads its height from the observer's entry.** The one number
the compensation needs arrives in the callback that decides to close —
`boundingClientRect` on an IntersectionObserver entry is delivered geometry,
not a forced layout, and the string is not the one section 120 refuses. No
new pins.

**What a tick does mid-drop.** Rows visible under the dropped belt are
tickable; render() rebuilds `#view` and regenerates the dropped classes from
`S.beltDrop` — the drop is state, not a class, exactly because the plan warned
that a checkbox tick would otherwise silently un-drop the belt. The scroll
listener re-arms idempotently from beltWatch() after every render.

## The pouch that was a window, and the header that walked through the belt

3.6.1, from the drop's first evening of soak. Both findings are the same
lesson the mock taught four times — a treatment correct in the state you
pictured, wrong in the one you did not — arriving one layer down, in paint.

The pouch rows never had a background. In the flow they sit directly on the
page's `--ink`, so transparent and opaque render identically and nothing ever
looked wrong — including in jsdom, which does not paint, and in every guard,
which reads text. Dropped over a list, the rows were windows. The fix is
`background:var(--ink)` on the row itself: the same pixels at Home, a surface
over content. One construction, both states — F13's rule applied to paint.

The pinned era headers share the strip's flow stack level (z2) and come later
in the document, so a pinned header painted over the dropped pouches (z1) and
over the dropped strip where they overlapped. The dropped pair now rides at
z21/z20 — above every pinned header, below the app header's z30, which the
belt parks behind on purpose. The flow levels are untouched; the raise is
scoped to `[data-drop]`, because the dropped treatment applying outside the
dropped state is the mistake this feature exists to have learned from.

And the gate got honest *(historical — this describes the JS probe 3.6.0
shipped; 3.6.4 replaced it with the CSS `@supports` rule, see "Why the drop
is gated" above)*: `supportsAnchor()` probed `position-anchor` alone
and vouched for `anchor()` and `anchor-size()` too. A browser in the gap —
a partial implementation, exactly the kind that ships first — would have
dropped broken pouches when the correct answer was Stage B's calm scroll
home. The gate then probed all three primitives, in the exact `calc()` shapes
the CSS uses. An instrument used to rule something in must be able to see it,
too.

## `top` does not stop existing when `position` changes

3.6.2, and the sharpest lesson of the belt series. The strip's sticky parking
needs `top:calc(var(--hdrh) + var(--belt-peek) - var(--beltH))` — 37px. The
held rule (an open belt) switched `position` to `relative` and left `top`
alone, and a relative box honours `top`: the open belt rendered 37px below its
flow box, directly on top of its own pouches, from 3.5.0 until this patch.

Why three rounds of verification missed it: jsdom has no layout, so guards and
smoke cannot see a visual offset; the Chromium drives tested the open belt
only for what F14 claimed about it — that it scrolls away and never parks —
and never measured where it stood while open at the top. The screenshot that
found it took one probe: the pouches' top edge read 37px above the strip's
bottom. The drive suite now measures the open-at-top seam, and guard 128 pins
`top:auto` in the held rule with the story in the failure message.

The general form, for the register's family of state-scoped treatments: a
rule that changes which positioning scheme applies must account for every
property the old scheme was using. `position` names the scheme; `top` is the
scheme's argument, and it survives the switch.

## The drop arrives closed, and a selector is not a door

3.6.3, both halves from the owner's soak, and both are the same correction:
the drop had inherited behaviour from contexts that no longer applied.

The design doc's tap description said the drop "opens its pouches in place,"
and 3.6.0 shipped that reading. The doc's own state machine disagreed —
Dropped (the belt whole, with a shadow) and Open (belt + pouches) were always
two states with the buckle between them — and the owner's soak sided with the
state machine: a drop that always opens everything gives you a control panel
when you asked for a belt. beltDropOpen() now sets the drop and nothing else;
F7 is untouched, because the buckle opening pouches in place from a dropped
belt is exactly what it already did.

The path segments' scroll-to-top predates the belt being usable anywhere but
the top of the page: when choosing an ordering could only happen at the top,
scrolling to the top was invisible. From a dropped belt it discarded the one
thing the drop exists to keep. The jump is now gated on !S.beltDrop — kept
for the chooser deck and the viewing-banner buttons, where going to the head
of a re-sorted list is the point — and the guard's message keeps the owner's
own formulation: it is a selector, and home is above, in the app name.

## The belt's edges — and the cut that never rendered

3.6.4, three owner soak calls from the corrected drop's first evening, plus
one correction the owner made mid-build that is worth more than the three
fixes together.

The drop arrived in one frame. Not because nobody wrote the motion — the
strip carries a .22s `top` transition that the retraction rides up every
time — but because render() rebuilds the strip, and a freshly created
element has no old value to transition from. The entrance the design always
described ("the belt slides down over the list") had silently never existed
in the shipped app. It is now a keyframe, `data-toast`, scoped to the drop's
one render the way beltOpening scopes the pouches' entrance (the 2.2.1
replay lesson), travelling exactly the retraction's 34px so arrival and exit
are one motion read in two directions.

The stack's second seam was a gap wearing a tuck's clothes. F9's numbers —
types row inset 11px, pulled up 5px — shipped against a format row that
still carried 6px of bottom margin, and adjacent margins collapse:
6 + (−5) = 1px of daylight between the pouches. At Home the page's own
colour filled it and no instrument ever saw it; dropped over a list it was a
1px window — the 3.6.1 transparent-pouch finding at one-pixel scale, and the
owner's "not always almost there" is exactly that state dependence. The
margin is gone; every seam in the stack now overlaps (belt over format by 4,
format over types by 5), one construction in both states.

The third call — "when changing tabs, if already hidden, it should remain" —
was answered twice, and the first answer is the one to remember. It kept the
scroll-derived park and added state to carry it across tab changes:
S.beltHide following the sentinel, a render flag, a reveal armed by the
sentinel leaving, and a parked strip re-rendered as position:fixed, anchored
to the guide with the same CSS the pouches use. The harness Chromium drew it
pixel-perfect on every tab at two viewports; the guards held it; the drive
passed sixteen checks against it. **On the owner's machines — Chrome, Brave,
Edge, desktop and mobile — the sliver never rendered at all.** Six browsers,
no peek, a belt reachable only by knowing to scroll.

That failure was never diagnosed to a line, and deliberately so. The owner's
correction reset the frame: "the utility belt from Batman — once you choose,
it stays under the header, so you can use it whenever. You don't use it
much, but it needs to work perfectly." Parked is not a place the belt gets
to by scrolling; it is where the belt lives once a path is chosen. And a
control that must work perfectly cannot stand on the newest CSS on the page.
So the second cut deletes rather than fixes: the peek is the same sticky
strip it always was, pulled up under the header by a margin
(peek − beltH − main's 18px − the sentinel's 1px, which stops collapsing
against a margin that negative), rendered from S.path — no position rule, no
anchor, no observer involvement, no state bookkeeping, nothing left for a
browser to lack. The hidden-state machinery, the reveal gesture, the tab
carry and the JS anchor probe all went with it, and guard 130 now fails on
their RETURN as loudly as on a removal — machinery for a state that cannot
exist is where the next soak report lives.

The pouches are the one place anchor CSS remains, and the gate moved into
the stylesheet: the anchored rule sits inside @supports naming the three
exact shapes it uses (the register's one-property lesson, now structurally
incapable of drifting from the rule it vouches for), over a fixed-position
fallback whose top is a constant the pinned strip guarantees —
--hdrh + --beltH − 4px, the same tuck — and whose left/width are the
column's own arithmetic. The fallback exists because the peek became the
belt's only door: the old no-anchor answer was "scroll home and use the
belt there," and there is no there any more. Older Safari and Firefox now
get a working belt; their residual cost is at most half a scrollbar of
pouch centring on desktop, the F11 number, recorded here so it is a known
trade and not a future finding.

One more note for the instrument register's spirit: the harness Chromium
certified the anchored peek that six real browsers refused to draw, and the
project still does not know which line they disagreed on. When the platform
feature is new and the harness is one engine at one version, a green drive
is evidence about that engine, not about browsers — the wire/tree lesson,
one layer down. The second cut's answer is the standing rules' inverse
move: restructure so the question disappears.

## The install seat, and the footer split

3.7.0. The site had been installable since the manifest and the service
worker shipped, and told nobody — the only person who had installed it was
the owner, who knew to look in the browser menu. The fix is one quiet block
in Progress, under the saves-line, and its whole design is a list of
refusals recorded in guard 131:

It renders only where it can do something. Chromium engines fire
`beforeinstallprompt`; the listener calls `preventDefault()` — otherwise
Chrome draws its own mini-infobar, which is exactly the banner this seat
exists to replace — and holds the event for the seat. The button renders
only while an offer is held. On iOS no prompt API exists, so the seat
renders a one-line Share → Add to Home Screen hint instead, dismissible
forever; `insOff` persists only as true, following `progOpen`'s
only-true rule, because persisting a default flips it the next time a
build changes one. Inside the installed app (`display-mode: standalone`,
or `navigator.standalone` on iOS) the seat renders nothing at all — an
install button in the installed app is furniture that forgot to remove
itself.

`prompt()` throws if called twice on one event, so the handler clears
`installEvt` before prompting. If the reader declines, the button sits out
the rest of the session and Chrome makes a fresh offer on a later visit.
That is the quietest failure mode available, and it was chosen on purpose.

The button is the `bkbtn` outline, full width, and never a fill. Progress
already carries two bone fills ("Create backup code", "Share the night");
signal fill is state, crimson is danger, and an element that exists on one
platform and not another cannot hold primary weight without the tab reading
differently on an iPhone than on a Pixel. The copy does the selling
instead, because the pitch was already true: works offline, progress
already here.

The same release split the Progress footer. The availability note and the
dates note are truths about watching, so they moved to `watchNotes()` on
Next up — the tab where watching happens — and Progress kept the machinery:
the saves-line and the build line, which names the build and points at the
source. Each sentence lives in exactly one place. Guard 121's drift lesson,
applied before the drift instead of after.

## A removal is a fact, and the clocks that finally made it one

3.8.0, from the 11 Aug durability review — reviewed in-project, three of its
premises failed the review and the ranking that survived is what shipped.

**The defect class, stated honestly:** marks were never grow-only.
`toggleWatched` unmarks, `toggleSkip` deletes, `rate()` clears on a same-star
tap — while every merge site (the storage listener, `doRestore`, `applyImport`)
only ever added. So every individual removal resurrected cross-tab the moment
another tab wrote. 3.7.2's `resetAt` closed exactly one case, the full erase,
and its shape — a monotonic clock the merge consults before adding — is the
shape the whole fix wanted. Ratings were worse than additive: no timestamps at
all, keep-local on merge and incoming-wins on restore, which is two different
wrong answers for one question.

**What ships:** every mark, skip and rating carries the time it last changed,
in either direction — `S.clk = {w, s, r}`, `clk` in the live payload. The
cross-tab merge is last-write-wins wherever a clock exists on either side; a
clock whose mark is absent IS the tombstone. `resetAt` stays first and stays
separate: it is the largest tombstone, the one that covers ids no clock map
has heard of, and an erase restarts the clocks under it. The recorded "the
merge only ever adds" decision is AMENDED, not voided — a clockless payload
(an older build's) still merges additively and restores still only add; what
changed is that a deliberate, clocked removal now outranks an addition nobody
re-made. Guard 134 holds the shape, smoke drives every leg through the real
listener, negtest400 re-introduces the defect leg by leg.

**What deliberately does not ship:** clocks in the backups. `exportJSON()` and
the NW code are one-shot transports a person applies on purpose; they merge
additively at apply time with a fresh clock, and guards 7/8/87's format
stability is worth more than sync fidelity a backup was never promised to
have. The review's items 4 and 5 (a file handle, an E2E blob on a Worker)
stay parked — the clocks are their precondition, and the precondition is now
met, which is the point.

**The persist() ask (item 1):** `navigator.storage.persist()`, once per
session, on the first mark — never on a bare load, so a first visit is never
greeted with a permission prompt (Firefox may show one; Chromium decides
silently from site engagement). Be honest about what it buys: it defends
against CHROMIUM's quota eviction and nothing else. The Storage Standard put
every script-writable store in one origin bucket — clear-site-data, Safari's
ITP wipe and Chromium eviction all take localStorage and IndexedDB together,
which is why the review rejected the proposed IDB mirror outright: a second
copy in the same bucket is bookkeeping, not durability. The install seat is
the real iOS answer — a home-screen app is exempt from ITP's seven-day wipe —
and its copy now says so instead of half-knowing it.

**The nudge (item 2):** `lastExportAt` stamps when a code is made or a backup
file actually downloads (not on a failed download — the stamp is the claim
that a copy LEFT). Ten or more marks newer than max(lastExportAt, bkDismissAt)
and the Your-data block says so; "Later" stamps `bkDismissAt`, numeric,
persisted only when set — the only-true family, `insOff`'s pattern — so a
dismissal is not forever, it is "until ten NEW changes." The count reuses the
merge's own clocks (`marksSince()`); a second bookkeeping structure for "what
changed since" would drift from the first the way all second copies here
always have.

## The root negotiates markdown, and what was declined to get there

3.8.0, the one repo-side recommendation of the 10 Aug Radar triage. The
agent-readiness report gates Level 3 on a single item: answer
`Accept: text/markdown` on `/` with a markdown representation. The
representation already existed — llms.txt — so the honest implementation is
30 lines in front of the assets, not a second document.

`worker.js` is the first `main` script this deploy has ever had, and its
entire design is containment. `run_worker_first` is `["/"]`, so only the root
pays the Worker hop; every other path — sw.js, the fonts, the icons — stays
on the assets plane where worker code cannot intercept, slow, or break it
while down. Inside the script the gates repeat (GET only, pathname `/` only,
explicit `text/markdown` strictly preferred over `text/html` — q-values
parsed, ties and wildcards to the page), because wrangler scoping is edge
config and the script must refuse on its own. The markdown branch fetches
`/llms.txt` through the ASSETS binding — one source — and answers
`text/markdown; charset=utf-8` with `Vary: Accept` and `Content-Location:
/llms.txt`; if llms.txt is unreadable the negotiation quietly does not exist
and the page answers instead. Everything else returns the assets response by
reference, untouched.

Cloudflare's managed "Markdown for Agents" toggle would have done this in one
click, and was declined on the `_headers` lesson: a dashboard panel is
undiffable and unguardable, it needs a paid plan, and it strips validators
from converted responses. The 3.4.2 stale-Permissions-Policy release is the
standing argument — edge config wins over the tree, silently. This file is in
the repository; guard 133 EXECUTES it, the way 132 executes sw.js (it is
written in `.then()` chains, not async/await, precisely so the sync-thenable
harness can drive it to completion in one call stack), and the passthrough
assertions are identity checks — the response OBJECT the assets mock
returned — which is stronger than byte-for-byte. RELEASING.md reads the wire
after every deploy, both branches.

The rest of the scan was triaged to "no action" on the record: the rel types
the checker wants (`api-catalog`, `service-doc`) describe APIs this site does
not have, the Protocol Discovery and Commerce checks presuppose an auth
surface or a checkout, and publishing discovery documents for services that
do not exist is anti-hardening. DNSSEC — the scan's one classic red — is a
panel action by necessity (DNS is already panel-owned per the wrangler
custom-domain rationale) and its wire check is written down in RELEASING.md
next to this feature's.


## One donut, the belt's — and the footer finds its voice

The 3.8.1 round is three owner calls about the app agreeing with itself, and
the donut is the one with an actual defect underneath. Progress drew two
charts — the universes and the eras — whatever the belt said. Two of three
orderings had a donut; the third was the hole: choose Release order and
neither chart was yours, and the "chosen ordering" premise (the 2.0.0 Belt,
the whole reason `S.mode` exists) stopped one tab short of Progress. The fix
is subtraction, not addition: ONE chart, keyed off `S.mode` exactly the way
Home's grid heading already is (`GRIDNAME[S.mode]`), re-rendered by the same
`render()` a belt tap already fires. There is no listener to add and no state
to sync — a donut that disagrees with the belt is now a state that cannot be
rendered, which is the only kind of "reactive" worth shipping in this file.

Two things came with it, both consequences rather than features. The chart
doubles its rendered cap (148 → 240px) — with one chart the flex row's excuse
for small is gone, and the slices are tap targets, which puts them under the
44px conversation the guards already have about everything else; a slice of a
148px ring split two-up never had a defensible answer there. And Release
order's donut needed decade groups on Progress, so the "d" kind joined
`groupFilms()` and a third fold — By decade — joined the two below the chart.
The fold is not decoration: the slices are pointer-only on the record
(`.srow`'s own entry, above), so every donut a pointer can tap must have rows
a keyboard can reach, and until now the decades had neither.

The other two calls are typography agreeing across views. The Path's title
wore `clamp(20px,5.2vw,27px)` against the Next up hero's
`clamp(24px,6.5vw,36px)` — the app's main view had its smallest hero — and
its `.modenote` description sat at 12.5px in `--dim` while both hero blurbs
speak at 14.5–15px in `--dust`. Both now carry the hero scale. And the two
lines that read as "footer" — Home's colophon and Progress's build line —
said the same kind of thing in different typefaces: `.homefoot` is mono, 9px,
uppercase, tracked; `.buildline` was 12.5px body type. The build line now
carries the same mono voice, as CSS on the class it already had. Deliberate:
the markup did not move. Guard 98 pins the `updated `+BUILT+` … read the
source` shape with no tag between the date and the anchor, negtest273 pins
the ` · ` before the link at ≤10 characters, and negtest330's fixture anchors
on `.buildline{display:block;` — so the new declarations are APPENDED to the
rule, and the byte the fixtures hold onto is exactly where they left it.
`watchNotes()` on Next up joined the same voice on the owner's word — the
two watching-truths close that view the way the colophon closes Home, so
they read as the same fixture (a `foot` modifier on their existing `.note`
class; negtest131's anchor on the dates note moved with the markup). The
legend on The Path stayed body type: it is a key to the badges above it,
content that happens to sit last, not the app signing its name.


## The donut becomes the skyline

3.8.1 made the Progress chart the belt's; 3.8.2 makes it legible. The owner's
observation, verbatim in spirit: when the belt says By universe there are 33
groups, and 33 slices on a ring is a barcode wearing a circle — the slice
labels were never there, the tiny arcs were untappable, and the share-of-
catalogue encoding survived only for the handful of big universes. Past a
handful of classes a pie stops being a chart; that line is in every honest
form guide and the universes crossed it long ago.

The replacement keeps the donut's entire grammar and throws away only the
circle. The skyline is one flex row of bars: each bar's WIDTH is the group's
share of the catalogue (flex-grow is the film count — layout does the
arithmetic), its yellow FILL rises bottom-up as the group completes, e0 keeps
its steel, and tapping a bar jumps to the group. Two mockups lost to it on
the record: a left-to-right stacked strip (partial fills inside a 5px
segment read as random stripes — the barcode again) and a per-group bar
LIST with names (best touch targets of all, but 33 rows deep in universes
mode and a duplicate of the fold sitting right under it). Bottom-up fill is
the one treatment where a 5px column still reads: dark means untouched, full
means done, and a partial height is a partial height at any width.

It is the view's hero and it is sized like one — 88px tall, no percentage
headline, because the header ring one thumb-width away already says the
number and a second copy would be guard 121's drift lesson waiting to
happen. The card's sub carries the counts and the one-line key instead
(width is size, fill is watched), which is the label the donut never gave
its slices.

The bars are BUTTONS — data-act="jump", aria-labels with name and count —
which quietly closes the oldest accessibility note in this file: the chart's
jumps were pointer-only from the day the donut shipped, and now the chart
rides the same delegated path as every row. The g[data-seg] branch left the
view delegate with the SVG; one path, one handler. The thinnest bars are
still thin — a 1-film universe is ~4px and the fold rows below remain the
comfortable route to it, which is half of why the folds all stayed.

## The box that stood still, and the hat by the door

Three small things shipped as 3.8.3, and each carries a lesson worth keeping.

The search box had been jumping since forever, and soak finally caught it in
the act. The mechanism was ordinary: every debounced keystroke rebuilds
`#view`, and the refocus that follows used a bare `focus()` while the button
path one branch above had carried `{preventScroll:true}` for versions. A bare
focus is an instruction to the browser to make the element visible, and the
browser obliges by scrolling — straight into a fight with the `scrollTo(0,
keep)` restore two lines down. When matches shrank, a second fighter joined:
the page got shorter than `keep`, the restore clamped, and the box hopped
again. The fix is symmetric measurement: read the box's viewport `top` before
the rebuild, refocus without scrolling, restore, then `scrollBy` exactly the
drift. The box now holds still because we measured where it was and put it
back — not because we asked the browser nicely.

The darker theme's primaries were the other soak note. Bone (`#E7E9F0`) on
pure black is a flashlight; on the default theme's near-black it is merely
bright. Four directions were mocked — signal fill, steel fill, a dark ghost
with a yellow outline, and dimmed bone — and the owner picked the smallest
one: dimmed bone (`#AEB6C8`), darker theme only, primaries only. One new
variable (`--bonebtn`) carries the whole decision, the default theme keeps
its bone, and every pressed state keeps its meaning. The smallest change
that ends the glare is the right size of change.

The support element is the story of the release, and what shipped is
nothing — which took three builds to earn. The full Home card came first:
heading, blurb, the BTC address truncated-but-verifiable with
copy-to-clipboard, a QR behind a toggle whose 29×29 matrix was hex-packed
into 232 characters and unfolded to inline SVG in fifteen lines, because
the vendored QR encoder left this codebase in 1.2.4 and was not invited
back. It ran green through everything — guards, smoke, 45 negative suites,
a browser drive that scanned the rendered QR back to the address — and the
owner killed it on sight: too big, too loud, wrong for Home. The 38px pill
that replaced it lasted one look longer. The four words of mono that
replaced the pill — `sponsor ↗` riding Progress's build line after `read
the source` — were the right size at last, and then the owner opened the
Sponsors signup and found Stripe's onboarding on the other side: legal
name, date of birth, home address, bank account, government ID, tax form.
The same personal-info surface that ruled out PayPal and Ko-fi a day
earlier, wearing a friendlier logo. So the link came out too.

The lessons stack. Passing the harness says nothing about whether a thing
should exist at that size — the card was flawless and wrong. And a
support channel is not chosen by its widget but by its custody chain:
every fiat rail ends in a KYC form somewhere, and if the bar is "no
personal data", the honest answers are crypto, or nothing. Nothing shipped.
The theme chooser took the opposite trip in the same review — it sat
centered at 230px and now spans the column like everything else on Home.

And the weight: the full card did not fit under 200 KB, because 3.8.2 left
1.8 KB of headroom, so the question went to the owner as arithmetic and the
answer came back as the fifth raise — 220, sized deliberately past the
feature to make room for the 4.0.0 swipe work. Then the feature evaporated
and the file walked back under the old line anyway. The ceiling stays at
220: it was set for what is coming, not for what shipped, and the guard now
fails at 220 exactly as it failed at 200 — a recorded decision, never a
drift.

## The deck goes sideways, and the scrollbar finally learns its place

4.0.0 is release two of the tab swipe, the half the 3.9.7 record promised:
release one moved scrolling off the document onto `#app` so that this one
could change *what swipes* without touching *where scrolling lives* in the
same breath. Now `#view` is a horizontal scroll-snap viewport (`x mandatory`,
`scroll-snap-stop:always` so a hard fling crosses one tab and never three)
holding four persistent panels, one per footer tab, and each panel is its own
vertical scroller. `#app` is pure frame. The footer tabs stay plain buttons
with `aria-current` — a swipe and a tap are two doors into the same state,
and the swipe door adopts the chosen path exactly the way the tap door
always has.

The owner's one styling ask rode along free: the scrollbar now hides below
the header the way it always hid below the footer. That is not a scrollbar
style — it is the scrollport's top edge moving to the header's bottom, which
is also why every sticky offset became panel-relative in the same commit
(`--ghtop` is just the peek now; `--hdrh` remains only for the dropped
pouches' fixed fallback and flagSave's banner override — both measure from
the viewport, which still contains a header). Before the deck is built,
`main` itself scrolls, so a no-JS reader gets the seed, and the same
below-the-header scrollbar.

Rendering is dirty-flag: `render()` fills only the active panel
synchronously and marks the other three dirty; `queueNeighbors()` re-fills
the adjacent panels in idle time (`requestIdleCallback`, `setTimeout`
fallback); the far panel waits until a swipe makes it a neighbor, which
snap-stop guarantees happens before it can be seen. `tickUpdate`'s surgical
path does the same bookkeeping, because a tick repaints one row in The path
while Home, Next up and Progress all changed underneath it. Background fills
never render the belt's open or dropped state — the drop is a way of
standing in the panel you are holding, and two live copies of one belt is
the defect negtest250 was written after — and a background panel's strip
drops its `anchor-name`, so the pouches can never hang off a copy one
viewport to the right.

The active tab is read off the swipe by the app's second-ever pinned scroll
listener: `swipeTick` on `#view`, passive, rAF-throttled, reading
`scrollLeft` exactly once per frame (section 120 pins that read) and
dividing by a width a `ResizeObserver` *delivered* rather than one anybody
read — `clientWidth` stays refused. There is no `scrollend` (Safari shipped
it years late; the settle is the snap arithmetic `|x − i·w| < 2`) and no CSS
`scroll-behavior:smooth` (it fights snap in some engines; deliberate smooth
scrolls already route through `calmScroll()`, which honors reduced motion).
Settling is when `inert` sweeps: non-active panels are out of the tab order
and the accessibility tree in one attribute, and mid-swipe the outgoing
panel stays live until the snap lands. The programmatic tab change is
`scrollIntoView` on the panel — the browser's own alignment, no arithmetic
to drift, no write for section 120 to count. Resize re-snaps from the same
observer that delivers the width, so rotation cannot strand the deck
between panels.

Two seams were widened rather than added. `scrollKeep`/`scrollPut` take an
optional element so background fills can preserve their panel's place
through an innerHTML swap — still one `scrollTop` read and one write in the
whole file. And the drop's one-shot retraction gained a disarm
(`disarmDropScroll`): the listener arms on the *active panel* now, and
`{once:true}` only removes a listener that fired — without the disarm, a
tab change strands it armed on the old panel and `dropArmed` never resets,
so every later drop would arm nothing and never retract. The belt's
auto-close observer rebuilds when the active panel changes, because an
IntersectionObserver's root is fixed at construction, and its threshold
compares against `rootBounds.top` — the panel's top, where "scrolled out of
view" actually happens now — instead of the viewport's 0.

The accepted iOS cost is unchanged from 3.9.7 (the toolbar never collapses;
the document it collapses for never moves), with one addition named in the
plan: horizontal swipe on the deck and horizontal swipe-back-from-edge are
adjacent gestures on iOS, which is why the viewport contains its
overscroll-x — a swipe past Home stops at Home instead of leaving the app.
The chips rail contains its own overscroll-x for the same reason one level
down: the end of the universe chips must not hand the fling to the deck.

The same afternoon, the owner's phone filed the release's first two soak
notes before the tag was cut, and both were the install surface — the one
place no instrument in this repository runs. The installed app's footer
floated a toolbar's height above the home indicator: `position:fixed;
bottom:0` in iOS standalone can anchor against browser-chrome metrics for
chrome that is not there, and so can `svh`/`dvh`. The fix removes the
question instead of answering it — the bar is the frame's third flex member
now, ending where `#app` ends, and a `(display-mode: standalone)` media rule
pins `#app` to `100%` — the second phone screenshot of the day corrected the
first cut of this rule, which used `100vh` and cut the bar's labels below
the fold: iOS granted the installed WebView a viewport ~48pt shorter than
the screen, and every vh-family unit reported the screen anyway. The ICB is
the viewport iOS actually laid out, and cannot overshoot it; if iOS grants a
short WebView, a short frame with a whole footer beats a full-height frame
with its footer cut mid-button. The panels stop underneath it, so the runway
padding lost its tab-h arithmetic and the scrollbar now terminates at the
bar the way it terminates at the header — the symmetry the release was named
for, completed by a bug. And the home-screen icon was a quarter of its tile:
`make-favicon.py` pasted the 512 canvas at 78% and trusted its proportions,
but `icon.png` is an opaque rounded tile with margins of its own — 95% of
its pixels carry alpha, so `getbbox()` answers the tile and not the bat. The
generator finds the signal-yellow ink by colour now, crops to it, and scales
that to 80% of the tile on the tile's own sampled ground (the first cut
declared the ground and got a faint rectangle — two near-blacks are still
two blacks; the second samples it). The greyscale dock icon was iOS's
tinted-icons mode and was left exactly alone.


## The band iOS paints under the installed app, and the one hand that reaches it

4.0.5. The dead band under the tab bar — installed app only, surviving a
force-quit — is the endgame of the viewport story above. Two ten-second tests
on the owner's phone did what three releases of layout reasoning could not.
A finger dragged inside the band moves nothing: the band is OUTSIDE the
webview, so it belongs to iOS and no height, anchor, padding or unit in this
file will ever paint a pixel of it. And switching the app to the darker theme
turned the band black: iOS paints it from `<meta name="theme-color">`,
through a Liquid Glass frosting that lightened the dark theme's `#0C111C`
into a visible grey stripe — and returned `#000000` unchanged.

So `applyTheme()` answers the meta with black whenever `isStandalone()` —
both themes — and keeps the theme's own colour in a browser, where the meta
paints real toolbar chrome and the band does not exist. The band reads as
bezel now. Its height is still lost: the tab bar sits a phantom toolbar
above the true bottom until Apple stops resolving the standalone viewport
against chrome that is not there. If a future release is tempted to reclaim
that height with `lvh` or `screen.height`, read the 4.0.2–4.0.4 story first:
every vh-family unit reported the full screen while iOS granted less, and
laying out into the ungrated remainder cut the bar's labels below the fold.
The ICB is the only measure that cannot overshoot what iOS laid out. Guard
28 pins the branch; negtest475 proves the pin bites.


## The heal: the band was a viewport nobody ever re-asked about

4.0.8. The owner named the mechanism before the research did: the band under
the installed bar was never a problem while the document scrolled, because a
document scroll is the event that makes WebKit re-resolve its viewport. 3.9.7
moved scroll onto `#app` and the document went silent — so the stale grant
WebKit hands a standalone app at cold start (a collapsed-browser-chrome
height, for chrome that does not exist there) simply sticks. `height:100%`
fills the short number honestly, and the remainder is the band. Three fixes
missed because each changed what the frame believes; none made WebKit
re-measure.

`vpHeal()` is the re-measure: hide `#app`, force one layout, show it — all in
one task, so nothing paints in between and there is no flash. The same move
heals the documented iOS bug where the keyboard shrinks the viewport for good
(this app has a search box and an import panel). The gates are load-bearing,
not caution: standalone only; portrait shrink over 24px, because iPad windows
and desktop installs are legitimately short; never while an input holds focus,
because `display:none` blurs it and eats the keyboard mid-word; tries capped,
because if the short render is REAL the heal is a no-op and must not spin. The
scroll survives through the seam (`scrollKeep`/`scrollPut`) and the deck
re-snaps (`snapTo`) because `display:none` zeroes a scroller's positions. The
census admits `innerWidth`/`innerHeight` (window metrics, the two gate reads)
and argues `offsetHeight`'s second appearance: that forced reflow IS the fix.

## The glow stopped pulsing, and the history of why it kept being almost right

Same release. "Why was it OK before the swipe?" — because before 4.0.0 the
glow sat on the belt strip, on opaque card, in the content column, where an
animated box-shadow is cheap. The swipe rework moved the handle onto the
header's live backdrop-filter, and an ANIMATED box-shadow over a blur layer
repaints the blur every frame — the on-device glitch. Four shape tweaks in a
row could not fix it because the shape was never the fault; the animation was.
The glow is static now: the owner-tuned two-layer corner hug, permanently on
while parked. Nothing repaints, nothing glitches, reduced-motion needs no
carve-out. A keyframe returning to the peek must be argued against the
repaint bill — the guard refuses it by name.


## The probe's verdict: the render is short, and the pad was the part we owned

4.0.9. `vp.html` on the owner's phone, installed: screen 874pt, granted 812 —
`svh`/`dvh`/`innerHeight` agree at 812, `vh`/`lvh` claim 874, and the stripes
prove it: nothing paints below 812. The short render is REAL on iOS 26; the
16 Aug `height:100%` decision was correct; the heal cannot cure the cold
start and now gives up after one unchanged re-measure (it stays for the
keyboard bug). What the app owned: `env(safe-area-inset-bottom)` still says
34 inside a viewport that ends 28pt above the home indicator, so the bar was
padding for hardware it cannot reach — `vpSync()` writes the measured gap to
`--vpdead` and the pad pays it back. And the canvas below the app is black
now (`body{background:#000}`, `#app` carries `--ink`), because iOS frosts the
bottom edge: navy frosted to the owner's grey stripe, black frosts to black —
the one region the app cannot render reads as hardware bezel. If Apple ever
returns the 62pt, `--vpdead` goes unset by its own measurement and every one
of these reverts to a no-op without an edit.


## The card's two charts become one

4.1.0. Since 3.8.2 the app has had one progress picture — the skyline: every
universe a bar as wide as its share of the catalogue, yellow rising bottom-up
as the group completes. The share card kept drawing an older cousin: equal
widths, height standing for size, a 50% wash. Anyone who read the app's chart
and then the card's had to learn two grammars for one fact. The owner ran a
mock round (four cards side by side: as-shipped, a deco-free mono swap, a
full-bleed "Gotham hero", an Anton masthead) and chose the smallest true
change: keep the composition, keep Limelight — bigger, 96px — and put the
real skyline in the card.

The canvas skyline earns its arithmetic the way the app's flexbox does: ideal
width is the group's share of the 1048px band, one-film continuities get an
8px floor, and the wide bars pay for it pro-rata (`squeeze`) — one pass,
exact, because clamping only ever raises the thin and shrinking the wide
never pushes them under the floor. The fill is SOLID signal now, where the
old chart washed it to 50% and told completion apart by nudging alpha to 62%.
That tell is gone on purpose: a finished card is every tower lit plus the
yellow bat, and the app's own chart never dimmed its yellow either — the card
stops being the one place the signal color arrives diluted. Skips cap their
bar in steel, same stacking as `skyline()`. `roundRect` clips the corners
where it exists and the card stays square where it doesn't, because a 5px
radius is a nicety and a hard requirement would cost the toBlob browsers
nothing was wrong with. The bottom block did not move — rule 1590, strapline
1700, domain 1750, the bat at its 2.7.1 seat — so guard 108 held through the
whole change, which is the point of pinning a composition: the chart could be
rethought inside it without the frame drifting.

## The README goes on a diet

4.1.1 cut over a thousand words of history from the README, and this section
is where the trimmed reasoning landed, because the rule is that nothing moves
out of the tree — it moves here.

**What left, and where it already lived.** The beta-era note, the mirror
unpublishing narrative, the aggregator attempts, the beacon's retirement, the
five weight-ceiling raises, the 2.7.0 font subsetting arithmetic, the guard-138
origin story and the 1.6.5 cold-start lesson were all prose retellings of
CHANGELOG entries. A history that lives in two files drifts in one of them;
the CHANGELOG's copy is the record and now the only copy. The edge-injection
correction (a TLS-intercepting VPN on the author's machine, not Cloudflare) is
recorded in the 3.4.4 CHANGELOG entry and `ops/c0-edge-injection.md`,
maintainer-local. The cold-start verification rule — verify a new state from a
cold start, never from the state that produced it — is a live release rule,
not history, so it moved to `RELEASING.md` where the release checklist lives.

**The file table's reasoning, moved from the table.** `icon.svg` is a real
file rather than a `data:` URI because search engines crawl the favicon, and a
data URI has no URL to crawl and no content type on the wire. `favicon.ico`
keeps the classic root path — 16/32/48 in one container — for the crawlers
that ask for it and accept nothing else, and sits out of the offline shell
because a favicon is browser chrome the app never renders. The three favicon
PNGs exist for tools that read `<link>` tags rather than probing the root ico,
same downscale as the ico's layers. `apple-touch-icon.png` is opaque on the
ink ground because iOS ignores the manifest icons and composites transparency
onto black — the ground is chosen there, not by iOS. `mstile-144x144.png`
pairs with `msapplication-TileColor`, which paints the ground behind it. The
IndexNow key file's name and contents are the same string and a trailing
newline breaks the match; it sits out of the offline shell for the reason
`llms.txt`, `orders.txt` and `auth.md` do — written for machines that never
run the app. `sitemap.xml` gained its second URL in 3.7.1 because nothing on
the open web pointed at the one file written to be found. `_headers` lives in
the tree because a file here can be diffed, guarded and shipped inside a
release, where a dashboard rule can be none of those — edge rules CAN override
it, the lesson is recorded in the file itself, and the wire check lives in
`RELEASING.md`. `vp.html` paints five height units as stripes plus the numbers
iOS actually grants, for the standalone bottom-band investigation; owner-facing,
never linked, and it leaves with the question it answers. `qa/browser-check.mjs`
measures inside the click's own task because a scroll clamp and a lost focus
both self-correct within a few hundred milliseconds, and a drive that waits is
green against either.

**What the guards hold, moved from the Checks section.** The README's four
paragraphs restating guard sections in prose were a third copy of rules that
exist as numbered, negative-tested sections in `qa/guards.js` with their
reasoning attached. The README now points there; the guards file was always
the honest statement, because it is the one that runs.

## The deco release: one face, a real dark, and the cut

4.3.0 is the feature the whole 19 August audit cycle kept clearing the runway
for, and all three of its changes are one idea: the page finally commits to
the deco it has been gesturing at since Limelight arrived.

**One face.** Anton was hired in 1.0.0 to be "condensed and loud" and spent
four months reading sports-poster in an Empire State lobby. 4.2.0 already
took the numbers away from it; 4.3.0 takes the titles too, and the face that
takes them is the one the numbers went to — Big Shoulders Display, the same
Chicago-deco family `--deco` has named as Limelight's fallback from the
beginning, so the taste was on record before the swap was. Big Shoulders sets
narrower and lighter than Anton, which is why the swap is not one line: every
row-title consumer takes about ten percent more size and doubles its
tracking, or the titles would have arrived looking starved. The payoff beyond
the look is subtraction — a face, a preload and 8.2 KB leave a page whose
whole premise is that one file opens instantly.

**A real dark.** Darker's recipe since 3.8.4 was to dim the bone while every
surface kept its hue — and lowering text luminance at constant surfaces is
literally what a brightness slider does, which is why the theme read as "the
same room with the lights low." A dark that reads as night does the opposite:
the surfaces drop and the structure comes up. Recipe C drops the cards toward
true black and raises the hairlines to carry the depth the fills no longer
can. The owner kept the dimmed bone — that part of 3.8.4 stays — and because
the surfaces fell under it, every measured pair still lands AAA and none
moved down. Guard 147 pins what actually matters and nothing else: not one
hex literal, but the ladder — ink under sunk under card under card2, per
theme — because pressed states lighten and the hero gradient falls, and a
theme that reorders the ladder breaks both without failing a single
colour-contrast check.

**The cut.** The mock round tried the full deco wardrobe — double hairline
frames, diamond rules, a sunburst, chamfered corners — and the panels made
the argument the style guide always makes: deco dies of ornament faster than
any other style. What survived is the 45° cut on the hero, the diamond rule
under its badges, and a gold ◆ where the meta line's plain dot was. The
hairline frame lost because the cut and the frame are two competing frame
statements; the sunburst lost outright. The cut stays on the hero because
propagating it is not a border-radius edit — a straight clip-path eats the
border it clips, so the shipped construction is a wrapper-clip (the card IS
the frame, clipped; the gradient rides a ::before inset 1px with the same
cuts, isolated under the text), and putting that on every list card means
rebuilding the card system for an ornament that works best said once.
Section 146 holds each piece of the construction separately, because every
piece — the isolation, the inset, the frame colour — fails invisibly if
"tidied."

## The offset with two sources, and the tab that was accidentally right

4.3.1 exists because the owner looked at four tabs and said only Progress had
the correct top margin. The diagnosis is the project's oldest lesson in a new
coat. The belt's bottom margin — 10px — was the offset every tab's first
content stood on, except that Progress's first block also carried a private
inline `style="margin-top:18px"`, added long ago to give the charts some air.
Two sources, and the patched one happened to be right: 18px of clearance under
the parked peek is what the spacing system wants, and three tabs weren't
getting it. An inline offset is invisible to every sweep of the stylesheet,
which is why this drifted unnoticed through releases that measured contrast,
geometry and weight.

The fix is the `--hdrh` rule applied downward: the belt's bottom margin is
18px and is the ONE source; the inline patch is struck, and margin collapse
means the tab that was right never moves. Guard 128 pins the source, and — the
general clause the patch earned — refuses any margin inside a style attribute
anywhere in the rendered markup. Five inline margins left the page in the same
commit; the widths and colours that remain inline are data, not offsets. The
browser drive now measures the result rather than the recipe: the first
painted block below the belt sits at one height on all four tabs, the assert
that would have caught the original patch the day it landed.

The rest of the release is the type ladder the Big Shoulders swap left
un-tuned: group titles back above their rows (Limelight at clamp(17px,5.5vw,20px)
over BSD 19.5 — 4.3.0 had them inverted in every open group, and the clamp
rather than a flat 20 because the 320px check showed the longest continuity
names buying the rank with a third line; every other deco landmark already
sizes by viewport, so the fixed gtitle was the odd one out twice over), the
universe cards on the same 16.5px rung as every other row title, and the
`.pick b` block deleted — Anton's last ghost, a fully-shadowed face assignment
that styled nothing and waited for someone to trust it.

## The deco pass: the cut becomes rank

4.4.0 is the whole-app answer to the question 4.3.0 opened. The hero got the
cut and everything else kept its rounded corners, and the release notes called
that an accepted cost. The owner then asked the obvious next question — make
the buttons more deco — and the mock rounds turned up a rule better than
"more": **the cut is rank.** A 45° corner on everything is a skin; a 45°
corner on exactly the things that say *where you stand tonight* is a system.
The ladder: 16px on the hero (untouched — the owner's explicit freeze), 12px
on the lead chooser card and on the group holding the film `upNext()` names,
8px on the one button that begins the night. Everything else stands square,
because the cut only reads as rank against square neighbours.

**Three cuts, three constructions.** The hero keeps its wrapper-clip because
it has a 1px frame to preserve through the clip. The CTA and the lead pick
are solid fills — bone, gold — so a straight `clip-path` IS the whole cut,
and wrapping them would be cargo cult. The here-group is the interesting one:
it is a bordered card whose header is `position:sticky` and whose box is
under `content-visibility:auto`, and a `clip-path` there would clip the stuck
header's paint and pick a fight with paint containment. So its cut is fake
and says so: two 13px corner overlays that paint the page ink back over the
corners, with the 1px `--line` diagonal drawn in the same gradient. Fake by
construction, honest by assertion — section 148 pins the overlay shape, and
the browser check measures that the marked group's header still sticks at
the same offset as every other group's, which is the interaction the
construction was chosen for.

**Why the here-group is `upNext()` and not the open group.** The mocks drew
"the open group wears the cut" — and the app's groups default open, so on a
fresh path every group would have worn it and rank would have meant nothing.
The honest anchor was always position, not disclosure: the group that holds
the next film is where you stand, it is exactly one group by construction,
and it moves when — and only when — a tick moves the frontier. That made it
a render-path claim, so the id is computed once per render in `viewWatch()`
and passed into `groupBlock()` (44 groups scanning `pool()` each would have
been the §120 lesson in a new coat), and all three surgical paths carry the
mark: `tickUpdate()` recomputes and moves it, `groupUpdate()` preserves it
through the class rewrite, and the byte-identity gate catches either of them
forgetting.

**The square family, swept rather than listed.** Forty-odd radii went to
zero, and the guard that holds them is a sweep with an allowlist of one:
`:focus-visible` keeps its 4px, named with its reason (feedback chrome, not
a control — a square focus ring reads as a second border). A sweep is the
right shape because the failure mode is not "someone redesigns the buttons,"
it is one radius creeping back in a refactor and reading as intentional
three releases later.

**Ribbing, and the tape lesson.** Every progress fill is one
`repeating-linear-gradient` of `currentColor` verticals on a `--card2`
track; the fills state only a colour. The first mock drew the stripes
diagonal, and gold diagonals on black read as hazard tape from across the
room — the vertical form is the deco one anyway (parallel verticals,
machine rhythm). `currentColor` is load-bearing: the formula lives once in
the sheet, so the guard can count its four legitimate copies and fail a
fifth, and an inline `background:` on a fill is a second implementation by
definition.

**The tick.** A diamond tick has to be rotated, not clipped — a border does
not follow a clip path, and the outline IS the unwatched state. Rotation
shrinks nothing but changes the arithmetic: the button scales .78 so the
30px box draws a 23px diamond, and the tap halo grows to −14px so the scale
buys itself back — 58 × .78 = 45.2px across the rotated square's centre,
over the 44px floor. That arithmetic lives in section 148's comment so the
next resize starts from the numbers instead of re-deriving them.

**The place has one memory (4.4.2).** The phone lost The Path's position on a
swipe away and back, and the diagnosis is worth keeping: `content-visibility`
skips a parked panel's groups, and an engine that does not remember rendered
sizes (WebKit; Chromium remembers) collapses each one to its 64px estimate —
the scroll range shrinks, the engine clamps `scrollTop`, and the background
refill then faithfully restored the clamped number. Every desktop check stayed
green because desktop is the engine that remembers. The DOM was the only
memory of the reader's place, so the fix gives the place one memory in JS:
`nwKeep`, written only where truth is available (a panel's own scroll while it
is the current tab on a parked deck, and every deliberate `scrollPut`), read
back everywhere the DOM might lie (the background refill, the swipe arrival).
And the ruler that let this through is reforged: the browser drive's swipe
check demanded the place back within 150px, which let a 116px WebKit drift
read as a pass — it now demands the place back exactly, in both engines.

**The footers close on the diamond.** A late owner call in the same release:
the four tab footers — the colophon, the availability notes, the build lines,
the legend — trade their bare `--line` top borders for the diamond rule, one
shared construction (a centre-fading hairline, a ◆ seated on ink). The plan
had said the diamond stays the hero's private ornament; the owner extended it
to footer rank, and the guard now counts the sites instead of assuming the
scope. Only the first of a stacked pair wears it. The ◆ is CSS content with
the alt-text form declared over a plain fallback, so where engines support it
the ornament is silent to a screen reader, and where they don't it degrades
to a pronounceable glyph rather than to nothing.

**The chevrons and the WebKit job.** The `\u25B6` triangle left the page
entirely — carets, fold, buckle, the all-continuities pointer are all the
`\u203A\u203A` pair on the same rotation states — and §116's system-marks
list was updated in the same breath, because an exception whose label
describes something that no longer exists is a stale claim wearing a green
check. And the parked WebKit CI job finally fired: the pass multiplied the
clip-path sites, iOS is where those ornaments actually ship, and its rider
(the 700ms jump sleep becoming a settle assertion) landed with it. The gate
rule from 4.2.4 applies to this whole release: the browser check is the
test; `npm test` only proves the shapes are still spelled in the file.

## The city: the shaft is the chart, the crown is above it

4.5.0. The Progress skyline had been a skyline in name since 3.8.2 — a row
of bars, width proportional to group size, filling bottom-up — and the story
card's chart was the same row at 1080 wide with rounded corners. The deco
pass had already decided the two would become one city; the 20 August plan
drew it with eight polygon roof forms, a beacon on the group holding your next
entry, and a reflow of the card's bottom block. What shipped was rethought on
the day so it could ship in one evening, and three things went.

**The organizing rule survived intact, because it is the whole design.**
Everything measured lives in a uniform-height shaft; the crown above it
carries no magnitude. That split is what lets one object be a skyline and a
fair chart at the same time: no ornament ever sits inside a reading. A crown
lights only when the shaft under it is already full — gold when all watched,
steel when the rest was skipped — so the reinforcement is monotone: it can add
gold to a complete building and can never make an incomplete one look further
along. `crownState()` is four tokens long and section 150 pins its exact text,
because "lit at 80%" is the obvious improvement someone will propose.

**Stacked blocks, not clip-path.** The plan's roofs were mixed-unit polygons —
`[x%, xpx, y%]` points driving both a CSS `clip-path` and a canvas path. That
is ~44 clip-paths on a view that re-renders on every tick, and it would have
needed a WebKit measurement before it could be believed. Stacked blocks give
setback, ziggurat ×2 and ×3, spire and twin for free — each level is a block
of `width:max(2px, W%, calc(100% - Cpx))`, which is three rules in one: a
mast that never drops below 2px, a proportional shoulder, and a px cap on the
inset so a wide era or decade still wears a stepped cap instead of a slab
with a lip. Chamfer and pyramid were the two forms that needed a polygon;
they went. The same table drives the canvas with `Math.max` in place of
`max()`, which is what "one spec, two renderers" means in practice.

**The seed is the code, never the index.** Roofs come from `idHash` of the
group's frozen code — PATH's `n`, the era key, the decade key — and the form
is gated on title count rather than rendered width, so a universe wears the
same roof on a phone, on a desktop and on the card, and a spire on desktop
does not become a flat cap at 320px. An index seed would have looked
identical on the day and silently reshuffled the whole city the next time a
continuity was inserted; the guard reads the push sites, not the output.

**The one progress fill that stays solid.** The deco pass ribbed every fill,
and the rule behind the ribbing is why the city is exempt from it: ribs read
as a scale because they cross the axis the bar travels along. The city fills
upward. Vertical ribs would run parallel to the travel, encode nothing, and
turn the lit half of the city into a barcode in which no universe ends. The
1px street is the only line in the city, and it runs ground to roof — with
the crowns touching, two neighbours' roofs merge into one false roof; with no
street at all, the lit half is one gold slab and the sub-6px universes vanish.

**What was cut, and why it was cheap to cut.** The beacon — a mast and lamp
on the group holding `upNext()` — was drawn, rendered, and removed on the
owner's word mid-build; the here-group on The Path already answers "where do
I stand," and a second answer on Progress was a second statement. The card's
bottom block did not move: guard 98 pins the rule, strapline and domain at
1590 / 1700 / 1750 and the bat at (260, 734), and rather than re-anchor a
guard whose comment says "shorten the canvas rather than shift the block,"
the shaft shrank 300 → 260 so the tallest crown clears the bat's lowest point
by 51px. Measured from the path, not eyeballed. And the 1200×630 `share.png`
did not regenerate — the plan said it would, and that was a confusion between
two cards: `share.png` is the crawler card built by `qa/make-share-card.mjs`
from a strip of ticks, and the city lives on the 1080×1920 story card drawn
on demand by `drawShareCard()`. Nothing static changed.

**The weight.** The city cost about 3 KB and left `index.html` at 219.2 KB
of a 220 KB budget. The ceiling has moved four times and every move was the
owner's number on the record; the next feature asks for the fifth.


## The belt is yellow, and the drops are part of it

4.6.0, the first feature after the seal, and a new decision with its own
CHANGELOG entry as the seal said any such thing would be. The owner's brief
on 25 Aug was one sentence: the Belt should be yellow like the real
utility belt, the drops can stay dark. Three renders of the real app were
put on a board and confirmed the same day.

**The strip is the belt colour.** `.pathseg` fills `--signal`, framed and
seamed in 1px `--ink` — ink seams over gold seams, the owner's pick, because
ink is the hairline language everywhere else on the page and the segments
read as inked pouches rather than one soft band. The chosen path INVERTS: an
ink pouch with signal lettering, where it used to be the one signal segment
on a dark strip. Signal still marks the chosen path; it moved from the fill
to the letters, and the guard that pinned "marked in signal, never bone"
now pins the inversion. The buckle is the plate — one step deeper in
`--signalpress` — and both of its lines set in ink, which retires the 3.3.0
`.bs2` contrast story for good (11.0:1 on the plate; it was 3.37:1 on
card2 the day axe found it).

**The peek is the top of this belt.** `#beltpeek` goes signal with an ink
notch at the chosen path, and the notch is not a light on the rail: when
the belt drops, the ink pouch lands exactly where the notch was, because
the peek is literally the belt's top 12px. The glow, the three 26%
positions, the parking arithmetic and every state are untouched — this is
eight CSS rules, no markup, no state, and script bytes did not move.

**The drops are part of the belt.** The first render kept the pouches as
they were — ink fill, grey lettering, `--line` edges — and the owner asked
for them to read as part of the belt when open: yellow borders, yellow
lettering. They keep the ink fill and the from-behind inset shadow (section
96's "the shadow is what sells from behind" still holds) and take signal
edges and signal letters. A chosen pouch cannot be signal-on-signal, so it
inverts the belt's own inversion: signal fill, ink letters. The belt is
signal with an ink pouch; the drops are ink with a signal pouch. That
mirror is what the include-rows guard now pins, having spent its first
life forbidding signal there — the hue was the path row's private mark
when the strip was dark, and the height relation (which row was asked
first) is the distinction that survives.

**What was not touched.** Dark Deco. It was always the blue suit, and once
Darker went neutral the blue reads by contrast; a blue lift was drawn,
costed (`--dim` 4.78, `--steel` 4.60 on card2 — AA, inside section 20's
warning band — plus a share-card regeneration for the baked hexes) and
declined. The story image and share card still describe Dark Deco, which
is correct: the card has one look.

## The cover, and why it is not a splash screen

4.7.0. A screen recording on a phone caught the page as it exists for one
frame on every launch: the crawlable seed — "Every Batman story ever
filmed", two paragraphs, blue underlined links, LOADING under the
wordmark, 0% in the ring — before the first `render()` wiped `#view`. It
had always been there. The seed is real markup inside `#view` since 1.8.6
(both SEO analyzers treated `<noscript>` as inactive), the application
script comes after it, and the browser takes a rendering opportunity
between parsing four hundred lines of seed and executing 146 KB of
script. With the service worker handing the document over instantly the
frame is a flicker; on a slow first visit it lingers. The blue links are
the tell: nothing in the stylesheet styles an anchor inside the seed,
because the app's rendered home never has one.

**The cover.** One fixed plane in `--ink` with the header's own bat in
`--signal`, first in `<body>`, painted from the head CSS so it is in the
first frame with everything else. `splashOff()` runs after the first
`render()` in the restore callback, waits one `requestAnimationFrame` so
the app has actually painted underneath, sets `.gone` — opacity to 0, the
bat drifting up and shrinking, 320ms — and removes the element after the
fade. It waits for nothing else: no timer before the fade, no font, no
minimum hold. On a phone with the service worker the cover lasts a few
dozen milliseconds and then fades; what a reader sees is the app
appearing cleanly. Reduced motion is the existing transition kill at the
bottom of the stylesheet, so `.gone` lands as a cut there.

**Why not a splash screen.** Two shapes were costed. The cover shows
until the first render, then fades. The "moment" holds for 500–700ms so
the mark is seen every launch — a brand beat, on an app whose whole
stance is that nothing stands between the reader and the list, and on iOS
an installed PWA already shows the OS launch screen before it, so it
would be two splashes back to back. The owner chose the cover. Bytes were
never the constraint (a keyframe rule is 100–250 bytes); time was.
Anything animated IN is never seen, because the cover lasts exactly as
long as the first render takes. Only the exit is time the reader has
anyway, so only the exit moves. Section 151 refuses an entrance animation
and a timer before the fade by name.

**The reader without JavaScript.** The seed exists for them, and a fixed
plane would sit on top of it forever. The page's one `<noscript>` is a
`<style>` in the head that hides the cover. Section 78 forbade any
`<noscript>` since 1.8.6 because the only one it had ever carried was the
catalogue; it now forbids a `<noscript>` that carries anything but one
`<style>`, and one with attributes. The wordmark is not on the cover:
Limelight loads with `font-display: swap`, and a cover that itself
flashed from fallback to Limelight would be the flash it exists to hide.

**What rode along.** A minor was opening, so the 4.6.0 audit's on-page
bundle came with it. The seed listed one ordering in full and only
described the other two — the eras carried names and notes and not one
title, release order was "1943–2028" — so each era now opens with its
first title from `lifeCmp` and a "By release" paragraph names the first
eight from `releaseCmp`, both generated in section 78 from the same
comparators section 105 already extracts for `orders.txt`; an announced
title that leads an era says "not out yet" as the full list does. That
paragraph carries the seed's one link to a file, `orders.txt`, which the
audit found linked only where machines look; section 90 allows exactly
that href, once. Three FAQ answers grew the words the queries use. And
`orders.txt` did NOT go into the sitemap, though the triage proposed it:
section 105 has refused that since 2.7.2 because the seed and the export
are the same 200 entries, and the triage's "no guard touches the sitemap"
was simply wrong. A body link is discoverable; a sitemap entry is
submitted for indexing; the two sit on opposite sides of that line, and
the decision held.

**The fifth number.** The bundle landed the tree at 219.4 of 220 KB raw.
The sealed backlog said the ceiling's fifth number was the owner's to
give before a feature started; it is 250, on the record 26 Aug, the same
day. 80 KB gzipped is unchanged and was never approached (63.0).

## The seal: what a tree says about itself has to be true

4.5.1 is the release before the code freeze, and it ships no feature. It
ships the pre-seal audit's findings: three defects in the guard suite's own
machinery, a handful of tests that had gone vacuous, comments and documents
that stated things the tree no longer did, and the dead code and duplicated
loops that a file accretes across a hundred and thirty releases. The rule that governed
every change is the project's oldest: a sentence claiming a fact the tree
does not hold is a bug, and a frozen file that states falsehoods is worse
than one that says nothing.

**The suite had three holes in its own floor.** `sectOfLine()` — the
function that stamps every failure with its section number — matched the
section header at column 0, and section 24 is nested inside 23 with an
indented header, so every failure inside 24 printed as §23 and a fixture
naming `sect=24` could never match. Section 107 knew about the nesting;
the stamper did not. Five places counted the headers with three different
regexes; they read one cached census now. The comment stripper the
"every section can fail" censuses used was a regex, and a slash-star inside
a string literal (the `_headers` path patterns section 104 checks, the
`*/*` Accept header section 133 sends) opened a comment that ran to the next
real close and ate the code between — section 104 read as 133 lines instead
of 322 and lost three of its assertions to the count, quietly, because one
survived. It is string-aware now, and section 13 parses `wrangler.jsonc`
through the same one. And the coverage map's harvester only read
double-quoted expects: eight fixtures with single-quoted ones had never been
harvested at all, invisible to the map and to the sect ratchet alike. It
reads the arguments the way bash does now. The pin moved from 763 to 770 —
plus eight harvested, minus one fixture retrofitted a sect the same day.

**Tests that had stopped testing.** The intro-count check looked for the
literal "58" — the catalogue's size when it was written — and could only fail
by coincidence once the catalogue grew past it. It counts from the data now.
The closed-view size bound was a remembered 150,000 with 3% headroom; it is
a relation to the measured per-row delta. The browser check measured two
values it never asserted.

**The served surface.** `_headers` reaches asset responses and nothing the
Worker constructs, so the negotiated markdown root and the api-catalog were
the only two URLs on the site without the security header set, and no
comment recorded it as a decision. `worker.js` carries the set itself now,
and guard 133 holds its constants equal to the file. The service worker's
navigate fallback tried `./index.html` before `./`; the assets plane
redirects the former to the latter, so the cached copy under that name is a
redirected response, which a browser refuses for a navigation — an offline
navigation to a non-root path would have failed with the shell sitting in
the cache under the other name. `vp.html` gained the CSP `404.html` already
had. Five stable-named files got the Cache-Control day the file's own
reasoning had applied to them all along.

**One merge, one focus restore, one constant each.** Three hand-copied
"apply foreign marks" loops — the cross-tab storage event, the JSON restore
branch and `applyImport()` — are one `applyMarks()`, and section 111 holds
the invariant (watched clears skip; the BYID gate; skipped never lands on a
watched entry) in the helper and refuses a site that grows its own copy
back. The focus snapshot and restore that `tickUpdate()` and `render()` each
carried, the selector escape written three times and the
`focus({preventScroll:true})` try/catch written four times are
`focusSnap()`, `focusRestore()`, `focusBack()` and `attrEsc()`; section 123
pins the helpers and refuses a site that calls `.focus()` itself, because
the site-written restore is the one that ended up without preventScroll.
The ring's circumference and the belt's close timer are `RINGC` and
`BELTCLOSE`, each tied by a guard to the markup and the CSS it has to agree
with. Six `typeof requestAnimationFrame` fallbacks went: the script already
hard-requires Promise, `Element.closest`, Path2D and Blob, and no browser has
those without rAF. Five sites re-derived `gDone()`; two inlined
`gBarFill()`'s markup; three spelled out the ternary `GRIDWORD` now
models (`GRIDNAME`, the card-title map, predates it). All of it is one bless, and the page is 2.5 KB lighter.

**Where the histories went.** The served and config files — `sw.js`,
`worker.js`, `wrangler.jsonc`, `_headers`, `qa.yml`, the negative harness —
carried their own changelogs in comments, dated and versioned, some of them
arguing for decisions the project had reversed. A stale comment is not a
tidiness problem; it is an argument, sitting in the repository, for doing
the thing the project decided not to do. Each file keeps its load-bearing
"why" — the invariant and the failure it prevents — and the dates, the
releases and the evidence went to the two sections below. In `guards.js`
the fourteen longest memoirs were condensed to their invariant paragraph
and the review-ticket lead-ins ("N.N.N, X-N of the DD Aug review:") came
off; the ticket numbers are in the CHANGELOG entries that closed them.

**Kept on purpose.** The 1.1.0 downgrade shim (`mode:S.path` on the way out,
`isPath(o.mode)` on the way in) stays: guard 27 and a smoke case pin it, and
the cost of keeping it is two expressions. The empty `catch` around
`routeHash()` on `hashchange` stays: a malformed `#nw=` is left in the URL
with no toast, which is the quieter of the two failures. The pinned
duplicates in the CSS — two `prefers-reduced-motion` blocks, the triple
`height:` on `#app`, `#nosave[hidden]`, the duplicate `content:` — are
guarded, and each is there for a reason its guard states.

### `var KEY = "batwatch-v3";`

The storage key. It has read `batwatch-v3` since the repository's first
commit (27 Jul 2026); the `v3` is inherited from the prototypes that came
before the repository, and nothing in the tree has ever read `batwatch` or
`batwatch-v2`. It must never change: progress is per-origin and lives under
this name, there is no migration path, and a "tidied" key is every reader's
progress gone at once with the bytes still sitting under the old name.
Guard 21 pins it; the smoke suite spells it out by hand at each site on
purpose, because a test that read the key from the app would follow a
change it was meant to refuse.

### `function applyMarks(res, stamp, gate){`

The one merge. `res` is a `{watched, skipped, rated}` shape from any source;
`stamp` says whether the marks get clocks (a restore does, a cross-tab
payload carries its own); `gate(kind, id)` lets the storage listener keep
its clocked semantics — an id whose clock is known is the clocked merge's
business, not this one's. It returns the ids it newly watched, so the
callers can write their own log entries, and a count of what changed, so
the listener knows whether to render. Watched clears skip inside it, once.

**Why the clocked merge carries ids it cannot render** (4.5.2, on the
record). `applyMarks()` gates on `BYID`, so the storage event's unclocked
fallback — the path for a payload written by a pre-3.8.0 build, with no
clocks — drops an id the catalogue does not carry. In 4.5.0 that path
adopted it; 4.5.1 changed that without saying so, and it is the right
tightening: a clockless payload is a legacy shape, and a legacy shape
carrying an id this build has never heard of is noise. The clocked loop
above it is a different case and is deliberately NOT gated. It mirrors
`restore()`, which keeps every mark in storage whether or not `BYID` knows
it, and the reason is loss, not rendering: with two tabs on different
catalogue builds sharing one origin, the tab that cannot render an id
still has to carry it, because both tabs take turns writing the whole
payload. If the older tab dropped the id it did not know, its next
`persist()` would write storage without it, and the newer tab's next
reload would restore from that — a mark somebody made, gone, from a tab
that never showed it. So the clocked loop adopts the clock and the mark
for any id, renders what it can, and passes the rest through. The gate on
the unclocked path costs almost nothing by the same argument: it only runs
for ids the clocked loop did not see, and a clockless foreign id normally
has no tab on the other side keeping it alive. The one case it does not
cover, accepted on the record: `restore()` never stamps clocks and nothing
backfills them, so a mark made before 3.8.0 and never toggled since is
still clockless inside a current tab. If that mark is on an id a second
tab's older build does not carry, that tab's gated fallback drops it and
its next wholesale persist erases it. A pre-August-2026 mark, on an id
that later left the catalogue, met across two builds sharing one origin
— rare enough to accept rather than to grow a third merge path for.

### `function focusBack(el){`

The one restore. `preventScroll` because a restore that scrolls is a jump —
the 3.4.0 finding — and a try/catch because a browser without the option
throws on the dictionary. `focusSnap(within)` keys the button's `data-*`
set through `FOCUSKEYS` (including `data-src`, which tells a row's two
watched buttons apart), and `focusRestore(v, snapshot)` rebuilds the
selector through `attrEsc()`. Three sites, no copies.

**The Plex reserved name (4.5.2 found it, 4.5.3 settled it).** Restoring
IBM's upstream OFL header to `docs/fonts/OFL.txt` surfaced a clause the
shipped copy had dropped: *with Reserved Font Name "Plex"*. Every place
this file and `qa/subset-fonts.py` argued Limelight's keep-whole rule said
the other faces reserved nothing; Plex does. The four Plex faces are
subsets (270→223 and 280→223 glyphs; ≈45 KB saved), so they are Modified
Versions under OFL 1.1 §3, and the OFL FAQ is plain about it: subsetting
is modification (2.6) and "would not normally allow the use of RFNs"; the
name "as presented to users" is the font menu name *and* "other
mechanisms that specify a font in a document" (5.3) — the `@font-face`
string included. Three honest answers: leave it (a bet on the 2.7
"functionally equivalent" reading that 2.6 says subsetting does not get);
ship IBM's own Latin1 files (+45 KB, no naming question); rename the
subsets (0 bytes, clean under §3). The owner chose the rename. So
`qa/subset-fonts.py` rewrites name IDs 1/3/4/6/16 to NW Sans / NW Mono
after subsetting, the CSS and the story card's canvas font declare the
same, the file names keep "ibm-plex" (a file name is not a presented name,
and it is what `_headers`, `sw.js` and the manifest address), OFL.txt says
so under IBM's block, and guard 106 reads the reserved names out of
OFL.txt and holds every subset face — name table and `@font-face` — clear
of them. Limelight's rule, applied to Plex, with the answer that costs
nothing.

**4.5.2, the second cut.** The audit of the 4.5.1 tree found what the
first cut had introduced: three guards (§111, §96, §43's own repair path)
that claimed an invariant they did not hold, one unlisted behaviour change
(above, under `applyMarks()`), and a release checklist whose "bless, once"
went red on a catalogue move before the step that would have fixed it. The
pattern is worth naming, because it is the pattern the seal exists to
stop: a fix that states its own invariant in a comment and a changelog
line is exactly as trustworthy as any other sentence about the tree —
which is to say, only as trustworthy as the fixture that breaks it. Every
4.5.2 repair ships with the mutation that proves it (negtest570), and the
one claim in the audit that the tree refuted (the sitemap's `llms.txt`
date; `git log` says the file has not changed since 3.9.6) is refuted on
the record in the CHANGELOG rather than quietly "fixed".

## Where the served and config files' histories went (4.5.1)

Each file keeps its reasons. This is where the dates, the release numbers,
the review-ticket names and the evidence files went, in the files' own
words as they stood at 4.5.0.

### docs/sw.js

VERSION and CACHE: the analytics beacon was the one cross-origin case until it left in 3.2.0, and the fonts were another until 1.4.2, when they stopped coming from Google's CDN. NEVER_CACHE went with the beacon: it held one entry, the beacon's origin, and existed because the cross-origin return is about *where* a request is served from rather than what the list meant — serve the beacon through a same-origin path and the origin check stops catching it while the list still would. An empty list consulted on every fetch is a line that can only be right by accident, so it went.

The shell: icon-192.png joined because index.html's `<head>` references it directly for rel=icon (it used to inline the bytes). The fonts joined in 1.5.9 — they relied on the runtime network-first path, which works on any normal first visit, but a font request that failed on that one visit rendered fallback type offline until the next online one. icon-maskable-512.png joined in 1.6.6: served and referenced by manifest.json since 1.5.x and never listed, so an Android icon refresh while offline fell back silently, and only for people who installed before the icon existed. The apple-touch icon has been its own 180×180 file since 3.9.x and stays out with the rest of the browser-chrome rasters.

The runtime cache write rides `e.waitUntil()` since 3.7.2 (L-3 of the 10 Aug review): it was fire-and-forget, so the browser could kill the worker between the reply and the put, and a downloaded update quietly missed the offline cache until some later visit.

The navigate fallback tries `./` before `./index.html` since 4.5.1, and `./index.html` left SHELL in 4.5.2: `cache.add` on it followed the 308 and stored a redirected 220 KB duplicate that a navigation can never use — one redirect and one wasted entry per install. The fallback still consults the name last, for a platform where the path answers 200 and a visit cached it. Workers Static Assets' default `html_handling` redirects `/index.html` to `/`, so `cache.add("./index.html")` stores a redirected response, which Chrome refuses to use for a navigation — an offline navigation to a non-root path under scope would have failed with the shell sitting in the cache under the other name. The wire check that confirms the redirect is `curl -sI https://nightwatcher.life/index.html`.

### qa/negative/run-all.sh and _lib.sh

The suite naming rule was corrected in 3.9.5 after the old text got both of its own examples wrong ("negtest390 is 3.9.0, negtest410 is 3.9.2's" — 390 is 3.7.2's by its own header, and 3.9.2 with the dots removed is 392). The release encoding held through negtest300 (3.0.0) and broke at negtest340 (3.4.2); from 340 on the number is a +10 counter: 340=3.4.2, 350=3.4.5, 360=3.5.0, 370=3.6.0, 380=3.6.4, 390=3.7.2, 400=3.8.0, 410=3.9.2, 420=3.9.3, 430=3.9.4, 440=3.9.5, 450–550 one per release from 4.0.5 through 4.5.0 (not every release cut a suite — the counter skips the ones that did not), with 475/476/478 where 4.0.5/4.0.6/4.0.8 needed three; each suite's header names its release, and that header is the only reliable source.

The concurrent runner (2.2.0) exported a single NEGDIR for every suite while the loop was serial; each suite now gets its own directory under $WORK/scratch. Dispatch is longest-first by smoke-fixture count (optimization report §5.1); the count was `grep -c '"smoke"'` until 4.2.3 (Q-6 of the 19 Aug audit), which missed negtest400's bare `smoke main` and started its three smoke fixtures whenever xargs got around to them.

_lib.sh replaced twenty-one per-suite copies of the harness that had drifted into three vintages (run_case with and without the suite parameter; a failure grep that knew '✗', then '✗|FAIL', then '✗|!|FAIL'). The standalone-run leak: every suite leaked its temp directory, not the eight that ended without `rm -rf "$NEG"` — $NEG is "$dir/tree", so the rm removed the tree and left the directory — and the fix was the EXIT trap in the library. 3.0.0 filtered the green lines before matching after 22 of 392 fixtures were found matching a run in which nothing had been broken (their expects were check names, not failure messages); gating on the exit code and filtering on '✗|FAIL' were tried and rejected because each broke correct fixtures. 3.7.2 (L-8) added the pristine signature and consulted the exit code; 4.2.3 (Q-3) added the sect argument; 2.5.0 (report §5.3) unpacked once and healed between fixtures instead of re-tarring 290 times. green_case was added 10 Aug 2026 after guard 105 read sitemap.xml with indexOf and failed on a comment naming the export.

### .github/workflows/qa.yml

The negative job was gated behind `if: github.event_name == 'pull_request'` until 1.8.3, on the reasoning that the suites are slow. The reasoning was sound and the conclusion was wrong: releases here ship by uploading the tree, which is a direct commit to main, so pull requests essentially never happen and the job had almost certainly never run in CI at all — the evidence that the guards work was produced only on the release machine, by hand, which is the exact situation the workflow was created to end.

The cost comment's figures ("579 guards / 32 smoke") had drifted and did not sum to their own total; corrected 3.7.2 and guarded since. The 4-way sharding is from the 2.2.0 optimization report (§5.2), on top of run-all.sh's longest-first dispatch (§5.1). In 4.5.1 the shards were repacked by fixture weight (a smoke fixture ≈ forty guards fixtures): shard 4 had been carrying 22 smoke-fixture-weight against 11–14 elsewhere, negtest300 alone being 13.

The union check used to carry a fifth copy of the shard lists, hand-maintained, with a comment asking whoever edited the matrix to keep the two in step. Nobody did: negtest252 was added to shard 2 in the 2.5.2 round and negtest260 to shard 3 in 2.6.0, and neither reached the copy. Both uploads went red on that step — and because it runs before run-all.sh, the negative suites did not run in CI at all for two releases. It reads the patterns out of the file now.

The browser job arrived in 3.7.2 (H-3 of the 10 Aug review); until then browser-check.mjs was manual-only and the behaviors it observes (scroll clamp 3.3.2/3.4.0, focus loss 3.4.0, group collapse 3.4.1, the belt rendering nothing on six real browsers in 3.6.4) were enforced between runs by source-shape regexes that, by their own admission, cannot observe behavior. WebKit joined as a second job in 4.4.x when the deco pass shipped clip-path ornaments; 4.5.1 folded the two copy-pasted jobs into one with an engine matrix and started uploading `qa/.shots/` on failure — they had been written on every run and never read by anything. The ubuntu-24.04 pin was written against Playwright 1.56; the lockfile has been at 1.62 since 4.4.x and the pin was re-checked against it in 4.5.1.

### qa/browser-check.mjs

The header claimed "not committed to CI" for four minor releases after the browser job arrived in 3.7.2 (H-2 of the 19 Aug audit) — a comment about what watches the tree, wrong about what watches the tree, in the file being watched. 3.2.0 fixed what the file could not say about itself: it imported playwright while package.json declared only jsdom and wrangler, and it launched a hard-coded `/opt/pw-browsers/chromium-1194/…` path, so it ran on whatever happened to be installed at one pinned build number and would have failed — or, worse, silently not run — anywhere else. 3.3.0 added the console listener: the file measured geometry and never read the console, so a CSP violation would have gone past 36 green checks without a word; `connect-src 'none'` shipped on the strength of that listener. 3.7.2 (I-5) removed an inert check-shaped line (`…getBBox ? null : null`). 4.2.3 (Q-9) replaced the hardcoded 109.96 retracted offset with 2πr from the served markup, the same arithmetic as guard 80. The 70px sticky clamp was seen by the maintainer-local record-3.0.0.md and never pinned. In 4.5.1 two measured-but-never-asserted values (the wordmark's top, the closed group's height) were either dropped or asserted, and the Where-to-watch link's id and text are asserted rather than only printed.

### wrangler.jsonc

The custom-domain comment used to end: "GitHub Pages keeps serving the same tree at its own address on purpose: progress is stored per-origin, so it is the only place anyone's old progress can be read. It carries an injected noindex rather than an offer to move." All of it lapsed in 3.3.1, when the mirror was retired, `offCanonical()` left the tree and sections 77, 78 and 114 were inverted. It sat there unrevised for two releases while README.md said the opposite and was right. On 8 Aug 2026 it got read: Pages was republished, a docs/CNAME appeared, and the old origin became first a 301 and then a second live origin serving the same tree. Guard 82 caught the file; nothing could catch the panel. A constraint outlives the reason it was written for, and a stale comment is not a tidiness problem — it is an argument, sitting in the repository, for doing the thing the project decided not to do.

`main` arrived in 3.8.0 for the markdown negotiation (the Radar agent-readiness gate, triaged 10 Aug 2026); 3.9.0 added the api-catalog path. `not_found_handling: "404-page"` since 2.1.0. `nodejs_compat` left in 4.5.1: worker.js uses no Node API.

### docs/_headers

The file's header used to carry its own changelog. The decisions survive in the file; this is where the dates and the evidence went, verbatim as the file stood at 4.5.0.

Response headers for every path served by the Worker's static assets.

SUPERSEDED 8 AUG 2026 — the claim that stood here was wrong. It read: "Cloudflare Response Header Transform Rules do NOT apply to responses a Worker generates, which is why these live here and not in the dashboard." They DO apply, and they WIN. A rule named "Security headers", active on all incoming requests, had been setting Permissions-Policy, Referrer-Policy and X-Frame-Options at the edge — and for the whole of 3.4.2 the wire served the rule's Permissions-Policy rather than the one below, while guard 104 stayed green because it reads this file and the file was correct. The 4 Aug reading that produced the wrong claim tested a rule that set nothing, and a rule that sets nothing proves nothing about rules.

THE DECISION IS UNCHANGED AND THE REASON IS BETTER. These live here because a file in the tree can be diffed, guarded and shipped inside a release, and a dashboard rule can be none of those. The rule is deleted in 3.4.3, so this file becomes the only thing setting these headers. NOTHING GUARDS THAT IT STAYS DELETED — no guard can read a panel, and one that pretended to would be worse than an honest gap — so the wire check lives in the release checklist: RELEASING.md, "The wire checks". (Until 3.7.2 this comment delegated to a checklist that did not exist anywhere in the repo — M-3 of the 10 Aug review. It exists now.) qa/sweep-repo-page-dns-2026-08-08.md is the maintainer's local evidence file, not in this repository.

HSTS and X-Content-Type-Options are set at the edge instead (SSL/TLS panel and Managed Transforms) and are deliberately not duplicated here.

Content-Security-Policy stays in the <meta> tag in index.html: the guards bless its hash against the one inline script, and moving it to a header would split one rule across two files. The 7 Aug 2026 Cloudflare Radar scan reported the CSP MISSING and rated it P0 — a response-header scan cannot see a <meta> policy, and the header it proposed (script-src 'self' 'unsafe-inline') is weaker than the single sha256 that ships. qa/scan-triage-2026-08-07.md (maintainer-local, not in this repository).

CACHE POLICY, ADDED IN 3.0.0, AND IT ONLY TAKES EFFECT ON UPLOAD. Nothing in this project declared one, so every file was cached with whatever Workers Assets emits by default and Cloudflare caches .js at the edge. Two independent routes reached the same conclusion: the six subset faces are 62,996 bytes, network-first in the service worker, and re-fetched on a policy nobody wrote; and on 5 Aug 2026 the bare /sw.js answered VERSION = "2.5.1" while the same file with a cache-busting query answered 2.7.5.

sw.js is the one file that must never be stale, because it is how a returning browser learns the app changed — its own header comment says so. no-cache does not mean "do not store": it means revalidate before use, which is exactly what a version marker wants. The fonts are content-addressed by the subset script's own hash record and never change under a name, so they take the year.

3.4.2 ADDS THE TWO ICONS, AND THEY GET A DAY RATHER THAN A YEAR. Both were served max-age=0 and revalidated on every visit — two conditional requests a visit, forever, for files that do not change. A year with immutable is only safe behind a content-hashed filename, and RENAMING THE FAVICON IS THE ONE THING FORBIDDEN BEFORE 19 SEP: "unstable or frequently changed" is a listed Google cause of favicon non-appearance, and this icon already changed twice in three days. A day takes the win and leaves the names alone.

3.4.3 PUTS usb=() BACK. 3.4.2 removed it on a console warning from a scanner's own engine, recorded as "not a registered Permissions-Policy feature". It is one: usb is the policy-controlled feature for WebUSB and Chrome accepts it — the live response carried usb=() while Chrome's console stayed silent through three page loads. The app never uses WebUSB, so denying it is cheap hardening that was taken for a wrong reason and is returned for a plain one. interest-cohort does NOT come back: FLoC was withdrawn, and section 104 still refuses that token by name.

3.7.1 MOVES THE TWO Link: LINES OUT OF /* AND UNDER /, AND THE REASON IS NOT THE ONE THAT PROMPTED IT. An outside reading said the blanket canonical was why GSC returned "Soft 404" for /icon.svg. IT IS NOT, and the control that settled it is on file: three live tests, one instrument, one hour, 10 Aug. /llms.txt carries this very header, Google READ it — User-declared canonical: https://nightwatcher.life/ — and the verdict was still "URL is available to Google · Page can be indexed". A header that blocked indexability could not produce that row. /icon-192.png reported User-declared canonical: NONE, so a PNG is never evaluated as a document at all, and it too came back available. Only /icon.svg fails, because SVG is a renderable document format that renders with no text. THE SOFT 404 IS SVG-SPECIFIC AND HARMLESS. qa/favicon-serp-2026-08.md (maintainer-local, not in this repository).

3.7.2 DECLARES THE DOCUMENT'S OWN POLICY AT LAST (L-4 of the 10 Aug review). This file's history above records exactly what an undeclared cache policy cost sw.js; index.html — the entire app — was still riding the platform default for every visitor the service worker cannot help. no-cache means revalidate before use, which is what a single-file app whose only update path is "serve the new file" wants. It rides under / because / is the whole HTML surface: not_found_handling is "404-page", so no other path serves a document.

3.7.2 ALSO ADDS THE REST OF THE ICON SET — the three tab-size PNGs, the iOS home-screen icon and the Windows tile — each a day, for exactly the reasons recorded for the first two icons above: stable names, no content hash, and Google's stability rule.

SO THIS MOVE BUYS NOTHING MEASURABLE AND SHIPS ON PRINCIPLE, WHICH IS RECORDED HERE RATHER THAN DRESSED UP: a canonical relation is a statement about a document, /* applies it to fonts, icons and sw.js, and RFC 8288 gives no reading of "this PNG's authoritative version is the home page". The narrow scope is what the file meant all along. Cloudflare's _headers matches on PATH ONLY — never content type — and every matching rule applies cumulatively with no way to unset, so scoping means removing from /* and re-declaring under /. / is the whole HTML surface: wrangler.jsonc pins not_found_handling to "404-page", NOT single-page-application, and the app is one page with hash routing, so no other path ever serves a document. Section 104 asserts the scope now, not merely the presence — the old regexes matched anywhere in this file and would have stayed green through this very edit.

3.8.4 ADDS THE THIRD Link: LINE UNDER /, FOR AGENTS. The Cloudflare Agent Readiness panel (12 Aug 2026) read the response and said "Link headers present but no agent-useful relation types found". The site has no API, so RFC 9727's api-catalog and service-doc would be fabrication; describedby is the honest registered relation — "a resource that describes this one" — and /llms.txt IS the machine-readable description of this page, the same file the Worker already serves to any client whose Accept prefers text/markdown. The target is site-relative where the other two are absolute: canonical and sitemap name authoritative URLs and must not drift across origins; a describedby points at a sibling of whatever origin served it, which is what a relative reference says. Cloudflare suggested a Worker or Transform Rule for this; the whole history above is why it lives here instead. Known risk, accepted on the record: third-party checkers may only credit their own example rels. Guard 104 pins the line and its scope, same as the other two.

Between the directive blocks:

VARY: ACCEPT ON / , ADDED IN 3.9.2. worker.js sets it on the markdown branch and nothing set it here, so the HTML fall-through was a second representation of the same URL with no signal that the URL has two — and a shared cache that relaxes no-cache revalidation could hand this HTML to a markdown-preferring agent. It sits under Cache-Control rather than above the Link set because it is a cache-key directive and belongs beside the other one. The negotiation is in worker.js; the declaration belongs in the file that can be diffed and guarded. THE FILES WRITTEN FOR AGENTS, ADDED IN 3.9.4. These had no block at all, so they inherited whatever the assets plane emits by default while / and /sw.js declared no-cache. It cost a wrong answer on the 3.9.2 deploy: the first read of /auth.md came back with the PREVIOUS release's heading and a cache-busted read came back correct — a stale answer to a question asked once, by a reader that does not come back to check. An agent reading llms.txt or orders.txt has the same problem and no way to notice it. Same policy as the page they describe, for the same reason. THE DISCLOSURE POINTER, ADDED IN 3.9.5, AND IT JOINS THE THREE ABOVE FOR THE SAME REASON THEY ARE THERE. /.well-known/security.txt carries an Expires date, so a stale copy does not merely answer late — it answers with a freshness claim that was true when it was cached and is not any more. The reader is a scanner or a researcher who fetches once and writes down what it said, which is the auth.md failure exactly.

Nothing here declares Content-Type: the assets plane already emits text/plain; charset=utf-8 for .txt, RFC 9116 asks for no more than that, and _headers cannot unset a header it duplicates. Declaring a correct default twice is how you get two of it.

4.5.1 added Cache-Control blocks for icon.png, icon-192.png, icon-maskable-512.png, share.png and manifest.json — a day each, the file's own reasoning, which had applied to them all along while they rode the platform default.

### worker.js

3.8.0 wrote it for the markdown negotiation (the 10 Aug 2026 Radar scan's agent-readiness report gates Level 3 on that and nothing else; the triage is maintainer-local). 3.8.4 added auth.md's "nothing to sign into"; 3.9.0 the empty api-catalog; 3.9.2 answered HEAD on the api-catalog after a HEAD probe fell through to the assets plane and 404'd (a status mismatch on a well-known URI that validators probe with HEAD first); 4.0.1 did the same for the negotiated root, where HEAD had read as HTML while GET read as markdown. 4.5.1 gave both Worker-built responses the security header set and the root's Link set: `_headers` reaches asset responses only, so those two URLs had been the only ones on the site without Referrer-Policy, X-Frame-Options, Permissions-Policy, COOP and CORP, and no comment recorded it as a decision. Guard 133 now holds the constants in worker.js equal to the file.

### qa/smoke.js

Two strip-replaces used to run before booting the page: one removed Google-CDN font links (self-hosted since 1.4.2), the other the Cloudflare beacon (gone in 3.2.0); both patterns had matched nothing for releases. The "future code" probe appended an unknown segment to an NW3 code and called it "a future NW2 code" until 3.0.0 — the segment half was real, the version half was not being exercised. The NW1 check tested nothing for nine releases: it did `code.replace(/^NW2/,"NW1")` on a code that starts NW3W, which cannot match, so it imported the same NW3 code twice; deleting NW1 support from the app left it green (guard 8 covered the format for real, so the app was never unprotected — the check was lying). `afterOrigin()` was a one-line hop named after a document the suite stopped booting in 2.5.1 and outlived it by four releases. In 4.5.1 the intro-count check stopped looking for the literal "58" (the catalogue size when it was written — it had been vacuous since the catalogue grew past it) and the closed-view size bound became a relation to the measured per-row delta instead of a remembered 150,000.


## Where the guards' histories went (4.5.1)

The fourteen longest comment blocks in `qa/guards.js`, as they read at
4.5.0. Each section kept its invariant paragraph; the full argument is here.

#### §103 The tick repaints one row, and cannot drift

2.5.0, optimization report §3.8 — the one the report called genuinely risky, shipped behind arithmetic instead of nerve. The tick path (toggleWatched/toggleSkip) repaints the row's group through groupBlock() — the same builder viewWatch() composes from, so the two cannot disagree by construction — plus the header through renderHead(). Everything outside the targeted condition (another tab, a filter, a search) falls back to the full render. The real gate lives in smoke: after every driven tick, a forced full render must serialize byte-for-byte identical. This section holds the shape so the gate always has something to gate.

3.4.1 SUPERSEDES THE PARAGRAPH ABOVE, AND THE SHAPE IT HELD WAS THE DEFECT. Everything it says about drift is still true and still enforced below. What it got wrong was the granularity. It required tickUpdate() to rebuild the whole GROUP through groupBlock() and replaceChild it in — and .group carries content-visibility:auto with contain-intrinsic-size:auto 64px, so the replacement is a brand-new element with no remembered size and renders as a 64px placeholder until layout catches up. Measured at 390x844 in the click's own task: the ticked group falls 3418px -> 66px and the document loses 3352px underneath the reader. In Bruce's life, where an era is six times a universe, that is the whole screen.

THE CHECK THAT SHOULD HAVE CAUGHT IT COULD NOT SEE IT. 3.4.0 added a browser drive for exactly this and asserted on window.scrollY, which reads 8780 -> 8780 across the defect: the offset does not move, the content does. It also ran only filter ess and filter core, and BOTH of those take the fallback branch on the very line this section pins. The default state — no filter, no search, where every reader starts — had never been driven at all. qa/soak-3.4.0-tick-jump.md.

With filter "all" and no query, groupBlock's seven filter clauses all fall through and matches() returns true, so THE ROW SET CANNOT CHANGE. A tick can change exactly three things: the row, the "n of m" in the group head, and the head's progress bar. So the row is replaced through filmRow() — .film carries no content-visibility and cannot collapse — and the other two are written in place, the way groupUpdate() has always done it. Nothing creates a .group element outside the full render any more, which is the class of defect rather than this instance of it.

The anti-drift argument is unchanged and is now stronger: filmRow() is the same row builder groupBlock() composes from, and gSub()/gBarFill() are the same two helpers the head is built from (gPct() sat between them until 4.5.2 folded it into gBarFill()), so a second copy of any of the three cannot exist. The smoke gate still has the last word.

#### §120 The page does not read layout after writing it

THE FAMILY, NOT THE MEMBER. Section 96 refused `scrollHeight` from 2.7.0, written when render()'s closing clamp came out — 216ms of forced layout on every render, invisible to the harness because jsdom has no layout and nothing here can observe a reflow by running the app. It refused one property NAME. On 6 Aug 2026 a Lighthouse run found a forced reflow of 106.6ms desktop / 64.1ms mobile at the TOP of that same function, arriving as `window.pageYOffset || document.documentElement.scrollTop` — the same defect under a different name, walking straight past a guard written against the first one.

It also moves the assertion out of section 96, which is titled "The Belt is one strip, and its pouches open from behind". The scrollHeight refusal was filed there because that is where the 2.7.0 work happened, not because it is what that section is about, and a guard filed under the wrong name is a guard the next reader does not find.

TWO LISTS, AND THE SECOND IS THE HONEST PART. Properties this page does not read at all are refused outright. The ones it DOES read are PINNED to the exact sites that exist, each named — because refusing them today would fail the build over a defect that is real, known, planned and frozen until after 19 Sep 2026. A guard that cannot be green against the tree it ships with is not a guard, it is a wish.

3.3.0 CORRECTS THE LAST SENTENCE THIS COMMENT USED TO CARRY. It said the pins drop to zero when render()'s read is hoisted, and both members move up into REFUSED. That was wrong the moment it was written: the fix MOVES the read, it does not remove it, so the count is 1 before and 1 after and the pins stay exactly where they are. A count answers "how many" and can never answer "in what order" -- and order is the whole of this defect. The ORDER clause below is the half that can see the fix.

3.9.7 MOVES THE SCROLL OFF THE DOCUMENT (the tab-swipe groundwork). The keep-read is scrollKeep() on #app now: window.pageYOffset appears nowhere and joins REFUSED, and the scrollTop pin widens to 2 for the seam every scroll site goes through -- scrollKeep() the one read, scrollPut() the one write. Reading an element's scrollTop forces layout exactly the way the window read did when a write has already landed in the same task, so the ORDER clause keeps its job and tracks scrollKeep().

#### §106 The fonts carry every letter the catalogue uses

2.7.0 subset five of the six faces to roughly half their weight — 39% of the first-visit payload down to 26% (the manifest below holds the bytes). The weight was never dead files: all six are referenced by @font-face and all six are precached. The weight was glyph coverage nobody was ever going to use.

THE FAILURE MODE A SUBSET INTRODUCES IS SILENT. Cut a glyph the catalogue later needs and the browser draws a blank box, on one entry, on one row, probably on somebody else's device. Nothing throws. That is why the subset is Latin-1 plus punctuation rather than the 99 characters the catalogue happened to contain on the day — the tighter cut saved another 21 KB and would have put an accented title one data patch away from tofu, on a catalogue whose whole design is that it takes data patches.

This guard closes the gap the range leaves. Every character in the served page and in the plain-text export must be inside the blessed range, so a new title with an unusual letter fails the build on the day it is added rather than turning up in a screenshot three weeks later. It keeps a trigger patch honest too: one data row stays one data row, unless it needs a glyph the fonts do not have, and then the build says so.

It does not regenerate the fonts. Doing that would put fonttools and a Python toolchain in CI to re-derive bytes that are already committed. Instead qa/subset-fonts.py blesses a manifest carrying each file's size and SHA-256, and this guard holds the files against it — so the fonts and the record of what they contain can only move together, which is the same bargain the seed, the ItemList and orders.txt already make.

Limelight is in the manifest but marked unsubset. Its OFL header reads "with Reserved Font Name Limelight"; Big Shoulders' does not, and IBM Plex's does ("Plex" — a clause the shipped OFL.txt had dropped until 4.5.2; since 4.5.3 the four Plex subsets are renamed NW Sans / NW Mono, and this guard holds every subset face and its @font-face clear of every name OFL.txt reserves). Under OFL 1.1 a Modified Version may not carry the reserved name as presented to users, so subsetting it means renaming the family in the name table, in @font-face and in --deco — real CSS churn and a licensing judgement, for 10.3 KB. Left whole on purpose, and the manifest says so rather than leaving it looking like an oversight.

#### §17 One hero size, declared once (the ring never outdraws the bat)

THE HEADER IS THREE FLEX COLUMNS with both flankers boxed at 46px, so the wordmark is always mathematically centred and nothing here was ever misaligned in the box model — which is exactly why it went unnoticed for eleven releases. What is lopsided is the mass INSIDE the boxes.

THREE RELEASES CORRECTED THIS AND ALL THREE MEASURED THE WRONG THING. 2.7.3 grew the bat 32 -> 40 against "a 46px ring"; 46 is the ring's box, and at r=19/4px it drew 42. 2.7.5 fixed that side, set both to "44", and wrote THIS GUARD as bat-width == 2*(r + stroke/2) — a real relationship, with one term read from `.mark svg{width:44px}`. A CSS width is a box. The glyph inside it sits in a viewBox with 4 units of padding each side and draws 39.81px, so the guard was green for a 4.19px gap while asserting the two were equal.

AND THE TARGET WAS WRONG AS WELL AS THE TERM. Equality is what a symmetric row looks like on paper; it is not the requirement. The owner's rule, 5 Aug: THE RING IS NEVER WIDER THAN THE BAT. The bat is the logo, the ring is a readout of how far you have got, and a readout that outdraws the mark is the wrong way round. A rule with a direction in it cannot be satisfied by luck. Two of the three releases above were satisfied by luck.

So this section measures the GLYPH — every path and the ellipse, flattened, real cubic extrema rather than the control hull, the group transform applied, scaled by cssWidth/viewBoxWidth — and requires the ring to come in strictly under it. NO TOLERANCE. A one-pixel slack is precisely what would let r=18 (40px drawn, 0.19 over) read as a pass.

THE CEILING IS THE NARROW PHONE. At 375px the row leaves ~219px for the wordmark once the two 46px flankers and two 14px gaps are taken. NIGHT WATCHER in uppercase Limelight measures ~187px at 24px, so it fits with room; it does not at 28. .wordmark is flex:1 with min-width:0, so it shrinks silently rather than pushing back — nothing would go red, the title would just start wrapping on somebody's phone.

#### §105 The catalogue answers in plain text

B4, approved 4 Aug: a flat text export of the catalogue for anything that reads text rather than HTML — the same audience llms.txt talks to, given the data instead of a description. Separate file, so it costs the page nothing.

IT CARRIED ONE ORDERING UNTIL 3.9.6, AND THE REASON IT DID IS STILL THE REASON THE FIX LOOKS LIKE THIS. By universe needs no sort: each continuity's array IS its spoiler-safe order, exactly as guard 78 relies on for the seed. Bruce's life and Release order are computed, and they were computed by two ANONYMOUS comparators inside buildGroups() — and fn() can only extract NAMED functions. Writing them out here would have been a second implementation of the app's ordering, the one thing this file exists to prevent: a copy drifts, stops testing the app, and from here it would have started PUBLISHING the drift. That is why the export shipped short for thirteen releases rather than being "completed" by someone with a spare afternoon.

3.9.6 NAMED THEM INSTEAD. lifeCmp and releaseCmp are functions in index.html with byte-identical bodies, buildGroups() sorts through them, and this section extracts both — one source, both sides. Guard 141 asserts the app has not quietly re-inlined a copy, which would put the drift back while leaving this file looking right.

THE BUCKET IS PART OF THE ORDERING. Neither comparator is a total order: lifeCmp runs inside an era, releaseCmp inside a decade, and the bucket list does the coarse ordering. Sorting the flat catalogue with either would give a plausible-looking wrong answer — so the two loops below mirror buildGroups() rather than the shortcut, and a count check refuses to publish an ordering that carries fewer than every entry.

Generated and blessed like the seed and the ItemList: rebuilt on every run and compared, npm run bless writes it. A hand-maintained copy of 200 entries would be stale within a release and nobody would read it closely enough to notice.

#### §43 Content-Security-Policy (connect-src)

connect-src is DELIBERATELY ABSENT since 3.3.1 and stays absent -- BUT NOT FOR THE REASON RECORDED HERE UNTIL 3.4.4, WHICH WAS FALSE.

This comment used to read: "The wire reading on 6 Aug 2026 found the edge appending 'self' to it, and a 'none' sitting beside a second source expression is ignored -- so the directive shipped, looked like protection, and provided none: fetch('/orders.txt') from the live page returned 200. It now falls through to default-src 'none', which is the first directive in the policy and which the edge has no directive of its own to append to."

THE EDGE APPENDS NOTHING. That reading, and the three others like it, were taken through a TLS-intercepting VPN on the author's own machine -- read with it switched off on 8 Aug 2026 the served policy is this file's, exactly: ten directives, one sha256, no connect-src. C0 was never Cloudflare. ops/c0-edge-injection.md.

SO 3.3.1 REMOVED A DIRECTIVE ON A MISREADING, AND THIS GUARD HAS BEEN ENFORCING THAT REMOVAL EVER SINCE. The removal is kept anyway, on the half of the old reasoning that was never about the edge: default-src 'none' is the first directive in the policy and connect-src falls through to it, and the page opens no connections of any kind -- no fetch, no XHR, no beacon, no socket. A directive that restates its own fallback is a second copy of one rule, and two copies drift.

THE DIFFERENCE MATTERS TO THE NEXT PERSON. Restoring connect-src 'none' is now a live option that costs nothing and gains nothing, not an impossibility. If anyone argues for it, the argument is redundancy, not "the edge will eat it". The unpinned-directive check below still fails the build the moment connect-src reappears -- so the decision is made here, deliberately, rather than drifted into.

#### §104 The security headers the tree owns

THE TITLE OF THIS SECTION USED TO BE "the security headers the edge cannot set", and the comment under it used to say: "Cloudflare Response Header Transform Rules do not apply to responses a Worker generates... A rule was created in the dashboard on 4 Aug 2026, showed Active, and set nothing — verified against a cache HIT, a cache MISS and a 404."

BOTH WERE WRONG, FOUND 8 AUG 2026. A Response Header Transform Rule reaches a Worker response and overrides this file. A rule named "Security headers", active on all incoming requests, was setting Permissions-Policy, Referrer-Policy and X-Frame-Options — and for the whole of 3.4.2 the wire served ITS Permissions-Policy while this section stayed green, because this section reads the file and the file was right. The 4 Aug rule that "set nothing" is the whole error: a rule that sets nothing is not evidence about rules that do. An instrument used to rule something out must be able to see it, and a no-op rule cannot.

WHAT DOES NOT CHANGE IS WHERE THE HEADERS LIVE, and now for a reason that survives being checked: a file in the tree can be diffed, guarded and shipped inside a release; a dashboard rule can be none of those. The rule was deleted in 3.4.3. NOTHING HERE GUARDS THAT IT STAYED DELETED — this section reads the tree, and a guard pretending to read the wire would be worse than an honest gap. The wire check is in the release checklist. qa/sweep-repo-page-dns-2026-08-08.md.

HSTS and X-Content-Type-Options are deliberately NOT here: those are set at the edge (SSL/TLS panel and Managed Transforms), and setting them twice would mean two places to be wrong.

CSP is deliberately not here either. It lives in the <meta> tag whose hash section 10 blesses against the one inline script; splitting one rule across two files is how the hash goes stale without anything noticing.

#### §98 The progress card is drawn here, from the real counts (the 2.7.x cosmetics)

Three cosmetics, reported by the owner against live 2.7.0. They are here rather than left to the CSS because a cosmetic with no guard is a cosmetic that comes back: each one is a single value that reads like tidying, and one of them is a value THIS PROJECT ITSELF moved in the release before.

The era note touched the line above it. .gbody carried no top padding, and .group.open .ghead draws a 1px rule underneath itself, so the first line of the note sat directly on it. The space goes on the parent's padding rather than the note's margin: with a zero-padding parent the child's top margin collapses straight out of the box and nothing moves.

The rating badge sat beside the Where-to-watch link. That was 2.2.0's fix for its own soak note, and it made the rating read as part of the link rather than as what it is. It now sits with the other badges everywhere, which section 92 holds seat by seat.

THE SHARE CARD'S BOTTOM BLOCK IS BACK WHERE IT WAS, AND THIS IS THE ONE TO READ BEFORE CHANGING ANYTHING. 2.7.0 moved the bars, the rule, the strapline and the domain up by 145px to clear the strip Instagram reserves for its reply bar, and moved the bat and its glow up with them. The reasoning was sound and it was shipped without the one-minute Story test that was written into the plan to gate it. On a real card it left a third of the canvas empty below the domain, and the balance the card had was worth more than the risk it was avoiding. Reverted in 2.7.1.

The argument for moving it is still true and still on the record, so it will read as unfinished work to whoever finds it next. It is not. If it is ever revisited, the answer is not to shift the block again — it is to keep the composition and shorten the canvas, and that wants the Story test first.

#### §116 The fonts really carry what the page really renders

SECTION 106 HAS NEVER READ A FONT. It compares each file's bytes and hash to qa/font-subset.json — a manifest qa/subset-fonts.py writes itself — so narrow-the-range, re-run, re-bless leaves it green over a font that lost glyphs. That was the recorded hole, deferred twice as "needs real cmap inspection and a new dependency."

IT NEEDED NO DEPENDENCY. woff2 is a Brotli-compressed sfnt and Node ships zlib.brotliDecompressSync, so the table directory, the cmap and its real codepoint set are all reachable in pure Node — which matters, because "Zero dependencies" is stated in this file's own header and in README's QA paragraph, and shelling out to fontTools would have falsified a guarded claim to fix an unguarded one.

AND IT FOUND A SECOND HOLE NOBODY HAD RECORDED. Section 106's other half asserts that every character the page renders sits inside the blessed range — and it scans the file for literal non-ASCII only. The star, the caret and the external-link arrow all ship as \uXXXX ESCAPES in the script, so the check could not see them and has been passing over four characters that are in none of the six faces since the subset landed. The escapes are counted here.

THE FOUR ARE NOT A DEFECT, AND THAT IS THE POINT OF RECORDING THEM. A star, a caret, an arrow and a guillemet are UI marks rather than text; they render from the system font, they have always rendered from the system font, and subsetting four symbol glyphs into five faces would spend bytes for a worse result. What was wrong was that nobody had decided it — it was invisible, not intentional. It is a named exception now, and like section 107's nested section, the exception is asserted rather than assumed: if one of them ever turns up INSIDE a face, this fails, because the reason it was excepted has gone.

#### §119 Where to watch has a rank of its own

THE README'S FEATURE LIST LEADS WITH IT — "Where to watch, without picking a side" — and introBlock() promises every first-time reader "Tap anything for what it is and where to watch it." It shipped as the fainter of two identical pills: `.lnk` and `.act` were the same rule twice, differing only in text colour, at 5.08:1 against .act's 5.87.

IT WAS CALLED SECONDARY ONCE, FOR A REASON THAT WAS NOT ABOUT ITS IMPORTANCE. At 10px with .1em tracking the label needed ~112px and the hero's 38% column gave 96px, so it wrapped; the label was shrunk and "it is a secondary control anyway" was the justification. That justification went into NOTES.md and the CHANGELOG, where it read as a considered statement about the feature. It was a layout constraint promoted to a rule of the design. Both notes are corrected in 3.1.0.

AND THE NOTE CLAIMED AN ALIGNMENT THAT WAS NEVER TRUE — "it only has to share Skip's edges, not its weight." Measured at 375px: the hero pill stopped 8.0px short of Skip's right edge, stood 38px against Skip's 46, cornered at 8px against 11, and in an expanded row sat 171.7px right of the description, the tick indent and both buttons. The left edge in the hero was perfect, which is what let it survive eleven releases: the one edge anybody would check was right, and a faint outline stopping early against a faint outline is not something an eye finds. The fill did not cause any of it. It stopped hiding it.

A decision worth keeping becomes a guard, not a document. Every assertion here is read from the two rules that have to agree, never from a remembered pair of numbers. The contrast arithmetic is section 20's — one intention, one place — and this section holds the pairing that keeps it able to see.

#### §122 The scroll restore survives content-visibility

THE DEFECT THIS EXISTS TO STOP COMING BACK, 3.4.0. render() ended with `if(keep) window.scrollTo(0, keep);`. The line is correct in isolation and wrong in place: it runs in the same task as `v.innerHTML = ...`, and .group carries content-visibility:auto, so every off-screen group still measures its contain-intrinsic-size rather than its real height. The document is about a third as tall as it is about to be, the browser clamps the scroll to that shorter maximum, and the reader loses their place. Measured 2233 -> 1011 at 390x844 with the row count and the final document height both unchanged, which is what rules out any content explanation. qa/soak-3.3.2-scroll-restore.md.

It reached every caller that relies on render() to hold position -- the filter chips, peek, the belt, mkcode, the theme buttons -- and it survived because nothing could see it. Section 103 asserts what tickUpdate CALLS. The smoke gate serializes HTML, and a scroll leaves no mark in markup. browser-check.mjs did not click a tick until this release. Three green instruments and one defect, which is the same shape as 3.3.2's jump.

Asserted on source, because jsdom has no layout and nothing in this harness can watch a scroll clamp -- the same limitation section 120 works around, and the same one that let this walk in.

3.9.7: the restore is scrollPut(keep) on #app, not window.scrollTo -- the window is checked as a banned scroller where the lock is asserted. The clamp is #app's own maximum now, and #app is exactly as short under content-visibility as the document used to be, so .settling keeps its job unchanged: the class has to be on #view when the browser computes the element's maximum scroll offset.

#### §128 The Belt parks as the peek, and the peek tells the truth

3.6.4, from the corrected drop's first evening — and rebuilt once inside the same version number, before upload, on the owner's second report.

THE FIRST CUT NEVER RENDERED ON THE OWNER'S MACHINES. It hung the parked strip off a CSS anchor (position:fixed, anchored to the guide), and the owner saw no sliver at all — Chrome, Brave, Edge, desktop and mobile — while the harness Chromium drew it pixel-perfect on every tab. The failure was never diagnosed to a line; the dependency was removed instead, which is the standing rules' inverse move: the peek is now the SAME sticky strip it always was, pulled up under the header by a margin, and there is nothing left in it for a browser to lack.

AND THE OWNER RESET THE STATE MACHINE. "The utility belt from Batman: once you choose, it stays under the header, so you can use it whenever. You don't use it much, but it needs to work perfectly." So parked is not a place the belt gets to by scrolling — it is where the belt LIVES once a path is chosen. Every tab, every scroll position, always the peek; tap it to drop; the drop retracts to the peek. The whole strip sits in the flow only pre-choice, where the peek would be debris (F4). Hidden-state bookkeeping, the tab-change carry, the reveal gesture, the JS anchor probe: all deleted rather than fixed — a state that no longer exists cannot resurrect.

Three rules survive from the first cut unchanged: the drop toasts down (the retraction mirrored — render() rebuilds the strip, so the base transition can never carry an entrance), every stack seam overlaps (the 6px margin left +1px of daylight between the pouches — the 3.6.1 window at 1px scale), and a dropped belt never crosses a tab change.

#### §83 The manifest id is an identity, not a path

A browser keys an installed app on manifest.id. Change it and every install already on a home screen is orphaned: the old app keeps running the old cached build forever and the new one installs beside it. It looks like a path and it is not one, which is exactly why it gets "tidied" during a domain move — this one was changed from /Night-Watcher/ to / during 1.8.0 and reverted before shipping, caught by chance rather than by anything here.

IT WAS CHANGED ON PURPOSE IN 2.7.0, ONCE, AND THE REASONING MATTERS BECAUSE THE RULE ABOVE IS STILL RIGHT. The old value was the GitHub Pages *project page* identity, and on the apex it resolves to https://nightwatcher.life/Night-Watcher/ — a path that does not exist. The 2.5.1 retirement round missed it because guard 77's inverted check greps for the retired host, not the path.

The standing decision was to leave it, on the grounds that orphaning installs costs more than a cosmetic wrong. That decision was taken while treating the install base as fixed. It was not: the measured base was near zero — 100 apex visits total, with the analytics beacon only live since 2 Aug 2026 — and Batman Day was five weeks out. The cost of this change is proportional to the install base, so it fell to roughly nothing on 4 Aug and rises with every install afterwards. Leaving it would have meant every install made from 19 Sep onward keyed to an identity pointing at a path that does not exist, permanently.

So: paid once, deliberately, at the last moment it was cheap. The rule does not relax — this guard now pins the new value with the same force, and there is no second exception coming.

#### §104 Permissions-Policy dead tokens

3.4.2 PUT TWO TOKENS IN THIS LIST AND ONE OF THEM DID NOT BELONG. The comment here used to read: "TWO DEAD TOKENS, ONE OF WHICH WAS SHOUTING. `usb` is not a registered Permissions-Policy feature, and Chrome logged 'Unrecognized feature: usb' on every single page load."

THAT IS WRONG AND 3.4.3 REVERSES IT. `usb` IS the policy-controlled feature for WebUSB and Chrome accepts it. The warning came from the 7 Aug scanner's own browser engine, not from Chrome and not from a malformed header: the live response carried usb=() while Chrome's console stayed silent through three loads. The triage that recorded it caught the same report's CSP error, its DNSSEC error and its HSTS error, and took the console warning at face value because a console warning feels like evidence rather than like a reading from one engine.

WHAT THAT COST IS THE POINT OF LEAVING THIS WRITTEN DOWN. For one release this guard forbade putting back a legitimate header value — a guard blocking the correct state, which is worse than the noise it was written to stop.

`interest-cohort` STAYS REFUSED, and for its own reason: it is the FLoC opt-out, FLoC was withdrawn, and the token really is dead.

A HAND-MAINTAINED LIST INSIDE A GUARD IS THE GUARD. Growing or shrinking this array is the change, and negtest340 is the only thing that proves it — which is why the usb fixture came out in the same commit. Refused by name rather than pinned as a whole string: the policy is allowed to grow, and a future token deserves an argument rather than a diff.
