#!/bin/bash
# negtest440 — 3.9.5. The disclosure channel: security.txt, its clock, and the
# two other files that have to agree with it.
#
# Section 140 asserts a file that almost nothing else in this tree resembles: it
# is correct on the day it ships and becomes incorrect on a date written inside
# itself. Most guards here fail because someone edited something. This one is
# built to fail because nobody did — the Expires clause goes red thirty days out
# with the tree untouched.
#
# That makes the clock fixtures the point of the suite. They compute a date
# relative to the run rather than hardcoding one, because a fixture that pins
# 2026 would start passing for the wrong reason in 2027 — asserting the guard
# fires on an expired file when what it was written to prove is that the guard
# fires EARLY, while there is still time to renew.
#
# The rest of the suite is the ordinary shape: one mutation, one section, one
# reason. Three of them break a file other than security.txt, because a
# disclosure pointer that disagrees with SECURITY.md or loses its cache policy
# is broken in the way that matters even though the pointer itself still reads.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

S="import io;p='docs/.well-known/security.txt';s=io.open(p,encoding='utf-8').read();"
SW="io.open(p,'w',encoding='utf-8').write(s)"

run_case "140: the file is gone" \
  "as a file in this tree" \
  "import os;os.remove('docs/.well-known/security.txt')"

run_case "140: no Contact field" \
  "declares no Contact" \
  "${S}old='\nContact: https';assert old in s;s=s.replace(old,'\n#Contact: https',1);${SW}"

run_case "140: the Contact points somewhere other than private reporting" \
  "vulnerability reporting, which is the channel" \
  "${S}old='/security/advisories/new';assert old in s;s=s.replace(old,'/issues/new',1);${SW}"

run_case "140: a mailto address is published alongside the URL" \
  "publishes a mailto: address" \
  "${S}s=s+'Contact: mailto:reports@example.invalid\n';${SW}"

run_case "140: no Expires field" \
  "declares no Expires" \
  "${S}old='\nExpires:';assert old in s;s=s.replace(old,'\n#Expires:',1);${SW}"

run_case "140: an Expires no parser can read" \
"is not a date this build can read" \
"
import io,re
p='docs/.well-known/security.txt'
s=io.open(p,encoding='utf-8').read()
s2=re.sub(r'(?m)^Expires:.*$','Expires: next August or thereabouts',s)
assert s2!=s
io.open(p,'w',encoding='utf-8').write(s2)
"

run_case "140: the clock runs out inside the warning window" \
"renew the Expires field and ship it" \
"
import io,re,datetime
p='docs/.well-known/security.txt'
s=io.open(p,encoding='utf-8').read()
d=(datetime.datetime.utcnow()+datetime.timedelta(days=10)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
s2=re.sub(r'(?m)^Expires:.*$','Expires: '+d,s)
assert s2!=s
io.open(p,'w',encoding='utf-8').write(s2)
"

run_case "140: an Expires already in the past" \
"renew the Expires field and ship it" \
"
import io,re,datetime
p='docs/.well-known/security.txt'
s=io.open(p,encoding='utf-8').read()
d=(datetime.datetime.utcnow()-datetime.timedelta(days=3)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
s2=re.sub(r'(?m)^Expires:.*$','Expires: '+d,s)
assert s2!=s
io.open(p,'w',encoding='utf-8').write(s2)
"

run_case "140: an Expires far enough out to outlive the project" \
"asks for less than a year" \
"
import io,re,datetime
p='docs/.well-known/security.txt'
s=io.open(p,encoding='utf-8').read()
d=(datetime.datetime.utcnow()+datetime.timedelta(days=900)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
s2=re.sub(r'(?m)^Expires:.*$','Expires: '+d,s)
assert s2!=s
io.open(p,'w',encoding='utf-8').write(s2)
"

run_case "140: the Canonical names a second origin" \
  "is not the apex URL it is served from" \
  "${S}old='Canonical: https://nightwatcher.life/';assert old in s;s=s.replace(old,'Canonical: https://zonaescon.workers.dev/',1);${SW}"

run_case "140: the Policy stops pointing at SECURITY.md" \
  "no longer points at SECURITY.md" \
  "${S}old='/blob/main/SECURITY.md';assert old in s;s=s.replace(old,'/blob/main/README.md',1);${SW}"

run_case "140: SECURITY.md drifts off the channel security.txt advertises" \
"stopped naming GitHub private" \
"
import io
p='SECURITY.md'
s=io.open(p,encoding='utf-8').read()
old='private vulnerability reporting'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'the public issue tracker'))
"

run_case "140: _headers has no block for the file" \
"no block for /.well-known/security.txt" \
"
import io
p='docs/_headers'
s=io.open(p,encoding='utf-8').read()
old='/.well-known/security.txt\n  Cache-Control: no-cache\n'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'',1))
"

run_case "140: the block loses its no-cache" \
"once by a scanner that writes down the answer" \
"
import io
p='docs/_headers'
s=io.open(p,encoding='utf-8').read()
old='/.well-known/security.txt\n  Cache-Control: no-cache'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'/.well-known/security.txt\n  X-Robots-Tag: noindex',1))
"

rm -rf "$NEG"
finish "negtest440"
