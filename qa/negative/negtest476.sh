#!/bin/bash
# negtest476 — 4.0.6. The peek centres on the viewport; the panels must too.
# And the glow is a pulse on the handle, not a light source for the page.
#
# Two owner reports against 4.0.5: the peek sat 7.5px off the column on any
# desktop with classic scrollbars (stable reserves the gutter on one side, so
# the column centres against viewport-minus-scrollbar while the
# header-anchored peek centres against the viewport), and the 4.0.4 all-round
# halo bled through the header's backdrop-filter into a full-width seam and
# washed into the content below the strip. The fixes are one keyword
# (both-edges) and one shadow shape (0 2px 8px -3px) — each exactly the size
# of change a tidy revert erases, so each is pinned, and this suite proves
# both pins bite.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 18: the gutter loses both-edges and the peek drifts off the column"

run_case "the gutter reverts to one-sided stable (the pre-4.0.6 shape)" \
  "missing scrollbar-gutter:stable both-edges" \
  "${P}a='main,.panel{scrollbar-gutter:stable both-edges;}';assert a in s
s=s.replace(a,'main,.panel{scrollbar-gutter:stable;}',1);${W}"

run_case "the gutter leaves entirely" \
  "missing scrollbar-gutter:stable both-edges" \
  "${P}a='main,.panel{scrollbar-gutter:stable both-edges;}';assert a in s
s=s.replace(a,'',1);${W}"

echo "--- 130: the halo comes back and lights the page instead of the handle"

run_case "the glow reverts to the 4.0.4 all-round halo" \
  "not the static two-layer corner hug" \
  "${P}a='box-shadow:0 1px 5px -1px var(--signaledge), 0 3px 12px -3px var(--signaledge);}'
assert a in s
s=s.replace(a,'box-shadow:0 0 16px 0 var(--signaledge);}',1);${W}"

run_case "the glow keeps the shape but swaps in a new colour" \
  "not the static two-layer corner hug" \
  "${P}a='box-shadow:0 1px 5px -1px var(--signaledge), 0 3px 12px -3px var(--signaledge);}'
assert a in s
s=s.replace(a,'box-shadow:0 1px 5px -1px rgba(255,207,31,.55), 0 3px 12px -3px rgba(255,207,31,.55);}',1);${W}"

rm -rf "$NEG"
finish "negtest476"
