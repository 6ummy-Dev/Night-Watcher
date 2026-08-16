#!/bin/bash
# negtest430 — 3.9.4. The coverage catch-up: one fixture for every section that
# had none.
#
# Guard 138 landed in 3.9.2 with 26 sections on STILL_OWED, after a mapping of
# every fixture onto the sections it breaks showed that "every guard has been
# negative-tested" — a sentence that stood in four files since 1.6.x — was
# false. Most of the 26 predate the per-release suite discipline: they are the
# oldest guards in the file, written before the rule that a guard ships with the
# fixture that proves it can fail.
#
# This suite empties the list. Each case breaks exactly one thing and asserts
# that section goes red for its own stated reason. Several also trip guards
# downstream — a broken slug offends the frozen-ID ledger too — which is fine
# and expected: run_case greps for the one failure it came for.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

H="import io;p='docs/index.html';s=io.open(p,encoding='utf-8').read();"
HW="io.open(p,'w',encoding='utf-8').write(s)"

run_case "1: an id that is not a lowercase slug" \
  "id is not a lowercase slug" \
  "${H}old='i:\"batman-year-one-2011\"';assert old in s;s=s.replace(old,'i:\"Batman-Year-One-2011\"',1);${HW}"

run_case "3: an idHash that collides with everything" \
  "idHash COLLISION" \
  "${H}old='return (\"0000\" + (h >>> 0).toString(36)).slice(-5);';assert old in s;s=s.replace(old,'return \"aaaaa\";',1);${HW}"

run_case "4: route filtering back on the raw o flag" \
  "tests the raw f.o flag" \
  "${H}old='S.filter === \"core\" && tierOf(f) === \"o\"';assert old in s;s=s.replace(old,'S.filter === \"core\" && f.o',1);${HW}"

run_case "9: the Copy link control leaves the Progress tab" \
  "Copy link control is gone" \
  "${H}old='data-act=\"copylink\"';assert old in s;s=s.replace(old,'data-act=\"copylinkX\"');${HW}"

run_case "12: the manifest points at a file that is not there" \
"manifest references missing file" \
"
import io,json
p='docs/manifest.json'
m=json.loads(io.open(p,encoding='utf-8').read())
m['icons'].append({'src':'nope.png','sizes':'1x1','type':'image/png'})
io.open(p,'w',encoding='utf-8').write(json.dumps(m,indent=2))
"

run_case "15: the meta description miscounts the films" \
"the head is the copy a search engine quotes" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
old='<meta name=\"description\" content=\"Every Batman story'
i=s.index(old); j=s.index('>',i)
head=s[:i]; tag=s[i:j]; tail=s[j:]
assert '133 films' in tag
io.open(p,'w',encoding='utf-8').write(head+tag.replace('133 films','132 films',1)+tail)
"

run_case "16: the newest CHANGELOG release is not the shipped one" \
"CHANGELOG.md's newest release is" \
"
import io,re
p='CHANGELOG.md'
s=io.open(p,encoding='utf-8').read()
m=re.search(r'^## \[(\d+\.\d+\.\d+)\]',s,re.M)
assert m
io.open(p,'w',encoding='utf-8').write(s[:m.start(1)]+'9.9.9'+s[m.end(1):])
"

run_case "17: the shared hero size goes missing" \
  ".hero h2 has no font-size" \
  "${H}old='.hero h2{font-family:var(--deco);font-weight:400;letter-spacing:.02em;text-transform:uppercase;font-size:';assert old in s;s=s.replace(old,'.hero h2{font-family:var(--deco);font-weight:400;letter-spacing:.02em;text-transform:uppercase;line-height-x:',1);${HW}"

run_case "18: the scrollbar gutter stops being reserved" \
  "missing scrollbar-gutter:stable" \
  "${H}assert 'scrollbar-gutter' in s;s=s.replace('scrollbar-gutter','scrollbar-gutter-x',1);${HW}"

run_case "19: an import writes a raw rating into S.rated" \
  "writes a raw rating into S.rated" \
  "${H}old='S.rated[id] = rn;';assert old in s;s=s.replace(old,'S.rated[id] = res.rated[id];',1);${HW}"

run_case "22: a JS escape stranded in the static markup" \
"JS escape(s) (" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
i=s.index('<body>'); j=s.index('<script',i)
body=s[i:j]
old='</h1>'
assert old in body
io.open(p,'w',encoding='utf-8').write(s[:i]+body.replace(old,'</h1>\\\\u2014',1)+s[j:])
"

run_case "23: two paths sharing a PATHCODE letter" \
  "two paths share a PATHCODE letter" \
  "${H}old='var PATHCODE = {continuity:\"c\", life:\"l\", release:\"r\"};';assert old in s;s=s.replace(old,'var PATHCODE = {continuity:\"c\", life:\"l\", release:\"c\"};',1);${HW}"

run_case "24: PATHBLURB comes back as a second source of path copy" \
  "PATHBLURB is back" \
  "${H}assert 'esc(pathBlurb(' in s;s=s.replace('esc(pathBlurb(','esc(PATHBLURB(',1);${HW}"

run_case "25: the copy calls storage a device again" \
  "storage is per browser" \
  "${H}assert 'this browser' in s;s=s.replace('this browser','this device',1);${HW}"

