#!/bin/bash
# qa/negative/_lib.sh — the one harness every negative suite sources. One
# copy, because the per-suite copies it replaced had drifted into three
# vintages whose failure reports disagreed exactly when they were needed.
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

# When this library makes the scratch directory, this library cleans it up,
# on any exit including a failure or a Ctrl-C; when run-all.sh supplies one,
# it still owns it. ($NEG is "$dir/tree", so a suite's own `rm -rf "$NEG"`
# removes the tree and leaves the directory that held it — every standalone
# run leaked until the trap moved here. The `rm -rf "$NEG"` lines the suites
# carry are redundant and left alone: they state intent and cost nothing.)
if [ -n "${NEGDIR:-}" ]; then
  NEG="$NEGDIR/tree"
else
  NEGOWN="$(mktemp -d)"
  NEG="$NEGOWN/tree"
  trap 'rm -rf "$NEGOWN"' EXIT
fi
PASS=0; FAILED=0

# run_case <label> <expected-failure-substring> <python-mutation> [suite] [phase] [sect]
#
# The sixth argument names the guards SECTION the fixture is aimed at. guards.js prefixes every failure line with "§NN",
# so when sect is given the expected string must sit on that section's own
# line — a mutation that breaks four sections can no longer pass a fixture by
# printing the phrase from the wrong one. Older fixtures that pass no sect
# keep the substring-anywhere semantics they were written against; new
# fixtures should name their section. Pass "" for phase when the suite is
# guards and a sect is wanted.
# Applies one mutation to a scratch copy of the tree, runs qa/<suite>.js
# (guards by default) and requires the exact expected message in its output.
# The optional fifth argument scopes a smoke run via SMOKE_ONLY: a fixture that trips one check names the phase that check lives in and
# skips the rest of the run. Fixtures whose expected message only exists in a
# full run — the README check-count — pass no phase.
#
# The tree is unpacked ONCE per suite and healed between fixtures instead of
# re-tarred for every fixture. After each fixture, three sweeps
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
  # The git index rides along (4.9.0): section 45 reads the tracked-file set
  # off it, so a scratch tree without one would check only the floor list and
  # negtest610's README-row fixtures would prove nothing. The index alone —
  # no objects, no refs — is enough for a reader that only wants the paths.
  if [ -f "$SRC/.git/index" ]; then mkdir -p "$NEG/.git"; cp "$SRC/.git/index" "$NEG/.git/index"; fi
  ( cd "$NEG" && find . -type f -not -path "./node_modules/*" | sort ) > "$NEG.manifest"
  # The signature of a PRISTINE guards run, captured while the tree is
  # provably unmutated. A fixture whose run exits green may only pass
  # on a warning line the pristine tree does NOT emit — an expected string
  # that a healthy run also prints proves the mutation broke nothing, which
  # is the false-pass run_case used to report as PASS.
  ( cd "$NEG" && node qa/guards.js 2>&1 ) | grep -vE '^  (ok|·) ' > "$NEG.pristine" || true
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
  local label="$1"; local expect="$2"; local pyscript="$3"; local suite="${4:-guards}"; local phase="${5:-}"; local sect="${6:-}"
  ensure_tree
  heal_tree
  ( cd "$NEG" && python3 -c "$pyscript" ) || { echo "  SETUP BROKE  $label"; FAILED=$((FAILED+1)); return; }
  # The green lines ("  · <note>", "  ok   <check>") are filtered out before
  # matching: a fixture whose expected string is a check NAME rather than a
  # failure MESSAGE would otherwise match the success output and report PASS
  # against a tree in which nothing had been broken. Filtering is the
  # narrowest fix — gating on the exit code breaks the warning-only fixtures,
  # and filtering on '✗|FAIL' breaks the fixtures that expect a harness error.
  # ${NEG_ARGS:-} lets a suite pass flags to the run (the bless fixtures run
  # `guards.js --bless`); set it on its own line above the fixtures so the
  # column-anchored fixture counter in guards.js still sees every case.
  local out sig rc
  out=$(cd "$NEG" && SMOKE_ONLY="$phase" node qa/$suite.js ${NEG_ARGS:-} 2>&1); rc=$?
  sig=$(printf '%s\n' "$out" | grep -vE '^  (ok|·) ')
  if printf '%s' "$sig" | grep -qF "$expect"; then
    # A fixture that names its section requires the match on that section's
    # own §-prefixed failure line, not anywhere in the dump.
    if [ -n "$sect" ] && ! printf '%s\n' "$sig" | grep -F "$expect" | grep -qF "§$sect "; then
      echo "  FAIL  $label"
      echo "        expected: $expect  (on a §$sect line)"
      echo "        got: the text matched, but not on section $sect's failure line — another section printed it"
      FAILED=$((FAILED+1)); return
    fi
    # A run that exits green fired no guard, so a match there is only honest
    # if it sits on a warning line ("  ! ") — the warning-only fixtures — AND,
    # for an unscoped guards run, only if the pristine tree does not print the
    # same text: an expected string a green healthy run also emits means the
    # mutation broke nothing, and reporting that as PASS is the exact vacuity
    # this harness exists to prevent.
    if [ "$rc" -eq 0 ]; then
      if ! printf '%s\n' "$sig" | grep -F "$expect" | grep -qE '^  ! '; then
        echo "  FAIL  $label"
        echo "        expected: $expect"
        echo "        got: the text matched, but the run exited GREEN and the match is not a warning — the mutation broke nothing this suite can see"
        FAILED=$((FAILED+1)); return
      fi
      if [ "$suite" = "guards" ] && [ -z "$phase" ] && [ -z "${NEG_ARGS:-}" ] &&
         [ -f "$NEG.pristine" ] && grep -qF "$expect" "$NEG.pristine"; then
        echo "  FAIL  $label"
        echo "        expected: $expect"
        echo "        got: a pristine run prints the same text — the expected string is not caused by the mutation"
        FAILED=$((FAILED+1)); return
      fi
    fi
    echo "  PASS  $label"; PASS=$((PASS+1))
  else
    echo "  FAIL  $label"
    echo "        expected: $expect"
    printf '%s\n' "$out" | grep -E '✗|!|FAIL' | sed 's/^/        got: /' | head -3
    FAILED=$((FAILED+1))
  fi
}

