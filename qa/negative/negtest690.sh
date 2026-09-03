#!/bin/bash
# negtest690 — 5.3.1, "the two 5.3.0 QAs, whole". The storage layer first:
# the rating was the mark 5.3.0 did not gate (it survived every seat, named a
# 2028 film under Your five stars and rode the backup code), the §158 census
# read spelling (two planted door shapes walked past it with the note still
# printing "each gated"), the cross-tab adopt left S.mode behind, validTs()
# admitted the epoch, and the backup nudge counted a skip as two changes.
# Then the harness's own certificates (§127, §138, §140, §67, §120, the three
# smoke assertions that could not fail) and the deck. Every fixture names its
# section; the green cases carry --bless because the predicate they prove
# survives a re-spelling that moves the CSP hash.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 158: the rating is a mark, and the census reads shape"

run_case "the tap's rating seat sheds its gate" \
  "marked through the tap (rate)" \
  "${P}a='if(!n || isParkedId(id)) return;';assert a in s;s=s.replace(a,'if(!n) return;',1);${W}" \
  guards "" 158

run_case "a pasted rating on a parked title is admitted" \
  "marked through a pasted code or JSON (rated)" \
  "${P}a='if(!rv || !BYID[id] || isParkedId(id) || S.rated[id] === rv';assert a in s;s=s.replace(a,'if(!rv || !BYID[id] || S.rated[id] === rv',1);${W}" \
  guards "" 158

run_case "another tab's rating on a parked title is adopted" \
  "marked through another tab (rated)" \
  "${P}a='if(rv && !isParkedId(k)){ if(S.rated[k] !== rv)';assert a in s;s=s.replace(a,'if(rv){ if(S.rated[k] !== rv)',1);${W}" \
  guards "" 158

run_case "restore forgets the rated sweep" \
  "dropParkedRated() is not called" \
  "${P}a='    dropParkedWatched();\n    dropParkedRated();';assert a in s;s=s.replace(a,'    dropParkedWatched();',1);${W}" \
  guards "" 158

run_case "the rated sweep stops stamping" \
  "dropParkedRated() stamps no clock" \
  "${P}a='delete S.rated[k]; stampMark(\"r\", k); n++;';assert a in s;s=s.replace(a,'delete S.rated[k]; n++;',1);${W}" \
  guards "" 158

run_case "the rated sweep stops persisting" \
  "dropParkedRated() never persists" \
  "${P}a='  for(k in S.rated){ if(isParkedId(k)){ delete S.rated[k]; stampMark(\"r\", k); n++; } }\n  if(n) persist();';assert a in s;s=s.replace(a,'  for(k in S.rated){ if(isParkedId(k)){ delete S.rated[k]; stampMark(\"r\", k); n++; } }',1);${W}" \
  guards "" 158

run_case "Your five stars lists a parked title" \
  "favList() lists a parked title" \
  "${P}a='return !isParked(f) && clampRating(S.rated[f.id]) === 5;';assert a in s;s=s.replace(a,'return clampRating(S.rated[f.id]) === 5;',1);${W}" \
  guards "" 158

run_case "Object.assign opens a door the spelling census could not see" \
  "a door the census cannot see through" \
  "${P}a='function toggleWatched(id){';assert a in s;s=s.replace(a,'function adoptAll(m){ Object.assign(S.watched, m); }\nfunction toggleWatched(id){',1);${W}" \
  guards "" 158

run_case "a loose spelling opens a door the spelling census could not see" \
  "is not a listed door" \
  "${P}a='function toggleWatched(id){';assert a in s;s=s.replace(a,'function markLoose(id){ S.watched[id] = S.watched[id] || 1; }\nfunction toggleWatched(id){',1);${W}" \
  guards "" 158

run_case "a wholesale write is a door" \
  "a wholesale write is a door with no gate" \
  "${P}a='function toggleWatched(id){';assert a in s;s=s.replace(a,'function wholesale(o){ S.watched = o.watched; }\nfunction toggleWatched(id){',1);${W}" \
  guards "" 158

run_case "a mark row joins the settings side" \
  "the settings side of SCHEMA is {format,groupOpen,insOff,path,progOpen,rated,scope,theme,tier}" \
  "${P}a='  {k:\"rated\",        read:ratingsOf},';assert a in s;s=s.replace(a,'  {k:\"rated\",   s:1, read:ratingsOf},',1);${W}" \
  guards "" 158

