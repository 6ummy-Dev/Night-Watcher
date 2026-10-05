#!/bin/bash
# negtest800 — 6.6.4. Each issue carries Previous and Next by issue number
# (174). No. 0 is next-only, to No. 1. No. 1 is prev-only, to No. 0. The
# arrow is the inline SVG.
# 6.6.9: an issue's foot is two rows. Share this issue, then Copy link and
# Post on X, hidden until there is no share sheet. Then RSS, Back to
# Nocturne and The morgue. A neighbor link in that second row still fails.
# The front stays RSS.
# The front page has no issue nav. Print hides the row. The fixture's No. 2
# gives No. 1 a neighbor on each side, so one page carries both (6.6.5).
# 6.6.8: the front's questions are off the page, so the anchor that grows
# an issue nav is the morgue section joining the footer.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"

echo "--- 174: previous and next, by issue number"

run_case "No. 0 loses Next" \
  "No. 0 page is next-only to No. 1" \
  "${N}a='add(next, \"next\");';assert s.count(a)==1;s=s.replace(a,'if(false) add(next, \"next\");',1);${W}" \
  guards "" 174

run_case "No. 1 loses Previous" \
  "No. 1 page is prev-only to No. 0" \
  "${N}a='add(prev, \"prev\");';assert s.count(a)==1;s=s.replace(a,'if(false) add(prev, \"prev\");',1);${W}" \
  guards "" 174

run_case "a neighbor link joins the footer row" \
  "the issue footer .acts row gained a neighbor link" \
  "${N}a='<a class=\"btn ghost\" href=\"/nocturne/\">The morgue</a>';assert s.count(a)==1;s=s.replace(a,'<a class=\"btn ghost\" rel=\"next\" href=\"/nocturne/x/\">Next</a><a class=\"btn ghost\" href=\"/nocturne/\">The morgue</a>',1);${W}" \
  guards "" 174

run_case "Previous is drawn with a unicode arrow" \
  "the issue nav draws a unicode arrow" \
  "${N}a='var arrow = rel === \"prev\" ? ARROW_BACK : ARROW_IN;';assert s.count(a)==1;s=s.replace(a,'var arrow = rel === \"prev\" ? \"\\u2197\" : ARROW_IN;',1);${W}" \
  guards "" 174

run_case "the front page grows an issue nav" \
  "the front page carries an issue nav" \
  "${N}a=\"return out + '</section>\\\\n' + footer(\\\"\\\")\";assert s.count(a)==1;s=s.replace(a,\"return out + '</section>\\\\n' + '<nav class=\\\\\\\"issue-nav\\\\\\\" aria-label=\\\\\\\"Issues\\\\\\\"></nav>\\\\n' + footer(\\\"\\\")\",1);${W}" \
  guards "" 174

run_case "print shows the issue nav" \
  "print no longer hides the issue nav" \
  "${N}a='.acts{display:none;}.issue-nav{display:none;}';assert s.count(a)==1;s=s.replace(a,'.acts{display:none;}',1);${W}" \
  guards "" 174

run_case "the middle issue loses Next" \
  "middle issue does not carry both previous and next" \
  "${N}a='add(next, \"next\");';assert s.count(a)==1;s=s.replace(a,'if(!prev) add(next, \"next\");',1);${W}" \
  guards "" 174

finish "negtest800"
