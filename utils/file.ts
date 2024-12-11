import type { Dirent } from "fs";
import ignore from "ignore";
import { glob } from "node:fs/promises";
import { join } from "path/posix";

export function getDirReader(
  dir: string,
  {
    include: includeGlobs,
    exclude: excludeGlobs,
  }: { include: string | string[]; exclude: string | string[] }
) {
  const ig = ignore().add(excludeGlobs);
  return glob(includeGlobs, {
    cwd: dir,
    withFileTypes: true,
    exclude(fileName) {
      return fileName.isDirectory() || ig.ignores(fileName.name);
    },
  });
}
export const direntToPath = (dirent: Dirent) =>
  join(dirent.parentPath, dirent.name);