NEG_ARGS="--bless"
green_case "re-spelling restore's sweep calls stays green (the pin is a predicate)" \
  "${P}a='    dropParkedSkips();\n    dropParkedWatched();\n    dropParkedRated();';assert a in s;s=s.replace(a,'    dropParkedSkips(); dropParkedWatched();\n    dropParkedRated();',1);${W}"

green_case "re-spelling the listener's try stays green (the pin is a predicate)" \
  "${P}a='  try{ if(e.key === SKEY) adoptSettings(o); else mergeTab(o); }\n  catch(err){ persist(); render(); }';assert a in s;s=s.replace(a,'  try {\n    if (e.key === SKEY) { adoptSettings(o); } else { mergeTab(o); }\n  } catch (err) { persist(); render(); }',1);${W}"
NEG_ARGS=

echo "--- 127, 142: the epoch is not a night, the nudge counts titles"

run_case "validTs admits the epoch again" \
  "validTs(0) is true" \
  "${P}a='&& isFinite(v) && Number(v) > 0;';assert a in s;s=s.replace(a,'&& isFinite(v);',1);${W}" \
  guards "" 127

run_case "the backup nudge counts clocks again" \
  "the backup nudge counts clock entries" \
  "${P}a='if(HAS.call(m, k) && m[k] > ts && !ids[k]){ ids[k] = 1; n++; }';assert a in s;s=s.replace(a,'if(HAS.call(m, k) && m[k] > ts){ ids[k] = 1; n++; }',1);${W}" \
  guards "" 142

echo "--- the storage claims, seen behaviorally"

run_case "a rating on a parked title survives the reboot" \
  "a stale parked rating is swept at boot" \
  "${P}a='for(k in S.rated){ if(isParkedId(k)){ delete S.rated[k]; stampMark(\"r\", k); n++; } }';assert a in s;s=s.replace(a,'for(k in S.rated){ if(isParkedId(k)){ stampMark(\"r\", k); n++; } }',1);${W}" \
  smoke main

run_case "a rated sweep that never persists is seen behaviorally" \
  "the rated sweep reaches the disk" \
  "${P}a='  for(k in S.rated){ if(isParkedId(k)){ delete S.rated[k]; stampMark(\"r\", k); n++; } }\n  if(n) persist();';assert a in s;s=s.replace(a,'  for(k in S.rated){ if(isParkedId(k)){ delete S.rated[k]; stampMark(\"r\", k); n++; } }',1);${W}" \
  smoke main

run_case "the adopted path leaves the mode behind" \
  "changed path is adopted and the mode follows it" \
  "${P}a='put:function(v){ S.path = S.mode = v; }},';assert a in s;s=s.replace(a,'put:function(v){ S.path = v; }},',1);${W}" \
  smoke main

run_case "a throw mid-merge escapes the listener" \
  "a throw mid-merge does not escape the listener" \
  "${P}a='  try{ if(e.key === SKEY) adoptSettings(o); else mergeTab(o); }\n  catch(err){ persist(); render(); }';assert a in s;s=s.replace(a,'  if(e.key === SKEY) adoptSettings(o); else mergeTab(o);',1);${W}" \
  smoke main

run_case "a log entry at the epoch is counted as a night" \
  "at or before the epoch is refused" \
  "${P}a='&& isFinite(v) && Number(v) > 0;';assert a in s;s=s.replace(a,'&& isFinite(v);',1);${W}" \
  smoke main

echo "--- 33, 46, 48: the sections the old coverage map credited on a shared phrase"

run_case "og:title sheds the tagline" \
  "does not carry the tagline" \
  "${P}a='<meta property=\"og:title\" content=\"Night Watcher · One path through every Batman\">';assert a in s;s=s.replace(a,'<meta property=\"og:title\" content=\"Night Watcher\">',1);${W}" \
  guards "" 33

run_case "the README's weight figure drifts" \
  "KiB, actual is" \
  "$(pro README.md)a='it is currently ';assert a in s;s=s.replace(a,'it is currently 190 KiB / 60 KiB; it was ',1);${W}" \
  guards "" 46

