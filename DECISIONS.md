# Decision log

## Local import and workspace settings — 2026-09-11

User-authorized bounded npm lockfile and optional JavaScript text import.
No target file execution or installation. Imports retain synthetic-snapshot
labelling; missing source remains unknown. A loopback-only, Host-checked API
requires same-origin requests and an ephemeral session token for import.
Authentication settings describe this local boundary; multi-user accounts and
password management remain outside the prototype. Appearance and retention
preferences are browser-local. No new external service is introduced.

## D001 — Select Cybersecurity PS12

Status: accepted. Reason: developer-native inputs, independently checkable evidence and good software-team fit. Condition: reachability and ecosystem limits must remain honest.

## D002 — npm/JavaScript depth first

Status: accepted with disclosure. Reason: a verified subset is stronger than shallow multi-language claims. Risk: organiser may expect multiple ecosystems. Revisit only after core npm gates or explicit organiser clarification.

## D003 — Local CLI plus local report

Status: accepted. Reason: reduces source transfer, authentication and hosted execution risks while keeping a useful interface.

## D004 — Keep dependency and call graphs separate

Status: accepted. Reason: an installation path is not execution-flow evidence.

## D005 — Four reachability states

Status: accepted. Reason: static analysis needs explicit uncertainty. No “safe/unreachable” label is permitted from a bounded negative.

## D006 — Deterministic authoritative engine

Status: accepted. LLM use is optional explanation only. It cannot decide affected versions, reachability, licence policy or remediation verification.

## D007 — Read-only scanning

Status: accepted. Static scanning does not install/build/import/execute target code. Candidate execution is a separate boundary and initially team-fixture only.

## D008 — Evidence-led differentiation

Status: accepted as a hypothesis. Existing tools already scan, analyse reachability and recommend upgrades. Proposed distinction is a reproducible decision record with rejected candidates, uncertainty and stale-evidence invalidation. It must be measured against a baseline.

## D009 — No opaque aggregate score

Status: accepted. Separate evidence dimensions are easier to defend and prevent false precision.

## D010 — No graph database/microservices initially

Status: accepted. In-memory typed graphs plus SQLite/report JSON are adequate and reduce delivery risk.

## D011 — Licence not selected yet

Status: open. Do not publish the repository under a licence until both teammates agree and third-party obligations are reviewed.

## Adding a decision

Record date, status, context, choice, alternatives, consequences and conditions for reversal. Do not rewrite accepted history; append a superseding decision.
