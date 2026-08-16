#!/bin/bash
# Negative-test 3.6.0 — the belt's drop, Stage C. Section 129, the grown
# halves of 96 and 128, and the smoke sweep's dropped state.
#
# The release's headline is a guard that did NOT change: section 120 ships
# untouched, because the dropped pouches hang off the strip through a CSS
# anchor instead of a measurement. Half of these fixtures exist to keep that
# true — they put back the page-centred pouch, the leaked treatment, the
# hand-rolled close — and require the sections that own those refusals to go
# red for it.
#
# The close fixtures are the ones to read. The v2 mock shipped the same
# mistake four times in different clothes: a treatment written for one state,
# applied to all of them. The exits here take one state's rule away at a time
# — the ride home, the travel distance, the compensation — and each must fail
# alone.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 129: the belt paints in front of its pouches, each in front of the next"

run_case "the dropped pouches lose their layer" \
  "no longer paints in front of its own pouches" \
  "${P}a='width:min(100% - 52px, 708px);margin:0;z-index:20;}'
assert a in s
s=s.replace(a,'width:min(100% - 52px, 708px);margin:0;}',1);${W}"

run_case "the stack flattens back to flush" \
  "three-plane stack is gone" \
  "${P}a='.includes .scope:not(.fmt){z-index:1;margin:-5px 11px 0;}'
assert a in s
s=s.replace(a,'.includes .scope:not(.fmt){z-index:1;margin:0 0 6px;}',1);${W}"

echo "--- 129: the pouches hang off the strip, never off the page (F11)"

run_case "the strip loses its anchor name" \
  "lost its anchor name" \
  "${P}a='z-index:2;anchor-name:--belt;'
assert a in s
s=s.replace(a,'z-index:2;',1);${W}"

run_case "the pouches centre on the page again" \
  "not anchored to the strip's own box" \
  "${P}a='left:calc(anchor(left) + 8px);'
assert a in s
s=s.replace(a,'left:50%;',1);${W}"

run_case "the dropped treatment leaks to a third site" \
  "reviewed with exactly 2" \
  "${P}a='.includes .scope.fmt{z-index:2;}'
assert a in s
s=s.replace(a,'.includes .scope.fmt{z-index:2;position-anchor:--belt;}',1);${W}"

echo "--- 129: the drop is state, scoped to its state, and never saved (F13)"

run_case "the strip drops unconditionally" \
  "does not render from S.beltDrop exactly once" \
  "${P}a='''(S.beltOpen && !S.beltDrop ? ' data-held=\"\"' : '')+(S.beltDrop ? ' data-drop=\"\"' : '')'''
assert a in s
s=s.replace(a,'''(S.beltOpen && !S.beltDrop ? ' data-held=\"\"' : '')+' data-drop=\"\"''',1);${W}"

run_case "the pouches forget the drop" \
  "pouches' data-drop does not render from S.beltDrop" \
  "${P}a='''\"'+(S.beltDrop ? ' data-drop=\"\"' : '')+'>'+formatSwitch()'''
assert a in s
s=s.replace(a,'''\">'+formatSwitch()''',1);${W}"

run_case "the drop survives a reload" \
  "beltDrop is written to the saved payload" \
  "${P}a='insOff:S.insOff ? true : undefined}'
assert a in s
s=s.replace(a,'insOff:S.insOff ? true : undefined, beltDrop:S.beltDrop}',1);${W}"

echo "--- 129/96: every close routes through one function (F12)"

run_case "the buckle closes by hand again" \
  "no longer routes through closeBelt" \
  "${P}a='else if(!document.querySelector(\".includes.closing\")){ closeBelt(\"buckle\"); }'
assert a in s
s=s.replace(a,'else if(!document.querySelector(\".includes.closing\")){ S.beltOpen = false; render(); }',1);${W}"

run_case "a second door out of the open state" \
  "site(s) outside" \
  "${P}a='  dropArmed = false;'
assert a in s
s=s.replace(a,'  dropArmed = false; if(S.beltDrop) S.beltOpen = false;',1);${W}"

run_case "the scroll door bypasses the exit" \
  "a close path bypasses closeBelt" \
  "${P}a='closeBelt(\"drop\");'
assert a in s
s=s.replace(a,'closeBelt(\"later\");',1);${W}"

