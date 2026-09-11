import { test } from "node:test";
import assert from "node:assert";
import { evaluatePolicy } from "../src/policy/evaluate.ts";
import type { PolicyConfig, SnapshotHistory } from "../src/policy/types.ts";
import type { PackageInstance } from "../src/inventory/types.ts";

function getFindings(category: string, instanceId: string, result: any) {
  return result.data.filter((f: any) => f.category === category && f.packageInstanceIds.includes(instanceId));
}

test("Gate 3 - L1: Exact match", () => {
  const instances: PackageInstance[] = [{ id: "pkgL1", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: ["MIT"] };
  const history: SnapshotHistory = { current: { "pkgL1": { id: "pkgL1", name: "pkg", version: "1", licence: "MIT" } } };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("licence", "pkgL1", result)[0];
  assert.strictEqual(finding.applicability, "not_applicable");
});

test("Gate 3 - L2: OR condition", () => {
  const instances: PackageInstance[] = [{ id: "pkgL2", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: ["Apache-2.0"] };
  const history: SnapshotHistory = { current: { "pkgL2": { id: "pkgL2", name: "pkg", version: "1", licence: "MIT OR Apache-2.0" } } };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("licence", "pkgL2", result)[0];
  assert.strictEqual(finding.applicability, "not_applicable");
});

test("Gate 3 - L3: AND condition (failing)", () => {
  const instances: PackageInstance[] = [{ id: "pkgL3", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: ["Apache-2.0"] };
  const history: SnapshotHistory = { current: { "pkgL3": { id: "pkgL3", name: "pkg", version: "1", licence: "MIT AND Apache-2.0" } } };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("licence", "pkgL3", result)[0];
  assert.strictEqual(finding.applicability, "applicable");
});

test("Gate 3 - L4: Complex nested expression", () => {
  const instances: PackageInstance[] = [{ id: "pkgL4", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: ["MIT", "ISC"] };
  const history: SnapshotHistory = { current: { "pkgL4": { id: "pkgL4", name: "pkg", version: "1", licence: "MIT AND (Apache-2.0 OR ISC)" } } };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("licence", "pkgL4", result)[0];
  assert.strictEqual(finding.applicability, "not_applicable");
});

test("Gate 3 - L5: WITH exception", () => {
  const instances: PackageInstance[] = [{ id: "pkgL5", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: ["GPL-2.0-only", "Classpath-exception-2.0"] };
  const history: SnapshotHistory = { current: { "pkgL5": { id: "pkgL5", name: "pkg", version: "1", licence: "GPL-2.0-only WITH Classpath-exception-2.0" } } };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("licence", "pkgL5", result)[0];
  assert.strictEqual(finding.applicability, "not_applicable");
});

test("Gate 3 - L6: Unsupported custom license", () => {
  const instances: PackageInstance[] = [{ id: "pkgL6", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: ["MIT"] };
  const history: SnapshotHistory = { current: { "pkgL6": { id: "pkgL6", name: "pkg", version: "1", licence: "Custom-License" } } };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("licence", "pkgL6", result)[0];
  assert.strictEqual(finding.applicability, "applicable");
});

test("Gate 3 - L8: Invalid syntax", () => {
  const instances: PackageInstance[] = [{ id: "pkgL8", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: ["MIT"] };
  const history: SnapshotHistory = { current: { "pkgL8": { id: "pkgL8", name: "pkg", version: "1", licence: "(MIT" } } };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("licence", "pkgL8", result)[0];
  assert.strictEqual(finding.applicability, "unknown");
});

test("Gate 3 - I2: Install script (postinstall)", () => {
  const instances: PackageInstance[] = [{ id: "pkgI2", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: [] };
  const history: SnapshotHistory = { current: { "pkgI2": { id: "pkgI2", name: "pkg", version: "1", scripts: { "postinstall": "node script.js" } } } };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("install_script", "pkgI2", result)[0];
  assert.strictEqual(finding.applicability, "applicable");
});

test("Gate 3 - I4: No install script", () => {
  const instances: PackageInstance[] = [{ id: "pkgI4", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: [] };
  const history: SnapshotHistory = { current: { "pkgI4": { id: "pkgI4", name: "pkg", version: "1", scripts: {} } } };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("install_script", "pkgI4", result)[0];
  assert.strictEqual(finding.applicability, "not_applicable");
});

test("Gate 3 - M1: Single snapshot maintainer", () => {
  const instances: PackageInstance[] = [{ id: "pkgM1", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: [] };
  const history: SnapshotHistory = { current: { "pkgM1": { id: "pkgM1", name: "pkg", version: "1", maintainers: ["alice"] } } };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("metadata_change", "pkgM1", result)[0];
  assert.strictEqual(finding.applicability, "unknown");
});

test("Gate 3 - M2: Changed maintainer across snapshots", () => {
  const instances: PackageInstance[] = [{ id: "pkgM2", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: [] };
  const history: SnapshotHistory = { 
    current: { "pkgM2": { id: "pkgM2", name: "pkg", version: "1", maintainers: ["bob"] } },
    previous: { "pkgM2": { id: "pkgM2", name: "pkg", version: "1", maintainers: ["alice"] } }
  };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("metadata_change", "pkgM2", result)[0];
  assert.strictEqual(finding.applicability, "applicable");
});

test("Gate 3 - C1: Concentration Indicators", () => {
  const instances: PackageInstance[] = [
    { id: "pkgC1_A", name: "pkgA", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] },
    { id: "pkgC1_B", name: "pkgB", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }
  ];
  const config: PolicyConfig = { version: "v1", allowedLicences: [], concentrationThreshold: 2 };
  const history: SnapshotHistory = { 
    current: { 
      "pkgC1_A": { id: "pkgC1_A", name: "pkgA", version: "1", maintainers: ["alice"] },
      "pkgC1_B": { id: "pkgC1_B", name: "pkgB", version: "1", maintainers: ["alice"] }
    } 
  };
  
  const result = evaluatePolicy(instances, config, history);
  const findingA = getFindings("concentration", "pkgC1_A", result)[0];
  const findingB = getFindings("concentration", "pkgC1_B", result)[0];
  assert.strictEqual(findingA.applicability, "applicable");
  assert.strictEqual(findingB.applicability, "applicable");
});

test("Gate 3 - O2: Outdated Evidence", () => {
  const instances: PackageInstance[] = [{ id: "pkgO2", name: "pkg", version: "1", ecosystem: "npm", resolvedPath: "", direct: true, contexts: ["runtime"], dependencies: [], evidence: [] }];
  const config: PolicyConfig = { version: "v1", allowedLicences: [], maxAgeDays: 365 };
  
  const currentMs = new Date().getTime();
  const latestMs = currentMs + (400 * 24 * 60 * 60 * 1000); // 400 days later

  const history: SnapshotHistory = { 
    current: { 
      "pkgO2": { 
        id: "pkgO2", name: "pkg", version: "1.0.0", 
        publishedAt: new Date(currentMs).toISOString(), 
        latestPublishedAt: new Date(latestMs).toISOString() 
      } 
    } 
  };
  
  const result = evaluatePolicy(instances, config, history);
  const finding = getFindings("outdated", "pkgO2", result)[0];
  assert.strictEqual(finding.applicability, "applicable");
});
