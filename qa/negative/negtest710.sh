#!/bin/bash
# negtest710 — 6.0.0, the MAJOR: the settings key split and the Batwoman
# season split. Fixtures for every clause this cut added — §2's third
# ledger (qa/split-ids.json held equal to the app's SPLIT table, its
# targets in the catalogue, disjoint from the other two ledgers, the
# four doors that run splitPayload(), importCode()'s hash map), §3's
# split hashes in the collision space (a slug pre-computed to collide
# with batman-begins-2005), §21's settings key and the per-side write,
# §127's two-key read, §158's settings seat (leaves on !r.s, no mark row
# on the settings side, mergeTab() adopts nothing) — plus the smoke checks
# that drive the migration, the per-key writes, the adoption off the
# settings key, and the fan-out at each of the four doors. Every fixture
# names its section; the green case carries --bless because a re-spelling
# moves the CSP hash.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 2: the split ledger and the table that mirrors it"

run_case "the app's SPLIT table disagrees with the ledger (a target reordered)" \
  "index.html's SPLIT table is not qa/split-ids.json" \
  "${P}a='[\"batwoman-season-1-2019\",\"batwoman-season-2-2021\",\"batwoman-season-3-2021\"]';assert a in s;s=s.replace(a,'[\"batwoman-season-2-2021\",\"batwoman-season-1-2019\",\"batwoman-season-3-2021\"]',1);${W}" \
  guards "" 2

run_case "the app carries no SPLIT table at all" \
  "index.html carries no SPLIT table" \
  "${P}a='var SPLIT = {\"batwoman';assert a in s;s=s.replace(a,'var SPLITTED = {\"batwoman',1);a='Object.keys(SPLIT)';assert a in s;s=s.replace(a,'Object.keys(SPLITTED)');a='in SPLIT)';assert a in s;s=s.replace(a,'in SPLITTED)');a='SPLIT[old]';s=s.replace(a,'SPLITTED[old]');a='(SPLIT, old)';s=s.replace(a,'(SPLITTED, old)');${W}" \
  guards "" 2

run_case "the split slug comes back into the catalogue" \
  "split id is back in the data" \
  "${P}a='{i:\"batwoman-season-3-2021\",';assert a in s;s=s.replace(a,'{i:\"batwoman-complete-series-2019\",t:\"Batwoman\",sub:\"Complete series\",y:2019,ep:51,k:\"tv\",e:11,lo:8,r:\"TV-14\",d:\"Back.\",o:1},\n '+a,1);${W}" \
  guards "" 2

run_case "a ledger target that is not in the catalogue" \
  "which is not in the catalogue" \
  "import io,json;p='qa/split-ids.json';d=json.load(io.open(p,encoding='utf-8'))
d['batwoman-complete-series-2019']['to'][2]='batwoman-season-4-2023'
io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=1))" \
  guards "" 2

run_case "a slug in both the retired and the split ledgers" \
  "is in both retired-ids.json and split-ids.json" \
  "import io,json;p='qa/retired-ids.json';d=json.load(io.open(p,encoding='utf-8'))
d['batwoman-complete-series-2019']='Retired as well, which is the contradiction this fixture plants.'
io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=1))" \
  guards "" 2

run_case "a split with no real reason" \
  "gives no real reason for splitting" \
  "import io,json;p='qa/split-ids.json';d=json.load(io.open(p,encoding='utf-8'))
d['batwoman-complete-series-2019']['why']='seasons'
io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=1))" \
  guards "" 2

run_case "a split that does not say which release took it" \
  "does not say which release split" \
  "import io,json;p='qa/split-ids.json';d=json.load(io.open(p,encoding='utf-8'))
del d['batwoman-complete-series-2019']['in']
io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=1))" \
  guards "" 2

run_case "a split with one target is not a split" \
  "gives no list of new ids for" \
  "import io,json;p='qa/split-ids.json';d=json.load(io.open(p,encoding='utf-8'))
d['batwoman-complete-series-2019']['to']=['batwoman-season-1-2019']
io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=1))" \
  guards "" 2

run_case "restore() reads the blob without the fan-out" \
  "restore() no longer runs splitPayload()" \
  "${P}a='    var moved = splitPayload(o);';assert a in s;s=s.replace(a,'    var moved = 0;',1);${W}" \
  guards "" 2

run_case "the merge reads the other tab's blob without the fan-out" \
  "mergeTab() no longer runs splitPayload()" \
  "${P}a='  var moved = 0, k;\n  splitPayload(o);';assert a in s;s=s.replace(a,'  var moved = 0, k;',1);${W}" \
  guards "" 2

run_case "a pasted code skips the fan-out" \
  "importCode() no longer runs splitPayload()" \
  "${P}a='  splitPayload(res);\n  return res;';assert a in s;s=s.replace(a,'  return res;',1);${W}" \
  guards "" 2

