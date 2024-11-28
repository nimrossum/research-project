import { file, Glob } from "bun";
import { join, resolve } from "node:path";
import ignore from "ignore";
import { time, zipRatio } from "./util";

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

const includeGlob = new Glob(includeGlobPattern);

async function fetchGitignoreEntries(targetDirectory: string) {
  return (await file(join(targetDirectory, ".gitignore")).text())
    .trim()
    .split("\n")
    .filter((x) => x.length > 0);
}

export async function compute(targetDirectory: string) {
  console.log(`Scanning for files with extensions: ${includeGlobPattern}`);

  const excludeGlobsPatterns = await time(fetchGitignoreEntries)(targetDirectory);

  // Read file tree recursively
  console.log(`Scanning ${targetDirectory} for files`);

  const ig = ignore().add(excludeGlobsPatterns);

  const filterPaths = (dir: string) =>
    ig.filter(
      Array.from(time(readDirPaths)(dir))
    );

  const entries = time(filterPaths)(targetDirectory);
  const length = entries.length;
  console.log(`Found ${length.toLocaleString()} files`);

  const mapEntriesToAbsolutePaths = (targetDirectory: string, entries: string[]) =>
    entries.map((relativePath) => ({
      relativePath,
      fullPath: resolve(targetDirectory, relativePath),
    }));

  const resolvedFiles = time(
    mapEntriesToAbsolutePaths // Resolve to full path
  )(targetDirectory, entries);

  console.log(
    `Filtered down to ${resolvedFiles.length.toLocaleString()} files`
  );

  let printProgress = false;
  let progress = 0;

  const calculateCompressionRatios = (resolvedFiles: {
    relativePath: string;
    fullPath: string;
  }[]) => resolvedFiles.map(async (f) => {
    const data = await file(f.fullPath).text();
    if (printProgress) {
      progress++;
      console.clear();
      console.log(`[${progress}/${length}] ${f.relativePath}`);
    }
    const { size, compressedSize, ratio } = zipRatio(Buffer.from(data));
    const { ratio: ratioWithoutWhiteSpace } = zipRatio(
      Buffer.from(data.toString().replace(/\s/g, ""))
    );
    return {
      relativePath: f.relativePath,
      size,
      compressedSize,
      ratio: ratio,
      ratioWithoutWhiteSpace: ratioWithoutWhiteSpace,
    };
  });
  // Read file contents, compress and calculate compression rate
  const results = time(calculateCompressionRatios
  )(resolvedFiles);

  const data = await Promise.all(results).then((results) =>
    results.sort((a, b) => +a.ratio - +b.ratio)
  );

  return data
}

function readDirPaths(dir: string) {
  return includeGlob.scanSync({
    cwd: dir,
    absolute: false,
    onlyFiles: true,
  })
}

export async function* computeStream(targetDirectory: string) {
  const excludeGlobsPatterns = await fetchGitignoreEntries(targetDirectory);
  const ig = ignore().add(excludeGlobsPatterns);

  for (const entry of readDirPaths(targetDirectory)) {
    if (ig.ignores(entry)) {
      // continue
    }
    const absoluteFilePath = resolve(targetDirectory, entry);
    const controller = yield JSON.stringify({
      absolutePath: absoluteFilePath,
      relativePath: entry,
      size: file(absoluteFilePath).size,
      children: []
    }) + "\n";
    controller.flush()
  }
}
