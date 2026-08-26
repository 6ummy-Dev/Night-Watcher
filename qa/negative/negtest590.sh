#!/bin/bash
# negtest590 — 4.7.0, "The cover, and the audit's bundle". Four claims.
#
# Section 151 (new): the splash covers the first frame and only the first
# frame. It is first in <body> and outside #app, it is the header's own bat
# on a fixed --ink plane, it fades on .gone, nothing animates its entrance,
# a <noscript> in the head hides it for a reader without JavaScript, and
# splashOff() brings it down one frame after the first render with no timer
# before the fade. Each of those is broken once here.
#
# Section 78 (narrowed): a <noscript> may carry one <style> and nothing else
# — markup inside it, or attributes on it, is the 1.8.6 mistake returning.
# negtest186's "catalogue goes back into <noscript>" still covers the
# original claim; the two here are the narrowed rule's own edges.
#
# Section 90 (one exception): the seed may link to orders.txt, once. None is
# the 4.6.0 audit's finding again; a second file is the old rule; twice is a
# list of files.
#
# Smoke (staged): the dead-rule sweep stages #splash and #splash.gone because
# the cover is gone by the time the sweep starts. A splash rule that matches
# neither state must still be found dead.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 151: the splash covers the first frame, and only the first frame"

run_case "the splash is removed" \
  "the splash is gone" \
  "${P}import re;m=re.search(r'<div id=\"splash\"[\\s\\S]*?</svg></div>\\n',s);assert m
s=s[:m.start()]+s[m.end():];${W}" \
  guards "" 151

run_case "the splash moves inside #app" \
  "sits inside #app or after it" \
  "${P}import re;m=re.search(r'<div id=\"splash\"[\\s\\S]*?</svg></div>\\n',s);assert m
blk=m.group(0);s=s[:m.start()]+s[m.end():];a='<div id=\"app\">\\n';assert a in s
s=s.replace(a,a+blk,1);${W}" \
  guards "" 151

run_case "the splash loses aria-hidden" \
  "the splash is not aria-hidden" \
  "${P}a='<div id=\"splash\" aria-hidden=\"true\">';assert a in s
s=s.replace(a,'<div id=\"splash\">',1);${W}" \
  guards "" 151

run_case "the splash draws a different bat" \
  "not the header's bat" \
  "${P}import re;m=re.search(r'(<div id=\"splash\"[\\s\\S]*?<path d=\")M50 36 C 44 25',s);assert m
s=s[:m.end()-len('M50 36 C 44 25')]+'M50 36 C 44 26'+s[m.end():];${W}" \
  guards "" 151

run_case "the splash is no longer a fixed plane" \
  "not a fixed plane in --ink" \
  "${P}a='#splash{position:fixed;';assert a in s
s=s.replace(a,'#splash{position:absolute;',1);${W}" \
  guards "" 151

run_case "the splash is drawn in bone" \
  "not a fixed plane in --ink" \
  "${P}a='background:var(--ink);color:var(--signal);display:flex;align-items:center;justify-content:center;transition:opacity';assert a in s
s=s.replace(a,'background:var(--ink);color:var(--bone);display:flex;align-items:center;justify-content:center;transition:opacity',1);${W}" \
  guards "" 151

run_case "the exit is cut instead of faded" \
  "the splash has no exit" \
  "${P}a='#splash.gone{opacity:0;pointer-events:none;}';assert a in s
s=s.replace(a,'#splash.gone{display:none;}',1);${W}" \
  guards "" 151

run_case "the splash animates its entrance" \
  "the splash animates its entrance" \
  "${P}a='#splash svg{display:block;';assert a in s
s=s.replace(a,'#splash svg{display:block;animation:pouch .4s ease-out;',1);${W}" \
  guards "" 151

run_case "the noscript undo is removed" \
  "has no <noscript> undo" \
  "${P}a='<noscript><style>#splash{display:none;}</style></noscript>\\n';assert a in s
s=s.replace(a,'',1);${W}" \
  guards "" 151

run_case "the noscript undo hides something else" \
  "has no <noscript> undo" \
  "${P}a='<noscript><style>#splash{display:none;}</style></noscript>';assert a in s
s=s.replace(a,'<noscript><style>#app{display:none;}</style></noscript>',1);${W}" \
  guards "" 151

