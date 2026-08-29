#!/bin/bash
# Negative-test every guard added or changed in 2.0.0 — the Belt, theme's one
# home, the progress card, and the four soak holds.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

# 4.3.1 moved every offset to the stylesheet: the belt's bottom margin is 18px
# and the Home grid heading's inline margin became the .gap variant; anchors here
# were updated with it. The guards under test are unchanged.
echo "--- 96: the Belt is one strip, and its pouches open from behind"
run_case "the strip splits back into cards" \
  "the belt is not one strip" \
  "${P}a='.pathseg{display:flex;margin:0 0 18px;border:1px solid var(--ink);border-radius:0;overflow:hidden;'
assert a in s
s=s.replace(a,'.pathseg{display:flex;margin:0 0 18px;border:1px solid var(--ink);border-radius:0;',1);${W}"

run_case "the segments grow their own corners" \
  "carry their own corners" \
  "${P}a='border:0;border-right:1px solid var(--ink);border-radius:0;'
assert a in s
s=s.replace(a,'border:0;border-right:1px solid var(--ink);border-radius:10px;',1);${W}"

run_case "the buckle disappears" \
  "the belt has no buckle" \
  "${P}a='class=\"buckle\" data-act=\"belt\"';assert a in s
s=s.replace(a,'class=\"bkl\" data-act=\"bkl\"',1);${W}"

run_case "the pouches render always, three rows again" \
  "not gated on the belt being open" \
  "${P}a='(S.beltOpen ? includeBlock() : \"\");';assert a in s
s=s.replace(a,'includeBlock();',1);${W}"

run_case "the buckle stops reading the real state" \
  "does not summarise the hidden state" \
  "${P}a='''var fmt = {anim:\"Animated\", live:\"Live action\", all:\"Animated and live action\"}[S.format] || \"Animated and live action\";
  var scp = S.scope === \"all\" ? \"Movies and series\" : \"Movies\";'''
assert a in s
s=s.replace(a,'''var fmt = \"Animated and live action\";
  var scp = \"Movies and series\";''',1);${W}"

run_case "the open belt is remembered" \
  "beltOpen is written to the saved payload" \
  "${P}a='  {k:\"bkDismissAt\",  get:stampOut(\"bkDismissAt\"),  read:stampOf}';assert a in s
s=s.replace(a,a+',\n  {k:\"beltOpen\", read:function(v){ return v; }}',1);${W}"

run_case "the pouches stop staggering" \
  "the pouches do not stagger" \
  "${P}a='animation-delay:.1s;';assert a in s
s=s.replace(a,'',1);${W}"

run_case "the animation ignores reduced motion" \
  "does not cut .includes.opening .scope" \
  "${P}a='@media (prefers-reduced-motion: reduce){.includes.opening .scope,.includes.closing .scope,.includes.closing,.pathseg[data-toast]{animation:none;}}';assert a in s
s=s.replace(a,'@media (prefers-reduced-motion: reduce){}',1);${W}"

echo "--- 97: theme lives on Home, compact, and nowhere else"
run_case "the selector creeps back onto Progress" \
  "the theme selector is back on Progress" \
  "${P}a='    scoreboard(c) +';assert a in s
s=s.replace(a,'    scoreboard(c) + themeRow() +',1);${W}"

run_case "the selector creeps into the Belt" \
  "the theme control is in the Belt" \
  "${P}a=\"    (S.beltOpen ? includeBlock() : '');\"
b='(S.beltOpen ? includeBlock() : \"\");';assert b in s
s=s.replace(b,'(S.beltOpen ? includeBlock() + themeRow() : \"\");',1);${W}"

run_case "the theme row gets capped again" \
  "the theme row is capped again" \
  "${P}a='.themerow{';assert a in s
s=s.replace(a,'.themerow{max-width:230px;',1);${W}"

echo "--- 98: the progress card"
run_case "share loses the lead" \
  "is not the primary action" \
  "${P}a='primary\" data-act=\"cardshare\">Share the night';assert a in s
s=s.replace(a,'\" data-act=\"cardshare\">Share the night',1);${W}"

run_case "the preview creeps back" \
  "the card preview is back" \
  "${P}b='<div class=\"bk sharecard\"><h2>Share your progress</h2>'
assert b in s
s=s.replace(b,b+'<canvas id=\"pcard\" width=\"1080\" height=\"1920\"></canvas>',1);${W}"
run_case "the card floats above the scoreboard" \
  "renders above the scoreboard" \
  "${P}a='''    scoreboard(c) + nightsLine(c) + doneByLine(c) +
    shareCardBlock();'''
assert a in s
s=s.replace(a,'''    shareCardBlock() +
    scoreboard(c) + nightsLine(c) + doneByLine(c);''',1);${W}"

run_case "the card starts reading the theme" \
  "reads the theme" \
  "${P}a='  x.fillStyle = \"#08090F\"; x.fillRect(0, 0, 1080, 1920);';assert a in s
s=s.replace(a,'  x.fillStyle = S.theme === \"darker\" ? \"#000000\" : \"#08090F\"; x.fillRect(0, 0, 1080, 1920);',1);${W}"

run_case "the privacy line is dropped" \
  "the local-only line is gone" \
  "${P}a='Drawn in your browser, nothing uploaded.';assert a in s
s=s.replace(a,'Made locally.',1);${W}"

run_case "the filename stops bragging" \
  "the filename no longer carries the brag" \
  "${P}a='\"night-watcher-\" + c.done + \"-of-\" + c.total + \".png\"';assert a in s
s=s.replace(a,'\"night-watcher.png\"',1);${W}"

echo "--- 99: the soak notes hold"
run_case "the link row loses its alignment again" \
  "the link row does not centre its items" \
  "${P}a='justify-content:flex-start;align-items:center;';assert a in s
s=s.replace(a,'justify-content:flex-start;',1);${W}"

run_case "the format badges collapse back into one look" \
  "styled identically again" \
  "${P}a='.bd.fmlive{color:var(--steel);border:1px dashed currentColor;}';assert a in s
s=s.replace(a,'.bd.fmlive{color:var(--dim);border:1px dashed currentColor;}',1);${W}"

run_case "the ratings legend line drifts apart" \
  "lost their vertical alignment" \
  "${P}a='.legend .rleg .bd{vertical-align:middle;';assert a in s
s=s.replace(a,'.legend .rleg .bd{',1);${W}"

run_case "a named heading loses the variant" \
  "the owner named exactly 3" \
  "${P}a='<p class=\"qhead big\">Then</p>';assert a in s
s=s.replace(a,'<p class=\"qhead\">Then</p>',1);${W}"

finish "negtest200"
