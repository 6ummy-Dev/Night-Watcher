/* Night Watcher — service worker.
 *
 * VERSION must match BUILD in index.html. qa/guards.js enforces that; if the
 * two drift, old caches are never retired and users are pinned to a stale app.
 *
 * Strategy, chosen to make a bad deploy recoverable rather than sticky:
 *   same-origin  -> network-first, cache as fallback. A deploy lands on the
 *                   next load while online; offline still opens from cache.
 *   analytics    -> never touched.
 *
 * Fonts were a third case until 1.4.2, cached from Google's CDN. They are
 * self-hosted now, so they are same-origin and need no special handling.
 *
 * Deliberately NOT cache-first for HTML: this file ships inside a single
 * 133 KB index.html, so a stale cache means a stale catalogue AND stale code
 * with no way to push a fix.
 */
var VERSION = "1.5.5";
var CACHE   = "night-watcher-" + VERSION;
/* icon-192.png is in the shell because index.html's <head> now references it
   directly for rel=icon and apple-touch-icon (it used to inline the bytes). */
var SHELL   = ["./", "./index.html", "./manifest.json", "./icon.png", "./icon-192.png"];

var NEVER_CACHE  = ["https://static.cloudflareinsights.com"];

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

  if(inList(url.origin, NEVER_CACHE)) return;


  if(url.origin !== location.origin) return;

  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
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
