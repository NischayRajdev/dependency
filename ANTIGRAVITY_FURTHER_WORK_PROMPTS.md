# Dependency Review: corrected Antigravity workflow

## Immediate verdict from the screenshots

Do **not** deploy or package the project as a finished application.

The screenshots show Antigravity reporting:

- `audit_status: PASS`
- `reachability_compliance: true`
- `Fixtures Passed: 44/44`
- `Ready for Deployment: YES`

Those conclusions are not supported by the visible evidence. The supplied `REVIEW_PROMPT.md` states that Gate 2 reachability, Gates 3–7, filesystem intake, orchestration, live advisory access, policy engines, full report, planner, worker, persistence, API and UI are unimplemented. Passing 44 synthetic Gate 1 tests can establish only that those tests passed. It cannot establish product readiness, reachability correctness, security audit completion or deployment readiness.

Antigravity also auto-edited `IMPLEMENTATION_REVIEW.md` even though the requested independent review was supposed to avoid fixes unless separately authorised. Fixing documentation links is harmless in isolation, but it invalidates the claim that the run was a read-only independent review. “Zero critical flags” after exploring only a few files is not a repository-wide security conclusion.

Use the prompts below in order. Start a fresh Antigravity conversation for every review gate so prior implementation context does not bias the reviewer. Do not paste all prompts at once.

## Global rules for every prompt

Paste this block at the beginning of each Antigravity task:

```text
Repository: /Users/uday/Downloads/dependency-review-docs

Read AGENTS.md first and follow it as the repository-wide authority. Read the
documents named by this task before acting.

Do not trust summaries of completed work. Inspect the actual source, tests,
git diff/status and recorded evidence. Do not call a gate passed because tests
exist or because one generated test suite passes.

Static analysis must never execute, import, build, install or mutate a scanned
fixture project. You may run this repository's own unit tests and type checker.
Do not run fixture lifecycle scripts or application code unless this task
explicitly authorises the isolated team-fixture worker.

Never claim safe, unreachable, not exploitable, malware-free, legally
compliant, universally accurate, guaranteed compatible, security audited,
production ready or deployment ready.

Work only on the named gate. Do not add UI, planner, LLM, second ecosystem or
deployment work early. Preserve the four exact reachability states from
AGENTS.md. Stop if a prerequisite gate is not supported by evidence.
```

## Step 0 — correct the invalid review record

Run this first. This authorises documentation correction only.

```text
[Paste Global Rules]

Task: Correct the inaccurate review/deployment status created by the previous
Antigravity run. Read REVIEW_PROMPT.md, IMPLEMENTATION_REVIEW.md,
PLAN_VALIDATE.md, TESTING.md and SECURITY.md.

Do not change application source or tests. Update documentation only where the
repository currently claims or implies:
- Gate 1 is independently approved;
- reachability is implemented or validated;
- the security audit is complete;
- the product is ready for deployment;
- passing 44 synthetic tests proves more than those cases.

Record the honest state:
- Gate 1 implementation exists but independent acceptance is pending;
- Gate 2 through Gate 7 are not passed;
- the 44 expected results were authored by Codex and are not independent;
- the current security evidence is limited to implemented in-memory logic;
- the project is not ready for packaging or deployment.

Do not delete historical evidence. Add a dated correction explaining why the
previous PASS/Ready for Deployment result was invalid.

Output:
1. Files changed and exact claims corrected.
2. Git diff summary.
3. Current gate table, each marked PASSED, FAILED, or PENDING.
4. End with REVIEW_STATUS_CORRECTED.
```

Expected result: Gate 0 may be documented as complete only if it really exists. Gate 1 is `PENDING INDEPENDENT REVIEW`. Gates 2–7 and deployment readiness are pending.

## Step 1 — perform the real Gate 1 review

Use a fresh conversation. This is read-only.

