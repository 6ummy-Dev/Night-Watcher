# Releasing Night Watcher

This is the checklist `docs/_headers` has been pointing at since 3.4.2 — it
did not exist until 3.7.2 (M-3 of the 10 Aug review), which meant an operator
following the docs would have re-introduced the exact edge-rule failure the
`_headers` comment narrates. It exists so that the checks no guard can run —
the ones that need the live wire, a browser, or a human — are written down
instead of remembered. Everything here is in execution order.

## Before the version moves

1. **The version trio.** `CHANGELOG.md` newest entry, `BUILD` in
   `docs/index.html`, and `VERSION` in `docs/sw.js` must be the same string,
   and the CHANGELOG entry's date must match `BUILT`, the sitemap's first
   `<lastmod>`, and the JSON-LD `dateModified`. Guards fail on drift, but
   write them together rather than letting the guards find out.
2. **Bless, once.** `npm run bless`. Since 3.7.2 a bless run re-checks the
   tree it wrote and exits red if anything is still wrong, so a green bless
   IS a green tree — but bless still refuses two things by design: a frozen
   ID leaving the catalogue without a `qa/retired-ids.json` entry, and a
   rename without `qa/renamed-ids.json`. If bless refuses, record the
   retirement; do not fight the refusal, it is the product's oldest promise.
3. **The suites.** `npm test` (guards + smoke), then the negative matrix:
   `bash qa/negative/run-all.sh` (~15–20 minutes; suite numbers can be passed
   to run one).
4. **The browser check.** Serve the tree and drive it:

   ```
   python3 -m http.server 8099 --directory docs &
   npm run browser
   ```

   CI runs this too since 3.7.2, but run it where the release is being cut —
   the repo's history (scroll clamp, focus loss, group collapse, the 3.6.4
   belt) is the argument that the behavioral layer does not get skipped on
   release day.
5. **The blurbs are read by a person.** Entry descriptions are the "no
   spoilers" promise and no guard can read for spoilers. Any entry whose `d:`
   changed this release gets re-read against the rule: describe the premise,
   never the turn. This is the manual review the guards' coverage map admits
   it cannot automate.

## Ship

6. **Deploy.** `npm run deploy` (wrangler, to the Worker that serves
   `docs/`). Releases here ship from a green tree on `main` — there is no
   staging origin, which is exactly why everything above runs first.

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

## Rollback

The recovery story `sw.js` promises, written down:

- **Preferred:** `npx wrangler rollback` — Workers keeps prior deployments;
  roll back to the previous one. The service worker is network-first and
  `no-cache`, so clients pick the reverted tree up on their next load.
- **Equivalent:** check out the last released tree (`git log` — every release
  is one commit on `main`) and `npm run deploy` from it.
- **Then verify the rollback landed:** the `curl -s .../sw.js | grep VERSION`
  line above must answer the version rolled back TO. If it answers the bad
  version, the edge cache is serving stale — purge `/sw.js` in the dashboard
  and read the wire again.
- A rollback is a release: it gets a CHANGELOG line saying what was rolled
  back and why, dated the day it happened.

## The evidence files

Several CHANGELOG/NOTES/`_headers` passages cite the maintainer's local
evidence files (`qa/favicon-serp-2026-08.md`, `qa/scan-triage-2026-08-07.md`,
`ops/c0-edge-injection.md`, and others). Those are annotated as
maintainer-local where cited — they are not in the repository, and this file
is the in-repo home for anything a release actually depends on.
