# Feature specification

## F1. Project intake and support summary

Input: authorised local root, lockfile and explicit application entry points.

Output: project fingerprint, detected ecosystem, supported files, skipped files, unsupported constructs, configured limits and data freshness.

Acceptance: no target code executes; escaped paths and unsupported files are visible; changing an input changes the fingerprint and invalidates affected results.

## F2. Dependency inventory

Resolve direct and transitive package instances from the supported lockfile. Retain resolved path, name, version, dependency edges and dev/optional context. Preserve multiple versions of the same package.

Acceptance: independently authored fixtures match exactly; missing or unsupported lockfile data produces an error/unknown state rather than a guessed graph.

## F3. Advisory matching

Query/cache OSV records by npm package and version. Retain advisory IDs, aliases, affected ranges, withdrawal status, source URLs and snapshot timestamps.

Acceptance: affected and fixed version fixtures produce expected results; aliases are deduplicated for presentation without losing evidence or package-instance paths.

## F4. Bounded reachability

Build supported module, binding and call edges from declared entry points. Join a reviewed advisory-function mapping to the exact package instance.

Allowed results:

- Potential path found.
- Invocation observed under a named isolated test.
- No path found within analysed scope.
- Unknown.

Acceptance: every positive path is source-navigable; unsupported patterns never produce a confident negative; dependency paths are never displayed as call paths.

## F5. Outdated dependency and effort evidence

Show current installed version, considered stable versions, release distance, direct/transitive status, dependency-graph churn and likely migration signals. Use `low`, `medium`, `high` or `unknown` with reasons.

Acceptance: no invented hours; prerelease/yanked/deprecated data is handled separately; missing metadata is visible.

## F6. Suspicious-change review

Show timestamped differences such as maintainer-set changes, install-script changes, unusual release jumps and deprecation. These are review signals, not maliciousness verdicts.

Acceptance: a single current snapshot cannot claim historical change; every signal links to before/after evidence.

## F7. Licence-policy analysis

Parse SPDX expressions and evaluate only the documented policy subset. Policy is versioned and user-declared. Unsupported or custom licences require review.

Acceptance: `AND`, `OR` and `WITH` are not flattened incorrectly; no global rule silently treats a licence family as always allowed or forbidden.

## F8. Concentration indicators

Show how many installed package instances and package names associate with available maintainer identities, plus inactive/deprecated evidence where available.

Acceptance: coverage is stated; identity/account overlap is not described as common legal ownership; inactivity heuristics are labelled.

## F9. Candidate remediation comparison

Enumerate a bounded set of direct upgrades, resolve each candidate, compare fixed/remaining/new risks, package churn, policy effects and specified test results.

Acceptance: only candidates whose required checks pass may be marked verified under those checks; inconclusive, failed and untested remain distinct. Optimality is claimed only inside the stated candidate set and objective.

## F10. Evidence report

Provide a compact findings list, detail view, support summary, candidate comparison and versioned JSON export. Every conclusion links to structured evidence.

Acceptance: the same inputs produce deterministic ordering and equivalent report content; stale scans are visibly invalidated.

## Optional LLM explanation

The LLM may rewrite structured evidence into simple language. It cannot create, suppress, reclassify or approve findings. Disabling the LLM must leave the full technical report usable.

## Explicit non-features

No universal security score, auto-merge, attack generation, legal certification, guaranteed secure label, silent warning suppression or arbitrary-repository execution.

