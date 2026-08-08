#!/bin/bash
# Negative-test 3.4.2 — the headers, the fonts' discovery order, and the two
# text files nothing else reads.
#
# Everything this release touches is invisible when it works and silent when it
# breaks. A dead Permissions-Policy token throws a console warning nobody reads;
# a missing font preload costs 141ms nobody times; a typo in robots.txt is
# ignored by every crawler without a word. None of it changes a pixel, so none
# of it can be caught by looking — only by refusing the shapes.
#
# The section-104 fixtures below matter for a second reason. That section pins
# _headers as a literal array precisely because the file is not self-guarding:
# adding a header there and not to the array ships a header nothing watches,
# and nothing fails when someone later deletes it. These fixtures are the proof
# that the array is doing that job for the three headers 3.4.2 added.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

HP="import io;p='docs/_headers';s=io.open(p,encoding='utf-8').read();"
RP="import io;p='docs/robots.txt';s=io.open(p,encoding='utf-8').read();"
HW="io.open(p,'w',encoding='utf-8').write(s)"

# 3.4.3: THIS WAS TWO CASES AND IS NOW ONE. The usb fixture came out with the
# token's removal from DEAD104 — `usb` is the live feature token for WebUSB,
# Chrome accepts it, and 3.4.2 removed it on a console warning from a scanner's
# own engine. A fixture aimed at a rule that no longer exists would pass forever
# while testing nothing, which is the failure this whole directory exists to
# prevent. `interest-cohort` keeps its fixture because it keeps its rule.
#
# The anchor below also had to move: _headers now ends the policy with usb=(),
# so the old literal would not be found and the mutation would silently match
# nothing. A mutation that changes nothing is a negative test that proves
# nothing.
echo "--- 104: the dead Permissions-Policy token does not come back"

run_case "interest-cohort creeps back in" \
  "declares interest-cohort in Permissions-Policy" \
  "${HP}a='  Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), usb=()';assert a in s
s=s.replace(a,a+', interest-cohort=()',1);${HW}"

echo "--- 104: the headers 3.4.2 added are watched, not just present"

run_case "the CORP header is deleted again" \
  "no longer sets Cross-Origin-Resource-Policy" \
  "${HP}a='  Cross-Origin-Resource-Policy: same-origin\n';assert a in s
s=s.replace(a,'',1);${HW}"

run_case "the sitemap Link header is deleted" \
  "no longer sets Link: sitemap" \
  "${HP}a='  Link: <https://nightwatcher.life/sitemap.xml>; rel=';assert a in s
i=s.index(a);j=s.index('\n',i);s=s[:i]+s[j+1:];${HW}"

run_case "the canonical Link header points somewhere else" \
  "no longer sets Link: canonical" \
  "${HP}a='  Link: <https://nightwatcher.life/>; rel=';assert a in s
s=s.replace(a,'  Link: <https://example.org/>; rel=',1);${HW}"

echo "--- 104: the icons keep a cache policy"

run_case "the icon.svg cache rule is dropped" \
  "has no /icon.svg rule" \
  "${HP}a='\n/icon.svg\n';i=s.index(a);j=s.index('\n/favicon.ico\n');s=s[:i]+s[j:];${HW}"

run_case "favicon.ico goes back to revalidating every visit" \
  "no longer sets Cache-Control on /favicon.ico" \
  "${HP}a='/favicon.ico\n  Cache-Control: public, max-age=86400';assert a in s
s=s.replace(a,'/favicon.ico\n  Cache-Control: public, max-age=0',1);${HW}"

echo "--- 124: every face is asked for before the CSS finds it"

run_case "a face loses its preload" \
  "CSS-discovered faces are not requested" \
  "${P}a='<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/ibm-plex-mono-latin-600-normal.woff2\">\n';assert a in s
s=s.replace(a,'',1);${W}"

run_case "a preload loses its crossorigin attribute" \
  "has no crossorigin attribute" \
  "${P}a='<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/anton-latin-400-normal.woff2\">';assert a in s
s=s.replace(a,'<link rel=\"preload\" as=\"font\" type=\"font/woff2\" href=\"fonts/anton-latin-400-normal.woff2\">',1);${W}"

run_case "a preload loses its as=font" \
  "without it the browser cannot prioritise" \
  "${P}a='<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/limelight-latin-400-normal.woff2\">';assert a in s
s=s.replace(a,'<link rel=\"preload\" type=\"font/woff2\" crossorigin href=\"fonts/limelight-latin-400-normal.woff2\">',1);${W}"

run_case "a preload survives the face it was for" \
  "which no @font-face uses" \
  "${P}a='<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/anton-latin-400-normal.woff2\">';assert a in s
s=s.replace(a,a+'\n<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"fonts/retired-latin-400-normal.woff2\">',1);${W}"

echo "--- 125: robots.txt states a position on AI use"

run_case "the Content-Signal line is deleted" \
  "declares no Content-Signal line" \
  "${RP}i=s.index('Content-Signal:');j=s.index('\n',i);s=s[:i]+s[j+1:];${HW}"

run_case "one of the three signals loses its value" \
  "does not give ai-input a value" \
  "${RP}a='Content-Signal: ai-train=no, search=yes, ai-input=yes';assert a in s
s=s.replace(a,'Content-Signal: ai-train=no, search=yes, ai-input=maybe',1);${HW}"

run_case "the sitemap line leaves robots.txt" \
  "no longer names the sitemap" \
  "${RP}a='Sitemap: https://nightwatcher.life/sitemap.xml';assert a in s
s=s.replace(a,'Sitemap: https://example.org/sitemap.xml',1);${HW}"

run_case "robots.txt stops allowing the root" \
  "no longer allows every user-agent" \
  "${RP}a='Allow: /';assert a in s;s=s.replace(a,'Disallow: /',1);${HW}"

echo "--- 39: commerce vocabulary does not come back to the JSON-LD"

run_case "the Offer node is restored" \
  "carries an Offer again" \
  "${P}a='\"isAccessibleForFree\":true';assert a in s
s=s.replace(a,a+',\"offers\":{\"@type\":\"Offer\",\"price\":\"0\",\"priceCurrency\":\"USD\"}',1);${W}"

finish "negtest340"
