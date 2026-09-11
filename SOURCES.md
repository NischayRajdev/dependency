# Sources and baselines

Checked during validation on 11 September 2026. Official documentation establishes published behaviour, not independently reproduced performance. Repository and product comparisons do not establish market-wide novelty.

## Problem statement and supplied assessment

- User-supplied MUJHackX 4.0 PS12 image: authoritative project requirements in this pack.
- User-supplied `10c64602-53cb-4f99-ad71-b46113dd68ec.pdf`: another model's assessment recommending human-verified vulnerable-function mappings, a reachability checkpoint and planner-before-second-ecosystem priority. It is not an organiser rule sheet.

## Vulnerabilities and remediation

- [OSV documentation](https://osv.dev/docs/)
- [OSV schema](https://ossf.github.io/osv-schema/)
- [OSV-Scanner repository](https://github.com/google/osv-scanner)
- [OSV-Scanner guided remediation](https://google.github.io/osv-scanner/experimental/guided-remediation/)
- [OSV-Scanner supported artifacts](https://google.github.io/osv-scanner/supported-languages-and-lockfiles/)
- [Socket reachability analysis](https://docs.socket.dev/docs/reachability-analysis)
- [Socket alert types](https://docs.socket.dev/docs/alert-types)

OSV-Scanner and Socket are named baselines. Scanning, call analysis/reachability signals, licence-related checks and remediation suggestions are not individually unique features.

## npm and source analysis

- [npm package-lock documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/)
- [npm scripts documentation](https://docs.npmjs.com/cli/v11/using-npm/scripts/)
- [Babel parser](https://babeljs.io/docs/babel-parser)
- [Babel traverse](https://babeljs.io/docs/babel-traverse)

Babel supplies parsing/traversal primitives. It does not establish correctness of our module resolution, binding model, call graph or reachability result.

## Licence expressions

- [SPDX licence expressions](https://spdx.github.io/spdx-spec/v2.3/SPDX-license-expressions/)

SPDX syntax is not a universal compatibility decision. Project/distribution context and legal review may still be required.

## Claims discipline

No repository was executed as part of the planning review. No accuracy, security, legal-compliance, performance or user-benefit metric has been established for our future implementation. All such claims require the tests in `PLAN_VALIDATE.md` and `TESTING.md`.

