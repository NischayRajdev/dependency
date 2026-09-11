/** Exact SemVer 2 precedence only; not an npm range-expression parser. */
export function validVersion(version: string): boolean {
  if (typeof version !== "string" || version.length > 256) return false;
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(version);
  return !!match && (!match[4] || match[4].split(".").every(id => !/^\d+$/.test(id) || id === "0" || !id.startsWith("0")));
}

export function compareVersions(left: string, right: string): number {
  if (!validVersion(left) || !validVersion(right)) throw new Error("INVALID_VERSION");
  const parts = (version: string) => version.split("+")[0].split(/-(.*)/s);
  const [a, preA] = parts(left), [b, preB] = parts(right);
  const numeric = (x: string, y: string) => x.length - y.length || (x < y ? -1 : x > y ? 1 : 0);
  const aa = a.split("."), bb = b.split(".");
  for (let i = 0; i < 3; i++) { const difference = numeric(aa[i], bb[i]); if (difference) return Math.sign(difference); }
  if (preA === undefined || preB === undefined) return preA === preB ? 0 : preA === undefined ? 1 : -1;
  const pa = preA.split("."), pb = preB.split(".");
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if (pa[i] === undefined || pb[i] === undefined) return pa[i] === undefined ? -1 : 1;
    const an = /^\d+$/.test(pa[i]), bn = /^\d+$/.test(pb[i]);
    const difference = an && bn ? numeric(pa[i], pb[i]) : an !== bn ? an ? -1 : 1 : pa[i] < pb[i] ? -1 : pa[i] > pb[i] ? 1 : 0;
    if (difference) return Math.sign(difference);
  }
  return 0;
}
