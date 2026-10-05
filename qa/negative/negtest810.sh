#!/bin/bash
# negtest810 — 6.6.6. The front's title names Batman news and no spoilers.
# One JSON-LD block: a WebPage of the Periodical, and a FAQPage of six
# Batman questions, in order. 6.6.8: the questions stay in that FAQPage
# and in the markdown, and the visible page must not print them. The
# footer carries one link, The map, to /. An issue carries neither the
# FAQ block nor the question text (175).
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"

echo "--- 175: the front names Batman news, and six questions"

run_case "the front title drops Batman news" \
  "front title is not the Batman news line" \
  "${N}a='title: FRONT_TITLE';assert s.count(a)==1;s=s.replace(a,'title: \"Nocturne\"',1);${W}" \
  guards "" 175

run_case "the front og:title drops Batman news" \
  "front og:title is not the Batman news line" \
  "${N}a='ogTitle: FRONT_TITLE';assert s.count(a)==1;s=s.replace(a,'ogTitle: \"Nocturne\"',1);${W}" \
  guards "" 175

run_case "the front twitter:title drops Batman news" \
  "front twitter:title is not the Batman news line" \
  "${N}a='name=\"twitter:title\" content=\"\\' + esc(o.ogTitle)';assert s.count(a)==1;s=s.replace(a,'name=\"twitter:title\" content=\"\\' + esc(\"Nocturne\")',1);${W}" \
  guards "" 175

run_case "the front loses its JSON-LD block" \
  "front JSON-LD block count is not one" \
  "${N}a='extra: ldjson(frontGraph(list))';assert s.count(a)==1;s=s.replace(a,'extra: \"\"',1);${W}" \
  guards "" 175

run_case "the front JSON-LD drops its graph" \
  "front JSON-LD has no graph" \
  "${N}a='\"@graph\":';assert s.count(a)==1;s=s.replace(a,'\"@main\":',1);${W}" \
  guards "" 175

run_case "the front JSON-LD is a NewsArticle" \
  "front JSON-LD is a NewsArticle" \
  "${N}a='\"@type\": \"WebPage\"';assert s.count(a)==1;s=s.replace(a,'\"@type\": \"NewsArticle\"',1);${W}" \
  guards "" 175

run_case "the front JSON-LD loses the Periodical" \
  "front JSON-LD has no Periodical" \
  "${N}a='isPartOf: {\"@type\": \"Periodical\", name: \"Nocturne\", url: url}';assert s.count(a)==1;s=s.replace(a,'about: {\"@type\": \"Periodical\", name: \"Nocturne\", url: url}',1);${W}" \
  guards "" 175

run_case "the front dateModified is a fixed day" \
  "front dateModified is not the newest issue lastmod" \
  "${N}a='dateModified: newestLastmod(list)';assert s.count(a)==1;s=s.replace(a,'dateModified: \"1999-01-01\"',1);${W}" \
  guards "" 175

run_case "the front JSON-LD names a person" \
  "front JSON-LD names a Person" \
  "${N}a='name: FRONT_TITLE, url: url, dateModified:';assert s.count(a)==1;s=s.replace(a,'name: FRONT_TITLE, url: url, author: {\"@type\": \"Person\", name: \"X\"}, dateModified:',1);${W}" \
  guards "" 175

run_case "the FAQPage loses the six names" \
  "front FAQPage lost the six Batman questions" \
  "${N}a='name: q[0], acceptedAnswer:';assert s.count(a)==1;s=s.replace(a,'name: \"Gone\", acceptedAnswer:',1);${W}" \
  guards "" 175

run_case "the front prints the six questions again" \
  "front prints the six Batman questions" \
  "${N}a=\"return out + '</section>\\\\n' + footer(\\\"\\\")\";assert s.count(a)==1;s=s.replace(a,\"return out + '</section>\\\\n' + '<p>Where do I read this week\\\\u2019s Batman news without spoilers?</p>' + footer(\\\"\\\")\",1);${W}" \
  guards "" 175

run_case "the front markdown drops a question" \
  "front markdown dropped a Batman question" \
  "${N}a='\"## \" + q[0]';assert s.count(a)==1;s=s.replace(a,'\"## \" + \"Gone\"',1);${W}" \
  guards "" 175

run_case "an issue page grows a FAQPage" \
  "issue page carries the FAQ block" \
  "${N}a='\"@type\": \"NewsArticle\"';assert s.count(a)==1;s=s.replace(a,'\"@type\": \"FAQPage\"',1);${W}" \
  guards "" 175

run_case "an issue page prints the front question" \
  "issue page carries the front question" \
  "${N}a='inline(fm.sign_off)';assert s.count(a)==1;s=s.replace(a,'inline(fm.sign_off) + \"Where do I read this week\\u2019s Batman news without spoilers?\"',1);${W}" \
  guards "" 175

run_case "the map link leaves the root" \
  "front markdown map link is not nightwatcher.life" \
  "${N}a='[nightwatcher.life](/)';assert s.count(a)==1;s=s.replace(a,'[example.invalid](https://example.invalid)',1);${W}" \
  guards "" 175

run_case "the wire link leaves the feed" \
  "front markdown wire link is not the feed" \
  "${N}a='[/nocturne/feed.xml](/nocturne/feed.xml)';assert s.count(a)==1;s=s.replace(a,'[/elsewhere](/elsewhere)',1);${W}" \
  guards "" 175

run_case "the watch-order answer gains a second link" \
  "front markdown watch-order answer is not the one link" \
  "${N}a='[nightwatcher.life](/).';assert s.count(a)==1;s=s.replace(a,'[nightwatcher.life](/) [also](/x).',1);${W}" \
  guards "" 175

run_case "the footer drops the map link" \
  "front footer has no map link" \
  "${N}a=' + MAP_LINK';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 175

finish "negtest810"
