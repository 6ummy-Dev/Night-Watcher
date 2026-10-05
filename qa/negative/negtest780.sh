#!/bin/bash
# negtest780 — 6.3.1, the paper's foot, its reporter and his notebook. The
# paper's footer is the app's: the colophon under the app's diamond rule, set
# in the app's footer type, the way back to the map carrying the app's mark
# and name, the feed labelled RSS with its glyph (169). The notebook keeps its
# shape, never quotes and never reaches docs/ (166). The fence and the pull
# request scope take the notebook as a fourth path and nothing more (163).
# 6.3.2: a quoted line in the notebook names its work, stays one line and
# comes alone (166); CODEOWNERS gives the reporter's file to the owner (163).
# 6.3.3: CODEOWNERS gives the casebook to the owner (163); the check holds
# the reporter's plain rules: one "I" an issue, one Hellbox regular, the
# names that never go in the paper, and Batman never on our world (166).
# 6.3.4: the sentence counts (-ings, -ly adverbs, even sentence lengths,
# similes) still fire, warn without refusing, print, and the fixture trips
# none (166).
# 6.3.5: the morgue file keeps its shape, never reaches a built page and
# stays the owner's (166, 163); an issue never cites it; Batman's creator is
# never Kane alone; a charge is "charged with"; the film press stays out
# (166).
# 6.4.0: every page shares its own stamped 1200x630 card (168; the 16 KB
# ceiling is negtest750's fixture, re-aimed); the press faces are declared where they are served
# (169); a card face that moved, or a card that is not the one the build
# draws, is caught (166, 163).
# 6.5.0: the crew's page is built from the tree and unlisted (170).
# 6.5.4: the page is one man. A weekly issue has no desk plural, on the same
# pattern a morgue card uses; "US", a quoted "we" and an italic title are not it;
# the founding issue is the one exception; "Night Watchers" and "this paper"
# warn past their caps (166).
# 6.5.5: every page's twitter:title and twitter:description are its og twins
# (171); the paper ends on the app's one ask, under its colophon (172);
# CODEOWNERS gives CLAUDE.md and .claude/ to the owner (163).
# Every fixture names its section.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"
NB="$(pro nocturne/NOTEBOOK.md)"
F40="$(pro qa/nocturne-fixture/issues/2026-w40-the-tin-hour-gets-a-date/issue.md)"
T='It is ninety seconds long'
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

run_case "a quotation with no work named" \
  "quotes a line without naming its work in italics" \
  "${NB}s=s+'\n## 2026-W40\n\n- 2026-09-28 — The director said “it is the darkest yet”. [Trade](https://example.com/a)\n';${W}" \
  guards "" 166

run_case "two quotations in one entry" \
  "carries 2 quotations — one per entry" \
  "${NB}s=s+'\n## 2026-W40\n\n- 2026-09-28 \u2014 In *Batman* (1989): \u201cone\u201d and \u201ctwo\u201d. [Trade](https://example.com/a)\n';${W}" \
  guards "" 166

run_case "a quotation longer than a line" \
  "quotes 26 words" \
  "${NB}s=s+'\n## 2026-W40\n\n- 2026-09-28 \u2014 In *Batman* (1989): \u201c'+' '.join(['word']*26)+'\u201d. [Trade](https://example.com/a)\n';${W}" \
  guards "" 166

run_case "a quotation mark left open" \
  "a quotation mark without its pair" \
  "${NB}s=s+'\n## 2026-W40\n\n- 2026-09-28 \u2014 In *Batman* (1989): \u201cunclosed. [Trade](https://example.com/a)\n';${W}" \
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

run_case "CODEOWNERS forgets the reporter's file" \
  "does not give /nocturne/REPORTER.md to the owner" \
  "$(pro .github/CODEOWNERS)a='/nocturne/REPORTER.md @6ummy-Dev\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 163

run_case "CODEOWNERS forgets the casebook" \
  "does not give /nocturne/CASEBOOK.md to the owner" \
  "$(pro .github/CODEOWNERS)a='/nocturne/CASEBOOK.md @6ummy-Dev\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 163

echo "--- 166: the reporter's plain rules"

run_case "a second I in one issue" \
  "appears 2 times — once an issue at most" \
  "${F40}a='${T}';assert s.count(a)==1;s=s.replace(a,'I saw it. I timed it. '+a,1);${W}" \
  guards "" 166

