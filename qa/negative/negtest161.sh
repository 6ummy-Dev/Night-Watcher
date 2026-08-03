#!/bin/bash
# Negative-test every guard added or changed in 1.6.1. Each case mutates a
# pristine copy and requires the EXACT expected message to appear.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

G="import io;p='qa/guards.js';s=io.open(p,encoding='utf-8').read();"

echo "--- 59: every badge is the same box"
run_case "the base .bd border is removed" \
  "the base .bd rule sets no border" \
  "${P}a='font-weight:600;border:1px solid transparent;}';assert a in s;s=s.replace(a,'font-weight:600;}');${W}"

run_case "the base border is made visible" \
  "the base .bd border is not transparent" \
  "${P}a='font-weight:600;border:1px solid transparent;}';assert a in s;s=s.replace(a,'font-weight:600;border:1px solid currentColor;}');${W}"

run_case "a variant draws a thicker border" \
  "draws a 2px border against the base rule" \
  "${P}a='.bd.m{color:var(--crimson2);border:1px solid currentColor;}';assert a in s;s=s.replace(a,'.bd.m{color:var(--crimson2);border:2px solid currentColor;}');${W}"

run_case "a variant re-pads itself" \
  "sets its own padding" \
  "${P}a='.bd.o{color:var(--dim);border:1px solid currentColor;}';assert a in s;s=s.replace(a,'.bd.o{color:var(--dim);border:1px solid currentColor;padding:3px 6px;}');${W}"

echo "--- 60: one left edge for the group chips"
run_case "the chip loses its min-width" \
  "the group number chip has no min-width" \
  "${P}a='flex:none;min-width:26px;text-align:center;}';assert a in s;s=s.replace(a,'flex:none;}');${W}"

run_case "the chip stops centring its tag" \
  "the group number is not centred in its chip" \
  "${P}a='min-width:26px;text-align:center;}';assert a in s;s=s.replace(a,'min-width:26px;}');${W}"

run_case "the chip is narrowed below two characters" \
  "under the 26px a two-character tag" \
  "${P}a='min-width:26px;text-align:center;}';assert a in s;s=s.replace(a,'min-width:20px;text-align:center;}');${W}"

echo "--- 61: contrast measured on the ink that renders"
run_case "the format-badge fade comes back (the bug this release fixed)" \
  "renders --dim at opacity 0.8" \
  "${P}a='.bd.fmanim,.bd.fmlive{color:var(--dim);border:1px dashed currentColor;}';assert a in s;s=s.replace(a,'.bd.fmanim,.bd.fmlive{color:var(--dim);border:1px dashed currentColor;opacity:.8;}');${W}"

run_case "Short is faded one step further" \
  "renders --bone at opacity 0.5" \
  "${P}a='opacity:.55;}';assert a in s;s=s.replace(a,'opacity:.5;}');${W}"

run_case "a modifier is dimmed into the floor" \
  "under the 4.5:1 AA floor" \
  "${P}a='.bd.u{color:var(--steel);border:1px solid currentColor;}';assert a in s;s=s.replace(a,'.bd.u{color:var(--steel);border:1px solid currentColor;opacity:.6;}');${W}"

echo "--- 62: the numbering still enforces itself"
run_case "a new section is renumbered out of order" \
  "guard sections are out of order" \
  "${G}a='/* ---------- 61. Contrast is measured';assert a in s;s=s.replace(a,'/* ---------- 63. Contrast is measured');${W}"

run_case "a new section is missing from the INDEX" \
  "is missing from the INDEX" \
  "${G}a='     60   One left edge for the group chips\n';assert a in s;s=s.replace(a,'');${W}"

rm -rf "$NEG"
finish "1.6.1 negative tests"
