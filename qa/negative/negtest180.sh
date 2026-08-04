#!/bin/bash
# Negative-test 1.8.0 — the move offer.
#
# 2.5.1 retired the offer, so this suite inverted with guard 77. It used to
# prove the banner was there and could only be trusted as far as these fixtures
# went, because it never rendered on the canonical origin. It now proves the
# opposite: that the machinery cannot come back without the build going red.
#
# The 2.2.0 §3.6 memo skip closed here rather than being lifted — it existed
# because this suite pinned the moveBanner literal, and there is no literal
# left to pin.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 77: the move offer stays retired"
run_case "moveBanner() comes back" \
  "the move offer is back" \
  "${P}a='function offCanonical(){';assert a in s
s=s.replace(a,'function moveBanner(){ return \"\"; }\nfunction offCanonical(){',1);${W}"

run_case "the dismissal flag comes back" \
  "the moveHid dismissal flag" \
  "${P}a='function offCanonical(){';assert a in s
s=s.replace(a,'var moveHid = false;\nfunction offCanonical(){',1);${W}"

run_case "the banner markup comes back" \
  "the .moved banner markup" \
  "${P}a='<main id=\"view\"';assert a in s
s=s.replace(a,'<div class=\"moved\"></div><main id=\"view\"',1);${W}"

run_case "the dismiss action comes back" \
  "the movelater action" \
  "${P}a='else if(act === \"expand\")';assert a in s
s=s.replace(a,'else if(act === \"movelater\"){ render(); }\n  else if(act === \"expand\")',1);${W}"

run_case "the link class comes back" \
  "the .movego link class" \
  "${P}a='.viewing p{';assert a in s
s=s.replace(a,'.movego{color:red;}\n.viewing p{',1);${W}"

run_case "the retired address is referenced again" \
  "the retired beta address is referenced in the app again" \
  "${P}a='var SITE = ';assert a in s
s=s.replace(a,'var OLD = \"https://6ummy-dev.github.io/Night-Watcher/\";\nvar SITE = ',1);${W}"

run_case "offCanonical() is deleted as dead code" \
  "nothing marks the still-serving mirror" \
  "${P}import re
m=re.search(r'function offCanonical\\(\\)\\{.*?\\n\\}\\n',s,re.S);assert m
s=s[:m.start()]+s[m.end():]
s=s.replace('if(offCanonical()){','if(false){',1);${W}"

echo "--- 78: the mirror still asks to be left out"
run_case "the noindex injection is removed" \
  "nothing marks an off-canonical origin as noindex" \
  "${P}import re
m=re.search(r'if\\(offCanonical\\(\\)\\)\\{.*?\\n\\}\\n',s,re.S);assert m
s=s[:m.start()]+s[m.end():];${W}"

run_case "the mirror asks to be indexed" \
  "does not say noindex" \
  "${P}a='noix.setAttribute(\"content\", \"noindex, follow\");';assert a in s
s=s.replace(a,'noix.setAttribute(\"content\", \"index, follow\");',1);${W}"

echo "--- the addresses themselves"
run_case "the canonical link is left pointing at the old home" \
  "canonical" \
  "${P}a='<link rel=\"canonical\" href=\"https://nightwatcher.life/\">';assert a in s
s=s.replace(a,'<link rel=\"canonical\" href=\"https://6ummy-dev.github.io/Night-Watcher/\">',1);${W}"

rm -rf "$NEG"
finish "1.8.0 negative tests"
