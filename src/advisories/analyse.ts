import type { AdvisoryRecord, Applicability } from "./types.ts";
import type { ComponentResult } from "../contracts/evidence.ts";
import type { PackageInstance } from "../inventory/types.ts";
import type { ResourceLimits } from "../orchestrator/types.ts";
import type { Finding } from "../reporting/types.ts";
import { checkpoint, complete, digest, evidence, guard, object, parseJson, reject, text } from "../contracts/core.ts";
import { compareVersions, validVersion } from "./semver.ts";

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) reject("INVALID_ARRAY");
  return value;
}

function timestamp(value: unknown): string {
  const result = text(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(result) || !Number.isFinite(Date.parse(result))) reject("INVALID_TIMESTAMP");
  if (new Date(result).toISOString().slice(0, 19) !== result.slice(0, 19)) reject("INVALID_TIMESTAMP");
  return result;
}

/** affectedRanges stores JSON-encoded OSV affected entries, retaining unsupported data. */
export function normaliseOsv(raw: string, retrievedAt: string, limits: ResourceLimits): ComponentResult<AdvisoryRecord[]> {
  return guard(() => {
    const started = performance.now();
    const input = object(parseJson(raw, limits, started, limits.maxApiResponseBytes));
    const id = text(input.id);
    if (!/^[A-Za-z0-9._-]{1,200}$/.test(id)) reject("INVALID_ADVISORY_ID");
    const modifiedAt = timestamp(input.modified);
    timestamp(retrievedAt);
    if (input.withdrawn !== undefined) timestamp(input.withdrawn);
    const aliases = [...new Set(array(input.aliases ?? []).map(text))].sort();
    const entries = array(input.affected);
    if (entries.length > limits.maxGraphNodes) reject("LIMIT_GRAPH_NODES");
    let sourceUrl = `https://osv.dev/vulnerability/${id}`;
    const dbSpecific = input.database_specific as Record<string, unknown> | undefined;
    if (dbSpecific && typeof dbSpecific.url === "string") sourceUrl = dbSpecific.url;
    const source = { ...evidence("advisory", raw), sourceUrl, observedAt: retrievedAt };
    const records = new Map<string, AdvisoryRecord>();
    for (const entry of entries) {
      checkpoint(limits, started);
      const affected = object(entry), pkg = object(affected.package);
      if (pkg.ecosystem !== "npm") reject("UNSUPPORTED_ECOSYSTEM");
      const packageName = text(pkg.name);
      const record: AdvisoryRecord = records.get(packageName) ?? {
        id, aliases, ecosystem: "npm", packageName, affectedRanges: [], fixedVersions: [],
        withdrawal: input.withdrawn === undefined ? "not_withdrawn" : "withdrawn",
        sourceUrl: source.sourceUrl, retrievedAt, modifiedAt, contentDigest: source.contentDigest,
        affectedInstanceIds: [], evidence: [source],
      };
      record.affectedRanges.push(JSON.stringify(affected));
      for (const range of array(affected.ranges ?? [])) {
        const data = object(range);
        for (const event of array(data.events ?? [])) {
          const value = object(event).fixed;
          if (data.type === "SEMVER" && typeof value === "string" && validVersion(value)) record.fixedVersions.push(value);
        }
      }
      records.set(packageName, record);
    }
    for (const record of records.values()) record.fixedVersions = [...new Set(record.fixedVersions)].sort(compareVersions);
    checkpoint(limits, started);
    return complete([...records.values()].sort((a, b) => a.packageName < b.packageName ? -1 : a.packageName > b.packageName ? 1 : 0));
  });
}

