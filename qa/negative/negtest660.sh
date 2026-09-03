#!/bin/bash
# negtest660 — 5.1.0, "Someone in the room". One fixture per promise in
# section 157, plus the smoke drives: the safe chip on The Path, the done-by
# line's floor, and the kick's count against the header.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 157: the chip excludes a set"

run_case "a third certificate joins the set" \
  "not exactly R and TV-MA" \
  "${P}a='var OFFLIMITS = [\"R\", \"TV-MA\"];';assert a in s;s=s.replace(a,'var OFFLIMITS = [\"R\", \"TV-MA\", \"TV-14\"];',1);${W}" \
  guards "" 157

run_case "the chip translates instead of reading r:" \
  "no longer reads the certificate straight off r:" \
  "${P}a='function offLimits(f){ return OFFLIMITS.indexOf(f.r) >= 0; }';assert a in s;s=s.replace(a,'function offLimits(f){ return f.r === \"R\" || /MA|14/.test(f.r); }',1);${W}" \
  guards "" 157

run_case "the chip leaves chipSet" \
  "certificates chip is gone from chipSet()" \
  "${P}a=',[\"safe\",\"R / TV-MA off\"]';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 157

run_case "The path stops honouring the chip" \
  "does not honour the safe chip" \
  "${P}a='    if(S.filter === \"safe\" && offLimits(f)) return;\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 157

run_case "the chip moves the count" \
  "consults the certificates chip" \
  "${P}a='    if(isParked(f)) return;\n    total++;';assert a in s;s=s.replace(a,'    if(isParked(f) || (S.filter === \"safe\" && offLimits(f))) return;\n    total++;',1);${W}" \
  guards "" 157

echo "--- 157: the pace has a floor"

run_case "the floor is lowered to one night" \
  "doneBy() lost its floor" \
  "${P}a='var DONEBY_NIGHTS = 3, DONEBY_TITLES = 2;';assert a in s;s=s.replace(a,'var DONEBY_NIGHTS = 1, DONEBY_TITLES = 2;',1);${W}" \
  guards "" 157

run_case "the pace ignores the span" \
  "doneBy() paces wrong" \
  "${P}a='  var perDay = nt.logged / spanDays;';assert a in s;s=s.replace(a,'  var perDay = nt.logged / nt.nights;',1);${W}" \
  guards "" 157

run_case "a finished route is forecast" \
  "forecasts a finished route" \
  "${P}a='  if(!left || nt.nights < DONEBY_NIGHTS';assert a in s;s=s.replace(a,'  if(nt.nights < DONEBY_NIGHTS',1);${W}" \
  guards "" 157

run_case "the line awards a streak" \
  "the pace is counted, never awarded" \
  "${P}a='at your pace, done by <b>';assert a in s;s=s.replace(a,'streak! at your pace, done by <b>',1);${W}" \
  guards "" 157

run_case "the line leaves its seat" \
  "left its seat under the nights line" \
  "${P}a='    scoreboard(c) + nightsLine() + doneByLine(c) +';assert a in s;s=s.replace(a,'    doneByLine(c) + scoreboard(c) + nightsLine() +',1);${W}" \
  guards "" 157

echo "--- 157: Your data's rank"

run_case "the card drops its class" \
  "lost its yd class" \
  "${P}a='<div class=\"bk yd\"><h2>Your data</h2>';assert a in s;s=s.replace(a,'<div class=\"bk\"><h2>Your data</h2>',1);${W}" \
  guards "" 157

run_case "the hairline comes back" \
  "the seam is the diamond (drawn since 5.2.0), inside the box" \
  "${P}a='<p class=\"drule gold\" aria-hidden=\"true\"><i></i></p><h2>Restore</h2>';assert a in s;s=s.replace(a,'<hr><h2>Restore</h2>',1);${W}" \
  guards "" 157

run_case "the frame loses its ink" \
  "lost its signal frame" \
  "${P}a='.bk.yd{border-color:var(--signaledge);';assert a in s;s=s.replace(a,'.bk.yd{border-color:var(--line2);',1);${W}" \
  guards "" 157

run_case "the card's paragraph ink wins again" \
  "must pin signal" \
  "${P}a='.bk .drule{color:var(--signal);margin:18px 0;}';assert a in s;s=s.replace(a,'.bk .drule{margin:18px 0;}',1);${W}" \
  guards "" 157

run_case "the gold rule fades" \
  "faded back to the hero" \
  "${P}a='.drule.gold::before{background:linear-gradient(90deg,transparent,var(--signal));}';assert a in s;s=s.replace(a,'.drule.gold::before{background:linear-gradient(90deg,transparent,var(--signalline));}',1);${W}" \
  guards "" 157

echo "--- 157: one bone recipe, signal carets"

run_case "the Progress bone button gets its own polygon" \
  "the polygons must be the same bytes" \
  "${P}a='.bkbtn.primary{background:var(--suit);color:var(--ink);border:0;font-weight:600;min-height:46px;font-size:var(--t-label);letter-spacing:.12em;\n  clip-path:polygon(8px 0,';assert a in s;s=s.replace(a,'.bkbtn.primary{background:var(--suit);color:var(--ink);border:0;font-weight:600;min-height:46px;font-size:var(--t-label);letter-spacing:.12em;\n  clip-path:polygon(6px 0,',1);${W}" \
  guards "" 157

run_case "the bone button shrinks back" \
  "wrong size for the recipe" \
  "${P}a='font-weight:600;min-height:46px;font-size:var(--t-label);letter-spacing:.12em;\n  clip-path';assert a in s;s=s.replace(a,'font-weight:600;min-height:44px;font-size:var(--t-label);letter-spacing:.12em;\n  clip-path',1);${W}" \
  guards "" 157

run_case "the cut button grows a border" \
  "draws the border across the cut" \
  "${P}a='.bkbtn.primary{background:var(--suit);color:var(--ink);border:0;';assert a in s;s=s.replace(a,'.bkbtn.primary{background:var(--suit);color:var(--ink);border:1px solid var(--suit);',1);${W}" \
  guards "" 157

run_case "the carets go dim again" \
  "fold carets are not signal" \
  "${P}a='.sfhead .caret{color:var(--signal);}\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 157

echo "--- smoke: driven"

run_case "the safe chip shows an R" \
  "the R / TV-MA off chip hides every R and TV-MA" \
  "${P}a='    if(S.filter === \"safe\" && offLimits(f)) return;\n';assert a in s;s=s.replace(a,'',1);${W}" \
  smoke main

run_case "the forecast speaks below the floor" \
  "below the floor, no forecast" \
  "${P}a='var DONEBY_NIGHTS = 3, DONEBY_TITLES = 2;';assert a in s;s=s.replace(a,'var DONEBY_NIGHTS = 1, DONEBY_TITLES = 1;',1);${W}" \
  smoke main

run_case "the kick disagrees with the header" \
  "Home's kick says where you stand" \
  "${P}a='               c.done + \" of \" + c.total)+';assert a in s;s=s.replace(a,'               (c.done + 1) + \" of \" + c.total)+',1);${W}" \
  smoke main

rm -rf "$NEG"
finish "negtest660 (5.1.0 — someone in the room)"
