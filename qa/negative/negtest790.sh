#!/bin/bash
# negtest790 — 6.5.1, the outside QA on 6.5.0. The paper and the crew's page
# revalidate (104). 6.6.2: the paper's documents carry the apex's three Link
# relations, each issue's canonical is its own URL, and a preload or an
# api-catalog relation on the paper fails (104). The worker steps aside for /nocturne and /hww with or
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
  "${HD}a=\"frame-ancestors 'none'\\n  Cache-Control: no-cache\\n\\n# The paper's documents\";assert s.count(a)==1;s=s.replace(a,\"frame-ancestors 'none'\\n\\n# The paper's documents\",1);${W}" \
  guards "" 104

run_case "the crew's page's no-cache is dropped" \
  "no longer sets Cache-Control on /hww/*" \
  "${HD}a='  X-Robots-Tag: noindex, nofollow\\n  Cache-Control: no-cache\\n';assert s.count(a)==1;s=s.replace(a,'  X-Robots-Tag: noindex, nofollow\\n',1);${W}" \
  guards "" 104

run_case "the paper front loses its canonical Link" \
  "the paper front does not declare its own canonical Link" \
  "${HD}a='  Link: <https://nightwatcher.life/nocturne/>; rel=\"canonical\"\\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 104

run_case "an issue's canonical stops naming that issue" \
  "an issue page does not declare its own canonical Link" \
  "${HD}a='  Link: <https://nightwatcher.life/nocturne/:issue/>; rel=\"canonical\"\\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 104

run_case "the paper front loses describedby" \
  "does not carry describedby pointing at /llms.txt" \
  "${HD}a='/nocturne/\\n  Link: <https://nightwatcher.life/sitemap.xml>; rel=\"sitemap\"\\n  Link: <https://nightwatcher.life/nocturne/>; rel=\"canonical\"\\n  Link: </llms.txt>; rel=\"describedby\"\\n';assert s.count(a)==1;s=s.replace(a,'/nocturne/\\n  Link: <https://nightwatcher.life/sitemap.xml>; rel=\"sitemap\"\\n  Link: <https://nightwatcher.life/nocturne/>; rel=\"canonical\"\\n',1);${W}" \
  guards "" 104

run_case "a font preload is bolted onto the paper" \
  "the paper preloads a face it does not preload" \
  "${HD}a='  Link: <https://nightwatcher.life/nocturne/>; rel=\"canonical\"\\n';assert s.count(a)==1;s=s.replace(a,'  Link: <https://nightwatcher.life/nocturne/>; rel=\"canonical\"\\n  Link: </fonts/limelight-latin-400-normal.woff2>; rel=preload; as=font; crossorigin\\n',1);${W}" \
  guards "" 104

run_case "a Link relation lands on every paper asset" \
  "a Link relation sits under /nocturne/*" \
  "${HD}a=\"frame-ancestors 'none'\\n  Cache-Control: no-cache\\n\";assert s.count(a)==1;s=s.replace(a,\"frame-ancestors 'none'\\n  Cache-Control: no-cache\\n  Link: <https://nightwatcher.life/nocturne/>; rel=\\\"canonical\\\"\\n\",1);${W}" \
  guards "" 104

run_case "the paper advertises an API it does not have" \
  "the paper advertises api-catalog or service-doc" \
  "${HD}a='  Link: </llms.txt>; rel=\"describedby\"\\n  Vary: Accept\\n\\n/nocturne/:issue/';assert s.count(a)==1;s=s.replace(a,'  Link: </llms.txt>; rel=\"describedby\"\\n  Vary: Accept\\n  Link: </.well-known/api-catalog>; rel=\"api-catalog\"\\n\\n/nocturne/:issue/',1);${W}" \
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

run_case "the theme switch back to 34px" \
  ".dsw gives a 34px touch target" \
  "${P}a='.dsw{display:inline-grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;min-height:44px;';assert s.count(a)==1;s=s.replace(a,'.dsw{display:inline-grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;min-height:34px;',1);${W}" \
  guards "" 75

run_case "the include switch back to 34px" \
  ".includes .scope button gives a 34px touch target" \
  "${P}a='.includes .scope button{min-height:44px;';assert s.count(a)==1;s=s.replace(a,'.includes .scope button{min-height:34px;',1);${W}" \
  guards "" 75

run_case "the theme switch loses its focus ring" \
  ".dsw's focus ring is missing" \
  "${P}a='.dsw:focus-visible{outline:2px solid var(--signal);outline-offset:2px;}\\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 75

finish "negtest790"
