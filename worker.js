/* Night Watcher — the Worker in front of the assets.
 *
 * This file's original purpose is one request shape: `GET /` from a client whose
 * Accept header PREFERS text/markdown. Those get the markdown representation
 * of the site — docs/llms.txt, the same file already served at /llms.txt —
 * because an agent that asks for markdown is asking not to parse 198 KB of
 * HTML for what llms.txt says in 29 lines. (The 10 Aug 2026 Radar scan's
 * agent-readiness report gates Level 3 on this negotiation and nothing else;
 * the triage is in-project, `claude/radar-scan-triage-2026-08-10.md`.)
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
 */

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

function markdownResponse(request, env){
  var url = new URL(request.url);
  return env.ASSETS.fetch(new Request(url.origin + "/llms.txt")).then(function(res){
    /* If llms.txt cannot be read, the negotiation quietly does not exist:
       fall through to the page rather than invent a broken markdown body. */
    if(!res || res.status !== 200) return env.ASSETS.fetch(request);
    return res.text().then(function(md){
      return new Response(md, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Location": "/llms.txt",
          "Vary": "Accept",
          "Cache-Control": "no-cache"
        }
      });
    });
  });
}

/* RFC 9727 well-known api-catalog. Night Watcher has no API, so the honest
   catalogue is EMPTY: an RFC 9264 linkset with zero links, served as
   application/linkset+json with a 200. It is the machine-readable form of
   "there is no API", the sibling of auth.md's "there is nothing to sign into"
   (3.8.4). What is deliberately NOT here is a fabricated entry — a link would
   need an anchor and a service-desc (an OpenAPI document) for an API that does
   not exist, which is the api-catalog Link rel the _headers comment refused
   for the same reason. Known risk, accepted on the record: a validator may
   only credit a catalogue with >=1 entry, and the honest empty form could
   still read red. */
function apiCatalogResponse(head){
  /* 3.9.2: HEAD is answered as well as GET. The handler tested for GET alone,
     so HEAD fell through to the assets plane and 404'd \u2014 a status mismatch on
     a well-known URI that the validators probing it will read as "no catalogue
     here". Same headers, no body, per HTTP. */
  return new Response(head ? null : '{"linkset":[]}', {
    status: 200,
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "no-cache"
    }
  });
}

export default {
  fetch: function(request, env){
    var url = new URL(request.url);
    if(url.pathname === "/.well-known/api-catalog" &&
       (request.method === "GET" || request.method === "HEAD")){
      return apiCatalogResponse(request.method === "HEAD");
    }
    if(url.pathname === "/" && request.method === "GET" &&
       wantsMarkdown(request.headers.get("Accept"))){
      return markdownResponse(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
