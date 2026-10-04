# Night Watcher: notes for Cursor

Cursor is the weekday build desk. Read the rules. Do not restate them, and do not edit them.

## Read first

- `qa/hww.js`
- `CLAUDE.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `NOTES.md`
- `RELEASING.md`

The five nocturne files are the owner's. Do not edit them. Read them only when the change touches the paper or the desk: `nocturne/BRIEF.md`, `nocturne/CASEBOOK.md`, `nocturne/MORGUE.md`, `nocturne/REPORTER.md`, `nocturne/VOICE.md`. The one exception already made, the colophon sentence in `BRIEF.md`, is not a license to edit them again.

## How weekday work lands

- Push as the Cursor agent. Not as the owner. Not as `nocturne-night-final[bot]`.
- Open a pull request. Do not merge. Do not push `main`. Do not approve.
- Do not bless a check to make it green. A version bump changes `BUILD` inside the hashed script. Guard 43 then wants the CSP hash and `qa/script-bytes.json` updated with `npm run bless`. Read that diff. Do not bless any other red check.
- A merge to `main` publishes the site. Do not run `npm run deploy` on a normal release. That command is recovery, in `RELEASING.md`.
- The Sunday desk does not move. Its fence stays keyed on `nocturne-night-final[bot]`. If a Night Final is open, this pull request waits. The sentence is in `qa/hww.js`.
