/* ============================================================
   6UMMY — Worker
   One file, three routes. Paste into a Cloudflare Worker.

     GET /live      Twitch: are you streaming right now
     GET /dates     Google Calendar .ics, parsed to JSON
     GET /crate     Discogs collection, newest first
     GET /youtube   One curated playlist, in playlist order

   Secrets to set in  Settings > Variables and Secrets:
     TWITCH_ID         Twitch application client ID
     TWITCH_SECRET     Twitch application client secret
     DISCOGS_TOKEN     Discogs personal access token
     CALENDAR_ID       jelhc76e0q5clq9er14l6963fo@group.calendar.google.com
     YOUTUBE_KEY       YouTube Data API v3 key

   The playlist ID is public, so it sits in YT_PLAYLIST below with
   the other handles rather than in secrets. Keeping it server-side
   also means this Worker can't be used to spend your API quota on
   somebody else's playlist.

   Restrict YOUTUBE_KEY to the YouTube Data API v3 in the Google
   Cloud console. Workers have no fixed IP, so an API restriction
   is the useful one; a referrer restriction would do nothing here.

   Nothing here ever reaches the browser except the JSON output,
   so none of these values touch the public repo.
   ============================================================ */

const DISCOGS_USER = "6ummy";
const TWITCH_LOGIN = "6ummy";
const YT_PLAYLIST  = "PLToFguQXkN1vWOwHi10bbgIUxUngpc0MI";
const UA = "6ummy.xyz/1.0 (+https://6ummy.xyz)";

/* Who may call this Worker. Read-only public data, so this is
   tidiness rather than security — but keep it honest. */
function corsOrigin(req) {
  const o = req.headers.get("Origin") || "";
  const ok =
    /^https:\/\/[a-z0-9-]+\.github\.io$/i.test(o) ||
    /^https:\/\/([a-z0-9-]+\.)?6ummy\.xyz$/i.test(o) ||
    /^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(o) ||
    /^http:\/\/localhost(:\d+)?$/i.test(o);
  return ok ? o : "https://6ummy.xyz";
}

