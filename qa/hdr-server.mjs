// QA harness: serve docs/ the way Cloudflare Workers Assets would, applying
// docs/_headers rules cumulatively, 404.html with a 404 status, and dir index.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2];
const PORT = Number(process.argv[3] || 8123);
const rules = [];
let cur = null;
for (const line of fs.readFileSync(path.join(ROOT, "_headers"), "utf8").split("\n")) {
  if (!line.trim() || line.trim().startsWith("#")) continue;
  if (!/^\s/.test(line)) { cur = { pat: line.trim(), h: [] }; rules.push(cur); continue; }
  const i = line.indexOf(":");
  cur.h.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
}
// Placeholders match the assets plane: :name is one path segment, * is a
// splat, and the captured text is written into the header value.
function compile(pat) {
  const names = [];
  let src = "^";
  for (let i = 0; i < pat.length; i++) {
    if (pat[i] === "*") { names.push("splat"); src += "(.*)"; continue; }
    if (pat[i] === ":" && /[A-Za-z]/.test(pat[i + 1] || "")) {
      let j = i + 1;
      while (j < pat.length && /\w/.test(pat[j])) j++;
      names.push(pat.slice(i + 1, j));
      src += "([^/]+)";
      i = j - 1;
      continue;
    }
    src += pat[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return { re: new RegExp(src + "$"), names };
}
function fill(value, names, groups) {
  let out = value;
  names.forEach((name, i) => { out = out.split(":" + name).join(groups[i + 1]); });
  return out;
}
const TYPES = { html: "text/html; charset=utf-8", css: "text/css", js: "text/javascript", json: "application/json",
  xml: "application/xml", png: "image/png", webp: "image/webp", woff2: "font/woff2", svg: "image/svg+xml",
  ico: "image/x-icon", txt: "text/plain; charset=utf-8", md: "text/markdown; charset=utf-8" };

http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  let p = decodeURIComponent(u.pathname), file = path.join(ROOT, p), status = 200;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!p.endsWith("/")) { res.writeHead(307, { Location: p + "/" }); return res.end(); }
    file = path.join(file, "index.html");
  }
  if (!fs.existsSync(file)) { file = path.join(ROOT, "404.html"); status = 404; }
  const headers = { "Content-Type": TYPES[file.split(".").pop()] || "application/octet-stream" };
  for (const r of rules) {
    const compiled = compile(r.pat);
    const hit = compiled.re.exec(p);
    if (!hit) continue;
    for (const [k, v] of r.h) {
      const value = fill(v, compiled.names, hit);
      headers[k] = headers[k] && k.toLowerCase() === "link" ? headers[k] + ", " + value : value;
    }
  }
  res.writeHead(status, headers);
  res.end(req.method === "HEAD" ? undefined : fs.readFileSync(file));
}).listen(PORT, () => console.log("listening " + PORT));
