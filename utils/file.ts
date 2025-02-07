import type { Dirent } from "fs";
import ignore from "ignore";
import isBinaryPath from "is-binary-path";

import { join, relative, resolve } from "node:path";
import { Glob } from "bun";
import { readFile, stat } from "node:fs/promises";

const defaultExclude = [
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
];

async function readGitignoreLines(targetDirectory: string): Promise<string[]> {
  try {
    return (await readFile(resolve(targetDirectory, ".gitignore"), "utf-8"))
      .trim()
      .split("\n")
      .filter((x) => x.length > 0)
      .filter((x) => !x.startsWith("#"));
  } catch (error) {
    console.warn(
      "Warning: No .gitignore file found in target directory. Excluding default patterns."
    );
    return defaultExclude;
  }
}

export type DirectoryScannerOptions = {
  /** An array of glob patterns to include (defaults to all files) */
  include?: string[];
  /** An array of glob patterns to exclude (defaults to node_modules, dist, build, bin, obj, out */
  exclude?: string[];
  /** Whether to exclude files that match the .gitignore file */
  excludeFromGitIgnore?: boolean;
};

export async function* streamDirectoryScanner(
  dir: string,
  {
    include = ["**/*.*"],
    exclude = [],
    excludeFromGitIgnore = true,
  }: DirectoryScannerOptions = {}
): AsyncGenerator<string> {
  const excluder = ignore();

  if (exclude) {
    excluder.add(exclude);
  }

  !global.silent &&
    console.log(
      `👉 Scanning ${dir} for files with extensions: ${include}, excluding: ${exclude}`
    );

  if (excludeFromGitIgnore) {
    const gitignoreLines = await readGitignoreLines(dir);
    excluder.add(gitignoreLines);
  }

  const glob = new Glob(Array.isArray(include) ? include.join(",") : include);

  for await (const absolutePath of glob.scan({
    cwd: dir,
    absolute: true,
  })) {
    const relativePath = relative(dir, absolutePath);

    if (excluder.ignores(relativePath)) {
      continue;
    }

    const stats = await stat(absolutePath);

    if (isBinaryPath(absolutePath)) {
      continue;
    }

    if (stats.size > 1024 ** 2) {
      // If file is larger than 1 mB, warn
      !global.silent &&
        console.warn(`Warning: ${relativePath} is larger than 1 mB`);
    }

    yield absolutePath;
  }
}

export const direntToPath = (dirent: Dirent) =>
  join(dirent.parentPath, dirent.name);
