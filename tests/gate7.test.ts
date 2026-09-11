import { test } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import os from "node:os";
import { runCli } from "../src/cli/index.ts";
import type { Finding } from "../src/contracts/API_CONTRACTS.ts";
import type { EngineMocks } from "../src/orchestration/controller.ts";

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

test("Gate 7 - C1: Deterministic sorting", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate7-"));
  const lockfilePath = path.join(root, "package-lock.json");
  await fs.writeFile(lockfilePath, "{}");

  const mocks: EngineMocks = {
    getAdvisoryFindings: () => [createMockFinding("id-C"), createMockFinding("id-A")],
    getPolicyFindings: () => [createMockFinding("id-B")]
  };

  const output = await runCli({
    projectRoot: root,
    lockfile: "package-lock.json",
    mocks
  });

  const parsed = JSON.parse(output);
  assert.strictEqual(Array.isArray(parsed), true);
  assert.strictEqual(parsed.length, 3);
  assert.strictEqual(parsed[0].id, "id-A");
  assert.strictEqual(parsed[1].id, "id-B");
  assert.strictEqual(parsed[2].id, "id-C");
});

test("Gate 7 - C2: Empty states", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate7-"));
  const lockfilePath = path.join(root, "package-lock.json");
  await fs.writeFile(lockfilePath, "{}");

  const output = await runCli({
    projectRoot: root,
    lockfile: "package-lock.json",
    mocks: {}
  });

  const parsed = JSON.parse(output);
  assert.strictEqual(Array.isArray(parsed), true);
  assert.strictEqual(parsed.length, 0);
});

test("Gate 7 - C3: Catches boundary error and outputs JSON", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate7-"));

  const output = await runCli({
    projectRoot: root,
    lockfile: "../../../etc/passwd"
  });

  const parsed = JSON.parse(output);
  assert.strictEqual(typeof parsed.error, "string");
  assert.strictEqual(parsed.error, "PATH_ESCAPE");
});
