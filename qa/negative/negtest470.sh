#!/bin/bash
# negtest470 — 4.0.0. The swipe deck: four panels, one live, the rest warm.
#
# Release two of the tab swipe. Every defect this feature can produce is a
# STATE defect — a stale panel shown as fresh, a background panel answering
# the screen reader, two live copies of the belt, a deck resting between
# tabs — and none of them can fail a screenshot or a jsdom run, because a
# stale panel renders exactly like a fresh one until the state underneath
# moved. Section 143 (the deck's contract), the rewritten scroll-owner
# block (who scrolls what), section 120's scrollLeft pin and section 128's
# widened listener pin are the guards; this suite proves each clause can go
# red, and one green_case proves the widened pin does not over-fire.
# negtest460 keeps the 3.9.7 seam fixtures; negtest164 keeps the height
# lock, as always.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 143: the deck's shape"

run_case "the swipe order drifts from the footer's" \
  "does not match the footer's own" \
  "${P}a='var NWTABS = [\"home\", \"next\", \"watch\", \"stats\"];';assert a in s
s=s.replace(a,'var NWTABS = [\"home\", \"watch\", \"next\", \"stats\"];',1);${W}"

run_case "the panels are born live" \
  "does not build the four panels inert" \
  "${P}a=' inert aria-label';assert a in s
s=s.replace(a,' aria-label',1);${W}"

run_case "the panels lose their column" \
  "the panels have no .pcol column" \
  "${P}a='<div class=\"pcol\"></div>';assert a in s
s=s.replace(a,'<div class=\"pc0l\"></div>',1);${W}"

run_case "the seam stops answering the active panel" \
  "scroller() does not resolve the active panel" \
  "${P}a='return document.getElementById(\"panel-\" + S.tab) || document.getElementById(\"view\");';assert a in s
s=s.replace(a,'return document.getElementById(\"view\");',1);${W}"

echo "--- 143: dirty flags, or the stale tab one swipe away"

run_case "a dirty mark disappears" \
  "dirties the other three" \
  "${P}a='  NWTABS.forEach(function(t){ if(t !== S.tab) nwDirty[t] = true; });\n';assert a in s
s=s.replace(a,'',1);${W}"

