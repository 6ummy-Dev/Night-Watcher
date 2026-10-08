#!/bin/bash
# negtest850 — 6.8.0. The front prints its seven questions under the morgue
# as Questions at the desk, each answer the FAQPage's, and nowhere else
# (175). The mast date may sit in a <time> and reader view still wants the
# space beside the diamond (180). The paper announces itself (181): a robots
# line on every page and noindex on the holding page, dated time elements,
# the About row to the founding issue, the lead in the description, a
# credited NewsArticle that is an issue of the Periodical by Night Watcher
# with its records, beats, keywords and mentions, and a sound entity map.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"
E="$(pro qa/nocturne-entities.json)"

echo "--- 175: the front prints the seven questions as Questions at the desk"

run_case "the front stops printing the questions" \
  "front does not print the seven questions under the morgue as Questions at the desk" \
  "${N}a=\"frontAsk() + footer(\";assert s.count(a)==1;s=s.replace(a,\"footer(\",1);${W}" \
  guards "" 175

run_case "the section loses its heading" \
  "front does not print the seven questions under the morgue as Questions at the desk" \
  "${N}a='var ASK_HEAD = \"Questions at the desk\";';assert s.count(a)==1;s=s.replace(a,'var ASK_HEAD = \"Questions\";',1);${W}" \
  guards "" 175

run_case "a printed answer differs from the block's" \
  "front prints an answer the FAQPage does not state" \
  "${N}a='return FRONT_QS[i][1];';assert s.count(a)==1;s=s.replace(a,'return FRONT_QS[i][1] + \" Ask us.\";',1);${W}" \
  guards "" 175

run_case "a question is printed a second time, outside the section" \
  "front prints a question outside Questions at the desk" \
  "${N}a=\"frontAsk() + footer(\";assert s.count(a)==1;s=s.replace(a,\"frontAsk() + '<p>' + FRONT_QS[0][0] + '</p>' + footer(\",1);${W}" \
  guards "" 175

run_case "the markdown loses the section heading" \
  "front markdown has no Questions at the desk heading" \
  "${N}a='lines.push(\"\", \"## \" + ASK_HEAD, \"\", ASK_SUB, \"\");';assert s.count(a)==1;s=s.replace(a,'lines.push(\"\", \"## Questions\", \"\", ASK_SUB, \"\");',1);${W}" \
  guards "" 175

echo "--- 180: the mast time keeps the space beside the diamond"

run_case "the mast time swallows the space after the date" \
  "a diamond is the only thing between two labels" \
  "${N}a='<span>\\' + b + \\' </span>';assert s.count(a)==1;s=s.replace(a,'<span>\\' + b + \\'</span>',1);${W}" \
  guards "" 180

echo "--- 181: the paper announces itself"

run_case "the robots line asks for a standard preview" \
  "has no robots line with max-image-preview:large" \
  "${N}a='var ROBOTS = \"max-image-preview:large\";';assert s.count(a)==1;s=s.replace(a,'var ROBOTS = \"max-image-preview:standard\";',1);${W}" \
  guards "" 181

run_case "the holding page asks to be indexed" \
  "the holding page is not noindex" \
  "${N}a='robots: \"noindex\"';assert s.count(a)==1;s=s.replace(a,'robots: \"index\"',1);${W}" \
  guards "" 181

run_case "a time element carries a clock" \
  "a time element's datetime is not a date" \
  "${N}a=\"'<time datetime=\\\"' + iso + '\\\">'\";assert s.count(a)==1;s=s.replace(a,\"'<time datetime=\\\"' + iso + 'T00:00\\\">'\",1);${W}" \
  guards "" 181

run_case "the mast date is words again" \
  "the mast date is not a time element with the published date" \
  "${N}a='timeTag(fm.published, esc(longDate(fm.published))), \"Price: nothing. No account.\"';assert s.count(a)==1;s=s.replace(a,'esc(longDate(fm.published)), \"Price: nothing. No account.\"',1);${W}" \
  guards "" 181

run_case "a correction's date is words again" \
  "a correction's date is not a time element" \
  "${N}a=\"Corrected ' + timeTag(c.date, shortDate(c.date))\";assert s.count(a)==1;s=s.replace(a,\"Corrected ' + shortDate(c.date)\",1);${W}" \
  guards "" 181

run_case "the front's lead date is words again" \
  "the front dates an issue without a time element" \
  "${N}a='<span>\\' + timeTag(fm.published, esc(longDate(fm.published))) + \\'</span></p>';assert s.count(a)==1;s=s.replace(a,'<span>\\' + esc(longDate(fm.published)) + \\'</span></p>',1);a='<span class=\"when\">\\' + timeTag(b.fm.published, esc(longDate(b.fm.published)))';assert s.count(a)==1;s=s.replace(a,'<span class=\"when\">\\' + esc(longDate(b.fm.published))',1);${W}" \
  guards "" 181

run_case "the front drops the About row" \
  "the front has no About the paper row to the founding issue" \
  "${N}a='frontAsk() + footer(\"\", aboutHref(aboutOf(list)))';assert s.count(a)==1;s=s.replace(a,'frontAsk() + footer(\"\")',1);${W}" \
  guards "" 181

