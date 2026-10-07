#!/usr/bin/env node
/* Nocturne — the paper's builder and checker.  node qa/nocturne.js build|check

   One module, two doors. `npm run nocturne:build` writes docs/nocturne/ and
   the sitemap's Nocturne block from nocturne/issues/; `npm run nocturne:check`
   holds every issue to the contract in nocturne/BRIEF.md §5 and the mechanical
   half of nocturne/VOICE.md, and fails if docs/nocturne/ is not exactly what
   the build would write. qa/guards.js requires this same file for sections
   163-168, so the rule the drafting agent runs is the rule CI runs.

   It lives in qa/, not in nocturne/, on purpose: the agent writes only in
   nocturne/issues/ and docs/nocturne/, so it cannot edit the checks that
   judge its work.

   The catalogue is read out of docs/index.html (PATH and tierOf are sliced
   and evaluated, never restated here), so an "On the map" box says what the
   app says. Nothing here reads the clock: the same issues build the same
   bytes on any machine, which is what lets section 163 compare them. */
"use strict";

var fs   = require("fs");
var path = require("path");
var vm   = require("vm");

var ROOT    = path.join(__dirname, "..");
var SITE    = "https://nightwatcher.life";
var OUT_REL = "docs/nocturne";
var SRC_REL = "nocturne/issues";

var LIMITS = {
  title: 70, alt: 125, coldOpen: 50, image: 250 * 1024, side: 1600,
  images: 3, page: 40 * 1024, feed: 20,
  /* 6.2.3: a weekly issue's lengths are a ceiling, not a target. A big week
     may run long; a thin week runs short, and the floor stays so nothing is
     padded to reach a number. No. 0's limits do not move. */
  weekly:   {min: 3, max: 8, words: [250, 3000], story: [60, 500]},
  founding: {min: 4, max: 6, words: [600, 900], story: [60, 260]}
};
var STATUS  = {confirmed: "Confirmed", reported: "Reported", provisional: "Provisional"};
var EFFECTS = ["new-entry", "parked-date", "unparked", "none"];
var KINDS   = ["weekly", "founding"];
/* 6.3.0. Every weekly story carries its beat; Nocturne covers all of Batman. */
var BEATS   = ["screen", "comics", "games", "toys", "books", "other"];
var LATE    = "Late wires";
/* VOICE.md §8's list, the part a machine can hold. "drops" as a verb and a
   service named as advice need a reader; the editor checks those (§11). */
var BANNED  = ["epic", "iconic", "legendary", "must-watch", "must watch", "game-changer",
               "game changer", "fans rejoice", "buzz", "buzzing", "MCU", "click here"];
/* 6.3.3. The reporter, the part a machine can hold (REPORTER.md, CASEBOOK.md).
   Names his file and his casebook never let into print, and DC's own papers;
   the regulars, one an issue at most; and the plain shapes of Batman speaking
   about our world. A pattern catches only the plain forms: the rest is the
   Night Editor's and the owner's read (VOICE.md §11). "Caped Crusader" is not
   here: it is a series in the catalogue, so as a nickname it is a reader's
   catch. */
var NEVER   = ["Father Lusk", "Noonan's", "Noonan\u2019s", "calling card", "Daily Planet",
               "Gotham Gazette", "Gotham Globe", "Gotham Times", "Gotham Herald",
               "nameless reporter", "kind of ghost", "best journalist",
               /* 6.3.5: the press of the films and the paperbacks, and their
                  phrases (REPORTER.md §6). The shape he is not. */
               "Chuck Tatum", "Hildy Johnson", "Walter Burns", "Hunsecker", "Sidney Falco",
               "Sid Hudgens", "Lou Bloom", "Kolchak", "mean streets", "not himself mean",
               "L.A. Noir", "eight million stories", "just the facts"];
