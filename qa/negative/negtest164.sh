#!/bin/bash
# Negative-test every guard added or changed in 1.6.4.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 62: every tab clears the viewport (3.9.7: the block owns the scroll now)"
# 1.6.4 pinned min-height:calc(100svh + 1px). 3.9.7 locked the document and
# made #app the scroller, so the same block asserts the lock instead. These
# two fixtures moved with it — same block, same job, new failure text; the
# rest of the lock is negtest460's.
run_case "the app grows a min-height again" \
  "#app carries a min-height again" \
  "${P}a='height:100svh;height:100dvh;';assert a in s;s=s.replace(a,'min-height:calc(100svh + 1px);');${W}"

run_case "the height lock loses its lock" \
  "is not height-locked to the viewport" \
  "${P}a='height:100svh;height:100dvh;';assert a in s;s=s.replace(a,'height:100dvh;');${W}"

echo "--- 64: one filter, every reader"
run_case "subOf stops skipping a sub that is only the year" \
  "subOf() no longer skips a sub that is only the year" \
  "${P}a='return (f.sub && f.sub !== String(f.y)) ? f.sub : \"\";';assert a in s;s=s.replace(a,'return f.sub || \"\";');${W}"

run_case "the queue goes back to reading .sub directly" \
  "reads .sub directly instead of subOf()" \
  "${P}a='(subOf(x) ? \\' <span style=\\\"color:var(--dim);font-size:11px\\\">\\'+esc(subOf(x))';assert a in s;s=s.replace(a,'(x.sub ? \\' <span style=\\\"color:var(--dim);font-size:11px\\\">\\'+esc(x.sub)');${W}"

echo "--- smoke: no CSS rule is left behind"
run_case "a rule outlives the markup it styled" \
  "every CSS rule matches something in some state" \
  "${P}a='.arow .at{';assert a in s;s=s.replace(a,'.arow .ghostrule{color:red;}\n.arow .at{');${W}" \
  "smoke" "css"

rm -rf "$NEG"
finish "1.6.4 negative tests"
