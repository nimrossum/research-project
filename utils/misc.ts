export function time<A extends readonly unknown[], R>(
  fn: (...args: A) => R
): (...args: A) => R {
  return (...args: A) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(
      `⏳ ${(
        end - start
      ).toFixed(2)}ms [${fn.name.length > 0 ? fn.name : "anonymous"}]`
    );
    return result;
  };
}

export const inspect: <T>(d: T) => T = (d) => {
  console.dir(d, { depth: null });
  return d;
};
