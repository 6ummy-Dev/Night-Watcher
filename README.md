# Night Watcher

**The best way to watch Gotham City life.**

A single-file web app mapping every animated Batman story ever made — **96 films and 55 seasons of television across 27 continuities** — into watch orders that spoil nothing, with progress tracking and live streaming links.

**Live:** https://6ummy-dev.github.io/Night-Watcher/

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

One HTML file, no build step, no dependencies. Open `index.html` in any modern browser, or serve it from any static host — this repo publishes via GitHub Pages.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The entire app — markup, styles, data and logic |
| `icon.png` | 512px icon used for social cards and the install icon |
| `manifest.json` | Web app manifest — lets Android install it with the right name and icon |
| `README.md` | This file |

## Adding to the catalogue

The data lives in the `PATH` array near the top of the `<script>` block. Every entry uses the same shape, so extending it is a one-line job:

```js
// a film
{t:"Batman: Year One", y:2011, e:2, d:"Description.", b:["e"]}

// a season of television
{t:"Batman: Caped Crusader", sub:"Season 2", y:2026, ep:10, k:"tv", e:2, d:"Description.", o:1}
```

`t` title · `sub` season label · `y` year · `ep` episode count · `k:"tv"` marks it a series
`e` era for the Bruce's-life ordering (`0` = outside any timeline) · `d` description
`b` badges (`e` essential, `m` mature, `u` unreleased, `s` short, `c` interactive) · `o` optional

A whole new continuity is one object in the same array. IDs are generated from the title, so adding entries never disturbs anyone's saved progress.

## Credits & legal

- Fonts: [Limelight](https://fonts.google.com/specimen/Limelight) and [Anton](https://fonts.google.com/specimen/Anton) via Google Fonts, plus IBM Plex Sans and Mono — all under the SIL Open Font License.
- The favicon is an original bat silhouette drawn for this project. It is not a DC mark.
- This is an unofficial fan-made tracker. It contains no trademarked logos, symbols or artwork. Batman and all related characters are property of DC / Warner Bros. Discovery; this project is not affiliated with or endorsed by them.
- Catalogue compiled from public sources. Release dates for unreleased titles are as announced and may change.
