import * as fs from "node:fs/promises";
import * as path from "node:path";

export class BoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoundaryError";
  }
}

function contained(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

/**
 * Resolves a target path ensuring it is strictly contained within the root directory.
 * Evaluates physical symlinks to prevent traversal attacks.
 */
export async function resolveSafePath(root: string, target: string): Promise<string> {
  const absoluteRoot = await fs.realpath(path.resolve(root)).catch(() => path.resolve(root));
  const absoluteTarget = path.resolve(absoluteRoot, target);

  // Quick check for overt traversal
  if (!contained(absoluteRoot, absoluteTarget)) {
    throw new BoundaryError("PATH_ESCAPE");
  }

  try {
    // Check real physical path to defeat symlinks
    const realTarget = await fs.realpath(absoluteTarget);
    if (!contained(absoluteRoot, realTarget)) {
      throw new BoundaryError("SYMLINK_ESCAPE");
    }
    return realTarget;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      // The file might not exist yet, but the logical path must still be bounded
      return absoluteTarget;
    }
    throw err;
  }
}

/**
 * Reads a text file, enforcing a strict maximum size limit to prevent memory exhaustion (DoS).
 */
export async function readTextFileSafe(filePath: string, maxBytes: number): Promise<string> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new BoundaryError("INVALID_SIZE_LIMIT");
  const stat = await fs.stat(filePath);
  if (!stat.isFile()) throw new BoundaryError("SPECIAL_FILE_REJECTED");
  if (stat.size > maxBytes) {
    throw new BoundaryError("FILE_SIZE_LIMIT");
  }
  return await fs.readFile(filePath, "utf-8");
}

/**
 * Escapes characters that are meaningful in HTML to prevent XSS injection in reports.
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
