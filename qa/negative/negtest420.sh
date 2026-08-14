#!/bin/bash
# negtest420 — 3.9.3. One reorder, two shelves.
#
# Death in the Family opens at the crowbar, which is chronologically before the
# film it is built on, and it sat first for that reason. One of its three
# branches then plays out Under the Red Hood's plot in full — the Lazarus Pit,
# the resurrection, the Red Hood, the Joker — so it does not occupy an earlier
# slot, it occupies a superset of the same one. The Comic Adaptations already
# carried the rule in its WEAVES reason string: a derivative work has to follow
# its source whatever era it sits in.
#
# The fix touches TWO orderings and so does this suite. Array position drives
# by-universe; `lo` drives the life ordering; before 3.9.3 nothing tied them
# together, so either could be reverted alone with every guard green. One
# fixture per shelf.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

# --- guard 30, by universe: array position is the watch order ---

run_case "Death in the Family sliding back ahead of Under the Red Hood is caught" \
  "watch order spoils itself" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
lines=s.split('\n')
u=[i for i,l in enumerate(lines) if 'i:\"batman-under-the-red-hood-2010\"' in l]
d=[i for i,l in enumerate(lines) if 'i:\"batman-death-in-the-family-2020\"' in l]
assert len(u)==1 and len(d)==1 and u[0] < d[0]
lines[u[0]], lines[d[0]] = lines[d[0]], lines[u[0]]
io.open(p,'w',encoding='utf-8').write('\n'.join(lines))
"

# --- guard 30, by life: the same rule on the other shelf ---

run_case "the life ordering being reverted on its own is caught" \
  "the life ordering contradicts a spoiler rule" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
u='i:\"batman-under-the-red-hood-2010\",t:\"Batman: Under the Red Hood\",y:2010,e:4,lo:1,'
d='i:\"batman-death-in-the-family-2020\",t:\"Batman: Death in the Family\",y:2020,e:4,lo:2,'
assert u in s and d in s
s=s.replace(u,u.replace('lo:1,','lo:2,')).replace(d,d.replace('lo:2,','lo:1,'))
io.open(p,'w',encoding='utf-8').write(s)
"

rm -rf "$NEG"
finish "negtest420"
