#!/bin/bash
# Negative-test 1.7.5. The first two cases are the mutations that survived the
# independent QA of 1.7.2 with all seventy sections green; everything after
# them covers the four new sections and the retired-slug contract.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

G="import io;p='qa/guards.js';s=io.open(p,encoding='utf-8').read();"
C="import io;p='CHANGELOG.md';s=io.open(p,encoding='utf-8').read();"
R="import io;p='README.md';s=io.open(p,encoding='utf-8').read();"

echo "--- 71: the two tier mutations the 1.7.2 QA got past every guard"
run_case "tierOf never returns Optional (survived the whole harness in 1.7.2)" \
  "in tier" \
  "${P}a='function tierOf(f){ return f.b.indexOf(\"e\") >= 0 ? \"e\" : (f.o ? \"o\" : \"k\"); }'
assert a in s;s=s.replace(a,'function tierOf(f){ return f.b.indexOf(\"e\") >= 0 ? \"e\" : \"k\"; }',1);${W}"

run_case "tierOf calls everything Optional" \
  "the other tiers have collapsed into it" \
  "${P}a='function tierOf(f){ return f.b.indexOf(\"e\") >= 0 ? \"e\" : (f.o ? \"o\" : \"k\"); }'
assert a in s;s=s.replace(a,'function tierOf(f){ return \"o\"; }',1);${W}"

run_case "a tier fixture quietly changes tier in the data" \
  "batwheels-season-1-2022" \
  "${P}a='{i:\"batwheels-season-1-2022\"';assert a in s
i=s.index(a);j=s.index('\n',i);line=s[i:j];assert ',o:1' in line
s=s[:i]+line.replace(',o:1','',1)+s[j:];${W}"

echo "--- 72: the route mutation the 1.7.2 QA got past every guard and every smoke check"
run_case "the #life branch stops matching (survived everything in 1.7.2)" \
  "#life no longer routes" \
  "${P}a='if(tok === \"life\"){ S.tab = \"watch\"; S.mode = \"life\"; revealHero(); }'
assert a in s;s=s.replace(a,'if(false){ S.tab = \"watch\"; S.mode = \"life\"; revealHero(); }',1);${W}"

run_case "the #life branch stops matching, seen from the running app" \
  "#life still routes in a running app" \
  "${P}a='if(tok === \"life\"){ S.tab = \"watch\"; S.mode = \"life\"; revealHero(); }'
assert a in s;s=s.replace(a,'if(false){ S.tab = \"watch\"; S.mode = \"life\"; revealHero(); }',1);${W}" \
  "smoke" "main"

run_case "a scope token stops being understood" \
  "#series no longer routes" \
  "${P}import re
m=re.search(r'((?:else )?if)\\(tok === .series.\\)\\{', s);assert m
s=s[:m.start()]+m.group(1)+'(false){'+s[m.end():];${W}"

run_case "combined tokens stop splitting" \
  "a combined route token stopped splitting" \
  "${P}a='h.slice(1).toLowerCase().split(/[-+]/)';assert a in s
s=s.replace(a,'[h.slice(1).toLowerCase()]',1);${W}"

# NOT TESTED here any more. This widened idHash to push the link past a 2254
# ratchet. 1.7.7 replaced the ratchet with the real 2000 ceiling and made
# ratings positional, so widening a hash no longer reaches it — and the honest
# mutation is to undo the positional encoding, which negtest177.sh does.

echo "--- 74: a history that runs both ways"
run_case "two releases are dated out of order" \
  "the history runs backwards" \
  "${C}import re;m=re.search(r'## \\[1\\.7\\.1\\] \\u2014 (\\d{4}-\\d{2}-\\d{2})',s);assert m
s=s[:m.start(1)]+'2026-09-04'+s[m.end(1):];${W}"

run_case "a version is written down twice" \
  "lists 1.7.0 twice" \
  "${C}a='## [1.6.6] \u2014 2026-08-02';assert a in s;s=s.replace(a,'## [1.7.0] \u2014 2026-08-02',1);${W}"

echo "--- the retired-slug contract"
run_case "an entry is deleted without being retired" \
  "FROZEN ID REMOVED OR RENAMED: batman-1989" \
  "${P}import re;s=re.sub(r'\n \{i:\"batman-1989\"[^\n]*','',s,count=1);${W}"

run_case "a retired slug is put back in the data" \
  "removal is not reversible by re-adding the slug" \
  "${P}a=' {i:\"scooby-doo-meets-batman-2002\"';assert a in s
i=s.index(a);s=s[:i]+' {i:\"scooby-doo-and-krypto-too-2023\",t:\"Krypto\",y:2023,e:0,out:\"none\",d:\"Back again.\",o:1},\n'+s[i:];${W}"

run_case "a retirement is recorded without a reason" \
  "gives no real reason" \
  "import io,json;p='qa/retired-ids.json'
json.dump({'scooby-doo-and-krypto-too-2023':'wrong'},io.open(p,'w'))"

echo "--- 14: the README's era names, which had drifted two releases"
run_case "an era is renamed and the front page is not" \
  "not an era this build ships" \
  "${P}a='name:\"The Grayson years\"';assert a in s;s=s.replace(a,'name:\"The Robin years\"',1);${W}"

run_case "an era is added and the front page does not list it" \
  "omits the era(s)" \
  "${P}a=' {k:0,  name:\"Outside any timeline\"';assert a in s
s=s.replace(a,' {k:12, name:\"A twelfth era\", note:\"Nothing here yet.\"},\n {k:0,  name:\"Outside any timeline\"',1);${W}"

echo "--- 50: what the extracted markWatched() made checkable"
run_case "marking watched stops clearing a skip" \
  "left it skipped as well as watched" \
  "${P}a='S.watched[id] = 1; delete S.skipped[id];';assert a in s;s=s.replace(a,'S.watched[id] = 1;',1);${W}"

echo "--- the scope preference"
run_case "a deep link writes the scope preference again" \
  "a scope token leaves the preference alone" \
  "${P}a='S.scope = \"all\";'
assert s.count(a)==1;s=s.replace(a,'S.scope = S.scopePref = \"all\";',1);${W}" \
  "smoke" "main"

run_case "persist writes the view instead of the preference" \
  "and persisting after it stores the preference, not the view" \
  "${P}a='scope:S.scopePref,';assert a in s;s=s.replace(a,'scope:S.scope,',1);${W}" \
  "smoke" "main"

echo "--- one number per universe"
# 1.8.7 took the number off the Home cards, so the home half of this fixture
# moved to negtest187 (the number coming back) and the real-not-invented half
# moved to The Path, which is the screen that still carries one.
run_case "the path numbers by invention instead of the tag" \
  "FAIL a path number is the universe's real tag" \
  "${P}a='<span class=\"gnum\">'+\"'\"+'+g.tag+'+\"'\";assert a in s
s=s.replace(a,'<span class=\"gnum\">'+\"'\"+'+\"?\"+'+\"'\",1);${W}" \
  "smoke" "main"

echo "--- the search count that offered what it could not show"
run_case "the search-everything count ignores the format filter again" \
  "does not offer to find series the format filter would hide" \
  "${P}a='if(f.tv && (S.format === \"all\" || f.fmt === S.format) && matches(f, q)) hidden++;'
assert a in s;s=s.replace(a,'if(f.tv && matches(f, q)) hidden++;',1);${W}" \
  "smoke" "main"

rm -rf "$NEG"
finish "1.7.5 negative tests"
