# Validation-first plan

## Purpose

Prove the difficult claims before polishing the application. This plan defines design gates; nothing is marked passed until an implementation and independent expected results exist.

## Gate 0: scope and evidence contract

Deliver:

- Supported/unsupported JavaScript pattern matrix.
- One sample finding and candidate-comparison record.
- First human-reviewed advisory mappings.
- Independent fixture manifest with expected results.
- PS12 requirement-to-feature mapping.

Pass when both teammates can explain the evidence chain:

`package instance → affected version → advisory evidence → bounded reachability → candidate change → specified test result → remaining unknowns`.

## Gate 1: inventory and advisory correctness

Implement only lockfile parsing, package-instance graph and OSV matching.

Stress cases: duplicate versions, aliases, dev/optional packages, missing lockfile data, withdrawn advisory, affected boundary and fixed boundary.

Pass when independently authored fixtures match exactly and missing data does not become zero risk.

## Gate 2: bounded reachability

Implement the declared supported patterns only. Use bindings and resolved modules, not string matching.

Create 24 target cases:

- Eight supported positive paths.
- Eight bounded negative cases.
- Eight deliberately unsupported/unknown cases.

Keep at least eight cases held out from the author implementing traversal.

Pass when every positive path is source-valid, every supported negative is correct for the declared scope and every unsupported case remains unknown. This result validates the fixture set only; it is not a universal accuracy percentage.

## Gate 3: remaining core requirements

Add outdated evidence, snapshot-based suspicious changes, install-script signals, documented licence policy and concentration indicators.

Pass when each category has traceable evidence, explicit data coverage and an unknown state. A maintainer change cannot be inferred from a single snapshot.

## Gate 4: safety boundary

Run static-scan security fixtures: malicious scripts, executable config, symlink escape, huge/deep files, hostile names/HTML, redirect to local address, fake secrets and prompt-injection text.

Pass when no target code executes, access stays inside the root, unsafe network requests fail closed, output renders inert and fixture secrets stay out of logs/exports.

## Gate 5: remediation comparison

Only after Gates 1–4, add a bounded candidate set. Resolve actual candidate graphs in disposable copies. Initial test execution is restricted to team-owned fixtures.

Pass when baseline failures prevent verification, failing/timeout/untested candidates remain distinct, new risks are shown and stale test evidence cannot be reused.

## Gate 6: competitor baseline

Run our report and a pinned OSV-Scanner configuration on the same selected projects and evidence snapshot. Do not hide OSV capabilities.

Evaluate separately:

- Correct affected-instance matching.
- Visibility of unsupported reachability.
- Functional regressions detected in candidate checks.
- Number of unresolved decisions.
- Time for another developer to explain a chosen fix.

Pass when at least one useful workflow improvement is measured without reducing correctness or hiding uncertainty. If not, describe the project as a well-executed integration rather than a new method.

## Gate 7: reproducibility and demo

Freeze inputs and versions. Another teammate performs the demo from a clean checkout without manual data edits.

Pass when the same scan produces equivalent findings/order, changed code invalidates stale evidence, offline fallback data works and every spoken claim corresponds to a recorded measurement.

## Stop or narrow conditions

- If unknown patterns become confident negatives, stop planner work and fix reachability.
- If static analysis executes target code, stop feature work and fix isolation.
- If advisory-function evidence is ambiguous, remove the mapping.
- If mandatory core categories are incomplete, remove optional AI and visual features first.
- If npm depth cannot be demonstrated by the reachability checkpoint, narrow the advertised support matrix rather than fake coverage.
- If organisers require multiple ecosystems, add a clearly labelled basic adapter only after npm core gates; do not claim cross-language reachability.

## Validation record template

For each run record fixture/project commit, tool commit, catalog/policy/snapshot versions, environment, expected result author, actual result, pass/fail/unknown, defect link and reviewer. Never backfill expected results after seeing output without recording the change.

