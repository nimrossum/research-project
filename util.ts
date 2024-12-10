import { compress as zstd } from "@mongodb-js/zstd";
import type { Dirent } from "node:fs";
import { readFile } from "node:fs/promises";
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

/**
 * Calculate the normalized compression ratio for all files in a directory
 * NCR_A = (_AR_ - _A_) / _R_
 * where _AR_ is the compressed size of the concatenated files
 * _A_ is the compressed size of the file
 * _R_ is the compressed size of the concatenated files without A
 * @param filePath
 * @param filePaths
 */
export async function calculateNormalizedCompressionRatios(
  filePaths: string[]
) {
  // Maps file path to file content
  const ARawMap = new Map<string, Buffer>();

  // Maps file path to file size
  const AMap = new Map<string, number>();

  // Maps file path to compressed file size
  const _A_Map = new Map<string, number>();

  // Maps file path to rest of the files compressed size
  const _R_map = new Map<string, number>();

  // 1. Read all files into memory, concatenate them and calculate AR
  void (await Promise.all(
    filePaths.map(async (f) => {
      // 1. For each file, read it into memory
      const AFile = await readFile(f);
      const AArrayBufferLike = AFile.buffer;
      const A = AArrayBufferLike.byteLength;
      const ABuffer = Buffer.from(AArrayBufferLike);
      ARawMap.set(f, ABuffer);
      // 2. Compress file
      const _A_ = (await compress(ABuffer, "zstd")).length;
      // 3. Store A and _A_ in a map
      AMap.set(f, A);
      _A_Map.set(f, _A_);
    })
  ));

  const fileBuffers = Array.from(ARawMap.values());
  const concatenatedBuffer = Buffer.concat(fileBuffers);

  const AR = concatenatedBuffer.length;

  // _AR_ is the compressed size of the all files concatenated
  const _AR_ = (await compress(concatenatedBuffer, "zstd")).length;

  // 3. For each file A, calculate the compression R for all files except A
  void (await Promise.all(
    filePaths.map(async (f) => {
      const fileBuffersWithoutF = Array.from(ARawMap.entries())
        .filter(([path]) => path !== f)
        .map(([_, buffer]) => buffer);

      const concatenatedBufferWithoutF = Buffer.concat(fileBuffersWithoutF);
      const compressizedBufferWithoutF = await compress(
        concatenatedBufferWithoutF,
        "zstd"
      );

      _R_map.set(f, compressizedBufferWithoutF.length);
    })
  ));

  // 4. Calculate the normalized compression ratio for each file

  const results = filePaths.map((A) => {
    const _A_ = _A_Map.get(A)!;
    const _R_ = _R_map.get(A)!;
    const NCR_A = (_AR_ - _A_) / _R_;
    return { A, NCR_A };
  });

  return results;
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
