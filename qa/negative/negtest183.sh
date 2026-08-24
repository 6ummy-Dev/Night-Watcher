#!/bin/bash
# Negative-test 1.8.3 — the sentinel that a user could type, and the README
# counts that keep drifting.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

# 4.3.1 moved the scopenote's inline margin into its classed rule; the verbatim
# 1.8.2 shape here is re-anchored without it — the marker under test is unchanged.
# The whole bug, restored: the head carries a marker again and the count is
# replaced into it afterwards. This is verbatim what 1.8.2 shipped.
REGRESS="${P}a='''      (ao ? \"Collapse all\" : \"Expand all\")+'</button></div>';'''
assert a in s
s=s.replace(a,'''      (ao ? \"Collapse all\" : \"Expand all\")+'</button></div>%%COUNT%%';''',1)
b='''  var html = head + (q
    ? '<p class=\"scopenote\" role=\"status\" aria-live=\"polite\">'+shownTotal+(shownTotal===1?\" match\":\" matches\")+'</p>'
    : \"\") + body;'''
assert b in s
s=s.replace(b,'''  var html = head + body;
  html = html.replace(\"%%COUNT%%\", q
    ? '<p class=\"scopenote\" role=\"status\" aria-live=\"polite\">'+shownTotal+(shownTotal===1?\" match\":\" matches\")+'</p>' : \"\");''',1)
${W}"

echo "--- 79: no marker a user could type"
run_case "the whole sentinel comes back" \
  "index.html carries the marker(s) %%COUNT%%" \
  "$REGRESS"

run_case "and the rendered search box is corrupted by it" \
  "a search for the old count marker leaves the search box intact" \
  "$REGRESS" \
  "smoke" "main"

run_case "a marker is added under another name" \
  "index.html carries the marker(s) %%TOTAL%%" \
  "${P}a='<div class=\"chips\">';assert a in s;s=s.replace(a,'%%TOTAL%%<div class=\"chips\">',1);${W}"

run_case "a view builder replaces a literal in markup it assembled" \
  "on markup it assembled" \
  "${P}a='  var html = head + (q';assert a in s
s=s.replace(a,'  head = head.replace(\"chips\", \"chips\");\n  var html = head + (q',1);${W}"

run_case "the sweep stops looking at the builders" \
  "no viewWatch() to check" \
  "${P}a='function viewWatch(){';assert a in s;s=s.replace(a,'function viewWatchX(){',1);${W}"

echo "--- 14: the suite counts in the README are counted"
run_case "the README's smoke count drifts" \
  "the README states how many checks this suite runs" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read()
m=re.search(r'(\d+) checks',s);assert m
s=s[:m.start(1)]+str(int(m.group(1))-7)+s[m.end(1):];io.open(p,'w',encoding='utf-8').write(s)" \
  "smoke"

run_case "the README's negative-fixture count drifts" \
  "README.md says" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read()
m=re.search(r'(\d+)\s+fixtures',s);assert m
s=s[:m.start(1)]+str(int(m.group(1))+9)+s[m.end(1):];io.open(p,'w',encoding='utf-8').write(s)"

run_case "the README's suite count drifts" \
  "README.md says" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read()
m=re.search(r'(\d+) negative suites',s);assert m
s=s[:m.start(1)]+str(int(m.group(1))-1)+s[m.end(1):];io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 80: the ring circumference is tied to its radius"
# Re-anchored in 3.0.0. These two were pinned to 125.7, the circumference of the
# r=20 ring, and 3.0.0 took the ring to r=17.5 — so both reported SETUP BROKE,
# which is the harness working exactly as designed: an anchor that no longer
# exists is announced rather than skipped. 109.96 is 2π × 17.5.
run_case "the markup circumference stops matching the radius" \
  "does not match 2πr" \
  "${P}a='stroke-dasharray=\"109.96\" stroke-dashoffset=\"109.96\"';assert a in s
s=s.replace(a,'stroke-dasharray=\"120\" stroke-dashoffset=\"120\"',1);${W}"

run_case "the script circumference drifts from the markup" \
  "the script draws the ring with" \
  "${P}a='var RINGC = 109.96;';assert a in s;s=s.replace(a,'var RINGC = 109.0;',1);${W}"

# 3.0.0 gave section 80 two assertions it did not have, and a new assertion with
# nothing proving it fires is the shape this whole directory exists to prevent.
run_case "the track is left behind at the old radius" \
  "they are one ring and one of the two was changed alone" \
  "${P}a='id=\"ringTrack\" cx=\"23\" cy=\"23\" r=\"17.5\"';assert a in s
s=s.replace(a,'id=\"ringTrack\" cx=\"23\" cy=\"23\" r=\"20\"',1);${W}"

run_case "the track keeps the old stroke while the arc thins" \
  "different stroke widths" \
  "${P}a='id=\"ringTrack\" cx=\"23\" cy=\"23\" r=\"17.5\" fill=\"none\" stroke-width=\"3\"';assert a in s
s=s.replace(a,'id=\"ringTrack\" cx=\"23\" cy=\"23\" r=\"17.5\" fill=\"none\" stroke-width=\"4\"',1);${W}"

run_case "the ring shrinks until 100% will not fit inside it" \
  "a finished run would print its number through the ring" \
  "${P}a='.ring b{';i=s.index(a);j=s.index('font-size:',i)
s=s[:j]+'font-size:15px;'+s[s.index(';',j)+1:];${W}"

echo "--- 81: an era note describes a period, not a story"
run_case "an era note quotes an episode" \
  "a quoted title is an episode" \
  "${P}a='note:\"An old man in a chair, and a kid in a new suit.\"'
assert a in s;s=s.replace(a,'note:\"An old man in a chair, and the \\'Rebirth\\' of the suit.\"',1);${W}"

run_case "an era note names an entry" \
  "names the entry" \
  "${P}a='note:\"Retired, and back out anyway.\"'
assert a in s;s=s.replace(a,'note:\"Retired, and back out anyway. Ends with The Dark Knight Returns.\"',1);${W}"

run_case "an era loses its note entirely" \
  "has no note" \
  "${P}a='note:\"Retired, and back out anyway.\"';assert a in s;s=s.replace(a,'note:\"\"',1);${W}"

echo "--- the scope a deep link asked for"
# The two passes swap, which is 1.8.2's behaviour for #life-series: revealHero()
# runs while the scope is still whatever was persisted.
run_case "the scope pass moves back behind the path pass" \
  "applies its path token before its scope token" \
  "${P}import re
m=re.search(r'(    toks\\.forEach\\(function\\(tok\\)\\{\\n      if\\(tok === \"series\"[\\s\\S]*?\\n    \\}\\);\\n)(    toks\\.forEach\\(function\\(tok\\)\\{\\n      if\\(tok === \"life\"[\\s\\S]*?\\n    \\}\\);\\n)', s)
assert m
s=s[:m.start()]+m.group(2)+m.group(1)+s[m.end():];${W}"

rm -rf "$NEG"
finish "1.8.3 negative tests"
