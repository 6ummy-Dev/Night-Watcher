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
const match = (pat, p) => pat.endsWith("*") ? p.startsWith(pat.slice(0, -1)) : p === pat;
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
  for (const r of rules) if (match(r.pat, p)) for (const [k, v] of r.h) {
    headers[k] = headers[k] && k.toLowerCase() === "link" ? headers[k] + ", " + v : v;
  }
  res.writeHead(status, headers);
  res.end(req.method === "HEAD" ? undefined : fs.readFileSync(file));
}).listen(PORT, () => console.log("listening " + PORT));
