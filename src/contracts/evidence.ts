export interface EvidenceRef {
  id: string;
  kind: "source" | "lockfile" | "advisory" | "metadata" | "policy" | "test" | "derived";
  locator: string;
  sourceUrl?: string;
  contentDigest: string;
  observedAt?: string;
  method?: string;
}

export type Completion = "complete" | "partial" | "unsupported" | "failed";

export interface SafeDiagnostic {
  code: string;
  message: string;
  evidence: EvidenceRef[];
}

export interface ComponentResult<T> {
  status: Completion;
  data?: T;
  reasons: EvidenceRef[];
  limitsHit: string[];
  diagnostics: SafeDiagnostic[];
}

export interface SourceLocation {
  evidence: EvidenceRef;
  line: number;
  column: number;
}
