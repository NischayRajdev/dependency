# Data and evidence rules

## Evidence hierarchy

1. Exact installed lockfile/source evidence.
2. OSV/upstream security advisory and affected-version information.
3. Upstream affected source, patch and regression test.
4. Timestamped package/registry metadata.
5. Versioned project policy.
6. Tool-derived inference with method and coverage.
7. Optional generated explanation derived from the above.

Lower levels must not overwrite or fabricate higher-level facts.

## Advisory record

Store ecosystem, package, affected/fixed ranges, IDs/aliases, withdrawal status, source URL, retrieved/modified time, content digest and affected package instances. Preserve conflicting sources; do not silently choose one.

## Vulnerable-function catalog

Each mapping requires:

- Package and exact supported version range.
- Advisory aliases.
- Upstream source/patch/test references.
- Public entry symbol and affected internal symbol when applicable.
- Triggering preconditions.
- Mapping method and limitations.
- Mapping version, author and independent reviewer.
- Expected supported/unsupported call patterns.

Reject a mapping when evidence does not support a precise function. Some advisories are configuration, installation or behavioural issues without one vulnerable function; represent that honestly.

An LLM may help locate candidate evidence. It may not be cited as the evidence or write an approved mapping without human review.

## Synthetic versus real fixtures

Synthetic fixtures test parsing, resolution and graph logic. Real advisory fixtures test whether a curated mapping connects to an authentic affected package version. Keep them labelled separately. A synthetic vulnerable function cannot support a real-CVE accuracy claim.

## Metadata snapshots

Suspicious-change rules require at least two timestamped comparable snapshots. Store source, retrieval time and digest. With one snapshot, show current properties but do not claim a change. Maintainer identity coverage must accompany concentration results.

## Licence policy

Policy inputs are explicit and versioned: project licence, distribution context, supported SPDX identifiers/exceptions and organisation decisions. Unsupported/custom terms go to human review. This tool supplies policy automation, not legal advice.

## Test evidence

A test result is valid only for its project/candidate content digest, command identity, environment digest and timeout/network policy. Baseline tests must pass before a candidate passing result is meaningful. Never reuse a test result after relevant input changes.

## Freshness

Every external record shows “checked at”. Refresh failure leaves last-known evidence visibly stale; it must not appear current. Withdrawn or corrected advisories trigger recomputation.

## Privacy

Use public repositories or team-authored fixtures for the demonstration. Do not include secrets or proprietary code. Minimise stored source snippets and redact seeded credentials from diagnostics.

## Initial curation target

Target five real npm advisories with accessible upstream evidence and varied patterns. This is a work target, not completed data. Two people review every accepted mapping.

