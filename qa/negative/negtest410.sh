#!/bin/bash
# negtest410 — 3.9.2. Two new sections, five widened ones, and the start of the
# catch-up the README's old "every guard has been negative-tested" claim was
# writing cheques for.
#
# The release's own additions are the easy half: guard 135 (the auth.md H1
# carries its own name), guard 136 (one origin, one binding, pinned in the
# file), guard 137 (the four storage and header seams the 14 August review
# found), plus the widened vendor sweep, the extended third-party sweep, the
# tightened CSP map, the trimmed comment allowlist, the guarded qa.yml split and
# the HEAD branch on the api-catalog.
#
# The catch-up half matters more. A full mapping of fixtures to sections showed
# 32 sections with no negative coverage at all — including 132, the sw.js
# execution guard, which is the largest section in the file and shipped in 3.7.2
# alongside a negtest suite for its OTHER change. The four picked up here are
# the four whose failure would be worst and quietest: 132 (the offline promise),
# 27 (persist must not assign a path nobody chose), 21 (a blocked store has to
# say so) and 7 (the backup code round-trip). Guard 138 pins what is left.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

# --- guard 135: the auth.md H1 carries its own name ---

run_case "stripping the token from the auth.md H1 is caught" \
  "no longer contains the token" \
"
import io
p='docs/auth.md'
s=io.open(p,encoding='utf-8').read()
assert s.startswith('# Night Watcher')
io.open(p,'w',encoding='utf-8').write(s.replace(s.split('\n')[0],'# Authentication',1))
"

run_case "deleting auth.md is caught" \
  "docs/auth.md is gone" \
"
import os
os.remove('docs/auth.md')
"

# --- guard 136: one hostname is one binding, and the file says so ---

run_case "workers.dev back on is caught" \
  "no longer sets workers_dev:false" \
"
import io
p='wrangler.jsonc'
s=io.open(p,encoding='utf-8').read()
assert '\"workers_dev\": false,' in s
io.open(p,'w',encoding='utf-8').write(s.replace('\"workers_dev\": false,','\"workers_dev\": true,'))
"

run_case "a second apex binding is caught" \
  "ONE HOSTNAME IS ONE BINDING" \
"
import io
p='wrangler.jsonc'
s=io.open(p,encoding='utf-8').read()
old='{ \"pattern\": \"nightwatcher.life\", \"custom_domain\": true }'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old, old + ',\n    { \"pattern\": \"nightwatcher.life/*\" }'))
"

run_case "the apex demoted from custom domain is caught" \
  "not bound as a custom domain" \
"
import io
p='wrangler.jsonc'
s=io.open(p,encoding='utf-8').read()
assert '\"custom_domain\": true' in s
io.open(p,'w',encoding='utf-8').write(s.replace('\"custom_domain\": true','\"custom_domain\": false'))
"

# --- guard 10, widened: bless must not launder foreign code ---

run_case "a bundler banner comment in the file is caught" \
  "vendored third-party code is back" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
anchor='function flagSave(){'
assert anchor in s
io.open(p,'w',encoding='utf-8').write(s.replace(anchor,'/*! nwlib v1.0.0 */\n'+anchor,1))
"

run_case "a sourceMappingURL in the file is caught" \
  "the app ships one inline script that is ours" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
anchor='function flagSave(){'
assert anchor in s
io.open(p,'w',encoding='utf-8').write(s.replace(anchor,'//# sourceMappingURL=app.js.map\n'+anchor,1))
"

# The mutation lands inside the one inline script, so the CSP hash moves with
# it and every run is red for that reason alone. NEG_ARGS runs this one under
# --bless, which re-hashes and leaves the vendor sweep as the only thing that
# could still fire. It is set and cleared on their own lines so the
# column-anchored fixture counter still sees the case.
NEG_ARGS="--bless"
green_case "a three-argument callback does not read as minified" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
assert 'function(a, b)' in s
io.open(p,'w',encoding='utf-8').write(s.replace('function(a, b)','function(a, b, c)',1))
"

NEG_ARGS=""

# --- guard 42, extended to the files written for agents ---

run_case "a foreign origin in llms.txt is caught" \
  "reaches out to evil.example" \
"
import io
p='docs/llms.txt'
s=io.open(p,encoding='utf-8').read()
io.open(p,'w',encoding='utf-8').write(s + '\nSee also https://evil.example/tracker\n')
"

run_case "a foreign origin in orders.txt is caught" \
  "reaches out to evil.example" \
"
import io
p='docs/orders.txt'
s=io.open(p,encoding='utf-8').read()
io.open(p,'w',encoding='utf-8').write(s + '\nhttps://evil.example/list\n')
"

# --- guard 43: the CSP map follows the meta tag ---

run_case "img-src data: creeping back is caught" \
  "img-src" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
assert \"img-src 'self';\" in s
io.open(p,'w',encoding='utf-8').write(s.replace(\"img-src 'self';\",\"img-src 'self' data:;\",1))
"

# --- guard 65: the comment allowlist and the qa.yml split ---

run_case "a comment smuggled behind a dead beacon marker is caught" \
  "an explanatory HTML comment is back in index.html" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
anchor='</head>'
assert anchor in s
io.open(p,'w',encoding='utf-8').write(s.replace(anchor,'<!-- Cloudflare Web Analytics : smuggled prose -->\n'+anchor,1))
"

run_case "the qa.yml guards-fixture count drifting is caught" \
  "run guards.js" \
"
import io,re
p='.github/workflows/qa.yml'
s=io.open(p,encoding='utf-8').read()
m=re.search(r'(\d+) run guards\.js',s)
assert m
io.open(p,'w',encoding='utf-8').write(s[:m.start(1)]+'600'+s[m.end(1):])
"

run_case "the qa.yml smoke-fixture count drifting is caught" \
  "run smoke.js" \
"
import io,re
p='.github/workflows/qa.yml'
s=io.open(p,encoding='utf-8').read()
m=re.search(r'(\d+) run smoke\.js',s)
assert m
io.open(p,'w',encoding='utf-8').write(s[:m.start(1)]+'11'+s[m.end(1):])
"

# --- guard 133: HEAD answers the well-known URI too ---

run_case "HEAD on the api-catalog falling through is caught" \
  "fell through to the assets plane" \
"
import io
p='worker.js'
s=io.open(p,encoding='utf-8').read()
old='(request.method === \"GET\" || request.method === \"HEAD\")'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'request.method === \"GET\"'))
"

