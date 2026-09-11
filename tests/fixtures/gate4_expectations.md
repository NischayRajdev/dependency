# Gate 4: Safety Boundary Expectations

These test expectations define the behavior for the core security boundary logic, ensuring that we never parse/execute dangerous files or expose sensitive output.

## 1. Path canonicalization and symlink escapes

Verify that `resolveSafePath(root, target)` correctly locks resolution inside `root`.

| ID | Root | Target | Expected Status | Notes |
|----|------|--------|-----------------|-------|
| P1 | `/safe/root` | `/safe/root/src/index.js` | returns `/safe/root/src/index.js` | Normal |
| P2 | `/safe/root` | `../src/index.js` | throws BoundaryError | Traversal attempt |
| P3 | `/safe/root` | `/etc/passwd` | throws BoundaryError | Absolute escape |
| P4 | `/safe/root` | `/safe/root/symlink-out` | throws BoundaryError | Symlink points to `/outside` |
| P5 | `/safe/root` | `/safe/root/symlink-in` | returns `/safe/root/real/file.js` | Symlink points inside root |

## 2. File size bounded reads

Verify that `readTextFileSafe(path, maxBytes)` prevents huge file allocations.

| ID | File size | `maxBytes` | Expected Status |
|----|-----------|------------|-----------------|
| F1 | 10 KB | 100 KB | returns content |
| F2 | 200 KB | 100 KB | throws BoundaryError |

## 3. Hostile HTML escaping for reports

Verify that `escapeHtml(text)` correctly makes text inert.

| ID | Input Text | Expected Output |
|----|------------|-----------------|
| H1 | `<script>alert(1)</script>` | `&lt;script&gt;alert(1)&lt;/script&gt;` |
| H2 | `"onmouseover=alert(1)` | `&quot;onmouseover=alert(1)` |
| H3 | `a & b` | `a &amp; b` |
| H4 | `'` | `&#39;` |
