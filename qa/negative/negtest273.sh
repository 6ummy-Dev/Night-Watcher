#!/bin/bash
# Negative-test 2.7.3 — one share button, a header that balances, and a footer
# that names the source.
#
# The share half is the one worth reading. Cutting the second button was the
# owner's word and took thirty seconds; the reason it was safe took longer.
# navigator.share existing does not mean FILE sharing works, and the old handler
# answered that case with a toast saying so — survivable only because Download
# sat beside it. Remove the button without touching the handler and the only
# control on the block tells one class of browser "no" and leaves them there.
# The fallback is what makes one button honest, so the fallback is guarded.
#
# The header half is guarded because nothing was ever misaligned. Both flankers
# are boxed at 46px and the wordmark is centred between them; the lopsidedness
# was the mass INSIDE the boxes. Numbers that look arbitrary get tidied.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- the share block offers exactly one button"

run_case "the download button comes back beside it" \
  "the share block offers 2 card buttons" \
  "${P}a='<button class=\"bkbtn primary\" data-act=\"cardshare\">Share the night</button>'
s=s.replace(a,a+'<button class=\"bkbtn\" data-act=\"cardsave\">Download the card</button>',1);${W}"

run_case "the one button stops being Share the night" \
  "is not the primary action" \
  "${P}s=s.replace('primary\" data-act=\"cardshare\">Share the night','primary\" data-act=\"cardshare\">Save the night',1);${W}"

echo "--- and it falls back instead of dead-ending"

run_case "the fallback is replaced by the old apology" \
  "download fallback(s) and needs two" \
  "${P}a='else toast(download(f.name, f) ? \"Card downloaded\" : \"Download unavailable\");'
assert a in s;s=s.replace(a,'else toast(\"Sharing files is not available here\");',1);${W}"

run_case "the apology text returns anywhere at all" \
  "still reports that sharing is unavailable" \
  "${P}s=s.replace('function watchUrl(f){','function spare(){ toast(\"Sharing files is not available here\"); }\nfunction watchUrl(f){',1);${W}"

run_case "a handler returns with no button to reach it" \
  "cardsave exists on only one side" \
  "${P}s=s.replace('  else if(act === \"cardshare\"){','  else if(act === \"cardsave\"){ cardFile(function(f){ download(f.name, f); }); }\n  else if(act === \"cardshare\"){',1);${W}"

echo "--- the header keeps its balance"

# 2.7.5 checked the flankers against each other rather than against a floor.
# 3.0.0 replaced equality with the owner's rule — the ring comes in strictly
# UNDER the bat, no tolerance — and measures the glyph rather than its CSS box,
# so both of these were re-anchored: the old ones named a message that no longer
# exists and were pinned to r="20" stroke-width="4", which is why they reported
# SETUP BROKE rather than passing over a rule that had changed underneath them.
run_case "the bat shrinks back under the ring" \
  "the readout is as wide as the mark or wider" \
  "${P}s=s.replace('.mark svg{display:block;width:44px;','.mark svg{display:block;width:32px;',1);${W}"

run_case "the ring grows away from the bat instead" \
  "the readout is as wide as the mark or wider" \
  "${P}a='id=\"ringArc\" cx=\"23\" cy=\"23\" r=\"17.5\" fill=\"none\" stroke-width=\"3\"';assert a in s
s=s.replace(a,'id=\"ringArc\" cx=\"23\" cy=\"23\" r=\"17.5\" fill=\"none\" stroke-width=\"12\"',1);${W}"

# Equality is exactly what the owner's rule is not, and the first draft of 3.0.0
# proposed r=18 — 40px drawn against a 39.81px bat, inside any sane tolerance
# and over the mark. A rule with a direction in it has to reject this.
run_case "the ring is brought back level with the bat" \
  "the readout is as wide as the mark or wider" \
  "${P}s=s.replace('r=\"17.5\" fill=\"none\" stroke-width=\"3\"','r=\"18\" fill=\"none\" stroke-width=\"4\"');${W}"

# The other direction is silent rather than ugly: a ring far under the bat still
# satisfies the rule and leaves the right-hand flank held up by nothing but the
# percentage printed inside it.
run_case "the ring shrinks until it is not a flanker any more" \
  "so far under that the" \
  "${P}s=s.replace('r=\"17.5\" fill=\"none\" stroke-width=\"3\"','r=\"8\" fill=\"none\" stroke-width=\"2\"');${W}"

