#!/bin/bash
# negtest730 — 6.1.1, "Measure the flip"; 6.1.2, "Put it back"; 6.1.3,
# "Clean frame". The readout (6.1.1) and the rotation reseat (6.1.2) are
# gone, and section 162 keeps the installed frame free of script: no
# rotation script or its state, no readout, no listener for the phone
# turning, nothing watching the visual viewport. The flip is recorded as
# iOS 27's (WebKit bug 301994). Plus §153's `default` tag. Every fixture
# names its section.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 153: the status-bar tag is default"

run_case "the tag goes back to black" \
  "required tag(s): apple-mobile-web-app-status-bar-style" \
  "${P}a='<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\">';assert a in s;s=s.replace(a,'<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black\">',1);${W}" \
  guards "" 153

echo "--- 162: the rotation script stays out"

run_case "the reseat function comes back" \
  "6.1.2's rotation script is back" \
  "${P}a='\nfunction splashOff(){';assert a in s;s=s.replace(a,'\nfunction reseat(){}'+a,1);${W}" \
  guards "" 162

run_case "the watcher comes back under its own name" \
  "6.1.2's rotation script is back" \
  "${P}a='\nfunction splashOff(){';assert a in s;s=s.replace(a,'\nfunction seatWatch(){}'+a,1);${W}" \
  guards "" 162

run_case "only the reseat's state comes back" \
  "6.1.2's rotation script is back" \
  "${P}a='var SKEY = \"batwatch-settings\";\n';assert a in s;s=s.replace(a,a+'var seatTop = 0, seatTries = 0;\n',1);${W}" \
  guards "" 162

run_case "the readout comes back" \
  "6.1.1's frame readout is back" \
  "${P}a='<div class=\"toast\" id=\"toast\" role=\"status\" aria-live=\"polite\"></div>\n';assert a in s;s=s.replace(a,a+'<div id=\"fprobe\" aria-hidden=\"true\"></div>\n',1);${W}" \
  guards "" 162

echo "--- 162: nothing listens for the turn"

run_case "an orientation query listener arrives" \
  "a script listens for the phone turning" \
  "${P}a='\nfunction splashOff(){';assert a in s;s=s.replace(a,'\nfunction turnHook(){ matchMedia(\"(orientation: portrait)\").addEventListener(\"change\", splashOff); }'+a,1);${W}" \
  guards "" 162

run_case "an orientationchange listener arrives" \
  "a script listens for the phone turning" \
  "${P}a='\nfunction splashOff(){';assert a in s;s=s.replace(a,'\nfunction turnHook(){ window.addEventListener(\"orientationchange\", splashOff); }'+a,1);${W}" \
  guards "" 162

run_case "a screen.orientation listener arrives" \
  "a script listens for the phone turning" \
  "${P}a='\nfunction splashOff(){';assert a in s;s=s.replace(a,'\nfunction turnHook(){ screen.orientation.addEventListener(\"change\", splashOff); }'+a,1);${W}" \
  guards "" 162

run_case "a visual viewport listener arrives" \
  "a script watches the visual viewport" \
  "${P}a='\nfunction splashOff(){';assert a in s;s=s.replace(a,'\nfunction vvHook(){ window.visualViewport.addEventListener(\"resize\", splashOff); }'+a,1);${W}" \
  guards "" 162

finish "negtest730"
