#!/bin/bash
# negtest570 — 4.5.2, the seal. No feature; the 4.5.1 audit found five guards
# claiming an invariant they did not hold, and every repair gets its fixture
# here. Section 111's third half (skipped never lands on a watched entry);
# section 43's bless writing the ledger it tells you to bless (a green case
# under --bless); section 96 reading the animation in either time unit (a
# green case for `ms`, a red one for a drift written in `ms`, a red one for
# an unreadable unit); section 133 holding EVERY /* header, and holding the
# HEAD responses; section 140 refusing the pin in CI and any shape but
# YYYY-MM-DD (those two sit in negtest560 beside the clock they modify);
# section 65 comparing a short `#id`/`.sel`/`--prop` heading; section 144
# parsing a prefix-compressed index the byte scan could not see; section 13
# refusing a shell entry that is also an exclusion; and the four cache
# blocks 4.5.1 added without a fixture of their own.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
N="import io;p='NOTES.md';s=io.open(p,encoding='utf-8').read();"
NW="io.open(p,'w',encoding='utf-8').write(s)"
K="import io;p='worker.js';s=io.open(p,encoding='utf-8').read();"
KW="io.open(p,'w',encoding='utf-8').write(s)"
V="import io;p='docs/sw.js';s=io.open(p,encoding='utf-8').read();"
VW="io.open(p,'w',encoding='utf-8').write(s)"
H="import io;p='docs/_headers';s=io.open(p,encoding='utf-8').read();"
HW="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 111: the third half of the merge invariant"

run_case "the skipped loop stops stepping over watched entries" \
  "lets a skipped mark land on a watched entry" \
  "${P}a='if(!res.skipped[id] || !BYID[id] || isParkedId(id) || S.watched[id] || S.skipped[id]';assert a in s
s=s.replace(a,'if(!res.skipped[id] || !BYID[id] || isParkedId(id) || S.skipped[id]',1);${W}" \
  guards "" 111

echo "--- 43: bless re-records a stale ledger, as its message says"

NEG_ARGS="--bless"
green_case "a stale script-bytes ledger is re-recorded by bless and the tree stays green" \
  "import json;p='qa/script-bytes.json';d=json.load(open(p));d['bytes']=d['bytes']-1;json.dump(d,open(p,'w'))"
unset NEG_ARGS

echo "--- 96: the belt's duration in either unit"

green_case "the animation written in milliseconds still ties to BELTCLOSE" \
  "${P}a='animation:beltclose .24s';assert a in s;s=s.replace(a,'animation:beltclose 240ms',1);${W}"

run_case "a drift written in milliseconds is read, not NaN'd into green" \
  "the beltclose animation runs 900ms" \
  "${P}a='animation:beltclose .24s';assert a in s;s=s.replace(a,'animation:beltclose 900ms',1);${W}" \
  guards "" 96

run_case "an unreadable duration is a failure, not a pass" \
  "cannot read the beltclose animation's duration" \
  "${P}a='animation:beltclose .24s';assert a in s;s=s.replace(a,'animation:beltclose var(--beltclose)',1);${W}" \
  guards "" 96

echo "--- 133: every /* header, on GET and on HEAD"

run_case "a sixth header under /* is not carried by the Worker" \
  "does not carry X-Permitted-Cross-Domain-Policies: none" \
  "${H}a='  Cross-Origin-Resource-Policy: same-origin\n';assert a in s
s=s.replace(a,a+'  X-Permitted-Cross-Domain-Policies: none\n',1);${HW}" \
  guards "" 133

run_case "the markdown HEAD response drops the security set while GET keeps it" \
  "the markdown HEAD response does not carry" \
  "${K}a='    if(head) return new Response(null, {status: 200, headers: headers});';assert a in s
s=s.replace(a,'    if(head) return new Response(null, {status: 200, headers: {\"Content-Type\": headers[\"Content-Type\"], \"Vary\": \"Accept\", \"Content-Location\": \"/llms.txt\", \"Link\": ROOT_LINKS}});',1);${KW}" \
  guards "" 133

run_case "the api-catalog HEAD response drops the security set while GET keeps it" \
  "the api-catalog HEAD response does not carry" \
  "${K}a='    headers: withSecurity({\n      \"Content-Type\": \"application/linkset+json\",';assert a in s
s=s.replace(a,'    headers: (head ? function(h){ return h; } : withSecurity)({\n      \"Content-Type\": \"application/linkset+json\",',1);${KW}" \
  guards "" 133