run_case "two Hellbox regulars in one issue" \
  "one Hellbox regular at most" \
  "${F40}a='${T}';assert s.count(a)==1;s=s.replace(a,'Dorrie poured. Cal Rhine said nothing. '+a,1);${W}" \
  guards "" 166

run_case "the cut regular comes back" \
  "\"Father Lusk\" never goes in the paper" \
  "${F40}a='${T}';assert s.count(a)==1;s=s.replace(a,'Father Lusk listened. '+a,1);${W}" \
  guards "" 166

run_case "a DC paper borrowed" \
  "\"Gotham Gazette\" never goes in the paper" \
  "${F40}a='${T}';assert s.count(a)==1;s=s.replace(a,'The Gotham Gazette ran it first. '+a,1);${W}" \
  guards "" 166

run_case "the boast in print" \
  "\"best journalist\" never goes in the paper" \
  "${F40}a='${T}';assert s.count(a)==1;s=s.replace(a,'Ask the best journalist in town. '+a,1);${W}" \
  guards "" 166

run_case "Batman likes a film" \
  "Batman on the real world" \
  "${F40}a='${T}';assert s.count(a)==1;s=s.replace(a,'Batman would like this one. '+a,1);${W}" \
  guards "" 166

run_case "Batman told the desk" \
  "Batman on the real world" \
  "${F40}a='${T}';assert s.count(a)==1;s=s.replace(a,'Batman told me it was good. '+a,1);${W}" \
  guards "" 166

run_case "a banned name listed in names to slip past" \
  "is a bare word, not a name" \
  "${F40}a='names: [';assert s.count(a)==1;s=s.replace(a,'names: [\"Father Lusk\", ',1);${W}" \
  guards "" 166

echo "--- 166: the sentence counts warn, and still fire (6.3.4)"

run_case "the -ing warning is switched off" \
  "the -ing warning no longer fires" \
  "${N}a='var STYLE = {ing: 4,';assert s.count(a)==1;s=s.replace(a,'var STYLE = {ing: 999,',1);${W}" \
  guards "" 166

run_case "the -ly warning is switched off" \
  "the -ly warning no longer fires" \
  "${N}a=' ly: 2,';assert s.count(a)==1;s=s.replace(a,' ly: 999,',1);${W}" \
  guards "" 166

run_case "the evenness warning is switched off" \
  "the evenness warning no longer fires" \
  "${N}a=' even: 0.2,';assert s.count(a)==1;s=s.replace(a,' even: 0,',1);${W}" \
  guards "" 166

run_case "the simile cap drifts to two" \
  "the simile cap is not one an issue" \
  "${N}a=' similes: 1};';assert s.count(a)==1;s=s.replace(a,' similes: 2};',1);${W}" \
  guards "" 166

run_case "an idiom counts as a simile" \
  "no longer tells a simile from an idiom" \
  "${N}a='(?!(?:long|soon|well|far|';assert s.count(a)==1;s=s.replace(a,'(?!(?:',1);${W}" \
  guards "" 166

run_case "the warnings refuse the run" \
  "they warn and never fail" \
  "${N}a='\n  if(b.errors.length){';assert s.count(a)==1;s=s.replace(a,'\n  if(b.errors.length || b.warnings.length){',1);${W}" \
  guards "" 166

run_case "the warnings are never printed" \
  "the sentence warnings are never printed" \
  "${N}a='\n  printWarnings(b.warnings);\n';assert s.count(a)==1;s=s.replace(a,'\n',1);${W}" \
  guards "" 166

run_case "the house sample goes soft on -ings" \
  "the Nocturne fixture trips a sentence warning" \
  "${F40}a='${T}';assert s.count(a)==1;s=s.replace(a,'Waiting, hoping, wishing, dreaming, trusting, fearing. '+a,1);${W}" \
  guards "" 166

echo "--- 166 and 163: the morgue file (6.3.5)"

MG="$(pro nocturne/MORGUE.md)"
L1='- 1939-03-30 on-sale | debut | first-party | Batman debuts'

run_case "the morgue file is deleted" \
  "nocturne/MORGUE.md is gone" \
  "import os;os.remove('nocturne/MORGUE.md')" \
  guards "" 166

