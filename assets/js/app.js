/* ============================================================
   6UMMY — app.js
   No dependencies, no build step. Everything degrades: if the
   Worker isn't configured yet, sections say so rather than break.
   ============================================================ */

(function () {
  "use strict";

  var S = window.SITE;
  var C = S.config;
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var API = (C.workerUrl || "").replace(/\/+$/, "");

  /* ---------------------------------------------------------
     LANGUAGE — CSS-driven, so there's no flash of wrong text.
     --------------------------------------------------------- */

  var lang = (function () {
    var q = params.get("lang");
    if (q === "en" || q === "es") return q;
    try {
      var saved = localStorage.getItem("6ummy-lang");
      if (saved === "en" || saved === "es") return saved;
    } catch (e) {}
    if (C.defaultLang === "en" || C.defaultLang === "es") return C.defaultLang;
    return (navigator.language || "en").toLowerCase().indexOf("es") === 0 ? "es" : "en";
  })();

  function setLang(next) {
    lang = next;
    document.documentElement.setAttribute("data-lang", next);
    document.documentElement.setAttribute("lang", next);
    var btn = $("langBtn");
    btn.textContent = next === "en" ? "ES" : "EN";
    btn.setAttribute("aria-label", next === "en" ? "Cambiar a español" : "Switch to English");
    try { localStorage.setItem("6ummy-lang", next); } catch (e) {}
  }

  function t(obj) { return obj ? (obj[lang] || obj.en || "") : ""; }
  function es(a, b) { return lang === "es" ? a : b; }

  setLang(lang);
  $("langBtn").addEventListener("click", function () {
    setLang(lang === "en" ? "es" : "en");
    render();
  });

  /* ---------------------------------------------------------
     CLOCK — Montevideo time. Small, but the one detail a
     booker in another timezone actually uses.
     --------------------------------------------------------- */

  function tick() {
    try {
      $("clock").textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/Montevideo",
        hour: "2-digit", minute: "2-digit", hour12: false
      }).format(new Date());
    } catch (e) {}
  }
  tick();
  setInterval(tick, 20000);
  $("year").textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     HELPERS
     --------------------------------------------------------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function api(route) {
    if (!API) return Promise.reject(new Error("no worker"));
    return fetch(API + route, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(route + " " + r.status);
      return r.json();
    });
  }

  function hostOf(u) {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  }

  /* ---------------------------------------------------------
     LIVE STATE — the only thing that brings colour in.
     Preview it any time with ?live=1
     --------------------------------------------------------- */

  function setLive(on, title) {
    document.body.classList.toggle("is-live", !!on);
    $("stateLabel").innerHTML = on
      ? '<span data-en>Live now</span><span data-es>En vivo ahora</span>'
      : '<span data-en>Off air</span><span data-es>Fuera del aire</span>';
    $("streamNote").textContent = on && title ? title : "";
  }

  function checkLive() {
    if (params.get("live") === "1") { setLive(true, "Preview"); return; }
    api("/live")
      .then(function (d) { setLive(d && d.live, d && d.title); })
      .catch(function () { setLive(false); });
  }
  checkLive();
  setInterval(checkLive, 120000);

  /* ---------------------------------------------------------
     DEFERRED EMBEDS — nothing from Twitch or SoundCloud is
     requested until someone presses the button.
     --------------------------------------------------------- */

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-embed]");
    if (!btn) return;
    var box = btn.parentElement;
    var kind = btn.getAttribute("data-embed");
    var src;

    if (kind === "twitch") {
      src = "https://player.twitch.tv/?channel=" + encodeURIComponent(C.twitchChannel) +
            "&parent=" + location.hostname + "&autoplay=true";
    } else if (kind === "yt") {
      /* nocookie: YouTube sets nothing until someone actually plays,
         which is the whole point of loading it on demand. */
      src = "https://www.youtube-nocookie.com/embed/videoseries?list=" +
            encodeURIComponent(C.youtubePlaylist) + "&rel=0";
    } else {
      /* Classic player, not visual=true. In visual mode the artwork
         becomes the background and is sized at ~0.45 x the player's
         width — at 880px that is 391px, so it swallows the box and
         the tracklist falls off the bottom. Its share cannot be
         changed: show_artwork=false has no effect in that mode.

         The classic player's header is a FIXED height instead, so the
         artwork stays a small constant and the tracklist takes the
         rest at every width. The white background it ships with is
         handled by a filter in CSS. */
      src = "https://w.soundcloud.com/player/?url=" +
            encodeURIComponent(btn.getAttribute("data-url")) +
            "&color=%23FFEA00&auto_play=false" +
            "&hide_related=true&show_comments=false&show_teaser=false&show_reposts=false";
    }

    var f = document.createElement("iframe");
    f.src = src;
    f.title = btn.textContent.trim();
    f.loading = "lazy";
    f.allow = "autoplay; fullscreen; encrypted-media";
    f.setAttribute("allowfullscreen", "");
    box.innerHTML = "";
    box.appendChild(f);
    box.classList.add("is-loaded");
  });

  /* ---------------------------------------------------------
     DATES — from the Worker, which reads the .ics feed.
     If nothing is coming up, show recent past dates instead.
     An empty section makes a live act look dead.
     --------------------------------------------------------- */

  var MONTHS = {
    en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    es: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"]
  };

  var datesState = null;

  function fmtDay(d) {
    return String(d.getDate()).padStart(2, "0") + " " +
           MONTHS[lang][d.getMonth()] + " " + String(d.getFullYear()).slice(2);
  }

  function fmtTime(ev) {
    if (ev.allDay) return "";
    try {
      return new Intl.DateTimeFormat(es("es-UY", "en-GB"), {
        hour: "2-digit", minute: "2-digit", hour12: false,
        timeZone: "America/Montevideo"
      }).format(new Date(ev.startMs));
    } catch (e) { return ""; }
  }

  function loadDates() {
    api("/dates")
      .then(function (d) {
        if (d.error) throw new Error(d.error);
        datesState = (d.upcoming && d.upcoming.length)
          ? { mode: "upcoming", items: d.upcoming }
          : { mode: "past", items: d.past || [] };
        renderDates();
      })
      .catch(function () {
        datesState = { mode: API ? "error" : "nokey", items: [] };
        renderDates();
      });
  }

  function renderDates() {
    if (!datesState) return;
    var box = $("dates"), note = $("datesNote");
    var items = datesState.items;

    if (datesState.mode === "nokey") {
      note.textContent = "";
      box.innerHTML = '<p class="empty">' + es(
        "Agenda no conectada todavía — agregá la URL del Worker en content.js.",
        "Calendar not connected yet — add the Worker URL in content.js.") + "</p>";
      return;
    }

    if (!items.length) {
      note.textContent = "";
      box.innerHTML = '<p class="empty">' + es(
        "Nada anunciado por ahora. Escribime para fechas.",
        "Nothing announced yet. Get in touch for dates.") + "</p>";
      return;
    }

    note.textContent = datesState.mode === "past"
      ? es("Recientes", "Recent")
      : es("Próximas", "Upcoming");

    var html = '<div class="rows">';
    items.forEach(function (ev) {
      html += '<div class="row">' +
        '<span class="row__key">' + fmtDay(new Date(ev.startMs)) + "</span>" +
        '<span class="row__main">' + esc(ev.title) + "</span>" +
        '<span class="row__end">' + fmtTime(ev) + "</span>" +
        (ev.where ? '<span class="row__sub">' + esc(ev.where) + "</span>" : "") +
        "</div>";
    });
    box.innerHTML = html + "</div>";
    sweep();
  }

  /* ---------------------------------------------------------
     CRATE — from Discogs via the Worker. Newest additions
     first. Notes you've written in content.js get merged in
     by release ID; records without one show as catalogue rows.
     --------------------------------------------------------- */

  var crateState = null;

  function loadCrate() {
    api("/crate")
      .then(function (d) {
        if (d.error) throw new Error(d.error);
        crateState = { records: d.records || [], count: d.count || 0 };
        renderCrate();
      })
      .catch(function () {
        crateState = { records: [], count: 0, failed: !!API };
        renderCrate();
      });
  }

  function renderCrate() {
    if (!crateState) return;
    var box = $("crate"), note = $("crateNote");
    var recs = crateState.records;

    if (!recs.length) {
      note.textContent = "";
      box.innerHTML = '<p class="empty">' + (crateState.failed
        ? es("No se pudo cargar la colección.", "Couldn't load the collection.")
        : es("Colección no conectada todavía.", "Collection not connected yet.")) + "</p>";
      return;
    }

    note.textContent = crateState.count
      ? crateState.count + es(" discos", " records")
      : "";

    box.innerHTML = recs.map(function (r) {
      var n = (S.crateNotes || {})[String(r.id)];
      var meta = [r.label, r.cat].filter(Boolean).join(" / ");
      return '<a class="row rec" href="' + esc(r.url) + '" target="_blank" rel="noopener">' +
        (r.thumb
          ? '<img src="' + esc(r.thumb) + '" alt="" loading="lazy" decoding="async" width="56" height="56">'
          : '<span class="rec__blank" aria-hidden="true"></span>') +
        '<span class="row__main">' + esc(r.artist) + " — " + esc(r.title) + "</span>" +
        '<span class="row__end">' + esc(r.year) + "</span>" +
        '<span class="row__sub">' + esc(meta) +
          (n ? '<em class="rec__note">' + esc(t(n)) + "</em>" : "") +
        "</span></a>";
    }).join("");
    sweep();
  }

  /* ---------------------------------------------------------
     PORTFOLIO — one curated YouTube playlist via the Worker.
     Rows link out rather than embed: an embedded player costs
     the better part of a megabyte before anyone presses play,
     and this is a list you scan, not a thing you watch in place.
     --------------------------------------------------------- */

  var videoState = null;

  function loadVideos() {
    api("/youtube")
      .then(function (d) {
        if (d.error) throw new Error(d.error);
        videoState = { videos: d.videos || [] };
        renderVideos();
      })
      .catch(function () {
        videoState = { videos: [], failed: !!API };
        renderVideos();
      });
  }

  function renderVideos() {
    if (!videoState) return;
    var box = $("portfolio"), note = $("portfolioNote");
    var vids = videoState.videos.slice(0, (S.portfolio && S.portfolio.max) || 24);

    if (!vids.length) {
      note.textContent = "";
      box.innerHTML = '<p class="empty">' + (videoState.failed
        ? es("No se pudo cargar la lista.", "Couldn\u2019t load the playlist.")
        : es("Lista no conectada todav\u00eda.", "Playlist not connected yet.")) + "</p>";
      return;
    }

    note.textContent = vids.length + " videos";

    /* A strip rather than a stack: twenty-four rows made this
       section taller than the rest of the page put together, and
       worse on a phone. Horizontal scroll-snap costs no library —
       a swipe is native, and the arrows are only for pointers. */
    box.innerHTML =
      '<div class="reel__track" id="reelTrack">' +
      vids.map(function (v) {
        return '<button class="reel__item" type="button" data-video="' + esc(v.id) + '">' +
          '<img src="' + esc(v.thumb) + '" alt="" loading="lazy" decoding="async" width="320" height="180">' +
          '<span class="reel__title">' + esc(v.title) + "</span>" +
          '<span class="reel__year">' + esc(v.year) + "</span></button>";
      }).join("") + "</div>" +
      '<div class="reel__nav">' +
        '<button class="reel__arrow" type="button" data-reel="-1" aria-label="' +
          es("Anterior", "Previous") + '">\u2190</button>' +
        '<button class="reel__arrow" type="button" data-reel="1" aria-label="' +
          es("Siguiente", "Next") + '">\u2192</button>' +
      "</div>";
    sweep();
  }

  /* Arrows page the strip by roughly one screenful. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-reel]");
    if (!a) return;
    var track = $("reelTrack");
    if (!track) return;
    var step = Math.max(160, Math.round(track.clientWidth * 0.8));
    try {
      track.scrollBy({ left: step * Number(a.getAttribute("data-reel")),
                       behavior: reduced ? "auto" : "smooth" });
    } catch (err) {
      track.scrollLeft += step * Number(a.getAttribute("data-reel"));
    }
  });

  /* Play a chosen video in the section's own player, continuing
     into the rest of the playlist afterwards. */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-video]");
    if (!btn) return;

    var id = btn.getAttribute("data-video");
    var player = $("portfolioPlayer");

    var f = player.querySelector("iframe");
    if (!f) {
      f = document.createElement("iframe");
      f.title = "YouTube";
      f.loading = "lazy";
      f.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
      f.setAttribute("allowfullscreen", "");
      player.innerHTML = "";
      player.appendChild(f);
      player.classList.add("is-loaded");
    }

    f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) +
            "?autoplay=1&rel=0&list=" + encodeURIComponent(C.youtubePlaylist);
    player.hidden = false;

    var rows = $("portfolio").querySelectorAll("[data-video]");
    Array.prototype.forEach.call(rows, function (r) {
      r.classList.toggle("is-playing", r === btn);
    });
  });

  /* ---------------------------------------------------------
     RENDER — everything else driven by content.js
     --------------------------------------------------------- */

  function render() {
    var id = S.identity;

    /* The mark is pixel art, so the wordmark is drawn on the same
       grid instead of being set in a typeface that fights it. The
       real text stays in the h1 for search and screen readers; the
       SVG is decorative. If a name ever contains a glyph the set
       doesn't have, this falls back to plain text. */
    var wm = $("wordmark"), drawn = pixelText(id.name, "pix pix--wordmark");
    if (drawn) {
      wm.innerHTML = '<span class="sr">' + esc(id.name) + "</span>" + drawn +
                     '<span class="wordmark__cursor" aria-hidden="true"></span>';
      wm.classList.add("wordmark--pix");
    } else {
      wm.textContent = id.name;
    }

    var mk = document.querySelector(".status__mark");
    var mkPix = pixelText(id.name.charAt(0), "pix");
    if (mk && mkPix) {
      mk.innerHTML = '<span class="sr">' + esc(id.name.charAt(0)) + "</span>" + mkPix;
    }

    var L = lang === "es"
      ? { artist: "Artista", base: "Base", since: "Desde", format: "Formato", styles: "Estilos" }
      : { artist: "Artist", base: "Base", since: "Since", format: "Format", styles: "Styles" };

    $("specs").innerHTML =
      spec(L.artist, id.name.toLowerCase()) +
      spec(L.base, id.base + "  ·  UTC−3") +
      spec(L.since, id.since) +
      spec(L.format, id.formats) +
      spec(L.styles, id.styles);

    $("bioEn").textContent = id.bio.en;
    $("bioEs").textContent = id.bio.es;

    if (S.hero && S.hero.src) {
      var fig = $("heroImg");
      fig.hidden = false;
      fig.innerHTML = '<img src="' + esc(S.hero.src) + '" alt="' + esc(t(S.hero.alt)) +
                      '" loading="lazy" decoding="async">';
    }

    $("sets").innerHTML = (S.sets || []).map(function (s) {
      return '<div class="embed embed--audio set">' +
        '<button class="embed__btn" type="button" data-embed="sc" data-url="' + esc(s.url) + '">' +
        esc(s.title) + "<small>" + esc(t(s.note)) + "</small></button></div>";
    }).join("");

    $("elsewhere").innerHTML = linkGroups(S.elsewhere || []);

    var F = S.footer || {};
    $("glyphs").textContent = F.glyphs || "";
    $("tagline").textContent = F.tagline || "";

    $("support").innerHTML = (S.support || []).map(function (s) {
      return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
        es("Apoyame", "Support") + " · " + esc(s.label) + "</a>";
    }).join(" ");

    renderDates();
    renderCrate();
    renderVideos();
    sweep();
  }

  /* Accepts either a flat array of links or an array of
     { group, links } — so an older flat list still renders. */
  function linkGroups(list) {
    var grouped = list.length && list[0] && list[0].links;
    if (!grouped) return list.map(linkRow).join("");
    return list.map(function (g) {
      if (!g.links || !g.links.length) return "";
      return '<div class="group"><h3 class="group__name">' + esc(t(g.group)) + "</h3>" +
             g.links.map(linkRow).join("") + "</div>";
    }).join("");
  }

  /* The hostname column restated the name in almost every row —
     soundcloud.com next to SoundCloud, nightwatcher.life next to
     Nightwatcher. Dropped it: the name is the link, and the two
     rows that genuinely need context already carry a tag. */
  function linkRow(l) {
    return '<div class="row row--link">' +
      '<span class="row__main">' +
        '<a class="row__link" href="' + esc(l.url) + '" target="_blank" rel="noopener me">' +
          esc(l.label) + "</a>" +
        (l.note ? ' <span class="row__tag">' + esc(t(l.note)) + "</span>" : "") +
      "</span>" +
      '<span class="row__end" aria-hidden="true">\u2197</span></div>';
  }

  function spec(k, v) {
    return '<div class="spec"><dt>' + esc(k) + "</dt><dd>" + esc(v) + "</dd></div>";
  }

  /* ---------------------------------------------------------
     CONTACT FORM
     --------------------------------------------------------- */

  $("contactForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.currentTarget, msg = $("formMsg"), data = new FormData(form);

    if (data.get("company")) return;            // bot filled the honeypot

    if (!data.get("name") || !data.get("email") || !data.get("message")) {
      msg.textContent = es("Completá los tres campos.", "Fill in all three fields.");
      return;
    }

    if (!C.formEndpoint) {
      location.href = "mailto:" + C.email +
        "?subject=" + encodeURIComponent("6ummy.xyz — " + data.get("name")) +
        "&body=" + encodeURIComponent(data.get("message") + "\n\n" + data.get("email"));
      return;
    }

    msg.textContent = es("Enviando…", "Sending…");
    fetch(C.formEndpoint, { method: "POST", headers: { "Accept": "application/json" }, body: data })
      .then(function (r) {
        if (!r.ok) throw new Error();
        form.reset();
        msg.textContent = es("Enviado. Te respondo pronto.", "Sent. I'll get back to you.");
      })
      .catch(function () {
        msg.textContent = es("No se pudo enviar. Escribime a " + C.email,
                             "That didn't send. Email me at " + C.email);
      });
  });

  /* ---------------------------------------------------------
     PIXEL NUMERALS — a 5x7 dot-matrix set, the character cell
     80s terminals used. Drawn as SVG rects rather than loaded as
     a font: eleven glyphs is far less than a font file, it can't
     fail to arrive, and it scales without ever being resampled —
     which matters when the mark it sits next to is pixel art.
     --------------------------------------------------------- */

  var PIX = {
    "0": ["01110","10001","10011","10101","11001","10001","01110"],
    "1": ["00100","01100","00100","00100","00100","00100","01110"],
    "2": ["01110","10001","00001","00010","00100","01000","11111"],
    "3": ["11111","00010","00100","00010","00001","10001","01110"],
    "4": ["00010","00110","01010","10010","11111","00010","00010"],
    "5": ["11111","10000","11110","00001","00001","10001","01110"],
    "6": ["00110","01000","10000","11110","10001","10001","01110"],
    "7": ["11111","00001","00010","00100","01000","01000","01000"],
    "8": ["01110","10001","10001","01110","10001","10001","01110"],
    "9": ["01110","10001","10001","01111","00001","00010","01100"],
    "A": ["01110","10001","10001","11111","10001","10001","10001"],
    "B": ["11110","10001","10001","11110","10001","10001","11110"],
    "C": ["01110","10001","10000","10000","10000","10001","01110"],
    "D": ["11110","10001","10001","10001","10001","10001","11110"],
    "E": ["11111","10000","10000","11110","10000","10000","11111"],
    "F": ["11111","10000","10000","11110","10000","10000","10000"],
    "G": ["01110","10001","10000","10111","10001","10001","01111"],
    "H": ["10001","10001","10001","11111","10001","10001","10001"],
    "I": ["01110","00100","00100","00100","00100","00100","01110"],
    "J": ["00111","00010","00010","00010","00010","10010","01100"],
    "K": ["10001","10010","10100","11000","10100","10010","10001"],
    "L": ["10000","10000","10000","10000","10000","10000","11111"],
    "M": ["10001","11011","10101","10101","10001","10001","10001"],
    "N": ["10001","11001","11001","10101","10011","10011","10001"],
    "O": ["01110","10001","10001","10001","10001","10001","01110"],
    "P": ["11110","10001","10001","11110","10000","10000","10000"],
    "Q": ["01110","10001","10001","10001","10101","10010","01101"],
    "R": ["11110","10001","10001","11110","10100","10010","10001"],
    "S": ["01111","10000","10000","01110","00001","00001","11110"],
    "T": ["11111","00100","00100","00100","00100","00100","00100"],
    "U": ["10001","10001","10001","10001","10001","10001","01110"],
    "V": ["10001","10001","10001","10001","10001","01010","00100"],
    "W": ["10001","10001","10001","10101","10101","11011","10001"],
    "X": ["10001","10001","01010","00100","01010","10001","10001"],
    "Y": ["10001","10001","01010","00100","00100","00100","00100"],
    "Z": ["11111","00001","00010","00100","01000","10000","11111"],
    ".": ["00","00","00","00","00","11","11"],
    "-": ["00000","00000","00000","11111","00000","00000","00000"],
    " ": ["000","000","000","000","000","000","000"]
  };

  /* Returns "" if the string contains anything the set doesn't
     cover, so the caller can fall back to real text rather than
     render a wordmark with holes in it. */
  function pixelText(str, cls) {
    str = String(str || "").toUpperCase();
    var x = 0, rects = "";
    for (var i = 0; i < str.length; i++) {
      var g = PIX[str.charAt(i)];
      if (!g) return "";
      for (var y = 0; y < g.length; y++) {
        for (var c = 0; c < g[y].length; c++) {
          if (g[y].charAt(c) === "1") {
            rects += '<rect x="' + (x + c) + '" y="' + y + '" width="1" height="1"/>';
          }
        }
      }
      x += g[0].length + 1;
    }
    var w = Math.max(1, x - 1);
    return '<svg class="' + (cls || "pix") + '" viewBox="0 0 ' + w + ' 7" ' +
           'preserveAspectRatio="xMinYMid meet" fill="currentColor" ' +
           'shape-rendering="crispEdges" focusable="false" aria-hidden="true">' +
           rects + "</svg>";
  }

  function pixelNum(str) { return pixelText(str, "pix"); }

  /* ---------------------------------------------------------
     SECTION INDEX + HEAD CONTROLS

     Two behaviours were asked for on one gesture, so they get
     separate targets rather than a mode: the label jumps to the
     section's own top, the index toggles it open or shut. A single
     tap doing both would have to guess.

     All of this is added from JS. The HTML stays a plain document,
     so with JS off there are still seven readable sections, a CSS
     counter for the numbering, and no dead buttons.
     --------------------------------------------------------- */

  var sections = [], indexItems = [], enhanced = false;

  function barPx() {
    var b = document.querySelector(".status");
    return b ? b.getBoundingClientRect().height : 36;
  }

  function goTo(sec) {
    var y = sec.getBoundingClientRect().top + window.pageYOffset - barPx();
    try {
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    } catch (e) { window.scrollTo(0, y); }
  }

  function enhanceSections() {
    if (enhanced) return;
    sections = [].slice.call(document.querySelectorAll("main .section"));
    if (!sections.length) return;
    enhanced = true;

    var nav = document.createElement("nav");
    nav.className = "index";
    nav.setAttribute("aria-label", "Sections");
    var list = document.createElement("ol");
    list.className = "index__list";

    sections.forEach(function (sec, i) {
      var head = sec.querySelector(".section__head");
      var h2 = head && head.querySelector("h2");
      if (!head || !h2) return;

      var num = String(i + 1);
      if (!sec.id) sec.id = "sec-" + (i + 1);
      var bodyId = sec.id + "-body";

      /* Everything after the head becomes one collapsible body. */
      var body = document.createElement("div");
      body.className = "section__body";
      body.id = bodyId;
      while (head.nextSibling) body.appendChild(head.nextSibling);
      sec.appendChild(body);

      /* Label -> jump. The h2's two language spans move inside the
         button, so the CSS language switch keeps working untouched. */
      var jump = document.createElement("button");
      jump.type = "button";
      jump.className = "section__jump";
      while (h2.firstChild) jump.appendChild(h2.firstChild);
      h2.appendChild(jump);
      jump.addEventListener("click", function () { goTo(sec); });

      /* Index -> collapse. */
      var tog = document.createElement("button");
      tog.type = "button";
      tog.className = "section__toggle";
      tog.textContent = num;
      tog.setAttribute("aria-controls", bodyId);
      tog.setAttribute("aria-expanded", "true");
      tog.setAttribute("aria-label", num);
      head.appendChild(tog);
      head.classList.add("is-enhanced");

      tog.addEventListener("click", function () {
        var open = sec.classList.toggle("is-shut") === false;
        tog.setAttribute("aria-expanded", open ? "true" : "false");
        body.hidden = !open;
        /* Collapsing above the viewport would yank the page out from
           under the reader, so hold this section's head in place. */
        if (!open) goTo(sec);
        spy();
      });

      /* Index entry. The label spans are cloned, so switching
         language updates the sidebar with no extra wiring. */
      var li = document.createElement("li");
      var a = document.createElement("button");
      a.type = "button";
      a.className = "index__item";
      var lab = document.createElement("span");
      lab.className = "index__label";
      [].forEach.call(jump.children, function (n) { lab.appendChild(n.cloneNode(true)); });
      var n = document.createElement("span");
      n.className = "index__num";
      n.innerHTML = pixelNum(num);
      a.setAttribute("aria-label", num + " " + (h2.textContent || "").trim());
      a.appendChild(lab);
      a.appendChild(n);
      a.addEventListener("click", function () { goTo(sec); });
      li.appendChild(a);
      list.appendChild(li);
      indexItems.push({ sec: sec, el: a });
    });

    nav.appendChild(list);
    document.body.appendChild(nav);
    spy();
  }

  /* Which section owns the top of the screen. */
  var spying = false;
  function spy() {
    if (spying) return;
    spying = true;
    requestAnimationFrame(function () {
      spying = false;
      var edge = barPx() + 4, current = null;
      indexItems.forEach(function (it) {
        if (it.sec.getBoundingClientRect().top <= edge) current = it;
      });
      if (!current && indexItems.length) current = null;
      indexItems.forEach(function (it) {
        var on = it === current;
        it.el.classList.toggle("is-current", on);
        if (on) it.el.setAttribute("aria-current", "true");
        else it.el.removeAttribute("aria-current");
      });
    });
  }
  window.addEventListener("scroll", spy, { passive: true });
  window.addEventListener("resize", spy);

  /* ---------------------------------------------------------
     REVEALS — reveal and settle, nothing pinned or scrubbed.
     The page is short; heavy choreography would read as padding.

     The .reveal class is added from here rather than sitting in
     the HTML, so a reader with JS disabled never meets a page of
     permanently invisible sections. Same reason it bails out
     entirely under prefers-reduced-motion instead of relying on
     the stylesheet to neutralise it.
     --------------------------------------------------------- */

  var reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var observer = null;

  function watch(nodes) {
    if (reduced || !observer) return;
    Array.prototype.forEach.call(nodes, function (el, i) {
      if (el.dataset.revealed) return;
      el.dataset.revealed = "1";
      el.classList.add("reveal");
      el.style.setProperty("--i", Math.min(i, 8));
      observer.observe(el);
    });
  }

  function initReveals() {
    if (reduced || !("IntersectionObserver" in window)) return;

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        observer.unobserve(en.target);       // one-way: no re-animating on scroll back
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    sweep();
  }

  /* Rows arrive after their fetch resolves, so this runs again
     each time a section renders. */
  function sweep() {
    watch(document.querySelectorAll(".hero .specs, .hero .bio"));
    watch(document.querySelectorAll(".row, .group, .embed"));
  }

  /* --------------------------------------------------------- */

  render();
  enhanceSections();
  initReveals();
  loadDates();
  loadCrate();
  loadVideos();

})();
