#!/bin/bash
# Negative-test 1.9.0 — the share card, promised and shipped as one thing.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 91: the card file itself"
run_case "the card is deleted out from under its metas" \
  "docs/share.png is missing" \
  "import os;os.remove('docs/share.png')"

run_case "the card is replaced by something the wrong size" \
  "the card is 1200×630" \
  "import shutil;shutil.copy('docs/icon.png','docs/share.png')"

echo "--- 91: the promises in the page"
run_case "the card type quietly reverts to a thumbnail" \
  "without summary_large_image" \
  "${P}a='<meta name=\"twitter:card\" content=\"summary_large_image\">';assert a in s
s=s.replace(a,'<meta name=\"twitter:card\" content=\"summary\">',1);${W}"

run_case "one reference drifts back to the icon" \
  "must all agree" \
  "${P}a='<meta property=\"og:image\" content=\"https://nightwatcher.life/share.png\">';assert a in s
s=s.replace(a,'<meta property=\"og:image\" content=\"https://nightwatcher.life/icon.png\">',1);${W}"

echo "--- 91: the offline shell stays app-only"
run_case "the card is smuggled into the service-worker precache" \
  "is in sw.js's SHELL precache" \
  "import io;p='docs/sw.js';s=io.open(p,encoding='utf-8').read()
a='\"./icon.png\",';assert a in s
s=s.replace(a,'\"./icon.png\", \"./share.png\",',1)
io.open(p,'w',encoding='utf-8').write(s)"

finish "  negtest190"