run_case "the strip keeps its drop through the close" \
  "breaks the ride home" \
  "${P}a='  if(endDrop && seg) seg.removeAttribute(\"data-drop\");'
assert a in s
s=s.replace(a,'',1);${W}"

echo "--- 129: the exit is a distance, not an animation (F12)"

run_case "the exit shrinks back to a fade" \
  "no longer travels behind the strip" \
  "${P}a='.includes.closing .scope.fmt{--out:-115%;}'
assert a in s
s=s.replace(a,'.includes.closing .scope.fmt{--out:-12px;}',1);${W}"

run_case "the exit forgets the variable" \
  "no longer travels behind the strip" \
  "${P}a='@keyframes pouchout{to{transform:translateY(var(--out,-10px));opacity:0;}}'
assert a in s
s=s.replace(a,'@keyframes pouchout{to{transform:translateY(-10px);opacity:0;}}',1);${W}"

echo "--- 129: the auto-close pays what actually moved (F6)"

run_case "the compensation is guessed" \
  "no longer measures its compensation" \
  "${P}a='nwScrollAdjust = Math.max(0, en.boundingClientRect.height + 14);'
assert a in s
s=s.replace(a,'nwScrollAdjust = 90;',1);${W}"

run_case "render stops paying the close" \
  "does not consume the close compensation" \
  "${P}a='  if(nwScrollAdjust){ keep = Math.max(0, keep - nwScrollAdjust); nwScrollAdjust = 0; }\\n'
assert a in s
s=s.replace(a,'',1);${W}"

run_case "the drop arms twice" \
  "can stack listeners" \
  "${P}a='  if(dropArmed) return;\\n'
assert a in s
s=s.replace(a,'',1);${W}"

run_case "the retraction hears the render's own clamp" \
  "listens to render's own scroll clamp" \
  "${P}a='  if(dropSquelch){ armDropScroll(); return; }\\n'
assert a in s
s=s.replace(a,'',1);${W}"

echo "--- 129, the 3.6.1 soak pair: opaque rows, and a drop above the pinned headers"

run_case "the pouch rows go transparent again" \
  "lost their opaque background" \
  "${P}a='.includes .scope{position:relative;background:var(--ink);'
assert a in s
s=s.replace(a,'.includes .scope{position:relative;',1);${W}"

run_case "the dropped belt slips behind the era headers" \
  "ABOVE the pinned era headers" \
  "${P}a='box-shadow:0 12px 26px rgba(0,0,0,.55);margin-bottom:0;z-index:21;}'
assert a in s
s=s.replace(a,'box-shadow:0 12px 26px rgba(0,0,0,.55);margin-bottom:0;}',1);${W}"

run_case "the gate stops probing anchor-size" \
  "stopped probing the exact shapes" \
  "${P}a='@supports (position-anchor:--belt) and (top:calc(anchor(bottom) - 4px)) and (width:calc(anchor-size(width) - 16px)){'
assert a in s
s=s.replace(a,'@supports (position-anchor:--belt) and (top:calc(anchor(bottom) - 4px)){',1);${W}"

echo "--- 129, the 3.6.3 soak pair: the drop arrives closed, and a selector is not a door"

run_case "the drop opens the pouches again" \
  "the drop opens the pouches again" \
  "${P}a='function beltDropOpen(){\n  S.beltDrop = true;\n  S.beltDropping = true; render(); S.beltDropping = false;\n}'
assert a in s
s=s.replace(a,'function beltDropOpen(){\n  S.beltDrop = true;\n  if(!S.beltOpen) openBelt();\n  else render();\n}',1);${W}"

run_case "the path tap goes home from a dropped belt" \
  "path tap from a dropped belt goes home" \
  "${P}a='    if(!S.beltDrop) scrollPut(0);'
assert a in s
s=s.replace(a,'    scrollPut(0);',1);${W}"

echo "--- the smoke half: the dropped state is staged, and its selectors must live"

run_case "the dropped strip selector goes dead (smoke css)" \
  "every CSS rule matches something in some state" \
  "${P}a='.pathseg[data-drop]{top:var(--hdrh);'
assert a in s
s=s.replace(a,'.pathseg[data-dropped]{top:var(--hdrh);',1);${W}" \
  "smoke" "css"

finish "negtest370"
