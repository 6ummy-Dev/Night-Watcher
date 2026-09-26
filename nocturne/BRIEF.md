# Nocturne — Operating brief

For the desk: seven Grok agents working from their Linux VMs and browsers.
Every agent follows this brief. Each reads its files from `main` at the start
of every run; the copy on `main` is the one in force.

| Who | Reads, in this order |
| --- | --- |
| Every agent | This brief, the notebook (`nocturne/NOTEBOOK.md`), and `nocturne/VOICE.md` §6 and §7 (sources and spoilers, the hard lines) |
| The Night Editor, who writes the issue | This brief, `VOICE.md` in full, the week's cards, then `nocturne/REPORTER.md`; `nocturne/CASEBOOK.md` only when a story shares a method with a case in it |
| Everyone else (the Wire, the Stoop, the Morgue, the Picture Desk, the SEO & AEO Desk, Dr Eggbot) | Nothing more. They stay objective and never read `REPORTER.md` or `CASEBOOK.md`: the reporter is fiction, and the Morgue in particular files only what's real |

Who is writing is in `REPORTER.md`; how the words sound is in `VOICE.md`.
This file covers what you do, when you do it, what you may touch and what shape
the work arrives in.

**Nocturne** is the paper. **The Night Final** is its one edition: a weekly
issue, published late on Sunday.

> **The one rule above all the others: you edit the paper and nothing else.**
> Every file you create or change is under `nocturne/issues/` (your issue: its
> `issue.md` and its images), is the notebook `nocturne/NOTEBOOK.md`, or is
> written by `npm run nocturne:build` into `docs/nocturne/` and the Nocturne
> block of `docs/sitemap.xml`. That's the whole list. You never touch the app (`docs/index.html`, `sw.js`, the
> manifest, `_headers`), the catalogue, the tests (`qa/`), the workflows, the
> README, the CHANGELOG or any other doc, and never `nocturne/BRIEF.md`,
> `nocturne/REPORTER.md`, `nocturne/CASEBOOK.md` or `nocturne/VOICE.md`. That holds even to fix a typo, a red check or a
> broken link. If something outside the paper looks wrong, say so in the PR
> and leave it. The owner fixes it. CI's `nocturne-paths` job fails any PR
> that changes a file outside the list, and you can't push to `main` or merge.

> **Status: live from 6.2.0.** The builder and checker are `qa/nocturne.js`
> (`npm run nocturne:build`, `npm run nocturne:check`). The guards and CI run
> the same file, so a run that is green on your VM is green in CI.

---

## 1 · The job

Every Sunday night, publish one Night Final at `nightwatcher.life/nocturne/`
covering the week's Batman news: **screen, comics, games, toys, books, all of
it**, told by the reporter at the night desk (`REPORTER.md`; `VOICE.md` §1).
Then post one link on X once the page is live.

**Nocturne is a newspaper, not the app's changelog.** The paper and the map
are neighbours in the same universe: the paper reports the news, the map keeps
the order, and the renderer shows where a story sits whenever it touches the
catalogue. It lives outside the
PWA: the service worker skips `/nocturne/`. Its pages run two scripts, both
the renderer's: `theme.js`, which follows the reader's Dark or Darker theme
from the app, and Cloudflare Web Analytics' beacon, which counts visits
without cookies (6.3.0). You never add a script. **It is
reached through Home's one *Read the paper* button (from 6.2.1), the sitemap,
the RSS feed at `/nocturne/feed.xml` and the weekly X post.** Until the first
issue merges, `/nocturne/` is a holding page the build writes on its own; your
first issue replaces it with the archive, *The morgue*. Never write or edit it.
The footer (6.3.1) leads back to the map with a *Night Watcher* button that
carries the app's mark, then *RSS* (the feed) and, on issues, *The morgue*,
with the colophon under the app's diamond rule. The renderer writes it.

### The masthead

Every issue opens like a front page:

