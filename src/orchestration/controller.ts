import * as path from "node:path";
import { analyseLockfile } from "../inventory/analyse.ts";
import { matchOsv, normaliseOsv } from "../advisories/analyse.ts";
import { analyseReachability, type ReachabilityContext } from "../reachability/analyse.ts";
import { complete, defaultLimits, digest, evidence, failure } from "../contracts/core.ts";
import { readTextFileSafe, resolveSafePath } from "../security/boundary.ts";
import type { Finding } from "../reporting/types.ts";
import type { PackageInstance } from "../inventory/types.ts";
import type { AdvisoryRecord } from "../advisories/types.ts";
import type { ReachabilityResult } from "../reachability/types.ts";
import type { AuditFinding, AuditReport, CandidateDecisionRecord } from "./report.ts";
import { summariseFinding } from "../reporting/summarise.ts";

export interface ScanRequest {
  projectRoot: string;
  lockfile: string;
  entryPoints: string[];
  policyVersion: string;
  catalogVersion: string;
  limitsProfile: string;
}

interface AdvisoryBundle {
  snapshotId: string;
  checkedAt: string;
  advisories: unknown[];
  candidates: Record<string, string[]>;
}

export interface EngineMocks {
  getAdvisoryFindings?: () => Finding[];
  getPolicyFindings?: () => Finding[];
}

export class ScanError extends Error {
  readonly code: string;
  constructor(code: string) { super(code); this.code = code; this.name = "ScanError"; }
}

