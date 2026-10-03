---
name: nw-qa
description: Run a full, read-only engineering QA audit of the Night Watcher repository (6ummy-Dev/Night-Watcher) and deliver a severity-ranked report file for the devs, re-testing every finding from the previous audit's baseline. Use this whenever someone asks for a QA report, an audit, a health check, a release check, a post-release review, "run QA", "check the repo", or "audit after 6.5.x" on Night Watcher, even if they don't name this skill or list the steps. It never edits, commits or pushes the repository.
---

# Night Watcher QA audit

The goal is the report a senior engineer would hand the team after a release: what was run and with what result, every finding with evidence and a fix, and an honest verdict on each finding from the last audit. It is read-only by design. The owner releases by uploading zips to `main`, so an audit that writes to the tree would hand them an unreviewed change. Everything you produce (tools, scratch servers, the report) lives outside the repository.

## Ground rules

- **Read-only.** Don't edit tracked files, commit, push, open PRs, or run `npm audit fix`. Don't run anything that writes the tree or touches production: `npm run bless`, `deploy`, `rollback`, `preview`, `nocturne:build`, `hww:build`, or `npm run browser -- --bless`. `git status --short` must be empty at the end. If it isn't, say why.
- **Write outside the repo.** Put linters, harnesses, logs and the report in the scratchpad (or `$TMPDIR`). Install extra tools there too, never into the repo's `package.json`.
- **Verify before you claim.** Every finding cites a file and line, a command and its output, or a run ID. Before saying where something renders, grep the view function (for example, `activityBlock()` renders on **Next up**, not Home; a past draft got that wrong). Before calling something a bug, check `NOTES.md`: much of this codebase is deliberate and documented. A documented decision can still be a finding, but say that it is documented.
- **Separate artefacts from defects.** Tool noise isn't a finding. Lighthouse's robots.txt failure happens because the app's CSP blocks the in-page fetch. "Text compression" on a local server is an artefact (Cloudflare compresses). ESLint `no-undef` inside `page.evaluate` callbacks is a false positive.

## Procedure

Start the slow work first and read code while it runs.

### 0. Orient (5 minutes)
- Version under test: `BUILD` in `docs/index.html`, which must equal `VERSION` in `docs/sw.js` and the top `## [x.y.z]` in `CHANGELOG.md`. Record the commit SHA.
- Read `ARCHITECTURE.md` (which view owns what), `CONTRIBUTING.md` (how a change lands), `RELEASING.md` (§ "The `main` ruleset", deploy, rollback), and the README's "Checks" section.
- Find the baseline: the newest `references/baseline-*.md` in this skill (the account-level copy carries one), or a report the user supplies. The copy committed in the repo deliberately ships without one: the repository is public, and `SECURITY.md` asks for findings to stay private until they're fixed. If there's no baseline, ask the user for the last report before going on; without one, run the audit fresh and say so. Note the baseline's commit and run `git log --oneline <baseline-commit>..HEAD` to see what changed since.

### 1. Install
`npm ci`. If it fails with `EBADENGINE` because the sandbox's Node patch is behind `engines`, rerun with `npm ci --engine-strict=false` and record that in the report. CI uses `check-latest`, so this is a local-only workaround.

### 2. The project's own suites
| Run | Command | Notes |
|---|---|---|
| Guards | `node qa/guards.js` | About 2 s. Any warning is a failure in CI |
| Smoke | `node qa/smoke.js` | About 70 s; it prints its check count |
| Paper | `node qa/nocturne.js check` · `node qa/hww.js check` | |
| Browser | serve with `python3 -m http.server 8099 --directory docs` in the background (keep `$!`), then `NW_ENGINE=chromium NW_ONLY=all node qa/browser-check.mjs` | If Playwright's pinned Chromium isn't installed, set `NW_CHROME=/opt/pw-browsers/chromium` (or wherever one is) and record the revision skew. Run WebKit too if it's installed; otherwise say CI covers it |
| Negative wall | `bash qa/negative/run-all.sh > neg.log 2>&1` **in the background, first** | About 30 min on 4 cores. Report suites and fixtures from its totals line |

### 3. Probes the suites don't cover
`NW_REPO=<repo> [NW_CHROME=…] bash scripts/run-probes.sh` serves `docs/` with the real `_headers` applied and prints one `VERDICT` line per baseline item:

