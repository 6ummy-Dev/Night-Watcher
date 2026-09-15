#!/bin/bash
# negtest475 — 4.0.5. The band iOS paints under the installed app.
#
# iOS 26 standalone grants the web app a viewport short of the screen by a
# phantom toolbar height and paints the dead band below the webview from
# <meta name="theme-color"> — frosted, so the dark theme's navy showed as a
# grey stripe under the tab bar. The band is outside the webview (touch-dead,
# owner-verified on device 2026-08-17), so the fix is not layout: applyTheme()
# announces #000000 whenever the app is installed, because black is the one
# colour the frosting returns unchanged — proven live by the darker theme.
# The guard pins that branch by shape; these fixtures prove the pin bites,
# and one green_case proves an unrelated rewording does not trip it.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 28: the standalone branch is the fix, and a tidy refactor deletes it"

run_case "applyTheme() collapses back to the table lookup (the pre-4.0.5 shape)" \
  "no longer picks APPBAR when installed" \
  "${P}a='isStandalone() ? APPBAR : THEMEBAR'
assert a in s
s=s.replace(a,'THEMEBAR',1);${W}"

run_case "standalone answers the browser table instead of the app map" \
  "no longer picks APPBAR when installed" \
  "${P}a='isStandalone() ? APPBAR : THEMEBAR';assert a in s
s=s.replace(a,'isStandalone() ? THEMEBAR : THEMEBAR',1);${W}" \
  guards "" 28

run_case "APPBAR is tidied away" \
  "APPBAR is missing" \
  "${P}a='var APPBAR = {dark:\"#0A0C11\", darker:\"#000000\"};\n';assert a in s
s=s.replace(a,'',1);${W}" \
  guards "" 28

run_case "APPBAR drifts off the header colour" \
  "does not carry the header colour" \
  "${P}a='var APPBAR = {dark:\"#0A0C11\"';assert a in s
s=s.replace(a,'var APPBAR = {dark:\"#0C111C\"',1);${W}" \
  guards "" 28

run_case "a theme loses its APPBAR entry" \
  "has no APPBAR colour" \
  "${P}a='var APPBAR = {dark:\"#0A0C11\", darker:\"#000000\"};';assert a in s
s=s.replace(a,'var APPBAR = {dark:\"#0A0C11\"};',1);${W}" \
  guards "" 28

run_case "body goes back to flat black behind the app" \
  "body no longer paints var(--hdr)" \
  "${P}a='body{background:var(--hdr);color:var(--bone)';assert a in s
s=s.replace(a,'body{background:#000;color:var(--bone)',1);${W}" \
  guards "" 28

NEG_ARGS="--bless"
green_case "the map local is renamed and stays green" \
  "${P}a='  var T = isStandalone() ? APPBAR : THEMEBAR;\n  if(m) m.setAttribute(\"content\", T[S.theme] || T.dark);'
assert a in s
s=s.replace(a,'  var BAR = isStandalone() ? APPBAR : THEMEBAR;\n  if(m) m.setAttribute(\"content\", BAR[S.theme] || BAR.dark);',1);${W}"
NEG_ARGS=

rm -rf "$NEG"
finish "negtest475"
