# Night Watcher — the history behind the notes

`NOTES.md` says how the code is shaped and why, in the present tense. This
file is where the post-mortems, the release essays and the archived comment
blocks went (4.9.0, item 7.7 of the 4.8.0 report): every section here is
about a release that has shipped, and none of it is required reading before
a change. Each heading carries the first release the section cites — the
one it was written for, in nearly every case — so a reader can tell at a
glance how old the argument is. Sections that were later superseded say so
in their own text and are marked "(historical)" in the heading; nothing
here was rewritten on the way out.

The guards read `NOTES.md` (section 65 anchors its per-symbol headings into
`docs/index.html`) and never this file: a heading here that quotes a line of
the app is a quotation from the release it names, not an anchor.

---

## 3.0.0 — Parked by decision, not by neglect — all three have since shipped

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

## 1.8.3 — Where the negative suites' eight minutes actually went

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

## 2.0.0 — The belt's snap was a layout problem wearing an animation costume

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

## 2.7.0 — Reading layout after writing it, 216 ms at a time

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

## 2.7.0 — The same defect, at the other end of the same function

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

## 2.7.0 — The favicon that every browser drew and no crawler could see

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

## 3.8.3 — Why the fonts were 39% of the payload and nobody noticed

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

## 2.7.0 — Two guards in one month that pinned a layout instead of a decision

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

## 2.7.0 — A release that shipped a change its own plan had gated

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

## 1.7.0 — A badge that outlived its replacement, and why nothing caught it (historical)

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

## 2.6.0 — The export nobody could find

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

## 2.7.2 — The header was never misaligned, and that is why it stayed wrong

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

## 2.7.3 — Removing a button leaves a handler nobody can reach, and the build stays green

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

## 2.7.4 — A dropped quote, and what the harness did about it

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

## 2.7.3 — The header, corrected three times, measured wrong every time

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

## 3.0.0 — A watcher that cannot see is worse than no watcher

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

## 3.0.0 — A title is not a production

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

## 3.0.0 — Three copies of one merge, and only one of them kept the invariant

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

## 3.0.0 — A render nobody asked for is still a render

`#restorebox` was rebuilt empty by every `render()`, and renders fire from things
the reader did not do: another tab's storage event, and the four-second
reset-confirm timeout — which is gated on `S.tab === "stats"`, the very tab the
box lives on. Paste a backup code, let another device tick something, and the
paste was gone with nothing said. `#q` had been preserved across renders for
releases. The box holding somebody's only copy of their progress had not.

## 3.0.0 — The surgical paths, and the arithmetic that makes them safe

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

## 2.5.1 — Nothing in this project declared a cache policy

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

## 3.3.0 — A scroll restore that measured a document which had not been laid out yet

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

## 3.4.0 — Three of four controls dropped focus to the page, and the fourth hid it

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

## 3.3.2 — The drive that was green against the defect it was written for

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

## 2.5.0 — The bar that serialized differently

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

## 3.4.0 — Two fixtures that were aimed at the wrong function

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

## 3.1.0 — The harness reads a server, not the tree it sits in

`browser-check.mjs` loads `NW_URL`, default `http://127.0.0.1:8099/`. Copying
the tree, breaking the copy, and running the check from inside the copy tests
whatever the server is already serving — the original. Three runs against a
deliberately broken build reported green that way, and the symptom is
indistinguishable from a check that cannot fail, which is the exact thing this
release exists to stamp out.

Serve the copy on its own port and pass `NW_URL`. Done properly, both new
assertions go red: the group element is replaced, and the height falls
`3512 → 66` with the document at `15347 → 11901`.

## 3.5.0 — The belt parks as the peek, and what 12px is allowed to say

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

## 3.6.0 — The drop that never made the argument it was blocked on

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

## 3.6.1 — The pouch that was a window, and the header that walked through the belt

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

## 3.6.2 — `top` does not stop existing when `position` changes

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

## 3.6.3 — The drop arrives closed, and a selector is not a door

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

## 3.6.4 — The belt's edges — and the cut that never rendered

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

## 3.7.0 — The install seat, and the footer split

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

## 3.8.0 — A removal is a fact, and the clocks that finally made it one

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

## 3.8.0 — The root negotiates markdown, and what was declined to get there

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


## 3.8.1 — One donut, the belt's — and the footer finds its voice

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


## 3.8.1 — The donut becomes the skyline

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

## 3.8.3 — The box that stood still, and the hat by the door

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

## 4.0.0 — The deck goes sideways, and the scrollbar finally learns its place

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


## 4.0.5 — The band iOS paints under the installed app, and the one hand that reaches it

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


## 4.0.8 — The heal: the band was a viewport nobody ever re-asked about

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

## 4.0.0 — The glow stopped pulsing, and the history of why it kept being almost right

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


## 4.0.9 — The probe's verdict: the render is short, and the pad was the part we owned

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


## 4.1.0 — The card's two charts become one

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

## 4.1.1 — The README goes on a diet

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

## 4.3.0 — The deco release: one face, a real dark, and the cut

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

