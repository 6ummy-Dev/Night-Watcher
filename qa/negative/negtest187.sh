#!/bin/bash
# Negative-test 1.8.7 — the number left Home and stayed on The Path.
# The JS-source anchors carry both quote kinds, so the fixtures compose them
# with chr() rather than fighting two layers of shell quoting.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

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
  "smoke" "main"

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
  "smoke" "main"

finish "  negtest187"