echo "--- 65: short anchors are compared too"

run_case "a three-character id heading that the file no longer has" \
  "re-anchor the heading to the line as it reads now" \
  "${N}a='### \`#view\`';assert a in s;s=s.replace(a,'### \`#vw\`',1);${NW}" \
  guards "" 65

run_case "a custom-property heading that the file no longer has" \
  "re-anchor the heading to the line as it reads now" \
  "${N}a='### \`--num\`';assert a in s;s=s.replace(a,'### \`--nm\`',1);${NW}" \
  guards "" 65

echo "--- 144: a prefix-compressed index is parsed, not scanned"

# A version-4 index with two entries: .vscode/settings.json, then
# .wrangler/state/x stored as "strip 20, append wrangler/state/x". The bytes
# ".wrangler/" appear nowhere in the file; only a reader that reconstructs the
# path can see the entry. The scratch tree has no .git, so the index is planted.
run_case "a .wrangler/ entry hidden by version-4 prefix compression" \
  ".wrangler/ is still in the git index" \
  "import os,struct
os.makedirs('.git',exist_ok=True)
def entry(prev,name):
    common=0
    while common<min(len(prev),len(name)) and prev[common]==name[common]: common+=1
    strip=len(prev)-common; suffix=name[common:].encode()
    assert strip<128
    return b'\0'*40+b'\x11'*20+struct.pack('>H',len(name))+bytes([strip])+suffix+b'\0'
body=b'DIRC'+struct.pack('>II',4,2)+entry('','.vscode/settings.json')+entry('.vscode/settings.json','.wrangler/state/x')
assert b'.wrangler/' not in body
open('.git/index','wb').write(body+b'\0'*20)" \
  guards "" 144

echo "--- 13: an exclusion is not also a shell entry"

run_case "index.html sneaks back into SHELL" \
  "deliberately not cached" \
  "${V}a='var SHELL   = [\"./\", ';assert a in s;s=s.replace(a,'var SHELL   = [\"./\", \"./index.html\", ',1);${VW}" \
  guards "" 13

echo "--- 104: the four cache blocks that had no fixture"

run_case "the install icon loses its cache block" \
  "no longer sets Cache-Control on /icon.png" \
  "${H}a='/icon.png\n  Cache-Control: public, max-age=86400\n';assert a in s
s=s.replace(a,'/icon.png\n  Cache-Control: no-cache\n',1);${HW}" \
  guards "" 104

run_case "the 192px icon loses its cache block" \
  "no longer sets Cache-Control on /icon-192.png" \
  "${H}a='/icon-192.png\n  Cache-Control: public, max-age=86400\n';assert a in s
s=s.replace(a,'/icon-192.png\n  Cache-Control: no-cache\n',1);${HW}" \
  guards "" 104

run_case "the maskable icon loses its cache block" \
  "no longer sets Cache-Control on /icon-maskable-512.png" \
  "${H}a='/icon-maskable-512.png\n  Cache-Control: public, max-age=86400\n';assert a in s
s=s.replace(a,'/icon-maskable-512.png\n  Cache-Control: no-cache\n',1);${HW}" \
  guards "" 104

run_case "the manifest loses its cache block" \
  "no longer sets Cache-Control on /manifest.json" \
  "${H}a='/manifest.json\n  Cache-Control: public, max-age=86400\n';assert a in s
s=s.replace(a,'/manifest.json\n  Cache-Control: no-cache\n',1);${HW}" \
  guards "" 104

echo "--- smoke: the closed view has an absolute ceiling again"

# 4.5.1 replaced the fixed bound with a relation, and the relation alone let
# the closed view double before it fired. 200 rows carrying 150 dead bytes
# each is 30 KB — invisible to the relation, over the ceiling.
run_case "the closed view grows past its ceiling without opening a panel" \
  "closed view stays under its absolute ceiling" \
  "${P}a='return \x27<div class=\"\x27+cls+\x27\"\x27+(hid ? \x27 hidden=\"\"\x27 : \x27\x27)+\x27><div class=\"frow\">\x27+';assert a in s
s=s.replace(a,'return \x27<div class=\"\x27+cls+\x27\" data-pad=\"'+'x'*150+'\"\x27+(hid ? \x27 hidden=\"\"\x27 : \x27\x27)+\x27><div class=\"frow\">\x27+',1);${W}" \
  smoke main

rm -rf "$NEG"
finish "negtest570"
