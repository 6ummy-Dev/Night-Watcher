#!/bin/bash
# negtest790 — 6.5.1, the outside QA on 6.5.0. The paper and the crew's page
# revalidate (104); the worker steps aside for /nocturne and /hww with or
# without the slash (165, 170) and gives a hung navigation 4 s before the
# cache answers (132); the sitemap lists /, /llms.txt and the paper's block
# and nothing else (167); the Theme row and the include switch are 44px with
# an inset ring (75). Every fixture names its section.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

HD="$(pro docs/_headers)"
SWJ="$(pro docs/sw.js)"
SM="$(pro docs/sitemap.xml)"

echo "--- 104: the paper and the crew's page revalidate"

run_case "the paper's no-cache is dropped" \
  "no longer sets Cache-Control on /nocturne/*" \
  "${HD}a=\"frame-ancestors 'none'\\n  Cache-Control: no-cache\\n\\n# /hww/*\";assert s.count(a)==1;s=s.replace(a,\"frame-ancestors 'none'\\n\\n# /hww/*\",1);${W}" \
  guards "" 104

run_case "the crew's page's no-cache is dropped" \
  "no longer sets Cache-Control on /hww/*" \
  "${HD}a='  X-Robots-Tag: noindex, nofollow\\n  Cache-Control: no-cache\\n';assert s.count(a)==1;s=s.replace(a,'  X-Robots-Tag: noindex, nofollow\\n',1);${W}" \
  guards "" 104

echo "--- 165, 170: the worker steps aside without the slash too"

run_case "the worker answers /nocturne without its slash" \
  "does not step aside for /nocturne without its slash" \
  "${SWJ}a='  if(url.pathname === \"/nocturne\") return;\\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 165

run_case "the worker answers /hww without its slash" \
  "does not step aside for /hww without its slash" \
  "${SWJ}a='  if(url.pathname === \"/hww\") return;\\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 170

run_case "the slashless paper is answered, executed" \
  "answers /nocturne without its slash" \
  "${SWJ}a='  if(url.pathname === \"/nocturne\") return;\\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 132

echo "--- 132: a hung navigation waits 4 s, then the cache answers"

run_case "the wait grows to ten seconds" \
  "does not wait NAV_WAIT (4000 ms)" \
  "${SWJ}a='var NAV_WAIT = 4000;';assert s.count(a)==1;s=s.replace(a,'var NAV_WAIT = 10000;',1);${W}" \
  guards "" 132

run_case "navigations go plain network-first again" \
  "does not wait NAV_WAIT (4000 ms)" \
  "${SWJ}a='  if(req.mode !== \"navigate\"){\\n    e.respondWith(net.catch(offline));\\n    return;\\n  }';assert s.count(a)==1;s=s.replace(a,'  if(true){\\n    e.respondWith(net.catch(offline));\\n    return;\\n  }',1);${W}" \
  guards "" 132

run_case "the wait answers with nothing from the cache" \
  "is not answered from the cache after NAV_WAIT" \
  "${SWJ}a='fromCache().then(function(hit){ if(hit) answer(hit); });';assert s.count(a)==1;s=s.replace(a,'void 0;',1);${W}" \
  guards "" 132

run_case "the late network answer is dropped" \
  "never reached the cache" \
  "${SWJ}a='    if(res && res.ok){\\n      var copy';assert s.count(a)==1;s=s.replace(a,'    if(res && res.ok && !answered){\\n      var copy',1);a='  var net = fetch(req)';assert s.count(a)==1;s=s.replace(a,'  var answered = false;\\n  var net = fetch(req)',1);a='    function answer(r){\\n      if(settled) return;';assert s.count(a)==1;s=s.replace(a,'    function answer(r){\\n      if(settled) return;\\n      answered = true;',1);${W}" \
  guards "" 132

run_case "assets start waiting on a timer too" \
  "assets stay plain network-first" \
  "${SWJ}a='  if(req.mode !== \"navigate\"){\\n    e.respondWith(net.catch(offline));\\n    return;\\n  }';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 132

echo "--- 167: the sitemap lists /, /llms.txt and the paper's block"

run_case "a URL after the paper's block" \
  "lists a URL after the Nocturne block" \
  "${SM}a='</urlset>';assert s.count(a)==1;s=s.replace(a,'  <url><loc>https://nightwatcher.life/elsewhere/</loc></url>\\n'+a,1);${W}" \
  guards "" 167

run_case "a URL inside the block outside the paper" \
  "lists a URL outside /nocturne/" \
  "${SM}a='  <!-- nocturne:end';assert s.count(a)==1;s=s.replace(a,'  <url><loc>https://nightwatcher.life/elsewhere/</loc></url>\\n'+a,1);${W}" \
  guards "" 167

run_case "the second URL is not llms.txt" \
  "second URL is not /llms.txt" \
  "${SM}a='<loc>https://nightwatcher.life/llms.txt</loc>';assert s.count(a)==1;s=s.replace(a,'<loc>https://nightwatcher.life/orders.txt</loc>',1);${W}" \
  guards "" 167

echo "--- 75: the Theme row and the include switch are a finger's size"

run_case "the Theme row back to 34px" \
  ".themerow button gives a 34px touch target" \
  "${P}a='.themerow button{flex:1;min-height:44px;';assert s.count(a)==1;s=s.replace(a,'.themerow button{flex:1;min-height:34px;',1);${W}" \
  guards "" 75

run_case "the include switch back to 34px" \
  ".includes .scope button gives a 34px touch target" \
  "${P}a='.includes .scope button{min-height:44px;';assert s.count(a)==1;s=s.replace(a,'.includes .scope button{min-height:34px;',1);${W}" \
  guards "" 75

run_case "the rows' focus ring clipped again" \
  "focus ring is not drawn inset" \
  "${P}a='.themerow button:focus-visible,.includes .scope button:focus-visible{outline-offset:-2px;}\\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 75

finish "negtest790"
