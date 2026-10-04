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
var LAST_AUDIT = "6.5.4";   /* the owner's record: the last independent audit read this release (6.5.5: the full audit of 30 Sept and the site audit of 29 Sept both read 6.5.4) */

function read(rel){ return fs.readFileSync(path.join(ROOT, rel), "utf8"); }
function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function n(x){ return x.toLocaleString("en-US"); }

/* ---------- read from the tree ---------- */

function facts(){
  var html = read("docs/index.html"), guards = read("qa/guards.js"), readme = read("README.md");
  var build = (html.match(/var BUILD = "([^"]+)";/) || [])[1];
  if(!build) throw new Error("cannot read BUILD from docs/index.html");
  var sections = (guards.match(/^ {5}\d{1,3} {2}/gm) || []).length;
  /* 6.5.1 (outside QA, C15): the fixture corpus has one reader, census.js,
     the same one guard 65 and the shards ask. */
  var tot = require("./negative/census.js").census(path.join(ROOT, "qa", "negative")).totals;
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
  return {build: build, sections: sections, suites: tot.suites, fixtures: tot.fixtures, smoke: +smoke, mark: mark, tok: tok};
}

/* ---------- the stylesheet ---------- */

var KEYS = ["--ink", "--sunk", "--card", "--card2", "--line", "--line2", "--bone", "--dust", "--dim",
            "--signal", "--steel", "--signalline", "--deco", "--disp", "--num", "--body", "--mono",
            "--t-display", "--t-title", "--t-heading", "--t-num", "--t-body", "--t-desc", "--t-note", "--t-label", "--t-fine"];
