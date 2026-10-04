#!/bin/bash
# negtest400 — 3.8.0's two load-bearing additions: the markdown negotiation
# (guard 133) and the per-mark tombstones (guard 134 + the smoke block that
# drives the real listener).
#
# The worker fixtures attack the property that matters most: that a browser's
# request falls through to the assets plane UNTOUCHED. Guard 133's passthrough
# checks are identity checks, so any mutation that makes the Worker answer
# where it should not — a widened Accept rule, a lost pathname gate — must
# turn the tree red. The tombstone fixtures re-introduce the exact resurrection
# defect the durability review reproduced, one leg at a time, and require the
# smoke checks that were written against the real listener to catch each one.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

# --- guard 133: the negotiation exists and is wired ---

run_case "deleting worker.js is caught" \
  "worker.js is gone" \
"
import os
os.remove('worker.js')
" guards "" 133

run_case "wrangler losing main is caught" \
  "no main pointing at worker.js" \
"
import io
p='wrangler.jsonc'
s=io.open(p,encoding='utf-8').read()
assert '\"main\": \"worker.js\",' in s
io.open(p,'w',encoding='utf-8').write(s.replace('\"main\": \"worker.js\",',''))
" guards "" 133

run_case "a widened run_worker_first is caught" \
  "run_worker_first is not exactly" \
"
import io
p='wrangler.jsonc'
s=io.open(p,encoding='utf-8').read()
assert '\"run_worker_first\": [\"/\", \"/.well-known/api-catalog\", \"/nocturne/\", \"/nocturne/*/\"],' in s
io.open(p,'w',encoding='utf-8').write(s.replace('\"run_worker_first\": [\"/\", \"/.well-known/api-catalog\", \"/nocturne/\", \"/nocturne/*/\"],','\"run_worker_first\": true,'))
" guards "" 133

run_case "a served copy of worker.js is caught" \
  "a worker.js is inside docs/" \
"
import shutil
shutil.copy('worker.js','docs/worker.js')
" guards "" 133

run_case "an Accept tie handed to markdown is caught by identity" \
  "did not get the assets plane's response by identity" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
assert 'return md > 0 && md > html;' in s
io.open(p,'w',encoding='utf-8').write(s.replace('return md > 0 && md > html;','return md > 0 && md >= html;'))
" guards "" 133

run_case "a lost pathname gate is caught" \
  "a non-root path negotiated markdown in the script" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='url.pathname === \"/\" &&'
assert s.count(needle) == 1
io.open(p,'w',encoding='utf-8').write(s.replace(needle,''))
" guards "" 133

run_case "a second copy of the markdown body is caught" \
  "did not answer with llms.txt's bytes" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='return new Response(md, {status: 200, headers: headers});'
assert needle in s
io.open(p,'w',encoding='utf-8').write(s.replace(needle,'return new Response(\"# a second copy of the catalogue prose\", {status: 200, headers: headers});'))
" guards "" 133

run_case "a dropped Vary header is caught" \
  "does not carry Vary: Accept" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='\"Vary\": \"Accept\",'
assert needle in s
io.open(p,'w',encoding='utf-8').write(s.replace(needle,'\"Vary\": \"Origin\",'))
" guards "" 133

# --- guard 133 (6.6.3): the paper negotiates its own markdown ---

run_case "the front is handed llms.txt" \
  "did not answer with the front's markdown" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='asset: \"/nocturne/index.md\"'
assert needle in s
io.open(p,'w',encoding='utf-8').write(s.replace(needle,'asset: \"/llms.txt\"',1))
" guards "" 133

run_case "a paper stylesheet negotiates" \
  "a paper asset negotiated markdown" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='if(!m) return null;'
assert needle in s
io.open(p,'w',encoding='utf-8').write(s.replace(needle,'if(!m) return {asset: \"/llms.txt\", canonical: \"https://nightwatcher.life/nocturne/\"};',1))
" guards "" 133

run_case "the paper's markdown grows an api-catalog relation" \
  "the paper's markdown advertises api-catalog" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='>; rel=\"canonical\", </llms.txt>; rel=\"describedby\"'
assert s.count(needle) == 1
io.open(p,'w',encoding='utf-8').write(s.replace(needle,'>; rel=\"canonical\", </llms.txt>; rel=\"describedby\", </.well-known/api-catalog>; rel=\"api-catalog\"',1))
" guards "" 133

run_case "the paper's HTML drops Vary: Accept" \
  "does not declare Vary: Accept" \
"
import io
p='docs/_headers'
s=io.open(p,encoding='utf-8').read()
a='  Link: <https://nightwatcher.life/nocturne/>; rel=\"canonical\"\\n  Link: </llms.txt>; rel=\"describedby\"\\n  Vary: Accept\\n'
assert s.count(a)==1
io.open(p,'w',encoding='utf-8').write(s.replace(a,a.replace('  Vary: Accept\\n',''),1))
" guards "" 133

run_case "an issue's negotiated markdown leaves its source" \
  "is not the issue's source" \
"
import io
p='docs/nocturne/2026-w39-nocturne-somebody-has-to-stay-up-with-batman/issue.md'
s=io.open(p,encoding='utf-8').read()
io.open(p,'w',encoding='utf-8').write(s+'\\nnot the source\\n')
" guards "" 133

run_case "the front's markdown file is deleted" \
  "docs/nocturne/index.md is missing" \
"
import os
os.remove('docs/nocturne/index.md')
" guards "" 133

# --- guard 133 (3.9.0): the api-catalog is empty and correctly typed ---

run_case "an api-catalog with entries is caught" \
  "did not answer an empty linkset" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='\"linkset\":[]'
assert needle in s
io.open(p,'w',encoding='utf-8').write(s.replace(needle,'\"linkset\":[{\"anchor\":\"/\"}]'))
" guards "" 133

run_case "a mislabeled api-catalog is caught" \
  "not application/linkset+json" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='application/linkset+json'
assert needle in s
io.open(p,'w',encoding='utf-8').write(s.replace(needle,'application/json'))
" guards "" 133

# --- guard 134: the tombstone shape holds ---

run_case "a payload without clocks is caught" \
  "persistNow() no longer writes the per-mark clocks" \
"$P
needle='  {k:\"clk\",          read:clocksOf},\n'
assert needle in s
s=s.replace(needle,'')
$W
" guards "" 134

run_case "a removal site that stops stamping is caught" \
  "rate() does not stamp its clock" \
"$P
needle='stampMark(\"r\", id);'
assert needle in s
s=s.replace(needle,'')
$W
"

# --- the smoke block drives the real listener: each leg of the merge ---

run_case "an additive-only listener resurrects and smoke sees it" \
  "a cross-tab unmark with a newer clock unmarks here too" \
"$P
needle='var inc = clocksOf(o.clk);'
assert needle in s
s=s.replace(needle,'var inc = clocksOf(null);')
$W
" smoke main

run_case "a legacy branch without its clock guard resurrects and smoke sees it" \
  "a clockless payload cannot resurrect a deliberate removal" \
"$P
needle='    if(kind === \"w\") return inc.w[id] || S.clk.w[id];'
assert needle in s
s=s.replace(needle,'    if(kind === \"w\") return false;')
$W
" smoke main

run_case "a rating merge that ignores clocks is caught behaviorally" \
  "an older rating loses to the newer one" \
"$P
needle='    if(!newer(\"r\", k)) continue;'
assert needle in s
s=s.replace(needle,'')
$W
" smoke main

rm -rf "$NEG"
finish "negtest400"
