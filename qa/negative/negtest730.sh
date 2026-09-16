#!/bin/bash
# negtest730 — 6.1.1, "Measure the flip", reshaped by 6.1.2, "Put it back".
# 6.1.1's frame readout measured the flip on the owner's phone and left with
# 6.1.2; section 162 now holds the rotation reseat that measurement pointed
# at — the standalone gate, the delivered header top and its thresholds, the
# focusout re-check, the guard (above the top, three tries), the text-field
# skip, scrollIntoView back, the boot start, the state declared above the
# boot, and the readout staying gone — plus §153's `default` tag. Every
# fixture names its section.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 153: the status-bar tag is default"

run_case "the tag goes back to black" \
  "required tag(s): apple-mobile-web-app-status-bar-style" \
  "${P}a='<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\">';assert a in s;s=s.replace(a,'<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black\">',1);${W}" \
  guards "" 153

echo "--- 162: the watcher"

run_case "the reseat attaches in a browser tab too" \
  "attaches without checking isStandalone()" \
  "${P}a='if(!h || !isStandalone() || ';assert a in s;s=s.replace(a,'if(!h || ',1);${W}" \
  guards "" 162

run_case "the header's top is read instead of delivered" \
  "no longer takes the header's top from an" \
  "${P}a='entries[entries.length - 1].boundingClientRect.top';assert a in s;s=s.replace(a,'h.getBoundingClientRect().top',1);${W}" \
  guards "" 162

run_case "the observer keeps two thresholds" \
  "no longer takes the header's top from an" \
  "${P}a='  for(i = 0; i <= 20; i++) th.push(i / 20);\n';assert a in s;s=s.replace(a,'  th.push(0, 1);\n',1);${W}" \
  guards "" 162

run_case "the focusout re-check goes" \
  "no longer re-checks on focusout" \
  "${P}a='  document.addEventListener(\"focusout\", function(){ setTimeout(reseat, 150); });\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 162

run_case "the watcher is never started" \
  "seatWatch() is never started at boot" \
  "${P}a='\nseatWatch();\n';assert a in s;s=s.replace(a,'\n',1);${W}" \
  guards "" 162

run_case "the state is declared below the boot again" \
  "are not declared above the boot" \
  "${P}a='var seatTop = 0, seatTries = 0;\n';assert a in s;s=s.replace(a,'',1);b='\nfunction seatWatch(){';assert b in s;s=s.replace(b,'\nvar seatTop = 0, seatTries = 0;'+b,1);${W}" \
  guards "" 162

echo "--- 162: the reseat"

run_case "the reseat loses its try cap" \
  "reseat() lost its guard" \
  "${P}a='if(seatTop >= -1 || seatTries >= 3) return;';assert a in s;s=s.replace(a,'if(seatTop >= -1) return;',1);${W}" \
  guards "" 162

run_case "the reseat fights the keyboard" \
  "reseat() acts while a text field has focus" \
  "${P}a='  if(t === \"INPUT\" || t === \"TEXTAREA\") return;\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 162

run_case "the reseat scrolls the deck sideways too" \
  "no longer puts the header back with" \
  "${P}a='scrollIntoView({block: \"start\", inline: \"nearest\"})';assert a in s;s=s.replace(a,'scrollIntoView({block: \"start\", inline: \"start\"})',1);${W}" \
  guards "" 162

run_case "the readout comes back" \
  "6.1.1's frame readout is back" \
  "${P}a='<div class=\"toast\" id=\"toast\" role=\"status\" aria-live=\"polite\"></div>\n';assert a in s;s=s.replace(a,a+'<div id=\"fprobe\" aria-hidden=\"true\"></div>\n',1);${W}" \
  guards "" 162

finish "negtest730"
