/* qa/negative/census.js — THE ONE READER OF THE FIXTURE CORPUS (5.3.1).
   Until 5.3.1 four places counted "which lines are fixtures, and which of
   them are smoke": guard 65 (the README and qa.yml counts), guard 113 (the
   shard weights), guard 138 (the coverage map's tokenizer) and run-all.sh
   (the dispatch order) — three of them requiring the first three arguments
   double-quoted, one of them a grep anchored on the line's end. They agreed
   by luck, and a fixture written in a shape one of them could not read was
   counted by the others and not by it. This module reads the corpus once,
   the way bash reads it, and every consumer asks it:

     node qa/negative/census.js            # per-suite table + totals
     node qa/negative/census.js --weights  # "WEIGHT FILE" lines for run-all.sh

   A fixture is a run_case or green_case call at the start of a line (leading
   whitespace allowed; a commented-out or quoted mention is not a call). Its
   arguments are read with bash's three quoting rules — a double-quoted word
   with backslash escapes, a single-quoted word with none, a bare word — after
   backslash-newline continuations are joined. A fixture is SMOKE when its
   fourth argument (the suite) is "smoke", in any quoting; its phase is the
   fifth argument; its section is the sixth. Weight is what guard 113 has
   always used: a smoke fixture costs forty guards fixtures. */
"use strict";
var fs = require("fs"), path = require("path");

var SMOKE_WEIGHT = 40;

/* Read one call's arguments the way bash would, from the character after
   the helper name to the end of the (joined) line. */
function tokenize(t, i){
  var args = [];
  while(i < t.length && t.charAt(i) !== "\n"){
    var ch = t.charAt(i);
    if(ch === " " || ch === "\t"){ i++; continue; }
    if(ch === "#") break;
    var w = "", q = (ch === '"' || ch === "'") ? ch : "";
    if(q) i++;
    while(i < t.length){
      ch = t.charAt(i);
      if(q === '"' && ch === "\\"){ w += t.charAt(i + 1); i += 2; continue; }
      if(!q && ch === "\\"){ w += t.charAt(i + 1); i += 2; continue; }
      if(q ? ch === q : /[\s]/.test(ch)) break;
      w += ch; i++;
    }
    if(q) i++;
    args.push(w);
  }
  return args;
}

function readSuite(file){
  var raw = fs.readFileSync(file, "utf8");
  var joined = raw.replace(/\\\n/g, " ");
  var cases = [];
  var r = /^[ \t]*(run_case|green_case)[ \t]+/gm, x;
  while((x = r.exec(joined))){
    var args = tokenize(joined, x.index + x[0].length);
    var helper = x[1];
    var c = {helper: helper, args: args, label: args[0] || ""};
    if(helper === "run_case"){
      c.expect = args[1] || "";
      c.suite = args[3] || "guards";
      c.phase = args[4] || "";
      c.sect = /^\d+$/.test(args[5] || "") ? Number(args[5]) : 0;
    } else {
      c.expect = null;
      c.suite = args[2] || "guards";
      c.phase = "";
      c.sect = 0;
    }
    c.smoke = c.suite === "smoke";
    cases.push(c);
  }
  var smoke = cases.filter(function(c){ return c.smoke; }).length;
  return {file: path.basename(file), cases: cases, fixtures: cases.length, smoke: smoke,
          guards: cases.length - smoke, weight: (cases.length - smoke) + SMOKE_WEIGHT * smoke};
}

function census(dir){
  var files = fs.readdirSync(dir).filter(function(f){ return /^negtest.*\.sh$/.test(f); }).sort();
  var suites = files.map(function(f){ return readSuite(path.join(dir, f)); });
  var tot = {suites: suites.length, fixtures: 0, smoke: 0, guards: 0, weight: 0};
  suites.forEach(function(s){ tot.fixtures += s.fixtures; tot.smoke += s.smoke; tot.guards += s.guards; tot.weight += s.weight; });
  return {suites: suites, totals: tot};
}

module.exports = {census: census, readSuite: readSuite, tokenize: tokenize, SMOKE_WEIGHT: SMOKE_WEIGHT};

if(require.main === module){
  var c = census(__dirname);
  if(process.argv.indexOf("--weights") >= 0){
    c.suites.forEach(function(s){ console.log(s.weight + " " + s.file); });
  } else {
    c.suites.forEach(function(s){
      console.log(String(s.weight).padStart(5) + "  " + String(s.fixtures).padStart(4) + " fixtures  " +
                  String(s.smoke).padStart(3) + " smoke  " + s.file);
    });
    console.log("total: " + c.totals.suites + " suites, " + c.totals.fixtures + " fixtures (" +
                c.totals.guards + " guards, " + c.totals.smoke + " smoke), weight " + c.totals.weight);
  }
}