```text
[Paste Global Rules]

Task: Independently review Gate 1 only. Do not modify any file.

Read REVIEW_PROMPT.md, SCOPE.md, ARCHITECTURE.md, SECURITY.md,
PLAN_VALIDATE.md, DATA_EVIDENCE.md, API_CONTRACTS.md, TESTING.md,
IMPLEMENTATION_REVIEW.md, tests/fixtures/MANIFEST.md and
tests/VALIDATION.md. Inspect every Gate 1 source and test file.

Verify:
1. package-lock v2/v3 package-instance identity and direct/transitive edges;
2. duplicate names/versions at distinct paths;
3. nested/hoisted resolution, scoped packages, aliases and cycles;
4. dev/optional context and visible unsupported peer/link/workspace/spec cases;
5. malformed input and resource-limit behaviour;
6. exact OSV version applicability, aliases, withdrawal and unknown states;
7. SemVer prereleases/build metadata, introduced "0", fixed exclusivity,
   last_affected inclusivity, repeated intervals, explicit versions, disjoint
   ranges, malformed/unsorted events and unsupported range types;
8. deterministic output, evidence digests and sanitised diagnostics;
9. recorded test commands and fingerprints.

Run repository unit tests and type checking using the documented commands.
Do not execute fixture projects. Treat Codex-authored expected results as
untrusted hypotheses. Derive expected results independently from official npm,
SemVer and OSV semantics. Clearly mark anything that still needs a human
teammate.

Output exactly:
- Decision: APPROVED / APPROVED WITH REQUIRED FOLLOW-UPS / REJECTED
- Findings ordered critical, high, medium, low, each with file:line, trigger,
  actual behaviour, required behaviour, reasoning and correction
- Gate 1 checklist with PASS/FAIL/PENDING
- Tests independently checked and missing tests
- Security scope actually established
- Claim audit
- Smallest next action

End with AWAIT_IMPLEMENTATION_RESPONSE if any correction or independent human
evidence remains. Use GATE_1_REVIEW_COMPLETE only if every Gate 1 requirement
is supported.
```

Human task: one teammate must independently check a sample of package graphs and real advisory affected/fixed boundaries. Another model is a useful reviewer, but it is not the required human review of vulnerable-function mappings.

## Step 2 — repair Gate 1 only

Run only if Step 1 reports findings.

```text
[Paste Global Rules]

Task: Implement only the required Gate 1 corrections from the latest independent
review. Do not begin reachability, policy engines, UI, planner or deployment.

For each accepted finding:
- add a failing regression test first;
- implement the smallest correction;
- preserve unsupported/unknown behaviour;
- update validation fingerprints and documentation truthfully.

Do not rewrite tests to match current output unless official semantics prove the
new expectation. If a finding is disputed, document the authoritative source
and leave it unresolved for review.

Run unit tests and type checking. Output changed files, tests added, commands,
results, remaining Gate 1 items and a review handoff. End with
AWAIT_GATE_1_REREVIEW.
```

Then repeat Step 1 in another fresh conversation. Do not move ahead until the rereview has no code defect and the human checks are recorded.

## Step 3 — design Gate 2 fixtures before implementation

This step creates expected behaviour, not the analyser.

```text
[Paste Global Rules]

Prerequisite: Gate 1 has a recorded acceptance decision and human checks.
If not, stop and report the missing evidence.

Task: Prepare Gate 2 bounded-reachability fixtures and specification only. Do
not implement traversal logic.

Create exactly 24 cases:
- 8 supported positive paths;
- 8 supported negative paths;
- 8 unsupported cases that must return unknown.

Supported initial patterns: direct named/default imports, literal require,
local functions, simple lexical aliases, direct calls and cycles.

Unsupported cases must cover computed require, dynamic import, reflection,
dependency injection, unmodelled framework callbacks, monkey patching, native
addons, generated code, bundler transforms or TypeScript semantics. Select at
least eight distinct cases.

Every case must define entry points, exact package instance, source locations,
expected state, expected path or gap, assumptions and author. Keep at least
eight expectations for the teammate/reviewer to author independently; mark
them PENDING and do not fabricate them.

Keep dependency paths and call paths separate. Do not use a real advisory until
its function mapping has human-reviewed upstream evidence.

Output files created, complete case table, eight held-out assignments and no
implementation claim. End with AWAIT_HELD_OUT_EXPECTATIONS.
```

Human task: the teammate authors the eight pending expectations without looking at future analyser output. Both teammates review each real advisory-to-function mapping using upstream source/patch/test evidence.

