#!/bin/bash
# negtest870 — 6.8.1. The skip link, and the questions in llms.txt (183).
# Every paper page opens on one skip link to the paper; the focus rule
# unclips it; print drops it; llms.txt carries the front title and each
# question the front prints.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"
L="$(pro docs/llms.txt)"

echo "--- 183: the skip link, and the questions in llms.txt"

run_case "the skip link points somewhere else" \
  "a paper page has no skip link to the paper" \
  "${N}a='href=\"#paper\"';assert s.count(a)==1;s=s.replace(a,'href=\"#mast\"',1);${W}" \
  guards "" 183

run_case "the focused skip link stays put" \
  "the skip link stays clipped when it is focused" \
  "${N}a='.skip:focus{position:fixed;';assert s.count(a)==1;s=s.replace(a,'.skip:focus{position:static;',1);${W}" \
  guards "" 183

run_case "print keeps the skip link" \
  "print still shows the skip link" \
  "${N}a='.skip{display:none;}';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 183

run_case "llms.txt drops the front title" \
  "llms.txt does not carry the front title" \
  "${L}a='Batman news this week, no spoilers · Nocturne · Night Watcher';assert s.count(a)==1;s=s.replace(a,'Nocturne',1);${W}" \
  guards "" 183

run_case "llms.txt drops a printed question" \
  "llms.txt does not carry a question the front prints" \
  "${L}a='Where do I read this week’s Batman news without spoilers?';assert s.count(a)==1;s=s.replace(a,'Where do I read the news?',1);${W}" \
  guards "" 183

finish "183 skip link and llms questions"
