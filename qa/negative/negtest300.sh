#!/bin/bash
# Negative-test 3.0.0's Stage 1 — the watchers.
#
# This suite is the gate the release was written around. Every check below
# repairs an instrument that could not see, and the audit found each of them the
# same way: by breaking something on purpose and watching a green build come
# back. So a repair with no fixture under it is the same promise that had just
# failed, and every one of them has a line here.
#
# The list, in the order the plan runs them: section 29's external-script sweep,
# which had never matched the page it guards; section 43's CSP, which pinned
# four of eleven directives and could bless the hash of a decoy script; the
# service worker, which nothing had ever parsed; the viewport, whose deliberate
# absence of maximum-scale holds up the whole argument of section 62 and was
# unguarded; the share card's missing byte ceiling; section 108's unreachable
# fallbacks; and smoke's NW1 check, which asserted a thing that could not match.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

H2="import io;p='docs/_headers';s=io.open(p,encoding='utf-8').read();"
HW2="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 29: the external-script sweep matches the page it guards"

# The bug, exactly as it shipped: the old pattern required a double-quoted src,
# the page's only external script is single-quoted, and so a single-quoted
# script added today went out green. Section 42's origin sweep is an ALLOW list
# and already allows github.com for links, so nothing else caught it either.
run_case "a single-quoted external script is added" \
  "the app must run with no network" \
  "${P}a='</body>'