function parseBundle(raw: string): AdvisoryBundle {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new ScanError("INVALID_ADVISORY_SNAPSHOT"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ScanError("INVALID_ADVISORY_SNAPSHOT");
  const input = value as Record<string, unknown>;
  if (typeof input.snapshotId !== "string" || typeof input.checkedAt !== "string" || !Array.isArray(input.advisories)) throw new ScanError("INVALID_ADVISORY_SNAPSHOT");
  const candidates: Record<string, string[]> = {};
  if (input.candidates && typeof input.candidates === "object" && !Array.isArray(input.candidates)) {
    for (const [name, versions] of Object.entries(input.candidates)) {
      if (!Array.isArray(versions) || !versions.every(version => typeof version === "string")) throw new ScanError("INVALID_CANDIDATE_DATA");
      candidates[name] = versions;
    }
  }
  return { snapshotId: input.snapshotId, checkedAt: input.checkedAt, advisories: input.advisories, candidates };
}

function packageNames(advisory: unknown): string[] {
  if (!advisory || typeof advisory !== "object") return [];
  const affected = (advisory as { affected?: unknown }).affected;
  if (!Array.isArray(affected)) return [];
  return affected.flatMap(item => {
    if (!item || typeof item !== "object") return [];
    const pkg = (item as { package?: unknown }).package;
    return pkg && typeof pkg === "object" && typeof (pkg as { name?: unknown }).name === "string" ? [(pkg as { name: string }).name] : [];
  });
}

function candidateRecord(instance: PackageInstance, proposedVersion: string, result: ReturnType<typeof matchOsv>, advisoryId: string): CandidateDecisionRecord {
  const applicability = result.data?.applicability ?? "unknown";
  const decision = applicability === "not_applicable" ? "accepted" : applicability === "applicable" ? "rejected" : "uncertain";
  const reason = decision === "accepted"
    ? "Removes this advisory match within the bundled snapshot; compatibility remains untested."
    : decision === "rejected"
      ? "The proposed version remains affected in the bundled advisory snapshot."
      : "The bundled snapshot cannot determine applicability for this version.";
  return {
    id: digest(JSON.stringify([instance.id, proposedVersion, advisoryId])), packageInstanceId: instance.id,
    packageName: instance.name, currentVersion: instance.version, proposedVersion, decision, reason,
    advisoryApplicability: applicability, compatibilityTestState: "untested", verifiedUnderSpecifiedChecks: false,
    evidence: result.data?.evidence ?? result.reasons,
    uncertainty: ["COMPATIBILITY_NOT_TESTED", "CANDIDATE_GRAPH_NOT_RESOLVED"],
  };
}


// Helper to compute downstream impact (blast radius)
function computeDownstreamImpact(instanceId: string, edges: { fromInstanceId: string, toInstanceId: string }[], instances: { id: string, direct: boolean, name: string }[]): { directParents: string[], totalPaths: number, graph?: any } {
  const reverseGraph = new Map<string, string[]>();
  for (const edge of edges) {
    if (!reverseGraph.has(edge.toInstanceId)) reverseGraph.set(edge.toInstanceId, []);
    reverseGraph.get(edge.toInstanceId)!.push(edge.fromInstanceId);
  }

  const directParents = new Set<string>();
  let totalPaths = 0;
  const instanceMap = new Map(instances.map(i => [i.id, i]));
  
  // We want to extract a sub-graph of all paths from roots to instanceId.
  const pathNodes = new Set<string>();
  const pathEdges = new Set<string>(); // "from|to"
  
  function dfs(currentId: string, pathHashes: Set<string>, currentPath: string[]) {
    const parents = reverseGraph.get(currentId) || [];
    if (parents.length === 0 || instanceMap.get(currentId)?.direct) {
      if (currentId !== instanceId) directParents.add(instanceMap.get(currentId)?.name || currentId);
      const pathHash = currentPath.join("->");
      if (!pathHashes.has(pathHash)) {
        pathHashes.add(pathHash);
        totalPaths++;
        // Add this path's edges and nodes to our graph sets
        // currentPath is from target (index 0) up to root (index N-1)
        pathNodes.add("APP");
        pathNodes.add(currentPath[currentPath.length - 1]);
        pathEdges.add(`APP|${currentPath[currentPath.length - 1]}`);
        for (let i = currentPath.length - 1; i > 0; i--) {
          pathNodes.add(currentPath[i]);
          pathNodes.add(currentPath[i-1]);
          pathEdges.add(`${currentPath[i]}|${currentPath[i-1]}`);
        }
      }
      return;
    }
    for (const parent of parents) {
      if (currentPath.includes(parent)) continue; // cycle prevention
      currentPath.push(parent);
      dfs(parent, pathHashes, currentPath);
      currentPath.pop();
    }
  }

  dfs(instanceId, new Set(), [instanceId]);
  
  // Build the graph payload
  // We assign a level to each node. APP is level 0. Target is level max.
  // Actually, standard DAG layout: distance from APP.
  const forwardGraph = new Map<string, string[]>();
  for (const edge of pathEdges) {
    const [from, to] = edge.split("|");
    if (!forwardGraph.has(from)) forwardGraph.set(from, []);
    forwardGraph.get(from)!.push(to);
  }

  const levels = new Map<string, number>();
  levels.set("APP", 0);
  const queue = ["APP"];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const lvl = levels.get(curr)!;
    const children = forwardGraph.get(curr) || [];
    for (const child of children) {
      if (!levels.has(child) || levels.get(child)! < lvl + 1) {
        levels.set(child, lvl + 1);
        queue.push(child);
      }
    }
  }

  // Target node might be reached via multiple paths of different lengths.
  // The level assignment ensures it is at the max distance from APP.

  const graphNodes = Array.from(pathNodes).map(id => {
    if (id === "APP") return { id, name: "APPLICATION", level: 0, isApp: true };
    const inst = instanceMap.get(id);
    return { 
      id, 
      name: inst?.name || id, 
      level: levels.get(id) || 0,
      isCompromised: id === instanceId
    };
  });

  const graphEdges = Array.from(pathEdges).map(edgeStr => {
    const [from, to] = edgeStr.split("|");
    return { from, to };
  });

  const graph = pathNodes.size > 0 ? { nodes: graphNodes, edges: graphEdges } : undefined;

  return { directParents: Array.from(directParents), totalPaths, graph };
}

export class ScanController {
  private readonly reports = new Map<string, AuditReport>();

  async startScan(request: ScanRequest, mocks?: EngineMocks): Promise<string> {
    const safeLockfile = await resolveSafePath(request.projectRoot, request.lockfile);
    if (mocks) {
      const findings = [...(mocks.getAdvisoryFindings?.() ?? []), ...(mocks.getPolicyFindings?.() ?? [])];
      const scanId = `scan-${digest(JSON.stringify(findings)).slice(0, 16)}`;
      this.reports.set(scanId, this.mockReport(scanId, findings));
      return scanId;
    }
    const lockfileRaw = await readTextFileSafe(safeLockfile, defaultLimits.maxFileBytes);
    const entryFiles = new Map<string, string>();
    for (const requested of request.entryPoints) {
      const safeEntry = await resolveSafePath(request.projectRoot, requested);
      entryFiles.set(safeEntry, await readTextFileSafe(safeEntry, defaultLimits.maxFileBytes));
    }
    const advisoryPath = await resolveSafePath(request.projectRoot, "advisories/snapshot.json");
    const advisoryRaw = await readTextFileSafe(advisoryPath, defaultLimits.maxApiResponseBytes);
    return this.buildReport(request, lockfileRaw, entryFiles, advisoryRaw);
  }

