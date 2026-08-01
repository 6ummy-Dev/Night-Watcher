# Night Watcher — why the code is the way it is

`docs/index.html` carries no explanatory comments. It is the only file that ships
to a reader, it has a hard weight budget, and the reasoning does not need to
travel with it. This is where the reasoning lives.

Every entry below sat in the file as a comment until 1.6.3. Nothing was
rewritten on the way out — where a note reads like it is arguing with a past
decision, that is because it was.

Three other places carry part of the story and are not repeated here:

- **`CHANGELOG.md`** — what changed in each release and why, in the owner's voice.
- **`qa/guards.js`** — 65 numbered sections, each one a rule with the failure that
  produced it written above it, and each one negative-tested.
- **`README.md`** — what the app promises and what it refuses to do.

If you are about to change something in `index.html` that looks redundant, look
for it here first. Most of it is load-bearing, and this project has a long
history of rules that only make sense once you know what they were written after.

---


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

The last five ticks, newest first, with the stars you gave them and a tick to
take them back. Stars never move the hero — rate() calls markWatched(), a
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

By universe is the recommendation, and nothing said so — three equally
weighted cards leave a newcomer guessing at the one decision the app
actually has an opinion about.

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
