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

# run_case <label> <expected-failure-substring> <python-mutation> [suite]
# Unpacks a pristine copy of the tree, applies one mutation, runs qa/<suite>.js
# (guards by default) and requires the exact expected message in its output.
run_case () {
  local label="$1"; local expect="$2"; local pyscript="$3"; local suite="${4:-guards}"
  rm -rf "$NEG"; mkdir -p "$NEG"
  tar -cf - -C "$SRC" --exclude=node_modules --exclude=.git . | tar -xf - -C "$NEG"
  [ -d "$SRC/node_modules" ] && ln -s "$SRC/node_modules" "$NEG/node_modules"
  ( cd "$NEG" && python3 -c "$pyscript" ) || { echo "  SETUP BROKE  $label"; FAILED=$((FAILED+1)); return; }
  local out
  out=$(cd "$NEG" && node qa/$suite.js 2>&1)
  if printf '%s' "$out" | grep -qF "$expect"; then
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
