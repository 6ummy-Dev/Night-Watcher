#!/usr/bin/env bash
# Claude Code hook (PostToolUse, Edit|Write). Agent rules live in CLAUDE.md
# and AGENTS.md; this hook is not the weekday desk. After an edit in this
# repo, run the build guards (about 2 s). Silent when green. When red, the
# failing "✗ §NN ..." lines go back to the session as context and a one-line
# notice goes to the person. It never blocks: a multi-file change (a version
# bump across index.html, sw.js and CHANGELOG.md, say) is legitimately red
# halfway through.
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
FILE="$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_input&&j.tool_input.file_path)||(j.tool_response&&j.tool_response.filePath)||"")}catch(e){}})')"

case "$FILE" in "$ROOT"/*) ;; *) exit 0 ;; esac                       # outside the repo
case "$FILE" in "$ROOT"/node_modules/*|"$ROOT"/.git/*|"$ROOT"/qa/.shots/*) exit 0 ;; esac
[ -f "$ROOT/qa/guards.js" ] || exit 0

OUT="$(cd "$ROOT" && node qa/guards.js 2>&1)" && exit 0

FAILS="$(printf '%s\n' "$OUT" | grep '✗' | head -15)"
[ -n "$FAILS" ] || FAILS="$(printf '%s\n' "$OUT" | tail -15)"
REL="${FILE#"$ROOT"/}"
node -e '
const [rel, fails] = process.argv.slice(1);
process.stdout.write(JSON.stringify({
  systemMessage: "Guards are red after editing " + rel,
  hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext:
    "qa/guards.js went red after this edit to " + rel + ":\n" + fails +
    "\nIf this is the middle of a multi-file change, carry on and re-run `node qa/guards.js` at the end. " +
    "Otherwise fix it before moving on. Do not run `npm run bless` to silence a guard unless the change is deliberate and the owner is cutting a release." }
}));' "$REL" "$FAILS"
exit 0
