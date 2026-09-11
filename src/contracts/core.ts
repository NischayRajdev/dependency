import { createHash } from "node:crypto";
import type { ComponentResult, EvidenceRef } from "./evidence.ts";
export type { ComponentResult } from "./evidence.ts";
import type { ResourceLimits } from "../orchestrator/types.ts";

export const defaultLimits: Readonly<ResourceLimits> = Object.freeze({
  maxFiles: 1000, maxFileBytes: 1_000_000, maxTotalBytes: 4_000_000,
  maxAstNodes: 100_000, maxGraphNodes: 10_000, maxGraphEdges: 20_000,
  maxTraversalDepth: 100, maxRecursionDepth: 64, maxApiResponseBytes: 1_000_000,
  maxPlannerCandidates: 10, maxStageDurationMs: 2000, maxScanDurationMs: 10_000,
});

export function digest(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function evidence(kind: EvidenceRef["kind"], text: string): EvidenceRef {
  const contentDigest = digest(text);
  return { id: `${kind}:${contentDigest}`, kind, locator: `sha256:${contentDigest}`, contentDigest };
}

export function reject(code: string): never { throw new Error(code); }

export function checkpoint(limits: ResourceLimits, started: number): void {
  for (const key of Object.keys(defaultLimits) as Array<keyof ResourceLimits>) {
    if (!Number.isSafeInteger(limits[key]) || limits[key] <= 0 || limits[key] > 100_000_000) reject("INVALID_LIMITS");
  }
  if (performance.now() - started >= Math.min(limits.maxStageDurationMs, limits.maxScanDurationMs)) reject("LIMIT_TIME");
}

export function complete<T>(data: T): ComponentResult<T> {
  return { status: "complete", data, reasons: [], limitsHit: [], diagnostics: [] };
}

export function failure<T>(code: string, refs: EvidenceRef[] = []): ComponentResult<T> {
  const reason = evidence("derived", code);
  const limit = code.startsWith("LIMIT_");
  return {
    status: limit ? "partial" : code.startsWith("UNSUPPORTED_") ? "unsupported" : "failed",
    reasons: [...refs, reason], limitsHit: limit ? [code] : [],
    diagnostics: [{ code, message: code, evidence: [...refs, reason] }],
  };
}

export function guard<T>(run: () => ComponentResult<T>): ComponentResult<T> {
  try { return run(); }
  catch (error) {
    // Never include parser exceptions, input fragments, paths or environment data.
    const code = error instanceof Error && /^(INVALID|UNSUPPORTED|LIMIT)_[A-Z_]+$/.test(error.message)
      ? error.message : "INVALID_INPUT";
    return failure(code);
  }
}

export function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) reject("INVALID_OBJECT");
  return value as Record<string, unknown>;
}

export function text(value: unknown): string {
  if (typeof value !== "string" || !value.length) reject("INVALID_STRING");
  return value;
}

/** Preflight bounds and duplicate-key rejection before native JSON parsing. */
export function parseJson(raw: string, limits: ResourceLimits, started: number, maxBytes: number): unknown {
  checkpoint(limits, started);
  if (typeof raw !== "string") reject("INVALID_JSON");
  if (raw.length > maxBytes || Buffer.byteLength(raw) > Math.min(maxBytes, limits.maxTotalBytes)) reject("LIMIT_BYTES");
  const stack: Array<Set<string> | null> = [];
  let nodes = 0;
  for (let i = 0; i < raw.length; i++) {
    if (i % 256 === 0) checkpoint(limits, started);
    const char = raw[i];
    if (char === '"') {
      const start = i++;
      for (; i < raw.length && raw[i] !== '"'; i++) {
        if (i % 256 === 0) checkpoint(limits, started);
        if (raw[i] === "\\") i++;
      }
      let next = i + 1;
      while (/\s/.test(raw[next] ?? "x")) next++;
      if (raw[next] === ":") {
        let key: string;
        try { key = JSON.parse(raw.slice(start, i + 1)); } catch { reject("INVALID_JSON"); }
        const keys = stack.at(-1);
        if (!keys || keys.has(key!)) reject("INVALID_DUPLICATE_KEY");
        keys.add(key!);
      }
      nodes++;
    } else if (char === "{" || char === "[") {
      stack.push(char === "{" ? new Set() : null);
      if (stack.length > limits.maxRecursionDepth) reject("LIMIT_DEPTH");
      nodes++;
    } else if (char === "}" || char === "]") stack.pop();
    else if (char === "," || char === ":") nodes++;
    if (nodes > limits.maxAstNodes) reject("LIMIT_NODES");
  }
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { reject("INVALID_JSON"); }
  checkpoint(limits, started);
  return parsed;
}
