
export function time<T>(fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`[${fn.name}] ${(end - start).toFixed(2)}ms`);
  return result;
}

export const inspect: <T>(d: T) => T = (d) => {
  console.dir(d, { depth: null });
  return d;
}
