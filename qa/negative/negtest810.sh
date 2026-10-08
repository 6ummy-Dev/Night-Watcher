#!/bin/bash
# negtest810 — 6.6.6. The front's title names Batman news and no spoilers.
# One JSON-LD block: a WebPage of the Periodical, and a FAQPage of Batman
# questions, in order. 6.6.8 took the questions off the page; 6.8.0 put
# seven back under the morgue as Questions at the desk, each answer the
# block's (the printed-page fixtures are in negtest850). An issue carries
# neither the FAQ block nor the question text (175). The footer is not
# required to carry a The map link.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"

echo "--- 175: the front names Batman news, and seven questions"

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
  "${N}a='isPartOf: periodical(), publisher: organization(aboutOf(list))';assert s.count(a)==1;s=s.replace(a,'about: periodical(), publisher: organization(aboutOf(list))',1);${W}" \
  guards "" 175

run_case "the front dateModified is a fixed day" \
  "front dateModified is not the newest issue lastmod" \
  "${N}a='dateModified: newestLastmod(list)';assert s.count(a)==1;s=s.replace(a,'dateModified: \"1999-01-01\"',1);${W}" \
  guards "" 175

run_case "the front JSON-LD names a person" \
  "front JSON-LD names a Person" \
  "${N}a='name: FRONT_TITLE, url: url, dateModified:';assert s.count(a)==1;s=s.replace(a,'name: FRONT_TITLE, url: url, author: {\"@type\": \"Person\", name: \"X\"}, dateModified:',1);${W}" \
  guards "" 175

run_case "the FAQPage loses the seven names" \
  "front FAQPage lost the seven Batman questions" \
  "${N}a='name: q[0], acceptedAnswer:';assert s.count(a)==1;s=s.replace(a,'name: \"Gone\", acceptedAnswer:',1);${W}" \
  guards "" 175

run_case "the front markdown drops a question" \
  "front markdown dropped a Batman question" \
  "${N}a='\"### \" + q[0]';assert s.count(a)==1;s=s.replace(a,'\"### \" + \"Gone\"',1);${W}" \
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

finish "negtest810"
