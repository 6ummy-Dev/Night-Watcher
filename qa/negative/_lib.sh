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

# THE LEAK, AND ITS SHAPE WAS RECORDED WRONG. The parked item read "eight
# leaking suites" — the eight that end without `rm -rf "$NEG"`. That is a
# symptom and fixing those eight would have left the real one in place.
#
# $NEG is "$dir/tree", so `rm -rf "$NEG"` removes the TREE and leaves the
# temp directory that held it. Every suite leaked, not eight — the other
# twenty-six just leaked an empty directory instead of a full one, which is
# why nobody noticed. run-all.sh was never affected: it sets NEGDIR under its
# own $WORK and traps that on EXIT, so the whole thing goes at once. What
# leaked was the standalone run — one suite at a time, which is how every
# fixture gets written and debugged.
#
# So the fix belongs here rather than in eight files: when this library makes
# the directory, this library cleans it up, on any exit including a failure
# or a Ctrl-C. When run-all.sh supplies one, it still owns it. The `rm -rf
# "$NEG"` lines in the suites are now redundant and are left alone — they
# state intent, they cost nothing, and removing twenty-six of them is churn.
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
# 4.2.3, Q-3 of the 19 Aug audit: the sixth argument names the guards SECTION
# the fixture is aimed at. guards.js prefixes every failure line with "§NN",
# so when sect is given the expected string must sit on that section's own
# line — a mutation that breaks four sections can no longer pass a fixture by
# printing the phrase from the wrong one. Older fixtures that pass no sect
# keep the substring-anywhere semantics they were written against; new
# fixtures should name their section. Pass "" for phase when the suite is
# guards and a sect is wanted.
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
  # 3.7.2 (L-8): the signature of a PRISTINE guards run, captured while the
  # tree is provably unmutated. A fixture whose run exits green may only pass
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
  # 3.7.2: ${NEG_ARGS:-} lets a suite pass flags to the run — the bless
  # fixtures (negtest390) run `guards.js --bless`, which run_case had no way
  # to express. Set NEG_ARGS on its own line above the fixtures so the
  # column-anchored fixture counter in guards.js still sees every case.
  local out sig rc
  out=$(cd "$NEG" && SMOKE_ONLY="$phase" node qa/$suite.js ${NEG_ARGS:-} 2>&1); rc=$?
  sig=$(printf '%s\n' "$out" | grep -vE '^  (ok|·) ')
  if printf '%s' "$sig" | grep -qF "$expect"; then
    # 4.2.3 (Q-3): a fixture that names its section requires the match on that
    # section's own §-prefixed failure line, not anywhere in the dump.
    if [ -n "$sect" ] && ! printf '%s\n' "$sig" | grep -F "$expect" | grep -qF "§$sect "; then
      echo "  FAIL  $label"
      echo "        expected: $expect  (on a §$sect line)"
      echo "        got: the text matched, but not on section $sect's failure line — another section printed it"
      FAILED=$((FAILED+1)); return
    fi
    # 3.7.2 (L-8 of the 10 Aug review): THE EXIT CODE IS FINALLY CONSULTED.
    # A run that exits green fired no guard, so a match there is only honest
    # if it sits on a warning line ("  ! ") — the three warning-only fixtures
    # negtest176 carries — AND, for an unscoped guards run, only if the
    # pristine tree does not print the same text: an expected string a green
    # healthy run also emits means the mutation broke nothing, and reporting
    # that as PASS is the exact vacuity this harness exists to prevent.
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
#
# ADDED 10 AUG 2026, AND THE HOLE IT FILLS COST A BUILD THE SAME DAY. Every
# fixture in this harness asserts that a guard DOES fail. Nothing could assert
# that a guard does NOT — and a guard that fires when it should not is exactly
# as broken as one that never fires, with the extra cost that its failure
# message sends the reader looking for a defect that does not exist. Guard 105
# read sitemap.xml with indexOf and failed on a COMMENT naming the export; the
# fix was one clause, and there was no way to write the test that stops it
# coming back.
#
# It asserts on the EXIT CODE rather than on absent output, deliberately. "The
# expected string is missing" is how run_case works and it cannot express this:
# a run that fails for an unrelated reason has no expected string either, so
# absence proves nothing. A green exit is the claim.
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

# The two-line python prologue nearly every fixture opens with.
P="import io;p='docs/index.html';s=io.open(p,encoding='utf-8').read();"
W="io.open(p,'w',encoding='utf-8').write(s)"

# finish "<summary label>" — prints the tally and returns the suite's verdict.
finish () {
  echo
  echo "$1: $PASS passed, $FAILED failed"
  [ "$FAILED" -eq 0 ]
}
