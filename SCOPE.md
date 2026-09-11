# Scope contract

## In scope for the first validated release

- Local, authorised repositories.
- npm projects with `package-lock.json` v2 or v3.
- Small single-package JavaScript services.
- Explicit user-declared application entry points.
- JavaScript parsed without executing target code.
- ES modules and CommonJS patterns explicitly listed in the support matrix.
- Exact installed package-instance inventory.
- OSV advisory matching for npm versions.
- A small human-reviewed vulnerable-function mapping catalog.
- Bounded source reachability with visible coverage gaps.
- Outdated-package evidence and reasoned effort bands.
- Install-script and timestamped metadata-change signals.
- A documented SPDX-based licence-policy subset.
- Maintainer/package concentration indicators with identity coverage.
- Bounded candidate-upgrade comparison.
- Local HTML/web report plus versioned JSON export.

## Supported source patterns for the first gate

The initial support matrix should include direct named/default imports, literal `require()`, local functions, simple lexical aliases, direct function calls and cycles. Exact syntax support will be versioned in code and the report.

Dynamic import expressions, computed requires, reflection, dependency injection, framework callback registration, runtime monkey patching, native addons, generated code and bundler transforms are unsupported until separate fixtures prove otherwise. The scanner must identify them where possible and report `unknown` coverage.

Parsing TypeScript syntax does not imply TypeScript module-resolution or semantic support. Do not enable a parser flag and advertise TypeScript reachability.

## Out of scope for the first release

- Universal JavaScript call-graph analysis.
- Exploitability proof or exploit generation.
- Malware certification or complete malicious-package detection.
- Automatic code changes, commits, pull requests or merges.
- Automatic execution of arbitrary public repositories.
- Production-grade hostile-code sandboxing.
- Legal advice about licence compatibility.
- Private package registries and enterprise source hosts.
- Monorepos/workspaces unless explicitly implemented and tested.
- Container, operating-system and vendored native dependencies.
- Python, Maven or other ecosystem reachability.
- Guaranteed upgrade compatibility.
- A single opaque risk/accuracy score.

## Problem-statement traceability

| PS12 requirement | Initial coverage | Completion test |
| --- | --- | --- |
| Dependency tree | npm lockfile instance graph | Independent graph fixture matches |
| Known vulnerabilities | OSV affected-version match | Known affected/fixed cases match |
| Reachability | Reviewed catalog plus bounded call paths | Supported/negative/unknown suites pass |
| Outdated and upgrade effort | Version delta, graph churn and evidence-based band | Reasons present; no invented time estimate |
| Suspicious changes | Snapshot delta and install-script signal | No history produces unknown |
| Licence conflicts | Declared policy over documented SPDX subset | AND/OR/WITH fixtures pass or escalate |
| Concentration risk | Available maintainer/package associations | Coverage and identity uncertainty visible |
| Bonus planner | Bounded candidate comparison | Failing/untested candidate never verified |

## Ecosystem limitation

The PS says “across the project's ecosystems.” Our first release intentionally pursues npm depth. This may be acceptable for a project containing only npm dependencies, but organiser interpretation has not been confirmed. Submission materials must disclose the limitation. A basic second adapter may be considered only after npm gates pass and only if it does not imply cross-language reachability.

## Exit criteria

Scope changes only through `DECISIONS.md`. If a requested feature cannot fit without weakening evidence or security gates, defer the feature.

