# Report template and conventions

Use this structure. The 6.5.4 baseline (`baseline-6.5.4.md`) is a worked example of every section.

```markdown
# Night Watcher — Engineering QA Report (<version>)

| | |
|---|---|
| **Repository** | `6ummy-Dev/Night-Watcher` |
| **Commit under test** | `<sha>`, release **<version>** (BUILD / sw.js VERSION / CHANGELOG agree? say so) |
| **Baseline** | <baseline version> at `<baseline sha>`, <date> |
| **Date** | <YYYY-MM-DD> |
| **Scope / Method** | <one line each> |
| **Repository changes** | None. Nothing committed or pushed; tools and harnesses lived outside the repo |

## 1. Executive summary
**Verdict:** <one or two sentences, including the suite totals.>
<Two or three sentences on the biggest risks.>

| Severity | Count | vs baseline |
|---|---|---|
| Critical | n | ±n |
| High | n | ±n |
| Medium | n | ±n |
| Low | n | ±n |
| Info | n | ±n |

### Top actions (in order)
1. ...

## 2. Baseline status
| ID | Baseline finding | Status | Evidence |
|---|---|---|---|
| M1 | ... | Fixed / Still present / Changed / N/A | VERDICT line, file:line, run ID |

## 3. What was run, and the results
| Suite / check | Result | Notes |

## 4. Findings
### <ID> — <Severity> · <Area> — <one-line title>
**Location:** `file:line` (approximate line numbers are fine; say ≈)
**Evidence / repro:** <command and output, a table of observed values, or a run link>
**Impact:** <who is hurt, how, and how likely>
**Recommendation:** <a concrete fix, plus the test that should hold it>

## 5. Verified safe
<probes that found nothing, and why that is meaningful>

## 6. Limits of this run
<what wasn't run and why: network, engines, manual-only checks>

## Appendix: reproduction snippets / environment
```

## Severity scale
- **Critical:** data loss or a security breach is likely in normal use.
- **High:** user-facing breakage on a main path, or a security issue with a plausible attacker.
- **Medium:** a real defect on an edge path, or a process gap with real exposure (red work can reach `main` or production).
- **Low:** minor defects, hardening, developer friction, reproducibility.
- **Info:** observations, nits, maintainability notes.

Calibrate on likelihood **and** impact, and say which drives the rating ("Medium: low likelihood, permanent impact").

## IDs
Keep the baseline's ID for a carried-over finding even if its severity changes (note the change). New findings take the next free number in their severity band (e.g. after M4 comes M5). A fixed finding moves to the Baseline status table only.

## Static analysis (ESLint flat config used in 6.5.4)
```js
import globals from "globals";
const rules = { "no-undef": "error", "no-unused-vars": ["warn", {args: "none", caughtErrors: "none", vars: "local"}],
  "no-redeclare": "error", "no-dupe-keys": "error", "no-unreachable": "error", "no-self-assign": "error",
  "no-cond-assign": ["error", "except-parens"], "eqeqeq": ["warn", "smart"], "no-fallthrough": "error",
  "use-isnan": "error", "valid-typeof": "error", "no-loss-of-precision": "error", "no-constant-condition": "warn",
  "no-dupe-else-if": "error", "no-sparse-arrays": "error", "no-unsafe-finally": "error" };
export default [
  { files: ["**/app-script.js"], languageOptions: { sourceType: "script", ecmaVersion: 2022, globals: { ...globals.browser } }, rules },
  { files: ["**/docs/sw.js"], languageOptions: { sourceType: "script", globals: { ...globals.serviceworker } }, rules },
  { files: ["**/docs/nocturne/*.js"], languageOptions: { sourceType: "script", globals: { ...globals.browser } }, rules },
  { files: ["**/worker.js"], languageOptions: { sourceType: "module", globals: { ...globals.serviceworker } }, rules },
  { files: ["**/qa/**/*.js", "**/qa/**/*.mjs"], languageOptions: { sourceType: "commonjs", ecmaVersion: 2024, globals: { ...globals.node } }, rules },
  { files: ["**/qa/**/*.mjs"], languageOptions: { sourceType: "module" } },
];
```
The 6.5.4 baseline for shipped code was **zero findings**. Treat any new hit there as a regression worth reading.

html-validate: extend `html-validate:recommended` with `no-inline-style`, `long-title`, `no-trailing-whitespace`, `attribute-boolean-style`, `void-style`, `attribute-empty-style`, `no-raw-characters` and `require-sri` turned off. The baseline was a 72-character title and implicit button types only.
