#!/bin/bash
# Negative-test 1.8.2 — the card descriptions and the cut-code report.
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
    printf '%s\n' "$out" | grep -E '✗|!' | sed 's/^/        got: /' | head -3
    FAILED=$((FAILED+1))
  fi
}

P="import io;p='docs/index.html';s=io.open(p,encoding='utf-8').read();"
W="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 76: a card says what it is"
run_case "the description comes off the cards" \
  "Home's cards carry no description" \
  "${P}a=\"'<span class=\\\"udesc\\\">'+esc(cardBlurb(g.note))+'</span>'+\";assert a in s
s=s.replace(a,'',1);${W}"

run_case "the description stops coming from the group note" \
  "not one derived from the group note" \
  "${P}a='esc(cardBlurb(g.note))';assert a in s;s=s.replace(a,'esc(g.name)',1);${W}"

run_case "the clamp is removed" \
  "nothing clamps the card description" \
  "${P}import re;s=re.sub(r'-webkit-line-clamp:2;line-clamp:2;','',s,count=1);${W}"

run_case "the description flexes and out-grows its own clamp" \
  "which lets a -webkit-box grow past its own clamp" \
  "${P}a='.udesc{font-size:11.5px;line-height:1.35;color:var(--dust);display:-webkit-box;'
assert a in s;s=s.replace(a,'.udesc{font-size:11.5px;line-height:1.35;color:var(--dust);flex:1;display:-webkit-box;',1);${W}"

run_case "the blurb stops being shortened" \
  "cards stop being cards" \
  "${P}a='  if(t.length > 72)';assert a in s;s=s.replace(a,'  if(false)',1);${W}"

run_case "the bag suffix leaks into a card" \
  "carries the bag suffix" \
  "${P}a='.replace(/\\\\s*\\\\u2014\\\\s*no order between these.*\$/, \"\")';assert a in s
s=s.replace(a,'',1);${W}"

echo "--- 8: a cut code has to say so"
run_case "a truncated code stops being reported" \
  "without the restore saying so" \
  "${P}import re;m=re.search(r'             cut:\\([\\s\\S]*?\\),\\n',s);assert m
s=s[:m.start()]+'             cut:false,\n'+s[m.end():];${W}"

run_case "only the chunk arithmetic is left, and a clean cut slips through" \
  "without the restore saying so" \
  "${P}a='cut:(!((\"S\" in seg) && (\"R\" in seg) && (ver < 3 || (\"O\" in seg))) ||'
assert a in s;s=s.replace(a,'cut:(',1);${W}"

echo "--- smoke: what the rendered card shows"
run_case "the cards render without their descriptions" \
  "every home card carries a description" \
  "${P}a=\"'<span class=\\\"udesc\\\">'+esc(cardBlurb(g.note))+'</span>'+\";assert a in s
s=s.replace(a,'',1);${W}" \
  "smoke"

rm -rf "$NEG"
echo
echo "1.8.2 negative tests: $PASS passed, $FAILED failed"
[ "$FAILED" -eq 0 ]
