#!/bin/bash
# negtest720 — 6.1.0, "The front door". Fixtures for every clause
# this cut added or reshaped: §128's Q4 and Q6 (as 6.1.1 left them: two
# --hdr declarations, and no installed override — the owner kept the navy
# header), Q5 (as 6.1.2 left it: sticky at top:0, for the status bar) and Q7 (the
# peek hands focus on, and Escape hands a lost focus back); §13's two new exclusions and the orphaned-probe
# shape that made 6.0.9 red; §104's rules for the screenshots (their §45
# README rows are in negtest610's sweep, where every row lives);
# §160, the install screenshots, clause by clause; and §161, the ARIA
# corpus's shape. The §159 re-land (6.0.4's three) lives in negtest700 with
# the rest of that section. Every fixture names its section; the green case
# proves a reordered screenshot list is not a finding.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

MAN="import io,json;p='docs/manifest.json';d=json.load(io.open(p,encoding='utf-8'));"
MANW="io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=2,ensure_ascii=False)+'\n')"
REC="import io,json;p='qa/screenshots.json';d=json.load(io.open(p,encoding='utf-8'));"
RECW="io.open(p,'w',encoding='utf-8').write(json.dumps(d,indent=1,ensure_ascii=False)+'\n')"

echo "--- 128: two --hdr declarations again (Q4, reshaped in 6.1.1)"

run_case "a third --hdr declaration arrives" \
  "the two themes declare it twice" \
  "${P}a='  --tabbg:rgba(4,4,6,.95);\n}\n';assert s.count(a)==1;s=s.replace(a,a+'@media print{:root{--hdr:rgba(0,0,0,.96);}}\n',1);${W}" \
  guards "" 128

echo "--- 128: the header is sticky at top:0 (Q5, as 6.1.2 left it)"

run_case "the header stops being sticky" \
  "the header is not position:sticky at top:0" \
  "${P}a='header{position:sticky;top:0;z-index:30;';assert a in s;s=s.replace(a,'header{position:relative;z-index:30;',1);${W}" \
  guards "" 128

run_case "the header sticks somewhere other than the top edge" \
  "the header is not position:sticky at top:0" \
  "${P}a='header{position:sticky;top:0;z-index:30;';assert a in s;s=s.replace(a,'header{position:sticky;top:1px;z-index:30;',1);${W}" \
  guards "" 128

echo "--- 128: the installed header keeps its theme (Q6, reversed in 6.1.1)"

run_case "a standalone --hdr override comes back" \
  "the installed app overrides --hdr" \
  "${P}a='  --tabbg:rgba(4,4,6,.95);\n}\n';assert s.count(a)==1;s=s.replace(a,a+'@media (display-mode: standalone){:root{--hdr:rgba(0,0,0,.96);}}\n',1);${W}" \
  guards "" 128

echo "--- 128: the peek hands focus on (Q7)"

run_case "the peek's click door drops without handing focus on" \
  "the peek's click door drops the belt without handing focus" \
  "${P}a='addEventListener(\"click\", function(){\n  beltDropOpen(); dropFocus();\n});';assert a in s;s=s.replace(a,'addEventListener(\"click\", function(){\n  beltDropOpen();\n});',1);${W}" \
  guards "" 128

run_case "a hand-written keydown door comes back on the native peek" \
  "the peek is not a native button" \
  "${P}a='addEventListener(\"click\", function(){\n  beltDropOpen(); dropFocus();\n});';assert s.count(a)==1;s=s.replace(a,a+'\ndocument.getElementById(\"beltpeek\").addEventListener(\"keydown\", function(e){\n  if(e.key !== \"Enter\") return;\n  beltDropOpen();\n});',1);${W}" \
  guards "" 128

run_case "dropFocus lands on the first control instead of the pressed path" \
  "does not land on the pressed path inside the dropped" \
  "${P}a='.pathseg[data-drop] button[aria-pressed=\"true\"]';assert s.count(a)==1;s=s.replace(a,'.pathseg[data-drop] button',1);${W}" \
  guards "" 128

run_case "beltFocus pulls focus back from a reader who moved on" \
  "does not restore only a LOST focus through focusBack" \
  "${P}a='  if(a && a !== document.body) return;\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 128

run_case "Escape closes the belt and leaves the lost focus on the page" \
  "Escape closes the belt without handing the lost focus back" \
  "${P}a='  setTimeout(beltFocus, BELTCLOSE + 20);\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 128

echo "--- 13: the shell's exclusions, and the orphaned probe"

