import type { AdvisoryRecord, Applicability } from "../advisories/types.ts";
import type { ComponentResult, EvidenceRef } from "../contracts/evidence.ts";
import type { InventoryResult } from "../inventory/types.ts";
import type { ReachabilityResult, ReachabilityStatus } from "../reachability/types.ts";
import type { Finding } from "../reporting/types.ts";
import type { FindingSummary } from "../reporting/summarise.ts";

export type CandidateDecision = "accepted" | "rejected" | "uncertain";

export interface CandidateDecisionRecord {
  id: string;
  packageInstanceId: string;
  packageName: string;
  currentVersion: string;
  proposedVersion: string;
  decision: CandidateDecision;
  reason: string;
  advisoryApplicability: Applicability;
  compatibilityTestState: "untested";
  verifiedUnderSpecifiedChecks: false;
  evidence: EvidenceRef[];
  uncertainty: string[];
}

export interface GraphNode {
  id: string;
  name: string;
  level: number;
  isApp?: boolean;
  isCompromised?: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface DownstreamImpact {
  directParents: string[];
  totalPaths: number;
  graph?: { nodes: GraphNode[], edges: GraphEdge[] };
}

export interface AuditFinding extends Finding {
  package: { name: string; version: string; resolvedPath: string; direct: boolean };
  advisory: { id: string; sourceUrl: string; modifiedAt?: string };
  candidates: CandidateDecisionRecord[];
  /** Plain-English summary generated from structured fields. Never authoritative. */
  summary?: FindingSummary;
  /** Blast radius data showing how the app depends on this finding. */
  downstreamImpact?: DownstreamImpact;
}

export interface AuditReport {
  schemaVersion: "fides-audit-v1";
  engine: { name: "FIDES // VERIFY"; version: string };
  scan: {
    id: string;
    project: string;
    projectSnapshotDigest: string;
    lockfileVersion: 2 | 3;
    entryPoints: string[];
    completedAt: string;
  };
  advisorySnapshot: {
    id: string;
    checkedAt: string;
    digest: string;
    source: "bundled_snapshot";
    advisoryCount: number;
  };
  inventory: ComponentResult<InventoryResult>;
  advisories: ComponentResult<AdvisoryRecord[]>;
  reachability: ComponentResult<ReachabilityResult[]>;
  findings: AuditFinding[];
  candidates: CandidateDecisionRecord[];
  support: {
    supportedReachabilityStates: ReachabilityStatus[];
    analysedFiles: number;
    unsupportedConstructs: number;
    limitations: string[];
  };
  evidence: EvidenceRef[];
  uncertainty: string[];
}
