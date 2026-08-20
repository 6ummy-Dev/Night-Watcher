#!/bin/bash
# negtest540 — 4.4.2, the reader's place has one memory. The phone lost The
# Path's position to a content-visibility clamp the DOM faithfully recorded;
# section 149 pins the JS memory that replaced it. Four fixtures, one per
# claim: the background refill reading the DOM again, the place-recorder
# losing its at-rest gate, scrollPut forgetting to write the memory, and the
# swipe arrival no longer consulting it. Each is the smallest edit that
# brings the bug back whole.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 149: the reader's place has one memory"

run_case "the background refill trusts the DOM again" \
  "fillPanel's background restore reads the DOM again" \
  "${P}a='var k = back ? nwKeep[t] : 0;';assert a in s
s=s.replace(a,'var k = back ? scrollKeep(p) : 0;',1);${W}" \
  guards "" 149

run_case "the place-recorder loses its at-rest gate" \
  "the place-recorder lost its at-rest gate" \
  "${P}a='if(S.tab === t && nwVW && Math.abs(vp.scrollLeft - i * nwVW) < 2) nwKeep[t] = p.scrollTop;';assert a in s
s=s.replace(a,'if(S.tab === t) nwKeep[t] = p.scrollTop;',1);${W}" \
  guards "" 149

run_case "a deliberate scroll bypasses the memory" \
  "scrollPut no longer writes the memory" \
  "${P}a='  if(t) nwKeep[t] = y;\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 149

run_case "the arrival stops consulting the memory" \
  "the swipe arrival stopped consulting the memory" \
  "${P}a='    nwArriveKeep = nwKeep[t];\n';assert a in s;s=s.replace(a,'',1);${W}" \
  guards "" 149

finish "4.4.2 place-memory fixtures"
