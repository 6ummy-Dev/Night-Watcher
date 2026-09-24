#!/bin/bash
# negtest750 — 6.2.0, Nocturne. The paper is what its build writes (163),
# runs no script (164), stays outside the app (165), every issue and the
# fixture keep the contract (166), the sitemap block and the feed list
# exactly the issues (167), and the paper keeps its weight (168). Every
# fixture names its section. 6.2.1: one door from Home (165) and the holding
# page with its open, empty feed (167). 6.2.2: the feed links its own
# stylesheet and says all of Batman (167), self-hosted (164), weighed (168).
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"
CSS="$(pro docs/nocturne/nocturne.css)"
HD="$(pro docs/_headers)"
SW="$(pro docs/sw.js)"
SM="$(pro docs/sitemap.xml)"
MF="$(pro docs/manifest.json)"
F39="$(pro qa/nocturne-fixture/issues/2026-w39-one-path-through-every-batman/issue.md)"
F40="$(pro qa/nocturne-fixture/issues/2026-w40-the-tin-hour-gets-a-date/issue.md)"
D40="qa/nocturne-fixture/issues/2026-w40-the-tin-hour-gets-a-date"

echo "--- 163: the paper is what its build writes"

run_case "a hand edit to the served stylesheet" \
  "is not what the build writes" \
  "${CSS}s=s+'.x{color:red;}\n';${W}" \
  guards "" 163

run_case "a stray page under docs/nocturne/" \
  "is not written by the build" \
  "open('docs/nocturne/stray.html','w').write('<p>hand made</p>')" \
  guards "" 163

run_case "the stylesheet deleted" \
  "has no nocturne.css" \
  "import os;os.remove('docs/nocturne/nocturne.css')" \
  guards "" 163

run_case "a URL typed into the sitemap's Nocturne block" \
  "Nocturne block is not what the build writes" \
  "${SM}a='  <!-- nocturne:end -->';assert a in s;s=s.replace(a,'  <url><loc>https://nightwatcher.life/nocturne/x/</loc></url>\n'+a,1);${W}" \
  guards "" 163

run_case "the fence around the agent's pull requests widens" \
  "fence around the drafting agent is gone or widened" \
  "$(pro .github/workflows/qa.yml)a='|docs/sitemap\\\\.xml\$)';assert a in s;s=s.replace(a,'|docs/sitemap\\\\.xml\$|qa/)',1);${W}" \
  guards "" 163

echo "--- 164: the paper runs no script"

run_case "the paper's policy grows a script-src" \
  "not the reviewed default-deny policy" \
  "${HD}a=\"default-src 'none'; style-src 'self';\";assert a in s;s=s.replace(a,\"default-src 'none'; script-src 'self'; style-src 'self';\",1);${W}" \
  guards "" 164

run_case "the /nocturne/* rule removed" \
  "has no /nocturne/* rule" \
  "${HD}a='/nocturne/*\n';assert a in s;s=s.replace(a,'/elsewhere/*\n',1);${W}" \
  guards "" 164

run_case "the renderer writes a script into every issue" \
  "a script that is not a JSON-LD data block" \
  "${N}a='<article>\\\\n<h1 class=\"banner\">';assert a in s;s=s.replace(a,'<script>void 0</script><article>\\\\n<h1 class=\"banner\">',1);${W}" \
  guards "" 164

run_case "the renderer writes an inline handler" \
  "carries an inline event handler" \
  "${N}a='<p class=\"cold\">';assert a in s;s=s.replace(a,'<p class=\"cold\" onclick=\"void 0\">',1);${W}" \
  guards "" 164

run_case "the colophon drops out of the footer" \
  "has lost the colophon" \
  "${N}a='<p class=\"colophon\">\\' + COLOPHON + \\'</p>';assert a in s;s=s.replace(a,'<p class=\"colophon\">Nocturne.</p>',1);${W}" \
  guards "" 164

run_case "the hero is hotlinked from another origin" \
  "loads an image from another origin" \
  "${N}a='<figure><img src=\"\\' + esc(hero.file)';assert a in s;s=s.replace(a,'<figure><img src=\"https://example.com/\\' + esc(hero.file)',1);${W}" \
  guards "" 164