  scanText(lockfileRaw: string, source: string | undefined, advisoryRaw: string): AuditReport {
    if (Buffer.byteLength(lockfileRaw) > defaultLimits.maxFileBytes || (source !== undefined && Buffer.byteLength(source) > defaultLimits.maxFileBytes)) throw new ScanError("INPUT_TOO_LARGE");
    const request = { projectRoot: "/imported-project", lockfile: "package-lock.json", entryPoints: source === undefined ? [] : ["entry.js"], policyVersion: "demo-policy-v1", catalogVersion: "mujhackx-demo-osv-2026-09-11", limitsProfile: "hackathon-v1" };
    const files = new Map<string, string>();
    if (source !== undefined) files.set("/imported-project/entry.js", source);
    return this.getScanReport(this.buildReport(request, lockfileRaw, files, advisoryRaw));
  }

  private buildReport(request: ScanRequest, lockfileRaw: string, entryFiles: Map<string, string>, advisoryRaw: string): string {
    const inventory = analyseLockfile(lockfileRaw, defaultLimits);
    if (!inventory.data) throw new ScanError(inventory.diagnostics[0]?.code ?? "INVENTORY_FAILED");
    const bundle = parseBundle(advisoryRaw);
    const snapshotDigest = digest(advisoryRaw);
    const projectSnapshotDigest = digest([lockfileRaw, ...[...entryFiles.entries()].sort().flatMap(([file, content]) => [path.relative(request.projectRoot, file), content])].join("\n"));
    const scanId = `scan-${digest(JSON.stringify([projectSnapshotDigest, snapshotDigest, request.policyVersion, request.catalogVersion])).slice(0, 16)}`;

    const byName = new Map<string, PackageInstance[]>();
    for (const instance of inventory.data.instances) byName.set(instance.name, [...(byName.get(instance.name) ?? []), instance]);
    const virtual = new Map<string, string>();
    for (const instance of inventory.data.instances) virtual.set(`package:${instance.id}`, instance.id);
    const context: ReachabilityContext = {
      readFile: file => entryFiles.get(file),
      resolveModule: (_from, specifier) => {
        const candidates = byName.get(specifier);
        return candidates?.length ? `package:${candidates[0].id}` : undefined;
      },
      getPackageInstanceId: resolved => virtual.get(resolved),
    };

    const findings: AuditFinding[] = [];
    const advisoryRecords: AdvisoryRecord[] = [];
    const reachabilityResults: ReachabilityResult[] = [];
    const candidateResults: CandidateDecisionRecord[] = [];
    const advisoryReasons = [];
    const advisoryDiagnostics = [];
    for (const advisory of bundle.advisories) {
      const raw = JSON.stringify(advisory);
      const normalised = normaliseOsv(raw, bundle.checkedAt, defaultLimits);
      if (normalised.data) advisoryRecords.push(...normalised.data);
      advisoryReasons.push(...normalised.reasons);
      advisoryDiagnostics.push(...normalised.diagnostics);
      const names = new Set(packageNames(advisory));
      for (const instance of inventory.data.instances.filter(item => names.has(item.name))) {
        const matched = matchOsv(raw, instance, scanId, bundle.checkedAt, defaultLimits);
        if (!matched.data || matched.data.applicability === "not_applicable") continue;
        const reachability = analyseReachability([...entryFiles.keys()], instance.id, context, defaultLimits);
        if (entryFiles.size === 0 && reachability.data) {
          reachability.data.status = "unknown";
          reachability.data.assumptions.push("NO_SOURCE_PROVIDED");
        }
        if (reachability.data) reachabilityResults.push(reachability.data);
        const record = normalised.data?.find(item => item.packageName === instance.name);
        const candidates = (bundle.candidates[instance.name] ?? []).map(version => candidateRecord(instance, version, matchOsv(raw, { ...instance, version }, scanId, bundle.checkedAt, defaultLimits), record?.id ?? "unknown"));
        candidateResults.push(...candidates);
        const finding = matched.data;
        finding.reachability = reachability.data;
        finding.uncertainty = finding.uncertainty.filter(item => item !== "REACHABILITY_NOT_ASSESSED");
        if (!reachability.data) finding.uncertainty.push("REACHABILITY_ANALYSIS_FAILED");
        const downstreamImpact = computeDownstreamImpact(instance.id, inventory.data.edges, inventory.data.instances);
        findings.push({ ...finding,
          package: { name: instance.name, version: instance.version, resolvedPath: instance.resolvedPath, direct: instance.direct },
          advisory: { id: record?.id ?? "unknown", sourceUrl: record?.sourceUrl ?? "", modifiedAt: record?.modifiedAt }, candidates,
          downstreamImpact,
          get summary() { return summariseFinding(this as AuditFinding); }
        });
      }
    }
    findings.sort((a, b) => a.id.localeCompare(b.id));
    candidateResults.sort((a, b) => a.id.localeCompare(b.id));
    const unsupportedConstructs = reachabilityResults.reduce((sum, result) => sum + result.unsupportedPatterns.reduce((count, gap) => count + gap.count, 0), 0);
    const sourceEvidence = [...entryFiles.entries()].sort().map(([file, content]) => ({ ...evidence("source", content), locator: path.relative(request.projectRoot, file) }));
    const report: AuditReport = {
      schemaVersion: "fides-audit-v1", engine: { name: "FIDES // VERIFY", version: "0.1.0-hackathon" },
      scan: { id: scanId, project: path.basename(path.resolve(request.projectRoot)), projectSnapshotDigest,
        lockfileVersion: inventory.data.lockfileVersion, entryPoints: [...entryFiles.keys()].map(file => path.relative(request.projectRoot, file)), completedAt: bundle.checkedAt },
      advisorySnapshot: { id: bundle.snapshotId, checkedAt: bundle.checkedAt, digest: snapshotDigest, source: "bundled_snapshot", advisoryCount: bundle.advisories.length },
      inventory,
      advisories: advisoryDiagnostics.length ? { status: advisoryRecords.length ? "partial" : "failed", data: advisoryRecords.length ? advisoryRecords : undefined, reasons: advisoryReasons, limitsHit: [], diagnostics: advisoryDiagnostics } : complete(advisoryRecords),
      reachability: complete(reachabilityResults), findings, candidates: candidateResults,
      support: { supportedReachabilityStates: ["potential_path_found", "invocation_observed", "no_path_found_in_scope", "unknown"], analysedFiles: entryFiles.size, unsupportedConstructs,
        limitations: ["JavaScript static subset only; dynamic imports remain unknown.", "Advisories come from a dated bundled snapshot, not a live OSV query.", "Candidate compatibility is untested and candidate graphs are not resolved.", "invocation_observed requires an isolated named test and is not emitted by this static scan."] },
      evidence: [evidence("lockfile", lockfileRaw), { ...evidence("advisory", advisoryRaw), observedAt: bundle.checkedAt }, ...sourceEvidence],
      uncertainty: ["EXPLOIT_PRECONDITIONS_NOT_ASSESSED", "CANDIDATE_COMPATIBILITY_NOT_TESTED"],
    };
    this.reports.set(scanId, report);
    if (this.reports.size > 20) this.reports.delete(this.reports.keys().next().value!);
    return scanId;
  }

