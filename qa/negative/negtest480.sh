#!/bin/bash
# negtest480 — 4.2.3. The audit release: the two persist doors, the flatten
# pin, and the INDEX held to its own headers.
#
# The 19 Aug full QA said it plainly: the remaining holes were the same
# family of bug this project keeps writing postmortems about — a watcher
# green on the defect. restore() swallowed a parse failure and let the next
# tick overwrite the reader's bytes (C-1); doRestore counted unknown IDs and
# wrote them into live state anyway (C-2); the guards' own flatten carried a
# field the app never builds, so section 70 asserted f.out on an object that
# does not exist (Q-1); and three INDEX titles described previous
# instruments (Q-7). Every fix below is driven, not grepped: the two smoke
# fixtures boot the real page and watch the behaviour, and the two guards
# fixtures name their section with run_case's new sect argument, so the
# match must land on that section's own §-prefixed line.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- C-1: a store that reads but does not parse is a failed read"

run_case "the parse catch stops latching and the tick eats the bytes" \
  "a store that reads but does not parse latches readFailed" \
  "${P}a='}catch(e){ readFailed = true; canSave = false; }';assert a in s
s=s.replace(a,'}catch(e){}',1);${W}" "smoke" "main"

echo "--- C-2: the JSON door next to the fuzzed vault"

run_case "the BYID gate comes off the JSON write loop" \
  "an unknown id never reaches live state through JSON restore" \
  "${P}a='for(id3 in res.watched){ if(BYID[id3] && !S.watched[id3])';assert a in s
s=s.replace(a,'for(id3 in res.watched){ if(!S.watched[id3])',1);${W}" "smoke" "main"

echo "--- Q-1: the flatten pin, on the section that asserts out:"

run_case "the app's flatten grows a field the guards' copy does not carry" \
  "flatten no longer matches index.html" \
  "${P}a='y:f.y, d:f.d, e:(f.e||0),';assert a in s
s=s.replace(a,'y:f.y, d:f.d, nw:1, e:(f.e||0),',1);${W}" guards "" 70

echo "--- Q-7: the INDEX titles are pinned to the headers"

run_case "an INDEX title drifts to describe a previous instrument" \
  "describing a previous instrument" \
  "import io;p='qa/guards.js';s=io.open(p,encoding='utf-8').read()
a='     66   The guards are navigable';assert a in s
s=s.replace(a,'     66   The guards are greppable',1)
io.open(p,'w',encoding='utf-8').write(s)" guards "" 66

finish "4.2.3 audit fixes"