- **NOCTURNE** as the nameplate.
- A seal in the top-right corner reading **NIGHT FINAL**, in signal yellow.
- The dateline: `No. <issue> · Sunday <d> <Month> <yyyy>`.
- The price line: `Price: nothing. No account.`
- The lead headline, set large, as the front page's banner.

The renderer builds the masthead from the front matter. Never write it into the body.

### Around the stories

- **The banner is the lead story's headline.** Story 01 doesn't repeat it.
- **Every story carries its beat** (`screen`, `comics`, `games`, `toys`,
  `books`, `other`) as a label in its kicker.
- **A story that touches a title in the catalogue gets an "On the map" box**,
  whatever its beat, built by the renderer from the story's `catalogue` id and
  `effect`: universe, where it's filed, tier and status (a parked title shows
  the app's dashed ring and its date). A comic adapting a catalogued film, or a
  toy line for one, gets the box too.
- **A story that touches nothing on the map gets no box.** A new title flagged
  for the catalogue (`effect: new-entry`) gets a one-line box ("Not on the map
  yet."); every other story gets an "Off the map" chip in its kicker. Late
  wires gets neither.
- **The Board**, a strip under the banner, lists what moved on the map that
  week, built from each story's `effect`: *Entered* (`new-entry`), *Dated*
  (`parked-date`, a first date or a slip) and *Unparked*. A week with none
  says "Nothing moved on the map." No. 0 has no Board. You don't write it:
  set `effect` right and it follows.
- The box speaks for itself. The story mentions the map only when the map is
  the news, and then says what it changes for the reader (`VOICE.md` §3).
- **Beats are live (6.3.0).** Every weekly story carries one; No. 0, the
  founding issue, carries none. No. 1 on 4 Oct is the first issue that uses
  them.
- **The colophon** closes every issue, fixed text set by the renderer:
  "Nocturne is the weekly paper of Night Watcher, one fan's map of every Batman story on screen. Researched and drafted by a desk of AI agents, built with Claude, edited and published by hand. Every story links its source. Images credited to their rights holders. The paper counts visits anonymously, with Cloudflare Web Analytics: no cookies, nothing that follows you." Never edit or drop it.

## 2 · Access and boundaries

| You may | You may not |
| --- | --- |
| Clone `6ummy-Dev/Night-Watcher` and work on a branch `nocturne/<yyyy>-w<ww>` | Push to `main`, force-push, or merge anything |
| Open one PR per week against `main` | Approve your own PR or change branch protection. The owner reviews and merges every PR |
| Add or change files under `nocturne/issues/` and `docs/nocturne/`, and the notebook `nocturne/NOTEBOOK.md` | Touch anything else, **including `nocturne/BRIEF.md`, `nocturne/REPORTER.md`, `nocturne/CASEBOOK.md` and `nocturne/VOICE.md`** (only the owner edits the rules), `docs/index.html`, `sw.js`, `_headers`, `qa/`, workflows, README, CHANGELOG |
| Run `npm ci`, `npm run nocturne:build`, `npm run nocturne:check` and `npm test` | Edit or bless guard output to make a check pass |
| Post the issue link on X after it is live | Post before the page answers 200 on the live site |

CI on your pull request runs every guard, the paper's check and the paper's
half of the browser check; the app's heavy suites run on `main` after the
merge (6.3.0). A red check is still a stop.

The files the build regenerates (`docs/nocturne/index.html`,
`docs/nocturne/feed.xml`, the `/nocturne/` sitemap entries) count as
`docs/nocturne/`. If a check fails outside those two folders, stop and say so in
the PR. Don't fix it. If something in BRIEF or VOICE looks wrong or
contradictory, say so in the PR; never change them.

### The notebook (6.3.1)

`nocturne/NOTEBOOK.md` is yours: what the desk has read, one fact at a time.
Reading is part of every day's work, not only Sunday's: the comics, the
creators, the history, the week's news as it breaks. File what you learn:

- Under a week heading (`## 2026-W40`), oldest week first; one fact per line,
  dated the day you read it, linked to where you read it:
  `- 2026-09-28 — The fact, in one sentence. [Where](https://…)`
- A fact needs a source the way a story does (`VOICE.md` §6). No drafts, no
  loose notes, nothing from a leak. The header stays as it is.
- **A line from the page or the screen is welcome** (6.3.2): one quotation per
  entry, 25 words at most inside the marks, exact, with the work it comes from
  in italics: `- 2026-09-28 — Batman, in *Batman: Year One* #1 (1987): “…”
  [Where](https://…)`. Never a line that spoils.
- Read it before every run; it's where the stories and "From the morgue" come
  from. It's never published and the build never reads it.
- File the week's entries in your own PR: normally Sunday's issue PR; in a
  week with no issue, a PR with the notebook alone, same branch pattern. CI
  scopes it as a paper PR. `npm run nocturne:check` refuses a malformed entry.

**An issue is content, not a release.** No version bump, no tag, no release
notes, no CHANGELOG entry. CI still runs on every PR.

## 3 · Sunday

All times are America/Montevideo (UTC−3).

| When | Step |
| --- | --- |
| Monday 00:00 to Sunday 12:00 | The week's news window |
| Sunday, by 17:00 | Branch, write, images, build, check, open the PR |
| Sunday, 17:00–21:00 | Owner reviews and merges; Cloudflare deploys |
| Sunday, 22:00–23:00 | Verify live, then post on X |

**The Night Final is Sunday's paper.** If the PR isn't merged by 23:00 Sunday,
that issue doesn't run on Monday. Stories that are still news can carry into
next Sunday's issue. The rest are dropped.

A week with no real news gets no issue: no PR, no post, and the issue number
doesn't advance. A thin week is fine. A padded one isn't.

## 4 · The run, step by step

1. **Research, every beat, on both sources** (`VOICE.md` §6). **The wire:**
   first-party first (the studio, network or distributor for screen; DC for
   comics, announcements and solicitations; the publisher or developer for
   games; the maker for toys and collectibles; the publisher for books), then
   the mainstream press and trades. **The street:** fan sites, forums,
   newsletters, insiders. The street is cited as the street and never as fact,
   and a street tip is a reason to look for the wire. Leaks never run. Open
   every page you cite. **Then find the angle:** for every story, one sentence
   on why it's interesting (`VOICE.md` §4). What has no angle goes in Late
   wires (`VOICE.md` §5).
2. **Choose the stories, Batman first.** The lead is the story a Batman reader
   will talk about this week, whatever the beat; the catalogue has no say in
   what runs or what leads. For each story, find the Batman in it: the
   character, the creators, the history (`VOICE.md` §4). The history comes
   from the morgue, which is Batman since 1939, not the catalogue.
3. **Write** `nocturne/issues/<yyyy>-w<ww>-<slug>/issue.md` to the contract in
   §5. One folder per issue. The folder's name is the week in lower case and
   the slug: `2026-w41-clayface-gets-a-date`. The Night Editor writes it.
   **Then the SEO & AEO pass** (6.3.3), before the build and the check, so the
   check reads what ships. It labels sentences; it never rewrites them. It
   may change a headline (the lead's is also `title`), the slug and alt text,
   and add a plain fact the cards already hold (a date, a title, a studio).
   Everything else goes back to the Night Editor: any wording in the body,
   the cold open (it is also the page's description), any adjective, any
   shortened judgment, the sign-off, a "we", an added "you". Its changes go
   in the PR as a diff.
4. **Images** per §6: the finished WebP files go **in the issue's folder**,
   beside `issue.md`. The build copies them into `docs/nocturne/`. Originals
   are not committed, and nothing else sits in the folder.
5. **Catalogue stamp, last.** Only now read `docs/orders.txt` and the `PATH`
   array in `docs/index.html`, to fill each story's `catalogue` and `effect`,
   which draw the box. It's clerical: it never changes what a story says. **A
   parked title whose date moved, or a new title the catalogue should add, goes
   in the PR's "Catalogue flags"** the first week it's news; after that, one
   line under "Still open" until the owner acts. Never edit the catalogue
   yourself.
6. **Pre-flight** against `VOICE.md` §11, item by item.
7. **Build and check:** `npm ci && npm run nocturne:build && npm run nocturne:check && npm test`.
   All green, or stop. The build rewrites `docs/nocturne/` and the Nocturne
   block in `docs/sitemap.xml`; commit both with the issue. Never edit either
   by hand: guard 163 compares them byte for byte with what the build writes.
8. **Screenshots.** Serve the tree (`python3 -m http.server 8099 --directory docs`),
   open `http://127.0.0.1:8099/nocturne/<folder>/` and take two full-page
   screenshots, 390 and 1280 wide. They go in the PR: they are the owner's
   preview, because the site has no preview deploys.
9. **Open the PR** using the template in §7, from a branch named
   `nocturne/<yyyy>-w<ww>`. CI's `nocturne-paths` job fails the PR if it
   changes anything outside `nocturne/issues/`, `nocturne/NOTEBOOK.md`,
   `docs/nocturne/` and `docs/sitemap.xml`.
10. **After merge**, Sunday 22:00: the site deploys on the merge. From the VM,
   `curl -sI` the issue URL. Post only on a 200, and only if the page's `<h1>`
   matches the merged headline (§8).

## 5 · File contract

One `issue.md` per issue folder: YAML front matter, then the stories as
markdown under `##` headlines. The cold open and the sign-off are front-matter
fields; nothing comes before the first `##`. The first `##` headline is the
banner, so it must equal `title`, and the headlines must match `stories` one
for one, in order.

```yaml
---
issue: 1                               # previous issue + 1; skipped weeks don't count; No. 0 is the founding issue (§10)
kind: weekly                           # weekly (default) | founding — only No. 0 (§10)
title: "Clayface gets a date"          # = the lead story's headline, ≤ 70 chars
slug: clayface-gets-a-date             # kebab-case, ascii
week: 2026-W41                         # ISO week of the news window
published: 2026-10-11                  # the Sunday it runs
cold_open: "Two or three lines of city before the first story."
hero: key-art.webp                     # optional; must also appear under images
images:
  - file: key-art.webp                 # kebab-case .webp, in the issue's own folder
    alt: "Key art: a figure on a rooftop in rain"
    credit: "Image: Warner Bros. Discovery"
    rights_holder: "Warner Bros. Discovery"
    source_url: "https://…"            # the page the image was taken from
    licence: "Official public promotional image"
    terms_url: "https://…"             # where those terms are written
    retrieved: 2026-10-10
    width: 1600
    height: 900
  # any other image may take  after: <story number>  to run under its own story
names: ["The Tin Hour: Legendary Nights"]  # optional: titles off the map that trip the word list (§5, below)
stories:
  - headline: "Clayface gets a date"
    status: confirmed                  # confirmed | reported | provisional
    sources: ["https://…"]             # ≥ 1, pages actually opened
    beat: screen                       # screen | comics | games | toys | books | other; weekly only, required
    catalogue: clayface-2026           # entry id from PATH in docs/index.html, or "none"
    effect: parked-date                # new-entry | parked-date | unparked | none
sign_off: "The file's open again next Sunday."
corrections: []                        # {date: YYYY-MM-DD, story: 1-based number, text}
---
```

**A worked example of both kinds** is in `qa/nocturne-fixture/issues/`: a
founding No. 0 and a weekly No. 1 about an invented title. The guards build
and check them on every run, so they always pass the current contract. Copy
their shape, never their content.

`nocturne:check` enforces this. What it refuses:

- **Fields:** a missing field, or one the contract doesn't list.
- **Numbers and dates:** issue numbers that don't run 0, 1, 2 … with no gap;
  a `week` that doesn't exist (W01 to W52, W53 only in a 53-week year); a
  `published` that isn't the Sunday that closes `week`; a folder name that
  isn't `<week, lower case>-<slug>`.
- **Stories:** a count outside 3–8 (No. 0: 4–6); a story outside 60–500 words
  (No. 0: 60–260); an issue outside 250–3000 words (No. 0: 600–900); a cold
  open over 50 words. These are ceilings, not targets: a big week may run
  long, a thin week runs short, and nothing is padded to reach a number.
- **Links:** a source its story never links, or a link the story doesn't list
  as a source; anything but https; a tracking or affiliate parameter
  (`utm_…`, `fbclid`, `gclid`, `si`, `tag`, `aff…` and the like); a shortener
  or affiliate host (`amzn.to`, `bit.ly`, `t.co`, `geni.us` …). Link the page
  as a reader would open it. The check also reads the built page back: every
  link it prints must be one of the story's sources.
- **The catalogue:** a `catalogue` id that isn't in `PATH`; `new-entry` with
  an id (a new title isn't in the catalogue yet: `none`); `parked-date` on a
  title that isn't parked.
- **Beats:** a weekly story without a `beat`, or one that isn't on the list;
  a beat on the founding issue.
- **Late wires:** a section headlined "Late wires" with a catalogue id, an
  effect or a beat other than `other`. A catalogued title that moves is a
  story of its own.
- **Names:** the catalogue's own names are exempt from the voice rules,
  exactly as the app spells them (*The Batman Epic Crime Saga*, *Teen Titans
  Go!*). A title the catalogue doesn't hold that carries a listed word or a
  `!` goes in `names:`; the check refuses an entry the issue doesn't print,
  and one that is a bare word rather than a name. Never write around a name,
  never alter one, and never use `names:` for your own words.
- **The body:** anything beyond paragraphs, `##` headlines, `*italic*`,
  `**bold**` and `[links](https://…)`. No lists, quotes, tables, raw HTML,
  code or inline images.
- **Voice:** VOICE.md §8's never-use words, `!`, emoji, hashtags, "the Bat",
  and "watch it on …"; a price (`$19.99`, `€25`, `30 USD`) or a call to buy
  (`buy now`, `pre-order now`). Merch is news, never shopping.
- **Characters:** anything outside the paper's fonts, the ranges in
  `qa/font-subset.json` (Latin, Latin-1, the dashes, quotes, ellipsis, primes,
  € and ™). Arrows, emoji, symbols and other scripts render in a system font,
  so the check names the character and refuses it: in the body, every
  front-matter string, alt text, credits and corrections.
- **Corrections:** held to the story's rules: the voice, the markdown subset,
  the characters, and no link the story doesn't list as a source.
- **Images:** an `after:` that isn't a story number, that points at Late
  wires, that sits on the hero, or that puts two images under one story; a
  missing licence field, a file that isn't a whole WebP (its
  header's length must match the file: upload images as binary), a size in the
  front matter the file doesn't have, over 1600 px or 250 KB, EXIF or XMP
  metadata still in the file, alt over 125 characters, a credit that doesn't
  read "Image: …", or a file in the folder that isn't listed.

The check can't read meaning. "Drops" as a verb, a service named as advice in
other words, a spoiler, and a street tip dressed as fact are yours to catch
before the PR, and the owner's after.

## 6 · Images

**Only high-quality, properly licensed images. When the licence can't be written
down, the image doesn't run.**

**Allowed** (the owner's ruling, 25 Sept 2026)

- **Official promo images the rights holder has published publicly:** key art,
  posters and stills on the studio's, network's or distributor's own pages or
  verified accounts; covers from DC's or the publisher's own pages (a
  distributor's page counts for DC's books); game key art from the publisher;
  product photos from the maker. Used only to report on that title or product,
  credited to the rights holder, never altered, and taken down the same day if
  asked. Record the page it came from as `source_url` and that page's terms as
  `terms_url`; a site's personal-use terms don't keep an official promo image
  out.
- **An artist's own art, with the artist's written permission:** a public post
  or a message kept on record, linked as `terms_url`. Credit it "Image:
  <artist>" and link the source. Without permission it doesn't run.
- Images the owner supplies.

No press-site accounts and no open-licence hunting. If no such image exists
for a story, the story runs without one.

**Not allowed**

- Fan art, edits or composites without the artist's written permission.
- AI-generated images of any character, logo or likeness.
- Frame grabs or screenshots from films, trailers or episodes.
- Images lifted from news sites, stock agencies or aggregators.
- Anything watermarked, cropped from a larger watermarked image, or low resolution.
- Anything that spoils (`VOICE.md` §7).

**Technical**

- At most three images per issue, one of them the hero.
- One WebP file per image, quality ~80, longest side at most 1600 px. Strip EXIF
  and XMP (`cwebp -metadata none`, or `webpmux -strip exif` then `-strip xmp`);
  the check refuses a file that still carries either.
  At most 250 KB. `width` and `height` in the front matter are the file's own.
- It sits in the issue's folder; the build copies it into `docs/nocturne/`.
  Never hotlinked: the `/nocturne/` CSP allows images from this origin only.
- The hero goes under the banner. Any other image follows its own story when
  it carries `after: <story number>`; without it, list order: the first after
  story 1, the second after story 2. Never after Late wires, and one image a
  story.
- `width`, `height`, `alt` and a visible credit line under every image.
- Don't crop out credits, and don't recolour or alter the image.
- **Takedown:** if a rights holder objects, the image comes out the same day in a
  PR titled `nocturne: remove image at rights holder's request`.

When you can't tell whether an image is an official promo image or has the
artist's permission, leave it out and ask in the PR.

## 7 · The PR

Title: `nocturne: No. <issue> — <headline>`

```markdown
## Stories
1. <headline> — <beat> — <status> — <source domain(s)> — catalogue: <id | none>
…

## Catalogue flags
- <title>: <what moved, with source> — or "none"

## Names
- <each entry in names:, with where the title comes from> — or "none"

## Still open
- <title>: <flag raised on date> — or "none"

## Images
- <file> — <rights holder> — <licence> — <terms_url>

## SEO & AEO
- <each change, before → after> — or "no changes"

## Pre-flight
<VOICE.md §11, ticked>

## Checks
nocturne:build ✅  nocturne:check ✅  npm test ✅

## Screenshots
<390 wide, full page> <1280 wide, full page>

## X post (draft)
<text, ≤ 280 weighted characters>
```

## 8 · The X post

- One post per issue, Sunday 22:00–23:00 Montevideo, after the 200 check.
- "I" voice. It opens on "The Night Final is out." or the lead story in one
  plain sentence, then the link. No hashtags, no emoji, no "RT", no "link in
  replies". The link goes in the post.
- An optional closing question, answerable in three words.
- The card comes from the issue's `og:image` (the hero) or the site default.
- Reply to replies in the same voice. No arguing, no leaks, no spoilers.
- Never a second post about the same issue.

## 9 · When something goes wrong

| Situation | Do |
| --- | --- |
| A check fails in `nocturne/issues/` or `docs/nocturne/` | Fix it on the branch, re-run, then open the PR |
| A check fails elsewhere | Stop. Open the PR as a draft and describe the failure |
| A source can't be verified | Drop the story |
| A published fact turns out wrong | New PR with a dated correction at the top of that story (`VOICE.md` §6) |
| Not merged by 23:00 Sunday | Don't post. Carry what's still news to next Sunday; drop the rest |
| Rights holder objects to an image | Same-day removal PR (§6) |

## 10 · No. 0 — the founding issue

The first issue isn't news. It's the paper introducing itself: who's at the
desk, what the Night Final is and who it's for, and its neighbour, the map. It
runs as **No. 0**, so the first news issue is No. 1. The night desk's voice
(`VOICE.md` §1) is the point of it: a reader should finish No. 0 knowing the
person who writes the paper. **`REPORTER.md` applies to No. 0 too:** it is
his first issue. The Night Editor reads No. 0 against it before the PR, and
fixes what breaks it (a name, a claim to be the best, Batman saying anything
about the real world); keep the rest. Quoting Batman is his to do
(`REPORTER.md` §4).

**What's different from a weekly issue**

| | Weekly issue | No. 0 |
| --- | --- | --- |
| `issue` | previous + 1 | `0` |
| `kind` | `weekly` (default) | `founding` |
| Subject | the week's news | Nocturne, and its neighbour the map |
| Sections | 3–8 stories and sections (`VOICE.md` §5) | 4–6 sections |
| Length | 250–3000 words, a ceiling | 600–900 words |
| "On the map" box | when a story touches the catalogue | none (the renderer omits it for `founding`) |
| `catalogue` / `effect` | per story | `none` / `none` |
| `status` | confirmed / reported / provisional | `confirmed` |

**Sources.** Every fact about the app and the paper comes from the repo or the
live site; Batman history comes from the morgue's sources (`VOICE.md` §4). All
linked like any other source:

- `README.md`: what the app does, what it refuses to do, what belongs in the catalogue.
- `CHANGELOG.md` and `CHANGELOG-archive.md`: dates, versions, why things changed.
  Version 1.0.0 was tagged on 27 July 2026.
- `docs/orders.txt` and the live site: the counts. Today that's 137 films,
  71 seasons and 44 continuities; read them fresh, never from this brief.
- `NOTES.md`: why the colours, fonts and rules are the way they are.
- *Thirty-One Nights*, the owner's essay on the app's history, if the owner
  hands it over. Paraphrase it; don't lift it.

**What No. 0 should cover** (4–6 sections; the first two are required and in
this order, the rest in any order). It's a Batman paper's first night: most of
it is about Batman and the paper, and the map gets one section as the
neighbour, not four:

1. **The founding editorial** (below): who's at the desk and who it's for.
   **Required, section 1.**
2. **The map next door**, in one section and in the desk's voice: one path
   through every Batman on screen, the three watch orders (by universe, Bruce's
   life, release order), no spoilers, parked titles, no account and nothing
   tracking you. The paper describes its neighbour; the app doesn't describe
   itself. **Required, section 2.**
3. **From the morgue:** one piece of Batman history that explains why a paper
   about him still has something to say every week. Sourced (DC's own pages,
   the publishers, published books; never a wiki).
4. **The beats:** what the Night Final covers, screen, comics, games, toys,
   books, and how it reads the wire and the street (`VOICE.md` §6).
5. **The Night Desk:** the paper's first column, the desk's view of what a
   Batman paper owes its readers. It says "we think".
6. **One fan and the ledger:** who builds the map, alone, with every change
   written down.

**The founding editorial**

A new paper opens with an editorial: what it is and what it promises. In No. 0
that editorial is the section on Nocturne. There isn't a second one beside it.

- **It leads.** Its headline is the banner and `title`, so it's the page's
  `<h1>` and the headline Google and X show. A statement in sentence case, per
  `VOICE.md` §9, never "Editorial:" or a colon teaser.
- **What it says:** who's at the desk, what the Night Final is (every Sunday,
  late, all of Batman: screen, comics, games, toys, books) and who it's for,
  the Night Watchers. Then the paper's promises, as `VOICE.md` states them: the
  wire and the street, each named for what it is; no leaks, no spoilers; news,
  never shopping; corrections dated at the top of the story.
- **What it doesn't say:** nothing beyond the paper as this brief describes it
  today, so no features, no schedule changes, no plans.
- **Voice:** the night desk at its most itself (`VOICE.md` §1): a person, not a
  mission statement. Of all the sections, this is the one the owner is most
  likely to rewrite at review.
- **Length:** about 150–250 words, inside the section limit (260) and the
  issue's 600–900.
- **Sources:** `nocturne/BRIEF.md` and `nocturne/VOICE.md` on GitHub, linked
  inline, so readers can see the paper's rules are public. `status: confirmed`,
  `catalogue: none`, `effect: none`, like every No. 0 section.

**What No. 0 must not do**

- **No claims we can't source:** no user numbers, rankings, "the best", "the
  only", "the most complete". The app tracks no one and the paper only counts
  visits, which aren't readers, so we have no reader numbers, and we don't guess.
- No testimonials, and no quotes from real people, invented or real. A line
  Batman said on the page or the screen, attributed to its work, is fine
  (`REPORTER.md` §4).
- No selling. The register still states rather than sells (`VOICE.md` §8): the
  counts and the rules speak for the app.
- The app still never speaks. It's "we" built it, never "Night Watcher says".

**Section order.** The editorial is section 1 and the map next door is
section 2, because the images below are placed by position (§6). The other
sections come after them, in any order.

**Images:** the project's own images only. The owner hands over three WebP
files for No. 0. They aren't in the repo, and they replace the PNGs this
section used to name. List them under `images` in this order:

| File | Size | Where it runs | Alt text |
| --- | --- | --- | --- |
| `night-watcher-no0.webp` | 1600×900 | `hero`, under the banner | the owner's, or describe what it shows |
| `night-final.webp` | 1600×900 | after section 1, the editorial | "The city at night, one floor lit near the top of the tallest tower" |
| `three-orders.webp` | as supplied | after section 2, the map next door | the owner's, or describe what it shows |

Each record: `credit: "Image: Night Watcher"`, `rights_holder: "Night
Watcher"`, `licence: "The project's own image"`, `source_url` and `terms_url`
`https://nightwatcher.life/`, and `width` and `height` read from the file. They
are already WebP, sized and stripped per §6: copy them into the issue's folder
as binary, and never convert, resize or re-encode them.

**When:** No. 0 is the Sunday 27 September test run. If it isn't good, nothing
is public, and No. 0 runs on 4 October instead. No. 1 follows the Sunday after
No. 0 goes live.

**The X post for No. 0:** "I" voice, one sentence on what the paper is and
who it's for, one on the map next door, then the link.

## 11 · Rulings from the test runs

The owner's answers to what tests -1, -2 and -3 asked. They hold until this file
says otherwise.

- **The angle is the Night Editor's.** A card may suggest one; the editor
  decides.
- **Status is the least certain fact the headline states.** A confirmed
  product with a provisional date is `confirmed` if the headline is the
  product, `provisional` if it's the date; the text says which is which.
- **Shared source material earns no box.** A toy or comic from a story that a
  catalogued film also adapts is `catalogue: none`. The text may name the film
  as history.
- **The slug may carry the title** for search, even when the headline doesn't.
- **Maker sites that need a browser:** use the browser. It's still the maker's
  own page.
- **A retail listing's date** can come from a wire outlet that reports it,
  attributed. The retailer is never linked.
- **Images:** the owner's licence ruling is in §6. Official promo images run,
  credited; an artist's art runs with written permission. No image follows
  Late wires.
- **The desks' own files follow this brief.** Where a desk profile or
  `NOCTURNE-BOTS.md` still says otherwise (the street as noise only, "confirmed
  or reported only"), this file wins, and the profile gets updated.
- **Test runs** use negative issue numbers and are never built or checked;
  the checker refusing them is expected, not a gap.
- **The outlets (test -3).** A big entertainment or games outlet is the wire
  when the piece is its own reporting (an interview, a panel, a first-party
  page it read) and a relay when it rewrites someone else's story: then cite
  the original. Bleeding Cool is the street until a corrections policy turns
  up.
- **A routine on-sale date** is a Late wire unless there's a hook.
- **Repeats and flags count by opened pull requests,** not by test runs. A
  story that ran in a published issue isn't filed again unless something new
  was opened.
- **"The date in paragraph two"** means release and on-sale dates, not history
  years.
- **The morgue's sources:** DC's character and issue pages, publisher and
  distributor pages, the trades' archives and named reference books. A history
  line with no source goes.
- **The browser pass** for maker sites that need one runs every week.
- **Headlines attribute only when the fact is disputed.** "The press says" is
  not a sign-off.
- **6.3.0 is on `main` before No. 0.** If it isn't when the run starts, stop
  and say so in the PR.
