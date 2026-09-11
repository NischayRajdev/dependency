# Judge demo plan

## Goal

Show one reproducible dependency decision, including uncertainty and a rejected remediation. The demo should prove behaviour, not only display a prepared dashboard.

## Fixture story

Prepare a small team-owned npm service containing:

- One real affected package/version with a reviewed mapping and supported call path.
- One duplicated dependency version so only the correct instance is implicated.
- One deliberately unsupported dynamic/callback pattern that must remain unknown.
- One install-script or metadata review signal.
- One declared licence-policy case.
- Two remediation candidates: one fixes the selected issue but fails a genuine behaviour test; one meets the specified checks.

Do not add a contrived “CVE” and present it as real. Synthetic cases are labelled.

## Eight-minute flow

1. **Problem (45s):** dependency count alone does not tell a developer what to fix.
2. **Support contract (30s):** npm/JavaScript subset and explicit unknowns.
3. **Fresh scan (75s):** show dependency instances and advisory evidence.
4. **Reachability evidence (90s):** navigate entry point → calls → affected package symbol. Show the unsupported case remains unknown.
5. **Risk categories (60s):** outdated, install script, metadata, licence and concentration evidence without an opaque score.
6. **Candidate comparison (90s):** first candidate fixes the advisory but fails a behaviour test; second passes named checks. State residual uncertainty.
7. **Live change (60s):** change entry point or lockfile and rescan. Old evidence becomes stale and the result changes.
8. **Close (30s):** developer receives a source-linked, reproducible decision rather than a vulnerability list.

## Measured claims slide

Show exact fixture counts, expected/actual outcomes, baseline tool/version/configuration, failed cases, runtime on the demo machine and limitations. Do not show a single “accuracy” number without denominator and dataset definition.

## Questions to prepare

**Is this just OSV-Scanner?** OSV is a named baseline and evidence source. Our proposed contribution is the inspectable decision record, bounded uncertainty and candidate comparison. Show the measured difference; do not dismiss OSV.

**Does a call path prove exploitability?** No. It is potential reachability under stated static assumptions. Trigger preconditions remain separate.

**Why only npm?** Depth and validation first. The limitation is disclosed; a second adapter is only added after core gates or if required.

**Can this run malware safely?** Static scanning executes no target code. The hackathon compatibility worker is restricted to team fixtures. Production hostile-code execution needs stronger isolation.

**Are licence results legal advice?** No. They apply a declared policy over a supported SPDX subset and escalate unknown/custom terms.

**What is AI doing?** Optional plain-language explanation only. Authoritative calculations are deterministic and source-linked.

## Failure fallback

Keep a frozen local evidence snapshot and recorded clean run for external API failure. If live candidate execution fails, show it as failed/inconclusive rather than substituting a fake result. If reachability is incomplete, demonstrate the narrower validated support contract.

## Forbidden claims

World-first, universal reachability, zero false positives, malware-free, fully licence-compliant, guaranteed compatible upgrade, secure release or guaranteed selection.

