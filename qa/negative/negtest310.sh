#!/bin/bash
# Negative-test every guard added or changed in 3.1.0 for the app itself —
# section 119, which gives "Where to watch" a rank of its own and holds the
# hero pill to Skip's edges, and section 20's growth, which is the only thing
# that can see a translucent fill land a label on a colour no palette holds.
#
# The 404's bat — sections 101, 115 and 118 — is negative-tested in negtest210,
# beside the rest of the off-app assets it belongs to.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 119: where to watch has a rank of its own"
run_case "the watch link gives up its fill" \
  "the watch link has no fill of its own" \
  "${P}a='background:rgba(114,149,204,.14);';assert a in s
s=s.replace(a,'',1);${W}"

run_case "the secondary pills grow a fill too" \
  ".act has grown a fill" \
  "${P}a='.act{font-family:var(--mono);';assert a in s
s=s.replace(a,'.act{background:rgba(147,160,184,.14);font-family:var(--mono);',1);${W}"

run_case "the watch link goes back to sharing .act's edge" \
  "share an edge colour" \
  "${P}a='background:rgba(114,149,204,.14);border:1px solid var(--steel);border-radius:0';assert a in s
s=s.replace(a,'background:rgba(114,149,204,.14);border:1px solid var(--line2);border-radius:0',1);${W}"

run_case "the fill is rewritten where section 20 cannot read it" \
  "section 20 blends the two" \
  "${P}a='background:rgba(114,149,204,.14);';assert a in s
s=s.replace(a,'background:rgb(39,52,77);',1);${W}"

echo "--- 119: the hero pill and Skip"
run_case "the hero link goes back to 38px" \
  "and Skip declares 46" \
  "${P}a='min-height:46px;border-radius:0;}';assert a in s
s=s.replace(a,'min-height:38px;border-radius:0;}',1);${W}"

run_case "the hero link goes back to an 8px corner" \
  "and Skip declares 0" \
  "${P}a='min-height:46px;border-radius:0;}';assert a in s
s=s.replace(a,'min-height:46px;border-radius:8px;}',1);${W}"

run_case "the hero link is content-sized again" \
  "the hero watch link is content-sized again" \
  "${P}a='padding:10px 10px;flex:1;';assert a in s
s=s.replace(a,'padding:10px 10px;',1);${W}"

echo "--- 119: the expanded row's left edge"
run_case "the link row goes back to the right edge" \
  ".linkrow does not justify to the start" \
  "${P}a='.linkrow{display:flex;flex-wrap:wrap;justify-content:flex-start';assert a in s
s=s.replace(a,'.linkrow{display:flex;flex-wrap:wrap;justify-content:flex-end',1);${W}"

run_case "the hero override comes back" \
  "re-declares justify-content" \
  "${P}a='.herorow .linkrow{flex:0 0 38%;margin-top:0;}';assert a in s
s=s.replace(a,'.herorow .linkrow{flex:0 0 38%;justify-content:flex-start;margin-top:0;}',1);${W}"

echo "--- 20: the label pays for the fill"
# The measured trap. Tinting the fill and keeping the steel label is the
# obvious move and lands at 4.09:1 — the safe move and the strong move are the
# same move, and this is the fixture that says so.
run_case "the label goes back to steel over the new fill" \
  "the watch link's label (--steel) reads" \
  "${P}a='color:var(--bone);min-height:38px';assert a in s
s=s.replace(a,'color:var(--steel);min-height:38px',1);${W}"

finish "negtest310"