# And the measurement itself: pathBox() reads M/L/C/Z, and a glyph redrawn with
# arcs or quadratics would go unmeasured, which is the failure mode of every
# header release before this one.
run_case "the bat is redrawn with a command the guard cannot measure" \
  "extend pathBox() rather than letting the" \
  "${P}import re;m=re.search(r'(<button class=\"mark\"[\\s\\S]*?</button>)',s);assert m
b=m.group(1);nb=b.replace(' d=\"M',' d=\"A0 0 0 0 0 0 0M',1);s=s[:m.start(1)]+nb+s[m.end(1):];${W}"

run_case "the bat overflows its own column" \
  "it overflows its own flank" \
  "${P}s=s.replace('.mark svg{display:block;width:44px;','.mark svg{display:block;width:52px;',1);${W}"

run_case "the wordmark is tidied back down" \
  "2.7.3 set it to 24 on the owner" \
  "${P}s=s.replace('text-transform:uppercase;font-size:var(--t-title);line-height:.95;','text-transform:uppercase;font-size:21px;line-height:.95;',1);${W}"

run_case "the wordmark is pushed past what a 375px phone fits" \
  "it stops fitting the" \
  "${P}s=s.replace('text-transform:uppercase;font-size:var(--t-title);line-height:.95;','text-transform:uppercase;font-size:30px;line-height:.95;',1);${W}"

echo "--- the source stays linked, and stays legible"

run_case "the link is unwrapped back to plain words" \
  "nothing links the source" \
  "${P}import re;s=re.sub(r'<a href=\"https://github.com/6ummy-Dev/Night-Watcher\"[^>]*>read the source</a>','read the source',s);${W}"

run_case "the link points at something else" \
  "nothing links the source" \
  "${P}s=s.replace('href=\"https://github.com/6ummy-Dev/Night-Watcher\" target','href=\"https://www.gnu.org/licenses/agpl-3.0.html\" target',1);${W}"

run_case "the link leaves the build line for the Home colophon" \
  "not on Progress" \
  "${P}import re;m=re.search(r' .{0,10}<a href=\"https://github.com/6ummy-Dev/Night-Watcher\"[^>]*>read the source</a>',s)
assert m;s=s.replace(m.group(0),'',1)
s=s.replace('you watch ','you watch <a href=\"https://github.com/6ummy-Dev/Night-Watcher\" target=\"_blank\" rel=\"noopener noreferrer\">read the source</a> ',1);${W}"

run_case "the underline goes and only colour is left to mark it" \
  "the source link is not underlined" \
  "${P}s=s.replace('.homefoot a,.note a{color:inherit;text-decoration:underline;','.homefoot a,.note a{color:var(--steel);',1);${W}"


echo "--- the support line holds its seat, its words and its link"

# 4.1.0 closed the standing open item: one line under the build line, one
# word, a link to the owner's Brave Creators page. Same section of guards.js
# as the source link, so the fixtures live in this suite with their kin.

run_case "the support line disappears entirely" \
  "the support line is gone" \
  "${P}import re;a=re.search(r'<span class=\"buildline\">Keep the path lit[^<]*<a [^>]*>Support</a></span>',s)
assert a;s=s.replace(a.group(0),'',1);${W}"

run_case "the words change under the link" \
  "the support line lost its words" \
  "${P}s=s.replace('Keep the path lit.','Feed the meter.',1);${W}"

run_case "the line climbs above the build line" \
  "sits above the build line" \
  "${P}import re;a=re.search(r'<span class=\"buildline\">Keep the path lit.*?</span>',s)
assert a;s=s.replace(a.group(0),'',1)
b='<span class=\"buildline\">Build '
assert b in s;s=s.replace(b,a.group(0)+b,1);${W}"

echo "--- the page's own script parses"

run_case "a quote is dropped from a concatenated string" \
  "does not parse" \
  "${P}a=\"+BUILT+'\";assert a in s;s=s.replace(a,'+BUILT+',1);${W}"

rm -rf "$NEG"
finish "2.7.3 negative tests"
