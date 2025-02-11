import { stat } from "node:fs/promises";
import ignore from "ignore";
import { formatMsTime, time } from "./utils/misc.ts";
import { asyncIteratorToArray } from "./utils/iterator.ts";
import { calculateNormalizedCompressionDistances } from "./NCD/ncd.ts";

import { compress } from "@/utils/compress.ts";
import { readFileSync } from "node:fs";
import { streamDirectoryScanner, type DirectoryScannerOptions } from "@/utils/file.ts";

/**
 * Compute the normalized compression ratio for all code files
 * (according to the include extensions) in a directory,
 * excluding files that match the patterns in the .gitignore file
 *
 * @param targetDirectory The directory to scan
 * @param options Options for the scan
 * @param options.include An array of glob patterns to include (defaults to all files)
 * @param options.exclude An array of glob patterns to exclude (defaults to node_modules, dist, build, bin, obj, out)
 * @param options.excludeGitIgnore Whether to exclude files that match the .gitignore file
 *
 * @returns An array of results containing the file path and the NCD
 */
export async function computeNCDForRepositoryFiles(
  targetDirectory: string,
  dirReaderOptions: DirectoryScannerOptions
) {
  // Read file tree recursively
  const filterPaths = async (dir: string) =>
    await asyncIteratorToArray(streamDirectoryScanner(dir, dirReaderOptions));

  const entries = await time(filterPaths)(targetDirectory);
  const length = entries.length;
  !global.silent && console.log(`✅ Found ${length.toLocaleString()} files`);

  return await calculateNormalizedCompressionDistances(entries);
}

/**
 * Compute pairwise NCD for all files in a directory
 * @param targetDirectory
 * @param excludeGitignore
 * @param includeGlobPatterns
 */
export async function computePairwiseNCD(
  targetDirectory: string,
  dirReaderOptions: DirectoryScannerOptions
) {
  // Read file tree recursively
  const filterPaths = async (dir: string) =>
    await asyncIteratorToArray(streamDirectoryScanner(dir, dirReaderOptions));

  let entries = await time(filterPaths)(targetDirectory);
  entries.sort();
  const length = entries.length;
  console.log(`✅ Found ${length.toLocaleString()} files`);

  const mkKey = (a: string, b: string) => [a, b].sort().join("|");

  const goal = (length + length * length) / 2;
  const startTime = performance.now();
  let lastPrintTime = 0;
  let i = 1;

  const z = (data: Buffer) => compress(data, "zstd");

  const bufferCache = new Map<string, Buffer>();
  const compressedBufferCache = new Map<string, Buffer>();
  // Not sure if it is faster to read the length directly from the buffer or cache it in a map
  // const compressedBufferSizeCache = new Map<string, number>();

  const getBuffer = (path: string) => {
    if (bufferCache.has(path)) {
      return bufferCache.get(path)!;
    }
    const buffer = readFileSync(path);
    bufferCache.set(path, buffer);
    return buffer;
  };

  const getCompressedBuffer = async (path: string) => {
    const cached_C_ = compressedBufferCache.get(path);
    if (cached_C_) {
      return cached_C_;
    }

    const buffer = getBuffer(path);
    const compressedBuffer = await z(buffer);
    compressedBufferCache.set(path, compressedBuffer);
    return compressedBuffer;
  };

  const getCompressedBufferSize = async (path: string) => {
    return (await getCompressedBuffer(path)).length;
  };

  console.log()
  console.log()

  const map = await time(async () => {
    const map = new Map<string, number>();

    let fileCount = 0;
    for (const x of entries) {

      const xBuffer = getBuffer(x);
      const C_x = await getCompressedBufferSize(x);

      for (const y of entries) {
        const xy = mkKey(x, y);

        if (map.has(xy)) {
          continue;
        }

        const yBuffer = getBuffer(y);
        const C_y = await getCompressedBufferSize(y);
        const C_xy = (await z(Buffer.concat([xBuffer, yBuffer]))).length;

        const abresult = (C_xy - Math.min(C_x, C_y)) / Math.max(C_x, C_y);

        map.set(xy, abresult);
        if (i === goal || (i % 100 === 0 && performance.now() - lastPrintTime > 1000 / 30)) {
          lastPrintTime = performance.now();

          const ellapsedTime = performance.now() - startTime;
          const formattedTimeEllapsed = formatMsTime(ellapsedTime);

          const estimatedTimeRemaining = ((goal - i) * ellapsedTime) / i;
          const estimatedTotalTime = ellapsedTime + estimatedTimeRemaining;

          const percent = (i / goal) * 100;

          const erase = "\x1b[1A\x1b[K";
          // Explanation:
          // \x1b[1A: Move cursor up one line
          // \x1b[K: Clear line from cursor to end

          // Erase previous line
          process.stdout.write(
            `${erase.repeat(2)}\n[${fileCount+1}/${entries.length}] ${x} (size: ${xBuffer.length.toLocaleString()})\n  ${i.toLocaleString()} of ${goal.toLocaleString()} (${percent.toFixed(
              4
            )}%) processed (${formattedTimeEllapsed}, time remaining: ${formatMsTime(
              estimatedTimeRemaining
            )}, total time estimate: ${formatMsTime(
              estimatedTotalTime
            )}, time pr. pair: ${formatMsTime(ellapsedTime / i)})`
          );
        }
        i++;
      }
      fileCount++;
    }
    const ellapsedTime = performance.now() - startTime;
    console.log();
    console.log(`Total duration: ${formatMsTime(ellapsedTime)}`);
    console.log(`Time pr. pair: ${formatMsTime(ellapsedTime / i)}`);
    console.log();
    return map;
  })();
  return {
    paths: entries,
    getEntries: () => map.entries(),
    getMap: () => new Map(map),
    getEntry: (a: string, b: string) => map.get(mkKey(a, b)),
    getKeys: () => Array.from(map.keys()),
  };
}

/**
 * WIP
 * @param targetDirectory
 * @param excludeGitignore
 */
export async function* computeStream(
  targetDirectory: string,
  excludeGitignore = true
) {
  for await (const entry of streamDirectoryScanner(targetDirectory)) {

    // Do computation
    yield JSON.stringify({
      absolutePath: entry,
      relativePath: entry,
      size: (await stat(entry)).size,
      children: [],
    }) + "\n";
  }
}
