#!/bin/bash
# Negative-test every guard added or changed in 2.1.0 — the locked buckle,
# the staged close, the freshness date, the FAQ held in step between seed
# and schema, llms.txt, and the 404.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 96: the locked buckle and the staged close"
run_case "the paths lose the locked split" \
  "not the locked 26%" \
  "${P}a='.pathseg button{flex:0 0 26%';assert a in s
s=s.replace(a,'.pathseg button{flex:1',1);${W}"

run_case "the buckle flattens to one style" \
  "lost its two-line hierarchy" \
  "${P}a='<span class=\"bs2\">';assert a in s
s=s.replace(a,'<span class=\"bst\">',1);${W}"

run_case "the chevron leaves its corner" \
  "chevron left its corner" \
  "${P}a='.pathseg .buckle .caret{position:absolute;';assert a in s
s=s.replace(a,'.pathseg .buckle .caret{',1);${W}"

run_case "the exit animation is deleted" \
  "the pouches have no exit" \
  "${P}a='@keyframes pouchout{';assert a in s
s=s.replace(a,'@keyframes pouchgone{',1);${W}"

run_case "the close goes back to vanishing" \
  "does not stage the close" \
  "${P}a='setTimeout(function(){ S.beltOpen = false; render(); }, 240);';assert a in s
s=s.replace(a,'S.beltOpen = false; render();',1);${W}"

run_case "the close stops asking about reduced motion" \
  "close ignores prefers-reduced-motion" \
  "${P}a='window.matchMedia && window.matchMedia(\"(prefers-reduced-motion: reduce)\").matches;';assert a in s
s=s.replace(a,'false;',1);${W}"

run_case "the reduced-motion block forgets the exit" \
  "does not cut .includes.closing .scope" \
  "${P}a='.includes.opening .scope,.includes.closing .scope,.includes.closing{animation:none;}';assert a in s
s=s.replace(a,'.includes.opening .scope,.includes.closing{animation:none;}',1);${W}"

echo "--- 67: the freshness date tells the truth"
run_case "the updated date drifts from the changelog" \
  "but the newest CHANGELOG" \
  "${P}a='var BUILT = \"2026-08-04\";';assert a in s
s=s.replace(a,'var BUILT = \"2026-08-01\";',1);${W}"

run_case "the updated line is dropped from Progress" \
  "no longer rendered beside the Build line" \
  "${P}a=\"updated '+BUILT+'\";assert a in s
s=s.replace(a,'',1);${W}"

echo "--- 100: seed and schema answer identically"
run_case "the FAQPage vanishes" \
  "the JSON-LD has no FAQPage" \
  "import io,json,re;p='docs/index.html';s=io.open(p,encoding='utf-8').read()
m=re.search(r'<script type=\"application/ld\+json\">(.*?)</script>',s,re.S)
o=json.loads(m.group(1))
o['@graph']=[n for n in o['@graph'] if n.get('@type')!='FAQPage']
s=s.replace(m.group(1),json.dumps(o));${W}"

run_case "a schema answer is reworded on its own" \
  "no longer matches the seed's straight answers" \
  "import io,json,re;p='docs/index.html';s=io.open(p,encoding='utf-8').read()
m=re.search(r'<script type=\"application/ld\+json\">(.*?)</script>',s,re.S)
o=json.loads(m.group(1))
fq=[n for n in o['@graph'] if n.get('@type')=='FAQPage'][0]
fq['mainEntity'][0]['acceptedAnswer']['text']='Watch them in any order you like.'
s=s.replace(m.group(1),json.dumps(o));${W}"

run_case "a seed answer is reworded on its own" \
  "no longer matches the data" \
  "${P}a='<h2>Straight answers</h2>';assert a in s
s=s.replace(a,'<h2>Frequently asked questions</h2>',1);${W}"

echo "--- 101: the site answers off the app too"
run_case "llms.txt is deleted" \
  "docs/llms.txt is missing" \
  "import os;os.remove('docs/llms.txt')"

run_case "an llms.txt count drifts" \
  "llms.txt says 134 films" \
  "import io;p='docs/llms.txt';s=io.open(p,encoding='utf-8').read()
a='133 films';assert a in s
s=s.replace(a,'134 films',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "llms.txt is smuggled into the shell" \
  "llms.txt is in the offline shell" \
  "import io;p='docs/sw.js';s=io.open(p,encoding='utf-8').read()
a='\"./robots.txt\"' if '\"./robots.txt\"' in s else '\"./icon.png\",'
b='\"./icon.png\",';assert b in s
s=s.replace(b,'\"./icon.png\", \"./llms.txt\",',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the 404 is deleted" \
  "docs/404.html is missing" \
  "import os;os.remove('docs/404.html')"

run_case "the 404 reaches off the page" \
  "reaches off the page" \
  "import io;p='docs/404.html';s=io.open(p,encoding='utf-8').read()
a='</main>';assert a in s
s=s.replace(a,'<img src=\"https://example.com/x.png\"></main>',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the 404 asks to be indexed after all" \
  "does not ask to stay out of the index" \
  "import io;p='docs/404.html';s=io.open(p,encoding='utf-8').read()
a='content=\"noindex\"';assert a in s
s=s.replace(a,'content=\"index\"',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "wrangler goes back to the default shrug" \
  "the 404 exists to be served" \
  "import io;p='wrangler.jsonc';s=io.open(p,encoding='utf-8').read()
a='\"not_found_handling\": \"404-page\"';assert a in s
s=s.replace(a,'\"not_found_handling\": \"none\"',1)
io.open(p,'w',encoding='utf-8').write(s)"

finish "negtest210"
