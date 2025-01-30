import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import ignore from "ignore";
import { time } from "./utils/misc.ts";
import { asyncIteratorToArray } from "./utils/iterator.ts";
import { direntToPath } from "./utils/file.ts";
import { calculateNormalizedCompressionDistances } from "./NCD/ncd.ts";
import { getDirReader } from "./utils/file.ts";

async function readGitignoreLines(targetDirectory: string) {
  try {
    return (await readFile(resolve(targetDirectory, ".gitignore"), "utf-8"))
      .trim()
      .split("\n")
      .filter((x) => x.length > 0);
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
  }: { include?: string[]; exclude?: string[]; excludeGitIgnore?: boolean } = {}
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
  console.log(`✅ Found ${length.toLocaleString()} files`);

  return await calculateNormalizedCompressionDistances(
    targetDirectory,
    entries
  );
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