var REGULARS = ["Dorrie", "Ansel", "Cal Rhine"];
var BAT_ON_US = /\b(Batman|Gordon)\s+(?:would(?:n't|n\u2019t| not)?\s+(?:like|love|approve|hate|enjoy|want|watch|read|buy|play|pick)|thinks|likes|loves|approves|told (?:me|us|this desk))\b/;
var MONTHS  = ["January", "February", "March", "April", "May", "June", "July",
               "August", "September", "October", "November", "December"];
/* 6.7.0. The index date. September is Sept, the paper's own short month. */
var MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
var DAYS    = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* 6.2.3. The characters an issue may carry are the ones the paper's fonts
   carry: the ranges in qa/font-subset.json, the file the subset faces are
   blessed against. Anything else renders in a system font (the paper's old
   U+2197 arrow did), so the check refuses it and names it. */
var GLYPHS = (function(){
  var rec = JSON.parse(fs.readFileSync(path.join(__dirname, "font-subset.json"), "utf8"));
  return rec.ranges.map(function(r){
    var m = /^U\+([0-9A-F]+)(?:-([0-9A-F]+))?$/i.exec(r);
    if(!m) throw new Error("qa/font-subset.json has a range this check cannot read: " + r);
    return [parseInt(m[1], 16), parseInt(m[2] || m[1], 16)];
  });
})();
function glyphErrors(text, where){
  var bad = {};
  Array.from(String(text)).forEach(function(ch){
    var cp = ch.codePointAt(0);
    if(cp === 10 || cp === 13 || cp === 9) return;
    if(!GLYPHS.some(function(r){ return cp >= r[0] && cp <= r[1]; })){
      bad["U+" + ("000" + cp.toString(16).toUpperCase()).slice(-4) + " (" + ch + ")"] = 1;
    }
  });
  var k = Object.keys(bad);
  return k.length ? [where + ": " + k.join(", ") + " — outside the paper's fonts (qa/font-subset.json); it would render in a system font"] : [];
}

/* 6.2.3. Merch is news, never shopping (VOICE.md §8): no tracking or
   affiliate parameters in a link, no affiliate or shortener hosts. The
   source is the page as a reader would open it, not as a campaign tagged it. */
var TRACKING  = /^(utm_.+|fbclid|gclid|gbraid|wbraid|dclid|msclkid|yclid|mc_cid|mc_eid|igshid|igsh|si|_hsenc|_hsmi|mkt_tok|tag|ascsubtag|aff|affid|aff_id|affiliate|affiliate_id|clickid|irclickid)$/i;
var AFFHOSTS  = /(^|\.)(amzn\.to|a\.co|bit\.ly|tinyurl\.com|t\.co|ow\.ly|go\.skimresources\.com|click\.linksynergy\.com|shareasale\.com|awin1\.com|anrdoezrs\.net|jdoqocy\.com|tkqlhce\.com|dpbolvw\.net|kqzyfj\.com|howl\.me|shop-links\.co|geni\.us)$/i;
function linkErrors(u, where){
  var e = [], url;
  try { url = new URL(u); } catch(err){ return [where + ": " + u + " is not a URL"]; }
  if(AFFHOSTS.test(url.hostname)) e.push(where + ": " + url.hostname + " is a shortener or an affiliate host — link the page itself");
  var keys = [];
  url.searchParams.forEach(function(v, k){ if(TRACKING.test(k) && keys.indexOf(k) < 0) keys.push(k); });
  if(keys.length) e.push(where + ": " + u + " carries a tracking or affiliate parameter (" + keys.join(", ") + ") — link the page without it");
  return e;
}

/* ---------- the catalogue, from the app ---------- */

function loadCatalogue(root){
  var html = fs.readFileSync(path.join(root, "docs", "index.html"), "utf8");
  function slice(a, b){
    var i = html.indexOf(a), j = html.indexOf(b, i + 1);
    if(i < 0 || j < 0) throw new Error("cannot find " + a + " in docs/index.html");
    return html.slice(i, j);
  }
  var tierSrc = (html.match(/function tierOf\(f\)\{[^\n]*\}/) || [])[0];
  if(!tierSrc) throw new Error("cannot find tierOf() in docs/index.html");
  var box = {};
  vm.createContext(box);
  vm.runInContext(slice("var PATH = [", "var MODENOTE") + "\n" + tierSrc +
                  "\nthis.PATH = PATH; this.tierOf = tierOf;", box);
  var byId = {};
  box.PATH.forEach(function(g){
    g.films.forEach(function(f, ix){
      var e = {id: f.i, t: f.t, sub: f.sub || "", b: f.b || [], o: !!f.o, when: f.when || "",
               gn: g.n, gname: g.name, prev: ix ? g.films[ix - 1] : null,
               next: ix < g.films.length - 1 ? g.films[ix + 1] : null};
      e.tier = box.tierOf(e);
      e.parked = e.b.indexOf("u") >= 0;
      byId[f.i] = e;
    });
  });
  /* 6.3.0. Names are names. The voice rules are for our words, and the
     catalogue's own names print exactly as the app spells them, a listed
     word or a ! included (The Batman Epic Crime Saga, Teen Titans Go!). The
     names are kept here, from PATH itself, so no list is restated. */
  var names = {};
  box.PATH.forEach(function(g){
    names[g.name] = 1;
    g.films.forEach(function(f){ names[f.t] = 1; if(f.sub) names[f.sub] = 1; });
  });
  Object.defineProperty(byId, "__names", {value: Object.keys(names), enumerable: false});
  return byId;
}

/* ---------- reading an issue ---------- */

function yamlLib(){
  try { return require("yaml"); }
  catch(e){ throw new Error("the yaml package is missing — run npm ci"); }
}

function readIssue(dir){
  var id = path.basename(dir);
  var file = path.join(dir, "issue.md");
  var out = {id: id, dir: dir, errors: [], fm: null, body: ""};
  if(!fs.existsSync(file)){ out.errors.push("no issue.md in the folder"); return out; }
  var raw = fs.readFileSync(file, "utf8");
  if(raw.indexOf("\r") >= 0) out.errors.push("issue.md has CR line endings — LF only");
  var m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if(!m){ out.errors.push("issue.md does not open with a --- front-matter block"); return out; }
  try {
    var doc = yamlLib().parseDocument(m[1], {schema: "core", uniqueKeys: true});
    if(doc.errors.length) throw doc.errors[0];
    out.fm = doc.toJS();
  } catch(e){
    out.errors.push("front matter does not parse: " + String(e.message).split("\n")[0]);
    return out;
  }
  out.body = m[2];
  return out;
}

function listIssues(srcDir){
  if(!fs.existsSync(srcDir)) return [];
  return fs.readdirSync(srcDir).filter(function(n){
    return n.charAt(0) !== "." && fs.statSync(path.join(srcDir, n)).isDirectory();
  }).sort().map(function(n){ return readIssue(path.join(srcDir, n)); });
}

/* ---------- the markdown subset ---------- */
/* VOICE.md keeps the body to paragraphs, ## headlines, *italic*, **bold**
   and links. Anything else is refused rather than rendered, so the page can
   never carry markup the agent reached for. */

function esc(s){
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;");
}
/* 6.3.1: the app's own mark (index.html's header), and the standard feed glyph. */
var MARK = '<svg class="mk" viewBox="8 16 84 70" aria-hidden="true"><g fill="currentColor" transform="translate(0,5)">' +
  '<path d="M50 36 C 44 25, 29 21, 12 30 C 21 34, 25 41, 24 50 C 31 45, 37 47, 39 55 C 43 50, 47 51, 49 58 L 50 61 L 51 58 C 53 51, 57 50, 61 55 C 63 47, 69 45, 76 50 C 75 41, 79 34, 88 30 C 71 21, 56 25, 50 36 Z"/>' +
  '<path d="M42 32 L49 29 L38 17 Z"/><path d="M58 32 L62 17 L51 29 Z"/><ellipse cx="50" cy="42" rx="10" ry="11"/>' +
  '<path d="M50 51 C 45 60, 45 69, 50 78 C 55 69, 55 60, 50 51 Z"/></g></svg>';
var RSS = '<svg class="rss" viewBox="0 0 12 12" aria-hidden="true"><circle cx="2.2" cy="9.8" r="1.5" fill="currentColor"/>' +
  '<path d="M1.2 5.3a5.5 5.5 0 0 1 5.5 5.5M1.2 1.4a9.4 9.4 0 0 1 9.4 9.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
var ARROW = '<svg class="arr" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 9.5 9.2 2.8M4.2 2.5h5.3v5.3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
/* 6.4.0. Into the paper, not out of it: a plain right arrow. The ↗ stays for links that leave. */
var ARROW_IN = '<svg class="arr" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.8 6h8M6.6 2.6 10 6l-3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
/* 6.6.4. Previous is that arrow mirrored across the icon. No Unicode arrow. */
var ARROW_BACK = '<svg class="arr" viewBox="0 0 12 12" aria-hidden="true"><path d="M10.2 6h-8M5.4 2.6 2 6l3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
/* 6.7.0. Index-row arrows. The right one is a hair longer than ARROW_IN.
   6.7.2. Back to Nocturne uses the same arrow mirrored, so it points back. */
var ROW_ON = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.8 6h8.2M6.6 2.6 10 6l-3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
var ROW_BACK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M10.2 6h-8.2M5.4 2.6 2 6l3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
var ROW_DOWN = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.8v8.2M2.6 6.6 6 10l3.4-3.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
var THEME_SWITCH = '<div class="themerow"><button class="dsw" type="button" role="switch" aria-checked="false" aria-label="Darker theme" data-theme-switch><span class="dl">Dark deco</span><span class="trk" aria-hidden="true"><i></i></span><span class="dl">Darker</span></button></div>\n';
function unesc(s){
  return String(s).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function inline(text){
  var links = [];
  var t = esc(text).replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, function(_, label, url){
    links.push(url);
    return "\u0000" + (links.length - 1) + "\u0001" + label + "\u0002";
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
       .replace(/\*([^*]+)\*/g, "<em>$1</em>")
       .replace(/(^|[^\w])_([^_]+)_(?!\w)/g, "$1<em>$2</em>");
  return t.replace(/\u0000(\d+)\u0001([^\u0002]*)\u0002/g, function(_, n, label){
    /* The URL was captured out of text esc() had already escaped, so it is
       escaped exactly once here; escaping it again turned & into &amp;amp;
       and sent the reader to another address (6.2.3). A " cannot survive
       inside it: esc() made it &quot; before the capture. The arrow is the
       app's inline SVG; U+2197 is outside the fonts. */
    return '<a href="' + links[+n] + '">' + label + ARROW + "</a>";
  });
}
function plain(text){
  return String(text).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*|\*|(^|\s)_|_(\s|$)/g, "$1$2");
}
function words(text){
  var t = plain(text).trim();
  return t ? t.split(/\s+/).length : 0;
}
function linksIn(text){
  var out = [], re = /\[[^\]]+\]\(([^)\s]+)\)/g, m;
  while((m = re.exec(text))) out.push(m[1]);
  return out;
}
function splitBody(body){
  var sections = [], lead = [], cur = null;
  body.split("\n").forEach(function(line){
    var h = line.match(/^## (.+)$/);
    if(h){ cur = {headline: h[1].trim(), lines: []}; sections.push(cur); return; }
    (cur ? cur.lines : lead).push(line);
  });
  sections.forEach(function(s){
    s.text = s.lines.join("\n").trim();
    s.paras = s.text ? s.text.split(/\n\s*\n/).map(function(p){ return p.replace(/\s*\n\s*/g, " ").trim(); }) : [];
  });
  return {lead: lead.join("\n").trim(), sections: sections};
}
function subsetErrors(text, where){
  var e = [];
  text.split("\n").forEach(function(line){
    if(/^\s*(#{1}|#{3,})\s/.test(line))  e.push(where + ": only ## headlines are allowed");
    if(/^\s*([-*+]|\d+[.)])\s/.test(line)) e.push(where + ": lists are not part of the body");
    if(/^\s*>/.test(line))                 e.push(where + ": block quotes are not part of the body");
    if(/^\s*\|/.test(line))                e.push(where + ": tables are not part of the body");
  });
  if(/!\[/.test(text))   e.push(where + ": images go in the front matter, never inline");
  if(/`/.test(text))     e.push(where + ": no code spans");
  if(/<[a-z/!]/i.test(text)) e.push(where + ": raw HTML is refused");
  var bad = linksIn(text).filter(function(u){ return !/^https:\/\//.test(u); });
  if(bad.length) e.push(where + ": every link is https — " + bad.join(", "));
  return e;
}
/* 6.3.0. A name is removed before the voice rules read the text: exact and
   case-sensitive, longest first, so "The Batman Epic Crime Saga" passes and
   "an epic saga" beside it still fails, and a re-cased name is not a name. */
function stripNames(t, names){
  (names || []).slice().sort(function(a, b){ return b.length - a.length; }).forEach(function(n){
    if(n) t = t.split(n).join(" ");
  });
  return t;
}
function bannedIn(t){
  return BANNED.filter(function(w){
    return new RegExp("(^|[^\\w-])" + w.replace(/[-]/g, "[- ]?") + "(?![\\w-])", "i").test(t);
  });
}
function voiceErrors(text, where, names){
  var e = [], t = stripNames(plain(text), names);
  if(/!/.test(t)) e.push(where + ": an exclamation mark — VOICE.md §8 has none");
  bannedIn(t).forEach(function(w){
    e.push(where + ": \"" + w + "\" is on VOICE.md §8's never-use list");
  });
  if(/\bthe Bat\b(?!man|mobile|cave|signal|wing|girl|woman)/.test(t)) e.push(where + ": \"the Bat\" — no nicknames (VOICE.md §8)");
  NEVER.forEach(function(w){
    if(new RegExp("(^|[^\\w])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w])", "i").test(t)){
      e.push(where + ": \"" + w + "\" never goes in the paper (REPORTER.md §2, §6)");
    }
  });
  if(BAT_ON_US.test(t)) e.push(where + ": Batman on the real world — never, quoted or not (REPORTER.md §4)");
  /* 6.3.5. Batman's creators are Kane and Finger, in DC's words; a sentence
     that credits Kane with creating him and leaves Finger out is refused.
     And a filing is not a fact: "charged with", never "charged for". */
  t.split(/(?<=[.?;])\s+/).forEach(function(sn){
    if(/\bcreat\w*/i.test(sn) && /\bKane\b/.test(sn) && !/\bFinger\b/.test(sn)){
      e.push(where + ": Batman's creator named without Bill Finger — \"created by Bob Kane with Bill Finger\", in DC's words (VOICE.md §4)");
    }
  });
  if(/\bcharged for\b/i.test(t)) e.push(where + ": \"charged for\" — a charge is \"charged with\"; a filing is not a fact (VOICE.md §6)");
  if(/\p{Extended_Pictographic}/u.test(t)) e.push(where + ": an emoji");
  if(/(^|\s)#[A-Za-z]/.test(t)) e.push(where + ": a hashtag");
  /* 6.2.3. Merch is news, never shopping (VOICE.md §8). */
  if(/(^|[^\w])(US\$|[$£€¥])\s?\d/.test(t) || /\b\d+(?:[.,]\d+)?\s?(USD|EUR|GBP|dollars|euros)\b/i.test(t)){
    e.push(where + ": a price — merch is news, never shopping (VOICE.md §8)");
  }
  if(/\b(buy|order|shop|pre-?order) (it |them |yours )?now\b/i.test(t)){
    e.push(where + ": a call to buy — merch is news, never shopping (VOICE.md §8)");
  }
  if(/\b(watch|stream) (it|them|this|these) (on|at)\b/i.test(t)) {
    e.push(where + ": a service named as advice — the site's where-to-watch search does that job");
  }
  return e;
}

/* 6.3.3. Counted over the whole issue (the cold open, the stories, the
   sign-off): "I" is the reporter inside a casebook memory or on his own count
   (6.5.4), once an issue at most, so a second is refused. Titles (in italics, or listed in names) and
   quoted lines are not his "I" and are not counted. One Hellbox regular an
   issue at most. */
function reporterCounts(text, names){
  var e = [];
  var t = stripNames(String(text).replace(/\*[^*\n]+\*/g, " "), names);
  t = plain(t).replace(/\u201c[^\u201d]*\u201d/g, " ").replace(/"[^"\n]*"/g, " ");
  var i = (t.match(/(^|[^\w\u2019'])I(?:['\u2019](?:m|ve|d|ll))?(?![\w])/g) || []).length;
  if(i > 1) e.push("\"I\" appears " + i + " times — once an issue at most, inside a casebook memory or on his own count (REPORTER.md §4)");
  var r = REGULARS.filter(function(n){ return new RegExp("(^|[^\\w])" + n + "(?![\\w])").test(t); });
  if(r.length > 1) e.push(r.join(", ") + " in one issue — one Hellbox regular at most (REPORTER.md §4)");
  return e;
}

/* 6.5.4. The page is one man (VOICE.md §1): a weekly issue has no desk plural.
   One pattern serves the issue and the morgue card. Case-sensitive on "us", so
   "US" (the country) is never caught; titles in italics, quoted lines and the
   names list are stripped first, the way "I" is counted. Whether a quoted "we"
   is attributed in its own sentence is the Copy Desk's read, not the check's. */
var DESK_PLURAL = /(^|[^\w\u2019'-])((?:[Ww]e(?:['\u2019](?:re|ve|d|ll))?)|(?:[Oo]ur(?:s|selves)?)|us|Us)(?![\w\u2019'-])/g;
function deskPluralIn(text, names){
  var t = stripNames(String(text).replace(/\*[^*\n]+\*/g, " "), names);
  t = plain(t).replace(/\u201c[^\u201d]*\u201d/g, " ").replace(/"[^"\n]*"/g, " ");
  return (t.match(DESK_PLURAL) || []).map(function(m){ return m.replace(/^[^A-Za-z]+/, ""); });
}
function deskPluralErrors(fm, body, names){
  /* The title and each story's headline are also ## lines in the body, so they
     count once; one that the body does not carry is read on its own. */
  var b = String(body || ""), parts = [fm.cold_open, fm.sign_off, b];
  [fm.title].concat((fm.stories || []).map(function(st){ return st && st.headline; }))
            .concat((fm.corrections || []).map(function(c){ return c && c.text; }))
            .forEach(function(x){ if(typeof x === "string" && b.indexOf(x) < 0) parts.push(x); });
  var whole = parts.filter(function(x){ return typeof x === "string"; }).join("\n");
  var hits = deskPluralIn(whole, names);
  if(!hits.length) return [];
  var uniq = hits.filter(function(h, i){ return hits.indexOf(h) === i; });
  return ["the desk plural appears " + hits.length + " time" + (hits.length > 1 ? "s" : "") + " (" + uniq.join(", ") +
          ") — one man writes this page: no \"we\", \"our\" or \"us\" outside quotation marks (VOICE.md §1)"];
}
/* 6.5.4. Counted like the sentence counts below: these warn, never refuse. */
function pronounWarnings(is){
  var w = [], fm = is.fm;
  var t = plain([fm.cold_open, fm.sign_off, is.body].join("\n"));
  var nw = (t.match(/\bNight Watchers\b/g) || []).length;
  if(nw > 1) w.push(is.id + ": \"Night Watchers\" appears " + nw + " times — once an issue, and the sign-off is the natural place (VOICE.md §1)");
  var pp = (t.match(/\bthis paper\b|\bthe Night Final\b/gi) || []).length;
  if(pp > 2) w.push(is.id + ": \"this paper\" and \"the Night Final\" appear " + pp + " times between them — twice at most (VOICE.md §1)");
  return w;
}

/* 6.3.4. The sentence counts (VOICE.md §4, "How the sentences work"). These
   WARN; they never refuse. A good line can trip any of them, so the Night
   Editor reads each one, fixes it or keeps it, and lists them in the PR.
   Per story of five sentences or more: -ing words, -ly adverbs, and how even
   the sentence lengths run (standard deviation over the mean). Per issue:
   similes, one at most. The floors come from VOICE §10's After samples and
   the fixture issues: good copy there runs 0.3 to 0.65 on evenness, under
   3 -ings and 1 -ly in a hundred words. Lowercase words only, so names
   and titles (italics are dropped first) never count. */
var STYLE = {ing: 4, ly: 2, even: 0.2, sentences: 5, similes: 1};
var ING_NOUNS = /^(thing|nothing|something|anything|everything|king|ring|spring|string|sing|wing|bring|sling|sting|swing|morning|evening|during|ceiling|building|wedding|darling|sibling|viking|meaning|being|ending|opening|beginning|painting|drawing|writing|reading|feeling|setting|lighting|timing|casting|listing|listings|ongoing|printing|recording|screening|funding|hearing|filing|filings|ruling|clipping|lettering|inking|pencilling|colouring|shipping|pairing|king)$/i;
var LY_WORDS = /^(only|early|family|reply|supply|apply|fly|rely|holy|ugly|lonely|daily|weekly|monthly|yearly|likely|unlikely|friendly|lovely|elderly|silly|belly|rally|ally|bully|assembly|anomaly|curly|jolly|folly|hourly|nightly|costly|deadly|orderly|timely|ghostly|worldly|sly|chilly|melancholy|butterfly|monopoly|imply|comply|multiply)$/i;
var SIMILE = /\blike (?:a|an|the|some)\b|\bas if\b|\bas though\b|\bas (?!(?:long|soon|well|far|much|many|good|of|for|to|in|a|an|the|it|he|she|they|we|you|i)\b)[a-z]+ as\b/gi;
function styleText(text, names){
  return plain(stripNames(String(text).replace(/\*[^*\n]+\*/g, " "), names))
    .replace(/“[^”]*”/g, " ").replace(/"[^"\n]*"/g, " ");
}
function styleWarnings(text, where, names){
  var w = [], t = styleText(text, names);
  var all = t.split(/\s+/).filter(function(x){ return /[A-Za-z]/.test(x); });
  var low = all.map(function(x){ return x.replace(/[^A-Za-z]/g, ""); })
               .filter(function(x){ return x && x[0] === x[0].toLowerCase(); });
  var n = all.length || 1;
  var ing = low.filter(function(x){ return x.length >= 5 && /ing$/.test(x) && !ING_NOUNS.test(x); });
  if(ing.length * 100 / n > STYLE.ing){
    w.push(where + ": " + ing.length + " -ing words in " + all.length + " (" + ing.join(", ") + ") — turn the ones you can into plain verbs (VOICE.md §4)");
  }
  var ly = low.filter(function(x){ return x.length >= 4 && /ly$/.test(x) && !LY_WORDS.test(x); });
  if(ly.length * 100 / n > STYLE.ly){
    w.push(where + ": " + ly.length + " -ly adverbs (" + ly.join(", ") + ") — let the verb or the number do it (VOICE.md §4)");
  }
  var lens = t.split(/(?<=[.?])\s+(?=[A-Z“"])/).map(function(x){
    return x.split(/\s+/).filter(function(y){ return /[A-Za-z0-9]/.test(y); }).length;
  }).filter(function(k){ return k > 0; });
  if(lens.length >= STYLE.sentences){
    var m = lens.reduce(function(a, b){ return a + b; }, 0) / lens.length;
    var sd = Math.sqrt(lens.reduce(function(a, b){ return a + (b - m) * (b - m); }, 0) / lens.length);
    if(sd / m < STYLE.even){
      w.push(where + ": " + lens.length + " sentences, all about " + Math.round(m) + " words — vary the length; a short verdict after a long count (VOICE.md §4)");
    }
  }
  return w;
}
function simileCount(text, names){
  return (styleText(text, names).match(SIMILE) || []).length;
}
function issueWarnings(is, names){
  var w = [], fm = is.fm;
  if(!fm || typeof fm !== "object" || !Array.isArray(fm.stories)) return w;
  var parts = splitBody(is.body || "");
  parts.sections.forEach(function(sec){
    w.push.apply(w, styleWarnings(sec.text, is.id + ": \"" + sec.headline + "\"", names));
  });
  if(fm.kind !== "founding") w.push.apply(w, pronounWarnings(is));
  var sim = simileCount([fm.cold_open, fm.sign_off, is.body].join("\n"), names);
  if(sim > STYLE.similes) w.push(is.id + ": " + sim + " similes — one an issue at most, and it grades a thing, not a feeling (VOICE.md §4)");
  return w;
}

/* ---------- dates ---------- */

function isoDate(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + "T00:00:00Z")); }
function dayOf(s){ return new Date(s + "T00:00:00Z").getUTCDay(); }
function longDate(s){
  var d = new Date(s + "T00:00:00Z");
  return DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
}
function shortDate(s){
  var d = new Date(s + "T00:00:00Z");
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()];
}
function footDate(s){
  var d = new Date(s + "T00:00:00Z");
  return d.getUTCDate() + " " + MONTHS_SHORT[d.getUTCMonth()];
}
function rfc822(s){
  var d = new Date(s + "T00:00:00Z");
  return DAYS[d.getUTCDay()].slice(0, 3) + ", " + ("0" + d.getUTCDate()).slice(-2) + " " +
         MONTHS[d.getUTCMonth()].slice(0, 3) + " " + d.getUTCFullYear() + " 22:00:00 -0300";
}
/* How many ISO weeks a year has: 53 when 1 January is a Thursday, or a
   Wednesday in a leap year; 52 otherwise (6.2.3: W00 and W54-W99 rolled
   into another year and made a folder like 2026-w60-...). */
function isoWeeks(y){
  var d = new Date(Date.UTC(y, 0, 1)).getUTCDay(), leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return d === 4 || (leap && d === 3) ? 53 : 52;
}
/* The Sunday that closes an ISO week, "2026-W39" -> "2026-09-27". */
function sundayOfWeek(week){
  var m = /^(\d{4})-W(\d{2})$/.exec(week || "");
  if(!m) return null;
  var y = +m[1], w = +m[2];
  if(w < 1 || w > isoWeeks(y)) return null;
  var jan4 = new Date(Date.UTC(y, 0, 4));
  var mon1 = new Date(jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * 864e5);
  var sun = new Date(mon1.getTime() + ((w - 1) * 7 + 6) * 864e5);
  return sun.toISOString().slice(0, 10);
}

/* ---------- images ---------- */
/* Reads a WebP's own dimensions, so the front matter cannot claim a size
   the file does not have. Lossy (VP8), lossless (VP8L) and extended (VP8X). */
function webpSize(buf){
  if(buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  /* The RIFF size field is the file's length less eight. A file that
     disagrees has been cut or rewritten on the way in (6.2.0's own fixture
     image lost one byte to a line-ending conversion before .gitattributes
     named WebP binary, and its header still parsed). */
  if(buf.readUInt32LE(4) + 8 !== buf.length) return {broken: true};
  var kind = buf.toString("ascii", 12, 16);
  if(kind === "VP8X"){
    /* 6.2.3: BRIEF §6 says strip EXIF. The flags byte says whether EXIF
       (0x08) or XMP (0x04) is present, and the chunk list is read too,
       because a flag can say nothing while the chunk is there. */
    var meta = [], flags = buf[20], at = 12;
    if(flags & 0x08) meta.push("EXIF");
    if(flags & 0x04) meta.push("XMP");
    while(at + 8 <= buf.length){
      var id = buf.toString("ascii", at, at + 4), sz = buf.readUInt32LE(at + 4);
      if(id === "EXIF" && meta.indexOf("EXIF") < 0) meta.push("EXIF");
      if(id === "XMP " && meta.indexOf("XMP") < 0) meta.push("XMP");
      at += 8 + sz + (sz & 1);
    }
    return {w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3), meta: meta};
  }
  if(kind === "VP8 ") return {w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff};
  if(kind === "VP8L"){
    var b = buf.readUInt32LE(21);
    return {w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff)};
  }
  return null;
}

/* 6.3.0. Where each non-hero image runs: its own after:, or its slot. */
function placeImages(fm){
  var imgs = Array.isArray(fm.images) ? fm.images : [], k = 0, out = [];
  imgs.forEach(function(im, i){
    if(!im || typeof im !== "object" || im.file === fm.hero) return;
    k++;
    out.push({im: im, index: i, after: im.after !== undefined ? im.after : k});
  });
  return out;
}

/* ---------- the check ---------- */

function checkAll(issues, cat){
  var errs = [];
  function E(issue, msg){ errs.push(issue.id + ": " + msg); }
  var seenIssue = {}, seenWeek = {};
  issues.forEach(function(is){
    is.errors.forEach(function(m){ E(is, m); });
    var fm = is.fm;
    if(!fm) return;
    if(typeof fm !== "object" || Array.isArray(fm)){ E(is, "front matter is not a map"); return; }
    var kind = fm.kind === undefined ? "weekly" : fm.kind;
    if(KINDS.indexOf(kind) < 0){ E(is, "kind is " + kind + " — weekly or founding"); return; }
    var L = LIMITS[kind];
    var allowed = ["issue", "kind", "title", "slug", "week", "published", "cold_open", "hero",
                   "images", "stories", "sign_off", "corrections", "names"];
    Object.keys(fm).forEach(function(k){ if(allowed.indexOf(k) < 0) E(is, "unknown field \"" + k + "\""); });
    ["issue", "title", "slug", "week", "published", "cold_open", "stories", "sign_off"].forEach(function(k){
      if(fm[k] === undefined || fm[k] === null || fm[k] === "") E(is, "missing field \"" + k + "\"");
    });
    if(!Number.isInteger(fm.issue) || fm.issue < 0) E(is, "issue is not a whole number");
    if(kind === "founding" && fm.issue !== 0) E(is, "only No. 0 is the founding issue");
    if(fm.issue === 0 && kind !== "founding") E(is, "No. 0 is the founding issue — kind: founding");
    if(seenIssue[fm.issue]) E(is, "issue number " + fm.issue + " is used twice");
    seenIssue[fm.issue] = 1;
    if(typeof fm.slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.slug)) E(is, "slug is not kebab-case ascii");
    var sunday = sundayOfWeek(fm.week);
    if(!sunday) E(is, "week is not an ISO week like 2026-W39, numbered 1 to 52 (53 in a long year)");
    if(seenWeek[fm.week]) E(is, "week " + fm.week + " has two issues");
    seenWeek[fm.week] = 1;
    if(sunday && typeof fm.slug === "string" && is.id !== fm.week.toLowerCase() + "-" + fm.slug){
      E(is, "the folder is " + is.id + " but week and slug make " + fm.week.toLowerCase() + "-" + fm.slug);
    }
    if(!isoDate(fm.published)) E(is, "published is not a date (YYYY-MM-DD)");
    else if(dayOf(fm.published) !== 0) E(is, "published is not a Sunday — the Night Final is Sunday's paper");
    else if(sunday && fm.published !== sunday) E(is, "published is " + fm.published + " but the Sunday of " + fm.week + " is " + sunday);
    if(typeof fm.title !== "string" || fm.title.length > LIMITS.title) E(is, "title is longer than " + LIMITS.title + " characters");
    ["title", "cold_open", "sign_off"].forEach(function(k){
      if(typeof fm[k] === "string") errs.push.apply(errs, glyphErrors(fm[k], is.id + ": " + k.replace("_", " ")));
    });
    /* 6.3.0. Names off the map: a title the catalogue does not hold (a comic,
       a game, a toy line) that carries a listed word or a ! is listed here and
       exempted exactly as written. Each must be printed in the issue, and none
       may be a bare listed word: the list is for names, not for our words. */
    var EX = (cat.__names || []).filter(function(n){ return voiceErrors(n, "", []).length; });
    if(fm.names !== undefined){
      if(!Array.isArray(fm.names)) E(is, "names is not a list");
      else fm.names.forEach(function(n, i){
        var where = "name " + (i + 1);
        if(typeof n !== "string" || !n.trim()){ E(is, where + " is not a string"); return; }
        var bare = n.replace(/[^A-Za-z -]/g, "").trim().toLowerCase();
        if(BANNED.concat(NEVER).some(function(w){ return w.toLowerCase().replace(/[^a-z -]/g, "") === bare; }) || !/\s/.test(n.trim())){
          E(is, where + " (" + n + ") is a bare word, not a name — names exempts titles, never our own words"); return;
        }
        var whole = [fm.title, fm.cold_open, fm.sign_off, is.body].concat((fm.stories || []).map(function(st){ return st && st.headline; })).join("\n");
        if(plain(whole).indexOf(n) < 0){ E(is, where + " (" + n + ") is not printed in the issue — list only names the issue carries"); return; }
        errs.push.apply(errs, glyphErrors(n, is.id + ": " + where));
        EX.push(n);
      });
    }
    errs.push.apply(errs, glyphErrors(is.body, is.id + ": body"));
    if(typeof fm.cold_open === "string"){
      if(words(fm.cold_open) > LIMITS.coldOpen) E(is, "the cold open is over " + LIMITS.coldOpen + " words");
      errs.push.apply(errs, voiceErrors(fm.cold_open, is.id + ": cold open", EX));
      errs.push.apply(errs, subsetErrors(fm.cold_open, is.id + ": cold open"));
    }
    if(typeof fm.sign_off === "string"){
      errs.push.apply(errs, voiceErrors(fm.sign_off, is.id + ": sign-off", EX));
      errs.push.apply(errs, subsetErrors(fm.sign_off, is.id + ": sign-off"));
    }

    var body = splitBody(is.body);
    if(body.lead) E(is, "text before the first ## headline — the cold open lives in the front matter");
    errs.push.apply(errs, subsetErrors(is.body, is.id + ": body"));
    var stories = Array.isArray(fm.stories) ? fm.stories : [];
    if(!Array.isArray(fm.stories)) E(is, "stories is not a list");
    if(stories.length < L.min || stories.length > L.max){
      E(is, stories.length + " stories — a " + kind + " issue carries " + L.min + " to " + L.max);
    }
    if(body.sections.length !== stories.length){
      E(is, "the body has " + body.sections.length + " ## headlines and the front matter lists " + stories.length + " stories");
    }
    if(stories[0] && fm.title !== stories[0].headline) E(is, "title is not the lead story's headline — the banner is the lead's headline");
    var total = words(fm.cold_open || "") + words(fm.sign_off || "");
    stories.forEach(function(st, i){
      var where = "story " + (i + 1);
      var sec = body.sections[i];
      if(!st || typeof st !== "object"){ E(is, where + " is not a map"); return; }
      ["headline", "status", "sources", "catalogue", "effect"].concat(kind === "weekly" ? ["beat"] : []).forEach(function(k){
        if(st[k] === undefined || st[k] === null || st[k] === "") E(is, where + " is missing \"" + k + "\"");
      });
      Object.keys(st).forEach(function(k){
        if(["headline", "status", "sources", "catalogue", "effect", "beat"].indexOf(k) < 0) E(is, where + " has an unknown field \"" + k + "\"");
      });
      if(st.beat !== undefined && BEATS.indexOf(st.beat) < 0) E(is, where + "'s beat is " + st.beat + " — " + BEATS.join(", "));
      if(kind === "founding" && st.beat !== undefined) E(is, where + " carries a beat — the founding issue is about the paper, not a beat");
      /* 6.3.0. Late wires holds several small items under one headline: no box,
         beat other. A catalogued title that moves is a story, not a wire. */
      if(st.headline === LATE && (st.catalogue !== "none" || st.effect !== "none" || (kind === "weekly" && st.beat !== "other"))){
        E(is, where + " is Late wires — catalogue: none, effect: none, beat: other; a catalogued title that moves is promoted to a story");
      }
      if(typeof st.headline === "string" && st.headline.length > LIMITS.title) E(is, where + "'s headline is longer than " + LIMITS.title + " characters");
      if(sec && sec.headline !== st.headline) E(is, where + "'s ## headline does not match its front-matter headline");
      if(!STATUS[st.status]) E(is, where + "'s status is " + st.status + " — confirmed, reported or provisional");
      if(EFFECTS.indexOf(st.effect) < 0) E(is, where + "'s effect is " + st.effect + " — " + EFFECTS.join(", "));
      if(st.catalogue !== "none" && !cat[st.catalogue]) E(is, where + "'s catalogue id \"" + st.catalogue + "\" is not in PATH");
      if(st.effect === "new-entry" && st.catalogue !== "none") E(is, where + " is a new entry, so it is not in the catalogue yet — catalogue: none");
      if(st.effect === "parked-date" && cat[st.catalogue] && !cat[st.catalogue].parked) E(is, where + " moves a parked date on a title that is not parked");
      if(kind === "founding" && (st.catalogue !== "none" || st.effect !== "none" || st.status !== "confirmed")){
        E(is, where + ": the founding issue is about the app — catalogue: none, effect: none, status: confirmed");
      }
      var src = Array.isArray(st.sources) ? st.sources : [];
      if(!src.length) E(is, where + " has no source");
      src.forEach(function(u){
        /* 6.3.5: the morgue file is a lookup, never a source. (The repo
           itself stays citable: No. 0 is about the app.) */
        if(/MORGUE\.md/i.test(u)) E(is, where + " cites " + u + " — the morgue file is never a source; cite the page its line points to (BRIEF.md, The morgue file)");
        if(!/^https:\/\/\S+$/.test(u)) E(is, where + "'s source is not an https URL: " + u);
        else linkErrors(u, where + "'s source").forEach(function(m){ E(is, m); });
      });
      if(sec){
        var ln = linksIn(sec.text);
        src.forEach(function(u){ if(ln.indexOf(u) < 0) E(is, where + " lists a source its text never links: " + u); });
        ln.forEach(function(u){ if(src.indexOf(u) < 0) E(is, where + " links " + u + " without listing it in sources"); });
        var n = words(sec.text);
        total += n;
        if(n < L.story[0] || n > L.story[1]) E(is, where + " is " + n + " words — " + L.story[0] + " to " + L.story[1]);
        errs.push.apply(errs, voiceErrors(sec.text + "\n" + sec.headline, is.id + ": " + where, EX));
      }
    });
    if(total < L.words[0] || total > L.words[1]) E(is, "the issue is " + total + " words — a " + kind + " issue runs " + L.words[0] + " to " + L.words[1]);
    reporterCounts([fm.cold_open, fm.sign_off, is.body].join("\n"), EX).forEach(function(m){ E(is, m); });
    /* 6.5.4. The founding issue is the one exception: No. 0 ran with a desk "we". */
    if(kind !== "founding") deskPluralErrors(fm, is.body, EX).forEach(function(m){ E(is, m); });

    var imgs = fm.images === undefined ? [] : fm.images;
    if(!Array.isArray(imgs)){ E(is, "images is not a list"); imgs = []; }
    if(imgs.length > LIMITS.images) E(is, imgs.length + " images — at most " + LIMITS.images);
    var names = {};
    imgs.forEach(function(im, i){
      var where = "image " + (i + 1);
      if(!im || typeof im !== "object"){ E(is, where + " is not a map"); return; }
      ["file", "alt", "credit", "rights_holder", "source_url", "licence", "terms_url", "retrieved", "width", "height"].forEach(function(k){
        if(im[k] === undefined || im[k] === null || im[k] === "") E(is, where + " is missing \"" + k + "\" — no licence record, no image");
      });
      if(typeof im.file !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*\.webp$/.test(im.file)){ E(is, where + "'s file is not a kebab-case .webp name"); return; }
      names[im.file] = 1;
      if(typeof im.alt === "string" && im.alt.length > LIMITS.alt) E(is, where + "'s alt text is over " + LIMITS.alt + " characters");
      if(typeof im.credit === "string" && !/^Image: \S/.test(im.credit)) E(is, where + "'s credit line does not read \"Image: <rights holder>\"");
      ["alt", "credit"].forEach(function(k){ if(typeof im[k] === "string") errs.push.apply(errs, glyphErrors(im[k], is.id + ": " + where + "'s " + k)); });
      ["source_url", "terms_url"].forEach(function(k){ if(im[k] && !/^https:\/\/\S+$/.test(im[k])) E(is, where + "'s " + k + " is not an https URL"); });
      if(im.retrieved && !isoDate(im.retrieved)) E(is, where + "'s retrieved is not a date");
      var f = path.join(is.dir, im.file);
      if(!fs.existsSync(f)){ E(is, where + ": " + im.file + " is not in the issue's folder"); return; }
      var buf = fs.readFileSync(f), sz = webpSize(buf);
      if(buf.length > LIMITS.image) E(is, where + " is " + Math.round(buf.length / 1024) + " KB — at most " + LIMITS.image / 1024 + " KB");
      if(!sz){ E(is, where + " is not a WebP file"); return; }
      if(sz.broken){ E(is, where + " is not a whole WebP file \u2014 its length disagrees with its own header (cut, or converted as text)"); return; }
      if(Math.max(sz.w, sz.h) > LIMITS.side) E(is, where + " is " + sz.w + "x" + sz.h + " — the longest side is at most " + LIMITS.side);
      if(sz.w !== im.width || sz.h !== im.height) E(is, where + " says " + im.width + "x" + im.height + " and the file is " + sz.w + "x" + sz.h);
      if(sz.meta && sz.meta.length) E(is, where + " carries " + sz.meta.join(" and ") + " metadata — strip it (BRIEF.md §6)");
    });
    if(fm.hero !== undefined && !names[fm.hero]) E(is, "the hero " + fm.hero + " is not one of the listed images");
    /* 6.3.0. An image follows its own story: after: <story number>. Without
       it, the old slot order (the first after story 1, the second after story
       2). Never after Late wires, never two after one story, never on the
       hero, which sits under the banner. */
    var slots = {};
    placeImages(fm).forEach(function(p){
      var where = "image " + (p.index + 1);
      if(p.im.after !== undefined){
        if(p.im.file === fm.hero){ E(is, where + " is the hero and carries after: — the hero sits under the banner"); return; }
        if(!Number.isInteger(p.im.after) || p.im.after < 1 || p.im.after > stories.length){ E(is, where + "'s after: " + p.im.after + " is not a story number, 1 to " + stories.length); return; }
      }
      var st = stories[p.after - 1];
      if(!st) { E(is, where + " would follow story " + p.after + ", and there is none"); return; }
      if(st.headline === LATE) E(is, where + " would follow Late wires — no image follows it; put it after its own story");
      if(slots[p.after]) E(is, where + " and image " + (slots[p.after] ) + " both follow story " + p.after + " — one image a story");
      slots[p.after] = p.index + 1;
    });
    fs.readdirSync(is.dir).forEach(function(n){
      if(n !== "issue.md" && !names[n]) E(is, n + " sits in the issue's folder and is not a listed image");
    });

    var corr = fm.corrections === undefined ? [] : fm.corrections;
    if(!Array.isArray(corr)){ E(is, "corrections is not a list"); corr = []; }
    corr.forEach(function(c, i){
      if(!c || !isoDate(c.date) || !Number.isInteger(c.story) || c.story < 1 || c.story > stories.length || typeof c.text !== "string" || !c.text){
        E(is, "correction " + (i + 1) + " needs date, story (1-based) and text");
      } else {
        if(c.date < fm.published) E(is, "correction " + (i + 1) + " is dated before the issue ran");
        /* 6.2.3: a correction is printed in the story, so it keeps the
           story's rules: the voice, the subset, the fonts, and no link the
           story does not list as a source. */
        var cw = is.id + ": correction " + (i + 1);
        errs.push.apply(errs, voiceErrors(c.text, cw, EX));
        errs.push.apply(errs, subsetErrors(c.text, cw));
        errs.push.apply(errs, glyphErrors(c.text, cw));
        var cs = stories[c.story - 1], csrc = cs && Array.isArray(cs.sources) ? cs.sources : [];
        linksIn(c.text).forEach(function(u){ if(csrc.indexOf(u) < 0) E(is, "correction " + (i + 1) + " links " + u + " without listing it in story " + c.story + "'s sources"); });
      }
    });
  });

  var ordered = issues.filter(function(i){ return i.fm && Number.isInteger(i.fm.issue); })
                      .sort(function(a, b){ return a.fm.issue - b.fm.issue; });
  ordered.forEach(function(is, n){
    if(is.fm.issue !== n) E(is, "issue numbers run 0, 1, 2 … with no gap — this is No. " + is.fm.issue + " in position " + n);
    if(n && ordered[n - 1].fm.published >= is.fm.published) E(is, "published is not after No. " + ordered[n - 1].fm.issue + "'s");
  });
  return errs;
}

/* ---------- rendering ---------- */

/* 6.2.3. One type scale with the app. The nine --t-* sizes are read out of
   the app's :root, the way the catalogue is, so the paper cannot set type
   the app does not; guard 169 holds every font-size in both stylesheets to
   a var(--t-*). Three display sizes exist only on the paper: the nameplate,
   the banner and the drop cap. */
var TYPE_APP = (function(){
  var html = fs.readFileSync(path.join(ROOT, "docs", "index.html"), "utf8");
  var names = ["display", "title", "heading", "num", "body", "desc", "note", "label", "fine"];
  return names.map(function(n){
    var m = new RegExp("--t-" + n + ":([^;}]+)[;}]").exec(html);
    if(!m) throw new Error("cannot find --t-" + n + " in docs/index.html");
    return "--t-" + n + ":" + m[1].trim() + ";";
  }).join("");
})();
var TYPE_PAPER = "--t-plate:clamp(46px,14vw,104px);--t-banner:clamp(30px,8.4vw,58px);--t-drop:62px;";

/* 6.3.0. The paper follows the app's theme. Darker is the app's own
   :root[data-theme="darker"] block, read out of index.html like the type
   scale, keeping the colours the paper paints with; guard 169 holds the two
   equal. theme.js, the paper's one script of its own, reads the reader's
   choice from the app's settings and sets the attribute before first paint.
   6.5.0: the paper has its own switch in the foot (paper.js); a reader who
   flips it is followed by nocturne-theme first, the app second. */
var DARKER_KEYS = ["--ink", "--sunk", "--card", "--card2", "--line", "--line2", "--bone", "--suit", "--dust", "--dim"];
var DARKER = (function(){
  var html = fs.readFileSync(path.join(ROOT, "docs", "index.html"), "utf8");
  var m = /:root\[data-theme="darker"\]\{([^}]*)\}/.exec(html);
  if(!m) throw new Error("cannot find the app's darker theme block in docs/index.html");
  var have = {};
  (m[1].match(/--[a-z0-9]+\s*:[^;}]+/g) || []).forEach(function(d){ var i = d.indexOf(":"); have[d.slice(0, i).trim()] = d.slice(i + 1).trim(); });
  return DARKER_KEYS.filter(function(k){ return have[k]; }).map(function(k){ return k + ":" + have[k] + ";"; }).join("");
})();
var THEME_JS = [
"/* Nocturne \u2014 sets the theme before first paint: the paper's own choice (nocturne-theme) first, else the app's theme. Written by qa/nocturne.js; never edited by hand. */",
"(function(){var t=null;try{t=localStorage.getItem(\"nocturne-theme\");}catch(e){}",
"if(t!==\"dark\"&&t!==\"darker\"){t=null;try{var app=JSON.parse(localStorage.getItem(\"batwatch-settings\")||\"null\")||JSON.parse(localStorage.getItem(\"batwatch-v3\")||\"null\");t=app&&app.theme;}catch(e){}}",
"if(t===\"darker\")document.documentElement.setAttribute(\"data-theme\",\"darker\");})();",
""].join("\n");
var THEME_TAG = '<script src="/nocturne/theme.js"></script>';
/* 6.5.0. paper.js, the paper's second script of its own, on every page,
   deferred. Two jobs, both owner's calls.
   Share this issue (issues): where the browser has a share sheet it opens
   it with the issue's title and link; where it has none, or the sheet fails
   for any reason but AbortError, it copies the link and says so, in the
   button and in a polite live region. Copy link and Post on X are in that
   same row and start hidden. This script shows them only when
   navigator.share is missing. It adds no other script and opens nothing itself.
   The theme switch (every page): Dark deco or Darker, the app's two themes.
   The choice is the paper's own, kept under its own key (nocturne-theme),
   and never written into the app's settings; until a reader flips it the
   paper follows the app, as theme.js has since 6.3.0. It fetches nothing and
   stores nothing else (guard 164). */
var PAPER_JS = [
"/* Nocturne \u2014 Share this issue, and the theme switch. Written by qa/nocturne.js; never edited by hand. */",
"(function(){var root=document.documentElement,IDLE=\"Share this issue\";",
"function markTheme(){var on=root.getAttribute(\"data-theme\")===\"darker\";[].forEach.call(document.querySelectorAll(\"[data-theme-switch]\"),function(b){b.setAttribute(\"aria-checked\",on?\"true\":\"false\");});}",
"function setTheme(v){if(v===\"darker\")root.setAttribute(\"data-theme\",\"darker\");else root.removeAttribute(\"data-theme\");try{localStorage.setItem(\"nocturne-theme\",v);}catch(err){}markTheme();}",
"function label(button,text){var word=button.querySelector(\".sl\");clearTimeout(button._t);if(word)word.textContent=text;button.classList.toggle(\"failed\",text!==IDLE);if(text!==IDLE)button._t=setTimeout(function(){label(button,IDLE);},2400);}",
"function copied(button,out){label(button,IDLE);if(out){out.classList.remove(\"fail\");out.textContent=\"Link copied\";}}",
"function failed(button,out,url){label(button,\"Copy failed\");if(out){out.classList.add(\"fail\");out.textContent=url;}}",
"function copy(button,out,url){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){copied(button,out);},function(){failed(button,out,url);});return;}failed(button,out,url);}",
"function shout(button){var row=button.closest(\".more\"),out=row&&row.querySelector(\".shout\");return out||null;}",
"function share(button){var url=button.getAttribute(\"data-url\"),title=button.getAttribute(\"data-title\"),out=shout(button);",
"if(navigator.share){navigator.share({title:title,url:url}).catch(function(err){if(!err||err.name!==\"AbortError\")copy(button,out,url);});return;}copy(button,out,url);}",
"function showSheetless(){if(navigator.share)return;[].forEach.call(document.querySelectorAll(\".btn.share\"),function(b){var row=b.closest(\".more\");if(!row)return;[].forEach.call(row.querySelectorAll(\"[hidden]\"),function(el){el.removeAttribute(\"hidden\");});});}",
"markTheme();showSheetless();",
"document.addEventListener(\"click\",function(e){var themeButton=e.target.closest(\"[data-theme-switch]\");if(themeButton){setTheme(root.getAttribute(\"data-theme\")===\"darker\"?\"dark\":\"darker\");return;}var copyButton=e.target.closest(\"[data-copy]\");if(copyButton){copy(copyButton,shout(copyButton),copyButton.getAttribute(\"data-url\"));return;}var shareButton=e.target.closest(\"[data-share]\");if(shareButton)share(shareButton);});})();",
""].join("\n");
var PAPER_TAG = '<script src="/nocturne/paper.js" defer></script>';
var SHARE_ICON = '<svg class="shr" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.4v6.8M3.3 4.1 6 1.4l2.7 2.7M2 6.4v4.2h8V6.4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
/* 6.6.9. Share this issue always. Copy link and Post on X are in the same
   row and start hidden; paper.js shows them only when there is no share sheet.
   The post is a link to X's compose URL, the headline and the issue URL.
   No script from X. */
function shareButton(url, title){
  var mark = " \u00b7 Nocturne";
  var headline = title.slice(-mark.length) === mark ? title.slice(0, -mark.length) : title;
  var post = "https://x.com/intent/post?text=" + encodeURIComponent(headline) + "&url=" + encodeURIComponent(url);
  return '<button class="btn share" type="button" data-share data-url="' + url + '" data-title="' + esc(title) + '">' +
         SHARE_ICON + '<span class="sl">Share this issue</span></button><span class="shout" role="status" aria-live="polite"></span>' +
         '<button class="btn ghost" type="button" data-copy data-url="' + url + '" hidden>Copy link</button>' +
         '<a class="btn ghost" href="' + esc(post) + '" target="_blank" rel="noopener noreferrer" hidden>Post on X</a>';
}
/* 6.3.0. Cloudflare Web Analytics, on the paper only: no cookies, nothing
   that follows a reader. The token is public by design; the app carries
   neither the beacon nor the token (guard 165). */
var BEACON_TOKEN = "708efa05f59d443484a7cab2a37410a6";
var BEACON = '<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="{&quot;token&quot;: &quot;' + BEACON_TOKEN + '&quot;}"></script>';

/* 6.2.3. A real italic for the paper. Titles are set in italic (VOICE.md
   §8), and NW Sans had no italic face, so every browser faked a slant. The
   face is IBM Plex Sans 400 italic, subset and renamed by
   qa/subset-fonts.py --paper exactly as the app's Plex faces are, and kept in
   qa/nocturne-fonts/ with its record. It is the paper's alone: it is not in
   docs/fonts/, so the app neither preloads nor precaches it, and the build
   writes it into docs/nocturne/ beside OFL.txt, which travels with it. */
/* The paper's own faces (6.4.0), all blessed in the one record: the
   italic above and Newsreader 400 and italic for the reading text and, from
   6.5.1, the sign-off. No reserved names, so they ship as subsets under
   their own names, and none is in docs/fonts/. The paper's one shared face,
   Bodoni Moda 700 (the banner and story heads), is the app's, in
   docs/fonts/ since 6.5.0. */
var PAPER_FONTS = (function(){
  var dir = path.join(__dirname, "nocturne-fonts");
  var rec = JSON.parse(fs.readFileSync(path.join(dir, "record.json"), "utf8"));
  return Object.keys(rec.files).sort().map(function(f){ return {file: f, dir: dir, rec: rec.files[f]}; });
})();
function paperFont(file){
  var f = PAPER_FONTS.filter(function(x){ return x.file === file; })[0];
  if(!f) throw new Error("qa/nocturne-fonts/record.json has no " + file + " — run python3 qa/subset-fonts.py --paper");
  return f;
}
var ITALIC = paperFont("ibm-plex-sans-latin-400-italic.woff2");
var READ   = paperFont("newsreader-latin-400-normal.woff2");
var READ_I = paperFont("newsreader-latin-400-italic.woff2");

var CSS = [
"/* Nocturne */",
"@font-face{font-family:\"NW Deco\";src:url(\"/fonts/limelight-latin-400-normal.woff2\") format(\"woff2\");font-display:swap;}",
"@font-face{font-family:\"Big Shoulders Display\";src:url(\"/fonts/big-shoulders-display-latin-700-normal.woff2\") format(\"woff2\");font-weight:700;font-display:swap;}",
"@font-face{font-family:\"NW Sans\";src:url(\"/fonts/ibm-plex-sans-latin-400-normal.woff2\") format(\"woff2\");font-display:swap;}",
"@font-face{font-family:\"NW Sans\";src:url(\"/nocturne/" + ITALIC.file + "\") format(\"woff2\");font-weight:400;font-style:italic;font-display:swap;}",
"@font-face{font-family:\"NW Sans\";src:url(\"/fonts/ibm-plex-sans-latin-600-normal.woff2\") format(\"woff2\");font-weight:600;font-display:swap;}",
"@font-face{font-family:\"NW Mono\";src:url(\"/fonts/ibm-plex-mono-latin-400-normal.woff2\") format(\"woff2\");font-display:swap;}",
"@font-face{font-family:\"NW Mono\";src:url(\"/fonts/ibm-plex-mono-latin-600-normal.woff2\") format(\"woff2\");font-weight:600;font-display:swap;}",
"@font-face{font-family:\"Bodoni Moda\";src:url(\"/fonts/bodoni-moda-latin-700-normal.woff2\") format(\"woff2\");font-weight:700;font-display:swap;}",
"@font-face{font-family:\"Newsreader\";src:url(\"/nocturne/" + READ.file + "\") format(\"woff2\");font-display:swap;}",
"@font-face{font-family:\"Newsreader\";src:url(\"/nocturne/" + READ_I.file + "\") format(\"woff2\");font-weight:400;font-style:italic;font-display:swap;}",
":root{--ink:#08090F;--sunk:#0C111C;--card:#141B2C;--card2:#1B2438;--line:#252E42;--line2:#33405C;",
"--bone:#E7E9F0;--dust:#93A0B8;--dim:#8B97B1;--suit:#A6ADBA;--signal:#FFCF1F;--steel:#7295CC;",
"--signalline:rgba(255,207,31,.4);",
"--deco:\"NW Deco\",\"Big Shoulders Display\",serif;--disp:\"Big Shoulders Display\",\"Arial Narrow\",Impact,sans-serif;",
"--body:\"NW Sans\",-apple-system,\"Segoe UI\",sans-serif;--mono:\"NW Mono\",ui-monospace,Menlo,monospace;",
"--press:\"Bodoni Moda\",Didot,\"Bodoni 72\",Georgia,serif;--read:\"Newsreader\",Georgia,serif;",
"" + TYPE_APP,
"" + TYPE_PAPER + "}",
":root[data-theme=\"darker\"]{" + DARKER + "}",
"*{box-sizing:border-box;}",
"html,body{margin:0;padding:0;}",
"body{background:var(--ink);color:var(--bone);font-family:var(--body);font-size:var(--t-body);line-height:1.6;-webkit-font-smoothing:antialiased;}",
"a{color:inherit;}",
"a:focus-visible{outline:2px solid var(--signal);outline-offset:2px;}",
".paper{max-width:760px;margin:0 auto;padding:22px 18px 48px;}",
".mast{text-align:center;padding-top:8px;}",
".mast-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}",
".presents{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;color:var(--dust);margin:4px 0 0;text-align:left;}",
".presents a{text-decoration:none;border-bottom:1px solid var(--line2);}",
".seal{flex:none;font-family:var(--mono);font-weight:600;font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;line-height:1.15;text-align:center;background:var(--signal);color:var(--ink);padding:6px 8px 5px;}",
".seal small{display:block;font-weight:400;font-size:var(--t-fine);letter-spacing:.14em;margin-top:2px;}",
".nameplate{font-family:var(--deco);font-weight:400;text-transform:uppercase;letter-spacing:.06em;font-size:var(--t-plate);line-height:.9;margin:14px 0;}",
".nameplate a{text-decoration:none;}",
".rule2{border:0;height:5px;margin:0;border-top:3px solid var(--bone);border-bottom:1px solid var(--bone);}",
".rule1{border:0;border-top:1px solid var(--line2);margin:0;}",
/* 6.7.4: the class is issued, not dateline. Firefox reader view treats a
   class or id containing dateline as a byline and will steal the price line. */
".issued{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.16em;text-transform:uppercase;color:var(--dust);display:flex;justify-content:center;flex-wrap:wrap;gap:4px 12px;padding:9px 0;margin:0;}",
".dl1,.dl2{display:inline-flex;gap:12px;align-items:center;}",
"@media (max-width:560px){.issued{flex-direction:column;align-items:center;gap:5px;}.dl2 .dsep{display:none;}}",
".dsep{display:inline-block;width:4.5px;height:4.5px;background:var(--signal);transform:rotate(45deg);}",
/* 6.7.4: no class. Readability deletes any class or id containing banner.
   The issue headline, the front's lead and the holding page's h1 share the
   rule. --t-banner stays; the word belongs to the brief, not the markup. */
"article > h1,#lead,.paper > h1{font-family:var(--press);font-weight:700;font-size:var(--t-banner);line-height:1.04;text-align:center;margin:26px 0 20px;text-wrap:balance;}",
"figure{margin:0 0 26px;}",
"figure img{display:block;width:100%;height:auto;border:1px solid var(--line2);background:var(--sunk);}",
"figcaption{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-top:7px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;}",
".cold{font-family:var(--read);font-size-adjust:.5;font-size:var(--t-heading);line-height:1.55;margin:0 auto 6px;max-width:620px;}",
".cold::first-letter{font-family:var(--deco);float:left;font-size:var(--t-drop);line-height:.82;margin:6px 10px 0 0;}",
".drule{display:flex;align-items:center;gap:9px;margin:28px auto;max-width:620px;color:var(--signal);}",
".drule i{width:7px;height:7px;background:currentColor;transform:rotate(45deg);flex:none;}",
".drule::before,.drule::after{content:\"\";flex:1;height:1px;}",
".drule::before{background:linear-gradient(90deg,transparent,var(--signalline));}",
".drule::after{background:linear-gradient(90deg,var(--signalline),transparent);}",
".story{max-width:620px;margin:0 auto;scroll-margin-top:16px;}",
".story+.story{margin-top:38px;padding-top:30px;border-top:1px solid var(--line);}",
".kick{font-family:var(--mono);font-size:var(--t-label);letter-spacing:.19em;text-transform:uppercase;margin:0 0 8px;display:flex;gap:10px;align-items:center;}",
".kick .st{color:var(--signal);}",
".kick .st.reported{color:var(--steel);}",
".kick .st.provisional{color:var(--dust);}",
".kick .num{color:var(--dim);}",
".kick .beat{color:var(--dust);}",
".kick .off{color:var(--dust);border:1px solid var(--line2);padding:2px 6px 1px;}",
".board{max-width:620px;margin:0 auto 24px;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2);padding:10px 0;}",
".board .bh{font-family:var(--mono);font-size:var(--t-label);letter-spacing:.19em;text-transform:uppercase;color:var(--signal);margin:0 0 6px;}",
".board ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px 22px;}",
".board li{display:flex;gap:10px;align-items:baseline;}",
".board .v{font-family:var(--mono);font-size:var(--t-label);letter-spacing:.1em;text-transform:uppercase;}",
".board .v.entered{color:var(--signal);}",
".board .v.dated{color:var(--steel);}",
".board .v.unparked{color:var(--bone);border-bottom:1px solid var(--signal);}",
".board a{font-size:var(--t-desc);color:var(--bone);text-decoration:none;}",
".board .bnone{font-size:var(--t-desc);color:var(--dust);margin:0;}",
".map .place{font-size:var(--t-desc);color:var(--bone);margin:0 0 8px;}",
".story h2{font-family:var(--press);font-weight:700;font-size:var(--t-display);line-height:1.08;margin:0 0 12px;}",
".story p{margin:0 0 14px;max-width:62ch;}",
/* 6.4.0: the reading text is set justified, like a column of newsprint,
   hyphenated by the browser (lang="en") so a phone's narrow measure does
   not open rivers. */
".story>p:not([class]),.cold{text-align:justify;hyphens:auto;-webkit-hyphens:auto;hyphenate-limit-chars:6 3 2;}",
".story>p:not([class]){font-family:var(--read);font-size-adjust:.5;line-height:1.55;}",
".story p a{text-decoration:none;border-bottom:1px solid var(--signal);}",
".arr{display:inline-block;width:.7em;height:.7em;margin-left:.25em;color:var(--signal);vertical-align:baseline;}",
".btn .arr{width:11px;height:11px;margin-left:6px;color:inherit;vertical-align:middle;}",
".corr{font-family:var(--mono);font-size:var(--t-note);letter-spacing:.06em;color:var(--dust);border-left:2px solid var(--signal);padding:2px 0 2px 10px;}",
".map{border:1px solid var(--line2);background:linear-gradient(175deg,var(--card2),var(--card) 70%);padding:12px 14px;margin:4px 0 0;}",
".map dl{display:grid;grid-template-columns:auto 1fr;gap:5px 16px;align-items:baseline;margin:0;}",
".map .lbl{font-family:var(--mono);font-size:var(--t-label);letter-spacing:.19em;text-transform:uppercase;color:var(--signal);margin:0 0 8px;}",
".map dt{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.14em;text-transform:uppercase;color:var(--dim);}",
".map dd{margin:0;font-size:var(--t-desc);}",
".map dd.parked{display:inline-flex;align-items:center;gap:8px;}",
".ring{width:12px;height:12px;border-radius:50%;border:1.5px dashed var(--dust);flex:none;}",
".map.none p:last-child{margin:0;font-size:var(--t-desc);color:var(--dust);}",
/* 6.5.1, owner's call: the sign-off is the reporter's last line, so it is set
   in the reading face, italic, in sentence case; it was NW Deco, a banner. */
".signoff{text-align:center;font-family:var(--read);font-style:italic;font-size-adjust:.5;font-size:var(--t-heading);line-height:1.45;margin:0;}",
/* 6.3.1: the colophon sits under the app's diamond rule, the way every tab closes (guard 169). */
".foot{max-width:620px;margin:44px auto 0;}",
".colophon::before{content:\"\";position:absolute;top:0;left:50%;width:4.5px;height:4.5px;transform:translate(-50%,-50%) rotate(45deg);background:var(--signal);box-shadow:0 0 0 6px var(--ink);}",
/* 6.5.0: the foot's buttons. 6.6.9: an issue adds a share row. 6.7.0: the
   second row is the Back page index and Keep reading. .btn sets display,
   which would beat the hidden attribute, so .btn[hidden] puts it back. */
".acts{display:grid;gap:30px;max-width:460px;margin:0 auto 30px;}",
".acts .more{display:flex;flex-wrap:wrap;gap:10px;position:relative;}",
".acts .more .btn{flex:1 1 0;min-width:0;justify-content:center;}",
".btn{font-family:var(--mono);font-size:var(--t-label);font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;padding:12px 14px;min-height:44px;display:inline-flex;align-items:center;}",
".btn[hidden]{display:none}",
".btn.home{background:var(--signal);color:var(--ink);border:1px solid var(--signal);gap:12px;padding:10px 18px 10px 14px;text-align:left;}",
".btn.home .mk{width:36px;height:auto;flex:none;display:block;}",
".btn.home .lbl{display:flex;flex-direction:column;align-items:flex-start;gap:7px;}",
".btn.home b{font-family:var(--deco);font-weight:400;font-size:var(--t-heading);letter-spacing:.02em;line-height:1;text-box:trim-both cap alphabetic;}",
".btn.home small{font-size:var(--t-fine);letter-spacing:.17em;line-height:1;text-box:trim-both cap alphabetic;display:flex;align-items:center;}",
".btn.home small .arr{width:9px;height:9px;margin-left:5px;}",
".btn.home{justify-content:center;}",
".btn.ghost,.btn.share{border:1px solid var(--line2);color:var(--steel);font-weight:400;background:none;cursor:pointer;}",
".acts button:focus-visible{outline:2px solid var(--signal);outline-offset:2px;}",
".btn .shr{width:12px;height:12px;margin-right:8px;flex:none;}",
".shout{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}",
".shout.fail{position:static;width:auto;height:auto;overflow:visible;clip:auto;white-space:normal;flex-basis:100%;order:1;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.04em;color:var(--steel);text-align:center;overflow-wrap:anywhere;user-select:all;}",
".btn.share.failed .shr{display:none;}",
/* 6.7.4: these follow the footer element, so they keep the foot's measure
   on their own. Reader view deletes the footer and keeps the paragraphs. */
".colophon{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.08em;text-transform:uppercase;text-align:center;line-height:1.8;color:var(--dim);max-width:620px;margin:0 auto;position:relative;padding-top:22px;background:linear-gradient(90deg,transparent,var(--signalline) 50%,transparent) top/100% 1px no-repeat;}",
".support{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.08em;text-transform:uppercase;text-align:center;line-height:1.8;color:var(--dim);max-width:620px;margin:6px auto 0;}",
".support a{text-decoration:underline;text-underline-offset:.2em;}",
".support a:focus-visible{outline:2px solid var(--signal);outline-offset:2px;}",
".sub{text-align:center;color:var(--dust);font-size:var(--t-desc);margin:0 auto 26px;max-width:460px;}",
".front{max-width:680px;margin:0 auto;}",
".lead-kick{font-family:var(--mono);font-size:var(--t-label);letter-spacing:.19em;text-transform:uppercase;color:var(--dust);display:flex;justify-content:center;flex-wrap:wrap;align-items:center;gap:6px 12px;margin:26px 0 0;}",
".lead-kick .new{color:var(--signal);font-weight:600;}",
".front #lead{margin-top:12px;}",
".front #lead a{text-decoration:none;}",
".front #lead a:hover{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.12em;text-decoration-color:var(--signal);}",
".front figure a{display:block;}",
".front .cold{margin-bottom:22px;}",
".inside{max-width:620px;margin:0 auto;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2);padding:12px 0 6px;}",
".inside .bh{font-family:var(--mono);font-size:var(--t-label);letter-spacing:.19em;text-transform:uppercase;color:var(--signal);margin:0 0 4px;}",
".inside ol{list-style:none;margin:0;padding:0;}",
".inside li+li{border-top:1px solid var(--line);}",
".inside a{display:grid;grid-template-columns:34px 1fr;gap:12px;align-items:baseline;padding:10px 0;text-decoration:none;min-height:44px;}",
".inside .num{font-family:var(--mono);font-size:var(--t-label);letter-spacing:.19em;color:var(--dim);}",
".inside .hd{font-family:var(--press);font-weight:700;font-size:var(--t-heading);line-height:1.2;}",
".inside .beat{display:block;font-family:var(--mono);font-weight:400;font-size:var(--t-fine);letter-spacing:.17em;color:var(--dust);margin-bottom:3px;}",
".inside a:hover .hd{color:var(--signal);}",
".read{text-align:center;margin:24px 0 0;}",
".btn.read{background:var(--signal);color:var(--ink);border:1px solid var(--signal);font-size:var(--t-note);letter-spacing:.14em;padding:14px 22px;}",
".btn.read .arr{width:12px;height:12px;margin-left:10px;}",
".bh2{font-family:var(--deco);font-weight:400;text-transform:uppercase;letter-spacing:.04em;font-size:var(--t-title);text-align:center;margin:0 0 10px;}",
".back{max-width:620px;margin:0 auto;}",
".back .sub{margin-bottom:0;}",
".issues{list-style:none;margin:0 auto;padding:0;max-width:620px;}",
".issues li{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;padding:16px 0;border-bottom:1px solid var(--line);}",
".issues .no{font-family:var(--deco);font-size:var(--t-num);line-height:1;grid-row:1/3;min-width:52px;}",
".issues .when{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.16em;text-transform:uppercase;color:var(--dim);}",
".issues li:first-child .when{color:var(--signal);}",
".issues a{text-decoration:none;font-family:var(--press);font-weight:700;font-size:var(--t-heading);line-height:1.2;}",
".cols{display:grid;grid-template-columns:repeat(3,1fr);max-width:760px;margin:0 auto 28px;border-top:3px double var(--bone);border-bottom:1px solid var(--line2);}",
".cols section{padding:16px 18px 18px;}",
".cols section+section{border-left:1px solid var(--line2);}",
".cols h2{font-family:var(--disp);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:var(--t-heading);line-height:1.05;margin:0 0 8px;}",
".cols p{font-size:var(--t-desc);line-height:1.55;color:var(--dust);margin:0;}",
"@media (max-width:560px){.cols{grid-template-columns:1fr;}.cols section{padding:16px 0 18px;}.cols section+section{border-left:0;border-top:1px solid var(--line2);}}",
"@media (forced-colors:active){.seal,.dsep,.drule i{forced-color-adjust:none;}.colophon::before{forced-color-adjust:none;background:CanvasText;box-shadow:0 0 0 6px Canvas;}.dsw .trk i{forced-color-adjust:none;background:CanvasText;}}",
/* 6.7.0. The foot: one centred switch, the Back page index, Keep reading.
   The card title wears --t-desc. A missing side is a dashed card. */
".themerow{display:flex;justify-content:center;margin:0 0 30px;}",
".dsw{display:inline-grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;min-height:44px;padding:0 2px;background:none;border:0;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.09em;text-transform:uppercase;color:var(--dim);cursor:pointer;}",
".dsw .dl:first-child{justify-self:end;}",
".dsw .trk{position:relative;width:30px;height:0;margin:0 5px;border-top:1px solid var(--line2);}",
".dsw .trk i{position:absolute;top:-.5px;left:0;width:8px;height:8px;transform:translate(-50%,-50%) rotate(45deg);background:var(--signal);transition:left .18s;}",
".dsw[aria-checked=\"true\"] .trk i{left:100%;}",
":root[data-theme=darker] .dsw .trk i{left:100%;}",
":root[data-theme=darker] .dsw .dl:first-child{color:var(--dim);}",
":root[data-theme=darker] .dsw .dl:last-child{color:var(--bone);}",
".dsw[aria-checked=\"false\"] .dl:first-child,.dsw[aria-checked=\"true\"] .dl:last-child{color:var(--bone);}",
".dsw:focus-visible{outline:2px solid var(--signal);outline-offset:2px;}",
".idx{border-top:3px double var(--bone);}",
".ih{display:flex;justify-content:space-between;gap:12px;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;color:var(--signal);margin:0;padding:8px 0;border-bottom:1px solid var(--line2);}",
".ir{display:flex;align-items:baseline;min-height:48px;padding:14px 0 12px;border-bottom:1px solid var(--line);color:var(--bone);text-decoration:none;}",
".ir .k{font-family:var(--mono);font-size:var(--t-label);font-weight:600;letter-spacing:.12em;text-transform:uppercase;}",
".ir .ld{flex:1;min-width:16px;margin:0 10px;border-bottom:1px dotted var(--line2);}",
".ir svg{width:12px;height:12px;flex:none;color:var(--signal);}",
".ir:hover .k,.ir:focus-visible .k{color:var(--signal);}",
".fl{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;color:var(--dust);margin:0 0 10px;}",
".fl::after{content:\"\";flex:1;height:1px;background:var(--line);}",
".pn{display:grid;grid-template-columns:1fr 1fr;gap:10px;}",
".pn>*{display:flex;flex-direction:column;gap:6px;min-width:0;margin:0;padding:12px 14px;border:1px solid var(--line2);text-decoration:none;}",
".pn small{display:flex;align-items:center;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.14em;text-transform:uppercase;color:var(--steel);}",
".pn .t{font-family:var(--press);font-weight:700;font-size:var(--t-desc);line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
".pn a:hover .t{color:var(--signal);}",
".pn [rel=prev] .arr{margin:0 6px 0 0;}",
".pn [rel=next]{align-items:flex-end;text-align:right;}",
".pn .soon{border-style:dashed;color:var(--dust);}",
".pn .soon small{color:var(--dim);}",
"@media (prefers-reduced-motion:reduce){.dsw .trk i{transition:none;}}",
/* Print (6.2.3): ink on white, the rules kept, no buttons. Same scale; only colour changes. */
"@media print{:root,:root[data-theme=\"darker\"]{--ink:#FFFFFF;--sunk:#FFFFFF;--card:#FFFFFF;--card2:#FFFFFF;--line:#BBBBBB;--line2:#888888;--bone:#08090F;--dust:#333333;--dim:#444444;--suit:#08090F;--signal:#08090F;--steel:#333333;--signalline:rgba(8,9,15,.35);}",
".acts{display:none;}.themerow{display:none;}.paper{padding:0;max-width:none;}.map{background:none;}.seal{background:none;border:1px solid var(--bone);color:var(--bone);}",
"figure,.map,.corr,.board{break-inside:avoid;}.story h2{break-after:avoid;}@page{margin:16mm 14mm;}}",
""].join("\n");

var COLOPHON = "Nocturne is the weekly paper of Night Watcher, one fan\u2019s map of every Batman " +
  "story on screen. Researched and drafted by a desk of AI agents, edited and published by hand. " +
  "Every story links its source. Images credited to their rights holders. The paper counts " +
  "visits anonymously, with Cloudflare Web Analytics: no cookies, nothing that follows you.";

function masthead(dateline, plateH1){
  return '<header class="mast">\n' +
    '<div class="mast-top"><p class="presents">A paper of<br><a href="/">Night Watcher</a></p>' +
    '<p class="seal">Night<br>Final<small>Sunday</small></p></div>\n' +
    (plateH1 ? '<h1 class="nameplate"><a href="/nocturne/" aria-current="page">Nocturne</a></h1>\n' : '<p class="nameplate"><a href="/nocturne/">Nocturne</a></p>\n') +
    '<hr class="rule2">\n<p class="issued">' + dateline + '</p>\n<hr class="rule1">\n</header>\n';
}
/* 6.7.4. The diamond is paint. A reader that drops it would otherwise run
   the three labels together, so each label but the last carries a space. */
function dateline(a, b, c){
  return '<span class="dl1"><span>' + a + ' </span><i class="dsep"></i><span>' + b + ' </span></span>' +
         '<span class="dl2"><i class="dsep"></i><span>' + c + '</span></span>';
}
/* 6.5.5, owner's call (29 Sept): the paper carries the app's one ask, in the
   app's words, as the last line of its foot, under the colophon. Same URL and
   same shape as the Progress build line: one word carries the link, it opens
   in its own tab, and nothing fetches the host. Guard 172 pins it. */
var SUPPORT_URL = "https://publishers.basicattentiontoken.org/en/c/nightwatcher";
var SUPPORT = 'Keep the path lit. <a href="' + SUPPORT_URL + '" target="_blank" rel="noopener noreferrer">Support</a>';

function indexRow(href, label, icon, type){
  return '<a class="ir" href="' + href + '"' + (type ? ' type="' + type + '"' : '') + '><span class="k">' + label + '</span><span class="ld"></span>' + icon + '</a>';
}
function footer(extra){
  /* 6.7.0. An issue passes {share, issue, keep}. The front and the holding
     page pass "" and get the Nocturne index: one Follow by RSS row. */
  var o = extra && typeof extra === "object" ? extra : null;
  var rss = indexRow("/nocturne/feed.xml", "Follow by RSS", RSS, "application/rss+xml");
  var idx = o
    ? '<nav class="idx" aria-label="This issue"><p class="ih"><span>Back page</span><span>No. ' + o.issue.n + ' \u00b7 ' + esc(o.issue.date) + '</span></p>' +
      indexRow("/nocturne/", "Back to Nocturne", ROW_BACK) +
      indexRow("/nocturne/#morgue", "The morgue", ROW_DOWN) + rss + '</nav>'
    : '<nav class="idx" aria-label="Nocturne"><p class="ih"><span>Nocturne</span><span>Every Sunday, late</span></p>' + rss + '</nav>';
  /* 6.7.4. The colophon is the AI disclosure. Firefox reader view deletes
     footer and aside, so the colophon and the support line follow the footer
     as paragraphs. On an issue the whole foot sits inside the article, and
     the disclosure comes with the story. The nav stays in the footer. */
  return '<footer class="foot">\n<div class="acts">' + (o && o.share ? '<div class="more">' + o.share + '</div>' : '') + idx + (o && o.keep ? o.keep : '') +
    '<a class="btn home" href="/">' + MARK + '<span class="lbl"><b>Night Watcher</b><small>Open the map' + ARROW + '</small></span></a></div>\n' +
    THEME_SWITCH +
    '</footer>\n' +
    '<p class="colophon">' + COLOPHON + '</p>\n<p class="support">' + SUPPORT + '</p>\n';
}
function head(o){
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' + THEME_TAG + '\n' + PAPER_TAG + '\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(o.title) + '</title>\n' +
    '<meta name="description" content="' + esc(o.desc) + '">\n' +
    '<meta name="author" content="Night Watcher">\n' +
    '<link rel="canonical" href="' + o.url + '">\n' +
    '<link rel="alternate" type="application/rss+xml" title="Nocturne" href="/nocturne/feed.xml">\n' +
    '<link rel="icon" href="/icon.svg" type="image/svg+xml">\n' +
    '<link rel="stylesheet" href="/nocturne/nocturne.css">\n' +
    '<meta property="og:type" content="' + o.ogType + '">\n' +
    '<meta property="og:site_name" content="Night Watcher">\n' +
    '<meta property="og:title" content="' + esc(o.ogTitle) + '">\n' +
    '<meta property="og:description" content="' + esc(o.desc) + '">\n' +
    '<meta property="og:url" content="' + o.url + '">\n' +
    '<meta property="og:image" content="' + o.img.url + '">\n' +
    '<meta property="og:image:width" content="' + o.img.w + '">\n' +
    '<meta property="og:image:height" content="' + o.img.h + '">\n' +
    '<meta property="og:image:alt" content="' + esc(o.img.alt) + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:image" content="' + o.img.url + '">\n' +
    '<meta name="twitter:title" content="' + esc(o.ogTitle) + '">\n' +
    '<meta name="twitter:description" content="' + esc(o.desc) + '">\n' +
    (o.extra || "") + '</head>\n';
}
function ldjson(obj){
  return '<script type="application/ld+json">' +
    JSON.stringify(obj).replace(/</g, "\\u003c") + '</script>\n';
}
var SHARE = {url: SITE + "/share.png", w: 1200, h: 630,
             alt: "Night Watcher \u2014 Batman watch orders that spoil nothing"};

function issueUrl(is){ return SITE + "/nocturne/" + is.id + "/"; }
function lastmod(is){
  var d = is.fm.published;
  (is.fm.corrections || []).forEach(function(c){ if(c.date > d) d = c.date; });
  return d;
}
function newestLastmod(list){
  return list.map(lastmod).sort().pop();
}

function fullTitle(f){ return f.t + (f.sub ? " \u2014 " + f.sub : ""); }
/* 6.3.0. Where a title sits, in a line: its neighbours in PATH. */
function placeLine(e){
  var prev = e.prev ? "<em>" + esc(fullTitle(e.prev)) + "</em>" : "", next = e.next ? "<em>" + esc(fullTitle(e.next)) + "</em>" : "";
  if(prev && next) return "Sits after " + prev + ", before " + next + ".";
  if(prev) return "Sits after " + prev + ", the last so far.";
  if(next) return "First in its universe, before " + next + ".";
  return "The only title in its universe.";
}
/* 6.3.0. The box draws only when a story touches the catalogue, whatever its
   beat, or when a new title is flagged for it. A story that touches nothing
   on the map gets no box; its kicker says "Off the map". */
function mapBox(st, cat){
  var e = st.catalogue !== "none" ? cat[st.catalogue] : null;
  if(!e){
    if(st.effect !== "new-entry") return "";
    return '<div class="map none"><p class="lbl">On the map</p><p>Not on the map yet. Flagged for the catalogue.</p></div>\n';
  }
  var tier = {e: "Essential", k: "Core route", o: "Optional"}[e.tier];
  var status = e.parked ? '<dd class="parked"><i class="ring"></i>Parked until ' + esc(e.when) + '</dd>' : '<dd>Out</dd>';
  return '<div class="map"><p class="lbl">On the map</p><p class="place">' + placeLine(e) + '</p><dl>' +
    '<dt>Universe</dt><dd>' + esc(e.gn + " \u00b7 " + e.gname) + '</dd>' +
    '<dt>Tier</dt><dd>' + tier + '</dd>' +
    '<dt>Status</dt>' + status + '</dl></div>\n';
}
function offMap(st){ return st.catalogue === "none" && st.effect !== "new-entry" && st.headline !== LATE; }

/* 6.3.0. The Board: what moved on the map this week, from each story's
   effect, so no new field. Entered (new-entry), Dated (parked-date: a first
   date or a slip), Unparked. A weekly issue with none says so in one line;
   the founding issue has no Board. */
var VERBS = {"new-entry": ["Entered", "entered"], "parked-date": ["Dated", "dated"], "unparked": ["Unparked", "unparked"]};
function board(fm, cat){
  var rows = [];
  fm.stories.forEach(function(st, i){
    var v = VERBS[st.effect];
    if(!v) return;
    var e = st.catalogue !== "none" ? cat[st.catalogue] : null;
    var title = e ? "<em>" + esc(fullTitle(e)) + "</em>" : inline(st.headline);
    rows.push('<li><span class="v ' + v[1] + '">' + v[0] + '</span><a href="#s' + (i + 1) + '">' + title + '</a></li>');
  });
  return '<aside class="board" aria-label="The Board"><p class="bh">The Board</p>' +
    (rows.length ? '<ul>' + rows.join("") + '</ul>' : '<p class="bnone">Nothing moved on the map.</p>') + '</aside>\n';
}

/* 6.5.3: the hero is the page's largest paint, so it says so. The 28 Sept site
   audit's Lighthouse run found the image was eager but never hinted, and that
   the browser found it late. Only the hero: the figures below the fold stay
   lazy, and hinting several images high makes none of them high. */
function figure(im, lazy, hero){
  return '<figure><img src="' + esc(im.file) + '" width="' + im.width + '" height="' + im.height +
         '" alt=""' + (lazy ? ' loading="lazy"' : "") + (hero ? ' fetchpriority="high"' : "") + '><figcaption><span>' + esc(im.alt) + ' </span><span>' +
         esc(im.credit) + '</span></figcaption></figure>\n';
}

/* 6.7.0. Neighbors by issue number, inside the foot under Keep reading.
   prev is the greatest published number below this one, next the least above.
   A missing side is a dashed card. The head link names the same issue. */
function issueNeighbors(is, prev, next){
  var head = "", prevCard = "", nextCard = "";
  function dashed(rel){
    if(rel === "prev") return '<p class="soon"><small>Previous</small><span class="t">This is the first issue</span></p>';
    return '<p class="soon"><small>Next \u00b7 No. ' + (is.fm.issue + 1) + '</small><span class="t">Out Sunday, late</span></p>';
  }
  function add(other, rel){
    var html;
    if(!other) html = dashed(rel);
    else {
      var word = rel === "prev" ? "Previous" : "Next";
      var arrow = rel === "prev" ? ARROW_BACK : ARROW_IN;
      var kicker = word + " \u00b7 No. " + other.fm.issue;
      var small = rel === "prev" ? arrow + kicker : kicker + arrow;
      head += '<link rel="' + rel + '" href="' + issueUrl(other) + '">\n';
      html = '<a rel="' + rel + '" href="/nocturne/' + other.id + '/"><small>' + small + '</small><span class="t">' + inline(other.fm.title) + '</span></a>';
    }
    if(rel === "prev") prevCard = html; else nextCard = html;
  }
  add(prev, "prev");
  add(next, "next");
  return {keep: '<nav class="keep" aria-label="Issues"><p class="fl">Keep reading</p><div class="pn">' + prevCard + nextCard + '</div></nav>\n', head: head};
}
function renderIssue(is, cat, prev, next){
  var fm = is.fm, founding = fm.kind === "founding";
  var body = splitBody(is.body);
  var imgs = fm.images || [];
  var hero = fm.hero ? imgs.filter(function(im){ return im.file === fm.hero; })[0] : null;
  /* The hero sits under the banner; any other image follows its own story
     (after:), or, without one, its slot: the first after story 1 (6.3.0). */
  var after = {};
  placeImages(fm).forEach(function(p){ after[p.after] = p.im; });
  var url = issueUrl(is);
  /* 6.4.0: the issue shares as its own card; the hero stays the article's image. */
  var ogImg = {url: url + "card.png", w: CARD.w, h: CARD.h, alt: CARD_ALT + ": " + plain(fm.title)};
  var desc = plain(fm.cold_open);
  var ld = {"@context": "https://schema.org", "@type": "NewsArticle", headline: fm.title,
            datePublished: fm.published, dateModified: lastmod(is), url: url,
            mainEntityOfPage: url, image: (hero ? [url + hero.file] : []).concat([ogImg.url]), description: desc,
            isPartOf: {"@type": "Periodical", name: "Nocturne", url: SITE + "/nocturne/"},
            author: {"@type": "Organization", name: "Night Watcher", url: SITE + "/"},
            publisher: {"@type": "Organization", name: "Night Watcher", url: SITE + "/",
                        logo: {"@type": "ImageObject", url: SITE + "/icon.png"}}};
  var neigh = issueNeighbors(is, prev, next);
  var h = head({title: fm.title + " \u00b7 Nocturne No. " + fm.issue + " \u00b7 Night Watcher",
                ogTitle: fm.title + " \u00b7 Nocturne", desc: desc, url: url, ogType: "article", img: ogImg,
                extra: neigh.head + '<meta property="article:published_time" content="' + fm.published + '">\n' + ldjson(ld)});
  var out = h + '<body>\n<main class="paper">\n' +
    masthead(dateline("No. " + fm.issue, esc(longDate(fm.published)), "Price: nothing. No account.")) +
    '<article>\n<h1>' + inline(fm.title) + '</h1>\n' +
    (founding ? "" : board(fm, cat));
  if(hero) out += figure(hero, false, true);
  out += '<p class="cold">' + inline(fm.cold_open) + '</p>\n<div class="drule" aria-hidden="true"><i></i></div>\n';
  fm.stories.forEach(function(st, i){
    var sec = body.sections[i];
    var n = ("0" + (i + 1)).slice(-2);
    /* 6.2.3: every story has its own address, #s1, #s2 …, so a post or the
       feed can point at one. */
    /* 6.7.4. The comma and the space are characters. Reader view drops the
       flex gap, and adjacent spans otherwise run together as one word. */
    out += '<section class="story" id="s' + (i + 1) + '">\n<p class="kick"><span class="num">' + n +
           (founding ? '</span>' : ', </span><span class="beat">' + st.beat + ', </span><span class="st ' + st.status + '">' + STATUS[st.status] + (offMap(st) ? ', </span>' : '</span>') +
                            (offMap(st) ? '<span class="off">Off the map</span>' : "")) + '</p>\n';
    if(i) out += '<h2>' + inline(st.headline) + '</h2>\n';
    (fm.corrections || []).forEach(function(c){
      if(c.story === i + 1) out += '<p class="corr">Corrected ' + shortDate(c.date) + ': ' + inline(c.text) + '</p>\n';
    });
    sec.paras.forEach(function(p){ out += '<p>' + inline(p) + '</p>\n'; });
    if(after[i + 1]) out += figure(after[i + 1], true);
    if(!founding) out += mapBox(st, cat);
    out += '</section>\n';
  });
  /* 6.5.0: no diamond before the sign-off. The footer's rule closes the page,
     and two diamonds that close together read as one too many. */
  var share = shareButton(url, plain(fm.title) + " \u00b7 Nocturne");
  out += '<p class="signoff">' + inline(fm.sign_off) + '</p>\n' +
         footer({share: share, issue: {n: fm.issue, date: footDate(fm.published)}, keep: neigh.keep}) +
         '</article>\n</main>\n' + BEACON + '\n</body>\n</html>\n';
  return out;
}

/* 6.6.6. The front's document title names Batman news and no spoilers.
   The nameplate stays Nocturne. The description stays the week's line.
   6.6.8. The six questions stay in this order in the FAQPage and in the
   front markdown. They are not printed on the page. An issue does not
   carry them. The apostrophe is the paper's. nightwatcher.life is the
   map. The wire is the feed. */
var FRONT_TITLE = "Nocturne \u00b7 Batman news, no spoilers \u00b7 Night Watcher";
var FRONT_QS = [
  ["Where do I read this week\u2019s Batman news without spoilers?",
   "Nocturne, the Night Final, Sunday late (Montevideo). Screen, comics, games, toys, books. Every story links its source."],
  ["Does Nocturne spoil Batman movies, series, or comics?",
   "No. A story that touches the map says where a Batman title sits. It does not say what happens."],
  ["Is Nocturne a Batman watch order?",
   "No. The watch order is the map at nightwatcher.life. The paper is the week\u2019s Batman news."],
  ["When does the Batman Night Final come out?",
   "Sunday, late, Montevideo time. One issue. No issue in a week with nothing to run."],
  ["Who writes Nocturne\u2019s Batman coverage?",
   "A desk of agents drafts it. A person edits and publishes it. Not a named reporter."],
  ["How do I follow Nocturne\u2019s Batman news?",
   "The wire is /nocturne/feed.xml. No account. Price: nothing."]
];
function frontAnswerMd(i){
  if(i === 2) return "No. The watch order is the map at [nightwatcher.life](/). The paper is the week\u2019s Batman news.";
  if(i === 5) return "The wire is [/nocturne/feed.xml](/nocturne/feed.xml). No account. Price: nothing.";
  return FRONT_QS[i][1];
}
function frontGraph(list){
  var url = SITE + "/nocturne/";
  return {"@context": "https://schema.org", "@graph": [
    {"@type": "WebPage", name: FRONT_TITLE, url: url, dateModified: newestLastmod(list),
     isPartOf: {"@type": "Periodical", name: "Nocturne", url: url}},
    {"@type": "FAQPage", mainEntity: FRONT_QS.map(function(q){
      return {"@type": "Question", name: q[0], acceptedAnswer: {"@type": "Answer", text: q[1]}};
    })}
  ]};
}
/* The front's markdown (6.6.3). There is no source file for /nocturne/:
   the front is this function's HTML, and the markdown is the same page —
   the nameplate, the dateline, the latest issue's title and cold open,
   what is inside it, and the morgue. Nothing here is a second pitch.
   An issue's markdown is its own issue.md, copied byte for byte.
   6.6.8: the six questions follow the morgue here, and only here.
   The page a reader opens does not print them. */
function mdLink(text, href){
  /* Backslash first: a \ before ] would otherwise escape the escape and close the label. */
  return "[" + String(text).replace(/\\/g, "\\\\").replace(/\]/g, "\\]") + "](" + href + ")";
}
function renderFrontMarkdown(list){
  var is = list[0], fm = is.fm, founding = fm.kind === "founding";
  var href = "/nocturne/" + is.id + "/";
  var lines = ["# Nocturne", "",
    "The Night Final. Every Sunday, late. Price: nothing. No account.", "",
    "Latest. No. " + fm.issue + ". " + longDate(fm.published) + ".", "",
    "## " + mdLink(fm.title, href), "",
    fm.cold_open, "",
    "In this issue", ""];
  fm.stories.forEach(function(st, i){
    var label = founding ? st.headline : st.beat + " " + st.headline;
    lines.push((i + 1) + ". " + mdLink(label, href + "#s" + (i + 1)));
  });
  lines.push("", mdLink("Read the Night Final", href), "", "## The morgue", "");
  var rest = list.slice(1);
  if(!rest.length) lines.push("No. " + fm.issue + " is the first. Back issues file here from next Sunday.");
  else rest.forEach(function(b){
    lines.push("- No. " + b.fm.issue + ". " + longDate(b.fm.published) + ". " +
                mdLink(b.fm.title, "/nocturne/" + b.id + "/"));
  });
  lines.push("");
  FRONT_QS.forEach(function(q, i){
    lines.push("## " + q[0], "", frontAnswerMd(i), "");
  });
  return lines.join("\n");
}
function renderHoldingMarkdown(){
  return ["# Nocturne", "",
    "The Night Final. Every Sunday, late. Price: nothing. No account.", "",
    "## On the press", "",
    "The first Night Final is being set. Nocturne is the weekly paper of Night Watcher.", "",
    "### The beat", "",
    "Batman on screen, in comics, games, toys and books. The week\u2019s news, gathered once.", "",
    "### The map next door", "",
    "When a story touches the watch orders, a box says where it sits. The news comes first.", "",
    "### The hour", "",
    "Sunday, late. One issue a week, none in a week without news. No account, no spoilers, every source linked.", "",
    "The feed is already open. Add it to your reader and the first issue arrives there.", ""
  ].join("\n");
}

/* The front (6.4.0). /nocturne/ leads with the latest Night Final: its
   headline, hero, cold open and what is inside, then one button into the
   issue. Back issues file below under The morgue. The nameplate is the h1. */
function renderArchive(list){
  var url = SITE + "/nocturne/";
  var desc = "The Night Final: the week\u2019s Batman news. Every Sunday, late. No spoilers, every source linked.";
  var h = head({title: FRONT_TITLE, ogTitle: FRONT_TITLE, desc: desc,
                url: url, ogType: "website", img: {url: url + "card.png", w: CARD.w, h: CARD.h, alt: CARD_ALT},
                extra: ldjson(frontGraph(list))});
  var is = list[0], fm = is.fm, founding = fm.kind === "founding", href = "/nocturne/" + is.id + "/";
  var hero = fm.hero ? (fm.images || []).filter(function(im){ return im.file === fm.hero; })[0] : null;
  var out = h + '<body>\n<main class="paper">\n' +
    masthead(dateline("The Night Final", "Every Sunday, late", "Price: nothing. No account."), true) +
    '<article class="front" aria-labelledby="lead">\n' +
    '<p class="lead-kick"><span class="new">Latest </span><i class="dsep"></i><span>No. ' + fm.issue + ' </span><i class="dsep"></i><span>' + esc(longDate(fm.published)) + '</span></p>\n' +
    '<h2 id="lead"><a href="' + href + '">' + inline(fm.title) + '</a></h2>\n';
  if(hero) out += '<figure><a href="' + href + '" tabindex="-1" aria-hidden="true"><img src="' + is.id + '/' + esc(hero.file) + '" width="' + hero.width + '" height="' + hero.height +
                  '" alt="" fetchpriority="high"></a><figcaption><span>' + esc(hero.alt) + ' </span><span>' + esc(hero.credit) + '</span></figcaption></figure>\n';
  out += '<p class="cold">' + inline(fm.cold_open) + '</p>\n' +
    '<nav class="inside" aria-label="In this issue"><p class="bh">In this issue</p><ol>\n';
  fm.stories.forEach(function(st, i){
    out += '<li><a href="' + href + '#s' + (i + 1) + '"><span class="num">' + ("0" + (i + 1)).slice(-2) + ' </span>' +
           '<span class="hd">' + (founding ? "" : '<small class="beat">' + st.beat + ' </small>') + inline(st.headline) + '</span></a></li>\n';
  });
  out += '</ol></nav>\n<p class="read"><a class="btn read" href="' + href + '">Read the Night Final' + ARROW_IN + '</a></p>\n</article>\n' +
    '<div class="drule" aria-hidden="true"><i></i></div>\n' +
    '<section class="back" aria-labelledby="morgue"><h2 class="bh2" id="morgue">The morgue</h2>\n';
  var rest = list.slice(1);
  if(!rest.length) out += '<p class="sub">No. ' + fm.issue + ' is the first. Back issues file here from next Sunday.</p>\n';
  else {
    out += '<ol class="issues" reversed>\n';
    rest.forEach(function(b){
      out += '<li><span class="no">' + b.fm.issue + '</span><span class="when">' + esc(longDate(b.fm.published)) +
             '</span><a href="/nocturne/' + b.id + '/">' + inline(b.fm.title) + '</a></li>\n';
    });
    out += '</ol>\n';
  }
  return out + '</section>\n' + footer("") + '</main>\n' + BEACON + '\n</body>\n</html>\n';
}

/* ---------- the share card (6.4.0) ---------- */

/* Each issue shares as a typographic 1200x630 card: the nameplate, the seal,
   the issue's number and date, its headline, and the way back to the paper.
   The landing shares a fixed one. Never built from the hero (BRIEF.md §6:
   images are never altered). The card is drawn from the served faces
   (TrueType copies blessed by qa/subset-fonts.py --card): every glyph is an
   outline in an SVG this module writes, so the SVG is the same on any
   machine. The PNG is that SVG rasterized by resvg. A rasterizer can differ
   in a pixel between CPUs, so the PNG carries the SHA-256 of its SVG in a
   tEXt chunk ("nw-card"), and drift compares that, not the pixels. */
var CARD = {w: 1200, h: 630, ink: "#08090F", bone: "#E7E9F0", dust: "#93A0B8", dim: "#8B97B1",
            line: "#33405C", signal: "#FFCF1F", key: "nw-card"};
var CARD_DIR = path.join(__dirname, "nocturne-fonts", "card");
var cardFaces = null;
function cardFonts(){
  if(cardFaces) return cardFaces;
  var opentype = require("opentype.js");
  var rec = JSON.parse(fs.readFileSync(path.join(CARD_DIR, "record.json"), "utf8")).files;
  var crypto = require("crypto"), errs = [], out = {};
  function load(key, file){
    var r = rec[file];
    if(!r){ errs.push("qa/nocturne-fonts/card/record.json has no " + file + " — run python3 qa/subset-fonts.py --card"); return; }
    var buf = fs.readFileSync(path.join(CARD_DIR, file));
    if(crypto.createHash("sha256").update(buf).digest("hex") !== r.sha256) errs.push("qa/nocturne-fonts/card/" + file + " is not the copy its record blessed — run python3 qa/subset-fonts.py --card");
    var src = path.join(ROOT, r.from);
    if(!fs.existsSync(src) || crypto.createHash("sha256").update(fs.readFileSync(src)).digest("hex") !== r.from_sha256) errs.push("qa/nocturne-fonts/card/" + file + " was copied from a " + r.from + " that has since moved — run python3 qa/subset-fonts.py --card");
    out[key] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
  }
  load("deco", "limelight-latin-400-normal.ttf");
  load("mono", "ibm-plex-mono-latin-400-normal.ttf");
  load("mono6", "ibm-plex-mono-latin-600-normal.ttf");
  load("press", "bodoni-moda-latin-700-normal.ttf");
  cardFaces = {fonts: out, errors: errs};
  return cardFaces;
}
function n2(x){ return (Math.round(x * 100) / 100).toString(); }
/* One line of text as outlines: advance by advance, the tracking added
   between letters the way CSS letter-spacing adds it (after each one). */
function run(font, text, size, track){
  var s = size / font.unitsPerEm, x = 0, parts = [];
  font.stringToGlyphs(text).forEach(function(g){
    parts.push({g: g, x: x});
    x += g.advanceWidth * s + (track || 0) * size;
  });
  return {width: x - (text.length ? (track || 0) * size : 0), draw: function(x0, y){
    return parts.map(function(p){ return p.g.getPath(x0 + p.x, y, size).toPathData(2); }).join("");
  }};
}
/* Text is set by resvg from the card's faces (no system font is loaded),
   named by family; the module measures with the same files to balance. */
var FAMILY = {deco: "NW Deco", mono: "NW Mono", mono6: "NW Mono SemiBold", press: "Bodoni Moda 11pt"};
function textAt(font, text, size, track, x, y, align, fill){
  var key = Object.keys(cardFaces.fonts).filter(function(k){ return cardFaces.fonts[k] === font; })[0];
  var w = {mono6: 600, press: 700}[key] || 400;
  return '<text x="' + n2(x) + '" y="' + n2(y) + '" font-family="' + FAMILY[key] + '" font-weight="' + w +
         '" font-size="' + size + '"' + (track ? ' letter-spacing="' + n2(track * size) + '"' : "") +
         ' text-anchor="' + (align || "start") + '" fill="' + fill + '">' + esc(text) + '</text>';
}
/* The fewest lines at the widest measure, then the narrowest measure that
   keeps that count: balanced, the way text-wrap:balance sets the banner. */
function balance(font, text, size, max){
  var words = text.split(/\s+/);
  function lines(w){
    var out = [], cur = "";
    words.forEach(function(wd){
      var t = cur ? cur + " " + wd : wd;
      if(cur && run(font, t, size, 0).width > w){ out.push(cur); cur = wd; } else cur = t;
    });
    if(cur) out.push(cur);
    return out;
  }
  var best = lines(max), lo = max * 0.4, hi = max;
  for(var i = 0; i < 18; i++){
    var mid = (lo + hi) / 2, l = lines(mid);
    if(l.length > best.length) lo = mid; else { hi = mid; best = l; }
  }
  return best;
}
var CARD_MARK = '<g fill="' + CARD.signal + '" transform="translate(0,5)">' +
  '<path d="M50 36 C 44 25, 29 21, 12 30 C 21 34, 25 41, 24 50 C 31 45, 37 47, 39 55 C 43 50, 47 51, 49 58 L 50 61 L 51 58 C 53 51, 57 50, 61 55 C 63 47, 69 45, 76 50 C 75 41, 79 34, 88 30 C 71 21, 56 25, 50 36 Z"/>' +
  '<path d="M42 32 L49 29 L38 17 Z"/><path d="M58 32 L62 17 L51 29 Z"/><ellipse cx="50" cy="42" rx="10" ry="11"/>' +
  '<path d="M50 51 C 45 60, 45 69, 50 78 C 55 69, 55 60, 50 51 Z"/></g>';
function cardSvg(o){
  var f = cardFonts().fonts, W = CARD.w, H = CARD.h, L = 64, R = W - 64, s = [];
  s.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">');
  s.push('<defs><radialGradient id="g" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="#141B2C"/><stop offset="1" stop-color="' + CARD.ink + '"/></radialGradient></defs>');
  s.push('<rect width="' + W + '" height="' + H + '" fill="url(#g)"/>');
  s.push('<rect x="16.5" y="16.5" width="' + (W - 33) + '" height="' + (H - 33) + '" fill="none" stroke="' + CARD.line + '"/>');
  s.push(textAt(f.mono, "A PAPER OF", 15, 0.2, L, 66, "start", CARD.dust));
  s.push(textAt(f.mono, "NIGHT WATCHER", 15, 0.2, L, 89, "start", CARD.dust));
  var sw = 89, sx = R - sw;
  s.push('<rect x="' + sx + '" y="44" width="' + sw + '" height="69" fill="' + CARD.signal + '"/>');
  s.push(textAt(f.mono6, "NIGHT", 15, 0.2, sx + sw / 2 + 1.5, 68, "middle", CARD.ink));
  s.push(textAt(f.mono6, "FINAL", 15, 0.2, sx + sw / 2 + 1.5, 85, "middle", CARD.ink));
  s.push(textAt(f.mono, "SUNDAY", 13, 0.2, sx + sw / 2 + 1.3, 103, "middle", CARD.ink));
  var plate = o.big ? 128 : 104, py = o.big ? 214 : 176;
  s.push(textAt(f.deco, "NOCTURNE", plate, 0.06, W / 2, py, "middle", CARD.bone));
  var ry = o.big ? 244 : 204;
  s.push('<rect x="' + L + '" y="' + ry + '" width="' + (R - L) + '" height="4" fill="' + CARD.bone + '"/>');
  s.push('<rect x="' + L + '" y="' + (ry + 8.5) + '" width="' + (R - L) + '" height="1.5" fill="' + CARD.bone + '"/>');
  /* the dateline: its parts, diamonds between */
  var dl = o.dateline.map(function(t){ return run(f.mono, t.toUpperCase(), 17, 0.2); });
  var gap = 18, dsz = 7, tot = dl.reduce(function(a, r){ return a + r.width; }, 0) + (dl.length - 1) * (gap * 2 + dsz);
  var x = W / 2 - tot / 2, dy = ry + 43;
  dl.forEach(function(r, i){
    s.push(textAt(f.mono, o.dateline[i].toUpperCase(), 17, 0.2, x, dy, "start", CARD.dust));
    x += r.width;
    if(i < dl.length - 1){
      var cx = x + gap + dsz / 2;
      s.push('<rect x="' + n2(cx - dsz / 2) + '" y="' + n2(dy - 6 - dsz / 2) + '" width="' + dsz + '" height="' + dsz + '" fill="' + CARD.signal + '" transform="rotate(45 ' + n2(cx) + ' ' + n2(dy - 6) + ')"/>');
      x += gap * 2 + dsz;
    }
  });
  var rule2 = dy + 20;
  s.push('<rect x="' + L + '" y="' + rule2 + '" width="' + (R - L) + '" height="1" fill="' + CARD.line + '"/>');
  var top = rule2 + 1, bottom = 540;
  if(o.headline){
    var size = 66, lines = balance(f.press, o.headline, size, 1000);
    while(lines.length > 3 && size > 46){ size -= 4; lines = balance(f.press, o.headline, size, 1000); }
    var lh = size * 1.04, block = lh * (lines.length - 1), cap = size * 0.68;
    var y0 = (top + bottom) / 2 - block / 2 + cap / 2;
    lines.forEach(function(l, i){ s.push(textAt(f.press, l, size, 0, W / 2, y0 + i * lh, "middle", CARD.bone)); });
  }
  if(o.tagline){
    var tl = balance(f.press, o.tagline, 40, 820), tlh = 50, ty0 = (top + bottom) / 2 - tlh * (tl.length - 1) / 2 + 14;
    tl.forEach(function(l, i){ s.push(textAt(f.press, l, 40, 0, W / 2, ty0 + i * tlh, "middle", "#C9CCD3")); });
  }
  s.push('<svg x="' + L + '" y="551" width="46" height="38.33" viewBox="8 16 84 70">' + CARD_MARK + '</svg>');
  s.push(textAt(f.mono, "NIGHTWATCHER.LIFE/NOCTURNE", 16, 0.18, L + 60, 576, "start", CARD.dim));
  s.push(textAt(f.mono6, o.cta.toUpperCase(), 16, 0.18, R, 576, "end", CARD.signal));
  s.push('</svg>');
  return s.join("");
}
/* A tEXt chunk after IHDR: the key, a NUL, the text. */
function pngText(png, key, text){
  var zlib = require("zlib");
  var data = Buffer.concat([Buffer.from(key, "latin1"), Buffer.from([0]), Buffer.from(text, "latin1")]);
  var type = Buffer.from("tEXt", "latin1"), len = Buffer.alloc(4), crc = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([type, data])) >>> 0);
  var at = 8 + 25; /* signature + IHDR (4 length, 4 type, 13 data, 4 crc) */
  return Buffer.concat([png.slice(0, at), len, type, data, crc, png.slice(at)]);
}
function cardKey(png){
  if(!png || png.length < 41 || png.toString("latin1", 37, 41) !== "tEXt") return null;
  var n = png.readUInt32BE(33), d = png.slice(41, 41 + n), z = d.indexOf(0);
  return d.toString("latin1", 0, z) === CARD.key ? d.toString("latin1", z + 1) : null;
}
function cardPng(o){
  var svg = cardSvg(o);
  var sum = require("crypto").createHash("sha256").update(svg).digest("hex");
  var Resvg = require("@resvg/resvg-js").Resvg;
  var png = Buffer.from(new Resvg(svg, {fitTo: {mode: "original"}, font: {loadSystemFonts: false,
    fontFiles: Object.keys(JSON.parse(fs.readFileSync(path.join(CARD_DIR, "record.json"), "utf8")).files).sort().map(function(f){ return path.join(CARD_DIR, f); })}}).render().asPng());
  return pngText(png, CARD.key, sum);
}
var CARD_ALT = "Nocturne, the weekly Batman paper of Night Watcher";
function issueCard(is){
  return cardPng({headline: plain(is.fm.title), cta: "Read the Night Final",
                  dateline: ["No. " + is.fm.issue, longDate(is.fm.published)]});
}
function paperCard(){
  return cardPng({big: true, cta: "Open the paper", dateline: ["The Night Final", "Every Sunday, late", "Price: nothing"],
                  tagline: "The week’s Batman news, told late. No spoilers, every source linked."});
}

/* The holding page (6.2.1): what /nocturne/ serves while no issue is on disk.
   It promises no date, because a founding issue that isn't good is never
   published and the first run moves a week. noindex and out of the sitemap:
   there is nothing to find yet. The feed ships empty beside it, so a reader
   can subscribe before the first Night Final lands. */
function renderHolding(){
  var url = SITE + "/nocturne/";
  var desc = "Nocturne, the weekly paper of Night Watcher. The first Night Final is on the press.";
  var h = head({title: "Nocturne \u00b7 Night Watcher", ogTitle: "Nocturne \u00b7 Night Watcher", desc: desc,
                url: url, ogType: "website", img: SHARE,
                extra: '<meta name="robots" content="noindex">\n'});
  function col(h, t){ return '<section><h2>' + h + '</h2><p>' + t + '</p></section>'; }
  return h + '<body>\n<main class="paper">\n' +
    masthead(dateline("The Night Final", "Every Sunday, late", "Price: nothing. No account.")) +
    '<h1>On the press</h1>\n' +
    '<p class="sub">The first Night Final is being set. Nocturne is the weekly paper of Night Watcher.</p>\n' +
    '<div class="cols">' +
    col("The beat", "Batman on screen, in comics, games, toys and books. The week\u2019s news, gathered once.") +
    col("The map next door", "When a story touches the watch orders, a box says where it sits. The news comes first.") +
    col("The hour", "Sunday, late. One issue a week, none in a week without news. No account, no spoilers, every source linked.") +
    '</div>\n' +
    '<p class="sub">The feed is already open. Add it to your reader and the first issue arrives there.</p>\n' +
    footer("") + '</main>\n' + BEACON + '\n</body>\n</html>\n';
}

/* The feed, read in a browser (6.2.2). A browser shows RSS as a raw XML tree
   that never wraps, so on a phone the feed ran wider than the screen. One
   same-origin stylesheet, linked by an xml-stylesheet instruction, sets it as
   a page of the paper. CSS, not XSLT: no script, nothing the /nocturne/*
   policy has to open, and Chrome is removing XSLT. Feed readers ignore it. */
var FEED_DESC = "The Night Final: the week\u2019s Batman news. Every Sunday, late.";
var FEED_PI = '<?xml-stylesheet type="text/css" href="/nocturne/feed.css"?>';
var FEED_CSS = [
"/* Nocturne \u2014 how a browser shows the feed. Written by qa/nocturne.js; never edited by hand. */",
"@namespace atom url(\"http://www.w3.org/2005/Atom\");",
"@font-face{font-family:\"NW Deco\";src:url(\"/fonts/limelight-latin-400-normal.woff2\") format(\"woff2\");font-display:swap;}",
"@font-face{font-family:\"Big Shoulders Display\";src:url(\"/fonts/big-shoulders-display-latin-700-normal.woff2\") format(\"woff2\");font-weight:700;font-display:swap;}",
"@font-face{font-family:\"NW Sans\";src:url(\"/fonts/ibm-plex-sans-latin-400-normal.woff2\") format(\"woff2\");font-display:swap;}",
"@font-face{font-family:\"NW Mono\";src:url(\"/fonts/ibm-plex-mono-latin-400-normal.woff2\") format(\"woff2\");font-display:swap;}",
":root{--ink:#08090F;--line:#252E42;--line2:#33405C;--bone:#E7E9F0;--dust:#93A0B8;--dim:#8B97B1;--signal:#FFCF1F;--steel:#7295CC;",
"  --mono:\"NW Mono\",ui-monospace,monospace;" + TYPE_APP + "--t-banner:clamp(30px,8.4vw,58px);}",
"rss{display:block;background:var(--ink);color:var(--bone);font-family:\"NW Sans\",-apple-system,\"Segoe UI\",sans-serif;font-size:var(--t-body);line-height:1.6;padding:22px 18px 48px;min-height:100vh;box-sizing:border-box;}",
"channel{display:block;max-width:620px;margin:0 auto;}",
"channel>title{display:block;font-family:\"NW Deco\",serif;text-transform:uppercase;letter-spacing:.04em;font-size:var(--t-banner);line-height:1.05;text-align:center;}",
"channel>title::after{content:\"\";display:block;height:5px;margin-top:14px;border-top:3px solid var(--bone);border-bottom:1px solid var(--bone);box-sizing:border-box;}",
"channel>link,item>link{display:block;font-family:var(--mono);font-size:var(--t-label);letter-spacing:.1em;color:var(--steel);overflow-wrap:anywhere;}",
"channel>link{text-align:center;padding:9px 0;border-bottom:1px solid var(--line2);}",
"channel>description{display:block;text-align:center;color:var(--dust);font-size:var(--t-desc);margin:18px 0 24px;}",
"channel>description::after{content:\"This is the feed. Copy this page\\2019s address into your reader.\";display:block;margin-top:10px;font-family:var(--mono);font-size:var(--t-label);letter-spacing:.1em;text-transform:uppercase;color:var(--signal);}",
"language,lastBuildDate,guid,pubDate,channel>atom|link{display:none;}",
"item{display:block;border-top:1px solid var(--line);padding:16px 0;}",
"item>title{display:block;font-family:\"Big Shoulders Display\",\"Arial Narrow\",sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:var(--t-heading);line-height:1.1;margin-bottom:6px;}",
"item>description{display:block;color:var(--dust);font-size:var(--t-desc);margin-top:6px;}",
"channel:not(:has(item))::after{content:\"No issue yet. The first Night Final lands here.\";display:block;text-align:center;border-top:1px solid var(--line);padding-top:18px;color:var(--dim);font-size:var(--t-desc);}",
""].join("\n");

function renderFeed(list){
  var items = list.slice(0, LIMITS.feed).map(function(is){
    var u = issueUrl(is);
    return '  <item>\n    <title>' + esc("No. " + is.fm.issue + " \u00b7 " + is.fm.title) + '</title>\n' +
           '    <link>' + u + '</link>\n    <guid isPermaLink="true">' + u + '</guid>\n' +
           '    <pubDate>' + rfc822(is.fm.published) + '</pubDate>\n' +
           '    <description>' + esc(plain(is.fm.cold_open)) + '</description>\n  </item>\n';
  }).join("");
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + FEED_PI + '\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n' +
    '  <title>Nocturne \u00b7 Night Watcher</title>\n  <link>' + SITE + '/nocturne/</link>\n' +
    '  <atom:link href="' + SITE + '/nocturne/feed.xml" rel="self" type="application/rss+xml"/>\n' +
    '  <description>' + FEED_DESC + '</description>\n' +
    '  <language>en</language>\n' +
    (list.length ? '  <lastBuildDate>' + rfc822(newestLastmod(list)) + '</lastBuildDate>\n' : "") +
    items + '</channel>\n</rss>\n';
}

var BEGIN = "<!-- nocturne:begin \u2014 written by npm run nocturne:build, never by hand -->";
var END   = "<!-- nocturne:end -->";
function sitemapBlock(list){
  if(!list.length) return BEGIN + "\n  " + END;
  var newest = newestLastmod(list);
  var rows = ['  <url>\n    <loc>' + SITE + '/nocturne/</loc>\n    <lastmod>' + newest +
              '</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>'];
  list.forEach(function(is){
    rows.push('  <url>\n    <loc>' + issueUrl(is) + '</loc>\n    <lastmod>' + lastmod(is) +
              '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.4</priority>\n  </url>');
  });
  return BEGIN + "\n" + rows.join("\n") + "\n  " + END;
}
function withBlock(sitemap, block){
  var i = sitemap.indexOf(BEGIN), j = sitemap.indexOf(END);
  if(i < 0 || j < i) return null;
  return sitemap.slice(0, i) + block + sitemap.slice(j + END.length);
}

/* 6.2.3. The check compared the markdown with sources: and both were right
   while the page linked somewhere else (the double escape). This reads the
   rendered page back: every link a story prints, decoded as a browser
   decodes it, is one of that story's sources, and every source is printed. */
function renderedLinkErrors(is, page){
  var e = [];
  var secs = page.split('<section class="story" id="s').slice(1);
  (is.fm.stories || []).forEach(function(st, i){
    var sec = (secs[i] || "").split("</section>")[0];
    var hrefs = [], re = /<a href="([^"]*)">/g, m;
    while((m = re.exec(sec))) hrefs.push(unesc(m[1]));
    var src = Array.isArray(st.sources) ? st.sources : [];
    hrefs.forEach(function(h){ if(src.indexOf(h) < 0) e.push(is.id + ": story " + (i + 1) + " renders a link to " + h + ", which is not one of its sources — the page would send the reader elsewhere"); });
    src.forEach(function(u){ if(hrefs.indexOf(u) < 0) e.push(is.id + ": story " + (i + 1) + "'s rendered page never links its source " + u); });
  });
  return e;
}

/* ---------- build ---------- */
/* Returns every file docs/nocturne/ should hold, as relative path -> Buffer,
   plus the sitemap block. Pure: no writes, no clock. */
function build(root, opts){
  opts = opts || {};
  var srcDir = path.join(root, opts.src || SRC_REL);
  var cat = opts.catalogue || loadCatalogue(root);
  var issues = listIssues(srcDir);
  var errs = checkAll(issues, cat);
  var EXN = (cat.__names || []).filter(function(n){ return voiceErrors(n, "", []).length; });
  var warns = [];
  /* 6.3.5: the morgue is "one fact or two" in a story (VOICE.md §4). */
  var mgPath = path.join(root, MORGUE_REL), mgLinks = {};
  if(fs.existsSync(mgPath)) morgueEntries(fs.readFileSync(mgPath, "utf8")).forEach(function(e){ e.links.forEach(function(u){ mgLinks[u] = 1; }); });
  issues.forEach(function(is){
    var nm = EXN.concat(is.fm && Array.isArray(is.fm.names) ? is.fm.names : []);
    warns.push.apply(warns, issueWarnings(is, nm));
    (is.fm && Array.isArray(is.fm.stories) ? is.fm.stories : []).forEach(function(st, k){
      var hit = (Array.isArray(st && st.sources) ? st.sources : []).filter(function(u){ return mgLinks[u]; }).length;
      if(hit > 2) warns.push(is.id + ": story " + (k + 1) + " takes " + hit + " sources from the morgue file — history is one fact or two (VOICE.md §4)");
    });
  });
  var files = {"nocturne.css": Buffer.from(CSS, "utf8"), "feed.css": Buffer.from(FEED_CSS, "utf8"),
               "theme.js": Buffer.from(THEME_JS, "utf8"), "paper.js": Buffer.from(PAPER_JS, "utf8")};
  /* The paper's italic and the licence that travels with it (6.2.3). The
     bytes must be the ones qa/subset-fonts.py --paper blessed. */
  PAPER_FONTS.forEach(function(pf){
    var buf = fs.readFileSync(path.join(pf.dir, pf.file));
    if(buf.length !== pf.rec.bytes || require("crypto").createHash("sha256").update(buf).digest("hex") !== pf.rec.sha256){
      errs.push("qa/nocturne-fonts/" + pf.file + " is not the face qa/nocturne-fonts/record.json blessed — run python3 qa/subset-fonts.py --paper");
    }
    files[pf.file] = buf;
  });
  /* The app's licence file, then the paper's own faces' notices (6.4.0). */
  files["OFL.txt"] = Buffer.concat([fs.readFileSync(path.join(root, "docs", "fonts", "OFL.txt")),
                                    fs.readFileSync(path.join(__dirname, "nocturne-fonts", "OFL-paper.txt"))]);
  cardFonts().errors.forEach(function(m){ errs.push(m); });
  var list = issues.filter(function(i){ return i.fm && Number.isInteger(i.fm.issue); })
                   .sort(function(a, b){ return b.fm.issue - a.fm.issue; });
  if(!errs.length && list.length){
    list.forEach(function(is, i){
      /* The list is newest first, so the greater issue number is the row above. */
      var page = renderIssue(is, cat, i + 1 < list.length ? list[i + 1] : null, i > 0 ? list[i - 1] : null);
      renderedLinkErrors(is, page).forEach(function(m){ errs.push(m); });
      files[is.id + "/index.html"] = Buffer.from(page, "utf8");
      files[is.id + "/issue.md"] = fs.readFileSync(path.join(is.dir, "issue.md"));
      files[is.id + "/card.png"] = issueCard(is);
      (is.fm.images || []).forEach(function(im){
        files[is.id + "/" + im.file] = fs.readFileSync(path.join(is.dir, im.file));
      });
    });
    files["index.html"] = Buffer.from(renderArchive(list), "utf8");
    files["index.md"]   = Buffer.from(renderFrontMarkdown(list), "utf8");
    files["card.png"]   = paperCard();
    files["feed.xml"]   = Buffer.from(renderFeed(list), "utf8");
  }
  else if(!errs.length){
    files["index.html"] = Buffer.from(renderHolding(), "utf8");
    files["index.md"]   = Buffer.from(renderHoldingMarkdown(), "utf8");
    files["feed.xml"]   = Buffer.from(renderFeed([]), "utf8");
  }
  Object.keys(files).forEach(function(f){
    if(/\.html$/.test(f) && files[f].length > LIMITS.page){
      errs.push(OUT_REL + "/" + f + " is " + Math.round(files[f].length / 1024) + " KB — a page is at most " + LIMITS.page / 1024 + " KB");
    }
  });
  return {issues: issues, list: list, files: files, errors: errs, warnings: warns, sitemap: sitemapBlock(errs.length ? [] : list)};
}

function onDisk(dir){
  var out = {};
  if(!fs.existsSync(dir)) return out;
  (function walk(d, pre){
    fs.readdirSync(d).forEach(function(n){
      var full = path.join(d, n);
      if(fs.statSync(full).isDirectory()) walk(full, pre + n + "/");
      else out[pre + n] = fs.readFileSync(full);
    });
  })(dir, "");
  return out;
}

/* What differs between docs/nocturne/ (and the sitemap block) and a fresh
   build. Empty means the served paper is exactly what the issues make. */
function drift(root, b){
  var diff = [];
  var have = onDisk(path.join(root, OUT_REL));
  Object.keys(b.files).forEach(function(f){
    if(!have[f]) diff.push(OUT_REL + "/" + f + " is missing");
    else if(/(^|\/)card\.png$/.test(f) ? cardKey(have[f]) !== cardKey(b.files[f]) : !have[f].equals(b.files[f])) diff.push(OUT_REL + "/" + f + " is not what the build writes");
  });
  Object.keys(have).forEach(function(f){
    if(!b.files[f]) diff.push(OUT_REL + "/" + f + " is not written by the build");
  });
  var smPath = path.join(root, "docs", "sitemap.xml");
  var sm = fs.existsSync(smPath) ? fs.readFileSync(smPath, "utf8") : "";
  var next = withBlock(sm, b.sitemap);
  if(next === null) diff.push("docs/sitemap.xml has no Nocturne block (the begin and end markers)");
  else if(next !== sm) diff.push("docs/sitemap.xml's Nocturne block is not what the build writes");
  return diff;
}

function write(root, b){
  var out = path.join(root, OUT_REL);
  var have = onDisk(out);
  Object.keys(have).forEach(function(f){ if(!b.files[f]) fs.unlinkSync(path.join(out, f)); });
  Object.keys(b.files).forEach(function(f){
    fs.mkdirSync(path.dirname(path.join(out, f)), {recursive: true});
    fs.writeFileSync(path.join(out, f), b.files[f]);
  });
  (function prune(d){
    fs.readdirSync(d).forEach(function(n){
      var full = path.join(d, n);
      if(fs.statSync(full).isDirectory()){ prune(full); if(!fs.readdirSync(full).length) fs.rmdirSync(full); }
    });
  })(out);
  var smPath = path.join(root, "docs", "sitemap.xml");
  var next = withBlock(fs.readFileSync(smPath, "utf8"), b.sitemap);
  if(next === null) throw new Error("docs/sitemap.xml has no Nocturne block");
  fs.writeFileSync(smPath, next);
}

/* 6.3.1. The notebook: the desk's research record (nocturne/NOTEBOOK.md). The
   bots write it and file it in their own pull requests; it is never built,
   never published and never read by the renderer. Its one shape: the header
   the owner wrote, then week headings (## 2026-W40) holding entries, one fact
   each, dated the day it was read and linked to where it was read:
     - 2026-09-28 — The fact, in one sentence. [Where](https://…)
   Nothing else: no drafts, no loose notes. A quoted line (6.3.2) is one per
   entry, 25 words at most, its work named in italics. */
var NOTEBOOK_REL = "nocturne/NOTEBOOK.md";
var NOTEBOOK_HEAD = "# The notebook";
var QUOTE_WORDS = 25;
var NOTE_LINE = /^- (\d{4}-\d{2}-\d{2}) \u2014 (.+) \[[^\]\n]+\]\((https:\/\/[^\s)]+)\)$/;
function notebookErrors(text){
  var errs = [], week = null, seen = {};
  if(typeof text !== "string") return errs;
  var lines = text.replace(/\r\n/g, "\n").split("\n");
  if(lines[0] !== NOTEBOOK_HEAD) errs.push(NOTEBOOK_REL + ": the first line is not \"" + NOTEBOOK_HEAD + "\" — the header stays as the owner wrote it");
  var inEntries = false;
  lines.forEach(function(l, i){
    var at = NOTEBOOK_REL + " line " + (i + 1) + ": ";
    var wk = l.match(/^## (\d{4}-W\d{2})$/);
    if(wk){
      if(!sundayOfWeek(wk[1])) errs.push(at + wk[1] + " is not an ISO week like 2026-W40");
      if(seen[wk[1]]) errs.push(at + wk[1] + " has two headings — one per week");
      if(week && wk[1] < week) errs.push(at + wk[1] + " comes after " + week + " — weeks run oldest to newest");
      seen[wk[1]] = 1; week = wk[1]; inEntries = true; return;
    }
    if(!inEntries) return;
    if(l === "") return;
    var m = l.match(NOTE_LINE);
    if(!m){ errs.push(at + "not an entry — \"- YYYY-MM-DD \u2014 one fact. [where](https://…)\""); return; }
    if(!isoDate(m[1])) errs.push(at + m[1] + " is not a date");
    else if(sundayOfWeek(week) && (m[1] > sundayOfWeek(week) || dayDiff(m[1], sundayOfWeek(week)) > 6)) errs.push(at + m[1] + " is not inside " + week);
    /* 6.3.2: a line from the page or the screen is welcome, one per entry,
       25 words at most, with its work named in italics. */
    var marks = (m[2].match(/[\u201c\u201d"]/g) || []).length;
    var quotes = m[2].match(/\u201c[^\u201c\u201d"]*\u201d|"[^\u201c\u201d"]*"/g) || [];
    if(marks !== quotes.length * 2) errs.push(at + "a quotation mark without its pair");
    else if(quotes.length > 1) errs.push(at + "carries " + quotes.length + " quotations — one per entry");
    else if(quotes.length === 1){
      var words = quotes[0].slice(1, -1).trim().split(/\s+/).filter(Boolean).length;
      if(words > QUOTE_WORDS) errs.push(at + "quotes " + words + " words — one line, " + QUOTE_WORDS + " at most");
      if(!/\*[^*\n]+\*/.test(m[2])) errs.push(at + "quotes a line without naming its work in italics (*Batman: Year One* #1)");
    }
  });
  return errs;
}
function dayDiff(a, b){ return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5); }

/* 6.3.5. The morgue file (nocturne/MORGUE.md): the owner's card catalogue of
   Batman's real history. The Morgue reads it before proposing a line; the
   Night Editor looks things up in it, then opens and cites the page. It is
   never a source, never quoted, never published. Its one shape: the owner's
   header, then "## Entries", one fact a line in date order:
     - <date> <type> | <kind> | <grade> | <fact> | [a](https://…) [b](https://…) | checked YYYY-MM-DD
   The date's precision must fit its type; links are https, one or two, never
   a wiki, a retailer or ourselves; the fact is premise only, in no voice, and
   carries nothing from the reporter's fiction. */
var MORGUE_REL = "nocturne/MORGUE.md";
var MORGUE_HEAD = "# The morgue file";
var MORGUE_CAP = 300;
var MORGUE_TYPES = {"on-sale": "day", "edition": "day", "release": "day", "premiere": "day", "announced": "day", "event": "day",
                    "cover": "month", "issue": "year", "published": "year", "copyright": "year", "run": "run"};
var MORGUE_KINDS = ["debut", "comics", "screen", "books", "credit", "event"];
var MORGUE_GRADES = ["first-party", "trade", "press", "reference", "catalogue"];
var MORGUE_BLOCK = /(^|\.)(wikipedia\.org|fandom\.com|wikia\.com|wikia\.org|tvtropes\.org|imdb\.com|reddit\.com|waterstones\.com|nightwatcher\.life|github\.com|githubusercontent\.com)$|(^|\.)(amazon|abebooks|ebay)\.[a-z.]+$/i;
var MORGUE_SPOIL = ["died", "dies", "death", "dead", "killed", "kills", "murdered", "revealed", "reveals", "unmasked",
                    "twist", "ending", "turns out", "secretly", "survives", "resurrected", "post-credit"];
var MORGUE_FICTION = ["Hellbox", "Dorrie", "Ansel", "Cal Rhine", "Kettle Street", "Lobster Shift", "Father Lusk", "Noonan"];
var MORGUE_LINE = /^- (\d{4}(?:-\d{2}(?:-\d{2})?)?(?:\/\d{4})?) ([a-z-]+) \| ([a-z-]+) \| ([a-z-]+) \| (.+) \| ((?:\[[^\]\n]+\]\([^\s)]+\) ?){1,2}) \| checked (\d{4}-\d{2}-\d{2})$/;
function morgueEntries(text){
  var out = [];
  String(text || "").replace(/\r\n/g, "\n").split("\n").forEach(function(l, i){
    var m = l.match(MORGUE_LINE);
    if(m) out.push({line: i + 1, date: m[1], type: m[2], kind: m[3], grade: m[4], fact: m[5], links: linksIn(m[6]), checked: m[7]});
  });
  return out;
}
function morgueErrors(text, today){
  var errs = [];
  if(typeof text !== "string") return errs;
  var lines = text.replace(/\r\n/g, "\n").split("\n");
  if(lines[0] !== MORGUE_HEAD) errs.push(MORGUE_REL + ": the first line is not \"" + MORGUE_HEAD + "\" — the header stays as the owner wrote it");
  var heads = lines.filter(function(l){ return /^#{1,6} /.test(l); });
  if(heads.join("|") !== MORGUE_HEAD + "|## Entries") errs.push(MORGUE_REL + ": its only headings are the title and \"## Entries\"");
  var start = lines.indexOf("## Entries"), prev = null, seen = {}, n = 0;
  today = today || new Date().toISOString().slice(0, 10);
  lines.forEach(function(l, i){
    if(start < 0 || i <= start || l === "") return;
    var at = MORGUE_REL + " line " + (i + 1) + ": ";
    var m = l.match(MORGUE_LINE);
    if(!m){ errs.push(at + "not an entry — \"- <date> <type> | <kind> | <grade> | <fact> | [where](https://…) | checked YYYY-MM-DD\""); return; }
    n++;
    if(l.length > 600) errs.push(at + "is " + l.length + " characters — 600 at most");
    var date = m[1], type = m[2], fact = m[5], links = linksIn(m[6]);
    var want = MORGUE_TYPES[type];
    if(!want) errs.push(at + "\"" + type + "\" is not a date type (" + Object.keys(MORGUE_TYPES).join(", ") + ")");
    else {
      var shape = /^\d{4}\/\d{4}$/.test(date) ? "run" : /^\d{4}-\d{2}-\d{2}$/.test(date) ? "day" : /^\d{4}-\d{2}$/.test(date) ? "month" : "year";
      var fits = want === shape || (want === "month" && shape === "day") || (want === "year" && shape !== "run");
      if(!fits) errs.push(at + (/^[aeiou]/.test(type) ? "an " : "a ") + type + " date needs " + (want === "day" ? "a full date" : want === "month" ? "at least a month" : want === "run" ? "a span, YYYY/YYYY" : "a year") + ", not " + date);
      if(shape === "day" && !isoDate(date)) errs.push(at + date + " is not a date");
      if(shape === "month" && !/^\d{4}-(0[1-9]|1[0-2])$/.test(date)) errs.push(at + date + " is not a month");
    }
    if(MORGUE_KINDS.indexOf(m[3]) < 0) errs.push(at + "\"" + m[3] + "\" is not a kind (" + MORGUE_KINDS.join(", ") + ")");
    if(MORGUE_GRADES.indexOf(m[4]) < 0) errs.push(at + "\"" + m[4] + "\" is not a grade (" + MORGUE_GRADES.join(", ") + "); a wiki, a blog or a fan site is not one");
    var key = date.slice(0, 10);
    if(prev !== null && key < prev) errs.push(at + date + " comes after " + prev + " — entries run in date order");
    prev = key;
    var dup = date + "|" + fact.slice(0, 40).toLowerCase();
    if(seen[dup]) errs.push(at + "files the same fact twice (line " + seen[dup] + ")");
    seen[dup] = i + 1;
    links.forEach(function(u){
      if(!/^https:\/\/\S+$/.test(u)){ errs.push(at + "every link is https — " + u); return; }
      var host; try { host = new URL(u).hostname; } catch(err){ errs.push(at + u + " is not a URL"); return; }
      if(MORGUE_BLOCK.test(host)) errs.push(at + host + " is never a morgue source (no wikis, no retailers, never ourselves)");
      linkErrors(u, at.slice(0, -2)).forEach(function(x){ errs.push(x); });
    });
    if(/\bDISPUTED\b/.test(fact) && links.length < 2) errs.push(at + "a DISPUTED fact carries both sources — two links");
    if(!isoDate(m[7])) errs.push(at + "checked " + m[7] + " is not a date");
    else if(m[7] > today) errs.push(at + "checked " + m[7] + " is in the future");
    if(fact.split(/\s+/).length > 45) errs.push(at + "the fact runs " + fact.split(/\s+/).length + " words — 45 at most; it is a card, not a story");
    /* The fact's own words: titles in italics and quoted titles aside. */
    var own = fact.replace(/\*[^*\n]+\*/g, " ").replace(/\u201c[^\u201d]*\u201d/g, " ").replace(/"[^"\n]*"/g, " ");
    MORGUE_SPOIL.forEach(function(w){
      if(new RegExp("(^|[^\\w-])" + w + "(?![\\w-])", "i").test(own)) errs.push(at + "\"" + w + "\" — premise only; the morgue never carries an outcome (VOICE.md §7)");
    });
    if(/!/.test(own)) errs.push(at + "an exclamation mark outside a title");
    bannedIn(own).forEach(function(w){ errs.push(at + "\"" + w + "\" is on VOICE.md §8's never-use list"); });
    if(/(^|[^\w'\u2019])I(?![\w'\u2019])/.test(own) || own.match(DESK_PLURAL)) errs.push(at + "a card has no voice — no \"we\", no \"I\"");
    MORGUE_FICTION.forEach(function(w){
      if(new RegExp("(^|[^\\w])" + w + "(?![\\w])").test(fact)) errs.push(at + "\"" + w + "\" is the reporter's fiction — the morgue files only what's real");
    });
  });
  if(start < 0) errs.push(MORGUE_REL + ": no \"## Entries\" heading");
  if(n > MORGUE_CAP) errs.push(MORGUE_REL + ": " + n + " entries — " + MORGUE_CAP + " at most; past that it stops being a lookup");
  return errs;
}
/* A card checked more than a year ago is re-opened before it is used again.
   A warning from the command line only, never in the guards: time must not
   turn a green tree red on its own. */
function morgueWarnings(text, today){
  today = today || new Date().toISOString().slice(0, 10);
  return morgueEntries(text).filter(function(e){ return isoDate(e.checked) && dayDiff(e.checked, today) > 365; })
    .map(function(e){ return MORGUE_REL + " line " + e.line + ": checked " + e.checked + ", over a year ago — re-open its link before it runs"; });
}

module.exports = {build: build, cardKey: cardKey, CARD: CARD, PAPER_JS: PAPER_JS, PAPER_TAG: PAPER_TAG, notebookErrors: notebookErrors, NOTEBOOK_REL: NOTEBOOK_REL, NOTEBOOK_HEAD: NOTEBOOK_HEAD, drift: drift, write: write, checkAll: checkAll, listIssues: listIssues,
                  footDate: footDate,
                  loadCatalogue: loadCatalogue, sundayOfWeek: sundayOfWeek, webpSize: webpSize,
                  LIMITS: LIMITS, BEGIN: BEGIN, END: END, FEED_PI: FEED_PI, FEED_DESC: FEED_DESC, OUT_REL: OUT_REL, SRC_REL: SRC_REL,
                  COLOPHON: COLOPHON, SUPPORT: SUPPORT, SUPPORT_URL: SUPPORT_URL, BEACON: BEACON, BEACON_TOKEN: BEACON_TOKEN, THEME_TAG: THEME_TAG,
                  THEME_JS: THEME_JS, DARKER: DARKER, BEATS: BEATS,
                  styleWarnings: styleWarnings, simileCount: simileCount, issueWarnings: issueWarnings, STYLE: STYLE,
  deskPluralIn: deskPluralIn, pronounWarnings: pronounWarnings,
                  MORGUE_REL: MORGUE_REL, MORGUE_HEAD: MORGUE_HEAD, morgueErrors: morgueErrors, morgueEntries: morgueEntries,
                  morgueWarnings: morgueWarnings, NEVER: NEVER};

/* Warnings print after a clean run and never change the exit code: the
   Night Editor reads them and answers each in the PR (BRIEF.md §7). */
function printWarnings(ws){
  if(!ws || !ws.length) return;
  console.log("\nNocturne: " + ws.length + " warning" + (ws.length > 1 ? "s" : "") + " (they do not fail the check; fix each or keep it, and list them in the PR):");
  ws.forEach(function(m){ console.log("  \u26a0 " + m); });
  console.log("");
}

if(require.main === module){
  var cmd = process.argv[2];
  var b = build(ROOT);
  var nbPath = path.join(ROOT, NOTEBOOK_REL);
  if(fs.existsSync(nbPath)) b.errors = b.errors.concat(notebookErrors(fs.readFileSync(nbPath, "utf8")));
  var mgPath = path.join(ROOT, MORGUE_REL);
  if(fs.existsSync(mgPath)){
    var mg = fs.readFileSync(mgPath, "utf8");
    b.errors = b.errors.concat(morgueErrors(mg));
    b.warnings = (b.warnings || []).concat(morgueWarnings(mg));
  }
  if(b.errors.length){
    console.log("\nNocturne: " + b.errors.length + " problem" + (b.errors.length > 1 ? "s" : "") + ":");
    b.errors.forEach(function(m){ console.log("  \u2717 " + m); });
    console.log("");
    process.exit(1);
  }
  printWarnings(b.warnings);
  if(cmd === "build"){
    write(ROOT, b);
    console.log("Nocturne: " + b.list.length + " issue" + (b.list.length === 1 ? "" : "s") + " built into " +
                OUT_REL + "/ (" + Object.keys(b.files).length + " files) and the sitemap block");
  } else if(cmd === "check"){
    var d = drift(ROOT, b);
    if(d.length){
      console.log("\nNocturne: docs/nocturne/ is not what the build writes — run npm run nocturne:build:");
      d.forEach(function(m){ console.log("  \u2717 " + m); });
      console.log("");
      process.exit(1);
    }
    console.log("Nocturne: " + b.list.length + " issue" + (b.list.length === 1 ? "" : "s") +
                " checked, docs/nocturne/ matches the build");
  } else {
    console.log("usage: node qa/nocturne.js build|check");
    process.exit(2);
  }
}
