# Validation Manifest v2

This file records the reproducible hackathon demonstration boundary. Detailed
command output, fixture coverage, security checks and manual browser results are
in [FINAL_VALIDATION.md](FINAL_VALIDATION.md).

## Validated demonstration

- `ScanController` reads the included fixture's npm lockfile, JavaScript entry
  point and bundled advisory snapshot through bounded path and file checks.
- The real fixture result contains 6 distinct package instances, including two
  installed versions of `duplicate-dep`, and 3 snapshot-backed findings.
- The findings demonstrate `potential_path_found`,
  `no_path_found_in_scope`, and `unknown`. `invocation_observed` remains a valid
  contract state but requires an isolated test worker and is not emitted by this
  static demonstration.
- Seven candidate records demonstrate accepted, rejected and uncertain
  decisions for advisory applicability. Compatibility remains explicitly
  `untested`; no candidate is described as a verified safe upgrade.
- The browser renders all five pages from the current report and exports the
  versioned JSON record through both download controls.

## Reproduced test result

On 2026-09-11, `npm test` completed with **111 passed, 0 failed, 0 skipped, and
0 todo**. `npm run typecheck` and `npm run build` also completed successfully.
These results cover this repository and its team-owned fixtures only.

## Evidence boundary

The advisory file is `demo-fixture/advisories/snapshot.json`, snapshot ID
`mujhackx-demo-osv-2026-09-11`. Its records are synthetic. It validates the
algorithm and demo journey; it does not establish facts about real CVEs. The
prototype makes no malware, exploitability, legal-compliance, universal
accuracy, security-audit or production-readiness claim.