# green_case "<label>" "<python mutation>" [suite] — THE INVERSE OF run_case.
# A guard that fires when it should not is exactly as broken as one that never
# fires, with the extra cost that its message sends the reader after a defect
# that does not exist. It asserts on the EXIT CODE rather than on absent
# output, deliberately: a run that fails for an unrelated reason has no
# expected string either, so absence proves nothing. A green exit is the claim.
green_case () {
  local label="$1"; local pyscript="$2"; local suite="${3:-guards}"
  ensure_tree
  heal_tree
  ( cd "$NEG" && python3 -c "$pyscript" ) || { echo "  SETUP BROKE  $label"; FAILED=$((FAILED+1)); return; }
  local out
  if out=$(cd "$NEG" && node qa/$suite.js ${NEG_ARGS:-} 2>&1); then
    echo "  PASS  $label"; PASS=$((PASS+1))
  else
    echo "  FAIL  $label"
    echo "        expected: the tree to stay GREEN after this mutation"
    printf '%s\n' "$out" | grep -E '✗' | sed 's/^/        got: /' | head -3
    FAILED=$((FAILED+1))
  fi
}

# The two-line python prologue nearly every fixture opens with, and pro(),
# the same prologue for any other file (4.9.0 — nine suites redefined it for
# guards.js by hand, two more for index.html under other names). W closes
# either: it writes back to whichever path the prologue opened.
P="import io;p='docs/index.html';s=io.open(p,encoding='utf-8').read();"
W="io.open(p,'w',encoding='utf-8').write(s)"
pro () { printf "import io;p='%s';s=io.open(p,encoding='utf-8').read();" "$1"; }

# finish "<summary label>" — prints the tally and returns the suite's verdict.
finish () {
  echo
  echo "$1: $PASS passed, $FAILED failed"
  [ "$FAILED" -eq 0 ]
}
