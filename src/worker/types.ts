import type { EvidenceRef } from "../contracts/evidence";
import type { TestState } from "../planning/types";

/** Team-owned allowlisted fixtures only; acquisition and execution are separate. */
export interface FixtureExecutionPolicy {
  fixtureId: string;
  ownership: "team_owned";
  allowlistVersion: string;
  timeoutMs: number;
  acquisitionHosts: string[];
  executionNetwork: { mode: "none" } | { mode: "allowlisted_mock"; services: string[] };
}

export interface TestResult {
  id: string;
  subject: { kind: "baseline"; projectDigest: string }
    | { kind: "candidate"; candidateId: string; candidateDigest: string };
  commandId: string;
  environmentDigest: string;
  policy: FixtureExecutionPolicy;
  state: TestState;
  evidence: EvidenceRef[];
}
