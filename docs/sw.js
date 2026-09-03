/* Night Watcher — service worker.
 *
 * VERSION must match BUILD in index.html; qa/guards.js (section 11) fails the
 * build if they drift, because a stale VERSION never retires the old cache.
 *
 * Same-origin requests are network-first with the cache as the fallback: a
 * deploy lands on the next online load, and offline still opens from cache.
 * Nothing cross-origin is ever fetched. Not cache-first for HTML on purpose —
 * the app is one index.html, so a sticky cache is a sticky catalogue and
 * sticky code with no way to push a fix. History: NOTES-history.md ("Where the served and config files' histories went").
 */
var VERSION = "6.0.1";
var CACHE   = "night-watcher-" + VERSION;
/* The shell: everything the page needs to open offline. Guard 13 diffs this
   list against what docs/ serves, crawler-facing files excluded; ./index.html
   is not listed because the assets plane redirects it to ./ (history in the
   same NOTES-history.md section as above). */
var SHELL   = ["./", "./manifest.json", "./icon.png", "./icon-192.png",
               "./icon-maskable-512.png",
               "./icon.svg",
               "./fonts/limelight-latin-400-normal.woff2",
               "./fonts/big-shoulders-display-latin-700-normal.woff2",
               "./fonts/ibm-plex-sans-latin-400-normal.woff2",
               "./fonts/ibm-plex-sans-latin-600-normal.woff2",
               "./fonts/ibm-plex-mono-latin-400-normal.woff2",
               "./fonts/ibm-plex-mono-latin-600-normal.woff2"];

/* / is served with Vary: Accept (worker.js negotiates the root), and the
   Cache API honours Vary — so a navigation's Accept never matches the entry
   the install fetched with a bare wildcard. ignoreVary on every match: there
   is one representation of each path in this cache, whatever Accept asked. */
var ANY = {ignoreVary: true};

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
        /* The put rides waitUntil so the browser cannot kill the worker
           between the reply and the write; c.put() rejects on 206s and on a
           full quota, and the rejection lands in the catch. Guard 132
           executes this path. */
        e.waitUntil(
          /* delete-then-put, both under ignoreVary: put() honours Vary when
             it dedupes, so / could otherwise hold two representations (the
             install's wildcard-Accept entry and a navigation's) and the
             match below (in the catch) would answer the install-time one
             forever. 5.3.1: when the cached entry carries the same ETag as
             the response, nothing moved and nothing is written — every load
             used to delete and re-put the 245 KB document and ~65 KB of
             fonts out of a 304-refreshed HTTP cache entry. */
          caches.open(CACHE).then(function(c){
            return c.match(req, ANY).then(function(old){
              var was = old && old.headers && old.headers.get("etag");
              var now = res.headers && res.headers.get("etag");
              if(old && was && now && was === now){
                if(copy.body && copy.body.cancel) copy.body.cancel();
                return;
              }
              return c.delete(req, ANY).then(function(){ return c.put(req, copy); });
            });
          }).catch(function(){})
        );
      }
      return res;
    }).catch(function(){
      return caches.match(req, ANY).then(function(hit){
        if(hit) return hit;
        /* A navigation to any path under scope still opens the app: ./ is
           the shell, and ./index.html is consulted last for a platform
           where that path answers 200 and a visit cached it. */
        if(req.mode === "navigate"){
          return caches.match("./", ANY).then(function(shell){
            return shell || caches.match("./index.html", ANY);
          });
        }
        return Response.error();
      });
    })
  );
});
