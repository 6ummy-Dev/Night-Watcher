#!/bin/bash
# negtest860 — 6.8.0. The wire and the ping (182). The feed names a WebSub
# hub, declares the content namespace, lists every story per item in
# content:encoded and a category per beat; feed.css hides the machine lines;
# the newest issue, and only it, carries a news entry, under a namespace
# docs/sitemap.xml declares; the IndexNow key is served; qa.yml's ping job
# keeps its shape and runs no code; the label warning fires where it should.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"
Y="$(pro .github/workflows/qa.yml)"
S="$(pro docs/sitemap.xml)"

echo "--- 182: the wire and the ping"

run_case "the feed drops its hub" \
  "the feed names no WebSub hub" \
  "${N}a=\"'  <atom:link href=\\\"' + HUB + '\\\" rel=\\\"hub\\\"/>\\\\n' +\";assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 182

run_case "the feed's content namespace changes" \
  "the feed does not declare the content namespace" \
  "${N}a='xmlns:content=\"http://purl.org/rss/1.0/modules/content/\"';assert s.count(a)==1;s=s.replace(a,'xmlns:content=\"http://purl.org/rss/1.0/modules/content\"',1);${W}" \
  guards "" 182

run_case "an item's body skips the first story" \
  "an item's content:encoded does not list every story" \
  "${N}a=\"'<li><a href=\\\"' + u + '#s' + (i + 1) + '\\\">'\";assert s.count(a)==1;s=s.replace(a,\"'<li><a href=\\\"' + u + '#s' + (i + 2) + '\\\">'\",1);${W}" \
  guards "" 182

run_case "an item loses its categories" \
  "an item's categories are not the issue's beats" \
  "${N}a=\"beatsOf(is.fm).map(function(b){ return '    <category>' + b + '</category>\\\\n'; }).join(\\\"\\\")\";assert s.count(a)==1;s=s.replace(a,\"''\",1);${W}" \
  guards "" 182

run_case "feed.css shows the categories" \
  "feed.css shows the machine lines" \
  "${N}a='pubDate,category,channel>atom|link,*|encoded{display:none;}';assert s.count(a)==1;s=s.replace(a,'pubDate,channel>atom|link,*|encoded{display:none;}',1);${W}" \
  guards "" 182

run_case "the newest issue loses its news entry" \
  "the newest issue has no news entry" \
  "${N}a='(i === 0 ? newsEntry(is) : \"\")';assert s.count(a)==1;s=s.replace(a,'\"\"',1);${W}" \
  guards "" 182

run_case "every issue carries a news entry" \
  "a news entry sits on an older issue" \
  "${N}a='(i === 0 ? newsEntry(is) : \"\")';assert s.count(a)==1;s=s.replace(a,'newsEntry(is)',1);${W}" \
  guards "" 182

run_case "the sitemap drops the news namespace" \
  "docs/sitemap.xml does not declare the news namespace" \
  "${S}a=' xmlns:news=\"http://www.google.com/schemas/sitemap-news/0.9\">';assert s.count(a)==1;s=s.replace(a,'>',1);${W}" \
  guards "" 182

run_case "the IndexNow key file goes" \
  "the IndexNow key file is not served" \
  "import os;os.remove('docs/3e6082eed9f040d5bc8ab07531bf58b9.txt')" \
  guards "" 182

run_case "the ping job stops waiting for the browser check" \
  "it no longer runs after the three checks pass, on a push to main only" \
  "${Y}a='needs: [test, negative, browser]';assert s.count(a)==1;s=s.replace(a,'needs: [test, negative]',1);${W}" \
  guards "" 182

run_case "the ping job runs on every push" \
  "it no longer runs after the three checks pass, on a push to main only" \
  "${Y}a=\"if: github.event_name == 'push' && github.ref == 'refs/heads/main'\";assert s.count(a)==1;s=s.replace(a,\"if: github.event_name == 'push'\",1);${W}" \
  guards "" 182

run_case "the ping job stops waiting for the live sitemap" \
  "it no longer waits until the live sitemap is the tree's" \
  "${Y}a='cmp -s /tmp/live-sitemap.xml docs/sitemap.xml';assert s.count(a)==1;s=s.replace(a,'test -s /tmp/live-sitemap.xml',1);${W}" \
  guards "" 182

run_case "the ping job posts another key" \
  "it no longer uses the key the site serves" \
  "${Y}a='KEY=3e6082eed9f040d5bc8ab07531bf58b9';assert s.count(a)==1;s=s.replace(a,'KEY=0000000000000000000000000000dead',1);${W}" \
  guards "" 182

run_case "the ping job posts elsewhere" \
  "it no longer posts the addresses that moved to IndexNow" \
  "${Y}a='https://api.indexnow.org/indexnow';assert s.count(a)==1;s=s.replace(a,'https://example.invalid/indexnow',1);${W}" \
  guards "" 182

run_case "the ping job forgets the root" \
  "it no longer names the root beside the paper's addresses" \
  "${Y}a='\"https://nightwatcher.life/\" \$URLS';assert s.count(a)==1;s=s.replace(a,'\$URLS',1);${W}" \
  guards "" 182

run_case "the ping job stops telling the hub" \
  "it no longer tells the hub the feed moved" \
  "${Y}a='-d hub.mode=publish -d hub.url=https://nightwatcher.life/nocturne/feed.xml https://pubsubhubbub.appspot.com/';assert s.count(a)==1;s=s.replace(a,'-d hub.mode=publish -d hub.url=https://nightwatcher.life/nocturne/feed.xml https://example.invalid/',1);${W}" \
  guards "" 182

run_case "the ping job runs the tree's code" \
  "ping job runs code" \
  "${Y}a='      - name: WebSub, the feed moved';assert s.count(a)==1;s=s.replace(a,'      - run: npm run deploy\n      - name: WebSub, the feed moved',1);${W}" \
  guards "" 182

run_case "the label warning never fires" \
  "the label warning does not fire when the title is off the slug and the hero alt" \
  "${N}a='  want.forEach(function(w){';assert s.count(a)==1;s=s.replace(a,'  [].forEach(function(w){',1);${W}" \
  guards "" 182

run_case "the label warning ignores the slug and the alt" \
  "the label warning fires on a slug or an alt that carries the title" \
  "${N}a='var where = [fold(is.id), fold(hero && hero.alt)];';assert s.count(a)==1;s=s.replace(a,'var where = [\"\", \"\"];',1);${W}" \
  guards "" 182

finish "negtest860"
