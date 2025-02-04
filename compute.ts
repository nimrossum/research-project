import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import ignore from "ignore";
import { formatMsTime, time } from "./utils/misc.ts";
import { asyncIteratorToArray } from "./utils/iterator.ts";
import { direntToPath } from "./utils/file.ts";
import { calculateNormalizedCompressionDistances } from "./NCD/ncd.ts";
import { getDirReader } from "./utils/file.ts";
import { compress } from "./NCD/compress.ts";
import { readFileSync } from "node:fs";

async function readGitignoreLines(targetDirectory: string): Promise<string[]> {
  try {
    return (await readFile(resolve(targetDirectory, ".gitignore"), "utf-8"))
      .trim()
      .split("\n")
      .filter((x) => x.length > 0)
      .filter((x) => !x.startsWith("#"));
  } catch (error) {
    console.warn("Warning: No .gitignore file found in target directory");
    return [];
  }
}

const includeExtensions = [
  "ts",
  "js",
  "json",
  "md",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "cs",
  "java",
  "py",
  "go",
  "rb",
  "php",
  "c",
  "cpp",
  "h",
  "hpp",
  "cshtml",
  "xml",
  "yml",
  "yaml",
  "toml",
  "sh",
  "bat",
  "ps1",
];

const defaultInclude = join("**", `*.{${includeExtensions.join(",")}}`);

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
  {
    include = [defaultInclude],
    exclude = [
      "node_modules",
      "dist",
      "build",
      "bin",
      "obj",
      "out",
      "PackageCache",
      "cache",
      "datasets",
      "data",
      "*.csv",
      "*.sqlite",
      "*.bin",
    ],
    excludeGitIgnore = true,
  }: { include?: string[]; exclude?: string[]; excludeGitIgnore?: boolean }
) {
  exclude = [
    ...(exclude ?? []),
    ...(excludeGitIgnore
      ? await time(readGitignoreLines)(targetDirectory)
      : []),
  ];
  console.log(
    `👉 Scanning ${targetDirectory} for files with extensions: ${include}, excluding: ${exclude}`
  );

  // Read file tree recursively
  const filterPaths = async (dir: string) =>
    await asyncIteratorToArray(
      getDirReader(dir, {
        include,
        exclude,
      })
    );

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
  {
    // include = ["**/*"],
    include = [defaultInclude],
    exclude = [
      "node_modules",
      "dist",
      "build",
      "bin",
      "obj",
      "out",
      "PackageCache",
      "cache",
      "datasets",
      "data",
      "*.csv",
      "*.sqlite",
      "*.bin",
    ],
    excludeGitIgnore = true,
    compressor = "zstd",
  }: {
    include?: string[];
    exclude?: string[];
    excludeGitIgnore?: boolean;
    compressor?: Parameters<typeof compress>[1];
  } = {}
) {
  exclude = [
    ...(exclude ?? []),
    ...(excludeGitIgnore
      ? await time(readGitignoreLines)(targetDirectory)
      : []),
  ];

  !global.silent &&
    console.log(
      `👉 Scanning ${targetDirectory} for files with extensions: ${include}, excluding: ${exclude}`
    );

  // Read file tree recursively
  const filterPaths = async (dir: string) =>
    await asyncIteratorToArray(
      getDirReader(dir, {
        include,
        exclude,
      })
    );

  let entries = await time(filterPaths)(targetDirectory);
  entries.sort();
  const length = entries.length;
  console.log(`✅ Found ${length.toLocaleString()} files`);

  const mkKey = (a: string, b: string) => [a, b].sort().join("|");

  const goal = (length + length * length) / 2;
  const startTime = performance.now();
  let lastPrintTime = 0;
  let i = 0;

  console.log("");
  console.log(`${goal.toLocaleString()} pairs to process`);
  console.log("");

  const z = (data: Buffer) => compress(data, "zstd");

  const map = await time(async () => {
    const fileBuffers = new Map<string, Buffer>();
    const map = new Map<string, number>();

    for (const a of entries) {
      for (const b of entries) {
        const ab = mkKey(a, b);

        if (map.has(ab)) {
          i++;
          continue;
        }

        const files = [a, b].sort();

        const buffers = files.map((f) => {
          const cachedBuffer = fileBuffers.get(f);
          if (cachedBuffer !== undefined) {
            return cachedBuffer!;
          }
          const buffer = readFileSync(f);
          fileBuffers.set(f, buffer);
          return buffer;
        });

        const C_xy = (await z(Buffer.concat(buffers))).length;
        const C_x = (await z(buffers[0]!)).length;
        const C_y = (await z(buffers[1]!)).length;

        const abresult = (C_xy - Math.min(C_x, C_y)) / Math.max(C_x, C_y);

        map.set(ab, abresult);
        i++;
        if (i % 100 === 0 && performance.now() - lastPrintTime > 1000 / 30) {
          lastPrintTime = performance.now();

          const ellapsedTime = performance.now() - startTime;
          const formattedTimeEllapsed = formatMsTime(ellapsedTime);

          const estimatedTimeRemaining = ((goal - i) * ellapsedTime) / i;
          const estimatedTotalTime = ellapsedTime + estimatedTimeRemaining;

          // Erase previous line
          process.stdout.write(
            "\x1b[1A\x1b[K\n" +
              `${i.toLocaleString()} processed (${formattedTimeEllapsed}, time remaining: ${formatMsTime(
                estimatedTimeRemaining
              )}, total time estimate: ${formatMsTime(estimatedTotalTime)})`
          );
        }
      }
    }
    return map;
  })();
  return {
    paths: entries,
    dataMap: map,
  };
}

export async function* computeStream(
  targetDirectory: string,
  excludeGitignore = true,
  includeGlobPatterns = ["**/*"]
) {
  const excludeGlobsPatterns = await readGitignoreLines(targetDirectory);
  const ig = ignore().add(excludeGlobsPatterns);

  for await (const entry of getDirReader(targetDirectory, {
    include: includeGlobPatterns,
    exclude: excludeGlobsPatterns,
  })) {
    if (excludeGitignore && ig.ignores(entry)) {
      continue;
    }

    yield JSON.stringify({
      absolutePath: entry,
      relativePath: entry,
      size: (await stat(entry)).size,
      children: [],
    }) + "\n";
  }
}
