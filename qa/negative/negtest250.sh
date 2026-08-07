#!/bin/bash
# Negative-test every guard added or changed in 2.5.0 — the release that
# emptied the backlog. The belt's one-render opening, the legend's inline
# flow, the raised ceilings (200 raw, 80 gzip — the owner's numbers), the
# full-catalogue seed, the persistence debounce contract (102), the targeted
# tick path and its byte-identical gate (103), and the suite harness's own
# heal step, proven by deleting a file and watching it come back.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 96: the pouches animate once, on the open"
run_case "the base rule regains the animation" \
  "base .includes .scope rule carries an animation" \
  "${P}a='box-shadow:inset 0 10px 14px -10px rgba(0,0,0,.85);}';assert s.count(a)==1
s=s.replace(a,'box-shadow:inset 0 10px 14px -10px rgba(0,0,0,.85);animation:pouch .22s ease-out backwards;}',1);${W}"

run_case "the opening flag leaks past the one render" \
  "does not scope the opening flag" \
  "${P}a='S.beltOpen = true; S.beltOpening = true; render(); S.beltOpening = false;';assert a in s
s=s.replace(a,'S.beltOpen = true; S.beltOpening = true; render();',1);${W}"

run_case "includeBlock stops reading the flag" \
  "does not read the opening flag" \
  "${P}a='''<div class=\"includes'+(S.beltOpening ? \" opening\" : \"\")+'\">''';assert a in s
s=s.replace(a,'<div class=\"includes opening\">',1);${W}"

echo "--- 99: the ratings sentence flows beside its badges"
run_case "the flex block comes back" \
  "lost its inline flow" \
  "${P}a='.legend .rleg{display:block;';assert a in s
s=s.replace(a,'.legend .rleg{display:flex;',1);${W}"

echo "--- 29: the owner's ceilings, held by arithmetic"
run_case "the file grows past the gzip budget" \
  "over the 80 KB budget" \
  "${P}import hashlib
pad=''; seed=b'night-watcher'
while len(pad)<120000: seed=hashlib.md5(seed).hexdigest().encode(); pad+=seed.decode()
a='\"use strict\";';assert a in s
s=s.replace(a,'\"use strict\"; var PAD_GZ = \"'+pad+'\";',1);${W}"

echo "--- 78: the seed carries the whole catalogue"
run_case "an entry vanishes from the seed" \
  "no longer matches the data" \
  "${P}a=' (1989) · live action · essential</li>';assert a in s
s=s.replace(a,' (1989) · live action</li>',1);${W}"

run_case "an unreleased entry stops saying so in the seed" \
  "no longer matches the data" \
  "${P}a=' · not out yet</li>';assert a in s
s=s.replace(a,'</li>',1);${W}"

echo "--- the harness heals: a deleted file comes back between fixtures"
run_case "a fixture deletes the 404 page" \
  "docs/404.html is missing" \
  "import os;os.remove('docs/404.html')"

run_case "and the heal brought it back for the next fixture" \
  "base .includes .scope rule carries an animation" \
  "import os;assert os.path.exists('docs/404.html'), 'heal failed: 404.html still missing'
${P}a='box-shadow:inset 0 10px 14px -10px rgba(0,0,0,.85);}';assert s.count(a)==1
s=s.replace(a,'box-shadow:inset 0 10px 14px -10px rgba(0,0,0,.85);animation:pouch .22s ease-out backwards;}',1);${W}"

