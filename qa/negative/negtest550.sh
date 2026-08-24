#!/bin/bash
# negtest550 — 4.5.0, the city. The Progress skyline and the story card's
# chart became one city, and section 150 holds the rule that makes it a
# fair chart and a skyline at once: the shaft is the chart, the crown is
# above it and encodes nothing. Fixtures 1–5: the seed — the spec gone,
# roofOf() off idHash, a Progress group losing its frozen code, the card
# seeding by index, a renderer no longer drawing from ROOFS. Fixture 6: the
# shaft height drifting between the JS and the CSS token. Fixture 7: a crown
# lighting before its shaft is full. Fixtures 8–9: colour — an inline
# background in the skyline, the crown classes off-palette. Fixtures 10–12:
# the three design calls on the record — a clip-path back in the city, the
# fill ribbed, the street widened. Fixture 13: the card rounding again.
# Fixture 14: the numerals row growing its boxes back. Fixtures 15–17 drive
# the render through smoke: a crown lit while rising, a shaft dropped from
# the markup, and a roof that changes between renders.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 150: the seed is the code"

run_case "the roof spec is gone" \
  "the roof spec is gone" \
  "${P}a='function crownState(d, k, n){';assert a in s
s=s.replace(a,'function crownStat(d, k, n){',1);s=s.replace('crownState(','crownStat(');${W}" \
  guards "" 150

run_case "roofOf() seeds from the array index instead of the hash" \
  "no longer seeds from idHash of the code" \
  "${P}a='var h = parseInt(idHash(code), 36), t = ROOFTIERS[0], i;';assert a in s
s=s.replace(a,'var h = n * 7, t = ROOFTIERS[0], i;',1);${W}" \
  guards "" 150

run_case "a Progress group seeds from its position" \
  "a Progress group lost its frozen roof code" \
  "${P}a='uniGroups.push({key:\"c\"+gi, code:\"u\"+g.n,';assert a in s
s=s.replace(a,'uniGroups.push({key:\"c\"+gi, code:\"u\"+gi,',1);${W}" \
  guards "" 150

run_case "the card seeds by index" \
  "the card seeds its roofs differently" \
  "${P}a='PATH.map(function(g, gi){ return [\"c\" + gi, \"u\" + g.n]; })';assert a in s
s=s.replace(a,'PATH.map(function(g, gi){ return [\"c\" + gi, \"u\" + gi]; })',1);${W}" \
  guards "" 150

run_case "the card stops drawing its crowns from the spec" \
  "one spec, two renderers" \
  "${P}a='    b[5].levels.forEach(function(lv){';assert a in s
s=s.replace(a,'    [].forEach(function(lv){',1);${W}" \
  guards "" 150

echo "--- 150: the shaft and the crown"

run_case "the shaft height drifts between the JS and the CSS token" \
  "the shaft height disagrees" \
  "${P}a='var SKYSHAFT = 96;';assert a in s
s=s.replace(a,'var SKYSHAFT = 100;',1);${W}" \
  guards "" 150

run_case "a crown lights before the shaft is full" \
  "lights a crown before the shaft is full" \
  "${P}a='return d === n ? \"lit\" : d + k === n ? \"skd\" : \"\";';assert a in s
s=s.replace(a,'return d > n / 2 ? \"lit\" : d + k === n ? \"skd\" : \"\";',1);${W}" \
  guards "" 150

run_case "the skyline paints an inline background" \
  "the skyline carries an inline background" \
  "${P}a='<span class=\"sh\"><i style=\"height:';assert a in s
s=s.replace(a,'<span class=\"sh\"><i style=\"background:var(--signal);height:',1);${W}" \
  guards "" 150

run_case "the lit crown goes off-palette" \
  "the crown colour classes are gone or off-palette" \
  "${P}a='.sky .seg.lit .cr .p{background:var(--signal);}';assert a in s
s=s.replace(a,'.sky .seg.lit .cr .p{background:#FFCF1F;}',1);${W}" \
  guards "" 150

echo "--- 150: the three design calls"

run_case "a clip-path comes back into the city" \
  "a clip-path came back into the city" \
  "${P}a='.sky .cr .p{background:var(--line2);}';assert a in s
s=s.replace(a,'.sky .cr .p{background:var(--line2);clip-path:polygon(0 100%,50% 0,100% 100%);}',1);${W}" \
  guards "" 150

run_case "the fill is ribbed like every other bar" \
  "the city's fill is ribbed" \
  "${P}a='.sky .sh i{position:absolute;left:0;right:0;bottom:0;display:block;background:var(--signal);}';assert a in s
s=s.replace(a,'.sky .sh i{position:absolute;left:0;right:0;bottom:0;display:block;color:var(--signal);background:repeating-linear-gradient(90deg,currentColor 0 2px,transparent 2px 5px);}',1);${W}" \
  guards "" 150

run_case "the street widens" \
  "the street is not 1px" \
  "${P}a='.sky{display:flex;gap:1px;';assert a in s
s=s.replace(a,'.sky{display:flex;gap:2px;',1);${W}" \
  guards "" 150

run_case "the card's buildings round again" \
  "the card's buildings are rounded again" \
  "${P}a='    x.fillStyle = \"#33405C\"; x.fillRect(bx, top, bw, SH);';assert a in s
s=s.replace(a,'    if(x.roundRect){ x.beginPath(); x.roundRect(bx, top, bw, SH, 5); x.clip(); }\n'+a,1);${W}" \
  guards "" 150

run_case "the numerals row grows its boxes back" \
  "the numerals row grew its boxes back" \
  "${P}a='.bigstat button{flex:1;min-width:0;border:0;border-radius:0;padding:14px 6px 12px;background:none;text-align:center;min-height:44px;}';assert a in s
s=s.replace(a,'.bigstat button{flex:1;min-width:0;border:1px solid var(--line);border-radius:0;padding:14px 6px 12px;background:var(--sunk);text-align:center;min-height:44px;}',1);${W}" \
  guards "" 150

echo "--- smoke: the crown is a render claim"

run_case "a builder lights every crown" \
  "a building still rising wears no crown colour of its own" \
  "${P}a='var st = crownState(d, k, n), roof = roofOf(g.code, n), crown = \"\";';assert a in s
s=s.replace(a,'var st = \"lit\", roof = roofOf(g.code, n), crown = \"\";',1);${W}" \
  smoke main

run_case "a builder drops the shaft" \
  "a building is a shaft and a crown" \
  "${P}a='<span class=\"cr\" aria-hidden=\"true\">';assert a in s
s=s.replace(a,'<span class=\"cr2\" aria-hidden=\"true\">',1);${W}" \
  smoke main

run_case "a roof changes between renders" \
  "the same universe wears the same roof on every render" \
  "${P}a='var h = parseInt(idHash(code), 36), t = ROOFTIERS[0], i;';assert a in s
s=s.replace(a,'window.roofN = (window.roofN || 0) + 1; var h = parseInt(idHash(code + window.roofN), 36), t = ROOFTIERS[0], i;',1);${W}" \
  smoke main

finish "4.5.0 city fixtures"
