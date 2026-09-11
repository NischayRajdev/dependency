import type { RemediationCandidate } from "../planning/types.ts";

export type TestResultState = "passed" | "failed" | "timed_out";

export interface MockTestRunner {
  runBaseline(): Promise<TestResultState>;
  runCandidate(candidate: RemediationCandidate): Promise<TestResultState>;
}

/**
 * Evaluates a proposed dependency remediation candidate.
 * It enforces that tests must pass on the baseline before verifying the candidate.
 * Evidence hashes are strictly checked to prevent stale evidence reuse.
 */
export async function evaluateCandidate(
  candidate: RemediationCandidate,
  providedEvidenceHash: string | undefined,
  runner: MockTestRunner
): Promise<RemediationCandidate> {
  const result: RemediationCandidate = {
    ...candidate,
    testState: "untested",
    verifiedUnderSpecifiedChecks: false
  };

  // Prevent stale evidence reuse
  if (providedEvidenceHash && candidate.resolvedGraphDigest && providedEvidenceHash !== candidate.resolvedGraphDigest) {
    return result; // Remains untested
  }

  // Evaluate baseline
  const baselineResult = await runner.runBaseline();
  if (baselineResult !== "passed") {
    result.testState = "inconclusive";
    return result;
  }

  // Evaluate candidate
  const candidateResult = await runner.runCandidate(candidate);
  
  if (candidateResult === "passed") {
    result.testState = "passed";
    result.verifiedUnderSpecifiedChecks = true;
  } else if (candidateResult === "timed_out") {
    result.testState = "timed_out";
  } else {
    result.testState = "failed";
  }

  return result;
}
