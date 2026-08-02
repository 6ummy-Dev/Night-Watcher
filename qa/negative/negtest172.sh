#!/bin/bash
# Negative-test what 1.7.2 added: the universe ordering, the era-0 reason codes,
# the era-direction fix, and the renamed scheme.
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
G="import io;p='qa/guards.js';s=io.open(p,encoding='utf-8').read();"
W="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 69: the universes run in the order their stories start"
run_case "a late-starting universe is moved to the front" \
  "the universes run in the order their stories start" \
  "${P}import re;m=re.search(r'\n\n\{n:\"\d+\",name:\"The Damian years placeholder\"',s)
i=s.index('{n:\"07\",name:');j=s.index('{n:\"08\",name:')
blk=s[i:j];s=s[:i]+s[j:];k=s.index('{n:\"01\",name:');s=s[:k]+blk+s[k:];${W}"

run_case "a universe that starts before another is filed after it" \
  "starts earlier than" \
  "${P}a='{i:\"pennyworth-complete-series-2019\"';assert a in s;s=s.replace(',e:1,lo:1',',e:6,lo:21',1);${W}"

echo "--- 70: an entry outside the timeline says why"
run_case "an entry is left outside without a reason" \
  "without saying why" \
  "${P}a=',e:0,out:\"who\"';assert a in s;s=s.replace(a,',e:0',1);${W}"

run_case "an entry claims a reason that does not exist" \
  'says out:' \
  "${P}a='out:\"none\"';assert a in s;s=s.replace(a,'out:\"boring\"',1);${W}"

run_case "a placed entry still claims a reason for having none" \
  "still claims a reason" \
  "${P}a='{i:\"batman-1989\",t:\"Batman\",';assert a in s;s=s.replace(a,'{i:\"batman-1989\",t:\"Batman\",out:\"who\",');${W}"

echo "--- 51: era 0 is the absence of a position, not a late one"
run_case "the direction check counts era 0 as a late era again" \
  "runs backwards through the eras" \
  "${G}a='      if(!(f.e || 0)) return;';assert a in s;s=s.replace(a,'');${W}"

echo "--- 68: the timeline still holds after the rebuild"
run_case "an era loses a position" \
  "is half-positioned" \
  "${P}a=',e:11,lo:2';assert a in s;s=s.replace(a,',e:11');${W}"

run_case "the new terminal era is emptied into the old one" \
  "positions run 1..n" \
  "${P}a=',e:11,lo:3';assert a in s;s=s.replace(a,',e:11,lo:4');${W}"

echo "--- the era scheme itself"
# NOT TESTED, deliberately. "An era may say who is in it, never what happens to
# them" is a copy rule in NOTES.md, not a mechanical one \u2014 renaming Rebuilding
# back to "Losing Jason" fails nothing, and a fixture that greps for a note the
# suite always prints would pass forever without checking anything. Writing a
# spoiler-word blocklist would be worse: it would pass for every spoiler nobody
# thought to list. This one is enforced by review.

run_case "the terminal era is deleted under the entries that need it" \
  "era 11 has no entry in ERAS" \
  "${P}import re;s=re.sub(r' \{k:11,[^\n]*\n','',s);${W}"

echo "--- the by-universe chip"
run_case "the chip goes back to counting positions" \
  "an era renders in life order" \
  "${P}a='tag:eraTag(g)';assert a in s;s=s.replace(a,'tag:g.n');${W}" \
  "smoke"

echo "--- the lead card"
run_case "By universe takes the lead back" \
  "the lead is the one life" \
  "${P}a='var PATHS = [[\"life\",\"Bruce\\\\u2019s life\"], [\"continuity\",\"By universe\"]';assert a in s;s=s.replace(a,'var PATHS = [[\"continuity\",\"By universe\"], [\"life\",\"Bruce\\\\u2019s life\"]');${W}" \
  "smoke"

rm -rf "$NEG"
echo
echo "1.7.2 negative tests: $PASS passed, $FAILED failed"
[ "$FAILED" -eq 0 ]
