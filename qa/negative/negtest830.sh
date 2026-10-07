#!/bin/bash
# negtest830 — 6.7.3. Search finds a shortened title, and a query that folds
# to nothing matches nothing (177). A bad progress key still applies the
# settings (178). The paper switch paints from the theme, each button times
# itself, and the app switch carries no dead data-theme (179).
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"

echo "--- 177: search finds a shortened title"

run_case "the haystack drops the official prefix" \
  "the haystack no longer carries the dropped prefix" \
  "${P}a='foldSearch([AKA[f.id], ';assert a in s;s=s.replace(a,'foldSearch([',1);${W}" \
  guards "" 177

run_case "Doom loses the dropped word" \
  "the-doom-that-came-to-gotham-2023 lost the words search was given" \
  "${P}a='  \"the-doom-that-came-to-gotham-2023\": \"Batman\"\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 177

run_case "an accent no longer folds" \
  "an accented query no longer folds to its letters" \
  "${P}a='.normalize(\"NFD\").replace(/\\\\p{M}/gu,\"\")';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 177

run_case "an apostrophe no longer folds" \
  "an apostrophe no longer folds out of a query" \
  "${P}a='.replace(/'+chr(39)+'/g, \"\")';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 177

run_case "a symbol query shows every row" \
  "a symbol query still shows every row" \
  "${P}a='if(!q && /'+chr(92)+'S/.test(raw)) return null;';assert a in s;s=s.replace(a,'if(!q && /'+chr(92)+'S/.test(raw)) return q;',1);${W}" \
  guards "" 177

run_case "a blank box hides the path" \
  "a blank box hides the path" \
  "${P}a='if(!q && /'+chr(92)+'S/.test(raw)) return null;\n  return q;';assert a in s;s=s.replace(a,'if(!q && /'+chr(92)+'S/.test(raw)) return null;\n  return null;',1);${W}" \
  guards "" 177

echo "--- 178: a bad progress key still applies the settings"

run_case "settings wait on the progress parse" \
  "settings wait until the progress key parses" \
  "${P}a='  if(so){\n    SCHEMA.forEach(function(r){\n      if(!r.s) return;\n      var v = r.read(so[r.k], so);\n      if(v === undefined) return;\n      if(r.put) r.put(v); else S[r.k] = v;\n    });\n  }\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 178

echo "--- 179: the paper switch, and each button's timer"

run_case "the diamond paints from aria-checked alone" \
  "the paper switch still paints from aria-checked alone" \
  "${N}a=':root[data-theme=darker] .dsw .trk i{left:100%;}';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 179

run_case "Share and Copy link share a timer" \
  "Share and Copy link still share one timer" \
  "${N}a='clearTimeout(button._t)';assert a in s;s=s.replace(a,'clearTimeout(timer)',1);${W}" \
  guards "" 179

run_case "the dead data-theme attribute returns" \
  "the theme switch still carries a dead data-theme" \
  "${P}a='data-theme-switch>';assert a in s;s=s.replace(a,'data-theme-switch data-theme=\"toggle\">',1);${W}" \
  guards "" 179

finish "negtest830"
