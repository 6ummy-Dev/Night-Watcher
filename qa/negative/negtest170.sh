#!/bin/bash
# Negative-test what 1.7.0 changed: the era rules, the decade buckets, the
# positional numbering, and every headline count that moved with 30 entries.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

R="import io;p='README.md';s=io.open(p,encoding='utf-8').read();"

echo "--- 5: the serials need decades to live in"
run_case "the forties bucket is removed under an entry that needs it" \
  "falls outside every DECADES bucket" \
  "${P}a=' {k:1940, name:\"The forties\"';assert a in s;i=s.index(a);j=s.index('\n',i+1);s=s[:i]+s[j:];${W}"

echo "--- 51: a continuous arc may age, but not un-age"
run_case "the Nolan trilogy runs backwards through the eras" \
  "cannot un-age" \
  "${P}a='{i:\"the-dark-knight-rises-2012\",t:\"The Dark Knight Rises\",y:2012,e:5';assert a in s;s=s.replace(a,'{i:\"the-dark-knight-rises-2012\",t:\"The Dark Knight Rises\",y:2012,e:1');${W}"

run_case "a film is lifted out of the Dark Knight Saga" \
  "should hold 3 films, found 2" \
  "${P}import re;a=re.search(r',\n \{i:\"the-dark-knight-rises-2012\".*?\}',s,re.S);assert a;s=s[:a.start()]+s[a.end():];${W}"

run_case "the guard is pointed at a group number again" \
  "should hold 3 films, found 0" \
  "${P}a='name:\"The Dark Knight Trilogy\"';assert a in s;s=s.replace(a,'name:\"The Nolan Trilogy\"');${W}"

echo "--- 14/15: the headline counts move with the catalogue"
run_case "an entry is added and the README is not updated" \
  "README claims 133 films, data has 134" \
  "${P}a=' {i:\"batman-1943\"';assert a in s;s=s.replace(a,' {i:\"batman-test-1944\",t:\"Test\",y:1944,e:3,d:\"x\",b:[],o:1},\n {i:\"batman-1943\"',1);${W}"

run_case "a continuity is added and the meta tags are not" \
  "meta description claims 44 continuities, data has 45" \
  "${P}a='{n:\"44\",name:\"The DCU\"';assert a in s;s=s.replace(a,'{n:\"45\",name:\"Test Continuity\",fmt:\"live\",\n note:\"x\",\n films:[\n {i:\"test-entry-1944\",t:\"Test\",y:1944,e:3,lo:99,d:\"x\",b:[],o:1}]},\n\n{n:\"44\",name:\"The DCU\"');${W}"

run_case "the episode floor is left behind by a new series" \
  "the floor is far enough behind to be misleading" \
  "${R}a='1,900+ episodes';assert a in s;s=s.replace(a,'1,700+ episodes');${W}"

echo "--- the inclusion rule is on the page, not in someone's head"
run_case "the README loses the rule for what belongs here" \
  "README no longer describes" \
  "${R}a='## What belongs in the catalogue';assert a in s;s=s.replace(a,'## Notes on scope');${W}"

echo "--- smoke: positional numbering survives an empty bucket"
run_case "the group numbers are assigned before the empty ones are dropped" \
  "numbers its groups 1..n with no gaps" \
  "${P}a='  if(S.mode !== \"continuity\"){\n    var seq = 0;\n    out.forEach(function(g){ if(g.tag !== \"\\\\u2014\") g.tag = String(++seq); });\n  }\n';assert a in s;s=s.replace(a,'');${W}" \
  "smoke" "main"

echo "--- smoke: the catalogue starts where it says it starts"
run_case "the earliest entry moves and the span copy does not" \
  "reaches back to the serials" \
  "${P}a='sub:\"15 chapters\",y:1943';assert a in s;s=s.replace(a,'sub:\"15 chapters\",y:1963');${W}" \
  "smoke" "main"

rm -rf "$NEG"
finish "1.7.0 negative tests"
