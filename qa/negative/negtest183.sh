#!/bin/bash
# Negative-test 1.8.3 — the sentinel that a user could type, and the README
# counts that keep drifting.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

# The whole bug, restored: the head carries a marker again and the count is
# replaced into it afterwards. This is verbatim what 1.8.2 shipped.
REGRESS="${P}a='''      (anyOpen() ? \"Collapse all\" : \"Expand all\")+'</button></div>';'''
assert a in s
s=s.replace(a,'''      (anyOpen() ? \"Collapse all\" : \"Expand all\")+'</button></div>%%COUNT%%';''',1)
b='''  var html = head + (q
    ? '<p class=\"scopenote\" role=\"status\" aria-live=\"polite\" style=\"margin:-4px 2px 10px\">'+shownTotal+(shownTotal===1?\" match\":\" matches\")+'</p>'
    : \"\") + body;'''
assert b in s
s=s.replace(b,'''  var html = head + body;
  html = html.replace(\"%%COUNT%%\", q
    ? '<p class=\"scopenote\" role=\"status\" aria-live=\"polite\" style=\"margin:-4px 2px 10px\">'+shownTotal+(shownTotal===1?\" match\":\" matches\")+'</p>' : \"\");''',1)
${W}"

echo "--- 79: no marker a user could type"
run_case "the whole sentinel comes back" \
  "index.html carries the marker(s) %%COUNT%%" \
  "$REGRESS"

run_case "and the rendered search box is corrupted by it" \
  "a search for the old count marker leaves the search box intact" \
  "$REGRESS" \
  "smoke"

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
run_case "the markup circumference stops matching the radius" \
  "does not match 2πr" \
  "${P}a='stroke-dasharray=\"119.4\" stroke-dashoffset=\"119.4\"';assert a in s
s=s.replace(a,'stroke-dasharray=\"120\" stroke-dashoffset=\"120\"',1);${W}"

run_case "the script circumference drifts from the markup" \
  "the script draws the ring with" \
  "${P}a='(119.4 * (1 - pct))';assert a in s;s=s.replace(a,'(118.9 * (1 - pct))',1);${W}"

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
