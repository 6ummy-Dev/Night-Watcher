#!/bin/bash
# Negative-test every guard added or changed in 1.6.3.
set -u
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NEG="${NEGDIR:-$(mktemp -d)}/tree"
PASS=0; FAILED=0

run_case () {
  local label="$1"; local expect="$2"; local pyscript="$3"
  rm -rf "$NEG"; mkdir -p "$NEG"
  tar -cf - -C "$SRC" --exclude=node_modules --exclude=.git . | tar -xf - -C "$NEG"
  [ -d "$SRC/node_modules" ] && ln -s "$SRC/node_modules" "$NEG/node_modules"
  ( cd "$NEG" && python3 -c "$pyscript" ) || { echo "  SETUP BROKE  $label"; FAILED=$((FAILED+1)); return; }
  local out
  out=$(cd "$NEG" && node qa/guards.js 2>&1)
  if printf '%s' "$out" | grep -qF "$expect"; then
    echo "  PASS  $label"; PASS=$((PASS+1))
  else
    echo "  FAIL  $label"
    echo "        expected: $expect"
    printf '%s\n' "$out" | grep -E '✗' | sed 's/^/        got: /'
    FAILED=$((FAILED+1))
  fi
}

P="import io;p='docs/index.html';s=io.open(p,encoding='utf-8').read();"
N="import io;p='NOTES.md';s=io.open(p,encoding='utf-8').read();"
G="import io;p='qa/guards.js';s=io.open(p,encoding='utf-8').read();"
W="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 58: Recent activity stays level with Then"
run_case "an Activity row is padded roomier than a queue row" \
  "history must not be roomier than the queue it sits under" \
  "${P}a='.arow{display:flex;align-items:center;gap:9px;padding:9px 0';assert a in s;s=s.replace(a,'.arow{display:flex;align-items:center;gap:9px;padding:16px 0');${W}"

# RETIRED in 1.6.6. This mutated ACTIVITYMAX and expected guard 58's ceiling to
# catch it. Section 34 pins the value exactly, so the ceiling could never fire
# and was deleted \u2014 a check that cannot fail is not coverage. The live test for
# the same rule is "the row count drifts from three" in negtest166.sh.

run_case "a second labelled span goes back on the row" \
  "stops it being one line" \
  "${P}a=\"'<span class=\\\"at\\\">'+esc(f.t)+'</span>'+\";assert a in s;s=s.replace(a,\"'<span class=\\\"at\\\">'+esc(f.t)+'</span>'+'<span class=\\\"ad\\\">x</span>'+\");${W}"

run_case "the row goes back to a grid" \
  "the Activity row is a grid again" \
  "${P}a='.arow{display:flex;';assert a in s;s=s.replace(a,'.arow{display:grid;');${W}"

run_case "the row is allowed to wrap" \
  "the Activity row can wrap" \
  "${P}a='.arow{display:flex;align-items:center;';assert a in s;s=s.replace(a,'.arow{display:flex;flex-wrap:wrap;align-items:center;');${W}"

run_case "the title wraps instead of truncating" \
  "the Activity title wraps instead of truncating" \
  "${P}a='line-height:1.15;color:var(--dim);\n  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}';assert a in s;s=s.replace(a,'line-height:1.15;color:var(--dim);}');${W}"

run_case "the stars come off the row" \
  "no longer carry their stars" \
  "${P}a=\"'<span class=\\\"at\\\">'+esc(f.t)+'</span>'+\n            starRow(f)+'</div>';\";assert a in s;s=s.replace(a,\"'<span class=\\\"at\\\">'+esc(f.t)+'</span>'+'</div>';\");${W}"

run_case "the reveal comes back" \
  "Recent activity is behind a tap again" \
  "${P}a='data-act=\\\"watched\\\" data-id=';assert a in s;s=s.replace(a,'data-act=\\\"apeek\\\" data-id=',1);${W}"

run_case "badges come back to Activity" \
  "drawing badges again" \
  "${P}a=\"'<span class=\\\"at\\\">'+esc(f.t)+'</span>'+\";assert a in s;s=s.replace(a,\"'<div class=\\\"abadge\\\">'+badges(f)+'</div>'+\");${W}"

# 64 (the year is not printed twice) — the case that lived here targeted the
# filter inside metaOf(). 1.6.4 moved it into subOf(), which every reader now
# goes through; the replacement cases are in negtest164.sh.

echo "--- 65: the file points at where its reasoning went"
run_case "the header block is deleted" \
  "the header block is gone from the top of the script" \
  "${P}import re;a=re.search(r'<script>\\s*/\\*[\\s\\S]*?\\*/',s).group(0);s=s.replace(a,'<script>');${W}"

run_case "the header stops naming NOTES.md" \
  "no longer names NOTES.md" \
  "${P}a='NOTES.md and CHANGELOG.md';assert a in s;s=s.replace(a,'CHANGELOG.md');${W}"

run_case "NOTES.md is deleted" \
  "NOTES.md is missing and the header block promises it" \
  "import os;os.remove('NOTES.md')"

run_case "explanatory comments creep back in" \
  "comments in index.html" \
  "${P}a='function metaOf';assert a in s;s=s.replace(a,'/* a helpful note */\nfunction metaOf');${W}"

run_case "the slug-freeze warning is removed" \
  "the slug-freeze warning is gone from above PATH" \
  "${P}a='IDs in i:\"...\" are FROZEN';assert a in s;s=s.replace(a,'IDs are fine to change');${W}"

run_case "NOTES.md documents something the file no longer has" \
  "index.html no longer has" \
  "${N}a='## Script';assert a in s;s=s.replace(a,'## Script\n\n### \`vanishedHelper()\`\n\nnotes for a function that is gone\n');${W}"

echo "--- 66: the numbering still enforces itself"
run_case "a new section is renumbered out of order" \
  "guard sections are out of order" \
  "${G}a='/* ---------- 64. The year is not printed twice';assert a in s;s=s.replace(a,'/* ---------- 67. The year is not printed twice');${W}"

run_case "a new section is missing from the INDEX" \
  "is missing from the INDEX" \
  "${G}a='     65   The file points at where its reasoning went\n';assert a in s;s=s.replace(a,'');${W}"

rm -rf "$NEG"
echo
echo "1.6.3 negative tests: $PASS passed, $FAILED failed"
[ "$FAILED" -eq 0 ]