run_case "a JSON file skips the fan-out" \
  "doRestore() no longer runs splitPayload()" \
  "${P}a='    if(!wBox && !kBox && !rBox) return null;\n    splitPayload(o);';assert a in s;s=s.replace(a,'    if(!wBox && !kBox && !rBox) return null;',1);${W}" \
  guards "" 2

run_case "importCode() forgets the split slug's hash" \
  "importCode() no longer maps a split slug's hash" \
  "${P}a='  Object.keys(SPLIT).forEach(function(old){ map[idHash(old)] = old; });\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 2

echo "--- 3: a split slug's hash shares the space"

run_case "a split slug that hashes like a live one (x-ntllo ~ batman-begins-2005)" \
  "a split slug, still read" \
  "import io,json;p='qa/split-ids.json';d=json.load(io.open(p,encoding='utf-8'))
d['x-ntllo']={'to':['batwoman-season-1-2019','batwoman-season-2-2021'],'in':'6.0.0','why':'A planted split whose old slug collides with batman-begins-2005 in the five-character space.'}
io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=1))
p='docs/index.html';s=io.open(p,encoding='utf-8').read()
a='var SPLIT = {\"batwoman-complete-series-2019\":[\"batwoman-season-1-2019\",\"batwoman-season-2-2021\",\"batwoman-season-3-2021\"]};'
assert a in s;s=s.replace(a,'var SPLIT = {\"batwoman-complete-series-2019\":[\"batwoman-season-1-2019\",\"batwoman-season-2-2021\",\"batwoman-season-3-2021\"],\"x-ntllo\":[\"batwoman-season-1-2019\",\"batwoman-season-2-2021\"]};',1)
io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 3

echo "--- 21: the settings key, and a write that knows which side moved"

run_case "the settings key renamed" \
  "the settings key is not \"batwatch-settings\"" \
  "${P}a='var SKEY = \"batwatch-settings\";';assert a in s;s=s.replace(a,'var SKEY = \"nw-settings\";',1);${W}" \
  guards "" 21

run_case "persistNow() writes both keys on every flush" \
  "no longer writes each key only when its own side moved" \
  "${P}a='    if(m !== wrote.m){ store.set(KEY, m); wrote.m = m; }\n    if(s !== wrote.s){ store.set(SKEY, s); wrote.s = s; }';assert a in s;s=s.replace(a,'    store.set(KEY, m); wrote.m = m;\n    store.set(SKEY, s); wrote.s = s;',1);${W}" \
  guards "" 21

run_case "the per-key write memory reshaped" \
  "the per-key write memory (wrote) is gone or reshaped" \
  "${P}a='var wrote = {m:\"\", s:\"\"};';assert a in s;s=s.replace(a,'var wrote = {m:\"\", s:\"\", x:0};',1);${W}" \
  guards "" 21

run_case "payloadOf() serialises both sides again" \
  "payloadOf() no longer splits SCHEMA by side" \
  "${P}a='  SCHEMA.forEach(function(r){ if(!r.s === !side) payload[r.k] = r.get ? r.get() : S[r.k]; });';assert a in s;s=s.replace(a,'  SCHEMA.forEach(function(r){ payload[r.k] = r.get ? r.get() : S[r.k]; });',1);${W}" \
  guards "" 21

echo "--- 127: the read is two keys, and both can fail"

run_case "a settings row read off the progress blob when the settings key exists" \
  "a settings row reads off the settings key when it exists" \
  "${P}a='      var src = (r.s && so) ? so : o;';assert a in s;s=s.replace(a,'      var src = o;',1);${W}" \
  guards "" 127

run_case "the read no longer asks for the settings key inside the try" \
  "restore()'s failed read no longer stops the writes" \
  "${P}a='  try{ raw = store.get(KEY); sraw = store.get(SKEY); }';assert a in s;s=s.replace(a,'  try{ raw = store.get(KEY); }\n  sraw = store.get(SKEY);',1);${W}" \
  guards "" 127

echo "--- 158: the settings seat"

run_case "adoptSettings() no longer leaves on a progress row" \
  "adoptSettings() no longer leaves on !r.s" \
  "${P}a='    if(!r.s || !(r.k in o)) return;\n    var v = r.read(o[r.k], o);\n    if(v === undefined || JSON.stringify(v)';assert a in s;s=s.replace(a,'    if(!(r.k in o)) return;\n    var v = r.read(o[r.k], o);\n    if(v === undefined || JSON.stringify(v)',1);${W}" \
  guards "" 158

run_case "a mark row filed on the settings side" \
  "the settings side of SCHEMA is {format,groupOpen,insOff,path,progOpen,scope,theme,tier,watched}" \
  "${P}a='  {k:\"watched\",      read:marksOf},';assert a in s;s=s.replace(a,'  {k:\"watched\", s:1, read:marksOf},',1);${W}" \
  guards "" 158

