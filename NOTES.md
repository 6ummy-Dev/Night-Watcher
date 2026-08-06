# Night Watcher — why the code is the way it is

`docs/index.html` carries no explanatory comments. It is the only file that ships
to a reader, it has a hard weight budget, and the reasoning does not need to
travel with it. This is where the reasoning lives.

Every entry below sat in the file as a comment until 1.6.3. Nothing was
rewritten on the way out — where a note reads like it is arguing with a past
decision, that is because it was.

Three other places carry part of the story and are not repeated here:

- **`CHANGELOG.md`** — what changed in each release and why, in the owner's voice.
- **`qa/guards.js`** — 120 numbered sections, each one a rule with the failure that
  produced it written above it, and each one negative-tested.
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

Limelight, Anton and IBM Plex, all under the SIL Open Font License, served from
`fonts/` rather than a CDN — the app makes a promise about asking nothing of
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
open web (GitHub Pages etc.); memory-only if neither is available.

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

One definition of "in this group", for Home's grid, Progress's rows and both
donuts. It was written out seven times; a rule added to one of them and not
the others made two tabs quietly disagree about the same group. Keys are
goToGroup()'s: "c" plus a PATH index, "e" plus an era.

### `tierOf()`

Tier membership is EXCLUSIVE: Essential > Optional > Core. The raw o:1 flag
is a ROUTE marker, not a tier — every TV season carries it. Always resolve
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
asking the same question is the point. Thirteen titles repeat across the
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

### `return "NW2W" + w.join("") + "S" + k.join("") + "R" + r.…`

NW2 adds the path in a P segment. 1.1.0 skips segments it does not know,
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

### `if(en && en.id && isFinite(en.ts) && !S.log.some(functio…`

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

### `html += '<div class="bk"><h3>Your data</h3>'+`

The path row here duplicated Home's Change. What is left is progress in
portable form, which is why it stays in Progress.

### `'<p class="note">Announced dates can move. \u00b7 Build …`

Named titles here went stale every time one landed or another was
announced. The fact is about announced dates, not about which ones.

### `v`

Scroll lives on the document, not <main>: <main> has no overflow, so its
scrollTop is always 0 and every re-render threw the position away.

### `qWasFocused`

Refocus if the box HELD focus, not if it merely has text — keying off S.q
shut the keyboard when you deleted the last character.

### `Array.prototype.forEach.call(document.querySelectorAll("…`

aria-current, not aria-selected, which is meaningless on a plain button.
Removed rather than set false: it has no false state and the CSS matches
on presence.

### `maxY`

Clamp: the new view can be shorter than the old one, and restoring past
the end of the document leaves the page parked in empty space.

### `calmScroll()`

The CSS kills transitions under prefers-reduced-motion; these two scrolls
were never covered by it, so the one setting that says "do not animate" was
half honoured.

### `persist();`

groupOpen persists as of 1.3.5; tab, filter, query and mode remain session
state by design. Jumping is a deliberate act, so its collapse sticks.

### `target`

A collapsed group is still a 56px sticky header, so scrolling to the top
can leave the requested group far below the fold.

### `window.addEventListener("storage", function(e){`

Two tabs — or a tab and the installed app — both wrote the whole payload on
every tick, so whichever acted last silently erased the other's marks. No
sync involved; just last-write-wins on one device. Marks only ever move from
unset to set, so the merge is a union and never resurrects an untick made
here.

### `document.getElementById("topBtn").addEventListener("clic…`

The wordmark is the one element on every screen, so it is the natural
"back to the top" — scroll lives on the document, not on <main>.

### `/* Activity carries no badges. 1.5.9 added them because …`

One line, on request. Never the description — the whole premise is that
nothing ahead of you gets spoiled, and the description is where that risk
lives. Badges and the continuity name are facts about placement, not plot.

### `else if(act === "peek"){ S.open[id] = !S.open[id]; rende…`

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

### `h.slice(1).toLowerCase().split(/[-+]/).forEach(function(…`

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

### `--steel:#7295CC;       /* cape blue-grey */`

utility-belt yellow

### `--crimson:#C43A30; --crimson2:#DD7A73;     /* animated-s…`

cape blue-grey

### `--moss:#7FA98B;        /* interactive badge */`

