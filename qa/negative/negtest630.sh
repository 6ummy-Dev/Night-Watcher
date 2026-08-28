#!/bin/bash
# negtest630 — 4.9.2, Early Hints and the attached numbers.
#
# Section 104: the six rel=preload font hints under / are a three-way set
# with the head's own preload tags and docs/fonts/ — a hint deleted, a hint
# for a file the head does not preload, and a hint smuggled under /* each
# fail. Section 133: the worker's built responses carry the three document
# relations only — a font hint on a markdown body fails. Section 20: the
# measured contrast table (qa/contrast.md) is a blessed artifact — stale
# or missing fails the run.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

H="$(pro docs/_headers)"
HW="io.open(p,'w',encoding='utf-8').write(s)"
K="$(pro worker.js)"
KW="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 104: the Early Hints font set moves as one"

run_case "a font hint is deleted from the / rule" \
  "Early Hints font set does not match" \
  "${H}a='  Link: </fonts/limelight-latin-400-normal.woff2>; rel=preload; as=font; crossorigin\n';assert a in s;s=s.replace(a,'',1);${HW}" \
  guards "" 104

run_case "a hint names a file the head does not preload" \
  "Early Hints font set does not match" \
  "${H}a='</fonts/limelight-latin-400-normal.woff2>; rel=preload';assert a in s;s=s.replace(a,'</fonts/limelight-latin-999-normal.woff2>; rel=preload',1);${HW}" \
  guards "" 104

run_case "a hint is smuggled under /*" \
  "hint is declared under /*" \
  "${H}a='  Cross-Origin-Resource-Policy: same-origin\n';assert a in s;s=s.replace(a,a+'  Link: </fonts/limelight-latin-400-normal.woff2>; rel=preload; as=font; crossorigin\n',1);${HW}" \
  guards "" 104

echo "--- 133: the markdown body gets no font hints"

run_case "a font hint leaks into the worker's Link set" \
  "carries a font preload hint" \
  "${K}a='\\x27</llms.txt>; rel=\"describedby\"\\x27;';assert a in s;s=s.replace(a,'\\x27</llms.txt>; rel=\"describedby\", </fonts/limelight-latin-400-normal.woff2>; rel=preload\\x27;',1);${KW}" \
  guards "" 133

echo "--- 20: the numbers are attached, and stay attached"

run_case "the contrast table goes stale" \
  "qa/contrast.md is stale" \
  "import io;p='qa/contrast.md';s=io.open(p,encoding='utf-8').read();io.open(p,'w',encoding='utf-8').write(s.replace('16.39','16.40',1))" \
  guards "" 20

run_case "the contrast table is deleted" \
  "qa/contrast.md is missing" \
  "import os;os.remove('qa/contrast.md')" \
  guards "" 20

rm -rf "$NEG"
finish "negtest630 (4.9.2 — Early Hints, and the numbers attached)"
