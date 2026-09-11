# Gate 7: Integration Expectations

These test expectations ensure the CLI successfully acts as an entry point, orchestrates the scan, and prints deterministic JSON.

## 1. CLI output determinism

Verify that running the CLI outputs JSON findings sorted deterministically.

| ID | Input Mocks | Expected Output | Notes |
|----|-------------|-----------------|-------|
| C1 | 3 unordered findings (`id-C`, `id-A`, `id-B`) | JSON array ordered `[id-A, id-B, id-C]` | Sorts by finding ID deterministically |
| C2 | Empty findings | `[]` | Handles clean runs |
| C3 | Unsafe path `projectRoot=../../../` | Output error message | Catch boundary exceptions |
