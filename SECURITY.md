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

- Cloudflare's server-side request counting. It is what any host sees by
  answering a request at all: it sets no cookies, adds nothing to the page and
  never sees which entries you watch. The client-side Web Analytics beacon that
  used to sit here was removed in 3.2.0, and the page now fetches nothing.
- Missing HTTP security headers **on the beta GitHub Pages address**. The
  canonical site sets `Referrer-Policy`, `X-Frame-Options` and
  `Permissions-Policy` from `docs/_headers`, and HSTS and
  `X-Content-Type-Options` at the Cloudflare edge; the CSP is in a meta tag so
  that both addresses carry it. GitHub Pages can set no headers at all, and
  since 2.5.1 that address is an unadvertised mirror marked `noindex`. Reports
  about headers there are known and out of scope.
- Content disputes about watch order. Those are issues, not vulnerabilities.

## What to expect

A single maintainer, working on this in spare time. You'll get an
acknowledgement as soon as it's read, and a fix as fast as is reasonable for
what it is.
