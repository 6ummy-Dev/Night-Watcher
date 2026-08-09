#!/bin/bash
# Negative-test 3.5.0 — the belt's peek, Stage B. Section 128, the smoke
# assertions that moved for the sentinel, and the CSS-sweep staging.
#
# Three of these fixtures were written before the guard was, as toggles in the
# v2 mock — the peek repointed at S.path, the entrance as a keyframe, one --hdr
# moved without the other. The mock reproduced each defect on demand; these do
# the same to a throwaway tree and require section 128 to go red for it.
#
# The Q2 pair is the one to read. The reduced-motion block is *{transition:
# none!important} — and * does not match pseudo-elements, so an entrance
# authored as a transition on ::before/::after slips it unless the block names
# them, and an entrance authored as a keyframe slips it entirely. The guard
# asserts the MECHANISM; these fixtures take each half away.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 128: the peek lights from S.mode, never from S.path (Q1)"

run_case "the peek repoints at S.path" \
  "the peek lights from S.path" \
  "${P}a='''data-lit=\"'+S.mode+'\"'''
assert a in s
s=s.replace(a,'''data-lit=\"'+S.path+'\"''',1);${W}"

run_case "the peek stops lighting at all" \
  "the peek does not light from S.mode" \
  "${P}a=''' data-lit=\"'+S.mode+'\"'''
assert a in s
s=s.replace(a,'',1);${W}"

run_case "pressed follows the view instead of the choice" \
  "no longer press from S.path" \
  "${P}a='''data-path=\"'+m[0]+'\" aria-pressed=\"'+(S.path===m[0])+'\"'''
assert a in s
s=s.replace(a,'''data-path=\"'+m[0]+'\" aria-pressed=\"'+(S.mode===m[0])+'\"''',1);${W}"

run_case "the middle chunk drifts off its third" \
  "has no position for" \
  "${P}a='.pathseg[data-lit=\"continuity\"]::after{left:26%;}'
assert a in s
s=s.replace(a,'.pathseg[data-lit=\"continuity\"]::after{left:30%;}',1);${W}"

echo "--- 128: position carries exactly one condition (F14)"

run_case "an open belt parks again" \
  "an open belt parks" \
  "${P}a='.pathseg[data-held]{position:relative;margin-bottom:0;}'
assert a in s
s=s.replace(a,'',1);${W}"

run_case "a third position condition arrives" \
  "carries 3 rules" \
  "${P}a='.pathseg[data-held]{position:relative;margin-bottom:0;}'
assert a in s
s=s.replace(a,a+'.pathseg[data-float]{position:fixed;}',1);${W}"

run_case "data-held stops reading the state" \
  "data-held does not render from S.beltOpen" \
  "${P}a='''(S.beltOpen && !S.beltDrop ? ' data-held=\"\"' : '')'''
assert a in s
s=s.replace(a,'''' data-held=\"\"''',1);${W}"

run_case "the parked offset loses its one source" \
  "not sticky at calc" \
  "${P}a='top:calc(var(--hdrh) + var(--belt-peek) - var(--beltH))'
assert a in s
s=s.replace(a,'top:37px',1);${W}"

echo "--- 128: the offsets derive from --hdrh, border included (F1/F3/B2)"

run_case "the border leaves the fallback" \
  "12 + 46 + 12 + the 1px border" \
  "${P}a='--hdrh:calc(env(safe-area-inset-top) + 71px);'
assert a in s
s=s.replace(a,'--hdrh:calc(env(safe-area-inset-top) + 70px);',1);${W}"

run_case "--ghtop stops deriving" \
  "no longer derives from --hdrh" \
  "${P}a='--ghtop:calc(var(--hdrh) + var(--belt-peek));'
assert a in s
s=s.replace(a,'--ghtop:calc(env(safe-area-inset-top) + 82px);',1);${W}"

run_case "a local fallback creeps back into a call site" \
  "its own --ghtop fallback constant" \
  "${P}a='top:var(--ghtop);z-index:2;}'
assert a in s
s=s.replace(a,'top:var(--ghtop, calc(env(safe-area-inset-top) + 70px));z-index:2;}',1);${W}"

