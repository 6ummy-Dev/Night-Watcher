#!/bin/bash
# negtest460 — 3.9.7. The document is locked and #app owns the scroll.
#
# Release one of two for the tab swipe: nothing looks different, which is
# exactly why every mutation here needs a fixture. A page whose document
# scrolls again, whose scroller stops scrolling, or whose restore goes back
# to window.scrollTo renders identically in a screenshot and in jsdom —
# scrolling the element that no longer moves is a silent no-op, not an
# error. The scroll-owner block (the old min-height:calc(100svh + 1px)
# guard, rewritten) and sections 120/122's retargeted clauses are what stand
# between this release and that class of quiet regression; this suite proves
# each of them can go red. negtest164 carries the two height-lock fixtures,
# because that is the suite that has always owned that block's shape.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- the scroll owner: document clipped, #app scrolls"

run_case "the document unlocks" \
  "html,body no longer clip" \
  "${P}a='html,body{margin:0;padding:0;height:100%;overflow:hidden;}';assert a in s
s=s.replace(a,'html,body{margin:0;padding:0;height:100%;}',1);${W}"

run_case "#app stops scrolling its own overflow" \
  "does not scroll its own overflow" \
  "${P}a='height:100dvh;overflow-y:auto;';assert a in s
s=s.replace(a,'height:100dvh;',1);${W}"

run_case "the overscroll chain reopens" \
  "chains its overscroll" \
  "${P}a='overflow-y:auto;overscroll-behavior:none;}';assert a in s
s=s.replace(a,'overflow-y:auto;}',1);${W}"

echo "--- the banned scroller: window calls address what no longer moves"

run_case "a window scroll call comes back" \
  "index.html calls window.scrollTo" \
  "${P}a='scrollPut(0); render();';assert a in s
s=s.replace(a,'window.scrollTo(0,0); render();',1);${W}"

run_case "the drift anchor reaches for window.scrollBy" \
  "index.html calls window.scrollBy" \
  "${P}a='if(qDrift) scrollPut(scrollKeep() + qDrift);';assert a in s
s=s.replace(a,'if(qDrift) window.scrollBy(0, qDrift);',1);${W}"

run_case "the retraction listener binds to window again" \
  "a scroll listener is bound to window" \
  "${P}a='scroller().addEventListener(\"scroll\", dropScrollOnce';assert a in s
s=s.replace(a,'window.addEventListener(\"scroll\", dropScrollOnce',1);${W}"

echo "--- 122: the restore still settles, and still exists"

run_case "the restore goes bare again" \
  "restores the scroll with a bare restore" \
  "${P}a='''  if(keep){
    v.classList.add(\"settling\");
    scrollPut(keep);'''
assert a in s
s=s.replace(a,'''  if(keep) scrollPut(keep);
  if(keep){
    v.classList.add(\"settling\");''',1);${W}"

run_case "render() stops restoring at all" \
  "render() never calls scrollPut" \
  "${P}a='    scrollPut(keep);';assert a in s
s=s.replace(a,'',1)
b='if(qDrift) scrollPut(scrollKeep() + qDrift);'
assert b in s
s=s.replace(b,'',1);${W}"

rm -rf "$NEG"
finish "negtest460"
