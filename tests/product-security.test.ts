import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ScanController, ScanError } from "../src/orchestration/controller.ts";
import { BoundaryError } from "../src/security/boundary.ts";

async function fixture(lockfile: unknown, advisory: unknown = { snapshotId: "missing", checkedAt: "2026-09-11T00:00:00Z", advisories: [] }) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "depcheck-product-"));
  await fs.mkdir(path.join(root, "src")); await fs.mkdir(path.join(root, "advisories"));
  await fs.writeFile(path.join(root, "src/index.js"), "export const value = 1;");
  await fs.writeFile(path.join(root, "package-lock.json"), typeof lockfile === "string" ? lockfile : JSON.stringify(lockfile));
  await fs.writeFile(path.join(root, "advisories/snapshot.json"), JSON.stringify(advisory));
  return root;
}

const request = (projectRoot: string) => ({ projectRoot, lockfile: "package-lock.json", entryPoints: ["src/index.js"], policyVersion: "v1", catalogVersion: "v1", limitsProfile: "v1" });

test("malformed and unsupported lockfiles fail visibly", async () => {
  const malformed = await fixture("{");
  await assert.rejects(new ScanController().startScan(request(malformed)), (error: unknown) => error instanceof ScanError && error.code === "INVALID_JSON");
  const unsupported = await fixture({ lockfileVersion: 1, packages: { "": {} } });
  await assert.rejects(new ScanController().startScan(request(unsupported)), (error: unknown) => error instanceof ScanError && error.code === "UNSUPPORTED_LOCKFILE_VERSION");
});

test("missing advisory data yields an explicit empty dated snapshot", async () => {
  const root = await fixture({ lockfileVersion: 3, packages: { "": {}, "node_modules/a": { version: "1.0.0" } } });
  const controller = new ScanController(); const id = await controller.startScan(request(root)); const report = controller.getScanReport(id);
  assert.equal(report.advisorySnapshot.id, "missing"); assert.equal(report.advisorySnapshot.advisoryCount, 0); assert.equal(report.findings.length, 0);
});

test("entry-point traversal and symlink escape are rejected", async () => {
  const root = await fixture({ lockfileVersion: 3, packages: { "": {} } });
  await assert.rejects(new ScanController().startScan({ ...request(root), entryPoints: ["../../outside.js"] }), BoundaryError);
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), "depcheck-outside-")); await fs.writeFile(path.join(outside, "source.js"), "export default 1");
  await fs.symlink(path.join(outside, "source.js"), path.join(root, "src/link.js"));
  await assert.rejects(new ScanController().startScan({ ...request(root), entryPoints: ["src/link.js"] }), BoundaryError);
});

test("cyclic dependency graph terminates and preserves edges", async () => {
  const root = await fixture({ lockfileVersion: 3, packages: { "": { dependencies: { a: "1.0.0" } }, "node_modules/a": { version: "1.0.0", dependencies: { b: "1.0.0" } }, "node_modules/b": { version: "1.0.0", dependencies: { a: "1.0.0" } } } });
  const controller = new ScanController(); const id = await controller.startScan(request(root));
  assert.equal(controller.getScanReport(id).inventory.data?.edges.length, 2);
});
