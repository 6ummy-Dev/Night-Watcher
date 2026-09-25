#!/bin/bash
# negtest770 — 6.3.0, the paper grows up before its first Sunday. The paper's
# one third party is Cloudflare Web Analytics, named only in its own header
# rule (42); an issue pull request runs the paper's checks and every push
# runs everything (163); the paper runs two scripts, ours and the beacon's,
# at their places (164); the app carries no beacon (165); beats, the Board,
# the Off the map chip, the placement line, names that are names, the names
# field, Late wires and images under their own story (166); the paper
# follows the app's darker theme and prints it white (169). Every fixture
# names its section.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"
HD="$(pro docs/_headers)"
QA="$(pro .github/workflows/qa.yml)"
F39="$(pro qa/nocturne-fixture/issues/2026-w39-one-path-through-every-batman/issue.md)"
F40="$(pro qa/nocturne-fixture/issues/2026-w40-the-tin-hour-gets-a-date/issue.md)"
echo "--- 42: the paper's one third party"

run_case "the paper's header rule reaches a second third party" \
  "the paper's only third party is Cloudflare Web Analytics" \
  "${HD}a='connect-src https://cloudflareinsights.com;';assert s.count(a)==1;s=s.replace(a,'connect-src https://cloudflareinsights.com https://example.com;',1);${W}" \
  guards "" 42

run_case "the beacon's origin in the header rule for every page" \
  "reaches out to static.cloudflareinsights.com" \
  "${HD}a='  Cross-Origin-Resource-Policy: same-origin\\n';assert s.count(a)==1;s=s.replace(a,'  Cross-Origin-Resource-Policy: same-origin\\n  Link: <https://static.cloudflareinsights.com/>; rel=preconnect\\n',1);${W}" \
  guards "" 42

echo "--- 163: an issue pull request runs the paper's checks"

run_case "the scope takes in a path outside the fence" \
  "scope for issue pull requests is gone or widened" \
  "${QA}a=\"|docs/sitemap\\\\.xml\$)' >/dev/null; then\";assert s.count(a)==1;s=s.replace(a,\"|docs/sitemap\\\\.xml\$|qa/)' >/dev/null; then\",1);${W}" \
  guards "" 163

run_case "pushes to main get scoped too" \
  "scopes pull requests only" \
  "${QA}a='if [ \"\${{ github.event_name }}\" = \"pull_request\" ]; then';assert s.count(a)==1;s=s.replace(a,'if true; then',1);${W}" \
  guards "" 163

run_case "npm test skipped for every pull request" \
  "runs npm test on everything but an issue pull request" \
  "${QA}a=\"      - if: needs.scope.outputs.paper != 'true'\\n        run: npm test\";assert s.count(a)==1;s=s.replace(a,\"      - if: github.event_name != 'pull_request'\\n        run: npm test\",1);${W}" \
  guards "" 163

run_case "the scope moves into a paths filter" \
  "filters on paths" \
  "${QA}a='  pull_request:\\n    branches: [main]\\n';assert s.count(a)==1;s=s.replace(a,\"  pull_request:\\n    branches: [main]\\n    paths:\\n      - 'docs/index.html'\\n\",1);${W}" \
  guards "" 163

echo "--- 164: two scripts, ours and the beacon's"

run_case "a third script on every page" \
  "carries a script that is not a JSON-LD data block, theme.js or the analytics beacon" \
  "${N}a=\"'</main>\\\\n' + BEACON\";assert a in s;s=s.replace(a,'\\'</main>\\\\n<script src=\"/nocturne/x.js\"></script>\\\\n\\' + BEACON');${W}" \
  guards "" 164

run_case "theme.js moves to the end of the head" \
  "does not load theme.js exactly once at the top" \
  "${N}a='<meta charset=\"utf-8\">\\\\n\\' + THEME_TAG + \\'\\\\n\\' +';assert a in s;s=s.replace(a,'<meta charset=\"utf-8\">\\\\n\\' +',1);a='(o.extra || \"\") + \\'</head>\\\\n\\'';assert a in s;s=s.replace(a,'(o.extra || \"\") + THEME_TAG + \\'</head>\\\\n\\'',1);${W}" \
  guards "" 164

run_case "the pages stop counting their visits" \
  "does not carry the analytics beacon exactly once" \
  "${N}a=\"'</main>\\\\n' + BEACON + '\\\\n</body>\";assert a in s;s=s.replace(a,\"'</main>\\\\n</body>\");${W}" \
  guards "" 164

run_case "theme.js starts writing to storage" \
  "theme.js does more than read" \
  "${N}a='setAttribute(\\\\\"data-theme\\\\\",\\\\\"darker\\\\\");}catch(e){}';assert a in s;s=s.replace(a,'setAttribute(\\\\\"data-theme\\\\\",\\\\\"darker\\\\\");localStorage.setItem(\\\\\"seen\\\\\",\\\\\"1\\\\\");}catch(e){}',1);${W}" \
  guards "" 164

echo "--- 165: the app counts nothing"

run_case "the beacon lands in the app" \
  "the app counts nothing" \
  "${P}a='</body>';assert s.count(a)==1;s=s.replace(a,'<script defer src=\"https://static.cloudflareinsights.com/beacon.min.js\"></script></body>',1);${W}" \
  guards "" 165

