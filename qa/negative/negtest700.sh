#!/bin/bash
# negtest700 — 5.4.0, "the day has a name". The 5.3.1 audit's residuals
# closed whole, and the one feature: the Batman Day line. Fixtures for every
# clause this cut added or reshaped — §31's exception census, §67's record
# check, §103's hidden-carrying re-insert and the tree-read inert patch,
# §131's day line, §143's tree-read dirty marks and hidden writes, §145's
# complete map, §146's token, §155's bag notes, §158's two remaining door
# shapes and the dominance rule (and the sweep predicates that replaced its
# pins), §159's allowlist and declaration-level state pins — plus the smoke
# checks that reproduce the audit's R-3 and R-13 and read the day line, and
# the census reader's readable failure. Every fixture names its section; the
# green cases carry --bless because a re-spelling moves the CSP hash.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 158: two more door shapes, and the gate must dominate the write"

run_case "a write through a computed key is opaque, not invisible" \
  "reaches a mark through a computed key" \
  "${P}a='function toggleSkip(id){';assert a in s;s=s.replace(a,'function seep(kind, id){ S[kind][id] = 1; }\n'+a,1);${W}" \
  guards "" 158

run_case "an alias inside a literal is an alias" \
  "alias S.watched, S.skipped or S.rated into another name" \
  "${P}a='function toggleSkip(id){';assert a in s;s=s.replace(a,'function seep(id){ var box = {m:S.rated}; box.m[id] = 5; }\n'+a,1);${W}" \
  guards "" 158

run_case "a returned mark object is an alias" \
  "an alias is a door the census cannot see" \
  "${P}a='function toggleSkip(id){';assert a in s;s=s.replace(a,'function seep(){ return S.skipped; }\n'+a,1);${W}" \
  guards "" 158

run_case "the gate present but not dominating the tap's write" \
  "the gate no longer dominates the write" \
  "${P}a='  if(S.watched[id] || isParkedId(id)) return;\n  S.watched[id] = 1; stampMark(\"w\", id);';assert a in s;s=s.replace(a,'  if(isParkedId(id)) stampMark(\"w\", id);\n  S.watched[id] = 1; stampMark(\"w\", id);',1);${W}" \
  guards "" 158

run_case "the merge's gate as a bare call beside the write" \
  "or in an earlier if(...) return/continue of the same block" \
  "${P}a='      if(!S.watched[k] && !isParkedId(k)){ S.watched[k] = 1; delete S.skipped[k]; moved++; }';assert a in s;s=s.replace(a,'      if(!S.watched[k]){ isParkedId(k); S.watched[k] = 1; delete S.skipped[k]; moved++; }',1);${W}" \
  guards "" 158

run_case "an if on the gate that does not leave the function" \
  "it must sit in the test of the branch that holds the write" \
  "${P}a='  if(!n || isParkedId(id)) return;\n  if(S.rated[id] === n)';assert a in s;s=s.replace(a,'  if(!n) return;\n  if(isParkedId(id)){ toast(id); }\n  if(S.rated[id] === n)',1);${W}" \
  guards "" 158

run_case "the skip sweep deletes nothing (the pin is a shape now)" \
  "a for-in over the mark object that deletes each parked key" \
  "${P}a='for(k in S.skipped){ if(isParkedId(k)){ delete S.skipped[k]; stampMark(\"s\", k); n++; } }';assert a in s;s=s.replace(a,'for(k in S.skipped){ if(isParkedId(k)){ stampMark(\"s\", k); n++; } }',1);${W}" \
  guards "" 158

run_case "the watched sweep leaves the log (read as shape)" \
  "dropParkedWatched() leaves the log" \
  "${P}a='    S.log = S.log.filter(function(en){ return !isParkedId(en.id); });\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 158

NEG_ARGS="--bless"
green_case "a gate in the branch's own test stays green (dominance, not spelling)" \
  "${P}a='  if(!n || isParkedId(id)) return;\n  if(S.rated[id] === n){ delete S.rated[id]; }\n  else { S.rated[id] = n; markWatched(id); }';assert a in s;s=s.replace(a,'  if(!n) return;\n  if(S.rated[id] === n){ delete S.rated[id]; }\n  else if(!isParkedId(id)){ S.rated[id] = n; markWatched(id); }',1);${W}"

green_case "re-spelling the rated sweep's loop stays green (the pin is a shape)" \
  "${P}a='  for(k in S.rated){ if(isParkedId(k)){ delete S.rated[k]; stampMark(\"r\", k); n++; } }\n  if(n) persist();';assert a in s;s=s.replace(a,'  for(k in S.rated){\n    if(isParkedId(k)){ delete S.rated[k]; stampMark(\"r\", k); n++; }\n  }\n  if(n){ persist(); }',1);${W}"
