#!/bin/bash
# negtest560 — 4.5.1, the seal. No feature shipped; the pre-seal audit did,
# and every claim it added to the suite gets its fixture here. The suite's
# own floor first: a failure inside the nested section 24 must print as §24
# (it printed as §23 for as long as the stamper was anchored at column 0);
# the comment stripper must not eat code past a slash-star inside a string
# (a green case — the tree stays green with such a string planted before a
# section's only fail); the coverage harvester must read a single-quoted
# expect (a stray fixture with one moves the sect pin). Then the new claims:
# the script-bytes ledger read outside bless, the disjoint id ledgers, the
# Worker's security set held to _headers, the navigate fallback's order, the
# named ring and belt constants, the share card's manifest, NOTES.md's
# snippet anchors, the shared merge and focus helpers, the five new cache
# blocks, the storage key, and the archival clock.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
G="$(pro qa/guards.js)"
GW="io.open(p,'w',encoding='utf-8').write(s)"
N="import io;p='NOTES.md';s=io.open(p,encoding='utf-8').read();"
NW="io.open(p,'w',encoding='utf-8').write(s)"
K="import io;p='worker.js';s=io.open(p,encoding='utf-8').read();"
KW="io.open(p,'w',encoding='utf-8').write(s)"
V="import io;p='docs/sw.js';s=io.open(p,encoding='utf-8').read();"
VW="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- the suite's own floor"

run_case "a failure inside the nested section prints as its own number" \
  "PATHBLURB is back" \
  "${P}a='var BUILD';assert a in s;s=s.replace(a,'var PATHBLURB = 1;\nvar BUILD',1);${W}" \
  guards "" 24

green_case "a slash-star inside a string does not eat the code after it" \
  "${G}a='/* ---------- 145. ';i=s.index(a);j=s.index('(function(){',i)+len('(function(){')
s=s[:j]+'\n  var planted = \"/*\"; if(!planted) fail(\"never\");'+s[j:];${GW}"

run_case "a fixture with a single-quoted expect is harvested, so the sect pin moves" \
  "guards fixtures that pass no section number" \
  "import io
io.open('qa/negative/negtest999.sh','w').write('#!/bin/bash\nrun_case \"stray\" \x27the storage key is not \"batwatch-v3\"\x27 \"true\"\n')" \
  guards "" 138

echo "--- 43: the ledger is read outside bless"

run_case "the script-bytes ledger goes stale" \
  "does not describe the blessed script" \
  "import io,json;p='qa/script-bytes.json';d=json.load(open(p));d['bytes']=d['bytes']+1;json.dump(d,open(p,'w'))" \
  guards "" 43

echo "--- 2: the three id ledgers are disjoint"

run_case "a retired slug is also recorded as renamed" \
  "a slug was retired or it was renamed, not both" \
  "import io,json;p='qa/renamed-ids.json';d=json.load(open(p))
d['scooby-doo-and-krypto-too-2023']={'to':'the-batman-2022','in':'x','why':'a reason long enough to pass the length floor the guard applies to reasons'}
json.dump(d,open(p,'w'))" \
  guards "" 2

echo "--- 133: the Worker's responses carry what _headers declares"

run_case "the Worker's security set drifts from the file" \
  "_headers applies to asset responses only" \
  "${K}a='\"X-Frame-Options\": \"DENY\"';assert a in s;s=s.replace(a,'\"X-Frame-Options\": \"SAMEORIGIN\"',1);${KW}" \
  guards "" 133

run_case "the markdown response drops the root's Link set" \
  "is not the root's three document Link lines" \
  "${K}a='\"Link\": ROOT_LINKS,';assert a in s;s=s.replace(a,'',1);${KW}" \
  guards "" 133

echo "--- 132: the navigate fallback tries the unredirected name first"

run_case "the fallback goes back to index.html first" \
  "does not fall back to the app shell" \
  "${V}a='return caches.match(\"./\", ANY).then(function(shell){\n            return shell || caches.match(\"./index.html\", ANY);';assert a in s
