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
m=re.search(r'var vpTries[\\s\\S]*?visualViewport.addEventListener\\(\"resize\", function\\(\\)\\{ setTimeout\\(vpHeal, 120\\); \\}\\);\\n  \\}\\n\\}',s)
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
  "${P}a='  scrollPut(keep);\n  snapTo(S.tab);\n}'
assert a in s
s=s.replace(a,'}',1);${W}"

run_case "the boot trigger is dropped" \
  "lost its triggers" \
  "${P}a='  setTimeout(vpHeal, 300);'
assert a in s
s=s.replace(a,'',1);${W}"

rm -rf "$NEG"
finish "negtest478"
