# Gate 1 fixture manifest

Classification: synthetic algorithm data, not real advisory evidence.
Expected-result author: Codex. Independent reviewer: pending.
Gate status: not certified passed; independent expected-result review is required.

Pre-execution correction: the draft advisory mixed fixed and last_affected events
in one range, contrary to OSV. It was split into two ranges before matcher
implementation or advisory test execution. Expected version results are unchanged.

The expectations in gate1.ts precede analyser implementation. Tests below extend
those expectations with explicit security and unsupported-case assertions.

| Family | Required expectations |
| --- | --- |
| Inventory | v2/v3 exact six-instance graph; alias uses actual name; nested shared@1 stays distinct from shared@2; dev/optional contexts retained |
| Resolution | Hoisted scoped dependency and cycle terminate; missing required edge is partial; missing optional edge is partial, never an invented instance |
| Unsupported | v1, links/workspaces, unsupported package paths and dependency specs remain visible; no guessed graph |
| Malformed | Invalid JSON, duplicate keys, missing root/packages, invalid versions and metadata fail with fixed diagnostics |
| Advisory | Introduced inclusive, fixed exclusive, last_affected inclusive, prereleases ordered, disjoint ranges retained |
| Unknown | Withdrawn, unsupported range types, missing affected data, unknown package coverage and malformed events never yield a confident negative |
| Evidence | Raw snapshot digest retained; package-specific evidence; missing catalog returns unknown; different input changes evidence IDs |
| Security | No filesystem/network/process use in analysers; hostile strings and fake secrets omitted from diagnostics; path traversal rejected; bytes/depth/nodes/time bounded |
| Determinism | Object-key order changes do not change instance/edge order; raw-byte evidence digests intentionally change |

No Gate 2 traversal fixtures or held-out cases are claimed here. The Gate 0
24-case reachability allocation remains a later gate. No real mapping is created
or approved by these synthetic records.