## 4.3.1 — The offset with two sources, and the tab that was accidentally right

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

## 4.4.0 — The deco pass: the cut becomes rank

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

## 4.5.0 — The city: the shaft is the chart, the crown is above it

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


## 4.6.0 — The belt is yellow, and the drops are part of it

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

## 4.7.0 — The cover, and why it is not a splash screen

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
bat shrinking to a third of itself, 320ms — and removes the element after the
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

## 4.8.0 — The third pouch: the tier becomes an include axis

4.8.0. The owner's brief was one sentence: if someone only wants the core
or the essential route, why do they have to skip? The answer was in the
architecture. The Belt held two "what is included" settings, format and
scope, and both fed `visible()`, which builds `pool()`, which is the one
source for everything that counts — the header ring, the scoreboard, Next
up and its queue, the universe / era / decade bars, the skyline, the share
card. The chips on The path were a different thing entirely: a sieve on
rows inside `groupBlock()` that touched no denominator. So the tier had
never been an include setting, only a view filter, and the workaround was
to skip a hundred-odd Optional entries one by one — per-entry state that
polluted the Skipped count and put steel on the share card where there was
never anything to skip.

**One term, not forty.** `S.tier` beside `scope` and `format`, one call to
`onRoute()` at the end of `visible()`, and the tier appended to
`groupsKey()` so the group cache invalidates with it. Every count follows
without further code, because they all read `pool()`. `onRoute()` goes
through `tierOf()` — section 4 has refused the raw `f.o` flag since the
9-season gap, and the new section 152 refuses it in this function by name
— so the belt and the chips resolve the tier through one function and
can never disagree about what "Core route" means. Skip goes back to the
job it was built for, "not this one, not now": the reader who skipped an
announced title on the route still does, and unskips it when it lands.
Route decides what counts; Skip decides what you are stepping past inside
what counts. Two questions, two controls, and they compose: an entry that
is both skipped and off-route leaves the count while the belt is narrow
and comes back, skip intact, when it widens. No migration.

**The chips stay, all seven.** The owner's call, and the right one: a
filter is a glance, and a glance must not need the belt opened in that
tab. The four status chips are about what you have done inside the route
and are untouched. The three tier chips overlap the new setting only
partly — under + Optional they are a peek that moves no number; under a
narrower belt the Optional chip can show nothing, and it used to say
"Nothing in this filter yet", which was false. It now says the entries
are outside the route, names the setting, and offers Add optional through
the same handler (the "Search everything" shape from 1.7.5).

**The wording took four rounds, all before code.** The first draft ended
the tier row in "Everything", and the format row already ended in "All":
two synonyms on two rows, one belt. "Both" for the format row was
rejected because a closed buckle reading BOTH means nothing. "Core +
Optional" for the wide tier was rejected because a reader who does not
know the tiers may read it as excluding the Essentials. The settlement:
no button in any pouch says All. The format row ends in "Animated +
live", the scope row in "Movies + Series", the tier row in "+ Optional"
— each an addition, each naming what it holds, the plus the same plus
throughout. Inside a row "All" would have been unambiguous, but the rows
sit stacked, and two rows ending in the same word is what the reader sees.

**The buckle names only the narrowings.** The old buckle echoed two
buttons — "All" over "Movies" — and a third line would have made "All"
ambiguous the moment a second wide word sat under it. The rule now: a
wide pouch is silent, because wide is the default and says nothing worth
reading; each narrowing is a line, in pouch order; and when nothing is
narrowed there is nothing to list, so the buckle collapses to the app's
own two words, EVERY BATMAN — the project's tagline, and the words the
share card says at 100%. The design rests on one assumption, stated so it
can be checked: silence has to be learnable. A buckle reading only
ANIMATED is saying series and Optional are in. It is, because every
narrowing is a choice the reader made a moment ago and opening the belt
shows all three rows anyway. The accessible name does not rely on that —
it reads all three answers in full. All of it was measured before it was
built: the slot is 55px at 390 and grows with content, "Movies + Series"
already took 62px, three lines fit the 44px belt, and "Essentials + Core
+ Optional" at 116px was out of the question, which is why the additive
form lives in the pouch and not on the buckle.

**What broke on the way.** "ANIMATED + LIVE" at the chooser's 10px and
`.09em` tracking wrapped across two lines at 390 — the 1.5.7 failure at
the other size. The rows now take the pouches' `.05em` with `nowrap` and
4px side padding, and the third button runs a few pixels wider than its
neighbours at 375 and 360 rather than wrap; measured at 390, 375 and 360
before it was accepted. And "every Batman there is" was said in three
places on any 100% run, including an animated-films-only one; it now
lives once, gated on all three axes.

## 4.5.1 — The seal: what a tree says about itself has to be true

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

## 4.5.1 — Where the served and config files' histories went

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


## 4.5.1 — Where the guards' histories went

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

## 4.9.0 — The clean road: a report closed whole, and what that cost