assert a in s;s=s.replace(a,\"<script src='https://github.com/evil.js'></script>\"+a,1);${W}"

run_case "a double-quoted external script is added" \
  "the app must run with no network" \
  "${P}a='</body>'
assert a in s;s=s.replace(a,'<script src=\"https://example.com/evil.js\"></script>'+a,1);${W}"

# 3.2.0 RETIRED THE EMPTY-SWEEP CHECK AND THIS FIXTURE INVERTS WITH IT. The
# old check failed when the sweep matched NOTHING, because the page carried one
# external script by decision, so an empty result meant the pattern had stopped
# matching -- which had really happened, for eleven releases, over a
# single-quoted src. With the beacon gone an empty sweep is the correct state,
# and there is no "found none" left to fail on.
#
# What that check really protected is the pattern's eyesight, and that is what
# this fixture protects now: the beacon's own shape -- single quotes AND
# type='module' -- was the exact blind spot, so it is the shape the sweep is
# made to catch. If the regex ever narrows again, this goes red.
run_case "a script in the beacon's own shape is added" \
  "the app must run with no network" \
  "${P}a='</body>'
assert a in s;s=s.replace(a,\"<script type='module' src='https://static.example.com/x.min.js'></script>\"+a,1);${W}"

echo "--- 43: every directive the policy declares is pinned"

# INVERTED IN 3.2.0, AND THE SAME STRING DOES BOTH JOBS. Until this release
# script-src was REQUIRED to carry the beacon origin, so that dropping it from
# the policy could not silently stop a thing the privacy copy and SECURITY.md
# both promised was running -- deleting it shipped green before 3.0.0. The
# beacon left all three in 3.2.0, so the origin that used to be mandatory is
# now refused, and the fixture that proved it was required proves it is banned.
run_case "the old beacon origin comes back to script-src" \
  "script-src carries https://static.cloudflareinsights.com" \
  "${P}s=s.replace(\"'; style-src\",\"' https://static.cloudflareinsights.com; style-src\",1);${W}"

run_case "an unchecked directive is rewritten to a wildcard" \
  "this build was reviewed with" \
  "${P}s=s.replace(\"img-src 'self' data:\",'img-src *',1);${W}"

run_case "a pinned directive is opened to anywhere" \
  "this build was reviewed with" \
  "${P}s=s.replace(\"font-src 'self'\",'font-src *',1);${W}"

# 3.3.1: connect-src was removed from the policy so it falls through to
# default-src 'none', which the edge has no directive to append 'self' to.
# Its absence is held by the unpinned-directive check, not by a pin.
run_case "connect-src comes back to the policy" \
  "which nothing here checks" \
  "${P}s=s.replace(\"default-src 'none'; \",\"default-src 'none'; connect-src 'none'; \",1);${W}"

run_case "a directive is dropped from the policy" \
  "CSP no longer sets worker-src" \
  "${P}s=s.replace(\"worker-src 'self'; \",'',1);${W}"

run_case "a directive arrives that nothing pins" \
  "an unpinned directive is an unreviewed one" \
  "${P}s=s.replace(\"; base-uri 'none'\",\"; frame-src *; base-uri 'none'\",1);${W}"

run_case "an origin is smuggled into script-src beside the hash" \
  "script-src carries https://cdn.example.com" \
  "${P}s=s.replace(\"'; style-src\",\"' https://cdn.example.com; style-src\",1);${W}"

# THE ONE THAT MATTERED MOST. This section hashed the FIRST plain <script> and
# section 46 parsed the LONGEST. With a small decoy above the application block
# the two describe different code, this section reports a stale hash, and
# `npm run bless` writes the hash of the decoy — both suites green over a page
# whose CSP blocks the entire app. jsdom does not enforce meta CSP, so smoke
# cannot see it either. The ambiguity is the bug, so the ambiguity is the fail.
run_case "a second plain script is added above the application block" \
  "plain <script> blocks" \
  "${P}a='<!-- No trademarked logos'
assert a in s;s=s.replace(a,'<script>var decoy=1;</script>'+a,1);${W}"

echo "--- 11: the service worker is parsed, not just grepped"

# Five sections grep sw.js as text and smoke never registers it, so a syntax
# error in the one file that tells a returning browser the app changed left
# both suites green and broke offline for every visitor.
run_case "a syntax error is appended to sw.js" \
  "docs/sw.js does not parse" \
  "import io;p='docs/sw.js';s=io.open(p,encoding='utf-8').read()
io.open(p,'w',encoding='utf-8').write(s+'\nfunction broken( {\n')"

run_case "a quote is dropped inside sw.js" \
  "docs/sw.js does not parse" \
  "import io;p='docs/sw.js';s=io.open(p,encoding='utf-8').read()
a='\"./index.html\"';assert a in s;s=s.replace(a,'\"./index.html',1)
io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 110: the page can still be pinch-zoomed"

# Section 62 accepts this page's smallest controls only because a reader can
# always zoom into them. That argument had nothing under it: both of these
# shipped green through guards and smoke.
run_case "the viewport caps zoom" \
  "Capping zoom is a WCAG 1.4.4 failure" \
  "${P}s=s.replace('initial-scale=1, viewport-fit=cover','initial-scale=1, maximum-scale=1, viewport-fit=cover',1);${W}"

run_case "the viewport refuses zoom outright" \
  "refuses to be pinch-zoomed at all" \
  "${P}s=s.replace('initial-scale=1, viewport-fit=cover','initial-scale=1, user-scalable=no, viewport-fit=cover',1);${W}"

run_case "the viewport stops sizing to the device" \
  "no longer sets width=device-width" \
  "${P}s=s.replace('content=\"width=device-width, initial-scale=1, viewport-fit=cover\"','content=\"width=1024, initial-scale=1, viewport-fit=cover\"',1);${W}"

# 404.html was unchecked entirely, and it is the page a reader meets when they
# are already lost.
run_case "the 404 page caps zoom" \
  "Capping zoom is a WCAG 1.4.4 failure" \
  "import io;p='docs/404.html';s=io.open(p,encoding='utf-8').read()
a='width=device-width, initial-scale=1';assert a in s
s=s.replace(a,a+', maximum-scale=1',1);io.open(p,'w',encoding='utf-8').write(s)"

run_case "the 404 page loses its viewport" \
  "has no viewport meta" \
  "import io,re;p='docs/404.html';s=io.open(p,encoding='utf-8').read()
s=re.sub(r'<meta name=\"viewport\"[^>]*>','',s);io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 91: the share card has a byte ceiling"

# The card ships at ~19.7 KB only because of a manual PIL quantize documented at
# the top of make-share-card.mjs; the raw render is ~325 KB. This section read
# buf.length only to print it, so a valid 1200x630 PNG of three megabytes passed.
# The mutation keeps the file a strictly valid PNG — a tEXt chunk carrying a
# large payload, inserted after IHDR — because a ceiling that only catches
# corrupt files is not a ceiling.
run_case "the card ships unquantized" \
  "over the 60,000-byte ceiling" \
  "import io,struct,zlib
p='docs/share.png';b=io.open(p,'rb').read()
i=8+8+struct.unpack('>I',b[8:12])[0]+4
pay=b'Comment\x00'+(b'x'*200000)
ch=b'tEXt'+pay
out=b[:i]+struct.pack('>I',len(pay))+ch+struct.pack('>I',zlib.crc32(ch)&0xffffffff)+b[i:]
io.open(p,'wb').write(out)"

echo "--- 108: the fallbacks report instead of dying"

# slice() THROWS on a missing marker, so slice(...) || HTML.slice(...) never
# reached its fallback and the readable failure under it was unreachable with
# it. Renaming the function ended the whole run with a raw stack trace — the
# exact failure mode optionalFn() was written to prevent, twenty lines above
# where it is defined.
run_case "shareCardBlock is renamed out from under the guard" \
  "shareCardBlock() is gone" \
  "${P}s=s.replace('function shareCardBlock','function shareCardPanel');${W}"

echo "--- smoke: the NW1 check tests the thing it names"

# It asserted the code starts NW3W and then did code.replace(/^NW2/,"NW1"),
# which cannot match — so it imported an NW3 code and duplicated the line below
# it. Deleting NW1 support from the app left it green. It does not now.
run_case "NW1 support is deleted from the parser" \
  "an NW1 code from 1.0.0 still restores" \
  "${P}a='if(!/^NW\\\\d+(?:[A-Z][0-9a-z]*)+\$/.test(code)) return null;'
assert a in s;s=s.replace(a,'if(!/^NW[23](?:[A-Z][0-9a-z]*)+\$/.test(code)) return null;',1);${W}" \
  "smoke" "main"

run_case "the pre-3 rating layout is dropped" \
  "an NW1 code from 1.0.0 still restores" \
  "${P}a='  if(ver >= 3){';assert a in s;s=s.replace(a,'  if(true){',1);${W}" \
  "smoke" "main"

echo "--- 109: every count on Progress is a way into the list"

# Stage 3 made the three figures buttons. That they ARE buttons is section 40;
# that they land somewhere real is this. A filter renamed in chipSet() leaves a
# tile pointing at a slice the app no longer offers, and the app answers a tap
# by rendering The path with a filter nothing matches — which looks exactly like
# an empty catalogue rather than like a broken link.
run_case "a filter is renamed under the tile that points at it" \
  "chipSet() does not offer it" \
  "${P}a='[\"skip\",\"Skipped\"]';assert a in s;s=s.replace(a,'[\"skipped\",\"Skipped\"]',1);${W}"

run_case "the Skipped filter is removed and the tile is left behind" \
  "chipSet() does not offer it" \
  "${P}a='[\"skip\",\"Skipped\"],';assert a in s;s=s.replace(a,'',1);${W}"

run_case "a count goes back to being a figure with nowhere to go" \
  "all three counts are a way in or none of them is" \
  "${P}a='scoreTile(\"skip\", c.skip, \"Skipped\", \"sc-skip\")+'
assert a in s;s=s.replace(a,'\\'<button data-act=\"tier\" data-tf=\"done\"><b class=\"sc-skip\">\\'+c.skip+\\'</b><span>Skipped</span></button>\\'+',1);${W}"

echo "--- 44: the watch link searches for the entry's own production"

# THE ONE DEFECT A USER MET, and until this release the guard enforced it.
# titleYear() keyed on the title alone and took the earliest year anywhere in
# the catalogue, so The Batman (2022) sent a reader to search for the 2004
# cartoon. Section 44 required exactly that and only looked for collisions
# between DIFFERENT titles, so it certified the wrong answer for eleven
# releases. Reverting the key has to be caught by the rule now, not blessed.
run_case "the year goes back to being keyed on the title alone" \
  "the reader is sent to a different production" \
  "${P}a='      var k = g.t + \"|\" + g.gi;';assert a in s;s=s.replace(a,'      var k = g.t;',1)
b='  return TITLEYEAR[f.t + \"|\" + f.gi];';assert b in s;s=s.replace(b,'  return TITLEYEAR[f.t];',1);${W}"

run_case "the link hands over the title instead of the entry" \
  "no longer hands watchUrl() the entry" \
  "${P}a='watchUrl(f)+';assert a in s;s=s.replace(a,'watchUrl(f.t)+',1);${W}"

# The other direction: a year that is not any entry's year in that universe.
run_case "the year is taken from the wrong end of the universe" \
  "the first year this title appears in its own universe" \
  "${P}a='if(TITLEYEAR[k] === undefined || g.y < TITLEYEAR[k]) TITLEYEAR[k] = g.y;'
assert a in s;s=s.replace(a,'if(TITLEYEAR[k] === undefined || g.y > TITLEYEAR[k]) TITLEYEAR[k] = g.y;',1);${W}"

# And in the browser, by name. A count would still pass if the wrong six were
# fixed, so the six entries are named in smoke and asserted one at a time.
run_case "The Batman (2022) is sent back to the 2004 cartoon" \
  "The Batman (2022) searches for its own year" \
  "${P}a='  return TITLEYEAR[f.t + \"|\" + f.gi];';assert a in s
s=s.replace(a,'  return TITLEYEAR[f.t + \"|\" + f.gi] === 2022 ? 2004 : TITLEYEAR[f.t + \"|\" + f.gi];',1);${W}" \
  "smoke" "main"

echo "--- the surgical paths stay byte-identical to the full render"

# The danger with a fast path is not that it is wrong on the day, it is that it
# drifts from the builder afterwards and nothing says so. The gate is arithmetic
# rather than review: every targeted repaint must leave a DOM that serialises
# byte-for-byte identically to a forced full render, header and document-level
# attributes included. These four mutations are the four ways it drifts.
run_case "the group toggle forgets the Collapse all button" \
  "byte-identical to a full render" \
  "${P}a='    all.textContent = ao ? \"Collapse all\" : \"Expand all\";'
assert a in s;s=s.replace(a,'',1);${W}" \
  "smoke" "main"

run_case "the row repaint drops the open class" \
  "byte-identical to a full render" \
  "${P}a='  scratch.innerHTML = filmRow(f);'
assert a in s;s=s.replace(a,'  scratch.innerHTML = filmRow(f).replace(\' open\\\"\', \'\\\"\');',1);${W}" \
  "smoke" "main"

run_case "the theme toggle leaves the buttons stale" \
  "byte-identical to a full render" \
  "${P}a='    b.setAttribute(\"aria-pressed\", String(S.theme === b.dataset.theme));'
assert a in s;s=s.replace(a,'',1);${W}" \
  "smoke" "main"

# applyTheme() moves two document-level attributes and this drops the second.
# The status-bar check catches it first, which is the right answer — the gate is
# the backstop, not the only thing looking.
run_case "the theme toggle leaves the status bar behind" \
  "darker repaints the status bar" \
  "${P}a='function themeUpdate(){\n  applyTheme();'
assert a in s;s=s.replace(a,'function themeUpdate(){\n  document.documentElement.setAttribute(\"data-theme\", S.theme);',1);${W}" \
  "smoke" "main"

# One builder, or two that drift. filmRow() was pulled out of groupBlock()
# rather than reimplemented for exactly this reason.
run_case "the row builder is reimplemented for the fast path" \
  "byte-identical to a full render" \
  "${P}a='  scratch.innerHTML = filmRow(f);'
assert a in s;s=s.replace(a,'  scratch.innerHTML = \\'<div class=\"film\"><div class=\"frow\"></div></div>\\';',1);${W}" \
  "smoke" "main"

echo "--- 111: watched and skipped are never both true"

run_case "the cross-tab merge stops clearing the skip" \
  "clears this tab's skip" \
  "${P}a='  for(k in (o.watched || {})){ if(!S.watched[k]){ S.watched[k] = 1; delete S.skipped[k]; moved++; } }'
assert a in s;s=s.replace(a,'  for(k in (o.watched || {})){ if(!S.watched[k]){ S.watched[k] = 1; moved++; } }',1);${W}" \
  "smoke" "main"

run_case "applyImport stops clearing the skip" \
  "restored backup code clears a skip" \
  "${P}a='S.watched[id] = 1; delete S.skipped[id]; S.log.push'
assert a in s;s=s.replace(a,'S.watched[id] = 1; S.log.push',1);${W}" \
  "smoke" "main"

run_case "the JSON restore stops clearing the skip" \
  "restored JSON backup clears a skip" \
  "${P}a='{ S.watched[id3] = 1; delete S.skipped[id3]; }'
assert a in s;s=s.replace(a,'{ S.watched[id3] = 1; }',1);${W}" \
  "smoke" "main"

# And the guard, from the other side: the three sites are found by name, so a
# site that loses the line fails the build without a browser.
run_case "a merge site loses the line and the guard says which" \
  "an entry can come back watched AND skipped" \
  "${P}a='S.watched[id] = 1; delete S.skipped[id]; S.log.push'
assert a in s;s=s.replace(a,'S.watched[id] = 1; S.log.push',1);${W}"

run_case "the log merge is copied back out to a call site" \
  "the log-merge dance appears" \
  "${P}a='  if(Array.isArray(o.log)) moved += mergeLog(o.log);'
assert a in s
s=s.replace(a,'  if(Array.isArray(o.log)){ var have={}; S.log.forEach(function(x){have[x.id]=1;}); o.log.forEach(function(en){ if(en \&\& en.id \&\& isFinite(en.ts) \&\& !have[en.id]){ S.log.push({id:String(en.id),ts:Number(en.ts)}); have[en.id]=1; moved++; } }); S.log.sort(function(a,b){return a.ts-b.ts;}); }',1);${W}"

echo "--- 112: the Restore box survives a render nobody asked for"

run_case "render stops carrying the paste across" \
  "does not wipe the paste" \
  "${P}a='  if(rb && rbVal){';assert a in s;s=s.replace(a,'  if(false && rb && rbVal){',1);${W}" \
  "smoke" "main"

run_case "the preservation is dropped out of render entirely" \
  "render() does not preserve #restorebox" \
  "${P}import re;a='  var rbPrev = document.getElementById(\"restorebox\");'
assert a in s;s=s.replace(a,'  var rbPrev = null;',1)
i=s.index('  var rb = document.getElementById(\"restorebox\");');j=s.index('  if(keep){',i)
s=s[:i]+s[j:];${W}"

echo "--- 104: the cache policy, pinned the moment it exists"

run_case "sw.js loses its no-cache rule" \
  "docs/_headers has no /sw.js rule" \
  "${H2}import re;s=re.sub(r'\n/sw\.js\n  Cache-Control: no-cache\n','\n',s);${HW2}"

run_case "sw.js is given a lifetime instead" \
  "no longer sets Cache-Control on /sw.js" \
  "${H2}s=s.replace('  Cache-Control: no-cache','  Cache-Control: public, max-age=3600',1);${HW2}"

run_case "the fonts lose their year" \
  "no longer sets Cache-Control on /fonts/*" \
  "${H2}s=s.replace('  Cache-Control: public, max-age=31536000, immutable','  Cache-Control: public, max-age=60',1);${HW2}"

run_case "the fonts rule is dropped" \
  "docs/_headers has no /fonts/* rule" \
  "${H2}import re;s=re.sub(r'\n/fonts/\*\n  Cache-Control:[^\n]*\n','\n',s);${HW2}"

# A blanket rule under /* covers sw.js, and the two want opposite answers.
run_case "a blanket cache policy is set under the star rule" \
  "which covers sw.js" \
  "${H2}s=s.replace('  X-Frame-Options: DENY','  X-Frame-Options: DENY\n  Cache-Control: public, max-age=3600',1);${HW2}"


echo "--- 113: every negative suite runs in CI"

# 3.0.0 added a suite and never sharded it. The whole suite ran green on the
# release machine four times, including from inside the zip, and all four CI
# shards went red before run-all.sh ran. The check existed only in CI, which is
# a watcher that cannot see from where the work happens.
run_case "a suite is added and never sharded" \
  "no CI shard runs" \
  "import io;io.open('qa/negative/negtest999.sh','w').write('#!/bin/bash\n. \"\$(dirname \"\${BASH_SOURCE[0]}\")/_lib.sh\"\nfinish \"stub\"\n')"

run_case "a shard pattern is dropped from the matrix" \
  "expected 4" \
  "import io,re;p='.github/workflows/qa.yml';s=io.open(p,encoding='utf-8').read()
i=s.index(\"          - shard: \\\"4\\\"\");j=s.index('    steps:',i)
s=s[:i]+s[j:];io.open(p,'w',encoding='utf-8').write(s)"

run_case "the workflow is deleted outright" \
  "nothing runs the suites on push" \
  "import os;os.remove('.github/workflows/qa.yml')"

echo "--- 114: the README describes the origin that actually serves"

run_case "the retired move offer returns to the README" \
  "in the present tense" \
  "import io;p='README.md';s=io.open(p,encoding='utf-8').read()
a='guard 77 fails the build if that'
assert a in s;s=s.replace(a,'the app offers to carry it across when opened there, and guard 77 fails the build if that',1)
io.open(p,'w',encoding='utf-8').write(s)"

# 3.3.1: the paragraph used to have to say what the app DID to the mirror.
# The app does nothing to it -- there is no mirror -- so what it must now say is
# that the address is gone, and what it may never say is that it still works.
run_case "the README promises the retired address again" \
  "still works and always will" \
  "import io;p='README.md';s=io.open(p,encoding='utf-8').read()
a='The old GitHub Pages mirror was unpublished on 6 August 2026.'
assert a in s;s=s.replace(a,'The old GitHub Pages address still works and always will.',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the paragraph stops saying the mirror is gone" \
  "does not say the mirror was" \
  "import io;p='README.md';s=io.open(p,encoding='utf-8').read()
a='The old GitHub Pages mirror was unpublished on 6 August 2026.'
assert a in s;s=s.replace(a,'The old GitHub Pages mirror is described elsewhere.',1)
s=s.replace('was retired','was changed',1)
io.open(p,'w',encoding='utf-8').write(s)"

echo "--- the generated code sweep in section 8"
# The sweep asserts two things no hand-written fixture can express, because you
# would have to guess the input that produces them. Both are proved here.

# A code may lose progress. It may never invent it. This lets an unresolved hash
# fall through as though it were an id -- what a careless `|| raw` would do.
run_case "importCode invents an id it could not resolve" \
  "the catalogue does not contain" \
  "${P}a='    id = map[W.substr(i,5)];';assert a in s
s=s.replace(a,'    id = map[W.substr(i,5)] || W.substr(i,5);',1);${W}"

# A pasted or truncated code must be refused, never crash the restore. Dropping
# one defensive default is enough: a real code always carries a W segment, so
# section 7 never notices, and every generated code without one throws.
run_case "a defensive default is dropped from the segment read" \
  "must be refused, never crash" \
  "${P}a='  var W = seg.W || \"\", K = seg.S';assert a in s
s=s.replace(a,'  var W = seg.W, K = seg.S',1);${W}"

echo "--- the idHash memo proves its own assumption"
# The memo is sound only while idHash is pure. This gives it state exactly as a
# careless future edit would -- a counter folded into the seed -- and asserts the
# proof catches it. Without this the memo would be the one fail() in the file
# that nothing has ever made fire.
run_case "idHash is given state" \
  "idHash is not pure" \
  "${P}a='  var h = 2166136261, i;';assert a in s
s=s.replace(a,'  var h = 2166136261 + (idHash.n = (idHash.n || 0) + 1), i;',1);${W}"

echo "--- 115: four copies of the bat agree"

run_case "the share card's bat drifts from the header's" \
  "the header bat and BATP have drifted apart" \
  "${P}a='var BATP = \"M50 36';assert a in s;s=s.replace(a,'var BATP = \"M50 37',1);${W}"

run_case "the installed icon drifts from both" \
  "icon.svg and BATP have drifted apart" \
  "import io;p='docs/icon.svg';s=io.open(p,encoding='utf-8').read()
a='M50 36 C 44 25';assert a in s;s=s.replace(a,'M50 38 C 44 25',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the ellipse is dropped from the header" \
  "lost its ellipse" \
  "${P}import re;m=re.search(r'(<button class=\"mark\"[\\s\\S]*?</button>)',s);assert m
b=m.group(1);nb=re.sub(r'<ellipse[^>]*>','',b);s=s[:m.start(1)]+nb+s[m.end(1):];${W}"

run_case "the icon is moved without the header" \
  "same shape, different position" \
  "import io;p='docs/icon.svg';s=io.open(p,encoding='utf-8').read()
a='transform=\"translate(0,5)\"';assert a in s;s=s.replace(a,'transform=\"translate(0,9)\"',1)
io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 42: named origins and fetched origins are different lists"

run_case "an unlisted origin appears in the page" \
  "reaches out to" \
  "${P}s=s.replace('\"https://x.com/6ummy\"','\"https://x.com/6ummy\",\"https://evil.example.com/x\"',1);${W}"


echo "--- 3.0.2: the guard holes"

# The loop's if-body was a comment. Check-shaped, inert, inside a section that
# otherwise works — the class 3.0.0 was written about.
run_case "a named seat leaves the page" \
  "is gone from the page" \
  "${P}a='<p class=\"qhead big\">Then</p>';assert a in s
s=s.replace(a,'<p class=\"qhead big\">Next</p>',1);${W}"

# Section 22 could not see the head, which is where the description tags live.
run_case "a JS escape is stranded in the description" \
  "the head contains" \
  "${P}import re;m=re.search(r'<meta name=\"description\" content=\"([^\"]*)\"',s);assert m
s=s[:m.start(1)]+m.group(1).replace(' ','\\\\u2014',1)+s[m.end(1):];${W}"

# The old pattern only looked rightward: correct HTML, red build.
run_case "a blank-target link loses noreferrer" \
  "missing rel=" \
  "${P}a='target=\"_blank\" rel=\"noopener noreferrer\"';assert a in s
s=s.replace(a,'target=\"_blank\" rel=\"noopener\"',1);${W}"

echo "--- 3.0.2: the app defects"

run_case "the belt goes back to closing on a timer" \
  "does not parse" \
  "${P}a='        S.beltOpen = false;\n        setTimeout(function(){ if(!S.beltOpen) render(); }, 240);'
assert a in s;s=s.replace(a,'        setTimeout(function({ S.beltOpen = false; render(); }, 240);',1);${W}"

run_case "the share handler stops telling a cancel from a failure" \
  "download fallback(s) and needs two" \
  "${P}import re;i=s.index('act === \"cardshare\"'); j=s.index('\n  }',i)
blk=s[i:j];nb=re.sub(r'download\\(f\\.name, f\\)','void 0',blk);s=s[:i]+nb+s[j:];${W}"

run_case "the share handler goes back to one empty catch" \
  "no longer distinguishes a cancelled share" \
  "${P}a='        if(err && err.name === \"AbortError\") return;'
assert a in s;s=s.replace(a,'        if(err) return;',1);${W}"

echo "--- 116: the fonts really carry what the page renders"

# Swapping one face for another proves nothing here: all five subset faces
# carry an identical 204-codepoint set, so no swap can produce a missing
# character. The invariant is tested from the other side instead — the page
# starts needing a character no face has, which is exactly what a catalogue
# patch with an unusual title would do, and is the failure §106 could never see
# because it compares bytes to a record the subset script wrote.
run_case "the page starts needing a glyph no face carries" \
  "does not carry" \
  "import io;p='docs/llms.txt';s=io.open(p,encoding='utf-8').read()
io.open(p,'w',encoding='utf-8').write(s+chr(10)+'A title with an unsubset glyph: '+chr(0x4E00)+chr(10))"

run_case "a recorded system mark turns up in a subset face" \
  "the exception is stale" \
  "import io;p='qa/guards.js';s=io.open(p,encoding='utf-8').read()
a='0x203A: \"the breadcrumb guillemet\"';assert a in s
s=s.replace(a,'0x0041: \"a letter that is obviously in every face\"',1)
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the cmap reader is fed something that is not a woff2" \
  "cannot read the cmap out of" \
  "import io;p='docs/fonts/anton-latin-400-normal.woff2'
io.open(p,'wb').write(b'NOTAWOFF2'+b'\\x00'*400)"

echo "--- 5.1: smoke does not skip silently in CI"

# run_case sets no environment, so the CI condition is forced by the mutation
# rather than by the runner. What is proved is the branch's behaviour — it says
# the suite did not run and exits non-zero — not the env detection itself.
run_case "jsdom goes missing where a skip would be silent" \
  "the smoke suite did not run" \
  "import io;p='qa/smoke.js';s=io.open(p,encoding='utf-8').read()
a='try { jsdom = require(\"jsdom\"); }';assert a in s
s=s.replace(a,'try { jsdom = require(\"jsdom-not-installed\"); }',1)
b='if(process.env.CI){';assert b in s;s=s.replace(b,'if(true){',1)
io.open(p,'w',encoding='utf-8').write(s)" \
  "smoke"

rm -rf "$NEG"
finish "3.0.x negative tests"
