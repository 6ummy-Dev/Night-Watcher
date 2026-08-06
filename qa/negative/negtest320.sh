#!/bin/bash
# Negative-test section 120 — the forced-layout family. Added in 3.2.0, when a
# reflow walked past section 96's single-property refusal under a different
# name. Three shapes: a refused property arriving, a pinned read multiplying,
# and a pinned read vanishing without its pin moving.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 120: the page does not read layout after writing it"
run_case "a refused property arrives" \
  "index.html reads getBoundingClientRect" \
  "${P}a='var keep = window.pageYOffset';assert a in s
s=s.replace(a,'var box = v.getBoundingClientRect(); var keep = window.pageYOffset',1);${W}"

run_case "a second refused property arrives" \
  "index.html reads getComputedStyle" \
  "${P}a='var keep = window.pageYOffset';assert a in s
s=s.replace(a,'var cs = getComputedStyle(v); var keep = window.pageYOffset',1);${W}"

run_case "a pinned read multiplies" \
  "reads pageYOffset 2 times" \
  "${P}a='var keep = window.pageYOffset';assert a in s
s=s.replace(a,'var also = window.pageYOffset; var keep = window.pageYOffset',1);${W}"

run_case "the header measurement multiplies" \
  "reads offsetHeight 2 times" \
  "${P}a='h.offsetHeight';assert a in s
s=s.replace(a,'h.offsetHeight + h.offsetHeight',1);${W}"

run_case "a pinned read vanishes and its pin does not move" \
  "down from 1" \
  "${P}a='window.pageYOffset || document.documentElement.scrollTop || 0';assert a in s
s=s.replace(a,'0',1);${W}"

finish "negtest320"
