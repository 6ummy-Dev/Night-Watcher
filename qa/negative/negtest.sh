#!/bin/bash
# Negative-test every new and changed guard. Each case mutates a pristine copy,
# runs the guards, and requires the EXACT expected message to appear.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

G="$(pro qa/guards.js)"

echo "--- guard 55: levels 2-3 are shorter, at unchanged type size"
run_case "rows the same height again" \
  "levels 2 and 3 are meant to sit shorter than level 1" \
  "${P}a='.includes .scope button{min-height:34px';assert a in s;s=s.replace(a,'.includes .scope button{min-height:44px');${W}"

run_case "type shrunk to buy height" \
  "shrinking the type is what wrapped both labels in 1.5.7" \
  "${P}a='min-height:34px;padding:8px 6px;font-size:9px';assert a in s;s=s.replace(a,'min-height:34px;padding:8px 6px;font-size:8px');${W}"

run_case "shrunk below a tap target" \
  "under 30px they are no longer a thumb-sized target" \
  "${P}a='.includes .scope button{min-height:34px';assert a in s;s=s.replace(a,'.includes .scope button{min-height:28px');${W}"

run_case "labels can wrap again" \
  "both broke across two lines" \
  "${P}a='border-right-color:var(--signal);white-space:nowrap;}';assert a in s;s=s.replace(a,'border-right-color:var(--signal);}');${W}"

echo "--- guard 55: the drops are part of the belt (4.6.0), and the chosen pouch is a dimmed fill (4.7.0)"
run_case "the chosen pouch goes back to card2 and bone" \
  "the chosen pouch is not a dimmed signal fill" \
  "${P}a='.includes .scope button[aria-pressed=\"true\"]{background:var(--signaldim);color:var(--ink);';assert a in s;s=s.replace(a,'.includes .scope button[aria-pressed=\"true\"]{background:var(--card2);color:var(--bone);');${W}" \
  guards "" 55

run_case "the chosen pouch goes back to the 4.6.0 belt-bright fill" \
  "the belt's own signal fill again" \
  "${P}a='.includes .scope button[aria-pressed=\"true\"]{background:var(--signaldim);color:var(--ink);';assert a in s;s=s.replace(a,'.includes .scope button[aria-pressed=\"true\"]{background:var(--signal);color:var(--ink);');${W}" \
  guards "" 55

run_case "the dimmed yellow drifts brighter" \
  "signaldim is not #B8941A" \
  "${P}a='--signaldim:#B8941A;';assert a in s;s=s.replace(a,'--signaldim:#E8BC1C;');${W}" \
  guards "" 55

run_case "the pouch seams go back to grey" \
  "lost their signal lettering or seams" \
  "${P}a='color:var(--signal);border-right-color:var(--signal);white-space:nowrap;}';assert a in s;s=s.replace(a,'color:var(--signal);border-right-color:var(--line);white-space:nowrap;}');${W}" \
  guards "" 55

run_case "the pouch lettering goes back to dust" \
  "lost their signal lettering or seams" \
  "${P}a='color:var(--signal);border-right-color:var(--signal);white-space:nowrap;}';assert a in s;s=s.replace(a,'color:var(--dust);border-right-color:var(--signal);white-space:nowrap;}');${W}" \
  guards "" 55

echo "--- guard 54: the belt is signal and the chosen path is its inversion (4.6.0)"
run_case "the chosen path goes back to a signal fill" \
  "not an ink pouch lettered in signal" \
  "${P}a='.pathseg button[aria-pressed=\"true\"]{background:var(--ink);color:var(--signal);';assert a in s;s=s.replace(a,'.pathseg button[aria-pressed=\"true\"]{background:var(--signal);color:var(--ink);');${W}" \
  guards "" 54

