import type { EvidenceRef } from "../contracts/evidence";
import type { CoverageGap, SupportedPattern } from "../reachability/types";

export interface ScanRequest {
  projectRoot: string;
  lockfile: string;
  entryPoints: string[];
  policyVersion: string;
  catalogVersion: string;
  limitsProfile: string;
}

export interface ResourceLimits {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
  maxAstNodes: number;
  maxGraphNodes: number;
  maxGraphEdges: number;
  maxTraversalDepth: number;
  maxRecursionDepth: number;
  maxApiResponseBytes: number;
  maxPlannerCandidates: number;
  maxStageDurationMs: number;
  maxScanDurationMs: number;
}

export interface ScanIdentity {
  id: string;
  canonicalRoot: string;
  projectFingerprint: string;
  toolVersion: string;
  configVersion: string;
  policyVersion: string;
  catalogVersion: string;
  startedAt: string;
  completedAt?: string;
  snapshots: EvidenceRef[];
}

export interface SupportSummary {
  patternMatrixVersion: string;
  supportedPatterns: SupportedPattern[];
  supportedFiles: string[];
  skippedFiles: Array<{ path: string; reason: string }>;
  unsupportedPatterns: CoverageGap[];
  limits: ResourceLimits;
  limitsHit: string[];
}