function json(data, req, seconds) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${seconds}`,
      "Access-Control-Allow-Origin": corsOrigin(req),
      "Vary": "Origin"
    }
  });
}

export default {
  async fetch(req, env, ctx) {
    const path = new URL(req.url).pathname.replace(/\/+$/, "") || "/";

    if (req.method === "OPTIONS") {
      /* Echo whatever headers the caller asked for. A plain browser
         fetch sends none of these and never preflights at all — but
         anything that signs its requests (Web Bot Auth sends
         signature / signature-agent / signature-input) does, and with
         no Allow-Headers in the response the preflight fails and every
         route is unreachable to it. That was 4 CORS violations in the
         Cloudflare Radar scan.

         Safe to mirror: this Worker is read-only public data, the
         origin allowlist above is what actually gates access, and
         permitting a header is not the same as trusting it. */
      const asked = req.headers.get("Access-Control-Request-Headers");
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": corsOrigin(req),
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": asked || "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin, Access-Control-Request-Headers"
        }
      });
    }

    try {
      /* Liveness is deliberately NOT served stale — a cached
         "live: true" would light the whole bar for a stream that
         ended. Wrong beats late here. */
      if (path === "/live")  return json(await live(env),  req, 60);

      if (path === "/dates")   return resilient(req, ctx, "dates",   900,  () => dates(env));
      if (path === "/crate")   return resilient(req, ctx, "crate",   3600, () => crate(env));
      if (path === "/youtube") return resilient(req, ctx, "youtube", 3600, () => youtube(env));
      return json({ routes: ["/live", "/dates", "/crate", "/youtube"] }, req, 3600);
    } catch (err) {
      // Never 500 — the site should degrade, not break.
      return json({ error: String(err && err.message || err) }, req, 30);
    }
  }
};

/* ============================================================
   RESILIENCE
   Discogs rate-limits hard, YouTube has a daily quota, and Google
   occasionally just fails. Without this, one 429 empties a section
   and the visitor sees "couldn't load" for an hour.

   So: every successful response is kept in the edge cache for a
   day under a private key. If upstream then fails, the last good
   copy is served with stale:true rather than an error. The section
   goes slightly out of date instead of going blank — the correct
   trade for a record shelf or a video list.
   ============================================================ */

async function resilient(req, ctx, name, seconds, producer) {
  const cache = caches.default;
  const key = new Request("https://cache.invalid/" + name);

  try {
    const data = await producer();
    const keep = new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=86400"
      }
    });
    if (ctx && ctx.waitUntil) ctx.waitUntil(cache.put(key, keep));
    return json(data, req, seconds);
  } catch (err) {
    const hit = await cache.match(key);
    if (hit) {
      const data = await hit.json();
      data.stale = true;
      /* Short TTL so recovery is quick once upstream returns. */
      return json(data, req, 60);
    }
    return json({ error: String(err && err.message || err) }, req, 30);
  }
}

/* ============================================================
   TWITCH
   ============================================================ */

async function live(env) {
  if (!env.TWITCH_ID || !env.TWITCH_SECRET) return { live: false, reason: "not configured" };

  const auth = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: env.TWITCH_ID,
      client_secret: env.TWITCH_SECRET,
      grant_type: "client_credentials"
    })
  }).then(r => r.json());

  if (!auth.access_token) return { live: false, reason: "auth failed" };

  const res = await fetch(
    "https://api.twitch.tv/helix/streams?user_login=" + encodeURIComponent(TWITCH_LOGIN),
    { headers: { "Client-ID": env.TWITCH_ID, "Authorization": "Bearer " + auth.access_token } }
  ).then(r => r.json());

  const s = res.data && res.data[0];
  return {
    live: !!s,
    title: s ? s.title : null,
    game: s ? s.game_name : null,
    viewers: s ? s.viewer_count : 0,
    started: s ? s.started_at : null
  };
}

/* ============================================================
   CALENDAR
   Google's .ics feed sends no CORS headers, so the browser can't
   read it directly. Here it's just a server-to-server fetch.
   ============================================================ */

async function dates(env) {
  const id = env.CALENDAR_ID;
  if (!id) return { events: [] };

  const url = "https://calendar.google.com/calendar/ical/" +
              encodeURIComponent(id) + "/public/basic.ics";

  const text = await fetch(url, {
    headers: { "User-Agent": UA },
    cf: { cacheTtl: 600, cacheEverything: true }
  }).then(r => {
    if (!r.ok) throw new Error("calendar " + r.status);
    return r.text();
  });

  const now = Date.now();
  const from = now - 1000 * 60 * 60 * 24 * 180;   // 6 months back
  const to   = now + 1000 * 60 * 60 * 24 * 365;   // 1 year ahead

  const events = parseICS(text, from, to).sort((a, b) => a.startMs - b.startMs);

  return {
    events,
    upcoming: events.filter(e => e.endMs >= now).slice(0, 8),
    past: events.filter(e => e.endMs < now).slice(-6).reverse()
  };
}

/* --- ICS parsing ------------------------------------------- */

function unfold(text) {
  // RFC 5545: a leading space or tab continues the previous line.
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function unescapeText(v) {
  return v.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();
}

function parseStamp(value, params) {
  // Forms: 20260814 | 20260814T220000 | 20260814T010000Z
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  const allDay = !h;

  if (allDay) {
    // Anchor midday so timezone shifts can't move it to the wrong date.
    return { ms: Date.UTC(+y, +mo - 1, +d, 12), allDay: true };
  }
  if (z) return { ms: Date.UTC(+y, +mo - 1, +d, +h, +mi, +s), allDay: false };

  const tz = params.TZID || "America/Montevideo";
  return { ms: zonedToUTC(+y, +mo, +d, +h, +mi, +s, tz), allDay: false };
}

/* Convert a wall-clock time in a named zone to a real timestamp.
   Two passes so DST boundaries land correctly. */
function zonedToUTC(y, mo, d, h, mi, s, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  let ts = guess - offsetOf(guess, tz);
  ts = guess - offsetOf(ts, tz);
  return ts;
}

function offsetOf(ms, tz) {
  try {
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(new Date(ms)).reduce((a, x) => (a[x.type] = x.value, a), {});
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ms;
  } catch (e) { return 0; }
}

function parseICS(text, from, to) {
  const out = [];
  const blocks = unfold(text).split("BEGIN:VEVENT").slice(1);

  for (const raw of blocks) {
    const body = raw.split("END:VEVENT")[0];
    const f = {};
    const exdates = [];
    let rrule = null;

    for (const line of body.split("\n")) {
      const i = line.indexOf(":");
      if (i < 0) continue;
      const head = line.slice(0, i);
      const value = line.slice(i + 1);
      const [name, ...rest] = head.split(";");
      const params = {};
      rest.forEach(p => {
        const j = p.indexOf("=");
        if (j > 0) params[p.slice(0, j).toUpperCase()] = p.slice(j + 1);
      });

      const key = name.toUpperCase();
      if (key === "RRULE") rrule = value;
      else if (key === "EXDATE") value.split(",").forEach(v => {
        const p = parseStamp(v, params); if (p) exdates.push(p.ms);
      });
      else f[key] = { value, params };
    }

    if (f.STATUS && /CANCELLED/i.test(f.STATUS.value)) continue;

    const start = f.DTSTART && parseStamp(f.DTSTART.value, f.DTSTART.params);
    if (!start) continue;
    const end = f.DTEND && parseStamp(f.DTEND.value, f.DTEND.params);
    const span = end ? Math.max(0, end.ms - start.ms) : (start.allDay ? 0 : 2 * 3600e3);

    const base = {
      title: f.SUMMARY ? unescapeText(f.SUMMARY.value) : "TBA",
      where: f.LOCATION ? unescapeText(f.LOCATION.value) : "",
      description: f.DESCRIPTION ? unescapeText(f.DESCRIPTION.value).slice(0, 300) : "",
      allDay: start.allDay
    };

    const starts = rrule ? expand(rrule, start.ms, from, to) : [start.ms];

    for (const ms of starts) {
      if (ms < from || ms > to) continue;
      if (exdates.some(x => Math.abs(x - ms) < 60000)) continue;
      out.push({ ...base, startMs: ms, endMs: ms + span, start: new Date(ms).toISOString() });
    }
  }
  return out;
}

/* Recurring events. Handles the rules a gig/stream calendar
   actually uses: DAILY / WEEKLY / MONTHLY, with INTERVAL,
   COUNT, UNTIL and BYDAY. Anything more exotic falls back to
   the single original date rather than guessing. */
function expand(rrule, startMs, from, to) {
  const r = {};
  rrule.split(";").forEach(p => {
    const [k, v] = p.split("=");
    if (k) r[k.toUpperCase()] = v;
  });

  const freq = (r.FREQ || "").toUpperCase();
  if (!["DAILY", "WEEKLY", "MONTHLY"].includes(freq)) return [startMs];

  const interval = Math.max(1, parseInt(r.INTERVAL || "1", 10));
  const count = r.COUNT ? parseInt(r.COUNT, 10) : Infinity;
  let until = Infinity;
  if (r.UNTIL) {
    const u = parseStamp(r.UNTIL, {});
    if (u) until = u.ms;
  }

  const DAYS = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  const byday = r.BYDAY ? r.BYDAY.split(",").map(d => DAYS[d.slice(-2).toUpperCase()]) : null;

  const out = [];
  const d = new Date(startMs);
  let n = 0, guard = 0;

  while (out.length < count && d.getTime() <= to && guard++ < 2000) {
    const ms = d.getTime();
    if (ms > until) break;

    const dayOk = !byday || byday.includes(d.getUTCDay());
    if (dayOk && ms >= from) out.push(ms);
    if (dayOk) n++;

    if (freq === "DAILY") d.setUTCDate(d.getUTCDate() + interval);
    else if (freq === "WEEKLY") {
      if (byday) {
        d.setUTCDate(d.getUTCDate() + 1);
        // after a full week, skip ahead by the interval
        if (d.getUTCDay() === new Date(startMs).getUTCDay() && interval > 1) {
          d.setUTCDate(d.getUTCDate() + 7 * (interval - 1));
        }
      } else d.setUTCDate(d.getUTCDate() + 7 * interval);
    } else d.setUTCMonth(d.getUTCMonth() + interval);
  }

  return out.length ? out : [startMs];
}

/* ============================================================
   DISCOGS
   Needs a User-Agent header, which browser JS can't set, and
   a token for cover images. Both fine from here.
   ============================================================ */

async function crate(env) {
  const headers = { "User-Agent": UA };
  if (env.DISCOGS_TOKEN) headers.Authorization = "Discogs token=" + env.DISCOGS_TOKEN;

  const url = "https://api.discogs.com/users/" + encodeURIComponent(DISCOGS_USER) +
              "/collection/folders/0/releases?sort=added&sort_order=desc&per_page=12&page=1";

  const data = await fetch(url, { headers, cf: { cacheTtl: 1800, cacheEverything: true } })
    .then(r => {
      if (!r.ok) throw new Error("discogs " + r.status);
      return r.json();
    });

  const clean = s => String(s || "").replace(/\s*\(\d+\)$/, "").trim();

  const records = (data.releases || []).map(item => {
    const b = item.basic_information || {};
    const label = (b.labels && b.labels[0]) || {};
    return {
      id: b.id || item.id,
      artist: (b.artists || []).map(a => clean(a.name)).join(" / ") || "Unknown",
      title: b.title || "Untitled",
      label: clean(label.name),
      cat: (label.catno || "").replace(/^none$/i, ""),
      year: b.year && b.year > 0 ? String(b.year) : "",
      format: (b.formats || []).map(f => f.name).join(", "),
      thumb: b.thumb || "",
      cover: b.cover_image || "",
      url: b.id ? "https://www.discogs.com/release/" + b.id : ""
    };
  });

  return { count: data.pagination ? data.pagination.items : records.length, records };
}

/* ============================================================
   YOUTUBE
   One curated playlist, returned in the order you arranged it —
   so the running order is editable on YouTube, not in the repo.

   A playlist keeps private and deleted entries in the response
   as placeholder items with no thumbnail. They're filtered out
   here, otherwise the site would render rows titled
   "Private video".

   Quota: playlistItems.list costs 1 unit against 10,000/day,
   and the response is cached for an hour. This is free.
   ============================================================ */

async function youtube(env) {
  if (!env.YOUTUBE_KEY) return { videos: [], reason: "not configured" };

  const url = "https://www.googleapis.com/youtube/v3/playlistItems" +
              "?part=snippet,contentDetails&maxResults=24" +
              "&playlistId=" + encodeURIComponent(YT_PLAYLIST) +
              "&key=" + encodeURIComponent(env.YOUTUBE_KEY);

  const data = await fetch(url, {
    headers: { "User-Agent": UA },
    cf: { cacheTtl: 1800, cacheEverything: true }
  }).then(r => {
    if (!r.ok) throw new Error("youtube " + r.status);
    return r.json();
  });

  const dead = /^(private|deleted) video$/i;

  const videos = (data.items || []).map(item => {
    const sn = item.snippet || {};
    const th = sn.thumbnails || {};
    const id = (sn.resourceId && sn.resourceId.videoId) || "";
    const published = (item.contentDetails && item.contentDetails.videoPublishedAt) || sn.publishedAt || "";
    return {
      id,
      title: sn.title || "",
      channel: sn.videoOwnerChannelTitle || "",
      year: published ? published.slice(0, 4) : "",
      published,
      thumb: (th.medium || th.default || {}).url || "",
      url: id ? "https://www.youtube.com/watch?v=" + id : ""
    };
  }).filter(v => v.id && v.thumb && !dead.test(v.title));

  return { count: videos.length, videos };
}