echo "--- 165: the paper is outside the app"

run_case "sw.js stops stepping aside for /nocturne/" \
  "no longer steps aside for /nocturne/" \
  "${SW}a='  if(url.pathname.indexOf(\"/nocturne/\") === 0) return;\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 165

run_case "the worker answers a paper navigation, executed" \
  "answers a /nocturne/ navigation" \
  "${SW}a='  if(url.pathname.indexOf(\"/nocturne/\") === 0) return;\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 132

run_case "sw.js steps aside only after it has answered" \
  "only after respondWith" \
  "${SW}a='  if(url.pathname.indexOf(\"/nocturne/\") === 0) return;\n';assert a in s;s=s.replace(a,'',1);b='  );\n});';assert s.endswith(b+'\n');s=s[:-len(b)-1]+'  );\n  if(url.pathname.indexOf(\"/nocturne/\") === 0) return;\n});\n';${W}" \
  guards "" 165

run_case "the shell caches the paper's stylesheet" \
  "SHELL lists part of the paper" \
  "${SW}a='\"./icon.svg\",';assert a in s;s=s.replace(a,'\"./icon.svg\", \"./nocturne/nocturne.css\",',1);${W}" \
  guards "" 165

run_case "the app names another path into the paper" \
  "docs/index.html names /nocturne 2 times" \
  "${P}a='<title>';assert a in s;s=s.replace(a,'<link rel=\"alternate\" href=\"/nocturne/feed.xml\"><title>',1);${W}" \
  guards "" 165

run_case "Home's door to the paper loses its new tab" \
  "has 0 links to the paper built like Where to watch" \
  "${P}a='href=\"/nocturne/\" target=\"_blank\" rel=';assert a in s;s=s.replace(a,'href=\"/nocturne/\" rel=',1);${W}" \
  guards "" 165

run_case "a second door to the paper" \
  "has 2 links to the paper built like Where to watch" \
  "${P}a='<p class=\"homefoot\">Night Watcher';assert a in s;s=s.replace(a,'<a class=\"lnk paperlnk\" href=\"/nocturne/\" target=\"_blank\" rel=\"noopener noreferrer\">Paper</a>'+a,1);${W}" \
  guards "" 165

run_case "the 404 mentions the paper" \
  "docs/404.html mentions the paper" \
  "$(pro docs/404.html)a='<title>';assert a in s;s=s.replace(a,'<title>Nocturne \u00b7 ',1);${W}" \
  guards "" 165

run_case "the manifest mentions the paper" \
  "docs/manifest.json mentions the paper" \
  "${MF}a='\"description\": \"';assert a in s;s=s.replace(a,'\"description\": \"With Nocturne. ',1);${W}" \
  guards "" 165

echo "--- 166: every issue keeps the contract"

run_case "a real issue that breaks the contract" \
  "an issue breaks the contract" \
  "import os;os.makedirs('nocturne/issues/2026-w39-broken',exist_ok=True);open('nocturne/issues/2026-w39-broken/issue.md','w').write('---\nissue: 0\n---\n')" \
  guards "" 166

run_case "an exclamation mark in the cold open" \
  "an exclamation mark" \
  "${F40}a='the one we were waiting for.';assert a in s;s=s.replace(a,'the one we were waiting for!',1);${W}" \
  guards "" 166

run_case "a never-use word in a story" \
  "on VOICE.md §7's never-use list" \
  "${F40}a='It is ninety seconds long';assert a in s;s=s.replace(a,'It is an iconic ninety seconds long',1);${W}" \
  guards "" 166

run_case "a source the story never links" \
  "lists a source its text never links" \
  "${F40}a='sources: [\"https://example.com/trade/tin-hour-sequel\"]';assert a in s;s=s.replace(a,'sources: [\"https://example.com/trade/tin-hour-sequel\", \"https://example.com/elsewhere\"]',1);${W}" \
  guards "" 166

run_case "a link the story does not list as a source" \
  "without listing it in sources" \
  "${F40}a='It has not moved anything';assert a in s;s=s.replace(a,'It has not moved [anything](https://example.com/aside)',1);${W}" \
  guards "" 166

