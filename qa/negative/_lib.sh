#!/bin/bash
# qa/negative/_lib.sh — the one harness every negative suite sources.
#
# Twenty-one suites each carried their own copy of this file's contents, and
# the copies had drifted into three vintages: run_case with and without the
# suite parameter, and a failure-report grep that knew about '✗', then
# '✗|FAIL', then '✗|!|FAIL'. A fixture whose failure printed as a warning
# line was reported as "got: (nothing)" by the two older greps — the report
# was wrong exactly when it was needed. One copy now, with the newest
# superset of everything the vintages learned.
#
# A suite is: a shebang, its header comment, this line —
#
#     . "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
#
# — its run_case fixtures, and finish "<label>" at the end. run-all.sh
# ignores this file (it globs negtest*.sh), and so does the fixture count in
# qa/guards.js (same pattern), so the library cannot be miscounted as a
# suite or a fixture.
set -u
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NEG="${NEGDIR:-$(mktemp -d)}/tree"
PASS=0; FAILED=0

# run_case <label> <expected-failure-substring> <python-mutation> [suite] [phase]
# Applies one mutation to a scratch copy of the tree, runs qa/<suite>.js
# (guards by default) and requires the exact expected message in its output.
# The optional fifth argument scopes a smoke run via SMOKE_ONLY (2.2.0, report
# §5.4): a fixture that trips one check names the phase that check lives in and
# skips the rest of the run. Fixtures whose expected message only exists in a
# full run — the README check-count — pass no phase.
#
# 2.5.0, report §5.3: the tree is unpacked ONCE per suite and healed between
# fixtures instead of re-tarred 290 times. After each fixture, three sweeps
# restore the pristine state: files a mutation created are removed, files it
# deleted come back, files it rewrote are re-copied from the source tree —
# found by mtime against a stamp touched after the previous heal, and by a
# manifest cut at unpack. An incomplete heal cannot be silent: the next
# fixture's mutation asserts its anchors against the healed tree and reports
# SETUP BROKE if they are gone.
ensure_tree () {
  [ -d "$NEG" ] && return
  mkdir -p "$NEG"
  tar -cf - -C "$SRC" --exclude=node_modules --exclude=.git . | tar -xf - -C "$NEG"
  [ -d "$SRC/node_modules" ] && ln -s "$SRC/node_modules" "$NEG/node_modules"
  ( cd "$NEG" && find . -type f -not -path "./node_modules/*" | sort ) > "$NEG.manifest"
  touch "$NEG.stamp"
}

heal_tree () {
  local cur="$NEG.cur"
  ( cd "$NEG" && find . -type f -not -path "./node_modules/*" | sort ) > "$cur"
  # created by the mutation -> remove
  comm -23 "$cur" "$NEG.manifest" | while IFS= read -r rel; do rm -f "$NEG/$rel"; done
  # deleted by the mutation -> bring back
  comm -13 "$cur" "$NEG.manifest" | while IFS= read -r rel; do
    mkdir -p "$NEG/$(dirname "$rel")"; cp "$SRC/$rel" "$NEG/$rel"
  done
  # rewritten by the mutation -> re-copy
  find "$NEG" -type f -newer "$NEG.stamp" -not -path "*/node_modules/*" | while IFS= read -r f; do
    rel="${f#$NEG/}"; cp "$SRC/$rel" "$f"
  done
  touch "$NEG.stamp"
}

run_case () {
  local label="$1"; local expect="$2"; local pyscript="$3"; local suite="${4:-guards}"; local phase="${5:-}"
  ensure_tree
  heal_tree
  ( cd "$NEG" && python3 -c "$pyscript" ) || { echo "  SETUP BROKE  $label"; FAILED=$((FAILED+1)); return; }
  # 3.0.0, and this is the one that mattered most in the release.
  #
  # THE OLD LINE GREPPED THE WHOLE RUN, INCLUDING THE GREEN PART. A passing
  # guards run prints its notes as "  · <note>" and a passing smoke run prints
  # "  ok   <check name>" for every check — so any fixture whose expected string
  # was a check NAME rather than a failure MESSAGE matched the success output
  # and reported PASS while the suite it was aiming at had gone green. 22 of the
  # 392 fixtures were in that state: every expect was extracted and tested
  # against captured pristine output, and 22 of them matched a run in which
  # nothing had been broken at all. A negative fixture that passes against a
  # green tree is worse than no fixture, because it is counted.
  #
  # Filtering the green lines out before matching is the narrowest fix that
  # works. Two others were tried and rejected on evidence: gating on the exit
  # code breaks negtest176's three warning-only fixtures, which are correct as
  # written and expect a green exit; filtering on '✗|FAIL' breaks the two
  # fixtures that expect a harness error rather than a guard failure. This
  # regresses exactly three fixtures, and all three turned out to be hiding real
  # holes in their own mutations rather than in the harness.
  local out sig
  out=$(cd "$NEG" && SMOKE_ONLY="$phase" node qa/$suite.js 2>&1)
  sig=$(printf '%s\n' "$out" | grep -vE '^  (ok|·) ')
  if printf '%s' "$sig" | grep -qF "$expect"; then
    echo "  PASS  $label"; PASS=$((PASS+1))
  else
    echo "  FAIL  $label"
    echo "        expected: $expect"
    printf '%s\n' "$out" | grep -E '✗|!|FAIL' | sed 's/^/        got: /' | head -3
    FAILED=$((FAILED+1))
  fi
}

# The two-line python prologue nearly every fixture opens with.
P="import io;p='docs/index.html';s=io.open(p,encoding='utf-8').read();"
W="io.open(p,'w',encoding='utf-8').write(s)"

# finish "<summary label>" — prints the tally and returns the suite's verdict.
finish () {
  echo
  echo "$1: $PASS passed, $FAILED failed"
  [ "$FAILED" -eq 0 ]
}
