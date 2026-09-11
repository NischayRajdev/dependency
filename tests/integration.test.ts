import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ScanController } from "../src/orchestration/controller.ts";

const repositoryRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fixtureRoot = path.join(repositoryRoot, "demo-fixture");

test("Integration - complete deterministic demo audit", async () => {
  const controller = new ScanController();
  const request = {
    projectRoot: fixtureRoot,
    lockfile: "package-lock.json",
    entryPoints: ["src/index.js"],
    policyVersion: "demo-policy-v1",
    catalogVersion: "mujhackx-demo-osv-2026-09-11",
    limitsProfile: "hackathon-v1",
  };
  const firstId = await controller.startScan(request);
  const secondId = await controller.startScan(request);
  assert.equal(firstId, secondId, "frozen inputs must produce the same scan identity");

  const report = controller.getScanReport(firstId);
  assert.equal(report.schemaVersion, "fides-audit-v1");
  assert.equal(report.engine.version, "0.1.0-hackathon");
  assert.equal(report.advisorySnapshot.source, "bundled_snapshot");
  assert.equal(report.advisorySnapshot.id, "mujhackx-demo-osv-2026-09-11");
  assert.equal(report.inventory.data?.instances.length, 6);
  assert.equal(report.inventory.data?.instances.filter(item => item.name === "duplicate-dep").length, 2);
  assert.equal(report.findings.length, 3);

  const direct = report.findings.find(item => item.package.name === "vulnerable-dep");
  const transitive = report.findings.find(item => item.package.name === "transitive-vuln");
  const dynamic = report.findings.find(item => item.package.name === "dynamic-dep");
  assert.equal(direct?.package.direct, true);
  assert.equal(direct?.reachability?.status, "potential_path_found");
  assert.equal(transitive?.package.direct, false);
  assert.equal(transitive?.reachability?.status, "no_path_found_in_scope");
  assert.equal(dynamic?.reachability?.status, "unknown");
  assert.ok(dynamic?.reachability?.unsupportedPatterns.some(gap => gap.pattern === "dynamic_import_expression"));

  assert.ok(report.candidates.some(item => item.decision === "accepted"));
  assert.ok(report.candidates.some(item => item.decision === "rejected"));
  assert.ok(report.candidates.some(item => item.decision === "uncertain"));
  assert.ok(report.candidates.every(item => item.compatibilityTestState === "untested" && !item.verifiedUnderSpecifiedChecks));
  assert.ok(report.findings.every(item => item.evidence.length > 0 && item.uncertainty.includes("EXPLOIT_PRECONDITIONS_NOT_ASSESSED")));
  assert.ok(report.evidence.every(item => !item.locator.startsWith("/")), "export must not expose absolute paths");
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(report)));
});
