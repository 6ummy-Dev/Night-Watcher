#!/bin/bash
# negtest600 — 4.8.0, "The third pouch". One section, one smoke phase.
#
# Section 152 (new): the tier is an include axis. It is declared wide, written
# and read back through a whitelist that defaults wide, tested by visible()
# through onRoute() and by onRoute() through tierOf(); the three pools nest
# and the Core route keeps its Essentials. The pouch offers Essentials / Core
# route / + Optional, the format row ends in Animated + live, no pouch button
# says All, the first-run chooser asks the same third question, the buttons
# have a handler and a toast. The buckle names only the narrowings, in pouch
# order, and reads Every Batman when nothing is narrowed; its label reads all
# three in full. The stair has a third step with its own closing travel and
# stagger; the chooser's rows cannot wrap. Downstream, "every Batman there
# is" lives once and is gated on all three axes, Home's tiles follow the
# belt, the Optional chip explains a narrowed belt, all seven chips stay, and
# the share card carries the route. Each claim is broken once here.
#
# Smoke (main): the drives that read the running page — a handler that sets
# the tier and forgets to persist it, and a Core-route pool that lets an
# Optional entry through — are the two the static section cannot see.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 152: the tier is an include axis, and the belt says what it holds"

run_case "the tier starts narrow" \
  "does not start the tier wide" \
  "${P}a='format:\"all\", tier:\"all\", path:\"\"';assert a in s;s=s.replace(a,'format:\"all\", tier:\"core\", path:\"\"');${W}" \
  guards "" 152

run_case "persistNow() forgets the tier" \
  "does not write the tier" \
  "${P}a='  {k:\"tier\",      s:1, read:oneOf([\"ess\", \"core\", \"all\"], \"all\")},\n';assert a in s;s=s.replace(a,'');${W}" \
  guards "" 152

run_case "restore() defaults an old save to the Core route" \
  "does not read the tier through the whitelist" \
  "${P}a='read:oneOf([\"ess\", \"core\", \"all\"], \"all\")';assert a in s;s=s.replace(a,'read:oneOf([\"ess\", \"core\", \"all\"], \"core\")');${W}" \
  guards "" 152

run_case "restore() takes any tier it is handed" \
  "does not read the tier through the whitelist" \
  "${P}a='read:oneOf([\"ess\", \"core\", \"all\"], \"all\")';assert a in s;s=s.replace(a,'read:function(v){ return v || \"all\"; }');${W}" \
  guards "" 152

run_case "visible() stops asking onRoute()" \
  "does not consult onRoute()" \
  "${P}a='(S.scope === \"all\" || !f.tv) && onRoute(f);';assert a in s;s=s.replace(a,'(S.scope === \"all\" || !f.tv);');${W}" \
  guards "" 152

run_case "onRoute() reads the raw optional flag" \
  "reads the raw flags instead of tierOf()" \
  "${P}a='(S.tier === \"core\" ? tierOf(f) !== \"o\" : tierOf(f) === \"e\")';assert a in s;s=s.replace(a,'(S.tier === \"core\" ? !f.o : f.b.indexOf(\"e\") >= 0)');${W}" \
  guards "" 152

run_case "the Core route lets Optional through" \
  "Core route pool carries an Optional entry" \
  "${P}a='(S.tier === \"core\" ? tierOf(f) !== \"o\" : tierOf(f) === \"e\")';assert a in s;s=s.replace(a,'(S.tier === \"core\" ? tierOf(f) !== \"x\" : tierOf(f) === \"e\")');${W}" \
  guards "" 152

run_case "the Core route drops its Essentials" \
  "Core route pool carries no Essential" \
  "${P}a='(S.tier === \"core\" ? tierOf(f) !== \"o\" : tierOf(f) === \"e\")';assert a in s;s=s.replace(a,'(S.tier === \"core\" ? tierOf(f) === \"k\" : tierOf(f) === \"e\")');${W}" \
  guards "" 152

run_case "Essentials means the Core route" \
  "Essentials pool carries a non-essential" \
  "${P}a='(S.tier === \"core\" ? tierOf(f) !== \"o\" : tierOf(f) === \"e\")';assert a in s;s=s.replace(a,'(S.tier === \"core\" ? tierOf(f) !== \"o\" : tierOf(f) !== \"o\")');${W}" \
  guards "" 152

