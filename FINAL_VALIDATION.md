# Final validation

## Prototype follow-up — import and settings

The reported engine error was caused by opening frontend/index.html with a
file URL. Static HTML cannot serve the Node API. A visible recovery banner now
links to http://127.0.0.1:3000 and explains how to start the server.

Scan & Scope provides sample lockfile/source downloads and bounded text import.
The API requires the expected Host, same-origin request and session token.
Input is never written to or executed from a target directory. Lockfile-only
imports return unknown reachability. Every import uses the labelled synthetic
snapshot; unmatched real packages are not certified safe.

Settings persist dark/light/system themes, high contrast, page size and tab
report retention. Clear report removes browser report state. Authentication is
explicitly local-session protection, with no account/password service.
Source fingerprints use relative paths for reproducibility across checkouts.

Fresh verification: build/typecheck pass; **114 tests pass, 0 fail**.
`node scripts/verify-local-api.mjs` passes sample downloads, valid import, invalid
token/origin rejection, malformed body and oversized body checks. Browser file
selection and import reproduced 6 instances, 3 findings and 7 candidates. Dark
and light themes were exercised; light mode was visually inspected at the narrow
browser viewport. Browser error log query returned an empty list.

To test: start `npm run dev`, open http://127.0.0.1:3000, and run the built-in
demo. For import, download both samples, choose them in the two file inputs,
and click Analyse imported files. Use Settings to change appearance.
The earlier fixture-only restriction below is superseded by this bounded import.

Validated on 2026-09-11 with Node.js 24.19.0. The supplied ZIP SHA-256 was
`93ffbcd0ae44d32807f646dadacc2ba2bb2a2de1a938ac4b41f0c4e1caa6f002`.
Its embedded `.git` metadata could not be extracted under the workspace sandbox,
so `git status --short` correctly reports that this directory is not a Git
repository.

## Initial findings

The supplied project contained useful typed inventory, advisory, reachability,
policy and remediation modules and 107 reproducible passing tests. It also had
material demo gaps: no `typecheck` command, 12 TypeScript errors, a CommonJS
`require()` call inside the ESM controller, nondeterministic scan identifiers,
swallowed operational errors, an always-passing candidate test runner, and an
incomplete server response. The browser displayed hardcoded counts, findings,
hashes and exploit-verification claims, and its comparison and export views were
not backed by a complete current report.

## Implemented features

- A deterministic orchestration path reads `package-lock.json` v2/v3, the
  configured JavaScript entry point and a dated advisory snapshot as bounded
  text. It builds exact direct and transitive package instances without
  executing, importing, installing, building or mutating the target.
- The demo report contains repository and advisory snapshot digests, engine
  identity, inventory, dependency edges, advisory matches, bounded reachability,
  evidence references, uncertainty, candidate decisions and support limits.
- Candidate results are accepted, rejected or uncertain only for removal of the
  supplied advisory match. Every candidate records compatibility as `untested`
  and the candidate graph as unresolved.
- The local server exposes scan and audit-export endpoints, serves only an
  allowlist of frontend assets, and supplies CSP, no-sniff, no-referrer and
  no-store headers.
- The browser implements Scan & Scope, Summary & Findings, Finding Deep Dive,
  Candidate Comparison and Audit Export. Counts come from the active report;
  findings support row selection and pagination; empty, loading, success and
  error text is present; hash navigation and session refresh restore the result.
- Both export controls generate the complete audit JSON. The server export also
  uses an attachment filename tied to the deterministic scan identity.

## Real fixture inventory

The demonstration uses the team-owned `demo-fixture`:

- 6 package instances and 2 dependency edges.
- Direct `vulnerable-dep@1.0.0` with `potential_path_found`.
- Transitive `transitive-vuln@3.0.0` with
  `no_path_found_in_scope`; this is not a safety or unreachability claim.
- Direct `dynamic-dep@1.0.0` with `unknown` caused by dynamic import.
- `duplicate-dep@1.0.0` direct and `duplicate-dep@2.0.0` nested, retained as
  separate package instances.
