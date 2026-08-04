#!/bin/bash
# Negative-test every guard added or changed in 2.2.0 — the three soak fixes
# (the rating badge in Then and the hero, the buckle's narrow-viewport rule,
# the share block's card form) and the SMOKE_ONLY refusal. The tune-up's
# render work needs no fixtures of its own: byte-identical markup means the
# existing 283 are its test, and this suite is only what 2.2.0 newly promises.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 92: the rating badge reaches every deciding seat"
run_case "the Then peek drops its rating badge" \
  "the Then peek does not carry the rating on its badge line" \
  "${P}a='badges(x)+ratingBadge(x)';assert s.count(a)==1
s=s.replace(a,'badges(x)',1);${W}"

# Both rewritten in 2.7.1, when the rating moved off the link row and onto the
# badge lines. The seats are the same three; only where they sit changed.
run_case "the hero drops the rating from its badge line" \
  "the Next-up hero does not carry the rating" \
  "${P}a='<div class=\"hbadges\">'+chr(39)+'+badges(f)+ratingBadge(f)';assert a in s
s=s.replace(a,'<div class=\"hbadges\">'+chr(39)+'+badges(f)',1);${W}"

run_case "a fourth seat appears that nobody named" \
  "ratingBadge() is called" \
  "${P}a='function watchUrl(title){';assert a in s
s=s.replace(a,'function spare(f){ return ratingBadge(f); }\n'+a,1);${W}"

echo "--- 96: the buckle fits the narrowest phone"
run_case "the narrow-viewport rule is dropped" \
  "the buckle has no narrow-viewport rule" \
  "${P}a='@media (max-width:375px){.pathseg .bst{font-size:7px;}.pathseg .bs2{font-size:6.5px;}.pathseg .buckle{padding:4px 10px 4px 2px;}}'
assert a in s
s=s.replace(a,'',1);${W}"

echo "--- 98: the share block is a card like all the others"
run_case "the card chrome falls back off" \
  "the share block is not a card" \
  "${P}a='<div class=\"bk sharecard\"><h3>Share your progress</h3>'
assert a in s
s=s.replace(a,'<div class=\"sharecard\"><p class=\"qhead\" style=\"margin:26px 0 8px\">Share your progress</p>',1);${W}"

run_case "the title whispers again beside the card" \
  "is a qhead again" \
  "${P}a='<h3>Share your progress</h3>';assert s.count(a)==1
s=s.replace(a,a+'<p class=\"qhead\">Share your progress</p>',1);${W}"

echo "--- smoke: a fixture cannot name a phase that does not exist"
run_case "a scoped run is asked for a phase nobody wrote" \
  "unknown SMOKE_ONLY phase" \
  "pass" \
  "smoke" "everything"

finish "negtest220"
