#!/bin/bash
# Negative-test 2.7.2 — a badge retired four releases late, the era notes
# reaching the surface engines read, and the export becoming findable.
#
# The through-line: all three are things that were true in the data and absent
# from where they mattered. The Mature badge outlived the ratings that replaced
# it because nothing was ever going to fail over redundancy. The era notes were
# written, guarded and rendered, and stopped at the edge of the seed. orders.txt
# shipped in 2.6.0 and was pointed at from exactly one file, which a six-agent
# audit demonstrated by recommending it be built.
#
# Nothing here can be caught by running the app. Redundant badges render fine,
# a thinner seed renders fine, and an unreachable file serves fine.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- the Mature badge does not come back"

run_case "the badge is restored to the map" \
  "which this guard does not know about" \
  "${P}s=s.replace('var BADGE = {e:\"ESSENTIAL\",','var BADGE = {e:\"ESSENTIAL\", m:\"MATURE\",',1);${W}"

run_case "an entry is re-tagged mature" \
  "used in data but absent from BADGE" \
  "${P}i=s.index('b:[\"e\"]');s=s[:i]+'b:[\"e\",\"m\"]'+s[i+len('b:[\"e\"]'):];${W}"

echo "--- the era notes stay in the seed"

run_case "the seed goes back to bare era names" \
  "no longer matches the data" \
  "${P}import re;s=re.sub(r'<li><strong>([^<]*)</strong> \\u2014 [^<]*</li>',r'<li>\\\\1</li>',s);${W}"

run_case "one era note is reworded in the seed only" \
  "no longer matches the data" \
  "${P}a='Gotham before there is anyone to answer it';assert a in s;i=s.index('<main');j=s.index(a,i);s=s[:j]+'Gotham, before Batman'+s[j+len(a):];${W}"

run_case "an era note is dropped from the seed" \
  "no longer matches the data" \
  "${P}import re;i=s.index('<h2>The eras');j=s.index('</ol>',i);blk=s[i:j];blk2=re.sub(r'  <li><strong>The early years.*?</li>\n','',blk,count=1);s=s[:i]+blk2+s[j:];${W}"

run_case "era 0 is seeded as though it were a stage of a life" \
  "no longer matches the data" \
  "${P}i=s.index('</ol>');s=s[:i]+'  <li><strong>Outside a single life</strong> \\u2014 another Bruce, several at once, or none.</li>\n'+s[i:];${W}"

echo "--- the export stays reachable from the page"

run_case "the alternate link is dropped" \
  "index.html does not point at orders.txt" \
  "${P}s=s.replace('<link rel=\"alternate\" type=\"text/plain\" href=\"orders.txt\" title=\"The whole catalogue as plain text\">\n','',1);${W}"

run_case "the alternate link points somewhere else" \
  "index.html does not point at orders.txt" \
  "${P}s=s.replace('href=\"orders.txt\" title=\"The whole catalogue as plain text\"','href=\"llms.txt\" title=\"The whole catalogue as plain text\"',1);${W}"

rm -rf "$NEG"
finish "2.7.2 negative tests"
