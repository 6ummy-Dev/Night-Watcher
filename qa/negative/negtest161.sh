#!/bin/bash
# Negative-test every guard added or changed in 1.6.1. Each case mutates a
# pristine copy and requires the EXACT expected message to appear.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

G="$(pro qa/guards.js)"

echo "--- 59: every badge is the same box"
run_case "the base .bd border is removed" \
  "the base .bd rule sets no border" \
  "${P}a='font-weight:600;border:1px solid transparent;}';assert a in s;s=s.replace(a,'font-weight:600;}');${W}"

run_case "the base border is made visible" \
  "the base .bd border is not transparent" \
  "${P}a='font-weight:600;border:1px solid transparent;}';assert a in s;s=s.replace(a,'font-weight:600;border:1px solid currentColor;}');${W}"

run_case "a variant draws a thicker border" \
  "draws a 2px border against the base rule" \
  "${P}a='.bd.u{color:var(--steel);border:1px solid currentColor;}';assert a in s;s=s.replace(a,'.bd.u{color:var(--steel);border:2px solid currentColor;}');${W}"

run_case "a variant re-pads itself" \
  "sets its own padding" \
  "${P}a='.bd.o{color:var(--dim);border:1px solid currentColor;}';assert a in s;s=s.replace(a,'.bd.o{color:var(--dim);border:1px solid currentColor;padding:3px 6px;}');${W}"

echo "--- 60: one left edge for the group chips"
run_case "the chip loses its min-width" \
  "the group number chip has no min-width" \
  "${P}a='flex:none;min-width:26px;text-align:center;position:relative;}';assert a in s;s=s.replace(a,'flex:none;position:relative;}');${W}"

run_case "the chip stops centring its tag" \
  "the group number is not centred in its chip" \
  "${P}a='min-width:26px;text-align:center;position:relative;}';assert a in s;s=s.replace(a,'min-width:26px;position:relative;}');${W}"

run_case "the chip is narrowed below two characters" \
  "under the 26px a two-character tag" \
  "${P}a='min-width:26px;text-align:center;position:relative;}';assert a in s;s=s.replace(a,'min-width:20px;text-align:center;position:relative;}');${W}"

echo "--- 61: contrast measured on the ink that renders"
run_case "the format-badge fade comes back (the bug this release fixed)" \
  "renders --dim at opacity 0.8" \
  "${P}a='.bd.fmanim{color:var(--dim);border:1px dashed currentColor;}';assert a in s;s=s.replace(a,'.bd.fmanim{color:var(--dim);border:1px dashed currentColor;opacity:.8;}');${W}" \
  guards "" 61

# 3.8.4 moved the SHORT fade from .55 to .7 — the fade guard itself forced the
# move the moment --bone dimmed under the darker theme (bone@.55 over the
# darker cards is 3.5:1). The anchor below is the full .bd.s rule rather than
# the bare opacity token: "opacity:.7;}" appears four times in the file, and a
# bare-token replace would mutate rules this case never meant to touch.
run_case "Short is faded one step further" \
  "renders --bone at opacity 0.5" \
  "${P}a='.bd.s{color:var(--bone);border:1px solid currentColor;opacity:.7;}';assert a in s;s=s.replace(a,'.bd.s{color:var(--bone);border:1px solid currentColor;opacity:.5;}');${W}" \
  guards "" 61

run_case "a modifier is dimmed into the floor" \
  "under the 4.5:1 AA floor" \
  "${P}a='.bd.u{color:var(--steel);border:1px solid currentColor;}';assert a in s;s=s.replace(a,'.bd.u{color:var(--steel);border:1px solid currentColor;opacity:.6;}');${W}"

# The two guard-66 fixtures this suite carried (renumber a section; drop an
# INDEX row) were copies of negtest.sh's, three suites over; struck in 4.9.0.

rm -rf "$NEG"
finish "1.6.1 negative tests"
