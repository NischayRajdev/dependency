# Security policy and design review

## Status

This is a design-stage threat model. No implementation security audit or penetration test has occurred. The project must not describe this document as certification.

## Protected assets

- Developer source code and secrets.
- Host filesystem and process integrity.
- Repository/service credentials.
- Integrity and freshness of findings.
- Test-worker isolation.
- Privacy of locally analysed projects.

## Untrusted inputs

Repository files, paths, symlinks, lockfiles, package names, package metadata, advisories, registry responses, redirects, README text, generated prose and test output are untrusted.

## Threats and required controls

| Threat | Required control | Verification |
| --- | --- | --- |
| Lifecycle/code execution during scan | Parse data/source only; no install, import, build, plugin or target config execution | Side-effect fixture leaves no marker/network event |
| Path/symlink escape | Canonical root containment; reject escaping links and special files | Parent, symlink and device-file cases fail safely |
| Parser/resource denial | File/byte/node/time limits and cancellation | Oversized/deep fixtures return partial with reason |
| SSRF and malicious redirects | Fixed outbound allowlist, redirect revalidation, block local/private/link-local addresses | Redirect-to-local tests fail closed |
| Supply-chain response tampering | TLS, source/digest/timestamp capture and bounded cache | Changed snapshot invalidates affected evidence |
| Prompt injection | LLM has no command/tool authority; structured schema controls findings | Embedded instructions do not change classifications |
| Report XSS | Contextual escaping, no raw untrusted HTML, restrictive CSP | Malicious names and source snippets render inert |
| Local API abuse | Loopback binding, session token, origin checks and no permissive CORS | Cross-origin mutation rejected |
| Secret leakage | Local-first analysis, secret redaction in snippets/logs, opt-in external model use | Fake secrets absent from logs/exports/network |
| Stale evidence | Fingerprint project, candidate, policies, catalog and snapshots | Any relevant change marks dependent results stale |
| Unsafe automatic fix | Read-only original; patch preview; explicit developer action | Original tree unchanged after all flows |
| Worker escape | Separate non-root worker, no secrets/socket, narrow mounts, resource/time/network limits | Escape/resource/network fixtures contained |
| Misleading result | Typed uncertainty, support summary and evidence links | Unsupported case cannot become a safe result |

## Static scan execution policy

The scanner must not run `npm install`, `npm ci`, tests, lifecycle scripts or application code. It must not require target modules or load configuration through a JavaScript API. Parser options come from our validated configuration, not executable project configuration.

## Compatibility worker policy

At hackathon scope, the worker runs only team-owned fixtures. If arbitrary repositories are allowed later, container isolation alone is insufficient. The design needs a stronger hostile-code boundary, a separate execution host/account, no shared credentials, egress policy, immutable base image, restricted kernel capabilities, quotas, cleanup and audit logging.

Separate acquisition from execution. Dependency acquisition may require restricted registry access; tests should run without network unless the fixture explicitly needs an allowlisted mock service. Verify available integrity metadata before using an artifact.

## Data handling

- Do not transmit source to an external LLM by default.
- If explanation generation is enabled, show exactly what structured fields/snippets leave the machine and require opt-in.
- Do not retain complete source when evidence locations/digests are sufficient.
- Never include environment-variable values in reports.
- Treat reports as potentially sensitive project metadata.

## Security wording

Allowed: “known advisory matched”, “potential path found”, “no path found within analysed scope”, “specified tests passed”.

Forbidden: “safe dependency”, “not exploitable”, “malware-free”, “fully compliant”, “upgrade cannot break the application”, “secure release”.

## Vulnerability reporting

Until a public security contact exists, report suspected vulnerabilities privately to the two maintainers. Do not include exploit details, secrets or third-party private repository content in public issues. A formal address and response window must be added before public release.

## Review checklist

- [ ] No target execution in static path.
- [ ] Canonical containment applied to every file open.
- [ ] Network client allowlist and redirect policy tested.
- [ ] UI output encoding and CSP tested.
- [ ] Logs/exports checked with seeded fake secrets.
- [ ] Scan and candidate fingerprints invalidate stale evidence.
- [ ] Worker has no credentials, broad mounts or host socket.
- [ ] Unsupported conditions remain visible.

