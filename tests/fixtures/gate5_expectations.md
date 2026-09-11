# Gate 5: Remediation Comparison Expectations

These test expectations define the behavior for evaluating candidate remediations safely.

## 1. Candidate evaluation against baselines

Evaluate `RemediationCandidate` objects against mock test outcomes to ensure correct state mapping and protection against regressions.

| ID | Baseline Result | Candidate Result | Expected Test State | `verifiedUnderSpecifiedChecks` | Notes |
|----|-----------------|------------------|---------------------|--------------------------------|-------|
| E1 | `passed` | `passed` | `passed` | `true` | Standard safe fix |
| E2 | `failed` | `passed` | `inconclusive` | `false` | Baseline was broken, cannot verify |
| E3 | `passed` | `failed` | `failed` | `false` | Candidate introduced a regression |
| E4 | `passed` | `timeout` | `timed_out` | `false` | Test suite hung on candidate |

## 2. Preventing stale evidence reuse

Ensure that test evidence bound to one candidate graph hash is not accepted for another.

| ID | Expected Candidate Hash | Evidence Hash | Expected State |
|----|-------------------------|---------------|----------------|
| H1 | `hash-abc` | `hash-abc` | Uses evidence result |
| H2 | `hash-abc` | `hash-xyz` | `untested` (rejects stale) |
