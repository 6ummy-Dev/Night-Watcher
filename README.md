# Night Watcher

**The best way to watch Gotham City life.**

A single-file web app mapping every animated Batman story ever made — **96 films and 55 seasons of television across 27 continuities** — into watch orders that spoil nothing, with progress tracking and live streaming links.

**Live:** https://6ummy-dev.github.io/Night-Watcher/

Also available on Cloudflare Workers (static assets).

## What it does

- **One switch, two journeys.** Opens on **Movies** for the 96 films. Flip to **Movies + Series** and 55 seasons — 1,434 episodes, every show from *The Adventures of Batman* (1968) to *Caped Crusader* (2026) — weave into the same orders. Nothing else about the app changes.
- **One path, chosen once.** Pick by universe (spoiler-safe), the composite chronology of Bruce's life, or straight release order from 1968 to 2028 — and the whole app follows it. No switcher to re-answer on every visit; the header carries the path name and Home leads with its completion ring. Change it whenever you like: switching re-sorts, it never clears a tick.
- **Shared links are views, not takeovers.** Following someone's `#life` link shows you their ordering and offers to adopt it, rather than silently rewriting yours.
- **Three tiers.** Everything is tagged **Essential**, **Core**, or **Optional** — tiers are exclusive, with Essential outranking Optional — plus modifiers (Mature, Short, Interactive, Not out yet). Nothing is untagged.
- **Home dashboard.** Resume card, tier meters, scoreboard, a tappable grid of every universe, and your recent watches.
- **Progress.** Two donut charts — one for the universes, one for the eras of Bruce's life — where each slice is sized by its share of the catalogue and fills as you watch. Tap any slice to jump straight there.
- **Live where-to-watch links.** JustWatch, Prime Video and Apple TV searches on every entry, so availability stays correct as streaming libraries rotate.
- **Backup & transfer.** A compact code, a scannable QR that restores on a new phone, and a full JSON export/import — all client-side, built on frozen IDs so backups stay valid forever. The code is versioned and read tolerantly: it carries your chosen path, and a code written by a newer build still restores everything an older one understands.
- **Shareable views.** Link straight to a view: [`#life`](https://6ummy-dev.github.io/Night-Watcher/#life) for the chronology of Bruce's life, `#release`, `#universes`, `#progress` — combine with scope like `#life-series`.
- **Progress that sticks.** Watched, skipped and star ratings saved in your browser (localStorage). No accounts, no server; your watch data never leaves your device — and if the browser refuses to save (Private Browsing, a full quota, some in-app webviews) the app says so in the header instead of losing your evening silently.
- **Darker.** An optional pure-black variant for watching in an actually dark room, including the system status bar. Surfaces only — the palette, type and accents are unchanged.
- **Anonymous visit counts** via [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/): cookie-free, no fingerprinting, no personal data.

## Non-goals

These are the constraints the app is built around, not features nobody has got to yet. Two of them are enforced by `qa/guards.js` rather than by good intentions.

- **No accounts, ever.** Nothing to sign up for, nothing to log into.
- **No server.** Progress lives in your browser and is never transmitted. Backup and transfer happen through a code you carry yourself.
- **No runtime dependencies** — *guarded.* One vendored MIT QR encoder, inlined. Nothing is fetched from a CDN; the app runs with the network off.
- **A weight budget** — *guarded.* `docs/index.html` must stay under 150 KB raw and 50 KB gzipped; it is currently 138 KB / 45 KB. A single file that opens instantly is the whole premise, and arithmetic is the only thing protecting it.
- **No comparison, no leaderboards, no social graph.** The moment progress is comparable between people it needs accounts and a server, and the two promises above stop being true.

## The chronology

Stories from different continuities can't share a real timeline — they're different Bruces in different realities. So the app gives three honest answers rather than one fake one:

- **By universe** — each continuity intact, in its own story order. The safest first watch.
- **Bruce's life** — a composite lifetime stitched across every continuity: *Before the cowl → Year one and two → The Grayson years → Losing Jason → Rebuilding → Broken and rebuilt → The League years → The Damian years → The last years → Beyond*. Anything with no place in a single life — Victorian Gotham, feudal Japan, LEGO, the parodies — is collected in a clearly labelled bucket at the end.
- **Release order** — the only ordering that is objectively complete, decade by decade.

The DC Animated Universe entry also carries the full interleave: where *Mask of the Phantasm* and *SubZero* slot into the series, which *Superman: The Animated Series* episodes to detour into, and why JLU's "Epilogue" has to come before *Batman Beyond*.

## Running it

One HTML file, no build step, nothing to install. The only third-party code is a single vendored MIT QR encoder (see Credits); everything else is written for this project.

Open `docs/index.html` in any modern browser, or serve the `docs/` folder from any static host — this repo publishes via GitHub Pages and Cloudflare Workers Assets. Served over HTTPS it registers a service worker, so after the first visit it opens and works with no network at all. Opened straight off disk as `file://` it still works; the service worker just doesn't register, since browsers only allow them in a secure context.

### Deploy to Cloudflare Workers

```sh
npm install          # or bun install
npx wrangler deploy
```

The static files live in `docs/`. `wrangler.jsonc` points the assets directory there so `node_modules` is never uploaded.

## Files

| File | Purpose |
| --- | --- |
| `docs/index.html` | The entire app — markup, styles, data and logic |
| `docs/sw.js` | Service worker — offline support. `VERSION` must match `BUILD` in `index.html` and the newest version in `CHANGELOG.md` |
| `docs/manifest.json` | Web app manifest — lets Android install it with the right name and icon |
| `docs/icon.png` | 512px icon, used for social cards and as the install icon |
| `docs/icon-192.png` | 192px install icon |
| `docs/icon-maskable-512.png` | Full-bleed variant so Android can apply its own mask without cropping |
| `wrangler.jsonc` | Cloudflare Workers config (points assets at `docs/`) |
| `.gitignore` | Ignores `node_modules`, Wrangler state, editor files, etc. |
| `package.json` | Dev scripts + optional jsdom for smoke tests |
| `qa/guards.js` | Build guards — run before every commit (see below) |
| `qa/frozen-ids.json` | Snapshot of every `i:` slug, so a rename can't slip through |
| `qa/smoke.js` | Optional headless render test (requires jsdom) |
| `CHANGELOG.md` | Every shipped change, newest first. Enforced by the guards |
| `README.md` | This file |

## Checks

```sh
node qa/guards.js          # verify; exits non-zero on failure
node qa/guards.js --bless  # re-snapshot frozen IDs after adding entries
```

Zero dependencies, and every function under test is **extracted from `docs/index.html` and evaluated**, never reimplemented here — a copy drifts from the app and quietly stops testing it, which is the exact failure this file exists to prevent.

**Data and progress.** Every `i:` is present, unique and unchanged since the last snapshot. The path vocabulary agrees with itself — every ordering has a label, a chooser blurb and a backup-code letter that round-trips, because two paths sharing a letter would restore as each other. No two backup-code hashes collide, with the birthday risk reported on every run. Every entry lands in exactly one tier, and Core route + Optional accounts for the whole catalogue. Every era and year has a bucket. The backup code round-trips losslessly, still reads a forward-dated code carrying segments this build has never seen, still reads a pasted restore URL, and still rejects junk. The worst-case QR payload still fits.

**Interface.** Text contrast is computed from the palette and measured against the surface it sits on, for every theme rather than just the default. The mode switcher may not return to The Path, the chooser and path card must exist, and `persist()` may not write the currently-viewed ordering as the chosen path — that is how a shared link would quietly overwrite it. Every theme needs a status-bar colour, and the header and tab bar must stay on tokens so a theme can reach them. The storage-blocked warning must exist, must sit inside the sticky header where it cannot scroll away, and must be wired to every path that can turn saving off. No `\uXXXX` escape may appear in the static markup — inside a script that is an em dash, in markup it is six literal characters. One hero size, declared once. The centred column may not shift between tabs.

**Weight.** `index.html` must stay inside the size budget above, and no external script may be loaded at runtime.

**Deployment and bookkeeping.** Nothing deployable strays to the repo root, `wrangler.jsonc` points at the served directory with SPA fallback off, and `sw.js`, `index.html` and `CHANGELOG.md` all agree on the version. The four headline counts in this README — and the counts baked into the `<meta>` and `og:` description tags — match the data.

Every guard has been negative-tested: made to fail on purpose before being trusted.

There is also `qa/smoke.js`, a headless render test that boots the real page and drives what static analysis can't reach: rendering, scope switching, hostile import, and the in-page backup parser against old, forward-dated, pasted and malformed codes. It boots a second copy with `localStorage` throwing, which is the only way to observe the silent-save failure at all. It drives the path end to end: the chooser on first run, choosing through the real click handler, a reload returning on the same path and theme, a 1.1.0 save migrating without being asked again, a shared link that does not change what is stored, and a borrowed ordering that can always be stepped back out of. 78 checks. It needs jsdom (`npm i -D jsdom`) and skips itself if that isn't installed.

## Releasing

`BUILD` in `docs/index.html`, `VERSION` in `docs/sw.js` and the newest `## [x.y.z]`
heading in `CHANGELOG.md` are one version string in three places. Change all
three together, or `qa/guards.js` fails the build.

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

## Credits & legal

- Fonts: [Limelight](https://fonts.google.com/specimen/Limelight) and [Anton](https://fonts.google.com/specimen/Anton) via Google Fonts, plus IBM Plex Sans and Mono — all under the SIL Open Font License.
- QR encoding: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) v2.0.4 by Kazuhiko Arase, vendored inline in `index.html` under the MIT Licence. Copyright (c) 2009 Kazuhiko Arase. Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: the above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- The favicon and app icon are original bat silhouettes drawn for this project. They are not DC marks.
- This is an unofficial fan-made tracker. It contains no trademarked logos, symbols or artwork. Batman and all related characters are property of DC / Warner Bros. Discovery; this project is not affiliated with or endorsed by them.
- Catalogue compiled from public sources. Release dates for unreleased titles are as announced and may change.
