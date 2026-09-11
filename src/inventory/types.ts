import type { EvidenceRef } from "../contracts/evidence";

export type SupportedLockfileVersion = 2 | 3;

/** Identity includes ecosystem, name, version and resolved installation path. */
export interface PackageInstance {
  id: string;
  ecosystem: "npm";
  name: string;
  version: string;
  resolvedPath: string;
  direct: boolean;
  contexts: Array<"runtime" | "development" | "optional" | "peer">;
  dependencies: string[];
  evidence: EvidenceRef[];
}

/** Installation provenance only; never a source call edge. */
export interface DependencyEdge {
  fromInstanceId: string;
  toInstanceId: string;
  evidence: EvidenceRef[];
}

export interface InventoryResult {
  lockfileVersion: SupportedLockfileVersion;
  instances: PackageInstance[];
  edges: DependencyEdge[];
}