animated-sky red, AA-adjusted

### `--deco:"Limelight","Big Shoulders Display",serif;`

interactive badge

### `:root[data-theme="darker"]{`

AMOLED variant. Surfaces only, so contrast can only rise from here.

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

### `.bd.m`

modifiers — outlined footnotes

### `/* The dash carries "different axis"; it used to also ca…`

format — a different axis, and only in All

### `.bd.fmanim,.bd.fmlive{color:var(--dim);border:1px dashed…`

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

Buttons, not divs. The donut slices they mirror are pointer-only — no
tabindex, no role, no key handler — and the universe rows at least had a
keyboard route through Home's grid. The era rows had none at all.

### `.legend > span`

The swatches are real badges, so the row has to align them against the note
beside them rather than sit them on a text baseline.

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
still reads as the question asked first. Signal marks the path you chose;
card2 marks the rest.

### `::selection{background:var(--signal);color:var(--ink);}`

Canon skin: Dark Deco. ADDITIVE only — restating a token here leaves its
real value 180 lines from its declaration.

### `html{scrollbar-color:var(--line2) transparent;scrollbar-…`

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

It holds 48 entries against the next largest at 29, and the question comes back
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
worth more than a deleted section.

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
send a header and has to keep serving. It says `follow` as well, so the links
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

### Cross-tab merging only ever adds

The `storage` listener merges another tab's marks in and never takes any out.
Untick a film in one tab and the other — which still has it — writes it back on
its next save.

That is deliberate. Losing a tick is a worse failure than an unexpected one
reappearing, and there is no timestamp on a mark to reconcile with. If it ever
becomes a real complaint, the fix is a per-mark timestamp, not a smarter merge.

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
  exactly what this said it was: sourcing a rating for 200 entries. That pass
  lives in `catalogue/ratings-findings.md`, every value carrying its source, and
  section 92 holds the distribution. The Mature badge it replaced was retired in
  2.7.2, four releases later, which became its own rule: a replacement is two
  changes and only one of them has a natural failure mode.
- **Master chooser and header magic** — **shipped.** It did want a picture
  first, and it got one; the header has been corrected three times since and the
  measurements are in `releases/plan-2.8.0.md`.

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

It ships **by universe only**, and that is a decision rather than an unfinished
job.

By universe needs no sort. Each continuity's array *is* its spoiler-safe order —
the same fact guard 78 leans on for the seed — so the export is the data read
back out. Bruce's life and Release order are not: both are produced by anonymous
comparators inside `buildGroups()`, and `fn()` can only extract **named**
functions out of `docs/index.html`. Writing those two sorts into `qa/guards.js`
would be a second implementation of the app's ordering, which is the exact thing
the extract-don't-reimplement rule at the top of that file exists to prevent — a
copy drifts from the app and quietly stops testing it, and here it would quietly
start *publishing* the drift.

The alternative is to name the two comparators in `index.html` so both sides
share one source. That is a `buildGroups()` refactor. It is app logic, and app
logic does not ride a release whose whole claim is that it cannot break the app.
It is a real option for a round that is allowed to take that risk.

The loss is smaller than it reads. Release order is derivable from the file —
every entry states its year. Bruce's life is not, and it is also the ordering the
app itself calls *an interpretation rather than a canon*, so the app is the
honest place for it. The file's own header says which ordering it carries and
where the other two live, rather than shipping two thirds of a promise quietly.

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

The weight budget guards `docs/index.html` — 200 KB raw, 80 KB gzipped — and it
has been the project's most-cited discipline. It also could not see the fonts.

Six faces at 118,860 bytes against a page that compresses to 52 KB: the
typography was more than twice the weight of the app, and every arithmetic
argument the project ever made about weight was about the smaller half. None of
it was dead files — all six are referenced and precached. It was glyph coverage
for languages the catalogue does not contain.

Subsetting five of them to Latin-1 plus punctuation takes 55,864 bytes off,
turning a 296 KB first visit into 241 KB. **Limelight is left whole because its
OFL header names a Reserved Font Name**, so a subset would have to be renamed
in the font, in `@font-face` and in `--deco` — real churn and a licensing
judgement, for the last 10.3 KB. Anton's and IBM Plex's headers carry no such
name.

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
