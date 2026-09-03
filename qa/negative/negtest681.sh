#!/bin/bash
# negtest681 — 5.2.3, "one scale". Section 17's other half: the stylesheet
# itself has one source now — every font-size is a var(--t-*) reference into
# the :root scale (11 roles, nine fixed sizes, two clamps), and the :root
# block must hold exactly the recorded set at the recorded values. Three
# fixtures, one per way the ladder historically grew back: a rule takes a
# private raw px (the toast's old 10.5 returns), a tenth token appears
# unannounced, and a recorded role's value drifts (fine print back to 9.5 —
# the exact half-pixel this release folded away).
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 17: one scale"

run_case "the toast takes back its private 10.5px" \
  "carries a raw font-size" \
  "${P}a='font-family:var(--mono);font-size:var(--t-label);letter-spacing:.08em;text-transform:uppercase;font-weight:600;z-index:35';assert a in s;s=s.replace(a,a.replace('font-size:var(--t-label)','font-size:10.5px'),1);${W}" \
  guards "" 17

run_case "a tenth token appears unannounced" \
  "unrecorded type token" \
  "${P}a='--t-label:10px; --t-fine:9px;';assert a in s;s=s.replace(a,'--t-label:10px; --t-fine:9px; --t-micro:8px;',1);${W}" \
  guards "" 17

run_case "fine print drifts back to 9.5px" \
  "the scale says" \
  "${P}a='--t-fine:9px;';assert a in s;s=s.replace(a,'--t-fine:9.5px;',1);${W}" \
  guards "" 17

rm -rf "$NEG"
finish "negtest681 (5.2.3 — one scale)"
