import { ScanController } from "./src/orchestration/controller.ts";
import fs from "fs";

async function run() {
  const controller = new ScanController();
  const root = "./demo-fixture";
  const scanId = await controller.startScan({
    projectRoot: root,
    lockfile: "package-lock.json",
    entryPoints: ["src/index.js"],
    policyVersion: "demo-policy-v1",
    catalogVersion: "mujhackx-demo-osv-2026-09-11",
    limitsProfile: "hackathon-v1",
  });
  const report = controller.getScanReport(scanId);
  const finding = report.findings.find(f => f.package.name === "transitive-vuln");
  console.log("finding.downstreamImpact =", JSON.stringify(finding.downstreamImpact, null, 2));
}

run().catch(console.error);
