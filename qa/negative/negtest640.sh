#!/bin/bash
# negtest640 — 4.9.3, the named corrupt-backup sequence.
#
# Two smoke fixtures, one per half of the sequence's claim: a restore door
# that stops refusing containerless JSON is caught by the refusal walk, and
# an importCode() that stops flagging a truncated body is caught by the
# tolerant half ("merges what parsed and says so").
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- the corrupt-backup sequence still bites"

run_case "the restore door accepts containerless JSON" \
  "corrupt backup: every corrupt shape is refused whole" \
  "${P}a='    if(!wBox && !kBox && !rBox) return null;';assert a in s;s=s.replace(a,'    if(false) return null;',1);${W}" \
  smoke main

run_case "a truncated code stops saying it was cut" \
  "a truncated code merges what parsed and says so" \
  "${P}a='             cut:(!((\"S\" in seg)';assert a in s;s=s.replace(a,'             cut:false&&(!((\"S\" in seg)',1);${W}" \
  smoke main

rm -rf "$NEG"
finish "negtest640 (4.9.3 — the corrupt-backup sequence, named)"
