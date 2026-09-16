#!/bin/bash
# negtest478 — 4.0.8 built the viewport heal and 4.0.9 the pad reclaim, both
# answers to WebKit bug 301108 under `black-translucent`. 6.0.9 drops that tag
# for `black` (6.1.1: `default`, the one tag measured opaque on iOS 27) and
# retires both: under an opaque bar the gap they
# measure is the status bar itself. Section 64 must go red if either returns,
# or if the tab bar's pad stops being the plain inset.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- the pad is the plain inset"

run_case "the pad goes back to the 4.0.9 reclaim form" \
  "not the plain env(safe-area-inset-bottom)" \
  "${P}a='padding-bottom:env(safe-area-inset-bottom);}'
assert a in s
s=s.replace(a,'padding-bottom:max(0px, calc(env(safe-area-inset-bottom) - var(--vpdead, 0px)));}',1);${W}" \
  guards "" 64

echo "--- the workaround stays retired"

run_case "--vpdead comes back on the toast alone" \
  "the 301108 viewport workaround is back" \
  "${P}a='bottom:calc(var(--tab-h) + env(safe-area-inset-bottom) + 16px);'
assert a in s
s=s.replace(a,'bottom:calc(var(--tab-h) + max(0px, env(safe-area-inset-bottom) - var(--vpdead, 0px)) + 16px);',1);${W}" \
  guards "" 64

run_case "the heal comes back, without the var" \
  "the 301108 viewport workaround is back" \
  "${P}a='\nrestore();\ntry{ routeHash(); }'
assert a in s
s=s.replace(a,'\nfunction vpHeal(){}\nrestore();\ntry{ routeHash(); }',1);${W}" \
  guards "" 64

rm -rf "$NEG"
finish "negtest478"
