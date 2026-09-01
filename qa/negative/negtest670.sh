#!/bin/bash
# negtest670 — 5.1.1, the QA 5.1.0 report closed; 5.1.2 adds the toast's three. One fixture per promise in
# section 158 (every door), the date rule added to 154, the fixtures the
# audit named as missing from 155/156 (2.12), the watchdog's new words, and
# the What's-left refusal. Plus the un-park sequence the audit asked for:
# reboot with a parked skip, un-park the title in the scratch tree, assert
# the skip stays gone.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 158: every door"

run_case "markWatched forgets the gate" \
  "the tap (markWatched)" \
  "${P}a='  if(S.watched[id] || isParkedId(id)) return;\n  S.watched[id] = 1;';assert a in s;s=s.replace(a,'  if(S.watched[id]) return;\n  S.watched[id] = 1;',1);${W}" \
  guards "" 158

run_case "the pasted-code watched loop opens again" \
  "a pasted code or JSON (watched)" \
  "${P}a='if(!res.watched[id] || !BYID[id] || isParkedId(id) || S.watched[id]';assert a in s;s=s.replace(a,'if(!res.watched[id] || !BYID[id] || S.watched[id]',1);${W}" \
  guards "" 158

run_case "the other tab's watched branch opens again" \
  "another tab (watched)" \
  "${P}a='if(!S.watched[k] && !isParkedId(k)){ S.watched[k] = 1;';assert a in s;s=s.replace(a,'if(!S.watched[k]){ S.watched[k] = 1;',1);${W}" \
  guards "" 158

run_case "a seventh door with no gate" \
  "a new door opened without a gate" \
  "${P}a='function toggleWatched(id){';assert a in s;s=s.replace(a,'function tickAll(id){ S.watched[id] = 1; }\nfunction toggleWatched(id){',1);${W}" \
  guards "" 158

run_case "the log takes a night for a parked title" \
  "mergeLog() accepts a log entry for a parked title" \
  "${P}a='BYID[en.id] && !isParkedId(en.id) && validTs(en.ts)';assert a in s;s=s.replace(a,'BYID[en.id] && validTs(en.ts)',1);${W}" \
  guards "" 158

run_case "the drop stops stamping" \
  "dropParkedSkips() stamps no clock" \
  "${P}a='delete S.skipped[k]; stampMark(\"s\", k); n++;';assert a in s;s=s.replace(a,'delete S.skipped[k]; n++;',1);${W}" \
  guards "" 158

run_case "the drop stops persisting" \
  "dropParkedSkips() never persists" \
  "${P}a='  if(n) persist();\n  return n;';assert a in s;s=s.replace(a,'  return n;',1);${W}" \
  guards "" 158

echo "--- 154: one home for a date"

run_case "a blurb repeats the announced date" \
  "carries a date in d: as well as when:" \
  "${P}a='d:\"The end of the saga.\",b:[\"u\"],when:\"Early 2027\"';assert a in s;s=s.replace(a,'d:\"The end of the saga. Early 2027.\",b:[\"u\"],when:\"Early 2027\"',1);${W}" \
  guards "" 154

run_case "a blurb carries a year of its own" \
  "carries a date in d: as well as when:" \
  "${P}a='d:\"The end of the saga.\",b:[\"u\"]';assert a in s;s=s.replace(a,'d:\"The end of the saga, due 2027.\",b:[\"u\"]',1);${W}" \
  guards "" 154

echo "--- 155/156: the arms the audit found unproven"

run_case "Home loses Resume the path" \
  "Home lost Resume the path" \
  "${P}a='<button class=\"go\" data-act=\"resume\">';assert s.count(a)==1;s=s.replace(a,'<button class=\"go\" data-act=\"resumes\">',1);${W}" \
  guards "" 155

run_case "a note line grows a diamond" \
  "a note line carries a diamond" \
  "${P}q=chr(34);a=\"(bag ? '<p class=\"+q+\"hnote\"+q+\">No suggested order\";assert a in s, a;s=s.replace(a,\"(bag ? '<p class=\"+q+\"hnote\"+q+\"><i class=\"+q+\"dsep\"+q+\" aria-hidden=\"+q+\"true\"+q+\">\\\\u25c6</i>No suggested order\",1);${W}" \
  guards "" 155

run_case "heroHead stops taking the position" \
  "no longer takes the route position for the kick" \
  "${P}q=chr(34);a=\"(pos ? ' <i class=\"+q+\"dsep\"+q+\" aria-hidden=\"+q+\"true\"+q+\"></i> <b>'+esc(pos)+'</b>' : '')\";assert a in s, a;s=s.replace(a,\"(pos ? ' <b>'+esc(pos)+'</b>' : '')\",1);${W}" \
  guards "" 155

