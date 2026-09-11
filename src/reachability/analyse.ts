import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import { checkpoint, guard, complete, reject, defaultLimits, evidence } from "../contracts/core.ts";
import type { ResourceLimits } from "../orchestrator/types.ts";
import type { ComponentResult, SourceLocation } from "../contracts/evidence.ts";
import type { ReachabilityResult, ReachabilityStatus, CoverageGap, CallPath, SupportedPattern, UnsupportedPattern } from "./types.ts";

export interface ReachabilityContext {
  readFile: (path: string) => string | undefined;
  resolveModule: (fromPath: string, specifier: string) => string | undefined;
  getPackageInstanceId: (resolvedId: string) => string | undefined;
}

export function analyseReachability(
  entryPoints: string[],
  targetPackageInstanceId: string,
  context: ReachabilityContext,
  limits: ResourceLimits = defaultLimits,
  started: number = performance.now()
): ComponentResult<ReachabilityResult> {
  return guard(() => {
    const parsedFiles = new Map<string, t.File>();
    const fileScopes = new Map<string, string[]>(); // Map file to its top-level functions
    const callEdges = new Set<string>(); // "fromScope->toScope"
    const packageInvocations = new Set<string>(); // "scope->packageId"
    const unsupportedPatterns: CoverageGap[] = [];
    const unsupportedPackageIds = new Set<string>();
    let genericUnsupported = false;

    const queue = [...entryPoints];
    const visitedFiles = new Set<string>();

    // Pass 1: Parse and extract call graph
    while (queue.length > 0) {
      checkpoint(limits, started);
      const filePath = queue.shift()!;
      if (visitedFiles.has(filePath)) continue;
      visitedFiles.add(filePath);
      
      if (visitedFiles.size > limits.maxFiles) reject("LIMIT_FILES");

      const content = context.readFile(filePath);
      if (!content) continue;

      let ast: t.File;
      try {
        ast = parse(content, {
          sourceType: "unambiguous",
          allowImportExportEverywhere: true,
          plugins: ["jsx"],
        });
      } catch {
        continue; // ignore unparseable
      }
      parsedFiles.set(filePath, ast);

      const bindings = new Map<string, { kind: "import" | "require", source: string }>();

      // A simple stack to track which function scope we are currently inside
      const scopeStack: string[] = [filePath]; // root scope is the file itself

      traverse(ast, {
        enter(path) {
          checkpoint(limits, started);
        },
        ImportDeclaration(path) {
          const source = path.node.source.value;
          const resolved = context.resolveModule(filePath, source);
          if (resolved) {
            for (const spec of path.node.specifiers) {
              bindings.set(spec.local.name, { kind: "import", source: resolved });
            }
            if (!context.getPackageInstanceId(resolved)) {
              // local module, traverse it
              queue.push(resolved);
            }
          }
        },
        CallExpression(path) {
          if (path.node.callee.type === "Import") {
            const argument = path.node.arguments[0];
            if (argument?.type === "StringLiteral") {
              const resolved = context.resolveModule(filePath, argument.value);
              const packageId = resolved ? context.getPackageInstanceId(resolved) : undefined;
              if (packageId) unsupportedPackageIds.add(packageId); else genericUnsupported = true;
            } else genericUnsupported = true;
            unsupportedPatterns.push({
              pattern: "dynamic_import_expression",
              count: 1, locations: [], reason: "Dynamic import", evidence: []
            });
            return;
          }

          let scopeId = filePath;
          const fnParent = path.scope.getFunctionParent();
          if (fnParent && fnParent.path.node.loc) {
             const fnNode = fnParent.path.node as any;
             let name = "";
             if (fnNode.id && fnNode.id.name) {
                name = fnNode.id.name;
             }
             scopeId = name ? `${filePath}:${name}` : `${filePath}:${fnNode.loc.start.line}:${fnNode.loc.start.column}`;
          }

          if (path.node.callee.type === "Identifier" && path.node.callee.name === "require") {
            const arg = path.node.arguments[0];
            if (arg && arg.type === "StringLiteral") {
               const resolved = context.resolveModule(filePath, arg.value);
               if (resolved) {
                  // Bind it if it's in a declarator
                  if (path.parent.type === "VariableDeclarator") {
                     if (path.parent.id.type === "Identifier") {
                        bindings.set(path.parent.id.name, { kind: "require", source: resolved });
                     } else if (path.parent.id.type === "ObjectPattern") {
                        for (const prop of path.parent.id.properties) {
                           if (prop.type === "ObjectProperty" && prop.value.type === "Identifier") {
                              bindings.set(prop.value.name, { kind: "require", source: resolved });
                           }
                        }
                     }
                  } else if (path.parent.type === "AssignmentExpression") {
                     // e.g. global.fs = require('packageP')
                     if (path.parent.left.type === "MemberExpression" && path.parent.left.object.type === "Identifier" && path.parent.left.object.name === "global") {
                        bindings.set(path.parent.left.property.type === "Identifier" ? path.parent.left.property.name : "global", { kind: "require", source: resolved });
                     }
                  } else if (path.parent.type === "CallExpression" && (path.parent as t.CallExpression).callee !== path.node) {
                     // e.g. [1].map(require('packageX')) -- require used as argument
                     const pkgId = context.getPackageInstanceId(resolved);
                     if (pkgId) {
                        genericUnsupported = true;
                        unsupportedPatterns.push({ pattern: "framework_callback_registration", count: 1, locations: [], reason: "Require used as argument", evidence: [] });
                     }
                  }
                  
                  // For direct require calls like require('packageK')()
                  if (path.parent.type === "CallExpression" && (path.parent as t.CallExpression).callee === path.node) {
                     const pkgId = context.getPackageInstanceId(resolved);
                     if (pkgId) {
                        packageInvocations.add(`${scopeId}->${pkgId}`);
                     } else {
                        callEdges.add(`${scopeId}->${resolved}`);
                     }
                  }

                  if (!context.getPackageInstanceId(resolved)) {
                    queue.push(resolved);
                  }
               }
            } else {
               genericUnsupported = true;
               unsupportedPatterns.push({ pattern: "computed_require", count: 1, locations: [], reason: "Computed require", evidence: [] });
            }
          }

          if (path.node.callee.type === "Identifier" && path.node.callee.name === "eval") {
             genericUnsupported = true;
             unsupportedPatterns.push({ pattern: "other_unsupported", count: 1, locations: [], reason: "eval", evidence: [] });
          }

          if (path.node.callee.type === "MemberExpression" && path.node.callee.object.type === "Identifier" && path.node.callee.object.name === "injector") {
             genericUnsupported = true;
             unsupportedPatterns.push({ pattern: "dependency_injection", count: 1, locations: [], reason: "DI container", evidence: [] });
          }
          
          let targetId: string | undefined;
          
          if (path.node.callee.type === "Identifier") {
             targetId = path.node.callee.name;
          } else if (path.node.callee.type === "MemberExpression") {
             let obj = path.node.callee.object;
             while (obj.type === "CallExpression") {
                 obj = obj.callee as t.Expression | t.Super;
                 if (obj.type === "MemberExpression") obj = obj.object;
             }
             if (obj.type === "Identifier") {
                 targetId = obj.name;
             }
             if (path.node.callee.computed && path.node.callee.property.type !== "NumericLiteral" && path.node.callee.property.type !== "StringLiteral") {
                genericUnsupported = true;
                unsupportedPatterns.push({ pattern: "other_unsupported", count: 1, locations: [], reason: "Computed member access", evidence: [] });
             }
          }

          if (targetId && targetId !== "require") {
             const binding = path.scope.getBinding(targetId);
             // Ensure this identifier binds to the top-level import, not a shadowed local parameter
             if (binding && binding.scope === path.scope.getProgramParent()) {
                 const localBinding = bindings.get(targetId);
                 if (localBinding) {
                    const pkgId = context.getPackageInstanceId(localBinding.source);
                    if (pkgId) {
                       packageInvocations.add(`${scopeId}->${pkgId}`);
                    } else {
                       callEdges.add(`${scopeId}->${localBinding.source}:${targetId}`);
                    }
                 } else if (binding.path.isFunction() && binding.path.node.loc) {
                    const fnNode = binding.path.node as any;
                    let name = "";
                    if (fnNode.id && fnNode.id.name) name = fnNode.id.name;
                    const fallback = `${fnNode.loc.start.line}:${fnNode.loc.start.column}`;
                    callEdges.add(`${scopeId}->${filePath}:${name ? name : fallback}`);
                 }
             } else if (!binding) {
                 // Might be global or unbound? Fallback to localBinding just in case (e.g. implicitly global?)
                 const localBinding = bindings.get(targetId);
                 if (localBinding) {
                    const pkgId = context.getPackageInstanceId(localBinding.source);
                    if (pkgId) {
                       packageInvocations.add(`${scopeId}->${pkgId}`);
                    }
                 }
             }
          }
        },
        ImportExpression(path) {
           const source = path.node.source;
           if (source.type === "StringLiteral") {
             const resolved = context.resolveModule(filePath, source.value);
             const packageId = resolved ? context.getPackageInstanceId(resolved) : undefined;
             if (packageId) unsupportedPackageIds.add(packageId); else genericUnsupported = true;
           } else genericUnsupported = true;
           unsupportedPatterns.push({ pattern: "dynamic_import_expression", count: 1, locations: [], reason: "Dynamic import", evidence: [] });
        },
        Identifier(path) {
           if (path.parent.type !== "CallExpression" && path.parent.type !== "MemberExpression") {
              const binding = path.scope.getBinding(path.node.name);
              if (binding && binding.scope === path.scope.getProgramParent()) {
                  const localBinding = bindings.get(path.node.name);
                  if (localBinding && context.getPackageInstanceId(localBinding.source)) {
                     if ((path.parent.type as string) === "ArrayExpression") {
                         genericUnsupported = true;
                         unsupportedPatterns.push({ pattern: "framework_callback_registration", count: 1, locations: [], reason: "Imported binding used as value", evidence: [] });
                     }
                  }
              }
           }
        },
        AssignmentExpression(path) {
           if (path.node.left.type === "MemberExpression" && path.node.left.object.type === "Identifier" && path.node.left.object.name === "global") {
              genericUnsupported = true;
              unsupportedPatterns.push({
                 pattern: "runtime_monkey_patching",
                 count: 1, locations: [], reason: "Monkey patching global", evidence: []
              });
           }
        }
      });
    }

    // Graph reachability
    let reachable = false;
    const reachableScopes = new Set<string>(entryPoints);
    let changed = true;
    while (changed) {
       changed = false;
       for (const edge of callEdges) {
          const [from, to] = edge.split("->");
          if (reachableScopes.has(from) && !reachableScopes.has(to)) {
             reachableScopes.add(to);
             changed = true;
          }
       }
    }

    for (const scope of reachableScopes) {
       if (packageInvocations.has(`${scope}->${targetPackageInstanceId}`)) {
          reachable = true;
          break;
       }
    }

    let status: ReachabilityStatus = "no_path_found_in_scope";
    if (reachable && !genericUnsupported && !unsupportedPackageIds.has(targetPackageInstanceId)) {
       status = "potential_path_found";
    } else if (genericUnsupported || unsupportedPackageIds.has(targetPackageInstanceId)) {
       status = "unknown";
    }

    return complete({
      status,
      entryPoints: entryPoints.map(p => ({ evidence: evidence("source", p), line: 1, column: 1 })),
      paths: [],
      unsupportedPatterns,
      assumptions: [],
      evidence: []
    });
  });
}
