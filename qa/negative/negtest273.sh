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
  "the share action has no download fallback" \
  "${P}a='else toast(download(f.name, f) ? \"Card downloaded\" : \"Download unavailable\");'
assert a in s;s=s.replace(a,'else toast(\"Sharing files is not available here\");',1);${W}"

run_case "the apology text returns anywhere at all" \
  "still reports that sharing is unavailable" \
  "${P}s=s.replace('function watchUrl(title){','function spare(){ toast(\"Sharing files is not available here\"); }\nfunction watchUrl(title){',1);${W}"

run_case "a handler returns with no button to reach it" \
  "cardsave exists on only one side" \
  "${P}s=s.replace('  else if(act === \"cardshare\"){','  else if(act === \"cardsave\"){ cardFile(function(f){ download(f.name, f); }); }\n  else if(act === \"cardshare\"){',1);${W}"

echo "--- the header keeps its balance"

run_case "the bat shrinks back under the ring" \
  "against a 46px ring" \
  "${P}s=s.replace('.mark svg{display:block;width:40px;','.mark svg{display:block;width:32px;',1);${W}"

run_case "the wordmark is tidied back down" \
  "2.7.3 set it to 24 on the owner" \
  "${P}s=s.replace('text-transform:uppercase;font-size:24px;line-height:.95;','text-transform:uppercase;font-size:21px;line-height:.95;',1);${W}"

run_case "the wordmark is pushed past what a 375px phone fits" \
  "it stops fitting the" \
  "${P}s=s.replace('text-transform:uppercase;font-size:24px;line-height:.95;','text-transform:uppercase;font-size:30px;line-height:.95;',1);${W}"

echo "--- the footer names the source"

run_case "the link is unwrapped back to plain words" \
  "the footer no longer links the source" \
  "${P}import re;s=re.sub(r'<a href=\"https://github.com/6ummy-Dev/Night-Watcher\"[^>]*>(free software under the AGPL)</a>',r'\\\\1',s);${W}"

run_case "the link points at something else" \
  "the footer no longer links the source" \
  "${P}s=s.replace('href=\"https://github.com/6ummy-Dev/Night-Watcher\" target','href=\"https://www.gnu.org/licenses/agpl-3.0.html\" target',1);${W}"

rm -rf "$NEG"
finish "2.7.3 negative tests"
