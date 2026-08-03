#!/bin/bash
# Negative-test 1.8.7 — the number left Home and stayed on The Path.
# The JS-source anchors carry both quote kinds, so the fixtures compose them
# with chr() rather than fighting two layers of shell quoting.
set -u
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NEG="${NEGDIR:-$(mktemp -d)}/tree"
PASS=0; FAILED=0

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
    printf '%s\n' "$out" | grep -E '✗|FAIL' | sed 's/^/        got: /' | head -3
    FAILED=$((FAILED+1))
  fi
}

echo "--- the Home cards stay unnumbered"
run_case "the number comes back to the home cards" \
  "FAIL home cards carry no number" \
  "import io
p='docs/index.html';s=io.open(p,encoding='utf-8').read()
q=chr(34);t=chr(39)
a=t+'<span class='+q+'uname'+q+'>'+t+'+esc(g.name)'
assert a in s
b=t+'<span class='+q+'unum'+q+'>'+t+'+esc(g.tag)+'+t+'</span>'+t+'+'+a
s=s.replace(a,b,1)
io.open(p,'w',encoding='utf-8').write(s)" \
  "smoke"

echo "--- The Path keeps its numbers"
run_case "the path's universe numbers go blank" \
  "FAIL the path still numbers every universe" \
  "import io
p='docs/index.html';s=io.open(p,encoding='utf-8').read()
q=chr(34);t=chr(39)
a='gnum'+q+'>'+t+'+g.tag+'+t
assert a in s
b='gnum'+q+'>'+t+'+'+t+t+'+'+t
s=s.replace(a,b,1)
io.open(p,'w',encoding='utf-8').write(s)" \
  "smoke"

echo
echo "  negtest187: $PASS passed, $FAILED failed"
[ "$FAILED" -eq 0 ]
