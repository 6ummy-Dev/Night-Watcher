// Night Watcher QA: drive worker.js directly with a fake ASSETS binding.
//   NW_REPO=/path/to/Night-Watcher node worker-probe.mjs
// Prints the negotiation table and one VERDICT line. Expectations follow the
// worker's own contract (README, worker.js header): markdown only when an
// explicit text/markdown strictly beats text/html; weak ETag compare for 304s.
import path from "node:path";
import { pathToFileURL } from "node:url";

const REPO = process.env.NW_REPO || process.cwd();
const mod = (await import(pathToFileURL(path.join(REPO, "worker.js")).href)).default;
const env = { ASSETS: { fetch: async r => {
  const u = new URL(typeof r === "string" ? r : r.url);
  if (u.pathname === "/llms.txt") return new Response("# md", { status: 200, headers: { ETag: '"abc"' } });
  return new Response("<html>", { status: 200, headers: { "Content-Type": "text/html" } });
} } };
const cases = [
  ["text/markdown", "md"], ["text/html", "html"], ["*/*", "html"], ["text/*", "html"],
  ["text/markdown, text/html", "html"], ["text/markdown;q=0.9, text/html;q=0.8", "md"],
  ["text/html;q=0, text/markdown;q=0.1", "md"], ["TEXT/MARKDOWN", "md"], ["text/markdown;q=0", "html"], ["", "html"],
  // I4 (baseline, informational): malformed q-values. RFC 9110 qvalues are 0..1.
  ["text/markdown;q=abc, text/html;q=0.5", "html"], ["text/markdown;q=2, text/html", "html"]
];
let bad = 0, nits = 0;
for (const [accept, want] of cases) {
  const r = await mod.fetch(new Request("https://nightwatcher.life/", { headers: { Accept: accept } }), env);
  const got = (r.headers.get("Content-Type") || "").includes("markdown") ? "md" : "html";
  const malformed = /q=(abc|2)/.test(accept);
  if (got !== want) { if (malformed) nits++; else bad++; }
  console.log(`  ${JSON.stringify(accept).padEnd(42)} -> ${got.padEnd(4)} want ${want}${got !== want ? (malformed ? "  (I4 nit)" : "  MISMATCH") : ""}`);
}
for (const [inm, want] of [['W/"abc"', 304], ['"abc"', 304], ["*", 304], ['"nope"', 200]]) {
  const r = await mod.fetch(new Request("https://nightwatcher.life/", { headers: { Accept: "text/markdown", "If-None-Match": inm } }), env);
  if (r.status !== want) bad++;
  console.log(`  If-None-Match ${inm.padEnd(10)} -> ${r.status} want ${want}`);
}
const h = await mod.fetch(new Request("https://nightwatcher.life/.well-known/api-catalog", { method: "HEAD" }), env);
if (h.status !== 200 || h.body !== null) bad++;
console.log(`VERDICT WRKR ${bad ? "REGRESSION" : "OK"}${" ".repeat(bad ? 4 : 12)} ${bad} contract mismatches; I4 malformed-q nit ${nits ? "still present" : "fixed"}`);
