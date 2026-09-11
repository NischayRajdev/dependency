# Initial API and schema contracts

These contracts guide implementation. They may evolve through recorded decisions, but uncertainty and evidence fields are mandatory.

## Implemented Gate 1 functions

The scaffold interfaces remain unchanged. The initial functions accept immutable
JSON text and return the existing component envelopes:

- `analyseLockfile(raw, limits)` returns `ComponentResult<InventoryResult>`.
- `normaliseOsv(raw, retrievedAt, limits)` returns `ComponentResult<AdvisoryRecord[]>`.
- `matchOsv(raw, instance, scanId, retrievedAt, limits)` returns `ComponentResult<Finding>`.

There is no file reader, live advisory client, target-code parser, policy engine,
planner, worker, UI or controller in this slice. Callers must not present the
in-memory functions as an end-to-end scan or a completed security gate.

Inventory uses the v2/v3 `packages` map and resolves declared dependency names
through nested/ancestor installation paths. Root is project metadata, not a
package-instance node; direct flags record root declarations. Lockfile records
do not prove packages exist on disk. This parser does not validate npm version
range satisfiability or platform-specific installation. Missing dependencies,
unsupported peer resolution and non-registry dependency declarations are visible
partial results. Links/workspaces, invalid paths and unsupported versions are
rejected. No inferred node or source call edge is created.

`AdvisoryRecord.affectedRanges` contains JSON-encoded original OSV affected-entry
objects in this implementation, including their package, ranges and versions.
This preserves unsupported data within the scaffold's existing string-array
contract. Consumers must not treat these strings as npm range expressions.
Matching supports exact version lists and ordered SEMVER introduced/fixed or
introduced/last_affected timelines, including prereleases and introduction `0`.
Unsorted timelines, limit events, GIT/ECOSYSTEM ranges and wildcard package names
remain unknown unless a separate explicit supported positive establishes version
applicability; coverage-gap counts remain visible even with that positive result.
The initial timestamp subset is UTC ISO text with seconds and up to three
fractional digits; other timestamp representations fail visibly.
Withdrawn records never establish a match. Mixed ecosystems are
unsupported. Invalid JSON/schema data yields an explicit failed component.

Aliases are deduplicated for display without merging source records. Matching
does not mutate the supplied package or normalized record; affectedInstanceIds
is initially empty until a caller joins matches. Findings carry exact instance
IDs and distinguish applicability from unassessed reachability/preconditions.
Missing package coverage in a supplied snapshot yields unknown, not a clean bill
of health. Snapshot authenticity/freshness must be established by a future client;
source URLs identify the record and are not evidence of a completed fetch.

Limits apply before parsing and during bounded analysis. Diagnostics contain fixed
codes and digests rather than raw input or exceptions. No filesystem, network,
target import, executable configuration or process execution occurs in these
functions. OS-level cancellation, canonical file containment, report escaping,
secret handling for exported identifiers and network controls remain integration
requirements; these functions do not certify them.

## Scan request

```json
{
  "projectRoot": "/authorised/project",
  "lockfile": "package-lock.json",
  "entryPoints": ["src/server.js"],
  "policyVersion": "policy-v1",
  "catalogVersion": "catalog-v1",
  "limitsProfile": "hackathon-v1"
}
```

Paths are server-side local inputs, never accepted from an unauthenticated remote client. Canonical containment is checked before reading.

## Component result envelope

```ts
type Completion = "complete" | "partial" | "unsupported" | "failed";

interface ComponentResult<T> {
  status: Completion;
  data?: T;
  reasons: EvidenceRef[];
  limitsHit: string[];
  diagnostics: SafeDiagnostic[];
}
```

## Reachability

```ts
type ReachabilityStatus =
  | "potential_path_found"
  | "invocation_observed"
  | "no_path_found_in_scope"
  | "unknown";

interface ReachabilityResult {
  status: ReachabilityStatus;
  entryPoints: SourceLocation[];
  paths: CallPath[];
  unsupportedPatterns: CoverageGap[];
  assumptions: string[];
  evidence: EvidenceRef[];
}
```

`no_path_found_in_scope` is not equivalent to `safe` or `unreachable`.

## Package instance

```ts
interface PackageInstance {
  id: string;
  ecosystem: "npm";
  name: string;
  version: string;
  resolvedPath: string;
  direct: boolean;
  contexts: Array<"runtime" | "development" | "optional" | "peer">;
  dependencies: string[];
  evidence: EvidenceRef[];
}
```

The ID must distinguish two installed instances of the same name/version at different resolved paths where their graph context differs.

## Finding

```ts
interface Finding {
  id: string;
  scanId: string;
  category: "advisory" | "outdated" | "metadata_change" | "install_script" | "licence" | "concentration";
  packageInstanceIds: string[];
  applicability: "applicable" | "not_applicable" | "unknown";
  reachability?: ReachabilityResult;
  evidence: EvidenceRef[];
  uncertainty: string[];
  suggestedActions: SuggestedAction[];
}
```

## Candidate and test state

```ts
type TestState = "untested" | "passed" | "failed" | "inconclusive" | "timed_out";

interface RemediationCandidate {
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
```

`verifiedUnderSpecifiedChecks` may be true only if required baseline and candidate checks pass for exact fingerprints.

## Evidence reference

```ts
interface EvidenceRef {
  id: string;
  kind: "source" | "lockfile" | "advisory" | "metadata" | "policy" | "test" | "derived";
  locator: string;
  sourceUrl?: string;
  contentDigest: string;
  observedAt?: string;
  method?: string;
}
```

## Local endpoints

Planned endpoints:

- `POST /api/scans`
- `GET /api/scans/:scanId`
- `GET /api/scans/:scanId/findings`
- `GET /api/findings/:findingId`
- `POST /api/scans/:scanId/candidates`
- `GET /api/candidates/:candidateId`
- `GET /api/scans/:scanId/export`

Mutation endpoints require the local session token and permitted origin. Do not add repository credentials or public remote ingestion to this contract during hackathon scope.