The 4.8.0 report was the first full-repo QA since the seal, and the owner's
call was to fix all of it at once — the defects, the tooling, the documents,
the catalogue prompts and the groundwork — rather than let a backlog form
around a tree that had never had one. Three findings were the kind a reader
could meet: release order broke same-year ties by title, so a numbered
trilogy rendered out of order in the app and in the export; the
search-everything offer counted entries the tier pouch would then hide; and
the cross-tab merge merged in memory and never wrote back, so two tabs
racing the debounce could each hold a union that neither had on disk. Two
findings were about the harness telling less than the truth: thirteen head
tags could be deleted with a green `npm test`, and a warning never reached
the exit code — "all guards passed (1 warning(s))" with a section switched
off is the silence-reads-as-success family wearing its own uniform.

The groundwork was the expensive half, and it was priced deliberately: the
key scheme, the persisted state, the segmented controls and the render's
input dance each moved from five-or-six hand copies into one table or one
helper, and the guards that pinned the old spellings — about twenty
sections and fifty fixtures — were re-anchored on AST predicates so the
NEXT refactor of the same shapes does not go red in twenty places. The
histories moved in the same cut: NOTES.md keeps the present tense, this
file keeps the past, the changelog opens at 4.0.0 with the 1.x–3.x entries
archived whole, and the served files carry their invariants plus a pointer
instead of their memoirs. The 4.9.0 delta review then found the release's
one honest irony — the sweep and the pointers did not cover the release's
own additions (the five new documents had no row fixtures; two pointers
aimed at the file the histories had just left), which is the same drift the
release was built to end, landing inside it. 4.9.1 closed that loop and put
the completeness checks where the prose had been: the sweep counts the
table's rows, the pointers are read on every run, and the shard balance is
measured instead of stated.

## 5.0.0 — The kick that said the wrong true number

5.0.0 put a position on Home's kick: *Tonight's patrol ◆ 80 of 200*, the
row the reader was standing on, 1-based among released entries in route
order (`routePos()`). Ten pixels above it the header said *79 of 200*, the
logged count. Both were true. Together they read as a disagreement, and
the first reader to see them side by side was the owner, on the render
sheet, the same evening. 5.1.0 made the kick print `c.done` — the header's
own number from the same `counts()` call — and deleted `routePos()`;
guard 155 now refuses it coming back. The lesson is smaller than the
story: two true numbers within a thumb of each other must be the same
number, or one of them must say what it is.

## 5.0.0 → 5.1.1 — "From any door", and the door left open

5.0.0's changelog promised that a parked title "cannot be ticked or
skipped, from any door: the tap, the read, a pasted code, a JSON restore,
another tab". The skip half was true: `toggleSkip`, `applyMarks`'s skipped
loop and the cross-tab merge's skipped branch each carried an `isParkedId`
gate. The watched half was not — the two twins beside them did not, and a
4.x backup code, JSON file, restore link or still-open 4.x tab with *The
Batman: Part II* ticked would have marked it watched, logged a night for
it, and re-exported the mark. The 5.1.0 audit found it in one screenful.
The same audit found the load-time skip drop was in memory only — no
clock, no persist — so the resurrection the release said it had killed was
asleep until release day. 5.1.1 closed both, and added guard 158, which
does what a promise phrased as *every* needs: it enumerates the seats that
write a mark, requires a gate at each, and fails a seventh nobody named.

## 1.x–5.3.0 — "`wrangler` stays a dev dependency" (retired in 5.3.1)

The NOTES.md section below stood from the first Workers deploy until 5.3.1 and was twice amended rather than retired. 4.9.0 removed `wrangler` from `devDependencies` in favour of the pinned `npx wrangler@4.123.0` scripts (CHANGELOG 4.9.0), which made every sentence of it false while it went on being the file's present-tense rule; the 5.3.0 audit (D-2) caught it. Kept here as written.

#### `wrangler` stays a dev dependency

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

## 2.1.0–3.3.1 — Two origins, on purpose, forever — moved from NOTES.md in 5.3.1

#### Two origins, on purpose, forever

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

## 2.1.0–3.3.1 — The offer is conditioned on where it is, not on when it is — moved from NOTES.md in 5.3.1

#### The offer is conditioned on where it is, not on when it is

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

## 2.1.0–3.2.0 — Analytics counts one hostname — moved from NOTES.md in 5.3.1

#### Analytics counts one hostname

> **Amended 3.2.0 — the beacon is gone.** There is no analytics script in the
> page any more; the host counts visits at the edge. What follows is history.

Cloudflare Web Analytics is per-hostname and the free plan takes one hostname
per site, so the token in the page is registered to `nightwatcher.life`. Visits
to the old address are not counted. That is the right way round: it is a
waiting room, not a destination, and a beacon that gets dropped costs a request
and tells nobody anything.

## 2.1.0–3.3.1 — Two signals, because one of them is a request — moved from NOTES.md in 5.3.1

#### Two signals, because one of them is a request

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

## 1.x–3.8.0 — Cross-tab merging only ever added (superseded 15 Aug 2026) — moved from NOTES.md in 5.3.1

#### Cross-tab merging only ever added

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