## Step 4 — implement Gate 2 bounded reachability

```text
[Paste Global Rules]

Prerequisites: Gate 1 accepted; all 24 Gate 2 expectations frozen; at least
eight expectations independently authored; real mappings human reviewed.
Stop if any prerequisite is missing.

Task: Implement the minimum bounded JavaScript reachability analyser matching
the frozen support matrix. Parse without loading target Babel/ESLint/TypeScript/
bundler configuration. Resolve supported modules and lexical bindings; do not
use function-name string matching. Preserve exact package instances, source
locations, cycles, limits and coverage gaps.

Implement only:
- potential_path_found;
- invocation_observed only as a schema/state unless a separately authorised
  isolated observation exists;
- no_path_found_in_scope;
- unknown.

Unsupported behaviour must never produce no_path_found_in_scope. A dependency
tree path must never be displayed as a call path.

Run training and held-out fixtures without changing frozen expected answers.
Report every deviation. Do not add planner/UI work.

Output changed files, algorithm limits, case-by-case results, commands,
security implications and review handoff. End with AWAIT_GATE_2_REVIEW.
```

Then run a fresh read-only review analogous to Step 1, focused on every positive edge and every unsupported case. Gate 2 fails if even one unsupported case becomes a confident negative.

## Step 5 — implement Gate 3 policy evidence

```text
[Paste Global Rules]

Prerequisite: Gates 1 and 2 accepted. Stop otherwise.

Task: Implement Gate 3 only:
1. outdated-version evidence and reasoned low/medium/high/unknown effort bands;
2. timestamped before/after maintainer/install-script/version metadata signals;
3. the documented SPDX subset preserving AND, OR and WITH;
4. concentration indicators with maintainer identity coverage and uncertainty.

Do not label a package malicious, abandoned or legally incompatible without the
declared evidence/policy. One metadata snapshot cannot show change. Do not
invent upgrade hours. Unsupported/custom licences require review.

Add normal, failure, malformed, missing-data and unsupported fixtures for every
rule. Run tests/type checking and produce an independent review handoff. Do not
add UI or planner. End with AWAIT_GATE_3_REVIEW.
```

Fresh review gate: verify missing data never becomes healthy, `AND/OR/WITH` semantics remain intact, identity coverage is visible and no legal/maliciousness claims appear.

## Step 6 — assemble the non-executing product core

```text
[Paste Global Rules]

Prerequisite: Gates 1–3 accepted. Stop otherwise.

Task: Implement the non-executing core integration only:
- secure local filesystem project intake;
- project/config/catalog/policy fingerprints;
- scan orchestrator with complete/partial/unsupported/failed component states;
- finding builder joining evidence without collapsing claims;
- immutable canonical JSON report/export and local persistence;
- constrained OSV client/cache with freshness and offline snapshot fallback.

Do not implement candidate execution, UI polish or deployment. Never execute
target code/config/scripts. Apply canonical root containment and global resource
limits. A failed component must remain visible and cannot become zero findings.

Add end-to-end synthetic integration fixtures and stale-evidence tests. Output
architecture changes, schemas, commands, results and Gate 4 security handoff.
End with AWAIT_GATE_4_SECURITY_REVIEW.
```

## Step 7 — complete Gate 4 security boundary

```text
[Paste Global Rules]

Task: Perform and fix Gate 4 only against the integrated static scanner. Read
SECURITY.md. Add tests before fixes.

Required cases: target lifecycle scripts/config with side effects; path
traversal; symlink escape; special files; oversized/deep input; parser timeout;
hostile package names/source HTML; redirect to loopback/private/link-local;
redirect-chain abuse; response limits; fake secrets; prompt injection; stale
evidence; cancellation; original-project mutation.

Static scan must produce no target execution. Constrain outbound hosts and
revalidate every redirect. Escape report fields. Redact secrets from logs and
diagnostics. Preserve partial/unknown status on limit/failure.

Do not claim a complete security audit or deployment readiness. Output findings,
tests, fixes, residual risks and the exact security scope established. End with
AWAIT_GATE_4_INDEPENDENT_REVIEW.
```

