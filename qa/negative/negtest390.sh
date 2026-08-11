#!/bin/bash
# negtest390 — the bless flow itself. 3.7.2, H-1 and H-2 of the 10 Aug review.
#
# Bless was the least-guarded code in the repo with write access to the most
# protected state, and the only writer with no negative coverage at all. Two
# reproduced defects: `--bless` silently laundered frozen-ID removals (the
# suite's #1 stated invariant, voided by the tool that maintains it), and the
# five bless writers each rewrote index.html from the string read at startup,
# so one run could print "rewrote" twice, exit 0, and leave the tree red.
#
# These fixtures run `guards.js --bless` via NEG_ARGS — set on its own line so
# the column-anchored fixture counter in guards.js still sees every case. The
# green_case fixtures lean on 3.7.2's other bless change: a clean bless re-runs
# the whole check pass against the tree it wrote and exits red if that tree is
# red, so "bless leaves the tree green" is exactly the exit code.

. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

NEG_ARGS="--bless"

# H-1: deleting a frozen entry and blessing must REFUSE, not launder. The old
# bless rewrote frozen-ids.json unconditionally, so the removal left no record
# and no later run could ever demand one.
run_case "bless refuses to launder a frozen-id removal" \
  "bless refuses to launder a retirement" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
needle='{i:\"joker-2019\"'
a=s.index(needle)
b=s.index('\n', a)
assert s[a:b].endswith('},'), 'the joker-2019 line no longer ends the way this mutation assumes'
io.open(p,'w',encoding='utf-8').write(s[:a]+s[b+1:])
"

# H-2, variant (a): corrupt TWO blessed regions — ItemList and FAQPage — and
# one bless run must fix both and exit green. Under the stale-string bug the
# second write reverted the first, bless printed 'rewrote' twice and exited 0
# over a red tree; with the self-recheck, that state exits red and this
# fixture catches any regression.
green_case "one bless run heals two corrupted JSON-LD regions" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
a=s.index('<script type=\"application/ld+json\">')
b=s.index('</script>', a)
seg=s[a:b]
assert '\"@type\":\"ItemList\"' in seg and '\"@type\":\"FAQPage\"' in seg
s2=seg.replace('\"@type\":\"ItemList\",\"name\":\"', '\"@type\":\"ItemList\",\"name\":\"BROKEN ', 1)
s2=s2.replace('\"@type\":\"FAQPage\",\"mainEntity\":[{\"@type\":\"Question\",\"name\":\"', '\"@type\":\"FAQPage\",\"mainEntity\":[{\"@type\":\"Question\",\"name\":\"BROKEN ', 1)
assert s2 != seg and s2.count('BROKEN ') == 2
io.open(p,'w',encoding='utf-8').write(s[:a]+s2+s[b:])
"

# H-2, variant (b): a DATA edit dirties the script hash, the seed and the
# ItemList together. Under the stale-string bug the seed write carried the old
# declared hash back onto disk, so guards failed with 'Fix with: npm run
# bless' immediately after bless had run. One run must now leave green.
green_case "a data edit blesses to green in a single run" \
"
import io
p='docs/index.html'
s=io.open(p,encoding='utf-8').read()
needle='t:\"Merry Little Batman\"'
assert s.count(needle) == 1
io.open(p,'w',encoding='utf-8').write(s.replace(needle, 't:\"Merry Little Batman Redux\"'))
"

unset NEG_ARGS

rm -rf "$NEG"
finish "negtest390"