  getScanFindings(scanId: string): Finding[] { return this.getScanReport(scanId).findings; }
  getScanReport(scanId: string): AuditReport {
    const report = this.reports.get(scanId);
    if (!report) throw new ScanError("SCAN_NOT_FOUND");
    return report;
  }

  private mockReport(scanId: string, findings: Finding[]): AuditReport {
    return {
      schemaVersion: "fides-audit-v1", engine: { name: "FIDES // VERIFY", version: "test-mock" },
      scan: { id: scanId, project: "test-mock", projectSnapshotDigest: digest(scanId), lockfileVersion: 3, entryPoints: [], completedAt: "1970-01-01T00:00:00Z" },
      advisorySnapshot: { id: "test-mock", checkedAt: "1970-01-01T00:00:00Z", digest: digest("test-mock"), source: "bundled_snapshot", advisoryCount: 0 },
      inventory: failure("MOCK_INVENTORY_NOT_RUN"), advisories: complete([]), reachability: complete([]),
      findings: findings.map(finding => ({ ...finding, package: { name: "unknown", version: "unknown", resolvedPath: "", direct: false }, advisory: { id: "unknown", sourceUrl: "" }, candidates: [] })),
      candidates: [], support: { supportedReachabilityStates: ["potential_path_found", "invocation_observed", "no_path_found_in_scope", "unknown"], analysedFiles: 0, unsupportedConstructs: 0, limitations: ["Test mock only."] }, evidence: [], uncertainty: ["MOCK_INPUT"],
    };
  }
}
