# Releasing Night Watcher

The release checklist: the checks no guard can run — the ones that need the
live wire, a browser, or a human — written down instead of remembered.
Everything here is in execution order. (Why it exists, and the incident that
produced it: `NOTES-history.md`.)

## Before the version moves

1. **The version trio.** `CHANGELOG.md` newest entry, `BUILD` in
   `docs/index.html`, and `VERSION` in `docs/sw.js` must be the same string,
   and the CHANGELOG entry's date must match `BUILT`, the sitemap's first
   `<lastmod>`, and the JSON-LD `dateModified`. Guards fail on drift, but
   write them together rather than letting the guards find out.
2. **The share card, when the catalogue moved.** `docs/share.png` bakes in
   the film, season and continuity counts, and guard 91 holds
   `qa/share-card.json` against the data on every run — so a catalogue edit
   is red from the first bless onward until the card is regenerated. That is
   why this step comes BEFORE the bless and not after it:

   ```
   node qa/make-share-card.mjs        # draws the card, writes the manifest
   python3 -c "from PIL import Image; i=Image.open('docs/share.png').convert('RGBA'); \
     i.quantize(colors=256, method=Image.Quantize.FASTOCTREE, \
     dither=Image.Dither.FLOYDSTEINBERG).save('docs/share.png', optimize=True)"
   ```

   The bless in the next step records the quantized file's hash. The Python
   tooling (Pillow, fonttools, brotli) is declared in
   `qa/requirements-tooling.txt`.

   **The install screenshots move with it (6.1.0).** The narrow one prints
   the same three counts, and guard 160 holds `qa/screenshots.json` against
   the data the same way guard 91 holds the card:

   ```
   node qa/make-screenshots.mjs       # draws both, quantizes, writes the record
   ```

   It serves `docs/` itself and quantizes itself, so no bless is needed for
   it; regenerate it too when Home or The Path changes shape, which no guard
   can see. If the catalogue did not move, skip this step.
