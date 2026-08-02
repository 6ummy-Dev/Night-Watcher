#!/bin/bash
# Negative-test every guard added or changed in 1.6.5.
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

P="import io;p='docs/index.html';s=io.open(p,encoding='utf-8').read();"
N="import io;p='NOTES.md';s=io.open(p,encoding='utf-8').read();"
W="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 65: the restore banner reaches both halves of Home"
run_case "the banner drops off the first-run branch (the 1.6.4 regression)" \
  "a device with no path chosen would see nothing" \
  "${P}a=\"html += pendingBanner()+'<div class=\\\"chooser\\\">'\";assert a in s;s=s.replace(a,\"html += '<div class=\\\"chooser\\\">'\");${W}"

run_case "the banner drops off the main branch" \
  "missing from Home once a path exists" \
  "${P}a='  html += pendingBanner();';assert a in s;s=s.replace(a,'');${W}"

run_case "the banner stops mentioning the carried path" \
  "does not say when a link carries a path" \
  "${P}a='if(!S.path && isPath(p.path)) bits += \" and a path\";';assert a in s;s=s.replace(a,'');${W}"

echo "--- 65: a number in prose is guarded like every other count"
run_case "the header's section count drifts" \
  "guard sections; there are" \
  "${P}import re;m=re.search(r'qa/guards\\.js — (\\d+) sections',s);assert m
s=s[:m.start(1)]+str(int(m.group(1))-10)+s[m.end(1):];${W}"

run_case "NOTES.md's section count drifts" \
  "NOTES.md says" \
  "${N}import re;m=re.search(r'(\\d+) numbered sections',s);assert m
s=s[:m.start(1)]+str(int(m.group(1))-15)+s[m.end(1):];${W}"

echo "--- smoke: a restore link works from a cold start"
run_case "restoring on a fresh device loses the path" \
  "restoring on a fresh device keeps the path the link carried" \
  "${P}a='if(!S.path && isPath(res.path)){ S.path = S.mode = res.path; }';assert a in s;s=s.replace(a,'');${W}" \
  "smoke"

run_case "the link is consumed before it is answered" \
  "a restore link shows its banner on a device with no path" \
  "${P}a='html += pendingBanner()+';assert a in s;s=s.replace(a,'html += ');${W}" \
  "smoke"

rm -rf "$NEG"
echo
echo "1.6.5 negative tests: $PASS passed, $FAILED failed"
[ "$FAILED" -eq 0 ]