run_case "the tier pouch loses its Essentials button" \
  "offers no \"ess\" button" \
  "${P}a='[[\"ess\",\"Essentials\"],[\"core\",\"Core route\"],[\"all\",\"+ Optional\"]]';assert a in s;s=s.replace(a,'[[\"core\",\"Core route\"],[\"all\",\"+ Optional\"]]');${W}" \
  guards "" 152

run_case "the middle button reads Core instead of Core route" \
  "button does not read \"Core route\"" \
  "${P}a='[\"core\",\"Core route\"],[\"all\",\"+ Optional\"]';assert a in s;s=s.replace(a,'[\"core\",\"Core\"],[\"all\",\"+ Optional\"]');${W}" \
  guards "" 152

run_case "the wide tier button says All" \
  "a pouch button says All or Everything" \
  "${P}a='[\"all\",\"+ Optional\"]';assert a in s;s=s.replace(a,'[\"all\",\"All\"]');${W}" \
  guards "" 152

run_case "the wide tier button says Everything" \
  "a pouch button says All or Everything" \
  "${P}a='[\"all\",\"+ Optional\"]';assert a in s;s=s.replace(a,'[\"all\",\"Everything\"]');${W}" \
  guards "" 152

run_case "the format row's wide button goes back to All" \
  "does not read \"Animated + live\"" \
  "${P}a='[\"all\",\"Animated + live\"]';assert a in s;s=s.replace(a,'[\"all\",\"All\"]');${W}" \
  guards "" 152

run_case "the pouches drop out of order" \
  "does not drop the three pouches in order" \
  "${P}a=\"formatSwitch()+scopeSwitch()+tierSwitch()+'</div>';\";assert a in s;s=s.replace(a,\"formatSwitch()+tierSwitch()+scopeSwitch()+'</div>';\");${W}" \
  guards "" 152

run_case "the first-run chooser stops asking the tier" \
  "first-run chooser does not ask the tier" \
  "${P}a=\"'<p class=\\\"pathkick\\\">What are you watching</p>'+formatSwitch()+scopeSwitch()+tierSwitch()+\";assert a in s;s=s.replace(a,\"'<p class=\\\"pathkick\\\">What are you watching</p>'+formatSwitch()+scopeSwitch()+\");${W}" \
  guards "" 152

run_case "the tier buttons lose their handler" \
  "no handler that sets S.tier" \
  "${P}a='S.tier = b.dataset.tier; S.groupOpen = {}; persist(); render();';assert a in s;s=s.replace(a,'S.groupOpen = {}; render();');${W}" \
  guards "" 152

run_case "the tier change stops toasting" \
  "the tier change does not toast" \
  "${P}a='\"Optional added\"';assert a in s;s=s.replace(a,'\"\"');${W}" \
  guards "" 152

run_case "the buckle says Everything when nothing is narrowed" \
  "gets the app's own two words" \
  "${P}a='return out.length ? out : [\"Every Batman\"];';assert a in s;s=s.replace(a,'return out.length ? out : [\"Everything\"];');${W}" \
  guards "" 152

run_case "the buckle lists a wide pouch" \
  "gets the app's own two words" \
  "${P}a='if(S.format !== \"all\") out.push(S.format === \"anim\" ? \"Animated\" : \"Live action\");';assert a in s;s=s.replace(a,'out.push(S.format === \"anim\" ? \"Animated\" : S.format === \"live\" ? \"Live action\" : \"Animated + live\");');${W}" \
  guards "" 152

run_case "the buckle lists the pouches out of order" \
  "one line per pouch, in pouch order" \
  "${P}a='if(S.scope !== \"all\") out.push(\"Movies\");';assert a in s;s=s.replace(a,'');b='return out.length ? out : [\"Every Batman\"];';assert b in s;s=s.replace(b,'if(S.scope !== \"all\") out.push(\"Movies\");\\n  '+b);${W}" \
  guards "" 152

run_case "the buckle runs its lines together" \
  "one bst line over bs2 lines" \
  "${P}a=\"lines.slice(1).map(function(l){ return '<span class=\\\"bs2\\\">'+esc(l)+'</span>'; }).join(\\\"\\\")+\";assert a in s;s=s.replace(a,\"'<span class=\\\"bs2\\\">'+esc(lines.slice(1).join(' / '))+'</span>'+\");${W}" \
  guards "" 152

