#!/bin/bash
# negtest840 — 6.7.4. Reader view keeps the issue, the disclosure, and the
# byline (180). The headline carries no strip-word class, the mast date is
# not classed as a byline, the colophon follows the footer inside the article,
# a weekly kicker separates its labels with a comma, a caption keeps a space
# before its credit, and every paper page names its author.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

N="$(pro qa/nocturne.js)"

echo "--- 180: reader view keeps the issue, the disclosure, and the byline"

run_case "the headline is classed banner again" \
  "the headline still carries a reader-view strip word" \
  "${N}a='<article>\\\\n<h1>';assert s.count(a)==1;s=s.replace(a,'<article>\\\\n<h1 class=\"banner\">',1);${W}" \
  guards "" 180

run_case "the mast date is classed dateline again" \
  "the mast date is still classed as a byline" \
  "${N}a='<p class=\"issued\">';assert s.count(a)==1;s=s.replace(a,'<p class=\"dateline\">',1);${W}" \
  guards "" 180

run_case "the colophon moves back inside the footer" \
  "the colophon sits inside the footer, so reader view drops the disclosure" \
  "${N}a=\"'</footer>\\\\n' +\";assert s.count(a)==1;s=s.replace(a,\"'<p class=\\\"colophon\\\">x</p>\\\\n</footer>\\\\n' +\",1);${W}" \
  guards "" 180

run_case "the kicker drops the comma between its labels" \
  "a weekly kicker has no comma between its labels" \
  "${N}a=', </span><span class=\"beat\">';assert s.count(a)==1;s=s.replace(a,'</span><span class=\"beat\">',1);${W}" \
  guards "" 180

run_case "the caption runs into its credit" \
  "a caption runs into its credit" \
  "${N}a=\"esc(im.alt) + ' </span><span>'\";assert s.count(a)==1;s=s.replace(a,\"esc(im.alt) + '</span><span>'\",1);${W}" \
  guards "" 180

run_case "the paper drops its author" \
  "has no author meta" \
  "${N}a='<meta name=\"author\" content=\"Night Watcher\">\\\\n';assert s.count(a)==1;s=s.replace(a,'',1);${W}" \
  guards "" 180

run_case "the mast labels lose the space beside the diamond" \
  "a diamond is the only thing between two labels" \
  "${N}a='<span>\\' + a + \\' </span>';assert s.count(a)==1;s=s.replace(a,'<span>\\' + a + \\'</span>',1);${W}" \
  guards "" 180

finish "negtest840"