echo "--- 102: a tick burst writes once, and leaving flushes"
run_case "persist writes inline again" \
  "not a trailing debounce" \
  "${P}a='''function persist(){
  if(!canSave || !store) return;
  if(persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(function(){ persistTimer = null; persistNow(); }, 200);
}''';assert a in s
s=s.replace(a,'''function persist(){
  if(!canSave || !store) return;
  persistNow();
}''',1);${W}"

run_case "the pagehide flush is dropped" \
  "nothing flushes on pagehide" \
  "${P}a='window.addEventListener(\"pagehide\", flushPersist);';assert a in s
s=s.replace(a,'',1);${W}"

run_case "the flush writes with nothing pending" \
  "writes even with nothing pending" \
  "${P}a='  if(!persistTimer) return;';assert a in s
s=s.replace(a,'',1);${W}"

run_case "and smoke sees the burst write synchronously" \
  "a tick burst does not write synchronously" \
  "${P}a='''function persist(){
  if(!canSave || !store) return;
  if(persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(function(){ persistTimer = null; persistNow(); }, 200);
}''';assert a in s
s=s.replace(a,'''function persist(){
  if(!canSave || !store) return;
  persistNow();
}''',1);${W}" \
  "smoke" "main"

echo "--- 103: the tick repaints one row, and cannot drift"
run_case "a toggle stops going through tickUpdate" \
  "does not go through tickUpdate" \
  "${P}a='''  if(S.skipped[id]) delete S.skipped[id];
  else { S.skipped[id] = 1; unmarkWatched(id); }
  persist(); tickUpdate(id);''';assert a in s
s=s.replace(a,'''  if(S.skipped[id]) delete S.skipped[id];
  else { S.skipped[id] = 1; unmarkWatched(id); }
  persist(); render();''',1);${W}"

run_case "the fallback condition is dropped" \
  "lost its fallback condition" \
  "${P}a='  if(S.tab !== \"watch\" || S.filter !== \"all\" || S.q){ render(); return; }';assert a in s
s=s.replace(a,'  if(S.tab !== \"watch\"){ render(); return; }',1);${W}"

run_case "and the gate catches a repaint that goes stale" \
  "surgical paths are byte-identical to a full render" \
  "${P}a='''  scratch.innerHTML = filmRow(f);
  row.parentNode.replaceChild(scratch.firstChild, row);
  var gm''';assert a in s
s=s.replace(a,'''  var gm''',1);${W}" \
  "smoke" "main"

# 3.4.1 re-aimed this section, and the fixtures below did not exist while 103
# required the group rebuild -- that shape WAS the assertion. A fixture set can
# only be as good as the thing it defends, and this one defended the defect.
#
# EVERY ANCHOR HERE IS MULTI-LINE, AND THAT IS NOT STYLE. rowUpdate() and
# tickUpdate() contain the same two lines verbatim --
# `scratch.innerHTML = filmRow(f);` then the replaceChild -- and rowUpdate
# comes first in the file, so a single-line anchor with .replace(...,1) mutates
# rowUpdate and leaves tickUpdate untouched. Section 103 then has nothing to
# complain about and the fixture reports FAIL with the expected message absent,
# which reads like a broken guard rather than a misaimed fixture. The line
# `var gm = head.querySelector(".meta");` exists only in tickUpdate and is what
# makes each anchor below unique.

run_case "the tick goes back to rebuilding the whole group" \
  "builds a group again" \
  "${P}a='  var gm = head.querySelector(\".meta\");';assert a in s
s=s.replace(a,'  var gbx = groupBlock(g, S.q.toLowerCase());\n  var gm = head.querySelector(\".meta\");',1);${W}"

run_case "the row builder is inlined instead of shared" \
  "does not rebuild the row through filmRow()" \
  "${P}a='''  scratch.innerHTML = filmRow(f);
  row.parentNode.replaceChild(scratch.firstChild, row);
  var gm''';assert a in s
s=s.replace(a,'''  scratch.innerHTML = String(f.id);
  row.parentNode.replaceChild(scratch.firstChild, row);
  var gm''',1);${W}"

run_case "the group head grows a second copy of its own tally" \
  "no longer writes the group head through gSub()" \
  "${P}a='  if(gm) gm.textContent = gSub(g);';assert a in s
s=s.replace(a,'  if(gm) gm.textContent = gDone(g) + \" of \" + g.films.length;',1);${W}"

run_case "the group head grows a second copy of its own bar" \
  "no longer writes the group head through gSub()" \
  "${P}a='\"width:\" + gPct(g) + \"%\"';assert a in s
s=s.replace(a,'\"width:\" + pct(gDone(g), g.films.length) + \"%\"',1);${W}"

run_case "a second place learns how to build a group" \
  "is built in 2 places" \
  "${P}a='function gDone(g){';assert a in s
s=s.replace(a,'function strayGroup(){ return \'<div class=\"group\"></div>\'; }\nfunction gDone(g){',1);${W}"

finish "negtest250"
