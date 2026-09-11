import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { ScanController } from "./src/orchestration/controller.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(root, "frontend");
const fixtureRoot = path.join(root, "demo-fixture");
const controller = new ScanController();
const host = "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const sessionToken = randomBytes(32).toString("hex");

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};

function send(res, status, body, contentType = "application/json; charset=utf-8", extra = {}) {
  res.writeHead(status, { ...securityHeaders, "Content-Type": contentType, ...extra });
  res.end(body);
}

async function scanDemo(mode = 'default') {
  const isAttack = mode === 'attack';
  const rootDir = isAttack ? path.join(root, "demo-fixture-attack") : fixtureRoot;
  const scanId = await controller.startScan({
    projectRoot: rootDir,
    lockfile: "package-lock.json",
    entryPoints: ["src/index.js"],
    policyVersion: "demo-policy-v1",
    catalogVersion: isAttack ? "mujhackx-demo-attack-2026-09-11" : "mujhackx-demo-osv-2026-09-11",
    limitsProfile: "hackathon-v1",
  });
  return controller.getScanReport(scanId);
}

async function serveStatic(urlPath, res) {
  const requested = urlPath === "/" ? "index.html" : urlPath.slice(1);
  if (!/^(?:index\.html|app\.js|styles\.css)$/.test(requested)) {
    send(res, 404, JSON.stringify({ error: "NOT_FOUND" }));
    return;
  }
  const file = path.join(frontendRoot, requested);
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
  try { send(res, 200, await fs.readFile(file), types[path.extname(file)]); }
  catch { send(res, 404, JSON.stringify({ error: "NOT_FOUND" })); }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${host}:${port}`);
    if (![`${host}:${port}`, `localhost:${port}`].includes(req.headers.host)) {
      send(res, 403, JSON.stringify({ error: "HOST_REJECTED" })); return;
    }
    if (req.method === "GET" && url.pathname === "/api/session") {
      send(res, 200, JSON.stringify({ token: sessionToken, mode: "local", authentication: "local-session-token" })); return;
    }
    if (req.method === "GET" && url.pathname === "/api/sample") {
      send(res, 200, await fs.readFile(path.join(fixtureRoot, "package-lock.json")), undefined, { "Content-Disposition": 'attachment; filename="package-lock.json"' }); return;
    }
    if (req.method === "GET" && url.pathname === "/api/sample-source") {
      send(res, 200, await fs.readFile(path.join(fixtureRoot, "src/index.js")), "text/plain", { "Content-Disposition": 'attachment; filename="entry.js"' }); return;
    }
    if (req.method === "POST" && url.pathname === "/api/import") {
      if (req.headers.origin !== `http://${req.headers.host}` || req.headers["x-fides-token"] !== sessionToken) {
        send(res, 403, JSON.stringify({ error: "SESSION_REJECTED" })); return;
      }
      if (!req.headers["content-type"]?.startsWith("application/json")) { send(res, 415, JSON.stringify({ error: "JSON_REQUIRED" })); return; }
      let size = 0; const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 2097152) { send(res, 413, JSON.stringify({ error: "INPUT_TOO_LARGE" })); return; }
        chunks.push(chunk);
      }
      let input;
      try { input = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { send(res, 400, JSON.stringify({ error: "INVALID_JSON" })); return; }
      if (!input || typeof input.lockfile !== "string" || (input.source !== undefined && typeof input.source !== "string")) { send(res, 400, JSON.stringify({ error: "INVALID_IMPORT" })); return; }
      const snapshot = await fs.readFile(path.join(fixtureRoot, "advisories/snapshot.json"), "utf8");
      send(res, 200, JSON.stringify(controller.scanText(input.lockfile, input.source, snapshot))); return;
    }
    if (req.method === "GET" && url.pathname === "/api/scan-results") {
      const mode = url.searchParams.get("mode") || "default";
      send(res, 200, JSON.stringify(await scanDemo(mode)));
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/audit-export") {
      const report = await scanDemo();
      send(res, 200, JSON.stringify(report, null, 2), "application/json; charset=utf-8", {
        "Content-Disposition": `attachment; filename="fides-audit-${report.scan.id}.json"`,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/ai-explain") {
      let body = "";
      for await (const chunk of req) body += chunk;
      try {
        const { findingId, mode } = JSON.parse(body);
        const report = await scanDemo(mode || "default");
        const finding = report.findings.find(f => f.id === findingId);
        if (!finding) {
          send(res, 404, JSON.stringify({ error: "FINDING_NOT_FOUND" }));
          return;
        }
        
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          send(res, 400, JSON.stringify({ error: "NO_API_KEY", message: "GROQ_API_KEY is not set in environment." }));
          return;
        }
        
        const prompt = `You are a cybersecurity dependency expert. Explain this finding to a developer in plain English, avoiding jargon. 
        Focus on WHAT happened, WHY it's important, WHERE it is, and HOW to fix it.
        Package: ${finding.package.name}@${finding.package.version}
        Advisory: ${finding.advisory.id}
        Direct Dependency: ${finding.package.direct}
        Summary info: ${JSON.stringify(finding.summary)}
        Please keep the response short and actionable, format with markdown.`;
        
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            max_tokens: 500,
            messages: [{ role: "user", content: prompt }]
          })
        });
        
        if (!groqRes.ok) {
          const errText = await groqRes.text();
          console.error("Groq API Error:", errText);
          send(res, 502, JSON.stringify({ error: "AI_ERROR", message: "Failed to communicate with Groq AI API." }));
          return;
        }
        
        const data = await groqRes.json();
        send(res, 200, JSON.stringify({ explanation: data.choices[0].message.content }));
      } catch (err) {
        console.error(err);
        send(res, 500, JSON.stringify({ error: "INTERNAL_ERROR" }));
      }
      return;
    }
    if (req.method !== "GET") {
      send(res, 405, JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), undefined, { Allow: "GET" });
      return;
    }
    await serveStatic(url.pathname, res);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "SCAN_FAILED";
    send(res, 500, JSON.stringify({ error: code }));
  }
});

server.listen(port, host, () => console.log(`FIDES // VERIFY ready at http://${host}:${port}`));