run_case "the surgical tick forgets the other tabs" \
  "neighbors are not queued for idle re-fill" \
  "${P}a='''  NWTABS.forEach(function(t){ if(t !== S.tab) nwDirty[t] = true; });
  queueNeighbors();'''
assert a in s
s=s.replace(a,'',1);${W}"

run_case "the idle pass repaints clean panels" \
  "re-fills without consulting the dirty flags" \
  "${P}a='if(!t || !nwDirty[t]) return;';assert a in s
s=s.replace(a,'if(!t) return;',1);${W}"

echo "--- 143: inert, or who answers the screen reader"

run_case "render() stops sweeping inert" \
  "render() does not sweep inert" \
  "${P}a='  if(!nwSwiping) panelsInert();\n';assert a in s
s=s.replace(a,'',1);${W}"

run_case "the settle stops sweeping" \
  "the swipe's settle does not sweep inert" \
  "${P}a='if(nwSwiping && Math.abs(x - i * nwVW) < 2){';assert a in s
s=s.replace(a,'if(nwSwiping){',1);${W}"

run_case "the swipe door forgets the path adoption" \
  "skips the mode adoption the tab button performs" \
  "${P}a='    if(t === \"watch\" && S.path){ S.mode = S.path; revealHero(); }\n';assert a in s
s=s.replace(a,'',1);${W}"

echo "--- 143: one live belt, and the anchor that must not travel"

run_case "a background fill renders the open belt" \
  "background copies with the belt's transient state" \
  "${P}a='if(back){ S.beltOpen = S.beltDrop = S.beltOpening = S.beltDropping = false; }';assert a in s
s=s.replace(a,'',1)
b='if(back){ S.beltOpen = bo; S.beltDrop = bd; S.beltOpening = bg; S.beltDropping = bp; }';assert b in s
s=s.replace(b,'',1);${W}"

run_case "a background strip keeps the anchor name" \
  "still carries the anchor name" \
  "${P}a='.panel[inert] .pathseg{anchor-name:none;}\n';assert a in s
s=s.replace(a,'',1);${W}"

echo "--- 143: the snap is the browser's own arithmetic"

run_case "snapTo writes scrollLeft instead" \
  "snapTo() does not go through scrollIntoView" \
  "${P}a='''    try{ p.scrollIntoView({block:\"nearest\", inline:\"start\"}); }catch(e){}'''
assert a in s
s=s.replace(a,'''    try{ p.parentNode.scrollLeft = 0; }catch(e){}''',1);${W}"

run_case "goTab stops snapping the deck" \
  "goTab() does not snap the viewport" \
  "${P}a='''  if(S.beltDrop){ closeBelt(\"auto\"); scrubBelt(prev); } else render();
  snapTo(t);'''
assert a in s
s=s.replace(a,'''  if(S.beltDrop){ closeBelt(\"auto\"); scrubBelt(prev); } else render();''',1);${W}"

run_case "the hash door stops snapping" \
  "snap the viewport after rendering at 2 site(s)" \
  "${P}a='''window.addEventListener(\"hashchange\", function(){
  try{ routeHash(); }catch(e){}
  render();
  snapTo(S.tab);
});'''
assert a in s
s=s.replace(a,'''window.addEventListener(\"hashchange\", function(){
  try{ routeHash(); }catch(e){}
  render();
});''',1);${W}"

run_case "rotation stops re-snapping" \
  "no ResizeObserver delivering the viewport width" \
  "${P}a='''        nwRszSquelch = true;
        snapTo(S.tab);''';assert a in s
s=s.replace(a,'        nwRszSquelch = true;',1);${W}"

echo "--- 143: the belt parked as the header's own permanent peek"

run_case "the peek never shows" \
  "the header peek is gone or never shows" \
  "${P}a='#beltpeek[data-on]{display:block;pointer-events:auto;cursor:pointer;box-shadow:0 1px 5px -1px var(--signaledge), 0 3px 12px -3px var(--signaledge);}';assert a in s
s=s.replace(a,'',1);${W}"

run_case "the gesture flag returns" \
  "the gesture flag is back" \
  "${P}a='  var t = NWTABS[i];';assert a in s
s=s.replace(a,'  if(Math.abs(x - i * nwVW) >= 2) document.documentElement.setAttribute(\"data-swiping\", \"\");\n  var t = NWTABS[i];',1);${W}"

run_case "parkFocus hides behind the observer" \
  "gates parkFocus() behind IntersectionObserver" \
  "${P}a='''  parkFocus();
  if(!(\"IntersectionObserver\" in window)) return;'''
assert a in s
s=s.replace(a,'''  if(!(\"IntersectionObserver\" in window)) return;
  parkFocus();''',1);${W}"

run_case "the swipe door keeps the shadow" \
  "the swipe door lets a dropped belt" \
  "${P}a='    if(S.beltDrop){ closeBelt(\"auto\"); scrubBelt(prev); } else render();';assert a in s
s=s.replace(a,'    if(S.beltDrop){ closeBelt(\"auto\"); } else render();',1);${W}"

run_case "the scrub forgets the pouches" \
  "no longer removes both halves of the drop" \
  "${P}a='''  var inc = p.querySelector(\".includes\");
  if(inc && inc.parentNode) inc.parentNode.removeChild(inc);'''
assert a in s
s=s.replace(a,'',1);${W}"

echo "--- the scroll owner: the viewport, the panels, the rails"

run_case "the viewport stops snapping" \
  "the swipe viewport does not snap" \
  "${P}a='scroll-snap-type:x mandatory;';assert a in s
s=s.replace(a,'',1);${W}"

run_case "the viewport chains its overscroll" \
  "the swipe viewport chains horizontal overscroll" \
  "${P}a='scroll-snap-type:x mandatory;overscroll-behavior-x:contain;';assert a in s
s=s.replace(a,'scroll-snap-type:x mandatory;',1);${W}"

run_case "the viewport grows a second scrollbar" \
  "the swipe viewport shows its own scrollbar" \
  "${P}a='overscroll-behavior-x:contain;scrollbar-width:none;}';assert a in s
s=s.replace(a,'overscroll-behavior-x:contain;}',1);${W}"

run_case "a panel stops being one viewport wide" \
  "a panel is not exactly one viewport wide" \
  "${P}a='.panel{flex:0 0 100%;min-width:100%;';assert a in s
s=s.replace(a,'.panel{flex:1;min-width:50%;',1);${W}"

run_case "a hard fling crosses three tabs" \
  "the panels do not snap one at a time" \
  "${P}a='scroll-snap-align:start;scroll-snap-stop:always;}';assert a in s
s=s.replace(a,'scroll-snap-align:start;}',1);${W}"

run_case "the no-JS seed stops scrolling" \
  "main is not a vertical scroller before the deck is built" \
  "${P}a='main{flex:1;min-height:0;overflow-y:auto;';assert a in s
s=s.replace(a,'main{flex:1;',1);${W}"

run_case "the chips hand their fling to the deck" \
  "the chips rail chains horizontal overscroll" \
  "${P}a='overflow-x:auto;overscroll-behavior-x:contain;padding:2px 0 12px;';assert a in s
s=s.replace(a,'overflow-x:auto;padding:2px 0 12px;',1);${W}"

run_case "the tab bar gets pinned again" \
  "#tabs is fixed again" \
  "${P}a='#tabs{flex:none;';assert a in s
s=s.replace(a,'#tabs{position:fixed;left:0;right:0;bottom:0;',1);${W}"

run_case "the standalone height override is dropped" \
  "the standalone height override is gone" \
  "${P}a='@media (display-mode: standalone){#app{height:100%;}}\n';assert a in s
s=s.replace(a,'',1);${W}"

run_case "somebody reaches for scrollend" \
  "something listens for scrollend" \
  "${P}a='vp.addEventListener(\"scroll\", swipeTick, {passive:true});';assert a in s
s=s.replace(a,a+'\n  vp.addEventListener(\"scrollend\", swipeTick);',1);${W}"

run_case "CSS smooth scrolling creeps in" \
  "scroll-behavior:smooth is in the stylesheet" \
  "${P}a='main.sw{display:flex;';assert a in s
s=s.replace(a,'main.sw{display:flex;scroll-behavior:smooth;',1);${W}"

run_case "the gutter creeps back onto html" \
  "html carries scrollbar-gutter again" \
  "${P}a='html{scrollbar-color:var(--line2) transparent;}';assert a in s
s=s.replace(a,'html{scrollbar-color:var(--line2) transparent;scrollbar-gutter:stable;}',1);${W}"

echo "--- 120/128: the pins around the swipe"

run_case "a second scrollLeft read arrives" \
  "index.html reads scrollLeft 2 times" \
  "${P}a='  var x = vp.scrollLeft;';assert a in s
s=s.replace(a,'  var x = vp.scrollLeft; void vp.scrollLeft;',1);${W}"

run_case "a third scroll listener arrives" \
  "this build was reviewed with exactly 2" \
  "${P}a='vp.addEventListener(\"scroll\", swipeTick, {passive:true});';assert a in s
s=s.replace(a,a+'\n  vp.addEventListener(\"scroll\", function(){}, {passive:true});',1);${W}"

run_case "the swipe listener loses its throttle" \
  "swipeTick is not rAF-throttled" \
  "${P}a='''function swipeTick(){
  if(typeof requestAnimationFrame !== \"function\"){ swipeRead(); return; }
  if(nwSwipeRaf) return;
  nwSwipeRaf = true;
  requestAnimationFrame(function(){ nwSwipeRaf = false; swipeRead(); });
}'''
assert a in s
s=s.replace(a,'''function swipeTick(){
  swipeRead();
}''',1);${W}"

run_case "the one-shot loses its disarm" \
  "has no disarm path" \
  "${P}a='  if(dropArmedEl) dropArmedEl.removeEventListener(\"scroll\", dropScrollOnce);\n';assert a in s
s=s.replace(a,'',1);${W}"

echo "--- and the pin does not over-fire on prose"

# The mutation edits the inline script, which stales the CSP hash by design —
# so this green case runs bless, exactly as a real label edit would ship.
NEG_ARGS="--bless"
green_case "renaming a panel's spoken label stays green" \
  "${P}a='stats:\"Progress\"';assert a in s
s=s.replace(a,'stats:\"Your progress\"',1);${W}"
NEG_ARGS=

rm -rf "$NEG"
finish "negtest470"