run_case "an issue published on a Saturday" \
  "is not a Sunday" \
  "${F40}a='published: 2026-10-04';assert a in s;s=s.replace(a,'published: 2026-10-03',1);${W}" \
  guards "" 166

run_case "a catalogue id the app does not have" \
  "is not in PATH" \
  "${F40}a='catalogue: knightfall-part-2-knightquest-2026';assert a in s;s=s.replace(a,'catalogue: knightfall-part-9-2026',1);${W}" \
  guards "" 166

run_case "the founding issue points at the catalogue" \
  "the founding issue is about the app" \
  "${F39}a='    catalogue: none';assert a in s;s=s.replace(a,'    catalogue: knightfall-part-2-knightquest-2026',1);${W}" \
  guards "" 166

run_case "an image loses its licence" \
  "no licence record, no image" \
  "${F40}a='    licence: \"Official public promotional image\"\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 166

run_case "an image claims a size it does not have" \
  "and the file is 1600x900" \
  "${F40}a='    width: 1600';assert a in s;s=s.replace(a,'    width: 1500',1);${W}" \
  guards "" 166

run_case "an image cut short on the way in" \
  "is not a whole WebP file" \
  "p='${D40}/key-art.webp';b=open(p,'rb').read();open(p,'wb').write(b[:-1])" \
  guards "" 166

run_case "a file in the issue's folder nobody listed" \
  "is not a listed image" \
  "open('${D40}/extra.webp','wb').write(b'RIFF')" \
  guards "" 166

run_case "a gap in the issue numbers" \
  "with no gap" \
  "${F40}a='issue: 1\n';assert a in s;s=s.replace(a,'issue: 2\n',1);${W}" \
  guards "" 166

run_case "a list in the body" \
  "lists are not part of the body" \
  "${F40}a='It has not moved anything';assert a in s;s=s.replace(a,'- It has not moved anything',1);${W}" \
  guards "" 166

run_case "raw HTML in the body" \
  "raw HTML is refused" \
  "${F40}a='It has not moved anything';assert a in s;s=s.replace(a,'It has not <b>moved</b> anything',1);${W}" \
  guards "" 166

run_case "the weekly fixture stops reading a parked title" \
  "no longer reads a parked title out of the app" \
  "${F40}a='catalogue: knightfall-part-2-knightquest-2026';assert a in s;s=s.replace(a,'catalogue: none',1);${W}" \
  guards "" 166

run_case "the renderer skips the lead story's box" \
  "On-the-map boxes for 4 stories" \
  "${N}a='if(!founding) out += mapBox(st, cat);';assert a in s;s=s.replace(a,'if(!founding && i) out += mapBox(st, cat);',1);${W}" \
  guards "" 166

run_case "the renderer boxes the founding issue" \
  "the founding fixture renders an On-the-map box" \
  "${N}a='if(!founding) out += mapBox(st, cat);';assert a in s;s=s.replace(a,'out += mapBox(st, cat);',1);${W}" \
  guards "" 166

echo "--- 167: the sitemap and the feed list exactly the issues"

run_case "the sitemap loses its Nocturne markers" \
  "block's two markers exactly once" \
  "${SM}a='<!-- nocturne:begin';assert a in s;s=s.replace(a,'<!-- nocturne:gone',1);${W}" \
  guards "" 167

run_case "the Nocturne block moves ahead of the site's URLs" \
  "does not sit after the site's own two URLs" \
  "${SM}import re;m=re.search(r'  <!-- nocturne:begin.*?nocturne:end -->\n',s,re.S);assert m;blk=m.group(0);s=s.replace(blk,'',1);a='  <url>\n    <loc>https://nightwatcher.life/</loc>';assert a in s;s=s.replace(a,blk+a,1);${W}" \
  guards "" 167

run_case "the feed drops the newest issue" \
  "the feed does not list exactly the issues" \
  "${N}a='list.slice(0, LIMITS.feed)';assert a in s;s=s.replace(a,'list.slice(1, LIMITS.feed)',1);${W}" \
  guards "" 167

