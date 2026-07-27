# Night Watcher

**The best way to watch Gotham City life.**

A single-file web app mapping every animated Batman story ever made — **96 films and 55 seasons of television across 27 continuities** — into watch orders that spoil nothing, with progress tracking and live streaming links.

**Live:** https://6ummy-dev.github.io/Night-Watcher/

Also available on Cloudflare Workers (static assets).

## What it does

- **One switch, two journeys.** Opens on **Movies** for the 96 films. Flip to **Movies + Series** and 55 seasons — 1,434 episodes, every show from *The Adventures of Batman* (1968) to *Caped Crusader* (2026) — weave into the same orders. Nothing else about the app changes.
- **Three orderings.** By universe (spoiler-safe), as one composite chronology of Bruce's life, or straight release order from 1968 to 2028.
- **Three tiers.** Everything is tagged **Essential**, **Core**, or **Optional** — tiers are exclusive, with Essential outranking Optional — plus modifiers (Mature, Short, Interactive, Not out yet). Nothing is untagged.
- **Home dashboard.** Resume card, tier meters, scoreboard, a tappable grid of every universe, and your recent watches.
- **Progress.** Two donut charts — one for the universes, one for the eras of Bruce's life — where each slice is sized by its share of the catalogue and fills as you watch. Tap any slice to jump straight there.
- **Live where-to-watch links.** JustWatch, Prime Video and Apple TV searches on every entry, so availability stays correct as streaming libraries rotate.
- **Backup & transfer.** A compact code, a scannable QR that restores on a new phone, and a full JSON export/import — all client-side, built on frozen IDs so backups stay valid forever.
- **Shareable views.** Link straight to a view: [`#life`](https://6ummy-dev.github.io/Night-Watcher/#life) for the chronology of Bruce's life, `#release`, `#universes`, `#progress` — combine with scope like `#life-series`.
- **Progress that sticks.** Watched, skipped and star ratings saved in your browser (localStorage). No accounts, no server; your watch data never leaves your device.
- **Anonymous visit counts** via [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/): cookie-free, no fingerprinting, no personal data.

## The chronology

Stories from different continuities can't share a real timeline — they're different Bruces in different realities. So the app gives three honest answers rather than one fake one:

- **By universe** — each continuity intact, in its own story order. The safest first watch.
- **Bruce's life** — a composite lifetime stitched across every continuity: *Before the cowl → Year one and two → The Grayson years → Losing Jason → Rebuilding → Broken and rebuilt → The League years → The Damian years → The last years → Beyond*. Anything with no place in a single life — Victorian Gotham, feudal Japan, LEGO, the parodies — is collected in a clearly labelled bucket at the end.
- **Release order** — the only ordering that is objectively complete, decade by decade.

The DC Animated Universe entry also carries the full interleave: where *Mask of the Phantasm* and *SubZero* slot into the series, which *Superman: The Animated Series* episodes to detour into, and why JLU's "Epilogue" has to come before *Batman Beyond*.

## Running it

One HTML file, no build step, nothing to install. The only third-party code is a single vendored MIT QR encoder (see Credits); everything else is written for this project.

Open `index.html` in any modern browser, or serve it from any static host — this repo publishes via GitHub Pages and Cloudflare Workers Assets. Served over HTTPS it registers a service worker, so after the first visit it opens and works with no network at all. Opened straight off disk as `file://` it still works; the service worker just doesn't register, since browsers only allow them in a secure context.

### Deploy to Cloudflare Workers

```sh
npm install          # or bun install
npx wrangler deploy
```

The project is configured as pure static assets (`wrangler.jsonc`). The service worker and SPA routing are handled correctly.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The entire app — markup, styles, data and logic |
| `sw.js` | Service worker — offline support. `VERSION` must match `BUILD` in `index.html` |
| `manifest.json` | Web app manifest — lets Android install it with the right name and icon |
| `icon.png` | 512px icon, used for social cards and as the install icon |
| `icon-192.png` | 192px install icon |
| `icon-maskable-512.png` | Full-bleed variant so Android can apply its own mask without cropping |
| `wrangler.jsonc` | Cloudflare Workers config (static assets + SPA fallback) |
| `.gitignore` | Ignores `node_modules`, Wrangler state, editor files, etc. |
| `package.json` | Dev scripts + optional jsdom for smoke tests |
| `qa/guards.js` | Build guards — run before every commit (see below) |
| `qa/frozen-ids.json` | Snapshot of every `i:` slug, so a rename can't slip through |
| `qa/smoke.js` | Optional headless render test (requires jsdom) |
| `README.md` | This file |

## Checks

```sh
node qa/guards.js          # verify; exits non-zero on failure
node qa/guards.js --bless  # re-snapshot frozen IDs after adding entries
```

Zero dependencies for the guards, and it evaluates the real functions out of `index.html` rather than reimplementing them, so it can't quietly drift from the app. It checks that every `i:` is present, unique and unchanged since the last snapshot; that no two backup-code hashes collide; that every entry lands in exactly one tier and that Core route + Optional accounts for the whole catalogue; that every era and year has a bucket; that the backup code round-trips losslessly; that the worst-case QR payload still fits; that `sw.js` and `index.html` agree on the version; and that the four headline counts in this README match the data.

There is also `qa/smoke.js`, a headless render test. It needs jsdom (`npm i -D jsdom`) and skips itself if that isn't installed.

## Adding to the catalogue

The data lives in the `PATH` array near the top of the `<script>` block. Every entry uses the same shape:

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
