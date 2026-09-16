#!/bin/bash
# negtest730 — 6.1.1, "Measure the flip". Fixtures for every clause this cut
# added: §162, the installed frame readout (the probe's markup and CSS, the
# standalone gate, observers instead of reads, the line on Progress only when
# installed, the boot start, both readings kept), and §153's tag, which moves
# to `default` — the one value measured opaque on the owner's iOS 27 phone.
# Every fixture names its section.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 153: the status-bar tag is default"

run_case "the tag goes back to black" \
  "required tag(s): apple-mobile-web-app-status-bar-style" \
  "${P}a='<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\">';assert a in s;s=s.replace(a,'<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black\">',1);${W}" \
  guards "" 153

echo "--- 162: the probe"

run_case "the probe markup goes" \
  "#fprobe is gone or reshaped" \
  "${P}a='<div id=\"fprobe\" aria-hidden=\"true\"><i class=\"fpt\"></i><i class=\"fpb\"></i><i class=\"fpd\"></i></div>\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 162

run_case "the probe stops being hidden" \
  "lost a fixed, full-height, hidden, untouchable box" \
  "${P}a='#fprobe{position:fixed;top:0;bottom:0;left:0;width:1px;visibility:hidden;pointer-events:none;}';assert a in s;s=s.replace(a,'#fprobe{position:fixed;top:0;bottom:0;left:0;width:1px;pointer-events:none;}',1);${W}" \
  guards "" 162

run_case "the dvh child measures svh instead" \
  "lost the 100dvh child" \
  "${P}a='.fpd{height:100dvh;}';assert a in s;s=s.replace(a,'.fpd{height:100svh;}',1);${W}" \
  guards "" 162

run_case "the top-inset child measures the bottom" \
  "lost the top-inset child" \
  "${P}a='.fpt{height:env(safe-area-inset-top);}';assert a in s;s=s.replace(a,'.fpt{height:env(safe-area-inset-bottom);}',1);${W}" \
  guards "" 162

echo "--- 162: the watcher"

run_case "the observers attach in a browser tab too" \
  "attaches without checking isStandalone()" \
  "${P}a='if(!box || !isStandalone() || ';assert a in s;s=s.replace(a,'if(!box || ',1);${W}" \
  guards "" 162

run_case "a height is read instead of delivered" \
  "no longer takes its numbers from observers" \
  "${P}a='Math.round(e.contentRect.height)';assert a in s;s=s.replace(a,'Math.round(e.target.offsetHeight)',1);${W}" \
  guards "" 162

run_case "the header's top is read instead of delivered" \
  "no longer takes its numbers from observers" \
  "${P}a='entries[entries.length - 1].boundingClientRect.top';assert a in s;s=s.replace(a,'document.querySelector(\"header\").getBoundingClientRect().top',1);${W}" \
  guards "" 162

run_case "the watcher is never started" \
  "is never started at boot" \
  "${P}a='\nframeWatch();\n';assert a in s;s=s.replace(a,'\n',1);${W}" \
  guards "" 162

run_case "the at-launch reading is dropped" \
  "no longer keeps both readings" \
  "${P}a='  if(FRAME.ro && FRAME.io && !FRAME.at) FRAME.at = t;\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 162

echo "--- 162: the line"

run_case "the frame line shows in a browser tab" \
  "not only when installed" \
  "${P}a=\"(isStandalone() ? '<span class=\\\"buildline\\\" id=\\\"frameline\\\">'+esc(frameText())+'</span>' : '')\";assert a in s;s=s.replace(a,\"'<span class=\\\"buildline\\\" id=\\\"frameline\\\">'+esc(frameText())+'</span>'\",1);${W}" \
  guards "" 162

run_case "the frame line leaves Progress" \
  "the frame line is not on Progress" \
  "${P}a='id=\"frameline\"';assert a in s;s=s.replace(a,'data-frame=\"1\"',1);${W}" \
  guards "" 162

finish "negtest730"
