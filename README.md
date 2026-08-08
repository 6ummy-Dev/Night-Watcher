# 6ummy.xyz

Static site. No build step, no dependencies, no framework. Edit, commit, done.

```
index.html
assets/css/style.css     visual system
assets/js/content.js     ← the only file you edit for normal updates
assets/js/app.js         logic
assets/img/              photos (any size, auto-desaturated)
.well-known/             Brave verification file goes here
```

Open `index.html` directly in a browser to preview. Everything works from
`file://` except the calendar fetch, which needs a real origin.

---

## Worker routes

`/live` Twitch · `/dates` calendar · `/crate` Discogs · `/youtube` playlist

The YouTube route mirrors one curated playlist in playlist order, so the running
order is edited on YouTube rather than in this repo. The playlist ID lives in
`YT_PLAYLIST` at the top of `worker/index.js` (it's public); only `YOUTUBE_KEY`
is a secret. Restrict that key to the YouTube Data API v3 — Workers have no
fixed IP, so a referrer restriction would do nothing.

Rows link out instead of embedding. An embedded player costs the better part of
a megabyte per video before anyone presses play.

---

## The palette rule

Dark and darker. `#232323` is the lead black and carries the page; `#1A1A1A`
recedes underneath it for the fixed status bar and the footer. Type is
`#EFF3F4` at 14.07:1.

`#FFEA00` is the secondary brand colour, carried over from the mark. On the
black ground it measures **12.74:1**, so it works as text — which is what the
old light-ground rule forbade (1.06:1 there, invisible rather than merely
non-compliant). It now carries the section indices, the primary button, focus
rings and selection.

The live state still floods the entire status bar yellow, so promoting the
colour did not spend the signal: a yellow index is 12 characters, a yellow bar
is the full width of the screen.

There is no light mode. `prefers-color-scheme` was removed — one palette.

**Preview the live state any time:** add `?live=1` to the URL.

---

## Setup

Everything server-side lives in one Cloudflare Worker (`worker/index.js`).
It exists because three things can't be done from a browser:

| | Why it needs a server |
|---|---|
| Twitch status | needs a client secret, which can't sit in a public repo |
| Google Calendar | the `.ics` feed sends no CORS headers, so browsers refuse it |
| Discogs | requires a `User-Agent` header, which browser JS can't set, and a token for sleeve art |

One Worker solves all three, and keeps every credential out of the repo.

### 1. Deploy the Worker

- **dash.cloudflare.com → Workers & Pages → Create → Hello World → Deploy**
- **Edit code** → replace everything with `worker/index.js` → Deploy
- **Settings → Variables and Secrets** → add four **Secrets**:
  `TWITCH_ID`, `TWITCH_SECRET`, `DISCOGS_TOKEN`, `CALENDAR_ID`
- Deploy again, then test in a browser tab:
  `/live` `/dates` `/crate` should each return JSON

Where the credentials come from:

- **Twitch** — dev.twitch.tv/console/apps → Register Your Application.
  Redirect URL `http://localhost` (unused). Copy the Client ID, then generate a
  secret (shown once).
- **Discogs** — discogs.com/settings/developers → generate a personal access
  token. The API works without one, but returns no cover images.
- **Calendar** — already public. The ID is
  `jelhc76e0q5clq9er14l6963fo@group.calendar.google.com`.

### 2. Point the site at it

In `content.js` set `workerUrl` to your `*.workers.dev` URL. That's the only
change. Dates and Crate populate on their own.

Leave it empty and both sections say so politely instead of breaking.

### 3. Contact form

Static hosting can't send mail. Put any form endpoint in `content.js` →
`formEndpoint` — [Formspree](https://formspree.io), [Web3Forms](https://web3forms.com),
or another Worker route. Leave it empty and the form falls back to `mailto:`.

This one isn't a secret, so it's fine in the repo.

There's a honeypot field instead of reCAPTCHA. reCAPTCHA was roughly half a
megabyte on the old site; the honeypot is 0 KB and works fine at this scale.

### 4. Brave verification

Drop your verification file in `.well-known/` and commit it. Every static host
serves that directory as-is, so it survives moving hosts. If you used the DNS TXT
method instead, it lives at your registrar and none of this applies.

---

## Updating

**Photos** — drop any image in `assets/img/`, point `hero.src` at it. It's
desaturated in CSS, so *any* photo matches the design with no editing. Swap it
as often as you like.

**Crate** — pulls from Discogs automatically, newest first. Add a record there
and it appears here. Discogs supplies artist, title, label, catalogue number and
year; it can't supply why a record matters to you. Write a line for the few you
care about in `crateNotes`, keyed by the Discogs release ID (the number in the
release URL). Records without a note show as clean catalogue rows.

**Sets, links, support** — all arrays in `content.js`. Reorder at will.

**Language** — every string has an `en` and `es`. The toggle is CSS-driven
(`html[data-lang]`), so there's no flash of the wrong language on load. It
defaults to the browser's language, remembers the choice, and `?lang=es` links
straight to Spanish.

---

## Weight

| | gzipped |
|---|---|
| HTML | 2.0 KB |
| CSS | 2.8 KB |
| JS | 6.5 KB |
| Fonts | 0 |
| **Total before images** | **~10.5 KB** |

Zero font downloads — system mono paired with system grotesk. If you'd rather
have a specific face later, self-host one subset `.woff2` and change two lines in
`:root`; the budget can absorb ~20 KB.

Twitch and SoundCloud are click-to-load rather than live iframes. That's where
the real saving is — those embeds were most of the old page's weight, and now
they cost nothing until someone presses play.

---

## Hosting

Nothing here is host-specific: relative paths, no config files, no build. It runs
anywhere that serves static files.

Note that **GitHub Pages won't publish from a private repo** on a free account —
that needs Pro. Cloudflare Pages and Netlify both connect to private repos on
their free tiers, so you keep the repo private and hosting free. Point either at
the repo, no build command, output directory `/`.
