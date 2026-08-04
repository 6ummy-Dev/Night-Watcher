#!/bin/bash
# Negative-test 2.7.1 — four cosmetics from the 2.7.0 soak.
#
# Three of these are a pixel, a seat and a paragraph, which is exactly the sort
# of thing that drifts back the next time somebody tidies the file. The fourth
# is the interesting one: 2.7.0 moved the share card's bottom block up to clear
# Instagram's reply bar, shipped without the Story test that was supposed to
# gate it, and looked wrong. It is reverted, and the fixture below holds the
# revert — because the argument for moving it is still on the record and will
# read as unfinished work to whoever finds it next.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- the era note does not touch the header rule"

run_case "the group body loses its top padding again" \
  "the era note sits against the 1px rule" \
  "${P}s=s.replace('.gbody{display:none;padding:12px 15px 6px;}','.gbody{display:none;}',1);${W}"

echo "--- the rating sits on the badge line, not beside the link"

run_case "the rating goes back beside Where to watch, in the hero" \
  "sits next to the Where-to-watch link again" \
  "${P}s=s.replace('<div class=\"linkrow\">'+chr(39)+'+watchLinks(f)+'+chr(39)+'</div>'+chr(39)+'+','<div class=\"linkrow\">'+chr(39)+'+ratingBadge(f)+watchLinks(f)+'+chr(39)+'</div>'+chr(39)+'+',1);${W}"

run_case "the entry row drops the rating from its badges" \
  "the entry row does not carry the rating" \
  "${P}s=s.replace('+badges(f)+ratingBadge(f)+\n','+badges(f)+\n',1);${W}"

run_case "the Next-up hero drops the rating from its badges" \
  "the Next-up hero does not carry the rating" \
  "${P}s=s.replace('<div class=\"hbadges\">'+chr(39)+'+badges(f)+ratingBadge(f)','<div class=\"hbadges\">'+chr(39)+'+badges(f)',1);${W}"

run_case "a fourth seat is added that nobody named" \
  "ratingBadge() is called" \
  "${P}s=s.replace('function watchUrl(title){','function unused(f){ return ratingBadge(f); }\nfunction watchUrl(title){',1);${W}"

echo "--- the share card's bottom block stays where the eye expects it"

run_case "the card's link line is lifted back into the empty half" \
  "the share card's bottom block has moved" \
  "${P}s=s.replace('\"nightwatcher.life\", 1750','\"nightwatcher.life\", 1595',1);${W}"

echo "--- the share block reads like every other block"

run_case "the description goes back under the buttons as a centred note" \
  "the share block's description is not a plain <p>" \
  "${P}s=s.replace('<p>A story card of your progress. Drawn in your browser, nothing uploaded.</p>'+chr(39)+'+\n    ','',1)
s=s.replace('</div></div>'+chr(39)+';\n}\nfunction cardFile','</div><p class=\"note\">A story card of your progress.</p></div>'+chr(39)+';\n}\nfunction cardFile',1);${W}"

rm -rf "$NEG"
finish "2.7.1 negative tests"
