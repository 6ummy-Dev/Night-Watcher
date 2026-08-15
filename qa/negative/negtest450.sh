#!/bin/bash
# negtest450 — 3.9.6. The two named comparators, and the stamp that means a
# copy left.
#
# Both sections here guard a defect whose signature is that everything looks
# fine. Section 141's is an inline comparator quietly replacing a named one:
# the app keeps rendering, every other guard stays green, and orders.txt goes on
# being generated from a function the app no longer calls — the export and the
# screen agreeing on paper and disagreeing in fact. Section 142's is a stamp on
# a backup that was never written: showSaveFilePicker REJECTS on cancel, so a
# dismissed dialog and a completed save look identical to any code that skipped
# the check, and the person is told they are backed up when they are not.
#
# Neither failure produces a wrong pixel or a thrown error, which is why they
# get fixtures rather than trust.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

run_case "141: the life sort goes back to an anonymous function" \
  "no longer sorts the life ordering" \
  "${P}old='fs.sort(lifeCmp);';assert old in s;s=s.replace(old,'fs.sort(function(a,b){ return (a.lo||9999)-(b.lo||9999); });',1);${W}"

run_case "141: the release sort points at something else" \
  "no longer sorts the release ordering" \
  "${P}old='fs.sort(releaseCmp);';assert old in s;s=s.replace(old,'fs.sort(cmpX);',1);${W}"

run_case "141: an inline comparator creeps back into buildGroups" \
  "has an inline comparator again" \
  "${P}old='fs.sort(releaseCmp);';assert old in s;s=s.replace(old,'fs.sort(function(a,b){ return a.y-b.y; });',1);${W}"

run_case "141: lifeCmp stops keying on the manual life order" \
  "it settles order inside one era" \
  "${P}old='((a.lo || 9999) - (b.lo || 9999)) || (a.gi - b.gi) || (a.ix - b.ix)';assert old in s;s=s.replace(old,'(a.gi - b.gi) || (a.ix - b.ix)',1);${W}"

run_case "141: releaseCmp stops keying on the year" \
  "no longer keys on the year and the title" \
  "${P}old='return (a.y - b.y) || a.t.localeCompare(b.t);';assert old in s;s=s.replace(old,'return a.gi - b.gi;',1);${W}"

run_case "141: an ordering goes missing from orders.txt" \
"the header promises three orderings" \
"
import io
p='docs/orders.txt'
s=io.open(p,encoding='utf-8').read()
old='ORDERING 2 OF 3'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'ORDERING TWO',1))
"

run_case "142: canSaveFile stops checking for somewhere to keep the handle" \
  "feature-detects both showSaveFilePicker and indexedDB" \
  "${P}old=' && !!window.indexedDB';assert old in s;s=s.replace(old,'',1);${W}"

run_case "142: backupToFile stamps the backup itself" \
  "stamps lastExportAt itself" \
  "${P}old='return window.showSaveFilePicker({suggestedName:';assert old in s;s=s.replace(old,'S.lastExportAt = Date.now(); return window.showSaveFilePicker({suggestedName:',1);${W}"

run_case "142: the handle is written without asking permission first" \
"no longer queries the handle's permission" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
a='typeof h.queryPermission !== \"function\"'
b='return h.queryPermission(o).then(function(p){'
assert a in s and b in s
s=s.replace(a,'typeof h.createWritable !== \"function\"',1)
s=s.replace(b,'return Promise.resolve(\"granted\").then(function(p){',1)
io.open(p,'w',encoding='utf-8').write(s)
"

run_case "142: a cancelled save picker stamps the backup anyway" \
  "is not gated on the write succeeding" \
  "${P}old='if(fOk){ S.lastExportAt = Date.now(); persist(); render(); }';assert old in s;s=s.replace(old,'S.lastExportAt = Date.now(); persist(); render();',1);${W}"

run_case "142: the save control escapes the feature detect" \
  "no longer behind canSaveFile()" \
  "${P}old='(canSaveFile() ? ';assert old in s;s=s.replace(old,'(true ? ',1);${W}"

run_case "142: nothing stamps the backup any more" \
  "nothing stamps lastExportAt any more" \
  "${P}old='S.lastExportAt = Date.now()';assert old in s;s=s.replace(old,'S.lastExportXt = Date.now()');${W}"

rm -rf "$NEG"
finish "negtest450"
