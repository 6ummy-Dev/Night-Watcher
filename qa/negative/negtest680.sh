#!/bin/bash
# negtest680 — 5.2.2, the type pass. Section 17 grew from "one hero size" to
# "type has one source": no style attribute in rendered markup may carry a
# face, a size, a tracking or a line-height. The queue's 11px sub-label was
# the last inline holdout (classed to .qsub in 5.2.2; a block of its own
# since 6.0.2, which took the word space with it), so one fixture
# brings exactly that holdout back and the other plants inline type on a
# surface the old hero-only clause never watched — proving the scan reads
# the whole family, not one selector.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 17: type has one source"

run_case "the queue sub goes back inline" \
  "carry inline type" \
  "${P}a='<span class=\"qsub\">';assert a in s;s=s.replace(a,'<span style=\"font-size:11px\">',1);${W}" \
  guards "" 17

run_case "a kicker grows inline tracking" \
  "carry inline type" \
  "${P}a='<p class=\"ikick\">An unofficial fan guide</p>';assert a in s;s=s.replace(a,'<p class=\"ikick\" style=\"letter-spacing:.3em\">An unofficial fan guide</p>',1);${W}" \
  guards "" 17

rm -rf "$NEG"
finish "negtest680 (5.2.2 — type has one source)"
