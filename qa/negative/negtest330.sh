#!/bin/bash
# Negative-test everything 3.3.0 added or changed: section 121 (the privacy
# footer against the README), section 20's per-rule UI exemption, section 120's
# ORDER clause, and the favicon set that used to be a count.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

R="$(pro README.md)"
RW="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 121: the privacy footer says what the README says"
run_case "the footer stops saying who counts" \
  'the Home footer no longer carries "host"' \
  "${P}a='the host counts visits';assert a in s
s=s.replace(a,'Cloudflare counts visits',1);${W}"

run_case "the footer drops the counting claim entirely" \
  'the Home footer no longer carries "counts"' \
  "${P}a='the host counts visits, never what ';assert a in s
s=s.replace(a,'the host sees nothing, never what ',1);${W}"

run_case "the README's visit bullet is deleted" \
  "the README's visit-counting bullet is gone" \
  "${R}import re;s=re.sub(r'^- \*\*Anonymous visit counts.*\$','',s,flags=re.M);${RW}"

run_case "the README stops naming the host" \
  'visit-counting bullet no longer carries "host"' \
  "import io,re;p='README.md';s=io.open(p,encoding='utf-8').read()
m=re.search(r'^- [*][*]Anonymous visit counts[^\\n]*\$',s,re.M);assert m
line=m.group(0);new=line.replace('host','vendor');assert new!=line
s=s[:m.start()]+new+s[m.end():]
io.open(p,'w',encoding='utf-8').write(s)"

run_case "the footer is removed altogether" \
  "the Home footer is gone" \
  "${P}import re;s=re.sub(r'<p class=\"homefoot\">','<p class=\"gone\">',s,count=1);${W}"

echo "--- 20: the UI-component exemption is earned per rule, not per token"
run_case "the buckle's second line goes back to --staroff" \
  "draws text in --staroff" \
  "${P}a='.bs2{font-size:7px;letter-spacing:.02em;color:var(--ink);';assert a in s
s=s.replace(a,'.bs2{font-size:7px;letter-spacing:.02em;color:var(--staroff);',1);${W}"

run_case "a new rule borrows a line token for prose" \
  "draws text in --line2" \
  "${P}a='.buildline{display:block;';assert a in s
s=s.replace(a,'.buildline{color:var(--line2);display:block;',1);${W}"

run_case "the exemption outlives the rule it was written for" \
  "UI_EXEMPT names" \
  "${P}a='.stars button';assert a in s
s=s.replace(a,'.stars bttn',1);${W}"

echo "--- 120: the scroll read comes before the first write"
run_case "the scroll read slides back below flagSave()" \
  "reads the scroll position after it has already written" \
  "${P}a='''  var keep = scrollKeep();
  if(nwArriveKeep !== null){ keep = nwArriveKeep; nwArriveKeep = null; }
  if(nwScrollAdjust){ keep = Math.max(0, keep - nwScrollAdjust); nwScrollAdjust = 0; }
  flagSave();'''
assert a in s
s=s.replace(a,'''  flagSave();''',1)
b='''  flagSave();
  applyTheme();'''
assert b in s
s=s.replace(b,b+'''
  var keep = scrollKeep();
  if(nwArriveKeep !== null){ keep = nwArriveKeep; nwArriveKeep = null; }
  if(nwScrollAdjust){ keep = Math.max(0, keep - nwScrollAdjust); nwScrollAdjust = 0; }''',1);${W}"

run_case "render() stops opening with the write it is measured against" \
  "no longer opens with flagSave()" \
  "${P}a='  flagSave();\n';assert a in s;s=s.replace(a,'  flagSaveLater();\n',1);${W}"

echo "--- the favicon set, which used to be a count"
run_case "the classic path is dropped from the head" \
  "no longer offers favicon.ico" \
  "${P}a='<link rel=\"icon\" href=\"favicon.ico\" sizes=\"any\">';assert a in s
s=s.replace(a,'',1);${W}"

run_case "the 512 raster is unlinked again" \
  "no longer offers icon.png" \
  "${P}a='<link rel=\"icon\" type=\"image/png\" sizes=\"512x512\" href=\"icon.png\">';assert a in s
s=s.replace(a,'',1);${W}"

run_case "the ico file goes missing under a live link" \
  "docs/favicon.ico is missing" \
  "import os;os.remove('docs/favicon.ico')
import io;p='README.md';s=io.open(p,encoding='utf-8').read()
a='| \`docs/favicon.ico\` |';i=s.index(a);j=s.index('\n',i);s=s[:i]+s[j+1:]
io.open(p,'w',encoding='utf-8').write(s)"

run_case "a fifth icon arrives that nobody decided on" \
  "an icon this section does not know about" \
  "${P}a='<link rel=\"icon\" type=\"image/svg+xml\" href=\"icon.svg\">';assert a in s
s=s.replace(a,a+'<link rel=\"icon\" type=\"image/png\" sizes=\"64x64\" href=\"icon-64.png\">',1);${W}"

run_case "the ico is a PNG wearing the wrong extension" \
  "does not begin with the ICO signature" \
  "import shutil;shutil.copyfile('docs/icon-192.png','docs/favicon.ico')"

finish "negtest330"
