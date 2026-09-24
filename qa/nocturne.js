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
  weekly:   {min: 3, max: 6, words: [250, 750], story: [60, 120]},
  founding: {min: 4, max: 6, words: [600, 900], story: [60, 260]}
};
var STATUS  = {confirmed: "Confirmed", reported: "Reported", provisional: "Provisional"};
var EFFECTS = ["new-entry", "parked-date", "unparked", "none"];
var KINDS   = ["weekly", "founding"];
/* VOICE.md §7's list, the part a machine can hold. "drops" as a verb and a
   service named as advice need a reader; the editor checks those (§10). */
var BANNED  = ["epic", "iconic", "legendary", "must-watch", "must watch", "game-changer",
               "game changer", "fans rejoice", "buzz", "buzzing", "MCU", "click here"];
var MONTHS  = ["January", "February", "March", "April", "May", "June", "July",
               "August", "September", "October", "November", "December"];
var DAYS    = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
               gn: g.n, gname: g.name, prev: ix ? g.films[ix - 1] : null};
      e.tier = box.tierOf(e);
      e.parked = e.b.indexOf("u") >= 0;
      byId[f.i] = e;
    });
  });
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
    return '<a href="' + esc(links[+n]) + '">' + label + "</a>";
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
function voiceErrors(text, where){
  var e = [], t = plain(text);
  if(/!/.test(t)) e.push(where + ": an exclamation mark — VOICE.md §2 has none");
  BANNED.forEach(function(w){
    var re = new RegExp("(^|[^\\w-])" + w.replace(/[-]/g, "[- ]?") + "(?![\\w-])", "i");
    if(re.test(t)) e.push(where + ": \"" + w + "\" is on VOICE.md §7's never-use list");
  });
  if(/\bthe Bat\b(?!man|mobile|cave|signal|wing|girl|woman)/.test(t)) e.push(where + ": \"the Bat\" — no nicknames (VOICE.md §7)");
  if(/\p{Extended_Pictographic}/u.test(t)) e.push(where + ": an emoji");
  if(/(^|\s)#[A-Za-z]/.test(t)) e.push(where + ": a hashtag");
  if(/\b(watch|stream) (it|them|this|these) (on|at)\b/i.test(t)) {
    e.push(where + ": a service named as advice — the site's where-to-watch search does that job");
  }
  return e;
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
function rfc822(s){
  var d = new Date(s + "T00:00:00Z");
  return DAYS[d.getUTCDay()].slice(0, 3) + ", " + ("0" + d.getUTCDate()).slice(-2) + " " +
         MONTHS[d.getUTCMonth()].slice(0, 3) + " " + d.getUTCFullYear() + " 22:00:00 -0300";
}
/* The Sunday that closes an ISO week, "2026-W39" -> "2026-09-27". */
function sundayOfWeek(week){
  var m = /^(\d{4})-W(\d{2})$/.exec(week || "");
  if(!m) return null;
  var y = +m[1], w = +m[2];
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
  if(kind === "VP8X") return {w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3)};
  if(kind === "VP8 ") return {w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff};
  if(kind === "VP8L"){
    var b = buf.readUInt32LE(21);
    return {w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff)};
  }
  return null;
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
                   "images", "stories", "sign_off", "corrections"];
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
    if(!sunday) E(is, "week is not an ISO week like 2026-W39");
    if(seenWeek[fm.week]) E(is, "week " + fm.week + " has two issues");
    seenWeek[fm.week] = 1;
    if(sunday && typeof fm.slug === "string" && is.id !== fm.week.toLowerCase() + "-" + fm.slug){
      E(is, "the folder is " + is.id + " but week and slug make " + fm.week.toLowerCase() + "-" + fm.slug);
    }
    if(!isoDate(fm.published)) E(is, "published is not a date (YYYY-MM-DD)");
    else if(dayOf(fm.published) !== 0) E(is, "published is not a Sunday — the Night Final is Sunday's paper");
    else if(sunday && fm.published !== sunday) E(is, "published is " + fm.published + " but the Sunday of " + fm.week + " is " + sunday);
    if(typeof fm.title !== "string" || fm.title.length > LIMITS.title) E(is, "title is longer than " + LIMITS.title + " characters");
    if(typeof fm.cold_open === "string"){
      if(words(fm.cold_open) > LIMITS.coldOpen) E(is, "the cold open is over " + LIMITS.coldOpen + " words");
      errs.push.apply(errs, voiceErrors(fm.cold_open, is.id + ": cold open"));
      errs.push.apply(errs, subsetErrors(fm.cold_open, is.id + ": cold open"));
    }
    if(typeof fm.sign_off === "string"){
      errs.push.apply(errs, voiceErrors(fm.sign_off, is.id + ": sign-off"));
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
      ["headline", "status", "sources", "catalogue", "effect"].forEach(function(k){
        if(st[k] === undefined || st[k] === null || st[k] === "") E(is, where + " is missing \"" + k + "\"");
      });
      Object.keys(st).forEach(function(k){
        if(["headline", "status", "sources", "catalogue", "effect"].indexOf(k) < 0) E(is, where + " has an unknown field \"" + k + "\"");
      });
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
      src.forEach(function(u){ if(!/^https:\/\/\S+$/.test(u)) E(is, where + "'s source is not an https URL: " + u); });
      if(sec){
        var ln = linksIn(sec.text);
        src.forEach(function(u){ if(ln.indexOf(u) < 0) E(is, where + " lists a source its text never links: " + u); });
        ln.forEach(function(u){ if(src.indexOf(u) < 0) E(is, where + " links " + u + " without listing it in sources"); });
        var n = words(sec.text);
        total += n;
        if(n < L.story[0] || n > L.story[1]) E(is, where + " is " + n + " words — " + L.story[0] + " to " + L.story[1]);
        errs.push.apply(errs, voiceErrors(sec.text + "\n" + sec.headline, is.id + ": " + where));
      }
    });
    if(total < L.words[0] || total > L.words[1]) E(is, "the issue is " + total + " words — a " + kind + " issue runs " + L.words[0] + " to " + L.words[1]);

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
    });
    if(fm.hero !== undefined && !names[fm.hero]) E(is, "the hero " + fm.hero + " is not one of the listed images");
    fs.readdirSync(is.dir).forEach(function(n){
      if(n !== "issue.md" && !names[n]) E(is, n + " sits in the issue's folder and is not a listed image");
    });

    var corr = fm.corrections === undefined ? [] : fm.corrections;
    if(!Array.isArray(corr)){ E(is, "corrections is not a list"); corr = []; }
    corr.forEach(function(c, i){
      if(!c || !isoDate(c.date) || !Number.isInteger(c.story) || c.story < 1 || c.story > stories.length || typeof c.text !== "string" || !c.text){
        E(is, "correction " + (i + 1) + " needs date, story (1-based) and text");
      } else if(c.date < fm.published) E(is, "correction " + (i + 1) + " is dated before the issue ran");
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

var CSS = [
"/* Nocturne \u2014 the paper's one stylesheet. Written by qa/nocturne.js; never edited by hand. */",
"@font-face{font-family:\"NW Deco\";src:url(\"/fonts/limelight-latin-400-normal.woff2\") format(\"woff2\");font-weight:400;font-display:swap;}",
"@font-face{font-family:\"Big Shoulders Display\";src:url(\"/fonts/big-shoulders-display-latin-700-normal.woff2\") format(\"woff2\");font-weight:700;font-display:swap;}",
"@font-face{font-family:\"NW Sans\";src:url(\"/fonts/ibm-plex-sans-latin-400-normal.woff2\") format(\"woff2\");font-weight:400;font-display:swap;}",
"@font-face{font-family:\"NW Sans\";src:url(\"/fonts/ibm-plex-sans-latin-600-normal.woff2\") format(\"woff2\");font-weight:600;font-display:swap;}",
"@font-face{font-family:\"NW Mono\";src:url(\"/fonts/ibm-plex-mono-latin-400-normal.woff2\") format(\"woff2\");font-weight:400;font-display:swap;}",
"@font-face{font-family:\"NW Mono\";src:url(\"/fonts/ibm-plex-mono-latin-600-normal.woff2\") format(\"woff2\");font-weight:600;font-display:swap;}",
":root{--ink:#08090F;--sunk:#0C111C;--card:#141B2C;--card2:#1B2438;--line:#252E42;--line2:#33405C;",
"  --bone:#E7E9F0;--dust:#93A0B8;--dim:#8B97B1;--suit:#A6ADBA;--signal:#FFCF1F;--steel:#7295CC;",
"  --signalline:rgba(255,207,31,.4);",
"  --deco:\"NW Deco\",\"Big Shoulders Display\",serif;--disp:\"Big Shoulders Display\",\"Arial Narrow\",Impact,sans-serif;",
"  --body:\"NW Sans\",-apple-system,\"Segoe UI\",sans-serif;--mono:\"NW Mono\",ui-monospace,Menlo,monospace;}",
"*{box-sizing:border-box;}",
"html,body{margin:0;padding:0;}",
"body{background:var(--ink);color:var(--bone);font-family:var(--body);font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;}",
"a{color:inherit;}",
"a:focus-visible{outline:2px solid var(--signal);outline-offset:2px;}",
".paper{max-width:760px;margin:0 auto;padding:22px 18px 48px;}",
".mast{text-align:center;padding-top:8px;}",
".mast-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}",
".presents{font-family:var(--mono);font-size:9px;letter-spacing:.19em;text-transform:uppercase;color:var(--dust);margin:4px 0 0;text-align:left;}",
".presents a{text-decoration:none;border-bottom:1px solid var(--line2);}",
".seal{flex:none;font-family:var(--mono);font-weight:600;font-size:9px;letter-spacing:.17em;text-transform:uppercase;line-height:1.15;text-align:center;background:var(--signal);color:var(--ink);padding:6px 8px 5px;}",
".seal small{display:block;font-weight:400;font-size:8px;letter-spacing:.14em;margin-top:2px;}",
".nameplate{font-family:var(--deco);font-weight:400;text-transform:uppercase;letter-spacing:.06em;font-size:clamp(46px,14vw,104px);line-height:.9;margin:14px 0;}",
".nameplate a{text-decoration:none;}",
".rule2{border:0;height:5px;margin:0;border-top:3px solid var(--bone);border-bottom:1px solid var(--bone);}",
".rule1{border:0;border-top:1px solid var(--line2);margin:0;}",
".dateline{font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--dust);display:flex;justify-content:center;flex-wrap:wrap;gap:4px 12px;padding:9px 0;margin:0;}",
".dl1,.dl2{display:inline-flex;gap:12px;align-items:center;}",
"@media (max-width:560px){.dateline{flex-direction:column;align-items:center;gap:5px;}.dl2 .dsep{display:none;}}",
".dsep{display:inline-block;width:4.5px;height:4.5px;background:var(--signal);transform:rotate(45deg);}",
".banner{font-family:var(--deco);font-weight:400;text-transform:uppercase;letter-spacing:.02em;font-size:clamp(30px,8.4vw,58px);line-height:.98;text-align:center;margin:26px 0 20px;text-wrap:balance;}",
"figure{margin:0 0 26px;}",
"figure img{display:block;width:100%;height:auto;border:1px solid var(--line2);background:var(--sunk);}",
"figcaption{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-top:7px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;}",
".cold{font-size:19px;line-height:1.6;margin:0 auto 6px;max-width:620px;}",
".cold::first-letter{font-family:var(--deco);float:left;font-size:62px;line-height:.82;margin:6px 10px 0 0;}",
".drule{display:flex;align-items:center;gap:9px;margin:28px auto;max-width:620px;color:var(--signal);}",
".drule i{width:7px;height:7px;background:currentColor;transform:rotate(45deg);flex:none;}",
".drule::before,.drule::after{content:\"\";flex:1;height:1px;}",
".drule::before{background:linear-gradient(90deg,transparent,var(--signalline));}",
".drule::after{background:linear-gradient(90deg,var(--signalline),transparent);}",
".story{max-width:620px;margin:0 auto;}",
".story+.story{margin-top:38px;padding-top:30px;border-top:1px solid var(--line);}",
".kick{font-family:var(--mono);font-size:10px;letter-spacing:.19em;text-transform:uppercase;margin:0 0 8px;display:flex;gap:10px;align-items:center;}",
".kick .st{color:var(--signal);}",
".kick .st.reported{color:var(--steel);}",
".kick .st.provisional{color:var(--dust);}",
".kick .num{color:var(--dim);}",
".story h2{font-family:var(--disp);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:clamp(24px,6.4vw,30px);line-height:1.02;margin:0 0 12px;}",
".story p{margin:0 0 14px;}",
".story p a{text-decoration:none;border-bottom:1px solid var(--signal);}",
".story p a::after{content:\" \\2197\";font-size:.8em;color:var(--signal);}",
".corr{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--dust);border-left:2px solid var(--signal);padding:2px 0 2px 10px;}",
".map{border:1px solid var(--line2);background:linear-gradient(175deg,var(--card2),var(--card) 70%);padding:12px 14px;margin:4px 0 0;}",
".map dl{display:grid;grid-template-columns:auto 1fr;gap:5px 16px;align-items:baseline;margin:0;}",
".map .lbl{font-family:var(--mono);font-size:9px;letter-spacing:.19em;text-transform:uppercase;color:var(--signal);margin:0 0 8px;}",
".map dt{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);}",
".map dd{margin:0;font-size:14px;}",
".map dd.parked{display:inline-flex;align-items:center;gap:8px;}",
".ring{width:12px;height:12px;border-radius:50%;border:1.5px dashed var(--dust);flex:none;}",
".map.none p:last-child{margin:0;font-size:14px;color:var(--dust);}",
".signoff{text-align:center;font-family:var(--deco);text-transform:uppercase;letter-spacing:.04em;font-size:18px;margin:0;}",
".foot{max-width:620px;margin:40px auto 0;border-top:3px solid var(--bone);padding-top:4px;}",
".foot .inner{border-top:1px solid var(--bone);padding-top:18px;}",
".acts{display:flex;gap:10px;flex-wrap:wrap;margin:6px 0 20px;}",
".btn{font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;padding:12px 14px;min-height:44px;display:inline-flex;align-items:center;}",
".btn.suit{background:var(--suit);color:var(--ink);}",
".btn.ghost{border:1px solid var(--line2);color:var(--steel);font-weight:400;}",
".colophon{font-size:12px;line-height:1.6;color:var(--dim);margin:0;}",
".sub{text-align:center;color:var(--dust);font-size:14px;margin:0 auto 26px;max-width:460px;}",
".issues{list-style:none;margin:0 auto;padding:0;max-width:620px;}",
".issues li{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;padding:16px 0;border-bottom:1px solid var(--line);}",
".issues .no{font-family:var(--deco);font-size:34px;line-height:1;grid-row:1/3;min-width:52px;}",
".issues .when{font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);}",
".issues li:first-child .when{color:var(--signal);}",
".issues a{text-decoration:none;font-family:var(--disp);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:21px;line-height:1.05;}",
"@media (forced-colors:active){.seal,.dsep,.drule i{forced-color-adjust:none;}}",
""].join("\n");

var COLOPHON = "Nocturne is the weekly paper of Night Watcher, one fan\u2019s map of every Batman " +
  "story on screen. Researched and drafted with an AI agent, edited and published by hand. " +
  "Every story links its source. Images credited to their rights holders.";

function masthead(dateline){
  return '<header class="mast">\n' +
    '<div class="mast-top"><p class="presents">A paper of<br><a href="/">Night Watcher</a></p>' +
    '<p class="seal">Night<br>Final<small>Sunday</small></p></div>\n' +
    '<p class="nameplate"><a href="/nocturne/">Nocturne</a></p>\n' +
    '<hr class="rule2">\n<p class="dateline">' + dateline + '</p>\n<hr class="rule1">\n</header>\n';
}
function dateline(a, b, c){
  return '<span class="dl1"><span>' + a + '</span><i class="dsep"></i><span>' + b + '</span></span>' +
         '<span class="dl2"><i class="dsep"></i><span>' + c + '</span></span>';
}
function footer(extra){
  return '<footer class="foot"><div class="inner">\n<div class="acts">' +
    '<a class="btn suit" href="/">Open the map \u2197</a>' +
    '<a class="btn ghost" href="/nocturne/feed.xml">RSS</a>' + (extra || "") + '</div>\n' +
    '<p class="colophon">' + COLOPHON + '</p>\n</div></footer>\n';
}
function head(o){
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(o.title) + '</title>\n' +
    '<meta name="description" content="' + esc(o.desc) + '">\n' +
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

function mapBox(st, cat){
  var e = st.catalogue !== "none" ? cat[st.catalogue] : null;
  if(!e){
    var line = st.effect === "new-entry" ? "Not on the map yet. Flagged for the catalogue."
             : st.status === "confirmed" ? "Not on the map." : "Not on the map. Reported, not confirmed.";
    return '<div class="map none"><p class="lbl">On the map</p><p>' + line + '</p></div>\n';
  }
  var tier = {e: "Essential", k: "Core route", o: "Optional"}[e.tier];
  var prev = e.prev ? "After " + esc(e.prev.t + (e.prev.sub ? " \u2014 " + e.prev.sub : "")) : "First in its universe";
  var status = e.parked ? '<dd class="parked"><i class="ring"></i>Parked until ' + esc(e.when) + '</dd>' : '<dd>Out</dd>';
  return '<div class="map"><p class="lbl">On the map</p><dl>' +
    '<dt>Universe</dt><dd>' + esc(e.gn + " \u00b7 " + e.gname) + '</dd>' +
    '<dt>Filed</dt><dd>' + prev + '</dd>' +
    '<dt>Tier</dt><dd>' + tier + '</dd>' +
    '<dt>Status</dt>' + status + '</dl></div>\n';
}

function renderIssue(is, cat){
  var fm = is.fm, founding = fm.kind === "founding";
  var body = splitBody(is.body);
  var imgs = fm.images || [];
  var hero = fm.hero ? imgs.filter(function(im){ return im.file === fm.hero; })[0] : null;
  /* The hero sits under the banner; any other image follows a story, in
     list order: the first after story 1, the second after story 2. */
  var rest = imgs.filter(function(im){ return im !== hero; });
  var url = issueUrl(is);
  var ogImg = hero ? {url: url + hero.file, w: hero.width, h: hero.height, alt: hero.alt} : SHARE;
  var desc = plain(fm.cold_open);
  var ld = {"@context": "https://schema.org", "@type": "NewsArticle", headline: fm.title,
            datePublished: fm.published, dateModified: lastmod(is), url: url,
            mainEntityOfPage: url, image: [ogImg.url], description: desc,
            isPartOf: {"@type": "Periodical", name: "Nocturne", url: SITE + "/nocturne/"},
            author: {"@type": "Organization", name: "Night Watcher", url: SITE + "/"},
            publisher: {"@type": "Organization", name: "Night Watcher", url: SITE + "/",
                        logo: {"@type": "ImageObject", url: SITE + "/icon.png"}}};
  var h = head({title: fm.title + " \u00b7 Nocturne No. " + fm.issue + " \u00b7 Night Watcher",
                ogTitle: fm.title + " \u00b7 Nocturne", desc: desc, url: url, ogType: "article", img: ogImg,
                extra: '<meta property="article:published_time" content="' + fm.published + '">\n' + ldjson(ld)});
  var out = h + '<body>\n<main class="paper">\n' +
    masthead(dateline("No. " + fm.issue, esc(longDate(fm.published)), "Price: nothing. No account.")) +
    '<article>\n<h1 class="banner">' + inline(fm.title) + '</h1>\n';
  if(hero){
    out += '<figure><img src="' + esc(hero.file) + '" width="' + hero.width + '" height="' + hero.height +
           '" alt="' + esc(hero.alt) + '">' + '<figcaption><span>' + esc(hero.alt) + '</span><span>' +
           esc(hero.credit) + '</span></figcaption></figure>\n';
  }
  out += '<p class="cold">' + inline(fm.cold_open) + '</p>\n<div class="drule" aria-hidden="true"><i></i></div>\n';
  fm.stories.forEach(function(st, i){
    var sec = body.sections[i];
    var n = ("0" + (i + 1)).slice(-2);
    out += '<section class="story">\n<p class="kick"><span class="num">' + n + '</span>' +
           (founding ? "" : '<span class="st ' + st.status + '">' + STATUS[st.status] + '</span>') + '</p>\n';
    if(i) out += '<h2>' + inline(st.headline) + '</h2>\n';
    (fm.corrections || []).forEach(function(c){
      if(c.story === i + 1) out += '<p class="corr">Corrected ' + shortDate(c.date) + ': ' + inline(c.text) + '</p>\n';
    });
    sec.paras.forEach(function(p){ out += '<p>' + inline(p) + '</p>\n'; });
    var im = rest[i];
    if(im){
      out += '<figure><img src="' + esc(im.file) + '" width="' + im.width + '" height="' + im.height +
             '" alt="' + esc(im.alt) + '" loading="lazy"><figcaption><span>' + esc(im.alt) + '</span><span>' +
             esc(im.credit) + '</span></figcaption></figure>\n';
    }
    if(!founding) out += mapBox(st, cat);
    out += '</section>\n';
  });
  out += '<div class="drule" aria-hidden="true"><i></i></div>\n<p class="signoff">' + inline(fm.sign_off) + '</p>\n</article>\n' +
         footer('<a class="btn ghost" href="/nocturne/">All issues</a>') + '</main>\n</body>\n</html>\n';
  return out;
}

function renderArchive(list){
  var url = SITE + "/nocturne/";
  var desc = "The Night Final: the week\u2019s Batman screen news, and what it does to your watch order. Every Sunday, late. No spoilers, every source linked.";
  var h = head({title: "Nocturne \u00b7 Night Watcher", ogTitle: "Nocturne \u00b7 Night Watcher", desc: desc,
                url: url, ogType: "website", img: SHARE});
  var out = h + '<body>\n<main class="paper">\n' +
    masthead(dateline("The Night Final", "Every Sunday, late", "Price: nothing. No account.")) +
    '<h1 class="banner">Back issues</h1>\n<p class="sub">The week\u2019s Batman screen news, and what it does to your watch order. No spoilers, every source linked.</p>\n<ol class="issues" reversed>\n';
  list.forEach(function(is, n){
    out += '<li><span class="no">' + is.fm.issue + '</span><span class="when">' + (n ? "" : "Latest \u00b7 ") +
           esc(longDate(is.fm.published)) + '</span><a href="/nocturne/' + is.id + '/">' + inline(is.fm.title) + '</a></li>\n';
  });
  return out + '</ol>\n' + footer("") + '</main>\n</body>\n</html>\n';
}

function renderFeed(list){
  var items = list.slice(0, LIMITS.feed).map(function(is){
    var u = issueUrl(is);
    return '  <item>\n    <title>' + esc("No. " + is.fm.issue + " \u00b7 " + is.fm.title) + '</title>\n' +
           '    <link>' + u + '</link>\n    <guid isPermaLink="true">' + u + '</guid>\n' +
           '    <pubDate>' + rfc822(is.fm.published) + '</pubDate>\n' +
           '    <description>' + esc(plain(is.fm.cold_open)) + '</description>\n  </item>\n';
  }).join("");
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n' +
    '  <title>Nocturne \u00b7 Night Watcher</title>\n  <link>' + SITE + '/nocturne/</link>\n' +
    '  <atom:link href="' + SITE + '/nocturne/feed.xml" rel="self" type="application/rss+xml"/>\n' +
    '  <description>The Night Final: the week\u2019s Batman screen news, and what it does to your watch order.</description>\n' +
    '  <language>en</language>\n' +
    (list.length ? '  <lastBuildDate>' + rfc822(list.map(lastmod).sort().pop()) + '</lastBuildDate>\n' : "") +
    items + '</channel>\n</rss>\n';
}

var BEGIN = "<!-- nocturne:begin \u2014 written by npm run nocturne:build, never by hand -->";
var END   = "<!-- nocturne:end -->";
function sitemapBlock(list){
  if(!list.length) return BEGIN + "\n  " + END;
  var newest = list.map(lastmod).sort().pop();
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

/* ---------- build ---------- */
/* Returns every file docs/nocturne/ should hold, as relative path -> Buffer,
   plus the sitemap block. Pure: no writes, no clock. */
function build(root, opts){
  opts = opts || {};
  var srcDir = path.join(root, opts.src || SRC_REL);
  var cat = opts.catalogue || loadCatalogue(root);
  var issues = listIssues(srcDir);
  var errs = checkAll(issues, cat);
  var files = {"nocturne.css": Buffer.from(CSS, "utf8")};
  var list = issues.filter(function(i){ return i.fm && Number.isInteger(i.fm.issue); })
                   .sort(function(a, b){ return b.fm.issue - a.fm.issue; });
  if(!errs.length && list.length){
    list.forEach(function(is){
      files[is.id + "/index.html"] = Buffer.from(renderIssue(is, cat), "utf8");
      (is.fm.images || []).forEach(function(im){
        files[is.id + "/" + im.file] = fs.readFileSync(path.join(is.dir, im.file));
      });
    });
    files["index.html"] = Buffer.from(renderArchive(list), "utf8");
    files["feed.xml"]   = Buffer.from(renderFeed(list), "utf8");
  }
  Object.keys(files).forEach(function(f){
    if(/\.html$/.test(f) && files[f].length > LIMITS.page){
      errs.push(OUT_REL + "/" + f + " is " + Math.round(files[f].length / 1024) + " KB — a page is at most " + LIMITS.page / 1024 + " KB");
    }
  });
  return {issues: issues, list: list, files: files, errors: errs, sitemap: sitemapBlock(errs.length ? [] : list)};
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
    else if(!have[f].equals(b.files[f])) diff.push(OUT_REL + "/" + f + " is not what the build writes");
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

module.exports = {build: build, drift: drift, write: write, checkAll: checkAll, listIssues: listIssues,
                  loadCatalogue: loadCatalogue, sundayOfWeek: sundayOfWeek, webpSize: webpSize,
                  LIMITS: LIMITS, BEGIN: BEGIN, END: END, OUT_REL: OUT_REL, SRC_REL: SRC_REL,
                  COLOPHON: COLOPHON};

if(require.main === module){
  var cmd = process.argv[2];
  var b = build(ROOT);
  if(b.errors.length){
    console.log("\nNocturne: " + b.errors.length + " problem" + (b.errors.length > 1 ? "s" : "") + ":");
    b.errors.forEach(function(m){ console.log("  \u2717 " + m); });
    console.log("");
    process.exit(1);
  }
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
