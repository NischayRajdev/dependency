import type { EvidenceRef } from "../contracts/evidence";
import type { SupportedPattern, UnsupportedPattern } from "../reachability/types";

export type Applicability = "applicable" | "not_applicable" | "unknown";

export interface AdvisoryRecord {
  id: string;
  aliases: string[];
  ecosystem: "npm";
  packageName: string;
  affectedRanges: string[];
  fixedVersions: string[];
  withdrawal: "withdrawn" | "not_withdrawn" | "unknown";
  sourceUrl: string;
  retrievedAt: string;
  modifiedAt?: string;
  contentDigest: string;
  affectedInstanceIds: string[];
  evidence: EvidenceRef[];
}

/** Acceptance requires independent human review; this type is not approval. */
export interface VulnerableFunctionMapping {
  id: string;
  version: string;
  packageName: string;
  supportedVersionRange: string;
  advisoryAliases: string[];
  upstreamEvidence: EvidenceRef[];
  publicEntrySymbol: string;
  affectedInternalSymbol?: string;
  triggeringPreconditions: string[];
  method: string;
  limitations: string[];
  author: string;
  independentReviewer: string;
  supportedPatterns: SupportedPattern[];
  unsupportedPatterns: UnsupportedPattern[];
}
