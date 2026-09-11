import { ScanController, type EngineMocks, type ScanRequest } from "../orchestration/controller.ts";
import { BoundaryError } from "../security/boundary.ts";
import type { Finding } from "../contracts/API_CONTRACTS.ts";

export interface CliOptions {
  projectRoot: string;
  lockfile: string;
  mocks?: EngineMocks;
}

/**
 * Deterministically sorts findings by ID
 */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Runs the CLI program programmatically and returns the JSON string output.
 */
export async function runCli(options: CliOptions): Promise<string> {
  const controller = new ScanController();
  
  const req: ScanRequest = {
    projectRoot: options.projectRoot,
    lockfile: options.lockfile,
    entryPoints: [],
    policyVersion: "1.0",
    catalogVersion: "1.0",
    limitsProfile: "default"
  };

  try {
    const scanId = await controller.startScan(req, options.mocks);
    const findings = controller.getScanFindings(scanId);
    const sorted = sortFindings(findings);
    
    return JSON.stringify(sorted, null, 2);
  } catch (error) {
    if (error instanceof BoundaryError) {
      return JSON.stringify({ error: error.message });
    }
    throw error;
  }
}
