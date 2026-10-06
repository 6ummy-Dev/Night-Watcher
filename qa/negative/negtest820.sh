#!/bin/bash
# negtest820 — 6.7.1. A bad settings key does not hide the progress.
# The two keys used to share one try. A truncated settings key latched the
# progress read, and the clear then erased marks that had parsed.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 176: settings and progress are separate reads"

run_case "a bad settings key fails the progress read again" \
  "fails the progress read when the settings key does not parse" \
  "${P}a='    if(!o || typeof o !== \"object\") throw new Error(\"not a payload\");';assert a in s;s=s.replace(a,'    if(!o || typeof o !== \"object\" || (sraw && (!so || typeof so !== \"object\"))) throw new Error(\"not a payload\");',1);${W}" \
  guards "" 176

run_case "the settings parse shares the progress try" \
  "shares the progress try" \
  "${P}a='    try{\n      so = JSON.parse(sraw);\n      if(!so || typeof so !== \"object\") so = null;\n    }catch(e){ so = null; }';assert a in s;s=s.replace(a,'      so = JSON.parse(sraw);\n      if(!so || typeof so !== \"object\") so = null;',1);${W}" \
  guards "" 176

run_case "Progress drops the download of the unread bytes" \
  "no longer offers the unread progress bytes" \
  "${P}a='data-act=\"salvage\"';assert a in s;s=s.replace(a,'data-act=\"gone\"',1);${W}" \
  guards "" 176

run_case "the download no longer sends the unread bytes" \
  "does not download the unread progress bytes" \
  "${P}a='download(\"night-watcher-unreadable.txt\", salvageRaw)';assert a in s;s=s.replace(a,'download(\"night-watcher-unreadable.txt\", \"\")',1);${W}" \
  guards "" 176

finish "negtest820"
