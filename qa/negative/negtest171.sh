#!/bin/bash
# Negative-test everything 1.7.1 added or changed: the timeline, the widened
# era-direction rule, the bag exemption, and the per-entry format override.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

G="$(pro qa/guards.js)"

echo "--- 68: an era is fully positioned or not positioned at all"
run_case "one entry loses its position" \
  "is half-positioned" \
  "${P}a=',e:6,lo:4';assert a in s;s=s.replace(a,',e:6');${W}"

run_case "two entries in an era share a position" \
  "to two entries" \
  "${P}a=',e:9,lo:2';assert a in s;s=s.replace(a,',e:9,lo:1');${W}"

run_case "a position is skipped, so the highest exceeds the count" \
  "positions run 1..n" \
  "${P}a=',e:9,lo:3';assert a in s;s=s.replace(a,',e:9,lo:4');${W}"

run_case "an era loses every position" \
  "has no life positions at all" \
  "${P}import re;s=re.sub(r'(,e:1,)lo:\d+',r'\1'.replace(',,',','),s);s=s.replace(',e:1,,',',e:1,');${W}"

run_case "an entry outside any timeline is given a life position" \
  "carry a life position" \
  "${P}a='{i:\"superman-red-son-2020\",t:\"Superman: Red Son\",y:2020,e:0,';assert a in s;s=s.replace(a,'{i:\"superman-red-son-2020\",t:\"Superman: Red Son\",y:2020,e:0,lo:1,');${W}"

echo "--- 68: the sort actually uses the position"
run_case "the timeline sort falls back to typing order" \
  "an era renders in life order, blending continuities" \
  "${P}a='((a.lo || 9999) - (b.lo || 9999)) || ';assert a in s;s=s.replace(a,'');${W}" \
  "smoke" "main"

run_case "an era orders by release year again" \
  "Pennyworth precedes Gotham" \
  "${P}a='((a.lo || 9999) - (b.lo || 9999)) || (a.gi - b.gi)';assert a in s;s=s.replace(a,'(a.y - b.y) || (a.gi - b.gi)');${W}" \
  "smoke" "main"

echo "--- 51: every continuity, not one"
run_case "a continuity runs backwards through the eras" \
  "cannot un-age" \
  "${P}a='{i:\"the-batman-season-4-2006\",t:\"The Batman\",sub:\"Season 4\",y:2006,ep:13,k:\"tv\",e:3';assert a in s;s=s.replace(a,'{i:\"the-batman-season-4-2006\",t:\"The Batman\",sub:\"Season 4\",y:2006,ep:13,k:\"tv\",e:2');${W}"

run_case "a bag loses its flag and its lack of an arc becomes a failure" \
  "flag it bag:1 or name it in WEAVES" \
  "${P}a='name:\"Standalone Films\",bag:1';assert a in s;s=s.replace(a,'name:\"Standalone Films\"');${W}"

run_case "a weave is dropped from the exemption list" \
  "runs backwards through the eras" \
  "${G}a='\"Tomorrowverse\": \"Superman and Batman arcs alternating; Long Halloween is year two\",';assert a in s;s=s.replace(a,'');${W}"

run_case "the exemption list names a continuity that no longer exists" \
  "which is not a continuity any more" \
  "${P}a='name:\"Tomorrowverse\"';assert a in s;s=s.replace(a,'name:\"The Tomorrowverse\"');${W}"

echo "--- 51: era 0 is last in a life, not first"
# 1.7.2 made the direction check skip era 0, which is what eraRank() existed to
# get right \u2014 for the placed eras 1..11 the index and the number now run the
# same way, so replacing one with the other is unobservable. What eraRank still
# protects is the ERAS array being reordered, so that is what this mutates now.
run_case "the eras are reordered and a continuity is left running backwards" \
  "runs backwards through the eras" \
  "${P}import re;m=re.search(r' \{k:2,[^\n]*\n',s);assert m;blk=m.group(0);s=s[:m.start()]+s[m.end():];i=s.index(' {k:0,');s=s[:i]+blk+s[i:];${W}"

echo "--- the format override"
run_case "Clayface goes back to inheriting an animated group" \
  "an entry can no longer state its own format" \
  "${P}a='fmt:(f.fmt || g.fmt || \"anim\")';assert a in s;s=s.replace(a,'fmt:(g.fmt || \"anim\")');${W}"

run_case "an entry overrides its group with the group's own value" \
  "entry format override is wrong on" \
  "${P}a='{i:\"batman-1989\",t:\"Batman\",';assert a in s;s=s.replace(a,'{i:\"batman-1989\",t:\"Batman\",fmt:\"live\",');${W}"

run_case "an entry claims a format that does not exist" \
  "entry format override is wrong on" \
  "${P}a='{i:\"clayface-2026\",t:\"Clayface\",fmt:\"live\"';assert a in s;s=s.replace(a,'{i:\"clayface-2026\",t:\"Clayface\",fmt:\"theatrical\"');${W}"

echo "--- the live-action floor"
run_case "the live-action catalogue collapses" \
  "live-action entries dropped to" \
  "${P}import re;s=re.sub(r'fmt:\"live\",\n','',s);s=s.replace('fmt:\"live\",','');${W}"

rm -rf "$NEG"
finish "1.7.1 negative tests"
