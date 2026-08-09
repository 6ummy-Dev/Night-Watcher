#!/bin/bash
# Negative-test 3.6.4 — the belt's edges, second cut. Section 130, and the
# fallback half of 129.
#
# The first cut of this release hung the parked peek off a CSS anchor and it
# never rendered on any of the owner's six browsers, while the harness
# Chromium drew it perfectly on every tab. The rebuild's rule is in the
# section header: the peek is the same sticky strip pulled up by a margin,
# with NOTHING left in it for a browser to lack — and the fixtures here
# defend the absences as hard as the presences. Putting back a position
# rule, an anchor, the JS probe, or the hidden-state bookkeeping must go
# red exactly like removing the pull itself.
#
# The other half is the pouches' @supports gate: the anchored rule lives
# inside a condition that names the three exact shapes it uses, over a
# constant-top fallback that works everywhere — because the peek is now the
# only door to the belt, and a browser outside the gate with no fallback
# has a peek that opens nothing.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 130: the entrance mirrors the retraction (owner: 'toasting down')"

run_case "the drop arrives in one frame again" \
  "no longer mirrors the retraction" \
  "${P}a='.pathseg[data-toast]{animation:beltdrop .22s ease;}'
assert a in s
s=s.replace(a,'',1);${W}"

run_case "the entrance shrinks to a nudge" \
  "no longer mirrors the retraction" \
  "${P}a='@keyframes beltdrop{from{transform:translateY(calc(var(--belt-peek) - var(--beltH)));}}'
assert a in s
s=s.replace(a,'@keyframes beltdrop{from{transform:translateY(-10px);opacity:0;}}',1);${W}"

run_case "the entrance flag leaks past its render" \
  "not scoped to the one render" \
  "${P}a='  S.beltDropping = true; render(); S.beltDropping = false;'
assert a in s
s=s.replace(a,'  S.beltDropping = true; render();',1);${W}"

run_case "reduced motion keeps the entrance" \
  "does not cut the drop's entrance" \
  "${P}a=',.pathseg[data-toast]{animation:none;}}'
assert a in s
s=s.replace(a,'{animation:none;}}',1);${W}"

echo "--- 130: every seam in the stack is an overlap (owner: 'not always almost there')"

run_case "the daylight comes back between the pouches" \
  "format row grew a bottom margin back" \
  "${P}a='.includes .scope{position:relative;background:var(--ink);margin:0;'
assert a in s
s=s.replace(a,'.includes .scope{position:relative;background:var(--ink);margin:0 0 6px;',1);${W}"

echo "--- 130: once chosen, the belt IS the peek (owner: 'it stays under the header')"

run_case "parked stops being state" \
  "does not render from S.path exactly once" \
  "${P}a='''(S.path && !(S.beltOpen && !S.beltDrop) ? ' data-park=\"\"' : '')'''
assert a in s
s=s.replace(a,\"' data-park=\\\"\\\"'\",1);${W}"

run_case "the pull drifts by the sentinel's pixel" \
  "pull is gone or drifted" \
  "${P}a='.pathseg[data-park]{margin:calc(var(--belt-peek) - var(--beltH) - 18px - 1px) 0 10px;}'
assert a in s
s=s.replace(a,'.pathseg[data-park]{margin:calc(var(--belt-peek) - var(--beltH) - 18px) 0 10px;}',1);${W}"

run_case "main's padding walks away from the pull" \
  "no longer starts 18px 18px" \
  "${P}a='main{flex:1;padding:18px 18px '
assert a in s
s=s.replace(a,'main{flex:1;padding:17px 18px ',1);${W}"

run_case "the parked strip grows a position rule again" \
  "grew a position rule or an anchor" \
  "${P}a='.pathseg[data-park]{margin:calc(var(--belt-peek) - var(--beltH) - 18px - 1px) 0 10px;}'
assert a in s
s=s.replace(a,'.pathseg[data-park]{position:fixed;margin:calc(var(--belt-peek) - var(--beltH) - 18px - 1px) 0 10px;}',1);${W}"

run_case "the peek grows live buttons" \
  "the parked strip is not the peek" \
  "${P}a='.pathseg[data-park]:not([data-drop]) button{visibility:hidden;}'
assert a in s
s=s.replace(a,'',1);${W}"

run_case "the peek tap goes dead" \
  "tap on the parked peek does not drop" \
  "${P}a='(document.documentElement.hasAttribute(\"data-beltpark\") || pk.hasAttribute(\"data-park\"))'
assert a in s
s=s.replace(a,'document.documentElement.hasAttribute(\"data-beltpark\")',1);${W}"

run_case "a dropped belt keeps its shadow across the change" \
  "keep its shadow on the new tab" \
  "${P}a='  if(S.beltDrop) closeBelt(\"auto\"); else render();'
assert a in s
s=s.replace(a,'  render();',1);${W}"

run_case "the ring wires around goTab" \
  "bypasses goTab" \
  "${P}a='  goTab(\"stats\");'
assert a in s
s=s.replace(a,'  S.tab = \"stats\"; window.scrollTo(0,0); render();',1);${W}"

run_case "the hidden-state bookkeeping creeps back" \
  "bookkeeping is back" \
  "${P}a='var beltIO = null, beltIncIO = null, dropArmed = false,'
assert a in s
s=s.replace(a,'var beltFix = false;\\nvar beltIO = null, beltIncIO = null, dropArmed = false,',1);${W}"

run_case "the JS anchor probe returns" \
  "the JS anchor probe is back" \
  "${P}a='function beltDropOpen(){'
assert a in s
s=s.replace(a,'function supportsAnchor(){ return true; }\\nfunction beltDropOpen(){',1);${W}"

run_case "the entrance flag survives a reload" \
  "entrance flag is written" \
  "${P}a='insOff:S.insOff ? true : undefined});'
assert a in s
s=s.replace(a,'insOff:S.insOff ? true : undefined, beltDropping:S.beltDropping});',1);${W}"

echo "--- 129, the fallback half: a peek that opens nothing is not a door"

run_case "the no-anchor fallback drifts off the strip" \
  "no-anchor fallback" \
  "${P}a='top:calc(var(--hdrh) + var(--beltH) - 4px);'
assert a in s
s=s.replace(a,'top:100px;',1);${W}"

echo "--- the smoke half: the parked selectors must live in some staged state"

run_case "the parked strip selector goes dead (smoke css)" \
  "every CSS rule matches something in some state" \
  "${P}a='''(S.path && !(S.beltOpen && !S.beltDrop) ? ' data-park=\"\"' : '')'''
assert a in s
s=s.replace(a,'''(S.path && !(S.beltOpen && !S.beltDrop) ? ' data-parked=\"\"' : '')''',1);${W}" \
  "smoke" "css"

finish "negtest380"
