#!/bin/bash
# Runs every negative suite. A guard that cannot fail protects nothing, so each
# fixture breaks one thing on purpose in a throwaway copy of the tree and
# asserts that the suite it belongs to goes red for the right reason.
#
#   bash qa/negative/run-all.sh          # everything
#   bash qa/negative/run-all.sh 176      # one suite
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export NEGDIR="$WORK"

PICK="${1:-}"
TOTAL=0; BROKE=0
for f in "$HERE"/negtest*.sh; do
  [ "$(basename "$f")" = "run-all.sh" ] && continue
  if [ -n "$PICK" ] && ! echo "$f" | grep -q "$PICK"; then continue; fi
  echo
  echo "=== $(basename "$f")"
  if bash "$f"; then TOTAL=$((TOTAL+1)); else TOTAL=$((TOTAL+1)); BROKE=$((BROKE+1)); fi
done

echo
if [ "$BROKE" -eq 0 ]; then
  echo "  ✓ $TOTAL negative suites passed — every guard still fails when it should"
else
  echo "  ✗ $BROKE of $TOTAL negative suites failed"
fi
[ "$BROKE" -eq 0 ]
