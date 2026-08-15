#!/bin/bash
# Negative-test 2.6.0 — the catalogue as plain text.
#
# docs/orders.txt is generated from PATH, FILMS and tierOf(), the same way the
# crawlable seed and the ItemList are, and for the same reason: a hand-kept copy
# of 200 entries is stale within a release and nobody reads it closely enough to
# notice. So the fixtures below do what a stale copy would do — move a title, a
# year, a rating, a marker, an ordering — and require the build to refuse.
#
# The last three fixtures are the ones that matter longer term. An export
# nothing points at is an export nothing reads, so the pointer in llms.txt is
# guarded like the file itself; and a crawler asset in the offline shell is
# dead weight on every install, which is the rule llms.txt and 404.html already
# live under.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

T="import io;p='docs/orders.txt';s=io.open(p,encoding='utf-8').read();"
TW="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 105: the export tracks the data"

run_case "orders.txt is deleted" \
  "docs/orders.txt is missing" \
  "import os;os.remove('docs/orders.txt')"

run_case "orders.txt is emptied" \
  "no longer matches the catalogue" \
  "import io;io.open('docs/orders.txt','w',encoding='utf-8').write('')"

run_case "a title drifts in the export" \
  "no longer matches the catalogue" \
  "${T}s=s.replace('Pennyworth —','Pennyworth -',1);${TW}"

run_case "a year drifts in the export" \
  "no longer matches the catalogue" \
  "${T}i=s.index('(2019)');s=s[:i]+'(2018)'+s[i+6:];${TW}"

run_case "a content rating is dropped from the export" \
  "no longer matches the catalogue" \
  "${T}s=s.replace(' · TV-MA','',1);${TW}"

run_case "an unreleased title loses its marker" \
  "no longer matches the catalogue" \
  "${T}s=s.replace(' · NOT OUT YET','',1);${TW}"

run_case "two entries swap places inside a continuity" \
  "no longer matches the catalogue" \
  "${T}import re;m=list(re.finditer(r'\n  (\d+)\. ',s));a=m[0].start();b=m[1].start();c=m[2].start() if len(m)>2 else len(s);s=s[:a]+s[b:c]+s[a:b]+s[c:];${TW}"

run_case "the entry count in the export's own header drifts" \
  "no longer matches the catalogue" \
  "${T}s=s.replace('133 films','132 films',1);${TW}"

# 3.9.6 REPOINTED THIS FIXTURE AND THE REASON IS THE FIXTURE'S OWN SUBJECT. It
# used to cut the header's sentence about which ordering the file carried and
# where the other two lived — honest prose about a deliberate gap. 3.9.6 closed
# the gap, the sentence went with it, and this case broke with SETUP BROKE on
# the first full run because its anchor no longer exists.
#
# That is the harness working. A fixture whose anchor is gone is a fixture that
# has stopped testing anything, and the only reason this one announced itself is
# that a missing anchor is an error rather than a pass. It now cuts the header's
# description of the three orderings, which is the same claim in the file's new
# shape: the header tells a reader what is below it, and the byte comparison is
# what keeps that true.
run_case "the header's account of the orderings is cut" \
  "no longer matches the catalogue" \
  "${T}i=s.index('ALL THREE ORDERINGS ARE BELOW');j=s.index('cannot disagree with what the app renders.',i);s=s[:i]+s[j+41:];${TW}"

echo "--- 105: the export stays findable, and stays out of the cache"

run_case "llms.txt stops pointing at the export" \
  "llms.txt does not point at orders.txt" \
  "import io;p='docs/llms.txt';s=io.open(p,encoding='utf-8').read();i=s.index('- The whole catalogue as plain text');j=s.index('\n',i);s=s[:i]+s[j+1:];io.open(p,'w',encoding='utf-8').write(s)"

run_case "the export is precached into the offline shell" \
  "orders.txt is in the offline shell" \
  "import io;p='docs/sw.js';s=io.open(p,encoding='utf-8').read();i=s.index('var SHELL');j=s.index('[',i)+1;s=s[:j]+'\n  \"./orders.txt\",'+s[j:];io.open(p,'w',encoding='utf-8').write(s)"

run_case "the export is served but nothing decides about the cache" \
  "either add it to SHELL or name it" \
  "import io;p='qa/guards.js';s=io.open(p,encoding='utf-8').read();s=s.replace('\"_headers\",\n                     \"orders.txt\"','\"_headers\"',1);io.open(p,'w',encoding='utf-8').write(s)"

rm -rf "$NEG"
finish "2.6.0 negative tests"
