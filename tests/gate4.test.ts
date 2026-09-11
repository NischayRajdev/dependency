import { test } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { resolveSafePath, readTextFileSafe, escapeHtml, BoundaryError } from "../src/security/boundary.ts";
import os from "node:os";

test("Gate 4 - P1: Safe path resolution", async () => {
  let root = await fs.mkdtemp(path.join(os.tmpdir(), "gate4-"));
  root = await fs.realpath(root);
  const safePath = path.join(root, "src/index.js");
  const result = await resolveSafePath(root, "src/index.js");
  assert.strictEqual(result, safePath);
});

test("Gate 4 - P2: Traversal attempt", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate4-"));
  await assert.rejects(resolveSafePath(root, "../src/index.js"), BoundaryError);
});

test("Gate 4 - P3: Absolute escape", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate4-"));
  await assert.rejects(resolveSafePath(root, "/etc/passwd"), BoundaryError);
});

test("Gate 4 - P4: Symlink escape outside", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate4-"));
  const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), "gate4-outside-"));
  const outsideFile = path.join(outsideDir, "secret.txt");
  await fs.writeFile(outsideFile, "secret");

  const linkPath = path.join(root, "symlink-out");
  await fs.symlink(outsideFile, linkPath);

  await assert.rejects(resolveSafePath(root, "symlink-out"), BoundaryError);
});

test("Gate 4 - P5: Symlink inside root", async () => {
  let root = await fs.mkdtemp(path.join(os.tmpdir(), "gate4-"));
  root = await fs.realpath(root);
  const insideDir = path.join(root, "real");
  await fs.mkdir(insideDir);
  const insideFile = path.join(insideDir, "file.js");
  await fs.writeFile(insideFile, "console.log('hi')");

  const linkPath = path.join(root, "symlink-in");
  await fs.symlink(insideFile, linkPath);

  const result = await resolveSafePath(root, "symlink-in");
  assert.strictEqual(result, insideFile); // resolves to the real path
});

test("Gate 4 - F1: Bounded read success", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate4-"));
  const file = path.join(root, "small.txt");
  await fs.writeFile(file, "hello");
  
  const content = await readTextFileSafe(file, 1024);
  assert.strictEqual(content, "hello");
});

test("Gate 4 - F2: Bounded read exceeds size", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gate4-"));
  const file = path.join(root, "large.txt");
  await fs.writeFile(file, "a".repeat(2048));
  
  await assert.rejects(readTextFileSafe(file, 1024), BoundaryError);
});

test("Gate 4 - H1: Escape HTML script tag", () => {
  const result = escapeHtml("<script>alert(1)</script>");
  assert.strictEqual(result, "&lt;script&gt;alert(1)&lt;/script&gt;");
});

test("Gate 4 - H2: Escape HTML attribute injection", () => {
  const result = escapeHtml('"onmouseover=alert(1)');
  assert.strictEqual(result, "&quot;onmouseover=alert(1)");
});

test("Gate 4 - H3: Escape HTML ampersand", () => {
  const result = escapeHtml("a & b");
  assert.strictEqual(result, "a &amp; b");
});

test("Gate 4 - H4: Escape HTML quote", () => {
  const result = escapeHtml("'");
  assert.strictEqual(result, "&#39;");
});
