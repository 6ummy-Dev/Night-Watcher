#!/bin/bash
# Negative-test 3.4.5 — the deep-QA round. Sections 126 and 127, plus the a11y
# and focus fixes that rode with them.
#
# Every fixture in here aims at a guard written after a defect that WAS ALREADY
# SHIPPING. That is unusual for this directory, where most sections predate the
# thing they refuse, and it changes what the fixtures have to prove. A guard
# written against a bug you have in front of you will happily pass on the fixed
# tree while testing nothing at all — the fix is right there, so the assertion
# looks satisfied whatever it actually asserts. These put the old code back,
# one shape at a time, and require the new sections to go red for it.
#
# The 2.1 case is the one to read. It is the only defect this project has
# shipped that broke every LATER boot rather than the moment it happened: a
# restored backup carrying "path":"__proto__" poisoned S.path, threw mid-apply,
# and the persist already scheduled wrote the poison to storage. Recovery was
# clearing site data. Its fixture restores the one-line prototype-chain lookup.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 126: a restored path cannot reach the prototype chain"

run_case "isPath goes back to the prototype-chain lookup" \
  "is a bare truthiness lookup on PATHCODE again" \
  "${P}a='''function isPath(id){
  return typeof id === \"string\" && HAS.call(PATHCODE, id) && typeof PATHCODE[id] === \"string\";
}'''
assert a in s
s=s.replace(a,'function isPath(id){ return !!PATHCODE[id]; }',1);${W}"

run_case "isPath keeps hasOwnProperty and drops the string check" \
  "a name off Object.prototype passes as a path again" \
  "${P}a='&& typeof PATHCODE[id] === \"string\"';assert a in s
s=s.replace(a,'|| typeof PATHCODE[id] !== \"undefined\"',1);${W}"

run_case "isPath stops asking whether the key is its own" \
  "no longer asks PATHCODE whether the key is its own" \
  "${P}a='HAS.call(PATHCODE, id)';assert a in s
s=s.replace(a,'(id in PATHCODE)',1);${W}"

run_case "isPath refuses a real path with the bad ones" \
  "the hardening took a real path with it" \
  "${P}a='typeof PATHCODE[id] === \"string\"';assert a in s
s=s.replace(a,'typeof PATHCODE[id] === \"number\"',1);${W}"

run_case "BYID goes back to a plain object literal" \
  "BYID is a plain object literal again" \
  "${P}a='var BYID = Object.create(null);';assert a in s
s=s.replace(a,'var BYID = {};',1);${W}"

echo "--- 127: a failed read stops the writes"

run_case "the async rejection leaves saving on" \
  "failed read no longer stops the writes" \
  "${P}a='function(){ readFailed = true; canSave = false; finish(null); }';assert a in s
s=s.replace(a,'function(){ finish(null); }',1);${W}"

run_case "only one of the two failure paths latches" \
  "latches readFailed on only one of its two failure paths" \
  "${P}a='}catch(e){ readFailed = true; canSave = false; finish(null); }';assert a in s
s=s.replace(a,'}catch(e){ canSave = false; finish(null); }',1);${W}"

run_case "persist writes without asking whether the read worked" \
  "persist() writes without asking whether the read succeeded" \
  "${P}a='''function persist(){
  if(!store || readFailed) return;'''
assert a in s
s=s.replace(a,'''function persist(){
  if(!store) return;''',1);${W}"

run_case "persistNow writes without asking whether the read worked" \
  "persistNow() writes without asking whether the read succeeded" \
  "${P}a='''function persistNow(){
  if(!store || readFailed) return;'''
assert a in s
s=s.replace(a,'''function persistNow(){
  if(!store) return;''',1);${W}"

echo "--- 127: a failed write does not stop them forever"

run_case "the write failure latches with no way back" \
  "has no way back from a write failure" \
  "${P}a='''    if(p && p.then) p.then(saveWorked, saveFailed);
    else saveWorked();'''
assert a in s
s=s.replace(a,'    if(p && p.catch) p.catch(saveFailed);',1)
a2='function saveWorked(){ if(!canSave){ canSave = true; flagSave(); } }\n';assert a2 in s
s=s.replace(a2,'',1);${W}"

run_case "the old catch-and-latch shape comes back" \
  "that is the 2.4 shape returning" \
  "${P}a='    if(p && p.then) p.then(saveWorked, saveFailed);';assert a in s
s=s.replace(a,'    if(p && p.catch) p.catch(function(){ canSave = false; flagSave(); });',1);${W}"

echo "--- 127: a restored container has to be a container"

run_case "watched is taken straight off the payload again" \
  "takes a progress container straight off the parsed payload again" \
  "${P}a='S.watched = marksOf(o.watched); S.skipped = marksOf(o.skipped);';assert a in s
s=s.replace(a,'S.watched = o.watched || {}; S.skipped = o.skipped || {};',1);${W}"

run_case "ratings skip the shaping pass" \
  "no longer shapes all three progress containers" \
  "${P}a='S.rated = ratingsOf(o.rated);';assert a in s
s=s.replace(a,'S.rated = o.rated ? o.rated : {};',1);${W}"

run_case "marksOf keeps whatever value it is handed" \
  "no longer normalises a real container" \
  "${P}a='for(k in v){ if(HAS.call(v, k) && v[k]) out[k] = 1; }';assert a in s
s=s.replace(a,'for(k in v){ if(HAS.call(v, k)) out[k] = v[k]; }',1);${W}"

run_case "marksOf stops checking the shape it was given" \
  "returned something other than an empty container" \
  "${P}a='''function marksOf(v){
  var out = {}, k;
  if(!v || typeof v !== \"object\") return out;'''
assert a in s
s=s.replace(a,'''function marksOf(v){
  var out = {}, k;
  if(!v) return out;''',1);${W}"

run_case "the rating clamp comes out of ratingsOf" \
  "let an out-of-range rating through" \
  "${P}a='for(k in v){ if(HAS.call(v, k)){ n = clampRating(v[k]); if(n) out[k] = n; } }';assert a in s
s=s.replace(a,'for(k in v){ if(HAS.call(v, k)){ n = v[k]; if(n) out[k] = n; } }',1);${W}"

echo "--- 127: a log entry without a timestamp"

run_case "mergeLog goes back to isFinite on its own" \
  "no longer asks validTs() about the timestamp" \
  "${P}a='validTs(en.ts)';assert a in s;s=s.replace(a,'isFinite(en.ts)',1);${W}"

run_case "validTs admits null again" \
  "validTs(null) is true" \
  "${P}a='return (typeof v === \"number\" || (typeof v === \"string\" && v !== \"\")) && isFinite(v);';assert a in s
s=s.replace(a,'return isFinite(v);',1);${W}"

run_case "validTs rejects a real timestamp" \
  "validTs() rejects a real timestamp" \
  "${P}a='&& isFinite(v);';assert a in s
s=s.replace(a,'&& isFinite(v) && typeof v === \"number\";',1);${W}"

echo "--- 98: the share block's title tracks the level the tab uses"

run_case "the share title drops back to an h3" \
  "the share block is not a card" \
  "${P}a='<div class=\"bk sharecard\"><h2>Share your progress</h2>';assert a in s
s=s.replace(a,'<div class=\"bk sharecard\"><h3>Share your progress</h3>',1);${W}"

echo "--- 123: the focus snapshot tells the two watched buttons apart"

run_case "the detail action button loses its data-src" \
  "indistinguishable from the row's own tick in a focus snapshot" \
  "${P}a='data-act=\"watched\" data-src=\"detail\" data-id=';assert a in s
s=s.replace(a,'data-act=\"watched\" data-id=',1)
a2='\"tf\", \"src\"';assert a2 in s;s=s.replace(a2,'\"tf\"',1);${W}"

run_case "dedupeLog stops asking about the timestamp" \
  "admitted an entry with no usable timestamp" \
  "${P}a='if(!e || !e.id || !validTs(e.ts)) return;';assert a in s
s=s.replace(a,'if(!e || !e.id) return;',1);${W}"

finish "negtest350"
