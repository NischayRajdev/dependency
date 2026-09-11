import type { EvidenceRef } from "../contracts/evidence";

export interface DependencyChange {
  directPackageInstanceId: string;
  requestedVersion: string;
}

export type TestState = "untested" | "passed" | "failed" | "inconclusive" | "timed_out";

/** True requires baseline and candidate checks passing for exact fingerprints. */
export interface RemediationCandidate {
  id: string;
  requestedChanges: DependencyChange[];
  resolvedGraphDigest?: string;
  fixedFindingIds: string[];
  remainingFindingIds: string[];
  newFindingIds: string[];
  testState: TestState;
  testEvidence: EvidenceRef[];
  verifiedUnderSpecifiedChecks: boolean;
}

export interface CandidateComparison {
  scanId: string;
  baselineGraphDigest: string;
  baselineTestEvidence: EvidenceRef[];
  objective: string;
  candidateLimit: number;
  candidates: RemediationCandidate[];
  evidence: EvidenceRef[];
  uncertainty: string[];
}