echo "--- 166: beats, the Board, names, Late wires, images under their story"

run_case "a weekly story without its beat" \
  "is missing \"beat\"" \
  "${F40}a='    beat: comics\\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 166

run_case "a beat that is not a beat" \
  "beat is gossip" \
  "${F40}a='    beat: comics\\n';assert s.count(a)==1;s=s.replace(a,'    beat: gossip\\n',1);${W}" \
  guards "" 166

run_case "the founding issue takes a beat" \
  "carries a beat" \
  "${F39}a='    status: confirmed\\n';assert a in s;s=s.replace(a,'    status: confirmed\\n    beat: screen\\n',1);${W}" \
  guards "" 166

run_case "names used for our own words" \
  "is a bare word, not a name" \
  "${F40}a='names: [\"The Tin Hour: Legendary Nights\"]';assert s.count(a)==1;s=s.replace(a,'names: [\"The Tin Hour: Legendary Nights\", \"epic\"]',1);${W}" \
  guards "" 166

run_case "a name the issue never prints" \
  "is not printed in the issue" \
  "${F40}a='names: [\"The Tin Hour: Legendary Nights\"]';assert s.count(a)==1;s=s.replace(a,'names: [\"The Tin Hour: Legendary Nights\", \"Legendary Tin Men\"]',1);${W}" \
  guards "" 166

run_case "the listed word beside a catalogue name" \
  "on VOICE.md §8's never-use list" \
  "${F40}a='*Teen Titans Go!* did it on television';assert s.count(a)==1;s=s.replace(a,'*Teen Titans Go!* did it, epic, on television',1);${W}" \
  guards "" 166

run_case "a catalogue name re-cased is not the name" \
  "an exclamation mark" \
  "${F40}a='*Teen Titans Go!* did it';assert s.count(a)==1;s=s.replace(a,'*Teen Titans GO!* did it',1);${W}" \
  guards "" 166

run_case "the checker forgets that names are names" \
  "an exclamation mark" \
  "${N}a='var EX = (cat.__names || []).filter(';assert s.count(a)==1;s=s.replace(a,'var EX = [].filter(',1);${W}" \
  guards "" 166

run_case "an image after a story that is not there" \
  "is not a story number" \
  "${F40}a='    after: 6\\n';assert s.count(a)==1;s=s.replace(a,'    after: 9\\n',1);${W}" \
  guards "" 166

run_case "an image after Late wires" \
  "would follow Late wires" \
  "${F40}a='    after: 6\\n';assert s.count(a)==1;s=s.replace(a,'    after: 7\\n',1);${W}" \
  guards "" 166

run_case "two images under one story" \
  "both follow story 1" \
  "${F40}a='    after: 6\\n';assert s.count(a)==1;s=s.replace(a,'    after: 1\\n',1);a='hero: key-art.webp\\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 166

run_case "a catalogued title moves inside Late wires" \
  "is Late wires" \
  "${F40}a='    beat: other\\n    catalogue: none\\n';assert s.count(a)==1;s=s.replace(a,'    beat: other\\n    catalogue: knightfall-part-2-knightquest-2026\\n',1);${W}" \
  guards "" 166

run_case "the renderer drops the Board" \
  "no Board under the banner" \
  "${N}a='(founding ? \"\" : board(fm, cat))';assert s.count(a)==1;s=s.replace(a,'\"\"',1);${W}" \
  guards "" 166

run_case "the renderer drops the Off the map chip" \
  "Off the map chip" \
  "${N}a='(offMap(st) ? \\'<span class=\"off\">Off the map</span>\\' : \"\")';assert s.count(a)==1;s=s.replace(a,'\"\"',1);${W}" \
  guards "" 166

run_case "the renderer drops the placement line" \
  "no placement line read out of PATH" \
  "${N}a='<p class=\"place\">\\' + placeLine(e) + \\'</p>';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 166

run_case "the renderer ignores after:" \
  "does not run under story 6" \
  "${N}a='out.push({im: im, index: i, after: im.after !== undefined ? im.after : k});';assert s.count(a)==1;s=s.replace(a,'out.push({im: im, index: i, after: k});',1);${W}" \
  guards "" 166

echo "--- 169: the paper follows the app's theme"

run_case "the paper's darker drifts from the app's" \
  "the paper follows the app" \
  "${N}a='return DARKER_KEYS.filter(function(k){ return have[k]; }).map(function(k){ return k + \":\" + have[k] + \";\"; }).join(\"\");';assert s.count(a)==1;s=s.replace(a,'return DARKER_KEYS.filter(function(k){ return have[k]; }).map(function(k){ return k + \":\" + (k === \"--ink\" ? \"#111111\" : have[k]) + \";\"; }).join(\"\");',1);${W}" \
  guards "" 169

run_case "print forgets the darker reader" \
  "prints black pages" \
  "${N}a='\"@media print{:root,:root[data-theme=\\\\\"darker\\\\\"]{--ink:#FFFFFF;';assert s.count(a)==1;s=s.replace(a,'\"@media print{:root{--ink:#FFFFFF;',1);${W}" \
  guards "" 169

finish "negtest770"
