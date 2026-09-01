#!/bin/bash
# negtest530 — 4.4.0, the deco pass. The cut became rank, everyone else went
# square, and every claim of section 148 gets undone here once.
#
# Fixtures 1–4: the cut sites — a radius creeping back into the family, the
# CTA and the lead losing their polygons, the hero action row rounding again
# (which also breaks §119's pairing, checked on its own line). Fixtures 5–8:
# the here-group — overlays gone, the diagonal hairline flattened, groupBlock
# not marking, viewWatch not computing the id. Fixtures 9–11: the ribbing —
# a fill back to a solid wash, a track off --card2, an inline background
# re-implementing the formula. Fixtures 12–14: the chevrons — the triangle
# returning, the states no longer turning, the stepped underline dropped.
# Fixtures 15–17: the diamond tick — unrotated, check flat, halo under the
# 44px arithmetic. Fixture 18: §103's grown signature called the old way.
# Fixtures 19–20 drive the render path through smoke, because a class a
# builder drops is invisible to every static pin in guards. Fixtures 21–23:
# the footer diamond — the rule pair dropped, the stacked-note exception
# returning, and a footer taking back a private top margin (the 4.4.1
# one-clearance rule).
# 5.2.0 redrew the ornaments as geometry (no shipped face ever carried the
# glyphs), so the anchors here hold the drawn constructions, and the added
# fixtures undo each drawn claim once: the caret pair losing its borders,
# the skip bar leaving the family, the dsep and drule diamonds losing their
# rules, and the closing note splitting back into two blocks.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 148: the square family and the cut sites"

run_case "a corner creeps back into the family" \
  "declares border-radius:100px" \
  "${P}a='border:1px solid var(--line2);border-radius:0;color:var(--dust);min-height:44px;';assert a in s
s=s.replace(a,'border:1px solid var(--line2);border-radius:100px;color:var(--dust);min-height:44px;',1);${W}" \
  guards "" 148

run_case "the CTA loses the cut" \
  "the CTA lost the cut" \
  "${P}a='color:var(--ink);clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);}';assert a in s
s=s.replace(a,'color:var(--ink);}',1);${W}" \
  guards "" 148

run_case "the lead pick loses the cut" \
  "the lead pick lost the cut" \
  "${P}a='border-color:var(--signal);clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%,0 12px);}';assert a in s
s=s.replace(a,'border-color:var(--signal);}',1);${W}" \
  guards "" 148

run_case "the hero action row rounds again and the pairing sees it" \
  "and Skip declares" \
  "${P}a='.herorow .lnk{font-size:9px;letter-spacing:.04em;padding:10px 10px;flex:1;justify-content:center;min-height:46px;border-radius:0;}';assert a in s
s=s.replace(a,'.herorow .lnk{font-size:9px;letter-spacing:.04em;padding:10px 10px;flex:1;justify-content:center;min-height:46px;border-radius:11px;}',1);${W}" \
  guards "" 119

echo "--- 148: the here-group"

run_case "the corner overlays are dropped" \
  "the here-group overlays are gone or reshaped" \
  "${P}a='.group.here::before,.group.here::after{content:\"\";position:absolute;width:13px;height:13px;z-index:3;pointer-events:none;}';assert a in s
s=s.replace(a,'',1);${W}" \
  guards "" 148

run_case "the diagonal hairline flattens to a bare triangle" \
  "diagonal hairline left the gradient" \
  "${P}a='var(--line) calc(50% - .5px) calc(50% + .5px)';assert s.count(a)==2
s=s.replace(a,'var(--ink) calc(50% - .5px) calc(50% + .5px)');${W}" \
  guards "" 148

run_case "groupBlock stops marking the here-group" \
  "groupBlock() no longer marks the here-group" \
  "${P}a='(here?\" here\":\"\")';assert a in s
s=s.replace(a,'String()',1);${W}" \
  guards "" 148

run_case "viewWatch stops computing the here id" \
  "stopped computing the here id" \
  "${P}a='var nid = (upNext() || {}).id;';assert a in s
s=s.replace(a,'var nid = null;',1);${W}" \
  guards "" 148

echo "--- 148: one ribbing formula"

run_case "a fill goes back to a solid wash" \
  "the ribbing formula appears 3 times" \
  "${P}a='.ubar i{display:block;height:100%;color:var(--signal);background:repeating-linear-gradient(90deg,currentColor 0 2px,transparent 2px 5px);}';assert a in s
s=s.replace(a,'.ubar i{display:block;height:100%;background:var(--signal);}',1);${W}" \
  guards "" 148

run_case "a track leaves the sunken card" \
  "lost its --card2 track" \
  "${P}a='.gbar{height:5px;border-radius:0;background:var(--card2);';assert a in s
s=s.replace(a,'.gbar{height:5px;border-radius:0;background:var(--line2);',1);${W}" \
  guards "" 148

run_case "a tier fill re-implements the formula inline" \
  "tier fills stopped carrying colour tokens" \
  "${P}a=r\"'%;color:var(--dust)\";assert a in s