run_case "the morgue file's header is rewritten" \
  "the header stays as the owner wrote it" \
  "${MG}a='# The morgue file\n';assert s.startswith(a);s='# Morgue\n'+s[len(a):];${W}" \
  guards "" 166

run_case "a loose note among the entries" \
  "not an entry" \
  "${MG}s=s+'Remember to check the Robin date.\n';${W}" \
  guards "" 166

run_case "a wiki as a morgue source" \
  "is never a morgue source" \
  "${MG}a='https://www.comics.org/issue/442/';assert s.count(a)==1;s=s.replace(a,'https://en.wikipedia.org/wiki/Batman',1);${W}" \
  guards "" 166

run_case "an on-sale date with only a year" \
  "needs a full date" \
  "${MG}a='- 1939-03-30 on-sale';assert s.count(a)==1;s=s.replace(a,'- 1939 on-sale',1);${W}" \
  guards "" 166

run_case "the entries out of order" \
  "entries run in date order" \
  "${MG}s=s+'- 1938-01-01 event | event | first-party | A card filed out of order. | [DC](https://www.dc.com/) | checked 2026-09-26\n';${W}" \
  guards "" 166

run_case "a DISPUTED fact on one source" \
  "a DISPUTED fact carries both sources" \
  "${MG}s=s+'- 2026-01-01 event | event | first-party | DISPUTED: a date two pages disagree on. | [DC](https://www.dc.com/) | checked 2026-09-26\n';${W}" \
  guards "" 166

run_case "an outcome in a card" \
  "premise only; the morgue never carries an outcome" \
  "${MG}a='Batman debuts in';assert s.count(a)==1;s=s.replace(a,'Batman debuts and a hero dies in',1);${W}" \
  guards "" 166

run_case "a card with a voice" \
  "a card has no voice" \
  "${MG}a='Batman debuts in';assert s.count(a)==1;s=s.replace(a,'We think Batman debuts in',1);${W}" \
  guards "" 166

run_case "the reporter's fiction in the morgue" \
  "is the reporter's fiction" \
  "${MG}a='Batman debuts in';assert s.count(a)==1;s=s.replace(a,'Batman, as Dorrie remembers, debuts in',1);${W}" \
  guards "" 166

run_case "the morgue file reaches a built page" \
  "carries the morgue file" \
  "${N}a=\"'<p class=\\\"colophon\\\">' + COLOPHON + '</p>\";assert s.count(a)==1;s=s.replace(a,\"'<p class=\\\"colophon\\\">' + COLOPHON + ' # The morgue file</p>\",1);${W}" \
  guards "" 166

run_case "CODEOWNERS forgets the morgue file" \
  "does not give /nocturne/MORGUE.md to the owner" \
  "$(pro .github/CODEOWNERS)a='/nocturne/MORGUE.md  @6ummy-Dev\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 163

# 6.5.5: the agent rules and the Claude Code hook are the owner's too.
# .claude/settings.json runs a shell command in every Claude Code session
# on the repo.
run_case "CODEOWNERS forgets CLAUDE.md" \
  "does not give /CLAUDE.md to the owner" \
  "$(pro .github/CODEOWNERS)a='/CLAUDE.md           @6ummy-Dev\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 163

# 6.5.6: AGENTS.md points Cursor at the rules. Same owner row as CLAUDE.md.
run_case "CODEOWNERS forgets AGENTS.md" \
  "does not give /AGENTS.md to the owner" \
  "$(pro .github/CODEOWNERS)a='/AGENTS.md           @6ummy-Dev\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 163

run_case "CODEOWNERS forgets the .claude folder" \
  "does not give /.claude/ to the owner" \
  "$(pro .github/CODEOWNERS)a='/.claude/            @6ummy-Dev\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 163

echo "--- 166: the research cut's plain rules (6.3.5)"

run_case "an issue cites the morgue file" \
  "the morgue file is never a source" \
  "${F40}a='sources: [';assert s.count(a)>=1;s=s.replace(a,'sources: [\"https://github.com/6ummy-Dev/Night-Watcher/blob/main/nocturne/MORGUE.md\", ',1);${W}" \
  guards "" 166