- 7 remediation candidates covering accepted, rejected and uncertain advisory
  applicability outcomes.

Automated fixtures additionally cover a clean tree, vulnerable direct and
transitive packages, duplicate versions, reachable and no-path cases, unresolved
dynamic import, malformed JSON, unsupported lockfile version, a cyclic graph,
missing advisory data, candidate acceptance/rejection/conflict, path traversal
and symlink escape.

## Verification results

- `npm run build`: passed. It runs TypeScript checking plus syntax checks for the
  server and browser JavaScript.
- `npm run typecheck`: passed with no diagnostics.
- `npm test`: **111 passed, 0 failed, 0 skipped, 0 todo** across 11 test files.
- `npm run dev`: started successfully at `http://127.0.0.1:3000`.
- `/api/audit-export`: HTTP 200 with JSON attachment headers. The downloaded
  response parsed successfully and contained 6 instances, 3 findings, 3
  top-level evidence records, 7 candidates and engine version
  `0.1.0-hackathon`; it contained no `/Users/` absolute path.

The tests assert exact instances, edges, applicability values, reachability
states, candidate decisions, evidence fields and security error codes. They do
not merely assert that a value exists.

## Security checks performed

- Canonical path containment rejects traversal and prefix-confusion paths.
- Symlinks escaping the authorised root are rejected.
- Inputs must be regular files and stay within configured byte limits.
- Malformed and unsupported lockfiles fail with explicit errors.
- The scanner never invokes a shell with a selected path and never evaluates
  target configuration or source.
- Dynamic imports produce bounded `unknown` for the affected package.
- Browser rendering uses DOM text nodes for untrusted report fields.
- Export locators use relative paths or content digests and omit local absolute
  paths.

## Manual browser verification

The five sidebar pages were opened in the local browser after a real scan. The
summary displayed 6 instances, 3 findings, 1 unknown reachability result and 7
candidates. A finding row opened its evidence deep dive. Candidate Comparison
displayed accepted, rejected and uncertain records and Audit Export displayed
the full record. Both download buttons were exercised. Refreshing the Audit
Export hash route retained the current session report. No visible UI or API
failure was observed during that journey. Responsive rules collapse the two-column shell, metrics and
content grids below 760 px; the table retains horizontal scrolling on narrow
viewports.

## Remaining limitations and unsupported cases

- Advisories are synthetic records in bundled snapshot
  `mujhackx-demo-osv-2026-09-11`, checked at `2026-09-11T12:00:00Z`. There is no
  live OSV refresh in this prototype.
- Static reachability supports a bounded JavaScript syntax subset and one
  configured entry point. TypeScript syntax, bundler aliases, conditional
  exports, computed module loading and runtime-only behavior can yield
  `unknown` or remain outside scope.
- `invocation_observed` requires a separate isolated test worker and is not
  produced by the static demo scan.
- Candidate dependency graphs are not resolved and compatibility tests are not
  run. An accepted candidate means only that the supplied snapshot no longer
  matches that proposed version.
- The UI selects the included fixture; arbitrary-project selection and upload
  are outside this hackathon flow.
- There is no automated browser-test dependency in the current stack. The full
  UI journey was therefore validated manually in the browser, while engine and
  security behavior are covered by automated integration tests.
- The connected browser surface did not expose console-log inspection or a
  mobile viewport override. Console health was inferred from the successful UI
  and API journey; the narrow layout was verified from its responsive CSS.
- This is a local hackathon prototype, not a security audit or production-ready
  service.

## Three-minute demonstration

1. Run `npm run dev` and open `http://127.0.0.1:3000`.
2. On Scan & Scope, explain the read-only npm/JavaScript boundary and select
   **Run deterministic scan**.
3. On Summary, point out the direct, transitive and duplicate instances and the
   three distinct reachability outcomes.
4. Select the direct finding to show evidence and uncertainty, then open
   Candidate Comparison to contrast accepted, rejected and uncertain choices.
5. Open Audit Export and download the JSON using either export control. Show the
   two snapshot identities, evidence, uncertainty, candidates and engine version.
