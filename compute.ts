import { readFile, stat, glob } from "node:fs/promises";
import { join, resolve } from "node:path";
import ignore from "ignore";
import { time } from "./utils/misc.ts";
import { asyncIteratorToArray } from "./utils/iterator.ts";
import { direntToPath } from "./utils/file.ts";
import { calculateNormalizedCompressionRatios } from "./NCR/ncr.ts";
import { getDirReader } from "./utils/file.ts";

const defaultIncludeExtensions = [
  "ts",
  "js",
  "txt",
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

const defaultIncludeGlob = join(
  "**",
  `*.{${defaultIncludeExtensions.join(",")}}`
);

async function readGitignoreLines(targetDirectory: string) {
  return (await readFile(resolve(targetDirectory, ".gitignore"), "utf-8"))
    .trim()
    .split("\n")
    .filter((x) => x.length > 0);
}

/**
 * Compute the normalized compression ratio for all code files
 * (according to the include extensions) in a directory,
 * excluding files that match the patterns in the .gitignore file
 *
 * @param targetDirectory The directory to scan
 * @returns An array of results containing the file path and the NCR
 */
export async function computeNCRForRepositoryFiles(
  targetDirectory: string,
  includeGlobPatterns = defaultIncludeGlob
) {
  console.log(`Scanning for files with extensions: ${defaultIncludeGlob}`);

  const excludeGlobsPatterns = await time(readGitignoreLines)(targetDirectory);

  // Read file tree recursively
  console.log(`Scanning ${targetDirectory} for files`);

  const filterPaths = async (dir: string) =>
    await asyncIteratorToArray(
      getDirReader(dir, {
        include: includeGlobPatterns,
        exclude: excludeGlobsPatterns,
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

  let printProgress = false;
  let progress = 0;

  return await time(calculateNormalizedCompressionRatios)(
    resolvedFiles.map((f) => f.fullPath)
  );
}

export async function* computeStream(
  targetDirectory: string,
  excludeGitisnore = false
) {
  const excludeGlobsPatterns = await readGitignoreLines(targetDirectory);
  const ig = ignore().add(excludeGlobsPatterns);

  for await (const entry of getDirReader(targetDirectory, {
    include: defaultIncludeGlob,
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
