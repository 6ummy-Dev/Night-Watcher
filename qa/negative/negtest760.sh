#!/bin/bash
# negtest760 — 6.2.3, the 6.2.2 audits' cut and what came forward for the
# first Night Final. The fence keys on the agent's account, runs from main and
# counts renames (163, QA N-2); the checker reads the built page's links back
# (N-1), refuses metadata in images (N-4), holds corrections to the story's
# rules (N-5) and weeks to the calendar (N-6), refuses characters the fonts
# lack, prices, calls to buy and tracked links, and knows the new ceiling
# (166); every story has an address (166); no page says "screen news" (167,
# house P3-1); the paper sets type on the app's scale, prints, and carries
# its own blessed italic (169); the backup reminder names the backup and
# clears when it lands (smoke, N-3). Every fixture names its section or its
# smoke check.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"
FE="$(pro .github/workflows/nocturne-fence.yml)"
F39="$(pro qa/nocturne-fixture/issues/2026-w39-one-path-through-every-batman/issue.md)"
F40="$(pro qa/nocturne-fixture/issues/2026-w40-the-tin-hour-gets-a-date/issue.md)"
D40="qa/nocturne-fixture/issues/2026-w40-the-tin-hour-gets-a-date"
IT="qa/nocturne-fonts/ibm-plex-sans-latin-400-italic.woff2"

echo "--- 163: the fence around the agent holds"

run_case "the fence stops counting renames" \
  "no longer diffs with --no-renames" \
  "${FE}a='git diff --no-renames --name-only';assert s.count(a)==1;s=s.replace(a,'git diff --name-only',1);${W}" \
  guards "" 163

run_case "the fence keys on a branch name again" \
  "keys on a branch name again" \
  "${FE}a=\"if: github.event.pull_request.user.login == 'nocturne-desk'\";assert s.count(a)==1;s=s.replace(a,\"if: startsWith(github.head_ref, 'nocturne/')\",1);${W}" \
  guards "" 163

run_case "the fence runs from the pull request's own copy" \
  "runs on pull_request_target" \
  "${FE}a='on:\n  pull_request_target:';assert s.count(a)==1;s=s.replace(a,'on:\n  pull_request:',1);${W}" \
  guards "" 163

run_case "the fence installs the pull request's packages" \
  "the fence around the drafting agent runs code" \
  "${FE}a='          persist-credentials: false\n';assert s.count(a)==1;s=s.replace(a,a+'\n      - run: npm ci\n',1);${W}" \
  guards "" 163

run_case "the fence file deleted" \
  "the fence around the drafting agent is gone —" \
  "import os;os.remove('.github/workflows/nocturne-fence.yml')" \
  guards "" 163

run_case "qa.yml takes a copy of the fence back" \
  "still carries a copy of the fence" \
  "$(pro .github/workflows/qa.yml)s=s+'\n  nocturne-paths:\n    runs-on: ubuntu-latest\n    steps:\n      - run: true\n';${W}" \
  guards "" 163

echo "--- 166: the checker, the links and the addresses"

run_case "the link is escaped twice again" \
  "renders a link to https://example.com/the-tin-hour/trailer-2?cut=final&amp;lang=en, which is not one of its sources" \
  "${N}a='+ links[+n] +';assert s.count(a)==1;s=s.replace(a,'+ esc(links[+n]) +',1);${W}" \
  guards "" 166

run_case "an image keeps its EXIF" \
  "carries EXIF metadata" \
  "import struct;p='${D40}/key-art.webp';b=open(p,'rb').read();x=b'VP8X'+struct.pack('<I',10)+bytes([8,0,0,0])+(1599).to_bytes(3,'little')+(899).to_bytes(3,'little');e=b'EXIF'+struct.pack('<I',6)+b'Exif\x00\x00';body=b'WEBP'+x+b[12:]+e;open(p,'wb').write(b'RIFF'+struct.pack('<I',len(body))+body)" \
  guards "" 166

