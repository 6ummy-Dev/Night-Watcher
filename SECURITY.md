# Reporting a problem

Night Watcher is a single static page. It has no accounts, no database, and it
never transmits your progress anywhere; the one piece of code that runs at the
edge is `worker.js`, which negotiates the root's markdown representation and
answers `/.well-known/api-catalog`, and stores nothing — so the blast radius of
most bugs is small. That said, if you find something, please say so.

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
- `worker.js` answering a request with something other than the file it names, or with headers weaker than `docs/_headers` declares

## What is not

- Cloudflare's server-side request counting. It is what any host sees by
  answering a request at all: it sets no cookies, adds nothing to the page and
  never sees which entries you watch. The client-side Web Analytics beacon that
  used to sit here was removed in 3.2.0, and the page now fetches nothing.
- Missing HTTP security headers on any address other than `nightwatcher.life`.
  The canonical site — now the only one — sets `Referrer-Policy`,
  `X-Frame-Options` and `Permissions-Policy` from `docs/_headers`, and HSTS and
  `X-Content-Type-Options` at the Cloudflare edge; the CSP travels in a meta
  tag. The GitHub Pages mirror, which could set no headers at all, was
  unpublished on 6 August 2026.
- Content disputes about watch order. Those are issues, not vulnerabilities.

## What to expect

A single maintainer, working on this in spare time. You'll get an
acknowledgement as soon as it's read, and a fix as fast as is reasonable for
what it is.
