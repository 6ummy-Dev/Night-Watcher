/* Night Watcher — the Worker in front of the assets.
 *
 * Two request shapes are answered here; everything else falls through to
 * env.ASSETS.fetch() untouched (same bytes, same _headers, same CSP hash,
 * same ETag), and wrangler.jsonc scopes run_worker_first to exactly these two
 * paths so nothing else pays the hop:
 *
 *   GET|HEAD /   with an Accept that PREFERS text/markdown → docs/llms.txt as
 *                text/markdown, with the asset's own validators so a
 *                revalidation under no-cache can answer 304.
 *   GET|HEAD /.well-known/api-catalog → an empty RFC 9727 linkset: the
 *                machine-readable "there is no API", sibling to auth.md.
 *
 * .then() chains, not async/await: guard 133 drives this handler with a
 * synchronous thenable harness, and await cannot be forced synchronous.
 * docs/_headers reaches asset responses and nothing built here, so the two
 * responses restate the security set and the root's Link set from the
 * constants below; guard 133 holds them equal to _headers.
 * History (why not the dashboard, why the catalogue is empty, the validators):
 * NOTES-history.md ("Where the served and config files' histories went").
 */

var SECURITY = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin"
};
var ROOT_LINKS = '<https://nightwatcher.life/sitemap.xml>; rel="sitemap", ' +
                 '<https://nightwatcher.life/>; rel="canonical", ' +
                 '</llms.txt>; rel="describedby"';
function withSecurity(h){
  var out = {}, k;
  for(k in SECURITY) out[k] = SECURITY[k];
  for(k in h) out[k] = h[k];
  return out;
}

/* Does this Accept header PREFER markdown? Only an explicit text/markdown
   entry counts — wildcards do not, or curl and every feed reader would get
   markdown for the front page — and it must beat text/html STRICTLY: a
   browser's own Accept always names html, so a tie goes to the page. */
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
    /* The asset's validators ride through, so a client revalidating under
       no-cache can be answered 304 instead of re-sent the whole body. */
    var etag = (res.headers && res.headers.get("ETag")) || "";
    var modified = (res.headers && res.headers.get("Last-Modified")) || "";
    var headers = withSecurity({
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Location": "/llms.txt",
      "Link": ROOT_LINKS,
      "Vary": "Accept",
      "Cache-Control": "no-cache"
    });
    if(etag) headers["ETag"] = etag;
    if(modified) headers["Last-Modified"] = modified;
    /* RFC 9110 §13.1.2: "*" matches any current representation, and the
       comparison is WEAK — a client (or an edge that compresses, which is
       what Cloudflare does to this response) echoes W/"x" for the asset's
       "x", and a strict string compare would never answer 304 again. */
    var inm = request.headers.get("If-None-Match");
    var bare = function(t){ return t.trim().replace(/^W\//, ""); };
    if(etag && inm && (inm.trim() === "*" ||
       inm.split(",").some(function(t){ return bare(t) === bare(etag); }))){
      return new Response(null, {status: 304, headers: headers});
    }
    /* HEAD answers the GET's headers and nothing else — the body is never
       read for it. */
    if(head) return new Response(null, {status: 200, headers: headers});
    return res.text().then(function(md){
      return new Response(md, {status: 200, headers: headers});
    });
  });
}

/* RFC 9727 well-known api-catalog. Night Watcher has no API, so the honest
   catalogue is EMPTY: an RFC 9264 linkset with zero links, application/
   linkset+json, 200. A fabricated entry would need an anchor and a
   service-desc for an API that does not exist. */
function apiCatalogResponse(head){
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
