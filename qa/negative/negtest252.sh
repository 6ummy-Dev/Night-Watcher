#!/bin/bash
# Negative-test 2.5.2 — the progress ring's accessible name, and the two
# straight answers put back.
#
# The ring carried a fixed aria-label for four releases while its visible text
# was a number that moved. Accessibility scored 100/100 the whole time, because
# label-content-name-mismatch sits below the scoring threshold — so nothing in
# the harness and nothing in Lighthouse's score would have said a word. Guard 80
# owns it now, in the same section as the circumference, because the radius, the
# percentage and the name are one object.
#
# The FAQ half is cheaper to break than it looks: the seed and the FAQPage
# schema render from one source, so a hand-edit to either side is a drift the
# build has to refuse.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

X="import io;p='docs/index.html';s=io.open(p,encoding='utf-8').read();"
XW="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 80: the accessible name contains the visible number"
run_case "the name goes back to a fixed verb" \
  "does not contain its visible text" \
  "${X}a='aria-label=\"0% — open progress\"';assert a in s;s=s.replace(a,'aria-label=\"Open progress\"',1);${XW}"

run_case "the name keeps the words but loses the number" \
  "does not contain its visible text" \
  "${X}s=s.replace('aria-label=\"0% — open progress\"','aria-label=\"Progress — open progress\"',1);${XW}"

run_case "the ring renders no starting percentage" \
  "renders no starting percentage" \
  "${X}s=s.replace('<b id=\"ringPct\">0%</b>','<b id=\"ringPct\"></b>',1);${XW}"

run_case "the ring button is no longer a button" \
  "#ringBtn is gone" \
  "${X}s=s.replace('<button class=\"ring\" id=\"ringBtn\"','<div class=\"ring\" id=\"ringBtn\"',1);${XW}"

echo "--- 80: the name keeps moving with the number"
run_case "renderHead stops updating the name" \
  "does not update the ring's accessible name" \
  "${X}import re;s=re.sub(r'\n *document\.getElementById\(\"ringBtn\"\)\.setAttribute\(\"aria-label\".*?\);','',s,count=1,flags=re.S);${XW}"

run_case "the number is computed twice instead of shared" \
  "computes the ring percentage more than once" \
  "${X}a='ringText + \" \\\\u2014 open progress\"';assert a in s;s=s.replace(a,'Math.round(frac*100) + \"% \\\\u2014 open progress\"',1);${XW}"

echo "--- 78 / 100: the two restored answers hold on both sides"
run_case "the privacy answer is cut from the seed" \
  "no longer matches the data" \
  "${X}i=s.index('<h3>Does it track what I watch?</h3>');j=s.index('<h3>',i+10);s=s[:i]+s[j:];${XW}"

run_case "the Joker answer is cut from the seed" \
  "no longer matches the data" \
  "${X}i=s.index('<h3>Where do the Joker films fit?</h3>');j=s.index('</main>',i);s=s[:i]+s[j:];${XW}"

run_case "a restored answer is reworded in the seed only" \
  "no longer matches the data" \
  "${X}i=s.index('<h3>Does it track what I watch?</h3>');a='There is no account and no sign-in';j=s.index(a,i);s=s[:j]+'There is no account'+s[j+len(a):];${XW}"

run_case "the FAQPage drops a question the seed still answers" \
  "FAQPage no longer matches" \
  "${X}import re;s=re.sub(r',\{\"@type\":\"Question\",\"name\":\"Where do the Joker films fit\?\".*?\}\}','',s,count=1);${XW}"

run_case "the FAQPage answer is reworded away from the seed" \
  "FAQPage no longer matches" \
  "${X}i=s.index('\"@type\":\"FAQPage\"');j=s.index('nowhere near the rest',i);s=s[:j]+'somewhere else'+s[j+len('nowhere near the rest'):];${XW}"

rm -rf "$NEG"
finish "2.5.2 negative tests"
