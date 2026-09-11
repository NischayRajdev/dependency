import type { EvidenceRef, SourceLocation } from "../contracts/evidence";

export type SupportedPattern =
  | "direct_named_import" | "direct_default_import" | "literal_require"
  | "local_function" | "simple_lexical_alias" | "direct_call" | "cycle";

export type UnsupportedPattern =
  | "dynamic_import_expression" | "computed_require" | "reflection"
  | "dependency_injection" | "framework_callback_registration"
  | "runtime_monkey_patching" | "native_addon" | "generated_code"
  | "bundler_transform" | "typescript_semantics" | "unvalidated_reexport"
  | "other_unsupported";

export interface CoverageGap {
  pattern: UnsupportedPattern;
  count: number;
  locations: SourceLocation[];
  reason: string;
  evidence: EvidenceRef[];
}

export interface SymbolRef {
  id: string;
  location: SourceLocation;
  packageInstanceId?: string;
}

export interface CallEdge {
  from: SymbolRef;
  to: SymbolRef;
  location: SourceLocation;
  bindingMethod: string;
  resolutionMethod: string;
  assumptions: string[];
  evidence: EvidenceRef[];
}

export interface CallPath {
  entryPoint: SourceLocation;
  edges: CallEdge[];
  mappingId?: string;
}

export type ReachabilityStatus =
  | "potential_path_found" | "invocation_observed"
  | "no_path_found_in_scope" | "unknown";

/** A bounded negative never establishes safety or unreachability. */
export interface ReachabilityResult {
  status: ReachabilityStatus;
  entryPoints: SourceLocation[];
  paths: CallPath[];
  unsupportedPatterns: CoverageGap[];
  assumptions: string[];
  evidence: EvidenceRef[];
}
