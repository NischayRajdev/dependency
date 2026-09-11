# Report interface specification

The interface supports a developer decision. It is not a decorative security dashboard.

## 1. Start scan

Fields: authorised project path, detected lockfile, declared entry points, policy/catalog versions and configured limits. Show that source stays local and static scanning does not execute the project.

Prevent scan when containment validation fails. Unsupported lockfile or missing entry points must produce a useful explanation.

## 2. Scan summary

Place the support/coverage summary before headline counts:

- Component states: complete, partial, unsupported or failed.
- Files analysed/skipped.
- Unsupported constructs.
- Evidence snapshot time.
- Project/tool/policy/catalog fingerprints.

Then show category counts. Do not use an opaque risk score or green “safe” banner.

## 3. Findings list

Columns: category, exact package instance, applicability, reachability state, evidence freshness and action state. Allow filters without hiding unknown/failed analysis by default.

Use text plus colour; do not rely on red/green alone. Unknown must remain visually prominent.

## 4. Finding detail

Sections:

1. Claim and precise wording.
2. Installed package instance and dependency path.
3. Advisory/version evidence.
4. Reachability path or coverage gap.
5. Exploit preconditions and uncertainty.
6. Candidate actions.
7. Evidence references and timestamps.

Source paths navigate to escaped read-only snippets. Never render raw package/advisory HTML.

## 5. Candidate comparison

Compare fixed, remaining and new findings; direct changes; resolved graph churn; major-version changes; policy effects; and compatibility state. Required states: untested, passed specified tests, failed, inconclusive and timed out.

Show the exact test command identity/environment and baseline status. If no candidate is verified under the specified checks, say so plainly.

## 6. Export

Export canonical JSON and a human-readable report containing scope, limits, fingerprints, timestamps, component failures and evidence links. Export must not leak seeded secrets or inaccessible absolute paths unnecessarily.

## Accessibility

- Keyboard-operable controls and visible focus.
- Semantic headings/tables.
- Sufficient contrast; status not encoded only by colour.
- Expandable technical details with a concise default explanation.
- No auto-playing or unnecessary graph animation.

## Empty and failure states

“No known advisories in the checked snapshot” is distinct from “advisory lookup failed.” “No path found within analysed scope” is distinct from “unknown”. Each state must explain the next useful action.

