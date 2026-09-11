import type { ComponentResult } from "../contracts/evidence.ts";
import type { ResourceLimits } from "../orchestrator/types.ts";
import type { InventoryResult, PackageInstance } from "./types.ts";
import { checkpoint, complete, digest, evidence, failure, guard, object, parseJson, reject, text } from "../contracts/core.ts";
import { validVersion } from "../advisories/semver.ts";

const namePattern = /^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i;
function name(value: unknown): string {
  const result = text(value);
  if (!namePattern.test(result) || result.split("/").some(part => part === "." || part === "..")) reject("UNSUPPORTED_PACKAGE_NAME");
  return result;
}

function pathName(path: string, limits: ResourceLimits): string {
  const segments = path.split("/node_modules/");
  if (segments.length > limits.maxTraversalDepth) reject("LIMIT_TRAVERSAL_DEPTH");
  if (!path.startsWith("node_modules/")) reject("UNSUPPORTED_PACKAGE_PATH");
  segments[0] = segments[0].slice("node_modules/".length);
  segments.forEach(name);
  return segments.at(-1)!;
}

function declarations(record: Record<string, unknown>, field: string): Record<string, unknown> {
  if (record[field] === undefined) return {};
  const result = object(record[field]);
  for (const [key, value] of Object.entries(result)) { name(key); text(value); }
  return result;
}

/** Reads only supplied JSON text. Does not open files or install target packages. */
export function analyseLockfile(raw: string, limits: ResourceLimits): ComponentResult<InventoryResult> {
  return guard(() => {
    const started = performance.now();
    const lock = object(parseJson(raw, limits, started, limits.maxFileBytes));
    if (lock.lockfileVersion !== 2 && lock.lockfileVersion !== 3) reject("UNSUPPORTED_LOCKFILE_VERSION");
    const packages = object(lock.packages), root = object(packages[""]);
    if (root.workspaces !== undefined) reject("UNSUPPORTED_WORKSPACES");
    const paths = Object.keys(packages).filter(path => path !== "").sort();
    if (paths.length > limits.maxGraphNodes) reject("LIMIT_GRAPH_NODES");
    const source = evidence("lockfile", raw);
    const instances = new Map<string, PackageInstance>();
    const rootDependencies = { ...declarations(root, "dependencies"), ...declarations(root, "devDependencies"), ...declarations(root, "optionalDependencies"), ...declarations(root, "peerDependencies") };
    for (const path of paths) {
      checkpoint(limits, started);
      const installedName = pathName(path, limits), pkg = object(packages[path]);
      if (pkg.link !== undefined && pkg.link !== false) reject("UNSUPPORTED_LINK");
      if (pkg.workspaces !== undefined) reject("UNSUPPORTED_WORKSPACES");
      for (const flag of ["dev", "optional", "devOptional", "peer"]) {
        if (pkg[flag] !== undefined && typeof pkg[flag] !== "boolean") reject("INVALID_PACKAGE_FLAG");
      }
      const packageName = pkg.name === undefined ? installedName : name(pkg.name);
      const version = text(pkg.version);
      if (!validVersion(version)) reject("UNSUPPORTED_PACKAGE_VERSION");
      const contexts: PackageInstance["contexts"] = [];
      if (pkg.dev || pkg.devOptional) contexts.push("development");
      if (pkg.optional || pkg.devOptional) contexts.push("optional");
      if (pkg.peer) contexts.push("peer");
      if (!pkg.dev && !pkg.optional && !pkg.devOptional) contexts.unshift("runtime");
      const direct = path === `node_modules/${installedName}` && Object.hasOwn(rootDependencies, installedName);
      instances.set(path, { id: digest(JSON.stringify(["npm", packageName, version, path])), ecosystem: "npm", name: packageName, version, resolvedPath: path, direct, contexts, dependencies: [], evidence: [source] });
    }
    const result = complete<InventoryResult>({ lockfileVersion: lock.lockfileVersion, instances: [...instances.values()], edges: [] });
    const reportGap = (code: string) => {
      const gap = failure<InventoryResult>(code, [source]);
      result.status = "partial";
      result.reasons.push(...gap.reasons);
      result.diagnostics.push(...gap.diagnostics);
    };
    let edgeCount = 0;
    for (const path of ["", ...paths]) {
      checkpoint(limits, started);
      const pkg = object(packages[path]);
      const deps = { ...declarations(pkg, "dependencies"), ...(path === "" ? declarations(pkg, "devDependencies") : {}), ...declarations(pkg, "optionalDependencies") };
      const peers = declarations(pkg, "peerDependencies");
      const all = new Set([...Object.keys(deps), ...Object.keys(peers)]);
      for (const key of [...all].sort()) {
        checkpoint(limits, started);
        if (++edgeCount > limits.maxGraphEdges) reject("LIMIT_GRAPH_EDGES");
        // Peer resolution and arbitrary npm specs require a separate validated resolver.
        if (!Object.hasOwn(deps, key)) { reportGap("UNSUPPORTED_PEER_RESOLUTION"); continue; }
        const spec = text(deps[key]);
        const alias = /^npm:((?:@[^/]+\/)?[^@]+)@(.+)$/.exec(spec);
        if (/^(?:file:|link:|workspace:|git|https?:)/.test(spec)) { reportGap("UNSUPPORTED_DEPENDENCY_SPEC"); continue; }
        let owner = path;
        let target: PackageInstance | undefined;
        for (;;) {
          target = instances.get(`${owner ? owner + "/" : ""}node_modules/${key}`);
          if (target || !owner) break;
          const index = owner.lastIndexOf("/node_modules/");
          owner = index < 0 ? "" : owner.slice(0, index);
        }
        if (!target) { reportGap("INVALID_MISSING_DEPENDENCY"); continue; }
        if (target.name !== (alias ? name(alias[1]) : key) || (alias && !alias[2])) {
          reportGap("INVALID_ALIAS_TARGET"); continue;
        }
        if (path) {
          const from = instances.get(path)!;
          from.dependencies.push(target.id);
          result.data!.edges.push({ fromInstanceId: from.id, toInstanceId: target.id, evidence: [source] });
        }
      }
    }
    for (const instance of instances.values()) instance.dependencies = [...new Set(instance.dependencies)].sort();
    checkpoint(limits, started);
    return result;
  });
}
