//@ts-expect-error Unable to import using module specifcier, therefore pointing directly at the file
import { compress } from "@mongodb-js/zstd/lib/index.js";

export function zipRatio(data: Buffer, method = "zstd" as "zstd" | "") {
  const size = data.length;
  const compressed = method === "zstd" ? compress(data) : Bun.gzipSync(data);
  const compressedSize = compressed.length;
  return { size, compressedSize, ratio: Math.min(compressedSize / size, 1) };
}

export function time<A extends Array<unknown>, R>(fn: (...args: A) => R): (...args: A) => R {
  return (...args: A) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(`[${fn.name.length > 0 ? fn.name: "anonymous"}] ${(end - start).toFixed(2)}ms`);
    return result;
  }
}

const test = (str: string) => str.toUpperCase()

export const inspect: <T>(d: T) => T = (d) => {
  console.dir(d, { depth: null });
  return d;
};
