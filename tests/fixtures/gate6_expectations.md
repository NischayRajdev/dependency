# Gate 6: End-to-End Orchestration Expectations

These test expectations ensure that the orchestrator routes data through the sub-engines (Inventory, Policy, Reachability) correctly and aggregates results into a consistent payload.

## 1. Scan Orchestration

Verify that `startScan` executes the pipeline successfully.

| ID | Input Request | Expected Status | Notes |
|----|---------------|-----------------|-------|
| S1 | valid `projectRoot`, `lockfile` | Returns `scanId` string | Successfully initializes pipeline and generates ID |
| S2 | invalid `projectRoot` | Throws `BoundaryError` | Safety boundary enforces containment |

## 2. Findings Aggregation

Verify `getScanFindings` aggregates results from advisory and policy checks.

| ID | Scan State Mock | Expected Finding Output | Notes |
|----|-----------------|-------------------------|-------|
| A1 | 1 Advisory, 1 Policy finding | Returns array of length 2 | Controller concatenates findings |
| A2 | No findings | Returns empty array `[]` | Clean scan |