s=s.replace(a,'return caches.match(\"./index.html\", ANY).then(function(shell){\n            return shell || caches.match(\"./\", ANY);',1);${VW}" \
  guards "" 132

echo "--- 80 and 96: the named constants"

run_case "the ring setter goes back to a literal" \
  "draws the ring from a literal instead of RINGC" \
  "${P}a='(RINGC * (1 - frac))';assert a in s;s=s.replace(a,'(109.96 * (1 - frac))',1);${W}" \
  guards "" 80

run_case "the belt timer drifts from the animation" \
  "the beltclose animation runs" \
  "${P}a='var BELTCLOSE = 240;';assert a in s;s=s.replace(a,'var BELTCLOSE = 300;',1);${W}" \
  guards "" 96

run_case "the belt re-render stops waiting on the constant" \
  "does not wait BELTCLOSE" \
  "${P}a='render(); }, BELTCLOSE);';assert a in s;s=s.replace(a,'render(); }, 240);',1);${W}" \
  guards "" 96

echo "--- 91: the card's manifest"

run_case "the card's counts go stale against the data" \
  "the card is stale" \
  "import json;p='qa/share-card.json';d=json.load(open(p));d['films']=d['films']-1;json.dump(d,open(p,'w'))" \
  guards "" 91

run_case "the card changes outside the generator" \
  "does not match the hash in qa/share-card.json" \
  "import json;p='qa/share-card.json';d=json.load(open(p));d['sha256']='0'*64;json.dump(d,open(p,'w'))" \
  guards "" 91

run_case "the manifest is deleted" \
  "qa/share-card.json is missing" \
  "import os;os.remove('qa/share-card.json')" \
  guards "" 91

echo "--- 65: a NOTES heading that quotes the file has to quote it as it reads"

run_case "a snippet heading anchors a line that was rewritten" \
  "re-anchor the heading to the line as it reads now" \
  "${N}a='### \`if(S.format === \"all\"){\`';assert a in s;s=s.replace(a,'### \`if(S.format === \"everything\"){\`',1);${NW}" \
  guards "" 65

echo "--- 111: one merge"

run_case "the helper loses the BYID gate" \
  "applyMarks() lost the BYID gate" \
  "${P}a='if(!res.watched[id] || !BYID[id] || isParkedId(id) || S.watched[id]';assert a in s
s=s.replace(a,'if(!res.watched[id] || isParkedId(id) || S.watched[id]',1)
a='if(!res.skipped[id] || !BYID[id] || isParkedId(id) || S.watched[id]';assert a in s
s=s.replace(a,'if(!res.skipped[id] || isParkedId(id) || S.watched[id]',1)
a='if(!rv || !BYID[id] || isParkedId(id) || S.rated[id] === rv';assert a in s
s=s.replace(a,'if(!rv || isParkedId(id) || S.rated[id] === rv',1);${W}" \
  guards "" 111

run_case "applyImport grows its own copy of the loop back" \
  "sets S.watched by hand again" \
  "${P}a='  applyMarks(res, true).added.forEach(function(id){ S.log.push({id:id, ts:Date.now()}); });';assert a in s
s=s.replace(a,'  var id; for(id in res.watched){ if(BYID[id] && !S.watched[id]){ S.watched[id] = 1; S.log.push({id:id, ts:Date.now()}); } }\n  applyMarks(res, true);',1);${W}" \
  guards "" 111

run_case "the storage event stops merging through the helper" \
  "no longer merges through applyMarks()" \
  "${P}a='  moved += applyMarks(o, false, function(kind, id){';assert a in s
i=s.index(a);j=s.index('}).changed;',i)+len('}).changed;')
s=s[:i]+'  moved += 0;'+s[j:];${W}" \
  guards "" 111

echo "--- 123: one focus restore"

run_case "focusBack loses preventScroll" \
  "focusBack() restores focus without preventScroll" \
  "${P}a='function focusBack(el){ if(el) el.focus({preventScroll:true}); }';assert a in s
