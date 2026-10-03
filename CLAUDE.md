# Night Watcher: notes for Claude

A single-file static app (`docs/index.html`: markup, styles, catalogue and logic), served by a Cloudflare Worker (`worker.js`, `wrangler.jsonc`) with `docs/` as its assets. A numbered guard file and a mutation-tested negative wall argue back on every change. Most rules here exist because something broke; the reasons are in `NOTES.md`.

## Read first
- `ARCHITECTURE.md`: the script's sections, the state bag `S`, the counting pipeline, routes, and one render.
- `CONTRIBUTING.md`: how a change lands, and how to add a guard section or a negative suite.
- `RELEASING.md`: the release checklist, wire checks, rollback, and the `main` ruleset.
- `NOTES.md`: why a line is shaped as it is. Check it before "fixing" something that looks odd.

## Where things render (check here before saying where a UI piece lives)
The belt (`masterChooser()`) heads all four tabs; the rows below are what each tab adds under it.

| Tab | View function | Holds |
|---|---|---|
| Home | `viewHome()` | first-run chooser and intro, hero with Begin/Resume, tier meters, the grid of universes/eras/decades, the *Read the paper* card (`paperRow`), theme row, footer |
| Next up | `viewNext()` | hero with stars, *Where to watch*, Mark watched / Skip, *Let Gotham choose*, the "Then" queue, **Recent activity** (`activityBlock`), watch notes |
| The path | `viewWatch()` | search, filter chips, groups and film rows (detail: stars, *Watched up to here*), legend |
| Progress | `viewStats()` | skyline, scoreboard, nights and *done by*, share card, by-universe/era/decade folds, five stars, backup / restore / clear, install, build line |

## Commands
- `npm test`: guards and smoke (about 75 s). `node qa/guards.js` alone takes about 2 s.
- Browser check: `python3 -m http.server 8099 --directory docs &` then `npm run browser`. A change to the belt, scrolling, focus, sticky, content-visibility or the service worker isn't verified until this is green.
- Negative wall: `bash qa/negative/run-all.sh` (about 30 min), or a single suite with `bash qa/negative/run-all.sh 760`.
- Paper and crew page: `npm run nocturne:check`, `npm run hww:check`.
- Node must satisfy `engines` (`^22.22.2 || ^24.15.0 || >=26`) because `.npmrc` sets `engine-strict`; `.nvmrc` names `22.22.2`, so `nvm use` picks one that installs. In a sandbox whose Node lags, `npm ci --engine-strict=false` is acceptable for local checks only. Say you did it.
- If Playwright's pinned Chromium is missing, set `NW_CHROME=/path/to/chrome` (the browser check's escape hatch).

## Rules the guards enforce (easy to trip)
- **One version in three places:** `BUILD` in `docs/index.html`, `VERSION` in `docs/sw.js`, and the newest `## [x.y.z]` in `CHANGELOG.md`. Every change gets a CHANGELOG entry. Docs, tooling and fixes are PATCH (README § "Releasing").
- **Every tracked file has a row in README's file table**, including this file and anything under `.claude/`. A directory row with a trailing slash (`` `.claude/` ``) covers everything under it.
- **`i:` slugs are frozen.** Change titles freely, never ids (`qa/frozen-ids.json`; ledgers in `qa/*-ids.json`).
- **Guard sections are append-only**, with the reason in the comment above and a negative fixture in the same commit (CONTRIBUTING has the checklist).
- **Generated files are never hand-edited:** `docs/nocturne/**` (`npm run nocturne:build`), `docs/hww/**` (`npm run hww:build`), `docs/orders.txt`, the CSP hash / crawler seed / JSON-LD in `index.html`, `qa/script-bytes.json`, `qa/contrast.md`, `qa/share-card.json` (`npm run bless`), and the images and fonts (their `qa/make-*` and `qa/subset-fonts.py` scripts). Bless only when a change is deliberate, and read the diff.
- LF line endings everywhere (`.gitattributes`); the guards hash bytes.

## Git and releases
- The owner releases by uploading to `main`. Don't commit, push, open PRs, or run `npm run deploy` / `rollback` unless asked in this conversation.
- Nocturne issue PRs come from `nocturne-night-final[bot]` and may touch only the paper (`nocturne-fence.yml`). `.github/`, `qa/` and the agent's rules are code-owned.

## QA and audits
- For a QA report, audit or post-release check, use the `nw-qa` skill. It is read-only, re-tests the previous audit's findings, and delivers a report file. Never write audit artefacts into the repo.

## Shell habits
- Stop a server by PID (`cmd & PID=$!` … `kill "$PID"`), never with a bare `pkill -f <pattern>`: the pattern matches the shell running it.
- Start long runs (the negative wall, smoke) in the background and wait for their completion notice. Don't sleep in the foreground.
- To seed `localStorage` for a test, do it from a non-app page on the same origin (`/robots.txt`). The app's `pagehide` flush overwrites anything seeded while it's open.
