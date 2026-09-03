#!/bin/bash
# Negative-test every guard added or changed in 1.9.5 — the ratings data and
# its badge, the Progress folds, the fresh-visitor default, the machine-
# readable curated list, the seed's H1, and the raised weight ceiling. First
# suite written against qa/negative/_lib.sh, which the other twenty-one now
# source too; every fixture here passing through the library is the library
# proving itself.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 92: a rating is certified or absent"
run_case "a released entry loses its rating" \
  "is released and carries no r:" \
  "${P}a=',r:\"PG-13\",d:\"Frank Miller';assert s.count(a)==1
s=s.replace(a,',d:\"Frank Miller',1);${W}"

# Re-aimed in 4.5.4: Part 1 released on 25 Aug and carries its R now, so the
# fixture hands the certificate to Part 2 — still unreleased, still undated.
run_case "an unreleased entry is handed a certificate early" \
  "is not out yet and carries r:" \
  "${P}a=',d:\"Bane\\\\u2019s Gotham, and what';assert s.count(a)==1
s=s.replace(a,',r:\"R\",d:\"Bane\\\\u2019s Gotham, and what',1);${W}"

run_case "a value from neither system" \
  "not a value in either system" \
  "${P}b=s.replace('r:\"PG-13\",','r:\"PG-14\",',1);assert b!=s;s=b;${W}"

run_case "a rating drifts with no source behind it" \
  "the findings doc says" \
  "${P}b=s.replace('r:\"TV-Y\",','r:\"TV-Y7\",',1);assert b!=s;s=b;${W}"

# Rewritten in 2.7.1. The badge left the detail panel's link row on purpose —
# it reads as part of the link there. It lives on the badge lines now, and the
# count is what holds the seats: three, plus the definition.
run_case "a deciding surface quietly stops naming the rating" \
  "ratingBadge() is called" \
  "${P}a='+badges(f)+ratingBadge(f)+';assert a in s
s=s.replace(a,'+badges(f)+',1);${W}"

run_case "the legend stops explaining the two systems" \
  "the legend no longer explains the two systems" \
  "${P}a='MPA for films, TV Parental Guidelines for television';assert a in s
s=s.replace(a,'two rating systems',1);${W}"

echo "--- 93: the Progress lists fold, and remember"
run_case "progOpen leaves the saved payload" \
  "progOpen is not written to the saved payload" \
  "${P}a='  {k:\"progOpen\",  s:1, read:function(v){ return flagsOf(v, true); }},\n';assert a in s
s=s.replace(a,'',1);${W}"

run_case "restore takes any value, inverting the closed default" \
  "restore() accepts non-true progOpen values" \
  "${P}a='  for(k in v){ if(HAS.call(v, k) && v[k] === want) out[k] = want; }'
assert a in s
s=s.replace(a,'  for(k in v){ if(HAS.call(v, k)) out[k] = v[k]; }',1);${W}"

run_case "the fold handler forgets to persist" \
  "the fold handler does not persist" \
  "${P}a='''if(S.progOpen[pk] === true) delete S.progOpen[pk]; else S.progOpen[pk] = true;
    persist(); render({quiet:true});'''
assert a in s
s=s.replace(a,'''if(S.progOpen[pk] === true) delete S.progOpen[pk]; else S.progOpen[pk] = true;
    render({quiet:true});''',1);${W}"

run_case "the caret stops turning" \
  "the fold caret does not turn" \
  "${P}a='.sfold.open .caret{transform:rotate(90deg);}';assert a in s
s=s.replace(a,'',1);${W}"

run_case "the folds default open" \
  "progFold() opens on anything but an explicit true" \
  "${P}a='S.progOpen[pk] === true';assert s.count(a)>=2
s=s.replace(a,'S.progOpen[pk] !== false');${W}"

run_case "the fold heading shrinks below a finger" \
  ".sfhead gives a 30px touch target" \
  "${P}a='.sfhead{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;'
assert a in s
s=s.replace(a,a.replace('min-height:44px','min-height:30px'),1);${W}"

echo "--- 94: the path is Bruce, for a fresh visitor"
run_case "the pre-choice default drifts back to By universe" \
  'the pre-choice default mode is not "life"' \
  "${P}a='path:\"\", mode:\"life\",';assert a in s
s=s.replace(a,'path:\"\", mode:\"continuity\",',1);${W}"

run_case "another card takes the lead" \
  "the chooser's first card is not Bruce's life" \
  "${P}a='var PATHS = [[\"life\",';assert a in s
s=s.replace('var PATHS = [[\"life\"','var PATHS = [[\"continuity\",\"By universe\"], [\"life\"',1)
s=s.replace('], [\"continuity\",\"By universe\"], [\"release\"','], [\"release\"',1);${W}"

echo "--- 95: the curated list is machine-readable"
run_case "the ItemList vanishes from the JSON-LD" \
  "the JSON-LD has no ItemList" \
  "import io,json,re;p='docs/index.html';s=io.open(p,encoding='utf-8').read()
m=re.search(r'<script type=\"application/ld\+json\">(.*?)</script>',s,re.S)
o=json.loads(m.group(1))
o['@graph']=[n for n in o['@graph'] if n.get('@type')!='ItemList']
s=s.replace(m.group(1),json.dumps(o));${W}"

run_case "the ItemList drifts from the curated titles" \
  "no longer matches the curated titles" \
  "import io,json,re;p='docs/index.html';s=io.open(p,encoding='utf-8').read()
m=re.search(r'<script type=\"application/ld\+json\">(.*?)</script>',s,re.S)
o=json.loads(m.group(1))
il=[n for n in o['@graph'] if n.get('@type')=='ItemList'][0]
il['itemListElement'][0]['name']='Batman Begins (2005)'
s=s.replace(m.group(1),json.dumps(o));${W}"

echo "--- 78: the seed leads with an H1"
run_case "the seed's first heading slips back to an H2" \
  "the crawlable catalogue no longer matches the data" \
  "${P}a='<h1>Every Batman story ever filmed</h1>';assert a in s
s=s.replace(a,'<h2>Every Batman story ever filmed</h2>',1);${W}"

echo "--- 29: the raised ceiling still exists"
run_case "the file grows past the new budget" \
  "over the 250 KiB budget" \
  "${P}a='\"use strict\";';assert a in s
s=s.replace(a,'\"use strict\"; var PAD_2_5_0 = \"'+('x'*40000)+'\";',1);${W}"

finish "negtest195"
