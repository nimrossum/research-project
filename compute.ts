import { readFile, stat, glob } from "node:fs/promises";
import { join, resolve } from "node:path";
import ignore from "ignore";
import {
  asyncIteratorToArray,
  calculateNormalizedCompressionRatios,
  direntToPath,
  time,
  zipRatio
} from "./util.ts";

let includeExtensions = [
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

const includeGlobPattern = join("**", `*.{${includeExtensions.join(",")}}`);

async function readGitignoreLines(targetDirectory: string) {
  return (await readFile(join(targetDirectory, ".gitignore"), "utf-8"))
    .trim()
    .split("\n")
    .filter((x) => x.length > 0);
}

export async function compute(targetDirectory: string) {
  console.log(`Scanning for files with extensions: ${includeGlobPattern}`);

  const excludeGlobsPatterns = await time(readGitignoreLines)(targetDirectory);

  // Read file tree recursively
  console.log(`Scanning ${targetDirectory} for files`);

  const filterPaths = async (dir: string) =>
    await asyncIteratorToArray(getDirReader(dir, excludeGlobsPatterns));

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

  // Read file contents, compress and calculate compression rate
  // const results = time(calculateCompressionRatios)(resolvedFiles);

  // const data = await Promise.all(results).then((results) =>
  //   results.sort((a, b) => +a.ratio - +b.ratio)
  // );

  const results = await time(calculateNormalizedCompressionRatios)(
    resolvedFiles.map((f) => f.fullPath)
  );

  const data = await Promise.all(results).then((results) =>
    results.sort((a, b) => +a.NCR - +b.NCR)
  );

  return data;
}

function getDirReader(dir: string, ignorePatterns: string[]) {
  const ig = ignore().add(ignorePatterns);
  return glob(includeGlobPattern, {
    cwd: dir,
    withFileTypes: true,
    exclude(fileName) {
      return fileName.isDirectory() || ig.ignores(fileName.name);
    },
  });
}

export async function* computeStream(
  targetDirectory: string,
  excludeGitisnore = false
) {
  const excludeGlobsPatterns = await readGitignoreLines(targetDirectory);
  const ig = ignore().add(excludeGlobsPatterns);

  for await (const entry of getDirReader(
    targetDirectory,
    excludeGlobsPatterns
  )) {
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
