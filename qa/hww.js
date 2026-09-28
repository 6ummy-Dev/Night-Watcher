#!/usr/bin/env node
/* /hww — "How we work", the crew's own page.  node qa/hww.js build|check

   6.5.0, owner's call: who does what on Night Watcher, in what order, and the
   rules that hold it together, as a page in the app's style. It is not
   published: noindex (meta and header), out of the sitemap, linked from
   nothing (guard 170). Anyone with the address can read it; nothing leads
   there.

   Nothing on it is typed twice. Its counts are read from the tree when it is
   built: the guard sections from qa/guards.js's index, the negative suites and
   fixtures from qa/negative/, the smoke checks from the line README already
   holds to smoke.js, the version from BUILD. Its mark is the app header's own
   path, read out of docs/index.html, and its colours and sizes are the app's
   :root. So `check` fails the moment any of them moves without a rebuild, the
   way the paper's drift does. The prose is the owner's, recorded here. */
"use strict";

var fs   = require("fs");
var path = require("path");

var ROOT    = path.join(__dirname, "..");
var OUT_REL = "docs/hww";
var LAST_AUDIT = "6.3.0";   /* the owner's record: the last independent audit read this release */

function read(rel){ return fs.readFileSync(path.join(ROOT, rel), "utf8"); }
function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function n(x){ return x.toLocaleString("en-US"); }

/* ---------- read from the tree ---------- */

function facts(){
  var html = read("docs/index.html"), guards = read("qa/guards.js"), readme = read("README.md");
  var build = (html.match(/var BUILD = "([^"]+)";/) || [])[1];
  if(!build) throw new Error("cannot read BUILD from docs/index.html");
  var sections = (guards.match(/^ {5}\d{1,3} {2}/gm) || []).length;
  var dir = path.join(ROOT, "qa", "negative");
  var suites = fs.readdirSync(dir).filter(function(f){ return /^negtest\d*\.sh$/.test(f); });
  var fixtures = 0;
  suites.forEach(function(f){ fixtures += (fs.readFileSync(path.join(dir, f), "utf8").match(/^(run_case|green_case)\b/gm) || []).length; });
  var smoke = (readme.match(/the path end to end — (\d+) checks\./) || [])[1];
  if(!smoke) throw new Error("cannot read the smoke count from README.md");
  var mark = (html.match(/<button class="mark" id="markBtn"[^>]*>\s*(<svg viewBox="8 16 84 70"[\s\S]*?<\/svg>)/) || [])[1];
  if(!mark) throw new Error("cannot read the header's mark from docs/index.html");
  mark = mark.replace(/\n\s*/g, "");
  /* every plain :root block (the theme overrides are :root[data-theme=…]) */
  var tok = {}, rm, rre = /(^|[\s}]):root\{([\s\S]*?)\}/g;
  while((rm = rre.exec(html))){
    (rm[2].match(/--[a-z0-9-]+\s*:[^;]+/g) || []).forEach(function(d){ var i = d.indexOf(":"); var k = d.slice(0, i).trim(); if(!(k in tok)) tok[k] = d.slice(i + 1).trim(); });
  }
  return {build: build, sections: sections, suites: suites.length, fixtures: fixtures, smoke: +smoke, mark: mark, tok: tok};
}

/* ---------- the stylesheet ---------- */

var KEYS = ["--ink", "--sunk", "--card", "--card2", "--line", "--line2", "--bone", "--dust", "--dim",
            "--signal", "--steel", "--signalline", "--deco", "--disp", "--body", "--mono",
            "--t-display", "--t-title", "--t-heading", "--t-num", "--t-body", "--t-desc", "--t-note", "--t-label", "--t-fine"];
