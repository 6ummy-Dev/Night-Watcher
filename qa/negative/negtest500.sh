#!/bin/bash
# negtest500 — 4.2.5. The hygiene commit: the index guard, the shape pin,
# the CI parser gate, and the restore-path BYID.
#
# 4.2.4's release note claimed .wrangler/state was out of the index and the
# live tree still tracked it — a sentence stating a fact the tree does not
# hold, in the release meant to close the audit loop. Section 144 reads the
# git index itself and refuses the claim; the first fixture plants a fake
# index carrying the path and demands the refusal. Section 145 pins the
# extract shape (a top-level function written as a var assignment would
# empty fnIndex() without one red); the second fixture writes one and
# demands §145 notice. The third takes the new BYID gate off dedupeLog and
# demands §35 catch the phantom. The fourth mirrors negtest300's jsdom
# fixture for Acorn: under CI a missing parser must FAIL, not warn — its
# failure fires before section 1, so it carries no sect and the pin in 138
# moves 762 → 763 for exactly the reason its comment names.
. "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "--- 144: the index cannot carry what the release note denied"

run_case "a git index tracking wrangler state is refused" \
  ".wrangler/state is still in the git index" \
  "import io,os
os.makedirs('.git',exist_ok=True)
io.open('.git/index','w').write('DIRC fake-index .wrangler/state/v3/cache/miniflare-CacheObject/metadata.sqlite')" \
  guards "" 144

echo "--- 145: a style shift cannot empty the extractor"

run_case "a top-level function arrives as a var assignment" \
  "written as variable assignments" \
  "${P}a='var BUILD = ';assert a in s
s=s.replace(a,'var sneakyHelper = function(){ return 1; };\nvar BUILD = ',1);${W}" \
  guards "" 145

echo "--- C-5: the restore path keeps the log inside the catalogue"

run_case "the BYID gate comes off dedupeLog" \
  "kept a logged id the catalogue does not carry" \
  "${P}a='if(!e || !e.id || !BYID[e.id] || !validTs(e.ts)) return;';assert a in s
s=s.replace(a,'if(!e || !e.id || !validTs(e.ts)) return;',1);${W}" \
  guards "" 35

echo "--- Q-fn2: CI without the parser is a failure, not a warning"

run_case "acorn goes missing where a downgrade would be silent" \
  "a downgraded parser is not a passing parser" \
  "import io;p='qa/guards.js';s=io.open(p,encoding='utf-8').read()
a='try { acorn = require(\"acorn\"); }';assert a in s
s=s.replace(a,'try { acorn = require(\"acorn-not-installed\"); }',1)
b='if(!acorn && process.env.CI){';assert b in s
s=s.replace(b,'if(!acorn && true){',1)
io.open(p,'w',encoding='utf-8').write(s)"

finish "4.2.5 hygiene fixtures"
