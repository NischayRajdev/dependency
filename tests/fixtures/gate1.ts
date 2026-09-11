// Synthetic algorithm fixtures. Author: Codex. Independent review: pending.
// Expected results were specified before implementing the analysers.
export const lockfile = {
  name: "fixture", version: "1.0.0", lockfileVersion: 3,
  packages: {
    "": { name: "fixture", version: "1.0.0", dependencies: { a: "1.0.0", renamed: "npm:actual@1.0.0" }, devDependencies: { dev: "1.0.0" }, optionalDependencies: { opt: "1.0.0" } },
    "node_modules/a": { version: "1.0.0", dependencies: { shared: "1.0.0" } },
    "node_modules/a/node_modules/shared": { version: "1.0.0" },
    "node_modules/shared": { version: "2.0.0" },
    "node_modules/renamed": { name: "actual", version: "1.0.0" },
    "node_modules/dev": { version: "1.0.0", dev: true },
    "node_modules/opt": { version: "1.0.0", optional: true },
  },
};

export const expectedInstances = [
  ["node_modules/a", "a", "1.0.0", true, ["runtime"]],
  ["node_modules/a/node_modules/shared", "shared", "1.0.0", false, ["runtime"]],
  ["node_modules/dev", "dev", "1.0.0", true, ["development"]],
  ["node_modules/opt", "opt", "1.0.0", true, ["optional"]],
  ["node_modules/renamed", "actual", "1.0.0", true, ["runtime"]],
  ["node_modules/shared", "shared", "2.0.0", false, ["runtime"]],
];

export const expectedEdges = [["node_modules/a", "node_modules/a/node_modules/shared"]];

export const osv = {
  schema_version: "1.7.0", id: "SYNTHETIC-01", modified: "2026-09-01T00:00:00Z",
  aliases: ["SYNTHETIC-ALIAS", "SYNTHETIC-ALIAS"],
  affected: [{ package: { ecosystem: "npm", name: "a" },
    ranges: [
      { type: "SEMVER", events: [{ introduced: "1.0.0" }, { fixed: "1.1.0" }] },
      { type: "SEMVER", events: [{ introduced: "2.0.0" }, { last_affected: "2.0.1" }] },
    ],
  }],
};

export const versionExpectations = [
  ["0.9.9", "not_applicable"], ["1.0.0", "applicable"],
  ["1.1.0-beta.1", "applicable"], ["1.1.0", "not_applicable"],
  ["1.9.9", "not_applicable"], ["2.0.0", "applicable"],
  ["2.0.1", "applicable"], ["2.0.2", "not_applicable"],
] as const;