function css(f){
  var vars = KEYS.map(function(k){
    if(!f.tok[k]) throw new Error("the app's :root has no " + k);
    return k + ":" + f.tok[k] + ";";
  }).join("");
  return [
"/* /hww — written by qa/hww.js; never edited by hand. The app's tokens and faces. */",
"/* Landmarks wear --deco at .02em. Item titles wear --disp at .05em and --t-heading. Counts wear --num at .025em. */",
"@font-face{font-family:\"NW Deco\";src:url(\"/fonts/limelight-latin-400-normal.woff2\") format(\"woff2\");font-weight:400;font-style:normal;font-display:swap;}",
"@font-face{font-family:\"Big Shoulders Display\";src:url(\"/fonts/big-shoulders-display-latin-700-normal.woff2\") format(\"woff2\");font-weight:700;font-style:normal;font-display:swap;}",
"@font-face{font-family:\"NW Sans\";src:url(\"/fonts/ibm-plex-sans-latin-400-normal.woff2\") format(\"woff2\");font-weight:400;font-style:normal;font-display:swap;}",
"@font-face{font-family:\"NW Sans\";src:url(\"/fonts/ibm-plex-sans-latin-600-normal.woff2\") format(\"woff2\");font-weight:600;font-style:normal;font-display:swap;}",
"@font-face{font-family:\"NW Mono\";src:url(\"/fonts/ibm-plex-mono-latin-400-normal.woff2\") format(\"woff2\");font-weight:400;font-style:normal;font-display:swap;}",
"@font-face{font-family:\"NW Mono\";src:url(\"/fonts/ibm-plex-mono-latin-600-normal.woff2\") format(\"woff2\");font-weight:600;font-style:normal;font-display:swap;}",
":root{" + vars + "}",
"*{box-sizing:border-box;}html,body{margin:0;padding:0;}",
"body{background:var(--ink);color:var(--bone);font-family:var(--body);font-size:var(--t-body);line-height:1.5;-webkit-font-smoothing:antialiased;}",
"a{color:inherit;}a:focus-visible{outline:2px solid var(--signal);outline-offset:2px;}",
".page{max-width:880px;margin:0 auto;padding:28px 18px 56px;}",
".top{text-align:center;padding:10px 0 26px;border-bottom:1px solid var(--line2);}",
".top .mk{width:58px;height:auto;color:var(--signal);display:block;margin:0 auto 12px;}",
".top .k{font-family:var(--mono);font-size:var(--t-label);letter-spacing:.19em;text-transform:uppercase;color:var(--dust);margin:0 auto;}",
"h1{font-family:var(--deco);font-weight:400;text-transform:uppercase;letter-spacing:.02em;font-size:var(--t-display);line-height:.94;margin:10px 0 12px;}",
".lede{color:var(--dust);font-size:var(--t-desc);max-width:560px;margin:0 auto;}",
"section{padding:34px 0 8px;}",
"h2{display:flex;align-items:baseline;gap:12px;font-family:var(--deco);font-weight:400;text-transform:uppercase;letter-spacing:.02em;font-size:var(--t-title);line-height:1.05;margin:0 0 16px;}",
"h2 .no{font-family:var(--mono);font-weight:400;font-size:var(--t-label);letter-spacing:.19em;color:var(--signal);}",
"p{margin:0 0 12px;max-width:66ch;}",
".note{font-size:var(--t-desc);color:var(--dust);}",
".gate{max-width:360px;margin:0 auto;background:var(--signal);color:var(--ink);text-align:center;padding:14px 16px;}",
".gate b{display:block;font-family:var(--deco);font-weight:400;text-transform:uppercase;letter-spacing:.02em;font-size:var(--t-heading);line-height:1.02;}",
".gate small{display:block;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;margin-top:6px;}",
".flow{--gap:14px;position:relative;margin:0 auto;}",
".stem{width:1px;height:18px;background:var(--line2);margin:0 auto;}",
".lanes{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:var(--gap);padding-top:18px;}",
".lanes.two{grid-template-columns:1fr 1fr;}",
/* 6.5.7: the bar above the lower pair keeps the three-desk inset. A two-column
   inset stopped short of the stems coming down from Cursor and Outside help.
   The extra pixel on the right covers the stem, whose left edge sits at 50%.
   6.5.8: the weekday lane is the Cursor agent. Two columns remain, so the inset stays. */
".lanes::before{content:\"\";position:absolute;top:0;height:1px;background:var(--line2);left:calc((100% - 2 * var(--gap)) / 6);right:calc((100% - 2 * var(--gap)) / 6 - 1px);}",
".lane{position:relative;border:1px solid var(--line2);background:linear-gradient(175deg,var(--card2),var(--card) 70%);padding:12px 14px;}",
/* The lane's border puts the padding edge 1px below the bar, so the stem
   starts one pixel higher than the padding and overlaps the rule. */
".lane::before{content:\"\";position:absolute;left:50%;top:-19px;width:1px;height:19px;background:var(--line2);}",
".lane b{display:block;font-family:var(--disp);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:var(--t-heading);line-height:1.06;}",
".lane .who{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;color:var(--signal);margin:4px 0 8px;display:block;}",
".lane p{font-size:var(--t-desc);color:var(--dust);margin:0;}",
".join{position:relative;padding-top:18px;margin-top:0;}",
".join::before{content:\"\";position:absolute;top:0;height:1px;background:var(--line2);left:calc((100% - 2 * var(--gap)) / 6);right:calc((100% - 2 * var(--gap)) / 6 - 1px);}",
/* The join under the lower pair ends on their stems. The three-desk inset
   left that bar hanging past both cards. */
".lanes.two+.join::before{left:calc((100% - var(--gap)) / 4);right:calc((100% - var(--gap)) / 4 - 1px);}",
".join::after{content:\"\";position:absolute;left:50%;top:0;width:1px;height:18px;background:var(--line2);}",
".lanes+.join{margin-top:0;}",
".lanes .lane::after{content:\"\";position:absolute;left:50%;bottom:-19px;width:1px;height:18px;background:var(--line2);}",
".lanes{margin-bottom:18px;}",
".box{max-width:360px;margin:0 auto;border:1px solid var(--line2);background:var(--sunk);text-align:center;padding:10px 14px;}",
".box b{display:block;font-family:var(--disp);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:var(--t-heading);line-height:1.06;}",
".box small{display:block;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;color:var(--dust);margin-top:4px;}",
"@media (max-width:640px){.lanes,.lanes.two{grid-template-columns:1fr;}.lanes::before,.lanes.two::before,.join::before{display:none;}.lane::before,.lanes .lane::after{display:none;}.lane+.lane{margin-top:0;}.lanes{gap:10px;border-left:1px solid var(--line2);padding:10px 0 10px 14px;}}",
".cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;}",
".card{border:1px solid var(--line2);background:var(--card);padding:14px 16px;}",
".card h3{font-family:var(--disp);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:var(--t-heading);line-height:1.06;margin:0 0 8px;}",
"section>h3{font-family:var(--disp);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:var(--t-heading);line-height:1.06;margin:20px 0 8px;}",
".card dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:baseline;}",
".card dt{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.17em;text-transform:uppercase;color:var(--signal);}",
".card dt.no{color:var(--dim);}",
".card dd{margin:0;font-size:var(--t-desc);}",
".steps{list-style:none;margin:0;padding:0;counter-reset:s;border-top:1px solid var(--line);}",
".steps li{counter-increment:s;display:grid;grid-template-columns:40px 130px 1fr;gap:12px;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--line);font-size:var(--t-desc);}",
".steps li::before{content:counter(s,decimal-leading-zero);font-family:var(--mono);font-size:var(--t-label);letter-spacing:.19em;color:var(--dim);}",
".steps .when{font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.14em;text-transform:uppercase;color:var(--dust);}",
".steps li.gate2 .when{color:var(--signal);}",
".steps li.gate2::before{color:var(--signal);}",
"@media (max-width:560px){.steps li{grid-template-columns:34px 1fr;}.steps .what{grid-column:2;}}",
".stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:0 0 16px;}",
".stat{border:1px solid var(--line2);background:var(--card);padding:12px 14px;}",
".stat b{display:block;font-family:var(--num);font-weight:700;letter-spacing:.025em;font-size:var(--t-num);line-height:1;color:var(--signal);}",
".stat span{display:block;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.12em;text-transform:uppercase;color:var(--dust);margin-top:8px;}",
"table{width:100%;border-collapse:collapse;font-size:var(--t-desc);}",
"th{font-family:var(--mono);font-weight:400;font-size:var(--t-fine);letter-spacing:.14em;text-transform:uppercase;color:var(--dust);text-align:left;padding:8px 10px 8px 0;border-bottom:1px solid var(--line2);}",
"td{padding:9px 10px 9px 0;border-bottom:1px solid var(--line);vertical-align:top;}",
".tw{overflow-x:auto;}",
".chips{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0;}",
".chips li{border:1px solid var(--line2);padding:6px 10px;font-family:var(--mono);font-size:var(--t-label);letter-spacing:.1em;text-transform:uppercase;}",
".chips li small{color:var(--dust);letter-spacing:.06em;text-transform:none;font-size:var(--t-label);margin-left:6px;}",
".chipnote{margin-top:12px;}",
".rules{margin:0;padding:0 0 0 22px;}",
".rules li{margin:0 0 8px;}",
".rules li::marker{color:var(--signal);font-family:var(--mono);}",
".foot{margin-top:40px;padding-top:22px;text-align:center;font-family:var(--mono);font-size:var(--t-fine);letter-spacing:.08em;text-transform:uppercase;color:var(--dim);line-height:1.8;background:linear-gradient(90deg,transparent,var(--signalline) 50%,transparent) top/100% 1px no-repeat;}",
""].join("\n");
}

