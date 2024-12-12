import { readFile } from "fs/promises";
import { compress } from "./compress.ts";
import assert from "assert";

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
  /** Maps file path to file content */
  const ARawMap = new Map<string, Buffer>();

  /** Maps file path to file size */
  const AMap = new Map<string, number>();

  /** Maps file path to compressed file size */
  const _A_Map = new Map<string, number>();

  /** Maps file path to rest of the files compressed size */
  const _R_map = new Map<string, number>();

  // 1. Read all files into memory
  for (const f of filePaths) {
    // 1. For each file, read it into memory
    const AFile = await readFile(f);
    const ABuffer = AFile;
    const A = ABuffer.length;
    ARawMap.set(f, ABuffer);
    // 2. Compress file
    const _A_ = (await compress(ABuffer, "zstd")).length;
    // 3. Store A and _A_ in a map
    AMap.set(f, A);
    _A_Map.set(f, _A_);
  }

  const fileBuffers = Array.from(ARawMap.values());
  assert(fileBuffers.length === filePaths.length);

  const concatenatedBuffer = Buffer.concat(fileBuffers);

  // _AR_ is the size of the all files concatenated
  const AR = concatenatedBuffer.length;

  // _AR_ is the compressed size of the all files concatenated
  const _AR_ = (await compress(concatenatedBuffer, "zstd")).length;
  assert(_AR_ < AR);

  // 3. For each file A, calculate the compression R for all files except A
  for (const f of filePaths) {
    const fileBuffersWithoutF = Array.from(ARawMap.entries())
      .filter(([path]) => path !== f)
      .map(([_, buffer]) => buffer);

    const concatenatedBufferWithoutF = Buffer.concat(fileBuffersWithoutF);
    assert(
      concatenatedBufferWithoutF.length + AMap.get(f)! ==
        concatenatedBuffer.length
    );
    const compressizedBufferWithoutF = await compress(
      concatenatedBufferWithoutF,
      "zstd"
    );

    _R_map.set(f, compressizedBufferWithoutF.length);
  }

  // 4. Calculate the normalized compression ratio for each file
  const results = filePaths.map((A) => {
    const _A_ = _A_Map.get(A)!;
    const _R_ = _R_map.get(A)!;
    const NCR_A = (_AR_ - _A_) / _R_;
    return { A, NCR_A };
  });

  return results;
}