# --- guard 137: the four seams stay closed ---

run_case "flagSave forgetting to clear --hdrh is caught" \
  "no longer clears the --hdrh override" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
old='\n  else document.documentElement.style.removeProperty(\"--hdrh\");'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,''))
"

run_case "the import ignoring a mark's value is caught" \
  "no longer consults the VALUE of a stored mark" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
old='for(src in (wBox || {})) if(wBox[src]) res.watched[src] = 1;'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'for(src in (wBox || {})) res.watched[src] = 1;'))
"

run_case "dedupeLog pushing entries unboxed is caught" \
  "no longer re-boxes its entries" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
old='var box = {id:String(e.id), ts:Number(e.ts)};\n    seen[e.id] = box; out.push(box);'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'seen[e.id] = e; out.push(e);'))
"

run_case "IOSDEVICE sliding back below restore() is caught" \
  "assigned after the restore() call again" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
start=s.index('var IOSDEVICE')
end=s.index('return window.navigator.standalone === true;\n}\n',start)+len('return window.navigator.standalone === true;\n}\n')
blk=s[start:end]
s=s[:start]+s[end:]
anchor='window.addEventListener(\"beforeinstallprompt\"'
assert anchor in s
io.open(p,'w',encoding='utf-8').write(s.replace(anchor,blk+anchor,1))
"

# --- catch-up, section 132: the offline promise ---

run_case "the runtime cache write losing waitUntil is caught" \
  "does not ride event.waitUntil" \
"
import io
p='docs/sw.js'
s=io.open(p,encoding='utf-8').read()
old='e.waitUntil(\n          caches.open(CACHE)'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'void(\n          caches.open(CACHE)'))
"

run_case "an error response written to the cache is caught" \
  "WRITTEN TO THE CACHE" \
"
import io
p='docs/sw.js'
s=io.open(p,encoding='utf-8').read()
old='if(res && res.ok){'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'if(res){'))
"

run_case "the fetch handler answering cross-origin is caught" \
  "answered for a cross-origin request" \
"
import io
p='docs/sw.js'
s=io.open(p,encoding='utf-8').read()
old='if(url.origin !== location.origin) return;'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,''))
"

# --- catch-up, section 30: the documented spoiler order, now the right way round ---

run_case "Beyond sliding back behind JLU is caught" \
  "watch order spoils itself" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
lines=s.split('\n')
rot=[i for i,l in enumerate(lines) if 'batman-beyond-return-of-the-joker-2000' in l and l.strip().startswith('{i:')]
jlu=[i for i,l in enumerate(lines) if 'justice-league-unlimited-season-3-2006' in l and l.strip().startswith('{i:')]
assert len(rot)==1 and len(jlu)==1 and rot[0] < jlu[0]
row=lines.pop(rot[0])
lines.insert(jlu[0], row)
io.open(p,'w',encoding='utf-8').write('\n'.join(lines))
"

# --- catch-up, section 27: the path is chosen, never assigned ---

run_case "persist() falling back to S.mode is caught" \
  "falls back to S.mode when no path is chosen" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
assert 'mode:S.path,' in s
io.open(p,'w',encoding='utf-8').write(s.replace('mode:S.path,','mode:S.path || S.mode,',1))
"

# --- catch-up, section 21: a blocked store has to say so ---

run_case "deleting the storage-blocked warning is caught" \
  "storage-blocked warning (#nosave) is gone" \
"
import io,re
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
s2=re.sub(r'id=\"nosave\"','id=\"nosaveX\"',s,count=1)
assert s2 != s
io.open(p,'w',encoding='utf-8').write(s2)
"

# --- catch-up, section 7: the backup code round-trip ---

run_case "a backup code that drops the skipped segment is caught" \
  "backup round-trip lost" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
old='if(S.skipped[f.id]){ k.push(idHash(f.id)); inK[f.id] = 1; }'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'if(S.skipped[f.id]){ inK[f.id] = 1; }'))
"

# --- guard 138: the coverage map itself ---
#
# The map is built from the expect strings in this directory, so the honest way
# to break it is to take one away. Blanking guard 135's expect (rather than
# deleting the fixture) leaves the fixture COUNT untouched, so what goes red is
# the coverage claim and nothing else.

run_case "a section losing its last fixture is caught" \
  "has no negative fixture and is not on the list" \
"
import io
p='qa/negative/negtest410.sh'
s=io.open(p,encoding='utf-8').read()
# Section 135 is reached by two fixtures, so both expects have to go blind or
# the section stays covered by the survivor.
a='no longer contains the token'
b='docs/auth.md is gone'
assert a in s and b in s
s=s.replace(a,'nothing will ever print this').replace(b,'nor will this ever print')
io.open(p,'w',encoding='utf-8').write(s)
"

rm -rf "$NEG"
finish "negtest410"
