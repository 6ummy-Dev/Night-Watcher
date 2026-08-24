#!/bin/bash
# negtest580 — 4.5.3, the seal's last cut. One claim: a subset face is a
# Modified Version and may not carry a Reserved Font Name, in its name table
# or in the @font-face the page declares for it (OFL 1.1 §3; the OFL FAQ 2.6
# and 5.3). Section 106 reads the reserved names out of docs/fonts/OFL.txt
# and reads each subset woff2's name table itself, so the fixtures are: the
# CSS half (a Plex family string back on a subset face), the name-table half
# (Limelight — whose table says Limelight — marked subset in the manifest),
# the parse (a reserved name added to OFL.txt that the shipped names carry),
# and the floor (an OFL.txt that reserves nothing, which cannot be right for
# a file that names Limelight and Plex).
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
O="import io;p='docs/fonts/OFL.txt';s=io.open(p,encoding='utf-8').read();"
OW="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 106: no subset face carries a Reserved Font Name"

run_case "a subset face's @font-face goes back to the reserved family" \
  "the CSS family string is the name the document presents" \
  "${P}a='font-family:\"NW Sans\";src:url(\"fonts/ibm-plex-sans-latin-400-normal.woff2\")';assert a in s
s=s.replace(a,'font-family:\"IBM Plex Sans\";src:url(\"fonts/ibm-plex-sans-latin-400-normal.woff2\")',1);${W}" \
  guards "" 106

run_case "a face whose name table carries a reserved name is marked subset" \
  "its name table still says" \
  "import json;p='qa/font-subset.json';d=json.load(open(p))
d['files']['limelight-latin-400-normal.woff2']['subset']=True
json.dump(d,open(p,'w'),indent=2,sort_keys=True)" \
  guards "" 106

run_case "OFL.txt reserves a name the shipped subsets carry" \
  "OFL.txt reserves \"NW Sans\"" \
  "${O}a='with Reserved Font Name \"Plex\"';assert a in s
s=s.replace(a,'with Reserved Font Name \"Plex\" and Reserved Font Name \"NW Sans\"',1);${OW}" \
  guards "" 106

run_case "OFL.txt reserves nothing at all" \
  "names no Reserved Font Name" \
  "${O}import re;n=len(re.findall('Reserved Font Name (\"?)[A-Z]',s));assert n>=2
s=re.sub(r'with Reserved Font Name \"?[A-Za-z]+\"?','',s);${OW}" \
  guards "" 106

rm -rf "$NEG"
finish "negtest580"