/* ---------- the page ---------- */

function card(title, owns, never){
  return '<article class="card"><h3>' + esc(title) + '</h3><dl><dt>Owns</dt><dd>' + esc(owns) + '</dd>' +
         (never ? '<dt class="no">Never</dt><dd>' + esc(never) + '</dd>' : '') + '</dl></article>';
}
function page(f){
  var out = [];
  out.push('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">');
  out.push('<meta name="robots" content="noindex, nofollow">');
  out.push('<title>How we work · Night Watcher</title>');
  out.push('<link rel="icon" href="/icon.svg" type="image/svg+xml">\n<link rel="stylesheet" href="/hww/hww.css">\n</head>\n<body>\n<main class="page">');
  out.push('<header class="top">' + f.mark.replace('<svg viewBox="8 16 84 70" aria-hidden="true">', '<svg class="mk" viewBox="8 16 84 70" aria-hidden="true">') +
           '<p class="k">Night Watcher · As of ' + esc(f.build) + '</p><h1>How we work</h1>' +
           '<p class="lede">Who does what, in what order, and the rules that hold it. Cursor is the weekday build desk, and the Cursor agent opens the pull request. The Sunday desk does not move. Every change goes through one gate: the owner reviews it and the owner merges it.</p></header>');

  /* 6.5.6: the prose is the short next brief, now in force. The page's design
     stays 6.5.0's. Counts still come from the tree. */
  out.push('<section aria-labelledby="s1"><h2 id="s1"><span class="no">01</span>The shape of it</h2>');
  out.push('<div class="flow"><div class="gate"><b>The owner</b><small>Still the only approver · the only merger</small></div><div class="stem"></div>' +
           '<div class="lanes">' +
           '<div class="lane"><b>Cursor</b><span class="who">The build desk</span><p>Plans, mocks, builds, QA, release prep, the research dig. The push is the Cursor agent’s, not the owner’s login. Does not merge. Does not use the Sunday app.</p></div>' +
           '<div class="lane"><b>Grok Bot</b><span class="who">The Nocturne desk</span><p>Unchanged. Eight agents. Dr Eggbot runs the week. One Sunday pull request as nocturne-night-final.</p></div>' +
           '<div class="lane"><b>Outside help</b><span class="who">Ad hoc</span><p>Independent research teams and independent auditors. None of them opens work.</p></div>' +
           '</div><div class="lanes two">' +
           '<div class="lane"><b>Cursor agent</b><span class="who">Weekday push</span><p>Opens the pull request. Does not merge. Does not push main. Does not approve.</p></div>' +
           '<div class="lane"><b>nocturne-night-final</b><span class="who">Sunday app</span><p>The same limits, and the fence on top. Four paths only. Not reused on a weekday.</p></div>' +
           '</div><div class="join"></div><div class="box"><b>CI on that pull request</b><small>App pull request: the full wall. Paper pull request: guards only</small></div><div class="stem"></div>' +
           '<div class="box"><b>The owner squash-merges</b><small>One commit · not while a Night Final is open</small></div><div class="stem"></div>' +
           '<div class="box"><b>A merge publishes</b><small>nightwatcher.life · one origin</small></div></div>');
  out.push('<p class="note chipnote">The reader does not move. One file, no account, no server, progress in the browser.</p>');
  out.push('</section>');

  out.push('<section aria-labelledby="s2"><h2 id="s2"><span class="no">02</span>Who owns what</h2><div class="cards">' +
    card("The owner", "Every decision, every merge, the device passes, the Sunday review, the “I” on X and every post there, the five rule files. Approves the weekday pull request because the pusher is not the owner.", "") +
    card("Cursor", "Plans, builds, QA reports, release prep, the dig that tries to disprove a claim. The weekday pull request, as the Cursor agent.", "Merge. Push main. Approve. Push as the owner. Use the Sunday app. Edit the five rule files. Bless a check to make it green.") +
    card("The Sunday desk", "The paper, exactly as now. Eggbot, the six-seat room, SEO by DM.", "Retuned for a weekday. The fence stays keyed on nocturne-night-final[bot].") +
    card("Research teams", "Studies, until the owner rules.", "A commit. The dig and the catalogue edit are two steps.") +
    card("Independent auditors", "An independent read of the live release.", "Open work. A branch.") +
    '</div></section>');

  out.push('<section aria-labelledby="s3"><h2 id="s3"><span class="no">03</span>The Sunday machine</h2>' +
    '<p>The Sunday desk does not move. Nocturne is the paper. The Night Final is the one Sunday edition. It is not the changelog. Times are Montevideo. A thin week is fine. A padded one is not.</p><ol class="steps">' +
    '<li><span class="when">Mon–Sat 08:38</span><span class="what">Stoop, then Wire. Plus the standing look at Justice Year. No pull request on a weekday from this desk.</span></li>' +
    '<li><span class="when">Sun before noon</span><span class="what">The last sweep. The window closes at 12:00.</span></li>' +
    '<li><span class="when">Sun 12:38</span><span class="what">Night Editor, then SEO by DM, then Copy, then pictures, then the stamp, then the pre-flight, then eggbot builds and opens the pull request.</span></li>' +
    '<li class="gate2"><span class="when">Sun 17:00–21:00</span><span class="what">The owner merges. Nothing else goes to main while it is open, weekday pull requests included. Land them before 17:00, or leave them.</span></li>' +
    '<li><span class="when">Sun 22:00–23:00</span><span class="what">A 200 and the headline. The owner posts the one draft.</span></li>' +
    '<li><span class="when">Not by 23:00</span><span class="what">The issue does not run.</span></li>' +
    '</ol>' +
    '<p>Handoff never ships. Four paths only. A quiet week with notebook lines gets one pull request, the notebook alone. Eggbot does not build until the SEO file exists. The token lasts one hour. A Night Final is not a release.</p></section>');

  out.push('<section aria-labelledby="s4"><h2 id="s4"><span class="no">04</span>The research loop</h2><ol class="steps">' +
    '<li><span class="when">Deliver</span><span class="what">An outside team delivers its files. Studies, not commits.</span></li>' +
    '<li><span class="when">Dig</span><span class="what">Cursor reopens every cited page and tries to disprove each claim that would change the repo. It does not edit the catalogue in that same turn.</span></li>' +
    '<li><span class="when">Sort</span><span class="what">Held, improved, unconfirmed, or wrong. Unopened is unconfirmed.</span></li>' +
    '<li class="gate2"><span class="when">Rule</span><span class="what">The owner rules. Only then does a release pull request open.</span></li>' +
    '</ol></section>');

  out.push('<section aria-labelledby="s5"><h2 id="s5"><span class="no">05</span>Four layers of QA</h2><div class="stats">' +
    '<div class="stat"><b>' + n(f.sections) + '</b><span>Guard sections</span></div>' +
    '<div class="stat"><b>' + n(f.fixtures) + '</b><span>Negative fixtures, ' + f.suites + ' suites</span></div>' +
    '<div class="stat"><b>' + n(f.smoke) + '</b><span>Smoke checks</span></div>' +
    '<div class="stat"><b>' + esc(LAST_AUDIT) + '</b><span>Last independent audit</span></div>' +
    '</div>' +
    '<p><b>The harness</b> runs on the pull request, before the merge, and again on main. ' + n(f.sections) + ' guard sections, ' + n(f.fixtures) + ' negative fixtures, ' + n(f.smoke) + ' smoke checks. Chromium and WebKit, with axe. While iterating, the pass can be scoped. The merge gate is the full wall on that commit. A paper-only pull request runs every guard and skips smoke and the wall. Every push to main runs all of it.</p>' +
    '<p><b>Cursor’s QA reports</b> read the whole repo, each finding with a way to reproduce it. <b>Independent auditors</b> read the live release and do not open work. <b>The owner’s eye</b> covers devices, VoiceOver, High Contrast, and the Sunday review.</p>' +
    '<p class="note">A QA-driven cut takes every finding in one release, and anything left out gets its reason. Standing decisions do not reopen because a scanner proposes their opposite.</p></section>');

  out.push('<section aria-labelledby="s6"><h2 id="s6"><span class="no">06</span>Releases</h2><div class="tw"><table><thead><tr><th>Kind</th><th>When</th><th>Tag</th><th>How it lands</th></tr></thead><tbody>' +
    '<tr><td>Major</td><td>Anything that re-means saved progress</td><td>Yes</td><td>Squash-merge. One commit.</td></tr>' +
    '<tr><td>Minor</td><td>A feature</td><td>Yes</td><td>Squash-merge. One commit.</td></tr>' +
    '<tr><td>Patch</td><td>Fixes, copy, QA tooling, documentation</td><td>No</td><td>Squash-merge. One commit. The full wall is CI, not a local selection.</td></tr>' +
    '<tr><td>Night Final</td><td>Sunday</td><td>No</td><td>The desk’s pull request. Not a version.</td></tr>' +
    '</tbody></table></div>' +
    '<p>No zip. The Cursor agent opens the pull request. The owner squash-merges, so a rollback is one commit. If the owner pushes a commit onto that branch, the approval is dismissed and the owner cannot approve the new tip. The fix comes from the Cursor agent. Never inside a Sunday window. A colophon change rewrites every paper page, so that pull request does not land while a Night Final is open.</p>' +
    '<p class="note">A merge to main publishes the site. The wire is read in a private window.</p></section>');

  out.push('<section aria-labelledby="s7"><h2 id="s7"><span class="no">07</span>The stack</h2><ul class="chips">' +
    ['Cursor<small>weekday build desk</small>', 'Independent auditors<small>ad hoc</small>', 'Grok Bot<small>the Sunday desk</small>',
     'GitHub<small>repo, CI, the Sunday app</small>', 'Cloudflare<small>hosting, DNS, the edge</small>'].map(function(c){ return '<li>' + c + '</li>'; }).join("") +
    '</ul><p class="note chipnote">Claude is off the build desk. No new service. In the repo: one file for the app, the paper’s builder, the guards, smoke, the negative wall, and the browser check. No server, no account. Handoff is on the box, not in the repo.</p></section>');

  out.push('<section aria-labelledby="s8"><h2 id="s8"><span class="no">08</span>The rules</h2><ol class="rules">' +
    '<li>The owner merges. No bot, no session, no auditor lands anything.</li>' +
    '<li>Every fact has a source that was opened. Unopened is unconfirmed.</li>' +
    '<li>Plans and mocks before code. Measured, not eyeballed.</li>' +
    '<li>One source of truth per thing. The Cursor file points at the rules. It is not a second brief.</li>' +
    '<li>No new third-party services. Use what is already paid for.</li>' +
    '<li>Short, direct, transparent. Say what was not checked.</li>' +
    '<li>Weekday pushes go out as the Cursor agent. Not as the owner. Not as the Sunday bot.</li>' +
    '</ol></section>');
  out.push('<p class="foot">Unlisted, not secret: out of the sitemap and linked from nothing on the site; its source is in the repo. Dark deco only, because the page runs no script. Its counts are read from the tree at ' + esc(f.build) + '.</p>');
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