s=s.replace(a,'function focusBack(el){ if(el) el.focus(); }',1);${W}" \
  guards "" 123

run_case "render restores focus by hand again" \
  "calls .focus() itself instead of focusBack()" \
  "${P}a='  var field = fieldRestore(v, fields);';assert a in s;s=s.replace(a,'  var field = fieldRestore(v, fields); if(field) field.el.focus();',1);${W}" \
  guards "" 123

run_case "tickUpdate stops snapshotting through the helper" \
  "no longer snapshots and restores focus through the shared helpers" \
  "${P}a='  var fo = focusSnap(row);';assert a in s;s=s.replace(a,'  var fo = null;',1)
a='  focusRestore(v, fo);';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 123

run_case "the key list drops data-src" \
  "the focus snapshot's key list no longer reads data-src" \
  "${P}a='\"n\",\"pk\",\"src\"]';assert a in s;s=s.replace(a,'\"n\",\"pk\"]',1);${W}" \
  guards "" 123

run_case "focusRestore stops escaping the selector" \
  "does not go through focusBack() and attrEsc()" \
  "${P}a='fsel += \"[data-\" + k + \x27=\"\x27 + attrEsc(fo[k]) + \x27\"]\x27;';assert a in s
s=s.replace(a,'fsel += \"[data-\" + k + \x27=\"\x27 + fo[k] + \x27\"]\x27;',1)
a='button[data-act=\"\x27 + attrEsc(fo.act) + \x27\"]';assert a in s
s=s.replace(a,'button[data-act=\"\x27 + fo.act + \x27\"]',1);${W}" \
  guards "" 123

echo "--- 104: the five files that had no cache block"

run_case "the share card loses its cache block" \
  "no longer sets Cache-Control on /share.png" \
  "import io;p='docs/_headers';s=io.open(p,encoding='utf-8').read()
a='/share.png\n  Cache-Control: public, max-age=86400\n';assert a in s
s=s.replace(a,'/share.png\n  Cache-Control: no-cache\n',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 104

echo "--- 21: the storage key is frozen"

run_case "the storage key is tidied" \
  "the storage key is not" \
  "${P}a='var KEY = \"batwatch-v3\";';assert a in s;s=s.replace(a,'var KEY = \"night-watcher\";',1);${W}" \
  guards "" 21

echo "--- 140: the archival clock"

# The pin is refused under CI (4.5.2), so the pinned fixtures run with CI
# unset — this script's environment only; run-all.sh and the shard are
# untouched — and the refusal gets its own fixture.
unset CI
# 5.3.1: the pin is DERIVED from the file's own Expires (17 days before it),
# so guard 140's renewal in 2027 cannot move this fixture into the ">366
# days" branch and turn the suite red for the wrong reason on renewal day.
NW_EXP="$(sed -n 's/^Expires: \([0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}\).*/\1/p' docs/.well-known/security.txt)"
export NW_TODAY="$(python3 -c "import datetime,sys;print((datetime.date.fromisoformat(sys.argv[1])-datetime.timedelta(days=17)).isoformat())" "$NW_EXP")"
run_case "the clock pinned a fortnight before expiry goes red" \
  "renew the Expires field" \
  "print('no mutation: the clock is the mutation')" \
  guards "" 140
export NW_TODAY=not-a-date
run_case "an unreadable clock is refused rather than ignored" \
  "NW_TODAY must be YYYY-MM-DD" \
  "print('no mutation')" \
  guards "" 140
export NW_TODAY="July 15, 2027"
run_case "a clock in any shape but YYYY-MM-DD is refused, even a parseable one" \
  "NW_TODAY must be YYYY-MM-DD" \
  "print('no mutation')" \
  guards "" 140
export NW_TODAY=2027-07-15 CI=true
run_case "the pin is refused in CI, where the live tree's clock runs" \
  "NW_TODAY is set in CI" \
  "print('no mutation')" \
  guards "" 140
unset NW_TODAY CI

rm -rf "$NEG"
finish "negtest560"
