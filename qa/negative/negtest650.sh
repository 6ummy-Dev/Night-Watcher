#!/bin/bash
# negtest650 — 5.0.0, "The sitting". One fixture per promise in sections 154,
# 155 and 156, plus the smoke checks that drive the parked shelf, the two
# heroes and the four zero-state features for real. Every fixture names its
# section: a phrase that could be printed by another section proves nothing.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 154: a parked title is on the shelf and off the count"

run_case "a parked entry loses its date" \
  "is not out yet and carries no when:" \
  "${P}a=',b:[\"u\"],when:\"Late 2026\"}';assert s.count(a)==1;s=s.replace(a,',b:[\"u\"]}',1);${W}" \
  guards "" 154

run_case "a released entry is handed a date" \
  "is released and carries when:" \
  "${P}a='r:\"PG-13\",d:\"Frank Miller';assert s.count(a)==1;s=s.replace(a,'when:\"Late 2026\",r:\"PG-13\",d:\"Frank Miller',1);${W}" \
  guards "" 154

run_case "counts() counts the parked ones again" \
  "counts() still counts a parked entry" \
  "${P}a='    if(isParked(f)) return;\n    total++;';assert a in s;s=s.replace(a,'    total++;',1);${W}" \
  guards "" 154

run_case "the hero lands on a parked title" \
  "upNext() lands on a parked entry" \
  "${P}a='for(i=0;i<p.length;i++){ if(!isParked(p[i]) && !isDone(p[i]) && !isSkip(p[i])) return p[i]; }';assert a in s;s=s.replace(a,'for(i=0;i<p.length;i++){ if(!isDone(p[i]) && !isSkip(p[i])) return p[i]; }',1);${W}" \
  guards "" 154

run_case "a skip outranks nothing" \
  "prefers a skipped title over an unskipped one" \
  "${P}a='for(i=0;i<p.length;i++){ if(!isParked(p[i]) && !isDone(p[i]) && !isSkip(p[i])) return p[i]; }\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 154

run_case "up-to-here reaches a skipped title" \
  "behind() offers a parked or watched entry" \
  "${P}a='    if(!isParked(p[i]) && !isDone(p[i]) && !isSkip(p[i])) out.push(p[i]);';assert a in s;s=s.replace(a,'    if(!isSkip(p[i])) out.push(p[i]);',1);${W}" \
  guards "" 154

run_case "restore() keeps the stale skips" \
  "no longer drops the skips a reader placed" \
  "${P}a='    dropParkedSkips();\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 154

run_case "a pasted backup skips a parked title" \
  "applyMarks() lets a pasted backup skip" \
  "${P}a='!BYID[id] || isParkedId(id) || S.watched[id] || S.skipped[id]';assert a in s;s=s.replace(a,'!BYID[id] || S.watched[id] || S.skipped[id]',1);${W}" \
  guards "" 154

run_case "another tab skips a parked title" \
  "cross-tab merge lets another tab skip" \
  "${P}a='if(!S.skipped[k] && !S.watched[k] && !isParkedId(k)){';assert a in s;s=s.replace(a,'if(!S.skipped[k] && !S.watched[k]){',1);${W}" \
  guards "" 154

run_case "a tap can skip a parked title" \
  "a tap can still tick or skip a parked title" \
  "${P}a='function toggleSkip(id){\n  if(isParkedId(id)) return;\n';assert a in s;s=s.replace(a,'function toggleSkip(id){\n',1);${W}" \
  guards "" 154

run_case "the row draws parked like any other" \
  "filmRow() draws a parked entry as an ordinary row" \
  "${P}a='  if(isParked(f)) return parkedRow(f, hid);\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 154

run_case "the parked row grows a tick" \
  "renders a tick, a skip or stars on a title nobody can watch" \
  "${P}a='<span class=\"tick\" aria-hidden=\"true\"></span>';assert s.count(a)==1;s=s.replace(a,'<button class=\"tick\" data-act=\"watched\" data-id=\"\\'+f.id+\\'\"></button>',1);${W}" \
  guards "" 154

run_case "the parked ring goes solid" \
  "the parked ring is a solid ring" \
  "${P}a='.film.parked .tick{border-color:var(--line2);border-style:dashed;}';assert a in s;s=s.replace(a,'.film.parked .tick{border-color:var(--line2);}',1);${W}" \
  guards "" 154

