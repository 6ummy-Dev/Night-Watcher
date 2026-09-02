#!/bin/bash
# Negative-test 1.8.2 — the card descriptions and the cut-code report.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 76: a card says what it is"
run_case "the description comes off the cards" \
  "Home's cards carry no description" \
  "${P}a=\"'<span class=\\\"udesc\\\">'+esc(cardBlurb(g.note))+'</span>'+\";assert a in s
s=s.replace(a,'',1);${W}"

run_case "the description stops coming from the group note" \
  "not one derived from the group note" \
  "${P}a='esc(cardBlurb(g.note))';assert a in s;s=s.replace(a,'esc(g.name)',1);${W}"

run_case "the clamp is removed" \
  "nothing clamps the card description" \
  "${P}import re;s=re.sub(r'-webkit-line-clamp:2;line-clamp:2;','',s,count=1);${W}"

run_case "the description flexes and out-grows its own clamp" \
  "which lets a -webkit-box grow past its own clamp" \
  "${P}a='.udesc{font-size:var(--t-note);line-height:1.35;color:var(--dust);display:-webkit-box;'
assert a in s;s=s.replace(a,'.udesc{font-size:var(--t-note);line-height:1.35;color:var(--dust);flex:1;display:-webkit-box;',1);${W}"

run_case "the blurb stops being shortened" \
  "cards stop being cards" \
  "${P}a='  if(t.length > 72)';assert a in s;s=s.replace(a,'  if(false)',1);${W}"

# 5.3.1: every bag note ENDS with the suffix now (universe 35's sat mid-note
# until then), so the stripper's live case is gone and removing it alone
# proves nothing. The fixture plants a bag note whose first sentence carries
# the suffix — the shape the stripper exists for — and then removes it.
run_case "the bag suffix leaks into a card" \
  "carries the bag suffix" \
  "${P}a='.replace(/\\\\s*\\\\u2014\\\\s*no order between these.*\$/, \"\")';assert a in s
s=s.replace(a,'',1)
b='note:\"Films where Batman is a supporting player, a punchline, or a guest in someone else\\\\u2019s comedy. Included for completeness';assert b in s
s=s.replace(b,'note:\"Films where Batman is a supporting player \\\\u2014 no order between these; start anywhere. Included for completeness',1);${W}"

echo "--- 8: a cut code has to say so"
run_case "a truncated code stops being reported" \
  "without the restore saying so" \
  "${P}import re;m=re.search(r'             cut:\\([\\s\\S]*?\\),\\n',s);assert m
s=s[:m.start()]+'             cut:false,\n'+s[m.end():];${W}"

run_case "only the chunk arithmetic is left, and a clean cut slips through" \
  "without the restore saying so" \
  "${P}a='cut:(!((\"S\" in seg) && (\"R\" in seg) && (ver < 3 || (\"O\" in seg))) ||'
assert a in s;s=s.replace(a,'cut:(',1);${W}"

echo "--- smoke: what the rendered card shows"
run_case "the cards render without their descriptions" \
  "every home card carries a description" \
  "${P}a=\"'<span class=\\\"udesc\\\">'+esc(cardBlurb(g.note))+'</span>'+\";assert a in s
s=s.replace(a,'',1);${W}" \
  "smoke" "main"

rm -rf "$NEG"
finish "1.8.2 negative tests"
