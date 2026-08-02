# Night Watcher — why the code is the way it is

`docs/index.html` carries no explanatory comments. It is the only file that ships
to a reader, it has a hard weight budget, and the reasoning does not need to
travel with it. This is where the reasoning lives.

Every entry below sat in the file as a comment until 1.6.3. Nothing was
rewritten on the way out — where a note reads like it is arguing with a past
decision, that is because it was.

Three other places carry part of the story and are not repeated here:

- **`CHANGELOG.md`** — what changed in each release and why, in the owner's voice.
- **`qa/guards.js`** — 78 numbered sections, each one a rule with the failure that
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

### `.prefrow`

The only preference. No heading, no card, last row on the last screen.

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
the dead space beside it. The link is a secondary control and does not have
to match Skip's weight, only its edges.

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

A `<noscript>` list of eleven eras and forty-four continuities is exactly the
kind of thing that goes stale in one release and is never noticed, because the
only people who read it are crawlers. Guards section 78 rebuilds it from `PATH`
and `ERAS` on every run and compares byte for byte; `npm run bless` writes it.

It sits above the empty `<main>` on purpose. That is also checked, because a
correct block rendered after the thing it substitutes for is worth less.

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
push, while the tests need only jsdom. It stays because the Workers path is a
live option for the domain migration, and `wrangler.jsonc` is guarded — section
13 checks its assets directory against `docs/` and rejects SPA fallback, both of
which are real rules about how this site is served.

Reviewed in 1.6.6 and kept deliberately. If the migration lands on GitHub Pages
alone, dropping `wrangler`, its two scripts and the jsonc takes `npm ci` to a
fraction of its size, and that is the moment to do it — not before, and not
without deciding the serving question first.
