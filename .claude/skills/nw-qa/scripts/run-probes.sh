#!/usr/bin/env bash
# Night Watcher QA probes, end to end: serve docs/ the way Workers Assets would
# (qa/hdr-server.mjs applies docs/_headers), run every browser probe and the
# worker probe, then stop the server by PID.
#
#   NW_REPO=/path/to/Night-Watcher bash run-probes.sh [port]
#
# The server is stopped with `kill $PID`, never `pkill -f`: a pattern match on
# the command line also matches the shell running it (the 6.5.4 audit killed
# its own shell that way).
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="${NW_REPO:-$PWD}"
PORT="${1:-8123}"
[ -d "$REPO/docs" ] && [ -d "$REPO/node_modules/playwright" ] || {
  echo "run-probes: NW_REPO must point at a Night Watcher checkout with node_modules installed (npm ci)"; exit 2; }

node "$REPO/qa/hdr-server.mjs" "$REPO/docs" "$PORT" >/dev/null 2>&1 &
SRV=$!
trap 'kill "$SRV" 2>/dev/null' EXIT
for _ in $(seq 1 40); do curl -sf -o /dev/null "http://localhost:$PORT/" && break; sleep 0.25; done
curl -sf -o /dev/null "http://localhost:$PORT/" || { echo "run-probes: server did not start on $PORT"; exit 2; }

NW_REPO="$REPO" node "$HERE/probes.mjs" "http://localhost:$PORT" all
NW_REPO="$REPO" node "$HERE/worker-probe.mjs" 2>/dev/null
