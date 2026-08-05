#!/bin/bash
# Negative-test 1.8.5 — the standing decisions, and the count sweep that now
# reaches the workflow comments.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 82: Pages never gets a custom domain"
run_case "a CNAME appears in the published directory" \
  "that is a GitHub Pages custom domain" \
  "import io;io.open('docs/CNAME','w').write('nightwatcher.life\n')"

run_case "a CNAME appears at the repo root" \
  "that is a GitHub Pages custom domain" \
  "import io;io.open('CNAME','w').write('nightwatcher.life\n')"

echo "--- 83: the manifest id is an identity"
# Inverted in 2.7.0. This fixture used to mutate the id TO "/" and require a
# failure, because "/Night-Watcher/" was the blessed value. 2.7.0 changed the
# blessed value once, deliberately, while the install base was near zero — so
# the mutation that must now fail is the revert, not the fix.
run_case "the id is reverted to the old project-page path" \
  "it is an identity key, not a path" \
  "import io,json;p='docs/manifest.json';d=json.load(io.open(p,encoding='utf-8'))
d['id']='/Night-Watcher/';io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=2))"

run_case "the id drifts to something plausible" \
  "it is an identity key, not a path" \
  "import io,json;p='docs/manifest.json';d=json.load(io.open(p,encoding='utf-8'))
d['id']='https://nightwatcher.life/';io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=2))"

run_case "the id is dropped entirely" \
  "manifest.json has no id" \
  "import io,json;p='docs/manifest.json';d=json.load(io.open(p,encoding='utf-8'))
del d['id'];io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=2))"

echo "--- 84: the one deliberate slug/year mismatch"
run_case "the frozen slug is renamed to match its year" \
  "FROZEN ID REMOVED OR RENAMED: harley-quinn-season-5-2024" \
  "${P}a='harley-quinn-season-5-2024';assert a in s
s=s.replace(a,'harley-quinn-season-5-2025',1);${W}"

run_case "the year is changed to match the slug instead" \
  "is supposed to carry one" \
  "${P}import re
m=re.search(r'\\{i:\"harley-quinn-season-5-2024\"[^}]*?,y:(2025)', s);assert m
s=s[:m.start(1)]+'2024'+s[m.end(1):];${W}"

run_case "a second entry's slug and year drift apart" \
  "Fix the year, never the slug" \
  "${P}a='{i:\"batman-1989\",t:\"Batman\",y:1989,';assert a in s
s=s.replace(a,'{i:\"batman-1989\",t:\"Batman\",y:1990,',1);${W}"

echo "--- 85: Static Shock and Titans keep one row each"
run_case "the single-row series is replaced by seasons" \
  "splits a series that is entered as one row by decision" \
  "${P}a='{i:\"static-shock-seasons-1-4-2000\"';assert a in s
s=s.replace(a,'{i:\"static-shock-season-1-2000\"',1);${W}"

echo "--- 86: eleven eras, plus outside"
run_case "era 7 is split into a twelfth era" \
  "the era scheme is eleven stages" \
  "${P}a=' {k:8,  name:\"The Damian years\"';assert a in s
s=s.replace(a,' {k:12, name:\"The late Watchtower years\", note:\"Still the League, later.\"},\n {k:8,  name:\"The Damian years\"',1);${W}"

run_case "era 0 is dropped" \
  "era 0 (outside any timeline) is missing" \
  "${P}import re
m=re.search(r' \\{k:0,[^\\n]*\\n', s);assert m;s=s[:m.start()]+s[m.end():];${W}"

echo "--- 87: a backup carries progress, not settings"
run_case "the JSON backup starts carrying the theme" \
  "a backup restores progress onto the device" \
  "${P}a='path:S.path, watched:S.watched';assert a in s
s=s.replace(a,'path:S.path, theme:S.theme, watched:S.watched',1);${W}"

run_case "the JSON backup stops carrying the ratings" \
  "exportJSON() no longer carries rated" \
  "${P}a=', rated:S.rated, log:S.log}';assert a in s
s=s.replace(a,', log:S.log}',1);${W}"

echo "--- 88: the universe chip describes the universe"
run_case "the chip is taken off the filtered list" \
  "eraTag() takes the unfiltered group" \
  "${P}a='tag:eraTag(g),';assert a in s
s=s.replace(a,'tag:eraTag({films:g.films.filter(function(f){return f.k!==\"tv\";})}),',1);${W}"

# 3.0.0: THIS MUTATION TRIPPED NOTHING AT ALL. It made eraTag() read a list
# with television removed on BOTH scopes, so the chip was consistently wrong and
# the invariant this check asserts — that the number does not change when the
# scope does — still held. It reported PASS only because the check's name is
# printed on every green run and the old harness grepped the green lines too.
# The mutation now filters on the live scope, which is the regression the check
# was written against: The Batman (2004) reads 2 with series shown and 3 without.
run_case "and the rendered chip moves when the scope does" \
  "the universe chip does not move when the scope does" \
  "${P}a='tag:eraTag(g),';assert a in s
s=s.replace(a,'tag:eraTag(S.scope===\"movies\"?{films:g.films.filter(function(f){return f.k!==\"tv\";})}:g),',1);${W}" \
  "smoke" "main"

echo "--- 89: the amnesty window is closed"
run_case "a second rename is added beside the first" \
  "the window it depended on is closed" \
  "import io,json;p='qa/renamed-ids.json';d=json.load(io.open(p,encoding='utf-8'))
d['batman-1989']={'to':'batman-the-movie-1989','in':'1.8.5',
 'why':'A second rename, which is exactly what the recorded exception is not a precedent for.'}
io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=1))"

run_case "the record of the one exception is deleted" \
  "qa/renamed-ids.json is gone" \
  "import os;os.remove('qa/renamed-ids.json')"

echo "--- the count sweep reaches the workflow"
run_case "a workflow comment states a stale fixture count" \
  "qa.yml says" \
  "import io,re;p='.github/workflows/qa.yml';s=io.open(p,encoding='utf-8').read()
m=re.search(r'(\d+) fixtures',s);assert m
s=s[:m.start(1)]+str(int(m.group(1))+2)+s[m.end(1):];io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 31: the inclusion rule keeps answering the hard cases"
run_case "the closest call drops out of the inclusion rule" \
  "the inclusion rule no longer answers Super Best Friends Forever" \
  "import io;p='README.md';s=io.open(p,encoding='utf-8').read()
a='Super Best Friends Forever';assert a in s
s=s.replace(a,'a certain shorts run',1);io.open(p,'w',encoding='utf-8').write(s)"

rm -rf "$NEG"
finish "1.8.5 negative tests"