run_case "Kane named alone as creator" \
  "named without Bill Finger" \
  "${F40}a='${T}';assert s.count(a)==1;s=s.replace(a,'Batman was created by Bob Kane in 1939. '+a,1);${W}" \
  guards "" 166

run_case "charged for" \
  "a filing is not a fact (VOICE.md" \
  "${F40}a='${T}';assert s.count(a)==1;s=s.replace(a,'He was charged for it. '+a,1);${W}" \
  guards "" 166

run_case "a film reporter's name in the paper" \
  "\"Kolchak\" never goes in the paper" \
  "${F40}a='${T}';assert s.count(a)==1;s=s.replace(a,'Kolchak would have filed it. '+a,1);${W}" \
  guards "" 166

echo "--- 168/169/166/163: the front, the press faces and the card (6.4.0)"

CR="$(pro qa/nocturne-fonts/card/record.json)"

run_case "a card loses its stamp" \
  "carries no nw-card stamp" \
  "${N}a='return pngText(png, CARD.key, sum);';assert s.count(a)==1;s=s.replace(a,'return png;',1);${W}" \
  guards "" 168

run_case "the issue shares the site's card again" \
  "its og:image is its own card" \
  "${N}a='var ogImg = {url: url + ';assert s.count(a)==1;i=s.index(a);j=s.index(';',i);s=s[:i]+'var ogImg = SHARE'+s[j:];${W}" \
  guards "" 168

run_case "the reading face is served but never declared" \
  "no longer declares the paper's face newsreader-latin-400-normal.woff2" \
  "${N}L=s.split('\n');k=[i for i,l in enumerate(L) if 'READ.file' in l and '@font-face' in l];assert len(k)==1;del L[k[0]];s='\n'.join(L);${W}" \
  guards "" 169

run_case "a card face is not the copy its record blessed" \
  "is not the copy its record blessed" \
  "${CR}a='\"sha256\": \"';assert s.count(a)==4;s=s.replace(a,a+'0',1);${W}" \
  guards "" 166

run_case "the card's headline is set another size" \
  "card.png is not what the build writes" \
  "${N}a='var size = 66,';assert s.count(a)==1;s=s.replace(a,'var size = 62,',1);${W}" \
  guards "" 163

echo "--- 170: the crew's page is built and unlisted (6.5.0)"

HW="$(pro qa/hww.js)"

run_case "a fact on the crew's page moves without a rebuild" \
  "the crew's page drifted from its build" \
  "${HW}a='var LAST_AUDIT = \"6.6.0\";';assert s.count(a)==1;s=s.replace(a,'var LAST_AUDIT = \"6.4.0\";',1);${W}" \
  guards "" 170

run_case "the crew's page loses its noindex" \
  "has lost its noindex" \
  "${HW}a='noindex, nofollow\">';assert s.count(a)==1;s=s.replace(a,'index, follow\">',1);${W}" \
  guards "" 170

run_case "the app links to the crew's page" \
  "links to /hww" \
  "$(pro docs/index.html)a='<div id=\"splash\"';assert s.count(a)==1;s=s.replace(a,'<a href=\"/hww/\">How we work</a>'+a,1);${W}" \
  guards "" 170

run_case "the crew's page loses its noindex header" \
  "rule is not the reviewed three" \
  "$(pro docs/_headers)a='  X-Robots-Tag: noindex, nofollow\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 170

run_case "the worker takes the crew's page in" \
  "does not step aside for /hww/" \
  "$(pro docs/sw.js)a='  if(url.pathname.indexOf(\"/hww/\") === 0) return;\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 170

run_case "the sitemap lists the crew's page" \
  "the sitemap lists /hww" \
  "$(pro docs/sitemap.xml)a='</urlset>';assert s.count(a)==1;s=s.replace(a,'<url><loc>https://nightwatcher.life/hww/</loc></url>\n'+a,1);${W}" \
  guards "" 170

echo "--- 164: the theme switch keeps to the paper (6.5.0); Share names its own issue, twitter:image is og:image (6.5.1)"

run_case "paper.js writes the app's settings" \
  "writes something other than the paper's own theme key" \
  "${N}a='localStorage.setItem(\\\\\"nocturne-theme\\\\\",v);';assert s.count(a)==1;s=s.replace(a,a+'localStorage.setItem(\\\\\"nw-theme\\\\\",v);',1);${W}" \
  guards "" 164

