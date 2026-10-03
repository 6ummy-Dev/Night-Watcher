#!/bin/bash
# negtest620 — 4.9.1, the delta report's fixes.
#
# Section 133: the If-None-Match comparison is weak and honours "*" (the
# 4.9.0 304 path was strict, and behind an edge that weakens ETags on
# compression it never fired). Section 65: the History pointers in the
# served and config files are read on every run — an old-address pointer
# and a rotted heading each fail (two shipped in 4.9.0 itself). Section
# 153: the head census reads every tag — a planted <base>, a second plain
# script, a third <style> and a duplicated required tag all fail. Section
# 132: the runtime cache write deletes-then-puts under ignoreVary. Section
# 75: an undeclared control height is a failure now, not a warning.
# Section 113: the shard packing's balance is measured.
# 6.5.5: a navigation is cached under its path and an asset under its full
# URL (132, QA L1); a q-value is held to 0..1 (133, QA I4).
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

K="$(pro worker.js)"
KW="io.open(p,'w',encoding='utf-8').write(s)"
V="$(pro docs/sw.js)"
VW="io.open(p,'w',encoding='utf-8').write(s)"
S2="$(pro docs/sw.js)"

echo "--- 133: the 304 path fires behind an edge that weakens ETags"

run_case "the ETag comparison goes strict again" \
  "the comparison is strict" \
  "${K}a='var bare = function(t){ return t.trim().replace(/^W\\//, \"\"); };';assert a in s;s=s.replace(a,'var bare = function(t){ return t.trim(); };',1);${KW}" \
  guards "" 133

run_case "If-None-Match: * stops matching" \
  "did not answer 304 — RFC 9110" \
  "${K}a='inm.trim() === \"*\" ||';assert a in s;s=s.replace(a,'inm.trim() === \"**\" ||',1);${KW}" \
  guards "" 133

echo "--- 65: the history pointers point somewhere"

run_case "a served file points its history at the old address" \
  "points its history at NOTES.md" \
  "${V}a='History: NOTES-history.md (\"Where the served';assert a in s;s=s.replace(a,'History: NOTES.md (\"Where the served',1);${VW}" \
  guards "" 65

run_case "a quoted heading rots out from under its pointer" \
  "and that file has no such heading" \
  "${K}a='(\"Where the served and config files\\' histories went\")';assert a in s;s=s.replace(a,'(\"Where the config files went\")',1);${KW}" \
  guards "" 65

echo "--- 153: the census reads every tag in the head"

run_case "a base tag is planted in the head" \
  "not an element the head's set allows" \
  "${P}a='<meta name=\"referrer\"';assert a in s;s=s.replace(a,'<base href=\"https://example.com/\">\n<meta name=\"referrer\"',1);${W}" \
  guards "" 153

run_case "a second plain script is planted in the head" \
  "not the JSON-LD block" \
  "${P}a='<meta name=\"referrer\"';assert a in s;s=s.replace(a,'<script src=\"a.js\"></script>\n<meta name=\"referrer\"',1);${W}" \
  guards "" 153

run_case "a third style block is planted in the head" \
  "tag(s), not 2" \
  "${P}a='<meta name=\"referrer\"';assert a in s;s=s.replace(a,'<style>.x{}</style>\n<meta name=\"referrer\"',1);${W}" \
  guards "" 153

run_case "a required tag is duplicated" \
  "more than once" \
  "${P}a='<meta property=\"og:locale\" content=\"en_US\">';assert a in s;s=s.replace(a,a+'\n'+a,1);${W}" \
  guards "" 153

echo "--- 132: one representation per path, enforced"

run_case "the runtime put stops deleting first" \
  "does not delete-then-put" \
  "${S2}a='return c.delete(key, ANY).then(function(){ return c.put(key, copy); });';assert a in s;s=s.replace(a,'return c.put(key, copy);',1);${VW}" \
  guards "" 132

# 6.5.5 (QA L1): a navigation is cached under its path; an asset keeps its
# full URL.
run_case "navigations are cached under their full URL again" \
  "navigations with a query are cached under their full URL" \
  "${S2}a='var key = req.mode === \"navigate\" ? url.origin + url.pathname : req;';assert s.count(a)==1;s=s.replace(a,'var key = req;',1);${VW}" \
  guards "" 132

run_case "every request is cached under its path, assets too" \
  "an asset request lost its query in the cache key" \
  "${S2}a='var key = req.mode === \"navigate\" ? url.origin + url.pathname : req;';assert s.count(a)==1;s=s.replace(a,'var key = url.origin + url.pathname;',1);${VW}" \
  guards "" 132

echo "--- 133: a q-value is 0..1 (6.5.5, QA I4)"

run_case "a q above 1 is taken at its word" \
  "a q above 1 on markdown" \
  "${K}a='Math.min(1, Math.max(0, q))';assert s.count(a)==1;s=s.replace(a,'q',1);${KW}" \
  guards "" 133

run_case "a malformed q counts as 1 again" \
  "a malformed q on markdown" \
  "${K}a='Math.min(1, Math.max(0, q)) : 0;';assert s.count(a)==1;s=s.replace(a,'Math.min(1, Math.max(0, q)) : 1;',1);${KW}" \
  guards "" 133

run_case "a q inside 0..1 is ignored" \
  "markdown alone at q=0.5 fell through to HTML" \
  "${K}a='Math.min(1, Math.max(0, q)) : 0;';assert s.count(a)==1;s=s.replace(a,'0 : 0;',1);${KW}" \
  guards "" 133

echo "--- 75: an unmeasurable control is a failure, not a warning"

run_case "a control loses its declared height" \
  "no declared height for the control(s)" \
  "${P}import re;m=re.search(r'\\.chip\\{[^}]*\\}',s);assert m and 'min-height:' in m.group(0)
s=s.replace(m.group(0),m.group(0).replace('min-height:','min-block-size:',1),1);${W}" \
  guards "" 75

echo "--- 113: the shard packing stays level"

run_case "a heavy suite is stacked onto an already-full shard" \
  "shard packing is unlevel" \
  "import io,re;p='.github/workflows/qa.yml';s=io.open(p,encoding='utf-8').read()
picks=re.findall(r\"pick: '(.*)'\",s)
src=[x for x in picks if re.search(r'[(|]300[|)]',x)];assert src
src=src[0];dst=[x for x in picks if x != src][0]
ns=src.replace('300|','',1) if '300|' in src else src.replace('|300','',1)
nd=dst.replace('negtest(','negtest(300|',1)
s=s.replace(src,ns,1);s=s.replace(dst,nd,1)
io.open(p,'w',encoding='utf-8').write(s)" \
  guards "" 113

rm -rf "$NEG"
finish "negtest620 (4.9.1)"