function css(f){
  var vars = KEYS.map(function(k){
    if(!f.tok[k]) throw new Error("the app's :root has no " + k);
    return k + ":" + f.tok[k] + ";";
  }).join("");
  return [
"/* /hww — written by qa/hww.js; never edited by hand. The app's tokens and faces. */",
"@font-face{font-family:\"NW Deco\";src:url(\"/fonts/limelight-latin-400-normal.woff2\") format(\"woff2\");font-weight:400;font-display:swap;}",
"@font-face{font-family:\"Big Shoulders Display\";src:url(\"/fonts/big-shoulders-display-latin-700-normal.woff2\") format(\"woff2\");font-weight:700;font-display:swap;}",
"@font-face{font-family:\"NW Sans\";src:url(\"/fonts/ibm-plex-sans-latin-400-normal.woff2\") format(\"woff2\");font-weight:400;font-display:swap;}",
"@font-face{font-family:\"NW Sans\";src:url(\"/fonts/ibm-plex-sans-latin-600-normal.woff2\") format(\"woff2\");font-weight:600;font-display:swap;}",
"@font-face{font-family:\"NW Mono\";src:url(\"/fonts/ibm-plex-mono-latin-400-normal.woff2\") format(\"woff2\");font-weight:400;font-display:swap;}",
"@font-face{font-family:\"NW Mono\";src:url(\"/fonts/ibm-plex-mono-latin-600-normal.woff2\") format(\"woff2\");font-weight:600;font-display:swap;}",
":root{" + vars + "}",
"*{box-sizing:border-box;}html,body{margin:0;padding:0;}",
"body{background:var(--ink);color:var(--bone);font-family:var(--body);font-size:var(--t-body);line-height:1.6;-webkit-font-smoothing:antialiased;}",
"a{color:inherit;}a:focus-visible{outline:2px solid var(--signal);outline-offset:2px;}",
".page{max-width:880px;margin:0 auto;padding:28px 18px 56px;}",
".top{text-align:center;padding:10px 0 26px;border-bottom:1px solid var(--line2);}",
".top .mk{width:58px;height:auto;color:var(--signal);display:block;margin:0 auto 12px;}",
".top .k{font-family:var(--mono);font-size:var(--t-label);letter-spacing:.19em;text-transform:uppercase;color:var(--dust);margin:0 auto;}",
"h1{font-family:var(--deco);font-weight:400;text-transform:uppercase;letter-spacing:.04em;font-size:var(--t-display);line-height:1;margin:10px 0 12px;}",
".lede{color:var(--dust);font-size:var(--t-desc);max-width:560px;margin:0 auto;}",
"section{padding:34px 0 8px;}",
"h2{display:flex;align-items:baseline;gap:12px;font-family:var(--disp);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:var(--t-title);line-height:1.05;margin:0 0 16px;}",
"h2 .no{font-family:var(--mono);font-weight:400;font-size:var(--t-label);letter-spacing:.19em;color:var(--signal);}",
"p{margin:0 0 12px;max-width:66ch;}",
".note{font-size:var(--t-desc);color:var(--dust);}",
/* 01 the shape: the gate, the bar, three lanes, the join */
".gate{max-width:360px;margin:0 auto;background:var(--signal);color:var(--ink);text-align:center;padding:14px 16px;}",
".gate b{display:block;font-family:var(--deco);font-weight:400;text-transform:uppercase;letter-spacing:.04em;font-size:var(--t-heading);line-height:1.1;}",
".gate small{display:block;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;margin-top:6px;}",
".flow{--gap:14px;position:relative;margin:0 auto;}",
".stem{width:1px;height:18px;background:var(--line2);margin:0 auto;}",
".lanes{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:var(--gap);padding-top:18px;}",
/* the bar runs from the first lane's centre to the last's, with the gap counted */
".lanes::before{content:\"\";position:absolute;top:0;height:1px;background:var(--line2);left:calc((100% - 2 * var(--gap)) / 6);right:calc((100% - 2 * var(--gap)) / 6);}",
".lane{position:relative;border:1px solid var(--line2);background:linear-gradient(175deg,var(--card2),var(--card) 70%);padding:12px 14px;}",
".lane::before{content:\"\";position:absolute;left:50%;top:-18px;width:1px;height:18px;background:var(--line2);}",
".lane b{display:block;font-family:var(--disp);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:var(--t-heading);line-height:1.05;}",
".lane .who{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;color:var(--signal);margin:4px 0 8px;display:block;}",
".lane p{font-size:var(--t-desc);color:var(--dust);margin:0;}",
".join{position:relative;padding-top:18px;margin-top:0;}",
".join::before{content:\"\";position:absolute;top:0;height:1px;background:var(--line2);left:calc((100% - 28px) / 6);right:calc((100% - 28px) / 6);}",
".join::after{content:\"\";position:absolute;left:50%;top:0;width:1px;height:18px;background:var(--line2);}",
".lanes+.join{margin-top:0;}",
".lanes .lane::after{content:\"\";position:absolute;left:50%;bottom:-19px;width:1px;height:18px;background:var(--line2);}",
".lanes{margin-bottom:18px;}",
".box{max-width:360px;margin:0 auto;border:1px solid var(--line2);background:var(--sunk);text-align:center;padding:10px 14px;}",
".box b{display:block;font-family:var(--disp);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:var(--t-heading);}",
".box small{display:block;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;color:var(--dust);margin-top:4px;}",
"@media (max-width:640px){.lanes{grid-template-columns:1fr;}.lanes::before,.join::before{display:none;}.lane::before,.lanes .lane::after{display:none;}.lane+.lane{margin-top:0;}.lanes{gap:10px;border-left:1px solid var(--line2);padding:10px 0 10px 14px;margin:0 0 0 50%;transform:translateX(0);}.lanes{margin-left:0;border-left:0;padding-left:0;}}",
/* 02 cards */
".cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;}",
".card{border:1px solid var(--line2);background:var(--card);padding:14px 16px;}",
".card h3{font-family:var(--disp);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:var(--t-heading);margin:0 0 8px;}",
".card dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:baseline;}",
".card dt{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;color:var(--signal);}",
".card dt.no{color:var(--dim);}",
".card dd{margin:0;font-size:var(--t-desc);}",
/* 03 the Sunday machine */
".steps{list-style:none;margin:0;padding:0;counter-reset:s;border-top:1px solid var(--line);}",
".steps li{counter-increment:s;display:grid;grid-template-columns:40px 130px 1fr;gap:12px;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--line);font-size:var(--t-desc);}",
".steps li::before{content:counter(s,decimal-leading-zero);font-family:var(--mono);font-size:var(--t-label);letter-spacing:.19em;color:var(--dim);}",
".steps .when{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.14em;text-transform:uppercase;color:var(--dust);}",
".steps li.gate2 .when{color:var(--signal);}",
".steps li.gate2::before{color:var(--signal);}",
"@media (max-width:560px){.steps li{grid-template-columns:34px 1fr;}.steps .what{grid-column:2;}}",
/* 05 stats */
".stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:0 0 16px;}",
".stat{border:1px solid var(--line2);background:var(--card);padding:12px 14px;}",
".stat b{display:block;font-family:var(--disp);font-weight:700;font-size:var(--t-num);line-height:1;color:var(--signal);}",
".stat span{display:block;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.14em;text-transform:uppercase;color:var(--dust);margin-top:8px;}",
/* 06 tables */
"table{width:100%;border-collapse:collapse;font-size:var(--t-desc);}",
"th{font-family:var(--mono);font-weight:400;font-size:var(--t-fine);letter-spacing:.14em;text-transform:uppercase;color:var(--dust);text-align:left;padding:8px 10px 8px 0;border-bottom:1px solid var(--line2);}",
"td{padding:9px 10px 9px 0;border-bottom:1px solid var(--line);vertical-align:top;}",
".tw{overflow-x:auto;}",
/* 07 chips */
".chips{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0;}",
".chips li{border:1px solid var(--line2);padding:6px 10px;font-family:var(--mono);font-size:var(--t-label);letter-spacing:.1em;text-transform:uppercase;}",
".chips li small{color:var(--dust);letter-spacing:.06em;text-transform:none;font-size:var(--t-label);margin-left:6px;}",
/* 08 rules */
".chipnote{margin-top:12px;}",
".rules{margin:0;padding:0 0 0 22px;}",
".rules li{margin:0 0 8px;}",
".rules li::marker{color:var(--signal);font-family:var(--mono);}",
".foot{margin-top:40px;padding-top:22px;text-align:center;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.08em;text-transform:uppercase;color:var(--dim);line-height:1.8;background:linear-gradient(90deg,transparent,var(--signalline) 50%,transparent) top/100% 1px no-repeat;}",
""].join("\n");
}