run_case "the noscript undo moves into the body" \
  "undo is in the body" \
  "${P}a='<noscript><style>#splash{display:none;}</style></noscript>\\n';assert a in s
s=s.replace(a,'',1);b='<body>\\n';assert b in s;s=s.replace(b,b+a,1);${W}" \
  guards "" 151

run_case "splashOff() is never called" \
  "is not called after the first render" \
  "${P}a='  snapTo(S.tab);\\n  splashOff();\\n';assert a in s
s=s.replace(a,'  snapTo(S.tab);\\n',1);${W}" \
  guards "" 151

run_case "splashOff() is called before the first render" \
  "is not called after the first render" \
  "${P}a='  render();\\n  snapTo(S.tab);\\n  splashOff();\\n';assert a in s
s=s.replace(a,'  splashOff();\\n  render();\\n  snapTo(S.tab);\\n',1);${W}" \
  guards "" 151

run_case "splashOff() holds the cover on a timer" \
  "holds the cover on a timer before fading" \
  "${P}a='  requestAnimationFrame(function(){\\n    sp.className = \"gone\";';assert a in s
s=s.replace(a,'  requestAnimationFrame(function(){\\n    setTimeout(function(){}, 600);\\n    sp.className = \"gone\";',1);${W}" \
  guards "" 151

run_case "splashOff() skips the frame the app paints in" \
  "must wait one frame" \
  "${P}a='  requestAnimationFrame(function(){\\n    sp.className = \"gone\";\\n    setTimeout(function(){ if(sp.parentNode) sp.parentNode.removeChild(sp); }, 400);\\n  });';assert a in s
s=s.replace(a,'  sp.className = \"gone\";\\n  setTimeout(function(){ if(sp.parentNode) sp.parentNode.removeChild(sp); }, 400);',1);${W}" \
  guards "" 151

run_case "splashOff() is deleted" \
  "splashOff() is gone" \
  "${P}import re;m=re.search(r'\\nfunction splashOff\\(\\)\\{[\\s\\S]*?\\n\\}\\n',s);assert m
s=s[:m.start()]+'\\nfunction splashOn(){}\\n'+s[m.end():];a='  splashOff();\\n';assert a in s;s=s.replace(a,'  splashOn();\\n',1);${W}" \
  guards "" 151

echo "--- 78: a <noscript> may carry one <style> and nothing else"

run_case "the noscript grows a paragraph" \
  "a <noscript> carries markup" \
  "${P}a='<noscript><style>#splash{display:none;}</style></noscript>';assert a in s
s=s.replace(a,'<noscript><style>#splash{display:none;}</style><p>Turn on JavaScript.</p></noscript>',1);${W}" \
  guards "" 78

run_case "the noscript grows an attribute" \
  "a <noscript> carries attributes" \
  "${P}a='<noscript><style>#splash{display:none;}</style></noscript>';assert a in s
s=s.replace(a,'<noscript class=\"nojs\"><style>#splash{display:none;}</style></noscript>',1);${W}" \
  guards "" 78

echo "--- 90: the seed names orders.txt once, and no other file"

run_case "the orders.txt link is dropped from the seed" \
  "the seed links to orders.txt 0 times" \
  "${P}a='<a href=\"orders.txt\">the plain-text catalogue</a>';assert a in s
s=s.replace(a,'the plain-text catalogue',1);${W}" \
  guards "" 90

run_case "the seed links a second file" \
  "the one file it may name is orders.txt" \
  "${P}a='<a href=\"#next\">Next up</a>';assert a in s
s=s.replace(a,'<a href=\"llms.txt\">Next up</a>',1);${W}" \
  guards "" 90

run_case "the seed links orders.txt twice" \
  "the seed links to orders.txt 2 times" \
  "${P}a='<a href=\"#next\">Next up</a>';assert a in s
s=s.replace(a,'<a href=\"orders.txt\">Next up</a>',1);${W}" \
  guards "" 90

echo "--- smoke: a splash rule that matches neither staged state is dead"

run_case "a splash rule nothing matches" \
  "#splash .ghost" \
  "${P}a='#splash.gone{opacity:0;pointer-events:none;}';assert a in s
s=s.replace(a,a+'\\n#splash .ghost{color:red;}',1);${W}" \
  smoke "css"

rm -rf "$NEG"
finish "negtest590"
