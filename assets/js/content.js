/* ============================================================
   6UMMY — content & config
   This is the only file you need to edit for normal updates.
   No build step. Save, commit, done.
   ============================================================ */

window.SITE = {

  /* ---------- 1. KEYS & ENDPOINTS ---------------------------
     Fill these in when you have them. Anything left as ""
     degrades gracefully — the section just hides or falls back.
     --------------------------------------------------------- */
  config: {

    // Your Cloudflare Worker. One URL powers three sections:
    //   /live   Twitch status      /dates  calendar      /crate  Discogs
    // Leave "" and all three degrade quietly instead of breaking.
    workerUrl: "https://6ummy-api.6ummy-xyz.workers.dev",

    // Contact form. Formspree / Web3Forms / your own Worker.
    // Not a secret — safe to keep here.
    formEndpoint: "",
    email: "sync@6ummy.xyz",      // mailto: fallback if the above is empty

    twitchChannel: "6ummy",

    // Public playlist ID. The Worker holds its own copy for the API
    // call; this one builds the embed URL in the browser, so the
    // player still works if the Worker is unreachable.
    youtubePlaylist: "PLToFguQXkN1vWOwHi10bbgIUxUngpc0MI",
    defaultLang: "auto"           // "auto" | "en" | "es"
  },

  /* ---------- 2. IDENTITY ---------------------------------- */
  identity: {
    name: "6UMMY",
    since: "2004",
    base: "Montevideo, UY",
    formats: "Vinyl / Digital",
    styles: "Techno · House · Rares",
    bio: {
      en: "DJ, collector and curator based in Uruguay. Records, livestreams, and the occasional rare find worth talking about.",
      es: "DJ, coleccionista y curador radicado en Uruguay. Discos, transmisiones en vivo y de vez en cuando una rareza que vale la pena contar."
    }
  },

  /* ---------- 3. HERO IMAGE --------------------------------
     Drop any photo in assets/img/ and point to it.
     It gets desaturated automatically — no editing needed,
     so you can swap it as often as you like.
     Leave src: "" to run type-only (looks good too).
     --------------------------------------------------------- */
  hero: {
    src: "",                      // e.g. "assets/img/booth.jpg"
    alt: { en: "6ummy in the booth", es: "6ummy en cabina" }
  },

  /* ---------- 4. SETS --------------------------------------
     SoundCloud playlists or tracks. Click-to-load, so having
     several costs nothing until someone presses play.
     --------------------------------------------------------- */
  sets: [
    {
      title: "Vinyl DJ Sets",
      note: { en: "Recorded vinyl sessions.", es: "Sesiones grabadas en vinilo." },
      url: "https://soundcloud.com/6ummy/sets/sets"
    },
    {
      title: "Décimo Piso",
      note: { en: "Series.", es: "Serie." },
      url: "https://soundcloud.com/6ummy/sets/decimo-piso"
    },
    {
      title: "mnml snds",
      note: { en: "Minimal selections, ongoing series.", es: "Selecciones minimal, serie en curso." },
      url: "https://soundcloud.com/6ummy/sets/mnml-snds"
    }
    // Add the rest here — same three fields. Order on this list is
    // the order on the page.
  ],

  /* ---------- 5. PORTFOLIO --------------------------------
     One curated YouTube playlist, mirrored in playlist order.
     Rearrange it on YouTube and the page follows — nothing to
     edit here. The playlist ID goes in the Worker as a secret
     (YOUTUBE_PLAYLIST), not in this file, so it stays with the
     API key it's used against.

     Rows link out to YouTube rather than embedding: an embedded
     player is ~900KB per video before anyone presses play.
     --------------------------------------------------------- */
  portfolio: {
    max: 24                       // only used for the count shown in the header
  },

  /* ---------- 6. CRATE ------------------------------------
     Records come from Discogs automatically, newest first —
     add a record there and it appears here. Nothing to maintain.

     What Discogs can't give you is why a record matters. Write
     a line for the few you care about, keyed by the Discogs
     release ID (the number in the release URL). Records without
     a note still show as a clean catalogue row.

     To get a paste-ready scaffold with the real IDs already filled
     in, open the live site and run this in the browser console:

       fetch(SITE.config.workerUrl + "/crate")
         .then(r => r.json())
         .then(d => console.log(d.records.map(r =>
           `    "${r.id}": { // ${r.artist} — ${r.title}\n` +
           `      en: "",\n      es: ""\n    },`).join("\n")));

     It prints one block per record currently in the crate. Paste the
     output between the braces below and write the two lines. Only the
     newest 12 are fetched, so notes on older releases will not render.
     --------------------------------------------------------- */
  crateNotes: {
    // "249504": {
    //   en: "Found it in a bin in Cordón for nothing.",
    //   es: "Lo encontré tirado en un cajón en Cordón, por nada."
    // },
  },

  /* ---------- 7. ELSEWHERE ---------------------------------
     Grouped, because eight flat rows read as a pile. Each group
     is a heading plus its links; reorder either freely.

     A flat array still works if you'd rather not group — the
     renderer accepts both shapes.
     --------------------------------------------------------- */
  elsewhere: [
    {
      group: { en: "Projects", es: "Proyectos" },
      links: [
        { label: "Nightwatcher",  url: "https://nightwatcher.life" },
        { label: "Techno Punks",  url: "https://discord.gg/CfmfMxDZv5",
          note: { en: "discord", es: "discord" } },
        { label: "DMF",           url: "https://www.youtube.com/@domingo_feliz",
          note: { en: "youtube", es: "youtube" } },
        { label: "Décimo Piso",   url: "https://www.youtube.com/@10mopiso",
          note: { en: "youtube", es: "youtube" } }
      ]
    },
    {
      group: { en: "Social", es: "Social" },
      links: [
        { label: "X",       url: "https://x.com/6ummy" },
        { label: "VINILOS", url: "https://x.com/i/communities/1493258083975385088",
          note: { en: "community", es: "comunidad" } }
      ]
    },
    {
      group: { en: "Collection", es: "Colección" },
      links: [
        { label: "OpenSea", url: "https://opensea.io/6ummy" },
        { label: "OBJKT",   url: "https://objkt.com/@6ummy" }
      ]
    }
  ],

  /* ---------- 8. SUPPORT ----------------------------------- */
  support: [
    { label: "PayPal", url: "https://www.paypal.com/paypalme/6ummy" }
  ],

  /* ---------- 9. FOOTER ------------------------------------
     The glyph row is decorative, so it's hidden from screen
     readers — the tagline underneath carries the meaning.
     --------------------------------------------------------- */
  footer: {
    glyphs: "🎧 🎚 🖤 🎛️ 🎶",
    tagline: "art + love + tech"
  }
};
