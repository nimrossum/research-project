import { compress as zstd } from "@mongodb-js/zstd";
import type { Dirent } from "node:fs";
import { join } from "node:path";

const compressionAlgorithms = {
  zstd: zstd,
};

export function compress(
  data: Buffer,
  method: keyof typeof compressionAlgorithms
) {
  return compressionAlgorithms[method](data);
}

export const zipRatioFactory =
  (compressor: (data: Buffer) => Promise<Buffer>) => async (data: Buffer) => {
    const size = data.length;
    const compressed = await compressor(data);
    const compressedSize = compressed.length;
    return { size, compressedSize, ratio: Math.min(compressedSize / size, 1) };
  };

export const zipRatio = zipRatioFactory(
  async (data) => await compress(data, "zstd")
);

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
