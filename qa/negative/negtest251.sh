#!/bin/bash
# Negative-test 2.5.1 — docs/_headers, the security headers a Cloudflare
# Response Header Transform Rule cannot set because every route is served by a
# Worker. Guard 104 is the only thing standing between this file and a silent
# regression to no headers at all, so every branch of it is made to fail here.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

H="import io;p='docs/_headers';s=io.open(p,encoding='utf-8').read();"
HW="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 104: the file itself"
run_case "_headers is deleted" \
  "docs/_headers is missing" \
  "import os;os.remove('docs/_headers')
import io;p='README.md';s=io.open(p,encoding='utf-8').read()
a='| \`docs/_headers\` |';i=s.index(a);j=s.index('\n',i);s=s[:i]+s[j+1:]
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the /* rule is narrowed to one path" \
  "has no /* rule" \
  "${H}a='/*';assert a in s;s=s.replace(a,'/index.html',1);${HW}"

echo "--- 104: each header, one at a time"
run_case "COOP is dropped" \
  "no longer sets Cross-Origin-Opener-Policy" \
  "${H}import re;s=re.sub(r'^\s+Cross-Origin-Opener-Policy:.*$','',s,flags=re.M);${HW}"

run_case "COOP is weakened to unsafe-none" \
  "no longer sets Cross-Origin-Opener-Policy" \
  "${H}s=s.replace('Cross-Origin-Opener-Policy: same-origin','Cross-Origin-Opener-Policy: unsafe-none',1);${HW}"

run_case "Referrer-Policy is dropped" \
  "no longer sets Referrer-Policy" \
  "${H}import re;s=re.sub(r'^\\s+Referrer-Policy:.*\$','',s,flags=re.M);${HW}"

run_case "Referrer-Policy is weakened to unsafe-url" \
  "no longer sets Referrer-Policy" \
  "${H}s=s.replace('strict-origin-when-cross-origin','unsafe-url',1);${HW}"

run_case "X-Frame-Options is dropped" \
  "no longer sets X-Frame-Options" \
  "${H}import re;s=re.sub(r'^\\s+X-Frame-Options:.*\$','',s,flags=re.M);${HW}"

run_case "X-Frame-Options is loosened to ALLOWALL" \
  "no longer sets X-Frame-Options" \
  "${H}s=s.replace('X-Frame-Options: DENY','X-Frame-Options: ALLOWALL',1);${HW}"

run_case "Permissions-Policy is dropped" \
  "no longer sets Permissions-Policy" \
  "${H}import re;s=re.sub(r'^\\s+Permissions-Policy:.*\$','',s,flags=re.M);${HW}"

run_case "Permissions-Policy stops denying geolocation" \
  "no longer sets Permissions-Policy" \
  "${H}s=s.replace('geolocation=(), ','',1);${HW}"

echo "--- 104: one header, one place"
run_case "HSTS is duplicated into the file" \
  "which the edge already sets" \
  "${H}s=s.rstrip()+'\n  Strict-Transport-Security: max-age=2592000\n';${HW}"

run_case "nosniff is duplicated into the file" \
  "which the edge already sets" \
  "${H}s=s.rstrip()+'\n  X-Content-Type-Options: nosniff\n';${HW}"

run_case "a second CSP is introduced as a header" \
  "the CSP lives in the <meta> tag" \
  "${H}s=s.rstrip()+\"\n  Content-Security-Policy: default-src 'self'\n\";${HW}"

echo "--- the file is a served file like any other"
run_case "_headers is smuggled into the service worker shell" \
  "_headers" \
  "import io;p='docs/sw.js';s=io.open(p,encoding='utf-8').read()
a='\"./index.html\"';assert a in s;s=s.replace(a,'\"./index.html\", \"./_headers\"',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "_headers is left out of the README file table" \
  "README's file table does not list: docs/_headers" \
  "import io;p='README.md';s=io.open(p,encoding='utf-8').read()
a='| \`docs/_headers\` |';i=s.index(a);j=s.index('\n',i);s=s[:i]+s[j+1:]
io.open(p,'w',encoding='utf-8').write(s)"

echo "--- the retired origin phase does not come back by name"
run_case "SMOKE_ONLY is asked for the phase that was removed" \
  "unknown SMOKE_ONLY phase" \
  "import io;p='qa/smoke.js';s=io.open(p,encoding='utf-8').read()
a='var ONLY = process.env.SMOKE_ONLY || \"\";'
assert a in s;s=s.replace(a,'var ONLY = \"origin\";',1)
io.open(p,'w',encoding='utf-8').write(s)" \
  "smoke"

rm -rf "$NEG"
finish "2.5.1 negative tests"
