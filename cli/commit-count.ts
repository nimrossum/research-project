import { katch } from "@/utils/misc";
import { $, ShellError } from "bun";
import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const dir = process.argv[2] || ".";

const subdirs = await $`ls -Ad ${dir}/*/`.text();

const dirs = await Promise.all(
  subdirs.trim().split("\n").map(async (subdir) => {
    const path = resolve(subdir);
    try {
      const [stats] = await katch(stat(path));
      if (!stats?.isDirectory()) {
        return null;
      }
      const [gitStats] = await katch(stat(join(path, ".git")));
      if (!gitStats?.isDirectory()) {
        return { path, error: "no git" };
      }
      const commitCount = Number(
        await $`git -C ${path} rev-list --count HEAD`.text()
      );
      const fileCountResult = await ($`git -C ${path} ls-files | wc -l`.text());
      const fileCount = Number(fileCountResult);
      return {
        path,
        commitCount,
        fileCount,
        repositoryComplexity: commitCount * fileCount,
      };
    } catch (e) {
      // console.error(e);

      if (e instanceof Error) {
        return { path, error: e.message };
      }
      if (e instanceof ShellError) {
        return { path, error: e.stderr.toString() };
      }
    }
  })
);

console.table(
  dirs
    .filter(Boolean)
    .filter((r) => r?.error !== "no git")
    .sort(
      (a, b) => (b?.repositoryComplexity ?? 0) - (a?.repositoryComplexity ?? 0)
    )
);
