# Reporting a problem

Night Watcher is a single static page. It has no server, no accounts, no
database, and it never transmits your progress anywhere — so the blast radius
of most bugs is small. That said, if you find something, please say so.

## How

Use **GitHub's private vulnerability reporting** on this repository
(Security → Report a vulnerability). That opens a channel only the maintainer
can see. Please don't open a public issue for anything security-related until
it's fixed.

## What is in scope

- Anything that could execute code in a visitor's browser
- Anything that could exfiltrate saved progress off the device
- Anything that could corrupt or silently discard saved progress
- A backup code or restore link that resolves to somebody else's progress

## What is not

- The Cloudflare Web Analytics beacon. It is deliberate, disclosed in the
  footer, sets no cookies and never sees which entries you watch.
- Missing HTTP security headers. What can be set in a meta tag, is. The
  canonical site is served by Cloudflare Workers, which can set headers; the
  old GitHub Pages address, which is kept alive so returning readers can carry
  their progress across, cannot. Reports about headers on the Pages address are
  known and out of scope.
- Content disputes about watch order. Those are issues, not vulnerabilities.

## What to expect

A single maintainer, working on this in spare time. You'll get an
acknowledgement as soon as it's read, and a fix as fast as is reasonable for
what it is.
