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
# default. Each suite gets its own scratch directory under $WORK/scratch: every
# suite computes its tree as "$NEGDIR/tree", and a single shared NEGDIR would be
# N suites unpacking N differently-mutated trees over each other, with failures
# that read as flaky guards rather than a broken harness.
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
# 5.1.1: a smoke run packed beside another suite on a two-core box is a
# smoke run at half speed. Give the watchdog the room, unless the caller
# already chose a number.
export SMOKE_WATCHDOG="${SMOKE_WATCHDOG:-$((180 * (JOBS > 1 ? 2 : 1)))}"

# NAMING. The suite number encoded the release through negtest300 (3.0.0)
# and has been a plain +10 counter since negtest340 (3.4.2), with no
# relationship to the version; a few carry a +1 suffix (475, 476, 478) where
# one release needed more than one suite. Which release a suite belongs to is
# written in its own header comment — the only place that has ever been
# reliable. negtest131.sh predates all of it and keeps its name so its history
# stays greppable; negtest.sh has no number and is the original suite. (The
# rule's own history is in NOTES-history.md.)
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

# Dispatch heaviest-first. The wall clock of a concurrent run is whatever suite
# finishes last, and a smoke fixture costs ~40× a guards fixture — so a heavy
# suite picked up late by xargs used to run alone after everything else had
# drained. The weight is guard 113's (guards fixtures + 40 × smoke fixtures),
# read from the one census every counter shares since 5.3.1
# (qa/negative/census.js) — this file used to sort by its own grep of the
# smoke count, so negtest610 (113 guards fixtures, ≈2.5 min) sorted at 000
# behind every one-smoke suite. Name as tiebreak, so the order is
# deterministic. The report still prints in file order.
DISPATCH="$(node "$HERE/census.js" --weights | while read -r w name; do
  for f in "${SUITES[@]}"; do
    if [ "$(basename "$f")" = "$name" ]; then printf '%05d %s\n' "$w" "$f"; fi
  done
done | sort -k1,1r -k2,2 | cut -d' ' -f2-)"

# 5.4.0: THE PRISTINE SMOKE SIGNATURES, ONCE. Every fixture's expected text
# is held against a pristine run of its own shape (_lib.sh, 5.4.0) — and a
# scoped smoke run costs 20–40 s, so the 34 suites that carry smoke fixtures
# would each capture their own. The wall captures each shape the picked
# suites use once, in parallel, on one unmutated tree, and hands the
# signatures to every suite through NEG_PRISTINE. A standalone suite still
# captures lazily for itself.
SHAPES="$(node "$HERE/census.js" --phases "${SUITES[@]}")"
if [ -n "$SHAPES" ]; then
  echo "  pristine smoke: $SHAPES"
  (
    export NEGDIR="$WORK/pristine"
    . "$HERE/_lib.sh"
    ensure_tree > "$WORK/pristine.txt" 2>&1
    for key in $SHAPES; do
      ( phase="${key#smoke.}"; [ "$phase" = "full" ] && phase=""
        capture_sig "$key" smoke "$phase" "" ) &
    done
    wait
  )
  export NEG_PRISTINE="$WORK/pristine/tree.pristine"
fi

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
