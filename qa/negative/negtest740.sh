#!/bin/bash
# negtest740 — 6.1.5, the 6.1.4 audit's cut. A group with nothing on the
# shelf is not finished (F-1); the log holds watched titles only, at the JSON
# door and at boot (F-2); the share card closes a group the way Progress and
# the skyline do (F-5); a code on screen is not a backup (C-4). Every fixture
# names its section or its smoke check.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 142: a code on screen is not a backup"

run_case "Create backup code stamps again" \
  "Create backup code stamps lastExportAt" \
  "${P}a='S.code = exportCode(); render({quiet:true});';assert s.count(a)==1;s=s.replace(a,'S.code = exportCode(); S.lastExportAt = Date.now(); persist(); render({quiet:true});',1);${W}" \
  guards "" 142

run_case "Copy code stamps before the clipboard answers" \
  "stampExport() runs outside the clipboard's success path" \
  "${P}a='putClipboard(S.code, \"Copied\", \"Select and copy\", stampExport);';assert s.count(a)==1;s=s.replace(a,'stampExport(); putClipboard(S.code, \"Copied\", \"Select and copy\");',1);${W}" \
  guards "" 142

run_case "a refused copy runs the stamp too" \
  "stampExport() runs outside the clipboard's success path" \
  "${P}a='function(){ toast(fail); });';assert s.count(a)==1;s=s.replace(a,'function(){ toast(fail); if(then) then(); });',1);${W}" \
  guards "" 142

echo "--- smoke: the audit's reproductions"

run_case "Home draws a parked-only group full again (smoke)" \
  "a parked-only group is not drawn full on Home" \
  "${P}a='(g.size && done + skip === g.size ? \" full\" : \"\")';assert s.count(a)==1;s=s.replace(a,'(done + skip === g.size ? \" full\" : \"\")',1);${W}" \
  "smoke" "main"

run_case "Progress counts a parked-only group complete again (smoke)" \
  "a parked-only group is not counted complete on Progress" \
  "${P}a='n++; if(g.size && d + k === g.size) done++;';assert s.count(a)==1;s=s.replace(a,'n++; if(d + k === g.size) done++;',1);${W}" \
  "smoke" "main"

run_case "the share card closes only on watches again (smoke)" \
  "the share card's closed count agrees with Progress on skips" \
  "${P}a='if(sz && crownState(d, sk, sz)) closed++;';assert s.count(a)==1;s=s.replace(a,'if(sz && d === sz) closed++;',1);${W}" \
  "smoke" "main"

run_case "the JSON door merges the whole log again (smoke)" \
  "a JSON restore merges no log row for a title it did not mark watched" \
  "${P}a='    if(Array.isArray(o.log)) mergeLog(o.log.filter(function(en){ return en && S.watched[en.id]; }));';assert s.count(a)==1;s=s.replace(a,'    if(Array.isArray(o.log)) mergeLog(o.log);',1);${W}" \
  "smoke" "main"

run_case "restore() stops sweeping the log (smoke)" \
  "a log row for an unwatched title is swept at boot" \
  "${P}a='    dropUnwatchedLog();\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  "smoke" "main"

run_case "the log sweep never persists (smoke)" \
  "the log sweep reaches the disk" \
  "${P}a='  n -= S.log.length;\n  if(n) persist();';assert s.count(a)==1;s=s.replace(a,'  n -= S.log.length;',1);${W}" \
  "smoke" "main"

run_case "Create backup code stamps again (smoke)" \
  "Create backup code does not stamp a backup" \
  "${P}a='S.code = exportCode(); render({quiet:true});';assert s.count(a)==1;s=s.replace(a,'S.code = exportCode(); S.lastExportAt = Date.now(); persist(); render({quiet:true});',1);${W}" \
  "smoke" "main"

run_case "a refused copy stamps anyway (smoke)" \
  "a refused copy stamps nothing" \
  "${P}a='function(){ toast(fail); });';assert s.count(a)==1;s=s.replace(a,'function(){ toast(fail); if(then) then(); });',1);${W}" \
  "smoke" "main"

run_case "a landed copy never stamps (smoke)" \
  "a landed copy stamps the backup" \
  "${P}a='toast(ok); if(then) then(); }';assert s.count(a)==1;s=s.replace(a,'toast(ok); }',1);${W}" \
  "smoke" "main"

finish "negtest740"
