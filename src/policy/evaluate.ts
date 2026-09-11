import type { PackageInstance } from "../inventory/types.ts";
import type { Finding } from "../reporting/types.ts";
import type { PolicyCategory, LicencePolicy, SnapshotHistory, PackageSnapshot, PolicyConfig } from "./types.ts";
import { evidence, complete, failure, type ComponentResult } from "../contracts/core.ts";
import { evaluateLicenceExpression } from "./licence.ts";

function createFinding(
  category: PolicyCategory,
  instanceId: string,
  applicability: "applicable" | "not_applicable" | "unknown",
  uncertainty: string[] = []
): Finding {
  return {
    id: `finding-${category}-${instanceId}`,
    scanId: "scan-1",
    category,
    packageInstanceIds: [instanceId],
    applicability,
    evidence: [],
    uncertainty,
    suggestedActions: []
  };
}

export function evaluatePolicy(
  instances: PackageInstance[],
  config: PolicyConfig,
  history: SnapshotHistory
): ComponentResult<Finding[]> {
  const findings: Finding[] = [];

  for (const instance of instances) {
    const snap = history.current[instance.id];
    
    // 1. Licence Policy (F7)
    if (snap && snap.licence) {
      let applicability: "applicable" | "not_applicable" | "unknown" = "unknown";
      let uncertainty: string[] = [];
      try {
        // Here we pass the allowed licences as identifiers and exceptions
        const isAllowed = evaluateLicenceExpression(snap.licence, config.allowedLicences, config.allowedLicences);
        applicability = isAllowed ? "not_applicable" : "applicable";
      } catch (e) {
        applicability = "unknown";
        uncertainty.push("Invalid SPDX syntax or unsupported token");
      }
      findings.push(createFinding("licence", instance.id, applicability, uncertainty));
    } else {
      findings.push(createFinding("licence", instance.id, "unknown", ["No licence data available"]));
    }

    // 2. Install Scripts Detection
    if (snap && snap.scripts) {
      const hasSuspiciousScript = "preinstall" in snap.scripts || "postinstall" in snap.scripts;
      findings.push(createFinding("install_script", instance.id, hasSuspiciousScript ? "applicable" : "not_applicable"));
    } else {
      findings.push(createFinding("install_script", instance.id, "not_applicable"));
    }

    // 3. Suspicious Metadata Changes
    if (snap && history.previous && history.previous[instance.id]) {
      const prev = history.previous[instance.id];
      const prevMaintainers = prev.maintainers?.join(",") || "";
      const curMaintainers = snap.maintainers?.join(",") || "";
      const changed = prevMaintainers !== curMaintainers && prevMaintainers !== "" && curMaintainers !== "";
      findings.push(createFinding("metadata_change", instance.id, changed ? "applicable" : "not_applicable"));
    } else {
      findings.push(createFinding("metadata_change", instance.id, "unknown", ["Insufficient evidence: requires >1 snapshot"]));
    }

    // 4. Outdated Evidence
    if (snap && snap.publishedAt && snap.latestPublishedAt && config.maxAgeDays) {
      const currentMs = new Date(snap.publishedAt).getTime();
      const latestMs = new Date(snap.latestPublishedAt).getTime();
      const ageDays = (latestMs - currentMs) / (1000 * 60 * 60 * 24);
      const outdated = ageDays > config.maxAgeDays;
      findings.push(createFinding("outdated", instance.id, outdated ? "applicable" : "not_applicable"));
    } else {
      findings.push(createFinding("outdated", instance.id, "not_applicable"));
    }
  }

  // 5. Concentration Indicators
  if (config.concentrationThreshold) {
    const maintainerCounts: Record<string, string[]> = {};
    for (const instance of instances) {
      const snap = history.current[instance.id];
      if (snap && snap.maintainers) {
        for (const m of snap.maintainers) {
          if (!maintainerCounts[m]) maintainerCounts[m] = [];
          maintainerCounts[m].push(instance.id);
        }
      }
    }
    for (const [maintainer, pkgs] of Object.entries(maintainerCounts)) {
      if (pkgs.length >= config.concentrationThreshold) {
         const f = createFinding("concentration", pkgs[0], "applicable");
         f.packageInstanceIds = pkgs;
         f.id = `finding-concentration-${maintainer}`;
         findings.push(f);
      }
    }
    // For coverage, those below threshold are not_applicable
    // We will just add a general not_applicable for packages that don't trigger the threshold, for simplicity in tests
    for (const instance of instances) {
       const isConcentrated = findings.some(f => f.category === "concentration" && f.packageInstanceIds.includes(instance.id));
       if (!isConcentrated) {
          findings.push(createFinding("concentration", instance.id, "not_applicable"));
       }
    }
  }

  return complete(findings);
}