s=s.replace(a,r\"'%;background:var(--dust)\",1);${W}" \
  guards "" 148

echo "--- 148: the chevrons, the underline"

run_case "the triangle caret returns" \
  "the triangle caret is back" \
  "${P}a='<span class=\"caret\" aria-hidden=\"true\"></span></button></h2>';assert s.count(a)==2
s=s.replace(a,r'<span class=\"caret\" aria-hidden=\"true\">\u25B6</span></button></h2>',1);${W}" \
  guards "" 148

run_case "the shut state stops turning" \
  "chevron states stopped turning" \
  "${P}a='.allbtn.shut .caret{transform:none;}';assert a in s
s=s.replace(a,'',1);${W}" \
  guards "" 148

run_case "the caret pair loses its borders" \
  "the caret stopped being drawn" \
  "${P}a='.caret::before,.caret::after{content:\"\";width:6px;height:6px;border-top:2px solid currentColor;border-right:2px solid currentColor;transform:rotate(45deg);flex:none;}';assert a in s
s=s.replace(a,'.caret::before,.caret::after{content:\"\";width:6px;height:6px;transform:rotate(45deg);flex:none;}',1);${W}" \
  guards "" 148

run_case "the tab title loses its architecture" \
  "lost its stepped underline" \
  "${P}a='34px 3px no-repeat';assert a in s
s=s.replace(a,'34px 2px no-repeat',1);${W}" \
  guards "" 148

echo "--- 148: the diamond tick arithmetic"

run_case "the tick unrotates" \
  "the tick is not the diamond" \
  "${P}a='position:relative;transform:rotate(45deg) scale(.78);}';assert a in s
s=s.replace(a,'position:relative;}',1);${W}" \
  guards "" 148

run_case "the check lies on its side" \
  "check stopped being drawn" \
  "${P}a='.tick::after{content:\"\";width:13px;height:7px;border-left:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-90deg) translate(-1px,-1px);}';assert a in s
s=s.replace(a,'.tick::after{content:\"\";width:13px;height:7px;border-left:2px solid currentColor;border-bottom:2px solid currentColor;}',1);${W}" \
  guards "" 148

run_case "the skip mark leaves the family" \
  "the skip mark left the family" \
  "${P}a='.film.skip .tick::after{width:12px;height:2px;border:0;background:currentColor;transform:rotate(-45deg);}';assert a in s
s=s.replace(a,'.film.skip .tick::after{content:\"\\\\2013\";}',1);${W}" \
  guards "" 148

run_case "the halo drops under the thumb floor" \
  "halo no longer buys the scale back" \
  "${P}a='.tick::before{content:\"\";position:absolute;top:-14px;left:-14px;right:-14px;bottom:-14px;}';assert a in s
s=s.replace(a,'.tick::before{content:\"\";position:absolute;top:-10px;left:-10px;right:-10px;bottom:-10px;}',1);${W}" \
  guards "" 148

echo "--- 148: every tab closes on the diamond"

run_case "the footers go back to the bare line" \
  "the footer diamond rule is gone or reshaped" \
  "${P}a='.homefoot::before,.note.foot::before,.legend::before{';assert a in s
s=s.replace(a,'.homefootx::before,.note.footx::before,.legendx::before{',1);${W}" \
  guards "" 148

run_case "a footer takes back a private top margin" \
  "a footer rule declares its own top margin again" \
  "${P}a='.homefoot{color:var(--dim);margin-bottom:4px;}';assert a in s
s=s.replace(a,'.homefoot{color:var(--dim);margin:30px 0 4px;}',1);${W}" \
  guards "" 148

run_case "the stacked-note exception sneaks back" \
  "the stacked-note exception rules are back" \
  "${P}a='.homefoot,.note.foot{font-family:var(--mono);font-size:9px;';assert a in s
s=s.replace(a,'.note.foot+.note.foot{margin-top:16px;}\n.homefoot,.note.foot{font-family:var(--mono);font-size:9px;',1);${W}" \
  guards "" 148

run_case "the closing note splits back into two" \
  "closing note split apart again" \
  "${P}a='rather than trusting a stored answer. Announced dates can move.</p>';assert a in s
s=s.replace(a,'rather than trusting a stored answer.</p><p class=\"note foot\">Announced dates can move.</p>',1);${W}" \
  guards "" 148

run_case "the dates truth gets set apart on a span again" \
  "closing note split apart again" \
  "${P}a='rather than trusting a stored answer. Announced dates can move.</p>';assert a in s
s=s.replace(a,'rather than trusting a stored answer. <span class=\"buildline\">Announced dates can move.</span></p>',1);${W}" \
  guards "" 148

run_case "the dsep stops being drawn" \
  "the dsep stopped being drawn" \
  "${P}a='.hero .dsep{display:inline-block;width:.45em;height:.45em;background:var(--signal);transform:rotate(45deg);vertical-align:.02em;}';assert a in s
s=s.replace(a,'.hero .dsep{display:inline-block;width:.45em;height:.45em;background:var(--signal);vertical-align:.02em;}',1);${W}" \
  guards "" 146

run_case "the drule diamond loses its token" \
  "the drule diamond lost its token" \
  "${P}a='.drule i{width:var(--dia);height:var(--dia);background:currentColor;transform:rotate(45deg);flex:none;}';assert a in s
s=s.replace(a,'.drule i{width:8px;height:8px;background:currentColor;transform:rotate(45deg);flex:none;}',1);${W}" \
  guards "" 146

echo "--- 103: the grown signature, called the old way"

run_case "viewWatch composes without the here id" \
  "viewWatch() no longer composes from groupBlock()" \
  "${P}a='var gb = groupBlock(g, q, nid);';assert a in s
s=s.replace(a,'var gb = groupBlock(g, q);',1);${W}" \
  guards "" 103

echo "--- smoke: the here mark is a render claim"

run_case "a render that marks nothing is caught in the DOM" \
  "exactly one group wears the here mark" \
  "${P}a='(here?\" here\":\"\")';assert a in s
s=s.replace(a,'String()',1);${W}" \
  smoke main

run_case "the group toggle drops the mark it was holding" \
  "byte-identical to a full render" \
  "${P}a=' + (grp.classList.contains(\"here\") ? \" here\" : \"\");';assert a in s
s=s.replace(a,';',1);${W}" \
  smoke main

finish "4.4.0 deco-pass fixtures"
