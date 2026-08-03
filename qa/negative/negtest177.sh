#!/bin/bash
# Negative-test 1.7.7 — Home agreeing with the path, and the NW3 code format.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 76: Home and The Path group the same way"
run_case "Home goes back to always drawing the universes" \
  "Home iterates PATH directly" \
  "${P}a='  buildGroups().forEach(function(g){';assert a in s
s=s.replace(a,'  PATH.forEach(function(g, gi){',1);${W}"

run_case "Home stops building its grid from buildGroups()" \
  "no longer builds its grid from buildGroups()" \
  "${P}i=s.index('function viewHome(');j=s.index('function viewNext(')
blk=s[i:j];assert 'buildGroups()' in blk
s=s[:i]+blk.replace('buildGroups()','GROUPS_CACHE')+s[j:];${W}"

run_case "a decade key loses its branch in goToGroup" \
  'has no branch for a "d" key' \
  "${P}a='(jk.charAt(0) === \"d\") ? \"release\" : ';assert a in s;s=s.replace(a,'',1);${W}"

run_case "the grid drops the path's description" \
  "Home's grid carries no description" \
  "${P}a='+esc(pathBlurb(S.mode))+';assert a in s;s=s.replace(a,'+\"\"+',1);${W}"

run_case "a path loses its grid heading" \
  "GRIDNAME has no heading for the release path" \
  "${P}a='release:\"The decades\"';assert a in s;s=s.replace(a,'',1);${W}"

echo "--- 40 and 54: the scoreboard belongs to Progress"
run_case "the scoreboard comes back to Home" \
  "not rendered exactly once" \
  "${P}a=\"  html += '<p class=\\\"qhead big\\\" style=\\\"margin-top:6px\\\">'\";assert a in s
s=s.replace(a,\"  html += '<p class=\\\"qhead\\\">Scoreboard</p>'+scoreboard(c);\\n\"+a,1);${W}"

echo "--- 73: the ceiling is a ceiling"
run_case "a rating goes back to carrying its own hash" \
  "past the 2000 where chat clients" \
  "${P}a='pos.push(String(clampRating(S.rated[f.id])))'
assert s.count(a)==1
s=s.replace('while(pos.length && pos[pos.length - 1] === \"0\") pos.pop();','',1)
s=s.replace('\"R\" + pos.join(\"\")','\"R\" + w.map(function(h,i){return h+pos[i];}).join(\"\")',1);${W}"

echo "--- 8: the format version is declared"
run_case "the format changes without the version moving" \
  "exportCode is not writing NW3" \
  "${P}a='return \"NW3W\"';assert a in s;s=s.replace(a,'return \"NW2W\"',1);${W}"

run_case "an old NW2 code stops restoring its ratings" \
  "the rating segment is read" \
  "${P}a='  if(ver >= 3){';assert a in s;s=s.replace(a,'  if(ver >= 1){',1);${W}"

rm -rf "$NEG"
finish "1.7.7 negative tests"