run_case "the sitemap block drops the archive" \
  "does not list the archive and exactly the issues" \
  "${N}a='return BEGIN + \"\\\\n\" + rows.join(\"\\\\n\")';assert a in s;s=s.replace(a,'return BEGIN + \"\\\\n\" + rows.slice(1).join(\"\\\\n\")',1);${W}" \
  guards "" 167

run_case "the holding page promises a date" \
  "the holding page carries a date" \
  "${N}a='The first Night Final is being set.';assert a in s;s=s.replace(a,'The first Night Final is being set for 27 September.',1);${W}" \
  guards "" 167

run_case "the holding page loses its noindex" \
  "is not the holding page" \
  "${N}a='extra: \\'<meta name=\"robots\" content=\"noindex\">\\\\n\\'';assert a in s,a;s=s.replace(a,'extra: \\'\\'',1);${W}" \
  guards "" 167

run_case "the feed stays closed until the first issue" \
  "the feed is missing or not empty" \
  "${N}a='    files[\"feed.xml\"]   = Buffer.from(renderFeed([]), \"utf8\");\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 167

run_case "the archive keeps the holding page's noindex" \
  "the archive carries noindex" \
  "${N}a='url: url, ogType: \"website\", img: SHARE});';assert s.count(a)==1;s=s.replace(a,'url: url, ogType: \"website\", img: SHARE, extra: \\'<meta name=\"robots\" content=\"noindex\">\\\\n\\'});',1);${W}" \
  guards "" 167

run_case "the feed stops linking its stylesheet" \
  "does not link feed.css on its second line" \
  "${N}a=\"'<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>\\\\n' + FEED_PI + '\\\\n' +\";assert a in s,a;s=s.replace(a,\"'<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>\\\\n' +\",1);${W}" \
  guards "" 167

run_case "the build stops writing feed.css" \
  "writes no feed.css" \
  "${N}a=', \"feed.css\": Buffer.from(FEED_CSS, \"utf8\")';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 167

run_case "the paper is screen news again" \
  "still calls the paper \"screen news\"" \
  "${N}a='Back issues</h1>\\\\n<p class=\"sub\">The week\\\\u2019s Batman news';assert a in s,a;s=s.replace(a,'Back issues</h1>\\\\n<p class=\"sub\">The week\\\\u2019s Batman screen news',1);${W}" \
  guards "" 167

run_case "the feed's stylesheet loads a font from another origin" \
  "feed.css reaches outside the origin" \
  "${N}a='src:url(\\\\\"/fonts/limelight';assert s.count(a)==2,a;k=s.rindex(a);s=s[:k]+'src:url(\\\\\"https://fonts.example.com/limelight'+s[k+len(a):];${W}" \
  guards "" 164

echo "--- 168: the paper's weight"

run_case "a page limit raised in the module" \
  "weight limits moved" \
  "${N}a='page: 40 * 1024';assert a in s;s=s.replace(a,'page: 80 * 1024',1);${W}" \
  guards "" 168

run_case "a page over its weight slips past the build" \
  "a page is at most 40960" \
  "${N}a='files[is.id + \"/index.html\"] = Buffer.from(renderIssue(is, cat), \"utf8\");';assert a in s;s=s.replace(a,'files[is.id + \"/index.html\"] = Buffer.from(renderIssue(is, cat) + \" \".repeat(42000), \"utf8\");',1);b='if(/\\\\.html\$/.test(f) && files[f].length > LIMITS.page)';assert b in s;s=s.replace(b,'if(false)',1);${W}" \
  guards "" 168

run_case "the feed's stylesheet outgrows its budget" \
  "the feed's stylesheet is at most 4 KB" \
  "${N}a='\"rss{display:block;';assert a in s,a;s=s.replace(a,'\"/*'+'x'*5000+'*/\",'+a,1);${W}" \
  guards "" 168

run_case "the stylesheet outgrows its budget" \
  "the paper's stylesheet is at most 12 KB" \
  "${N}a='\"*{box-sizing:border-box;}\",';assert a in s;s=s.replace(a,a+'\"/*'+'x'*13000+'*/\",',1);${W}" \
  guards "" 168

finish "negtest750"