run_case "the buckle's label forgets the tier" \
  "does not read all three answers in full" \
  "${P}a=\"', '+esc(scp)+', '+esc(tier)+'. Tap to change.\";assert a in s;s=s.replace(a,\"', '+esc(scp)+'. Tap to change.\");${W}" \
  guards "" 152

run_case "the third pouch sits on the second step" \
  "not the third step of the stair" \
  "${P}a='.includes .scope.tier{z-index:0;margin:-5px 22px 0;}';assert a in s;s=s.replace(a,'.includes .scope.tier{z-index:0;margin:-5px 11px 0;}');${W}" \
  guards "" 152

run_case "the third pouch closes on the second pouch's travel" \
  "no closing travel of its own" \
  "${P}a='.includes.closing .scope.tier{--out:-305%;}';assert a in s;s=s.replace(a,'');${W}" \
  guards "" 152

run_case "the middle pouch loses its stagger" \
  "middle pouch has no delay of its own" \
  "${P}a='.includes.opening .scope:nth-of-type(2){animation-delay:.05s;}';assert a in s;s=s.replace(a,'');${W}" \
  guards "" 152

run_case "the chooser's rows can wrap again" \
  "switch labels can wrap" \
  "${P}a='text-transform:uppercase;white-space:nowrap;color:var(--dust);';assert a in s;s=s.replace(a,'text-transform:uppercase;color:var(--dust);');${W}" \
  guards "" 152

run_case "everyBatman() forgets the tier" \
  "does not test all three axes" \
  "${P}a='return S.format === \"all\" && S.scope === \"all\" && S.tier === \"all\";';assert a in s;s=s.replace(a,'return S.format === \"all\" && S.scope === \"all\";');${W}" \
  guards "" 152

run_case "\"every Batman there is\" is said a second time" \
  "appears 2 time(s)" \
  "${P}a=\"' logged \\\\u2014 '+allLoggedWord()+'. Go back\";assert a in s;s=s.replace(a,\"' logged \\\\u2014 every Batman there is. Go back\");${W}" \
  guards "" 152

run_case "Home's Optional tile ignores the belt" \
  "Home's tier tiles ignore the belt" \
  "${P}a='(S.tier !== \"all\" ? \"\" :';assert a in s;s=s.replace(a,'(false ? \"\" :');${W}" \
  guards "" 152

run_case "the Optional chip goes back to Nothing in this filter yet" \
  "Optional chip has no empty state for a narrowed belt" \
  "${P}a='S.filter === \"opt\" && S.tier !== \"all\"';assert s.count(a)==2;s=s.replace(a,'false');${W}" \
  guards "" 152

run_case "the Optional chip leaves The path" \
  "chip left The path" \
  "${P}a='[\"core\",\"Core route\"],[\"opt\",\"Optional\"],';assert a in s;s=s.replace(a,'[\"core\",\"Core route\"],');${W}" \
  guards "" 152

run_case "the share card drops the route" \
  "share card does not carry the route" \
  "${P}a='(S.tier === \"all\" ? \"\" : S.tier === \"core\" ? \" \\\\u00b7 CORE ROUTE\" : \" \\\\u00b7 ESSENTIALS\") +';assert a in s;s=s.replace(a,'');${W}" \
  guards "" 152

echo "--- smoke: the drives read the page the static section cannot"

run_case "the tier handler forgets to persist" \
  "the tier is persisted" \
  "${P}a='S.tier = b.dataset.tier; S.groupOpen = {}; persist(); render();';assert a in s;s=s.replace(a,'S.tier = b.dataset.tier; S.groupOpen = {}; render();');${W}" \
  smoke "main"

run_case "the Core route lets one Optional entry through" \
  "nothing on the Core route is Optional" \
  "${P}a='return S.tier === \"all\" || (S.tier === \"core\" ? tierOf(f) !== \"o\" : tierOf(f) === \"e\");';assert a in s;s=s.replace(a,'return S.tier === \"all\" || (S.tier === \"core\" ? (tierOf(f) !== \"o\" || f.id === \"batwheels-season-1-2022\") : tierOf(f) === \"e\");');${W}" \
  smoke "main"

run_case "a Core-route save reboots wide" \
  "a Core-route save reboots on the Core route" \
  "${P}a='read:oneOf([\"ess\", \"core\", \"all\"], \"all\")';assert a in s;s=s.replace(a,'read:function(){ return \"all\"; }');${W}" \
  smoke "main"

rm -rf "$NEG"
finish "negtest600"
