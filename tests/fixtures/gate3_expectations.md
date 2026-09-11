# Gate 3: Policy Evaluation Expectations

These fixtures define the expected behavior of the policy evaluation engine.
All test scenarios are deterministic and frozen to ensure validation without external dependencies.

## 1. Licence Parsing (F7)

Evaluate SPDX expressions against `allowedLicences`.

| ID | SPDX Expression | Allowed Licences | Expected Status | Notes |
|----|-----------------|------------------|-----------------|-------|
| L1 | `MIT` | `["MIT"]` | applicable (no finding) | Exact match |
| L2 | `MIT OR Apache-2.0` | `["Apache-2.0"]` | applicable (no finding) | OR: one must match |
| L3 | `MIT AND Apache-2.0` | `["Apache-2.0"]` | applicable (finding) | AND: both must match, MIT is missing |
| L4 | `MIT AND (Apache-2.0 OR ISC)` | `["MIT", "ISC"]` | applicable (no finding) | Complex nested expression |
| L5 | `GPL-2.0-only WITH Classpath-exception-2.0` | `["GPL-2.0-only WITH Classpath-exception-2.0"]` | applicable (no finding) | WITH exception |
| L6 | `Custom-License` | `["MIT"]` | applicable (finding) | Unsupported/custom licence rejected |
| L7 | `MIT AND Apache-2.0` | `["MIT", "Apache-2.0"]` | applicable (no finding) | Both allowed |
| L8 | `(MIT` | `["MIT"]` | unknown | Invalid syntax |

## 2. Install Script Detection (F8 subset)

Identify lifecycle scripts in package metadata.

| ID | Package metadata scripts | Expected Status | Notes |
|----|--------------------------|-----------------|-------|
| I1 | `{"test": "jest"}` | not_applicable | Safe |
| I2 | `{"postinstall": "node script.js"}` | applicable (finding) | postinstall found |
| I3 | `{"preinstall": "rm -rf /"}` | applicable (finding) | preinstall found |
| I4 | `{}` | not_applicable | No scripts |

## 3. Suspicious Metadata Changes

Detect maintainer changes across snapshots. "A maintainer change cannot be inferred from a single snapshot."

| ID | Snapshots | Expected Status | Notes |
|----|-----------|-----------------|-------|
| M1 | Single snapshot: maintainer `alice` | unknown | Insufficient evidence |
| M2 | Prev: `alice`, Cur: `bob` | applicable (finding) | Maintainer changed |
| M3 | Prev: `alice`, Cur: `alice` | not_applicable | No change |

## 4. Concentration Indicators (F8)

Evaluate identity/account overlap.

| ID | Maintainers across instances | Threshold | Expected Status | Notes |
|----|------------------------------|-----------|-----------------|-------|
| C1 | `{"pkgA": ["alice"], "pkgB": ["alice"]}` | 2 | applicable (finding) | Concentration > threshold |
| C2 | `{"pkgA": ["alice"], "pkgB": ["bob"]}` | 2 | not_applicable | Diverse maintainers |

## 5. Outdated Evidence

Check if the package version is significantly older than the latest available.

| ID | Installed Version | Latest Version | Age difference | Expected Status |
|----|-------------------|----------------|----------------|-----------------|
| O1 | `1.0.0` | `1.0.0` | 0 days | not_applicable |
| O2 | `1.0.0` | `2.0.0` | 400 days | applicable (finding) | Assuming policy flags >365 days |
