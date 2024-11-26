import { argv, file, Glob } from "bun";
import { join, normalize, relative, resolve } from "node:path";
import ignore from "ignore";

console.log("Hello via Bun!");

const targetDirectory = normalize(argv[2] ?? ".");
// Input: folder

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
console.log(`Scanning for files with extensions: ${includeGlobPattern}`);

const includeGlob = new Glob(includeGlobPattern);

const fetchGitignoreEntries = async () =>
  (await file(join(targetDirectory, ".gitignore")).text())
    .trim()
    .split("\n")
    .filter((x) => x.length > 0);
const excludeGlobsPatterns = await time(fetchGitignoreEntries);

// Read file tree recursively
console.log(`Scanning ${targetDirectory} for files`);

const ig = ignore().add(excludeGlobsPatterns);

const readDir = () =>
  Array.from(
    new Set(
      ig.filter(
        Array.from(
          includeGlob.scanSync({
            cwd: targetDirectory,
            absolute: false,
            onlyFiles: true,
          })
        )
      )
    )
  );

const entries = time(readDir);
const length = entries.length;
console.log(`Found ${length.toLocaleString()} files`);

const mapEntriesToAbsolutePaths = () =>
  entries.map((relativePath) => ({
    relativePath,
    fullPath: resolve(targetDirectory, relativePath),
  }));
const resolvedFiles = time(
  mapEntriesToAbsolutePaths // Resolve to full path
);

console.log(`Filtered down to ${resolvedFiles.length.toLocaleString()} files`);

let printProgress = true;
let progress = 0;

// Read file contents, compress and calculate compression rate
const results = time(() =>
  resolvedFiles.map(async (f) => {
    const data = await file(f.fullPath).text();
    if (printProgress) {
      progress++;
      console.clear();
      console.log(`[${progress}/${length}] ${f.relativePath}`);
    }
    const { size, compressedSize, ratio } = zipRatio(data);
    const { ratio: ratioWithoutWhiteSpace } = zipRatio(
      data.toString().replace(/\s/g, "")
    );
    return {
      relativePath: f.relativePath,
      size,
      compressedSize,
      ratio: ratio,
      ratioWithoutWhiteSpace: ratioWithoutWhiteSpace,
    };
  })
);

// Report back tree with compression rates in terminal
console.table(
  await Promise.all(results).then((results) =>
    results.sort((a, b) => +a.ratio - +b.ratio)
  )
);

function zipRatio(data: Buffer) {
  const size = data.length;
  const compressed = Bun.gzipSync(data);
  const compressedSize = compressed.length;
  return { size, compressedSize, ratio: Math.min(compressedSize / size, 1) };
}

function time<T>(fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`[${fn.name}] ${(end - start).toFixed(2)}ms`);
  return result;
}

const inspect: <T>(d: T) => T = (d) => {
  console.dir(d, { depth: null });
  return d;
};
