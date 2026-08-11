/* Night Watcher — service worker.
 *
 * VERSION must match BUILD in index.html. qa/guards.js enforces that; if the
 * two drift, old caches are never retired and users are pinned to a stale app.
 *
 * Strategy, chosen to make a bad deploy recoverable rather than sticky:
 *   same-origin  -> network-first, cache as fallback. A deploy lands on the
 *                   next load while online; offline still opens from cache.
 *
 * The analytics case left with the beacon in 3.2.0 — nothing cross-origin is
 * fetched at all now. Fonts were a third case until 1.4.2, cached from
 * Google's CDN. They are self-hosted now, so they are same-origin and need no
 * special handling.
 *
 * Deliberately NOT cache-first for HTML: this file ships inside a single
 * ~190 KB index.html, so a stale cache means a stale catalogue AND stale code
 * with no way to push a fix.
 */
var VERSION = "3.8.0";
var CACHE   = "night-watcher-" + VERSION;
/* icon-192.png is in the shell because index.html's <head> now references it
   directly for rel=icon and apple-touch-icon (it used to inline the bytes). */
/* The fonts join the shell in 1.5.9. They used to rely on the runtime
   network-first path, which works on any normal first visit \u2014 but if a font
   request failed on that one visit, offline rendered fallback type silently
   until the next online one. Each item installs with its own catch, so a
   heavier shell still cannot fail the install.
   icon-maskable-512.png joined in 1.6.6. It had been served and referenced by
   manifest.json since 1.5.x and never listed here, so an Android icon refresh
   while offline fell back silently \u2014 and only for people who installed before
   the icon existed. Section 13 of the guards now diffs this list against what
   docs/ actually serves, with the crawler-facing files named as exclusions. */
var SHELL   = ["./", "./index.html", "./manifest.json", "./icon.png", "./icon-192.png",
               "./icon-maskable-512.png",
               "./icon.svg",
               "./fonts/limelight-latin-400-normal.woff2",
               "./fonts/anton-latin-400-normal.woff2",
               "./fonts/ibm-plex-sans-latin-400-normal.woff2",
               "./fonts/ibm-plex-sans-latin-600-normal.woff2",
               "./fonts/ibm-plex-mono-latin-400-normal.woff2",
               "./fonts/ibm-plex-mono-latin-600-normal.woff2"];

/* NEVER_CACHE IS GONE, 3.2.0, WITH THE THING IT GUARDED. It held one entry,
   the analytics beacon's origin, and existed because the cross-origin return
   below is about WHERE the beacon was served from rather than about what the
   list meant: serve it through a same-origin path, which Cloudflare offers,
   and the origin check stops catching it while the list still would. With no
   beacon there is nothing cross-origin left for either to catch, and an empty
   list consulted on every fetch is a line that can only ever be right by
   accident. If anything is ever fetched from another origin again, this is the
   comment that says put the list back before the fetch, not after. */

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      /* Individually, so one 404 cannot fail the whole install. */
      return Promise.all(SHELL.map(function(u){
        return c.add(new Request(u, {cache: "reload"})).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return (k === CACHE) ? Promise.resolve() : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function inList(origin, list){
  for(var i = 0; i < list.length; i++){ if(list[i] === origin) return true; }
  return false;
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch(err){ return; }

  if(url.origin !== location.origin) return;

  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok){
        var copy = res.clone();
        /* c.put() rejects on 206s and on a full quota. Returning it puts the
           rejection inside the chain the .catch below is actually watching.
           e.waitUntil() joined in 3.7.2 (L-3 of the 10 Aug review): the write
           was fire-and-forget, so the browser could kill this worker between
           the reply and the put, and a downloaded update quietly missed the
           offline cache until some later visit. waitUntil keeps the worker
           alive until the put settles. Guard 132 executes this path. */
        e.waitUntil(
          caches.open(CACHE).then(function(c){ return c.put(req, copy); }).catch(function(){})
        );
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        if(hit) return hit;
        /* A navigation to any path under scope should still open the app. */
        if(req.mode === "navigate"){
          return caches.match("./index.html").then(function(shell){
            return shell || caches.match("./");
          });
        }
        return Response.error();
      });
    })
  );
});
