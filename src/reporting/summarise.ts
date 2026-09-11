import type { AuditFinding, CandidateDecisionRecord } from "../orchestration/report.ts";

/**
 * Plain-English summary of a single finding.
 * Generated purely from structured fields — no LLM, no network call.
 * Satisfies AGENTS.md § "LLM use is limited to optional prose generated from structured fields."
 */
export interface FindingSummary {
  /** What is happening — the observed fact in one or two sentences. */
  what: string;
  /** Why it is happening — root cause and contributing context. */
  why: string;
  /** Where it is happening — package location, relationship to the project. */
  where: string;
  /** How it can be fixed — concrete next steps, in priority order. */
  how: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function acceptedCandidates(candidates: CandidateDecisionRecord[]): CandidateDecisionRecord[] {
  return candidates.filter(c => c.decision === "accepted");
}
function uncertainCandidates(candidates: CandidateDecisionRecord[]): CandidateDecisionRecord[] {
  return candidates.filter(c => c.decision === "uncertain");
}
function rejectedCandidates(candidates: CandidateDecisionRecord[]): CandidateDecisionRecord[] {
  return candidates.filter(c => c.decision === "rejected");
}

function vlist(candidates: CandidateDecisionRecord[]): string {
  return candidates.map(c => c.proposedVersion).join(", ");
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Produces a four-section plain-English summary of an AuditFinding.
 * Pure function — same input always produces the same output.
 * Does not overstate evidence: unknown stays unknown.
 */
export function summariseFinding(finding: AuditFinding): FindingSummary {
  const pkg = finding.package;
  const adv = finding.advisory;
  const reach = finding.reachability;
  const candidates = finding.candidates ?? [];
  const relationship = pkg.direct ? "a direct dependency" : "a transitive (indirect) dependency";

  // ── WHAT ───────────────────────────────────────────────────────────────────
  let what: string;
  if (adv.id.startsWith("SIGNAL-")) {
    what = `SUPPLY CHAIN ALERT: The package "${pkg.name}" at version ${pkg.version} exhibits suspicious metadata changes typical of a compromised release.`;
  } else if (finding.applicability === "applicable") {
    what =
      `The package "${pkg.name}" at version ${pkg.version} matches a known security advisory (${adv.id}). ` +
      `Your installed version falls inside the affected range — the vulnerability described in the advisory applies to what you have right now.`;
  } else if (finding.applicability === "not_applicable") {
    what =
      `Advisory ${adv.id} exists for "${pkg.name}", but your installed version ${pkg.version} is outside the affected range. ` +
      `The vulnerability does not apply to the version you have installed.`;
  } else {
    what =
      `Advisory ${adv.id} was found for "${pkg.name}", but the scanner could not confirm whether version ${pkg.version} is affected or safe. ` +
      `The advisory data is either incomplete or uses a format the tool does not fully support for this version.`;
  }

  // ── WHY ────────────────────────────────────────────────────────────────────
  let why: string;
  if (adv.id.startsWith("SIGNAL-")) {
    why = `The scanner detected an anomaly: ${finding.advisory.id.replace("SIGNAL-", "").replace("-", " ")}. This often indicates an attacker has published a malicious version to the registry.`;
  } else if (finding.applicability === "applicable") {
    why =
      `"${pkg.name}@${pkg.version}" is installed in your project as ${relationship}. ` +
      `Advisory ${adv.id} marks this exact version as containing a known vulnerability. `;

    if (reach?.status === "potential_path_found") {
      why +=
        `Additionally, the static code analysis found a real call path from your application's entry point to this package — ` +
        `meaning your code actively uses the part of the package covered by the advisory.`;
    } else if (reach?.status === "no_path_found_in_scope") {
      why +=
        `The static code analysis did not find a direct call path to this package inside the files it could read. ` +
        `However, this does not mean the code is safe — parts of your codebase that use dynamic imports or patterns the tool could not follow may still reach it.`;
    } else if (reach?.status === "unknown") {
      const gaps = reach.unsupportedPatterns?.map((p: { reason: string }) => p.reason).filter(Boolean).join(", ");
      why +=
        `The reachability check could not complete because your code contains patterns the tool does not support` +
        (gaps ? ` (${gaps})` : "") +
        `. It is not possible to confirm whether the vulnerable code is actually called at runtime.`;
    } else {
      why +=
        `No source file was provided for reachability analysis, so it is not known whether your application actually calls the affected code.`;
    }
  } else if (finding.applicability === "unknown") {
    why =
      `The advisory data for "${pkg.name}" does not clearly include or exclude version ${pkg.version} from the affected range. ` +
      `This typically means the advisory uses a version range or format that the tool cannot fully interpret. `;
    const technical = finding.uncertainty
      .filter((u: string) => !u.startsWith("REACHABILITY") && !u.startsWith("EXPLOIT"))
      .join(", ");
    if (technical) why += `Specific reasons: ${technical}.`;
  } else {
    why =
      `Advisory ${adv.id} covers certain versions of "${pkg.name}", but version ${pkg.version} was ` +
      `either fixed before this version was released or was never part of the affected range to begin with.`;
  }

  // ── WHERE ──────────────────────────────────────────────────────────────────
  let where: string;
  where = `The package is installed at: ${pkg.resolvedPath}. `;
  if (pkg.direct) {
    where +=
      `It is a direct dependency — your team explicitly added it to package.json. ` +
      `You have full control to upgrade, replace, or remove it.`;
  } else {
    where +=
      `It is a transitive dependency — it was pulled in automatically by another package your project depends on, not by your code directly. ` +
      `To change it, you need to either update the parent package that requires it, ` +
      `or use an npm "overrides" entry in your package.json to force a specific version.`;
  }

  // ── HOW ────────────────────────────────────────────────────────────────────
  let how: string;
  const ok = acceptedCandidates(candidates);
  const unk = uncertainCandidates(candidates);
  const bad = rejectedCandidates(candidates);

  if (finding.applicability === "not_applicable") {
    how =
      `No action is required for advisory ${adv.id} — your installed version ${pkg.version} is not affected. ` +
      `Keep monitoring this package for future advisories.`;
  } else if (ok.length > 0) {
    const versions = vlist(ok);
    how =
      `Upgrade "${pkg.name}" to version ${versions}. ` +
      `The advisory snapshot shows ${ok.length === 1 ? "this version is" : "these versions are"} outside the affected range of ${adv.id}. `;
    if (pkg.direct) {
      how += `Run: npm install ${pkg.name}@${ok[0].proposedVersion}`;
    } else {
      how +=
        `Because this is a transitive dependency, update the parent package that pulls it in, ` +
        `or add an "overrides" entry to your package.json: { "overrides": { "${pkg.name}": "${ok[0].proposedVersion}" } }.`;
    }
  } else if (unk.length > 0) {
    const versions = vlist(unk);
    how =
      `Candidate version${unk.length > 1 ? "s" : ""} ${versions} could not be confirmed safe in the current snapshot. ` +
      `Manually check whether ${versions} is actually outside the affected range by reviewing the advisory` +
      (adv.sourceUrl ? ` at ${adv.sourceUrl}` : ` (${adv.id})`) +
      `. Test your application carefully after any upgrade.`;
  } else if (bad.length > 0) {
    how =
      `All checked candidate versions (${vlist(bad)}) are also affected by advisory ${adv.id} — ` +
      `there is no clean drop-in upgrade in the current snapshot. Your options are: ` +
      `(1) check the package registry for a newer version not yet in this snapshot, ` +
      `(2) replace "${pkg.name}" with a different package that provides the same feature, or ` +
      `(3) remove the feature that depends on this package if it is not critical to your application.`;
  } else {
    how =
      `No candidate upgrade versions were listed in the snapshot for "${pkg.name}". ` +
      `Check the package registry or the advisory` +
      (adv.sourceUrl ? ` at ${adv.sourceUrl}` : ` (${adv.id})`) +
      ` for guidance on which versions are patched.`;
  }

  return { what, why, where, how };
}