3. **Bless.** `npm run bless`. Since 3.7.2 a bless run re-checks the tree it
   wrote and exits red if anything is still wrong, so a green bless IS a
   green tree — but bless still refuses one thing by design: a frozen ID
   leaving the catalogue without a ledger entry — `qa/retired-ids.json`
   (gone), `qa/renamed-ids.json` (renamed), or `qa/split-ids.json` (6.0.0:
   one row become several, the app's `SPLIT` table held equal to it). If
   bless refuses, record the retirement; do not fight the refusal, it is the
   product's oldest promise. A split or a retirement re-means saved
   progress, so it ships only in a MAJOR (README, "Releasing"). One bless
   covers everything that blesses (the CSP hash, the script-bytes ledger,
   the share card's hash); a second is only ever needed if something was
   edited after the first.
4. **The suites.** `npm test` (guards + smoke), then the negative matrix:
   `bash qa/negative/run-all.sh` (≈84 CPU-minutes under `time` — 44 minutes
   on two shared cores, measured for 5.4.0 with 1,337 fixtures; the first
   three minutes are the four pristine smoke signatures the wall captures
   once and hands to every suite; suite numbers can
   be passed to run one). **The full wall, not a selection, before any cut**:
   several guard messages have fixture twins in suites far from the change —
   the listener count alone is pinned from three different suites — and a
   selective run is exactly the run that misses them. Selections are for
   iterating on a fixture, never for release verification.
5. **The browser check.** Serve the tree and drive it:

   ```
   python3 -m http.server 8099 --directory docs &
   npm run browser
   ```

   CI runs this too since 3.7.2, but run it where the release is being cut —
   the repo's history (scroll clamp, focus loss, group collapse, the 3.6.4
   belt) is the argument that the behavioral layer does not get skipped on
   release day.

   **The ARIA corpus is part of it (6.1.0).** `qa/aria/` is what a screen
   reader can reach in eight states, and the check diffs it on Chromium. A
   change that moves a word a reader hears there — copy, a label, a count
   after a catalogue cut — is red until it is re-recorded:

   ```
   npm run browser -- --bless         # rewrites qa/aria/, then read the diff
   ```

   A stale run leaves the live record in `qa/.shots/aria-<state>.yml`. The
   Batman Day line, `BUILD` and `BUILT` are normalised out, so a version bump
   alone never needs this.

   **The gate, stated as a rule: for any
   change touching the belt, scrolling, focus, sticky, content-visibility,
   or the service worker, the browser check is the test and `npm test` is
   only the tripwire.** `npm test` runs jsdom, which has no layout — it can
   prove the fix is still spelled in the file and nothing about whether it
   works. A green `npm test` is never, by itself, permission to ship a
   change in that list; a red browser check blocks it exactly as a red
   guard would. The suite runs at three speeds and each answers its own
   question: FAST (`npm test` — identity, codec, catalogue, CSP, the
   persist doors), SLOW (`npm run browser` — layout, focus, belt, CV,
   axe-in-a-state, SW), MUTATE (CI negatives — the watcher still fires).
   Keep FAST fast; do not fold the other two into it, because a suite that
   takes half an hour locally is a suite that gets skipped.
6. **The blurbs are read by a person.** Entry descriptions are the "no
   spoilers" promise and no guard can read for spoilers. Any entry whose `d:`
   changed this release gets re-read against the rule: describe the premise,
   never the turn. This is the manual review the guards' coverage map admits
   it cannot automate.

**Throughout: verify a new state from a cold start, never from the state that
produced it.** Three releases in a row were checked by driving the app into the
new condition and looking at it, which confirms the transition and says nothing
about what a reader who arrives fresh sees. 1.6.5 was the third and the last:
reload, or boot a clean document, and look again. `qa/smoke.js` boots several
documents for exactly this reason. (This rule lived in the README's release
section until 4.1.1; it belongs in the checklist that runs.)

## Ship

7. **Deploy.** `npm run deploy` (wrangler, to the Worker that serves
   `docs/`). Releases here ship from a green tree on `main` — there is no
   staging origin, which is exactly why everything above runs first.
   **Tagging: `x.y.0` minors and majors are tagged and get a GitHub Release;
   patches are not** — so the Releases page trails `origin/main` between
   minors by design, and an outside reader who counts tags against the
   CHANGELOG will find the gap and should not file it (three already have:
   5.3.1, 6.0.3 and 6.0.9 — the last because 6.0.9's revert took this
   sentence out with the rest of 6.0.4). Read the tags with
   `git ls-remote --tags origin`, never from a `--depth` clone, which omits
   them and has produced a false "tagging lapsed" finding of its own.

## The wire checks — after every deploy

The tree cannot see the edge. Rules configured in the Cloudflare dashboard
apply AFTER `_headers` and win, which is how 3.4.2 served a stale
Permissions-Policy for a whole release while every guard stayed green. So the
wire is read directly:

```
curl -sI https://nightwatcher.life/ | grep -iE \
  'permissions-policy|referrer-policy|x-frame-options|cross-origin|cache-control'
curl -sI https://nightwatcher.life/sw.js | grep -i cache-control
curl -sI https://nightwatcher.life/nope | head -1
curl -s  https://nightwatcher.life/sw.js | grep VERSION
```

Expected: the `_headers` values exactly (no header the file does not set —
an extra one means a dashboard rule came back); `no-cache` on both `/` and
`/sw.js`; a real `404` on the wrong-alley path; and the freshly shipped
VERSION from the bare `/sw.js` URL — if it answers an old version, the edge
is serving a stale worker and every returning visitor is pinned to it.

**Early Hints (4.9.2 onward).** The zone toggle (Speed → Optimization →
Protocol → Early Hints) is a panel value no guard can read, so it is a wire
check. The hints are cached from a document response, so the 103 appears
from the SECOND request after a deploy, over HTTP/2 or HTTP/3:

```
curl -s -o /dev/null https://nightwatcher.life/            # primes the hint cache
curl -sv -o /dev/null https://nightwatcher.life/ 2>&1 | grep -A7 -E '< HTTP/[23] 103'
```

Expected: an `HTTP/2 103` (or `HTTP/3 103`, if curl negotiated h3) block carrying the six `link:
</fonts/…>; rel=preload; as=font; crossorigin` lines from `_headers`, then
the `200`. If the 103 never appears, the toggle is off — flip it and
re-check; the six Link lines on the `200` are `_headers` working either
way, and the toggle only adds the early copy.

One more, read once per platform change rather than per deploy:

```
curl -sI https://nightwatcher.life/index.html | head -1
```

Expected: a redirect to `/` (the assets plane's default `html_handling`).
That redirect is why `sw.js` installs the page as `./` and not as
`./index.html` — a copy fetched under the latter name is a redirected
response, which a browser refuses for a navigation, and since 4.5.2 the
name is not installed at all; the fallback consults it last, only for a
platform where the path answers `200` and a visit cached it. So: `3xx` is
the expected answer; `200` is the platform change that makes the last
fallback live; `404` is informational — the shell is `./`, and nothing
offline depends on this path.

Since 3.8.0 the root negotiates markdown (guard 133 executes the script;
this reads the wire it actually shipped to):

```
curl -s -H 'Accept: text/markdown' -D - https://nightwatcher.life/ -o /tmp/nw.md \
  | grep -iE 'content-type|vary|content-location'
head -1 /tmp/nw.md
curl -s https://nightwatcher.life/ | head -2
```

Expected: `text/markdown` with `Vary: Accept` and `Content-Location:
/llms.txt`, the body opening `# Night Watcher` (llms.txt's first line) — and
the last line proves a plain request still gets the HTML doctype, because
the passthrough is the branch every other check in this file depends on.
The markdown response and `/.well-known/api-catalog` are built by the Worker
and do not get `_headers`; they carry the security set from `worker.js`
itself (guard 133 holds the two equal), so the first `curl -sI` above run
with `-H 'Accept: text/markdown'` must show the same five security headers.

Two one-time checks from the 10 Aug Radar triage, worth re-reading on any
DNS or panel change:

```
dig +dnssec nightwatcher.life A +multiline | grep -E 'flags|RRSIG'
curl -s -o /dev/null -w '%{http_code}\n' \
  https://nightwatcher.life/platform/v2/x402/discovery/resources
```

Expected: the `ad` flag and RRSIG records once DNSSEC is enabled in the
Cloudflare DNS panel (it is a panel action by necessity — DNS is already
panel-owned per the wrangler.jsonc custom-domain rationale; if the domain is
on Cloudflare Registrar the DS record places itself); and a real `404` from
the x402-shaped path — the 8/10 scan logged a 200 there, almost certainly
the scanner probing Cloudflare's own platform endpoint, but if this URL ever
answers 200 from the outside, something is answering in front of the Worker
and that is a finding, not a curiosity.

## Nocturne (6.2.0 onward)

**An issue is not a release.** It lands as a pull request from the drafting
agent's `nocturne/` branch and goes live when the owner merges it (the
Worker builds on every push to `main`). No version moves. Before merging:
CI green on every job, `nocturne-paths` included; the two screenshots the
agent attached (390 and 1280 wide) read through; every source link opened
on at least the lead story. Then, after the deploy:

```
curl -sI https://nightwatcher.life/nocturne/ | grep -iE '^HTTP|content-security-policy'
curl -s  https://nightwatcher.life/nocturne/feed.xml | grep -c '<item>'
curl -s  https://nightwatcher.life/sitemap.xml | grep -c '/nocturne/'
```

Expected: `200` and the one `Content-Security-Policy` line from
`_headers`, exactly; the feed's item count equal to the issues merged (up
to 20); the sitemap listing the archive and every issue. Before the first
issue is merged, `/nocturne/` answers `200` with the holding page (On the
press, `noindex`), the feed answers with `0` items and the sitemap lists no
`/nocturne/` URL: that is the 6.2.1 state, not a fault.

**The door on Home (6.2.1), a device check.** Home's *Read the paper* is
built like *Where to watch*, but *Where to watch* leaves the site and the
paper does not: it sits inside the installed app's scope (`/`). After any
release that touches the door, tap it on iPhone, iPad and PC, in a browser
tab and in the installed app. In a tab it must open a new tab. In the
installed app, a new tab or the system browser is right; the paper opening
inside the app's own window, with no way back to the map, is a fault to fix
in a patch.

A bad issue already live is fixed by another pull request: a dated
correction at the top of the story (`nocturne/VOICE.md` §5), or, for an
image a rights holder objects to, the image out the same day. An issue is
never deleted. If one ever has to go, it is taken out in a release whose
CHANGELOG entry says why.

## Rollback

The recovery story `sw.js` promises, written down:

- **Preferred:** `npm run rollback` (the same pinned wrangler the deploy
  script uses) — Workers keeps prior deployments; roll back to the
  previous one. The service worker is network-first and
  `no-cache`, so clients pick the reverted tree up on their next load.
- **Equivalent:** check out the last released tree (`git log` — every release
  is one commit on `main`) and `npm run deploy` from it.
- **Then verify the rollback landed:** the `curl -s .../sw.js | grep VERSION`
  line above must answer the version rolled back TO. If it answers the bad
  version, the edge cache is serving stale — purge `/sw.js` in the dashboard
  and read the wire again.
- A rollback is a release: it gets a CHANGELOG line saying what was rolled
  back and why, dated the day it happened.
- **Rolling back across a MAJOR loses what the MAJOR re-meant.** A reader
  who booted 6.0.0 once has their settings under `batwatch-settings` and
  the Batwoman bundle's marks fanned out to three season slugs; a 5.x
  tree reads neither — it boots them on default settings (the progress
  key still carries the old settings until 6.0.0's first progress write,
  after which it does not) with the three seasons ticked under slugs it
  cannot render and the bundle unticked. Progress is not lost — the bytes
  stay under the same key, and 6.0.0 reads them back — but a rollback
  across 6.0.0 is a visible regression for anyone who ticked Batwoman, and
  the CHANGELOG line says so.

## Recovering a deleted or mis-bound Worker

Written on 14 August 2026, the day it was needed. The Worker was deleted,
recreated from the Cloudflare dashboard, and came back serving nothing for
anybody who had not been there before.

**The symptom that names the fault.** The site loaded normally in the owner's
own browser and failed in incognito. That contrast is the whole diagnosis: an
installed PWA serves its own cached shell, so a dead origin looks alive to
exactly the person most likely to check. **Verify a deploy in a private window,
always.** A normal window is testing the service worker, not the site.

**The fault itself: two bindings on one hostname.** The recreated Worker had
both a Custom Domain `nightwatcher.life` *and* a Route `nightwatcher.life/*`.
Cloudflare cannot serve both on one host and does not warn. **One hostname is
one binding — a Custom Domain, never also a Route.** To fix: remove the
**Route** row (••• → Remove) and keep the Custom Domain. Read the confirmation
modal before accepting it: it must say "Remove **route**". Removing the wrong
row deletes the Custom Domain and takes the site down.

**Recovery, in order:**

1. `npm run deploy` from a clean checkout of `main`. That recreates the Worker,
   uploads `docs/` as its assets, re-asserts `workers_dev: false`, and
   re-attaches the apex as a Custom Domain — all of it from `wrangler.jsonc`,
   which guard 136 pins.
2. **No terminal to hand?** Cloudflare → Workers & Pages → Create → Import a
   repository → `6ummy-Dev/Night-Watcher`, branch `main` → deploy. Then check
   the two settings the dashboard does not take from the file: workers.dev off,
   and exactly one apex binding.
3. DNS: a single **proxied** `Worker` record for the apex pointing at
   `night-watcher`. Nothing else on the apex.
4. Certificates need no action. Universal and Advanced SSL are zone-level and
   survive a Worker being deleted.
5. Run "The wire checks" above, in a private window.

**What none of this can see.** Guard 136 pins the file and cannot read the
panel. A Custom Domain or Route added in the dashboard is invisible to every
test in this repository — guard 82 caught the file in the 8 August incident and
nothing could catch the panel. That is why the incognito check is a step here
and not a suggestion.

## The evidence files

Several passages in `CHANGELOG.md`, `NOTES-history.md`, `docs/sitemap.xml`
and `worker.js` cite the maintainer's local evidence files
(`qa/favicon-serp-2026-08.md`, `qa/scan-triage-2026-08-07.md`,
`ops/c0-edge-injection.md`, and others). Those are annotated as
maintainer-local where cited — they are not in the repository, and this file
is the in-repo home for anything a release actually depends on.

## Standing notes

The tree was sealed at 4.5.3 (`README.md`, "Status"); every release since is
a decision with its own entry, cut by this same checklist. These notes are
for whoever runs the suites on any cut, sealed or later.

- **Guard 140 is the only clock.** It fails thirty days before
  `docs/.well-known/security.txt`'s `Expires` (2027-08-01 as sealed), with
  no edit anywhere. On a live tree that is the reminder to renew and ship.
  For an archival run of the sealed tree, `NW_TODAY=YYYY-MM-DD node
  qa/guards.js` pins the clock to the date given; it does nothing else and
  is not a way to ship an expired file. The pin is refused when `CI` is
  set, and refused in any shape but `YYYY-MM-DD` (4.5.2) — the guard's
  message points here.
- **Node.** `package.json` declares `engines` matching jsdom's requirement
  and `.npmrc` sets `engine-strict=true`, so `npm ci` on an older Node fails
  at install, not mid-suite (without the `.npmrc` npm only warns —
  `EBADENGINE` — and the suite would have found out later).
- **Line endings.** `.gitattributes` forces LF. The CSP hash, the
  script-bytes ledger and every `split("\n")` in the guards assume it; a
  CRLF checkout goes red across many sections at once, and that is the
  checkout, not the tree.
- **The negative wall is the release verification**, in full (step 4). It
  takes the time step 4 states — one figure, stated once, measured on the
  release machine.
