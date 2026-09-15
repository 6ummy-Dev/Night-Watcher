#!/bin/bash
# negtest478 — 4.0.8. The heal, and every gate that keeps it from biting back.
#
# vpHeal() is the one thing that asks WebKit to re-resolve a stale standalone
# viewport — the document never scrolls, so nothing else ever will. Its gates
# are not decoration: without the focus check it eats the keyboard mid-word,
# without the shrink gate it toggles #app on every iPad window, without the
# restore half a heal costs the reader their scroll position. Each clause in
# the guard must be able to go red, or the next tidy refactor deletes a gate
# and the fix becomes the bug.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- the heal itself"

run_case "vpHeal() is deleted whole" \
  "vpHeal() is gone" \
  "${P}import re
m=re.search(r'var vpTries[\\s\\S]*?visualViewport.addEventListener\\(\"resize\", function\\(\\)\\{ setTimeout\\(vpTick, 120\\); \\}\\);\\n  \\}\\n\\}',s)
assert m
s=s.replace(m.group(0),'',1);${W}"

echo "--- the gates"

run_case "the standalone gate falls off" \
  "lost its standalone or shrink gate" \
  "${P}a='if(!isStandalone() || vpTries >= 6 || !vpShrunk()) return;'
assert a in s
s=s.replace(a,'if(vpTries >= 6) return;',1);${W}"

run_case "the focused-input check is tidied away" \
  "no longer checks the focused element" \
  "${P}a='  var ae = document.activeElement;\n  if(ae && (ae.tagName === \"INPUT\" || ae.tagName === \"TEXTAREA\")) return;\n  vpTries++;'
assert a in s
s=s.replace(a,'  vpTries++;',1);${W}"

echo "--- the restore half"

run_case "the heal stops restoring the scroll and the snap" \
  "no longer restores what the display toggle destroys" \
  "${P}a='  scrollPut(keep);\n  snapTo(S.tab);\n'
assert a in s
s=s.replace(a,'',1);${W}"

run_case "the boot trigger is dropped" \
  "viewport triggers are gone" \
  "${P}a='  setTimeout(vpTick, 300);'
assert a in s
s=s.replace(a,'',1);${W}"

echo "--- 4.0.9: the measured gap, and the pad it pays back"

run_case "the 4.0.9 reclaim is wired back onto the pad" \
  "not the plain env(safe-area-inset-bottom)" \
  "${P}a='padding-bottom:env(safe-area-inset-bottom);}'
assert a in s
s=s.replace(a,'padding-bottom:max(0px, calc(env(safe-area-inset-bottom) - var(--vpdead, 0px)));}',1);${W}"

run_case "the pad loses its inset altogether" \
  "not the plain env(safe-area-inset-bottom)" \
  "${P}a='padding-bottom:env(safe-area-inset-bottom);}'
assert a in s
s=s.replace(a,'padding-bottom:0;}',1);${W}" \
  guards "" 64

run_case "--vpdead comes back on the toast" \
  "is back" \
  "${P}a='bottom:calc(var(--tab-h) + env(safe-area-inset-bottom) + 16px);'
assert a in s
s=s.replace(a,'bottom:calc(var(--tab-h) + max(0px, env(safe-area-inset-bottom) - var(--vpdead, 0px)) + 16px);',1);${W}" \
  guards "" 64

run_case "vpSync is reintroduced" \
  "vpSync() is back" \
  "${P}a='function vpTick(){'
assert a in s
s=s.replace(a,'function vpSync(){}\nfunction vpTick(){',1);${W}" \
  guards "" 64

run_case "the force flag is tidied away" \
  "force flag is gone" \
  "${P}a='var vpForce = false;\n'
assert a in s
s=s.replace(a,'',1);${W}" \
  guards "" 64

run_case "vpRotate leaves the force flag set" \
  "is not the re-arm" \
  "${P}a='  try{ vpHeal(); } finally { vpForce = false; }'
assert a in s
s=s.replace(a,'  vpHeal();',1);${W}" \
  guards "" 64

run_case "the rotation trigger loses its second delay" \
  "orientationchange trigger is gone" \
  "${P}a='    setTimeout(vpRotate, 900);\n'
assert a in s
s=s.replace(a,'',1);${W}" \
  guards "" 64

run_case "the heal forgets to give up" \
  "no longer gives up when a toggle changes nothing" \
  "${P}a='  if(vpGap() === before) vpTries = 6;\n'
assert a in s
s=s.replace(a,'',1);${W}"

rm -rf "$NEG"
finish "negtest478"
