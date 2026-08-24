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
"

run_case "wrangler losing main is caught" \
  "no main pointing at worker.js" \
"
import io
p='wrangler.jsonc'
s=io.open(p,encoding='utf-8').read()
assert '\"main\": \"worker.js\",' in s
io.open(p,'w',encoding='utf-8').write(s.replace('\"main\": \"worker.js\",',''))
"

run_case "a widened run_worker_first is caught" \
  "run_worker_first is not exactly" \
"
import io
p='wrangler.jsonc'
s=io.open(p,encoding='utf-8').read()
assert '\"run_worker_first\": [\"/\", \"/.well-known/api-catalog\"],' in s
io.open(p,'w',encoding='utf-8').write(s.replace('\"run_worker_first\": [\"/\", \"/.well-known/api-catalog\"],','\"run_worker_first\": true,'))
"

run_case "a served copy of worker.js is caught" \
  "a worker.js is inside docs/" \
"
import shutil
shutil.copy('worker.js','docs/worker.js')
"

run_case "an Accept tie handed to markdown is caught by identity" \
  "did not get the assets plane's response by identity" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
assert 'return md > 0 && md > html;' in s
io.open(p,'w',encoding='utf-8').write(s.replace('return md > 0 && md > html;','return md > 0 && md >= html;'))
"

run_case "a lost pathname gate is caught" \
  "a non-root path negotiated markdown in the script" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='url.pathname === \"/\" &&'
assert s.count(needle) == 1
io.open(p,'w',encoding='utf-8').write(s.replace(needle,''))
"

run_case "a second copy of the markdown body is caught" \
  "did not answer with llms.txt's bytes" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='return new Response(head ? null : md, {'
assert needle in s
io.open(p,'w',encoding='utf-8').write(s.replace(needle,'return new Response(\"# a second copy of the catalogue prose\", {'))
"

run_case "a dropped Vary header is caught" \
  "does not carry Vary: Accept" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='\"Vary\": \"Accept\",'
assert needle in s
io.open(p,'w',encoding='utf-8').write(s.replace(needle,'\"Vary\": \"Origin\",'))
"

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
"

run_case "a mislabeled api-catalog is caught" \
  "not application/linkset+json" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
needle='application/linkset+json'
assert needle in s
io.open(p,'w',encoding='utf-8').write(s.replace(needle,'application/json'))
"

# --- guard 134: the tombstone shape holds ---

run_case "a payload without clocks is caught" \
  "persistNow() no longer writes the per-mark clocks" \
"$P
needle='clk:S.clk,'
assert needle in s
s=s.replace(needle,'')
$W
"

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
needle='if(!(inc.r[k] > (S.clk.r[k] || 0))) continue;'
assert needle in s
s=s.replace(needle,'')
$W
" smoke main

rm -rf "$NEG"
finish "negtest400"