run_case "the JS override reverts to --ghtop" \
  "does not override --hdrh" \
  "${P}a='document.documentElement.style.setProperty(\"--hdrh\", h.offsetHeight'
assert a in s
s=s.replace(a,'document.documentElement.style.setProperty(\"--ghtop\", h.offsetHeight',1);${W}"

echo "--- 128: the entrance is a mechanism reduced motion covers (Q2)"

run_case "the entrance becomes a keyframe" \
  "entrance is not a transition" \
  "${P}a='transition:transform .2s ease-out,opacity .2s ease-out;'
assert a in s
s=s.replace(a,'animation:peekin .2s ease-out;',1);${W}"

run_case "reduced motion loses the pseudo-elements" \
  "does not reach pseudo-elements" \
  "${P}a='@media (prefers-reduced-motion:reduce){*,::before,::after{transition:none!important;}}'
assert a in s
s=s.replace(a,'@media (prefers-reduced-motion:reduce){*{transition:none!important;}}',1);${W}"

echo "--- 128: the two --hdr declarations move together (Q4)"

run_case "one --hdr moves without the other" \
  "drifted apart" \
  "${P}a='--hdr:rgba(10,12,17,.96);'
assert a in s
s=s.replace(a,'--hdr:rgba(10,12,17,.9);',1);${W}"

echo "--- 128: the parked strip is not a control (F5)"

run_case "the parked buttons stay live" \
  "buttons are still live" \
  "${P}a='html[data-beltpark] .pathseg:not([data-held]):not([data-drop]) button{visibility:hidden;}'
assert a in s
s=s.replace(a,'',1);${W}"

run_case "the parked tap goes nowhere" \
  "does not drop the belt" \
  "${P}a='var pk = e.target.closest(\".pathseg\");'
assert a in s
s=s.replace(a,'var pk = null;',1);${W}"

run_case "the open belt's tap goes home too" \
  "ignores data-held" \
  "${P}a='if(pk && !pk.hasAttribute(\"data-held\") && !pk.hasAttribute(\"data-drop\")){'
assert a in s
s=s.replace(a,'if(pk){',1);${W}"

echo "--- 128: an observer on the sentinel, never a listener, never a read"

run_case "the sentinel disappears" \
  "has no park sentinel" \
  "${P}a='''<i class=\"beltguide\" aria-hidden=\"true\"></i>'''
assert a in s
s=s.replace(a,'',1);${W}"

run_case "a second scroll listener arrives" \
  "reviewed with exactly 1" \
  "${P}a='var beltIO = null, beltIncIO = null, dropArmed = false, nwScrollAdjust = 0, dropSquelch = false;'
assert a in s
s=s.replace(a,'window.addEventListener(\"scroll\", function(){});\\nvar beltIO = null, beltIncIO = null, dropArmed = false, nwScrollAdjust = 0, dropSquelch = false;',1);${W}"

run_case "render stops re-pointing the observer" \
  "does not re-point the belt observer" \
  "${P}a='  beltWatch();\\n}'
assert a in s
s=s.replace(a,'\\n}',1);${W}"

run_case "beltWatch loses sight of the sentinel" \
  "does not observe the sentinel" \
  "${P}a='var g = document.querySelector(\".beltguide\");'
assert a in s
s=s.replace(a,'var g = null;',1);${W}"

echo "--- the smoke half: the sentinel is part of the belt, and the parked state is staged"

run_case "the belt loses its sentinel (smoke)" \
  "opens with the belt" \
  "${P}a='''<i class=\"beltguide\" aria-hidden=\"true\"></i>'''
assert a in s
s=s.replace(a,'',1);${W}" \
  "smoke" "main"

run_case "the parked selectors go dead (smoke css)" \
  "every CSS rule matches something in some state" \
  "${P}a='html[data-beltpark] .pathseg:not([data-held]):not([data-drop]) button{visibility:hidden;}'
assert a in s
s=s.replace(a,'html[data-beltparked] .pathseg:not([data-held]) button{visibility:hidden;}',1);${W}" \
  "smoke" "css"

finish "negtest360"
