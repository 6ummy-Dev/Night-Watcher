#!/bin/bash
# Negative-test guard 131 — the install seat, and the two watching-truths (3.7.0).
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 131: the install seat"
run_case "the seat renders inside the installed app" \
  "installBlock() renders inside the installed app" \
  "${P}a='if(isStandalone()) return \"\";';assert a in s;s=s.replace(a,'');${W}"

run_case "the button stops waiting for a held offer" \
  "the install button no longer waits for a held offer" \
  "${P}a='if(installEvt){';assert a in s;s=s.replace(a,'if(true){');${W}"

run_case "the button takes the bone fill" \
  "the install button left the bkbtn outline tier" \
  "${P}a='class=\"bkbtn installbtn\"';assert a in s;s=s.replace(a,'class=\"bkbtn primary installbtn\"');${W}"

run_case "the offer is no longer spent before prompt()" \
  "the offer is no longer spent before prompt()" \
  "${P}a='var iev = installEvt; installEvt = null;';assert a in s;s=s.replace(a,'var iev = installEvt;');${W}"

run_case "beforeinstallprompt lets the mini-infobar through" \
  "beforeinstallprompt no longer calls preventDefault()" \
  "${P}a='e.preventDefault();\n  installEvt = e;';assert a in s;s=s.replace(a,'installEvt = e;');${W}"

run_case "the iOS hint loses its dismissal gate" \
  "the iOS hint lost its gate" \
  "${P}a='if(IOSDEVICE && !S.insOff){';assert a in s;s=s.replace(a,'if(IOSDEVICE){');${W}"

run_case "insOff persists its default too" \
  "insOff persists something other than only-true" \
  "${P}a='get:function(){ return S.insOff ? true : undefined; }';assert a in s;s=s.replace(a,'get:function(){ return S.insOff; }');${W}"

run_case "a restored payload cannot dismiss the hint" \
  "a restored payload can no longer dismiss the hint" \
  "${P}a='read:function(v){ return v === true ? true : undefined; }';assert a in s;s=s.replace(a,'read:function(v){ return v; }');${W}"

run_case "a second seat opens in Next up" \
  "2 install seats" \
  "${P}a='activityBlock()+watchNotes();';assert a in s;s=s.replace(a,'activityBlock()+watchNotes()+installBlock();');${W}"

echo "--- 131: the two watching-truths"
run_case "Next up drops the watching-truths" \
  "Next up dropped the watching-truths" \
  "${P}a='activityBlock()+watchNotes();';assert a in s;s=s.replace(a,'activityBlock();');${W}"

run_case "the dates note falls out of watchNotes()" \
  "watchNotes() no longer carries both truths" \
  "${P}a='<p class=\"note foot\">Announced dates can move.</p>';assert a in s;s=s.replace(a,'');${W}"

run_case "the availability note comes back to Progress" \
  "a watching-truth is back in Progress" \
  "${P}a='installBlock()+';assert a in s;s=s.replace(a,'\\'<p class=\"note\">Announced dates can move.</p>\\'+installBlock()+');${W}"

run_case "the saves-line comes back to Progress" \
  "the saves-line is back in Progress" \
  "${P}a='Keep the path lit.';assert a in s;s=s.replace(a,'Progress saves automatically in this browser. Keep the path lit.');${W}"

# 4.1.0: the support line joined the footer as a second span.buildline, so
# renaming only the first left the word "buildline" in viewStats and the
# guard rightly stayed quiet. The mutation now renames every buildline span.
run_case "the build line leaves Progress" \
  "the build line left Progress" \
  "${P}a='<span class=\"buildline\">';assert a in s;s=s.replace(a,'<span class=\"buildref\">');${W}"

rm -rf "$NEG"
finish "131 negative tests"