function rangeMatch(value: unknown, version: string, limits: ResourceLimits, started: number): Applicability {
  const range = object(value);
  if (range.type !== "SEMVER") return "unknown";
  const events = array(range.events).map(object);
  if (!events.length) return "unknown";
  let start: string | undefined;
  let previous: string | undefined;
  let matched = false, fixed = false, lastAffected = false, introduced = false;
  // This initial subset accepts ordered timelines. Unsorted/limit events stay unknown.
  for (const event of events) {
    checkpoint(limits, started);
    const keys = Object.keys(event);
    if (keys.length !== 1) return "unknown";
    const kind = keys[0], boundary = text(event[kind]);
    if (!["introduced", "fixed", "last_affected"].includes(kind)) return "unknown";
    if (!(kind === "introduced" && boundary === "0") && !validVersion(boundary)) return "unknown";
    if (previous !== undefined && (boundary === "0" || (previous !== "0" && compareVersions(previous, boundary) >= 0))) return "unknown";
    previous = boundary;
    if (kind === "introduced") {
      if (start !== undefined) return "unknown";
      start = boundary; introduced = true;
    } else {
      if (start === undefined) return "unknown";
      fixed ||= kind === "fixed"; lastAffected ||= kind === "last_affected";
      if (fixed && lastAffected) return "unknown";
      const above = start === "0" || compareVersions(version, start) >= 0;
      const below = compareVersions(version, boundary) < (kind === "fixed" ? 0 : 1);
      matched ||= above && below;
      start = undefined;
    }
  }
  if (!introduced) return "unknown";
  if (start !== undefined) matched ||= start === "0" || compareVersions(version, start) >= 0;
  return matched ? "applicable" : "not_applicable";
}

function affectedMatch(value: unknown, version: string, limits: ResourceLimits, started: number): [Applicability, number] {
  const entry = object(value);
  const versions = array(entry.versions ?? []).map(text);
  const ranges = array(entry.ranges ?? []);
  if (!versions.length && !ranges.length) return ["unknown", 1];
  const states = ranges.map(range => rangeMatch(range, version, limits, started));
  const gaps = states.filter(state => state === "unknown").length + versions.filter(value => !validVersion(value)).length;
  // Unsupported range coverage cannot hide an explicit positive version match.
  if (versions.includes(version) || states.includes("applicable")) return ["applicable", gaps];
  if (gaps) return ["unknown", gaps];
  return ["not_applicable", 0];
}

/** Matches one supplied OSV snapshot; never asserts completeness of an advisory catalog. */
export function matchOsv(raw: string, instance: PackageInstance, scanId: string, retrievedAt: string, limits: ResourceLimits): ComponentResult<Finding> {
  return guard(() => {
    const started = performance.now();
    const normalised = normaliseOsv(raw, retrievedAt, limits);
    if (!normalised.data) return { ...normalised, data: undefined };
    if (instance.ecosystem !== "npm" || !validVersion(instance.version) || !instance.evidence.length) reject("INVALID_PACKAGE_INSTANCE");
    const records = normalised.data.filter(record => record.packageName === instance.name || record.packageName === "*");
    const refs = [...instance.evidence, ...normalised.data.flatMap(record => record.evidence)];
    let applicability: Applicability = "unknown";
    let coverageGaps = 0;
    let reason = "NO_PACKAGE_RECORD_IN_SUPPLIED_SNAPSHOT";
    if (records.length) {
      const states: Applicability[] = [];
      for (const record of records) {
        checkpoint(limits, started);
        if (record.withdrawal !== "not_withdrawn" || record.packageName === "*") { states.push("unknown"); coverageGaps++; continue; }
        for (const encoded of record.affectedRanges) {
          const entry = parseJson(encoded, limits, started, limits.maxApiResponseBytes);
          const [state, gaps] = affectedMatch(entry, instance.version, limits, started);
          states.push(state);
          coverageGaps += gaps;
        }
      }
      applicability = states.includes("applicable") ? "applicable" : states.length && states.every(state => state === "not_applicable") ? "not_applicable" : "unknown";
      reason = "WITHDRAWN_MISSING_OR_UNSUPPORTED_ADVISORY_DATA";
    }
    const finding: Finding = {
      id: digest(JSON.stringify([scanId, instance.id, digest(raw)])), scanId,
      category: "advisory", packageInstanceIds: [instance.id], applicability,
      evidence: refs.length > instance.evidence.length ? refs : [...refs, evidence("advisory", raw)],
      uncertainty: ["REACHABILITY_NOT_ASSESSED", "EXPLOIT_PRECONDITIONS_NOT_ASSESSED", ...(applicability === "unknown" ? [reason] : []), ...(coverageGaps ? [`ADVISORY_COVERAGE_GAPS:${coverageGaps}`] : [])],
      suggestedActions: [],
    };
    checkpoint(limits, started);
    const result = complete(finding);
    if (applicability === "unknown" || coverageGaps) {
      const ref = evidence("derived", reason);
      result.status = "partial";
      result.reasons = [ref];
      result.diagnostics = [{ code: reason, message: reason, evidence: [ref] }];
    }
    return result;
  });
}
