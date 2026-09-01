#!/bin/bash
# Negative-test 1.7.6 — the backlog items, including the guard-15 bug the new
# warning exposed on its first run, and the touch-target floor.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 15: silence must not read as success"
run_case "a meta count is reworded out of the sentence" \
  "no longer states a films count" \
  "${P}a='content=\"Every Batman movie and series in order — 137 films';assert a in s
s=s.replace(a,'content=\"Every Batman movie and series in order — a lot of films',1);${W}"

run_case "the counted JSON-LD description loses its counts" \
  "JSON-LD description is missing" \
  "${P}a='\"description\":\"Every Batman movie and series in order — 137 films';assert a in s
s=s.replace(a,'\"description\":\"Every Batman movie and series in order — lots of things',1);${W}"

echo "--- 75: a control is as big as a finger"
run_case "the chips go back under the touch target" \
  ".chip gives a 30px touch target" \
  "${P}a='border-radius:0;color:var(--dust);min-height:44px;';assert a in s
s=s.replace(a,'border-radius:0;color:var(--dust);min-height:30px;',1);${W}"

run_case "the tick loses its hit area" \
  ".tick gives a 24px touch target" \
  "${P}a='.tick::before{content:\"\";position:absolute;top:-14px;left:-14px;right:-14px;bottom:-14px;}\n'
assert a in s;s=s.replace(a,'',1);${W}"

run_case "a measured control stops declaring a height" \
  "no declared height for the control(s)" \
  "${P}import re;n=0
for pat in (r'\\.bkbtn\\{[^}]*\\}', r'\\.bkbtn\\.primary\\{[^}]*\\}'):
    m=re.search(pat,s);assert m;s=s[:m.start()]+re.sub(r'min-height:\\d+px;','',m.group(0))+s[m.end():];n+=1
assert n==2;${W}"

rm -rf "$NEG"
finish "1.7.6 negative tests"