run_case "an XMP chunk under a flag that says none" \
  "carries XMP metadata" \
  "import struct;p='${D40}/key-art.webp';b=open(p,'rb').read();x=b'VP8X'+struct.pack('<I',10)+bytes([0,0,0,0])+(1599).to_bytes(3,'little')+(899).to_bytes(3,'little');e=b'XMP '+struct.pack('<I',4)+b'<x/>';body=b'WEBP'+x+b[12:]+e;open(p,'wb').write(b'RIFF'+struct.pack('<I',len(body))+body)" \
  guards "" 166

run_case "a correction shouts" \
  "correction 1: an exclamation mark" \
  "${F40}a='the date is the 23rd, not the 21st.';assert s.count(a)==1;s=s.replace(a,'the date is the 23rd, not the 21st!',1);${W}" \
  guards "" 166

run_case "a correction links a page the story never listed" \
  "without listing it in story 1's sources" \
  "${F40}a='the date is the 23rd, not the 21st.';assert s.count(a)==1;s=s.replace(a,'[the listing](https://example.com/elsewhere) has the 23rd, not the 21st.',1);${W}" \
  guards "" 166

run_case "a week the calendar does not have" \
  "numbered 1 to 52" \
  "${F40}a='week: 2026-W40';assert s.count(a)==1;s=s.replace(a,'week: 2026-W60',1);${W}" \
  guards "" 166

run_case "week zero" \
  "numbered 1 to 52" \
  "${F40}a='week: 2026-W40';assert s.count(a)==1;s=s.replace(a,'week: 2026-W00',1);${W}" \
  guards "" 166

run_case "an arrow typed into a story" \
  "U+2197 (↗) — outside the paper's fonts" \
  "${F40}a='It is ninety seconds long';assert s.count(a)==1;s=s.replace(a,'It is ninety seconds long ↗',1);${W}" \
  guards "" 166

run_case "a star in an image's alt text" \
  "image 1's alt: U+2605" \
  "${F40}a='one yellow line\"';assert s.count(a)==1;s=s.replace(a,'one yellow line ★\"',1);${W}" \
  guards "" 166

run_case "a price in a story" \
  "a price — merch is news" \
  "${F40}a='It is ninety seconds long';assert s.count(a)==1;s=s.replace(a,'It costs \$19.99 and it is ninety seconds long',1);${W}" \
  guards "" 166

run_case "a call to buy" \
  "a call to buy" \
  "${F40}a='It has not moved anything';assert s.count(a)==1;s=s.replace(a,'Pre-order now. It has not moved anything',1);${W}" \
  guards "" 166

run_case "a source with a campaign tag" \
  "carries a tracking or affiliate parameter (utm_source)" \
  "${F40}a='https://example.com/trade/tin-hour-sequel';assert s.count(a)==2;s=s.replace(a,a+'?utm_source=x');${W}" \
  guards "" 166

run_case "a source through a shortener" \
  "is a shortener or an affiliate host" \
  "${F40}a='https://example.com/trade/tin-hour-sequel';assert s.count(a)==2;s=s.replace(a,'https://bit.ly/tin-hour');${W}" \
  guards "" 166

run_case "a story past the ceiling" \
  "words — 60 to 500" \
  "${F40}s=s.rstrip('\n')+'\n\n'+' '.join(['word']*460)+'.\n';${W}" \
  guards "" 166

run_case "the stories lose their addresses" \
  "does not give every story its own address" \
  "${N}a='out += '+chr(39)+'<section class='+chr(34)+'story'+chr(34)+' id='+chr(34)+'s';assert s.count(a)==1;s=s.replace(a,'out += '+chr(39)+'<section class='+chr(34)+'story'+chr(34)+' data-n='+chr(34)+'s',1);${W}" \
  guards "" 166

echo "--- 167: no page says screen news"

