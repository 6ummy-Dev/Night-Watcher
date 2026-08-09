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
  "${P}a='    setTimeout(function(){ if(!S.beltOpen) render(); }, 240);\n  } else { render(); }'
assert a in s;s=s.replace(a,'    render();\n  } else { render(); }',1);${W}"

run_case "the close stops asking about reduced motion" \
  "close ignores prefers-reduced-motion" \
  "${P}a='window.matchMedia && window.matchMedia(\"(prefers-reduced-motion: reduce)\").matches;';assert a in s
s=s.replace(a,'false;',1);${W}"

run_case "the reduced-motion block forgets the exit" \
  "does not cut .includes.closing .scope" \
  "${P}a='.includes.opening .scope,.includes.closing .scope,.includes.closing,.pathseg[data-toast]{animation:none;}';assert a in s
s=s.replace(a,'.includes.opening .scope,.includes.closing,.pathseg[data-toast]{animation:none;}',1);${W}"

echo "--- 67: the freshness date tells the truth"
run_case "the updated date drifts from the changelog" \
  "but the newest CHANGELOG" \
  "${P}a='var BUILT = \"';i=s.index(a)+len(a);j=s.index('\"',i)
assert s[i:j] != '2020-01-01';s=s[:i]+'2020-01-01'+s[j:];${W}"

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

run_case "the canonical line is deleted from llms.txt" \
  "llms.txt has no \"Canonical URL:\" line" \
  "import io;p='docs/llms.txt';s=io.open(p,encoding='utf-8').read()
a='Canonical URL: [nightwatcher.life](https://nightwatcher.life/)\n';assert a in s
s=s.replace(a,'',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the canonical drifts from index.html's" \
  "two copies of one address" \
  "import io;p='docs/llms.txt';s=io.open(p,encoding='utf-8').read()
a='(https://nightwatcher.life/)';assert a in s
s=s.replace(a,'(https://nightwatcher.life/index.html)',1)
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

run_case "llms.txt drops a claim the README makes" \
  "llms.txt's summary drops the both-media claim" \
  "import io;p='docs/llms.txt';s=io.open(p,encoding='utf-8').read()
a='animated and live action';assert a in s
s=s.replace(a,'live action',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the README loses the sentence llms.txt is checked against" \
  "the README's canonical sentence no longer makes the both-media claim" \
  "import io;p='README.md';s=io.open(p,encoding='utf-8').read()
a='animated and live action';assert a in s
s=s.replace(a,'live action',1)
io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 3.1.0: the 404's bat"
# The first two came back GREEN against the three-copy version of section 115 —
# a fourth copy added, one path edited alone, all 117 sections passing; then the
# bat deleted outright, all 117 passing again. That is the provenance.
run_case "the 404's bat is deleted" \
  "the 404's bat is gone" \
  "import io,re;p='docs/404.html';s=io.open(p,encoding='utf-8').read()
a=re.search(r'<svg class=\"bat\"[\s\S]*?</svg>\n',s).group(0)
s=s.replace(a,'',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "one of the 404's bat paths is edited alone" \
  "the 404's bat and BATP have drifted apart" \
  "import io;p='docs/404.html';s=io.open(p,encoding='utf-8').read()
a='M42 32 L38 17 L49 29 Z';assert a in s
s=s.replace(a,'M42 32 L38 18 L49 29 Z',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the svg namespace comes back" \
  "404.html carries an xmlns attribute" \
  "import io;p='docs/404.html';s=io.open(p,encoding='utf-8').read()
a='<svg class=\"bat\"';assert a in s
s=s.replace(a,'<svg class=\"bat\" xmlns=\"http://www.w3.org/2000/svg\"',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the bat is loaded with url() instead of inlined" \
  "404.html fetches something with url()" \
  "import io;p='docs/404.html';s=io.open(p,encoding='utf-8').read()
a='opacity:.09;';assert a in s
s=s.replace(a,'opacity:.09;background:url(icon.svg);',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the bat is turned up past the contrast floor" \
  "under the 4.5:1 AA floor" \
  "import io;p='docs/404.html';s=io.open(p,encoding='utf-8').read()
a='opacity:.09;';assert a in s
s=s.replace(a,'opacity:.3;',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the 404 clips its own body" \
  "404.html clips its own body" \
  "import io;p='docs/404.html';s=io.open(p,encoding='utf-8').read()
a='text-align:center;padding:24px;}';assert a in s
s=s.replace(a,'text-align:center;padding:24px;overflow:hidden;}',1)
io.open(p,'w',encoding='utf-8').write(s)"

finish "negtest210"