run_case "a probe is served with no listing (the 6.0.9 red)" \
  "and sw.js does not cache it" \
  "import io;io.open('docs/vp-rotate.html','w',encoding='utf-8').write('<!doctype html><title>probe</title>\n')" \
  guards "" 13

run_case "a screenshot is precached against its own exclusion" \
  "this guard lists it as deliberately not cached" \
  "$(pro docs/sw.js)a='\"./manifest.json\"';assert a in s;s=s.replace(a,'\"./manifest.json\", \"./shot-wide.png\"',1);${W}" \
  guards "" 13

echo "--- 104: the screenshots are cached for a day (their README rows are swept by negtest610)"

run_case "_headers loses the wide screenshot's rule" \
  "docs/_headers has no /shot-wide.png rule" \
  "$(pro docs/_headers)a='/shot-wide.png\n  Cache-Control: public, max-age=86400\n\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 104

echo "--- 160: the manifest's screenshots, as the dialog reads them"

run_case "the manifest declares no screenshots" \
  "docs/manifest.json declares no screenshots" \
  "${MAN}del d['screenshots'];${MANW}" \
  guards "" 160

run_case "a screenshot outside the shot-<factor>.png naming" \
  "a manifest screenshot names \"screens/home.png\"" \
  "${MAN}d['screenshots'][0]['src']='screens/home.png';${MANW}" \
  guards "" 160

run_case "a form factor the dialog does not know" \
  "has form_factor \"tablet\"" \
  "${MAN}d['screenshots'][0]['form_factor']='tablet';${MANW}" \
  guards "" 160

run_case "a screenshot declared as JPEG" \
  "is declared as \"image/jpeg\", not image/png" \
  "${MAN}d['screenshots'][1]['type']='image/jpeg';${MANW}" \
  guards "" 160

run_case "a screenshot without a label" \
  "has no label — the install dialog reads it" \
  "${MAN}del d['screenshots'][1]['label'];${MANW}" \
  guards "" 160

run_case "sizes that do not match the pixels" \
  "is declared 780x1600 and the file is 780x1688" \
  "${MAN}d['screenshots'][0]['sizes']='780x1600';${MANW}" \
  guards "" 160

run_case "a portrait shot declared wide" \
  "is portrait and declared wide" \
  "${MAN}d['screenshots'][0]['form_factor']='wide';d['screenshots'][1]['form_factor']='narrow';${MANW}" \
  guards "" 160

run_case "only one form factor left" \
  "no wide screenshot — one per form factor" \
  "${MAN}d['screenshots']=d['screenshots'][:1];${MANW}" \
  guards "" 160

run_case "the record keeps a shot the manifest dropped" \
  "records shot-wide.png and the manifest does not" \
  "${MAN}d['screenshots']=d['screenshots'][:1];${MANW}" \
  guards "" 160

run_case "manifest and record disagree on a label" \
  "and qa/screenshots.json disagree" \
  "${MAN}d['screenshots'][1]['label']='The Path, in some order or other, as a list';${MANW}" \
  guards "" 160

run_case "two narrow shots of different shapes" \
  "screenshots do not share one aspect ratio" \
  "import io,json,struct,shutil
b=bytearray(io.open('docs/shot-narrow.png','rb').read());b[20:24]=struct.pack('>I',1600)
io.open('docs/shot-tall.png','wb').write(bytes(b))
p='docs/manifest.json';d=json.load(io.open(p,encoding='utf-8'))
d['screenshots'].append({'src':'shot-tall.png','sizes':'780x1600','type':'image/png','form_factor':'narrow','label':'A second phone screenshot at another shape'})
${MANW}" \
  guards "" 160

echo "--- 160: the files themselves"

run_case "a screenshot file is missing" \
  "docs/shot-wide.png is missing" \
  "import os;os.remove('docs/shot-wide.png')" \
  guards "" 160

run_case "a screenshot that is not a PNG" \
  "docs/shot-wide.png is not a PNG" \
  "import io;p='docs/shot-wide.png';b=bytearray(io.open(p,'rb').read());b[1]=0x51;io.open(p,'wb').write(bytes(b))" \
  guards "" 160

run_case "a side under 320px" \
  "a screenshot side must be 320" \
  "import io,json,struct;p='docs/shot-wide.png';b=bytearray(io.open(p,'rb').read());b[20:24]=struct.pack('>I',300);io.open(p,'wb').write(bytes(b))
p='docs/manifest.json';d=json.load(io.open(p,encoding='utf-8'));d['screenshots'][1]['sizes']='1280x300';${MANW}" \
  guards "" 160

