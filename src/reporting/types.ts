import type { ComponentResult, EvidenceRef } from "../contracts/evidence";
import type { Applicability, AdvisoryRecord } from "../advisories/types";
import type { InventoryResult } from "../inventory/types";
import type { ScanIdentity, SupportSummary } from "../orchestrator/types";
import type { CandidateComparison } from "../planning/types";
import type { PolicyCategory, PolicyResult } from "../policy/types";
import type { ReachabilityResult } from "../reachability/types";

export interface SuggestedAction {
  description: string;
  evidence: EvidenceRef[];
}

export interface Finding {
  id: string;
  scanId: string;
  category: "advisory" | PolicyCategory;
  packageInstanceIds: string[];
  applicability: Applicability;
  reachability?: ReachabilityResult;
  evidence: EvidenceRef[];
  uncertainty: string[];
  suggestedActions: SuggestedAction[];
}

export interface EvidenceReport {
  schemaVersion: string;
  scan: ScanIdentity;
  support: SupportSummary;
  inventory: ComponentResult<InventoryResult>;
  advisories: ComponentResult<AdvisoryRecord[]>;
  reachability: ComponentResult<ReachabilityResult[]>;
  policy: ComponentResult<PolicyResult[]>;
  findings: Finding[];
  comparisons: ComponentResult<CandidateComparison[]>;
  evidence: EvidenceRef[];
  freshness: { status: "current" } | { status: "stale" | "unknown"; reasons: EvidenceRef[] };
}
