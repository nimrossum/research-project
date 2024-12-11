import type { Dirent } from "node:fs";
import { join } from "node:path";

export function time<A extends readonly unknown[], R>(
  fn: (...args: A) => R
): (...args: A) => R {
  return (...args: A) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(
      `[${fn.name.length > 0 ? fn.name : "anonymous"}] ${(end - start).toFixed(
        2
      )}ms`
    );
    return result;
  };
}

export const inspect: <T>(d: T) => T = (d) => {
  console.dir(d, { depth: null });
  return d;
};

export const asyncIteratorToArray = async <T>(
  iterator: AsyncIterable<T>
): Promise<T[]> => {
  const result: T[] = [];
  for await (const item of iterator) {
    result.push(item);
  }
  return result;
};

export const direntToPath = (dirent: Dirent) =>
  join(dirent.parentPath, dirent.name);
