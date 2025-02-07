import { readFile } from "fs/promises";
import { compress } from "@/utils/compress.ts";
import assert from "assert";
import { time } from "@/utils/misc.ts";

/**
 * Calculate the normalized compression distance for all files in a directory
 * NCD_A = (_AR_ - _A_) / _R_
 * where _AR_ is the compressed size of the concatenated files
 * _A_ is the compressed size of the file
 * _R_ is the compressed size of the concatenated files without A
 * @param filePath
 * @param filePaths
 */

export async function calculateNormalizedCompressionDistances(
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

  let memoryUsage = 0;
  let fileCount = 0;

  !global.silent && console.log("👉 Reading files into memory");
  !global.silent && console.log();
  !global.silent && console.log();

  // 1. Read all files into memory
  for (const f of filePaths) {
    // 1. For each file, read it into memory
    const AFile = Buffer.from((await readFile(f, "utf-8")).replace(/\s/g, ""));
    const ABuffer = AFile;
    const A = ABuffer.length;
    memoryUsage += A;
    fileCount += 1;
    // Clear previous line
    // process.stdout.write("\x1b[1A\x1b[K");
    // process.stdout.write("\x1b[1A\x1b[K");
    // console.log(f);
    if (A > 1024 ** 2) {
      !global.silent && console.warn(`Warning: ${f} is larger than 1 mB`);
    }
    // console.log(
    //   `Memory usage: ${(
    //     memoryUsage /
    //     1024 ** 2
    //   ).toLocaleString()} mB (${fileCount} files)`
    // );
    ARawMap.set(f, ABuffer);
    // 2. Compress file
    const _A_ = (await compress(ABuffer, "zstd")).length;
    // 3. Store A and _A_ in a map
    AMap.set(f, A);
    _A_Map.set(f, _A_);
  }

  const fileBuffers = Array.from(ARawMap.values());
  // assert(fileBuffers.length === filePaths.length);

  !global.silent && console.log(`👉 Concatenating ${fileBuffers.length} files`);
  const concatenatedBuffer = time(Buffer.concat)(fileBuffers);

  // _AR_ is the size of the all files concatenated
  const AR = concatenatedBuffer.length;

  // _AR_ is the compressed size of the all files concatenated
  !global.silent && console.log(`👉 Compressing ${fileBuffers.length} files`);
  const _AR_ = (await compress(concatenatedBuffer, "zstd")).length;
  !global.silent && console.log(`✅ Compressed size: ${(_AR_ / 1024 ** 2).toLocaleString()} mB`);

  // assert(_AR_ < AR);

  !global.silent && console.log(`👉 Calculating _R_ for each file`);
  !global.silent && console.log();
  let i = 0;
  // 3. For each file A, calculate the compression R for all files except A
  for (const f of filePaths) {
    // Clear previous line
    // process.stdout.write("\x1b[1A\x1b[K");
    // console.log(`Processing file ${i + 1}/${filePaths.length}`);
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
    i++;
  }

  !global.silent && console.log("✅ Done calculating _R_");
  !global.silent && console.log("👉 Calculating NCD for each file");

  // 4. Calculate the normalized compression distance for each file
  const NCD_As = filePaths.map((fp) => {
    const A = AMap.get(fp)!;
    const _A_ = _A_Map.get(fp)!;
    const _R_ = _R_map.get(fp)!;
    const NCD_A = (_AR_ - Math.min(_A_, _R_)) / Math.max(_A_, _R_);
    return {
      file: fp,
      A,
      _A_,
      NCD_A,
      fileCompressionRatio: _A_ / A,
      fractionOfRepo: A / AR,
    };
  });

  !global.silent && console.log("✅ Done calculating NCD for each file");

  return {
    AR,
    _AR_,
    NCD_As,
  };
}