run_case "a page loses the theme switch" \
  "does not carry the Dark deco / Darker switch" \
  "${N}a='>Dark deco</button>';assert s.count(a)==1;s=s.replace(a,'>Dark</button>',1);${W}" \
  guards "" 164

run_case "an issue's Share button names another issue" \
  "does not name the issue's own address" \
  "${N}a='footer(shareButton(url, ';assert s.count(a)==1;s=s.replace(a,'footer(shareButton(SITE + \"/nocturne/2026-w01-another/\", ',1);${W}" \
  guards "" 164

run_case "an issue carries two Share buttons" \
  "does not carry its one Share button" \
  "${N}a='footer(shareButton(url, ';assert s.count(a)==1;s=s.replace(a,'footer(shareButton(url, \"x\") + shareButton(url, ',1);${W}" \
  guards "" 164

run_case "twitter:image points somewhere else than og:image" \
  "does not carry one twitter:image equal to its og:image" \
  "${N}a='name=\"twitter:image\" content=\"\\' + o.img.url';assert s.count(a)==1;s=s.replace(a,'name=\"twitter:image\" content=\"\\' + SHARE.url',1);${W}" \
  guards "" 164

echo "--- 171: every page's twitter:title and twitter:description are its og twins (6.5.5)"

run_case "Home's twitter:title says something else than its og:title" \
  "Home's twitter:title is not its og:title" \
  "${P}a='<meta name=\"twitter:title\" content=\"Night Watcher · ';assert s.count(a)==1;s=s.replace(a,'<meta name=\"twitter:title\" content=\"Night Watcher, ',1);${W}" \
  guards "" 171

run_case "Home carries twitter:description twice" \
  "Home carries 2 twitter:description tags" \
  "${P}import re;a=re.search(r'<meta name=\"twitter:description\" content=\"[^\"]+\">\n',s);assert a;s=s.replace(a.group(0),a.group(0)*2,1);${W}" \
  guards "" 171

run_case "the paper's twitter:title is typed from the page title, not og:title" \
  "twitter:title is not its og:title" \
  "${N}a='name=\"twitter:title\" content=\"\\' + esc(o.ogTitle)';assert s.count(a)==1;s=s.replace(a,'name=\"twitter:title\" content=\"\\' + esc(o.title)',1);${W}" \
  guards "" 171

run_case "the paper drops twitter:description" \
  "carries 0 twitter:description tags" \
  "${N}a='name=\"twitter:description\" content=\"';assert s.count(a)==1;s=s.replace(a,'name=\"twitter:summary\" content=\"',1);${W}" \
  guards "" 171

echo "--- 172: the paper ends on the app's one ask, under its colophon (6.5.5)"

run_case "the paper's support line changes its words" \
  "qa/nocturne.js's support line is not the owner's" \
  "${N}a='Keep the path lit. <a href=';assert s.count(a)==1;s=s.replace(a,'Keep the lights on. <a href=',1);${W}" \
  guards "" 172

run_case "the paper's support line links another page" \
  "does not carry the support line exactly once" \
  "${N}a='/en/c/nightwatcher';assert s.count(a)==1;s=s.replace(a,'/en/c/nightwatcher-two',1);${W}" \
  guards "" 172

run_case "the paper's support line drops noopener noreferrer" \
  "qa/nocturne.js's support line is not the owner's" \
  "${N}a=' rel=\"noopener noreferrer\">Support</a>';assert s.count(a)==1;s=s.replace(a,'>Support</a>',1);${W}" \
  guards "" 172

run_case "the paper's support line climbs above the colophon" \
  "is not the last line of the foot, under the colophon" \
  "${N}Q=chr(39);a='<p class=\"support\">'+Q+' + SUPPORT + '+Q+'</p>';assert s.count(a)==1;s=s.replace(a,'',1)
b='<div class=\"acts\">';assert s.count(b)==1;s=s.replace(b,a+b,1);${W}" \
  guards "" 172

run_case "the paper carries its support line twice" \
  "does not carry the support line exactly once" \
  "${N}Q=chr(39);a='<p class=\"support\">'+Q+' + SUPPORT + '+Q+'</p>';assert s.count(a)==1;s=s.replace(a,a+a,1);${W}" \
  guards "" 172

