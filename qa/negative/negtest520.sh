#!/bin/bash
# negtest520 — 4.3.1. One first-content offset, and no inline margins.
#
# 4.3.0 shipped with only Progress standing 18px clear of the parked belt,
# because its first block carried a private inline margin-top — an offset
# with a second source, invisible to every rule sweep. 4.3.1 moved the
# clearance to the belt's own bottom margin and struck every inline margin
# from the rendered markup; section 128 now pins both. Fixtures 1 and 2 shrink each of the pair
# back to 10px — the parked rule re-states the bottom margin, and the parked
# state is the one a chosen path actually renders, which is where the first
# cut of this release itself missed. Fixture 2 replants the exact patch that
# caused the drift and demands §128 refuse it at the source; fixture 3
# replants it and demands smoke see it in the rendered DOM, because a
# patch applied at render time is precisely the kind the source pin was
# too late to catch once before.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 128: the belt's bottom margin is the one source"

run_case "the first-content clearance shrinks back to 10px" \
  "the belt's bottom margin is not 18px" \
  "${P}a='.pathseg{display:flex;margin:0 0 18px;';assert a in s
s=s.replace(a,'.pathseg{display:flex;margin:0 0 10px;',1);${W}" \
  guards "" 128

run_case "the PARKED belt's clearance shrinks while the base stays 18" \
  "the parked belt's bottom margin is not 18px" \
  "${P}a=') 0 18px;}';assert a in s
s=s.replace(a,') 0 10px;}',1);${W}" \
  guards "" 128

echo "--- 128: offsets live in the stylesheet"

run_case "the Progress inline margin patch returns" \
  "an inline margin patch is back in the rendered markup" \
  "${P}a='<div class=\"pies\">';assert s.count(a)==1
s=s.replace(a,'<div class=\"pies\" style=\"margin-top:18px\">',1);${W}" \
  guards "" 128

echo "--- smoke: the rendered DOM carries no inline margin"

run_case "a render-time margin patch is caught in the DOM" \
  "no rendered element carries an inline margin" \
  "${P}a='<div class=\"pies\">';assert s.count(a)==1
s=s.replace(a,'<div class=\"pies\" style=\"margin-top:18px\">',1);${W}" \
  smoke main

finish "4.3.1 one-offset fixtures"
