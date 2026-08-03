#!/bin/bash
# Negative-test 1.8.6 — the crawlable seed inside #view, and the link vocabulary.
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

echo "--- 78: the seed is compared against the data"
run_case "the seed lists a title the data does not have" \
  "the crawlable catalogue no longer matches the data" \
  "${P}a='<li>Gotham (2014)</li>';assert a in s
s=s.replace(a,'<li>Gotham City (2014)</li>',1);${W}"

run_case "the catalogue is emptied out of #view" \
  "the crawlable catalogue is gone" \
  "${P}import re;m=re.search(r'<main id=\"view\">[\\s\\S]*?</main>',s);assert m
s=s[:m.start()]+'<main id=\"view\"></main>'+s[m.end():];${W}"

echo "--- 78: the position assertion inverted in 1.8.6"
run_case "the catalogue escapes to above <main>" \
  'sits outside <main id="view">' \
  "${P}import re;m=re.search(r'<main id=\"view\">([\\s\\S]*?)</main>',s);assert m
s=s[:m.start()]+m.group(1)+'\\n<main id=\"view\"></main>'+s[m.end():];${W}"

run_case "the catalogue goes back into <noscript>" \
  "went back into <noscript>" \
  "${P}import re;m=re.search(r'<main id=\"view\">([\\s\\S]*?)</main>',s);assert m
s=s[:m.start()]+'<noscript>'+m.group(1)+'</noscript>\\n<main id=\"view\"></main>'+s[m.end():];${W}"

echo "--- 90: every seed link is a known token"
run_case "a seed link token is renamed" \
  "is not in guard 72's frozen vocabulary" \
  "${P}a='<a href=\"#life\">';assert a in s
s=s.replace(a,'<a href=\"#lifetime\">',1);${W}"

run_case "a seed link leaves the page" \
  "must not hand its readers to another origin" \
  "${P}a='<a href=\"#release\">';assert a in s
s=s.replace(a,'<a href=\"https://example.com/\">',1);${W}"

run_case "the seed links are stripped" \
  "the seed block carries no links at all" \
  "${P}import re;m=re.search(r'<main id=\"view\">[\\s\\S]*?</main>',s);assert m
seed=re.sub(r'<a href=\"[^\"]*\">([^<]*)</a>',r'\\1',m.group(0));assert '<a ' not in seed
s=s[:m.start()]+seed+s[m.end():];${W}"

echo "--- smoke: the first render replaces the seed"
run_case "boot appends instead of replacing" \
  "FAIL the seed catalogue is gone after boot" \
  "${P}a='v.innerHTML = moveBanner()';assert a in s
s=s.replace(a,'v.innerHTML = v.innerHTML + moveBanner()',1);${W}" \
  "smoke"

echo
echo "  negtest186: $PASS passed, $FAILED failed"
[ "$FAILED" -eq 0 ]
