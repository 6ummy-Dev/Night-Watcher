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
  "no longer announces #000000 when installed" \
  "${P}a='isStandalone() ? \"#000000\"'
assert a in s
s=s.replace(a,'THEMEBAR[S.theme] ? THEMEBAR[S.theme]',1);${W}"

run_case "standalone announces the theme's own navy instead of black" \
  "no longer announces #000000 when installed" \
  "${P}a='isStandalone() ? \"#000000\"';assert a in s
s=s.replace(a,'isStandalone() ? \"#0C111C\"',1);${W}"

NEG_ARGS="--bless"
green_case "the browser arm's fallback is reworded and stays green" \
  "${P}a='(THEMEBAR[S.theme] || THEMEBAR.dark)';assert a in s
s=s.replace(a,'(THEMEBAR[S.theme] || \"#0C111C\")',1);${W}"
NEG_ARGS=

rm -rf "$NEG"
finish "negtest475"