run_case "To watch offers a parked title" \
  "the To watch chip shows parked titles" \
  "${P}a='(isDone(f) || isSkip(f) || isParked(f))) return;';assert a in s;s=s.replace(a,'(isDone(f) || isSkip(f))) return;',1);${W}" \
  guards "" 154

run_case "a group is sized by its shelf again" \
  "sizes a group by its shelf, not by what exists" \
  "${P}a='  return d + \" of \" + g.size + (k ?';assert a in s;s=s.replace(a,'  return d + \" of \" + g.films.length + (k ?',1);${W}" \
  guards "" 154

run_case "a building tops out on a parked title" \
  "fills or crowns a building against its shelf width" \
  "${P}a='var st = sz ? crownState(d, k, sz) : \"\"';assert a in s;s=s.replace(a,'var st = crownState(d, k, n)',1);${W}" \
  guards "" 154

run_case "the card counts a parked title" \
  "drawShareCard() counts a parked title" \
  "${P}a='    if(isParked(f)) return;\n    if(f.tv){ sN++;';assert a in s;s=s.replace(a,'    if(f.tv){ sN++;',1);${W}" \
  guards "" 154

echo "--- 155: the sitting"

run_case "the rule climbs back above the blurb" \
  "the diamond rule sits above the blurb again" \
  "${P}a=\"    '<p class=\\\"blurb\\\">'+esc(f.d)+'</p>'+\n    '<p class=\\\"drule\\\" aria-hidden=\\\"true\\\"><i></i></p>';\";assert a in s, a;s=s.replace(a,\"    '<p class=\\\"drule\\\" aria-hidden=\\\"true\\\"><i></i></p>'+\n    '<p class=\\\"blurb\\\">'+esc(f.d)+'</p>';\",1);${W}" \
  guards "" 155

run_case "Home stops saying where you stand" \
  "Home's kick does not say where the reader stands" \
  "${P}a='               c.done + \" of \" + c.total)+';assert a in s;s=s.replace(a,'               \"\")+',1);${W}" \
  guards "" 155

run_case "Home grows a skip" \
  "Home's hero grew a control or a note line" \
  "${P}a='<button class=\"go\" data-act=\"resume\">';assert s.count(a)==1;s=s.replace(a,'<button class=\"no\" data-act=\"skip\" data-id=\"x\">Skip</button>'+a,1);${W}" \
  guards "" 155

run_case "the bag line is reworded" \
  "the bag line is gone or reworded" \
  "${P}a='No suggested order \\\\u2014 these stand alone.';assert s.count(a)==1;s=s.replace(a,'Start anywhere.',1);${W}" \
  guards "" 155

run_case "the chooser appears on every hero" \
  "offered off a bag" \
  "${P}a=\"(bag ? '<div class=\\\"heroacts two\\\">\";assert a in s;s=s.replace(a,\"(true ? '<div class=\\\"heroacts two\\\">\",1);${W}" \
  guards "" 155

run_case "Then draws a parked row like any other" \
  "Then no longer draws a parked row in place with its date" \
  "${P}a='(pk ? \" parked\" : \"\")';assert a in s;s=s.replace(a,'\"\"',1);${W}" \
  guards "" 155

run_case "the pick is saved" \
  "in SCHEMA" \
  "${P}a='  {k:\"skipped\",      read:marksOf},';assert a in s;s=s.replace(a,a+'\n  {k:\"pick\", read:function(v){ return v; }},',1);${W}" \
  guards "" 155

run_case "the chooser picks the first, not at random" \
  "does not pick at random" \
  "${P}a='S.pick = shelf[Math.floor(Math.random() * shelf.length)].id;';assert a in s;s=s.replace(a,'S.pick = shelf[0].id;',1);${W}" \
  guards "" 155

run_case "a ticked pick stays the hero" \
  "honours a pick that has since been ticked" \
  "${P}a='return !!(pk && pool().indexOf(pk) >= 0 && !isParked(pk) && !isDone(pk) && !isSkip(pk));';assert a in s;s=s.replace(a,'return !!(pk && pool().indexOf(pk) >= 0 && !isParked(pk));',1);${W}" \
  guards "" 155

run_case "the cost of the night goes unprinted" \
  "no longer prints the cost of the night" \
  "${P}a='  else if(!subOf(f)) bits.push(f.b.indexOf(\"s\") >= 0 ? \"Short\" : \"Film\");\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 155

