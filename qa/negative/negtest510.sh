#!/bin/bash
# negtest510 — 4.3.0, the deco release. The hero's 45° cut, the diamond
# ornament, the recipe-C surface ladder, and Anton's retirement.
#
# Section 146 pins the owner's pick from the mock round: cut corners on the
# hero only, drawn as a wrapper-clip so the 1px frame survives, with the
# diamond rule and the dsep separator as the one ornament — no hairline
# frame, no sunburst. Fixtures 1–4 undo each half of the construction
# (radius back, frame colour lost, isolation dropped, hairline inset gone)
# and demand §146 name the exact failure. Fixtures 5–7 strip the ornament:
# the meta-line diamond, then the rule from heroHead, then the rule from the
# Case closed card. Fixture 8 reorders the Darker ladder §147 exists to
# hold. Fixture 9 brings Anton's preload back and demands §42's retirement
# clause refuse it. Fixture 10 drives the ornament through smoke's rendered
# DOM rather than the source, because a render path that drops the ornament
# is invisible to a static pin.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 146: the cut is a construction, and every part is load-bearing"

run_case "the hero corner comes back rounded" \
  "the hero corner is rounded again" \
  "${P}a='.hero{position:relative;isolation:isolate;';assert a in s
s=s.replace(a,'.hero{border-radius:16px;position:relative;isolation:isolate;',1);${W}" \
  guards "" 146

run_case "the hero frame loses its line colour" \
  "the hero frame is not drawn in --line2" \
  "${P}a='background:var(--line2);padding:19px';assert a in s
s=s.replace(a,'background:var(--card);padding:19px',1);${W}" \
  guards "" 146

run_case "the hero loses its own stacking context" \
  "the hero ornament paints over its own text" \
  "${P}a='isolation:isolate;';assert a in s
s=s.replace(a,'',1);${W}" \
  guards "" 146

run_case "the gradient stops sitting 1px inside the frame" \
  "the hero hairline no longer survives the cut" \
  "${P}a='inset:1px';assert a in s
s=s.replace(a,'inset:0',1);${W}" \
  guards "" 146

echo "--- 146: the ornament is the diamond, and it stays"

run_case "the meta-line diamond loses its class" \
  "the hero meta line is back on the plain dot" \
  "${P}a='class=\"dsep\"';assert s.count(a)==1
s=s.replace(a,'class=\"dxsep\"',1);${W}" \
  guards "" 146

run_case "heroHead drops the diamond rule" \
  "the diamond rule left the hero" \
  "${P}q='class=\"drule\"';parts=s.split(q);assert len(parts)==3
s=parts[0]+'class=\"drulex\"'+parts[1]+q+parts[2];${W}" \
  guards "" 146

run_case "the Case closed card drops the diamond rule" \
  "the diamond rule left the hero" \
  "${P}q='class=\"drule\"';parts=s.split(q);assert len(parts)==3
s=parts[0]+q+parts[1]+'class=\"drulex\"'+parts[2];${W}" \
  guards "" 146

echo "--- 147: the surfaces keep their order"

run_case "the darker pressed state goes darker than its card" \
  "surface luminance runs out of order" \
  "${P}a='--card2:#17181C;';assert a in s
s=s.replace(a,'--card2:#050506;',1);${W}" \
  guards "" 147

echo "--- 42: Anton stays retired"

run_case "an anton preload comes back" \
  "Anton is back in index.html" \
  "${P}a='<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/limelight-latin-400-normal.woff2\">';assert a in s
s=s.replace(a,a+'\n<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/anton-latin-400-normal.woff2\">',1);${W}" \
  guards "" 42

echo "--- smoke: the rendered hero wears the ornament"

run_case "a render that drops the ornament is caught in the DOM" \
  "the hero draws the diamond rule" \
  "${P}q='class=\"drule\"';assert s.count(q)==2
s=s.replace(q,'class=\"drulex\"');${W}" \
  smoke main

finish "4.3.0 deco fixtures"
