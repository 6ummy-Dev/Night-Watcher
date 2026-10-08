#!/bin/bash
# negtest880 — 6.8.2. The privacy page, the licence notice, five in the
# morgue (184), and the paper ring as :focus-visible (183).
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

V="$(pro docs/privacy/index.html)"
R="$(pro README.md)"
H="$(pro docs/index.html)"
S="$(pro docs/sitemap.xml)"
J="$(pro docs/sw.js)"
N="$(pro qa/nocturne.js)"

echo "--- 184: the privacy page, the licence notice, and five in the morgue"

run_case "a privacy claim leaves the page" \
  "the privacy page dropped a claim it makes" \
  "${V}a='The paper is not saved for offline.';assert s.count(a)==1;s=s.replace(a,'The paper stays on the device.',1);${W}" \
  guards "" 184

run_case "the licence notice leaves the page" \
  "the licence notice left the privacy page" \
  "${V}a='version 3 only. Copyright (C) 2026 6ummy (6ummy-Dev on GitHub).';assert s.count(a)==1;s=s.replace(a,'version 3 or later.',1);${W}" \
  guards "" 184

run_case "the licence notice leaves the README" \
  "the licence notice left the README" \
  "${R}a='version 3 only. Copyright (C) 2026 6ummy (6ummy-Dev on GitHub).';assert s.count(a)==1;s=s.replace(a,'version 3 or later.',1);${W}" \
  guards "" 184

run_case "Home no longer opens privacy" \
  "the home footer does not open the privacy page" \
  "${H}a='<a href=\"/privacy\">Privacy</a>';assert s.count(a)==1;s=s.replace(a,'Privacy',1);${W}" \
  guards "" 184

run_case "the sitemap lists the privacy page" \
  "the sitemap lists /privacy" \
  "${S}a='<loc>https://nightwatcher.life/llms.txt</loc>';assert s.count(a)==1;s=s.replace(a,a+'\\n    <loc>https://nightwatcher.life/privacy/</loc>',1);${W}" \
  guards "" 184

run_case "the worker answers /privacy" \
  "sw.js answers /privacy" \
  "${J}a='if(url.pathname === \"/privacy\") return;';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 184

run_case "See more shows before five back issues" \
  "See more is up before five back issues are filed" \
  "${N}a='var MORGUE_N = 5;';assert s.count(a)==1;s=s.replace(a,'var MORGUE_N = 1;',1);${W}" \
  guards "" 184

run_case "the morgue loses See more" \
  "the front's morgue lost its See more" \
  "${N}a='>See more<';assert s.count(a)==1;s=s.replace(a,'>Older<',1);${W}" \
  guards "" 184

echo "--- 183: the paper ring is :focus-visible"

run_case "the paper ring goes back to :focus" \
  "the paper ring is :focus, so a tap paints the page" \
  "${N}a='.paper:focus-visible{outline:2px solid var(--signal);outline-offset:-2px;}';assert s.count(a)==1;s=s.replace(a,'.paper:focus{outline:2px solid var(--signal);outline-offset:-2px;}',1);${W}" \
  guards "" 183

finish "184 privacy, licence, morgue; 183 paper ring"
