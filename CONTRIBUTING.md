# Contributing to Night Watcher

One fan, working solo, with a QA harness that argues back. This is the map
of the documents, how a change lands, and the two checklists nothing else
carried in writing: adding a guard section, and adding a negative suite.

## Which document answers what

| Question | Read |
| --- | --- |
| What is this, what does it promise, what does it refuse, how do I run and deploy it, what belongs in the catalogue | `README.md` |
| How is the script laid out; what is in `S`; how is a count made; how does a hash become a view; what does one render do | `ARCHITECTURE.md` |
| What exactly is saved, what is in a backup code or a JSON export, and how each is read back | `DATA-MODEL.md` |
| Why is this line shaped this way (per symbol, per selector, per rule), in the present tense | `NOTES.md` |
| How did it come to be this way — the post-mortems and release essays | `NOTES-history.md` |
| What shipped in each release, newest first | `CHANGELOG.md` (4.0.0 onward; `CHANGELOG-archive.md` holds 1.x–3.x) |
| What is the release checklist, the wire checks, the rollback | `RELEASING.md` |
| What is the exact rule and the failure it was written after | the comment above each section of `qa/guards.js` |
| How to report a security issue | `SECURITY.md` |

## How a change lands

Releases ship as zips the owner uploads to `main` — never pushes, never
pull requests — so "one change, one commit, one CHANGELOG entry" is the
whole workflow. The version rule is in `README.md` ("Releasing"); the
checklist is `RELEASING.md`. Before a cut, the full negative wall runs, not
a selection.

The tree was sealed at 4.5.3 (`README.md`, "Status"). The seal is a record
that the tree was audited three times and each cut shipped its audit whole;
it does not stop a change, it means every later change is a decision with
an entry, and a rollback is one too.

Who blesses: `npm run bless` is run by whoever cuts the release, on the
tree being cut, after the share card if the catalogue moved. It rewrites
files (`README.md`, "Checks", lists every one); read the diff.

## Adding a guard section

1. **Append, never insert.** Sections are numbered in file order and guard
   66 enforces it; the next number is one past the last header. Header
   shape: `/* ---------- N. Title ---------- */` at column 0 (section 107
   refuses a nested one without a written reason).
2. **Add the number and title to the INDEX** at the top of `guards.js`,
   under the group it belongs to (guard 66 checks that too).
3. **Write the reason above the code** — the failure that produced the rule,
   in the section's own comment. Every section in the file has one.
4. **Prefer the AST predicates** (`fnNode`, `fnCalls`, `topVar`, `objProp`,
   `schemaRow`, `srcOf`) over pinning exact source text, unless the exact
   text is the reviewed artefact (a wording, a CSP directive, a header
   value). A pin on spelling goes red on the next refactor; a predicate on
   behaviour does not.
5. **Fail, don't warn, when the thing you check is missing.** `warn()` is
   for advice a local clone can act on; in CI any warning is a failure.
6. **Write the negative fixture in the same commit** (below). Guard 138
   fails the build on a section with no fixture unless its number is added
   to `STILL_OWED` with the reason in the commit — and that list is empty
   and only shrinks.
7. **Move the counts.** The header block in `docs/index.html` and
   `NOTES.md` state the section count; guard 65 checks both.
8. `npm test`, then the suite you wrote, then the full wall before the cut.

## Adding a negative suite

A suite is `qa/negative/negtestNNN.sh`: a shebang, a header comment naming
the release and the sections it covers, the `_lib.sh` line, its fixtures,
and `finish "<label>"`. Numbers are a plain +10 counter since negtest340.

1. **One fixture per claim**, as a literal `run_case` line — guard 65
   counts lines, so no loops. Shape:

   ```
   run_case "<label>" \
     "<substring of the failure text>" \
     "${P}a='<exact source to break>';assert a in s;s=s.replace(a,'<broken>');${W}" \
     guards "" <section>
   ```

   `${P}`/`${W}` open and write `docs/index.html`; `pro <path>` gives the
   same prologue for any other file. The `assert a in s` is not optional: a
   mutation that finds nothing must report SETUP BROKE, not pass.
2. **Name the section.** The sixth argument pins the match to that
   section's own `§NN` line, so a phrase another section also prints cannot
   pass the fixture. The count of fixtures that pass no section is pinned
   (`NO_SECT_PINNED`) and only goes down.
3. **Pick an expect of twelve characters or more** that appears in the
   `fail()` text and nowhere else in the section's prose; the coverage map
   is a substring match.
4. **A `green_case` proves a guard stays quiet** on a mutation that must not
   fire it. It asserts the exit code and is not harvested for coverage.
5. **Smoke fixtures** pass `smoke <phase>` (`main`, `css`, `blocked`) as the
   fourth and fifth arguments so the run stops at the phase that can see
   the mutation.
6. **Add the suite to a CI shard** — a `pick:` pattern in
   `.github/workflows/qa.yml` (guard 113 fails the build if no shard runs
   it), repacking by weight so the four shards stay level; then move the
   counts in `README.md` ("Checks") and `qa.yml`'s cost comment (guard 65
   checks both, and the guards/smoke split).
7. Run it alone (`bash qa/negative/run-all.sh NNN`), then the wall.

## Two things no automated check covers

The save-to-file permission re-prompt on a handle restored from IndexedDB
needs a manual pass in desktop Chrome whenever that code is touched. And the
"no spoilers" promise is read by a person: any entry whose `d:` changed gets
re-read against the rule — describe the premise, never the turn.
