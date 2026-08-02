#!/bin/bash
# Negative-test 1.7.6 — the backlog items, including the guard-15 bug the new
# warning exposed on its first run, and the touch-target floor.
set -u
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NEG="${NEGDIR:-$(mktemp -d)}/tree"
PASS=0; FAILED=0

run_case () {
  local label="$1"; local expect="$2"; local pyscript="$3"; local suite="${4:-guards}"
  rm -rf "$NEG"; mkdir -p "$NEG"
  tar -cf - -C "$SRC" --exclude=node_modules . | tar -xf - -C "$NEG"
  ln -s "$SRC/node_modules" "$NEG/node_modules"
  ( cd "$NEG" && python3 -c "$pyscript" ) || { echo "  SETUP BROKE  $label"; FAILED=$((FAILED+1)); return; }
  local out
  out=$(cd "$NEG" && node qa/$suite.js 2>&1)
  if printf '%s' "$out" | grep -qF "$expect"; then
    echo "  PASS  $label"; PASS=$((PASS+1))
  else
    echo "  FAIL  $label"
    echo "        expected: $expect"
    printf '%s\n' "$out" | grep -E '✗|!' | sed 's/^/        got: /' | head -3
    FAILED=$((FAILED+1))
  fi
}

P="import io;p='docs/index.html';s=io.open(p,encoding='utf-8').read();"
W="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 15: silence must not read as success"
run_case "a meta count is reworded out of the sentence" \
  "no longer states a films count" \
  "${P}a='content=\"Every Batman story — 133 films';assert a in s
s=s.replace(a,'content=\"Every Batman story — a lot of films',1);${W}"

run_case "the counted JSON-LD description loses its counts" \
  "JSON-LD description is missing" \
  "${P}a='133 films and 67 seasons of TV across 44 continuities \\\\u2014 in watch orders';assert a in s
s=s.replace(a,'lots of things \\\\u2014 in watch orders',1);${W}"

echo "--- 75: a control is as big as a finger"
run_case "the chips go back under the touch target" \
  ".chip gives a 30px touch target" \
  "${P}a='border-radius:100px;color:var(--dust);min-height:44px;';assert a in s
s=s.replace(a,'border-radius:100px;color:var(--dust);min-height:30px;',1);${W}"

run_case "the tick loses its hit area" \
  ".tick gives a 24px touch target" \
  "${P}a='.tick::before{content:\"\";position:absolute;top:-10px;left:-10px;right:-10px;bottom:-10px;}\n'
assert a in s;s=s.replace(a,'',1);${W}"

run_case "a measured control stops declaring a height" \
  "no declared height for the control(s)" \
  "${P}import re;m=re.search(r'\\.bkbtn\\{[^}]*\\}',s);assert m
s=s[:m.start()]+re.sub(r'min-height:\\d+px;','',m.group(0))+s[m.end():];${W}"

rm -rf "$NEG"
echo
echo "1.7.6 negative tests: $PASS passed, $FAILED failed"
[ "$FAILED" -eq 0 ]
