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

PICK="${1:-}"

JOBS="${NEGJOBS:-}"
if [ -z "$JOBS" ]; then
  if command -v nproc >/dev/null 2>&1; then JOBS="$(nproc)"; else JOBS=2; fi
fi
case "$JOBS" in ''|*[!0-9]*) JOBS=1 ;; esac
[ "$JOBS" -lt 1 ] && JOBS=1

SUITES=()
for f in "$HERE"/negtest*.sh; do
  [ "$(basename "$f")" = "run-all.sh" ] && continue
  if [ -n "$PICK" ] && ! echo "$f" | grep -q "$PICK"; then continue; fi
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

echo "  ${#SUITES[@]} suites, $JOBS at a time"
printf '%s\n' "${SUITES[@]}" | xargs -P "$JOBS" -I{} bash -c 'run_one "$@"' _ {}

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