NEG_ARGS=

echo "--- 159: the brand rule is an allowlist; the state pins are declaration maps"

run_case "brand chrome the old blocklist never named is painted" \
  "with forced-color-adjust:none — the palette is the reader's" \
  "${P}a='.gbar i{forced-color-adjust:none;background:CanvasText;}';assert a in s;s=s.replace(a,a+'\n.wordmark span{forced-color-adjust:none;color:#f5c400;}',1);${W}" \
  guards "" 159

run_case "the group bar's fill loses its paint" \
  "the group bar's fill dies under forced colors" \
  "${P}a='.gbar i{forced-color-adjust:none;background:CanvasText;}';assert a in s;s=s.replace(a,'.gbar i{forced-color-adjust:none;}',1);${W}" \
  guards "" 159

run_case "the here-group outline goes" \
  "the here-group's corner marks are gradients" \
  "${P}a='.group.here{outline:2px solid Highlight;outline-offset:2px;}';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 159

run_case "a pressed state loses its text colour" \
  "matches its unpressed twin under forced colors" \
  "${P}a='.film.done .tick{forced-color-adjust:none;background:Highlight;color:HighlightText;border-color:Highlight;}';assert a in s;s=s.replace(a,'.film.done .tick{forced-color-adjust:none;background:Highlight;border-color:Highlight;}',1);${W}" \
  guards "" 159

NEG_ARGS="--bless"
green_case "a state rule's declarations reordered stays green" \
  "${P}a='.gbar i{forced-color-adjust:none;background:CanvasText;}';assert a in s;s=s.replace(a,'.gbar i{background:CanvasText;forced-color-adjust:none;}',1);${W}"

green_case "a state rule's selectors reordered stays green" \
  "${P}a='.segs i.on,.sky .seg.lit .cr .p,.sky .sh i,#beltpeek::after{forced-color-adjust:none;background:Highlight;}';assert a in s;s=s.replace(a,'#beltpeek::after,.sky .sh i,.segs i.on,.sky .seg.lit .cr .p{forced-color-adjust:none;background:Highlight;}',1);${W}"
NEG_ARGS=

echo "--- 131: the day has a name"

run_case "the closing note loses the Batman Day line" \
  "the Batman Day line is gone from the closing note" \
  "${P}a=\"'<p class=\\\"note foot\\\">'+dayLine()+'Availability\";assert a in s;s=s.replace(a,\"'<p class=\\\"note foot\\\">Availability\",1);${W}" \
  guards "" 131

run_case "the day line types its counts" \
  "the Batman Day line types a count" \
  "${P}a=\"'Batman Day, 19 September. Eighty-seven years, '+films+' films, '+tv+' seasons, '+PATH.length+\";assert a in s;s=s.replace(a,\"'Batman Day, 19 September. Eighty-seven years, 137 films, '+tv+' seasons, '+PATH.length+\",1);${W}" \
  guards "" 131

echo "--- 103 / 143: the re-insert carries hidden; the deck contract is read off the tree"

run_case "rowUpdate() re-inserts without the row's hidden" \
  "rowUpdate() re-inserts a row without its hidden" \
  "${P}a='  scratch.innerHTML = filmRow(f, row.hidden);\n  row.parentNode.replaceChild(scratch.firstChild, row);\n  if(hadFocus)';assert a in s;s=s.replace(a,'  scratch.innerHTML = filmRow(f);\n  row.parentNode.replaceChild(scratch.firstChild, row);\n  if(hadFocus)',1);${W}" \
  guards "" 103

run_case "patchRow() re-inserts without the row's hidden" \
  "does not rebuild the row through filmRow(f, row.hidden)" \
  "${P}a='  scratch.innerHTML = filmRow(f, row.hidden);\n  row.parentNode.replaceChild(scratch.firstChild, row);\n  var gm';assert a in s;s=s.replace(a,'  scratch.innerHTML = filmRow(f);\n  row.parentNode.replaceChild(scratch.firstChild, row);\n  var gm',1);${W}" \
  guards "" 103

run_case "a tick from another panel stops patching the inert Path" \
  "no longer patches the inert Path row-level" \
  "${P}a='    render(keep ? {keep:keep} : undefined);';assert a in s;s=s.replace(a,'    render();',1);${W}" \
  guards "" 103

run_case "render() dirties on a quiet render (read off the tree)" \
  "the dirty mark must appear exactly twice" \
  "${P}a='  if(!(o && o.quiet)) NWTABS.forEach(function(t){ if(t !== S.tab && !(o && o.keep && o.keep[t])) nwDirty[t] = true; });';assert a in s;s=s.replace(a,'  NWTABS.forEach(function(t){ if(t !== S.tab && !(o && o.keep && o.keep[t])) nwDirty[t] = true; });',1);${W}" \
  guards "" 143