run_case "mergeTab() adopts settings off the progress key again" \
  "mergeTab() adopts settings again" \
  "${P}a='  if(Array.isArray(o.log)) moved += mergeLog(o.log.filter(function(en){ return en && S.watched[en.id]; }));\n  if(moved){ persist(); render(); }';assert a in s;s=s.replace(a,'  if(Array.isArray(o.log)) moved += mergeLog(o.log.filter(function(en){ return en && S.watched[en.id]; }));\n  adoptSettings(o);\n  if(moved){ persist(); render(); }',1);${W}" \
  guards "" 158

NEG_ARGS="--bless"
green_case "the settings rows reordered stay green (the side, not the position)" \
  "${P}a='  {k:\"insOff\",    s:1, get:function(){ return S.insOff ? true : undefined; },\n                     read:function(v){ return v === true ? true : undefined; }},\n';assert a in s;s=s.replace(a,'',1)
b='  {k:\"theme\",     s:1, read:oneOf([\"dark\", \"darker\"])},\n';assert b in s;s=s.replace(b,b+'  {k:\"insOff\",    s:1, get:function(){ return S.insOff ? true : undefined; },\n                     read:function(v){ return v === true ? true : undefined; }},\n',1);${W}"
NEG_ARGS=""

echo "--- smoke: the migration, the per-key writes, the adoption, the four doors"

run_case "a flush writes both keys on a tick (smoke counts per key)" \
  "a tick reaches the progress key only" \
  "${P}a='    if(m !== wrote.m){ store.set(KEY, m); wrote.m = m; }\n    if(s !== wrote.s){ store.set(SKEY, s); wrote.s = s; }';assert a in s;s=s.replace(a,'    store.set(KEY, m); wrote.m = m;\n    store.set(SKEY, s); wrote.s = s;',1);${W}" \
  "smoke" "main"

run_case "the first boot after 6.0.0 does not write the settings key (smoke)" \
  "and writes them to the settings key on that boot" \
  "${P}a='    if(moved || (raw && !so)) persist();';assert a in s;s=s.replace(a,'    if(moved) persist();',1);${W}" \
  "smoke" "main"

run_case "the listener ignores the settings key (smoke)" \
  "another tab's saved theme is adopted, not clobbered" \
  "${P}a='  try{ if(e.key === SKEY) adoptSettings(o); else mergeTab(o); }';assert a in s;s=s.replace(a,'  try{ if(e.key !== SKEY) mergeTab(o); }',1);${W}" \
  "smoke" "main"

run_case "a corrupt settings key boots as a first visit (smoke)" \
  "a corrupt settings key stops the writes like a corrupt progress key" \
  "${P}a='    var o = raw ? JSON.parse(raw) : {}, so = sraw ? JSON.parse(sraw) : null;\n    if(!o || typeof o !== \"object\" || (sraw && (!so || typeof so !== \"object\"))) throw new Error(\"not a payload\");';assert a in s;s=s.replace(a,'    var o = raw ? JSON.parse(raw) : {}, so = null;\n    try{ so = sraw ? JSON.parse(sraw) : null; }catch(x){}\n    if(!o || typeof o !== \"object\") throw new Error(\"not a payload\");',1);${W}" \
  "smoke" "main"

run_case "a bundle skip lands on a watched season (smoke)" \
  "never onto a watched season" \
  "${P}a='        if(key === \"skipped\" && w && w[id]) return;\n';assert a in s;s=s.replace(a,'',1);${W}" \
  "smoke" "main"

run_case "the fan-out drops the bundle's night (smoke)" \
  "and carries the bundle's clocks and night with it" \
  "${P}a='        if(en && en.id === old && !o.log.some(function(x){ return x && x.id === id; })) o.log.push({id:id, ts:en.ts});';assert a in s;s=s.replace(a,'        if(false) o.log.push({id:id, ts:en.ts});',1);${W}" \
  "smoke" "main"

run_case "a 5.x code's bundle hash is unknown (smoke)" \
  "a code carrying the bundle's hash ticks and rates the three seasons" \
  "${P}a='  Object.keys(SPLIT).forEach(function(old){ map[idHash(old)] = old; });\n';assert a in s;s=s.replace(a,'',1);${W}" \
  "smoke" "main"

run_case "a JSON file's bundle slug is unknown (smoke)" \
  "a JSON file carrying the bundle's slug ticks the three seasons" \
  "${P}a='    if(!wBox && !kBox && !rBox) return null;\n    splitPayload(o);';assert a in s;s=s.replace(a,'    if(!wBox && !kBox && !rBox) return null;',1);${W}" \
  "smoke" "main"

run_case "a 5.x tab's bundle tick is refused as unknown (smoke)" \
  "a 5.x tab's bundle tick lands on the three seasons" \
  "${P}a='  var moved = 0, k;\n  splitPayload(o);';assert a in s;s=s.replace(a,'  var moved = 0, k;',1);${W}" \
  "smoke" "main"

finish "negtest710"
