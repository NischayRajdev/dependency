import { test } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import os from "node:os";
import { ScanController, type ScanRequest, type EngineMocks } from "../src/orchestration/controller.ts";
import { BoundaryError } from "../src/security/boundary.ts";
import type { Finding } from "../src/contracts/API_CONTRACTS.ts";

function createMockFinding(id: string): Finding {
  return {
    id,
    scanId: "mock",
    category: "outdated",
    packageInstanceIds: [],
    applicability: "applicable",
    evidence: [],
    uncertainty: [],
    suggestedActions: []
  };
}

test("Gate 6 - S1: Scan orchestration success", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate6-"));
  const lockfilePath = path.join(root, "package-lock.json");
  await fs.writeFile(lockfilePath, "{}");

  const req: ScanRequest = {
    projectRoot: root,
    lockfile: "package-lock.json",
    entryPoints: [],
    policyVersion: "1",
    catalogVersion: "1",
    limitsProfile: "1"
  };

  const controller = new ScanController();
  const scanId = await controller.startScan(req, {});
  assert.ok(scanId.startsWith("scan-"));
});

test("Gate 6 - S2: Scan orchestration rejects unsafe path", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate6-"));

  const req: ScanRequest = {
    projectRoot: root,
    lockfile: "../../../etc/passwd",
    entryPoints: [],
    policyVersion: "1",
    catalogVersion: "1",
    limitsProfile: "1"
  };

  const controller = new ScanController();
  await assert.rejects(controller.startScan(req), BoundaryError);
});

test("Gate 6 - A1: Findings aggregation concatenates", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate6-"));
  const lockfilePath = path.join(root, "package-lock.json");
  await fs.writeFile(lockfilePath, "{}");

  const req: ScanRequest = {
    projectRoot: root,
    lockfile: "package-lock.json",
    entryPoints: [],
    policyVersion: "1",
    catalogVersion: "1",
    limitsProfile: "1"
  };

  const mocks: EngineMocks = {
    getAdvisoryFindings: () => [createMockFinding("adv-1")],
    getPolicyFindings: () => [createMockFinding("pol-1")]
  };

  const controller = new ScanController();
  const scanId = await controller.startScan(req, mocks);
  const findings = controller.getScanFindings(scanId);
  
  assert.strictEqual(findings.length, 2);
  assert.strictEqual(findings[0].id, "adv-1");
  assert.strictEqual(findings[1].id, "pol-1");
});

test("Gate 6 - A2: Findings aggregation empty", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate6-"));
  const lockfilePath = path.join(root, "package-lock.json");
  await fs.writeFile(lockfilePath, "{}");

  const req: ScanRequest = {
    projectRoot: root,
    lockfile: "package-lock.json",
    entryPoints: [],
    policyVersion: "1",
    catalogVersion: "1",
    limitsProfile: "1"
  };

  const controller = new ScanController();
  const scanId = await controller.startScan(req, {});
  const findings = controller.getScanFindings(scanId);
  
  assert.strictEqual(findings.length, 0);
});
