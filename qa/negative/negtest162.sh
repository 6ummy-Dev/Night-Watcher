#!/bin/bash
# Negative-test every guard added or changed in 1.6.2.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

G="$(pro qa/guards.js)"
M="import io;p='docs/sitemap.xml';s=io.open(p,encoding='utf-8').read();"

echo "--- 67: the page's date (was an unnumbered pair of checks until 1.6.6)"
run_case "the sitemap date drifts from the structured data" \
  "both are hand-written and one of them is wrong" \
  "${M}import re;s=re.sub(r'<lastmod>[^<]*</lastmod>','<lastmod>2026-07-31</lastmod>',s);${W}"

run_case "the sitemap loses its lastmod" \
  "it tells a crawler nothing about freshness" \
  "${M}import re;s=re.sub(r'<lastmod>[^<]*</lastmod>','',s);${W}"

echo "--- 61: an inherited fade is measured too"
run_case "the Activity block is faded instead of stepped (the idea this release rejected)" \
  "fades everything inside it to opacity 0.7" \
  "${P}a='.activity{margin-top:26px;border';assert a in s;s=s.replace(a,'.activity{opacity:.7;margin-top:26px;border');${W}"

run_case "a named ink is faded under the floor" \
  "under the 4.5:1 AA floor" \
  "${P}a='.bd.u{color:var(--steel);border:1px solid currentColor;}';assert a in s;s=s.replace(a,'.bd.u{color:var(--steel);border:1px solid currentColor;opacity:.6;}');${W}"

echo "--- 62: nothing focusable is small enough to zoom"
run_case "the search field goes back under 16px" \
  "iOS zooms the page on any focused input under 16px" \
  "${P}a='font-family:var(--body);font-size:var(--t-body);margin-bottom:12px';assert a in s;s=s.replace(a,'font-family:var(--body);font-size:15px;margin-bottom:12px');${W}"

run_case "the backup paste field goes back under 16px" \
  ".bkin is 11px" \
  "${P}a='font-family:var(--mono);font-size:var(--t-body);padding:11px;margin:0 0 9px';assert a in s;s=s.replace(a,'font-family:var(--mono);font-size:11px;padding:11px;margin:0 0 9px');${W}"

run_case "a field loses its font-size entirely" \
  "has no font-size of its own to measure" \
  "${P}a='font-family:var(--mono);font-size:var(--t-body);line-height:1.5;padding:11px;margin:12px 0 10px;';assert a in s;s=s.replace(a,'font-family:var(--mono);line-height:1.5;padding:11px;margin:12px 0 10px;');${W}"

echo "--- 63: the grid columns have a floor"
run_case "the columns go back to a bare 1fr" \
  "that is minmax(auto,1fr)" \
  "${P}a='grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}';assert a in s;s=s.replace(a,'grid-template-columns:1fr 1fr;gap:10px;}');${W}"

run_case "the floor is raised off zero" \
  "columns have no zero floor" \
  "${P}a='repeat(2,minmax(0,1fr))';assert a in s;s=s.replace(a,'repeat(2,minmax(120px,1fr))');${W}"

run_case "the card can no longer break a word" \
  "cannot break a long word" \
  "${P}a='min-height:98px;overflow-wrap:anywhere;}';assert a in s;s=s.replace(a,'min-height:98px;}');${W}"

# The two guard-66 fixtures this suite carried (renumber a section; drop an
# INDEX row) were copies of negtest.sh's, three suites over; struck in 4.9.0.

rm -rf "$NEG"
finish "1.6.2 negative tests"
