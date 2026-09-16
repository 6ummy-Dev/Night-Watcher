#!/bin/bash
# negtest478 — 4.0.8 built the viewport heal and 4.0.9 the pad reclaim, both
# answers to WebKit bug 301108 under `black-translucent`. 6.0.9 drops that tag
# for `black` (6.1.1: `default`, the one tag measured opaque on iOS 27) and
# retires both: under an opaque bar the gap they
# measure is the status bar itself. Section 64 must go red if either returns,
# or if the tab bar's pad stops being the plain inset. 6.1.3 takes the inset
# off the installed portrait footer with one CSS rule instead (the owner's
# call, 6.0.4's 59pt bar); §64 holds that rule and its place after the rules
# it overrides.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- the pad is the plain inset"

run_case "the pad goes back to the 4.0.9 reclaim form" \
  "not the plain env(safe-area-inset-bottom)" \
  "${P}a='padding-bottom:env(safe-area-inset-bottom);}'
assert a in s
s=s.replace(a,'padding-bottom:max(0px, calc(env(safe-area-inset-bottom) - var(--vpdead, 0px)));}',1);${W}" \
  guards "" 64

echo "--- 6.1.3: the installed portrait footer is one CSS rule"

run_case "the installed footer rule is deleted" \
  "the installed portrait footer rule is gone or changed" \
  "${P}a='@media (display-mode: standalone) and (orientation: portrait){#tabs{padding-bottom:0;}.toast{bottom:calc(var(--tab-h) + 16px);}}\n'
assert a in s
s=s.replace(a,'',1);${W}" \
  guards "" 64

run_case "the rule loses its portrait condition" \
  "the installed portrait footer rule is gone or changed" \
  "${P}a='@media (display-mode: standalone) and (orientation: portrait){#tabs{'
assert a in s
s=s.replace(a,'@media (display-mode: standalone){#tabs{',1);${W}" \
  guards "" 64

run_case "the toast keeps the inset when installed" \
  "the installed portrait footer rule is gone or changed" \
  "${P}a='{#tabs{padding-bottom:0;}.toast{bottom:calc(var(--tab-h) + 16px);}}'
assert a in s
s=s.replace(a,'{#tabs{padding-bottom:0;}}',1);${W}" \
  guards "" 64

run_case "the rule moves above the rules it overrides" \
  "sits above the rules it overrides" \
  "${P}a='@media (display-mode: standalone) and (orientation: portrait){#tabs{padding-bottom:0;}.toast{bottom:calc(var(--tab-h) + 16px);}}\n'
assert a in s
s=s.replace(a,'',1)
b='@media (display-mode: standalone){#app{height:100%;}}\n'
assert b in s
s=s.replace(b,b+a,1);${W}" \
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
