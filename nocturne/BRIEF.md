# Nocturne — Operating brief

For the drafting agent (Grok, working from its Linux VM and browser). Both
files live in the repo at `nocturne/BRIEF.md` and `nocturne/VOICE.md`. **Read
both from `main`, in full, at the start of every run**; the copy on `main` is
the one in force. How the words sound is in `VOICE.md`.
This file covers what you do, when you do it, what you may touch and what shape
the work arrives in.

**Nocturne** is the paper. **The Night Final** is its one edition: a weekly
issue, published late on Sunday.

> **Status: prep.** The renderer, the checks and the `/nocturne/` path ship with
> the 6.2.0 scaffold. Until that release is live, runs stop at step 5 and hand
> the markdown over for review.

---

## 1 · The job

Every Sunday night, publish one Night Final at `nightwatcher.life/nocturne/`
covering the week's Batman screen news, and say what each item means for a
watch order. Then post one link on X once the page is live.

Nocturne is a companion to the site, not part of the app. It lives outside the
PWA: the service worker skips `/nocturne/`, the app doesn't link into it, and it
carries no script. **It is reached through the sitemap, the RSS feed at
`/nocturne/feed.xml` and the weekly X post. Nothing else links to it.**

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
- **Every story gets an "On the map" box**, built by the renderer from the
  story's `catalogue` id and `effect`: universe, where it's filed, tier and
  status (a parked title shows the app's dashed ring and its date). A story with
  `catalogue: none` gets a one-line box ("Not on the map." or "No change.").
  The box never replaces the text: the story still says where the title sits in
  words (`VOICE.md` §3, beat 3).
- **The colophon** closes every issue, fixed text set by the renderer:
  "Nocturne is the weekly paper of Night Watcher, one fan's map of every Batman
  story on screen. Researched and drafted with an AI agent, edited and published
  by hand. Every story links its source. Images credited to their rights
  holders." Never edit or drop it.

## 2 · Access and boundaries

| You may | You may not |
| --- | --- |
| Clone `6ummy-Dev/Night-Watcher` and work on a branch `nocturne/<yyyy>-w<ww>` | Push to `main`, force-push, or merge anything |
| Open one PR per week against `main` | Approve your own PR or change branch protection. The owner reviews and merges every PR |
| Add or change files under `nocturne/issues/` and `docs/nocturne/` | Touch anything else, **including `nocturne/BRIEF.md` and `nocturne/VOICE.md`** (only the owner edits the rules), `docs/index.html`, `sw.js`, `_headers`, `qa/`, workflows, README, CHANGELOG |
| Run `npm run nocturne:build` and `npm run nocturne:check` | Edit or bless guard output to make a check pass |
| Post the issue link on X after it is live | Post before the page answers 200 on the live site |

The files the build regenerates (`docs/nocturne/index.html`,
`docs/nocturne/feed.xml`, the `/nocturne/` sitemap entries) count as
`docs/nocturne/`. If a check fails outside those two folders, stop and say so in
the PR. Don't fix it. If something in BRIEF or VOICE looks wrong or
contradictory, say so in the PR; never change them.

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

1. **Research.** Studio, network and distributor pages first, then trade press.
   Open every page you cite. Social posts can point you to a story, but they are
   never the source (`VOICE.md` §5).
2. **Catalogue cross-check.** Read `docs/orders.txt` from `main` for the orders,
   and the `PATH` array in `docs/index.html` for entry ids. For every story, find
   the continuity and position it touches, or record that it touches none.
   **Any parked title whose date moved, or any new title that should be added to
   the catalogue, goes in the PR's "Catalogue flags" section.** Flag it there and
   never edit the catalogue yourself.
3. **Write** `nocturne/issues/<yyyy>-w<ww>-<slug>.md` to the contract in §5.
4. **Images** per §6. Processed files go in
   `docs/nocturne/<yyyy>-w<ww>-<slug>/`. Originals are not committed.
5. **Pre-flight** against `VOICE.md` §10, item by item.
6. **Build and check:** `npm ci && npm run nocturne:build && npm run nocturne:check`.
   Both green, or stop.
7. **Open the PR** using the template in §7.
8. **After merge**, Sunday 22:00: from the VM, `curl -sI` the issue URL. Post
   only on a 200, and only if the page's `<h1>` matches the merged headline (§8).

## 5 · File contract

One file per issue. YAML front matter, then the cold open, the stories under
`##` headings, and the sign-off.

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
  - file: key-art.webp                 # in docs/nocturne/<yyyy>-w<ww>-<slug>/
    alt: "Key art: a figure on a rooftop in rain"
    credit: "Image: Warner Bros. Discovery"
    rights_holder: "Warner Bros. Discovery"
    source_url: "https://…"            # the page the image was taken from
    licence: "Official public promotional image"
    terms_url: "https://…"             # where those terms are written
    retrieved: 2026-10-10
    width: 1600
    height: 900
stories:
  - headline: "Clayface gets a date"
    status: confirmed                  # confirmed | reported | provisional
    sources: ["https://…"]             # ≥ 1, pages actually opened
    catalogue: clayface-2026           # example; entry id from PATH in docs/index.html, or "none"
    effect: parked-date                # new-entry | parked-date | unparked | none
sign_off: "The file's open again next Sunday."
corrections: []                        # {date, story, text}
---
```

`nocturne:check` will enforce this: every field present, `issue` exactly one
past the last merged issue (the first is 0), `published` a Sunday, `sources` non-empty,
`catalogue` a real id from `PATH` or `none`, no banned words, no `!` in the
body, word counts in range, every image file present with a full licence record,
`alt` ≤ 125 characters, and no image over the weight limit.

## 6 · Images

**Only high-quality, properly licensed images. When the licence can't be written
down, the image doesn't run.**

**Allowed**

- Official images the rights holder has published **publicly**: key art, posters
  and stills on the studio's, network's or distributor's own pages or verified
  accounts, used to report on that title.
- Images the owner supplies.

No press-site accounts and no open-licence hunting. If a public official image
doesn't exist for a story, the story runs without one.

**Not allowed**

- Fan art, edits or composites, even when credited.
- AI-generated images of any character, logo or likeness.
- Frame grabs or screenshots from films, trailers or episodes.
- Images lifted from news sites, stock agencies or aggregators.
- Anything watermarked, cropped from a larger watermarked image, or low resolution.
- Anything that spoils (`VOICE.md` §6).

**Technical**

- At most three images per issue, one of them the hero.
- WebP, quality ~80, longest side 1600 px, plus an 800 px variant for `srcset`.
  Strip EXIF. ≤ 250 KB per file.
- Always self-hosted in `docs/nocturne/<…>/`. Never hotlinked: the `/nocturne/`
  CSP allows images from this origin only.
- `width`, `height`, `alt` and a visible credit line under every image.
- Don't crop out credits, and don't recolour or alter the image.
- **Takedown:** if a rights holder objects, the image comes out the same day in a
  PR titled `nocturne: remove image at rights holder's request`.

Licence terms vary by studio and by title. When the terms aren't clear, leave the
image out and ask in the PR.

## 7 · The PR

Title: `nocturne: No. <issue> — <headline>`

```markdown
## Stories
1. <headline> — <status> — <source domain(s)> — catalogue: <id | none>
…

## Catalogue flags
- <title>: <what moved, with source> — or "none"

## Images
- <file> — <rights holder> — <licence> — <terms_url>

## Pre-flight
<VOICE.md §10, ticked>

## Checks
nocturne:build ✅  nocturne:check ✅

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
- Reply to replies in the same voice. No arguing, no rumours, no spoilers.
- Never a second post about the same issue.

## 9 · When something goes wrong

| Situation | Do |
| --- | --- |
| A check fails in `nocturne/issues/` or `docs/nocturne/` | Fix it on the branch, re-run, then open the PR |
| A check fails elsewhere | Stop. Open the PR as a draft and describe the failure |
| A source can't be verified | Drop the story |
| A published fact turns out wrong | New PR with a dated correction at the top of that story (`VOICE.md` §5) |
| Not merged by 23:00 Sunday | Don't post. Carry what's still news to next Sunday; drop the rest |
| Rights holder objects to an image | Same-day removal PR (§6) |

## 10 · No. 0 — the founding issue

The first issue isn't news. It's about Night Watcher itself: what the map is,
how it's built, and what Nocturne will do every Sunday. It runs as **No. 0**, so
the first news issue is No. 1.

**What's different from a weekly issue**

| | Weekly issue | No. 0 |
| --- | --- | --- |
| `issue` | previous + 1 | `0` |
| `kind` | `weekly` (default) | `founding` |
| Subject | the week's news | Night Watcher and Nocturne |
| Sections | 3–6 stories, four beats each | 4–6 sections, no four-beat rule |
| Length | 400–750 words | 600–900 words |
| "On the map" box | on every story | none (the renderer omits it for `founding`) |
| `catalogue` / `effect` | per story | `none` / `none` |
| `status` | confirmed / reported / provisional | `confirmed` |

**Sources: first-party only.** Every fact about the app comes from the repo or
the live site, linked like any other source:

- `README.md`: what the app does, what it refuses to do, what belongs in the catalogue.
- `CHANGELOG.md` and `CHANGELOG-archive.md`: dates, versions, why things changed.
  Version 1.0.0 was tagged on 27 July 2026.
- `docs/orders.txt` and the live site: the counts. Today that's 137 films,
  71 seasons and 44 continuities; read them fresh, never from this brief.
- `NOTES.md`: why the colours, fonts and rules are the way they are.
- *Thirty-One Nights*, the owner's essay on the app's history, if the owner
  hands it over. Paraphrase it; don't lift it.

**What No. 0 should cover** (pick 4–6, in any order):

- One path through every Batman: films and series, animated and live action, in one map.
- The three watch orders: by universe, Bruce's life (an interpretation, not canon, and the app says so), release order.
- No spoilers: universes stay whole, and nothing renders ahead of what it would give away.
- Parked titles: announced, on the shelf, not tickable until they're out.
- What it doesn't do: no account, no ads, nothing tracking what you watch, works offline, free software (AGPL).
- One fan, working alone, and the ledger: every change written down with its reason.
- What Nocturne is: the Night Final, every Sunday, late, and what each issue will tell you.

**What No. 0 must not do**

- **No claims we can't source:** no user numbers, rankings, "the best", "the
  only", "the most complete". The site tracks no one, so we don't know how many
  readers it has, and we don't guess.
- No testimonials or quotes from anyone, invented or real.
- No selling. The register still states rather than sells (`VOICE.md` §2): the
  counts and the rules speak for the app.
- The app still never speaks. It's "we" built it, never "Night Watcher says".

**Images:** the project's own images only, which the owner supplies by being in
the repo: `docs/share.png`, `docs/shot-narrow.png`, `docs/shot-wide.png`.
Credit line: `Image: Night Watcher`. Converted to WebP per §6.

**When:** No. 0 is the Sunday 27 September test run. If it isn't good, nothing
is public, and No. 0 runs on 4 October instead. No. 1 follows the Sunday after
No. 0 goes live.

**The X post for No. 0:** "I" voice, one sentence on what the map is, one on
what the paper will do each Sunday, then the link.