| Verdict | Re-tests |
|---|---|
| `L2` | CSP under real headers on every page, including issue pages from the sitemap (CI's `http.server` never applies `_headers`) |
| `L1` | Service worker: does each unique query string cache another copy of the page? |
| `M4` | Pace forecast after a backup-code restore |
| `M3` | Unreadable progress payload: permanent read-only mode, and whether reset escapes it |
| `SAFE` | Hostile JSON restore and hostile hashes stay inert |
| `WRKR` | `worker.js` negotiation, 304s, and HEAD (plus the I4 malformed-q nit) |

A probe that errors because an app global was renamed is a probe bug: read the code, adapt the script in your scratch copy, rerun, and mention it. A finding that has no probe gets re-tested by reading the code at the cited lines.

### 4. Static analysis
- ESLint 9 on the shipped code. Extract the app script (the lines between `<script>` and `</script>` after the JSON-LD block) into a file, and copy `docs/sw.js`, `docs/nocturne/*.js` and `worker.js` *into the scratch tool directory*: flat config silently ignores files outside its base path. The rules are in `references/report-template.md` § Static analysis.
- html-validate (recommended preset) on every served `.html`. pyflakes on `qa/*.py`. shellcheck `-S warning` on `qa/negative/*.sh` (SC2034 on `P`/`W` in `_lib.sh` is a false positive). `npm audit`, `npm outdated`.
- Run a secrets grep over the tree and over `git log -p`. The IndexNow and Brave tokens are public by design.
- Optional: Lighthouse 12 (mobile) against the probe server.

### 5. Code review
Read `git diff <baseline-commit>..HEAD -- docs/index.html docs/sw.js worker.js wrangler.jsonc docs/_headers .github/` closely, then skim the rest of the app script. Look hardest at storage, restore and merge, the service worker, routing, and anything a guard was added for. For each baseline finding without a probe (L4, L5, L6, L8–L13 and the I-items), check the cited lines and decide its status.

### 6. CI and process (GitHub tools)
- Use `actions_list` for workflow runs on `qa.yml`. Count cancelled and failed runs on `main` since the baseline, and use `get_job_logs` (failed_only) on any red one.
- Use `list_pull_requests` (state all) to see what merged and whether it merged before or after green. Note open Dependabot PRs and whether their QA passed.
- Re-read the `RELEASING.md` ruleset table: are `test`, `negative` and `browser` required yet? Does `package.json` have a `predeploy` gate yet?

### 7. Data freshness
Parse `PATH` in `docs/index.html`. Flag any parked entry (`b` contains `"u"`) whose `when` date has passed (it should have been un-parked) or falls within the next 30 days (a heads-up for the owner).

### 8. Live wire (only if the network allows)
Try `curl -sI https://nightwatcher.life/`. If the sandbox denies the host, don't keep retrying: say the wire checks in `RELEASING.md` were not run.

### 9. Write and deliver the report
Follow `references/report-template.md` exactly. It includes the **Baseline status** table, where every baseline ID gets Fixed, Still present, Changed or N/A, with evidence. Keep the baseline's IDs for carried-over findings and number new findings from the next free ID. Name the file `Night-Watcher-QA-Report-<version>-<YYYY-MM-DD>.md`, save it in the scratchpad, and send it as an attachment. Tell the user to keep it as the next audit's baseline: add it to their account-level copy of this skill as `references/baseline-<version>.md`. Never commit a report into the repository. It is public, and open findings belong in private channels (`SECURITY.md`).

## Environment pitfalls (each one cost time before)
- **Stopping processes:** keep `$!` and `kill "$PID"`. A bare `pkill -f <pattern>` also matches the shell running it and kills your own command (exit 144).
- **Seeding localStorage:** do it from a non-app page on the same origin (e.g. `/robots.txt`). The app's `pagehide` flush writes its in-memory state over anything you seed while it's open.
- **Service worker:** it registers only on `https:` or the hostname `localhost`. `127.0.0.1` won't do.
- **Waiting on long runs:** start them in the background and wait with a monitor or the completion notification, not foreground `sleep`.
- **Seeing results:** files outside the working directory and scratchpad can't be opened by the user. Deliver files from the scratchpad.
