#!/bin/bash
# Negative-test every guard added or changed in 1.6.4.
set -u
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NEG="${NEGDIR:-$(mktemp -d)}/tree"
PASS=0; FAILED=0

run_case () {
  local label="$1"; local expect="$2"; local pyscript="$3"; local suite="${4:-guards}"
  rm -rf "$NEG"; mkdir -p "$NEG"
  tar -cf - -C "$SRC" --exclude=node_modules --exclude=.git . | tar -xf - -C "$NEG"
  [ -d "$SRC/node_modules" ] && ln -s "$SRC/node_modules" "$NEG/node_modules"
  ( cd "$NEG" && python3 -c "$pyscript" ) || { echo "  SETUP BROKE  $label"; FAILED=$((FAILED+1)); return; }
  local out
  out=$(cd "$NEG" && node qa/$suite.js 2>&1)
  if printf '%s' "$out" | grep -qF "$expect"; then
    echo "  PASS  $label"; PASS=$((PASS+1))
  else
    echo "  FAIL  $label"
    echo "        expected: $expect"
    printf '%s\n' "$out" | grep -E '✗|FAIL' | sed 's/^/        got: /' | head -3
    FAILED=$((FAILED+1))
  fi
}

P="import io;p='docs/index.html';s=io.open(p,encoding='utf-8').read();"
W="io.open(p,'w',encoding='utf-8').write(s)"

echo "--- 62: every tab clears the viewport"
run_case "the app goes back to exactly one viewport" \
  "it has to clear the small viewport by a pixel" \
  "${P}a='min-height:calc(100svh + 1px)';assert a in s;s=s.replace(a,'min-height:100dvh');${W}"

run_case "the app sets no min-height at all" \
  "#app sets no min-height" \
  "${P}a='min-height:calc(100svh + 1px);';assert a in s;s=s.replace(a,'');${W}"

echo "--- 64: one filter, every reader"
run_case "subOf stops skipping a sub that is only the year" \
  "subOf() no longer skips a sub that is only the year" \
  "${P}a='return (f.sub && f.sub !== String(f.y)) ? f.sub : \"\";';assert a in s;s=s.replace(a,'return f.sub || \"\";');${W}"

run_case "the queue goes back to reading .sub directly" \
  "reads .sub directly instead of subOf()" \
  "${P}a='(subOf(x) ? \\' <span style=\\\"color:var(--dim);font-size:11px\\\">\\'+esc(subOf(x))';assert a in s;s=s.replace(a,'(x.sub ? \\' <span style=\\\"color:var(--dim);font-size:11px\\\">\\'+esc(x.sub)');${W}"

echo "--- smoke: no CSS rule is left behind"
run_case "a rule outlives the markup it styled" \
  "every CSS rule matches something in some state" \
  "${P}a='.arow .at{';assert a in s;s=s.replace(a,'.arow .ghostrule{color:red;}\n.arow .at{');${W}" \
  "smoke"

rm -rf "$NEG"
echo
echo "1.6.4 negative tests: $PASS passed, $FAILED failed"
[ "$FAILED" -eq 0 ]