run_case "a long side past 2.3 times the short" \
  "the long side is more than 2.3" \
  "import io,json,struct;p='docs/shot-narrow.png';b=bytearray(io.open(p,'rb').read());b[20:24]=struct.pack('>I',1800);io.open(p,'wb').write(bytes(b))
p='docs/manifest.json';d=json.load(io.open(p,encoding='utf-8'));d['screenshots'][0]['sizes']='780x1800';${MANW}" \
  guards "" 160

run_case "a screenshot past the byte ceiling (a skipped quantize)" \
  "over the 150,000-byte ceiling" \
  "import io;p='docs/shot-narrow.png';io.open(p,'ab').write(b'\0'*160000)" \
  guards "" 160

run_case "a screenshot edited outside the generator" \
  "does not match qa/screenshots.json" \
  "${REC}d['shots']['shot-wide.png']['sha256']='0'*64;${RECW}" \
  guards "" 160

run_case "the record forgets a shot" \
  "qa/screenshots.json has no record for shot-narrow.png" \
  "${REC}del d['shots']['shot-narrow.png'];${RECW}" \
  guards "" 160

run_case "the screenshots were drawn from another catalogue" \
  "the screenshots were drawn from a catalogue of 136 films" \
  "${REC}d['films']=136;${RECW}" \
  guards "" 160

run_case "the record goes missing" \
  "qa/screenshots.json is missing or unreadable" \
  "import os;os.remove('qa/screenshots.json')" \
  guards "" 160

run_case "a screenshot joins the offline shell" \
  "is in sw.js's SHELL precache — it is install-dialog chrome" \
  "$(pro docs/sw.js)a='\"./manifest.json\"';assert a in s;s=s.replace(a,'\"./manifest.json\", \"./shot-narrow.png\"',1);${W}" \
  guards "" 160

green_case "the manifest lists its screenshots in the other order" \
  "${MAN}d['screenshots']=d['screenshots'][::-1];${MANW}"

echo "--- 161: the ARIA corpus's shape"

run_case "the browser check stops naming its states" \
  "no longer names its ARIA states" \
  "$(pro qa/browser-check.mjs)a='const ARIA_STATES = [';assert a in s;s=s.replace(a,'const ARIA_LIST = [',1);s=s.replace('of ARIA_STATES','of ARIA_LIST').replace('ARIA_STATES.','ARIA_LIST.');${W}" \
  guards "" 161

run_case "a state drops out of the list" \
  "the ARIA corpus names 7 state(s)" \
  "$(pro qa/browser-check.mjs)a='\"progress\", \"toast\"]';assert a in s;s=s.replace(a,'\"progress\"]',1);${W}" \
  guards "" 161

run_case "the check stops diffing the corpus" \
  "no longer compares the ARIA corpus" \
  "$(pro qa/browser-check.mjs)a='stale.push(name';assert s.count(a)==2;s=s.replace(a,'void (name');${W}" \
  guards "" 161

run_case "a record goes missing" \
  "qa/aria/toast.yml is missing" \
  "import os;os.remove('qa/aria/toast.yml')" \
  guards "" 161

run_case "a record without the header's banner" \
  "does not hold the three parts a reader hears" \
  "$(pro qa/aria/progress.yml)a='# header\n- banner:';assert s.startswith(a);s=s.replace(a,'# header\n- generic:',1);${W}" \
  guards "" 161

run_case "a record keeps the Batman Day line" \
  "carries the Batman Day line" \
  "$(pro qa/aria/next-up.yml)a='- paragraph: Availability changes';assert a in s;s=s.replace(a,'- paragraph: Batman Day, 19 September. Availability changes',1);${W}" \
  guards "" 161

run_case "a record keeps this build's version" \
  "carries this build's version or date" \
  "import io,re;h=io.open('docs/index.html',encoding='utf-8').read();v=re.search(r'var BUILD = \"([^\"]+)\"',h).group(1)
$(pro qa/aria/progress.yml)a='Build {BUILD}';assert a in s;s=s.replace(a,'Build '+v,1);${W}" \
  guards "" 161

run_case "an orphan record nobody writes" \
  "qa/aria/extra.yml is not a state the browser check records" \
  "import shutil;shutil.copy('qa/aria/home.yml','qa/aria/extra.yml')" \
  guards "" 161

run_case "the corpus's focus assertion goes" \
  "the browser check lost the corpus's two assertions" \
  "$(pro qa/browser-check.mjs)a='focus lands on something with a name';assert a in s;s=s.replace(a,'focus is somewhere',1);${W}" \
  guards "" 161

finish "negtest720"
