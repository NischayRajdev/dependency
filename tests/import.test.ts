import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ScanController } from '../src/orchestration/controller.ts';

const lock = await readFile(new URL('../demo-fixture/package-lock.json', import.meta.url), 'utf8');
const source = await readFile(new URL('../demo-fixture/src/index.js', import.meta.url), 'utf8');
const snapshot = await readFile(new URL('../demo-fixture/advisories/snapshot.json', import.meta.url), 'utf8');
test('Imported text uses real inventory and source analysis deterministically', () => {
  const c = new ScanController(); const r = c.scanText(lock, source, snapshot);
  assert.equal(r.inventory.data?.instances.length, 6);
  assert.equal(r.findings.length, 3);
  assert.equal(r.findings.find(f => f.package.name === 'vulnerable-dep')?.reachability?.status, 'potential_path_found');
  assert.equal(c.scanText(lock, source, snapshot).scan.id, r.scan.id);
  assert.ok(!JSON.stringify(r).includes('/imported-project'));
});
test('Lockfile-only import cannot claim a negative source path', () => {
  const r = new ScanController().scanText(lock, undefined, snapshot);
  assert.equal(r.support.analysedFiles, 0);
  assert.ok(r.findings.every(f => f.reachability?.status === 'unknown'));
});
test('Import rejects malformed and oversized text', () => {
  const c = new ScanController();
  assert.throws(() => c.scanText('{', undefined, snapshot));
  assert.throws(() => c.scanText(' '.repeat(2000000), undefined, snapshot));
});