/* ---------- the page ---------- */

function card(title, owns, never){
  return '<article class="card"><h3>' + title + '</h3><dl><dt>Owns</dt><dd>' + owns + '</dd><dt class="no">Never</dt><dd>' + never + '</dd></dl></article>';
}
function page(f){
  var out = [];
  out.push('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">');
  out.push('<meta name="robots" content="noindex, nofollow">');
  out.push('<title>How we work · Night Watcher</title>');
  out.push('<link rel="icon" href="/icon.svg" type="image/svg+xml">\n<link rel="stylesheet" href="/hww/hww.css">\n</head>\n<body>\n<main class="page">');
  out.push('<header class="top">' + f.mark.replace('<svg viewBox="8 16 84 70" aria-hidden="true">', '<svg class="mk" viewBox="8 16 84 70" aria-hidden="true">') +
           '<p class="k">Night Watcher · As of ' + esc(f.build) + '</p><h1>How we work</h1>' +
           '<p class="lede">Who does what, in what order, and the rules that hold it together. One fan builds the map; a small crew does the rest. Every change goes through one gate: the owner reviews it and the owner merges it.</p></header>');

  out.push('<section aria-labelledby="s1"><h2 id="s1"><span class="no">01</span>The shape of it</h2>');
  out.push('<div class="flow"><div class="gate"><b>The owner</b><small>Decides · reviews · uploads · merges</small></div><div class="stem"></div>' +
           '<div class="lanes">' +
           '<div class="lane"><b>Claude</b><span class="who">The build desk</span><p>Plans, mocks, builds, QA, release prep, research digs. Hands back a zip; never pushes.</p></div>' +
           '<div class="lane"><b>Grok Bot</b><span class="who">The Nocturne desk</span><p>Eight agents write the Night Final every Sunday and open one pull request as the app nocturne-night-final.</p></div>' +
           '<div class="lane"><b>Outside help</b><span class="who">Ad hoc</span><p>Independent research teams and auditors, called in when a question needs real ground.</p></div>' +
           '</div><div class="join"></div><div class="box"><b>The repo + CI</b><small>Guards · smoke · the negative wall · browsers</small></div><div class="stem"></div>' +
           '<div class="box"><b>Cloudflare</b><small>Workers → nightwatcher.life</small></div></div>');
  out.push('</section>');

  out.push('<section aria-labelledby="s2"><h2 id="s2"><span class="no">02</span>Who owns what</h2><div class="cards">' +
    card("The owner", "Every decision, every merge, every upload, the device passes, the Sunday review, the “I” on X, the rule files.", "—") +
    card("Claude", "Plans, builds, QA reports, release prep, research verification, audit triage.", "Push to the repo, merge, or take a call that is the owner’s.") +
    card("The Grok Bot desk", "Nocturne, the weekly paper: the wire, the street, the morgue, pictures, search, the copy desk, the Night Editor.", "Touch anything outside the paper’s paths, push to main, merge.") +
    card("Research teams", "Any research the project needs: the app, the catalogue, the paper.", "Change the repo. Their files are studies until the owner rules.") +
    card("Auditors", "Independent reads of the live release.", "Open work on their own. Findings go through triage.") +
    '</div></section>');

  out.push('<section aria-labelledby="s3"><h2 id="s3"><span class="no">03</span>The Sunday machine</h2><ol class="steps">' +
    '<li><span class="when">Mon → Sun noon</span><span class="what">The news window. The wire and the street are read; leads go in the notebook.</span></li>' +
    '<li><span class="when">Sun by 17:00</span><span class="what">The desk writes the issue: cards, pictures, the SEO pass, the copy desk, the build and the check.</span></li>' +
    '<li><span class="when">Sun by 17:00</span><span class="what">One pull request, opened as nocturne-night-final[bot]. The fence lets it touch only the paper.</span></li>' +
    '<li class="gate2"><span class="when">Sun 17:00–21:00</span><span class="what">The owner reviews and merges. Nothing else goes to main while it is open.</span></li>' +
    '<li><span class="when">On merge</span><span class="what">Cloudflare deploys; the front, the feed, the sitemap and the card follow on their own.</span></li>' +
    '<li><span class="when">Sun 22:00–23:00</span><span class="what">The desk checks the live page, then the owner posts on X.</span></li>' +
    '<li><span class="when">Not merged by 23:00</span><span class="what">The issue does not run. Still-news carries to next Sunday.</span></li>' +
    '</ol><p class="note">Times are Montevideo. A thin week is fine; a padded one is not. No news, no issue.</p></section>');

  out.push('<section aria-labelledby="s4"><h2 id="s4"><span class="no">04</span>The research loop</h2><ol class="steps">' +
    '<li><span class="when">Deliver</span><span class="what">An outside team delivers its files.</span></li>' +
    '<li><span class="when">Dig</span><span class="what">Claude reopens every cited page and tries to disprove each claim that would change the repo.</span></li>' +
    '<li><span class="when">Sort</span><span class="what">Each claim is held, improved, unconfirmed or wrong, with a brief for the next round.</span></li>' +
    '<li class="gate2"><span class="when">Rule</span><span class="what">The owner rules. Only then does anything go into a release.</span></li>' +
    '</ol></section>');

  out.push('<section aria-labelledby="s5"><h2 id="s5"><span class="no">05</span>Four layers of QA</h2><div class="stats">' +
    '<div class="stat"><b>' + n(f.sections) + '</b><span>Guard sections</span></div>' +
    '<div class="stat"><b>' + n(f.fixtures) + '</b><span>Negative fixtures, ' + f.suites + ' suites</span></div>' +
    '<div class="stat"><b>' + n(f.smoke) + '</b><span>Smoke checks</span></div>' +
    '<div class="stat"><b>' + esc(LAST_AUDIT) + '</b><span>Last outside audit</span></div>' +
    '</div>' +
    '<p><b>The harness</b> runs on every push and pull request: the guards, smoke, the negative wall (every guard made to fail on purpose before it is trusted), and a real browser, Chromium and WebKit, with axe. Paper-only pull requests run the paper’s half.</p>' +
    '<p><b>Claude’s QA reports</b> read the whole repo, each finding with a repro. <b>Independent auditors</b> read the live release. <b>The owner’s eye</b> covers what no harness sees: real devices, VoiceOver, High Contrast, the Sunday review.</p>' +
    '<p class="note">A QA-driven cut takes every finding in one release, and anything left out gets its reason. Standing decisions do not reopen because a scanner proposes their opposite.</p></section>');

  out.push('<section aria-labelledby="s6"><h2 id="s6"><span class="no">06</span>Releases</h2><div class="tw"><table><thead><tr><th>Kind</th><th>When</th><th>Tag and notes</th><th>Wall</th></tr></thead><tbody>' +
    '<tr><td>Major</td><td>Anything that re-means saved progress</td><td>Yes</td><td>Full</td></tr>' +
    '<tr><td>Minor</td><td>A feature</td><td>Yes</td><td>Full</td></tr>' +
    '<tr><td>Patch</td><td>Fixes, copy, research, catalogue triggers</td><td>No</td><td>Scoped</td></tr>' +
    '</tbody></table></div><p class="note">Claude delivers a zip and a prep record; the owner uploads to main, watches CI, confirms the deploy. Never inside a Sunday window.</p></section>');

  out.push('<section aria-labelledby="s7"><h2 id="s7"><span class="no">07</span>The stack</h2><ul class="chips">' +
    ['Claude<small>builds</small>', 'Grok<small>audits</small>', 'Grok Bot<small>the desk</small>', 'Cursor<small>ad hoc</small>',
     'GitHub<small>repo, CI, the desk’s app</small>', 'Cloudflare<small>hosting, DNS, the edge</small>',
     'Search Console<small>and Bing</small>', 'X<small>the Sunday post</small>'].map(function(c){ return '<li>' + c + '</li>'; }).join("") +
    '</ul><p class="note chipnote">In the repo: one file for the app, the paper’s builder, the guards, smoke, the negative wall and the browser check. No server, no account, no new services.</p></section>');

  out.push('<section aria-labelledby="s8"><h2 id="s8"><span class="no">08</span>The rules</h2><ol class="rules">' +
    '<li>The owner merges. No bot, no session, no auditor lands anything.</li>' +
    '<li>Every fact has a source that was opened. Unopened is unconfirmed.</li>' +
    '<li>Plans and mocks before code. Measured, not eyeballed.</li>' +
    '<li>One source of truth per thing: one rating source per show, one owner per rule file, one voice per issue.</li>' +
    '<li>No new third-party services. Use what is already paid for.</li>' +
    '<li>Short, direct, transparent. Show the method; say what was not checked.</li>' +
    '</ol></section>');

  out.push('<p class="foot">Not published: not in the sitemap, linked from nowhere. Its counts are read from the tree at ' + esc(f.build) + '.</p>');
  out.push('</main>\n</body>\n</html>\n');
  return out.join("\n");
}

