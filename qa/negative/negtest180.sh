#!/bin/bash
# Negative-test 1.8.0 — the move offer, which is invisible on the canonical
# origin and so can only be trusted as far as these fixtures go.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 77: the way back across"
run_case "the offer is removed" \
  "moveBanner() is gone" \
  "${P}import re
m=re.search(r'function moveBanner\\(\\)\\{.*?\\n\\}\\n',s,re.S);assert m
s=s[:m.start()]+s[m.end():]
a='moveBanner() + ';assert a in s;s=s.replace(a,'',1);${W}"

run_case "the offer builds its link with restoreLink()" \
  "that is a link back to the origin being left" \
  "${P}a='esc(n ? SITE + \"#nw=\" + exportCode() : SITE)';assert a in s
s=s.replace(a,'esc(n ? restoreLink(exportCode()) : SITE)',1);${W}"

run_case "the offer stops carrying a code" \
  "leaves every tick behind" \
  "${P}a='SITE + \"#nw=\" + exportCode()';assert a in s;s=s.replace(a,'SITE',1);${W}"

run_case "the condition becomes a date instead of an origin" \
  "decides by date" \
  "${P}a='  var http = (location.protocol === \"http:\" || location.protocol === \"https:\");\n  if(!http) return false;'
assert a in s;s=s.replace(a,'  if(new Date() > new Date(\"2027-01-01\")) return false;',1);${W}"

run_case "the origin test stops comparing against SITE" \
  "does not compare against SITE" \
  "${P}a='         SITE.replace(/\\\\/+\$/, \"\");';assert a in s
s=s.replace(a,'         \"https://nightwatcher.life\";',1);${W}"

run_case "the test says the canonical origin is the old one" \
  "would appear where there is nothing to move" \
  "${P}a='  return (location.origin + location.pathname).replace(/\\\\/+\$/, \"\") !==';assert a in s
s=s.replace(a,'  return true || (location.origin + location.pathname).replace(/\\\\/+\$/, \"\") !==',1);${W}"

run_case "the offer renders inside one view only" \
  "a shared link lands on" \
  "${P}a='  v.innerHTML = moveBanner() + (S.tab === \"home\" ? viewHome()';assert a in s
s=s.replace(a,'  v.innerHTML = (S.tab === \"home\" ? viewHome()',1);${W}"

echo "--- smoke: what a returning reader actually sees"
run_case "the offer never reaches the old origin" \
  "the old origin offers the way across" \
  "${P}a='if(moveHid || !offCanonical()) return \"\";';assert a in s
s=s.replace(a,'if(true) return \"\";',1);${W}" \
  "smoke"

run_case "the link points back at the origin being left" \
  "it points at the canonical origin, not this one" \
  "${P}a='esc(n ? SITE + \"#nw=\" + exportCode() : SITE)';assert a in s
s=s.replace(a,'esc(location.origin + location.pathname + \"#nw=\" + exportCode())',1);${W}" \
  "smoke"

echo "--- the addresses themselves"
run_case "the canonical link is left pointing at the old home" \
  "canonical" \
  "${P}a='<link rel=\"canonical\" href=\"https://nightwatcher.life/\">';assert a in s
s=s.replace(a,'<link rel=\"canonical\" href=\"https://6ummy-dev.github.io/Night-Watcher/\">',1);${W}"

rm -rf "$NEG"
finish "1.8.0 negative tests"
