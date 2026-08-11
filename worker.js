/* Night Watcher — the Worker in front of the assets.
 *
 * This file exists for exactly one request shape: `GET /` from a client whose
 * Accept header PREFERS text/markdown. Those get the markdown representation
 * of the site — docs/llms.txt, the same file already served at /llms.txt —
 * because an agent that asks for markdown is asking not to parse 198 KB of
 * HTML for what llms.txt says in 29 lines. (The 10 Aug 2026 Radar scan's
 * agent-readiness report gates Level 3 on this negotiation and nothing else;
 * the triage is in-project, `claude/radar-scan-triage-2026-08-10.md`.)
 *
 * Everything else — every other path, every other method, every browser —
 * falls through to env.ASSETS.fetch() UNTOUCHED: same bytes, same _headers,
 * same CSP hash, same ETag. wrangler.jsonc scopes run_worker_first to "/"
 * alone, so /sw.js, the fonts and the icons never even pay the Worker hop;
 * this code cannot slow or alter them. The dashboard alternative (managed
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

export default {
  fetch: function(request, env){
    var url = new URL(request.url);
    if(url.pathname === "/" && request.method === "GET" &&
       wantsMarkdown(request.headers.get("Accept"))){
      return markdownResponse(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
