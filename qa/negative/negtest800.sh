#!/bin/bash
# negtest800 — 6.7.0. Each issue's foot is Share, then the Back page index,
# then Keep reading (174). No. 0's next names No. 1, and its previous card
# says this is the first issue. No. 1's previous names No. 0, and its next
# card says Out Sunday, late. The arrow is the inline SVG.
# A neighbor link in the index still fails. The front stays the Nocturne
# index. Print hides .acts. The fixture's No. 2 gives No. 1 a neighbor on
# each side, so one page carries both (6.6.5).
# 6.7.2. Back to Nocturne's arrow points left.
# 6.8.0: the front's return line grew frontAsk() and the about link, so the
# issue-nav fixture anchors on that line.
# 6.8.1: print hides the skip link between .acts and .themerow, so the
# foot fixture anchors on that longer rule and still removes only .acts.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"

echo "--- 174: previous and next, by issue number"

run_case "No. 0 loses Next" \
  "No. 0's next does not name No. 1" \
  "${N}a='add(next, \"next\");';assert s.count(a)==1;s=s.replace(a,'if(false) add(next, \"next\");',1);${W}" \
  guards "" 174

run_case "No. 1 loses Previous" \
  "No. 1's previous does not name No. 0" \
  "${N}a='add(prev, \"prev\");';assert s.count(a)==1;s=s.replace(a,'if(false) add(prev, \"prev\");',1);${W}" \
  guards "" 174

run_case "Back to Nocturne points forward" \
  "Back to Nocturne's arrow points forward" \
  "${N}a='indexRow(\"/nocturne/\", \"Back to Nocturne\", ROW_BACK)';assert s.count(a)==1;s=s.replace(a,'indexRow(\"/nocturne/\", \"Back to Nocturne\", ROW_ON)',1);${W}" \
  guards "" 174

run_case "The morgue opens the front instead of the morgue" \
  "The morgue does not open /nocturne/#morgue" \
  "${N}a='indexRow(\"/nocturne/#morgue\", \"The morgue\", ROW_DOWN)';assert s.count(a)==1;s=s.replace(a,'indexRow(\"/nocturne/\", \"The morgue\", ROW_DOWN)',1);${W}" \
  guards "" 174

run_case "Previous is drawn with a unicode arrow" \
  "the issue nav draws a unicode arrow" \
  "${N}a='var arrow = rel === \"prev\" ? ARROW_BACK : ARROW_IN;';assert s.count(a)==1;s=s.replace(a,'var arrow = rel === \"prev\" ? \"\\u2197\" : ARROW_IN;',1);${W}" \
  guards "" 174

run_case "the front page grows an issue nav" \
  "the front page carries an issue nav" \
  "${N}a=\"return out + '</section>\\\\n' + frontAsk() + footer(\\\"\\\", aboutHref(aboutOf(list)))\";assert s.count(a)==1,a;s=s.replace(a,\"return out + '</section>\\\\n' + '<nav class=\\\\\\\"issue-nav\\\\\\\" aria-label=\\\\\\\"Issues\\\\\\\"></nav>\\\\n' + frontAsk() + footer(\\\"\\\", aboutHref(aboutOf(list)))\",1);${W}" \
  guards "" 174

run_case "print shows the foot" \
  "print no longer hides the foot" \
  "${N}a='.acts{display:none;}.skip{display:none;}.themerow{display:none;}';assert s.count(a)==1;s=s.replace(a,'.skip{display:none;}.themerow{display:none;}',1);${W}" \
  guards "" 174

run_case "the middle issue loses Next" \
  "middle issue does not carry both previous and next" \
  "${N}a='add(next, \"next\");';assert s.count(a)==1;s=s.replace(a,'if(!prev) add(next, \"next\");',1);${W}" \
  guards "" 174

finish "negtest800"