run_case "the founding issue links About the paper to itself" \
  "the founding issue links About the paper to itself" \
  "${N}a='about === url ? \"\" : aboutHref(about)';assert s.count(a)==1;s=s.replace(a,'aboutHref(about)',1);${W}" \
  guards "" 181

run_case "an issue drops the About row" \
  "has no About the paper row to the founding issue" \
  "${N}a='about === url ? \"\" : aboutHref(about)';assert s.count(a)==1;s=s.replace(a,'\"\"',1);${W}" \
  guards "" 181

run_case "the description is the cold open alone again" \
  "an issue's description does not carry the cold open and the lead" \
  "${N}a='var desc = metaDesc(fm);';assert s.count(a)==1;s=s.replace(a,'var desc = plain(fm.cold_open);',1);${W}" \
  guards "" 181

run_case "the image loses its copyright line" \
  "the NewsArticle image has no credit" \
  "${N}a='creditText: holder, copyrightNotice: holder';assert s.count(a)==1;s=s.replace(a,'creditText: holder, copyrightNotice: \"\"',1);${W}" \
  guards "" 181

run_case "the Periodical loses its other name" \
  "the NewsArticle is not an issue of the Periodical" \
  "${N}a='alternateName: \"The Night Final\"';assert s.count(a)==1;s=s.replace(a,'alternateName: \"Nocturne\"',1);${W}" \
  guards "" 181

run_case "the front's Periodical loses its other name" \
  "the front's Periodical has no other name" \
  "${N}a='alternateName: \"The Night Final\"';assert s.count(a)==1;s=s.replace(a,'alternateName: \"Nocturne\"',1);${W}" \
  guards "" 181

run_case "the front loses its publisher" \
  "the front's publisher is not the Organization" \
  "${N}a='isPartOf: periodical(), publisher: organization(aboutOf(list))';assert s.count(a)==1;s=s.replace(a,'isPartOf: periodical()',1);${W}" \
  guards "" 181

run_case "the author is a second, thinner Organization" \
  "the publisher and the author are not the one Organization" \
  "${N}a='author: organization(about), publisher: organization(about)';assert s.count(a)==1;s=s.replace(a,'author: {\"@type\": \"Organization\", name: \"Night Watcher\"}, publisher: organization(about)',1);${W}" \
  guards "" 181

run_case "the publisher drops the X account" \
  "the publisher's records are not the repo and the X account" \
  "${N}a='sameAs: [REPO, X_ACCOUNT]';assert s.count(a)==1;s=s.replace(a,'sameAs: [REPO]',1);${W}" \
  guards "" 181

run_case "the principles point at the front" \
  "the publisher's principles are not the founding issue" \
  "${N}a='publishingPrinciples: about || SITE + \"/nocturne/\"';assert s.count(a)==1;s=s.replace(a,'publishingPrinciples: SITE + \"/nocturne/\"',1);${W}" \
  guards "" 181

run_case "the corrections policy points at the front" \
  "the corrections policy does not point at the desk's question" \
  "${N}a='correctionsPolicy: SITE + \"/nocturne/#ask\"';assert s.count(a)==1;s=s.replace(a,'correctionsPolicy: SITE + \"/nocturne/\"',1);${W}" \
  guards "" 181

run_case "the publisher's logo is another file" \
  "the publisher's logo is not the app's icon" \
  "${N}a='logo: {\"@type\": \"ImageObject\", url: SITE + \"/icon.png\"}';assert s.count(a)==1;s=s.replace(a,'logo: {\"@type\": \"ImageObject\", url: SITE + \"/logo.png\"}',1);${W}" \
  guards "" 181

run_case "the issue drops its beats" \
  "articleSection is not the issue's beats" \
  "${N}a='if(beats.length) ld.articleSection = beats;';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 181

run_case "the keywords open with the beats" \
  "keywords do not open with Batman news" \
  "${N}a='ld.keywords = [\"Batman news\", \"Batman\"].concat(';assert s.count(a)==1;s=s.replace(a,'ld.keywords = [].concat(',1);${W}" \
  guards "" 181

run_case "the issue drops its mentions" \
  "mentions do not name the titles the stories touch" \
  "${N}a='if(mentions.length) ld.mentions = mentions;';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 181

run_case "a mapped title loses its public record" \
  "a mention of a mapped title has no public record" \
  "${N}a='if(r) m.sameAs = [';assert s.count(a)==1;s=s.replace(a,'if(false) m.sameAs = [',1);${W}" \
  guards "" 181

run_case "the entity map names a title the map does not have" \
  "qa/nocturne-entities.json names a title the map does not have" \
  "${E}a='\"clayface-2026\"';assert s.count(a)==1;s=s.replace(a,'\"clayface-2027\"',1);${W}" \
  guards "" 181

run_case "an entity row loses its IMDb id" \
  "has no Wikidata Q-id and IMDb tt-id" \
  "${E}a='\"tt34890576\"';assert s.count(a)==1;s=s.replace(a,'\"34890576\"',1);${W}" \
  guards "" 181

finish "negtest850"