run_case "the Progress footer names the retired link again" \
  "the Progress footer still mentions" \
  "${P}a='<noscript>';assert a in s;s=s.replace(a,'<!-- Streaming now -->\n<noscript>',1);${W}" \
  guards "" 48

echo "--- three smoke assertions that could not fail, now can"

run_case "tierOf() stops naming the optional tier" \
  "tier partition closes" \
  "${P}a='function tierOf(f){ return f.b.indexOf(\"e\") >= 0 ? \"e\" : (f.o ? \"o\" : \"k\"); }';assert a in s;s=s.replace(a,'function tierOf(f){ return f.b.indexOf(\"e\") >= 0 ? \"e\" : \"k\"; }',1);${W}" \
  smoke main

run_case "counts() counts a parked title again" \
  "the scoreboard adds up" \
  "${P}a='    if(isParked(f)) return;\n    total++;';assert a in s;s=s.replace(a,'    total++;',1);${W}" \
  smoke main

run_case "a tick in a filtered view takes the surgical path" \
  "ticks through the full render" \
  "${P}a='  if(S.tab !== \"watch\" || S.filter !== \"all\" || S.q){\n    var keep = null;';assert a in s;s=s.replace(a,'  if(S.tab !== \"watch\" || S.q){\n    var keep = null;',1);${W}" \
  smoke identity

echo "--- 120, 132, 155, 159: the boot order, the cache rewrite, the pure hero, the painted states"

run_case "the deck is built after the first render again" \
  "the boot render runs before buildDeck()" \
  "${P}a='  buildDeck(document.getElementById(\"view\"));\n  render();\n  snapTo(S.tab);';assert a in s;s=s.replace(a,'  render();\n  snapTo(S.tab);',1);${W}" \
  guards "" 120

run_case "an unchanged response is rewritten to the runtime cache" \
  "matches the cached entry's was written again" \
  "$(pro docs/sw.js)a='if(old && was && now && was === now){';assert a in s;s=s.replace(a,'if(false){',1);${W}" \
  guards "" 132

run_case "a new ETag is refused by the runtime cache" \
  "a response with a NEW ETag was not written" \
  "$(pro docs/sw.js)a='if(old && was && now && was === now){';assert a in s;s=s.replace(a,'if(old){',1);${W}" \
  guards "" 132

run_case "upNext() writes the pick again" \
  "upNext() writes state again" \
  "${P}a='  if(pickStands()) return BYID[S.pick];';assert a in s;s=s.replace(a,'  if(pickStands()) return BYID[S.pick];\n  S.pick = \"\";',1);${W}" \
  guards "" 155

run_case "render() forgets to expire a stale pick" \
  "render() no longer expires a stale pick" \
  "${P}a='function render(o){\n  expirePick();';assert a in s;s=s.replace(a,'function render(o){',1);${W}" \
  guards "" 155

run_case "the pressed chip washes out under forced colors" \
  "matches its unpressed twin under forced colors" \
  "${P}a='.chip[aria-pressed=\"true\"],.scope button[aria-pressed=\"true\"],.pathseg button[aria-pressed=\"true\"],.themerow button[aria-pressed=\"true\"],.film.done .tick{forced-color-adjust:none;background:Highlight;color:HighlightText;border-color:Highlight;}\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 159

run_case "the current tab is signal ink only again" \
  "the current tab is signal ink only" \
  "${P}a='#tabs button[aria-current]{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px;}\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 159

run_case "the lit segments die under forced colors" \
  "the lit segments (essentials, skyline crown, belt peek) die" \
  "${P}a='.segs i.on,.sky .seg.lit .cr .p,.sky .sh i,#beltpeek::after{forced-color-adjust:none;background:Highlight;}\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 159

run_case "the group bar loses its fill under forced colors" \
  "the group bar's fill dies" \
  "${P}a='.gbar i{forced-color-adjust:none;background:CanvasText;}\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 159

run_case "the here group loses its outline under forced colors" \
  "corner marks are gradients" \
  "${P}a='.group.here{outline:2px solid Highlight;outline-offset:2px;}\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 159

run_case "the forced-colors block paints the wordmark" \
  "with forced-color-adjust:none — the palette is the reader's" \
  "${P}a='.group.here{outline:2px solid Highlight;outline-offset:2px;}\n';assert a in s;s=s.replace(a,a+'.wordmark{forced-color-adjust:none;color:#FFCF1F;}\n',1);${W}" \
  guards "" 159