run_case "the chosen path borrows the primary-action fill" \
  "borrowed the fill the app uses for primary actions" \
  "${P}a='.pathseg button[aria-pressed=\"true\"]{background:var(--ink);color:var(--signal);';assert a in s;s=s.replace(a,'.pathseg button[aria-pressed=\"true\"]{background:var(--ink);color:var(--signal);outline-color:var(--bonebtn);');${W}" \
  guards "" 54

run_case "the belt goes dark again" \
  "the belt is not yellow" \
  "${P}a='overflow:hidden;background:var(--signal);position:sticky;';assert a in s;s=s.replace(a,'overflow:hidden;background:var(--card);position:sticky;');${W}" \
  guards "" 54

echo "--- guard 54: the first-run page tells before it asks"
run_case "intro dropped from the first-run page" \
  "the landing page goes back to never saying the word" \
  "${P}a='<div class=\"chooser\">'+\"'+introBlock()+\";assert a in s;s=s.replace(a,'<div class=\"chooser\">'+\"'+\");${W}"

run_case "intro moved below the deck" \
  "the first-run page asks before it tells" \
  "${P}a=\"'<div class=\\\"chooser\\\">'+introBlock()+\";assert a in s;s=s.replace(a,\"'<div class=\\\"chooser\\\">'+\");b=\"}).join(\\\"\\\")+'</div>' + '</div>';\";assert b in s;s=s.replace(b,\"}).join(\\\"\\\")+'</div>'+introBlock() + '</div>';\");${W}"

run_case "intro copy written twice" \
  "it renders on two pages from one function" \
  "${P}a='  if(fresh){';assert a in s;s=s.replace(a,'  if(fresh){ html += \\'<p class=\\\"ibody\\\">a</p>\\';',1);${W}"

run_case "the master chooser leaves Home" \
  "Home no longer renders the master chooser" \
  "${P}a='  html += masterChooser();';assert a in s;s=s.replace(a,'  html += \\\"\\\";');${W}"

echo "--- guard 56/57: the legend is made of badges"
run_case "swatches back to styled text" \
  "the legend still draws its swatches as styled text" \
  "${P}a='return \\'<span><span class=\\\"bd \\'+k+\\'\\\">\\'+BADGE[k]+\\'</span>\\'';assert a in s;s=s.replace(a,'return \\'<span><i style=\\\"color:var(--dim)\\\">\\'+BADGE[k]+\\'</i>\\'');${W}"

run_case "legend spells its own labels" \
  "the legend spells its own labels instead of reading BADGE" \
  "${P}a=\"'+BADGE[k]+'\";assert a in s;s=s.replace(a,'X');${W}"

run_case "the dead .legend i rule survives" \
  "the .legend i rule outlived the swatches it styled" \
  "${P}a='.legend > span{';assert a in s;s=s.replace(a,'.legend i{font-style:normal;}\n.legend > span{');${W}"

run_case "format swatches lose their badge classes" \
  "the legend does not explain the format badges" \
  "${P}a='class=\\\"bd fmlive\\\"';assert a in s;s=s.replace(a,'class=\\\"fmlive\\\"');${W}"

echo "--- guard 58: Then is the tab, not the gap (card cases retired in 1.6.3 — the guard now holds the proportion, not the container; see negtest163.sh)"
run_case "Then loses its numbers" \
  "the Then rows lost their numbers" \
  "${P}a='class=\\\"qn\\\"';assert a in s;s=s.replace(a,'class=\\\"qnum\\\"');${W}"

echo "--- guard 66: the numbering still enforces itself"
run_case "a guard section is renumbered out of order" \
  "guard sections are out of order" \
  "${G}a='/* ---------- 58. Then is the tab';assert a in s;s=s.replace(a,'/* ---------- 60. Then is the tab');${W}"

run_case "a new section is missing from the INDEX" \
  "is missing from the INDEX" \
  "${G}a='     58   Then is the tab, not the gap\n';assert a in s;s=s.replace(a,'');${W}"

rm -rf "$NEG"
finish "negative tests"