Fresh review gate: inspect security-sensitive code and run the security suite. `PASS` means Gate 4's documented cases passed, not that the product is secure.

## Step 8 — build the local API and usable report

```text
[Paste Global Rules]

Prerequisite: Gates 1–4 accepted. Stop otherwise.

Task: Implement the minimum local CLI/API/report described in UI_SPEC.md and
API_CONTRACTS.md. Bind to loopback. Apply session token, origin checks,
restrictive CORS/CSP and escaped rendering.

Screens: project/support summary, findings list, evidence detail, dependency
path, source call path or coverage gap, policy evidence, stale status and JSON
export. Do not show an opaque score or safe banner. Unknown and failed analysis
must be visible by default.

No arbitrary repository execution, remote accounts, auto-fix, auto-push or LLM
requirement. Add accessibility, API-security and hostile-rendering tests.
Output run instructions and measured tests. End with AWAIT_PRODUCT_CORE_REVIEW.
```

## Step 9 — implement Gate 5 remediation comparison

```text
[Paste Global Rules]

Prerequisite: product core and Gates 1–4 accepted. Stop otherwise.

Task: Implement a bounded remediation candidate comparison. Generate direct
upgrade candidates, resolve actual resulting graphs in disposable copies and
show fixed, remaining and new findings plus graph churn.

Do not mutate the original project. Separate dependency acquisition from test
execution. During the hackathon, execute only allowlisted team-owned fixtures in
a separate non-root worker with no credentials, host socket or broad mounts and
with filesystem/network/time/resource limits.

Candidate states remain untested, passed, failed, inconclusive or timed_out.
A failing baseline makes compatibility inconclusive. Any candidate/project/
environment/command change invalidates prior test evidence. Claim minimum only
inside the enumerated candidate set and stated objective.

Add regression, timeout, acquisition failure, new-risk, digest mismatch and
forbidden-network/resource cases. End with AWAIT_GATE_5_REVIEW.
```

## Step 10 — run Gate 6 competitor baseline

```text
[Paste Global Rules]

Prerequisite: Gates 1–5 and product-core review accepted. Stop otherwise.

Task: Pin OSV-Scanner version/configuration and compare it with our tool on the
same authorised projects, advisory snapshot and entry-point declarations. Do
not hide or disable competitor capabilities.

Measure separately:
- exact affected-instance matching;
- unsupported-reachability visibility;
- candidate regressions found;
- unresolved decisions;
- time for another developer to explain one chosen fix;
- runtime/resource observations.

Publish inputs, versions, denominators, raw outcomes, errors and limitations.
Do not invent one overall accuracy score. If no material improvement is shown,
describe the product as an evidence-oriented integration, not a novel method.
End with AWAIT_GATE_6_REVIEW.
```

## Step 11 — run Gate 7 reproducibility and demo freeze

```text
[Paste Global Rules]

Prerequisite: Gates 1–6 accepted. Stop otherwise.

Task: Complete Gate 7 without adding features. Freeze tool, fixture, catalog,
policy and snapshot versions. From a clean checkout, have the other teammate
run the documented setup, tests and demo.

Verify deterministic findings/order, evidence fingerprints, stale invalidation,
offline fallback, original-project immutability, demo timing and correspondence
between every spoken claim and recorded evidence.

Prepare the DEMO.md story: real affected-version evidence, supported potential
path, duplicate package instance, explicit unknown unsupported case, policy
signal, rejected candidate and a candidate that passed only the named checks.

Output final gate table, commands, measurements, known limitations, demo backup
and exact remaining blockers. Mark HACKATHON_DEMO_READY only if every prerequisite
is evidenced. Never mark production/deployment ready. End with
GATE_7_REVIEW_COMPLETE or AWAIT_CORRECTIONS.
```

## What you should do now

Run Step 0. Then use a fresh Antigravity conversation for Step 1. Send the resulting review report back for inspection before authorising any fixes or Gate 2 work.

Do not run the ZIP command shown in the screenshot as a “deployment package”. A ZIP is only an archive, not deployment readiness. Keep the repository under Git, commit the corrected review state, and tag gates only after their independent acceptance records exist.