run_case "Next up grows a passed-over line" \
  "grew a passed-over line" \
  "${P}a=\"'<button class=\\\"no\\\" data-act=\\\"skip\\\" data-id=\\\"'+f.id+'\\\">Skip</button>'+\";assert s.count(a)==1;s=s.replace(a,a+\"'<p class=\\\"hnote hnext\\\">Then, when it lands</p>'+\",1);${W}" \
  guards "" 155

run_case "the parked Then row loses its date ink" \
  "5.0.0 rules lost" \
  "${P}a='.qitem.parked .qy{color:var(--steel);}';assert a in s;s=s.replace(a,'.qitem.parked .qy{}',1);${W}" \
  guards "" 155

echo "--- 156: four small things"

run_case "up-to-here writes straight to S.watched" \
  "some way other than markWatched()" \
  "${P}a='    ub.forEach(function(x){ markWatched(x.id); });';assert a in s;s=s.replace(a,'    ub.forEach(function(x){ S.watched[x.id] = 1; });',1);${W}" \
  guards "" 156

run_case "up-to-here never disarms" \
  "does not disarm on its own" \
  "${P}a='      setTimeout(function(){ if(S.upto === id){ S.upto = \"\"; if(S.tab === \"watch\") rowUpdate(id); } }, 4000);\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 156

run_case "four stars make the shelf" \
  "not exactly the five-star titles" \
  "${P}a='clampRating(S.rated[f.id]) === 5';assert a in s;s=s.replace(a,'clampRating(S.rated[f.id]) >= 4',1);${W}" \
  guards "" 156

run_case "nights are grouped by UTC" \
  "does not group by the reader's local calendar day" \
  "${P}a='d.getFullYear() + \"-\" + d.getMonth() + \"-\" + d.getDate()';assert a in s;s=s.replace(a,'d.toISOString().slice(0, 10)',1);${W}" \
  guards "" 156

run_case "the nights line awards a streak" \
  "nights are counted, never awarded" \
  "${P}a=\"' on patrol'+\";assert a in s;s=s.replace(a,\"' on patrol — a streak! '+\",1);${W}" \
  guards "" 156

run_case "five stars unfolds into an open list" \
  "an open list again" \
  "${P}a='  return progFold(\"fav\", \"Your five stars\", fav.length + (fav.length === 1 ? \" title\" : \" titles\"),';assert a in s;s=s.replace(a,'  return progFold(\"favs\", \"Your five stars\", fav.length + (fav.length === 1 ? \" title\" : \" titles\"),',1);${W}" \
  guards "" 156

run_case "a handler loses its seat" \
  "is rendered without a handler, or handled without a seat" \
  "${P}a='data-act=\"copyfav\"';assert s.count(a)==1;s=s.replace(a,'data-act=\"copyfavs\"',1);${W}" \
  guards "" 156

echo "--- smoke: the shelf, the heroes and the four features, driven"

run_case "a parked title is counted after all" \
  "+ Optional counts every released entry" \
  "${P}a='    if(isParked(f)) return;\n    total++;';assert a in s;s=s.replace(a,'    total++;',1);${W}" \
  smoke main

run_case "the hero lands on a parked title (smoke)" \
  "the hero is never a parked title" \
  "${P}a='for(i=0;i<p.length;i++){ if(!isParked(p[i]) && !isDone(p[i]) && !isSkip(p[i])) return p[i]; }';assert a in s;s=s.replace(a,'for(i=0;i<p.length;i++){ if(!isDone(p[i]) && !isSkip(p[i])) return p[i]; }',1);${W}" \
  smoke main

run_case "a stale skip survives the load" \
  "a skip placed on a title that was not out yet is dropped at load" \
  "${P}a='    dropParkedSkips();\n';assert a in s;s=s.replace(a,'',1);${W}" \
  smoke main

run_case "up-to-here logs the skipped too" \
  "Watched up to here leaves a skipped title skipped" \
  "${P}a='    if(!isParked(p[i]) && !isDone(p[i]) && !isSkip(p[i])) out.push(p[i]);';assert a in s;s=s.replace(a,'    if(!isParked(p[i]) && !isDone(p[i])) out.push(p[i]);',1);${W}" \
  smoke main

run_case "the chooser leaves the shelf" \
  "Let Gotham choose stays on the shelf" \
  "${P}a='    if(cg) cg.films.forEach(function(x){';assert a in s;s=s.replace(a,'    if(cg) pool().forEach(function(x){',1);${W}" \
  smoke main

rm -rf "$NEG"
finish "negtest650 (5.0.0 — the sitting)"
