/* Night Watcher — the Worker in front of the assets.
 *
 * This file's original purpose is one request shape: `GET /` (and its `HEAD`)
 * from a client whose Accept header PREFERS text/markdown. Those get the
 * markdown representation of the site — docs/llms.txt, the same file already
 * served at /llms.txt — because an agent that asks for markdown is asking not
 * to parse the whole page for what llms.txt says in a few dozen lines. (The
 * Radar agent-readiness report gates Level 3 on this negotiation and nothing
 * else; the triage is maintainer-local, not in this repository.)
 *
 * It also answers ONE well-known path: GET /.well-known/api-catalog returns an
 * empty RFC 9727 linkset — the machine-readable "there is no API", sibling to
 * auth.md's "there is nothing to sign into" (see apiCatalogResponse below).
 * Everything else — every other path, every other method, every browser —
 * falls through to env.ASSETS.fetch() UNTOUCHED: same bytes, same _headers,
 * same CSP hash, same ETag. wrangler.jsonc scopes run_worker_first to "/" and
 * "/.well-known/api-catalog", so /sw.js, the fonts and the icons never even
 * pay the Worker hop; this code cannot slow or alter them. The api-catalog
 * path has no asset behind it, so widening the scope to it costs no asset the
 * hop. The dashboard alternative (managed
 * "Markdown for Agents") converts at the edge, needs a paid plan, strips
 * validators, and is exactly the kind of undiffable panel config the
 * _headers history warns about. This file is in the repository, guard 133
 * executes it, and RELEASING.md reads it on the wire after every deploy.
 *
 * Written with .then() chains, not async/await, on purpose: guard 133 drives
 * this handler synchronously with the same sync-thenable harness that
 * executes sw.js (guard 132), and await cannot be forced synchronous.
 *
 * docs/_headers applies to responses the assets plane serves and to nothing
 * this file constructs. The two responses built here therefore carry the
 * security set and the root's Link set themselves, from the constants below;
 * guard 133 holds those constants equal to what _headers declares, so the
 * two files cannot drift apart.
 */

/* The headers _headers puts on every asset response, restated for the two
   responses the assets plane never sees. */
var SECURITY = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin"
};
/* The root's Link set, one header with comma-joined values as HTTP allows. */
var ROOT_LINKS = '<https://nightwatcher.life/sitemap.xml>; rel="sitemap", ' +
                 '<https://nightwatcher.life/>; rel="canonical", ' +
                 '</llms.txt>; rel="describedby"';
function withSecurity(h){
  var out = {}, k;
  for(k in SECURITY) out[k] = SECURITY[k];
  for(k in h) out[k] = h[k];
  return out;
}

/* Does this Accept header PREFER markdown? Only an explicit `text/markdown`
   entry counts — wildcards do not, or `curl` (whose Accept is the bare
   wildcard) and every RSS reader would get markdown for the front page. Markdown must beat text/html
   STRICTLY: a browser's own Accept always names html, so a tie goes to the
   page, and a client that says only `Accept: text/markdown` gets markdown. */
function wantsMarkdown(accept){
  var md = 0, html = 0;
  String(accept || "").split(",").forEach(function(part){
    var bits = part.trim().split(";"), type = bits[0].trim().toLowerCase();
    if(type !== "text/markdown" && type !== "text/html") return;
    var q = 1, i, m;
    for(i = 1; i < bits.length; i++){
      m = bits[i].trim().match(/^q=([0-9.]+)$/i);
      if(m){ q = parseFloat(m[1]); if(!isFinite(q)) q = 1; }
    }
    if(type === "text/markdown" && q > md) md = q;
    if(type === "text/html" && q > html) html = q;
  });
  return md > 0 && md > html;
}

function markdownResponse(request, env, head){
  var url = new URL(request.url);
  return env.ASSETS.fetch(new Request(url.origin + "/llms.txt")).then(function(res){
    /* If llms.txt cannot be read, the negotiation quietly does not exist:
       fall through to the page rather than invent a broken markdown body. */
    if(!res || res.status !== 200) return env.ASSETS.fetch(request);
    return res.text().then(function(md){
      /* HEAD is answered as well as GET, the same way api-catalog answers
         it — same headers, no body, per HTTP. */
      return new Response(head ? null : md, {
        status: 200,
        headers: withSecurity({
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Location": "/llms.txt",
          "Link": ROOT_LINKS,
          "Vary": "Accept",
          "Cache-Control": "no-cache"
        })
      });
    });
  });
}

/* RFC 9727 well-known api-catalog. Night Watcher has no API, so the honest
   catalogue is EMPTY: an RFC 9264 linkset with zero links, served as
   application/linkset+json with a 200. It is the machine-readable form of
   "there is no API", the sibling of auth.md's "there is nothing to sign into"
   What is deliberately NOT here is a fabricated entry — a link would
   need an anchor and a service-desc (an OpenAPI document) for an API that does
   not exist, which is the api-catalog Link rel the _headers comment refused
   for the same reason. Known risk, accepted on the record: a validator may
   only credit a catalogue with >=1 entry, and the honest empty form could
   still read red. */
function apiCatalogResponse(head){
  /* HEAD is answered as well as GET: a HEAD that fell through to the assets
     plane 404'd there, and HEAD is what a validator probes with first. */
  return new Response(head ? null : '{"linkset":[]}', {
    status: 200,
    headers: withSecurity({
      "Content-Type": "application/linkset+json",
      "Cache-Control": "no-cache"
    })
  });
}

export default {
  fetch: function(request, env){
    var url = new URL(request.url);
    if(url.pathname === "/.well-known/api-catalog" &&
       (request.method === "GET" || request.method === "HEAD")){
      return apiCatalogResponse(request.method === "HEAD");
    }
    if(url.pathname === "/" &&
       (request.method === "GET" || request.method === "HEAD") &&
       wantsMarkdown(request.headers.get("Accept"))){
      return markdownResponse(request, env, request.method === "HEAD");
    }
    return env.ASSETS.fetch(request);
  }
};
