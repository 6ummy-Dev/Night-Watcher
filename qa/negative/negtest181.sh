#!/bin/bash
# Negative-test 1.8.1 — the rename contract, the crawlable block, and the
# noindex an off-canonical origin asks for.
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

echo "--- 2: a rename is a decision, written down"
run_case "a slug is renamed without being recorded" \
  "FROZEN ID REMOVED OR RENAMED: batman-1989" \
  "${P}a='{i:\"batman-1989\"';assert a in s;s=s.replace(a,'{i:\"batman-1989-x\"',1);${W}"

run_case "the old name is added back alongside the new one" \
  "renamed id is back in the data" \
  "${P}a=' {i:\"batman-1989\"';assert a in s
i=s.index(a);s=s[:i]+' {i:\"the-super-powers-team-galactic-guardians-198-1985\",t:\"Ghost\",y:1985,e:0,out:\"none\",d:\"x\",o:1},\n'+s[i:];${W}"

run_case "the rename lands on an id that does not exist" \
  "which is not in the catalogue" \
  "import io,json;p='qa/renamed-ids.json';d=json.load(io.open(p,encoding='utf-8'))
k=list(d)[0];d[k]['to']='a-slug-that-was-never-here-1985'
io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=1))"

run_case "a rename is recorded with no reason" \
  "gives no real reason for renaming" \
  "import io,json;p='qa/renamed-ids.json';d=json.load(io.open(p,encoding='utf-8'))
k=list(d)[0];d[k]['why']='typo'
io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=1))"

echo "--- 78: what a crawler reads"
# 1.8.6 moved the block out of <noscript> and into <main id="view">, and the
# position assertion inverted with it. Same intent, current mechanism — the
# fixtures moved with the guard, because a fixture for a shape that no longer
# exists protects nothing (the 1.7.2 QA's own finding).
run_case "the crawlable block is deleted" \
  "the crawlable catalogue is gone" \
  "${P}import re;m=re.search(r'<main id=\"view\">[\\s\\S]*?</main>',s);assert m
s=s[:m.start()]+'<main id=\"view\"></main>'+s[m.end():];${W}"

run_case "a continuity is renamed and the block is not rebuilt" \
  "no longer matches the data" \
  "${P}a='name:\"Arkhamverse\"';assert a in s;s=s.replace(a,'name:\"The Arkham Games\"',1);${W}"

run_case "the block sinks below the app, outside #view" \
  'sits outside <main id="view">' \
  "${P}import re;m=re.search(r'<main id=\"view\">([\\s\\S]*?)</main>',s);assert m
s=s[:m.start()]+'<main id=\"view\"></main>\\n'+m.group(1)+s[m.end():];${W}"

echo "--- the noindex an old origin asks for"
run_case "the off-canonical origin stops asking not to be indexed" \
  "asks to be indexed" \
  "${P}a='  noix.setAttribute(\"content\", \"noindex, follow\");';assert a in s
s=s.replace(a,'  noix.setAttribute(\"content\", \"index, follow\");',1);${W}"

rm -rf "$NEG"
echo
echo "1.8.1 negative tests: $PASS passed, $FAILED failed"
[ "$FAILED" -eq 0 ]
