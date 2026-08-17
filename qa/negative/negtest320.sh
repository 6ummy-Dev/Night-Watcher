#!/bin/bash
# Negative-test section 120 — the forced-layout family. Added in 3.2.0, when a
# reflow walked past section 96's single-property refusal under a different
# name. Three shapes: a refused property arriving, a pinned read multiplying,
# and a pinned read vanishing without its pin moving.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 120: the page does not read layout after writing it"
# 3.9.7 moved the keep-read onto #app: it is scrollKeep() now, pageYOffset
# sits in REFUSED, and the scrollTop pin is 2 (one read, one write). The
# shapes these fixtures prove are unchanged — a refused property arriving, a
# pinned read multiplying, a pin going unsatisfied — only the names moved.
run_case "a pinned read multiplies past its pin" \
  "reads getBoundingClientRect 3 times" \
  "${P}a='var keep = scrollKeep();';assert a in s
s=s.replace(a,'var box = document.body.getBoundingClientRect(); var keep = scrollKeep();',1);${W}"

run_case "a refused property arrives" \
  "index.html reads getComputedStyle" \
  "${P}a='var keep = scrollKeep();';assert a in s
s=s.replace(a,'var cs = getComputedStyle(document.body); var keep = scrollKeep();',1);${W}"

run_case "a second refused property arrives" \
  "index.html reads pageYOffset" \
  "${P}a='var keep = scrollKeep();';assert a in s
s=s.replace(a,'var also = window.pageYOffset; var keep = scrollKeep();',1);${W}"

run_case "a pinned read multiplies" \
  "reads scrollTop 3 times" \
  "${P}a='var keep = scrollKeep();';assert a in s
s=s.replace(a,'var also = document.body.scrollTop; var keep = scrollKeep();',1);${W}"

run_case "the header measurement multiplies" \
  "reads offsetHeight 3 times" \
  "${P}a='h.offsetHeight';assert a in s
s=s.replace(a,'h.offsetHeight + h.offsetHeight',1);${W}"

run_case "a pinned read vanishes and its pin does not move" \
  "down from 2" \
  "${P}a='return a ? (a.scrollTop || 0) : 0;';assert a in s
s=s.replace(a,'return 0;',1);${W}"

finish "negtest320"
