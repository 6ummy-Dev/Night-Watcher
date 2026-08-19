# Night Watcher

**One path through every Batman.**

[![QA](https://github.com/6ummy-Dev/Night-Watcher/actions/workflows/qa.yml/badge.svg)](https://github.com/6ummy-Dev/Night-Watcher/actions/workflows/qa.yml)

A single-file web app mapping every Batman story ever filmed — animated and live action — **133 films and 67 seasons of television across 44 continuities** — into watch orders, no spoilers, with progress tracking and a where-to-watch link for every entry.

**Live:** https://nightwatcher.life/

![Night Watcher share card — the skyline chart, one bar per universe](docs/share.png)

Served from Cloudflare Workers (static assets). **`nightwatcher.life` is the
only address.** The old GitHub Pages mirror was unpublished on 6 August 2026.
Progress is stored per-origin, so anything saved only on the old address can no
longer be read there; a backup code, a restore link or a JSON export taken
while it was up still restores anywhere.

## What it does

- **Two switches, one catalogue.** **Animated**, **Live action** or **All** decides which kind of Batman; **Movies** or **Movies + Series** decides how much of it. 133 films and 67 seasons — 1,900+ episodes, from *Batman* (1943) to *Dynamic Duo* (2028) — weave into the same orders either way. Tiers are judged inside a format, so nothing has to be ranked against a different medium.
- **Where to watch, without picking a side.** Every entry links to a search rather than a service, because availability rotates by country and by month and no stored answer survives that.
- **One path, chosen once.** Pick by universe (spoiler-safe), the composite chronology of Bruce's life, or straight release order from 1943 to 2028 — and the whole app follows it. No switcher to re-answer on every visit; the header carries the path name and Home leads with its completion ring. Change it whenever you like: switching re-sorts, it never clears a tick.
- **Shared links are views, not takeovers.** Following someone's `#life` link shows you their ordering and offers to adopt it, rather than silently rewriting yours.
- **Three tiers.** Everything is tagged **Essential**, **Core**, or **Optional** — tiers are exclusive, with Essential outranking Optional — plus modifiers (Short, Interactive, Not out yet). Nothing is untagged.
- **Home dashboard.** Resume card, tier meters, scoreboard, a tappable grid of every universe, and your recent watches.
- **Progress.** One chart — the chosen ordering's, and it follows the belt: universes, eras of Bruce's life, or decades of release. A skyline of bars, each as wide as its group's share of the catalogue, filling bottom-up as you watch. Tap any bar to jump straight there; the fold lists below carry the same jumps for all three orderings.
- **Backup & transfer.** A compact code, a link that restores everything when opened on another device, and a full JSON export/import — all client-side, built on frozen IDs so backups stay valid forever. The code is versioned and read tolerantly: it carries your chosen path, and a code written by a newer build still restores everything an older one understands.
- **Shareable views.** Link straight to a view: [`#life`](https://nightwatcher.life/#life) for the chronology of Bruce's life, `#release`, `#universes`, `#progress` — combine with scope like `#life-series`.
- **Progress that sticks.** Watched, skipped and star ratings saved in your browser (localStorage). No accounts, no server; your watch data never leaves your device — and if the browser refuses to save (Private Browsing, a full quota, some in-app webviews) the app says so in the header instead of losing your evening silently.
- **Darker.** An optional pure-black variant for watching in an actually dark room, including the system status bar. Surfaces only — the palette, type and accents are unchanged.
- **Anonymous visit counts, server-side only.** Cloudflare counts requests as the host answering them — no script on the page, no cookies, no fingerprinting, nothing added to what you download — only what any host can see by answering a request at all.

## Non-goals

These are the constraints the app is built around, not features nobody has got to yet. Two of them are enforced by `qa/guards.js` rather than by good intentions.

- **No accounts, ever.** Nothing to sign up for, nothing to log into.
- **No server.** Progress lives in your browser and is never transmitted. Backup and transfer happen through a code you carry yourself.
- **No third-party code** — *guarded.* Not one line vendored, and **nothing fetched at runtime at all** — `qa/guards.js` fails on any external script rather than allowing one by name, and the app runs with the network off. Two `<script>` tags, no injected third, and the Content-Security-Policy on the wire is the one in the file — ten directives, one `sha256`. Open `docs/index.html` from disk, or serve it from any other host, and what runs is exactly what you can read.
- **A weight budget** — *guarded.* `docs/index.html` must stay under 220 KB raw and 80 KB gzipped; it is currently 213 KB / 61 KB. The subset webfonts sit outside that budget and are held by their own manifest (`qa/font-subset.json`). Every raise of the ceiling is an owner's call recorded in the CHANGELOG, never a drift. A single file that opens instantly is the whole premise, and arithmetic is the only thing protecting it.
- **No comparison, no leaderboards, no social graph.** The moment progress is comparable between people it needs accounts and a server, and the two promises above stop being true.

## The chronology

Stories from different continuities can't share a real timeline — they're different Bruces in different realities. So the app gives three honest answers rather than one fake one:

- **By universe** — each continuity intact, in its own story order. The safest first watch.
- **Bruce's life** — a composite lifetime stitched across every continuity, in eleven eras: *Before Batman → The early years → The Grayson years → Rebuilding → Broken and rebuilt → The League years → No one in the car → The Damian years → The last years → Beyond → After the cowl*. Within an era the entries are ordered too, so the whole thing reads as one timeline rather than eleven shelves. An era may say who is in it and never what happens to them. The handful with no place in a single life — another Bruce, several at once, or none — are collected at the end with the reason given.
- **Release order** — the only ordering that is objectively complete, decade by decade.

The DC Animated Universe entry also carries the full interleave: where *Mask of the Phantasm* and *SubZero* slot into the series, which *Superman: The Animated Series* episodes to detour into, and why *Batman Beyond* has to come before JLU's "Epilogue".

## Running it

One HTML file, no build step, nothing to install, and nothing vendored — every line is written for this project.

Open `docs/index.html` in any modern browser, or serve the `docs/` folder from any static host — this repo publishes via Cloudflare Workers Assets. Served over HTTPS it registers a service worker, so after the first visit it opens and works with no network at all. Opened straight off disk as `file://` it still works; the service worker just doesn't register, since browsers only allow them in a secure context.

### Deploy to Cloudflare Workers

```sh
npm install          # or bun install
npx wrangler deploy
```

The static files live in `docs/`. `wrangler.jsonc` points the assets directory there so `node_modules` is never uploaded.

## Files

The reasoning behind each file's shape lives in `NOTES.md`; this table says what each one is.

| File | Purpose |
| --- | --- |
| `docs/index.html` | The entire app — markup, styles, data and logic |
| `docs/sw.js` | Service worker — offline support. `VERSION` must match `BUILD` in `index.html` and the newest version in `CHANGELOG.md` |
| `docs/manifest.json` | Web app manifest — lets Android install it with the right name and icon |
| `docs/icon.png` | 512px icon — social cards and the install icon |
| `docs/icon-192.png` | 192px install icon |
| `docs/icon.svg` | The favicon, as a real crawlable file |
| `docs/favicon.ico` | The classic root path, 16/32/48 in one container. Generated by `qa/make-favicon.py` |
| `docs/favicon-16x16.png` | Tab raster at 1x, for tools that read `<link>` tags. Same generator |
| `docs/favicon-32x32.png` | Tab raster at 2x. Same generator |
| `docs/favicon-48x48.png` | The 48px raster legacy crawlers expect. Same generator |
| `docs/apple-touch-icon.png` | The 180×180 iOS home-screen icon, opaque on the ink ground. Same generator |
| `docs/mstile-144x144.png` | The Windows tile raster. Same generator |
| `docs/3e6082eed9f040d5bc8ab07531bf58b9.txt` | The IndexNow key — filename and contents are the same string |
| `docs/icon-maskable-512.png` | Full-bleed variant so Android can apply its own mask |
| `docs/robots.txt` | Opens the site to crawlers and points at the sitemap |
| `docs/sitemap.xml` | Two URLs — the single-page app and `llms.txt` |
| `docs/share.png` | The 1200×630 share card. Generated by `qa/make-share-card.mjs`; guard 91 holds it honest |
| `docs/google38dc2f1303c788e7.html` | Search Console ownership token. Google re-checks it, so it stays |
| `docs/llms.txt` | The site described in plain text for generative engines — counts guarded against the data |
| `docs/orders.txt` | The catalogue as plain text, all three orderings, generated by `npm run bless` |
| `docs/auth.md` | The no-auth statement for agents: no accounts exist, by design |
| `docs/_headers` | The security headers and cache policy, kept in the tree so they can be diffed, guarded and shipped |
| `docs/404.html` | The wrong-alley page. Self-contained, noindexed, served with a real 404 status |
| `docs/vp.html` | The viewport probe for the standalone bottom-band investigation. Owner-facing, noindexed |
| `docs/fonts/limelight-latin-400-normal.woff2` | Display face for the wordmark and headings |
| `docs/fonts/anton-latin-400-normal.woff2` | Condensed face for titles |
| `docs/fonts/big-shoulders-display-latin-700-normal.woff2` | Numeral face — scoreboard tiles and the story card's count |
| `docs/fonts/ibm-plex-sans-latin-400-normal.woff2` | Body text |
| `docs/fonts/ibm-plex-sans-latin-600-normal.woff2` | Body text, semibold |
| `docs/fonts/ibm-plex-mono-latin-400-normal.woff2` | Labels, counts, and every uppercase micro-line |
| `docs/fonts/ibm-plex-mono-latin-600-normal.woff2` | The same, semibold |
| `docs/fonts/OFL.txt` | SIL Open Font License — redistribution requires it to travel with the fonts |
| `wrangler.jsonc` | Cloudflare Workers config (points assets at `docs/`) |
| `.gitignore` | Ignores `node_modules`, Wrangler state, editor files, etc. |
| `package.json` | Dev scripts + the QA toolchain: jsdom for smoke, playwright and axe-core for the browser check, wrangler for deploys |
| `.github/workflows/qa.yml` | Runs every suite on every push and again nightly, so a tampered commit fails in public |
| `NOTES.md` | Why the code is written the way it is. Not served — `docs/index.html` carries no explanatory comments, and this is where they went |
| `qa/guards.js` | Build guards — run before every commit (see below) |
| `qa/frozen-ids.json` | Snapshot of every `i:` slug, so a rename can't slip through |
| `qa/smoke.js` | Optional headless render test (requires jsdom) |
| `qa/negative/` | One suite per release: each fixture breaks a guard on purpose and asserts it fails |
| `qa/renamed-ids.json` | The one recorded slug rename, and the closed window that allowed it |
| `qa/retired-ids.json` | Slugs that left the catalogue, so a reused id cannot mean two things |
| `qa/font-subset.json` | Bytes and hash of every shipped face, blessed by the subset script |
| `qa/subset-fonts.py` | Rebuilds the subset faces from the catalogue's own codepoints |
| `qa/make-share-card.mjs` | Draws `docs/share.png` from the tree, so the card cannot drift |
| `qa/share-card.html` | The card's layout, rendered headless by the script above |
| `qa/browser-check.mjs` | A real browser at 390×844, for the header, the jumps and the tick — the things jsdom cannot see |
| `CHANGELOG.md` | Every shipped change, newest first. Enforced by the guards |
| `LICENSE` | AGPL-3.0 for the code, with the writing, DC's marks and the fonts set out separately |
| `SECURITY.md` | How to report something privately |
| `package-lock.json` | Pinned dev dependencies, so CI runs what was reviewed |
| `README.md` | This file |
| `RELEASING.md` | The release checklist: the wire checks no guard can run, the bless procedure, the browser check, and the rollback runbook |

## Checks

```sh
node qa/guards.js          # verify; exits non-zero on failure
node qa/guards.js --bless  # re-snapshot frozen IDs after adding entries
```

Zero dependencies, and every function under test is **extracted from `docs/index.html` and evaluated**, never reimplemented here — a copy drifts from the app and quietly stops testing it, which is the exact failure this file exists to prevent.

What they hold, in outline: the data (every `i:` present, unique and unchanged since the last snapshot; tiers, eras and backup codes all round-trip), the interface (contrast per theme, the chosen path never silently overwritten, the storage-blocked warning wired to every path that can turn saving off), the weight budget above, and the bookkeeping (version agreement across `index.html`, `sw.js` and `CHANGELOG.md`; this README's counts, size figure and file table held against the tree). The full statement of each rule is a comment in `qa/guards.js` beside the code that enforces it.

Every guard section is negative-tested: made to fail on purpose before being
trusted. That evidence lives in `qa/negative/` — 58 negative suites, 837
fixtures. Each one breaks exactly one thing in a throwaway copy of the tree and
asserts the right guard goes red for the right reason; `bash qa/negative/run-all.sh`
runs them all, and CI runs them on every push and again nightly. Guard 138 maps
every fixture onto the section it breaks and fails the build on any section
without one, and the counts in this paragraph are themselves guarded.

There is also `qa/smoke.js`, a headless render test that boots the real page and drives what static analysis can't reach: rendering, scope switching, hostile import, the backup parser against old, forward-dated, pasted and malformed codes, a copy with `localStorage` throwing, and the path end to end — 345 checks. It needs jsdom (`npm i -D jsdom`) and skips itself if that isn't installed.

## Releasing

`BUILD` in `docs/index.html`, `VERSION` in `docs/sw.js` and the newest `## [x.y.z]`
heading in `CHANGELOG.md` are one version string in three places. Change all
three together, or `qa/guards.js` fails the build.

The full checklist — the wire checks, the bless procedure, the browser check
and the rollback runbook — is `RELEASING.md`.

Write the changelog entry in the same commit as the change. Catalogue additions
are a MINOR bump, fixes and copy are PATCH, and MAJOR is reserved for a breaking
change to saved progress — which should never happen, because every `i:` is
frozen.

## Adding to the catalogue

The data lives in the `PATH` array near the top of the `<script>` block in `docs/index.html`. Every entry uses the same shape:

```js
// a film
{i:"batman-year-one-2011", t:"Batman: Year One", y:2011, e:2, d:"Description.", b:["e"]}

// a season of television
{i:"batman-caped-crusader-season-2-2026", t:"Batman: Caped Crusader", sub:"Season 2", y:2026, ep:10, k:"tv", e:2, d:"Description.", o:1}
```

`i` **stable unique ID** (required) · `t` title · `sub` season label · `y` year · `ep` episode count · `k:"tv"` marks it a series  
`e` era for the Bruce's-life ordering (`0` = outside any timeline) · `d` description  
`b` badges (`e` essential, `m` mature, `u` unreleased, `s` short, `c` interactive) · `o` optional

`o:1` marks an entry as off the Core route rather than as a tier — every TV season carries it. Always read tiers through `tierOf()`, never by testing `o` directly.

**Important:** Always give every entry a unique, permanent `i:` slug. **Never change an existing `i:`** — it is the frozen key that preserves user progress across updates. Adding new entries is always safe; renaming or deleting an `i:` will break saved progress for anyone who already marked that title. `qa/guards.js` enforces this against `qa/frozen-ids.json`; run it before committing.

A whole new continuity is simply one more object in the same `PATH` array.

## What belongs in the catalogue

"Every Batman story ever filmed" is the claim on the landing page, so the line has to be somewhere other than in one person's head.

**The rule: Gotham's stories, whether or not the cowl is in them.** Licensed, released, and a story.

In practice that means:

- **Licensed.** Made or authorised by DC and Warner Bros. Fan films are out, however good, and so are the unlicensed foreign productions — the 1964 Warhol *Batman Dracula*, *James Batman* (1966), *Alyas Batman en Robin* (1991).
- **A story.** Advertising is out, even licensed live-action advertising with a purpose-built Batmobile — the eight OnStar commercials (2000–2002) are the case that decided this. Behind-the-scenes and cast reunions are out for the same reason: *Return to the Batcave* (2003) has Batman on screen, but as an actor playing a part, not as a character.
- **Gotham, not just Batman.** *Joker*, *Joker: Folie à Deux* and *Birds of Prey* are here. Two of the three have no Bruce Wayne in them at all. They are stories about the city and the people Batman made, told in a continuity of their own, and a catalogue that excluded them would be answering a narrower question than the one on the front page. *Joker: Laugh Riot* — announced, undated, and premised on Batman already being dead — is in scope by this rule and will be added when it has a date.
- **A story, not a sketch.** *Super Best Friends Forever* (2012) is licensed, released, and Batman is in it — three DC Nation shorts, and still out. They are a gag reel about Supergirl, Batgirl and Wonder Woman as children, with no continuity, no arc and nothing that reads as a story once it stops being a joke. The line is not length, which the next bullet settles; it is whether anything happens. Recorded because it is the closest call in the file and it has been asked twice.
- **Any length, any format.** A three-minute DC Nation short counts. So does a fifteen-chapter serial from 1943, a web-shorts run made to sell toys, and a stop-motion parody special. Sets of shorts are entered as one entry each with the count in the label — a reader ticking twenty-two shorts individually is doing bookkeeping, not watching.
- **Batman has to be in it, or it has to be his.** A DC film with no Batman and no Gotham is out no matter how good — *Lanterns*, *Blue Beetle*, the Shazam! films. *Suicide Squad* (2016) is in because Batman is in three sequences of it; *The Suicide Squad* (2021) is out because he is in none.
- **One exception, and it is written down.** An entry with no Batman and no Gotham is admitted when it is a link in a continuity that is here for Batman — *Superman: Man of Tomorrow* opens the Tomorrowverse, *Superman: The Animated Series* season one turns the DCAU into a shared universe — and its description has to say he is not in it. Seven entries qualify. *Scooby-Doo! and Krypto, Too!* did not: no Batman, no Gotham, and no continuity that needed it, so in 1.7.5 it became the first entry ever removed.

When something sits on the line, the tie-breaker is the reader: would somebody working through every Batman story feel cheated to find it missing? That is what put the Columbia serials in, sixty years late.

## Licence

AGPL-3.0-only (`SPDX-License-Identifier: AGPL-3.0-only`). Night Watcher is free
and stays free — fork it, change it, host it. The one condition is that if you
put a modified version in front of other people, you publish your source too.
The grant is version 3 and no later version, deliberately. The licence text below
the divider in `LICENSE` is the canonical one from gnu.org, verbatim — its own
terms say changing it is not allowed. The repository URL is carried in the served
file's header comment rather than in the interface. The AGPL's how-to *suggests*
a Source link for web applications, and suggests is all it does: the only links
in this app are the where-to-watch searches, which are there to send you
somewhere you asked to go. Chrome does not get to do that.

That covers the writing as well as the code: the entry descriptions, the
continuity groupings, and the era and tier judgements. They live in the same file
as the app and one file cannot be both granted and withheld. Facts stay free, as
they always were — titles, years and episode counts belong to nobody.

## Credits & legal

- Fonts: Limelight, Anton, Big Shoulders Display, IBM Plex Sans and IBM Plex Mono, self-hosted in `docs/fonts/` under the SIL Open Font License. Their licence ships with them at `docs/fonts/OFL.txt`.
- The favicon and app icon are original bat silhouettes drawn for this project. They are not DC marks.
- This is an unofficial fan-made tracker. It contains no trademarked logos, symbols or artwork. Batman and all related characters are property of DC / Warner Bros. Discovery; this project is not affiliated with or endorsed by them.
- Catalogue compiled from public sources. Release dates for unreleased titles are as announced and may change.
