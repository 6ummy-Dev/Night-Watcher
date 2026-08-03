#!/bin/bash
# Negative-test every guard added or changed in 1.6.6.
# The theme of this release is checks that could not fail, so these fixtures
# matter more than usual: each one has to prove the new check actually bites.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

G="import io;p='qa/guards.js';s=io.open(p,encoding='utf-8').read();"
V="import io;p='docs/sw.js';s=io.open(p,encoding='utf-8').read();"
M="import io;p='docs/sitemap.xml';s=io.open(p,encoding='utf-8').read();"
C="import io;p='CHANGELOG.md';s=io.open(p,encoding='utf-8').read();"

echo "--- 28: a guard that asked whether the file mentions the function it calls"
run_case "the only call site is deleted (the old check passed this)" \
  "defined and never called" \
  "${P}a='  applyTheme();';assert a in s;s=s.replace(a,'  /*x*/');${W}"

echo "--- 8: the forward-compatibility tests were running against a code with no P"
run_case "the P segment stops carrying the path" \
  "does not restore the path" \
  "${P}a='path:CODEPATH[(seg.P || \"\").charAt(0)] || \"\"';assert a in s;s=s.replace(a,'path:\"\"');${W}"

run_case "exportCode stops writing the path segment" \
  "wrote no P segment" \
  "${P}a='(S.path ? \"P\" + PATHCODE[S.path] : \"\")';assert a in s;s=s.replace(a,'\"\"');${W}"

echo "--- 13: the offline shell against what docs/ actually serves"
run_case "an icon is served and never cached (the 1.5.x drift)" \
  "and sw.js does not cache it" \
  "${V}a='               \"./icon-maskable-512.png\",';assert a in s;s=s.replace(a,'');${W}"

run_case "the shell lists a file that is not there" \
  "docs/ does not serve it" \
  "${V}a='\"./icon-192.png\",';assert a in s;s=s.replace(a,'\"./icon-192.png\", \"./icon-512.png\",');${W}"

echo "--- 66: a section header with nothing under it"
run_case "a section is emptied and its checks stranded (the 1.6.5 wreckage)" \
  "has a header and no assertion under it" \
  "${G}a='[\"Streaming now\", \"Streaming rows\"].forEach';assert a in s;s=s.replace(a,'[].forEach')
import re
i=s.index('/* ---------- 48.');j=s.index('/* ---------- 49.')
s=s[:i]+'/* ---------- 48. The footer describes the link that exists ------ */\n\n'+s[j:];${W}"

echo "--- 66: the INDEX groups"
run_case "a group heading is used twice" \
  "the INDEX repeats the group heading" \
  "${G}a='   STORAGE\n';assert a in s;s=s.replace(a,'   STORAGE\n',1);s=s.replace('   COPY\n','   STORAGE\n',1);${W}"

run_case "a group is left with nothing under it" \
  "has no sections under it" \
  "${G}a='   DISCOVERY\n';assert a in s;s=s.replace(a,'   PLUMBING\n   DISCOVERY\n');${W}"

echo "--- 67: the dates say when the page actually changed"
run_case "the build ships and the dates do not move" \
  "the build shipped and its dates did not move" \
  "import io
import re
for p,pat in [('docs/sitemap.xml',r'<lastmod>(\\d{4}-\\d{2}-\\d{2})</lastmod>'),('docs/index.html',r'\"dateModified\":\"(\\d{4}-\\d{2}-\\d{2})\"')]:
    s=io.open(p,encoding='utf-8').read();m=re.search(pat,s);assert m
    io.open(p,'w',encoding='utf-8').write(s[:m.start(1)]+'2026-07-30'+s[m.end(1):])"

run_case "the sitemap and the structured data disagree" \
  "one of them is wrong" \
  "${M}import re;s=re.sub(r'<lastmod>[^<]*</lastmod>','<lastmod>2026-07-30</lastmod>',s);${W}"

echo "--- 65: the no-comments policy now covers both syntaxes"
run_case "an explanatory HTML comment goes back in the head" \
  "the no-comments policy is about the file a reader downloads" \
  "${P}a='<meta charset=\"utf-8\">';assert a in s;s=s.replace(a,'<meta charset=\"utf-8\">\n<!-- Charset first, because a late one restarts the parse. -->');${W}"

echo "--- 34: the row count"
run_case "the row count drifts from three" \
  "expected 3" \
  "${P}a='var ACTIVITYMAX = 3;';assert a in s;s=s.replace(a,'var ACTIVITYMAX = 6;');${W}"

echo "--- smoke: the unknown-title branch, and the row count read from the page"
run_case "watchUrl stops guarding an unknown year" \
  "a title the catalogue has never heard of degrades cleanly" \
  "${P}a=\"(y ? \\\" \\\" + y : \\\"\\\")\";assert a in s;s=s.replace(a,'(\\\" \\\" + y)');${W}" \
  "smoke" "main"

run_case "Activity renders the whole log instead of ACTIVITYMAX rows" \
  "Activity shows at most ACTIVITYMAX rows" \
  "${P}a='i >= 0 && n < ACTIVITYMAX';assert a in s;s=s.replace(a,'i >= 0');${W}" \
  "smoke" "main"

rm -rf "$NEG"
finish "1.6.6 negative tests"