echo "--- 166: one man writes the page (6.5.4)"

run_case "the desk says we in the cold open" \
  "the desk plural appears 1 time (we)" \
  "${F40}a='the one the week owed.';assert s.count(a)==1;s=s.replace(a,'the one we owed.',1);${W}" \
  guards "" 166

run_case "a story asks us" \
  "the desk plural appears 1 time (us)" \
  "${F40}a='keeps for the night it opens.';assert s.count(a)==1;s=s.replace(a,'keeps for the night it opens for us.',1);${W}" \
  guards "" 166

run_case "the sign-off says our" \
  "the desk plural appears 1 time (Our)" \
  "${F40}a=\"The file's open again next Sunday.\";assert s.count(a)==1;s=s.replace(a,\"Our file's open again next Sunday.\",1);${W}" \
  guards "" 166

run_case "a story keeps it to ourselves" \
  "the desk plural appears 1 time (ourselves)" \
  "${F40}a='a rumour with a good lawyer.';assert s.count(a)==1;s=s.replace(a,'a rumour kept to ourselves.',1);${W}" \
  guards "" 166

run_case "a story says we're" \
  "the desk plural appears 1 time (we're)" \
  "${F40}a='Pre-order dates slip, so';assert s.count(a)==1;s=s.replace(a,\"Pre-order dates slip, and we're watching, so\",1);${W}" \
  guards "" 166

run_case "a headline says our" \
  "the desk plural appears" \
  "${F40}a='The toys have the decency to come second';assert s.count(a)==2;s=s.replace(a,'Our toys have the decency to come second');${W}" \
  guards "" 166

run_case "a correction says we" \
  "the desk plural appears 1 time (we)" \
  "${F40}a='the date is the 23rd, not the 21st.';assert s.count(a)==1;s=s.replace(a,'we had the date as the 21st, not the 23rd.',1);${W}" \
  guards "" 166

run_case "US, the country, goes lower case" \
  "the desk plural appears 1 time (us)" \
  "${F40}a='own US listing';assert s.count(a)==1;s=s.replace(a,'own us listing',1);${W}" \
  guards "" 166

run_case "a card says we're" \
  "a card has no voice" \
  "${MG}a='Batman debuts in';assert s.count(a)==1;s=s.replace(a,\"We're sure Batman debuts in\",1);${W}" \
  guards "" 166

run_case "a card says ours" \
  "a card has no voice" \
  "${MG}a='Batman debuts in';assert s.count(a)==1;s=s.replace(a,'Ours: Batman debuts in',1);${W}" \
  guards "" 166

run_case "the pattern forgets us" \
  "the desk plural no longer catches we, we're, our, ours, ourselves and us" \
  "${N}a='|us|Us)';assert s.count(a)==1;s=s.replace(a,'|Us)',1);${W}" \
  guards "" 166

run_case "the pattern reads US as us" \
  "the desk plural catches a US studio, a quoted" \
  "${N}a='return (t.match(DESK_PLURAL) || [])';assert s.count(a)==1;s=s.replace(a,'return (t.match(new RegExp(DESK_PLURAL.source, \"gi\")) || [])',1);${W}" \
  guards "" 166

run_case "the founding issue loses its exemption" \
  "the desk plural appears" \
  "${N}a='if(kind !== \"founding\") deskPluralErrors';assert s.count(a)==1;s=s.replace(a,'if(true) deskPluralErrors',1);${W}" \
  guards "" 166

run_case "the Night Watchers warning is switched off" \
  "the Night Watchers warning no longer fires" \
  "${N}a='if(nw > 1)';assert s.count(a)==1;s=s.replace(a,'if(nw > 9)',1);${W}" \
  guards "" 166

run_case "the this-paper warning is switched off" \
  "the this-paper warning no longer fires" \
  "${N}a='if(pp > 2)';assert s.count(a)==1;s=s.replace(a,'if(pp > 9)',1);${W}" \
  guards "" 166

run_case "the Night Watchers warning fires on one" \
  "the pronoun warnings fire on one Night Watchers" \
  "${N}a='if(nw > 1)';assert s.count(a)==1;s=s.replace(a,'if(nw > 0)',1);${W}" \
  guards "" 166

finish "negtest780"