echo "--- 143 and the deck: quiet renders, the row-level patch, the in-place search"

run_case "the keystroke rebuilds The Path again" \
  "the search input handler no longer filters in place" \
  "${P}a='qTimer = setTimeout(function(){ S.q = v; searchApply(); }, 180);';assert a in s;s=s.replace(a,'qTimer = setTimeout(function(){ S.q = v; render(); }, 180);',1);${W}" \
  guards "" 143

run_case "searchApply() stops hiding the groups it empties" \
  "no longer hides both the non-matching rows and the groups" \
  "${P}a='    gel.hidden = !shown;\n    total += shown;';assert a in s;s=s.replace(a,'    total += shown;',1);${W}" \
  guards "" 143

run_case "render() dirties every neighbour again, quiet or not" \
  "render() no longer fills the active panel and dirties" \
  "${P}a='  if(!(o && o.quiet)) NWTABS.forEach(function(t){ if(t !== S.tab && !(o && o.keep && o.keep[t])) nwDirty[t] = true; });';assert a in s;s=s.replace(a,'  NWTABS.forEach(function(t){ if(t !== S.tab) nwDirty[t] = true; });',1);${W}" \
  guards "" 143

run_case "a tick from another panel stops patching the inert Path" \
  "no longer patches the inert Path row-level" \
  "${P}a='    if(S.tab !== \"watch\" && !nwDirty.watch && S.filter === \"all\" && !S.q && patchRow(panelOf(\"watch\"), id)) keep = {watch:1};\n    render(keep ? {keep:keep} : undefined);';assert a in s;s=s.replace(a,'    render();',1);${W}" \
  guards "" 103

run_case "a peek rebuilds its neighbours, behaviorally" \
  "a peek fills no other panel" \
  "${P}a='else if(act === \"peek\"){ S.peek[id] = !S.peek[id]; render({quiet:true}); }';assert a in s;s=s.replace(a,'else if(act === \"peek\"){ S.peek[id] = !S.peek[id]; render(); }',1);${W}" \
  smoke main

run_case "a tick from Next up dirties The Path again, behaviorally" \
  "refills Home but not The Path" \
  "${P}a='    if(S.tab !== \"watch\" && !nwDirty.watch && S.filter === \"all\" && !S.q && patchRow(panelOf(\"watch\"), id)) keep = {watch:1};';assert a in s;s=s.replace(a,'    keep = null;',1);${W}" \
  smoke main

run_case "the in-place search forgets an emptied group" \
  "in-place pass is byte-identical to a full render" \
  "${P}a='    gel.hidden = !shown;\n    total += shown;';assert a in s;s=s.replace(a,'    total += shown;',1);${W}" \
  smoke identity

run_case "the row-level patch forgets the group bar" \
  "the patch equals a full fill" \
  "${P}a='  if(gbar) gbar.innerHTML = gBarFill(g);\n  var nid = (upNext() || {}).id, hk = null;';assert a in s;s=s.replace(a,'  var nid = (upNext() || {}).id, hk = null;',1);${W}" \
  smoke identity

echo "--- 67: the sitemap's second date"

run_case "llms.txt changes and the sitemap does not date it" \
  "llms.txt changed and the sitemap still dates it" \
  "$(pro docs/llms.txt)s=s.replace('\n','\nEdited in a fixture.\n',1);${W};import re;p='docs/sitemap.xml';s=io.open(p,encoding='utf-8').read();b=re.sub(r'(llms\\.txt</loc>\\s*<lastmod>)\\d{4}-\\d{2}-\\d{2}',lambda m:m.group(1)+'2000-01-01',s,1);assert b!=s;s=b;${W}" \
  guards "" 67

run_case "the sitemap re-dates an unchanged llms.txt" \
  "but the file has not changed since" \
  "$(pro docs/sitemap.xml)import re;b=re.sub(r'(llms\\.txt</loc>\\s*<lastmod>)\\d{4}-\\d{2}-\\d{2}',lambda m:m.group(1)+'2099-01-01',s,1);assert b!=s;s=b;${W}" \
  guards "" 67

rm -rf "$NEG"
finish "negtest690 (5.3.1 — the two 5.3.0 QAs, whole)"
