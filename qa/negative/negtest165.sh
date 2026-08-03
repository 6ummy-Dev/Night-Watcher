#!/bin/bash
# Negative-test every guard added or changed in 1.6.5.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="import io;p='NOTES.md';s=io.open(p,encoding='utf-8').read();"

echo "--- 65: the restore banner reaches both halves of Home"
run_case "the banner drops off the first-run branch (the 1.6.4 regression)" \
  "a device with no path chosen would see nothing" \
  "${P}a=\"html += pendingBanner()+'<div class=\\\"chooser\\\">'\";assert a in s;s=s.replace(a,\"html += '<div class=\\\"chooser\\\">'\");${W}"

run_case "the banner drops off the main branch" \
  "missing from Home once a path exists" \
  "${P}a='  html += pendingBanner();';assert a in s;s=s.replace(a,'');${W}"

run_case "the banner stops mentioning the carried path" \
  "does not say when a link carries a path" \
  "${P}a='if(!S.path && isPath(p.path)) bits += \" and a path\";';assert a in s;s=s.replace(a,'');${W}"

echo "--- 65: a number in prose is guarded like every other count"
run_case "the header's section count drifts" \
  "guard sections; there are" \
  "${P}import re;m=re.search(r'qa/guards\\.js — (\\d+) sections',s);assert m
s=s[:m.start(1)]+str(int(m.group(1))-10)+s[m.end(1):];${W}"

run_case "NOTES.md's section count drifts" \
  "NOTES.md says" \
  "${N}import re;m=re.search(r'(\\d+) numbered sections',s);assert m
s=s[:m.start(1)]+str(int(m.group(1))-15)+s[m.end(1):];${W}"

echo "--- smoke: a restore link works from a cold start"
run_case "restoring on a fresh device loses the path" \
  "restoring on a fresh device keeps the path the link carried" \
  "${P}a='if(!S.path && isPath(res.path)){ S.path = S.mode = res.path; }';assert a in s;s=s.replace(a,'');${W}" \
  "smoke" "main"

run_case "the link is consumed before it is answered" \
  "a restore link shows its banner on a device with no path" \
  "${P}a='html += pendingBanner()+';assert a in s;s=s.replace(a,'html += ');${W}" \
  "smoke" "main"

rm -rf "$NEG"
finish "1.6.5 negative tests"
