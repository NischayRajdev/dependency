import { test } from "node:test";
import assert from "node:assert";
import { evaluateCandidate, type MockTestRunner, type TestResultState } from "../src/remediation/planner.ts";
import type { RemediationCandidate } from "../src/planning/types.ts";

function createCandidate(id: string, digest: string = "hash-123"): RemediationCandidate {
  return {
    id,
    requestedChanges: [],
    resolvedGraphDigest: digest,
    fixedFindingIds: [],
    remainingFindingIds: [],
    newFindingIds: [],
    testState: "untested",
    testEvidence: [],
    verifiedUnderSpecifiedChecks: false
  };
}

class SimpleMockRunner implements MockTestRunner {
  baselineResult: TestResultState;
  candidateResult: TestResultState;

  constructor(baselineResult: TestResultState, candidateResult: TestResultState) {
    this.baselineResult = baselineResult;
    this.candidateResult = candidateResult;
  }

  async runBaseline(): Promise<TestResultState> {
    return this.baselineResult;
  }

  async runCandidate(candidate: RemediationCandidate): Promise<TestResultState> {
    return this.candidateResult;
  }
}

test("Gate 5 - E1: Safe fix (baseline passed, candidate passed)", async () => {
  const runner = new SimpleMockRunner("passed", "passed");
  const candidate = createCandidate("E1");
  const result = await evaluateCandidate(candidate, candidate.resolvedGraphDigest, runner);
  
  assert.strictEqual(result.testState, "passed");
  assert.strictEqual(result.verifiedUnderSpecifiedChecks, true);
});

test("Gate 5 - E2: Baseline broken, cannot verify", async () => {
  const runner = new SimpleMockRunner("failed", "passed");
  const candidate = createCandidate("E2");
  const result = await evaluateCandidate(candidate, candidate.resolvedGraphDigest, runner);
  
  assert.strictEqual(result.testState, "inconclusive");
  assert.strictEqual(result.verifiedUnderSpecifiedChecks, false);
});

test("Gate 5 - E3: Candidate introduced regression", async () => {
  const runner = new SimpleMockRunner("passed", "failed");
  const candidate = createCandidate("E3");
  const result = await evaluateCandidate(candidate, candidate.resolvedGraphDigest, runner);
  
  assert.strictEqual(result.testState, "failed");
  assert.strictEqual(result.verifiedUnderSpecifiedChecks, false);
});

test("Gate 5 - E4: Test suite hung on candidate", async () => {
  const runner = new SimpleMockRunner("passed", "timed_out");
  const candidate = createCandidate("E4");
  const result = await evaluateCandidate(candidate, candidate.resolvedGraphDigest, runner);
  
  assert.strictEqual(result.testState, "timed_out");
  assert.strictEqual(result.verifiedUnderSpecifiedChecks, false);
});

test("Gate 5 - H1: Valid evidence hash", async () => {
  const runner = new SimpleMockRunner("passed", "passed");
  const candidate = createCandidate("H1", "hash-abc");
  const result = await evaluateCandidate(candidate, "hash-abc", runner);
  
  assert.strictEqual(result.testState, "passed");
});

test("Gate 5 - H2: Stale evidence hash (reject)", async () => {
  const runner = new SimpleMockRunner("passed", "passed");
  const candidate = createCandidate("H2", "hash-abc");
  const result = await evaluateCandidate(candidate, "hash-xyz", runner);
  
  assert.strictEqual(result.testState, "untested");
  assert.strictEqual(result.verifiedUnderSpecifiedChecks, false);
});