function build(){
  var f = facts();
  return {facts: f, files: {"index.html": Buffer.from(page(f), "utf8"), "hww.css": Buffer.from(css(f), "utf8")}};
}
function onDisk(){
  var dir = path.join(ROOT, OUT_REL), out = {};
  if(!fs.existsSync(dir)) return out;
  fs.readdirSync(dir).forEach(function(f){ out[f] = fs.readFileSync(path.join(dir, f)); });
  return out;
}
function drift(b){
  var have = onDisk(), diff = [];
  Object.keys(b.files).forEach(function(f){
    if(!have[f]) diff.push(OUT_REL + "/" + f + " is missing");
    else if(!have[f].equals(b.files[f])) diff.push(OUT_REL + "/" + f + " is not what the build writes");
  });
  Object.keys(have).forEach(function(f){ if(!b.files[f]) diff.push(OUT_REL + "/" + f + " is not written by the build"); });
  return diff;
}
function write(b){
  var dir = path.join(ROOT, OUT_REL);
  fs.mkdirSync(dir, {recursive: true});
  Object.keys(onDisk()).forEach(function(f){ if(!b.files[f]) fs.unlinkSync(path.join(dir, f)); });
  Object.keys(b.files).forEach(function(f){ fs.writeFileSync(path.join(dir, f), b.files[f]); });
}

module.exports = {build: build, drift: drift, write: write, OUT_REL: OUT_REL, LAST_AUDIT: LAST_AUDIT};

if(require.main === module){
  var cmd = process.argv[2], b = build();
  if(cmd === "build"){ write(b); console.log("hww: " + OUT_REL + "/ written (" + Object.keys(b.files).length + " files) at " + b.facts.build); }
  else if(cmd === "check"){
    var d = drift(b);
    if(d.length){ d.forEach(function(m){ console.log("  ✗ " + m); }); console.log("hww: run npm run hww:build"); process.exit(1); }
    console.log("hww: " + OUT_REL + "/ matches the build");
  }
  else { console.log("usage: node qa/hww.js build|check"); process.exit(2); }
}
