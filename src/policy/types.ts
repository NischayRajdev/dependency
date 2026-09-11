import type { EvidenceRef } from "../contracts/evidence";
import type { Applicability } from "../advisories/types";

export type PolicyCategory =
  | "outdated" | "metadata_change" | "install_script" | "licence" | "concentration";

export interface PolicyResult {
  ruleId: string;
  ruleVersion: string;
  category: PolicyCategory;
  packageInstanceIds: string[];
  applicability: Applicability;
  evidence: EvidenceRef[];
  uncertainty: string[];
}

export interface EffortAssessment {
  band: "low" | "medium" | "high" | "unknown";
  reasons: string[];
  evidence: EvidenceRef[];
}

export interface MetadataSnapshot {
  source: string;
  retrievedAt: string;
  contentDigest: string;
  evidence: EvidenceRef[];
}

export interface LicencePolicy {
  version: string;
  projectLicence: string;
  distributionContext: string;
  supportedSpdxIdentifiers: string[];
  supportedSpdxExceptions: string[];
  organisationDecisions: EvidenceRef[];
}

export interface ConcentrationCoverage {
  totalPackageInstances: number;
  instancesWithMaintainerData: number;
  associations: Array<{ identity: string; packageInstanceIds: string[]; packageNames: string[] }>;
  evidence: EvidenceRef[];
  uncertainty: string[];
}

export interface PackageSnapshot {
  id: string;
  name: string;
  version: string;
  licence?: string;
  scripts?: Record<string, string>;
  maintainers?: string[];
  publishedAt?: string;
  latestPublishedAt?: string;
}

export interface SnapshotHistory {
  current: Record<string, PackageSnapshot>;
  previous?: Record<string, PackageSnapshot>;
}

export interface PolicyConfig {
  version: string;
  allowedLicences: string[];
  maxAgeDays?: number;
  concentrationThreshold?: number;
}
