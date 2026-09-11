# Glossary

**Affected version:** A package version included in the affected range of a specific advisory record.

**Advisory applicability:** Whether the exact installed package instance/version matches an advisory's affected-version evidence.

**Candidate:** A proposed set of direct dependency changes whose actual resolved graph and specified checks are evaluated.

**Call graph:** Supported source-level edges representing potential calls between functions/modules under declared assumptions.

**Compatibility evidence:** Results of named checks in a recorded environment. It is not proof of all application behaviour.

**Concentration indicator:** A measure of dependencies associated with available maintainer/package identities, accompanied by identity coverage and limitations.

**Dependency graph:** Package-instance installation edges showing which dependency introduced another.

**Evidence:** A source-linked, versioned record supporting a claim, including method, timestamp and digest when applicable.

**Exploitability:** Whether an attacker can trigger and benefit from a vulnerability in the real application. This project does not claim to prove it.

**Invocation observed:** A mapped function ran during one specified isolated test. Attacker control and exploit conditions remain separate.

**No path found in scope:** The analyser found no call path under its declared supported patterns, entry points and limits. It does not mean universally unreachable.

**Package instance:** A dependency identified by ecosystem, name, version, resolved location and graph context.

**Potential path found:** A static source call path exists under documented assumptions. It is reachability evidence, not exploitability proof.

**Reachability:** Whether a mapped affected function may be reached from declared entry points within the analyser's supported model.

**Resolved graph:** The actual package-instance graph produced by a supported dependency resolver/lockfile, not merely requested manifest ranges.

**Risk signal:** Evidence requiring review, such as an install script or maintainer change. It is not a maliciousness verdict.

**Stale evidence:** A result whose project, candidate, catalog, policy, metadata or test inputs no longer match its recorded fingerprints.

**Unknown:** Insufficient evidence or unsupported analysis prevents the intended conclusion.

**Verified under specified checks:** The exact candidate passed the listed required checks against a passing baseline in the recorded environment. The phrase must always retain this qualifier.