run_case "26: the app calls itself a field guide" \
  "the app calls itself a fan guide" \
  "${H}assert 'unofficial fan guide' in s;s=s.replace('unofficial fan guide','unofficial field guide',1);${HW}"

run_case "32: titleYear() renamed, so the watch link loses its year" \
  "titleYear() is gone" \
  "${H}assert 'function titleYear(' in s;s=s.replace('function titleYear(','function titleYr(',1);${HW}"

run_case "36: the collapse-all control leaves The Path" \
  "collapse-all control is gone" \
  "${H}assert 'data-act=\"allgroups\"' in s;s=s.replace('data-act=\"allgroups\"','data-act=\"allgroupsX\"');${HW}"

run_case "37: the rating stars get a second home" \
  "rating stars are rendered in" \
  "${H}old='stars(S.rated[';assert old in s;s=s.replace(old,'stars(S.rated[0]||0)+stars(S.rated[',1);${HW}"

run_case "41: the restore box loses its real label" \
  "labelled by its placeholder only" \
  "${H}old='<label class=\"bklab\" for=\"restorebox\">';assert old in s;s=s.replace(old,'<label class=\"bklab\">',1);${HW}"

run_case "45: the README file table lists a file that is not served" \
"lists files that do not exist" \
"
import io
p='README.md'
s=io.open(p,encoding='utf-8').read()
old='| \`docs/favicon.ico\` |'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'| \`docs/nope.txt\` | not a real file |\n'+old,1))
"

run_case "48: the Progress footer describes the old link again" \
  "still mentions" \
  "${H}old='data-act=\"copylink\"';assert old in s;s=s.replace(old,'data-act=\"copylink\" title=\"Streaming now\"',1);${HW}"

run_case "49: the Activity tick reads as unwatched" \
  "Activity tick is unfilled" \
  "${H}old='.arow .tick{width:24px;height:24px;font-size:11px;align-self:start;margin-top:2px;background:var(--bone);';assert old in s;s=s.replace(old,'.arow .tick{width:24px;height:24px;font-size:11px;align-self:start;margin-top:2px;background:transparent;',1);${HW}"

run_case "52: the chosen format stops being persisted" \
  "format is not persisted" \
  "${H}assert 'format:S.format' in s;s=s.replace('format:S.format','fmtx:S.format',1);${HW}"

run_case "53: formatSwitch() is gone" \
  "formatSwitch() is gone" \
  "${H}assert 'function formatSwitch(' in s;s=s.replace('function formatSwitch(','function formatSwitchX(',1);${HW}"

run_case "73: the worst-case restore link grows past the ceiling" \
  "worst-case restore link is" \
  "${H}old='return (\"0000\" + (h >>> 0).toString(36)).slice(-5);';assert old in s;s=s.replace(old,'return \"pad\" + (\"0000\" + (h >>> 0).toString(36)).slice(-5) + \"padpadpad\";',1);${HW}"

run_case "122: the scroll restore stops settling the layout" \
  "no longer adds .settling" \
  "${H}old='vp.classList.add(\"settling\");\n    scrollPut(keep);';assert old in s;s=s.replace(old,'void 0;\n    scrollPut(keep);',1);${HW}"

run_case "34: ratePrompt comes back after Activity replaced it" \
  "ratePrompt survives" \
  "${H}assert 'function activityBlock(' in s;s=s.replace('function activityBlock(','function ratePrompt_activityBlock(',1);${HW}"

run_case "75: a control drawn smaller than a finger" \
"px touch target" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
i=s.index('.chip{'); j=s.index('}',i)
rule=s[i:j]
assert 'min-height:44px' in rule
io.open(p,'w',encoding='utf-8').write(s[:i]+rule.replace('min-height:44px','min-height:20px')+s[j:])
"

run_case "117: llms.txt loses the summary the README anchors" \
"llms.txt has no" \
"
import io,re
p='docs/llms.txt'
s=io.open(p,encoding='utf-8').read()
s2=re.sub(r'^> .*$','', s, flags=re.M)
assert s2 != s
io.open(p,'w',encoding='utf-8').write(s2)
"

# --- guard 139: the files an agent reads answer fresh ---

run_case "139: auth.md loses its no-cache block" \
"falls back to the assets plane" \
"
import io,re
p='docs/_headers'
s=io.open(p,encoding='utf-8').read()
s2=s.replace('/auth.md\n  Cache-Control: no-cache\n','')
assert s2 != s
io.open(p,'w',encoding='utf-8').write(s2)
"

run_case "139: llms.txt given a lifetime instead" \
"no longer declares no-cache" \
"
import io
p='docs/_headers'
s=io.open(p,encoding='utf-8').read()
old='/llms.txt\n  Cache-Control: no-cache'
assert old in s
io.open(p,'w',encoding='utf-8').write(s.replace(old,'/llms.txt\n  Cache-Control: public, max-age=86400'))
"

run_case "139: the 404 page loses its policy" \
"404.html carries no CSP" \
"
import io,re
p='docs/404.html'
s=io.open(p,encoding='utf-8').read()
s2=re.sub(r'<meta http-equiv=\"Content-Security-Policy\"[^>]*>\n','',s,count=1)
assert s2 != s
io.open(p,'w',encoding='utf-8').write(s2)
"

rm -rf "$NEG"
finish "negtest430"
