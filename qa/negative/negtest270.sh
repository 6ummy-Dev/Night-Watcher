#!/bin/bash
# Negative-test 2.7.0 — the fonts, the favicon, the identity, the census, and
# the two things that stopped the page jumping.
#
# Most of this release is invisible when it works, which is the argument for
# testing it hard. A subset font renders every character it was given and says
# nothing about the one it was not. A data: URI favicon looks right in every
# browser and cannot be crawled. A forced reflow is 216ms nobody sees. jsdom has
# no layout and no font rasteriser, so the harness could never have caught any
# of them by running the app — only by refusing the shapes that cause them.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 106: the fonts carry every letter the catalogue uses"

run_case "a title arrives with a character the subset does not have" \
  "fall outside the font subset" \
  "${P}s=s.replace('Pennyworth','Pennywörth中',1);${W}"

run_case "the export gains a character the subset does not have" \
  "fall outside the font subset" \
  "import io;p='docs/orders.txt';s=io.open(p,encoding='utf-8').read();s=s.replace('Pennyworth','Pęnnyworth',1);io.open(p,'w',encoding='utf-8').write(s)"

run_case "the blessed range is narrowed under the catalogue" \
  "fall outside the font subset" \
  "import io,json;p='qa/font-subset.json';d=json.load(io.open(p,encoding='utf-8'));d['ranges']=['U+0041-005A'];io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=2,sort_keys=True))"

run_case "a font is swapped for a different one of the same size" \
  "does not match its blessed hash" \
  "import io,os
p='docs/fonts/anton-latin-400-normal.woff2';b=bytearray(open(p,'rb').read());b[-1]^=0xFF;open(p,'wb').write(bytes(b))"

run_case "a font is replaced by the full unsubset face" \
  "the font moved and the record of what it contains did not" \
  "import io
p='docs/fonts/anton-latin-400-normal.woff2';b=open(p,'rb').read();open(p,'wb').write(b+b'\x00'*64)"

run_case "the manifest of what the fonts contain is deleted" \
  "qa/font-subset.json is missing" \
  "import os;os.remove('qa/font-subset.json')"

run_case "a face ships that nothing blessed" \
  "a face nobody blessed is a face nobody checked" \
  "import shutil;shutil.copy('docs/fonts/anton-latin-400-normal.woff2','docs/fonts/extra-latin-400-normal.woff2')"

echo "--- 106: the favicon stays crawlable"

run_case "the favicon goes back to a data: URI" \
  "ships as a data: URI" \
  "${P}s=s.replace('<link rel=\"icon\" type=\"image/svg+xml\" href=\"icon.svg\">','<link rel=\"icon\" type=\"image/svg+xml\" href=\"data:image/svg+xml,%3Csvg%3E%3C/svg%3E\">',1);${W}"

run_case "the icon file is dropped but the head still points at it" \
  "docs/icon.svg is missing" \
  "import os;os.remove('docs/icon.svg')"

echo "--- 83: the identity does not drift back"

run_case "the id is reverted to the old project-page path" \
  "it is an identity key, not a path" \
  "import io,json;p='docs/manifest.json';d=json.load(io.open(p,encoding='utf-8'))
d['id']='/Night-Watcher/';io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=2))"

echo "--- 96: the belt collapses its own box, and reduced motion still cuts it"

run_case "the box collapse is removed and only the pouches animate" \
  "no longer collapses its own box" \
  "${P}s=s.replace('.includes.closing{overflow:hidden;max-height:180px;animation:beltclose .24s ease-in forwards;}','',1);${W}"

run_case "the collapse keyframes are emptied" \
  "no longer collapses its own box" \
  "${P}s=s.replace('@keyframes beltclose{to{max-height:0;','@keyframes beltclose{to{opacity:0;',1);${W}"

run_case "reduced motion stops cutting the box collapse" \
  "does not cut .includes.closing" \
  "${P}s=s.replace('.includes.closing .scope,.includes.closing{animation:none;}','.includes.closing .scope{animation:none;}',1);${W}"

echo "--- the forced reflow does not come back"

run_case "render clamps the scroll against scrollHeight again" \
  "reading layout straight after" \
  "${P}s=s.replace('if(keep) window.scrollTo(0, keep);','if(keep){var m=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);window.scrollTo(0,Math.min(keep,m));}',1);${W}"

echo "--- 107: every section can fail, and every section runs"

run_case "a section loses its last assertion" \
  "contains no fail()" \
  "import io,re;p='qa/guards.js';s=io.open(p,encoding='utf-8').read()
i=s.index('/* ---------- 44.');j=s.index('/* ---------- ',i+20)
io.open(p,'w',encoding='utf-8').write(s[:i]+'/* ---------- 44. placeholder ---- */\nvar _x44 = 1;\n\n'+s[j:])"

run_case "a second section is quietly nested inside another" \
  "is not at file scope" \
  "import io;p='qa/guards.js';s=io.open(p,encoding='utf-8').read()
i=s.index('/* ---------- 44.')
io.open(p,'w',encoding='utf-8').write(s[:i]+'  '+s[i:])"

run_case "the recorded exception outlives the nesting it excused" \
  "the exception outlived the thing it excused" \
  "import io;p='qa/guards.js';s=io.open(p,encoding='utf-8').read()
s=s.replace('  /* ---------- 24. one string per ordering','/* ---------- 24. one string per ordering',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the marker format changes and the census silently measures nothing" \
  "the marker format changed and this guard is now measuring nothing" \
  "import io,re;p='qa/guards.js';s=io.open(p,encoding='utf-8').read()
s=re.sub(r'/\* -{3,} (\d+)\.', r'/* === \1.', s)
io.open(p,'w',encoding='utf-8').write(s)"

rm -rf "$NEG"
finish "2.7.0 negative tests"
