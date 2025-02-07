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

export type DirectoryReaderOptions = {
  include: string[];
  exclude: string[];
  excludeFromGitIgnore?: boolean;
};

export async function* getDirReader(
  dir: string,
  options: DirectoryReaderOptions = {
    include: ["**/*.*"],
    exclude: [],
    excludeFromGitIgnore: true,
  }
): AsyncGenerator<string> {
  const { include, exclude, excludeFromGitIgnore: excludeGitIgnore } = options;
  const excluder = ignore().add(exclude);

  !global.silent &&
    console.log(
      `👉 Scanning ${dir} for files with extensions: ${include}, excluding: ${exclude}`
    );

  if (excludeGitIgnore) {
    const gitignoreLines = await readGitignoreLines(dir);
    excluder.add(gitignoreLines);
  }

  const glob = new Glob(Array.isArray(include) ? include.join(",") : include);

  for await (const absolutePath of glob.scan({
    cwd: dir,
    absolute: true,
    onlyFiles: false,
  })) {
    const relativePath = relative(dir, absolutePath);

    if (excluder.ignores(relativePath)) {
      continue;
    }

    const stats = await stat(absolutePath);

    if (stats.isDirectory()) {
      yield* getDirReader(absolutePath, options);
      continue;
    }

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
