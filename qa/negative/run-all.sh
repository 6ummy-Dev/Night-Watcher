#!/bin/bash
# Runs every negative suite. A guard that cannot fail protects nothing, so each
# fixture breaks one thing on purpose in a throwaway copy of the tree and
# asserts that the suite it belongs to goes red for the right reason.
#
#   bash qa/negative/run-all.sh             # everything
#   bash qa/negative/run-all.sh 176         # one suite
#   NEGJOBS=1 bash qa/negative/run-all.sh   # serial, for debugging
#
# The suites are independent, so they run concurrently — one process per core by
# default. Two things had to be true for that, and only one of them was.
#
# Every suite computes its scratch tree as "$NEGDIR/tree", and this file used to
# export a single NEGDIR for all of them. That was invisible while the loop was
# serial and would have been silent corruption the moment it stopped being:
# eighteen suites unpacking eighteen differently-mutated trees over each other,
# every one of them reading whatever the last had just written, and the failures
# would have looked like flaky guards rather than a broken harness. Each suite
# now gets its own directory under $WORK/scratch.
#
# Output is buffered per suite and printed in file order at the end, so a
# parallel run reads exactly like a serial one. Progress is one line per suite as
# it finishes — short enough to be an atomic write, so the lines cannot interleave.
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

PICK="${1:-}"   # a grep -E pattern: one suite number, or an alternation (CI shards)

JOBS="${NEGJOBS:-}"
if [ -z "$JOBS" ]; then
  if command -v nproc >/dev/null 2>&1; then JOBS="$(nproc)"; else JOBS=2; fi
fi
case "$JOBS" in ''|*[!0-9]*) JOBS=1 ;; esac
[ "$JOBS" -lt 1 ] && JOBS=1

# NAMING, CORRECTED IN 3.9.5 — THE OLD TEXT GOT BOTH OF ITS OWN EXAMPLES WRONG.
# It read: "NNN is the release it was written for with the dots removed and
# trailing zeros kept: negtest390 is 3.9.0, negtest410 is 3.9.2's." negtest390
# says in its own header that it is 3.7.2's, and 3.9.2 with the dots removed is
# 392, not 410 — a rule stated in one sentence and contradicted by the example
# in the next. It arrived in 3.9.2 as part of a stale-prose cleanup and shipped
# stale, which is the failure mode that cleanup was for.
#
# WHAT IS ACTUALLY TRUE. The release encoding held through negtest300 (3.0.0)
# and broke at negtest340, which is 3.4.2's. From 340 on the number is a plain
# +10 counter with no relationship to the version: 340=3.4.2, 350=3.4.5,
# 360=3.5.0, 370=3.6.0, 380=3.6.4, 390=3.7.2, 400=3.8.0, 410=3.9.2, 420=3.9.3,
# 430=3.9.4, 440=3.9.5. The next suite is +10 from the last one, and which
# release it belongs to is written in its header comment — the only place that
# has ever been reliable. negtest131.sh predates all of it and keeps its name so
# its history stays greppable. negtest.sh has no number at all and is the
# original suite.
SUITES=()
for f in "$HERE"/negtest*.sh; do
  if [ -n "$PICK" ] && ! echo "$f" | grep -Eq "$PICK"; then continue; fi
  SUITES+=("$f")
done

if [ "${#SUITES[@]}" -eq 0 ]; then
  echo "  no negative suite matches \"$PICK\""
  exit 1
fi

mkdir -p "$WORK/out" "$WORK/scratch"

run_one () {
  local f="$1"
  local name; name="$(basename "$f")"
  local rc
  NEGDIR="$WORK/scratch/$name" bash "$f" > "$WORK/out/$name.txt" 2>&1
  rc=$?
  printf '%s' "$rc" > "$WORK/out/$name.rc"
  if [ "$rc" -eq 0 ]; then printf '  done  %s\n' "$name"
  else                    printf '  FAIL  %s\n' "$name"; fi
  return "$rc"
}
export -f run_one
export WORK

# 2.2.0, optimization report §5.1: dispatch longest-first. The wall clock of a
# concurrent run is whatever suite finishes last, and a smoke fixture costs ~40×
# a guards fixture — so a heavy suite picked up late by xargs used to run alone
# after everything else had drained. Sorting the dispatch by smoke-fixture count
# (descending; name as tiebreak, so the order is deterministic) starts the heavy
# suites first and packs the cheap ones behind them. The report below still
# prints in file order — only the dispatch moves.
#
# 4.2.3, Q-6 of the 19 Aug audit: THE COUNT WAS `grep -c '"smoke"'` AND THE
# SUITE ARGUMENT DOES NOT HAVE TO BE QUOTED. negtest400 passes `smoke main`
# bare, counted as zero, and its three smoke fixtures started whenever xargs
# got around to them — a correctness bug in a scheduler, which is the one
# place a miscount is not cosmetic. The pattern below matches the suite
# argument where it actually sits — quoted or bare, at the end of the call,
# comments excluded — and agrees with the census guard 65 runs over the same
# files. The guard holds the number; this comment deliberately does not.
DISPATCH="$(for f in "${SUITES[@]}"; do
  printf '%03d %s\n' "$(grep -vE '^[[:space:]]*#' "$f" | grep -cE '[" ]smoke"?( +("[a-z]+"|main|css|blocked|everything))? *$')" "$f"
done | sort -k1,1r -k2,2 | cut -d' ' -f2-)"

echo "  ${#SUITES[@]} suites, $JOBS at a time, longest first"
printf '%s\n' "$DISPATCH" | xargs -P "$JOBS" -I{} bash -c 'run_one "$@"' _ {}

TOTAL=0; BROKE=0
for f in "${SUITES[@]}"; do
  name="$(basename "$f")"
  echo
  echo "=== $name"
  cat "$WORK/out/$name.txt" 2>/dev/null || echo "  (no output — the suite did not run)"
  TOTAL=$((TOTAL+1))
  rc="$(cat "$WORK/out/$name.rc" 2>/dev/null || echo 1)"
  [ "$rc" = "0" ] || BROKE=$((BROKE+1))
done

echo
if [ "$BROKE" -eq 0 ]; then
  echo "  ✓ $TOTAL negative suites passed — every guard still fails when it should"
else
  echo "  ✗ $BROKE of $TOTAL negative suites failed"
fi
[ "$BROKE" -eq 0 ]
