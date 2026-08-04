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

echo "--- 103: the tick repaints one group, and cannot drift"
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
  "the tick path is byte-identical to a full render" \
  "${P}a='  grp.parentNode.replaceChild(scratch.firstChild, grp);';assert a in s
s=s.replace(a,'',1);${W}" \
  "smoke" "main"

finish "negtest250"
