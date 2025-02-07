import type { Dirent } from "fs";
import ignore from "ignore";
import isBinaryPath from "is-binary-path";

import { join, relative } from "node:path";
import { Glob } from "bun";
import { stat } from "node:fs/promises";

export async function* getDirReader(
  dir: string,
  options: { include: string | string[]; exclude: string | string[] }
): AsyncGenerator<string> {
  const { include, exclude } = options;
  const excluder = ignore().add(exclude);

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