run_case "the bag line sinks below the controls" \
  "the bag line sits below the controls" \
  "${P}q=chr(34);a=\"    (bag ? '<p class=\"+q+\"hnote\"+q+\">No suggested order \\\\u2014 these stand alone.</p>' : '')+\\n\";assert a in s, a;s=s.replace(a,'',1)
b=\"      '<button class=\"+q+\"no\"+q+\" data-act=\"+q+\"skip\"+q+\" data-id=\"+q+\"'+f.id+'\"+q+\">Skip</button>'+\\n    '</div>'+\\n\";assert b in s, b;s=s.replace(b,b+a,1);${W}" \
  guards "" 155

run_case "up-to-here loses its wording" \
  "lost its arm-then-confirm wording" \
  "${P}a=\"(armed ? 'Tap again to log '+n : 'Watched up to here')\";assert a in s;s=s.replace(a,\"(armed ? 'Confirm '+n : 'Watched up to here')\",1);${W}" \
  guards "" 156

run_case "nights count an entry with no timestamp" \
  "counts a log entry with no usable timestamp" \
  "${P}a='    if(!e || !validTs(e.ts)) return;\n    var ts = Number(e.ts)';assert a in s;s=s.replace(a,'    if(!e) return;\n    var ts = Number(e.ts)',1);${W}" \
  guards "" 156

run_case "nights are grouped by hour" \
  "nightsOf() counted" \
  "${P}a='d.getFullYear() + \"-\" + d.getMonth() + \"-\" + d.getDate()';assert a in s;s=s.replace(a,'d.getFullYear() + \"-\" + d.getMonth() + \"-\" + d.getDate() + \"-\" + d.getHours()',1)
b='if(!/getFullYear\\\\(\\\\) \\\\+ \"-\" \\\\+ d\\\\.getMonth\\\\(\\\\) \\\\+ \"-\" \\\\+ d\\\\.getDate\\\\(\\\\)/.test(no))';q='qa/guards.js';g=io.open(q,encoding='utf-8').read();assert b in g, b;g=g.replace(b,'if(false)',1);io.open(q,'w',encoding='utf-8').write(g);${W}" \
  guards "" 156

run_case "What's left comes back by another name" \
  "What's left is back" \
  "${P}a='function favList(){';assert a in s;s=s.replace(a,'function routeText(){ return \"\"; }\nfunction favList(){',1);${W}" \
  guards "" 156

echo "--- 20: the toast leaves the tree when it fades (5.1.2)"

run_case "the hidden toast fades again" \
  "mid-fade it is a low-contrast element axe can measure" \
  "${P}a='z-index:35;visibility:hidden;transition:transform .25s,visibility 0s .25s;';assert a in s;s=s.replace(a,'z-index:35;opacity:0;visibility:hidden;transition:opacity .25s,transform .25s,visibility 0s .25s;',1);${W}" \
  guards "" 20

run_case "the toast stacks above the tab bar" \
  "stacks above the tab bar" \
  "${P}a='z-index:35;visibility:hidden;';assert a in s;s=s.replace(a,'z-index:60;visibility:hidden;',1);${W}" \
  guards "" 20

run_case "the shown toast slides in invisible" \
  "slide in invisible" \
  "${P}a='.toast.show{visibility:visible;transition-delay:0s;';assert a in s;s=s.replace(a,'.toast.show{',1);${W}" \
  guards "" 20

echo "--- smoke: the drop reaches the disk, every door driven, the watchdog says so"

run_case "the drop forgets to persist" \
  "the drop is persisted, not just forgotten" \
  "${P}a='  if(n) persist();\n  return n;';assert a in s;s=s.replace(a,'  return n;',1);${W}" \
  smoke main

run_case "the drop forgets the clock" \
  "the drop stamps a clock" \
  "${P}a='delete S.skipped[k]; stampMark(\"s\", k); n++;';assert a in s;s=s.replace(a,'delete S.skipped[k]; n++;',1);${W}" \
  smoke main

run_case "a JSON restore ticks a parked title" \
  "door: a JSON restore cannot tick a parked title" \
  "${P}a='if(!res.watched[id] || !BYID[id] || isParkedId(id) || S.watched[id]';assert a in s;s=s.replace(a,'if(!res.watched[id] || !BYID[id] || S.watched[id]',1)
b='function markWatched(id){\n  if(S.watched[id] || isParkedId(id)) return;';assert b in s;s=s.replace(b,'function markWatched(id){\n  if(S.watched[id]) return;',1);${W}" \
  smoke main

run_case "another tab ticks a parked title" \
  "door: another tab cannot tick a parked title" \
  "${P}a='if(!S.watched[k] && !isParkedId(k)){ S.watched[k] = 1;';assert a in s;s=s.replace(a,'if(!S.watched[k]){ S.watched[k] = 1;',1);${W}" \
  smoke main