run_case "searchApply() leaves the emptied groups showing" \
  "no longer hides both the non-matching rows and the groups left empty" \
  "${P}a='    gel.hidden = !shown;';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 143

echo "--- 31 / 145 / 146 / 155 / 67 / 65: the counted exception, the complete map, the token, the bag notes, the record, the reader"

run_case "an exception blurb stops saying he is not in it" \
  "its description no longer says he is not in it" \
  "${P}a='d:\"Diana\\\\u2019s origin, late in the run. No Batman in it.\"';assert a in s;s=s.replace(a,'d:\"Diana\\\\u2019s origin, late in the run.\"',1);${W}" \
  guards "" 31

run_case "README's exception count is typed while the list stands" \
  "entries qualify" \
  "$(pro README.md)a='Eight entries qualify';assert a in s;s=s.replace(a,'Seven entries qualify',1);${W}" \
  guards "" 31

run_case "a function the map does not name" \
  "not named in ARCHITECTURE.md" \
  "${P}a='function toggleSkip(id){';assert a in s;s=s.replace(a,'function unmapped(){ return 1; }\n'+a,1);${W}" \
  guards "" 145

run_case "the dsep goes back to an em size" \
  "the dsep stopped being drawn on the token" \
  "${P}a='.hero .dsep{display:inline-block;width:var(--dia-s);height:var(--dia-s);';assert a in s;s=s.replace(a,'.hero .dsep{display:inline-block;width:.45em;height:.45em;',1);${W}" \
  guards "" 146

run_case "a bag's note drops the suffix" \
  "is a bag and its note does not end" \
  "${P}a='{n:\"20\",name:\"The Columbia Serials\",bag:1,';assert a in s;i=s.index(a);j=s.index('no order between these; start anywhere',i);assert j>0;s=s[:j]+'start anywhere'+s[j+len('no order between these; start anywhere'):];${W}" \
  guards "" 155

run_case "an ordered universe wears the bag suffix" \
  "is ordered and its note ends on the bag suffix" \
  "${P}a='note:\"Todd Phillips\\\\u2019 two films, which are Gotham stories with no Batman in them. Bruce appears as a child, through a gate.\"';assert a in s;s=s.replace(a,'note:\"Todd Phillips\\\\u2019 two films, which are Gotham stories with no Batman in them. Bruce appears as a child, through a gate \\\\u2014 no order between these; start anywhere.\"',1);${W}" \
  guards "" 155

run_case "llms.txt edited after the bless, the sitemap already dated today" \
  "changed since qa/llms-txt.json was blessed" \
  "$(pro docs/llms.txt)s=s+'\n- One more line, unblessed.\n';${W}" \
  guards "" 67

run_case "the census reader is broken" \
  "qa/negative/census.js could not be read" \
  "$(pro qa/negative/census.js)s=s+'\nthrow new Error(\"boom\");\n';${W}" \
  guards "" 65

echo "--- smoke: the audit's reproductions, and the line on the page"

run_case "the disarm timer puts a hidden row back (smoke)" \
  "the disarm re-inserts the row with the hidden the search gave it" \
  "${P}a='  scratch.innerHTML = filmRow(f, row.hidden);\n  row.parentNode.replaceChild(scratch.firstChild, row);\n  if(hadFocus)';assert a in s;s=s.replace(a,'  scratch.innerHTML = filmRow(f);\n  row.parentNode.replaceChild(scratch.firstChild, row);\n  if(hadFocus)',1);${W}" \
  "smoke" "main"

run_case "a refused log leaves a watched title with no night (smoke)" \
  "a watched title whose log entries were all refused still gets a night" \
  "${P}a='    if(Array.isArray(o.log)) mergeLog(o.log);\n    var have3 = {};';assert a in s;s=s.replace(a,'    if(Array.isArray(o.log)){ mergeLog(o.log); persist(); render(); return res; }\n    var have3 = {};',1);${W}" \
  "smoke" "main"

run_case "the closing note opens without the day line (smoke)" \
  "Next up's closing note opens with the Batman Day line" \
  "${P}a=\"'<p class=\\\"note foot\\\">'+dayLine()+'Availability\";assert a in s;s=s.replace(a,\"'<p class=\\\"note foot\\\">Availability\",1);${W}" \
  "smoke" "main"

run_case "the merge stops calling clocksOf() (smoke reads the poisoned stub's count)" \
  "the poisoned clocksOf() was reached by the merge" \
  "${P}a='  var inc = clocksOf(o.clk);';assert a in s;s=s.replace(a,'  var inc = {w:Object.create(null), s:Object.create(null), r:Object.create(null)};',1);${W}" \
  "smoke" "main"

finish "negtest700"
