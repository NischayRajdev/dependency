# Testing strategy

## Current Gate 1 execution

`node --test tests/gate1.test.ts` runs synthetic in-memory inventory/advisory unit
tests on Node 24.19.0 without third-party runtime dependencies. This suite does
not execute fixture projects, invoke npm installation, or contact OSV. Its
authorship is recorded in `tests/fixtures/MANIFEST.md`; expectations are not
independently authored and cannot certify Gate 1 acceptance yet.

Type checking may use TypeScript 5.9.3 (Apache-2.0) and @types/node 24.10.1 (MIT)
installed in a temporary development-tool directory with lifecycle scripts
disabled. They are checking tools, not runtime scanner dependencies; no scanned
project dependency or configuration is loaded. The exact compiler invocation and
observed result are recorded in the implementation review response.

Implementation references: npm's package-lock.json documentation and the OSV
schema, checked 2026-09-11. The synthetic advisory fixture was corrected to use
separate fixed and last_affected ranges before matcher execution; see the manifest.

## Test layers

### Unit tests

Lockfile parsing, version applicability, alias handling, SPDX expression parsing, path containment, binding resolution, graph traversal, cycle handling, deterministic ordering, fingerprints and stale-state transitions.

### Contract tests

OSV response fixtures, metadata snapshots, local API schemas and report export/import. Network tests use recorded or mock bounded responses; do not depend on live services for every run.

### Integration tests

Synthetic repositories covering complete scan flow. Confirm component failures remain visible and original projects are unchanged.

### Security tests

Repository scripts/config with side effects, path traversal, symlinks, special files, oversized input, AST bombs, malicious package names/snippets, SSRF redirects, prompt injection, fake secrets and local API cross-origin requests.

### Candidate-worker tests

Team-owned fixtures only during the hackathon. Cover passing baseline/candidate, failing baseline, regression, timeout, dependency acquisition failure, digest mismatch and attempted forbidden network/resource use.

### Reproducibility tests

Repeat the same frozen scan, compare canonical JSON and deterministic order. Change source, lockfile, catalog, policy, snapshot and candidate separately; confirm only affected evidence is invalidated.

## Reachability fixture matrix

| Class | Examples | Expected result |
| --- | --- | --- |
| Supported positive | Named import, literal require, simple alias, nested call | Exact source-linked potential path |
| Supported negative | Dead function, shadowed binding, different installed version | No path found in declared scope |
| Unsupported | Computed require, reflection, unmodelled callback, generated code | Unknown with a coverage reason |
| Graph robustness | Cycles, duplicate versions, re-export chain | Terminates and preserves correct instance/path |

At least eight of 24 cases remain held out from the traversal author. Expected results are written before execution.

## Real advisory fixtures

Use only human-reviewed mappings from `DATA_EVIDENCE.md`. Pin affected and fixed package versions. Verify source/patch evidence independently. Do not download or run untrusted exploit code. A call path test does not need weaponised input.

## Planner assertions

- A candidate graph is produced by real supported resolution, not hand-edited nested versions.
- New advisories and policy issues appear.
- A failed, timed-out, untested or inconclusive candidate is not verified.
- Baseline failure makes candidate compatibility comparison inconclusive.
- A changed candidate digest invalidates old tests.
- “Minimum” is used only for the declared candidate set/objective.

## Performance tests

Measure wall time, peak memory, file/node/edge counts and API calls on small, medium and limit-triggering fixtures. Publish measured distributions or individual fixture results, not an invented latency promise. Hitting limits returns partial/unknown visibly.

## Manual review

Another developer must be able to inspect a finding, follow every source edge and explain why a remediation is or is not verified. Run the demo from a clean environment.

## Release gate checklist

- [ ] Supported inventory fixtures exact.
- [ ] Affected/fixed advisory boundaries correct.
- [ ] Positive reachability paths valid.
- [ ] Unsupported cases remain unknown.
- [ ] No target execution in static scan.
- [ ] No path/symlink escape.
- [ ] No seeded secret leakage.
- [ ] Hostile report content renders inert.
- [ ] Core rule evidence and coverage visible.
- [ ] Candidate states and stale evidence correct.
- [ ] Canonical report reproducible.
- [ ] Demo claims backed by recorded runs.