run_case "the watchdog fires and says so" \
  "watchdog fired at 30 s" \
  "${P}p='qa/smoke.js';s=io.open(p,encoding='utf-8').read();a='var WATCHDOG_S = Math.max(30, parseInt(process.env.SMOKE_WATCHDOG || \"180\", 10) || 180);';assert a in s;s=s.replace(a,'var WATCHDOG_S = 30;',1)
a2='process.on(\"exit\", function(code){';assert a2 in s;s=s.replace(a2,'var __spin = Date.now(); while(Date.now() - __spin < 31000){}\nprocess.on(\"exit\", function(code){',1);${W}" \
  smoke

echo "--- 158, 5.3.0: the doors the two 5.2.4 QAs found"

run_case "an impolite spelling walks past the census" \
  "a new door opened without a gate" \
  "${P}a='function toggleWatched(id){';assert a in s;s=s.replace(a,'function tickAll2(id){ S[\"watched\"][id] = 1; }\nfunction toggleWatched(id){',1);${W}" \
  guards "" 158

run_case "an alias hides a door from the census" \
  "an alias is a door the census cannot see" \
  "${P}a='function toggleWatched(id){';assert a in s;s=s.replace(a,'var WMAP = S.watched;\nfunction toggleWatched(id){',1);${W}" \
  guards "" 158

run_case "the watched sweep stops stamping" \
  "dropParkedWatched() stamps no clock" \
  "${P}a='delete S.watched[k]; stampMark(\"w\", k); n++;';assert a in s;s=s.replace(a,'delete S.watched[k]; n++;',1);${W}" \
  guards "" 158

run_case "the watched sweep stops persisting" \
  "dropParkedWatched() never persists" \
  "${P}a='    S.log = S.log.filter(function(en){ return !isParkedId(en.id); });\n    persist();';assert a in s;s=s.replace(a,'    S.log = S.log.filter(function(en){ return !isParkedId(en.id); });',1);${W}" \
  guards "" 158

run_case "the watched sweep leaves the log" \
  "dropParkedWatched() leaves the log" \
  "${P}a='    S.log = S.log.filter(function(en){ return !isParkedId(en.id); });\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 158

run_case "restore forgets the watched sweep" \
  "restore() no longer runs both sweeps" \
  "${P}a='    dropParkedSkips();\n    dropParkedWatched();';assert a in s;s=s.replace(a,'    dropParkedSkips();',1);${W}" \
  guards "" 158

run_case "the merge sheds its try" \
  "the storage listener no longer merges inside a try" \
  "${P}a='  try{ mergeTab(o); }\n  catch(err){ persist(); render(); }';assert a in s;s=s.replace(a,'  mergeTab(o);',1);${W}" \
  guards "" 158

run_case "the merge stops adopting settings" \
  "the cross-tab merge stopped adopting settings" \
  "${P}a='  var setts = {path:1, theme:1, scope:1, format:1, tier:1};';assert a in s;s=s.replace(a,'  var setts = {path:1};',1);${W}" \
  guards "" 158

run_case "the title sheds the query" \
  "no longer leads with" \
  "${P}a='<title>Batman watch order';assert a in s;s=s.replace(a,'<title>Night Watcher',1);${W}" \
  guards "" 153

run_case "the description sheds the query" \
  "lost its query phrasing" \
  "${P}a='<meta name=\"description\" content=\"Every Batman movie and series in order — ';assert a in s;s=s.replace(a,'<meta name=\"description\" content=\"Every Batman movie and series — ',1);${W}" \
  guards "" 153

run_case "the description doubles its phrasing again" \
  "says the ordering twice" \
  "${P}a='continuities — no spoilers. By universe, by the arc of one life, or by release.\">\n<meta property=\"og:type\"';assert a in s;s=s.replace(a,'continuities — in watch orders, no spoilers. By universe, by the arc of one life, or by release.\">\n<meta property=\"og:type\"',1);${W}" \
  guards "" 153

run_case "an entity smuggles a glyph past the font scan" \
  "carries a numeric character reference" \
  "${P}a='<p class=\"drule\" aria-hidden=\"true\"><i></i></p>';assert a in s;s=s.replace(a,'<p class=\"drule\" aria-hidden=\"true\"><i>&#x2713;</i></p>',1);${W}" \
  guards "" 116

run_case "a merge that stops adopting is seen behaviorally" \
  "another tab's saved theme is adopted, not clobbered" \
  "${P}a='  var setts = {path:1, theme:1, scope:1, format:1, tier:1};';assert a in s;s=s.replace(a,'  var setts = {path:1};',1);${W}" \
  smoke main

run_case "a sweep that never persists is seen behaviorally" \
  "the sweep reaches the disk" \
  "${P}a='    S.log = S.log.filter(function(en){ return !isParkedId(en.id); });\n    persist();';assert a in s;s=s.replace(a,'    S.log = S.log.filter(function(en){ return !isParkedId(en.id); });',1);${W}" \
  smoke main

rm -rf "$NEG"
finish "negtest670 (5.1.1 — every door)"