run_case "an issue page calls the paper screen news" \
  "still calls the paper" \
  "${F39}a=\"covers the week's Batman news.\";assert s.count(a)==1;s=s.replace(a,\"covers the week's Batman screen news.\",1);${W}" \
  guards "" 167

echo "--- 169: the paper sets type on the app's scale"

run_case "a size off the scale" \
  "sets a size off the scale: font-size:11px" \
  "${N}a='font-size:var(--t-note);letter-spacing:.06em';assert s.count(a)==1;s=s.replace(a,'font-size:11px;letter-spacing:.06em',1);${W}" \
  guards "" 169

run_case "the paper keeps its own copy of an app size" \
  "sets --t-note to 11px and the app sets 12px" \
  "${N}a='var TYPE_PAPER = '+chr(34);assert s.count(a)==1;s=s.replace(a,a+'--t-note:11px;',1);${W}" \
  guards "" 169

run_case "a size the app does not have" \
  "not one of the app's sizes" \
  "${N}a='var TYPE_PAPER = '+chr(34);assert s.count(a)==1;s=s.replace(a,a+'--t-huge:80px;',1);${W}" \
  guards "" 169

run_case "the print sheet keeps the buttons" \
  "lost its print sheet" \
  "${N}a='.acts{display:none;}';assert s.count(a)==1;s=s.replace(a,'.acts{opacity:.5;}',1);${W}" \
  guards "" 169

run_case "the feed sets its size in the shorthand" \
  "uses the font shorthand" \
  "${N}a='rss{display:block;';assert s.count(a)==1;s=s.replace(a,'rss{display:block;font:16px serif;',1);${W}" \
  guards "" 169

run_case "the arrow character comes back" \
  "carries U+2197" \
  "${N}a=\"Open the map' + ARROW + '\";assert s.count(a)==1;s=s.replace(a,'Open the map ↗',1);${W}" \
  guards "" 169

run_case "the italic's bytes change" \
  "the paper's italic ibm-plex-sans-latin-400-italic.woff2 is not the face" \
  "p='${IT}';b=bytearray(open(p,'rb').read());b[-1]^=1;open(p,'wb').write(bytes(b))" \
  guards "" 169

run_case "the italic moves into the app's fonts" \
  "is in docs/fonts/" \
  "import shutil;shutil.copy('${IT}','docs/fonts/')" \
  guards "" 169

run_case "the italic face drops out of the stylesheet" \
  "no longer declares the paper's italic face" \
  "${N}a='font-weight:400;font-style:italic;';assert s.count(a)==1;s=s.replace(a,'font-weight:400;',1);${W}" \
  guards "" 169

run_case "the licence stops travelling with the font" \
  "without OFL.txt beside it" \
  "${N}a='files['+chr(34)+'OFL.txt'+chr(34)+'] = ';assert s.count(a)==1;s=s.replace(a,'files['+chr(34)+'OFL-x.txt'+chr(34)+'] = ',1);${W}" \
  guards "" 169

run_case "the italic subset to other ranges" \
  "subset to different ranges" \
  "import json;p='qa/nocturne-fonts/record.json';r=json.load(open(p));r['ranges']=r['ranges'][:-1];open(p,'w').write(json.dumps(r,indent=2,sort_keys=True)+'\n')" \
  guards "" 169

echo "--- smoke: the backup reminder (QA N-3)"

run_case "the reminder asks for a code again" \
  "the backup reminder names the step that is the backup" \
  "${P}a='make a code and copy it, or save a file.';assert s.count(a)==1;s=s.replace(a,'a code takes one tap.',1);${W}" \
  "smoke" "main"

run_case "a landed copy stops re-rendering" \
  "the backup reminder clears on the copy that stamps it" \
  "${P}a='function stampExport(){ S.lastExportAt = Date.now(); persist(); render({quiet:true}); }';assert s.count(a)==1;s=s.replace(a,'function stampExport(){ S.lastExportAt = Date.now(); persist(); }',1);${W}" \
  "smoke" "main"

finish "negtest760"
