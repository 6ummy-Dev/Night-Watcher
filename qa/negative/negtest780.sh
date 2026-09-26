#!/bin/bash
# negtest780 — 6.3.1, the paper's foot, its reporter and his notebook. The
# paper's footer is the app's: the colophon under the app's diamond rule, set
# in the app's footer type, the way back to the map carrying the app's mark
# and name, the feed labelled RSS with its glyph (169). The notebook keeps its
# shape, never quotes and never reaches docs/ (166). The fence and the pull
# request scope take the notebook as a fourth path and nothing more (163).
# Every fixture names its section.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"
NB="$(pro nocturne/NOTEBOOK.md)"
FE="$(pro .github/workflows/nocturne-fence.yml)"
QA="$(pro .github/workflows/qa.yml)"
echo "--- 169: the paper's foot is the app's foot"

run_case "the colophon loses its diamond" \
  "has lost the app's diamond rule" \
  "${N}a='\".colophon::before{content:';assert s.count(a)==1;s=s.replace(a,'\".colophon::after{content:',1);${W}" \
  guards "" 169

run_case "the footer draws a rule of its own again" \
  "draws a border-top again" \
  "${N}a='\".foot{max-width:620px;margin:44px auto 0;}\"';assert s.count(a)==1;s=s.replace(a,'\".foot{max-width:620px;margin:44px auto 0;border-top:3px solid var(--bone);}\"',1);${W}" \
  guards "" 169

run_case "the colophon goes back to body type" \
  "is not set like the app's footers" \
  "${N}a='\".colophon{font-family:var(--mono);';assert s.count(a)==1;s=s.replace(a,'\".colophon{font-family:var(--body);',1);${W}" \
  guards "" 169

run_case "the way back to the map loses the mark" \
  "without its mark and name" \
  "${N}a=\"'<a class=\\\"btn home\\\" href=\\\"/\\\">' + MARK + '\";assert s.count(a)==1;s=s.replace(a,\"'<a class=\\\"btn home\\\" href=\\\"/\\\">' + '\",1);${W}" \
  guards "" 169

run_case "the way back to the map loses the name" \
  "without its mark and name" \
  "${N}a='<b>Night Watcher</b>';assert s.count(a)==1;s=s.replace(a,'<b>The map</b>',1);${W}" \
  guards "" 169

run_case "the feed is The wire again" \
  "labels its feed something other than RSS" \
  "${N}a=\"RSS + 'RSS</a>'\";assert s.count(a)==1;s=s.replace(a,\"RSS + 'The wire</a>'\",1);${W}" \
  guards "" 169

run_case "the feed loses its glyph" \
  "labels its feed something other than RSS" \
  "${N}a=\"+ RSS + 'RSS</a>'\";assert s.count(a)==1;s=s.replace(a,\"+ 'RSS</a>'\",1);${W}" \
  guards "" 169

echo "--- 166: the notebook"

run_case "the notebook is deleted" \
  "nocturne/NOTEBOOK.md is gone" \
  "import os;os.remove('nocturne/NOTEBOOK.md')" \
  guards "" 166

run_case "the notebook's header is rewritten" \
  "the header stays as the owner wrote it" \
  "${NB}a='# The notebook\n';assert s.startswith(a);s='# Notes\n'+s[len(a):];${W}" \
  guards "" 166

run_case "a loose note under a week" \
  "not an entry" \
  "${NB}s=s+'\n## 2026-W40\n\nsomething to follow up on\n';${W}" \
  guards "" 166

run_case "a quotation filed as a fact" \
  "never quotes" \
  "${NB}s=s+'\n## 2026-W40\n\n- 2026-09-28 — The director said “it is the darkest yet”. [Trade](https://example.com/a)\n';${W}" \
  guards "" 166

run_case "an entry dated outside its week" \
  "is not inside 2026-W40" \
  "${NB}s=s+'\n## 2026-W40\n\n- 2026-10-05 — A fact read on Monday. [Trade](https://example.com/a)\n';${W}" \
  guards "" 166

run_case "an entry without its source" \
  "not an entry" \
  "${NB}s=s+'\n## 2026-W40\n\n- 2026-09-28 — A fact with no link.\n';${W}" \
  guards "" 166

run_case "the weeks run backwards" \
  "weeks run oldest to newest" \
  "${NB}s=s+'\n## 2026-W41\n\n## 2026-W40\n';${W}" \
  guards "" 166

run_case "the notebook reaches a built page" \
  "carries the notebook" \
  "${N}a=\"'<p class=\\\"colophon\\\">' + COLOPHON + '</p>\";assert s.count(a)==1;s=s.replace(a,\"'<p class=\\\"colophon\\\">' + COLOPHON + ' # The notebook</p>\",1);${W}" \
  guards "" 166

echo "--- 163: the fence and the scope take the notebook and nothing more"

run_case "the fence forgets the notebook" \
  "the fence around the drafting agent is gone or widened" \
  "${FE}a='|nocturne/NOTEBOOK\\\\.md\$|';assert s.count(a)==1;s=s.replace(a,'|',1);${W}" \
  guards "" 163

run_case "the fence opens all of nocturne/" \
  "the fence around the drafting agent is gone or widened" \
  "${FE}a='|nocturne/NOTEBOOK\\\\.md\$|';assert s.count(a)==1;s=s.replace(a,'|nocturne/|',1);${W}" \
  guards "" 163

run_case "the scope forgets the notebook" \
  "scope for issue pull requests is gone or widened" \
  "${QA}a='|nocturne/NOTEBOOK\\\\.md\$|';assert s.count(a)==1;s=s.replace(a,'|',1);${W}" \
  guards "" 163

finish "negtest780"
