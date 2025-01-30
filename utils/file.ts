import type { Dirent } from "fs";
import ignore from "ignore";
import { glob } from "node:fs/promises";
import isBinaryPath from "is-binary-path";

import { join, relative } from "node:path";

export async function* getDirReader(
  dir: string,
  options: { include: string | string[]; exclude: string | string[] }
): AsyncGenerator<Dirent> {
  const { include, exclude } = options;
  const excluder = ignore().add(exclude);
  const includer = ignore().add(include);

  const entries = glob("**/*", {
    cwd: dir,
    withFileTypes: true,
    exclude(dirent) {
      if (dirent.isDirectory()) {
        return false;
      }
      const absolutePath = join(dirent.parentPath, dirent.name);
      const relativePath = relative(dir, absolutePath);
      return excluder.ignores(relativePath);
    },
  });

  for await (const dirent of entries) {
    if (dirent.isDirectory()) {
      continue;
    }

    const absolutePath = join(dirent.parentPath, dirent.name);
    const relativePath = relative(dir, absolutePath);

    if (isBinaryPath(absolutePath)) {
      continue;
    }

    if (!includer.ignores(relativePath)) {
      yield dirent;
    }
  }
}

export const direntToPath = (dirent: Dirent) =>
  join(dirent.parentPath, dirent.name);
