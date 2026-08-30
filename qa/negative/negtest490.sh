#!/bin/bash
# negtest490 — 4.2.4. The parser, the caller-proof gates, and the ratchet.
#
# Three instruments changed and each gets the fixture that proves it can go
# red. fn() is an AST parser now (Acorn, dev-only): a missing required
# extract must be section 7's readable failure, never a stack trace — the
# first fixture removes exportCode and demands the message on §7's own line.
# applyImport and mergeLog consult BYID themselves instead of trusting
# their callers: two smoke fixtures take each gate off and watch an
# invented id walk in. And the sect ratchet in 138 pins the count of
# guards fixtures that name no section — the last fixture plants a new
# sect-less fixture in the corpus and demands the ratchet notice.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- Q-fn: a missing required extract is a failure, not a stack trace"

run_case "exportCode vanishes and section 7 says so readably" \
  "cannot locate function exportCode() in index.html" \
  "${P}a='function exportCode(){';assert a in s
s=s.replace(a,'function exportCodeGone(){',1);${W}" guards "" 7

echo "--- C-4: the gates stop depending on the call graph"

run_case "applyImport trusts its caller again" \
  "applyImport refuses an id the catalogue does not carry" \
  "${P}a='    if(!res.watched[id] || !BYID[id] || isParkedId(id) || S.watched[id] || (gate && gate(\"w\", id))) continue;';assert a in s
s=s.replace(a,'    if(!res.watched[id] || isParkedId(id) || S.watched[id] || (gate && gate(\"w\", id))) continue;',1);${W}" "smoke" "main"

run_case "mergeLog lets an invented id into the log" \
  "mergeLog keeps the log a subset of the catalogue" \
  "${P}a='if(en && en.id && BYID[en.id] && !isParkedId(en.id) && validTs(en.ts) && !have[en.id]){';assert a in s
s=s.replace(a,'if(en && en.id && !isParkedId(en.id) && validTs(en.ts) && !have[en.id]){',1);${W}" "smoke" "main"

echo "--- Q-3b: the ratchet notices a new fixture with no section"

run_case "a sect-less guards fixture lands in the corpus" \
  "guards fixtures that pass no section number and the pin says" \
  "import io
p='qa/negative/negtest.sh'
s=io.open(p,encoding='utf-8').read()
assert 'finish ' in s
s=s+'\nrun_case \"a planted fixture with no section\" \"twelve-plus-characters-of-expect\" \"true\"\n'
io.open(p,'w',encoding='utf-8').write(s)" guards "" 138

finish "4.2.4 parser, gates, ratchet"
