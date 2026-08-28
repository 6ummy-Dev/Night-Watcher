#!/bin/bash
# negtest610 — 4.9.0, the delete-and-assert-red sweep.
#
# The 4.8.0 report ran the complement of this whole corpus: not "does the
# guard fail on the mutation someone thought of" but "what can I delete and
# stay green". Thirteen <head> tags and six README rows went with a green
# npm test. This suite is that sweep made permanent: every <head> tag is
# deleted in turn and section 153 must name it; every row of the README's
# file table is deleted in turn and section 45 must name the file (section
# 45 reads the tracked set off .git/index, which _lib.sh now carries into
# the scratch tree for exactly this). One fixture per tag and per row, as
# literal lines, because the fixture census in guard 65 counts lines. When
# a tag or a row is added, add its fixture here in the same commit — the
# section-153 stray check and section 45 will say so if it is forgotten.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 153: every <head> tag is required by name"

run_case "the head loses <meta charset=\"utf-8\">" \
  "required tag(s): <meta charset>" \
  "${P}a='<meta charset=\"utf-8\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses viewport" \
  "required tag(s): the viewport meta" \
  "${P}a='<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses Content-Security-Policy" \
  "required tag(s): the Content-Security-Policy meta" \
  "${P}import re;a=re.search(r'<meta http-equiv=\"Content-Security-Policy\"[^>]*>',s).group(0);s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses apple-mobile-web-app-capable" \
  "required tag(s): apple-mobile-web-app-capable" \
  "${P}a='<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses mobile-web-app-capable" \
  "required tag(s): mobile-web-app-capable" \
  "${P}a='<meta name=\"mobile-web-app-capable\" content=\"yes\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses preload fonts/limelight-latin-400-normal.woff2" \
  "font preloads, not 6" \
  "${P}a='<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/limelight-latin-400-normal.woff2\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses preload fonts/big-shoulders-display-latin-700-normal.woff2" \
  "font preloads, not 6" \
  "${P}a='<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/big-shoulders-display-latin-700-normal.woff2\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses preload fonts/ibm-plex-sans-latin-400-normal.woff2" \
  "font preloads, not 6" \
  "${P}a='<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/ibm-plex-sans-latin-400-normal.woff2\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses preload fonts/ibm-plex-sans-latin-600-normal.woff2" \
  "font preloads, not 6" \
  "${P}a='<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/ibm-plex-sans-latin-600-normal.woff2\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses preload fonts/ibm-plex-mono-latin-400-normal.woff2" \
  "font preloads, not 6" \
  "${P}a='<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/ibm-plex-mono-latin-400-normal.woff2\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses preload fonts/ibm-plex-mono-latin-600-normal.woff2" \
  "font preloads, not 6" \
  "${P}a='<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/ibm-plex-mono-latin-600-normal.woff2\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses apple-mobile-web-app-status-bar-style" \
  "required tag(s): apple-mobile-web-app-status-bar-style" \
  "${P}a='<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses apple-mobile-web-app-title" \
  "required tag(s): apple-mobile-web-app-title" \
  "${P}a='<meta name=\"apple-mobile-web-app-title\" content=\"Night Watcher\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses manifest" \
  "required tag(s): the manifest link" \
  "${P}a='<link rel=\"manifest\" href=\"manifest.json\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses description" \
  "required tag(s): the description meta" \
  "${P}a='<meta name=\"description\" content=\"Every Batman story — 137 films and 68 seasons of TV across 44 continuities — in watch orders, no spoilers. By universe, by the arc of one life, or by release.\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses og:type" \
  "required tag(s): og:type" \
  "${P}a='<meta property=\"og:type\" content=\"website\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses og:title" \
  "required tag(s): og:title" \
  "${P}a='<meta property=\"og:title\" content=\"Night Watcher · One path through every Batman\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses og:description" \
  "required tag(s): og:description" \
  "${P}a='<meta property=\"og:description\" content=\"Every Batman story — 137 films and 68 seasons of TV across 44 continuities — in watch orders, no spoilers. Choose a path once and track what you have seen.\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses og:url" \
  "required tag(s): og:url" \
  "${P}a='<meta property=\"og:url\" content=\"https://nightwatcher.life/\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses og:site_name" \
  "required tag(s): og:site_name" \
  "${P}a='<meta property=\"og:site_name\" content=\"Night Watcher\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses canonical" \
  "required tag(s): the canonical link" \
  "${P}a='<link rel=\"canonical\" href=\"https://nightwatcher.life/\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses og:image" \
  "required tag(s): og:image" \
  "${P}a='<meta property=\"og:image\" content=\"https://nightwatcher.life/share.png\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses twitter:card" \
  "required tag(s): twitter:card" \
  "${P}a='<meta name=\"twitter:card\" content=\"summary_large_image\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses twitter:image" \
  "required tag(s): twitter:image" \
  "${P}a='<meta name=\"twitter:image\" content=\"https://nightwatcher.life/share.png\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses og:locale" \
  "required tag(s): og:locale" \
  "${P}a='<meta property=\"og:locale\" content=\"en_US\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses og:image:width" \
  "required tag(s): og:image:width" \
  "${P}a='<meta property=\"og:image:width\" content=\"1200\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses og:image:height" \
  "required tag(s): og:image:height" \
  "${P}a='<meta property=\"og:image:height\" content=\"630\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses og:image:alt" \
  "required tag(s): og:image:alt" \
  "${P}a='<meta property=\"og:image:alt\" content=\"Night Watcher — 137 films, 68 seasons, 44 continuities. Batman watch orders. No spoilers.\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses icon favicon.ico" \
  "required tag(s): the .ico favicon link" \
  "${P}a='<link rel=\"icon\" href=\"favicon.ico\" sizes=\"any\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses icon icon.svg" \
  "required tag(s): the SVG icon link" \
  "${P}a='<link rel=\"icon\" type=\"image/svg+xml\" href=\"icon.svg\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses alternate orders.txt" \
  "required tag(s): the orders.txt alternate link" \
  "${P}a='<link rel=\"alternate\" type=\"text/plain\" href=\"orders.txt\" title=\"The whole catalogue as plain text\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses icon 16x16" \
  "required tag(s): the 16px icon link" \
  "${P}a='<link rel=\"icon\" type=\"image/png\" sizes=\"16x16\" href=\"favicon-16x16.png\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses icon 32x32" \
  "required tag(s): the 32px icon link" \
  "${P}a='<link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"favicon-32x32.png\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses icon 48x48" \
  "required tag(s): the 48px icon link" \
  "${P}a='<link rel=\"icon\" type=\"image/png\" sizes=\"48x48\" href=\"favicon-48x48.png\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses icon 192x192" \
  "required tag(s): the 192px icon link" \
  "${P}a='<link rel=\"icon\" type=\"image/png\" sizes=\"192x192\" href=\"icon-192.png\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses icon 512x512" \
  "required tag(s): the 512px icon link" \
  "${P}a='<link rel=\"icon\" type=\"image/png\" sizes=\"512x512\" href=\"icon.png\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses apple-touch-icon" \
  "required tag(s): the apple-touch-icon link" \
  "${P}a='<link rel=\"apple-touch-icon\" href=\"apple-touch-icon.png\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses theme-color" \
  "required tag(s): theme-color" \
  "${P}a='<meta name=\"theme-color\" content=\"#0C111C\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses application-name" \
  "required tag(s): application-name" \
  "${P}a='<meta name=\"application-name\" content=\"Night Watcher\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses msapplication-TileColor" \
  "required tag(s): msapplication-TileColor" \
  "${P}a='<meta name=\"msapplication-TileColor\" content=\"#0C111C\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses msapplication-TileImage" \
  "required tag(s): msapplication-TileImage" \
  "${P}a='<meta name=\"msapplication-TileImage\" content=\"mstile-144x144.png\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses referrer" \
  "required tag(s): the referrer meta" \
  "${P}a='<meta name=\"referrer\" content=\"strict-origin-when-cross-origin\">';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses <title>" \
  "required tag(s): <title>" \
  "${P}import re;a=re.search(r'<title>[^<]*</title>\\n',s).group(0);s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses the JSON-LD block" \
  "required tag(s): the JSON-LD block" \
  "${P}import re;a=re.search(r'<script type=\"application/ld\\+json\">.*?</script>\\n',s,re.S).group(0);s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "the head loses the noscript splash undo" \
  "required tag(s): the <noscript> splash undo" \
  "${P}a='<noscript><style>#splash{display:none;}</style></noscript>\\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 153

