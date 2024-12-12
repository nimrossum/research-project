import { readFile, stat, glob } from "node:fs/promises";
import { join, resolve } from "node:path";
import ignore from "ignore";
import { time } from "./utils/misc.ts";
import { asyncIteratorToArray } from "./utils/iterator.ts";
import { direntToPath } from "./utils/file.ts";
import { calculateNormalizedCompressionRatios } from "./NCR/ncr.ts";
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
 * @returns An array of results containing the file path and the NCR
 */
export async function computeNCRForRepositoryFiles(
  targetDirectory: string,
  {
    include = ["**/*"],
    exclude = ["node_modules", "dist", "build", "bin", "obj", "out"],
    excludeGitIgnore = true,
  }: { include?: string[]; exclude?: string[]; excludeGitIgnore?: boolean } = {}
) {
  console.log(`Scanning for files with extensions: ${include}`);

  exclude = [
    ...(exclude ?? []),
    ...(excludeGitIgnore
      ? await time(readGitignoreLines)(targetDirectory)
      : []),
  ];

  // Read file tree recursively
  console.log(`Scanning ${targetDirectory} for files`);

  const filterPaths = async (dir: string) =>
    await asyncIteratorToArray(
      getDirReader(dir, {
        include,
        exclude,
      })
    );

  const entries = await time(filterPaths)(targetDirectory);
  const length = entries.length;
  console.log(`Found ${length.toLocaleString()} files`);

  const mapEntriesToAbsolutePaths = (
    targetDirectory: string,
    entries: string[]
  ) =>
    entries.map((relativePath) => ({
      relativePath,
      fullPath: resolve(targetDirectory, relativePath),
    }));

  const resolvedFiles = time(
    mapEntriesToAbsolutePaths // Resolve to full path
  )(targetDirectory, entries.map(direntToPath));

  console.log(
    `Filtered down to ${resolvedFiles.length.toLocaleString()} files`
  );

  return await time(calculateNormalizedCompressionRatios)(
    targetDirectory,
    resolvedFiles.map((f) => f.fullPath)
  );
}

export async function* computeStream(
  targetDirectory: string,
  excludeGitisnore = false,
  includeGlobPatterns = ["**/*"]
) {
  const excludeGlobsPatterns = await readGitignoreLines(targetDirectory);
  const ig = ignore().add(excludeGlobsPatterns);

  for await (const entry of getDirReader(targetDirectory, {
    include: includeGlobPatterns,
    exclude: excludeGlobsPatterns,
  })) {
    if (excludeGitisnore && ig.ignores(direntToPath(entry))) {
      // continue
    }
    const absoluteFilePath = direntToPath(entry);
    yield JSON.stringify({
      absolutePath: absoluteFilePath,
      relativePath: entry,
      size: (await stat(absoluteFilePath)).size,
      children: [],
    }) + "\n";
  }
}
