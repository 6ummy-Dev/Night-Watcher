/* Night Watcher — service worker.
 *
 * VERSION must match BUILD in index.html. qa/guards.js enforces that; if the
 * two drift, old caches are never retired and users are pinned to a stale app.
 *
 * Strategy, chosen to make a bad deploy recoverable rather than sticky:
 *   same-origin  -> network-first, cache as fallback. A deploy lands on the
 *                   next load while online; offline still opens from cache.
 *
 * Nothing cross-origin is fetched at all: the fonts are self-hosted and there
 * is no beacon. Deliberately NOT cache-first for HTML: the app is one
 * index.html, so a stale cache means a stale catalogue AND stale code with
 * no way to push a fix. (The history of this file is in NOTES.md.)
 */
var VERSION = "4.5.3";
var CACHE   = "night-watcher-" + VERSION;
/* The shell is everything the page needs to open offline: the page, the
   manifest, the icons the page and the manifest reference (the apple-touch
   icon stays out — iOS copies it at install time and never asks the worker),
   and the fonts, because a font that failed on the one online visit would
   otherwise render fallback type offline until the next one. Section 13 of
   the guards diffs this list against what docs/ actually serves, with the
   crawler-facing files named as exclusions. ./index.html is not listed:
   the assets plane redirects it to ./, so installing it stored a redirected
   duplicate of the page that a navigation can never use. */
var SHELL   = ["./", "./manifest.json", "./icon.png", "./icon-192.png",
               "./icon-maskable-512.png",
               "./icon.svg",
               "./fonts/limelight-latin-400-normal.woff2",
               "./fonts/big-shoulders-display-latin-700-normal.woff2",
               "./fonts/ibm-plex-sans-latin-400-normal.woff2",
               "./fonts/ibm-plex-sans-latin-600-normal.woff2",
               "./fonts/ibm-plex-mono-latin-400-normal.woff2",
               "./fonts/ibm-plex-mono-latin-600-normal.woff2"];

/* If anything is ever fetched from another origin again, it needs a
   never-cache list here BEFORE the fetch ships, not after: the cross-origin
   return below is about where a request is served from, not what it is. */

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
        /* c.put() rejects on 206s and on a full quota; returning it puts the
           rejection inside the chain the .catch is watching. waitUntil keeps
           the worker alive until the put settles — fire-and-forget let the
           browser kill the worker between the reply and the write, and a
           downloaded update quietly missed the offline cache. Guard 132
           executes this path. */
        e.waitUntil(
          caches.open(CACHE).then(function(c){ return c.put(req, copy); }).catch(function(){})
        );
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        if(hit) return hit;
        /* A navigation to any path under scope should still open the app.
           ./ is the shell. ./index.html is not installed (it would be a
           redirected copy, which a browser refuses for a navigation); it is
           consulted last only for a platform where that path answers 200
           and a visit cached it. */
        if(req.mode === "navigate"){
          return caches.match("./").then(function(shell){
            return shell || caches.match("./index.html");
          });
        }
        return Response.error();
      });
    })
  );
});