run_case "a tag arrives in the head without joining the list" \
  "not on the required list" \
  "${P}a='<meta name=\"referrer\"';assert a in s;s=s.replace(a,'<meta name=\"generator\" content=\"hand\">\\n'+a,1);${W}" \
  guards "" 153

echo "--- 45: every row of the README's file table is load-bearing"

run_case "the README drops its row for docs/index.html" \
  "README's file table does not list: docs/index.html" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/index.html')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/sw.js" \
  "README's file table does not list: docs/sw.js" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/sw.js')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/manifest.json" \
  "README's file table does not list: docs/manifest.json" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/manifest.json')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/icon.png" \
  "README's file table does not list: docs/icon.png" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/icon.png')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/icon-192.png" \
  "README's file table does not list: docs/icon-192.png" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/icon-192.png')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/icon.svg" \
  "README's file table does not list: docs/icon.svg" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/icon.svg')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/favicon.ico" \
  "README's file table does not list: docs/favicon.ico" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/favicon.ico')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/favicon-16x16.png" \
  "README's file table does not list: docs/favicon-16x16.png" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/favicon-16x16.png')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/favicon-32x32.png" \
  "README's file table does not list: docs/favicon-32x32.png" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/favicon-32x32.png')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/favicon-48x48.png" \
  "README's file table does not list: docs/favicon-48x48.png" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/favicon-48x48.png')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/apple-touch-icon.png" \
  "README's file table does not list: docs/apple-touch-icon.png" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/apple-touch-icon.png')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/mstile-144x144.png" \
  "README's file table does not list: docs/mstile-144x144.png" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/mstile-144x144.png')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/3e6082eed9f040d5bc8ab07531bf58b9.txt" \
  "README's file table does not list: docs/3e6082eed9f040d5bc8ab07531bf58b9.txt" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/3e6082eed9f040d5bc8ab07531bf58b9.txt')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/icon-maskable-512.png" \
  "README's file table does not list: docs/icon-maskable-512.png" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/icon-maskable-512.png')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/robots.txt" \
  "README's file table does not list: docs/robots.txt" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/robots.txt')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/sitemap.xml" \
  "README's file table does not list: docs/sitemap.xml" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/sitemap.xml')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/share.png" \
  "README's file table does not list: docs/share.png" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/share.png')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/google38dc2f1303c788e7.html" \
  "README's file table does not list: docs/google38dc2f1303c788e7.html" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/google38dc2f1303c788e7.html')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/llms.txt" \
  "README's file table does not list: docs/llms.txt" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/llms.txt')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/orders.txt" \
  "README's file table does not list: docs/orders.txt" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/orders.txt')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/auth.md" \
  "README's file table does not list: docs/auth.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/auth.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/_headers" \
  "README's file table does not list: docs/_headers" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/_headers')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/404.html" \
  "README's file table does not list: docs/404.html" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/404.html')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/.well-known/security.txt" \
  "README's file table does not list: docs/.well-known/security.txt" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/.well-known/security.txt')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/.well-known/brave-rewards-verification.txt" \
  "README's file table does not list: docs/.well-known/brave-rewards-verification.txt" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/.well-known/brave-rewards-verification.txt')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/fonts/limelight-latin-400-normal.woff2" \
  "README's file table does not list: docs/fonts/limelight-latin-400-normal.woff2" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/fonts/limelight-latin-400-normal.woff2')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/fonts/big-shoulders-display-latin-700-normal.woff2" \
  "README's file table does not list: docs/fonts/big-shoulders-display-latin-700-normal.woff2" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/fonts/big-shoulders-display-latin-700-normal.woff2')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/fonts/ibm-plex-sans-latin-400-normal.woff2" \
  "README's file table does not list: docs/fonts/ibm-plex-sans-latin-400-normal.woff2" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/fonts/ibm-plex-sans-latin-400-normal.woff2')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/fonts/ibm-plex-sans-latin-600-normal.woff2" \
  "README's file table does not list: docs/fonts/ibm-plex-sans-latin-600-normal.woff2" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/fonts/ibm-plex-sans-latin-600-normal.woff2')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/fonts/ibm-plex-mono-latin-400-normal.woff2" \
  "README's file table does not list: docs/fonts/ibm-plex-mono-latin-400-normal.woff2" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/fonts/ibm-plex-mono-latin-400-normal.woff2')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/fonts/ibm-plex-mono-latin-600-normal.woff2" \
  "README's file table does not list: docs/fonts/ibm-plex-mono-latin-600-normal.woff2" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/fonts/ibm-plex-mono-latin-600-normal.woff2')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for docs/fonts/OFL.txt" \
  "README's file table does not list: docs/fonts/OFL.txt" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('docs/fonts/OFL.txt')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for worker.js" \
  "README's file table does not list: worker.js" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('worker.js')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for wrangler.jsonc" \
  "README's file table does not list: wrangler.jsonc" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('wrangler.jsonc')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for .gitignore" \
  "README's file table does not list: .gitignore" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('.gitignore')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for package.json" \
  "README's file table does not list: package.json" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('package.json')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for .github/workflows/qa.yml" \
  "README's file table does not list: .github/workflows/qa.yml" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('.github/workflows/qa.yml')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for NOTES.md" \
  "README's file table does not list: NOTES.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('NOTES.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/guards.js" \
  "README's file table does not list: qa/guards.js" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/guards.js')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/frozen-ids.json" \
  "README's file table does not list: qa/frozen-ids.json" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/frozen-ids.json')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/script-bytes.json" \
  "README's file table does not list: qa/script-bytes.json" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/script-bytes.json')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/make-favicon.py" \
  "README's file table does not list: qa/make-favicon.py" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/make-favicon.py')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/smoke.js" \
  "README's file table does not list: qa/smoke.js" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/smoke.js')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/negative/" \
  "README's file table does not list: qa/negative/" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/negative/')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/renamed-ids.json" \
  "README's file table does not list: qa/renamed-ids.json" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/renamed-ids.json')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/retired-ids.json" \
  "README's file table does not list: qa/retired-ids.json" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/retired-ids.json')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/font-subset.json" \
  "README's file table does not list: qa/font-subset.json" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/font-subset.json')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/subset-fonts.py" \
  "README's file table does not list: qa/subset-fonts.py" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/subset-fonts.py')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/make-share-card.mjs" \
  "README's file table does not list: qa/make-share-card.mjs" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/make-share-card.mjs')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/share-card.json" \
  "README's file table does not list: qa/share-card.json" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/share-card.json')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/requirements-tooling.txt" \
  "README's file table does not list: qa/requirements-tooling.txt" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/requirements-tooling.txt')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for .gitattributes" \
  "README's file table does not list: .gitattributes" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('.gitattributes')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for .npmrc" \
  "README's file table does not list: .npmrc" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('.npmrc')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/share-card.html" \
  "README's file table does not list: qa/share-card.html" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/share-card.html')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/browser-check.mjs" \
  "README's file table does not list: qa/browser-check.mjs" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/browser-check.mjs')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for CHANGELOG.md" \
  "README's file table does not list: CHANGELOG.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('CHANGELOG.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for LICENSE" \
  "README's file table does not list: LICENSE" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('LICENSE')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for SECURITY.md" \
  "README's file table does not list: SECURITY.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('SECURITY.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for package-lock.json" \
  "README's file table does not list: package-lock.json" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('package-lock.json')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for README.md" \
  "README's file table does not list: README.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('README.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for RELEASING.md" \
  "README's file table does not list: RELEASING.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('RELEASING.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45


run_case "the README drops its row for ARCHITECTURE.md" \
  "README's file table does not list: ARCHITECTURE.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('ARCHITECTURE.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for DATA-MODEL.md" \
  "README's file table does not list: DATA-MODEL.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('DATA-MODEL.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for CONTRIBUTING.md" \
  "README's file table does not list: CONTRIBUTING.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('CONTRIBUTING.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for NOTES-history.md" \
  "README's file table does not list: NOTES-history.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('NOTES-history.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for CHANGELOG-archive.md" \
  "README's file table does not list: CHANGELOG-archive.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('CHANGELOG-archive.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

run_case "the README drops its row for qa/contrast.md" \
  "README's file table does not list: qa/contrast.md" \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read();a=re.search(r'^\| \`'+re.escape('qa/contrast.md')+r'\` \|.*\n',s,re.M).group(0);s=s.replace(a,'',1);io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 45

# The sweep guards its own completeness (4.9.1): the head half is held whole
# by section 153's stray census, and this holds the README half the same way
# — a row added to the table without a fixture here fails the suite, which
# is exactly the drift the hand list section 45 replaced kept suffering.
ROWS=$(grep -cE '^\| `[^`]+` \|' "$SRC/README.md")
SWEPT=$(grep -cE '^run_case "the README drops its row for' "${BASH_SOURCE[0]}")
if [ "$ROWS" -eq "$SWEPT" ]; then
  echo "  PASS  the sweep covers every table row ($ROWS)"; PASS=$((PASS+1))
else
  echo "  FAIL  the README's table has $ROWS rows and this suite sweeps $SWEPT — add the missing fixture(s)"
  FAILED=$((FAILED+1))
fi

finish "negtest610 (4.9.0 — the delete-and-assert-red sweep)"
